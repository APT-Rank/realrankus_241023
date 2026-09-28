const admin = require('firebase-admin');
const { CloudTasksClient } = require('@google-cloud/tasks');

process.env.GCLOUD_PROJECT = 'aptrank-cc61b';
process.env.GOOGLE_CLOUD_PROJECT = 'aptrank-cc61b';
admin.initializeApp({ projectId: 'aptrank-cc61b' });
const db = admin.firestore();
db.settings({ projectId: 'aptrank-cc61b' });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('[1] PRE-CHECK');
  const snap = await db.collection('PLAY_PROPERTY_MASTER').get();
  let normal = 0, incomplete = 0;
  let foundFinal = false;
  snap.docs.forEach(d => {
    if (d.id === 'PROP_FINAL_1') foundFinal = true;
    if (d.data().property_status === 'NORMAL') normal++;
    if (d.data().property_status === 'INCOMPLETE') incomplete++;
  });
  
  console.log(`PRE-CHECK => Total: ${snap.size}, NORMAL: ${normal}, INCOMPLETE: ${incomplete}, PROP_FINAL_1: ${foundFinal}`);
  if (snap.size !== 209 || normal !== 200 || incomplete !== 9 || foundFinal) {
    console.error('PRE-CHECK FAILED! Mismatch detected. Exiting.');
    process.exit(1);
  }
  console.log('PRE-CHECK PASSED.');

  const seasonId = `S_REC_${Date.now()}`;
  const batchId = `B_REC_${Date.now()}`;
  console.log(`\n[2] Setting up mock Season (${seasonId}) and Batch (${batchId})`);

  await db.collection('PLAY_SEASON').doc(seasonId).set({
    season_id: seasonId,
    status: 'ACTIVE',
    current_simulation_period: 1,
    transaction_status: 'TRANSACTION_OPEN',
    updated_at: admin.firestore.Timestamp.now()
  });

  await db.collection('PLAY_BATCH').doc(batchId).set({
    batch_id: batchId,
    season_id: seasonId,
    simulation_period: 1,
    batch_type: 'MONTHLY_INCOME',
    scenario_id: 'DEFAULT',
    scenario_version: '1.0',
    rule_version: '1.0',
    expected_player_count: 0,
    chunk_count: 0,
    completed_chunks: 0,
    failed_chunks: 0,
    status: 'COMPLETED',
    created_at: admin.firestore.Timestamp.now(),
    updated_at: admin.firestore.Timestamp.now()
  });

  console.log('\n[3] Triggering runReconciliation via Cloud Tasks');
  const tasksClient = new CloudTasksClient();
  const project = 'aptrank-cc61b';
  const location = 'asia-northeast3';
  
  const advUrl = `https://${location}-${project}.cloudfunctions.net/runReconciliation`;
  const advTask = {
    httpRequest: {
      httpMethod: 'POST',
      url: advUrl,
      headers: { 'Content-Type': 'application/json' },
      body: Buffer.from(JSON.stringify({ data: { season_id: seasonId, batch_id: batchId } })).toString('base64'),
      oidcToken: {
        serviceAccountEmail: `${project}@appspot.gserviceaccount.com`,
        audience: advUrl
      }
    }
  };
  
  await tasksClient.createTask({ parent: tasksClient.queuePath(project, location, 'reconciliation-queue'), task: advTask });
  console.log(`Task enqueued! Waiting for 15 seconds to allow functions to process... (Season: ${seasonId}, Batch: ${batchId})`);
  
  await sleep(15000);
  
  console.log('\n[4] POST-CHECK: Season Clock and Reconciliation Status');
  const seasonDoc = await db.collection('PLAY_SEASON').doc(seasonId).get();
  const sData = seasonDoc.data();
  
  console.log(`Season transaction_status: ${sData.transaction_status}`);
  console.log(`Season current_simulation_period: ${sData.current_simulation_period}`);
  
  if (sData.transaction_status === 'TRANSACTION_OPEN' && sData.current_simulation_period === 2) {
    console.log('\n>>> SUCCESS: Reconciliation passed and Season Clock advanced (1 -> 2)!');
  } else {
    console.error('\n>>> FAILURE: Season Clock did not advance correctly or transaction is paused.');
  }
}

main().catch(console.error);
