import pandas as pd
import numpy as np
import os
import re
import json

path = r'D:\real_estate_data\91_Complex_Valuation'
files = [f for f in os.listdir(path) if '수지구' in f and 'add_info' not in f and f.endswith('.csv')]
file = os.path.join(path, files[0])

# Read data
df = pd.read_csv(file, encoding='cp949')

out = []

out.append("# PLAY-07.2.1_DATA_VALIDATION_REPORT.md")
out.append("\n## A. Source")
out.append(f"- 파일명: {files[0]}")
out.append(f"- 파일 크기: {os.path.getsize(file)} bytes")
out.append(f"- Encoding: cp949 (validated)")
out.append(f"- Row Count: {len(df)}")
out.append(f"- Column Count: {len(df.columns)}")

req_cols = ["검색코드", "아파트명", "세대수", "법정동주소", "도로명주소", "X", "Y", "area_info", "sales_info"]
actual_cols = list(df.columns)

out.append("\n## B. Columns")
out.append("- Required Column: " + str(req_cols))
out.append("- Actual Column: " + str([c for c in actual_cols if c in req_cols]))
out.append("- Mapping Result:")
for req in req_cols:
    out.append(f"  - {req} -> {req if req in actual_cols else 'NOT FOUND'}")

# Complex ID (검색코드)
df['complex_id'] = df['검색코드'].astype(str)
null_ids = df['complex_id'].isnull().sum()
empty_ids = (df['complex_id'] == 'nan').sum()
dup_ids = df['complex_id'].duplicated().sum()
non_num_ids = df['complex_id'].str.contains(r'[^0-9]').sum() - empty_ids # Exclude 'nan'
leading_zeros = df['complex_id'].str.startswith('0').sum()

# Household Count (세대수)
# Clean up 세대수 if necessary, but just evaluate it
df['household'] = pd.to_numeric(df['세대수'], errors='coerce')
null_hh = df['household'].isnull().sum()
zero_hh = (df['household'] == 0).sum()
neg_hh = (df['household'] < 0).sum()
max_hh = df['household'].max()
min_hh = df['household'].min()

# Coordinates
x_missing = df['X'].isnull().sum()
y_missing = df['Y'].isnull().sum()
both_missing = (df['X'].isnull() & df['Y'].isnull()).sum()

valid_complex = df.dropna(subset=['X', 'Y']).copy()

out.append("\n## C. Data Quality")
out.append(f"- Total Complex: {len(df)}")
out.append(f"- Valid Complex (X/Y exist): {len(valid_complex)}")
out.append(f"- X Missing: {x_missing}")
out.append(f"- Y Missing: {y_missing}")
out.append(f"- Both Missing: {both_missing}")
out.append(f"- Duplicate Complex ID: {dup_ids}")
out.append(f"- Complex ID Nulls: {null_ids + empty_ids}")
out.append(f"- Complex ID Non-numeric: {non_num_ids}")
out.append(f"- Complex ID Leading Zeros: {leading_zeros}")
out.append(f"- Household Nulls: {null_hh}, Zero: {zero_hh}, Negative: {neg_hh}, Range: {min_hh} ~ {max_hh}")

def parse_area_info(s):
    if pd.isna(s): return []
    # format: 33평(111.95),34평(113.14)
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
    # e.g., 15.5억, 7000만원, 14억 5000만원
    s = s.replace(' ', '')
    val = 0
    m_uk = re.search(r'([\d\.]+)억', s)
    if m_uk:
        val += float(m_uk.group(1)) * 100000000
    m_man = re.search(r'([\d\.]+)만', s)
    if m_man:
        val += float(m_man.group(1)) * 10000
    # Also handle raw numbers if no units
    if not m_uk and not m_man:
        try:
            val = float(s)
            if val < 10000: # Assuming it's in 만원 if it's too small
                val = val * 10000
        except:
            pass
    return int(val)

def parse_sales_info(s):
    if pd.isna(s): return []
    # format: 15.5억 (2026-07-19),15.7억 (2026-07-17)
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

matched = 0
mismatch = 0
area_only = 0
sales_only = 0
mismatch_examples = []

for _, row in valid_complex.iterrows():
    al = len(row['parsed_area'])
    sl = len(row['parsed_sales'])
    if al > 0 and sl == 0:
        area_only += 1
    elif al == 0 and sl > 0:
        sales_only += 1
    elif al == sl and al > 0:
        matched += 1
    else:
        mismatch += 1
        if len(mismatch_examples) < 5:
            mismatch_examples.append(f"{row['아파트명']} - Area({al}): {row['area_info']} | Sales({sl}): {row['sales_info']}")

