const firebaseConfig = {
	apiKey: "AIzaSyA7s95oaj498XdArjo9cT_8watLVw4JK3M",
	authDomain: "aptrank-cc61b.firebaseapp.com",
	databaseURL: "https://aptrank-cc61b-default-rtdb.firebaseio.com",
	projectId: "aptrank-cc61b",
	storageBucket: "aptrank-cc61b.appspot.com",
	messagingSenderId: "987401326011",
	appId: "1:987401326011:web:8732d04a9fc69280d7489e",
	measurementId: "G-BH5DRBH380"
  };

firebase.initializeApp(firebaseConfig);
var docRef = ""

function changeAge(val){  
  $("#ageDescription").html(age_description[val])
}

function changeFamily(val){
  if(val == 1){
    $("#customer_children option[value = 0]").prop('selected', true)
    $("#customer_children_type option[value = 0]").prop('selected', true)
    $("#customer_children").prop('disabled', true)
    $("#customer_children_type").prop('disabled', true)
  }
  else{
    $("#customer_children").prop('disabled', false)
    $("#customer_children_type").prop('disabled', false)
  }
}

var report_text = ""
var complex_value_div = []
var complex_raw_list = []
var customer_name = ""

function generateReport(){
  complex_list = $(".listbox")
  complex_list_length = complex_list.length

  modal_title_html = ""
  modal_body_html = ""
  modal_footer_html = ""

  customer_name = $("#customer_name").val()
  customer_age = $("#customer_age option:selected").text()
  customer_age_des = $("#ageDescription").text()
  customer_family = $("#customer_family option:selected").text()
  customer_children = $("#customer_children option:selected").text()
  customer_children_type = $("#customer_children_type option:selected").text()
  customer_income = $("#customer_income option:selected").text()

  report_customer_info = customer_name + "님은 "
  report_customer_info += report_today_str + " 현재,<br>"
  report_customer_info += customer_age + "의 연령으로 생애주기에서 <span class='reportFocus'>\'" + customer_age_des + "기\'</span>를 지나고 있습니다.<br><br>"
  report_customer_info += "가족 구성은 총 " + customer_family + "으로 자녀는 " + customer_children + "이고, " + customer_children_type + "이네요.<br>"
  report_customer_info += "가족의 평균 연소득은 " + customer_income  + "으로 가정 경제를 운영하고 계십니다."

  modal_title_html += customer_name + "님께 드리는 제안 "

  possible_budget_cash = numberToKorean(budget_cash)

  if(budget_loan == 0){
    possible_budget_loan = 0
  }
  else{
    possible_budget_loan = numberToKorean(budget_loan)
  }
  
  possible_budget_total = numberToKorean ( Number(budget_cash) + Number(budget_loan) )

  report_budget = report_today_str + " 현재 사용가능한 예산은<br>"
  report_budget += "즉시 사용 가능한 현금성 <span class='reportFocus'>\'" + possible_budget_cash + "원\'</span>' 과, "
  report_budget += "대출 가능한 <span class='reportFocus'>\'" + possible_budget_loan + "원\'</span>을 합쳐<br>"
  report_budget += "<span class='reportFocus'>총 \'" + possible_budget_total + "원\'</span>으로 확인됩니다."

  report_fav_loc = "자주 가시는 위치는, "
  movingMethod_kor = ""

  if(movingMethod == "public"){
    movingMethod_kor = "대중교통"
  }
  else{
    movingMethod_kor = "자가운전"
  }      

  report_region = "매수를 원하시는 지역은 아래와 같이 총 " + wanted_region.length + "개 지역 이고요,<br>"

  for(var k = 0 ; k < wanted_region.length ; k++){
    report_region += "<span class='reportFocus'>(" + (k+1) + ") " + $("#sido" + (k+1) + " option:selected").text() + " " + $("#gungu" + (k+1) + " option:selected").text() + "</span><br>"
  }

  selected_moving_time = $("input[name='moving_time']:checked").val();

  if(selected_moving_time == "within_30min"){
    report_moving_time = "30분 이내"
  }
  if(selected_moving_time == "within_60min"){
    report_moving_time = "1시간 이내"
  }
  if(selected_moving_time == "within_all"){
    report_moving_time = ""
  }

  selected_py = []
  if($("#filter_py10").is(":checked")){
    selected_py.push("10평")
  }
  if($("#filter_py20").is(":checked")){
    selected_py.push("20평")
  }
  if($("#filter_py30").is(":checked")){
    selected_py.push("30평")
  }
  if($("#filter_py40").is(":checked")){
    selected_py.push("40평")
  }
  if($("#filter_py50").is(":checked")){
    selected_py.push("50평 이상")
  }

  consult_text = commentWin.returnComment()

  naver.maps.Service.reverseGeocode({
    coords: new naver.maps.LatLng(fav_point_y, fav_point_x),
    }, function(status, response) {
        if (status !== naver.maps.Service.Status.OK) {
            return alert('네트워크 오류가 발생했어요! 다시 시도해 주세요!');
        }

        var result = response.v2, // 검색 결과의 컨테이너
            items = result.results, // 검색 결과의 배열
            address = result.address; // 검색 결과로 만든 주소

        // do Something            

        var map_region_lv1 = items[0]['region']['area1']['name']
        var map_region_lv2 = items[0]['region']['area2']['name']
        var map_region_lv3 = items[0]['region']['area3']['name']
        var map_region_lv4 = items[0]['region']['area4']['name']

        map_region_lv1 = map_region_lv1.replace("특별시", "시")
        map_region_lv1 = map_region_lv1.replace("특별자치시", "시")
        map_region_lv1 = map_region_lv1.replace("특별자치도", "도")
        map_region_lv1 = map_region_lv1.replace("광역시", "시")
        map_region_lv4 = map_region_lv4.replace(" ", "")

        region_addr = map_region_lv1 + " " + map_region_lv2 + " " + map_region_lv3 + " " + map_region_lv4
      
      report_fav_loc += "<span class='reportFocus'>\'" + region_addr + "\'근방</span>으로, 앞으로 추천드리는 단지는 이 위치로의 <span class='reportFocus'>\'" + movingMethod_kor + " 이동시간\'</span>을 확인해서 추천드리게 될 거예요"

      report_complex = "<span class='reportFocus'>"

      if(selected_moving_time == "within_all"){
        report_complex += possible_budget_total + "원 으로 "
      }
      else{
        report_complex += possible_budget_total + "원 으로 " + region_addr + "까지 " + movingMethod_kor + "으로 " + report_moving_time + "에 도착 가능한 "
      }

      if(selected_py.length == 5){
        report_complex += "추천 드리는 단지는 다음과 같습니다.<br><br>" 
      }
      else{            
        for(var k = 0 ; k < selected_py.length; k++){
          report_complex += selected_py[k]
          if(k != (selected_py.length-1)){
            report_complex += ", "
          }
        }
        report_complex += " 추천 단지는 다음과 같습니다.<br><br>" 
      }

      report_complex += "</span>"

      complex_value_div = []
      complex_raw_list = []
      var complex_list_num = 0  

      for(var i = 0 ; i < complex_list_length ; i++){
        if( $(complex_list[i]).css("display") != "none" ){

          complex_list_num++
          if(complex_list_num > 10){
            break
          }

          list_pointer = complex_list[i].attributes[1].nodeValue
          complex_raw_info = sortData[list_pointer]

          report_complex += "<div class='report_apt'>"
            report_complex += "<div class='report_apt_name'>" + complex_list.find(".complexInfo").find(".apt_name")[i].innerText + "</div>"

            report_complex += "<div class='report_apt_info'>"
              rank_info = complex_list.find(".rank")[i].innerText
              rank_info = rank_info.replace("\n", " ")
              report_complex += "<div><i class='fa-solid fa-circle-info'></i></div>"
              report_complex += "<div>" + rank_info + " / " + complex_list.find(".complexInfo").find(".apt_info")[i].innerText + "</div>"

              moving_info = complex_list.find(".movingTo")[i].innerText
              moving_info = moving_info.replace(" ---→  ", region_addr + "까지 " + "<span class='reportFocus'>" + movingMethod_kor + "으로 약 ")
              report_complex += "<div><i class='fa-solid fa-van-shuttle'></i></div>"
              report_complex += "<div>" + moving_info + "</span></div>"
            report_complex += "</div>"              

            link_url = ""
            py_list = $( "#result_list > div:nth-child(" + (i+1) + ") > .possibleAptTable > .possibleApt" )
            link_info = $( "#result_list > div:nth-child(" + (i+1) + ") > .linkTo > #linkToRR" ).attr("onclick")

            link_url = link_info.replace("openOuterLink(\"", "\'")
            link_url = link_url.replace("\")", "\'")

            report_complex += "<div class='report_py_info'>"

            for (var j = 0 ; j < py_list.length ; j++){
              if( $(py_list[j]).css("display") != "none"){
                py_info = py_list[j].innerText
                py_info = py_info.replace("거래 정보 부족", "→ 목표가격 예측 정보 부족")
                py_info = py_info.replace("ㆍ", "")
                report_complex += "<div>" + py_info + "</div>"
              }            
            }
            report_complex += "</div>"

            report_complex += "<div class='complex_value'>"
              report_complex += "<div class='complex_map' id='complex_map_" + i + "'></div>"
              report_complex += "<div class='complex_score'>"
                report_complex += "<div class='graph'><canvas id='complex_score_" + i + "'></canvas></div>"              
                report_complex += "<div class='report_info'>"
                  report_complex += "<a href=" + link_url + " target='_blank'><div class='complex_QR' id='complex_QR_" + i + "'></div></a>"
                  report_complex += "<div class='complex_QR_notice'>"
                  report_complex += `
                  <ul>
                    <li> 입지 점수의 분석 결과는 리얼랭커스 QR코드를 통해 확인할 수 있습니다.
                    <li> QR코드는 발행일로부터 3개월간 유효합니다.                    
                    <li> PDF파일의 경우 QR코드를 클릭하시면 리얼랭커스 분석 결과 페이지로 이동합니다.
                  </ul>
                  `
                  report_complex +="</div>"
                report_complex += "</div>"
              report_complex += "</div>"
            report_complex += "</div>"

            complex_value_div.push({"map_div": "complex_map_" + i, "score_div" : "complex_score_" + i, "QR_div": "complex_QR_" + i, "complex_graph_img": "complex_graph_canvas_" + i})
            complex_raw_list.push(complex_raw_info)

            //report_complex += "<div id='linkToRR' onClick='" + link_info + "' style='width: 300px'>리얼랭커스 보기</div>"                
          report_complex += "</div>"          
        }
      }

      report_text = report_customer_info
      report_text += "<hr>"

      report_text += "<div id='consulting_note_wrapper'>"
        report_text += "<div id='consulting_note_title'>Consulting Note</div>"
        report_text += "<div id='consulting_note'>"
        report_text += consult_text
        report_text +="</div>"
      report_text +="</div>"
      //report_text += "<hr>"

      report_text += report_budget
      report_text += "<hr>"

      /*
      report_text += report_fav_loc
      report_text += "<hr>"
      */

      report_text += report_region
      report_text += "<hr>"

      report_text += report_complex

      modal_footer_html += "<div id='btn_generate' onClick='exportToPDF(\"reportDetail\")'> PRINT </div>"

      $("#reportModalLabel").html(modal_title_html);
      $("#reportDetail").html(report_text);
      $("#reportFooter").html(modal_footer_html);

      //지도 그리기
      for(var k = 0 ; k < complex_value_div.length ; k++){
        div_id = complex_value_div[k]["map_div"]
        coord_y = complex_raw_list[k]["Y"]
        coord_x = complex_raw_list[k]["X"]
        aptValue = complex_raw_list[k]["가치 총점"]

        draw_minimap(div_id, aptValue, coord_y, coord_x)

        canvas_id = complex_value_div[k]["score_div"]
        livingScore = complex_raw_list[k]["주거총점"]
        transportScore = complex_raw_list[k]["교통총점"]
        infraScore = complex_raw_list[k]["인프라총점"]
        eduScore = complex_raw_list[k]["학군총점"]
        draw_score_graph(canvas_id, livingScore, transportScore, infraScore, eduScore)
        
        qr_id = complex_value_div[k]["QR_div"]
        qr_url = complex_raw_list[k]["sURL"]
        img_source = "https://quickchart.io/qr?text=" + qr_url

        $("#" + qr_id).html("<img src=\'" + img_source + "\' height=\'100px\'/>")
      }

      setTimeout(function(){
        var win = window.open("./print.html", "_blank", "width=800");
        win.resizeTo(850, 1000)
        //$("#print_area").html(report_text)
      }, 1000)

      //$('#reportModal').modal("show")
  });
}

