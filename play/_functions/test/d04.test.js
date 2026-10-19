const assert = require('node:assert/strict');
const test = require('node:test');
const { createSecondaryListing } = require('../lib/play/market/createSecondaryListing');
const { executeSecondaryTransaction } = require('../lib/play/market/executeSecondaryTransaction');
const { getMarketBoard } = require('../lib/play/market/getMarketBoard');
const { createSecondaryOrder, cancelSecondaryListing, matchSecondaryOrder } = require('../lib/play/market/secondaryMarket');
const { calculateTransactionFee } = require('../lib/play/common/feeCalculator');

test('secondary listing rejects unauthenticated requests', async () => {
  await assert.rejects(
    createSecondaryListing.run({ auth: null, data: {} }),
    error => error.code === 'unauthenticated'
  );
});

test('secondary purchase rejects unauthenticated requests', async () => {
  await assert.rejects(
    executeSecondaryTransaction.run({ auth: null, data: {} }),
    error => error.code === 'unauthenticated'
  );
});

test('secondary listing validates required fields before database access', async () => {
  await assert.rejects(
    createSecondaryListing.run({ auth: { uid: 'seller-1' }, data: {} }),
    error => error.code === 'invalid-argument'
  );
});

test('secondary purchase validates required fields before database access', async () => {
  await assert.rejects(
    executeSecondaryTransaction.run({ auth: { uid: 'buyer-1' }, data: {} }),
    error => error.code === 'invalid-argument'
  );
});

test('transaction fee applies configured price and area thresholds', () => {
  assert.equal(calculateTransactionFee(600_000_000, 85), 6_600_000);
  assert.equal(calculateTransactionFee(600_000_000, 86), 7_800_000);
  assert.equal(calculateTransactionFee(750_000_000, 85), 17_250_000);
  assert.equal(calculateTransactionFee(900_000_000, 85), 21_600_000);
  assert.equal(calculateTransactionFee(900_000_001, 85), 29_700_000);
});

test('market board rejects unauthenticated requests', async () => {
  await assert.rejects(
    getMarketBoard.run({ auth: null, data: {} }),
    error => error.code === 'unauthenticated'
  );
});

test('market board validates the season before querying market collections', async () => {
  await assert.rejects(
    getMarketBoard.run({ auth: { uid: 'hero-user' }, data: {} }),
    error => error.code === 'invalid-argument'
  );
});

test('secondary order creation rejects invalid prices before database access', async () => {
  await assert.rejects(
    createSecondaryOrder.run({
      auth: { uid: 'hero-user' },
      data: { season_id: 'S_FINAL', property_id: 'property-1', side: 'BUY', price: -1, idempotency_key: 'test-key' }
    }),
    error => error.code === 'invalid-argument'
  );
});

test('secondary matching rejects unauthenticated requests', async () => {
  await assert.rejects(
    matchSecondaryOrder.run({ auth: null, data: {} }),
    error => error.code === 'unauthenticated'
  );
});


test('legacy secondary listing cancellation rejects unauthenticated requests', async () => {
  await assert.rejects(
    cancelSecondaryListing.run({ auth: null, data: {} }),
    error => error.code === 'unauthenticated'
  );
});

test('legacy secondary listing cancellation validates identifiers before database access', async () => {
  await assert.rejects(
    cancelSecondaryListing.run({ auth: { uid: 'seller-1' }, data: {} }),
    error => error.code === 'invalid-argument'
  );
});
