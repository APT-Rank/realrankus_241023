function drawRankChart(rankMonth, rankData, id_name, max_val1, max_val2){
  var label = rankMonth
  var data_pop = rankData[0]
  var data_house = rankData[1]
  var align_number = 'start'  

  var ctx = document.getElementById(id_name).getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: label,
      datasets:[{
        label: '인구',
        data: data_pop,        
        borderColor: "#0c4ea2",
        borderWidth: 1,
        backgroundColor: "#0c4ea2",
        yAxisID: 'POP'
      },
      {
        label: '세대',
        data: data_house,        
        borderColor: "#148f2f",
        borderWidth: 1,
        backgroundColor: "#148f2f",
        yAxisID: 'HOUSE'
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales:{        
        y:{
          display: false,          
        },
        x: {
          ticks: {                
              maxRotation: 0,
              font: {
                size: 12
              }
          }
        },
        POP:{
          type: 'linear',
          display: true,
          position: 'left',
          suggestedMax: max_val1,
          grid: {
            drawOnChartArea: false,
          },
          ticks:{
            stepSize: 20000,
            callback: function(value, index, ticks){
              return (value/10000).toFixed(0)
            }
          }
        },
        HOUSE:{
          display: true,
          type: 'linear',
          position: 'right',
          suggestedMax: max_val2,
          grid: {
            drawOnChartArea: false,
          },
          ticks:{
            stepSize: 10000,
            callback: function(value, index, ticks){
              return (value/10000).toFixed(0)
            }
          }
        }
      },
      animation: {            
        y:{
          from: 200
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
          padding: 4,
          textAlign: 'center',          
          font: {            
            size: 11,
          },
          formatter: function(value) {
            return (value/10000).toFixed(1) + "만";
          }              
        }
      }
    },
});
}

function drawPriceChart(rankMonth, rankData, rankData2, id_name, max_val1, max_val2){
  var label = rankMonth
  var sales_data = rankData
  var rent_data = rankData2
  var align_number = 'start'  

  var ctx = document.getElementById(id_name).getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: label,
      datasets:[{
        label: '매매',
        data: sales_data,
        borderColor: "#0c4ea2",
        borderWidth: 1,
        backgroundColor: "#0c4ea2",
        yAxisID: 'SALE'
      },
      {
        label: '전세',
        data: rent_data,
        borderColor: "#148f2f",
        borderWidth: 1,
        backgroundColor: "#148f2f",
        yAxisID: 'RENT'
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales:{
        y:{
          display: false,          
        },
        x: {
          ticks: {                
              maxRotation: 0,
              font: {
                size: 12
              }
          }
        },
        SALE:{
          type: 'linear',
          display: true,
          position: 'left',
          suggestedMax: max_val1,
          grid: {
            drawOnChartArea: false,
          },
          ticks:{
            stepSize: 0.5,
            callback: function(value, index, ticks){
              return (value).toFixed(1)
            }
          }
        },
        RENT:{
          display: true,
          type: 'linear',
          position: 'right',
          suggestedMax: max_val2,
          grid: {
            drawOnChartArea: false,
          },
          ticks:{
            stepSize: 0.5,
            callback: function(value, index, ticks){
              return (value).toFixed(1)
            }
          }
        }
      },
      animation: {            
        y:{
          from: 200
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
          padding: 4,
          textAlign: 'center',          
          font: {            
            size: 11,
          },            
        }
      }
    },
});
}

function drawPIRBPChart(rankMonth, rankData, rankData2, id_name, max_val1, max_val2){
  var label = rankMonth
  var sales_data = rankData
  var rent_data = rankData2
  var align_number = 'start'  

  var ctx = document.getElementById(id_name).getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: label,
      datasets:[{
        label: 'PIR',
        data: sales_data,
        borderColor: "#0c4ea2",
        borderWidth: 1,
        backgroundColor: "#0c4ea2",
        yAxisID: 'PIR'
      },
      {
        label: '부담지수',
        data: rent_data,
        borderColor: "#148f2f",
        borderWidth: 1,
        backgroundColor: "#148f2f",
        yAxisID: 'BP'
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales:{
        y:{
          display: false,          
          suggestedMax: max_val1,
        },
        x: {
          ticks: {                
              maxRotation: 0,
          }
        },
        PIR:{
          type: 'linear',
          display: false,
          position: 'left',
          suggestedMax: 50
        },
        BP:{
          display: false,
          type: 'linear',
          position: 'right',
          suggestedMax: max_val2
        }
      },
      animation: {            
        y:{
          from: 200
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
          padding: 4,
          textAlign: 'center',          
          font: {            
            size: 11,
          },            
        },    
      }
    },
});
}

function drawDealChart(rankMonth, rankData, id_name, max_val, avg10){
  var label = rankMonth
  var data = rankData
  var align_number = 'start'  

  var ctx = document.getElementById(id_name).getContext('2d');
  var myChart = new Chart(ctx, {    
    plugins:[ChartDataLabels],    
    data:{
      labels: label,
      datasets:[{
        type: 'line',
        data: data,        
        borderColor: "#0c4ea2",
        borderWidth: 1,
        backgroundColor: "#0c4ea2",
        datalabels: {
          display: true,          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 4,
          textAlign: 'center',          
          font: {            
            size: 11,
          },              
        }
      },
      {
        type: 'line',
        data: avg10,        
        borderColor: "#0c4ea2",
        borderWidth: 1,
        pointRadius: 0,
        borderDash: [5, 3],
        backgroundColor: "#0c4ea2",
        datalabels: {
          display: false
        }
      }
    ],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      scales:{
        y:{
          display: false,          
          suggestedMax: max_val,
          //suggestedMin: min_val,
          //ticks:{            
          //  stepSize: 0.1,
          //}
        }
      },
      x: {
        ticks: {                
            maxRotation: 0,
        }
      },
      animation: {            
        y:{
          from: 200
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,          
        },        
      }
    },
});
}

