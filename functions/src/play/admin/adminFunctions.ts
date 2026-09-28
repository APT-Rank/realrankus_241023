import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTION_SEASON } from '../common/db';
import * as admin from 'firebase-admin';

export const pauseTransactions = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Admin only');
  // Admin check here

  const { season_id } = request.data;
  await db.collection(COLLECTION_SEASON).doc(season_id).update({
    transaction_status: 'TRANSACTION_PAUSED',
    updated_at: admin.firestore.Timestamp.now()
  });

  return { status: 'PAUSED' };
});

export const resumeTransactions = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Admin only');
  // Admin check here

  const { season_id } = request.data;
  await db.collection(COLLECTION_SEASON).doc(season_id).update({
    transaction_status: 'NORMAL',
    updated_at: admin.firestore.Timestamp.now()
  });

  return { status: 'RESUMED' };
});

export const healthCheck = onCall(async (request) => {
  const { season_id } = request.data;
  if (!season_id) {
    throw new HttpsError('invalid-argument', 'Missing season_id');
  }

  const seasonDoc = await db.collection(COLLECTION_SEASON).doc(season_id).get();
  const data = seasonDoc.data();

  return {
    status: 'OK',
    season: data?.status || 'UNKNOWN',
    clock: data?.clock_status || 'UNKNOWN',
    transaction: data?.transaction_status || 'UNKNOWN',
    current_period: data?.current_simulation_period,
  };
});
