// ============================================================
// MoneyFlow 통합 모듈 (Global | Real Estate) - PC & Mobile 공용
// ============================================================
var mfuMode = "global"; // 'global' | 'realestate'
var mfuDuration = "5Y";
var mfuTooltipEnabled = true;
var mfuShowUsAsset = true;
var mfuShowKoAsset = true;
var mfuIsMobileUI = false;

var mfuSelectedGlobal = ["미국 S&P", "한국 코스피", "금"];
var mfuSelectedApt = ["전국", "수도권", "서울시"];
var mfuAllAptRegions = [];
var mfuGlobalColorMap = {};
var mfuAptColorMap = {};
var mfuFocusedLabel = null;

var mfuChartGlobal = null;
var mfuChartApt = null;
var mfuChartLandscape = null;

var MFU_GLOBAL_ITEMS = [
  { key: "미국 NASDAQ", group: "미국 증시", col: "yf_NASDAQ", hourlyKey: "NAS", color: "#2f631e" },
  { key: "미국 DOW", group: "미국 증시", col: "yf_DOW", hourlyKey: "DOW", color: "#3b991c" },
  { key: "미국 S&P", group: "미국 증시", col: "yf_SNP", hourlyKey: "SNP", color: "#13d43d" },
  { key: "한국 코스피", group: "한국 증시", col: "yf_KOSPI", hourlyKey: "KOSPI", color: "#9c2557" },
  { key: "한국 코스닥", group: "한국 증시", col: "yf_KOSDAQ", hourlyKey: "KOSDAQ", color: "#9c2570" },
  { key: "코스피+코스닥", group: "한국 증시", col: "yf_KOSPI_KOSDAQ", hourlyKey: "KOSPI_KOSDAQ", color: "#e02bbc" },
  { key: "금", group: "원자재/유가", col: "yf_Gold", hourlyKey: "YF_Gold", color: "#FFD700" },
  { key: "서부텍사스유", group: "원자재/유가", col: "FRED_WTI", hourlyKey: "WTI", color: "#87867c" },
  { key: "두바이유", group: "원자재/유가", col: "FRED_Dubai", hourlyKey: "Dubai", color: "#616057" },
  { key: "원-달러", group: "환율/코인", col: "BOK_Currency_US", hourlyKey: "USDKRW", color: "#8B4513" },
  { key: "원-100엔", group: "환율/코인", col: "BOK_Currency_JP", hourlyKey: "JPYKRW", color: "#CD853F" },
  { key: "비트코인", group: "환율/코인", col: "yf_BTCUSD", hourlyKey: "USDT-BTC", color: "#E1AD01" },
  { key: "전국 아파트", group: "부동산", col: "KOR_APT_PRICE", zeroToNull: true, color: "#1E90FF" },
  { key: "수도권 아파트", group: "부동산", col: "KOR_APT_PRICE_METROPOLITAN", zeroToNull: true, color: "#4682B4" },
  { key: "지방권 아파트", group: "부동산", col: "KOR_APT_PRICE_URBAN", zeroToNull: true, color: "#00BFFF" },
  { key: "서울시 아파트", group: "부동산", col: "KOR_APT_PRICE_SEOUL", zeroToNull: true, color: "#5F9EA0" },
  { key: "경기도 아파트", group: "부동산", col: "KOR_APT_PRICE_KYUNGKIDO", zeroToNull: true, color: "#4169E1" },
  { key: "6대광역시 아파트", group: "부동산", col: "KOR_APT_PRICE_LARGECITY6", zeroToNull: true, color: "#87CEFA" },
  { key: "미국 M2", group: "통화/유동성", col: "FRED_M2", color: "#E53935" },
  { key: "한국 M2", group: "통화/유동성", col: "BOK_M2", color: "#AB47BC" },
  { key: "한국 L", group: "통화/유동성", col: "BOK_L", color: "#7B1FA2" },
  { key: "한국은행 총자산", group: "통화/유동성", col: "BOK_BS_Asset", color: "#4A148C" },
  { key: "중앙은행 개관표", group: "통화/유동성", col: "BOK_CB_Survey", color: "#00897B" }
];

var MFU_GLOBAL_PRESETS = {
  us_stock: ["미국 NASDAQ", "미국 S&P", "미국 DOW"],
  ko_stock: ["한국 코스피", "한국 코스닥", "코스피+코스닥"],
  gold_btc_fx: ["금", "비트코인", "원-달러"],
  oil_gold: ["서부텍사스유", "두바이유", "금"],
  apt: ["전국 아파트", "수도권 아파트", "서울시 아파트", "경기도 아파트"],
  liquidity: ["미국 M2", "한국 M2", "한국 L", "한국은행 총자산", "중앙은행 개관표"]
};

var MFU_APT_PRESETS = {
  major: ["전국", "수도권", "지방권", "서울시", "경기도", "6대광역시"],
  seoul_core: ["서울시 강남구", "서울시 서초구", "서울시 송파구", "서울시 용산구", "서울시 성동구", "서울시 마포구"],
  gyeonggi_core: ["경기도 과천시", "경기도 성남시 분당구", "경기도 용인시 수지구", "경기도 화성시 동탄구", "경기도 하남시", "경기도 광명시"],
  metro6: ["부산시", "대구시", "인천시", "대전시", "울산시", "세종시"]
};

var MFU_APT_PALETTE = [
  "#1E90FF", "#00A86B", "#FF7F50", "#4169E1", "#E67E22",
  "#16A085", "#2E86DE", "#8E44AD", "#D35400", "#00B894",
  "#0984E3", "#6C5CE7", "#E84393", "#00CEC9", "#F39C12",
  "#2980B9", "#27AE60", "#C0392B", "#7F8C8D", "#34495E"
];

var MFU_BROAD_REGIONS = ["전국", "수도권", "지방권", "6대광역시", "5대광역시", "9개도", "8개도"];

function mfuGetRegionGroup(name) {
  return MFU_BROAD_REGIONS.indexOf(name) !== -1 ? "광역/권역" : name.split(" ")[0];
}

function mfuSliceDuration(arr, duration) {
  if (!Array.isArray(arr)) return [];
  var map = { "1Y": 12, "3Y": 36, "5Y": 60, "10Y": 120, "15Y": 180, "20Y": 240, "30Y": 360 };
  var n = map[duration] || 60;
  return arr.slice(-n);
}

function mfuFormatSeries(obj, duration, zeroToNull) {
  if (!obj) return [];
  return mfuSliceDuration(Object.values(obj), duration).map(function(x) {
    if (x === null || x === undefined || isNaN(x)) return null;
    var val = Math.round(Number(x) * 1000) / 1000;
    if (zeroToNull && val === 0) return null;
    return val;
  });
}

function mfuGetLatestValid(obj) {
  if (!obj) return null;
  var vals = Object.values(obj);
  for (var i = vals.length - 1; i >= 0; i--) {
    var v = vals[i];
    if (v !== null && v !== undefined && v !== "" && !isNaN(Number(v))) {
      return Number(v);
    }
  }
  return null;
}

