import os
import datetime
import json
import requests
import pandas as pd
from fredapi import Fred

path = os.path.dirname(os.path.abspath(__file__))
root_path = os.path.dirname(path)

utcnow = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
now = utcnow + datetime.timedelta(hours=9)

FRED_API_KEY = os.environ.get("FRED_KEY", "a7d5a17c8b520a7802d3c905fca10131")
BOK_API_KEY = os.environ.get("BOK_KEY", "570IL3KK1XG2THUF38RC")


def get_normalized_data(original_series, std_val):
    normalized_df = pd.DataFrame(original_series)
    col_name = normalized_df.columns[0]
    normalized_df[col_name] = pd.to_numeric(normalized_df[col_name], errors='coerce')
    if pd.notna(std_val) and std_val != 0:
        normalized_df[col_name] = normalized_df[col_name] / std_val
    else:
        normalized_df[col_name] = pd.NA
    normalized_df.rename(columns={col_name: col_name + "_NOR"}, inplace=True)
    return normalized_df


def get_BOK_total_asset_full():
    """한국은행 ECOS 본원통화(102Y004/M/ABA1) 전 기간 조회 (2003-10 ~ 최신)"""
    str_now_m = now.strftime("%Y%m")
    url = (
        f"https://ecos.bok.or.kr/api/StatisticSearch/{BOK_API_KEY}"
        f"/json/kr/1/1000/102Y004/M/197001/{str_now_m}/ABA1"
    )
    response = requests.get(url, timeout=20)
    result = json.loads(response.text)
    rows = result['StatisticSearch']['row']
    df = pd.DataFrame(rows)[['TIME', 'DATA_VALUE']].copy()
    df['TIME'] = df['TIME'].str[0:4] + "-" + df['TIME'].str[4:6] + "-01"
    df['BOK_Total_Asset'] = pd.to_numeric(df['DATA_VALUE'], errors='coerce')
    df = df[['TIME', 'BOK_Total_Asset']].drop_duplicates(subset=['TIME']).set_index('TIME')
    return df


def get_FRED_total_asset_full():
    """FRED 연준 총자산(WALCL) 전 기간 조회 후 매월 1일 기준으로 변환 (2003-01 ~ 최신)"""
    fred = Fred(api_key=FRED_API_KEY)
    series = fred.get_series('WALCL').dropna()

    # 주간(수요일) 데이터를 일간으로 확장 후 직전값 채움(ffill) -> 매월 1일 값 추출
    full_daily_idx = pd.date_range(start=series.index.min(), end=series.index.max(), freq='D')
    daily_series = series.reindex(full_daily_idx).ffill()
    monthly_first = daily_series[daily_series.index.day == 1]

    df = pd.DataFrame({
        'TIME': monthly_first.index.strftime('%Y-%m-%d'),
        'FRED_Total_Asset': monthly_first.values
    }).set_index('TIME')

    latest_val = float(series.iloc[-1])
    latest_date = series.index[-1].strftime('%Y-%m-%d')
    return df, latest_val, latest_date


def get_KOR_apt_price():
    """전국 235개 시군구 월별 아파트 가격 전 기간 조회 (2012-01 ~ 최신)"""
    apt_data = None
    local_apt_file = os.path.join(root_path, "priceCal", "Apt_sales_price_monthly.json")
    if os.path.exists(local_apt_file):
        try:
            with open(local_apt_file, 'r', encoding='utf-8-sig') as f:
                apt_data = json.load(f)
        except Exception as e:
            print(f"Failed to read local {local_apt_file}: {e}")

    if not apt_data:
        mf_apt_price_url = "https://www.realrankus.com/priceCal/Apt_sales_price_monthly.json"
        r4 = requests.get(mf_apt_price_url, timeout=20)
        r4.encoding = "utf-8-sig"
        apt_data = json.loads(r4.text)

    df_apt_price = pd.DataFrame(apt_data['data'])
    df_apt_price = df_apt_price.reset_index(drop=True)
    df_apt_price = df_apt_price.set_index('시군구')
    if 'index' in df_apt_price.columns:
        df_apt_price.drop(['index'], axis=1, inplace=True)
    df_apt_price = df_apt_price.transpose()
    df_apt_price = df_apt_price.reset_index()
    df_apt_price.rename(columns={'index': 'TIME'}, inplace=True)
    df_apt_price['TIME'] = (
        df_apt_price['TIME'].str[0:4] + "-" + df_apt_price['TIME'].str[4:6] + "-01"
    )
    df_apt_price.set_index('TIME', inplace=True)
    df_apt_price = df_apt_price.apply(pd.to_numeric, errors='coerce')
    return df_apt_price


def main():
    # 1. 한국 통화량 전 기간 (BOK ECOS API)
    df_kor_money = get_BOK_total_asset_full()

    # 2. 미국 통화량 전 기간 (FRED API)
    df_us_money, fred_latest_val, fred_latest_date = get_FRED_total_asset_full()

    # 3. 한국 아파트 가격 전 지역 전 기간 (235개 시군구)
    df_apt_price = get_KOR_apt_price()

    # 4. 전 기간 합집합(outer join)으로 병합 후 날짜순 정렬
    df_MoneyFlow = pd.concat(
        [df_kor_money, df_us_money, df_apt_price], axis=1, join='outer'
    ).sort_index()

    # 통화량은 직전 공표치로 보간(ffill)하여 최신 월까지 연속성 유지 (아파트 가격은 미공표 구간 null 유지)
    df_MoneyFlow['BOK_Total_Asset'] = df_MoneyFlow['BOK_Total_Asset'].ffill()
    df_MoneyFlow['FRED_Total_Asset'] = df_MoneyFlow['FRED_Total_Asset'].ffill()

    # 5. 기준일(2019-06-01 = 1.00) 기준 정규화
    std_date = "2019-06-01"
    normalized_frames = []
    for col in df_MoneyFlow.columns:
        original_series = df_MoneyFlow[col]
        std_value = float(pd.to_numeric(original_series[std_date], errors='coerce'))
        normalized_frames.append(get_normalized_data(original_series, std_value))

    df_MoneyFlow = pd.concat([df_MoneyFlow] + normalized_frames, axis=1).copy()
    df_MoneyFlow['GENERATE'] = str(now)
    df_MoneyFlow = df_MoneyFlow.reset_index()

    csv_path = os.path.join(path, "market_MoneyFlow_apt.csv")
    json_path = os.path.join(path, "market_moneyflow_apt.json")

    df_MoneyFlow.to_csv(csv_path, encoding='cp949', index=False)
    df_MoneyFlow.to_json(json_path, force_ascii=False)

    print(
        f"Saved {len(df_MoneyFlow)} rows ({df_MoneyFlow['TIME'].iloc[0]} ~ {df_MoneyFlow['TIME'].iloc[-1]}), "
        f"{len(df_MoneyFlow.columns)} columns (APT regions: {len(df_apt_price.columns)})"
    )
    print(f"Latest FRED WALCL: {fred_latest_val} ({fred_latest_date})")
    print(f"Latest BOK  M0   : {df_kor_money['BOK_Total_Asset'].iloc[-1]} ({df_kor_money.index[-1]})")
    print(f"CSV : {csv_path}")
    print(f"JSON: {json_path}")


if __name__ == "__main__":
    main()
