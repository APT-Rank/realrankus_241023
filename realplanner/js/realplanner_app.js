/**
 * ==========================================================================
 * realcrew_app.js
 * 리얼크루(RealCrew) 상태 관리, 자동/수동 코스 워크플로우, 리스트 편집(삭제/이동/중간추가),
 * 하단 요약 바 및 모바일 바텀시트 제어
 * ==========================================================================
 */
(function (global) {
  "use strict";

  var DWELL_MINUTES_PER_STOP = 15;
  var MAX_COURSE_STOPS = 30;
  var CAR_THRESHOLD_METERS = 600;
  var CAR_SPEED_M_PER_MIN = 417; // 도심 평균 약 25 km/h

  var state = {
    mode: null,             // null | "auto" | "manual"
    course: [],             // Complex[]
    segments: [],           // Segment[]
    routeVersion: 0,
    insertAfterIndex: null, // null | number (index after which to insert; course.length - 1 means append)
    isDrawingBox: false,
    activeStopCode: null,
    dwellEnabled: true,
    carOver600Enabled: false,
    dragSourceIndex: null
  };

  var toastTimer = null;

  function $(id) {
    return document.getElementById(id);
  }

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

  function showToast(msg) {
    var el = $("rcToast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("is-show");
    }, 2600);
  }

  var sheetCollapseTimer = null;

  function getMobileCollapsedHeight() {
    var handleEl = $("rcSheetHandle");
    var summaryBar = $("rcSummaryBar");
    var hHandle = handleEl ? (handleEl.getBoundingClientRect().height || 24) : 24;
    var hSummary = summaryBar ? (summaryBar.getBoundingClientRect().height || 74) : 74;
    return Math.round(hHandle + hSummary);
  }

  function setMobileSheetCollapsed(collapsed) {
    var sidebar = $("rcSidebar");
    if (!sidebar) return;
    if (sheetCollapseTimer) {
      clearTimeout(sheetCollapseTimer);
      sheetCollapseTimer = null;
    }

    if (window.innerWidth > 820) {
      sidebar.style.height = "";
      sidebar.classList.remove("is-collapsed", "is-dark-handle");
      return;
    }

    var currentH = Math.round(sidebar.getBoundingClientRect().height);
    var collapsedH = getMobileCollapsedHeight();
    var expandedH = Math.round(window.innerHeight * 0.54);

    if (collapsed) {
      sidebar.style.height = currentH + "px";
      void sidebar.offsetHeight; // 강제 리플로우로 시작 높이 확정
      sidebar.classList.add("is-dark-handle"); // 내려가는 동안 배경색이 부드럽게 크로스페이드
      sidebar.style.height = collapsedH + "px";
      sheetCollapseTimer = setTimeout(function () {
        sidebar.classList.add("is-collapsed");
        sidebar.style.height = "";
        sheetCollapseTimer = null;
      }, 280);
    } else {
      sidebar.style.height = currentH + "px";
      sidebar.classList.remove("is-collapsed", "is-dark-handle"); // 올라가는 동안 화이트로 부드럽게 전환
      void sidebar.offsetHeight; // 강제 리플로우로 시작 높이 확정
      sidebar.style.height = expandedH + "px";
    }
  }

  function isComplexInCourse(code) {
    for (var i = 0; i < state.course.length; i++) {
      if (state.course[i].code === code) return i;
    }
    return -1;
  }

  function getFocusedIndex() {
    if (!state.activeStopCode) return -1;
    return isComplexInCourse(state.activeStopCode);
  }

  function setFocusedStop(code, shouldPan) {
    state.activeStopCode = code || null;
    renderCourseList();
    global.RealCrewMap.renderRoute(state.segments, getFocusedIndex());
    if (shouldPan && code) {
      var cpx = global.RealCrewData.complexByCode[code];
      if (cpx) global.RealCrewMap.panToComplex(cpx);
    }
  }

  function getSegmentModeInfo(seg) {
    if (!seg) return { isCar: false, minutes: 0, distanceMeters: 0 };
    return {
      isCar: !!seg.isCar,
      minutes: seg.displayMinutes != null ? seg.displayMinutes : (seg.durationMinutes || 0),
      distanceMeters: seg.distanceMeters || 0
    };
  }

  function setRouteLoading(visible, message) {
    var loader = $("rcLoading");
    if (!loader) return;
    if (visible) {
      var textEl = loader.querySelector(".rc-loading-text");
      if (textEl) textEl.textContent = message || "실제 이동 경로를 탐색하는 중...";
      loader.style.display = "flex";
    } else {
      loader.style.display = "none";
    }
  }

  /* ------------------------------------------------------------------------
   * 경로 재계산 (즉시 추정 렌더 -> OSRM 보행로/차량도로 비동기 업그레이드 + 로딩 표시)
   * ------------------------------------------------------------------------ */
  function recalculateRoute() {
    state.routeVersion += 1;
    var myVersion = state.routeVersion;
    var routeOptions = { carOver600: state.carOver600Enabled };

    // 1) 즉시 추정값(또는 캐시)으로 0ms 반영
    state.segments = global.RealCrewRoute.computeInstantSegments(state.course, routeOptions);
    global.RealCrewMap.updateCourse(state.course, state.segments, getFocusedIndex());
    renderCourseList();
    renderSummary();

    // 2) 실제 도보(foot) 또는 차량(driving) 경로(OSRM) 비동기 보강 + 로딩 진행률 표시
    if (state.course.length >= 2) {
      var totalSegs = state.course.length - 1;
      var uncachedCount = typeof global.RealCrewRoute.countUncachedSegments === "function"
        ? global.RealCrewRoute.countUncachedSegments(state.course, routeOptions)
        : totalSegs;

      if (uncachedCount > 0) {
        setRouteLoading(true, "실제 이동 경로 탐색 중... (0 / " + totalSegs + " 구간)");
      }

      global.RealCrewRoute.fetchDetailedSegments(state.course, routeOptions, function (partialSegments, completed, total) {
        if (myVersion !== state.routeVersion) return;
        state.segments = partialSegments;
        global.RealCrewMap.renderRoute(state.segments, getFocusedIndex());
        renderCourseList();
        renderSummary();
        if (uncachedCount > 0) {
          setRouteLoading(true, "실제 이동 경로 탐색 중... (" + completed + " / " + total + " 구간)");
        }
      }).then(function (detailedSegments) {
        if (myVersion !== state.routeVersion) return;
        state.segments = detailedSegments;
        global.RealCrewMap.renderRoute(state.segments, getFocusedIndex());
        renderCourseList();
        renderSummary();
        setRouteLoading(false);
      });
    } else {
      setRouteLoading(false);
    }

    // 3) 세대수 / 준공일(년차) 상세 정보 비동기 보강
    if (state.course.length > 0 && typeof global.RealCrewData.enrichCourseDetails === "function") {
      global.RealCrewData.enrichCourseDetails(state.course).then(function (updated) {
        if (updated && myVersion === state.routeVersion) {
          renderCourseList();
        }
      });
    }
  }

  function setResetButtonsVisible(visible) {
    var displayVal = visible ? "inline-flex" : "none";
    var desktopBtn = $("rcResetBtn");
    var mobileBtn = $("rcMobileResetBtn");
    if (desktopBtn) desktopBtn.style.display = displayVal;
    if (mobileBtn) mobileBtn.style.display = displayVal;
  }

  /* ------------------------------------------------------------------------
   * 모드 전환 및 상태 UI 갱신
   * ------------------------------------------------------------------------ */
  function enterMode(mode) {
    state.mode = mode;
    state.insertAfterIndex = null;

    $("rcModeHome").style.display = "none";
    $("rcWorkspace").style.display = "flex";
    setResetButtonsVisible(true);

    if (mode === "auto") {
      activateBoxDrawing();
    } else {
      deactivateBoxDrawing();
      global.RealCrewMap.clearSelectionBoxOverlay();
      if (state.course.length === 0) {
        showToast("우측 지도에서 시작 단지를 클릭해 주세요.");
        setMobileSheetCollapsed(true);
      }
    }

    updateModeUI();
    renderCourseList();
    renderSummary();
  }

  function resetToHome() {
    state.mode = null;
    state.course = [];
    state.segments = [];
    state.insertAfterIndex = null;
    state.activeStopCode = null;
    deactivateBoxDrawing();
    global.RealCrewMap.clearSelectionBoxOverlay();
    global.RealCrewMap.updateCourse([], []);

    $("rcModeHome").style.display = "flex";
    $("rcWorkspace").style.display = "none";
    setResetButtonsVisible(false);
    setMobileSheetCollapsed(false);
    updateModeUI();
    renderSummary();
  }

  function activateBoxDrawing() {
    state.insertAfterIndex = null;
    state.isDrawingBox = true;
    global.RealCrewMap.setBoxDrawMode(true);
    setMobileSheetCollapsed(true);
    updateModeUI();
  }

  function deactivateBoxDrawing() {
    state.isDrawingBox = false;
    global.RealCrewMap.setBoxDrawMode(false);
    updateModeUI();
  }

  function startInsertAfter(index) {
    if (state.insertAfterIndex === index) {
      cancelInsertMode();
      return;
    }
    if (state.course.length >= MAX_COURSE_STOPS) {
      showToast("최대 " + MAX_COURSE_STOPS + "개 단지까지 선택할 수 있습니다.");
      return;
    }
    deactivateBoxDrawing();
    state.insertAfterIndex = index;
    setMobileSheetCollapsed(true);
    updateModeUI();
    renderCourseList();
  }

  function cancelInsertMode() {
    state.insertAfterIndex = null;
    updateModeUI();
    renderCourseList();
  }

  function updateModeUI() {
    var tabAuto = $("tabModeAuto");
    var tabManual = $("tabModeManual");
    var btnRedraw = $("btnRedrawBox");
    var guideBanner = $("rcGuideBanner");
    var guideText = $("rcGuideText");
    var guideCancel = $("rcGuideCancelBtn");
    var mapBanner = $("rcMapBanner");
    var mapBannerIcon = $("rcMapBannerIcon");
    var mapBannerText = $("rcMapBannerText");
    var mapBannerCancel = $("rcMapBannerCancel");

    tabAuto.classList.toggle("is-active", state.mode === "auto");
    tabManual.classList.toggle("is-active", state.mode === "manual");

    btnRedraw.style.display = state.mode === "auto" ? "inline-flex" : "none";
    btnRedraw.classList.toggle("is-drawing", state.isDrawingBox);
    btnRedraw.innerHTML = state.isDrawingBox
      ? '<i class="fa-solid fa-xmark"></i> 취소'
      : '<i class="fa-solid fa-crop-simple"></i> 영역';

    // 우선순위 1: 중간/끝 삽입 대기 모드
    if (state.insertAfterIndex !== null) {
      var isAppend = state.insertAfterIndex >= state.course.length - 1;
      var msg = isAppend
        ? "코스 끝에 추가할 단지를 지도에서 선택하세요."
        : toCircled(state.insertAfterIndex + 1) + "번과 " + toCircled(state.insertAfterIndex + 2) + "번 사이에 추가할 단지를 지도에서 선택하세요.";

      guideBanner.style.display = "flex";
      guideBanner.classList.add("is-insert");
      guideText.textContent = msg;
      guideCancel.style.display = "inline-block";

      mapBanner.style.display = "flex";
      mapBannerIcon.innerHTML = '<i class="fa-solid fa-plus-circle"></i>';
      mapBannerText.textContent = msg;
      mapBannerCancel.style.display = "inline-block";
      return;
    }

    // 우선순위 2: 자동 모드 사각박스 드래그 중
    if (state.isDrawingBox) {
      var boxMsg = "지도 위를 드래그하여 답사할 사각 영역을 선택하세요.";
      guideBanner.style.display = "flex";
      guideBanner.classList.remove("is-insert");
      guideText.textContent = boxMsg;
      guideCancel.style.display = "inline-block";

      mapBanner.style.display = "flex";
      mapBannerIcon.innerHTML = '<i class="fa-solid fa-vector-square"></i>';
      mapBannerText.textContent = boxMsg;
      mapBannerCancel.style.display = "inline-block";
      return;
    }

    // 우선순위 3: 수동 모드
    if (state.mode === "manual") {
      var manualMsg = state.course.length === 0
        ? "지도에서 시작 단지(" + toCircled(1) + ")를 클릭하세요."
        : "지도에서 다음 단지를 클릭하면 코스에 순서대로 추가됩니다.";
      guideBanner.style.display = "flex";
      guideBanner.classList.remove("is-insert");
      guideText.textContent = manualMsg;
      guideCancel.style.display = "none";

      mapBanner.style.display = "flex";
      mapBannerIcon.innerHTML = '<i class="fa-solid fa-hand-pointer"></i>';
      mapBannerText.textContent = manualMsg;
      mapBannerCancel.style.display = "none";
      return;
    }

    guideBanner.style.display = "none";
    mapBanner.style.display = "none";
  }

  /* ------------------------------------------------------------------------
   * 지도 인터랙션 콜백
   * ------------------------------------------------------------------------ */
  function handleBoxSelected(bounds) {
    var inBox = global.RealCrewData.getComplexesInBounds(
      bounds.south,
      bounds.west,
      bounds.north,
      bounds.east
    );

    if (inBox.length === 0) {
      global.RealCrewMap.clearSelectionBoxOverlay();
      activateBoxDrawing();
      showToast("선택한 영역 안에 단지가 없습니다. 다시 영역을 드래그해 주세요.");
      return;
    }

    if (inBox.length > MAX_COURSE_STOPS) {
      global.RealCrewMap.clearSelectionBoxOverlay();
      activateBoxDrawing();
      showToast("선택 영역에 " + inBox.length + "개 단지가 있습니다. 최대 " + MAX_COURSE_STOPS + "개 이하로 다시 영역을 선택해 주세요.");
      return;
    }

    state.isDrawingBox = false;
    updateModeUI();

    var built = global.RealCrewRoute.buildAutoCourse(inBox);
    state.course = built.course;
    state.activeStopCode = null; // 초기 생성 시 전체 경로 표시

    recalculateRoute();
    global.RealCrewMap.fitCourseBounds(state.course);
    setMobileSheetCollapsed(false);

    showToast("영역 내 " + built.course.length + "개 단지로 자동 코스를 생성했습니다.");
  }

  function handleMapComplexClick(cpx) {
    if (!cpx) return;

    // 아직 모드 선택 전이면 수동 모드로 자연스럽게 시작
    if (!state.mode) {
      state.mode = "manual";
      $("rcModeHome").style.display = "none";
      $("rcWorkspace").style.display = "flex";
      setResetButtonsVisible(true);
    }

    var existingIdx = isComplexInCourse(cpx.code);

    // 1) 중간 추가(+) 또는 끝 추가 대기 모드
    if (state.insertAfterIndex !== null) {
      if (existingIdx !== -1) {
        showToast("이미 " + toCircled(existingIdx + 1) + "번에 포함된 단지입니다.");
        return;
      }
      if (state.course.length >= MAX_COURSE_STOPS) {
        showToast("최대 " + MAX_COURSE_STOPS + "개 단지까지 선택할 수 있습니다.");
        cancelInsertMode();
        return;
      }
      var insertPos = Math.min(state.course.length, state.insertAfterIndex + 1);
      state.course.splice(insertPos, 0, cpx);
      state.activeStopCode = null;
      state.insertAfterIndex = null;
      updateModeUI();
      recalculateRoute();
      setMobileSheetCollapsed(false);
      showToast(toCircled(insertPos + 1) + "번 위치에 '" + cpx.name + "' 단지를 추가했습니다.");
      return;
    }

    // 2) 수동 모드: 클릭 시 순서대로 추가 (이미 포함된 단지 클릭 시 해당 단지 전/후 경로만 포커스 토글)
    if (state.mode === "manual") {
      if (existingIdx !== -1) {
        var nextFocus = state.activeStopCode === cpx.code ? null : cpx.code;
        setFocusedStop(nextFocus, false);
        if (nextFocus) {
          var mCard = document.querySelector('.rc-stop-card[data-code="' + cpx.code + '"]');
          if (mCard) mCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
          showToast(toCircled(existingIdx + 1) + " '" + cpx.name + "' 앞/뒤 경로만 표시합니다. (다시 클릭 시 전체 경로)");
        } else {
          showToast("전체 이동 경로를 표시합니다.");
        }
        return;
      }
      if (state.course.length >= MAX_COURSE_STOPS) {
        showToast("최대 " + MAX_COURSE_STOPS + "개 단지까지 선택할 수 있습니다.");
        return;
      }
      state.course.push(cpx);
      state.activeStopCode = null;
      updateModeUI();
      recalculateRoute();
      showToast(toCircled(state.course.length) + " '" + cpx.name + "' 추가됨");
      return;
    }

    // 3) 자동 모드 일반 상태: 이미 코스에 있는 단지 클릭 시 앞/뒤 경로 포커스 토글, 없는 단지 클릭 시 끝에 추가
    if (existingIdx !== -1) {
      var nextAutoFocus = state.activeStopCode === cpx.code ? null : cpx.code;
      setFocusedStop(nextAutoFocus, false);
      if (nextAutoFocus) {
        var cardEl = document.querySelector('.rc-stop-card[data-code="' + cpx.code + '"]');
        if (cardEl) cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        showToast(toCircled(existingIdx + 1) + " '" + cpx.name + "' 앞/뒤 경로만 표시합니다. (다시 클릭 시 전체 경로)");
      } else {
        showToast("전체 이동 경로를 표시합니다.");
      }
    } else {
      if (state.course.length >= MAX_COURSE_STOPS) {
        showToast("최대 " + MAX_COURSE_STOPS + "개 단지까지 선택할 수 있습니다.");
        return;
      }
      state.course.push(cpx);
      state.activeStopCode = null;
      recalculateRoute();
      showToast(toCircled(state.course.length) + " '" + cpx.name + "' 코스에 추가됨");
    }
  }

  /* ------------------------------------------------------------------------
   * 리스트 편집 (삭제 / 순서 이동 / 드래그 앤 드롭)
   * ------------------------------------------------------------------------ */
  function removeStop(index) {
    if (index < 0 || index >= state.course.length) return;
    var removed = state.course.splice(index, 1)[0];
    if (state.insertAfterIndex !== null) {
      state.insertAfterIndex = null;
    }
    if (state.activeStopCode === removed.code) {
      state.activeStopCode = null;
    }
    updateModeUI();
    recalculateRoute();
    showToast("'" + removed.name + "' 단지를 코스에서 삭제했습니다.");
  }

  function moveStop(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= state.course.length) return;
    if (toIndex < 0 || toIndex >= state.course.length) return;

    var moved = state.course.splice(fromIndex, 1)[0];
    state.course.splice(toIndex, 0, moved);
    state.activeStopCode = moved.code;
    state.insertAfterIndex = null;
    updateModeUI();
    recalculateRoute();
  }

  function buildComplexMetaLine(cpx) {
    var parts = [];
    if (cpx.households && cpx.households > 0) {
      parts.push(cpx.households.toLocaleString() + "세대");
    }
    if (cpx.builtDate) {
      var yearSuffix = (cpx.builtYears != null && isFinite(cpx.builtYears))
        ? " (" + Math.round(cpx.builtYears) + "년차)"
        : "";
      parts.push(cpx.builtDate + yearSuffix);
    }
    if (parts.length > 0) {
      return parts.join(" / ");
    }
    // 지역구 JSON 로드 전 또는 정보 부재 시 폴백
    return cpx.score.toFixed(1) + "점 / " + cpx.priceText + (cpx.areaText ? " (" + cpx.areaText + ")" : "");
  }

  function getNaverLandUrl(code) {
    var isMobileView = window.innerWidth <= 820 || (global.RealCrewData.context && global.RealCrewData.context.isMobile);
    if (isMobileView) {
      return "https://m.land.naver.com/complex/info/" + encodeURIComponent(code);
    }
    return "https://new.land.naver.com/complexes/" + encodeURIComponent(code);
  }

  /* ------------------------------------------------------------------------
   * 좌측 코스 리스트 렌더링 (참조 이미지 스타일 적용)
   * ------------------------------------------------------------------------ */
  function renderCourseList() {
    var listEl = $("rcCourseList");
    var listNote = $("rcListNote");
    var emptyEl = $("rcEmptyState");
    var appendWrap = $("rcAppendWrap");
    var emptyTitle = $("rcEmptyTitle");
    var emptyDesc = $("rcEmptyDesc");

    if (!state.course.length) {
      listEl.innerHTML = "";
      if (listNote) listNote.style.display = "none";
      emptyEl.style.display = "block";
      appendWrap.style.display = "none";

      if (state.mode === "auto") {
        emptyTitle.textContent = "지도에서 사각 영역을 선택해 주세요";
        emptyDesc.textContent = "우측 지도 위를 드래그해 사각 박스를 그리면 최고 점수 단지부터 도보 최소거리 순으로 코스가 생성됩니다.";
      } else {
        emptyTitle.textContent = "지도에서 시작 단지를 선택해 주세요";
        emptyDesc.textContent = "우측 지도에서 첫 번째 단지를 클릭한 뒤, 방문할 단지를 하나씩 클릭해 추가할 수 있습니다.";
      }
      return;
    }

    if (listNote) {
      listNote.style.display = state.course.length >= 2 ? "flex" : "none";
    }
    emptyEl.style.display = "none";
    appendWrap.style.display = "block";
    var appendBtn = $("btnAppendComplex");
    if (appendBtn) {
      var isAppendActive = state.insertAfterIndex === state.course.length - 1;
      appendBtn.classList.toggle("is-active", isAppendActive);
      appendBtn.innerHTML = isAppendActive
        ? '<i class="fa-solid fa-xmark"></i> 추가 대기 취소'
        : '<i class="fa-solid fa-plus"></i> 코스 끝에 단지 추가하기';
    }

    var html = [];
    for (var i = 0; i < state.course.length; i++) {
      var cpx = state.course[i];
      var isActive = state.activeStopCode === cpx.code;
      var metaLine = buildComplexMetaLine(cpx);
      var naverUrl = getNaverLandUrl(cpx.code);

      html.push(
        '<div class="rc-stop-row" draggable="true" data-index="' + i + '" data-code="' + escapeHtml(cpx.code) + '">' +
          '<div class="rc-stop-card' + (isActive ? ' is-active' : '') + '" data-code="' + escapeHtml(cpx.code) + '">' +
            '<div class="rc-drag-handle" title="드래그하여 순서 변경"><i class="fa-solid fa-grip-vertical"></i></div>' +
            '<div class="rc-stop-info">' +
              '<div class="rc-stop-title-row">' +
                '<span class="rc-stop-order-inline">' + toCircled(i + 1) + '</span>' +
                '<span class="rc-stop-name">' + escapeHtml(cpx.name) + '</span>' +
                '<span class="rc-grade-pill ' + cpx.gradeClass + '">' + escapeHtml(cpx.grade) + '</span>' +
              '</div>' +
              '<div class="rc-stop-meta">' + escapeHtml(metaLine) + '</div>' +
              (cpx.address ? '<div class="rc-stop-addr">' + escapeHtml(cpx.address) + '</div>' : '') +
            '</div>' +
          '</div>' +
          '<div class="rc-stop-side">' +
            '<a href="' + naverUrl + '" target="_blank" rel="noopener noreferrer" class="rc-naver-btn" title="네이버 부동산에서 보기">N부동산</a>' +
            '<div class="rc-stop-actions">' +
              '<button type="button" class="rc-mini-btn rc-btn-up" data-index="' + i + '" title="위로 이동"' + (i === 0 ? ' disabled' : '') + '><i class="fa-solid fa-chevron-up"></i></button>' +
              '<button type="button" class="rc-mini-btn rc-btn-down" data-index="' + i + '" title="아래로 이동"' + (i === state.course.length - 1 ? ' disabled' : '') + '><i class="fa-solid fa-chevron-down"></i></button>' +
              '<button type="button" class="rc-mini-btn rc-mini-btn--del rc-btn-del" data-index="' + i + '" title="삭제"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );

      // 리스트와 리스트 사이: 기본 도보 (600m 이상 차량 이동 체크 시 600m 이상 구간만 🚗) + 우측 (+) 중간 추가 버튼
      if (i < state.course.length - 1) {
        var seg = state.segments[i];
        var segInfo = getSegmentModeInfo(seg);
        var segDist = seg ? global.RealCrewRoute.formatDistance(segInfo.distanceMeters) : "-";
        var segMin = seg ? segInfo.minutes + "분" : "";
        var isCar = segInfo.isCar;
        var modeIcon = isCar ? "fa-car" : "fa-person-walking";
        var modeTitle = isCar ? "차량 이동 (600m 이상)" : "도보 이동";
        var isInsertingHere = state.insertAfterIndex === i;
        var segColor = (global.RealCrewMap && typeof global.RealCrewMap.getSegmentColor === "function")
          ? global.RealCrewMap.getSegmentColor(i)
          : "#9ca3af";

        html.push(
          '<div class="rc-segment-row' + (isInsertingHere ? ' is-inserting' : '') + '">' +
            '<div class="rc-segment-center">' +
              '<span class="rc-segment-dist">' + segDist + '</span>' +
              '<span class="rc-segment-bar" style="background:' + (isInsertingHere ? '#2563eb' : segColor) + ';"></span>' +
              '<span class="rc-segment-mode' + (isCar ? ' is-car' : '') + '" title="' + modeTitle + '">' +
                '<i class="fa-solid ' + modeIcon + '"></i>' +
                (segMin ? '<span class="rc-segment-time">' + segMin + '</span>' : '') +
              '</span>' +
            '</div>' +
            '<button type="button" class="rc-insert-btn" data-after-index="' + i + '" title="' + (i + 1) + '번과 ' + (i + 2) + '번 사이에 단지 추가">' +
              '<i class="fa-solid ' + (isInsertingHere ? 'fa-xmark' : 'fa-plus') + '"></i>' +
            '</button>' +
          '</div>'
        );
      }
    }

    listEl.innerHTML = html.join("");
    bindListItemEvents();
  }

  function bindListItemEvents() {
    var listEl = $("rcCourseList");
    if (!listEl) return;

    var rows = listEl.querySelectorAll(".rc-stop-row");
    for (var i = 0; i < rows.length; i++) {
      (function (row) {
        var idx = Number(row.getAttribute("data-index"));
        var code = row.getAttribute("data-code");
        var card = row.querySelector(".rc-stop-card");

        if (card) {
          card.addEventListener("click", function () {
            var nextFocus = state.activeStopCode === code ? null : code;
            setFocusedStop(nextFocus, !!nextFocus);
          });
        }

        row.addEventListener("dragstart", function (e) {
          state.dragSourceIndex = idx;
          row.classList.add("is-dragging");
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(idx));
          }
        });

        row.addEventListener("dragend", function () {
          state.dragSourceIndex = null;
          row.classList.remove("is-dragging");
          var all = listEl.querySelectorAll(".rc-stop-row.is-drag-over");
          for (var k = 0; k < all.length; k++) all[k].classList.remove("is-drag-over");
        });

        row.addEventListener("dragover", function (e) {
          e.preventDefault();
          if (state.dragSourceIndex === null || state.dragSourceIndex === idx) return;
          row.classList.add("is-drag-over");
        });

        row.addEventListener("dragleave", function () {
          row.classList.remove("is-drag-over");
        });

        row.addEventListener("drop", function (e) {
          e.preventDefault();
          row.classList.remove("is-drag-over");
          if (state.dragSourceIndex === null || state.dragSourceIndex === idx) return;
          moveStop(state.dragSourceIndex, idx);
        });
      })(rows[i]);
    }

    var upBtns = listEl.querySelectorAll(".rc-btn-up");
    for (var u = 0; u < upBtns.length; u++) {
      upBtns[u].addEventListener("click", function (e) {
        e.stopPropagation();
        var idx = Number(this.getAttribute("data-index"));
        moveStop(idx, idx - 1);
      });
    }

    var downBtns = listEl.querySelectorAll(".rc-btn-down");
    for (var d = 0; d < downBtns.length; d++) {
      downBtns[d].addEventListener("click", function (e) {
        e.stopPropagation();
        var idx = Number(this.getAttribute("data-index"));
        moveStop(idx, idx + 1);
      });
    }

    var delBtns = listEl.querySelectorAll(".rc-btn-del");
    for (var x = 0; x < delBtns.length; x++) {
      delBtns[x].addEventListener("click", function (e) {
        e.stopPropagation();
        var idx = Number(this.getAttribute("data-index"));
        removeStop(idx);
      });
    }

    var insertBtns = listEl.querySelectorAll(".rc-insert-btn");
    for (var p = 0; p < insertBtns.length; p++) {
      insertBtns[p].addEventListener("click", function (e) {
        e.stopPropagation();
        var afterIdx = Number(this.getAttribute("data-after-index"));
        startInsertAfter(afterIdx);
      });
    }
  }

  /* ------------------------------------------------------------------------
   * 좌측 하단 고정 결과 요약 바
   * ------------------------------------------------------------------------ */
  function renderSummary() {
    var count = state.course.length;
    var totalDistMeters = 0;
    var totalWalkMinutes = 0;

    for (var i = 0; i < state.segments.length; i++) {
      var sInfo = getSegmentModeInfo(state.segments[i]);
      totalDistMeters += sInfo.distanceMeters;
      totalWalkMinutes += sInfo.minutes;
    }

    var dwellTotal = state.dwellEnabled ? (count * DWELL_MINUTES_PER_STOP) : 0;
    var totalMinutes = count > 0 ? (totalWalkMinutes + dwellTotal) : 0;

    $("rcTotalCount").textContent = String(count);
    $("rcTotalTime").textContent = global.RealCrewRoute.formatDuration(totalMinutes);
    $("rcTotalDist").textContent = global.RealCrewRoute.formatDistance(totalDistMeters);
    $("rcWalkTime").textContent = global.RealCrewRoute.formatDuration(totalWalkMinutes);
  }

  /* ------------------------------------------------------------------------
   * 이벤트 바인딩 & 초기화
   * ------------------------------------------------------------------------ */
  function bindGlobalControls() {
    $("btnStartAuto").addEventListener("click", function () {
      enterMode("auto");
    });

    $("btnStartManual").addEventListener("click", function () {
      enterMode("manual");
    });

    $("tabModeAuto").addEventListener("click", function () {
      if (state.mode !== "auto") {
        enterMode("auto");
      } else if (!state.isDrawingBox) {
        activateBoxDrawing();
      }
    });

    $("tabModeManual").addEventListener("click", function () {
      enterMode("manual");
    });

    $("btnRedrawBox").addEventListener("click", function () {
      if (state.isDrawingBox) {
        deactivateBoxDrawing();
      } else {
        activateBoxDrawing();
      }
    });

    var isExporting = false;

    function runExport(type) {
      if (isExporting) return;
      if (!state.course || state.course.length === 0) {
        showToast("먼저 답사 코스를 생성해 주세요.");
        return;
      }
      if (!global.RealPlannerExport) {
        showToast("내보내기 모듈을 불러오는 중입니다.");
        return;
      }

      isExporting = true;
      var imgBtn = $("btnExportImage");
      var pdfBtn = $("btnExportPdf");
      if (imgBtn) imgBtn.disabled = true;
      if (pdfBtn) pdfBtn.disabled = true;

      var exportOpts = {
        dwellEnabled: state.dwellEnabled,
        carOver600Enabled: state.carOver600Enabled
      };

      var task = type === "pdf"
        ? global.RealPlannerExport.exportCoursePdf(state.course, state.segments, exportOpts, function (msg) {
            setRouteLoading(true, msg);
          })
        : global.RealPlannerExport.exportCourseScreenshot(state.course, state.segments, exportOpts, function (msg) {
            setRouteLoading(true, msg);
          });

      task
        .then(function () {
          showToast(type === "pdf" ? "답사북 PDF 저장이 완료되었습니다." : "A4 가로 스크린샷 저장이 완료되었습니다.");
        })
        .catch(function (err) {
          console.error("내보내기 오류:", err);
          showToast(type === "pdf" ? "PDF 생성 중 오류가 발생했습니다." : "스크린샷 저장 중 오류가 발생했습니다.");
        })
        .finally(function () {
          isExporting = false;
          setRouteLoading(false);
          if (imgBtn) imgBtn.disabled = false;
          if (pdfBtn) pdfBtn.disabled = false;
        });
    }

    var exportImgBtn = $("btnExportImage");
    if (exportImgBtn) {
      exportImgBtn.addEventListener("click", function () {
        runExport("image");
      });
    }

    var exportPdfBtn = $("btnExportPdf");
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener("click", function () {
        runExport("pdf");
      });
    }

    $("rcResetBtn").addEventListener("click", function () {
      resetToHome();
    });

    var mobileResetBtn = $("rcMobileResetBtn");
    if (mobileResetBtn) {
      mobileResetBtn.addEventListener("click", function () {
        resetToHome();
      });
    }

    $("btnAppendComplex").addEventListener("click", function () {
      if (state.course.length === 0) return;
      startInsertAfter(state.course.length - 1);
    });

    $("rcGuideCancelBtn").addEventListener("click", function () {
      if (state.insertAfterIndex !== null) cancelInsertMode();
      else if (state.isDrawingBox) deactivateBoxDrawing();
    });

    $("rcMapBannerCancel").addEventListener("click", function () {
      if (state.insertAfterIndex !== null) cancelInsertMode();
      else if (state.isDrawingBox) deactivateBoxDrawing();
    });

    $("rcDwellCheckbox").addEventListener("change", function () {
      state.dwellEnabled = !!this.checked;
      renderSummary();
    });

    var carChk = $("rcCarOver600Checkbox");
    if (carChk) {
      carChk.addEventListener("change", function () {
        state.carOver600Enabled = !!this.checked;
        recalculateRoute();
      });
    }

    $("rcLocationBtn").addEventListener("click", function () {
      global.RealCrewMap.locateUser(function (errMsg) {
        showToast(errMsg);
      });
    });

    function handleCloseAction() {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "closeRealPlannerModal" }, "*");
      } else {
        window.close();
      }
    }

    $("rcBackBtn").addEventListener("click", handleCloseAction);
    var mobileBackBtn = $("rcMobileBackBtn");
    if (mobileBackBtn) {
      mobileBackBtn.addEventListener("click", handleCloseAction);
    }

    var sheetHandle = $("rcSheetHandle");
    if (sheetHandle) {
      bindMobileSheetDrag(sheetHandle);
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (state.insertAfterIndex !== null) cancelInsertMode();
        else if (state.isDrawingBox) deactivateBoxDrawing();
      }
    });
  }

  function bindMobileSheetDrag(handleEl) {
    var sidebar = $("rcSidebar");
    if (!sidebar) return;

    var activePointerId = null;
    var dragging = false;
    var moved = false;
    var startY = 0;
    var startHeight = 0;
    var lastY = 0;
    var lastTime = 0;
    var velocityY = 0;

    function getCollapsedHeight() {
      return getMobileCollapsedHeight();
    }

    function onStart(e) {
      if (window.innerWidth > 820) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      activePointerId = e.pointerId;
      dragging = true;
      moved = false;
      startY = e.clientY;
      lastY = startY;
      lastTime = Date.now();
      velocityY = 0;
      startHeight = sidebar.getBoundingClientRect().height;
      // 단순 클릭(탭)에서는 transition을 끄지 않도록, 실제 드래그 감지 시에만 is-dragging-sheet 부여
      if (typeof handleEl.setPointerCapture === "function") {
        try { handleEl.setPointerCapture(e.pointerId); } catch (err) {}
      }
    }

    function onMove(e) {
      if (!dragging || e.pointerId !== activePointerId) return;
      var curY = e.clientY;
      var deltaY = startY - curY; // 위로 드래그 시 양수
      if (!moved && Math.abs(deltaY) > 6) {
        moved = true;
        sidebar.classList.add("is-dragging-sheet");
      }
      if (!moved) return;

      if (e.cancelable) e.preventDefault();

      var now = Date.now();
      var dt = Math.max(1, now - lastTime);
      velocityY = (lastY - curY) / dt; // 양수: 위로 스와이프, 음수: 아래로 스와이프
      lastY = curY;
      lastTime = now;

      var minH = getCollapsedHeight();
      var maxH = Math.max(minH + 120, window.innerHeight - 62);
      var nextH = Math.max(minH, Math.min(maxH, startHeight + deltaY));

      if (nextH > minH + 8) {
        sidebar.classList.remove("is-collapsed", "is-dark-handle");
      } else {
        sidebar.classList.add("is-dark-handle");
      }
      sidebar.style.height = Math.round(nextH) + "px";
    }

    function onEnd(e) {
      if (!dragging || e.pointerId !== activePointerId) return;
      dragging = false;
      activePointerId = null;

      if (typeof handleEl.releasePointerCapture === "function") {
        try { handleEl.releasePointerCapture(e.pointerId); } catch (err) {}
      }

      // 단순 탭(클릭): transition이 켜진 상태 그대로 부드럽게 토글
      if (!moved) {
        var isCollapsed = sidebar.classList.contains("is-collapsed");
        setMobileSheetCollapsed(!isCollapsed);
        return;
      }

      // 드래그 종료 후 transition 복구 -> 다음 프레임에 스냅 애니메이션 실행
      var minH = getCollapsedHeight();
      var maxH = Math.max(minH + 120, window.innerHeight - 62);
      var curH = sidebar.getBoundingClientRect().height;
      var finalVelocity = velocityY;

      sidebar.classList.remove("is-dragging-sheet");
      void sidebar.offsetHeight;

      requestAnimationFrame(function () {
        // 빠르게 아래로 스와이프하거나 최소 높이에 가까우면 최소화(#rcSummaryBar만 표시)
        if (finalVelocity < -0.55 || curH <= minH + 55) {
          setMobileSheetCollapsed(true);
          return;
        }

        // 빠르게 위로 스와이프하면 최대 높이로 스냅
        if (finalVelocity > 0.55) {
          sidebar.classList.remove("is-collapsed");
          sidebar.style.height = Math.round(maxH) + "px";
          return;
        }

        // 그 외에는 사용자가 놓은 높이 그대로 유지
        sidebar.classList.remove("is-collapsed");
        sidebar.style.height = Math.round(Math.max(minH + 80, Math.min(maxH, curH))) + "px";
      });
    }

    handleEl.addEventListener("pointerdown", onStart);
    handleEl.addEventListener("pointermove", onMove);
    handleEl.addEventListener("pointerup", onEnd);
    handleEl.addEventListener("pointercancel", onEnd);
  }

  function bootstrap() {
    var ctx = global.RealCrewData.getLaunchContext();
    if (ctx.embedded) {
      document.body.classList.add("is-embedded");
    }

    bindGlobalControls();
    renderSummary();

    global.RealCrewData.loadAll()
      .then(function () {
        global.RealCrewMap.init({
          onComplexClick: handleMapComplexClick,
          onBoxSelected: handleBoxSelected,
          onMapEmptyClick: function () {
            if (state.activeStopCode) {
              setFocusedStop(null, false);
            }
          }
        });

        // 2026-11-22: 특정 단지에서 "현재 단지부터 답사 코스 만들기"로 진입한 경우 해당 단지를 1번 출발지로 자동 선택
        if (ctx.startComplex) {
          var matched = null;
          if (ctx.startComplex.code && global.RealCrewData.complexByCode[ctx.startComplex.code]) {
            matched = global.RealCrewData.complexByCode[ctx.startComplex.code];
          }
          if (!matched && ctx.startComplex.lat && ctx.startComplex.lng) {
            var bestDist = 180;
            for (var sc = 0; sc < global.RealCrewData.complexes.length; sc++) {
              var cand = global.RealCrewData.complexes[sc];
              var d = global.RealCrewRoute.haversineMeters(ctx.startComplex.lat, ctx.startComplex.lng, cand.lat, cand.lng);
              if (d < bestDist && (!ctx.startComplex.name || cand.name === ctx.startComplex.name || d < 40)) {
                bestDist = d;
                matched = cand;
              }
            }
          }
          if (matched) {
            setMode("manual");
            state.course = [matched];
            recalculateRoute();
            global.RealCrewMap.panToComplex(matched);
            showToast("① " + matched.name + "부터 시작합니다. 지도에서 다음 단지를 선택해 주세요.");
          }
          try {
            var rawCtx = sessionStorage.getItem("realplannerLaunchContext") || localStorage.getItem("realplannerLaunchContext");
            if (rawCtx) {
              var parsedCtx = JSON.parse(rawCtx);
              if (parsedCtx && parsedCtx.startComplex) {
                delete parsedCtx.startComplex;
                sessionStorage.setItem("realplannerLaunchContext", JSON.stringify(parsedCtx));
                localStorage.setItem("realplannerLaunchContext", JSON.stringify(parsedCtx));
              }
            }
          } catch (e) {}
        }

        var loader = $("rcLoading");
        if (loader) loader.style.display = "none";

        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "realplannerReady" }, "*");
        }
      })
      .catch(function (err) {
        console.error("리얼플래너 초기화 오류:", err);
        var loader = $("rcLoading");
        if (loader) {
          loader.innerHTML =
            '<div style="text-align:center;padding:20px;">' +
              '<div style="font-size:15px;font-weight:700;color:#dc2626;margin-bottom:8px;">단지 데이터를 불러오지 못했습니다.</div>' +
              '<button type="button" onclick="location.reload()" style="padding:8px 16px;border:none;border-radius:8px;background:#E43B46;color:#fff;font-weight:700;cursor:pointer;">다시 시도</button>' +
            '</div>';
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})(window);