function mfuCalcLastRate(rawObj, latestVal, stdIndex) {
  if (!rawObj || latestVal === null || latestVal === undefined || isNaN(latestVal) || stdIndex < 0) return null;
  var baseVal = Number(Object.values(rawObj)[stdIndex]);
  if (!baseVal || isNaN(baseVal)) return null;
  return Number((Number(latestVal) / baseVal).toFixed(2));
}

function mfuGetLastNonNull(arr) {
  if (!Array.isArray(arr)) return null;
  for (var i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null && arr[i] !== undefined && !isNaN(arr[i])) {
      return Number(arr[i]);
    }
  }
  return null;
}

function mfuGetHourlyVal(hourlyKey) {
  if (typeof hourly_market === "undefined" || !hourly_market) return null;
  if (hourlyKey === "KOSPI_KOSDAQ") {
    if (hourly_market["KOSPI"] && hourly_market["KOSDAQ"]) {
      return Number(hourly_market["KOSPI"]["value"]) + Number(hourly_market["KOSDAQ"]["value"]);
    }
    return null;
  }
  if (!hourly_market[hourlyKey]) return null;
  var raw = hourly_market[hourlyKey]["value"];
  if (typeof raw === "string") raw = raw.replaceAll(",", "");
  var num = Number(raw);
  return isNaN(num) ? null : num;
}

function mfuExtractAptRegions(data) {
  if (!data) return [];
  var reserved = { TIME: 1, GENERATE: 1, BOK_Total_Asset: 1, FRED_Total_Asset: 1, BOK_Total_Asset_NOR: 1, FRED_Total_Asset_NOR: 1 };
  var res = [];
  Object.keys(data).forEach(function(k) {
    if (reserved[k] || k.endsWith("_NOR")) return;
    if (data[k + "_NOR"]) res.push(k);
  });
  return res;
}

function mfuGetAptColor(region, idx) {
  if (!mfuAptColorMap[region]) {
    mfuAptColorMap[region] = MFU_APT_PALETTE[idx % MFU_APT_PALETTE.length];
  }
  return mfuAptColorMap[region];
}

function mfuBuildChartPayload(mode, duration) {
  var isGlobal = (mode === "global");
  var src = isGlobal
    ? (typeof moneyflow_market !== "undefined" ? moneyflow_market : null)
    : (typeof moneyflow_apt_market !== "undefined" ? moneyflow_apt_market : null);

  if (!src || !src["TIME"]) {
    return { labels: [], datasets: [], latestMap: {} };
  }

  var timeValues = Object.values(src["TIME"]);
  var stdIndex = timeValues.indexOf("2019-06-01");
  var labels = mfuSliceDuration(timeValues, duration).slice();

  var usArr = mfuFormatSeries(src["FRED_Total_Asset_NOR"], duration, false);
  var koArr = mfuFormatSeries(src["BOK_Total_Asset_NOR"], duration, false);

  var latestUs = (typeof daily_market !== "undefined" && daily_market && mfuGetLatestValid(daily_market["FRED_Total_Asset"]))
    || mfuGetLatestValid(src["FRED_Total_Asset"]);
  var latestKo = (typeof monthly_market !== "undefined" && monthly_market && mfuGetLatestValid(monthly_market["BOK_Total_Asset"]))
    || mfuGetLatestValid(src["BOK_Total_Asset"]);

  labels.push("현재");
  usArr.push(mfuCalcLastRate(src["FRED_Total_Asset"], latestUs, stdIndex));
  koArr.push(mfuCalcLastRate(src["BOK_Total_Asset"], latestKo, stdIndex));

  var latestMap = {
    "미국 통화량": mfuGetLastNonNull(usArr),
    "한국 통화량": mfuGetLastNonNull(koArr)
  };

  var datasets = [
    {
      label: "미국 통화량",
      data: usArr,
      borderColor: "#d12145",
      backgroundColor: "#d12145",
      pointRadius: 0,
      borderWidth: mfuIsMobileUI ? 3 : 4,
      tension: 0.2,
      hidden: !mfuShowUsAsset
    },
    {
      label: "한국 통화량",
      data: koArr,
      borderColor: "#571091",
      backgroundColor: "#571091",
      pointRadius: 0,
      borderWidth: mfuIsMobileUI ? 3 : 4,
      tension: 0.2,
      hidden: !mfuShowKoAsset
    }
  ];

  if (isGlobal) {
    if (typeof mfSyncColorMap === "function") mfSyncColorMap(mfuSelectedGlobal, mfuGlobalColorMap);
    mfuSelectedGlobal.forEach(function(key, idx) {
      var item = MFU_GLOBAL_ITEMS.find(function(it) { return it.key === key; });
      if (!item) return;
      var arr = mfuFormatSeries(src[item.col + "_NOR"], duration, !!item.zeroToNull);
      if (item.hourlyKey) {
        arr.push(mfuCalcLastRate(src[item.col], mfuGetHourlyVal(item.hourlyKey), stdIndex));
      } else {
        arr.push(null);
      }
      latestMap[item.key] = mfuGetLastNonNull(arr);
      var color = mfuGlobalColorMap[item.key] || item.color || MFU_APT_PALETTE[idx % MFU_APT_PALETTE.length];
      datasets.push({
        label: item.key,
        data: arr,
        borderColor: color,
        backgroundColor: color,
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: false
      });
    });
  } else {
    if (typeof mfSyncColorMap === "function") mfSyncColorMap(mfuSelectedApt, mfuAptColorMap);
    mfuSelectedApt.forEach(function(region, idx) {
      var arr = mfuFormatSeries(src[region + "_NOR"], duration, true);
      arr.push(null);
      latestMap[region] = mfuGetLastNonNull(arr);
      var color = mfuGetAptColor(region, idx);
      datasets.push({
        label: region,
        data: arr,
        borderColor: color,
        backgroundColor: color,
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: false
      });
    });
  }

  return { labels: labels, datasets: datasets, latestMap: latestMap };
}

