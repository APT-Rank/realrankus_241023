import * as admin from 'firebase-admin';
import { calculateEconomicState, getEconomicPhase } from './src/play/batch/economicEngine';
const fetch = require('node-fetch');
const { GoogleAuth } = require('google-auth-library');

process.env.FIRESTORE_EMULATOR_HOST = '';
const serviceAccount = require('./sa-key.json');
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount),
  projectId: 'aptrank-cc61b' 
});
const db = admin.firestore();

const REGION = 'asia-northeast3';
const PROJECT = 'aptrank-cc61b';
const BASE_URL = `https://${REGION}-${PROJECT}.cloudfunctions.net`;

async function runTests() {
  console.log(`\n========================================`);
  console.log(`[+] Starting PLAY-07.1 Verification Tests`);
  
  // T04, T05, T06: Economic Engine Unit Tests
  console.log(`\n[+] Verifying Economic Engine Determinism (T04, T05, T06)`);
  let state = calculateEconomicState(0);
  console.log(`Period 0: Phase=${getEconomicPhase(0)}, Income=${state.monthly_income}, Expense=${state.monthly_living_expense}`);
  if (getEconomicPhase(0) !== 'Recovery') throw new Error('Phase error');
  if (state.monthly_income !== 4166667) throw new Error(`Income mismatch ${state.monthly_income}`);
  
  // Check boundary Year 5 (Period 59) to Year 6 (Period 60)
  // Year 5 = 60 periods (0..59)
  state = calculateEconomicState(59);
  console.log(`Period 59 (Yr 5 last): Phase=${getEconomicPhase(59)}`);
  if (getEconomicPhase(59) !== 'Recovery') throw new Error('Phase error at 59');
  
  state = calculateEconomicState(60);
  console.log(`Period 60 (Yr 6 first): Phase=${getEconomicPhase(60)}, Income=${state.monthly_income}, Expense=${state.monthly_living_expense}`);
  if (getEconomicPhase(60) !== 'Boom') throw new Error('Phase error at 60');

  // Year 10 to Year 11 (Period 119 to 120)
  if (getEconomicPhase(119) !== 'Boom') throw new Error('Phase error at 119');
  if (getEconomicPhase(120) !== 'Tightening') throw new Error('Phase error at 120');

  console.log(`[OK] Economic Phase boundaries verified.`);

  // 1. Setup E2E
  const seasonId = `season_${Date.now()}`;
  console.log(`\n[+] Setup E2E Season: ${seasonId}`);
  
  await db.collection('PLAY_SEASON').doc(seasonId).set({
    season_id: seasonId,
    status: 'ACTIVE',
    clock_status: 'INITIAL',
    transaction_status: 'NORMAL',
    current_simulation_period: 0
  });

  const p1 = `p1_${Date.now()}`;
  const p2 = `p2_${Date.now()}`; // For mid-chunk test
  
  await db.collection('PLAY_PLAYER').doc(p1).set({ season_id: seasonId, status: 'ACTIVE' });
  await db.collection('PLAY_PLAYER').doc(p2).set({ season_id: seasonId, status: 'ACTIVE' });
  
  await db.collection('PLAY_PLAYER_ASSET').doc(p1).set({
    season_id: seasonId, cash_total: 700000000, cash_available: 700000000, cash_locked: 0, 
    debt_total: 0, property_count: 0, financial_asset_total: 0, net_worth: 700000000, 
    last_processed_period: -1
  });
  await db.collection('PLAY_PLAYER_ASSET').doc(p2).set({
    season_id: seasonId, cash_total: 700000000, cash_available: 700000000, cash_locked: 0, 
    debt_total: 0, property_count: 0, financial_asset_total: 0, net_worth: 700000000, 
    last_processed_period: -1
  });

  const batchId = `${seasonId}_0_MONTHLY`;
  const chunkId = `${batchId}_chunk_1`;
  await db.collection('PLAY_BATCH').doc(batchId).set({
    batch_id: batchId, season_id: seasonId, batch_type: 'MONTHLY', simulation_period: 0, status: 'RUNNING'
  });
  await db.collection('PLAY_BATCH_CHUNKS').doc(chunkId).set({
    chunk_id: chunkId, batch_id: batchId, season_id: seasonId, status: 'PENDING'
  });

  // 2. Auth setup
  const auth = new GoogleAuth({ keyFilename: './sa-key.json' });
  const client = await auth.getIdTokenClient(`${BASE_URL}/processBatchChunk`);
  const headers = await client.getRequestHeaders();

  // T01, T02, T03: Run Period 0
  console.log(`\n[+] Firing processBatchChunk for Period 0...`);
  let res = await fetch(`${BASE_URL}/processBatchChunk`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { season_id: seasonId, batch_id: batchId, chunk_id: chunkId, simulation_period: 0 } })
  });
  console.log(`HTTP ${res.status}`);
  let responseText = await res.text();
  console.log(`Response: ${responseText}`);
  
  let assetDoc = await db.collection('PLAY_PLAYER_ASSET').doc(p1).get();
  let asset = assetDoc.data() || {};
  console.log(`[T01/T02/T03] P1 Cash: ${asset.cash_total} | Net Worth: ${asset.net_worth}`);

  let logsSnap = await db.collection('PLAY_DECISION_LOG').where('player_id', '==', p1).get();
  
  if (logsSnap.empty) {
    throw new Error('No log found for P1');
  }
  let log = logsSnap.docs[0].data();
  console.log(`[Log] Income: ${log.income} | Expense: ${log.living_expense}`);
  
  if (asset.cash_total !== 700000000 + log.income - log.living_expense) {
    throw new Error('Cash arithmetic failed');
  }

  // T08, T09: Concurrent requests
  console.log(`\n[+] Firing 5 concurrent requests (T08, T09)...`);
  const reqs = [];
  for (let i = 0; i < 5; i++) {
    reqs.push(fetch(`${BASE_URL}/processBatchChunk`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { season_id: seasonId, batch_id: batchId, chunk_id: chunkId, simulation_period: 0 } })
    }));
  }
  await Promise.all(reqs);

  assetDoc = await db.collection('PLAY_PLAYER_ASSET').doc(p1).get();
  let assetAfter = assetDoc.data() || {};
  if (assetAfter.cash_total !== asset.cash_total) {
    throw new Error('Idempotency failed: cash changed on duplicate run');
  }
  console.log(`[OK] Idempotency verified. Cash remained ${assetAfter.cash_total}`);

  // T11: Reconciliation Success
  console.log(`\n[+] Firing Reconciliation (T11)...`);
  res = await fetch(`${BASE_URL}/runReconciliation`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { season_id: seasonId, batch_id: batchId } })
  });
  let data = await res.json();
  console.log(`Reconciliation Result:`, data.result);
  if (data.result.status !== 'SUCCESS') throw new Error('Reconciliation failed unexpectedly');

  // T12, T13: Intentional Corruption
  console.log(`\n[+] Corrupting data for T12/T13...`);
  await db.collection('PLAY_PLAYER_ASSET').doc(p1).update({ cash_total: -100 });
  
  res = await fetch(`${BASE_URL}/runReconciliation`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { season_id: seasonId, batch_id: batchId } })
  });
  data = await res.json();
  console.log(`Reconciliation Result after corruption:`, data.result);
  
  if (data.result.status !== 'FAILED' || data.result.action !== 'TRANSACTION_PAUSED') {
    throw new Error('Reconciliation did not catch negative cash or pause transaction');
  }

  let seasonDoc = await db.collection('PLAY_SEASON').doc(seasonId).get();
  let season = seasonDoc.data() || {};
  if (season.transaction_status !== 'TRANSACTION_PAUSED') {
    throw new Error('Season status was not updated to PAUSED');
  }
  console.log(`[OK] Reconciliation correctly halted the system.`);

  console.log(`\n[+] ALL TESTS COMPLETED SUCCESSFULLY`);
  process.exit(0);
}

runTests().catch(e => {
  console.error('\n[FATAL ERROR]', e);
  process.exit(1);
});
