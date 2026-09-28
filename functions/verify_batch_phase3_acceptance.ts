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
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ data })
  });
  
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch(e) {}
  if (!res.ok || json.error) {
    const errMsg = typeof json.error === 'object' ? json.error.message : (json.message || json.error || res.statusText || text);
    throw new Error(`[${name}] ${errMsg}`);
  }
  return json.result;
}

async function createPlayersAndAssets(seasonId: string, count: number) {
  const batches = [];
  let currentBatch = dbAdmin.batch();
  let ops = 0;
  
  for (let i = 1; i <= count; i++) {
    const pid = `${seasonId}_p${i}`;
    const pRef = dbAdmin.collection('PLAY_PLAYER').doc(pid);
    const aRef = dbAdmin.collection('PLAY_PLAYER_ASSET').doc(pid);
    
    currentBatch.set(pRef, {
      player_id: pid, user_id: `u_${i}`, season_id: seasonId, status: 'ACTIVE',
      created_at: admin.firestore.Timestamp.now(), updated_at: admin.firestore.Timestamp.now()
    });
    currentBatch.set(aRef, {
      player_id: pid, season_id: seasonId,
      cash_total: 1000, cash_available: 1000, net_worth: 1000,
      financial_asset_total: 0, debt_total: 0,
      last_processed_period: 0, last_processed_batch_id: null,
      created_at: admin.firestore.Timestamp.now(), updated_at: admin.firestore.Timestamp.now()
    });
    ops += 2;
    if (ops >= 490) { batches.push(currentBatch.commit()); currentBatch = dbAdmin.batch(); ops = 0; }
  }
  if (ops > 0) batches.push(currentBatch.commit());
  await Promise.all(batches);
}

