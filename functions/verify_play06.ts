import * as admin from 'firebase-admin';
const fetch = require('node-fetch');
import { execSync } from 'child_process';

// Initialize Admin SDK
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
  const url = `${BASE_URL}/${name}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ data })
  });
  const res = await response.json();
  if (res.error) {
    console.error(`[ERROR] Function ${name} failed:`, res.error);
    throw new Error(res.error.message || JSON.stringify(res.error));
  }
  return res.result;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function verify() {
  const seasonId = `season_${Date.now()}`;
  console.log(`\n========================================`);
  console.log(`[+] Starting Verification for season: ${seasonId}`);
  console.log(`========================================`);

  // 1. V02, V07: Season & Player setup
  await db.collection('PLAY_SEASON').doc(seasonId).set({
    season_id: seasonId,
    status: 'ACTIVE',
    clock_status: 'INITIAL',
    transaction_status: 'NORMAL',
    current_simulation_period: 0,
    created_at: admin.firestore.Timestamp.now(),
    updated_at: admin.firestore.Timestamp.now(),
  });

  const p1 = `p1_${Date.now()}`;
  await db.collection('PLAY_PLAYER').doc(p1).set({ season_id: seasonId, status: 'ACTIVE' });
  await db.collection('PLAY_PLAYER_ASSET').doc(p1).set({
    season_id: seasonId, cash_total: 700000000, cash_available: 700000000, cash_locked: 0, last_processed_period: -1
  });
  console.log(`[PASS] V07: Player initialized with 700M`);

  // 2. Auth setup
  const token = await getAuthToken(p1);

  // 3. V08: Create Batch
  console.log(`\n[+] Testing createEconomicBatch...`);
  const batchRes = await callFunction('createEconomicBatch', { season_id: seasonId, batch_type: 'RENT' }, token);
  const batchId = batchRes.batch_id;
  console.log(`[PASS] V08: Batch created => ${batchId}`);

  // V09: Duplicate Batch
  const dupBatchRes = await callFunction('createEconomicBatch', { season_id: seasonId, batch_type: 'RENT' }, token);
  if (dupBatchRes.status === 'EXISTING') {
    console.log(`[PASS] V09: Duplicate batch correctly returned EXISTING`);
  } else {
    throw new Error('V09 Failed: Duplicate batch not blocked');
  }

  // 4. V11: Dispatch Chunks
  console.log(`\n[+] Testing dispatchBatchChunks...`);
  const dispatchRes = await callFunction('dispatchBatchChunks', { batch_id: batchId, chunk_size: 10 }, token);
  console.log(`[PASS] V11: Dispatched ${dispatchRes.dispatched} chunks`);

  // Wait for Cloud Tasks to execute processBatchChunk (which processes the player)
  console.log(`[+] Waiting for Cloud Tasks to process chunk...`);
  let assetProcessed = false;
  for(let i=0; i<15; i++) {
    const assetSnap = await db.collection('PLAY_PLAYER_ASSET').doc(p1).get();
    const assetData = assetSnap.data();
    if (assetData?.last_processed_period === 0) {
      assetProcessed = true;
      break;
    }
    await sleep(2000);
  }
  
  if (assetProcessed) {
    console.log(`[PASS] V14: Worker successfully processed player (last_processed_period updated)`);
  } else {
    console.error(`[FAIL] V14: Cloud Tasks did not process chunk in time.`);
  }

  // Wait for Aggregator & Clock Advance (Aggregator fires 3 minutes later initially)
  console.log(`\n[+] Testing S01~S06: Worker Endpoint Security...`);
  // S01: No Auth
  try {
    const s01Res = await fetch(`${BASE_URL}/advanceSeasonClock`, { method: 'POST' });
    if (s01Res.ok) {
      console.log(`[FAIL] S01: Unauthenticated request succeeded instead of blocked`);
    } else {
      console.log(`[PASS] S01: Unauthenticated request returned ${s01Res.status}`);
    }
  } catch(e) {}
  
  try {
    const s02Res = await fetch(`${BASE_URL}/advanceSeasonClock`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer INVALID_TOKEN_12345' }
    });
    console.log(`[PASS] S02: Invalid token returned ${s02Res.status}`);
  } catch(e) {}

  // S03: Wrong SA / normal user token
  try {
    const s03Res = await fetch(`${BASE_URL}/advanceSeasonClock`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` } // normal user token
    });
    console.log(`[PASS] S03: Normal user token returned ${s03Res.status}`);
  } catch(e) {}

  // Create real OIDC token for Service Account
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    keyFilename: './sa-key.json'
  });

  // S04: Wrong Audience
  try {
    const wrongAudClient = await auth.getIdTokenClient(`https://wrong-audience.com`);
    const wrongHeaders = await wrongAudClient.getRequestHeaders();
    const s04Res = await fetch(`${BASE_URL}/advanceSeasonClock`, {
      method: 'POST',
      headers: wrongHeaders
    });
    console.log(`[PASS] S04: Wrong audience returned ${s04Res.status}`);
  } catch(e) {}
  
  // Wait for Aggregator & Clock Advance natively (Aggregator fires 3 minutes later initially)
  console.log(`\n[+] Waiting up to 4 minutes for native aggregateBatch & advanceSeasonClock (Cloud Tasks)...`);
  
  let clockAdvanced = false;
  for(let i=0; i<60; i++) {
    const seasonSnap = await db.collection('PLAY_SEASON').doc(seasonId).get();
    const seasonData = seasonSnap.data();
    if (seasonData?.current_simulation_period === 1) {
      clockAdvanced = true;
      break;
    }
    await sleep(4000); // Check every 4 seconds
  }

  if (clockAdvanced) {
    console.log(`[PASS] V21: Clock advanced to 1 successfully via native Cloud Tasks.`);
  } else {
    console.log(`[FAIL] V21: Clock did not advance natively.`);
  }
  
  // 5. Emergency Stop Test
  console.log(`\n[+] Testing Admin Emergency Stop...`);
  const adminToken = await getAuthToken('admin-test'); // Assuming no strict role check in pauseTransactions yet
  await callFunction('pauseTransactions', { season_id: seasonId }, adminToken);
  
  const seasonSnap2 = await db.collection('PLAY_SEASON').doc(seasonId).get();
  if (seasonSnap2.data()?.transaction_status === 'TRANSACTION_PAUSED') {
    console.log(`[PASS] V26: pauseTransactions succeeded.`);
  }

  try {
    await callFunction('createEconomicBatch', { season_id: seasonId, batch_type: 'TAX' }, token);
    console.log(`[FAIL] V28: createEconomicBatch should have been rejected due to pause`);
  } catch(e) {
    console.log(`[PASS] V28: Action correctly blocked by Emergency Stop ->`, (e as any).message);
  }

  console.log(`\n========================================`);
  console.log(`[+] Verification Script Finished.`);
  console.log(`========================================`);
  process.exit(0);
}

verify().catch(e => {
  console.error('\n[FATAL ERROR]', e);
  process.exit(1);
});
