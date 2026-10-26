(function () {
  "use strict";

  // 2026-10-25: /op map behavior includes nationwide centering, stable marker-detail zoom, hover layering and search/list synchronization.
  var map = null;
  var markers = [];
  var refreshTimer = null;
  var searchIndexes = {};
  var searchRequests = {};
  var regionMaps = {};
  var regionMapRequests = {};
  var searchMode = "global";
  var currentView = "both";
  var mapFocusKey = "";
  var activeMapData = null;
  var selectedMapCode = "";
  var pendingSearchMapCode = "";
  var pendingSearchKeepMapView = false;
  var selectedAnimationCode = "";
  var selectedAnimationMarker = null;
  var hoverMarker = null;
  var currentLocationMarker = null;
  var hoveredMarkerCodes = new Set();
  var lastMapDrawSignature = "";
  var hoverInfoWindow = null;
  var switchingDetail = false;
  var regionLoadingKey = "";
  var initialRegionFocusPending = false;

  function byId(id) { return document.getElementById(id); }
  function safe(value) {
    return String(value == null ? "—" : value).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function highlightSearchMatch(value, query) {
    var terms = (Array.isArray(query) ? query : [query]).filter(Boolean);
    return terms.reduce(function (result, term) {
      var escaped = safe(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return result.replace(new RegExp(escaped, "ig"), "<span class='colorTxt'>$&</span>");
    }, safe(value));
  }
  function getData() { return window.sortData && Array.isArray(sortData.data) ? sortData.data : []; }
  function itemFor(index) { return getData()[index]; }
  // 2026-10-25: Map signatures rely on selected codes directly; the unused duplicate region-label lookup was removed.
  function regionKey() { return [window.selectedMonth, window.selectedSubRegion].join(":"); }
  function coords(item) { return [Number(item && item.Y), Number(item && item.X)]; }
  function hasExplicitRegionTarget() {
    var params = new URLSearchParams(window.location.search);
    return params.has("reg") || params.has("sub");
  }
  function readStoredMapViewport() {
    if (hasExplicitRegionTarget()) return null;
    try {
      var lat = Number(localStorage.getItem("lastMapLat_op_v2"));
      var lng = Number(localStorage.getItem("lastMapLng_op_v2"));
      var zoom = Number(localStorage.getItem("lastMapZoom_op_v2"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !lat || !lng) return null;
      return { center: [lat, lng], zoom: Number.isFinite(zoom) && zoom >= 1 ? zoom : null };
    } catch (_) { return null; }
  }
  function saveMapViewport() {
    if (!map || !map.getCenter) return;
    try {
      var center = map.getCenter();
      localStorage.setItem("lastMapLat_op_v2", center.lat());
      localStorage.setItem("lastMapLng_op_v2", center.lng());
      localStorage.setItem("lastMapZoom_op_v2", map.getZoom());
    } catch (_) {}
  }
  function syncNewSortHighlight(sortId) {
    document.querySelectorAll("#dataList .aptYear").forEach(function (node) {
      node.style.removeProperty("color");
      node.style.removeProperty("font-weight");
      if (sortId === "rearrangeNew") {
        node.style.setProperty("color", "#0047ab", "important");
        node.style.setProperty("font-weight", "600", "important");
      }
    });
  }

  function mount() {
    var list = byId("dataList");
    if (!list || byId("v2Workspace")) return;
    var showAptRearrange = window.showAPTRearrangeBar;
    if (typeof showAptRearrange === "function") {
      window.showAPTRearrangeBar = function () {
        var activeSort = $("input[name='btnRearrange']:checked").attr("id");
        showAptRearrange.apply(this, arguments);
        if (activeSort && /^rearrange(Score|Price|New|House)$/.test(activeSort)) $("#" + activeSort).prop("checked", true);
      };
    }
    var applyAptRearrange = window.rearrangeAPTList;
    if (typeof applyAptRearrange === "function") {
      window.rearrangeAPTList = function (control) {
        applyAptRearrange.apply(this, arguments);
        var sortId = control && control.id;
        if (["rearrangeScore", "rearrangePrice", "rearrangeNew", "rearrangeHouse"].indexOf(sortId) < 0) return;
        document.querySelectorAll("#dataList .value_score").forEach(function (node) { node.remove(); });
        syncNewSortHighlight(sortId);
        document.querySelectorAll("#dataList .listBox").forEach(function (card) {
          var call = (card.getAttribute("onclick") || "").match(/showDetail\s*\(\s*(\d+)/);
          var item = call && window.sortData && Array.isArray(window.sortData.data) ? window.sortData.data[Number(call[1])] : null;
          var rank = card.querySelector(".rank");
          if (!rank || !item || typeof window.setGrade !== "function") return;
          rank.textContent = window.setGrade(Number(item["가치 총점"]));
          var rankContent = rank.parentElement;
          if (sortId === "rearrangeScore") rankContent.querySelectorAll(".rankup, .rankdown, .ranksame").forEach(function (node) { node.remove(); });
          if (!rankContent.querySelector(".v2-rank-caption")) {
            var caption = document.createElement("div");
            caption.className = "ranksame v2-rank-caption";
            caption.textContent = "RANK";
            rankContent.insertBefore(caption, rank);
          }
        });
      };
    }
    document.addEventListener("change", function (event) {
      if (!event.target.matches("input[name='btnRearrange']")) return;
      var selectedSort = event.target.id;
      window.setTimeout(function () { syncNewSortHighlight(selectedSort); }, 0);
    });
    window.closeRearrange = function () {
      $("#rearrangeCard").animate({ opacity: 0, top: "-150px" }, 400, "easeInQuad");
      $("#closeRearrange_floating").animate({ opacity: 0, right: "-200px" }, 400, "easeInQuad");
      window.rearrangeAPTSelection = "rearrangeScore";
    };
    var rearrangeButton = byId("rearrange");
    if (rearrangeButton) {
      rearrangeButton.removeAttribute("onclick");
      rearrangeButton.addEventListener("click", function (event) {
        event.preventDefault();
        var open = window.showRearrangeBar;
        if (typeof open === "function") open.call(this);
      });
      rearrangeButton.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); rearrangeButton.click(); }
      });
    }
    var searchPanel = document.createElement("section");
    searchPanel.id = "v2GlobalSearchPanel";
    searchPanel.innerHTML = "<div class='v2-search-icon'><i class='fas fa-search' aria-hidden='true'></i></div><div class='v2-search-guide'><div class='v2-search-modes' role='group' aria-label='검색 범위'><label><input type='radio' name='v2SearchMode' class='v2-search-mode' data-search-mode='global' checked><span>전국검색</span></label><label><input type='radio' name='v2SearchMode' class='v2-search-mode' data-search-mode='local'><span id='v2LocalSearchLabel'>지역내검색</span></label></div><div class='v2-search-input-wrap'><input id='v2GlobalSearchInput' type='text' autocomplete='off' placeholder='두 글자 이상 입력해 주세요'></div><div class='v2-search-example'>예) 강남 래미안, 래미안 힐스테이트, 주공</div></div><button type='button' class='v2-search-close' aria-label='검색 닫기'><i class='fas fa-times'></i></button>";
    var searchResultsPanel = document.createElement("section");
    searchResultsPanel.id = "v2GlobalSearchResults";
    searchResultsPanel.setAttribute("aria-label", "검색 결과");
    searchResultsPanel.innerHTML = "<div id='v2GlobalSearchHint'></div><div id='v2GlobalSearchResultItems' role='listbox'></div>";
    list.parentNode.insertBefore(searchPanel, list);
    var searchButton = byId("search");
    if (searchButton) {
      searchButton.removeAttribute("onclick");
      searchButton.addEventListener("click", function (event) { event.preventDefault(); showV2UnifiedSearch(); });
      searchButton.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); showV2UnifiedSearch(); }
      });
    }
    var mapPane = document.createElement("div");
    mapPane.id = "v2Map";
    mapPane.setAttribute("aria-label", "오피스텔 위치 지도");
    list.parentNode.insertBefore(mapPane, list.nextSibling);

    var workspace = document.createElement("div");
    workspace.id = "v2Workspace";
    var listPane = document.createElement("div");
    listPane.id = "v2ListPane";
    list.parentNode.insertBefore(workspace, searchPanel);
    listPane.appendChild(list);
    workspace.appendChild(listPane);
    workspace.appendChild(mapPane);
    var regionLoading = document.createElement("div");
    regionLoading.id = "v2RegionLoading";
    regionLoading.setAttribute("role", "status");
    regionLoading.setAttribute("aria-live", "polite");
    // 2026-10-26: Match the reference's dimmed loading backdrop and white grow spinner.
    regionLoading.innerHTML = "<span class='spinner-grow text-pageLoading' role='status' aria-hidden='true'></span><span>지역 정보를 불러오는 중입니다.</span>";
    document.body.appendChild(regionLoading);
    // 2026-10-26: Show the region loader immediately; the OP entry screen now starts on the map.
    beginRegionLoading(regionKey());
    document.body.appendChild(searchPanel);
    document.body.appendChild(searchResultsPanel);

    var gradeSelector = document.createElement("div");
    gradeSelector.id = "gradeSelector";
    gradeSelector.setAttribute("aria-label", "지도 마커 등급 필터");
    gradeSelector.innerHTML = ["S", "A", "B", "C"].map(function (grade) {
      return "<div class='gradeSelector_check'><input class='form-check-input' type='checkbox' id='check_grade_" + grade + "' value='" + grade + "' checked><label id='check_grade_" + grade + "_text' for='check_grade_" + grade + "'>" + grade + "</label></div>";
    }).join("");
    workspace.appendChild(gradeSelector);
    gradeSelector.addEventListener("change", function () { lastMapDrawSignature = ""; drawVisibleMapData(); });

    var detailModal = $("#exampleModal");
    detailModal.on("show.bs.modal.opV2", function () {
      if (isMobileLayout()) return;
      window.setTimeout(function () {
        $(".modal-backdrop").css({ left: 0, width: "600px", zIndex: 1000 });
        detailModal.css({ left: 0, width: "600px", zIndex: 1055 });
      }, 0);
    });
    detailModal.on("shown.bs.modal.opV2", function () {
      if (!isMobileLayout()) $(".modal-backdrop").css({ left: 0, width: "600px", zIndex: 1000 });
    });
    detailModal.on("hidden.bs.modal.opV2", function () {
      stopSelectedAnimation();
      var wasSwitchingDetail = switchingDetail;
      if (!wasSwitchingDetail) selectedMapCode = "";
      switchingDetail = false;
      if (!isMobileLayout()) $(".modal-backdrop").css({ width: "100%", zIndex: 1050 });
    });

    list.addEventListener("click", function (event) {
      var card = event.target.closest && event.target.closest(".listBox[onclick]");
      if (!card) return;
      var match = (card.getAttribute("onclick") || "").match(/showDetail\s*\(\s*(\d+)/);
      if (!match) return;
      var item = itemFor(Number(match[1]));
      if (item) selectComplexOnMap(item);
    });

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

    mobileToggle.addEventListener("click", function () { setView(currentView === "map" ? "list" : "map"); });
    searchPanel.querySelector(".v2-search-close").addEventListener("click", function () {
      closeV2UnifiedSearch();
    });
    updateLocalSearchLabel();
    ["sido", "gungu"].forEach(function (id) {
      var select = byId(id);
      if (select) select.addEventListener("change", updateLocalSearchLabel);
    });
    searchPanel.querySelectorAll("[data-search-mode]").forEach(function (button) {
      button.addEventListener("change", function () {
        searchMode = button.dataset.searchMode;
        searchPanel.querySelectorAll("[data-search-mode]").forEach(function (modeButton) {
          var active = modeButton.dataset.searchMode === searchMode;
          modeButton.checked = active;
        });
        byId("v2GlobalSearchHint").textContent = searchMode === "global" ? "전국 오피스텔 · 두 글자 이상 입력해 주세요" : "선택한 시군구 · 두 글자 이상 입력해 주세요";
        searchNational();
      });
    });
    byId("v2GlobalSearchInput").addEventListener("input", searchNational);
    searchResultsPanel.addEventListener("click", function (event) {
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
    byId("v2CurrentLocation").addEventListener("click", goToCurrentLocation);

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
    if (window.ResizeObserver) {
      var headerResizeObserver = new ResizeObserver(function () {
        syncWorkspaceGeometry();
        if (!map || !window.naver || !naver.maps) return;
        window.requestAnimationFrame(function () {
          var pane = byId("v2Map");
          if (pane && pane.clientWidth > 0 && pane.clientHeight > 0) {
            map.setSize(new naver.maps.Size(pane.clientWidth, pane.clientHeight));
          }
        });
      });
      ["titleBar", "selections", "weight"].forEach(function (id) {
        var header = byId(id);
        if (header) headerResizeObserver.observe(header);
      });
    }
    scheduleRefresh();
  }

  function isMobileLayout() { return window.matchMedia("(max-width: 799px)").matches; }
  function isReferenceMobile() {
    return typeof window.isMobile === "boolean" ? window.isMobile : isMobileLayout();
  }

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
    var regionLoadingEl = byId("v2RegionLoading");
    if (regionLoadingEl) regionLoadingEl.style.bottom = footerHeight + "px";
    if (mobile) {
      // 2026-10-26: Start the map below the rendered header stack instead of a fixed 122px guess.
      var headerBottom = 0;
      ["titleBar", "selections", "weight"].forEach(function (id) {
        var header = byId(id);
        if (!header || window.getComputedStyle(header).display === "none") return;
        var rect = header.getBoundingClientRect();
        if (rect.height > 0) headerBottom = Math.max(headerBottom, rect.bottom);
      });
      var mobileTop = headerBottom > 0 ? Math.floor(headerBottom) : (document.body.classList.contains("v2-national-region") ? 97 : 122);
      document.documentElement.style.setProperty("--v2-top-stack", mobileTop + "px");
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
    if (button.disabled) return;
    var originalContent = button.innerHTML;
    button.disabled = true;
    button.classList.add("is-loading");
    // 2026-10-26: Use the reference's dark button and compact white Bootstrap spinner while locating.
    button.style.backgroundColor = "#333";
    button.style.borderColor = "#333";
    button.innerHTML = "<div class='spinner-border spinner-border-sm text-white' role='status'></div>";
    navigator.geolocation.getCurrentPosition(function (position) {
      button.disabled = false;
      button.classList.remove("is-loading");
      button.style.backgroundColor = "";
      button.style.borderColor = "";
      button.innerHTML = originalContent;
      if (!map) renderMap();
      if (!map) return;
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      var location = new naver.maps.LatLng(lat, lng);
      updateCurrentLocationMarker(location);
      map.setCenter(location);

      var regionRows = activeMapData && activeMapData.regions || [];
      var nearestDistrict = null;
      var minDistance = Infinity;
      regionRows.forEach(function (row) {
        if (row.Level !== "Level1") return;
        var rowLat = Number(row.lat);
        var rowLng = Number(row.lng);
        if (!Number.isFinite(rowLat) || !Number.isFinite(rowLng)) return;
        var radians = Math.PI / 180;
        var dLat = (rowLat - lat) * radians;
        var dLng = (rowLng - lng) * radians;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
          + Math.cos(lat * radians) * Math.cos(rowLat * radians) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        var distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (distance < minDistance) { minDistance = distance; nearestDistrict = row; }
      });
      if (nearestDistrict) {
        var districtCode = String(nearestDistrict["법정동코드"] || "");
        var districtName = String(nearestDistrict.name_en || "");
        var sidoCode = districtName.split("_")[0];
        var gunguCode = districtCode + "_" + districtName;
        if (sidoCode && gunguCode) {
          $("#sido").val(sidoCode);
          if (typeof window.optionChange === "function") window.optionChange(gunguCode, sidoCode);

          updateLocalSearchLabel();
          // Keep the user's location centered when the newly selected region reloads.
          mapFocusKey = [window.selectedMonth, window.selectedSubRegion].join(":");
          if (typeof window.updateRegion === "function") window.updateRegion();
        }
      }
    }, function () {
      button.disabled = false;
      button.classList.remove("is-loading");
      button.style.backgroundColor = "";
      button.style.borderColor = "";
      button.innerHTML = originalContent;
      button.title = "위치 권한을 허용한 뒤 다시 눌러 주세요.";
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }

  function updateCurrentLocationMarker(position) {
    if (!map || !position) return;
    if (!currentLocationMarker) {
      currentLocationMarker = new naver.maps.Marker({
        position: position,
        map: map,
        icon: {
          content: "<div class='v2-current-location-dot'><span></span></div>",
          size: new naver.maps.Size(32, 32),
          anchor: new naver.maps.Point(16, 16)
        },
        zIndex: 2147483647
      });
    } else {
      currentLocationMarker.setPosition(position);
      currentLocationMarker.setMap(map);
      currentLocationMarker.setZIndex(2147483647);
    }
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
    byId("gradeSelector").classList.toggle("is-hidden", mobile && currentView === "list");
    byId("rearrange").style.visibility = mobile && currentView === "map" ? "hidden" : "visible";
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

  function loadSearchIndex(month) {
    month = String(month || window.selectedMonth || "202610");
    if (searchIndexes[month]) return Promise.resolve(searchIndexes[month]);
    if (!searchRequests[month]) {
      // 2026-10-25: Read the authoritative monthly list directly; the old generated search-index artifact is not used.
      searchRequests[month] = fetch("/op/" + encodeURIComponent(month) + "/Searching_list_op.json", { cache: "force-cache" })
        .then(function (response) { if (!response.ok) throw new Error("전국 오피스텔 검색 데이터를 불러오지 못했습니다."); return response.json(); })
        .then(function (table) {
          if (!Array.isArray(table.data)) throw new Error("전국 오피스텔 데이터 형식이 올바르지 않습니다.");
          var data = {
            month: month,
            data: table.data,
            entries: table.data.map(function (item, index) {
              return [item["오피스텔명"], item["법정동주소"], item.sido, item.gungu, index, item["검색코드"]];
            })
          };
          searchIndexes[month] = data;
          return data;
        })
        .catch(function (error) { delete searchRequests[month]; throw error; });
    }
    return searchRequests[month];
  }

  function loadRegionMap(month) {
    month = String(month || window.selectedMonth || "202610");
    if (regionMaps[month]) return Promise.resolve(regionMaps[month]);
    if (!regionMapRequests[month]) {
      regionMapRequests[month] = fetch("/op/" + encodeURIComponent(month) + "/region_map_op.json", { cache: "force-cache" })
        .then(function (response) { if (!response.ok) throw new Error("오피스텔 지역 지도 데이터를 불러오지 못했습니다."); return response.json(); })
        .then(function (table) {
          if (!Array.isArray(table.data)) throw new Error("오피스텔 지역 지도 데이터 형식이 올바르지 않습니다.");
          regionMaps[month] = table.data;
          return table.data;
        })
        .catch(function (error) { delete regionMapRequests[month]; throw error; });
    }
    return regionMapRequests[month];
  }

  function loadMapData(month) {
    return Promise.all([loadSearchIndex(month), loadRegionMap(month)]).then(function (results) {
      return { search: results[0], regions: results[1] };
    });
  }

  function showV2UnifiedSearch() {
    var panel = byId("v2GlobalSearchPanel");
    if (!panel) return;
    updateLocalSearchLabel();
    panel.classList.add("is-visible");
    byId("v2GlobalSearchResults").classList.add("is-visible");
    if (!byId("v2GlobalSearchInput").value.trim()) renderRecentSearches();
    byId("v2GlobalSearchInput").focus();
  }

  function closeV2UnifiedSearch() {
    var panel = byId("v2GlobalSearchPanel");
    var results = byId("v2GlobalSearchResults");
    if (panel) panel.classList.remove("is-visible");
    if (results) results.classList.remove("is-visible", "has-query");
    if (byId("v2GlobalSearchInput")) {
      byId("v2GlobalSearchInput").value = "";
      byId("v2GlobalSearchInput").blur();
    }
    if (byId("v2GlobalSearchResultItems")) byId("v2GlobalSearchResultItems").innerHTML = "";
  }

  function updateLocalSearchLabel() {
    var label = byId("v2LocalSearchLabel");
    if (!label) return;
    var sido = $("#sido option:selected").text().trim();
    var gungu = $("#gungu option:selected").text().trim();
    label.textContent = sido && gungu ? sido + " " + gungu + " 검색" : "지역내검색";
  }

  function readRecentSearches() {
    try {
      var stored = localStorage.getItem("op_v2_recent_searches");
      if (stored !== null) {
        var value = JSON.parse(stored);
        return Array.isArray(value) ? value : [];
      }
      var legacy = JSON.parse(localStorage.getItem("recentSearch") || "[]");
      if (!Array.isArray(legacy)) return [];
      var migrated = legacy.map(function (row) {
        var dateMatch = String(row[5] || "").match(/(\d{2})년\s*(\d+)월\s*(\d+)일,\s*(\d+)시\s*(\d+)분/);
        var savedAt = dateMatch ? new Date(2000 + Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]), Number(dateMatch[4]), Number(dateMatch[5])).getTime() : Date.now();
        return { entry: [row[3], row[4], row[1], row[2], -1, row[0]], month: String(window.selectedMonth || "202610"), savedAt: savedAt };
      });
      localStorage.setItem("op_v2_recent_searches", JSON.stringify(migrated));
      return migrated;
    } catch (_) { return []; }
  }

  function formatRecentDate(timestamp) {
    var date = new Date(Number(timestamp) || Date.now());
    var minute = String(date.getMinutes()).padStart(2, "0");
    return String(date.getFullYear()).slice(-2) + "년 " + (date.getMonth() + 1) + "월 " + date.getDate() + "일, " + date.getHours() + "시 " + minute + "분에 검색";
  }

  function saveRecentSearch(entry, month) {
    var recents = readRecentSearches().filter(function (recent) { return String(recent.entry[5]) !== String(entry[5]); });
    recents.unshift({ entry: entry, month: month, savedAt: Date.now() });
    try { localStorage.setItem("op_v2_recent_searches", JSON.stringify(recents.slice(0, 10))); } catch (_) {}
  }

  function showDetailFromMap(index) {
    if (!window.showDetail) return;
    var modal = $("#exampleModal");
    var selectedCode = selectedMapCode;
    // 2026-10-26: Detail modal display is independent of the main map viewport; do not change its center or zoom here.
    var openDetail = function () {
      modal.removeData("opV2SwitchingDetail");
      window.showDetail(index);
      modal.modal("show");
      selectedMapCode = selectedCode;
      window.setTimeout(function () { animateSelectedMarker(selectedCode); }, 0);
    };
    if (modal.hasClass("show") || modal.is(":visible")) {
      switchingDetail = true;
      modal.data("opV2SwitchingDetail", true);
      // 2026-10-26: Wait until Bootstrap finishes removing the old backdrop before showing the replacement detail.
      modal.off("hidden.bs.modal.opV2Map").one("hidden.bs.modal.opV2Map", function () {
        window.setTimeout(openDetail, 0);
      });
      modal.modal("hide");
      return;
    }
    openDetail();
  }

  function renderRecentSearches() {
    var recents = readRecentSearches();
    var results = byId("v2GlobalSearchResultItems");
    byId("v2GlobalSearchResults").classList.remove("has-query");
    byId("v2GlobalSearchHint").innerHTML = "빠른 검색 속도를 위해<br>두 글자 이상부터 검색할 수 있도록 해 두었어요!";
    results.innerHTML = "<div id='recent_search_box'>최근검색</div>" + (recents.length ? recents.map(function (recent, index) {
      var entry = recent.entry || [];
      return "<div class='recentListBox'><button type='button' class='recentListBox_complex' role='option' data-recent-index='" + index + "'><div class='searched_apt_name'>" + safe(entry[0]) + "</div><div class='searched_apt_info'>" + safe(entry[1]) + "</div><div class='searched_apt_date'>" + formatRecentDate(recent.savedAt) + "</div></button><button type='button' class='deleteRecent' data-remove-recent='" + index + "' aria-label='최근 검색에서 삭제'><i class='fa-solid fa-circle-xmark' aria-hidden='true'></i></button></div>";
    }).join("") : "");
  }

  function searchNational() {
    var input = byId("v2GlobalSearchInput");
    var rawQuery = input.value.trim();
    var query = rawQuery.toLocaleLowerCase("ko-KR");
    var terms = rawQuery.split(/\s+/).filter(Boolean);
    if (terms.length > 2) terms = [terms[0], terms.slice(1).join("")];
    var results = byId("v2GlobalSearchResultItems");
    if (query.length < 2) { renderRecentSearches(); return; }
    byId("v2GlobalSearchResults").classList.add("has-query");
    var matching = function (text) {
      var normalized = String(text || "").toLocaleLowerCase("ko-KR");
      return terms.every(function (term) { return normalized.indexOf(term.toLocaleLowerCase("ko-KR")) >= 0; });
    };
    if (searchMode === "local") {
      var localMatches = getData().map(function (item, index) {
        var name = String(item["오피스텔명"] || "");
        var address = String(item["법정동주소"] || item["도로명주소"] || "");
        return { item: item, index: index, name: name, address: address };
      }).filter(function (match) { return matching(match.name + " " + match.address); });
      byId("v2GlobalSearchHint").textContent = localMatches.length ? localMatches.length + "개 결과" : "현재 지역에서 검색 결과가 없습니다.";
      results.innerHTML = localMatches.map(function (match) {
        return "<div class='searchedListBox' role='option' data-local-result='" + match.index + "'><div class='searched_apt_name'>" + highlightSearchMatch(match.name, terms) + "</div><div class='searched_apt_info'>" + highlightSearchMatch(match.address, terms) + "</div></div>";
      }).join("") + "<div style='height:3em'></div>";
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
    byId("v2GlobalSearchHint").textContent = "검색 중입니다…";
    loadSearchIndex(window.selectedMonth).then(function (data) {
      if (input.value.trim() !== rawQuery || searchMode !== "global") return;
      var matches = data.entries.filter(function (entry) { return matching(entry[0] + " " + entry[1]); });
      byId("v2GlobalSearchHint").textContent = matches.length ? matches.length + "개 결과" : "검색 결과가 없습니다.";
      results.innerHTML = matches.map(function (entry, index) {
        return "<div class='searchedListBox' role='option' data-result='" + index + "'><div class='searched_apt_name'>" + highlightSearchMatch(entry[0], terms) + "</div><div class='searched_apt_info'>" + highlightSearchMatch(entry[1], terms) + "</div></div>";
      }).join("") + "<div style='height:3em'></div>";
      results.querySelectorAll("[data-result]").forEach(function (button) {
        button.addEventListener("click", function () { openSearchResult(matches[Number(button.dataset.result)], data.month); });
      });
    }).catch(function () {
      byId("v2GlobalSearchResultItems").innerHTML = "<div class='v2-search-empty'>검색 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>";
    });
  }

  function openSearchResult(entry, month, keepMapView) {
    if (!entry) return;
    saveRecentSearch(entry, month);
    closeV2UnifiedSearch();
    var currentCodeIndex = getData().findIndex(function (item) {
      return String(item["검색코드"] || "") === String(entry[5] || "");
    });
    if (String(window.selectedMonth) === String(month)
      && String(window.selectedSubRegion) === String(entry[3])
      && currentCodeIndex >= 0
      && window.showDetail) {
      pendingSearchMapCode = String(entry[5] || "");
      pendingSearchKeepMapView = !!keepMapView;
      selectedMapCode = pendingSearchMapCode;
      if (!keepMapView) selectComplexOnMap(getData()[currentCodeIndex]);
      pendingSearchMapCode = "";
      pendingSearchKeepMapView = false;
      if (!keepMapView && isMobileLayout()) setView("list");
      showDetailFromMap(currentCodeIndex);
      return;
    }
    $("#month").val(month);
    window.selectedMonth = month;
    $("#sido").val(entry[2]);
    if (typeof window.optionChange === "function") window.optionChange(entry[3], entry[2]);
    if (typeof window.updateRegion === "function") window.updateRegion();
    var tries = 0;
    var previousData = window.aptData;
    pendingSearchMapCode = String(entry[5] || "");
    pendingSearchKeepMapView = !!keepMapView;
    selectedMapCode = pendingSearchMapCode;
    if (!keepMapView && isMobileLayout()) setView("list");
    if (map) mapFocusKey = "";
    var timer = window.setInterval(function () {
      tries++;
      var index = getData().findIndex(function (item) { return String(item["검색코드"] || "") === String(entry[5] || ""); });
      var loadedTarget = window.selectedMonth === month && window.selectedSubRegion === entry[3] && window.aptData !== previousData;
      if (loadedTarget && index >= 0 && window.showDetail) {
        window.clearInterval(timer);
        pendingSearchMapCode = String(entry[5] || "");
        pendingSearchKeepMapView = !!keepMapView;
        selectedMapCode = pendingSearchMapCode;
        if (map) renderMap();
        showDetailFromMap(index);
      } else if (tries >= 50) { window.clearInterval(timer); pendingSearchKeepMapView = false; }
    }, 200);
  }

  function selectedMapCenter(regionRows, items) {
    var subRegion = String(window.selectedSubRegion || "");
    // 2026-10-25: Use Chungcheongbuk-do as the nationwide map center, with the map-data coordinate as first choice.
    if (subRegion === "1000000000_Korea") {
      var chungbuk = regionRows.find(function (item) {
        return item.Level === "Level0" && String(item["법정동명"] || "").indexOf("충청북도") >= 0;
      });
      var chungbukLat = Number(chungbuk && chungbuk.lat);
      var chungbukLng = Number(chungbuk && chungbuk.lng);
      if (Number.isFinite(chungbukLat) && Number.isFinite(chungbukLng) && chungbukLat && chungbukLng) return [chungbukLat, chungbukLng];
      return [36.6353582, 127.4914573];
    }
    var code = subRegion.split("_")[0];
    var level = code === "1000000000" ? "Level0" : "Level1";
    var row = regionRows.find(function (item) {
      return String(item["법정동코드"]) === code && item.Level === level;
    });
    if (!row && code && code !== subRegion) {
      row = regionRows.find(function (item) {
        return String(item.find_link) === code && item.Level === "Level2";
      });
    }
    var lat = Number(row && row.lat);
    var lng = Number(row && row.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat && lng) return [lat, lng];
    var first = items.find(function (item) {
      var pos = coords(item);
      return Number.isFinite(pos[0]) && Number.isFinite(pos[1]) && pos[0] && pos[1];
    });
    return first ? coords(first) : [37.5665, 126.9780];
  }

  function mapGrade(item) {
    var score = Number(item && item["가치 총점"]);
    return score >= 78.6962 ? "S" : score >= 53.3691 ? "A" : score >= 31.9721 ? "B" : "C";
  }

  function clearMapMarkers() {
    if (hoverMarker && hoverInfoWindow) hoverInfoWindow.close();
    hoverMarker = null;
    markers.forEach(function (marker) {
      if (marker.setAnimation) marker.setAnimation(null);
      if (selectedAnimationMarker === marker) selectedAnimationMarker = null;
      (marker.opListeners || []).forEach(function (listener) { naver.maps.Event.removeListener(listener); });
      marker.setMap(null);
    });
    markers = [];
  }

  function stopSelectedAnimation() {
    if (selectedAnimationMarker && selectedAnimationMarker.setAnimation) selectedAnimationMarker.setAnimation(null);
    selectedAnimationMarker = null;
    selectedAnimationCode = "";
  }

  function animateSelectedMarker(code) {
    if (!code || !window.naver || !naver.maps) return;
    var marker = markers.find(function (candidate) { return String(candidate.opCode || "") === String(code); });
    if (marker && marker.setAnimation && naver.maps.Animation) {
      marker.setZIndex(hoveredMarkerCodes.has(String(code)) ? 2147483647 : 10000000);
      if (selectedAnimationCode === String(code) && selectedAnimationMarker === marker) return;
      if (selectedAnimationMarker && selectedAnimationMarker !== marker && selectedAnimationMarker.setAnimation) selectedAnimationMarker.setAnimation(null);
      selectedAnimationCode = String(code);
      selectedAnimationMarker = marker;
      marker.setAnimation(naver.maps.Animation.BOUNCE);
    }
  }

  function showComplexHover(marker, item) {
    return {
      mouseover: function () {
        if (!map || !window.naver || !naver.maps || hoverMarker === marker) return;
        hoveredMarkerCodes.add(marker.opCode);
        marker.setZIndex(2147483647);
        hoverMarker = marker;
        var content = "<div class='v2-complex-info-window'><div id='info_window_complex_name'>" + safe(item["오피스텔명"] || "오피스텔") + "</div><div id='info_window_complex_address'>" + safe(item["법정동주소"] || item["도로명주소"] || "주소 정보 없음") + "</div></div>";
        var hoverOffset = new naver.maps.Point(26, 0);
        if (!hoverInfoWindow) hoverInfoWindow = new naver.maps.InfoWindow({ content: content, borderWidth: 0, backgroundColor: "transparent", anchorSize: new naver.maps.Size(0, 0), pixelOffset: hoverOffset, disableAutoPan: true });
        else { hoverInfoWindow.setContent(content); hoverInfoWindow.setOptions({ pixelOffset: hoverOffset }); }

        hoverInfoWindow.open(map, marker);
        makeHoverInfoWindowPointerTransparent();
        window.requestAnimationFrame(makeHoverInfoWindowPointerTransparent);
      },
      mouseout: function () {
        if (hoverMarker !== marker) return;
        hoverMarker = null;
        if (hoverInfoWindow) hoverInfoWindow.close();
      }
    };
  }

  function makeHoverInfoWindowPointerTransparent() {
    if (!hoverInfoWindow || !map || !hoverInfoWindow.getContentElement) return;
    var node = hoverInfoWindow.getContentElement();
    var panes = hoverInfoWindow.getPanes && hoverInfoWindow.getPanes();
    var floatPane = panes && panes.floatPane;
    if (!floatPane) {
      if (node) node.style.pointerEvents = "none";
      if (node && node.parentElement) node.parentElement.style.pointerEvents = "none";
      return;
    }
    while (node && node !== floatPane) {
      node.style.pointerEvents = "none";
      node = node.parentElement;
    }
  }

  function selectComplexOnMap(item) {
    if (!item) return;
    var pos = coords(item);
    if (!Number.isFinite(pos[0]) || !Number.isFinite(pos[1]) || !pos[0] || !pos[1]) return;
    stopSelectedAnimation();
    selectedMapCode = String(item["검색코드"] || "");
    if (!map) { pendingSearchMapCode = selectedMapCode; renderMap(); return; }
    pendingSearchMapCode = "";
    map.setCenter(new naver.maps.LatLng(pos[0], pos[1]));
    // 2026-10-26: Selecting a complex keeps the user's current map scale.
    window.setTimeout(function () { drawVisibleMapData(); animateSelectedMarker(selectedMapCode); }, 250);
  }

  function focusMapOnNationwideRegion(lat, lng) {
    if (!map || !window.naver || !naver.maps) return;
    lat = Number(lat);
    lng = Number(lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !lat || !lng) return;
    mapFocusKey = [window.selectedMonth, window.selectedSubRegion].join(":");
    map.setCenter(new naver.maps.LatLng(lat, lng));
    var targetZoom = isReferenceMobile() ? 10 : 11;
    if (map.getZoom() < targetZoom) map.setZoom(targetZoom, true);
    window.setTimeout(drawVisibleMapData, 250);
  }

  function mapBounds() { return map && map.getBounds ? map.getBounds() : null; }

  function beginRegionLoading(key) {
    regionLoadingKey = String(key || regionKey());
    var workspace = byId("v2Workspace");
    if (workspace) workspace.classList.add("v2-region-loading");
    document.body.classList.add("v2-region-loading");
    var loading = byId("v2RegionLoading");
    if (loading) {
      loading.classList.remove("is-error");
      loading.innerHTML = "<span class='spinner-grow text-pageLoading' role='status' aria-hidden='true'></span><span>지역 정보를 불러오는 중입니다.</span>";
    }
  }

  function finishRegionLoading(key) {
    key = String(key || regionKey());
    if (regionLoadingKey && regionLoadingKey !== key) return;
    if (key !== regionKey()) return;
    var workspace = byId("v2Workspace");
    if (workspace) workspace.classList.remove("v2-region-loading");
    document.body.classList.remove("v2-region-loading");
    regionLoadingKey = "";
  }

  function settleRegionLoadingOnIdle(key) {
    if (!map || !window.naver || !naver.maps || regionLoadingKey !== key) return;
    naver.maps.Event.once(map, "idle", function () {
      drawVisibleMapData();
      finishRegionLoading(key);
    });
    window.setTimeout(function () {
      if (regionLoadingKey === key) {
        drawVisibleMapData();
        finishRegionLoading(key);
      }
    }, 1000);
  }

  function markerGradeClass(grade) { return "grade" + grade; }

  function markerColor(grade) {
    return grade === "S" ? "#162235" : grade === "A" ? "#1f5d9f" : grade === "B" ? "#2e78b7" : "#527a9f";
  }

  function markerSaleLabels(item) {
    var raw = String(item.last_sales || "");
    if (raw === "BYG") return { price: "분양", area: "" };
    var parts = raw.split(",");
    var price = Number(parts[1]);
    if (!parts[1] || !Number.isFinite(price)) return { price: "정보없음", area: "--" };
    return { price: (Math.round(price / 100) / 100) + "억", area: parts[2] || "--" };
  }

  function largeMarkerSvg(item, grade, gradeLabel, markerId, mobileLarge, scale) {
    var gradeClass = markerGradeClass(grade);
    var color = markerColor(grade);
    var sale = markerSaleLabels(item);
    // 2026-10-25: Support a detail-only marker scale; the main map keeps the default 1x size.
    scale = Number.isFinite(Number(scale)) && Number(scale) > 0 ? Number(scale) : 1;
    var markerWidth = 68 * scale;
    var size = mobileLarge ? 45 : 35;
    var priceId = "op_sPrice_" + markerId;
    var areaId = "op_area_" + markerId;
    var svg = "<svg version='1.1' class='large_marker " + gradeClass + "' id='large_marker_" + markerId + "' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 " + size + " " + size + "' style='enable-background:new 0 0 800 1200;' xml:space='preserve' width='" + (68 * scale) + "' height='" + (60 * scale) + "'>" +
      "<defs><style>." + gradeClass + "{fill:" + color + "}.large_marker_" + gradeClass + "{stroke:" + color + ";stroke-width:0.5}.cls-2{fill:#fff}.cls-3_text{fill:#fff;font-size:8px;font-weight:600}.cls-4_text{fill:#000;font-size:7px;font-weight:600}.cls-5_text{fill:#000;font-size:5px;font-weight:600}.cls-6_text{fill:#000;font-size:4px;font-weight:600}</style></defs>" +
      // 2026-10-26: Increase the two flat-roof corner radii from 1px to 2px.
      "<g class='svg_loc_large'><path class='cls-1 large_marker_" + gradeClass + "' d='M.12,12.29V5.5a2,2,0,0,1,2-2H31.43a2,2,0,0,1,2,2v6.79Z'/>" +
      "<path class='cls-2 large_marker_" + gradeClass + "' d='M.13,12.29V26.36c0,1.37.63,2.47,1.4,2.47H3.36L4.52,31l1.16,2.15L6.84,31,8,28.83H32.06c.78,0,1.41-1.1,1.41-2.47V12.29Z'/>" +
      "<text class='cls-3_text' text-anchor='middle' x='16.5' y='11'>" + safe(gradeLabel) + "</text><text class='cls-4_text' id='" + priceId + "' text-anchor='middle' x='17' y='20'>" + safe(sale.price) + "</text><text class='cls-5_text' id='" + areaId + "' text-anchor='middle' x='17' y='26'>" + safe(sale.area) + "</text></g></svg>";
    var wrapperHeight = (mobileLarge ? 65 : 60) * scale;
    // V2 has no reference-only visitor/sort badges, so keep the hit area
    // to the marker's 68px visual width instead of the reference's 96px.
    var anchorX = 12 * scale;
    var anchorY = wrapperHeight;
    var svgAnchorX = 12 * scale;
    var svgAnchorY = (mobileLarge ? 47 : 60) * scale;
    var left = 0;
    var top = anchorY - svgAnchorY;
    return {
      content: "<div style='position:relative;width:" + markerWidth + "px;height:" + wrapperHeight + "px'><div style='position:absolute;left:" + left + "px;top:" + top + "px'>" + svg + "</div></div>",
      size: new naver.maps.Size(markerWidth, wrapperHeight),
      anchor: new naver.maps.Point(anchorX, anchorY)
    };
  }

  // Share the exact main-map SVG marker with the detail-map preview.
  window.createOpLargeMarkerIcon = function (item, markerId, mobileLarge, scale) {
    if (!item) return null;
    var grade = mapGrade(item);
    var score = Number(item["가치 총점"]);
    var gradeLabel = typeof window.setGrade === "function" ? String(window.setGrade(score)) : grade;
    return largeMarkerSvg(item, grade, gradeLabel, "detail_" + String(markerId || "marker").replace(/[^a-zA-Z0-9_-]/g, "_"), !!mobileLarge, scale);
  };

  function smallMarkerSvg(grade, gradeLabel, markerId) {
    var gradeClass = markerGradeClass(grade);
    var color = markerColor(grade);
    var content = "<svg version='1.1' class='small_marker " + gradeClass + "' id='small_marker_" + markerId + "' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 20 20' style='enable-background:new 0 0 800 1200;' xml:space='preserve' width='30' height='30'>" +
      "<defs><style>." + gradeClass + "{fill:" + color + "}.small_marker_" + gradeClass + "{stroke:#fff;stroke-width:0.75;stroke-linejoin:round;paint-order:stroke fill;vector-effect:non-scaling-stroke}.cls-2_small_text{fill:#fff;font-size:9px;font-weight:600}</style></defs>" +
      "<g class='svg_loc_small'><path class='cls-1_small small_marker_" + gradeClass + "' d='M17.89,4.43V3.8a1.4,1.4,0,0,0-1.4-1.4H1.76A1.4,1.4,0,0,0,.36,3.8v10.63c0,.74.35,1.35.76,1.35h1l2.26,3.35,2.25-3.35h11c.41,0,.75-.61.75-1.35V4.86A.48.48,0,0,0,17.89,4.43Z'/><text class='cls-2_small_text' text-anchor='middle' x='9' y='12'>" + safe(gradeLabel) + "</text></g></svg>";
    return {
      content: content,
      size: new naver.maps.Size(24, 37),
      anchor: new naver.maps.Point(12, 24)
    };
  }

  function inCurrentBounds(lat, lng, bounds) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !lat || !lng) return false;
    return !bounds || bounds.hasLatLng(new naver.maps.LatLng(lat, lng));
  }

  function renderComplexMarkers(items, bounds, month) {
    var allowed = Array.from(byId("gradeSelector").querySelectorAll("input:checked")).map(function (input) { return input.value; });
    var mobileMarkerLayout = isReferenceMobile();
    var largeZoom = mobileMarkerLayout ? 15 : 16;
    var small = map.getZoom() < largeZoom;
    items.forEach(function (item, index) {
      var pos = coords(item);
      var grade = mapGrade(item);
      if (allowed.indexOf(grade) < 0 || !inCurrentBounds(pos[0], pos[1], bounds)) return;
      var score = Number(item["가치 총점"]);
      var gradeLabel = typeof window.setGrade === "function" ? String(window.setGrade(score)) : grade;
      var markerId = String(item["검색코드"] || index).replace(/[^a-zA-Z0-9_-]/g, "_");
      var sale = markerSaleLabels(item);
      var icon = small ? smallMarkerSvg(grade, gradeLabel, markerId) : largeMarkerSvg(item, grade, gradeLabel, markerId, mobileMarkerLayout && map.getZoom() === 15);
      var position = new naver.maps.LatLng(pos[0], pos[1]);
      var defaultZIndex = (small ? 100 : 500) + index;
      var marker = new naver.maps.Marker({
        map: map,
        position: position,
        title: (item["오피스텔명"] || "오피스텔") + " · " + gradeLabel + " · " + sale.price + (sale.area ? " · " + sale.area : ""),
        icon: icon,
        zIndex: defaultZIndex
      });
      marker.opCode = String(item["검색코드"] || "");
      marker.opDefaultZIndex = defaultZIndex;
      if (hoveredMarkerCodes.has(marker.opCode)) marker.setZIndex(2147483647);
      marker.apt_name = item["오피스텔명"] || "오피스텔";
      marker.address = item["법정동주소"] || item["도로명주소"] || "주소 정보 없음";
      marker.opListeners = [];
      var hoverListeners = showComplexHover(marker, item);
      marker.opListeners.push(naver.maps.Event.addListener(marker, "mouseover", hoverListeners.mouseover));
      marker.opListeners.push(naver.maps.Event.addListener(marker, "mouseout", hoverListeners.mouseout));
      marker.opListeners.push(naver.maps.Event.addListener(marker, "click", function () {
        stopSelectedAnimation();
        selectedMapCode = marker.opCode;
        // 2026-10-25: Open marker details directly so selecting a marker does not change map center or zoom.
        var detailIndex = getData().findIndex(function (currentItem) {
          return String(currentItem["검색코드"] || "") === marker.opCode;
        });
        if (detailIndex >= 0) {
          showDetailFromMap(detailIndex);
          return;
        }
        var entry = [item["오피스텔명"], item["법정동주소"], item.sido, item.gungu, -1, item["검색코드"]];
        openSearchResult(entry, month, true);
      }));
      markers.push(marker);
    });
    if (selectedMapCode) animateSelectedMarker(selectedMapCode);
  }

  function renderRegionMarkers(regionRows, bounds, level) {
    regionRows.forEach(function (item) {
      if (item.Level !== level) return;
      var lat = Number(item.lat);
      var lng = Number(item.lng);
      if (!inCurrentBounds(lat, lng, bounds)) return;
      var fullName = String(item["법정동명"] || "지역");
      var name = level === "Level0" ? fullName : fullName.split(/\s+/).pop();
      var rawPrice = Number(item.avg_price);
      var price = Number.isFinite(rawPrice) && rawPrice > 0 ? (rawPrice / 10000).toFixed(2) + "억" : "--";
      var complexCount = Number(item.complex_num);
      var summary = price + (Number.isFinite(complexCount) && complexCount > 0 ? " | " + complexCount.toLocaleString("ko-KR") + "개" : "");
      var sizeClass = level === "Level0" ? "lv0" : level === "Level1" ? "lv1" : "lv2";
      var content = "<div class='v2-map-area-marker v2-map-area-marker-" + sizeClass + "' title='" + safe(fullName) + "'><div class='v2-map-area-name'>" + safe(name) + "</div><div class='v2-map-area-price'>" + safe(summary) + "</div></div>";
      var position = new naver.maps.LatLng(lat, lng);
      var marker = new naver.maps.Marker({
        map: map,
        position: position,
        title: fullName + " · 평균 매매가 " + summary,
        icon: { content: content, size: new naver.maps.Size(24, 37), anchor: new naver.maps.Point(8, 45) },
        zIndex: 100
      });
      naver.maps.Event.addListener(marker, "click", function () {
        if (level === "Level0") {
          mapFocusKey = [window.selectedMonth, window.selectedSubRegion].join(":");
          map.setCenter(position);
          // 2026-10-26: Keep the current scale when a region summary marker is selected.
          return;
        }
        var upperRegion = String(item.name_en || "").split("_")[0];
        var subRegion = String(item.find_link || "") + "_" + String(item.name_en || "");
        if (upperRegion && subRegion !== String(window.selectedSubRegion)) {
          $("#sido").val(upperRegion).prop("selected", true);
          if (window.optionChange) window.optionChange(subRegion, upperRegion);
          // 2026-10-26: Let the region transition preserve zoom and recenter on its first complex after loading.
          if (window.updateRegion) window.updateRegion();
          return;
        }
        mapFocusKey = [window.selectedMonth, window.selectedSubRegion].join(":");
        map.setCenter(position);
        // 2026-10-26: Keep the current scale when moving between region summary markers.
      });
      markers.push(marker);
    });
  }

  function drawVisibleMapData() {
    if (!activeMapData || !map || !byId("v2Map")) return;
    var bounds = mapBounds();
    var southWest = bounds && bounds.getSW ? bounds.getSW() : null;
    var northEast = bounds && bounds.getNE ? bounds.getNE() : null;
    var grades = Array.from(byId("gradeSelector").querySelectorAll("input:checked")).map(function (input) { return input.value; }).sort().join("");
    var pane = byId("v2Map");
    var signature = [regionKey(), activeMapData.search.month, map.getZoom(),
      southWest ? southWest.lat().toFixed(5) + "," + southWest.lng().toFixed(5) : "",
      northEast ? northEast.lat().toFixed(5) + "," + northEast.lng().toFixed(5) : "",
      pane.clientWidth, pane.clientHeight, grades].join("|");
    if (signature === lastMapDrawSignature) return;
    lastMapDrawSignature = signature;
    clearMapMarkers();
    var zoom = map.getZoom();
    var mobile = isReferenceMobile();
    var singleZoom = mobile ? 14 : 15;
    var regionZoom = mobile ? 13 : 14;
    var districtZoom = mobile ? 10 : 11;
    var level = zoom >= regionZoom ? "Level2" : zoom >= districtZoom ? "Level1" : "Level0";
    if (zoom >= singleZoom) renderComplexMarkers(activeMapData.search.data, bounds, activeMapData.search.month);
    else renderRegionMarkers(activeMapData.regions, bounds, level);
  }

  function renderMap() {
    var pane = byId("v2Map");
    if (!pane || !window.naver || !naver.maps) return;
    var month = String(window.selectedMonth || "202610");
    loadMapData(month).then(function (data) {
      if (!pane.isConnected || month !== String(window.selectedMonth || "202610")) return;
      activeMapData = { search: data.search, regions: data.regions };
      var focusKey = [month, window.selectedSubRegion].join(":");
      var pendingItem = pendingSearchMapCode && data.search.data.find(function (item) { return String(item["검색코드"] || "") === pendingSearchMapCode; });
      var regionChanged = !!map && mapFocusKey !== focusKey && !pendingItem;
      var listBusy = byId("dataList").getAttribute("aria-busy") === "true";
      if (regionChanged && listBusy) {
        // 2026-10-26: Do not render stale-region markers while the selected region list is loading.
        return;
      }
      var currentRegionItems = getData();
      var nationwide = String(window.selectedSubRegion) === "1000000000_Korea";
      var storedViewport = map ? null : readStoredMapViewport();
      var firstRegionItem = regionChanged && !nationwide ? currentRegionItems.find(function (item) {
        var point = coords(item);
        return Number.isFinite(point[0]) && Number.isFinite(point[1]) && point[0] !== 0 && point[1] !== 0;
      }) : null;
      var center = pendingItem ? coords(pendingItem) : firstRegionItem ? coords(firstRegionItem) : storedViewport ? storedViewport.center : selectedMapCenter(data.regions, data.search.data);
      var defaultZoom = nationwide ? 8 : 16;
      var targetZoom = pendingItem ? (isReferenceMobile() ? 15 : 16) : storedViewport && storedViewport.zoom ? storedViewport.zoom : defaultZoom;
      var keepView = pendingSearchKeepMapView;
      if (pendingItem) { selectedMapCode = pendingSearchMapCode; pendingSearchMapCode = ""; pendingSearchKeepMapView = false; }
      if (!map) {
        map = new naver.maps.Map("v2Map", {
          center: new naver.maps.LatLng(center[0], center[1]),
          zoom: targetZoom,
          scaleControl: true,
          mapDataControl: false,
          zoomControl: true,
          zoomControlOptions: { style: naver.maps.ZoomControlStyle.SMALL, position: naver.maps.Position.TOP_RIGHT }
        });
        mapFocusKey = focusKey;
        initialRegionFocusPending = !storedViewport && !pendingItem && !nationwide;
        naver.maps.Event.addListener(map, "idle", function () {
          saveMapViewport();
          drawVisibleMapData();
        });
        if (initialRegionFocusPending && !listBusy) {
          var initialFirst = currentRegionItems.find(function (item) {
            var point = coords(item);
            return Number.isFinite(point[0]) && Number.isFinite(point[1]) && point[0] !== 0 && point[1] !== 0;
          });
          if (initialFirst) {
            var initialPoint = coords(initialFirst);
            map.setCenter(new naver.maps.LatLng(initialPoint[0], initialPoint[1]));
            initialRegionFocusPending = false;
          }
        }
        if (pendingItem) window.setTimeout(function () { drawVisibleMapData(); animateSelectedMarker(selectedMapCode); }, 250);
      } else if (mapFocusKey !== focusKey) {
        mapFocusKey = focusKey;
        initialRegionFocusPending = false;
        map.setCenter(new naver.maps.LatLng(center[0], center[1]));
        // 2026-10-26: Region changes keep the user's current zoom; only an explicit search target may zoom in.
        if (pendingItem && !keepView && map.getZoom() < targetZoom) map.setZoom(targetZoom, true);
        if (pendingItem) window.setTimeout(function () { drawVisibleMapData(); animateSelectedMarker(selectedMapCode); }, 250);
        settleRegionLoadingOnIdle(focusKey);
        return;
      } else if (pendingItem) { map.setCenter(new naver.maps.LatLng(center[0], center[1])); if (!keepView && map.getZoom() < targetZoom) map.setZoom(targetZoom, true); }
      else if (initialRegionFocusPending && !listBusy && !nationwide) {
        var firstLoadedItem = currentRegionItems.find(function (item) {
          var point = coords(item);
          return Number.isFinite(point[0]) && Number.isFinite(point[1]) && point[0] !== 0 && point[1] !== 0;
        });
        if (firstLoadedItem) {
          var firstLoadedPoint = coords(firstLoadedItem);
          map.setCenter(new naver.maps.LatLng(firstLoadedPoint[0], firstLoadedPoint[1]));
          initialRegionFocusPending = false;
        }
      }
      drawVisibleMapData();
      if (!listBusy) settleRegionLoadingOnIdle(focusKey);
    }).catch(function (error) {
      console.error("오피스텔 지도 데이터를 불러오지 못했습니다.", error);
      if (regionLoadingKey === regionKey()) {
        var failedKey = regionLoadingKey;
        var loading = byId("v2RegionLoading");
        if (loading) {
          loading.classList.add("is-error");
          loading.textContent = "지역 지도 정보를 불러오지 못했습니다.";
        }
        window.setTimeout(function () {
          var currentLoading = byId("v2RegionLoading");
          if (currentLoading) currentLoading.classList.remove("is-error");
          finishRegionLoading(failedKey);
        }, 1800);
      }
    });
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () {
      if (byId("v2Map") && (byId("v2Map").classList.contains("is-visible") || !isMobileLayout()) && window.naver && naver.maps) renderMap();
    }, 180);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
  window.showV2UnifiedSearch = showV2UnifiedSearch;
  window.beginV2RegionLoading = beginRegionLoading;
  window.refreshV2Layout = function () { if (byId("v2Workspace")) setView(currentView); };
  window.focusV2MapOnNationwideRegion = focusMapOnNationwideRegion;
  window.addEventListener("load", scheduleRefresh);
})();
