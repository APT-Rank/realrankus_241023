/*
var btn_timer = setInterval(function () {
  $('#btn_complex_compare').animate({'opacity': 0} ,750 , function () {
    $('#btn_complex_compare').animate({'opacity': 1}, 750);
  });
}, 3000);
*/

$("#complex_compare_search").hide()

var compareOption = "";
for (i = 1; i < regions.length; i++) {
  var region_name = regions[i][0];
  var region_code = regions[i][1];
  if (isEn) {
    region_name = tRegion(region_code, region_name);
  } else if (isMobile) {
    if (region_name == "충청북도") {
      region_name = "충북"
    }
    else if (region_name == "충청남도") {
      region_name = "충남"
    }
    else if (region_name == "전북도") {
      region_name = "전북"
    }
    else if (region_name == "전라남도") {
      region_name = "전남"
    }
    else if (region_name == "경상북도") {
      region_name = "경북"
    }
    else if (region_name == "경상남도") {
      region_name = "경남"
    }
    else {
      region_name = region_name.substr(0, 2)
    }
  }
  compareOption += "<option value='" + region_code + "'>" + region_name + "</option>";
}
function compareCheck() {
  if (!login_status) {
    $(".modal-backdrop").css({ "width": "100%" })
    $("#baseModal").css({ "width": "100%" })
    //$("#loginModal").modal("show")
    openModal("loginModal")
    showLogin()
  }
  else {
    openCompare(aptData.data[0])
  }
}

