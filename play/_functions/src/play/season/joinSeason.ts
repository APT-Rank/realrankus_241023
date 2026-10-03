import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTION_PLAYER, COLLECTION_PLAYER_ASSET } from '../common/db';
import { checkTransactionStatus } from '../common/utils';
import { PlayPlayer, PlayPlayerAsset } from '../common/types';
import { BASE_MONTHLY_LIVING_EXPENSE, STARTING_ANNUAL_INCOME } from '../batch/economicEngine';
import * as admin from 'firebase-admin';

export const joinSeason = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { season_id } = request.data;
  if (!season_id) {
    throw new HttpsError('invalid-argument', 'Missing season_id');
  }

  await checkTransactionStatus(season_id);

  const user_id = request.auth.uid;
  const player_id = `${season_id}_${user_id}`; // Unique per season

  const playerRef = db.collection(COLLECTION_PLAYER).doc(player_id);
  const assetRef = db.collection(COLLECTION_PLAYER_ASSET).doc(player_id);

  await db.runTransaction(async (t) => {
    const playerDoc = await t.get(playerRef);
    if (playerDoc.exists) {
      throw new HttpsError('already-exists', 'Player already joined this season');
    }

    const now = admin.firestore.Timestamp.now();

    const newPlayer: PlayPlayer = {
      player_id,
      user_id,
      season_id,
      status: 'ACTIVE',
      joined_at: now,
      last_active_at: now,
      created_at: now,
      updated_at: now,
    };

    const newAsset: PlayPlayerAsset = {
      player_id,
      season_id,
      cash_total: 700000000,
      cash_available: 700000000,
      cash_locked: 0,
      debt_total: 0,
      property_count: 0,
      financial_asset_total: 0,
      net_worth: 700000000,
      annual_income: STARTING_ANNUAL_INCOME,
      monthly_income: Math.round(STARTING_ANNUAL_INCOME / 12),
      monthly_living_expense: BASE_MONTHLY_LIVING_EXPENSE,
      monthly_loan_payment: 0,
      cumulative_inflation_factor: 1,
      last_processed_period: null,
      last_processed_batch_id: null,
      last_processed_at: null,
      created_at: now,
      updated_at: now,
    };

    t.set(playerRef, newPlayer);
    t.set(assetRef, newAsset);
  });

  return { player_id };
});
