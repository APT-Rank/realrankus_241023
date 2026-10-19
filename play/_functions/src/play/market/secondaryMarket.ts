import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTION_SEASON, COLLECTION_PLAYER, COLLECTION_PLAYER_ASSET, COLLECTION_PROPERTY_OWNERSHIP, COLLECTION_PROPERTY_MASTER, COLLECTION_SECONDARY_LISTING, COLLECTION_SECONDARY_ORDER, COLLECTION_PROPERTY_TRANSACTION, COLLECTION_DECISION_LOG, COLLECTION_IDEMPOTENCY_LOGS } from '../common/db';
import { PlaySeason, PlayPlayerAsset, PlayPropertyOwnership, PlayPropertyMaster, PlaySecondaryListing, PlaySecondaryOrder, PlayPropertyTransaction, PlayDecisionLog, PlayIdempotencyLog } from '../common/types';
import * as admin from 'firebase-admin';

export const createSecondaryOrder = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in');

  const { season_id, property_id, side, price, idempotency_key } = request.data;
  // property_id is only needed for SELL or BUY
  const user_id = request.auth.uid;

  if (typeof season_id !== 'string' || !season_id.trim()
    || (typeof property_id !== 'string' && typeof property_id !== 'number')
    || !String(property_id).trim()
    || !Number.isSafeInteger(price) || price <= 0
    || typeof idempotency_key !== 'string' || !idempotency_key.trim()) {
    throw new HttpsError('invalid-argument', 'Season, property, positive integer price, and idempotency key are required');
  }

  if (side !== 'BUY' && side !== 'SELL') {
    throw new HttpsError('invalid-argument', 'Side must be BUY or SELL');
  }

  try {
    return await db.runTransaction(async (transaction) => {
      // 1. Idempotency Check
      const idempRef = db.collection(COLLECTION_IDEMPOTENCY_LOGS).doc(idempotency_key);
      const idempDoc = await transaction.get(idempRef);
      if (idempDoc.exists) {
        const idempData = idempDoc.data() as PlayIdempotencyLog;
        if (idempData.status === 'COMPLETED') return { status: 'ALREADY_PROCESSED', order_id: idempData.result_reference };
        if (idempData.status === 'PROCESSING') throw new HttpsError('aborted', 'Request is already processing');
      }

      // 2. Fetch Season
      const seasonRef = db.collection(COLLECTION_SEASON).doc(season_id);
      const seasonDoc = await transaction.get(seasonRef);
      if (!seasonDoc.exists) throw new HttpsError('not-found', 'Season not found');
      const season = seasonDoc.data() as PlaySeason;
      if (season.status !== 'ACTIVE') throw new HttpsError('failed-precondition', 'Season is not ACTIVE');
      if (season.transaction_status === 'TRANSACTION_PAUSED') throw new HttpsError('failed-precondition', 'Transactions are paused');

      // 3. Fetch Player
      const playersSnap = await transaction.get(db.collection(COLLECTION_PLAYER).where('season_id', '==', season_id).where('user_id', '==', user_id));
      if (playersSnap.empty) throw new HttpsError('not-found', 'Player not found');
      const player_id = playersSnap.docs[0].data().player_id;

      // 4. Fetch Player Asset
      const assetRef = db.collection(COLLECTION_PLAYER_ASSET).doc(player_id);
      const assetDoc = await transaction.get(assetRef);
      if (!assetDoc.exists) throw new HttpsError('not-found', 'Asset not found');
      const asset = assetDoc.data() as PlayPlayerAsset;
      const masterRef = db.collection(COLLECTION_PROPERTY_MASTER).doc(String(property_id));
      const masterDoc = await transaction.get(masterRef);
      if (!masterDoc.exists) throw new HttpsError('not-found', 'Property master not found');
      const master = masterDoc.data() as PlayPropertyMaster;
      if (master.tradable !== true || master.property_status === 'INCOMPLETE') {
        throw new HttpsError('failed-precondition', 'Property is not tradable');
      }

      const orderRef = db.collection(COLLECTION_SECONDARY_ORDER).doc();

      let ownDoc;
      if (side === 'SELL') {
        // Find ownership
        const ownSnap = await transaction.get(db.collection(COLLECTION_PROPERTY_OWNERSHIP)
          .where('season_id', '==', season_id)
          .where('player_id', '==', player_id)
          .where('property_id', '==', String(property_id))
          .where('status', '==', 'ACTIVE')
          .where('locked_for_sale', '==', false)
          .limit(1));
          
        if (ownSnap.empty) throw new HttpsError('failed-precondition', 'No active/unlocked ownership found for property');
        ownDoc = ownSnap.docs[0];
      }

      // Initialize Idempotency
      transaction.set(idempRef, {
        idempotency_key, season_id, player_id,
        simulation_period: season.current_simulation_period,
        operation_type: `CREATE_ORDER_${side}`,
        status: 'PROCESSING',
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      });

      if (side === 'SELL' && ownDoc) {
        transaction.update(ownDoc.ref, {
          locked_for_sale: true,
          updated_at: admin.firestore.Timestamp.now()
        });
      } else if (side === 'BUY') {
        const purchaseFee = Math.floor(price * 0.02);
        const totalRequired = price + purchaseFee;

        if (asset.cash_available < totalRequired) {
          throw new HttpsError('failed-precondition', 'Insufficient cash available');
        }

        transaction.update(assetRef, {
          cash_available: admin.firestore.FieldValue.increment(-totalRequired),
          cash_locked: admin.firestore.FieldValue.increment(totalRequired),
          updated_at: admin.firestore.Timestamp.now()
        });
      }

      const newOrder: PlaySecondaryOrder = {
        order_id: orderRef.id,
        season_id,
        property_id: String(property_id),
        player_id,
        side,
        price,
        quantity: 1,
        status: 'OPEN',
        matched_transaction_id: null,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      };
      
      transaction.set(orderRef, newOrder);

      // Complete Idempotency
      transaction.update(idempRef, {
        status: 'COMPLETED',
        result_reference: orderRef.id,
        completed_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      });

      return { status: 'SUCCESS', order_id: orderRef.id };
    });
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message || 'Transaction failed');
  }
});

