function drawRankChart(rankMonth, rankData, id_name, max_val){
  var label = rankMonth
  var data = rankData
  var align_number = 'start'  

  var ctx = document.getElementById(id_name).getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: label,
      datasets:[{
        data: data,        
        borderColor: "#005EB8",
        borderWidth: 1,
        backgroundColor: "#005EB8",
      }],
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
        borderColor: "#005EB8",
        borderWidth: 1,
        backgroundColor: "#005EB8",
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
        borderColor: "#005EB8",
        borderWidth: 1,
        pointRadius: 0,
        borderDash: [5, 3],
        backgroundColor: "#005EB8",
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
        borderColor: "#005EB8",        
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
        borderColor: "#005EB8",
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

function drawSupplyChart(rankMonth, rankData, rankData2, id_name, avg10){
  var label = rankMonth
  var data = rankData
  //var data2 = rankData2
  var align_number = 'start'  

  var ctx = document.getElementById(id_name).getContext('2d');
  var myChart = new Chart(ctx, {        
    plugins:[ChartDataLabels],
    data:{
      labels: label,      
      datasets:[{        
        type: 'bar',
        data: data,        
        borderColor: "#005EB8",        
        backgroundColor: 'rgba(0, 94, 184, 0.3)', 
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
        borderColor: "#005EB8",
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
          //stacked: true,
          //suggestedMax: 95,
          //suggestedMin: 0,          
        },
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

function drawNonSalesChart(rankMonth, rankData, id_name){
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
        borderColor: "#005EB8",        
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
      }],
    },
    options: {      
      responsive: true,      
      maintainAspectRatio: false,
      scales:{
        y:{
          display: false,          
          //suggestedMax: 95,
          //suggestedMin: 0,          
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
        borderColor: "#162235",
        borderWidth: 2,
        backgroundColor: "#162235",
        pointRadius: 1
      },
      {
        label: "전세",
        data: rentData,
        borderColor: "#107318",
        borderWidth: 2,
        backgroundColor: "#107318",
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