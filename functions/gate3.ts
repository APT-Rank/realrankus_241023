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
// F3-01 / F3-02
// ---------------------------------------------------------
async function runF3_01_and_F3_02(dispatchToken: string) {
  const processToken = await getOidcToken('processBatchChunk');
  
  const sId = `S_F302_${Date.now()}`;
  await setupSeason(sId, 1);
  const bId = `${sId}_1_MONTHLY`;
  
  await dbAdmin.collection('PLAY_BATCH').doc(bId).set({
    batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0',
    status: 'DISPATCHING', expected_player_count: 1, chunk_count: 1
  });
  const cId = `${bId}_c0`;
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId).set({
    chunk_id: cId, batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    chunk_index: 0, status: 'DISPATCHED', attempt_count: 0, player_count: 1, target_players: [`${sId}_p1`]
  });

  console.log(`\n[F3-02 Concurrent Worker] Triggering 5 concurrent processBatchChunk requests...`);
  
  const promises = [];
  for (let i=0; i<5; i++) {
    promises.push(
      callFunction('processBatchChunk', {
        season_id: sId, batch_id: bId, chunk_id: cId, simulation_period: 1, batch_type: 'MONTHLY',
        scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0'
      }, processToken).catch(e => e)
    );
  }
  
  await Promise.all(promises);

  const logs = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  await assert(logs.size === 1, `Expected exactly 1 Decision Log, got ${logs.size}`);
  
  console.log(`[PASS] F3-01 & F3-02: Exactly 1 decision log despite 5 concurrent tasks.`);
}

// ---------------------------------------------------------
// F3-03 Crash Before Commit
// ---------------------------------------------------------
async function runF3_03(dispatchToken: string) {
  const processToken = await getOidcToken('processBatchChunk');
  const sId = `S_F303_${Date.now()}`;
  const pid = `${sId}_p1`;
  await setupSeason(sId, 1);
  const bId = `${sId}_1_MONTHLY`;
  const cId = `${bId}_c0`;

  await dbAdmin.collection('PLAY_BATCH').doc(bId).set({
    batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0',
    status: 'DISPATCHING', expected_player_count: 1, chunk_count: 1
  });
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId).set({
    chunk_id: cId, batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    chunk_index: 0, status: 'DISPATCHED', attempt_count: 0, player_count: 1, target_players: [pid]
  });

  console.log(`\n[F3-03 Crash Before Commit] Injecting crash...`);
  await callFunction('processBatchChunk', {
    season_id: sId, batch_id: bId, chunk_id: cId, simulation_period: 1, batch_type: 'MONTHLY',
    scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0',
    inject_crash_before_commit_player: pid
  }, processToken).catch(e => {});

  let logs = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  await assert(logs.size === 0, `Expected 0 logs after crash, got ${logs.size}`);

  console.log(`[F3-03] Retrying without crash...`);
  await callFunction('processBatchChunk', {
    season_id: sId, batch_id: bId, chunk_id: cId, simulation_period: 1, batch_type: 'MONTHLY',
    scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0'
  }, processToken);

  logs = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  await assert(logs.size === 1, `Expected exactly 1 log after retry, got ${logs.size}`);
  console.log(`[PASS] F3-03: Processed exactly once after Crash Before Commit.`);
}

// ---------------------------------------------------------
// F3-04 Crash After Commit
// ---------------------------------------------------------
async function runF3_04(dispatchToken: string) {
  const processToken = await getOidcToken('processBatchChunk');
  const sId = `S_F304_${Date.now()}`;
  const pid = `${sId}_p1`;
  await setupSeason(sId, 1);
  const bId = `${sId}_1_MONTHLY`;
  const cId = `${bId}_c0`;

  await dbAdmin.collection('PLAY_BATCH').doc(bId).set({
    batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0',
    status: 'DISPATCHING', expected_player_count: 1, chunk_count: 1
  });
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId).set({
    chunk_id: cId, batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    chunk_index: 0, status: 'DISPATCHED', attempt_count: 0, player_count: 1, target_players: [pid]
  });

  console.log(`\n[F3-04 Crash After Commit] Injecting crash after commit...`);
  await callFunction('processBatchChunk', {
    season_id: sId, batch_id: bId, chunk_id: cId, simulation_period: 1, batch_type: 'MONTHLY',
    scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0',
    inject_crash_after_commit_player: pid
  }, processToken).catch(e => {});

  let logs = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  await assert(logs.size === 1, `Expected 1 log even though function crashed, got ${logs.size}`);

  console.log(`[F3-04] Retrying (duplicate prevention)...`);
  await callFunction('processBatchChunk', {
    season_id: sId, batch_id: bId, chunk_id: cId, simulation_period: 1, batch_type: 'MONTHLY',
    scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0'
  }, processToken);

  logs = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  await assert(logs.size === 1, `Expected still exactly 1 log, got ${logs.size}`);
  console.log(`[PASS] F3-04: Idempotency blocked duplicate after Crash After Commit.`);
}

