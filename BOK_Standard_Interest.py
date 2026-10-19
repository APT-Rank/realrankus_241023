import requests
import datetime
from dateutil.relativedelta import *
import time
import os
import pandas as pd
import json
from urllib import parse
from fredapi import Fred
from pykrx import stock
from pykrx import bond
import xml.etree.ElementTree as ET
import yfinance as yf

path = os.path.dirname( os.path.abspath(__file__) )
temp_path = path.split('\\')

fred_key = os.environ.get("FRED_KEY", "a7d5a17c8b520a7802d3c905fca10131")
bok_key = os.environ.get("BOK_KEY", "570IL3KK1XG2THUF38RC")

def fetch_ecos_data(url, max_retries=3, delay=2):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code == 200:
                result = response.json()
                if 'StatisticSearch' in result and 'row' in result['StatisticSearch']:
                    return result['StatisticSearch']['row']
                elif 'RESULT' in result:
                    code = result['RESULT'].get('CODE', '')
                    msg = result['RESULT'].get('MESSAGE', '')
                    print(f"[ECOS Warning] Attempt {attempt+1}/{max_retries}: {code} - {msg} ({url})")
                else:
                    print(f"[ECOS Warning] Attempt {attempt+1}/{max_retries}: Unexpected response: {result}")
            else:
                print(f"[ECOS Warning] Attempt {attempt+1}/{max_retries}: HTTP {response.status_code}")
        except Exception as e:
            print(f"[ECOS Error] Attempt {attempt+1}/{max_retries} failed: {e}")
        time.sleep(delay)
    return None

#기준시점 선정
utcnow = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
now = utcnow + datetime.timedelta(hours=9)

date_7days_ago = now - datetime.timedelta(days=7)
date_3years_ago = now - relativedelta(years=3)
date_10years_ago = now - relativedelta(years=10)

str_now = now.strftime("%Y%m%d")
str_date_7days_ago = date_7days_ago.strftime("%Y%m%d")
str_date_10years_ago = date_10years_ago.strftime("%Y%m%d")

str_now_yf = now.strftime("%Y-%m-%d")
str_date_7days_ago_yf = date_7days_ago.strftime("%Y-%m-%d")
str_date_10years_ago_yf = date_10years_ago.strftime("%Y-%m-%d")

str_now_m = now.strftime("%Y%m")
str_date_3years_ago_m = date_3years_ago.strftime("%Y%m")
str_date_10years_ago_m = date_10years_ago.strftime("%Y%m")

str_now_y = now.strftime("%Y")
str_date_3years_ago_y = date_3years_ago.strftime("%Y")
str_date_10years_ago_y = date_10years_ago.strftime("%Y")

def save_BOK_interest_info():
    print("Start to get BOK interest")
    #한국은행 기준금리 (%)
    url = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/200/722Y001/M/' + str_date_10years_ago_m + '/' + str_now_m + '/0101000'    
    standard_interest_7day = fetch_ecos_data(url)

    out_file = os.path.join(path, "BOK_standatd_interest.json")
    if standard_interest_7day is None:
        print("[Warning] Failed to fetch BOK interest data.")
        if os.path.exists(out_file):
            print(f"Preserving existing {out_file}")
            return
        else:
            raise RuntimeError("Failed to fetch BOK interest data and no cached file exists.")

    df = pd.DataFrame(standard_interest_7day)
    df['GENERATE'] = str(now)
    cols_to_drop = [c for c in ['STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'] if c in df.columns]
    df.drop(cols_to_drop, axis=1, inplace=True)
    df['TIME'] = df['TIME'].astype(str)
    df['TIME'] = df['TIME'].apply(lambda x: f"{x[0:4]}-{x[4:6]}" if len(x) == 6 else (f"{x[0:4]}-{x[4:6]}-{x[6:8]}" if len(x) >= 8 else x))
    df.to_json(out_file, force_ascii=False, indent=4)
    print("BOK interest saved at " + str(now))

def save_FED_interest_info():
    print("Start to get FED interest")

    #https://api.stlouisfed.org/fred/series/observations?series_id=DFEDTARU&api_key=a7d5a17c8b520a7802d3c905fca10131&file_type=json&frequency=bw&observation_start=2019-10-14&observation_end=2022-10-01
    data_result = pd.DataFrame()
    fred = Fred(api_key=fred_key)
    data = fred.get_series('DFEDTARU')

    data = data[data.index > date_7days_ago]
    data_result['DATE'] = data.index.strftime('%Y-%m-%d').tolist()
    data_result['INTEREST'] = data.values.tolist()
    data_result['GENERATE'] = str(now)

    #data_result.to_csv(path + "/FED_standatd_interest.csv", encoding='cp949')
    data_result.to_json(path + "/FED_standatd_interest.json", force_ascii=False, indent=4)
    print("FED interest saved at " + str(now))

