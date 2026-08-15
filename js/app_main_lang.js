var formatOptionDate = (dateStr) => {
  if (!dateStr || dateStr.length < 6) return dateStr;
  var year = dateStr.substr(2, 2);
  var monthNum = dateStr.substr(4, 2);
  var months = {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
  };
  if (isEn) {
    var monthName = months[monthNum] || monthNum;
    return monthName + " '" + year;
  } else {
    return "'" + year + "." + monthNum;
  }
};

var getGunguText = (name, val) => {
  if (val === "1000000000_Korea") return tSafe("ui.supply_pop_jobs", name);
  if (val === "Living_Top300") return tSafe("ui.top300_living", name);
  if (val === "Trans_Top300") return tSafe("ui.top300_transport", name);
  if (val === "Infra_Top300") return tSafe("ui.top300_infra", name);
  if (val === "Edu_Top300") return tSafe("ui.top300_edu", name);
  if (val === "Balanced_Top300") return tSafe("ui.top300_balanced", name);

  if (!isEn) return name;

  var key = "ui.regions.gungu." + val;
  var translated = tSafe(key, null);
  if (translated) return translated;

  var parts = val.split("_");
  if (parts.length >= 4 && name.indexOf(' ') !== -1) {
    var korParts = name.split(' ');
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

  var engBase = parts[parts.length - 1];

  if (engBase === "Gijangn") engBase = "Gijang";
  if (engBase === "Namyangju") engBase = "Namyangju";
  if (engBase === "Yeongsut") engBase = "Yeonsu";

  if (name.endsWith("구")) {
    return engBase + "-gu";
  } else if (name.endsWith("군")) {
    return engBase + "-gun";
  } else if (name.endsWith("시")) {
    return engBase + "-si";
  }
  return engBase;
};

/**
 * @function getRegionNameFromLink
 * @description 연결명(예: "1168000000_Seoul_Gangnam")을 "_"로 분할한 뒤 두 번째 단어부터 끝까지 공백(" ")으로 연결하여 반환합니다.
 * @param {string} val - 연결명 코드
 * @returns {string} 변환된 영문 지역명
 */
var getRegionNameFromLink = (val) => {
  if (!val) return "";
  var parts = val.split("_");
  if (parts.length >= 2) {
    return parts.slice(1).join(" ");
  }
  return val;
};

var exchange_rate = 1500; // 1억 KRW 당 USD 환산값 (예시: 1500M KRW = 1M USD)

/** @type {string} 데이터 분석 기준월 (수동 업데이트 대상) */
var thisMonth = "202608"; //수정
/** @type {string} 사용자가 현재 화면에서 선택하여 보고 있는 분석 대상 월 */
var selectedMonth = "202608"; //수정
/** @type {string} 로컬 캐싱용 IndexedDB 데이터베이스 버전명 */
var DB_Date = "202608_02"; //수정
/** @type {string} 선택된 상위 행정구역 시/도 (예: "Seoul") */
var selectedRegion = "Seoul";
/** @type {string} 선택된 하위 행정구역 시/군/구 코드 및 명칭 (예: "1168000000_Seoul_Gangnam") */
var selectedSubRegion = "1168000000_Seoul_Gangnam";
/** @type {string} 사용자가 리스트나 검색을 통해 최종 선택한 단지명 또는 코드 */
var selectedComplex = "";
/** @type {string} 통합검색 시 적용되는 기본 검색 타입 ("global" 또는 "local") */
var searchType = "global";
/** @type {string} JSON 파일 변경 시 브라우저 캐싱을 무력화하기 위한 버전 쿼리 스트링 */
var update_ver = "?v=1.22";

/** @type {string} 접속 로그 측정을 위한 페이지 식별 명칭 */
var pageName = "aptrank"; //20231020

/** @type {string} 현재 선택된 상위 지역의 한글/영문 이름 저장 */
var regionName = "";
/** @type {number} 현재 구역 내 단지들의 입지 총합 점수 누적값 (평균 계산용) */
var valueSum = 0;
/** @type {number} 현재 구역 내 단지들의 주거총점 누적값 (평균 계산용) */
var livingSum = 0;
/** @type {number} 현재 구역 내 단지들의 교통총점 누적값 (평균 계산용) */
var transportSum = 0;
/** @type {number} 현재 구역 내 단지들의 인프라총점 누적값 (평균 계산용) */
var infraSum = 0;
/** @type {number} 현재 구역 내 단지들의 학군(교육)총점 누적값 (평균 계산용) */
var eduSum = 0;

/** @type {number} 전국 시도 테이블의 입지총합 점수 누적값 (전국 평균 계산용) */
var regValueSum = 0;
/** @type {number} 전국 시도 테이블의 지역구공급총점 누적값 (전국 평균 계산용) */
var regSupplySum = 0;
/** @type {number} 전국 시도 테이블의 인구총점 누적값 (전국 평균 계산용) */
var regPopSum = 0;
/** @type {number} 전국 시도 테이블의 일자리총점 누적값 (전국 평균 계산용) */
var regJobSum = 0;
/** @type {string} 특정 시도의 아파트 보기 연계 링크 정보 */
var linked = "";
/** @type {string} 시도 코드를 매핑하여 보관할 임시 변수 */
var regionValue = "";

/** @type {number} 현재 목록에 표시 중인 아파트 단지 또는 시도의 총 개수 */
var itemNum = 0;
/** @type {Object|string} 현재 로드된 지역구의 아파트 단지 목록 원본 JSON 데이터 */
var aptData = "";
/** @type {Object|string} 정렬이나 필터링 전의 원본 아파트 목록 데이터 복사본 */
var aptData_original = "";
/** @type {Object|string} 정렬/필터링 조건이 적용된 결과 아파트 목록 데이터 */
var sortData = "";
/** @type {number} 이전 단계에서 계산된 점수 보관용 임시 변수 */
var prevValue = 0;
/** @type {Object|string} 전국 지자체(시도) 비교 테이블 원본 JSON 데이터 */
var regData = "";
/** @type {Object|string} 정렬/필터링이 적용된 전국 지자체 비교 테이블 데이터 */
var regSortData = "";
/** @type {Object|string} 광고 정보 보관 객체 */
var adData = "";
/** @type {string} 리스트 목록 최하단의 여백 높이 지정 스타일값 */
var blank_height = "3em";

/** @type {Array} 내부 실거래 검색용 색인 캐시 리스트 */
var internalSearching = [];

/** @type {number} 모달창 오픈 여부 및 인덱스 관리 상태값 (0: 닫힘) */
var modalState = 0;
/** @type {number} 통합검색창 활성화 상태값 (0: 비활성, 1: 활성) */
var searchState = 0;
/** @type {Array} 다중 팝업 히스토리 관리를 위한 스택 배열 */
var popupHistory = [];

/** @type {boolean} 앱 진입 시 공지 팝업 노출 여부 제어 */
var startNotice = false;
/** @type {boolean} 공지사항 모달 활성화 여부 */
var noticePop = false;
/** @type {boolean} 정렬 옵션 팝업 활성화 여부 */
var sortingPop = false;
/** @type {string} 정렬 팝업의 항시 노출 옵션 ("on" 또는 "off") */
var alwaysSortingPop = "on";
/** @type {boolean} 지역 선택 팝업 오픈 상태 제어 플래그 */
var regionSelection = false;

/** @type {string} 이전에 선택된 단지 검색코드 */
var prev_selection = "";
/** @type {string} 현재 선택된 단지 검색코드 */
var current_selection = "";
/** @type {string} 현재 선택하여 보고 있는 단지명 */
var current_apt_name = "";
/** @type {Object} 통합검색용 키워드 매핑 데이터 */
var searchingData = {};
/** @type {Object} IndexedDB 저장 및 검증용 임시 데이터 객체 */
var indexedDB_data = {};

/** @type {string|null} 로컬 스토리지에 저장된 마지막 선택 시도 */
var lastRegion = localStorage.getItem("lastRegion");
/** @type {string|null} 로컬 스토리지에 저장된 마지막 선택 군구 */
var lastSubRegion = localStorage.getItem("lastSubRegion");
/** @type {string|null} 로컬 스토리지에 저장된 마지막 선택 조회 월 */
var lastMonth = localStorage.getItem("lastMonth");
/** @type {string|null} 로컬 스토리지에 저장된 최종 공지 알림 일시 */
var lastNoticed = localStorage.getItem("lastNoticed");

/** @type {Array} 상세 팝업의 현재 평형별 역사 실거래 매매가 목록 */
var sales_history_price = [];
/** @type {Array} 상세 팝업의 역사 실거래 매매 거래 일자 목록 */
var sales_history_date = [];
/** @type {Array} 생성된 실거래가 ChartJS 인스턴스 참조 보관용 배열 */
var priceCharts = [];
/** @type {Array} 현재 구역 내의 모든 고유 법정동 목록 및 인덱스 매핑 정보 */
var dongDB = [];
/** @type {string} 현재 선택된 모바일 또는 오프캔버스 메뉴 식별자 */
var currentMenu = "";
/** @type {Array} 맵 화면 렌더링 범위 내에 존재하는 마커 노출 아파트 단지 배열 */
var show_up_complexs = [];
/** @type {string} 모바일에서의 현재 보기 모드 ("map" 또는 "list") */
var mobile_mode = "map";

/** @type {string} 복사 이벤트 성공 시 출력하는 팝업 메시지 내용 */
var popMsg = "클립보드에 복사되었습니다.";

/** @type {Date} 기준이 되는 현재 시간 객체 */
var today = new Date();
/** @type {number} 현재 연도 (YYYY) */
var today_year = today.getFullYear();
/** @type {string} 현재 월 (MM, 2자리) */
var today_month = dateReturn(today.getMonth() + 1);
/** @type {string} 현재 일 (DD, 2자리) */
var today_day = dateReturn(today.getDate());
/** @type {number} 현재 날짜의 숫자 표현식 (YYYYMMDD) */
var today_num = Number("" + today_year + today_month + today_day);
/** @type {string} 현재 날짜의 대시 구분 문자열 표현 (YYYY-MM-DD) */
var today_str = today_year + "-" + today_month + "-" + today_day;

/** @type {number} 최근 방문객 집계 기준일 간격 (30일) */
var ago_days = 30; //최근 30일 동안의 방문자 수만 합침
/** @type {number} 30일 전 날짜의 밀리초 타임스탬프 */
var days_ago_raw = today.setDate(today.getDate() - ago_days);
/** @type {Date} 30일 전 날짜 객체 */
var days_ago = new Date(days_ago_raw);
/** @type {number} 30일 전 연도 */
var days_ago_year = days_ago.getFullYear();
/** @type {string} 30일 전 월 */
var days_ago_month = dateReturn(days_ago.getMonth() + 1);
/** @type {string} 30일 전 일 */
var days_ago_day = dateReturn(days_ago.getDate());
/** @type {number} 30일 전 날짜의 숫자 표현식 (YYYYMMDD) */
var days_ago_num = Number("" + days_ago_year + days_ago_month + days_ago_day);

/** @type {number} 실거래 데이터 조회의 분석 유효 연한 범위 (2년) */
var ago_years = 2; //최근 2년간의 실거래가만으로 필터링 함
/** @type {number} 2년 전 1일의 밀리초 타임스탬프 (오늘 기준 보정) */
var years_ago_raw = today.setFullYear(today.getFullYear() - ago_years);
years_ago_raw = today.setDate(1);
/** @type {Date} 2년 전 날짜 객체 */
var years_ago = new Date(years_ago_raw);
/** @type {number} 2년 전 연도 */
var years_ago_year = years_ago.getFullYear();
/** @type {string} 2년 전 월 */
var years_ago_month = dateReturn(years_ago.getMonth() + 2);
/** @type {string} 2년 전 일 */
var years_ago_day = dateReturn(years_ago.getDate());
/** @type {number} 2년 전 날짜의 숫자 표현식 (YYYYMMDD) */
var years_ago_num = Number("" + years_ago_year + years_ago_month + years_ago_day);

/** @type {Array} 팝업 히스토리 상태 백업 리스트 */
var pop_state = [];

/** @type {boolean} 지도로부터 탐색해 들어온 유입 경로인지 식별하는 플래그 */
var come_from_map = false;
/** @type {Array} 사용자의 최근 검색 단지 기록 저장 배열 */
var recent_search = [];

/** @type {boolean} 평형/가격 필터링 UI 패널이 노출된 상태인지 나타내는 플래그 */
var filter_ui = false;

/** @type {string} 현재 상세 진단 모달에서 열고 있는 단지명 */
let detail_complex = "";
/** @type {string} 현재 상세 진단 모달에서 열고 있는 단지의 고유 검색코드 */
let detail_searchCode = "";

/**
 * @function dateReturn
 * @description 10 미만의 숫자에 앞자리 '0'을 붙여 2자리 문자열로 반환하는 포맷팅 함수.
 * @param {number} n - 입력 숫자
 * @returns {string} 2자리 포맷의 문자열 (예: 9 -> '09')
 */
function dateReturn(n) {
  return n < 10 ? "0" + n : n;
}

/**
 * @description 페이지 로드가 완료되었을 때 실행되는 초기화 이벤트 핸들러.
 * Kakao SDK 초기화, URL 파라미터(apt, reg, sub, mon, complex, sort, cpx) 분석 및 상태 복원,
 * IndexedDB를 통한 로컬 데이터 캐싱 및 지도/마커 초기 렌더링, 모달 여닫기 이벤트 감지 등을 수행합니다.
 */
$(document).ready(function () {
  Kakao.init(kakaoKey);

  countUp(pageName);

  var option = "";
  for (i = 0; i < regions.length; i++) {
    var sidoVal = regions[i][1];
    var sidoText = tSafe("ui.regions." + sidoVal, regions[i][0]);
    option += `<option value='${sidoVal}'>${sidoText}</option>`;
  }
  $("#sido").html(option);
  alwaysSortingPop = localStorage.getItem("lastSortingPop");


  recent_search = JSON.parse(localStorage.getItem("recentSearch"));
  if (recent_search == null) {
    recent_search = [];
  }

  const url = new URL(window.location.href);
  const urlParams = url.searchParams;
  if (urlParams.has("apt")) {
    metatag_apt_name = urlParams.get("apt");
    main_title = "'" + metatag_apt_name + "'" + " 입지분석, 시세, 실거래가 | 표준화된 리얼랭커스 입지분석";
    $(document).attr("title", main_title);
    $("meta[property='og\\:title']").attr("content", main_title);
    $("meta[property='og\\:url']").attr("content", url);

    meta_description = "'" + metatag_apt_name + "'" + "의 주거, 교통, 인프라, 교육 환경 분석 정보를 데이터로 확인하세요.";
    $("meta[property='og\\:description']").attr("content", meta_description);
    $("meta[property='og\\:site_name']").attr("content", "리얼랭커스");

    $("meta[name='twitter\\:card']").attr("content", "summary");
    $("meta[name='twitter\\:url']").attr("content", url);
    $("meta[name='twitter\\:title']").attr("content", main_title);
    $("meta[name='twitter\\:description']").attr("content", meta_description);
  }

  if (urlParams.has("reg")) {
    selectedRegion = urlParams.get("reg");
  } else if (lastRegion != null) {
    selectedRegion = lastRegion;
  }

  if (urlParams.has("sub")) {
    selectedSubRegion = urlParams.get("sub");
  } else if (lastSubRegion != null) {
    selectedSubRegion = lastSubRegion;
  }

  if (urlParams.has("mon")) {
    selectedMonth = urlParams.get("mon");
  } else if (lastMonth != null) {
    selectedMonth = lastMonth;
  }

  if (urlParams.has("complex")) {
    selectedComplex = urlParams.get("complex");
  }

  if (urlParams.has("sort")) {
    sortSelection = urlParams.get("sort");
  } else {
    initSorting();
  }

  if (urlParams.has("cpx")) {
    infoText = urlParams.get("cpx");
    region_code = infoText.substr(0, 4);
    year_code = infoText.substr(4, 1);
    month_code = infoText.substr(5, 1);
    complex_code = infoText.substr(6, 3);

    for (var i = 0; i < codeMap.length; i++) {
      if (codeMap[i][0] == region_code) {
        selectedRegion = codeMap[i][1];
        selectedSubRegion = codeMap[i][2];
        break;
      }
    }
    for (var i = 0; i < yearMap.length; i++) {
      if (yearMap[i][0] == year_code) {
        find_year = yearMap[i][1];
        break;
      }
    }
    for (var i = 0; i < monthMap.length; i++) {
      if (monthMap[i][0] == month_code) {
        find_month = monthMap[i][1];
        break;
      }
    }
    selectedMonth = find_year + find_month;
    if (complex_code == "") {
      selectedComplex = complex_code;
    } else {
      selectedComplex = Number(complex_code).toString();
    }
  } else if (lastRegion != null) {
    selectedRegion = lastRegion;
  }

  $("#month").val(selectedMonth).prop("selected", true);
  $("#sido").val(selectedRegion).prop("selected", true);
  $("#gungu").val(selectedSubRegion).prop("selected", true);
  regionName = $("#sido option:selected").val();

  $("#dataList").html("");
  month = selectedMonth;

  $("body").append(
    `<div id='pageLoadingBack'><div class='spinner-grow text-pageLoading' role='status'></div><div style='font-size: 0.85em; color: white'><br>${tSafe("ui.loading_rank", "단지별 랭크를 계산하고 있어요!")}<br><br><div id='loading_reload' onClick='resetReload()'>${tSafe("ui.loading_retry", "로딩이 길다면 여기를 눌러 다시 불러오기!!")}</div></div></div>`,
  );

  if (isEn) {
    searching_url = pathPrefix + selectedMonth + "/Searching_list_EN.json" + update_ver;
    DB_Date = DB_Date + "_EN";
  } else {
    searching_url = pathPrefix + selectedMonth + "/Searching_list.json" + update_ver;
  }
  region_url = pathPrefix + selectedMonth + "/region_map.json?v=2.0" + update_ver;

  const request = indexedDB.open(DB_Date); // 1. DB 열기
  request.onerror = (e) => console.log("ERROR : ", e.target.errorCode);
  request.onsuccess = (e) => {
    const db = request.result;
    if (db.objectStoreNames.length == 0) {
      $.getJSON(searching_url, function (json) {
        searchingData = json;
      }).done(function () {
        //지도서비스추가
        request.result.close();
        writeIdxedDB(searchingData.data);
        region_url = pathPrefix + selectedMonth + "/region_map.json?v=2.0" + update_ver;
        $.getJSON(region_url, function (json) {
          regionMapData = json.data;
        }).done(function () {
          for (var i in regionMapData) {
            if (regionMapData[i]["Level"] == "Level0") {
              level0_loc.push(regionMapData[i]);
            }
            if (regionMapData[i]["Level"] == "Level1") {
              level1_loc.push(regionMapData[i]);
            }
            if (regionMapData[i]["Level"] == "Level2") {
              level2_loc.push(regionMapData[i]);
            }
          }
          if (selectedRegion == "Korea") {
            loadMap(127.9564, 36.6778);
          } else {
            region_code = selectedSubRegion.split("_")[0];
            for (var i in level1_loc) {
              if (level1_loc[i]["법정동코드"] + "" == region_code) {
                loadMap(level1_loc[i]["lng"], level1_loc[i]["lat"]);
                break;
              }
            }
          }
          current_pos = defaultMap.getCenterPoint();
          projection = defaultMap.getProjection();
          current_coord = projection.fromPointToCoord(current_pos);

          origin_lat = current_coord["y"];
          origin_lng = current_coord["x"];

          nearby_region = [];
          nearby_region = findNearbyRegion(origin_lat, origin_lng, 15);

          show_up_complexs = [];
          show_up_complexs = defineMarkerList(nearby_region);

          current_zoom = defaultMap.getZoom();

          showHideMarker(current_zoom);
          $("#pageLoadingBack").remove();
          optionChange(selectedSubRegion, selectedRegion);
          updateRegion();
        });
      });
    } else {
      const transaction = db.transaction("complex");
      transaction.onerror = (e) => console.log("fail");
      transaction.oncomplete = (e) => {
        console.log("Transaction Success");
      };
      const objStore = transaction.objectStore("complex"); // 2. name 저장소 접근
      dbObj = objStore.getAll();
      dbObj.onsuccess = (e) => {
        searchingData.data = e.target.result;
        $.getJSON(region_url, function (json) {
          regionMapData = json.data;
        }).done(function () {
          for (var i in regionMapData) {
            if (regionMapData[i]["Level"] == "Level0") {
              level0_loc.push(regionMapData[i]);
            }
            if (regionMapData[i]["Level"] == "Level1") {
              level1_loc.push(regionMapData[i]);
            }
            if (regionMapData[i]["Level"] == "Level2") {
              level2_loc.push(regionMapData[i]);
            }
          }
          if (selectedRegion == "Korea") {
            loadMap(127.9564, 36.6778);
          } else {
            region_code = selectedSubRegion.split("_")[0];
            for (var i in level1_loc) {
              if (level1_loc[i]["법정동코드"] + "" == region_code) {
                loadMap(level1_loc[i]["lng"], level1_loc[i]["lat"]);
                break;
              }
            }
          }
          current_pos = defaultMap.getCenterPoint();
          projection = defaultMap.getProjection();
          current_coord = projection.fromPointToCoord(current_pos);

          origin_lat = current_coord["y"];
          origin_lng = current_coord["x"];

          nearby_region = [];
          nearby_region = findNearbyRegion(origin_lat, origin_lng, 15);

          show_up_complexs = [];
          show_up_complexs = defineMarkerList(nearby_region);

          current_zoom = defaultMap.getZoom();

          showHideMarker(current_zoom);
          $("#pageLoadingBack").remove();
          optionChange(selectedSubRegion, selectedRegion);
          updateRegion();
        });
      };
    }

    filterHtml = "";

    //평형 필터 슬라이더
    var filterAreaLabel = tSafe("ui.filter_area", "평형");
    filterHtml += `
          <div class='filterInfo'>
          <div class='filterName'>${filterAreaLabel}</div>
          <div class='filterVal' id='filterName_area'></div>
          </div>
          <div class='filterRange'>
          <div> </div>
          <div id='area_slider'></div>
          <div> </div>
          <div> </div>
          <div id='area_divider'>
        `;
    for (var i = 0; i < 9; i++) {
      if (i == 0) {
        filterHtml += `<div class='sPrice_index'>0</div>`;
      } else {
        var areaTick = isEn ? `${i * 10}py` : `${i * 10}평`;
        filterHtml += `<div class='sPrice_index'>${areaTick}</div>`;
      }
    }
    filterHtml += `
            </div>
            <div> </div>
            </div>
          `;

    filterHtml += `<hr style='margin-top:.5em; margin-bottom:.5em'>`;

    //매매가격 필터 슬라이더
    var filterPriceLabel = tSafe("ui.filter_price", "가격");
    filterHtml += `
          <div class='filterInfo'>
          <div class='filterName'>${filterPriceLabel}</div>
          <div class='filterVal' id='filterName_sPrice'></div>
          </div>
          <div class='filterRange'>
          <div> </div>
          <div id='sPrice_slider'></div>
          <div> </div>
          <div> </div>
          <div id='sPrice_divider'>
        `;
    for (var i = 0; i < 5; i++) {
      if (i == 0) {
        filterHtml += `<div class='sPrice_index'>0</div>`;
      } else {
        var priceTick = isEn ? `${(i * 1000).toLocaleString()}M` : `${i * 10}억`;
        filterHtml += `<div class='sPrice_index'>${priceTick}</div>`;
      }
    }
    filterHtml += `
          </div>
          <div> </div>
          </div>
        `;

    $("#filterSelector").html(filterHtml);
    if (isMobile) {
      filter_ui = false;
    }
    else {
      filter_ui = true;
      $("#filterOnOff").css({
        color: "#fff",
        "background-color": "#940c23",
        border: "2px solid #940c23",
      })
    }

    initSlider_sPrice();
    initSlider_area();
  };

  $("#linkToAptrank_bottom").css({ width: "100%" });
  if (regionName != "Korea") {
    $("#dataList_wrapper").css({
      height: window.innerHeight - $("#linkToAptrank_bottom").height() - $("#titleBar").height() - $("#selections").height() - 90,
      "margin-top": "170px",
    });
  } else {
    $("#dataList_wrapper").css({
      height: window.innerHeight - $("#linkToAptrank_bottom").height() - $("#titleBar").height(),
      "margin-top": "97px",
    });
    $("#dataList_wrapper").css({
      "margin-top": "96px",
      height: window.innerHeight - ($("#titleBar").height() + $("#selections").height() + 23 + $("#linkToAptrank_bottom").height()),
    });
  }

  $(".modal").on("show.bs.modal", function () {
    const modalId = this.id;
    //console.log("Modal opened: " + modalId);

    if (modalId == "commentModifyModal" || modalId == "blogModal" || modalId == "commentModal" || modalId == "loginModal") {
      $("#commentListModal").css({ "z-index": "1050" });
      $(".modal-backdrop").css({ "z-index": "1050" });
    }
    if (modalId == "requestReportModal") {
    }
  });

  $(".modal").on("hidden.bs.modal", function () {
    const modalId = this.id;
    //console.log("Modal closed: " + modalId);

    if (modalId == "baseModal") {
      changeMetaTagToDefault();
      current_selection = "";
      current_apt_name = "";
      removeAnimation();
    }
    if (modalId == "noticeModal") {
      $("#baseModal").css({ "z-index": "1055" });
      $(".modal-backdrop").css({ "z-index": "1000" });
    }

    if (modalId == "compareModal") {
      $("#baseModal").css({ "z-index": "1055" });
      $(".modal-backdrop").css({ "z-index": "1000", width: "600px" });
    }
    if (modalId == "toggleModal1") {
      $("#baseModal").css({ "z-index": "1055" });
      $(".modal-backdrop").css({ "z-index": "1000" });
    }
    if (modalId == "commentListModal") {
      $("#baseModal").css({ "z-index": "1055" });
      $(".modal-backdrop").css({ "z-index": "1000", width: "600px" });
    }
    if (modalId == "commentModifyModal" || modalId == "blogModal" || modalId == "commentModal" || modalId == "loginModal") {
      $("#commentListModal").css({ "z-index": "1055" });
      $(".modal-backdrop").css({ "z-index": "1050" });
    }

    // 히스토리도 자동으로 맞추기
    if (history.state?.modal === modalId) {
      history.back();
    }
  });

  if ($.cookie("popCookie") != "202608" && urlParams.has("reg") == false && urlParams.has("cpx") == false && login_status == false) {
    startNotice = true;
    showNotice();
    //초기 진입 시 공지 팝업 표시하는 경우, 변수 startNotice에 true 할당
    openModal("noticeModal");
  }

  blank_height = "3em";
  $("#linkToAptrank").css("height", blank_height);
  $("#linkToAptrank").css("line-height", blank_height);

  currentMenu = "aptrank"; //offcanvas

  setOffcanvasMenu(); //offcanvas

  setBottomMenu();
  setAppDownloadModal();

  requestReportModal();

  $("#searchingBox").css({
    height: window.innerHeight - ($("#titleBar").height() + $("#selections").height() + $("#weight").height() + 39 + $("#linkToAptrank_bottom").height()),
  });
  $("#searchingBox").hide();
  var inHeight = window.innerHeight;
  $("#commentBox").css({ height: inHeight - 50 - 42 });
  commentBox_height = $("#commentBox").height();
  if (!isMobile) {
    $("#commentBox").css({
      width: "580px",
      bottom: -commentBox_height + 92 + "px",
    });
    $("#mobile_map_list").hide();
  } else {
    $("#noticeDetail").height(window.innerHeight / 3);
    $("#noticeModaloutline").css({
      bottom: (-1 * window.innerHeight) / 7,
    });

    $("#blogDetail").height(window.innerHeight / 1.35);
    $("#blogModaloutline").css({
      bottom: (-1 * window.innerHeight) / 40,
    });

    $("#dataList_wrapper").hide();
    $("#commentBox").css({ bottom: -commentBox_height + 92 + "px" });
    $("#rearrange").css({ visibility: "hidden" });
    $("#mobile_map_list_icon").html("<i class='fa-solid fa-list'></i>");
    $("#mobile_map_list_text").html(tSafe("ui.list_view", "목록"));

    filterSelector_width = window.innerWidth - 80;
    $("#filterSelector").css({ width: filterSelector_width + "px" });
    if (!filter_ui) {
      $("#filterSelector").hide();
      $("#gradeSelector").hide();
    }

    //가치대비가격괴리도진단 버튼 크기 조정
    if (isEn) {
      $("#graphButtonContainer").css({ top: "123px", left: "33%" });
    }
    else {
      $("#graphButtonContainer").css({ top: "123px", left: "24%" });
    }
    $("#graphButton").css({
      padding: "0.375em 0.75em",
      "font-size": "0.875em",
    });
  }

  //창 크기 조정 완료 시
  if (!isMobile) {
    $(window).resize(function () {
      clearTimeout(window.resizedFinished);
      window.resizedFinished = setTimeout(function () {
        dw = window.innerWidth - 600;
        dh = window.innerHeight - $("#linkToAptrank_bottom").height();
        new_window_size = new naver.maps.Size(window.innerWidth - 600, window.innerHeight - $("#linkToAptrank_bottom").height());
        defaultMap.setSize(new_window_size);

        $("#dataList_wrapper").css({
          "margin-top": $("#titleBar").height() + $("#selections").height() + $("#weight").height() + $(".dong_selector").height() + 25,
          height: window.innerHeight - ($("#titleBar").height() + $("#selections").height() + $("#weight").height() + $(".dong_selector").height() + 23 + $("#linkToAptrank_bottom").height()),
        });
      }, 50);
    });
  }

  window.addEventListener("popstate", (event) => {
    const container = document.getElementById("radar-container");

    // radar iframe이 열려 있다면 닫기
    if (container.style.display === "block") {
      closeRadar();
    }
  });

  $("#commentBack").hide();
});

/**
 * @function writeIdxedDB
 * @description 기존에 생성된 구 버전의 IndexedDB 데이터베이스들을 삭제하고, 새로운 단지 검색 목록 데이터를 'complex' 저장소에 저장하여 캐싱합니다.
 * @param {Array} searchingData - IndexedDB에 저장할 단지별 검색 데이터 배열
 */
function writeIdxedDB(searchingData) {
  window.indexedDB.deleteDatabase("202512_01");
  window.indexedDB.deleteDatabase("202512_02");
  window.indexedDB.deleteDatabase("202601_01");
  window.indexedDB.deleteDatabase("202601_02");
  window.indexedDB.deleteDatabase("202602_01");
  window.indexedDB.deleteDatabase("202602_02");
  window.indexedDB.deleteDatabase("202602_03");
  window.indexedDB.deleteDatabase("202603_01");
  window.indexedDB.deleteDatabase("202603_02");
  window.indexedDB.deleteDatabase("202603_03");
  window.indexedDB.deleteDatabase("202604_01");
  window.indexedDB.deleteDatabase("202604_02");
  window.indexedDB.deleteDatabase("202604_03");
  window.indexedDB.deleteDatabase("202604_04");
  window.indexedDB.deleteDatabase("202604_05");
  window.indexedDB.deleteDatabase("202605_01");
  window.indexedDB.deleteDatabase("202605_02");
  window.indexedDB.deleteDatabase("202605_03");
  window.indexedDB.deleteDatabase("202605_04");
  window.indexedDB.deleteDatabase("202606_01");
  window.indexedDB.deleteDatabase("202606_02");
  window.indexedDB.deleteDatabase("202606_02_EN");
  window.indexedDB.deleteDatabase("202606_03");
  window.indexedDB.deleteDatabase("202606_03_EN");
  window.indexedDB.deleteDatabase("202606_04");
  window.indexedDB.deleteDatabase("202606_04_EN");
  window.indexedDB.deleteDatabase("202607_01");
  window.indexedDB.deleteDatabase("202607_01_EN");
  window.indexedDB.deleteDatabase("202607_02");
  window.indexedDB.deleteDatabase("202607_02_EN");
  window.indexedDB.deleteDatabase("202607_03");
  window.indexedDB.deleteDatabase("202607_03_EN");
  window.indexedDB.deleteDatabase("202608_01");
  window.indexedDB.deleteDatabase("202608_01_EN");
  window.indexedDB.deleteDatabase(DB_Date);

  const dbName = DB_Date;
  var request = indexedDB.open(dbName);

  request.onerror = function (event) {
    // Handle errors.
  };
  request.onupgradeneeded = function (event) {
    var db = event.target.result;
    var objectStore = db.createObjectStore("complex", {
      keyPath: "index",
    });
    objectStore.transaction.oncomplete = function (event) {
      // Store values in the newly created objectStore.
      var customerObjectStore = db.transaction("complex", "readwrite").objectStore("complex");

      for (var i = 0; i < searchingData.length; i++) {
        customerObjectStore.add(searchingData[i]);
      }
    };
  };

  request.onsuccess = (e) => {
    var db = request.result;
    const transaction = db.transaction(["complex"], "readwrite");
  };
}

/**
 * @function filterOnOff
 * @description 필터 UI 패널(평형, 가격 슬라이더)의 표시 여부를 토글하고, 활성화 상태에 따라 필터 버튼의 텍스트 및 배경 스타일을 업데이트합니다.
 */
function filterOnOff() {
  if (filter_ui) {
    $("#filterSelector").hide();
    if (isMobile) {
      $("#gradeSelector").hide();
    }
    if (filtered) {
      $("#filterOnOff").html("<i class='fa-solid fa-check'></i>&nbsp" + tSafe('ui.filter', '필터'));
      $("#filterOnOff").css({
        color: "#fff",
        "background-color": "#940c23",
        border: "2px solid #940c23",
      });
    } else {
      $("#filterOnOff").html(tSafe('ui.filter', '필터'));
      $("#filterOnOff").css({
        color: "#000",
        "background-color": "#efefef",
        border: "2px solid #940c23",
      });
    }

    filter_ui = false;
  } else {
    $("#filterSelector").show();
    if (isMobile) {
      $("#gradeSelector").show();
    }

    if (filtered) {
      $("#filterOnOff").html("<i class='fa-solid fa-check'></i>&nbsp" + tSafe('ui.filter', '필터'));
      $("#filterOnOff").css({
        color: "#fff",
        "background-color": "#940c23",
        border: "2px solid #940c23",
      });
    } else {
      $("#filterOnOff").html(tSafe('ui.filter', '필터'));
      $("#filterOnOff").css({
        color: "#fff",
        "background-color": "#940c23",
        border: "2px solid #940c23",
      });
    }

    filter_ui = true;
  }
}

var commentBox_on = false;
/**
 * @function commentbox_animate
 * @description 화면 하단에서 위로 슬라이드되어 올라오는 랭커스톡(댓글창) 토글 애니메이션을 처리합니다.
 * 댓글창이 열릴 때 브라우저 히스토리 해시(#board)를 추가하고, 닫힐 때 해시를 제거하며 스크롤 동작을 제어합니다.
 */
function commentbox_animate() {
  commentBox_height = $("#commentBox").height();
  fixed_loc = -commentBox_height + 92 + "px";
  if (commentBox_on == true) {
    commentBox_on = false;
    $("#comment_title").animate({ "font-size": "0.85em" }, 350, "easeInCirc");
    $("#comment_light").animate({ "background-color": "#ddd" }, 350, "easeInCirc");
    $("#commentBox").animate({ bottom: fixed_loc }, 350, "easeInCirc");
    $("#comment_direction").animate({ rotate: "0deg" }, 550, "easeInCirc");
    $("#commentBack")
      .animate({ opacity: "0" }, 350, "linear")
      .promise()
      .done(function () {
        $("#commentBack").hide();
        $("#commentWrapper").css({ "z-index": "850" });
        $("body").css({ "overflow-y": "auto" });
      });
  } else {
    window.location.hash = "#board";
    window.onhashchange = function () {
      if (!location.hash) {
        commentbox_animate();
      }
    };

    commentBox_on = true;
    $("#commentBack").show();
    $("#commentWrapper").css({ "z-index": "950" });
    $("#comment_title").animate(
      {
        "font-size": "1.1em",
      },
      350,
      "easeOutCirc",
    );
    $("#comment_light").animate(
      {
        "background-color": "#e31939",
      },
      350,
      "easeOutCirc",
    );
    $("#commentBox").animate(
      {
        bottom: "40px",
      },
      350,
      "easeOutCirc",
    );
    $("#comment_direction").animate(
      {
        rotate: "180deg",
      },
      550,
      "easeInCirc",
    );
    $("#commentBack")
      .animate(
        {
          opacity: "0.6",
        },
        350,
        "linear",
      )
      .promise()
      .done(function () {
        $("body").css({ "overflow-y": "hidden" });
      });
  }
}

/**
 * @function resetReload
 * @description 로딩이 지연되거나 비정상적일 때 사용되는 초기화 함수.
 * 로컬 스토리지를 기본 지역(서울 강남구)으로 초기화한 후 페이지를 강제 새로고침합니다.
 */
function resetReload() {
  selectedRegion = "Seoul";
  selectedSubRegion = "1168000000_Seoul_Gangnam";

  localStorage.setItem("lastRegion", selectedRegion);
  localStorage.setItem("lastSubRegion", selectedSubRegion);

  location.reload();
}

/**
 * @function showWeight
 * @description 현재 선택된 가중치 정렬 모드(균형, 주거, 교통, 인프라, 교육, 커스텀) 및 가격 필터링 범위 정보를 조합하여 상단 바에 텍스트 정보로 표시합니다.
 */
function showWeight() {
  if (selectedRegion != "Korea") {
    $("#weight").show();

    var sortName = "";
    var priceRange = "";

    if (sortSelection == "sortDefault") {
      sortName = tSafe("ui.report.sort_default", "균형잡힌");
    }
    if (sortSelection == "sortLiving") {
      sortName = tSafe("ui.report.sort_living", "주거우선");
    }
    if (sortSelection == "sortTrans") {
      sortName = tSafe("ui.report.sort_trans", "교통우선");
    }
    if (sortSelection == "sortInfra") {
      sortName = tSafe("ui.report.sort_infra", "인프라우선");
    }
    if (sortSelection == "sortEdu") {
      sortName = tSafe("ui.report.sort_edu", "교육우선");
    }
    if (sortSelection == "sortCustom") {
      sortName = tSafe("ui.report.sort_custom", "커스텀");
    }

    if (minValue == 0 && maxValue == 60) {
      priceRange = isEn ? "All Prices" : "가격 전체";
    } else if (minValue == 0 && maxValue != 60) {
      priceRange = isEn ? ("Price " + (maxValue / 2 * 100).toFixed(0) + "M or under") : ("가격 " + maxValue / 2 + "억 이하");
    } else if (minValue != 0 && maxValue == 60) {
      priceRange = isEn ? ("Price " + (minValue / 2 * 100).toFixed(0) + "M or over") : ("가격 " + minValue / 2 + "억 이상");
    } else {
      priceRange = isEn ? ("Price " + (minValue / 2 * 100).toFixed(0) + "M ~ " + (maxValue / 2 * 100).toFixed(0) + "M") : ("가격 " + minValue / 2 + "억~" + maxValue / 2 + "억");
    }

    var weightInfo = "";
    if (sortSelection == "sortDefault") {
      weightInfo = sortName + tSafe("ui.report.weight_default_suffix", " 가중치 (기본값)");
      weightInfo += `   |   ${priceRange}`;
    } else {
      var livingLabel = isEn ? "Living" : "주거";
      var transLabel = isEn ? "Transit" : "교통";
      var infraLabel = isEn ? "Infra" : "인프라";
      var eduLabel = isEn ? "Edu" : "교육";
      if (selectedRegion == "Seoul" || selectedRegion == "Incheon" || selectedRegion == "Gyeonggi" || selectedRegion == "Busan" || selectedRegion == "Daegu" || selectedRegion == "Daejeon" || selectedRegion == "Gwangju") {
        weightInfo = sortName + " : " + livingLabel + " " + valLiving + ", " + transLabel + " " + valTrans + ", " + infraLabel + " " + valInfra + ", " + eduLabel + " " + valEdu;
        weightInfo += `   |   ${priceRange}`;
      } else {
        weightInfo = sortName + " : " + livingLabel + " " + valLiving + ", " + infraLabel + " " + valInfra + ", " + eduLabel + " " + valEdu;
        weightInfo += `   ${priceRange}`;
      }
    }
    $("#weight").html(weightInfo);
  } else {
    $("#weight").hide();
  }
}

/**
 * @function radioActive
 * @description 통합검색창 아래의 검색 타입 라디오 버튼(지역 검색 vs 단지명 검색) 활성화 상태에 따라 안내 문구(예시)를 동적으로 변경합니다.
 * @param {string} val - 검색 타입 정보 ('local' 또는 'global')
 */
function radioActive(val) {
  searchType = val;

  if (selectedRegion == "Korea" && selectedSubRegion == "1000000000_Korea" && searchType == "local") {
    $("#unifiedSearchExample").html(tSafe("ui.search_example_korea_local", "예) 강남, 분당, 수지, 해운대"));
  } else {
    radioSelected = $('input[name="options"]:checked').val();
    if (radioSelected == "local") {
      $("#unifiedSearchExample").html(tSafe("ui.search_example_local", "예) 서초동, 래미안, 힐스테이트, 주공"));
    }
    if (radioSelected == "global") {
      $("#unifiedSearchExample").html(tSafe("ui.search_example_global", "예) 강남 래미안, 래미안 힐스테이트, 주공"));
    }
  }

  $("#inputUnifiedSearch").val("");
  goSearchBySearchType();
  $("#inputUnifiedSearch").focus();
}

/**
 * @function sidoChange
 * @description 시/도(특별시, 광역시, 도 등) 선택이 변경되었을 때 실행되는 함수.
 * 하위 지역구(군/구) 리스트를 갱신하고 테이블 및 지도 정보를 리로드합니다.
 */
function sidoChange() {
  regionSelection = true;
  optionChange();
  updateRegion();
}

/**
 * @function saveLocalStorage
 * @description 사용자가 최종적으로 선택한 상위 지역(시/도)과 하위 지역(군/구) 코드를 로컬 스토리지에 저장하여 다음 방문 시 상태를 유지합니다.
 */
function saveLocalStorage() {
  localStorage.setItem("lastRegion", selectedRegion);
  localStorage.setItem("lastSubRegion", selectedSubRegion);
  //localStorage.setItem('lastMonth', selectedMonth)

  //sessionStorage.setItem('lastRegion', selectedRegion)
  //sessionStorage.setItem('lastSubRegion', selectedSubRegion)
  //sessionStorage.setItem('lastMonth', selectedMonth)
}

/**
 * @function scrollUp
 * @description 화면 스크롤을 맨 위(Top)로 부드럽게 끌어올리는 스크롤 이동 함수.
 */
function scrollUp() {
  $("html, body").animate({ scrollTop: 0 }, 50);
}

/**
 * @function optionChange
 * @description 선택된 시/도에 종속된 군/구 셀렉트 옵션을 동적으로 초기화하고 변경합니다.
 * 월별 법정동 변경 이력(예: 강원특별자치도, 전북특별자치도) 및 세션 데이터를 보정하여 반영합니다.
 * @param {string} [subRegion] - 특정 군/구로의 강제 변경이 필요할 경우 지정하는 군/구 코드
 * @param {string} [upperReion] - 특정 시/도로의 강제 변경이 필요할 경우 지정하는 시/도 코드
 */
function optionChange(subRegion, upperReion) {
  selectedSubRegion = subRegion;
  if (upperReion == null || upperReion == "" || upperReion == undefined) {
    regionName = $("#sido option:selected").val();
  } else {
    regionName = upperReion;
    $("#gungu").val(selectedSubRegion).prop("selected", true);
  }
  selectedRegion = regionName;
  $("#sido").val(selectedRegion).prop("selected", true);

  var changeItem;

  if (regionName == "Korea") {
    changeItem = inKorea;
  }
  if (regionName == "Seoul") {
    changeItem = inSeoul;
  }
  if (regionName == "Busan") {
    changeItem = inBusan;
  }
  if (regionName == "Incheon") {
    changeItem = inIncheon;
  }
  if (regionName == "Daegu") {
    changeItem = inDaegu;
  }
  if (regionName == "Gwangju") {
    changeItem = inGwangju;
  }
  if (regionName == "Daejeon") {
    changeItem = inDaejeon;
  }
  if (regionName == "Ulsan") {
    changeItem = inUlsan;
  }
  if (regionName == "Sejong") {
    changeItem = inSejong;
  }
  if (regionName == "Gyeonggi") {
    changeItem = inGyeonggi;
  }
  if (regionName == "Gangwondo") {
    if (Number(selectedMonth) >= 202307) {
      changeItem = inNewGangwondo;
    } else {
      changeItem = inGangwondo;
    }
  }
  if (regionName == "Chungcheongbukdo") {
    changeItem = inChungcheongbukdo;
  }
  if (regionName == "Chungcheongnamdo") {
    changeItem = inChungcheongnamdo;
  }
  if (regionName == "Jeollabukdo") {
    if (Number(selectedMonth) >= 202404) {
      changeItem = inNewJeollabukdo;
    } else {
      changeItem = inJeollabukdo;
    }
  }
  if (regionName == "Jeonamgwangju") {
    changeItem = inJeollanamdo;
  }
  if (regionName == "Gyeongsangbukdo") {
    changeItem = inGyeongsangbukdo;
  }
  if (regionName == "Gyeongsangnamdo") {
    changeItem = inGyeongsangnamdo;
  }
  if (regionName == "Jejudo") {
    changeItem = inJejudo;
  }
  $("#gungu").empty();

  for (var i = 0; i < changeItem.length; i++) {
    var gunguVal = changeItem[i][1];
    var gunguText = getGunguText(changeItem[i][0], gunguVal);
    var subOption = $("<option value='" + gunguVal + "'>" + gunguText + "</option>");
    $("#gungu").append(subOption);
  }

  if (selectedSubRegion == undefined) {
    $("#gungu").val(changeItem[0][1]).prop("selected", true);
    selectedSubRegion = $("#gungu option:selected").val();
  } else {
    $("#gungu").val(selectedSubRegion).prop("selected", true);
  }
  //updateRegion()
}

var monthSelect = false;

/**
 * @function updateMonth
 * @description 데이터의 분석 월(Month) 선택이 변경되었을 때 호출되는 함수.
 * 해당 월의 데이터로 리스트를 업데이트하고 통합검색용 JSON 데이터를 새롭게 로드합니다.
 */
function updateMonth() {
  selectedMonth = $("#month option:selected").val();
  updateRegion();
  regionName = $("#sido option:selected").text();
  //saveLocalStorage()

  //통합검색
  if (selectedMonth >= 202211) {
    searching_url = pathPrefix + selectedMonth + "/Searching_list.json" + update_ver;
    $.getJSON(searching_url, function (json) {
      searchingData = json;
    });
  }
}
/**
 * @function updateRegion
 * @description 선택된 월과 지역 정보를 토대로 화면 구성을 갱신하고 데이터를 다시 로드하는 핵심 함수.
 * 로딩 인디케이터 표시, 필터 UI 표시 조건 설정, 그리고 일반 지역 테이블/탑랭크 테이블/전국 비교 테이블 업데이트 함수를 선택 실행합니다.
 */
function updateRegion() {
  reportBannerHtml();

  $("body").append(
    `<div id='pageLoadingBack'><div class='spinner-grow text-pageLoading' role='status'></div><div style='font-size: 0.85em; color: white'><br>${tSafe("ui.loading_region", "지역 정보를 불러오고 있어요!")}<br><br><div id='loading_reload' onClick='resetReload()'>${tSafe("ui.loading_retry", "로딩이 길다면 여기를 눌러 다시 불러오기!!")}</div></div></div>`,
  );
  minValue = 0;
  maxValue = 60;

  selectedRegion = $("#sido option:selected").val();
  selectedSubRegion = $("#gungu option:selected").val();

  localSearchText = shortRegionName($("#sido option:selected").text() + " " + $("#gungu option:selected").text());
  $("#localSearch").html(isEn ? (localSearchText + " Search") : (localSearchText + " 검색"));

  if (selectedSubRegion != "1000000000_Korea") {
    $("#commentWrapper").show();
    if (selectedSubRegion == "Living_Top300" || selectedSubRegion == "Trans_Top300" || selectedSubRegion == "Infra_Top300" || selectedSubRegion == "Edu_Top300" || selectedSubRegion == "Balanced_Top300") {
      //로딩
      $("#gradeSelector").hide();
      $("#filterOnOff").hide();
      $("#filterSelector").hide();
      updateTopTable(selectedMonth, selectedSubRegion);
    } else {
      //로딩
      $("#filterOnOff").show();
      if (filter_ui) {
        $("#gradeSelector").show();
        $("#filterSelector").show();
      }
      $("#dataList").html("");

      updateTable(selectedMonth, selectedSubRegion);
    }
  } else {
    $("#gradeSelector").hide();
    $("#filterOnOff").hide();
    $("#filterSelector").hide();
    updateRegionTable(selectedMonth, selectedSubRegion);
  }
  showWeight();
}

var show_list = [];
var hide_list = [];

/**
 * @function showHideListFiltered
 * @description 현재 설정된 평형(면적) 및 매매/전세 가격 필터링 값을 기준으로 단지 목록의 개별 항목들을 검사하여 화면에서 노출하거나 숨깁니다.
 * 최근 2년 이내의 실거래 데이터 필터링도 함께 반영합니다.
 * @param {Object} aptData - 필터링을 검사할 원본 아파트 데이터 객체
 */
function showHideListFiltered(aptData) {
  show_list = [];
  hide_list = [];
  for (i in aptData.data) {
    list_id = "aptSelect_" + aptData.data[i]["검색코드"];
    area_arr = aptData.data[i]["area_info"].split(",");
    sales_arr = aptData.data[i]["sales_info"].split(",");
    sales_date_arr = aptData.data[i]["sales_info"].split(",");
    rent_arr = aptData.data[i]["rent_info"].split(",");
    ratio_arr = aptData.data[i]["rent_ratio"].split(",");

    for (k in area_arr) {
      area_arr[k] = Number(area_arr[k].split("평")[0]);
      sales_arr[k] = Number(sales_arr[k].split("억")[0]);
      sales_date = sales_date_arr[k].split("(")[1];
      if (sales_date == undefined) {
        sales_date = -1;
      } else {
        sales_date = sales_date.replace(")", "");
        sales_date = sales_date.replaceAll("-", "");
      }
      sales_date_arr[k] = Number(sales_date);
      rent_arr[k] = Number(rent_arr[k].split("억")[0]);
      ratio_arr[k] = Number(ratio_arr[k]);
    }

    var temp_area_info = [];
    var temp_sales_price = [];
    var temp_rent_price = [];
    var temp_sales_date = [];
    var temp_rent_date = [];
    var temp_rent_ratio = [];

    for (i in area_arr) {
      if (i == 0) {
        temp_area_info[i] = area_arr[i];
        temp_sales_price[i] = sales_arr[i];
        temp_rent_price[i] = rent_arr[i];
        temp_rent_ratio[i] = ratio_arr[i];
        temp_sales_date[i] = sales_date_arr[i];
      } else {
        if (area_arr[i] == area_arr[i - 1]) {
          if (sales_date_arr[i] > area_arr[i - 1]) {
            temp_area_info[i] = area_arr[i];
            temp_sales_price[i] = sales_arr[i];
            temp_rent_price[i] = rent_arr[i];
            temp_rent_ratio[i] = ratio_arr[i];
            temp_sales_date[i] = sales_date_arr[i];
          }
        } else {
          temp_area_info[i] = area_arr[i];
          temp_sales_price[i] = sales_arr[i];
          temp_rent_price[i] = rent_arr[i];
          temp_rent_ratio[i] = ratio_arr[i];
          temp_sales_date[i] = sales_date_arr[i];
        }
      }
    }

    new_area_info = [];
    new_sales_price = [];
    new_rent_price = [];
    new_rent_ratio = [];

    for (i in temp_sales_date) {
      if (temp_sales_date[i] > years_ago_num) {
        new_area_info.push(temp_area_info[i]);
        new_sales_price.push(temp_sales_price[i]);
        new_rent_price.push(temp_rent_price[i]);
        new_rent_ratio.push(temp_rent_ratio[i]);
      }
    }

    if (checkListFiltered(new_area_info, new_sales_price, new_rent_price, new_rent_ratio)) {
      $("#" + list_id).show();
      show_list.push(list_id);
    } else {
      $("#" + list_id).hide();
      hide_list.push(list_id);
    }

    if (aptData.data[i] == undefined) {
      continue;
    }

    if (aptData.data[i]["매매타입"] == "분양(예정)" || aptData.data[i]["매매타입"] == "분양") {
      $("#aptSelect_" + aptData.data[i]["검색코드"]).show();
      show_list.push("aptSelect_" + aptData.data[i]["검색코드"]);
    }
  }
}

/**
 * @function checkListFiltered
 * @description 아파트의 평형 배열, 가격 배열, 전세가율 등을 기준으로 최소 하나의 평형 타입이 필터 조건에 부합하는지 여부를 검사합니다.
 * @param {Array} area_arr - 아파트의 평형 목록 배열
 * @param {Array} sales_arr - 아파트의 매매가 목록 배열
 * @param {Array} rent_arr - 아파트의 전세가 목록 배열
 * @param {Array} ratio_arr - 아파트의 전세가율 목록 배열
 * @returns {boolean} 필터링 통과 여부 (true: 노출, false: 숨김)
 */
function checkListFiltered(area_arr, sales_arr, rent_arr, ratio_arr) {
  area_filtered_list = return_area_FilteredData_onList(area_arr, sales_arr, rent_arr, ratio_arr);
  sPrice_filtered_list = return_sPrice_FilteredData_onList(area_filtered_list[0], area_filtered_list[1], area_filtered_list[2], area_filtered_list[3]);

  if (sPrice_filtered_list[0].length == 0) {
    return false;
  } else {
    return true;
  }
}

/**
 * @function return_area_FilteredData_onList
 * @description 평형(면적) 필터 슬라이더 범위 내에 속하는 아파트 타입 정보들만 추출하여 필터링된 배열로 반환합니다.
 * @param {Array} area_arr - 원본 평형 배열
 * @param {Array} sales_arr - 원본 매매가 배열
 * @param {Array} rent_arr - 원본 전세가 배열
 * @param {Array} ratio_arr - 원본 전세가율 배열
 * @returns {Array[]} 필터링된 [평형, 매매가, 전세가, 전세가율] 배열의 집합
 */
function return_area_FilteredData_onList(area_arr, sales_arr, rent_arr, ratio_arr) {
  filtered_area = [];
  filtered_sPrice = [];
  filtered_rPrice = [];
  filtered_ratio = [];

  for (var j in area_arr) {
    if (Number(area_arr[j]) >= area_min && Number(area_arr[j]) <= area_max) {
      filtered_area.push(Number(area_arr[j]));
      filtered_sPrice.push(Number(sales_arr[j]));
      filtered_rPrice.push(Number(rent_arr[j]));
      filtered_ratio.push(Number(ratio_arr[j]));
    }
  }

  return [filtered_area, filtered_sPrice, filtered_rPrice, filtered_ratio];
}

/**
 * @function return_sPrice_FilteredData_onList
 * @description 매매 가격 필터 슬라이더 범위 내에 속하는 아파트 타입 정보들만 추출하여 필터링된 배열로 반환합니다.
 * @param {Array} area_arr - 평형 필터가 적용된 평형 배열
 * @param {Array} sales_arr - 평형 필터가 적용된 매매가 배열
 * @param {Array} rent_arr - 평형 필터가 적용된 전세가 배열
 * @param {Array} ratio_arr - 평형 필터가 적용된 전세가율 배열
 * @returns {Array[]} 필터링된 [평형, 매매가, 전세가, 전세가율] 배열의 집합
 */
function return_sPrice_FilteredData_onList(area_arr, sales_arr, rent_arr, ratio_arr) {
  filtered_area = [];
  filtered_sPrice = [];
  filtered_rPrice = [];
  filtered_ratio = [];

  if (sPrice_max == f_sales_price_max) {
    max_price = 1000;
  }

  no_sales = sales_arr.every((num) => (num = -1));
  if (!filtered && no_sales) {
    filtered_area.push(Number(area_arr[j]));
    filtered_sPrice.push(Number(sales_arr[j]));
    filtered_rPrice.push(Number(rent_arr[j]));
    filtered_ratio.push(Number(ratio_arr[j]));
  }

  for (var j in sales_arr) {
    if (Number(sales_arr[j]) >= sPrice_min && Number(sales_arr[j]) <= max_price) {
      filtered_area.push(Number(area_arr[j]));
      filtered_sPrice.push(Number(sales_arr[j]));
      filtered_rPrice.push(Number(rent_arr[j]));
      filtered_ratio.push(Number(ratio_arr[j]));
    }
  }

  return [filtered_area, filtered_sPrice, filtered_rPrice, filtered_ratio];
}

var svg_loc = "";

/**
 * @function updateTable
 * @description 특정 월과 지역(군/구)의 아파트 JSON 데이터(랭크/입지점수/거래정보 등)를 원격 서버에서 페치하여 UI 리스트와 지도 마커를 갱신합니다.
 * 행정구역 동(Dong) 단위의 탭 버튼 필터 생성, 준공년차 보정, 가격 정보 포맷팅, 광고(Partnership) 배너 노출도 함께 처리합니다.
 * @param {string} month - 분석 년월 (예: "202605")
 * @param {string} region - 지역구 법정동 코드 (예: "1168000000_Seoul_Gangnam")
 */
function updateTable(month, region) {
  removeMarkers();
  $("#rearrangeScore").prop("checked", true);

  $("#sort").css("visibility", "visible");
  $("#rearrange").css("visibility", "visible");
  //initSorting()
  regionCountUp(pageName, region); //20231020

  $("#dataList").html("");
  $("#dataList").html("<div id='tableLoading' style='display: grid; text-align: center; justify-items: center;'><br><br><br><div class='spinner-border text-danger' role='status'></div></div>");

  //강원특별자치도 변경으로 인한 코드 변경
  if (Number(month) < 202307 && region.substr(0, 2) == "51") {
    region = region.replace("51", "42");
  }
  //전북특별자치도 변경으로 인한 코드 변경
  if (Number(month) < 202404 && region.substr(0, 2) == "52") {
    region = region.replace("52", "45");
  }

  //광고정보 로딩
  $.ajaxSetup({ async: false });
  load_parrtnership(region);
  $.ajaxSetup({ async: true });

  url = "https://www.realrankus.com/" + month + "/" + region + ".json" + update_ver;


  $.getJSON(url, function (json) {
    aptData = json;
    aptData_original = deepCopy(aptData);
    sortData = deepCopy(aptData);
    itemNum = json.data.length;
    valueSum = 0;
    livingSum = 0;
    transportSum = 0;
    infraSum = 0;
    eduSum = 0;
  })
    .done(function () {
      $("#dataList").html("");
      //광고정보표시
      show_partnership();

      //동 DB 만들기
      dongDB = [];
      $("#dataList").append("<div class='dong_selector'><div id='dong_list'></div></div>");
      var dong_name = "";
      for (var j = 0; j < itemNum; j++) {
        var split_addr = aptData.data[j]["법정동주소"].split(" ");
        law_addr_en = aptData.data[j]["Law_Addr_EN"];
        if (law_addr_en == undefined) {
          law_addr_en = "";
        }
        var split_addr_en = law_addr_en.split(" ");

        if (isEn) {
          dong_name = split_addr_en[2];
        }
        else {
          dong_name = split_addr[2];
        }

        if (split_addr[0] == "경기도" || split_addr[0] == "충청남도" || split_addr[0] == "충청북도" || split_addr[0] == "전북도" || split_addr[0] == "전라북도" || split_addr[0] == "경상북도" || split_addr[0] == "경상남도") {
          if (
            split_addr[1] == "고양시" ||
            split_addr[1] == "안양시" ||
            split_addr[1] == "안산시" ||
            split_addr[1] == "수원시" ||
            split_addr[1] == "용인시" ||
            split_addr[1] == "성남시" ||
            split_addr[1] == "부천시" ||
            split_addr[1] == "화성시" ||
            split_addr[1] == "천안시" ||
            split_addr[1] == "청주시" ||
            split_addr[1] == "전주시" ||
            split_addr[1] == "포항시" ||
            split_addr[1] == "창원시"
          ) {
            if (isEn) {
              dong_name = split_addr_en[3];
            }
            else {
              dong_name = split_addr[3];
            }
          }
        }
        dongDB.push(dong_name);

        //동 이름 중복 제거
        var filtered_dongDB = dongDB.filter((element, index) => {
          return dongDB.indexOf(element) === index;
        });
        filtered_dongDB = filtered_dongDB.sort();
        filtered_dongDB.unshift(" <i class='fa-regular fa-thumbs-up'></i>");
        if (isEn) {
          filtered_dongDB.unshift("All");
        } else {
          filtered_dongDB.unshift("전체");
        }
      }
      dongDB = [];
      //동DB에 인덱스 포함해서 저장
      for (var dongIndex = 0; dongIndex < filtered_dongDB.length; dongIndex++) {
        dongDB.push([filtered_dongDB[dongIndex], dongIndex]);
      }

      let devide_num = 4;
      let dong_cell_width_tunning = 10;
      if (window.innerWidth <= 800) {
        if (isEn) {
          devide_num = 3;
          dong_cell_width_tunning = 0
        }
        dong_cell_width = (window.innerWidth / devide_num) * (7 / 8);
        btn_width = dong_cell_width - dong_cell_width_tunning + "px";
      } else {
        dong_cell_width = 90;
        btn_width = 90
        if (isEn) {
          dong_cell_width = 130;
          btn_width = 120
        }
      }

      //var columns = "repeat(" + dongDB.length + ", " + dong_cell_width + "px)";
      var columns = "repeat(" + dongDB.length + ", " + dong_cell_width + "px)";

      $("#dong_list").css({ "grid-template-columns": columns });

      var dong_list_html = "";
      for (var dongIndex = 0; dongIndex < dongDB.length; dongIndex++) {
        selection_id = "dong_" + dongDB[dongIndex][1];
        dong_name = dongDB[dongIndex][0];
        if (isEn && dongIndex > 1) {
          //dong_name을 "-"기준으로 split해서 마지막 단어만 추출 (예: "Gaepo-dong" -> "Gaepo")
          var dong_name_split = dong_name.split("-");
          dong_name = dong_name_split[0];
        }
        dong_list_html += `<div><input type='radio' class='btnRadio_tab' name='dong_select' autocomplete='off' id=${selection_id} onClick='dong_filter(this)'><label class='btn btn-outline-danger' id='dong_select_${dongDB[dongIndex][1]}' for='${selection_id}'>#${dong_name}</label></div>`;
      }
      $("#dong_list").html(dong_list_html);
      $("#dong_0").prop("checked", true);

      selector_width = $(".dong_selector").width();
      inner_width = dong_cell_width * dongDB.length;

      if (isMobile) {
        $(".dong_selector").css({ height: "37px" });
        $(".btnRadio_tab+label").css({ width: btn_width });
      } else {
        $(".btnRadio_tab+label").css({ width: btn_width });
        if (selector_width < inner_width) {
          $(".dong_selector").css({ height: "50px" });
        } else {
          $(".dong_selector").css({ height: "37px" });
        }
      }

      $("#dataList_wrapper").css({
        "margin-top": $("#titleBar").height() + $("#selections").height() + $("#weight").height() + $(".dong_selector").height() + 25,
        height: window.innerHeight - ($("#titleBar").height() + $("#selections").height() + $("#weight").height() + $(".dong_selector").height() + 23 + $("#linkToAptrank_bottom").height()),
      });

      if (isMobile) {
        $("#dataMap").css({
          "margin-top": $("#titleBar").height() + $("#selections").height() + $("#weight").height() + 20,
          height: window.innerHeight - ($("#titleBar").height() + $("#selections").height() + $("#weight").height() + $("#linkToAptrank_bottom").height() + 20),
        });
      }
      //동 DB 생성 완료

      internalSearching = [];

      for (var i = 0; i < itemNum; i++) {
        var aptName = aptData.data[i]["아파트명"];
        var aptName_en = aptData.data[i]["APT_Name_EN"];
        var apt_m = aptData.data[i]["전용면적(m2)"];
        var apt_p = aptData.data[i]["전용면적(평)"];

        var apt_type = aptData.data[i]["매매타입"];

        var aptAddress = aptData.data[i]["법정동주소"];
        var aptAddress2 = aptData.data[i]["도로명주소"];
        var aptAddress_en = aptData.data[i]["Law_Addr_EN"];
        var aptAddress2_en = aptData.data[i]["Road_Addr_EN"];

        var aptValue = Math.round(aptData.data[i]["가치 총점"] * 100) / 100;
        var house_num = aptData.data[i]["세대수"];

        //aptData.data[i]["rank"] 값이 null 또는 undefined인 경우, for문을 건너뛰도록 처리
        if (aptData.data[i]["rank"] == null || aptData.data[i]["rank"] == undefined) {
          aptData.data[i]["rank"] = 0
        }
        var rank = aptData.data[i]["rank"].toFixed();
        var last_sales = aptData.data[i]["last_sales"].split(",");
        var last_sales_date = last_sales[0].toString();
        var last_sales_price = last_sales[1].toString();
        var last_sales_area = last_sales[2];
        last_sales_date_short = last_sales_date.substr(2);

        if (aptAddress_en == undefined || aptAddress_en == null) {
          aptAddress_en = "";
        }

        var split_addr = aptAddress.split(" ");
        var split_addr_en = aptAddress_en.split(" ");

        var compare_dong_name = split_addr[2];
        var compare_dong_name_en = split_addr_en[2];

        var str_last_sales_price = last_sales_price;

        if (isEn) {
          compare_dong_name = split_addr_en[2];
          last_sales_area = last_sales_area.replace("평", "py");
          //str_last_sales_price를 달러로 환산하여 표기
          str_last_sales_price = `${Math.round((last_sales_price * exchange_rate) / 10000) / 100}M$`;

          //str_last_sales_date를 영어권 국가에서 일반적으로 사용하는 날짜 포맷인 "MMM DD YYYY"로 변환하여 표기 (예: "Mar 2023")
          var dateObj = new Date(last_sales_date);
          if (isNaN(dateObj.getTime())) {
            str_last_sales_date = last_sales_date;
          } else {
            var options = { year: "numeric", month: "short", day: "numeric" };
            str_last_sales_date = dateObj.toLocaleDateString("en-US", options);
          }

        } else {
          compare_dong_name = split_addr[2];
          str_last_sales_price = Math.round(last_sales_price / 100) / 100 + "억";
          str_last_sales_date = last_sales_date_short;
        }
        if (
          split_addr[1] == "고양시" ||
          split_addr[1] == "안양시" ||
          split_addr[1] == "안산시" ||
          split_addr[1] == "수원시" ||
          split_addr[1] == "용인시" ||
          split_addr[1] == "성남시" ||
          split_addr[1] == "부천시" ||
          split_addr[1] == "화성시" ||
          split_addr[1] == "천안시" ||
          split_addr[1] == "청주시" ||
          split_addr[1] == "전주시" ||
          split_addr[1] == "포항시" ||
          split_addr[1] == "창원시"
        ) {
          if (isEn) {
            compare_dong_name = split_addr_en[3];
          } else {
            compare_dong_name = split_addr[3];
          }
        }

        valueSum += aptData.data[i]["가치 총점"];
        livingSum += aptData.data[i]["주거총점"];
        transportSum += aptData.data[i]["교통총점"];
        infraSum += aptData.data[i]["인프라총점"];
        eduSum += aptData.data[i]["학군총점"];

        var searchCode = aptData.data[i]["검색코드"];

        complex_grade = setGrade(aptValue);
        internalSearching[i] = {
          아파트명: aptName,
          법정동주소: aptAddress2,
          검색코드: searchCode,
          시도: selectedRegion,
          군구: selectedSubRegion,
        };

        if (i == 3) {
          $("#dataList").append(report_banner_html);
        }

        //가격필터 적용 시
        if (checkPrice(last_sales[1])) {
          for (var j = 0; j < dongDB.length; j++) {
            var dong_compare = dongDB[j][0];
            list_id = "aptSelect_" + searchCode;
            if (compare_dong_name == dong_compare) {
              var dongClass = "dong_" + dongDB[j][1];
              var addon_html = "<div class='listBox2 " + dongClass + "' id='" + list_id + "' onClick='showDetail(" + i + ")' value=" + i + ">";
              break;
            }
          }


          addon_html += `
              <div class='rank_content'>
              <div class='ranksame'>RANK</div>
              <div class='rank'>${complex_grade}</div>
              </div>
            `;

          addon_html += `<div class='content'>`;
          //addon_html += "<div class='apt_name'>" + aptName + " " + apt_p + "(" + apt_m + ")</div>";


          if (isEn) {
            aptName = aptName_en
          }
          str_years = tSafe("ui.report.years_suffix", "년차");
          str_reconstruction = tSafe("ui.report.reconstruction", "재건축");
          str_pre_sale = tSafe("ui.report.presale", "분양권");
          str_pre_sale_planned = tSafe("ui.report.presale_scheduled", "분양예정");
          str_expected = tSafe("ui.report.presale_expected", "예정");
          str_unknown_house_num = tSafe("ui.report.unknown_house_num", "세대수 미정");
          str_no_sales_info = tSafe("ui.report.no_sales_info", "거래 정보 없음");
          str_house_num = tSafe("ui.report.house_num_unit", "세대");

          if (isEn) {
            var dateObj = new Date(aptData.data[i]["준공년월"]);
            if (isNaN(dateObj.getTime())) {
              str_expected_month = aptData.data[i]["준공년월"];
            } else {
              str_expected_month = dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short" });
            }
          }
          else {
            str_expected_month = aptData.data[i]["준공년월"].substr(0, 7)
          }

          addon_html += `<div class='apt_name'>${aptName}`;

          if (Number(selectedMonth) > 202203) {
            if (apt_type == "아파트") {
              addon_html += `<span class='aptYear'> (${aptData.data[i]["준공년차"]}${str_years})</span></div>`;
            }
            if (apt_type == "재건축") {
              addon_html += `<span class='aptYear'> (${aptData.data[i]["준공년차"]}${str_years}, ${str_reconstruction})</span></div>`;
            }
            if (apt_type == "분양권") {
              addon_html += `<span class='aptYear'> (${str_pre_sale}, ${str_expected_month} ${str_expected})</span></div>`;
            }
            if (apt_type == "분양(예정)") {
              addon_html += `<span class='aptYear'> (${str_pre_sale_planned})</span></div>`;
            }
          } else {
            addon_html += `<span class='aptYear'> (${aptData.data[i]["준공년차"]}${str_years})</span></div>`;
          }

          if (house_num == null || house_num == undefined || house_num == "") {
            addon_html += `<div class='apt_info'>${str_unknown_house_num} / <span class='aptPrice'>${str_no_sales_info}</span></div>`;
          } else {
            if (last_sales_date == "1800-01-01") {
              addon_html += `<div class='apt_info'>${house_num.toLocaleString()}${str_house_num} / <span class='aptPrice'>${str_no_sales_info}</span></div>`;
            } else {
              addon_html += `<div class='apt_info'>${house_num.toLocaleString()}${str_house_num} / <span class='aptPrice'>${str_last_sales_price}, ${last_sales_area}, ${str_last_sales_date}</span></div>`;
            }
          }

          shown_address = "";
          if (isEn) {
            shown_address = aptAddress_en;
          }
          else {
            shown_address = aptAddress;
          }

          if (Number(selectedMonth) > 202203 && (apt_type == "분양권" || apt_type == "분양(예정)")) {
            addon_html += `<div class='apt_address'>${shown_address}</div>`;
          } else {
            addon_html += `<div class='apt_address'>${shown_address}</div>`;
          }

          addon_html += `
              </div>
              <div class='value_score'>
            `;
          //"<div class='value_score'>" + (Math.round(aptValue * 100) / 100).toFixed(2) + "점</div>";
          //"<div class='value_score'></div>";
          addon_html += `
                  <div class='complex_list_like' id='complex_${searchCode}\'>
                  <div><i class='fa-solid fa-thumbs-up'></i></div>
                  <div id='complex_like_num_${searchCode}\'>0</div>
                  </div>
                  </div>
                  </div>
                `;

          $("#dataList").append(addon_html);

          showHideListFiltered(aptData);
        }
      }

      $("#dataList").append("<div id='blank_list' style='height: " + blank_height + "'></div>");
      if (!(minValue == 0 && maxValue == 60)) {
        $(".aptPrice").css({ color: "#fe4040", "font-weight": "600" });
      }

      if (sortSelection != "sortDefault") {
        changeSort();
      }

      if (!come_from_map) {
        region_code = selectedSubRegion.split("_")[0];

        for (var i in level1_loc) {
          if (level1_loc[i]["법정동코드"] + "" == region_code) {
            new_center = new naver.maps.LatLng(aptData.data[0]["Y"], aptData.data[0]["X"]);

            defaultMap.setCenter(new_center);
            current_zoom = defaultMap.getZoom();

            if (current_zoom < 14) {
              defaultMap.setZoom(16);
            }

            origin_lat = level1_loc[i]["lat"];
            origin_lng = level1_loc[i]["lng"];


            nearby_region = [];
            nearby_region = findNearbyRegion(origin_lat, origin_lng, 15);

            show_up_complexs = [];
            show_up_complexs = defineMarkerList(nearby_region);

            showHideMarker(current_zoom);
            $("#pageLoadingBack").remove();

            break;
          }
        }
      } else {
        come_from_map = false;
        showHideMarker(current_zoom);
        $("#pageLoadingBack").remove();
      }

      if (temp_code != "") {
        complex_idx = searchAndShow(temp_code);
        if (aptData.data[complex_idx]) {
          map_center = {
            lat: aptData.data[complex_idx]["Y"],
            lng: aptData.data[complex_idx]["X"],
          };
          defaultMap.setCenter(map_center);
        }

        temp_code = "";
        temp_coord = "";

        showDetail(complex_idx);
      }

      if (selectedComplex != "") {
        $("html").scrollTop(70 * Number(selectedComplex));

        var selectedComplexNum = selectedComplex;

        map_center = {
          lat: aptData.data[selectedComplex]["Y"],
          lng: aptData.data[selectedComplex]["X"],
        };

        setTimeout(function () {
          if (defaultMap) {
            defaultMap.setCenter(map_center);
            showDetail(selectedComplexNum);
          } else {
            setTimeout(function () {
              defaultMap.setCenter(map_center);
              showDetail(selectedComplexNum);
            }, 500);
          }
        }, 500);

        selectedComplex = "";
      }

      if (searched_code != "") {
        pos = searchAndShow(searched_code);
        $("html").scrollTop(70 * pos);
        showDetail(pos);
        searched_code = "";
      }
      complex_list_like_status();
      $("#pageLoadingBack").remove();
    })
    .fail(function (jqXMLHttpRequest, status, error) {
      $("#gungu option:eq(0)").prop("selected", true);
      var changeRegion = $("#gungu > option:selected").val();
      updateTable(month, changeRegion);
    });

  showWeight();
  saveLocalStorage();
  showHideListFiltered(aptData);
}

/**
 * @function searchAndShow
 * @description 통합검색 결과 클릭 혹은 외부 유입 코드를 통해 유입된 경우, 특정 아파트 검색코드를 검색하여 전체 리스트 내에서의 배열 인덱스를 찾아 반환합니다.
 * @param {string} searched_code - 찾고자 하는 아파트 고유 검색코드
 * @returns {number} 현재 데이터 리스트 내에서의 해당 아파트 인덱스
 */
function searchAndShow(searched_code) {
  findArray = "";
  if (sortSelection != "sortDefault") {
    findArray = sortData.data;
  } else {
    findArray = aptData.data;
  }

  var itemNums = findArray.length;
  for (var p = 0; p < itemNums; p++) {
    var aptCode = findArray[p]["검색코드"];
    if (aptCode == searched_code) {
      return p;
    }
  }
}

var detail_loading = false;

/**
 * @function showDetail
 * @description 아파트 리스트 아이템 또는 지도 마커 클릭 시 동작하며, 상세 입지 등급(S/A/B/C), 교통(30분/1시간 도착역), 교육(학업성취도, 학원가), 인프라, 실거래 가격 추이 차트, 층간소음 여부 등의 정밀 분석 모달창을 빌드하여 보여줍니다.
 * @param {number} index - 상세 정보를 볼 아파트 데이터의 배열 인덱스
 */
function showDetail(index) {
  if (isMobile) {
    $(".modal-backdrop").css({ width: "100%" });
    $("#baseModal").css({ width: "100%" });
  } else {
    $(".modal-backdrop").css({ width: "600px" });
    $("#baseModal").css({ width: "600px" });
  }

  detail_loading = true;
  titleHtml = "";
  detailHtml = "";
  footerHtml = "";
  var avgTransportScore = 0;

  aptData = sortData;

  var aptName = aptData.data[index]["아파트명"];
  if (isEn) {
    aptName = aptData.data[index]["APT_Name_EN"];
  }
  if(aptData.data[index]["rank"] == null || aptData.data[index]["rank"] == undefined) {
    aptData.data[index]["rank"] = 0;
  }
  var rank = aptData.data[index]["rank"].toFixed();
  var apt_m = aptData.data[index]["전용면적(m2)"];
  var apt_p = aptData.data[index]["전용면적(평)"];
  var apt_type = aptData.data[index]["매매타입"];
  var sidoVal = $("#sido option:selected").val();
  var gunguVal = $("#gungu option:selected").val();
  var aptAddress = aptData.data[index]["도로명주소"];
  if (isEn) {
    aptAddress = aptData.data[index]["Road_Addr_EN"];
  }
  var legalAddress = aptData.data[index]["법정동주소"];
  if (isEn) {
    legalAddress = aptData.data[index]["Law_Addr_EN"];
  }

  var aptValue = Math.round(aptData.data[index]["가치 총점"] * 100) / 100;
  var aptDuration = aptData.data[index]["준공년차"];
  var aptYear = "";
  var short_name = $("#sido option:selected").text() + " " + $("#gungu option:selected").text();

  var aptRank = "";

  complex_grade = setGrade(aptValue);

  changeMetaTag(aptName, legalAddress, rank, $("#gungu option:selected").text(), kakaoShareURL, aptValue);

  //post(aptName, log_date, short_name)

  if (sortSelection == "sortDefault" && rearrangeAPTSelection == "rearrangeScore") {
    aptRank = isEn ? ("Rank " + rank + "/" + aptData.data[itemNum - 1]["rank"]) : (rank + "/" + aptData.data[itemNum - 1]["rank"] + tSafe("ui.report.rank_suffix", "위"));
  } else {
    aptRank = isEn ? ("Rank " + (Number(index) + 1) + "/" + itemNum) : (Number(index) + 1 + "/" + itemNum + tSafe("ui.report.rank_suffix", "위"));
  }

  if (Number(selectedMonth) > 202211) {
    eventURL = aptData.data[index]["sURL"];
  } else {
    eventURL = "";
  }

  gtag("event", "아파트상세", {
    event_category: short_name,
    event_label: aptName + "(" + short_name + ")",
  });

  var tReconstruction = tSafe("ui.report.reconstruction", "재건축");
  var tExpected = tSafe("ui.report.presale_expected", "예정");
  var tPresaleScheduled = tSafe("ui.report.presale_scheduled", "분양예정");
  var tReconstructionEligible = tSafe("ui.report.reconstruction_eligible", "재건축");
  var tYearsSuffix = tSafe("ui.report.years_suffix", "년차");

  //aptData.data[index]["준공년월"]을 영어표기법으로 변환하여 aptYear_en에 저장 (예: "Mar 2023")
  aptYear = aptData.data[index]["준공년월"]
  aptYear_en = new Date(aptData.data[index]["준공년월"]).toLocaleString("en-US", { month: "short", year: "numeric" });
  if (isEn) {
    aptYear = aptYear_en
  }

  if (apt_type == "아파트") {
    aptYear = aptYear + " (" + aptDuration + tYearsSuffix + ")";
  }
  if (apt_type == "재건축") {
    aptYear = aptYear + " (" + aptDuration + tYearsSuffix + ", " + tReconstruction + ")";
  }
  if (apt_type == "분양권") {
    aptYear = "(" + (isEn ? "Pre-sale" : "분양권") + ", " + aptYear + " " + tExpected + ")";
  }
  if (apt_type == "분양(예정)") {
    aptYear = "(" + tPresaleScheduled + ")";
  }

  var tStationSuffix = tSafe("ui.report.station_suffix", "역");
  var tCountSuffix = isEn ? "" : "개";

  var nearestStation = aptData.data[index]["가까운역이름"] + tStationSuffix + "(" + (Math.round(aptData.data[index]["가까운역거리"] * 100) / 100).toFixed() + "m)";
  if (isEn) {
    nearestStation = aptData.data[index]["closest_station"] + " (" + (Math.round(aptData.data[index]["가까운역거리"] * 100) / 100).toFixed() + "m)";
  }
  var stationArea = aptData.data[index]["역세권여부"];
  var stationPoint_30m = aptData.data[index]["30분이내주요거점역"];
  var stationPoint_1h = aptData.data[index]["1시간이내주요거점역"];
  var departmentStore_3km = aptData.data[index]["3km이내백화점수"] + tCountSuffix;
  var OutletMall_5km = aptData.data[index]["5km이내아울렛몰수"] + tCountSuffix;
  var bigMart_1km = aptData.data[index]["1km이내대형먀트수"] + tCountSuffix;
  var bank_500m = aptData.data[index]["500m이내은행수"] + tCountSuffix;
  var hospital_500m = aptData.data[index]["500m이내병원수"] + tCountSuffix;
  var bigHospital_5km = aptData.data[index]["5km이내대형병원수"] + tCountSuffix;
  var park_500m = aptData.data[index]["500m이내공원수"] + tCountSuffix;
  var big_park_1km = aptData.data[index]["800m이내대형공원수"] + tCountSuffix;
  var harmful_3km = aptData.data[index]["3km이내혐오시설수"] + tCountSuffix;
  var pSchool_edu = aptData.data[index]["초등학교학업성취도"];
  var pSchool_distance = aptData.data[index]["초등학교거리"];
  var mSchool_edu = aptData.data[index]["중학교학업성취도"];
  mSchool_edu = Number(mSchool_edu).toFixed(1) + "%";

  var academyCount = aptData.data[index]["500m이내학원가"];
  var academyTotal = aptData.data[index]["500m이내학원수"];
  var academy_edu = isEn
    ? (academyCount + " area(s) (" + academyTotal + " in total)")
    : (academyCount + "개(총 " + academyTotal + "개 학원)");

  if (Number(selectedMonth) > 202208) {
    var academyCountLong = aptData.data[index]["1km이내학원가"];
    var academyTotalLong = aptData.data[index]["1km이내학원수"];
    var academy_edu_long = isEn
      ? (academyCountLong + " area(s) (" + academyTotalLong + " in total)")
      : (academyCountLong + "개(총 " + academyTotalLong + "개 학원)");
  }

  var marketCount = aptData.data[index]["300m이내상권"];
  var marketTotal = aptData.data[index]["300m이내점포수"];
  var market_infra = isEn
    ? (marketCount + " area(s) (" + marketTotal + " in total)")
    : (marketCount + "개(총 " + marketTotal + "개 지점)");

  var livingScore = (Math.round(aptData.data[index]["주거총점"] * 100) / 100).toFixed(2);
  var transportScore = (Math.round(aptData.data[index]["교통총점"] * 100) / 100).toFixed(2);
  var infraScore = (Math.round(aptData.data[index]["인프라총점"] * 100) / 100).toFixed(2);
  var eduScore = (Math.round(aptData.data[index]["학군총점"] * 100) / 100).toFixed(2);
  var area_info = aptData.data[index]["area_info"];
  if (Number(selectedMonth) > 202203) {
    var maintainance = aptData.data[index]["maintenance"];
  }
  var rooms = aptData.data[index]["room"];
  var baths = aptData.data[index]["bath"];
  var house_num = aptData.data[index]["세대수"];
  if (house_num == null || house_num == undefined || house_num == "") {
    house_num = "--";
  }
  var parking = aptData.data[index]["주차"];
  var heating = aptData.data[index]["난방"];
  var entrance = aptData.data[index]["현관구조"];
  if (isEn) {
    if (parking && typeof parking === 'string') {
      //parking에 데이터가 없으면 "TBD"로 표기
      if (parking == "" || parking == null || parking == undefined || parking == "미정") {
        parking = "TBD";
      }
      else {
        parking = parking.replace("세대당 ", "").replace("대", " per household");
      }
    }
    if (heating && typeof heating === 'string') {
      var heatingDict = {
        "개별난방": "Individual",
        "지역난방": "District",
        "중앙난방": "Central",
        "도시가스": "City Gas",
        "미정": "TBD"
      };
      heating = heatingDict[heating] || heating;
    }
    if (entrance && typeof entrance === 'string') {
      var entranceDict = {
        "계단식": "Staircase",
        "복도식": "Corridor",
        "복합식": "Mixed",
        "미정": "TBD"
      };
      entrance = entranceDict[entrance] || entrance;
    }
  }
  var sales_info = aptData.data[index]["sales_info"];
  var price_per = aptData.data[index]["price_per"];
  var floor_noise = aptData.data[index]["층간소음"];

  var searchCode = aptData.data[index]["검색코드"];
  var coord_y = aptData.data[index]["Y"];
  var coord_x = aptData.data[index]["X"];

  var drink_pub = aptData.data[index]["300m이내유흥주점"];
  var daran_pub = aptData.data[index]["300m이내단란주점"];
  var motel = aptData.data[index]["300m이내모텔"];

  var last_sales = aptData.data[index]["last_sales"].split(",");
  var last_sales_date = last_sales[0].toString();
  var last_sales_price = last_sales[1].toString();
  var last_sales_area = last_sales[2];

  detail_complex = aptName;
  detail_searchCode = searchCode;
  realrankus_visit(searchCode, $("#sido option:selected").text(), short_name, short_name + " " + dong_name);

  //firebase database comment path
  docRef = comment_db
    .collection("realrankus_comment")
    .doc(selectedSubRegion)
    .collection("complex")
    .doc(searchCode + "");
  setWriteBox();
  read_comment("top");
  //}

  var rent_info = aptData.data[index]["rent_info"];
  var rent_ratio = aptData.data[index]["rent_ratio"];
  var last_rent = aptData.data[index]["last_rent"].split(",");
  var last_rent_date = last_rent[0].toString();
  var last_rent_price = last_rent[1].toString();
  var last_rent_area = last_rent[2];

  var floor_rate = aptData.data[index]["용적률"];
  if (floor_rate == "0" || floor_rate == 0 || floor_rate == undefined || isNaN(floor_rate)) {
    floor_rate = "--%";
  } else {
    floor_rate = Number(aptData.data[index]["용적률"]).toFixed(0) + "%";
  }

  var cover_rate = aptData.data[index]["건폐율"];
  if (cover_rate == "0" || cover_rate == 0 || cover_rate == undefined || isNaN(cover_rate)) {
    cover_rate = "--%";
  } else {
    cover_rate = Number(aptData.data[index]["건폐율"]).toFixed(0) + "%";
  }

  var populationScore = Math.round(aptData.data[index]["인구총점"] * 100) / 100;
  var jobScore = Math.round(aptData.data[index]["일자리총점"] * 100) / 100;

  shareURL = aptData.data[index]["sURL"];
  kakaoShareURL = "https://www.realrankus.com" + "?reg=" + selectedRegion + "&sub=" + selectedSubRegion + "&mon=" + selectedMonth + "&complex=" + index + "&sort=" + sortSelection + "&apt=" + short_name + " " + aptName;

  //타이틀
  //titleHtml += "<div class='popupTitle'>" + aptName + " " + apt_p + "(" + apt_m + ")</div>";
  //titleHtml += "<div class='popupTitle'><a href='#' onclick='return false;' style='text-decoration: none; color: black'>" + aptName + "</a></div>";
  titleHtml += `
        <div class='popupTitle'><h1 style='font-size: 1em; font-weight:600'>${aptName}</h1></div>
        <div class='popupSubtitle'>${aptYear}</div>
      `;

  //aptAddress가 null인경우 방어코드 추가
  if (aptAddress == null || aptAddress == undefined) {
    aptAddress = "--";
  }

  if (apt_type == "분양권" || apt_type == "분양(예정)") {
    titleHtml += `<div class='popupSubtitle'>${legalAddress}</div>`;
  } else {
    titleHtml += `
          <div class='popupSubtitle' style='font-size: 0.6em'>${isEn ? "(Road)" : "(신)"} ${aptAddress}</div>
          <div class='popupSubtitle' style='font-size: 0.6em'>${isEn ? "(Jibun)" : "(구)"} ${legalAddress}</div>
        `;
  }
  
  detailHtml += `
        <div class='card'>
        <div id='complex_visit_info'><div class='spinner-border spinner-border-sm' role='status'></div></div>
        <div class='card-body' style='padding-top: 5px; padding-bottom: 5px;'>
        <div class='complex_like'>
      `;

  detailHtml += `
              <div class='complex_like_category'>
              <div class='complex_like_living' onclick='complex_like_updown("living", "${searchCode}", "${aptName}")'>
              <div class='complex_like_name'>${tSafe('ui.report.living', '주거')}</div>
              <div class='complex_like_num' id='complex_like_living_${searchCode}'>
              <div class='complex_like_thumb'><i class='fa-regular fa-thumbs-up'></i></div>
              <div id='complex_like_num_living_${searchCode}'>##</div>
              </div>
              </div>
              </div>
            `;

  if (stationArea != "NA") {
    detailHtml += `
                <div class='complex_like_category'>
                <div class='complex_like_trans' onclick='complex_like_updown("trans", "${searchCode}", "${aptName}")'>
                <div class='complex_like_name'>${tSafe('ui.report.transport', '교통')}</div>
                <div class='complex_like_num' id='complex_like_trans_${searchCode}'>
                <div class='complex_like_thumb'><i class='fa-regular fa-thumbs-up'></i></div>
                <div id='complex_like_num_trans_${searchCode}'>##</div>
                </div>
                </div>
                </div>
              `;
  }

  detailHtml += `
              <div class='complex_like_category'>
              <div class='complex_like_infra' onclick='complex_like_updown("infra", "${searchCode}", "${aptName}")'>
              <div class='complex_like_name'>${tSafe('ui.report.infra', '인프라')}</div>
              <div class='complex_like_num' id='complex_like_infra_${searchCode}'>
              <div class='complex_like_thumb'><i class='fa-regular fa-thumbs-up'></i></div>
              <div id='complex_like_num_infra_${searchCode}'>##</div>
              </div>
              </div>
              </div>
            `;

  detailHtml += `
              <div class='complex_like_category'>
              <div class='complex_like_edu' onclick='complex_like_updown("edu", "${searchCode}", "${aptName}")'>
              <div class='complex_like_name'>${tSafe('ui.report.education', '교육')}</div>
              <div class='complex_like_num' id='complex_like_edu_${searchCode}'>
              <div class='complex_like_thumb'><i class='fa-regular fa-thumbs-up'></i></div>
              <div id='complex_like_num_edu_${searchCode}'>##</div>
              </div>
              </div>
              </div>
            `;

  detailHtml += `
            </div>
            </div>
            </div>
          `;

  //랭커스톡
  var tCommentPopTitleText = tSafe('ui.report.comment_pop_title', '{count}개의 우리 단지 랭커스톡').replace('{count}', '#');
  detailHtml += `
        <div class='card' onClick='showCommentWindow("${searchCode}")'>
        <div class='card-header'>
        <div class='popTitle' id='comment_popTitle'><div><i class='fa-regular fa-comment'></i>&nbsp&nbsp${tCommentPopTitleText}</div>
        <div></div>
        </div></div>
        <div class='card-body' id='comment_sample'></div>
        </div>
        </div>
      `;

  //총점,순위
  detailHtml += `
        <div class='card'>
        <div class='card-header'>
      `;

  var sortName = "";

  if (sortSelection == "sortDefault") {
    sortName = tSafe("ui.report.sort_default", "균형잡힌");
  }
  if (sortSelection == "sortLiving") {
    sortName = tSafe("ui.report.sort_living", "주거우선");
  }
  if (sortSelection == "sortTrans") {
    sortName = tSafe("ui.report.sort_trans", "교통우선");
  }
  if (sortSelection == "sortInfra") {
    sortName = tSafe("ui.report.sort_infra", "인프라우선");
  }
  if (sortSelection == "sortEdu") {
    sortName = tSafe("ui.report.sort_edu", "교육우선");
  }
  if (sortSelection == "sortCustom") {
    sortName = tSafe("ui.report.sort_custom", "커스텀");
  }

  if (rearrangeAPTSelection == "rearrangeRank") {
    sortName = tSafe("ui.report.rearrange_rank", "순위변동순");
  }
  if (rearrangeAPTSelection == "rearrangePrice") {
    sortName = tSafe("ui.report.rearrange_price", "실거래가순");
  }
  if (rearrangeAPTSelection == "rearrangeNew") {
    sortName = tSafe("ui.report.rearrange_new", "신축순");
  }
  if (rearrangeAPTSelection == "rearrangeHouse") {
    sortName = tSafe("ui.report.rearrange_house", "세대수순");
  }

  detailHtml += `
        <div class='popupSubtitle' style='font-size: 0.75em; text-align: center'>- ${$("#sido option:selected").text()} ${$("#gungu option:selected").text()} -</div>
        <div class='popRank'>Rank ${complex_grade}
      `;

  if (sortSelection == "sortDefault" && (rearrangeAPTSelection == "rearrangeScore" || rearrangeAPTSelection == "rearrangeRank")) {
    detailHtml += `<span class='ranksame'></div></div>`;
  } else {
    detailHtml += `<span class='ranksame'> (${sortName}) </span></div></div>`;
  }
  var value_chart_height = "160px";

  if (isNaN(transportScore) == false) {
    value_chart_height = "180px";
  } else {
    value_chart_height = "160px";
  }

  if (login_status == false) {
    detailHtml += `
            <div class='loginBox'>
            <div id='aptrankLoginGuide'>${tSafe('ui.report.login_guide', '더 자세한 정보와 분석을 확인하세요')}</div>
            <div id='aptrankLoginButton' data-bs-toggle='modal' data-bs-target='#loginModal' onClick='showLogin()'>${tSafe('ui.report.login_button', '리얼랭커스 로그인')}</div>
            </div>
          `;
  } else {
    detailHtml += `
          <div class='card-body' style='padding-top: 2px'>
          <div class='graph' style='height: 200px'> <canvas id='valueChart'></canvas></div>
          <div class='comment'>${tSafe('ui.report.score_relative_guide', '(지역구의 모든 단지에 대해 100점으로 환산한 상대 점수 입니다.)')}</div>
          </div>
        `;

    detailHtml += `<div class='card-body' style='padding-top: 2px'>`;
    if (selectedMonth == thisMonth) {
      detailHtml += `
            <div id='advanced_feature'>
            <div class='popupSubtitle' style='text-align: center; margin-top: 10px'>${tSafe('ui.report.simul_guide', '↓↓ 내 생각과 다르다면, 데이터를 바꿔 보세요! ↓↓')}</div>
            <div id='rankSimul' onclick='openSimulation(aptData.data,${index})'>${tSafe('ui.report.simul_button', '랭크 시뮬레이션')}</div>
            <div id='btn_complex_compare' onclick='openCompare(aptData.data[${index}])'>${tSafe('ui.report.compare_button', '단지 비교하기')} <span id='newFeature'>NEW!!</span></div>
            </div>
          `;
    } else {
      detailHtml += `
            <div class='popupSubtitle' style='text-align: center; margin-top: 10px'>${tSafe('ui.report.simul_guide', '↓↓ 내 생각과 다르다면, 데이터를 바꿔 보세요! ↓↓')}</div>
            <div id='rankSimul' onclick='openSimulation(aptData.data,${index})'>${tSafe('ui.report.simul_button', '랭크 시뮬레이션')}</div>
          `;
    }

    detailHtml += `</div>`;
  }

  detailHtml += `
        <div class='accordion' id='history_accordion'>
        <div class='accordion-item'>
        <button id='btn_history_accordion' class='accordion-button collapsed' type='button' data-bs-toggle='collapse' data-bs-target='#collapseOne' aria-expanded='true' aria-controls='collapseOne'>
        RANK HISTORY</button>
        <div id='collapseOne' class='accordion-collapse collapse' data-bs-parent='#accordionExample'>
        <div class='accordion-body' id='rank_history_area'>
        <div class='graph' style='height: 120px;'> <canvas id='rankChart'></canvas></div>
        </div></div>
        </div></div>
      `;

  detailHtml += `</div></div>`;

  //지도
  detailHtml += `
        <div class='card'>
        <div class='card-header'>
        <div class='popTitle'><i class='fa-solid fa-bullseye'></i>&nbsp&nbsp${tSafe('ui.report.real_radar_map', '리얼레이더맵')}</div>
        </div>
        <div class='card-body' style='padding: 0'>
      `;

  if (apt_type == "분양(예정)") {
    go_url = "https://hogangnono.com/apt/" + searchCode;
  } else {
    if (isMobile) {
      go_url = "https://m.land.naver.com/complex/info/" + searchCode;
    } else {
      go_url = "https://new.land.naver.com/complexes/" + searchCode;
    }
  }
  //detailHtml += "<div id='part_map_wrap' onClick='goMap(go_url)'>";
  detailHtml += `
        <div id='part_map_wrap' onClick='openRadarMap("${searchCode}")'>
        <div id='detail_map'></div>
        </div>
        <div id='aptrankLoginGuide' style='text-align:center; margin-top:5px'>${tSafe('ui.report.map_click_guide', '지도를 선택하면 주변 입지를 확인할 수 있어요!')}</div>
        </div></div></div>
      `;

  //주거
  detailHtml += `
        <div class='card'>
        <div class='card-header'>
        <div class='popTitle'><i class='fas fa-home'></i>&nbsp&nbsp${tSafe('ui.report.living', '주거')}</div>
        </div>
        <div class='card-body'>
        <div id='popLiving'>
      `;
  if (login_status) {
    detailHtml += `<div class='graph' style='height: 120px'> <canvas id='livingChart'></canvas></div>`;
    if (apt_type == "분양(예정)") {
      detailHtml += `<div class='comment'>${isEn ? "'TBD' items are replaced with averages for calculation,<br>and scores may change with future updates." : "'미정' 항목이 있는 경우 평균치로 대체되어 계산되며,<br>향후 정보 업데이트에 따라 점수가 변경될 수 있습니다."}</div><hr>`;
    }
    if (apt_type == "재건축") {
      detailHtml += `<div class='comment'>${isEn ? "For reconstruction, the score is calculated using FAR and building coverage,<br>considering the future possibility of new construction." : "재건축의 경우, 향후 신축이 될 가능성을 고려하여<br>용적률과 건폐율로 주거 점수를 계산합니다."}</div><hr>`;
    }
  }
  detailHtml += `<div class='popTable'>`;

  var tPremiumApplied = tSafe("ui.report.premium_applied", "적용");
  var tHouseNumLabel = tSafe("ui.report.house_num_label", "세대수");
  var tHouseNumUnit = tSafe("ui.report.house_num_unit", "세대");
  var tUndetermined = tSafe("ui.report.undetermined", "미정");
  var tFloorRateLabel = tSafe("ui.report.floor_rate_label", "용적률");
  var tCoverRateLabel = tSafe("ui.report.cover_rate_label", "건폐율");
  var tParkingLabel = tSafe("ui.report.parking_label", "주차");
  var tHeatingLabel = tSafe("ui.report.heating_label", "난방방식");
  var tEntranceLabel = tSafe("ui.report.entrance_label", "현관구조");

  if (Number(selectedMonth) > 202205 && aptData.data[index]["한강"] > 0) {
    detailHtml += `<div class='popSubTable'><div class='popContent'>${isEn ? "Han River Premium" : "한강 프리미엄"}</div><div class='popResult'>${tPremiumApplied}</div></div>`;
  }
  if (Number(selectedMonth) > 202205 && aptData.data[index]["해운대"] > 0) {
    detailHtml += `<div class='popSubTable'><div class='popContent'>${isEn ? "Haeundae Premium" : "해운대 프리미엄"}</div><div class='popResult'>${tPremiumApplied}</div></div>`;
  }

  if (house_num != null && house_num != undefined && house_num != "") {
    detailHtml += `<div class='popSubTable'><div class='popContent'>${tHouseNumLabel}</div><div class='popResult'>${house_num.toLocaleString()}${tHouseNumUnit}</div></div>`;
  } else {
    detailHtml += `<div class='popSubTable'><div class='popContent'>${tHouseNumLabel}</div><div class='popResult'>${tUndetermined}</div></div>`;
  }

  if (apt_type == "재건축") {
    detailHtml += `
          <div class='popSubTable'><div class='popContent'>${tFloorRateLabel}</div><div class='popResult'>${floor_rate}</div></div>
          <div class='popSubTable'><div class='popContent'>${tCoverRateLabel}</div><div class='popResult'>${cover_rate}</div></div>
        `;
  }

  detailHtml += `
        <div class='popSubTable' id='popSubStation'><div class='popContent'>${tParkingLabel}</div><div class='popResult'>${parking}</div></div>
        <div class='popSubTable'><div class='popContent'>${tHeatingLabel}</div><div class='popResult'>${heating}</div></div>
        <div class='popSubTable'><div class='popContent'>${tEntranceLabel}</div><div class='popResult'>${entrance}</div></div>
      `;

  if (apt_type == "분양(예정)") {
  } else {
    var area_array = area_info.split(",");
    var maintainance_array = maintainance.split(",");
    var rooms_array = rooms.split(",");
    var baths_array = baths.split(",");
    detailHtml += `
          <div class='table-responsive' style='max-height: 200px; overflow-y: scroll'>
          <table class='table table-striped' style='font-size:0.8em'>
          <thead class='table-light' style='position:sticky ;top: 0'>
          <tr>
          <th scope='col'>${tSafe("ui.report.area_label", "평형")}</th>
          <th scope='col'>${tSafe("ui.report.rooms_baths_label", "방수/욕실수")}</th>
          <th scope='col'>${tSafe("ui.report.maintenance_label", "평균 관리비")}</th>
          </tr>
          </thead>
        `;

    detailHtml += `<tbody>`;
    for (var k = 0; k < area_array.length; k++) {
      var areaVal = area_array[k];
      if (isEn) {
        areaVal = areaVal.replace(/평/g, "py");
      }
      detailHtml += `
            <tr>
            <td>${areaVal}</td>
            <td>${parseInt(rooms_array[k])} / ${parseInt(baths_array[k])}</td>
          `;
      if (isNaN(maintainance_array[k]) == true || maintainance_array[k] == "" || maintainance_array[k] == null || maintainance_array[k] == undefined) {
        detailHtml += `<td>---</td>`;
      } else {
        detailHtml += `<td>${Number(maintainance_array[k]).toLocaleString()}${tSafe("ui.report.won_unit", "원")}</td>`;
      }
      detailHtml += `</tr>`;
    }
    detailHtml += `
          </tbody>
          </table>
          </div>
        `;
  }

  if (login_status) {
    detailHtml += `<div class='comment2'>${tSafe('ui.report.living_score_guide', '주거총점 계산을 위한 정보는 네이버 부동산으로 취득하며, 세대수/평형/난방방식 등의 항목을 상대점수로 산정합니다.')}</div>`;
  }
  detailHtml += `</div></div></div></div>`;
  avgLivingScore = Math.round((livingSum / itemNum) * 100) / 100;

  if (Number(selectedMonth) > 202207 && apt_type != "분양(예정)") {
    if (floor_noise == "NA" || floor_noise == "" || floor_noise == null || floor_noise == undefined) {
      //층간소음 정보 미제공
    } else {
      //층간소음
      detailHtml += `
            <div class='card'>
            <div class='card-header'>
            <div class='popTitle'><i class='fa-solid fa-bell-slash'></i>&nbsp&nbsp${tSafe("ui.report.floor_noise_label", "층간소음")}</div>
            </div>
            <div class='card-body' style='padding-top: 5px'>
            <div id='popLiving'>
            <div class='popTable'>
          `;

      noise_level = "";

      if (floor_noise == "좋음" || floor_noise == "우수") {
        noise_level = "<span style='color:#148523'><i class='fa-solid fa-face-laugh'></i>" + tSafe("ui.report.noise_excellent", "우수") + "</span>";
      } else if (floor_noise == "보통") {
        noise_level = "<span style='color:#148185'><i class='fa-solid fa-face-smile'></i>" + tSafe("ui.report.noise_normal", "보통") + "</span>";
      } else {
        noise_level = "<span style='color:black'>" + tSafe("ui.report.no_info", "정보 없음") + "</span>";
      }

      detailHtml += `
            <div class='popSubTable'><div class='popContent'>${tSafe("ui.report.floor_noise_mgmt_label", "층간소음 관리")}</div><div class='popResult'>${noise_level}</div></div>
            <div class='comment2' style='font-size: 0.7em'>${tSafe("ui.report.floor_noise_guide", "층간소음 관리 정보는 층간소음 전문 연구소 주거문화개선연구소/층간소음에 안전한 아파트(앱)에서 제공됩니다.")}</div>
            </div></div></div></div>
          `;
    }
  }

  if (stationArea != "NA") {
    //교통
    detailHtml += `
          <div class='card'>
          <div class='card-header'>
          <div class='popTitle'><i class='fas fa-bus'></i>&nbsp&nbsp${tSafe("ui.report.transport", "교통")}</div>
          </div>
          <div class='card-body'>
          <div id='popTransport'>
        `;
    if (login_status) {
      detailHtml += `<div class='graph' style='height: 120px'> <canvas id='transportChart'></canvas></div>`;
    }
    detailHtml += `
          <div class='popTable'>
          <div class='popSubTable' id='popSubStation'><div class='popContent'>${tSafe("ui.report.nearest_station_label", "가장 가까운 역")}</div><div class='popResult'>${nearestStation}</div></div>
        `;
    if (Number(selectedMonth) > 202211) {
      var subway_line = aptData.data[index]["역노선"];
      if (isEn) {
        subway_line = aptData.data[index]["Line_EN"];
      }
      detailHtml += `<div class='stationList'><div></div><div class='stationText'>${subway_line}</div></div>`;
    }

    detailHtml += `<div class='popSubTable'><div class='popContent'>${tSafe("ui.report.station_30m_label", "30분 이내 도착 가능 주요역")}</div><div class='popResult'>${stationPoint_30m}${isEn ? "" : "개"}</div></div>`;
    if (stationPoint_30m != 0 && selectedMonth != "202201") {
      var stations_30m = aptData.data[index]["30분거점역이름"];
      if (isEn) {
        stations_30m = stations_30m = aptData.data[index]["Key_stations_30m"];
      }
      stations_30m = stations_30m.replace("[", "").replace("]", "").replace(/\'/g, "");
      detailHtml += `<div class='stationList'><div></div><div class='stationText'>${stations_30m}</div></div>`;
    }

    detailHtml += `<div class='popSubTable' id='stationTable'><div class='popContent'>${tSafe("ui.report.station_1h_label", "1시간 이내 도착 가능 주요역")}</div><div class='popResult'>${stationPoint_1h}${isEn ? "" : "개"}</div></div>`;
    if (stationPoint_1h != 0 && selectedMonth != "202201") {
      var stations_1h = aptData.data[index]["1시간거점역이름"];
      if (isEn) {
        stations_1h = stations_1h = aptData.data[index]["Key_stations_1h"];
      }
      stations_1h = stations_1h.replace("[", "").replace("]", "").replace(/\'/g, "");
      detailHtml += `<div class='stationList'><div></div><div class='stationText'>${stations_1h}</div></div><hr style='margin-top: 2px'>`;
    }

    if (Number(selectedMonth) < 202411) {
      detailHtml += `<div class='comment2'>${tSafe("ui.report.transport_guide_google", "가장 가까운 역은 직선거리로 계산됩니다.<br>주요역은 평일 출근시간대 하차인원이 가장 많은 역을 의미합니다.<br>30분, 1시간 이동 거리는 구글 대중교통 이동 시간 정보를 사용합니다.")}</div>`;
    } else {
      detailHtml += `<div class='comment2'>${tSafe("ui.report.transport_guide_tmap", "가장 가까운 역은 직선거리로 계산됩니다.<br>주요역은 평일 출근시간대 하차인원이 가장 많은 역을 의미합니다.<br>30분, 1시간 이동 거리는 T-MAP 대중교통 이동 시간 정보를 사용합니다.")}</div>`;
    }

    detailHtml += `</div></div></div></div>`;
    avgTransportScore = (Math.round((transportSum / itemNum) * 100) / 100).toFixed(2);
  }

  //인프라
  detailHtml += `
        <div class='card'>
        <div class='card-header'>
        <div class='popTitle'><i class='fas fa-hospital-user'></i>&nbsp&nbsp${tSafe("ui.report.infra", "인프라")}</div>
        </div>
        <div class='card-body'>
        <div id='popInfra'>
      `;
  if (login_status) {
    detailHtml += `<div class='graph' style='height: 120px'> <canvas id='infraChart'></canvas></div>`;
  }
  detailHtml += `
        <div class='popTable'>
        <div class='popSubTable'><div class='popContent'>${tSafe("ui.report.dept_store_3km_label", "3km 이내 백화점")}</div><div class='popResult'>${departmentStore_3km}</div></div>
        <div class='popSubTable'><div class='popContent'>${tSafe("ui.report.outlet_5km_label", "5km 이내 아울렛/몰")}</div><div class='popResult'>${OutletMall_5km}</div></div>
        <div class='popSubTable'><div class='popContent'>${tSafe("ui.report.mart_1km_label", "1km 이내 대형마트")}</div><div class='popResult'>${bigMart_1km}</div></div>
      `;
  if (Number(selectedMonth) > 202204) {
    if (aptData.data[index]["300m이내상권"] == "0") {
      detailHtml += `<div class='popSubTable' style='grid-template-columns:1fr 1fr'><div class='popContent'>${tSafe("ui.report.market_300m_label", "300m 이내 상권")}</div><div class='popResult'>0${isEn ? "" : "개"}</div></div>`;
    } else {
      detailHtml += `<div class='popSubTable' style='grid-template-columns:1fr 1fr'><div class='popContent'>${tSafe("ui.report.market_300m_label", "300m 이내 상권")}</div><div class='popResult'>${market_infra}</div></div>`;
    }
  }
  detailHtml += `
        <div class='popSubTable'><div class='popContent'>${tSafe("ui.report.bank_500m_label", "500m 이내 은행")}</div><div class='popResult'>${bank_500m}</div></div>
        <div class='popSubTable'><div class='popContent'>${tSafe("ui.report.hospital_500m_label", "500m 이내 병원")}</div><div class='popResult'>${hospital_500m}</div></div>
        <div class='popSubTable'><div class='popContent'>${tSafe("ui.report.big_hospital_5km_label", "5km 이내 대형병원")}</div><div class='popResult'>${bigHospital_5km}</div></div>
        <div class='popSubTable'><div class='popContent'>${tSafe("ui.report.park_500m_label", "500m 이내 공원")}</div><div class='popResult'>${park_500m}</div></div>
      `;
  if (Number(selectedMonth) > 202205) {
    detailHtml += `<div class='popSubTable'><div class='popContent'>${tSafe("ui.report.big_park_1km_label", "1km 이내 대형공원")}</div><div class='popResult'>${big_park_1km}</div></div>`;
  }
  detailHtml += `<div class='popSubTable'><div class='popContent'>${tSafe("ui.report.harmful_3km_label", "3km 이내 혐오시설")}</div><div class='popResult'>${harmful_3km}</div></div>`;
  if (Number(selectedMonth) > 202204) {
    detailHtml += `<div class='comment2'>${tSafe("ui.report.infra_guide_with_market", "인프라 정보는 각 백화점/마트 홈페이지, 은행연합회, 자원순환정보시스템, 공공데이터 포탈의 정보를 기반으로 산정되며, 상권은 호갱노노 정보를 사용합니다.")}</div>`;
  } else {
    detailHtml += `<div class='comment2'>${tSafe("ui.report.infra_guide_base", "인프라 정보는 각 백화점/마트 홈페이지, 은행연합회, 자원순환정보시스템, 공공데이터 포탈의 정보를 기반으로 산정됩니다.")}</div>`;
  }
  detailHtml += `</div></div></div></div>`;
  avgInfraScore = (Math.round((infraSum / itemNum) * 100) / 100).toFixed(2);

  //교육
  detailHtml += `
        <div class='card'>
        <div class='card-header'>
        <div class='popTitle'><i class='fas fa-graduation-cap'></i>&nbsp&nbsp${tSafe("ui.report.education", "교육")}</div>
        </div>
        <div class='card-body'>
        <div id='popEducation'>
      `;
  if (login_status) {
    detailHtml += `<div class='graph' style='height: 120px'> <canvas id='eduChart'></canvas></div>`;
  }
  detailHtml += `<div class='popTable'>`;
  if (Number(selectedMonth) > 202204) {
    if (pSchool_distance - 100 < 0) {
      minDistance = parseInt(pSchool_distance * 0.8);
    } else {
      minDistance = parseInt(pSchool_distance - 100);
    }
    maxDistance = parseInt(pSchool_distance);
    detailHtml += `<div class='popSubTable'><div class='popContent'>${tSafe("ui.report.pSchool_distance_label", "초등학교 거리")}</div><div class='popResult'>${minDistance.toLocaleString()}~${maxDistance.toLocaleString()}m</div></div>`;
  }

  if (pSchool_edu > 95 && pSchool_edu <= 100) {
    pSchool_edu_result = tSafe("ui.report.transfer_in_heavy", "많은 전입");
  } else if (pSchool_edu >= 92 && pSchool_edu <= 95) {
    pSchool_edu_result = tSafe("ui.report.transfer_in_light", "적은 전입");
  } else if (pSchool_edu >= 88 && pSchool_edu < 92) {
    pSchool_edu_result = tSafe("ui.report.transfer_neutral", "전입/전출 적음");
  } else if (pSchool_edu >= 85 && pSchool_edu < 88) {
    pSchool_edu_result = tSafe("ui.report.transfer_out_light", "적은 전출");
  } else {
    pSchool_edu_result = tSafe("ui.report.transfer_out_heavy", "많은 전출");
  }
  detailHtml += `
        <div class='popSubTable'><div class='popContent'>${tSafe("ui.report.pSchool_change_label", "초등학교 학생증감")}</div><div class='popResult'>${pSchool_edu_result}</div></div>
        <div class='popSubTable'><div class='popContent'>${tSafe("ui.report.mSchool_achievement_label", "중학교 보통 학력 이상")}</div><div class='popResult'>${mSchool_edu}</div></div>
      `;
  if (Number(selectedMonth) > 202204 && Number(selectedMonth) <= 202206) {
    detailHtml += `
          <div class='popSubTable' style='grid-template-columns:1fr 1fr'><div class='popContent'>${isEn ? "Academies within 500m" : "500m 이내 학원가"}</div><div class='popResult'>${academy_edu}</div></div>
          <div class='comment2'>${tSafe("ui.report.edu_guide_with_academy", "교육 정보는 교육통계서비스 정보를 기반으로 산정되며, 학원가는 호갱노노의 정보를 사용합니다.<br>초등학교까지의 거리는 직선거리로 계산됩니다.")}</div>
        `;
  } else if (Number(selectedMonth) > 202206 && Number(selectedMonth) <= 202207) {
    detailHtml += `
          <div class='popSubTable' style='grid-template-columns:1fr 1fr'><div class='popContent'>${isEn ? "Academies within 500m" : "500m 이내 학원가"}</div><div class='popResult'>${academy_edu}</div></div>
          <div class='popSubTable'><div class='popContent'>${tSafe("ui.report.harmful_facility_label", "300m 이내 유흥시설/모텔")}</div><div class='popResult'>${drink_pub + daran_pub + motel}${isEn ? "" : "개"}</div></div>
          <div class='comment2'>${tSafe("ui.report.edu_guide_with_academy_and_harmful", "교육 정보는 교육통계서비스 정보를 기반으로 산정되며,<br>학원가는 호갱노노의 정보를 사용합니다.<br>초등학교까지의 거리는 직선거리로 계산됩니다.<br>유흥시설과 모텔정보는 교육 감점요소로 적용됩니다.")}</div>
        `;
  } else if (Number(selectedMonth) > 202307 && Number(selectedMonth) <= 202208) {
    detailHtml += `
          <div class='popSubTable' style='grid-template-columns:1fr 1fr'><div class='popContent'>${isEn ? "Academies within 300m" : "300m 이내 학원가"}</div><div class='popResult'>${academy_edu}</div></div>
          <div class='popSubTable'><div class='popContent'>${tSafe("ui.report.harmful_facility_label", "300m 이내 유흥시설/모텔")}</div><div class='popResult'>${drink_pub + daran_pub + motel}${isEn ? "" : "개"}</div></div>
          <div class='comment2'>${tSafe("ui.report.edu_guide_with_academy_and_harmful", "교육 정보는 교육통계서비스 정보를 기반으로 산정되며,<br>학원가는 호갱노노의 정보를 사용합니다.<br>초등학교까지의 거리는 직선거리로 계산됩니다.<br>유흥시설과 모텔정보는 교육 감점요소로 적용됩니다.")}</div>
        `;
  } else if (Number(selectedMonth) > 202308) {
    detailHtml += `
          <div class='popSubTable' style='grid-template-columns:1fr 1fr'><div class='popContent'>${isEn ? "Academies within 300m" : "300m 이내 학원가"}</div><div class='popResult'>${academy_edu}</div></div>
          <div class='popSubTable' style='grid-template-columns:1fr 1fr'><div class='popContent'>${isEn ? "Academies within 1km" : "1km 이내 학원가"}</div><div class='popResult'>${academy_edu_long}</div></div>
          <div class='popSubTable'><div class='popContent'>${tSafe("ui.report.harmful_facility_label", "300m 이내 유흥시설/모텔")}</div><div class='popResult'>${drink_pub + daran_pub + motel}${isEn ? "" : "개"}</div></div>
          <div class='comment2'>${tSafe("ui.report.edu_guide_with_academy_and_harmful", "교육 정보는 교육통계서비스 정보를 기반으로 산정되며,<br>학원가는 호갱노노의 정보를 사용합니다.<br>초등학교까지의 거리는 직선거리로 계산됩니다.<br>유흥시설과 모텔정보는 교육 감점요소로 적용됩니다.")}</div>
        `;
  } else {
    detailHtml += `<div class='comment2'>${tSafe("ui.report.edu_guide_base", "교육 정보는 교육통계서비스 정보를 기반으로 산정됩니다.")}</div>`;
  }
  detailHtml += `</div></div></div></div>`;
  avgEduScore = (Math.round((eduSum / itemNum) * 100) / 100).toFixed(2);

  //실거래가
  var rent_info_array = rent_info.split(",");
  var rent_ratio_array = rent_ratio.split(",");

  if (apt_type != "분양(예정)") {
    var sales_info_array = sales_info.split(",");
    var price_per_array = price_per.split(",");

    var tRecentSalesAlert = tSafe("ui.report.recent_sales_alert", " (최근 1개월내 실거래는 빨간색으로 표시)");
    var tNoSalesInfo = tSafe("ui.report.no_sales_info", "거래 정보 없음");

    detailHtml += `
          <div class='card'>
          <div class='card-header'>
          <div class='popTitle'><i class='fa-solid fa-coins'></i>&nbsp&nbsp${tSafe("ui.report.actual_price_label", "실거래가")}<span style='font-size: 0.7em; color:#fe4040'>${tRecentSalesAlert}</span> </div>
          </div>
          <div class='card-body' style='padding-left: 5px ; padding-right: 5px; padding-top: 5px;'>
          <div id='popEducation'>
          <div class='popTable'>
          <div id='popSubStation' style='grid-template-columns: 0.3fr 1fr; margin-left: 5px ; margin-right: 5px; margin-top: 10px;'>
          <div class='popContent'>${tSafe("ui.report.recent_sales_label", "최근 매매")}</div>
        `;

    var start_date = new Date();
    start_date.setMonth(start_date.getMonth() - 1);

    if (isNaN(last_sales_price)) {
      detailHtml += `<div class='popResult'>${tNoSalesInfo}</div></div>`;
    } else {
      var compare_year = Number(last_sales_date.substr(0, 4));
      var compare_month = Number(last_sales_date.substr(5, 2) - 1);
      var compare_day = Number(last_sales_date.substr(8, 2));
      var compare_date = new Date(compare_year, compare_month, compare_day);

      var areaText = last_sales_area;
      if (isEn && areaText) {
        areaText = areaText.replace(/평/g, "py");
      }
      var formattedLastSalesPrice = isEn ? ((Math.round(last_sales_price / 100) / 100 * 100).toLocaleString() + "M") : ((Math.round(last_sales_price / 100) / 100) + "억");

      if (compare_date > start_date) {
        detailHtml += `<div class='popResult' style='color: #fe4040'>${areaText}, ${formattedLastSalesPrice}, ${last_sales_date.substr(2)}</div></div>`;
      } else {
        detailHtml += `<div class='popResult'>${areaText}, ${formattedLastSalesPrice}, ${last_sales_date.substr(2)}</div></div>`;
      }
    }
    detailHtml += `
          <hr>
          <table class='table table-striped' style='font-size:0.8em'>
          <thead class='table-light'>
          <tr>
        `;
    if (Number(selectedMonth) > 202207) {
      detailHtml += `
            <th scope='col' style='line-height: 2.9em;'>${tSafe("ui.report.area_label", "평형")}</th>
            <th scope='col'>${tSafe("ui.report.sales_price_label", "매매 실거래가")}<br>${tSafe("ui.report.rent_price_label", "전세 실거래가")}</th>
            <th scope='col'>${tSafe("ui.report.price_per_py_label", "평단가")}<br>${tSafe("ui.report.rent_ratio_label", "전세가율")}</th>
          `;
    } else {
      detailHtml += `
            <th scope='col'>${tSafe("ui.report.area_label", "평형")}</th>
            <th scope='col'>${tSafe("ui.report.actual_price_label", "실거래가")}</th>
            <th scope='col'>${tSafe("ui.report.price_per_py_label", "평단가")}</th>
          `;
    }
    detailHtml += `
          </tr>
          </thead>
        `;

    detailHtml += `<tbody>`;
    for (var k = 0; k < area_array.length; k++) {
      var rowArea = area_array[k];
      if (isEn && rowArea) {
        rowArea = rowArea.replace(/평/g, "py");
      }

      var compare_rent_date = null;

      detailHtml += `<tr>`;
      if (sales_info_array[k] == "거래 정보 없음") {
        detailHtml += `
              <td>${rowArea}</td>
              <td>${tNoSalesInfo}<br>
            `;
        if (rent_ratio_array[k] == "정보 없음") {
          detailHtml += `${tNoSalesInfo}</td>`;
        } else {
          detailHtml += `${(Math.round(rent_ratio_array[k] * 100) / 100).toFixed(2)}%</td>`;
        }
      } else {
        var sales_info_split = sales_info_array[k].split("억");
        var compare_year = Number(sales_info_split[1].substr(2, 4));
        var compare_month = Number(sales_info_split[1].substr(7, 2) - 1);
        var compare_day = Number(sales_info_split[1].substr(10, 2));
        var compare_date = new Date(compare_year, compare_month, compare_day);

        var salesDetails = sales_info_split[1];
        if (isEn && salesDetails) {
          salesDetails = salesDetails.replace(/층/g, "F");
        }
        var salesPriceVal = Number(sales_info_split[0]);
        var formattedSalesPrice = isEn ? ((salesPriceVal * 100).toLocaleString() + "M") : ((Math.round(salesPriceVal * 100) / 100).toFixed(2) + "억");

        if (Number(selectedMonth) > 202207) {
          var rent_info_split = rent_info_array[k].split("억");
          if (rent_info_split[0] == "거래 정보 없음") {
          } else {
            var compare_rent_year = Number(rent_info_split[1].substr(2, 4));
            var compare_rent_month = Number(rent_info_split[1].substr(7, 2) - 1);
            var compare_rent_day = Number(rent_info_split[1].substr(10, 2));
            compare_rent_date = new Date(compare_rent_year, compare_rent_month, compare_rent_day);
          }

          if (compare_date > start_date) {
            detailHtml += `
                  <td><span style='color:#fe4040; font-weight:600'>${rowArea}</span></td>
                  <td><span style='color:#fe4040; font-weight:600'>${formattedSalesPrice}<span style='font-size: 0.85em'>${salesDetails}</span></span><br>
                `;
          } else {
            detailHtml += `
                  <td>${rowArea}</td>
                  <td>${formattedSalesPrice}<span style='font-size: 0.85em'>${salesDetails}</span><br>
                `;
          }

          var rentDetails = rent_info_split[1];
          if (isEn && rentDetails) {
            rentDetails = rentDetails.replace(/층/g, "F");
          }
          var rentPriceVal = Number(rent_info_split[0]);
          var formattedRentPrice = isEn ? ((rentPriceVal * 100).toLocaleString() + "M") : ((Math.round(rentPriceVal * 100) / 100).toFixed(2) + "억");

          if (compare_rent_date > start_date) {
            if (rent_info_split[0] == "거래 정보 없음") {
              detailHtml += `${tNoSalesInfo}</td>`;
            } else {
              detailHtml += `<span style='color:#fe4040; font-weight:600'>${formattedRentPrice}<span style='font-size: 0.85em'>${rentDetails}</span></span></td>`;
            }
          } else {
            if (rent_info_split[0] == "거래 정보 없음") {
              detailHtml += `${tNoSalesInfo}</td>`;
            } else {
              detailHtml += `${formattedRentPrice}<span style='font-size: 0.85em'>${rentDetails}</span></td>`;
            }
          }
        } else {
          if (compare_date > start_date) {
            detailHtml += `
                  <td><span style='color:#fe4040; font-weight:600'>${rowArea}</span></td>
                  <td><span style='color:#fe4040; font-weight:600'>${formattedSalesPrice}<span style='font-size: 0.85em'>${salesDetails}</span></span></td>
                `;
          } else {
            detailHtml += `
                  <td>${rowArea}</td>
                  <td>${formattedSalesPrice}<span style='font-size: 0.85em'>${salesDetails}</span></td>
                `;
          }
        }
      }

      if (price_per_array[k] == "nan" || price_per_array[k] == 0) {
        detailHtml += `<td>---<br>`;
      } else {
        price_per = Math.floor(price_per_array[k]);
        var formattedPricePer = isEn ? ((price_per * 10).toLocaleString() + "K") : (price_per.toLocaleString() + "만원");
        if (compare_date > start_date) {
          detailHtml += `<td><span style='color:#fe4040; font-weight:600'>${formattedPricePer}</span><br>`;
        } else {
          detailHtml += `<td>${formattedPricePer}<br>`;
        }
      }

      if (rent_ratio_array[k] == "정보 없음") {
        detailHtml += `${tSafe("ui.report.no_info", "정보 없음")}</td>`;
      } else {
        if (compare_rent_date > start_date) {
          detailHtml += `<span style='color:#fe4040; font-weight:600'>${(Math.round(rent_ratio_array[k] * 100) / 100).toFixed(2)}%</span></td>`;
        } else {
          detailHtml += `${(Math.round(rent_ratio_array[k] * 100) / 100).toFixed(2)}%</td>`;
        }
      }

      detailHtml += `</tr>`;
    }
    detailHtml += `
          </tbody>
          </table>
          <div class='comment2'>&nbsp&nbsp${tSafe("ui.report.sales_info_guide", "실거래가 정보는 네이버 부동산으로 취득합니다.")}</div>
          </div></div></div></div>
        `;
  }

  if (apt_type != "분양(예정)") {
    //매매 실거래가
    detailHtml += `
          <div class='card'>
          <div class='card-header'>
          <div class='popPriceTitle'><i class='fa-solid fa-chart-line'></i>&nbsp&nbsp${tSafe("ui.report.price_change_label", "매매가변동")}<span id='themeLogo'>BETA</span></div>
          </div>
        `;

    detailHtml += `
          <div class='card-body' style='padding-top: 5px; padding-left: 5px; padding-right: 5px;'>
          <div class='priceHistoryOption'>
          <div style='text-align:left; padding-left:10px'><input type='checkbox' id='showGraph' onChange='graphShowHide(this)' style='width: 0.8em; height: 0.8em'>
          <label for='showGraph' style='font-size: 0.85em; padding-left: 3px'>${tSafe("ui.report.show_graph_label", "그래프보기")}</label></input></div>
          <div style='text-align: right'><select id='pStart' onChange='price_sDateChange(this.value)'></select> - <select id='pEnd' onChange='price_eDateChange(this.value)'></select></div>
          </div>
          <div id='popEducation'>
          <div class='popTable'>
        `;

    sales_history_price = aptData.data[index]["sales_history_price"];
    if (sales_history_price[0][0] == undefined) {
      sales_history_price = [sales_history_price];
    }
    sales_history_date = aptData.data[index]["매매실거래날짜목록"];

    priceCharts = [];
    for (var p = 0; p < area_array.length; p++) {
      if (sales_history_price[p] == undefined) {
        break;
      }

      generatedID = "pChart" + p;
      generated_priceID = "pChange" + p;
      generated_ratioID = "pRatio" + p;

      if (Math.max(...sales_history_price[p]) <= 0) {
        showGraph = false;
      } else {
        showGraph = true;
      }

      var pArea = area_array[p];
      if (isEn && pArea) {
        pArea = pArea.replace(/평/g, "py");
      }

      detailHtml += `
            <div class='popSubPriceTable' style='background: #eee'>
            <div class='priceResult' style='padding-left: 5px'>${pArea}</div>
            <div class='popSubPriceTableDetail'>
          `;
      if (showGraph) {
        detailHtml += `
              <div class='priceResult' style='text-align: right; padding-right: 4px'><span id=${generated_priceID}></span></div>
              <div class='priceResult' style='text-align: right; padding-right: 8px'><span id=${generated_ratioID}></span></div>
            `;
      } else {
        detailHtml += `
              <div class='priceResult' style='text-align: right; padding-right: 4px'>${tNoSalesInfo}</div>
              <div class='priceResult' style='text-align: right; padding-right: 8px'>( --- , --- )</div>
            `;
      }
      detailHtml += `
            </div>
            </div>
          `;

      detailHtml += `<div class='priceGraph' style='height: 100px; border-bottom: 1px solid #ddd'> <canvas id=${generatedID}></canvas></div>`;
      priceCharts.push(generatedID);
    }
    detailHtml += `</div></div></div></div>`;
  }

  //지역구
  if (login_status) {
    detailHtml += `
          <div class='card'>
          <div class='card-header'>
          <div class='popTitle'><i class='fas fa-layer-group'></i>&nbsp&nbsp${$("#sido option:selected").text()} ${$("#gungu option:selected").text()}</div>
          </div>
          <div class='card-body'>
          <div id='popEducation'>
          <div class='graph' style='height: 120px'> <canvas id='regionChart'></canvas></div>
          <div class='comment2'>${tSafe("ui.report.region_info_guide", "지역구 정보는 공공데이터포탈 정보를 기반으로 산정됩니다.")}</div>
          </div></div></div>
        `;
  }

  //Footer에 네이버 부동산 버튼
  footerHtml += `<div class='modal-footer'>`;
  //footerHtml += "<div></div>"

  var monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var monthVal = Number(selectedMonth.substr(4, 2));
  var yearShort = selectedMonth.substr(2, 2);
  if (isEn) {
    shareTitle = `[RealRankus ${monthNames[monthVal]} 20${yearShort}]\n\n`;
  } else {
    shareTitle = `[리얼랭커스 ${yearShort}년 ${monthVal}월]\n\n`;
  }

  shareText = "『" + aptName;
  if (Number(selectedMonth) > 202203) {
    if (apt_type == "재건축") {
      shareText += isEn ? ` (${aptDuration} yrs, Reconstruction)』` : `(${aptDuration}년차, 재건축)』`;
    } else if (apt_type == "분양권") {
      shareText += isEn ? ` (${aptData.data[index]["준공년월"].substr(0, 7)} Expected)』` : `(${aptData.data[index]["준공년월"].substr(0, 7)} 예정)』`;
    } else {
      shareText += isEn ? ` (${aptDuration} yrs)』` : `(${aptDuration}년차)』`;
    }
  } else {
    if (aptDuration >= 30) {
      shareText += isEn ? ` (${aptDuration} yrs, Reconstruction Eligible)』` : `(${aptDuration}년차, 재건축 대상)』`;
    } else {
      shareText += isEn ? ` (${aptDuration} yrs)』` : `(${aptDuration}년차)』`;
    }
  }

  shareText += `\nㆍ${isEn ? "Region" : "지역"} : ${$("#sido option:selected").text()} ${$("#gungu option:selected").text()}`;
  shareText += `\nㆍ${isEn ? "Grade" : "등급"} : Rank ${complex_grade} (${sortName})`;

  if (isNaN(last_sales_price)) {
    shareText += `\nㆍ${isEn ? "Recent Sales : No Transactions" : "최근실거래 : 거래 정보 없음"}`;
  } else {
    var areaText = last_sales_area;
    if (isEn && areaText) {
      areaText = areaText.replace(/평/g, "py");
    }
    var formattedLastSalesPrice = isEn ? ((Math.round(last_sales_price / 100) / 100 * 100).toLocaleString() + "M") : ((Math.round(last_sales_price / 100) / 100) + "억");
    shareText += `\nㆍ${isEn ? "Recent Sales" : "최근실거래"}\n    : ${areaText}, ${formattedLastSalesPrice}, ${last_sales_date.substr(2)}`;
  }
  if (house_num == null) {
    house_num = 0;
  }

  if (apt_type == "재건축") {
    shareText += `\nㆍ${isEn ? "FAR" : "용적률"} : ${floor_rate} \nㆍ${isEn ? "BCR" : "건폐율"} : ${cover_rate}`;
  } else {
    shareText += `\nㆍ${isEn ? "Households" : "세대수"} : ${house_num.toLocaleString()}${isEn ? " households" : "세대"}\nㆍ${isEn ? "Parking" : "주차"} : ${parking}`;
  }

  shareText += `\nㆍ${isEn ? "General Hospitals within 5km" : "5km 이내 대형병원"} : ${bigHospital_5km}\nㆍ${isEn ? "Middle School Achievement Rate" : "중학교 보통 학력 이상"} : ${mSchool_edu}`;

  shareText += `\n\n${shareURL}`;

  var tShowHogangnono = tSafe("ui.report.show_hogangnono", "호갱노노 보기");
  var tShowNaverLand = tSafe("ui.report.show_naver_land", "네이버 부동산 보기");

  if (UserAgent.indexOf("inApp") > -1) {
    if (apt_type == "분양(예정)") {
      footerHtml += `<div><button type='button' class='goLink_HGNN' onclick='openHGNN("${searchCode}")'>${tShowHogangnono}</button></div>`;
    } else {
      footerHtml += `<div><button type='button' class='goLink' onclick='openNaver("${searchCode}")'>${tShowNaverLand}</button></div>`;
    }

    if (checkMobile() == "ios") {
      footerHtml += `<div class='tShare' onClick='share(shareTitle, shareText, shareURL)'><i class='fa-solid fa-arrow-up-right-from-square'></i></div>`;
    } else {
      footerHtml += `<div class='kakaoShare' onClick='kakaoShare(shareTitle, shareText, kakaoShareURL)'><img src = ${isEn ? '../kakao_icon.png' : './kakao_icon.png'} height='32px'></div>`;
    }

    footerHtml += `<div class='tShare' onClick='CopyToClipboard(shareText, popMsg)'><i class='fa-regular fa-copy'></i></div>`;
  } else {
    if (apt_type == "분양(예정)") {
      footerHtml += `<div><button type='button' class='goLink_HGNN' onclick='openHGNN("${searchCode}")'>${tShowHogangnono}</button></div>`;
    } else {
      footerHtml += `<div><button type='button' class='goLink' onclick='openNaver("${searchCode}")'>${tShowNaverLand}</button></div>`;
    }

    if (checkMobile() == "ios") {
      footerHtml += `<div class='tShare' onClick='CopyToClipboard(shareText, popMsg)'><i class='fa-regular fa-copy'></i></div>`;
    } else {
      footerHtml += `<div class='kakaoShare' onClick='kakaoShare(shareTitle, shareText, kakaoShareURL)'><img src = ${isEn ? '../kakao_icon.png' : './kakao_icon.png'} height='32px'></div>`;
    }

    footerHtml += `<div class='tShare' onClick='share(shareTitle, shareText, shareURL)'><i class='fa-solid fa-arrow-up-right-from-square'></i></div>`;
  }
  footerHtml += `</div>`;

  $("#baseModalLabel").html(titleHtml);
  $("#aptDetail").html(detailHtml);
  $("#footer").html(footerHtml);

  let randomIndex = Math.floor(Math.random() * default_comment.length);
  $("#comment_sample").html("<div>" + default_comment[randomIndex] + "</div>");

  //임장기 로딩해서 넣는 함수
  setTimeout(function () {
    complex_blog(searchCode, aptName);
  }, 350);

  //지도 그리는 함수
  if (isMobile) {
    var dw = $(window).innerWidth() - 40;
  } else {
    var dw = 460;
  }
  var dh = 200;

  if (Number(selectedMonth) > 202212) {
    var detailMapOptions = {
      center: new naver.maps.LatLng(Number(coord_y) + 0.0003, Number(coord_x) + 0.0003),
      size: new naver.maps.Size(dw, dh),
      zoom: 16, //지도의 초기 줌 레벨
      zoomControl: false, //줌 컨트롤의 표시 여부
      draggable: false,
      pinchZoom: false,
      scrollWheel: false,
      keyboardShortcuts: false,
      disableDoubleTapZoom: true,
      disableDoubleClickZoom: true,
      disableTwoFingerTapZoom: true,
    };

    var detailMap = new naver.maps.Map("detail_map", detailMapOptions);

    ///////////////////////////////////////
    var last_sales_date = last_sales[0].toString();
    var last_sales_price = last_sales[1].toString();
    var last_sales_area = last_sales[2];

    if (isNaN(last_sales_price)) {
      if (apt_type == "분양(예정)" || apt_type == "분양권") {
        last_sales_price_kor = tSafe("ui.radar_map.presale", "분양");
      } else {
        last_sales_price_kor = tSafe("ui.report.no_info", "정보없음");
      }
      last_sales_area_kor = "--";
    } else {
      if (isEn) {
        last_sales_price_kor = (Math.round(last_sales_price / 100) / 100 * 100).toLocaleString() + "M";
      } else {
        last_sales_price_kor = (Math.round(last_sales_price / 100) / 100).toLocaleString() + "억";
      }

      if (isEn) {
        last_sales_area_kor = last_sales_area.replace("평", "py");
      } else {
        last_sales_area_kor = last_sales_area;
      }
    }

    var svg_color = "#a70000";
    var grade = "";
    if (aptValue >= 70) {
      svg_color = "#a70000";
      grade = "gradeS";
    } else if (aptValue < 70 && aptValue >= 55) {
      svg_color = "#F72020";
      grade = "gradeA";
    } else if (aptValue < 55 && aptValue >= 40) {
      svg_color = "#F36637";
      grade = "gradeB";
    } else {
      svg_color = "#ED8618";
      grade = "gradeC";
    }

    svg_loc_detail = `
        <svg version="1.1" class="detail_marker_${grade}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            viewBox="0 0 35 35" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="50", height="50">
            
        <defs>
        <style>
        .detail_marker_${grade}{fill:${svg_color}}
        .large_marker_${grade} {stroke:${svg_color}; stroke-width:0.5}      
        .cls-2{fill:#fff;}
        .cls-3_text{fill:#fff; font-size:8px; font-weight:600}
        .cls-4_text{fill:#000; font-size:7px; font-weight:600}            
        .cls-5_text{fill:#000; font-size:5px; font-weight:600}
        .cls-6_text{fill:#000; font-size:4px; font-weight:600}
        </style>
        </defs>
        <g class="svg_loc_large">
        <path class="cls-1 large_marker_${grade}" d="M.12,12.29V8.81A.88.88,0,0,1,.55,8L15.31.47a3.07,3.07,0,0,1,2.83,0L33,8a.85.85,0,0,1,.43.77v3.48Z"/>
        <path class="cls-2 large_marker_${grade}" d="M.13,12.29V26.36c0,1.37.63,2.47,1.4,2.47H3.36L4.52,31l1.16,2.15L6.84,31,8,28.83H32.06c.78,0,1.41-1.1,1.41-2.47V12.29Z"/>
        <text class="cls-3_text" text-anchor="middle" x="16.5" y="10">${complex_grade}</text>
        <text class="cls-4_text" text-anchor="middle" x="17" y="20">${last_sales_price_kor}</text>
        <text class="cls-5_text" text-anchor="middle" x="17" y="26">${last_sales_area_kor}</text>
        </g>
        </svg>
        `;
    var detailMarker = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coord_y), Number(coord_x)),
      icon: {
        content: svg_loc_detail,
        size: new naver.maps.Size(24, 37),
        anchor: new naver.maps.Point(6, 55),
        origin: new naver.maps.Point(Number(coord_y), Number(coord_x)),
      },
      zIndex: 100,
      map: detailMap,
    });

    circle_center = new naver.maps.LatLng(Number(coord_y) + 0.0003, Number(coord_x) + 0.0003);

    // 반경 리스트 (미터 단위)
    radii = [100, 200, 300, 400];

    // 원 색상 및 스타일
    colors = ["#e31939", "#e31939", "#e31939", "#e31939"];

    // 원 생성
    radii.forEach((radius, index) => {
      // 원 그리기
      window["detailMap_circle_" + radius] = new naver.maps.Circle({
        map: detailMap,
        center: circle_center,
        radius: radius,
        strokeColor: colors[index % colors.length],
        strokeOpacity: 0.6,
        strokeWeight: 1.5,
        fillColor: colors[index % colors.length],
        fillOpacity: 0.0,
      });
    });

    random_marker_num = Math.random() * 5 + 4;

    for (var k = 0; k < random_marker_num; k++) {
      let randomNumber1 = Math.floor(Math.random() * 700) + 300;
      let randomNumber2 = Math.floor(Math.random() * 700) + 300;
      randomNumber1 = (randomNumber1 * 1) / 300000;
      randomNumber2 = (randomNumber2 * 1) / 800000;

      if (Math.random() < 0.5) {
        randomNumber1 *= -1;
      }
      if (Math.random() < 0.5) {
        randomNumber2 *= -1;
      }

      svg_loc_small = `            
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                viewBox="0 0 20 20" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="30", height="30">
              <defs>
              <style>
              .detailMap_small_marker{fill:#555; stroke:#222; stroke-width:1}
              .cls-2_small_text{fill:#fff; font-size:9px; font-weight:600}
              </style>
              </defs>              
              <path class="detailMap_small_marker" d="M17.89,4.43,9.86.31a1.67,1.67,0,0,0-1.55,0L.36,4.43a.48.48,0,0,0-.24.42v9.58c0,.74.35,1.35.76,1.35h1l2.26,3.35,2.25-3.35h11c.41,0,.75-.61.75-1.35V4.86A.48.48,0,0,0,17.89,4.43Z"/>
              <text class="cls-2_small_text" text-anchor="middle" x="9" y="12">?</text>
              </svg>
              `;
      new naver.maps.Marker({
        position: new naver.maps.LatLng(Number(coord_y) + randomNumber2, Number(coord_x) + randomNumber1),
        icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(6, 55),
          origin: new naver.maps.Point(Number(coord_y), Number(coord_x)),
        },
        zIndex: 100,
        map: detailMap,
      });
    }
  }

  if (stationArea != "NA") {
    $(".complex_like").css({
      "grid-template-columns": "1fr 1fr 1fr 1fr",
    });
  } else {
    $(".complex_like").css({ "grid-template-columns": "1fr 1fr 1fr" });
  }
  //}
  //else{
  $(".modal-footer").css({
    "grid-template-columns": "1fr 0.15fr 0.15fr",
    "text-align": "center",
    "text-align": "-webkit-center",
  });
  //}

  if (Number(selectedMonth) > 202203) {
    rank_history = aptData.data[index]["rank_history"];
    rankMonth = [];
    rankData = [];
    history_length = 0;
    if (rank_history.length > 12) {
      history_length = 12;
    } else {
      history_length = rank_history.length;
    }



    for (var j = 0; j < history_length; j++) {
      rankMonth.push("'" + rank_history[j][0].substr(2, 2) + "." + rank_history[j][0].substr(4, 2));
      rankData.push(rank_history[j][2]);
    }

    rankMonth.reverse();
    rankData.reverse();
    drawRankChart(rankMonth, rankData, 110);
  }

  if (login_status) {
    drawChart(aptValue.toFixed(2), livingScore, transportScore, infraScore, eduScore);
    drawSubChart(livingScore, avgLivingScore, "주거총점", "지역평균", "#fe4040", "#9f9f9f", "livingChart");
    if (isNaN(transportScore) == false) {
      drawSubChart(transportScore, avgTransportScore, "교통총점", "지역평균", "#fe4040", "#9f9f9f", "transportChart");
    }
    drawSubChart(infraScore, avgInfraScore, "인프라총점", "지역평균", "#fe4040", "#9f9f9f", "infraChart");
    drawSubChart(eduScore, avgEduScore, "교육총점", "지역평균", "#fe4040", "#9f9f9f", "eduChart");
    drawSubChart(eduScore, avgEduScore, "인구총점", "일자리총점", "#fe4040", "#fe4040", "regionChart");
  }

  if (Number(selectedMonth) > 202209) {
    price_sOption = "";
    price_eOption = "";
    for (w = 0; w < sales_history_date.length - 1; w++) {
      var dateLabel = formatOptionDate(sales_history_date[w]);
      price_sOption += `<option value='${w}'>${dateLabel}</option>`;
    }
    for (w = 1; w < sales_history_date.length; w++) {
      var dateLabel = formatOptionDate(sales_history_date[w]);
      price_eOption += `<option value='${w}'>${dateLabel}</option>`;
    }
    $("#pStart").html(price_sOption);
    $("#pStart").val(30).prop("selected", true);

    $("#pEnd").html(price_eOption);
    $("#pEnd")
      .val(sales_history_date.length - 1)
      .prop("selected", true);

    if (apt_type != "분양(예정)") {
      priceChartDraw(priceCharts, sales_history_price, sales_history_date, 0, sales_history_date.length);
    }
  }

  //초기 그래프 표시 안 함
  $(".priceGraph").hide();
  $(".popSubPriceTable").css({
    "margin-top": "3px",
    "margin-bottom": "0px",
  });
  price_sDateChange($("#pStart").val());
  setComplexLike(searchCode.toString(), aptName);

  //리스트 선택 시, 지도 아이콘 애니메이션
  mapBounds = defaultMap.getBounds();
  current_zoom = defaultMap.getZoom();
  target_position = { lat: coord_y, lng: coord_x };

  if (mapBounds.hasLatLng(target_position)) {
    if (current_zoom >= zoom_levels[0]) {
      marker_obj = window["large_marker_obj_" + searchCode];
      visit_obj = window["visit_obj_" + searchCode];
    } else if (current_zoom < zoom_levels[0] && current_zoom >= zoom_levels[1]) {
      marker_obj = window["small_marker_obj_" + searchCode];
    }
    if (marker_obj) {
      marker_obj.setZIndex((marker_z_depth += 1));
      animateMarker(marker_obj, visit_obj);
    }
  } else {
    defaultMap.setCenter(target_position);
    if (current_zoom >= zoom_levels[0]) {
      marker_obj = window["large_marker_obj_" + searchCode];
      visit_obj = window["visit_obj_" + searchCode];
    } else if (current_zoom < zoom_levels[0] && current_zoom >= zoom_levels[1]) {
      marker_obj = window["small_marker_obj_" + searchCode];
    }
    if (marker_obj) {
      marker_obj.setZIndex((marker_z_depth += 1));
      animateMarker(marker_obj, visit_obj);
    }
  }

  if (current_zoom < zoom_levels[1]) {
    defaultMap.setZoom(zoom_levels[0]);
  }

  prev_selection = current_selection;
  current_selection = searchCode;
  current_apt_name = aptName;

  ///////////////////////////////////////////

  ////////////////////////////////////////
  setTimeout(function () {
    $("#pageLoadingBack").remove();
    openModal("baseModal");
  }, 350);
}

