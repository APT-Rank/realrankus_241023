var SCORE_CHART_COLOR = '#e43b46';

function drawRoundedScoreTrack(ctx, x, y, width, height) {
  var radius = Math.min(height / 2, 5);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

// 수정일: 2026-10-05 — 렌더 완료 후 상세 그래프의 로딩 표시를 닫습니다.
var detailChartLoadingPlugin = {
  id: 'detailChartLoading',
  beforeInit: function(chart) {
    var chartWrapper = chart.canvas.closest('.detail-chart-loading');
    if (!chartWrapper || chartWrapper.querySelector('.detail-chart-spinner')) return;

    var spinner = document.createElement('div');
    spinner.className = 'spinner-border spinner-border-sm text-secondary detail-chart-spinner';
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-label', '차트 로딩 중');
    chartWrapper.appendChild(spinner);
  },
  afterRender: function(chart) {
    var chartWrapper = chart.canvas.closest('.detail-chart-loading');
    var baseModal = document.getElementById('baseModal');
    if (!chartWrapper || !baseModal || !$(baseModal).is(':visible') || !$(chartWrapper).is(':visible')) return;
    chartWrapper.classList.remove('is-chart-loading');
  }
};

// 수정일: 2026-10-05 — 모달 표시 후 차트를 재측정·재렌더링해 숨김 상태의 누락을 방지합니다.
function refreshDetailChartsWhenModalShown() {
  if (typeof Chart === 'undefined') return;
  var baseModal = document.getElementById('baseModal');
  if (!baseModal) return;

  var chartInstances = Chart.instances || {};
  Object.keys(chartInstances).forEach(function(instanceId) {
    var chart = chartInstances[instanceId];
    if (!chart.canvas || !baseModal.contains(chart.canvas)) return;
    if (!chart.canvas.closest('.detail-chart-loading') || !$(chart.canvas).is(':visible')) return;
    chart.resize();
    chart.update('none');
  });

  window.requestAnimationFrame(function() {
    var currentInstances = Chart.instances || {};
    var currentCanvases = new Set(Object.keys(currentInstances).map(function(instanceId) {
      return currentInstances[instanceId].canvas;
    }));
    baseModal.querySelectorAll('.detail-chart-loading.is-chart-loading').forEach(function(chartWrapper) {
      var canvas = chartWrapper.querySelector('canvas');
      if (!canvas || !currentCanvases.has(canvas)) chartWrapper.classList.remove('is-chart-loading');
    });
  });
}

$(function() {
  if (typeof Chart !== 'undefined' && typeof Chart.register === 'function') {
    Chart.register(detailChartLoadingPlugin);
  }
  $('#baseModal').on('shown.bs.modal shown.bs.collapse shown.bs.tab', refreshDetailChartsWhenModalShown);
});

var scoreBarStylePlugin = {
  id: 'scoreBarStyle',
  beforeDatasetsDraw: function(chart) {
    var chartArea = chart.chartArea;
    var xScale = chart.scales.x;
    var firstDataset = chart.getDatasetMeta(0);
    if (!chartArea || !xScale || !firstDataset) return;

    var ctx = chart.ctx;
    var trackStart = xScale.getPixelForValue(0);
    var trackEnd = xScale.getPixelForValue(100);
    ctx.save();
    ctx.fillStyle = '#edf0f3';
    firstDataset.data.forEach(function(bar) {
      var props = bar.getProps ? bar.getProps(['y', 'height'], true) : bar;
      var height = props.height || 9;
      drawRoundedScoreTrack(ctx, trackStart, props.y - height / 2, trackEnd - trackStart, height);
    });
    ctx.restore();
  },
  afterDatasetsDraw: function(chart) {
    var chartArea = chart.chartArea;
    var xScale = chart.scales.x;
    if (!chartArea || !xScale) return;

    var ctx = chart.ctx;
    ctx.save();
    ctx.fillStyle = '#fff';
    [20, 40, 60, 80].forEach(function(tickValue) {
      var tickX = xScale.getPixelForValue(tickValue);
      chart.data.datasets.forEach(function(dataset, datasetIndex) {
        var meta = chart.getDatasetMeta(datasetIndex);
        meta.data.forEach(function(bar) {
          var props = bar.getProps ? bar.getProps(['y', 'height'], true) : bar;
          var height = props.height || 9;
          ctx.fillRect(Math.round(tickX), props.y - height / 2, 1, height);
        });
      });
    });

    chart.data.datasets.forEach(function(dataset, datasetIndex) {
      var meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach(function(bar, index) {
        var props = bar.getProps ? bar.getProps(['y', 'height'], true) : bar;
        var height = props.height || 9;
        var labelY = props.y - height / 2 - 5;
        var value = Number(dataset.data[index]);

        ctx.font = '600 12px Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
        ctx.fillStyle = '#354052';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(normalizeScoreLabel(chart.data.labels[index]), chartArea.left, labelY);

        if (!isFinite(value)) return;
        ctx.font = '700 12px Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
        ctx.fillStyle = '#273247';
        ctx.textAlign = 'right';
        ctx.fillText(value.toFixed(2), chartArea.right, labelY);
      });
    });
    ctx.restore();
  }
};

function normalizeScoreLabel(label) {
  return String(label).replace(/총점/g, '').trim();
}

function drawChart(aptValue, livingScore, transportScore, infraScore, eduScore){
    /*
    var label = ["총점", "주거", "교통", "인프라", "교육"]
    var data = [aptValue, livingScore, transportScore, infraScore, eduScore]    

    if(isNaN(transportScore) || transportScore == 0){
      label = ["총점", "주거", "인프라", "교육"]
      data = [aptValue, livingScore, infraScore, eduScore]        
    }
    if(eduScore == "region"){
      label = ["총점", "공급필요", "인구수", "일자리수"]
      data = [aptValue, livingScore, transportScore, infraScore]        
    }
    */
    var label = (typeof isEn !== 'undefined' && isEn) ? ["Living", "Transport", "Infra", "Education"] : ["주거", "교통", "인프라", "교육"]
    var data = [livingScore, transportScore, infraScore, eduScore]    

    if(isNaN(transportScore) || transportScore == 0){
      label = (typeof isEn !== 'undefined' && isEn) ? ["Living", "Infra", "Education"] : ["주거", "인프라", "교육"]
      data = [livingScore, infraScore, eduScore]        
    }
    if(eduScore == "region"){
      label = (typeof isEn !== 'undefined' && isEn) ? ["Supply", "Population", "Jobs"] : ["공급필요", "인구수", "일자리수"]
      data = [livingScore, transportScore, infraScore]        
    }

    var ctx = document.getElementById("valueChart").getContext('2d');
    var myChart = new Chart(ctx, {
      type: 'bar',
      plugins:[scoreBarStylePlugin],
      data: {          
        labels: label,
        datasets: [{                
          data: data,
          backgroundColor: SCORE_CHART_COLOR,
          borderRadius: 999,
          borderSkipped: false,
          borderColor: [
              'rgba(255,99,132, 0)',
              'rgba(54, 162, 235, 0)',
          ],                
          barThickness: 9,            
        }]
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        layout: { padding: { top: 14 } },
        plugins: {
          legend: { display: false },
          datalabels: { display: false }
        },
        animation: {
          x: { from: 100 }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              color: '#8993a2',
              padding: 6,
              font: { size: 10 }
            },
            grid: { display: false, drawBorder: false, drawTicks: false }
          },
          y: {
            display: false,
            grid: { display: false },
            ticks: { display: false }
          }
        }
      }
  });
}

