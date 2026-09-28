const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('d:/APT-Rank_Git/functions/sa-key.json')),
  projectId: 'aptrank-cc61b'
});
admin.firestore().collection('PLAY_SEASON')
  .where('season_id', '>=', 'S_AI1_L10_')
  .where('season_id', '<', 'S_AI1_L10_\uf8ff')
  .orderBy('season_id', 'desc')
  .limit(1).get().then(snap => {
    console.log(snap.docs[0].id);
    process.exit(0);
});
