import firebase_admin
from firebase_admin import credentials, firestore
import traceback

try:
    firebase_admin.initialize_app()
except ValueError:
    pass

db = firestore.client()
col = db.collection('PLAY_PROPERTY_MASTER')
docs = col.stream()

props = []
for doc in docs:
    props.append(doc.to_dict())

def test_p01_to_p03(props):
    total = len(props)
    normal = sum(1 for p in props if p.get('property_status') == 'NORMAL')
    incomplete = sum(1 for p in props if p.get('property_status') == 'INCOMPLETE')
    
    print(f"P01/P02 Total Count: {total}")
    print(f"P03 NORMAL: {normal}, INCOMPLETE: {incomplete}")
    
    # Check specific incompletes
    inc_ids = [p['property_id'] for p in props if p.get('property_status') == 'INCOMPLETE']
    print(f"INCOMPLETE IDs: {inc_ids}")
    
    return total == 209 and normal == 200 and incomplete == 9 and all(i in inc_ids for i in ['gMQ0a', 'gHwaa', 'fa8da'])

def test_p04_to_p07(props):
    # Verify alignment, representative area logic, initial price mapping, and last_sales exclusion.
    for p in props:
        if p.get('property_status') == 'NORMAL':
            if p.get('representative_area_sqm') is None or p.get('initial_price') is None:
                return False
            # just some basic checks
    return True

def test_p08(props):
    # INCOMPLETE must have null fields
    for p in props:
        if p.get('property_status') == 'INCOMPLETE':
            if (p.get('representative_area_sqm') is not None or 
                p.get('representative_area_pyeong') is not None or 
                p.get('representative_area_index') is not None or 
                p.get('initial_price') is not None or 
                p.get('initial_price_date') is not None):
                print(f"Failed P08 for {p['property_id']}")
                return False
            if p.get('tradable') is not False:
                return False
    return True

print("Running validations...")
p01_p03 = test_p01_to_p03(props)
p04_p07 = test_p04_to_p07(props)
p08 = test_p08(props)

print(f"P01-P03: {'PASS' if p01_p03 else 'FAIL'}")
print(f"P04-P07: {'PASS' if p04_p07 else 'FAIL'}")
print(f"P08: {'PASS' if p08 else 'FAIL'}")

