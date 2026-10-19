# 네이버 검색 API 예제 - 블로그 검색
import os
import sys
import json
import urllib.request
from difflib import SequenceMatcher
import requests
import datetime
from dateutil.relativedelta import *
import time
import pandas as pd
from urllib import parse
from fredapi import Fred
from pykrx import stock
from pykrx import bond
from bs4 import BeautifulSoup
import yfinance as yf
import pyupbit as ubt

client_id = "bK1kR34Gm1z0E39bibv1"
client_secret = "NiHhMup_9q"

path = os.path.dirname( os.path.abspath(__file__) )
temp_path = path.split('\\')

fred_key = "a7d5a17c8b520a7802d3c905fca10131"
bok_key = "570IL3KK1XG2THUF38RC"

#기준시점 선정
utcnow = datetime.datetime.now(datetime.timezone.utc)
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

def check_similarity(original, compare):
    return SequenceMatcher(None, original, compare).ratio()

def generateNews(type, searchText):
    encText = urllib.parse.quote(searchText)

    if(type == "News"):
        url = "https://openapi.naver.com/v1/search/news.json?query=" + encText + "&start=1&display=100&sort=date" # JSON 결과
        #url = "https://openapi.naver.com/v1/search/news.json?query=" + encText + "&start=1&display=30&sort=sim" # JSON 결과
    if(type == "Blog"):
        #url = "https://openapi.naver.com/v1/search/blog.json?query=" + encText + "&start=1&display=30&sort=date" # JSON 결과
        url = "https://openapi.naver.com/v1/search/blog.json?query=" + encText + "&start=1&display=100&sort=sim" # JSON 결과
    
    # url = "https://openapi.naver.com/v1/search/blog.xml?query=" + encText # XML 결과

    request = urllib.request.Request(url)
    request.add_header("X-Naver-Client-Id",client_id)
    request.add_header("X-Naver-Client-Secret",client_secret)
    response = urllib.request.urlopen(request)
    rescode = response.getcode()

    cleared_news = []

    if(rescode==200):
        response_body = response.read()
        #print(response_body.decode('utf-8'))
        json_obj = json.loads(response_body.decode('utf-8'))

        content_length = len(json_obj['items'])
        for i in range(content_length):
            link_name = str(json_obj['items'][i]['link'])
            if 'news.naver' in link_name:
                cleared_title = str(json_obj['items'][i]['title'])
                cleared_title = cleared_title.replace("&apos;", "")
                cleared_title = cleared_title.replace("&quot;", "")
                cleared_title = cleared_title.replace("&lt;", "")
                cleared_title = cleared_title.replace("&gt;", "")
                cleared_title = cleared_title.replace("<b>", "")
                cleared_title = cleared_title.replace("</b>", "")
                #print(cleared_title)
                if i == 0:
                    cleared_news.append(json_obj['items'][i])

                else:
                    compare_result = []
                    for k in range(i):
                        compare_title = str(json_obj['items'][k]['title'])
                        compare_title = compare_title.replace("&apos;", "")
                        compare_title = compare_title.replace("&quot;", "")
                        compare_title = compare_title.replace("&lt;", "")
                        compare_title = compare_title.replace("&gt;", "")
                        compare_title = compare_title.replace("<b>", "")
                        compare_title = compare_title.replace("</b>", "")

                        compare_ratio = check_similarity(cleared_title, compare_title)
                        compare_result.append(compare_ratio)

                    print(max(compare_result))

                    if max(compare_result) < 0.45:
                        print(json_obj['items'][i]['title'])
                        cleared_news.append(json_obj['items'][i])

                    #print(cleared_news)

                    if len(cleared_news) == 30:
                        json_obj['items'] = cleared_news
                        break;
            else:
                None
        
        #print(json_obj['items'])

        if(type == "News"):
            with open(path + '/news.json', 'w', encoding='utf-8') as f:
                json.dump(json_obj, f, ensure_ascii=False, indent=4)

        if(type == "Blog"):
            with open(path + '/blogs.json', 'w', encoding='utf-8') as f:
                json.dump(json_obj, f, ensure_ascii=False, indent=4)

    else:
        print("Error Code:" + rescode)
    