function mfuDrawChartInstance(canvasId, payload, optionsOverride) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  var ctx = canvas.getContext("2d");

  var isMobileChart = optionsOverride && optionsOverride.isMobile;
  var showLegend = optionsOverride && typeof optionsOverride.showLegend === "boolean" ? optionsOverride.showLegend : !isMobileChart;
  var totalDuration = 260;
  var delayBetweenPoints = payload.labels.length > 0 ? (totalDuration / payload.labels.length) : 0;

  var pluginsList = [ChartDataLabels];
  if (typeof mfFocusShadowPlugin !== "undefined") pluginsList.push(mfFocusShadowPlugin);
  if (typeof mfEndLabelPlugin !== "undefined") pluginsList.push(mfEndLabelPlugin);

  return new Chart(ctx, {
    type: "line",
    plugins: pluginsList,
    data: {
      labels: payload.labels,
      datasets: payload.datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      layout: {
        padding: {
          left: isMobileChart ? 4 : 0,
          right: isMobileChart ? 78 : 132,
          top: 10,
          bottom: 6
        }
      },
      scales: {
        y: { display: false },
        x: {
          ticks: {
            maxRotation: isMobileChart ? 45 : 60,
            maxTicksLimit: isMobileChart ? 6 : 14,
            font: { size: isMobileChart ? 9 : 10 }
          }
        }
      },
      animations: {
        colors: false,
        x: {
          type: "number",
          easing: "linear",
          duration: delayBetweenPoints,
          from: NaN,
          delay: function(c) {
            if (c.type !== "data" || c.xStarted) return 0;
            c.xStarted = true;
            return c.index * delayBetweenPoints;
          }
        },
        y: {
          type: "number",
          easing: "linear",
          duration: delayBetweenPoints,
          from: 0,
          delay: function(c) {
            if (c.type !== "data" || c.yStarted) return 0;
            c.yStarted = true;
            return c.index * delayBetweenPoints;
          }
        }
      },
      plugins: {
        tooltip: {
          enabled: mfuTooltipEnabled
        },
        mfEndLabels: {
          enabled: true,
          compact: !!isMobileChart
        },
        legend: {
          display: showLegend,
          position: "left",
          align: "start",
          onHover: function(e, legendItem, legend) {
            if (typeof mfApplyFocus === "function") {
              mfApplyFocus(legend.chart, legendItem.datasetIndex);
            }
          },
          onLeave: function(e, legendItem, legend) {
            if (typeof mfApplyFocus === "function") {
              mfApplyFocus(legend.chart, null);
            }
          },
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            font: { size: 11 }
          }
        },
        title: { display: false },
        datalabels: {
          display: "auto",
          color: "black",
          align: "top",
          anchor: "start",
          padding: isMobileChart ? 1 : 2,
          textAlign: "center",
          font: { size: isMobileChart ? 9 : 11 },
          formatter: function(value) {
            if (value === null || value === undefined || isNaN(value)) return "";
            return value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
          }
        }
      }
    }
  });
}

// ============================================================
// HTML Builders (PC / Mobile)
// ============================================================
function mfuSvgLogo() {
  return "<svg viewBox='0 0 388 102' width='42' height='13' style='vertical-align: middle; margin-right: 2px;'><path fill='none' stroke='#1355ac' stroke-width='4' stroke-miterlimit='10' d='M0,4C26,4,26,98.43,51.93,98.43S77.9,4,103.87,4s26,94.43,51.93,94.43S181.76,4,207.73,4s26,94.43,51.94,94.43S285.63,4,311.6,4s26,94.43,51.94,94.43'></path><path fill='none' stroke='#1355ac' stroke-width='8' stroke-miterlimit='10' d='M25.41,4c26,0,26,94.43,51.93,94.43S103.31,4,129.28,4s26,94.43,51.93,94.43S207.17,4,233.14,4s26,94.43,51.94,94.43S311,4,337,4,363,98.43,389,98.43'></path></svg>";
}

function buildMoneyFlowHtmlPC() {
  var updated = (typeof moneyflow_updated !== "undefined" ? moneyflow_updated : "");
  var h = "";
  h += "<div class='daily_header_mf' id='Money_Flow'>";
  h += "<div class='daily_title_mf'>";
    h += "<div class='mf_title_left'>";
      h += mfuSvgLogo() + "<span>MoneyFlow</span>";
      h += "<div class='mf_mode_switch' id='mfu_mode_switch' data-mode='global'>";
        h += "<div class='mf_mode_slider'></div>";
        h += "<button type='button' class='mf_mode_btn active' data-mode='global' onClick='mfuSwitchMode(\"global\")'>Global</button>";
        h += "<button type='button' class='mf_mode_btn' data-mode='realestate' onClick='mfuSwitchMode(\"realestate\")'>Real Estate</button>";
      h += "</div>";
      h += "<span class='mf_base_note'>(2019년 6월 = 1.00)</span>";
    h += "</div>";
    h += "<div class='subSelection'>";
      ["1Y", "3Y", "5Y", "10Y", "15Y", "20Y", "30Y"].forEach(function(d) {
        var chk = (d === "5Y") ? " checked" : "";
        h += "<div><input type='radio' class='btnRadio' name='MFU_DUR' autocomplete='off' id='mfu_dur_" + d + "' onClick='mfuChangeDuration(\"" + d + "\")'" + chk + "><label class='btn btn-outline-danger' for='mfu_dur_" + d + "'>" + d + "</label></div>";
      });
    h += "</div>";
    h += "<div class='daily_sub_mf'>";
      h += "<span id='mfu_updated_label'>" + updated + "</span>";
      h += "<div class='card_download_wrapper' data-html2canvas-ignore='true'>";
        h += "<button type='button' class='btn_card_download' title='MoneyFlow 이미지 다운로드' onClick='mfuDownloadChartImage(this, event, false)'><i class='fa-solid fa-camera'></i></button>";
      h += "</div>";
    h += "</div>";
  h += "</div>";

  // 툴바 (Global / Real Estate 공용 동적 갱신)
  h += "<div class='apt_pro_toolbar' data-html2canvas-ignore='true'>";
    h += "<div class='apt_pro_toolbar_top'>";
      h += "<div class='apt_pro_presets' id='mfu_presets_bar'></div>";
      h += "<div class='apt_pro_right_meta'>";
        h += "<div class='apt_pro_count' id='mfu_count_label'>로딩 중...</div>";
        h += "<label class='mf_tooltip_toggle_label'><input type='checkbox' id='mfu_tooltip_cb' checked onChange='mfuToggleTooltip(this.checked)'><span>상세팝업표시</span></label>";
      h += "</div>";
    h += "</div>";
    h += "<div class='apt_pro_tags' id='mfu_selected_tags'></div>";
    h += "<div class='apt_pro_picker' id='mfu_picker_box' style='display:none;'>";
      h += "<div class='apt_pro_filter_row'>";
        h += "<select class='form-select form-select-sm' id='mfu_group_filter' onChange='mfuRenderPickerGrid()'></select>";
        h += "<input type='text' class='form-control form-control-sm' id='mfu_search_input' placeholder='지표 / 지역명 검색...' onInput='mfuRenderPickerGrid()'>";
      h += "</div>";
      h += "<div class='apt_pro_grid' id='mfu_picker_grid'></div>";
    h += "</div>";
  h += "</div>";

  h += "<div class='graph_item_mf'><div class='graph_mf'><canvas id='MFU_Main_Chart'></canvas></div></div>";
  h += "</div>";
  return h;
}

