from audioop import add
import requests
import datetime
from dateutil.relativedelta import *
import time
import os
import pandas as pd
import json
from urllib import parse
from fredapi import Fred

path = os.path.dirname( os.path.abspath(__file__) )
temp_path = path.split('\\')

key = "a4e0de06940548baa56ef556c78cb6d5"
bok_key = "570IL3KK1XG2THUF38RC"
fred_key = "a7d5a17c8b520a7802d3c905fca10131"

#기준시점 선정
utcnow = datetime.datetime.utcnow()
now = utcnow + datetime.timedelta(hours=9)

date_7days_ago = now - datetime.timedelta(days=7)
date_3years_ago = now - relativedelta(years=3)
date_10years_ago = now - relativedelta(years=10)

date_1Q_ago = now - relativedelta(months=3)
date_2Q_ago = now - relativedelta(months=6)
date_3Q_ago = now - relativedelta(months=9)
date_4Q_ago = now - relativedelta(months=12)

buying_power_quaters = [date_2Q_ago, date_3Q_ago, date_4Q_ago]

#date_6m_ago = now - relativedelta(months=6)
#date_7m_ago = now - relativedelta(months=7)
#date_8m_ago = now - relativedelta(months=8)

date_6m_ago = now - relativedelta(months=8)
date_7m_ago = now - relativedelta(months=9)
date_8m_ago = now - relativedelta(months=10)

PIR_Month = [date_6m_ago, date_7m_ago, date_8m_ago]

str_now_ym = now.strftime("%Y%m")
str_now_y = now.strftime("%Y")
str_now_m = now.strftime("%m")

str_now = now.strftime("%Y%m%d")
str_date_7days_ago = date_7days_ago.strftime("%Y%m%d")
str_date_10years_ago = date_10years_ago.strftime("%Y%m%d")

str_now_m = now.strftime("%Y%m")
str_date_3years_ago_m = date_3years_ago.strftime("%Y%m")
str_date_10years_ago_m = date_10years_ago.strftime("%Y%m")

str_now_y = now.strftime("%Y")
str_date_3years_ago_y = date_3years_ago.strftime("%Y")
str_date_10years_ago_y = date_10years_ago.strftime("%Y")

result_df = pd.DataFrame()

def save_buying_power():
    global result_df
    print("Start to get Buying Power")

    for i in range(len(buying_power_quaters)):
        str_year = buying_power_quaters[i].strftime("%Y")
        if buying_power_quaters[i].month >= 1 and buying_power_quaters[i].month <= 3:
            str_quater = '01'
        if buying_power_quaters[i].month >= 4 and buying_power_quaters[i].month <= 6:
            str_quater = '02'
        if buying_power_quaters[i].month >= 7 and buying_power_quaters[i].month <= 9:
            str_quater = '03'
        if buying_power_quaters[i].month >= 10 and buying_power_quaters[i].month <= 12:
            str_quater = '04'

        str_date = str_year + str_quater

        url = 'http://houstat.hf.go.kr/research/openapi/SttsApiTblData.do?KEY=' + key + '&pIndex=1&psize=50&STATBL_ID=T186503126543136&DTACYCLE_CD=QY&WRTTIME_IDTFR_ID=' + str_date + '&type=json'
        
        response = requests.get(url)
        #pars = xmltodict.parse(response.text)
        #jsonDump = json.dumps(pars)        
        result = json.loads(response.text)
        data_list = result['SttsApiTblData'][1]['row']
        #print(result['SttsApiTblData'])
        #for k in range(len(data_list)):
        #    print(data_list[k]['WRTTIME_IDTFR_ID'], data_list[k]['ITM_NM'], data_list[k]['DTA_VAL'])

        df = pd.DataFrame(data_list)
        if i == 0:
            df.drop(['STATBL_ID', 'DTACYCLE_CD', 'WRTTIME_IDTFR_ID', 'ITM_DATANO', 'CLS_DATANO', 'CLS_NM', 'UI_NM'], axis=1, inplace=True)
            result_df = df
            result_df.columns = ['Location', "BP_" + str_date + "Q"]
        else:
            df.drop(['STATBL_ID', 'ITM_NM', 'DTACYCLE_CD', 'WRTTIME_IDTFR_ID', 'ITM_DATANO', 'CLS_DATANO', 'CLS_NM', 'UI_NM'], axis=1, inplace=True)
            df.columns = ["BP_" + str_date + "Q"]
            result_df = pd.concat((result_df, df), axis=1)
            
    for j in range(len(result_df)):
        result_df.loc[j, 'Location'] = location_name_change(result_df.iloc[j]['Location'])

    result_df['GENERATE'] = str(now)

    #print(result_df)
    print("Buying Power saved at " + str(now))
    result_df.to_json(path + "/BP.json", force_ascii=False, indent=4)
    #result_df.to_csv(path + "/BP.csv", encoding="CP949")

