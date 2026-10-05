import { FieldPath } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  db,
  COLLECTION_SEASON,
  COLLECTION_PLAYER,
  COLLECTION_PRIMARY_SUPPLY,
  COLLECTION_SECONDARY_ORDER,
  COLLECTION_SECONDARY_LISTING,
  COLLECTION_PROPERTY_MASTER
} from '../common/db';
import { PlayPrimarySupply, PlayPropertyMaster, PlaySecondaryListing, PlaySecondaryOrder } from '../common/types';

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 50;
const MARKET_SOURCES = ['primary_supply', 'secondary_orders', 'secondary_listings'] as const;
type MarketSource = typeof MARKET_SOURCES[number];

async function fetchMarketPage(collectionName: string, seasonId: string, pageSize: number, cursor?: string) {
  let query = db.collection(collectionName)
    .where('season_id', '==', seasonId)
    .orderBy(FieldPath.documentId());
  if (cursor) query = query.startAfter(cursor);
  const snapshot = await query.limit(pageSize + 1).get();
  const documents = snapshot.docs.slice(0, pageSize);
  return {
    documents,
    nextCursor: snapshot.docs.length > pageSize ? documents[documents.length - 1]?.id ?? null : null
  };
}

export const getMarketBoard = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in');

  const season_id = request.data?.season_id;
  if (typeof season_id !== 'string' || !season_id.trim()) {
    throw new HttpsError('invalid-argument', 'Missing season_id');
  }

  const playerSnapshot = await db.collection(COLLECTION_PLAYER)
    .where('season_id', '==', season_id)
    .where('user_id', '==', request.auth.uid)
    .limit(1)
    .get();
  if (playerSnapshot.empty) throw new HttpsError('not-found', 'Player not found in this season');

  const seasonDocument = await db.collection(COLLECTION_SEASON).doc(season_id).get();
  if (!seasonDocument.exists) throw new HttpsError('not-found', 'Season not found');
  const season = seasonDocument.data();
  if (season?.status !== 'ACTIVE') throw new HttpsError('failed-precondition', 'Season is not ACTIVE');

  const requestedPageSize = Number(request.data?.page_size);
  const pageSize = Number.isInteger(requestedPageSize)
    ? Math.max(1, Math.min(requestedPageSize, MAX_PAGE_SIZE))
    : DEFAULT_PAGE_SIZE;
  const requestedSources = new Set<MarketSource>(Array.isArray(request.data?.sources)
    ? request.data.sources.filter((source: unknown): source is MarketSource => MARKET_SOURCES.includes(source as MarketSource))
    : MARKET_SOURCES);
  const cursors: Record<string, unknown> = request.data?.cursors && typeof request.data.cursors === 'object' ? request.data.cursors : {};
  for (const source of requestedSources) {
    const cursor = cursors[source];
    if (cursor !== undefined && cursor !== null && (typeof cursor !== 'string' || cursor.length > 1500)) {
      throw new HttpsError('invalid-argument', 'Invalid market page cursor');
    }
  }
  const getCursor = (source: MarketSource): string | undefined => {
    const cursor = cursors[source];
    return typeof cursor === 'string' && cursor ? cursor : undefined;
  }

  const [supplyPage, orderPage, listingPage] = await Promise.all([
    requestedSources.has('primary_supply')
      ? fetchMarketPage(COLLECTION_PRIMARY_SUPPLY, season_id, pageSize, getCursor('primary_supply'))
      : Promise.resolve(null),
    requestedSources.has('secondary_orders')
      ? fetchMarketPage(COLLECTION_SECONDARY_ORDER, season_id, pageSize, getCursor('secondary_orders'))
      : Promise.resolve(null),
    requestedSources.has('secondary_listings')
      ? fetchMarketPage(COLLECTION_SECONDARY_LISTING, season_id, pageSize, getCursor('secondary_listings'))
      : Promise.resolve(null)
  ]);

  const primarySupply = (supplyPage?.documents ?? [])
    .map(document => ({ ...document.data() as PlayPrimarySupply, supply_id: document.id }))
    .filter(supply => supply.remaining_supply > 0 && supply.initial_price > 0);
  const secondaryOrders = (orderPage?.documents ?? [])
    .map(document => ({ ...document.data() as PlaySecondaryOrder, order_id: document.id }))
    .filter(order => order.status === 'OPEN' && order.price > 0);
  const secondaryListings = (listingPage?.documents ?? [])
    .map(document => ({ ...document.data() as PlaySecondaryListing, listing_id: document.id }))
    .filter(listing => listing.status === 'ACTIVE'
      && listing.price > 0
      && (typeof listing.expires_simulation_period !== 'number'
        || Number(season.current_simulation_period) < listing.expires_simulation_period));

  const propertyIds = [...new Set([
    ...primarySupply.map(supply => String(supply.property_id)),
    ...secondaryOrders.map(order => String(order.property_id)),
    ...secondaryListings.map(listing => String(listing.property_id))
  ])];
  const masterEntries = await Promise.all(propertyIds.map(async propertyId => {
    const masterDocument = await db.collection(COLLECTION_PROPERTY_MASTER).doc(propertyId).get();
    return [propertyId, masterDocument.exists ? masterDocument.data() as PlayPropertyMaster : null] as const;
  }));
  const masters = new Map(masterEntries);
  const next_cursors: Partial<Record<MarketSource, string | null>> = {};
  if (supplyPage) next_cursors.primary_supply = supplyPage.nextCursor;
  if (orderPage) next_cursors.secondary_orders = orderPage.nextCursor;
  if (listingPage) next_cursors.secondary_listings = listingPage.nextCursor;
  const withMaster = (propertyId: string | number) => masters.get(String(propertyId));

  return {
    player_id: playerSnapshot.docs[0].data().player_id,
    simulation_period: Number(season.current_simulation_period) || 0,
    next_cursors,
    primary_listings: primarySupply
      .filter(supply => {
        const master = withMaster(supply.property_id);
        return master?.tradable === true && master.property_status !== 'INCOMPLETE';
      })
      .map(supply => {
        const master = withMaster(supply.property_id)!;
        return {
          listing_type: 'PRIMARY',
          supply_id: supply.supply_id,
          property_id: supply.property_id,
          price: supply.initial_price,
          remaining_supply: supply.remaining_supply,
          complex_id: master.complex_id,
          complex_name: master.complex_name,
          address: master.legal_dong_address,
          representative_area_sqm: master.representative_area_sqm,
          initial_price: supply.initial_price,
          property_status: master.property_status,
          tradable: master.tradable
        };
      }),
    secondary_orders: secondaryOrders
      .filter(order => withMaster(order.property_id)?.tradable === true)
      .map(order => {
        const master = withMaster(order.property_id)!;
        return {
          order_id: order.order_id,
          listing_type: 'SECONDARY_ORDER',
          property_id: order.property_id,
          player_id: order.player_id,
          side: order.side,
          price: order.price,
          created_at: order.created_at,
          complex_id: master.complex_id,
          complex_name: master.complex_name,
          address: master.legal_dong_address,
          representative_area_sqm: master.representative_area_sqm
        };
      }),
    secondary_listings: secondaryListings
      .filter(listing => withMaster(listing.property_id)?.tradable === true)
      .map(listing => {
        const master = withMaster(listing.property_id)!;
        return {
          listing_id: listing.listing_id,
          listing_type: 'SECONDARY_LISTING',
          property_id: listing.property_id,
          player_id: listing.seller_player_id,
          side: 'SELL',
          price: listing.price,
          created_at: listing.created_at,
          complex_id: master.complex_id,
          complex_name: master.complex_name,
          address: master.legal_dong_address,
          representative_area_sqm: master.representative_area_sqm
        };
      })
  };
});