function buildMoneyFlowHtmlMobile() {
  var updated = (typeof moneyflow_updated !== "undefined" ? moneyflow_updated : "");
  var h = "";
  h += "<div class='daily_header mf_m_section'>";
    // 다른 카드(.daily_title)와 동일한 섹션 헤더 바
    h += "<div class='daily_title' id='Money_Flow'>";
      h += "<div class='daily_main'>MoneyFlow <span class='mf_m_base_sub'>(2019.06=1.00)</span></div>";
      h += "<div class='daily_sub' id='mfu_updated_label'>" + updated + "</div>";
    h += "</div>";

    // 다른 카드(.graph_item)와 동일한 흰색 그림자 카드 컨테이너
    h += "<div class='graph_item mf_m_graph_item'>";
      // 카드 상단: Global | Real Estate 슬라이드 토글 + 선택/가로보기 버튼
      h += "<div class='mf_m_card_topbar'>";
        h += "<div class='mf_mode_switch mf_mode_switch_m' id='mfu_mode_switch' data-mode='global'>";
          h += "<div class='mf_mode_slider'></div>";
          h += "<button type='button' class='mf_mode_btn active' data-mode='global' onClick='mfuSwitchMode(\"global\")'>Global</button>";
          h += "<button type='button' class='mf_mode_btn' data-mode='realestate' onClick='mfuSwitchMode(\"realestate\")'>Real Estate</button>";
        h += "</div>";
        h += "<div class='mf_m_topbar_actions' data-html2canvas-ignore='true'>";
          h += "<button type='button' class='apt_pro_btn apt_pro_btn_reset' onClick='mfuClearSelected()'>초기화</button>";
          h += "<button type='button' class='mf_m_pick_btn' onClick='mfuOpenMobilePicker()'><i class='fa-solid fa-plus'></i> 항목추가</button>";
          h += "<button type='button' class='mf_m_expand_btn' onClick='mfuDownloadChartImage(this, event, false)' title='이미지 저장'><i class='fa-solid fa-camera'></i></button>";
          h += "<button type='button' class='mf_m_expand_btn' onClick='mfuOpenLandscapeModal()' title='가로 크게 보기'><i class='fa-solid fa-up-right-and-down-left-from-center'></i></button>";
        h += "</div>";
      h += "</div>";

      // 프리셋 가로 스와이프 바
      h += "<div class='mf_m_preset_row' data-html2canvas-ignore='true'>";
        h += "<div class='mf_m_preset_scroll' id='mfu_presets_bar'></div>";
      h += "</div>";

      // 태그 = 범례 (미국·한국 통화량 + 선택 항목)
      h += "<div class='mf_m_tags_wrap' id='mfu_selected_tags'></div>";

      // 선택 수 + 상세 수치 표시 체크박스
      h += "<div class='mf_m_meta_row' data-html2canvas-ignore='true'>";
        h += "<span class='mf_m_count' id='mfu_count_label'>로딩 중...</span>";
        h += "<label class='mf_tooltip_toggle_label'><input type='checkbox' id='mfu_tooltip_cb' checked onChange='mfuToggleTooltip(this.checked)'><span>상세팝업표시</span></label>";
      h += "</div>";

      // 가로 100% 풀폭 차트
      h += "<div class='mf_m_chart_wrap'><canvas id='MFU_Main_Chart'></canvas></div>";

      // 다른 그래프 카드(.subSelection)와 동일한 하단 기간 선택 바
      h += "<div class='subSelection mf_m_subSelection'>";
        ["1Y", "3Y", "5Y", "10Y", "15Y", "20Y", "30Y"].forEach(function(d) {
          var chk = (d === "5Y") ? " checked" : "";
          h += "<div><input type='radio' class='btnRadio' name='MFU_DUR' autocomplete='off' id='mfu_dur_" + d + "' onClick='mfuChangeDuration(\"" + d + "\")'" + chk + "><label class='btn btn-outline-danger' for='mfu_dur_" + d + "'>" + d + "</label></div>";
        });
      h += "</div>";
    h += "</div>";
  h += "</div>";

  // 모바일 바텀시트 (Offcanvas Bottom) - 1회만 DOM에 추가
  if (!document.getElementById("mfMobilePickerOffcanvas")) {
    var sheet = ""
      + "<div class='offcanvas offcanvas-bottom mf_m_offcanvas' tabindex='-1' id='mfMobilePickerOffcanvas'>"
        + "<div class='offcanvas-header py-2 px-3 border-bottom'>"
          + "<h6 class='offcanvas-title fw-bold mb-0' id='mf_m_picker_title'>지표 선택</h6>"
          + "<button type='button' class='btn-close' data-bs-dismiss='offcanvas' aria-label='Close'></button>"
        + "</div>"
        + "<div class='offcanvas-body mf_m_offcanvas_body d-flex flex-column'>"
          + "<div class='mf_m_picker_controls'>"
            + "<select class='form-select form-select-sm' id='mfu_group_filter' style='width:44%;' onChange='mfuRenderPickerGrid()'></select>"
            + "<input type='text' class='form-control form-control-sm' id='mfu_search_input' placeholder='지표 / 지역명 검색...' onInput='mfuRenderPickerGrid()'>"
          + "</div>"
          + "<div class='mf_m_picker_grid' id='mfu_picker_grid'></div>"
        + "</div>"
      + "</div>";
    $("body").append(sheet);
  }

  // 모바일 가로 크게 보기 모달 (세로와 동일한 전체 컨트롤 + 스크린샷 지원) - 1회만 DOM에 추가
  if (!document.getElementById("mfLandscapeOverlay")) {
    var overlay = ""
      + "<div id='mfLandscapeOverlay' class='mf_land_overlay' style='display:none;'>"
        + "<div class='mf_land_stage' id='mf_land_capture_target'>"
          + "<div class='mf_land_topbar'>"
            + "<div class='mf_land_left'>"
              + mfuSvgLogo()
              + "<span class='mf_land_title'>MoneyFlow</span>"
              + "<div class='mf_mode_switch mf_mode_switch_land' id='mf_land_mode_switch' data-mode='global'>"
                + "<div class='mf_mode_slider'></div>"
                + "<button type='button' class='mf_mode_btn active' data-mode='global' onClick='mfuSwitchMode(\"global\")'>Global</button>"
                + "<button type='button' class='mf_mode_btn' data-mode='realestate' onClick='mfuSwitchMode(\"realestate\")'>Real Estate</button>"
              + "</div>"
            + "</div>"
            + "<div class='mf_land_durs'>"
              + ["1Y", "3Y", "5Y", "10Y", "15Y", "20Y", "30Y"].map(function(d) {
                  return "<button type='button' class='mf_land_dur_btn" + (d === "5Y" ? " active" : "") + "' data-dur='" + d + "' onClick='mfuChangeDuration(\"" + d + "\")'>" + d + "</button>";
                }).join("")
            + "</div>"
            + "<div class='mf_land_actions' data-html2canvas-ignore='true'>"
              + "<button type='button' class='apt_pro_btn apt_pro_btn_reset' onClick='mfuClearSelected()'>초기화</button>"
              + "<button type='button' class='mf_m_pick_btn' onClick='mfuToggleLandPicker()'><i class='fa-solid fa-plus'></i> 항목추가</button>"
              + "<button type='button' class='mf_m_expand_btn' onClick='mfuDownloadChartImage(this, event, true)' title='이미지 저장'><i class='fa-solid fa-camera'></i></button>"
              + "<button type='button' class='mf_land_close' onClick='mfuCloseLandscapeModal()'><i class='fa-solid fa-xmark'></i></button>"
            + "</div>"
          + "</div>"
          + "<div class='mf_land_subbar' data-html2canvas-ignore='true'>"
            + "<div class='mf_land_presets' id='mf_land_presets'></div>"
            + "<div class='mf_land_sub_right'>"
              + "<span class='mf_m_count' id='mf_land_count'></span>"
              + "<label class='mf_tooltip_toggle_label'><input type='checkbox' id='mf_land_tooltip_cb' checked onChange='mfuToggleTooltip(this.checked)'><span>상세팝업표시</span></label>"
            + "</div>"
          + "</div>"
          + "<div class='mf_land_picker_drawer' id='mf_land_picker_drawer' style='display:none;' data-html2canvas-ignore='true'>"
            + "<div class='mf_land_picker_head'>"
              + "<select class='form-select form-select-sm' id='mf_land_group_filter' style='width:160px;' onChange='mfuRenderLandPickerGrid()'></select>"
              + "<input type='text' class='form-control form-control-sm' id='mf_land_search_input' style='max-width:240px;' placeholder='지표 / 지역명 검색...' onInput='mfuRenderLandPickerGrid()'>"
              + "<button type='button' class='mf_m_pick_btn ms-auto' onClick='mfuToggleLandPicker(false)'>완료</button>"
            + "</div>"
            + "<div class='mf_land_picker_grid' id='mf_land_picker_grid'></div>"
          + "</div>"
          + "<div class='mf_land_chart_box'><canvas id='MFU_Landscape_Chart'></canvas></div>"
        + "</div>"
      + "</div>";
    $("body").append(overlay);
  }

  return h;
}

