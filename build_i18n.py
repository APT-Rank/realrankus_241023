#!/usr/bin/env python3
"""
build_i18n.py - 다국어 SEO 빌드 스크립트

index.html(한국어 원본) + i18n/en.json → en/index.html (영어 버전) 자동 생성.
원본 index.html에도 hreflang 태그를 삽입합니다.

사용법:
    python build_i18n.py
"""

import json
import os
import re
import sys


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(SCRIPT_DIR, 'index.html')
EN_JSON_PATH = os.path.join(SCRIPT_DIR, 'i18n', 'en.json')
EN_DIR = os.path.join(SCRIPT_DIR, 'en')
EN_INDEX_PATH = os.path.join(EN_DIR, 'index.html')

HREFLANG_BLOCK = (
    '  <link rel="alternate" hreflang="ko" href="https://www.realrankus.com/" />\n'
    '  <link rel="alternate" hreflang="en" href="https://www.realrankus.com/en/" />\n'
    '  <link rel="alternate" hreflang="x-default" href="https://www.realrankus.com/" />'
)

BASE_URL = 'https://www.realrankus.com'


def load_en_json():
    """i18n/en.json에서 전체 데이터를 로드합니다."""
    with open(EN_JSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def inject_hreflang_to_original(html):
    """
    원본 index.html에 hreflang 태그가 없으면 삽입합니다.
    이미 존재하면 스킵합니다.
    """
    if 'hreflang' in html:
        print('[원본 index.html] hreflang 태그 이미 존재 → 스킵')
        return html

    # <link rel="canonical" ...> 바로 뒤에 삽입
    canonical_pattern = r'(<link\s+rel="canonical"\s+[^>]*/>)'
    match = re.search(canonical_pattern, html)
    if match:
        insert_pos = match.end()
        html = html[:insert_pos] + '\n' + HREFLANG_BLOCK + html[insert_pos:]
        print('[원본 index.html] hreflang 태그 삽입 완료')
    else:
        # canonical이 없으면 </head> 바로 앞에 삽입
        html = html.replace('</head>', HREFLANG_BLOCK + '\n</head>')
        print('[원본 index.html] hreflang 태그 삽입 완료 (</head> 앞)')

    return html


def build_en_index(html, meta, ui):
    """한국어 index.html을 기반으로 영어 en/index.html을 생성합니다."""

    # 1. lang="ko" → lang="en"
    html = html.replace('lang="ko"', 'lang="en"', 1)

    # 2. <title> 치환
    html = re.sub(
        r'<title>[^<]*</title>',
        f'<title>{meta["title"]}</title>',
        html, count=1
    )

    # 3. <meta name="description"> 치환
    html = re.sub(
        r'(<meta\s+name="description"\s+content=")[^"]*(")',
        rf'\g<1>{meta["description"]}\2',
        html, count=1
    )

    # 4. <meta property="og:title"> 치환
    html = re.sub(
        r'(<meta\s+property="og:title"\s+content=")[^"]*(")',
        rf'\g<1>{meta["og_title"]}\2',
        html, count=1
    )

    # 5. <meta property="og:description"> 치환
    html = re.sub(
        r'(<meta\s+property="og:description"\s+content=")[^"]*(")',
        rf'\g<1>{meta["og_description"]}\2',
        html, count=1
    )

    # 6. <meta property="og:url"> 치환
    html = re.sub(
        r'(<meta\s+property="og:url"\s+content=")[^"]*(")',
        rf'\g<1>{BASE_URL}/en/\2',
        html, count=1
    )

    # 7. <meta name="twitter:title"> 치환
    html = re.sub(
        r'(<meta\s+name="twitter:title"\s+content=")[^"]*(")',
        rf'\g<1>{meta["og_title"]}\2',
        html, count=1
    )

    # 8. <meta name="twitter:description"> 치환
    html = re.sub(
        r'(<meta\s+name="twitter:description"\s+content=")[^"]*(")',
        rf'\g<1>{meta["twitter_description"]}\2',
        html, count=1
    )

    # 9. <meta name="twitter:url"> 치환
    html = re.sub(
        r'(<meta\s+name="twitter:url"\s+content=")[^"]*(")',
        rf'\g<1>{BASE_URL}/en/\2',
        html, count=1
    )

    # 10. <meta name="keyword"> 치환
    html = re.sub(
        r'(<meta\s+name="keyword"\s+content=")[^"]*(")',
        rf'\g<1>{meta["keywords"]}\2',
        html, count=1
    )

    # 11. <meta name="author"> 치환
    html = re.sub(
        r'(<meta\s+name="author"\s+content=")[^"]*(")',
        r'\g<1>Realrankus\2',
        html, count=1
    )

    # 12. <meta name="apple-mobile-web-app-title"> 치환
    html = re.sub(
        r'(<meta\s+name="apple-mobile-web-app-title"\s+content=")[^"]*(")',
        rf'\g<1>{meta["apple_title"]}\2',
        html, count=1
    )

    # 13. <link rel="canonical"> 치환
    html = re.sub(
        r'(<link\s+rel="canonical"\s+href=")[^"]*(")',
        rf'\g<1>{meta["canonical"]}\2',
        html, count=1
    )

    # 14. hreflang 태그가 이미 있으면 그대로 유지, 없으면 삽입
    if 'hreflang' not in html:
        html = re.sub(
            r'(<link\s+rel="canonical"\s+[^>]*/>)',
            r'\1\n' + HREFLANG_BLOCK,
            html, count=1
        )

    # 14.5. 리다이렉트 스크립트 영어용 경로로 치환
    html = html.replace(
        "window.location.replace('./en/index.html' + currentParams);",
        "window.location.replace('../index.html' + currentParams);"
    )
    html = html.replace(
        "if (savedLang === 'en') {",
        "if (savedLang === 'ko') {"
    )

    # 15. window.LANG='en' 스크립트 삽입 (첫 번째 <script> 태그 앞에)
    lang_script = "  <script>window.LANG='en';</script>\n"
    # GTM script 바로 앞에 삽입
    html = html.replace(
        '  <!-- Google Tag Manager -->',
        lang_script + '  <!-- Google Tag Manager -->',
        1
    )

    # 16. 에셋 상대경로 변환: ./ → ../
    # CSS
    html = html.replace('href="./css/', 'href="../css/')
    html = html.replace("href='./css/", "href='../css/")
    # JS
    html = html.replace('src="./js/', 'src="../js/')
    html = html.replace("src='./js/", "src='../js/")
    # 이미지 및 기타 에셋
    html = html.replace('src="./apt-rank', 'src="../apt-rank')
    html = html.replace("src='./apt-rank", "src='../apt-rank")
    html = html.replace('src="./loading', 'src="../loading')
    html = html.replace('href="./css/', 'href="../css/')
    # manifest
    html = html.replace('href="manifest.json"', 'href="../manifest.json"')
    # serviceWorker
    html = html.replace('register("serviceWorker.js")', 'register("../serviceWorker.js")')

    # 17. app_main.js → app_main_lang.js 로 변경 (버전 파라미터 추가로 브라우저 캐싱 방지)
    html = html.replace(
        'src="../js/app_main.js"',
        'src="../js/app_main_lang.js?v=20260524_2"'
    )

    # 18. i18n.js 로드 추가 (app_main_lang.js 바로 앞에, 버전 파라미터 추가)
    html = html.replace(
        '  <script defer src="../js/app_main_lang.js?v=20260524_2">',
        '  <script src="../js/i18n.js?v=20260524_2"></script>\n  <script defer src="../js/app_main_lang.js?v=20260524_2">'
    )

    # 19. Naver Maps API에 &language=en 추가
    html = re.sub(
        r'(maps\.js\?ncpKeyId=[^"\']*)',
        r'\1&language=en',
        html, count=1
    )

    # 19.5. share.js 에 버전 파라미터 추가로 브라우저 캐싱 방지
    html = html.replace(
        'src="../js/share.js"',
        'src="../js/share.js?v=20260524_2"'
    )

    # 19.6. request_report.js 에 버전 파라미터 추가로 브라우저 캐싱 방지
    html = html.replace(
        'src="../js/request_report.js"',
        'src="../js/request_report.js?v=20260524_2"'
    )

    # 20. HTML 내 정적 한국어 텍스트 치환 (index.html에 하드코딩된 것들)
    # 타이틀 텍스트
    html = html.replace(
        '<div id="title_text">리얼랭커스</div>',
        '<div id="title_text">Realrankus</div>'
    )

    # 21. 추가 정적 UI 번역 치환
    html = html.replace('placeholder="어느 단지를 찾아볼까요?"', f'placeholder="{ui["search_placeholder"]}"')
    html = html.replace('placeholder="두 글자 이상 입력해 주세요"', f'placeholder="{ui["unified_search_placeholder"]}"')
    html = html.replace('placeholder="어느 시군구를 찾아볼까요?"', f'placeholder="{ui["region_search_placeholder"]}"')
    html = html.replace('placeholder="전국 단지를 검색하세요"', f'placeholder="{ui["compare_search_placeholder"]}"')

    html = html.replace('<div id="searchExample">예) 강남 래미안, 래미안 힐스테이트, 주공</div>', f'<div id="searchExample">{ui["search_example"]}</div>')
    html = html.replace('<div id="unifiedSearchExample">예) 강남 래미안, 래미안 힐스테이트, 주공</div>', f'<div id="unifiedSearchExample">{ui["search_example_global"]}</div>')
    html = html.replace('<div id="regionSearchExample">예) 서울, 창원, 강남, 서구</div>', f'<div id="regionSearchExample">{ui["region_search_example"]}</div>')
    html = html.replace('<div id="regionSearchNotice">전국 시군구 이름으로 검색합니다.</div>', f'<div id="regionSearchNotice">{ui["region_search_notice"]}</div>')

    html = html.replace('<span style="padding-left: 5px; vertical-align: middle">전국검색</span>', f'<span style="padding-left: 5px; vertical-align: middle">{ui["nationwide_search"]}</span>')
    html = html.replace('<span id="localSearch" style="padding-left: 5px; vertical-align: middle">지역내검색</span>', f'<span id="localSearch" style="padding-left: 5px; vertical-align: middle">{ui["local_search"]}</span>')

    html = html.replace('for="rearrangeScore">등급순</label>', f'for="rearrangeScore">{ui["sort_grade"]}</label>')
    html = html.replace('for="rearrangePrice">실거래가순</label>', f'for="rearrangePrice">{ui["sort_price"]}</label>')
    html = html.replace('for="rearrangeNew">신축순</label>', f'for="rearrangeNew">{ui["sort_newest"]}</label>')
    html = html.replace('for="rearrangeHouse">세대수순</label>', f'for="rearrangeHouse">{ui["sort_units"]}</label>')
    html = html.replace('for="rearrangeRegionScore">총점순</label>', f'for="rearrangeRegionScore">{ui["sort_total"]}</label>')
    html = html.replace('for="rearrangeRegionRank">순위변동순</label>', f'for="rearrangeRegionRank">{ui["sort_rank_change"]}</label>')
    html = html.replace('for="rearrangeRegionPop">인구순</label>', f'for="rearrangeRegionPop">{ui["sort_population"]}</label>')
    html = html.replace('for="rearrangeRegionPopUpDown">인구증감순</label>', f'for="rearrangeRegionPopUpDown">{ui["sort_pop_change"]}</label>')
    html = html.replace('for="rearrangeRegionJob">일자리순</label>', f'for="rearrangeRegionJob">{ui["sort_jobs"]}</label>')
    html = html.replace('for="rearrangeRegionIncome">소득순</label>', f'for="rearrangeRegionIncome">{ui["sort_income"]}</label>')

    html = html.replace('<div id="clostText_floating">검색닫기</div>', f'<div id="clostText_floating">{ui["close_search"]}</div>')
    html = html.replace('<div id="clostText_floating">정렬닫기</div>', f'<div id="clostText_floating">{ui["close_sort"]}</div>')

    html = html.replace('필터</div>', f'{ui["filter"]}</div>')
    html = html.replace('리포트 발행</div>', f'{ui["report_publish"]}</div>')
    html = html.replace('단지 비교하기</div>', f'{ui["compare_complex"]}</div>')
    html = html.replace('동별 고·저평가 아파트 분석', f'{ui["graph_analysis"]}')
    html = html.replace('잠시만 기다려 주세요', f'{ui["modal_wait"]}')

    # 22. 월 선택 (Month options) 치환
    month_names = {
        '01': 'January', '02': 'February', '03': 'March', '04': 'April',
        '05': 'May', '06': 'June', '07': 'July', '08': 'August',
        '09': 'September', '10': 'October', '11': 'November', '12': 'December'
    }
    
    def month_replacer(match):
        option_tag = match.group(0)
        value = match.group(1)
        year = value[:4]
        month_code = value[4:]
        month_name = month_names.get(month_code, month_code)
        
        selected = 'selected' in option_tag
        selected_attr = ' selected' if selected else ''
        
        return f'<option value="{value}"{selected_attr}>{month_name}, {year}</option>'

    html = re.sub(r'<option value="(\d{6})"[^>]*>\d{4}년 \d{2}월</option>', month_replacer, html)

    return html


def main():
    print('=' * 60)
    print('  build_i18n.py - 다국어 SEO 빌드')
    print('=' * 60)

    # 파일 존재 확인
    if not os.path.exists(INDEX_PATH):
        print(f'[ERROR] index.html을 찾을 수 없습니다: {INDEX_PATH}')
        sys.exit(1)
    if not os.path.exists(EN_JSON_PATH):
        print(f'[ERROR] i18n/en.json을 찾을 수 없습니다: {EN_JSON_PATH}')
        sys.exit(1)

    # 영어 번역 데이터 로드
    en_data = load_en_json()
    meta = en_data['meta']
    ui = en_data['ui']
    print(f'[OK] i18n/en.json 로드 완료')

    # 원본 index.html 읽기
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        original_html = f.read()
    print(f'[OK] index.html 읽기 완료 ({len(original_html):,} bytes)')

    # Step 1: 원본 index.html에 hreflang 삽입
    updated_original = inject_hreflang_to_original(original_html)
    if updated_original != original_html:
        with open(INDEX_PATH, 'w', encoding='utf-8') as f:
            f.write(updated_original)
        print(f'[OK] index.html 업데이트 완료')

    # Step 2: en/index.html 생성
    os.makedirs(EN_DIR, exist_ok=True)
    en_html = build_en_index(updated_original, meta, ui)

    with open(EN_INDEX_PATH, 'w', encoding='utf-8') as f:
        f.write(en_html)
    print(f'[OK] en/index.html 생성 완료 ({len(en_html):,} bytes)')

    # 검증
    print('\n--- 검증 ---')
    checks = [
        ('lang="en"', 'lang="en"' in en_html),
        ('영어 title', meta['title'] in en_html),
        ('hreflang ko', 'hreflang="ko"' in en_html),
        ('hreflang en', 'hreflang="en"' in en_html),
        ('hreflang x-default', 'hreflang="x-default"' in en_html),
        ("window.LANG='en'", "window.LANG='en'" in en_html),
        ('에셋 경로 ../', '../css/style.css' in en_html),
        ('app_main_lang.js', 'app_main_lang.js' in en_html),
        ('i18n.js 로드', 'i18n.js' in en_html),
        ('Naver Maps language=en', 'language=en' in en_html),
        ('원본 hreflang', 'hreflang' in updated_original),
    ]
    all_pass = True
    for name, result in checks:
        status = '[OK]' if result else '[FAIL]'
        if not result:
            all_pass = False
        print(f'  {status} {name}')

    if all_pass:
        print('\n[OK] 모든 검증 통과!')
    else:
        print('\n[WARN] 일부 검증 실패. 위 항목을 확인하세요.')

    print('=' * 60)


if __name__ == '__main__':
    main()
