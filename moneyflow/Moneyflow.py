import os
import sys
import time
import json
import datetime
from datetime import date, timedelta
from urllib import parse
import requests
import pandas as pd
import numpy as np
import yfinance as yf
from fredapi import Fred

path = os.path.dirname(os.path.abspath(__file__))
root_path = os.path.dirname(path)

bok_key = os.environ.get("BOK_KEY", "570IL3KK1XG2THUF38RC")
fred_key = os.environ.get("FRED_KEY", "a7d5a17c8b520a7802d3c905fca10131")

utcnow = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
now = utcnow + datetime.timedelta(hours=9)

# 30-year monthly timeline (1996-10-01 to current month)
start_date = "1996-10-01"
end_date = now.strftime("%Y-%m-01")
target_index = pd.date_range(start=start_date, end=end_date, freq='MS').strftime("%Y-%m-%d").tolist()
print(f"Target timeline: {len(target_index)} months (from {target_index[0]} to {target_index[-1]})")

series_dict = {}

# 1. BOK Helper
def fetch_bok(stat_code, cycle, start_period, end_period, item1, item2=None, item3=None, item4=None):
    items = [item1]
    for itm in [item2, item3, item4]:
        if itm:
            items.append(itm)
    item_path = "/".join(items)
    url = f"https://ecos.bok.or.kr/api/StatisticSearch/{bok_key}/json/kr/1/500/{stat_code}/{cycle}/{start_period}/{end_period}/{item_path}"
    try:
        r = requests.get(url, timeout=15).json()
        if 'StatisticSearch' in r and 'row' in r['StatisticSearch']:
            rows = r['StatisticSearch']['row']
            data = {}
            for row in rows:
                t = str(row['TIME'])
                if len(t) == 6:
                    t_fmt = f"{t[:4]}-{t[4:6]}-01"
                elif len(t) == 4:
                    t_fmt = f"{t}-01-01"
                elif len(t) >= 8:
                    t_fmt = f"{t[:4]}-{t[4:6]}-{t[6:8]}"
                else:
                    t_fmt = t
                try:
                    data[t_fmt] = float(row['DATA_VALUE'])
                except (ValueError, TypeError):
                    pass
            return pd.Series(data)
        else:
            print(f"[BOK Warn] {stat_code} {item_path}: {r.get('RESULT', {})}")
            return pd.Series(dtype=float)
    except Exception as e:
        print(f"[BOK Err] {stat_code} {item_path}: {e}")
        return pd.Series(dtype=float)

# 2. FRED Helper
fred = Fred(api_key=fred_key)

def fetch_fred(series_id, resample=False):
    try:
        s = fred.get_series(series_id)
        if resample:
            s = s.resample('MS').last()
        s.index = s.index.strftime('%Y-%m-01')
        s = s[~s.index.duplicated(keep='last')]
        return s
    except Exception as e:
        print(f"[FRED Err] {series_id}: {e}")
        return pd.Series(dtype=float)

print("Fetching BOK monthly series...")
bok_queries = {
    'BOK_Standard_Interest': ('722Y001', 'M', '199610', '202610', '0101000'),
    'BOK_Total_Asset': ('102Y004', 'M', '199610', '202610', 'ABA1'),
    'BOK_External_Money': ('732Y001', 'M', '199610', '202610', '99'),
    'BOK_Oil_WTI': ('902Y003', 'M', '199610', '202610', '010101'),
    'BOK_Oil_Dubai': ('902Y003', 'M', '199610', '202610', '010102'),
    'BOK_Oil_Brent': ('902Y003', 'M', '199610', '202610', '010103'),
    'BOK_Metal_Gold': ('902Y003', 'M', '199610', '202610', '040101'),
    'BOK_Metal_Nikkel': ('902Y003', 'M', '199610', '202610', '040204'),
    'BOK_Metal_Zinc': ('902Y003', 'M', '199610', '202610', '040201'),
    'BOK_Bond_Publish': ('191Y001', 'M', '199610', '202610', '0200000', '3'),
    'BOK_Bond_Remain': ('191Y001', 'M', '199610', '202610', '0200000', '4'),
    'BOK_Mind_Consumer': ('511Y002', 'M', '199610', '202610', 'FME', '99988'),
    'BOK_Mind_Economy': ('513Y001', 'M', '199610', '202610', 'E1000'),
    'BOK_Trade_Profit': ('301Y013', 'M', '199610', '202610', '000000'),
    'BOK_Trade_Out': ('901Y118', 'M', '199610', '202610', 'T002'),
    'BOK_Trade_In': ('901Y118', 'M', '199610', '202610', 'T004'),
    'BOK_Housing_Trade_All': ('901Y093', 'M', '199610', '202610', 'H69A', 'R70A'),
    'BOK_Housing_Trade_Apt': ('901Y093', 'M', '199610', '202610', 'H69B', 'R70A'),
    'BOK_Housing_Rent_All': ('901Y094', 'M', '199610', '202610', 'H69A', 'R70A'),
    'BOK_Housing_Rent_Apt': ('901Y094', 'M', '199610', '202610', 'H69B', 'R70A'),
    'DATA_VALUE_GDP': ('200Y101', 'A', '1996', '2026', '10101'),
    'DATA_VALUE_GNI': ('200Y101', 'A', '1996', '2026', '10106'),
    'BOK_Currency_US': ('731Y004', 'M', '199610', '202610', '0000001', '0000200'),
    'BOK_Currency_JP': ('731Y004', 'M', '199610', '202610', '0000002', '0000200'),
    'BOK_Currency_EU': ('731Y004', 'M', '199610', '202610', '0000003', '0000200'),
    'BOK_BondYield03': ('721Y001', 'M', '199610', '202610', '5020000'),
    'BOK_BondYield05': ('721Y001', 'M', '199610', '202610', '5040000'),
    'BOK_BondYield10': ('721Y001', 'M', '199610', '202610', '5050000'),
    'BOK_BondYield30': ('721Y001', 'M', '199610', '202610', '5070000'),
}