function drawRentChart(rankMonth, rankData, id_name, avg10){
  var label = rankMonth
  var data = rankData
  var align_number = 'start'  

  var ctx = document.getElementById(id_name).getContext('2d');
  var myChart = new Chart(ctx, {        
    plugins:[ChartDataLabels],
    data:{
      labels: label,      
      datasets:[{        
        type: 'bar',
        data: data,        
        borderColor: "#0c4ea2",        
        backgroundColor: 'rgba(0, 94, 184, 0.3)', 
        order:0,
        datalabels: {
          display: true,
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 4,
          textAlign: 'center',          
          font: {
            weight: 'bold',
            size: 11,
          },              
        },
      },
      {
        type: 'line',
        data: avg10,        
        borderColor: "#0c4ea2",
        fill: false,
        borderWidth: 1,
        pointRadius: 0,
        borderDash: [5, 3],
        order:1,
        datalabels: {
          display: false
        }
      }
    ],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      scales:{
        y:{
          display: false,
          suggestedMax: 95,
          suggestedMin: 0,
          ticks:{            
            stepSize: 20,
          }
        }
      },
      animation: {            
        y:{
          from: 100
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,          
        }        
      }
    },
});
}

function drawSupplyChart(rankMonth, rankData, rankData2, id_name, avg10, max_val){
  var label = rankMonth
  var data = rankData
  var data2 = rankData2
  var align_number = 'start'  

  var ctx = document.getElementById(id_name).getContext('2d');
  var myChart = new Chart(ctx, {        
    plugins:[ChartDataLabels],
    data:{
      labels: label,      
      datasets:[{        
        type: 'bar',
        label: '입주',
        data: data,        
        borderColor: "rgba(0, 94, 184, 0.3)",
        borderWidth: 1,
        backgroundColor: 'rgba(0, 94, 184, 0.3)',
        datalabels: {
          display: true,
          color: 'black',
          align: 'center',
          anchor: 'center',          
          textAlign: 'center',          
          font: {
            weight: 'bold',
            size: 11,
          },
          /*            
          formatter: function(value){
            return (Number(value)).toLocaleString()
          }
          */              
        },
      },
      {        
        type: 'bar',
        label: '분양',
        data: data2,        
        borderColor: "rgba(20, 143, 47, 0.3)",
        borderWidth: 1,       
        backgroundColor: 'rgba(20, 143, 47, 0.3)',
        datalabels: {
          display: true,
          color: 'black',
          align: 'center',
          anchor: 'end',          
          textAlign: 'center',          
          padding: 4,
          font: {
            weight: 'bold',
            size: 11,
          },
          formatter: function(value){
            if(value == 0){
              return null
            }
            else{
              //return ( Number(value) ).toLocaleString()              
            }
          }  
        },
      },
      {
        type: 'line',
        data: avg10,
        label: '적정',      
        borderColor: "#0c4ea2",
        fill: false,
        borderWidth: 1,
        pointRadius: 0,
        borderDash: [5, 3],
        order:1,
        datalabels: {
          display: false,
          formatter: function(value, context) {            
            return Number(value).toLocaleString();
          }
        }
      }
    ],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      scales:{
        y:{
          display: false,
          stacked: true,
          suggestedMax: max_val,
          suggestedMin: 0,          
        },
        x:{
          stacked: true
        }
      },
      animation: {            
        y:{
          from: 100
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
        }        
      }
    },
});
}

function drawNonSalesChart(rankMonth, rankData, id_name, max_val){
  var label = rankMonth
  var data = rankData
  var align_number = 'start'  

  var ctx = document.getElementById(id_name).getContext('2d');
  var myChart = new Chart(ctx, {        
    plugins:[ChartDataLabels],
    data:{
      labels: label,      
      datasets:[{        
        type: 'line',
        data: data,        
        borderColor: "#0c4ea2",
        borderWidth: 1,
        backgroundColor: "#0c4ea2",
        datalabels: {
          display: true,          
          color: 'black',
          align: 'top',
          anchor: 'start',
          padding: 4,
          textAlign: 'center',          
          font: {            
            size: 11,
          },
        }
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      scales:{
        y:{
          display: false,          
          suggestedMax: max_val,
          min: 0,          
        }
      },
      animation: {            
        y:{
          from: 100
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,          
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
    plugins:[ChartDataLabels],   
    type: 'line',    
    data:{
      labels: label,
      datasets:[
      {
        label: "매매",
        data: salesData,        
        borderColor: "#0c4ea2",
        borderWidth: 1,
        backgroundColor: "#0c4ea2",
        pointRadius: 1
      },
      {
        label: "전세",
        data: rentData,
        borderColor: "#148f2f",
        borderWidth: 1,
        backgroundColor: "#148f2f",
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
          min: 60,
          max: 140,
          ticks:{            
            stepSize: 25,            
          }
        },
        x: {
          ticks: {                
              maxRotation: 0,
              font: {
                size: 12
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
          position: 'left',
          align: 'start',
          labels:{
            boxWidth: 12,
            boxHeight: 12,
            font:{
              size: 12
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
          padding: 4,
          textAlign: 'center',          
          font: {            
            size: 12,
            weight: 600,
          },

          /*
          formatter: function(value){
            return (value/10000).toFixed(1) + "만";
          }
          */
        }
      }
    },
});
}