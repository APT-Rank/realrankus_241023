const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(fs.readFileSync('d:/APT-Rank_Git/functions/sa-key.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'aptrank-cc61b'
  });
}

const db = admin.firestore();

async function run() {
  const snap = await db.collection('PLAY_PROPERTY_MASTER').get();
  
  const docs = [];
  for (const doc of snap.docs) {
    if (doc.id !== 'PROP_FINAL_1') { // Skip stale test data
      docs.push(doc.data());
    }
  }
  
  fs.writeFileSync('d:/APT-Rank_Git/data/suji_properties.json', JSON.stringify(docs, null, 2));
  console.log('Saved 209 documents');
}

run().catch(console.error);
