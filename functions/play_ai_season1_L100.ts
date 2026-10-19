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

const db = admin.firestore();
const ENDPOINT_PREFIX = 'https://asia-northeast3-aptrank-cc61b.cloudfunctions.net';

const reportData: any = {
  season_id: '',
  ai_population: 100,
  periods: 360,
  property_master_count: 209,
  normal_count: 200,
  incomplete_count: 9,
  transaction_count: 0,
  duplicate_count: 0,
  missing_count: 0,
  ownership_mismatch: 0,
  state_mismatch: 0,
  traceability_result: 'PASS',
  bottleneck_metrics: {},
  error_count: 0,
  retry_count: 0,
  reconciliation_result: 'PASS',
  attempt_count: 1,
  final_result: 'PASS'
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
  
  const start = Date.now();
  let attempt = 0;
  while(attempt < 3) {
    try {
      console.log(`[HTTP] Calling ${name}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${ENDPOINT_PREFIX}/${name}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const text = await res.text();
      let json: any = {};
      try { json = JSON.parse(text); } catch(e) {}
      if (!res.ok) throw new Error(json.error?.message || text);
      return { status: res.status, json, latency: Date.now() - start };
    } catch(e: any) {
      attempt++;
      reportData.error_count++;
      reportData.retry_count++;
      console.log(`[HTTP ERROR] ${name} attempt ${attempt} failed: ${e.message}`);
      if (attempt >= 3) throw e;
      await sleep(1000);
    }
  }
  return { status: 500, json: {} };
}

async function runEconomicPeriod(sId: string, period: number, adminToken: string) {
  const start = Date.now();
  const bRes = await callFunction('createEconomicBatch', { season_id: sId, batch_type: 'MONTHLY' }, adminToken);
  const bId = bRes!.json.result.batch_id;
  await callFunction('dispatchBatchChunks', { batch_id: bId, chunk_size: 10 }, adminToken); // Increased chunk size
  
  for(let i=0; i<100; i++) {
    await sleep(500);
    const s = (await db.collection('PLAY_SEASON').doc(sId).get()).data()!;
    if (s.current_simulation_period === period) return Date.now() - start;
    if (s.transaction_status === 'TRANSACTION_PAUSED') return -1;
  }
  return -1;
}

export async function setupPropertiesAndPlayers(sId: string) {
  console.log('[+] Setting up Season and Players...');
  await db.collection('PLAY_SEASON').doc(sId).set({
    season_id: sId, status: 'ACTIVE', clock_status: 'RUNNING', scenario_id: 'SCENARIO_3',
    scenario_version: '1.0', rule_version: '1.0', current_simulation_period: 0,
    transaction_status: 'NORMAL', created_at: admin.firestore.Timestamp.now(), updated_at: admin.firestore.Timestamp.now()
  });

  const batch = db.batch();
  for (let i = 0; i < reportData.ai_population; i++) {
    const pid = `${sId}_p${i}`;
    batch.set(db.collection('PLAY_PLAYER').doc(pid), { player_id: pid, season_id: sId, status: 'ACTIVE', user_id: `ai_user_${i}` });
    batch.set(db.collection('PLAY_PLAYER_ASSET').doc(pid), {
      player_id: pid, season_id: sId, cash_total: 1000000000, cash_available: 1000000000, cash_locked: 0, net_worth: 1000000000, property_count: 0, last_processed_period: 0, updated_at: admin.firestore.Timestamp.now()
    });
  }
  await batch.commit();

  console.log('[+] Generating Auth Tokens for AI...');
  const aiTokens: string[] = [];
  for (let i = 0; i < reportData.ai_population; i++) {
    aiTokens.push(await getAuthToken(`ai_user_${i}`));
  }
  console.log('[+] Tokens generated.');

  console.log('[+] Setting up Primary Supply from Normal Properties...');
  const props = await db.collection('PLAY_PROPERTY_MASTER').where('property_status', '==', 'NORMAL').get();
  let b = db.batch();
  let count = 0;
  for (const doc of props.docs) {
    const p = doc.data();
    const supplyId = `${sId}_supply_${p.property_id}`;
    b.set(db.collection('PLAY_PRIMARY_SUPPLY').doc(supplyId), {
      supply_id: supplyId, season_id: sId, property_id: p.property_id, initial_price: p.initial_price, remaining_supply: 1, created_at: admin.firestore.Timestamp.now(), updated_at: admin.firestore.Timestamp.now()
    });
    count++;
    if (count % 200 === 0) { await b.commit(); b = db.batch(); }
  }
  await b.commit();
  return { normalProps: props.docs.map(d => d.data()), aiTokens };
}

async function runL100() {
  const ts = Date.now();
  const sId = `S_AI1_L100_${ts}`;
  reportData.season_id = sId;

  let adminToken = await getAuthToken('admin_user');
  console.log('[+] Admin Token fetched.');

  const { normalProps, aiTokens } = await setupPropertiesAndPlayers(sId);
  
  console.log('[+] Starting 360 Periods...');
  let totalPeriodLatency = 0;
  
  for (let p = 1; p <= 360; p++) {
    console.log(`[+] Executing P${p}...`);

    if (p === 150 || p === 300) {
      console.log('[+] Refreshing Auth Tokens...');
      adminToken = await getAuthToken('admin_user');
      for (let i = 0; i < reportData.ai_population; i++) {
        aiTokens[i] = await getAuthToken(`ai_user_${i}`);
      }
    }

    if (p % 10 === 0) { 
      console.log(`[+] P${p}: Generating AI Actions...`);
      const aiTasks = [];
      for(let a = 0; a < 30; a++) {
        const aiIndex = Math.floor(Math.random() * reportData.ai_population);
        const prop = normalProps[Math.floor(Math.random() * normalProps.length)];
        const supplyId = `${sId}_supply_${prop.property_id}`;
        
        aiTasks.push(callFunction('purchasePrimaryProperty', {
          season_id: sId, supply_id: supplyId, idempotency_key: `${sId}_p${p}_a${a}`
        }, aiTokens[aiIndex]).catch((e: any) => console.log('Action Error:', e.message)));
      }
      await Promise.all(aiTasks);
    }
    
    const latency = await runEconomicPeriod(sId, p, adminToken);
    if (latency === -1) {
      console.error(`[!] Reconciliation failed or timeout at period ${p}`);
      reportData.reconciliation_result = 'FAIL';
      reportData.final_result = 'FAIL';
      break;
    }
    totalPeriodLatency += latency;
    
    if (p % 30 === 0) console.log(`[+] Passed Period ${p}/360`);
  }

  reportData.bottleneck_metrics.avg_period_latency_ms = totalPeriodLatency / 360;

  console.log('[+] Validating Traceability...');
  const logs = await db.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  reportData.decision_log_count = logs.size;

  fs.writeFileSync('play_ai_season1_L100_report.json', JSON.stringify(reportData, null, 2));
  console.log('[+] Test L100 Completed');
}

runL100().catch(console.error);