function openCompare(complex_data) {
  //clearInterval(btn_timer)

  if (isMobile) {
    $("#compareModal > div").css({ 'flex-direction': 'column', 'margin-top': '0em' })
  }
  else {
    $("#compareModal > div").css({ 'flex-direction': 'column', 'margin-top': '1em' })
  }

  compare_detail_html = "<div id='compare_option_wrapper'>"

  compare_detail_html += "<div id='compare1_option'>"
  compare_detail_html += "<div id='compare1_sido_selection'><select id='compare1_sido' onChange='compareSidoChange(this.value, 1)'></select></div>"
  compare_detail_html += "<div id='compare1_gungu_selection'><select id='compare1_gungu' onChange='loadComplexList(1, \"init\")'></select></div>"
  compare_detail_html += "</div>"

  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.gungu', '시군구') + "</div>"

  compare_detail_html += "<div id='compare2_option'>"
  compare_detail_html += "<div id='compare2_sido_selection'><select id='compare2_sido' onChange='compareSidoChange(this.value, 2)'></select></div>"
  compare_detail_html += "<div id='compare2_gungu_selection'><select id='compare2_gungu' onChange='loadComplexList(2, \"init\")'></select></div>"
  compare_detail_html += "</div>"

  /*
  compare_detail_html += "<div class='complex_compare_detail' id='compare1_complex_selection'><select id='compare1_complex' onChange='loadComplex(1)'></select></div>"    
  compare_detail_html += "<div class='compare_option_middle'>단지</div>"
  compare_detail_html += "<div class='complex_compare_detail' id='compare2_complex_selection'><select id='compare2_complex' onChange='loadComplex(2)'></select></div>"    
  */

  compare_detail_html += "<div class='complex_compare_detail_wrapper' onClick='loadComplexSearch(1)'>"
  compare_detail_html += "<div class='complex_compare_detail' id='compare1_complex_search' value=''></div>"
  compare_detail_html += "<div class='complex_compare_detail'><i class='fa-solid fa-sort-down'></i></div>"
  compare_detail_html += "</div>"

  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.complex', '단지') + "</div>"

  compare_detail_html += "<div class='complex_compare_detail_wrapper' onClick='loadComplexSearch(2)'>"
  compare_detail_html += "<div class='complex_compare_detail' id='compare2_complex_search' value=''></div>"
  compare_detail_html += "<div class='complex_compare_detail' ><i class='fa-solid fa-sort-down'></i></div>"
  compare_detail_html += "</div>"

  compare_detail_html += "</div>"

  compare_detail_html += "<div id='compare_loading'><div class='spinner-border' role='status'></div></div>"

  compare_detail_html += "<div id='compare_wrapper'>"

  compare_detail_html += "<div class='complex_compare_total'>"

  compare_detail_html += "<div class='complex_compare_detail' id='compare1_complex_rank'></div>"
  compare_detail_html += "<div class='compare_option_middle' id='compare_complex_rank_title'>" + tSafe('ui.compare.rank', 'RANK') + "</div>"
  compare_detail_html += "<div class='complex_compare_detail' id='compare2_complex_rank'></div>"

  compare_detail_html += "<div class='complex_compare_detail' id='compare1_complex_graph'><canvas id='compare1_complex_chart' style='width: 100%'></canvas></div>"
  compare_detail_html += "<div class='compare_option_middle' id='total_chart_label'>"
  compare_detail_html += "<div>" + tSafe('ui.living', '주거') + "</div>"
  compare_detail_html += "<div>" + tSafe('ui.transport', '교통') + "</div>"
  compare_detail_html += "<div>" + tSafe('ui.infra', '인프라') + "</div>"
  compare_detail_html += "<div>" + tSafe('ui.education', '교육') + "</div>"
  compare_detail_html += "</div>"
  compare_detail_html += "<div class='complex_compare_detail' id='compare2_complex_graph'><canvas id='compare2_complex_chart' style='width: 100%'></canvas></div>"

  compare_detail_html += "</div>"

  //주거 비교
  compare_detail_html += "<div class='complex_compare_living'>"
  compare_detail_html += "<div class='complex_compare_detail_graph' id='compare1_complex_living_graph'><canvas id='compare1_complex_living_chart' style='width: 100%'></canvas></div>"
  compare_detail_html += "<div class='compare_option_middle' id='compare_complex_living_title'>" + tSafe('ui.living', '주거') + "</div>"
  compare_detail_html += "<div class='complex_compare_detail_graph' id='compare2_complex_living_graph'><canvas id='compare2_complex_living_chart' style='width: 100%'></canvas></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_address'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.address', '주소') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_address'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_years'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.years', '년차') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_years'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_houseNum'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.house_num', '세대수') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_houseNum'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_parking'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.parking', '주차') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_parking'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_heating'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.heating', '난방') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_heating'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_entrance'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.entrance', '현관구조') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_entrance'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_floor_ratio'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.floor_rate', '용적률') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_floor_ratio'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_living_cover_ratio'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.cover_rate', '건폐율') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_living_cover_ratio'></div>"

  compare_detail_html += "<div id='compare_living_comment'>"
  compare_detail_html += tSafe('ui.compare.rebuild_comment', '재건축 아파트의 경우 용적률 및 건폐율이 낮아 사업성이 좋을 수 있으므로, 대지지분을 함께 고려해 주거 가치 점수를 산정합니다.')
  compare_detail_html += "</div>"

  compare_detail_html += "</div>"

  //교통 비교
  compare_detail_html += "<div class='complex_compare_trans'>"

  compare_detail_html += "<div class='complex_compare_detail_graph' id='compare1_complex_trans_graph'><canvas id='compare1_complex_trans_chart' style='width: 100%'></canvas></div>"
  compare_detail_html += "<div class='compare_option_middle' id='compare_complex_trans_title'>" + tSafe('ui.transport', '교통') + "</div>"
  compare_detail_html += "<div class='complex_compare_detail_graph' id='compare2_complex_trans_graph'><canvas id='compare2_complex_trans_chart' style='width: 100%'></canvas></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_trans_nearest_station'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.nearest_station', '가장 가까운 역') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_trans_nearest_station'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_trans_within30m'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.within_30m', '30분 이내 주요역') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_trans_within30m'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_trans_within1h'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.within_1h', '1시간 이내 주요역') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_trans_within1h'></div>"

  compare_detail_html += "<div id='compare_trans_comment'>"
  compare_detail_html += tSafe('ui.compare.transport_comment', '가장 가까운 역은 직선거리 기준입니다.<br>주요 거점역은 주중 출퇴근 시간 하차 인원이 많은 역 기준입니다.<br>이동시간은 구글 교통정보 대중교통 기준입니다.')
  compare_detail_html += "</div>"

  compare_detail_html += "</div>"

  //인프라 비교
  compare_detail_html += "<div class='complex_compare_infra'>"

  compare_detail_html += "<div class='complex_compare_detail_graph' id='compare1_complex_infra_graph'><canvas id='compare1_complex_infra_chart' style='width: 100%'></canvas></div>"
  compare_detail_html += "<div class='compare_option_middle' id='compare_complex_infra_title'>" + tSafe('ui.infra', '인프라') + "</div>"
  compare_detail_html += "<div class='complex_compare_detail_graph' id='compare2_complex_infra_graph'><canvas id='compare2_complex_infra_chart' style='width: 100%'></canvas></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_department_store'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.dept_store', '백화점(3km)') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_department_store'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_outlet'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.outlet', '아울렛/몰(5km)') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_outlet'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_mart'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.mart', '대형마트(1km)') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_mart'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_market_complex'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.market_300m', '상권(300m)') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_market_complex'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_bank'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.bank', '은행(500m)') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_bank'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_hospital'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.hospital', '병원(500m)') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_hospital'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_big_hospital'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.big_hospital', '대형병원(5km)') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_big_hospital'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_park'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.park', '공원(500m)') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_park'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_big_park'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.big_park', '대형공원(1km)') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_big_park'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_infra_harmful'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.harmful', '혐오시설(3km)') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_infra_harmful'></div>"

  compare_detail_html += "</div>"

  //교육 비교
  compare_detail_html += "<div class='complex_compare_edu'>"

  compare_detail_html += "<div class='complex_compare_detail_graph' id='compare1_complex_edu_graph'><canvas id='compare1_complex_edu_chart' style='width: 100%'></canvas></div>"
  compare_detail_html += "<div class='compare_option_middle' id='compare_complex_edu_title'>" + tSafe('ui.edu', '교육') + "</div>"
  compare_detail_html += "<div class='complex_compare_detail_graph' id='compare2_complex_edu_graph'><canvas id='compare2_complex_edu_chart' style='width: 100%'></canvas></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_edu_pSchool_distance'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.pSchool_distance', '초교거리') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_edu_pSchool_distance'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_edu_pSchool_student'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.pSchool_change', '초교학생증감') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_edu_pSchool_student'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_edu_mSchool_edu'></div>"
  if (isMobile) {
    compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.mSchool_achievement_mobile', '중등<br>성취도') + "</div>"
  }
  else {
    compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.mSchool_achievement', '중등성취도') + "</div>"
  }
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_edu_mSchool_edu'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_edu_academy'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.academy_300m', '학원가(300m)') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_edu_academy'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_edu_academy_long'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.academy_1km', '학원가(1km)') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_edu_academy_long'></div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_edu_harmful'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.edu_harmful', '유흥/모텔(300m)') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_edu_harmful'></div>"

  compare_detail_html += "</div>"

  //실거래가
  compare_detail_html += "<div class='complex_compare_price'>"
  compare_detail_html += "<div class='compare_option_middle' id='compare_complex_price_title'>" + tSafe('ui.compare.real_price', '실거래가') + "</div>"

  compare_detail_html += "<div class='complex1_compare_detail' id='compare1_complex_latest_deal'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.recent_deal', '최근매매') + "</div>"
  compare_detail_html += "<div class='complex2_compare_detail' id='compare2_complex_latest_deal'></div>"

  compare_detail_html += "<div class='complex1_compare_detail_price' id='compare1_complex_latest_deal_list'></div>"
  compare_detail_html += "<div class='compare_option_middle'>" + tSafe('ui.compare.price_by_size', '평별거래') + "</div>"
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

  //$("#compareModal").modal("show");
  openModal("compareModal")
  $("#compareModal").css({ "z-index": "1200" })
  $(".modal-backdrop").css({ "width": "100%", "z-index": "1100" })

  loadComplexList(1, complex_data['검색코드'])
  loadComplexList(2, "init")

  $("#compare_loading").show()
  $("#compare_wrapper").css({ 'visibility': 'hidden' })

  compare1_code = complex_data['검색코드']
  $("#compare1_complex").val(compare1_code).prop("selected", true);

  var aptName = complex_data['아파트명'];
  if (isEn && complex_data['APT_Name_EN']) {
    aptName = complex_data['APT_Name_EN'];
  }
  $("#compare1_complex_info").html(aptName)
  $("#compare1_complex_search").html(aptName);
  $("#compare1_complex_search").val(complex_data['검색코드']);

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

  if (compareNum == 1) {
    $("#compare1_gungu").empty();
    for (var i = 0; i < changeItem.length; i++) {
      var item_arr = changeItem[i][0].split(" ")
      var itemName = changeItem[i][0]
      var itemCode = changeItem[i][1]

      if (isEn) {
        itemName = tDistrict(itemCode, itemName);
      } else if (item_arr.length > 1 && isMobile) {
        itemName = item_arr[0].replace("시", "")
        itemName += " " + item_arr[1].replace("구", "")
      }

      var subOption = $("<option value='" + itemCode + "'>" + itemName + "</option>");
      $("#compare1_gungu").append(subOption);
      if (compareSelectedSubRegion == "") {
        $("#compare1_gungu").val(selectedSubRegion).prop("selected", true);
      }
      else if (compareSelectedSubRegion == "init") {
        $("#compare1_gungu").val(changeItem[0][1]).prop("selected", true);
      }
      else {
        $("#compare1_gungu").val(compareSelectedSubRegion).prop("selected", true);
      }
    }
  }
  if (compareNum == 2) {
    $("#compare2_gungu").empty();
    for (var i = 0; i < changeItem.length; i++) {
      var item_arr = changeItem[i][0].split(" ")
      var itemName = changeItem[i][0]
      var itemCode = changeItem[i][1]

      if (isEn) {
        itemName = tDistrict(itemCode, itemName);
      } else if (item_arr.length > 1 && isMobile) {
        itemName = item_arr[0].replace("시", "")
        itemName += " " + item_arr[1].replace("구", "")
      }

      var subOption = $("<option value='" + itemCode + "'>" + itemName + "</option>");
      $("#compare2_gungu").append(subOption);
      if (compareSelectedSubRegion == "") {
        $("#compare2_gungu").val(selectedSubRegion).prop("selected", true);
      }
      else if (compareSelectedSubRegion == "init") {
        $("#compare2_gungu").val(changeItem[0][1]).prop("selected", true);
      }
      else {
        $("#compare2_gungu").val(compareSelectedSubRegion).prop("selected", true);
      }
    }
  }
}

function compareSidoChange(compareSelectedRegion, compareNum) {
  compareOptionChange(compareSelectedRegion, "init", compareNum)
  loadComplexList(compareNum, "init")
}

