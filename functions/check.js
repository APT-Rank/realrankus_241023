const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('./sa-key.json')),
  projectId: 'aptrank-cc61b'
});
const db = admin.firestore();
async function check() {
  const s = await db.collection('PLAY_SEASON').doc('season_1790266495713').get();
  console.log('Period:', s.data().current_simulation_period);
  const b = await db.collection('PLAY_BATCH').doc('season_1790266495713_0_RENT').get();
  console.log('Batch Status:', b.data().status);
}
check().catch(console.error);
