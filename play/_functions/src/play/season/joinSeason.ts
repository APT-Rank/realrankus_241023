import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTION_PLAYER, COLLECTION_PLAYER_ASSET, COLLECTION_SEASON } from '../common/db';
import { checkTransactionStatus } from '../common/utils';
import { PlayPlayer, PlayPlayerAsset, PlaySeason } from '../common/types';
import { getElapsedSimulationPeriods, getSeasonStartTimestamp } from './periodSchedule';
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
  const seasonRef = db.collection(COLLECTION_SEASON).doc(season_id);

  await db.runTransaction(async (t) => {
    const [playerDoc, seasonDoc] = await Promise.all([t.get(playerRef), t.get(seasonRef)]);
    if (playerDoc.exists) {
      throw new HttpsError('already-exists', 'Player already joined this season');
    }

    const now = admin.firestore.Timestamp.now();
    const season = seasonDoc.data() as PlaySeason | undefined;
    const storedPeriod = Number(season?.current_simulation_period);
    const currentPeriod = Number.isInteger(storedPeriod) && storedPeriod >= 0
      ? storedPeriod
      : Number.isInteger(season?.last_successful_period) && Number(season?.last_successful_period) >= 0
        ? Number(season?.last_successful_period) + 1
        : 0;
    const elapsedPeriods = season_id === 'test_hero_season' || Number(season?.test_mode_speed) > 0
      ? currentPeriod
      : getElapsedSimulationPeriods(getSeasonStartTimestamp(season));
    const participationStartPeriod = Math.min(360, Math.max(currentPeriod, elapsedPeriods));

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
      participation_start_period: participationStartPeriod,
      cumulative_inflation_factor: 1,
      last_processed_period: participationStartPeriod > 0 ? participationStartPeriod - 1 : null,
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