// ============================================================
// Init & Interactions
// ============================================================
function initMoneyFlowUnified(isMobileUI) {
  mfuIsMobileUI = !!isMobileUI;
  if (typeof moneyflow_apt_market !== "undefined" && moneyflow_apt_market) {
    mfuAllAptRegions = mfuExtractAptRegions(moneyflow_apt_market);
    mfuSelectedApt = mfuSelectedApt.filter(function(r) { return mfuAllAptRegions.indexOf(r) !== -1; });
  }
  mfuRefreshAllUI();
}

function mfuRefreshAllUI() {
  mfuRenderPresetsBar();
  mfuPopulateGroupFilter();
  mfuRenderPickerGrid();
  var payload = mfuRenderMainChart();
  mfuRenderSelectedTags(payload.latestMap);

  if (mfuMode === "global" && typeof moneyflow_updated !== "undefined") {
    $("#mfu_updated_label").text(moneyflow_updated);
  } else if (mfuMode === "realestate" && typeof moneyflow_apt_updated !== "undefined") {
    $("#mfu_updated_label").text(moneyflow_apt_updated);
  }
}

function mfuSwitchMode(mode) {
  if (mode !== "global" && mode !== "realestate") return;
  mfuMode = mode;
  ["#mfu_mode_switch", "#mf_land_mode_switch"].forEach(function(sel) {
    var $sw = $(sel);
    $sw.attr("data-mode", mode);
    $sw.find(".mf_mode_btn").removeClass("active");
    $sw.find('.mf_mode_btn[data-mode="' + mode + '"]').addClass("active");
  });
  $("#mfu_search_input, #mf_land_search_input").val("");
  mfuRefreshAllUI();
  if ($("#mfLandscapeOverlay").is(":visible")) {
    mfuSyncLandscapeUI();
  }
}

function mfuChangeDuration(dur) {
  mfuDuration = dur;
  $("#mfu_dur_" + dur).prop("checked", true);
  $(".mf_land_dur_btn").removeClass("active");
  $('.mf_land_dur_btn[data-dur="' + dur + '"]').addClass("active");
  var payload = mfuRenderMainChart();
  mfuRenderSelectedTags(payload.latestMap);
  if ($("#mfLandscapeOverlay").is(":visible")) {
    mfuRenderLandscapeChart();
  }
}

function mfuToggleTooltip(enabled) {
  mfuTooltipEnabled = !!enabled;
  $("#mfu_tooltip_cb, #mf_land_tooltip_cb").prop("checked", mfuTooltipEnabled);
  [mfuChartGlobal, mfuChartLandscape].forEach(function(ch) {
    if (ch) {
      if (!ch.options.plugins.tooltip) ch.options.plugins.tooltip = {};
      ch.options.plugins.tooltip.enabled = mfuTooltipEnabled;
      if (!mfuTooltipEnabled && typeof ch.setActiveElements === "function") ch.setActiveElements([]);
      ch.update("none");
    }
  });
}

function mfuToggleBaseAsset(which) {
  if (which === "us") mfuShowUsAsset = !mfuShowUsAsset;
  if (which === "ko") mfuShowKoAsset = !mfuShowKoAsset;
  var payload = mfuRenderMainChart();
  mfuRenderSelectedTags(payload.latestMap);
}

function mfuRenderPresetsBar() {
  var $bar = $("#mfu_presets_bar");
  if ($bar.length === 0) return;
  var html = "";
  if (mfuMode === "global") {
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"us_stock\")'>미국 증시</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"ko_stock\")'>한국 증시</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"gold_btc_fx\")'>금·코인·환율</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"oil_gold\")'>유가·원자재</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"apt\")'>주요 아파트</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"liquidity\")'>통화·유동성</button>";
  } else {
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"major\")'>주요 권역</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"seoul_core\")'>서울 핵심구</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"gyeonggi_core\")'>경기 핵심지</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"metro6\")'>광역시/세종</button>";
  }
  if (!mfuIsMobileUI) {
    html += "<button type='button' class='apt_pro_btn apt_pro_btn_reset' onClick='mfuClearSelected()'>초기화</button>";
    var open = $("#mfu_picker_box").is(":visible");
    var label = (mfuMode === "global" ? "지표 선택 " : "지역 선택 ") + (open ? "접기 ▴" : "펼치기 ▾");
    html += "<button type='button' class='apt_pro_btn apt_pro_btn_toggle' id='mfu_toggle_btn' onClick='mfuTogglePcPicker()'>" + label + "</button>";
  }
  $bar.html(html);
}

function mfuTogglePcPicker() {
  var $box = $("#mfu_picker_box");
  if ($box.is(":visible")) {
    $box.slideUp(140, mfuRenderPresetsBar);
  } else {
    $box.slideDown(140, mfuRenderPresetsBar);
  }
}

function mfuOpenMobilePicker() {
  $("#mf_m_picker_title").text(mfuMode === "global" ? "Global 비교 지표 선택" : "Real Estate 지역 선택 (" + mfuAllAptRegions.length + "개)");
  mfuPopulateGroupFilter();
  mfuRenderPickerGrid();
  var el = document.getElementById("mfMobilePickerOffcanvas");
  if (el && window.bootstrap && bootstrap.Offcanvas) {
    bootstrap.Offcanvas.getOrCreateInstance(el).show();
  }
}

function mfuPopulateGroupFilter() {
  var $sel = $("#mfu_group_filter");
  if ($sel.length === 0) return;
  $sel.empty();

  var groups = [];
  var seen = {};
  if (mfuMode === "global") {
    MFU_GLOBAL_ITEMS.forEach(function(it) {
      if (!seen[it.group]) { seen[it.group] = 1; groups.push(it.group); }
    });
    $sel.append("<option value='ALL'>전체 카테고리 (" + MFU_GLOBAL_ITEMS.length + ")</option>");
    groups.forEach(function(g) {
      var cnt = MFU_GLOBAL_ITEMS.filter(function(it) { return it.group === g; }).length;
      $sel.append("<option value='" + g + "'>" + g + " (" + cnt + ")</option>");
    });
  } else {
    mfuAllAptRegions.forEach(function(r) {
      var g = mfuGetRegionGroup(r);
      if (!seen[g]) { seen[g] = 1; groups.push(g); }
    });
    $sel.append("<option value='ALL'>전체 시/도 (" + mfuAllAptRegions.length + ")</option>");
    groups.forEach(function(g) {
      var cnt = mfuAllAptRegions.filter(function(r) { return mfuGetRegionGroup(r) === g; }).length;
      $sel.append("<option value='" + g + "'>" + g + " (" + cnt + ")</option>");
    });
  }
}

