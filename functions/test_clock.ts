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

async function main() {
  const sId = `S_TEST_${Date.now()}`;
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

  const bId = `${sId}_1_MONTHLY`;
  await dbAdmin.collection('PLAY_BATCH').doc(bId).set({
    batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY',
    status: 'COMPLETED'
  });

  const clockToken = await getOidcToken('advanceSeasonClock');
  try {
     const res = await callFunction('advanceSeasonClock', { season_id: sId, batch_id: bId }, clockToken);
     console.log('Result:', res);
  } catch (e) {
     console.error('Error:', e);
  }
}
main();
