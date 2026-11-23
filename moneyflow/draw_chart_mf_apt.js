var myMoneyFlowApt_Chart = null;

var APT_COLOR_PALETTE = [
  "#1E90FF", "#00A86B", "#FF7F50", "#4169E1", "#E67E22",
  "#16A085", "#2E86DE", "#8E44AD", "#D35400", "#00B894",
  "#0984E3", "#6C5CE7", "#E84393", "#00CEC9", "#F39C12",
  "#2980B9", "#27AE60", "#C0392B", "#7F8C8D", "#34495E"
];

function getAptRegionColor(index) {
  var pal = (typeof MF_HIGH_CONTRAST_PALETTE !== 'undefined') ? MF_HIGH_CONTRAST_PALETTE : APT_COLOR_PALETTE;
  return pal[index % pal.length];
}

function drawMoneyFlowAptChart(chartDate, datasets, id_name) {
  if (myMoneyFlowApt_Chart) {
    myMoneyFlowApt_Chart.destroy();
    myMoneyFlowApt_Chart = null;
  }

  var totalDuration = 300;
  var delayBetweenPoints = chartDate.length > 0 ? (totalDuration / chartDate.length) : 0;
  var ctx = document.getElementById(id_name).getContext('2d');
  var pluginsList = [ChartDataLabels];
  if (typeof mfFocusShadowPlugin !== 'undefined') pluginsList.push(mfFocusShadowPlugin);
  if (typeof mfEndLabelPlugin !== 'undefined') pluginsList.push(mfEndLabelPlugin);

  myMoneyFlowApt_Chart = new Chart(ctx, {
    type: 'line',
    plugins: pluginsList,
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
          right: 132,
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
        mfEndLabels: {
          enabled: true,
          compact: false
        },
        legend: {
          display: true,
          position: 'left',
          align: 'start',
          onHover: function(e, legendItem, legend) {
            if (typeof mfApplyFocus === 'function') {
              mfApplyFocus(legend.chart, legendItem.datasetIndex);
            }
          },
          onLeave: function(e, legendItem, legend) {
            if (typeof mfApplyFocus === 'function') {
              mfApplyFocus(legend.chart, null);
            }
          },
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
