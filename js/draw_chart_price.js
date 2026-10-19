function drawPriceChart(duration, prices, maxVal){
  var label = duration
  var data = prices
  var align_number = 'start'  

  var ctx = document.getElementById("priceChart").getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    plugins:[ChartDataLabels],    
    data:{
      labels: label,
      datasets:[{
        data: data,        
        borderColor: "#ff3d38",
        borderWidth: 2,
        backgroundColor: "#ff3d38",
        pointRadius: 0,
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
          suggestedMax: maxVal,
          //suggestedMin: 0,
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
          align: 'top',
          anchor: 'end',
          padding: 3,
          textAlign: 'center',
          font: {
            size: 12,
            weight: 600
          }
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
        label: "매매지수",
        data: salesData,        
        borderColor: "#ff3d38",
        borderWidth: 1,
        backgroundColor: "#ff3d38",
        pointRadius: 1
      },
      {
        label: "전세지수",
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