function loadComplexList(compareNum, code) {
  var searchingData_list = searchingData.data
  var selected_compare_list = []
  var complex_code = code

  if (compareNum == 1) {
    $("#compare1_complex").html("")
    $("#complex_compare1_search_list").html("");
    compareSubRegion = $("#compare1_gungu option:selected").val()

    for (var i = 0; i < searchingData_list.length; i++) {
      var searchName = searchingData_list[i]["gungu"]
      if (searchName.indexOf(compareSubRegion) >= 0) {
        selected_compare_list.push(searchingData_list[i])
      }
    }
    var compare_list_result = selected_compare_list.sort((a, b) => b['가치 총점'] - a['가치 총점']);

    for (var j = 0; j < selected_compare_list.length; j++) {
      //var complexListOption = $( "<option value='" + compare_list_result[j]['검색코드'] + "'>" + compare_list_result[j]['아파트명'] + "</option>" );
      //$("#compare1_complex").append(complexListOption);      

      var aptName = compare_list_result[j]['아파트명'];
      if (isEn && compare_list_result[j]['APT_Name_EN']) {
        aptName = compare_list_result[j]['APT_Name_EN'];
      }
      var lawAddr = compare_list_result[j]['법정동주소'];
      if (isEn && compare_list_result[j]['Law_Addr_EN']) {
        lawAddr = compare_list_result[j]['Law_Addr_EN'];
      }

      var complexListSearch = "<div class='compare_search_list' value='" + compare_list_result[j]['검색코드'] + "' onClick='loadComplex2(" + compareNum + ",\"" + compare_list_result[j]['검색코드'] + "\")'>"
      complexListSearch += "<div class='searched_apt_name'>" + aptName + "</div>"
      complexListSearch += "<div class='searched_apt_info'>" + lawAddr + "</div>"
      complexListSearch += "</div>"

      $("#complex_compare1_search_list").append(complexListSearch);
    }

    if (complex_code == "init") {
      var firstAptName = compare_list_result[0]['아파트명'];
      if (isEn && compare_list_result[0]['APT_Name_EN']) {
        firstAptName = compare_list_result[0]['APT_Name_EN'];
      }
      $("#compare1_complex_search").html(firstAptName)
      $("#compare1_complex_search").val(compare_list_result[0]['검색코드'])
      complex_code = compare_list_result[0]['검색코드']
    }
  }

  if (compareNum == 2) {
    $("#compare2_complex").html("")
    $("#complex_compare2_search_list").html("");
    compareSubRegion = $("#compare2_gungu option:selected").val()

    for (var i = 0; i < searchingData_list.length; i++) {
      var searchName = searchingData_list[i]["gungu"]
      if (searchName.indexOf(compareSubRegion) >= 0) {
        selected_compare_list.push(searchingData_list[i])
      }
    }

    var compare_list_result = selected_compare_list.sort((a, b) => b['가치 총점'] - a['가치 총점']);

    for (var j = 0; j < selected_compare_list.length; j++) {
      //var complexListOption = $( "<option value='" + compare_list_result[j]['검색코드'] + "'>" + compare_list_result[j]['아파트명'] + "</option>" );
      //$("#compare2_complex").append(complexListOption);

      var aptName = compare_list_result[j]['아파트명'];
      if (isEn && compare_list_result[j]['APT_Name_EN']) {
        aptName = compare_list_result[j]['APT_Name_EN'];
      }
      var lawAddr = compare_list_result[j]['법정동주소'];
      if (isEn && compare_list_result[j]['Law_Addr_EN']) {
        lawAddr = compare_list_result[j]['Law_Addr_EN'];
      }

      var complexListSearch = "<div class='compare_search_list' value='" + compare_list_result[j]['검색코드'] + "' onClick='loadComplex2(" + compareNum + ",\"" + compare_list_result[j]['검색코드'] + "\")'>"
      complexListSearch += "<div class='listed_apt_name'>" + aptName + "</div>"
      complexListSearch += "<div class='listed_apt_info'>" + lawAddr + "</div>"
      complexListSearch += "</div>"

      $("#complex_compare2_search_list").append(complexListSearch);
    }

    if (complex_code == "init") {
      var firstAptName = compare_list_result[0]['아파트명'];
      if (isEn && compare_list_result[0]['APT_Name_EN']) {
        firstAptName = compare_list_result[0]['APT_Name_EN'];
      }
      $("#compare2_complex_search").html(firstAptName)
      $("#compare2_complex_search").val(compare_list_result[0]['검색코드'])
      complex_code = compare_list_result[0]['검색코드']
    }
  }

  loadComplex2(compareNum, complex_code)
}

var complexSearchCompareNum = 1
function loadComplexSearch(compareNum) {
  $('body').append("<div id='complex_compare_search_bg' onClick='closeComplexSearch(" + compareNum + ", \"\")' style='opacity:0.0'></div>")

  $("#complex_compare_search").show()
  $("#complex_compare_search_list_wrapper").scrollTop(0)

  if (compareNum == 1) {
    $("#complex_compare1_search_list").show()
    $("#complex_compare2_search_list").hide()

    $("#compareInputSearch1").show()
    $("#compareInputSearch2").hide()

    $("#close_compare1_search").show()
    $("#close_compare2_search").hide()

    $("#close_compare1_modal").show()
    $("#close_compare2_modal").hide()
  }
  if (compareNum == 2) {
    $("#complex_compare2_search_list").show()
    $("#complex_compare1_search_list").hide()

    $("#compareInputSearch2").show()
    $("#compareInputSearch1").hide()

    $("#close_compare2_search").show()
    $("#close_compare1_search").hide()

    $("#close_compare2_modal").show()
    $("#close_compare1_modal").hide()
  }

  $("#complex_compare_search").animate({
    opacity: 1.0,
  }, 350
  );
  $("#complex_compare_search_bg").animate({
    opacity: 0.6,
  }, 350
  );
}

function closeComplexSearch(compareNum, code) {
  $("#complex_compare_search").animate({
    opacity: 0.0,
  }, 350, '', function () {
    $("#compareInputSearch" + compareNum).val("")
    loadComplexList(compareNum, code)
    $("#complex_compare_search").hide()
    compareInput = ""
  }
  );
  $("#complex_compare_search_bg").animate({
    opacity: 0.0,
  }, 350, "", function () {
    $("#complex_compare_search_bg").remove()
  }
  );
}

