import * as admin from 'firebase-admin';
const serviceAccount = require('./sa-key.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'aptrank-cc61b'
  });
}
const db = admin.firestore();

async function reprocess() {
  const dlqSnap = await db.collection('RESEARCH_EVENTS_DLQ').get();
  console.log(`Found ${dlqSnap.size} events in DLQ.`);
  let recoveredCount = 0;
  for (const doc of dlqSnap.docs) {
    const data = doc.data();
    const event = data.original_event;
    const docId = doc.id; // It should be identical to the deterministic ID
    
    await db.collection('RESEARCH_EVENTS').doc(docId).set({
      ...event,
      created_at: data.failed_at,
      status: 'RECOVERED_FROM_DLQ'
    });
    await doc.ref.delete();
    console.log('Recovered:', docId);
    recoveredCount++;
  }
  console.log(`Successfully recovered ${recoveredCount} events.`);
}

reprocess().catch(console.error);
