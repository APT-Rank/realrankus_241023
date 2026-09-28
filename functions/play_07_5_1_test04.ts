import { callFunction } from './src/common/api';
import * as admin from 'firebase-admin';

// Initialize firebase admin
const serviceAccount = require('./sa-key.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'aptrank-cc61b'
  });
}
const adminDb = admin.firestore();
const { execSync } = require('child_process');

const PROJECT_ID = 'aptrank-cc61b';
const REGION = 'asia-northeast3';

async function callFunctionHelper(name: string, data: any, token: string = '') {
  const url = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${name}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ data })
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error?.message || 'HTTP Error');
  return json.result;
}

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
  const json = await res.json();
  return json.idToken;
}

async function setupTestData(seasonId: string) {
  const supplyId = 'TEST_SUPPLY_FAIL';
  await adminDb.collection('PLAY_SEASON').doc(seasonId).set({
    season_id: seasonId,
    status: 'ACTIVE',
    transaction_status: 'NORMAL',
    current_simulation_period: 1,
  });

  await adminDb.collection('PLAY_PRIMARY_SUPPLY').doc(supplyId).set({
    property_id: 'P999',
    initial_price: 10000,
    remaining_supply: 2,
  });

  await adminDb.collection('PLAY_PLAYER').doc(`${seasonId}_tester`).set({
    player_id: `${seasonId}_tester`, season_id: seasonId, user_id: 'tester'
  });
  await adminDb.collection('PLAY_PLAYER_ASSET').doc(`${seasonId}_tester`).set({
    cash_total: 20000, cash_available: 20000, property_count: 0, net_worth: 20000
  });

  return { seasonId, supplyId };
}

async function runTest04() {
  const seasonId = `TEST_FAIL_${Date.now()}`;
  const { supplyId } = await setupTestData(seasonId);
  const token = await getAuthToken('tester');

  // We inject 'FAIL_ME' into correlation_id so that our modified Cloud Function knows to fail
  const reqContext = {
    correlation_id: `FAIL_ME_CORR_${Date.now()}`,
    trace_id: `TR_${Date.now()}`,
    request_id: `REQ_${Date.now()}`,
    participant_id: 'tester',
    simulation_period: 1,
    exposure: { displayed_price: 10000, GLI: 100 },
    decision: { intended_action: 'BUY' }
  };

  console.log('--- TEST-04: Research Writer Failure ---');
  let res = await callFunctionHelper('purchasePrimaryProperty', {
    season_id: seasonId, supply_id: supplyId, idempotency_key: `IDEMP_F_${Date.now()}`,
    research_context: reqContext
  }, token).catch(e => e);

  console.log('Transaction Result:', res);

  // Assert Transaction integrity
  const assetDoc = await adminDb.collection('PLAY_PLAYER_ASSET').doc(`${seasonId}_tester`).get();
  console.log('Player Cash After:', assetDoc.data()?.cash_available);

  // Assert Research Event Loss
  const snap = await adminDb.collection('RESEARCH_EVENTS').where('correlation_id', '==', reqContext.correlation_id).get();
  console.log(`Found ${snap.size} Research Events for this correlation.`);
  
  // Assert DLQ
  const dlqSnap = await adminDb.collection('RESEARCH_EVENTS_DLQ').where('original_event.correlation_id', '==', reqContext.correlation_id).get();
  console.log(`Found ${dlqSnap.size} DLQ Events for this correlation.`);

  console.log('Done');
}

runTest04().catch(console.error);
