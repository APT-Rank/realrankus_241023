/*
var btn_timer = setInterval(function () {
  $('#btn_complex_compare').animate({'opacity': 0} ,750 , function () {
    $('#btn_complex_compare').animate({'opacity': 1}, 750);
  });
}, 3000);
*/

var compareOption = "";
for (i = 1; i < regions.length; i++) {
  region_name = regions[i][0]
  if(isMobile){
    if(region_name == "충청북도"){
      region_name = "충북"
    }
    else if(region_name == "충청남도"){
      region_name = "충남"
    }
    else if(region_name == "전북도"){
      region_name = "전북"
    }
    else if(region_name == "전라남도"){
      region_name = "전남"
    }
    else if(region_name == "경상북도"){
      region_name = "경북"
    }
    else if(region_name == "경상남도"){
      region_name = "경남"
    }
    else{
      region_name = region_name.substr(0, 2)
    }
  }  
  compareOption += "<option value='" + regions[i][1] + "'>" + region_name + "</option>";
}

function openCompare(complex_data){
  //clearInterval(btn_timer)

  if(isMobile){
    $("#compareModal > div").css({'flex-direction': 'column', 'margin-top': '0em'})
  }
  else{
    $("#compareModal > div").css({'flex-direction': 'column', 'margin-top': '1em'})  }  
  
  compare_detail_html = "<div id='compare_option_wrapper'>"  

    compare_detail_html += "<div id='compare1_option'>"
      compare_detail_html += "<div id='compare1_sido_selection'><select id='compare1_sido' onChange='compareSidoChange(this.value, 1)'></select></div>"
      compare_detail_html += "<div id='compare1_gungu_selection'><select id='compare1_gungu' onChange='loadComplexList(1)'></select></div>"
    compare_detail_html += "</div>"  

    compare_detail_html += "<div class='compare_option_middle'>시군구</div>"

    compare_detail_html += "<div id='compare2_option'>"
      compare_detail_html += "<div id='compare2_sido_selection'><select id='compare2_sido' onChange='compareSidoChange(this.value, 2)'></select></div>"
      compare_detail_html += "<div id='compare2_gungu_selection'><select id='compare2_gungu' onChange='loadComplexList(2)'></select></div>"
    compare_detail_html += "</div>"

    compare_detail_html += "<div class='complex_compare_detail' id='compare1_complex_selection'><select id='compare1_complex' onChange='loadComplex(1)'></select></div>"
    compare_detail_html += "<div class='compare_option_middle'>단지</div>"
    compare_detail_html += "<div class='complex_compare_detail' id='compare2_complex_selection'><select id='compare2_complex' onChange='loadComplex(2)'></select></div>"

  compare_detail_html += "</div>"

  compare_detail_html += "<div id='compare_loading'><div class='spinner-border' role='status'></div></div>"

  compare_detail_html += "<div id='compare_wrapper'>"

  compare_detail_html += "<div class='complex_compare_total'>"

    compare_detail_html += "<div class='complex_compare_detail' id='compare1_complex_rank'></div>"
    compare_detail_html += "<div class='compare_option_middle' id='compare_complex_rank_title'>RANK</div>"
    compare_detail_html += "<div class='complex_compare_detail' id='compare2_complex_rank'></div>"

    compare_detail_html += "<div class='complex_compare_detail' id='compare1_complex_graph'><canvas id='compare1_complex_chart' style='width: 100%'></canvas></div>"
    compare_detail_html += "<div class='compare_option_middle' id='total_chart_label'>"
      compare_detail_html += "<div>주거</div>"
      compare_detail_html += "<div>교통</div>"
      compare_detail_html += "<div>인프라</div>"
      compare_detail_html += "<div>교육</div>"
    compare_detail_html += "</div>"
    compare_detail_html += "<div class='complex_compare_detail' id='compare2_complex_graph'><canvas id='compare2_complex_chart' style='width: 100%'></canvas></div>"

  compare_detail_html += "</div>"

    //주거 비교
    compare_detail_html += "<div class='complex_compare_living'>"
      compare_detail_html += "<div class='complex_compare_detail_graph' id='compare1_complex_living_graph'><canvas id='compare1_complex_living_chart' style='width: 100%'></canvas></div>"
      compare_detail_html += "<div class='compare_option_middle' id='compare_complex_living_title'>주거</div>"
      compare_detail_html += "<div class='complex_compare_detail_graph' id='compare2_complex_living_graph'><canvas id='compare2_complex_living_chart' style='width: 100%'></canvas></div>"      

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_address'></div>"
      compare_detail_html += "<div class='compare_option_middle'>주소</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_address'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_years'></div>"
      compare_detail_html += "<div class='compare_option_middle'>년차</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_years'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_houseNum'></div>"
      compare_detail_html += "<div class='compare_option_middle'>세대수</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_houseNum'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_parking'></div>"
      compare_detail_html += "<div class='compare_option_middle'>주차</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_parking'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_heating'></div>"
      compare_detail_html += "<div class='compare_option_middle'>난방</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_heating'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_entrance'></div>"
      compare_detail_html += "<div class='compare_option_middle'>현관</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_entrance'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_floor_ratio'></div>"
      compare_detail_html += "<div class='compare_option_middle'>용적률</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_floor_ratio'></div>"
      
      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_cover_ratio'></div>"
      compare_detail_html += "<div class='compare_option_middle'>건폐율</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_cover_ratio'></div>"

      compare_detail_html += "<div id='compare_living_comment'>"
      compare_detail_html += "재건축의 경우, 향후 신축이 될 가능성을 고려하여<br>용적률과 건폐율로 주거 점수를 계산합니다."
      compare_detail_html += "</div>"

    compare_detail_html += "</div>"

    //교통 비교
    compare_detail_html += "<div class='complex_compare_trans'>"      

      compare_detail_html += "<div class='complex_compare_detail_graph' id='compare1_complex_trans_graph'><canvas id='compare1_complex_trans_chart' style='width: 100%'></canvas></div>"
      compare_detail_html += "<div class='compare_option_middle' id='compare_complex_trans_title'>교통</div>"
      compare_detail_html += "<div class='complex_compare_detail_graph' id='compare2_complex_trans_graph'><canvas id='compare2_complex_trans_chart' style='width: 100%'></canvas></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_trans_nearest_station'></div>"
      compare_detail_html += "<div class='compare_option_middle'>가까운역</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_trans_nearest_station'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_trans_within30m'></div>"
      compare_detail_html += "<div class='compare_option_middle'>30분이내</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_trans_within30m'></div>"
      
      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_trans_within1h'></div>"
      compare_detail_html += "<div class='compare_option_middle'>1시간이내</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_trans_within1h'></div>"

      compare_detail_html += "<div id='compare_trans_comment'>"
      compare_detail_html += "가장 가까운 역은 직선거리로 계산됩니다.<br>"
      compare_detail_html += "주요역은 평일 출근시간대 하차인원이 가장 많은 역을 의미합니다.<br>"
      compare_detail_html += "30분, 1시간 이동 거리는 구글 대중교통 이동 시간 정보를 사용합니다."
      compare_detail_html += "</div>"

    compare_detail_html += "</div>"

    //인프라 비교
    compare_detail_html += "<div class='complex_compare_infra'>"     

      compare_detail_html += "<div class='complex_compare_detail_graph' id='compare1_complex_infra_graph'><canvas id='compare1_complex_infra_chart' style='width: 100%'></canvas></div>"
      compare_detail_html += "<div class='compare_option_middle' id='compare_complex_infra_title'>인프라</div>"
      compare_detail_html += "<div class='complex_compare_detail_graph' id='compare2_complex_infra_graph'><canvas id='compare2_complex_infra_chart' style='width: 100%'></canvas></div>"      

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_department_store'></div>"
      compare_detail_html += "<div class='compare_option_middle'>백화점(3km)</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_department_store'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_outlet'></div>"
      compare_detail_html += "<div class='compare_option_middle'>아울렛/몰(5km)</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_outlet'></div>"
      
      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_mart'></div>"
      compare_detail_html += "<div class='compare_option_middle'>대형마트(1km)</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_mart'></div>"
      
      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_market_complex'></div>"
      compare_detail_html += "<div class='compare_option_middle'>상권(300m)</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_market_complex'></div>"
      
      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_bank'></div>"
      compare_detail_html += "<div class='compare_option_middle'>은행(500m)</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_bank'></div>"
      
      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_hospital'></div>"
      compare_detail_html += "<div class='compare_option_middle'>병원(500m)</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_hospital'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_big_hospital'></div>"
      compare_detail_html += "<div class='compare_option_middle'>대형병원(5km)</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_big_hospital'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_park'></div>"
      compare_detail_html += "<div class='compare_option_middle'>공원(500m)</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_park'></div>"    
      
      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_big_park'></div>"
      compare_detail_html += "<div class='compare_option_middle'>대형공원(1km)</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_big_park'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_harmful'></div>"
      compare_detail_html += "<div class='compare_option_middle'>혐오시설(3km)</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_harmful'></div>"

    compare_detail_html += "</div>"

    //교육 비교
    compare_detail_html += "<div class='complex_compare_edu'>"     

      compare_detail_html += "<div class='complex_compare_detail_graph' id='compare1_complex_edu_graph'><canvas id='compare1_complex_edu_chart' style='width: 100%'></canvas></div>"
      compare_detail_html += "<div class='compare_option_middle' id='compare_complex_edu_title'>교육</div>"
      compare_detail_html += "<div class='complex_compare_detail_graph' id='compare2_complex_edu_graph'><canvas id='compare2_complex_edu_chart' style='width: 100%'></canvas></div>"            

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_edu_pSchool_distance'></div>"
      compare_detail_html += "<div class='compare_option_middle'>초교거리</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_edu_pSchool_distance'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_edu_pSchool_student'></div>"
      compare_detail_html += "<div class='compare_option_middle'>초교학생증감</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_edu_pSchool_student'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_edu_mSchool_edu'></div>"
      if(isMobile){
        compare_detail_html += "<div class='compare_option_middle'>중등<br>성취도</div>"
      }
      else{
        compare_detail_html += "<div class='compare_option_middle'>중등성취도</div>"
      }      
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_edu_mSchool_edu'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_edu_academy'></div>"
      compare_detail_html += "<div class='compare_option_middle'>학원가(300m)</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_edu_academy'></div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_edu_academy_long'></div>"
      compare_detail_html += "<div class='compare_option_middle'>학원가(1km)</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_edu_academy_long'></div>"    

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_edu_harmful'></div>"
      compare_detail_html += "<div class='compare_option_middle'>유흥/모텔(300m)</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_edu_harmful'></div>"
      
    compare_detail_html += "</div>"      

    //실거래가
    compare_detail_html += "<div class='complex_compare_price'>"
      compare_detail_html += "<div class='compare_option_middle' id='compare_complex_price_title'>실거래가</div>"

      compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_latest_deal'></div>"
      compare_detail_html += "<div class='compare_option_middle'>최근매매</div>"
      compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_latest_deal'></div>"

      compare_detail_html += "<div class='complex1_compare_detail_price' id='compare1_complex_latest_deal_list'></div>"
      compare_detail_html += "<div class='compare_option_middle'>평별거래</div>"
      compare_detail_html += "<div class='complex2_compare_detail_price' id='compare2_complex_latest_deal_list'></div>"

    compare_detail_html += "</div>"

  compare_detail_html += "</div>"
  
  $("#compareModalLabel").html("");
  $("#compareDetail").html(compare_detail_html);
  $("#compareFooter").html("");

  $("#compare1_sido").html(compareOption)
  $("#compare2_sido").html(compareOption)

  $("#compare1_sido").val(selectedRegion).prop("selected", true);
  compareOptionChange($("#compare1_sido option:selected").val(), "", 1)

  $("#compare2_sido").val(selectedRegion).prop("selected", true);
  compareOptionChange($("#compare1_sido option:selected").val(), "", 2)

  $("#compareModal").modal("show");
  $("#compareModal").css({"z-index":"1200"})
  $(".modal-backdrop").css({"width":"100%", "z-index":"1100"})

  loadComplexList(1)
  loadComplexList(2)

  $("#compare_loading").show()
  $("#compare_wrapper").css({'visibility':'hidden'})

  compare1_code = complex_data['검색코드']  
  $("#compare1_complex").val(compare1_code).prop("selected", true);
  $("#compare1_complex_info").html(complex_data['아파트명'])

  /*
  setTimeout(function(){
    loadComplex(1)
  }, 300)
  setTimeout(function(){
    loadComplex(2)
  }, 500)
  */
}

