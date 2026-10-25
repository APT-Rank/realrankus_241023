(function () {
  "use strict";

  var selected = [];
  var map = null;
  var markers = [];
  var currentDataKey = "";
  var refreshTimer = null;
  var searchIndex = null;
  var searchRequest = null;
  var searchMode = "global";
  var currentView = "both";
  var scoreChart = null;
  var priceChart = null;

  function byId(id) { return document.getElementById(id); }
  function safe(value) {
    return String(value == null ? "—" : value).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function number(value, digits) {
    var n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString("ko-KR", { maximumFractionDigits: digits == null ? 1 : digits }) : "—";
  }
  function getData() { return window.sortData && Array.isArray(sortData.data) ? sortData.data : []; }
  function itemFor(index) { return getData()[index]; }
  function regionKey() { return [window.selectedMonth, window.selectedSubRegion].join(":"); }
  function coords(item) { return [Number(item && item.Y), Number(item && item.X)]; }
  function regionLabel(code) {
    var list = Array.isArray(window.regions) ? window.regions : [];
    var match = list.find(function (region) { return region[1] === code; });
    return match ? match[0] : code;
  }

  function mount() {
    var list = byId("dataList");
    if (!list || byId("v2Controls")) return;
    var controls = document.createElement("div");
    controls.id = "v2Controls";
    controls.innerHTML = "<button type='button' id='v2GlobalSearchOpen'>단지 통합 검색</button><button type='button' id='v2AnalysisOpen'>지역 분석</button><button type='button' id='v2CompareOpen'>비교함 <span id='v2CompareCount'>0</span></button>";
    list.parentNode.insertBefore(controls, list);
    var filters = document.createElement("div");
    filters.id = "v2GradeFilters";
    filters.innerHTML = "<span>등급</span>" + ["S", "A", "B", "C"].map(function (grade) { return "<label><input type='checkbox' value='" + grade + "' checked> " + grade + "</label>"; }).join("") + "<span id='v2FilterCount'></span>";
    controls.parentNode.insertBefore(filters, controls.nextSibling);
    var searchPanel = document.createElement("section");
    searchPanel.id = "v2GlobalSearchPanel";
    searchPanel.innerHTML = "<div class='v2-search-head'><div class='v2-search-modes' role='group' aria-label='검색 범위'><button type='button' class='v2-search-mode is-active' data-search-mode='global' aria-pressed='true'>전국 검색</button><button type='button' class='v2-search-mode' data-search-mode='local' aria-pressed='false'>현재 지역</button></div><button type='button' class='v2-search-close' aria-label='검색 닫기'>×</button></div><label for='v2GlobalSearchInput'>오피스텔 통합 검색</label><input id='v2GlobalSearchInput' type='search' autocomplete='off' placeholder='단지명이나 주소를 입력하세요'><div id='v2GlobalSearchHint'>전국 오피스텔 · 두 글자 이상 입력해 주세요</div><div id='v2GlobalSearchResults' role='listbox' aria-label='검색 결과'></div>";
    list.parentNode.insertBefore(searchPanel, list);
    var mapPane = document.createElement("div");
    mapPane.id = "v2Map";
    mapPane.setAttribute("aria-label", "오피스텔 위치 지도");
    mapPane.setAttribute("data-empty", "선택한 지역에서 표시할 위치 정보가 없습니다.");
    list.parentNode.insertBefore(mapPane, list.nextSibling);

    var workspace = document.createElement("div");
    workspace.id = "v2Workspace";
    var listPane = document.createElement("div");
    listPane.id = "v2ListPane";
    list.parentNode.insertBefore(workspace, controls);
    listPane.appendChild(list);
    workspace.appendChild(controls);
    workspace.appendChild(filters);
    workspace.appendChild(searchPanel);
    workspace.appendChild(listPane);
    workspace.appendChild(mapPane);

    var locationButton = document.createElement("button");
    locationButton.id = "v2CurrentLocation";
    locationButton.type = "button";
    locationButton.setAttribute("aria-label", "현재 위치로 이동");
    locationButton.title = "현재 위치로 이동";
    locationButton.innerHTML = "<i class='fa-solid fa-location-crosshairs' aria-hidden='true'></i>";
    workspace.appendChild(locationButton);

    var mobileToggle = document.createElement("button");
    mobileToggle.id = "v2MobileViewToggle";
    mobileToggle.type = "button";
    mobileToggle.setAttribute("aria-label", "목록 보기");
    mobileToggle.innerHTML = "<span class='v2-mobile-toggle-icon'><i class='fa-solid fa-list'></i></span><span class='v2-mobile-toggle-text'>목록 보기</span>";
    document.body.appendChild(mobileToggle);

    var tray = document.createElement("div");
    tray.id = "v2CompareTray";
    tray.innerHTML = "<div id='v2CompareNames'></div><div><button type='button' class='btn btn-primary btn-sm' id='v2CompareShow'>비교하기</button> <button type='button' class='btn btn-outline-secondary btn-sm' id='v2CompareClear'>비우기</button></div>";
    document.body.appendChild(tray);

    var dialog = document.createElement("div");
    dialog.id = "v2CompareDialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "v2CompareTitle");
    dialog.innerHTML = "<section class='v2-compare-panel'><header class='v2-compare-head'><h2 id='v2CompareTitle'>오피스텔 비교</h2><button type='button' class='v2-compare-close' aria-label='닫기'>×</button></header><div id='v2CompareContent'></div></section>";
    document.body.appendChild(dialog);

    var analysis = document.createElement("div");
    analysis.id = "v2AnalysisDialog";
    analysis.setAttribute("role", "dialog");
    analysis.setAttribute("aria-modal", "true");
    analysis.setAttribute("aria-labelledby", "v2AnalysisTitle");
    analysis.innerHTML = "<section class='v2-analysis-panel'><header class='v2-compare-head'><h2 id='v2AnalysisTitle'>동별 오피스텔 입지 분석</h2><button type='button' class='v2-compare-close' aria-label='닫기'>×</button></header><p class='v2-analysis-note'>선택한 시군구의 오피스텔 데이터를 동별로 묶어 평균 입지 점수와 평단가를 비교합니다. 표본 수와 거래 정보 유무를 함께 확인해 주세요.</p><div class='v2-chart-wrap'><canvas id='v2DongScoreChart' aria-label='동별 평균 입지 점수'></canvas></div><div class='v2-chart-wrap'><canvas id='v2DongPriceChart' aria-label='동별 입지 점수와 평단가 비교'></canvas></div><div class='v2-analysis-actions'><button type='button' class='btn btn-outline-secondary btn-sm' id='v2ChartDownload'>차트 이미지 저장</button></div></section>";
    document.body.appendChild(analysis);

    mobileToggle.addEventListener("click", function () { setView(currentView === "map" ? "list" : "map"); });
    byId("v2GlobalSearchOpen").addEventListener("click", showV2UnifiedSearch);
    searchPanel.querySelector(".v2-search-close").addEventListener("click", function () { searchPanel.classList.remove("is-visible"); });
    searchPanel.querySelectorAll("[data-search-mode]").forEach(function (button) {
      button.addEventListener("click", function () {
        searchMode = button.dataset.searchMode;
        searchPanel.querySelectorAll("[data-search-mode]").forEach(function (modeButton) {
          var active = modeButton.dataset.searchMode === searchMode;
          modeButton.classList.toggle("is-active", active);
          modeButton.setAttribute("aria-pressed", String(active));
        });
        searchPanel.querySelector("label").textContent = searchMode === "global" ? "전국 오피스텔 검색" : "현재 지역 오피스텔 검색";
        searchPanel.querySelector("#v2GlobalSearchHint").textContent = searchMode === "global" ? "전국 오피스텔 · 두 글자 이상 입력해 주세요" : "선택한 시군구 · 두 글자 이상 입력해 주세요";
        searchNational();
      });
    });
    byId("v2GlobalSearchInput").addEventListener("input", searchNational);
    byId("v2GlobalSearchResults").addEventListener("click", function (event) {
      var remove = event.target.closest("[data-remove-recent]");
      if (remove) {
        var recents = readRecentSearches();
        recents.splice(Number(remove.dataset.removeRecent), 1);
        try { localStorage.setItem("op_v2_recent_searches", JSON.stringify(recents)); } catch (_) {}
        renderRecentSearches();
        return;
      }
      var recent = event.target.closest("[data-recent-index]");
      if (!recent) return;
      var entry = readRecentSearches()[Number(recent.dataset.recentIndex)];
      if (entry) openSearchResult(entry.entry, entry.month);
    });
    byId("v2GradeFilters").addEventListener("change", applyGradeFilters);
    byId("v2CurrentLocation").addEventListener("click", goToCurrentLocation);
    byId("v2AnalysisOpen").addEventListener("click", showAreaAnalysis);
    analysis.querySelector(".v2-compare-close").addEventListener("click", closeAnalysis);
    analysis.addEventListener("click", function (event) { if (event.target === analysis) closeAnalysis(); });
    byId("v2ChartDownload").addEventListener("click", downloadCharts);
    byId("v2CompareOpen").addEventListener("click", showCompare);
    byId("v2CompareShow").addEventListener("click", showCompare);
    byId("v2CompareClear").addEventListener("click", clearCompare);
    dialog.querySelector(".v2-compare-close").addEventListener("click", closeCompare);
    dialog.addEventListener("click", function (event) { if (event.target === dialog) closeCompare(); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") { closeCompare(); closeAnalysis(); } });

    list.addEventListener("click", function (event) {
      var button = event.target.closest("[data-v2-compare]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      toggleCompare(Number(button.dataset.v2Compare));
    }, true);

    new MutationObserver(scheduleRefresh).observe(list, { childList: true, subtree: true });
    setView(isMobileLayout() ? "map" : "both");
    var layoutQuery = window.matchMedia("(max-width: 799px)");
    if (layoutQuery.addEventListener) layoutQuery.addEventListener("change", function () { setView(isMobileLayout() ? "map" : "both"); });
    else if (layoutQuery.addListener) layoutQuery.addListener(function () { setView(isMobileLayout() ? "map" : "both"); });
    window.addEventListener("resize", function () {
      syncWorkspaceGeometry();
      if (map && window.naver && naver.maps) {
        window.setTimeout(function () {
          var pane = byId("v2Map");
          if (pane.clientWidth > 0 && pane.clientHeight > 0) {
            map.setSize(new naver.maps.Size(pane.clientWidth, pane.clientHeight));
            renderMap();
          }
        }, 100);
      }
    });
    scheduleRefresh();
  }

  function isMobileLayout() { return window.matchMedia("(max-width: 799px)").matches; }

  function syncWorkspaceGeometry() {
    var workspace = byId("v2Workspace");
    var pane = byId("v2Map");
    if (!workspace || !pane) return;
    var mobile = isMobileLayout();
    var viewportHeight = Math.max(0, window.innerHeight);
    var footer = byId("linkToAptrank_bottom");
    var footerHeight = footer ? Math.ceil(footer.getBoundingClientRect().height) : 48;
    if (footerHeight <= 0) footerHeight = 48;
    var availableHeight = Math.max(0, viewportHeight - footerHeight);
    workspace.style.position = "fixed";
    workspace.style.left = "0px";
    workspace.style.right = "0px";
    workspace.style.width = "100vw";
    workspace.style.bottom = footerHeight + "px";
    if (mobile) {
      var mobileTop = 122;
      var mobileHeight = Math.max(0, availableHeight - mobileTop);
      workspace.style.top = mobileTop + "px";
      workspace.style.height = mobileHeight + "px";
      pane.style.position = "absolute";
      pane.style.top = "0px";
      pane.style.right = "0px";
      pane.style.bottom = "auto";
      pane.style.left = "0px";
      pane.style.width = "100vw";
      pane.style.height = mobileHeight + "px";
    } else {
      workspace.style.top = "0px";
      workspace.style.height = availableHeight + "px";
      pane.style.position = "absolute";
      pane.style.top = "0px";
      pane.style.right = "0px";
      pane.style.bottom = "auto";
      pane.style.left = "600px";
      pane.style.width = "calc(100vw - 600px)";
      pane.style.height = availableHeight + "px";
    }
  }

  function goToCurrentLocation() {
    var button = byId("v2CurrentLocation");
    if (!navigator.geolocation) {
      button.title = "이 브라우저에서는 현재 위치를 사용할 수 없습니다.";
      return;
    }
    button.disabled = true;
    button.classList.add("is-loading");
    navigator.geolocation.getCurrentPosition(function (position) {
      button.disabled = false;
      button.classList.remove("is-loading");
      if (!map) renderMap();
      if (!map) return;
      map.setCenter(new naver.maps.LatLng(position.coords.latitude, position.coords.longitude));
      map.setZoom(16, true);
    }, function () {
      button.disabled = false;
      button.classList.remove("is-loading");
      button.title = "위치 권한을 허용한 뒤 다시 눌러 주세요.";
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }

  function setView(view) {
    var mobile = isMobileLayout();
    currentView = mobile ? view : "both";
    var mapMode = !mobile || currentView === "map";
    var listMode = !mobile || currentView === "list";
    var workspace = byId("v2Workspace");
    if (workspace) workspace.dataset.mobileView = mobile ? currentView : "both";
    syncWorkspaceGeometry();
    byId("v2ListPane").classList.toggle("v2-list-hidden", !listMode);
    byId("v2Map").classList.toggle("is-visible", mapMode);
    byId("v2MobileViewToggle").classList.toggle("is-list-mode", mobile && currentView === "list");
    byId("v2CurrentLocation").classList.toggle("is-hidden", mobile && currentView === "list");
    byId("v2MobileViewToggle").setAttribute("aria-label", mobile && currentView === "map" ? "목록 보기" : "지도 보기");
    byId("v2MobileViewToggle").innerHTML = mobile && currentView === "map"
      ? "<span class='v2-mobile-toggle-icon'><i class='fa-solid fa-list'></i></span><span class='v2-mobile-toggle-text'>목록 보기</span>"
      : "<span class='v2-mobile-toggle-icon'><i class='fa-solid fa-map'></i></span><span class='v2-mobile-toggle-text'>지도 보기</span>";
    if (mapMode) {
      if (!window.naver || !naver.maps) {
        byId("v2Map").innerHTML = "<div class='p-4 text-center'>지도를 불러오지 못했습니다. 목록에서 위치를 확인해 주세요.</div>";
        return;
      }
      window.setTimeout(function () {
        if (map && map.setSize) map.setSize(new naver.maps.Size(byId("v2Map").clientWidth, byId("v2Map").clientHeight));
        renderMap();
      }, 50);
    }
  }

  function loadSearchIndex() {
    if (searchIndex) return Promise.resolve(searchIndex);
    if (!searchRequest) {
      searchRequest = fetch("/op/v2/search-index/202610.json", { cache: "force-cache" })
        .then(function (response) { if (!response.ok) throw new Error("검색 데이터를 불러오지 못했습니다."); return response.json(); })
        .then(function (data) { searchIndex = data; return data; })
        .catch(function (error) { searchRequest = null; throw error; });
    }
    return searchRequest;
  }

  function showV2UnifiedSearch() {
    var panel = byId("v2GlobalSearchPanel");
    if (!panel) return;
    panel.classList.toggle("is-visible");
    if (!panel.classList.contains("is-visible")) return;
    if (!byId("v2GlobalSearchInput").value.trim()) renderRecentSearches();
    byId("v2GlobalSearchInput").focus();
  }

  function readRecentSearches() {
    try {
      var value = JSON.parse(localStorage.getItem("op_v2_recent_searches") || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }

  function saveRecentSearch(entry, month) {
    var recents = readRecentSearches().filter(function (recent) { return String(recent.entry[5]) !== String(entry[5]); });
    recents.unshift({ entry: entry, month: month, savedAt: Date.now() });
    try { localStorage.setItem("op_v2_recent_searches", JSON.stringify(recents.slice(0, 10))); } catch (_) {}
  }

  function renderRecentSearches() {
    var recents = readRecentSearches();
    var results = byId("v2GlobalSearchResults");
    byId("v2GlobalSearchHint").textContent = recents.length ? "최근 검색" : (searchMode === "global" ? "전국 오피스텔 · 두 글자 이상 입력해 주세요" : "선택한 시군구 · 두 글자 이상 입력해 주세요");
    results.innerHTML = recents.map(function (recent, index) {
      var entry = recent.entry || [];
      return "<div class='v2-recent-row'><button type='button' class='v2-search-result' role='option' data-recent-index='" + index + "'><strong>" + safe(entry[0]) + "</strong><span>" + safe(entry[1]) + "</span></button><button type='button' class='v2-recent-remove' data-remove-recent='" + index + "' aria-label='최근 검색에서 삭제'>×</button></div>";
    }).join("");
  }

  function searchNational() {
    var input = byId("v2GlobalSearchInput");
    var query = input.value.trim().toLocaleLowerCase("ko-KR");
    var results = byId("v2GlobalSearchResults");
    if (query.length < 2) { renderRecentSearches(); return; }
    if (searchMode === "local") {
      var localMatches = getData().map(function (item, index) {
        var name = String(item["오피스텔명"] || "");
        var address = String(item["법정동주소"] || item["도로명주소"] || "");
        return { item: item, index: index, name: name, address: address };
      }).filter(function (match) { return (match.name + " " + match.address).toLocaleLowerCase("ko-KR").indexOf(query) >= 0; }).slice(0, 30);
      byId("v2GlobalSearchHint").textContent = localMatches.length ? localMatches.length + "개 결과 · 최대 30개 표시" : "현재 지역에서 검색 결과가 없습니다.";
      results.innerHTML = localMatches.map(function (match) {
        return "<button type='button' class='v2-search-result' role='option' data-local-result='" + match.index + "'><strong>" + safe(match.name) + "</strong><span>" + safe(match.address) + "</span></button>";
      }).join("");
      results.querySelectorAll("[data-local-result]").forEach(function (button) {
        button.addEventListener("click", function () {
          var index = Number(button.dataset.localResult);
          var item = itemFor(index);
          if (!item) return;
          var entry = [item["오피스텔명"], item["법정동주소"] || item["도로명주소"], window.selectedRegion, window.selectedSubRegion, index, item["검색코드"] || index];
          openSearchResult(entry, window.selectedMonth);
        });
      });
      return;
    }
    byId("v2GlobalSearchHint").textContent = "전국 오피스텔 목록을 검색하고 있습니다…";
    loadSearchIndex().then(function (data) {
      var matches = data.entries.filter(function (entry) {
        return (entry[0] + " " + entry[1]).toLocaleLowerCase("ko-KR").indexOf(query) >= 0;
      }).slice(0, 30);
      byId("v2GlobalSearchHint").textContent = matches.length ? matches.length + "개 결과 · 최대 30개 표시" : "검색 결과가 없습니다.";
      results.innerHTML = matches.map(function (entry, index) {
        return "<button type='button' class='v2-search-result' role='option' data-result='" + index + "'><strong>" + safe(entry[0]) + "</strong><span>" + safe(regionLabel(entry[2])) + " · " + safe(entry[1]) + "</span></button>";
      }).join("");
      results.querySelectorAll("[data-result]").forEach(function (button) {
        button.addEventListener("click", function () { openSearchResult(matches[Number(button.dataset.result)], data.month); });
      });
    }).catch(function () {
      byId("v2GlobalSearchHint").textContent = "검색 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    });
  }

  function openSearchResult(entry, month) {
    if (!entry) return;
    saveRecentSearch(entry, month);
    byId("v2GlobalSearchPanel").classList.remove("is-visible");
    byId("v2GlobalSearchInput").value = "";
    byId("v2GlobalSearchResults").innerHTML = "";
    selected = [];
    updateCompareUI();
    $("#month").val(month);
    window.selectedMonth = month;
    $("#sido").val(entry[2]);
    if (typeof window.optionChange === "function") window.optionChange(entry[3], entry[2]);
    if (typeof window.updateRegion === "function") window.updateRegion();
    var tries = 0;
    var previousData = window.aptData;
    var timer = window.setInterval(function () {
      tries++;
      var index = getData().findIndex(function (item) { return String(item["검색코드"] || "") === String(entry[5] || ""); });
      var loadedTarget = window.selectedMonth === month && window.selectedSubRegion === entry[3] && window.aptData !== previousData;
      if (loadedTarget && index >= 0 && window.showDetail) {
        window.clearInterval(timer);
        window.showDetail(index);
      } else if (tries >= 50) window.clearInterval(timer);
    }, 200);
  }

  function visibleIndexes() {
    var indexes = [];
    byId("dataList").querySelectorAll(".listBox[onclick]").forEach(function (card) {
      if (card.classList.contains("v2-grade-hidden")) return;
      var match = (card.getAttribute("onclick") || "").match(/showDetail\s*\(\s*(\d+)/);
      if (match) indexes.push(Number(match[1]));
    });
    return indexes;
  }

  function renderMap() {
    var items = getData();
    var indexes = visibleIndexes();
    markers.forEach(function (marker) { marker.setMap(null); });
    markers = [];
    if (!indexes.length) { byId("v2Map").classList.add("is-empty"); return; }
    var points = indexes.map(function (index) { return { index: index, item: items[index], pos: coords(items[index]) }; })
      .filter(function (point) { return point.item && Number.isFinite(point.pos[0]) && Number.isFinite(point.pos[1]) && point.pos[0] !== 0 && point.pos[1] !== 0; })
      .slice(0, 1500);
    if (!points.length) {
      byId("v2Map").classList.add("is-empty");
      return;
    }
    byId("v2Map").classList.remove("is-empty");
    if (!map) {
      var first = points[0].pos;
      map = new naver.maps.Map("v2Map", {
        center: new naver.maps.LatLng(first[0], first[1]),
        zoom: points.length > 100 ? 12 : 14,
        scaleControl: true,
        mapDataControl: false,
        zoomControl: true,
        zoomControlOptions: { style: naver.maps.ZoomControlStyle.SMALL, position: naver.maps.Position.TOP_RIGHT }
      });
    }
    var bounds = new naver.maps.LatLngBounds();
    points.forEach(function (point) {
      var position = new naver.maps.LatLng(point.pos[0], point.pos[1]);
      var score = Number(point.item["가치 총점"]);
      var grade = score >= 78.6962 ? "S" : score >= 53.3691 ? "A" : score >= 31.9721 ? "B" : "C";
      var sales = String(point.item.last_sales || "").split(",");
      var salesLabel = sales[0] && sales[0] !== "1800-01-01" && Number.isFinite(Number(sales[1]))
        ? (Number(sales[1]) / 10000).toFixed(1).replace(/\.0$/, "") + "억"
        : "거래없음";
      var markerContent = "<div class='v2-map-marker v2-map-marker-" + grade.toLowerCase() + "' title='" + safe(point.item["오피스텔명"] || "오피스텔") + "'><strong>" + grade + " <span>" + number(score, 1) + "</span></strong><small>" + safe(salesLabel) + "</small></div>";
      var marker = new naver.maps.Marker({
        map: map,
        position: position,
        title: (point.item["오피스텔명"] || "오피스텔") + " · " + grade + " · " + salesLabel,
        icon: {
          content: markerContent,
          size: new naver.maps.Size(76, 46),
          anchor: new naver.maps.Point(38, 46)
        },
        zIndex: Math.round(score * 10)
      });
      naver.maps.Event.addListener(marker, "click", function () {
        window.showDetail(point.index);
        if (isMobileLayout()) setView("list");
      });
      markers.push(marker);
      bounds.extend(position);
    });
    map.fitBounds(bounds, { top: 32, right: 28, bottom: 32, left: 28 });
  }

  function addCompareButtons() {
    var list = byId("dataList");
    if (!list) return;
    list.querySelectorAll(".listBox[onclick]").forEach(function (card) {
      var match = (card.getAttribute("onclick") || "").match(/showDetail\s*\(\s*(\d+)/);
      if (!match || card.querySelector("[data-v2-compare]")) return;
      var index = Number(match[1]);
      var item = itemFor(index);
      if (!item || !item["오피스텔명"]) return;
      card.classList.add("v2-has-compare");
      card.dataset.v2Grade = gradeGroup(item);
      var actions = document.createElement("div");
      actions.className = "v2-card-actions";
      var button = document.createElement("button");
      button.type = "button";
      button.className = "v2-compare-add";
      button.dataset.v2Compare = String(index);
      var key = String(item["검색코드"] || item.index || index);
      var active = selected.some(function (entry) { return entry.key === key; });
      button.textContent = active ? "선택됨" : "+ 비교";
      button.classList.toggle("is-selected", active);
      actions.appendChild(button);
      card.appendChild(actions);
    });
    applyGradeFilters();
  }

  function gradeGroup(item) {
    var grade = typeof window.setGrade === "function" ? String(window.setGrade(Number(item["가치 총점"]))) : "";
    return grade.charAt(0) || "C";
  }

  function applyGradeFilters() {
    if (!byId("v2GradeFilters")) return;
    var allowed = Array.from(byId("v2GradeFilters").querySelectorAll("input:checked")).map(function (input) { return input.value; });
    var visible = 0;
    byId("dataList").querySelectorAll(".listBox[onclick]").forEach(function (card) {
      var match = (card.getAttribute("onclick") || "").match(/showDetail\s*\(\s*(\d+)/);
      if (!match) return;
      var item = itemFor(Number(match[1]));
      if (!item || !item["오피스텔명"]) return;
      var grade = card.dataset.v2Grade || gradeGroup(item);
      card.dataset.v2Grade = grade;
      var hide = allowed.indexOf(grade) < 0;
      card.classList.toggle("v2-grade-hidden", hide);
      if (!hide) visible++;
    });
    byId("v2FilterCount").textContent = visible ? visible.toLocaleString("ko-KR") + "개 표시" : "표시할 단지가 없습니다";
    if (byId("v2Map") && byId("v2Map").classList.contains("is-visible")) renderMap();
  }

  function groupDong(item) {
    var address = String(item["법정동주소"] || item["도로명주소"] || "");
    var found = address.match(/[가-힣0-9]+(?:동|가|읍|면)(?=\s|$)/g);
    return found && found.length ? found[0] : "기타";
  }

  function showAreaAnalysis() {
    if (!window.Chart) { window.alert("분석 차트를 불러오지 못했습니다."); return; }
    var groups = new Map();
    getData().forEach(function (item) {
      if (!item || !item["오피스텔명"]) return;
      var dong = groupDong(item);
      if (!groups.has(dong)) groups.set(dong, { count: 0, score: 0, scoreCount: 0, price: 0, priceCount: 0 });
      var group = groups.get(dong);
      var score = Number(item["가치 총점"]);
      var price = Number(item["평단가"]);
      group.count++;
      if (Number.isFinite(score)) { group.score += score; group.scoreCount++; }
      if (Number.isFinite(price) && price > 0) { group.price += price; group.priceCount++; }
    });
    var points = Array.from(groups.entries()).map(function (pair) {
      var group = pair[1];
      return { dong: pair[0], count: group.count, score: group.scoreCount ? group.score / group.scoreCount : null, price: group.priceCount ? group.price / group.priceCount : null, priceCount: group.priceCount };
    }).filter(function (point) { return point.score != null; }).sort(function (a, b) { return b.score - a.score; });
    if (points.length > 18) points = points.slice(0, 9).concat(points.slice(-9)).sort(function (a, b) { return b.score - a.score; });
    if (!points.length) { window.alert("현재 지역에서 분석할 데이터가 없습니다."); return; }
    byId("v2AnalysisDialog").classList.add("is-visible");
    if (scoreChart) scoreChart.destroy();
    if (priceChart) priceChart.destroy();
    scoreChart = new Chart(byId("v2DongScoreChart"), {
      type: "bar",
      data: { labels: points.map(function (point) { return point.dong; }), datasets: [{ label: "평균 입지 점수", data: points.map(function (point) { return Number(point.score.toFixed(2)); }), backgroundColor: "#4869a5", borderRadius: 5 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { afterLabel: function (context) { return "표본 " + points[context.dataIndex].count + "개 단지"; } } } }, scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: "점수" } } } }
    });
    var priced = points.filter(function (point) { return point.price != null; });
    priceChart = new Chart(byId("v2DongPriceChart"), {
      type: "scatter",
      data: { datasets: [{ label: "동별 평균", data: priced.map(function (point) { return { x: Number(point.score.toFixed(2)), y: Number(point.price.toFixed(0)), dong: point.dong, count: point.priceCount }; }), backgroundColor: "#de6c45", pointRadius: 7, pointHoverRadius: 9 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (context) { var point = context.raw; return point.dong + " · 점수 " + point.x + " · 평단가 " + number(point.y, 0) + "만원 · 거래 표본 " + point.count + "개"; } } } }, scales: { x: { min: 0, max: 100, title: { display: true, text: "평균 입지 점수" } }, y: { beginAtZero: true, title: { display: true, text: "평균 평단가 (만원)" } } } }
    });
  }

  function closeAnalysis() {
    if (!byId("v2AnalysisDialog")) return;
    byId("v2AnalysisDialog").classList.remove("is-visible");
    if (scoreChart) { scoreChart.destroy(); scoreChart = null; }
    if (priceChart) { priceChart.destroy(); priceChart = null; }
  }

  function downloadCharts() {
    var score = byId("v2DongScoreChart");
    var price = byId("v2DongPriceChart");
    if (!score || !price || !score.width || !price.width) return;
    var output = document.createElement("canvas");
    output.width = Math.max(score.width, price.width);
    output.height = score.height + price.height;
    var context = output.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, output.width, output.height);
    context.drawImage(score, 0, 0);
    context.drawImage(price, 0, score.height);
    var link = document.createElement("a");
    link.download = "오피스텔_동별_입지분석.png";
    link.href = output.toDataURL("image/png");
    link.click();
  }

  function toggleCompare(index) {
    var item = itemFor(index);
    if (!item) return;
    var key = String(item["검색코드"] || item.index || index);
    if (selected.some(function (entry) { return entry.key === key; })) selected = selected.filter(function (entry) { return entry.key !== key; });
    else {
      if (selected.length >= 3) { window.alert("한 번에 최대 3개까지 비교할 수 있습니다."); return; }
      selected.push({ key: key, item: item });
    }
    updateCompareUI();
    document.querySelectorAll("[data-v2-compare]").forEach(function (button) {
      var row = itemFor(Number(button.dataset.v2Compare));
      var rowKey = String(row && (row["검색코드"] || row.index) || button.dataset.v2Compare);
      var active = selected.some(function (entry) { return entry.key === rowKey; });
      button.textContent = active ? "선택됨" : "+ 비교";
      button.classList.toggle("is-selected", active);
    });
  }

  function updateCompareUI() {
    byId("v2CompareCount").textContent = String(selected.length);
    byId("v2CompareNames").textContent = selected.map(function (entry) { return entry.item["오피스텔명"]; }).filter(Boolean).join(" · ") || "비교할 오피스텔을 선택하세요";
    byId("v2CompareTray").classList.toggle("is-visible", selected.length > 0);
  }

  function showCompare() {
    if (selected.length < 2) { window.alert("비교할 오피스텔을 2개 이상 선택해 주세요."); return; }
    var items = selected.map(function (entry) { return entry.item; }).filter(Boolean);
    var rows = [
      ["순위", function (item) { return number(item.rank, 0) + "위"; }],
      ["입지 종합점수", function (item) { return number(item["가치 총점"], 2) + "점"; }],
      ["주거", function (item) { return number(item["주거총점"], 1) + "점"; }],
      ["교통", function (item) { return number(item["교통총점"], 1) + "점"; }],
      ["인프라", function (item) { return number(item["인프라총점"], 1) + "점"; }],
      ["교육", function (item) { return number(item["학군총점"], 1) + "점"; }],
      ["전용면적", function (item) { return number(item["전용면적(m2)"], 2) + "㎡ · " + safe(item["전용면적(평)"]); }],
      ["세대수", function (item) { return number(item["세대수"], 0) + "세대"; }],
      ["최근 매매", function (item) { var sales = String(item.last_sales || "").split(","); return sales[0] && sales[0] !== "1800-01-01" ? number(Number(sales[1]) / 10000, 2) + "억 · " + safe(sales[0]) : "거래 정보 없음"; }],
      ["주소", function (item) { return safe(item["도로명주소"] || item["법정동주소"]); }]
    ];
    var html = "<table class='v2-compare-table'><thead><tr><th>항목</th>";
    items.forEach(function (item) { html += "<th>" + safe(item["오피스텔명"]) + "</th>"; });
    html += "</tr></thead><tbody>";
    rows.forEach(function (row) { html += "<tr><th>" + safe(row[0]) + "</th>"; items.forEach(function (item) { html += "<td>" + row[1](item) + "</td>"; }); html += "</tr>"; });
    html += "</tbody></table>";
    byId("v2CompareContent").innerHTML = html;
    byId("v2CompareDialog").classList.add("is-visible");
  }

  function closeCompare() { if (byId("v2CompareDialog")) byId("v2CompareDialog").classList.remove("is-visible"); }
  function clearCompare() { selected = []; updateCompareUI(); addCompareButtons(); }
  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () {
      var key = regionKey();
      if (currentDataKey && currentDataKey !== key) { selected = []; updateCompareUI(); }
      currentDataKey = key;
      addCompareButtons();
      if (byId("v2Map") && (byId("v2Map").classList.contains("is-visible") || !isMobileLayout()) && window.naver && naver.maps) renderMap();
    }, 180);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
  window.showV2UnifiedSearch = showV2UnifiedSearch;
  window.addEventListener("load", scheduleRefresh);
})();
