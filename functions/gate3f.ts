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

async function setupSeason(sId: string, players: number = 0) {
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
}

async function runF3_07_Real(dispatchToken: string) {
  const sId = `S_F307_${Date.now()}`;
  await setupSeason(sId, 0); // 0 players!
  
  console.log(`\n[F3-07] Creating economic batch with 0 players...`);
  const createRes = await callFunction('createEconomicBatch', { season_id: sId, batch_type: 'MONTHLY' }, dispatchToken);
  const bId = createRes.batch_id;
  
  console.log(`[F3-07] Triggering 5 concurrent dispatchBatchChunks calls...`);
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      callFunction('dispatchBatchChunks', { batch_id: bId, chunk_size: 100 }, dispatchToken).catch(e => console.error(e))
    );
  }
  await Promise.all(promises);

  console.log(`[F3-07] Waiting up to 60s for massive duplicate collision to reach Clock...`);
  for (let i = 0; i < 60; i++) {
    const s = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
    if (s.current_simulation_period >= 2) {
      break;
    }
    await sleep(1000);
  }
  
  console.log(`[F3-07] Clock reached 2. Waiting 15s to verify no P -> P+2...`);
  await sleep(15000);

  const season = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
  
  await assert(season.current_simulation_period === 2, `Expected clock = 2, got ${season.current_simulation_period}`);
  await assert(season.transaction_status === 'NORMAL', `Expected NORMAL, got ${season.transaction_status}`);
  
  console.log(`[PASS] Clock advanced EXACTLY ONCE (P -> P+1) despite massive duplicate attempt!`);
}

async function main() {
  try {
    const dispatchToken = await getAuthToken('admin_user');
    await runF3_07_Real(dispatchToken);
  } catch (e) {
    console.error(`[FATAL ERROR]`, e);
    process.exit(1);
  }
}

main();
