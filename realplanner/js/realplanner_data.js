/**
 * ==========================================================================
 * realcrew_data.js
 * 리얼랭커스 단지/지역 데이터 로더 및 등급·시세 정규화 모듈
 * ==========================================================================
 */
(function (global) {
  "use strict";

  var RealCrewData = {
    context: null,
    complexes: [],
    complexByCode: Object.create(null),
    gunguDetailCache: Object.create(null),
    gunguDetailPromises: Object.create(null),
    regions: {
      level0: [],
      level1: [],
      level2: []
    }
  };

  function getLaunchContext() {
    var ctx = null;
    try {
      var raw = sessionStorage.getItem("realplannerLaunchContext") || localStorage.getItem("realplannerLaunchContext");
      if (raw) ctx = JSON.parse(raw);
    } catch (e) {}

    var urlParams = new URLSearchParams(window.location.search);
    var embedded = urlParams.get("embedded") === "1";

    var defaultLat = parseFloat(localStorage.getItem("lastMapLat")) || 37.4979;
    var defaultLng = parseFloat(localStorage.getItem("lastMapLng")) || 127.0276;
    var defaultZoom = parseInt(localStorage.getItem("lastMapZoom"), 10) || 16;

    RealCrewData.context = {
      selectedMonth: (ctx && ctx.selectedMonth) || "202611",
      dbName: (ctx && ctx.dbName) || "202611_02",
      selectedRegion: (ctx && ctx.selectedRegion) || "Seoul",
      selectedSubRegion: (ctx && ctx.selectedSubRegion) || "",
      lat: (ctx && Number(ctx.lat)) || defaultLat,
      lng: (ctx && Number(ctx.lng)) || defaultLng,
      zoom: (ctx && Number(ctx.zoom)) || defaultZoom,
      loginStatus: !!(ctx && ctx.loginStatus),
      // 2026-11-22: 단지 상세 모달('현재 단지부터 답사 코스 만들기') 진입 시 출발 단지 컨텍스트 전달
      startComplex: (ctx && ctx.startComplex) || null,
      embedded: embedded,
      isMobile: embedded || window.innerWidth <= 820
    };
    return RealCrewData.context;
  }

  function computeGradeInfo(score, isLogin) {
    var grade = "C";
    if (isLogin) {
      if (score >= 87.9769) grade = "S+";
      else if (score >= 78.6962) grade = "S";
      else if (score >= 68.6018) grade = "A+";
      else if (score >= 62.3136) grade = "A";
      else if (score >= 53.3691) grade = "A-";
      else if (score >= 46.7447) grade = "B+";
      else if (score >= 38.6711) grade = "B";
      else if (score >= 31.9721) grade = "B-";
      else if (score >= 25.5973) grade = "C+";
      else if (score >= 17.8501) grade = "C";
      else grade = "C-";
    } else {
      if (score >= 78.6962) grade = "S";
      else if (score >= 53.3691) grade = "A";
      else if (score >= 31.9721) grade = "B";
      else grade = "C";
    }

    var color = "#ED8618";
    var gradeClass = "gradeC";
    if (score >= 78.6962) {
      color = "#a70000";
      gradeClass = "gradeS";
    } else if (score >= 53.3691) {
      color = "#F72020";
      gradeClass = "gradeA";
    } else if (score >= 31.9721) {
      color = "#F36637";
      gradeClass = "gradeB";
    }

    return {
      grade: grade,
      color: color,
      gradeClass: gradeClass
    };
  }

  function parseLastSales(rawSales) {
    if (!rawSales) {
      return { priceText: "정보없음", areaText: "--", isPresale: false };
    }
    if (rawSales === "BYG") {
      return { priceText: "분양", areaText: "", isPresale: true };
    }
    var parts = String(rawSales).split(",");
    var priceNum = Number(parts[1]);
    var areaRaw = (parts[2] || "--").trim();

    if (!parts[1] || isNaN(priceNum) || priceNum <= 0) {
      return { priceText: "정보없음", areaText: areaRaw, isPresale: false };
    }
    var eok = Math.round(priceNum / 100) / 100;
    return {
      priceText: eok + "억",
      areaText: areaRaw,
      isPresale: false
    };
  }

  function normalizeComplex(item, isLogin) {
    if (!item) return null;
    var lat = Number(item.lat);
    var lng = Number(item.lng);
    if (!isFinite(lat) || !isFinite(lng) || lat === 0 || lng === 0) return null;

    var code = String(item["검색코드"] || item.searchCode || "");
    if (!code) return null;

    var scoreRaw = Number(item["가치 총점"]);
    var score = isFinite(scoreRaw) ? Math.round(scoreRaw * 100) / 100 : 0;
    var gradeInfo = computeGradeInfo(score, isLogin);
    var salesInfo = parseLastSales(item["last_sales"]);

    return {
      code: code,
      name: item["아파트명"] || "단지명 없음",
      address: item["법정동주소"] || "",
      score: score,
      grade: gradeInfo.grade,
      gradeClass: gradeInfo.gradeClass,
      gradeColor: gradeInfo.color,
      lat: lat,
      lng: lng,
      priceText: salesInfo.priceText,
      areaText: salesInfo.areaText,
      isPresale: salesInfo.isPresale,
      sido: item.sido || "",
      gungu: item.gungu || "",
      raw: item
    };
  }

  function readFromIndexedDB(dbName) {
    return new Promise(function (resolve) {
      if (!window.indexedDB || !dbName) {
        resolve(null);
        return;
      }
      try {
        var req = indexedDB.open(dbName);
        req.onerror = function () { resolve(null); };
        req.onupgradeneeded = function () {
          // 기존 DB가 없으면 빈 DB 생성 방지
        };
        req.onsuccess = function () {
          var db = req.result;
          if (!db.objectStoreNames || !db.objectStoreNames.contains("complex")) {
            db.close();
            resolve(null);
            return;
          }
          try {
            var tx = db.transaction("complex", "readonly");
            var store = tx.objectStore("complex");
            var getAllReq = store.getAll();
            getAllReq.onsuccess = function () {
              var rows = getAllReq.result;
              db.close();
              resolve(Array.isArray(rows) && rows.length > 0 ? rows : null);
            };
            getAllReq.onerror = function () {
              db.close();
              resolve(null);
            };
          } catch (err) {
            db.close();
            resolve(null);
          }
        };
      } catch (e) {
        resolve(null);
      }
    });
  }

  function fetchJson(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
      return res.json();
    });
  }

  function loadAll() {
    var ctx = getLaunchContext();
    var month = ctx.selectedMonth;
    var searchingUrl = "../" + month + "/Searching_list.json";
    var regionUrl = "../" + month + "/region_map.json?v=2.0";

    var complexesPromise = readFromIndexedDB(ctx.dbName).then(function (rows) {
      if (rows && rows.length > 0) return rows;
      return fetchJson(searchingUrl).then(function (json) {
        return (json && json.data) ? json.data : [];
      });
    });

    var regionsPromise = fetchJson(regionUrl)
      .then(function (json) { return (json && json.data) ? json.data : []; })
      .catch(function () { return []; });

    return Promise.all([complexesPromise, regionsPromise]).then(function (results) {
      var rawList = results[0] || [];
      var rawRegions = results[1] || [];

      var normalized = [];
      var mapByCode = Object.create(null);

      for (var i = 0; i < rawList.length; i++) {
        var c = normalizeComplex(rawList[i], ctx.loginStatus);
        if (!c) continue;
        normalized.push(c);
        mapByCode[c.code] = c;
      }

      RealCrewData.complexes = normalized;
      RealCrewData.complexByCode = mapByCode;

      RealCrewData.regions.level0 = [];
      RealCrewData.regions.level1 = [];
      RealCrewData.regions.level2 = [];
      for (var r = 0; r < rawRegions.length; r++) {
        var reg = rawRegions[r];
        if (!reg) continue;
        if (reg.Level === "Level0") RealCrewData.regions.level0.push(reg);
        else if (reg.Level === "Level1") RealCrewData.regions.level1.push(reg);
        else if (reg.Level === "Level2") RealCrewData.regions.level2.push(reg);
      }

      return RealCrewData;
    });
  }

  function getComplexesInBounds(south, west, north, east) {
    var list = RealCrewData.complexes;
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.lat >= south && c.lat <= north && c.lng >= west && c.lng <= east) {
        out.push(c);
      }
    }
    return out;
  }

  function loadGunguDetails(gungu) {
    if (!gungu) return Promise.resolve(null);
    if (RealCrewData.gunguDetailCache[gungu]) {
      return Promise.resolve(RealCrewData.gunguDetailCache[gungu]);
    }
    if (RealCrewData.gunguDetailPromises[gungu]) {
      return RealCrewData.gunguDetailPromises[gungu];
    }

    var month = (RealCrewData.context && RealCrewData.context.selectedMonth) || "202611";
    var url = "../" + month + "/" + gungu + ".json";

    var p = fetchJson(url)
      .then(function (json) {
        var map = Object.create(null);
        var rows = (json && json.data) ? json.data : [];
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var code = String(row["검색코드"] || "");
          if (!code) continue;
          map[code] = {
            households: row["세대수"] != null ? Number(row["세대수"]) : null,
            builtDate: row["준공년월"] ? String(row["준공년월"]).trim() : "",
            builtYears: row["준공년차"] != null ? Number(row["준공년차"]) : null,
            fullData: row
          };
        }
        RealCrewData.gunguDetailCache[gungu] = map;
        return map;
      })
      .catch(function () {
        RealCrewData.gunguDetailCache[gungu] = Object.create(null);
        return RealCrewData.gunguDetailCache[gungu];
      });

    RealCrewData.gunguDetailPromises[gungu] = p;
    return p;
  }

  /**
   * 코스에 포함된 단지들의 세대수/준공일/년차 정보를 지역구 JSON에서 보강
   */
  function enrichCourseDetails(courseList) {
    if (!courseList || !courseList.length) return Promise.resolve(false);
    var gungus = Object.create(null);
    var needFetch = false;

    for (var i = 0; i < courseList.length; i++) {
      var c = courseList[i];
      if (!c || c.detailLoaded || !c.gungu) continue;
      gungus[c.gungu] = true;
      needFetch = true;
    }

    if (!needFetch) return Promise.resolve(false);

    var keys = Object.keys(gungus);
    return Promise.all(keys.map(loadGunguDetails)).then(function () {
      var updated = false;
      for (var i = 0; i < courseList.length; i++) {
        var c = courseList[i];
        if (!c || !c.gungu) continue;
        var gMap = RealCrewData.gunguDetailCache[c.gungu];
        if (gMap && gMap[c.code]) {
          c.households = gMap[c.code].households;
          c.builtDate = gMap[c.code].builtDate;
          c.builtYears = gMap[c.code].builtYears;
          c.fullData = gMap[c.code].fullData || null;
          c.detailLoaded = true;
          updated = true;
        }
      }
      return updated;
    });
  }

  RealCrewData.getLaunchContext = getLaunchContext;
  RealCrewData.loadAll = loadAll;
  RealCrewData.getComplexesInBounds = getComplexesInBounds;
  RealCrewData.enrichCourseDetails = enrichCourseDetails;

  global.RealCrewData = RealCrewData;
})(window);