def save_PIR():
    global result_df
    print("Start to get PIR")

    for i in range(len(PIR_Month)):        
        str_date = PIR_Month[i].strftime("%Y%m")            
        url = 'http://houstat.hf.go.kr/research/openapi/SttsApiTblData.do?KEY=' + key + '&pIndex=1&pSize=50&STATBL_ID=T188183126881844&DTACYCLE_CD=MM&WRTTIME_IDTFR_ID=' + str_date + '&type=json'
        
        response = requests.get(url)        
        result = json.loads(response.text)
        data_list = result['SttsApiTblData'][1]['row']
        df = pd.DataFrame(data_list)

        if i == 0:
            df.drop(['STATBL_ID','DTACYCLE_CD', 'WRTTIME_IDTFR_ID', 'ITM_DATANO', 'CLS_DATANO', 'UI_NM'], axis=1, inplace=True)            
            result_df = df
            result_df.columns = ['PIR/LIR', 'Location', str_date]
        else:
            df.drop(['STATBL_ID', 'ITM_NM', 'DTACYCLE_CD', 'WRTTIME_IDTFR_ID', 'ITM_DATANO', 'CLS_DATANO', 'CLS_NM', 'UI_NM'], axis=1, inplace=True)
            df.columns = [str_date]
            result_df = pd.concat((result_df, df), axis=1, join='inner')
            
    result_df = result_df[result_df['PIR/LIR']=='PIR']
    result_df = result_df.reset_index(level=None, drop=True)    

    for j in range(len(result_df)):
        result_df.loc[j, 'Location'] = location_name_change(result_df.iloc[j]['Location'])

    result_df['GENERATE'] = str(now)
    
    print("PIR saved at " + str(now))
    result_df.to_csv(path + "/PIR.csv", encoding="CP949")
    result_df.to_json(path + "/PIR.json", force_ascii=False, indent=4)
    #result_df.to_csv(path + "/PIR.csv", encoding="CP949")

def location_name_change(loc):
    if loc == '전국':
        return "전국"
    if loc == '부산' or loc == '대구' or loc == '인천'  or loc == '광주'  or loc == '대전'  or loc == '울산'  or loc == '세종'  or loc == '서울' :
        return loc+'시'
    if loc == '경기' or loc == '강원' or loc == '제주':
        return loc + '도'
    if loc == '충북':
        return "충청북도"
    if loc == '충남':
        return "충청남도"
    if loc == '경북':
        return "경상북도"
    if loc == '경남':
        return "경상남도"
    if loc == '전북':
        return "전라북도"
    if loc == '전남':
        return "전라남도"

save_buying_power()
save_PIR()

