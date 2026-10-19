import { onRequest } from 'firebase-functions/v2/https';
import { db, COLLECTION_BATCH, COLLECTION_BATCH_CHUNKS, COLLECTION_SEASON } from '../common/db';
import { PlayBatch, PlaySeason } from '../common/types';
import * as admin from 'firebase-admin';
import { verifyInternalTask } from '../common/internalAuth';

export const runReconciliation = onRequest(async (req, res) => {
  try {
    await verifyInternalTask(req, res);

    const { season_id, batch_id } = req.body.data || {};
    if (!season_id || !batch_id) {
      res.status(400).send({ error: 'invalid-argument', message: 'Missing season_id or batch_id' });
      return;
    }

    const batchRef = db.collection(COLLECTION_BATCH).doc(batch_id);
    const seasonRef = db.collection(COLLECTION_SEASON).doc(season_id);

    const batchDoc = await batchRef.get();
    if (!batchDoc.exists) {
      res.status(404).send({ error: 'not-found', message: 'Batch not found' });
      return;
    }
    const batch = batchDoc.data() as PlayBatch;

    // Must only reconcile COMPLETED batches
    if (batch.status !== 'COMPLETED') {
      res.status(400).send({ error: 'failed-precondition', message: 'Batch is not COMPLETED' });
      return;
    }

    // 1. Reconcile Chunks
    const chunksSnap = await db.collection(COLLECTION_BATCH_CHUNKS).where('batch_id', '==', batch_id).get();
    let processedPlayers = 0;
    let expectedChunks = batch.chunk_count;

    if (chunksSnap.size !== expectedChunks) {
      await failReconciliation(batchRef, `Missing chunks. Expected ${expectedChunks}, got ${chunksSnap.size}`);
      res.status(200).send({ result: { status: 'FAILED' } });
      return;
    }

    for (const doc of chunksSnap.docs) {
      const c = doc.data();
      if (c.status !== 'COMPLETED') {
        await failReconciliation(batchRef, `Chunk ${c.chunk_id} is not COMPLETED`);
        res.status(200).send({ result: { status: 'FAILED' } });
        return;
      }
      processedPlayers += c.processed_count;
    }

    // 2. Player count check
    if (processedPlayers !== batch.expected_player_count) {
      await failReconciliation(batchRef, `Processed players mismatch. Expected ${batch.expected_player_count}, got ${processedPlayers}`);
      res.status(200).send({ result: { status: 'FAILED' } });
      return;
    }

    // 3. Cash Invariants Check (Sampling or fully if small)
    // To avoid memory limits, we'll assume a batch process that reads assets.
    // We'll read all players in this season since it's an end-of-batch step. 
    // In production, might need to be chunked if > 1M players.
    const assetsSnap = await db.collection('PLAY_PLAYER_ASSET').where('season_id', '==', season_id).get();
    for (const assetDoc of assetsSnap.docs) {
      const a = assetDoc.data();
      if (a.cash_total < 0) {
        await failReconciliation(batchRef, `Player ${a.player_id} has negative cash_total`);
        res.status(200).send({ result: { status: 'FAILED' } });
        return;
      }
      if (a.cash_total !== a.cash_available + (a.cash_locked || 0)) {
        await failReconciliation(batchRef, `Player ${a.player_id} cash mismatch: ${a.cash_total} != ${a.cash_available} + ${a.cash_locked}`);
        res.status(200).send({ result: { status: 'FAILED' } });
        return;
      }
      // Depending on batch_type, we might verify last_processed_period.
      if (batch.batch_type.includes('MONTHLY')) {
        if (a.last_processed_period !== batch.simulation_period) {
          await failReconciliation(batchRef, `Player ${a.player_id} period mismatch: ${a.last_processed_period} != ${batch.simulation_period}`);
          res.status(200).send({ result: { status: 'FAILED' } });
          return;
        }
      }
    }

    // Phase 6: Advance Season Clock Idempotently
    await db.runTransaction(async (t) => {
      const seasonDoc = await t.get(seasonRef);
      if (!seasonDoc.exists) return; // skip if season deleted

      const season = seasonDoc.data() as PlaySeason;
      if (season.current_simulation_period === batch.simulation_period) {
         // Advance clock!
         t.update(seasonRef, {
           current_simulation_period: season.current_simulation_period + 1,
           last_successful_period: batch.simulation_period,
           last_successful_batch_id: batch_id,
           updated_at: admin.firestore.Timestamp.now()
         });
      }
    });

    res.status(200).send({ result: { status: 'SUCCESS' } });

  } catch (e: any) {
    if (!res.headersSent) {
      res.status(500).send({ error: e.message });
    }
  }
});

async function failReconciliation(batchRef: admin.firestore.DocumentReference, message: string) {
  console.error(`[Reconciliation Failed] ${message}`);
  await batchRef.update({
    status: 'FAILED',
    error_message: `Reconciliation: ${message}`,
    updated_at: admin.firestore.Timestamp.now()
  });
}
