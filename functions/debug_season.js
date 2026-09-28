const admin = require('firebase-admin');
const sa = require('./sa-key.json');
admin.initializeApp({credential: admin.credential.cert(sa), projectId: 'aptrank-cc61b'});
const db = admin.firestore();
(async () => {
  const s = await db.collection('PLAY_BATCH_CHUNKS').where('season_id', '==', 'S_CC_1790420369559').get();
  console.log('Chunks:', s.docs.map(d=>d.data()));
  const b = await db.collection('PLAY_BATCH').where('season_id', '==', 'S_CC_1790420369559').get();
  console.log('Batches:', b.docs.map(d=>d.data()));
  const c = await db.collection('PLAY_SEASON').doc('S_CC_1790420369559').get();
  const sl = await db.collection('PLAY_SYSTEM_LOG').where('season_id', '==', 'S_CC_1790420369559').get();
  console.log('System Logs:', sl.docs.map(d=>d.data()));
  const r = await db.collection('PLAY_RECONCILIATION_REPORT').where('season_id', '==', 'S_CC_1790420369559').get();
  console.log('Recon:', r.docs.map(d=>d.data()));
  const p = await db.collection('PLAY_SEASON').doc('S_CC_1790420369559_p1').get();
  console.log('Player Asset:', p.data());
  process.exit();
})();
