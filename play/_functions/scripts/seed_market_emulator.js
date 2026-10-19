'use strict';

const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');

const TARGET_PROJECT = 'demo-play';
const TEST_SEASON_ID = 'test_hero_season';
const FIXTURE_TAG = 'TEST_ONLY_EXCHANGE';
const TEST_COMPLEX_IDS = ['10002', '100473', '10065'];
const COLLECTIONS_TO_RESET = [
  'PLAY_PLAYER', 'PLAY_PLAYER_ASSET', 'PLAY_PROPERTY_OWNERSHIP',
  'PLAY_PRIMARY_SUPPLY', 'PLAY_SECONDARY_ORDER', 'PLAY_SECONDARY_LISTING',
  'PLAY_PROPERTY_TRANSACTION', 'PLAY_LOAN', 'PLAY_DECISION_LOG',
  'PLAY_IDEMPOTENCY_LOGS', 'RESEARCH_EVENTS'
];

function assertEmulatorTarget(args, env) {
  if (!args.includes('--target=demo-play')) {
    throw new Error('Refusing to seed: pass --target=demo-play explicitly.');
  }
  if (env.FIRESTORE_EMULATOR_HOST && env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') {
    throw new Error('Refusing to seed: Firestore emulator host is not the local emulator.');
  }
  if (env.FIREBASE_AUTH_EMULATOR_HOST && env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099') {
    throw new Error('Refusing to seed: Auth emulator host is not the local emulator.');
  }
}

function readMapProperties() {
  const sourcePath = path.resolve(__dirname, '../../data/suji_properties.json');
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const byComplexId = new Map(source.map(property => [String(property.complex_id), property]));
  return TEST_COMPLEX_IDS.map(complexId => {
    const property = byComplexId.get(complexId);
    if (!property) throw new Error(`Test marker ${complexId} is missing from the local map data.`);
    return property;
  });
}

