
var myKOSPI_Chart
var trendline_set = {
    colorMin: "#0c2685",
    colorMax: "#0c2685",
    lineStyle: "dotted",
    width: 1,
}

function drawKOSPIChart(chartDate, chartData, id_name){
  console.log(interaction_mode)
  var totalDuration = 300;
  var delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myKOSPI_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{        
        label: '코스피',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set,
      }]      
    },
    options: {           
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 10,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {             
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {        
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myKOSDAQ_Chart
function drawKOSDAQChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myKOSDAQ_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '코스닥',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myKOSPI200_Chart
function drawKOSPI200Chart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myKOSPI200_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '코스피200',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myDOW_Chart
function drawDOWChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myDOW_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '다우존스',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myNASDAQ_Chart
function drawNASDAQChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myNASDAQ_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '나스닥',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var mySNP_Chart
function drawSNPChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  mySNP_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '나스닥',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myUSDKRW_Chart
function drawUSDKRWChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myUSDKRW_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '달러→원',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myJPYKRW_Chart
function drawJPYKRWChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myJPYKRW_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '100엔→원',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myEURKRW_Chart
function drawEURKRWChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myEURKRW_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '유로→원',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myBTCUSD_Chart
function drawBTCUSDChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myBTCUSD_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '비트코인',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myETHUSD_Chart
function drawETHUSDChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myETHUSD_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '이더리움',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myGold_Chart
function drawGoldChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myGold_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '금',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var mySilver_Chart
function drawSilverChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  mySilver_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '은',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myCopper_Chart
function drawCopperChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myCopper_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '구리',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myWTI_Chart
function drawWTIChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myWTI_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '서부텍사스유',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myDubai_Chart
function drawDubaiChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myDubai_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '두바이유',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myBrent_Chart
function drawBrentChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myBrent_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '브렌트유',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myInterest_Chart
function drawInterestChart(chartDate, chartData1, chartData2, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartDate.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = [chartData1, chartData2]
  myInterest_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],
    data:{
      labels: chartDate,
      datasets:[{
        label: '미국기준금리',
        data: chartData2,        
        borderColor: "#d12145",
        backgroundColor: "#d12145",
        pointRadius: 0,
        borderWidth: 2,
        stepped: true, 
      },{
        label: '한국기준금리',
        data: chartData1,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        borderWidth: 2,
        stepped: true, 
      }
    ],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 0,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: true,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return value.toLocaleString('ko-KR', {minimumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myKO_TotalAsset_Chart
function drawKOTotalAssetChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myKO_TotalAsset_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '한국 통화량',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        //trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value / 1000).toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myUS_TotalAsset_Chart
function drawUSTotalAssetChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myUS_TotalAsset_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '미국 통화량',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        //trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value / 1000000).toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myKO_ExternalMoney_Chart
function drawKOExternalMoneyChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myKO_ExternalMoney_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '한국외환보유고',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        //trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value / 1000000000).toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myKO_BondPublished_Chart
function drawKObondpublishedChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myKO_BondPublished_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '월별 채권 발행액',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        //trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value / 1000).toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myKO_Bondremain_Chart
function drawKObondremainChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myKO_Bondremain_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '누적 채권 잔액',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        //trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value / 1000).toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myKO_TradeOut_Chart
function drawKOtradeoutChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myKO_TradeOut_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '수출액',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value / 100000).toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myKO_TradeIn_Chart
function drawKOtradeinChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myKO_TradeIn_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '수입액',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value / 100000).toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myKO_TradeProfit_Chart
function drawKOtradeprofitChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myKO_TradeProfit_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '경상수지',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value / 100).toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }                  
        }
      }
    },
});
}

var myGDP_Chart
function drawGDPChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myGDP_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: 'GDP(국내총생산)',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value / 1000).toLocaleString('ko-KR', {maximumFractionDigits: 1});
          }                  
        }
      }
    },
});
}

var myGNI_Chart
function drawGNIChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myGNI_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '1인당 GNI',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value*10000).toLocaleString('ko-KR', {maximumFractionDigits: 0});
          }                  
        }
      }
    },
});
}

