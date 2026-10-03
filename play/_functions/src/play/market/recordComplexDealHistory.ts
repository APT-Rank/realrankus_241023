import { Timestamp } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import {
  db,
  COLLECTION_PROPERTY_MASTER,
  COLLECTION_PROPERTY_TRANSACTION
} from '../common/db';

export const recordComplexDealHistory = onDocumentCreated(
  { document: `${COLLECTION_PROPERTY_TRANSACTION}/{transactionId}`, retry: true },
  async (event) => {
    const transactionSnapshot = event.data;
    if (!transactionSnapshot) return;

    const transactionData = transactionSnapshot.data();
    if (transactionData.status !== 'COMPLETED' || transactionData.property_id == null) return;

    const propertyId = String(transactionData.property_id);
    let propertySnapshot = await db.collection(COLLECTION_PROPERTY_MASTER).doc(propertyId).get();
    if (!propertySnapshot.exists || !propertySnapshot.data()?.complex_id) {
      const matchingProperty = await db.collection(COLLECTION_PROPERTY_MASTER)
        .where('property_id', '==', transactionData.property_id)
        .limit(1)
        .get();
      if (!matchingProperty.empty) propertySnapshot = matchingProperty.docs[0];
    }

    const property = propertySnapshot.data();
    const complexId = String(property?.complex_id || property?.property_id || propertyId).trim();
    if (!complexId) throw new Error(`Could not resolve complex for property ${propertyId}`);

    const transactionTime = transactionData.created_at instanceof Timestamp
      ? transactionData.created_at
      : Timestamp.fromDate(new Date(event.time));
    const dealHistoryRef = db.collection(COLLECTION_PROPERTY_MASTER)
      .doc(complexId)
      .collection('deal_history')
      .doc(transactionSnapshot.id);
    const dealHistoryRecord = {
      buyer: transactionData.buyer_player_id ? String(transactionData.buyer_player_id) : '없음',
      seller: transactionData.seller_player_id ? String(transactionData.seller_player_id) : '없음',
      deal_at: transactionTime,
      deal_at_sort: transactionTime,
      deal_price: Number(transactionData.price) || 0,
      transaction_id: transactionSnapshot.id,
      property_id: propertyId,
      season_id: transactionData.season_id || null,
      transaction_type: transactionData.transaction_type || null
    };

    await db.runTransaction(async (firestoreTransaction) => {
      const existingRecord = await firestoreTransaction.get(dealHistoryRef);
      if (!existingRecord.exists) firestoreTransaction.create(dealHistoryRef, dealHistoryRecord);
    });
  }
);
