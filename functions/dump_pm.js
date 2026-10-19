// READ-ONLY: Dump all PROPERTY_MASTER documents for investigation
// NO WRITES, NO MODIFICATIONS
const admin = require('firebase-admin');
process.env.GCLOUD_PROJECT = 'aptrank-cc61b';
process.env.GOOGLE_CLOUD_PROJECT = 'aptrank-cc61b';
admin.initializeApp({ projectId: 'aptrank-cc61b' });
const db = admin.firestore();
db.settings({ projectId: 'aptrank-cc61b' });

async function main() {
  const snap = await db.collection('PLAY_PROPERTY_MASTER').get();
  console.log('TOTAL_COUNT: ' + snap.size);
  
  const docs = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    docs.push({
      document_id: doc.id,
      property_id: d.property_id || '',
      complex_id: d.complex_id || '',
      complex_name: d.complex_name || '',
      address: d.address || '',
      household_count: d.household_count || 0,
      property_status: d.property_status || '',
      tradable: d.tradable,
      representative_area: d.representative_area || '',
      initial_price: d.initial_price || 0,
      source_file: d.source_file || '',
      snapshot_version: d.snapshot_version || '',
      created_at: d.created_at ? d.created_at.toDate().toISOString() : '',
      updated_at: d.updated_at ? d.updated_at.toDate().toISOString() : '',
    });
  }
  
  docs.sort(function(a, b) { return a.document_id.localeCompare(b.document_id); });
  
  console.log('\n=== ALL DOCUMENT IDS ===');
  for (var i = 0; i < docs.length; i++) {
    var d = docs[i];
    console.log((i+1) + ': ' + d.document_id + ' | ' + d.property_status + ' | tradable=' + d.tradable + ' | ' + d.complex_name + ' | created=' + d.created_at);
  }
  
  var statusMap = {};
  docs.forEach(function(d) {
    statusMap[d.property_status] = (statusMap[d.property_status] || 0) + 1;
  });
  console.log('\n=== STATUS BREAKDOWN ===');
  console.log(JSON.stringify(statusMap));
}

main().catch(console.error);