function compareOptionChange(compareSelectedRegion, compareSelectedSubRegion, compareNum) {
  regionName = compareSelectedRegion
  var changeItem;

  if (regionName == "Seoul") {
    changeItem = inSeoul;
  }
  if (regionName == "Busan") {
    changeItem = inBusan;
  }
  if (regionName == "Incheon") {
    changeItem = inIncheon;
  }
  if (regionName == "Daegu") {
    changeItem = inDaegu;
  }
  if (regionName == "Gwangju") {
    changeItem = inGwangju;
  }
  if (regionName == "Daejeon") {
    changeItem = inDaejeon;
  }
  if (regionName == "Ulsan") {
    changeItem = inUlsan;
  }
  if (regionName == "Sejong") {
    changeItem = inSejong;
  }
  if (regionName == "Gyeonggi") {
    changeItem = inGyeonggi;
  }
  if (regionName == "Gangwondo") {
    changeItem = inNewGangwondo;
  }
  if (regionName == "Chungcheongbukdo") {
    changeItem = inChungcheongbukdo;
  }
  if (regionName == "Chungcheongnamdo") {
    changeItem = inChungcheongnamdo;
  }
  if (regionName == "Jeollabukdo") {        
    changeItem = inNewJeollabukdo;
  }
  if (regionName == "Jeollanamdo") {
    changeItem = inJeollanamdo;
  }
  if (regionName == "Gyeongsangbukdo") {
    changeItem = inGyeongsangbukdo;
  }
  if (regionName == "Gyeongsangnamdo") {
    changeItem = inGyeongsangnamdo;
  }
  if (regionName == "Jejudo") {
    changeItem = inJejudo;
  }

  if(compareNum == 1){
    $("#compare1_gungu").empty();
    for (var i = 0; i < changeItem.length; i++) {
      item_arr = changeItem[i][0].split(" ")
      itemName = changeItem[i][0]
      
      if(item_arr.length > 1 && isMobile){
        itemName = item_arr[0].replace("시", "")        
        itemName += " " + item_arr[1].replace("구", "")
      }

      var subOption = $( "<option value='" + changeItem[i][1] + "'>" + itemName + "</option>" );
      $("#compare1_gungu").append(subOption);
      if(compareSelectedSubRegion == ""){
        $("#compare1_gungu").val(selectedSubRegion).prop("selected", true);
      }
      else{
        $("#compare1_gungu").val(changeItem[0][1]).prop("selected", true);
      }
    }
  }
  if(compareNum == 2){
    $("#compare2_gungu").empty();
    for (var i = 0; i < changeItem.length; i++) {
      item_arr = changeItem[i][0].split(" ")
      itemName = changeItem[i][0]

      if(item_arr.length > 1 && isMobile){
        itemName = item_arr[0].replace("시", "")
        itemName += " " + item_arr[1].replace("구", "")
      } 

      var subOption = $( "<option value='" + changeItem[i][1] + "'>" + itemName + "</option>" );
      $("#compare2_gungu").append(subOption);
      if(compareSelectedSubRegion == ""){
        $("#compare2_gungu").val(selectedSubRegion).prop("selected", true);
      }
      else{
        $("#compare2_gungu").val(changeItem[0][1]).prop("selected", true);
      }
    }
  }  
}
function compareSidoChange(compareSelectedRegion, compareNum){
  compareOptionChange(compareSelectedRegion, "init", compareNum)
  loadComplexList(compareNum)
}

