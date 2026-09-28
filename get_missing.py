import pandas as pd
import os

path = r'D:\real_estate_data\91_Complex_Valuation'
files = [f for f in os.listdir(path) if '수지구' in f and 'add_info' not in f and f.endswith('.csv')]
df = pd.read_csv(os.path.join(path, files[0]), encoding='cp949')
valid = df.dropna(subset=['X', 'Y'])

def has_valid_area(s):
    if pd.isna(s): return False
    return '평(' in str(s)

missing = valid[~valid['area_info'].apply(has_valid_area)]
with open('missing_info.txt', 'w', encoding='utf-8') as f:
    for _, row in missing.iterrows():
        f.write(f"ID: {row['검색코드']} | Name: {row['아파트명']} | X: {row['X']} | Y: {row['Y']} | HH: {row['세대수']} | Area: {row['area_info']} | Sales: {row['sales_info']}\n")
