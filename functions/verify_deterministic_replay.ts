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

async function getOidcToken() {
  const auth = new GoogleAuth({ keyFilename: SERVICE_ACCOUNT_PATH });
  const client = await auth.getIdTokenClient(`${ENDPOINT_PREFIX}/processBatchChunk`);
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

async function verifyDeterministicReplay(token: string) {
  console.log(`\n--- Deterministic Replay Test ---`);
  
  // Create a completely new season for Run 1
  const sId1 = `S_REP1_${Date.now()}`;
  await setupSeason(sId1);
  await createPlayer(sId1);
  
  // Run 1
  const bId1 = `${sId1}_1_MONTHLY`; const cId1 = `${bId1}_c0`;
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId1).set({ chunk_id: cId1, batch_id: bId1, chunk_index: 0, player_count: 1, target_players: [`${sId1}_p1`], status: 'DISPATCHED' });
  await dbAdmin.collection('PLAY_BATCH').doc(bId1).set({ batch_id: bId1, season_id: sId1, simulation_period: 1, batch_type: 'MONTHLY', scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0', status: 'RUNNING' });
  await callFunction('processBatchChunk', { season_id: sId1, batch_id: bId1, chunk_id: cId1, simulation_period: 1, batch_type: 'MONTHLY', chunk_index: 0, scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0' }, token);
  
  // Create a completely new season for Run 2 (Same initial state, just different Season ID to keep them isolated)
  const sId2 = `S_REP2_${Date.now()}`;
  await setupSeason(sId2);
  await createPlayer(sId2);
  
  // Run 2
  const bId2 = `${sId2}_1_MONTHLY`; const cId2 = `${bId2}_c0`;
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId2).set({ chunk_id: cId2, batch_id: bId2, chunk_index: 0, player_count: 1, target_players: [`${sId2}_p1`], status: 'DISPATCHED' });
  await dbAdmin.collection('PLAY_BATCH').doc(bId2).set({ batch_id: bId2, season_id: sId2, simulation_period: 1, batch_type: 'MONTHLY', scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0', status: 'RUNNING' });
  await callFunction('processBatchChunk', { season_id: sId2, batch_id: bId2, chunk_id: cId2, simulation_period: 1, batch_type: 'MONTHLY', chunk_index: 0, scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0' }, token);

  // Compare results
  const p1 = (await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId1}_p1`).get()).data()!;
  const p2 = (await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId2}_p1`).get()).data()!;
  
  console.log("Run 1 Result:", { cash_total: p1.cash_total, net_worth: p1.net_worth });
  console.log("Run 2 Result:", { cash_total: p2.cash_total, net_worth: p2.net_worth });
  
  if (p1.cash_total !== p2.cash_total || p1.net_worth !== p2.net_worth) {
    throw new Error("Deterministic replay failed. Results do not match!");
  }
  
  console.log("PASS: Run 1 and Run 2 produced exactly identical economic results for identical initial conditions.");
}

async function setupSeason(sId: string) {
  await dbAdmin.collection('PLAY_SEASON').doc(sId).set({
    season_id: sId, status: 'ACTIVE', current_simulation_period: 1
  });
}
async function createPlayer(sId: string) {
  await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(`${sId}_p1`).set({
    player_id: `${sId}_p1`, season_id: sId, cash_total: 1000, cash_available: 1000, net_worth: 1000,
    last_processed_period: 0, created_at: admin.firestore.Timestamp.now()
  });
}

async function run() {
  const token = await getOidcToken();
  await verifyDeterministicReplay(token);
}

run().catch(e => { console.error(`[FATAL]`, e); process.exit(1); });