function buildFixture(mapProperties, now = new Date()) {
  const timestamp = new Date(now);
  const [heroMarker, aiMarker, primaryMarker] = mapProperties;
  const properties = [
    { property_id: 'TEST_ONLY_HERO_HOME', complex_id: '10002', marker: heroMarker, owner: 'HERO', price: 600000000 },
    { property_id: 'TEST_ONLY_AI_HOME', complex_id: '100473', marker: aiMarker, owner: 'AI_TEST_OWNER', price: 650000000 },
    { property_id: 'TEST_ONLY_PRIMARY_HOME', complex_id: '10065', marker: primaryMarker, owner: null, price: 500000000 }
  ];
  const masterDocuments = properties.map(property => ({
    id: property.property_id,
    data: {
      fixture_tag: FIXTURE_TAG,
      property_id: property.property_id,
      complex_id: property.complex_id,
      complex_name: `[TEST ONLY] ${property.marker.complex_name}`,
      property_status: 'NORMAL',
      tradable: true,
      household_count: Number(property.marker.household_count) || 100,
      representative_area_sqm: Number(property.marker.representative_area_sqm) || 84.95,
      representative_area_pyeong: Number(property.marker.representative_area_pyeong) || 25.7,
      representative_area_index: Number(property.marker.representative_area_index) || 0,
      initial_price: property.price,
      initial_price_date: '2026-10-04',
      legal_dong_address: property.marker.legal_dong_address,
      road_name_address: property.marker.road_name_address,
      x: Number(property.marker.x),
      y: Number(property.marker.y),
      region: property.marker.region || '수지구',
      source_file: FIXTURE_TAG,
      snapshot_version: 'TEST_ONLY',
      area_info_raw: 'TEST ONLY emulator property',
      sales_info_raw: `${(property.price / 100000000).toFixed(2)}억 · TEST ONLY`,
      created_at: timestamp,
      updated_at: timestamp
    }
  }));
  const players = [
    { id: 'HERO', user_id: 'HERO_USER', player_id: 'HERO' },
    { id: 'AI_TEST_OWNER', user_id: 'AI_TEST_OWNER_USER', player_id: 'AI_TEST_OWNER' }
  ].map(player => ({
    id: player.id,
    data: {
      fixture_tag: FIXTURE_TAG,
      ...player,
      season_id: TEST_SEASON_ID,
      status: 'ACTIVE',
      joined_at: timestamp,
      last_active_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp
    }
  }));
  const assets = [
    { id: 'HERO', cash: 1000000000, propertyValue: 600000000, annualIncome: 51500000 },
    { id: 'AI_TEST_OWNER', cash: 2000000000, propertyValue: 650000000, annualIncome: 60000000 }
  ].map(player => ({
    id: player.id,
    data: {
      fixture_tag: FIXTURE_TAG,
      player_id: player.id,
      season_id: TEST_SEASON_ID,
      cash_total: player.cash,
      cash_available: player.cash,
      cash_locked: 0,
      debt_total: 0,
      property_count: 1,
      financial_asset_total: 0,
      net_worth: player.cash + player.propertyValue,
      annual_income: player.annualIncome,
      monthly_income: Math.round(player.annualIncome / 12),
      monthly_living_expense: 3200000,
      monthly_loan_payment: 0,
      participation_start_period: 0,
      cumulative_inflation_factor: 1,
      last_processed_period: 0,
      last_processed_batch_id: null,
      processed_batches: [],
      last_processed_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp
    }
  }));
  const season = {
    fixture_tag: FIXTURE_TAG,
    season_id: TEST_SEASON_ID,
    season_name: 'TEST ONLY · 거래소 테스트 시즌',
    status: 'ACTIVE',
    clock_status: 'PAUSED',
    transaction_status: 'NORMAL',
    scenario_id: FIXTURE_TAG,
    scenario_version: 'TEST_ONLY',
    rule_version: 'TEST_ONLY',
    supply_policy: 'FIXED_ONE',
    current_simulation_period: 0,
    total_simulation_periods: 360,
    last_successful_period: 0,
    last_successful_batch_id: null,
    base_interest: 3.5,
    inflation: 3.5,
    income_rate: 3,
    DSR: 50,
    LTV: 70,
    config: { primary_supply_ratio: 0.7 },
    created_at: timestamp,
    updated_at: timestamp
  };
  const ownerships = properties.filter(property => property.owner).map(property => ({
    id: `TEST_ONLY_OWNERSHIP_${property.owner}`,
    data: {
      fixture_tag: FIXTURE_TAG,
      ownership_id: `TEST_ONLY_OWNERSHIP_${property.owner}`,
      season_id: TEST_SEASON_ID,
      property_id: property.property_id,
      player_id: property.owner,
      acquisition_type: 'PRIMARY',
      acquisition_price: property.price,
      acquired_at: timestamp,
      acquisition_transaction_id: `TEST_ONLY_BOOTSTRAP_${property.owner}`,
      status: 'ACTIVE',
      locked_for_sale: property.owner === 'AI_TEST_OWNER',
      created_at: timestamp,
      updated_at: timestamp
    }
  }));
  const primarySupply = {
    id: 'TEST_ONLY_PRIMARY_SUPPLY',
    data: {
      fixture_tag: FIXTURE_TAG,
      supply_id: 'TEST_ONLY_PRIMARY_SUPPLY',
      season_id: TEST_SEASON_ID,
      property_id: 'TEST_ONLY_PRIMARY_HOME',
      supply_policy: 'FIXED_ONE',
      initial_price: 500000000,
      total_supply: 1,
      remaining_supply: 1,
      created_at: timestamp,
      updated_at: timestamp
    }
  };
  const orders = [{
    id: 'TEST_ONLY_AI_SELL_ORDER',
    data: {
      fixture_tag: FIXTURE_TAG,
      order_id: 'TEST_ONLY_AI_SELL_ORDER',
      season_id: TEST_SEASON_ID,
      property_id: 'TEST_ONLY_AI_HOME',
      player_id: 'AI_TEST_OWNER',
      side: 'SELL',
      price: 680000000,
      quantity: 1,
      status: 'OPEN',
      matched_transaction_id: null,
      created_at: timestamp,
      updated_at: timestamp
    }
  }];
  return {
    season,
    players,
    assets,
    ownerships,
    masterDocuments,
    primarySupply,
    orders,
    authUsers: [
      { uid: 'HERO_USER', email: 'hero@aptrank.test', password: 'password123', displayName: 'HERO TEST ONLY' },
      { uid: 'AI_TEST_OWNER_USER', email: 'ai-owner@aptrank.test', password: 'password123', displayName: 'AI OWNER TEST ONLY' }
    ]
  };
}