/**
 * @function changeMetaTag
 * @description 단지 상세 정보를 열었을 때, 카카오톡 공유 및 포털 검색 로봇 최적화를 위해 동적으로 Meta OG(오픈그래프) 태그와 타이틀 태그를 단지 맞춤형 정보로 변경합니다.
 * @param {string} aptName - 아파트 단지명
 * @param {string} addr - 단지 도로명/법정동 주소
 * @param {string} rank - 현재 설정 기준 내의 랭크/순위
 * @param {string} short_name - 시도/군구 축약 지역명
 * @param {string} url - 공유용 표준 캐노니컬 URL
 * @param {number} aptValue - 입지 총점
 */
function changeMetaTag(aptName, addr, rank, short_name, url, aptValue) {
  dong_name = "";
  split_addr = addr.split(" ");
  if (split_addr[1].slice(-1) == "구") {
    dong_name = split_addr[2];
  } else {
    if (split_addr[2].slice(-1) == "구") {
      dong_name = split_addr[3];
    } else {
      dong_name = split_addr[2];
    }
  }

  main_title = "'" + dong_name + " " + aptName + "'" + " 입지분석, 시세, 실거래가 | 표준화된 리얼랭커스 입지분석";
  $(document).attr("title", main_title);

  meta_title = "'" + aptName + "'" + "의 입지 점수는 " + aptValue + "점 | 표준화된 리얼랭커스 입지분석";
  $("meta[property='og\\:title']").attr("content", main_title);

  $("meta[property='og\\:url']").attr("content", url);

  meta_description = "'" + aptName + "'" + "의 주거, 교통, 인프라, 교육 환경 분석 정보를 데이터로 확인하세요.";
  $("meta[property='og\\:description']").attr("content", meta_description);

  $("meta[property='og\\:site_name']").attr("content", "리얼랭커스");

  $("meta[name='twitter\\:card']").attr("content", "summary");
  $("meta[name='twitter\\:url']").attr("content", url);
  $("meta[name='twitter\\:title']").attr("content", meta_title);
  $("meta[name='twitter\\:description']").attr("content", meta_description);

}

