import pandas as pd
import numpy as np
import os
import re
import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin
try:
    firebase_admin.initialize_app()
except ValueError:
    pass

db = firestore.client()

path = r'D:\real_estate_data\91_Complex_Valuation'
files = [f for f in os.listdir(path) if '수지구' in f and 'add_info' not in f and f.endswith('.csv')]
filename = files[0]
filepath = os.path.join(path, filename)

df = pd.read_csv(filepath, encoding='cp949')
df['complex_id'] = df['검색코드'].astype(str)

valid_complex = df.dropna(subset=['X', 'Y']).copy()

def parse_area_info(s):
    if pd.isna(s): return []
    parts = str(s).split(',')
    res = []
    for p in parts:
        m = re.match(r'([\d\.]+)평\(([\d\.]+)\)', p.strip())
        if m:
            res.append({'pyeong': float(m.group(1)), 'sqm': float(m.group(2)), 'raw': p.strip()})
        else:
            res.append({'raw': p.strip()})
    return res

def parse_price(s):
    s = s.replace(' ', '')
    val = 0
    m_uk = re.search(r'([\d\.]+)억', s)
    if m_uk:
        val += float(m_uk.group(1)) * 100000000
    m_man = re.search(r'([\d\.]+)만', s)
    if m_man:
        val += float(m_man.group(1)) * 10000
    if not m_uk and not m_man:
        try:
            val = float(s)
            if val < 10000:
                val = val * 10000
        except:
            pass
    return int(val)

def parse_sales_info(s):
    if pd.isna(s): return []
    parts = str(s).split(',')
    res = []
    for p in parts:
        m = re.match(r'([^\(]+)\s*\(([\d\-]+)\)', p.strip())
        if m:
            res.append({'price': parse_price(m.group(1)), 'date': m.group(2), 'raw': p.strip()})
        else:
            res.append({'raw': p.strip()})
    return res

valid_complex['parsed_area'] = valid_complex['area_info'].apply(parse_area_info)
valid_complex['parsed_sales'] = valid_complex['sales_info'].apply(parse_sales_info)

def get_rep_area(parsed_areas):
    if not parsed_areas: return None
    best_idx = -1
    best_diff = 999999
    best_sqm = None
    best_pyeong = None
    for i, a in enumerate(parsed_areas):
        if 'sqm' in a:
            diff = abs(a['sqm'] - 84.0)
            if diff < best_diff:
                best_diff = diff
                best_idx = i
                best_sqm = a['sqm']
                best_pyeong = a['pyeong']
    if best_idx != -1:
        return {'index': best_idx, 'sqm': best_sqm, 'pyeong': best_pyeong}
    return None

valid_complex['rep_area'] = valid_complex['parsed_area'].apply(get_rep_area)

batch = db.batch()
count = 0
now = firestore.SERVER_TIMESTAMP

col = db.collection('PLAY_PROPERTY_MASTER')

for _, row in valid_complex.iterrows():
    prop_id = row['complex_id']
    rep = row['rep_area']
    
    status = 'NORMAL'
    tradable = True
    rep_sqm = None
    rep_pyeong = None
    rep_idx = None
    init_price = None
    init_date = None
    
    if rep:
        sales = row['parsed_sales']
        rep_sqm = rep['sqm']
        rep_pyeong = rep['pyeong']
        rep_idx = rep['index']
        if rep_idx < len(sales) and 'price' in sales[rep_idx]:
            init_price = sales[rep_idx]['price']
            init_date = sales[rep_idx]['date']
        else:
            status = 'INCOMPLETE'
            tradable = False
            rep_sqm = None
            rep_pyeong = None
            rep_idx = None
    else:
        status = 'INCOMPLETE'
        tradable = False

    doc_ref = col.document(prop_id)
    doc_data = {
        'property_id': prop_id,
        'complex_id': prop_id,
        'complex_name': row['아파트명'],
        'property_status': status,
        'tradable': tradable,
        'household_count': int(row['세대수']) if pd.notna(row['세대수']) else 0,
        'representative_area_sqm': rep_sqm,
        'representative_area_pyeong': rep_pyeong,
        'representative_area_index': rep_idx,
        'initial_price': init_price,
        'initial_price_date': init_date,
        'legal_dong_address': row['법정동주소'],
        'road_name_address': row['도로명주소'],
        'x': float(row['X']),
        'y': float(row['Y']),
        'region': '수지구',
        'source_file': filename,
        'snapshot_version': '202609',
        'area_info_raw': row['area_info'] if pd.notna(row['area_info']) else "",
        'sales_info_raw': row['sales_info'] if pd.notna(row['sales_info']) else "",
        'created_at': now,
        'updated_at': now
    }
    
    batch.set(doc_ref, doc_data)
    count += 1
    
    if count % 500 == 0:
        batch.commit()
        batch = db.batch()

if count % 500 != 0:
    batch.commit()

print(f"Successfully ingested {count} complexes into PLAY_PROPERTY_MASTER.")
