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

// ---------------------------------------------------------
// F3-06 Aggregator Duplicate
// ---------------------------------------------------------
async function runF3_06(dispatchToken: string) {
  const aggToken = await getOidcToken('aggregateBatch');
  const sId = `S_F306_${Date.now()}`;
  await setupSeason(sId, 1);
  
  const createRes = await callFunction('createEconomicBatch', { season_id: sId, batch_type: 'MONTHLY' }, dispatchToken);
  const bId = createRes.batch_id;
  await callFunction('dispatchBatchChunks', { batch_id: bId, chunk_size: 100 }, dispatchToken);

  console.log(`\n[F3-06 Aggregator Duplicate] Triggering 3 concurrent aggregateBatch calls on a running batch...`);
  const promises = [];
  for (let i=0; i<3; i++) {
    promises.push(
      callFunction('aggregateBatch', { batch_id: bId, attempt: 1 }, aggToken).catch(e => e)
    );
  }
  await Promise.all(promises);

  console.log(`[F3-06] Waiting up to 30s for the real aggregator to complete processing...`);
  let advanced = false;
  for(let i=0; i<30; i++) {
    const s = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
    if (s.current_simulation_period === 2) {
      advanced = true;
      break;
    }
    await sleep(1000);
  }
  
  const season = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
  await assert(advanced, `Expected clock = 2, got ${season.current_simulation_period}. It may have failed reconciliation or aggregator was overwritten badly.`);
  await assert(season.current_simulation_period === 2, `Expected clock = 2, got ${season.current_simulation_period}`);
  
  console.log(`[PASS] F3-06: Clock advanced exactly once despite 3 concurrent aggregator tasks.`);
}

// ---------------------------------------------------------
// F3-07 Clock Duplicate
// ---------------------------------------------------------
async function runF3_07(dispatchToken: string) {
  const clockToken = await getOidcToken('advanceSeasonClock');
  const sId = `S_F307_${Date.now()}`;
  await setupSeason(sId, 1);
  
  // We mock a batch that is COMPLETED, because advanceSeasonClock will update it to FINALIZED.
  const bId = `${sId}_1_MONTHLY`;
  await dbAdmin.collection('PLAY_BATCH').doc(bId).set({
    batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    status: 'COMPLETED'
  });

  console.log(`\n[F3-07 Clock Duplicate] Triggering 3 concurrent advanceSeasonClock calls...`);
  
  const promises = [];
  for (let i=0; i<3; i++) {
    promises.push(
      callFunction('advanceSeasonClock', { season_id: sId, batch_id: bId }, clockToken).catch(e => e)
    );
  }
  
  await Promise.all(promises);
  
  const season = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
  await assert(season.current_simulation_period === 2, `Expected clock = 2, got ${season.current_simulation_period}`);
  
  console.log(`[PASS] F3-07: Clock advanced exactly once (P1 -> P2).`);
}

// ---------------------------------------------------------
// F3-08 Reconciliation Failure
// ---------------------------------------------------------
async function runF3_08(dispatchToken: string) {
  const sId = `S_F308_${Date.now()}`;
  await setupSeason(sId, 1);

  // We run a real batch, but we inject a failure in the player state BEFORE aggregateBatch finishes
  // Oh wait, if we run a real batch, it will overwrite the player state to be correct!
  // So we run a real batch, wait for chunks to finish, THEN break the player state, THEN aggregateBatch runs!
  // Actually, just let it run. Then immediately break the player state while it is running. The chunks might finish before we break it.
  
  console.log(`\n[F3-08 Reconciliation Failure] Creating batch...`);
  const createRes = await callFunction('createEconomicBatch', { season_id: sId, batch_type: 'MONTHLY' }, dispatchToken);
  const bId = createRes.batch_id;
  await callFunction('dispatchBatchChunks', { batch_id: bId, chunk_size: 100 }, dispatchToken);

  console.log(`[F3-08] Waiting for chunk to complete...`);
  let chunkCompleted = false;
  for(let i=0; i<30; i++) {
    const snaps = await dbAdmin.collection('PLAY_BATCH_CHUNKS').where('batch_id', '==', bId).get();
    if (snaps.size > 0 && snaps.docs[0].data().status === 'COMPLETED') {
      chunkCompleted = true; break;
    }
    await sleep(1000);
  }
  await assert(chunkCompleted, 'Chunk did not complete');
  
  console.log(`[F3-08] Chunk completed. Breaking player cash state to trigger reconciliation failure...`);
  await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p1`).update({
    cash_total: 100, cash_available: 50, cash_locked: 0 // Invalid! 100 != 50 + 0
  });

  console.log(`[F3-08] Waiting for aggregator and reconciliation to run (up to 15s)...`);
  await sleep(15000);

  const season = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
  
  await assert(season.transaction_status === 'TRANSACTION_PAUSED', `Expected PAUSED, got ${season.transaction_status}`);
  await assert(season.current_simulation_period === 1, `Expected clock to remain 1, got ${season.current_simulation_period}`);
  
  console.log(`[PASS] F3-08: Reconciliation properly failed and paused the system without advancing clock.`);
}

async function main() {
  try {
    const dispatchToken = await getAuthToken('admin_user');
    await runF3_06(dispatchToken);
    await runF3_07(dispatchToken);
    await runF3_08(dispatchToken);
    
    console.log(`\n========================================`);
    console.log(`[+] GATE 3 Completed Successfully.`);
    console.log(`========================================\n`);
  } catch (e) {
    console.error(`[FATAL ERROR]`, e);
    process.exit(1);
  }
}

main();