function drawChart_op(aptValue, transportScore, infraScore, livingScore, eduScore){
  /*
  var label = ["총점", "교통", "인프라", "주거", "교육"]
  var data = [aptValue, transportScore, infraScore, livingScore, eduScore]      
  var color = 'white'
  var align = 'start'

  if(isNaN(transportScore)){
    label = ["총점", "인프라", "주거", "교육"]
    data = [aptValue, infraScore, livingScore, eduScore]        
  }
  if(eduScore == "region"){
    label = ["총점", "공급필요", "인구수", "일자리수"]
    data = [aptValue, livingScore, transportScore, infraScore]        
  }
  */

  var label = (typeof isEn !== 'undefined' && isEn) ? ["Transport", "Infra", "Living", "Education"] : ["교통", "인프라", "주거", "교육"]
  var data = [transportScore, infraScore, livingScore, eduScore]      
  var color = 'white'
  var align = 'start'

  if(isNaN(transportScore)){
    label = (typeof isEn !== 'undefined' && isEn) ? ["Infra", "Living", "Education"] : ["인프라", "주거", "교육"]
    data = [infraScore, livingScore, eduScore]        
  }
  if(eduScore == "region"){
    label = (typeof isEn !== 'undefined' && isEn) ? ["Supply", "Population", "Jobs"] : ["공급필요", "인구수", "일자리수"]
    data = [livingScore, transportScore, infraScore]        
  }

  var colorArray = []
  var alignArray = []
  for (var i = 0; i < data.length ; i++){
    if(data[i] < 85){
      colorArray.push('black')
      alignArray.push('end')
    }
    else{
      colorArray.push('white')
      alignArray.push('start')
    }
  }

  var ctx = document.getElementById("valueChart").getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'bar',
    plugins:[ChartDataLabels],
    data: {          
      labels: label,
      datasets: [{                
        data: data,
        backgroundColor: [
            //'#293249',
            '#4f5e84',
            '#4f5e84',
            '#4f5e84',
            '#4f5e84',
        ],
        borderColor: [
            'rgba(255,99,132, 0)',
            'rgba(54, 162, 235, 0)',
        ],                
        barThickness: 17,            
      }]
    },
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,          
      plugins:{
        legend:{
          display: false
        },            
        datalabels: {
          display: true,
          color: colorArray,
          align: alignArray,
          anchor: 'end',              
          offset: 2,
          textAlign: 'center',
          font: {
            weight: 'bold'
          },              
        },                      
      },
      animation: {            
        x:{
          from: 100
        }
      },
      scales: {
        x:{
          type: 'linear',
          min: 0,
          max: 100,
        },
        myScale: {              
          position: 'left', // `axis` is determined by the position as `'y'`
        }
      }          
    }
});
}

