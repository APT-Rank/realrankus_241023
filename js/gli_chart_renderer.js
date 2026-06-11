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

            const isEn = options.isEn || false;

            // CSS 스타일 동적 인젝션
            const styleId = 'gli-chart-custom-styles';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.innerHTML = `
                    .gli-chart-legend {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px 12px;
                        background: rgba(255, 255, 255, 0.95);
                        border: 1px solid #ddd;
                        padding: 6px 10px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        font-size: 11px;
                        color: #333;
                        margin-top: 6px;
                        justify-content: center;
                        width: 100%;
                        box-sizing: border-box;
                    }
                    .gli-legend-item {
                        display: flex;
                        align-items: center;
                    }
                    .gli-legend-color-box {
                        width: 16px;
                        height: 10px;
                        margin-right: 4px;
                        margin-top: 2px;
                        border-radius: 2px;
                    }
                    .gli-legend-line {
                        width: 16px;
                        height: 0;
                        border-top: 2px dashed;
                        margin-right: 8px;
                    }
                    .gli-legend-circle {
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        margin-right: 4px;
                        margin-left: 4px;
                        margin-top: 2px;
                        border: 1.5px solid #1e272e;
                    }
                    .gli-chart-watermark {
                        position: absolute;
                        bottom: 60px;
                        right: 40px;
                        text-align: right;
                        z-index: 10;
                        pointer-events: none;
                        display: flex;
                        flex-direction: column;
                        align-items: flex-end;
                    }
                    .gli-watermark-logo {
                        height: 40px;
                        margin-bottom: 2px;
                        border-radius: 6px;
                    }
                    .gli-watermark-text {
                        font-size: 0.85em;
                        color: #777;
                        line-height: 1.2;
                    }
                    .gli-chart-legend-mobile {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px 12px;
                        background: rgba(255, 255, 255, 0.95);
                        border: 1px solid #ddd;
                        padding: 4px 4px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        font-size: 10px;
                        color: #333;
                        margin-top: 6px;
                        justify-content: flex-start;
                        width: 100%;
                        box-sizing: border-box;
                    }
                    .gli-chart-legend-mobile .gli-legend-item {
                        display: flex;
                        align-items: center;
                    }
                    @media screen and (max-width: 799px) {

                        .gli-legend-color-box {
                            width: 12px;
                            height: 10px;
                            margin-right: 5px;
                            margin-top: 2px;
                        }
                        .gli-legend-line {
                            width: 12px;
                            margin-right: 5px;
                        }
                        .gli-legend-circle {
                            width: 10px;
                            height: 10px;
                            margin-top: 2px;
                            margin-right: 4px;
                            margin-left: 0px;
                        }
                        .gli-chart-watermark {
                            bottom: 20px;
                            right: 8px;
                        }
                        .gli-watermark-logo {
                            height: 20px;
                        }
                        .gli-watermark-text {
                            font-size: 0.5em;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            // 기존 차트나 캔버스가 존재하면 제거 (중복 렌더링 방지)
            container.innerHTML = '';

            // 모바일 감지
            const isMobileView = window.innerWidth < 800;

            // absolute 레이아웃을 위한 래퍼 생성
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.width = '100%';
            if (isMobileView) {
                wrapper.style.height = 'calc(100% - 90px)';
            } else {
                wrapper.style.height = 'calc(100% - 60px)'; // 웹/데스크톱도 하단 범례 공간 확보
            }
            container.appendChild(wrapper);

            const canvas = document.createElement('canvas');
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            wrapper.appendChild(canvas);

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
                "신축 (5년미만)": { color: "#ff0000", label: isEn ? "New (Under 5yr)" : "신축 (5년 미만)" },
                "준신축 (5~10년)": { color: "#ff9900", label: isEn ? "Semi-New (5~10yr)" : "준신축 (5~10년)" },
                "구축 (10~25년)": { color: "#0066cc", label: isEn ? "Established (10~25yr)" : "구축 (10~25년)" },
                "노후 (25년이상)": { color: "#808080", label: isEn ? "Old (Over 25yr)" : "노후 (25년 이상)" }
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
                    borderWidth: isMobileView ? 1 : 1.5,
                    pointRadius: isMobileView ? 6 : 8,
                    pointHoverRadius: isMobileView ? 10 : 10,
                    order: 1,
                    clip: true, // 확대/축소 시 차트 영역 밖의 점 클리핑
                    // 이 데이터셋에만 데이터레이블을 활성화하여 아파트 단지명을 위에 표기
                    datalabels: {
                        display: true,
                        align: 'top',
                        anchor: 'center',
                        offset: isMobileView ? 2 : 4,
                        clip: true, // 라벨 클리핑 추가
                        formatter: function (value) {
                            return value.name;
                        },
                        font: {
                            size: isMobileView ? 10 : 12,
                            weight: 'bold'
                        },
                        color: '#333'
                    }
                };
            }).filter(ds => ds.data.length > 0); // 데이터가 존재하는 년차군만 범례에 표시

            // 다국어 번역 레이블 정의
            const labelOvervalued = isEn ? 'Overvalued Zone' : '고평가 영역';
            const labelStable = isEn ? 'Stable Zone' : '안정적 영역';
            const labelUndervalued = isEn ? 'Undervalued Zone' : '저평가 영역';
            const labelSimpleTrend = isEn ? 'GLI Trendline' : 'GLI 가치추세선';
            const labelCorrectedTrend = isEn ? 'Building Value Corrected Trendline' : '건물가치보정추세선';

            // 전체 데이터셋 목록 구성
            const datasets = [
                // 1) 고평가 영역 (Red Zone: Upper Boundary 선 위쪽을 붉은색으로 채움)
                {
                    label: labelOvervalued,
                    type: 'line',
                    data: extendedUpper,
                    borderColor: 'rgba(255, 153, 153, 0.2)',
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: 'end', // 차트 상단 영역 채우기
                    backgroundColor: 'rgba(255, 206, 206, 0.4)',
                    order: 10
                },
                // 2) 안정적 영역 (Grey Zone: Lower Boundary와 Upper Boundary 사이를 회색으로 채움)
                {
                    label: labelStable,
                    type: 'line',
                    data: extendedLower,
                    borderColor: 'rgba(220, 220, 220, 0.3)',
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: 0, // 인덱스 0번(stable_zone_upper)까지 채우기
                    backgroundColor: 'rgba(238, 238, 238, 0.5)',
                    order: 11
                },
                // 3) 저평가 영역 (Blue Zone: Zero Baseline부터 Lower Boundary 사이를 푸른색으로 채움)
                {
                    label: labelUndervalued,
                    type: 'line',
                    data: extendedZero,
                    borderColor: 'transparent',
                    borderWidth: 0,
                    pointRadius: 0,
                    fill: 1, // 인덱스 1번(stable_zone_lower)까지 채우기
                    backgroundColor: 'rgba(195, 216, 255, 0.4)',
                    order: 12
                },
                // 4) GLI 단순 추세선
                {
                    label: `${labelSimpleTrend} (r = ${metrics.r_simple.toFixed(2)})`,
                    type: 'line',
                    data: extendedSimple,
                    borderColor: '#888888',
                    borderWidth: 1.5,
                    borderDash: [3, 3],
                    pointRadius: 0,
                    fill: false,
                    order: 7
                },
                // 5) 건물가치 보정 추세선
                {
                    label: `${labelCorrectedTrend} (r = ${metrics.r_multi.toFixed(2)})`,
                    type: 'line',
                    data: extendedCorrected,
                    borderColor: '#d63031',
                    borderWidth: 1.5,
                    borderDash: [3, 3],
                    pointRadius: 0,
                    fill: false,
                    order: 6
                },
                // 6) 실거래 산점도 점들 추가
                ...scatterDatasets
            ];

            const xAxisTitle = isEn ? 'Value Score (GLI)' : '가치총점 (GLI)';
            const yAxisTitle = isEn ? 'Average Price per Pyung' : '단지 평균 평단가';

            // 차트 객체 초기화 및 렌더링
            const chartPlugins = [];
            if (typeof ChartDataLabels !== 'undefined') {
                chartPlugins.push(ChartDataLabels);
            }
            if (typeof ChartZoom !== 'undefined') {
                chartPlugins.push(ChartZoom);
            }
            new window.Chart(ctx, {
                plugins: chartPlugins,
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
                                display: !isMobileView,
                                text: xAxisTitle,
                                font: { size: 12, weight: 'bold' }
                            },
                            min: xMinLimit,
                            max: xMaxLimit,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: {
                                font: { size: isMobileView ? 9 : 12 },
                                precision: 0,
                                callback: function (value) {
                                    if (value % 1 === 0) {
                                        return value;
                                    }
                                    return '';
                                }
                            }
                        },
                        y: {
                            type: 'linear',
                            title: {
                                display: !isMobileView,
                                text: yAxisTitle,
                                font: { size: 12, weight: 'bold' }
                            },
                            min: yMinLimit,
                            max: yMaxLimit,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: {
                                font: { size: isMobileView ? 9 : 12 },
                                callback: function (value) {
                                    if (isEn) {
                                        if (value >= 100) {
                                            const val = value / 100;
                                            return val.toFixed(val % 1 === 0 ? 0 : 1) + 'M';
                                        }
                                        const val = value * 10;
                                        return val.toFixed(val % 1 === 0 ? 0 : 1) + 'K';
                                    } else {
                                        if (value >= 1000) {
                                            const val = value / 1000;
                                            return val.toFixed(val % 1 === 0 ? 0 : 1) + '천만';
                                        }
                                        if (value >= 100) {
                                            const val = value / 100;
                                            return val.toFixed(val % 1 === 0 ? 0 : 1) + '백만';
                                        }
                                        return value.toFixed(value % 1 === 0 ? 0 : 1) + '만';
                                    }
                                }
                            }
                        }
                    },
                    plugins: {
                        // 기본 레전드는 비활성화
                        legend: {
                            display: false
                        },
                        // 데이터레이블 기본값 설정 (산점도 외에는 그리지 않음)
                        datalabels: {
                            display: false
                        },
                        tooltip: {
                            filter: function (tooltipItem) {
                                // Only show tooltips for scatter points
                                return tooltipItem.dataset.type === 'scatter';
                            },
                            backgroundColor: 'rgba(45, 52, 54, 0.95)',
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            padding: 10,
                            cornerRadius: 6,
                            displayColors: true,
                            callbacks: {
                                title: function () {
                                    return '';
                                },
                                // 호버된 타겟이 산점도 데이터일 때만 커스텀 정보를 표시
                                label: function (context) {
                                    const raw = context.raw;
                                    if (raw && raw.name) {
                                        //raw.y의 소수점 제거하여 천 단위 구분 쉼표 추가 후 'k/py' 또는 '만원/평' 단위로 표시
                                        py_price = Math.round(raw.y).toLocaleString() + (isEn ? 'k/py' : '만원/평');
                                        return [
                                            isEn ? ` ${raw.name}` : ` ${raw.name}`,
                                            ` ${py_price}`,
                                            //isEn ? ` Score (GLI): ${raw.x.toFixed(2)} pts` : ` 입지점수(GLI): ${raw.x.toFixed(2)}점`,
                                            isEn ? ` Built ${raw.age} yrs` : ` ${raw.age}년차`,
                                            isEn ? ` ${raw.households.toLocaleString()} units` : ` ${raw.households.toLocaleString()}세대`
                                        ];
                                    }
                                    return null; // 영역 경계선의 툴팁은 숨김
                                }
                            }
                        },
                        // 핀치 줌 / 휠 줌 설정
                        zoom: {
                            zoom: {
                                wheel: { enabled: true },
                                pinch: { enabled: true },
                                mode: 'xy'
                            },
                            pan: {
                                enabled: true,
                                mode: 'xy'
                            },
                            limits: {
                                x: { min: xMinLimit, max: xMaxLimit },
                                y: { min: yMinLimit, max: yMaxLimit }
                            }
                        }
                    }
                }
            });

            // 1. 프리미엄 커스텀 HTML 레전드 렌더링
            const legendDiv = document.createElement('div');
            legendDiv.className = isMobileView ? 'gli-chart-legend-mobile' : 'gli-chart-legend';

            // 영역 목록
            const zones = [
                { color: 'rgba(255, 206, 206, 0.7)', label: labelOvervalued },
                { color: 'rgba(238, 238, 238, 0.9)', label: labelStable },
                { color: 'rgba(195, 216, 255, 0.7)', label: labelUndervalued }
            ];
            zones.forEach(z => {
                const item = document.createElement('div');
                item.className = 'gli-legend-item';
                item.innerHTML = `<div class="gli-legend-color-box" style="background-color: ${z.color}; border: 1px solid rgba(0,0,0,0.15);"></div><span>${z.label}</span>`;
                legendDiv.appendChild(item);
                //모바일인 경우 영역과 추세선 사이에 줄바꿈 추가, 그렇지 않으면 줄바꿈 없이 한 줄로 표시
                if (isMobileView) {
                    const br = document.createElement('br');                
                    legendDiv.appendChild(br); // 영역과 추세선 사이에 줄바꿈 추가
                }
            });

            // 추세선 목록
            const lines = [
                { color: '#888888', label: `${labelSimpleTrend} (r = ${metrics.r_simple.toFixed(2)})` },
                { color: '#d63031', label: `${labelCorrectedTrend} (r = ${metrics.r_multi.toFixed(2)})` }
            ];
            lines.forEach(l => {
                const item = document.createElement('div');
                item.className = 'gli-legend-item';
                item.innerHTML = `<div class="gli-legend-line" style="border-top-color: ${l.color};"></div><span>${l.label}</span>`;
                legendDiv.appendChild(item);
                if (isMobileView) {
                    const br = document.createElement('br');
                    legendDiv.appendChild(br); // 추세선과 준공 년차 사이에 줄바꿈 추가
                }
            });

            // 준공 년차 목록
            Object.keys(ageStyles).forEach(key => {
                const style = ageStyles[key];
                const item = document.createElement('div');
                item.className = 'gli-legend-item';
                item.innerHTML = `<div class="gli-legend-circle" style="background-color: ${style.color};"></div><span>${style.label}</span>`;
                legendDiv.appendChild(item);
            });

            container.appendChild(legendDiv);

            // 2. 워터마크 렌더링
            const watermarkDiv = document.createElement('div');
            watermarkDiv.className = 'gli-chart-watermark';

            //현재 언어가 영어이면 ../ 경로로, 아니면 ./ 경로로 설정
            const prefix = isEn ? '../' : './';
            const logoUrl = prefix + 'apr-rank.png';

            const now = new Date();
            const pad = (num) => String(num).padStart(2, '0');
            const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

            watermarkDiv.innerHTML = `
                <img src="${logoUrl}" class="gli-watermark-logo" alt="Realrankus" />
                <div class="gli-watermark-text">powered by Realrankus</div>
                <div class="gli-watermark-text">${formattedDate}</div>
            `;
            wrapper.appendChild(watermarkDiv);
        });
    };

    /**
     * chartWrapper 영역을 html2canvas로 캡처하여 PNG 이미지로 다운로드합니다.
     * @param {string} wrapperId - 캡처할 래퍼 요소의 ID (기본: 'chartWrapper')
     * @param {string} filename - 다운로드 파일명
     */
    GLIChartRenderer.downloadChartImage = function (wrapperId, filename) {
        const wrapper = document.getElementById(wrapperId || 'chartWrapper');
        if (!wrapper) {
            console.error('캡처할 래퍼를 찾을 수 없습니다.');
            return;
        }
        if (typeof html2canvas === 'undefined') {
            alert('이미지 캡처 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
            return;
        }

        html2canvas(wrapper, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scale: 2
        }).then(function (canvas) {
            const base64Data = canvas.toDataURL('image/png');
            const targetFilename = filename || 'GLI_chart.png';

            // 안드로이드 하이브리드 앱 웹뷰 환경인지 검사
            if (window.Android && typeof window.Android.downloadImage === 'function') {
                // 네이티브 저장 메서드 호출
                window.Android.downloadImage(base64Data, targetFilename);
            } else {
                // 일반 웹 브라우저 환경
                var link = document.createElement('a');
                link.download = targetFilename;
                link.href = base64Data;
                link.click();
            }
        }).catch(function (err) {
            console.error('이미지 캡처 실패:', err);
            alert('이미지 다운로드에 실패했습니다.');
        });
    };

    // 전역 변수로 노출
    window.GLIChartRenderer = GLIChartRenderer;
})(window);
