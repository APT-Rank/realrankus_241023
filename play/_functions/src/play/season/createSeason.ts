import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTION_SEASON } from '../common/db';
import { PlaySeason, PlayPrimarySupply } from '../common/types';
import { resolveSeasonSupply } from '../common/supplyResolver';
import * as admin from 'firebase-admin';
import { COLLECTION_PROPERTY_MASTER, COLLECTION_PRIMARY_SUPPLY } from '../common/db';

export const createSeason = onCall(async (request) => {
  // 1. Auth Check (Server Authority)
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }
  
  // NOTE: In production, verify if user has admin claims to create season
  
  const { season_name, scenario_id, scenario_version, rule_version } = request.data;
  
  if (!season_name || !scenario_id || !scenario_version || !rule_version) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  const seasonRef = db.collection(COLLECTION_SEASON).doc();
  const season_id = seasonRef.id;

  const config = request.data.config;
  const primary_supply_ratio = config?.primary_supply_ratio;
  const supply_policy = request.data.supply_policy || 'FIXED_ONE';

  const newSeason: PlaySeason = {
    season_id,
    season_name,
    status: primary_supply_ratio != null ? 'DRAFT' : 'CONFIG_REQUIRED',
    clock_status: 'INITIAL',
    scenario_id,
    scenario_version,
    rule_version,
    config,
    supply_policy,
    current_simulation_period: 0,
    last_successful_period: null,
    last_successful_batch_id: null,
    transaction_status: 'NORMAL',
    created_at: admin.firestore.Timestamp.now(),
    updated_at: admin.firestore.Timestamp.now(),
  };

  await seasonRef.set(newSeason);

  if (primary_supply_ratio != null) {
    // Phase 2: Primary Market Initialization
    const propertyMasterSnap = await db.collection(COLLECTION_PROPERTY_MASTER)
      .where('property_status', '==', 'NORMAL')
      .where('tradable', '==', true)
      .get();
      
    const batch = db.batch();
    let count = 0;
    
    for (const doc of propertyMasterSnap.docs) {
      const prop = doc.data();
      if (prop.initial_price == null) continue; // Defense code
      
      const household = prop.household_count || 0;
      const supply = resolveSeasonSupply({ supplyPolicy: supply_policy, householdCount: household, primarySupplyRatio: primary_supply_ratio || 0 });
      
      const supplyRef = db.collection(COLLECTION_PRIMARY_SUPPLY).doc();
      const newSupply: PlayPrimarySupply = {
        supply_id: supplyRef.id,
        season_id,
        property_id: prop.property_id,
        supply_policy: supply_policy,
        household_count_snapshot: household,
        primary_supply_ratio: primary_supply_ratio,
        initial_price: prop.initial_price,
        total_supply: supply,
        remaining_supply: supply,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now(),
      };
      
      batch.set(supplyRef, newSupply);
      count++;
      
      if (count % 500 === 0) {
        await batch.commit();
      }
    }
    
    if (count % 500 !== 0) {
      await batch.commit();
    }
  }

  return { season_id, status: newSeason.status };
});
