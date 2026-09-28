import firebase_admin
from firebase_admin import credentials, firestore
import uuid
import datetime

try:
    firebase_admin.initialize_app()
except ValueError:
    pass

db = firestore.client()

def test_purchase():
    season_id = f"TEST_SEASON_{uuid.uuid4().hex[:8]}"
    player_id = f"TEST_PLAYER_{uuid.uuid4().hex[:8]}"
    supply_id = f"TEST_SUPPLY_{uuid.uuid4().hex[:8]}"
    prop_id = "test_prop_01"
    
    season_ref = db.collection('PLAY_SEASON').document(season_id)
    season_ref.set({
        'season_id': season_id,
        'status': 'ACTIVE',
        'transaction_status': 'NORMAL',
        'current_simulation_period': 1
    })
    
    player_ref = db.collection('PLAY_PLAYER').document(player_id)
    player_ref.set({
        'player_id': player_id,
        'user_id': 'test_uid',
        'season_id': season_id
    })
    
    asset_ref = db.collection('PLAY_PLAYER_ASSET').document(player_id)
    asset_ref.set({
        'player_id': player_id,
        'cash_total': 1000000000,
        'cash_available': 1000000000,
        'property_count': 0,
        'net_worth': 1000000000
    })
    
    supply_ref = db.collection('PLAY_PRIMARY_SUPPLY').document(supply_id)
    supply_ref.set({
        'supply_id': supply_id,
        'property_id': prop_id,
        'initial_price': 500000000,
        'total_supply': 1,
        'remaining_supply': 1
    })

    # To test actual function, since we don't have emulator running functions locally via python,
    # we can run the logic in python or call the function using request.
    print(f"Setup complete. season_id={season_id}, player_id={player_id}, supply_id={supply_id}")

if __name__ == '__main__':
    test_purchase()