function loadComplexList(compareNum){  
  var searchingData_list = searchingData.data
  var selected_compare_list = []    

  if(compareNum == 1){
    $("#compare1_complex").html("")
    compareSubRegion = $("#compare1_gungu option:selected").val()

    for(var i = 0 ; i < searchingData_list.length ; i++){
      var searchName = searchingData_list[i]["gungu"]
      if(searchName.indexOf(compareSubRegion) >= 0){
        selected_compare_list.push(searchingData_list[i])
      }
    }
    var compare_list_result = selected_compare_list.sort((a, b) => b['가치 총점'] - a['가치 총점']);    

    for (var j = 0; j < selected_compare_list.length; j++) {
      var complexListOption = $( "<option value='" + compare_list_result[j]['검색코드'] + "'>" + compare_list_result[j]['아파트명'] + "</option>" );
      $("#compare1_complex").append(complexListOption);
    }    
  }
  
  if(compareNum == 2){
    $("#compare2_complex").html("")
    compareSubRegion = $("#compare2_gungu option:selected").val()

    for(var i = 0 ; i < searchingData_list.length ; i++){
      var searchName = searchingData_list[i]["gungu"]
      if(searchName.indexOf(compareSubRegion) >= 0){
        selected_compare_list.push(searchingData_list[i])
      }
    }

    var compare_list_result = selected_compare_list.sort((a, b) => b['가치 총점'] - a['가치 총점']); 

    for (var j = 0; j < selected_compare_list.length; j++) {
      var complexListOption = $( "<option value='" + compare_list_result[j]['검색코드'] + "'>" + compare_list_result[j]['아파트명'] + "</option>" );
      $("#compare2_complex").append(complexListOption);
    }    
  }
  setTimeout(function(){
     loadComplex(compareNum)
  }, 300)
}

