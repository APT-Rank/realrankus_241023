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

async function runTests() {
  const seasonId = `S_BATCH_P1_${Date.now()}`;
  const adminUid = 'admin_user';
  const adminToken = await getAuthToken(adminUid);
  
  console.log(`\n========================================`);
  console.log(`[+] Starting Batch Phase 1 E2E: ${seasonId}`);
  console.log(`========================================\n`);

  // Setup DB
  await dbAdmin.collection('PLAY_SEASON').doc(seasonId).set({
    season_id: seasonId,
    season_name: 'Batch Phase 1 Test',
    status: 'ACTIVE',
    clock_status: 'RUNNING',
    scenario_id: 'SCENARIO_1',
    scenario_version: '1.0',
    rule_version: '1.0',
    current_simulation_period: 1,
    last_successful_period: null,
    last_successful_batch_id: null,
    transaction_status: 'NORMAL',
    created_at: admin.firestore.Timestamp.now(),
    updated_at: admin.firestore.Timestamp.now()
  });

  // Create 150 players (2 chunks)
  const batch = dbAdmin.batch();
  for (let i = 1; i <= 150; i++) {
    batch.set(dbAdmin.collection('PLAY_PLAYER').doc(`p_${i}`), {
      player_id: `p_${i}`,
      user_id: `u_${i}`,
      season_id: seasonId,
      status: 'ACTIVE',
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });
  }
  await batch.commit();

  console.log(`[P1-A] Testing Initial Batch Creation...`);
  const res1 = await callFunction('createEconomicBatch', {
    season_id: seasonId,
    batch_type: 'ECONOMIC_MONTHLY'
  }, adminToken);
  
  if (res1.status === 'CREATED' && res1.batch_id === `${seasonId}_1_ECONOMIC_MONTHLY`) {
    console.log(`[PASS] Batch successfully created: ${res1.batch_id}`);
  } else {
    console.error(`[FAIL] Batch creation returned unexpected status:`, res1);
  }

  // Verify Document
  const batchDoc = await dbAdmin.collection('PLAY_BATCH').doc(res1.batch_id).get();
  if (!batchDoc.exists) {
    console.error(`[FAIL] Batch document not found in Firestore`);
  } else {
    const data = batchDoc.data()!;
    if (data.expected_player_count === 150 && data.chunk_count === 2) {
      console.log(`[PASS] Batch document has correct chunking math (150 players = 2 chunks)`);
    } else {
      console.error(`[FAIL] Batch chunking math incorrect: expected 150/2, got ${data.expected_player_count}/${data.chunk_count}`);
    }
  }

  console.log(`\n[F01] Testing Batch Creation Duplicate...`);
  const res2 = await callFunction('createEconomicBatch', {
    season_id: seasonId,
    batch_type: 'ECONOMIC_MONTHLY'
  }, adminToken);

  if (res2.status === 'EXISTING' && res2.batch_id === res1.batch_id) {
    console.log(`[PASS] Idempotency works! Duplicate request returned EXISTING with same batch_id`);
  } else {
    console.error(`[FAIL] Duplicate request did not return EXISTING:`, res2);
  }

  console.log(`\n========================================`);
  console.log(`[+] Phase 1 Tests Completed.`);
  console.log(`========================================\n`);
}

runTests().catch(console.error);