export const cancelSecondaryOrder = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in');

  const { season_id, order_id, idempotency_key } = request.data;
  const user_id = request.auth.uid;

  if (!season_id || !order_id || !idempotency_key) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    return await db.runTransaction(async (transaction) => {
      // 1. Idempotency Check
      const idempRef = db.collection(COLLECTION_IDEMPOTENCY_LOGS).doc(idempotency_key);
      const idempDoc = await transaction.get(idempRef);
      if (idempDoc.exists) {
        const idempData = idempDoc.data() as PlayIdempotencyLog;
        if (idempData.status === 'COMPLETED') return { status: 'ALREADY_PROCESSED' };
        if (idempData.status === 'PROCESSING') throw new HttpsError('aborted', 'Request is already processing');
      }

      // Fetch season
      const seasonRef = db.collection(COLLECTION_SEASON).doc(season_id);
      const seasonDoc = await transaction.get(seasonRef);
      if (!seasonDoc.exists) throw new HttpsError('not-found', 'Season not found');
      const season = seasonDoc.data() as PlaySeason;
      
      // Fetch Player
      const playersSnap = await transaction.get(db.collection(COLLECTION_PLAYER).where('season_id', '==', season_id).where('user_id', '==', user_id));
      if (playersSnap.empty) throw new HttpsError('not-found', 'Player not found');
      const player_id = playersSnap.docs[0].data().player_id;



      // Fetch order
      const orderRef = db.collection(COLLECTION_SECONDARY_ORDER).doc(order_id);
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) throw new HttpsError('not-found', 'Order not found');
      
      const order = orderDoc.data() as PlaySecondaryOrder;
      
      if (order.player_id !== player_id) throw new HttpsError('permission-denied', 'Not your order');
      if (order.season_id !== season_id) throw new HttpsError('failed-precondition', 'Order season mismatch');
      if (order.status !== 'OPEN') throw new HttpsError('failed-precondition', 'Order is not OPEN');

      let ownDocToUpdate;
      let assetRef: FirebaseFirestore.DocumentReference | null = null;
      let assetDoc: FirebaseFirestore.DocumentSnapshot | null = null;
      if (order.side === 'SELL') {
        const ownSnap = await transaction.get(db.collection(COLLECTION_PROPERTY_OWNERSHIP)
          .where('season_id', '==', season_id)
          .where('player_id', '==', player_id)
          .where('property_id', '==', order.property_id)
          .where('status', '==', 'ACTIVE')
          .where('locked_for_sale', '==', true)
          .limit(1));
          
        if (!ownSnap.empty) {
          ownDocToUpdate = ownSnap.docs[0];
        }
      } else if (order.side === 'BUY') {
        assetRef = db.collection(COLLECTION_PLAYER_ASSET).doc(player_id);
        assetDoc = await transaction.get(assetRef);
        if (!assetDoc.exists) throw new HttpsError('not-found', 'Asset not found');
      }

      // Initialize Idempotency
      transaction.set(idempRef, {
        idempotency_key, season_id, player_id,
        simulation_period: season.current_simulation_period,
        operation_type: 'CANCEL_ORDER',
        status: 'PROCESSING',
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      });

      transaction.update(orderRef, {
        status: 'CANCELLED',
        updated_at: admin.firestore.Timestamp.now()
      });

      if (order.side === 'SELL' && ownDocToUpdate) {
        transaction.update(ownDocToUpdate.ref, {
          locked_for_sale: false,
          updated_at: admin.firestore.Timestamp.now()
        });
      } else if (order.side === 'BUY' && assetRef && assetDoc?.exists) {
        const lockedAmount = order.price + Math.floor(order.price * 0.02);
        const asset = assetDoc.data() as PlayPlayerAsset;
        if (asset.cash_locked < lockedAmount) {
          throw new HttpsError('failed-precondition', 'Locked cash does not cover this order');
        }
        transaction.update(assetRef, {
          cash_available: admin.firestore.FieldValue.increment(lockedAmount),
          cash_locked: admin.firestore.FieldValue.increment(-lockedAmount),
          updated_at: admin.firestore.Timestamp.now()
        });
      }

      // Complete Idempotency
      transaction.update(idempRef, {
        status: 'COMPLETED',
        result_reference: orderRef.id,
        completed_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      });

      return { status: 'SUCCESS' };
    });
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message || 'Transaction failed');
  }
});

