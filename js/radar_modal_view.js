/**
 * ==========================================================================
 * APT-Rank 풀스크린 레이더 맵 모달 (RadarModal)
 * 메인 index.html 및 테스트 페이지에서 iframe 없이 직접 인페이지 모달로 지도를 렌더링
 * ==========================================================================
 */

var isEn = (typeof LANG !== 'undefined' && LANG === 'en') || (sessionStorage.getItem('LANG') === 'en');
var selectedSubRegion = "";
var origin_x = 0;
var origin_y = 0;
var origin_yx = null;
var apt_name = "";
var info_pos = 0;
var info_size = 0;
var isDown = false;
var complex_grade = "";
var eventURL = "";
var sales_history_price = [];
var sales_history_date = [];
var priceCharts = [];

function dateReturn(n) {
  return n < 10 ? "0" + n : n;
}

function formatOptionDate(dateStr) {
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
}

function openNaver(code) {
  var isMobileDevice = (typeof isMobile !== 'undefined' && isMobile) || (window.innerWidth <= 768);
  var nURL = isMobileDevice ? ("https://m.land.naver.com/complex/info/" + code) : ("https://new.land.naver.com/complexes/" + code);
  window.open(nURL, '_blank');
}

function openHGNN(code) {
  var hURL = "https://hogangnono.com/apt/" + code;
  window.open(hURL, '_blank');
}

var RadarModal = (function () {
  var isInitialized = false;
  var currentAptData = null;
  var isModalOpen = false;

  function init() {
    if (isInitialized) return;
    bindEvents();
    isInitialized = true;
  }

  function bindEvents() {
    // 1. 체크박스 버블링 방지
    $(document).on('click', '.check-facility', function (e) {
      e.stopPropagation();
    });

    // 2. 항목 라인 클릭 시 체크박스 토글
    $(document).on('click', '.popSubTableRadar', function () {
      var $checkbox = $(this).find('.check-facility');
      if ($checkbox.length) {
        var newState = !$checkbox.prop('checked');
        $checkbox.prop('checked', newState).trigger('change');
      }
    });

    $(document).on('click', '.popTitleRadar', function () {
      var $checkbox = $(this).find('.check-facility');
      if ($checkbox.length) {
        var newState = !$checkbox.prop('checked');
        $checkbox.prop('checked', newState).trigger('change');
      }
    });

    // 3. 체크박스 변경 시 마커/폴리곤 show/hide
    $(document).on('change', '.check-facility', function () {
      var id = $(this).attr('id');
      var isChecked = $(this).is(':checked');
      icon_show_hide(id, isChecked);
    });

    // 4. 모바일 하드웨어 뒤로가기(popstate) 감지
    window.addEventListener('popstate', function (e) {
      if (isModalOpen) {
        RadarModal.close(true);
      }
    });
  }

  function open(aptData, regionCode) {
    init();
    currentAptData = aptData;
    isModalOpen = true;

    var aptName = aptData["아파트명"] || "단지 상세 정보";
    var rank = aptData["rank"] ? Number(aptData["rank"]).toFixed(0) : "";
    var loc_x = aptData["X"];
    var loc_y = aptData["Y"];
    origin_x = loc_x;
    origin_y = loc_y;
    apt_name = aptName;
    selectedSubRegion = regionCode || "";

    // 1. 상단 타이틀 및 랭킹 뱃지 설정
    $('#radarModalComplexName').text(aptName);
    if (rank && rank !== "0") {
      $('#radarModalBadge').text(rank + "위").show();
    } else {
      $('#radarModalBadge').hide();
    }

    // 2. 모달 컨테이너 표시
    $('#radarModal').show();
    $('body').css('overflow', 'hidden');

    // 3. 브라우저 히스토리 push (뒤로가기 시 닫기 연동)
    history.pushState({ radarModalOpen: true }, '', '');

    // 4. 화면 크기별 레이아웃 계산
    var isMobileView = (window.innerWidth <= 768) || (typeof isMobile !== 'undefined' && isMobile);
    info_pos = Math.floor(window.innerHeight * 2 / 3);
    info_size = window.innerHeight - info_pos;

    if (isMobileView) {
      $('#radarDataMap').css({ 'height': '100%', 'width': '100%', 'top': 0, 'left': 0 });
      $('#radarDataList_wrapper').css({
        'position': 'absolute',
        'top': info_pos + 'px',
        'height': info_size + 'px',
        'display': 'block',
        'border-top-left-radius': '16px',
        'border-top-right-radius': '16px',
        'background-color': '#ffffff',
        'box-shadow': '0 -4px 20px rgba(0, 0, 0, 0.18)'
      });
      $('#radarDataList').css({ 'background-color': '#ffffff', 'padding': '10px 14px 40px 14px' });
    } else {
      $('#radarDataMap').css({ 'height': '100%', 'width': 'calc(100% - 500px)', 'left': '500px', 'top': 0 });
      $('#radarDataList_wrapper').css({
        'position': 'absolute',
        'top': '0px',
        'left': '0px',
        'width': '500px',
        'height': '100%',
        'display': 'block',
        'border-radius': '0px',
        'box-shadow': '2px 0 10px rgba(0,0,0,0.05)'
      });
      $('#radarDataList').css({ 'background-color': '#ffffff', 'padding': '20px 16px 50px 16px' });
    }

    // 5. 상세 입지 리스트 렌더링
    showRadarDetail(aptData);

    // 6. 네이버 지도 초기화 및 리사이징 (깜빡임 없이 매끄럽게 표시)
    setTimeout(function () {
      if (typeof loadRadarMap === 'function') {
        loadRadarMap(loc_x, loc_y, aptData);
      }
      if (typeof defaultMap !== 'undefined' && defaultMap) {
        var dw = isMobileView ? window.innerWidth : (window.innerWidth - 500);
        var dh = window.innerHeight - 50;
        defaultMap.setSize(new naver.maps.Size(dw, dh));
        if (loc_x && loc_y) {
          defaultMap.setCenter(new naver.maps.LatLng(Number(loc_y), Number(loc_x)));
          if (isMobileView) {
            defaultMap.panBy(new naver.maps.Point(0, 110));
          }
        }
      }
    }, 120);
  }

  function close(fromPopState) {
    if (!isModalOpen) return;
    isModalOpen = false;
    $('#radarModal').hide();
    $('body').css('overflow', '');

    if (!fromPopState) {
      if (history.state && history.state.radarModalOpen) {
        history.back();
      }
    }
  }

  return {
    init: init,
    open: open,
    close: close
  };
})();

