import * as admin from 'firebase-admin';
import fetch from 'node-fetch';
import { getEconomicPhase, getAnnualInflation, calculateEconomicState } from './src/play/batch/economicEngine';

const PROJECT = 'aptrank-cc61b';
const REGION = 'asia-northeast3';
const BASE_URL_GEN2 = `https://processbatchchunk-5q2drcblwa-du.a.run.app`;
const ADVANCE_URL = `https://advanceseasonclock-5q2drcblwa-du.a.run.app`;

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: PROJECT
  });
}
const db = admin.firestore();

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log("========================================");
  console.log("[+] Starting PLAY-07.1 FINAL VERIFICATION Tests");
  console.log("========================================\n");

  // V01 — 360 Period / Economic Phase
  console.log("[V01] 360 Period / Economic Phase Validation");
  const checkPeriods = [0, 59, 60, 119, 120, 179, 180, 239, 240, 299, 300, 359];
  for (const p of checkPeriods) {
    const year = Math.floor(p / 12) + 1;
    const phase = getEconomicPhase(p);
    const annual_inflation = getAnnualInflation(phase);
    console.log(`Period: ${p}, Year: ${year}, Phase: ${phase}, Annual Inflation: ${(annual_inflation * 100).toFixed(1)}%`);
  }
  console.log();

  // V02 / V03 / V04 — Income, Inflation, Expense Engine
  console.log("[V02/V03/V04] Income, Inflation, Expense Validation");
  const testPhases = [
    { period: 12, phase: 'Recovery' }, 
    { period: 72, phase: 'Boom' }, 
    { period: 132, phase: 'Tightening' }, 
    { period: 192, phase: 'Recession' }
  ];
  for (const t of testPhases) {
    const state = calculateEconomicState(t.period);
    const ann_inf = getAnnualInflation(t.phase);
    const expected_monthly_inf = Math.pow(1 + ann_inf, 1/12) - 1;
    const simple_monthly_inf = ann_inf / 12;
    console.log(`-- Period ${t.period} (${t.phase}) --`);
    console.log(`Annual Inflation: ${(ann_inf * 100).toFixed(1)}%`);
    console.log(`Monthly Inflation (Actual vs Simple): ${(state.monthly_inflation * 100).toFixed(4)}% vs ${(simple_monthly_inf * 100).toFixed(4)}%`);
    console.log(`Annual Income Growth: ${(state.annual_income_growth * 100).toFixed(1)}%`);
    console.log(`Base Expense: 3000000 | Cum. Inf Factor: ${state.cumulative_inflation_factor.toFixed(4)}`);
    console.log(`Expected Expense: ${Math.round(3000000 * state.cumulative_inflation_factor)} | Actual: ${state.monthly_living_expense}`);
    console.log(`Monthly Income: ${state.monthly_income}`);
  }
  console.log();

  // Setup Season for V05 ~ V14
  const timestamp = Date.now();
  const seasonId = `season_ver_${timestamp}`;
  const batchId = `${seasonId}_0_MONTHLY`;
  const chunkId = `${batchId}_chunk_1`;
  const p1 = `p1_${timestamp}`;

  console.log(`[+] Setup Test Environment (Season: ${seasonId}, Player: ${p1})`);
  await db.collection('PLAY_SEASON').doc(seasonId).set({
    season_id: seasonId,
    status: 'ACTIVE',
    clock_status: 'RUNNING',
    current_simulation_period: 0
  });

  await db.collection('PLAY_PLAYER').doc(p1).set({
    season_id: seasonId, status: 'ACTIVE'
  });

  await db.collection('PLAY_PLAYER_ASSET').doc(p1).set({
    season_id: seasonId, cash_total: 700000000, cash_available: 700000000, cash_locked: 0,
    debt_total: 0, property_count: 0, financial_asset_total: 0, net_worth: 700000000,
    last_processed_period: -1
  });

  await db.collection('PLAY_BATCH').doc(batchId).set({
    batch_id: batchId, season_id: seasonId, batch_type: 'MONTHLY', simulation_period: 0, status: 'RUNNING'
  });
  await db.collection('PLAY_BATCH_CHUNKS').doc(chunkId).set({
    chunk_id: chunkId, batch_id: batchId, season_id: seasonId, status: 'PENDING'
  });

  // Fetch token (mock or actual, for Cloud Tasks simulation we will use gcloud to get identity token)
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({ keyFilename: './sa-key.json' });
  const clientGen2 = await auth.getIdTokenClient(BASE_URL_GEN2);
  const headersGen2 = await clientGen2.getRequestHeaders();
  const token = headersGen2.Authorization.split(' ')[1];

  const clientRec = await auth.getIdTokenClient(`https://${REGION}-${PROJECT}.cloudfunctions.net/runReconciliation`);
  const headersRec = await clientRec.getRequestHeaders();
  const tokenRec = headersRec.Authorization.split(' ')[1];

  // V11 — Unauthenticated Security
  console.log("[V11] Unauthenticated Security");
  let res = await fetch(`${BASE_URL_GEN2}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { season_id: seasonId } })
  });
  console.log(`Expected 401/403 | Actual: ${res.status}`);
  console.log();

  // V13, V05, V06, V07 — Valid Cloud Task & Idempotency
  console.log("[V13/V05/V06/V07] Valid Task & Idempotency & DB Checks");
  console.log("Firing 5 concurrent requests...");
  const promises = [];
  for (let i=0; i<5; i++) {
    promises.push(fetch(`${BASE_URL_GEN2}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-cloudtasks-taskname': `task_${i}`
      },
      body: JSON.stringify({ data: { season_id: seasonId, batch_id: batchId, chunk_id: chunkId, simulation_period: 0, batch_type: 'MONTHLY' } })
    }));
  }
  const responses = await Promise.all(promises);
  for (let i=0; i<responses.length; i++) {
    console.log(`Req ${i} Status: ${responses[i].status} | Body: ${await responses[i].text()}`);
  }

  const asset = await db.collection('PLAY_PLAYER_ASSET').doc(p1).get();
  const assetData = asset.data();
  console.log(`After Cash: ${assetData?.cash_total} | Net Worth: ${assetData?.net_worth}`);
  console.log(`last_processed_period: ${assetData?.last_processed_period}`);

  const logs = await db.collection('PLAY_DECISION_LOG').where('player_id', '==', p1).get();
  console.log(`Decision Log Count: ${logs.size} (Expected 1)`);
  if (!logs.empty) {
    const l = logs.docs[0].data();
    console.log(`Log - before_cash: ${l.before_cash}, income: ${l.income}, living_expense: ${l.living_expense}, after_cash: ${l.after_cash}`);
  }
  console.log();

  // V08 — Mid-Chunk Failure Recovery
  console.log("[V08] Mid-Chunk Failure Recovery");
  const seasonIdV08 = `season_v08_${timestamp}`;
  const batchIdV08 = `${seasonIdV08}_0_MONTHLY`;
  const chunkIdV08 = `${batchIdV08}_chunk_1`;

  await db.collection('PLAY_SEASON').doc(seasonIdV08).set({ season_id: seasonIdV08, status: 'ACTIVE' });
  await db.collection('PLAY_BATCH').doc(batchIdV08).set({ batch_id: batchIdV08, season_id: seasonIdV08, batch_type: 'MONTHLY', simulation_period: 0 });
  await db.collection('PLAY_BATCH_CHUNKS').doc(chunkIdV08).set({ chunk_id: chunkIdV08, batch_id: batchIdV08, season_id: seasonIdV08, status: 'PENDING' });

  for (let i = 1; i <= 3; i++) {
    const playerId = `p_v08_${i}`;
    await db.collection('PLAY_PLAYER').doc(playerId).set({ season_id: seasonIdV08, status: 'ACTIVE' });
    await db.collection('PLAY_PLAYER_ASSET').doc(playerId).set({
      season_id: seasonIdV08, cash_total: 700000000, cash_available: 700000000, cash_locked: 0,
      debt_total: 0, property_count: 0, financial_asset_total: 0, net_worth: 700000000,
      last_processed_period: -1
    });
  }

  // Fire first time with force_fail_at = 2 (should process 1, fail on 2, and exit 500)
  let resV08_1 = await fetch(`${BASE_URL_GEN2}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ data: { season_id: seasonIdV08, batch_id: batchIdV08, chunk_id: chunkIdV08, simulation_period: 0, force_fail_at: 2 } })
  });
  console.log(`V08 Run 1 (Fail at 2) Status: ${resV08_1.status}`);

  // Fetch DB to see P1 processed, P2 and P3 not processed
  let ast1 = (await db.collection('PLAY_PLAYER_ASSET').doc('p_v08_1').get()).data();
  let ast2 = (await db.collection('PLAY_PLAYER_ASSET').doc('p_v08_2').get()).data();
  console.log(`V08 Check 1: p1_period=${ast1?.last_processed_period}, p2_period=${ast2?.last_processed_period}`);

  // Fire second time with NO fail (Retry)
  let resV08_2 = await fetch(`${BASE_URL_GEN2}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ data: { season_id: seasonIdV08, batch_id: batchIdV08, chunk_id: chunkIdV08, simulation_period: 0 } })
  });
  let v08_2_json = await resV08_2.json();
  console.log(`V08 Run 2 (Retry) Response:`, v08_2_json.result);

  // Check DB to see P1 was NO-OP, P2 and P3 processed
  ast1 = (await db.collection('PLAY_PLAYER_ASSET').doc('p_v08_1').get()).data();
  ast2 = (await db.collection('PLAY_PLAYER_ASSET').doc('p_v08_2').get()).data();
  let ast3 = (await db.collection('PLAY_PLAYER_ASSET').doc('p_v08_3').get()).data();
  console.log(`V08 Check 2: p1_period=${ast1?.last_processed_period}, p2_period=${ast2?.last_processed_period}, p3_period=${ast3?.last_processed_period}`);
  
  const logsV08 = await db.collection('PLAY_DECISION_LOG').where('season_id', '==', seasonIdV08).get();
  console.log(`V08 Decision Logs Count: ${logsV08.size} (Expected 3)`);
  console.log();

  // V09 — Reconciliation Normal
  console.log("[V09] Reconciliation Normal");
  let recRes = await fetch(`https://${REGION}-${PROJECT}.cloudfunctions.net/runReconciliation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenRec}` },
    body: JSON.stringify({ data: { season_id: seasonId, batch_id: batchId, simulation_period: 0 } })
  });
  console.log(`Reconciliation Response: ${await recRes.text()}`);
  
  const seasonCheck1 = (await db.collection('PLAY_SEASON').doc(seasonId).get()).data();
  console.log(`Season Status: ${seasonCheck1?.status} | Transaction Status: ${seasonCheck1?.transaction_status}`);
  console.log();

  // V10 — Reconciliation Corruption
  console.log("[V10] Reconciliation Corruption");
  await db.collection('PLAY_PLAYER_ASSET').doc(p1).update({ cash_total: 999999999 }); // Corrupt
  
  let recRes2 = await fetch(`https://${REGION}-${PROJECT}.cloudfunctions.net/runReconciliation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenRec}` },
    body: JSON.stringify({ data: { season_id: seasonId, batch_id: batchId, simulation_period: 0 } })
  });
  console.log(`Corrupted Reconciliation Response: ${await recRes2.text()}`);
  
  const seasonCheck2 = (await db.collection('PLAY_SEASON').doc(seasonId).get()).data();
  console.log(`Season Status: ${seasonCheck2?.status} | Transaction Status: ${seasonCheck2?.transaction_status}`);
  console.log();

  // V15 — Rounding Accumulation
  console.log("[V15] Rounding Accumulation Analysis");
  let cash_A = 700000000;
  let cash_B = 700000000;
  let total_income_A = 0, total_income_B = 0;
  let total_expense_A = 0, total_expense_B = 0;
  
  for (let p=0; p<360; p++) {
    // Method A (Current Engine implementation - values are integers each month)
    const stateA = calculateEconomicState(p);
    cash_A += stateA.monthly_income - stateA.monthly_living_expense;
    total_income_A += stateA.monthly_income;
    total_expense_A += stateA.monthly_living_expense;
    
    // Method B (Float computation, rounded at the end)
    const monthly_income_B = (50000000 * stateA.annual_income_growth /* Wait, calculateEconomicState calculates cumulative factor */);
    // actually let's reconstruct Method B:
  }
  
  // Reconstruct Method B accurately:
  let cumulative_inf = 1.0;
  let cumulative_inc = 1.0;
  for (let p=0; p<360; p++) {
    if (p > 0) {
      const ann_inf = getAnnualInflation(getEconomicPhase(p));
      const m_inf = Math.pow(1 + ann_inf, 1/12) - 1;
      const m_inc = Math.pow(1 + ann_inf - 0.005, 1/12) - 1;
      cumulative_inf *= (1 + m_inf);
      cumulative_inc *= (1 + m_inc);
    }
    const raw_income = (50000000 * cumulative_inc) / 12;
    const raw_expense = 3000000 * cumulative_inf;
    total_income_B += raw_income;
    total_expense_B += raw_expense;
  }
  cash_B += total_income_B - total_expense_B;
  
  console.log(`Method A Cash: ${cash_A}`);
  console.log(`Method B Cash: ${Math.round(cash_B)}`);
  console.log(`Difference (A - B): ${cash_A - Math.round(cash_B)}`);
  console.log(`Total Income A: ${total_income_A} | Total Income B: ${Math.round(total_income_B)}`);
  console.log(`Total Expense A: ${total_expense_A} | Total Expense B: ${Math.round(total_expense_B)}`);
  console.log();

  // V16 — Full 360 Period Deterministic Simulation
  console.log("[V16] Full 360 Period Deterministic Simulation");
  let v16_cash = 700000000;
  let hasNaN = false, hasNegative = false;
  let end_income = 0, end_expense = 0;
  
  for (let p=0; p<360; p++) {
    const s = calculateEconomicState(p);
    v16_cash += s.monthly_income - s.monthly_living_expense;
    if (isNaN(v16_cash)) hasNaN = true;
    if (v16_cash < 0) hasNegative = true;
    if (p === 359) {
      end_income = s.monthly_income;
      end_expense = s.monthly_living_expense;
    }
  }
  console.log(`NaN Error: ${hasNaN ? 'YES' : 'NO'}`);
  console.log(`Negative Cash: ${hasNegative ? 'YES' : 'NO'}`);
  console.log(`Period 359 Monthly Income: ${end_income}`);
  console.log(`Period 359 Monthly Expense: ${end_expense}`);
  console.log(`Period 359 Cash/Net Worth: ${v16_cash}`);
}

runVerification().then(() => {
  console.log("\n[+] Verification Completed.");
  process.exit(0);
}).catch(e => {
  console.error("FATAL ERROR", e);
  process.exit(1);
});