function loadComplex(compareNum){
  if(compareNum == 1){
    search_region = $("#compare1_gungu option:selected").val()
    search_val = $("#compare1_complex option:selected").val()
    firebase.database().ref().child("complex_info").child(search_region).child(search_val).get()
	  .then((snapshot) => {
	  	if(snapshot.exists()){			  
			  complex_info = snapshot.val()
        tlgm_txt = $("#compare1_complex option:selected").text() + " vs " + $("#compare2_complex option:selected").text()
        tlgm_txt += "%0A"
        tlgm_txt += "(Loaded Complex 1 = " + complex_info['아파트명'] + ")"
        //sendTelegram_single_message(tlgm_txt)
        if(complex_info == null){
          setTimeout(function(){
            loadComplex(compareNum)
          }, 350)
			  }
			  else{				  
				  drawComplex(complex_info, compareNum)
			  }
      }
      else{
        alert("불러오기 실패했어요. 다시 시도해 주세요.")
      }
    })
    .catch((error) => {
      console.log(error.message)
    })
  }
  if(compareNum == 2){
    search_region = $("#compare2_gungu option:selected").val()
    search_val = $("#compare2_complex option:selected").val()
    firebase.database().ref().child("complex_info").child(search_region).child(search_val).get()
	  .then((snapshot) => {
		  if (snapshot.exists){
			  complex_info = snapshot.val()        
        tlgm_txt = $("#compare1_complex option:selected").text() + " vs " + $("#compare2_complex option:selected").text()
        tlgm_txt += "%0A"
        tlgm_txt += "(Loaded Complex 2 = " + complex_info['아파트명'] + ")"
        //drawComplex(complex_info, compareNum)  
        
			  if(complex_info == null){
          setTimeout(function(){
            loadComplex(compareNum)
          }, 350)
			  }
			  else{				  
				  drawComplex(complex_info, compareNum)
			  }
        
      }
      else{
        alert("불러오기 실패했어요. 다시 시도해 주세요.")
      }
    })
    .catch((error) => {
      console.log(error.message)
    })
  }  
}

