import { setGlobalOptions } from 'firebase-functions/v2';
setGlobalOptions({ region: 'asia-northeast3' });

export { createSeason } from './play/season/createSeason';
export { joinSeason } from './play/season/joinSeason';
export { getPlayerState } from './play/season/getPlayerState';
export { advanceSeasonClock } from './play/season/advanceSeasonClock';
export { startActiveSeasonClocks } from './play/season/startActiveSeasonClocks';

export { createEconomicBatch, createEconomicBatchTask } from './play/batch/createEconomicBatch';
export { dispatchBatchChunks, dispatchBatchChunksTask } from './play/batch/dispatchBatchChunks';
export { processBatchChunk } from './play/batch/processBatchChunk';
export { aggregateBatch } from './play/batch/aggregateBatch';

export { runReconciliation } from './play/reconciliation/runReconciliation';

export { pauseTransactions, resumeTransactions, healthCheck } from './play/admin/adminFunctions';
export { controlSimulation } from './play/admin/controlSimulation';

export { purchasePrimaryProperty } from './play/market/purchasePrimaryProperty';
export { createSecondaryListing } from './play/market/createSecondaryListing';
export { executeSecondaryTransaction } from './play/market/executeSecondaryTransaction';
export { recordComplexDealHistory } from './play/market/recordComplexDealHistory';
// export { createSecondaryOrder, cancelSecondaryOrder, matchSecondaryOrder } from './play/market/secondaryMarket';