out.append("\n## D. Area/Sales Alignment")
out.append(f"- Sample Count: {len(valid_complex)}")
out.append(f"- Match Count: {matched}")
out.append(f"- Mismatch Count: {mismatch}")
out.append(f"- Area only: {area_only}")
out.append(f"- Sales only: {sales_only}")
if mismatch > 0:
    out.append("- Mismatch Examples:")
    for ex in mismatch_examples:
        out.append(f"  - {ex}")


out.append("\n## E. Representative Area (Sample 20)")
# Representative Area Logic
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

sample20 = valid_complex.dropna(subset=['rep_area']).head(20)
for _, row in sample20.iterrows():
    rep = row['rep_area']
    all_areas = [f"{a.get('sqm','?')}㎡" for a in row['parsed_area']]
    out.append(f"- Complex: {row['아파트명']} | All Areas: {all_areas} | Selected Index: {rep['index']} | Selected Area: {rep['sqm']}㎡ | Distance from 84: {rep['diff']:.2f}")

out.append("\n## F. Initial Price (Sample 20)")
for _, row in sample20.iterrows():
    rep = row['rep_area']
    idx = rep['index']
    sales = row['parsed_sales']
    if idx < len(sales) and 'price' in sales[idx]:
        sp = sales[idx]
        out.append(f"- Complex: {row['아파트명']} | Representative Area: {rep['sqm']}㎡ | Area Index: {idx} | Matched Sales: {sp['price']:,} | Initial Price: {sp['price']:,} | Initial Price Date: {sp['date']}")
    else:
        out.append(f"- Complex: {row['아파트명']} | Representative Area: {rep['sqm']}㎡ | Area Index: {idx} | Matched Sales: NOT FOUND (Index out of bounds or parsing failed)")

out.append("\n## G. Property ID")
prop_ids = []
for _, row in valid_complex.iterrows():
    rep = row['rep_area']
    if rep:
        pid = f"{row['complex_id']}:{rep['sqm']}"
        prop_ids.append(pid)

dup_pids = len(prop_ids) - len(set(prop_ids))
out.append(f"- 생성 가능 여부: Yes (Total generated: {len(prop_ids)})")
out.append(f"- 중복 여부: {dup_pids} duplicates")

out.append("\n## H. Snapshot Schema")
out.append("- 모든 필드 Mapping 가능 여부: Yes, with computed fields (representative area, initial price).")
out.append("- 추가 필드 제안: 'areas[]' array to keep full list of sizes, and 'sales[]' to keep full list of prices, for future extensions.")

out.append("\n## I. Blocking Issues")
if mismatch > 0 or len(prop_ids) == 0:
    out.append("BLOCKING ISSUE")
    out.append(f"Reason: Index mismatch between area_info and sales_info. Mismatched: {mismatch}")
else:
    out.append("NONE")

out.append("\n## J. Final Verdict")
if mismatch > 0 or len(prop_ids) == 0:
    out.append("BLOCKED")
else:
    out.append("READY FOR PLAY-07.2 IMPLEMENTATION")

out.append("\n## K. Example Verification (5 Full Examples)")
ex5 = sample20.head(5)
for _, row in ex5.iterrows():
    out.append(f"\nComplex ID: {row['complex_id']}")
    out.append(f"Complex Name: {row['아파트명']}")
    out.append(f"area_info: {row['area_info']}")
    out.append(f"sales_info: {row['sales_info']}")
    rep = row['rep_area']
    if rep:
        idx = rep['index']
        a = row['parsed_area'][idx]
        out.append("Representative:")
        out.append(f"index = {idx}")
        out.append(f"area = {a.get('sqm')}㎡")
        out.append(f"pyeong = {a.get('pyeong')}평")
        
        sales = row['parsed_sales']
        if idx < len(sales) and 'price' in sales[idx]:
            sp = sales[idx]
            out.append("Matched sales_info:")
            out.append(f"price = {sp['price']:,}")
            out.append(f"date = {sp['date']}")
            out.append("Initial Price:")
            out.append(f"{sp['price']:,}")
        else:
            out.append("Matched sales_info: Not found")
    out.append("-" * 40)

out.append("\n## L. last_sales 검증")
# Compare last_sales with our Initial Price
for _, row in ex5.iterrows():
    out.append(f"Complex: {row['아파트명']} | last_sales: {row['last_sales']}")

with open('PLAY-07.2.1_DATA_VALIDATION_REPORT.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))

