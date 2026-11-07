/**
 * ==========================================================================
 * APT-Rank 풀스크린 레이더 맵 공통 뷰 & 고해상도 캡처 모듈 (RadarModalView)
 * 작성일: 2026-11-06 (초기 생성 및 radarMap.html 모바일 뷰 이식)
 * 수정일: 2026-11-07
 *   - radarMap.html(웹/모바일 단독 페이지) 및 index.html(모바일 풀스크린 모달) 통합 공통 엔진화
 *   - 상권/학원가 폴리곤 렌더링, 실거래가 차트/날짜 셀렉트 복구, 350ms Fade-in/out, 히스토리 배열 정규화 가드
 *   - 캡처 시 아파트 중심 마커 정중앙 이동 후 타일 로드 대기 및 완료 후 원위치 복원
 *   - OverlayView(overlayLayer.firstChild) 최하단 z-depth 벡터 언더레이로 반경원/거리점선/폴리곤 정밀 합성
 *   - 모바일/웹 모두 캡처 시 상단 요약 카드의 뒤로가기('<') 버튼 제거 및 리얼랭커스 상·하단 워터마크 합성
 *   - price/index.html 동일 규격 포인트컬러(#E43B46) Pill 확장/수축 플로팅 캡처 버튼 UI 및 바텀시트 연동
 * 메인 지도(defaultMap) 및 전역 변수와 완전히 격리되어 동작합니다.
 * ==========================================================================
 */

var radarMapInstance = null;
var radar_all_markers = [];
var radar_metro_line = null;
var radar_metroDistanceLabel = null;
var radar_pSchool_line = null;
var radar_pSchoolDistanceLabel = null;
var radar_mSchool_lines = [];
var radar_mSchoolDistanceLabels = [];
var radar_market_polygons = [];
var radar_academy_polygons = [];
var radar_circles = [];
var radar_distance_markers = [];

var isRadarDown = false;
var radar_info_pos = 0;
var radar_info_size = 0;

var radar_sales_history_price = [];
var radar_sales_history_date = [];
var radar_priceCharts = [];
var radar_chartView = [];

var radarColorCode = {
  '백화점': '#6A5A94',
  '아울렛': '#8B4F2E',
  '마트': '#D4AF00',
  '상권': '#A24034',
  '은행': '#1D3C74',
  '병원': '#448B85',
  '대형병원': '#336970',
  '공원': '#517D3A',
  '대형공원': '#355E35',
  '혐오시설': '#8B2F2F',
  '지하철역': '#3F5682',
  '초등학교': '#C49B00',
  '중학교': '#6D872C',
  '학원가': '#6A4792',
  '주점': '#7A2F4A',
  '모텔': '#544F4D'
};

/**
 * @function normalizeHistoryArray
 * @description Firebase RTDB 또는 다양한 데이터 소스에서 문자열, 객체, 배열 형태로 전달되는
 * 실거래가 역사 데이터(sales_history_price, 매매실거래날짜목록)를 안전하게 순수 자바스크립트 배열로 정규화합니다.
 */
function normalizeHistoryArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object') {
    return Object.values(raw);
  }
  if (typeof raw === 'string') {
    try {
      var direct = JSON.parse(raw);
      if (Array.isArray(direct)) return direct;
      if (direct && typeof direct === 'object') return Object.values(direct);
    } catch (e1) {
      try {
        var cleaned = raw.trim()
          .replace(/'/g, '"')
          .replace(/\(/g, '[')
          .replace(/\)/g, ']');
        var parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') return Object.values(parsed);
      } catch (e2) {
        console.warn("normalizeHistoryArray parse error:", e2);
      }
    }
  }
  return [];
}

function radarFormatOptionDate(dateStr) {
  if (!dateStr || dateStr.length < 6) return dateStr;
  var isEn = (typeof LANG !== 'undefined' && LANG === 'en') || (sessionStorage.getItem('LANG') === 'en');
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

/**
 * @function updateRadarComplexVisitInfo
 * @description 2026-11-07: radarMap_backup.html의 방문자 수 집계 및 #complex_visit_info 갱신 로직 복원
 * - 전역 days_ago_num(최근 30일 기준값) 및 today_str 보장 (전역 today 객체 변형 방지)
 * - #sido/#gungu 셀렉트박스가 없는 단독 페이지(radarMap.html)에서도 법정동주소로부터 시도/시군구/읍면동을 안전 추출하여 realrankus_visit 호출
 * - 비로그인 환경의 서브 DB 쓰기 지연/거부 시에도 스피너가 무한 대기하지 않도록 읽기 전용 폴백 제공
 */
function updateRadarComplexVisitInfo(searchCode, rawLawAddr, isEn) {
  if (!searchCode) return;
  var codeStr = String(searchCode);
  var pad2 = function (n) { return n < 10 ? "0" + n : String(n); };

  if (typeof window.today_str === 'undefined' || !window.today_str) {
    var nowDate = new Date();
    window.today_str = nowDate.getFullYear() + "-" + pad2(nowDate.getMonth() + 1) + "-" + pad2(nowDate.getDate());
  }

  if (typeof window.days_ago_num === 'undefined' || isNaN(window.days_ago_num)) {
    var dAgo = new Date();
    dAgo.setDate(dAgo.getDate() - 30);
    window.days_ago_num = Number("" + dAgo.getFullYear() + pad2(dAgo.getMonth() + 1) + pad2(dAgo.getDate()));
  }

  var sanitizeKey = function (s) {
    return String(s || "").replace(/[.#$\[\]\/]/g, "").trim();
  };

  var sidoText = $("#sido option:selected").length ? $("#sido option:selected").text().trim() : "";
  var gunguOptText = $("#gungu option:selected").length ? $("#gungu option:selected").text().trim() : "";
  var visitSido = "";
  var visitGungu = "";
  var visitDong = "";

  var parts = String(rawLawAddr || "").trim().split(/\s+/).filter(Boolean);
  if (sidoText && gunguOptText) {
    visitSido = sidoText;
    visitGungu = sidoText + " " + gunguOptText;
    var dongToken = parts.length >= 3 ? (parts[2].slice(-1) === "구" ? (parts[3] || parts[2]) : parts[2]) : (parts[1] || "");
    visitDong = dongToken ? (visitGungu + " " + dongToken) : visitGungu;
  } else if (parts.length >= 2) {
    visitSido = parts[0];
    if (parts[0].indexOf("세종") === 0) {
      visitGungu = parts[0] + " 세종시";
      visitDong = visitGungu + (parts[1] ? " " + parts[1] : "");
    } else if (parts.length >= 4 && parts[2].slice(-1) === "구") {
      visitGungu = parts[0] + " " + parts[1] + " " + parts[2];
      visitDong = visitGungu + " " + parts[3];
    } else {
      visitGungu = parts[0] + " " + parts[1];
      visitDong = parts[2] ? (visitGungu + " " + parts[2]) : visitGungu;
    }
  } else {
    visitSido = "기타";
    visitGungu = "기타";
    visitDong = "기타";
  }

  visitSido = sanitizeKey(visitSido) || "기타";
  visitGungu = sanitizeKey(visitGungu) || visitSido;
  visitDong = sanitizeKey(visitDong) || visitGungu;

  var renderVisitLabel = function (countVal) {
    var $info = $("#complex_visit_info");
    if (!$info.length) return;
    if (!countVal || countVal <= 1) {
      $info.html(isEn ? "This is the first visit!" : "첫 번째 방문이네요!");
    } else {
      var ordinalStr = isEn ? (function (n) {
        var s = ["th", "st", "nd", "rd"], v = n % 100;
        return n.toLocaleString() + (s[(v - 20) % 10] || s[v] || s[0]);
      })(countVal) + " visit!" : countVal.toLocaleString() + "번째 방문이예요!";
      $info.html(ordinalStr);
    }
  };

  if (typeof realrankus_visit === 'function') {
    try {
      realrankus_visit(codeStr, visitSido, visitGungu, visitDong);
    } catch (e) {
      console.warn("realrankus_visit 실행 경고:", e);
    }
  }

  // 비로그인 권한 제한 또는 서브 DB 응답 지연으로 스피너가 남아있는 경우 기본 DB 읽기 전용 폴백 수행
  setTimeout(function () {
    var $info = $("#complex_visit_info");
    if (!$info.length || !$info.find(".spinner-border").length) return;
    if (typeof firebase === 'undefined' || !firebase.database) {
      renderVisitLabel(1);
      return;
    }
    firebase.database().ref().child("realrankus_visit").child("complex_" + codeStr).get()
      .then(function (snapshot) {
        if (!$("#complex_visit_info .spinner-border").length) return;
        var visit_count = 0;
        if (snapshot && snapshot.exists()) {
          var visit_obj = snapshot.val() || {};
          for (var dateKey in visit_obj) {
            var compare_days = Number(String(dateKey).replace(/-/g, ""));
            if (window.days_ago_num <= compare_days) {
              visit_count += (Number(visit_obj[dateKey]) || 0);
            }
          }
        }
        renderVisitLabel(visit_count > 0 ? visit_count : 1);
      })
      .catch(function () {
        if ($("#complex_visit_info .spinner-border").length) {
          renderVisitLabel(1);
        }
      });
  }, 900);
}

function radarMoveLatLng(center, distance, direction) {
  var R = 6378137;
  var dLat = (distance / R) * (180 / Math.PI);
  var dLng = dLat / Math.cos(center.lat() * Math.PI / 180);

  switch (direction) {
    case 'N': return new naver.maps.LatLng(center.lat() + dLat, center.lng());
    case 'S': return new naver.maps.LatLng(center.lat() - dLat, center.lng());
    case 'E': return new naver.maps.LatLng(center.lat(), center.lng() + dLng);
    case 'W': return new naver.maps.LatLng(center.lat(), center.lng() - dLng);
  }
}

function radarConvertToLatLngArray(rawCoords) {
  return rawCoords.map(function(coord) {
    return new naver.maps.LatLng(coord[1], coord[0]);
  });
}

function radarDrawPolygon(coords, options) {
  options = options || {};
  return new naver.maps.Polygon({
    paths: coords,
    map: options.map || radarMapInstance,
    strokeColor: options.strokeColor || '#FF0000',
    strokeOpacity: options.strokeOpacity || 0.8,
    strokeWeight: options.strokeWeight || 2,
    fillColor: options.fillColor || '#FF0000',
    fillOpacity: options.fillOpacity || 0.3
  });
}

// 2026-11-07: 드래그 시 offsetWidth 강제 리플로우(Layout Thrashing) 방지 및 transform 중심 정렬 적용
function RadarCustomOverlay(options) {
  var overlay = new naver.maps.OverlayView();
  var position = options.position;
  var el = document.createElement("div");
  el.className = "label-overlay " + options.class;
  el.innerText = options.name || "이름 없음";

  overlay.onAdd = function () {
    var pane = overlay.getPanes().overlayLayer;
    pane.appendChild(el);
  };

  overlay.draw = function () {
    var projection = overlay.getProjection();
    if (!projection) return;
    var pixel = projection.fromCoordToOffset(position);
    el.style.position = "absolute";
    el.style.left = pixel.x + 5 + "px";
    el.style.transform = "translateX(-50%)";
    el.style.webkitTransform = "translateX(-50%)";
    el.style.top = pixel.y - 45 + "px";
  };

  overlay.onRemove = function () {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  };

  if (options.map) {
    overlay.setMap(options.map);
  }
  return overlay;
}

// 2026-11-07: price/index.html 우측 하단 캡처 버튼과 100% 동일한 내부 마크업 헬퍼
var RADAR_CAPTURE_BTN_INNER_HTML =
  '<span class="btn_icon_wrap"><i class="fa-solid fa-camera"></i></span>' +
  '<span class="btn_progress_wrap">' +
    '<div class="spinner-border spinner-border-sm text-white" role="status"></div>' +
    '<span class="volume-capture-status">이미지 저장 중 (<span class="volume-capture-pct">0%</span>)</span>' +
  '</span>';

function ensureRadarCaptureButtonMarkup($btn) {
  if (!$btn || !$btn.length) return;
  if (!$btn.find('.btn_progress_wrap').length) {
    $btn.html(RADAR_CAPTURE_BTN_INNER_HTML);
  }
}

// 2026-11-07: 플로팅 캡처 버튼 위치 동기화 헬퍼
// - 모바일/모달: #radarDataList_wrapper(또는 #dataList_wrapper) 바깥의 우측 상단(시트 상단 테두리 위 10px)에 배치
// - 데스크톱: 지도 우측 하단(bottom: 24px, right: 24px)에 배치
function syncRadarCaptureButtonPosition(isMobileView, sheetTop) {
  var $capBtn = $("#radarMapCaptureBtn");
  var targetParent = ($("#radarModal").length && $("#radarModal").is(":visible"))
    ? document.getElementById("radarModal")
    : (document.getElementById("radarCenterBox") || document.getElementById("radarMapCaptureArea") || document.body);

  if (!$capBtn.length) {
    $capBtn = $('<button type="button" id="radarMapCaptureBtn" class="radar-map-floating-capture-btn" onclick="captureRadarMapView(event)" data-html2canvas-ignore="true" title="입지 분석 지도 이미지 저장">' + RADAR_CAPTURE_BTN_INNER_HTML + '</button>');
    $(targetParent).append($capBtn);
  } else {
    ensureRadarCaptureButtonMarkup($capBtn);
    if (targetParent && $capBtn[0].parentNode !== targetParent) {
      $(targetParent).append($capBtn);
    }
  }

  // 기존 #info_check_card 내부 버튼이 남아있다면 제거
  $("#radarModalCaptureBtn").remove();

  if (isMobileView) {
    var baseTop = (typeof sheetTop === 'number' && isFinite(sheetTop)) ? sheetTop : (radar_info_pos || (window.innerHeight * 2 / 3 + 10));
    $capBtn.addClass("mobile-sheet-top-right").css({
      'display': 'flex',
      'position': 'fixed',
      'right': '14px',
      'bottom': 'auto',
      'top': Math.max(80, baseTop - 62) + 'px',
      'z-index': 200002
    });
  } else {
    $capBtn.removeClass("mobile-sheet-top-right").css({
      'display': 'flex',
      'position': 'fixed',
      'right': '24px',
      'bottom': '24px',
      'top': 'auto',
      'z-index': 100002
    });
  }
}

// 2026-11-07: 바텀시트 접기/펼치기 애니메이션 - #radarDataList_wrapper 및 #dataList_wrapper 양방향 지원 + 모바일 캡처 버튼 연동
function moveRadarInfoWindow() {
  var moving_dest;
  if (isRadarDown) {
    moving_dest = radar_info_pos;
  } else {
    var checkCardHeight = $("#info_check_card").outerHeight() || 46;
    moving_dest = window.innerHeight - checkCardHeight - 20;
  }

  isRadarDown = !isRadarDown;
  $('#info_OnOff').toggleClass('rotated');
  $('#radarDataList_wrapper, #dataList_wrapper').stop(true, true).animate({ top: moving_dest }, 350);

  var $mobileCapBtn = $('#radarMapCaptureBtn.mobile-sheet-top-right');
  if ($mobileCapBtn.length) {
    $mobileCapBtn.stop(true, true).animate({ top: Math.max(80, moving_dest - 62) }, 350);
  }
}

// 2026-11-07: 실거래가 그래프 표시/숨김 토글 - #radarDataList 및 #dataList 지원
function radarGraphShowHide(obj) {
  var $graph = $("#radarDataList .priceGraph, #dataList .priceGraph");
  var $table = $("#radarDataList .popSubPriceTable, #dataList .popSubPriceTable");
  if (obj.checked) {
    $graph.show();
    $table.css({
      "margin-top": "10px",
      "margin-bottom": "10px",
    });
    setTimeout(function () {
      if (radar_chartView && radar_chartView.length > 0) {
        radar_chartView.forEach(function (chart) {
          if (chart) {
            chart.resize();
            chart.update();
          }
        });
      }
    }, 50);
  } else {
    $graph.hide();
    $table.css({
      "margin-top": "3px",
      "margin-bottom": "0px",
    });
  }
}

function radar_price_sDateChange(val) {
  var startVal = Number(val) + 1;
  var endVal = $("#radar_pEnd").val();

  var eDateOption = "";
  for (var w = startVal; w < radar_sales_history_date.length; w++) {
    var dateLabel = radarFormatOptionDate(radar_sales_history_date[w]);
    eDateOption += "<option value='" + w + "'>" + dateLabel + "</option>";
  }
  $("#radar_pEnd").html(eDateOption);

  if (endVal > startVal) {
    $("#radar_pEnd").val(endVal).prop("selected", true);
  } else {
    endVal = $("#radar_pEnd").val();
  }

  radarPriceChartUpdate(radar_priceCharts, radar_sales_history_price, radar_sales_history_date, startVal, endVal);
}

function radar_price_eDateChange(val) {
  var startVal = $("#radar_pStart").val();
  var endVal = Number(val) - 1;

  radarPriceChartUpdate(radar_priceCharts, radar_sales_history_price, radar_sales_history_date, startVal, endVal);
}

function radarPriceChartUpdate(priceChart, sales_history_price, sales_history_date, sVal, eVal) {
  var isEn = (typeof LANG !== 'undefined' && LANG === 'en') || (sessionStorage.getItem('LANG') === 'en');
  for (var p = 0; p < priceChart.length; p++) {
    if (!radar_chartView[p]) continue;
    var sales_grayHistory1 = [];
    var sales_pHistory = [];
    var sales_grayHistory2 = [];

    sales_pHistory.push(null);
    sales_grayHistory1.push(null);
    sales_grayHistory2.push(null);

    var sales_dHistory = [""];

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
      sales_dHistory.push(radarFormatOptionDate(sales_history_date[y]));
    }
    sales_pHistory.push(null);
    sales_grayHistory1.push(null);
    sales_grayHistory2.push(null);
    sales_dHistory.push("");

    radar_chartView[p].data.datasets[0].data = sales_grayHistory1;
    radar_chartView[p].data.datasets[1].data = sales_pHistory;
    radar_chartView[p].data.datasets[2].data = sales_grayHistory2;
    radar_chartView[p].update();

    var sPrice = sales_history_price[p][sVal];
    var ePrice = sales_history_price[p][eVal - 1];
    var priceRatio = sPrice > 0 ? ((ePrice / sPrice - 1) * 100).toFixed(1) : 0;

    var priceChangeText = "";
    var priceRatioText = "";
    if (isEn) {
      var sPriceM = Math.round(sPrice / 100).toLocaleString();
      var ePriceM = Math.round(ePrice / 100).toLocaleString();
      var priceGapM = Math.round((ePrice - sPrice) / 100).toLocaleString();

      priceChangeText = sPriceM + "M → " + ePriceM + "M";
      if (sPrice == 0) {
        priceRatioText += " ( --- , --- )";
      } else {
        priceRatioText += (ePrice - sPrice >= 0 ? " (+" : " (") + priceGapM + "M, ";
        if (priceRatio > 0) {
          priceRatioText += "<span style='color:#fe4040'>▲" + priceRatio + "%</span>)";
        } else if (priceRatio == 0) {
          priceRatioText += "<span style='color:#000'>" + priceRatio + "%</span>)";
        } else {
          priceRatioText += "<span style='color:blue'>▼" + (priceRatio * -1) + "%</span>)";
        }
      }
    } else {
      var priceGap = ((ePrice - sPrice) / 10000).toFixed(2);
      priceChangeText = (sPrice / 10000).toFixed(2) + " → " + (ePrice / 10000).toFixed(2) + "억";
      if (sPrice == 0) {
        priceRatioText += " ( --- , --- )";
      } else {
        priceRatioText += (priceGap >= 0 ? " (+" : " (") + priceGap + "억, ";
        if (priceRatio > 0) {
          priceRatioText += "<span style='color:#fe4040'>▲" + priceRatio + "%</span>)";
        } else if (priceRatio == 0) {
          priceRatioText += "<span style='color:#000'>" + priceRatio + "%</span>)";
        } else {
          priceRatioText += "<span style='color:blue'>▼" + (priceRatio * -1) + "%</span>)";
        }
      }
    }
    $("#radar_pChange" + p).html(priceChangeText);
    $("#radar_pRatio" + p).html(priceRatioText);
  }
}

function radarPriceChartDraw(priceChart, sales_history_price, sales_history_date, sVal, eVal) {
  var isEn = (typeof LANG !== 'undefined' && LANG === 'en') || (sessionStorage.getItem('LANG') === 'en');
  radar_chartView = [];
  for (var p = 0; p < priceChart.length; p++) {
    var sales_grayHistory1 = [null];
    var sales_pHistory = [null];
    var sales_grayHistory2 = [null];
    var sales_dHistory = [""];

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
      sales_dHistory.push(radarFormatOptionDate(sales_history_date[y]));
    }
    sales_pHistory.push(null);
    sales_grayHistory1.push(null);
    sales_grayHistory2.push(null);
    sales_dHistory.push("");

    var filteredPrices = sales_pHistory.filter(function(v){ return v !== null && !isNaN(v); });
    var maxVal = filteredPrices.length > 0 ? Math.max.apply(Math, filteredPrices) : 0;
    var priceMax = (maxVal > 0 && isFinite(maxVal)) ? maxVal * 1.3 : 10;

    var canvasEl = document.getElementById(priceChart[p]);
    if (canvasEl) {
      if (typeof Chart !== 'undefined' && Chart.getChart) {
        var existingChart = Chart.getChart(canvasEl);
        if (existingChart) {
          existingChart.destroy();
        }
      }
      var ctx = canvasEl.getContext('2d');
      radar_chartView[p] = new Chart(ctx, {
        type: 'line',
        plugins: (typeof ChartDataLabels !== 'undefined') ? [ChartDataLabels] : [],
        data: {
          labels: sales_dHistory,
          datasets: [
            {
              data: sales_grayHistory1,
              borderColor: "#ddd",
              borderWidth: 1,
              backgroundColor: "#ddd",
              pointRadius: 1,
              pointStyle: 'rect',
              hitRadius: 10,
              fill: false
            },
            {
              data: sales_pHistory,
              borderColor: "#ff3d38",
              borderWidth: 1,
              backgroundColor: "#ff3d38",
              pointRadius: 1,
              pointStyle: 'rect',
              hitRadius: 10,
              fill: false
            },
            {
              data: sales_grayHistory2,
              borderColor: "#ddd",
              borderWidth: 1,
              backgroundColor: "#ddd",
              pointRadius: 1,
              pointStyle: 'rect',
              hitRadius: 10,
              fill: false
            }
          ]
        },
        options: {
          interaction: {
            mode: 'index',
            intersect: false
          },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false },
            datalabels: {
              display: 'auto',
              color: 'black',
              align: 'top',
              anchor: 'center',
              padding: 3,
              textAlign: 'center',
              font: {
                size: 9
              }
            }
          },
          scales: {
            y: {
              display: false,
              beginAtZero: true,
              suggestedMax: priceMax,
              suggestedMin: 0
            },
            x: {
              ticks: {
                maxRotation: 0,
                font: { size: 10 }
              }
            }
          }
        }
      });
      if (typeof window.chartView !== 'undefined' && Array.isArray(window.chartView)) {
        window.chartView[p] = radar_chartView[p];
      }
    }

    var sPrice = sales_history_price[p][sVal];
    var ePrice = sales_history_price[p][eVal - 1];
    var priceRatio = sPrice > 0 ? ((ePrice / sPrice - 1) * 100).toFixed(1) : 0;

    var priceChangeText = "";
    var priceRatioText = "";
    if (isEn) {
      var sPriceM = Math.round(sPrice / 100).toLocaleString();
      var ePriceM = Math.round(ePrice / 100).toLocaleString();
      var priceGapM = Math.round((ePrice - sPrice) / 100).toLocaleString();

      priceChangeText = sPriceM + "M → " + ePriceM + "M";
      if (sPrice == 0) {
        priceRatioText += " ( --- , --- )";
      } else {
        priceRatioText += (ePrice - sPrice >= 0 ? " (+" : " (") + priceGapM + "M, ";
        if (priceRatio > 0) {
          priceRatioText += "<span style='color:#fe4040'>▲" + priceRatio + "%</span>)";
        } else if (priceRatio == 0) {
          priceRatioText += "<span style='color:#000'>" + priceRatio + "%</span>)";
        } else {
          priceRatioText += "<span style='color:blue'>▼" + (priceRatio * -1) + "%</span>)";
        }
      }
    } else {
      var priceGap = ((ePrice - sPrice) / 10000).toFixed(2);
      priceChangeText = (sPrice / 10000).toFixed(2) + " → " + (ePrice / 10000).toFixed(2) + "억";
      if (sPrice == 0) {
        priceRatioText += " ( --- , --- )";
      } else {
        priceRatioText += (priceGap >= 0 ? " (+" : " (") + priceGap + "억, ";
        if (priceRatio > 0) {
          priceRatioText += "<span style='color:#fe4040'>▲" + priceRatio + "%</span>)";
        } else if (priceRatio == 0) {
          priceRatioText += "<span style='color:#000'>" + priceRatio + "%</span>)";
        } else {
          priceRatioText += "<span style='color:blue'>▼" + (priceRatio * -1) + "%</span>)";
        }
      }
    }
    $("#radar_pChange" + p).html(priceChangeText);
    $("#radar_pRatio" + p).html(priceRatioText);
  }
}