########## 여기서부터는 시장현황 주단위 업데이트 ###############
def save_BOK_interest_info():
    print("Start to get BOK interest")
    #한국은행 기준금리 (%)
    url = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/200/722Y001/M/' + str_date_10years_ago_m + '/' + str_now_m + '/0101000'    
    response = requests.get(url)
    #pars = xmltodict.parse(response.text)
    #jsonDump = json.dumps(pars)
    result = json.loads(response.text)    
    standard_interest_7day = result['StatisticSearch']['row']    

    df = pd.DataFrame(standard_interest_7day)
    #df['GENERATE'] = str(now)
    df.drop(['STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df.rename(columns = {'DATA_VALUE':'BOK_Standard_Interest'}, inplace=True)
    df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + "01"
    #df.to_csv(path + "/BOK_standatd_interest.csv", encoding='cp949')
    return df
    #df.to_json(path + "/BOK_standatd_interest.json", force_ascii=False, indent=4)
    #print("BOK interest saved at " + str(now))

def save_BOK_TotalAsset_info():
    print("Start to get BOK Total Asset")
    #본원통화 (십억원)
    url = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/200/102Y004/M/' + str_date_10years_ago_m + '/' + str_now_m + '/ABA1'    
    response = requests.get(url)
    #pars = xmltodict.parse(response.text)
    #jsonDump = json.dumps(pars)
    result = json.loads(response.text)
    standard_interest_7day = result['StatisticSearch']['row']    

    df = pd.DataFrame(standard_interest_7day)
    #df['GENERATE'] = str(now)
    df.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df.rename(columns = {'DATA_VALUE':'BOK_Total_Asset'}, inplace=True)
    #df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + "01"
    #df.to_csv(path + "/BOK_total_Asset.csv", encoding='cp949')
    return df
    #df.to_json(path + "/BOK_standatd_interest.json", force_ascii=False, indent=4)
    #print("BOK interest saved at " + str(now))

def save_BOK_Eternal_Money_info():
    print("Start to get BOK Eternal_Money")
    #외환보유액 (천달러)
    url = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/500/732Y001/M/' + str_date_10years_ago_m + '/' + str_now_m + '/99'    
    response = requests.get(url)
    #pars = xmltodict.parse(response.text)
    #jsonDump = json.dumps(pars)
    result = json.loads(response.text)
    standard_interest_7day = result['StatisticSearch']['row']

    df = pd.DataFrame(standard_interest_7day)
    df.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    #df['GENERATE'] = str(now)
    df.rename(columns = {'DATA_VALUE':'BOK_External_Money'}, inplace=True)
    #df.drop(['STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME'], axis=1, inplace=True)
    #df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + "01"
    #df.to_csv(path + "/BOK_external_money.csv", encoding='cp949')
    return df
    #df.to_json(path + "/BOK_standatd_interest.json", force_ascii=False, indent=4)
    #print("BOK interest saved at " + str(now))

def save_BOK_oil_info():
    print("Start to get BOK Oil")

    #국제상품가격, 서부텍사스유 (달러/배럴, bbl)
    url_WTI = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/902Y003/M/' + str_date_10years_ago_m + '/' + str_now_m + '/010101'    

    #국제상품가격, 두바이유 (달러/배럴, bbl)
    url_Dubai = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/902Y003/M/' + str_date_10years_ago_m + '/' + str_now_m + '/010102'    

    #국제상품가격, 브렌트유 (달러/배럴, bbl)
    url_Brent = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/902Y003/M/' + str_date_10years_ago_m + '/' + str_now_m + '/010103'    

    response_WTI = requests.get(url_WTI)    
    result_WTI = json.loads(response_WTI.text)
    df_result_WTI = result_WTI['StatisticSearch']['row']
    df_WTI = pd.DataFrame(df_result_WTI)
    df_WTI.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_WTI.rename(columns = {'DATA_VALUE':'BOK_Oil_WTI'}, inplace=True)

    response_Dubai = requests.get(url_Dubai)    
    result_Dubai = json.loads(response_Dubai.text)
    df_result_Dubai = result_Dubai['StatisticSearch']['row']
    df_Dubai = pd.DataFrame(df_result_Dubai)
    df_Dubai.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)    
    df_Dubai.rename(columns = {'DATA_VALUE':'BOK_Oil_Dubai'}, inplace=True)

    response_Brent = requests.get(url_Brent)
    result_Brent = json.loads(response_Brent.text)
    df_result_Brent = result_Brent['StatisticSearch']['row']
    df_Brent = pd.DataFrame(df_result_Brent)
    df_Brent.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_Brent.rename(columns = {'DATA_VALUE':'BOK_Oil_Brent'}, inplace=True) 

    df = pd.concat([df_WTI, df_Dubai, df_Brent], axis=1)

    #df['GENERATE'] = str(now)    
    #df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + "01"
    #df.to_csv(path + "/BOK_Oil.csv", encoding='cp949')
    return df
    #df.to_json(path + "/BOK_standatd_interest.json", force_ascii=False, indent=4)
    #print("BOK interest saved at " + str(now))

def save_BOK_metal_info():
    print("Start to get BOK Metal")

    #국제상품가격, 금 (달러/온스, oz)
    url_GOLD = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/902Y003/M/' + str_date_10years_ago_m + '/' + str_now_m + '/040101'

    #국제상품가격, 니켈 (달러/미터톤, Mt)
    url_NK = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/902Y003/M/' + str_date_10years_ago_m + '/' + str_now_m + '/040204'

    #국제상품가격, 아연 (달러/미터톤, Mt)
    url_ZN = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/902Y003/M/' + str_date_10years_ago_m + '/' + str_now_m + '/040201'

    response_GOLD = requests.get(url_GOLD)    
    result_GOLD = json.loads(response_GOLD.text)
    df_result_GOLD = result_GOLD['StatisticSearch']['row']
    df_GOLD = pd.DataFrame(df_result_GOLD)
    df_GOLD.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_GOLD.rename(columns = {'DATA_VALUE':'BOK_Metal_Gold'}, inplace=True)

    response_NK = requests.get(url_NK)    
    result_NK = json.loads(response_NK.text)
    df_result_NK = result_NK['StatisticSearch']['row']
    df_NK = pd.DataFrame(df_result_NK)
    df_NK.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)    
    df_NK.rename(columns = {'DATA_VALUE':'BOK_Metal_Nikkel'}, inplace=True)

    response_ZN = requests.get(url_ZN)
    result_ZN = json.loads(response_ZN.text)
    df_result_ZN = result_ZN['StatisticSearch']['row']
    df_ZN = pd.DataFrame(df_result_ZN)
    df_ZN.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_ZN.rename(columns = {'DATA_VALUE':'BOK_Metal_Zinc'}, inplace=True)

    df = pd.concat([df_GOLD, df_NK, df_ZN], axis=1)

    #df['GENERATE'] = str(now)    
    #df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + "01"
    #df.to_csv(path + "/BOK_Metal.csv", encoding='cp949')
    return df
    #df.to_json(path + "/BOK_standatd_interest.json", force_ascii=False, indent=4)
    #print("BOK interest saved at " + str(now))

