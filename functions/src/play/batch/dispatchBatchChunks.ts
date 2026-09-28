import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTION_BATCH, COLLECTION_BATCH_CHUNKS } from '../common/db';
import { PlayBatch, PlayBatchChunk } from '../common/types';
import { CloudTasksClient } from '@google-cloud/tasks';
import * as admin from 'firebase-admin';
import { verifyInternalTaskRequest } from '../common/internalAuth';

const tasksClient = new CloudTasksClient();

export const dispatchBatchChunks = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in');
  return dispatchBatchChunksCore(request.data);
});

export const dispatchBatchChunksTask = onRequest(async (request, response) => {
  try {
    const project = JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;
    const location = process.env.PLAY_REGION || 'asia-northeast3';
    await verifyInternalTaskRequest(request, `https://${location}-${project}.cloudfunctions.net/dispatchBatchChunksTask`);
    const result = await dispatchBatchChunksCore(request.body?.data || request.body);
    response.status(200).json({ result });
  } catch (error: any) {
    console.error('[dispatchBatchChunksTask] failed:', error);
    response.status(error.status || 500).json({ error: { message: error.message || 'Batch dispatch failed' } });
  }
});

async function dispatchBatchChunksCore(data: any) {
  const { batch_id, chunk_size = 100, inject_crash_after_chunk } = data || {};
  if (!batch_id) {
    throw new HttpsError('invalid-argument', 'Missing batch_id');
  }

  const batchRef = db.collection(COLLECTION_BATCH).doc(batch_id);
  
  // Phase 1: Update batch state to DISPATCHING
  const batchResult = await db.runTransaction(async (t) => {
    const batchDoc = await t.get(batchRef);
    if (!batchDoc.exists) {
      throw new HttpsError('not-found', 'Batch not found');
    }
    const batch = batchDoc.data() as PlayBatch;

    if (batch.status === 'COMPLETED' || batch.status === 'FAILED' || batch.status === 'AGGREGATING') {
      throw new HttpsError('failed-precondition', `Batch is already ${batch.status}`);
    }

    if (batch.status === 'PENDING') {
      t.update(batchRef, { status: 'DISPATCHING', updated_at: admin.firestore.Timestamp.now() });
      batch.status = 'DISPATCHING'; // Update local object for downstream logic
    }
    
    return batch;
  });

  const chunkCount = batchResult.chunk_count;
  const expectedPlayers = batchResult.expected_player_count;
  
  // Phase 2: Create chunks idempotently
  const chunksRef = db.collection(COLLECTION_BATCH_CHUNKS);
  const existingChunksSnap = await chunksRef.where('batch_id', '==', batch_id).get();
  const existingChunks = new Map<string, any>();
  existingChunksSnap.docs.forEach(d => existingChunks.set(d.id, d.data()));
  
  let actualChunkCount = chunkCount;
  let activePlayerIds: string[] = [];

  // Only fetch and slice players if we need to create new chunks
  if (existingChunks.size < chunkCount) {
    const playersSnap = await db.collection('PLAY_PLAYER')
      .where('season_id', '==', batchResult.season_id)
      .where('status', '==', 'ACTIVE')
      .select()
      .orderBy('__name__')
      .get();
      
    activePlayerIds = playersSnap.docs.map(d => d.id);
    
    // Update chunk count to reflect actual active players at this exact moment
    actualChunkCount = activePlayerIds.length === 0 ? 0 : Math.ceil(activePlayerIds.length / chunk_size);
    
    // If the count changed, update the batch to reflect reality
    if (actualChunkCount !== chunkCount || activePlayerIds.length !== expectedPlayers) {
       await batchRef.update({ 
         chunk_count: actualChunkCount, 
         expected_player_count: activePlayerIds.length,
         updated_at: admin.firestore.Timestamp.now() 
       });
    }
  } else {
    actualChunkCount = existingChunks.size;
  }
  
  const firestoreBatches = [];
  let currentFirestoreBatch = db.batch();
  let opsCount = 0;
  
  for (let i = 0; i < actualChunkCount; i++) {
    const chunk_id = `${batch_id}_c${i}`;
    if (existingChunks.has(chunk_id)) {
      continue; // chunk document already created
    }
    
    const slice = activePlayerIds.slice(i * chunk_size, (i + 1) * chunk_size);
    
    const newChunk: PlayBatchChunk = {
      chunk_id,
      batch_id,
      season_id: batchResult.season_id,
      simulation_period: batchResult.simulation_period,
      batch_type: batchResult.batch_type,
      task_name: '', // Will populate later
      chunk_index: i,
      status: 'PENDING',
      attempt_count: 0,
      player_count: slice.length,
      target_players: slice, // Explicit list of players for absolute stability
      processed_count: 0,
      failed_count: 0,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now(),
    };
    
    currentFirestoreBatch.set(chunksRef.doc(chunk_id), newChunk);
    opsCount++;
    
    if (opsCount >= 490) {
      firestoreBatches.push(currentFirestoreBatch.commit());
      currentFirestoreBatch = db.batch();
      opsCount = 0;
    }
  }
  if (opsCount > 0) {
    firestoreBatches.push(currentFirestoreBatch.commit());
  }
  await Promise.all(firestoreBatches);

  // Phase 3: Create Cloud Tasks Idempotently
  const project = JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;
  const location = process.env.PLAY_REGION || 'asia-northeast3';
  const queue = 'chunk-worker-queue';
  const queuePath = tasksClient.queuePath(project, location, queue);
  const functionUrl = `https://${location}-${project}.cloudfunctions.net/processBatchChunk`; 


  let hasFailures = false;
  
  for (let i = 0; i < actualChunkCount; i++) {
    const chunk_id = `${batch_id}_c${i}`;
    
    const existingChunk = existingChunks.get(chunk_id);
    if (existingChunk && ['DISPATCHED', 'RUNNING', 'COMPLETED'].includes(existingChunk.status)) {
      continue; // Skip task creation for already dispatched chunks
    }

    const taskName = tasksClient.taskPath(project, location, queue, `${chunk_id}_dispatch`);
    
    const payload = {
      season_id: batchResult.season_id,
      batch_id,
      chunk_id,
      simulation_period: batchResult.simulation_period,
      batch_type: batchResult.batch_type,
      chunk_index: i,
      scenario_id: batchResult.scenario_id,
      scenario_version: batchResult.scenario_version,
      rule_version: batchResult.rule_version
    };

    const task = {
      name: taskName,
      httpRequest: {
        httpMethod: 'POST' as const,
        url: functionUrl,
        headers: { 'Content-Type': 'application/json' },
        body: Buffer.from(JSON.stringify({ data: payload })).toString('base64'),
        oidcToken: {
          serviceAccountEmail: `${project}@appspot.gserviceaccount.com`,
        }
      }
    };

    // Before creating task, mark chunk as DISPATCHING safely
    await db.runTransaction(async (t) => {
      const chunkDoc = await t.get(db.collection(COLLECTION_BATCH_CHUNKS).doc(chunk_id));
      if (chunkDoc.exists) {
        const currentStatus = chunkDoc.data()?.status;
        if (currentStatus === 'PENDING') {
          t.update(chunkDoc.ref, {
            status: 'DISPATCHING',
            updated_at: admin.firestore.Timestamp.now()
          });
        }
      }
    });

    try {
      const [response] = await tasksClient.createTask({ parent: queuePath, task });
      await db.runTransaction(async (t) => {
        const chunkDoc = await t.get(db.collection(COLLECTION_BATCH_CHUNKS).doc(chunk_id));
        if (chunkDoc.exists) {
          const currentStatus = chunkDoc.data()?.status;
          if (['PENDING', 'DISPATCHING'].includes(currentStatus)) {
            t.update(chunkDoc.ref, {
              task_name: response.name,
              status: 'DISPATCHED',
              updated_at: admin.firestore.Timestamp.now()
            });
          }
        }
      });
      
      // Inject crash if requested for testing purposes
      if (inject_crash_after_chunk !== undefined && inject_crash_after_chunk === i) {
        throw new Error(`INJECTED_CRASH_AFTER_CHUNK_${i}`);
      }
    } catch (e: any) {
      if (e.code === 6) { // ALREADY_EXISTS
        await db.runTransaction(async (t) => {
          const chunkDoc = await t.get(db.collection(COLLECTION_BATCH_CHUNKS).doc(chunk_id));
          if (chunkDoc.exists) {
            const currentStatus = chunkDoc.data()?.status;
            if (['PENDING', 'DISPATCHING'].includes(currentStatus)) {
              t.update(chunkDoc.ref, {
                task_name: taskName,
                status: 'DISPATCHED',
                updated_at: admin.firestore.Timestamp.now()
              });
            }
          }
        });
      } else {
         console.error(`Failed to dispatch task for chunk ${chunk_id}`, e);
         await db.collection(COLLECTION_BATCH_CHUNKS).doc(chunk_id).update({
           status: 'FAILED',
           last_error: e.message || 'Task creation failed',
           updated_at: admin.firestore.Timestamp.now()
         });
         hasFailures = true;
         // We do not rethrow immediately, let other chunks attempt. Or break on hard crash.
         if (e.message.startsWith('INJECTED_CRASH')) {
           throw new HttpsError('internal', e.message);
         }
      }
    }
  }

  // Phase 4: Finalize Batch Status
  if (hasFailures) {
    // If there were dispatch failures, don't transition to RUNNING
    await batchRef.update({ 
      status: 'FAILED', 
      error_message: 'Some chunks failed to dispatch. Use dispatchBatchChunks again to retry.',
      updated_at: admin.firestore.Timestamp.now() 
    });
    throw new HttpsError('internal', 'Not all chunks dispatched successfully');
  } else {
    // Check if ALL chunks are DISPATCHED (including those skipped because they were already DISPATCHED)
    const finalChunksSnap = await chunksRef.where('batch_id', '==', batch_id).get();
    let allReady = true;
    finalChunksSnap.docs.forEach(doc => {
      const st = doc.data().status;
      if (!['DISPATCHED', 'RUNNING', 'COMPLETED'].includes(st)) {
        allReady = false;
      }
    });

    if (!allReady || finalChunksSnap.size !== actualChunkCount) {
      await batchRef.update({ 
        status: 'FAILED', 
        error_message: 'Invariant check failed: Not all chunks are properly dispatched.',
        updated_at: admin.firestore.Timestamp.now() 
      });
      throw new HttpsError('internal', 'Invariant failed: chunks missing or not DISPATCHED');
    }

    await batchRef.update({ 
      status: 'RUNNING', 
      started_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now() 
    });

    // Phase 5: Enqueue initial Aggregator task using explicit Cloud Tasks queue
    const aggQueuePath = tasksClient.queuePath(project, location, 'aggregator-queue');
    const aggUrl = `https://${location}-${project}.cloudfunctions.net/aggregateBatch`;
    const aggTask = {
      httpRequest: {
        httpMethod: 'POST' as const,
        url: aggUrl,
        headers: { 'Content-Type': 'application/json' },
        body: Buffer.from(JSON.stringify({ data: { batch_id, attempt: 1 } })).toString('base64'),
        oidcToken: {
          serviceAccountEmail: `${project}@appspot.gserviceaccount.com`,
          audience: aggUrl
        }
      },
      scheduleTime: {
        seconds: Math.floor(Date.now() / 1000) + 10 // first poll in 10s
      }
    };
    await tasksClient.createTask({ parent: aggQueuePath, task: aggTask });
  }

  return { status: 'SUCCESS', dispatched_chunks: actualChunkCount };
}