generateNews("News", "부동산, 시장")
generateNews("Blog", "부동산, 아파트, 아파트랭크")



########## 여기서부터는 시장현황 시간단위 업데이트 ###############
def save_RealTime_currency_info():
    currency_url = 'https://quotation-api-cdn.dunamu.com/v1/forex/recent?codes=FRX.KRWUSD,FRX.KRWJPY,FRX.KRWEUR'
    response = requests.get(currency_url)
    result = json.loads(response.text)

    currency_USD = result[0]['basePrice']
    currency_JPY = result[1]['basePrice']
    currency_EUR = result[2]['basePrice']

    return currency_USD, currency_JPY, currency_EUR

def save_RealTime_KOR_Stock_info(stock):
    stock_url = 'https://polling.finance.naver.com/api/realtime?query=SERVICE_INDEX:KOSPI,KOSDAQ,KPI200'
    response = requests.get(stock_url)
    result = json.loads(response.text)    
    if stock == "KOSPI":
        KOR_stock_num = (result['result']['areas'][0]['datas'][0]['nv']) / 100
        KOR_stock_updown = (result['result']['areas'][0]['datas'][0]['cv']) / 100
        KOR_stock_updown_percent = (result['result']['areas'][0]['datas'][0]['cr'])
    if stock == "KOSDAQ":
        KOR_stock_num = (result['result']['areas'][0]['datas'][1]['nv']) / 100
        KOR_stock_updown = (result['result']['areas'][0]['datas'][1]['cv']) / 100
        KOR_stock_updown_percent = (result['result']['areas'][0]['datas'][1]['cr'])
    if stock == "KOSPI200":
        KOR_stock_num = (result['result']['areas'][0]['datas'][2]['nv']) / 100
        KOR_stock_updown = (result['result']['areas'][0]['datas'][2]['cv']) / 100
        KOR_stock_updown_percent = (result['result']['areas'][0]['datas'][2]['cr'])                

    return KOR_stock_num, KOR_stock_updown, KOR_stock_updown_percent, stock

def save_RealTime_KOR_Currency_info(symbol):
    if symbol == "USDKRW":
        code = 'FX_USDKRW'
    elif symbol == "JPYKRW":
        code = 'FX_JPYKRW'
    elif symbol == "EURKRW":
        code = 'FX_EURKRW'
    elif symbol == "CNYKRW":
        code = 'FX_CNYKRW'        
    else:
        code = symbol

    url = f'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=exchange&reutersCode={code}'
    try:
        response = requests.get(url)
        result = response.json()
        if result.get('isSuccess') == True:
            num = float(result['result']['closePrice'].replace(',', ''))
            updown = float(result['result']['fluctuations'].replace(',', ''))
            updown_percent = float(result['result']['fluctuationsRatio'].replace(',', ''))
            if result['result']['fluctuationsType']['name'] == 'FALLING':
                updown = -updown
                updown_percent = -updown_percent
        else:
            num, updown, updown_percent = 0.0, 0.0, 0.0
    except:
        num, updown, updown_percent = 0.0, 0.0, 0.0

    return num, updown, updown_percent, symbol

def save_RealTime_KOR_Oil_info(symbol):
    if symbol == "Dubai":
        url = 'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=energy&reutersCode=DCBc1'
        try:
            response = requests.get(url)
            result = response.json()
            if result.get('isSuccess') == True:
                num = float(result['result']['closePrice'].replace(',', ''))
                updown = float(result['result']['fluctuations'].replace(',', ''))
                updown_percent = float(result['result']['fluctuationsRatio'].replace(',', ''))
                if result['result']['fluctuationsType']['name'] == 'FALLING':
                    updown = -updown
                    updown_percent = -updown_percent
            else:
                num, updown, updown_percent = 0.0, 0.0, 0.0
            return round(num, 2), round(updown, 2), round(updown_percent, 2), symbol
        except:
            return 0.0, 0.0, 0.0, symbol

    if symbol == "WTI" or symbol == "YF_WTI":
        yf_symbol = 'CL=F'
    elif symbol == "Brent" or symbol == "YF_Brent":
        yf_symbol = 'BZ=F'
    else:
        return 0.0, 0.0, 0.0, symbol

    ticker = yf.Ticker(yf_symbol)
    info = ticker.info
    num = info.get('regularMarketPrice', 0.0)
    updown = info.get('regularMarketChange', 0.0)
    updown_percent = info.get('regularMarketChangePercent', 0.0)
    
    return round(num, 2), round(updown, 2), round(updown_percent, 2), symbol