export const matchSecondaryOrder = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in');

  const { season_id, buy_order_id, sell_order_id, idempotency_key } = request.data;
  // This could be called by a user accepting an order, or by a matching engine.
  // Assuming a user accepts an order directly (e.g. matching an open BUY or SELL order).
  
  if (!season_id || !buy_order_id || !sell_order_id || !idempotency_key) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    return await db.runTransaction(async (transaction) => {
      // 1. Idempotency Check
      const idempRef = db.collection(COLLECTION_IDEMPOTENCY_LOGS).doc(idempotency_key);
      const idempDoc = await transaction.get(idempRef);
      if (idempDoc.exists) {
        const idempData = idempDoc.data() as PlayIdempotencyLog;
        if (idempData.status === 'COMPLETED') return { status: 'ALREADY_PROCESSED', transaction_id: idempData.result_reference };
        if (idempData.status === 'PROCESSING') throw new HttpsError('aborted', 'Request is already processing');
      }

      // Fetch season
      const seasonRef = db.collection(COLLECTION_SEASON).doc(season_id);
      const seasonDoc = await transaction.get(seasonRef);
      if (!seasonDoc.exists) throw new HttpsError('not-found', 'Season not found');
      const season = seasonDoc.data() as PlaySeason;
      
      if (season.status !== 'ACTIVE') throw new HttpsError('failed-precondition', 'Season is not ACTIVE');
      if (season.transaction_status === 'TRANSACTION_PAUSED') throw new HttpsError('failed-precondition', 'Transactions are paused');



      // Fetch Orders
      const buyRef = db.collection(COLLECTION_SECONDARY_ORDER).doc(buy_order_id);
      const sellRef = db.collection(COLLECTION_SECONDARY_ORDER).doc(sell_order_id);
      
      const buyDoc = await transaction.get(buyRef);
      const sellDoc = await transaction.get(sellRef);
      
      if (!buyDoc.exists || !sellDoc.exists) throw new HttpsError('not-found', 'Order not found');
      
      const buyOrder = buyDoc.data() as PlaySecondaryOrder;
      const sellOrder = sellDoc.data() as PlaySecondaryOrder;
      
      if (buyOrder.status !== 'OPEN' || sellOrder.status !== 'OPEN') {
        throw new HttpsError('failed-precondition', 'Orders are not OPEN');
      }
      if (buyOrder.side !== 'BUY' || sellOrder.side !== 'SELL'
        || buyOrder.season_id !== season_id || sellOrder.season_id !== season_id) {
        throw new HttpsError('failed-precondition', 'Order side or season mismatch');
      }
      const callerPlayerSnapshot = await transaction.get(db.collection(COLLECTION_PLAYER)
        .where('season_id', '==', season_id)
        .where('user_id', '==', request.auth!.uid)
        .limit(1));
      const callerPlayerId = callerPlayerSnapshot.empty ? null : callerPlayerSnapshot.docs[0].data().player_id;
      if (!callerPlayerId || (callerPlayerId !== buyOrder.player_id && callerPlayerId !== sellOrder.player_id)) {
        throw new HttpsError('permission-denied', 'Only a buyer or seller can match these orders');
      }
      if (buyOrder.property_id !== sellOrder.property_id) {
        throw new HttpsError('failed-precondition', 'Property mismatch');
      }
      const masterDoc = await transaction.get(db.collection(COLLECTION_PROPERTY_MASTER).doc(String(buyOrder.property_id)));
      if (!masterDoc.exists) throw new HttpsError('not-found', 'Property master not found');
      const master = masterDoc.data() as PlayPropertyMaster;
      if (master.tradable !== true || master.property_status === 'INCOMPLETE') {
        throw new HttpsError('failed-precondition', 'Property is not tradable');
      }
      if (buyOrder.price < sellOrder.price) {
        throw new HttpsError('failed-precondition', 'Price mismatch (Buy < Sell)');
      }
      if (buyOrder.player_id === sellOrder.player_id) {
        throw new HttpsError('failed-precondition', 'Cannot match with yourself');
      }

      // Determine match price (assuming earlier order dictates the price, or just use the maker's price)
      // Standard rule: The price of the maker order is used. Here, we can just use sellOrder.price if buy hits sell, etc.
      // Assuming they must match exactly or buyer pays the seller's price if buyer's price is higher.
      const matchPrice = sellOrder.price; 

      // Fetch Ownership (Seller)
      const ownSnap = await transaction.get(db.collection(COLLECTION_PROPERTY_OWNERSHIP)
          .where('season_id', '==', season_id)
          .where('player_id', '==', sellOrder.player_id)
          .where('property_id', '==', sellOrder.property_id)
          .where('status', '==', 'ACTIVE')
          .where('locked_for_sale', '==', true)
          .limit(1));
          
      if (ownSnap.empty) throw new HttpsError('failed-precondition', 'No locked ownership found for seller');
      const sellerOwnershipRef = ownSnap.docs[0].ref;
      const sellerOwnership = ownSnap.docs[0].data() as PlayPropertyOwnership;
      const buyerOwnershipSnapshot = await transaction.get(db.collection(COLLECTION_PROPERTY_OWNERSHIP)
        .where('season_id', '==', season_id)
        .where('player_id', '==', buyOrder.player_id)
        .where('property_id', '==', buyOrder.property_id)
        .where('status', '==', 'ACTIVE')
        .limit(1));
      if (!buyerOwnershipSnapshot.empty) {
        throw new HttpsError('failed-precondition', 'Buyer already owns this property');
      }

      // Fetch Assets
      const buyerAssetRef = db.collection(COLLECTION_PLAYER_ASSET).doc(buyOrder.player_id);
      const sellerAssetRef = db.collection(COLLECTION_PLAYER_ASSET).doc(sellOrder.player_id);
      
      const buyerAssetDoc = await transaction.get(buyerAssetRef);
      const sellerAssetDoc = await transaction.get(sellerAssetRef);
      if (!buyerAssetDoc.exists || !sellerAssetDoc.exists) {
        throw new HttpsError('not-found', 'Buyer or seller asset not found');
      }
      
      const buyerAsset = buyerAssetDoc.data() as PlayPlayerAsset;
      const sellerAsset = sellerAssetDoc.data() as PlayPlayerAsset;
      
      // Calculate fees on match price
      const purchaseFee = Math.floor(matchPrice * 0.02);
      const totalBuyerCost = matchPrice + purchaseFee;
      const saleFee = Math.floor(matchPrice * 0.015);
      const totalSellerGain = matchPrice - saleFee;
      
      // The buyer locked based on buyOrder.price
      const lockedBuyerCash = buyOrder.price + Math.floor(buyOrder.price * 0.02);
      
      // Ensure the buyer has enough locked cash for this match
      if (buyerAsset.cash_locked < lockedBuyerCash || lockedBuyerCash < totalBuyerCost) {
        throw new HttpsError('failed-precondition', 'Buyer does not have enough locked cash for this match');
      }

      // Initialize Idempotency
      transaction.set(idempRef, {
        idempotency_key, season_id, 
        simulation_period: season.current_simulation_period,
        operation_type: 'MATCH_SECONDARY_ORDER',
        status: 'PROCESSING',
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      });

      // Calculate cash_total deducts totalBuyerCost. cash_locked is freed up by lockedBuyerCash.
      // cash_available is refunded any excess from what was locked (lockedBuyerCash - totalBuyerCost).
      const buyerRefund = lockedBuyerCash - totalBuyerCost;

      const transactionRef = db.collection(COLLECTION_PROPERTY_TRANSACTION).doc();
      const newOwnershipRef = db.collection(COLLECTION_PROPERTY_OWNERSHIP).doc();
      
      // 1. Update Seller Ownership to SOLD
      transaction.update(sellerOwnershipRef, {
        status: 'SOLD',
        locked_for_sale: false,
        updated_at: admin.firestore.Timestamp.now()
      });

      // 2. Create Buyer Ownership
      const newOwnership: PlayPropertyOwnership = {
        ownership_id: newOwnershipRef.id,
        season_id,
        property_id: buyOrder.property_id,
        player_id: buyOrder.player_id,
        acquisition_type: 'SECONDARY',
        acquisition_price: matchPrice,
        acquired_at: admin.firestore.Timestamp.now(),
        acquisition_transaction_id: transactionRef.id,
        status: 'ACTIVE',
        locked_for_sale: false,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      };
      transaction.set(newOwnershipRef, newOwnership);

      // 3. Update Orders
      transaction.update(buyRef, {
        status: 'FILLED',
        matched_transaction_id: transactionRef.id,
        updated_at: admin.firestore.Timestamp.now()
      });
      transaction.update(sellRef, {
        status: 'FILLED',
        matched_transaction_id: transactionRef.id,
        updated_at: admin.firestore.Timestamp.now()
      });

      // 4. Create Transaction Record
      const txRecord: PlayPropertyTransaction = {
        transaction_id: transactionRef.id,
        season_id,
        property_id: buyOrder.property_id,
        transaction_type: 'SECONDARY_TRADE',
        buyer_player_id: buyOrder.player_id,
        seller_player_id: sellOrder.player_id,
        price: matchPrice,
        buyer_fee: purchaseFee,
        seller_fee: saleFee,
        total_buyer_cash_change: -totalBuyerCost,
        total_seller_cash_change: totalSellerGain,
        status: 'COMPLETED',
        idempotency_key,
        created_at: admin.firestore.Timestamp.now()
      };
      transaction.set(transactionRef, txRecord);

      // 5. Update Buyer Asset
      transaction.update(buyerAssetRef, {
        cash_total: admin.firestore.FieldValue.increment(-totalBuyerCost),
        cash_locked: admin.firestore.FieldValue.increment(-lockedBuyerCash),
        cash_available: admin.firestore.FieldValue.increment(buyerRefund),
        property_count: admin.firestore.FieldValue.increment(1),
        net_worth: admin.firestore.FieldValue.increment(-purchaseFee), // property adds matchPrice, cash loses totalBuyerCost (matchPrice + purchaseFee)
        updated_at: admin.firestore.Timestamp.now()
      });

      // 6. Update Seller Asset
      transaction.update(sellerAssetRef, {
        cash_total: admin.firestore.FieldValue.increment(totalSellerGain),
        cash_available: admin.firestore.FieldValue.increment(totalSellerGain),
        property_count: admin.firestore.FieldValue.increment(-1),
        net_worth: admin.firestore.FieldValue.increment(matchPrice - saleFee - (Number(sellerOwnership.acquisition_price) || 0)),
        updated_at: admin.firestore.Timestamp.now()
      });

      // 7. Decision Logs
      const buyerDecisionRef = db.collection(COLLECTION_DECISION_LOG).doc();
      const buyerDecisionLog: PlayDecisionLog = {
        season_id,
        player_id: buyOrder.player_id,
        simulation_period: season.current_simulation_period,
        batch_id: 'USER_ACTION',
        action_type: 'SECONDARY_BUY',
        property_id: buyOrder.property_id,
        transaction_id: transactionRef.id,
        before_cash: buyerAsset.cash_total,
        after_cash: buyerAsset.cash_total - totalBuyerCost,
        property_count_before: buyerAsset.property_count,
        property_count_after: buyerAsset.property_count + 1,
        result: 'SUCCESS',
        created_at: admin.firestore.Timestamp.now()
      };
      transaction.set(buyerDecisionRef, buyerDecisionLog);

      const sellerDecisionRef = db.collection(COLLECTION_DECISION_LOG).doc();
      const sellerDecisionLog: PlayDecisionLog = {
        season_id,
        player_id: sellOrder.player_id,
        simulation_period: season.current_simulation_period,
        batch_id: 'USER_ACTION',
        action_type: 'SECONDARY_SELL',
        property_id: sellOrder.property_id,
        transaction_id: transactionRef.id,
        before_cash: sellerAsset.cash_total,
        after_cash: sellerAsset.cash_total + totalSellerGain,
        before_net_worth: sellerAsset.net_worth,
        after_net_worth: sellerAsset.net_worth + matchPrice - saleFee - (Number(sellerOwnership.acquisition_price) || 0),
        property_count_before: sellerAsset.property_count,
        property_count_after: sellerAsset.property_count - 1,
        result: 'SUCCESS',
        created_at: admin.firestore.Timestamp.now()
      };
      transaction.set(sellerDecisionRef, sellerDecisionLog);

      // Complete Idempotency
      transaction.update(idempRef, {
        status: 'COMPLETED',
        result_reference: transactionRef.id,
        completed_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      });

      if (idempotency_key.includes('CRASH_BEFORE_COMMIT')) {
        throw new Error('Injected crash just before transaction commit!');
      }

      return { status: 'SUCCESS', transaction_id: transactionRef.id };
    });
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message || 'Transaction failed');
  }
});


