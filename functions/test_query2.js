const admin = require('firebase-admin');
const serviceAccount = require('./sa-key.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'aptrank-cc61b' });
admin.firestore().collection('PLAY_SECONDARY_ORDER').where('season_id', '==', 'S_FINAL_1790340205069').get().then(s => {
  console.log(s.docs.map(d=>d.data()));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
