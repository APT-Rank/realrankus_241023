import * as admin from 'firebase-admin';
const fetch = require('node-fetch');
const { GoogleAuth } = require('google-auth-library');

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

async function testConcurrency() {
  const seasonId = `season_${Date.now()}`;
  console.log(`\n========================================`);
  console.log(`[+] Starting Concurrency Test for season: ${seasonId}`);
  
  // 1. Setup
  await db.collection('PLAY_SEASON').doc(seasonId).set({
    season_id: seasonId,
    status: 'ACTIVE',
    clock_status: 'INITIAL',
    transaction_status: 'NORMAL',
    current_simulation_period: 0
  });

  const p1 = `p1_${Date.now()}`;
  await db.collection('PLAY_PLAYER').doc(p1).set({ season_id: seasonId, status: 'ACTIVE' });
  await db.collection('PLAY_PLAYER_ASSET').doc(p1).set({
    season_id: seasonId, cash_total: 700000000, cash_available: 700000000, cash_locked: 0, last_processed_period: -1
  });

  const batchId = `${seasonId}_0_RENT`;
  const chunkId = `${batchId}_chunk_1`;
  await db.collection('PLAY_BATCH').doc(batchId).set({
    batch_id: batchId, season_id: seasonId, batch_type: 'RENT', simulation_period: 0, status: 'RUNNING'
  });
  await db.collection('PLAY_BATCH_CHUNKS').doc(chunkId).set({
    chunk_id: chunkId, batch_id: batchId, season_id: seasonId, status: 'PENDING'
  });

  // 2. Auth setup
  const auth = new GoogleAuth({ keyFilename: './sa-key.json' });
  const client = await auth.getIdTokenClient('https://asia-northeast3-aptrank-cc61b.cloudfunctions.net/processBatchChunk');
  const headers = await client.getRequestHeaders();
  
  // 3. Fire 5 requests concurrently
  console.log(`[+] Firing 5 concurrent requests to processBatchChunk...`);
  const reqs = [];
  for (let i = 0; i < 5; i++) {
    reqs.push(fetch(`${BASE_URL}/processBatchChunk`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { season_id: seasonId, batch_id: batchId, chunk_id: chunkId, simulation_period: 0 } })
    }).then(async (r: any) => {
      const text = await r.text();
      return { status: r.status, trace: r.headers.get('x-cloud-trace-context'), body: text };
    }));
  }

  const results = await Promise.all(reqs);
  console.log(`\n[+] Concurrency Results:`);
  results.forEach((r: any, i: number) => {
    console.log(`Req ${i+1} -> HTTP ${r.status} | Trace: ${r.trace} | Body: ${r.body.substring(0, 100)}`);
  });

  // 4. Verify Database
  console.log(`\n[+] Verifying Database...`);
  const assetDoc = await db.collection('PLAY_PLAYER_ASSET').doc(p1).get();
  const asset = assetDoc.data() || {};
  console.log(`last_processed_period: ${asset.last_processed_period} (Expected: 0)`);
  console.log(`last_processed_batch_id: ${asset.last_processed_batch_id} (Expected: ${batchId})`);
  console.log(`cash_total: ${asset.cash_total} (Expected: 700000000)`);
  
  process.exit(0);
}

testConcurrency().catch(e => {
  console.error('\n[FATAL ERROR]', e);
  process.exit(1);
});
