import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
const fetch = require('node-fetch');
import { execSync } from 'child_process';

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

async function callFunction(name: string, data: any, token: string) {
  const res = await fetch(`${ENDPOINT_PREFIX}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ data })
  });
  
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`[${name}] ${json.error?.message || res.statusText}`);
  }
  return json.result;
}

async function createPlayers(seasonId: string, count: number) {
  const batches = [];
  let currentBatch = dbAdmin.batch();
  let ops = 0;
  
  // Cleanup old players for this season
  const oldPlayers = await dbAdmin.collection('PLAY_PLAYER').where('season_id', '==', seasonId).get();
  for (const doc of oldPlayers.docs) {
    currentBatch.delete(doc.ref);
    ops++;
    if (ops >= 490) {
      batches.push(currentBatch.commit());
      currentBatch = dbAdmin.batch();
      ops = 0;
    }
  }

  for (let i = 1; i <= count; i++) {
    const docRef = dbAdmin.collection('PLAY_PLAYER').doc(`${seasonId}_p${i}`);
    currentBatch.set(docRef, {
      player_id: `${seasonId}_p${i}`,
      user_id: `u_${i}`,
      season_id: seasonId,
      status: 'ACTIVE',
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });
    ops++;
    if (ops >= 490) {
      batches.push(currentBatch.commit());
      currentBatch = dbAdmin.batch();
      ops = 0;
    }
  }
  if (ops > 0) batches.push(currentBatch.commit());
  await Promise.all(batches);
}

async function setupSeason(seasonId: string) {
  await dbAdmin.collection('PLAY_SEASON').doc(seasonId).set({
    season_id: seasonId,
    season_name: `Phase 2 Test ${seasonId}`,
    status: 'ACTIVE',
    clock_status: 'RUNNING',
    scenario_id: 'SCENARIO_2',
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

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[ASSERT FAILED] ${msg}`);
}

async function verifyBoundary(playerCount: number, expectedChunks: number, token: string) {
  const seasonId = `S_BOUND_${playerCount}_${Date.now()}`;
  await setupSeason(seasonId);
  await createPlayers(seasonId, playerCount);
  
  const bRes = await callFunction('createEconomicBatch', { season_id: seasonId, batch_type: 'MONTHLY' }, token);
  const batchId = bRes.batch_id;
  
  const batchDoc = await dbAdmin.collection('PLAY_BATCH').doc(batchId).get();
  const batchData = batchDoc.data()!;
  
  assert(batchData.expected_player_count === playerCount, `Boundary ${playerCount}: expected_player_count mismatch`);
  assert(batchData.chunk_count === expectedChunks, `Boundary ${playerCount}: chunk_count mismatch`);
  
  // Actually dispatch only if chunk_count > 0, to not fail if we dispatch 0 chunks 
  // (unless dispatcher gracefully handles 0)
  const dispatchRes = await callFunction('dispatchBatchChunks', { batch_id: batchId, chunk_size: 100 }, token);
  assert(dispatchRes.status === 'SUCCESS', `Boundary ${playerCount}: Dispatch failed`);
  assert(dispatchRes.dispatched_chunks === expectedChunks, `Boundary ${playerCount}: dispatched_chunks mismatch`);
  
  // Verify chunks
  const chunks = await dbAdmin.collection('PLAY_BATCH_CHUNKS').where('batch_id', '==', batchId).get();
  assert(chunks.size === expectedChunks, `Boundary ${playerCount}: Actual chunk docs mismatch`);
  
  let totalPlayersInChunks = 0;
  chunks.forEach(c => totalPlayersInChunks += c.data().player_count);
  assert(totalPlayersInChunks === playerCount, `Boundary ${playerCount}: total players in chunks mismatch`);
  
  console.log(`[PASS] Boundary ${playerCount} -> Chunks: ${expectedChunks}`);
}

