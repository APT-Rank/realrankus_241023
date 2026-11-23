var myMoneyFlow_Chart = null;

function drawMoneyFlowChart(chartDate, datasets, id_name){
  if (myMoneyFlow_Chart) {
    myMoneyFlow_Chart.destroy();
    myMoneyFlow_Chart = null;
  }

  const totalDuration = 300;
  const delayBetweenPoints = chartDate.length > 0 ? (totalDuration / chartDate.length) : 0;
  var ctx = document.getElementById(id_name).getContext('2d');

  myMoneyFlow_Chart = new Chart(ctx, {
    type: 'line',
    plugins: [ChartDataLabels],
    data: {
      labels: chartDate,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false
      },
      layout: {
        padding: {
          left: 0,
          right: 30,
          top: 10,
          bottom: 10
        }
      },
      scales: {
        y: {
          display: false
        },
        x: {
          ticks: {
            maxRotation: 60,
            font: {
              size: 10
            }
          }
        }
      },
      // 2026-11-08: 초기 로드/기간 변경 시 colors 페이드인(from: transparent) 비활성화하여
      // 캡처 타이밍에 관계없이 선/포인트/텍스트가 100% 온전한 불투명도로 유지되도록 수정
      animations: {
        colors: false,
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        }
      },
      plugins: {
        tooltip: {
          enabled: (typeof mfTooltipEnabled !== 'undefined' ? mfTooltipEnabled : true)
        },
        legend: {
          display: true,
          position: 'left',
          align: 'start',
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            font: {
              size: 11
            }
          }
        },
        title: {
          display: false
        },
        datalabels: {
          display: 'auto',
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',
          font: {
            size: 11
          },
          formatter: function(value) {
            if (value === null || value === undefined || isNaN(value)) {
              return '';
            }
            return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
          }
        }
      }
    }
  });
}