for col, args in bok_queries.items():
    s = fetch_bok(*args)
    series_dict[col] = s.reindex(target_index)

print("Fetching FRED monthly series...")
fred_queries = {
    'FRED_Total_Asset': ('WALCL', True),
    'FRED_Interest': ('FEDFUNDS', False),
    'FRED_WTI': ('POILWTIUSDM', False),
    'FRED_Brent': ('POILBREUSDM', False),
    'FRED_Dubai': ('POILDUBUSDM', False),
    'FRED_BondYield03': ('GS3', False),
    'FRED_BondYield05': ('GS5', False),
    'FRED_BondYield10': ('GS10', False),
    'FRED_BondYield30': ('GS30', False),
}

for col, (sid, resample) in fred_queries.items():
    s = fetch_fred(sid, resample=resample)
    series_dict[col] = s.reindex(target_index)

print("Fetching yfinance 30y monthly data...")
yf_symbols = {
    '^KS11': 'yf_KOSPI',
    '^KQ11': 'yf_KOSDAQ',
    '^IXIC': 'yf_NASDAQ',
    '^GSPC': 'yf_SNP',
    '^DJI': 'yf_DOW',
    'GC=F': 'yf_Gold',
    'CL=F': 'yf_WTI',
    'BZ=F': 'yf_Brent',
    'DX-Y.NYB': 'yf_Dollar_Index',
    'BTC-USD': 'yf_BTCUSD',
    'ETH-USD': 'yf_ETHUSD',
    'KRW=X': 'yf_USDKRW',
    'JPYKRW=X': 'yf_JPYKRW',
    'EURKRW=X': 'yf_EURKRW',
    'HG=F': 'yf_Copper',
    'SI=F': 'yf_Silver'
}

yf_download = yf.download(list(yf_symbols.keys()), period='30y', interval='1mo', auto_adjust=False)['Close']
yf_download.index = yf_download.index.strftime('%Y-%m-01')
yf_download = yf_download[~yf_download.index.duplicated(keep='last')]

for ticker, col in yf_symbols.items():
    if ticker in yf_download.columns:
        series_dict[col] = yf_download[ticker].reindex(target_index)

# Derived yfinance columns
series_dict['yf_KOSPI_KOSDAQ'] = series_dict['yf_KOSPI'] + series_dict['yf_KOSDAQ']
series_dict['yf_KOSPI200'] = pd.Series(np.nan, index=target_index)

# 3. Apartment price
print("Loading Apartment sales price...")
apt_file = os.path.join(root_path, "priceCal", "Apt_sales_price_monthly.json")
apt_data = None
if os.path.exists(apt_file):
    try:
        with open(apt_file, 'r', encoding='utf-8') as f:
            apt_data = json.load(f)
    except Exception as e:
        print(f"Failed to read local {apt_file}: {e}")

if not apt_data:
    try:
        r4 = requests.get("https://www.realrankus.com/priceCal/Apt_sales_price_monthly.json", timeout=15)
        r4.encoding = "utf-8-sig"
        apt_data = json.loads(r4.text)
    except Exception as e:
        print(f"Failed to fetch remote apt price: {e}")

if apt_data and 'data' in apt_data:
    df_apt = pd.DataFrame(apt_data['data'])
    df_apt = df_apt.set_index('시군구')
    if 'index' in df_apt.columns:
        df_apt.drop(['index'], axis=1, inplace=True)
    df_apt = df_apt.transpose()
    df_apt.index = df_apt.index.str[0:4] + "-" + df_apt.index.str[4:6] + "-01"
    
    apt_mappings = {
        '전국': 'KOR_APT_PRICE',
        '수도권': 'KOR_APT_PRICE_METROPOLITAN',
        '지방권': 'KOR_APT_PRICE_URBAN',
        '서울시': 'KOR_APT_PRICE_SEOUL',
        '경기도': 'KOR_APT_PRICE_KYUNGKIDO',
        '6대광역시': 'KOR_APT_PRICE_LARGECITY6'
    }
    for orig_name, target_col in apt_mappings.items():
        if orig_name in df_apt.columns:
            s_apt = pd.to_numeric(df_apt[orig_name], errors='coerce')
            series_dict[target_col] = s_apt.reindex(target_index)
        else:
            series_dict[target_col] = pd.Series(np.nan, index=target_index)
