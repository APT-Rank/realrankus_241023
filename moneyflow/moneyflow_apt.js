var moneyflow_apt_market = null;
var daily_market_apt = null;
var monthly_market_apt = null;
var moneyflow_apt_updated = "";
var currentAptDuration = "5Y";
var allAptRegions = [];
var selectedAptRegions = ["전국", "수도권", "서울시"];
var regionColorMap = {};

var APT_PRESETS = {
  major: ["전국", "수도권", "지방권", "서울시", "경기도", "6대광역시"],
  seoul_core: ["서울시 강남구", "서울시 서초구", "서울시 송파구", "서울시 용산구", "서울시 성동구", "서울시 마포구"],
  gyeonggi_core: ["경기도 과천시", "경기도 성남시 분당구", "경기도 용인시 수지구", "경기도 화성시 동탄구", "경기도 하남시", "경기도 광명시"],
  metro6: ["부산시", "대구시", "인천시", "대전시", "울산시", "세종시"]
};

var BROAD_REGIONS = ["전국", "수도권", "지방권", "6대광역시", "5대광역시", "9개도", "8개도"];

function getRegionGroup(regionName) {
  if (BROAD_REGIONS.indexOf(regionName) !== -1) {
    return "광역/권역";
  }
  return regionName.split(" ")[0];
}

function sliceByDuration(arr, duration) {
  if (!Array.isArray(arr)) return [];
  if (duration === "1Y") return arr.slice(-12);
  if (duration === "3Y") return arr.slice(-36);
  if (duration === "5Y") return arr.slice(-60);
  if (duration === "10Y") return arr.slice(-120);
  if (duration === "15Y") return arr.slice(-180);
  if (duration === "20Y") return arr.slice(-240);
  if (duration === "30Y") return arr.slice(-360);
  return arr.slice(-60);
}

function getAptTimeArr(duration) {
  var arr = Object.values(moneyflow_apt_market["TIME"] || {});
  return sliceByDuration(arr, duration);
}

function getAptNorArr(key, duration, zeroToNull) {
  var obj = moneyflow_apt_market[key];
  if (!obj) return [];
  var sliced = sliceByDuration(Object.values(obj), duration);
  return sliced.map(function(x) {
    if (x === null || x === undefined || isNaN(x)) return null;
    var val = Math.round(Number(x) * 1000) / 1000;
    if (zeroToNull && val === 0) return null;
    return val;
  });
}

function extractAllAptRegions(data) {
  var reserved = {
    "TIME": true,
    "GENERATE": true,
    "BOK_Total_Asset": true,
    "FRED_Total_Asset": true,
    "BOK_Total_Asset_NOR": true,
    "FRED_Total_Asset_NOR": true
  };
  var regions = [];
  Object.keys(data).forEach(function(key) {
    if (reserved[key]) return;
    if (key.endsWith("_NOR")) return;
    if (data[key + "_NOR"]) {
      regions.push(key);
    }
  });
  return regions;
}

function assignRegionColors() {
  if (typeof mfSyncColorMap === "function") {
    mfSyncColorMap(selectedAptRegions, regionColorMap);
    return;
  }
  selectedAptRegions.forEach(function(region, idx) {
    if (!regionColorMap[region]) {
      regionColorMap[region] = getAptRegionColor(idx);
    }
  });
}

function populateSidoFilter() {
  var groups = [];
  var seen = {};
  allAptRegions.forEach(function(region) {
    var g = getRegionGroup(region);
    if (!seen[g]) {
      seen[g] = true;
      groups.push(g);
    }
  });

  var $select = $("#apt_sido_filter");
  $select.empty();
  $select.append('<option value="ALL">전체 시/도 (' + allAptRegions.length + ')</option>');
  groups.forEach(function(g) {
    var count = allAptRegions.filter(function(r) { return getRegionGroup(r) === g; }).length;
    $select.append('<option value="' + g + '">' + g + ' (' + count + ')</option>');
  });
}

function renderSelectedTags() {
  var $tags = $("#apt_selected_tags");
  $tags.empty();

  assignRegionColors();
  if (selectedAptRegions.length === 0) {
    $tags.append('<span class="apt_pro_count">선택된 부동산 지역이 없습니다. (현재 미국·한국 통화량만 표시 중)</span>');
  } else {
    selectedAptRegions.forEach(function(region, idx) {
      var color = regionColorMap[region] || getAptRegionColor(idx);
      var $tag = $('<span class="apt_tag" style="cursor:pointer;"></span>');
      $tag.append('<span class="apt_tag_dot" style="background:' + color + ';"></span>');
      $tag.append($('<span></span>').text(region));
      $tag.on("mouseenter", function() {
        if (typeof mfFocusByLabel === "function") mfFocusByLabel(myMoneyFlowApt_Chart, region);
      }).on("mouseleave", function() {
        if (typeof mfFocusByLabel === "function") mfFocusByLabel(myMoneyFlowApt_Chart, null);
      });
      var $remove = $('<span class="apt_tag_remove" title="제거">&times;</span>');
      $remove.on("click", function() {
        toggleAptRegion(region);
      });
      $tag.append($remove);
      $tags.append($tag);
    });
  }

  $("#apt_region_count").text("전체 " + allAptRegions.length + "개 지역 중 " + selectedAptRegions.length + "개 선택됨");
}