var myHousingTradeAll_Chart
function drawHousingTradeAllChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myHousingTradeAll_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '주택 매매가격지수',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,
          suggestedMax: 105,
          suggestedMin: 80,
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value).toLocaleString('ko-KR', {maximumFractionDigits: 1});
          }                  
        }
      }
    },
});
}

var myHousingTradeApt_Chart
function drawHousingTradeAptChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myHousingTradeApt_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '아파트 매매가격지수',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,
          suggestedMax: 105,
          suggestedMin: 80,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value).toLocaleString('ko-KR', {maximumFractionDigits: 1});
          }                  
        }
      }
    },
});
}

var myHousingRentAll_Chart
function drawHousingRentAllChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myHousingRentAll_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '주택 전세가격지수',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,
          suggestedMax: 105,
          suggestedMin: 80,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value).toLocaleString('ko-KR', {maximumFractionDigits: 1});
          }                  
        }
      }
    },
});
}

var myHousingRentApt_Chart
function drawHousingRentAptChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myHousingRentApt_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '아파트 전세가격지수',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,
          suggestedMax: 105,
          suggestedMin: 80,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value).toLocaleString('ko-KR', {maximumFractionDigits: 1});
          }                  
        }
      }
    },
});
}

var myMindConsumer_Chart
function drawMindConsumerChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myMindConsumer_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '소비자심리지수',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,
          //suggestedMax: 113,
          //suggestedMin: 60,         
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value).toLocaleString('ko-KR', {maximumFractionDigits: 1});
          }                  
        }
      }
    },
});
}

var myMindEconomy_Chart
function drawMindEconomyChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myMindEconomy_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '경제심리지수',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,
          //suggestedMax: 113,
          //suggestedMin: 60,
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value).toLocaleString('ko-KR', {maximumFractionDigits: 1});
          }                  
        }
      }
    },
});
}

var myDollarIndex_Chart
function drawDollarIndexChart(chartDate, chartData, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartData.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = chartDate   
  myDollarIndex_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '달러인덱스',
        data: chartData,        
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 2,
        trendlineLinear: trendline_set, 
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: true,
          suggestedMax: 110,
          suggestedMin: 95,
          ticks: { 
            stepSize: 5,
          }
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: false,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },          
          formatter: function(value){
            return Number(value).toLocaleString('ko-KR', {maximumFractionDigits: 1});
          }                  
        }
      }
    },
});
}

var myUSBondRate_Chart
function drawUSBondRateChart(chartDate, chartData1, chartData2, chartData3, chartData4, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartDate.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = [chartData1, chartData2, chartData3, chartData4]
  myUSBondRate_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '30년',
        data: chartData1,        
        borderColor: "#d12145",
        backgroundColor: "#d12145",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,        
      },{
        label: '10년',
        data: chartData2,        
        borderColor: "#a61fa4",
        backgroundColor: "#a61fa4",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '5년',
        data: chartData3,
        borderColor: "#21868a",
        backgroundColor: "#21868a",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '3년',
        data: chartData4,
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
      }
    ],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 0,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: true,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },                            
        }
      }
    },
});
}

var myKOBondRate_Chart
function drawKOBondRateChart(chartDate, chartData1, chartData2, chartData3, chartData4, id_name){
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartDate.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  var label = [chartData1, chartData2, chartData3, chartData4]
  myKOBondRate_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '30년',
        data: chartData1,        
        borderColor: "#d12145",
        backgroundColor: "#d12145",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,        
      },{
        label: '10년',
        data: chartData2,        
        borderColor: "#a61fa4",
        backgroundColor: "#a61fa4",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '5년',
        data: chartData3,
        borderColor: "#21868a",
        backgroundColor: "#21868a",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '3년',
        data: chartData4,
        borderColor: "#0c4ea2",
        backgroundColor: "#0c4ea2",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
      }
    ],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: interaction_mode,
        intersect: false,
      },
      layout: {
        padding: {
            left: 0,
            right: 30,
            top: 30,
            bottom: 10
        }
      },
      scales:{              
        y:{
          display: false,          
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
      animation: {            
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: 0, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 0;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
      },
      plugins: {
        legend: {          
          display: true,
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 10,
            boxHeight: 10,
            font:{
              size: 10
            }            
          }
        },
        title: {
          display: false,          
        },
        datalabels: {
          display: 'auto',          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 2,
          textAlign: 'center',          
          font: {            
            size: 11,
          },                            
        }
      }
    },
});
}