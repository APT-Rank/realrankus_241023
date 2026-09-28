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

let currentToken = '';
let tokenExpiration = 0;

async function getAuthToken(uid: string) {
  if (Date.now() < tokenExpiration - 5 * 60 * 1000) {
    return currentToken; // Valid for at least 5 more minutes
  }
  console.log(`\n[TOKEN] Refreshing ID Token for ${uid}...`);
  const customToken = await admin.auth().createCustomToken(uid);
  const apiKey = await getApiKey();
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  const data = await res.json();
  currentToken = data.idToken;
  tokenExpiration = Date.now() + parseInt(data.expiresIn, 10) * 1000;
  return currentToken;
}

async function callFunction(name: string, data: any) {
  const token = await getAuthToken('admin_user');
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
  const sId = 'S_GATE5_1790412049183';
  const s = (await dbAdmin.collection('PLAY_SEASON').doc(sId).get()).data()!;
  
  await assert(s.current_simulation_period === 297, `Current period is ${s.current_simulation_period}, expected 297`);
  
  const bId296 = `${sId}_296_MONTHLY`;
  const batch296 = (await dbAdmin.collection('PLAY_BATCH').doc(bId296).get()).data();
  await assert(!!(batch296 && batch296.status === 'COMPLETED'), 'P296 Batch is not COMPLETED');
  
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
  console.log('[PREFLIGHT PASS] State is perfectly aligned for P297 Resume');
}

const CHECKPOINTS = [300, 330, 360];

async function runGate5Exec002() {
  await preflight();
  
  const sId = 'S_GATE5_1790412049183';
  const evidence: any = { season_id: sId, preflight: { property_master: 209, normal: 200, incomplete: 9 }, periods: [] };

  console.log(`[GATE 5 EXEC-002] Resuming 360-Period Verification from P297...`);

  // Check P297 safety
  const bId297 = `${sId}_297_MONTHLY`;
  const b297Doc = await dbAdmin.collection('PLAY_BATCH').doc(bId297).get();
  if (b297Doc.exists) {
    throw new Error(`[SAFETY CHECK] P297 Batch already exists! Cannot blindly resume. Status: ${b297Doc.data()?.status}`);
  }
  
  for (let period = 297; period <= 360; period++) {
    const bId = `${sId}_${period}_MONTHLY`;
    
    // Create batch
    await callFunction('createEconomicBatch', { season_id: sId, batch_type: 'MONTHLY' });
    
    // Dispatch
    await callFunction('dispatchBatchChunks', { batch_id: bId, chunk_size: 100 });
    
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
        sample_asset: assets[0]
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
  
  fs.writeFileSync(path.join(__dirname, 'gate5_exec002_evidence.json'), JSON.stringify(evidence, null, 2));
  console.log(`\n========================================`);
  console.log(`[+] GATE 5 EXEC-002 Completed Remaining Periods (P297-P360) Successfully!`);
  console.log(`========================================\n`);
}

runGate5Exec002().catch(e => {
  console.error('[FATAL]', e);
  process.exit(1);
});
