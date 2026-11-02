'use strict';

const admin = require('firebase-admin');

const LIVE_PROJECT_ID = 'aptrank-cc61b';
const REQUIRED_CONFIRM = 'RESET_PLAY_LIVE';
const BATCH_LIMIT = 400;

const COLLECTIONS_TO_CLEAR = [
  'PLAY_SEASON',
  'PLAY_PLAYER',
  'PLAY_PLAYER_ASSET',
  'PLAY_PROPERTY_OWNERSHIP',
  'PLAY_PRIMARY_SUPPLY',
  'PLAY_SECONDARY_ORDER',
  'PLAY_SECONDARY_LISTING',
  'PLAY_PROPERTY_TRANSACTION',
  'PLAY_LOAN',
  'PLAY_DECISION_LOG',
  'PLAY_IDEMPOTENCY_LOGS',
  'RESEARCH_EVENTS'
];

function parseArgs(argv) {
  return argv.reduce((acc, token) => {
    if (!token.startsWith('--')) return acc;
    const [key, rawValue] = token.slice(2).split('=');
    acc[key] = rawValue === undefined ? true : rawValue;
    return acc;
  }, {});
}

function assertSafety(args) {
  if (args.project !== LIVE_PROJECT_ID) {
    throw new Error(`Refusing to run: pass --project=${LIVE_PROJECT_ID}`);
  }
  if (args.confirm !== REQUIRED_CONFIRM) {
    throw new Error(`Refusing to run: pass --confirm=${REQUIRED_CONFIRM}`);
  }
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required for live reset.');
  }
}

async function deleteQueryBatches(query, label) {
  let totalDeleted = 0;
  while (true) {
    const snapshot = await query.limit(BATCH_LIMIT).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach(document => batch.delete(document.ref));
    await batch.commit();

    totalDeleted += snapshot.size;
    console.log(`[delete] ${label}: ${totalDeleted}`);
  }
  return totalDeleted;
}

function resolveSeasonSupply({ supplyPolicy, householdCount, primarySupplyRatio }) {
  const safeHousehold = Number.isFinite(Number(householdCount)) ? Number(householdCount) : 0;
  const safeRatio = Number.isFinite(Number(primarySupplyRatio)) ? Number(primarySupplyRatio) : 0;
  if (supplyPolicy === 'HOUSEHOLD_RATIO') {
    return Math.max(0, Math.round(safeHousehold * safeRatio));
  }
  return 1;
}

async function clearPlayCollections() {
  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    const deleted = await deleteQueryBatches(db.collection(collectionName), collectionName);
    console.log(`[done] ${collectionName}: deleted ${deleted}`);
  }
}

async function clearDealHistoryCollectionGroup() {
  const query = db.collectionGroup('deal_history');
  const deleted = await deleteQueryBatches(query, 'PLAY_PROPERTY_MASTER/*/deal_history');
  console.log(`[done] deal_history collectionGroup: deleted ${deleted}`);
}

async function createFreshSeason(args) {
  const seasonName = args.season_name || `LIVE_${new Date().toISOString().slice(0, 10)}`;
  const scenarioId = args.scenario_id || 'ACTIVE_TRADING';
  const scenarioVersion = args.scenario_version || 'v1';
  const ruleVersion = args.rule_version || 'v1';
  const supplyPolicy = args.supply_policy || 'FIXED_ONE';
  const primarySupplyRatio = Number.isFinite(Number(args.primary_supply_ratio))
    ? Number(args.primary_supply_ratio)
    : null;

  const now = admin.firestore.Timestamp.now();
  const seasonRef = db.collection('PLAY_SEASON').doc();
  const seasonId = seasonRef.id;
  const season = {
    season_id: seasonId,
    season_name: seasonName,
    status: primarySupplyRatio != null ? 'DRAFT' : 'CONFIG_REQUIRED',
    clock_status: 'INITIAL',
    scenario_id: scenarioId,
    scenario_version: scenarioVersion,
    rule_version: ruleVersion,
    config: primarySupplyRatio != null ? { primary_supply_ratio: primarySupplyRatio } : {},
    supply_policy: supplyPolicy,
    current_simulation_period: 0,
    last_successful_period: null,
    last_successful_batch_id: null,
    transaction_status: 'NORMAL',
    created_at: now,
    updated_at: now
  };

  await seasonRef.set(season);

  if (primarySupplyRatio != null) {
    const propertyMasterSnap = await db.collection('PLAY_PROPERTY_MASTER')
      .where('property_status', '==', 'NORMAL')
      .where('tradable', '==', true)
      .get();

    let count = 0;
    let batch = db.batch();
    for (const document of propertyMasterSnap.docs) {
      const property = document.data();
      if (property.initial_price == null) continue;

      const supplyRef = db.collection('PLAY_PRIMARY_SUPPLY').doc();
      batch.set(supplyRef, {
        supply_id: supplyRef.id,
        season_id: seasonId,
        property_id: property.property_id,
        supply_policy: supplyPolicy,
        household_count_snapshot: property.household_count || 0,
        primary_supply_ratio: primarySupplyRatio,
        initial_price: property.initial_price,
        total_supply: resolveSeasonSupply({
          supplyPolicy,
          householdCount: property.household_count || 0,
          primarySupplyRatio
        }),
        remaining_supply: resolveSeasonSupply({
          supplyPolicy,
          householdCount: property.household_count || 0,
          primarySupplyRatio
        }),
        created_at: now,
        updated_at: now
      });
      count += 1;

      if (count % BATCH_LIMIT === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    if (count % BATCH_LIMIT !== 0) await batch.commit();
    console.log(`[done] PLAY_PRIMARY_SUPPLY seeded: ${count}`);
  }

  console.log(`[done] new season created: ${seasonId} (${seasonName})`);
  return seasonId;
}

const args = parseArgs(process.argv.slice(2));
assertSafety(args);

const app = admin.apps[0] || admin.initializeApp({ projectId: LIVE_PROJECT_ID });
const db = admin.firestore(app);

async function main() {
  console.log('[start] PLAY live reset');
  await clearPlayCollections();
  if (args.purge_deal_history === 'true') {
    await clearDealHistoryCollectionGroup();
  }
  const seasonId = await createFreshSeason(args);
  console.log(`[success] reset completed. season_id=${seasonId}`);
}

main()
  .catch(error => {
    console.error('[failed]', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await app.delete();
  });