else:
    for col in ['KOR_APT_PRICE', 'KOR_APT_PRICE_METROPOLITAN', 'KOR_APT_PRICE_URBAN', 'KOR_APT_PRICE_SEOUL', 'KOR_APT_PRICE_KYUNGKIDO', 'KOR_APT_PRICE_LARGECITY6']:
        series_dict[col] = pd.Series(np.nan, index=target_index)

# Assemble initial DataFrame with all base columns in exact order
base_cols_order = [
    'BOK_Standard_Interest', 'BOK_Total_Asset', 'BOK_External_Money',
    'BOK_Oil_WTI', 'BOK_Oil_Dubai', 'BOK_Oil_Brent',
    'BOK_Metal_Gold', 'BOK_Metal_Nikkel', 'BOK_Metal_Zinc',
    'BOK_Bond_Publish', 'BOK_Bond_Remain',
    'BOK_Mind_Consumer', 'BOK_Mind_Economy',
    'BOK_Trade_Profit', 'BOK_Trade_Out', 'BOK_Trade_In',
    'BOK_Housing_Trade_All', 'BOK_Housing_Trade_Apt',
    'BOK_Housing_Rent_All', 'BOK_Housing_Rent_Apt',
    'DATA_VALUE_GDP', 'DATA_VALUE_GNI',
    'FRED_WTI', 'FRED_Brent', 'FRED_Dubai', 'FRED_Interest',
    'yf_DOW', 'yf_SNP', 'yf_NASDAQ', 'yf_KOSDAQ', 'yf_KOSPI', 'yf_KOSPI200',
    'BOK_Currency_US', 'BOK_Currency_JP', 'BOK_Currency_EU',
    'FRED_Total_Asset',
    'yf_Gold', 'yf_Copper', 'yf_Silver', 'yf_Brent', 'yf_WTI',
    'yf_Dollar_Index', 'yf_BTCUSD', 'yf_ETHUSD', 'yf_EURKRW', 'yf_JPYKRW', 'yf_USDKRW',
    'FRED_BondYield03', 'FRED_BondYield05', 'FRED_BondYield10', 'FRED_BondYield30',
    'BOK_BondYield03', 'BOK_BondYield05', 'BOK_BondYield10', 'BOK_BondYield30',
    'yf_KOSPI_KOSDAQ',
    'KOR_APT_PRICE', 'KOR_APT_PRICE_METROPOLITAN', 'KOR_APT_PRICE_URBAN',
    'KOR_APT_PRICE_SEOUL', 'KOR_APT_PRICE_KYUNGKIDO', 'KOR_APT_PRICE_LARGECITY6'
]

df_base = pd.DataFrame({col: series_dict.get(col, pd.Series(np.nan, index=target_index)) for col in base_cols_order}, index=target_index)

# Forward-fill publication lag (up to latest month)
df_base = df_base.ffill()

# Normalize columns
std_date = "2019-06-01"
print(f"Normalizing with base date {std_date} = 1.00...")

nor_dict = {}
for col in base_cols_order:
    nor_col = col + "_NOR"
    if std_date in df_base.index:
        std_val = df_base.at[std_date, col]
        try:
            std_val = float(std_val)
            if std_val != 0 and not pd.isna(std_val):
                nor_dict[nor_col] = (df_base[col].astype(float) / std_val).round(4)
            else:
                nor_dict[nor_col] = pd.Series(np.nan, index=target_index)
        except Exception:
            nor_dict[nor_col] = pd.Series(np.nan, index=target_index)
    else:
        nor_dict[nor_col] = pd.Series(np.nan, index=target_index)

df_nor = pd.DataFrame(nor_dict, index=target_index)

df_MoneyFlow = pd.concat([df_base, df_nor], axis=1)
df_MoneyFlow['GENERATE'] = str(now)
df_MoneyFlow.index.name = 'TIME'
df_MoneyFlow = df_MoneyFlow.reset_index()

print(f"Generated DataFrame shape: {df_MoneyFlow.shape}")
print(f"Timeline: {df_MoneyFlow['TIME'].iloc[0]} to {df_MoneyFlow['TIME'].iloc[-1]}")

csv_path = os.path.join(path, "market_MoneyFlow.csv")
json_path = os.path.join(path, "market_moneyflow.json")

df_MoneyFlow.to_csv(csv_path, encoding='cp949', index=False)
df_MoneyFlow.to_json(json_path, force_ascii=False, indent=4)
print(f"Successfully saved 30-year data to {json_path}")