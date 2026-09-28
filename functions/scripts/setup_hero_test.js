const admin = require('firebase-admin');
const sa = require('../sa-key.json');
admin.initializeApp({
  credential: admin.credential.cert(sa),
  projectId: 'aptrank-cc61b'
});
const db = admin.firestore();

async function run() {
  try {
    const season_id = 'test_hero_season';
    const seasonRef = db.collection('PLAY_SEASON').doc(season_id);
    await seasonRef.set({
      season_id: season_id,
      season_name: 'HERO Test Season',
      active_region_scope: {
        province: '경기도', city: '용인시', district: '수지구', region_scope: '경기도 용인시 수지구'
      },
      status: 'ACTIVE',
      clock_status: 'INITIAL',
      scenario_id: 'SCENARIO_1',
      scenario_version: '1.0',
      rule_version: '1.0',
      supply_policy: 'FIXED_ONE',
      current_simulation_period: 0,
      last_successful_period: null,
      last_successful_batch_id: null,
      transaction_status: 'NORMAL',
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now(),
    });

    const playerRef = db.collection('PLAY_PLAYER').doc('HERO');
    const assetRef = db.collection('PLAY_PLAYER_ASSET').doc('HERO');
    
    const now = admin.firestore.Timestamp.now();
    await playerRef.set({
      player_id: 'HERO',
      user_id: 'HERO_USER',
      season_id: season_id,
      status: 'ACTIVE',
      joined_at: now,
      last_active_at: now,
      created_at: now,
      updated_at: now,
    });

    await assetRef.set({
      player_id: 'HERO',
      season_id: season_id,
      cash_total: 700000000,
      cash_available: 700000000,
      cash_locked: 0,
      debt_total: 0,
      property_count: 0,
      financial_asset_total: 0,
      net_worth: 700000000,
      last_processed_period: null,
      last_processed_batch_id: null,
      last_processed_at: null,
      created_at: now,
      updated_at: now,
    });

    try {
      const userRecord = await admin.auth().getUser('HERO_USER');
      console.log('Successfully fetched user data:', userRecord.toJSON());
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        await admin.auth().createUser({
          uid: 'HERO_USER',
          email: 'hero@aptrank.test',
          password: 'password123',
          displayName: 'HERO Tester'
        });
        console.log('Successfully created new HERO_USER in Firebase Auth.');
      } else {
        throw error;
      }
    }

    console.log("HERO participant and test season created.");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

run();