async function setupSeason(seasonId: string, period: number = 1) {
  await dbAdmin.collection('PLAY_SEASON').doc(seasonId).set({
    season_id: seasonId, season_name: `Phase 3 Review ${seasonId}`,
    status: 'ACTIVE', clock_status: 'RUNNING',
    scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0',
    current_simulation_period: period,
    last_successful_period: null, last_successful_batch_id: null,
    transaction_status: 'NORMAL',
    created_at: admin.firestore.Timestamp.now(), updated_at: admin.firestore.Timestamp.now()
  });
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[ASSERT FAILED] ${msg}`);
}

async function verifyGoldenScenario(token: string) {
  console.log(`\n--- 1. Golden Scenario ---`);
  const sId = `S_GLD_${Date.now()}`;
  await setupSeason(sId, 1);
  await createPlayersAndAssets(sId, 3); // PLAYER_A, B, C mapped to p1, p2, p3
  
  // Period 1
  const bId1 = `${sId}_1_MONTHLY`; const cId1 = `${bId1}_c0`;
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId1).set({ chunk_id: cId1, batch_id: bId1, chunk_index: 0, player_count: 3, target_players: [`${sId}_p1`, `${sId}_p2`, `${sId}_p3`], status: 'DISPATCHED' });
  await dbAdmin.collection('PLAY_BATCH').doc(bId1).set({ batch_id: bId1, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY', scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0', status: 'RUNNING' });
  await callFunction('processBatchChunk', { season_id: sId, batch_id: bId1, chunk_id: cId1, simulation_period: 1, batch_type: 'MONTHLY', chunk_index: 0, scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0' }, token);
  
  // Period 2
  await setupSeason(sId, 2);
  const bId2 = `${sId}_2_MONTHLY`; const cId2 = `${bId2}_c0`;
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId2).set({ chunk_id: cId2, batch_id: bId2, chunk_index: 0, player_count: 3, target_players: [`${sId}_p1`, `${sId}_p2`, `${sId}_p3`], status: 'DISPATCHED' });
  await dbAdmin.collection('PLAY_BATCH').doc(bId2).set({ batch_id: bId2, season_id: sId, simulation_period: 2, batch_type: 'MONTHLY', scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0', status: 'RUNNING' });
  await callFunction('processBatchChunk', { season_id: sId, batch_id: bId2, chunk_id: cId2, simulation_period: 2, batch_type: 'MONTHLY', chunk_index: 0, scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0' }, token);

  const logs = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  console.log(`Decision Log Count: ${logs.size} (Expected 6)`);
  assert(logs.size === 6, "Expected exactly 6 logs for 3 players over 2 periods.");
  
  for(let i=1; i<=3; i++) {
     const pId = `${sId}_p${i}`;
     const asset = (await dbAdmin.collection('PLAY_PLAYER_ASSET').doc(pId).get()).data()!;
     const pLogsRaw = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).where('player_id', '==', pId).get();
     const pLogsDocs = pLogsRaw.docs.sort((a, b) => a.data().simulation_period - b.data().simulation_period);
     let expectedCash = 1000;
     pLogsDocs.forEach(doc => {
         const data = doc.data();
         console.log(`${pId} Period ${data.simulation_period}: Income=${data.income}, Expense=${data.living_expense}, BeforeCash=${data.before_cash}, AfterCash=${data.after_cash}`);
         expectedCash += (data.income - data.living_expense);
     });
     console.log(`${pId} Final Cash: Expected=${expectedCash}, Actual=${asset.cash_total}`);
     assert(expectedCash === asset.cash_total, "Cash total mismatch");
     assert(asset.last_processed_period === 2, "last_processed_period mismatch");
  }
}

async function verifyPlayerResolutionStability(token: string) {
  console.log(`\n--- 4. Player Resolution Stability ---`);
  const sId = `S_RES_${Date.now()}`;
  await setupSeason(sId, 1);
  await createPlayersAndAssets(sId, 201);
  
  const bId = `${sId}_1_MONTHLY`; 
  await dbAdmin.collection('PLAY_BATCH').doc(bId).set({ batch_id: bId, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY', scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0', status: 'RUNNING' });
  
  const payloadBase = { season_id: sId, batch_id: bId, simulation_period: 1, batch_type: 'MONTHLY', scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0' };
  
  const players = Array.from({length: 201}, (_, i) => `${sId}_p${i+1}`).sort(); // String sort order
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(`${bId}_c0`).set({ chunk_id: `${bId}_c0`, batch_id: bId, chunk_index: 0, player_count: 100, target_players: players.slice(0, 100), status: 'DISPATCHED' });
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(`${bId}_c1`).set({ chunk_id: `${bId}_c1`, batch_id: bId, chunk_index: 1, player_count: 100, target_players: players.slice(100, 200), status: 'DISPATCHED' });
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(`${bId}_c2`).set({ chunk_id: `${bId}_c2`, batch_id: bId, chunk_index: 2, player_count: 1, target_players: players.slice(200, 201), status: 'DISPATCHED' });
  
  // Chunk 0
  const r0 = await callFunction('processBatchChunk', { ...payloadBase, chunk_id: `${bId}_c0`, chunk_index: 0 }, token);
  
  // NOW set p1 to INACTIVE to simulate state change AFTER Chunk 0 but BEFORE Chunk 1
  // p1 is definitely in Chunk 0 (lexicographically first)
  await dbAdmin.collection('PLAY_PLAYER').doc(`${sId}_p1`).update({ status: 'INACTIVE' });
  
  const r1 = await callFunction('processBatchChunk', { ...payloadBase, chunk_id: `${bId}_c1`, chunk_index: 1 }, token);
  const r2 = await callFunction('processBatchChunk', { ...payloadBase, chunk_id: `${bId}_c2`, chunk_index: 2 }, token);
  
  console.log(`Chunk 0 Processed: ${r0.processed}`);
  console.log(`Chunk 1 Processed: ${r1.processed}`);
  console.log(`Chunk 2 Processed: ${r2.processed}`);
  
  const logs = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  console.log(`Total Logs generated: ${logs.size} (Expected 201, because target_players locks the active players at dispatch time)`);
  
  // Find omissions
  let omissions = 0;
  for (let i = 1; i <= 201; i++) {
     if (i === 1) continue;
     const l = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).where('player_id', '==', `${sId}_p${i}`).get();
     if (l.size === 0) {
         console.log(`OMISSION DETECTED: Player ${i} was not processed!`);
         omissions++;
     }
     if (l.size > 1) {
         console.log(`DUPLICATION DETECTED: Player ${i} processed ${l.size} times!`);
     }
  }
  
  console.log(`Omissions: ${omissions}`);
}

async function verifyIdempotencyIdentity(token: string) {
  console.log(`\n--- 5. Idempotency Identity ---`);
  const sId = `S_IDEM_${Date.now()}`;
  await setupSeason(sId, 1);
  await createPlayersAndAssets(sId, 1);
  
  // Monthly batch
  const bId1 = `${sId}_1_MONTHLY`; const cId1 = `${bId1}_c0`;
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId1).set({ chunk_id: cId1, batch_id: bId1, chunk_index: 0, player_count: 1, target_players: [`${sId}_p1`], status: 'DISPATCHED' });
  await dbAdmin.collection('PLAY_BATCH').doc(bId1).set({ batch_id: bId1, season_id: sId, simulation_period: 1, batch_type: 'MONTHLY', scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0', status: 'RUNNING' });
  await callFunction('processBatchChunk', { season_id: sId, batch_id: bId1, chunk_id: cId1, simulation_period: 1, batch_type: 'MONTHLY', chunk_index: 0, scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0' }, token);
  
  // Weekly batch (same period)
  const bId2 = `${sId}_1_WEEKLY`; const cId2 = `${bId2}_c0`;
  await dbAdmin.collection('PLAY_BATCH_CHUNKS').doc(cId2).set({ chunk_id: cId2, batch_id: bId2, chunk_index: 0, player_count: 1, target_players: [`${sId}_p1`], status: 'DISPATCHED' });
  await dbAdmin.collection('PLAY_BATCH').doc(bId2).set({ batch_id: bId2, season_id: sId, simulation_period: 1, batch_type: 'WEEKLY', scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0', status: 'RUNNING' });
  await callFunction('processBatchChunk', { season_id: sId, batch_id: bId2, chunk_id: cId2, simulation_period: 1, batch_type: 'WEEKLY', chunk_index: 0, scenario_id: 'SCENARIO_REVIEW', scenario_version: '1.0', rule_version: '1.0' }, token);
  
  const logs = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  console.log(`Logs generated for same period but different batch types: ${logs.size}`);
  
  if (logs.size === 1) {
     console.log(`VULNERABILITY: Weekly batch was skipped because Monthly already set last_processed_period = 1.`);
  } else {
     console.log(`PASS: Weekly and Monthly processed independently.`);
  }
}

async function runTests() {
  const oidcToken = await getOidcToken();
  await verifyGoldenScenario(oidcToken);
  await verifyPlayerResolutionStability(oidcToken);
  await verifyIdempotencyIdentity(oidcToken);
  console.log("\nDone");
}

runTests().catch(e => { console.error(`[FATAL]`, e); process.exit(1); });
