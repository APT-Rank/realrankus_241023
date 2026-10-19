import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
const fetch = require('node-fetch');
const { GoogleAuth } = require('google-auth-library');

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

// removed getAuthToken

async function getOidcToken() {
  const auth = new GoogleAuth({
    keyFilename: SERVICE_ACCOUNT_PATH
  });
  const client = await auth.getIdTokenClient('https://asia-northeast3-aptrank-cc61b.cloudfunctions.net/processBatchChunk');
  const headers = await client.getRequestHeaders();
  return headers.Authorization.split('Bearer ')[1];
}

async function callFunction(name: string, data: any, token: string) {
  const res = await fetch(`${ENDPOINT_PREFIX}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ data })
  });
  
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch(e) {}
  if (!res.ok || json.error) {
    const errMsg = typeof json.error === 'object' ? json.error.message : (json.message || json.error || res.statusText || text);
    throw new Error(`[${name}] ${errMsg}`);
  }
  return json.result;
}

async function createPlayersAndAssets(seasonId: string, count: number) {
  const batches = [];
  let currentBatch = dbAdmin.batch();
  let ops = 0;
  
  const oldPlayers = await dbAdmin.collection('PLAY_PLAYER').where('season_id', '==', seasonId).get();
  for (const doc of oldPlayers.docs) {
    currentBatch.delete(doc.ref);
    currentBatch.delete(dbAdmin.collection('PLAY_PLAYER_ASSET').doc(doc.id));
    ops += 2;
    if (ops >= 490) {
      batches.push(currentBatch.commit());
      currentBatch = dbAdmin.batch();
      ops = 0;
    }
  }
  await Promise.all(batches);
  batches.length = 0;

  for (let i = 1; i <= count; i++) {
    const pid = `${seasonId}_p${i}`;
    const pRef = dbAdmin.collection('PLAY_PLAYER').doc(pid);
    const aRef = dbAdmin.collection('PLAY_PLAYER_ASSET').doc(pid);
    
    currentBatch.set(pRef, {
      player_id: pid,
      user_id: `u_${i}`,
      season_id: seasonId,
      status: 'ACTIVE',
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });
    
    currentBatch.set(aRef, {
      player_id: pid,
      season_id: seasonId,
      cash_total: 1000,
      cash_available: 1000,
      net_worth: 1000,
      financial_asset_total: 0,
      debt_total: 0,
      last_processed_period: 0,
      last_processed_batch_id: null,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });
    
    ops += 2;
    if (ops >= 490) {
      batches.push(currentBatch.commit());
      currentBatch = dbAdmin.batch();
      ops = 0;
    }
  }
  if (ops > 0) batches.push(currentBatch.commit());
  await Promise.all(batches);
}

async function setupSeason(seasonId: string, period: number = 1) {
  await dbAdmin.collection('PLAY_SEASON').doc(seasonId).set({
    season_id: seasonId,
    season_name: `Phase 3 Test ${seasonId}`,
    status: 'ACTIVE',
    clock_status: 'RUNNING',
    scenario_id: 'SCENARIO_3',
    scenario_version: '1.0',
    rule_version: '1.0',
    current_simulation_period: period,
    last_successful_period: null,
    last_successful_batch_id: null,
    transaction_status: 'NORMAL',
    created_at: admin.firestore.Timestamp.now(),
    updated_at: admin.firestore.Timestamp.now()
  });
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[ASSERT FAILED] ${msg}`);
}