def save_BOK_BOND_info():
    print("Start to get BOK BOND")

    #국채발행액 (십억원)
    url_BOND = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/191Y001/M/' + str_date_10years_ago_m + '/' + str_now_m + '/0200000/3'
    #국채잔액 (십억원)
    url_BOND_REMAIN = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/191Y001/M/' + str_date_10years_ago_m + '/' + str_now_m + '/0200000/4'

    response_BOND = requests.get(url_BOND)    
    result_BOND = json.loads(response_BOND.text)
    df_result_BOND = result_BOND['StatisticSearch']['row']
    df_BOND = pd.DataFrame(df_result_BOND)
    df_BOND.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_BOND.rename(columns = {'DATA_VALUE':'BOK_Bond_Publish'}, inplace=True)

    response_BOND_REMAIN = requests.get(url_BOND_REMAIN)
    result_BOND_REMAIN = json.loads(response_BOND_REMAIN.text)
    df_result_BOND_REMAIN = result_BOND_REMAIN['StatisticSearch']['row']
    df_BOND_REMAIN = pd.DataFrame(df_result_BOND_REMAIN)
    df_BOND_REMAIN.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_BOND_REMAIN.rename(columns = {'DATA_VALUE':'BOK_Bond_Remain'}, inplace=True)

    df = pd.concat([df_BOND, df_BOND_REMAIN], axis=1)

    #df['GENERATE'] = str(now)    
    #df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + "01"
    #df.to_csv(path + "/BOK_BOND.csv", encoding='cp949')
    return df
    #df.to_json(path + "/BOK_standatd_interest.json", force_ascii=False, indent=4)
    #print("BOK interest saved at " + str(now))