/**
 * @function changeMetaTagToDefault
 * @description 상세 정보 모달창이 닫히면 Meta OG 태그 및 문서 타이틀을 리얼랭커스 기본 메인 페이지 값으로 원복시킵니다.
 */
function changeMetaTagToDefault() {
  main_title = "리얼랭커스 - 데이터로 분석된 아파트 입지 순위";
  $(document).attr("title", main_title);

  meta_title = "객관적이고 표준화된 아파트 입지분석 | 리얼랭커스";
  $("meta[property='og\\:title']").attr("content", main_title);

  $("meta[property='og\\:url']").attr("content", "https://www.realrankus.com/");

  meta_description = "데이터로 분석된 대한민국 아파트 입지";
  $("meta[property='og\\:description']").attr("content", meta_description);

  $("meta[property='og\\:site_name']").attr("content", "리얼랭커스");

  $("meta[name='twitter\\:card']").attr("content", "summary");
  $("meta[name='twitter\\:url']").attr("content", "https://www.realrankus.com/");
  $("meta[name='twitter\\:title']").attr("content", meta_title);
  $("meta[name='twitter\\:description']").attr("content", meta_description);
}

/**
 * @function graphShowHide
 * @description 상세 모달창 내부의 실거래 매매가 변동 옵션에서 '그래프보기' 체크박스 체크 상태에 따라 차트 캔버스 영역을 슬라이드 토글(노출/숨김)합니다.
 * @param {HTMLInputElement} obj - 체크박스 엘리먼트 객체
 */
