#import time, win32con, win32api, win32gui
import pandas as pd
import os
import time
import datetime
#import pyautogui
import requests
import xmltodict
import json
import pandas as pd
import os
import time
import datetime
from datetime import date, timedelta
#import subprocess
from urllib import parse
import numpy as np
import random

path = os.path.dirname(os.path.abspath(__file__))
temp_path = path.split("\\")

utcnow = datetime.datetime.utcnow()
now = utcnow + datetime.timedelta(hours=9)

def get_normalized_data(original_df, std_val):
    normalized_df = pd.DataFrame(original_df)
    normalized_df[normalized_df.columns[0]] = normalized_df[normalized_df.columns[0]].astype('float')
    normalized_df[normalized_df.columns[0]] = normalized_df[normalized_df.columns[0]] / std_value
    normalized_df.rename(columns = { normalized_df.columns[0] : normalized_df.columns[0] + "_NOR" }, inplace=True)

    #print(normalized_df)
    return normalized_df

deal_url = 'https://api.odcloud.kr/api/15069826/v1/uddi:c921d88a-6deb-4904-a658-e1fdb5437c92'

def get_KOR_apt_price():
    params ={'serviceKey' : 'aWzbGw3E1gsKY2uesFyKJs6GICcW4rY4WdSY1C6QilU0yyF+cRF40xhBTZhlvpIHKdJM147NHPMQ7P0R0d7oJw==',
            'page' : '2',
            'perPage' : '3000',
            }

    response = requests.get(deal_url, params=params)    
    #jsonConvert = json.dumps(xmltodict.parse(response.content), ensure_ascii=False, indent=4)
    r = json.loads(response.text)
    json_dict = r['data']
    df_deal = pd.DataFrame(json_dict)
    print(df_deal)
    df_deal.rename(columns = {'지 역':'TIME'}, inplace=True)
    df_deal = df_deal.set_index("TIME")   
    df_deal = df_deal.transpose()
    df_deal = df_deal.reset_index()    
    df_deal.rename(columns = {'index':'TIME'}, inplace=True)
    df_deal['TIME'] = df_deal['TIME'] + "-01"
    df_deal = df_deal.set_index("TIME")

    return df_deal['전국']


mf_daily_url = "https://www.realrankus.com/moneyflow/market_daily_info.json"
r2 = requests.get(mf_daily_url)
r2.encoding = "utf-8-sig"
mf_daily=json.loads(r2.text)
df_daily = pd.DataFrame(mf_daily)
df_daily = df_daily.fillna(method='ffill')
df_daily = df_daily.fillna(method='bfill')
df_daily.set_index('TIME', inplace = True)

mf_monthly_url = "https://www.realrankus.com/moneyflow/market_monthly_info.json"
r3 = requests.get(mf_monthly_url)
r3.encoding = "utf-8-sig"
mf_monthly=json.loads(r3.text)
df_monthly = pd.DataFrame(mf_monthly)
df_monthly = df_monthly.fillna(method='ffill')
df_monthly = df_monthly.fillna(method='bfill')
df_monthly.set_index('TIME', inplace = True)

mf_apt_price_url = "https://www.realrankus.com/priceCal/Apt_sales_price_monthly.json"
r4 = requests.get(mf_apt_price_url)
r4.encoding = "utf-8-sig"
mf_apt_price=json.loads(r4.text)
df_apt_price = pd.DataFrame(mf_apt_price['data'])
df_apt_price = df_apt_price.reset_index(drop=True)
df_apt_price = df_apt_price.set_index('시군구')
df_apt_price.drop(['index'], axis=1, inplace=True)
df_apt_price = df_apt_price.transpose()
df_apt_price = df_apt_price.reset_index()
df_apt_price.rename(columns = {'index':'TIME'}, inplace=True)
df_apt_price['TIME'] = df_apt_price['TIME'].str[0:4] + "-" + df_apt_price['TIME'].str[4:6] + "-01"
df_apt_price.set_index('TIME', inplace = True)
df_apt_price = df_apt_price['전국']

df_MoneyFlow = pd.concat([df_monthly, df_daily], axis=1, join='inner')

#한국부동산원 아파트가격 추가
#df_kor_apt_price = get_KOR_apt_price()
#df_kor_apt_price.to_csv(path + "/test.csv", encoding='cp949')

#한국 코스피, 코스닥 지수 합침
sr_sum_kospi_kosdaq = df_MoneyFlow['yf_KOSPI'] + df_MoneyFlow['yf_KOSDAQ']
df_sum_kospi_kosdaq = sr_sum_kospi_kosdaq.to_frame()
df_sum_kospi_kosdaq.rename(columns = {0:'yf_KOSPI_KOSDAQ'}, inplace=True)

df_MoneyFlow = pd.concat([df_MoneyFlow, df_sum_kospi_kosdaq, df_apt_price], axis=1, join='inner')
df_MoneyFlow.rename(columns = {'전국':'KOR_APT_PRICE'}, inplace=True)

#print([df_MoneyFlow.columns])
df_MoneyFlow.drop(['GENERATE'], axis=1, inplace=True)

std_date = "2019-06-01"

for i in range( len(df_MoneyFlow.columns) ):
    original_df = df_MoneyFlow[df_MoneyFlow.columns[i]]
    std_value = float(original_df[std_date])
    normalized = get_normalized_data (original_df, std_value)
    df_MoneyFlow = pd.concat([df_MoneyFlow, normalized], axis=1, join='inner')

df_MoneyFlow['GENERATE'] = str(now)
df_MoneyFlow = df_MoneyFlow.reset_index()

#df_MoneyFlow.to_csv(path + "/market_MoneyFlow.csv", encoding='cp949')
df_MoneyFlow.to_json(path + "/market_moneyflow.json", force_ascii=False, indent=4)
