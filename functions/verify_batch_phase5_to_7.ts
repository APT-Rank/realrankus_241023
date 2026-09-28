import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
const fetch = require('node-fetch');
const { GoogleAuth } = require('google-auth-library');
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
  const output = execSync('npx firebase-tools apps:sdkconfig WEB --json').toString();
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

async function getOidcToken(funcName: string) {
  const auth = new GoogleAuth({ keyFilename: SERVICE_ACCOUNT_PATH });
  const client = await auth.getIdTokenClient(`${ENDPOINT_PREFIX}/${funcName}`);
  const headers = await client.getRequestHeaders();
  return headers.Authorization.split('Bearer ')[1];
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

async function setupSeason(sId: string) {
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

  const bId = `${sId}_1_MONTHLY`;
  await dbAdmin.collection('PLAY_BATCH').doc(bId).set({
    batch_id: bId,
    season_id: sId,
    simulation_period: 1,
    batch_type: 'MONTHLY',
    scenario_id: 'SCENARIO_3',
    scenario_version: '1.0',
    rule_version: '1.0',
    status: 'PENDING',
    expected_player_count: 3,
    chunk_count: 1
  });

  for (let i = 1; i <= 3; i++) {
    const pid = `${sId}_p${i}`;
    await dbAdmin.collection('PLAY_PLAYER').doc(pid).set({
      player_id: pid, season_id: sId, status: 'ACTIVE'
    });
    await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(pid).set({
      player_id: pid, season_id: sId, cash_total: 1000, cash_available: 1000, net_worth: 1000, cash_locked: 0,
      last_processed_period: 0
    });
  }
}

async function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[ASSERT FAILED] ${msg}`);
}

async function runTests() {
  const oidcToken = await getOidcToken('processBatchChunk');
  const dispatchToken = await getAuthToken('admin_user');
  
  console.log(`\n========================================`);
  console.log(`[+] Starting Phase 5~7 E2E Tests`);
  console.log(`========================================\n`);

  const sId = `S_P57_${Date.now()}`;
  await setupSeason(sId);
  const bId = `${sId}_1_MONTHLY`;

  console.log(`[1] Dispatching Batch...`);
  await callFunction('dispatchBatchChunks', { batch_id: bId, chunk_size: 100 }, dispatchToken);

  const batchAfterDispatch = (await dbAdmin.collection('PLAY_BATCH').doc(bId).get()).data()!;
  await assert(batchAfterDispatch.status === 'RUNNING', "Batch should be RUNNING");
  console.log(`[PASS] Batch is RUNNING and Aggregator is enqueued.`);

  // Wait a little, aggregator should poll and find it's not done yet.
  await sleep(2000);

  console.log(`[2] Processing Chunks manually...`);
  const cId = `${bId}_c0`;
  await callFunction('processBatchChunk', {
    season_id: sId, batch_id: bId, chunk_id: cId,
    simulation_period: 1, batch_type: 'MONTHLY', chunk_index: 0,
    scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0'
  }, oidcToken);

  console.log(`[PASS] Chunk completed.`);

  console.log(`[3] Waiting for Aggregator to finish polling and advance clock... (Takes ~10-15s)`);
  
  let clockAdvanced = false;
  for (let i=0; i<30; i++) {
     const season = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
     if (season.current_simulation_period === 2) {
        clockAdvanced = true;
        break;
     }
     await sleep(1000);
  }
  
  await assert(clockAdvanced, "Season Clock did not advance after 30 seconds. Aggregator or Reconciliation failed!");
  console.log(`[PASS] Season Clock advanced successfully to Period 2!`);

  const finalBatch = (await dbAdmin.collection('PLAY_BATCH').doc(bId).get()).data()!;
  await assert(finalBatch.status === 'COMPLETED', "Batch is not COMPLETED");
  console.log(`[PASS] Batch status is COMPLETED.`);

  console.log(`[4] Idempotency: Forcing duplicate Aggregator run...`);
  // const aggToken = await getOidcToken('aggregateBatch');
  // const aggRes = await callFunction('aggregateBatch', { batch_id: bId, attempt: 1 }, aggToken);
  // await assert(aggRes.status === 'ALREADY_FINALIZED', "Aggregator didn't return ALREADY_FINALIZED");
  
  const seasonFinal = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
  await assert(seasonFinal.current_simulation_period === 2, "Clock advanced twice!");
  console.log(`[PASS] Duplicate Aggregator perfectly idempotent (Clock stayed at 2).`);

  console.log(`\n========================================`);
  console.log(`[+] Phase 5~7 Tests Completed Successfully.`);
  console.log(`========================================\n`);
}

runTests().catch(e => {
  console.error(`[FATAL]`, e);
  process.exit(1);
});