function loadComplex(compareNum) {
  if (compareNum == 1) {
    search_region = $("#compare1_gungu option:selected").val()
    search_val = $("#compare1_complex option:selected").val()
    firebase.database().ref().child("complex_info").child(search_region).child(search_val).get()
      .then((snapshot) => {
        if (snapshot.exists()) {
          complex_info = snapshot.val()
          tlgm_txt = $("#compare1_complex option:selected").text() + " vs " + $("#compare2_complex option:selected").text()
          tlgm_txt += "%0A"
          var aptName = complex_info['아파트명'];
          if (isEn && complex_info['APT_Name_EN']) {
            aptName = complex_info['APT_Name_EN'];
          }
          tlgm_txt += "(Loaded Complex 1 = " + aptName + ")"
          //sendTelegram_single_message(tlgm_txt)
          if (complex_info == null) {
            setTimeout(function () {
              loadComplex(compareNum)
            }, 350)
          }
          else {
            drawComplex(complex_info, compareNum)
          }
        }
        else {
          alert(tSafe('ui.compare.load_failed', '불러오기 실패했어요. 다시 시도해 주세요.'))
        }
      })
      .catch((error) => {
        console.log(error.message)
      })
  }
  if (compareNum == 2) {
    search_region = $("#compare2_gungu option:selected").val()
    search_val = $("#compare2_complex option:selected").val()
    firebase.database().ref().child("complex_info").child(search_region).child(search_val).get()
      .then((snapshot) => {
        if (snapshot.exists) {
          complex_info = snapshot.val()
          tlgm_txt = $("#compare1_complex option:selected").text() + " vs " + $("#compare2_complex option:selected").text()
          tlgm_txt += "%0A"
          var aptName = complex_info['아파트명'];
          if (isEn && complex_info['APT_Name_EN']) {
            aptName = complex_info['APT_Name_EN'];
          }
          tlgm_txt += "(Loaded Complex 2 = " + aptName + ")"
          //drawComplex(complex_info, compareNum)  

          if (complex_info == null) {
            setTimeout(function () {
              loadComplex(compareNum)
            }, 350)
          }
          else {
            drawComplex(complex_info, compareNum)
          }

        }
        else {
          alert(tSafe('ui.compare.load_failed', '불러오기 실패했어요. 다시 시도해 주세요.'))
        }
      })
      .catch((error) => {
        console.log(error.message)
      })
  }
}
function clearInput(compareNum) {
  compareInput = ""
  $("#compareInputSearch" + compareNum).val("")
  compareSearch(compareNum)
}