function drawSubChart(score, avgScore, label1, label2, color1, color2, className){
  var element = document.getElementById(className);
  if (!element) return;

  var ctx = element.getContext('2d');
  var data = [score, avgScore];
  var myChart = new Chart(ctx, {
    type: 'bar',
    plugins: [scoreBarStylePlugin],
    data: {
      labels: [normalizeScoreLabel(label1), normalizeScoreLabel(label2)],
      datasets: [{
        data: data,
        backgroundColor: [SCORE_CHART_COLOR, color2],
        borderRadius: 999,
        borderSkipped: false,
        barThickness: 9
      }]
    },
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,
      layout: { padding: { top: 14 } },
      plugins: {
        legend: { display: false },
        datalabels: { display: false }
      },
      animation: {
        x: { from: 100 }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            color: '#8993a2',
            padding: 6,
            font: { size: 10 }
          },
          grid: { display: false, drawBorder: false, drawTicks: false }
        },
        y: {
          display: false,
          grid: { display: false },
          ticks: { display: false }
        }
      }
    }
  });
}

function drawSimulSubChart(score, avgScore, label1, label2, color1, color2, className){
  var element = document.getElementById(className);
  if (!element) return;
  var ctx = element.getContext('2d');
  var color = 'white'
  var align = 'start'
  var data = [score, avgScore]

  var colorArray = []
  var alignArray = []
  for (var i = 0; i < data.length ; i++){
    if(data[i] < 85){
      colorArray.push('black')
      alignArray.push('end')
    }
    else{
      colorArray.push('white')
      alignArray.push('start')
    }
  }

  var myChart = new Chart(ctx, {
    type: 'bar',
    plugins:[ChartDataLabels],
    data: {          
      labels: [label1, label2],
      datasets: [{                
        data: data,
        borderColor:[
          color1,
          color2
        ],
        borderWidth:[
          '2',
          '2',
        ],
        backgroundColor: [
            color1,
            color2,
        ],        
        barThickness: 20,            
      }]
    },
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,        
      plugins:{
        legend:{
          display: false
        },            
        datalabels: {
          display: true,
          color: colorArray,
          align: alignArray,
          anchor: 'end',              
          offset: 2,
          textAlign: 'center',
          font: {
            weight: 'bold'
          },              
        },                      
      },
      animation: {            
        x:{
          from: 100
        }
      },
      scales: {
        x:{
          type: 'linear',
          min: 0,
          max: 100,
        },
        myScale: {              
          position: 'left', // `axis` is determined by the position as `'y'`
        }
      }          
    }
});
}

