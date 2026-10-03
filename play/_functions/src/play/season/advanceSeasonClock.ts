import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { db, COLLECTION_SEASON, COLLECTION_BATCH } from '../common/db';
import { PlaySeason, PlayBatch } from '../common/types';
import * as admin from 'firebase-admin';
import { getNextPeriodDelaySeconds } from './periodSchedule';

export const advanceSeasonClock = onTaskDispatched(async (req) => {
  try {
    const { season_id, batch_id } = req.data || {};
    if (!season_id || !batch_id) {
      throw new Error('Missing season_id or batch_id');
    }

    const seasonRef = db.collection(COLLECTION_SEASON).doc(season_id);
    const batchRef = db.collection(COLLECTION_BATCH).doc(batch_id);

    await db.runTransaction(async (t) => {
      const [seasonDoc, batchDoc] = await Promise.all([
        t.get(seasonRef),
        t.get(batchRef)
      ]);

      if (!seasonDoc.exists || !batchDoc.exists) {
        throw new Error('Season or Batch not found');
      }

      const season = seasonDoc.data() as PlaySeason;
      const batch = batchDoc.data() as PlayBatch;

      // Validate Statuses
      if (season.transaction_status === 'TRANSACTION_PAUSED') {
        throw new Error('Transaction Paused');
      }
      
      if (batch.status !== 'COMPLETED') {
        throw new Error('Batch is not COMPLETED');
      }

      if (batch.simulation_period !== season.current_simulation_period) {
        // Could be already advanced (Idempotency)
        if (season.current_simulation_period > batch.simulation_period && season.last_successful_batch_id === batch.batch_id) {
          return; // NO-OP
        }
        throw new Error('Batch simulation period mismatch');
      }

      // Advance Clock
      t.update(seasonRef, {
        current_simulation_period: season.current_simulation_period + 1,
        last_successful_period: season.current_simulation_period,
        last_successful_batch_id: batch.batch_id,
        updated_at: admin.firestore.Timestamp.now()
      });
    });

    // Check if we need to auto-trigger the next period for TIME-SLIP RUN
    const updatedSeasonDoc = await seasonRef.get();
    const updatedSeason = updatedSeasonDoc.data() as PlaySeason;
    
    const isAcceleratedTestClock = season_id === 'test_hero_season'
      || (Number.isFinite(updatedSeason.test_mode_speed) && Number(updatedSeason.test_mode_speed) > 0);
    if (updatedSeason.clock_status === 'RUNNING'
      && updatedSeason.transaction_status === 'NORMAL'
      && isAcceleratedTestClock) {
      console.log(`[advanceSeasonClock] Clock is RUNNING. Triggering next batch automatically.`);
      const { CloudTasksClient } = require('@google-cloud/tasks');
      const tasksClient = new CloudTasksClient();
      const project = JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;
      const location = process.env.PLAY_REGION || 'asia-northeast3';
      
      const nextBatchUrl = `https://${location}-${project}.cloudfunctions.net/createEconomicBatchTask`;
      const taskPayload = {
        data: {
          season_id: season_id,
          batch_type: 'ECONOMIC'
        }
      };
      
      const task = {
        httpRequest: {
          httpMethod: 'POST' as const,
          url: nextBatchUrl,
          headers: { 'Content-Type': 'application/json' },
          body: Buffer.from(JSON.stringify(taskPayload)).toString('base64'),
          oidcToken: {
            serviceAccountEmail: `${project}@appspot.gserviceaccount.com`,
            audience: nextBatchUrl,
          }
        },
        scheduleTime: {
          seconds: Math.floor(Date.now() / 1000) + getNextPeriodDelaySeconds(updatedSeason.test_mode_speed)
        }
      };
      
      await tasksClient.createTask({ parent: tasksClient.queuePath(project, location, 'reconciliation-queue'), task });
      console.log(`[advanceSeasonClock] Next batch enqueued for RUNNING state.`);
    }

    return;
  } catch (e: any) {
    console.error(`advanceSeasonClock CRITICAL ERROR:`, e);
    throw e;
  }
});