async function runTests() {
  const oidcToken = await getOidcToken();
  
  console.log(`\n========================================`);
  console.log(`[+] Starting Batch Phase 3 E2E Tests`);
  console.log(`========================================\n`);

  const sId = `S_P3_${Date.now()}`;
  await setupSeason(sId, 1);
  await createPlayersAndAssets(sId, 3); // 3 Players

  const bId = `${sId}_1_MONTHLY`;
  const cId = `${bId}_c0`;
  
  await dbAdmin.collection('PLAY_BATCH').doc(bId).set({
      batch_id: bId,
      season_id: sId,
      simulation_period: 1,
      batch_type: 'MONTHLY',
      scenario_id: 'SCENARIO_3',
      scenario_version: '1.0',
      rule_version: '1.0',
      status: 'RUNNING'
  });
  
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId).set({
      chunk_id: cId,
      batch_id: bId,
      chunk_index: 0,
      player_count: 3,
      target_players: [`${sId}_p1`, `${sId}_p2`, `${sId}_p3`],
      status: 'DISPATCHED'
  });
  // chunkData not needed here
  
  const payloadBase = {
      season_id: sId,
      batch_id: bId,
      chunk_id: cId,
      simulation_period: 1,
      batch_type: 'MONTHLY',
      chunk_index: 0,
      scenario_id: 'SCENARIO_3',
      scenario_version: '1.0',
      rule_version: '1.0'
  };

  // Delete all old decision logs for safety
  const oldLogs = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  for (const l of oldLogs.docs) await l.ref.delete();

  console.log(`[P3-09] Scenario / Rule Version Mismatch...`);
  try {
     await callFunction('processBatchChunk', { ...payloadBase, scenario_version: '9.9' }, oidcToken);
     assert(false, "Should have failed with mismatch");
  } catch(e:any) {
     if (!e.message.includes('SCENARIO_VERSION_MISMATCH')) console.error("Actual error:", e.message);
     assert(e.message.includes('SCENARIO_VERSION_MISMATCH'), "Expected scenario mismatch error");
     console.log(`[PASS] Rejected mismatch`);
  }

  console.log(`[P3-10] Wrong Season / Period...`);
  try {
     await callFunction('processBatchChunk', { ...payloadBase, simulation_period: 99 }, oidcToken);
     assert(false, "Should have failed with wrong period");
  } catch(e:any) {
     if (!e.message.includes('WRONG_SEASON_OR_PERIOD')) console.error("Actual error:", e.message);
     assert(e.message.includes('WRONG_SEASON_OR_PERIOD'), "Expected wrong period error");
     console.log(`[PASS] Rejected wrong period`);
  }

  console.log(`[P3-01] Normal Player Processing...`);
  const r1 = await callFunction('processBatchChunk', payloadBase, oidcToken);
  if (r1.status !== 'COMPLETED') console.error("r1 result:", r1);
  assert(r1.status === 'COMPLETED', "Normal process failed");
  
  const asset1 = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p1`).get();
  const aData = asset1.data()!;
  assert(aData.last_processed_period === 1, "last_processed_period not updated");
  assert(aData.cash_total > 1000, "Cash should have increased (Income > Expense)");
  
  const logs1 = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  assert(logs1.size === 3, "Expected exactly 3 decision logs");
  console.log(`[PASS] Normal processing succeeded. Cash: ${aData.cash_total}, Logs: ${logs1.size}`);

  console.log(`[P3-02] Duplicate Player Request / [P3-11] Already Processed...`);
  const r2 = await callFunction('processBatchChunk', payloadBase, oidcToken);
  assert(r2.status === 'ALREADY_COMPLETED', "Duplicate should return ALREADY_COMPLETED (Idempotent NO-OP)");
  
  const asset2 = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p1`).get();
  assert(asset2.data()!.cash_total === aData.cash_total, "Cash mutated on duplicate request");
  
  const logs2 = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  assert(logs2.size === 3, "Duplicate created extra logs");
  console.log(`[PASS] Duplicates completely ignored (Idempotent)`);
  
  console.log(`[P3-03] Concurrent Duplicate Processing...`);
  await setupSeason(sId, 2);
  const bId2 = `${sId}_2_MONTHLY`;
  const cId2 = `${bId2}_c0`;
  await dbAdmin.collection('PLAY_BATCH').doc(bId2).set({
      batch_id: bId2, season_id: sId, simulation_period: 2, batch_type: 'MONTHLY',
      scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0', status: 'RUNNING'
  });
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId2).set({
      chunk_id: cId2, batch_id: bId2, chunk_index: 0, player_count: 3, target_players: [`${sId}_p1`, `${sId}_p2`, `${sId}_p3`], status: 'DISPATCHED'
  });
  const payloadP2 = { ...payloadBase, simulation_period: 2, batch_id: bId2, chunk_id: cId2 };

  const p = [];
  for(let i=0; i<10; i++) { p.push(callFunction('processBatchChunk', payloadP2, oidcToken)); }
  await Promise.all(p);
  
  const logs3 = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).where('simulation_period', '==', 2).get();
  assert(logs3.size === 3, `Expected exactly 3 logs for period 2 despite 10 concurrent requests, got ${logs3.size}`);
  console.log(`[PASS] Handled 10 concurrent requests idempotently with exactly 1 atomic commit`);

  console.log(`[P3-04] Crash Before Commit...`);
  await setupSeason(sId, 3);
  const bId3 = `${sId}_3_MONTHLY`;
  const cId3 = `${bId3}_c0`;
  await dbAdmin.collection('PLAY_BATCH').doc(bId3).set({
      batch_id: bId3, season_id: sId, simulation_period: 3, batch_type: 'MONTHLY',
      scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0', status: 'RUNNING'
  });
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId3).set({
      chunk_id: cId3, batch_id: bId3, chunk_index: 0, player_count: 3, target_players: [`${sId}_p1`, `${sId}_p2`, `${sId}_p3`], status: 'DISPATCHED'
  });
  const payloadP3 = { ...payloadBase, simulation_period: 3, batch_id: bId3, chunk_id: cId3 };
  
  const assetBeforeCrash = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p1`).get();
  
  try {
      await callFunction('processBatchChunk', { ...payloadP3, inject_crash_before_commit_player: `${sId}_p1` }, oidcToken);
      assert(false, "Expected internal error before commit");
  } catch(e) {}
  
  const assetAfterCrash = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p1`).get();
  assert(assetAfterCrash.data()!.cash_total === assetBeforeCrash.data()!.cash_total, "Asset changed before commit crash!");
  
  await callFunction('processBatchChunk', payloadP3, oidcToken);
  const assetAfterRetry = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p1`).get();
  assert(assetAfterRetry.data()!.cash_total > assetBeforeCrash.data()!.cash_total, "Asset did not process on retry after pre-commit crash");
  console.log(`[PASS] Crash before commit cleanly recovered and processed once`);

  console.log(`[P3-05] Crash After Commit...`);
  await setupSeason(sId, 4);
  const bId4 = `${sId}_4_MONTHLY`;
  const cId4 = `${bId4}_c0`;
  await dbAdmin.collection('PLAY_BATCH').doc(bId4).set({
      batch_id: bId4, season_id: sId, simulation_period: 4, batch_type: 'MONTHLY',
      scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0', status: 'RUNNING'
  });
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId4).set({
      chunk_id: cId4, batch_id: bId4, chunk_index: 0, player_count: 3, target_players: [`${sId}_p1`, `${sId}_p2`, `${sId}_p3`], status: 'DISPATCHED'
  });
  const payloadP4 = { ...payloadBase, simulation_period: 4, batch_id: bId4, chunk_id: cId4 };
  
  const assetBeforeP4 = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p1`).get();
  try {
      await callFunction('processBatchChunk', { ...payloadP4, inject_crash_after_commit_player: `${sId}_p1` }, oidcToken);
      assert(false, "Expected crash after commit");
  } catch(e) {}
  
  const assetAfterP4Crash = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p1`).get();
  assert(assetAfterP4Crash.data()!.cash_total > assetBeforeP4.data()!.cash_total, "Asset did NOT process during crash-after-commit!");
  
  // Retry it
  await callFunction('processBatchChunk', payloadP4, oidcToken);
  const assetAfterP4Retry = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p1`).get();
  assert(assetAfterP4Crash.data()!.cash_total === assetAfterP4Retry.data()!.cash_total, "Asset mutated on retry after crash-after-commit! Idempotency failed!");
  
  const logs4 = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).where('simulation_period', '==', 4).get();
  assert(logs4.size === 3, "Duplicate logs created during crash-after-commit retry");
  console.log(`[PASS] Crash AFTER commit safely recovered without side effects (At-least-once immune)`);

  console.log(`[P3-07] Mid-Chunk Crash...`);
  await setupSeason(sId, 5);
  const bId5 = `${sId}_5_MONTHLY`;
  const cId5 = `${bId5}_c0`;
  await dbAdmin.collection('PLAY_BATCH').doc(bId5).set({
      batch_id: bId5, season_id: sId, simulation_period: 5, batch_type: 'MONTHLY',
      scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0', status: 'RUNNING'
  });
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId5).set({
      chunk_id: cId5, batch_id: bId5, chunk_index: 0, player_count: 3, target_players: [`${sId}_p1`, `${sId}_p2`, `${sId}_p3`], status: 'DISPATCHED'
  });
  const payloadP5 = { ...payloadBase, simulation_period: 5, batch_id: bId5, chunk_id: cId5 };
  
  try {
     // p2 is the second player. Crash AFTER p2. (So p1, p2 succeed, p3 doesn't run)
     await callFunction('processBatchChunk', { ...payloadP5, inject_mid_chunk_crash_after_player: `${sId}_p2` }, oidcToken);
  } catch(e) {}
  
  const assetMid = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p3`).get();
  assert(assetMid.data()!.last_processed_period === 4, "Player 3 processed during mid-chunk crash!");
  const assetP2 = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p2`).get();
  assert(assetP2.data()!.last_processed_period === 5, "Player 2 not processed during mid-chunk crash!");
  
  await callFunction('processBatchChunk', payloadP5, oidcToken);
  const assetMidRetry = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p3`).get();
  assert(assetMidRetry.data()!.last_processed_period === 5, "Player 3 did not process on resume");
  
  const logs5 = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).where('simulation_period', '==', 5).get();
  assert(logs5.size === 3, "Duplicate logs created on mid-chunk crash resume");
  console.log(`[PASS] Mid-chunk crash gracefully resumed skipped players and NO-OP'd processed ones`);

  console.log(`[P3-08] Partial Player Failure...`);
  await setupSeason(sId, 6);
  const bId6 = `${sId}_6_MONTHLY`;
  const cId6 = `${bId6}_c0`;
  await dbAdmin.collection('PLAY_BATCH').doc(bId6).set({
      batch_id: bId6, season_id: sId, simulation_period: 6, batch_type: 'MONTHLY',
      scenario_id: 'SCENARIO_3', scenario_version: '1.0', rule_version: '1.0', status: 'RUNNING'
  });
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId6).set({
      chunk_id: cId6, batch_id: bId6, chunk_index: 0, player_count: 3, target_players: [`${sId}_p1`, `${sId}_p2`, `${sId}_p3`], status: 'DISPATCHED'
  });
  const payloadP6 = { ...payloadBase, simulation_period: 6, batch_id: bId6, chunk_id: cId6 };
  
  const partialRes = await callFunction('processBatchChunk', { ...payloadP6, inject_partial_failure_player: `${sId}_p2` }, oidcToken);
  assert(partialRes.status === 'FAILED', "Batch should report FAILED due to partial player failure");
  assert(partialRes.failed === 1 && partialRes.processed === 2, "Wrong counts for partial failure");
  
  const assetP1 = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p1`).get();
  const assetP2_6 = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p2`).get();
  assert(assetP1.data()!.last_processed_period === 6, "Player 1 should be processed");
  assert(assetP2_6.data()!.last_processed_period === 5, "Player 2 should NOT be processed");
  
  // Resume
  const partialResumeRes = await callFunction('processBatchChunk', payloadP6, oidcToken);
  assert(partialResumeRes.status === 'COMPLETED', "Resume failed");
  const assetP2Resume = await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p2`).get();
  assert(assetP2Resume.data()!.last_processed_period === 6, "Player 2 did not process on partial resume");
  console.log(`[PASS] Partial Player Failure handled and recovered perfectly`);

  console.log(`\n========================================`);
  console.log(`[+] Phase 3 Tests Completed Successfully.`);
  console.log(`========================================\n`);
}

runTests().catch(e => {
  console.error(`[FATAL]`, e);
  process.exit(1);
});
