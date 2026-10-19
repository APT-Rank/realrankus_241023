// READ-ONLY: Get full details of the extra document PROP_FINAL_1
const admin = require('firebase-admin');
process.env.GCLOUD_PROJECT = 'aptrank-cc61b';
process.env.GOOGLE_CLOUD_PROJECT = 'aptrank-cc61b';
admin.initializeApp({ projectId: 'aptrank-cc61b' });
const db = admin.firestore();
db.settings({ projectId: 'aptrank-cc61b' });

async function main() {
  const doc = await db.collection('PLAY_PROPERTY_MASTER').doc('PROP_FINAL_1').get();
  if (!doc.exists) {
    console.log('DOCUMENT NOT FOUND');
    return;
  }
  console.log('=== PROP_FINAL_1 FULL DOCUMENT ===');
  const data = doc.data();
  var keys = Object.keys(data).sort();
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var v = data[k];
    if (v && typeof v === 'object' && v.toDate) {
      console.log(k + ': ' + v.toDate().toISOString());
    } else {
      console.log(k + ': ' + JSON.stringify(v));
    }
  }
}

main().catch(console.error);
