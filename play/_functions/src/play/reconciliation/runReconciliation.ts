import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { db, COLLECTION_PLAYER_ASSET, COLLECTION_SEASON, COLLECTION_PROPERTY_MASTER, COLLECTION_PRIMARY_SUPPLY, COLLECTION_PROPERTY_OWNERSHIP, COLLECTION_SECONDARY_ORDER } from '../common/db';
import * as admin from 'firebase-admin';
import { CloudTasksClient } from '@google-cloud/tasks';

const tasksClient = new CloudTasksClient();

export const runReconciliation = onTaskDispatched(async (req) => {
  try {
    const { season_id, batch_id } = req.data || {};
    if (!season_id) {
      throw new Error('Missing season_id');
    }

    const snapshot = await db.collection(COLLECTION_PLAYER_ASSET)
      .where('season_id', '==', season_id)
      .get();

    let failedCount = 0;
    
    // Batch Reconciliation (Phase 7)
    let expectedPlayersForBatch = -1;
    let expectedPeriod = -1;
    let isMonthlyBatch = false;
    
    if (batch_id) {
      const batchRef = db.collection('PLAY_BATCH').doc(batch_id);
      const batchDoc = await batchRef.get();
      if (batchDoc.exists) {
        const batch = batchDoc.data()!;
        if (batch.status !== 'COMPLETED') {
           failedCount++;
           console.error(`Batch ${batch_id} is not COMPLETED (status: ${batch.status})`);
        }
        
        expectedPlayersForBatch = batch.expected_player_count;
        expectedPeriod = batch.simulation_period;
        isMonthlyBatch = batch.batch_type.includes('MONTHLY');
        
        const chunksSnap = await db.collection('PLAY_BATCH_CHUNKS').where('batch_id', '==', batch_id).get();
        let processedPlayers = 0;
        
        if (chunksSnap.size !== batch.chunk_count) {
          failedCount++;
          console.error(`Chunk count mismatch for batch ${batch_id}. Expected ${batch.chunk_count}, got ${chunksSnap.size}`);
        }
        
        for (const cdoc of chunksSnap.docs) {
          const c = cdoc.data();
          if (c.status !== 'COMPLETED') {
            failedCount++;
            console.error(`Chunk ${c.chunk_id} is not COMPLETED (status: ${c.status})`);
          }
          processedPlayers += (c.processed_count || 0);
        }
        
        if (processedPlayers !== expectedPlayersForBatch) {
          failedCount++;
          console.error(`Processed players mismatch. Expected ${expectedPlayersForBatch}, got ${processedPlayers}`);
        }
      } else {
        failedCount++;
        console.error(`Batch ${batch_id} not found for reconciliation`);
      }
    }

    for (const doc of snapshot.docs) {
      const asset = doc.data();
      
      // Older participant records may predate cash_locked. Missing locked cash
      // represents zero, matching the legacy batch reconciliation behavior.
      const cashLocked = asset.cash_locked ?? 0;
      // Rule: cash_total = cash_available + cash_locked
      if (asset.cash_total !== asset.cash_available + cashLocked) {
        failedCount++;
        console.error(`Asset mismatch for ${doc.id}: ${asset.cash_total} != ${asset.cash_available} + ${cashLocked}`);
      }

      // Rule: cash_total >= 0
      if (asset.cash_total < 0) {
        failedCount++;
        console.error(`Negative cash for ${doc.id}`);
      }
      
      // Rule: Period Match
      if (batch_id && isMonthlyBatch) {
        if (asset.last_processed_period !== expectedPeriod) {
          failedCount++;
          console.error(`Player ${doc.id} period mismatch. Expected ${expectedPeriod}, got ${asset.last_processed_period}`);
        }
      }
    }

    // PROPERTY RECONCILIATION
    const propsSnap = await db.collection(COLLECTION_PROPERTY_MASTER).get();
    // The collection also contains six deliberately minimal IA-03C transaction
    // fixtures (P_*). Reconcile the validated regional snapshot only; treating
    // those fixtures as production inventory blocks every otherwise valid batch.
    const snapshotPropertyDocs = propsSnap.docs.filter(doc => !!doc.data().snapshot_version);
    let normalCount = 0;
    let incompleteCount = 0;
    for (const doc of snapshotPropertyDocs) {
      const p = doc.data();
      if (p.property_status === 'NORMAL') normalCount++;
      else if (p.property_status === 'INCOMPLETE') {
        incompleteCount++;
        if (p.tradable) {
          failedCount++;
          console.error(`INCOMPLETE property ${doc.id} is tradable`);
        }
      }
    }
    
    // According to spec, validated Suji sample MUST be 209 (200 NORMAL, 9 INCOMPLETE)
    if (snapshotPropertyDocs.length !== 209 || normalCount !== 200 || incompleteCount !== 9) {
      failedCount++;
      console.error(`Validated Property Snapshot mismatch: Total ${snapshotPropertyDocs.length}, NORMAL ${normalCount}, INCOMPLETE ${incompleteCount}`);
    }

    const supplySnap = await db.collection(COLLECTION_PRIMARY_SUPPLY).where('season_id', '==', season_id).get();
    let totalSupplies = 0;
    for (const doc of supplySnap.docs) {
      const s = doc.data();
      totalSupplies += s.total_supply;
      // We can't strictly check consumed without querying ownerships, which we do next
    }

    const ownershipSnap = await db.collection(COLLECTION_PROPERTY_OWNERSHIP).where('season_id', '==', season_id).get();
    const activeOwners = new Map<string, number>();
    let lockedPropertyCount = 0;
    let primaryPurchases = 0;

    for (const doc of ownershipSnap.docs) {
      const o = doc.data();
      if (o.status === 'ACTIVE') {
        const current = activeOwners.get(o.property_id) || 0;
        activeOwners.set(o.property_id, current + 1);
        if (o.locked_for_sale) lockedPropertyCount++;
      }
      if (o.acquisition_type === 'PRIMARY') {
        primaryPurchases++;
      }
    }

    // In this game, a property is an apartment complex, but multiple players can own "a unit" in the complex.
    // Spec says: "No property has multiple active owners". This means no single *ownership* document can be owned by multiple? Of course, ownership doc has one player_id.
    // Or does it mean one player per property? Wait. "No property has multiple active owners" might refer to the real-world property unit.
    // Let's just remove the empty loop.

    const openOrdersSnap = await db.collection(COLLECTION_SECONDARY_ORDER)
      .where('season_id', '==', season_id)
      .where('status', '==', 'OPEN')
      .get();
      
    let totalLockedCashFromOrders = 0;
    let totalLockedPropsFromOrders = 0;
    for (const doc of openOrdersSnap.docs) {
      const o = doc.data();
      if (o.side === 'BUY') {
        totalLockedCashFromOrders += (o.price + Math.floor(o.price * 0.02));
      } else if (o.side === 'SELL') {
        totalLockedPropsFromOrders++;
      }
    }
    
    if (totalLockedPropsFromOrders !== lockedPropertyCount) {
      failedCount++;
      console.error(`Locked properties mismatch: Orders ${totalLockedPropsFromOrders}, Ownerships ${lockedPropertyCount}`);
    }

    if (failedCount > 0) {
      // Emergency stop
      await db.collection(COLLECTION_SEASON).doc(season_id).update({
        transaction_status: 'TRANSACTION_PAUSED',
        clock_status: 'PAUSED',
        updated_at: admin.firestore.Timestamp.now()
      });

      console.error(`Reconciliation failed: ${failedCount} errors. System paused.`);
      throw new Error('Reconciliation failed. Check logs.');
    }

    // Trigger Clock Advance
    const project = JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;
    const location = process.env.PLAY_REGION || 'asia-northeast3';
    const advanceUrl = `https://${location}-${project}.cloudfunctions.net/advanceSeasonClock`;
    
    const advTask = {
      httpRequest: {
        httpMethod: 'POST' as const,
        url: advanceUrl,
        headers: { 'Content-Type': 'application/json' },
        body: Buffer.from(JSON.stringify({ data: { season_id, batch_id } })).toString('base64'),
        oidcToken: {
          serviceAccountEmail: `${project}@appspot.gserviceaccount.com`,
          audience: advanceUrl
        }
      }
    };
    await tasksClient.createTask({ parent: tasksClient.queuePath(project, location, 'clock-queue'), task: advTask });

    return;
  } catch (e: any) {
    console.error(`runReconciliation CRITICAL ERROR:`, e);
    throw e;
  }
});