function drawComplex(complexInfo, compareNum){  
  selectedCompare = "#compare" + compareNum + "_complex_"
  var address = complexInfo["법정동주소"]
  var aptValue = complexInfo["가치 총점"]
  complex_grade = setGrade(aptValue)
  shorten_address = ""
  if(isMobile){
    subregionText = $("#compare" + compareNum + "_gungu option:selected").text();    
    subregionText_arr = subregionText.split(" ")
    address_arr = address.split(" ")
    for(var i = subregionText_arr.length+1 ; i < address_arr.length ; i++){
      shorten_address += address_arr[i] + " "
    }
    address = shorten_address
  }
  $(selectedCompare +  "address").html(address)
  $(selectedCompare +  "rank").html("Rank " + complex_grade)

  //주거
  var build_year = complexInfo["준공년차"]
  var apt_type = complexInfo["매매타입"]
  if(apt_type == "아파트"){
    apt_type = ""
  }
  else{
    apt_type = " (" + apt_type + ")"
  }
  var build_info = build_year + "년차" + apt_type  
  $(selectedCompare +  "living_years").html(build_info)

  var house_num = complexInfo["세대수"]
  $(selectedCompare +  "living_houseNum").html(house_num.toLocaleString() + "세대")

  var parking = complexInfo["주차"]
  $(selectedCompare +  "living_parking").html(parking)

  var heating = complexInfo["난방"];
  $(selectedCompare +  "living_heating").html(heating)

  var entrance = complexInfo["현관구조"];
  $(selectedCompare +  "living_entrance").html(entrance)

  var floor_rate = complexInfo["용적률"];
  if (floor_rate == "0" || floor_rate == 0 || floor_rate == undefined || isNaN(floor_rate)) {
    floor_rate = "--%";
  }
  else{
    floor_rate = floor_rate + "%";
  }
  $(selectedCompare +  "living_floor_ratio").html(floor_rate)

  var cover_rate = complexInfo["건폐율"];
  if (cover_rate == "0" || cover_rate == 0 || cover_rate == undefined || isNaN(cover_rate)) {
    cover_rate = "--%";
  }
  else{
    cover_rate = cover_rate + "%";
  }
  $(selectedCompare +  "living_cover_ratio").html(cover_rate)

  //교통
  var nearestStation = "--"
  var subway_line = "--"
  var stationPoint_30m = "--";
  var stations_30m = "--"
  var stationPoint_1h = "--";
  var stations_1h = "--"

  if(complexInfo["교통총점"] == "NA" || complexInfo["교통총점"] ==undefined){
    $(selectedCompare +  "trans_nearest_station").html(nearestStation)    
  }
  else{
    nearestStation = complexInfo["가까운역이름"] + "역" + "(" + ( Math.round(complexInfo["가까운역거리"] * 100) / 100 ).toFixed() + "m)";
    subway_line = complexInfo["역노선"];  
    try{
      subway_line = subway_line.replace("[", "")
      subway_line = subway_line.replace("]", "")
      subway_line = subway_line.replaceAll("'", "")
    }
    catch(e){
      subway_line = eval(complexInfo["역노선"]);
    }
    $(selectedCompare +  "trans_nearest_station").html(nearestStation + "<div class='compareStations'>" + subway_line + "</div>")
  }  

  if(complexInfo["교통총점"] == "NA" || complexInfo["교통총점"] == undefined){    
    $(selectedCompare +  "trans_within30m").html("--")
  }
  else{
    stationPoint_30m = complexInfo["30분이내주요거점역"] + "개";
    stations_30m = complexInfo["30분거점역이름"]
    stations_30m = stations_30m.replace("[", "")
    stations_30m = stations_30m.replace("]", "")
    stations_30m = stations_30m.replaceAll("'", "")

    $(selectedCompare +  "trans_within30m").html(stationPoint_30m)
    $(selectedCompare +  "trans_within30m").append("<div class='compareStations'>" + stations_30m + "</div>")
  }

  if(complexInfo["교통총점"] == "NA" || complexInfo["교통총점"] == undefined){
    $(selectedCompare +  "trans_within1h").html("--")    
  }
  else{
    stationPoint_1h = complexInfo["1시간이내주요거점역"] + "개";
    stations_1h = complexInfo["1시간거점역이름"]
    stations_1h = stations_1h.replace("[", "")
    stations_1h = stations_1h.replace("]", "")
    stations_1h = stations_1h.replaceAll("'", "")

    $(selectedCompare +  "trans_within1h").html(stationPoint_1h)
    $(selectedCompare +  "trans_within1h").append("<div class='compareStations'>" + stations_1h + "</div>")
  }  

  //인프라
  var departmentStore_3km = complexInfo["3km이내백화점수"] + "개";
  $(selectedCompare +  "infra_department_store").html(departmentStore_3km)

  var OutletMall_5km = complexInfo["5km이내아울렛몰수"] + "개";
  $(selectedCompare +  "infra_outlet").html(OutletMall_5km)

  var bigMart_1km = complexInfo["1km이내대형먀트수"] + "개";
  $(selectedCompare +  "infra_mart").html(bigMart_1km)

  var bank_500m = complexInfo["500m이내은행수"] + "개";
  $(selectedCompare +  "infra_bank").html(bank_500m)

  var hospital_500m = complexInfo["500m이내병원수"] + "개";
  $(selectedCompare +  "infra_hospital").html(hospital_500m)

  var bigHospital_5km = complexInfo["5km이내대형병원수"] + "개";
  $(selectedCompare +  "infra_big_hospital").html(bigHospital_5km)

  var park_500m = complexInfo["500m이내공원수"] + "개";
  $(selectedCompare +  "infra_park").html(park_500m)

  var big_park_1km = complexInfo["800m이내대형공원수"] + "개";
  $(selectedCompare +  "infra_big_park").html(park_500m)

  var harmful_3km = complexInfo["3km이내혐오시설수"] + "개";
  $(selectedCompare +  "infra_harmful").html(harmful_3km)

  var market_infra = complexInfo["300m이내상권"] + "개" + "(총 " + complexInfo["300m이내점포수"] + "개 지점)";
  $(selectedCompare +  "infra_market_complex").html(market_infra)

  //교육
  var pSchool_distance = complexInfo["초등학교거리"];
  if (pSchool_distance - 100 < 0) {
    minDistance = parseInt(pSchool_distance * 0.8);
  } else {
    minDistance = parseInt(pSchool_distance - 100);
  }
  maxDistance = parseInt(pSchool_distance);
  $(selectedCompare +  "edu_pSchool_distance").html(minDistance.toLocaleString() + "~" + maxDistance.toLocaleString() + "m")

  var pSchool_edu = complexInfo["초등학교학업성취도"];
  if (pSchool_edu > 95 && pSchool_edu <= 100) {
    pSchool_edu_result = "많은 전입";
  } else if (pSchool_edu >= 92 && pSchool_edu <= 95) {
    pSchool_edu_result = "적은 전입";
  } else if (pSchool_edu >= 88 && pSchool_edu < 92) {
    pSchool_edu_result = "전입/전출 적음";
  } else if (pSchool_edu >= 85 && pSchool_edu < 88) {
    pSchool_edu_result = "적은 전출";
  } else {
    pSchool_edu_result = "많은 전출";
  }
  $(selectedCompare +  "edu_pSchool_student").html(pSchool_edu_result)

  var mSchool_edu = complexInfo["중학교학업성취도"] + "%";
  $(selectedCompare +  "edu_mSchool_edu").html(mSchool_edu)

  var academy_edu = complexInfo["500m이내학원가"] + "개" + "(총 " + complexInfo["500m이내학원수"] + "개 학원)";
  $(selectedCompare +  "edu_academy").html(academy_edu)

  var academy_edu_long = complexInfo["1km이내학원가"] + "개" + "(총 " + complexInfo["1km이내학원수"] + "개 학원)";  
  $(selectedCompare +  "edu_academy_long").html(academy_edu_long)

  var drink_pub = complexInfo["300m이내유흥주점"];
  var daran_pub = complexInfo["300m이내단란주점"];
  var motel = complexInfo["300m이내모텔"];

  $(selectedCompare +  "edu_harmful").html(drink_pub + daran_pub + motel + "개")

  //실거래가
  var area_info = complexInfo["area_info"];  
  var last_sales = complexInfo["last_sales"].split(",");
  var last_sales_date = last_sales[0].toString();
  var last_sales_price = last_sales[1].toString();
  var last_sales_area = last_sales[2];
  console.log(last_sales_price)
  if(last_sales_price == NaN || last_sales_price == undefined || isNaN(last_sales_price)){
    last_sales_info = "거래 이력 없음"
  }
  else{
    if(isMobile){
      last_sales_info = last_sales_area + ", " + Math.round(last_sales_price / 100) / 100 + "억<br>" + last_sales_date.substr(2)      
    }
    else{
      last_sales_info = last_sales_area + ", " + Math.round(last_sales_price / 100) / 100 + "억, " + last_sales_date.substr(2)      
    }
  }
  $(selectedCompare +  "latest_deal").html( last_sales_info )
  

  var area_array = area_info.split(",");

  var sales_info = complexInfo["sales_info"];

  var rent_info = complexInfo["rent_info"];
  var rent_ratio = complexInfo["rent_ratio"];
  var last_rent = complexInfo["last_rent"].split(",");
  var last_rent_date = last_rent[0].toString();
  var last_rent_price = last_rent[1].toString();
  var last_rent_area = last_rent[2];

  var sales_info_array = sales_info.split(",");
  var rent_info_array = rent_info.split(",");

  var start_date = new Date();
  start_date.setMonth(today.getMonth() - 1);

  detailHtml = ""

  detailHtml += "<table class='table table-striped' id='dealTable' style='font-size:0.8em'>";
  detailHtml += "<thead class='table-light'>";
  detailHtml += "<tr>";
    detailHtml += "<th scope='col'>" + "평형" + "</th>";
    detailHtml += "<th scope='col'>" + "매매 / 전세" + "</th>";          
  detailHtml += "</tr>";
  detailHtml += "</thead>";

  detailHtml += "<tbody>";
  for (var k = 0; k < area_array.length; k++) {
    detailHtml += "<tr>";
    if (sales_info_array[k] == "거래 정보 없음") {
      if(isMobile){
        area_arr = area_array[k].split('(')
        detailHtml += "<td>" + area_arr[0] + "<br><span style='font-size:0.8em'>(" + area_arr[1] + "</span></td>";
        detailHtml += "<td>" + "정보 없음 <br><span style='font-size:0.7em'> (---)</span>" + "<br>" + "정보 없음<br><span style='font-size:0.7em'> (---)</span></td>";
      }
      else{
        detailHtml += "<td>" + area_array[k] + "</td>";
        detailHtml += "<td>" + "정보 없음 <span style='font-size:0.8em'> (---)</span>" + "<br>" + "정보 없음 <span style='font-size:0.8em'> (---)</span></td>";
      }

      
    } else {
      var sales_info_split = sales_info_array[k].split("억");
      var compare_year = Number(sales_info_split[1].substr(2, 4));
      var compare_month = Number(sales_info_split[1].substr(7, 2) - 1);
      var compare_day = Number(sales_info_split[1].substr(10, 2));
      var compare_date = new Date( compare_year, compare_month, compare_day );
      var rent_info_split = rent_info_array[k].split("억");

      if (rent_info_split[0] == "거래 정보 없음") {
      }
      else {
        var compare_rent_year = Number(rent_info_split[1].substr(2, 4));
        var compare_rent_month = Number(
          rent_info_split[1].substr(7, 2) - 1
        );
        var compare_rent_day = Number(rent_info_split[1].substr(10, 2));
        var compare_rent_date = new Date( compare_rent_year, compare_rent_month, compare_rent_day );
      }

      if (compare_date > start_date) {        
        if(isMobile){
          area_arr = area_array[k].split('(')
          detailHtml += "<td><span style='color:#fe4040; font-weight:600'>" + area_arr[0] + "</span><br><span style='font-size:0.8em'>(" + area_arr[1] + "</span></td>";
          detailHtml += "<td><span style='color:#fe4040; font-weight:600'>" + (Math.round(sales_info_split[0] * 100) / 100).toFixed(2) + "억" + "<br><span style='font-size: 0.7em'>" + sales_info_split[1] + "</span></span><br>";
        }
        else{
          detailHtml += "<td><span style='color:#fe4040; font-weight:600'>" + area_array[k] + "</span></td>";
          detailHtml += "<td><span style='color:#fe4040; font-weight:600'>" + (Math.round(sales_info_split[0] * 100) / 100).toFixed(2) + "억" + "<span style='font-size: 0.85em'>" + sales_info_split[1] + "</span></span><br>";
        }
        
      } else {        
        if(isMobile){
          area_arr = area_array[k].split('(')
          detailHtml += "<td>" + area_arr[0] + "</span><br><span style='font-size:0.8em'>(" + area_arr[1] + "</td>";
          detailHtml += "<td>" + (Math.round(sales_info_split[0] * 100) / 100).toFixed(2) + "억" + "<br><span style='font-size: 0.7em'>" + sales_info_split[1] + "</span><br>";
        }
        else{
          detailHtml += "<td>" + area_array[k] + "</td>";
          detailHtml += "<td>" + (Math.round(sales_info_split[0] * 100) / 100).toFixed(2) + "억" + "<span style='font-size: 0.85em'>" + sales_info_split[1] + "</span><br>";
        }
      }

      if (compare_rent_date > start_date) {
        if (rent_info_split[0] == "거래 정보 없음") {
          if(isMobile){
            detailHtml += "정보 없음<br><span style='font-size: 0.7em'>(---)</span></td>";
          }
          else{
            detailHtml += "정보 없음<span style='font-size: 0.7em'> (---)</span></td>";
          }
        } 
        else {
          if(isMobile){
            detailHtml += "<span style='color:#fe4040; font-weight:600'>" + (Math.round(rent_info_split[0] * 100) / 100).toFixed(2) + "억" + "<br><span style='font-size: 0.7em'>" + rent_info_split[1] + "</span></span></td>";
          }
          else{
            detailHtml += "<span style='color:#fe4040; font-weight:600'>" + (Math.round(rent_info_split[0] * 100) / 100).toFixed(2) + "억" + "<span style='font-size: 0.85em'>" + rent_info_split[1] + "</span></span></td>";
          }          
        }
      } else {
        if (rent_info_split[0] == "거래 정보 없음") {
          if(isMobile){
            detailHtml += "정보 없음<br><span style='font-size: 0.7em'>(---)</span></td>";
          }
          else{
            detailHtml += "정보 없음<span style='font-size: 0.7em'> (---)</span></td>";
          }
        } else {
          if(isMobile){
            detailHtml += "" + (Math.round(rent_info_split[0] * 100) / 100).toFixed(2) + "억" + "<br><span style='font-size: 0.7em'>" + rent_info_split[1] + "</span></td>";
          }
          else{
            detailHtml += "" + (Math.round(rent_info_split[0] * 100) / 100).toFixed(2) + "억" + "<span style='font-size: 0.85em'>" + rent_info_split[1] + "</span></td>";
          }          
        }
      }
    }
    detailHtml += "</tr>";
  }
  detailHtml += "</tbody>";
  detailHtml += "</table>";

  $(selectedCompare +  "latest_deal_list").html(detailHtml)

  var livingScore = ( Math.round(complexInfo["주거총점"] * 100) / 100 ).toFixed(2); 
  var transportScore = ( Math.round(complexInfo["교통총점"] * 100) / 100 ).toFixed(2); 
  var infraScore = ( Math.round(complexInfo["인프라총점"] * 100) / 100 ).toFixed(2);
  var eduScore = ( Math.round(complexInfo["학군총점"] * 100) / 100 ).toFixed(2);

  if(complexInfo["교통총점"] == "NA" || complexInfo["교통총점"] == undefined){
    drawCompareTotalChart(livingScore, "NA", infraScore, eduScore, compareNum)
  }
  else{
    drawCompareTotalChart(livingScore, transportScore, infraScore, eduScore, compareNum)
  } 
  drawCompareSubChart(livingScore, "living", compareNum)

  if(complexInfo["교통총점"] == "NA" || complexInfo["교통총점"] == undefined){
    drawCompareSubChart(0, "trans", compareNum)
  }
  else{
    transportScore = ( Math.round(complexInfo["교통총점"] * 100) / 100 ).toFixed(2);
    drawCompareSubChart(transportScore, "trans", compareNum)
  }
  drawCompareSubChart(infraScore, "infra", compareNum)
  drawCompareSubChart(eduScore, "edu", compareNum)

  setTimeout(function(){
    $("#compare_loading").hide()
    $("#compare_wrapper").css({'visibility':'visible'})
  }, 150)
}