function graphShowHide(obj) {
  if (obj.checked) {
    $(".priceGraph").show();
    $(".popSubPriceTable").css({
      "margin-top": "10px",
      "margin-bottom": "10px",
    });
  } else {
    $(".priceGraph").hide();
    $(".popSubPriceTable").css({
      "margin-top": "3px",
      "margin-bottom": "0px",
    });
  }
}

/**
 * @function price_sDateChange
 * @description 실거래가 그래프 범위의 시작 월 선택이 변경되었을 때 호출되는 이벤트 함수.
 * 종료 월의 최소값 옵션을 조정하고 차트 데이터셋을 갱신합니다.
 * @param {string} val - 선택된 시작 날짜 인덱스
 */
function price_sDateChange(val) {
  startVal = Number(val) + 1;
  endVal = $("#pEnd").val();

  eDateOption = "";
  for (var w = startVal; w < sales_history_date.length; w++) {
    var dateLabel = formatOptionDate(sales_history_date[w]);
    eDateOption += `<option value='${w}'>${dateLabel}</option>`;
  }
  $("#pEnd").html(eDateOption);

  if (endVal > startVal) {
    $("#pEnd").val(endVal).prop("selected", true);
  } else {
    endVal = $("#pEnd").val();
  }

  priceChartUpdate(priceCharts, sales_history_price, sales_history_date, startVal, endVal);
}

