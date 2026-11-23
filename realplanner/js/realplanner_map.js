/**
 * ==========================================================================
 * realcrew_map.js
 * 네이버 지도 제어, 리얼랭커스 동일 마커, 선택 순번 배지, 사각박스 영역 선택,
 * 이동경로(Polyline) 및 구간 거리 라벨 렌더링 모듈
 * ==========================================================================
 */
(function (global) {
  "use strict";

  var ROUTE_SEGMENT_COLORS = [
    { line: "#F87171", text: "#DC2626" }, // 1->2: 파스텔 코랄 핑크
    { line: "#60A5FA", text: "#2563EB" }, // 2->3: 파스텔 스카이 블루
    { line: "#34D399", text: "#059669" }, // 3->4: 파스텔 민트 그린
    { line: "#A78BFA", text: "#7C3AED" }  // 4->5: 파스텔 라벤더 퍼플
  ];

  function getSegmentColor(index) {
    return ROUTE_SEGMENT_COLORS[index % ROUTE_SEGMENT_COLORS.length].line;
  }

  function getSegmentPalette(index) {
    return ROUTE_SEGMENT_COLORS[index % ROUTE_SEGMENT_COLORS.length];
  }

  var RealCrewMap = {
    map: null,
    visibleMarkers: [],
    routePolylines: [],
    routeLabels: [],
    tempRadarCircles: [],
    selectionRectOverlay: null,
    userLocationMarker: null,
    selectedOrderMap: Object.create(null), // code -> 1-based order
    courseListRef: [],
    lastSegments: [],
    lastFocusedIndex: -1,
    lastRenderedEntries: [],
    captureMarkerScale: 1,
    captureUnderlayView: null,
    captureUnderlayCanvas: null,
    onComplexClick: null,
    onBoxSelected: null,
    onMapEmptyClick: null,
    isDrawingBox: false,
    ROUTE_SEGMENT_COLORS: ROUTE_SEGMENT_COLORS,
    getSegmentColor: getSegmentColor,
    getSegmentPalette: getSegmentPalette
  };

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toCircled(n) {
    if (global.RealCrewRoute && typeof global.RealCrewRoute.formatCircledNumber === "function") {
      return global.RealCrewRoute.formatCircledNumber(n);
    }
    return String(n);
  }

  // 2026-11-22: 마커 좌측 상단 순번 배지(1,2,3...) 캡처 시 중앙 정렬 보장용 SVG 배지 빌더
  function buildOrderBadgeHtml(orderNum, sizePx, topPx, leftPx) {
    if (!orderNum) return "";
    var str = String(orderNum);
    var fontSize = str.length >= 2 ? 10.2 : 12;
    return (
      '<div class="rc-order-badge" style="top:' + topPx + 'px;left:' + leftPx + 'px;width:' + sizePx + 'px;height:' + sizePx + 'px;">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + sizePx + '" height="' + sizePx + '">' +
          '<circle cx="12" cy="12" r="10.2" fill="#0f172a" stroke="#ffffff" stroke-width="2.1"/>' +
          '<text x="12" y="12.2" fill="#ffffff" font-family="Pretendard, -apple-system, BlinkMacSystemFont, Malgun Gothic, sans-serif" font-size="' + fontSize + '" font-weight="800" text-anchor="middle" dominant-baseline="central">' + escapeHtml(str) + '</text>' +
        '</svg>' +
      '</div>'
    );
  }

  function buildLargeMarkerHtml(cpx, orderNum, markerScaleOverride) {
    var color = cpx.gradeColor;
    var s = (typeof markerScaleOverride === "number" && markerScaleOverride > 0)
      ? markerScaleOverride
      : (RealCrewMap.captureMarkerScale || 1);
    var w = Math.round(68 * s);
    var h = Math.round(60 * s);
    var badgeSize = Math.round(23 * s);
    var badgeTop = Math.round(-7 * s);
    var badgeLeft = Math.round(-8 * s);
    var badgeHtml = buildOrderBadgeHtml(orderNum, badgeSize, badgeTop, badgeLeft);
    var selectedCls = orderNum ? " is-selected" : "";

    var isCap = !!RealCrewMap.isCapturing;
    // 2026-11-23: 모바일 WebView 최소 폰트 크기 강제 확대 및 spacingAndGlyphs 찌그러짐 방지
    // viewBox를 10배(0 0 350 350)로 확장하고 텍스트를 39~80 단위로 지정해 최소 폰트 제한 우회
    var areaFontSize = isCap ? "39" : "54";
    var areaSpacing = isCap ? "-1.5" : "-1";

    var svg =
      '<svg version="1.1" class="large_marker ' + cpx.gradeClass + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 350" width="' + w + '" height="' + h + '" style="-webkit-text-size-adjust:none;text-size-adjust:none;">' +
        '<g transform="scale(10)">' +
          '<path fill="' + color + '" stroke="' + color + '" stroke-width="0.5" d="M.12,12.29V8.81A.88.88,0,0,1,.55,8L15.31.47a3.07,3.07,0,0,1,2.83,0L33,8a.85.85,0,0,1,.43.77v3.48Z"/>' +
          '<path fill="#fff" stroke="' + color + '" stroke-width="0.5" d="M.13,12.29V26.36c0,1.37.63,2.47,1.4,2.47H3.36L4.52,31l1.16,2.15L6.84,31,8,28.83H32.06c.78,0,1.41-1.1,1.41-2.47V12.29Z"/>' +
        '</g>' +
        '<g font-family="Pretendard, Noto Sans KR, -apple-system, BlinkMacSystemFont, Malgun Gothic, sans-serif">' +
          '<text fill="#fff" font-size="80" font-weight="600" text-anchor="middle" x="165" y="100">' + escapeHtml(cpx.grade) + '</text>' +
          '<text fill="#000" font-size="68" font-weight="600" text-anchor="middle" x="170" y="195">' + escapeHtml(cpx.priceText) + '</text>' +
          '<text fill="#000" font-size="' + areaFontSize + '" font-weight="600" letter-spacing="' + areaSpacing + '" text-anchor="middle" x="170" y="256">' + escapeHtml(cpx.areaText) + '</text>' +
        '</g>' +
      '</svg>';

    return (
      '<div class="rc-marker-wrap' + selectedCls + '" data-code="' + escapeHtml(cpx.code) + '" title="' + escapeHtml(cpx.name + ' (' + cpx.score.toFixed(1) + '점)') + '" style="width:' + w + 'px;height:' + h + 'px;">' +
        badgeHtml +
        svg +
      '</div>'
    );
  }

  function buildSmallMarkerHtml(cpx, orderNum) {
    var color = cpx.gradeColor;
    var badgeHtml = buildOrderBadgeHtml(orderNum, 21, -9, -10);
    var selectedCls = orderNum ? " is-selected" : "";

    var svg =
      '<svg version="1.1" class="small_marker ' + cpx.gradeClass + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="30" height="30" style="-webkit-text-size-adjust:none;text-size-adjust:none;">' +
        '<g transform="scale(10)">' +
          // 2026-11-23: 메인 지도(js/map_control.js createSmallMarker)와 동일한 #a70000 외곽선(stroke-width 0.5) 적용
          '<path fill="' + color + '" stroke="#a70000" stroke-width="0.5" d="M17.89,4.43,9.86.31a1.67,1.67,0,0,0-1.55,0L.36,4.43a.48.48,0,0,0-.24.42v9.58c0,.74.35,1.35.76,1.35h1l2.26,3.35,2.25-3.35h11c.41,0,.75-.61.75-1.35V4.86A.48.48,0,0,0,17.89,4.43Z"/>' +
        '</g>' +
        '<text fill="#fff" font-family="Pretendard, Noto Sans KR, -apple-system, BlinkMacSystemFont, Malgun Gothic, sans-serif" font-size="90" font-weight="600" text-anchor="middle" x="90" y="120">' + escapeHtml(cpx.grade) + '</text>' +
      '</svg>';

    return (
      '<div class="rc-marker-wrap' + selectedCls + '" title="' + escapeHtml(cpx.name + ' (' + cpx.score.toFixed(1) + '점)') + '" style="width:30px;height:30px;">' +
        badgeHtml +
        svg +
      '</div>'
    );
  }

  function init(options) {
    RealCrewMap.onComplexClick = options.onComplexClick || null;
    RealCrewMap.onBoxSelected = options.onBoxSelected || null;
    RealCrewMap.onMapEmptyClick = options.onMapEmptyClick || null;

    var ctx = global.RealCrewData.context;
    var initialZoom = Math.max(11, Math.min(18, ctx.zoom || 16));

    var isMobileInit = window.innerWidth <= 820;
    RealCrewMap.map = new naver.maps.Map("realcrewMap", {
      center: new naver.maps.LatLng(ctx.lat, ctx.lng),
      zoom: initialZoom,
      zoomControl: true,
      zoomControlOptions: {
        style: naver.maps.ZoomControlStyle.SMALL,
        position: naver.maps.Position.TOP_RIGHT
      },
      // 2026-11-23: 모바일 하단 축척(scaleControl) 및 © NAVER Corp.(mapDataControl) 숨김 처리
      scaleControl: !isMobileInit,
      mapDataControl: !isMobileInit,
      draggable: true,
      pinchZoom: true,
      scrollWheel: true,
      keyboardShortcuts: true,
      disableDoubleClickZoom: false
    });

    naver.maps.Event.addListener(RealCrewMap.map, "idle", function () {
      var center = RealCrewMap.map.getCenter();
      if (center) {
        try {
          localStorage.setItem("lastMapLat", center.lat());
          localStorage.setItem("lastMapLng", center.lng());
          localStorage.setItem("lastMapZoom", RealCrewMap.map.getZoom());
        } catch (e) {}
      }
      renderMarkers();
    });

    naver.maps.Event.addListener(RealCrewMap.map, "zoom_changed", function () {
      renderMarkers();
      if (RealCrewMap.lastSegments && RealCrewMap.lastSegments.length > 0) {
        renderRoute(RealCrewMap.lastSegments, RealCrewMap.lastFocusedIndex);
      }
    });

    naver.maps.Event.addListener(RealCrewMap.map, "click", function () {
      if (!RealCrewMap.isDrawingBox && typeof RealCrewMap.onMapEmptyClick === "function") {
        RealCrewMap.onMapEmptyClick();
      }
    });

    bindBoxDrawingEvents();
    renderMarkers();
  }

  function clearVisibleMarkers() {
    for (var i = 0; i < RealCrewMap.visibleMarkers.length; i++) {
      RealCrewMap.visibleMarkers[i].setMap(null);
    }
    RealCrewMap.visibleMarkers = [];
  }

  function renderMarkers() {
    if (!RealCrewMap.map) return;
    clearVisibleMarkers();

    var map = RealCrewMap.map;
    var zoom = map.getZoom();
    var bounds = map.getBounds();
    if (!bounds) return;

    var sw = bounds.getSW();
    var ne = bounds.getNE();
    var isMobile = window.innerWidth <= 820;
    var largeZoomMin = isMobile ? 15 : 16;
    var smallZoomMin = isMobile ? 14 : 15;

    var renderedCodes = Object.create(null);

    // 1) 단지 마커 렌더링 (줌 레벨 충분 시)
    if (zoom >= smallZoomMin) {
      var inView = global.RealCrewData.getComplexesInBounds(sw.lat(), sw.lng(), ne.lat(), ne.lng());
      // 마커 과다 렌더링 방지 (점수 상위 260개 + 선택 단지 우선)
      if (inView.length > 260) {
        inView.sort(function (a, b) {
          var aSel = RealCrewMap.selectedOrderMap[a.code] ? 1 : 0;
          var bSel = RealCrewMap.selectedOrderMap[b.code] ? 1 : 0;
          if (bSel !== aSel) return bSel - aSel;
          return b.score - a.score;
        });
        inView = inView.slice(0, 260);
      }

      var useLarge = zoom >= largeZoomMin;
      for (var i = 0; i < inView.length; i++) {
        var cpx = inView[i];
        var orderNum = RealCrewMap.selectedOrderMap[cpx.code] || 0;
        addComplexMarker(cpx, useLarge || orderNum > 0, orderNum);
        renderedCodes[cpx.code] = true;
      }
    } else {
      // 줌 아웃 시 지역(Level2 / Level1 / Level0) 마커 표시
      var regionPool = zoom >= 12
        ? global.RealCrewData.regions.level2
        : (zoom >= 10 ? global.RealCrewData.regions.level1 : global.RealCrewData.regions.level0);
      var targetZoom = zoom >= 12 ? 15 : (zoom >= 10 ? 13 : 11);

      for (var r = 0; r < regionPool.length; r++) {
        var reg = regionPool[r];
        var rLat = Number(reg.lat);
        var rLng = Number(reg.lng);
        if (!isFinite(rLat) || !isFinite(rLng)) continue;
        if (rLat < sw.lat() || rLat > ne.lat() || rLng < sw.lng() || rLng > ne.lng()) continue;

        (function (regionItem, nextZoom) {
          var label = regionItem["법정동명"] || regionItem["지역명"] || regionItem["시군구"] || "";
          if (!label) return;
          var shortLabel = label.split(" ").pop();
          var m = new naver.maps.Marker({
            position: new naver.maps.LatLng(Number(regionItem.lat), Number(regionItem.lng)),
            map: map,
            zIndex: 80,
            icon: {
              content: '<div class="rc-region-marker">' + escapeHtml(shortLabel) + '</div>',
              anchor: new naver.maps.Point(30, 14)
            }
          });
          naver.maps.Event.addListener(m, "click", function () {
            map.morph(new naver.maps.LatLng(Number(regionItem.lat), Number(regionItem.lng)), nextZoom);
          });
          RealCrewMap.visibleMarkers.push(m);
        })(reg, targetZoom);
      }
    }

    // 2) 선택된 코스 단지는 줌 레벨과 무관하게 항상 표시 (좌측 상단 (1), (2)... 보장)
    for (var s = 0; s < RealCrewMap.courseListRef.length; s++) {
      var selectedCpx = RealCrewMap.courseListRef[s];
      if (!renderedCodes[selectedCpx.code]) {
        addComplexMarker(selectedCpx, true, s + 1);
        renderedCodes[selectedCpx.code] = true;
      }
    }
  }

  function addComplexMarker(cpx, useLarge, orderNum) {
    var baseScale = RealCrewMap.captureMarkerScale || 1;
    // 2026-11-23: 메인 지도(js/map_control.js) 모바일 규칙 동일 적용 — 모바일 zoom 15에서 중간 축소 크기(35/45 ≈ 0.78배)로 표시
    var isMobileView = window.innerWidth <= 820;
    var curZoom = RealCrewMap.map ? RealCrewMap.map.getZoom() : 16;
    var mobileZoomScale = (!RealCrewMap.isCapturing && isMobileView && curZoom === 15) ? (35 / 45) : 1;
    var s = baseScale * mobileZoomScale;

    var html = useLarge ? buildLargeMarkerHtml(cpx, orderNum, s) : buildSmallMarkerHtml(cpx, orderNum);
    var size = useLarge
      ? new naver.maps.Size(Math.round(68 * s), Math.round(60 * s))
      : new naver.maps.Size(30, 30);
    // 마커 하단 삼각형 꼭짓점이 정확한 단지 좌표(lat, lng)에 맞도록 앵커 정렬 (스케일 비율 동기화)
    var anchor = useLarge
      ? new naver.maps.Point(Math.round(14 * s), Math.round(57 * s))
      : new naver.maps.Point(6, 29);
    var zIndex = orderNum > 0 ? (1500 + orderNum) : (useLarge ? 500 : 200);

    var marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(cpx.lat, cpx.lng),
      map: RealCrewMap.map,
      zIndex: zIndex,
      icon: {
        content: html,
        size: size,
        anchor: anchor
      }
    });

    naver.maps.Event.addListener(marker, "click", function () {
      if (typeof RealCrewMap.onComplexClick === "function") {
        RealCrewMap.onComplexClick(cpx);
      }
    });

    RealCrewMap.visibleMarkers.push(marker);
  }

  function clearRouteOverlays() {
    for (var i = 0; i < RealCrewMap.routePolylines.length; i++) {
      RealCrewMap.routePolylines[i].setMap(null);
    }
    RealCrewMap.routePolylines = [];

    for (var j = 0; j < RealCrewMap.routeLabels.length; j++) {
      RealCrewMap.routeLabels[j].setMap(null);
    }
    RealCrewMap.routeLabels = [];
  }

  function updateCourse(courseList, segments, focusedIndex) {
    RealCrewMap.courseListRef = courseList || [];
    RealCrewMap.selectedOrderMap = Object.create(null);
    for (var i = 0; i < RealCrewMap.courseListRef.length; i++) {
      RealCrewMap.selectedOrderMap[RealCrewMap.courseListRef[i].code] = i + 1;
    }

    renderMarkers();
    renderRoute(segments || [], focusedIndex);
  }

  function getMetersPerPixel(lat, zoom) {
    return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  }

  /**
   * 시작점 원과 도착점 삼각형이 단지 지점에서 서로 겹치지 않도록
   * 경로 양 끝을 일정 픽셀(현재 줌 기준 미터 환산)만큼 안쪽으로 트리밍
   */
  function trimPolylinePath(path, startTrimMeters, endTrimMeters) {
    if (!path || path.length < 2) return path;

    var cum = [0];
    var total = 0;
    for (var i = 1; i < path.length; i++) {
      var d = global.RealCrewRoute.haversineMeters(
        path[i - 1].lat, path[i - 1].lng,
        path[i].lat, path[i].lng
      );
      total += d;
      cum.push(total);
    }

    if (total <= 5) return path;

    var startCut = Math.min(startTrimMeters, total * 0.24);
    var endCut = Math.min(endTrimMeters, total * 0.28);
    var endTarget = total - endCut;

    if (endTarget <= startCut + 1) return path;

    function pointAtDist(targetDist) {
      for (var k = 1; k < cum.length; k++) {
        if (cum[k] >= targetDist) {
          var segLen = cum[k] - cum[k - 1];
          var ratio = segLen > 0 ? (targetDist - cum[k - 1]) / segLen : 0;
          return {
            lat: path[k - 1].lat + (path[k].lat - path[k - 1].lat) * ratio,
            lng: path[k - 1].lng + (path[k].lng - path[k - 1].lng) * ratio
          };
        }
      }
      return path[path.length - 1];
    }

    var trimmed = [pointAtDist(startCut)];
    for (var m = 1; m < path.length - 1; m++) {
      if (cum[m] > startCut && cum[m] < endTarget) {
        trimmed.push(path[m]);
      }
    }
    trimmed.push(pointAtDist(endTarget));
    return trimmed;
  }

  function quantizePointKey(pt) {
    // 약 5m 단위 격자 양자화 (동일 도로 위 중첩 구간 탐지)
    return Math.round(pt.lat * 20000) + "," + Math.round(pt.lng * 20000);
  }

  function makeCanonicalEdgeKey(p1, p2) {
    var k1 = quantizePointKey(p1);
    var k2 = quantizePointKey(p2);
    if (k1 === k2) return "";
    return k1 < k2 ? (k1 + "|" + k2) : (k2 + "|" + k1);
  }

  function getCanonicalNormalMeters(p1, p2) {
    var cosLat = Math.cos(((p1.lat + p2.lat) * 0.5 * Math.PI) / 180);
    var dx = (p2.lng - p1.lng) * 111320 * cosLat;
    var dy = (p2.lat - p1.lat) * 111320;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) return { nx: 0, ny: 0 };

    // 정방향/역방향이 같은 기준 법선 벡터를 공유하도록 일관된 방향 정렬
    if (dx < 0 || (Math.abs(dx) < 1e-6 && dy < 0)) {
      dx = -dx;
      dy = -dy;
    }
    return {
      nx: -dy / len,
      ny: dx / len
    };
  }

  /**
   * 동일 도로를 공유해 중첩되는 이동경로 구간을 2줄·3줄 평행선(레일) 형태로 좌우 오프셋
   */
  function applyParallelOverlapOffsets(entries, mpp) {
    if (!entries || entries.length < 2) return entries;

    var laneGapMeters = mpp * 6.5;
    var edgeToSegs = Object.create(null);

    // 1) 각 구간이 지나가는 무방향 소구간(edge)별 중첩 구간 목록 수집
    for (var e = 0; e < entries.length; e++) {
      var path = entries[e].path;
      var segIdx = entries[e].segIndex;
      var seenInSeg = Object.create(null);

      for (var i = 0; i < path.length - 1; i++) {
        var edgeKey = makeCanonicalEdgeKey(path[i], path[i + 1]);
        if (!edgeKey || seenInSeg[edgeKey]) continue;
        seenInSeg[edgeKey] = true;
        if (!edgeToSegs[edgeKey]) edgeToSegs[edgeKey] = [];
        edgeToSegs[edgeKey].push(segIdx);
      }
    }

    // 2) 중첩된 소구간에 대해 차선(lane) 오프셋 적용
    for (var e2 = 0; e2 < entries.length; e2++) {
      var origPath = entries[e2].path;
      var mySegIdx = entries[e2].segIndex;
      var n = origPath.length;
      if (n < 2) continue;

      var newPath = [];
      for (var p = 0; p < n; p++) {
        var pt = origPath[p];

        // 출발점(0번: 마커 하단 삼각형 꼭짓점)은 정확히 마커에 고정
        if (p === 0) {
          newPath.push({ lat: pt.lat, lng: pt.lng });
          continue;
        }

        // 현재 정점과 맞닿은 앞/뒤 edge 중 중첩(2줄 이상) 그룹 탐색
        var bestGroup = null;
        var normalSumX = 0;
        var normalSumY = 0;
        var normalCount = 0;

        if (p > 0) {
          var prevKey = makeCanonicalEdgeKey(origPath[p - 1], pt);
          var prevGrp = prevKey ? edgeToSegs[prevKey] : null;
          if (prevGrp && prevGrp.length >= 2) {
            bestGroup = prevGrp;
            var prevN = getCanonicalNormalMeters(origPath[p - 1], pt);
            normalSumX += prevN.nx;
            normalSumY += prevN.ny;
            normalCount += 1;
          }
        }
        if (p < n - 1) {
          var nextKey = makeCanonicalEdgeKey(pt, origPath[p + 1]);
          var nextGrp = nextKey ? edgeToSegs[nextKey] : null;
          if (nextGrp && nextGrp.length >= 2) {
            if (!bestGroup || nextGrp.length > bestGroup.length) {
              bestGroup = nextGrp;
            }
            var nextN = getCanonicalNormalMeters(pt, origPath[p + 1]);
            normalSumX += nextN.nx;
            normalSumY += nextN.ny;
            normalCount += 1;
          }
        }

        if (!bestGroup || normalCount === 0) {
          newPath.push({ lat: pt.lat, lng: pt.lng });
          continue;
        }

        var nLen = Math.sqrt(normalSumX * normalSumX + normalSumY * normalSumY);
        if (nLen < 0.001) {
          newPath.push({ lat: pt.lat, lng: pt.lng });
          continue;
        }
        var nx = normalSumX / nLen;
        var ny = normalSumY / nLen;

        var rank = bestGroup.indexOf(mySegIdx);
        var count = bestGroup.length;
        var laneOffset = rank - (count - 1) / 2; // 2줄: -0.5, +0.5 / 3줄: -1, 0, +1
        var shiftMeters = laneOffset * laneGapMeters;

        var cosLat = Math.cos((pt.lat * Math.PI) / 180);
        var dLat = (ny * shiftMeters) / 111320;
        var dLng = (nx * shiftMeters) / (111320 * cosLat);

        newPath.push({
          lat: pt.lat + dLat,
          lng: pt.lng + dLng
        });
      }

      entries[e2].path = newPath;
    }

    return entries;
  }

  function renderRoute(segments, focusedIndex) {
    clearRouteOverlays();
    RealCrewMap.lastSegments = segments || [];
    RealCrewMap.lastFocusedIndex = typeof focusedIndex === "number" ? focusedIndex : -1;
    RealCrewMap.lastRenderedEntries = [];

    if (!RealCrewMap.map || !segments || segments.length === 0) return;

    var hasFocus = typeof focusedIndex === "number" && focusedIndex >= 0;
    var map = RealCrewMap.map;
    var zoom = map.getZoom();
    var centerLat = map.getCenter() ? map.getCenter().lat() : 37.5;
    var mpp = getMetersPerPixel(centerLat, zoom);
    // 시작점(원): 단지 마커 하단 삼각형 꼭짓점(0px)에서 정확히 시작
    // 도착점(삼각형): 다음 단지 마커 꼭짓점 및 다음 구간 시작점 원과 겹치지 않도록 18px 앞에서 종료
    var startTrimMeters = 0;
    var endTrimMeters = mpp * 18;

    // 1) 표시 대상 구간 추출 및 양 끝 트리밍
    var visibleEntries = [];
    for (var i = 0; i < segments.length; i++) {
      if (hasFocus && i !== focusedIndex - 1 && i !== focusedIndex) {
        continue;
      }
      var seg = segments[i];
      if (!seg || !seg.path || seg.path.length < 2) continue;
      visibleEntries.push({
        segIndex: i,
        seg: seg,
        path: trimPolylinePath(seg.path, startTrimMeters, endTrimMeters)
      });
    }

    // 2) 중첩 도로 구간을 2줄·3줄 평행선으로 자동 분리
    applyParallelOverlapOffsets(visibleEntries, mpp);
    RealCrewMap.lastRenderedEntries = visibleEntries;

    // 3) 폴리라인 및 거리 라벨 렌더링
    var placedLabels = [];
    for (var v = 0; v < visibleEntries.length; v++) {
      var entry = visibleEntries[v];
      var idx = entry.segIndex;
      var segItem = entry.seg;
      var finalPath = entry.path;

      var naverPath = [];
      var shadowPath = [];
      var shadowLatShift = -(mpp * 2.5) / 111320;
      var shadowLngShift = (mpp * 1.9) / (111320 * Math.cos((centerLat * Math.PI) / 180));

      for (var p = 0; p < finalPath.length; p++) {
        naverPath.push(new naver.maps.LatLng(finalPath[p].lat, finalPath[p].lng));
        shadowPath.push(new naver.maps.LatLng(finalPath[p].lat + shadowLatShift, finalPath[p].lng + shadowLngShift));
      }

      var palette = getSegmentPalette(idx);

      // 1) 강조된 드롭 섀도우(그림자) 폴리라인
      var shadowLine = new naver.maps.Polyline({
        map: map,
        path: shadowPath,
        strokeColor: "#0f172a",
        strokeWeight: 9.2,
        strokeOpacity: 0.28,
        strokeLineCap: "round",
        strokeLineJoin: "round",
        zIndex: 880 + idx
      });
      RealCrewMap.routePolylines.push(shadowLine);

      // 2) 강조된 흰색 아웃라인(케이싱) 폴리라인
      var casing = new naver.maps.Polyline({
        map: map,
        path: naverPath,
        strokeColor: "#ffffff",
        strokeWeight: 8.2,
        strokeOpacity: 0.98,
        strokeLineCap: "round",
        strokeLineJoin: "round",
        zIndex: 900 + idx
      });
      RealCrewMap.routePolylines.push(casing);

      // 3) 파스텔톤 메인 이동경로 폴리라인 (4색 순차 적용 + 시작점 동그라미 / 도착점 삼각형 화살표)
      var line = new naver.maps.Polyline({
        map: map,
        path: naverPath,
        strokeColor: palette.line,
        strokeWeight: 4.6,
        strokeOpacity: segItem.source === "osrm" ? 0.96 : 0.78,
        strokeStyle: segItem.source === "osrm" ? "solid" : "shortdash",
        strokeLineCap: "round",
        strokeLineJoin: "round",
        startIcon: naver.maps.PointingIcon.CIRCLE,
        startIconSize: 10,
        endIcon: naver.maps.PointingIcon.BLOCK_ARROW,
        endIconSize: 14,
        zIndex: 920 + idx
      });
      RealCrewMap.routePolylines.push(line);

      // 중간 지점 거리/시간 라벨 (오프셋된 경로 기준 + 라벨 겹침 방지)
      var midPoint = getPathMidpoint(finalPath);
      var labelAnchorY = 12;
      for (var pl = 0; pl < placedLabels.length; pl++) {
        var dLabel = global.RealCrewRoute.haversineMeters(
          midPoint.lat, midPoint.lng,
          placedLabels[pl].lat, placedLabels[pl].lng
        );
        if (dLabel < mpp * 28) {
          labelAnchorY += 24;
        }
      }
      placedLabels.push(midPoint);
      entry.midPoint = midPoint;
      entry.labelAnchorY = labelAnchorY;

      var distText = global.RealCrewRoute.formatDistance(segItem.distanceMeters);
      var displayMin = segItem.displayMinutes != null ? segItem.displayMinutes : segItem.durationMinutes;
      var minText = displayMin + "분";
      var modeBadge = segItem.isCar ? '<i class="fa-solid fa-car" style="font-size:10px;color:#334155;"></i>' : '';
      var labelHtml =
        '<div class="rc-route-label" style="border-color:' + palette.line + ';box-shadow:0 3px 10px rgba(15,23,42,0.22);">' +
          '<span class="rc-route-label-idx" style="color:' + palette.text + ';">' + toCircled(idx + 1) + '→' + toCircled(idx + 2) + '</span>' +
          modeBadge +
          '<span>' + distText + ' / ' + minText + '</span>' +
        '</div>';

      var labelMarker = new naver.maps.Marker({
        position: new naver.maps.LatLng(midPoint.lat, midPoint.lng),
        map: map,
        zIndex: 1100 + idx,
        clickable: false,
        icon: {
          content: labelHtml,
          anchor: new naver.maps.Point(48, labelAnchorY)
        }
      });
      RealCrewMap.routeLabels.push(labelMarker);
    }
  }

  function getPathMidpoint(path) {
    if (path.length === 2) {
      return {
        lat: (path[0].lat + path[1].lat) / 2,
        lng: (path[0].lng + path[1].lng) / 2
      };
    }
    var midIdx = Math.floor(path.length / 2);
    return path[midIdx];
  }

  /* ------------------------------------------------------------------------
   * 사각 박스 영역 선택 (마우스 & 터치 드래그)
   * ------------------------------------------------------------------------ */
  function setBoxDrawMode(active) {
    RealCrewMap.isDrawingBox = !!active;
    var overlay = document.getElementById("rcDrawOverlay");
    var rectEl = document.getElementById("rcSelectionRect");
    if (!overlay || !rectEl) return;

    if (active) {
      overlay.style.display = "block";
      rectEl.style.display = "none";
      if (RealCrewMap.map) {
        RealCrewMap.map.setOptions({ draggable: false });
      }
    } else {
      overlay.style.display = "none";
      rectEl.style.display = "none";
      if (RealCrewMap.map) {
        RealCrewMap.map.setOptions({ draggable: true });
      }
    }
  }

  function clearSelectionBoxOverlay() {
    if (RealCrewMap.selectionRectOverlay) {
      RealCrewMap.selectionRectOverlay.setMap(null);
      RealCrewMap.selectionRectOverlay = null;
    }
  }

  function drawPersistentBox(south, west, north, east) {
    clearSelectionBoxOverlay();
    if (!RealCrewMap.map) return;

    RealCrewMap.selectionRectOverlay = new naver.maps.Rectangle({
      map: RealCrewMap.map,
      bounds: new naver.maps.LatLngBounds(
        new naver.maps.LatLng(south, west),
        new naver.maps.LatLng(north, east)
      ),
      strokeColor: "#E43B46",
      strokeWeight: 2,
      strokeOpacity: 0.8,
      strokeStyle: "shortdash",
      fillColor: "#E43B46",
      fillOpacity: 0.08,
      clickable: false,
      zIndex: 100
    });
  }

  function pixelToLatLng(x, y, containerWidth, containerHeight) {
    var map = RealCrewMap.map;
    var bounds = map.getBounds();
    var sw = bounds.getSW();
    var ne = bounds.getNE();

    // 화면 비율 기반 보간 (네이버 지도 Mercator 줌 11~19 구간에서 매우 정확하며 좌표계 오차 없음)
    var lng = sw.lng() + (x / containerWidth) * (ne.lng() - sw.lng());
    var lat = ne.lat() - (y / containerHeight) * (ne.lat() - sw.lat());
    return { lat: lat, lng: lng };
  }

  function bindBoxDrawingEvents() {
    var overlay = document.getElementById("rcDrawOverlay");
    var rectEl = document.getElementById("rcSelectionRect");
    if (!overlay || !rectEl) return;

    var dragging = false;
    var startX = 0;
    var startY = 0;
    var curX = 0;
    var curY = 0;

    function getLocalPoint(e) {
      var box = overlay.getBoundingClientRect();
      var clientX = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
      var clientY = e.touches && e.touches.length ? e.touches[0].clientY : e.clientY;
      return {
        x: Math.max(0, Math.min(box.width, clientX - box.left)),
        y: Math.max(0, Math.min(box.height, clientY - box.top)),
        w: box.width,
        h: box.height
      };
    }

    function updateRectVisual() {
      var left = Math.min(startX, curX);
      var top = Math.min(startY, curY);
      var width = Math.abs(curX - startX);
      var height = Math.abs(curY - startY);
      rectEl.style.left = left + "px";
      rectEl.style.top = top + "px";
      rectEl.style.width = width + "px";
      rectEl.style.height = height + "px";
    }

    function onStart(e) {
      if (!RealCrewMap.isDrawingBox) return;
      e.preventDefault();
      var pt = getLocalPoint(e);
      dragging = true;
      startX = pt.x;
      startY = pt.y;
      curX = pt.x;
      curY = pt.y;
      rectEl.style.display = "block";
      updateRectVisual();
    }

    function onMove(e) {
      if (!dragging) return;
      e.preventDefault();
      var pt = getLocalPoint(e);
      curX = pt.x;
      curY = pt.y;
      updateRectVisual();
    }

    function onEnd(e) {
      if (!dragging) return;
      e.preventDefault();
      dragging = false;

      var width = Math.abs(curX - startX);
      var height = Math.abs(curY - startY);
      var box = overlay.getBoundingClientRect();

      if (width < 18 || height < 18) {
        rectEl.style.display = "none";
        return;
      }

      var p1 = pixelToLatLng(Math.min(startX, curX), Math.min(startY, curY), box.width, box.height);
      var p2 = pixelToLatLng(Math.max(startX, curX), Math.max(startY, curY), box.width, box.height);

      var south = Math.min(p1.lat, p2.lat);
      var north = Math.max(p1.lat, p2.lat);
      var west = Math.min(p1.lng, p2.lng);
      var east = Math.max(p1.lng, p2.lng);

      setBoxDrawMode(false);
      drawPersistentBox(south, west, north, east);

      if (typeof RealCrewMap.onBoxSelected === "function") {
        RealCrewMap.onBoxSelected({
          south: south,
          west: west,
          north: north,
          east: east
        });
      }
    }

    overlay.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);

    overlay.addEventListener("touchstart", onStart, { passive: false });
    overlay.addEventListener("touchmove", onMove, { passive: false });
    overlay.addEventListener("touchend", onEnd, { passive: false });
  }

  function panToComplex(cpx) {
    if (!RealCrewMap.map || !cpx) return;
    var target = new naver.maps.LatLng(cpx.lat, cpx.lng);
    if (RealCrewMap.map.getZoom() < 15) {
      RealCrewMap.map.morph(target, 16);
    } else {
      RealCrewMap.map.panTo(target);
    }
  }

  function fitCourseBounds(courseList, customPadding) {
    if (!RealCrewMap.map || !courseList || courseList.length === 0) return;
    if (courseList.length === 1) {
      panToComplex(courseList[0]);
      return;
    }
    var bounds = new naver.maps.LatLngBounds(
      new naver.maps.LatLng(courseList[0].lat, courseList[0].lng),
      new naver.maps.LatLng(courseList[0].lat, courseList[0].lng)
    );
    for (var i = 1; i < courseList.length; i++) {
      bounds.extend(new naver.maps.LatLng(courseList[i].lat, courseList[i].lng));
    }
    var pad = customPadding || { top: 90, right: 80, bottom: 70, left: 80 };
    RealCrewMap.map.fitBounds(bounds, pad);
  }

  function locateUser(onError) {
    if (!navigator.geolocation) {
      if (onError) onError("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        var ll = new naver.maps.LatLng(lat, lng);
        if (RealCrewMap.userLocationMarker) {
          RealCrewMap.userLocationMarker.setPosition(ll);
        } else {
          RealCrewMap.userLocationMarker = new naver.maps.Marker({
            position: ll,
            map: RealCrewMap.map,
            zIndex: 2000,
            icon: {
              content: '<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,0.28);"></div>',
              anchor: new naver.maps.Point(8, 8)
            }
          });
        }
        RealCrewMap.map.morph(ll, 16);
      },
      function () {
        if (onError) onError("현재 위치를 가져올 수 없습니다. 위치 권한을 확인해 주세요.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function clearTempRadarCircles() {
    for (var i = 0; i < RealCrewMap.tempRadarCircles.length; i++) {
      RealCrewMap.tempRadarCircles[i].setMap(null);
    }
    RealCrewMap.tempRadarCircles = [];
  }

  /**
   * PDF 개별 단지 페이지 캡처용 레이더 반경 원(300m / 500m / 1km) 표시
   */
  function showTempRadarCircles(cpx) {
    clearTempRadarCircles();
    if (!RealCrewMap.map || !cpx) return;
    var center = new naver.maps.LatLng(cpx.lat, cpx.lng);
    var specs = [
      { radius: 1000, stroke: "#94a3b8", fill: "rgba(148, 163, 184, 0.05)", style: "shortdash" },
      { radius: 500,  stroke: "#E43B46", fill: "rgba(228, 59, 70, 0.06)",  style: "shortdash" },
      { radius: 300,  stroke: "#E43B46", fill: "rgba(228, 59, 70, 0.08)",  style: "solid" }
    ];
    for (var i = 0; i < specs.length; i++) {
      var s = specs[i];
      var circle = new naver.maps.Circle({
        map: RealCrewMap.map,
        center: center,
        radius: s.radius,
        strokeColor: s.stroke,
        strokeOpacity: 0.75,
        strokeWeight: 1.5,
        strokeStyle: s.style,
        fillColor: s.fill,
        fillOpacity: 1,
        clickable: false,
        zIndex: 120 + i
      });
      RealCrewMap.tempRadarCircles.push(circle);
    }
  }

  function waitForMapSettle(delayMs) {
    return new Promise(function (resolve) {
      if (!RealCrewMap.map) {
        setTimeout(resolve, delayMs || 250);
        return;
      }
      var settled = false;
      var listener = naver.maps.Event.addListener(RealCrewMap.map, "idle", function () {
        if (settled) return;
        settled = true;
        naver.maps.Event.removeListener(listener);
        setTimeout(resolve, delayMs || 320);
      });
      setTimeout(function () {
        if (settled) return;
        settled = true;
        naver.maps.Event.removeListener(listener);
        resolve();
      }, (delayMs || 320) + 900);
    });
  }

  function setViewForCapture(lat, lng, zoom) {
    if (!RealCrewMap.map) return Promise.resolve();
    RealCrewMap.map.setCenter(new naver.maps.LatLng(lat, lng));
    if (zoom != null) RealCrewMap.map.setZoom(zoom, false);
    renderMarkers();
    if (RealCrewMap.lastSegments && RealCrewMap.lastSegments.length > 0) {
      renderRoute(RealCrewMap.lastSegments, RealCrewMap.lastFocusedIndex);
    }
    return waitForMapSettle(380);
  }

  function getViewState() {
    if (!RealCrewMap.map) return null;
    var c = RealCrewMap.map.getCenter();
    return {
      lat: c ? c.lat() : 37.5,
      lng: c ? c.lng() : 127.0,
      zoom: RealCrewMap.map.getZoom()
    };
  }

  /**
   * 현재 네이버 지도의 좌표 -> DOM 픽셀 변환용 메타 정보 반환 (스크린샷 벡터 경로 오버레이용)
   * 실제 DOM에 렌더링된 선택 마커 꼭짓점 좌표로 미세 오차를 자동 보정하여 마커-경로 0px 싱크 보장
   */
  function getCaptureProjectionMeta() {
    if (!RealCrewMap.map) return null;
    var mapEl = document.getElementById("realcrewMap");
    if (!mapEl) return null;
    var rect = mapEl.getBoundingClientRect();
    var bounds = RealCrewMap.map.getBounds();
    if (!bounds || rect.width <= 0 || rect.height <= 0) return null;

    var sw = bounds.getSW();
    var ne = bounds.getNE();
    var center = RealCrewMap.map.getCenter();
    var projection = RealCrewMap.map.getProjection();
    var s = RealCrewMap.captureMarkerScale || 1;
    var anchorX = Math.round(14 * s);
    var anchorY = Math.round(57 * s);

    function rawProject(lat, lng) {
      if (projection && typeof projection.fromCoordToOffset === "function") {
        var off = projection.fromCoordToOffset(new naver.maps.LatLng(lat, lng));
        if (off && isFinite(off.x) && isFinite(off.y)) {
          return { x: off.x, y: off.y };
        }
      }
      return {
        x: ((lng - sw.lng()) / (ne.lng() - sw.lng())) * rect.width,
        y: ((ne.lat() - lat) / (ne.lat() - sw.lat())) * rect.height
      };
    }

    // 실제 DOM에 렌더된 선택 단지 마커의 꼭짓점 위치를 기준으로 자동 캘리브레이션 (resize 시 오차 0px 보정)
    var calibDx = 0;
    var calibDy = 0;
    try {
      var selectedEls = mapEl.querySelectorAll(".rc-marker-wrap.is-selected[data-code]");
      for (var i = 0; i < selectedEls.length; i++) {
        var el = selectedEls[i];
        var code = el.getAttribute("data-code");
        var cpx = global.RealCrewData && global.RealCrewData.complexByCode && global.RealCrewData.complexByCode[code];
        if (!cpx) continue;
        var mRect = el.getBoundingClientRect();
        if (mRect.width <= 0 || mRect.height <= 0) continue;
        var actualTipX = (mRect.left - rect.left) + anchorX;
        var actualTipY = (mRect.top - rect.top) + anchorY;
        var projPt = rawProject(cpx.lat, cpx.lng);
        calibDx = actualTipX - projPt.x;
        calibDy = actualTipY - projPt.y;
        break;
      }
    } catch (e) {}

    return {
      domW: rect.width,
      domH: rect.height,
      swLat: sw.lat(),
      swLng: sw.lng(),
      neLat: ne.lat(),
      neLng: ne.lng(),
      zoom: RealCrewMap.map.getZoom(),
      centerLat: center ? center.lat() : 37.5,
      projectToDom: function (lat, lng) {
        var pt = rawProject(lat, lng);
        return {
          x: pt.x + calibDx,
          y: pt.y + calibDy
        };
      }
    };
  }

  /**
   * 캡처 전용: 네이버 지도 내부 overlayLayer(마커와 동일한 부모 레이어)의 최하단(firstChild)에
   * MapCanvasProjection.fromCoordToOffset 기반으로 이동경로(그림자/아웃라인/파스텔/원/화살표)를 직접 렌더링.
   * 마커와 동일한 레이어 및 동일한 투영 객체를 공유하므로 0px 오차로 100% 일치함.
   */
  function unmountCaptureRouteCanvas() {
    if (RealCrewMap.captureUnderlayView) {
      try { RealCrewMap.captureUnderlayView.setMap(null); } catch (e) {}
      RealCrewMap.captureUnderlayView = null;
    }
    if (RealCrewMap.captureUnderlayCanvas && RealCrewMap.captureUnderlayCanvas.parentNode) {
      RealCrewMap.captureUnderlayCanvas.parentNode.removeChild(RealCrewMap.captureUnderlayCanvas);
    }
    RealCrewMap.captureUnderlayCanvas = null;

    if (RealCrewMap.captureLabelCanvas && RealCrewMap.captureLabelCanvas.parentNode) {
      RealCrewMap.captureLabelCanvas.parentNode.removeChild(RealCrewMap.captureLabelCanvas);
    }
    RealCrewMap.captureLabelCanvas = null;

    // 숨겼던 기본 폴리라인 및 거리 라벨 복원
    if (RealCrewMap.map && RealCrewMap.routePolylines) {
      for (var i = 0; i < RealCrewMap.routePolylines.length; i++) {
        RealCrewMap.routePolylines[i].setMap(RealCrewMap.map);
      }
    }
    if (RealCrewMap.map && RealCrewMap.routeLabels) {
      for (var j = 0; j < RealCrewMap.routeLabels.length; j++) {
        RealCrewMap.routeLabels[j].setMap(RealCrewMap.map);
      }
    }
  }

  function mountCaptureRouteCanvas(radarCenterCpx, visualScale) {
    unmountCaptureRouteCanvas();
    var map = RealCrewMap.map;
    var mapEl = document.getElementById("realcrewMap");
    if (!map || !mapEl || typeof naver === "undefined" || !naver.maps || typeof naver.maps.OverlayView !== "function") {
      return Promise.resolve();
    }

    // 캡처 중 네이버 기본 SVG 폴리라인과 DOM 거리 라벨은 숨기고 overlayLayer 내부 고해상도 캔버스로 대체
    for (var i = 0; i < RealCrewMap.routePolylines.length; i++) {
      RealCrewMap.routePolylines[i].setMap(null);
    }
    for (var j = 0; j < RealCrewMap.routeLabels.length; j++) {
      RealCrewMap.routeLabels[j].setMap(null);
    }

    var mapW = mapEl.clientWidth || 1280;
    var mapH = mapEl.clientHeight || 720;
    var scale = mapW > 1800 ? 1.5 : 2;
    var vs = (typeof visualScale === "number" && isFinite(visualScale) && visualScale > 0) ? visualScale : 1;
    var u = scale * vs;

    var underlayCanvas = document.createElement("canvas");
    underlayCanvas.id = "rpTempRouteUnderlayCanvas";
    underlayCanvas.width = Math.round(mapW * scale);
    underlayCanvas.height = Math.round(mapH * scale);
    underlayCanvas.style.cssText =
      "position:absolute;left:0px;top:0px;width:" + mapW + "px;height:" + mapH + "px;pointer-events:none;";

    var labelCanvas = document.createElement("canvas");
    labelCanvas.id = "rpTempRouteLabelCanvas";
    labelCanvas.width = Math.round(mapW * scale);
    labelCanvas.height = Math.round(mapH * scale);
    labelCanvas.style.cssText =
      "position:absolute;left:0px;top:0px;width:" + mapW + "px;height:" + mapH + "px;pointer-events:none;z-index:9999;";

    var underlayPane = null;
    var overlayView = new naver.maps.OverlayView();
    overlayView.onAdd = function () {
      var panes = this.getPanes && this.getPanes();
      underlayPane = panes ? panes.overlayLayer : null;
      if (underlayPane) {
        if (underlayPane.firstChild) {
          underlayPane.insertBefore(underlayCanvas, underlayPane.firstChild);
        } else {
          underlayPane.appendChild(underlayCanvas);
        }
        underlayPane.appendChild(labelCanvas);
      }
    };
    overlayView.draw = function () {};
    overlayView.onRemove = function () {
      if (underlayCanvas && underlayCanvas.parentNode) {
        underlayCanvas.parentNode.removeChild(underlayCanvas);
      }
      if (labelCanvas && labelCanvas.parentNode) {
        labelCanvas.parentNode.removeChild(labelCanvas);
      }
    };
    overlayView.setMap(map);

    RealCrewMap.captureUnderlayView = overlayView;
    RealCrewMap.captureUnderlayCanvas = underlayCanvas;
    RealCrewMap.captureLabelCanvas = labelCanvas;

    return new Promise(function (resolve) {
      setTimeout(function () {
        try {
          var canvasProj = overlayView.getProjection && overlayView.getProjection();
          if (!underlayPane || !canvasProj) {
            resolve();
            return;
          }

          if (underlayPane.firstChild !== underlayCanvas) {
            underlayPane.insertBefore(underlayCanvas, underlayPane.firstChild);
          }
          if (underlayPane.lastChild !== labelCanvas) {
            underlayPane.appendChild(labelCanvas);
          }

          var mapRect = mapEl.getBoundingClientRect();
          var paneRect = underlayPane.getBoundingClientRect();
          var paneOffsetX = mapRect.left - paneRect.left;
          var paneOffsetY = mapRect.top - paneRect.top;
          underlayCanvas.style.left = paneOffsetX + "px";
          underlayCanvas.style.top = paneOffsetY + "px";
          labelCanvas.style.left = paneOffsetX + "px";
          labelCanvas.style.top = paneOffsetY + "px";

          var ctx = underlayCanvas.getContext("2d");
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, underlayCanvas.width, underlayCanvas.height);

          var lctx = labelCanvas.getContext("2d");
          lctx.setTransform(1, 0, 0, 1, 0, 0);
          lctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);

          function toCanvasPt(lat, lng) {
            var cOff = canvasProj.fromCoordToOffset(new naver.maps.LatLng(lat, lng));
            if (!cOff || !isFinite(cOff.x) || !isFinite(cOff.y)) return null;
            return {
              x: (cOff.x - paneOffsetX) * scale,
              y: (cOff.y - paneOffsetY) * scale
            };
          }

          // 1) 폴백 레이더 페이지용 반경 원 (300m / 500m / 1km)
          if (radarCenterCpx) {
            var centerPt = toCanvasPt(radarCenterCpx.lat, radarCenterCpx.lng);
            var northLat = radarCenterCpx.lat + (1000 / 111320);
            var northPt = toCanvasPt(northLat, radarCenterCpx.lng);
            var pxPerMeter = (centerPt && northPt) ? (Math.abs(centerPt.y - northPt.y) / 1000) : 0;
            if (centerPt && pxPerMeter > 0) {
              var rings = [
                { r: 1000, label: "1km", stroke: "rgba(100,116,139,0.55)", fill: "rgba(148,163,184,0.05)", dash: [8 * scale, 6 * scale] },
                { r: 500,  label: "500m", stroke: "rgba(228,59,70,0.65)", fill: "rgba(228,59,70,0.06)", dash: [6 * scale, 5 * scale] },
                { r: 300,  label: "300m", stroke: "rgba(228,59,70,0.75)", fill: "rgba(228,59,70,0.07)", dash: [] }
              ];
              for (var rg = 0; rg < rings.length; rg++) {
                var ring = rings[rg];
                var rPx = ring.r * pxPerMeter;
                ctx.save();
                ctx.beginPath();
                ctx.arc(centerPt.x, centerPt.y, rPx, 0, Math.PI * 2);
                ctx.fillStyle = ring.fill;
                ctx.fill();
                ctx.setLineDash(ring.dash);
                ctx.strokeStyle = ring.stroke;
                ctx.lineWidth = 1.6 * scale;
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
              }
            }
          }

          // 2) 이동 경로 폴리라인 (드롭 섀도우 + 흰색 아웃라인 + 파스텔 4색 + 시작 원 + 도착 삼각형 화살표)
          var entries = RealCrewMap.lastRenderedEntries || [];
          for (var e = 0; e < entries.length; e++) {
            var entry = entries[e];
            var idx = entry.segIndex;
            var segItem = entry.seg;
            var rawPath = entry.path;
            if (!rawPath || rawPath.length < 2) continue;

            var pts = [];
            for (var p = 0; p < rawPath.length; p++) {
              var pt = toCanvasPt(rawPath[p].lat, rawPath[p].lng);
              if (pt) pts.push(pt);
            }
            if (pts.length < 2) continue;

            var palette = getSegmentPalette(idx);

            // 2-1) 드롭 섀도우
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pts[0].x + 2 * u, pts[0].y + 2.5 * u);
            for (var s1 = 1; s1 < pts.length; s1++) {
              ctx.lineTo(pts[s1].x + 2 * u, pts[s1].y + 2.5 * u);
            }
            ctx.strokeStyle = "rgba(15, 23, 42, 0.28)";
            ctx.lineWidth = 9 * u;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
            ctx.restore();

            // 2-2) 흰색 아웃라인
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (var s2 = 1; s2 < pts.length; s2++) {
              ctx.lineTo(pts[s2].x, pts[s2].y);
            }
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 8 * u;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
            ctx.restore();

            // 2-3) 파스텔 메인 라인
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (var s3 = 1; s3 < pts.length; s3++) {
              ctx.lineTo(pts[s3].x, pts[s3].y);
            }
            ctx.strokeStyle = palette.line;
            ctx.lineWidth = 4.6 * u;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            if (segItem.source !== "osrm") {
              ctx.setLineDash([8 * u, 6 * u]);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // 2-4) 시작점 동그라미
            ctx.save();
            ctx.beginPath();
            ctx.arc(pts[0].x, pts[0].y, 5 * u, 0, Math.PI * 2);
            ctx.fillStyle = palette.line;
            ctx.fill();
            ctx.lineWidth = 2 * u;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();
            ctx.restore();

            // 2-5) 도착점 삼각형 화살표
            var endPt = pts[pts.length - 1];
            var prevPt = pts[pts.length - 2];
            for (var back = pts.length - 2; back >= 0; back--) {
              var distSq = Math.pow(endPt.x - pts[back].x, 2) + Math.pow(endPt.y - pts[back].y, 2);
              if (distSq >= 9 * u * u) {
                prevPt = pts[back];
                break;
              }
            }
            var angle = Math.atan2(endPt.y - prevPt.y, endPt.x - prevPt.x);
            var arrowLen = 12 * u;
            var arrowHalfW = 6.5 * u;

            ctx.save();
            ctx.translate(endPt.x, endPt.y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(3 * u, 0);
            ctx.lineTo(-arrowLen + 3 * u, -arrowHalfW);
            ctx.lineTo(-arrowLen + 3 * u, arrowHalfW);
            ctx.closePath();
            ctx.fillStyle = palette.line;
            ctx.fill();
            ctx.lineWidth = 1.8 * u;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();
            ctx.restore();

            // 3) 최상단 라벨 캔버스에 구간 이동경로 정보(순번 / 거리 / 시간) 직접 벡터 렌더링
            var midCoord = entry.midPoint || getPathMidpoint(rawPath);
            var midPt = midCoord ? toCanvasPt(midCoord.lat, midCoord.lng) : null;
            if (midPt) {
              var idxLabel = toCircled(idx + 1) + "→" + toCircled(idx + 2);
              var distLabel = global.RealCrewRoute.formatDistance(segItem.distanceMeters);
              var dispMin = segItem.displayMinutes != null ? segItem.displayMinutes : segItem.durationMinutes;
              var detailLabel = (segItem.isCar ? "차 " : "") + distLabel + " / " + dispMin + "분";
              var fontFamily = "'Pretendard', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif";

              lctx.save();
              lctx.font = "800 " + (11 * u) + "px " + fontFamily;
              var idxW = lctx.measureText(idxLabel).width;
              lctx.font = "700 " + (11 * u) + "px " + fontFamily;
              var detailW = lctx.measureText(detailLabel).width;

              var padX = 8 * u;
              var gapW = 5 * u;
              var pillW = padX * 2 + idxW + gapW + detailW;
              var pillH = 22 * u;
              var pillR = pillH / 2;
              var anchorY = (entry.labelAnchorY != null ? entry.labelAnchorY : 12) * u;
              var pillX = midPt.x - pillW / 2;
              var pillY = midPt.y - anchorY;

              // 캔버스 경계 안쪽으로 안전하게 보정
              pillX = Math.max(6 * u, Math.min(labelCanvas.width - pillW - 6 * u, pillX));
              pillY = Math.max(6 * u, Math.min(labelCanvas.height - pillH - 6 * u, pillY));

              // 그림자 + 흰색 라운드 필 배경
              lctx.shadowColor = "rgba(15, 23, 42, 0.24)";
              lctx.shadowBlur = 7 * u;
              lctx.shadowOffsetX = 0;
              lctx.shadowOffsetY = 2 * u;
              lctx.beginPath();
              lctx.moveTo(pillX + pillR, pillY);
              lctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + pillH, pillR);
              lctx.arcTo(pillX + pillW, pillY + pillH, pillX, pillY + pillH, pillR);
              lctx.arcTo(pillX, pillY + pillH, pillX, pillY, pillR);
              lctx.arcTo(pillX, pillY, pillX + pillW, pillY, pillR);
              lctx.closePath();
              lctx.fillStyle = "rgba(255, 255, 255, 0.96)";
              lctx.fill();

              // 테두리
              lctx.shadowColor = "transparent";
              lctx.shadowBlur = 0;
              lctx.shadowOffsetY = 0;
              lctx.strokeStyle = palette.line;
              lctx.lineWidth = 1.6 * u;
              lctx.stroke();

              // 텍스트 렌더링 (순번 + 거리/시간)
              var textY = pillY + pillH / 2 + 0.5 * u;
              lctx.textBaseline = "middle";
              lctx.textAlign = "left";
              lctx.font = "800 " + (11 * u) + "px " + fontFamily;
              lctx.fillStyle = palette.text;
              lctx.fillText(idxLabel, pillX + padX, textY);

              lctx.font = "700 " + (11 * u) + "px " + fontFamily;
              lctx.fillStyle = "#0f172a";
              lctx.fillText(detailLabel, pillX + padX + idxW + gapW, textY);
              lctx.restore();
            }
          }
        } catch (err) {
          console.warn("캡처 언더레이 경로 렌더링 경고:", err);
        }
        resolve();
      }, 80);
    });
  }

  /**
   * 캡처 시 디바이스(모바일/웹) 해상도 차이에 관계없이 균일한 마커 크기와
   * A4 지도 영역과 동일한 종횡비를 보장하기 위해 임시 캡처 크기로 리사이즈
   */
  function resizeForCapture(targetW, targetH) {
    var mapEl = document.getElementById("realcrewMap");
    if (!RealCrewMap.map || !mapEl) return null;

    var prevState = {
      cssWidth: mapEl.style.width,
      cssHeight: mapEl.style.height,
      cssPosition: mapEl.style.position,
      origW: mapEl.clientWidth || window.innerWidth,
      origH: mapEl.clientHeight || window.innerHeight
    };

    mapEl.style.position = "absolute";
    mapEl.style.width = targetW + "px";
    mapEl.style.height = targetH + "px";
    RealCrewMap.map.setOptions({ zoomControl: false });
    RealCrewMap.map.setSize(new naver.maps.Size(targetW, targetH));
    return prevState;
  }

  function restoreSizeAfterCapture(prevState) {
    var mapEl = document.getElementById("realcrewMap");
    if (!RealCrewMap.map || !mapEl || !prevState) return;

    mapEl.style.width = prevState.cssWidth;
    mapEl.style.height = prevState.cssHeight;
    mapEl.style.position = prevState.cssPosition;
    var restoredW = mapEl.clientWidth || prevState.origW;
    var restoredH = mapEl.clientHeight || prevState.origH;
    RealCrewMap.map.setOptions({ zoomControl: true });
    RealCrewMap.map.setSize(new naver.maps.Size(restoredW, restoredH));
  }

  RealCrewMap.init = init;
  RealCrewMap.renderMarkers = renderMarkers;
  RealCrewMap.updateCourse = updateCourse;
  RealCrewMap.renderRoute = renderRoute;
  RealCrewMap.setBoxDrawMode = setBoxDrawMode;
  RealCrewMap.clearSelectionBoxOverlay = clearSelectionBoxOverlay;
  RealCrewMap.panToComplex = panToComplex;
  RealCrewMap.fitCourseBounds = fitCourseBounds;
  RealCrewMap.locateUser = locateUser;
  RealCrewMap.showTempRadarCircles = showTempRadarCircles;
  RealCrewMap.clearTempRadarCircles = clearTempRadarCircles;
  RealCrewMap.waitForMapSettle = waitForMapSettle;
  RealCrewMap.setViewForCapture = setViewForCapture;
  RealCrewMap.getViewState = getViewState;
  RealCrewMap.getCaptureProjectionMeta = getCaptureProjectionMeta;
  RealCrewMap.resizeForCapture = resizeForCapture;
  RealCrewMap.restoreSizeAfterCapture = restoreSizeAfterCapture;
  RealCrewMap.mountCaptureRouteCanvas = mountCaptureRouteCanvas;
  RealCrewMap.unmountCaptureRouteCanvas = unmountCaptureRouteCanvas;

  global.RealCrewMap = RealCrewMap;
})(window);