var totalChart = []
function drawCompareTotalChart(livingScore, transportScore, infraScore, eduScore, compareNum){
  var label = ["주거", "교통", "인프라", "교육"]
  var data = [livingScore, transportScore, infraScore, eduScore]

  var chartName = "compare" + compareNum + "_complex_chart"
  var min = 0
  var max = 100
  var anchor = 'end'
  var animationFrom = 0  

  if(transportScore == "NA"){
    label = ["주거", "교통", "인프라", "교육"]
    data = [livingScore, 0, infraScore, eduScore]        
  }  

  if(compareNum == 1){
    data[0] = livingScore * (-1)
    data[1] = transportScore * (-1)
    data[2] = infraScore * (-1)
    data[3] = eduScore* (-1)
    anchor = 'start'
    min = -100
    max = 0
    animationFrom = $("#" + chartName).width()
  }

  var colorArray = []
  var alignArray = []

  if(compareNum == 1){
    for (var i = 0; i < data.length ; i++){
      if(data[i] < -85){
        colorArray.push('white')
        alignArray.push('end')
      }
      else{
        colorArray.push('black')
        alignArray.push('start')
      }
    }
  }

  if(compareNum == 2){
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
  }

  var barThickness = 14
  if(isMobile){
    barThickness = 10
  }

  var ctx = document.getElementById(chartName).getContext('2d');
  if(totalChart[chartName]){
    totalChart[chartName].clear()
    totalChart[chartName].destroy()
  }  
  totalChart[chartName] = new Chart(ctx, {
    type: 'bar',
    plugins:[ChartDataLabels],
    data: {          
      labels: label,
      datasets: [{                
        data: data,
        backgroundColor: [            
            '#e31939',
            '#e31939',
            '#e31939',
            '#e31939',
        ],
        borderColor: [
            'rgba(255,99,132, 0)',
            'rgba(54, 162, 235, 0)',
        ],                
        barThickness: barThickness,            
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
          anchor: anchor,              
          offset: 2,
          textAlign: 'center',
          font: {
            weight: 'bold'
          },
          formatter: function(value, ctx){
            if(transportScore == "NA" && ctx.dataIndex == 1){
              return "해당없음"
            }
            if(compareNum == 1){
              if(isMobile){
                return (value*(-1)).toFixed(0)
              }
              else{
                return (value*(-1)).toFixed(2)
              }
            }

            if(compareNum == 2){
              if(isMobile){
                return (value*(1)).toFixed(0)
              }
              else{
                return (value*(1)).toFixed(2)
              }
            }
          }
        },                      
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuint',
        x:{
          from : animationFrom,          
        }
      },
      scales: {
        x:{
          display: false,
          type: 'linear',
          min: min,
          max: max,
        },
        y:{
          display: false
        },
      }          
    }
  });
}

