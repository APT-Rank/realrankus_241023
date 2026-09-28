import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
const fetch = require('node-fetch');
const { execSync } = require('child_process');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'sa-key.json');
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'aptrank-cc61b'
  });
}

const dbAdmin = admin.firestore();
const ENDPOINT_PREFIX = 'https://asia-northeast3-aptrank-cc61b.cloudfunctions.net';

const reportData: any = {
  golden: {},
  replay: {},
  audit: {},
  incident: {}
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getAuthToken(uid: string) {
  const output = execSync('npx firebase-tools apps:sdkconfig WEB --project aptrank-cc61b --json').toString();
  const config = JSON.parse(output.substring(output.indexOf('{'), output.lastIndexOf('}') + 1));
  const apiKey = config.result.sdkConfig.apiKey;
  
  const customToken = await admin.auth().createCustomToken(uid);
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  const data = await res.json();
  return data.idToken;
}

async function callFunction(name: string, data: any, token: string = '') {
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${ENDPOINT_PREFIX}/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data })
  });
  const text = await res.text();
  console.log(`[HTTP] ${name} -> Status: ${res.status}`);
  let json: any = {};
  try { json = JSON.parse(text); } catch(e) {}
  if (!res.ok) throw new Error(json.error?.message || text);
  return { status: res.status, json };
}

async function setupScenario(sId: string) {
  await dbAdmin.collection('PLAY_SEASON').doc(sId).set({
    season_id: sId, status: 'ACTIVE', clock_status: 'RUNNING', scenario_id: 'SCENARIO_3',
    scenario_version: '1.0', rule_version: '1.0', current_simulation_period: 0,
    transaction_status: 'NORMAL', created_at: admin.firestore.Timestamp.now(), updated_at: admin.firestore.Timestamp.now()
  });
  
  const pid = `${sId}_p1`;
  await dbAdmin.collection('PLAY_PLAYER').doc(pid).set({ player_id: pid, season_id: sId, status: 'ACTIVE', user_id: 'admin_user' });
  await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(pid).set({
    player_id: pid, season_id: sId, cash_total: 100000000, cash_available: 100000000, cash_locked: 0, net_worth: 100000000, property_count: 0, last_processed_period: 0, updated_at: admin.firestore.Timestamp.now()
  });

  const supplyId = `${sId}_supply1`;
  await dbAdmin.collection('PLAY_PRIMARY_SUPPLY').doc(supplyId).set({
    supply_id: supplyId, season_id: sId, property_id: 'PROP_1', initial_price: 10000000, remaining_supply: 1, created_at: admin.firestore.Timestamp.now(), updated_at: admin.firestore.Timestamp.now()
  });
}

async function runEconomicPeriod(sId: string, period: number, adminToken: string) {
  const bRes = await callFunction('createEconomicBatch', { season_id: sId, batch_type: 'MONTHLY' }, adminToken);
  const bId = bRes.json.result.batch_id;
  await callFunction('dispatchBatchChunks', { batch_id: bId, chunk_size: 1 }, adminToken);
  
  for(let i=0; i<30; i++) {
    await sleep(2000);
    const s = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
    if (s.current_simulation_period === period) return true;
    if (s.transaction_status === 'TRANSACTION_PAUSED') return false;
  }
  return false;
}

async function getPlayerState(pid: string) {
  return (await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(pid).get()).data();
}

async function runTest() {
  const adminToken = await getAuthToken('admin_user');
  console.log('[+] Token fetched.');

  // =====================================
  // STEP 1 & 2: Golden Scenario + Replay
  const ts = Date.now();
  for (const baseId of ['S_GOLDEN', 'S_REPLAY']) {
    const sId = `${baseId}_${ts}`;
    console.log(`\n[+] Running ${sId}...`);
    await setupScenario(sId);
    
    // 1. Advance to P1
    const p1Ok = await runEconomicPeriod(sId, 1, adminToken);
    if (!p1Ok) throw new Error(`${sId} failed to advance to P1`);
    
    // 2. Property BUY in P1
    const pid = `${sId}_p1`;
    const supplyId = `${sId}_supply1`;
    const idempotencyKey = `${sId}_buy_1`;
    
    const assetBefore = await getPlayerState(pid);
    
    await callFunction('purchasePrimaryProperty', {
      season_id: sId, supply_id: supplyId, idempotency_key: idempotencyKey
    }, adminToken);

    const assetAfter = await getPlayerState(pid);
    
    // 3. Advance to P2 (Reconciliation test)
    const p2Ok = await runEconomicPeriod(sId, 2, adminToken);
    if (!p2Ok) throw new Error(`${sId} failed to advance to P2`);

    const assetFinal = await getPlayerState(pid);
    const dlSnap = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();

    reportData[baseId === 'S_GOLDEN' ? 'golden' : 'replay'] = {
      season_id: sId,
      player_id: pid,
      assetBefore,
      assetAfterPurchase: assetAfter,
      assetFinal,
      decisionLogCount: dlSnap.size
    };
  }

  // Compare Replay
  const g = reportData.golden;
  const r = reportData.replay;
  const match = (
    g.assetFinal.cash_total === r.assetFinal.cash_total &&
    g.decisionLogCount === r.decisionLogCount
  );
  console.log(`\n[+] Replay match: ${match}`);
  reportData.replay.match = match;

  // =====================================
  // STEP 3: Audit Trail Drill
  // =====================================
  const sGolden = `S_GOLDEN_${ts}`;
  console.log(`\n[+] Audit Trail Drill on ${sGolden}...`);
  const logs = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sGolden).get();
  reportData.audit.logs = logs.docs.map(d => d.data());

  // =====================================
  // STEP 5: Incident Reproduction
  // =====================================
  const sInc = `S_INCIDENT_${ts}`;
  console.log(`\n[+] Running Incident Reproduction (${sInc})...`);
  await setupScenario(sInc);
  const incPid = `${sInc}_p1`;
  
  await runEconomicPeriod(sInc, 1, adminToken);
  const s0 = (await dbAdmin.collection('PLAY_SEASON').doc(sInc).get()).data();
  const a0 = await getPlayerState(incPid);
  
  // Inject fault
  await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(incPid).update({ cash_total: 999999999 });
  
  const s1 = (await dbAdmin.collection('PLAY_SEASON').doc(sInc).get()).data();
  const a1 = await getPlayerState(incPid);

  // Trigger P2 which should fail reconciliation
  const paused = !(await runEconomicPeriod(sInc, 2, adminToken));
  
  const s2 = (await dbAdmin.collection('PLAY_SEASON').doc(sInc).get()).data();
  const a2 = await getPlayerState(incPid);

  reportData.incident = {
    paused,
    snapshot_before: { season: s0, asset: a0 },
    snapshot_fault: { season: s1, asset: a1 },
    snapshot_after: { season: s2, asset: a2 }
  };

  fs.writeFileSync('play_07_4_report.json', JSON.stringify(reportData, null, 2));
  console.log('\n[+] DONE. Test completed.');
}

runTest().catch(console.error);
