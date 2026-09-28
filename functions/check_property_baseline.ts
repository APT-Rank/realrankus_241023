import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'sa-key.json');
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'aptrank-cc61b'
  });
}

const db = admin.firestore();

async function checkBaseline() {
  console.log('[+] Fetching Property Master baseline...');
  const snapshot = await db.collection('PLAY_PROPERTY_MASTER').get();
  
  let total = 0;
  let normal = 0;
  let incomplete = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    total++;
    if (data.property_status === 'NORMAL') normal++;
    else if (data.property_status === 'INCOMPLETE') incomplete++;
  }

  console.log(`Total Property Master = ${total}`);
  console.log(`NORMAL = ${normal}`);
  console.log(`INCOMPLETE = ${incomplete}`);
  
  if (total > 0) {
    console.log(snapshot.docs[0].data());
  }
}

checkBaseline().catch(console.error);