function drawCompareSubChart(score, subType, compareNum){
  var chartName = "compare" + compareNum + "_complex_" + subType + "_chart"

  var min = 0
  var max = 100
  var anchor = 'end'
  var animationFrom = 0  

  if(compareNum == 1){
    score = score * (-1)    
    anchor = 'start'
    min = -100
    max = 0
    animationFrom = $("#" + chartName).width()
  }  

  var labelColor = ""
  var labelAlign = ""

  if(compareNum == 1){
    if(score < -85){
      labelColor = 'white'
      labelAlign = 'end'
    }
    else{
      labelColor = 'black'
      labelAlign = 'start'
    }
  }

  if(compareNum == 2){
    if(score < 85){
      labelColor = 'black'
      labelAlign = 'end'
    }
    else{
      labelColor = 'white'
      labelAlign = 'start'
    }
  }

  if(totalChart[chartName]){
    totalChart[chartName].clear()
    totalChart[chartName].destroy()
  }

  var barThickness = 12
  if(isMobile){
    barThickness = 9
  }

  var ctx = document.getElementById(chartName).getContext('2d');
 
  totalChart[chartName] = new Chart(ctx, {
    type: 'bar',
    plugins:[ChartDataLabels],
    data: {          
      labels: [""],
      datasets: [{                
        data: [score],
        backgroundColor: '#f76f45',        
        borderColor: 'rgba(255,99,132, 0)',                
        barThickness: barThickness,            
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
          color: labelColor,
          align: labelAlign,
          anchor: anchor,              
          offset: 2,
          textAlign: 'center',
          font: {
            weight: 'bold'
          },
          formatter: function(value){
            if(subType=='trans' && value == 0){
              return '해당없음'
            }
            if(compareNum == 1){
              if(isMobile){
                return (value*(-1)).toFixed(0)
              }
              else{
                return (value*(-1)).toFixed(2)
              }              
            }

            if(compareNum == 2){
              if(isMobile){
                return (value*(1)).toFixed(0)
              }
              else{
                return (value*(1)).toFixed(2)
              }              
            }
          }
        },                      
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuint',
        x:{
          from : animationFrom,          
        }
      },
      scales: {
        x:{
          display: false,
          type: 'linear',
          min: min,
          max: max,
        },
        y:{
          display: false
        },
      }          
    }
  });
}