save_BOK_interest_info()
save_FED_interest_info()

########## 여기서부터는 시장현황 일단위 업데이트 ###############
def save_BOK_currency_info():
    print("Start to get BOK currency")

    #달러-원 환율
    url_US = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/731Y001/D/' + str_date_10years_ago + '/' + str_now + '/0000001'
    #엔-원 환율
    url_JP = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/731Y001/D/' + str_date_10years_ago + '/' + str_now + '/0000002'
    #유로-원 환율
    url_EU = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/731Y001/D/' + str_date_10years_ago + '/' + str_now + '/0000003'
    #위안-원 환율
    url_CN = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/731Y001/D/' + str_date_10years_ago + '/' + str_now + '/0000053'

    cols_drop_base = ['STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT']

    cached_json = os.path.join(path, "moneyflow", "market_daily_info.json")
    cached_data = None
    if os.path.exists(cached_json):
        try:
            with open(cached_json, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)
        except Exception:
            cached_data = None

    row_us = fetch_ecos_data(url_US)
    if row_us:
        df_us = pd.DataFrame(row_us)
        df_us.drop([c for c in cols_drop_base if c in df_us.columns], axis=1, inplace=True)
        df_us.rename(columns={'DATA_VALUE': 'BOK_Currency_US'}, inplace=True)
    elif cached_data and 'BOK_Currency_US' in cached_data and 'TIME' in cached_data:
        df_us = pd.DataFrame({'TIME': list(cached_data['TIME'].values()), 'BOK_Currency_US': list(cached_data['BOK_Currency_US'].values())})
        df_us = df_us.dropna(subset=['BOK_Currency_US'])
        print(f"[Info] Preserved {len(df_us)} records for BOK_Currency_US from cache.")
    else:
        df_us = pd.DataFrame(columns=['TIME', 'BOK_Currency_US'])

    row_jp = fetch_ecos_data(url_JP)
    if row_jp:
        df_jp = pd.DataFrame(row_jp)
        df_jp.drop([c for c in (cols_drop_base + ['TIME']) if c in df_jp.columns], axis=1, inplace=True)
        df_jp.rename(columns={'DATA_VALUE': 'BOK_Currency_JP'}, inplace=True)
    elif cached_data and 'BOK_Currency_JP' in cached_data:
        df_jp = pd.DataFrame({'BOK_Currency_JP': list(cached_data['BOK_Currency_JP'].values())})
        df_jp = df_jp.dropna(subset=['BOK_Currency_JP'])
        print(f"[Info] Preserved {len(df_jp)} records for BOK_Currency_JP from cache.")
    else:
        df_jp = pd.DataFrame(columns=['BOK_Currency_JP'])

    row_eu = fetch_ecos_data(url_EU)
    if row_eu:
        df_eu = pd.DataFrame(row_eu)
        df_eu.drop([c for c in (cols_drop_base + ['TIME']) if c in df_eu.columns], axis=1, inplace=True)
        df_eu.rename(columns={'DATA_VALUE': 'BOK_Currency_EU'}, inplace=True)
    elif cached_data and 'BOK_Currency_EU' in cached_data:
        df_eu = pd.DataFrame({'BOK_Currency_EU': list(cached_data['BOK_Currency_EU'].values())})
        df_eu = df_eu.dropna(subset=['BOK_Currency_EU'])
        print(f"[Info] Preserved {len(df_eu)} records for BOK_Currency_EU from cache.")
    else:
        df_eu = pd.DataFrame(columns=['BOK_Currency_EU'])

    df = pd.concat([df_us, df_jp, df_eu], axis=1)

    if 'TIME' in df.columns:
        df['TIME'] = df['TIME'].astype(str)
        df['TIME'] = df['TIME'].apply(lambda x: f"{x[0:4]}-{x[4:6]}-{x[6:8]}" if len(x) >= 8 else x)
    return df

