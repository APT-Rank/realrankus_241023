var myMoneyFlowApt_Chart = null;

var APT_COLOR_PALETTE = [
  "#1E90FF", "#00A86B", "#FF7F50", "#4169E1", "#E67E22",
  "#16A085", "#2E86DE", "#8E44AD", "#D35400", "#00B894",
  "#0984E3", "#6C5CE7", "#E84393", "#00CEC9", "#F39C12",
  "#2980B9", "#27AE60", "#C0392B", "#7F8C8D", "#34495E"
];

function getAptRegionColor(index) {
  return APT_COLOR_PALETTE[index % APT_COLOR_PALETTE.length];
}

function drawMoneyFlowAptChart(chartDate, datasets, id_name) {
  if (myMoneyFlowApt_Chart) {
    myMoneyFlowApt_Chart.destroy();
    myMoneyFlowApt_Chart = null;
  }

  var totalDuration = 300;
  var delayBetweenPoints = chartDate.length > 0 ? (totalDuration / chartDate.length) : 0;
  var ctx = document.getElementById(id_name).getContext('2d');

  myMoneyFlowApt_Chart = new Chart(ctx, {
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
        mode: 'index',
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
      animations: {
        colors: false,
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay: function(ctx) {
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
          delay: function(ctx) {
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