function renderRegionGrid() {
  var sido = $("#apt_sido_filter").val() || "ALL";
  var keyword = ($("#apt_region_search").val() || "").trim().toLowerCase();

  var filtered = allAptRegions.filter(function(region) {
    if (sido !== "ALL" && getRegionGroup(region) !== sido) return false;
    if (keyword && region.toLowerCase().indexOf(keyword) === -1) return false;
    return true;
  });

  var $grid = $("#apt_region_grid");
  $grid.empty();

  if (filtered.length === 0) {
    $grid.append('<div class="apt_pro_count" style="grid-column: 1 / -1; padding: 8px;">검색 결과가 없습니다.</div>');
    return;
  }

  filtered.forEach(function(region) {
    var isSelected = selectedAptRegions.indexOf(region) !== -1;
    var $item = $('<label class="apt_region_item' + (isSelected ? ' selected' : '') + '"></label>');
    var $cb = $('<input type="checkbox">').prop("checked", isSelected);
    $cb.on("change", function() {
      toggleAptRegion(region);
    });
    $item.append($cb);
    $item.append($('<span></span>').text(region));
    $grid.append($item);
  });
}

function toggleAptRegion(region) {
  var idx = selectedAptRegions.indexOf(region);
  if (idx === -1) {
    selectedAptRegions.push(region);
    if (!regionColorMap[region]) {
      regionColorMap[region] = getAptRegionColor(selectedAptRegions.length - 1);
    }
  } else {
    selectedAptRegions.splice(idx, 1);
  }
  renderSelectedTags();
  renderRegionGrid();
  renderAptChart();
}

function applyAptPreset(presetKey) {
  var list = APT_PRESETS[presetKey] || [];
  selectedAptRegions = list.filter(function(r) {
    return allAptRegions.indexOf(r) !== -1;
  });
  regionColorMap = {};
  assignRegionColors();
  renderSelectedTags();
  renderRegionGrid();
  renderAptChart();
}

function clearSelectedRegions() {
  selectedAptRegions = [];
  regionColorMap = {};
  renderSelectedTags();
  renderRegionGrid();
  renderAptChart();
}

function changeAptDuration(duration) {
  currentAptDuration = duration;
  renderAptChart();
}

