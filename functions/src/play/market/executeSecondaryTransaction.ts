import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTION_SEASON, COLLECTION_PLAYER, COLLECTION_PLAYER_ASSET, COLLECTION_PROPERTY_OWNERSHIP, COLLECTION_PROPERTY_MASTER, COLLECTION_SECONDARY_LISTING, COLLECTION_PROPERTY_TRANSACTION, COLLECTION_DECISION_LOG, COLLECTION_IDEMPOTENCY_LOGS } from '../common/db';
import { PlaySeason, PlayPlayerAsset, PlayPropertyOwnership, PlaySecondaryListing, PlayPropertyTransaction, PlayIdempotencyLog } from '../common/types';
// removed admin
import { FieldValue } from 'firebase-admin/firestore';
import { logResearchEventAsync } from '../research/researchLogger';
import { calculateTransactionFee } from '../common/feeCalculator';

export const executeSecondaryTransaction = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { season_id, listing_id, idempotency_key, research_context } = request.data;
  const user_id = request.auth.uid; // Buyer user ID

  if (!season_id || !listing_id || !idempotency_key) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  const trace_id = research_context?.trace_id || `TR_${Date.now()}`;
  const correlation_id = research_context?.correlation_id || trace_id;
  const request_id = research_context?.request_id || idempotency_key;
  const participant_id = research_context?.participant_id || user_id;
  const sim_period = research_context?.simulation_period || 0;

  if (research_context) {
    if (research_context.exposure) {
      logResearchEventAsync({
        correlation_id, trace_id, request_id, season_id, participant_id, simulation_period: sim_period,
        event_type: 'EXPOSURE', payload: research_context.exposure, schema_version: '1.0'
      });
    }
    if (research_context.decision) {
      logResearchEventAsync({
        correlation_id, trace_id, request_id, season_id, participant_id, simulation_period: sim_period,
        event_type: 'DECISION', payload: research_context.decision, schema_version: '1.0'
      });
    }
  }

  logResearchEventAsync({
    correlation_id, trace_id, request_id, season_id, participant_id, simulation_period: sim_period,
    event_type: 'ACTION', payload: { action_type: 'SECONDARY_PURCHASE', listing_id, idempotency_key }, schema_version: '1.0'
  });

  try {
    const result = await db.runTransaction(async (transaction) => {
      // 1. Idempotency Check
      const idempRef = db.collection(COLLECTION_IDEMPOTENCY_LOGS).doc(idempotency_key);
      const idempDoc = await transaction.get(idempRef);
      if (idempDoc.exists) {
        const idempData = idempDoc.data() as PlayIdempotencyLog;
        if (idempData.status === 'COMPLETED') {
          return { status: 'ALREADY_PROCESSED', transaction_id: idempData.result_reference };
        } else if (idempData.status === 'PROCESSING') {
          throw new HttpsError('aborted', 'Request is already processing');
        }
      }

      // 2. Fetch Season
      const seasonRef = db.collection(COLLECTION_SEASON).doc(season_id);
      const seasonDoc = await transaction.get(seasonRef);
      if (!seasonDoc.exists) throw new HttpsError('not-found', 'Season not found');
      const season = seasonDoc.data() as PlaySeason;
      
      if (season.status !== 'ACTIVE') throw new HttpsError('failed-precondition', 'Season is not ACTIVE');
      if (season.transaction_status === 'TRANSACTION_PAUSED') throw new HttpsError('failed-precondition', 'Transactions are paused');

      // 3. Fetch Buyer Player
      const buyersSnap = await transaction.get(db.collection(COLLECTION_PLAYER).where('season_id', '==', season_id).where('user_id', '==', user_id));
      if (buyersSnap.empty) throw new HttpsError('not-found', 'Buyer player not found in this season');
      const buyer_player_id = buyersSnap.docs[0].data().player_id;

      // 4. Fetch Listing
      const listingRef = db.collection(COLLECTION_SECONDARY_LISTING).doc(listing_id);
      const listingDoc = await transaction.get(listingRef);
      if (!listingDoc.exists) throw new HttpsError('not-found', 'Listing not found');
      const listing = listingDoc.data() as PlaySecondaryListing;

      if (listing.status !== 'ACTIVE') {
        throw new HttpsError('failed-precondition', 'Listing is not active');
      }
      
      if (season.current_simulation_period >= listing.expires_simulation_period) {
        // Automatically expire this listing conceptually (actual status update could be done by a batch or here)
        throw new HttpsError('failed-precondition', 'Listing is expired');
      }

      if (listing.seller_player_id === buyer_player_id) {
        throw new HttpsError('failed-precondition', 'Seller cannot buy their own listing');
      }

      const price = listing.price;
      const property_id = listing.property_id;

      // 5. Fetch Property Master
      const masterRef = db.collection(COLLECTION_PROPERTY_MASTER).doc(property_id);
      const masterDoc = await transaction.get(masterRef);
      if (!masterDoc.exists) throw new HttpsError('not-found', 'Property master not found');
      const master = masterDoc.data() as any;
      if (!master.tradable) {
        throw new HttpsError('failed-precondition', 'Property is not tradable');
      }
      const area = master.representative_area_sqm;

      // 6. Fetch Seller Ownership
      const ownershipQuery = await transaction.get(
        db.collection(COLLECTION_PROPERTY_OWNERSHIP)
          .where('season_id', '==', season_id)
          .where('property_id', '==', property_id)
          .where('player_id', '==', listing.seller_player_id)
          .where('status', '==', 'ACTIVE')
          .limit(1)
      );
      if (ownershipQuery.empty) throw new HttpsError('failed-precondition', 'Seller no longer owns this property');
      const ownershipDoc = ownershipQuery.docs[0];
      const ownership = ownershipDoc.data() as PlayPropertyOwnership;

      if (!ownership.locked_for_sale) {
         // It should be locked, but if not we proceed anyway as we are the buyer claiming it, 
         // though ideally createListing locks it.
      }

      // 7. Calculate Fees (75% Seller, 25% Buyer)
      const totalFee = calculateTransactionFee(price, area);
      const sellerFee = Math.floor(totalFee * 0.75);
      const buyerFee = Math.floor(totalFee * 0.25);

      const totalBuyerCost = price + buyerFee;
      const totalSellerProceeds = price - sellerFee;

      // 8. Fetch Buyer Asset
      const buyerAssetRef = db.collection(COLLECTION_PLAYER_ASSET).doc(buyer_player_id);
      const buyerAssetDoc = await transaction.get(buyerAssetRef);
      if (!buyerAssetDoc.exists) throw new HttpsError('not-found', 'Buyer asset not found');
      const buyerAsset = buyerAssetDoc.data() as PlayPlayerAsset;

      if (buyerAsset.cash_available < totalBuyerCost) {
        throw new HttpsError('failed-precondition', 'Insufficient cash');
      }

      // 9. Fetch Seller Asset
      const sellerAssetRef = db.collection(COLLECTION_PLAYER_ASSET).doc(listing.seller_player_id);
      const sellerAssetDoc = await transaction.get(sellerAssetRef);
      if (!sellerAssetDoc.exists) throw new HttpsError('not-found', 'Seller asset not found');
      const sellerAsset = sellerAssetDoc.data() as PlayPlayerAsset;

      // 10. Initialize Idempotency Log
      transaction.set(idempRef, {
        idempotency_key,
        season_id,
        player_id: buyer_player_id,
        simulation_period: season.current_simulation_period,
        operation_type: 'SECONDARY_PURCHASE',
        status: 'PROCESSING',
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp()
      });

      // 11. Prepare Updates
      const transactionRef = db.collection(COLLECTION_PROPERTY_TRANSACTION).doc();
      const newOwnershipRef = db.collection(COLLECTION_PROPERTY_OWNERSHIP).doc();
      
      const buyerDecisionRef = db.collection(COLLECTION_DECISION_LOG).doc();
      const sellerDecisionRef = db.collection(COLLECTION_DECISION_LOG).doc();

      // Mark Listing as SOLD
      transaction.update(listingRef, {
        status: 'SOLD',
        updated_at: FieldValue.serverTimestamp()
      });

      // Update Seller Ownership (Mark as SOLD)
      transaction.update(ownershipDoc.ref, {
        status: 'SOLD',
        locked_for_sale: false,
        updated_at: FieldValue.serverTimestamp()
      });

      // Create Buyer Ownership
      const newOwnership: PlayPropertyOwnership = {
        ownership_id: newOwnershipRef.id,
        season_id,
        property_id,
        player_id: buyer_player_id,
        acquisition_type: 'SECONDARY',
        acquisition_price: price,
        acquired_at: FieldValue.serverTimestamp() as any,
        acquisition_transaction_id: transactionRef.id,
        status: 'ACTIVE',
        locked_for_sale: false,
        created_at: FieldValue.serverTimestamp() as any,
        updated_at: FieldValue.serverTimestamp() as any
      };
      transaction.set(newOwnershipRef, newOwnership);

      // Update Buyer Asset
      const buyer_cash_before = buyerAsset.cash_total;
      const buyer_nw_before = buyerAsset.net_worth;
      const new_buyer_cash = buyerAsset.cash_total - totalBuyerCost;
      const new_buyer_cash_avail = buyerAsset.cash_available - totalBuyerCost;
      const new_buyer_prop_count = buyerAsset.property_count + 1;
      const new_buyer_nw = buyer_nw_before - buyerFee; 
      
      transaction.update(buyerAssetRef, {
        cash_total: new_buyer_cash,
        cash_available: new_buyer_cash_avail,
        property_count: new_buyer_prop_count,
        net_worth: new_buyer_nw,
        updated_at: FieldValue.serverTimestamp()
      });

      // Update Seller Asset
      const seller_cash_before = sellerAsset.cash_total;
      const seller_nw_before = sellerAsset.net_worth;
      const new_seller_cash = sellerAsset.cash_total + totalSellerProceeds;
      const new_seller_cash_avail = sellerAsset.cash_available + totalSellerProceeds;
      const new_seller_prop_count = sellerAsset.property_count - 1;
      const new_seller_nw = seller_nw_before - sellerFee;

      transaction.update(sellerAssetRef, {
        cash_total: new_seller_cash,
        cash_available: new_seller_cash_avail,
        property_count: new_seller_prop_count,
        net_worth: new_seller_nw,
        updated_at: FieldValue.serverTimestamp()
      });

      // Create Transaction
      const propTransaction: PlayPropertyTransaction = {
        transaction_id: transactionRef.id,
        season_id,
        property_id,
        transaction_type: 'SECONDARY_TRADE',
        buyer_player_id: buyer_player_id,
        seller_player_id: listing.seller_player_id,
        price,
        buyer_fee: buyerFee,
        seller_fee: sellerFee,
        total_buyer_cash_change: -totalBuyerCost,
        total_seller_cash_change: totalSellerProceeds,
        status: 'COMPLETED',
        idempotency_key,
        created_at: FieldValue.serverTimestamp() as any
      };
      transaction.set(transactionRef, propTransaction);

      // Create Buyer Decision Log
      transaction.set(buyerDecisionRef, {
        season_id,
        player_id: buyer_player_id,
        simulation_period: season.current_simulation_period,
        batch_id: 'USER_ACTION', 
        action_type: 'SECONDARY_PURCHASE',
        property_id,
        transaction_id: transactionRef.id,
        before_cash: buyer_cash_before,
        after_cash: new_buyer_cash,
        before_net_worth: buyer_nw_before,
        after_net_worth: new_buyer_nw,
        property_count_before: buyerAsset.property_count,
        property_count_after: new_buyer_prop_count,
        result: 'SUCCESS',
        created_at: FieldValue.serverTimestamp()
      });

      // Create Seller Decision Log
      transaction.set(sellerDecisionRef, {
        season_id,
        player_id: listing.seller_player_id,
        simulation_period: season.current_simulation_period,
        batch_id: 'MARKET_MATCH', 
        action_type: 'SECONDARY_SALE',
        property_id,
        transaction_id: transactionRef.id,
        before_cash: seller_cash_before,
        after_cash: new_seller_cash,
        before_net_worth: seller_nw_before,
        after_net_worth: new_seller_nw,
        property_count_before: sellerAsset.property_count,
        property_count_after: new_seller_prop_count,
        result: 'SUCCESS',
        created_at: FieldValue.serverTimestamp()
      });

      // Mark Idempotency complete
      transaction.update(idempRef, {
        status: 'COMPLETED',
        result_reference: transactionRef.id,
        completed_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp()
      });

      return { status: 'SUCCESS', transaction_id: transactionRef.id };
    });

    logResearchEventAsync({
      correlation_id, trace_id, request_id, season_id, participant_id, simulation_period: sim_period,
      event_type: 'VALIDATION', payload: { validation_status: 'SUCCESS' }, schema_version: '1.0'
    });
    if (result.status === 'SUCCESS') {
      logResearchEventAsync({
        correlation_id, trace_id, request_id, season_id, participant_id, simulation_period: sim_period,
        event_type: 'TRANSACTION', payload: { transaction_id: result.transaction_id, status: 'COMPLETED' }, schema_version: '1.0'
      });
    }

    return result;

  } catch (error: any) {
    let code = 'INTERNAL';
    let reason = error.message;
    if (error instanceof HttpsError) {
      code = error.message === 'Insufficient cash' ? 'INSUFFICIENT_CASH' : error.code.toUpperCase();
    }
    
    logResearchEventAsync({
      correlation_id, trace_id, request_id, season_id, participant_id, simulation_period: sim_period,
      event_type: 'VALIDATION', payload: { validation_status: 'REJECTED', validation_code: code, validation_reason: reason }, schema_version: '1.0'
    });
    
    throw error;
  }
});
