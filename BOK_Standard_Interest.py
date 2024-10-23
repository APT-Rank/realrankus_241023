from audioop import add
#from types import NoneType
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
import yfinance as yf

path = os.path.dirname( os.path.abspath(__file__) )
temp_path = path.split('\\')

fred_key = "a7d5a17c8b520a7802d3c905fca10131"
bok_key = "570IL3KK1XG2THUF38RC"

#기준시점 선정
utcnow = datetime.datetime.utcnow()
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
    url = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/30/722Y001/D/' + str_date_7days_ago + '/' + str_now + '/0101000'
    #url = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/100/722Y001/M/' + str_date_3years_ago + '/' + str_now_m + '/0101000'
    response = requests.get(url)
    #pars = xmltodict.parse(response.text)
    #jsonDump = json.dumps(pars)
    result = json.loads(response.text)
    standard_interest_7day = result['StatisticSearch']['row']    

    df = pd.DataFrame(standard_interest_7day)
    df['GENERATE'] = str(now)
    df.drop(['STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + df['TIME'].str[6:8]
    df.to_json(path + "/BOK_standatd_interest.json", force_ascii=False, indent=4)
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

    response_US = requests.get(url_US)    
    result_us = json.loads(response_US.text)
    df_result_us = result_us['StatisticSearch']['row']
    df_us = pd.DataFrame(df_result_us)
    df_us.drop(['STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_us.rename(columns = {'DATA_VALUE':'BOK_Currency_US'}, inplace=True)

    response_JP = requests.get(url_JP)    
    result_jp = json.loads(response_JP.text)
    df_result_jp = result_jp['StatisticSearch']['row']
    df_jp = pd.DataFrame(df_result_jp)
    df_jp.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)    
    df_jp.rename(columns = {'DATA_VALUE':'BOK_Currency_JP'}, inplace=True)

    response_EU = requests.get(url_EU)    
    result_eu = json.loads(response_EU.text)
    df_result_eu = result_eu['StatisticSearch']['row']
    df_eu = pd.DataFrame(df_result_eu)
    df_eu.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_eu.rename(columns = {'DATA_VALUE':'BOK_Currency_EU'}, inplace=True) 

    response_CN = requests.get(url_CN)    
    result_cn = json.loads(response_CN.text)
    df_result_cn = result_cn['StatisticSearch']['row']
    df_cn = pd.DataFrame(df_result_cn)
    df_cn.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME'], axis=1, inplace=True)
    df_cn.rename(columns = {'DATA_VALUE':'BOK_Currency_CN'}, inplace=True)

    df = pd.concat([df_us, df_jp, df_eu], axis=1)

    #df['GENERATE'] = str(now)
    df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + df['TIME'].str[6:8] 
    return df
    #df.to_csv(path + "/BOK_currency.csv", encoding='cp949')
    #df.to_json(path + "/BOK_standatd_interest.json", force_ascii=False, indent=4)
    #print("BOK interest saved at " + str(now))

def save_YF_stock_info():
    df_close = pd.DataFrame()    
    symbols = ['^KS11', '^KS200', '^KQ11', '^IXIC', '^GSPC', '^DJI']
    df = yf.download(symbols, str_date_10years_ago_yf, str_now_yf)
    df_close = df.loc[:, 'Close']
    df_close = df_close.reset_index()
    df_close = df_close.astype({'Date':'str'})      
    df_close['Date'] = df_close['Date'].str[0:10]    
    df_close.rename(columns = {'^KS11':'yf_KOSPI', '^KS200':'yf_KOSPI200', '^KQ11':'yf_KOSDAQ','^IXIC':'yf_NASDAQ','^GSPC':'yf_SNP','^DJI':'yf_DOW'}, inplace=True)

    return df_close

def save_YF_metal_info():
    df_close = pd.DataFrame()
    symbols = ['GC=F', 'SI=F', 'HG=F']
    df = yf.download(symbols, str_date_10years_ago_yf, str_now_yf)
    df_close = df.loc[:, 'Close']
    df_close = df_close.reset_index()
    df_close = df_close.astype({'Date':'str'})      
    df_close['Date'] = df_close['Date'].str[0:10]
    df_close.rename(columns = {'GC=F':'yf_Gold', 'SI=F':'yf_Silver','HG=F':'yf_Copper'}, inplace=True)

    return df_close

def save_YF_oil_info():
    df_close = pd.DataFrame()
    symbols = ['CL=F', 'BZ=F']
    df = yf.download(symbols, str_date_10years_ago_yf, str_now_yf)
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
    df = yf.download(symbols, str_date_10years_ago_yf, str_now_yf)
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

def save_BOK_BondYield_3year_info():
    print("Start to get BOK 3 years bond yield rate")
    
    url_3years_bondYield = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/817Y002/D/' + str_date_10years_ago + '/' + str_now + '/010200000'

    response = requests.get(url_3years_bondYield)    
    result = json.loads(response.text)
    df_result = result['StatisticSearch']['row']
    df = pd.DataFrame(df_result)
    df.drop(['STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df.rename(columns = {'DATA_VALUE':'BOK_BondYield03'}, inplace=True)

    df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + df['TIME'].str[6:8] 

    return df

def save_BOK_BondYield_5year_info():
    print("Start to get BOK 5 years bond yield rate")
    
    url_5years_bondYield = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/817Y002/D/' + str_date_10years_ago + '/' + str_now + '/010200001'

    response = requests.get(url_5years_bondYield)    
    result = json.loads(response.text)
    df_result = result['StatisticSearch']['row']
    df = pd.DataFrame(df_result)
    df.drop(['STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df.rename(columns = {'DATA_VALUE':'BOK_BondYield05'}, inplace=True)

    df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + df['TIME'].str[6:8] 

    return df

def save_BOK_BondYield_10year_info():
    print("Start to get BOK 10 years bond yield rate")
    
    url_10years_bondYield = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/817Y002/D/' + str_date_10years_ago + '/' + str_now + '/010210000'

    response = requests.get(url_10years_bondYield)    
    result = json.loads(response.text)
    df_result = result['StatisticSearch']['row']
    df = pd.DataFrame(df_result)
    df.drop(['STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df.rename(columns = {'DATA_VALUE':'BOK_BondYield10'}, inplace=True)

    df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + df['TIME'].str[6:8] 

    return df

def save_BOK_BondYield_30year_info():
    print("Start to get BOK 30 years bond yield rate")
    
    url_30years_bondYield = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/817Y002/D/' + str_date_10years_ago + '/' + str_now + '/010230000'

    response = requests.get(url_30years_bondYield)    
    result = json.loads(response.text)
    df_result = result['StatisticSearch']['row']
    df = pd.DataFrame(df_result)
    df.drop(['STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df.rename(columns = {'DATA_VALUE':'BOK_BondYield30'}, inplace=True)

    df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + df['TIME'].str[6:8]

    return df    

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

    find_path = ""    
    for i in range(len(temp_path)-1):
        find_path += temp_path[i] + "/"

    df.to_json(find_path + "moneyflow/market_daily_info.json", force_ascii=False, indent=4)

market_daily_info()

