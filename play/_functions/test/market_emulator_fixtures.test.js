'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  assertEmulatorTarget,
  buildFixture,
  readMapProperties,
  FIXTURE_TAG,
  TEST_SEASON_ID
} = require('../scripts/seed_market_emulator');

test('market fixture requires an explicit local demo project', () => {
  assert.throws(() => assertEmulatorTarget([], {}), /--target=demo-play/);
  assert.throws(() => assertEmulatorTarget(['--target=demo-play'], {
    FIRESTORE_EMULATOR_HOST: 'firestore.googleapis.com:443'
  }), /not the local emulator/);
  assert.throws(() => assertEmulatorTarget(['--target=demo-play'], {
    FIREBASE_AUTH_EMULATOR_HOST: 'identitytoolkit.googleapis.com'
  }), /not the local emulator/);
  assert.doesNotThrow(() => assertEmulatorTarget(['--target=demo-play'], {}));
});

test('market fixture provides HERO, AI ownership, and primary-supply scenarios', () => {
  const fixture = buildFixture(readMapProperties(), new Date('2026-10-04T00:00:00.000Z'));
  assert.equal(fixture.season.season_id, TEST_SEASON_ID);
  assert.equal(fixture.season.clock_status, 'PAUSED');
  assert.equal(fixture.players.length, 2);
  assert.ok(fixture.players.every(player => player.data.fixture_tag === FIXTURE_TAG));
  assert.deepEqual(fixture.ownerships.map(item => item.data.player_id).sort(), ['AI_TEST_OWNER', 'HERO']);
  assert.equal(fixture.orders[0].data.player_id, 'AI_TEST_OWNER');
  assert.equal(fixture.orders[0].data.side, 'SELL');
  assert.equal(fixture.primarySupply.data.remaining_supply, 1);
  assert.ok(fixture.masterDocuments.every(item => item.id.startsWith('TEST_ONLY_')));
  assert.ok(fixture.masterDocuments.every(item => item.data.fixture_tag === FIXTURE_TAG));
});
