/**
 * ==========================================================================
 * realplanner_export.js
 * 리얼플래너 A4 가로 스크린샷(PNG) 및 단지별 레이더맵 포함 PDF 생성 모듈
 * - 네이버 지도 캡처 + Canvas 벡터 경로/화살표/거리·시간 라벨 직접 합성
 * - 선택 단지 수에 따른 지도/하단 리스트 가변 높이 레이아웃
 * - 리얼랭커스 리포트 표준 화이트 헤더/푸터 워터마크 적용
 * ==========================================================================
 */
(function (global) {
  "use strict";

  var A4_W = 1754; // A4 Landscape @150dpi (297mm)
  var A4_H = 1240; // A4 Landscape @150dpi (210mm)
  var HEADER_H = 48;
  var FOOTER_H = 46;
  var MARGIN_X = 24;
  var FONT_FAMILY = "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif";

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatDateTimeStamp() {
    var d = new Date();
    return (
      d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + "_" +
      pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds())
    );
  }

  function extractRegionLabel(course) {
    if (!course || !course.length) return "코스";
    var addr = (course[0].address || "").trim();
    if (!addr) return "코스";
    var parts = addr.split(/\s+/);
    var tokens = [];
    if (parts.length >= 3 && (parts[2].endsWith("구") || parts[2].endsWith("군"))) {
      tokens = [parts[0], parts[1], parts[2]];
    } else if (parts.length >= 2) {
      tokens = [parts[0], parts[1]];
    } else {
      tokens = [parts[0]];
    }
    return tokens.join("_").replace(/[\\/:*?"<>|]/g, "") || "코스";
  }

  function buildExportFilename(course, ext) {
    return "리얼랭커스_현장답사플래너_" + extractRegionLabel(course) + "_" + formatDateTimeStamp() + "." + ext;
  }

  function formatKoreanDate() {
    var d = new Date();
    return d.getFullYear() + "년 " + (d.getMonth() + 1) + "월 " + d.getDate() + "일";
  }

  function formatCapturedTimestamp() {
    var d = new Date();
    return (
      d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + " " +
      pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds())
    );
  }

  function toCircled(n) {
    if (global.RealCrewRoute && typeof global.RealCrewRoute.formatCircledNumber === "function") {
      return global.RealCrewRoute.formatCircledNumber(n);
    }
    return String(n);
  }

  function fillRoundRect(ctx, x, y, w, h, r, fillStyle) {
    var radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
  }

  function strokeRoundRect(ctx, x, y, w, h, r, strokeStyle, lineWidth) {
    var radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth || 1;
    ctx.stroke();
  }

  function drawEllipsisText(ctx, text, x, y, maxWidth) {
    var str = String(text || "");
    if (maxWidth <= 0) return;
    if (ctx.measureText(str).width <= maxWidth) {
      ctx.fillText(str, x, y);
      return;
    }
    var ell = "…";
    var lo = 0;
    var hi = str.length;
    while (lo < hi) {
      var mid = Math.ceil((lo + hi) / 2);
      if (ctx.measureText(str.slice(0, mid) + ell).width <= maxWidth) lo = mid;
      else hi = mid - 1;
    }
    ctx.fillText(str.slice(0, lo) + ell, x, y);
  }

  /* ------------------------------------------------------------------------
   * 지도 캡처 (overlayLayer 내부에 마운트된 경로 언더레이 캔버스 + 선택 마커 + 거리 라벨을 단일 패스로 캡처)
   * ------------------------------------------------------------------------ */
  function captureMapSnapshot(radarCenterCpx, visualScale) {
    var mapEl = document.getElementById("realcrewMap");
    if (!mapEl || typeof global.html2canvas !== "function") {
      return Promise.resolve({ canvas: null });
    }

    var capW = mapEl.clientWidth || 1280;
    var capH = mapEl.clientHeight || 720;
    var capScale = capW > 1800 ? 1.5 : 2;

    return global.RealCrewMap.mountCaptureRouteCanvas(radarCenterCpx, visualScale)
      .then(function () {
        return global.html2canvas(mapEl, {
          useCORS: true,
          allowTaint: false,
          scale: capScale,
          backgroundColor: "#e2e8f0",
          logging: false,
          width: capW,
          height: capH,
          scrollX: 0,
          scrollY: 0,
          ignoreElements: function (el) {
            if (!el) return false;
            if (el.id === "rcLoading" || el.id === "rcMapBanner" || el.id === "rcLocationBtn" || el.id === "rcMobileTopBar") {
              return true;
            }
            // 캡처 시 코스에 선택되지 않은 일반 단지 마커 및 지역 마커 제외
            if (el.classList && el.classList.contains("rc-marker-wrap") && !el.classList.contains("is-selected")) {
              return true;
            }
            if (el.classList && el.classList.contains("rc-region-marker")) {
              return true;
            }
            // 네이버 지도 줌(+/-) 컨트롤 제외
            if (el.getAttribute && (el.getAttribute("title") === "확대" || el.getAttribute("title") === "축소")) {
              return true;
            }
            return false;
          }
        });
      })
      .then(function (canvas) {
        global.RealCrewMap.unmountCaptureRouteCanvas();
        return { canvas: canvas };
      })
      .catch(function (err) {
        global.RealCrewMap.unmountCaptureRouteCanvas();
        console.warn("지도 html2canvas 캡처 경고:", err);
        return { canvas: null };
      });
  }

  /* ------------------------------------------------------------------------
   * 캡처된 지도 이미지를 A4 지도 영역에 그리기 (경로·마커·라벨이 모두 단일 좌표계로 합성된 상태)
   * ------------------------------------------------------------------------ */
  function drawMapWithVectorOverlays(ctx, snapshot, dx, dy, dw, dh, radius) {
    var imgCanvas = snapshot && snapshot.canvas;

    ctx.save();
    fillRoundRect(ctx, dx, dy, dw, dh, radius || 10, "#e2e8f0");
    ctx.clip();

    if (imgCanvas && imgCanvas.width > 0 && imgCanvas.height > 0) {
      var sw = imgCanvas.width;
      var sh = imgCanvas.height;
      var srcRatio = sw / sh;
      var dstRatio = dw / dh;
      var sx = 0, sy = 0, cropW = sw, cropH = sh;

      if (srcRatio > dstRatio) {
        cropW = sh * dstRatio;
        sx = (sw - cropW) / 2;
      } else {
        cropH = sw / dstRatio;
        sy = (sh - cropH) / 2;
      }
      ctx.drawImage(imgCanvas, sx, sy, cropW, cropH, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(dx, dy, dw, dh);
      ctx.fillStyle = "#64748b";
      ctx.font = "600 22px " + FONT_FAMILY;
      ctx.textAlign = "center";
      ctx.fillText("지도를 캡처할 수 없습니다.", dx + dw / 2, dy + dh / 2);
      ctx.textAlign = "left";
    }

    ctx.restore();
    strokeRoundRect(ctx, dx, dy, dw, dh, radius || 10, "#e2e8f0", 1.5);
  }

  function computeCourseTotals(course, segments, options) {
    var totalDist = 0;
    var totalMoveMin = 0;
    for (var i = 0; i < segments.length; i++) {
      var s = segments[i];
      totalDist += s.distanceMeters || 0;
      totalMoveMin += s.displayMinutes != null ? s.displayMinutes : (s.durationMinutes || 0);
    }
    var dwellMin = options.dwellEnabled ? course.length * 15 : 0;
    return {
      count: course.length,
      totalDist: totalDist,
      totalMoveMin: totalMoveMin,
      totalMin: course.length > 0 ? (totalMoveMin + dwellMin) : 0
    };
  }

  /* ------------------------------------------------------------------------
   * 리얼랭커스 표준 화이트 헤더 & 푸터 (참조 이미지 스타일)
   * ------------------------------------------------------------------------ */
  function drawReportHeader(ctx, leftTitle, rightSummary) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, A4_W, HEADER_H);

    ctx.fillStyle = "#475569";
    ctx.font = "700 17px " + FONT_FAMILY;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(leftTitle, MARGIN_X, HEADER_H / 2 + 1);

    if (rightSummary) {
      ctx.fillStyle = "#64748b";
      ctx.font = "600 14.5px " + FONT_FAMILY;
      ctx.textAlign = "right";
      ctx.fillText(rightSummary, A4_W - MARGIN_X, HEADER_H / 2 + 1);
      ctx.textAlign = "left";
    }
  }

  function drawReportFooter(ctx, pageLabel) {
    var footerTop = A4_H - FOOTER_H;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, footerTop, A4_W, FOOTER_H);

    // 좌측 하단: Captured at + 타임스탬프 (2줄)
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 11.5px " + FONT_FAMILY;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText("Captured at", MARGIN_X, footerTop + 8);
    ctx.fillText(formatCapturedTimestamp(), MARGIN_X, footerTop + 23);

    // 우측 하단: 리얼랭커스 | realrankus.com (+ 페이지 번호)
    var rightX = A4_W - MARGIN_X;
    var centerY = footerTop + FOOTER_H / 2 + 1;
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";

    var suffix = "realrankus.com" + (pageLabel ? "  (" + pageLabel + ")" : "");
    ctx.fillStyle = "#64748b";
    ctx.font = "600 14px " + FONT_FAMILY;
    ctx.fillText(suffix, rightX, centerY);
    var suffixW = ctx.measureText(suffix).width;

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "400 14px " + FONT_FAMILY;
    ctx.fillText(" | ", rightX - suffixW, centerY);
    var sepW = ctx.measureText(" | ").width;

    ctx.fillStyle = "#E43B46";
    ctx.font = "800 15.5px " + FONT_FAMILY;
    ctx.fillText("리얼랭커스", rightX - suffixW - sepW, centerY);
    ctx.textAlign = "left";
  }

  /* ------------------------------------------------------------------------
   * 1페이지(및 스크린샷): 가변 크기 상단 지도 + 하단 콤팩트 가로형 단지 이동 순서
   * ------------------------------------------------------------------------ */
  function renderOverviewPageCanvas(mapSnapshot, course, segments, options) {
    var canvas = document.createElement("canvas");
    canvas.width = A4_W;
    canvas.height = A4_H;
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, A4_W, A4_H);

    var totals = computeCourseTotals(course, segments, options);
    var distStr = global.RealCrewRoute.formatDistance(totals.totalDist);
    var timeStr = global.RealCrewRoute.formatDuration(totals.totalMin);
    var optTags = [];
    if (options.dwellEnabled) optTags.push("단지당 15분 체류 포함");
    if (options.carOver600Enabled) optTags.push("600m+ 차량");
    var rightSummary =
      "총 " + totals.count + "단지 / 예상 " + timeStr + " 소요 / 이동 " + distStr +
      (optTags.length ? " (" + optTags.join(", ") + ")" : "");

    // 2026-11-22: PDF 본문 페이지(2페이지) 좌/우 상단 안내 교체 및 우측 날짜 제거
    if (options.isPdf) {
      drawReportHeader(ctx, rightSummary, "현장답사 코스 | 리얼플래너");
    } else {
      drawReportHeader(ctx, formatKoreanDate() + " 현장답사 코스 | 리얼플래너", rightSummary);
    }

    // 1) 선택 단지 수에 따라 하단 단지 이동순서 영역 높이 먼저 계산 (빈 공간 제거 + 가변 크기)
    var n = course.length;
    var cols = n <= 6 ? n : (n <= 12 ? Math.ceil(n / 2) : (n <= 21 ? Math.ceil(n / 3) : Math.ceil(n / 4)));
    cols = Math.max(1, Math.min(8, cols));
    var rows = Math.ceil(n / cols);

    var cardH = rows <= 2 ? 82 : (rows === 3 ? 74 : 68);
    var rowGap = rows >= 4 ? 8 : 10;
    var stripHeaderH = 38;
    var stripPadBottom = 14;
    var stripH = stripHeaderH + rows * cardH + (rows - 1) * rowGap + stripPadBottom;

    var stripX = MARGIN_X;
    var stripW = A4_W - MARGIN_X * 2;
    var stripY = A4_H - FOOTER_H - 8 - stripH;

    // 2) 남은 상단 공간을 모두 지도에 할당 (단지가 적을수록 지도가 더 크게 표시됨)
    var mapX = MARGIN_X;
    var mapY = HEADER_H + 4;
    var mapW = A4_W - MARGIN_X * 2;
    var mapH = stripY - mapY - 12;

    drawMapWithVectorOverlays(ctx, mapSnapshot, mapX, mapY, mapW, mapH, 10, null);

    // 3) 하단 가로형 단지 이동 순서 렌더링
    fillRoundRect(ctx, stripX, stripY, stripW, stripH, 10, "#f8fafc");
    strokeRoundRect(ctx, stripX, stripY, stripW, stripH, 10, "#e2e8f0", 1.2);

    ctx.fillStyle = "#0f172a";
    ctx.font = "800 15.5px " + FONT_FAMILY;
    ctx.textBaseline = "middle";
    ctx.fillText("단지 이동 순서 (" + n + "개 단지)", stripX + 16, stripY + 20);

    var padX = 14;
    var topStart = stripY + stripHeaderH;
    var availW = stripW - padX * 2;
    var arrowW = cols >= 7 ? 40 : 48;
    var cardW = Math.floor((availW - arrowW * (cols - 1)) / cols);

    for (var i = 0; i < n; i++) {
      var r = Math.floor(i / cols);
      var c = i % cols;
      var cx = stripX + padX + c * (cardW + arrowW);
      var cy = topStart + r * (cardH + rowGap);
      var cpx = course[i];

      fillRoundRect(ctx, cx, cy, cardW, cardH, 8, "#ffffff");
      strokeRoundRect(ctx, cx, cy, cardW, cardH, 8, "#e2e8f0", 1);

      var compact = rows >= 3;
      var innerPad = compact ? 7 : 10;

      // 1줄: 원문자 순번 + 단지명 + 등급
      ctx.textBaseline = "top";
      ctx.fillStyle = "#E43B46";
      ctx.font = (compact ? "800 13.5px " : "800 15px ") + FONT_FAMILY;
      var numText = toCircled(i + 1);
      ctx.fillText(numText, cx + innerPad, cy + innerPad);
      var numW = ctx.measureText(numText).width + 4;

      var badgeW = compact ? 24 : 28;
      var badgeH = compact ? 17 : 19;
      fillRoundRect(ctx, cx + cardW - innerPad - badgeW, cy + innerPad - 1, badgeW, badgeH, 4, cpx.gradeColor);
      ctx.fillStyle = "#ffffff";
      ctx.font = (compact ? "800 10.5px " : "800 11.5px ") + FONT_FAMILY;
      ctx.textAlign = "center";
      ctx.fillText(cpx.grade, cx + cardW - innerPad - badgeW / 2, cy + innerPad + (compact ? 2 : 2.5));
      ctx.textAlign = "left";

      ctx.fillStyle = "#0f172a";
      ctx.font = (compact ? "700 13px " : "700 14.5px ") + FONT_FAMILY;
      drawEllipsisText(ctx, cpx.name, cx + innerPad + numW, cy + innerPad, cardW - innerPad * 2 - numW - badgeW - 5);

      // 2줄: 세대수 / 준공년차 (또는 점수 · 시세)
      var metaParts = [];
      if (cpx.households) metaParts.push(cpx.households.toLocaleString() + "세대");
      if (cpx.builtYears != null && isFinite(cpx.builtYears)) metaParts.push(Math.round(cpx.builtYears) + "년차");
      var metaStr = metaParts.length ? metaParts.join(" / ") : (cpx.score.toFixed(1) + "점 / " + cpx.priceText);

      ctx.fillStyle = "#475569";
      ctx.font = (compact ? "500 11px " : "500 12px ") + FONT_FAMILY;
      drawEllipsisText(ctx, metaStr, cx + innerPad, cy + innerPad + (compact ? 21 : 24), cardW - innerPad * 2);

      // 3줄: 법정동 주소
      if (cpx.address) {
        ctx.fillStyle = "#64748b";
        ctx.font = (compact ? "400 10.5px " : "400 11.5px ") + FONT_FAMILY;
        drawEllipsisText(ctx, cpx.address, cx + innerPad, cy + innerPad + (compact ? 38 : 44), cardW - innerPad * 2);
      }

      // 다음 단지로 가는 가로 화살표 + 거리/시간
      if (i < n - 1) {
        var seg = segments[i];
        var palette = global.RealCrewMap.getSegmentPalette
          ? global.RealCrewMap.getSegmentPalette(i)
          : { line: "#F87171", text: "#DC2626" };
        var segDist = seg ? global.RealCrewRoute.formatDistance(seg.distanceMeters) : "";
        var segMin = seg ? ((seg.displayMinutes != null ? seg.displayMinutes : seg.durationMinutes) + "분") : "";

        if (c < cols - 1) {
          var ax = cx + cardW + arrowW / 2;
          var ay = cy + cardH / 2;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          ctx.fillStyle = palette.text;
          ctx.font = "800 15px " + FONT_FAMILY;
          ctx.fillText("→", ax, ay - 10);

          ctx.fillStyle = "#1e293b";
          ctx.font = "700 10.5px " + FONT_FAMILY;
          ctx.fillText(segDist, ax, ay + 6);

          ctx.fillStyle = "#64748b";
          ctx.font = "500 10px " + FONT_FAMILY;
          ctx.fillText((seg && seg.isCar ? "차 " : "") + segMin, ax, ay + 19);
          ctx.textAlign = "left";
        }
      }
    }

    drawReportFooter(ctx, options.pageLabel || "");
    return canvas;
  }

  /* ------------------------------------------------------------------------
   * PDF 개별 단지 페이지 (리얼레이더맵 스크린샷 스타일: 좌측 입지 분석 + 우측 레이더 지도)
   * ------------------------------------------------------------------------ */
  function renderComplexRadarPageCanvas(mapSnapshot, cpx, idx, course, segments, pageNum, totalPages) {
    var canvas = document.createElement("canvas");
    canvas.width = A4_W;
    canvas.height = A4_H;
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, A4_W, A4_H);

    var fd = cpx.fullData || {};
    var headerLeft = toCircled(idx + 1) + " " + cpx.name + " / Rank " + cpx.grade + " (" + cpx.score.toFixed(1) + "점)";
    drawReportHeader(ctx, headerLeft, "주변 입지 환경 분석 | 리얼플래너");

    var contentTop = HEADER_H + 4;
    var contentH = A4_H - FOOTER_H - 8 - contentTop;

    // 좌측 입지 정보 패널
    var leftX = MARGIN_X;
    var leftY = contentTop;
    var leftW = 560;
    var leftH = contentH;
    fillRoundRect(ctx, leftX, leftY, leftW, leftH, 10, "#f8fafc");
    strokeRoundRect(ctx, leftX, leftY, leftW, leftH, 10, "#e2e8f0", 1.2);

    var x = leftX + 20;
    var w = leftW - 40;
    var y = leftY + 20;

    // 1) 단지 헤더 카드
    fillRoundRect(ctx, x, y, w, 114, 10, "#ffffff");
    strokeRoundRect(ctx, x, y, w, 114, 10, "#e2e8f0", 1);

    ctx.fillStyle = "#0f172a";
    ctx.font = "800 22px " + FONT_FAMILY;
    ctx.textBaseline = "top";
    drawEllipsisText(ctx, toCircled(idx + 1) + " " + cpx.name + " (Rank " + cpx.grade + ")", x + 16, y + 14, w - 32);

    var metaLine = [];
    if (cpx.households) metaLine.push(cpx.households.toLocaleString() + "세대");
    if (cpx.builtDate) {
      metaLine.push(cpx.builtDate + (cpx.builtYears != null ? " (" + Math.round(cpx.builtYears) + "년차)" : ""));
    }
    ctx.fillStyle = "#475569";
    ctx.font = "600 14px " + FONT_FAMILY;
    drawEllipsisText(ctx, metaLine.join(" / ") || cpx.priceText, x + 16, y + 48, w - 32);

    ctx.fillStyle = "#64748b";
    ctx.font = "500 13px " + FONT_FAMILY;
    drawEllipsisText(ctx, cpx.address || "", x + 16, y + 72, w - 32);

    ctx.fillStyle = "#1e293b";
    ctx.font = "700 13px " + FONT_FAMILY;
    var specStr = "최근 " + cpx.priceText + (cpx.areaText ? " (" + cpx.areaText + ")" : "") +
      (fd["전세가율"] ? " / 전세가율 " + Number(fd["전세가율"]).toFixed(1) + "%" : "") +
      (fd["세대당주차수"] ? " / 주차 " + Number(fd["세대당주차수"]).toFixed(2) + "대" : "");
    drawEllipsisText(ctx, specStr, x + 16, y + 92, w - 32);

    // 2) 리얼랭커스 4대 입지 점수 막대 차트
    y += 128;
    fillRoundRect(ctx, x, y, w, 186, 10, "#ffffff");
    strokeRoundRect(ctx, x, y, w, 186, 10, "#e2e8f0", 1);

    ctx.fillStyle = "#0f172a";
    ctx.font = "800 15.5px " + FONT_FAMILY;
    ctx.fillText("입지 가치 점수 (종합 " + cpx.score.toFixed(1) + "점)", x + 16, y + 14);

    var scoreBars = [
      { label: "주거", val: Number(fd["주거총점"]) || 0, color: "#E43B46" },
      { label: "교통", val: Number(fd["교통총점"]) || 0, color: "#3b82f6" },
      { label: "인프라", val: Number(fd["인프라총점"]) || 0, color: "#10b981" },
      { label: "학군", val: Number(fd["학군총점"]) || 0, color: "#8b5cf6" }
    ];
    for (var b = 0; b < scoreBars.length; b++) {
      var sb = scoreBars[b];
      var by = y + 46 + b * 33;
      ctx.fillStyle = "#334155";
      ctx.font = "700 13.5px " + FONT_FAMILY;
      ctx.textBaseline = "middle";
      ctx.fillText(sb.label, x + 16, by + 8);

      var barX = x + 76;
      var barW = w - 156;
      fillRoundRect(ctx, barX, by + 2, barW, 12, 6, "#e2e8f0");
      var ratio = Math.max(0, Math.min(1, sb.val / 100));
      if (ratio > 0) {
        fillRoundRect(ctx, barX, by + 2, Math.max(10, barW * ratio), 12, 6, sb.color);
      }

      ctx.fillStyle = "#0f172a";
      ctx.font = "800 13.5px " + FONT_FAMILY;
      ctx.textAlign = "right";
      ctx.fillText(sb.val > 0 ? sb.val.toFixed(1) + "점" : "-", x + w - 16, by + 8);
      ctx.textAlign = "left";
    }

    // 3) 주변 입지 분석 요약표
    y += 200;
    var stationText = fd["가까운역이름"]
      ? fd["가까운역이름"] + "역 (" + Math.round(Number(fd["가까운역거리"]) || 0) + "m)"
      : "-";
    var bigMartCnt = fd["1km이내대형마트수"] != null ? fd["1km이내대형마트수"] : (fd["1km이내대형먀트수"] != null ? fd["1km이내대형먀트수"] : "-");
    var infoRows = [
      ["가까운 지하철역", stationText],
      ["30분 / 1시간 주요 거점", (fd["30분이내주요거점역"] != null ? fd["30분이내주요거점역"] + "개" : "-") + " / " + (fd["1시간이내주요거점역"] != null ? fd["1시간이내주요거점역"] + "개" : "-")],
      ["백화점(3km) / 마트(1km)", (fd["3km이내백화점수"] != null ? fd["3km이내백화점수"] + "개" : "-") + " / " + (bigMartCnt !== "-" ? bigMartCnt + "개" : "-")],
      ["병원(500m) / 공원(500m)", (fd["500m이내병원수"] != null ? fd["500m이내병원수"] + "개" : "-") + " / " + (fd["500m이내공원수"] != null ? fd["500m이내공원수"] + "개" : "-")],
      ["300m 이내 상권 점포", fd["300m이내점포수"] != null ? Number(fd["300m이내점포수"]).toLocaleString() + "개" : "-"],
      ["초등학교 거리", fd["초등학교거리"] != null ? Math.round(Number(fd["초등학교거리"])) + "m" : "-"],
      ["중학교 학업성취도", fd["중학교학업성취도"] != null ? Number(fd["중학교학업성취도"]).toFixed(1) + "%" : "-"],
      ["500m / 1km 학원 수", (fd["500m이내학원수"] != null ? fd["500m이내학원수"] + "개" : "-") + " / " + (fd["1km이내학원수"] != null ? fd["1km이내학원수"] + "개" : "-")]
    ];

    var rowH = 40;
    fillRoundRect(ctx, x, y, w, infoRows.length * rowH, 10, "#ffffff");
    strokeRoundRect(ctx, x, y, w, infoRows.length * rowH, 10, "#e2e8f0", 1);

    for (var rIdx = 0; rIdx < infoRows.length; rIdx++) {
      var ry = y + rIdx * rowH;
      if (rIdx > 0) {
        ctx.strokeStyle = "#f1f5f9";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 12, ry);
        ctx.lineTo(x + w - 12, ry);
        ctx.stroke();
      }
      ctx.fillStyle = "#64748b";
      ctx.font = "600 13px " + FONT_FAMILY;
      ctx.textBaseline = "middle";
      ctx.fillText(infoRows[rIdx][0], x + 14, ry + rowH / 2);

      ctx.fillStyle = "#0f172a";
      ctx.font = "700 13.5px " + FONT_FAMILY;
      ctx.textAlign = "right";
      drawEllipsisText(ctx, infoRows[rIdx][1], x + w - 14, ry + rowH / 2, w * 0.56);
      ctx.textAlign = "left";
    }

    // 4) 답사 코스 전·후 이동 동선 박스
    var navBoxY = leftY + leftH - 116;
    fillRoundRect(ctx, x, navBoxY, w, 96, 10, "#0f172a");
    ctx.fillStyle = "#94a3b8";
    ctx.font = "700 12px " + FONT_FAMILY;
    ctx.textBaseline = "top";
    ctx.fillText("코스 내 이동 동선", x + 16, navBoxY + 12);

    var prevSeg = idx > 0 ? segments[idx - 1] : null;
    var nextSeg = idx < course.length - 1 ? segments[idx] : null;
    var prevText = prevSeg
      ? "이전 " + toCircled(idx) + " " + course[idx - 1].name + " → " +
        global.RealCrewRoute.formatDistance(prevSeg.distanceMeters) + " (" +
        (prevSeg.isCar ? "차량 " : "도보 ") + (prevSeg.displayMinutes != null ? prevSeg.displayMinutes : prevSeg.durationMinutes) + "분)"
      : "출발 단지 (" + toCircled(1) + " 시작점)";
    var nextText = nextSeg
      ? "다음 " + toCircled(idx + 2) + " " + course[idx + 1].name + " → " +
        global.RealCrewRoute.formatDistance(nextSeg.distanceMeters) + " (" +
        (nextSeg.isCar ? "차량 " : "도보 ") + (nextSeg.displayMinutes != null ? nextSeg.displayMinutes : nextSeg.durationMinutes) + "분)"
      : "마지막 도착 단지";

    ctx.fillStyle = "#f8fafc";
    ctx.font = "600 13.5px " + FONT_FAMILY;
    drawEllipsisText(ctx, prevText, x + 16, navBoxY + 36, w - 32);
    ctx.fillStyle = "#fda4af";
    drawEllipsisText(ctx, nextText, x + 16, navBoxY + 62, w - 32);

    // 우측 레이더 지도 영역 (벡터 레이더 원 + 전/후 경로 + 거리·시간 라벨 포함)
    var rightX = leftX + leftW + 16;
    var rightY = contentTop;
    var rightW = A4_W - rightX - MARGIN_X;
    var rightH = contentH;
    drawMapWithVectorOverlays(ctx, mapSnapshot, rightX, rightY, rightW, rightH, 10, cpx);

    var pNum = pageNum || (idx + 3);
    var pTot = totalPages || (course.length + 3);
    drawReportFooter(ctx, "Page " + pNum + " / " + pTot);
    return canvas;
  }

  function downloadCanvasPng(canvas, filename) {
    var link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function lngToWorldX(lng, zoom) {
    return ((lng + 180) / 360) * 256 * Math.pow(2, zoom);
  }

  function latToWorldY(lat, zoom) {
    var clamped = Math.max(-85, Math.min(85, lat));
    var rad = (clamped * Math.PI) / 180;
    var sin = Math.sin(rad);
    return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * 256 * Math.pow(2, zoom);
  }

  function worldYToLat(y, zoom) {
    var n = Math.PI - (2 * Math.PI * y) / (256 * Math.pow(2, zoom));
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  /**
   * 선택된 단지 수 및 전체 코스(단지 + 이동경로)의 지리적 범위를 분석해
   * 네이버 지도 정수 줌 단계의 여백 손실 없이 마커/경로가 A4 지도 높이·폭에 최대한 꽉 차도록
   * 최적 줌(Z), 캡처 컨테이너 크기(capW, capH), 시각적 중심좌표 및 균일 마커/경로 스케일을 계산
   */
  function computeOverviewLayoutMetrics(course, segments) {
    var n = Math.max(1, (course && course.length) || 1);
    var cols = n <= 6 ? n : (n <= 12 ? Math.ceil(n / 2) : (n <= 21 ? Math.ceil(n / 3) : Math.ceil(n / 4)));
    cols = Math.max(1, Math.min(8, cols));
    var rows = Math.ceil(n / cols);

    var cardH = rows <= 2 ? 82 : (rows === 3 ? 74 : 68);
    var rowGap = rows >= 4 ? 8 : 10;
    var stripHeaderH = 38;
    var stripPadBottom = 14;
    var stripH = stripHeaderH + rows * cardH + (rows - 1) * rowGap + stripPadBottom;

    var stripX = MARGIN_X;
    var stripW = A4_W - MARGIN_X * 2;
    var stripY = A4_H - FOOTER_H - 8 - stripH;

    var mapX = MARGIN_X;
    var mapY = HEADER_H + 4;
    var mapW = A4_W - MARGIN_X * 2;
    var mapH = stripY - mapY - 12;

    // 코스 내 모든 단지 좌표 + 실제 이동경로 좌표의 최소/최대 바운딩 박스 계산
    var minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    if (course && course.length) {
      for (var i = 0; i < course.length; i++) {
        var c = course[i];
        if (!c || !isFinite(c.lat) || !isFinite(c.lng)) continue;
        if (c.lat < minLat) minLat = c.lat;
        if (c.lat > maxLat) maxLat = c.lat;
        if (c.lng < minLng) minLng = c.lng;
        if (c.lng > maxLng) maxLng = c.lng;
      }
    }
    if (segments && segments.length) {
      for (var s = 0; s < segments.length; s++) {
        var path = segments[s] && segments[s].path;
        if (!path) continue;
        for (var p = 0; p < path.length; p++) {
          var pt = path[p];
          if (!pt || !isFinite(pt.lat) || !isFinite(pt.lng)) continue;
          if (pt.lat < minLat) minLat = pt.lat;
          if (pt.lat > maxLat) maxLat = pt.lat;
          if (pt.lng < minLng) minLng = pt.lng;
          if (pt.lng > maxLng) maxLng = pt.lng;
        }
      }
    }

    // 최종 A4 지도 영역 내 마커 지붕(상단) 및 여백 확보 후 실제 코스 영역이 채울 가용 영역
    var padTopA4 = 74;
    var padBottomA4 = 26;
    var padLeftA4 = 52;
    var padRightA4 = 52;
    var availW = Math.max(200, mapW - padLeftA4 - padRightA4);
    var availH = Math.max(200, mapH - padTopA4 - padBottomA4);

    var bestZoom = 16;
    var bestS = 0.85;
    var centerLat = isFinite(minLat) ? (minLat + maxLat) / 2 : 37.5665;
    var centerLng = isFinite(minLng) ? (minLng + maxLng) / 2 : 126.978;

    if (isFinite(minLat) && isFinite(minLng) && (maxLat > minLat || maxLng > minLng)) {
      // S = capW / mapW = capH / mapH 가 [0.72, 1.45] 구간에 들어오는 가장 높은 정수 줌 선택
      // (연속 줌 효과로 높이/폭 기준 코스 영역을 최대치로 확대 + 고해상도 네이티브 타일 확보)
      bestZoom = 10;
      bestS = 1.0;
      for (var z = 18; z >= 10; z--) {
        var spanX = Math.max(1, lngToWorldX(maxLng, z) - lngToWorldX(minLng, z));
        var spanY = Math.max(1, latToWorldY(minLat, z) - latToWorldY(maxLat, z));
        var reqS = Math.max(spanX / availW, spanY / availH);
        if (reqS <= 1.45) {
          bestZoom = z;
          bestS = Math.max(0.72, reqS);
          break;
        }
      }
      // 상단 마커 높이(padTopA4 > padBottomA4)를 고려해 중심 좌표를 약간 북쪽으로 보정
      var midWorldY = (latToWorldY(maxLat, bestZoom) + latToWorldY(minLat, bestZoom)) / 2;
      var shiftWorldY = ((padTopA4 - padBottomA4) / 2) * bestS;
      centerLat = worldYToLat(midWorldY - shiftWorldY, bestZoom);
      centerLng = (minLng + maxLng) / 2;
    }

    var capW = Math.max(960, Math.round(mapW * bestS));
    var capH = Math.max(480, Math.round(mapH * bestS));

    // 최종 A4(mapW × mapH) 상 마커 폭을 항상 74px로 일정하게 유지하는 동적 스케일
    var targetA4MarkerW = 74;
    var a4Ratio = mapW / capW; // = 1 / bestS
    var markerScale = Math.max(0.72, Math.min(1.65, targetA4MarkerW / (68 * a4Ratio)));
    var visualScale = Math.max(0.72, Math.min(1.55, capW / mapW));

    return {
      n: n,
      cols: cols,
      rows: rows,
      cardH: cardH,
      rowGap: rowGap,
      stripHeaderH: stripHeaderH,
      stripX: stripX,
      stripY: stripY,
      stripW: stripW,
      stripH: stripH,
      mapX: mapX,
      mapY: mapY,
      mapW: mapW,
      mapH: mapH,
      capW: capW,
      capH: capH,
      zoom: bestZoom,
      centerLat: centerLat,
      centerLng: centerLng,
      markerScale: markerScale,
      visualScale: visualScale
    };
  }

  /* ------------------------------------------------------------------------
   * 공개 API 1: A4 가로 스크린샷 저장
   * ------------------------------------------------------------------------ */
  function exportCourseScreenshot(course, segments, options, onStatus) {
    if (!course || course.length === 0) return Promise.reject(new Error("EMPTY_COURSE"));
    var notify = typeof onStatus === "function" ? onStatus : function () {};

    var savedView = global.RealCrewMap.getViewState();
    var savedFocused = global.RealCrewMap.lastFocusedIndex;
    var savedSize = null;
    var metrics = computeOverviewLayoutMetrics(course, segments);

    notify("전체 답사 지도 화면을 준비하는 중...");

    return global.RealCrewData.enrichCourseDetails(course)
      .then(function () {
        global.RealCrewMap.clearTempRadarCircles();
        global.RealCrewMap.captureMarkerScale = metrics.markerScale; // 지도 크기에 무관하게 A4 상 74px 균일 마커 크기 보장
        savedSize = global.RealCrewMap.resizeForCapture(metrics.capW, metrics.capH);
        global.RealCrewMap.renderRoute(segments, -1); // 전체 경로 표시
        return global.RealCrewMap.setViewForCapture(metrics.centerLat, metrics.centerLng, metrics.zoom);
      })
      .then(function () {
        // 최종 줌 기준으로 마커/경로 엔트리 갱신
        global.RealCrewMap.renderMarkers();
        global.RealCrewMap.renderRoute(segments, -1);
        notify("스크린샷을 생성하는 중...");
        return captureMapSnapshot(null, metrics.visualScale);
      })
      .then(function (mapSnapshot) {
        var pageCanvas = renderOverviewPageCanvas(mapSnapshot, course, segments, {
          dwellEnabled: options.dwellEnabled,
          carOver600Enabled: options.carOver600Enabled,
          pageLabel: ""
        });
        downloadCanvasPng(pageCanvas, buildExportFilename(course, "png"));
      })
      .finally(function () {
        global.RealCrewMap.captureMarkerScale = 1;
        global.RealCrewMap.clearTempRadarCircles();
        if (savedSize) {
          global.RealCrewMap.restoreSizeAfterCapture(savedSize);
        }
        if (savedView) {
          global.RealCrewMap.setViewForCapture(savedView.lat, savedView.lng, savedView.zoom);
        }
        global.RealCrewMap.renderRoute(segments, savedFocused);
      });
  }

  var FIREBASE_RTDB_BASE = "https://aptrank-cc61b-default-rtdb.firebaseio.com";
  var complexRadarInfoCache = Object.create(null);

  function fetchComplexRadarInfo(cpx) {
    if (!cpx || !cpx.code) return Promise.resolve(null);
    if (complexRadarInfoCache[cpx.code]) {
      return Promise.resolve(complexRadarInfoCache[cpx.code]);
    }
    var gungu = cpx.gungu;
    if (!gungu) return Promise.resolve(cpx.fullData || null);

    var url = FIREBASE_RTDB_BASE + "/complex_info/" + encodeURIComponent(gungu) + "/" + encodeURIComponent(cpx.code) + ".json";
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("Firebase HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data && typeof data === "object") {
          complexRadarInfoCache[cpx.code] = data;
          return data;
        }
        return cpx.fullData || null;
      })
      .catch(function () {
        return cpx.fullData || null;
      });
  }

  function createHiddenRadarIframe() {
    return new Promise(function (resolve, reject) {
      var iframe = document.createElement("iframe");
      iframe.id = "rpHiddenRadarCaptureIframe";
      iframe.src = "../radarMap.html?pdfCapture=1";
      iframe.style.cssText =
        "position:fixed;left:-10000px;top:0;width:1440px;height:960px;border:none;opacity:0;pointer-events:none;z-index:-1;";

      var done = false;
      var timeoutId = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error("RADAR_IFRAME_TIMEOUT"));
      }, 15000);

      iframe.onload = function () {
        // radarMap.html의 스크립트(renderRadarModalView, captureRadarMapView, html2canvas, naver.maps) 준비 대기
        var checks = 0;
        function waitReady() {
          if (done) return;
          var win = iframe.contentWindow;
          if (
            win &&
            typeof win.renderRadarModalView === "function" &&
            typeof win.captureRadarMapView === "function" &&
            typeof win.html2canvas === "function" &&
            win.naver && win.naver.maps
          ) {
            done = true;
            clearTimeout(timeoutId);
            resolve(iframe);
            return;
          }
          checks += 1;
          if (checks > 40) {
            done = true;
            clearTimeout(timeoutId);
            reject(new Error("RADAR_IFRAME_NOT_READY"));
            return;
          }
          setTimeout(waitReady, 200);
        }
        waitReady();
      };

      iframe.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(timeoutId);
        reject(new Error("RADAR_IFRAME_LOAD_ERROR"));
      };

      document.body.appendChild(iframe);
    });
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildCourseNavCardHtml(idx, course, segments) {
    var prevSeg = idx > 0 ? segments[idx - 1] : null;
    var nextSeg = idx < course.length - 1 ? segments[idx] : null;
    var prevText = prevSeg
      ? "이전 " + toCircled(idx) + " " + course[idx - 1].name + " → " +
        global.RealCrewRoute.formatDistance(prevSeg.distanceMeters) + " (" +
        (prevSeg.isCar ? "차량 " : "도보 ") + (prevSeg.displayMinutes != null ? prevSeg.displayMinutes : prevSeg.durationMinutes) + "분)"
      : "출발 단지 (" + toCircled(1) + " 시작점)";
    var nextText = nextSeg
      ? "다음 " + toCircled(idx + 2) + " " + course[idx + 1].name + " → " +
        global.RealCrewRoute.formatDistance(nextSeg.distanceMeters) + " (" +
        (nextSeg.isCar ? "차량 " : "도보 ") + (nextSeg.displayMinutes != null ? nextSeg.displayMinutes : nextSeg.durationMinutes) + "분)"
      : "마지막 도착 단지";

    return (
      '<div style="background:#0f172a;border-radius:10px;padding:10px 13px;box-sizing:border-box;display:flex;flex-direction:column;gap:4px;">' +
        '<div style="font-size:10.5px;font-weight:700;color:#94a3b8;line-height:1.3;">코스 내 이동 동선</div>' +
        '<div style="font-size:12px;font-weight:700;color:#f8fafc;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(prevText) + '</div>' +
        '<div style="font-size:12px;font-weight:700;color:#fda4af;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(nextText) + '</div>' +
      '</div>'
    );
  }

  function captureRadarPageViaIframe(iframe, complexInfo, cpx, loginStatus, extraBottomCardHtml, courseIndex) {
    return new Promise(function (resolve, reject) {
      var win = iframe && iframe.contentWindow;
      if (!win || !complexInfo) {
        reject(new Error("INVALID_RADAR_CONTEXT"));
        return;
      }

      try {
        // 2026-11-22: PDF 개별 단지 페이지 단지명 앞에 원문자 순번(①, ②, ③...) 자동 부착
        var baseName = complexInfo["아파트명"] || cpx.name || "";
        var numberedName = (typeof courseIndex === "number" && courseIndex >= 0)
          ? (toCircled(courseIndex + 1) + " " + baseName)
          : baseName;
        var clonedInfo = Object.assign({}, complexInfo, { "아파트명": numberedName });

        win.login_status = !!loginStatus;
        win.selectedSubRegion = cpx.gungu || "";
        win.origin_x = complexInfo["X"] || cpx.lng || 0;
        win.origin_y = complexInfo["Y"] || cpx.lat || 0;
        win.apt_name = numberedName;
        win.renderRadarModalView(clonedInfo);
      } catch (e) {
        reject(e);
        return;
      }

      // 네이버 지도 타일 + 레이더 원 + 상권 폴리곤 + 학교/역/인프라 마커 렌더링 안정화 대기
      setTimeout(function () {
        var finished = false;
        var guardTimer = setTimeout(function () {
          if (finished) return;
          finished = true;
          reject(new Error("RADAR_CAPTURE_TIMEOUT"));
        }, 18000);

        try {
          var radarHeaderLeft = numberedName + " / Rank " + (cpx.grade || "-") +
            (typeof cpx.score === "number" ? " (" + cpx.score.toFixed(1) + "점)" : "");
          win.captureRadarMapView(null, {
            extraBottomCardHtml: extraBottomCardHtml || "",
            headerLeftText: radarHeaderLeft,
            headerRightText: "주변 입지 환경 분석 | 리얼랭커스",
            onCaptured: function (base64Data, width, height) {
              if (finished) return;
              finished = true;
              clearTimeout(guardTimer);
              resolve({ base64Data: base64Data, width: width, height: height });
            },
            onError: function (err) {
              if (finished) return;
              finished = true;
              clearTimeout(guardTimer);
              reject(err || new Error("RADAR_CAPTURE_ERROR"));
            }
          });
        } catch (err2) {
          if (!finished) {
            finished = true;
            clearTimeout(guardTimer);
            reject(err2);
          }
        }
      }, 1150);
    });
  }

  function composeRadarImageToA4Canvas(base64Data, pageNum, totalPages) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement("canvas");
        canvas.width = A4_W;
        canvas.height = A4_H;
        var ctx = canvas.getContext("2d");

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, A4_W, A4_H);

        // 리얼레이더맵(좌측: 주거/교육/교통/인프라/코스이동동선 + 우측: 레이더 지도) 원본 비율 유지 A4 맞춤
        var srcW = img.naturalWidth || img.width;
        var srcH = img.naturalHeight || img.height;
        var cropBottom = Math.round(srcH * 0.042);
        var usableSrcH = Math.max(100, srcH - cropBottom);

        var topPad = 6;
        var maxW = A4_W - MARGIN_X * 2;
        var maxH = A4_H - FOOTER_H - topPad - 6;
        var scale = Math.min(maxW / srcW, maxH / usableSrcH);
        var drawW = Math.round(srcW * scale);
        var drawH = Math.round(usableSrcH * scale);
        var drawX = Math.round((A4_W - drawW) / 2);
        var drawY = Math.round(topPad + (maxH - drawH) / 2);

        ctx.drawImage(img, 0, 0, srcW, usableSrcH, drawX, drawY, drawW, drawH);

        // 하단 표준 리얼랭커스 푸터 (페이지 번호 포함)
        drawReportFooter(ctx, "Page " + pageNum + " / " + totalPages);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.onerror = function () {
        reject(new Error("RADAR_IMG_DECODE_ERROR"));
      };
      img.src = base64Data;
    });
  }

  var REALRANKUS_WEB_URL = "https://realrankus.com";
  var REALRANKUS_ANDROID_URL = "https://play.google.com/store/apps/details?id=com.aptrank.app";
  var REALRANKUS_IOS_URL = "https://apps.apple.com/kr/app/id6448044104";

  function drawQrCodeOnCanvas(ctx, url, x, y, size) {
    fillRoundRect(ctx, x, y, size, size, 10, "#ffffff");
    strokeRoundRect(ctx, x, y, size, size, 10, "#e2e8f0", 1.5);

    if (typeof global.qrcode !== "function") {
      ctx.fillStyle = "#64748b";
      ctx.font = "600 13px " + FONT_FAMILY;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("QR", x + size / 2, y + size / 2);
      ctx.textAlign = "left";
      return;
    }

    try {
      var qr = global.qrcode(0, "M");
      qr.addData(url);
      qr.make();
      var count = qr.getModuleCount();
      var pad = 12;
      var inner = size - pad * 2;
      var cell = inner / count;

      ctx.fillStyle = "#0f172a";
      for (var r = 0; r < count; r++) {
        for (var c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(
              x + pad + c * cell,
              y + pad + r * cell,
              Math.ceil(cell),
              Math.ceil(cell)
            );
          }
        }
      }
    } catch (e) {
      console.warn("QR 렌더링 경고:", e);
    }
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = String(text || "").split(" ");
    var line = "";
    var curY = y;
    for (var i = 0; i < words.length; i++) {
      var testLine = line ? (line + " " + words[i]) : words[i];
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, curY);
        line = words[i];
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, curY);
      curY += lineHeight;
    }
    return curY;
  }

  /* ------------------------------------------------------------------------
   * PDF 표지 페이지 (Cover Page - A4 가로)
   * ------------------------------------------------------------------------ */
  function renderCoverPageCanvas(course, segments, options) {
    var canvas = document.createElement("canvas");
    canvas.width = A4_W;
    canvas.height = A4_H;
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, A4_W, A4_H);

    // 상단 라이트 밴드
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, A4_W, 230);

    var leftX = 84;
    ctx.fillStyle = "#E43B46";
    ctx.font = "800 18px " + FONT_FAMILY;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("REALPLANNER", leftX, 88);

    ctx.fillStyle = "#64748b";
    ctx.font = "600 16px " + FONT_FAMILY;
    ctx.textAlign = "right";
    ctx.fillText(formatKoreanDate(), A4_W - 84, 88);
    ctx.textAlign = "left";

    var regionTitle = extractRegionLabel(course).replace(/_/g, " ");
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 58px " + FONT_FAMILY;
    ctx.textBaseline = "top";
    drawEllipsisText(ctx, regionTitle + " 현장답사 계획서", leftX, 126, A4_W - leftX - 84);

    // powered by Realrankus
    ctx.font = "500 20px " + FONT_FAMILY;
    ctx.fillStyle = "#64748b";
    var powPrefix = "powered by ";
    ctx.fillText(powPrefix, leftX, 254);
    var powW = ctx.measureText(powPrefix).width;
    ctx.font = "800 20px " + FONT_FAMILY;
    ctx.fillStyle = "#E43B46";
    ctx.fillText("Realrankus", leftX + powW, 254);

    // 4칸 KPI 요약 카드
    var totals = computeCourseTotals(course, segments, options);
    var distStr = global.RealCrewRoute.formatDistance(totals.totalDist);
    var timeStr = global.RealCrewRoute.formatDuration(totals.totalMin);
    var dwellDesc = options.dwellEnabled ? "단지당 15분 체류 포함" : "순수 이동시간 기준";
    var modeDesc = options.carOver600Enabled ? "도보 + 600m 이상 차량" : "전 구간 도보 이동";

    var kpiY = 330;
    var kpiH = 132;
    var kpiGap = 20;
    var kpiW = Math.floor((A4_W - leftX - 84 - kpiGap * 3) / 4);
    var kpis = [
      { label: "답사 단지 수", value: totals.count + "개 단지", sub: "리얼랭커스 점수, 동선 최적화", accent: "#E43B46" },
      { label: "예상 소요시간", value: timeStr, sub: dwellDesc, accent: "#0f172a" },
      { label: "총 이동 거리", value: distStr, sub: modeDesc, accent: "#2563eb" },
      { label: "수록 페이지", value: "총 " + (totals.count + 3) + "p", sub: "표지, 전체코스, 단지별, 안내", accent: "#059669" }
    ];

    for (var k = 0; k < kpis.length; k++) {
      var kx = leftX + k * (kpiW + kpiGap);
      fillRoundRect(ctx, kx, kpiY, kpiW, kpiH, 14, "#f8fafc");
      strokeRoundRect(ctx, kx, kpiY, kpiW, kpiH, 14, "#e2e8f0", 1.5);

      ctx.fillStyle = "#64748b";
      ctx.font = "700 15px " + FONT_FAMILY;
      ctx.fillText(kpis[k].label, kx + 22, kpiY + 22);

      ctx.fillStyle = kpis[k].accent;
      ctx.font = "800 32px " + FONT_FAMILY;
      drawEllipsisText(ctx, kpis[k].value, kx + 22, kpiY + 52, kpiW - 44);

      ctx.fillStyle = "#64748b";
      ctx.font = "500 13.5px " + FONT_FAMILY;
      drawEllipsisText(ctx, kpis[k].sub, kx + 22, kpiY + 98, kpiW - 44);
    }

    // 답사 단지 목차 박스
    var tocY = 500;
    var tocW = A4_W - leftX - 84;
    var tocH = 610;
    fillRoundRect(ctx, leftX, tocY, tocW, tocH, 16, "#ffffff");
    strokeRoundRect(ctx, leftX, tocY, tocW, tocH, 16, "#e2e8f0", 1.5);

    ctx.fillStyle = "#0f172a";
    ctx.font = "800 20px " + FONT_FAMILY;
    ctx.fillText("답사 단지 목차 (CONTENTS)", leftX + 28, tocY + 26);

    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(leftX + 28, tocY + 64);
    ctx.lineTo(leftX + tocW - 28, tocY + 64);
    ctx.stroke();

    var tocCols = course.length <= 10 ? 2 : 3;
    var tocRows = Math.ceil(course.length / tocCols);
    var colGap = 24;
    var itemW = Math.floor((tocW - 56 - colGap * (tocCols - 1)) / tocCols);
    var itemH = Math.min(48, Math.floor((tocH - 96) / Math.max(1, tocRows)));

    for (var i = 0; i < course.length; i++) {
      var colIdx = Math.floor(i / tocRows);
      var rowIdx = i % tocRows;
      var ix = leftX + 28 + colIdx * (itemW + colGap);
      var iy = tocY + 80 + rowIdx * itemH;
      var cpx = course[i];

      ctx.textBaseline = "middle";
      ctx.fillStyle = "#E43B46";
      ctx.font = "800 16px " + FONT_FAMILY;
      ctx.fillText(toCircled(i + 1), ix, iy + itemH / 2);

      fillRoundRect(ctx, ix + itemW - 86, iy + itemH / 2 - 11, 32, 22, 5, cpx.gradeColor);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 12px " + FONT_FAMILY;
      ctx.textAlign = "center";
      ctx.fillText(cpx.grade, ix + itemW - 70, iy + itemH / 2 + 0.5);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 13px " + FONT_FAMILY;
      ctx.textAlign = "right";
      ctx.fillText("p." + (i + 3), ix + itemW, iy + itemH / 2);
      ctx.textAlign = "left";

      ctx.fillStyle = "#1e293b";
      ctx.font = "700 15.5px " + FONT_FAMILY;
      drawEllipsisText(ctx, cpx.name, ix + 28, iy + itemH / 2, itemW - 122);
    }

    drawReportFooter(ctx, "Cover");
    return canvas;
  }

  /* ------------------------------------------------------------------------
   * PDF 종료 페이지 (Disclaimer + 리얼랭커스 링크 & 앱 다운로드 QR - A4 가로)
   * ------------------------------------------------------------------------ */
  function renderClosingPageCanvas(totalPages) {
    var canvas = document.createElement("canvas");
    canvas.width = A4_W;
    canvas.height = A4_H;
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, A4_W, A4_H);

    drawReportHeader(ctx, "이용 안내 및 면책 고지 (Disclaimer) | 리얼랭커스", "Realrankus / RealPlanner");

    var leftX = 60;
    var contentW = A4_W - leftX * 2;

    // 1) 상단 Disclaimer 박스
    var discY = 78;
    var discH = 448;
    fillRoundRect(ctx, leftX, discY, contentW, discH, 16, "#f8fafc");
    strokeRoundRect(ctx, leftX, discY, contentW, discH, 16, "#e2e8f0", 1.5);

    ctx.fillStyle = "#E43B46";
    ctx.font = "800 15px " + FONT_FAMILY;
    ctx.textBaseline = "top";
    ctx.fillText("DISCLAIMER / 투자 유의사항 및 데이터 안내", leftX + 34, discY + 28);

    ctx.fillStyle = "#0f172a";
    ctx.font = "800 26px " + FONT_FAMILY;
    ctx.fillText("리얼랭커스 현장답사 계획서 이용 시 꼭 확인해 주세요", leftX + 34, discY + 56);

    var bullets = [
      "1. 리얼랭커스는 '주거', '인프라', '교통', '교육환경' 등 공공데이터와 환경 요소를 AI로 분석하여 입지 점수를 제공하는 서비스이며, 가격 및 지형 고도는 점수 산정에서 제외됩니다.",
      "2. 본 리포트에 수록된 입지 점수, 순위 및 답사 코스는 정보 제공을 목적으로 하며, 투자지표나 특정 부동산의 매수, 매도 권유가 아닙니다. 모든 투자 판단과 그에 따른 책임은 투자자 본인에게 있습니다.",
      "3. 모든 입지 점수는 해당 지역구 내 상대 점수이며, 다른 지역구의 동일 점수와 같은 절대 가치를 의미하지 않습니다. 또한 월 1회 정기 업데이트 기준으로 실제 현장과 시차가 발생할 수 있습니다.",
      "4. 이동 경로, 거리 및 예상 소요시간은 공개 지도, 보행로 데이터 기반 추정치로, 실제 도로 통제, 신호 대기, 공사, 날씨 등 현장 여건에 따라 달라질 수 있으므로 이동 시 안전에 유의해 주세요."
    ];

    var curY = discY + 114;
    for (var b = 0; b < bullets.length; b++) {
      ctx.fillStyle = b === 1 ? "#0f172a" : "#334155";
      ctx.font = (b === 1 ? "700 16.5px " : "500 16.5px ") + FONT_FAMILY;
      curY = drawWrappedText(ctx, bullets[b], leftX + 34, curY, contentW - 68, 28) + 14;
    }

    // 2) 하단 3열 QR 카드 (리얼랭커스 웹 / Android 앱 / iOS 앱)
    var qrSectionY = 562;
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 22px " + FONT_FAMILY;
    ctx.fillText("리얼랭커스 바로가기 & 모바일 앱 다운로드", leftX, qrSectionY);

    ctx.fillStyle = "#64748b";
    ctx.font = "500 15px " + FONT_FAMILY;
    ctx.fillText("스마트폰 카메라로 QR코드를 스캔하거나 PDF 내 카드를 클릭하면 바로 이동합니다.", leftX, qrSectionY + 34);

    var cardY = qrSectionY + 72;
    var cardH = 496;
    var cardGap = 24;
    var cardW = Math.floor((contentW - cardGap * 2) / 3);
    var qrSize = 240;

    var cards = [
      {
        badge: "WEB SERVICE",
        badgeBg: "#fff1f2",
        badgeColor: "#E43B46",
        title: "리얼랭커스 공식 웹사이트",
        desc: "전국 아파트 AI 입지 분석 및 현장답사플래너",
        urlText: "https://realrankus.com",
        url: REALRANKUS_WEB_URL
      },
      {
        badge: "GOOGLE PLAY",
        badgeBg: "#ecfdf5",
        badgeColor: "#059669",
        title: "Android 앱 다운로드",
        desc: "안드로이드 스마트폰에서 더욱 편리하게",
        urlText: "Google Play 스토어 바로가기",
        url: REALRANKUS_ANDROID_URL
      },
      {
        badge: "APP STORE",
        badgeBg: "#eff6ff",
        badgeColor: "#2563eb",
        title: "iOS 앱 다운로드",
        desc: "아이폰, 아이패드에서 언제 어디서나",
        urlText: "Apple App Store 바로가기",
        url: REALRANKUS_IOS_URL
      }
    ];

    var linkAreas = [];
    for (var c = 0; c < cards.length; c++) {
      var item = cards[c];
      var cx = leftX + c * (cardW + cardGap);

      fillRoundRect(ctx, cx, cardY, cardW, cardH, 16, "#ffffff");
      strokeRoundRect(ctx, cx, cardY, cardW, cardH, 16, "#e2e8f0", 1.5);

      var badgeW = 136;
      fillRoundRect(ctx, cx + (cardW - badgeW) / 2, cardY + 26, badgeW, 28, 14, item.badgeBg);
      ctx.fillStyle = item.badgeColor;
      ctx.font = "800 12px " + FONT_FAMILY;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.badge, cx + cardW / 2, cardY + 41);

      ctx.fillStyle = "#0f172a";
      ctx.font = "800 21px " + FONT_FAMILY;
      ctx.fillText(item.title, cx + cardW / 2, cardY + 84);

      ctx.fillStyle = "#64748b";
      ctx.font = "500 13.5px " + FONT_FAMILY;
      ctx.fillText(item.desc, cx + cardW / 2, cardY + 114);
      ctx.textAlign = "left";

      var qrX = cx + Math.round((cardW - qrSize) / 2);
      var qrY = cardY + 146;
      drawQrCodeOnCanvas(ctx, item.url, qrX, qrY, qrSize);

      ctx.fillStyle = item.badgeColor;
      ctx.font = "700 15px " + FONT_FAMILY;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.urlText, cx + cardW / 2, cardY + 432);

      var linkTextW = ctx.measureText(item.urlText).width;
      ctx.strokeStyle = item.badgeColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx + cardW / 2 - linkTextW / 2, cardY + 444);
      ctx.lineTo(cx + cardW / 2 + linkTextW / 2, cardY + 444);
      ctx.stroke();
      ctx.textAlign = "left";

      linkAreas.push({
        xMm: (cx / A4_W) * 297,
        yMm: (cardY / A4_H) * 210,
        wMm: (cardW / A4_W) * 297,
        hMm: (cardH / A4_H) * 210,
        url: item.url
      });
    }

    drawReportFooter(ctx, "Page " + totalPages + " / " + totalPages);
    return { canvas: canvas, linkAreas: linkAreas };
  }

  /* ------------------------------------------------------------------------
   * 공개 API 2: A4 가로 PDF 저장 (표지 + 전체 코스 + 단지별 레이더맵 + 종료/Disclaimer)
   * ------------------------------------------------------------------------ */
  function exportCoursePdf(course, segments, options, onStatus) {
    if (!course || course.length === 0) return Promise.reject(new Error("EMPTY_COURSE"));
    if (!global.jspdf || !global.jspdf.jsPDF) {
      return Promise.reject(new Error("JSPDF_NOT_LOADED"));
    }

    var notify = typeof onStatus === "function" ? onStatus : function () {};
    var savedView = global.RealCrewMap.getViewState();
    var savedFocused = global.RealCrewMap.lastFocusedIndex;
    var savedSize = null;
    var metrics = computeOverviewLayoutMetrics(course, segments);
    var loginStatus = !!(global.RealCrewData && global.RealCrewData.context && global.RealCrewData.context.loginStatus);
    var hiddenIframe = null;
    var totalPages = course.length + 3; // 표지(1) + 전체코스(1) + 단지별(N) + 종료(1)

    var pdf = new global.jspdf.jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    notify("단지별 입지 데이터를 불러오는 중...");

    return global.RealCrewData.enrichCourseDetails(course)
      .then(function () {
        // 1페이지: 표지
        notify("PDF 표지 생성 중...");
        var coverCanvas = renderCoverPageCanvas(course, segments, options);
        pdf.addImage(coverCanvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, 297, 210);

        // 2페이지: 전체 코스 지도 + 가로 이동 순서 (높이·폭 기준 최대 확대 + A4 상 74px 균일 마커 크기 보장)
        notify("PDF 전체 코스 페이지 생성 중...");
        global.RealCrewMap.clearTempRadarCircles();
        global.RealCrewMap.captureMarkerScale = metrics.markerScale;
        savedSize = global.RealCrewMap.resizeForCapture(metrics.capW, metrics.capH);
        global.RealCrewMap.renderRoute(segments, -1);
        return global.RealCrewMap.setViewForCapture(metrics.centerLat, metrics.centerLng, metrics.zoom);
      })
      .then(function () {
        global.RealCrewMap.renderMarkers();
        global.RealCrewMap.renderRoute(segments, -1);
        return captureMapSnapshot(null, metrics.visualScale);
      })
      .then(function (overviewSnapshot) {
        global.RealCrewMap.captureMarkerScale = 1;
        if (savedSize) {
          global.RealCrewMap.restoreSizeAfterCapture(savedSize);
          savedSize = null;
        }
        var page2Canvas = renderOverviewPageCanvas(overviewSnapshot, course, segments, {
          dwellEnabled: options.dwellEnabled,
          carOver600Enabled: options.carOver600Enabled,
          pageLabel: "Page 2 / " + totalPages,
          isPdf: true
        });
        pdf.addPage("a4", "landscape");
        pdf.addImage(page2Canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 297, 210);

        notify("리얼레이더맵 엔진 준비 중...");
        return createHiddenRadarIframe().catch(function (err) {
          console.warn("리얼레이더맵 iframe 초기화 실패 (기본 렌더링으로 폴백):", err);
          return null;
        });
      })
      .then(function (iframe) {
        hiddenIframe = iframe;

        // 3페이지 ~ (N+2)페이지: 각 답사 단지 순서대로 리얼레이더맵 전체 화면 캡처
        var chain = Promise.resolve();
        for (var i = 0; i < course.length; i++) {
          (function (index) {
            chain = chain.then(function () {
              var cpx = course[index];
              var pageNum = index + 3;
              notify("PDF 계획서 생성 중... " + cpx.name + " (" + (index + 1) + " / " + course.length + ") ");

              return fetchComplexRadarInfo(cpx).then(function (radarInfo) {
                if (hiddenIframe && radarInfo) {
                  var courseNavHtml = buildCourseNavCardHtml(index, course, segments);
                  return captureRadarPageViaIframe(hiddenIframe, radarInfo, cpx, loginStatus, courseNavHtml, index)
                    .then(function (captured) {
                      return composeRadarImageToA4Canvas(captured.base64Data, pageNum, totalPages);
                    })
                    .then(function (composedDataUrl) {
                      pdf.addPage("a4", "landscape");
                      pdf.addImage(composedDataUrl, "JPEG", 0, 0, 297, 210);
                    })
                    .catch(function (capErr) {
                      console.warn("레이더맵 iframe 캡처 폴백 (" + cpx.name + "):", capErr);
                      return fallbackRenderComplexPage(pdf, cpx, index, course, segments, pageNum, totalPages);
                    });
                }
                return fallbackRenderComplexPage(pdf, cpx, index, course, segments, pageNum, totalPages);
              });
            });
          })(i);
        }
        return chain;
      })
      .then(function () {
        // 마지막 페이지: 종료 페이지 (Disclaimer + 리얼랭커스 웹/Android/iOS QR + 클릭 링크)
        notify("PDF 종료 페이지(Disclaimer & QR) 생성 중...");
        var closing = renderClosingPageCanvas(totalPages);
        pdf.addPage("a4", "landscape");
        pdf.addImage(closing.canvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, 297, 210);
        for (var la = 0; la < closing.linkAreas.length; la++) {
          var area = closing.linkAreas[la];
          pdf.link(area.xMm, area.yMm, area.wMm, area.hMm, { url: area.url });
        }

        notify("PDF 파일 저장 중...");
        pdf.save(buildExportFilename(course, "pdf"));
      })
      .finally(function () {
        global.RealCrewMap.captureMarkerScale = 1;
        if (hiddenIframe && hiddenIframe.parentNode) {
          hiddenIframe.parentNode.removeChild(hiddenIframe);
        }
        global.RealCrewMap.clearTempRadarCircles();
        if (savedSize) {
          global.RealCrewMap.restoreSizeAfterCapture(savedSize);
        }
        if (savedView) {
          global.RealCrewMap.setViewForCapture(savedView.lat, savedView.lng, savedView.zoom);
        }
        global.RealCrewMap.renderRoute(segments, savedFocused);
      });
  }

  function fallbackRenderComplexPage(pdf, cpx, index, course, segments, pageNum, totalPages) {
    global.RealCrewMap.clearTempRadarCircles();
    global.RealCrewMap.renderRoute(segments, index);
    return global.RealCrewMap.setViewForCapture(cpx.lat, cpx.lng, 16)
      .then(function () {
        global.RealCrewMap.renderRoute(segments, index);
        return captureMapSnapshot(cpx);
      })
      .then(function (radarSnapshot) {
        var detailCanvas = renderComplexRadarPageCanvas(radarSnapshot, cpx, index, course, segments, pageNum, totalPages);
        var imgData = detailCanvas.toDataURL("image/jpeg", 0.92);
        pdf.addPage("a4", "landscape");
        pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);
      });
  }

  global.RealPlannerExport = {
    exportCourseScreenshot: exportCourseScreenshot,
    exportCoursePdf: exportCoursePdf
  };
})(window);