def save_RealTime_US_Stock_info(symbol):
    if symbol == "DOW":
        yf_symbol = '^DJI'
    elif symbol == "NAS":
        yf_symbol = '^IXIC'
    elif symbol == "SNP":
        yf_symbol = '^GSPC'
    else:
        yf_symbol = symbol

    ticker = yf.Ticker(yf_symbol)
    info = ticker.info
    num = info.get('regularMarketPrice', 0.0)
    updown = info.get('regularMarketChange', 0.0)
    updown_percent = info.get('regularMarketChangePercent', 0.0)

    return round(num, 2), round(updown, 2), round(updown_percent, 2), symbol
   
"""   
def save_YF_realtime_info(symbol):
    symbols = yf.Ticker(symbol)    
    relatime = symbols.info
    relatime_current = relatime['ask']
    relatime_prev = relatime['previousClose']
    realtime_gap = relatime_prev - relatime_current
    realtime_percentage = (1-relatime_current/relatime_prev) * 100

    symbol_name = ""

    if symbol == "GC=F":
        symbol_name = "YF_Gold"
    if symbol == "SI=F":
        symbol_name = "YF_Silver"
    if symbol == "HG=F":
        symbol_name = "YF_Copper"
    if symbol == "CL=F":
        symbol_name = "YF_WTI"
    if symbol == "BZ=F":
        symbol_name = "YF_Brent"
    if symbol == "DX-Y.NYB":
        symbol_name = "YF_Dollar_Index"

    return relatime_current, round(realtime_gap, 2), round(realtime_percentage, 2), symbol_name
"""

def save_YF_realtime_info(symbol):
    if symbol == "GC=F":
        url = 'https://finance.yahoo.com/quote/GC=F'
        symbol_name = "YF_Gold"

    if symbol == "SI=F":
        url = 'https://finance.yahoo.com/quote/SI=F'
        symbol_name = "YF_Silver"

    if symbol == "HG=F":
        url = 'https://finance.yahoo.com/quote/HG=F'
        symbol_name = "YF_Copper"

    if symbol == "CL=F":
        url = 'https://finance.yahoo.com/quote/CL=F'
        symbol_name = "YF_WTI"

    if symbol == "BZ=F":
        url = 'https://finance.yahoo.com/quote/BZ=F'
        symbol_name = "YF_Brent"

    if symbol == "DX-Y.NYB":
        url = 'https://finance.yahoo.com/quote/DX-Y.NYB'
        symbol_name = "YF_Dollar_Index"        

    response = requests.get(url)
    if response.status_code == 200:
        html = response.text
        soup = BeautifulSoup(html, 'html.parser')
        val_tag = soup.find('div', {'id': 'quote-header-info'})
        val = val_tag.find('fin-streamer', {'data-field': 'regularMarketPrice'})        
        diff = val_tag.find('fin-streamer', {'data-field': 'regularMarketChange'})
        rate = val_tag.find('fin-streamer', {'data-field': 'regularMarketChangePercent'})
        txt = rate.string
        txt = txt.replace("(", " ")
        txt = txt.replace(")", "")        
        txt = txt.replace("%", "")

        val_txt = val.string
        val_txt = val_txt.replace(",", "")

        current_val = float(val_txt)
        current_diff = float(diff.string)
        current_rate = float(txt)

    return current_val, current_diff, current_rate, symbol_name 