// ---------------------------------------------------------
// F3-05 Mid-Chunk Crash
// ---------------------------------------------------------
async function runF3_05(dispatchToken: string) {
  const processToken = await getOidcToken('processBatchChunk');
  const sId = `S_F305_${Date.now()}`;
  await setupSeason(sId, 100);
  const bId = `${sId}_1_MONTHLY`;
  const cId = `${bId}_c0`;

  await dbAdmin.collection('PLAY_BATCH').doc(bId).set({
    batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0',
    status: 'DISPATCHING', expected_player_count: 100, chunk_count: 1
  });
  
  const targetPlayers = [];
  for(let i=1; i<=100; i++) targetPlayers.push(`${sId}_p${i}`);

  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId).set({
    chunk_id: cId, batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    chunk_index: 0, status: 'DISPATCHED', attempt_count: 0, player_count: 100, target_players: targetPlayers
  });

  const crashPid = `${sId}_p50`;
  console.log(`\n[F3-05 Mid-Chunk Crash] Injecting crash after p50...`);
  await callFunction('processBatchChunk', {
    season_id: sId, batch_id: bId, chunk_id: cId, simulation_period: 1, batch_type: 'MONTHLY',
    scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0',
    inject_mid_chunk_crash_after_player: crashPid
  }, processToken).catch(e => {});

  let logs = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  await assert(logs.size === 50, `Expected 50 logs mid-chunk crash, got ${logs.size}`);

  console.log(`[F3-05] Retrying full chunk...`);
  await callFunction('processBatchChunk', {
    season_id: sId, batch_id: bId, chunk_id: cId, simulation_period: 1, batch_type: 'MONTHLY',
    scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0'
  }, processToken);

  logs = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  await assert(logs.size === 100, `Expected exactly 100 logs after retry, got ${logs.size}`);
  console.log(`[PASS] F3-05: Exactly 100 logs. No duplications for p1~p50.`);
}

// ---------------------------------------------------------
// F3-06 Aggregator Duplicate
// ---------------------------------------------------------
async function runF3_06(dispatchToken: string) {
  const aggToken = await getOidcToken('aggregateBatch');
  const sId = `S_F306_${Date.now()}`;
  await setupSeason(sId, 1);
  const bId = `${sId}_1_MONTHLY`;

  await dbAdmin.collection('PLAY_BATCH').doc(bId).set({
    batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0',
    status: 'RUNNING', expected_player_count: 1, chunk_count: 1
  });
  
  const cId = `${bId}_c0`;
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId).set({
    chunk_id: cId, batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    chunk_index: 0, status: 'COMPLETED', attempt_count: 1, player_count: 1, processed_count: 1
  });

  console.log(`\n[F3-06 Aggregator Duplicate] Triggering 3 concurrent aggregateBatch calls...`);
  
  const promises = [];
  for (let i=0; i<3; i++) {
    promises.push(
      callFunction('aggregateBatch', { batch_id: bId, attempt: 1 }, aggToken).catch(e => e)
    );
  }
  
  await Promise.all(promises);
  await sleep(10000); // Wait for reconciliation and clock task

  const season = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
  await assert(season.current_simulation_period === 2, `Expected clock = 2, got ${season.current_simulation_period}`);
  
  console.log(`[PASS] F3-06: Clock advanced exactly once despite 3 concurrent aggregators.`);
}

// ---------------------------------------------------------
// F3-07 Clock Duplicate
// ---------------------------------------------------------
async function runF3_07(dispatchToken: string) {
  const clockToken = await getOidcToken('advanceSeasonClock');
  const sId = `S_F307_${Date.now()}`;
  await setupSeason(sId, 1);

  console.log(`\n[F3-07 Clock Duplicate] Triggering 3 concurrent advanceSeasonClock calls...`);
  
  const promises = [];
  for (let i=0; i<3; i++) {
    promises.push(
      callFunction('advanceSeasonClock', { season_id: sId, batch_id: `${sId}_1_MONTHLY` }, clockToken).catch(e => e)
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
  const aggToken = await getOidcToken('aggregateBatch');
  const sId = `S_F308_${Date.now()}`;
  await setupSeason(sId, 1);
  const bId = `${sId}_1_MONTHLY`;

  // Inject invalid cash state in player to trigger reconciliation failure
  await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p1`).update({
    cash_total: 100, cash_available: 50, cash_locked: 0 // 100 != 50 + 0 -> FAIL
  });

  await dbAdmin.collection('PLAY_BATCH').doc(bId).set({
    batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0',
    status: 'RUNNING', expected_player_count: 1, chunk_count: 1
  });
  
  const cId = `${bId}_c0`;
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId).set({
    chunk_id: cId, batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    chunk_index: 0, status: 'COMPLETED', attempt_count: 1, player_count: 1, processed_count: 1
  });

  console.log(`\n[F3-08 Reconciliation Failure] Running aggregateBatch which triggers runReconciliation...`);
  
  await callFunction('aggregateBatch', { batch_id: bId, attempt: 1 }, aggToken);
  
  await sleep(10000); // Wait for reconciliation task to fail

  const season = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
  await assert(season.transaction_status === 'TRANSACTION_PAUSED', `Expected PAUSED, got ${season.transaction_status}`);
  await assert(season.current_simulation_period === 1, `Expected clock to remain 1, got ${season.current_simulation_period}`);
  
  console.log(`[PASS] F3-08: Reconciliation properly failed and paused the system without advancing clock.`);
}

async function main() {
  try {
    const dispatchToken = await getAuthToken('admin_user');
    await runF3_01_and_F3_02(dispatchToken);
    await runF3_03(dispatchToken);
    await runF3_04(dispatchToken);
    await runF3_05(dispatchToken);
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
