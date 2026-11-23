// ============================================================
// MoneyFlow 차트 가독성 강화 모듈 (공용)
// 1) 포커스 하이라이트 + 포커스 선 전용 그림자/글로우
// 3) 지각적 고대비 12색 팔레트 + 미사용 슬롯 우선 배정
// 4) 선 우측 끝점 직접 라벨 (수직 겹침 자동 분산)
// ============================================================

var MF_HIGH_CONTRAST_PALETTE = [
  "#0072B2", // 딥 블루
  "#009E73", // 에메랄드
  "#E69F00", // 앰버 오렌지
  "#D55E00", // 버밀리온
  "#00A6D6", // 시안 블루
  "#7C9A00", // 올리브 그린
  "#8C564B", // 체스트넛 브라운
  "#E34A9F", // 마젠타 핑크
  "#1B365D", // 미드나잇 네이비
  "#3F7D20", // 포레스트 그린
  "#B8860B", // 다크 골든로드
  "#4A5568"  // 슬레이트 차콜
];

function mfHexToRgba(hex, alpha) {
  if (!hex || typeof hex !== "string") return "rgba(100,116,139," + alpha + ")";
  var c = hex.trim();
  if (c.indexOf("rgba(") === 0 || c.indexOf("rgb(") === 0) {
    var nums = c.match(/\d+/g);
    if (nums && nums.length >= 3) {
      return "rgba(" + nums[0] + "," + nums[1] + "," + nums[2] + "," + alpha + ")";
    }
    return c;
  }
  c = c.replace("#", "");
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  var r = parseInt(c.substring(0, 2), 16);
  var g = parseInt(c.substring(2, 4), 16);
  var b = parseInt(c.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "rgba(100,116,139," + alpha + ")";
  return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
}

// 현재 선택된 항목 중 미사용 중인 가장 앞쪽 고대비 팔레트 슬롯을 배정
function mfSyncColorMap(selectedKeys, colorMap) {
  var activeSet = {};
  (selectedKeys || []).forEach(function(k) { activeSet[k] = true; });

  // 선택 해제된 항목의 색상 슬롯 회수
  Object.keys(colorMap).forEach(function(k) {
    if (!activeSet[k]) delete colorMap[k];
  });

  var usedColors = {};
  Object.keys(colorMap).forEach(function(k) {
    usedColors[colorMap[k]] = true;
  });

  (selectedKeys || []).forEach(function(k) {
    if (colorMap[k]) return;
    var picked = null;
    for (var i = 0; i < MF_HIGH_CONTRAST_PALETTE.length; i++) {
      var candidate = MF_HIGH_CONTRAST_PALETTE[i];
      if (!usedColors[candidate]) {
        picked = candidate;
        break;
      }
    }
    if (!picked) {
      picked = MF_HIGH_CONTRAST_PALETTE[Object.keys(colorMap).length % MF_HIGH_CONTRAST_PALETTE.length];
    }
    colorMap[k] = picked;
    usedColors[picked] = true;
  });

  return colorMap;
}

// 1) 포커스 하이라이트 적용 (ds.order는 건드리지 않아 범례 떨림 원천 방지)
function mfApplyFocus(chart, focusedIndex) {
  if (!chart || !chart.data || !chart.data.datasets) return;
  var nextFocus = (focusedIndex === null || focusedIndex === undefined || focusedIndex < 0) ? null : focusedIndex;
  if (chart.$mfFocusedIndex === nextFocus) return;
  chart.$mfFocusedIndex = nextFocus;

  chart.data.datasets.forEach(function(ds) {
    if (!ds._mfOrigColor) {
      ds._mfOrigColor = ds.borderColor;
      ds._mfOrigWidth = ds.borderWidth || 2;
    }
    if (nextFocus === null) {
      ds.borderColor = ds._mfOrigColor;
      ds.backgroundColor = ds._mfOrigColor;
      ds.borderWidth = ds._mfOrigWidth;
    } else if (chart.data.datasets.indexOf(ds) === nextFocus) {
      ds.borderColor = ds._mfOrigColor;
      ds.backgroundColor = ds._mfOrigColor;
      ds.borderWidth = Math.max(ds._mfOrigWidth + 1.5, 4);
    } else {
      ds.borderColor = mfHexToRgba(ds._mfOrigColor, 0.16);
      ds.backgroundColor = mfHexToRgba(ds._mfOrigColor, 0.16);
      ds.borderWidth = Math.max(1.2, ds._mfOrigWidth * 0.7);
    }
  });

  chart.update("none");
}

function mfFocusByLabel(chart, label) {
  if (!chart || !chart.data || !chart.data.datasets) return;
  if (!label) {
    chart.$mfPinnedIndex = null;
    mfApplyFocus(chart, null);
    return;
  }
  var idx = -1;
  for (var i = 0; i < chart.data.datasets.length; i++) {
    if (chart.data.datasets[i].label === label) {
      idx = i;
      break;
    }
  }
  mfApplyFocus(chart, idx >= 0 ? idx : null);
}

// 1-B) 포커스 선 최상단 재드로잉 + 글로우 그림자 + 그래프 직접 호버/터치 포커스 플러그인
var mfFocusShadowPlugin = {
  id: "mfFocusShadow",
  afterInit: function(chart) {
    chart.$mfFocusedIndex = null;
    chart.$mfPinnedIndex = null;
    if (chart.canvas) {
      chart.canvas.addEventListener("mouseleave", function() {
        if (chart.$mfPinnedIndex === null) {
          mfApplyFocus(chart, null);
        }
      });
    }
  },
  afterEvent: function(chart, args) {
    var ev = args && args.event;
    if (!ev || !chart.chartArea) return;

    var area = chart.chartArea;
    var inArea = (ev.x >= area.left && ev.x <= area.right && ev.y >= area.top && ev.y <= area.bottom);

    if (ev.type === "mouseout") {
      if (chart.$mfPinnedIndex === null) {
        mfApplyFocus(chart, null);
      }
      return;
    }

    if (!inArea) {
      // 범례 영역(area.left 왼쪽)은 legend.onHover/onLeave가 담당하므로 건드리지 않음
      if (ev.type === "mousemove" && ev.x > area.right && chart.$mfPinnedIndex === null) {
        mfApplyFocus(chart, null);
      }
      return;
    }

    if (ev.type !== "mousemove" && ev.type !== "click") return;

    var nearest = chart.getElementsAtEventForMode(ev, "nearest", { intersect: false }, false);
    var hitIndex = null;
    if (nearest && nearest.length > 0) {
      var el = nearest[0];
      var pt = el.element;
      if (pt && !isNaN(pt.x) && !isNaN(pt.y)) {
        var dist = Math.hypot(ev.x - pt.x, ev.y - pt.y);
        var maxDist = (ev.type === "click") ? 42 : 30;
        if (dist <= maxDist) {
          hitIndex = el.datasetIndex;
        }
      }
    }

    if (ev.type === "click") {
      if (hitIndex === null || chart.$mfPinnedIndex === hitIndex) {
        chart.$mfPinnedIndex = null;
        mfApplyFocus(chart, null);
      } else {
        chart.$mfPinnedIndex = hitIndex;
        mfApplyFocus(chart, hitIndex);
      }
      return;
    }

    // mousemove (PC): 핀 고정 중이 아닐 때만 실시간 호버 포커스
    if (ev.type === "mousemove" && chart.$mfPinnedIndex === null) {
      mfApplyFocus(chart, hitIndex);
    }
  },
  afterDatasetsDraw: function(chart) {
    var fIdx = chart.$mfFocusedIndex;
    if (fIdx === null || fIdx === undefined) return;
    var meta = chart.getDatasetMeta(fIdx);
    var ds = chart.data.datasets[fIdx];
    if (!meta || meta.hidden || !meta.dataset || !ds) return;

    var baseColor = ds._mfOrigColor || ds.borderColor;
    var ctx = chart.ctx;
    var area = chart.chartArea;
    ctx.save();
    if (area) {
      ctx.beginPath();
      ctx.rect(area.left - 4, area.top - 4, (area.right - area.left) + 8, (area.bottom - area.top) + 8);
      ctx.clip();
    }
    ctx.shadowColor = mfHexToRgba(baseColor, 0.48);
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    meta.dataset.draw(ctx);
    ctx.restore();
  }
};

// 4) 선 우측 끝점 직접 라벨 플러그인 (수직 겹침 자동 회피)
var mfEndLabelPlugin = {
  id: "mfEndLabels",
  afterDatasetsDraw: function(chart, args, pluginOptions) {
    if (pluginOptions && pluginOptions.enabled === false) return;
    var area = chart.chartArea;
    if (!area) return;

    var isCompact = !!(pluginOptions && pluginOptions.compact);
    var fontSize = isCompact ? 9 : 11;
    var minGap = isCompact ? 11 : 14;
    var fIdx = (chart.$mfFocusedIndex !== undefined) ? chart.$mfFocusedIndex : null;

    var items = [];
    chart.data.datasets.forEach(function(ds, dsIndex) {
      var meta = chart.getDatasetMeta(dsIndex);
      if (!meta || meta.hidden || !meta.data || meta.data.length === 0) return;

      // 마지막 유효 포인트 탐색
      var lastIdx = -1;
      for (var i = ds.data.length - 1; i >= 0; i--) {
        var v = ds.data[i];
        if (v !== null && v !== undefined && !isNaN(v) && meta.data[i] && !isNaN(meta.data[i].y)) {
          lastIdx = i;
          break;
        }
      }
      if (lastIdx < 0) return;

      var pt = meta.data[lastIdx];
      var val = Number(ds.data[lastIdx]);
      var rawLabel = String(ds.label || "");
      var shortLabel = rawLabel;
      if (isCompact && rawLabel.indexOf(" ") !== -1 && rawLabel !== "미국 통화량" && rawLabel !== "한국 통화량") {
        var parts = rawLabel.split(" ");
        shortLabel = parts[parts.length - 1];
      }
      if (isCompact && rawLabel === "미국 통화량") shortLabel = "미 통화량";
      if (isCompact && rawLabel === "한국 통화량") shortLabel = "한 통화량";

      items.push({
        dsIndex: dsIndex,
        x: pt.x,
        origY: pt.y,
        y: pt.y,
        text: shortLabel + " " + val.toFixed(2),
        color: ds._mfOrigColor || ds.borderColor || "#333333"
      });
    });

    if (items.length === 0) return;

    // y좌표 오름차순 정렬 후 겹침 방지 수직 분산
    items.sort(function(a, b) { return a.origY - b.origY; });
    var topBound = area.top + fontSize / 2 + 2;
    var bottomBound = area.bottom - fontSize / 2 - 2;

    for (var j = 0; j < items.length; j++) {
      if (items[j].y < topBound) items[j].y = topBound;
      if (j > 0 && items[j].y - items[j - 1].y < minGap) {
        items[j].y = items[j - 1].y + minGap;
      }
    }
    if (items[items.length - 1].y > bottomBound) {
      items[items.length - 1].y = bottomBound;
      for (var k = items.length - 2; k >= 0; k--) {
        if (items[k + 1].y - items[k].y < minGap) {
          items[k].y = items[k + 1].y - minGap;
        }
      }
      if (items[0].y < topBound) items[0].y = topBound;
    }

    var ctx = chart.ctx;
    ctx.save();
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    var labelStartX = area.right + (isCompact ? 5 : 8);

    items.forEach(function(item) {
      var isFocused = (fIdx !== null && item.dsIndex === fIdx);
      var isDimmed = (fIdx !== null && item.dsIndex !== fIdx);
      var drawColor = isDimmed ? mfHexToRgba(item.color, 0.22) : item.color;

      // 끝점에서 라벨까지 얇은 연결선 (끝점이 차트 우측 끝보다 왼쪽이거나 y가 분산된 경우)
      ctx.beginPath();
      ctx.strokeStyle = mfHexToRgba(item.color, isDimmed ? 0.14 : 0.45);
      ctx.lineWidth = isFocused ? 1.5 : 0.9;
      ctx.moveTo(item.x + 2, item.origY);
      ctx.lineTo(labelStartX - 2, item.y);
      ctx.stroke();

      ctx.font = (isFocused ? "700 " : "600 ") + fontSize + "px 'Noto Sans KR', sans-serif";
      ctx.fillStyle = drawColor;
      ctx.fillText(item.text, labelStartX, item.y);
    });

    ctx.restore();
  }
};