def save_BOK_Mind_info():
    print("Start to get BOK MIND")
    #소비자심리지수
    url_MIND_Consumer = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/511Y002/M/' + str_date_10years_ago_m + '/' + str_now_m + '/FME/99988'

    #경제심리지수
    url_MIND_Economy = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/513Y001/M/' + str_date_10years_ago_m + '/' + str_now_m + '/E1000'

    response_MIND_Consumer = requests.get(url_MIND_Consumer)    
    result_MIND_Consumer = json.loads(response_MIND_Consumer.text)
    df_result_MIND_Consumer = result_MIND_Consumer['StatisticSearch']['row']
    df_MIND_Consumer = pd.DataFrame(df_result_MIND_Consumer)
    df_MIND_Consumer.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_MIND_Consumer.rename(columns = {'DATA_VALUE':'BOK_Mind_Consumer'}, inplace=True)

    response_MIND_Economy = requests.get(url_MIND_Economy)
    result_MIND_Economy = json.loads(response_MIND_Economy.text)
    df_result_MIND_Economy = result_MIND_Economy['StatisticSearch']['row']
    df_MIND_Economy = pd.DataFrame(df_result_MIND_Economy)
    df_MIND_Economy.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_MIND_Economy.rename(columns = {'DATA_VALUE':'BOK_Mind_Economy'}, inplace=True)

    df = pd.concat([df_MIND_Consumer, df_MIND_Economy], axis=1)

    #df['GENERATE'] = str(now)    
    #df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + "01"
    #df.to_csv(path + "/BOK_Mind.csv", encoding='cp949')
    return df
    #df.to_json(path + "/BOK_standatd_interest.json", force_ascii=False, indent=4)
    #print("BOK interest saved at " + str(now))

def save_BOK_Trade_info():
    print("Start to get BOK Trade")
    #경상수지(백만달러)
    url_TRADE = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/301Y013/M/' + str_date_10years_ago_m + '/' + str_now_m + '/000000'

    #수출금액(천달러)
    url_TRADE_OUT = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/901Y011/M/' + str_date_10years_ago_m + '/' + str_now_m + '/FIEE'

    #수입금액(천달러)
    url_TRADE_IN = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/901Y012/M/' + str_date_10years_ago_m + '/' + str_now_m + '/FIEF'

    response_TRADE = requests.get(url_TRADE)    
    result_TRADE = json.loads(response_TRADE.text)
    df_result_TRADE = result_TRADE['StatisticSearch']['row']
    df_TRADE = pd.DataFrame(df_result_TRADE)
    df_TRADE.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_TRADE.rename(columns = {'DATA_VALUE':'BOK_Trade_Profit'}, inplace=True)

    response_TRADE_OUT = requests.get(url_TRADE_OUT)
    result_TRADE_OUT = json.loads(response_TRADE_OUT.text)
    df_result_TRADE_OUT = result_TRADE_OUT['StatisticSearch']['row']
    df_TRADE_OUT = pd.DataFrame(df_result_TRADE_OUT)
    df_TRADE_OUT.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_TRADE_OUT.rename(columns = {'DATA_VALUE':'BOK_Trade_Out'}, inplace=True)

    response_TRADE_IN = requests.get(url_TRADE_IN)
    result_TRADE_IN = json.loads(response_TRADE_IN.text)
    df_result_TRADE_IN = result_TRADE_IN['StatisticSearch']['row']
    df_TRADE_IN = pd.DataFrame(df_result_TRADE_IN)
    df_TRADE_IN.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_TRADE_IN.rename(columns = {'DATA_VALUE':'BOK_Trade_In'}, inplace=True)    

    df = pd.concat([df_TRADE, df_TRADE_OUT, df_TRADE_IN], axis=1)

    #df['GENERATE'] = str(now)    
    #df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + "01"
    #df.to_csv(path + "/BOK_trade.csv", encoding='cp949')
    return df
    #df.to_json(path + "/BOK_standatd_interest.json", force_ascii=False, indent=4)
    #print("BOK interest saved at " + str(now))

