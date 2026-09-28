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

async function setupSeason(sId: string, players: number = 1) {
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
  for (let i = 1; i <= players; i++) {
    const pid = `${sId}_p${i}`;
    batch.set(dbAdmin.collection('PLAY_PLAYER').doc(pid), {
      player_id: pid, season_id: sId, status: 'ACTIVE'
    });
    batch.set(dbAdmin.collection('PLAY_PLAYER_ASSET').doc(pid), {
      player_id: pid, season_id: sId, cash_total: 1000, cash_available: 1000, net_worth: 1000, cash_locked: 0,
      last_processed_period: 0
    });
  }
  await batch.commit();
}

async function runF3_06_F3_07_Real(dispatchToken: string) {
  const sId = `S_F30607_${Date.now()}`;
  await setupSeason(sId, 1);
  
  console.log(`\n[F3-06 & F3-07] Creating economic batch...`);
  const createRes = await callFunction('createEconomicBatch', { season_id: sId, batch_type: 'MONTHLY' }, dispatchToken);
  const bId = createRes.batch_id;
  
  console.log(`[F3-06 & F3-07] Triggering 3 concurrent dispatchBatchChunks calls to force duplicate cloud tasks...`);
  const promises = [];
  for (let i = 0; i < 3; i++) {
    promises.push(
      callFunction('dispatchBatchChunks', { batch_id: bId, chunk_size: 100 }, dispatchToken).catch(e => console.error(e))
    );
  }
  await Promise.all(promises);

  console.log(`[F3-06 & F3-07] Dispatched. Now waiting up to 60s for Cloud Tasks to resolve duplicates...`);
  for (let i = 0; i < 60; i++) {
    const s = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
    if (s.current_simulation_period >= 2) {
      break;
    }
    await sleep(1000);
  }
  
  // Wait extra 15s to ensure no P -> P+2 happens from slow duplicates
  console.log(`[F3-06 & F3-07] Clock reached 2. Waiting 15s to verify it doesn't reach 3 (P -> P+2)...`);
  await sleep(15000);

  const season = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
  const batchDoc = (await dbAdmin.collection('PLAY_BATCH').doc(bId).get()).data()!;
  
  await assert(batchDoc.status === 'COMPLETED', `Expected batch status COMPLETED, got ${batchDoc.status}`);
  await assert(season.current_simulation_period === 2, `Expected clock = 2, got ${season.current_simulation_period}`);
  await assert(season.transaction_status === 'NORMAL', `Expected NORMAL, got ${season.transaction_status}`);
  
  console.log(`[PASS] Clock advanced exactly once. P -> P+1 successfully verified despite forced duplicate dispatcher!`);
  
  console.log(`\n========================================`);
  console.log(`[+] F3-06 / F3-07 Real Idempotency Verification Completed Successfully.`);
  console.log(`Target Season ID: ${sId}`);
  console.log(`Target Batch ID: ${bId}`);
  console.log(`========================================\n`);
  
  // Print commands to get execution IDs
  console.log(`To get execution IDs, run:`);
  console.log(`gcloud logging read "resource.labels.function_name=aggregateBatch AND textPayload:\"${bId}\"" --limit=20`);
  console.log(`gcloud logging read "resource.labels.function_name=advanceSeasonClock" --limit=20`);
}

async function main() {
  try {
    const dispatchToken = await getAuthToken('admin_user');
    await runF3_06_F3_07_Real(dispatchToken);
  } catch (e) {
    console.error(`[FATAL ERROR]`, e);
    process.exit(1);
  }
}

main();