function getLatestValidNumber(obj) {
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

function returnLastValueRate(obj, latestVal, stdIndex) {
  if (!obj || latestVal === null || latestVal === undefined || isNaN(latestVal) || stdIndex < 0) {
    return null;
  }
  var vals = Object.values(obj);
  var baseVal = Number(vals[stdIndex]);
  if (!baseVal || isNaN(baseVal)) return null;
  return Number((Number(latestVal) / baseVal).toFixed(2));
}

function renderAptChart() {
  if (!moneyflow_apt_market) return;

  var mf_time_arr = getAptTimeArr(currentAptDuration).slice();
  var mf_us_total_asset = getAptNorArr("FRED_Total_Asset_NOR", currentAptDuration, false);
  var mf_ko_total_asset = getAptNorArr("BOK_Total_Asset_NOR", currentAptDuration, false);

  // 기준일(2019-06-01) 인덱스 계산 후 "현재" 포인트 연결 (index_pro.html과 동일 컨셉)
  var timeValues = Object.values(moneyflow_apt_market["TIME"] || {});
  var stdIndex = timeValues.indexOf("2019-06-01");

  var latestUsAsset = (daily_market_apt && getLatestValidNumber(daily_market_apt["FRED_Total_Asset"]))
    || getLatestValidNumber(moneyflow_apt_market["FRED_Total_Asset"]);
  var latestKoAsset = (monthly_market_apt && getLatestValidNumber(monthly_market_apt["BOK_Total_Asset"]))
    || getLatestValidNumber(moneyflow_apt_market["BOK_Total_Asset"]);

  mf_time_arr.push("현재");
  mf_us_total_asset.push(returnLastValueRate(moneyflow_apt_market["FRED_Total_Asset"], latestUsAsset, stdIndex));
  mf_ko_total_asset.push(returnLastValueRate(moneyflow_apt_market["BOK_Total_Asset"], latestKoAsset, stdIndex));

  var datasets = [
    {
      label: "미국 통화량",
      data: mf_us_total_asset,
      borderColor: "#d12145",
      backgroundColor: "#d12145",
      pointRadius: 0,
      borderWidth: 4,
      tension: 0.2,
      hidden: false
    },
    {
      label: "한국 통화량",
      data: mf_ko_total_asset,
      borderColor: "#571091",
      backgroundColor: "#571091",
      pointRadius: 0,
      borderWidth: 4,
      tension: 0.2,
      hidden: false
    }
  ];

  selectedAptRegions.forEach(function(region, idx) {
    var color = regionColorMap[region] || getAptRegionColor(idx);
    regionColorMap[region] = color;
    var regionArr = getAptNorArr(region + "_NOR", currentAptDuration, true);
    regionArr.push(null); // "현재" 시점 자리 맞춤
    datasets.push({
      label: region,
      data: regionArr,
      borderColor: color,
      backgroundColor: color,
      pointRadius: 0,
      borderWidth: 2,
      tension: 0.2,
      hidden: false
    });
  });

  drawMoneyFlowAptChart(mf_time_arr, datasets, "MoneyFlow_APT_Chart");
}

function toggleAptRegionPanel() {
  var $box = $("#apt_region_picker_box");
  var $btn = $("#apt_grid_toggle_btn");
  if ($box.length === 0) return;
  if ($box.is(":visible")) {
    $box.slideUp(150);
    $btn.text("지역 선택 펼치기 ▾");
  } else {
    $box.slideDown(150);
    $btn.text("지역 선택 접기 ▴");
  }
}

function downloadMoneyFlowAptImage(btnEl, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  var $btn = $(btnEl);
  var targetId = document.getElementById("Money_Flow_APT") ? "Money_Flow_APT" : "Money_Flow";
  var targetDom = document.getElementById(targetId);
  if (!targetDom || typeof html2canvas === "undefined") {
    alert("이미지 캡처를 준비하지 못했습니다.");
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
  var filename = "MoneyFlow_APT_" + timestamp + ".png";

  var originalBtnHtml = $btn.html();
  $btn.css({ "background-color": "#333", "border-color": "#333" });
  $btn.prop("disabled", true).html('<div class="spinner-border spinner-border-sm text-white" role="status" style="width:14px; height:14px; border-width:2px; vertical-align:middle;"></div>');

  var targetWidth = 2400;
  var currentWidth = targetDom.offsetWidth || 1200;
  var dynamicScale = Math.min(5, Math.max(3, targetWidth / currentWidth));

  var canvasEl = document.getElementById("MoneyFlow_APT_Chart");
  var chart = myMoneyFlowApt_Chart;
  var originalDPR = chart ? (chart.options.devicePixelRatio || window.devicePixelRatio || 1) : 1;
  var origAnimations = chart ? chart.options.animations : null;

  if (chart) {
    if (typeof chart.stop === "function") chart.stop();
    chart.options.animation = false;
    chart.options.animations = false;
    chart.options.devicePixelRatio = Math.max(window.devicePixelRatio || 1, dynamicScale);
    chart.resize();
    chart.update("none");
    chart.render();
  }

  function restoreOriginals() {
    if (chart) {
      chart.options.animations = origAnimations;
      chart.options.devicePixelRatio = originalDPR;
      chart.resize();
      chart.update("none");
    }
    $btn.css({ "background-color": "", "border-color": "" });
    $btn.prop("disabled", false).html(originalBtnHtml);
  }

  requestAnimationFrame(function() {
    setTimeout(function() {
      html2canvas(targetDom, {
        scale: dynamicScale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        ignoreElements: function(el) {
          return el && el.classList && (
            el.classList.contains("card_download_wrapper") ||
            el.classList.contains("btn_card_download") ||
            el.classList.contains("apt_pro_toolbar")
          );
        },
        onclone: function(clonedDoc) {
          var clonedTarget = clonedDoc.getElementById(targetId);
          if (clonedTarget) {
            clonedTarget.style.backgroundColor = "#ffffff";
            clonedTarget.style.boxShadow = "none";
            clonedTarget.style.border = "1px solid #cbd5e1";

            var origCanvas = targetDom.querySelector("#MoneyFlow_APT_Chart");
            var clonedCanvas = clonedDoc.getElementById("MoneyFlow_APT_Chart");
            if (origCanvas && clonedCanvas) {
              clonedCanvas.width = origCanvas.width;
              clonedCanvas.height = origCanvas.height;
              var ctx = clonedCanvas.getContext("2d");
              if (ctx) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, clonedCanvas.width, clonedCanvas.height);
                ctx.drawImage(origCanvas, 0, 0);
              }
            }

            var footer = clonedDoc.createElement("div");
            footer.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin:10px 14px 0 14px; padding-top:8px; border-top:1px dashed #e2e8f0; font-family:"Noto Sans KR", -apple-system, sans-serif; font-size:11px;';
            footer.innerHTML =
              '<div style="display:flex; flex-direction:column; line-height:1.25; font-size:8px; color:#cbd5e1;"><span>Captured at</span><span>' + captureDateTimeStr + '</span></div>' +
              '<div style="display:flex; align-items:center; gap:4px;"><span style="font-weight:700; color:#1355ac; font-size:11px;">리얼랭커스</span><span style="color:#cbd5e1; font-size:10px;">|</span><span style="color:#64748b; font-size:11px;">realrankus.com</span></div>';
            clonedTarget.appendChild(footer);
          }
        }
      }).then(function(canvas) {
        restoreOriginals();
        var link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (typeof toastr !== "undefined") {
          toastr.success("MoneyFlow APT 이미지가 저장되었습니다.");
        }
      }).catch(function(err) {
        restoreOriginals();
        console.error("MoneyFlow APT capture error:", err);
        alert("이미지 저장 중 문제가 발생했습니다: " + (err.message || err));
      });
    }, 120);
  });
}