function mfuRenderPickerGrid() {
  var $grid = $("#mfu_picker_grid");
  if ($grid.length === 0) return;
  var grp = $("#mfu_group_filter").val() || "ALL";
  var kw = ($("#mfu_search_input").val() || "").trim().toLowerCase();
  $grid.empty();

  var list = [];
  var selectedArr = (mfuMode === "global") ? mfuSelectedGlobal : mfuSelectedApt;

  if (mfuMode === "global") {
    list = MFU_GLOBAL_ITEMS.filter(function(it) {
      if (grp !== "ALL" && it.group !== grp) return false;
      if (kw && it.key.toLowerCase().indexOf(kw) === -1 && it.group.toLowerCase().indexOf(kw) === -1) return false;
      return true;
    }).map(function(it) { return it.key; });
  } else {
    list = mfuAllAptRegions.filter(function(r) {
      if (grp !== "ALL" && mfuGetRegionGroup(r) !== grp) return false;
      if (kw && r.toLowerCase().indexOf(kw) === -1) return false;
      return true;
    });
  }

  if (list.length === 0) {
    $grid.append("<div class='apt_pro_count' style='grid-column:1/-1; padding:8px;'>검색 결과가 없습니다.</div>");
    return;
  }

  list.forEach(function(key) {
    var sel = selectedArr.indexOf(key) !== -1;
    var $lbl = $("<label class='apt_region_item" + (sel ? " selected" : "") + "'></label>");
    var $cb = $("<input type='checkbox'>").prop("checked", sel);
    $cb.on("change", function() { mfuToggleItem(key); });
    $lbl.append($cb).append($("<span></span>").text(key));
    $grid.append($lbl);
  });
}

function mfuToggleItem(key) {
  var arr = (mfuMode === "global") ? mfuSelectedGlobal : mfuSelectedApt;
  var idx = arr.indexOf(key);
  if (idx === -1) arr.push(key);
  else arr.splice(idx, 1);
  mfuRenderPickerGrid();
  var payload = mfuRenderMainChart();
  mfuRenderSelectedTags(payload.latestMap);
  if ($("#mfLandscapeOverlay").is(":visible")) {
    mfuRenderLandPickerGrid();
    mfuRenderLandscapeChart();
    mfuUpdateLandCount();
  }
}

function mfuApplyPreset(presetKey) {
  if (mfuMode === "global") {
    mfuSelectedGlobal = (MFU_GLOBAL_PRESETS[presetKey] || []).slice();
  } else {
    mfuSelectedApt = (MFU_APT_PRESETS[presetKey] || []).filter(function(r) {
      return mfuAllAptRegions.indexOf(r) !== -1;
    });
    mfuAptColorMap = {};
  }
  mfuRenderPickerGrid();
  var payload = mfuRenderMainChart();
  mfuRenderSelectedTags(payload.latestMap);
  if ($("#mfLandscapeOverlay").is(":visible")) {
    mfuRenderLandPickerGrid();
    mfuRenderLandscapeChart();
    mfuUpdateLandCount();
  }
}

function mfuClearSelected() {
  if (mfuMode === "global") mfuSelectedGlobal = [];
  else { mfuSelectedApt = []; mfuAptColorMap = {}; }
  mfuRenderPickerGrid();
  var payload = mfuRenderMainChart();
  mfuRenderSelectedTags(payload.latestMap);
  if ($("#mfLandscapeOverlay").is(":visible")) {
    mfuRenderLandPickerGrid();
    mfuRenderLandscapeChart();
    mfuUpdateLandCount();
  }
}

function mfuRenderSelectedTags(latestMap) {
  var $tags = $("#mfu_selected_tags");
  if ($tags.length === 0) return;
  $tags.empty();
  latestMap = latestMap || {};

  // 모바일에서는 태그가 범례 역할을 겸하므로 미국/한국 통화량 토글 칩도 함께 표시 (숫자 제외)
  if (mfuIsMobileUI) {
    $tags.append(
      "<span class='apt_tag mfu_base_tag" + (mfuShowUsAsset ? "" : " is_off") + "' onClick='mfuToggleBaseAsset(\"us\")'>"
      + "<span class='apt_tag_dot' style='background:#d12145;'></span>미국 통화량</span>"
    );
    $tags.append(
      "<span class='apt_tag mfu_base_tag" + (mfuShowKoAsset ? "" : " is_off") + "' onClick='mfuToggleBaseAsset(\"ko\")'>"
      + "<span class='apt_tag_dot' style='background:#571091;'></span>한국 통화량</span>"
    );
  }

  var arr = (mfuMode === "global") ? mfuSelectedGlobal : mfuSelectedApt;
  if (arr.length === 0 && !mfuIsMobileUI) {
    var msg = (mfuMode === "global")
      ? "선택된 비교 지표가 없습니다. (현재 미국·한국 통화량만 표시 중)"
      : "선택된 부동산 지역이 없습니다. (현재 미국·한국 통화량만 표시 중)";
    $tags.append("<span class='apt_pro_count'>" + msg + "</span>");
  } else {
    arr.forEach(function(key, idx) {
      var color = "#0072B2";
      if (mfuMode === "global") {
        color = mfuGlobalColorMap[key] || "#0072B2";
      } else {
        color = mfuGetAptColor(key, idx);
      }
      var $tag = $("<span class='apt_tag' style='cursor:pointer;'></span>");
      $tag.append("<span class='apt_tag_dot' style='background:" + color + ";'></span>");
      $tag.append($("<span></span>").text(key));
      $tag.on("mouseenter", function() {
        if (!mfuIsMobileUI && typeof mfFocusByLabel === "function") {
          mfFocusByLabel(mfuChartGlobal, key);
        }
      }).on("mouseleave", function() {
        if (!mfuIsMobileUI && typeof mfFocusByLabel === "function") {
          mfFocusByLabel(mfuChartGlobal, null);
        }
      }).on("click", function(e) {
        if ($(e.target).hasClass("apt_tag_remove")) return;
        if (mfuIsMobileUI && typeof mfFocusByLabel === "function") {
          mfuFocusedLabel = (mfuFocusedLabel === key) ? null : key;
          mfFocusByLabel(mfuChartGlobal, mfuFocusedLabel);
        }
      });
      var $rm = $("<span class='apt_tag_remove' title='제거'>&times;</span>");
      $rm.on("click", function(e) {
        e.stopPropagation();
        if (mfuFocusedLabel === key) mfuFocusedLabel = null;
        mfuToggleItem(key);
      });
      $tag.append($rm);
      $tags.append($tag);
    });
  }

  var total = (mfuMode === "global") ? MFU_GLOBAL_ITEMS.length : mfuAllAptRegions.length;
  var unit = (mfuMode === "global") ? "지표" : "지역";
  $("#mfu_count_label").text("전체 " + total + "개 " + unit + " 중 " + arr.length + "개 선택됨");
}