async function ensureAuthUser(auth, user) {
  try {
    await auth.getUser(user.uid);
    await auth.updateUser(user.uid, { email: user.email, password: user.password, displayName: user.displayName, emailVerified: true });
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    await auth.createUser({ ...user, emailVerified: true });
  }
}

async function clearTestSeason(db) {
  for (const collectionName of COLLECTIONS_TO_RESET) {
    const snapshot = await db.collection(collectionName).where('season_id', '==', TEST_SEASON_ID).get();
    for (let offset = 0; offset < snapshot.docs.length; offset += 400) {
      const batch = db.batch();
      snapshot.docs.slice(offset, offset + 400).forEach(document => batch.delete(document.ref));
      await batch.commit();
    }
  }
  for (const propertyId of ['TEST_ONLY_HERO_HOME', 'TEST_ONLY_AI_HOME', 'TEST_ONLY_PRIMARY_HOME', ...TEST_COMPLEX_IDS]) {
    const reference = db.collection('PLAY_PROPERTY_MASTER').doc(propertyId);
    const document = await reference.get();
    if (document.exists && document.data().fixture_tag === FIXTURE_TAG) await reference.delete();
  }
  for (const complexId of TEST_COMPLEX_IDS) {
    const history = await db.collection('PLAY_PROPERTY_MASTER').doc(complexId).collection('deal_history').get();
    for (const document of history.docs) {
      if (document.data().fixture_tag === FIXTURE_TAG || document.data().season_id === TEST_SEASON_ID) await document.ref.delete();
    }
  }
}

async function main(args = process.argv.slice(2), env = process.env) {
  assertEmulatorTarget(args, env);
  env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  const app = admin.apps[0] || admin.initializeApp({ projectId: TARGET_PROJECT });
  const db = admin.firestore(app);
  const auth = admin.auth(app);
  const fixtures = buildFixture(readMapProperties());
  await clearTestSeason(db);
  for (const user of fixtures.authUsers) await ensureAuthUser(auth, user);
  const batch = db.batch();
  batch.set(db.collection('PLAY_SEASON').doc(TEST_SEASON_ID), fixtures.season);
  const addDocuments = (collectionName, documents) => documents.forEach(document => {
    batch.set(db.collection(collectionName).doc(document.id), document.data);
  });
  addDocuments('PLAY_PLAYER', fixtures.players);
  addDocuments('PLAY_PLAYER_ASSET', fixtures.assets);
  addDocuments('PLAY_PROPERTY_MASTER', fixtures.masterDocuments);
  addDocuments('PLAY_PROPERTY_OWNERSHIP', fixtures.ownerships);
  addDocuments('PLAY_PRIMARY_SUPPLY', [fixtures.primarySupply]);
  addDocuments('PLAY_SECONDARY_ORDER', fixtures.orders);
  await batch.commit();
  console.log(`Seeded ${FIXTURE_TAG} into the local ${TARGET_PROJECT} emulator only.`);
  console.log('HERO: hero@aptrank.test / password123');
  console.log('AI owner: ai-owner@aptrank.test / password123');
  console.log('HERO home: map complex 10002; AI owner home: 100473; primary supply: 10065.');
  await app.delete();
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { assertEmulatorTarget, buildFixture, readMapProperties, TEST_SEASON_ID, FIXTURE_TAG };