def save_crypto_currency_info(symbol):
    # 1. Try Upbit API directly with a short timeout (2s)
    try:
        url = f"https://api.upbit.com/v1/ticker?markets={symbol}"
        res = requests.get(url, timeout=2)
        if res.status_code == 200:
            data = res.json()
            if data and len(data) > 0:
                current_price = float(data[0]['trade_price'])
                open_price = float(data[0]['opening_price'])
                price_gap = current_price - open_price
                price_percentage = (1 - open_price / current_price) * 100 if current_price else 0.0
                return round(current_price, 2), float(round(price_gap, 2)), float(round(price_percentage, 2)), symbol
    except Exception:
        pass

    # 2. Try Binance API (fallback for overseas / cloud environments like GitHub Actions where Upbit is blocked)
    try:
        coin = symbol.split('-')[1] if '-' in symbol else symbol
        pair = f"{coin}USDT"
        for b_url in [f"https://api.binance.com/api/v3/ticker/24hr?symbol={pair}", f"https://data-api.binance.vision/api/v3/ticker/24hr?symbol={pair}"]:
            try:
                res = requests.get(b_url, timeout=3)
                if res.status_code == 200:
                    d = res.json()
                    current_price = float(d['lastPrice'])
                    open_price = float(d['openPrice'])
                    price_gap = current_price - open_price
                    price_percentage = (1 - open_price / current_price) * 100 if current_price else 0.0
                    return round(current_price, 2), float(round(price_gap, 2)), float(round(price_percentage, 2)), symbol
            except Exception:
                continue
    except Exception:
        pass

    # 3. Try Yahoo Finance fallback
    try:
        coin = symbol.split('-')[1] if '-' in symbol else symbol
        yf_symbol = f"{coin}-USD"
        ticker = yf.Ticker(yf_symbol)
        current_price = float(ticker.fast_info['last_price'])
        prev_close = float(ticker.fast_info['previous_close'])
        price_gap = current_price - prev_close
        price_percentage = (1 - prev_close / current_price) * 100 if current_price else 0.0
        return round(current_price, 2), float(round(price_gap, 2)), float(round(price_percentage, 2)), symbol
    except Exception:
        pass

    # 4. Fallback to existing value from moneyflow/market_hourly_info.json if available
    try:
        repo_root = os.path.abspath(os.path.join(path, ".."))
        cached_file = os.path.join(repo_root, "moneyflow", "market_hourly_info.json")
        if os.path.exists(cached_file):
            with open(cached_file, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)
                if symbol in cached_data:
                    return float(cached_data[symbol].get('value', 0.0)), float(cached_data[symbol].get('diff', 0.0)), float(cached_data[symbol].get('rate', 0.0)), symbol
    except Exception:
        pass

    return 0.0, 0.0, 0.0, symbol

def save_YF_realtime_Bond(symbol):
    if symbol == "^FVX":
        url = 'https://finance.yahoo.com/quote/^FVX'
        symbol_name = "YF_US_Bond_5y"

    if symbol == "^TNX":
        url = 'https://finance.yahoo.com/quote/^TNX'
        symbol_name = "YF_US_Bond_10y"

    if symbol == "^TYX":
        url = 'https://finance.yahoo.com/quote/^TYX'
        symbol_name = "YF_US_Bond_30y"

    response = requests.get(url)
    if response.status_code == 200:
        html = response.text
        soup = BeautifulSoup(html, 'html.parser')
        val_tag = soup.find('div', {'id': 'quote-header-info'})
        val = val_tag.find('fin-streamer', {'data-field': 'regularMarketPrice'})        
        diff = val_tag.find('fin-streamer', {'data-field': 'regularMarketChange'})
        rate = val_tag.find('fin-streamer', {'data-field': 'regularMarketChangePercent'})
        txt = rate.string
        txt = txt.replace("(", " ")
        txt = txt.replace(")", "")        
        txt = txt.replace("%", "")

        current_val = float(val.string)
        current_diff = float(diff.string)
        current_rate = float(txt)

    return current_val, current_diff, current_rate, symbol_name

