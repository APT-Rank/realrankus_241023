/**
 * report_generator_engine.js
 * 리얼랭커스 실시간 맞춤형 부동산 추천 리포트 생성 백그라운드 엔진 (Step 3)
 */

(function (window, $) {
  'use strict';

  // 전역 상태 관리
  window.reportEngineState = {
    isRunning: false,
    currentDbKey: null,
    percent: 0,
    stepText: '',
    detailLog: '',
    reportData: null,
    error: null,
  };

  /**
   * 점수 기반 등급 환산 함수
   */
  function setGrade_overide(score) {
    var s = Number(score) || 0;
    if (s >= 87.9769) return 'S+';
    if (s >= 78.6962) return 'S';
    if (s >= 68.6018) return 'A+';
    if (s >= 62.3136) return 'A';
    if (s >= 53.3691) return 'A-';
    if (s >= 46.7447) return 'B+';
    if (s >= 38.6711) return 'B';
    if (s >= 31.9721) return 'B-';
    if (s >= 25.5973) return 'C+';
    if (s >= 17.8501) return 'C';
    return 'C-';
  }

  /**
   * 202107 최고점 대비 예상도달가격 산출
   */
  function getTargetPrice(date_array, price_array, compare_price) {
    if (!Array.isArray(date_array) || !Array.isArray(price_array)) {
      return compare_price || 0;
    }
    var targetDate = '202107';
    var date_index = date_array.indexOf(targetDate);
    if (date_index === -1) {
      return compare_price || 0;
    }
    var target_price_temp = price_array[date_index];
    if (!target_price_temp || target_price_temp === 0) {
      return 0;
    }
    return target_price_temp >= compare_price ? target_price_temp : compare_price;
  }

  /**
   * 위도/경도 기반 직선거리(km) 계산 (하버사인)
   */
  function getDistanceKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // 지구 반경 km
    var dLat = ((lat2 - lat1) * Math.PI) / 180;
    var dLon = ((lon2 - lon1) * Math.PI) / 180;
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Progress UI 갱신 함수
   */
  function updateProgressUI(percent, stepText, detailLog) {
    window.reportEngineState.percent = percent;
    window.reportEngineState.stepText = stepText;
    window.reportEngineState.detailLog = detailLog;

    // 1. 모달 내부 게이지 & 문구 업데이트
    $('#rpmProgressBar').css('width', percent + '%').attr('aria-valuenow', percent);
    $('#rpmPercentText').text(percent + '%');
    $('#rpmStepText').text(stepText);
    $('#rpmDetailLog').html('<i class="fa-solid fa-spinner fa-spin me-1"></i> ' + detailLog);

    // 2. 상단 플로팅 뱃지 업데이트
    $('#reportFloatingProgress').show();
    $('#rfpSpinner').show();
    $('#rfpCheck').hide();
    $('#rfpText').text('리포트 생성 중... ' + percent + '%');

    // 100% 완료 상태 처리
    if (percent >= 100) {
      $('#rpmProgressBar')
        .removeClass('progress-bar-animated progress-bar-striped bg-danger')
        .addClass('bg-success');
      $('#rpmStepText').html('<span class="text-success"><i class="fa-solid fa-circle-check"></i> ' + stepText + '</span>');
      $('#rpmDetailLog').html('<i class="fa-solid fa-circle-check text-success me-1"></i> ' + detailLog);
      $('#rpmBackgroundBtn').hide();
      $('#rpmCompleteBtn').show();

      $('#rfpSpinner').hide();
      $('#rfpCheck').show();
      $('#rfpText').text('리포트 완성! 확인하기');
      $('#reportFloatingProgress').addClass('report-floating-badge-complete');
    }
  }

  /**
   * 모달 열기/닫기 제어
   */
  window.openReportProgressModal = function () {
    var modalEl = document.getElementById('reportProgressModal');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      var modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modalInstance.show();
    } else {
      $('#reportProgressModal').modal('show');
    }
  };

  window.closeReportProgressModal = function () {
    var modalEl = document.getElementById('reportProgressModal');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      var modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    } else {
      $('#reportProgressModal').modal('hide');
    }
  };

  /**
   * RTDB에서 주문 데이터 불러오기
   */
  async function fetchOrderData(dbKey) {
    if (window.lastReportOrderData && window.lastReportOrderData.dbKey === dbKey) {
      return window.lastReportOrderData;
    }

    var cleanKey = dbKey.startsWith('/') ? dbKey.substring(1) : dbKey;

    // 1. requestReport_db에서 시도
    if (typeof requestReport_db !== 'undefined' && requestReport_db.database) {
      try {
        var snap = await requestReport_db.database().ref(cleanKey).once('value');
        if (snap.exists() && snap.val()) {
          return snap.val();
        }
      } catch (e) {
        console.warn('requestReport_db 조회 실패, 기본 DB로 폴백:', e);
      }
    }

    // 2. 기본 firebase database에서 시도
    if (typeof firebase !== 'undefined' && firebase.database) {
      try {
        var snap2 = await firebase.database().ref(cleanKey).once('value');
        if (snap2.exists() && snap2.val()) {
          return snap2.val();
        }
      } catch (e2) {
        console.warn('기본 firebase DB 조회 실패:', e2);
      }
    }

    // 3. 임시 로컬 캐시 확인
    var cached = localStorage.getItem('last_report_order_' + cleanKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e3) {}
    }

    throw new Error('주문 데이터 (' + dbKey + ')를 찾을 수 없습니다.');
  }

  /**
   * 지역별 아파트 데이터 JSON 다운로드
   */
  async function fetchRegionData(regionCode, preferredMonth) {
    var monthsToTry = [preferredMonth, '202607', '202606', '202605'];
    for (var i = 0; i < monthsToTry.length; i++) {
      var m = monthsToTry[i];
      if (!m) continue;
      var url = 'https://www.realrankus.com/' + m + '/' + regionCode + '.json';
      try {
        var res = await fetch(url);
        if (res.ok) {
          var json = await res.json();
          if (json && Array.isArray(json.data) && json.data.length > 0) {
            return json.data.map(function (item) {
              item.subRegion = regionCode;
              return item;
            });
          }
        }
      } catch (err) {
        console.warn(`${url} 로드 실패:`, err);
      }
    }
    return [];
  }

  /**
   * 카카오 모빌리티 이동시간 단건 조회
   */
  async function fetchKakaoDrivingDuration(startX, startY, destX, destY, departureTime) {
    var kakaoKey = 'a9beb4e1299d7fac7e38fdecb8f8038e';
    var url =
      'https://apis-navi.kakaomobility.com/v1/future/directions?origin=' +
      startX +
      ',' +
      startY +
      '&destination=' +
      destX +
      ',' +
      destY +
      '&priority=RECOMMEND&summary=TRUE&departure_time=' +
      departureTime;

    try {
      var res = await fetch(url, {
        headers: {
          Authorization: 'KakaoAK ' + kakaoKey,
        },
      });
      if (res.ok) {
        var data = await res.json();
        if (data && data.routes && data.routes[0] && data.routes[0].summary) {
          return data.routes[0].summary.duration; // 초 단위
        }
      }
    } catch (e) {
      console.warn('카카오 모빌리티 API 호출 실패:', e);
    }
    return null;
  }

  /**
   * [핵심] 백그라운드 리포트 생성 메인 실행 함수
   */
  window.startBackgroundReportGenerator = async function (
    dbKey,
    onProgress,
    onComplete,
    onError
  ) {
    if (window.reportEngineState.isRunning) {
      console.warn('이미 리포트 생성이 진행 중입니다.');
      openReportProgressModal();
      return;
    }

    window.reportEngineState.isRunning = true;
    window.reportEngineState.currentDbKey = dbKey;
    window.reportEngineState.error = null;

    // 모달 초기 상태 리셋 & 오픈
    $('#rpmProgressBar')
      .removeClass('bg-success')
      .addClass('progress-bar-animated progress-bar-striped bg-danger');
    $('#rpmBackgroundBtn').show();
    $('#rpmCompleteBtn').hide();
    openReportProgressModal();

    function reportStep(percent, stepText, detailLog) {
      updateProgressUI(percent, stepText, detailLog);
      if (typeof onProgress === 'function') {
        onProgress(percent, stepText, detailLog);
      }
    }

    try {
      // =========================================================================
      // [1단계: 10%] 고객 맞춤 상담 정보 확인
      // =========================================================================
      reportStep(10, '고객 맞춤 상담 정보 확인 중... (10%)', '주문 정보 및 생애주기/예산 설정 데이터를 불러오고 있습니다.');
      var orderData = await fetchOrderData(dbKey);
      console.log('[Step 3 Engine] 주문 데이터 로드 완료:', orderData);

      var customerName = orderData.name_val || '고객';
      $('#rpmCustomerTitle').html(
        `<strong>${customerName}</strong>님의 입력 조건을 기반으로 1:1 맞춤형 보고서를 작성합니다.`
      );

      // =========================================================================
      // [2단계: 25%] 후보 지역 빅데이터 수집
      // =========================================================================
      reportStep(25, '후보 지역 아파트 실거래 빅데이터 수집 중... (25%)', '선택하신 관심 지역의 최신 실거래 및 가치평가 데이터를 병렬 다운로드합니다.');
      
      var targetMonth =
        typeof window.selectedMonth !== 'undefined' && window.selectedMonth
          ? window.selectedMonth
          : '202607';

      var wantedRegions = orderData.wanted_region || [];
      if (wantedRegions.length === 0) {
        // 기본값: 서울 강남구
        wantedRegions = [['Seoul', '1168000000_Seoul_Gangnam']];
      }

      var mergedList = [];
      for (var r = 0; r < wantedRegions.length; r++) {
        var rCode = wantedRegions[r][1];
        var rName = orderData.wanted_region_str ? orderData.wanted_region_str[r] : rCode;
        reportStep(
          25 + Math.round((r / wantedRegions.length) * 15),
          '후보 지역 아파트 실거래 빅데이터 수집 중...',
          `[${rName || rCode}] 지역 실거래 빅데이터 수집 중... (${r + 1}/${wantedRegions.length})`
        );
        var regData = await fetchRegionData(rCode, targetMonth);
        mergedList = mergedList.concat(regData);
      }

      // 중복 단지 제거 (검색코드 기준)
      var uniqueMap = {};
      var uniqueComplexes = [];
      for (var u = 0; u < mergedList.length; u++) {
        var code = mergedList[u]['검색코드'];
        if (code && !uniqueMap[code]) {
          uniqueMap[code] = true;
          uniqueComplexes.push(mergedList[u]);
        }
      }

      if (uniqueComplexes.length === 0) {
        throw new Error('선택하신 지역에서 분석 가능한 단지 데이터를 찾을 수 없습니다.');
      }
      console.log(`[Step 3 Engine] 수집된 고유 단지 수: ${uniqueComplexes.length}개`);

      // =========================================================================
      // [3단계: 45%] 예산 및 4대 가치 가중치 필터링 & 정렬
      // =========================================================================
      reportStep(45, '예산 및 우선순위 알고리즘 단지 필터링 중... (45%)', '가용 예산 범위(현금+대출)와 주거·교통·인프라·교육 가중치를 분석합니다.');

      var budgetCash = Number(orderData.budget_cash) || 0;
      var budgetLoan = Number(orderData.budget_loan) || 0;
      var totalBudgetManwon = (budgetCash + budgetLoan) / 10000; // 만원 단위 (예: 12억 -> 120000)

      var minBudget = totalBudgetManwon * 0.7;
      var maxBudget = totalBudgetManwon * 1.2;

      // 예산 필터링 함수
      function filterByBudget(complexes, minB, maxB) {
        var result = [];
        for (var i = 0; i < complexes.length; i++) {
          var item = complexes[i];
          var areaArray = (item['area_info'] || '').split(',');
          var salesInfoArray = (item['sales_info'] || '').split(',');
          var priceHistoryArray = item['sales_history_price'] || [];
          var salesMonthArray = item['매매실거래날짜목록'] || [];

          var possibleSales = [];
          for (var j = 0; j < priceHistoryArray.length; j++) {
            var prices = priceHistoryArray[j];
            if (!Array.isArray(prices) || prices.length === 0) continue;
            var comparePrice = prices[prices.length - 1]; // 최근 실거래가
            if (comparePrice && comparePrice >= minB && comparePrice <= maxB) {
              var targetPrice = getTargetPrice(salesMonthArray, prices, comparePrice);
              possibleSales.push([
                areaArray[j] || '',
                salesInfoArray[j] || '',
                prices,
                comparePrice,
                targetPrice,
              ]);
            }
          }

          if (possibleSales.length > 0) {
            item.possible = possibleSales;
            result.push(item);
          }
        }
        return result;
      }

      var filteredByBudget = filterByBudget(uniqueComplexes, minBudget, maxBudget);

      // 만약 70%~120% 범위 내 단지가 3개 미만이면 50%~150%로 완화
      if (filteredByBudget.length < 3) {
        console.log('예산 범위 완화 (0.5 ~ 1.5배)');
        filteredByBudget = filterByBudget(uniqueComplexes, totalBudgetManwon * 0.5, totalBudgetManwon * 1.5);
      }
      // 그래도 없으면 전체 단지 중 최근 거래가 있는 단지 전체 활용
      if (filteredByBudget.length === 0) {
        filteredByBudget = filterByBudget(uniqueComplexes, 0, 9999999);
      }

      // 4대 가치 가중치 점수 (custom_value) 계산
      var pLiving = Number(orderData.priority_living) || 100;
      var pTrans = Number(orderData.priority_trans) || 100;
      var pInfra = Number(orderData.priority_infra) || 100;
      var pEdu = Number(orderData.priority_edu) || 100;

      for (var f = 0; f < filteredByBudget.length; f++) {
        var comp = filteredByBudget[f];
        var transScore = comp['교통총점'] === 'NA' || !comp['교통총점'] ? 0 : Number(comp['교통총점']);
        var useTrans = comp['교통총점'] !== 'NA' && comp['교통총점'];

        var baseSum = Number(pLiving) + (useTrans ? Number(pTrans) : 0) + Number(pInfra) + Number(pEdu) || 1;
        var wLiving = Number(pLiving) / baseSum;
        var wTrans = useTrans ? Number(pTrans) / baseSum : 0;
        var wInfra = Number(pInfra) / baseSum;
        var wEdu = Number(pEdu) / baseSum;

        comp.custom_value =
          (Number(comp['주거총점']) || 0) * wLiving +
          transScore * wTrans +
          (Number(comp['인프라총점']) || 0) * wInfra +
          (Number(comp['학군총점']) || 0) * wEdu;
      }

      // custom_value 내림차순 정렬
      filteredByBudget.sort(function (a, b) {
        return (b.custom_value || 0) - (a.custom_value || 0);
      });

      console.log(`[Step 3 Engine] 가중치 정렬 완료. 상위 후보군 추출`);

      // =========================================================================
      // [4단계: 60%] 자주 가는 위치까지의 이동 시간 분석
      // =========================================================================
      reportStep(60, '자주 가는 위치까지의 이동 시간 분석 중... (60%)', '출퇴근 및 주요 목적지까지의 경로와 소요 시간을 계산합니다.');

      var favX = Number(orderData.fav_point_x) || 127.0473774;
      var favY = Number(orderData.fav_point_y) || 37.51733193;
      var transMethod = orderData.trans_method === 'driving' ? 'driving' : 'public';

      // 이동시간 계산 기준일: 다가오는 목요일 오전 07:50
      var today = new Date();
      var weekday = today.getDay();
      var dateDelta = weekday < 4 ? 4 - weekday : 4 + 7 - weekday;
      var depDate = new Date(today.getTime() + dateDelta * 24 * 60 * 60 * 1000);
      var depDateStr =
        depDate.getFullYear().toString() +
        String(depDate.getMonth() + 1).padStart(2, '0') +
        String(depDate.getDate()).padStart(2, '0') +
        '0750';

      // 상위 최대 15개 후보군에 대해 이동시간 산출
      var candidatePool = filteredByBudget.slice(0, 15);

      for (var cIdx = 0; cIdx < candidatePool.length; cIdx++) {
        var cItem = candidatePool[cIdx];
        var cX = Number(cItem.X);
        var cY = Number(cItem.Y);

        var durationSec = null;
        if (transMethod === 'driving') {
          durationSec = await fetchKakaoDrivingDuration(cX, cY, favX, favY, depDateStr);
        }

        // 카카오 API 응답이 없거나 대중교통인 경우 추정치 보정
        if (!durationSec) {
          var distKm = getDistanceKm(cY, cX, favY, favX);
          if (transMethod === 'driving') {
            // 시내 주행 평균 25km/h 가정
            durationSec = Math.round((distKm / 25) * 3600);
          } else {
            // 대중교통: 지하철/버스 환승 포함 직선거리 1km당 약 2.5분 + 도보 8분
            var minEst = Math.round(distKm * 2.5 + 8);
            durationSec = minEst * 60;
          }
        }

        // 한국어 표현 환산
        var durationHour = Math.floor(durationSec / 3600);
        var durationMin = Math.floor((durationSec % 3600) / 60);
        var timeKor = '';
        if (durationHour > 0) {
          timeKor = durationHour + '시간 ' + (durationMin > 0 ? durationMin + '분' : '');
        } else {
          timeKor = (durationMin > 0 ? durationMin : 5) + '분';
        }

        cItem.moving_method = transMethod;
        cItem.moving_time_kor = timeKor.trim();
        cItem.moving_time_val = durationSec;
      }

      // 최종 상위 10개 단지 확정
      var top10 = candidatePool.slice(0, 10);
      console.log(`[Step 3 Engine] 최종 추천 10개 단지 선정 완료:`, top10.map(t => t['아파트명']));

      // =========================================================================
      // [5단계: 75%] 상위 10개 단지 상세 스펙 분석 (complex_info)
      // =========================================================================
      reportStep(75, '상위 10개 추천 단지 상세 스펙 분석 중... (75%)', '단지별 학원가, 상권, 혐오시설, 커뮤니티 등 상세 인프라 데이터를 통합합니다.');

      if (typeof firebase !== 'undefined' && firebase.database) {
        var rtdb = firebase.database();
        var infoPromises = top10.map(function (c) {
          var cCode = c['검색코드'];
          var sReg = c.subRegion;
          return rtdb
            .ref('complex_info')
            .child(sReg)
            .child(cCode)
            .get()
            .then(function (snapshot) {
              if (snapshot.exists()) {
                c.complex_info_data = snapshot.val();
              } else {
                c.complex_info_data = null;
              }
            })
            .catch(function (err) {
              console.warn(`${c['아파트명']} complex_info 로드 실패:`, err);
              c.complex_info_data = null;
            });
        });
        await Promise.all(infoPromises);
      }

      // =========================================================================
      // [6단계: 90%] Gemini AI 맞춤형 종합 리포트 생성 (Cloud Functions)
      // =========================================================================
      reportStep(90, 'Gemini AI 수석 멘토 맞춤형 종합 리포트 생성 중... (90%)', 'Google Gemini AI가 고객님의 생애주기 맞춤형 총평과 단지별 브리핑을 집필합니다.');

      var todayStr = new Date().toISOString().slice(0, 10);
      var ageDesList = [
        '사회초년, 결혼준비',
        '신혼, 자녀출산',
        '커리어상승, 자녀양육',
        '커리어최고, 자녀학령',
        '관리/임원급, 자녀성년',
        '커리어하강/은퇴, 자녀독립',
        '노후, 후대양성',
      ];
      var ageIdx = Number(orderData.age_val) || 2;
      var ageDes = ageDesList[ageIdx] || '생애주기 전환기';

      var customerInfoPromptText = `${customerName}님은 ${todayStr} 현재,\n`;
      customerInfoPromptText += `${orderData.age_txt || '30대'}의 연령으로 생애주기에서 '${ageDes}기'를 지나고 있습니다.\n\n`;
      customerInfoPromptText += `가족 구성은 총 ${orderData.family_txt || '3인'}으로 자녀는 ${orderData.children_txt || '1명'}이고, ${orderData.children_type_txt || '영유아/미취학'}이네요.\n`;
      customerInfoPromptText += `가족의 평균 연소득은 ${orderData.income_txt || '7천만~1억원'}으로 가정 경제를 운영하고 계십니다.`;

      var aiResult = {
        userGuide: '',
        complexAnalyses: [],
      };

      try {
        var functionsInstance = firebase.app().functions('asia-northeast3');
        var generateAIFn = functionsInstance.httpsCallable('generateReportAI');

        var aiResponse = await generateAIFn({
          customerInfo: customerInfoPromptText,
          customerName: customerName,
          complexList: top10,
        });

        if (aiResponse.data && aiResponse.data.success) {
          aiResult.userGuide = aiResponse.data.userGuide || '';
          aiResult.complexAnalyses = aiResponse.data.complexAnalyses || [];
          console.log('[Step 3 Engine] Gemini AI 생성 응답 수신 성공:', aiResult);
        }
      } catch (aiErr) {
        console.warn('Gemini AI Cloud Function 호출 중 오류 발생, 고품질 폴백 생성:', aiErr);
        aiResult.userGuide = `${customerName}님의 생애주기(${ageDes}기)와 예산(${totalBudgetManwon.toLocaleString()}만원)에 최적화된 상위 10개 단지 추천 리포트입니다.`;
        aiResult.complexAnalyses = top10.map(function (c) {
          return {
            name: c['아파트명'],
            analysis: `${c['아파트명']} 1:1 맞춤 분석|||가용 예산 내에서 우수한 입지 가치와 거주 만족도를 누릴 수 있는 단지입니다.|||<ul><li>우수한 가치 총점 (${Number(c['가치 총점']).toFixed(1)}점)</li><li>안정적인 대단지 환경</li></ul>|||<ul><li>주변 호재 및 실거래 추이 모니터링 권장</li></ul>`,
          };
        });
      }

      // =========================================================================
      // [7단계: 100%] 리포트 데이터 구성 완료 및 RTDB 보관
      // =========================================================================
      reportStep(100, '리포트 완성! (100%)', '🎉 고객님만을 위한 1:1 맞춤형 부동산 추천 리포트가 성공적으로 완성되었습니다.');

      // 각 단지별 등급 및 분석 데이터 바인딩
      for (var k = 0; k < top10.length; k++) {
        top10[k].grade = setGrade_overide(top10[k]['가치 총점']);
        top10[k].custom_grade = setGrade_overide(top10[k].custom_value);
        if (aiResult.complexAnalyses[k]) {
          top10[k].ai_analysis = aiResult.complexAnalyses[k].analysis;
        }
      }

      var finalReportData = {
        orderId: orderData.orderId || dbKey,
        dbKey: dbKey,
        customerName: customerName,
        customerEmail: orderData.email_full || '',
        customerInfoText: customerInfoPromptText,
        todayStr: todayStr,
        orderData: orderData,
        top10: top10,
        userGuide: aiResult.userGuide,
        complexAnalyses: aiResult.complexAnalyses,
        generatedAt: new Date().toISOString(),
        status: 'Completed',
      };

      // 전역 상태에 저장
      window.lastGeneratedReportData = finalReportData;
      window.reportEngineState.reportData = finalReportData;
      window.reportEngineState.isRunning = false;

      // RTDB 상태 업데이트 (Completed)
      try {
        var cleanDbKey = dbKey.startsWith('/') ? dbKey.substring(1) : dbKey;
        var updatePayload = {
          progress: 'Completed',
          generatedAt: new Date().toISOString(),
          top10Names: top10.map(t => t['아파트명']),
        };

        if (typeof requestReport_db !== 'undefined' && requestReport_db.database) {
          requestReport_db.database().ref(cleanDbKey).update(updatePayload);
        }
        if (typeof firebase !== 'undefined' && firebase.database) {
          firebase.database().ref(cleanDbKey).update(updatePayload);
        }
      } catch (saveErr) {
        console.warn('RTDB 상태 갱신 경고:', saveErr);
      }

      if (typeof onComplete === 'function') {
        onComplete(finalReportData);
      }
    } catch (error) {
      console.error('[Step 3 Engine] 리포트 생성 실패:', error);
      window.reportEngineState.isRunning = false;
      window.reportEngineState.error = error;

      reportStep(
        window.reportEngineState.percent,
        '리포트 생성 오류 발생',
        '오류: ' + (error.message || '알 수 없는 오류가 발생했습니다.')
      );

      $('#rpmProgressBar')
        .removeClass('progress-bar-animated progress-bar-striped bg-success')
        .addClass('bg-secondary');

      if (typeof onError === 'function') {
        onError(error);
      }
    }
  };

  /**
   * 브라우저 콘솔에서 즉시 테스트할 수 있는 헬퍼 함수
   */
  window.testRunReportGenerator = function (customDbKey) {
    var key = customDbKey || 'RR_TEST_' + Date.now();
    var mockData = {
      orderId: key,
      dbKey: key,
      name_val: '테스트고객',
      email_full: 'test@realrankus.com',
      age_val: 2,
      age_txt: '30대',
      family_val: 3,
      family_txt: '3인',
      children_val: 1,
      children_txt: '1명',
      children_type_val: 1,
      children_type_txt: '영유아/미취학',
      income_val: 3,
      income_txt: '7천만~1억원',
      budget_cash: 800000000,
      budget_loan: 400000000,
      trans_method: 'public',
      fav_point_x: 127.0473774,
      fav_point_y: 37.51733193,
      fav_point_address: '서울 강남구 역삼동',
      wanted_region: [['Seoul', '1168000000_Seoul_Gangnam']],
      wanted_region_str: ['서울시 강남구'],
      priority_living: 100,
      priority_trans: 100,
      priority_infra: 100,
      priority_edu: 100,
      paid: true,
      progress: 'Paid',
    };

    window.lastReportOrderData = mockData;
    console.log('[Step 3 Test] 모의 주문 데이터로 백그라운드 리포트 생성 엔진을 가동합니다:', mockData);

    window.startBackgroundReportGenerator(
      key,
      function (p, s, d) {
        console.log(`[진행 ${p}%] ${s} - ${d}`);
      },
      function (res) {
        console.log('[테스트 완료! 생성된 리포트 데이터]:', res);
        alert('🎉 리포트 생성이 완료되었습니다! (콘솔 확인)');
      },
      function (err) {
        console.error('[테스트 에러]:', err);
        alert('리포트 생성 중 오류 발생: ' + err.message);
      }
    );
  };
})(window, jQuery);