var compareInput = ""
function compareSearch(compareNum) {
  searching_list = "complex_compare" + compareNum + "_search_list"
  $('#' + searching_list).html("");

  input_field = "compareInputSearch" + compareNum
  compareInput_base = $('#' + input_field).val()
  compareInput = compareInput_base.trim()

  compareInput_arr = []
  compareInput_arr_base = compareInput.split(" ")

  if (compareInput_arr_base.length == 1) {
    compareInput_arr[0] = compareInput_arr_base[0]
  }
  else if (compareInput_arr_base.length == 2) {
    compareInput_arr[0] = compareInput_arr_base[0]
    compareInput_arr[1] = compareInput_arr_base[1]
  }
  else {
    inputStr = ""
    for (var k = 1; k < compareInput_arr_base.length; k++) {
      inputStr += compareInput_arr_base[k]
    }
    compareInput_arr[0] = compareInput_arr_base[0]
    compareInput_arr[1] = inputStr
  }

  if (compareInput.length >= 2) {
    if (compareInput_arr.length == 1) {
      for (var i = 0; i < searchingData.data.length; i++) {
        var aptName = searchingData.data[i]["아파트명"];
        var aptNameEn = searchingData.data[i]["APT_Name_EN"] || "";
        var lawAddr = searchingData.data[i]["법정동주소"];
        var lawAddrEn = searchingData.data[i]["Law_Addr_EN"] || "";

        if (isEn) {
          if (aptNameEn) aptName = aptNameEn;
          if (lawAddrEn) lawAddr = lawAddrEn;
        }

        var searchName = searchingData.data[i]["아파트명"] + " " + searchingData.data[i]["법정동주소"] + " " + aptNameEn + " " + lawAddrEn;

        if (searchName.indexOf(compareInput) >= 0) {
          var code = searchingData.data[i]["검색코드"]
          var sido = searchingData.data[i]["sido"]
          var gungu = searchingData.data[i]["gungu"]

          var addon_html = "<div class='compare_search_list' onClick='compareSearchingUpdate(\"" + aptName.replace(/'/g, "\\'") + "\", \"" + code + "\",\"" + sido + "\",\"" + gungu + "\"," + compareNum + ")'>";
          addon_html += "<div class='searched_apt_name'>" + aptName + "</div>"
          addon_html += "<div class='searched_apt_info'>" + lawAddr + "</div>";
          addon_html += "</div>"

          $('#' + searching_list).append(addon_html);
        }
      }

      $(".searched_apt_name:contains('" + compareInput + "')").each(function () {
        var regex = new RegExp(compareInput, 'gi')
        $(this).html($(this).text().replace(regex, "<span class='colorTxt'>" + compareInput + "</span>"));
      })
      $(".searched_apt_info:contains('" + compareInput + "')").each(function () {
        var regex2 = new RegExp(compareInput, 'gi')
        $(this).html($(this).text().replace(regex2, "<span class='colorTxt'>" + compareInput + "</span>"));
      })
    }
    else {
      for (var i = 0; i < searchingData.data.length; i++) {
        var aptName = searchingData.data[i]["아파트명"];
        var aptNameEn = searchingData.data[i]["APT_Name_EN"] || "";
        var lawAddr = searchingData.data[i]["법정동주소"];
        var lawAddrEn = searchingData.data[i]["Law_Addr_EN"] || "";

        if (isEn) {
          if (aptNameEn) aptName = aptNameEn;
          if (lawAddrEn) lawAddr = lawAddrEn;
        }

        var searchName = searchingData.data[i]["아파트명"] + " " + searchingData.data[i]["법정동주소"] + " " + aptNameEn + " " + lawAddrEn;

        if (searchName.indexOf(compareInput_arr[0]) >= 0 && searchName.indexOf(compareInput_arr[1]) >= 0) {
          var code = searchingData.data[i]["검색코드"]
          var sido = searchingData.data[i]["sido"]
          var gungu = searchingData.data[i]["gungu"]

          var addon_html = "<div class='compare_search_list' onClick='compareSearchingUpdate(\"" + aptName.replace(/'/g, "\\'") + "\", \"" + code + "\",\"" + sido + "\",\"" + gungu + "\"," + compareNum + ")'>";
          addon_html += "<div class='searched_apt_name'>" + aptName + "</div>"
          addon_html += "<div class='searched_apt_info'>" + lawAddr + "</div>";
          addon_html += "</div>"

          $('#' + searching_list).append(addon_html);
        }
      }

      $(".searched_apt_name:contains('" + compareInput_arr[0] + "')" + "," + ".searched_apt_name:contains('" + compareInput_arr[1] + "')").each(function () {
        var regex3 = new RegExp(compareInput_arr[0], 'gi')
        var regex4 = new RegExp(compareInput_arr[1], 'gi')
        console.log($(this).text())
        $(this).html($(this).text().replace(regex3, "<span class='colorTxt'>" + compareInput_arr[0] + "</span>").replace(regex4, "<span class='colorTxt'>" + compareInput_arr[1] + "</span>"))
      })
      $(".searched_apt_info:contains('" + compareInput_arr[0] + "')" + "," + ".searched_apt_info:contains('" + compareInput_arr[1] + "')").each(function () {
        var regex5 = new RegExp(compareInput_arr[0], 'gi')
        var regex6 = new RegExp(compareInput_arr[1], 'gi')
        $(this).html($(this).text().replace(regex5, "<span class='colorTxt2'>" + compareInput_arr[0] + "</span>").replace(regex6, "<span class='colorTxt2'>" + compareInput_arr[1] + "</span>"))
      })
    }

    $('#' + searching_list).append("<div style='height: 3em'></div>");
    //$('html').scrollTop(0)
  }
  else {
    var addon_html = "<div style='font-size: 0.9em; font-weight: 600; text-align:center; padding-top: 30px'>" + tSafe('ui.compare.search_min_length_notice', '빠른 검색 속도를 위해 <br> 두 글자 이상부터 검색할 수 있도록 해 두었어요!<br>') + "</div>"
    $('#' + searching_list).append(addon_html);
  }
}

function compareSearchingUpdate(aptName, code, sido, gungu, compareNum) {
  $("#compare" + compareNum + "_sido").val(sido).prop("selected", true);
  $("#compare" + compareNum + "_complex_search").html(aptName)
  $("#compare" + compareNum + "_complex_search").val(code)

  compareOptionChange(sido, gungu, compareNum)
  closeComplexSearch(compareNum, code)
}

function loadComplex2(compareNum, val) {
  if (compareNum == 1) {
    search_region = $("#compare1_gungu option:selected").val()
    search_val = val
    if (search_val != "") {
      firebase.database().ref().child("complex_info").child(search_region).child(search_val).get()
        .then((snapshot) => {
          if (snapshot.exists()) {
            complex_info = snapshot.val()
            tlgm_txt = $("#compare1_complex option:selected").text() + " vs " + $("#compare2_complex option:selected").text()
            tlgm_txt += "%0A"
            var aptName = complex_info['아파트명'];
            if (isEn && complex_info['APT_Name_EN']) {
              aptName = complex_info['APT_Name_EN'];
            }
            tlgm_txt += "(Loaded Complex 1 = " + aptName + ")"
            //sendTelegram_single_message(tlgm_txt)
            if (complex_info == null) {
              setTimeout(function () {
                loadComplex2(compareNum, search_val)
              }, 350)
            }
            else {
              closeComplexSearch(compareNum, "")
              $("#compare1_complex_search").html(aptName)
              $("#compare1_complex_search").val(complex_info['검색코드'])
              drawComplex(complex_info, compareNum)
            }
          }
          else {
            console.log("BBBBBBBBBB")
            alert(tSafe('ui.compare.load_failed', '불러오기 실패했어요. 다시 시도해 주세요.'))
          }
        })
        .catch((error) => {
          console.log(error.message)
        })
    }
  }
  if (compareNum == 2) {
    search_region = $("#compare2_gungu option:selected").val()
    search_val = val
    if (search_val != "") {
      firebase.database().ref().child("complex_info").child(search_region).child(search_val).get()
        .then((snapshot) => {
          if (snapshot.exists) {
            complex_info = snapshot.val()
            tlgm_txt = $("#compare1_complex option:selected").text() + " vs " + $("#compare2_complex option:selected").text()
            tlgm_txt += "%0A"
            var aptName = complex_info['아파트명'];
            if (isEn && complex_info['APT_Name_EN']) {
              aptName = complex_info['APT_Name_EN'];
            }
            tlgm_txt += "(Loaded Complex 2 = " + aptName + ")"
            //drawComplex(complex_info, compareNum)  

            if (complex_info == null) {
              setTimeout(function () {
                loadComplex2(compareNum, search_val)
              }, 350)
            }
            else {
              closeComplexSearch(compareNum, "")
              $("#compare2_complex_search").html(aptName)
              $("#compare2_complex_search").val(complex_info['검색코드'])
              drawComplex(complex_info, compareNum)
            }

          }
          else {
            alert(tSafe('ui.compare.load_failed', '불러오기 실패했어요. 다시 시도해 주세요.'))
          }
        })
        .catch((error) => {
          console.log(error.message)
        })
    }
  }
}

function drawComplex(complexInfo, compareNum) {
  selectedCompare = "#compare" + compareNum + "_complex_"
  var address = complexInfo["법정동주소"]
  if (isEn && complexInfo["Law_Addr_EN"]) {
    address = complexInfo["Law_Addr_EN"];
  }
  var aptValue = complexInfo["가치 총점"]
  complex_grade = setGrade(aptValue)
  shorten_address = ""
  if (isMobile) {
    subregionText = $("#compare" + compareNum + "_gungu option:selected").text();
    subregionText_arr = subregionText.split(" ")
    address_arr = address.split(" ")
    for (var i = subregionText_arr.length + 1; i < address_arr.length; i++) {
      shorten_address += address_arr[i] + " "
    }
    address = shorten_address
  }
  $(selectedCompare + "address").html(address)
  $(selectedCompare + "rank").html("Rank " + complex_grade)

  //주거
  var build_year = complexInfo["준공년차"]
  var apt_type = complexInfo["매매타입"]
  var apt_type_en = "";
  if (isEn) {
    if (apt_type === "재건축") apt_type_en = " (Reconstruction)";
    else if (apt_type === "분양권") apt_type_en = " (Pre-sale Right)";
    else if (apt_type === "분양(예정)") apt_type_en = " (Pre-sale Planned)";
  } else {
    if (apt_type == "아파트") {
      apt_type = ""
    }
    else {
      apt_type_en = " (" + apt_type + ")"
    }
  }
  var build_info = build_year + (isEn ? " yrs" : "년차") + apt_type_en
  $(selectedCompare + "living_years").html(build_info)

  var house_num = complexInfo["세대수"]
  $(selectedCompare + "living_houseNum").html(house_num.toLocaleString() + (isEn ? " households" : "세대"))

  var parking = complexInfo["주차"]
  if (isEn && parking && typeof parking === 'string') {
    if (parking == "" || parking == null || parking == undefined || parking == "미정") {
      parking = "TBD";
    } else {
      parking = parking.replace("세대당 ", "").replace("대", " per household");
    }
  }
  $(selectedCompare + "living_parking").html(parking)

  var heating = complexInfo["난방"];
  if (isEn && heating && typeof heating === 'string') {
    var heatingDict = {
      "개별난방": "Individual",
      "지역난방": "District",
      "중앙난방": "Central",
      "도시가스": "City Gas",
      "미정": "TBD"
    };
    heating = heatingDict[heating] || heating;
  }
  $(selectedCompare + "living_heating").html(heating)

  var entrance = complexInfo["현관구조"];
  if (isEn && entrance && typeof entrance === 'string') {
    var entranceDict = {
      "계단식": "Staircase",
      "복도식": "Corridor",
      "복합식": "Mixed",
      "미정": "TBD"
    };
    entrance = entranceDict[entrance] || entrance;
  }
  $(selectedCompare + "living_entrance").html(entrance)

  var floor_rate = complexInfo["용적률"];
  if (floor_rate == "0" || floor_rate == 0 || floor_rate == undefined || isNaN(floor_rate)) {
    floor_rate = "--%";
  }
  else {
    floor_rate = floor_rate + "%";
  }
  $(selectedCompare + "living_floor_ratio").html(floor_rate)

  var cover_rate = complexInfo["건폐율"];
  if (cover_rate == "0" || cover_rate == 0 || cover_rate == undefined || isNaN(cover_rate)) {
    cover_rate = "--%";
  }
  else {
    cover_rate = cover_rate + "%";
  }
  $(selectedCompare + "living_cover_ratio").html(cover_rate)

  //교통
  var nearestStation = "--"
  var subway_line = "--"
  var stationPoint_30m = "--";
  var stations_30m = "--"
  var stationPoint_1h = "--";
  var stations_1h = "--"

  if (complexInfo["교통총점"] == "NA" || complexInfo["교통총점"] == undefined || complexInfo["교통총점"] == 0 || complexInfo["교통총점"] == null) {
    $(selectedCompare + "trans_nearest_station").html(nearestStation)
  }
  else {
    var stationName = isEn ? (complexInfo["closest_station"] || complexInfo["가까운역이름"]) : (complexInfo["가까운역이름"] + "역");
    nearestStation = stationName + "(" + (Math.round(complexInfo["가까운역거리"] * 100) / 100).toFixed() + "m)";
    subway_line = isEn ? (complexInfo["Line_EN"] || complexInfo["역노선"]) : complexInfo["역노선"];
    try {
      subway_line = subway_line.replace("[", "")
      subway_line = subway_line.replace("]", "")
      subway_line = subway_line.replaceAll("'", "")
    }
    catch (e) {
      subway_line = eval(isEn ? (complexInfo["Line_EN"] || complexInfo["역노선"]) : complexInfo["역노선"]);
    }
    $(selectedCompare + "trans_nearest_station").html(nearestStation + "<div class='compareStations'>" + subway_line + "</div>")
  }

  if (complexInfo["교통총점"] == "NA" || complexInfo["교통총점"] == undefined || complexInfo["교통총점"] == 0 || complexInfo["교통총점"] == null) {
    $(selectedCompare + "trans_within30m").html("--")
  }
  else {
    stationPoint_30m = complexInfo["30분이내주요거점역"] + (isEn ? "" : "개");
    stations_30m = isEn ? (complexInfo["Key_stations_30m"] || complexInfo["30분거점역이름"]) : complexInfo["30분거점역이름"]
    stations_30m = stations_30m.replace("[", "")
    stations_30m = stations_30m.replace("]", "")
    stations_30m = stations_30m.replaceAll("'", "")

    $(selectedCompare + "trans_within30m").html(stationPoint_30m)
    $(selectedCompare + "trans_within30m").append("<div class='compareStations'>" + stations_30m + "</div>")
  }

  if (complexInfo["교통총점"] == "NA" || complexInfo["교통총점"] == undefined || complexInfo["교통총점"] == 0 || complexInfo["교통총점"] == null) {
    $(selectedCompare + "trans_within1h").html("--")
  }
  else {
    stationPoint_1h = complexInfo["1시간이내주요거점역"] + (isEn ? "" : "개");
    stations_1h = isEn ? (complexInfo["Key_stations_1h"] || complexInfo["1시간거점역이름"]) : complexInfo["1시간거점역이름"]
    stations_1h = stations_1h.replace("[", "")
    stations_1h = stations_1h.replace("]", "")
    stations_1h = stations_1h.replaceAll("'", "")

    $(selectedCompare + "trans_within1h").html(stationPoint_1h)
    $(selectedCompare + "trans_within1h").append("<div class='compareStations'>" + stations_1h + "</div>")
  }

  //인프라
  var departmentStore_3km = complexInfo["3km이내백화점수"] + (isEn ? "" : "개");
  $(selectedCompare + "infra_department_store").html(departmentStore_3km)

  var OutletMall_5km = complexInfo["5km이내아울렛몰수"] + (isEn ? "" : "개");
  $(selectedCompare + "infra_outlet").html(OutletMall_5km)

  var bigMart_1km = complexInfo["1km이내대형먀트수"] + (isEn ? "" : "개");
  $(selectedCompare + "infra_mart").html(bigMart_1km)

  var bank_500m = complexInfo["500m이내은행수"] + (isEn ? "" : "개");
  $(selectedCompare + "infra_bank").html(bank_500m)

  var hospital_500m = complexInfo["500m이내병원수"] + (isEn ? "" : "개");
  $(selectedCompare + "infra_hospital").html(hospital_500m)

  var bigHospital_5km = complexInfo["5km이내대형병원수"] + (isEn ? "" : "개");
  $(selectedCompare + "infra_big_hospital").html(bigHospital_5km)

  var park_500m = complexInfo["500m이내공원수"] + (isEn ? "" : "개");
  $(selectedCompare + "infra_park").html(park_500m)

  var big_park_1km = complexInfo["800m이내대형공원수"] + (isEn ? "" : "개");
  $(selectedCompare + "infra_big_park").html(big_park_1km)

  var harmful_3km = complexInfo["3km이내혐오시설수"] + (isEn ? "" : "개");
  $(selectedCompare + "infra_harmful").html(harmful_3km)

  var marketCount = complexInfo["300m이내상권"];
  var marketTotal = complexInfo["300m이내점포수"];
  var market_infra = isEn
    ? (marketCount + " area(s) (" + marketTotal + " in total)")
    : (marketCount + "개(총 " + marketTotal + "개 지점)");
  $(selectedCompare + "infra_market_complex").html(market_infra)

  //교육
  var pSchool_distance = complexInfo["초등학교거리"];
  if (pSchool_distance - 100 < 0) {
    minDistance = parseInt(pSchool_distance * 0.8);
  } else {
    minDistance = parseInt(pSchool_distance - 100);
  }
  maxDistance = parseInt(pSchool_distance);
  $(selectedCompare + "edu_pSchool_distance").html(minDistance.toLocaleString() + "~" + maxDistance.toLocaleString() + "m")

  var pSchool_edu = complexInfo["초등학교학업성취도"];
  if (pSchool_edu > 95 && pSchool_edu <= 100) {
    pSchool_edu_result = tSafe('ui.report.transfer_in_heavy', '많은 전입');
  } else if (pSchool_edu >= 92 && pSchool_edu <= 95) {
    pSchool_edu_result = tSafe('ui.report.transfer_in_light', '적은 전입');
  } else if (pSchool_edu >= 88 && pSchool_edu < 92) {
    pSchool_edu_result = tSafe('ui.report.transfer_neutral', '전입/전출 적음');
  } else if (pSchool_edu >= 85 && pSchool_edu < 88) {
    pSchool_edu_result = tSafe('ui.report.transfer_out_light', '적은 전출');
  } else {
    pSchool_edu_result = tSafe('ui.report.transfer_out_heavy', '많은 전출');
  }
  $(selectedCompare + "edu_pSchool_student").html(pSchool_edu_result)

  var mSchool_edu = Number(complexInfo["중학교학업성취도"]).toFixed(1) + "%";
  $(selectedCompare + "edu_mSchool_edu").html(mSchool_edu)

  var academyCount = complexInfo["500m이내학원가"];
  var academyTotal = complexInfo["500m이내학원수"];
  var academy_edu = isEn
    ? (academyCount + " area(s) (" + academyTotal + " in total)")
    : (academyCount + "개(총 " + academyTotal + "개 학원)");
  $(selectedCompare + "edu_academy").html(academy_edu)

  var academyCountLong = complexInfo["1km이내학원가"];
  var academyTotalLong = complexInfo["1km이내학원수"];
  var academy_edu_long = isEn
    ? (academyCountLong + " area(s) (" + academyTotalLong + " in total)")
    : (academyCountLong + "개(총 " + academyTotalLong + "개 학원)");
  $(selectedCompare + "edu_academy_long").html(academy_edu_long)

  var drink_pub = complexInfo["300m이내유흥주점"];
  var daran_pub = complexInfo["300m이내단란주점"];
  var motel = complexInfo["300m이내모텔"];

  $(selectedCompare + "edu_harmful").html(drink_pub + daran_pub + motel + (isEn ? "" : "개"))

  //실거래가
  var area_info = complexInfo["area_info"];
  var last_sales = complexInfo["last_sales"].split(",");
  var last_sales_date = last_sales[0].toString();
  var last_sales_price = last_sales[1].toString();
  var last_sales_area = last_sales[2];
  if (last_sales_price == NaN || last_sales_price == undefined || isNaN(last_sales_price)) {
    last_sales_info = tSafe('ui.compare.no_deal_history', '거래 이력 없음')
  }
  else {
    if (isEn) {
      last_sales_area = last_sales_area.replace("평", "py");
      var str_last_sales_price = (Math.round((last_sales_price) / 100)).toLocaleString() + "M";
      var dateObj = new Date(last_sales_date);
      var str_last_sales_date = last_sales_date.substr(2);
      if (!isNaN(dateObj.getTime())) {
        var options = { year: "numeric", month: "short" };
        str_last_sales_date = dateObj.toLocaleDateString("en-US", options);
      }
      if (isMobile) {
        last_sales_info = last_sales_area + ", " + str_last_sales_price + "<br>" + str_last_sales_date;
      }
      else {
        last_sales_info = last_sales_area + ", " + str_last_sales_price + ", " + str_last_sales_date;
      }
    } else {
      if (isMobile) {
        last_sales_info = last_sales_area + ", " + (Math.round(last_sales_price / 100) / 100).toLocaleString() + "억<br>" + last_sales_date.substr(2)
      }
      else {
        last_sales_info = last_sales_area + ", " + (Math.round(last_sales_price / 100) / 100).toLocaleString() + "억, " + last_sales_date.substr(2)
      }
    }
  }
  $(selectedCompare + "latest_deal").html(last_sales_info)


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
  start_date.setMonth(today.getMonth());

  detailHtml = ""

  detailHtml += "<table class='table table-striped' id='dealTable' style='font-size:0.8em'>";
  detailHtml += "<thead class='table-light'>";
  detailHtml += "<tr>";
  detailHtml += "<th scope='col'>" + tSafe('ui.compare.table_size', '평형') + "</th>";
  detailHtml += "<th scope='col'>" + tSafe('ui.compare.table_sales_rent', '매매 / 전세') + "</th>";
  detailHtml += "</tr>";
  detailHtml += "</thead>";

  detailHtml += "<tbody>";
  for (var k = 0; k < area_array.length; k++) {
    detailHtml += "<tr>";
    var areaText = area_array[k];
    if (isEn) {
      areaText = areaText.replace("평", "py");
    }
    if (sales_info_array[k] == "거래 정보 없음") {
      if (isMobile) {
        area_arr = area_array[k].splitSafe('(')
        var areaText0 = area_arr[0];
        if (isEn) {
          areaText0 = areaText0.replace("평", "py");
        }
        detailHtml += "<td>" + areaText0 + "<br><span style='font-size:0.8em'>(" + area_arr[1] + "</span></td>";
        detailHtml += "<td>" + tSafe('ui.compare.no_info', '정보 없음') + " <br><span style='font-size:0.7em'> (---)</span>" + "<br>" + tSafe('ui.compare.no_info', '정보 없음') + "<br><span style='font-size:0.7em'> (---)</span></td>";
      }
      else {
        detailHtml += "<td>" + areaText + "</td>";
        detailHtml += "<td>" + tSafe('ui.compare.no_info', '정보 없음') + " <span style='font-size:0.8em'> (---)</span>" + "<br>" + tSafe('ui.compare.no_info', '정보 없음') + " <span style='font-size:0.8em'> (---)</span></td>";
      }


    } else {
      var sales_info_split = sales_info_array[k].split("억");
      var compare_year = Number(sales_info_split[1].substr(2, 4));
      var compare_month = Number(sales_info_split[1].substr(7, 2) - 1);
      var compare_day = Number(sales_info_split[1].substr(10, 2));
      var compare_date = new Date(compare_year, compare_month, compare_day);
      var rent_info_split = rent_info_array[k].split("억");

      if (rent_info_split[0] == "거래 정보 없음") {
      }
      else {
        var compare_rent_year = Number(rent_info_split[1].substr(2, 4));
        var compare_rent_month = Number(
          rent_info_split[1].substr(7, 2) - 1
        );
        var compare_rent_day = Number(rent_info_split[1].substr(10, 2));
        var compare_rent_date = new Date(compare_rent_year, compare_rent_month, compare_rent_day);
      }

      var salesPriceText = "";
      var rentPriceText = "";
      if (isEn) {
        var usdSalesVal = Number(sales_info_split[0]);
        salesPriceText = (Math.round(usdSalesVal * 100)).toLocaleString() + "M";
        if (rent_info_split[0] != "거래 정보 없음") {
          var usdRentVal = Number(rent_info_split[0]);
          rentPriceText = (Math.round(usdRentVal * 100)).toLocaleString() + "M";
        }
      } else {
        salesPriceText = (Math.round(sales_info_split[0] * 100) / 100).toFixed(2) + "억";
        if (rent_info_split[0] != "거래 정보 없음") {
          rentPriceText = (Math.round(rent_info_split[0] * 100) / 100).toFixed(2) + "억";
        }
      }

      if (compare_date > start_date) {
        if (isMobile) {
          area_arr = area_array[k].split('(')
          var areaText0 = area_arr[0];
          if (isEn) {
            areaText0 = areaText0.replace("평", "py");
          }
          detailHtml += "<td><span style='color:#fe4040; font-weight:600'>" + areaText0 + "</span><br><span style='font-size:0.8em'>(" + area_arr[1] + "</span></td>";
          detailHtml += "<td><span style='color:#fe4040; font-weight:600'>" + salesPriceText + "<br><span style='font-size: 0.7em'>" + sales_info_split[1] + "</span></span><br>";
        }
        else {
          detailHtml += "<td><span style='color:#fe4040; font-weight:600'>" + areaText + "</span></td>";
          detailHtml += "<td><span style='color:#fe4040; font-weight:600'>" + salesPriceText + "<span style='font-size: 0.85em'>" + sales_info_split[1] + "</span></span><br>";
        }

      } else {
        if (isMobile) {
          area_arr = area_array[k].split('(')
          var areaText0 = area_arr[0];
          if (isEn) {
            areaText0 = areaText0.replace("평", "py");
          }
          detailHtml += "<td>" + areaText0 + "</span><br><span style='font-size:0.8em'>(" + area_arr[1] + "</td>";
          detailHtml += "<td>" + salesPriceText + "<br><span style='font-size: 0.7em'>" + sales_info_split[1] + "</span><br>";
        }
        else {
          detailHtml += "<td>" + areaText + "</td>";
          detailHtml += "<td>" + salesPriceText + "<span style='font-size: 0.85em'>" + sales_info_split[1] + "</span><br>";
        }
      }

      if (compare_rent_date > start_date) {
        if (rent_info_split[0] == "거래 정보 없음") {
          if (isMobile) {
            detailHtml += tSafe('ui.compare.no_info', '정보 없음') + "<br><span style='font-size: 0.7em'>(---)</span></td>";
          }
          else {
            detailHtml += tSafe('ui.compare.no_info', '정보 없음') + "<span style='font-size: 0.7em'> (---)</span></td>";
          }
        }
        else {
          if (isMobile) {
            detailHtml += "<span style='color:#fe4040; font-weight:600'>" + rentPriceText + "<br><span style='font-size: 0.7em'>" + rent_info_split[1] + "</span></span></td>";
          }
          else {
            detailHtml += "<span style='color:#fe4040; font-weight:600'>" + rentPriceText + "<span style='font-size: 0.85em'>" + rent_info_split[1] + "</span></span></td>";
          }
        }
      } else {
        if (rent_info_split[0] == "거래 정보 없음") {
          if (isMobile) {
            detailHtml += tSafe('ui.compare.no_info', '정보 없음') + "<br><span style='font-size: 0.7em'>(---)</span></td>";
          }
          else {
            detailHtml += tSafe('ui.compare.no_info', '정보 없음') + "<span style='font-size: 0.7em'> (---)</span></td>";
          }
        } else {
          if (isMobile) {
            detailHtml += "" + rentPriceText + "<br><span style='font-size: 0.7em'>" + rent_info_split[1] + "</span></td>";
          }
          else {
            detailHtml += "" + rentPriceText + "<span style='font-size: 0.85em'>" + rent_info_split[1] + "</span></td>";
          }
        }
      }
    }
    detailHtml += "</tr>";
  }
  detailHtml += "</tbody>";
  detailHtml += "</table>";

  $(selectedCompare + "latest_deal_list").html(detailHtml)

  var livingScore = (Math.round(complexInfo["주거총점"] * 100) / 100).toFixed(2);
  var transportScore = (Math.round(complexInfo["교통총점"] * 100) / 100).toFixed(2);
  var infraScore = (Math.round(complexInfo["인프라총점"] * 100) / 100).toFixed(2);
  var eduScore = (Math.round(complexInfo["학군총점"] * 100) / 100).toFixed(2);

  if (complexInfo["교통총점"] == "NA" || complexInfo["교통총점"] == undefined) {
    drawCompareTotalChart(livingScore, "NA", infraScore, eduScore, compareNum)
  }
  else {
    drawCompareTotalChart(livingScore, transportScore, infraScore, eduScore, compareNum)
  }
  drawCompareSubChart(livingScore, "living", compareNum)

  if (complexInfo["교통총점"] == "NA" || complexInfo["교통총점"] == undefined) {
    drawCompareSubChart(0, "trans", compareNum)
  }
  else {
    transportScore = (Math.round(complexInfo["교통총점"] * 100) / 100).toFixed(2);
    drawCompareSubChart(transportScore, "trans", compareNum)
  }
  drawCompareSubChart(infraScore, "infra", compareNum)
  drawCompareSubChart(eduScore, "edu", compareNum)

  setTimeout(function () {
    $("#compare_loading").hide()
    $("#compare_wrapper").css({ 'visibility': 'visible' })
  }, 150)
}

var totalChart = []
function drawCompareTotalChart(livingScore, transportScore, infraScore, eduScore, compareNum) {
  var label = [
    tSafe('ui.sorting.living', '주거'),
    tSafe('ui.sorting.transport', '교통'),
    tSafe('ui.sorting.infra', '인프라'),
    tSafe('ui.sorting.edu', '교육')
  ]
  var data = [livingScore, transportScore, infraScore, eduScore]

  var chartName = "compare" + compareNum + "_complex_chart"
  var min = 0
  var max = 100
  var anchor = 'end'
  var animationFrom = 0

  if (transportScore == "NA" || transportScore == undefined || transportScore == 0 || transportScore == null) {
    label = [
      tSafe('ui.sorting.living', '주거'),
      tSafe('ui.sorting.transport', '교통'),
      tSafe('ui.sorting.infra', '인프라'),
      tSafe('ui.sorting.edu', '교육')
    ]
    data = [livingScore, 0, infraScore, eduScore]
  }

  if (compareNum == 1) {
    data[0] = livingScore * (-1)
    data[1] = transportScore * (-1)
    data[2] = infraScore * (-1)
    data[3] = eduScore * (-1)
    anchor = 'start'
    min = -100
    max = 0
    animationFrom = $("#" + chartName).width()
  }

  var colorArray = []
  var alignArray = []

  if (compareNum == 1) {
    for (var i = 0; i < data.length; i++) {
      if (data[i] < -85) {
        colorArray.push('white')
        alignArray.push('end')
      }
      else {
        colorArray.push('black')
        alignArray.push('start')
      }
    }
  }

  if (compareNum == 2) {
    for (var i = 0; i < data.length; i++) {
      if (data[i] < 85) {
        colorArray.push('black')
        alignArray.push('end')
      }
      else {
        colorArray.push('white')
        alignArray.push('start')
      }
    }
  }

  var barThickness = 14
  if (isMobile) {
    barThickness = 10
  }

  var ctx = document.getElementById(chartName).getContext('2d');
  if (totalChart[chartName]) {
    totalChart[chartName].clear()
    totalChart[chartName].destroy()
  }
  totalChart[chartName] = new Chart(ctx, {
    type: 'bar',
    plugins: [ChartDataLabels],
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
      plugins: {
        legend: {
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
          formatter: function (value, ctx) {
            if ((transportScore == "NA" || transportScore == undefined || transportScore == 0 || transportScore == null) && ctx.dataIndex == 1) {
              return tSafe('ui.compare.not_applicable', '해당없음')
            }
            if (compareNum == 1) {
              if (isMobile) {
                return (value * (-1)).toFixed(0)
              }
              else {
                return (value * (-1)).toFixed(2)
              }
            }

            if (compareNum == 2) {
              if (isMobile) {
                return (value * (1)).toFixed(0)
              }
              else {
                return (value * (1)).toFixed(2)
              }
            }
          }
        },
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuint',
        x: {
          from: animationFrom,
        }
      },
      scales: {
        x: {
          display: false,
          type: 'linear',
          min: min,
          max: max,
        },
        y: {
          display: false
        },
      }
    }
  });
}

function drawCompareSubChart(score, subType, compareNum) {
  var chartName = "compare" + compareNum + "_complex_" + subType + "_chart"

  var min = 0
  var max = 100
  var anchor = 'end'
  var animationFrom = 0

  if (compareNum == 1) {
    score = score * (-1)
    anchor = 'start'
    min = -100
    max = 0
    animationFrom = $("#" + chartName).width()
  }

  var labelColor = ""
  var labelAlign = ""

  if (compareNum == 1) {
    if (score < -85) {
      labelColor = 'white'
      labelAlign = 'end'
    }
    else {
      labelColor = 'black'
      labelAlign = 'start'
    }
  }

  if (compareNum == 2) {
    if (score < 85) {
      labelColor = 'black'
      labelAlign = 'end'
    }
    else {
      labelColor = 'white'
      labelAlign = 'start'
    }
  }

  if (totalChart[chartName]) {
    totalChart[chartName].clear()
    totalChart[chartName].destroy()
  }

  var barThickness = 12
  if (isMobile) {
    barThickness = 9
  }

  var ctx = document.getElementById(chartName).getContext('2d');

  totalChart[chartName] = new Chart(ctx, {
    type: 'bar',
    plugins: [ChartDataLabels],
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
      plugins: {
        legend: {
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
          formatter: function (value) {
            if (subType == 'trans' && value == 0) {
              return tSafe('ui.compare.not_applicable', '해당없음')
            }
            if (compareNum == 1) {
              if (isMobile) {
                return (value * (-1)).toFixed(0)
              }
              else {
                return (value * (-1)).toFixed(2)
              }
            }

            if (compareNum == 2) {
              if (isMobile) {
                return (value * (1)).toFixed(0)
              }
              else {
                return (value * (1)).toFixed(2)
              }
            }
          }
        },
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuint',
        x: {
          from: animationFrom,
        }
      },
      scales: {
        x: {
          display: false,
          type: 'linear',
          min: min,
          max: max,
        },
        y: {
          display: false
        },
      }
    }
  });
}
