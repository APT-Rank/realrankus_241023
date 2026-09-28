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

async function preflight() {
  const pmSnap = await dbAdmin.collection('PLAY_PROPERTY_MASTER').get();
  let normal = 0, incomplete = 0;
  for (const doc of pmSnap.docs) {
    if (doc.id === 'PROP_FINAL_1') throw new Error('PROP_FINAL_1 found');
    const p = doc.data();
    if (p.property_status === 'NORMAL') normal++;
    else if (p.property_status === 'INCOMPLETE') incomplete++;
  }
  await assert(pmSnap.size === 209, `Property Master total = ${pmSnap.size} != 209`);
  await assert(normal === 200, `NORMAL count = ${normal} != 200`);
  await assert(incomplete === 9, `INCOMPLETE count = ${incomplete} != 9`);
  console.log('[PREFLIGHT PASS] Property Master is exactly 209');
}

async function setupSeason(sId: string, players: number = 150) {
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

  const firestoreBatches = [];
  let currentBatch = dbAdmin.batch();
  let ops = 0;

  for (let i = 1; i <= players; i++) {
    const pid = `${sId}_p${i}`;
    currentBatch.set(dbAdmin.collection('PLAY_PLAYER').doc(pid), {
      player_id: pid, season_id: sId, status: 'ACTIVE'
    });
    currentBatch.set(dbAdmin.collection('PLAY_PLAYER_ASSET').doc(pid), {
      player_id: pid, season_id: sId, cash_total: 10000, cash_available: 10000, net_worth: 10000, cash_locked: 0,
      last_processed_period: 0
    });
    ops += 2;
    if (ops >= 490) {
      firestoreBatches.push(currentBatch.commit());
      currentBatch = dbAdmin.batch();
      ops = 0;
    }
  }
  if (ops > 0) firestoreBatches.push(currentBatch.commit());
  await Promise.all(firestoreBatches);
  console.log(`[SETUP] Created season ${sId} with ${players} players`);
}

const CHECKPOINTS = [1, 30, 60, 90, 120, 180, 240, 300, 360];

async function runGate5() {
  await preflight();
  const token = await getAuthToken('admin_user');
  
  const sId = `S_GATE5_${Date.now()}`;
  await setupSeason(sId, 150);
  
  const evidence: any = { season_id: sId, preflight: { property_master: 209, normal: 200, incomplete: 9 }, periods: [] };

  console.log(`[GATE 5] Starting 360-Period Verification...`);
  
  for (let period = 1; period <= 360; period++) {
    const bId = `${sId}_${period}_MONTHLY`;
    
    // Create batch
    await callFunction('createEconomicBatch', { season_id: sId, batch_type: 'MONTHLY' }, token);
    
    // Dispatch
    await callFunction('dispatchBatchChunks', { batch_id: bId, chunk_size: 100 }, token);
    
    // Poll for period advance
    let advanced = false;
    let waitIters = 0;
    while (!advanced && waitIters < 120) {
      await sleep(2000);
      const s = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
      if (s.transaction_status === 'TRANSACTION_PAUSED') {
        throw new Error(`TRANSACTION_PAUSED at period ${period}`);
      }
      if (s.current_simulation_period > period) {
        advanced = true;
      }
      waitIters++;
    }
    
    if (!advanced) {
      throw new Error(`Timeout waiting for period ${period} to advance.`);
    }

    // Record period evidence
    const batch = (await dbAdmin.collection('PLAY_BATCH').doc(bId).get()).data()!;
    const chunks = (await dbAdmin.collection('PLAY_BATCH_CHUNKS').where('batch_id', '==', bId).get()).docs.map(d => d.data());
    
    let processedPlayers = 0;
    chunks.forEach(c => processedPlayers += c.processed_count);
    
    const decisions = (await dbAdmin.collection('PLAY_DECISION_LOG')
      .where('season_id', '==', sId)
      .where('simulation_period', '==', period).get()).size;

    evidence.periods.push({
      period,
      batch_id: bId,
      expected_players: batch.expected_player_count,
      processed: processedPlayers,
      chunk_count: chunks.length,
      batch_status: batch.status,
      decision_logs: decisions,
      clock_after: period + 1
    });

    if (CHECKPOINTS.includes(period)) {
      console.log(`[CHECKPOINT] Collecting state at period ${period}...`);
      const assets = (await dbAdmin.collection('PLAY_PLAYER_ASSET').where('season_id', '==', sId).get()).docs.map(d => d.data());
      
      let allValid = true;
      let anomalies = [];
      for (const a of assets) {
        if (a.cash_total !== a.cash_available + a.cash_locked) {
          allValid = false;
          anomalies.push(`Asset mismatch: ${a.player_id}`);
        }
        if (a.cash_total < 0) {
          allValid = false;
          anomalies.push(`Negative cash: ${a.player_id}`);
        }
        if (a.last_processed_period !== period) {
          allValid = false;
          anomalies.push(`Period mismatch: ${a.player_id} is ${a.last_processed_period}`);
        }
      }
      
      evidence.periods[evidence.periods.length - 1].checkpoint = {
        total_assets: assets.length,
        invariants_valid: allValid,
        anomalies,
        sample_asset: assets[0] // Save memory by not dumping all 150
      };
      
      if (!allValid) {
        throw new Error(`Invariant violations found at checkpoint ${period}: \n${anomalies.join('\n')}`);
      }
    }
    
    if (period % 10 === 0) {
      console.log(`... Period ${period} completed`);
    }
  }

  const finalSeason = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
  await assert(finalSeason.current_simulation_period === 361, `Expected clock = 361, got ${finalSeason.current_simulation_period}`);
  
  fs.writeFileSync(path.join(__dirname, 'gate5_evidence.json'), JSON.stringify(evidence, null, 2));
  console.log(`\n========================================`);
  console.log(`[+] GATE 5 Completed 360 Periods Successfully!`);
  console.log(`========================================\n`);
}

runGate5().catch(e => {
  console.error('[FATAL]', e);
  process.exit(1);
});
