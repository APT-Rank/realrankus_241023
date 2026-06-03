/**
 * @file i18n.js
 * @description 다국어 번역 런타임 로더.
 * window.LANG에 따라 i18n/{lang}.json을 동기 로드하고,
 * t() 헬퍼 함수로 번역 문자열을 조회할 수 있게 합니다.
 *
 * 사용법:
 *   - en/index.html에서 <script>window.LANG='en';</script> 선언 후 이 파일을 로드
 *   - JS 코드에서 t('ui.loading_rank', '기본값') 으로 호출
 */

// 언어 결정 (기본값: ko)
window.LANG = window.LANG || 'ko';

// 기본 경로 접두사 (en/ 하위에서는 '../', 루트에서는 './')
window.BASE_PATH = window.BASE_PATH || ((window.LANG === 'ko') ? './' : '../');

// 번역 데이터 저장소
window.I18N = {};

/**
 * i18n JSON 파일을 동기 로드하여 window.I18N에 저장.
 * 동기 로드를 사용하는 이유: 다른 JS 파일에서 t() 함수를 즉시 사용하기 위함.
 * 번역 JSON은 매우 작으므로 성능 영향 무시 가능.
 */
(function loadI18N() {  
  var langFile = window.BASE_PATH + 'i18n/' + window.LANG + '.json';
  if(isEn){
    langFile = window.BASE_PATH + 'i18n/en.json';
  }
  else{
    langFile = window.BASE_PATH + 'i18n/ko.json';
  }

  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', langFile, false); // 동기 로드
    xhr.send();
    if (xhr.status === 200) {
      window.I18N = JSON.parse(xhr.responseText);
    } else {
      console.warn('[i18n] Failed to load ' + langFile + ' (status: ' + xhr.status + ')');
    }
  } catch (e) {
    console.warn('[i18n] Error loading translation file:', e);
  }
})();

/**
 * 번역 문자열 조회 헬퍼.
 * @param {string} key - dot notation 키 (예: "ui.loading_rank")
 * @param {string} [fallback] - I18N 로드 전 또는 키가 없을 때 반환할 기본값
 * @returns {string} 번역된 문자열 또는 fallback
 *
 * @example
 *   t('ui.loading_rank')                           // → "Calculating rankings..."
 *   t('ui.copied', '클립보드에 복사되었습니다.')       // → fallback if key missing
 *   t('ui.regions.Seoul')                           // → "Seoul" (en) or "서울시" (ko)
 */
function t(key, fallback) {
  var keys = key.split('.');
  var val = window.I18N;
  for (var i = 0; i < keys.length; i++) {
    if (val && typeof val === 'object' && keys[i] in val) {
      val = val[keys[i]];
    } else {
      return fallback !== undefined ? fallback : key;
    }
  }
  return (val !== null && val !== undefined) ? val : (fallback !== undefined ? fallback : key);
}

/**
 * regions 배열의 한글 표시명을 현재 언어에 맞게 변환.
 * menu_select_box.js의 regions 배열 [['전국','Korea'], ...] 에서
 * 영어 코드(Korea, Seoul 등)를 키로 사용하여 i18n 매핑을 조회합니다.
 *
 * @param {string} regionCode - 지역 영문 코드 (예: 'Seoul', 'Korea')
 * @param {string} koreanName - 한국어 지역명 (fallback용)
 * @returns {string} 현재 언어에 맞는 지역명
 */
function tRegion(regionCode, koreanName) {
  if (window.LANG === 'ko') {
    return koreanName;
  }
  return t('ui.regions.' + regionCode, koreanName);
}

/**
 * districts 배열의 한글 표시명을 현재 언어에 맞게 변환.
 * 영어 모드일 경우 행정구역 코드를 파싱하여 영문명(예: Gangnam-gu, Haeundae-gu)으로 자동 매핑하고,
 * TOP 300 및 전국 비교 등 특수 코드에 대해서는 i18n 번역 파일의 값을 조회합니다.
 *
 * @param {string} districtCode - 행정구역 코드 (예: '1168000000_Seoul_Gangnam', 'Living_Top300')
 * @param {string} koreanName - 한국어 구/군 명칭 (예: '강남구', '주거우선 TOP 300')
 * @returns {string} 현재 언어에 맞는 행정구역 명칭
 */