/**
 * @function price_eDateChange
 * @description 실거래가 그래프 범위의 종료 월 선택이 변경되었을 때 호출되는 이벤트 함수.
 * 차트 데이터셋을 해당 범위로 업데이트합니다.
 * @param {string} val - 선택된 종료 날짜 인덱스
 */
function price_eDateChange(val) {
  startVal = $("#pStart").val();
  endVal = Number(val) - 1;

  priceChartUpdate(priceCharts, sales_history_price, sales_history_date, startVal, endVal);
}

/**
 * @function priceChartUpdate
 * @description 사용자가 날짜 범위를 드롭다운으로 조절했을 때 ChartJS 데이터 셋의 영역(기존 대비 기간을 회색선/활성선 구분)을 나누어 업데이트하고 시세 증감폭(금액, 퍼센트 비율) 텍스트를 갱신합니다.
 * @param {string[]} priceChart - 갱신할 캔버스 ID 배열
 * @param {number[][]} sales_history_price - 평형별 실거래가 역사 배열
 * @param {string[]} sales_history_date - 실거래가 날짜 목록 배열
 * @param {number} sVal - 선택한 시작 날짜의 인덱스
 * @param {number} eVal - 선택한 종료 날짜의 인덱스
 */
function priceChartUpdate(priceChart, sales_history_price, sales_history_date, sVal, eVal) {
  for (var p = 0; p < priceChart.length; p++) {
    sales_grayHistory1 = [];
    sales_pHistory = [];
    sales_grayHistory2 = [];

    sales_pHistory.push(null);
    sales_grayHistory1.push(null);
    sales_grayHistory2.push(null);

    sales_dHistory = [];
    sales_dHistory.push("");

    for (var y = 0; y < sales_history_date.length; y++) {
      var rawVal = sales_history_price[p][y];
      var chartVal = 0;
      if (rawVal != 0) {
        chartVal = isEn ? Math.round(rawVal / 100) : Number((rawVal / 10000).toFixed(1));
      }

      if (y < sVal) {
        sales_grayHistory1.push(chartVal);
        sales_pHistory.push(null);
        sales_grayHistory2.push(null);
      }
      if (y >= sVal && y <= eVal) {
        sales_grayHistory1.push(null);
        sales_pHistory.push(chartVal);
        sales_grayHistory2.push(null);
      }
      if (y > eVal) {
        sales_grayHistory1.push(null);
        sales_pHistory.push(null);
        sales_grayHistory2.push(chartVal);
      }
      var dateLabel = formatOptionDate(sales_history_date[y]);
      sales_dHistory.push(dateLabel);
    }
    sales_pHistory.push(null);
    sales_grayHistory1.push(null);
    sales_grayHistory2.push(null);
    sales_dHistory.push("");

    chartView[p].data.datasets[0].data = sales_grayHistory1;
    chartView[p].data.datasets[1].data = sales_pHistory;
    chartView[p].data.datasets[2].data = sales_grayHistory2;
    chartView[p].update();

    sPrice = sales_history_price[p][sVal];
    ePrice = sales_history_price[p][eVal - 1];
    priceRatio = ((ePrice / sPrice - 1) * 100).toFixed(1);

    var priceChangeText, priceRatioText;
    if (isEn) {
      var sPriceM = Math.round(sPrice / 100).toLocaleString();
      var ePriceM = Math.round(ePrice / 100).toLocaleString();
      var priceGapM = Math.round((ePrice - sPrice) / 100).toLocaleString();

      priceChangeText = `${sPriceM}M → ${ePriceM}M`;
      priceRatioText = "";
      if (sPrice == 0) {
        priceRatioText += ` ( --- , --- )`;
      } else {
        if (ePrice - sPrice >= 0) {
          priceRatioText += ` (+${priceGapM}M, `;
        } else {
          priceRatioText += ` (${priceGapM}M, `;
        }
        if (priceRatio > 0) {
          priceRatioText += `<span style='color:#fe4040'>▲${priceRatio}%</span>)`;
        } else if (priceRatio == 0) {
          priceRatioText += `<span style='color:#000'>${priceRatio}%</span>)`;
        } else {
          priceRatioText += `<span style='color:blue'>▼${priceRatio * -1}%</span>)`;
        }
      }
    } else {
      var priceGap = ((ePrice - sPrice) / 10000).toFixed(2);
      priceChangeText = `${(sPrice / 10000).toFixed(2)} → ${(ePrice / 10000).toFixed(2)}억`;
      priceRatioText = "";
      if (sPrice == 0) {
        priceRatioText += ` ( --- , --- )`;
      } else {
        if (priceGap >= 0) {
          priceRatioText += ` (+${priceGap}억, `;
        } else {
          priceRatioText += ` (${priceGap}억, `;
        }
        if (priceRatio > 0) {
          priceRatioText += `<span style='color:#fe4040'>▲${priceRatio}%</span>)`;
        } else if (priceRatio == 0) {
          priceRatioText += `<span style='color:#000'>${priceRatio}%</span>)`;
        } else {
          priceRatioText += `<span style='color:blue'>▼${priceRatio * -1}%</span>)`;
        }
      }
    }
    $("#pChange" + p).html(priceChangeText);
    $("#pRatio" + p).html(priceRatioText);
  }
}