function drawRankChart(rankMonth, rankData, totalRank){
  var label = rankMonth
  var data = rankData
  var align_number = 'start'  

  if(rankData[rankData.length-2] > totalRank/3){    
    align_number = 'top'
  }
  else{
    align_number = 'start'
  }

  var ctx = document.getElementById("rankChart").getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',    
    plugins:[ChartDataLabels],    
    data:{
      labels: label,
      datasets:[{
        data: data,        
        borderColor: "#ff3d38",
        borderWidth: 1,
        pointRadius: 1.7,
        backgroundColor: "#ff3d38"
      }],
    },
    options: {     
      responsive: true,      
      maintainAspectRatio: false,
      scales:{
        y:{
          display: false,
          //reverse: false,            
          suggestedMax: totalRank,
          suggestedMin: 0,
          ticks:{            
            stepSize: 1,            
          }
        },
        x: {
          ticks: {                
              maxRotation: 45,
              minRotation: 45,
              font: {
                size: 10
              }
          }
      } 
      },
      animation: {            
        y:{
          from: 1
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {              
              return setGrade(context['raw']);
            }
          }
        },
        legend: {
          display: false,
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'show',
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 6,
          textAlign: 'center',
          font: {
              weight: 'bold',
              size: 12
          },
          formatter: function(value, context) {
            return setGrade(value)
          }
        }
      }
    },
});
}

function drawRankChart_op(rankMonth, rankData, totalRank){
  var label = rankMonth
  var data = rankData
  var align_number = 'start'  

  if(rankData[rankData.length-2] > totalRank/3){    
    align_number = 'top'
  }
  else{
    align_number = 'start'
  }

  var ctx = document.getElementById("rankChart").getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: label,
      datasets:[{
        data: data,        
        borderColor: "#293249",
        borderWidth: 1,
        pointRadius: 1.7,
        backgroundColor: "#293249"
      }],
    },

    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      scales:{
        y:{
          display: false,
          reverse: true,            
          suggestedMax: totalRank,
          suggestedMin: 1,
          ticks:{            
            stepSize: 1,            
          }
        },
        x: {
          ticks: {                
              maxRotation: 0,
              font: {
                size: 10
              }
          }
      } 
      },
      animation: {            
        y:{
          from: 1
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',       
          color: 'black',
          align: align_number,
          anchor: 'start',
          padding: 6,
          textAlign: 'center',          
          font: {
            weight: 'bold'
          },              
        }
      }
    },
});
}

function drawPriceRateChart(dateArray, salesArray, rentArray){
  var label = dateArray
  var salesData = salesArray
  var rentData = rentArray  

  var priceRate_ctx = document.getElementById("priceRateChart").getContext('2d');  
  var priceRateChart = new Chart(priceRate_ctx, {    
    type: 'line',    
    data:{
      labels: label,
      datasets:[
      {
        label: (window.LANG === 'en' || sessionStorage.getItem('LANG') === 'en') ? "Sales Index" : "매매지수",
        data: salesData,        
        borderColor: "#ff3d38",
        borderWidth: 1,
        backgroundColor: "#ff3d38",
        pointRadius: 1
      },
      {
        label: (window.LANG === 'en' || sessionStorage.getItem('LANG') === 'en') ? "Rent Index" : "전세지수",
        data: rentData,
        borderColor: "#5589c9",
        borderWidth: 1,
        backgroundColor: "#5589c9",
        pointRadius: 1
      }
    ],
    },

    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      stacked: false,
      scales:{
        yAxes:{
          display: true,
          min: 50,
          max: 150,
          ticks:{            
            stepSize: 50,            
          }
        },
        x: {
          ticks: {                
              maxRotation: 0,
              font: {
                size: 10
              }
          }
        },
      },
      animation: {
        delay: 500, // change delay to suit your needs.
      },
      plugins: {
        legend: {
          display: true,
        },
        title: {
          display: false,          
        }
      }
    },
});
}