def save_BOK_Housing_info():
    print("Start to get BOK Housing")
    #주택매매가격지수, 전국 종합
    url_HOUSING_trade_all = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/901Y093/M/' + str_date_10years_ago_m + '/' + str_now_m + '/H69A/R70A'

    #주택매매가격지수, 전국 아파트
    url_HOUSING_trade_apt = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/901Y093/M/' + str_date_10years_ago_m + '/' + str_now_m + '/H69B/R70A'

    #주택전세가격지수, 전국 종합
    url_HOUSING_rent_all = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/901Y094/M/' + str_date_10years_ago_m + '/' + str_now_m + '/H69A/R70A'

    #주택전세가격지수, 전국 아파트
    url_HOUSING_rent_apt = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/901Y094/M/' + str_date_10years_ago_m + '/' + str_now_m + '/H69B/R70A'    

    response_HOUSING_trade_all = requests.get(url_HOUSING_trade_all)    
    result_HOUSING_trade_all = json.loads(response_HOUSING_trade_all.text)
    df_result_HOUSING_trade_all = result_HOUSING_trade_all['StatisticSearch']['row']
    df_HOUSING_trade_all = pd.DataFrame(df_result_HOUSING_trade_all)
    df_HOUSING_trade_all.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_HOUSING_trade_all.rename(columns = {'DATA_VALUE':'BOK_Housing_Trade_All'}, inplace=True)

    response_HOUSING_trade_apt = requests.get(url_HOUSING_trade_apt)
    result_HOUSING_trade_apt = json.loads(response_HOUSING_trade_apt.text)
    df_result_HOUSING_trade_apt = result_HOUSING_trade_apt['StatisticSearch']['row']
    df_HOUSING_trade_apt = pd.DataFrame(df_result_HOUSING_trade_apt)
    df_HOUSING_trade_apt.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_HOUSING_trade_apt.rename(columns = {'DATA_VALUE':'BOK_Housing_Trade_Apt'}, inplace=True)

    response_HOUSING_rent_all = requests.get(url_HOUSING_rent_all)
    result_HOUSING_rent_all = json.loads(response_HOUSING_rent_all.text)
    df_result_HOUSING_rent_all = result_HOUSING_rent_all['StatisticSearch']['row']
    df_HOUSING_rent_all = pd.DataFrame(df_result_HOUSING_rent_all)
    df_HOUSING_rent_all.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_HOUSING_rent_all.rename(columns = {'DATA_VALUE':'BOK_Housing_Rent_All'}, inplace=True)    

    response_HOUSING_rent_apt = requests.get(url_HOUSING_rent_apt)
    result_HOUSING_rent_apt = json.loads(response_HOUSING_rent_apt.text)
    df_result_HOUSING_rent_apt = result_HOUSING_rent_apt['StatisticSearch']['row']
    df_HOUSING_rent_apt = pd.DataFrame(df_result_HOUSING_rent_apt)
    df_HOUSING_rent_apt.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_HOUSING_rent_apt.rename(columns = {'DATA_VALUE':'BOK_Housing_Rent_Apt'}, inplace=True)  

    df = pd.concat([df_HOUSING_trade_all, df_HOUSING_trade_apt, df_HOUSING_rent_all, df_HOUSING_rent_apt], axis=1)

    #df['GENERATE'] = str(now)    
    #df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-" + "01"
    #df.to_csv(path + "/BOK_housing.csv", encoding='cp949')
    return df
    #df.to_json(path + "/BOK_standatd_interest.json", force_ascii=False, indent=4)
    #print("BOK interest saved at " + str(now))

def save_FED_Oil_info():
    print("Start to get FED Oil")
    fred = Fred(api_key=fred_key)

    data_result_WTI = pd.DataFrame()    
    data_WTI = fred.get_series('POILWTIUSDM')
    data_WTI = data_WTI[data_WTI.index > date_10years_ago]
    data_result_WTI['DATE'] = data_WTI.index.strftime('%Y-%m-%d').tolist()
    data_result_WTI['FRED_WTI'] = data_WTI.values.tolist()    

    data_result_Brent = pd.DataFrame() 
    data_Brent = fred.get_series('POILBREUSDM')
    data_Brent = data_Brent[data_Brent.index > date_10years_ago]    
    data_result_Brent['DATE'] = data_Brent.index.strftime('%Y-%m-%d').tolist()
    data_result_Brent['FRED_Brent'] = data_Brent.values.tolist()
    data_result_Brent.drop(['DATE'], axis=1, inplace=True)    

    data_result_Dubai = pd.DataFrame() 
    data_Dubai = fred.get_series('POILDUBUSDM')
    data_Dubai = data_Dubai[data_Dubai.index > date_10years_ago]    
    data_result_Dubai['DATE'] = data_Dubai.index.strftime('%Y-%m-%d').tolist()
    data_result_Dubai['FRED_Dubai'] = data_Dubai.values.tolist()
    data_result_Dubai.drop(['DATE'], axis=1, inplace=True)

    df = pd.concat([data_result_WTI, data_result_Brent, data_result_Dubai], axis=1)
    #df = df.astype({'DATE', 'str'})
    return df
    #df['GENERATE'] = str(now)
    #df.to_csv(path + "/FED_Oil_Price.csv", encoding='cp949')

