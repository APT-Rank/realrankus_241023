const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;
const applyChanges = process.argv.includes('--apply');

function toInitialDealTimestamp(value) {
  if (value instanceof Timestamp) return value;
  if (value instanceof Date && Number.isFinite(value.getTime())) return Timestamp.fromDate(value);
  if (typeof value === 'number' && Number.isFinite(value)) {
    const numericText = String(Math.trunc(value));
    const dateText = /^\d{8}$/.test(numericText)
      ? `${numericText.slice(0, 4)}-${numericText.slice(4, 6)}-${numericText.slice(6, 8)}`
      : /^\d{6}$/.test(numericText)
        ? `${numericText.slice(0, 4)}-${numericText.slice(4, 6)}-01`
        : null;
    const date = dateText ? new Date(dateText) : new Date(value);
    return Number.isFinite(date.getTime()) ? Timestamp.fromDate(date) : null;
  }
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = value.trim().replace(/[./]/g, '-');
  const dateText = /^\d{6}$/.test(normalized)
    ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-01`
    : /^\d{8}$/.test(normalized)
      ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`
      : normalized;
  const date = new Date(dateText);
  return Number.isFinite(date.getTime()) ? Timestamp.fromDate(date) : null;
}

async function main() {
  const masterSnapshot = await db.collection('PLAY_PROPERTY_MASTER').get();
  const candidates = masterSnapshot.docs.filter((document) => {
    const data = document.data();
    return String(data.complex_id || '') === document.id
      && data.initial_price !== undefined;
  });
  let invalidInitialDates = 0;
  const initialRecords = candidates.map((document) => {
    const master = document.data();
    const dealAtSort = toInitialDealTimestamp(master.initial_price_date);
    if (!dealAtSort) invalidInitialDates += 1;
    return {
      ref: document.ref.collection('deal_history').doc('INITIAL'),
      data: {
        buyer: '없음',
        seller: '없음',
        deal_at: master.initial_price_date ?? null,
        deal_at_sort: dealAtSort || Timestamp.fromMillis(0),
        deal_price: master.initial_price,
        record_type: 'INITIAL',
        source_initial_price_date: master.initial_price_date ?? null,
        created_at: Timestamp.now()
      }
    };
  });

  let existingCount = 0;
  let plannedCount = 0;
  let createdCount = 0;
  let writeBatch = db.batch();
  let pendingWrites = 0;
  for (let offset = 0; offset < initialRecords.length; offset += 250) {
    const records = initialRecords.slice(offset, offset + 250);
    const snapshots = await db.getAll(...records.map((record) => record.ref));
    for (let index = 0; index < records.length; index += 1) {
      if (snapshots[index].exists) {
        existingCount += 1;
        continue;
      }
      plannedCount += 1;
      if (!applyChanges) continue;
      writeBatch.create(records[index].ref, records[index].data);
      pendingWrites += 1;
      createdCount += 1;
      if (pendingWrites === 450) {
        await writeBatch.commit();
        writeBatch = db.batch();
        pendingWrites = 0;
      }
    }
  }
  if (pendingWrites) await writeBatch.commit();

  console.log(JSON.stringify({
    mode: applyChanges ? 'apply' : 'dry-run',
    masterDocuments: masterSnapshot.size,
    complexCandidates: candidates.length,
    existingInitialRecords: existingCount,
    invalidInitialDates,
    recordsToCreate: plannedCount,
    recordsCreated: createdCount
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
