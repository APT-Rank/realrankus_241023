# PLAY-07.2.1_DATA_VALIDATION_REPORT.md

## A. Source
- 파일명: 경기도 용인시 수지구_202609_Data_sum_202609_Valuated_202609.csv
- 파일 크기: 1338917 bytes
- Encoding: cp949 (validated)
- Row Count: 209
- Column Count: 126

## B. Columns
- Required Column: ['검색코드', '아파트명', '세대수', '법정동주소', '도로명주소', 'X', 'Y', 'area_info', 'sales_info']
- Actual Column: ['아파트명', '법정동주소', '도로명주소', '검색코드', '세대수', 'Y', 'X', 'area_info', 'sales_info']
- Mapping Result:
  - 검색코드 -> 검색코드
  - 아파트명 -> 아파트명
  - 세대수 -> 세대수
  - 법정동주소 -> 법정동주소
  - 도로명주소 -> 도로명주소
  - X -> X
  - Y -> Y
  - area_info -> area_info
  - sales_info -> sales_info

## C. Data Quality
- Total Complex: 209
- Valid Complex (X/Y exist): 209
- X Missing: 0
- Y Missing: 0
- Both Missing: 0
- Duplicate Complex ID: 0
- Complex ID Nulls: 0
- Complex ID Non-numeric: 3
- Complex ID Leading Zeros: 0
- Household Nulls: 0, Zero: 0, Negative: 0, Range: 80 ~ 2356

## D. Area/Sales Alignment
- Sample Count: 209
- Match Count: 209
- Mismatch Count: 0
- Area only: 0
- Sales only: 0

## E. Representative Area (Sample 20)
- Complex: 광교경남아너스빌 | All Areas: ['111.95㎡', '113.14㎡', '114.43㎡'] | Selected Index: 0 | Selected Area: 111.95㎡ | Distance from 84: 27.95
- Complex: 광교자이더클래스 | All Areas: ['83.35㎡', '83.71㎡', '111.46㎡', '111.66㎡', '112.71㎡'] | Selected Index: 1 | Selected Area: 83.71㎡ | Distance from 84: 0.29
- Complex: 광교더힐 | All Areas: ['94.94㎡', '108.33㎡', '108.11㎡', '108.32㎡', '108.32㎡', '108.32㎡', '129.69㎡', '129.61㎡', '154.06㎡', '172.69㎡', '172.87㎡'] | Selected Index: 0 | Selected Area: 94.94㎡ | Distance from 84: 10.94
- Complex: 성복역롯데캐슬골드타운(주상복합) | All Areas: ['115.85㎡', '116.71㎡', '136.44㎡'] | Selected Index: 0 | Selected Area: 115.85㎡ | Distance from 84: 31.85
- Complex: 정자뜰마을태영데시앙2차 | All Areas: ['106.55㎡'] | Selected Index: 0 | Selected Area: 106.55㎡ | Distance from 84: 22.55
- Complex: 성동마을LG빌리지2차 | All Areas: ['163.03㎡', '205.1㎡'] | Selected Index: 0 | Selected Area: 163.03㎡ | Distance from 84: 79.03
- Complex: 상현마을현대성우5차 | All Areas: ['153.28㎡', '178.77㎡'] | Selected Index: 0 | Selected Area: 153.28㎡ | Distance from 84: 69.28
- Complex: 성동마을강남빌리지 | All Areas: ['109.01㎡', '163.57㎡', '195.43㎡'] | Selected Index: 0 | Selected Area: 109.01㎡ | Distance from 84: 25.01
- Complex: 푸른마을푸르지오 | All Areas: ['144.5㎡', '170.89㎡', '171.64㎡', '203.44㎡'] | Selected Index: 0 | Selected Area: 144.5㎡ | Distance from 84: 60.50
- Complex: 신정1단지주공 | All Areas: ['83.58㎡', '83.51㎡'] | Selected Index: 0 | Selected Area: 83.58㎡ | Distance from 84: 0.42
- Complex: 성동마을LG빌리지1차 | All Areas: ['203.84㎡', '240.09㎡', '270.78㎡', '304.19㎡'] | Selected Index: 0 | Selected Area: 203.84㎡ | Distance from 84: 119.84
- Complex: 용인수지휴엔하임 | All Areas: ['84.18㎡', '84.33㎡', '84.16㎡', '84.3㎡', '84.24㎡', '84.17㎡', '84.28㎡', '84.34㎡', '84.34㎡', '84.17㎡', '84.28㎡'] | Selected Index: 2 | Selected Area: 84.16㎡ | Distance from 84: 0.16
- Complex: 꽃메마을한라신영프로방스 | All Areas: ['130.98㎡', '149.99㎡', '155.09㎡', '182.99㎡'] | Selected Index: 0 | Selected Area: 130.98㎡ | Distance from 84: 46.98
- Complex: 한성 | All Areas: ['77.32㎡'] | Selected Index: 0 | Selected Area: 77.32㎡ | Distance from 84: 6.68
- Complex: 성복역삼성쉐르빌 | All Areas: ['192.82㎡', '207.92㎡', '221.39㎡', '223.59㎡'] | Selected Index: 0 | Selected Area: 192.82㎡ | Distance from 84: 108.82
- Complex: 신정2단지현대프라임 | All Areas: ['101.49㎡', '125.76㎡', '140.73㎡', '166.44㎡'] | Selected Index: 0 | Selected Area: 101.49㎡ | Distance from 84: 17.49
- Complex: 한국 | All Areas: ['81.63㎡', '105.9㎡'] | Selected Index: 0 | Selected Area: 81.63㎡ | Distance from 84: 2.37
- Complex: 상현마을수지센트럴아이파크 | All Areas: ['135.89㎡', '169.99㎡', '201.88㎡'] | Selected Index: 0 | Selected Area: 135.89㎡ | Distance from 84: 51.89
- Complex: 용인수지신정9단지주공 | All Areas: ['72.62㎡', '87.55㎡', '87.48㎡'] | Selected Index: 2 | Selected Area: 87.48㎡ | Distance from 84: 3.48
- Complex: 수지쌍용파크뷰 | All Areas: ['157.39㎡', '184.48㎡'] | Selected Index: 0 | Selected Area: 157.39㎡ | Distance from 84: 73.39