def save_YF_stock_info():
    df_close = pd.DataFrame()
    symbols = ['^KS11', '^KQ11', '^IXIC', '^GSPC', '^DJI']
    df = yf.download(tickers = symbols, start = str_date_10years_ago_yf, end = str_now_yf, auto_adjust = False)
    df_close = df.loc[:, 'Close']
    df_close = df_close.reset_index()
    df_close = df_close.astype({'Date':'str'})      
    df_close['Date'] = df_close['Date'].str[0:10]
    df_close.rename(columns = {'^KS11':'yf_KOSPI', '^KQ11':'yf_KOSDAQ','^IXIC':'yf_NASDAQ','^GSPC':'yf_SNP','^DJI':'yf_DOW'}, inplace=True)

    try:
        print("Start to get Naver KOSPI200")
        url = 'https://fchart.stock.naver.com/sise.nhn?symbol=KPI200&timeframe=day&count=3000&requestType=0'
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        root = ET.fromstring(r.text)
        data = [{'Date': f"{v[0][:4]}-{v[0][4:6]}-{v[0][6:8]}", 'yf_KOSPI200': float(v[4])} for v in (item.attrib['data'].split('|') for item in root.findall('.//item'))]
        df_kpi200 = pd.DataFrame(data)
        df_close = pd.merge(df_close, df_kpi200, on='Date', how='left')
    except Exception as e:
        print("Failed to fetch Naver KPI200:", e)
        df_close['yf_KOSPI200'] = None

    return df_close

def save_YF_metal_info():
    df_close = pd.DataFrame()
    symbols = ['GC=F', 'SI=F', 'HG=F']
    df = yf.download(tickers = symbols, start = str_date_10years_ago_yf, end = str_now_yf, auto_adjust = False)
    df_close = df.loc[:, 'Close']
    df_close = df_close.reset_index()
    df_close = df_close.astype({'Date':'str'})      
    df_close['Date'] = df_close['Date'].str[0:10]
    df_close.rename(columns = {'GC=F':'yf_Gold', 'SI=F':'yf_Silver','HG=F':'yf_Copper'}, inplace=True)

    return df_close

def save_YF_oil_info():
    df_close = pd.DataFrame()
    symbols = ['CL=F', 'BZ=F']
    df = yf.download(tickers = symbols, start = str_date_10years_ago_yf, end = str_now_yf, auto_adjust = False)
    df_close = df.loc[:, 'Close']
    df_close = df_close.reset_index()
    df_close = df_close.astype({'Date':'str'})      
    df_close['Date'] = df_close['Date'].str[0:10]
    df_close.rename(columns = {'CL=F':'yf_WTI', 'BZ=F':'yf_Brent'}, inplace=True)

    return df_close

def save_YF_dollar_index_info():
    dIndex = yf.Ticker('DX-Y.NYB')
    df = dIndex.history(start = str_date_10years_ago_yf, end = str_now_yf)
    df_close = df.loc[:, 'Close']
    df_close = df_close.reset_index()
    df_close = df_close.astype({'Date':'str'})
    df_close['Date'] = df_close['Date'].str[0:10]
    df_close.rename(columns = {'Close':'yf_Dollar_Index'}, inplace=True)

    return df_close

def save_YF_currency_info():
    df_close = pd.DataFrame()
    symbols = ['KRW=X', 'JPYKRW=X', 'EURKRW=X', 'BTC-USD', 'ETH-USD']
    df = yf.download(tickers = symbols, start = str_date_10years_ago_yf, end = str_now_yf, auto_adjust = False)
    df_close = df.loc[:, 'Close']
    df_close = df_close.reset_index()
    df_close = df_close.astype({'Date':'str'})      
    df_close['Date'] = df_close['Date'].str[0:10]
    df_close.rename(columns = {'KRW=X':'yf_USDKRW', 'JPYKRW=X':'yf_JPYKRW', 'EURKRW=X':'yf_EURKRW', 'BTC-USD':'yf_BTCUSD', 'ETH-USD':'yf_ETHUSD'}, inplace=True)

    return df_close

def save_FED_interest_info():
    print("Start to get FED interest")
    
    data_result = pd.DataFrame()
    fred = Fred(api_key=fred_key)
    data = fred.get_series('DFEDTARU')

    data = data[data.index > date_10years_ago]
    data_result['DATE'] = data.index.strftime('%Y-%m-%d').tolist()
    data_result['FRED_Interest'] = data.values.tolist()
    #data_result['GENERATE'] = str(now)

    return data_result

    #data_result.to_csv(path + "/FED_standatd_interest.csv", encoding='cp949')    
    #data_result.to_json(path + "/FED_standatd_interest.json", force_ascii=False, indent=4)
    #print("FED interest saved at " + str(now))

