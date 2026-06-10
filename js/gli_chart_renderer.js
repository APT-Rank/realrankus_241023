/**
 * RealRankus GLI Market Diagnosis Chart Renderer
 * - Requires Chart.js (v4.x recommended)
 */

(function (window) {
    const GLIChartRenderer = {};

    // Chart.js CDN 자동 인젝션 헬퍼
    GLIChartRenderer.ensureChartJS = function (callback) {
        if (typeof window.Chart !== 'undefined') {
            callback();
            return;
        }
        console.log("Chart.js가 로드되지 않아 CDN으로부터 동적으로 불러옵니다...");
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.type = 'text/javascript';
        script.onload = callback;
        document.head.appendChild(script);
    };

    /**
     * GLI 시장 진단 그래프를 특정 컨테이너에 렌더링합니다.
     * @param {string} containerId - 차트 Canvas가 생성될 부모 div의 ID
     * @param {object} dongData - 지역 JSON 내의 특정 법정동 데이터 객체 (summary_metrics, chart_boundaries, scatter_points 포함)
     * @param {object} options - 커스텀 옵션 (선택 사항)
     */
    GLIChartRenderer.render = function (containerId, dongData, options = {}) {
        this.ensureChartJS(() => {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`컨테이너 ID '${containerId}'를 찾을 수 없습니다.`);
                return;
            }

            // 기존 차트나 캔버스가 존재하면 제거 (중복 렌더링 방지)
            container.innerHTML = '';
            const canvas = document.createElement('canvas');
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            container.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            const cb = dongData.chart_boundaries;
            const metrics = dongData.summary_metrics;

            // X축 최소/최대값 가져오기 (마진을 위해 5%씩 패딩 추가)
            const gliMin = cb.min_gli;
            const gliMax = cb.max_gli;
            const gliPadding = (gliMax - gliMin) * 0.05 || 1.0;
            const xMinLimit = gliMin - gliPadding;
            const xMaxLimit = gliMax + gliPadding;

            // 입주년차별 색상 정의
            const ageStyles = {
                "신축 (5년미만)": { color: "#ff0000", label: "신축 (5년 미만)" },
                "준신축 (5~10년)": { color: "#ff9900", label: "준신축 (5~10년)" },
                "구축 (10~25년)": { color: "#0066cc", label: "구축 (10~25년)" },
                "노후 (25년이상)": { color: "#808080", label: "노후 (25년 이상)" }
            };

            // 차트 Y축 범위 계산용 데이터 추출 (배경 채우기 및 축 제한용)
            const prices = dongData.scatter_points.map(p => p.price_per_pyung);
            const dataMin = Math.min(...prices);
            const dataMax = Math.max(...prices);
            const yMinLimit = Math.max(0, dataMin * 0.8);
            const yMaxLimit = dataMax * 1.2;

            // 배경 영역을 그리기 위한 가상의 연장선 데이터 계산 (X축 한계 범위까지 직선 연장)
            function extendLine(lineData) {
                if (!lineData || lineData.length < 2) return [];
                const p1 = lineData[0];
                const p2 = lineData[1];
                const slope = (p2.price - p1.price) / (p2.gli - p1.gli);
                const intercept = p1.price - slope * p1.gli;
                
                return [
                    { x: xMinLimit, y: slope * xMinLimit + intercept },
                    { x: xMaxLimit, y: slope * xMaxLimit + intercept }
                ];
            }

            const extendedUpper = extendLine(cb.stable_zone_upper);
            const extendedLower = extendLine(cb.stable_zone_lower);
            const extendedSimple = extendLine(cb.simple_trendline);
            const extendedCorrected = extendLine(cb.corrected_trendline);
            const extendedZero = [
                { x: xMinLimit, y: 0 },
                { x: xMaxLimit, y: 0 }
            ];

            // 입주년차별로 산점도 데이터 분류
            const scatterDatasets = Object.keys(ageStyles).map(key => {
                const points = dongData.scatter_points
                    .filter(p => p.age_category === key)
                    .map(p => ({
                        x: p.gli_score,
                        y: p.price_per_pyung,
                        name: p.complex_name,
                        age: p.construction_age,
                        households: p.household_count,
                        category: key
                    }));

                return {
                    label: ageStyles[key].label,
                    type: 'scatter',
                    data: points,
                    backgroundColor: ageStyles[key].color,
                    borderColor: '#1e272e',
                    borderWidth: 1.5,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    z: 10
                };
            }).filter(ds => ds.data.length > 0); // 데이터가 존재하는 년차군만 범례에 표시

            // 전체 데이터셋 목록 구성
            const datasets = [
                // 1) 고평가 영역 (Red Zone: Upper Boundary 선 위쪽을 붉은색으로 채움)
                {
                    label: '고평가 영역',
                    type: 'line',
                    data: extendedUpper,
                    borderColor: 'rgba(255, 153, 153, 0.2)',
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: 'end', // 차트 상단 영역 채우기
                    backgroundColor: 'rgba(255, 206, 206, 0.4)',
                    z: 1
                },
                // 2) 안정적 영역 (Grey Zone: Lower Boundary와 Upper Boundary 사이를 회색으로 채움)
                {
                    label: '안정적 영역',
                    type: 'line',
                    data: extendedLower,
                    borderColor: 'rgba(220, 220, 220, 0.3)',
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: 0, // 인덱스 0번(stable_zone_upper)까지 채우기
                    backgroundColor: 'rgba(238, 238, 238, 0.5)',
                    z: 2
                },
                // 3) 저평가 영역 (Blue Zone: Zero Baseline부터 Lower Boundary 사이를 푸른색으로 채움)
                {
                    label: '저평가 영역',
                    type: 'line',
                    data: extendedZero,
                    borderColor: 'transparent',
                    borderWidth: 0,
                    pointRadius: 0,
                    fill: 1, // 인덱스 1번(stable_zone_lower)까지 채우기
                    backgroundColor: 'rgba(195, 216, 255, 0.4)',
                    z: 3
                },
                // 4) GLI 단순 추세선
                {
                    label: `GLI 가치추세선 (r = ${metrics.r_simple.toFixed(2)})`,
                    type: 'line',
                    data: extendedSimple,
                    borderColor: '#888888',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    z: 5
                },
                // 5) 건물가치 보정 추세선
                {
                    label: `건물가치보정추세선 (r = ${metrics.r_multi.toFixed(2)})`,
                    type: 'line',
                    data: extendedCorrected,
                    borderColor: '#d63031',
                    borderWidth: 2,
                    borderDash: [3, 3],
                    pointRadius: 0,
                    fill: false,
                    z: 6
                },
                // 6) 실거래 산점도 점들 추가
                ...scatterDatasets
            ];

            // 차트 객체 초기화 및 렌더링
            new window.Chart(ctx, {
                data: {
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 800
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: '가치총점 (GLI)',
                                font: { size: 12, weight: 'bold' }
                            },
                            min: xMinLimit,
                            max: xMaxLimit,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        },
                        y: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: '단지 평균 평단가 (만원)',
                                font: { size: 12, weight: 'bold' }
                            },
                            min: yMinLimit,
                            max: yMaxLimit,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                padding: 15,
                                font: { size: 11 },
                                // 배경 영역 정보와 추세선/산점도 설명만 남기도록 커스텀 필터링 적용 가능
                                filter: function(item) {
                                    return true; // 기본적으로 전체 범례 노출
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(45, 52, 54, 0.95)',
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            padding: 10,
                            cornerRadius: 6,
                            displayColors: true,
                            callbacks: {
                                // 호버된 타겟이 산점도 데이터일 때만 커스텀 정보를 표시
                                label: function (context) {
                                    const raw = context.raw;
                                    if (raw && raw.name) {
                                        return [
                                            ` 단지명: ${raw.name}`,
                                            ` 평단가: ${raw.y.toLocaleString()} 만원`,
                                            ` 입지점수(GLI): ${raw.x.toFixed(2)}점`,
                                            ` 경과년차: 준공 ${raw.age}년차 (${raw.category})`,
                                            ` 세대수: ${raw.households.toLocaleString()}세대`
                                        ];
                                    }
                                    return null; // 영역 경계선의 툴팁은 숨김
                                }
                            }
                        }
                    }
                }
            });
        });
    };

    // 전역 변수로 노출
    window.GLIChartRenderer = GLIChartRenderer;
})(window);
