const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, 'sa-key.json'), 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'aptrank-cc61b'
  });
}

const db = admin.firestore();

async function check() {
  const sId = 'S_GATE6_1790418681899';
  const s = await db.collection('PLAY_SEASON').doc(sId).get();
  console.log('Season:', s.data());
  const b = await db.collection('PLAY_BATCH').doc(sId + '_2_MONTHLY').get();
  console.log('Batch:', b.data());
  const c = await db.collection('PLAY_BATCH_CHUNKS').where('batch_id', '==', sId + '_2_MONTHLY').get();
  console.log('Chunks:', c.docs.map(d => d.data()));
}

check().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