def save_FED_TotalAsset_info():
    print("Start to get FED TotalAsset")
    data_result = pd.DataFrame()
    fred = Fred(api_key=fred_key)
    data = fred.get_series('WALCL')    

    data = data[data.index > date_10years_ago]
    data_result['DATE'] = data.index.strftime('%Y-%m-%d').tolist()
    data_result['FRED_Total_Asset'] = data.values.tolist()

    return data_result

    #data_result.to_csv(path + "/FED_total_asset.csv", encoding='cp949')
    #data_result.to_json(path + "/FED_standatd_interest.json", force_ascii=False, indent=4)
    #print("FED interest saved at " + str(now))

def save_FED_BondYield_3year_info():
    print("Start to get FED 3 years Bond Yield")
    data_result = pd.DataFrame()
    fred = Fred(api_key=fred_key)
    data = fred.get_series('DGS3')    

    data = data[data.index > date_10years_ago]
    data_result['DATE'] = data.index.strftime('%Y-%m-%d').tolist()
    data_result['FRED_BondYield03'] = data.values.tolist()

    return data_result

    #data_result.to_csv(path + "/FED_total_asset.csv", encoding='cp949')
    #data_result.to_json(path + "/FED_standatd_interest.json", force_ascii=False, indent=4)
    #print("FED interest saved at " + str(now))

def save_FED_BondYield_5year_info():
    print("Start to get FED 3 years Bond Yield")
    data_result = pd.DataFrame()
    fred = Fred(api_key=fred_key)
    data = fred.get_series('DGS5')

    data = data[data.index > date_10years_ago]
    data_result['DATE'] = data.index.strftime('%Y-%m-%d').tolist()
    data_result['FRED_BondYield05'] = data.values.tolist()

    return data_result

    #data_result.to_csv(path + "/FED_total_asset.csv", encoding='cp949')
    #data_result.to_json(path + "/FED_standatd_interest.json", force_ascii=False, indent=4)
    #print("FED interest saved at " + str(now))     

def save_FED_BondYield_10year_info():
    print("Start to get FED 10 years Bond Yield")
    data_result = pd.DataFrame()
    fred = Fred(api_key=fred_key)
    data = fred.get_series('DGS10')    

    data = data[data.index > date_10years_ago]
    data_result['DATE'] = data.index.strftime('%Y-%m-%d').tolist()
    data_result['FRED_BondYield10'] = data.values.tolist()

    return data_result

    #data_result.to_csv(path + "/FED_total_asset.csv", encoding='cp949')
    #data_result.to_json(path + "/FED_standatd_interest.json", force_ascii=False, indent=4)
    #print("FED interest saved at " + str(now))

def save_FED_BondYield_30year_info():
    print("Start to get FED 30 years Bond Yield")
    data_result = pd.DataFrame()
    fred = Fred(api_key=fred_key)
    data = fred.get_series('DGS30')    

    data = data[data.index > date_10years_ago]
    data_result['DATE'] = data.index.strftime('%Y-%m-%d').tolist()
    data_result['FRED_BondYield30'] = data.values.tolist()

    return data_result

    #data_result.to_csv(path + "/FED_total_asset.csv", encoding='cp949')
    #data_result.to_json(path + "/FED_standatd_interest.json", force_ascii=False, indent=4)
    #print("FED interest saved at " + str(now))

def _fetch_bond_yield(url, col_name, label):
    print(f"Start to get {label}")
    rows = fetch_ecos_data(url)
    if rows:
        df = pd.DataFrame(rows)
        cols_drop = [c for c in ['STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'] if c in df.columns]
        df.drop(cols_drop, axis=1, inplace=True)
        df.rename(columns={'DATA_VALUE': col_name}, inplace=True)
        df['TIME'] = df['TIME'].astype(str)
        df['TIME'] = df['TIME'].apply(lambda x: f"{x[0:4]}-{x[4:6]}-{x[6:8]}" if len(x) >= 8 else x)
        return df
    else:
        print(f"[Warning] Failed to fetch {label}")
        cached_json = os.path.join(path, "moneyflow", "market_daily_info.json")
        if os.path.exists(cached_json):
            try:
                with open(cached_json, 'r', encoding='utf-8') as f:
                    cdata = json.load(f)
                    if col_name in cdata and 'TIME' in cdata:
                        cdf = pd.DataFrame({'TIME': list(cdata['TIME'].values()), col_name: list(cdata[col_name].values())})
                        cdf = cdf.dropna(subset=[col_name])
                        if len(cdf) > 0:
                            print(f"[Info] Preserved {len(cdf)} records for {col_name} from cache.")
                            return cdf
            except Exception:
                pass
        return pd.DataFrame(columns=['TIME', col_name])