/**
 * @function priceChartDraw
 * @description 상세 정보 내 개별 평형별 매매 실거래가 추이를 그리기 위해 데이터를 전처리하여 최종 차트 드로잉 함수(`drawPriceChart`)를 호출합니다.
 * @param {string[]} priceChart - 차트 캔버스 ID 목록 배열
 * @param {number[][]} sales_history_price - 평형별 실거래가 역사 배열
 * @param {string[]} sales_history_date - 실거래가 날짜 목록 배열
 * @param {number} sVal - 시작 인덱스
 * @param {number} eVal - 종료 인덱스
 */
function priceChartDraw(priceChart, sales_history_price, sales_history_date, sVal, eVal) {
  for (var p = 0; p < priceChart.length; p++) {
    sales_grayHistory1 = [];
    sales_pHistory = [];
    sales_grayHistory2 = [];

    sales_pHistory.push(null);
    sales_grayHistory1.push(null);
    sales_grayHistory2.push(null);

    sales_dHistory = [];
    sales_dHistory.push("");

    for (var y = 0; y < sales_history_date.length; y++) {
      var rawVal = sales_history_price[p][y];
      var chartVal = 0;
      if (rawVal != 0) {
        chartVal = isEn ? Math.round(rawVal / 100) : Number((rawVal / 10000).toFixed(1));
      }

      if (y < sVal) {
        sales_grayHistory1.push(chartVal);
        sales_pHistory.push(null);
        sales_grayHistory2.push(null);
      }
      if (y >= sVal && y <= eVal) {
        sales_grayHistory1.push(null);
        sales_pHistory.push(chartVal);
        sales_grayHistory2.push(null);
      }
      if (y > eVal) {
        sales_grayHistory1.push(null);
        sales_pHistory.push(null);
        sales_grayHistory2.push(chartVal);
      }
      var dateLabel = formatOptionDate(sales_history_date[y]);
      sales_dHistory.push(dateLabel);
    }
    sales_pHistory.push(null);
    sales_grayHistory1.push(null);
    sales_grayHistory2.push(null);
    sales_dHistory.push("");

    priceMax = Math.max(...sales_pHistory) * 1.3;
    drawPriceChart(sales_dHistory, sales_grayHistory1, sales_pHistory, sales_grayHistory2, priceChart[p], priceMax, p);

    sPrice = sales_history_price[p][sVal];
    ePrice = sales_history_price[p][eVal - 1];
    priceRatio = ((ePrice / sPrice - 1) * 100).toFixed(1);

    var priceChangeText, priceRatioText;
    if (isEn) {
      var sPriceM = Math.round(sPrice / 100).toLocaleString();
      var ePriceM = Math.round(ePrice / 100).toLocaleString();
      var priceGapM = Math.round((ePrice - sPrice) / 100).toLocaleString();

      priceChangeText = `${sPriceM}M → ${ePriceM}M`;
      priceRatioText = "";
      if (sPrice == 0) {
        priceRatioText += ` ( --- , --- )`;
      } else {
        if (ePrice - sPrice >= 0) {
          priceRatioText += ` (+${priceGapM}M, `;
        } else {
          priceRatioText += ` (${priceGapM}M, `;
        }
        if (priceRatio > 0) {
          priceRatioText += `<span style='color:#fe4040'>▲${priceRatio}%</span>)`;
        } else if (priceRatio == 0) {
          priceRatioText += `<span style='color:#000'>${priceRatio}%</span>)`;
        } else {
          priceRatioText += `<span style='color:blue'>▼${priceRatio * -1}%</span>)`;
        }
      }
    } else {
      var priceGap = ((ePrice - sPrice) / 10000).toFixed(2);
      priceChangeText = `${(sPrice / 10000).toFixed(2)} → ${(ePrice / 10000).toFixed(2)}억`;
      priceRatioText = "";
      if (sPrice == 0) {
        priceRatioText += ` ( --- , --- )`;
      } else {
        if (priceGap >= 0) {
          priceRatioText += ` (+${priceGap}억, `;
        } else {
          priceRatioText += ` (${priceGap}억, `;
        }
        if (priceRatio > 0) {
          priceRatioText += `<span style='color:#fe4040'>▲${priceRatio}%</span>)`;
        } else if (priceRatio == 0) {
          priceRatioText += `<span style='color:#000'>${priceRatio}%</span>)`;
        } else {
          priceRatioText += `<span style='color:blue'>▼${priceRatio * -1}%</span>)`;
        }
      }
    }
    $("#pChange" + p).html(priceChangeText);
    $("#pRatio" + p).html(priceRatioText);
  }
}

/**
 * @function updateRegionTable
 * @description 전국 단위(시/도 비교)가 선택되었을 때 전국 17개 지자체 투자 등급, 아파트 공급 수준, 인구 증감 추이, 일자리수, 평균 소득 등 요약 행렬 정보를 렌더링하고 지도를 전국 중심으로 조정합니다.
 * @param {string} month - 분석 대상 월
 * @param {string} region - 전국 코드 ("1000000000_Korea")
 */
function updateRegionTable(month, region) {
  $("#sort").css("visibility", "hidden");
  $("#rearrange").css("visibility", "visible");
  url = pathPrefix + month + "/" + region + ".json" + update_ver;

  $("#dataList_wrapper").css({
    "margin-top": "96px",
    height: window.innerHeight - ($("#titleBar").height() + $("#selections").height() + 23 + $("#linkToAptrank_bottom").height()),
  });

  if (isMobile) {
    $("#dataMap").css({
      "margin-top": $("#titleBar").height() + $("#selections").height() + 20,
      height: window.innerHeight - ($("#titleBar").height() + $("#selections").height() + $("#linkToAptrank_bottom").height()),
    });
  }
  $("#dataList").html("");

  //광고정보 로딩
  $.ajaxSetup({ async: false });
  load_parrtnership(region);
  $.ajaxSetup({ async: true });

  $.getJSON(url, function (json) {
    regData = json;
    regSortData = regData;
    itemNum = json.data.length;
    regValueSum = 0;
    regSupplySum = 0;
    regPopSum = 0;
    regJobSum = 0;
  }).done(function () {
    //광고정보표시
    show_partnership();

    for (var i = 0; i < itemNum; i++) {
      var regName = regData.data[i]["시도"];
      if (isEn) {
        regName = getRegionNameFromLink(regData.data[i]["연결명"]);
      }

      var regSuplyLevel = regData.data[i]["공급수준"];
      var regPopChange = regData.data[i]["인구증감"];
      var regPop = regData.data[i]["인구수"];
      var regIncome = regData.data[i]["소득수준"];
      var regValue = Math.round(regData.data[i]["가치 총점"] * 100) / 100;
      var regRank = regData.data[i]["rank"];
      var regJob = regData.data[i]["일자리"];

      regValueSum += regData.data[i]["가치 총점"];
      regSupplySum += regData.data[i]["지역구공급총점"];
      regPopSum += regData.data[i]["인구총점"];
      regJobSum += regData.data[i]["일자리총점"];

      var addon_html = "<div class='listBox' id='myModal' onClick='showRegionDetail(" + i + ")'>";

      region_grade = "";

      if (regValue >= 60) {
        region_grade = "S";
      } else if (regValue >= 40 && regValue < 60) {
        region_grade = "A";
      } else if (regValue >= 15 && regValue < 40) {
        region_grade = "B";
      } else {
        region_grade = "C";
      }

      addon_html += `
            <div class='rank_content'>
            <div class='ranksame'>INVEST</div>
            <div class='rank'>${region_grade}</div>
            </div>
          `;

      addon_html += `
            <div class='content'>
            <div class='apt_name'>${regName}</div>
            <div class='reg_subTable'>
          `;

      if(isEn){
        if(regSuplyLevel == "부족"){
          regSuplyLevel = "shortage";
        }
        else if(regSuplyLevel == "적정"){
          regSuplyLevel = "proper";
        }
        else if(regSuplyLevel == "과다"){
          regSuplyLevel = "excess";
        }
      }

      var supplyLevelTrans = tSafe("ui.supply_level." + regSuplyLevel, regSuplyLevel);
      var supplyText = tSafe("ui.region_table.supply_format", "아파트 공급량 <span style='font-weight:900; color:#0f0f0f'>{level}</span>")
        .replace("{level}", supplyLevelTrans);
      addon_html += `
            <div class='apt_address'>${supplyText}</div>
          `;

      var upDown = "";
      var popChange = "";
      if (regPopChange < 0) {
        upDown = tSafe("ui.pop_change_dir.decrease", "감소");
        popChange = "▼" + Math.abs(regPopChange).toLocaleString();
      } else {
        upDown = tSafe("ui.pop_change_dir.increase", "증가");
        popChange = "▲" + Math.abs(regPopChange).toLocaleString();
      }

      var popText = tSafe("ui.region_table.population", "인구 {pop}명")
        .replace("{pop}", Math.abs(regPop).toLocaleString());
      addon_html += `<div class='apt_address'><span class='regionPop'>${popText}</span>`;
      if (regPopChange >= 0) {
        addon_html += `<span class='regionPopUp'> (${popChange})</span></div>`;
      } else {
        addon_html += `<span class='regionPopDown'> (${popChange})</span></div>`;
      }

      if(isEn){
        regIncome = Math.round(regIncome / 1000000) + "M";
      }

      var jobText = tSafe("ui.region_table.jobs", "일자리 {job}개")
        .replace("{job}", Number(Number(regJob).toFixed(0)).toLocaleString());
      var incomeText = tSafe("ui.region_table.income", "소득 {income}원")
        .replace("{income}", regIncome.toLocaleString());
      addon_html += `
            <div class='apt_address'><span class='regionJob'>${jobText}</span></div>
            <div class='apt_address'>${incomeText}</div>
            </div></div>
          `;
      //addon_html += "<div class='value_score'>" + (Math.round(regValue * 100) / 100).toFixed(2) + "점</div>";
      addon_html += `
            <div class='value_score'></div>
            </div>
          `;

      $("#dataList").append(addon_html);
    }
    $("#dataList").append("<div style='height: " + blank_height + "'></div>");

    if (!isMobile) {
      region_center = new naver.maps.LatLng(regData.data[0]["y"], regData.data[0]["x"]);

      if (!defaultMap) {
        setTimeout(function () {
          if (defaultMap) {
            defaultMap.setCenter(region_center);
            defaultMap.setZoom(13);
            $("#pageLoadingBack").remove();
          }
        }, 1000);
      } else {
        defaultMap.setCenter(region_center);
        defaultMap.setZoom(13);
        $("#pageLoadingBack").remove();
      }
    } else {
      defaultMap.setCenter({ lat: 36.6778, lng: 127.9564 });
      defaultMap.setZoom(8);
      showHideMarker(8);
      $("#pageLoadingBack").remove();
    }
  });

  saveLocalStorage();
  $("#pageLoadingBack").remove();
}

/**
 * @function showRegionDetail
 * @description 전국 비교 테이블에서 특정 지자체(시/도) 행을 선택하면 나타나는 지자체 종합 진단 모달(공급물량 과부족, 인근 연계 지자체 공급량, 인구 차트, 일자리 차트, 전세가율/매매지수 차트)을 빌드하고 띄웁니다.
 * @param {number} index - 선택된 시/도의 데이터 인덱스
 */
