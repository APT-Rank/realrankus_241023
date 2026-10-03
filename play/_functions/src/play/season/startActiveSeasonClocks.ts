import { createHash } from 'crypto';
import { CloudTasksClient } from '@google-cloud/tasks';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { db, COLLECTION_BATCH, COLLECTION_SEASON } from '../common/db';
import { PlaySeason } from '../common/types';
import { getElapsedSimulationPeriods, getSeasonStartTimestamp, SIMULATION_PERIODS_PER_SEASON } from './periodSchedule';

const tasksClient = new CloudTasksClient();

function isTestClock(seasonId: string, season: PlaySeason): boolean {
  return seasonId === 'test_hero_season'
    || (Number.isFinite(season.test_mode_speed) && Number(season.test_mode_speed) > 0);
}

async function enqueueEconomicBatch(seasonId: string, period: number): Promise<void> {
  const project = JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;
  const location = process.env.PLAY_REGION || 'asia-northeast3';
  const queue = 'reconciliation-queue';
  const taskId = createHash('sha256').update(`${seasonId}:${period}:ECONOMIC`).digest('hex');
  const taskName = tasksClient.taskPath(project, location, queue, taskId);
  const functionUrl = `https://${location}-${project}.cloudfunctions.net/createEconomicBatchTask`;
  const payload = { data: { season_id: seasonId, batch_type: 'ECONOMIC', expected_simulation_period: period } };

  try {
    await tasksClient.createTask({
      parent: tasksClient.queuePath(project, location, queue),
      task: {
        name: taskName,
        httpRequest: {
          httpMethod: 'POST',
          url: functionUrl,
          headers: { 'Content-Type': 'application/json' },
          body: Buffer.from(JSON.stringify(payload)).toString('base64'),
          oidcToken: {
            serviceAccountEmail: `${project}@appspot.gserviceaccount.com`,
            audience: functionUrl
          }
        }
      }
    });
  } catch (error: any) {
    if (error.code !== 6) throw error;
  }
}

export const startActiveSeasonClocks = onSchedule(
  { schedule: 'every 1 minutes', timeZone: 'Asia/Seoul' },
  async () => {
    if (process.env.FUNCTIONS_EMULATOR === 'true') return;

    const activeSeasons = await db.collection(COLLECTION_SEASON).where('status', '==', 'ACTIVE').get();
    const now = Date.now();
    for (const seasonDoc of activeSeasons.docs) {
      const seasonId = seasonDoc.id;
      const season = seasonDoc.data() as PlaySeason;
      if (isTestClock(seasonId, season)) continue;

      const startTimestamp = getSeasonStartTimestamp(season);
      if (!startTimestamp) continue;
      const duePeriodCount = getElapsedSimulationPeriods(startTimestamp, now);
      if (duePeriodCount === 0) continue;

      try {
        const duePeriod = await db.runTransaction(async (transaction) => {
          const currentDoc = await transaction.get(seasonDoc.ref);
          if (!currentDoc.exists) return null;
          const currentSeason = currentDoc.data() as PlaySeason;
          if (currentSeason.status !== 'ACTIVE' || currentSeason.transaction_status === 'TRANSACTION_PAUSED') return null;
          if (currentSeason.clock_status === 'PAUSED' || currentSeason.clock_status === 'ERROR') return null;
          if (isTestClock(seasonId, currentSeason)) return null;

          const storedPeriod = Number(currentSeason.current_simulation_period);
          const recoveredPeriod = Number.isInteger(currentSeason.last_successful_period)
            && Number(currentSeason.last_successful_period) >= 0
            ? Number(currentSeason.last_successful_period) + 1
            : 0;
          const currentPeriod = Number.isInteger(storedPeriod) && storedPeriod >= 0 ? storedPeriod : recoveredPeriod;
          const updates: Record<string, unknown> = {};
          if (!Number.isInteger(storedPeriod) || storedPeriod < 0) updates.current_simulation_period = currentPeriod;
          if (currentSeason.clock_status !== 'RUNNING') updates.clock_status = 'RUNNING';
          if (!Number.isInteger(currentSeason.total_simulation_periods)) {
            updates.total_simulation_periods = SIMULATION_PERIODS_PER_SEASON;
          }
          if (Object.keys(updates).length > 0) {
            updates.updated_at = admin.firestore.Timestamp.now();
            transaction.update(seasonDoc.ref, updates);
          }

          return currentPeriod < duePeriodCount ? currentPeriod : null;
        });

        if (duePeriod === null) continue;
        const batchId = `${seasonId}_${duePeriod}_ECONOMIC`;
        const batchDoc = await db.collection(COLLECTION_BATCH).doc(batchId).get();
        if (batchDoc.exists) continue;
        await enqueueEconomicBatch(seasonId, duePeriod);
      } catch (error) {
        console.error(`[startActiveSeasonClocks] Failed for season ${seasonId}`, error);
      }
    }
  }
);