function mfuRenderMainChart() {
  var payload = mfuBuildChartPayload(mfuMode, mfuDuration);
  if (mfuChartGlobal) {
    mfuChartGlobal.destroy();
    mfuChartGlobal = null;
  }
  mfuChartGlobal = mfuDrawChartInstance("MFU_Main_Chart", payload, {
    isMobile: mfuIsMobileUI,
    showLegend: !mfuIsMobileUI
  });
  return payload;
}

// ============================================================
// 모바일 가로 크게 보기 모달 (세로와 동일한 전체 컨트롤)
// ============================================================
function mfuUpdateLandCount() {
  var arr = (mfuMode === "global") ? mfuSelectedGlobal : mfuSelectedApt;
  var total = (mfuMode === "global") ? MFU_GLOBAL_ITEMS.length : mfuAllAptRegions.length;
  var unit = (mfuMode === "global") ? "지표" : "지역";
  $("#mf_land_count").text("전체 " + total + "개 " + unit + " 중 " + arr.length + "개 선택됨");
}

function mfuSyncLandscapeUI() {
  var $sw = $("#mf_land_mode_switch");
  $sw.attr("data-mode", mfuMode);
  $sw.find(".mf_mode_btn").removeClass("active");
  $sw.find('.mf_mode_btn[data-mode="' + mfuMode + '"]').addClass("active");

  $(".mf_land_dur_btn").removeClass("active");
  $('.mf_land_dur_btn[data-dur="' + mfuDuration + '"]').addClass("active");
  $("#mf_land_tooltip_cb").prop("checked", mfuTooltipEnabled);

  // 프리셋 동기화
  var html = "";
  if (mfuMode === "global") {
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"us_stock\")'>미국 증시</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"ko_stock\")'>한국 증시</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"gold_btc_fx\")'>금·코인·환율</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"oil_gold\")'>유가·원자재</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"apt\")'>주요 아파트</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"liquidity\")'>통화·유동성</button>";
  } else {
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"major\")'>주요 권역</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"seoul_core\")'>서울 핵심구</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"gyeonggi_core\")'>경기 핵심지</button>";
    html += "<button type='button' class='apt_pro_btn' onClick='mfuApplyPreset(\"metro6\")'>광역시/세종</button>";
  }
  $("#mf_land_presets").html(html);

  // 가로 모드 드로어 그룹 필터 채우기
  var $sel = $("#mf_land_group_filter");
  if ($sel.length > 0) {
    $sel.html($("#mfu_group_filter").html());
  }
  mfuRenderLandPickerGrid();
  mfuUpdateLandCount();
  mfuRenderLandscapeChart();
}

function mfuToggleLandPicker(forceState) {
  var $drawer = $("#mf_land_picker_drawer");
  if ($drawer.length === 0) return;
  var shouldShow = (typeof forceState === "boolean") ? forceState : !$drawer.is(":visible");
  if (shouldShow) {
    $("#mf_land_group_filter").html($("#mfu_group_filter").html());
    mfuRenderLandPickerGrid();
    $drawer.slideDown(140);
  } else {
    $drawer.slideUp(140);
  }
}

function mfuRenderLandPickerGrid() {
  var $grid = $("#mf_land_picker_grid");
  if ($grid.length === 0) return;
  var grp = $("#mf_land_group_filter").val() || "ALL";
  var kw = ($("#mf_land_search_input").val() || "").trim().toLowerCase();
  $grid.empty();

  var selectedArr = (mfuMode === "global") ? mfuSelectedGlobal : mfuSelectedApt;
  var list = (mfuMode === "global")
    ? MFU_GLOBAL_ITEMS.filter(function(it) {
        if (grp !== "ALL" && it.group !== grp) return false;
        if (kw && it.key.toLowerCase().indexOf(kw) === -1 && it.group.toLowerCase().indexOf(kw) === -1) return false;
        return true;
      }).map(function(it) { return it.key; })
    : mfuAllAptRegions.filter(function(r) {
        if (grp !== "ALL" && mfuGetRegionGroup(r) !== grp) return false;
        if (kw && r.toLowerCase().indexOf(kw) === -1) return false;
        return true;
      });

  if (list.length === 0) {
    $grid.append("<div class='apt_pro_count' style='grid-column:1/-1; padding:6px;'>검색 결과가 없습니다.</div>");
    return;
  }

  list.forEach(function(key) {
    var sel = selectedArr.indexOf(key) !== -1;
    var $lbl = $("<label class='apt_region_item" + (sel ? " selected" : "") + "'></label>");
    var $cb = $("<input type='checkbox'>").prop("checked", sel);
    $cb.on("change", function() { mfuToggleItem(key); });
    $lbl.append($cb).append($("<span></span>").text(key));
    $grid.append($lbl);
  });
}

function mfuOpenLandscapeModal() {
  $("#mf_land_picker_drawer").hide();
  $("#mfLandscapeOverlay").fadeIn(140, function() {
    mfuSyncLandscapeUI();
  });
}

function mfuCloseLandscapeModal() {
  $("#mf_land_picker_drawer").hide();
  $("#mfLandscapeOverlay").fadeOut(120, function() {
    if (mfuChartLandscape) {
      mfuChartLandscape.destroy();
      mfuChartLandscape = null;
    }
  });
}

function mfuRenderLandscapeChart() {
  var payload = mfuBuildChartPayload(mfuMode, mfuDuration);
  if (mfuChartLandscape) {
    mfuChartLandscape.destroy();
    mfuChartLandscape = null;
  }
  mfuChartLandscape = mfuDrawChartInstance("MFU_Landscape_Chart", payload, {
    isMobile: false,
    showLegend: true
  });
}

