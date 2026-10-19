const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'sa-key.json');
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'aptrank-cc61b'
  });
}

const db = admin.firestore();

async function run() {
  const snap = await db.collection('PLAY_PROPERTY_MASTER').get();
  console.log(`TOTAL_COUNT: ${snap.size}`);
  
  const docs = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    if (d.complex_name && d.address) {
       docs.push(d);
    }
  }
  
  fs.writeFileSync(path.join(__dirname, 'suji_properties.json'), JSON.stringify(docs, null, 2));
  console.log('Saved to suji_properties.json');
}

run().catch(console.error);