// 모바일 바텀시트 펼침/접힘 토글
function moveInfoWindow() {
  var isMobileView = (window.innerWidth <= 768);
  if (!isMobileView) return;

  var moving_dest;
  if (isDown) {
    moving_dest = info_pos;
  } else {
    moving_dest = window.innerHeight - ($("#info_check_card").height() || 60) - 20;
  }

  isDown = !isDown;
  $('#info_OnOff').toggleClass('rotated');
  $('#radarDataList_wrapper, #dataList_wrapper').animate({ top: moving_dest }, 300);
}

// 마커 및 인프라 폴리곤 토글 함수
function icon_show_hide(id, isChecked) {
  var targetMap = (typeof defaultMap !== 'undefined') ? defaultMap : null;
  if (!targetMap) return;

  if (id == "check_trans") {
    if (isChecked) {
      $(".check_trans_child").prop({ 'checked': true });
      $(".trans_marker").show();
      if (typeof metro_line !== 'undefined' && metro_line) metro_line.setMap(targetMap);
    } else {
      $(".check_trans_child").prop({ 'checked': false });
      $(".trans_marker").hide();
      if (typeof metro_line !== 'undefined' && metro_line) metro_line.setMap(null);
    }
  }

  if (id == "check_nearestStation") {
    if (isChecked) {
      $("#check_trans").prop({ 'checked': true });
      $(".trans_marker").show();
      if (typeof metro_line !== 'undefined' && metro_line) metro_line.setMap(targetMap);
    } else {
      $("#check_trans").prop({ 'checked': false });
      $(".trans_marker").hide();
      if (typeof metro_line !== 'undefined' && metro_line) metro_line.setMap(null);
    }
  }

  if (id == "check_infra") {
    if (isChecked) {
      $(".check_infra_child").prop({ 'checked': true });
      $(".infra_marker").show();
      if (typeof infra_market_polygons !== 'undefined' && infra_market_polygons) {
        infra_market_polygons.forEach(function(polygon) { polygon.setMap(targetMap); });
      }
    } else {
      $(".check_infra_child").prop({ 'checked': false });
      $(".infra_marker").hide();
      if (typeof infra_market_polygons !== 'undefined' && infra_market_polygons) {
        infra_market_polygons.forEach(function(polygon) { polygon.setMap(null); });
      }
    }
  }

  if (id == "check_departmentStore") {
    if (isChecked) { $(".departmentStore").show(); } else { $(".departmentStore").hide(); }
  }
  if (id == "check_mall") {
    if (isChecked) { $(".mall").show(); } else { $(".mall").hide(); }
  }
  if (id == "check_mart") {
    if (isChecked) { $(".mart").show(); } else { $(".mart").hide(); }
  }
  if (id == "check_bank") {
    if (isChecked) { $(".bank").show(); } else { $(".bank").hide(); }
  }
  if (id == "check_hospital") {
    if (isChecked) { $(".hospital").show(); } else { $(".hospital").hide(); }
  }
  if (id == "check_big_hospital") {
    if (isChecked) { $(".big_hospital").show(); } else { $(".big_hospital").hide(); }
  }
  if (id == "check_park") {
    if (isChecked) { $(".park").show(); } else { $(".park").hide(); }
  }
  if (id == "check_big_park") {
    if (isChecked) { $(".big_park").show(); } else { $(".big_park").hide(); }
  }
  if (id == "check_harmful") {
    if (isChecked) { $(".harmful").show(); } else { $(".harmful").hide(); }
  }

  if (id == "check_market") {
    if (isChecked) {
      $(".market").show();
      if (typeof infra_market_polygons !== 'undefined' && infra_market_polygons) {
        infra_market_polygons.forEach(function(polygon) { polygon.setMap(targetMap); });
      }
    } else {
      $(".market").hide();
      if (typeof infra_market_polygons !== 'undefined' && infra_market_polygons) {
        infra_market_polygons.forEach(function(polygon) { polygon.setMap(null); });
      }
    }
  }

  if (id == "check_edu") {
    if (isChecked) {
      $(".check_edu_child").prop({ 'checked': true });
      $(".edu_marker").show();
      if (typeof pSchool_line !== 'undefined' && pSchool_line) pSchool_line.setMap(targetMap);
      if (typeof edu_mSchool_lines !== 'undefined' && edu_mSchool_lines) {
        edu_mSchool_lines.forEach(function(p) { p.setMap(targetMap); });
      }
      if (typeof edu_academy_polygons !== 'undefined' && edu_academy_polygons) {
        edu_academy_polygons.forEach(function(p) { p.setMap(targetMap); });
      }
    } else {
      $(".check_edu_child").prop({ 'checked': false });
      $(".edu_marker").hide();
      if (typeof pSchool_line !== 'undefined' && pSchool_line) pSchool_line.setMap(null);
      if (typeof edu_mSchool_lines !== 'undefined' && edu_mSchool_lines) {
        edu_mSchool_lines.forEach(function(p) { p.setMap(null); });
      }
      if (typeof edu_academy_polygons !== 'undefined' && edu_academy_polygons) {
        edu_academy_polygons.forEach(function(p) { p.setMap(null); });
      }
    }
  }

  if (id == "check_pSchool") {
    if (isChecked) {
      $(".pSchool").show();
      if (typeof pSchool_line !== 'undefined' && pSchool_line) pSchool_line.setMap(targetMap);
    } else {
      $(".pSchool").hide();
      if (typeof pSchool_line !== 'undefined' && pSchool_line) pSchool_line.setMap(null);
    }
  }

  if (id == "check_mSchool") {
    if (isChecked) {
      $(".mSchool").show();
      if (typeof edu_mSchool_lines !== 'undefined' && edu_mSchool_lines) {
        edu_mSchool_lines.forEach(function(p) { p.setMap(targetMap); });
      }
    } else {
      $(".mSchool").hide();
      if (typeof edu_mSchool_lines !== 'undefined' && edu_mSchool_lines) {
        edu_mSchool_lines.forEach(function(p) { p.setMap(null); });
      }
    }
  }

  if (id == "check_academy") {
    if (isChecked) {
      $(".academy").show();
      if (typeof edu_academy_polygons !== 'undefined' && edu_academy_polygons) {
        edu_academy_polygons.forEach(function(p) { p.setMap(targetMap); });
      }
    } else {
      $(".academy").hide();
      if (typeof edu_academy_polygons !== 'undefined' && edu_academy_polygons) {
        edu_academy_polygons.forEach(function(p) { p.setMap(null); });
      }
    }
  }

  if (id == "check_drink") {
    if (isChecked) {
      $(".drink, .motel").show();
    } else {
      $(".drink, .motel").hide();
    }
  }

  var all_edu_unchecked = $(".check_edu_child").filter(":checked").length === 0;
  $("#check_edu").prop({ 'checked': !all_edu_unchecked });
}