## F. Initial Price (Sample 20)
- Complex: 광교경남아너스빌 | Representative Area: 111.95㎡ | Area Index: 0 | Matched Sales: 1,550,000,000 | Initial Price: 1,550,000,000 | Initial Price Date: 2026-07-19
- Complex: 광교자이더클래스 | Representative Area: 83.71㎡ | Area Index: 1 | Matched Sales: 1,290,000,000 | Initial Price: 1,290,000,000 | Initial Price Date: 2026-03-03
- Complex: 광교더힐 | Representative Area: 94.94㎡ | Area Index: 0 | Matched Sales: 1,195,000,000 | Initial Price: 1,195,000,000 | Initial Price Date: 2026-08-22
- Complex: 성복역롯데캐슬골드타운(주상복합) | Representative Area: 115.85㎡ | Area Index: 0 | Matched Sales: 1,900,000,000 | Initial Price: 1,900,000,000 | Initial Price Date: 2026-08-22
- Complex: 정자뜰마을태영데시앙2차 | Representative Area: 106.55㎡ | Area Index: 0 | Matched Sales: 1,440,000,000 | Initial Price: 1,440,000,000 | Initial Price Date: 2026-08-12
- Complex: 성동마을LG빌리지2차 | Representative Area: 163.03㎡ | Area Index: 0 | Matched Sales: 1,450,000,000 | Initial Price: 1,450,000,000 | Initial Price Date: 2026-08-26
- Complex: 상현마을현대성우5차 | Representative Area: 153.28㎡ | Area Index: 0 | Matched Sales: 1,060,000,000 | Initial Price: 1,060,000,000 | Initial Price Date: 2026-06-19
- Complex: 성동마을강남빌리지 | Representative Area: 109.01㎡ | Area Index: 0 | Matched Sales: 1,190,000,000 | Initial Price: 1,190,000,000 | Initial Price Date: 2026-07-10
- Complex: 푸른마을푸르지오 | Representative Area: 144.5㎡ | Area Index: 0 | Matched Sales: 1,260,000,000 | Initial Price: 1,260,000,000 | Initial Price Date: 2026-07-07
- Complex: 신정1단지주공 | Representative Area: 83.58㎡ | Area Index: 0 | Matched Sales: 1,280,000,000 | Initial Price: 1,280,000,000 | Initial Price Date: 2026-08-14
- Complex: 성동마을LG빌리지1차 | Representative Area: 203.84㎡ | Area Index: 0 | Matched Sales: 1,150,000,000 | Initial Price: 1,150,000,000 | Initial Price Date: 2026-06-27
- Complex: 용인수지휴엔하임 | Representative Area: 84.16㎡ | Area Index: 2 | Matched Sales: 620,000,000 | Initial Price: 620,000,000 | Initial Price Date: 2025-10-17
- Complex: 꽃메마을한라신영프로방스 | Representative Area: 130.98㎡ | Area Index: 0 | Matched Sales: 1,177,000,000 | Initial Price: 1,177,000,000 | Initial Price Date: 2026-07-06
- Complex: 한성 | Representative Area: 77.32㎡ | Area Index: 0 | Matched Sales: 1,155,000,000 | Initial Price: 1,155,000,000 | Initial Price Date: 2026-08-17
- Complex: 성복역삼성쉐르빌 | Representative Area: 192.82㎡ | Area Index: 0 | Matched Sales: 915,000,000 | Initial Price: 915,000,000 | Initial Price Date: 2025-06-07
- Complex: 신정2단지현대프라임 | Representative Area: 101.49㎡ | Area Index: 0 | Matched Sales: 798,000,000 | Initial Price: 798,000,000 | Initial Price Date: 2023-09-09
- Complex: 한국 | Representative Area: 81.63㎡ | Area Index: 0 | Matched Sales: 1,044,999,999 | Initial Price: 1,044,999,999 | Initial Price Date: 2026-06-28
- Complex: 상현마을수지센트럴아이파크 | Representative Area: 135.89㎡ | Area Index: 0 | Matched Sales: 1,199,000,000 | Initial Price: 1,199,000,000 | Initial Price Date: 2026-07-31
- Complex: 용인수지신정9단지주공 | Representative Area: 87.48㎡ | Area Index: 2 | Matched Sales: 1,220,000,000 | Initial Price: 1,220,000,000 | Initial Price Date: 2026-07-06
- Complex: 수지쌍용파크뷰 | Representative Area: 157.39㎡ | Area Index: 0 | Matched Sales: 950,000,000 | Initial Price: 950,000,000 | Initial Price Date: 2026-08-25

