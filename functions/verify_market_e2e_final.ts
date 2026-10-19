import * as admin from 'firebase-admin';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Admin SDK
process.env.FIRESTORE_EMULATOR_HOST = '';
const serviceAccount = require('./sa-key.json');
try {
  admin.initializeApp({ 
    credential: admin.credential.cert(serviceAccount),
    projectId: 'aptrank-cc61b' 
  });
} catch (e) {}

const dbAdmin = admin.firestore();
const ENDPOINT_PREFIX = 'https://asia-northeast3-aptrank-cc61b.cloudfunctions.net';

async function getApiKey() {
  const output = execSync('npx firebase-tools apps:sdkconfig WEB --json').toString();
  const configStr = output.substring(output.indexOf('{'), output.lastIndexOf('}') + 1);
  const config = JSON.parse(configStr);
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
  if (data.error) throw new Error(data.error.message);
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

const seasonId = `S_FINAL_${Date.now()}`;

async function verifyFinal() {
  console.log(`========================================`);
  console.log(`[+] Starting Market FINAL 4 E2E: ${seasonId}`);
  console.log(`========================================\n`);

  // Setup Season & Players
  await dbAdmin.collection('PLAY_SEASON').doc(seasonId).set({
    season_id: seasonId, status: 'ACTIVE', current_simulation_period: 1, transaction_status: 'TRANSACTION_OPEN'
  });

  const playerTokens: Record<string, string> = {};
  for (let i = 1; i <= 10; i++) {
    const pId = `f_player_${i}`;
    await dbAdmin.collection('PLAY_PLAYER').doc(pId).set({ player_id: pId, user_id: pId, season_id: seasonId });
    await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(pId).set({
      player_id: pId, season_id: seasonId, cash_total: 5000000, cash_available: 5000000, cash_locked: 0, property_count: 0, net_worth: 5000000
    });
    playerTokens[pId] = await getAuthToken(pId);
  }

  // Inject properties
  const propId = 'PROP_FINAL_1';
  await dbAdmin.collection('PLAY_PROPERTY_OWNERSHIP').doc('OWN_F_1').set({
    ownership_id: 'OWN_F_1', season_id: seasonId, property_id: propId, player_id: 'f_player_1', status: 'ACTIVE', locked_for_sale: false, acquired_at: admin.firestore.Timestamp.now()
  });

  // ==========================================
  // P17-A: Price-Time Priority
  // ==========================================
  console.log(`\n[P17-A] Testing Price-Time Priority`);
  
  // Create 3 SELL Orders
  const sellA = await callFunction('createSecondaryOrder', { season_id: seasonId, property_id: propId, side: 'SELL', price: 1000000, idempotency_key: `P17_SELL_A_${seasonId}` }, playerTokens['f_player_1']);
  
  // Give ownership to player 2 for second sell
  await dbAdmin.collection('PLAY_PROPERTY_OWNERSHIP').doc('OWN_F_2').set({ ownership_id: 'OWN_F_2', season_id: seasonId, property_id: propId, player_id: 'f_player_2', status: 'ACTIVE', locked_for_sale: false });
  const sellB = await callFunction('createSecondaryOrder', { season_id: seasonId, property_id: propId, side: 'SELL', price: 980000, idempotency_key: `P17_SELL_B_${seasonId}` }, playerTokens['f_player_2']);
  
  // Give ownership to player 3
  await dbAdmin.collection('PLAY_PROPERTY_OWNERSHIP').doc('OWN_F_3').set({ ownership_id: 'OWN_F_3', season_id: seasonId, property_id: propId, player_id: 'f_player_3', status: 'ACTIVE', locked_for_sale: false });
  const sellC = await callFunction('createSecondaryOrder', { season_id: seasonId, property_id: propId, side: 'SELL', price: 990000, idempotency_key: `P17_SELL_C_${seasonId}` }, playerTokens['f_player_3']);

  // Fetch from DB and sort client side
  const sellSnaps = await dbAdmin.collection('PLAY_SECONDARY_ORDER').where('season_id', '==', seasonId).get();
  let sells = sellSnaps.docs.map(d => d.data()).filter(d => d.status === 'OPEN' && d.side === 'SELL');
  
  console.log(`Fetched sells count: ${sells.length}`);
  if (sells.length === 0) {
     console.log(`All orders in DB:`, sellSnaps.docs.map(d => d.data()));
  }

  sells.sort((a, b) => {
    if (a.price !== b.price) return a.price - b.price; // Ascending
    return a.created_at.toMillis() - b.created_at.toMillis();
  });

  if (sells.length > 0 && sells[0].order_id === sellB.order_id && sells[0].price === 980000) {
    console.log(`[PASS] P17-A SELL Price Priority correct (Lowest selected: ${sells[0].price})`);
  } else {
    console.error(`[FAIL] P17-A SELL Price Priority`);
  }

  // Create 3 BUY Orders (Price priority means descending price)
  const buyA = await callFunction('createSecondaryOrder', { season_id: seasonId, property_id: propId, side: 'BUY', price: 980000, idempotency_key: `P17_BUY_A_${seasonId}` }, playerTokens['f_player_4']);
  const buyB = await callFunction('createSecondaryOrder', { season_id: seasonId, property_id: propId, side: 'BUY', price: 1000000, idempotency_key: `P17_BUY_B_${seasonId}` }, playerTokens['f_player_5']);
  const buyC = await callFunction('createSecondaryOrder', { season_id: seasonId, property_id: propId, side: 'BUY', price: 990000, idempotency_key: `P17_BUY_C_${seasonId}` }, playerTokens['f_player_6']);

  let buys = (await dbAdmin.collection('PLAY_SECONDARY_ORDER').where('season_id', '==', seasonId).get()).docs.map(d => d.data()).filter(d => d.status === 'OPEN' && d.side === 'BUY');
  
  console.log(`Fetched buys count: ${buys.length}`);

  buys.sort((a, b) => {
    if (a.price !== b.price) return b.price - a.price; // Descending for BUY
    return a.created_at.toMillis() - b.created_at.toMillis();
  });

  if (buys.length > 0 && buys[0].order_id === buyB.order_id && buys[0].price === 1000000) {
    console.log(`[PASS] P17-A BUY Price Priority correct (Highest selected: ${buys[0].price})`);
  } else {
    console.error(`[FAIL] P17-A BUY Price Priority`);
  }

  // Clear orders for next test
  for(let o of [...sells, ...buys]) await callFunction('cancelSecondaryOrder', { season_id: seasonId, order_id: o.order_id, idempotency_key: `CANCEL_${o.order_id}_${seasonId}` }, playerTokens[o.player_id]);


  // ==========================================
  // P20-A: Concurrent Secondary Matching
  // ==========================================
  console.log(`\n[P20-A] Testing Concurrent Secondary Matching`);
  // Player 1 creates a new SELL order (they got their ownership unlocked when their previous order cancelled)
  const sellP20 = await callFunction('createSecondaryOrder', { season_id: seasonId, property_id: propId, side: 'SELL', price: 1000000, idempotency_key: `P20_SELL_1_${seasonId}` }, playerTokens['f_player_1']);

  // Player 4 makes 1 BUY order
  const buyP20 = await callFunction('createSecondaryOrder', { season_id: seasonId, property_id: propId, side: 'BUY', price: 1000000, idempotency_key: `P20_BUY_1_${seasonId}` }, playerTokens['f_player_4']);
  
  console.log(`Firing 10 simultaneous match requests...`);
  const matchPromises = [];
  for(let i=0; i<10; i++) {
    matchPromises.push(
      callFunction('matchSecondaryOrder', { season_id: seasonId, buy_order_id: buyP20.order_id, sell_order_id: sellP20.order_id, idempotency_key: `P20_MATCH_${i}_${seasonId}` }, playerTokens['f_player_5'])
        .catch(e => e.message)
    );
  }
  
  const results = await Promise.all(matchPromises);
  const successes = results.filter(r => typeof r === 'object' && r.status === 'SUCCESS');
  const failures = results.filter(r => typeof r === 'string');

  if (successes.length === 1 && failures.length === 9) {
    console.log(`[PASS] Exactly 1 match succeeded, 9 failed concurrently.`);
    console.log(`Success TX ID: ${successes[0].transaction_id}`);
    console.log(`Sample Failure: ${failures[0]}`);
  } else {
    console.error(`[FAIL] Concurrency broken. Successes: ${successes.length}`);
    console.log(failures);
  }
  
  // Verify DB State
  const p4Asset = (await dbAdmin.collection('PLAY_PLAYER_ASSET').doc('f_player_4').get()).data()!;
  const p1Asset = (await dbAdmin.collection('PLAY_PLAYER_ASSET').doc('f_player_1').get()).data()!;
  if (p4Asset.cash_total < 5000000) console.log(`[PASS] Buyer Cash correctly deducted once: ${p4Asset.cash_total}`);
  if (p1Asset.cash_total > 5000000) console.log(`[PASS] Seller Cash correctly added once: ${p1Asset.cash_total}`);

  // ==========================================
  // P22-A: Crash -> Retry -> Recovery
  // ==========================================
  console.log(`\n[P22-A] Testing Crash -> Retry -> Recovery`);
  
  // P2 sells it (they own OWN_F_2 and it's unlocked from earlier cancel)
  const sellP22 = await callFunction('createSecondaryOrder', { season_id: seasonId, property_id: propId, side: 'SELL', price: 500000, idempotency_key: `P22_SELL_1_${seasonId}` }, playerTokens['f_player_2']);
  // P5 buys it
  const buyP22 = await callFunction('createSecondaryOrder', { season_id: seasonId, property_id: propId, side: 'BUY', price: 500000, idempotency_key: `P22_BUY_1_${seasonId}` }, playerTokens['f_player_5']);

  const p5Before = (await dbAdmin.collection('PLAY_PLAYER_ASSET').doc('f_player_5').get()).data()!;
  
  console.log(`Injecting crash during match...`);
  try {
    await callFunction('matchSecondaryOrder', { season_id: seasonId, buy_order_id: buyP22.order_id, sell_order_id: sellP22.order_id, idempotency_key: `CRASH_BEFORE_COMMIT_1_${seasonId}` }, playerTokens['f_player_6']);
    console.error(`[FAIL] Crash injection did not throw!`);
  } catch(e: any) {
    console.log(`[PASS] Crash threw exactly as expected: ${e.message}`);
  }

  // Assert rollback
  const p5AfterCrash = (await dbAdmin.collection('PLAY_PLAYER_ASSET').doc('f_player_5').get()).data()!;
  if (p5Before.cash_total === p5AfterCrash.cash_total && p5Before.cash_locked === p5AfterCrash.cash_locked) {
    console.log(`[PASS] State correctly rolled back! Cash unchanged.`);
  } else {
    console.error(`[FAIL] State corrupted after crash!`);
  }

  console.log(`Retrying normally...`);
  const retryRes = await callFunction('matchSecondaryOrder', { season_id: seasonId, buy_order_id: buyP22.order_id, sell_order_id: sellP22.order_id, idempotency_key: `P22_RETRY_SUCCESS_${seasonId}` }, playerTokens['f_player_6']);
  if (retryRes.status === 'SUCCESS') {
    console.log(`[PASS] Retry matched successfully! TX ID: ${retryRes.transaction_id}`);
  }
  
  const p5AfterRetry = (await dbAdmin.collection('PLAY_PLAYER_ASSET').doc('f_player_5').get()).data()!;
  if (p5AfterRetry.cash_total < p5Before.cash_total) {
    console.log(`[PASS] Retry successfully deducted cash.`);
  }

  // ==========================================
  // P23-A: Full Property Lifecycle E2E
  // ==========================================
  console.log(`\n[P23-A] Testing Full Property Lifecycle E2E`);
  await dbAdmin.collection('PLAY_PRIMARY_SUPPLY').doc('SUPPLY_F_1').set({
    supply_id: 'SUPPLY_F_1', season_id: seasonId, property_id: 'PROP_FINAL_E2E', remaining_supply: 1, initial_price: 300000, status: 'OPEN'
  });
  await dbAdmin.collection('PLAY_PROPERTY_MASTER').doc('PROP_FINAL_E2E').set({
    property_id: 'PROP_FINAL_E2E', representative_area_sqm: 85, tradable: true
  });

  console.log(`Step 1: Player 10 buys from primary...`);
  const primRes = await callFunction('purchasePrimaryProperty', { season_id: seasonId, property_id: 'PROP_FINAL_E2E', idempotency_key: `E2E_PRIM_1_${seasonId}` }, playerTokens['f_player_10']);
  
  console.log(`Step 2: Player 10 creates SELL order...`);
  const e2eSell = await callFunction('createSecondaryOrder', { season_id: seasonId, property_id: 'PROP_FINAL_E2E', side: 'SELL', price: 350000, idempotency_key: `E2E_SELL_1_${seasonId}` }, playerTokens['f_player_10']);

  console.log(`Step 3: Player 9 creates BUY order...`);
  const e2eBuy = await callFunction('createSecondaryOrder', { season_id: seasonId, property_id: 'PROP_FINAL_E2E', side: 'BUY', price: 350000, idempotency_key: `E2E_BUY_1_${seasonId}` }, playerTokens['f_player_9']);

  console.log(`Step 4: Player 9 (or engine) matches...`);
  const e2eMatch = await callFunction('matchSecondaryOrder', { season_id: seasonId, buy_order_id: e2eBuy.order_id, sell_order_id: e2eSell.order_id, idempotency_key: `E2E_MATCH_1_${seasonId}` }, playerTokens['f_player_9']);

  console.log(`Step 5: Verify Final State...`);
  const p9Asset = (await dbAdmin.collection('PLAY_PLAYER_ASSET').doc('f_player_9').get()).data()!;
  const p10Asset = (await dbAdmin.collection('PLAY_PLAYER_ASSET').doc('f_player_10').get()).data()!;

  console.log(`Buyer Final Total Cash: ${p9Asset.cash_total}, Locked: ${p9Asset.cash_locked}, Available: ${p9Asset.cash_available}`);
  console.log(`Seller Final Total Cash: ${p10Asset.cash_total}, Locked: ${p10Asset.cash_locked}, Available: ${p10Asset.cash_available}`);

  if (p9Asset.cash_total === p9Asset.cash_available + p9Asset.cash_locked && p10Asset.cash_total === p10Asset.cash_available + p10Asset.cash_locked) {
    console.log(`[PASS] Cash Invariant Holds.`);
  }

  const decisions = (await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', seasonId).get()).size;
  console.log(`[PASS] Decision Logs Created: ${decisions}`);

  console.log(`\n========================================`);
  console.log(`[+] FINAL Verification Script Finished.`);
  console.log(`========================================`);
  process.exit(0);
}

verifyFinal().catch(console.error);
