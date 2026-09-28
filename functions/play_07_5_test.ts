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

const PROJECT_ID = 'aptrank-cc61b';
const REGION = 'asia-northeast3';

async function callFunction(name: string, data: any, token: string = '') {
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

const { execSync } = require('child_process');

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
  const supplyId = 'TEST_SUPPLY_1';
  await adminDb.collection('PLAY_SEASON').doc(seasonId).set({
    season_id: seasonId,
    status: 'ACTIVE',
    transaction_status: 'NORMAL',
    current_simulation_period: 1,
  });

  await adminDb.collection('PLAY_PRIMARY_SUPPLY').doc(supplyId).set({
    property_id: 'P123',
    initial_price: 10000,
    remaining_supply: 2,
  });

  const playerAsset = {
    cash_total: 20000,
    cash_available: 20000,
    property_count: 0,
    net_worth: 20000
  };

  return { seasonId, supplyId, playerAsset };
}

async function runTests() {
  const seasonId = `TEST_RES_${Date.now()}`;
  const { supplyId } = await setupTestData(seasonId);

  // Use a known token for 'ai_user_0' (from L10 test) or authenticate.
  // Actually, wait, `callFunction` usually requires a valid token. 
  // For tests, maybe it's easier to hit the function programmatically with a mocked request? No, let's use the token.
  // In `play_07_4_test.ts`, there is token generation:
  let token = '';
  try {
    token = await getAuthToken('testuser1');
    // Ensure player doc exists
    await adminDb.collection('PLAY_PLAYER').doc(`${seasonId}_testuser1`).set({
      player_id: `${seasonId}_testuser1`, season_id: seasonId, user_id: 'testuser1'
    });
    await adminDb.collection('PLAY_PLAYER_ASSET').doc(`${seasonId}_testuser1`).set({
      cash_total: 20000, cash_available: 20000, property_count: 0, net_worth: 20000
    });
  } catch(e) {
    console.error("Token fail", e);
    return;
  }

  const reqContext = {
    correlation_id: `CORR_${Date.now()}`,
    trace_id: `TR_${Date.now()}`,
    request_id: `REQ_${Date.now()}`,
    participant_id: 'testuser1',
    simulation_period: 1,
    exposure: { displayed_price: 10000, GLI: 102 },
    decision: { intended_action: 'BUY' }
  };

  console.log('--- TEST-01: Successful Action ---');
  let res = await callFunction('purchasePrimaryProperty', {
    season_id: seasonId, supply_id: supplyId, idempotency_key: `IDEMP1_${Date.now()}`,
    research_context: reqContext
  }, token).catch(e => e);

  console.log('TEST-01 Result:', res);

  console.log('--- TEST-02: Rejected Action (Insufficient Cash) ---');
  // deplete cash
  await adminDb.collection('PLAY_PLAYER_ASSET').doc(`${seasonId}_testuser1`).update({
    cash_available: 0
  });
  
  const reqContext2 = { ...reqContext, correlation_id: `CORR2_${Date.now()}`, request_id: `REQ2_${Date.now()}` };
  let res2 = await callFunction('purchasePrimaryProperty', {
    season_id: seasonId, supply_id: supplyId, idempotency_key: `IDEMP2_${Date.now()}`,
    research_context: reqContext2
  }, token).catch(e => e);
  console.log('TEST-02 Result:', res2);

  console.log('--- TEST-03: Duplicate Request ---');
  const dupIdemp = `IDEMP3_${Date.now()}`;
  await adminDb.collection('PLAY_PLAYER_ASSET').doc(`${seasonId}_testuser1`).update({
    cash_available: 20000, cash_total: 20000
  }); // reset cash
  const reqContext3 = { ...reqContext, correlation_id: `CORR3_${Date.now()}`, request_id: dupIdemp };
  let res3_1 = await callFunction('purchasePrimaryProperty', {
    season_id: seasonId, supply_id: supplyId, idempotency_key: dupIdemp,
    research_context: reqContext3
  }, token).catch(e => e);
  let res3_2 = await callFunction('purchasePrimaryProperty', {
    season_id: seasonId, supply_id: supplyId, idempotency_key: dupIdemp,
    research_context: reqContext3
  }, token).catch(e => e);
  console.log('TEST-03 Result:', res3_1, res3_2);

  console.log('--- TEST-05 & 06: Traceability Checks ---');
  const snap1 = await adminDb.collection('RESEARCH_EVENTS').where('correlation_id', '==', reqContext.correlation_id).get();
  console.log('TEST-01 Correlation Events:', snap1.docs.map(d=>d.data().event_type));

  const snap2 = await adminDb.collection('RESEARCH_EVENTS').where('correlation_id', '==', reqContext2.correlation_id).get();
  console.log('TEST-02 Correlation Events:', snap2.docs.map(d=>d.data().event_type));

  const snap3 = await adminDb.collection('RESEARCH_EVENTS').where('correlation_id', '==', reqContext3.correlation_id).get();
  console.log('TEST-03 Correlation Events:', snap3.docs.map(d=>d.data().event_type));

  console.log('Done');
}

runTests().catch(console.error);