## G. Property ID
- 생성 가능 여부: Yes (Total generated: 206)
- 중복 여부: 0 duplicates

## H. Snapshot Schema
- 모든 필드 Mapping 가능 여부: Yes, with computed fields (representative area, initial price).
- 추가 필드 제안: 'areas[]' array to keep full list of sizes, and 'sales[]' to keep full list of prices, for future extensions.

## I. Blocking Issues
NONE

## J. Final Verdict
READY FOR PLAY-07.2 IMPLEMENTATION

## K. Example Verification (5 Full Examples)

Complex ID: 101239
Complex Name: 광교경남아너스빌
area_info: 33평(111.95),34평(113.14),34평(114.43)
sales_info: 15.5억 (2026-07-19),15.7억 (2026-07-17),15.5억 (2026-07-16)
Representative:
index = 0
area = 111.95㎡
pyeong = 33.0평
Matched sales_info:
price = 1,550,000,000
date = 2026-07-19
Initial Price:
1,550,000,000
----------------------------------------

Complex ID: 102536
Complex Name: 광교자이더클래스
area_info: 25평(83.35),25평(83.71),33평(111.46),33평(111.66),34평(112.71)
sales_info: 14.6억 (2026-08-07),12.9억 (2026-03-03),16.0억 (2026-08-14),16.4억 (2026-08-07),16.4억 (2026-08-07)
Representative:
index = 1
area = 83.71㎡
pyeong = 25.0평
Matched sales_info:
price = 1,290,000,000
date = 2026-03-03
Initial Price:
1,290,000,000
----------------------------------------

Complex ID: 137232
Complex Name: 광교더힐
area_info: 28평(94.94),32평(108.33),32평(108.11),32평(108.32),32평(108.32),32평(108.32),39평(129.69),39평(129.61),46평(154.06),52평(172.69),52평(172.87)
sales_info: 11.95억 (2026-08-22),12.4억 (2026-03-07),13.15억 (2026-07-28),12.9억 (2026-07-30),12.9억 (2026-07-30),12.9억 (2026-07-30),14.0억 (2026-06-18),12.0억 (2026-04-10),14.5억 (2026-07-10),13.8억 (2026-07-06),14.5억 (2026-08-03)
Representative:
index = 0
area = 94.94㎡
pyeong = 28.0평
Matched sales_info:
price = 1,195,000,000
date = 2026-08-22
Initial Price:
1,195,000,000
----------------------------------------

Complex ID: 111555
Complex Name: 성복역롯데캐슬골드타운(주상복합)
area_info: 35평(115.85),35평(116.71),41평(136.44)
sales_info: 19.0억 (2026-08-22),17.8억 (2026-07-16),20.4억 (2026-08-28)
Representative:
index = 0
area = 115.85㎡
pyeong = 35.0평
Matched sales_info:
price = 1,900,000,000
date = 2026-08-22
Initial Price:
1,900,000,000
----------------------------------------

Complex ID: 14130
Complex Name: 정자뜰마을태영데시앙2차
area_info: 32평(106.55)
sales_info: 14.4억 (2026-08-12)
Representative:
index = 0
area = 106.55㎡
pyeong = 32.0평
Matched sales_info:
price = 1,440,000,000
date = 2026-08-12
Initial Price:
1,440,000,000
----------------------------------------

## L. last_sales 검증
Complex: 광교경남아너스빌 | last_sales: 2026-07-19,155000.0,33평(111.95)
Complex: 광교자이더클래스 | last_sales: 2026-08-14,160000.0,33평(111.46)
Complex: 광교더힐 | last_sales: 2026-08-22,119500.0,28평(94.94)
Complex: 성복역롯데캐슬골드타운(주상복합) | last_sales: 2026-08-28,204000.0,41평(136.44)
Complex: 정자뜰마을태영데시앙2차 | last_sales: 2026-08-12,144000.0,32평(106.55)