function tDistrict(districtCode, koreanName) {
  if (window.LANG === 'ko') {
    return koreanName;
  }

  // 특수 코드 매핑 (Top 300, 전국 비교 등)
  if (districtCode.indexOf('Top300') !== -1 || districtCode === '1000000000_Korea') {
    if (districtCode === '1000000000_Korea') return t('ui.supply_pop_jobs', koreanName);
    if (districtCode === 'Living_Top300') return t('ui.top300_living', koreanName);
    if (districtCode === 'Trans_Top300') return t('ui.top300_transport', koreanName);
    if (districtCode === 'Infra_Top300') return t('ui.top300_infra', koreanName);
    if (districtCode === 'Edu_Top300') return t('ui.top300_edu', koreanName);
    if (districtCode === 'Balanced_Top300') return t('ui.top300_balanced', koreanName);
  }

  // 일반 코드 파싱 (예: "1168000000_Seoul_Gangnam")
  var parts = districtCode.split('_');
  if (parts.length >= 3) {
    if (parts.length >= 4 && koreanName.indexOf(' ') !== -1) {
      var korParts = koreanName.split(' ');
      if (korParts.length >= 2) {
        var cityEng = parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
        var distEng = parts[3].charAt(0).toUpperCase() + parts[3].slice(1);
        
        var citySuffix = '';
        if (korParts[0].endsWith('시')) citySuffix = '-si';
        else if (korParts[0].endsWith('군')) citySuffix = '-gun';
        else if (korParts[0].endsWith('구')) citySuffix = '-gu';

        var distSuffix = '';
        if (korParts[1].endsWith('구')) distSuffix = '-gu';
        else if (korParts[1].endsWith('군')) distSuffix = '-gun';
        else if (korParts[1].endsWith('시')) distSuffix = '-si';

        return cityEng + citySuffix + ' ' + distEng + distSuffix;
      }
    }

    var name = parts[2];
    var suffix = '';
    if (koreanName.endsWith('구')) suffix = '-gu';
    else if (koreanName.endsWith('군')) suffix = '-gun';
    else if (koreanName.endsWith('시')) suffix = '-si';

    // 첫 글자 대문자화 및 특수 케이스 대응 (예: Gangwon-do 등은 region에서 처리되므로 gungu만)
    var capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    return capitalized + suffix;
  }

  return t('ui.districts.' + districtCode, koreanName);
}

/**
 * HTML 내 정적 텍스트를 현재 언어 설정(window.LANG)에 따라 동적으로 번역합니다.
 */
