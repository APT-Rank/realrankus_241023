/**
 * ==========================================================================
 * realcrew_route.js
 * 임장코스 자동 생성(최고점 시작 + 도보 최소거리) 및 도보 경로/거리/시간 계산
 * ==========================================================================
 */
(function (global) {
  "use strict";

  var WALKING_SPEED_M_PER_MIN = 67;  // 약 4.0 km/h
  var DRIVING_SPEED_M_PER_MIN = 417; // 도심 평균 약 25 km/h
  var FOOT_DETOUR_FACTOR = 1.25;     // 도보 직선거리 보정 계수
  var DRIVE_DETOUR_FACTOR = 1.35;    // 차량 직선거리 보정 계수
  var CAR_THRESHOLD_METERS = 600;
  var segmentCache = Object.create(null);

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  function haversineMeters(lat1, lng1, lat2, lng2) {
    var R = 6371000;
    var dLat = deg2rad(lat2 - lat1);
    var dLng = deg2rad(lng2 - lng1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function estimateFallbackSegment(fromCpx, toCpx, profile) {
    var isDrive = profile === "driving";
    var straight = haversineMeters(fromCpx.lat, fromCpx.lng, toCpx.lat, toCpx.lng);
    var dist = Math.max(10, Math.round(straight * (isDrive ? DRIVE_DETOUR_FACTOR : FOOT_DETOUR_FACTOR)));
    var mins = isDrive
      ? Math.max(2, Math.round(dist / DRIVING_SPEED_M_PER_MIN))
      : Math.max(1, Math.round(dist / WALKING_SPEED_M_PER_MIN));
    return {
      fromCode: fromCpx.code,
      toCode: toCpx.code,
      profile: isDrive ? "driving" : "foot",
      isCar: isDrive,
      distanceMeters: dist,
      durationMinutes: mins,
      displayMinutes: mins,
      path: [
        { lat: fromCpx.lat, lng: fromCpx.lng },
        { lat: toCpx.lat, lng: toCpx.lng }
      ],
      source: "estimate"
    };
  }

  /**
   * 사각박스 내 모든 단지로 자동 임장코스 생성 (최대 단지 수 제한 없음):
   * 1) 리얼랭커스 점수가 가장 높은 단지를 시작점(1번)으로 선정
   * 2) 현재 단지에서 도보 최소거리인 미방문 단지를 순차적으로 연결 (Nearest Neighbor)
   */
  function buildAutoCourse(candidates) {
    if (!candidates || candidates.length === 0) {
      return { course: [], totalInBox: 0, truncated: false };
    }

    var sortedByScore = candidates.slice().sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name, "ko");
    });

    var totalInBox = sortedByScore.length;
    var pool = sortedByScore;

    // 1번: 최고 점수 단지
    var course = [pool[0]];
    var remaining = pool.slice(1);

    while (remaining.length > 0) {
      var current = course[course.length - 1];
      var bestIdx = 0;
      var bestDist = Infinity;

      for (var i = 0; i < remaining.length; i++) {
        var d = haversineMeters(current.lat, current.lng, remaining[i].lat, remaining[i].lng);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }

      course.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    }

    return {
      course: course,
      totalInBox: totalInBox,
      truncated: false
    };
  }

  function getSegmentCacheKey(fromCpx, toCpx, profile) {
    return (profile || "foot") + ":" + fromCpx.code + "->" + toCpx.code;
  }

  function resolveSegmentProfile(fromCpx, toCpx, carOver600) {
    if (!carOver600) return "foot";
    // 이미 캐시된 도보 거리가 있으면 그것을 기준으로, 없으면 직선 보정 도보 거리 기준으로 600m 판별
    var footCached = segmentCache[getSegmentCacheKey(fromCpx, toCpx, "foot")];
    var refDist = footCached
      ? footCached.distanceMeters
      : haversineMeters(fromCpx.lat, fromCpx.lng, toCpx.lat, toCpx.lng) * FOOT_DETOUR_FACTOR;
    return refDist >= CAR_THRESHOLD_METERS ? "driving" : "foot";
  }

  // 2026-11-22: 진행 중인 OSRM 경로 탐색 요청 일괄 취소(AbortController + jobId) 및 대기 타이머 관리
  var activeJobId = 0;
  var activeControllers = [];
  var activeTimers = [];

  function registerTimer(id) {
    activeTimers.push(id);
    return id;
  }

  function clearAllActiveTimers() {
    for (var i = 0; i < activeTimers.length; i++) {
      clearTimeout(activeTimers[i]);
    }
    activeTimers = [];
  }

  function cancelActiveRequests() {
    activeJobId += 1;
    clearAllActiveTimers();
    for (var i = 0; i < activeControllers.length; i++) {
      try { activeControllers[i].abort(); } catch (e) {}
    }
    activeControllers = [];
  }

  function getCachedOrReversedFootSegment(fromCpx, toCpx, routeProfile) {
    var key = getSegmentCacheKey(fromCpx, toCpx, routeProfile);
    if (segmentCache[key]) return segmentCache[key];

    // 2026-11-22: 도보(foot) 경로는 역방향(B->A) 캐시가 있으면 path를 뒤집어 0ms 즉시 재사용
    if (routeProfile === "foot") {
      var revKey = getSegmentCacheKey(toCpx, fromCpx, routeProfile);
      var revSeg = segmentCache[revKey];
      if (revSeg && Array.isArray(revSeg.path) && revSeg.path.length >= 2) {
        var reversed = {
          fromCode: fromCpx.code,
          toCode: toCpx.code,
          profile: routeProfile,
          isCar: false,
          distanceMeters: revSeg.distanceMeters,
          durationMinutes: revSeg.durationMinutes,
          displayMinutes: revSeg.displayMinutes,
          path: revSeg.path.slice().reverse(),
          source: revSeg.source
        };
        segmentCache[key] = reversed;
        return reversed;
      }
    }
    return null;
  }

  function fetchOsrmFromEndpoint(baseUrl, fromCpx, toCpx, routeProfile, straight, timeoutMs, jobId) {
    if (jobId !== activeJobId) {
      return Promise.reject(new Error("ABORTED"));
    }
    var isDrive = routeProfile === "driving";
    var url =
      baseUrl +
      fromCpx.lng + "," + fromCpx.lat + ";" +
      toCpx.lng + "," + toCpx.lat +
      "?overview=full&geometries=geojson";

    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    if (controller) activeControllers.push(controller);
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs) : null;

    function cleanup() {
      if (timer) clearTimeout(timer);
      if (controller) {
        var idx = activeControllers.indexOf(controller);
        if (idx !== -1) activeControllers.splice(idx, 1);
      }
    }

    return fetch(url, controller ? { signal: controller.signal } : undefined)
      .then(function (res) {
        cleanup();
        if (jobId !== activeJobId) throw new Error("ABORTED");
        if (!res.ok) throw new Error("OSRM HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        if (jobId !== activeJobId) throw new Error("ABORTED");
        if (!json || json.code !== "Ok" || !json.routes || !json.routes.length) {
          throw new Error("OSRM NoRoute");
        }
        var route = json.routes[0];
        var distMeters = Math.max(10, Math.round(route.distance || 0));

        // 호수·하천·고가도로 우회 경로를 최대한 살리되, 명백한 데이터 오류(5~6배 초과)만 차단
        var maxDetourRatio = isDrive ? 6.0 : 5.0;
        var minStraightCheck = isDrive ? 250 : 150;
        if (straight >= minStraightCheck && distMeters > straight * maxDetourRatio) {
          throw new Error("OSRM ExtremeDetour");
        }

        var coords = route.geometry && route.geometry.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) {
          throw new Error("OSRM EmptyGeometry");
        }

        var path = [{ lat: fromCpx.lat, lng: fromCpx.lng }];
        for (var i = 0; i < coords.length; i++) {
          path.push({ lat: coords[i][1], lng: coords[i][0] });
        }
        path.push({ lat: toCpx.lat, lng: toCpx.lng });

        var mins;
        if (isDrive) {
          mins = route.duration
            ? Math.max(2, Math.round((route.duration / 60) * 1.25))
            : Math.max(2, Math.round(distMeters / DRIVING_SPEED_M_PER_MIN));
        } else {
          mins = Math.max(1, Math.round(distMeters / WALKING_SPEED_M_PER_MIN));
        }

        return {
          fromCode: fromCpx.code,
          toCode: toCpx.code,
          profile: routeProfile,
          isCar: isDrive,
          distanceMeters: distMeters,
          durationMinutes: mins,
          displayMinutes: mins,
          path: path,
          source: "osrm"
        };
      })
      .catch(function (err) {
        cleanup();
        throw err;
      });
  }

  // 2026-11-22: Valhalla Polyline6(1e6 정밀도) 디코더
  function decodePolyline6(str) {
    var index = 0;
    var lat = 0;
    var lng = 0;
    var coords = [];
    var len = str ? str.length : 0;
    while (index < len) {
      var b;
      var shift = 0;
      var result = 0;
      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lat += (result & 1) ? ~(result >> 1) : (result >> 1);

      shift = 0;
      result = 0;
      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lng += (result & 1) ? ~(result >> 1) : (result >> 1);

      coords.push({ lat: lat / 1e6, lng: lng / 1e6 });
    }
    return coords;
  }

  // 2026-11-22: FOSSGIS Valhalla 보행자(pedestrian)/차량(auto) 라우팅 엔진 (전국 지원, OSRM 장애 시에도 안정 응답)
  function fetchValhallaSegment(fromCpx, toCpx, routeProfile, straight, timeoutMs, jobId) {
    if (jobId !== activeJobId) {
      return Promise.reject(new Error("ABORTED"));
    }
    var isDrive = routeProfile === "driving";
    var payload = {
      locations: [
        { lat: fromCpx.lat, lon: fromCpx.lng },
        { lat: toCpx.lat, lon: toCpx.lng }
      ],
      costing: isDrive ? "auto" : "pedestrian",
      units: "kilometers"
    };
    var url = "https://valhalla1.openstreetmap.de/route?json=" + encodeURIComponent(JSON.stringify(payload));

    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    if (controller) activeControllers.push(controller);
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs) : null;

    function cleanup() {
      if (timer) clearTimeout(timer);
      if (controller) {
        var idx = activeControllers.indexOf(controller);
        if (idx !== -1) activeControllers.splice(idx, 1);
      }
    }

    return fetch(url, controller ? { signal: controller.signal } : undefined)
      .then(function (res) {
        cleanup();
        if (jobId !== activeJobId) throw new Error("ABORTED");
        if (!res.ok) throw new Error("VALHALLA HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        if (jobId !== activeJobId) throw new Error("ABORTED");
        var leg = json && json.trip && json.trip.legs && json.trip.legs[0];
        if (!leg || !leg.shape || !leg.summary) {
          throw new Error("VALHALLA NoRoute");
        }
        var distMeters = Math.max(10, Math.round((leg.summary.length || 0) * 1000));
        var maxDetourRatio = isDrive ? 6.0 : 5.0;
        var minStraightCheck = isDrive ? 250 : 150;
        if (straight >= minStraightCheck && distMeters > straight * maxDetourRatio) {
          throw new Error("VALHALLA ExtremeDetour");
        }

        var decoded = decodePolyline6(leg.shape);
        if (!decoded || decoded.length < 2) {
          throw new Error("VALHALLA EmptyGeometry");
        }

        var path = [{ lat: fromCpx.lat, lng: fromCpx.lng }];
        for (var i = 0; i < decoded.length; i++) {
          path.push(decoded[i]);
        }
        path.push({ lat: toCpx.lat, lng: toCpx.lng });

        var mins;
        if (isDrive) {
          mins = leg.summary.time
            ? Math.max(2, Math.round((leg.summary.time / 60) * 1.25))
            : Math.max(2, Math.round(distMeters / DRIVING_SPEED_M_PER_MIN));
        } else {
          mins = Math.max(1, Math.round(distMeters / WALKING_SPEED_M_PER_MIN));
        }

        return {
          fromCode: fromCpx.code,
          toCode: toCpx.code,
          profile: routeProfile,
          isCar: isDrive,
          distanceMeters: distMeters,
          durationMinutes: mins,
          displayMinutes: mins,
          path: path,
          source: "osrm"
        };
      })
      .catch(function (err) {
        cleanup();
        throw err;
      });
  }

  function fetchOsrmSegment(fromCpx, toCpx, profile, retryCount, jobId) {
    if (jobId !== activeJobId) {
      return Promise.resolve(null);
    }
    var routeProfile = profile === "driving" ? "driving" : "foot";
    var isDrive = routeProfile === "driving";
    var attempt = retryCount || 0;
    var key = getSegmentCacheKey(fromCpx, toCpx, routeProfile);
    var cached = getCachedOrReversedFootSegment(fromCpx, toCpx, routeProfile);
    if (cached) {
      return Promise.resolve(cached);
    }

    var fallback = estimateFallbackSegment(fromCpx, toCpx, routeProfile);
    var straight = haversineMeters(fromCpx.lat, fromCpx.lng, toCpx.lat, toCpx.lng);
    var osrmPrimaryUrl = isDrive
      ? "https://router.project-osrm.org/route/v1/driving/"
      : "https://routing.openstreetmap.de/routed-foot/route/v1/foot/";
    var osrmSecondaryUrl = isDrive
      ? "https://routing.openstreetmap.de/routed-car/route/v1/driving/"
      : "https://router.project-osrm.org/route/v1/foot/";

    // 1차: Valhalla (보행자/차량 전국 실도로 안정 응답) -> 2차: OSRM Primary -> 3차: OSRM Secondary -> 4차: 추정 폴백
    return fetchValhallaSegment(fromCpx, toCpx, routeProfile, straight, 6500, jobId)
      .then(function (result) {
        if (jobId !== activeJobId) return null;
        segmentCache[key] = result;
        return result;
      })
      .catch(function (err) {
        if (jobId !== activeJobId || (err && (err.name === "AbortError" || err.message === "ABORTED"))) {
          return null;
        }
        if (attempt < 1) {
          return new Promise(function (resolve) {
            registerTimer(setTimeout(function () {
              if (jobId !== activeJobId) {
                resolve(null);
                return;
              }
              resolve(fetchOsrmSegment(fromCpx, toCpx, routeProfile, attempt + 1, jobId));
            }, 350));
          });
        }
        return fetchOsrmFromEndpoint(osrmPrimaryUrl, fromCpx, toCpx, routeProfile, straight, 5500, jobId)
          .then(function (osrmRes) {
            if (jobId !== activeJobId) return null;
            segmentCache[key] = osrmRes;
            return osrmRes;
          })
          .catch(function (err2) {
            if (jobId !== activeJobId || (err2 && (err2.name === "AbortError" || err2.message === "ABORTED"))) {
              return null;
            }
            return fetchOsrmFromEndpoint(osrmSecondaryUrl, fromCpx, toCpx, routeProfile, straight, 5000, jobId)
              .then(function (backupResult) {
                if (jobId !== activeJobId) return null;
                segmentCache[key] = backupResult;
                return backupResult;
              })
              .catch(function () {
                if (jobId !== activeJobId) return null;
                return fallback;
              });
          });
      });
  }

  function countUncachedSegments(courseList, options) {
    var carOver600 = !!(options && options.carOver600);
    var uncached = 0;
    for (var i = 0; i < courseList.length - 1; i++) {
      var profile = resolveSegmentProfile(courseList[i], courseList[i + 1], carOver600);
      if (!getCachedOrReversedFootSegment(courseList[i], courseList[i + 1], profile)) uncached += 1;
    }
    return uncached;
  }

  /**
   * 즉시 추정 세그먼트 배열 반환 (화면 깜빡임 없는 즉각 렌더링용)
   */
  function computeInstantSegments(courseList, options) {
    var carOver600 = !!(options && options.carOver600);
    var segments = [];
    for (var i = 0; i < courseList.length - 1; i++) {
      var profile = resolveSegmentProfile(courseList[i], courseList[i + 1], carOver600);
      var cached = getCachedOrReversedFootSegment(courseList[i], courseList[i + 1], profile);
      if (cached) {
        segments.push(cached);
      } else {
        segments.push(estimateFallbackSegment(courseList[i], courseList[i + 1], profile));
      }
    }
    return segments;
  }

  /**
   * 실제 도보(foot) 또는 차량(driving) 경로(OSRM) 비동기 보강
   * 새 탐색 시작 시 이전 미완료 요청을 즉시 취소(abort)하여 429 지연/충돌을 원천 방지
   */
  function fetchDetailedSegments(courseList, options, onProgress) {
    cancelActiveRequests();
    var myJobId = activeJobId;
    var carOver600 = !!(options && options.carOver600);
    var total = Math.max(0, courseList.length - 1);
    if (total === 0) return Promise.resolve([]);

    var results = computeInstantSegments(courseList, options);
    var nextIndex = 0;
    var completed = 0;
    var CONCURRENCY = 2;

    function runWorker() {
      if (myJobId !== activeJobId || nextIndex >= total) return Promise.resolve();
      var idx = nextIndex++;
      var fromCpx = courseList[idx];
      var toCpx = courseList[idx + 1];
      var profile = resolveSegmentProfile(fromCpx, toCpx, carOver600);
      var wasCached = !!getCachedOrReversedFootSegment(fromCpx, toCpx, profile);

      return fetchOsrmSegment(fromCpx, toCpx, profile, 0, myJobId).then(function (segResult) {
        if (myJobId !== activeJobId || !segResult) return;
        results[idx] = segResult;
        completed += 1;
        if (typeof onProgress === "function") {
          onProgress(results.slice(), completed, total);
        }
        if (wasCached || nextIndex >= total) {
          return runWorker();
        }
        return new Promise(function (resolve) {
          registerTimer(setTimeout(function () {
            if (myJobId !== activeJobId) {
              resolve();
              return;
            }
            resolve(runWorker());
          }, 120));
        });
      });
    }

    var workers = [];
    var workerCount = Math.min(CONCURRENCY, total);
    for (var w = 0; w < workerCount; w++) {
      workers.push(runWorker());
    }

    return Promise.all(workers).then(function () {
      return results;
    });
  }

  function formatDistance(meters) {
    if (!meters || meters <= 0) return "0m";
    if (meters < 1000) return Math.round(meters) + "m";
    return (meters / 1000).toFixed(2).replace(/\.?0+$/, "") + "km";
  }

  function formatDuration(totalMinutes) {
    var mins = Math.max(0, Math.round(totalMinutes || 0));
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    if (h === 0) return m + "분";
    if (m === 0) return h + "시간";
    return h + "시간 " + m + "분";
  }

  /**
   * 숫자를 원문자(①~㊿)로 변환 (50 초과는 숫자 그대로 반환)
   */
  function formatCircledNumber(num) {
    var n = Math.floor(Number(num));
    if (!isFinite(n) || n < 1) return "";
    if (n <= 20) return String.fromCharCode(0x2460 + (n - 1)); // ①~⑳
    if (n <= 35) return String.fromCharCode(0x3251 + (n - 21)); // ㉑~㉟
    if (n <= 50) return String.fromCharCode(0x32B1 + (n - 36)); // ㊱~㊿
    return String(n);
  }

  global.RealCrewRoute = {
    haversineMeters: haversineMeters,
    buildAutoCourse: buildAutoCourse,
    countUncachedSegments: countUncachedSegments,
    computeInstantSegments: computeInstantSegments,
    fetchDetailedSegments: fetchDetailedSegments,
    cancelActiveRequests: cancelActiveRequests,
    formatDistance: formatDistance,
    formatDuration: formatDuration,
    formatCircledNumber: formatCircledNumber
  };
})(window);
