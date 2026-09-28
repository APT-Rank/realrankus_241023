import { HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTION_SEASON } from './db';
import { PlaySeason } from './types';

export async function checkTransactionStatus(seasonId: string): Promise<void> {
  const seasonDoc = await db.collection(COLLECTION_SEASON).doc(seasonId).get();
  if (!seasonDoc.exists) {
    throw new HttpsError('not-found', 'Season not found');
  }
  
  const season = seasonDoc.data() as PlaySeason;
  if (season.transaction_status === 'TRANSACTION_PAUSED') {
    throw new HttpsError('unavailable', 'System paused: Transactions are currently disabled');
  }
}