function draw_minimap(div_id, aptValue, coord_y, coord_x){
  complex_grade = setGrade(aptValue)

  var detailMapOptions = {
      center: new naver.maps.LatLng(Number(coord_y), Number(coord_x)),
      size: new naver.maps.Size(300, 300),
      zoom: 16, //지도의 초기 줌 레벨
      zoomControl: false, //줌 컨트롤의 표시 여부
      draggable: false,
      pinchZoom: false,
      scrollWheel: false,
      keyboardShortcuts: false,
      disableDoubleTapZoom: false,
      disableDoubleClickZoom: false,
      disableTwoFingerTapZoom: false,
      tileTransition: false,
    };

    miniMap = new naver.maps.Map(div_id, detailMapOptions);

    var svg_color = "#CC0000"
    var stroke_color = "#CC0000"
    var grade = ""
    if(aptValue >= 70){
      svg_color = "#CC0000"
      stroke_color = "#8F0000"
      grade = "gradeS"
    }
    else if(aptValue < 70 && aptValue >= 55){
      svg_color = "#F72020"
      stroke_color = "#C50707"
      grade = "gradeA"
    }
    else if(aptValue < 55 && aptValue >= 40){
      svg_color = "#F36637"
      stroke_color = "#D43E0C"
      grade = "gradeB"
    }
    else{
      svg_color = "#ED8618"
      stroke_color = "#AB5E0D"
      grade = "gradeC"
    }

    svg_loc_small = `            
    <svg version="1.1" class='small_marker ${grade}' xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-1 -1 20 20" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="40", height="50">
    <defs>
    <style>
    .${grade}{fill:${svg_color}}
    .small_marker_${grade} {stroke:${stroke_color}; stroke-width:1}    
    .cls-2_small_text{fill:#fff; font-size:9px; font-weight:600}
    </style>
    </defs>
    <g class="svg_loc_small">
    <path class="cls-1_small small_marker_${grade}" d="M17.89,4.43,9.86.31a1.67,1.67,0,0,0-1.55,0L.36,4.43a.48.48,0,0,0-.24.42v9.58c0,.74.35,1.35.76,1.35h1l2.26,3.35,2.25-3.35h11c.41,0,.75-.61.75-1.35V4.86A.48.48,0,0,0,17.89,4.43Z"/>
    <text class="cls-2_small_text" text-anchor="middle" x="9" y="12">${complex_grade}</text>
    </g>
    </svg>
    `
    var minimapMarker = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coord_y), Number(coord_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(8, 50),
          origin: new naver.maps.Point( Number(coord_y), Number(coord_x)),
      },
      zIndex: 100,
      map: miniMap,
    });        
}

function draw_score_graph(canvas_id, livingScore, transportScore, infraScore, eduScore){
    var label = ["주거", "교통", "인프라", "교육"]
    var data = [livingScore, transportScore, infraScore, eduScore]    

    if(isNaN(transportScore) || transportScore == 0){
      label = ["주거", "인프라", "교육"]
      data = [livingScore, infraScore, eduScore]        
    }
    if(eduScore == "region"){
      label = ["공급필요", "인구수", "일자리수"]
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

    var ctx = document.getElementById(canvas_id).getContext('2d');
    var myChart = new Chart(ctx, {
      type: 'bar',
      plugins:[ChartDataLabels],
      data: {          
        labels: label,
        datasets: [{                
          data: data,
          backgroundColor: [
              //'#ff3d38',
              '#e31939',
              '#e31939',
              '#e31939',
              '#e31939',
          ],
          borderColor: [
              'rgba(255,99,132, 0)',
              'rgba(54, 162, 235, 0)',
          ],                
          barThickness: 14,            
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
          duration : 0,
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