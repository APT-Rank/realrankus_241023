var myMoneyFlow_Chart

function drawMoneyFlowChart(chartDate, mf_dataset, id_name){
  //console.log(mf_dataset)
  const totalDuration = 300;
  const delayBetweenPoints = totalDuration / chartDate.length;
  var ctx = document.getElementById(id_name).getContext('2d');
  const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  //var label = [chartData1, chartData2, chartData3, chartData4]
  myMoneyFlow_Chart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: chartDate,
      datasets:[{
        label: '미국 통화량',
        data: mf_dataset[0],        
        borderColor: "#d12145",
        backgroundColor: "#d12145",
        pointRadius: 0,
        borderWidth: 4,
        tension: 0.2,
        hidden: false
      },{
        label: '한국 통화량',
        data: mf_dataset[1],        
        borderColor: "#571091",
        backgroundColor: "#571091",
        pointRadius: 0,
        borderWidth: 4,
        tension: 0.2,
        hidden: false
      },{
        label: '서부텍사스유',
        data: mf_dataset[2],
        borderColor: "#87867c",
        backgroundColor: "#87867c",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '두바이유',
        data: mf_dataset[3],
        borderColor: "#616057",
        backgroundColor: "#616057",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{        
        label: '금',
        data: mf_dataset[4],
        borderColor: "#FFD700",
        backgroundColor: "#FFD700",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },/*{        
        label: '한국 주택 매매지수',
        data: mf_dataset[5],
        borderColor: "#1c5499",
        backgroundColor: "#1c5499",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '한국 아파트 매매지수',
        data: mf_dataset[6],
        borderColor: "#1c2499",
        backgroundColor: "#1c2499",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },*/{
        label: '전국 아파트',
        data: mf_dataset[7],
        borderColor: "#1E90FF",
        backgroundColor: "#1E90FF",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '수도권 아파트',
        data: mf_dataset[17],
        borderColor: "#4682B4",
        backgroundColor: "#4682B4",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '지방권 아파트',
        data: mf_dataset[18],
        borderColor: "#00BFFF",
        backgroundColor: "#00BFFF",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '서울시 아파트',
        data: mf_dataset[19],
        borderColor: "#5F9EA0",
        backgroundColor: "#5F9EA0",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '경기도 아파트',
        data: mf_dataset[20],
        borderColor: "#4169E1",
        backgroundColor: "#4169E1",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '6대광역시 아파트',
        data: mf_dataset[21],
        borderColor: "#87CEFA",
        backgroundColor: "#87CEFA",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{        
        label: '미국 NASDAQ',
        data: mf_dataset[8],
        borderColor: "#2f631e",
        backgroundColor: "#2f631e",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '미국 DOW',
        data: mf_dataset[9],
        borderColor: "#3b991c",
        backgroundColor: "#3b991c",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '미국 S&P',
        data: mf_dataset[10],
        borderColor: "#13d43d",
        backgroundColor: "#13d43d",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '한국 코스피',
        data: mf_dataset[11],
        borderColor: "#9c2557",
        backgroundColor: "#9c2557",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '한국 코스닥',
        data: mf_dataset[12],
        borderColor: "#9c2570",
        backgroundColor: "#9c2570",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '코스피+코스닥',
        data: mf_dataset[13],
        borderColor: "#e02bbc",
        backgroundColor: "#e02bbc",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '원-달러',
        data: mf_dataset[14],
        borderColor: "#8B4513",
        backgroundColor: "#8B4513",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      },{
        label: '원-100엔',
        data: mf_dataset[15],
        borderColor: "#CD853F",
        backgroundColor: "#CD853F",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
      }
      ,{
        label: '비트코인',
        data: mf_dataset[16],
        borderColor: "#E1AD01",
        backgroundColor: "#E1AD01",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
        hidden: true
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
          from: NaN, // the point is initially skipped
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
            return value.toLocaleString('ko-KR', {maximumFractionDigits: 2});
          }  
        }
      }
    },
});
}