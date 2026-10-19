import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTION_SEASON, COLLECTION_PLAYER, COLLECTION_PROPERTY_OWNERSHIP, COLLECTION_PROPERTY_MASTER, COLLECTION_SECONDARY_LISTING, COLLECTION_IDEMPOTENCY_LOGS } from '../common/db';
import { PlaySeason, PlayPropertyOwnership, PlaySecondaryListing, PlayIdempotencyLog } from '../common/types';
// removed admin
import { FieldValue } from 'firebase-admin/firestore';
import { logResearchEventAsync } from '../research/researchLogger';

export const createSecondaryListing = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { season_id, property_id, price, idempotency_key, research_context } = request.data;
  const user_id = request.auth.uid;

  if (!season_id || !property_id || !price || !idempotency_key) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  if (!Number.isInteger(price) || price <= 0) {
    throw new HttpsError('invalid-argument', 'Price must be a positive integer');
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
    event_type: 'ACTION', payload: { action_type: 'SECONDARY_LISTING', property_id, price, idempotency_key }, schema_version: '1.0'
  });

  try {
    const result = await db.runTransaction(async (transaction) => {
      // 1. Idempotency Check
      const idempRef = db.collection(COLLECTION_IDEMPOTENCY_LOGS).doc(idempotency_key);
      const idempDoc = await transaction.get(idempRef);
      if (idempDoc.exists) {
        const idempData = idempDoc.data() as PlayIdempotencyLog;
        if (idempData.status === 'COMPLETED') {
          return { status: 'ALREADY_PROCESSED', listing_id: idempData.result_reference };
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

      // 3. Fetch Player
      const playersSnap = await transaction.get(db.collection(COLLECTION_PLAYER).where('season_id', '==', season_id).where('user_id', '==', user_id));
      if (playersSnap.empty) throw new HttpsError('not-found', 'Player not found in this season');
      const player_id = playersSnap.docs[0].data().player_id;

      // 4. Fetch Property Master
      const masterRef = db.collection(COLLECTION_PROPERTY_MASTER).doc(property_id);
      const masterDoc = await transaction.get(masterRef);
      if (!masterDoc.exists) throw new HttpsError('not-found', 'Property master not found');
      const master = masterDoc.data() as any;
      if (!master.tradable || master.property_status === 'INCOMPLETE') {
        throw new HttpsError('failed-precondition', 'Property is not tradable');
      }

      // 5. Fetch Ownership
      const ownershipQuery = await transaction.get(
        db.collection(COLLECTION_PROPERTY_OWNERSHIP)
          .where('season_id', '==', season_id)
          .where('property_id', '==', property_id)
          .where('player_id', '==', player_id)
          .where('status', '==', 'ACTIVE')
          .limit(1)
      );
      if (ownershipQuery.empty) throw new HttpsError('failed-precondition', 'Player does not own this property');
      const ownershipDoc = ownershipQuery.docs[0];
      const ownership = ownershipDoc.data() as PlayPropertyOwnership;

      if (ownership.locked_for_sale) {
        throw new HttpsError('failed-precondition', 'Property is already locked for sale');
      }

      // 6. Prevent Duplicate Listing (Double check)
      const activeListingQuery = await transaction.get(
        db.collection(COLLECTION_SECONDARY_LISTING)
          .where('season_id', '==', season_id)
          .where('property_id', '==', property_id)
          .where('status', 'in', ['ACTIVE', 'LOCKED'])
          .limit(1)
      );
      if (!activeListingQuery.empty) {
        throw new HttpsError('failed-precondition', 'An active or locked listing already exists for this property');
      }

      // 7. Initialize Idempotency Log processing state
      transaction.set(idempRef, {
        idempotency_key,
        season_id,
        player_id,
        simulation_period: season.current_simulation_period,
        operation_type: 'SECONDARY_LISTING',
        status: 'PROCESSING',
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp()
      });

      // 8. Prepare Documents
      const listingRef = db.collection(COLLECTION_SECONDARY_LISTING).doc();
      
      // Update Ownership Lock
      transaction.update(ownershipDoc.ref, {
        locked_for_sale: true,
        updated_at: FieldValue.serverTimestamp()
      });

      // Create Listing
      const listing: PlaySecondaryListing = {
        listing_id: listingRef.id,
        season_id,
        property_id,
        seller_player_id: player_id,
        price,
        status: 'ACTIVE',
        created_simulation_period: season.current_simulation_period,
        expires_simulation_period: season.current_simulation_period + 12,
        fee_rule_version: season.rule_version || '1.0',
        idempotency_key,
        created_at: FieldValue.serverTimestamp() as any,
        updated_at: FieldValue.serverTimestamp() as any
      };
      transaction.set(listingRef, listing);

      // Mark Idempotency complete
      transaction.update(idempRef, {
        status: 'COMPLETED',
        result_reference: listingRef.id,
        completed_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp()
      });

      return { status: 'SUCCESS', listing_id: listingRef.id };
    });

    logResearchEventAsync({
      correlation_id, trace_id, request_id, season_id, participant_id, simulation_period: sim_period,
      event_type: 'VALIDATION', payload: { validation_status: 'SUCCESS' }, schema_version: '1.0'
    });
    if (result.status === 'SUCCESS') {
      logResearchEventAsync({
        correlation_id, trace_id, request_id, season_id, participant_id, simulation_period: sim_period,
        event_type: 'TRANSACTION', payload: { listing_id: result.listing_id, status: 'COMPLETED' }, schema_version: '1.0'
      });
    }

    return result;

  } catch (error: any) {
    let code = 'INTERNAL';
    let reason = error.message;
    if (error instanceof HttpsError) {
      code = error.code.toUpperCase();
    }
    
    logResearchEventAsync({
      correlation_id, trace_id, request_id, season_id, participant_id, simulation_period: sim_period,
      event_type: 'VALIDATION', payload: { validation_status: 'REJECTED', validation_code: code, validation_reason: reason }, schema_version: '1.0'
    });
    
    throw error;
  }
});
