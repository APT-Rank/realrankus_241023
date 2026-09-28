import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTION_SEASON, COLLECTION_PLAYER, COLLECTION_PLAYER_ASSET, COLLECTION_PRIMARY_SUPPLY, COLLECTION_PROPERTY_OWNERSHIP, COLLECTION_PROPERTY_TRANSACTION, COLLECTION_DECISION_LOG, COLLECTION_IDEMPOTENCY_LOGS, COLLECTION_LOAN } from '../common/db';
import { PlaySeason, PlayPlayerAsset, PlayPrimarySupply, PlayPropertyOwnership, PlayPropertyTransaction, PlayDecisionLog, PlayIdempotencyLog, PlayLoan } from '../common/types';
// removed admin
import { FieldValue } from 'firebase-admin/firestore';
import { logResearchEventAsync } from '../research/researchLogger';
import { calculateTransactionFee } from '../common/feeCalculator';

export const purchasePrimaryProperty = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { season_id, property_id, idempotency_key, research_context } = request.data;
  const user_id = request.auth.uid;

  if (!season_id || !property_id || !idempotency_key) {
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
    event_type: 'ACTION', payload: { action_type: 'PRIMARY_PURCHASE', property_id, idempotency_key }, schema_version: '1.0'
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

      // 3. Fetch Player
      const playersSnap = await transaction.get(db.collection(COLLECTION_PLAYER).where('season_id', '==', season_id).where('user_id', '==', user_id));
      if (playersSnap.empty) throw new HttpsError('not-found', 'Player not found in this season');
      const player = playersSnap.docs[0].data();
      const player_id = player.player_id;

      // 4. Fetch Player Asset
      const assetRef = db.collection(COLLECTION_PLAYER_ASSET).doc(player_id);
      const assetDoc = await transaction.get(assetRef);
      if (!assetDoc.exists) throw new HttpsError('not-found', 'Player asset not found');
      const asset = assetDoc.data() as PlayPlayerAsset;

      // 5. Resolve Primary Supply from property_id
      const supplyQuery = await transaction.get(
        db.collection(COLLECTION_PRIMARY_SUPPLY)
          .where('season_id', '==', season_id)
          .where('property_id', '==', property_id)
          .limit(1)
      );
      if (supplyQuery.empty) throw new HttpsError('not-found', 'Primary supply not found for this property');
      const supplyDoc = supplyQuery.docs[0];
      const supplyRef = supplyDoc.ref;
      const supply = supplyDoc.data() as PlayPrimarySupply;

      if (supply.remaining_supply < 1) {
        throw new HttpsError('failed-precondition', 'Insufficient supply');
      }

      // 5b. Resolve Property Master for Area
      const masterRef = db.collection('PLAY_PROPERTY_MASTER').doc(property_id);
      const masterDoc = await transaction.get(masterRef);
      if (!masterDoc.exists) throw new HttpsError('not-found', 'Property master not found');
      const master = masterDoc.data() as any;
      
      if (!master.tradable) {
        throw new HttpsError('failed-precondition', 'Property is not tradable');
      }

      const area = master.representative_area_sqm;
      if (!area) throw new HttpsError('failed-precondition', 'Property area information missing');

      // 6. Calculate Price & Fees (IA-03B.1 Rule)
      const price = supply.initial_price;
      const purchaseFee = calculateTransactionFee(price, area);
      const totalCost = price + purchaseFee;

      // 7. Loan Calculation & Validation
      const loan_request = request.data.loan_request || 0;
      let final_loan_amount = 0;
      let monthly_payment = 0;
      let annual_debt_service = 0;
      let interest_rate = 0;
      let loan_term = 360;

      if (loan_request > 0) {
        const ltv_limit = season.config?.primary_supply_ratio || 0.7; // default LTV 70% if not set
        const max_ltv_loan = price * ltv_limit;
        
        const base_rate = 0.03; // Assume 3% base rate
        interest_rate = base_rate + 0.015 + 0.002; // Base + 1.5% + 0.2% Normal Risk Spread
        
        // DSR check: we need player's income. Assume default income if not specified.
        const annual_income = 70000000; // 70M KRW default income for DSR calculation
        const dsr_limit = 0.5;
        const max_annual_debt = annual_income * dsr_limit;
        
        // Fetch existing loans for DSR
        const existingLoansSnap = await transaction.get(
          db.collection(COLLECTION_LOAN)
            .where('participant_id', '==', player_id)
            .where('status', '==', 'ACTIVE')
        );
        
        let existing_annual_debt = 0;
        existingLoansSnap.forEach(doc => {
          existing_annual_debt += doc.data().annual_debt_service || 0;
        });

        // Calculate loan_term dynamically from season remaining periods
        const total_periods = season.total_simulation_periods || 360;
        const current_period = season.current_simulation_period || 0;
        const remaining_periods = total_periods - current_period;
        loan_term = Math.min(360, Math.max(1, remaining_periods));

        // Calculate requested loan details
        const monthly_rate = interest_rate / 12;
        const requested_monthly = loan_request * (monthly_rate * Math.pow(1 + monthly_rate, loan_term)) / (Math.pow(1 + monthly_rate, loan_term) - 1);
        const requested_annual = requested_monthly * 12;

        if (loan_request > max_ltv_loan) {
           throw new HttpsError('failed-precondition', 'Loan amount exceeds LTV limit');
        }

        if (existing_annual_debt + requested_annual > max_annual_debt) {
           throw new HttpsError('failed-precondition', 'Loan amount exceeds DSR limit');
        }

        final_loan_amount = loan_request;
        monthly_payment = requested_monthly;
        annual_debt_service = requested_annual;
      }

      if (asset.cash_available + final_loan_amount < totalCost) {
        throw new HttpsError('failed-precondition', 'Insufficient cash');
      }

      // 8. Initialize Idempotency Log processing state
      transaction.set(idempRef, {
        idempotency_key,
        season_id,
        player_id,
        simulation_period: season.current_simulation_period,
        operation_type: 'PRIMARY_PURCHASE',
        status: 'PROCESSING',
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp()
      });

      // 9. Prepare Documents
      const transactionRef = db.collection(COLLECTION_PROPERTY_TRANSACTION).doc();
      const ownershipRef = db.collection(COLLECTION_PROPERTY_OWNERSHIP).doc();
      const decisionRef = db.collection(COLLECTION_DECISION_LOG).doc();
      const loanRef = final_loan_amount > 0 ? db.collection(COLLECTION_LOAN).doc() : null;

      // Update Supply
      transaction.update(supplyRef, {
        remaining_supply: FieldValue.increment(-1),
        updated_at: FieldValue.serverTimestamp()
      });

      // Update Player Asset
      const cash_before = asset.cash_total;
      const net_worth_before = asset.net_worth;
      
      const new_cash = asset.cash_total + final_loan_amount - totalCost;
      const new_cash_available = asset.cash_available + final_loan_amount - totalCost;
      const new_debt = asset.debt_total + final_loan_amount;
      const new_property_count = asset.property_count + 1;
      const new_net_worth = net_worth_before - purchaseFee; 

      transaction.update(assetRef, {
        cash_total: new_cash,
        cash_available: new_cash_available,
        debt_total: new_debt,
        property_count: new_property_count,
        net_worth: new_net_worth,
        updated_at: FieldValue.serverTimestamp()
      });

      if (loanRef) {
        const playLoan: PlayLoan = {
          loan_id: loanRef.id,
          season_id,
          participant_id: player_id,
          transaction_id: transactionRef.id,
          property_id: supply.property_id,
          principal: final_loan_amount,
          outstanding_principal: final_loan_amount,
          interest_rate: interest_rate,
          term_months: loan_term,
          remaining_months: loan_term,
          monthly_payment,
          annual_debt_service,
          status: 'ACTIVE',
          created_at: FieldValue.serverTimestamp() as any,
          updated_at: FieldValue.serverTimestamp() as any
        };
        transaction.set(loanRef, playLoan);
      }

      // Create Transaction
      const propTransaction: PlayPropertyTransaction = {
        transaction_id: transactionRef.id,
        season_id,
        property_id: supply.property_id,
        transaction_type: 'PRIMARY_PURCHASE',
        buyer_player_id: player_id,
        seller_player_id: null,
        price,
        buyer_fee: purchaseFee,
        seller_fee: 0,
        total_buyer_cash_change: -totalCost,
        total_seller_cash_change: 0,
        status: 'COMPLETED',
        idempotency_key,
        created_at: FieldValue.serverTimestamp() as any
      };
      transaction.set(transactionRef, propTransaction);

      // Create Ownership
      const ownership: PlayPropertyOwnership = {
        ownership_id: ownershipRef.id,
        season_id,
        property_id: supply.property_id,
        player_id,
        acquisition_type: 'PRIMARY',
        acquisition_price: price,
        acquired_at: FieldValue.serverTimestamp() as any,
        acquisition_transaction_id: transactionRef.id,
        status: 'ACTIVE',
        locked_for_sale: false,
        created_at: FieldValue.serverTimestamp() as any,
        updated_at: FieldValue.serverTimestamp() as any
      };
      transaction.set(ownershipRef, ownership);

      // Create Decision Log
      const decisionLog: PlayDecisionLog = {
        season_id,
        player_id,
        simulation_period: season.current_simulation_period,
        batch_id: 'USER_ACTION', 
        action_type: 'PRIMARY_PURCHASE',
        property_id: supply.property_id,
        transaction_id: transactionRef.id,
        before_cash: cash_before,
        after_cash: new_cash,
        before_net_worth: net_worth_before,
        after_net_worth: new_net_worth,
        property_count_before: asset.property_count,
        property_count_after: new_property_count,
        result: 'SUCCESS',
        created_at: FieldValue.serverTimestamp() as any
      };
      transaction.set(decisionRef, decisionLog);

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
      code = error.message === 'Insufficient cash' ? 'INSUFFICIENT_CASH' : 
             error.message === 'Insufficient supply' ? 'INSUFFICIENT_SUPPLY' : error.code.toUpperCase();
    }
    
    logResearchEventAsync({
      correlation_id, trace_id, request_id, season_id, participant_id, simulation_period: sim_period,
      event_type: 'VALIDATION', payload: { validation_status: 'REJECTED', validation_code: code, validation_reason: reason }, schema_version: '1.0'
    });

    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', error.message || 'Transaction failed');
  }
});
