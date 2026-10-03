import { onRequest } from 'firebase-functions/v2/https';
import { db, COLLECTION_BATCH, COLLECTION_BATCH_CHUNKS, COLLECTION_LOAN, COLLECTION_PLAYER_ASSET, COLLECTION_PRIMARY_SUPPLY } from '../common/db';
import { checkTransactionStatus } from '../common/utils';
import { PlayBatch, PlayBatchChunk, PlayLoan, PlayPlayerAsset } from '../common/types';
import * as admin from 'firebase-admin';
import { verifyInternalTask } from '../common/internalAuth';
import {
  applyAnnualIncomeGrowth,
  calculateEconomicState,
  calculateEconomicStateWithSeasonInflation,
  calculateMonthlyLoanPayment,
  BASE_MONTHLY_LIVING_EXPENSE,
  getAnnualIncomeForPeriod,
  normalizeAnnualRate
} from './economicEngine';

let globalTestProperties: any[] | null = null;

export const processBatchChunk = onRequest(async (req, res) => {
  try {
    await verifyInternalTask(req, res);
    
    const { 
      season_id, batch_id, chunk_id, simulation_period,
      scenario_id, scenario_version, rule_version,
      // For failure injection testing
      inject_crash_before_commit_player,
      inject_crash_after_commit_player,
      inject_partial_failure_player,
      inject_mid_chunk_crash_after_player
    } = req.body.data || {};

    if (season_id === 'test_hero_season' && globalTestProperties === null) {
        const supplyQuery = await db.collection(COLLECTION_PRIMARY_SUPPLY)
            .where('season_id', '==', season_id)
            .where('remaining_supply', '>', 0)
            .limit(20)
            .get();
        globalTestProperties = supplyQuery.docs.map(d => d.data());
    }
    
    if (!chunk_id || !batch_id || !season_id) {
      res.status(400).send({ error: 'invalid-argument', message: 'Missing core chunk identifiers' });
      return;
    }

    await checkTransactionStatus(season_id);

    // 1. Verify Batch & Chunk
    const batchRef = db.collection(COLLECTION_BATCH).doc(batch_id);
    const batchDoc = await batchRef.get();
    if (!batchDoc.exists) {
      res.status(400).send({ error: 'invalid-argument', message: 'Batch not found' });
      return;
    }
    const batch = batchDoc.data() as PlayBatch;
    const batchIncomeGrowth = normalizeAnnualRate(batch.income_rate, null);
    const annualInflation = normalizeAnnualRate(batch.inflation, null)
      ?? (batchIncomeGrowth === null ? null : batchIncomeGrowth + 0.005);
    
    // Scenario / Rule Version Mismatch Check (P3-09)
    if (
      batch.scenario_id !== scenario_id || 
      batch.scenario_version !== scenario_version || 
      batch.rule_version !== rule_version
    ) {
      console.error('Mismatch in scenario/rule versions', { batch, req: req.body.data });
      res.status(400).send({ error: 'invalid-argument', message: 'SCENARIO_VERSION_MISMATCH or RULE_VERSION_MISMATCH' });
      return;
    }
    
    // Wrong Season / Period / Batch Check (P3-10)
    if (batch.season_id !== season_id || batch.simulation_period !== simulation_period) {
      res.status(400).send({ error: 'invalid-argument', message: 'WRONG_SEASON_OR_PERIOD' });
      return;
    }

    const chunkRef = db.collection(COLLECTION_BATCH_CHUNKS).doc(chunk_id);
    const chunkDoc = await chunkRef.get();
    if (!chunkDoc.exists) {
      res.status(404).send({ error: 'not-found', message: 'Chunk not found' });
      return;
    }
    const chunk = chunkDoc.data() as PlayBatchChunk;
    
    if (chunk.status === 'COMPLETED') {
      res.status(200).send({ result: { status: 'ALREADY_COMPLETED' } });
      return;
    }

    // Mark chunk as RUNNING if it's currently PENDING or DISPATCHED
    if (chunk.status !== 'RUNNING') {
      await chunkRef.update({
        status: 'RUNNING',
        attempt_count: admin.firestore.FieldValue.increment(1),
        updated_at: admin.firestore.Timestamp.now()
      });
    } else {
      // It's already RUNNING, this could be a duplicate delivery or concurrent run.
      // We still process it but increment attempt_count.
      await chunkRef.update({
        attempt_count: admin.firestore.FieldValue.increment(1),
        updated_at: admin.firestore.Timestamp.now()
      });
    }

    // Resolve chunk players deterministically using the locked target_players array
    const playerIds: string[] = chunk.target_players || [];
    
    if (playerIds.length === 0 && chunk.player_count > 0) {
      throw new Error('internal: No active players found for this chunk offset');
    }

    let processed = 0;
    let failed = 0;
    let errors: any[] = [];
    
    let processedPlayersInThisRun = 0;

    for (const player_id of playerIds) {
      const assetRef = db.collection(COLLECTION_PLAYER_ASSET).doc(player_id);

      // P3-08: Partial Player Failure injection
      if (inject_partial_failure_player === player_id) {
         errors.push(`Injected partial failure for player ${player_id}`);
         failed++;
         continue; // Skip this player, process others
      }

      try {
        await db.runTransaction(async (t) => {
          const assetDoc = await t.get(assetRef);
          if (!assetDoc.exists) return; // Player has no asset, skip

          const asset = assetDoc.data() as PlayPlayerAsset;

          // P3-11: Already Processed Player & Player-level Idempotency Check
          // We uniquely identify processing by period.
          const assetProcessedPeriod = asset.last_processed_period ?? 0;
          const processedBatches = asset.processed_batches || [];
          
          if (assetProcessedPeriod > simulation_period) {
             // ALREADY_PROCESSED for a future period (handles out of order)
             return;
          }
          if (assetProcessedPeriod === simulation_period && processedBatches.includes(batch_id)) {
            // ALREADY_PROCESSED for this exact batch in this period
            return;
          }

          // If we advanced to a new period, reset the processed_batches array
          const newProcessedBatches = assetProcessedPeriod < simulation_period ? [batch_id] : [...processedBatches, batch_id];

          const priorAnnualIncome = asset.annual_income
            ?? (asset.monthly_income != null ? asset.monthly_income * 12 : getAnnualIncomeForPeriod(assetProcessedPeriod));
          const economicStateBeforeIncomeUpdate = calculateEconomicState(simulation_period, priorAnnualIncome);
          const annualIncomeGrowth = normalizeAnnualRate(batch.income_rate, economicStateBeforeIncomeUpdate.annual_income_growth)
            ?? economicStateBeforeIncomeUpdate.annual_income_growth;
          const annualIncome = assetProcessedPeriod < simulation_period && simulation_period > 0 && simulation_period % 12 === 0
            ? applyAnnualIncomeGrowth(priorAnnualIncome, annualIncomeGrowth)
            : priorAnnualIncome;
          const storedInflationFactor = Number(asset.cumulative_inflation_factor);
          const legacyInflationFactor = Number(asset.monthly_living_expense) / BASE_MONTHLY_LIVING_EXPENSE;
          const priorInflationFactor = Number.isFinite(storedInflationFactor) && storedInflationFactor > 0
            ? storedInflationFactor
            : Number.isFinite(legacyInflationFactor) && legacyInflationFactor > 0
              ? legacyInflationFactor
              : 1;
          const economicState = annualInflation === null
            ? calculateEconomicState(simulation_period, annualIncome)
            : calculateEconomicStateWithSeasonInflation(
              simulation_period,
              annualIncome,
              annualInflation,
              priorInflationFactor,
              assetProcessedPeriod < simulation_period
            );
          const monthlyIncome = Math.round(annualIncome / 12);

          let activeLoans: Array<{ ref: FirebaseFirestore.DocumentReference; loan: PlayLoan }> = [];
          if ((asset.debt_total || 0) > 0) {
            const activeLoanQuery = db.collection(COLLECTION_LOAN)
              .where('participant_id', '==', player_id)
              .where('status', '==', 'ACTIVE');
            const activeLoanSnapshot = await t.get(activeLoanQuery);
            activeLoans = activeLoanSnapshot.docs
              .filter(document => document.data().season_id === season_id)
              .map(document => ({ ref: document.ref, loan: document.data() as PlayLoan }));
          }

          let monthlyLoanPayment = 0;
          let totalPrincipalRepaid = 0;
          const now = admin.firestore.Timestamp.now();
          activeLoans.forEach(({ ref, loan }) => {
            const outstandingPrincipal = Math.max(0, Number(loan.outstanding_principal ?? loan.principal) || 0);
            const remainingMonths = Math.max(1, Math.floor(Number(loan.remaining_months) || 1));
            const originalBaseRate = normalizeAnnualRate(loan.base_interest_at_origination, 0.03) ?? 0.03;
            const originalInterestRate = normalizeAnnualRate(loan.interest_rate, originalBaseRate + 0.017) ?? originalBaseRate + 0.017;
            const rateSpread = Number.isFinite(loan.rate_spread) ? Number(loan.rate_spread) : originalInterestRate - originalBaseRate;
            const currentBaseRate = normalizeAnnualRate(batch.base_interest, null);
            const annualInterestRate = Math.max(0, currentBaseRate === null ? originalInterestRate : currentBaseRate + rateSpread);
            const calculatedPayment = calculateMonthlyLoanPayment(outstandingPrincipal, annualInterestRate, remainingMonths);
            const monthlyInterest = Math.round(outstandingPrincipal * annualInterestRate / 12);
            const payment = Math.round(Math.min(outstandingPrincipal + monthlyInterest, calculatedPayment));
            const principalRepaid = Math.min(outstandingPrincipal, Math.max(0, payment - monthlyInterest));
            const nextOutstandingPrincipal = Math.max(0, outstandingPrincipal - principalRepaid);
            const nextRemainingMonths = nextOutstandingPrincipal === 0 ? 0 : remainingMonths - 1;

            monthlyLoanPayment += payment;
            totalPrincipalRepaid += principalRepaid;
            t.update(ref, {
              interest_rate: annualInterestRate,
              outstanding_principal: nextOutstandingPrincipal,
              remaining_months: nextRemainingMonths,
              monthly_payment: payment,
              annual_debt_service: payment * 12,
              status: nextOutstandingPrincipal === 0 ? 'PAID_OFF' : 'ACTIVE',
              updated_at: now
            });
          });

          const before_cash = asset.cash_total;
          const monthlyOutflow = economicState.monthly_living_expense + monthlyLoanPayment;
          const after_cash_total = before_cash + monthlyIncome - monthlyOutflow;
          const after_cash_available = asset.cash_available + monthlyIncome - monthlyOutflow;
          const debt = Math.max(0, (asset.debt_total || 0) - totalPrincipalRepaid);
          const after_net_worth = Number.isFinite(asset.net_worth)
            ? asset.net_worth + (after_cash_total - before_cash) + totalPrincipalRepaid
            : after_cash_total + (asset.financial_asset_total || 0) - debt;

          // P3-04: Crash Before Commit
          if (inject_crash_before_commit_player === player_id) {
             throw new Error('INJECTED_CRASH_BEFORE_COMMIT');
          }

          t.update(assetRef, {
            cash_total: after_cash_total,
            cash_available: after_cash_available,
            debt_total: debt,
            net_worth: after_net_worth,
            annual_income: annualIncome,
            monthly_income: monthlyIncome,
            monthly_living_expense: economicState.monthly_living_expense,
            cumulative_inflation_factor: economicState.cumulative_inflation_factor,
            monthly_loan_payment: monthlyLoanPayment,
            last_processed_period: simulation_period,
            last_processed_batch_id: batch_id,
            processed_batches: newProcessedBatches,
            last_processed_at: now,
            updated_at: now
          });

          // ACTIVE_TRADING_TEST Strategy Execution (using real market logic)
          if (season_id === 'test_hero_season' || scenario_id === 'ACTIVE_TRADING_TEST') {
              try {
                  const internalMarket = require('../market/internalMarketService');
                  
                  // Pick a valid property from test supply pool (pseudo-random based on period/player)
                  if (globalTestProperties && globalTestProperties.length > 0) {
                      const propIdx = (simulation_period + player_id.charCodeAt(player_id.length - 1)) % globalTestProperties.length;
                      const targetPropertyId = globalTestProperties[propIdx].property_id;
                      
                      // 1. BUY (Primary)
                      const buyResult = await internalMarket.internalPurchasePrimaryProperty(t, season_id, player_id, targetPropertyId, simulation_period);
                      
                      // 2. SELL (Secondary) immediately to satisfy the 2-tx-per-period goal
                      await internalMarket.internalExecuteSecondarySale(t, season_id, player_id, buyResult.ownership_id, buyResult.property_id, simulation_period);
                  }
              } catch (strategyError) {
                  // If supply runs out or constraint fails, we swallow it for this period to not crash the batch.
                  console.warn(`Strategy execution failed for ${player_id}`, strategyError);
              }
          }
        });

        // P3-05: Crash After Commit
        if (inject_crash_after_commit_player === player_id) {
           throw new Error('INJECTED_CRASH_AFTER_COMMIT'); // Will crash the worker after transaction succeeds
        }

        processed++;
        processedPlayersInThisRun++;
        
        // P3-07: Mid-Chunk Crash
        if (inject_mid_chunk_crash_after_player === player_id) {
           throw new Error('INJECTED_MID_CHUNK_CRASH'); // Will crash the worker and abort remaining
        }

      } catch (e: any) {
        console.error(`Error processing player ${player_id}`, e);
        if (e.message.includes('INJECTED_CRASH_AFTER_COMMIT') || e.message.includes('INJECTED_MID_CHUNK_CRASH')) {
           // We intentionally break the entire execution to simulate a real instance crash
           throw e; 
        }
        
        errors.push(e.message || e.toString());
        failed++;
      }
    }

    const finalStatus = failed === 0 ? 'COMPLETED' : 'FAILED';

    await chunkRef.update({
      status: finalStatus,
      processed_count: processed,
      failed_count: failed,
      completed_at: finalStatus === 'COMPLETED' ? admin.firestore.Timestamp.now() : null,
      updated_at: admin.firestore.Timestamp.now(),
      error_message: failed > 0 ? `${failed} players failed: ${errors.join(', ')}` : null
    });

    res.status(200).send({ result: { status: finalStatus, processed, failed, errors } });
  } catch (e: any) {
    if (!res.headersSent) {
      res.status(500).send({ error: e.message });
    }
  }
});