// 상세 입지 리스트 HTML 생성 (showDetail)
function showRadarDetail(aptData) {
  var t = (typeof window.t === 'function') ? window.t : function(key, fallback) { return fallback; };
  var isMobileView = (window.innerWidth <= 768) || (typeof isMobile !== 'undefined' && isMobile);

  var aptName = aptData["아파트명"] || "";
  var rank = aptData["rank"] ? Number(aptData["rank"]).toFixed() : "";
  var apt_type = aptData["매매타입"] || "아파트";
  var law_Address = aptData["법정동주소"] || "";
  var road_Address = aptData["도로명주소"] || "";
  var aptValue = aptData["가치 총점"] ? Math.round(aptData["가치 총점"] * 100) / 100 : "";
  var aptDuration = aptData["준공년차"] || "";
  var aptYear = aptData["준공년월"] ? (aptData["준공년월"] + " (" + aptDuration + "년차)") : "";

  var nearestStation = aptData["가까운역이름"] ? (aptData["가까운역이름"] + "역(" + Math.round(aptData["가까운역거리"] || 0) + "m)") : "정보 없음";
  var stationArea = aptData["역세권여부"];
  var stationPoint_30m = aptData["30분이내주요거점역"] || 0;
  var stationPoint_1h = aptData["1시간이내주요거점역"] || 0;

  var departmentStore_3km = (aptData["3km이내백화점수"] || 0) + "개";
  var OutletMall_5km = (aptData["5km이내아울렛몰수"] || 0) + "개";
  var bigMart_1km = (aptData["1km이내대형마트수"] || aptData["1km이내대형먀트수"] || 0) + "개";
  var bank_500m = (aptData["500m이내은행수"] || 0) + "개";
  var hospital_500m = (aptData["500m이내병원수"] || 0) + "개";
  var bigHospital_5km = (aptData["5km이내대형병원수"] || 0) + "개";
  var park_500m = (aptData["500m이내공원수"] || 0) + "개";
  var big_park_1km = (aptData["800m이내대형공원수"] || 0) + "개";
  var harmful_3km = (aptData["3km이내혐오시설수"] || 0) + "개";

  var pSchool_distance = aptData["초등학교거리"] || 0;
  var mSchool_edu = aptData["중학교학업성취도"] ? (Number(aptData["중학교학업성취도"]).toFixed(1) + "%") : "--%";
  var academy_edu = (aptData["500m이내학원가"] || 0) + "개 (총 " + (aptData["500m이내학원수"] || 0) + "개 학원)";
  var market_infra = (aptData["300m이내상권"] || 0) + "개 (총 " + (aptData["300m이내점포수"] || 0) + "개 점포)";

  var searchCode = aptData["검색코드"] || "";
  var house_num = aptData["세대수"] || "";
  var parking = aptData["주차"] || "";
  var heating = aptData["난방"] || "";
  var entrance = aptData["현관구조"] || "";

  var detailHtml = "";

  // 모바일 헤더 드래그 핸들 및 빠른 체크 필터 바
  if (isMobileView) {
    detailHtml += "<div class='radar-sheet-handle-wrap' onClick='moveInfoWindow()'><div class='radar-sheet-handle-bar'></div></div>";
    detailHtml += "<div class='card-body' id='info_check_card' style='padding: 8px 6px; border-bottom: 1px solid #e2e8f0;'>";
    detailHtml += "<div id='info_check_div' style='display:flex; justify-content:space-between; align-items:center;'>";
    detailHtml += "<div class='popTitleRadar'><div><input class='form-check-input check-facility' type='checkbox' id='check_trans' checked></div>교통</div>";
    detailHtml += "<div class='popTitleRadar'><div><input class='form-check-input check-facility' type='checkbox' id='check_infra' checked></div>인프라</div>";
    detailHtml += "<div class='popTitleRadar'><div><input class='form-check-input check-facility' type='checkbox' id='check_edu' checked></div>교육</div>";
    detailHtml += "<div id='info_OnOff' onClick='moveInfoWindow()' style='padding: 4px 8px; cursor: pointer;'><i class='fa-solid fa-chevron-down'></i></div>";
    detailHtml += "</div></div>";
  }

  // 아파트 기본 요약 정보 카드
  detailHtml += "<div class='card' style='margin-bottom:12px; border:none; box-shadow:none;'>";
  detailHtml += "<div class='card-body' style='padding: 8px 4px;'>";
  detailHtml += "<div style='font-size: 1.25rem; font-weight: 700; color: #1e293b;'>" + aptName + "</div>";
  detailHtml += "<div style='font-size: 0.85rem; color: #64748b; margin-top: 2px;'>" + aptYear + "</div>";
  detailHtml += "<div style='font-size: 0.8rem; color: #94a3b8; margin-top: 2px;'>" + road_Address + " (" + law_Address + ")</div>";
  detailHtml += "</div></div>";

  // 1. 교통 카드
  detailHtml += "<div class='card mobile_card' style='margin-bottom:12px;'>";
  detailHtml += "<div class='card-header' style='background:#f8fafc; font-weight:700;'><i class='fas fa-bus text-primary'></i>&nbsp;교통 환경</div>";
  detailHtml += "<div class='card-body'>";
  detailHtml += "<div class='popSubTableRadar' style='display:flex; justify-content:space-between; align-items:center; padding: 6px 0; border-bottom: 1px dashed #eee;'>";
  detailHtml += "<div><input class='form-check-input check-facility check_trans_child' type='checkbox' id='check_nearestStation' checked>&nbsp;가장 가까운 역</div>";
  detailHtml += "<div style='font-weight:600; color:#1e293b;'>" + nearestStation + "</div>";
  detailHtml += "</div>";
  detailHtml += "<div style='display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dashed #eee;'>";
  detailHtml += "<div>30분 이내 주요거점역</div><div style='font-weight:600;'>" + stationPoint_30m + "개</div>";
  detailHtml += "</div>";
  detailHtml += "<div style='display:flex; justify-content:space-between; padding: 6px 0;'>";
  detailHtml += "<div>1시간 이내 주요거점역</div><div style='font-weight:600;'>" + stationPoint_1h + "개</div>";
  detailHtml += "</div>";
  detailHtml += "</div></div>";

  // 2. 인프라 카드
  detailHtml += "<div class='card mobile_card' style='margin-bottom:12px;'>";
  detailHtml += "<div class='card-header' style='background:#f8fafc; font-weight:700;'><i class='fas fa-hospital-user text-danger'></i>&nbsp;생활 인프라</div>";
  detailHtml += "<div class='card-body'>";

  var infraItems = [
    { id: 'check_departmentStore', label: '3km 이내 백화점', val: departmentStore_3km },
    { id: 'check_mall', label: '5km 이내 아울렛/몰', val: OutletMall_5km },
    { id: 'check_mart', label: '1km 이내 대형마트', val: bigMart_1km },
    { id: 'check_market', label: '300m 이내 상권', val: market_infra },
    { id: 'check_big_hospital', label: '5km 이내 대형병원', val: bigHospital_5km },
    { id: 'check_big_park', label: '800m 이내 대형공원', val: big_park_1km }
  ];

  infraItems.forEach(function(item) {
    detailHtml += "<div class='popSubTableRadar' style='display:flex; justify-content:space-between; align-items:center; padding: 6px 0; border-bottom: 1px dashed #eee;'>";
    detailHtml += "<div><input class='form-check-input check-facility check_infra_child' type='checkbox' id='" + item.id + "' checked>&nbsp;" + item.label + "</div>";
    detailHtml += "<div style='font-weight:600;'>" + item.val + "</div>";
    detailHtml += "</div>";
  });
  detailHtml += "</div></div>";

  // 3. 교육 카드
  detailHtml += "<div class='card mobile_card' style='margin-bottom:12px;'>";
  detailHtml += "<div class='card-header' style='background:#f8fafc; font-weight:700;'><i class='fas fa-graduation-cap text-success'></i>&nbsp;교육 환경</div>";
  detailHtml += "<div class='card-body'>";

  var minDist = Math.max(0, parseInt(pSchool_distance - 100));
  var maxDist = parseInt(pSchool_distance);

  detailHtml += "<div class='popSubTableRadar' style='display:flex; justify-content:space-between; align-items:center; padding: 6px 0; border-bottom: 1px dashed #eee;'>";
  detailHtml += "<div><input class='form-check-input check-facility check_edu_child' type='checkbox' id='check_pSchool' checked>&nbsp;초등학교 거리</div>";
  detailHtml += "<div style='font-weight:600;'>" + minDist.toLocaleString() + "~" + maxDist.toLocaleString() + "m</div>";
  detailHtml += "</div>";

  detailHtml += "<div class='popSubTableRadar' style='display:flex; justify-content:space-between; align-items:center; padding: 6px 0; border-bottom: 1px dashed #eee;'>";
  detailHtml += "<div><input class='form-check-input check-facility check_edu_child' type='checkbox' id='check_mSchool' checked>&nbsp;중학교 학업성취도</div>";
  detailHtml += "<div style='font-weight:600; color:#0d6efd;'>" + mSchool_edu + "</div>";
  detailHtml += "</div>";

  detailHtml += "<div class='popSubTableRadar' style='display:flex; justify-content:space-between; align-items:center; padding: 6px 0; border-bottom: 1px dashed #eee;'>";
  detailHtml += "<div><input class='form-check-input check-facility check_edu_child' type='checkbox' id='check_academy' checked>&nbsp;500m 이내 학원가</div>";
  detailHtml += "<div style='font-weight:600;'>" + academy_edu + "</div>";
  detailHtml += "</div>";

  detailHtml += "</div></div>";

  // 하단 외부 바로가기 버튼 영역
  detailHtml += "<div style='display:flex; gap:8px; margin-top:16px;'>";
  detailHtml += "<button type='button' class='btn btn-outline-success w-100' onclick='openNaver(\"" + searchCode + "\")'><i class='fa-solid fa-n me-1'></i> 네이버 부동산</button>";
  detailHtml += "<button type='button' class='btn btn-outline-primary w-100' onclick='openHGNN(\"" + searchCode + "\")'><i class='fa-solid fa-building me-1'></i> 호갱노노</button>";
  detailHtml += "</div>";

  // 타겟 컨테이너에 주입
  var $target = $('#radarDataList').length ? $('#radarDataList') : $('#dataList');
  $target.html(detailHtml);
}