function radar_icon_show_hide(id, isChecked) {
  var map = radarMapInstance;
  if (!map) return;

  //교통
  if (id == "check_trans") {
    if (isChecked) {
      $(".check_trans_child").prop({ 'checked': true });
      $(".trans_marker").show();
      if (radar_metro_line) radar_metro_line.setMap(map);
    } else {
      $(".check_trans_child").prop({ 'checked': false });
      $(".trans_marker").hide();
      if (radar_metro_line) radar_metro_line.setMap(null);
    }
  }

  //가까운 역
  if (id == "check_nearestStation") {
    if (isChecked) {
      $("#check_trans").prop({ 'checked': true });
      $(".trans_marker").show();
      if (radar_metro_line) radar_metro_line.setMap(map);
    } else {
      $("#check_trans").prop({ 'checked': false });
      $(".trans_marker").hide();
      if (radar_metro_line) radar_metro_line.setMap(null);
    }
  }

  //인프라
  if (id == "check_infra") {
    if (isChecked) {
      $(".check_infra_child").prop({ 'checked': true });
      $(".infra_marker").show();
      radar_market_polygons.forEach(function(polygon) { polygon.setMap(map); });
    } else {
      $(".check_infra_child").prop({ 'checked': false });
      $(".infra_marker").hide();
      radar_market_polygons.forEach(function(polygon) { polygon.setMap(null); });
    }
  }

  if (id == "check_departmentStore") {
    if (isChecked) { $(".department_store").show(); }
    else { $(".department_store").hide(); }
  }

  if (id == "check_mall") {
    if (isChecked) { $(".mall").show(); }
    else { $(".mall").hide(); }
  }

  if (id == "check_mart") {
    if (isChecked) { $(".mart").show(); }
    else { $(".mart").hide(); }
  }

  if (id == "check_market") {
    if (isChecked) {
      $(".market").show();
      radar_market_polygons.forEach(function(polygon) { polygon.setMap(map); });
    } else {
      $(".market").hide();
      radar_market_polygons.forEach(function(polygon) { polygon.setMap(null); });
    }
  }

  if (id == "check_bank") {
    if (isChecked) { $(".bank").show(); }
    else { $(".bank").hide(); }
  }

  if (id == "check_hospital") {
    if (isChecked) { $(".hospital").show(); }
    else { $(".hospital").hide(); }
  }

  if (id == "check_big_hospital") {
    if (isChecked) { $(".big_hospital").show(); }
    else { $(".big_hospital").hide(); }
  }

  if (id == "check_park") {
    if (isChecked) { $(".park").show(); }
    else { $(".park").hide(); }
  }

  if (id == "check_big_park") {
    if (isChecked) { $(".big_park").show(); }
    else { $(".big_park").hide(); }
  }

  if (id == "check_harmful") {
    if (isChecked) { $(".harmful").show(); }
    else { $(".harmful").hide(); }
  }

  var all_infra_unchecked = $(".check_infra_child").filter(":checked").length === 0;
  if (all_infra_unchecked) {
    $("#check_infra").prop({ 'checked': false });
  } else {
    $("#check_infra").prop({ 'checked': true });
  }

  //교육
  if (id == "check_edu") {
    if (isChecked) {
      $(".check_edu_child").prop({ 'checked': true });
      $(".edu_marker").show();
      if (radar_pSchool_line) radar_pSchool_line.setMap(map);
      radar_mSchool_lines.forEach(function(polyline) { polyline.setMap(map); });
      radar_academy_polygons.forEach(function(polygon) { polygon.setMap(map); });
    } else {
      $(".check_edu_child").prop({ 'checked': false });
      $(".edu_marker").hide();
      if (radar_pSchool_line) radar_pSchool_line.setMap(null);
      radar_mSchool_lines.forEach(function(polyline) { polyline.setMap(null); });
      radar_academy_polygons.forEach(function(polygon) { polygon.setMap(null); });
    }
  }

  if (id == "check_pSchool") {
    if (isChecked) {
      $(".pSchool").show();
      if (radar_pSchool_line) radar_pSchool_line.setMap(map);
    } else {
      $(".pSchool").hide();
      if (radar_pSchool_line) radar_pSchool_line.setMap(null);
    }
  }

  if (id == "check_mSchool") {
    if (isChecked) {
      $(".mSchool").show();
      radar_mSchool_lines.forEach(function(polyline) { polyline.setMap(map); });
    } else {
      $(".mSchool").hide();
      radar_mSchool_lines.forEach(function(polyline) { polyline.setMap(null); });
    }
  }

  if (id == "check_academy") {
    if (isChecked) {
      $(".academy").show();
      radar_academy_polygons.forEach(function(polygon) { polygon.setMap(map); });
    } else {
      $(".academy").hide();
      radar_academy_polygons.forEach(function(polygon) { polygon.setMap(null); });
    }
  }

  if (id == "check_drink") {
    if (isChecked) {
      $(".drink").show();
      $(".motel").show();
    } else {
      $(".drink").hide();
      $(".motel").hide();
    }
  }

  var all_edu_unchecked = $(".check_edu_child").filter(":checked").length === 0;
  if (all_edu_unchecked) {
    $("#check_edu").prop({ 'checked': false });
  } else {
    $("#check_edu").prop({ 'checked': true });
  }
}

// 이벤트 위임 바인딩 (모달 내 체크박스 및 토글)
$(document).on('click', '#radarDataList .check-facility', function (e) {
  e.stopPropagation();
});

$(document).on('click', '#radarDataList .popSubTableRadar', function () {
  const $checkbox = $(this).find('.check-facility');
  if ($checkbox.length > 0) {
    const newState = !$checkbox.prop('checked');
    $checkbox.prop('checked', newState).trigger('change');
  }
});

$(document).on('click', '#radarDataList .popTitleRadar', function () {
  const $checkbox = $(this).find('.check-facility');
  if ($checkbox.length > 0) {
    const newState = !$checkbox.prop('checked');
    $checkbox.prop('checked', newState).trigger('change');
  }
});

$(document).on('change', '#radarDataList .check-facility', function () {
  const id = $(this).attr('id');
  const isChecked = $(this).is(':checked');
  radar_icon_show_hide(id, isChecked);
});

/**
 * @function renderRadarModalView
 * @description radarMap.html의 모바일 화면(isMobile=true)과 100% 동일한 DOM과 차트를 구축
 * @param {Object} aptData - 단지 입지 분석 상세 데이터
 */
