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

async function getApiKey() {
  const output = execSync('npx firebase-tools apps:sdkconfig WEB --project aptrank-cc61b --json').toString();
  const config = JSON.parse(output.substring(output.indexOf('{'), output.lastIndexOf('}') + 1));
  return config.result.sdkConfig.apiKey;
}

async function getAuthToken(uid: string) {
  const customToken = await admin.auth().createCustomToken(uid);
  const apiKey = await getApiKey();
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  const data = await res.json();
  return data.idToken;
}

async function callFunction(name: string, data: any, token: string) {
  const res = await fetch(`${ENDPOINT_PREFIX}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ data })
  });
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch(e) {}
  if (!res.ok || json.error) throw new Error(`[${name}] ${json.error?.message || text}`);
  return json.result;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[ASSERT FAILED] ${msg}`);
}

async function setupSeason150(sId: string) {
  await dbAdmin.collection('PLAY_SEASON').doc(sId).set({
    season_id: sId,
    status: 'ACTIVE',
    clock_status: 'RUNNING',
    scenario_id: 'SCENARIO_3',
    scenario_version: '1.0',
    rule_version: '1.0',
    current_simulation_period: 1,
    last_successful_period: null,
    last_successful_batch_id: null,
    transaction_status: 'NORMAL',
    created_at: admin.firestore.Timestamp.now(),
    updated_at: admin.firestore.Timestamp.now()
  });

  const batch = dbAdmin.batch();
  let ops = 0;
  for (let i = 1; i <= 150; i++) {
    const pid = `${sId}_p${i}`;
    batch.set(dbAdmin.collection('PLAY_PLAYER').doc(pid), {
      player_id: pid, season_id: sId, status: 'ACTIVE'
    });
    batch.set(dbAdmin.collection('PLAY_PLAYER_ASSET').doc(pid), {
      player_id: pid, season_id: sId, cash_total: 1000, cash_available: 1000, net_worth: 1000, cash_locked: 0,
      last_processed_period: 0
    });
    ops += 2;
  }
  await batch.commit();
}

async function runPeriod(sId: string, expectedPeriod: number, dispatchToken: string) {
  console.log(`\n--- Running Period ${expectedPeriod} ---`);
  const createRes = await callFunction('createEconomicBatch', { season_id: sId, batch_type: 'MONTHLY' }, dispatchToken);
  const bId = createRes.batch_id;
  console.log(`    Batch Created: ${bId}`);

  await callFunction('dispatchBatchChunks', { batch_id: bId, chunk_size: 100 }, dispatchToken);
  console.log(`    Dispatched chunks for ${bId}. Waiting up to 45s...`);

  let clockAdvanced = false;
  for (let i = 0; i < 45; i++) {
     const season = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
     if (season.current_simulation_period === expectedPeriod + 1) {
        clockAdvanced = true;
        break;
     }
     await sleep(1000);
  }
  
  await assert(clockAdvanced, `Season Clock did not advance from ${expectedPeriod} to ${expectedPeriod + 1}`);
  
  const finalBatch = (await dbAdmin.collection('PLAY_BATCH').doc(bId).get()).data()!;
  await assert(finalBatch.status === 'COMPLETED', `Batch ${bId} is not COMPLETED`);
  
  const chunksSnap = await dbAdmin.collection('PLAY_BATCH_CHUNKS').where('batch_id', '==', bId).get();
  await assert(chunksSnap.size === 2, `Expected 2 chunks for period ${expectedPeriod}, got ${chunksSnap.size}`);
  let processedPlayers = 0;
  for (const doc of chunksSnap.docs) {
    const c = doc.data();
    await assert(c.status === 'COMPLETED', `Chunk ${doc.id} is not COMPLETED`);
    processedPlayers += (c.processed_count || 0);
  }
  await assert(processedPlayers === 150, `Expected 150 processed players, got ${processedPlayers}`);
  
  const decLogs = await dbAdmin.collection('PLAY_DECISION_LOG')
    .where('season_id', '==', sId)
    .where('simulation_period', '==', expectedPeriod).get();
  await assert(decLogs.size === 150, `Expected 150 decision logs for period ${expectedPeriod}, got ${decLogs.size}`);
  
  console.log(`    Period ${expectedPeriod} passed successfully.`);
}

async function runGate2() {
  const dispatchToken = await getAuthToken('admin_user');
  
  console.log(`\n========================================`);
  console.log(`[GATE 2] 3-Period Continuity`);
  console.log(`========================================`);

  const sId = `S_G2_${Date.now()}`;
  console.log(`[1] Creating Season ${sId} with 150 players...`);
  await setupSeason150(sId);

  // Run period 1
  await runPeriod(sId, 1, dispatchToken);
  
  // Run period 2
  await runPeriod(sId, 2, dispatchToken);
  
  // Run period 3
  await runPeriod(sId, 3, dispatchToken);
  
  // Verify final clock is 4
  const seasonFinal = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
  await assert(seasonFinal.current_simulation_period === 4, `Expected clock to be 4, got ${seasonFinal.current_simulation_period}`);
  
  console.log(`\n========================================`);
  console.log(`[+] GATE 2 Completed Successfully.`);
  console.log(`========================================\n`);
}

async function main() {
  try {
    await runGate2();
  } catch (e) {
    console.error(`[FATAL ERROR]`, e);
    process.exit(1);
  }
}

main();