// ============================================================
// 고해상도 이미지 저장 (PC / 모바일 세로 / 모바일 가로 모두 동일한 웹 레이아웃 PNG로 통일)
// ============================================================
function mfuDownloadChartImage(btnEl, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  if (typeof html2canvas === "undefined") {
    alert("이미지 캡처 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
    return;
  }

  var now = new Date();
  var YYYY = now.getFullYear();
  var MM = String(now.getMonth() + 1).padStart(2, "0");
  var DD = String(now.getDate()).padStart(2, "0");
  var hh = String(now.getHours()).padStart(2, "0");
  var mm = String(now.getMinutes()).padStart(2, "0");
  var ss = String(now.getSeconds()).padStart(2, "0");
  var timestamp = YYYY + MM + DD + "_" + hh + mm + ss;
  var captureDateTimeStr = YYYY + "-" + MM + "-" + DD + " " + hh + ":" + mm + ":" + ss;
  var modeLabel = (mfuMode === "realestate") ? "RealEstate" : "Global";
  var filename = "MoneyFlow_" + modeLabel + "_" + timestamp + ".png";

  var $btn = $(btnEl);
  var origHtml = $btn.html();
  $btn.prop("disabled", true).html('<div class="spinner-border spinner-border-sm" role="status" style="width:12px; height:12px; border-width:2px;"></div>');

  var updatedStr = (mfuMode === "realestate")
    ? (typeof moneyflow_apt_updated !== "undefined" ? moneyflow_apt_updated : "")
    : (typeof moneyflow_updated !== "undefined" ? moneyflow_updated : "");

  // 1. 오프스크린에 PC 웹과 동일한 1200px 표준 카드 생성
  var stage = document.createElement("div");
  stage.style.cssText = [
    "position:fixed",
    "left:-99999px",
    "top:0",
    "width:1200px",
    "background:#ffffff",
    "border:1px solid #cbd5e1",
    "border-radius:4px",
    "font-family:'Noto Sans KR', -apple-system, sans-serif",
    "box-sizing:border-box",
    "padding-bottom:12px",
    "z-index:-1"
  ].join(";");

  var durButtonsHtml = ["1Y", "3Y", "5Y", "10Y", "15Y", "20Y", "30Y"].map(function(d) {
    var active = (d === mfuDuration);
    return "<span style='display:inline-flex;align-items:center;justify-content:center;width:44px;height:24px;border-radius:4px;font-size:12px;font-weight:700;"
      + (active
        ? "background:#d12145;color:#ffffff;border:none;"
        : "background:transparent;color:#000000;border:none;")
      + "'>" + d + "</span>";
  }).join("");

  var pillGlobalStyle = (mfuMode === "global")
    ? "background:#1355ac;color:#ffffff;"
    : "background:transparent;color:#475569;";
  var pillReStyle = (mfuMode === "realestate")
    ? "background:#1355ac;color:#ffffff;"
    : "background:transparent;color:#475569;";

  stage.innerHTML =
    "<div style='display:flex;align-items:center;justify-content:space-between;background:#f3f3f3;border-bottom:1px solid #cccccc;padding:8px 14px;gap:12px;'>"
      + "<div style='display:inline-flex;align-items:center;gap:8px;color:#1355ac;font-size:17px;font-weight:700;'>"
        + mfuSvgLogo()
        + "<span>MoneyFlow</span>"
        + "<span style='display:inline-grid;grid-template-columns:1fr 1fr;background:#e2e8f0;border-radius:999px;padding:2px;width:176px;height:26px;box-sizing:border-box;'>"
          + "<span style='display:inline-flex;align-items:center;justify-content:center;border-radius:999px;font-size:11px;font-weight:700;" + pillGlobalStyle + "'>Global</span>"
          + "<span style='display:inline-flex;align-items:center;justify-content:center;border-radius:999px;font-size:11px;font-weight:700;" + pillReStyle + "'>Real Estate</span>"
        + "</span>"
        + "<span style='font-size:12px;font-weight:500;color:#64748b;'>(2019년 6월 = 1.00)</span>"
      + "</div>"
      + "<div style='display:inline-flex;align-items:center;gap:4px;'>" + durButtonsHtml + "</div>"
      + "<div style='font-size:12px;color:#999999;font-weight:500;white-space:nowrap;'>" + updatedStr + "</div>"
    + "</div>"
    + "<div style='width:1180px;height:480px;margin:10px auto 0 auto;position:relative;'>"
      + "<canvas id='MFU_Offscreen_Capture_Canvas' width='1180' height='480' style='width:1180px;height:480px;display:block;'></canvas>"
    + "</div>"
    + "<div style='display:flex;justify-content:space-between;align-items:center;margin:10px 14px 0 14px;padding-top:8px;border-top:1px dashed #e2e8f0;font-size:11px;'>"
      + "<div style='display:flex;flex-direction:column;line-height:1.25;font-size:9px;color:#94a3b8;'><span>Captured at</span><span>" + captureDateTimeStr + "</span></div>"
      + "<div style='display:flex;align-items:center;gap:4px;'><span style='font-weight:700;color:#1355ac;font-size:12px;'>리얼랭커스</span><span style='color:#cbd5e1;font-size:10px;'>|</span><span style='color:#64748b;font-size:12px;'>realrankus.com</span></div>"
    + "</div>";

  document.body.appendChild(stage);

  // 2. 오프스크린 캔버스에 PC 웹 스타일(좌측 범례 + 애니메이션 없음 + 고해상도 DPR)로 즉시 렌더링
  var payload = mfuBuildChartPayload(mfuMode, mfuDuration);
  // 통화량 선 두께도 PC 표준(4px)으로 통일
  var webDatasets = payload.datasets.map(function(ds, idx) {
    var copy = Object.assign({}, ds);
    if (idx < 2) copy.borderWidth = 4;
    return copy;
  });

  var offCanvas = stage.querySelector("#MFU_Offscreen_Capture_Canvas");
  var offPlugins = [ChartDataLabels];
  if (typeof mfEndLabelPlugin !== "undefined") offPlugins.push(mfEndLabelPlugin);
  var offChart = new Chart(offCanvas.getContext("2d"), {
    type: "line",
    plugins: offPlugins,
    data: { labels: payload.labels, datasets: webDatasets },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      devicePixelRatio: 2,
      animation: false,
      animations: false,
      transitions: false,
      layout: { padding: { left: 0, right: 132, top: 12, bottom: 10 } },
      scales: {
        y: { display: false },
        x: {
          ticks: { maxRotation: 60, font: { size: 10 } }
        }
      },
      plugins: {
        tooltip: { enabled: false },
        mfEndLabels: { enabled: true, compact: false },
        legend: {
          display: true,
          position: "left",
          align: "start",
          labels: { boxWidth: 10, boxHeight: 10, font: { size: 11 } }
        },
        title: { display: false },
        datalabels: {
          display: "auto",
          color: "black",
          align: "top",
          anchor: "start",
          padding: 2,
          textAlign: "center",
          font: { size: 11 },
          formatter: function(value) {
            if (value === null || value === undefined || isNaN(value)) return "";
            return value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
          }
        }
      }
    }
  });
  offChart.update("none");
  offChart.render();

  function cleanup() {
    try { offChart.destroy(); } catch (e) {}
    if (stage && stage.parentNode) stage.parentNode.removeChild(stage);
    $btn.prop("disabled", false).html(origHtml);
  }

  requestAnimationFrame(function() {
    setTimeout(function() {
      html2canvas(stage, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: function(clonedDoc) {
          var clonedCanvas = clonedDoc.getElementById("MFU_Offscreen_Capture_Canvas");
          if (clonedCanvas && offCanvas) {
            clonedCanvas.width = offCanvas.width;
            clonedCanvas.height = offCanvas.height;
            var ctx = clonedCanvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, clonedCanvas.width, clonedCanvas.height);
              ctx.drawImage(offCanvas, 0, 0);
            }
          }
        }
      }).then(function(canvas) {
        cleanup();
        var base64Data = canvas.toDataURL("image/png");
        if (window.Android && typeof window.Android.downloadImage === "function") {
          window.Android.downloadImage(base64Data, filename);
        } else {
          var link = document.createElement("a");
          link.href = base64Data;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        if (typeof toastr !== "undefined") {
          toastr.success("MoneyFlow 이미지가 저장되었습니다.");
        }
      }).catch(function(err) {
        cleanup();
        console.error("MoneyFlow capture error:", err);
        alert("이미지 저장 중 문제가 발생했습니다: " + (err.message || err));
      });
    }, 80);
  });
}