def save_RealTime_Naver_Bond_info(symbol):
    if symbol == "KR3YT_Bond":
        url = 'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=bond&reutersCode=KR3YT%3DRR'    

    if symbol == "KR5YT_Bond":
        url = 'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=bond&reutersCode=KR5YT%3DRR'

    if symbol == "KR10YT_Bond":
        url = 'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=bond&reutersCode=KR10YT%3DRR'

    if symbol == "KR30YT_Bond":
        url = 'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=bond&reutersCode=KR30YT%3DRR'

    if symbol == "US3YT_Bond":
        url = 'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=bond&reutersCode=US3YT%3DRR'  

    if symbol == "US5YT_Bond":
        url = 'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=bond&reutersCode=US5YT%3DRR'

    if symbol == "US10YT_Bond":
        url = 'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=bond&reutersCode=US10YT%3DRR'

    if symbol == "US30YT_Bond":
        url = 'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=bond&reutersCode=US30YT%3DRR'

    if symbol == "Dollar_Index":
        url = 'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=exchange&reutersCode=.DXY'        

    response = requests.get(url)
    result = json.loads(response.text)
    val = ""
    diff = ""
    rate =""

    if result['isSuccess'] == True:
        val = result['result']['closePrice']
        diff = result['result']['fluctuations']
        rate = result['result']['fluctuationsRatio']
    
    return val, diff, rate, symbol

def save_RealTime_Naver_Metal_info(symbol):
    if symbol == "YF_Gold":
        url = 'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=metals&reutersCode=GCcv1'    

    if symbol == "YF_Copper":
        url = 'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=metals&reutersCode=HGcv1'

    if symbol == "YF_Silver":
        url = 'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=metals&reutersCode=SIcv1'

    response = requests.get(url)
    result = json.loads(response.text)
    val = ""
    diff = ""
    rate =""

    if result['isSuccess'] == True:
        val = result['result']['closePrice']
        diff = result['result']['fluctuations']
        rate = result['result']['fluctuationsRatio']
    
    return val, diff, rate, symbol

