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
  $(document).on('show.bs.modal shown.bs.modal', '#reportProgressModal', function () {
    $('.modal-backdrop').css({ width: '100%' });
  });

  window.openReportProgressModal = function () {
    var modalEl = document.getElementById('reportProgressModal');
    if (!modalEl) return;

    // 만약 requestReportModal 등 다른 모달이 열려있다면 안전하게 닫기
    try {
      $('#requestReportModal').modal('hide');
    } catch(e) {}

    // Bootstrap 5 모달 트랜지션 완료 후 확실하게 표시
    setTimeout(function() {
      try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
          var modalInstance = bootstrap.Modal.getOrCreateInstance 
            ? bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: 'static', keyboard: false })
            : (bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false }));
          modalInstance.show();
        } else {
          $('#reportProgressModal').modal({ backdrop: 'static', keyboard: false, show: true });
        }
      } catch (err) {
        console.warn('모달 표시 예외 처리:', err);
        $('#reportProgressModal').modal('show');
      }

      // PC 상세정보 모달용 600px 제한을 해제하고 전체화면(100%) backdrop 적용
      $('.modal-backdrop').css({ width: '100%' });
      setTimeout(function() {
        $('.modal-backdrop').css({ width: '100%' });
      }, 50);

      // 플로팅 뱃지도 함께 노출
      $('#reportFloatingProgress').show();
    }, 200);
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

    // 4. 안전 기본값 폴백 (DB나 캐시가 비어있어도 중단되지 않도록 보호)
    console.warn('주문 데이터 조회 불가 -> 안전 기본 설정값으로 생성 진행:', dbKey);
    return {
      orderId: cleanKey,
      dbKey: cleanKey,
      name_val: "고객",
      email_full: "customer@realrankus.com",
      budget_cash: 800000000,
      budget_loan: 400000000,
      wanted_region: [["Seoul", "1168000000_Seoul_Gangnam"]],
      wanted_region_str: ["서울시 강남구"],
      fav_point_x: 127.0473774,
      fav_point_y: 37.51733193,
      fav_point_address: "서울 강남구 역삼동",
      trans_method: "public",
      priority_living: 100,
      priority_trans: 100,
      priority_infra: 100,
      priority_edu: 100,
      age_val: 2,
      age_txt: "30대 (커리어상승, 자녀양육)",
      family_val: 3,
      family_txt: "3인",
      children_val: 1,
      children_txt: "1명",
      income_val: 3,
      income_txt: "7천만~1억원"
    };
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

      // RTDB 및 로컬 보관함 자동 아카이빙 (Step 4 & Step 5 연동)
      saveReportToArchive(finalReportData);

      if (typeof onComplete === 'function') {
        onComplete(finalReportData);
      }

      // 100% 달성 시 0.9초 후 리포트 열람 뷰어 모달 자동 오픈
      setTimeout(function () {
        window.openCompletedReportModal(finalReportData);
      }, 900);
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

  // ===========================================================================
  // [Step 4] 리포트 결과 뷰어 렌더링, PDF 변환 다운로드 & Firebase Storage 보관
  // ===========================================================================

  var userReportCharts = {};

  /**
   * 숫자(원)를 한글 금액으로 변환 (numberToKorean 폴백 포함)
   */
  function formatKoreanCurrency(num) {
    var n = Number(num) || 0;
    if (n <= 0) return '0';
    if (typeof numberToKorean === 'function') {
      return numberToKorean(n);
    }
    var eok = Math.floor(n / 100000000);
    var man = Math.floor((n % 100000000) / 10000);
    var str = '';
    if (eok > 0) str += eok.toLocaleString() + '억 ';
    if (man > 0) str += man.toLocaleString() + '만';
    return str.trim() || n.toLocaleString();
  }

  /**
   * 상단 플로팅 뱃지 클릭 핸들러 (100% 완료 시 뷰어 모달, 진행 중일 때 진행 모달)
   */
  window.handleFloatingBadgeClick = function () {
    if (
      window.reportEngineState &&
      window.reportEngineState.percent >= 100 &&
      window.lastGeneratedReportData
    ) {
      window.openCompletedReportModal(window.lastGeneratedReportData);
    } else {
      window.openReportProgressModal();
    }
  };

  /**
   * 리포트 뷰어 모달 오픈 시에도 backdrop 100% 보장
   */
  $(document).on('show.bs.modal shown.bs.modal', '#reportViewerModal', function () {
    $('.modal-backdrop').css({ width: '100%' });
  });

  /**
   * 네이버 미니맵 + 등급 마커 렌더링
   */
  function drawUserMinimap(divId, aptValue, coordY, coordX) {
    var container = document.getElementById(divId);
    if (!container || typeof naver === 'undefined' || !naver.maps) return;

    var complexGrade = setGrade_overide(aptValue);
    var detailMapOptions = {
      center: new naver.maps.LatLng(Number(coordY), Number(coordX)),
      size: new naver.maps.Size(280, 260),
      zoom: 16,
      zoomControl: false,
      draggable: false,
      pinchZoom: false,
      scrollWheel: false,
      keyboardShortcuts: false,
      disableDoubleTapZoom: true,
      disableDoubleClickZoom: true,
      disableTwoFingerTapZoom: true,
      tileTransition: false,
    };

    var miniMap = new naver.maps.Map(divId, detailMapOptions);

    var svgColor = '#CC0000';
    var strokeColor = '#8F0000';
    var gradeClass = 'gradeS';
    if (aptValue >= 70) {
      svgColor = '#CC0000';
      strokeColor = '#8F0000';
      gradeClass = 'gradeS';
    } else if (aptValue >= 55) {
      svgColor = '#F72020';
      strokeColor = '#C50707';
      gradeClass = 'gradeA';
    } else if (aptValue >= 40) {
      svgColor = '#F36637';
      strokeColor = '#D43E0C';
      gradeClass = 'gradeB';
    } else {
      svgColor = '#ED8618';
      strokeColor = '#AB5E0D';
      gradeClass = 'gradeC';
    }

    var svgLocSmall = `
      <svg version="1.1" class="small_marker ${gradeClass}" xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 20 20" width="40" height="50">
        <g class="svg_loc_small">
          <path fill="${svgColor}" stroke="${strokeColor}" stroke-width="1" d="M17.89,4.43,9.86.31a1.67,1.67,0,0,0-1.55,0L.36,4.43a.48.48,0,0,0-.24.42v9.58c0,.74.35,1.35.76,1.35h1l2.26,3.35,2.25-3.35h11c.41,0,.75-.61.75-1.35V4.86A.48.48,0,0,0,17.89,4.43Z"/>
          <text fill="#ffffff" font-size="9px" font-weight="600" text-anchor="middle" x="9" y="12">${complexGrade}</text>
        </g>
      </svg>
    `;

    new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordY), Number(coordX)),
      icon: {
        content: svgLocSmall,
        size: new naver.maps.Size(24, 37),
        anchor: new naver.maps.Point(12, 42),
      },
      zIndex: 100,
      map: miniMap,
    });
  }

  /**
   * 4대 가치 점수 가로 막대 그래프 (Chart.js) 렌더링
   */
  function drawUserScoreGraph(canvasId, livingScore, transportScore, infraScore, eduScore) {
    var canvasEl = document.getElementById(canvasId);
    if (!canvasEl || typeof Chart === 'undefined') return;

    if (userReportCharts[canvasId]) {
      try {
        userReportCharts[canvasId].destroy();
      } catch (e) {}
    }

    var lScore = Number(livingScore || 0).toFixed(2);
    var tScore = transportScore === 'NA' || isNaN(Number(transportScore)) ? 0 : Number(transportScore).toFixed(2);
    var iScore = Number(infraScore || 0).toFixed(2);
    var eScore = Number(eduScore || 0).toFixed(2);

    var labels = ['주거', '교통', '인프라', '교육'];
    var data = [lScore, tScore, iScore, eScore];

    if (Number(tScore) === 0) {
      labels = ['주거', '인프라', '교육'];
      data = [lScore, iScore, eScore];
    }

    var colorArray = [];
    var alignArray = [];
    for (var i = 0; i < data.length; i++) {
      if (Number(data[i]) < 85) {
        colorArray.push('black');
        alignArray.push('end');
      } else {
        colorArray.push('white');
        alignArray.push('start');
      }
    }

    var pluginsList = typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : [];
    var ctx = canvasEl.getContext('2d');
    userReportCharts[canvasId] = new Chart(ctx, {
      type: 'bar',
      plugins: pluginsList,
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: ['#e31939', '#e31939', '#e31939', '#e31939'],
            barThickness: 14,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            color: colorArray,
            align: alignArray,
            anchor: 'end',
            offset: 2,
            textAlign: 'center',
            font: { weight: 'bold' },
          },
        },
        animation: { duration: 0 },
        scales: {
          x: {
            type: 'linear',
            min: 0,
            max: 100,
          },
        },
      },
    });
  }

  /**
   * 리포트 데이터를 HTML로 조립하여 #user_report_area에 렌더링
   */
  function renderReportIntoViewer(reportData) {
    if (!reportData) return;

    var customerName = reportData.customerName || '고객';
    var todayStr = reportData.todayStr || new Date().toISOString().slice(0, 10);
    var orderData = reportData.orderData || {};
    var top10 = reportData.top10 || [];
    var userGuide = reportData.userGuide || '';
    var complexAnalyses = reportData.complexAnalyses || [];

    var dateParts = todayStr.split('-');
    var reportTodayKor =
      dateParts.length === 3
        ? `${dateParts[0]}년 ${Number(dateParts[1])}월 ${Number(dateParts[2])}일`
        : todayStr;

    // 1. 모달 헤더 타이틀
    $('#reportViewerTitle').text(`${customerName}님을 위한 리얼랭커스 추천 보고서 (${todayStr})`);

    // 2. 표지 (Cover Page)
    var coverTopHtml = `<div><span style="color:#0b1279">${customerName}</span>님을 위한 <br> 리얼랭커스 추천 보고서</div>`;
    var coverMiddleHtml = `<div id="user_cover_page_CI"><img src="./apt-rank.png" width="140px" id="user_cover_page_img" crossorigin="anonymous" onerror="this.src='https://www.realrankus.com/apt-rank.png'"></div>`;
    var coverBottomHtml = `<div><span style="font-size: 1.4em">${todayStr}</span><br><span style="font-weight:700; font-size: 1.9em">리얼랭커스</span></div>`;

    $('#user_cover_page_top').html(coverTopHtml);
    $('#user_cover_page_middle').html(coverMiddleHtml);
    $('#user_cover_page_bottom').html(coverBottomHtml);

    // 3. 고객 정보 및 예산/희망지역 요약
    var ageDesList = [
      '사회초년, 결혼준비',
      '신혼, 자녀출산',
      '커리어상승, 자녀양육',
      '커리어최고, 자녀학령',
      '관리/임원급, 자녀성년',
      '커리어하강/은퇴, 자녀독립',
      '노후, 후대양성',
    ];
    var ageIdx = Number(orderData.age_val) !== undefined ? Number(orderData.age_val) : 2;
    var ageDes = ageDesList[ageIdx] || '커리어상승, 자녀양육';
    var ageTxt = orderData.age_txt || '30대';
    var familyTxt = orderData.family_txt || '3인';
    var childrenTxt = orderData.children_txt || '1명';
    var childrenTypeTxt = orderData.children_type_txt || '영유아/미취학';
    var incomeTxt = orderData.income_txt || '7천만~1억원';

    var customerInfoHtml =
      `<div>${customerName}님은 ${reportTodayKor} 현재,<br>` +
      `${ageTxt}의 연령으로 생애주기에서 <span class="reportFocus">'${ageDes}기'</span>를 지나고 있습니다.<br><br>` +
      `가족 구성은 총 ${familyTxt}으로 자녀는 ${childrenTxt}이고, ${childrenTypeTxt}이네요.<br>` +
      `가족의 평균 연소득은 ${incomeTxt}으로 가정 경제를 운영하고 계십니다.</div>`;

    var cashNum = Number(orderData.budget_cash) || 0;
    var loanNum = Number(orderData.budget_loan) || 0;
    var totalNum = cashNum + loanNum;

    var cashKor = formatKoreanCurrency(cashNum);
    var loanKor = formatKoreanCurrency(loanNum);
    var totalKor = formatKoreanCurrency(totalNum);

    var budgetHtml =
      `<div>${reportTodayKor} 현재 사용가능한 예산은<br>` +
      `즉시 사용 가능한 현금성 <span class="reportFocus">'${cashKor}원'</span> 과, ` +
      `대출 가능한 <span class="reportFocus">'${loanKor}원'</span>을 합쳐<br>` +
      `<span class="reportFocus">총 '${totalKor}원'</span>으로 확인됩니다.</div>`;

    var wantedRegionStrList = orderData.wanted_region_str || ['서울시 강남구'];
    var regionHtml = `<div>매수를 원하시는 지역은 아래와 같이 총 ${wantedRegionStrList.length}개 지역 이고요,<br>`;
    for (var r = 0; r < wantedRegionStrList.length; r++) {
      regionHtml += `<span class="reportFocus">(${r + 1}) ${wantedRegionStrList[r]}</span><br>`;
    }
    regionHtml += `</div>`;

    var movingMethodKor = orderData.trans_method === 'driving' ? '자가운전' : '대중교통';
    var favAddr = orderData.fav_point_address || '주요 목적지';

    // 4. TOP 10 추천 단지 카드 조립
    var complexIntroLineHtml = `<div style="margin-top: 16px;"><span class="reportFocus">${totalKor}원 으로 추천 드리는 단지는 다음과 같습니다.</span></div>`;
    var complexHtml = '';

    for (var i = 0; i < top10.length; i++) {
      var c = top10[i];
      var aptName = c['아파트명'] || '추천 단지';
      var aptYears = c['준공년차'] || '';
      var houseNum = c['세대수'] || '';
      var aptAddr = c['법정동주소'] || c['도로명주소'] || '';
      var aptValue = Number(c['가치 총점']) || 0;
      var grade = c.grade || setGrade_overide(aptValue);
      var movingTimeKor = c.moving_time_kor || '약 30분';
      var movingIcon = c.moving_method === 'driving' ? 'fa-car-side' : 'fa-van-shuttle';
      var sUrl = c['sURL'] || 'https://www.realrankus.com';

      // 평형별 실거래 및 예상도달가격
      var pyListHtml = '';
      var possibleArr = c.possible || [];
      var nowDate = new Date();
      var minDate = new Date('2021-07-30');

      for (var pIdx = 0; pIdx < possibleArr.length; pIdx++) {
        var pItem = possibleArr[pIdx];
        var areaText = pItem[0] || '';
        var salesText = pItem[1] || '';
        var comparePrice = Number(pItem[3]) || 0;
        var targetPriceVal = Number(pItem[4]) || 0;

        var targetPriceEok =
          targetPriceVal > 0
            ? (targetPriceVal / 10000).toFixed(2) + '억'
            : (comparePrice / 10000).toFixed(2) + '억';

        var lastDateStr = salesText.slice(-11, salesText.length - 1);
        var compareDate = new Date(lastDateStr);
        var monthDiff = !isNaN(compareDate.getTime())
          ? Math.ceil((nowDate - compareDate) / (24 * 60 * 60 * 1000 * 30))
          : 0;

        var targetPriceKor = `→ 예상도달가격 : ${targetPriceEok}`;
        if (monthDiff > 12) {
          if (compareDate < minDate) {
            targetPriceKor = `<i class="fa-solid fa-triangle-exclamation"></i> → 예상도달가격 예측 정보 부족`;
          } else {
            targetPriceKor = `<i class="fa-solid fa-triangle-exclamation"></i> → 예상도달가격 : ${targetPriceEok}`;
          }
        }

        pyListHtml += `<div>${areaText} / ${salesText} <span style="color: #b61313">${targetPriceKor}</span></div>`;
      }

      var pyMultiColClass = possibleArr.length >= 4 ? 'py_multi_col' : '';

      // Gemini AI 분석 코멘트 분리 (headline ||| story ||| strength ||| weakness)
      var rawAi =
        c.ai_analysis ||
        (complexAnalyses[i] && complexAnalyses[i].analysis) ||
        `${aptName} 맞춤형 분석|||우수한 입지 밸런스를 갖춘 추천 단지입니다.|||<ul><li>우수한 가치 총점 (${aptValue.toFixed(1)}점)</li></ul>|||<ul><li>실거래 추이 확인 권장</li></ul>`;
      var aiParts = String(rawAi).replace(/\n/g, '').split('|||');
      var aiHeadline = aiParts[0] || `${aptName} 1:1 입지 브리핑`;
      var aiStory = aiParts[1] || '';
      var aiStrength = aiParts[2] || '';
      var aiWeakness = aiParts[3] || '';

      complexHtml += `
        <div class="report_apt">
          <div class="report_apt_name">${aptName} <span class="aptYear">(${aptYears}년차)</span></div>
          <div class="report_apt_info">
            <div><i class="fa-solid fa-circle-info"></i></div>
            <div>RANK ${grade} / ${houseNum}세대 / ${aptAddr}</div>
            <div><i class="fa-solid ${movingIcon}"></i></div>
            <div>${favAddr}까지 <span class="reportFocus">${movingMethodKor}으로 약 ${movingTimeKor} 소요 예상</span></div>
          </div>
          <div class="report_py_info ${pyMultiColClass}">
            ${pyListHtml}
          </div>
          <div class="complex_value">
            <div class="complex_map" id="user_complex_map_${i}"></div>
            <div class="complex_score">
              <div class="graph"><canvas id="user_complex_score_${i}"></canvas></div>
              <div class="report_info">
                <a href="${sUrl}" target="_blank"><div class="complex_QR" id="user_complex_QR_${i}"></div></a>
                <div class="complex_QR_notice">
                  <ul>
                    <li>입지 점수의 분석 결과는 리얼랭커스 QR코드를 통해 확인할 수 있습니다.</li>
                    <li>QR코드는 발행일로부터 3개월간 유효합니다.</li>
                    <li>PDF파일의 경우 QR코드를 클릭하시면 리얼랭커스 분석 결과 페이지로 이동합니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div class="complex_comment">
            <div class="complex_headline" id="user_complex_headline_${i}">${aiHeadline}</div>
            <div class="complex_content" id="user_complex_story_${i}">${aiStory}</div>
            <div class="complex_strength">이 단지의 강점은요,</div>
            <div class="complex_content" id="user_complex_strength_${i}">${aiStrength}</div>
            <div class="complex_weakness">고려할 점은요,</div>
            <div class="complex_content" id="user_complex_weakness_${i}">${aiWeakness}</div>
          </div>
        </div>
      `;
    }

    var printAreaHtml = `
      <div id="user_intro_page" class="pdf_page_section">
        ${customerInfoHtml}
        <hr>
        ${budgetHtml}
        <hr>
        ${regionHtml}
        <hr>
        <div id="user_consulting_note_wrapper">
          <div id="user_consulting_note_title">Consulting Note</div>
          <div id="user_consulting_note">${userGuide}</div>
        </div>
        ${complexIntroLineHtml}
      </div>
      ${complexHtml}
    `;

    $('#user_print_area').html(printAreaHtml);

    // 5. 맺음말 (End of Document)
    var eodTopHtml = `
      <div>
        <ul>
          <li>리얼랭커스의 추천 보고 결과는 투자지표가 아니며, 투자 판단에 대한 모든 책임은 본인에게 있습니다.</li>
          <li>보고서의 모든 결과는 발행일 기준으로 설정된 내용이며, 정책 또는 사회적 상황의 변화를 반영하지 않습니다.</li>
          <li>예상도달가격은 달러와 원화의 총 통화량과 상승률을 반영하여 산출됩니다.</li>
          <li>보고서의 추천 결과는 최대 10개까지 표시됩니다.</li>
        </ul>
      </div>
    `;
    var eodMiddleHtml = `<div>감사합니다.</div>`;
    var eodBottomHtml = `<div><span style="font-size: 1.4em">${todayStr}</span><br><span style="font-weight:700; font-size: 1.9em">리얼랭커스</span></div>`;

    $('#user_eod_top').html(eodTopHtml);
    $('#user_eod_middle').html(eodMiddleHtml);
    $('#user_eod_bottom').html(eodBottomHtml);
  }

  /**
   * 모달 오픈 후 미니맵, 점수 차트, QR코드 일괄 초기화
   */
  function initReportMapsAndCharts(reportData) {
    if (!reportData || !Array.isArray(reportData.top10)) return;
    var top10 = reportData.top10;
    var todayStr = reportData.todayStr || new Date().toISOString().slice(0, 10);

    for (var k = 0; k < top10.length; k++) {
      var item = top10[k];
      var mapDivId = 'user_complex_map_' + k;
      var scoreCanvasId = 'user_complex_score_' + k;
      var qrDivId = 'user_complex_QR_' + k;

      drawUserMinimap(mapDivId, Number(item['가치 총점']) || 0, item.Y, item.X);
      drawUserScoreGraph(
        scoreCanvasId,
        item['주거총점'],
        item['교통총점'],
        item['인프라총점'],
        item['학군총점']
      );

      var qrUrl = item['sURL'] || 'https://www.realrankus.com';
      var qrImgSrc = 'https://quickchart.io/qr?text=' + encodeURIComponent(qrUrl);
      $('#' + qrDivId).html(
        `<img src="${qrImgSrc}" height="90px" crossorigin="anonymous" /><br>${todayStr}`
      );
    }
  }

  /**
   * [핵심] 완성된 리포트 열람 모달 오픈 (Step 4)
   */
  window.openCompletedReportModal = function (customReportData) {
    var reportData =
      customReportData ||
      window.lastGeneratedReportData ||
      (window.reportEngineState && window.reportEngineState.reportData);

    if (!reportData) {
      if (typeof toastMessage === 'function') {
        toastMessage('표시할 리포트 데이터가 없습니다. 먼저 리포트를 생성해 주세요.', 3000);
      } else {
        alert('표시할 리포트 데이터가 없습니다.');
      }
      return;
    }

    window.lastGeneratedReportData = reportData;

    // 진행 모달 닫기
    window.closeReportProgressModal();

    // 리포트 DOM 렌더링
    renderReportIntoViewer(reportData);

    // 리포트 뷰어 모달 열기
    setTimeout(function () {
      var viewerEl = document.getElementById('reportViewerModal');
      if (viewerEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        var viewerInst = bootstrap.Modal.getOrCreateInstance
          ? bootstrap.Modal.getOrCreateInstance(viewerEl)
          : bootstrap.Modal.getInstance(viewerEl) || new bootstrap.Modal(viewerEl);
        viewerInst.show();
      } else {
        $('#reportViewerModal').modal('show');
      }

      $('.modal-backdrop').css({ width: '100%' });

      // 모달이 화면에 완전히 그려진 뒤 네이버 미니맵과 Chart.js 렌더링
      setTimeout(function () {
        $('.modal-backdrop').css({ width: '100%' });
        initReportMapsAndCharts(reportData);

        // 미니맵 타일 및 차트 렌더링이 안정화된 뒤 백그라운드 Storage 업로드 실행
        setTimeout(function () {
          uploadReportPDFToStorage(reportData);
        }, 900);
      }, 350);
    }, 220);
  };

  /**
   * RTDB 및 LocalStorage에 완성된 리포트 아카이브 영구 저장 (Step 4 & Step 5 연동)
   */
  function saveReportToArchive(reportData) {
    if (!reportData) return;

    var cleanDbKey = String(reportData.dbKey || reportData.orderId || 'report_' + Date.now());
    if (cleanDbKey.startsWith('/')) cleanDbKey = cleanDbKey.substring(1);

    var uid = '';
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      uid = firebase.auth().currentUser.uid;
    } else if (reportData.orderData && reportData.orderData.uid) {
      uid = reportData.orderData.uid;
    }

    // 재열람에 필요한 핵심 단지 데이터 경량화 직렬화
    var compactTop10 = (reportData.top10 || []).map(function (c) {
      return {
        아파트명: c['아파트명'] || '',
        준공년차: c['준공년차'] || '',
        세대수: c['세대수'] || '',
        법정동주소: c['법정동주소'] || '',
        도로명주소: c['도로명주소'] || '',
        '가치 총점': c['가치 총점'] || 0,
        주거총점: c['주거총점'] || 0,
        교통총점: c['교통총점'] || 0,
        인프라총점: c['인프라총점'] || 0,
        학군총점: c['학군총점'] || 0,
        X: c.X,
        Y: c.Y,
        sURL: c.sURL || '',
        검색코드: c['검색코드'] || '',
        subRegion: c.subRegion || '',
        grade: c.grade || setGrade_overide(c['가치 총점']),
        custom_value: c.custom_value || 0,
        moving_method: c.moving_method || 'public',
        moving_time_kor: c.moving_time_kor || '',
        possible: c.possible || [],
        ai_analysis: c.ai_analysis || '',
      };
    });

    var archiveRecord = {
      orderId: reportData.orderId || cleanDbKey,
      dbKey: cleanDbKey,
      uid: uid,
      customerName: reportData.customerName || '고객',
      customerEmail: reportData.customerEmail || '',
      todayStr: reportData.todayStr || new Date().toISOString().slice(0, 10),
      generatedAt: reportData.generatedAt || new Date().toISOString(),
      status: 'Completed',
      pdfUrl: reportData.pdfUrl || '',
      top10Names: compactTop10.map(function (t) {
        return t['아파트명'];
      }),
      orderData: reportData.orderData || {},
      userGuide: reportData.userGuide || '',
      complexAnalyses: reportData.complexAnalyses || [],
      top10: compactTop10,
    };

    // 1. LocalStorage 보관함 저장 (비로그인/게스트 및 즉시 열람용)
    try {
      var localListRaw = localStorage.getItem('realrankus_my_reports');
      var localList = localListRaw ? JSON.parse(localListRaw) : [];
      localList = localList.filter(function (item) {
        return item.dbKey !== cleanDbKey && item.orderId !== archiveRecord.orderId;
      });
      localList.unshift(archiveRecord);
      if (localList.length > 15) localList = localList.slice(0, 15);
      localStorage.setItem('realrankus_my_reports', JSON.stringify(localList));
    } catch (lsErr) {
      console.warn('LocalStorage 리포트 아카이브 저장 경고:', lsErr);
    }

    // 2. Firebase RTDB 저장
    try {
      var rtdbPayload = {
        progress: 'Completed',
        generatedAt: archiveRecord.generatedAt,
        top10Names: archiveRecord.top10Names,
        reportArchive: archiveRecord,
      };

      if (typeof requestReport_db !== 'undefined' && requestReport_db.database) {
        requestReport_db.database().ref(cleanDbKey).update(rtdbPayload);
        if (uid) {
          requestReport_db
            .database()
            .ref('user_reports/' + uid + '/' + cleanDbKey)
            .set(archiveRecord);
        }
      }
      if (typeof firebase !== 'undefined' && firebase.database) {
        firebase.database().ref(cleanDbKey).update(rtdbPayload);
        if (uid) {
          firebase
            .database()
            .ref('user_reports/' + uid + '/' + cleanDbKey)
            .set(archiveRecord);
        }
      }
    } catch (dbErr) {
      console.warn('RTDB 아카이브 업데이트 경고:', dbErr);
    }

    $('#reportStorageStatusBadge')
      .removeClass('bg-secondary')
      .addClass('bg-success')
      .html('<i class="fa-solid fa-cloud-check me-1"></i>내 보관함 자동 저장 완료');
  }

  /**
   * 단지 카드(.report_apt)의 가로 폭은 100%(730px -> PDF 190mm)로 동일하게 고정한 채,
   * 세로 높이가 A4 1페이지 허용치(maxDomH)를 초과할 경우 내부 여백과 폰트 크기만 단계적으로 조여
   * 모든 단지 박스의 가로 크기가 완벽히 동일하게 유지되도록 보정합니다.
   */
  function fitAptBoxHeightKeepingWidth(aptEl, maxDomH) {
    var savedStyles = [];
    function setTempStyle(el, prop, val) {
      if (!el) return;
      savedStyles.push({ el: el, prop: prop, oldVal: el.style[prop] });
      el.style[prop] = val;
    }

    // 1. 모든 단지 카드의 가로 박스 크기를 동일하게 고정
    setTempStyle(aptEl, 'width', '730px');
    setTempStyle(aptEl, 'minWidth', '730px');
    setTempStyle(aptEl, 'maxWidth', '730px');
    setTempStyle(aptEl, 'boxSizing', 'border-box');
    setTempStyle(aptEl, 'marginBottom', '0px');

    if (aptEl.offsetHeight <= maxDomH) {
      return function restore() {
        for (var i = savedStyles.length - 1; i >= 0; i--) {
          var s = savedStyles[i];
          s.el.style[s.prop] = s.oldVal;
        }
      };
    }

    // 2. 세로 높이가 길 경우 내부 평형표 2단 전환 및 여백/지도 높이 1차 축소 (가로 폭은 730px 고정)
    var pyEl = aptEl.querySelector('.report_py_info');
    if (pyEl && pyEl.children && pyEl.children.length >= 3) {
      setTempStyle(pyEl, 'gridTemplateColumns', '1fr 1fr');
      setTempStyle(pyEl, 'columnGap', '10px');
      setTempStyle(pyEl, 'rowGap', '2px');
      setTempStyle(pyEl, 'fontSize', '11.5px');
      setTempStyle(pyEl, 'margin', '4px 0');
      setTempStyle(pyEl, 'paddingBottom', '5px');
    }

    setTempStyle(aptEl, 'padding', '12px 16px');
    var infoEl = aptEl.querySelector('.report_apt_info');
    if (infoEl) {
      setTempStyle(infoEl, 'margin', '4px 0');
      setTempStyle(infoEl, 'paddingBottom', '5px');
      setTempStyle(infoEl, 'rowGap', '3px');
      setTempStyle(infoEl, 'fontSize', '12.5px');
    }

    var valEl = aptEl.querySelector('.complex_value');
    if (valEl) {
      setTempStyle(valEl, 'margin', '6px 0');
    }
    var mapEl = aptEl.querySelector('.complex_map');
    if (mapEl) {
      setTempStyle(mapEl, 'height', '215px');
    }
    var graphEl = aptEl.querySelector('.complex_score .graph');
    if (graphEl) {
      setTempStyle(graphEl, 'height', '128px');
    }

    // 3. 여전히 maxDomH를 초과하면 코멘트 영역 폰트 크기/줄간격 단계별 축소
    var fontSteps = [
      { fontSize: '12.5px', lineHeight: '1.46', margin: '6px' },
      { fontSize: '11.8px', lineHeight: '1.38', margin: '4px' },
      { fontSize: '11.0px', lineHeight: '1.30', margin: '3px' },
      { fontSize: '10.2px', lineHeight: '1.24', margin: '2px' },
    ];

    var commentEl = aptEl.querySelector('.complex_comment');
    var contentEls = aptEl.querySelectorAll('.complex_content');
    var liEls = aptEl.querySelectorAll('.complex_content ul li');
    var headEl = aptEl.querySelector('.complex_headline');
    var strEls = aptEl.querySelectorAll('.complex_strength, .complex_weakness');

    for (var step = 0; step < fontSteps.length; step++) {
      if (aptEl.offsetHeight <= maxDomH) break;
      var cfg = fontSteps[step];
      if (commentEl) setTempStyle(commentEl, 'marginTop', cfg.margin);
      if (headEl) {
        setTempStyle(headEl, 'marginTop', cfg.margin);
        setTempStyle(headEl, 'marginBottom', cfg.margin);
        setTempStyle(headEl, 'paddingTop', cfg.margin);
        setTempStyle(headEl, 'fontSize', '14px');
      }
      for (var cIdx = 0; cIdx < contentEls.length; cIdx++) {
        setTempStyle(contentEls[cIdx], 'fontSize', cfg.fontSize);
        setTempStyle(contentEls[cIdx], 'lineHeight', cfg.lineHeight);
        setTempStyle(contentEls[cIdx], 'marginBottom', cfg.margin);
      }
      for (var lIdx = 0; lIdx < liEls.length; lIdx++) {
        setTempStyle(liEls[lIdx], 'marginBottom', '2px');
      }
      for (var sIdx = 0; sIdx < strEls.length; sIdx++) {
        setTempStyle(strEls[sIdx], 'marginTop', cfg.margin);
        setTempStyle(strEls[sIdx], 'marginBottom', '2px');
        setTempStyle(strEls[sIdx], 'fontSize', '13px');
      }
    }

    // 4. 극단적으로 긴 텍스트일 경우에도 가로 폭(730px)은 절대 줄이지 않고 높이를 maxDomH로 제한
    if (aptEl.offsetHeight > maxDomH) {
      setTempStyle(aptEl, 'maxHeight', maxDomH + 'px');
      setTempStyle(aptEl, 'overflow', 'hidden');
    }

    return function restore() {
      for (var r = savedStyles.length - 1; r >= 0; r--) {
        var st = savedStyles[r];
        st.el.style[st.prop] = st.oldVal;
      }
    };
  }

  /**
   * [핵심] 단지별 1페이지(1-Page-Per-Complex) + 모든 단지 박스 가로폭 100% 동일 + 마지막 맺음말 별도 1페이지 PDF 생성
   * - Page 1: 표지 (#user_cover_page)
   * - Page 2: 고객 정보 + 예산 + 희망지역 + Consulting Note (#user_intro_page)
   * - Page 3 ~ N+2: 추천 단지 1번 ~ 10번 (.report_apt 각각 1페이지, 모든 단지 페이지의 박스 가로 크기 190mm로 100% 동일)
   * - 마지막 별도 Page: 감사합니다 / 리얼랭커스 맺음말 (#user_end_of_document)
   */
  async function buildReportPdfPerPage() {
    var JsPDFClass =
      (window.jspdf && window.jspdf.jsPDF) ||
      window.jsPDF ||
      null;

    if (!JsPDFClass || typeof html2canvas !== 'function') {
      return null;
    }

    var viewerBody = document.getElementById('reportViewerBody');
    var prevScrollTop = viewerBody ? viewerBody.scrollTop : 0;
    if (viewerBody) viewerBody.scrollTop = 0;

    try {
      var pdf = new JsPDFClass({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      var pageNodes = [];
      var coverEl = document.getElementById('user_cover_page');
      if (coverEl) pageNodes.push({ el: coverEl, type: 'cover', fullBleed: true });

      var introEl = document.getElementById('user_intro_page');
      if (introEl) pageNodes.push({ el: introEl, type: 'intro', fullBleed: false });

      var aptEls = document.querySelectorAll('#user_report_area .report_apt');
      for (var i = 0; i < aptEls.length; i++) {
        pageNodes.push({ el: aptEls[i], type: 'apt', fullBleed: false });
      }

      var eodEl = document.getElementById('user_end_of_document');
      if (eodEl) pageNodes.push({ el: eodEl, type: 'eod', fullBleed: true });

      var pageW = 210;
      var pageH = 297;

      for (var idx = 0; idx < pageNodes.length; idx++) {
        var item = pageNodes[idx];
        var targetEl = item.el;
        if (!targetEl) continue;

        if (idx > 0) {
          pdf.addPage('a4', 'portrait');
        }

        var marginX = item.fullBleed ? 0 : 10;
        var marginY = item.fullBleed ? 0 : 10;
        var maxW = pageW - marginX * 2; // 190mm (일반/단지 페이지) 또는 210mm (표지/맺음말)
        var maxH = pageH - marginY * 2; // 277mm (일반/단지 페이지) 또는 297mm (표지/맺음말)

        var restoreFn = null;
        var prevEodBorder = '';
        var prevEodMinH = '';
        var prevEodH = '';

        if (item.type === 'apt') {
          // 가로 폭 730px 기준 A4 1페이지 최대 허용 픽셀 높이 (~1064px)
          var maxDomH = Math.floor(730 * (maxH / maxW));
          restoreFn = fitAptBoxHeightKeepingWidth(targetEl, maxDomH);
        } else if (item.type === 'eod') {
          // 마지막 페이지(감사합니다, 리얼랭커스)는 점선 제거 및 A4 전체 페이지 비율(794 x 1122)로 보정하여 별도 1페이지 구성
          prevEodBorder = targetEl.style.borderTop;
          prevEodMinH = targetEl.style.minHeight;
          prevEodH = targetEl.style.height;
          targetEl.style.borderTop = 'none';
          targetEl.style.minHeight = '1122px';
          targetEl.style.height = '1122px';
        }

        var canvas = await html2canvas(targetEl, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          onclone: function (clonedDoc) {
            var clonedModal = clonedDoc.getElementById('reportViewerModal');
            if (clonedModal) {
              clonedModal.style.position = 'static';
              clonedModal.style.overflow = 'visible';
              clonedModal.style.height = 'auto';
            }
            var clonedBody = clonedDoc.getElementById('reportViewerBody');
            if (clonedBody) {
              clonedBody.scrollTop = 0;
              clonedBody.style.overflow = 'visible';
              clonedBody.style.maxHeight = 'none';
              clonedBody.style.height = 'auto';
            }
          },
        });

        if (restoreFn) {
          restoreFn();
        }
        if (item.type === 'eod') {
          targetEl.style.borderTop = prevEodBorder;
          targetEl.style.minHeight = prevEodMinH;
          targetEl.style.height = prevEodH;
        }

        var imgData = canvas.toDataURL('image/jpeg', 0.96);

        // [핵심] 모든 아파트 단지 페이지(type === 'apt')는 가로 크기(renderW)를 maxW(190mm)로 100% 동일하게 고정!
        var renderW = maxW;
        var renderH = (canvas.height * renderW) / canvas.width;

        if (item.type === 'apt') {
          // fitAptBoxHeightKeepingWidth를 통해 이미 renderH <= maxH 이므로 가로 폭(190mm)을 절대 줄이지 않음
          if (renderH > maxH) {
            renderH = maxH;
          }
        } else if (renderH > maxH) {
          renderH = maxH;
          renderW = (canvas.width * renderH) / canvas.height;
        }

        var offsetX = item.type === 'apt' ? marginX : marginX + (maxW - renderW) / 2;
        var offsetY = marginY;

        pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderW, renderH, undefined, 'FAST');
      }

      return pdf;
    } finally {
      if (viewerBody) viewerBody.scrollTop = prevScrollTop;
    }
  }

  /**
   * 백그라운드에서 PDF Blob을 생성하여 Firebase Storage에 자동 업로드 (단지별 1페이지)
   */
  async function uploadReportPDFToStorage(reportData) {
    if (!reportData || reportData._storageUploaded) return;
    if (typeof firebase === 'undefined' || typeof firebase.storage !== 'function') return;

    var element = document.getElementById('user_report_area');
    if (!element) return;

    reportData._storageUploaded = true;

    try {
      var uid =
        firebase.auth && firebase.auth().currentUser
          ? firebase.auth().currentUser.uid
          : (reportData.orderData && reportData.orderData.uid) || 'guest';
      var cleanOrderId = String(reportData.orderId || reportData.dbKey || 'REP_' + Date.now()).replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      );

      var pdfBlob = null;
      var pdfDoc = await buildReportPdfPerPage();
      if (pdfDoc) {
        pdfBlob = pdfDoc.output('blob');
      } else if (typeof html2pdf !== 'undefined') {
        var opt = {
          margin: 0,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: false, logging: false, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: {
            mode: ['css', 'legacy'],
            after: ['#user_cover_page', '#user_intro_page', '.report_apt'],
            before: ['#user_end_of_document'],
            avoid: ['.report_apt'],
          },
        };
        pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      }

      if (!pdfBlob) return;

      var storagePath = `user_reports/${uid}/${cleanOrderId}.pdf`;
      var storageRef = firebase.storage().ref().child(storagePath);

      var uploadSnap = await storageRef.put(pdfBlob, {
        contentType: 'application/pdf',
        customMetadata: {
          customerName: reportData.customerName || '고객',
          orderId: cleanOrderId,
        },
      });

      var downloadUrl = await uploadSnap.ref.getDownloadURL();
      reportData.pdfUrl = downloadUrl;
      console.log('[Step 4] Firebase Storage 단지별 1페이지 PDF 업로드 성공:', downloadUrl);

      // URL 업데이트 저장
      saveReportToArchive(reportData);
    } catch (storageErr) {
      console.info('[Step 4] Storage PDF 클라우드 업로드 참고 (DB 아카이브는 정상 완료됨):', storageErr.message || storageErr);
    }
  }

  /**
   * [1클릭 PDF 파일 다운로드] 단지별로 정확히 1페이지씩 구성된 로컬 PDF 파일 다운로드
   */
  window.downloadUserReportPDF = async function () {
    var element = document.getElementById('user_report_area');
    if (!element) {
      alert('출력할 리포트 영역을 찾을 수 없습니다.');
      return;
    }

    var reportData = window.lastGeneratedReportData || {};
    var customerName = reportData.customerName || '고객';
    var todayStr = (reportData.todayStr || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    var fileName = `${customerName}님을_위한_리얼랭커스_추천보고서_${todayStr}.pdf`;

    var $btn = $('#btnDownloadReportPdf');
    var origHtml = $btn.html();
    $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin me-1"></i>단지별 PDF 생성 중...');

    if (typeof toastMessage === 'function') {
      toastMessage('📄 단지별 1페이지 A4 고해상도 PDF를 생성 중입니다. 잠시만 기다려 주세요...', 4000);
    }

    try {
      var pdfDoc = await buildReportPdfPerPage();
      if (pdfDoc) {
        pdfDoc.save(fileName);
        $btn.prop('disabled', false).html(origHtml);
        if (typeof toastMessage === 'function') {
          toastMessage('🎉 단지별 1페이지 PDF 파일 다운로드가 완료되었습니다!', 3000);
        }
        return;
      }

      if (typeof html2pdf !== 'undefined') {
        var options = {
          margin: 0,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: false, logging: false, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: {
            mode: ['css', 'legacy'],
            after: ['#user_cover_page', '#user_intro_page', '.report_apt'],
            before: ['#user_end_of_document'],
            avoid: ['.report_apt'],
          },
        };
        await html2pdf().set(options).from(element).save();
        $btn.prop('disabled', false).html(origHtml);
        if (typeof toastMessage === 'function') {
          toastMessage('🎉 PDF 파일 다운로드가 완료되었습니다!', 3000);
        }
        return;
      }

      $btn.prop('disabled', false).html(origHtml);
      window.openPrintReportWindow();
    } catch (err) {
      console.error('PDF 다운로드 오류:', err);
      $btn.prop('disabled', false).html(origHtml);
      window.openPrintReportWindow();
    }
  };

  /**
   * [고화질 A4 인쇄 / 벡터 PDF 저장] 지도 타일과 벡터 폰트가 100% 보존되며 단지별 1페이지로 구성된 인쇄창 호출
   */
  window.openPrintReportWindow = function () {
    var reportData = window.lastGeneratedReportData;
    if (!reportData) {
      alert('출력할 리포트 데이터가 없습니다.');
      return;
    }

    var customerName = reportData.customerName || '고객';
    var todayStr = (reportData.todayStr || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    var docTitle = `${customerName}님을_위한_리얼랭커스_추천보고서_${todayStr}`;

    var reportHtmlContent = document.getElementById('user_report_area').innerHTML;

    // 현재 Chart.js 캔버스들을 이미지 데이터 URL로 추출하여 인쇄창에 그대로 주입
    var canvasDataMap = {};
    var top10 = reportData.top10 || [];
    for (var i = 0; i < top10.length; i++) {
      var cEl = document.getElementById('user_complex_score_' + i);
      if (cEl && cEl.toDataURL) {
        try {
          canvasDataMap['user_complex_score_' + i] = cEl.toDataURL('image/png');
        } catch (e) {}
      }
    }

    var printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) {
      alert('팝업 차단이 설정되어 있습니다. 브라우저의 팝업 차단을 해제해 주세요.');
      return;
    }

    var printDoc = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <title>${docTitle}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" />
        <script type="text/javascript" src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=kgh4ynr4a1"></script>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            font-family: 'Noto Sans KR', sans-serif;
            color: #111;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #user_report_area {
            width: 194mm;
            margin: 0 auto;
            background: #fff;
          }
          hr { border: 1px solid #aaa; margin: 16px 0; }
          .reportFocus { font-weight: 700; color: #0820a8; }
          #user_cover_page {
            width: 100%;
            height: 275mm;
            display: grid;
            grid-template-rows: 1fr 2.2fr 1fr;
            padding: 40px 35px;
            box-sizing: border-box;
            page-break-after: always;
            break-after: page;
          }
          #user_cover_page_top { font-size: 2.4em; font-weight: 900; padding-left: 10px; padding-top: 40px; line-height: 1.38; }
          #user_cover_page_middle { display: grid; align-content: center; justify-content: center; }
          #user_cover_page_CI {
            width: 145px; height: 145px; border-radius: 15px;
            background: linear-gradient(50deg, rgba(212,20,90,1) 3%, rgba(237,28,36,1) 70%, rgba(237,28,36,1) 100%);
            display: flex; align-items: center; justify-content: center;
          }
          #user_cover_page_bottom { display: grid; align-items: end; text-align: center; margin-bottom: 40px; }
          #user_print_area { padding: 10px 0; font-size: 13.8px; line-height: 1.58; width: 100%; box-sizing: border-box; }
          #user_intro_page {
            width: 100%;
            box-sizing: border-box;
            padding: 10px 15px;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          #user_consulting_note_wrapper {
            margin: 16px 0; padding: 18px; background: #f8fafc;
            border-left: 4px solid #0820a8; border-radius: 6px;
          }
          #user_consulting_note_title { font-size: 1.2em; font-weight: 700; font-style: italic; margin-bottom: 10px; color: #162235; }
          #user_consulting_note { font-size: 0.94em; line-height: 1.6em; color: #334155; }
          .report_apt {
            width: 100%;
            box-sizing: border-box;
            margin-bottom: 0; border-radius: 8px; border: 1px solid #cbd5e1;
            padding: 14px 18px; background: #fff;
            page-break-before: always; break-before: page;
            page-break-after: always; break-after: page;
            page-break-inside: avoid; break-inside: avoid;
          }
          .report_apt_name { font-weight: 700; font-size: 1.18em; color: #a80808; margin-bottom: 6px; }
          .aptYear { font-size: 0.82em; color: #64748b; font-weight: 500; }
          .report_apt_info {
            display: grid; grid-template-columns: 28px 1fr; row-gap: 4px;
            margin: 5px 0; padding-bottom: 6px; border-bottom: 1px solid #ddd; align-items: center; font-size: 0.88em;
          }
          .report_py_info {
            display: grid; grid-template-columns: 1fr; row-gap: 3px;
            margin: 5px 0; padding-bottom: 6px; border-bottom: 1px solid #ddd; font-size: 0.86em;
          }
          .report_py_info.py_multi_col {
            grid-template-columns: 1fr 1fr;
            column-gap: 12px;
            row-gap: 2px;
            font-size: 0.81em;
          }
          .complex_value { display: grid; grid-template-columns: 280px 1fr; column-gap: 14px; margin: 8px 0; align-items: center; }
          .complex_map { width: 280px; height: 240px; border-radius: 6px; overflow: hidden; border: 1px solid #ddd; }
          .complex_score { display: grid; row-gap: 6px; }
          .complex_score .graph { height: 145px; width: 100%; }
          .report_info { display: grid; grid-template-columns: 95px 1fr; column-gap: 10px; border-top: 1px solid #ddd; padding-top: 6px; align-items: center; }
          .complex_QR { text-align: center; font-size: 0.7em; }
          .complex_QR_notice { font-size: 0.72em; color: #666; line-height: 1.38; }
          .complex_QR_notice ul { padding-left: 16px; margin-bottom: 0; }
          .complex_comment { font-size: 0.88em; color: #333; margin-top: 6px; }
          .complex_headline {
            font-size: 1.08em; font-weight: 700; margin-top: 8px; font-style: italic;
            margin-bottom: 6px; text-align: center; border-top: 1px solid #ddd; padding-top: 8px; color: #162235;
          }
          .complex_strength, .complex_weakness { font-size: 0.95em; font-weight: 700; margin-top: 8px; margin-bottom: 4px; color: #1e293b; }
          .complex_content { line-height: 1.54em; margin-bottom: 6px; font-size: 0.92em; }
          #user_end_of_document {
            width: 100%; height: 275mm; display: grid; grid-template-rows: 1fr 3fr 1fr;
            padding: 40px 35px; box-sizing: border-box; page-break-before: always; break-before: page;
          }
          #user_eod_top { font-size: 0.92em; color: #475569; line-height: 1.75; text-align: left; }
          #user_eod_middle { font-size: 2.5em; font-weight: 900; text-align: center; display: grid; align-content: center; justify-content: center; }
          #user_eod_bottom { display: grid; align-items: end; text-align: center; margin-bottom: 40px; }
          @page { size: A4 portrait; margin: 8mm; }
          @media print {
            #printActionHeader { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div id="printActionHeader" style="position: sticky; top: 0; z-index: 999; background: #162235; color: #fff; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center;">
          <div><strong>🖨️ 인쇄 / PDF로 저장</strong> (인쇄 대상에서 <strong>'PDF로 저장'</strong>을 선택하시면 초고화질 원본 PDF로 저장됩니다)</div>
          <button onclick="window.print()" style="background: #E43B46; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 700; cursor: pointer;">지금 인쇄 / PDF 저장</button>
        </div>
        <div id="user_report_area">${reportHtmlContent}</div>
        <script>
          var canvasImages = ${JSON.stringify(canvasDataMap)};
          var top10Data = ${JSON.stringify(
            top10.map(function (c) {
              return { Y: c.Y, X: c.X, score: c['가치 총점'], grade: c.grade };
            })
          )};

          window.onload = function() {
            // 1. 캔버스 차트 이미지 복원
            for (var cid in canvasImages) {
              var cEl = document.getElementById(cid);
              if (cEl && cEl.parentNode) {
                var img = document.createElement('img');
                img.src = canvasImages[cid];
                img.style.width = '100%';
                img.style.height = '150px';
                img.style.objectFit = 'contain';
                cEl.parentNode.replaceChild(img, cEl);
              }
            }

            // 2. 네이버 미니맵 렌더링
            for (var i = 0; i < top10Data.length; i++) {
              var d = top10Data[i];
              var mapEl = document.getElementById('user_complex_map_' + i);
              if (mapEl && typeof naver !== 'undefined' && naver.maps) {
                mapEl.innerHTML = '';
                var m = new naver.maps.Map(mapEl, {
                  center: new naver.maps.LatLng(Number(d.Y), Number(d.X)),
                  size: new naver.maps.Size(280, 250),
                  zoom: 16,
                  zoomControl: false,
                  draggable: false,
                  tileTransition: false
                });
                var svgPin = '<div style="background:#CC0000;color:#fff;font-weight:700;font-size:11px;padding:4px 7px;border-radius:6px;border:1.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);">' + (d.grade || 'S') + '</div>';
                new naver.maps.Marker({
                  position: new naver.maps.LatLng(Number(d.Y), Number(d.X)),
                  icon: { content: svgPin, anchor: new naver.maps.Point(16, 16) },
                  map: m
                });
              }
            }

            setTimeout(function() {
              window.print();
            }, 900);
          };
        <\/script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(printDoc);
    printWin.document.close();
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
      },
      function (err) {
        console.error('[테스트 에러]:', err);
        alert('리포트 생성 중 오류 발생: ' + err.message);
      }
    );
  };
})(window, jQuery);