function translateStaticHTML() {
  if (typeof $ === 'undefined') return;

  // 타이틀 텍스트
  var titleText = $('#title_text');
  if (titleText.length) titleText.text(t('ui.title_text', titleText.text()));

  // 플레이스홀더
  var inputSearch = $('#inputSearch');
  if (inputSearch.length) inputSearch.attr('placeholder', t('ui.search_placeholder', inputSearch.attr('placeholder')));

  var inputUnifiedSearch = $('#inputUnifiedSearch');
  if (inputUnifiedSearch.length) inputUnifiedSearch.attr('placeholder', t('ui.unified_search_placeholder', inputUnifiedSearch.attr('placeholder')));

  var regionInputSearch = $('#regionInputSearch');
  if (regionInputSearch.length) regionInputSearch.attr('placeholder', t('ui.region_search_placeholder', regionInputSearch.attr('placeholder')));

  var compareInputSearch1 = $('#compareInputSearch1');
  if (compareInputSearch1.length) compareInputSearch1.attr('placeholder', t('ui.compare_search_placeholder', compareInputSearch1.attr('placeholder')));
  var compareInputSearch2 = $('#compareInputSearch2');
  if (compareInputSearch2.length) compareInputSearch2.attr('placeholder', t('ui.compare_search_placeholder', compareInputSearch2.attr('placeholder')));

  // 검색 예시 및 안내
  var searchExample = $('#searchExample');
  if (searchExample.length) searchExample.text(t('ui.search_example', searchExample.text()));

  var unifiedSearchExample = $('#unifiedSearchExample');
  if (unifiedSearchExample.length) unifiedSearchExample.text(t('ui.search_example_global', unifiedSearchExample.text()));

  var regionSearchExample = $('#regionSearchExample');
  if (regionSearchExample.length) regionSearchExample.text(t('ui.region_search_example', regionSearchExample.text()));

  var regionSearchNotice = $('#regionSearchNotice');
  if (regionSearchNotice.length) regionSearchNotice.text(t('ui.region_search_notice', regionSearchNotice.text()));

  // 전국/지역 라디오 라벨
  var option1Span = $('#option1').parent().find('span');
  if (option1Span.length) option1Span.text(t('ui.nationwide_search', option1Span.text()));

  var option2Span = $('#option2').parent().find('span');
  if (option2Span.length) option2Span.text(t('ui.local_search', option2Span.text()));

  // 정렬 라벨
  var labelScore = $('label[for="rearrangeScore"]');
  if (labelScore.length) labelScore.text(t('ui.sort_grade', labelScore.text()));
  var labelPrice = $('label[for="rearrangePrice"]');
  if (labelPrice.length) labelPrice.text(t('ui.sort_price', labelPrice.text()));
  var labelNew = $('label[for="rearrangeNew"]');
  if (labelNew.length) labelNew.text(t('ui.sort_newest', labelNew.text()));
  var labelHouse = $('label[for="rearrangeHouse"]');
  if (labelHouse.length) labelHouse.text(t('ui.sort_units', labelHouse.text()));

  // 지역 정렬 라벨
  var labelRegScore = $('label[for="rearrangeRegionScore"]');
  if (labelRegScore.length) labelRegScore.text(t('ui.sort_total', labelRegScore.text()));
  var labelRegRank = $('label[for="rearrangeRegionRank"]');
  if (labelRegRank.length) labelRegRank.text(t('ui.sort_rank_change', labelRegRank.text()));
  var labelRegPop = $('label[for="rearrangeRegionPop"]');
  if (labelRegPop.length) labelRegPop.text(t('ui.sort_population', labelRegPop.text()));
  var labelRegPopUD = $('label[for="rearrangeRegionPopUpDown"]');
  if (labelRegPopUD.length) labelRegPopUD.text(t('ui.sort_pop_change', labelRegPopUD.text()));
  var labelRegJob = $('label[for="rearrangeRegionJob"]');
  if (labelRegJob.length) labelRegJob.text(t('ui.sort_jobs', labelRegJob.text()));
  var labelRegIncome = $('label[for="rearrangeRegionIncome"]');
  if (labelRegIncome.length) labelRegIncome.text(t('ui.sort_income', labelRegIncome.text()));

  // 닫기 플로팅 버튼들
  var closeSearchFloat = $('#closeSearch_floating #clostText_floating');
  if (closeSearchFloat.length) closeSearchFloat.text(t('ui.close_search', closeSearchFloat.text()));
  var closeRegSearchFloat = $('#closeRegionSearch_floating #clostText_floating');
  if (closeRegSearchFloat.length) closeRegSearchFloat.text(t('ui.close_search', closeRegSearchFloat.text()));
  var closeUniSearchFloat = $('#closeUnifiedSearch_floating #clostText_floating');
  if (closeUniSearchFloat.length) closeUniSearchFloat.text(t('ui.close_search', closeUniSearchFloat.text()));

  var closeRearrangeFloat = $('#closeRearrange_floating #clostText_floating');
  if (closeRearrangeFloat.length) closeRearrangeFloat.text(t('ui.close_sort', closeRearrangeFloat.text()));
  var closeRegRearrangeFloat = $('#closeRegionRearrange_floating #clostText_floating');
  if (closeRegRearrangeFloat.length) closeRegRearrangeFloat.text(t('ui.close_sort', closeRegRearrangeFloat.text()));

  // 기타 버튼/배너
  var filterOnOff = $('#filterOnOff');
  if (filterOnOff.length) filterOnOff.text(t('ui.filter', filterOnOff.text()));

  var mapBanner = $('#map_banner');
  if (mapBanner.length) mapBanner.text(t('ui.report_publish', mapBanner.text()));

  var mapBanner2 = $('#map_banner2');
  if (mapBanner2.length) mapBanner2.text(t('ui.compare_complex', mapBanner2.text()));

  var graphButton = $('#graphButton');
  if (graphButton.length) graphButton.text(t('ui.graph_analysis', graphButton.text()));

  var graphModalLabel = $('#graphModalLabel');
  if (graphModalLabel.length) graphModalLabel.text(t('ui.graph_analysis', graphModalLabel.text()));

  // 모달 안내 대기문구
  var baseModalLabel = $('#baseModalLabel');
  if (baseModalLabel.length) baseModalLabel.text(t('ui.modal_wait', baseModalLabel.text()));
  var toggleModalLabel = $('#toggleModalLabel');
  if (toggleModalLabel.length) toggleModalLabel.text(t('ui.modal_wait', toggleModalLabel.text()));
  var toggleModalLabe2 = $('#toggleModalLabe2');
  if (toggleModalLabe2.length) toggleModalLabe2.text(t('ui.modal_wait', toggleModalLabe2.text()));
  var loginModalLabel = $('#loginModalLabel');
  if (loginModalLabel.length) loginModalLabel.text(t('ui.modal_wait', loginModalLabel.text()));
  var noticeModalLabel = $('#noticeModalLabel');
  if (noticeModalLabel.length) noticeModalLabel.text(t('ui.modal_wait', noticeModalLabel.text()));
  var blogModalLabel = $('#blogModalLabel');
  if (blogModalLabel.length) blogModalLabel.text(t('ui.modal_wait', blogModalLabel.text()));

  // 월 선택 드롭다운 번역
  translateMonthOptions();
}

function translateMonthOptions() {
  var monthSelect = $('#month');
  if (!monthSelect.length) return;
  var isEn = (window.LANG === 'en');
  var monthNames = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
  };

  monthSelect.find('option').each(function() {
    var val = $(this).val();
    if (val && val.length === 6) {
      var year = val.substring(0, 4);
      var monthCode = val.substring(4, 6);
      if (isEn) {
        var monthName = monthNames[monthCode] || monthCode;
        $(this).text(monthName + ', ' + year);
      } else {
        $(this).text(year + '년 ' + monthCode + '월');
      }
    }
  });
}

// 문서 로드 완료 시 번역 실행
$(document).ready(function() {
  translateStaticHTML();
});