function renderRadarModalView(aptData) {
  if (!aptData) return;
  // 2026-11-07: 현재 렌더링된 단지 데이터 전역 캐싱 (캡처 및 외부 연동 지원)
  window.currentRadarAptData = aptData;

  var t = (typeof window.tSafe === 'function') ? window.tSafe : function (k, d) { return d; };
  var isEn = (typeof LANG !== 'undefined' && LANG === 'en') || (sessionStorage.getItem('LANG') === 'en');

  var aptName = aptData["아파트명"] || "";
  var rank = aptData["rank"] ? Number(aptData["rank"]).toFixed() : "";
  var apt_type = aptData["매매타입"] || "아파트";
  var law_Address = aptData["법정동주소"] || "";
  var road_Address = aptData["도로명주소"] || "";
  var aptValue = Math.round((Number(aptData["가치 총점"]) || 0) * 100) / 100;
  var aptDuration = aptData["준공년차"] || "";
  var aptYear = "";

  var complex_grade = (typeof setGrade === 'function') ? setGrade(aptValue) : (aptValue >= 70 ? "S" : (aptValue >= 55 ? "A" : (aptValue >= 40 ? "B" : "C")));

  var tReconstruction = t("ui.report.reconstruction", "재건축");
  var tExpected = t("ui.report.presale_expected", "예정");
  var tPresaleScheduled = t("ui.report.presale_scheduled", "분양예정");
  var tYearsSuffix = t("ui.report.years_suffix", "년차");

  var aptYear_val = aptData["준공년월"] || "";
  if (isEn && aptYear_val) {
    aptYear_val = new Date(aptYear_val).toLocaleString("en-US", { month: "short", year: "numeric" });
  }

  if (apt_type == "아파트") { aptYear = aptYear_val + " (" + aptDuration + tYearsSuffix + ")"; }
  if (apt_type == "재건축") { aptYear = aptYear_val + " (" + aptDuration + tYearsSuffix + ", " + tReconstruction + ")"; }
  if (apt_type == "분양권") { aptYear = "(" + (isEn ? "Pre-sale" : "분양권") + ", " + aptYear_val + " " + tExpected + ")"; }
  if (apt_type == "분양(예정)") { aptYear = "(" + tPresaleScheduled + ")"; }

  var nearestStation = isEn ? (aptData["closest_station"] + " (" + (Math.round((aptData["가까운역거리"] || 0) * 100) / 100).toFixed() + "m)") : (aptData["가까운역이름"] + "역(" + (Math.round((aptData["가까운역거리"] || 0) * 100) / 100).toFixed() + "m)");
  var stationArea = aptData["역세권여부"];
  var stationPoint_30m = aptData["30분이내주요거점역"] || 0;
  var stationPoint_1h = aptData["1시간이내주요거점역"] || 0;

  var tCountSuffix = isEn ? "" : "개";
  var departmentStore_3km = (aptData["3km이내백화점수"] || 0) + tCountSuffix;
  var OutletMall_5km = (aptData["5km이내아울렛몰수"] || 0) + tCountSuffix;
  var bigMart_1km = (aptData["1km이내대형마트수"] || aptData["1km이내대형먀트수"] || 0) + tCountSuffix;
  var bank_500m = (aptData["500m이내은행수"] || 0) + tCountSuffix;
  var hospital_500m = (aptData["500m이내병원수"] || 0) + tCountSuffix;
  var bigHospital_5km = (aptData["5km이내대형병원수"] || 0) + tCountSuffix;
  var park_500m = (aptData["500m이내공원수"] || 0) + tCountSuffix;
  var big_park_1km = (aptData["800m이내대형공원수"] || 0) + tCountSuffix;
  var harmful_3km = (aptData["3km이내혐오시설수"] || 0) + tCountSuffix;
  var pSchool_edu = Number(aptData["초등학교학업성취도"]) || 0;
  var pSchool_distance = Number(aptData["초등학교거리"]) || 0;
  var mSchool_edu = Number(aptData["중학교학업성취도"] || 0).toFixed(1) + "%";
  var academy_edu = isEn ? ((aptData["500m이내학원가"] || 0) + " area(s) (" + (aptData["500m이내학원수"] || 0) + " in total)") : ((aptData["500m이내학원가"] || 0) + "개" + "(총 " + (aptData["500m이내학원수"] || 0) + "개 학원)");
  var academy_edu_long = isEn ? ((aptData["1km이내학원가"] || 0) + " area(s) (" + (aptData["1km이내학원수"] || 0) + " in total)") : ((aptData["1km이내학원가"] || 0) + "개" + "(총 " + (aptData["1km이내학원수"] || 0) + "개 학원)");
  var market_infra = isEn ? ((aptData["300m이내상권"] || 0) + " area(s) (" + (aptData["300m이내점포수"] || 0) + " in total)") : ((aptData["300m이내상권"] || 0) + "개" + "(총 " + (aptData["300m이내점포수"] || 0) + "개 지점)");

  var livingScore = (Math.round((Number(aptData["주거총점"]) || 0) * 100) / 100).toFixed(2);
  var transportScore = (Math.round((Number(aptData["교통총점"]) || 0) * 100) / 100).toFixed(2);
  var infraScore = (Math.round((Number(aptData["인프라총점"]) || 0) * 100) / 100).toFixed(2);
  var eduScore = (Math.round((Number(aptData["학군총점"]) || 0) * 100) / 100).toFixed(2);

  var area_info = aptData["area_info"] || "";
  var maintainance = aptData["maintenance"] || "";
  var rooms = aptData["room"] || "";
  var baths = aptData["bath"] || "";
  var house_num = aptData["세대수"];
  var parking = aptData["주차"] || "";
  var heating = aptData["난방"] || "";
  var entrance = aptData["현관구조"] || "";
  var sales_info = aptData["sales_info"] || "";
  var price_per = aptData["price_per"] || "";

  var searchCode = aptData["검색코드"] || "";
  var drink_pub = Number(aptData["300m이내유흥주점"]) || 0;
  var daran_pub = Number(aptData["300m이내단란주점"]) || 0;
  var motel = Number(aptData["300m이내모텔"]) || 0;

  var last_sales = (aptData["last_sales"] || "").split(",");
  var last_sales_date = last_sales[0] ? last_sales[0].toString() : "";
  var last_sales_price = last_sales[1] ? last_sales[1].toString() : "";
  var last_sales_area = last_sales[2] || "";

  var rent_info = aptData["rent_info"] || "";
  var rent_ratio = aptData["rent_ratio"] || "";
  var last_rent = (aptData["last_rent"] || "").split(",");
  var last_rent_date = last_rent[0] ? last_rent[0].toString() : "";
  var last_rent_price = last_rent[1] ? last_rent[1].toString() : "";
  var last_rent_area = last_rent[2] || "";

  var floor_rate = aptData["용적률"];
  if (floor_rate == "0" || floor_rate == 0 || floor_rate == undefined || isNaN(floor_rate)) {
    floor_rate = "--%";
  } else {
    floor_rate = Number(aptData["용적률"]).toFixed(0) + "%";
  }

  var cover_rate = aptData["건폐율"];
  if (cover_rate == "0" || cover_rate == 0 || cover_rate == undefined || isNaN(cover_rate)) {
    cover_rate = "--%";
  } else {
    cover_rate = Number(aptData["건폐율"]).toFixed(0) + "%";
  }

  if (isEn) {
    aptName = aptData["APT_Name_EN"] || aptData["아파트명"] || "";
    road_Address = aptData["Road_Addr_EN"] || aptData["도로명주소"] || "";
    law_Address = aptData["Law_Addr_EN"] || aptData["법정동주소"] || "";
    if (parking && typeof parking === 'string') {
      if (parking == "" || parking == "미정") {
        parking = "TBD";
      } else {
        parking = parking.replace("세대당 ", "").replace("대", " per household");
      }
    }
    if (heating && typeof heating === 'string') {
      var heatingDict = { "개별난방": "Individual", "지역난방": "District", "중앙난방": "Central", "도시가스": "City Gas", "미정": "TBD" };
      heating = heatingDict[heating] || heating;
    }
    if (entrance && typeof entrance === 'string') {
      var entranceDict = { "계단식": "Staircase", "복도식": "Corridor", "복합식": "Mixed", "미정": "TBD" };
      entrance = entranceDict[entrance] || entrance;
    }
  }

  // 2026-11-07: 데스크톱/모바일 환경 판정 (모달 내부이거나 모바일 브라우저인 경우 모바일 뷰, 데스크톱 독립 페이지는 데스크톱 뷰)
  var isInModal = $("#radarModal").length > 0 && $("#radarModal").is(":visible");
  var isMobileDevice = (typeof window.isMobile !== 'undefined') ? window.isMobile : /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  var isMobileView = isInModal || isMobileDevice;

  var $listWrapper = $("#radarDataList_wrapper").length ? $("#radarDataList_wrapper") : $("#dataList_wrapper");
  var $list = $("#radarDataList").length ? $("#radarDataList") : $("#dataList");
  var mapTarget = document.getElementById("radarDataMap") || document.getElementById("dataMap");
  var $aptInfoWrap = $("#radarAptInfoWrap").length ? $("#radarAptInfoWrap") : $("#apt_info_mobile_wrap");
  if (!$aptInfoWrap.length) {
    var captureContainer = document.getElementById("radarMapCaptureArea") || (mapTarget ? mapTarget.parentNode : null) || document.body;
    $aptInfoWrap = $("<div id='radarAptInfoWrap'></div>").appendTo(captureContainer);
  }

  // 1. 상단 플로팅 아파트 카드 (#apt_info_mobile - 모바일 화면 및 캡처 전용)
  var aptInfoHtml = "";
  aptInfoHtml += "<div class='card' id='apt_info_mobile' style='box-shadow:none; border:none; padding-top:0px; padding-bottom:0px; pointer-events:auto;'>";
  aptInfoHtml += "<div class='card-body' id='apt_info_body' style='padding-top:5px; padding-bottom:5px; pointer-events:auto;'>";
  aptInfoHtml += "<div id='iframe_back' style='font-size:2em; cursor:pointer; pointer-events:auto; z-index:200005; padding:2px 8px 2px 2px; touch-action:manipulation;'> <i class='fa-solid fa-chevron-left'></i> </div>";
  aptInfoHtml += "<div>";
  aptInfoHtml += "<div class='popupTitle' style='font-size: 1.25em; font-weight: 600'>" + aptName;
  aptInfoHtml += "<span style='font-size:0.8em'> (Rank " + complex_grade + ")</span></div>";
  aptInfoHtml += "<div class='popContent'>" + aptYear + "</div>";
  if (apt_type == "분양권" || apt_type == "분양(예정)") {
    aptInfoHtml += "<div class='popContent' style='font-size: 0.8em'>" + road_Address + "</div>";
  } else {
    aptInfoHtml += "<div class='popContent' style='font-size: 0.8em'>" + law_Address + "</div>";
  }
  aptInfoHtml += "</div>";
  aptInfoHtml += "</div>";
  aptInfoHtml += "</div>";

  $aptInfoWrap.html(aptInfoHtml);

  if (isMobileView) {
    $aptInfoWrap.css({
      'position': 'absolute', 'top': '0px', 'left': '0px', 'width': '100%',
      'z-index': 200000, 'pointer-events': 'none', 'display': 'block'
    });
    $("#apt_info_mobile").css({
      'position': 'absolute', 'top': '10px', 'left': '3px', 'font-size': '0.85em', 'width': window.innerWidth - 50,
      'border-radius': '3px', 'box-shadow': 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px',
      'background-color': 'rgba(255, 255, 255, 0.75)', 'z-index': 200001, 'pointer-events': 'auto'
    });
    $("#iframe_back").show();
  } else {
    // 2026-11-07: 데스크톱 화면에서는 평상시 숨기고, 캡처 시에만 지도 좌측 상단에 렌더링되도록 준비
    $aptInfoWrap.css({
      'position': 'absolute', 'top': '16px', 'left': '16px', 'z-index': 1000,
      'pointer-events': 'none', 'display': 'none'
    });
    $("#apt_info_mobile").css({
      'position': 'relative', 'top': '0px', 'left': '0px', 'font-size': '0.85em', 'width': 'auto',
      'min-width': '280px', 'border-radius': '4px',
      'box-shadow': 'rgba(0, 0, 0, 0.15) 0px 2px 6px',
      'background-color': 'rgba(255, 255, 255, 0.85)',
      'backdrop-filter': 'blur(4px)',
      'pointer-events': 'auto'
    });
    $("#iframe_back").hide();
  }

  // 2026-11-07: 뒤로가기 버튼 단일 이벤트 리스너 처리 및 350ms fadeOut 연동
  $("#iframe_back").off("click").on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof closeSelfIframe === "function") {
      closeSelfIframe();
    } else if (typeof closeRadarModal === "function") {
      closeRadarModal();
    } else if (typeof window.closeRadarModal === "function") {
      window.closeRadarModal();
    } else {
      $("#radarModal").fadeOut(350, function () {
        $("#radarDataList_wrapper, #dataList_wrapper, #radarMapCaptureBtn").hide();
      });
    }
  });

  // 2. 바텀시트 / 사이드바 콘텐츠 생성 (radarMap.html 100% 동일)
  var detailHtml = "";

  if (!isMobileView) {
    // 2026-11-07: 데스크톱 전용 1) 아파트 상세 정보 카드 (#apt_info)
    detailHtml += "<div class='card' id='apt_info' style='box-shadow:none; border:none; padding-top:0px; padding-bottom:0px'>";
    detailHtml += "<div class='card-body' style='padding-top:5px; padding-bottom:5px'>";
    detailHtml += "<div class='popupTitle' style='font-size: 1.25em; font-weight: 600'>" + aptName;
    detailHtml += "<span style='font-size:0.8em'> (Rank " + complex_grade + ")</span></div>";
    detailHtml += "<div class='popContent'>" + aptYear + "</div>";
    if (apt_type == "분양권" || apt_type == "분양(예정)") {
      detailHtml += "<div class='popContent' style='font-size: 0.8em'>" + law_Address + "</div>";
    } else {
      detailHtml += "<div class='popupSubtitle' style='font-size: 0.8em'>" + (isEn ? "(Road)" : "(신)") + " " + road_Address + "</div>";
      detailHtml += "<div class='popupSubtitle' style='font-size: 0.8em'>" + (isEn ? "(Jibun)" : "(구)") + " " + law_Address + "</div>";
    }
    detailHtml += "</div></div>";

    // 2026-11-07: 데스크톱 전용 2) 방문 및 좋아요 카드 (#visit_like_card)
    detailHtml += "<div class='card' id='visit_like_card'>";
    detailHtml += "<div id='complex_visit_info'><div class='spinner-border spinner-border-sm' role='status'></div></div>";
    detailHtml += "<div class='card-body' style='padding-top: 5px; padding-bottom: 5px;'>";
    detailHtml += "<div class='complex_like'>";

    detailHtml += "<div class='complex_like_category'>";
    detailHtml += "<div class='complex_like_living' onclick='complex_like_updown(\"living\", \"" + searchCode + "\", \"" + aptName + "\")'>";
    detailHtml += "<div class='complex_like_name'>" + t("ui.report.living", "주거") + "</div>";
    detailHtml += "<div class='complex_like_num' id='complex_like_living_" + searchCode + "'>";
    detailHtml += "<div class='complex_like_thumb'><i class='fa-regular fa-thumbs-up'></i></div>";
    detailHtml += "<div id='complex_like_num_living_" + searchCode + "'>##</div>";
    detailHtml += "</div></div></div>";

    if (stationArea != undefined && stationArea !== "") {
      detailHtml += "<div class='complex_like_category'>";
      detailHtml += "<div class='complex_like_trans' onclick='complex_like_updown(\"trans\", \"" + searchCode + "\", \"" + aptName + "\")'>";
      detailHtml += "<div class='complex_like_name'>" + t("ui.report.transport", "교통") + "</div>";
      detailHtml += "<div class='complex_like_num' id='complex_like_trans_" + searchCode + "'>";
      detailHtml += "<div class='complex_like_thumb'><i class='fa-regular fa-thumbs-up'></i></div>";
      detailHtml += "<div id='complex_like_num_trans_" + searchCode + "'>##</div>";
      detailHtml += "</div></div></div>";
    }

    detailHtml += "<div class='complex_like_category'>";
    detailHtml += "<div class='complex_like_infra' onclick='complex_like_updown(\"infra\", \"" + searchCode + "\", \"" + aptName + "\")'>";
    detailHtml += "<div class='complex_like_name'>" + t("ui.report.infra", "인프라") + "</div>";
    detailHtml += "<div class='complex_like_num' id='complex_like_infra_" + searchCode + "'>";
    detailHtml += "<div class='complex_like_thumb'><i class='fa-regular fa-thumbs-up'></i></div>";
    detailHtml += "<div id='complex_like_num_infra_" + searchCode + "'>##</div>";
    detailHtml += "</div></div></div>";

    detailHtml += "<div class='complex_like_category'>";
    detailHtml += "<div class='complex_like_edu' onclick='complex_like_updown(\"edu\", \"" + searchCode + "\", \"" + aptName + "\")'>";
    detailHtml += "<div class='complex_like_name'>" + t("ui.report.education", "교육") + "</div>";
    detailHtml += "<div class='complex_like_num' id='complex_like_edu_" + searchCode + "'>";
    detailHtml += "<div class='complex_like_thumb'><i class='fa-regular fa-thumbs-up'></i></div>";
    detailHtml += "<div id='complex_like_num_edu_" + searchCode + "'>##</div>";
    detailHtml += "</div></div></div>";

    detailHtml += "</div></div></div>";
  } else {
    // 2026-11-07: 모바일/모달 전용 상단 체크박스 및 접기 버튼 (#info_check_card - 캡처 버튼은 바텀시트 바깥 우측 상단으로 분리)
    detailHtml += "<div class='card-body' id='info_check_card'>";
    detailHtml += "<div id='info_check_div'>";
    if (stationArea != undefined && stationArea !== "") {
      detailHtml += "<div class='popTitleRadar'><div><input class='form-check-input check-facility' type='checkbox' id='check_trans' checked></div>" + t("ui.transport_score_label", "교통") + "</div>";
      detailHtml += "<div class='popTitleRadar'><div><input class='form-check-input check-facility' type='checkbox' id='check_infra' checked></div>" + t("ui.infra_score_label", "인프라") + "</div>";
      detailHtml += "<div class='popTitleRadar'><div><input class='form-check-input check-facility' type='checkbox' id='check_edu' checked></div>" + t("ui.edu_score_label", "교육") + "</div>";
    } else {
      detailHtml += "<div class='popTitleRadar'><div><input class='form-check-input check-facility' type='checkbox' id='check_infra' checked></div>" + t("ui.infra_score_label", "인프라") + "</div>";
      detailHtml += "<div class='popTitleRadar'><div><input class='form-check-input check-facility' type='checkbox' id='check_edu' checked></div>" + t("ui.edu_score_label", "교육") + "</div>";
      detailHtml += "<div></div>";
    }
    detailHtml += "<div id='info_OnOff' onClick='moveRadarInfoWindow()'><i class='fa-solid fa-chevron-down'></i></div>";
    detailHtml += "</div>";
    detailHtml += "</div>";
  }

  var chartWidth = window.innerWidth - 130;

  // 2-2. 교통 카드
  if (stationArea != undefined && stationArea !== "") {
    detailHtml += "<div class='card mobile_card'>";
    detailHtml += "<div class='card-header'>";
    if (isMobileView) {
      detailHtml += "<div class='popTitle_mobile'>";
      detailHtml += "<div><i class='fas fa-bus'></i></div>";
      detailHtml += "<div>" + t("ui.report.transport", "교통") + "</div>";
      detailHtml += "<div class='graph' style='height: 30px; width:" + chartWidth + "px'> <canvas id='radar_transportChart'></canvas></div>";
      detailHtml += "</div>";
    } else {
      detailHtml += "<div class='popTitleRadar'><div><input class='form-check-input check-facility' type='checkbox' id='check_trans' checked></div>" + t("ui.report.transport", "교통") + "</div>";
    }
    detailHtml += "</div>";
    detailHtml += "<div class='card-body'>";
    detailHtml += "<div id='popTransport'>";
    if (!isMobileView) {
      detailHtml += "<div class='graph' style='height: 56px'> <canvas id='radar_transportChart'></canvas></div>";
    }
    detailHtml += "<div class='popTable'>";
    detailHtml += `
      <div class='popSubTableRadar' style='grid-template-columns: 26px 1fr 2fr;'>
        <div>
          <input class='form-check-input check-facility check_trans_child' type='checkbox' id='check_nearestStation' checked>
        </div>
        <div class='popContent'>${t("ui.report.nearest_station_label", "가장 가까운 역")}</div>
        <div class='popResult'>${nearestStation}</div>
      </div>
    `;
    // 2026-11-07: 배열(Array) 또는 문자열(String) 형태의 역노선/거점역 데이터 안전 정규화
    var subway_line = (isEn && aptData["Line_EN"]) ? aptData["Line_EN"] : (aptData["역노선"] || "");
    if (Array.isArray(subway_line)) {
      subway_line = subway_line.join(", ");
    } else {
      subway_line = String(subway_line).replace("[", "").replace("]", "").replace(/\'/g, "");
    }
    detailHtml += "<div class='stationList'><div></div><div class='stationText'>" + subway_line + "</div></div>";

    detailHtml += "<div class='popSubTable'><div class='popContent'>" + t("ui.report.station_30m_label", "30분 이내 도착 가능 주요역") + "</div>" + "<div class='popResult'>" + stationPoint_30m + tCountSuffix + "</div></div>";
    if (stationPoint_30m != 0) {
      var stations_30m = (isEn && aptData["Key_stations_30m"]) ? aptData["Key_stations_30m"] : (aptData["30분거점역이름"] || "");
      if (Array.isArray(stations_30m)) {
        stations_30m = stations_30m.join(", ");
      } else {
        stations_30m = String(stations_30m).replace("[", "").replace("]", "").replace(/\'/g, "");
      }
      detailHtml += "<div class='stationList'><div></div><div class='stationText'>" + stations_30m + "</div></div>";
    }

    detailHtml += "<div class='popSubTable' id='stationTable'><div class='popContent'>" + t("ui.report.station_1h_label", "1시간 이내 도착 가능 주요역") + "</div>" + "<div class='popResult'>" + stationPoint_1h + tCountSuffix + "</div></div>";
    if (stationPoint_1h != 0) {
      var stations_1h = (isEn && aptData["Key_stations_1h"]) ? aptData["Key_stations_1h"] : (aptData["1시간거점역이름"] || "");
      if (Array.isArray(stations_1h)) {
        stations_1h = stations_1h.join(", ");
      } else {
        stations_1h = String(stations_1h).replace("[", "").replace("]", "").replace(/\'/g, "");
      }
      detailHtml += "<div class='stationList'><div></div><div class='stationText'>" + stations_1h + "</div></div><hr style='margin-top: 2px'>";
    }
    detailHtml += "<div class='comment2'>" + t("ui.report.transport_guide_tmap", "가장 가까운 역은 직선거리로 계산됩니다.<br>주요역은 평일 출근시간대 하차인원이 가장 많은 역을 의미합니다.<br>30분, 1시간 이동 거리는 T-MAP 대중교통 이동 시간 정보를 사용합니다.") + "</div>";
    detailHtml += "</div></div></div></div>";
  }

  // 2-3. 인프라 카드
  detailHtml += "<div class='card mobile_card'>";
  detailHtml += "<div class='card-header'>";
  if (isMobileView) {
    detailHtml += "<div class='popTitle_mobile'>";
    detailHtml += "<div><i class='fas fa-hospital-user'></i></div>";
    detailHtml += "<div>" + t("ui.report.infra", "인프라") + "</div>";
    detailHtml += "<div class='graph' style='height: 30px; width:" + chartWidth + "px'> <canvas id='radar_infraChart'></canvas></div>";
    detailHtml += "</div>";
  } else {
    detailHtml += "<div class='popTitleRadar'><div><input class='form-check-input check-facility' type='checkbox' id='check_infra' checked></div>" + t("ui.report.infra", "인프라") + "</div>";
  }
  detailHtml += "</div>";
  detailHtml += "<div class='card-body'>";
  detailHtml += "<div id='popInfra'>";
  if (!isMobileView) {
    detailHtml += "<div class='graph' style='height: 56px'> <canvas id='radar_infraChart'></canvas></div>";
  }
  detailHtml += "<div class='popTable'>";

  // 백화점
  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_infra_child' type='checkbox' id='check_departmentStore' checked></div>
      <div class='popContent'>${t("ui.report.dept_store_3km_label", "3km 이내 백화점")}</div>
      <div class='popResult'>${departmentStore_3km}</div>
    </div>
  `;
  // 아울렛몰
  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_infra_child' type='checkbox' id='check_mall' checked></div>
      <div class='popContent'>${t("ui.report.outlet_5km_label", "5km 이내 아울렛/몰")}</div>
      <div class='popResult'>${OutletMall_5km}</div>
    </div>
  `;
  // 대형마트
  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_infra_child' type='checkbox' id='check_mart' checked></div>
      <div class='popContent'>${t("ui.report.mart_1km_label", "1km 이내 대형마트")}</div>
      <div class='popResult'>${bigMart_1km}</div>
    </div>
  `;
  // 상권
  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_infra_child' type='checkbox' id='check_market' checked></div>
      <div class='popContent'>${t("ui.report.market_300m_label", "300m 이내 상권")}</div>
      <div class='popResult'>${market_infra}</div>
    </div>
  `;
  // 은행
  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_infra_child' type='checkbox' id='check_bank'></div>
      <div class='popContent'>${t("ui.report.bank_500m_label", "500m 이내 은행")}</div>
      <div class='popResult'>${bank_500m}</div>
    </div>
  `;
  // 병원
  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_infra_child' type='checkbox' id='check_hospital'></div>
      <div class='popContent'>${t("ui.report.hospital_500m_label", "500m 이내 병원")}</div>
      <div class='popResult'>${hospital_500m}</div>
    </div>
  `;
  // 대형병원
  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_infra_child' type='checkbox' id='check_big_hospital' checked></div>
      <div class='popContent'>${t("ui.report.big_hospital_5km_label", "5km 이내 대형병원")}</div>
      <div class='popResult'>${bigHospital_5km}</div>
    </div>
  `;
  // 공원
  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_infra_child' type='checkbox' id='check_park'></div>
      <div class='popContent'>${t("ui.report.park_500m_label", "500m 이내 공원")}</div>
      <div class='popResult'>${park_500m}</div>
    </div>
  `;
  // 대형공원
  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_infra_child' type='checkbox' id='check_big_park'></div>
      <div class='popContent'>${t("ui.report.big_park_1km_label", "1km 이내 대형공원")}</div>
      <div class='popResult'>${big_park_1km}</div>
    </div>
  `;
  // 혐오시설
  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_infra_child' type='checkbox' id='check_harmful'></div>
      <div class='popContent'>${t("ui.report.harmful_3km_label", "3km 이내 혐오시설")}</div>
      <div class='popResult'>${harmful_3km}</div>
    </div>
  `;
  detailHtml += "<div class='comment2'>" + t("ui.report.infra_guide_with_market", "인프라 정보는 각 백화점/마트 홈페이지, 은행연합회, 자원순환정보시스템, 공공데이터 포탈의 정보를 기반으로 산정되며, 상권은 호갱노노 정보를 사용합니다.") + "</div>";
  detailHtml += "</div></div></div></div>";

  // 2-4. 교육 카드
  detailHtml += "<div class='card mobile_card'>";
  detailHtml += "<div class='card-header'>";
  if (isMobileView) {
    detailHtml += "<div class='popTitle_mobile'>";
    detailHtml += "<div><i class='fas fa-graduation-cap'></i></div>";
    detailHtml += "<div>" + t("ui.report.education", "교육") + "</div>";
    detailHtml += "<div class='graph' style='height: 30px; width:" + chartWidth + "px'> <canvas id='radar_eduChart'></canvas></div>";
    detailHtml += "</div>";
  } else {
    detailHtml += "<div class='popTitleRadar'><div><input class='form-check-input check-facility' type='checkbox' id='check_edu' checked></div>" + t("ui.report.education", "교육") + "</div>";
  }
  detailHtml += "</div>";
  detailHtml += "<div class='card-body'>";
  detailHtml += "<div id='popEducation'>";
  if (!isMobileView) {
    detailHtml += "<div class='graph' style='height: 56px'> <canvas id='radar_eduChart'></canvas></div>";
  }
  detailHtml += "<div class='popTable'>";

  var minDistance = (pSchool_distance - 100 < 0) ? parseInt(pSchool_distance * 0.8) : parseInt(pSchool_distance - 100);
  var maxDistance = parseInt(pSchool_distance);

  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_edu_child' type='checkbox' id='check_pSchool' checked></div>
      <div class='popContent'>${t("ui.report.pSchool_distance_label", "초등학교 거리")}</div>
      <div class='popResult'>${minDistance.toLocaleString() + "~" + maxDistance.toLocaleString()}m</div>
    </div>
  `;

  var pSchool_edu_result = "";
  if (pSchool_edu > 95 && pSchool_edu <= 100) {
    pSchool_edu_result = t("ui.report.transfer_in_heavy", "많은 전입");
  } else if (pSchool_edu >= 92 && pSchool_edu <= 95) {
    pSchool_edu_result = t("ui.report.transfer_in_light", "적은 전입");
  } else if (pSchool_edu >= 88 && pSchool_edu < 92) {
    pSchool_edu_result = t("ui.report.transfer_neutral", "전입/전출 적음");
  } else if (pSchool_edu >= 85 && pSchool_edu < 88) {
    pSchool_edu_result = t("ui.report.transfer_out_light", "적은 전출");
  } else {
    pSchool_edu_result = t("ui.report.transfer_out_heavy", "많은 전출");
  }
  detailHtml += "<div class='popSubTableRadar'><div></div><div class='popContent'>" + t("ui.report.pSchool_change_label", "초등학교 학생증감") + "</div>" + "<div class='popResult'>" + pSchool_edu_result + "</div></div>";

  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_edu_child' type='checkbox' id='check_mSchool' checked></div>
      <div class='popContent'>${t("ui.report.mSchool_achievement_label", "중학교 보통 학력 이상")}</div>
      <div class='popResult'>${mSchool_edu}</div>
    </div>
  `;

  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_edu_child' type='checkbox' id='check_academy' checked></div>
      <div class='popContent'>${t("ui.academies_300m", "300m 이내 학원가")}</div>
      <div class='popResult'>${academy_edu}</div>
    </div>
  `;
  detailHtml += "<div class='popSubTableRadar'><div></div><div class='popContent'>" + t("ui.academies_1km", "1km 이내 학원가") + "</div>" + "<div class='popResult'>" + academy_edu_long + "</div></div>";

  detailHtml += `
    <div class='popSubTableRadar'>
      <div><input class='form-check-input check-facility check_edu_child' type='checkbox' id='check_drink'></div>
      <div class='popContent'>${t("ui.harmful_facility_300m", "300m 이내 유흥시설/모텔")}</div>
      <div class='popResult'>${(drink_pub + daran_pub + motel) + tCountSuffix}</div>
    </div>
  `;

  detailHtml += "<div class='comment2'>" + t("ui.report.edu_guide_with_academy_and_harmful", "교육 정보는 교육통계서비스 정보를 기반으로 산정되며,<br>학원가는 호갱노노의 정보를 사용합니다.<br>초등학교까지의 거리는 직선거리로 계산됩니다.<br>유흥시설과 모텔정보는 교육 감점요소로 적용됩니다.") + "</div>";
  detailHtml += "</div></div></div></div>";

  // 2-5. 주거 카드
  detailHtml += "<div class='card mobile_card'>";
  detailHtml += "<div class='card-header'>";
  if (isMobileView) {
    detailHtml += "<div class='popTitle_mobile'>";
    detailHtml += "<div><i class='fa-solid fa-house-user'></i></div>";
    detailHtml += "<div>" + t("ui.report.living", "주거") + "</div>";
    detailHtml += "<div class='graph' style='height: 30px; width:" + chartWidth + "px'> <canvas id='radar_livingChart'></canvas></div>";
    detailHtml += "</div>";
  } else {
    detailHtml += "<div class='popTitle'>" + t("ui.report.living", "주거") + "</div>";
  }
  detailHtml += "</div>";
  detailHtml += "<div class='card-body'>";
  detailHtml += "<div id='popLiving'>";
  if (!isMobileView) {
    detailHtml += "<div class='graph' style='height: 56px'> <canvas id='radar_livingChart'></canvas></div>";
  }

  if (apt_type == "분양(예정)") {
    detailHtml += "<div class='comment'>" + t("ui.report.pending_comment", "'미정' 항목이 있는 경우 평균치로 대체되어 계산되며,<br>향후 정보 업데이트에 따라 점수가 변경될 수 있습니다.") + "</div><hr>";
  }
  if (apt_type == "재건축") {
    detailHtml += "<div class='comment'>" + t("ui.report.rebuild_comment", "재건축의 경우, 향후 신축이 될 가능성을 고려하여<br>용적률과 건폐율로 주거 점수를 계산합니다.") + "</div><hr>";
  }

  detailHtml += "<div class='popTable'>";
  if (aptData["한강"] > 0) {
    detailHtml += "<div class='popSubTable'><div class='popContent'>" + (isEn ? "Han River Premium" : "한강 프리미엄") + "</div>" + "<div class='popResult'>" + t("ui.report.premium_applied", "적용") + "</div></div>";
  }
  if (aptData["해운대"] > 0) {
    detailHtml += "<div class='popSubTable'><div class='popContent'>" + (isEn ? "Haeundae Premium" : "해운대 프리미엄") + "</div>" + "<div class='popResult'>" + t("ui.report.premium_applied", "적용") + "</div></div>";
  }

  if (house_num != null) {
    detailHtml += "<div class='popSubTable'><div class='popContent'>" + t("ui.report.house_num_label", "세대수") + "</div>" + "<div class='popResult'>" + Number(house_num).toLocaleString() + t("ui.report.house_num_unit", "세대") + "</div></div>";
  } else {
    detailHtml += "<div class='popSubTable'><div class='popContent'>" + t("ui.report.house_num_label", "세대수") + "</div>" + "<div class='popResult'>" + t("ui.report.undetermined", "미정") + "</div></div>";
  }
  if (apt_type >= "재건축") {
    detailHtml += "<div class='popSubTable'><div class='popContent'>" + t("ui.report.floor_rate_label", "용적률") + "</div>" + "<div class='popResult'>" + floor_rate + "</div></div>";
    detailHtml += "<div class='popSubTable'><div class='popContent'>" + t("ui.report.cover_rate_label", "건폐율") + "</div>" + "<div class='popResult'>" + cover_rate + "</div></div>";
  }
  detailHtml += "<div class='popSubTable' id='popSubStation'><div class='popContent'>" + t("ui.report.parking_label", "주차") + "</div>" + "<div class='popResult'>" + parking + "</div></div>";
  detailHtml += "<div class='popSubTable'><div class='popContent'>" + t("ui.report.heating_label", "난방방식") + "</div>" + "<div class='popResult'>" + heating + "</div></div>";
  detailHtml += "<div class='popSubTable'><div class='popContent'>" + t("ui.report.entrance_label", "현관구조") + "</div>" + "<div class='popResult'>" + entrance + "</div></div>";

  var area_array = area_info ? area_info.split(",") : [];
  var maintainance_array = [];
  if (apt_type != "분양(예정)" && area_array.length > 0) {
    if (!maintainance) {
      for (var k = 0; k < area_array.length; k++) { maintainance_array.push(""); }
    } else {
      maintainance_array = maintainance.split(",");
    }

    var rooms_array = rooms ? rooms.split(",") : [];
    var baths_array = baths ? baths.split(",") : [];
    detailHtml += "<div class='table-responsive' style='max-height: 200px; overflow-y: scroll'>";
    detailHtml += "<table class='table table-striped' style='font-size:0.8em'>";
    detailHtml += "<thead class='table-light' style='position:sticky ;top: 0'>";
    detailHtml += "<tr>";
    detailHtml += "<th scope='col'>" + t("ui.report.area_label", "평형") + "</th>";
    detailHtml += "<th scope='col'>" + t("ui.report.rooms_baths_label", "방수/욕실수") + "</th>";
    detailHtml += "<th scope='col'>" + t("ui.report.maintenance_label", "평균 관리비") + "</th>";
    detailHtml += "</tr>";
    detailHtml += "</thead>";
    detailHtml += "<tbody>";

    for (var k = 0; k < area_array.length; k++) {
      detailHtml += "<tr>";
      var areaVal = area_array[k];
      if (isEn && areaVal) { areaVal = areaVal.replace(/평/g, "py"); }
      detailHtml += "<td>" + areaVal + "</td>";
      var roomCount = rooms_array[k] ? parseInt(rooms_array[k]) : "--";
      var bathCount = baths_array[k] ? parseInt(baths_array[k]) : "--";
      detailHtml += "<td>" + roomCount + " / " + bathCount + "</td>";

      if (isNaN(maintainance_array[k]) || maintainance_array[k] === "" || maintainance_array[k] == null) {
        detailHtml += "<td>---</td>";
      } else {
        detailHtml += "<td>" + Number(maintainance_array[k]).toLocaleString() + t("ui.report.won_unit", "원") + "</td>";
      }
      detailHtml += "</tr>";
    }
    detailHtml += "</tbody>";
    detailHtml += "</table>";
    detailHtml += "</div>";
  }

  detailHtml += "<div class='comment2'>" + t("ui.report.living_score_guide", "주거총점 계산을 위한 정보는 네이버 부동산으로 취득하며, 세대수/평형/난방방식 등의 항목을 상대점수로 산정합니다.") + "</div>";
  detailHtml += "</div></div></div></div>";

  // 2-6. 실거래가 카드
  var today = new Date();
  var start_date = new Date();
  start_date.setMonth(today.getMonth() - 1);

  var rent_info_array = rent_info ? rent_info.split(",") : [];
  var rent_ratio_array = rent_ratio ? rent_ratio.split(",") : [];

  if (apt_type != "분양(예정)") {
    var sales_info_array = sales_info ? sales_info.split(",") : [];
    var price_per_array = price_per ? price_per.split(",") : [];

    detailHtml += "<div class='card mobile_card'>";
    detailHtml += "<div class='card-header'>";
    detailHtml += "<div class='popTitle'><i class='fa-solid fa-coins'></i>&nbsp&nbsp" + t("ui.report.actual_price_label", "실거래가") + "<span style='font-size: 0.7em; color:#fe4040'>" + t("ui.report.recent_sales_alert", " (최근 1개월내 실거래는 빨간색으로 표시)") + "</span> </div>";
    detailHtml += "</div>";
    detailHtml += "<div class='card-body' style='padding-left: 5px ; padding-right: 5px; padding-top: 5px;'>";
    detailHtml += "<div id='popEducation'>";
    detailHtml += "<div class='popTable'>";
    detailHtml += "<div id='popSubStation' style='grid-template-columns: 0.3fr 1fr; margin-left: 5px ; margin-right: 5px; margin-top: 10px;'>";
    detailHtml += "<div class='popContent'>" + t("ui.report.recent_sales_label", "최근 매매") + "</div>";

    if (isNaN(last_sales_price) || !last_sales_price) {
      detailHtml += "<div class='popResult'>" + t("ui.no_sales_info", "거래 정보 없음") + "</div></div>";
    } else {
      var compare_year = Number(last_sales_date.substr(0, 4));
      var compare_month = Number(last_sales_date.substr(5, 2) - 1);
      var compare_day = Number(last_sales_date.substr(8, 2));
      var compare_date = new Date(compare_year, compare_month, compare_day);

      var areaText = last_sales_area;
      if (isEn && areaText) { areaText = areaText.replace("평", "py"); }
      var formattedLastSalesPrice = isEn ? ((Math.round(Number(last_sales_price) / 100)).toLocaleString() + "M") : ((Math.round(Number(last_sales_price) / 100) / 100) + "억");

      if (compare_date > start_date) {
        detailHtml += "<div class='popResult' style='color: #fe4040'>" + areaText + ", " + formattedLastSalesPrice + ", " + last_sales_date.substr(2) + "</div></div>";
      } else {
        detailHtml += "<div class='popResult'>" + areaText + ", " + formattedLastSalesPrice + ", " + last_sales_date.substr(2) + "</div></div>";
      }
    }
    detailHtml += "<hr>";
    detailHtml += "<table class='table table-striped' style='font-size:0.8em'>";
    detailHtml += "<thead class='table-light'>";
    detailHtml += "<tr>";
    detailHtml += "<th scope='col' style='line-height: 2.9em;'>" + t("ui.report.area_label", "평형") + "</th>";
    detailHtml += "<th scope='col'>" + t("ui.report.sales_price_label", "매매 실거래가") + "<br>" + t("ui.report.rent_price_label", "전세 실거래가") + "</th>";
    detailHtml += "<th scope='col'>" + t("ui.report.price_per_py_label", "평단가") + "<br>" + t("ui.report.rent_ratio_label", "전세가율") + "</th>";
    detailHtml += "</tr>";
    detailHtml += "</thead>";
    detailHtml += "<tbody>";

    for (var k = 0; k < area_array.length; k++) {
      detailHtml += "<tr>";
      var rowArea = area_array[k];
      if (isEn && rowArea) { rowArea = rowArea.replace("평", "py"); }

      if (sales_info_array[k] == "거래 정보 없음" || !sales_info_array[k]) {
        detailHtml += "<td>" + rowArea + "</td>";
        detailHtml += "<td>" + t("ui.report.no_sales_info", "거래 정보 없음") + "<br>";
        if (rent_ratio_array[k] == "정보 없음") {
          detailHtml += t("ui.report.no_sales_info", "거래 정보 없음") + "</td>";
        }
      } else {
        var sales_info_split = sales_info_array[k].split("억");
        var compare_year = Number((sales_info_split[1] || "").substr(2, 4));
        var compare_month = Number((sales_info_split[1] || "").substr(7, 2) - 1);
        var compare_day = Number((sales_info_split[1] || "").substr(10, 2));
        var compare_date = new Date(compare_year, compare_month, compare_day);
        var rent_info_split = (rent_info_array[k] || "").split("억");
        var compare_rent_date = new Date(1970, 0, 1);
        if (rent_info_split[0] != "거래 정보 없음" && rent_info_split[1]) {
          var compare_rent_year = Number(rent_info_split[1].substr(2, 4));
          var compare_rent_month = Number(rent_info_split[1].substr(7, 2) - 1);
          var compare_rent_day = Number(rent_info_split[1].substr(10, 2));
          compare_rent_date = new Date(compare_rent_year, compare_rent_month, compare_rent_day);
        }

        var salesDetails = sales_info_split[1] || "";
        if (isEn && salesDetails) { salesDetails = salesDetails.replace(/층/g, "F"); }
        var salesPriceVal = Number(sales_info_split[0]);
        var formattedSalesPrice = isEn ? ((salesPriceVal * 100).toLocaleString() + "M") : ((Math.round(salesPriceVal * 100) / 100).toFixed(2) + "억");

        if (compare_date > start_date) {
          detailHtml += "<td><span style='color:#fe4040; font-weight:600'>" + rowArea + "</span></td>";
          detailHtml += "<td><span style='color:#fe4040; font-weight:600'>" + formattedSalesPrice + "<span style='font-size: 0.85em'>" + salesDetails + "</span></span><br>";
        } else {
          detailHtml += "<td>" + rowArea + "</td>";
          detailHtml += "<td>" + formattedSalesPrice + "<span style='font-size: 0.85em'>" + salesDetails + "</span><br>";
        }

        var rentDetails = rent_info_split[1] || "";
        if (isEn && rentDetails) { rentDetails = rentDetails.replace(/층/g, "F"); }
        var rentPriceVal = Number(rent_info_split[0]);
        var formattedRentPrice = isEn ? ((rentPriceVal * 100).toLocaleString() + "M") : ((Math.round(rentPriceVal * 100) / 100).toFixed(2) + "억");

        if (compare_rent_date > start_date) {
          if (rent_info_split[0] == "거래 정보 없음" || !rent_info_split[0]) {
            detailHtml += t("ui.report.no_sales_info", "거래 정보 없음") + "</td>";
          } else {
            detailHtml += "<span style='color:#fe4040; font-weight:600'>" + formattedRentPrice + "<span style='font-size: 0.85em'>" + rentDetails + "</span></span></td>";
          }
        } else {
          if (rent_info_split[0] == "거래 정보 없음" || !rent_info_split[0]) {
            detailHtml += t("ui.report.no_sales_info", "거래 정보 없음") + "</td>";
          } else {
            detailHtml += "" + formattedRentPrice + "<span style='font-size: 0.85em'>" + rentDetails + "</span></td>";
          }
        }
      }

      if (price_per_array[k] == "nan" || price_per_array[k] == 0 || !price_per_array[k]) {
        detailHtml += "<td>---<br>";
      } else {
        var intPricePer = parseInt(price_per_array[k]);
        var formattedPricePer = isEn ? ((intPricePer * 10).toLocaleString() + "K") : (intPricePer.toLocaleString() + "만원");

        if (compare_date > start_date) {
          detailHtml += "<td><span style='color:#fe4040; font-weight:600'>" + formattedPricePer + "</span><br>";
        } else {
          detailHtml += "<td>" + formattedPricePer + "<br>";
        }
      }

      if (rent_ratio_array[k] == "정보 없음" || !rent_ratio_array[k]) {
        detailHtml += "---</td>";
      } else {
        var rentRatioVal = (Math.round(Number(rent_ratio_array[k]) * 100) / 100).toFixed(2) + "%";
        if (compare_rent_date > start_date) {
          detailHtml += "<span style='color:#fe4040; font-weight:600'>" + rentRatioVal + "</span></td>";
        } else {
          detailHtml += rentRatioVal + "</td>";
        }
      }
      detailHtml += "</tr>";
    }
    detailHtml += "</tbody>";
    detailHtml += "</table>";
    detailHtml += "<div class='comment2'>&nbsp&nbsp" + t("ui.sales_info_guide", "실거래가 정보는 네이버 부동산으로 취득합니다.") + "</div>";
    detailHtml += "</div></div></div></div>";
  }

  // 2-7. 매매가 변동 (BETA)
  var rawPriceList = normalizeHistoryArray(aptData["sales_history_price"]);
  if (rawPriceList.length > 0 && typeof rawPriceList[0] === 'number') {
    rawPriceList = [rawPriceList];
  } else if (rawPriceList.length > 0) {
    rawPriceList = rawPriceList.map(function(item) {
      if (Array.isArray(item)) return item;
      if (item && typeof item === 'object') return Object.values(item);
      return item;
    });
  }
  var rawDateList = normalizeHistoryArray(aptData["매매실거래날짜목록"]);
  if (rawDateList.length > 0 && Array.isArray(rawDateList[0])) {
    rawDateList = rawDateList[0];
  }
  radar_sales_history_price = rawPriceList;
  radar_sales_history_date = rawDateList;

  if (apt_type != "분양(예정)" && radar_sales_history_price.length > 0 && radar_sales_history_date.length > 0) {
    detailHtml += "<div class='card mobile_card'>";
    detailHtml += "<div class='card-header'>";
    detailHtml += "<div class='popPriceTitle'><i class='fa-solid fa-chart-line'></i>&nbsp&nbsp" + t("ui.price_change_label", "매매가변동") + "<span id='themeLogo'>BETA</span></div>";
    detailHtml += "</div>";
    detailHtml += "<div class='card-body' style='padding-top: 5px; padding-left: 5px; padding-right: 5px;'>";
    detailHtml += "<div class='priceHistoryOption'>";
    detailHtml += "<div style='text-align:left; padding-left:10px'><input type='checkbox' id='radar_showGraph' onChange='radarGraphShowHide(this)' style='width: 0.8em; height: 0.8em'>";
    detailHtml += "<label for='radar_showGraph' style='font-size: 0.85em; padding-left: 3px'>" + t("ui.show_graph_label", "그래프보기") + "</label></div>";
    // 2026-11-07: 실거래가 변동 기간 선택 select 스타일(#radar_pStart, #radar_pEnd) 복구
    detailHtml += "<div style='text-align: right; padding-right: 5px;'><select id='radar_pStart' class='radar-date-select' style='width: 90px; font-size: 0.85em; height: 2em; line-height: 0.85em; text-align: center; text-align-last: center; font-weight: 600; border-radius: 20px; background: #eee; border: 1px solid #ccc; color: black; outline: none;' onChange='radar_price_sDateChange(this.value)'></select> - <select id='radar_pEnd' class='radar-date-select' style='width: 90px; font-size: 0.85em; height: 2em; line-height: 0.85em; text-align: center; text-align-last: center; font-weight: 600; border-radius: 20px; background: #eee; border: 1px solid #ccc; color: black; outline: none;' onChange='radar_price_eDateChange(this.value)'></select></div>";
    detailHtml += "</div>";
    detailHtml += "<div id='popEducation'>";
    detailHtml += "<div class='popTable'>";

    if (area_array.length === 0 && radar_sales_history_price.length > 0) {
      for (var aIdx = 0; aIdx < radar_sales_history_price.length; aIdx++) {
        area_array.push((aIdx + 1) + "타입");
      }
    }

    radar_priceCharts = [];
    for (var p = 0; p < area_array.length; p++) {
      if (!radar_sales_history_price[p]) break;
      var generatedID = "radar_pChart" + p;
      var generated_priceID = "radar_pChange" + p;
      var generated_ratioID = "radar_pRatio" + p;
      var pNumeric = radar_sales_history_price[p].map(function(v) { return Number(v) || 0; });
      var hasPriceHistory = pNumeric.length > 0 && Math.max.apply(Math, pNumeric) > 0;

      detailHtml += "<div class='popSubPriceTable' style='background: #eee'>";
      detailHtml += "<div class='priceResult' style='padding-left: 5px'>" + area_array[p] + "</div>";
      detailHtml += "<div class='popSubPriceTableDetail'>";
      if (hasPriceHistory) {
        detailHtml += "<div class='priceResult' style='text-align: right; padding-right: 4px'><span id=" + generated_priceID + "></span></div>";
        detailHtml += "<div class='priceResult' style='text-align: right; padding-right: 8px'><span id=" + generated_ratioID + "></span></div>";
      } else {
        detailHtml += "<div class='priceResult' style='text-align: right; padding-right: 4px'>" + t("ui.no_sales_info", "거래 정보 없음") + "</div>";
        detailHtml += "<div class='priceResult' style='text-align: right; padding-right: 8px'>( --- , --- )</div>";
      }
      detailHtml += "</div></div>";
      detailHtml += "<div class='priceGraph' style='height: 150px; border-bottom: 1px solid #ddd; display:none;'> <canvas id=" + generatedID + "></canvas></div>";
      radar_priceCharts.push(generatedID);
    }
    detailHtml += "</div></div></div></div>";
  }

  // 2-8. 푸터 영역 (네이버/호갱노노 링크 및 공유 버튼)
  var footerHtml = "";
  footerHtml += "<div class='modal-footer' id='radar_footer' style='display: grid; padding-top: 5px; padding-bottom: 5px; padding-left: 0px; padding-right: 0px; grid-template-columns: 1fr 0.15fr 0.15fr; text-align: center;'>";
  if (apt_type == "분양(예정)") {
    footerHtml += "<div><button type='button' class='goLink_HGNN' onclick='openHGNN(\"" + searchCode + "\")'>" + t("ui.view_hogangnono", "호갱노노 보기") + "</button></div>";
  } else {
    footerHtml += "<div><button type='button' class='goLink' onclick='openNaver(\"" + searchCode + "\")'>" + t("ui.view_naver", "네이버 부동산 보기") + "</button></div>";
  }
  var shareTitle = aptName + " 입지 분석";
  var shareText = aptName + "의 입지 분석 결과 (가치총점: " + aptValue + "점)";
  var shareURL = "https://www.realrankus.com/radarMap.html?code=" + searchCode;
  var kakaoShareURL = shareURL;
  var popMsg = "클립보드에 복사되었습니다.";

  if (typeof checkMobile === 'function' && checkMobile() == "ios") {
    footerHtml += "<div class='tShare' onClick='CopyToClipboard(\"" + shareText + "\", \"" + popMsg + "\")'><i class='fa-regular fa-copy'></i></div>";
  } else {
    footerHtml += "<div class='kakaoShare' onClick='if(typeof kakaoShare===\"function\") kakaoShare(\"" + shareTitle + "\", \"" + shareText + "\", \"" + kakaoShareURL + "\")'><img src='./kakao_icon.png' height='32px'></div>";
  }
  footerHtml += "<div class='tShare' onClick='if(typeof share===\"function\") share(\"" + shareTitle + "\", \"" + shareText + "\", \"" + shareURL + "\")'><i class='fa-solid fa-arrow-up-right-from-square'></i></div>";
  footerHtml += "</div>";

  detailHtml += footerHtml;

  // 2026-11-07: 데스크톱/모바일 DOM 렌더링 및 레이아웃 제어
  $list.html(detailHtml);

  if (!isMobileView) {
    // 2026-11-07: 데스크톱 화면 스타일링 (radarMap.html 100% 동일)
    $list.css({
      'padding-top': '55px',
      'padding-left': '10px',
      'padding-right': '10px',
      'padding-bottom': '5px',
      'background-color': '#ffffff'
    });
    $listWrapper.css({
      'height': window.innerHeight + 'px',
      'position': 'relative',
      'top': '0px',
      'background-color': '#ffffff',
      'box-shadow': 'none',
      'border-radius': '0px',
      'overflow-y': 'auto',
      'z-index': 'auto',
      'display': 'block'
    });
    $("#titleBar_radar").show().css({ 'z-index': 1000 });
    $("#apt_info").show();
    $("#visit_like_card").show();
    $(".priceGraph").show();
    if (stationArea != undefined && stationArea !== "") {
      $(".complex_like").css({ 'grid-template-columns': '1fr 1fr 1fr 1fr' });
    } else {
      $(".complex_like").css({ 'grid-template-columns': '1fr 1fr 1fr' });
    }
    // 2026-11-07: 데스크톱 #visit_like_card 상단 #complex_visit_info 방문자 카운트 집계 및 텍스트 갱신 복원
    updateRadarComplexVisitInfo(searchCode, aptData["법정동주소"], isEn);
    syncRadarCaptureButtonPosition(false);
  } else {
    // 2026-11-07: 모바일 및 모달 바텀시트 화면 스타일링 (radarMap.html isMobile=true 100% 동일)
    radar_info_pos = window.innerHeight * 2 / 3 + 10;
    radar_info_size = window.innerHeight * 1 / 3;
    isRadarDown = false;

    $list.css({
      'background-color': '#ffffff',
      'padding': '0px'
    });
    $listWrapper.css({
      'position': 'fixed',
      'top': radar_info_pos + 'px',
      'height': radar_info_size + 'px',
      'width': '100%',
      'background-color': 'rgba(255, 255, 255, 0)',
      'box-shadow': 'rgba(0, 0, 0, 0.06) 0px -6px 6px, rgba(0, 0, 0, 0.12) 0px -4px 4px',
      'border-top-left-radius': '10px',
      'border-top-right-radius': '10px',
      'font-size': '0.9em',
      'overflow-y': 'auto',
      'z-index': 100000,
      'display': 'block'
    });
    $("#titleBar_radar").hide();
    $(".priceGraph").hide();
    syncRadarCaptureButtonPosition(true, radar_info_pos);
  }

  $(".mobile_card").css({ 'margin-left': '5px', 'margin-right': '5px' });
  $(".popSubPriceTable").css({ "margin-top": "3px", "margin-bottom": "0px" });

  // 날짜 옵션 셀렉트박스 구성
  if (radar_sales_history_date.length > 1) {
    var price_sOption = "";
    var price_eOption = "";
    for (var w = 0; w < radar_sales_history_date.length - 1; w++) {
      price_sOption += "<option value='" + w + "'>" + radarFormatOptionDate(radar_sales_history_date[w]) + "</option>";
    }
    for (var w = 1; w < radar_sales_history_date.length; w++) {
      price_eOption += "<option value='" + w + "'>" + radarFormatOptionDate(radar_sales_history_date[w]) + "</option>";
    }
    var defaultStart = radar_sales_history_date.length > 30 ? 30 : Math.max(0, radar_sales_history_date.length - 2);
    $("#radar_pStart").html(price_sOption).val(defaultStart).prop("selected", true);
    $("#radar_pEnd").html(price_eOption).val(radar_sales_history_date.length - 1).prop("selected", true);
  }

  // 3. 네이버 지도 초기화 및 마커 렌더링
  initRadarModalMap(aptData);

  // 4. 점수 바/트랙 차트 렌더링 (지연 호출로 레이아웃 보장)
  setTimeout(function () {
    if (!isMobileView && typeof setComplexLike === 'function') {
      setComplexLike(searchCode.toString(), aptName);
    }
    var scoreColor = (typeof SCORE_CHART_COLOR !== 'undefined') ? SCORE_CHART_COLOR : "#e43b46";
    if (!isMobileView && typeof drawRadarChart === 'function') {
      drawRadarChart(livingScore, t("ui.living_score_label", "주거총점"), scoreColor, "radar_livingChart");
      if (stationArea != undefined && stationArea !== "") {
        drawRadarChart(transportScore, t("ui.transport_score_label", "교통총점"), scoreColor, "radar_transportChart");
      }
      drawRadarChart(infraScore, t("ui.infra_score_label", "인프라총점"), scoreColor, "radar_infraChart");
      drawRadarChart(eduScore, t("ui.edu_score_label", "교육총점"), scoreColor, "radar_eduChart");
    } else if (typeof drawRadarChart_mobile === 'function') {
      drawRadarChart_mobile(livingScore, t("ui.living_score_label", "주거총점"), scoreColor, "radar_livingChart");
      if (stationArea != undefined && stationArea !== "") {
        drawRadarChart_mobile(transportScore, t("ui.transport_score_label", "교통총점"), scoreColor, "radar_transportChart");
      }
      drawRadarChart_mobile(infraScore, t("ui.infra_score_label", "인프라총점"), scoreColor, "radar_infraChart");
      drawRadarChart_mobile(eduScore, t("ui.edu_score_label", "교육총점"), scoreColor, "radar_eduChart");
    }

    if (apt_type != "분양(예정)" && radar_sales_history_date.length > 0 && radar_priceCharts.length > 0) {
      radarPriceChartDraw(radar_priceCharts, radar_sales_history_price, radar_sales_history_date, 0, radar_sales_history_date.length);
      radar_price_sDateChange($("#radar_pStart").val());
    }

    // 2026-11-07: 렌더링 완료 후 로딩 오버레이 350ms fadeOut
    $("#pageLoadingBack").fadeOut(350, function () {
      $(this).remove();
    });
  }, 250);
}

/**
 * @function initRadarModalMap
 * @description map_control_radar.js의 마커와 원, 라인 및 폴리곤을 100% 동일하게 렌더링
 */
function initRadarModalMap(aptData) {
  var tSafe = (typeof window.tSafe === 'function') ? window.tSafe : function (k, d) { return d; };
  var isEn = (typeof LANG !== 'undefined' && LANG === 'en') || (sessionStorage.getItem('LANG') === 'en');

  var loc_x = Number(aptData["X"]);
  var loc_y = Number(aptData["Y"]);
  var center = new naver.maps.LatLng(loc_y, loc_x);
  // 2026-11-07: 현재 단지 중심 좌표 전역 캐싱 (캡처 벡터 오버레이 렌더링 지원)
  window.currentRadarCenter = center;

  var icon_size_width = 50;
  var icon_size_height = 50;
  var icon_size_width_small = 40;
  var icon_size_height_small = 40;
  var APT_marker_size_width = 70;
  var APT_marker_size_height = 70;
  var stroke_width = "6px";

  // 2026-11-07: 데스크톱 독립 뷰 여부에 따른 지도 크기 동적 계산 (radarMap.html 500px 그리드 대응)
  var isStandalonePage = ($("#radarContainer").length > 0) || ($("#radarCenterBox").length > 0) || (!$("#radarModal").length || !$("#radarModal").is(":visible"));
  var isDesktopLayout = (typeof isMobile !== 'undefined' ? !isMobile : true) && window.innerWidth >= 768;
  var mapW = (isStandalonePage && isDesktopLayout) ? (window.innerWidth - 500) : window.innerWidth;
  var mapH = window.innerHeight;

  var MapOptions = {
    center: center,
    size: new naver.maps.Size(mapW, mapH),
    zoom: 16,
    minZoom: 12,
    zoomControl: true,
    zoomControlOptions: {
      style: naver.maps.ZoomControlStyle.SMALL,
      position: naver.maps.Position.TOP_RIGHT
    },
    draggable: true,
    pinchZoom: true,
    scrollWheel: true,
    keyboardShortcuts: true,
    disableDoubleTapZoom: true,
    disableDoubleClickZoom: true,
    disableTwoFingerTapZoom: true,
    background: '#ffffff'
  };

  var mapTarget = document.getElementById("radarDataMap") || document.getElementById("dataMap");
  if (!mapTarget) return;

  if (radarMapInstance && typeof radarMapInstance.destroy === 'function') {
    radarMapInstance.destroy();
    radarMapInstance = null;
  }
  // 2026-11-07: 드래그 시 하위 지도와의 그래픽 간섭 및 깜빡임 방지 (흰색 불투명 배경 + GPU 가속 레이어 지정)
  $(mapTarget).empty().css({
    'background-color': '#ffffff',
    '-webkit-transform': 'translate3d(0, 0, 0)',
    'transform': 'translate3d(0, 0, 0)',
    '-webkit-backface-visibility': 'hidden',
    'backface-visibility': 'hidden',
    'will-change': 'transform'
  });

  // 2026-11-07: 플로팅 캡처 버튼 위치 동기화 (모바일 바텀시트 바깥 우측 상단 / 데스크톱 우측 하단)
  var isModalOrMobile = ($("#radarModal").length > 0 && $("#radarModal").is(":visible")) || !isDesktopLayout;
  syncRadarCaptureButtonPosition(isModalOrMobile, radar_info_pos);

  radarMapInstance = new naver.maps.Map(mapTarget, MapOptions);
  var map = radarMapInstance;

  // 2026-11-07: 지도 오버레이 픽셀 좌표 정밀 변환을 위한 프로젝션 헬퍼
  window.radarProjectionHelper = new naver.maps.OverlayView();
  window.radarProjectionHelper.onAdd = function () {};
  window.radarProjectionHelper.draw = function () {};
  window.radarProjectionHelper.setMap(radarMapInstance);

  // 2026-11-07: 데스크톱 창 크기 변경 시 지도 크기 자동 리사이징
  if (isStandalonePage && isDesktopLayout) {
    $(window).off("resize.radarStandalone").on("resize.radarStandalone", function () {
      clearTimeout(window.radarResizeTimer);
      window.radarResizeTimer = setTimeout(function () {
        var nw = window.innerWidth - 500;
        var nh = window.innerHeight;
        if (radarMapInstance && typeof radarMapInstance.setSize === 'function') {
          radarMapInstance.setSize(new naver.maps.Size(nw, nh));
        }
        var $lw = $("#radarDataList_wrapper").length ? $("#radarDataList_wrapper") : $("#dataList_wrapper");
        $lw.css({ 'height': nh + 'px' });
      }, 50);
    });
  }

  // 동심원 (250, 500, 1000, 3000, 5000m)
  var radii = [250, 500, 1000, 3000, 5000];
  var colors = ['#E43B46', '#E43B46', '#E43B46', '#E43B46', '#E43B46'];
  radar_circles = [];
  radar_distance_markers = [];

  radii.forEach(function (radius, index) {
    var circle = new naver.maps.Circle({
      map: map,
      center: center,
      radius: radius,
      strokeColor: colors[index % colors.length],
      strokeOpacity: 0.4,
      strokeWeight: 1,
      fillColor: colors[index % colors.length],
      fillOpacity: 0.0
    });
    radar_circles.push(circle);

    var directions = ['N', 'S', 'E', 'W'];
    directions.forEach(function (dir) {
      var pos = radarMoveLatLng(center, radius, dir);
      var radius_str = radius >= 1000 ? (radius / 1000).toFixed(0) + "km" : radius + "m";
      var add_class = "radius_" + radius_str;
      var distMarker = new naver.maps.Marker({
        position: pos,
        map: map,
        icon: {
          content: "<div class='distance_index " + add_class + "'>" + radius_str + "</div>",
          anchor: new naver.maps.Point(12, 12)
        }
      });
      radar_distance_markers.push(distMarker);
    });
  });

  // 2026-11-07: 모든 반경원(250m, 500m, 1km, 3km, 5km) 및 마커 활성화
  $(".radius_250m, .radius_500m, .radius_1km, .radius_3km, .radius_5km").show();

  // 단지 메인 마커 (map_control_radar.js createAPTMarker 100% 동일)
  var aptValue = Math.round((Number(aptData["가치 총점"]) || 0) * 100) / 100;
  var complex_grade = (typeof setGrade === 'function') ? setGrade(aptValue) : (aptValue >= 70 ? "S" : (aptValue >= 55 ? "A" : (aptValue >= 40 ? "B" : "C")));

  var last_sales_raw = aptData["last_sales"] || "";
  var last_sales_price_kor = "";
  var last_sales_area_kor = "";

  if (last_sales_raw == "BYG") {
    last_sales_price_kor = "분양";
    last_sales_area_kor = "";
  } else {
    var last_sales_split = last_sales_raw.split(",");
    var last_sales_price = last_sales_split[1] ? last_sales_split[1].toString() : "";
    var last_sales_area = last_sales_split[2] || "";

    if (isNaN(last_sales_price) || !last_sales_price) {
      last_sales_price_kor = "정보없음";
      last_sales_area_kor = "--";
    } else {
      last_sales_price_kor = (Math.round(Number(last_sales_price) / 100) / 100) + "억";
      last_sales_area_kor = last_sales_area;
      if (isEn) {
        last_sales_price_kor = Math.round(Number(last_sales_price) / 100) + "M";
        last_sales_area_kor = last_sales_area.replace("평", "py");
      }
    }
  }

  var svg_color = "#CC0000";
  var grade = "gradeC";
  if (aptValue >= 78.6962) {
    svg_color = "#a70000";
    grade = "gradeS";
  } else if (aptValue >= 53.3691) {
    svg_color = "#F72020";
    grade = "gradeA";
  } else if (aptValue >= 31.9721) {
    svg_color = "#F36637";
    grade = "gradeB";
  } else {
    svg_color = "#ED8618";
    grade = "gradeC";
  }

  var large_marker_size = 40;
  var large_marker_id = 'large_marker_' + (aptData['검색코드'] || '');
  var sPrice_marker_id = 'sPrice_' + (aptData['검색코드'] || '');
  var area_marker_id = 'area_' + (aptData['검색코드'] || '');

  var svg_loc_large = `
    <svg version="1.1" class='large_marker ${grade}' id="${large_marker_id}" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
        viewBox="0 0 ${large_marker_size} ${large_marker_size}" xml:space="preserve" width="${APT_marker_size_width}" height="${APT_marker_size_height}">
    <defs>
    <style>
    .${grade}{fill:${svg_color}}
    .large_marker_${grade} {stroke:${svg_color}; stroke-width:0.5;}
    .cls-2{fill:#fff;}
    .cls-3_text{fill:#fff; font-size:8px; font-weight:600}
    .cls-4_text{fill:#000; font-size:7px; font-weight:600}
    .cls-5_text{fill:#000; font-size:5px; font-weight:600}
    </style>
    <filter id="shadow" x="0%" y="0%" width="200%" height="200%">
      <feDropShadow dx="4" dy="8" stdDeviation="2" flood-color="rgba(0,0,0,0.4)" />
    </filter>
    </defs>
    <g class="svg_loc_large">
    <path class="cls-1 large_marker_${grade}" filter="url(#shadow)" d="M.12,12.29V8.81A.88.88,0,0,1,.55,8L15.31.47a3.07,3.07,0,0,1,2.83,0L33,8a.85.85,0,0,1,.43.77v3.48Z"/>
    <path class="cls-2 large_marker_${grade}" filter="url(#shadow)" d="M.13,12.29V26.36c0,1.37.63,2.47,1.4,2.47H3.36L4.52,31l1.16,2.15L6.84,31,8,28.83H32.06c.78,0,1.41-1.1,1.41-2.47V12.29Z"/>
    <text class="cls-3_text" text-anchor="middle" x="16.5" y="10">${complex_grade}</text>
    <text class="cls-4_text" id="${sPrice_marker_id}" text-anchor="middle" x="17" y="20">${last_sales_price_kor}</text>
    <text class="cls-5_text" id="${area_marker_id}" text-anchor="middle" x="17" y="26">${last_sales_area_kor}</text>
    </g>
    </svg>
  `;

  new naver.maps.Marker({
    position: center,
    icon: {
      content: svg_loc_large,
      size: new naver.maps.Size(24, 37),
      anchor: new naver.maps.Point(10, 68),
      origin: new naver.maps.Point(loc_y, loc_x),
    },
    zIndex: 1000,
    map: map,
    loc_name: aptData['아파트명']
  });

  // 지하철역 마커 (createMetroMarker)
  if (aptData["역세권여부"] != undefined && aptData["역세권여부"] != "" && aptData["역지점좌표"]) {
    var metro_coordi_x = aptData["역지점좌표"][1];
    var metro_coordi_y = aptData["역지점좌표"][0];
    var metro_name = (isEn && aptData["closest_station"]) ? aptData["closest_station"] : (aptData["가까운역이름"] || "");

    var metro_svg = `
      <svg version="1.1" class='trans_marker metro_station' xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
        viewBox="-10 -10 120 180" xml:space="preserve" width="${icon_size_width}" height="${icon_size_height}">
      <defs>
      <style>
      .metro_1{fill:${radarColorCode['지하철역']}; stroke:#ffffff; stroke-miterlimit:10; stroke-width:${stroke_width};}
      .metro_2{fill:none;}
      .metro_3{fill:#fff;}
      </style>
      </defs>
      <path class="metro_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
      <polygon class="metro_2" points="54.68 82.67 51.61 87.14 82.28 87.14 79.21 82.67 54.68 82.67"/>
      <path class="metro_3" d="M97.59,87.14H88.38l-3.07-4.47h7.3a4.86,4.86,0,0,0,5-4.72V24.53a4.71,4.71,0,0,0-2.87-4.27Q66.95,8,39.16,20.26a4.71,4.71,0,0,0-2.87,4.27V78a4.86,4.86,0,0,0,5,4.72h6.28l-3.07,4.47h-8.2a2.73,2.73,0,0,0,0,5.45h4.46L37.6,97.17a2.73,2.73,0,0,0,4.5,3.09l5.26-7.67H85.5l5.26,7.67a2.73,2.73,0,0,0,4.5-3.09l-3.14-4.58h5.47a2.73,2.73,0,0,0,0-5.45ZM55.5,21.07a1.23,1.23,0,0,1,1.23-1.23H77.16a1.23,1.23,0,0,1,1.23,1.23v3.54a1.23,1.23,0,0,1-1.23,1.23H56.73a1.23,1.23,0,0,1-1.23-1.23ZM43.65,34.78a3.5,3.5,0,0,1,3.5-3.49h39.6a3.49,3.49,0,0,1,3.49,3.49V49.59a3.49,3.49,0,0,1-3.49,3.49H47.15a3.5,3.5,0,0,1-3.5-3.49Zm0,35a5.63,5.63,0,1,1,5.63,5.63A5.63,5.63,0,0,1,43.65,69.77ZM51.1,87.14l3.07-4.47H78.7l3.07,4.47ZM79,69.77a5.63,5.63,0,1,1,5.63,5.63A5.63,5.63,0,0,1,79,69.77Z"/>
      </svg>
    `;

    var metroDestination = new naver.maps.LatLng(Number(metro_coordi_y), Number(metro_coordi_x));

    new naver.maps.Marker({
      position: metroDestination,
      icon: {
        content: metro_svg,
        size: new naver.maps.Size(24, 37),
        anchor: new naver.maps.Point(icon_size_width / 2, icon_size_height / 2),
        origin: new naver.maps.Point(Number(metro_coordi_y), Number(metro_coordi_x)),
      },
      zIndex: 190,
      map: map
    });

    RadarCustomOverlay({
      map: map,
      position: metroDestination,
      name: metro_name + (isEn ? " Station" : "역"),
      class: "trans_marker metro_station"
    });

    radar_metro_line = new naver.maps.Polyline({
      map: map,
      path: [center, metroDestination],
      strokeColor: radarColorCode['지하철역'],
      strokeWeight: 2,
      strokeOpacity: 1,
      strokeStyle: 'shortdash'
    });

    var metro_dist = radar_metro_line.getDistance().toFixed(0) + "m";
    var metro_midpoint = new naver.maps.LatLng((center.lat() + metroDestination.lat()) / 2, (center.lng() + metroDestination.lng()) / 2);

    radar_metroDistanceLabel = new naver.maps.Marker({
      position: metro_midpoint,
      map: map,
      icon: {
        content: "<div class='distance_index trans_marker' style='color:#fff; background:" + radarColorCode['지하철역'] + "'>" + metro_dist + "</div>",
        anchor: new naver.maps.Point(12, 12)
      }
    });
  }

  // 인프라 마커 (createInfraMarker)
  function createFacilityMarker(arr, colorKey, className, svgInner, zIndex, isSmall, nameSuffix) {
    if (!arr) return;
    for (var k in arr) {
      var item = arr[k];
      var name = item[0];
      if (Array.isArray(name)) name = name[0];
      if (nameSuffix) name += nameSuffix;
      var coord = item[1];
      if (!coord || !coord[0] || !coord[1]) continue;

      var cy = Number(coord[0]);
      var cx = Number(coord[1]);
      var w = isSmall ? icon_size_width_small : icon_size_width;
      var h = isSmall ? icon_size_height_small : icon_size_height;

      var svgContent = `
        <svg version="1.1" class='infra_marker ${className}' xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
          viewBox="-10 -10 120 180" xml:space="preserve" width="${w}" height="${h}">
        <defs>
        <style>
        .${className}_1{fill:${radarColorCode[colorKey]}; stroke:#FFFFFF; stroke-miterlimit:10; stroke-width:${stroke_width};}
        .${className}_2{fill:#fff;}
        </style>
        </defs>
        <path class="${className}_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
        ${svgInner}
        </svg>
      `;

      var pos = new naver.maps.LatLng(cy, cx);
      new naver.maps.Marker({
        position: pos,
        icon: {
          content: svgContent,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(w / 2, h / 2),
          origin: new naver.maps.Point(cy, cx)
        },
        zIndex: zIndex || 150,
        map: map
      });

      RadarCustomOverlay({
        map: map,
        position: pos,
        name: name,
        class: "infra_marker " + className
      });
    }
  }

  // 백화점
  var deptSvgInner = `
    <ellipse class="department_store_2" cx="91.59" cy="94.77" rx="8.16" ry="7.35"/>
    <path class="department_store_2" d="M50.46,87.42c-4.51,0-8.16,3.3-8.16,7.35s3.66,7.35,8.16,7.35,8.16-3.3,8.16-7.35C58.78,90.72,55.12,87.42,50.46,87.42Z"/>
    <path class="department_store_2" d="M55.12,68.62H85.68a8.34,8.34,0,0,0,7.18-3.81l14.65-23.72a3.74,3.74,0,0,0,.56-1.78A3.89,3.89,0,0,0,104,35.64H43.13L39.2,28.28H25.82V35.5H34L48.77,63.55l-5.49,9a6.18,6.18,0,0,0-1,3.55c0,4.07,3.66,7.35,8.16,7.35H99.75V76.1H52.29a.91.91,0,0,1-1-.88.84.84,0,0,1,.15-.51ZM88.57,56.39V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Zm-11.16,0V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Zm-11.17,0V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Zm-11.17,0V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Z"/>
  `;
  createFacilityMarker(aptData["백화점정보"], '백화점', 'department_store', deptSvgInner, 180, false);

  // 아울렛몰
  createFacilityMarker(aptData["아울렛몰정보"], '아울렛', 'mall', deptSvgInner, 180, false);

  // 대형마트
  createFacilityMarker(aptData["대형마트정보"], '마트', 'mart', deptSvgInner, 180, false);

  // 상권 (폴리곤 및 마커)
  radar_market_polygons = [];
  var market_arr = aptData["상권좌표"];
  var market_area_arr = aptData["상권영역"];
  if (market_arr && market_area_arr) {
    for (var k in market_arr) {
      var mLocName = tSafe('ui.radar_map.commercial_district', '상권');
      var mCoords = radarConvertToLatLngArray(market_area_arr[k]);
      var mPolygon = radarDrawPolygon(mCoords, { map: map, strokeColor: radarColorCode['상권'], fillColor: radarColorCode['상권'], fillOpacity: 0.2 });
      radar_market_polygons.push(mPolygon);

      var mPos = new naver.maps.LatLng(Number(market_arr[k][0]), Number(market_arr[k][1]));
      var mSvg = `
        <svg version="1.1" class='infra_marker market' xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
          viewBox="-10 -10 120 180" xml:space="preserve" width="${icon_size_width}" height="${icon_size_height}">
        <defs><style>.market_1{fill:${radarColorCode['상권']}; stroke:#FFFFFF; stroke-miterlimit:10; stroke-width:${stroke_width};}.market_2{fill:#fff;}</style></defs>
        <path class="market_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
        <path class="market_2" d="M97.77,71.6A2,2,0,0,0,99.13,71l1.81-1.82a1.92,1.92,0,0,0-2.71-2.71l-1.81,1.81a1.92,1.92,0,0,0,1.35,3.28Z"/>
        <path class="market_2" d="M109.51,47.16l-8.89-20.75a9.57,9.57,0,0,0-8.8-5.8H42.07a9.57,9.57,0,0,0-8.8,5.8L24.38,47.16a1.92,1.92,0,0,0,1.76,2.68h.8v.57a6.77,6.77,0,0,0,2,4.73A6.67,6.67,0,0,0,31,56.57V86.5a5,5,0,0,0,4.83,5l-.72,4.36A1.91,1.91,0,0,0,37,98.12H57a1.94,1.94,0,0,0,1.46-.67,1.88,1.88,0,0,0,.43-1.56l-3.62-22.1a1.92,1.92,0,0,0-1.9-1.61H40.65a1.91,1.91,0,0,0-1.89,1.61L36.47,87.71h-.4a1.21,1.21,0,0,1-1.21-1.21V57.09h1.93a6.64,6.64,0,0,0,4.73-2l0,0,0,0a6.67,6.67,0,0,0,4.73,2h3.17a6.63,6.63,0,0,0,4.72-2l0,0,0,0a6.68,6.68,0,0,0,4.72,2h3.17a6.64,6.64,0,0,0,4.73-2l0,0,0,0a6.64,6.64,0,0,0,4.73,2h3.17a6.72,6.72,0,0,0,4.72-2l0,0,0,0a6.63,6.63,0,0,0,4.72,2h3.17a6.67,6.67,0,0,0,4.73-2l0,0,0,0a6.69,6.69,0,0,0,4.73,2h.23v3.42H93.79a3.38,3.38,0,0,0-3.38,3.38v.55H89.26v-1a3,3,0,0,0-3-3H71.39a3,3,0,0,0-3,3v24H63.32a1.92,1.92,0,0,0,0,3.84h32.8a5,5,0,0,0,5-5V82.21a1.92,1.92,0,0,0-3.84,0V86.3a1.16,1.16,0,0,1-.35.83,1.19,1.19,0,0,1-.86.35H89.26V74.93h1.19a3.37,3.37,0,0,0,3.34,3h10.8A3.39,3.39,0,0,0,108,74.57V63.89a3.38,3.38,0,0,0-3.38-3.38h-3.42V57A6.68,6.68,0,0,0,107,50.41v-.57h.8a1.92,1.92,0,0,0,1.6-.86A2,2,0,0,0,109.51,47.16ZM42.28,76h9.43l3,18.26H39.28Zm48.13-4.93H89.26V68.28h1.15Zm13.72-6.74v9.76H94.25V64.35ZM92.33,46H29.05L36.8,27.93a5.72,5.72,0,0,1,5.27-3.48H91.82a5.72,5.72,0,0,1,5.27,3.48L104.84,46Z"/>
        <path class="market_2" d="M48.81,80.68H45.18a1.92,1.92,0,0,0,0,3.84h3.63a1.92,1.92,0,1,0,0-3.84Z"/>
        <path class="market_2" d="M48.81,85.9H45.18a1.92,1.92,0,0,0,0,3.84h3.63a1.92,1.92,0,1,0,0-3.84Z"/>
        </svg>
      `;
      new naver.maps.Marker({
        position: mPos,
        icon: {
          content: mSvg,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width / 2, icon_size_height / 2),
          origin: new naver.maps.Point(mPos.lat(), mPos.lng())
        },
        zIndex: 150,
        map: map
      });

      RadarCustomOverlay({
        map: map,
        position: mPos,
        name: mLocName,
        class: "infra_marker market"
      });
    }
  }

  // 은행
  var bankSvgInner = `
    <path class="bank_2" d="M74,78.72a.28.28,0,0,0,.53,0l1-5.64H72.83Z"/>
    <path class="bank_2" d="M59.39,78.7a.27.27,0,0,0,.52,0l1.2-5.64H58.45Z"/>
    <polygon class="bank_2" points="66.8 64.08 65.88 70.41 68.2 70.41 66.97 64.08 66.8 64.08"/>
    <path class="bank_2" d="M97.61,61.87A44.14,44.14,0,0,0,83.72,47h0L77.08,42.5c.94-2,3-6.42,5-10.54a6.05,6.05,0,0,0-1.17-6.83,8,8,0,0,0-7.37-2.22l-2.6.51a4.34,4.34,0,0,1-3.23-.62l-2.93-1.95a8.28,8.28,0,0,0-6-1.2l-.62.11a7.61,7.61,0,0,0-4.8,2.89,6.09,6.09,0,0,0-1,5.07L56.12,43l-5.95,4a44.14,44.14,0,0,0-13.89,14.9,38.65,38.65,0,0,0-5,18.83v.91c0,9.79,9,17.75,20,17.75H82.6c11,0,20-8,20-17.75V80.7A38.65,38.65,0,0,0,97.61,61.87Z"/>
  `;
  createFacilityMarker(aptData["은행정보"], '은행', 'bank', bankSvgInner, 100, true);

  // 병원
  var hospSvgInner = `
    <path class="hospital_2" d="M101.44,43.12h-18v-18a1,1,0,0,0-1-1h-31a1,1,0,0,0-1,1v18h-18a1,1,0,0,0-1,1v31a1,1,0,0,0,1,1h18v18a1,1,0,0,0,1,1h31a1,1,0,0,0,1-1v-18h18a1,1,0,0,0,1-1v-31A1,1,0,0,0,101.44,43.12Z"/>
  `;
  createFacilityMarker(aptData["병원정보"], '병원', 'hospital', hospSvgInner, 100, true);

  // 대형병원
  var bigHospSvgInner = `
    <path class="big_hospital_2" d="M100,43.82H82.75V26.58a1,1,0,0,0-1-1H52.1a1,1,0,0,0-1,1V43.82H33.9a1,1,0,0,0-1,1V74.47a1,1,0,0,0,1,1H51.14V92.66a1,1,0,0,0,1,1H81.79a1,1,0,0,0,1-1V75.42H100a1,1,0,0,0,1-1V44.78A1,1,0,0,0,100,43.82Z"/>
  `;
  createFacilityMarker(aptData["종합병원정보"], '대형병원', 'big_hospital', bigHospSvgInner, 160, false);

  // 공원
  var parkSvgInner = `
    <path class="park_2" d="M98.49,25.5a3.66,3.66,0,0,0-2.88-1c-1.5.13-37,3.5-50.65,17.18-12.81,12.82-11.54,29-5.51,37.81L40,80l1.38,1.3c-.33.64-.66,1.28-1,1.93A123.55,123.55,0,0,0,34.5,98.49c-1.15,3.64,4.56,5.2,5.71,1.57A112.46,112.46,0,0,1,46,85.38,26.92,26.92,0,0,0,59.6,88.94,31.88,31.88,0,0,0,82.32,79C96,65.36,99.37,29.87,99.53,28.37A3.62,3.62,0,0,0,98.49,25.5Z"/>
  `;
  createFacilityMarker(aptData["공원정보"], '공원', 'park', parkSvgInner, 100, true);

  // 대형공원
  var bigParkSvgInner = `
    <path class="big_park_2" d="M49.87,16.68A20.75,20.75,0,0,0,29.12,37.43v25.4a20.75,20.75,0,0,0,19,20.67V68.17l-10-10a1.75,1.75,0,0,1,2.48-2.48l7.49,7.49V51.56l-10-10a1.75,1.75,0,0,1,2.48-2.47l7.49,7.49V34.08a1.75,1.75,0,0,1,3.5,0V46.62l7.49-7.5a1.75,1.75,0,0,1,2.48,2.47l-10,10V63.23l7.49-7.5a1.75,1.75,0,0,1,2.48,2.48l-10,10V83.5h0a20.76,20.76,0,0,0,19-20.67V37.43A20.75,20.75,0,0,0,49.87,16.68Z"/>
  `;
  createFacilityMarker(aptData["대형공원정보"], '대형공원', 'big_park', bigParkSvgInner, 160, false);

  // 혐오시설
  var harmfulSvgInner = `
    <path class="harmful_2" d="M97.63,59.21,67.86,29.44a1.28,1.28,0,0,0-1.82,0v0L36.25,59.21a1.3,1.3,0,0,0,0,1.83L66,90.82a1.28,1.28,0,0,0,1.81,0h0L97.63,61A1.29,1.29,0,0,0,97.63,59.21ZM66.94,78.49a3.34,3.34,0,1,1,3.34-3.34A3.33,3.33,0,0,1,66.94,78.49ZM70.28,66.8H63.61L61.94,43.43H72Z"/>
  `;
  createFacilityMarker(aptData["혐오시설정보"], '혐오시설', 'harmful', harmfulSvgInner, 120, true, isEn ? " Facility" : "시설");

  // 교육 마커 (createEduMarker)
  // 초등학교
  if (aptData["초등학교좌표"] && aptData["초등학교명"]) {
    var pSchool_name = (isEn) ? aptData["초등학교명"].replace("초등학교", " Elementary School") : aptData["초등학교명"];
    var pSchoolDestination = new naver.maps.LatLng(Number(aptData["초등학교좌표"][0]), Number(aptData["초등학교좌표"][1]));

    var pSchoolSvg = `
      <svg version="1.1" class='edu_marker pSchool' xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
        viewBox="-10 -10 120 180" xml:space="preserve" width="${icon_size_width}" height="${icon_size_height}">
      <defs><style>.pSchool_1{fill:${radarColorCode['초등학교']}; stroke:#ffffff; stroke-miterlimit:10; stroke-width:${stroke_width};}.pSchool_2{fill:#ffffff;}</style></defs>
      <path class="pSchool_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
      <path class="pSchool_2" d="M104.94,97.12V69.64a6.55,6.55,0,0,0-3.9-5.92l-32.4-15V42.24H94.35a2.93,2.93,0,0,0,3-2.85V22a2.93,2.93,0,0,0-3-2.85H65.21a2.94,2.94,0,0,0-3,2.85V48.76L32,63.68a6.55,6.55,0,0,0-3.74,5.84v27.6H18.94v5h96v-5Zm-19.43-27a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H86.51a1,1,0,0,1-1-1Zm0,15a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H86.51a1,1,0,0,1-1-1Zm-19.41-28a7.19,7.19,0,1,1-7.19,7.18A7.19,7.19,0,0,1,66.1,57.12Zm-29.59,13a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H37.51a1,1,0,0,1-1-1Zm0,15a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H37.51a1,1,0,0,1-1-1Zm19,11v-19a1,1,0,0,1,1-1H75.65a1,1,0,0,1,1,1v19a1,1,0,0,1-1,1H56.54A1,1,0,0,1,55.54,96.12Z"/>
      </svg>
    `;

    new naver.maps.Marker({
      position: pSchoolDestination,
      icon: {
        content: pSchoolSvg,
        size: new naver.maps.Size(24, 37),
        anchor: new naver.maps.Point(icon_size_width / 2, icon_size_height / 2),
        origin: new naver.maps.Point(pSchoolDestination.lat(), pSchoolDestination.lng())
      },
      zIndex: 160,
      map: map
    });

    RadarCustomOverlay({
      map: map,
      position: pSchoolDestination,
      name: pSchool_name,
      class: "edu_marker pSchool"
    });

    radar_pSchool_line = new naver.maps.Polyline({
      map: map,
      path: [center, pSchoolDestination],
      strokeColor: radarColorCode['초등학교'],
      strokeWeight: 2,
      strokeOpacity: 1,
      strokeStyle: 'shortdash'
    });

    var pDist = radar_pSchool_line.getDistance().toFixed(0) + "m";
    var pMidpoint = new naver.maps.LatLng((center.lat() + pSchoolDestination.lat()) / 2, (center.lng() + pSchoolDestination.lng()) / 2);
    radar_pSchoolDistanceLabel = new naver.maps.Marker({
      position: pMidpoint,
      map: map,
      icon: {
        content: "<div class='distance_index edu_marker pSchool' style='color:#fff; background:" + radarColorCode['초등학교'] + "'>" + pDist + "</div>",
        anchor: new naver.maps.Point(12, 12)
      }
    });
  }

  // 중학교
  radar_mSchool_lines = [];
  radar_mSchoolDistanceLabels = [];
  var mSchool_arr = aptData["중학교정보"];
  if (mSchool_arr) {
    for (var k in mSchool_arr) {
      var mSchool_name = mSchool_arr[k]['중학교명'] || mSchool_arr['name'] || "";
      var mCx = Number(mSchool_arr[k]['x'] || (mSchool_arr['yx'] ? mSchool_arr['yx'][1] : 0));
      var mCy = Number(mSchool_arr[k]['y'] || (mSchool_arr['yx'] ? mSchool_arr['yx'][0] : 0));
      if (!mCx || !mCy) continue;
      if (isEn) mSchool_name = mSchool_name.replace("중학교", " Middle School");

      var mDest = new naver.maps.LatLng(mCy, mCx);
      var mSvg = `
        <svg version="1.1" class='edu_marker mSchool' xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
          viewBox="-10 -10 120 180" xml:space="preserve" width="${icon_size_width}" height="${icon_size_height}">
        <defs><style>.mSchool_1{fill:${radarColorCode['중학교']}; stroke:#FFFFFF; stroke-miterlimit:10; stroke-width:${stroke_width};}.mSchool_2{fill:#fff;}</style></defs>
        <path class="mSchool_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
        <path class="mSchool_2" d="M104.94,97.12V69.64a6.55,6.55,0,0,0-3.9-5.92l-32.4-15V42.24H94.35a2.93,2.93,0,0,0,3-2.85V22a2.93,2.93,0,0,0-3-2.85H65.21a2.94,2.94,0,0,0-3,2.85V48.76L32,63.68a6.55,6.55,0,0,0-3.74,5.84v27.6H18.94v5h96v-5Zm-19.43-27a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H86.51a1,1,0,0,1-1-1Zm0,15a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H86.51a1,1,0,0,1-1-1Zm-19.41-28a7.19,7.19,0,1,1-7.19,7.18A7.19,7.19,0,0,1,66.1,57.12Zm-29.59,13a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H37.51a1,1,0,0,1-1-1Zm0,15a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H37.51a1,1,0,0,1-1-1Zm19,11v-19a1,1,0,0,1,1-1H75.65a1,1,0,0,1,1,1v19a1,1,0,0,1-1,1H56.54A1,1,0,0,1,55.54,96.12Z"/>
        </svg>
      `;

      new naver.maps.Marker({
        position: mDest,
        icon: {
          content: mSvg,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width / 2, icon_size_height / 2),
          origin: new naver.maps.Point(mDest.lat(), mDest.lng())
        },
        zIndex: 160,
        map: map
      });

      RadarCustomOverlay({
        map: map,
        position: mDest,
        name: mSchool_name,
        class: "edu_marker mSchool"
      });

      var mLine = new naver.maps.Polyline({
        map: map,
        path: [center, mDest],
        strokeColor: radarColorCode['중학교'],
        strokeWeight: 2,
        strokeOpacity: 1,
        strokeStyle: 'shortdash'
      });
      radar_mSchool_lines.push(mLine);

      var mDist = mLine.getDistance().toFixed(0) + "m";
      var mMidpoint = new naver.maps.LatLng((center.lat() + mDest.lat()) / 2, (center.lng() + mDest.lng()) / 2);
      var mDistMarker = new naver.maps.Marker({
        position: mMidpoint,
        map: map,
        icon: {
          content: "<div class='distance_index edu_marker mSchool' style='color:#fff; background:" + radarColorCode['중학교'] + "'>" + mDist + "</div>",
          anchor: new naver.maps.Point(12, 12)
        }
      });
      radar_mSchoolDistanceLabels.push(mDistMarker);

      if (mSchool_arr.hasOwnProperty('distance')) break;
    }
  }

  // 학원가 (폴리곤 및 마커)
  radar_academy_polygons = [];
  var academy_arr = aptData["학원가좌표_1km"] || aptData["학원가좌표_300m"];
  var academy_area_arr = aptData["학원가영역_1km"] || aptData["학원가영역_300m"];
  if (academy_arr && academy_area_arr) {
    for (var k in academy_arr) {
      var aLocName = tSafe("ui.radar_map.academy_district", "학원가");
      var aCoords = radarConvertToLatLngArray(academy_area_arr[k]);
      var aPolygon = radarDrawPolygon(aCoords, { map: map, strokeColor: radarColorCode['학원가'], fillColor: radarColorCode['학원가'], fillOpacity: 0.2 });
      radar_academy_polygons.push(aPolygon);

      var aPos = new naver.maps.LatLng(Number(academy_arr[k][0]), Number(academy_arr[k][1]));
      var aSvg = `
        <svg version="1.1" class='edu_marker academy' xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
          viewBox="-10 -10 120 180" xml:space="preserve" width="${icon_size_width}" height="${icon_size_height}">
        <defs><style>.academy_1{fill:${radarColorCode['학원가']}; stroke:#FFFFFF; stroke-miterlimit:10; stroke-width:${stroke_width};}.academy_2{fill:#fff;}</style></defs>
        <path class="academy_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
        <path class="academy_2" d="M43.16,42.22H42.8a2.16,2.16,0,0,0,0,4.32h.36a2.16,2.16,0,0,0,0-4.32Z"/>
        <path class="academy_2" d="M49.73,46.54H71.62a2.16,2.16,0,0,0,0-4.32H49.73a2.16,2.16,0,0,0,0,4.32Z"/>
        <path class="academy_2" d="M69,61.23a2.16,2.16,0,0,0-2.16-2.16H48.53a2.16,2.16,0,0,0,0,4.32H66.8A2.16,2.16,0,0,0,69,61.23Z"/>
        <path class="academy_2" d="M63,75.92H54.27a2.16,2.16,0,0,0,0,4.32H63a2.16,2.16,0,1,0,0-4.32Z"/>
        <path class="academy_2" d="M106.39,24.88,93.87,19A2.16,2.16,0,0,0,91,20.09L84.53,34l-3.16-9.3a2.17,2.17,0,0,0-2.05-1.46H36.83a2.16,2.16,0,0,0-1.67.79L26.74,34.34a2.16,2.16,0,0,0-.37,2.06l20.9,61.38a2.15,2.15,0,0,0,2,1.47h54.43a2.58,2.58,0,0,0,.39,0l.12,0,.18-.05.08,0,.17-.08a2.39,2.39,0,0,0,.22-.12l.11-.08a2.11,2.11,0,0,0,.23-.19l.06-.06a2.65,2.65,0,0,0,.21-.26.21.21,0,0,1,0-.06c.06-.1.11-.2.16-.3l0-.07a1.91,1.91,0,0,0,.1-.34.13.13,0,0,0,0-.06,2.21,2.21,0,0,0,0-.37v-.06a2.2,2.2,0,0,0,0-.36s0-.06,0-.09a1.6,1.6,0,0,0,0-.21L93,58.76l14.46-31A2.15,2.15,0,0,0,106.39,24.88ZM89.77,32.62c.55-1.17,2.27-.15,1.73,1-.67,1.42-1.34,2.83-2,4.25q-7,14.88-14,29.75c-.55,1.16-2.27.15-1.73-1q1-2.13,2-4.26Q82.78,47.5,89.77,32.62ZM77.63,77.56l-5,3.4-.61-6Zm23.09,17.37H50.86L31.43,37.87H41.62a2.16,2.16,0,0,0,2-3.07l-3.36-7.27H77.77l4.12,12.09L67.52,70.46a2.09,2.09,0,0,0-.19,1.13h0L68.68,85a2.19,2.19,0,0,0,1.24,1.74,2.23,2.23,0,0,0,.91.2,2.17,2.17,0,0,0,1.22-.38L83.2,79h0a2.17,2.17,0,0,0,.74-.87l6.39-13.7Zm-.09-62.81-8.6-4,2-4.24,8.59,4Z"/>
        </svg>
      `;

      new naver.maps.Marker({
        position: aPos,
        icon: {
          content: aSvg,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width / 2, icon_size_height / 2),
          origin: new naver.maps.Point(aPos.lat(), aPos.lng())
        },
        zIndex: 160,
        map: map
      });

      RadarCustomOverlay({
        map: map,
        position: aPos,
        name: aLocName,
        class: "edu_marker academy"
      });
    }
  }

  // 유흥주점
  var drink_pub_arr = (aptData["유흥주점정보"] || []).concat(aptData["단란주점정보"] || []);
  var pubSvgInner = `
    <path class="drink_2" d="M96.76,54.19,96.64,54a28,28,0,0,1-5.29-16.47V22.74a3.91,3.91,0,0,0-3.72-4.07H82a3.91,3.91,0,0,0-3.71,4.07V37.56A28,28,0,0,1,73,54l-.12.16A31.43,31.43,0,0,0,66.9,72.65V97.5a3.91,3.91,0,0,0,3.73,4.06H99a3.9,3.9,0,0,0,3.71-4.06V72.65A31.43,31.43,0,0,0,96.76,54.19ZM81.15,22.74a.86.86,0,0,1,.81-.9h5.67a.86.86,0,0,1,.82.9v8.58h-7.3ZM69.8,72.65a28.07,28.07,0,0,1,5.3-16.48l.11-.15a31.41,31.41,0,0,0,5.94-18.46V34.49h7.3v3.07A31.42,31.42,0,0,0,94.38,56l.12.16a28.06,28.06,0,0,1,5.29,16.48v2H94.3c0-.26,0-.5,0-.75,0-5.75-4.27-10.43-9.53-10.43s-9.54,4.68-9.54,10.43c0,.25,0,.49,0,.75H69.8Zm0,10.7V76.8h7.77l-.23-1.27a8.48,8.48,0,0,1-.15-1.59c0-4.59,3.42-8.31,7.6-8.31s7.61,3.72,7.61,8.31a8.64,8.64,0,0,1-.15,1.59L92,76.8h7.77v6.55Z"/>
    <path class="drink_2" d="M84.8,67.67a6,6,0,0,0-5.74,6.26,7,7,0,0,0,.11,1.21,5.66,5.66,0,0,0,11.25,0,7.1,7.1,0,0,0,.11-1.22A6,6,0,0,0,84.8,67.67Zm3.72,7.07a3.75,3.75,0,0,1-7.45,0,4.25,4.25,0,0,1-.07-.8,3.81,3.81,0,1,1,7.59,0A4.43,4.43,0,0,1,88.52,74.74Z"/>
    <path class="drink_2" d="M60,38H35.32l-.4.9C33.66,41.74,31.19,51,31.2,59.44c0,9.35,6.62,17.07,15,17.88V91.9l-9.19,6-.12.08a3,3,0,0,0-.91,3.17,2.59,2.59,0,0,0,2.46,1.93H56.86a2.6,2.6,0,0,0,2.46-1.93A3,3,0,0,0,58.41,98L49.09,91.9V77.32c8.4-.81,15-8.51,15-17.88,0-8.09-2.39-17.54-3.73-20.55Zm-4.23,62H39.56l8.08-5.31ZM34.11,58.38a62.4,62.4,0,0,1,3.08-17.22H58.1a65,65,0,0,1,3.07,17.22Z"/>
  `;
  createFacilityMarker(drink_pub_arr, '주점', 'drink', pubSvgInner, 100, true);

  // 모텔
  var motelSvgInner = `
    <path class="motel_2" d="M114.67,53h-7.75a1.55,1.55,0,0,0-1.55,1.55h0V64a10,10,0,0,0-6.94-2.8H55a5.08,5.08,0,0,0,.37-1.88V58a5,5,0,0,0-5-5H35.33a5,5,0,0,0-5,5v1.26a5,5,0,0,0,.74,2.6A10,10,0,0,0,27.86,64V42.26a1.54,1.54,0,0,0-1.55-1.55H19.22a1.54,1.54,0,0,0-1.55,1.55h0V90.57a1.54,1.54,0,0,0,1.55,1.55h7.09a1.54,1.54,0,0,0,1.55-1.55v-7.5h77.51v7.5a1.54,1.54,0,0,0,1.55,1.55h7.75a1.54,1.54,0,0,0,1.55-1.55v-36A1.55,1.55,0,0,0,114.67,53ZM24.76,89h-4V43.81h4Zm8.69-31a1.88,1.88,0,0,1,1.88-1.88H50.41A1.88,1.88,0,0,1,52.29,58v1.26a1.9,1.9,0,0,1-1.88,1.88H35.33a1.89,1.89,0,0,1-1.88-1.88ZM27.86,71.21a6.94,6.94,0,0,1,6.94-6.94H98.43a7,7,0,0,1,6.94,6.94v1.6H27.86ZM113.12,89h-4.65V56.15h4.65Z"/>
  `;
  createFacilityMarker(aptData["모텔정보"], '모텔', 'motel', motelSvgInner, 100, true);

  // 초기 비활성화 카테고리 숨김 (map_control_radar.js 100% 동일)
  $(".bank").hide();
  $(".hospital").hide();
  $(".park").hide();
  $(".harmful").hide();
  $(".drink").hide();
  $(".motel").hide();

  // 모바일 화면: 바텀시트에 가려지지 않도록 지도 중심을 아래로 110px 패닝 (단지 핀이 상단 1/2 영역에 위치)
  map.panBy(new naver.maps.Point(0, 110));

  // 줌 변경 시 동심원 및 거리 인덱스 표시 제어 (2026-11-07: 1km, 3km, 5km 원은 상시 유지)
  naver.maps.Event.addListener(map, 'zoom_changed', function () {
    var curZoom = map.getZoom();
    if (curZoom >= 16) {
      $(".radius_250m").show();
      if (radar_circles[0]) radar_circles[0].setMap(map);
      $(".radius_500m").show();
      if (radar_circles[1]) radar_circles[1].setMap(map);
    }
    if (curZoom == 15) {
      $(".radius_250m").hide();
      if (radar_circles[0]) radar_circles[0].setMap(null);
      $(".radius_500m").show();
      if (radar_circles[1]) radar_circles[1].setMap(map);
    }
    if (curZoom <= 14) {
      $(".radius_250m").hide();
      if (radar_circles[0]) radar_circles[0].setMap(null);
      $(".radius_500m").hide();
      if (radar_circles[1]) radar_circles[1].setMap(null);
    }

    // 1km, 3km, 5km 원 및 텍스트 마커 상시 활성화 유지
    $(".radius_1km, .radius_3km, .radius_5km").show();
    if (radar_circles[2]) radar_circles[2].setMap(map);
    if (radar_circles[3]) radar_circles[3].setMap(map);
    if (radar_circles[4]) radar_circles[4].setMap(map);
  });
}

// 2026-11-07: 입지 분석 지도 및 상단 반투명 요약 카드 이미지 캡처/다운로드 함수
/**
 * @function captureRadarMapView
 * @description 화면에 표시된 네이버 지도 영역과 단지 요약 카드를 고해상도(scale: 2) PNG 이미지로 캡처 및 다운로드합니다.
 * 모바일 환경과 웹(데스크톱) 환경의 레이아웃 차이를 완벽히 인식하여 최적화된 방식으로 캡처합니다:
 * - 모바일 & 웹 공통: 캡처 시 상단 단지 요약 카드의 뒤로가기('<', #iframe_back) 아이콘을 숨기고 좌측 여백 없이 정렬
 * - 웹(데스크톱): 와이드 지도 영역(우측 패널) 전체 100% 캡처 (오른쪽 빈 여백 원천 차단) + 좌측 상단 글래스모피즘 단지 카드
 * - 최하단 z-depth 벡터 언더레이(OverlayView overlayLayer.firstChild + MapCanvasProjection.fromCoordToOffset)를 통해
 *   반경원(250m/500m/1km/3km/5km), 지하철/초·중학교 거리 점선, 상권/학원가 폴리곤을 모든 마커 아래에 오차 없이 합성
 * - 캡처 버튼(price/index.html 동일 Pill UI) 클릭 시 좌측 확장 완료 후 진행률(0%~100%) 표시와 함께 캡처 시작 및 원형 수축 복원
 * - 캡처 직전 아파트 마커(단지 중심점)를 지도 정중앙으로 이동시키고 타일 로드를 대기한 후 캡처하며, 완료 후 원래 중심 복원
 * - 리얼랭커스 상단 타이틀 및 하단 브랜드/캡처일시 워터마크 합성 (저장 완료 토스트 미표시)
 * 파일명: 리얼랭커스_{아파트명}_주변입지환경_{YYYYMMDD}_{HHMMSS}.png
 * 수정일: 2026-11-07
 */
function captureRadarMapView(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (typeof html2canvas === 'undefined') {
    alert("캡처 라이브러리(html2canvas)를 로드 중입니다. 잠시 후 다시 시도해 주세요.");
    return;
  }

  var $btn = $(event ? event.currentTarget : "#radarMapCaptureBtn, #radarModalCaptureBtn");
  if (!$btn.length) {
    $btn = $(".radar-map-floating-capture-btn, .radar-floating-capture-btn");
  }
  if ($btn.length && $btn.data("capturing")) {
    return;
  }

  // 1. 단지명 및 타임스탬프 파일명/워터마크 문자열 생성: 리얼랭커스_{아파트명}_주변입지환경_{YYYYMMDD}_{HHMMSS}.png
  var aptName = "단지";
  if (window.currentRadarAptData && window.currentRadarAptData["아파트명"]) {
    aptName = window.currentRadarAptData["아파트명"];
  } else if ($("#apt_info_mobile .popupTitle").length) {
    aptName = $("#apt_info_mobile .popupTitle").text().split("(")[0].trim();
  } else if ($("#apt_info .popupTitle").length) {
    aptName = $("#apt_info .popupTitle").text().split("(")[0].trim();
  }
  var cleanAptName = aptName.replace(/[\\/:*?"<>|]/g, '').trim() || "단지";
  var now = new Date();
  var pad2 = function (n) { return String(n).padStart(2, '0'); };
  var yyyy = String(now.getFullYear());
  var mm = pad2(now.getMonth() + 1);
  var dd = pad2(now.getDate());
  var hh = pad2(now.getHours());
  var min = pad2(now.getMinutes());
  var ss = pad2(now.getSeconds());
  var dateStr = yyyy + mm + dd;
  var timeStr = hh + min + ss;
  var captureDateTimeStr = yyyy + "-" + mm + "-" + dd + " " + hh + ":" + min + ":" + ss;
  var filename = "리얼랭커스_" + cleanAptName + "_주변입지환경_" + dateStr + "_" + timeStr + ".png";

  // 2. 환경 및 캡처 대상 확인
  var isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  var isDesktop = !isMobileDevice;

  var mapElement = document.getElementById("radarDataMap") || document.getElementById("dataMap");
  var captureTarget = document.getElementById("radarMapCaptureArea") || mapElement;
  if (!captureTarget) {
    alert("캡처할 지도 영역을 찾을 수 없습니다.");
    return;
  }

  // 3. price/index.html 우측 하단 캡처 버튼과 100% 동일한 라운드 박스(Pill) 좌측 확장/수축 애니메이션
  ensureRadarCaptureButtonMarkup($btn);
  var pctEl = $btn.length ? $btn[0].querySelector('.volume-capture-pct') : null;
  if (pctEl) pctEl.textContent = '0%';
  if ($btn.length) {
    $btn.data("capturing", true).addClass("is-capturing");
  }

  var currentPct = 0;
  function updateProgress(pct) {
    currentPct = Math.max(currentPct, Math.min(100, Math.round(pct)));
    if (pctEl) {
      pctEl.textContent = currentPct + "%";
    }
  }

  function finishButtonState() {
    if (!$btn.length) return;
    // 부드러운 원형 원복: .is-capturing 제거로 좌우 자연스럽게 수축 (트랜지션 320ms 완료 대기)
    $btn.removeClass("is-capturing");
    setTimeout(function () {
      if (pctEl) pctEl.textContent = '0%';
      $btn.data("capturing", false);
    }, 340);
  }

  // [버퍼/렉 제거 핵심] 버튼 확장 애니메이션(0.32s)이 완전히 끝나고 "이미지 저장 중 (0%)"가 깔끔하게 안착할 때까지 대기
  setTimeout(function () {
    var raf = window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };
    raf(function () {
      startActualCapture();
    });
  }, 340);

  function startActualCapture() {
    var mapW = (mapElement && mapElement.clientWidth > 50) ? mapElement.clientWidth : (captureTarget.clientWidth > 50 ? captureTarget.clientWidth : (isDesktop ? (window.innerWidth - 500) : window.innerWidth));
    var mapH = (mapElement && mapElement.clientHeight > 50) ? mapElement.clientHeight : (captureTarget.clientHeight > 50 ? captureTarget.clientHeight : window.innerHeight);

    if (!mapH || mapH <= 50) mapH = window.innerHeight || 800;
    if (!mapW || mapW <= 50) mapW = isDesktop ? (window.innerWidth - 500) : (window.innerWidth || 390);

    var origTargetStyle = $(captureTarget).attr("style") || "";
    if (isDesktop) {
      $(captureTarget).css({
        'width': mapW + 'px',
        'height': mapH + 'px',
        'min-height': mapH + 'px',
        'overflow': 'hidden',
        'position': 'relative'
      });
    }

    var progressTimer = setInterval(function () {
      if (currentPct < 85) {
        updateProgress(currentPct + Math.floor(Math.random() * 5) + 3);
      }
    }, 70);

    // 단지 중심점 안전 추출 및 원래 지도 중심 기록
    var aptCenter = window.currentRadarCenter;
    if (!aptCenter && window.currentRadarAptData) {
      var lat = Number(window.currentRadarAptData["Y"] || window.currentRadarAptData["lat"]);
      var lng = Number(window.currentRadarAptData["X"] || window.currentRadarAptData["lng"]);
      if (lat && lng) aptCenter = new naver.maps.LatLng(lat, lng);
    }
    if (!aptCenter && radar_circles.length && radar_circles[0]) {
      aptCenter = radar_circles[0].getCenter();
    }

    var origMapCenter = (radarMapInstance && typeof radarMapInstance.getCenter === 'function')
      ? radarMapInstance.getCenter()
      : null;

    // 5. 아파트 마커를 지도 정중앙으로 이동 후 idle 및 타일 이미지 로딩 완료 대기
    function centerMapAndWaitTiles(done) {
      if (!radarMapInstance || !aptCenter || typeof radarMapInstance.setCenter !== 'function') {
        done();
        return;
      }

      var finished = false;
      var idleListener = null;
      var idleTimer = null;

      function waitTilesThenFinish() {
        if (finished) return;
        finished = true;
        if (idleListener && typeof naver !== 'undefined' && naver.maps && naver.maps.Event) {
          try { naver.maps.Event.removeListener(idleListener); } catch (e) {}
        }
        clearTimeout(idleTimer);

        var startWait = Date.now();
        function checkTiles() {
          var allLoaded = true;
          if (mapElement) {
            var imgs = mapElement.getElementsByTagName('img');
            for (var i = 0; i < imgs.length; i++) {
              if (imgs[i].src && !imgs[i].complete) {
                allLoaded = false;
                break;
              }
            }
          }
          if (allLoaded || (Date.now() - startWait) > 800) {
            setTimeout(done, 120);
          } else {
            setTimeout(checkTiles, 70);
          }
        }
        checkTiles();
      }

      try {
        if (typeof naver !== 'undefined' && naver.maps && naver.maps.Event) {
          idleListener = naver.maps.Event.once(radarMapInstance, 'idle', waitTilesThenFinish);
        }
        radarMapInstance.setCenter(aptCenter);
      } catch (e) {
        waitTilesThenFinish();
        return;
      }

      // 이미 중앙에 있어 idle 이벤트가 발생하지 않는 경우를 대비한 안전 타이머
      idleTimer = setTimeout(waitTilesThenFinish, 260);
    }

    centerMapAndWaitTiles(function () {
      // 6. 제외 대상 숨김 처리 (줌 컨트롤 +/- 및 독립 페이지 상단 타이틀 바)
      var hadZoomControl = true;
      if (window.radarMapInstance && typeof window.radarMapInstance.getOptions === 'function') {
        try {
          hadZoomControl = !!window.radarMapInstance.getOptions('zoomControl');
        } catch (e) {
          hadZoomControl = true;
        }
      }
      if (window.radarMapInstance && typeof window.radarMapInstance.setOptions === 'function') {
        try {
          window.radarMapInstance.setOptions({ zoomControl: false });
        } catch (e) {}
      }

      var $zoomControls = $(captureTarget).find('*').filter(function () {
        var txt = $(this).text().trim();
        var title = $(this).attr('title') || '';
        return (txt === '+' || txt === '-' || txt === '−' || txt === '+\n-' || title.indexOf('확대') !== -1 || title.indexOf('축소') !== -1);
      }).closest('div');
      var $titleBar = $("#titleBar_radar");
      var titleBarDisplay = $titleBar.css("display");

      $zoomControls.hide();
      $titleBar.hide();

      // 7. 단지 요약 카드 스타일 최적화 (모바일 vs 웹 완벽 분리)
      var $aptWrap = $("#radarAptInfoWrap");
      var origWrapStyle = $aptWrap.attr("style") || "";
      var origWrapDisplay = $aptWrap.css("display");

      var $aptMobile = $("#apt_info_mobile");
      var origMobileStyle = $aptMobile.attr("style") || "";

      var $aptBody = $("#apt_info_body");
      var origBodyStyle = $aptBody.attr("style") || "";

      var $backBtn = $("#iframe_back");
      var origBackStyle = $backBtn.attr("style") || "";

      if (isMobileDevice) {
        $aptWrap.css({
          'display': 'block',
          'position': 'absolute',
          'top': '12px',
          'left': '12px',
          'width': 'auto',
          'z-index': 200000,
          'pointer-events': 'none'
        });
        $aptMobile.css({
          'position': 'relative',
          'top': '0px',
          'left': '0px',
          'width': 'auto',
          'max-width': (mapW - 24) + 'px',
          'padding': '0px',
          'border-radius': '8px',
          'box-shadow': '0 4px 16px rgba(0, 0, 0, 0.14)',
          'background-color': 'rgba(255, 255, 255, 0.92)',
          'border': '1px solid rgba(0, 0, 0, 0.06)',
          'pointer-events': 'auto'
        });
        // 2026-11-07: 모바일 캡처 시 타이틀 좌측 "<"(#iframe_back) 숨김 및 30px 그리드 여백 제거
        $aptBody.css({
          'display': 'block',
          'grid-template-columns': 'none',
          'padding': '8px 12px'
        });
        $backBtn.hide();
      } else {
        $aptWrap.css({
          'display': 'block',
          'position': 'absolute',
          'top': '20px',
          'left': '20px',
          'width': 'auto',
          'z-index': 200000,
          'pointer-events': 'none'
        });
        $aptMobile.css({
          'position': 'relative',
          'top': '0px',
          'left': '0px',
          'width': '380px',
          'padding': '12px 18px',
          'border-radius': '10px',
          'box-shadow': '0 8px 24px rgba(0, 0, 0, 0.16)',
          'background-color': 'rgba(255, 255, 255, 0.94)',
          'backdrop-filter': 'blur(8px)',
          'border': '1px solid rgba(0, 0, 0, 0.08)',
          'pointer-events': 'auto'
        });
        $aptBody.css({
          'display': 'block',
          'padding': '0px'
        });
        $backBtn.hide();
      }

      // 8. 네이버 지도 자체 SVG 오버레이 활성 상태 기록 및 캡처 중 일시 숨김 (잔상 및 왜곡 방지)
      var hadMetroLine = !!(radar_metro_line && radar_metro_line.getMap());
      var hadPSchoolLine = !!(radar_pSchool_line && radar_pSchool_line.getMap());
      var hadMSchoolLines = (radar_mSchool_lines || []).map(function (l) { return !!(l && l.getMap()); });

      var visibleMarketPolygons = (radar_market_polygons || []).filter(function (p) { return p && p.getMap(); });
      var visibleAcademyPolygons = (radar_academy_polygons || []).filter(function (p) { return p && p.getMap(); });

      radar_circles.forEach(function (c) { if (c) c.setMap(null); });
      if (radar_metro_line) radar_metro_line.setMap(null);
      if (radar_pSchool_line) radar_pSchool_line.setMap(null);
      (radar_mSchool_lines || []).forEach(function (l) { if (l) l.setMap(null); });
      visibleMarketPolygons.forEach(function (p) { p.setMap(null); });
      visibleAcademyPolygons.forEach(function (p) { p.setMap(null); });

      var scale = 2; // html2canvas scale 옵션 값

      // 2026-11-07: 최하단 z-depth 벡터 언더레이 캔버스 준비
      // 네이버 지도 타일 바로 위이자 모든 마커/거리뱃지/라벨/단지카드 아래인 overlayLayer의 첫 번째 자식(firstChild)에 배치한다.
      var underlayCanvas = document.createElement('canvas');
      underlayCanvas.id = 'radarTempVectorCanvas';
      underlayCanvas.width = Math.round(mapW * scale);
      underlayCanvas.height = Math.round(mapH * scale);
      underlayCanvas.style.cssText = 'position:absolute;left:0px;top:0px;width:' + mapW + 'px;height:' + mapH + 'px;pointer-events:none;';

      var vectorUnderlay = null;
      var underlayPane = null;
      var paneOffsetX = 0;
      var paneOffsetY = 0;
      var underlayRendered = false;

      if (radarMapInstance && typeof naver !== 'undefined' && naver.maps && typeof naver.maps.OverlayView === 'function') {
        try {
          vectorUnderlay = new naver.maps.OverlayView();
          vectorUnderlay.onAdd = function () {
            var panes = this.getPanes && this.getPanes();
            underlayPane = panes ? panes.overlayLayer : null;
            if (underlayPane) {
              if (underlayPane.firstChild) {
                underlayPane.insertBefore(underlayCanvas, underlayPane.firstChild);
              } else {
                underlayPane.appendChild(underlayCanvas);
              }
            }
          };
          vectorUnderlay.draw = function () {};
          vectorUnderlay.onRemove = function () {
            if (underlayCanvas && underlayCanvas.parentNode) {
              underlayCanvas.parentNode.removeChild(underlayCanvas);
            }
          };
          vectorUnderlay.setMap(radarMapInstance);
        } catch (e) {
          console.warn("벡터 언더레이 레이어 생성 경고:", e);
        }
      }

      // 2026-11-07: 위경도 -> 지도 컨테이너 기준 픽셀(CSS px) 변환
      // 1순위: OverlayView 공식 MapCanvasProjection.fromCoordToOffset (마커/커스텀오버레이와 서브픽셀 단위로 100% 일치)
      // 2순위: map.getBounds() 선형 보간 (백업)
      function getMapPixelOffset(coord) {
        if (!coord || !radarMapInstance) return null;
        try {
          if (vectorUnderlay && underlayPane && typeof vectorUnderlay.getProjection === 'function') {
            var canvasProj = vectorUnderlay.getProjection();
            if (canvasProj && typeof canvasProj.fromCoordToOffset === 'function') {
              var cOff = canvasProj.fromCoordToOffset(coord);
              if (cOff && isFinite(cOff.x) && isFinite(cOff.y)) {
                return { x: cOff.x - paneOffsetX, y: cOff.y - paneOffsetY };
              }
            }
          }
        } catch (e) {}
        try {
          var proj = radarMapInstance.getProjection && radarMapInstance.getProjection();
          if (proj && typeof proj.fromCoordToOffset === 'function') {
            var off = proj.fromCoordToOffset(coord);
            if (off && isFinite(off.x) && isFinite(off.y)) return { x: off.x, y: off.y };
          }
        } catch (e) {}
        try {
          var bounds = radarMapInstance.getBounds();
          if (!bounds) return null;
          var sw = bounds.getSW();
          var ne = bounds.getNE();
          var lngSpan = ne.lng() - sw.lng();
          var latSpan = ne.lat() - sw.lat();
          if (lngSpan <= 0 || latSpan <= 0) return null;

          var targetLng = typeof coord.lng === 'function' ? coord.lng() : Number(coord.x || coord.lng);
          var targetLat = typeof coord.lat === 'function' ? coord.lat() : Number(coord.y || coord.lat);

          var px = ((targetLng - sw.lng()) / lngSpan) * mapW;
          var py = ((ne.lat() - targetLat) / latSpan) * mapH;
          return { x: px, y: py };
        } catch (e) {
          console.warn("좌표 투영 오류:", e);
          return null;
        }
      }

      // 2026-11-07: naver KVOArray / 일반 배열 모두 지원하는 배열 변환 헬퍼
      function toPlainArray(arr) {
        if (!arr) return [];
        if (typeof arr.getArray === 'function') return arr.getArray();
        return Array.isArray(arr) ? arr : [];
      }

      // 2026-11-07: 상권/학원가 폴리곤 캔버스 직접 렌더링 (테두리 + 반투명 채우기)
      function drawPolygonsOnCanvas(targetCtx, s, polygons, color) {
        polygons.forEach(function (polygon) {
          var paths = toPlainArray(polygon.getPaths ? polygon.getPaths() : [polygon.getPath()]);
          if (paths.length && paths[0] && typeof paths[0].lat === 'function') paths = [paths];
          targetCtx.save();
          targetCtx.beginPath();
          paths.forEach(function (path) {
            toPlainArray(path).forEach(function (coord, idx) {
              var pt = getMapPixelOffset(coord);
              if (!pt) return;
              if (idx === 0) targetCtx.moveTo(pt.x * s, pt.y * s);
              else targetCtx.lineTo(pt.x * s, pt.y * s);
            });
            targetCtx.closePath();
          });
          targetCtx.globalAlpha = 0.2;
          targetCtx.fillStyle = color;
          targetCtx.fill('evenodd');
          targetCtx.globalAlpha = 0.8;
          targetCtx.strokeStyle = color;
          targetCtx.lineWidth = 2 * s;
          targetCtx.stroke();
          targetCtx.restore();
        });
      }

      // 2026-11-07: 반경라인 + 거리선 + 폴리곤 최하단 z-depth 렌더러 (단지 중심점 1개에만 정밀 결합)
      function drawRadarVectorOverlays(targetCtx, s) {
        if (!targetCtx || !aptCenter) return;

        var centerPt = getMapPixelOffset(aptCenter);
        if (!centerPt) return;

        // A. 반경라인 표시 (250m, 500m, 1km, 3km, 5km) - 가장 아래 z-depth
        var activeRadii = [250, 500, 1000, 3000, 5000];

        activeRadii.forEach(function (radius) {
          var northCoord = radarMoveLatLng(aptCenter, radius, 'N');
          var northPt = getMapPixelOffset(northCoord);
          if (northPt) {
            var radiusPx = Math.abs(centerPt.y - northPt.y);
            targetCtx.save();
            targetCtx.beginPath();
            targetCtx.arc(centerPt.x * s, centerPt.y * s, radiusPx * s, 0, 2 * Math.PI);
            targetCtx.strokeStyle = '#E43B46';
            targetCtx.globalAlpha = 0.45;
            targetCtx.lineWidth = 1.3 * s;
            targetCtx.stroke();
            targetCtx.restore();
          }
        });

        // B. 지하철역 직선거리 점선 (radar_metro_line)
        if (radar_metro_line && hadMetroLine) {
          var metroPath = radar_metro_line.getPath();
          if (metroPath && metroPath.getLength && metroPath.getLength() >= 2) {
            var p1 = getMapPixelOffset(metroPath.getAt(0));
            var p2 = getMapPixelOffset(metroPath.getAt(1));
            if (p1 && p2) {
              targetCtx.save();
              targetCtx.beginPath();
              targetCtx.setLineDash([4 * s, 3 * s]);
              targetCtx.strokeStyle = radarColorCode['지하철역'] || '#3F5682';
              targetCtx.lineWidth = 2 * s;
              targetCtx.moveTo(p1.x * s, p1.y * s);
              targetCtx.lineTo(p2.x * s, p2.y * s);
              targetCtx.stroke();
              targetCtx.restore();
            }
          }
        }

        // C. 초등학교 직선거리 점선 (radar_pSchool_line)
        if (radar_pSchool_line && hadPSchoolLine) {
          var pPath = radar_pSchool_line.getPath();
          if (pPath && pPath.getLength && pPath.getLength() >= 2) {
            var p1 = getMapPixelOffset(pPath.getAt(0));
            var p2 = getMapPixelOffset(pPath.getAt(1));
            if (p1 && p2) {
              targetCtx.save();
              targetCtx.beginPath();
              targetCtx.setLineDash([4 * s, 3 * s]);
              targetCtx.strokeStyle = radarColorCode['초등학교'] || '#C49B00';
              targetCtx.lineWidth = 2 * s;
              targetCtx.moveTo(p1.x * s, p1.y * s);
              targetCtx.lineTo(p2.x * s, p2.y * s);
              targetCtx.stroke();
              targetCtx.restore();
            }
          }
        }

        // D. 중학교 직선거리 점선들 (radar_mSchool_lines)
        if (radar_mSchool_lines && radar_mSchool_lines.length) {
          radar_mSchool_lines.forEach(function (mLine, mIdx) {
            if (mLine && hadMSchoolLines[mIdx]) {
              var mPath = mLine.getPath();
              if (mPath && mPath.getLength && mPath.getLength() >= 2) {
                var p1 = getMapPixelOffset(mPath.getAt(0));
                var p2 = getMapPixelOffset(mPath.getAt(1));
                if (p1 && p2) {
                  targetCtx.save();
                  targetCtx.beginPath();
                  targetCtx.setLineDash([4 * s, 3 * s]);
                  targetCtx.strokeStyle = radarColorCode['중학교'] || '#6D872C';
                  targetCtx.lineWidth = 2 * s;
                  targetCtx.moveTo(p1.x * s, p1.y * s);
                  targetCtx.lineTo(p2.x * s, p2.y * s);
                  targetCtx.stroke();
                  targetCtx.restore();
                }
              }
            }
          });
        }

        // E. 상권/학원가 반투명 폴리곤
        drawPolygonsOnCanvas(targetCtx, s, visibleMarketPolygons, radarColorCode['상권'] || '#8B2E2E');
        drawPolygonsOnCanvas(targetCtx, s, visibleAcademyPolygons, radarColorCode['학원가'] || '#6A4C9C');
      }

      // SVG 네임스페이스 보정
      var modifiedSvgs = [];
      $(captureTarget).find('svg').each(function () {
        var svg = this;
        var origAttrs = {
          xmlns: svg.getAttribute('xmlns'),
          xmlnsXlink: svg.getAttribute('xmlns:xlink')
        };

        if (!svg.getAttribute('xmlns')) {
          svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        if (!svg.getAttribute('xmlns:xlink')) {
          svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        }

        modifiedSvgs.push({
          svg: svg,
          orig: origAttrs
        });
      });

      // 지도 및 DOM 상태 복구 헬퍼 함수 (멱등성 보장)
      var domRestored = false;
      function restoreMapAndDomState() {
        if (domRestored) return;
        domRestored = true;
        clearInterval(progressTimer);
        $titleBar.css("display", titleBarDisplay);
        $zoomControls.show();

        if (isDesktop && origTargetStyle) {
          $(captureTarget).attr("style", origTargetStyle);
        }

        if (vectorUnderlay) {
          try { vectorUnderlay.setMap(null); } catch (e) {}
          vectorUnderlay = null;
        }
        if (underlayCanvas && underlayCanvas.parentNode) {
          underlayCanvas.parentNode.removeChild(underlayCanvas);
        }

        // 캡처 전 원래 지도 중심 위치 복원 (모바일 바텀시트 패닝 위치 등 유지)
        if (radarMapInstance && origMapCenter && typeof radarMapInstance.setCenter === 'function') {
          try { radarMapInstance.setCenter(origMapCenter); } catch (e) {}
        }

        // 네이버 지도 자체 오버레이 복원
        radar_circles.forEach(function (c) { if (c) c.setMap(radarMapInstance); });
        if (radar_metro_line && hadMetroLine) radar_metro_line.setMap(radarMapInstance);
        if (radar_pSchool_line && hadPSchoolLine) radar_pSchool_line.setMap(radarMapInstance);
        (radar_mSchool_lines || []).forEach(function (l, idx) {
          if (l && hadMSchoolLines[idx]) l.setMap(radarMapInstance);
        });
        visibleMarketPolygons.forEach(function (p) { p.setMap(radarMapInstance); });
        visibleAcademyPolygons.forEach(function (p) { p.setMap(radarMapInstance); });

        if (window.radarMapInstance && typeof window.radarMapInstance.setOptions === 'function' && hadZoomControl) {
          try {
            window.radarMapInstance.setOptions({ zoomControl: true });
          } catch (e) {}
        }

        if ($aptWrap.length) {
          $aptWrap.attr("style", origWrapStyle);
          $aptWrap.css("display", origWrapDisplay);
        }
        if ($aptMobile.length) {
          $aptMobile.attr("style", origMobileStyle);
        }
        if ($aptBody.length) {
          $aptBody.attr("style", origBodyStyle);
        }
        if ($backBtn.length) {
          $backBtn.attr("style", origBackStyle);
        }

        modifiedSvgs.forEach(function (item) {
          if (item.orig.xmlns) item.svg.setAttribute('xmlns', item.orig.xmlns);
          else item.svg.removeAttribute('xmlns');
          if (item.orig.xmlnsXlink) item.svg.setAttribute('xmlns:xlink', item.orig.xmlnsXlink);
          else item.svg.removeAttribute('xmlns:xlink');
        });
      }

      function restoreAllOnError() {
        restoreMapAndDomState();
        finishButtonState();
      }

      // 9. 80ms 레이아웃 안정화 후 최하단 언더레이 드로잉 및 html2canvas 실행
      setTimeout(function () {
        updateProgress(40);

        try {
          if (underlayPane && underlayCanvas && underlayCanvas.parentNode === underlayPane && mapElement) {
            if (underlayPane.firstChild !== underlayCanvas) {
              underlayPane.insertBefore(underlayCanvas, underlayPane.firstChild);
            }
            var mapRect = mapElement.getBoundingClientRect();
            var paneRect = underlayPane.getBoundingClientRect();
            paneOffsetX = mapRect.left - paneRect.left;
            paneOffsetY = mapRect.top - paneRect.top;
            underlayCanvas.style.left = paneOffsetX + 'px';
            underlayCanvas.style.top = paneOffsetY + 'px';

            var uCtx = underlayCanvas.getContext('2d');
            uCtx.setTransform(1, 0, 0, 1, 0, 0);
            uCtx.clearRect(0, 0, underlayCanvas.width, underlayCanvas.height);
            drawRadarVectorOverlays(uCtx, scale);
            underlayRendered = true;
          }
        } catch (uErr) {
          console.warn("최하단 벡터 언더레이 선행 렌더링 경고:", uErr);
        }

        html2canvas(captureTarget, {
          useCORS: true,
          allowTaint: false,
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          width: mapW,
          height: mapH,
          windowWidth: mapW,
          windowHeight: mapH,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          ignoreElements: function (el) {
            if (!el) return false;
            if (el.getAttribute && el.getAttribute('data-html2canvas-ignore') === 'true') return true;
            if (el.id === 'radarDataList_wrapper' || el.id === 'dataList_wrapper') return true;
            if (el.id === 'radarModalCaptureBtn' || el.id === 'radarMapCaptureBtn') return true;
            if (el.id === 'titleBar_radar' || el.id === 'iframe_back') return true;
            if (el.innerText && (el.innerText.trim() === '+' || el.innerText.trim() === '-' || el.innerText.trim() === '−' || el.innerText.trim() === '+\n-')) return true;
            if (el.getAttribute && (el.getAttribute('title') === '확대' || el.getAttribute('title') === '축소')) return true;
            if (el.className && typeof el.className === 'string' &&
                (el.className.indexOf('naver-maps-control') !== -1 ||
                 el.className.indexOf('nmap_zoom') !== -1 ||
                 el.className.indexOf('nmap_btn_zoom') !== -1 ||
                 el.className.indexOf('control') !== -1)) return true;
            return false;
          }
        }).then(function (canvas) {
          clearInterval(progressTimer);
          updateProgress(90);

          if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
            restoreAllOnError();
            alert("지도 캡처 영역 크기 오류로 이미지 생성에 실패했습니다. 화면을 확인 후 다시 시도해 주세요.");
            return;
          }

          var realScale = (canvas.width / mapW) || 2;

          if (!underlayRendered) {
            try {
              var fallbackCtx = canvas.getContext('2d');
              fallbackCtx.setTransform(1, 0, 0, 1, 0, 0);
              drawRadarVectorOverlays(fallbackCtx, realScale);
            } catch (err) {
              console.warn("캔버스 오버레이 폴백 렌더링 경고:", err);
            }
          }

          try {
            // 2026-11-07: price/index.html 캡처 결과와 동일한 리얼랭커스 상단 타이틀 및 하단 워터마크 합성
            var headerHeight = Math.round(32 * realScale);
            var footerHeight = Math.round(36 * realScale);
            var finalCanvas = document.createElement('canvas');
            finalCanvas.width = canvas.width;
            finalCanvas.height = canvas.height + headerHeight + footerHeight;

            var ctx = finalCanvas.getContext('2d');
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

            var padX = 10 * realScale;

            // 상단 좌측 회색 타이틀 (YYYY년 MM월 DD일 주변 입지 환경 분석 | 리얼랭커스)
            var headerTitle = yyyy + "년 " + mm + "월 " + dd + "일 주변 입지 환경 분석 | 리얼랭커스";
            ctx.font = '600 ' + (11.5 * realScale) + 'px "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.textBaseline = 'top';
            ctx.fillText(headerTitle, padX, 10 * realScale);

            // 상단 워터마크와 지도 영역 경계선 (#e2e8f0)
            ctx.beginPath();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1 * realScale;
            ctx.moveTo(0, headerHeight - 0.5 * realScale);
            ctx.lineTo(finalCanvas.width, headerHeight - 0.5 * realScale);
            ctx.stroke();

            // 본문 지도 이미지 렌더링
            ctx.drawImage(canvas, 0, headerHeight);

            // 하단 점선 구분선 (dashed line #e2e8f0 - price/index.html 100% 동일)
            var lineY = headerHeight + canvas.height + 2 * realScale;
            ctx.beginPath();
            ctx.setLineDash([4 * realScale, 3 * realScale]);
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1 * realScale;
            ctx.moveTo(padX, lineY);
            ctx.lineTo(finalCanvas.width - padX, lineY);
            ctx.stroke();
            ctx.setLineDash([]);

            // 하단 좌측 캡처 일시 워터마크
            ctx.font = (8 * realScale) + 'px "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.textBaseline = 'top';
            ctx.fillText('Captured at', padX, lineY + 7 * realScale);
            ctx.fillText(captureDateTimeStr, padX, lineY + 17 * realScale);

            // 하단 우측 리얼랭커스 브랜드 워터마크
            var fontBrand = 'bold ' + (11 * realScale) + 'px "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            var fontSep = (10 * realScale) + 'px "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            var fontDomain = (11 * realScale) + 'px "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

            ctx.font = fontDomain;
            var domainWidth = ctx.measureText('realrankus.com').width;
            ctx.font = fontSep;
            var sepWidth = ctx.measureText('|').width;
            ctx.font = fontBrand;
            var brandWidth = ctx.measureText('리얼랭커스').width;

            var totalRightWidth = brandWidth + (4 * realScale) + sepWidth + (4 * realScale) + domainWidth;
            var rightStartX = finalCanvas.width - padX - totalRightWidth;
            var textY = lineY + 11 * realScale;

            // 리얼랭커스 (브랜드 레드 #E43B46)
            ctx.font = fontBrand;
            ctx.fillStyle = '#E43B46';
            ctx.fillText('리얼랭커스', rightStartX, textY);

            // 구분선 | (#cbd5e1)
            ctx.font = fontSep;
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText('|', rightStartX + brandWidth + 4 * realScale, textY);

            // realrankus.com (#64748b)
            ctx.font = fontDomain;
            ctx.fillStyle = '#64748b';
            ctx.fillText('realrankus.com', rightStartX + brandWidth + 4 * realScale + sepWidth + 4 * realScale, textY);

            updateProgress(97);

            var base64Data = finalCanvas.toDataURL('image/png');
            if (!base64Data || base64Data.length < 200 || base64Data === 'data:,') {
              restoreAllOnError();
              alert("생성된 이미지 데이터가 비어 있습니다 (0KB). 잠시 후 다시 시도해 주세요.");
              return;
            }

            // 캔버스 직렬화 완료 즉시 지도 및 DOM 상태 원복
            restoreMapAndDomState();

            updateProgress(100);
            // 100% 진행률을 사용자가 충분히 인지할 수 있도록 300ms 유지 (price/index.html 동일)
            setTimeout(function () {
              if (window.Android && typeof window.Android.downloadImage === 'function') {
                window.Android.downloadImage(base64Data, filename);
              } else {
                var link = document.createElement('a');
                link.download = filename;
                link.href = base64Data;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
              finishButtonState();
            }, 300);

          } catch (err) {
            restoreAllOnError();
            console.error("이미지 변환 오류:", err);
            alert("이미지 변환에 실패했습니다: " + err.message);
          }
        }).catch(function (err) {
          restoreAllOnError();
          console.error("html2canvas capture error:", err);
          alert("캡처에 실패했습니다: " + err.message);
        });
      }, 80);
    });
  }
}

// 2026-11-07: 네이버 부동산 및 호갱노노 링크 핸들러
function openNaver(code) {
  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  var nURL = isMobile ? "https://m.land.naver.com/complex/info/" + code : "https://new.land.naver.com/complexes/" + code;
  if (typeof checkMobile === 'function' && checkMobile() == "ios") {
    window.location.href = nURL;
  } else {
    window.open(nURL);
  }
}

function openHGNN(code) {
  var hURL = "https://hogangnono.com/apt/" + code;
  if (typeof checkMobile === 'function' && checkMobile() == "ios") {
    window.location.href = hURL;
  } else {
    window.open(hURL);
  }
}

// 전역 인터페이스 노출 (인라인 이벤트 핸들러 및 외부 호출 지원)
window.renderRadarModalView = renderRadarModalView;
window.captureRadarMapView = captureRadarMapView;
window.radarGraphShowHide = radarGraphShowHide;
window.radar_price_sDateChange = radar_price_sDateChange;
window.radar_price_eDateChange = radar_price_eDateChange;
window.graphShowHide = radarGraphShowHide;
window.price_sDateChange = radar_price_sDateChange;
window.price_eDateChange = radar_price_eDateChange;
window.openNaver = openNaver;
window.openHGNN = openHGNN;
window.moveInfoWindow = moveRadarInfoWindow;
