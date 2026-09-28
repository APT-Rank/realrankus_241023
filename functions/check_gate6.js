const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('./sa-key.json', 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'aptrank-cc61b'
});

async function check() {
  const sSnap = await admin.firestore().collection('PLAY_SEASON').get();
  for (const s of sSnap.docs) {
    if (s.id.startsWith('S_GATE6')) {
      console.log('Season', s.id, s.data());
      
      const batches = await admin.firestore().collection('PLAY_BATCH').where('season_id', '==', s.id).get();
      batches.docs.forEach(b => console.log(' Batch', b.id, b.data()));
      
      const chunks = await admin.firestore().collection('PLAY_BATCH_CHUNKS').where('season_id', '==', s.id).get();
      chunks.docs.forEach(c => console.log('  Chunk', c.id, c.data()));
    }
  }
}
check().then(() => process.exit(0));
