import pandas as pd
import numpy as np
import os
import re

path = r'D:\real_estate_data\91_Complex_Valuation'
files = [f for f in os.listdir(path) if '수지구' in f and 'add_info' not in f and f.endswith('.csv')]
file = os.path.join(path, files[0])

# Read data
df = pd.read_csv(file, encoding='cp949')

df['complex_id'] = df['검색코드'].astype(str)

valid_complex = df.dropna(subset=['X', 'Y']).copy()

def parse_area_info(s):
    if pd.isna(s): return []
    parts = str(s).split(',')
    res = []
    for p in parts:
        m = re.match(r'([\d\.]+)평\(([\d\.]+)\)', p.strip())
        if m:
            res.append({'pyeong': float(m.group(1)), 'sqm': float(m.group(2))})
        else:
            res.append({'raw': p})
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
            res.append({'price': parse_price(m.group(1)), 'date': m.group(2)})
        else:
            res.append({'raw': p})
    return res

valid_complex['parsed_area'] = valid_complex['area_info'].apply(parse_area_info)
valid_complex['parsed_sales'] = valid_complex['sales_info'].apply(parse_sales_info)

def get_rep_area(parsed_areas):
    if not parsed_areas: return None
    best_idx = -1
    best_diff = 999999
    best_sqm = -1
    for i, a in enumerate(parsed_areas):
        if 'sqm' in a:
            diff = abs(a['sqm'] - 84.0)
            if diff < best_diff:
                best_diff = diff
                best_idx = i
                best_sqm = a['sqm']
    if best_idx != -1:
        return {'index': best_idx, 'sqm': best_sqm, 'diff': best_diff}
    return None

valid_complex['rep_area'] = valid_complex['parsed_area'].apply(get_rep_area)

prop_ids = []
missing_complexes = []
for _, row in valid_complex.iterrows():
    rep = row['rep_area']
    if rep:
        pid = f"{row['complex_id']}:{rep['sqm']}"
        prop_ids.append(pid)
    else:
        missing_complexes.append(row)

for idx, m in enumerate(missing_complexes):
    print(f"--- Excluded Complex #{idx+1} ---")
    print(f"ID: {m['complex_id']}")
    print(f"Name: {m['아파트명']}")
    print(f"area_info: {m['area_info']}")
    print(f"parsed_area: {m['parsed_area']}")
    print(f"sales_info: {m['sales_info']}")
    print("---------------------------------")
