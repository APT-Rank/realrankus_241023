import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { db, COLLECTION_BATCH, COLLECTION_BATCH_CHUNKS } from '../common/db';
import { PlayBatch } from '../common/types';
import * as admin from 'firebase-admin';
import { CloudTasksClient } from '@google-cloud/tasks';

const tasksClient = new CloudTasksClient();

const MAX_AGGREGATOR_ATTEMPTS = 20;

export const aggregateBatch = onTaskDispatched(
  {
    retryConfig: {
      maxAttempts: MAX_AGGREGATOR_ATTEMPTS,
      minBackoffSeconds: 10,
    },
    rateLimits: {
      maxConcurrentDispatches: 100,
    }
  },
  async (req) => {
  console.log(`[aggregateBatch] Triggered! Data:`, req.data);
  try {
    const { batch_id, attempt = 1 } = req.data || {};
    if (!batch_id) {
      console.log(`[aggregateBatch] Missing batch_id`);
      throw new Error('Missing batch_id');
    }

    console.log(`[aggregateBatch] Processing batch_id: ${batch_id}, attempt: ${attempt}`);
    const batchRef = db.collection(COLLECTION_BATCH).doc(batch_id);
    const batchDoc = await batchRef.get();
    
    if (!batchDoc.exists) {
      console.log(`[aggregateBatch] Batch not found: ${batch_id}`);
      return; // Stop retry
    }

    const batch = batchDoc.data() as PlayBatch;
    if (batch.status === 'COMPLETED' || batch.status === 'FAILED') {
      return;
    }

  const chunksSnapshot = await db.collection(COLLECTION_BATCH_CHUNKS)
    .where('batch_id', '==', batch_id)
    .get();

  let completed = 0;
  let failed = 0;
  let pendingOrRunning = 0;

  for (const doc of chunksSnapshot.docs) {
    const status = doc.data().status;
    if (status === 'COMPLETED') completed++;
    else if (status === 'FAILED') failed++;
    else pendingOrRunning++;
  }

  // Update batch progress
  await batchRef.update({
    completed_chunks: completed,
    failed_chunks: failed,
    updated_at: admin.firestore.Timestamp.now()
  });

  if (pendingOrRunning === 0) {
    // All done
    console.log(`[aggregateBatch] All chunks finished. finalStatus=${failed === 0 ? 'COMPLETED' : 'FAILED'}`);
    const finalStatus = failed === 0 ? 'COMPLETED' : 'FAILED';
    await batchRef.update({
      status: finalStatus,
      completed_at: admin.firestore.Timestamp.now()
    });

    if (finalStatus === 'COMPLETED') {
      // Trigger Clock Advance
      const project = JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;
      const location = process.env.PLAY_REGION || 'asia-northeast3';
      
      const advUrl = `https://${location}-${project}.cloudfunctions.net/runReconciliation`;
      const advTask = {
        httpRequest: {
          httpMethod: 'POST' as const,
          url: advUrl,
          headers: { 'Content-Type': 'application/json' },
          body: Buffer.from(JSON.stringify({ data: { season_id: batch.season_id, batch_id } })).toString('base64'),
          oidcToken: {
            serviceAccountEmail: `${project}@appspot.gserviceaccount.com`,
            audience: advUrl
          }
        }
      };
      await tasksClient.createTask({ parent: tasksClient.queuePath(project, location, 'reconciliation-queue'), task: advTask });
      
      console.log(`[aggregateBatch] Successfully enqueued runReconciliation via Cloud Tasks`);
    }

    return;
  }

  // Not done, retry polling
  if (attempt >= MAX_AGGREGATOR_ATTEMPTS) {
    console.error(`Batch ${batch_id} aggregation timed out after ${attempt} attempts`);
    await batchRef.update({
      status: 'FAILED',
      error_message: 'Aggregator timed out waiting for chunks',
      updated_at: admin.firestore.Timestamp.now()
    });
    // Trigger alert / Emergency stop if needed
    return;
  }

  console.log(`[aggregateBatch] Re-enqueuing to aggregator-queue...`);
  const project = JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;
  const location = process.env.PLAY_REGION || 'asia-northeast3';
  const aggUrl = `https://${location}-${project}.cloudfunctions.net/aggregateBatch`;
  const aggTask = {
    httpRequest: {
      httpMethod: 'POST' as const,
      url: aggUrl,
      headers: { 'Content-Type': 'application/json' },
      body: Buffer.from(JSON.stringify({ data: { batch_id, attempt: attempt + 1 } })).toString('base64'),
      oidcToken: {
        serviceAccountEmail: `${project}@appspot.gserviceaccount.com`,
        audience: aggUrl
      }
    },
    scheduleTime: {
      seconds: Math.floor(Date.now() / 1000) + 10 // next poll in 10s
    }
  };
  await tasksClient.createTask({ parent: tasksClient.queuePath(project, location, 'aggregator-queue'), task: aggTask });
  console.log(`[aggregateBatch] Re-enqueued! pending=${pendingOrRunning}`);

  return;
  } catch (e: any) {
    console.error(`[aggregateBatch] CRITICAL ERROR:`, e);
    throw e;
  }
});
