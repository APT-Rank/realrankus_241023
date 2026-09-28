import firebase_admin
from firebase_admin import credentials, firestore
import uuid

try:
    firebase_admin.initialize_app()
except ValueError:
    pass

db = firestore.client()

def test_primary_supply():
    season_id = f"TEST_SEASON_{uuid.uuid4().hex[:8]}"
    print(f"Creating season {season_id} with config...")
    
    config = {'primary_supply_ratio': 0.05} # 5% supply
    
    # Simulate createSeason
    season_ref = db.collection('PLAY_SEASON').document(season_id)
    season_ref.set({
        'season_id': season_id,
        'status': 'DRAFT',
        'config': config
    })
    
    # Generate supply
    props = db.collection('PLAY_PROPERTY_MASTER').where('property_status', '==', 'NORMAL').where('tradable', '==', True).stream()
    
    batch = db.batch()
    count = 0
    for doc in props:
        prop = doc.to_dict()
        if prop.get('initial_price') is None:
            print(f"ERROR: {prop['property_id']} is NORMAL but has no initial price")
            continue
            
        household = prop.get('household_count', 0)
        supply = int(household * 0.05)
        if supply < 1: supply = 1
        
        supply_ref = db.collection('PLAY_PRIMARY_SUPPLY').document()
        batch.set(supply_ref, {
            'supply_id': supply_ref.id,
            'season_id': season_id,
            'property_id': prop['property_id'],
            'initial_price': prop['initial_price'],
            'total_supply': supply,
            'remaining_supply': supply
        })
        count += 1
        
        if count % 500 == 0:
            batch.commit()
            batch = db.batch()
            
    if count % 500 != 0:
        batch.commit()
        
    print(f"Generated Primary Supply for {count} properties.")
    
    # Verify count
    supplies = list(db.collection('PLAY_PRIMARY_SUPPLY').where('season_id', '==', season_id).stream())
    print(f"Total supplies created: {len(supplies)}")
    
    if len(supplies) == 200:
        print("PASS: Exactly 200 NORMAL properties got supply.")
    else:
        print(f"FAIL: Expected 200, got {len(supplies)}")
        
if __name__ == '__main__':
    test_primary_supply()
