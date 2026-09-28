const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
try {
  const serviceAccount = require(path.join(__dirname, 'sa-key.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'aptrank-cc61b' // production project
  });
} catch (e) {
  console.log("No sa-key.json found, trying default application credentials");
  admin.initializeApp({ projectId: 'aptrank-cc61b' });
}

const db = admin.firestore();

async function run() {
  const seasonId = 'test_hero_season';
  const now = admin.firestore.Timestamp.now();

  try {
    for (let i = 1; i <= 10; i++) {
      const aiId = `AI-${i.toString().padStart(2, '0')}`;
      console.log(`Provisioning ${aiId}...`);

      // Create Player
      const playerRef = db.collection('PLAY_PLAYER').doc(aiId);
      await playerRef.set({
        player_id: aiId,
        user_id: aiId,
        season_id: seasonId,
        display_name: aiId,
        status: 'ACTIVE',
        joined_at: now,
        updated_at: now,
        type: 'AI'
      });

      // Create Player Asset
      const assetRef = db.collection('PLAY_PLAYER_ASSET').doc(aiId);
      await assetRef.set({
        player_id: aiId,
        season_id: seasonId,
        cash_total: 700000000,
        cash_available: 700000000,
        property_count: 0,
        financial_asset_total: 0,
        debt_total: 0,
        net_worth: 700000000,
        last_processed_period: 0,
        processed_batches: [],
        created_at: now,
        updated_at: now,
      });

      // Create Player Season context
      const seasonContextRef = db.collection('PLAY_PLAYER_SEASON').doc(`${seasonId}_${aiId}`);
      await seasonContextRef.set({
        player_id: aiId,
        season_id: seasonId,
        status: 'ACTIVE',
        last_action_period: 0,
        created_at: now,
        updated_at: now,
      });
    }

    console.log("Successfully provisioned 10 AI participants for test_hero_season.");
    process.exit(0);
  } catch(e) {
    console.error("Error provisioning AIs:", e);
    process.exit(1);
  }
}

run();