async function runTests() {
  const adminUid = 'admin_user';
  const adminToken = await getAuthToken(adminUid);
  
  console.log(`\n========================================`);
  console.log(`[+] Starting Batch Phase 2 E2E`);
  console.log(`========================================\n`);

  console.log(`[F02-C] Testing Boundary Conditions...`);
  await verifyBoundary(0, 0, adminToken);
  await verifyBoundary(1, 1, adminToken);
  await verifyBoundary(99, 1, adminToken);
  await verifyBoundary(100, 1, adminToken);
  await verifyBoundary(101, 2, adminToken);
  await verifyBoundary(199, 2, adminToken);
  await verifyBoundary(200, 2, adminToken);
  await verifyBoundary(201, 3, adminToken);
  await verifyBoundary(1000, 10, adminToken);

  const seasonId = `S_P2_MAIN_${Date.now()}`;
  await setupSeason(seasonId);
  await createPlayers(seasonId, 150);

  console.log(`\n[F02-F] Phase 1 Regression & Initial Batch Creation...`);
  const bRes = await callFunction('createEconomicBatch', { season_id: seasonId, batch_type: 'MONTHLY' }, adminToken);
  const batchId = bRes.batch_id;
  console.log(`[PASS] Batch successfully created: ${batchId}`);

  console.log(`\n[F02-B] Full Chunk Dispatch...`);
  const dRes = await callFunction('dispatchBatchChunks', { batch_id: batchId, chunk_size: 100 }, adminToken);
  assert(dRes.status === 'SUCCESS', `Dispatch failed`);
  
  const chunks = await dbAdmin.collection('PLAY_BATCH_CHUNKS').where('batch_id', '==', batchId).get();
  assert(chunks.size === 2, `Expected 2 chunks, got ${chunks.size}`);
  
  let totalInChunks = 0;
  chunks.forEach(c => totalInChunks += c.data().player_count);
  assert(totalInChunks === 150, `Player sum mismatch`);
  console.log(`[PASS] 150 Players cleanly divided into 2 chunks`);

  console.log(`\n[F02-D] Duplicate Task Delivery Payload Inspection...`);
  const chunk0 = chunks.docs.find(d => d.id === `${batchId}_c0`)!.data();
  assert(chunk0.task_name !== '', `Task name empty`);
  assert(chunk0.task_name.includes(`${batchId}_c0_dispatch`), `Deterministic task name mismatch`);
  console.log(`[PASS] Task name is deterministic: ${chunk0.task_name}`);

  console.log(`\n[F02-A] Duplicate Dispatch (Idempotency)...`);
  const dupRes = await callFunction('dispatchBatchChunks', { batch_id: batchId, chunk_size: 100 }, adminToken);
  assert(dupRes.status === 'SUCCESS', `Duplicate dispatch should succeed idempotently`);
  
  const dupChunks = await dbAdmin.collection('PLAY_BATCH_CHUNKS').where('batch_id', '==', batchId).get();
  assert(dupChunks.size === 2, `Duplicate dispatch created extra chunks! Expected 2, got ${dupChunks.size}`);
  console.log(`[PASS] Prevented duplicate dispatch successfully (Idempotent success)`);

  console.log(`\n[F02-E] Dispatch Mid-Failure (Resume Dispatch)...`);
  const seasonFailId = `S_FAIL_${Date.now()}`;
  await setupSeason(seasonFailId);
  await createPlayers(seasonFailId, 350); // 4 chunks (100, 100, 100, 50)
  
  const fBatchRes = await callFunction('createEconomicBatch', { season_id: seasonFailId, batch_type: 'MONTHLY' }, adminToken);
  const fBatchId = fBatchRes.batch_id;
  
  // Actually inject a crash during chunk 2 dispatch
  try {
    await callFunction('dispatchBatchChunks', { batch_id: fBatchId, chunk_size: 100, inject_crash_after_chunk: 2 }, adminToken);
    assert(false, `Expected hard crash injected after chunk 2!`);
  } catch (e: any) {
    assert(e.message.includes('INJECTED_CRASH_AFTER_CHUNK_2'), `Wrong crash message: ${e.message}`);
    console.log(`[PASS] Hard crash successfully injected inside function execution`);
  }

  // Check Batch status -> Should NOT be RUNNING
  const failBatchDoc = await dbAdmin.collection('PLAY_BATCH').doc(fBatchId).get();
  const failStatus = failBatchDoc.data()?.status;
  assert(failStatus !== 'RUNNING', `Batch status should NOT be RUNNING after mid-crash, got: ${failStatus}`);
  console.log(`[PASS] Batch properly stayed in ${failStatus} (Not RUNNING) after crash`);

  const preChunks = await dbAdmin.collection('PLAY_BATCH_CHUNKS').where('batch_id', '==', fBatchId).get();
  assert(preChunks.size === 4, `All 4 chunks should exist in DB even if task dispatch failed midway`);

  // Now run dispatch again to resume
  await callFunction('dispatchBatchChunks', { batch_id: fBatchId, chunk_size: 100 }, adminToken);
  
  const fChunks = await dbAdmin.collection('PLAY_BATCH_CHUNKS').where('batch_id', '==', fBatchId).get();
  assert(fChunks.size === 4, `Mid-failure recovery failed to keep exactly 4 chunks`);
  
  let dispatchedCount = 0;
  fChunks.forEach(c => {
    if (c.data().status === 'DISPATCHED') dispatchedCount++;
  });
  assert(dispatchedCount === 4, `Not all chunks transitioned to DISPATCHED upon recovery`);
  
  const recoveredBatch = await dbAdmin.collection('PLAY_BATCH').doc(fBatchId).get();
  assert(recoveredBatch.data()?.status === 'RUNNING', `Batch status failed to transition to RUNNING upon full recovery`);
  
  console.log(`[PASS] Mid-failure gracefully resumed and created missing chunks without destroying existing ones`);

  console.log(`\n========================================`);
  console.log(`[+] Phase 2 Tests Completed Successfully.`);
  console.log(`========================================\n`);
}

runTests().catch(e => {
  console.error(`[FATAL]`, e);
  process.exit(1);
});