var chartView = []

function drawPriceChart(duration, dataset_front, dataset, dataset_end, id_name, priceMax, n){
  var label = duration
  var data = dataset
  var ctx = document.getElementById(id_name).getContext('2d');  
  chartView[n] = new Chart(ctx, {    
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: label,
      datasets:[
        {
          data: dataset_front,        
          borderColor: "#ddd",
          borderWidth: 1,
          backgroundColor: "#ddd",
          pointRadius: 1,
          pointStyle: 'rect',
          hitRadius: 10
          //stepped: true,
        },
        {
          data: dataset,        
          borderColor: "#ff3d38",
          borderWidth: 1,
          backgroundColor: "#ff3d38",
          pointRadius: 1,
          pointStyle: 'rect',
          hitRadius: 10
          //stepped: true,
        },
        {
          data: dataset_end,        
          borderColor: "#ddd",
          borderWidth: 1,
          backgroundColor: "#ddd",
          pointRadius: 1,
          pointStyle: 'rect',
          hitRadius: 10
          //stepped: true,
        }
      ],
    },
    options: {
      interaction: {
        mode: 'index',
        intersect: false,
      },     
      responsive: true,      
      maintainAspectRatio: false,
      scales:{
        y:{
          display: false,
          beginAtZero:true,
          suggestedMax: priceMax,
          suggestedMin: 0,
        },        
        x: {
            ticks: {                
                maxRotation: 0,
                font: {
                  size: 10
                }
            }
        }     
      },
      animation: {
        y:{          
          from: priceMax
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',
          color: 'black',
          align: 'top',
          anchor: 'center',
          padding: 3,
          textAlign: 'center',          
          font: {
            size: 9
          },              
        }        
      }
    },    
});
}

function drawRadarChart(score, label1, color1, className){
    var element = document.getElementById(className);
    if (!element) return;
    var ctx = element.getContext('2d');
    var color = 'white'
    var align = 'start'

    if(score < 85){
      color = 'black'
      align = 'end'
    }
    else{
      color = 'white'
      align = 'start'
    }

    var myChart = new Chart(ctx, {
      type: 'bar',
      plugins:[ChartDataLabels],
      data: {          
        labels: [label1],
        datasets: [{                
          data: [score],
          backgroundColor: [color1],
          barThickness: 15,            
        }]
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,        
        plugins:{
          legend:{
            display: false
          },            
          datalabels: {
            display: true,
            color: color,
            align: align,
            anchor: 'end',              
            offset: 2,
            textAlign: 'center',
            font: {
              weight: 'bold'
            },              
          },                      
        },
        animation: {            
          x:{
            from: 100
          }
        },
        scales: {
          x:{
            type: 'linear',
            min: 0,
            max: 100,
          },
          myScale: {              
            position: 'left', // `axis` is determined by the position as `'y'`
          }
        }          
      }
  });  
}

function drawRadarChart_mobile(score, label1, color1, className){
    var element = document.getElementById(className);
    if (!element) return;
    var ctx = element.getContext('2d');
    var color = 'white'
    var align = 'start'

    if(score < 85){
      color = 'black'
      align = 'end'
    }
    else{
      color = 'white'
      align = 'start'
    }

    var myChart = new Chart(ctx, {
      type: 'bar',
      plugins:[ChartDataLabels],
      data: {          
        labels: [""],
        datasets: [{                
          data: [score],
          backgroundColor: [color1],
          barThickness: 10,            
        }]
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,        
        plugins:{
          legend:{
            display: false
          },            
          datalabels: {
            display: true,
            color: color,
            align: align,
            anchor: 'end',              
            offset: 2,
            textAlign: 'center',
            font: {
              weight: 'bold'
            },              
          },                      
        },
        animation: {            
          x:{
            from: 100
          }
        },
        scales: {
          x:{
            display: true,
            type: 'linear',
            min: 0,
            max: 100,
            ticks:{
              display: false
            }
          },
          y:{
            display: false
          },
        }          
      }
  });  
}
