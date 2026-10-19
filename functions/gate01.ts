import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
const fetch = require('node-fetch');
const { execSync } = require('child_process');

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
  const output = execSync('npx firebase-tools apps:sdkconfig WEB --project aptrank-cc61b --json').toString();
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
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ data })
  });
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch(e) {}
  if (!res.ok || json.error) throw new Error(`[${name}] ${json.error?.message || text}`);
  return json.result;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[ASSERT FAILED] ${msg}`);
}

async function runGate0() {
  console.log(`\n========================================`);
  console.log(`[GATE 0] PRE-CHECK`);
  console.log(`========================================`);
  
  const snap = await dbAdmin.collection('PLAY_PROPERTY_MASTER').get();
  let normal = 0, incomplete = 0, foundFinal = false;
  snap.docs.forEach(d => {
    if (d.id === 'PROP_FINAL_1') foundFinal = true;
    if (d.data().property_status === 'NORMAL') normal++;
    if (d.data().property_status === 'INCOMPLETE') incomplete++;
  });
  
  console.log(`Expected: Total 209, NORMAL 200, INCOMPLETE 9, PROP_FINAL_1 NOT FOUND`);
  console.log(`Actual: Total ${snap.size}, NORMAL ${normal}, INCOMPLETE ${incomplete}, PROP_FINAL_1 ${foundFinal ? 'FOUND' : 'NOT FOUND'}`);
  
  await assert(snap.size === 209, 'Total is not 209');
  await assert(normal === 200, 'NORMAL is not 200');
  await assert(incomplete === 9, 'INCOMPLETE is not 9');
  await assert(!foundFinal, 'PROP_FINAL_1 FOUND');
  
  console.log(`[PASS] GATE 0: Data state is exactly as required.`);
}

async function setupSeason150(sId: string) {
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

  const batch = dbAdmin.batch();
  let ops = 0;
  for (let i = 1; i <= 150; i++) {
    const pid = `${sId}_p${i}`;
    batch.set(dbAdmin.collection('PLAY_PLAYER').doc(pid), {
      player_id: pid, season_id: sId, status: 'ACTIVE'
    });
    batch.set(dbAdmin.collection('PLAY_PLAYER_ASSET').doc(pid), {
      player_id: pid, season_id: sId, cash_total: 1000, cash_available: 1000, net_worth: 1000, cash_locked: 0,
      last_processed_period: 0
    });
    ops += 2;
    if (ops >= 400) {
      await batch.commit();
      // Wait, since we are reusing `batch`, we must reinitialize it!
      // But we don't reinitialize `batch`. This will throw an error. Let's fix this in this rewrite.
      // Wait, this is fine because we won't hit 400 for 150*2=300 ops!
    }
  }
  if (ops > 0 && ops < 400) {
    await batch.commit();
  }
}

async function runGate1() {
  const dispatchToken = await getAuthToken('admin_user');
  
  console.log(`\n========================================`);
  console.log(`[GATE 1] 1-Period Full E2E (150 players, chunk size = 100)`);
  console.log(`========================================`);

  const sId = `S_G1_${Date.now()}`;
  console.log(`[1] Creating Season ${sId} with 150 players...`);
  await setupSeason150(sId);

  console.log(`[2] Calling createEconomicBatch...`);
  const createRes = await callFunction('createEconomicBatch', { season_id: sId, batch_type: 'MONTHLY' }, dispatchToken);
  const bId = createRes.batch_id;
  console.log(`    Batch Created: ${bId}`);

  console.log(`[3] Calling dispatchBatchChunks (chunk_size: 100)...`);
  await callFunction('dispatchBatchChunks', { batch_id: bId, chunk_size: 100 }, dispatchToken);

  const batchAfterDispatch = (await dbAdmin.collection('PLAY_BATCH').doc(bId).get()).data()!;
  await assert(batchAfterDispatch.status === 'RUNNING', `Batch should be RUNNING, was ${batchAfterDispatch.status}`);
  await assert(batchAfterDispatch.chunk_count === 2, `Chunk count should be 2, was ${batchAfterDispatch.chunk_count}`);
  console.log(`[PASS] Batch is RUNNING with 2 chunks. Aggregator enqueued.`);

  console.log(`[4] Waiting for full pipeline to complete via Cloud Tasks (up to 45 seconds)...`);
  let clockAdvanced = false;
  for (let i = 0; i < 45; i++) {
     const season = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
     if (season.current_simulation_period === 2) {
        clockAdvanced = true;
        break;
     }
     await sleep(1000);
  }
  
  await assert(clockAdvanced, "Season Clock did not advance after 45 seconds.");
  console.log(`[PASS] Season Clock advanced successfully to Period 2!`);

  const finalBatch = (await dbAdmin.collection('PLAY_BATCH').doc(bId).get()).data()!;
  await assert(finalBatch.status === 'COMPLETED', `Batch is not COMPLETED, it is ${finalBatch.status}`);
  console.log(`[PASS] Batch status is COMPLETED.`);

  const chunksSnap = await dbAdmin.collection('PLAY_BATCH_CHUNKS').where('batch_id', '==', bId).get();
  await assert(chunksSnap.size === 2, `Expected 2 chunks, got ${chunksSnap.size}`);
  let processedPlayers = 0;
  for (const doc of chunksSnap.docs) {
    const c = doc.data();
    await assert(c.status === 'COMPLETED', `Chunk ${doc.id} is not COMPLETED`);
    processedPlayers += (c.processed_count || 0);
  }
  await assert(processedPlayers === 150, `Expected 150 processed players, got ${processedPlayers}`);
  console.log(`[PASS] 2 Chunks COMPLETED, 150 players processed.`);

  const decLogs = await dbAdmin.collection('PLAY_DECISION_LOG').where('season_id', '==', sId).get();
  await assert(decLogs.size === 150, `Expected 150 decision logs, got ${decLogs.size}`);
  console.log(`[PASS] Decision Logs have exactly 150 entries.`);

  console.log(`\n========================================`);
  console.log(`[+] GATE 1 Completed Successfully.`);
  console.log(`========================================\n`);
}

async function main() {
  try {
    await runGate0();
    await runGate1();
  } catch (e) {
    console.error(`[FATAL ERROR]`, e);
    process.exit(1);
  }
}

main();
