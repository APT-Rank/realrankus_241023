const admin = require('firebase-admin');
const { execSync } = require('child_process');
const fetch = require('node-fetch');

const serviceAccount = require('./sa-key.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'aptrank-cc61b' });

async function getApiKey() {
  const output = execSync('npx firebase-tools apps:sdkconfig WEB --json').toString();
  const config = JSON.parse(output.substring(output.indexOf('{'), output.lastIndexOf('}') + 1));
  return config.result.sdkConfig.apiKey;
}

async function getAuthToken(uid) {
  const customToken = await admin.auth().createCustomToken(uid);
  const apiKey = await getApiKey();
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  const data = await res.json();
  return data.idToken;
}

async function main() {
  const token = await getAuthToken('f_user_1');
  
  const seasonId = `S_FINAL_${Date.now()}`;
  await admin.firestore().collection('PLAY_PLAYER').doc('f_player_1').set({ player_id: 'f_player_1', season_id: seasonId, user_id: 'f_user_1', is_ai: false });
  await admin.firestore().collection('PLAY_PLAYER_ASSET').doc('f_player_1').set({ player_id: 'f_player_1', season_id: seasonId, cash_total: 10000000, cash_locked: 0, cash_available: 10000000, property_count: 1, net_worth: 10000000 });
  await admin.firestore().collection('PLAY_PROPERTY_MASTER').doc('PROP_FINAL_1').set({ property_id: 'PROP_FINAL_1', season_id: seasonId, initial_price: 500000 });
  await admin.firestore().collection('PLAY_PROPERTY_OWNERSHIP').doc('OWN_DEBUG').set({
    ownership_id: 'OWN_DEBUG', season_id: seasonId, property_id: 'PROP_FINAL_1', player_id: 'f_player_1', status: 'ACTIVE', locked_for_sale: false, acquired_at: admin.firestore.Timestamp.now()
  });
  
  const res = await fetch(`https://asia-northeast3-aptrank-cc61b.cloudfunctions.net/createSecondaryOrder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ data: { season_id: seasonId, property_id: 'PROP_FINAL_1', side: 'SELL', price: 1000000, idempotency_key: 'DEBUG_SELL_1' } })
  });
  console.log('Status:', res.status);
  const json = await res.json();
  console.log('Result:', JSON.stringify(json, null, 2));
}

main().catch(console.error);
