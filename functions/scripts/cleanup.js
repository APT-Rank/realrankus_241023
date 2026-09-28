const admin = require('firebase-admin');

// Initialize the app. If you are running against production, use proper service account credentials.
const serviceAccount = require('../sa-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

const TARGET_COLLECTIONS = [
  'PLAY_SEASON',
  'PLAY_PRIMARY_SUPPLY',
  'PLAY_PROPERTY_OWNERSHIP',
  'PLAY_SECONDARY_LISTING',
  'PLAY_PROPERTY_TRANSACTION',
  'PLAY_DECISION_LOG',
  'PLAY_IDEMPOTENCY_LOGS',
  'RESEARCH_EVENTS',
  'RESEARCH_EVENTS_DLQ',
  'PLAY_BATCH',
  'PLAY_BATCH_CHUNKS',
  'PLAY_BATCH_CHECKPOINT',
  'PLAY_SEASON_CLOCK',
  'PLAY_TRANSACTION',
  'PLAY_PLAYER',
  'PLAY_PLAYER_STATE',
  'PLAY_PLAYER_ASSET',
  'PLAY_PLAYER_SEASON',
  'PLAY_PROPERTY_STATE',
  'PLAY_SECONDARY_ORDER'
];

async function deleteCollection(db, collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve(0);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function runCleanup() {
  console.log('=== CLEANUP DISCOVERY ===');
  console.log(`PROJECT: ${admin.app().options.projectId}`);
  
  let deletedTotal = 0;

  for (const collectionName of TARGET_COLLECTIONS) {
    console.log(`Checking collection: ${collectionName}`);
    try {
      const snap = await db.collection(collectionName).count().get();
      const count = snap.data().count;
      console.log(`Found ${count} documents in ${collectionName}`);
      
      if (count > 0) {
        console.log(`Deleting ${collectionName}...`);
        await deleteCollection(db, collectionName, 500);
        console.log(`Deleted ${collectionName}.`);
        deletedTotal += count;
      }
    } catch (e) {
      console.error(`Error processing ${collectionName}:`, e.message);
    }
  }

  console.log('=== CLEANUP EXECUTION COMPLETE ===');
  console.log(`Total documents deleted: ${deletedTotal}`);

  // Check Protected
  try {
    const pmSnap = await db.collection('PLAY_PROPERTY_MASTER').count().get();
    console.log(`Protected Property Master documents: ${pmSnap.data().count}`);
  } catch(e) {
    console.error('Could not verify PLAY_PROPERTY_MASTER');
  }
}

runCleanup().then(() => {
  console.log('Done.');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