function initMoneyFlowApt(data) {
  moneyflow_apt_market = data;
  if (data["GENERATE"] && data["GENERATE"][0]) {
    moneyflow_apt_updated = String(data["GENERATE"][0]).substr(0, 19);
    $("#moneyflow_apt_updated").text(moneyflow_apt_updated);
  }
  allAptRegions = extractAllAptRegions(data);
  selectedAptRegions = selectedAptRegions.filter(function(r) {
    return allAptRegions.indexOf(r) !== -1;
  });
  assignRegionColors();
  populateSidoFilter();
  renderSelectedTags();
  renderRegionGrid();
  renderAptChart();
}

function initMoneyFlowAptInPro() {
  if (typeof daily_market !== "undefined" && daily_market) {
    daily_market_apt = daily_market;
  }
  if (typeof monthly_market !== "undefined" && monthly_market) {
    monthly_market_apt = monthly_market;
  }
  if (moneyflow_apt_market) {
    initMoneyFlowApt(moneyflow_apt_market);
    return;
  }
  var r2Url = "https://pub-94f5de39bb1c41df96475dfd371c08b2.r2.dev/moneyflow/market_moneyflow_apt.json";
  var localUrl = "./market_moneyflow_apt.json";
  $.getJSON(r2Url)
    .done(function(json) {
      initMoneyFlowApt(json);
    })
    .fail(function() {
      $.getJSON(localUrl)
        .done(function(json) {
          initMoneyFlowApt(json);
        })
        .fail(function() {
          $("#apt_region_count").text("데이터 로드 실패 (market_moneyflow_apt.json 확인 필요)");
        });
    });
}

$(document).ready(function() {
  // index_pro.html 내장 모드에서는 show_daily_info() -> initMoneyFlowAptInPro()가 초기화 담당
  if (typeof show_daily_info === "function") {
    return;
  }

  var localUrl = "./market_moneyflow_apt.json";
  var r2Url = "https://pub-94f5de39bb1c41df96475dfd371c08b2.r2.dev/moneyflow/market_moneyflow_apt.json";
  var dailyUrl = "https://pub-94f5de39bb1c41df96475dfd371c08b2.r2.dev/moneyflow/market_daily_info.json";
  var monthlyUrl = "https://pub-94f5de39bb1c41df96475dfd371c08b2.r2.dev/moneyflow/market_monthly_info.json";

  var loadDaily = $.getJSON(dailyUrl).done(function(json) {
    daily_market_apt = json;
  });
  var loadMonthly = $.getJSON(monthlyUrl).done(function(json) {
    monthly_market_apt = json;
  });

  function startWithAptData(json) {
    $.when(
      loadDaily.then(null, function() { return $.Deferred().resolve(); }),
      loadMonthly.then(null, function() { return $.Deferred().resolve(); })
    ).always(function() {
      initMoneyFlowApt(json);
    });
  }

  $.getJSON(r2Url)
    .done(function(json) {
      startWithAptData(json);
    })
    .fail(function() {
      $.getJSON(localUrl)
        .done(function(json) {
          startWithAptData(json);
        })
        .fail(function() {
          $("#apt_region_count").text("데이터 로드 실패 (market_moneyflow_apt.json 확인 필요)");
        });
    });
});