def market_hourly_info():
    df_list = []

    #RealTime_Currency = save_RealTime_currency_info()
    #df_list.append(RealTime_Currency)
    #print("하나은행 환율:", RealTime_Currency)

    RealTime_KOR_Stock_KOSPI = save_RealTime_KOR_Stock_info("KOSPI")
    df_list.append(RealTime_KOR_Stock_KOSPI)
    print("네이버 주식(코스피):", RealTime_KOR_Stock_KOSPI)

    RealTime_KOR_Stock_KOSDAQ = save_RealTime_KOR_Stock_info("KOSDAQ")
    df_list.append(RealTime_KOR_Stock_KOSDAQ)
    print("네이버 주식(코스닥):", RealTime_KOR_Stock_KOSDAQ)

    RealTime_KOR_Stock_KOSPI200 = save_RealTime_KOR_Stock_info("KOSPI200")
    df_list.append(RealTime_KOR_Stock_KOSPI200)
    print("네이버 주식(코스피200):", RealTime_KOR_Stock_KOSPI200)    

    RealTime_US_Stock_DOW = save_RealTime_US_Stock_info("DOW")
    df_list.append(RealTime_US_Stock_DOW)
    print("네이버 크롤링 주식(다우):", RealTime_US_Stock_DOW)

    RealTime_US_Stock_NAS = save_RealTime_US_Stock_info("NAS")
    df_list.append(RealTime_US_Stock_NAS)
    print("네이버 크롤링 주식(나스닥):", RealTime_US_Stock_NAS)

    RealTime_US_Stock_SNP = save_RealTime_US_Stock_info("SNP")
    df_list.append(RealTime_US_Stock_SNP)
    print("네이버 주식(SNP500):", RealTime_US_Stock_SNP)

    RealTime_KOR_Currency_USDKRW = save_RealTime_KOR_Currency_info("USDKRW")
    df_list.append(RealTime_KOR_Currency_USDKRW)
    print("네이버 크롤링 환율(달러):", RealTime_KOR_Currency_USDKRW)

    RealTime_KOR_Currency_JPYKRW = save_RealTime_KOR_Currency_info("JPYKRW")
    df_list.append(RealTime_KOR_Currency_JPYKRW)
    print("네이버 크롤링 환율(엔):", RealTime_KOR_Currency_JPYKRW)

    RealTime_KOR_Currency_EURKRW = save_RealTime_KOR_Currency_info("EURKRW")
    df_list.append(RealTime_KOR_Currency_EURKRW)
    print("네이버 크롤링 환율(유로):", RealTime_KOR_Currency_EURKRW)

    RealTime_KOR_Currency_CNYKRW = save_RealTime_KOR_Currency_info("CNYKRW")
    df_list.append(RealTime_KOR_Currency_CNYKRW)
    print("네이버 크롤링 환율(위안):", RealTime_KOR_Currency_CNYKRW)

    RealTime_KOR_Oil_WTI = save_RealTime_KOR_Oil_info("WTI")
    df_list.append(RealTime_KOR_Oil_WTI)
    print("네이버 크롤링 오일(WTI):", RealTime_KOR_Oil_WTI)

    RealTime_KOR_Oil_Dubai = save_RealTime_KOR_Oil_info("Dubai")
    df_list.append(RealTime_KOR_Oil_Dubai)
    print("네이버 크롤링 오일(Dubai):", RealTime_KOR_Oil_Dubai)

    RealTime_KOR_Oil_Brent = save_RealTime_KOR_Oil_info("Brent")
    df_list.append(RealTime_KOR_Oil_Brent)
    print("네이버 크롤링 오일(Brent):", RealTime_KOR_Oil_Brent)

    RealTime_YF_Metal_Gold = save_RealTime_Naver_Metal_info('YF_Gold')
    df_list.append(RealTime_YF_Metal_Gold)
    print("네이버 크롤링 금시세(달러):", RealTime_YF_Metal_Gold)

    RealTime_YF_Metal_Silver = save_RealTime_Naver_Metal_info('YF_Silver')
    df_list.append(RealTime_YF_Metal_Silver)
    print("네이버 크롤링 은시세(달러):", RealTime_YF_Metal_Silver)

    RealTime_YF_Metal_Copper = save_RealTime_Naver_Metal_info('YF_Copper')
    df_list.append(RealTime_YF_Metal_Copper)
    print("네이버 크롤링 구리시세(달러):", RealTime_YF_Metal_Copper)
    
    #RealTime_YF_Metal_Gold = save_YF_realtime_info('GC=F')
    #df_list.append(RealTime_YF_Metal_Gold)
    #print("아후 금시세(달러):", RealTime_YF_Metal_Gold)

    #RealTime_YF_Metal_Silver = save_YF_realtime_info('SI=F')
    #df_list.append(RealTime_YF_Metal_Silver)
    #print("아후 은시세(달러):", RealTime_YF_Metal_Silver)

    #RealTime_YF_Metal_Copper = save_YF_realtime_info('HG=F')
    #df_list.append(RealTime_YF_Metal_Copper)
    #print("아후 구리시세(달러):", RealTime_YF_Metal_Copper)

    RealTime_YF_Oil_WTI = save_RealTime_KOR_Oil_info("YF_WTI")
    df_list.append(RealTime_YF_Oil_WTI)
    print("네이버 크롤링 오일(WTI):", RealTime_YF_Oil_WTI)

    RealTime_YF_Oil_Brent = save_RealTime_KOR_Oil_info("YF_Brent")
    df_list.append(RealTime_YF_Oil_Brent)
    print("네이버 크롤링 오일(Brent):", RealTime_YF_Oil_Brent)

    #RealTime_YF_Oil_WTI = save_YF_realtime_info('CL=F')
    #df_list.append(RealTime_YF_Oil_WTI)
    #print("아후 오일시세(WTI):", RealTime_YF_Oil_WTI)    

    #RealTime_YF_Oil_Brent = save_YF_realtime_info('BZ=F')
    #df_list.append(RealTime_YF_Oil_Brent)
    #print("아후 오일시세(Brent):", RealTime_YF_Oil_Brent)


    RealTime_UBT_Coin_BTC = save_crypto_currency_info('USDT-BTC')
    df_list.append(RealTime_UBT_Coin_BTC)
    print("업비트 코인시세(BTC):", RealTime_UBT_Coin_BTC)

    RealTime_UBT_Coin_ETH = save_crypto_currency_info('USDT-ETH')
    df_list.append(RealTime_UBT_Coin_ETH)
    print("업비트 코인시세(ETH):", RealTime_UBT_Coin_ETH)

    RealTime_UBT_Coin_XRP = save_crypto_currency_info('USDT-XRP')
    df_list.append(RealTime_UBT_Coin_XRP)
    print("업비트 코인시세(XRP):", RealTime_UBT_Coin_XRP)    

    #RealTime_YF_Dollar_Index = save_YF_realtime_info('DX-Y.NYB')
    #df_list.append(RealTime_YF_Dollar_Index)
    #print("아후 달러인덱스(Point):", RealTime_YF_Dollar_Index)

    RealTime_Naver_Dollar_Index = save_RealTime_Naver_Bond_info('Dollar_Index')
    df_list.append(RealTime_Naver_Dollar_Index)
    print("네이버 크롤링 달러인덱스:", RealTime_Naver_Dollar_Index)     

    RealTime_Naver_US_Bond_3y = save_RealTime_Naver_Bond_info('US3YT_Bond')
    df_list.append(RealTime_Naver_US_Bond_3y)
    print("네이버 크롤링 3년물 미국 국채(%):", RealTime_Naver_US_Bond_3y)

    RealTime_Naver_US_Bond_5y = save_RealTime_Naver_Bond_info('US5YT_Bond')
    df_list.append(RealTime_Naver_US_Bond_5y)
    print("네이버 크롤링 5년물 미국 국채(%):", RealTime_Naver_US_Bond_5y)

    RealTime_Naver_US_Bond_10y = save_RealTime_Naver_Bond_info('US10YT_Bond')
    df_list.append(RealTime_Naver_US_Bond_10y)
    print("네이버 크롤링 10년물 미국 국채(%):", RealTime_Naver_US_Bond_10y)

    RealTime_Naver_US_Bond_30y = save_RealTime_Naver_Bond_info('US30YT_Bond')
    df_list.append(RealTime_Naver_US_Bond_30y)
    print("네이버 크롤링 30년물 미국 국채(%):", RealTime_Naver_US_Bond_30y)

    RealTime_Naver_KO_Bond_3y = save_RealTime_Naver_Bond_info('KR3YT_Bond')
    df_list.append(RealTime_Naver_KO_Bond_3y)
    print("네이버 크롤링 3년물 한국 국채(%):", RealTime_Naver_KO_Bond_3y)

    RealTime_Naver_KO_Bond_5y = save_RealTime_Naver_Bond_info('KR5YT_Bond')
    df_list.append(RealTime_Naver_KO_Bond_5y)
    print("네이버 크롤링 5년물 한국 국채(%):", RealTime_Naver_KO_Bond_5y)

    RealTime_Naver_KO_Bond_10y = save_RealTime_Naver_Bond_info('KR10YT_Bond')
    df_list.append(RealTime_Naver_KO_Bond_10y)
    print("네이버 크롤링 10년물 한국 국채(%):", RealTime_Naver_KO_Bond_10y)

    RealTime_Naver_KO_Bond_30y = save_RealTime_Naver_Bond_info('KR30YT_Bond')
    df_list.append(RealTime_Naver_KO_Bond_30y)
    print("네이버 크롤링 30년물 한국 국채(%):", RealTime_Naver_KO_Bond_30y)    

    '''
    RealTime_YF_Bond_5y = save_YF_realtime_Bond('^FVX')
    df_list.append(RealTime_YF_Bond_5y)
    print("아후 크롤링 5년물 국채(%):", RealTime_YF_Bond_5y)   

    RealTime_YF_Bond_10y = save_YF_realtime_Bond('^TNX')
    df_list.append(RealTime_YF_Bond_10y)
    print("아후 크롤링 10년물 국채(%):", RealTime_YF_Bond_10y)   

    RealTime_YF_Bond_30y = save_YF_realtime_Bond('^TYX')
    df_list.append(RealTime_YF_Bond_30y)
    print("아후 크롤링 30년물 국채(%):", RealTime_YF_Bond_30y)
    '''

    df = pd.DataFrame(df_list, columns=['value', 'diff', 'rate', 'name'])
    df = df.set_index('name')
    df = df.transpose()    
    df['GENERATE'] = str(now)
    #df.to_csv(path + "/market_hourly_info.csv", encoding='cp949')

    repo_root = os.path.abspath(os.path.join(path, ".."))
    output_path = os.path.join(repo_root, "moneyflow", "market_hourly_info.json")
    df.to_json(output_path, force_ascii=False, indent=4)

    #with open(path + '/blogs.json', 'w', encoding='utf-8') as f:
    #    json.dump(json_obj, f, ensure_ascii=False, indent=4)

market_hourly_info()
