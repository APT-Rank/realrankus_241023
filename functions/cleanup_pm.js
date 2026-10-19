const admin = require('firebase-admin');
process.env.GCLOUD_PROJECT = 'aptrank-cc61b';
process.env.GOOGLE_CLOUD_PROJECT = 'aptrank-cc61b';
admin.initializeApp({ projectId: 'aptrank-cc61b' });
const db = admin.firestore();
db.settings({ projectId: 'aptrank-cc61b' });

async function main() {
  console.log('[1] Starting PRE-CHECK...');
  const docRef = db.collection('PLAY_PROPERTY_MASTER').doc('PROP_FINAL_1');
  const doc = await docRef.get();
  
  if (!doc.exists) {
    console.error('PRE-CHECK FAILED: PROP_FINAL_1 NOT FOUND');
    process.exit(1);
  }

  const data = doc.data();
  if (doc.id !== 'PROP_FINAL_1' || data.property_id !== 'PROP_FINAL_1' || data.season_id !== 'S_FINAL_1790340397852') {
    console.error('PRE-CHECK FAILED: Mismatch in conditions');
    console.error(`doc.id: ${doc.id}`);
    console.error(`property_id: ${data.property_id}`);
    console.error(`season_id: ${data.season_id}`);
    process.exit(1);
  }
  
  console.log('PRE-CHECK PASSED. Proceeding to DELETE.');
  
  // DELETE
  await docRef.delete();
  console.log('[2] DELETED PROP_FINAL_1.');
  
  // POST-CHECK
  console.log('\n[3] Starting POST-CHECK...');
  const snap = await db.collection('PLAY_PROPERTY_MASTER').get();
  
  let normalCount = 0;
  let incompleteCount = 0;
  let otherCount = 0;
  let propFinal1Found = false;
  
  const testPatterns = [];
  
  for (const doc of snap.docs) {
    if (doc.id === 'PROP_FINAL_1') {
      propFinal1Found = true;
    }
    
    const d = doc.data();
    if (d.property_status === 'NORMAL') normalCount++;
    else if (d.property_status === 'INCOMPLETE') incompleteCount++;
    else otherCount++;
    
    // Check patterns in ID, property_id, season_id
    const id = doc.id || '';
    const pid = d.property_id || '';
    const sid = d.season_id || '';
    
    if (
      id.startsWith('PROP_') || id.startsWith('S_FINAL_') || id.startsWith('TEST_') || id.startsWith('E2E_') ||
      pid.startsWith('PROP_') || pid.startsWith('S_FINAL_') || pid.startsWith('TEST_') || pid.startsWith('E2E_') ||
      sid.startsWith('PROP_') || sid.startsWith('S_FINAL_') || sid.startsWith('TEST_') || sid.startsWith('E2E_')
    ) {
      testPatterns.push({ id, property_id: pid, season_id: sid });
    }
  }
  
  console.log(`PLAY_PROPERTY_MASTER total = ${snap.size}`);
  console.log(`NORMAL = ${normalCount}`);
  console.log(`INCOMPLETE = ${incompleteCount}`);
  console.log(`OTHER = ${otherCount}`);
  console.log(`PROP_FINAL_1 = ${propFinal1Found ? 'FOUND' : 'NOT FOUND'}`);
  
  if (testPatterns.length > 0) {
    console.log('\n[4] FOUND TEST PATTERNS (READ-ONLY, NO DELETION):');
    console.log(JSON.stringify(testPatterns, null, 2));
  } else {
    console.log('\n[4] NO OTHER TEST PATTERNS FOUND.');
  }
}

main().catch(console.error);