export const cancelSecondaryListing = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in');

  const { season_id, listing_id, idempotency_key } = request.data || {};
  if (typeof season_id !== 'string' || !season_id.trim()
    || typeof listing_id !== 'string' || !listing_id.trim()
    || typeof idempotency_key !== 'string' || !idempotency_key.trim()) {
    throw new HttpsError('invalid-argument', 'Season, listing, and idempotency key are required');
  }

  return db.runTransaction(async (transaction) => {
    const idempotencyRef = db.collection(COLLECTION_IDEMPOTENCY_LOGS).doc(idempotency_key);
    const idempotencySnapshot = await transaction.get(idempotencyRef);
    if (idempotencySnapshot.exists) {
      const idempotency = idempotencySnapshot.data() as PlayIdempotencyLog;
      if (idempotency.status === 'COMPLETED') return { status: 'ALREADY_PROCESSED', listing_id: idempotency.result_reference };
      if (idempotency.status === 'PROCESSING') throw new HttpsError('aborted', 'Request is already processing');
    }

    const seasonRef = db.collection(COLLECTION_SEASON).doc(season_id);
    const seasonSnapshot = await transaction.get(seasonRef);
    if (!seasonSnapshot.exists) throw new HttpsError('not-found', 'Season not found');

    const playersSnapshot = await transaction.get(db.collection(COLLECTION_PLAYER)
      .where('season_id', '==', season_id)
      .where('user_id', '==', request.auth!.uid)
      .limit(1));
    if (playersSnapshot.empty) throw new HttpsError('not-found', 'Player not found in this season');
    const playerId = String(playersSnapshot.docs[0].data().player_id);

    const listingRef = db.collection(COLLECTION_SECONDARY_LISTING).doc(listing_id);
    const listingSnapshot = await transaction.get(listingRef);
    if (!listingSnapshot.exists) throw new HttpsError('not-found', 'Listing not found');
    const listing = listingSnapshot.data() as PlaySecondaryListing;
    if (listing.season_id !== season_id) throw new HttpsError('failed-precondition', 'Listing season mismatch');
    if (listing.seller_player_id !== playerId) throw new HttpsError('permission-denied', 'Not your listing');
    if (listing.status !== 'ACTIVE') throw new HttpsError('failed-precondition', 'Listing is not active');

    const ownershipSnapshot = await transaction.get(db.collection(COLLECTION_PROPERTY_OWNERSHIP)
      .where('season_id', '==', season_id)
      .where('player_id', '==', playerId)
      .where('property_id', '==', String(listing.property_id))
      .where('status', '==', 'ACTIVE')
      .where('locked_for_sale', '==', true)
      .limit(1));

    const timestamp = admin.firestore.Timestamp.now();
    transaction.set(idempotencyRef, {
      idempotency_key,
      season_id,
      player_id: playerId,
      simulation_period: Number(seasonSnapshot.data()?.current_simulation_period) || 0,
      operation_type: 'CANCEL_SECONDARY_LISTING',
      status: 'PROCESSING',
      created_at: timestamp,
      updated_at: timestamp
    });
    transaction.update(listingRef, { status: 'CANCELLED', updated_at: timestamp });
    if (!ownershipSnapshot.empty) {
      transaction.update(ownershipSnapshot.docs[0].ref, { locked_for_sale: false, updated_at: timestamp });
    }
    transaction.update(idempotencyRef, {
      status: 'COMPLETED',
      result_reference: listing_id,
      completed_at: timestamp,
      updated_at: timestamp
    });
    return { status: 'SUCCESS', listing_id };
  });
});