function showRegionDetail(index) {
  if (isMobile) {
    $(".modal-backdrop").css({ width: "100%" });
    $("#baseModal").css({ width: "100%" });
  } else {
    $(".modal-backdrop").css({ width: "600px" });
    $("#baseModal").css({ width: "600px" });
  }

  titleHtml = "";
  detailHtml = "";
  footerHtml = "";
  var rank_suffix = tSafe("ui.rank_suffix", "위");
  var regRank = isEn
    ? "Rank " + regData.data[index]["rank"] + " of " + regData.data[itemNum - 1]["rank"]
    : regData.data[index]["rank"] + "/" + regData.data[itemNum - 1]["rank"] + rank_suffix;

  var regName = regData.data[index]["시도"];
  var regName_ko = regData.data[index]["시도"];
  if (isEn) {
    regName = getRegionNameFromLink(regData.data[index]["연결명"]);
  }
  var regValue = (Math.round(regData.data[index]["가치 총점"] * 100) / 100).toFixed(2);

  var regSupplyAll = regData.data[index]["총물량"];
  var regSupplyProper = regData.data[index]["적정입주물량"];
  var regSupplyUpDown = Math.abs(regData.data[index]["과부족수"]);

  var regSupplyAll_nearby = regData.data[index]["인근총합공급량"];
  var regSupplyProper_nearby = regData.data[index]["총합적정공급량"];
  var regSupplyUpDown_nearby = Math.abs(regData.data[index]["총합과부족수"]);
  var nearby_info = regData.data[index]["인근지역정보"];

  var regSupplyLevel = regData.data[index]["공급수준"];
  var regSupplyScore = (Math.round(regData.data[index]["지역구공급총점"] * 100) / 100).toFixed(2);

  var regPop = regData.data[index]["인구수"];
  var regPopUpDown = regData.data[index]["인구증감"];
  var regPopScore = (Math.round(regData.data[index]["인구총점"] * 100) / 100).toFixed(2);

  var regJob = regData.data[index]["일자리"];
  var regIncome = regData.data[index]["소득수준"];
  var regJobScore = (Math.round(regData.data[index]["일자리총점"] * 100) / 100).toFixed(2);
  linked = regData.data[index]["연결명"];

  //지도 표시 추가
  var lat = regData.data[index]["y"];
  var lng = regData.data[index]["x"];

  region_center = new naver.maps.LatLng(lat, lng);
  defaultMap.setCenter(region_center);
  defaultMap.setZoom(13);

  //Title
  //titleHtml += "<div class='popupTitle'>" + aptName + " " + apt_p + "(" + apt_m + ")</div>";
  titleHtml += `<div class='popupTitle'>${regName}</div>`;

  //총점,순위
  detailHtml += `
        <div class='card'>
        <div class='card-header'>
      `;

  region_grade = "";
  if (regValue >= 60) {
    region_grade = "S";
  } else if (regValue >= 40 && regValue < 60) {
    region_grade = "A";
  } else if (regValue >= 15 && regValue < 40) {
    region_grade = "B";
  } else {
    region_grade = "C";
  }



  detailHtml += `<div class='popRank'>Invest '${region_grade}'</div></div>`;

  detailHtml += `
        <div class='card-body'>
        <div class='graph' style='height: 200px'> <canvas id='valueChart'></canvas></div>
        <div class='comment'>${tSafe("ui.region_detail.score_comment", "(전국 모든 시군구에 대해 100점으로 환산한 상대 점수 입니다.)")}</div>
      `;



  detailHtml += `</div></div>`;

  //물량
  detailHtml += `
        <div class='card'>
        <div class='card-header'>
      `;
  var start_y = selectedMonth.substr(0, 4);
  var end_y = (Number(start_y) + 1).toString();
  var start_m = selectedMonth.substr(4, 2);
  var duration = "<span style='font-size:0.8em'> (" + start_y + "-" + start_m + " ~ " + end_y + "-" + start_m + ") </span>";
  var supplyTitle = tSafe("ui.region_detail.supply_title", "<i class='fas fa-building'></i>&nbsp&nbsp공급량");
  var supplyComment1 = tSafe("ui.region_detail.supply_comment_1", "2022년 9월 부터 인근 지역의 공급량 총합으로 과부족을 표시합니다.");
  var supplyComment2 = tSafe("ui.region_detail.supply_comment_2", "적정 공급량은 \"인구 X 0.5%\"로 계산됩니다.");

  detailHtml += `
        <div class='popTitle'>${supplyTitle}${duration}</div>
        <div class='comment2'>${supplyComment1}</div>
        <div class='comment2'>${supplyComment2}</div>
        </div>
      `;
  detailHtml += `        
        <div class='card-body'>
        <div id='popLiving'>
        <div class='popTable'>
      `;
  //detailHtml += "<div class='graph' style='height: 120px'> <canvas id='supplyChart'></canvas></div>"

  var totalSupplyLabel = tSafe("ui.region_detail.total_supply", "총 공급량");
  var properSupplyLabel = tSafe("ui.region_detail.proper_supply", "적정 공급량");
  var supplyStatusLabel = tSafe("ui.region_detail.supply_status", "과부족");

  var totalSupplyVal = tSafe("ui.region_detail.households_unit", "{count}세대")
    .replace("{count}", Math.round(regSupplyProper_nearby).toLocaleString());
  var properSupplyVal = tSafe("ui.region_detail.households_unit", "{count}세대")
    .replace("{count}", Math.round(regSupplyAll_nearby).toLocaleString());

  if(isEn){
    if(regSupplyLevel == "부족"){
      regSupplyLevel = "shortage";
    }
    else if(regSupplyLevel == "적정"){
      regSupplyLevel = "proper";
    }
    else if(regSupplyLevel == "과다"){
      regSupplyLevel = "excess";
    }
  }    

  var supplyLevelTrans = tSafe("ui.supply_level." + regSupplyLevel, regSupplyLevel);
  var supplyStatusVal = tSafe("ui.region_detail.status_format_short", "{count}세대 공급 {status}")
    .replace("{count}", Math.round(regSupplyUpDown_nearby).toLocaleString())
    .replace("{status}", supplyLevelTrans);

  detailHtml += `<div class='popSubTable'><div class='popContent'>${totalSupplyLabel}</div>`;
  detailHtml += `<div class='popResult'>${totalSupplyVal}</div></div>`;
  detailHtml += `<div class='popSubTable'><div class='popContent'>${properSupplyLabel}</div>`;
  detailHtml += `<div class='popResult'>${properSupplyVal}</div></div>`;
  detailHtml += `<div class='popSubTable' id='regionSupplyStatus'><div class='popContent'>${supplyStatusLabel}</div>`;
  detailHtml += `<div class='popResult'>${supplyStatusVal}</div></div>`;

  if(isEn){
    //regName에 마지막 단어만 남기고 제거 (예: "Gyeonggi-do" -> "Gyeonggi")
    var regNameParts = regName.split(" ");
    regName = regNameParts[regNameParts.length - 1];
  }

  detailHtml += `
        <div class='column2'>
        <div class='column_table'>
        <div class='column_table_title'>${regName}</div>
        <div class='column_table_content'>
      `;
  if (regData.data[index]["과부족수"] > 0) {
    vol_info = "shortage";
  } else if (regData.data[index]["과부족수"] < 0) {
    vol_info = "excess";
  } else if (regData.data[index]["과부족수"] == 0) {
    vol_info = "proper";
  }
  var volInfoTrans = tSafe("ui.supply_level." + vol_info, vol_info);
  var supplyResultText = tSafe("ui.region_detail.status_format_short", "{count}세대 공급 {status}")
    .replace("{count}", regSupplyUpDown.toFixed())
    .replace("{status}", volInfoTrans);
  detailHtml += `
        <div class='supplySubTable'><div class='supplyResult'>${supplyResultText}</div></div>
        </div>
        </div>
      `;

  for (var i = 0; i < nearby_info.length; i++) {
    detailHtml += `<div class='column_table'>`;
    region_name_array = nearby_info[i][0].split(" ");

    var short_region_name = "";
    if (isEn) {
      var full_name = nearby_info[i][0];
      var match_item = regData.data.find(item => item["시도"] === full_name);
      if (match_item) {
        short_region_name = getRegionNameFromLink(match_item["연결명"]);
      } else {
        short_region_name = region_name_array.slice(1).join(" ");
      }
    } else {
      for (var k = 1; k < region_name_array.length; k++) {
        short_region_name += region_name_array[k] + " ";
      }
      short_region_name = short_region_name.trim();
    }
    if(isEn){
      //short_region_name에서 마지막 단어만 남기고 제거 (예: "Gyeonggi-do" -> "Gyeonggi")
      var shortNameParts = short_region_name.split(" ");
      short_region_name = shortNameParts[shortNameParts.length - 1];
    }

    detailHtml += `
          <div class='column_table_title'>${short_region_name}<span style='font-size:0.9em'>(${nearby_info[i][5].toFixed(1)} km)</span>
          </div>
          <div class='column_table_content'>
        `;
    if (nearby_info[i][2] - nearby_info[i][3] > 0) {
      vol_info = "excess";
    } else if (nearby_info[i][2] - nearby_info[i][3] < 0) {
      vol_info = "shortage";
    } else if (nearby_info[i][2] - nearby_info[i][3] == 0) {
      vol_info = "proper";
    }

    var volInfoTransNearby = tSafe("ui.supply_level." + vol_info, vol_info);
    var nearbySupplyText = tSafe("ui.region_detail.status_format_short", "{count}세대 공급 {status}")
      .replace("{count}", Math.abs(nearby_info[i][2] - nearby_info[i][3]).toFixed().toLocaleString())
      .replace("{status}", volInfoTransNearby);

    detailHtml += `<div class='supplySubTable'><div class='supplyResult'>${nearbySupplyText}</div></div>`;
    detailHtml += `
          </div>
          </div>
        `;
  }
  detailHtml += `</div></div></div></div></div>`;

  avgSupplyScore = (Math.round((regSupplySum / itemNum) * 100) / 100).toFixed(2);

  //인구
  var popTitleLabel = tSafe("ui.region_detail.population_title", "<i class='fas fa-user-friends'></i>&nbsp&nbsp인구");
  var popCountLabel = tSafe("ui.region_detail.pop_count", "인구수");
  var popChangeLabel = tSafe("ui.region_detail.pop_change", "인구증가");

  var popCountVal = tSafe("ui.region_detail.pop_count_val", "{count}명")
    .replace("{count}", regPop.toLocaleString());
  var popChangeVal = tSafe("ui.region_detail.pop_change_val", "{count}명")
    .replace("{count}", Math.round(regPopUpDown).toLocaleString());

  detailHtml += `
        <div class='card'>
        <div class='card-header'>
        <div class='popTitle'>${popTitleLabel}</div>
        </div>
        <div class='card-body'>
        <div id='popInfra'>
        <div class='graph' style='height: 120px'> <canvas id='popChart'></canvas></div>
        <div class='popTable'>
        <div class='popSubTable'><div class='popContent'>${popCountLabel}</div><div class='popResult'>${popCountVal}</div></div>
        <div class='popSubTable'><div class='popContent'>${popChangeLabel}</div><div class='popResult'>${popChangeVal}</div></div>
        </div></div></div></div>
      `;
  avgPopScore = (Math.round((regPopSum / itemNum) * 100) / 100).toFixed(2);

  //일자리
  var jobsTitleLabel = tSafe("ui.region_detail.jobs_title", "<i class='fas fa-user-md'></i>&nbsp&nbsp일자리");
  var jobsCountLabel = tSafe("ui.region_detail.jobs_count", "일자리수");
  var avgIncomeLabel = tSafe("ui.region_detail.avg_income", "평균소득");

  var jobCountVal = tSafe("ui.region_detail.job_count_val", "{count}개")
    .replace("{count}", regJob.toLocaleString());
  var incomeVal = tSafe("ui.region_detail.income_val", "{count}원")
    .replace("{count}", regIncome.toLocaleString());

  detailHtml += `
        <div class='card'>
        <div class='card-header'>
        <div class='popTitle'>${jobsTitleLabel}</div>
        </div>
        <div class='card-body'>
        <div id='popEducation'>
        <div class='graph' style='height: 120px'> <canvas id='jobChart'></canvas></div>
        <div class='popTable'>
        <div class='popSubTable'><div class='popContent'>${jobsCountLabel}</div><div class='popResult'>${jobCountVal}</div></div>
        <div class='popSubTable'><div class='popContent'>${avgIncomeLabel}</div><div class='popResult'>${incomeVal}</div></div>
        </div></div></div></div>
      `;
  avgJobScore = (Math.round((regJobSum / itemNum) * 100) / 100).toFixed(2);

  //매매, 전세가격지수
  if (rateExist.includes(regName_ko)) {
    url = "https://www.realrankus.com/" + selectedMonth + "/Price_Rate/" + regName_ko + ".json" + update_ver;

    var priceIndexTitle = tSafe("ui.region_detail.price_index_title", "<i class='fa-solid fa-chart-line'></i>&nbsp&nbsp매매/전세 가격 지수");
    var priceIndexComment = tSafe("ui.region_detail.price_index_comment", "매매/전세 가격 지수는 KB부동산 정보를 참조하며, 2022년 1월의 가격을 100.0으로 설정한 기준으로 산정됩니다. 100초과는 매수우위, 100미만은 매도우위를 의미합니다.");

    detailHtml += `
          <div class='card'>
          <div class='card-header'>
          <div class='popTitle'>${priceIndexTitle}</div>
          </div>
          <div class='card-body'>
          <div id='popEducation'>
          <div class='graph' style='height: 200px;'> <canvas id='priceRateChart'></canvas></div>
          <hr><div class='comment2'>${priceIndexComment}</div>
          </div></div></div>
        `;
  }

  //Footer에 아파트보기 버튼
  var shortName = regName.substring(regName.search(" "), regName.length);
  var rName = regName.substring(0, regName.search(" "));
  for (var i = 0; i < regions.length; i++) {
    if (regions[i][0] == rName) {
      regionValue = regions[i][1];
    } else {
    }
  }

  if (isEn) {
    var nameParts = regName.split(" ");      
    //shortName에 마지막 단어만 남기고 제거
    shortName = nameParts[nameParts.length - 1];
    
  }

  var shareYear = selectedMonth.substr(0, 4);
  var shareMonthVal = Number(selectedMonth.substr(4, 2)).toString();

  if (isEn) {
    var enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var shareMonthStr = enMonths[Number(shareMonthVal) - 1] || shareMonthVal;
    shareTitle = tSafe("ui.region_detail.share_title_format", "[RealRankus {month}/{year}]\n\n")
      .replace("{month}", shareMonthStr)
      .replace("{year}", shareYear);
  } else {
    shareTitle = tSafe("ui.region_detail.share_title_format", "[리얼랭커스 {year}년 {month}월]\n\n")
      .replace("{year}", selectedMonth.substr(2, 2))
      .replace("{month}", shareMonthVal);
  }

  var supplyLevelTransVal = tSafe("ui.supply_level." + regSupplyLevel, regSupplyLevel);
  var shareTextCountVal = Math.round(regSupplyUpDown).toLocaleString();

  shareText = tSafe("ui.region_detail.share_text_format", "『{regName}』\nㆍ투자등급 : Rank {grade}\nㆍ인구수 : {pop}명\nㆍ공급량 : {supply}세대 {level}\nㆍ일자리 : {job}개\n\n")
    .replace("{regName}", regName)
    .replace("{grade}", region_grade)
    .replace("{pop}", regPop.toLocaleString())
    .replace("{supply}", shareTextCountVal)
    .replace("{level}", supplyLevelTransVal)
    .replace("{job}", regJob.toLocaleString());

  shareURL = "https://www.realrankus.com" + "?reg=" + selectedRegion + "&sub=" + selectedSubRegion + "&mon=" + selectedMonth;

  var viewAptsBtnText = tSafe("ui.region_detail.view_apartments_btn", "{shortName} 아파트 보기")
    .replace("{shortName}", shortName);

  footerHtml += `<div class='modal-footer'>`;
  //footerHtml += "<div></div>"

  if (UserAgent.indexOf("inApp") > -1) {
    footerHtml += `<div><button type='button' class='goApt' data-dismiss='modal' onClick='show_apt(selectedMonth, linked, regionValue)'>${viewAptsBtnText}</button></div>`;
    if (checkMobile() == "ios") {
      footerHtml += `<div class='tShare' onClick='share(shareTitle, shareText, shareURL)'><i class='fa-solid fa-arrow-up-right-from-square'></i></div>`;
    } else {
      footerHtml += `<div class='kakaoShare' onClick='kakaoShare(shareTitle, shareText, shareURL)'><img src = './kakao_icon.png' height='32px'></div>`;
    }
    footerHtml += `<div class='tShare' onClick='CopyToClipboard(shareText, popMsg)'><i class='fa-regular fa-copy'></i></div>`;
  } else {
    footerHtml += `<div><button type='button' class='goApt' data-dismiss='modal' onClick='show_apt(selectedMonth, linked, regionValue)'>${viewAptsBtnText}</button></div>`;
    if (checkMobile() == "ios") {
      footerHtml += `<div class='tShare' onClick='CopyToClipboard(shareText, popMsg)'><i class='fa-regular fa-copy'></i></div>`;
    } else {
      footerHtml += `<div class='kakaoShare' onClick='kakaoShare(shareTitle, shareText, shareURL)'><img src = './kakao_icon.png' height='32px'></div>`;
    }
    footerHtml += `<div class='tShare' onClick='share(shareTitle, shareText, shareURL)'><i class='fa-solid fa-arrow-up-right-from-square'></i></div>`;
  }
  footerHtml += `</div>`;

  $("#baseModalLabel").html(titleHtml);
  $("#aptDetail").html(detailHtml);
  $("#footer").html(footerHtml);

  //}
  //else{
  $(".modal-footer").css({
    "grid-template-columns": "1fr 0.15fr 0.15fr",
    "text-align": "center",
  });
  //}

  if(isEn){
    $("#regionSupplyStatus").css("grid-template-columns", "1.5fr 1.5fr");
  }



  drawChart(regValue, regSupplyScore, regPopScore, regJobScore, "region");
  var popScoreLabel = tSafe("ui.report.population_score_label", "인구총점");
  var jobScoreLabel = tSafe("ui.report.job_score_label", "일자리총점");
  var nationalAvgLabel = tSafe("ui.report.region_average", "전국평균");

  drawSubChart(regPopScore, avgPopScore, popScoreLabel, nationalAvgLabel, "#fe4040", "#9f9f9f", "popChart");
  drawSubChart(regJobScore, avgJobScore, jobScoreLabel, nationalAvgLabel, "#fe4040", "#9f9f9f", "jobChart");

  if (Number(selectedMonth) > 202203) {
    var dateArray = ["", ""];
    var salesArray = [null, null];
    var rentArray = [null, null];

    $.getJSON(url, function (json) {
      rateData = json;
      for (var i = rateData.data.length - 36; i < rateData.data.length; i++) {
        pushed_date = "'" + rateData.data[i]["Date"].toString().substr(2, 2) + "." + rateData.data[i]["Date"].toString().substr(4, 2);
        dateArray.push(pushed_date);
        salesArray.push(rateData.data[i]["Sales"]);
        rentArray.push(rateData.data[i]["Rent"]);
      }

      dateArray.push("");
      dateArray.push("");
      salesArray.push(null);
      salesArray.push(null);
      rentArray.push(null);
      rentArray.push(null);

      drawPriceRateChart(dateArray, salesArray, rentArray);
    });
  }

  setTimeout(function () {
    closeUnifiedSearch();
    openModal("baseModal");
  }, 150);
}

/**
 * @function show_apt
 * @description 지자체(시/도) 비교 상태에서 특정 지역의 "아파트 보기" 버튼을 누르면, 모달 창들을 모두 닫고 해당 지자체의 하위 지역(군/구) 리스트를 띄우도록 설정하여 화면을 갱신합니다.
 * @param {string} month - 현재 로드된 분석 월
 * @param {string} filename - 타겟 군/구 파일 코드 (예: "1168000000_Seoul_Gangnam")
 * @param {string} sido - 타겟 시/도 한글명 또는 영문명
 */
function show_apt(month, filename, sido) {
  $("#sido").val(sido).prop("selected", true);
  selectedMonth = month;
  selectedSubRegion = filename;
  selectedRegion = $("#sido option:selected").val();

  $("#regionSearchCard").animate(
    {
      opacity: 0.0,
      top: "-150px",
    },
    400,
    "easeInQuad",
  );
  $("#closeRegionSearch_floating").animate(
    {
      opacity: 0.0,
      right: "-200px",
    },
    400,
    "easeInQuad",
  );
  $("#regionInputSearch").val("");

  $("#rearrangeRegionCard").animate(
    {
      opacity: 0.0,
      top: "-150px",
    },
    400,
    "easeInQuad",
  );
  $("#closeRegionRearrange_floating").animate(
    {
      opacity: 0.0,
      right: "-200px",
    },
    400,
    "easeInQuad",
  );
  rearrangeSelection = "rearrangeRegionScore";


  closeModal("baseModal");
  closeModal("toggleModal1");
  closeModal("toggleModal2");

  optionChange(filename, "");
  updateRegion();
}

var pcDevice = "win16|win32|win64|mac|macintel";

/**
 * @function openNaver
 * @description 선택된 아파트의 모바일 또는 PC용 네이버 부동산 매물 정보 상세 링크를 새 창(또는 iOS 현재창)으로 띄웁니다.
 * @param {string} code - 단지 고유 네이버 부동산 ID 코드
 */
function openNaver(code) {

  if (isMobile) {
    nURL = "https://m.land.naver.com/complex/info/" + code;
  } else {
    nURL = "https://new.land.naver.com/complexes/" + code;
  }
  if (checkMobile() == "ios") {
    window.location.href = nURL;
  } else {
    window.open(nURL);
  }
}

/**
 * @function openHGNN
 * @description 분양 예정 단지 등 네이버에 정보가 부족한 단지 정보를 열람하기 위해 호갱노노 링크를 제공합니다.
 * @param {string} code - 호갱노노 단지 고유 ID 코드
 */
function openHGNN(code) {
  hURL = "https://hogangnono.com/apt/" + code;
  if (checkMobile() == "ios") {
    window.location.href = hURL;
  } else {
    window.open(hURL);
  }
}

/**
 * @function showBlogGuide
 * @description 리얼랭커스 플랫폼 내 블로그 무료 등록(리얼포스팅) 기준과 카카오톡 신청 절차 안내를 공지 모달을 통해 렌더링합니다.
 */
function showBlogGuide() {
  $(".offcanvas").offcanvas("hide"); //offcanvas

  noticePop = true;
  var titleHtml = "<div class='popupTitle'> 리얼포스팅은요... </div>";
  var footerHtml = "";
  var detailHtml = "";
  detailHtml += `
        <ul>
        <li><div class='realPosting'>리얼랭커스의 리얼포스팅 등록은 무료이며, <a href='https://open.kakao.com/me/realrankus' target='_blank'>카카오톡 오픈채팅</a>을 통해 신청 가능합니다.</div>
        <li><div class='realPosting'>오픈채팅으로 <span class='blogFocus'>"리얼포스팅 등록 신청 합니다\'</span> 말씀하시고,포스팅 링크를 보내시면 됩니다.</div>
        <li><div class='realPosting'>리얼랭커스에 등록 가능한 포스팅은 <span class='blogFocus'>반드시 리얼랭커스를 통한 단지의 총평 또는 분석 결과가 스크린샷 이미지와 함께 포함</span>되어야 합니다.</div>
        <li><div class='realPosting'>리얼포스팅 등록을 신청하시면 검토 후, 해당하는 단지 팝업에 표시됩니다.</div>
        <li><div class='realPosting'>리얼포스팅은 각 단지별 최대 3개로 노출되며, 그 이상 되는 경우 무작위로 노출됩니다.</div>
        </ul>
      `;

  $("#noticeModalLabel").html(titleHtml);
  $("#noticeDetail").html(detailHtml);
  $("#noticeFooter").html(footerHtml);

  openModal("noticeModal");
  $("#baseModal").css({ "z-index": "800" });
  $(".modal-backdrop").css({ width: "100%" });
}

/**
 * @function showNotice
 * @description 매월 데이터 업데이트 소식, 리얼랭커스 서비스 취지 및 투자 주의사항, 카카오톡 알림 및 앱 스토어 설치 링크 등이 포함된 공지사항 팝업을 빌드하여 보여줍니다.
 */
function showNotice() {
  $(".offcanvas").offcanvas("hide"); //offcanvas

  noticePop = true;
  var titleHtml = "<div class='popupTitle'> " + t('ui.notice.title', '리얼랭커스에서 알려드립니다') + " </div>";
  var footerHtml = "";
  var detailHtml = "";

  if (selectedMonth == "202511") {
    detailHtml += `${notice_202511}`;
  }
  if (selectedMonth == "202512") {
    detailHtml += `${notice_202512}`;
  }
  if (selectedMonth == "202601") {
    detailHtml += `${notice_202601}`;
  }
  if (selectedMonth == "202602") {
    detailHtml += `${notice_202602}`;
  }
  if (selectedMonth == "202603") {
    detailHtml += `${notice_202603}`;
  }
  if (selectedMonth == "202604") {
    detailHtml += `${notice_202604}`;
  }
  if (selectedMonth == "202605") {
    detailHtml += `${notice_202605}`;
  }
  if (selectedMonth == "202606") {
    detailHtml += `${notice_202606}`;
  }
  if (selectedMonth == "202607") {
    detailHtml += `${notice_202607}`;
  }
  if (selectedMonth == "202608") {
    detailHtml += `${notice_202608}`;
  }

  var coffeeChatTitle = t('ui.notice.coffeechat_title', '{years}년 차를 맞이한 지속 가능한 AI 서비스, 리얼랭커스')
    .replace('{years}', yearsDifference);

  detailHtml += `
        <div class='popupTitle' style='text-align: center; padding-bottom: 1em;'>${coffeeChatTitle}</div>
        <div class='notice'>${t('ui.notice.coffeechat_desc', '<strong>2022년 런칭 이후 1인 기업으로서 꾸준한 데이터 업데이트와 고도화를 통해 시장의 신뢰를 쌓아왔습니다. 서비스의 미래 비전 혹은 협업에 관한 가벼운 커피챗 제안을 기다리고 있습니다.</strong>')}</div>
        <div class='notice' onClick='openOuterLink("https://open.kakao.com/me/realrankus")'>${t('ui.notice.coffeechat_label', '커피챗 : ')}<a href="#">https://open.kakao.com/me/realrankus </a></div>
        <hr>
      `;

  var connectionStatus = t('ui.notice.connection_status', '{os} {app}으로 접속되었습니다.')
    .replace('{os}', connectionOS)
    .replace('{app}', connectionWebApp);

  detailHtml += `
        <div class='popupTitle' style='text-align: center; padding-bottom: 1em'>${t('ui.notice.what_is_realrankus', '리얼랭커스란?')}</div>
        <div class='notice'>${t('ui.notice.intro_desc1', "리얼랭커스는 '주거', '인프라', '교통', '교육환경'을 AI로 분석하여 점수로 계산하여 입지 정보를 제공하는 서비스 입니다.")}</div>
        <div class='notice'>${t('ui.notice.intro_desc2', '리얼랭커스의 점수는 \'가격\' 및 \'지형고도\'를 제외하고 산정되며, 그 결과는 생각하시는 순위와 크게 다를 수 있습니다.')}</div>
        <div class='notice'>${t('ui.notice.intro_warning', '<strong> 리얼랭커스의 점수는 투자지표가 아님을 말씀드리며, 투자 판단에 대한 모든 책임은 투자자 본인에게 있습니다.</strong>')}</div>
        <div class='notice'>${t('ui.notice.kakao_channel_alert', "업데이트 알림은 <a href='http://pf.kakao.com/_vESNb' target='_blank'>카카오톡 채널</a>을 통해 전달됩니다.")}</div>
        <hr>
        <ul>
        <li><div class='notice'>${t('ui.notice.bullet_1', '리얼랭커스의 점수는 투자지표가 아님을 말씀드립니다. 투자 판단에 대한 모든 책임은 투자자 본인에게 있습니다.')}</div></li>
        <li><div class='notice'>${t('ui.notice.bullet_2', '모든 점수는 환경 요소를 분석한 AI가 선정하며, 일체의 임의적 조작을 가하지 않습니다.')}</div></li>
        <li><div class='notice'>${t('ui.notice.bullet_3', '점수는 해당 지역구의 상대 점수이며, 다른 지역구의 동일 점수와 같은 가치를 나타내지 않습니다.')}</div></li>
        <li><div class='notice'>${t('ui.notice.bullet_4', '80세대 이하의 단지는 통계에서 제외됩니다.')}</div></li>
        <li><div class='notice'>${t('ui.notice.bullet_5', '재건축 단지의 경우, 용적률과 건폐율로 주거 점수를 산정합니다.')}</div></li>
        <li><div class='notice'>${t('ui.notice.bullet_6', '수도권 교통 정보는 지하철역 위치 정보를 기반으로 산정됩니다.')}</div></li>
        <li><div class='notice'>${t('ui.notice.bullet_7', '인프라 정보는 각 백화점/마트 홈페이지, 은행연합회, 자원순환정보시스템, 공공데이터 포탈의 정보를 기반으로 산정됩니다.')}</div></li>
        <li><div class='notice'>${t('ui.notice.bullet_8', '교육 정보는 교육통계서비스 정보를 기반으로 산정됩니다.')}</div></li>
        <li><div class='notice'>${t('ui.notice.bullet_9', '지역구 정보는 공공데이터포탈 정보를 기반으로 산정됩니다.')}</div></li>
        <li><div class='notice'>${t('ui.notice.bullet_10', '모든 정보는 월 1회 업데이트 예정이며, 각 기반 정보의 업데이트 시점에 따라 변동 가능성이 있습니다.')}</div></li>
        <li><div class='notice'>${t('ui.notice.bullet_11', '문의사항, 오류수정, 개선제안은 이메일 또는 카카오톡을 통해 문의해 주세요.')}</div></li>
        <li><div class='notice'>${connectionStatus}</div></li>
        </ul>
      `;

  footerHtml += `
        <div class='modal-footer'>
        <div id='footerCheck'><input class='form-check-input' type='checkbox' value='' id='flexCheckDefault'><label class='form-check-label' for='flexCheckDefault'><span class='notice'>${t('ui.notice.cookie_checkbox', '다음 업데이트까지 보지 않기')}</span></label></div>
      `;
  if (checkMobile() == "ios") {
    footerHtml += ` <div id='footerBtn1'><button type='button' class='goApt' style='font-size: 0.85em' onClick='openOuterLink("https://apps.apple.com/kr/app/id6448044104")'>${t('ui.notice.ios_install', 'iOS 앱 설치')}</button></div>`;
  } else {
    footerHtml += ` <div id='footerBtn1'><button type='button' class='goApt' style='font-size: 0.85em' onClick='openOuterLink("https://play.google.com/store/apps/details?id=com.aptrank.app")'>${t('ui.notice.android_install', 'Android 앱 설치')}</button></div>`;
    footerHtml += ` <div id='footerBtn1'><button type='button' class='goApt' style='font-size: 0.85em' onClick='openOuterLink("https://apps.apple.com/kr/app/id6448044104")'>${t('ui.notice.ios_install', 'iOS 앱 설치')}</button></div>`;
  }
  footerHtml += `
        <div id='footerBtn3'><button type='button' class='gokakao' style='font-size: 0.85em' onClick='openOuterLink("https://pf.kakao.com/_vESNb")'>${t('ui.notice.kakao_channel', '카카오톡 채널')}</button></div>
        <div id='footerBtn3'><button type='button' class='gokakao' style='font-size: 0.85em' onClick='openOuterLink("https://pf.kakao.com/_vESNb/chat")'>${t('ui.notice.kakao_chat', '카카오톡 1:1 문의')}</button></div>
        </div>
      `;

  $("#noticeModalLabel").html(titleHtml);
  $("#noticeDetail").html(detailHtml);
  $("#noticeFooter").html(footerHtml);

  $("#footerCheck").css({ "grid-column": "span 2", height: "2em" });
  if (checkMobile() == "ios") {
    $("#footerBtn1").css({ "grid-column": "span 2" });
  } else {
    $("#footerBtn1").css({ "grid-column": "1fr 1fr" });
  }
  $(".modal-footer").css({ "padding-top": "3px" });

  if ($.cookie("popCookie") != "202608") {
    $("#flexCheckDefault").prop("checked", false);
  } else {
    $("#flexCheckDefault").prop("checked", true);
  }

  $("#flexCheckDefault").change(function () {
    if ($(this).is(":checked")) {
      $.cookie("popCookie", "202608", { expires: 30, path: "/" });
      console.log($.cookie("popCookie"));
    } else {
      $.removeCookie("popCookie", null, { path: "/" });
    }
  });
  openModal("noticeModal");
  $(".modal-backdrop").css({ width: "100%" });
}

