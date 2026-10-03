const assert = require('node:assert/strict');
const test = require('node:test');
const { findInvalidIncompletePropertyIds } = require('../lib/play/reconciliation/propertyIntegrity');

test('incomplete properties must be explicitly non-tradable without constraining inventory counts', () => {
  const invalidIds = findInvalidIncompletePropertyIds([
    { id: 'normal-property', property_status: 'NORMAL', tradable: true },
    { id: 'valid-incomplete', property_status: 'INCOMPLETE', tradable: false },
    { id: 'tradable-incomplete', property_status: 'INCOMPLETE', tradable: true },
    { id: 'missing-tradable-flag', property_status: 'INCOMPLETE' }
  ]);

  assert.deepEqual(invalidIds, ['missing-tradable-flag', 'tradable-incomplete']);
});
