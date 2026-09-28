import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTION_PLAYER, COLLECTION_PLAYER_ASSET, COLLECTION_PROPERTY_OWNERSHIP } from '../common/db';
import { PlayPlayerAsset, PlayPropertyOwnership } from '../common/types';

export const getPlayerState = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { season_id } = request.data;
  const user_id = request.auth.uid;

  if (!season_id) {
    throw new HttpsError('invalid-argument', 'Missing season_id');
  }

  const playersSnap = await db.collection(COLLECTION_PLAYER)
    .where('season_id', '==', season_id)
    .where('user_id', '==', user_id)
    .get();

  if (playersSnap.empty) {
    throw new HttpsError('not-found', 'Player not found in this season');
  }
  
  const player_id = playersSnap.docs[0].data().player_id;

  const assetDoc = await db.collection(COLLECTION_PLAYER_ASSET).doc(player_id).get();
  if (!assetDoc.exists) {
    throw new HttpsError('not-found', 'Player asset not found');
  }
  const asset = assetDoc.data() as PlayPlayerAsset;

  const ownershipsSnap = await db.collection(COLLECTION_PROPERTY_OWNERSHIP)
    .where('player_id', '==', player_id)
    .where('season_id', '==', season_id)
    .get();

  const ownerships = ownershipsSnap.docs.map(doc => doc.data() as PlayPropertyOwnership);

  return {
    player_id,
    asset,
    ownerships
  };
});