/**
 * @function dong_filter
 * @description 법정동 셀렉터 라디오 버튼 변경에 맞춰 해당 동에 속하는 아파트 리스트 아이템만 페이드인 애니메이션 효과와 함께 노출합니다.
 * '좋아요(thumbs-up)' 상태 탭이 선택된 경우, 즐겨찾기(liked)된 아파트만 노출시킵니다.
 * @param {HTMLInputElement} selection - 클릭된 라디오 버튼 객체
 */
function dong_filter(selection) {
  $("#blank_list").html("");
  $("#blank_list").css({ height: "3em" });
  selected_class = "." + selection.id;
  if (selection.id == "dong_0") {
    $(".listBox2").hide();
    $(".listBox2").fadeIn(950, "easeOutQuart");
  } else if (selection.id == "dong_1") {
    $(".listBox2").hide();
    $(".liked").fadeIn(950, "easeOutQuart");
    if ($(".liked").length === 0) {
      $("#blank_list").html("<br>좋아요 단지가 없어요<br><br>가장 먼저 마음에 드는 단지에<br><span style='color:#e31939'>\"<i class='fa-regular fa-thumbs-up'></i> 좋아요\"</span> 를 해 주시는건 어떨까요?");
      $("#blank_list").css({ height: "10em" });
    } else {
      $("#blank_list").html("");
      $("#blank_list").css({ height: "3em" });
    }
  } else {
    $(".listBox2").hide();
    $(selected_class).fadeIn(950, "easeOutQuart");
  }
  $("html").scrollTop(0);

  for (i in hide_list) {
    $("#" + hide_list[i]).hide();
  }
}

/**
 * @function openRadarMap
 * @description 선택 단지의 주변 입지 환경 레이더 맵을 열기 위해 파이어베이스(Firebase Realtime Database)에서 좌표 기반 주위 인프라 스냅샷 데이터를 조회하고 세션 스토리지에 적재한 뒤, 모바일 환경에서는 임베디드 iframe으로, 데스크톱 환경에서는 새 탭 창으로 레이더 맵(radarMap.html)을 기동시킵니다.
 * @param {string} searchCode - 단지 고유 검색 코드
 */
function openRadarMap(searchCode) {
  // 새 창 열기
  if (isMobile) {
    $("body").append(
      "<div id='pageLoadingBack'><div class='spinner-grow text-pageLoading' role='status'></div><div style='font-size: 0.85em; color: white'>\
            <br>주변 환경 정보를 불러오고 있어요!</div></div>",
    );
  }

  firebase
    .database()
    .ref()
    .child("complex_info")
    .child($("#gungu option:selected").val())
    .child(searchCode)
    .get()
    .then((snapshot) => {
      if (snapshot.exists()) {
        complex_info = snapshot.val();
        if (complex_info == null) {
          alert("불러오기 실패했어요. 다시 시도해 주세요.");
        } else {
          //데이터 저장해서 새창으로 보내기
          const dataToSend = {
            aptDataFull: complex_info,
            loginStatus: login_status,
            regionCode: $("#gungu option:selected").val(),
          };

          // 데이터 저장
          sessionStorage.setItem("radarMapData", JSON.stringify(dataToSend));

          if (isMobile) {
            // iframe으로 열기
            const container = document.getElementById("radar-container");
            const iframe = document.getElementById("radar-iframe");
            if (isEn) {
              iframe.src = "../radarMap.html"; // 새로 로딩
            }
            else {
              iframe.src = "./radarMap.html"; // 새로 로딩
            }
            iframe.style.visibility = "hidden";
            container.style.display = "block";

            // 뒤로가기를 감지할 히스토리 추가
            history.pushState({ radarOpen: true }, "", "");
          } else {
            if (isEn) {
              const radarMapWindow = window.open("../radarMap.html", "_blank");
            }
            else {
              const radarMapWindow = window.open("./radarMap.html", "_blank");
            }
          }


        }
      }
    })
    .catch((error) => {
      console.log(error.message);
    });
}
/**
 * @function showRadarIframe
 * @description 모바일 레이더 맵 iframe의 로딩이 완료된 시점에 화면에 완전히 드러나도록 가시성을 활성화(visible)합니다.
 */
function showRadarIframe() {
  const iframe = document.getElementById("radar-iframe");
  iframe.style.visibility = "visible";
}

/**
 * @function closeRadar
 * @description 화면을 덮고 있는 레이더 맵 iframe 컨테이너를 숨기고 소스 URL을 초기화하여 시스템 자원을 반환합니다.
 */
function closeRadar() {
  const container = document.getElementById("radar-container");
  const iframe = document.getElementById("radar-iframe");
  iframe.src = "";
  container.style.display = "none";

  // 현재 상태가 radarOpen 상태면 히스토리 한 단계 뒤로가기
  //}
}

/**
 * @function showGraphCarousel
 * @description 현재 설정된 지역의 분석 통계 그래프 리스트를 가져와 부트스트랩 캐러셀 및 이미지 슬라이드 플러그인(PhotoSwipe) 뷰어를 모달 팝업 형식으로 빌드하여 기동합니다.
 */
function showGraphCarousel() {
  graph_url = pathPrefix + "regional_graph/" + selectedSubRegion + "/graph_list.json";
  basePath = pathPrefix + "regional_graph/" + selectedSubRegion + "/";

  $.getJSON(graph_url, function (json) {
    listData = json;
  })
    .done(function () {
      //listData에서 파일명만 추출
      fileList = [];
      listData.forEach((item) => {
        if (item.endsWith(".png") || item.endsWith(".jpg") || item.endsWith(".jpeg")) {
          fileList.push(item);
        }
      });

      const $inner = $("#carouselItems");
      $inner.empty(); // 이전 데이터 삭제

      const $indicators = $("#carouselIndicators");
      $indicators.empty(); // 이전 인디케이터 삭제

      if (fileList.length === 0) {
        alert("표시할 그래프 데이터가 없습니다.");
        return;
      }

      // 1. 파일 리스트를 돌며 Carousel Item 생성
      fileList.forEach((filename, index) => {
        const activeClass = index === 0 ? "active" : ""; // 첫 번째 아이템에만 active 부여
        const imgUrl = basePath + filename;
        const indicatorHtml = `<button type="button" data-bs-target="#regionCarousel" data-bs-slide-to="${index}" class="${activeClass}" aria-current="${activeClass ? "true" : "false"}" aria-label="Slide ${index + 1}"></button>`;
        $("#carouselIndicators").append(indicatorHtml); // 인디케이터 추가

        // 1. 반복문 시작 전, $inner 요소(부모)에 갤러리 기준점이 될 클래스를 부여합니다.
        $inner.addClass("my-pswp-gallery-wrapper");
        const targetAttr = connectionWebApp === "App" ? "" : ""; // 웹앱 환경 고려 (필요시 조건부 복구)

        // [수정됨] id="my-gallery" 및 불필요한 div 래퍼 제거
        const itemHtml = `
                <div class="carousel-item ${activeClass}">
                    <div class="col-12" style="display: flex; justify-content: center; align-items: center;">
                        <a href="${imgUrl}" 
                          data-pswp-width="1800" 
                          data-pswp-height="1200"
                          class="pswp-trigger-link" ${targetAttr}>
                            <img src="${imgUrl}" class="d-block w-100" alt="${filename}" 
                                style="max-height: 80vh; object-fit: contain;">
                        </a>
                    </div>
                </div>
            `;
        $inner.append(itemHtml);

        // 3. [매우 중요] 반복문이 완전히 종료된 **밖에서** 딱 한 번만 init 실행
        if (typeof window.initPhotoSwipe === "function") {
          window.initPhotoSwipe();
        }
      });

      // 2. 모달 띄우기
      openModal("graphModal");
      $("#graphModal").css("z-index", "1056"); // 모달의 z-index를 backdrop보다 높게 설정
      $(".modal-backdrop").css({ width: "100%", "z-index": "1055" });

      // 3. (선택사항) 모달이 닫힐 때 캐러셀 초기화
      $("#graphModal").on("hidden.bs.modal", function () {
        $inner.empty();
        $indicators.empty();
        $("#baseModal").css({ "z-index": "1055" });
        $(".modal-backdrop").css({ "z-index": "1000", width: "600px" });
      });
    })
    .fail(function () {
      console.error("그래프 데이터를 불러오는데 실패했습니다.");
    });
}

/**
 * @description 현재 설정된 지역의 분석 통계 그래프 데이터를 가져와 Chart.js와 GLIChartRenderer를 사용해 동별 시장 진단을 모달 팝업으로 렌더링합니다.
 */
function showGraphChart() {
  const jsonUrl = pathPrefix + "regional_graph/" + selectedSubRegion + "_graph.json";

  $.getJSON(jsonUrl, function (data) {
    if (!data || !data.dongs) {
      alert(isEn ? "No graph data available." : "표시할 그래프 데이터가 없습니다.");
      return;
    }

    const dongs = Object.keys(data.dongs).sort(); // 가나다순 정렬
    if (dongs.length === 0) {
      alert(isEn ? "No graph data available." : "표시할 그래프 데이터가 없습니다.");
      return;
    }

    let activeDong = dongs[0];

    function renderDongChart(dongName) {
      activeDong = dongName;
      const dongData = data.dongs[dongName];

      console.log(`Rendering chart for ${dongName}:`, dongData); // 디버깅 로그
      
      // 제목 설정
      const titleText = isEn 
        ? `'${dongName}' RealRankus GLI-Based Market Diagnosis` 
        : `'${dongName}' 리얼랭커스 GLI 기반 시장 진단`;
      $("#gliChartTitle").text(titleText);

      // 그래프 렌더링
      GLIChartRenderer.render("gliChartContainer", dongData, {
        isEn: isEn,
        pathPrefix: pathPrefix
      });

      // 버튼 활성화 스타일 업데이트
      $("#dongSelectionMenu button").removeClass("active");
      $(`#dong-btn-${dongs.indexOf(dongName)}`).addClass("active");
    }

    // 동 선택 그리드 메뉴 빌드
    const $menu = $("#dongSelectionMenu");
    $menu.empty();

    dongs.forEach((dongName, idx) => {
      const btn = document.createElement("button");
      btn.id = `dong-btn-${idx}`;
      btn.className = "gli-dong-btn";
      btn.innerText = dongName;
      btn.addEventListener("click", function () {
        renderDongChart(dongName);
      });
      $menu.append(btn);
    });

    // 2. 모달 띄우기
    openModal("graphModal");
    $("#graphModal").css("z-index", "1056"); // 모달의 z-index를 backdrop보다 높게 설정
    $(".modal-backdrop").css({ width: "100%", "z-index": "1055" });

    // 첫 번째 동 기본 렌더링
    renderDongChart(activeDong);

    // 다운로드 버튼 이벤트 바인딩
    $("#gliDownloadBtn").off("click").on("click", function () {
      var now = new Date();
      var pad = function(n) { return String(n).padStart(2, '0'); };
      var dateStr = now.getFullYear() + pad(now.getMonth()+1) + pad(now.getDate());
      var timeStr = pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
      var filename = isEn
        ? 'GLI_Analysis_' + activeDong + '_' + dateStr + '_' + timeStr + '.png'
        : 'GLI_분석_' + activeDong + '_' + dateStr + '_' + timeStr + '.png';
      GLIChartRenderer.downloadChartImage('chartWrapper', filename);
    });

    // 3. 모달이 닫힐 때 자원 및 이벤트 해제
    $("#graphModal").off("hidden.bs.modal").on("hidden.bs.modal", function () {
      $("#gliChartContainer").empty();
      $("#gliChartTitle").empty();
      $("#dongSelectionMenu").empty();
      $("#gliDownloadBtn").off("click");
      $("#baseModal").css({ "z-index": "1055" });
      $(".modal-backdrop").css({ "z-index": "1000", width: "600px" });
    });
  })
  .fail(function () {
    console.error("그래프 데이터를 불러오는데 실패했습니다.");
    alert(isEn ? "Failed to load graph data." : "그래프 데이터를 불러오는데 실패했습니다.");
  });
}

// Intercept rearrange notice update
var originalShowAPTRearrangeBar = showAPTRearrangeBar;
showAPTRearrangeBar = function () {
  if (typeof originalShowAPTRearrangeBar === 'function') {
    originalShowAPTRearrangeBar();
    var sidoText = $('#sido option:selected').text();
    var gunguText = $('#gungu option:selected').text();
    var noticeHtml = isEn ? `Sorting within '${gunguText}, ${sidoText}'` : `'${sidoText} ${gunguText}' 내에서 정렬합니다`;
    $('#rearrangeNotice').html(noticeHtml);
  }
};

var originalShowRegionRearrangeBar = showRegionRearrangeBar;
showRegionRearrangeBar = function () {
  if (typeof originalShowRegionRearrangeBar === 'function') {
    originalShowRegionRearrangeBar();
    var noticeHtml = isEn ? tSafe("ui.report.rearrange_region_notice", "Sorting within districts nationwide") : tSafe("ui.report.rearrange_region_notice", "전국 시군구 내에서 정렬합니다");
    $('#rearrangeRegionNotice').html(noticeHtml);
  }
};

// Intercept search notice update
var originalShowAptSearchBar = showAptSearchBar;
showAptSearchBar = function () {
  if (typeof originalShowAptSearchBar === 'function') {
    originalShowAptSearchBar();
    var sidoText = $('#sido option:selected').text();
    var gunguText = $('#gungu option:selected').text();
    var noticeHtml = isEn ? `Searching within '${gunguText}, ${sidoText}'` : `'${sidoText} ${gunguText}' 내에서 검색합니다`;
    $('#searchNotice').html(noticeHtml);
  }
};

function formatRecentSearchDate(dateStr) {
  if (!isEn) return dateStr + "에 검색";
  var d = dateStr.replace("년 ", "/").replace("월 ", "/").replace("일, ", " ").replace("시 ", ":").replace("분", "");
  return d + " (Searched)";
}

showUnifiedAptSearchBar = function () {
  $("#baseModal").css({ 'width': '600px' })
  $("#unifiedSearchCard").animate({
    opacity: 1.0,
    top: '0'
  }, 400, 'easeOutQuad'
  );
  $("#closeUnifiedSearch_floating").animate({
    opacity: 1.0,
    right: '5'
  }, 700, 'easeOutQuad'
  );
  $('#inputUnifiedSearch').focus();

  var noticeText = tSafe("ui.report.unified_search_notice", "빠른 검색 속도를 위해 <br> 두 글자 이상부터 검색할 수 있도록 해 두었어요!");
  var recentHeader = tSafe("ui.report.recent_search", "최근검색");

  var addon_html = "<div style='font-size: 0.9em; font-weight: 600; text-align:center; padding-top: 30px'>" + noticeText + "<br></div>"
  addon_html += "<div id='recent_search_box'>" + recentHeader + "</div>"

  if (recent_search.length > 0) {
    for (var i = 0; i < recent_search.length; i++) {
      var dateHtml = formatRecentSearchDate(recent_search[i][5]);
      addon_html += "<div class='recentListBox'>";
      addon_html += "<div class='recentListBox_complex' onClick='searchingUpdate(\"" + recent_search[i][0] + "\",\"" + recent_search[i][1] + "\",\"" + recent_search[i][2] + "\",\"" + recent_search[i][3] + "\",\"" + recent_search[i][4] + "\")'>"
      addon_html += "<div class='searched_apt_name'>" + recent_search[i][3] + "</div>"
      addon_html += "<div class='searched_apt_info'>" + recent_search[i][4] + "</div>"
      addon_html += "<div class='searched_apt_date'>" + dateHtml + "</div>"
      addon_html += "</div>"
      addon_html += "<div class='deleteRecent' onClick='removeRecent(" + i + ")'><i class='fa-solid fa-circle-xmark'></i></div>"
      addon_html += "</div>"
    }
  }

  $('#searchingBox').html("");
  $('#searchingBox').append(addon_html);
  $("#searchingBox").show()
};

removeRecent = function (index) {
  recent_search.splice(index, 1)
  save_recent_to_LocalStorage(recent_search)

  var noticeText = tSafe("ui.report.unified_search_notice", "빠른 검색 속도를 위해 <br> 두 글자 이상부터 검색할 수 있도록 해 두었어요!");
  var recentHeader = tSafe("ui.report.recent_search", "최근검색");

  var addon_html = "<div style='font-size: 0.9em; font-weight: 600; text-align:center; padding-top: 30px'>" + noticeText + "<br></div>"
  addon_html += "<div id='recent_search_box'>" + recentHeader + "</div>"

  if (recent_search.length > 0) {
    for (var i = 0; i < recent_search.length; i++) {
      var dateHtml = formatRecentSearchDate(recent_search[i][5]);
      addon_html += "<div class='recentListBox'>";
      addon_html += "<div class='recentListBox_complex'  onClick='searchingUpdate(\"" + recent_search[i][0] + "\",\"" + recent_search[i][1] + "\",\"" + recent_search[i][2] + "\",\"" + recent_search[i][3] + "\",\"" + recent_search[i][4] + "\")'>"
      addon_html += "<div class='searched_apt_name'>" + recent_search[i][3] + "</div>"
      addon_html += "<div class='searched_apt_info'>" + recent_search[i][4] + "</div>"
      addon_html += "<div class='searched_apt_date'>" + dateHtml + "</div>"
      addon_html += "</div>"
      addon_html += "<div class='deleteRecent' onClick='removeRecent(" + i + ")'><i class='fa-solid fa-circle-xmark'></i></div>"
      addon_html += "</div>"
    }
  }

  $('#searchingBox').html("");
  $('#searchingBox').append(addon_html);
  $("#searchingBox").show()
};

var unifiedInput = "";
unifiedAptSearch = function () {
  $('#searchingBox').html("");
  var unifiedInput_base = $('#inputUnifiedSearch').val()
  unifiedInput = unifiedInput_base.trim()

  var unifiedInput_arr = []
  var unifiedInput_arr_base = unifiedInput.split(" ")

  if (unifiedInput_arr_base.length == 1) {
    unifiedInput_arr[0] = unifiedInput_arr_base[0]
  }
  else if (unifiedInput_arr_base.length == 2) {
    unifiedInput_arr[0] = unifiedInput_arr_base[0]
    unifiedInput_arr[1] = unifiedInput_arr_base[1]
  }
  else {
    var inputStr = ""
    for (var k = 1; k < unifiedInput_arr_base.length; k++) {
      inputStr += unifiedInput_arr_base[k]
    }
    unifiedInput_arr[0] = unifiedInput_arr_base[0]
    unifiedInput_arr[1] = inputStr
  }

  if (unifiedInput.length >= 2) {
    if (unifiedInput_arr.length == 1) {
      for (var i = 0; i < searchingData.data.length; i++) {
        var aptName = searchingData.data[i]["아파트명"]
        var searchName = searchingData.data[i]["아파트명"] + " " + searchingData.data[i]["법정동주소"]

        if (searchName.indexOf(unifiedInput) >= 0) {
          var aptName = searchingData.data[i]["아파트명"]
          var aptAddress = searchingData.data[i]["법정동주소"]
          var code = searchingData.data[i]["검색코드"]
          var sido = searchingData.data[i]["sido"]
          var gungu = searchingData.data[i]["gungu"]

          var addon_html = "<div class='searchedListBox' onClick='searchingUpdate(\"" + code + "\",\"" + sido + "\",\"" + gungu + "\",\"" + aptName + "\",\"" + aptAddress + "\")'>";
          addon_html += "<div class='searched_apt_name'>" + aptName + "</div>"
          addon_html += "<div class='searched_apt_info'>" + aptAddress + "</div>";
          addon_html += "</div>"

          $('#searchingBox').append(addon_html);
          $('#searchingBox').show()
        }
      }
      $(".searched_apt_name:contains('" + unifiedInput + "')").each(function () {
        var regex = new RegExp(unifiedInput, 'gi')
        $(this).html($(this).text().replace(regex, "<span class='colorTxt'>" + unifiedInput + "</span>"));
      })
      $(".searched_apt_info:contains('" + unifiedInput + "')").each(function () {
        var regex2 = new RegExp(unifiedInput, 'gi')
        $(this).html($(this).text().replace(regex2, "<span class='colorTxt'>" + unifiedInput + "</span>"));
      })
    }
    else {
      for (var i = 0; i < searchingData.data.length; i++) {
        var aptName = searchingData.data[i]["아파트명"]
        var searchName = searchingData.data[i]["아파트명"] + " " + searchingData.data[i]["법정동주소"]

        if (searchName.indexOf(unifiedInput_arr[0]) >= 0 && searchName.indexOf(unifiedInput_arr[1]) >= 0) {

          var aptName = searchingData.data[i]["아파트명"]
          var aptAddress = searchingData.data[i]["법정동주소"]
          var code = searchingData.data[i]["검색코드"]
          var sido = searchingData.data[i]["sido"]
          var gungu = searchingData.data[i]["gungu"]

          var addon_html = "<div class='searchedListBox' onClick='searchingUpdate(\"" + code + "\",\"" + sido + "\",\"" + gungu + "\",\"" + aptName + "\",\"" + aptAddress + "\")'>";
          addon_html += "<div class='searched_apt_name'>" + aptName + "</div>"
          addon_html += "<div class='searched_apt_info'>" + aptAddress + "</div>";
          addon_html += "</div>"

          $('#searchingBox').append(addon_html);
          $('#searchingBox').show()
        }
      }

      $(".searched_apt_name:contains('" + unifiedInput_arr[0] + "')" + "," + ".searched_apt_name:contains('" + unifiedInput_arr[1] + "')").each(function () {
        var regex3 = new RegExp(unifiedInput_arr[0], 'gi')
        var regex4 = new RegExp(unifiedInput_arr[1], 'gi')
        $(this).html($(this).text().replace(regex3, "<span class='colorTxt'>" + unifiedInput_arr[0] + "</span>").replace(regex4, "<span class='colorTxt'>" + unifiedInput_arr[1] + "</span>"))
      })

      $(".searched_apt_info:contains('" + unifiedInput_arr[0] + "')" + "," + ".searched_apt_info:contains('" + unifiedInput_arr[1] + "')").each(function () {
        var regex5 = new RegExp(unifiedInput_arr[0], 'gi')
        var regex6 = new RegExp(unifiedInput_arr[1], 'gi')
        $(this).html($(this).text().replace(regex5, "<span class='colorTxt2'>" + unifiedInput_arr[0] + "</span>").replace(regex6, "<span class='colorTxt2'>" + unifiedInput_arr[1] + "</span>"))
      })
    }
    $('#searchingBox').append("<div style='height: 3em'></div>");

  }
  else {
    var noticeText = tSafe("ui.report.unified_search_notice", "빠른 검색 속도를 위해 <br> 두 글자 이상부터 검색할 수 있도록 해 두었어요!");
    var recentHeader = tSafe("ui.report.recent_search", "최근검색");

    var addon_html = "<div style='font-size: 0.9em; font-weight: 600; text-align:center; padding-top: 30px'>" + noticeText + "<br></div>"
    addon_html += "<div id='recent_search_box'>" + recentHeader + "</div>"

    if (recent_search.length > 0) {
      for (var i = 0; i < recent_search.length; i++) {
        var dateHtml = formatRecentSearchDate(recent_search[i][5]);
        addon_html += "<div class='recentListBox'>";
        addon_html += "<div class='recentListBox_complex'  onClick='searchingUpdate(\"" + recent_search[i][0] + "\",\"" + recent_search[i][1] + "\",\"" + recent_search[i][2] + "\",\"" + recent_search[i][3] + "\",\"" + recent_search[i][4] + "\")'>"
        addon_html += "<div class='searched_apt_name'>" + recent_search[i][3] + "</div>"
        addon_html += "<div class='searched_apt_info'>" + recent_search[i][4] + "</div>"
        addon_html += "<div class='searched_apt_date'>" + dateHtml + "</div>"
        addon_html += "</div>"
        addon_html += "<div class='deleteRecent' onClick='removeRecent(" + i + ")'><i class='fa-solid fa-circle-xmark'></i></div>"
        addon_html += "</div>"
      }
    }
    $('#searchingBox').html("");
    $('#searchingBox').append(addon_html);
  }
};

showSearchBar = function () {
  if (selectedRegion == "Korea" && selectedSubRegion == "1000000000_Korea" && searchType == "local") {
    $("#unifiedSearchExample").html(tSafe("ui.search_example_korea_local", "예) 강남, 분당, 수지, 해운대"));
  } else {
    radioSelected = $('input[name="options"]:checked').val();
    if (radioSelected == "local") {
      $("#unifiedSearchExample").html(tSafe("ui.search_example_local", "예) 서초동, 래미안, 힐스테이트, 주공"));
    }
    if (radioSelected == "global") {
      $("#unifiedSearchExample").html(tSafe("ui.search_example_global", "예) 강남 래미안, 래미안 힐스테이트, 주공"));
    }
  }

  if (selectedMonth >= 202211) {
    showUnifiedSearchBar();
  } else {
    if (selectedSubRegion == "1000000000_Korea") {
      showRegionSearchBar();
    } else {
      showAptSearchBar();
    }
  }
};
