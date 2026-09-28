import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTION_SEASON, COLLECTION_BATCH, COLLECTION_PLAYER } from '../common/db';
import { checkTransactionStatus } from '../common/utils';
import { PlaySeason, PlayBatch } from '../common/types';
import * as admin from 'firebase-admin';
import { CloudTasksClient } from '@google-cloud/tasks';
import { verifyInternalTaskRequest } from '../common/internalAuth';

export const createEconomicBatch = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in');
  return createEconomicBatchCore(request.data, false);
});

export const createEconomicBatchTask = onRequest(async (request, response) => {
  try {
    const project = JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;
    const location = process.env.PLAY_REGION || 'asia-northeast3';
    await verifyInternalTaskRequest(request, `https://${location}-${project}.cloudfunctions.net/createEconomicBatchTask`);
    const result = await createEconomicBatchCore(request.body?.data || request.body, true);
    if (result.batch_id) await enqueueBatchDispatch(result.batch_id, !!(request.body?.data || request.body).allow_paused_clock);
    response.status(200).json({ result });
  } catch (error: any) {
    console.error('[createEconomicBatchTask] failed:', error);
    response.status(error.status || 500).json({ error: { message: error.message || 'Batch creation failed' } });
  }
});

async function createEconomicBatchCore(data: any, isInternalTask: boolean) {
  const { season_id, batch_type, allow_paused_clock = false } = data || {};
  if (!season_id || !batch_type) {
    throw new HttpsError('invalid-argument', 'Missing fields');
  }

  await checkTransactionStatus(season_id);

  const seasonRef = db.collection(COLLECTION_SEASON).doc(season_id);

  // Count expected players
  const playerSnap = await db.collection(COLLECTION_PLAYER).where('season_id', '==', season_id).count().get();
  const expected_player_count = playerSnap.data().count;
  const CHUNK_SIZE = 100;
  const chunk_count = expected_player_count === 0 ? 0 : Math.ceil(expected_player_count / CHUNK_SIZE);

  const result = await db.runTransaction(async (t) => {
    const seasonDoc = await t.get(seasonRef);
    if (!seasonDoc.exists) {
      throw new HttpsError('not-found', 'Season not found');
    }

    const season = seasonDoc.data() as PlaySeason;

    if (isInternalTask && season.clock_status !== 'RUNNING' && !allow_paused_clock) {
      return { batch_id: '', status: 'SKIPPED_PAUSED' };
    }
    
    if (season.status !== 'ACTIVE') {
      throw new HttpsError('failed-precondition', 'Season is not ACTIVE');
    }
    if (season.transaction_status === 'TRANSACTION_PAUSED') {
      throw new HttpsError('unavailable', 'Transaction Paused');
    }

    const currentPeriod = season.current_simulation_period;
    const batchId = `${season_id}_${currentPeriod}_${batch_type}`;
    const batchRef = db.collection(COLLECTION_BATCH).doc(batchId);

    const batchDoc = await t.get(batchRef);
    if (batchDoc.exists) {
      // Idempotency: Return existing batch if it's the exact same period
      return { batch_id: batchId, status: 'EXISTING' };
    }

    const newBatch: PlayBatch = {
      batch_id: batchId,
      season_id,
      simulation_period: currentPeriod,
      batch_type,
      
      scenario_id: season.scenario_id || 'DEFAULT',
      scenario_version: season.scenario_version || '1.0',
      rule_version: season.rule_version || '1.0',
      
      expected_player_count,
      chunk_count,
      completed_chunks: 0,
      failed_chunks: 0,
      
      status: 'PENDING',
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now(),
    };

    t.set(batchRef, newBatch);

    return { batch_id: batchId, status: 'CREATED' };
  });

  return result;
}

async function enqueueBatchDispatch(batchId: string, allowPausedClock: boolean) {
  const project = JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;
  const location = process.env.PLAY_REGION || 'asia-northeast3';
  const dispatchUrl = `https://${location}-${project}.cloudfunctions.net/dispatchBatchChunksTask`;
  const tasksClient = new CloudTasksClient();
  const parent = tasksClient.queuePath(project, location, 'reconciliation-queue');
  const taskName = tasksClient.taskPath(project, location, 'reconciliation-queue', `${batchId}_dispatch`);
  try {
    await tasksClient.createTask({
      parent,
      task: {
        name: taskName,
        httpRequest: {
          httpMethod: 'POST',
          url: dispatchUrl,
          headers: { 'Content-Type': 'application/json' },
          body: Buffer.from(JSON.stringify({ data: { batch_id: batchId, allow_paused_clock: allowPausedClock } })).toString('base64'),
          oidcToken: {
            serviceAccountEmail: `${project}@appspot.gserviceaccount.com`,
            audience: dispatchUrl,
          },
        },
      },
    });
  } catch (error: any) {
    if (error.code !== 6) throw error;
  }
}