def save_BOK_BondYield_3year_info():
    url_3years_bondYield = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/817Y002/D/' + str_date_10years_ago + '/' + str_now + '/010200000'
    return _fetch_bond_yield(url_3years_bondYield, 'BOK_BondYield03', 'BOK 3 years bond yield rate')

def save_BOK_BondYield_5year_info():
    url_5years_bondYield = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/817Y002/D/' + str_date_10years_ago + '/' + str_now + '/010200001'
    return _fetch_bond_yield(url_5years_bondYield, 'BOK_BondYield05', 'BOK 5 years bond yield rate')

def save_BOK_BondYield_10year_info():
    url_10years_bondYield = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/817Y002/D/' + str_date_10years_ago + '/' + str_now + '/010210000'
    return _fetch_bond_yield(url_10years_bondYield, 'BOK_BondYield10', 'BOK 10 years bond yield rate')

def save_BOK_BondYield_30year_info():
    url_30years_bondYield = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/817Y002/D/' + str_date_10years_ago + '/' + str_now + '/010230000'
    return _fetch_bond_yield(url_30years_bondYield, 'BOK_BondYield30', 'BOK 30 years bond yield rate')

def market_daily_info():
    df_YF_Stocks = save_YF_stock_info()
    df_YF_Metal = save_YF_metal_info()
    df_YF_Oil = save_YF_oil_info()
    df_YF_Dollar_Index = save_YF_dollar_index_info()
    df_YF_Currency = save_YF_currency_info()
    df_BOK_Currency = save_BOK_currency_info()
    df_FRED_Interest = save_FED_interest_info()
    df_FRED_TotalAsset = save_FED_TotalAsset_info()
    df_FRED_BondYield03 = save_FED_BondYield_3year_info()
    df_FRED_BondYield05 = save_FED_BondYield_5year_info()
    df_FRED_BondYield10 = save_FED_BondYield_10year_info()
    df_FRED_BondYield30 = save_FED_BondYield_30year_info()
    df_BOK_BondYield03 = save_BOK_BondYield_3year_info()
    df_BOK_BondYield05 = save_BOK_BondYield_5year_info()
    df_BOK_BondYield10 = save_BOK_BondYield_10year_info()
    df_BOK_BondYield30 = save_BOK_BondYield_30year_info()    

    df_YF_Stocks.set_index('Date', inplace = True)
    df_YF_Metal.set_index('Date', inplace = True)
    df_YF_Oil.set_index('Date', inplace = True)
    df_YF_Dollar_Index.set_index('Date', inplace = True)
    df_YF_Currency.set_index('Date', inplace = True)
    df_BOK_Currency.set_index('TIME', inplace = True)
    df_FRED_Interest.set_index('DATE', inplace = True)
    df_FRED_TotalAsset.set_index('DATE', inplace = True)
    df_FRED_BondYield03.set_index('DATE', inplace = True)
    df_FRED_BondYield05.set_index('DATE', inplace = True)
    df_FRED_BondYield10.set_index('DATE', inplace = True)
    df_FRED_BondYield30.set_index('DATE', inplace = True)
    df_BOK_BondYield03.set_index('TIME', inplace = True)
    df_BOK_BondYield05.set_index('TIME', inplace = True)
    df_BOK_BondYield10.set_index('TIME', inplace = True)
    df_BOK_BondYield30.set_index('TIME', inplace = True)

    df = pd.concat([df_FRED_Interest, df_YF_Stocks, df_BOK_Currency, df_FRED_TotalAsset, df_YF_Metal, df_YF_Oil, df_YF_Dollar_Index, df_YF_Currency, df_FRED_BondYield03, df_FRED_BondYield05,
                    df_FRED_BondYield10, df_FRED_BondYield30, df_BOK_BondYield03, df_BOK_BondYield05, df_BOK_BondYield10, df_BOK_BondYield30], axis=1)    
    df.reset_index(inplace=True)
    df.rename(columns = {'index':'TIME'}, inplace=True)

    df = df.sort_values('TIME')
    df['GENERATE'] = str(now)
    df = df.reset_index(drop=True)
    #df.to_csv(path + "/market_daily_info.csv", encoding='cp949')
    #df.to_json(path + "/market_daily_info.json", force_ascii=False, indent=4)

    out_dir = os.path.join(path, "moneyflow")
    os.makedirs(out_dir, exist_ok=True)
    df.to_json(os.path.join(out_dir, "market_daily_info.json"), force_ascii=False, indent=4)

market_daily_info()