def save_BOK_GDP_GNI_info():
    print("Start to get BOK GDP/GNI")

    #국내총생산 (십억원)
    url_GDP = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/200Y001/A/' + str_date_10years_ago_y + '/' + str_now_y + '/10101'

    #1인당 국민총소득 (만원)
    url_GNI = 'https://ecos.bok.or.kr/api/StatisticSearch/' + bok_key + '/json/kr/1/5000/200Y001/A/' + str_date_10years_ago_y + '/' + str_now_y + '/10106'    

    response_GDP = requests.get(url_GDP)    
    result_GDP = json.loads(response_GDP.text)
    df_result_GDP = result_GDP['StatisticSearch']['row']
    df_GDP = pd.DataFrame(df_result_GDP)
    df_GDP.drop(['STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)
    df_GDP.rename(columns = {'DATA_VALUE':'DATA_VALUE_GDP'}, inplace=True)

    response_GNI = requests.get(url_GNI)    
    result_GNI = json.loads(response_GNI.text)
    df_result_GNI = result_GNI['StatisticSearch']['row']
    df_GNI = pd.DataFrame(df_result_GNI)
    df_GNI.drop(['TIME', 'STAT_CODE', 'STAT_NAME', 'ITEM_CODE1', 'ITEM_NAME1', 'ITEM_CODE2', 'ITEM_NAME2', 'ITEM_CODE3', 'ITEM_NAME3', 'ITEM_CODE4', 'ITEM_NAME4', 'UNIT_NAME', 'WGT'], axis=1, inplace=True)    
    df_GNI.rename(columns = {'DATA_VALUE':'DATA_VALUE_GNI'}, inplace=True)

    df = pd.concat([df_GDP, df_GNI], axis=1)

    df['GENERATE'] = str(now)
    df['TIME'] = df['TIME'].str[0:4] + "-" + now.strftime("%m") + "-01"

    return df

    #df.to_json(path + "/BOK_standatd_interest.json", force_ascii=False, indent=4)
    #print("BOK interest saved at " + str(now))    

def market_monthly_info():
    df_BOK_Interest = save_BOK_interest_info()    
    df_BOK_TotalAsset = save_BOK_TotalAsset_info()    
    df_BOK_ExternalMoney = save_BOK_Eternal_Money_info()    
    df_BOK_Oil = save_BOK_oil_info()
    df_BOK_Metal = save_BOK_metal_info()    
    df_BOK_Bond = save_BOK_BOND_info()
    df_BOK_Mind = save_BOK_Mind_info()
    df_BOK_Trade = save_BOK_Trade_info()
    df_BOK_Housing = save_BOK_Housing_info()

    df_BOK_GDP_GNI = save_BOK_GDP_GNI_info()
    df_BOK_GDP_GNI.set_index('TIME', inplace = True)

    df_FRED_Oil = save_FED_Oil_info()
    df_FRED_Oil.set_index('DATE', inplace = True)

    temp_df = pd.concat([df_BOK_Interest, df_BOK_TotalAsset, df_BOK_ExternalMoney, df_BOK_Oil, df_BOK_Metal, df_BOK_Bond, df_BOK_Mind, df_BOK_Trade, df_BOK_Housing], axis=1)
    temp_df.set_index('TIME', inplace = True)

    df = pd.concat([temp_df, df_BOK_GDP_GNI, df_FRED_Oil], axis=1)
    df.reset_index(inplace=True)    
    df.rename(columns = {'index':'TIME'}, inplace=True)

    df = df.sort_values('TIME')
    df['GENERATE'] = str(now)
    df = df.reset_index(drop=True)   
    #df.to_csv(path + "/market_monthly_info.csv", encoding='cp949')
    #df.to_json(path + "/market_monthly_info.json", force_ascii=False, indent=4)

    find_path = "" 
    for i in range(len(temp_path)-1):
        find_path += temp_path[i] + "/"

    df.to_json(find_path + "moneyflow/market_monthly_info.json", force_ascii=False, indent=4)    

market_monthly_info()
