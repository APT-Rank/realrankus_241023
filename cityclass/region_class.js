var regions = [
  ['전국 시도', 'Korea_upper'], ['전국 시군구', 'Korea_lower'], ['서울시', 'Seoul'], ['경기도', 'Gyeonggi'], ['부산시', 'Busan'], ['대구시', 'Daegu'], ['인천시', 'Incheon'], ['대전시', 'Daejeon'], 
  ['울산시', 'Ulsan'], ['세종시', 'Sejong'], ['강원도', 'Gangwondo'], ['충청북도', 'Chungcheongbukdo'], ['충청남도', 'Chungcheongnamdo'],
  ['전북도', 'Jeollabukdo'], ['전남광주시', 'Jeonamgwangju'], ['경상북도', 'Gyeongsangbukdo'], ['경상남도', 'Gyeongsangnamdo'], ['제주도', 'Jejudo']
]

var searchingDB = []
var is_drilldown_from_korea = false;

function getUniqueList(jsonArrray, finding){  
  const unique = jsonArrray.map(function (val, index) {
    return val[finding];
  }).filter(function (val, index, arr) {
    return arr.indexOf(val) === index;
  });

  return unique
}

var sortJSON = function(data, key, type) {
  if (type == undefined) {
    type = "asc";
  }
  return data.sort(function(a, b) {
    var x = a[key];
    var y = b[key];
    if (type == "desc") {
      return x > y ? -1 : x < y ? 1 : 0;
    } else if (type == "asc") {
      return x < y ? -1 : x > y ? 1 : 0;
    }
  });
};

function reloadTable(){
  $("#table_area").load(location.href + ' #table_area')
}

function changeModalLabel(){
  msg = "<br>데이터 분석 중이예요.."
  $("#modalMsg").html(msg)
}

var menuSelection = "menu_select_price"

function change_menu(menu){
  menu_name = menu.id
  menuSelection = menu_name
  searchingDB = []
  
  if(isMobile){
    $('#data_table').html("<div id='loading_back'><br><br><br><br><br><br><br><br><div class='spinner-border' role='status'></div></div>")
    $('#data_table').css({'text-align' : 'center', 'width':'100%'})    
    $('#table_area_m').css({'height':screen.availHeight-148})
    $('#table_area_m').scrollTop(0)
    $('#table_area_m').scrollLeft(0)
    $('#data_table').css({'background':'none'}) 
  }
  else{
    $('#table_area').scrollTop(0)
    $('#table_area').scrollLeft(0)
    $('#exampleModal').modal('show')
  }

  current_zoom = defaultMap.getZoom()

  // 2026-10-23: 평단가 여부에 따라 우측 상단 마커 인덱스(#marker_index) 범례 동기화
  if(menu_name == "menu_select_price"){
    $("#marker_index_CL01, #marker_index_CL02, #marker_index_CL03").parent().show();
    $("#marker_index_CL04").text("1급 : 1~5%");
  } else {
    $("#marker_index_CL01, #marker_index_CL02, #marker_index_CL03").parent().hide();
    $("#marker_index_CL04").text("1급 : 0~5%");
  }

  if(menu_name == "menu_select_price"){        
    //drawTable(price_index, sido_list, gungu_list); 
    setTimeout(() => drawTable(price_index, sido_list, gungu_list), 300);
    removeMarkers()
    setTimeout(() => drawDataMap_price(region_class, current_zoom), 300);
  }
  if(menu_name == "menu_select_balanced"){
    //drawTable(balanced_index, sido_list, gungu_list)
    setTimeout(() => drawTable(balanced_index, sido_list, gungu_list), 300);
    removeMarkers()
    setTimeout(() => drawDataMap(region_class, current_zoom), 300);
  }
  if(menu_name == "menu_select_edu"){
    //drawTable(edu_index, sido_list, gungu_list)
    setTimeout(() => drawTable(edu_index, sido_list, gungu_list), 300);
    removeMarkers()
    setTimeout(() => drawDataMap(region_class, current_zoom), 300);
  }
  if(menu_name == "menu_select_living"){
    //drawTable(living_index, sido_list, gungu_list)
    setTimeout(() => drawTable(living_index, sido_list, gungu_list), 300);
    removeMarkers()
    setTimeout(() => drawDataMap(region_class, current_zoom), 300);
  }
  if(menu_name == "menu_select_infra"){
    //drawTable(infra_index, sido_list, gungu_list)
    setTimeout(() => drawTable(infra_index, sido_list, gungu_list), 300);
    removeMarkers()
    setTimeout(() => drawDataMap(region_class, current_zoom), 300);
  }
  if(menu_name == "menu_select_trans"){
    //drawTable(trans_index, sido_list, gungu_list)
    setTimeout(() => drawTable(trans_index, sido_list, gungu_list), 300);
    removeMarkers()
    setTimeout(() => drawDataMap(region_class, current_zoom), 300);
  }
}

async function drawTable(indexData, sido_list, gungu_list){
  //console.log(indexData)
  //console.log(sido_list)
  //console.log(gungu_list)

  if(isMobile){
    $('#data_table').html("<div id='loading_back'><br><br><br><br><br><br><br><br><div class='spinner-border' role='status'></div></div>")
    $('#data_table').css({'text-align' : 'center', 'width':'100%'})    
    $('#table_area_m').css({'height':screen.availHeight-148})
    $('#data_table').css({'background':'none'})
  }

  tableHtml = ""

  tableHtml += "<thead>"
  tableHtml += "<tr>"
  tableHtml += "<th class='constantFixed line1'></th>"
  if(menuSelection == "menu_select_trans"){

  }
  for(var i = 0 ; i < sido_list.length ; i++){
    if(menuSelection == "menu_select_trans"){
      if(sido_list[i] == "서울시" || sido_list[i] == "경기도" || sido_list[i] == "인천시" || sido_list[i] == "부산시" || sido_list[i] == "대구시" || sido_list[i] == "대전시" || sido_list[i] == "광주시" ){
        if(isMobile){
          for (var j = 0 ; j < gungu_list[i].length; j++){
            tableHtml += "<th class='fixedCol line1' scope='col'>" + sido_list[i] + "</th>"
          }
        }
        else{
          tableHtml += "<th class='fixedCol line1' colspan='" + gungu_list[i].length + "'>" + sido_list[i] + "</th>"    
        }
      }
    }
    else{
      if(isMobile){
        for (var j = 0 ; j < gungu_list[i].length; j++){
          tableHtml += "<th class='fixedCol line1' scope='col'>" + sido_list[i] + "</th>"
        }
      }
      else{
        tableHtml += "<th class='fixedCol line1' colspan='" + gungu_list[i].length + "'>" + sido_list[i] + "</th>"    
      }
    }
  }
  tableHtml += "</tr>"  

  tableHtml += "<tr>"
  tableHtml += "<th class='constantFixed line2'></th>"
  for(var i = 0 ; i < sido_list.length ; i++){
    if(menuSelection == "menu_select_trans"){
        if(sido_list[i] == "서울시" || sido_list[i] == "경기도" || sido_list[i] == "인천시" || sido_list[i] == "부산시" || sido_list[i] == "대구시" || sido_list[i] == "대전시" || sido_list[i] == "광주시" ){
          for (var j = 0 ; j < gungu_list[i].length; j++){
            var gunguName = gungu_list[i][j]          
            tableHtml += "<th class='fixedCol line2' scope='col'>" + gunguName + "</th>"
        }
      }
    }
    else{
      for (var j = 0 ; j < gungu_list[i].length; j++){
        var gunguName = gungu_list[i][j]
        if(isMobile){
          if(gungu_list[i][j] == "창원시 마산합포구"){
            gunguName = "창원 마산합포"
          }
          if(gungu_list[i][j] == "창원시 마산회원구"){
            gunguName = "창원 마산회원"
          }
          if(gungu_list[i][j] == "고양시 일산동구"){
            gunguName = "고양 일산동"
          }
          if(gungu_list[i][j] == "고양시 일산서구"){
            gunguName = "고양 일산서"
          }
        }
        tableHtml += "<th class='fixedCol line2' scope='col'>" + gunguName + "</th>"
      }
    }
  }  
  tableHtml += "</tr>"
  tableHtml += "</thead>"

  $("#data_table").html(tableHtml)

  $("#data_table").append("<tbody>")

  if(menuSelection == "menu_select_price"){  
    drawDataTable_price(indexData, sido_list, gungu_list, "CL01")
    drawDataTable_price(indexData, sido_list, gungu_list, "CL02")
    drawDataTable_price(indexData, sido_list, gungu_list, "CL03")
    drawDataTable_price(indexData, sido_list, gungu_list, "CL04")
    drawDataTable_price(indexData, sido_list, gungu_list, "CL05")
    drawDataTable_price(indexData, sido_list, gungu_list, "CL06")
    drawDataTable_price(indexData, sido_list, gungu_list, "CL07")
    drawDataTable_price(indexData, sido_list, gungu_list, "CL08")
    drawDataTable_price(indexData, sido_list, gungu_list, "CL09")
    drawDataTable_price(indexData, sido_list, gungu_list, "CL10")
    drawDataTable_price(indexData, sido_list, gungu_list, "CL11")
  }
  else{
    drawDataTable(indexData, sido_list, gungu_list, "CL01")
    drawDataTable(indexData, sido_list, gungu_list, "CL02")
    drawDataTable(indexData, sido_list, gungu_list, "CL03")
    drawDataTable(indexData, sido_list, gungu_list, "CL04")
    drawDataTable(indexData, sido_list, gungu_list, "CL05")
    drawDataTable(indexData, sido_list, gungu_list, "CL06")
    drawDataTable(indexData, sido_list, gungu_list, "CL07")
    drawDataTable(indexData, sido_list, gungu_list, "CL08")
    drawDataTable(indexData, sido_list, gungu_list, "CL09")
    drawDataTable(indexData, sido_list, gungu_list, "CL10")
    drawDataTable(indexData, sido_list, gungu_list, "CL11")    
  }

  $("#data_table").append("</tbody>")

  if(isMobile){
  }
  else{
    setTimeout(() => {
      var hideExampleModal = function() {
        $("#exampleModal").modal("hide");
        if (window.location.hash === '#exampleModal') {
          window.history.replaceState(null, null, ' ');
        }
      };
      
      hideExampleModal();
      
      // In case it was transitioning and ignored the hide command
      $("#exampleModal").on('shown.bs.modal', function() {
        hideExampleModal();
        $(this).off('shown.bs.modal');
      });
    }, 500);
  }
  $('#data_table').css({'background':'white'}) 
  
}

function getMatchedList(data, name){  
  find_list = []

  let dataArr = Object.values(data);

  for(var i = 0 ; i < dataArr.length ; i++){
    if(dataArr[i] == null){
      continue
    }
    else if(dataArr[i][0] == name){
      find_list.push(data[i])      
    }
  }

  return find_list
}

function drawDataTable_price(indexData, sido_list, gungu_list, cl){
  var indexList = []
  var min = 0
  var max = 0
  var classLabel = ""
  // 2026-10-23: 좌측 고정 열에 급지명 및 (상위 min~max%) 병기
  if(cl == "CL01"){ min = 0; max = 0.1; classLabel = "특1급지"; indexList = indexData.data[0] }
  if(cl == "CL02"){ min = 0.1; max = 0.5; classLabel = "특2급지"; indexList = indexData.data[1] }
  if(cl == "CL03"){ min = 0.5; max = 1.0; classLabel = "특3급지"; indexList = indexData.data[2] }
  if(cl == "CL04"){ min = 1.0; max = 5.0; classLabel = "1급지"; indexList = indexData.data[3] }
  if(cl == "CL05"){ min = 5.0; max = 10.0; classLabel = "2급지"; indexList = indexData.data[4] }
  if(cl == "CL06"){ min = 10.0; max = 20.0; classLabel = "3급지"; indexList = indexData.data[5] }
  if(cl == "CL07"){ min = 20.0; max = 30.0; classLabel = "4급지"; indexList = indexData.data[6] }
  if(cl == "CL08"){ min = 30.0; max = 40.0; classLabel = "5급지"; indexList = indexData.data[7] }
  if(cl == "CL09"){ min = 40.0; max = 50.0; classLabel = "6급지"; indexList = indexData.data[8] }
  if(cl == "CL10"){ min = 50.0; max = 70.0; classLabel = "7급지"; indexList = indexData.data[9] }
  if(cl == "CL11"){ min = 70.0; max = 100.0; classLabel = "8급지"; indexList = indexData.data[10] }

  tableHtml = ""

  var dataArr = Object.values(indexList)
  var dataArr_length = 0

  for(var checker = 0 ; checker < dataArr.length ; checker++){
    if(dataArr[checker] == null || dataArr[checker] == undefined || dataArr[checker] == 0){
      dataArr_length = checker
      break
    }
    else{
      dataArr_length = dataArr.length
    }
  }


  for(var lines = 0 ; lines < dataArr_length ; lines++){
    tableHtml += "<tr>"
    if(lines == 0){
      tableHtml += "<td class='fixedCol leftFixed lastCol' scope='row' rowspan=" + dataArr_length + ">" + classLabel + "<br>(상위 " + min + "~" + max + "%)</td>"
    }    
    for(var i = 0 ; i < sido_list.length ; i++){ 
        for (var j = 0 ; j < gungu_list[i].length; j++){
          finding_name = sido_list[i] + " " + gungu_list[i][j]
          findings = getMatchedList(indexList[lines], finding_name)

          if(lines == dataArr_length-1){
            tableHtml += "<td class='dataCol lastCol'>"
          }
          else{
            tableHtml += "<td class='dataCol'>"
          }

          for (var k = 0 ; k < findings.length ; k++){            
            id_name = "dong_" + findings[k][2]
            price_per = region_class[findings[k][2]]["평단가"]
            price_per_floor = ( Number(price_per.toFixed(0)) ).toLocaleString() + "만원"
            // 2026-10-23: matched_dong에 해당 급지(CL01~CL11) 배경색 클래스 적용
            tableHtml += "<div class='matched_dong " + cl + "' id='" + id_name  + "' onClick='showRegionInfo(" + findings[k][2] + ")'><div>" + findings[k][1] + "</div><div class='price_per'>" + price_per_floor + "</div></div>"            
            searchingDB.push([findings[k][0] + " " + findings[k][1], findings[k][2]])
          }
          tableHtml += "</td>"
      }  
    }
    tableHtml += "</tr>"    
  }

  $("#data_table").append(tableHtml)
  searchingDB.sort()
  var table_height = $("#data_table").height() - 121
  
  if(isMobile){
    $("#data_table").css({'height':table_height})    
    $("#table_area_m").css({'height': (screen.availHeight-188)})
    $(".fixedCol").css({'width': "90px", "min-width":"90px", "max-width":"90px"})
    $(".constantFixed.line1").css({'width': "70px", "min-width":"70px", "max-width":"70px"})
    $(".constantFixed.line2").css({'width': "70px", "min-width":"70px", "max-width":"70px", 'top': "20px"})
    $(".fixedCol.leftFixed").css({'width': "70px", "min-width":"70px", "max-width":"70px"})
    $(".matched_dong").css({'font-size': "0.8em", "padding-top":"3px", "padding-bottom":"3px"})
    $("th.fixedCol.line2").css({'font-size': "0.8em", 'top': "20px"})
    $("th.fixedCol.line1").css({'font-size': "0.8em", 'top': "20px"})       
  }
}

// 2026-10-23: 메뉴별 백분위에 따른 급지 색상 클래스(CL01~CL11) 반환 헬퍼
function getDongClassCode(index, fallbackCl){
  if(!region_class || !region_class[index]) return fallbackCl || "CL01";
  var pct = 0;
  if(menuSelection == "menu_select_price") pct = region_class[index]["평단가_백분률"];
  else if(menuSelection == "menu_select_balanced") pct = region_class[index]["가치_백분률"];
  else if(menuSelection == "menu_select_edu") pct = region_class[index]["교육_백분률"];
  else if(menuSelection == "menu_select_living") pct = region_class[index]["주거_백분률"];
  else if(menuSelection == "menu_select_infra") pct = region_class[index]["인프라_백분률"];
  else if(menuSelection == "menu_select_trans") pct = region_class[index]["교통_백분률"];

  if(pct >= 0 && pct < 0.1) return "CL01";
  if(pct >= 0.1 && pct < 0.5) return "CL02";
  if(pct >= 0.5 && pct < 1.0) return "CL03";
  if(pct >= 1.0 && pct < 5.0) return "CL04";
  if(pct >= 5.0 && pct < 10.0) return "CL05";
  if(pct >= 10.0 && pct < 20.0) return "CL06";
  if(pct >= 20.0 && pct < 30.0) return "CL07";
  if(pct >= 30.0 && pct < 40.0) return "CL08";
  if(pct >= 40.0 && pct < 50.0) return "CL09";
  if(pct >= 50.0 && pct < 70.0) return "CL10";
  if(pct >= 70.0) return "CL11";
  return fallbackCl || "CL01";
}

function drawDataTable(indexData, sido_list, gungu_list, cl){  
  var indexList = []
  var min = 0
  var max = 0
  var classLabel = ""
  var colorClass = cl
  // 2026-10-23: 평단가가 아닌 경우 0~5% 1급지, 5~10% 2급지, ~20% 3급지, ~30% 4급지, ~40% 5급지, ~50% 6급지, ~70% 7급지, ~100% 8급지 적용
  if(cl == "CL01"){ min = 0; max = 5.0; classLabel = "1급지"; colorClass = "CL04"; indexList = indexData.data[0] }
  if(cl == "CL02"){ min = 5.0; max = 10.0; classLabel = "2급지"; colorClass = "CL05"; indexList = indexData.data[1] }
  if(cl == "CL03"){ min = 10.0; max = 15.0; classLabel = "3급지"; colorClass = "CL06"; indexList = indexData.data[2] }
  if(cl == "CL04"){ min = 15.0; max = 20.0; classLabel = "3급지"; colorClass = "CL06"; indexList = indexData.data[3] }
  if(cl == "CL05"){ min = 20.0; max = 30.0; classLabel = "4급지"; colorClass = "CL07"; indexList = indexData.data[4] }
  if(cl == "CL06"){ min = 30.0; max = 40.0; classLabel = "5급지"; colorClass = "CL08"; indexList = indexData.data[5] }
  if(cl == "CL07"){ min = 40.0; max = 50.0; classLabel = "6급지"; colorClass = "CL09"; indexList = indexData.data[6] }
  if(cl == "CL08"){ min = 50.0; max = 60.0; classLabel = "7급지"; colorClass = "CL10"; indexList = indexData.data[7] }
  if(cl == "CL09"){ min = 60.0; max = 70.0; classLabel = "7급지"; colorClass = "CL10"; indexList = indexData.data[8] }
  if(cl == "CL10"){ min = 70.0; max = 80.0; classLabel = "8급지"; colorClass = "CL11"; indexList = indexData.data[9] }
  if(cl == "CL11"){ min = 80.0; max = 100.0; classLabel = "8급지"; colorClass = "CL11"; indexList = indexData.data[10] }

  tableHtml = ""

  var dataArr = Object.values(indexList)
  var dataArr_length = 0

  for(var checker = 0 ; checker < dataArr.length ; checker++){
    if(dataArr[checker].length == undefined){
      dataArr_length = checker
      break
    }
    else{
      dataArr_length = dataArr.length
    }
  }

  for(var lines = 0 ; lines < dataArr_length ; lines++){
    tableHtml += "<tr>"
    if(lines == 0){
      tableHtml += "<td class='fixedCol leftFixed lastCol' scope='row' rowspan=" + dataArr_length + ">" + classLabel + "<br>(상위 " + min + "~" + max + "%)</td>"
    }    
    for(var i = 0 ; i < sido_list.length ; i++){
      if(menuSelection == "menu_select_trans"){
        if(sido_list[i] == "서울시" || sido_list[i] == "경기도" || sido_list[i] == "인천시" || sido_list[i] == "부산시" || sido_list[i] == "대구시" || sido_list[i] == "대전시" || sido_list[i] == "광주시" ){
          for (var j = 0 ; j < gungu_list[i].length; j++){
            finding_name = sido_list[i] + " " + gungu_list[i][j]
            findings = getMatchedList(indexList[lines], finding_name)

            if(lines == dataArr_length-1){
              tableHtml += "<td class='dataCol lastCol'>"
            }
            else{
              tableHtml += "<td class='dataCol'>"
            }

            for (var k = 0 ; k < findings.length ; k++){
              id_name = "dong_" + findings[k][2]
              tableHtml += "<div class='matched_dong " + colorClass + "' id='" + id_name  + "' onClick='showRegionInfo(" + findings[k][2] + ")'>" + findings[k][1] + "</div>"              
              searchingDB.push([findings[k][0] + " " + findings[k][1], findings[k][2]])
            }
            tableHtml += "</td>"
          }
        }
      }
      else{
        for (var j = 0 ; j < gungu_list[i].length; j++){
          finding_name = sido_list[i] + " " + gungu_list[i][j]
          findings = getMatchedList(indexList[lines], finding_name)

          if(lines == dataArr_length-1){
            tableHtml += "<td class='dataCol lastCol'>"
          }
          else{
            tableHtml += "<td class='dataCol'>"
          }

          for (var k = 0 ; k < findings.length ; k++){
            id_name = "dong_" + findings[k][2]
            tableHtml += "<div class='matched_dong " + colorClass + "' id='" + id_name  + "' onClick='showRegionInfo(" + findings[k][2] + ")'>" + findings[k][1] + "</div>"              
            searchingDB.push([findings[k][0] + " " + findings[k][1], findings[k][2]])
          }
          tableHtml += "</td>"
        }
      } 
    }
    tableHtml += "</tr>"    
  }  
  

  $("#data_table").append(tableHtml)
  searchingDB.sort()
  var table_height = $("#data_table").height() - 121
  
  if(isMobile){
    $("#data_table").css({'height':table_height})    
    $("#table_area_m").css({'height': (screen.availHeight-188)})
    $(".fixedCol").css({'width': "90px", "min-width":"90px", "max-width":"90px"})
    $(".constantFixed.line1").css({'width': "70px", "min-width":"70px", "max-width":"70px"})
    $(".constantFixed.line2").css({'width': "70px", "min-width":"70px", "max-width":"70px", 'top': "20px"})
    $(".fixedCol.leftFixed").css({'width': "70px", "min-width":"70px", "max-width":"70px"})
    $(".matched_dong").css({'font-size': "0.8em", "padding-top":"3px", "padding-bottom":"3px"})
    $("th.fixedCol.line2").css({'font-size': "0.8em", 'top': "20px"})
    $("th.fixedCol.line1").css({'font-size': "0.8em", 'top': "20px"})       
  }
}

var shareTitle = ""
var shareText = ""
var shareURL = "https://www.realrankus.com/cityclass"
var popMsg = ""

function showRegionInfo(index, themeOverride){
  // 2026-10-23: 호이스팅으로 인해 activeMenu가 undefined가 되어 지도 마커/테이블 클릭 시 모달이 열리지 않던 버그 수정
  var activeMenu = themeOverride || menuSelection || "menu_select_price";
  var sido = region_class[index]["시도"]
  var gungu = region_class[index]["군구"]
  var dong = region_class[index]["읍면동"] 
  var sidoLink = region_class[index]["sido_link"]
  var gunguLink = region_class[index]["gungu_link"]

  if (sidoLink && gunguLink) {
    selectedRegion = sidoLink;
    selectedSubRegion = gunguLink;
    if (typeof saveLocalStorage === 'function') {
      saveLocalStorage();
    }
  }
  
  if(activeMenu == "menu_select_price"){
    var percentile = region_class[index]["평단가_백분률"]
  }
  if(activeMenu == "menu_select_balanced"){
    var percentile = region_class[index]["가치_백분률"]
    var score = region_class[index]["가치총점"]
    var selection = "균형"
  }  
  if(activeMenu == "menu_select_edu"){
    var percentile = region_class[index]["교육_백분률"]
    var score = region_class[index]["교육총점"]
    var selection = "교육"
  }
  if(activeMenu == "menu_select_living"){
    var percentile = region_class[index]["주거_백분률"]
    var score = region_class[index]["주거총점"]
    var selection = "주거"
  }
  if(activeMenu == "menu_select_infra"){
    var percentile = region_class[index]["인프라_백분률"]
    var score = region_class[index]["인프라총점"]
    var selection = "인프라"
  }
  if(activeMenu == "menu_select_trans"){
    var percentile = region_class[index]["교통_백분률"]
    var score = region_class[index]["교통총점"]
    var selection = "교통"
  }

  var complex_num = region_class[index]["단지수"]
  var house_num = region_class[index]["세대수"]
  var pyeong_price = region_class[index]["평단가"]
  var total_amount = region_class[index]["총액"]
  cleared_total_amount = Math.round(total_amount) * 100000000

  title = "<span style='font-weight: 600'>" + sido + " " + gungu + " " + dong + "</span>"

  popMsg = "'" + sido + " " + gungu + " " + dong+ "'" + " 정보가 복사되었습니다."

  // 2026-10-23: 백분위에 따른 급지명 및 급지별 폰트 컬러 매핑 (평단가 vs 그 외 탭 구분)
  var className = ""
  var classColor = "#162235"
  if(activeMenu == "menu_select_price"){
    if(percentile >= 0 && percentile < 0.1){ className = "특1급지"; classColor = "#800000"; }
    else if(percentile >= 0.1 && percentile < 0.5){ className = "특2급지"; classColor = "#991111"; }
    else if(percentile >= 0.5 && percentile < 1.0){ className = "특3급지"; classColor = "#B22222"; }
    else if(percentile >= 1.0 && percentile < 5.0){ className = "1급지"; classColor = "#CC3333"; }
    else if(percentile >= 5.0 && percentile < 10.0){ className = "2급지"; classColor = "#1D2F4A"; }
    else if(percentile >= 10.0 && percentile < 20.0){ className = "3급지"; classColor = "#2B4976"; }
    else if(percentile >= 20.0 && percentile < 30.0){ className = "4급지"; classColor = "#2B4976"; }
    else if(percentile >= 30.0 && percentile < 40.0){ className = "5급지"; classColor = "#3A63A3"; }
    else if(percentile >= 40.0 && percentile < 50.0){ className = "6급지"; classColor = "#4170B9"; }
    else if(percentile >= 50.0 && percentile < 70.0){ className = "7급지"; classColor = "#555555"; }
    else if(percentile >= 70.0){ className = "8급지"; classColor = "#777777"; }
  }
  else{
    if(percentile >= 0 && percentile < 5.0){ className = "1급지"; classColor = "#CC3333"; }
    else if(percentile >= 5.0 && percentile < 10.0){ className = "2급지"; classColor = "#1D2F4A"; }
    else if(percentile >= 10.0 && percentile < 20.0){ className = "3급지"; classColor = "#2B4976"; }
    else if(percentile >= 20.0 && percentile < 30.0){ className = "4급지"; classColor = "#2B4976"; }
    else if(percentile >= 30.0 && percentile < 40.0){ className = "5급지"; classColor = "#3A63A3"; }
    else if(percentile >= 40.0 && percentile < 50.0){ className = "6급지"; classColor = "#4170B9"; }
    else if(percentile >= 50.0 && percentile < 70.0){ className = "7급지"; classColor = "#555555"; }
    else if(percentile >= 70.0){ className = "8급지"; classColor = "#777777"; }
  }

  var classHtml = "<span style='color: " + classColor + "; font-weight: 700;'>" + className + " (상위 " + setPercentage(percentile) + ")</span>"

  bodyHtml = ""
  if(isMobile){
    bodyHtml += "<div class='regionTable_m'>"
  }
  else{
    bodyHtml += "<div class='regionTable'>"
  }

  if(activeMenu == "menu_select_price"){
    bodyHtml += "<div class='regionTable_title'>급지</div>" + "<div class='regionTable_content'>" + classHtml + "</div>"
    bodyHtml += "<div class='regionTable_title'>평균 평단가</div>" + "<div class='regionTable_content'>평당 " + ( Number(pyeong_price.toFixed(0)) ).toLocaleString() + "만원</div>"
    bodyHtml += "<div class='regionTable_title'>단지 수</div>" + "<div class='regionTable_content'>총 " + complex_num.toLocaleString() + "개 단지</div>"
    bodyHtml += "<div class='regionTable_title'>총 세대수</div>" + "<div class='regionTable_content'>총 " + house_num.toLocaleString() + "세대</div>"    
    bodyHtml += "<div class='regionTable_title'>시가 총액</div>" + "<div class='regionTable_content'>약 " + setPrice(cleared_total_amount) + "</div>"
  }
  else{
    bodyHtml += "<div class='regionTable_title'>급지</div>" + "<div class='regionTable_content'>" + classHtml + "</div>"
    if(isMobile){
      bodyHtml += "<div class='regionTable_title'>R랭커스</div>" + "<div class='regionTable_content'>" + selection + " " + score.toFixed(2) + "점</div>"
    }
    else{
      bodyHtml += "<div class='regionTable_title'>리얼랭커스 점수</div>" + "<div class='regionTable_content'>" + selection + " " + score.toFixed(2) + "점</div>"
    }
    bodyHtml += "<div class='regionTable_title'>단지 수</div>" + "<div class='regionTable_content'>총 " + complex_num.toLocaleString() + "개 단지</div>"
    bodyHtml += "<div class='regionTable_title'>총 세대수</div>" + "<div class='regionTable_content'>총 " + house_num.toLocaleString() + "세대</div>"    
    bodyHtml += "<div class='regionTable_title'>평균 평단가</div>" + "<div class='regionTable_content'>평당 " + ( Number(pyeong_price.toFixed(0)) ).toLocaleString() + "만원</div>"
    bodyHtml += "<div class='regionTable_title'>시가 총액</div>" + "<div class='regionTable_content'>약 " + setPrice(cleared_total_amount) + "</div>"
  }
  bodyHtml += "</div>"

  if(activeMenu == "menu_select_price"){
    shareTitle = "CityClass 평단가 급지 분석"    
  }
  else{
    shareTitle = "CityClass " + selection + " 급지 분석"
  }
  shareText = shareTitle

  shareText += "\n" + "『" + sido + " " + gungu + " " + dong + "』\n\n"

  shareText += "ㆍ급지 : " + className + " (상위 " + setPercentage(percentile) + ")\n"

  if(activeMenu != "menu_select_price"){  
    shareText += "ㆍ리얼랭커스 " +  selection + " 점수 : " + score.toFixed(2) + "점\n"
  }
  shareText += "ㆍ평균 평단가 : 평당 " + ( Number(pyeong_price.toFixed(0)) ).toLocaleString() + "만원\n"
  shareText += "ㆍ단지 수 : 총 " + complex_num.toLocaleString() + "개 단지\n"
  shareText += "ㆍ총 세대수 : 총 " + house_num.toLocaleString() + "세대\n"
  shareText += "ㆍ시가 총액 : 약 " + setPrice(cleared_total_amount) + "\n\n"
  shareText += "https://www.realrankus.com/cityclass\npowered by 리얼랭커스"  
  
  // 2026-10-22: regionShare 제일 우측에 모달 캡쳐 버튼(#share3) 영역 추가
  if(isMobile){
    bodyHtml += "<div class='regionShare_m' data-html2canvas-ignore='true'>"
  }
  else{
    bodyHtml += "<div class='regionShare' data-html2canvas-ignore='true'>"
  }
  bodyHtml += "<div></div><div id='share1'></div><div id='share2'></div><div id='share3'></div>"
  bodyHtml += "</div>"

  var sidoLink = region_class[index]["sido_link"]
  var gunguLink = region_class[index]["gungu_link"]

  var RealRankusLink = (typeof getMainAptrankURL === 'function') 
    ? getMainAptrankURL(sidoLink, gunguLink) 
    : ("https://www.realrankus.com/index.html?reg=" + encodeURIComponent(sidoLink) + "&sub=" + encodeURIComponent(gunguLink));

  var resolvedBiz = (typeof resolveMainRegion === 'function') 
    ? resolveMainRegion(sidoLink, gunguLink) 
    : { reg: sidoLink, sub: gunguLink };
  var bizBasePath = isMobile ? "https://www.realrankus.com/biz/index_m.html" : "https://www.realrankus.com/biz/index.html";
  var RealRankusBizLink = bizBasePath + "?reg=" + encodeURIComponent(resolvedBiz.reg) + "&sub=" + encodeURIComponent(resolvedBiz.sub);

  footerHtml = ""
  footerHtml += "<div class='footer_wrapper'>"
  footerHtml += "<div class='goRankus' onClick='goToAptrankFromCityclass(\"" +  RealRankusLink + "\", \"" + sidoLink + "\", \"" + gunguLink + "\")'>" + gungu + " 아파트 분석 보기</div>"
  footerHtml += "<div class='goRankusBiz' onClick='goToBizFromCityclass(\"" +  RealRankusBizLink + "\", \"" + sidoLink + "\", \"" + gunguLink + "\")'>" + gungu + " 시장 분석 보기</div>"
  footerHtml += "</div>"

  $("#regionTitle").html(title)
  $("#regionDetail").html(bodyHtml)
  $("#Infofooter").html(footerHtml)

  if(checkMobile() == "ios"){
    share1Html = "<div class='tShare' onClick='CopyToClipboard(shareText, popMsg)'><i class='fa-regular fa-copy'></i></div>"
  }
  else{
    share1Html = "<div class='tShare' onClick='kakaoShare(shareTitle, shareText, shareURL)'><img src=\"./kakao_icon.png\" height=\"35px\"/></div>"
  }    
  $('#share1').html(share1Html)

  if(UserAgent.indexOf("inApp")>-1){
    share2Html = "<div class='tShare' onClick='CopyToClipboard(shareText, popMsg)'><i class='fa-regular fa-copy'></i></div>"
  }
  else{
    //share2Html = "<div class='tShare' onClick='CopyToClipboard(shareText, popMsg)'><i class='fa-solid fa-copy'></i></div>"
    share2Html = "<div class='tShare' onClick='share(shareTitle, shareText, shareURL)'><i class='fa-solid fa-arrow-up-right-from-square'></i></div>"
  }

  $('#share2').html(share2Html)

  // 2026-10-22: regionShare 제일 우측(#share3)에 모달 고해상도 이미지 캡쳐 버튼 추가
  var share3Html = "<div class='tShare' title='모달 이미지 저장' onClick='downloadRegionModalImage(this, " + index + ", event)'><i class='fa-solid fa-camera'></i></div>"
  $('#share3').html(share3Html)

  if(isMobile){
    $(".footer_wrapper").css({'padding-left': "20px", 'padding-right': "20px"}) 
    $("#infoModal_m").modal('show')
  }
  else{
    $("#infoModal").modal('show')
  }  
}

// 2026-10-22: #infoModal / #infoModal_m 고해상도 이미지 캡쳐 및 다운로드 함수
async function downloadRegionModalImage(btnEl, index, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  if (typeof html2canvas === 'undefined') {
    alert('이미지 저장 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    return;
  }

  var modalSelector = isMobile ? '#infoModal_m .modal-content' : '#infoModal .modal-content';
  var modalContentEl = document.querySelector(modalSelector);
  if (!modalContentEl) return;

  var originalBtnHtml = btnEl.innerHTML;
  btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  btnEl.style.pointerEvents = 'none';

  try {
    var now = new Date();
    var pad = function(n) { return String(n).padStart(2, '0'); };
    var timeStampText = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' +
                        pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    var fileTimeStamp = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '_' +
                        pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());

    var item = (region_class && region_class[index]) ? region_class[index] : {};
    var safeName = function(str) { return (str || '').replace(/[\\/:*?"<>|\s]+/g, '_'); };
    var sidoName = safeName(item["시도"]);
    var gunguName = safeName(item["군구"]);
    var dongName = safeName(item["읍면동"]);
    var fileName = '리얼랭커스_CityClass_' + sidoName + '_' + gunguName + '_' + dongName + '_' + fileTimeStamp + '.png';

    var canvas = await html2canvas(modalContentEl, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: function(el) {
        if (!el) return false;
        if (el.id === 'map_area' || el.id === 'table_area' || el.id === 'table_area_m' ||
            el.id === 'costModal' || el.id === 'summaryModal' || el.id === 'exampleModal' || el.id === 'noticeModal' ||
            el.id === 'info_area' || el.id === 'title_bar') {
          return true;
        }
        if (el.classList && (el.classList.contains('modal-backdrop') || el.classList.contains('btn-close'))) {
          return true;
        }
        return false;
      },
      onclone: function(clonedDoc, clonedEl) {
        clonedEl.style.borderRadius = '12px';
        clonedEl.style.overflow = 'hidden';
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.border = '1px solid #e2e8f0';
        clonedEl.style.backgroundColor = '#ffffff';

        // 닫기 버튼, 공유 버튼 영역, 하단 이동 버튼 영역 숨김
        var hideSelectors = ['.btn-close', '.regionShare', '.regionShare_m', '#Infofooter'];
        hideSelectors.forEach(function(sel) {
          var els = clonedEl.querySelectorAll(sel);
          els.forEach(function(node) { node.style.display = 'none'; });
        });

        // 하단 워터마크 바 추가
        var watermark = clonedDoc.createElement('div');
        watermark.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px 18px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b; font-weight:600;';
        watermark.innerHTML = '<span>Captured at ' + timeStampText + '</span><span>리얼랭커스 | realrankus.com</span>';
        clonedEl.appendChild(watermark);
      }
    });

    var dataUrl = canvas.toDataURL('image/png');

    if (window.Android && typeof window.Android.downloadImage === 'function') {
      var base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      window.Android.downloadImage(base64Data, fileName);
    } else {
      var link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error('Modal capture failed:', err);
    alert('이미지 저장 중 오류가 발생했습니다.');
  } finally {
    btnEl.innerHTML = originalBtnHtml;
    btnEl.style.pointerEvents = '';
  }
}

function goToAptrankFromCityclass(url, reg, sub) {
  if (reg && sub) {
    selectedRegion = reg;
    selectedSubRegion = sub;
    if (typeof saveLocalStorage === 'function') {
      saveLocalStorage();
    }
  }
  if (typeof openExternalLinkWithLoading === 'function') {
    openExternalLinkWithLoading(url, 'aptrank');
  } else {
    location.href = url;
  }
}

function goToBizFromCityclass(url, reg, sub) {
  if (reg && sub) {
    selectedRegion = reg;
    selectedSubRegion = sub;
    if (typeof saveLocalStorage === 'function') {
      saveLocalStorage();
    }
  }
  if (typeof openExternalLinkWithLoading === 'function') {
    openExternalLinkWithLoading(url, 'aptrank_biz');
  } else {
    location.href = url;
  }
}

function setPercentage(percent){
  return_val = ""
  if(percent < 0.0001){
    // 2026-10-23: 모달 내 텍스트 넘침 방지를 위해 '0.0001% 보다 작음' -> '0.0001% 미만'으로 축약
    return_val = "0.0001% 미만"
  }
  else if(percent >= 0.0001 && percent < 0.1){
    return_val = percent.toFixed(4) + "%"
  }
  else if(percent >= 0.1 && percent <= 1){
    return_val = percent.toFixed(3) + "%"
  }
  else{
    return_val = percent.toFixed(2) + "%"
  }

  return return_val
}

function setPrice(number){
  var inputNumber  = number < 0 ? false : number;
  var unitWords    = ['', '만 ', '억 ', '조 ', '경 '];
  var splitUnit    = 10000;
  var splitCount   = unitWords.length;
  var resultArray  = [];
  var resultString = '';

  for (var i = 0; i < splitCount; i++){
       var unitResult = (inputNumber % Math.pow(splitUnit, i + 1)) / Math.pow(splitUnit, i);
      unitResult = Math.floor(unitResult);
      if (unitResult > 0){
          resultArray[i] = unitResult;
      }
  }

  for (var i = 0; i < resultArray.length; i++){
      if(!resultArray[i]) continue;
      resultString = String(resultArray[i]) + unitWords[i] + resultString;
  }

  return resultString;
}

function region_search(){
  $('#searchingBox').html("");

  var display_limit = 0
  if(isMobile){
    display_limit = 5
  }
  else{
    display_limit = 10
  }

  unifiedInput = $('#inputSearch').val()
  if(unifiedInput.length < 1){
    $('#searchingBox').hide()
  }
  if(unifiedInput.length >= 1){
    var searching_count = 0
    for(var i = 0 ; i < searchingDB.length ; i++){
      var regionName = searchingDB[i][0]
      var regionIndex = searchingDB[i][1]
      
      if(regionName.indexOf(unifiedInput) >= 0){
        searching_count += 1

        var addon_html = "<div class='searchedListBox' onClick='goPosition(" + regionIndex + ")'>";
        addon_html += "<div class='searched_reg_name'>" + regionName + "</div>"        
        addon_html += "</div>"

        $('#searchingBox').append(addon_html);
        if(searching_count >= display_limit){
          $('#searchingBox').css({'height' : '25em', 'overflow-y' : 'auto'})
        }
        else{
          if(searching_count == 0){
            $('#searchingBox').hide()
          }
          else{
            $('#searchingBox').show()
            $('#searchingBox').css({'height' : 'auto', 'overflow-y' : 'none'})
          }          
        }
      }
    }

    $(".searched_reg_name:contains('" + unifiedInput + "')").each(function(){
      var regex = new RegExp(unifiedInput, 'gi')
      $(this).html( $(this).text().replace(regex, "<span class='colorTxt'>"+unifiedInput+"</span>") );
    })

    $(".searched_reg_name").css({'font-size':'0.9em', 'height':'3em', 'line-height':'3em'})

  }
}
function goPosition(index){
  var sidoLink = region_class[index]["sido_link"];
  var gunguLink = region_class[index]["gungu_link"];
  if (sidoLink && gunguLink) {
    selectedRegion = sidoLink;
    selectedSubRegion = gunguLink;
    if (typeof saveLocalStorage === 'function') {
      saveLocalStorage();
    }
  }
  if(view_mode == "table"){
    goScroll(index)
  }
  else{
    goMapPosition(index)
  }  
}
function goMapPosition(index){
  posY = region_class[index]["lat"]
  posX = region_class[index]["lng"]

  var newPosition = new naver.maps.LatLng(posY, posX);
  defaultMap.setCenter(newPosition)
  if(isMobile){    
    defaultMap.panBy(new naver.maps.Point(20, 180))  
  }

  $('#searchingBox').html("");
  $('#searchingBox').hide()
  $('#inputSearch').val("")
}

function goScroll(index){
  if(isMobile){
    scroll_back = "#table_area_m"
    table_offset_x = 75
    table_offset_y = 185
  }
  else{
    scroll_back = "#table_area"
    table_offset_x = 220
    table_offset_y = 155
  }  

  $('#searchingBox').html("");
  $('#searchingBox').hide()
  $('#inputSearch').val("")

  find_id = "#dong_" + index

  //console.log( $(find_id).text() )
  //console.log( "Y:" , $(find_id).offset().top )
  //console.log( "X:" , $(find_id).offset().left )

  currentX = $(scroll_back).scrollLeft()
  currentY = $(scroll_back).scrollTop()

  offsetX = $(find_id).offset().left - table_offset_x
  offsetY = $(find_id).offset().top - table_offset_y

  destX = Math.abs(currentX + offsetX)
  destY = Math.abs(currentY + offsetY)

  $(scroll_back).animate( { scrollTop : destY, scrollLeft : destX }, 2000, 'easeOutQuart');    
}

var Korea_sido = []
var Korea_gungu = []
var cost_Seoul = []
var cost_Gyeonggi = []
var cost_Busan = []  
var cost_Daegu = []
var cost_Incheon = []
var cost_Gwangju = []
var cost_Daejeon = []
var cost_Ulsan = []
var cost_Sejong = []
var cost_Gangwondo = []
var cost_Chungcheongbukdo = []
var cost_Chungcheongnamdo = []
var cost_Jeollabukdo = []
var cost_Jeollanamdo = []
var cost_Gyeongsangbukdo = []
var cost_Gyeongsangnamdo = []
var cost_Jejudo = []

var cost_region_arr = [
  Korea_sido, Korea_gungu, cost_Seoul, cost_Gyeonggi, cost_Busan, cost_Daegu, cost_Incheon, cost_Gwangju, cost_Daejeon,
  cost_Ulsan, cost_Sejong, cost_Gangwondo, cost_Chungcheongbukdo, cost_Chungcheongnamdo, cost_Jeollabukdo, cost_Jeollanamdo,
  cost_Gyeongsangbukdo, cost_Gyeongsangnamdo, cost_Jejudo
]
var cost_sum_arr = []

function setTreeMap(){
  treemap_data = cost_treemap.data

  var Korea_sido_sum = 0
  var Korea_gungu_sum = 0
  var cost_Seoul_sum = 0
  var cost_Gyeonggi_sum = 0
  var cost_Busan_sum = 0
  var cost_Daegu_sum = 0
  var cost_Incheon_sum = 0
  var cost_Gwangju_sum = 0
  var cost_Daejeon_sum = 0
  var cost_Ulsan_sum = 0
  var cost_Sejong_sum = 0
  var cost_Gangwondo_sum = 0
  var cost_Chungcheongbukdo_sum = 0
  var cost_Chungcheongnamdo_sum = 0
  var cost_Jeollabukdo_sum = 0
  var cost_Jeollanamdo_sum = 0
  var cost_Gyeongsangbukdo_sum = 0
  var cost_Gyeongsangnamdo_sum = 0
  var cost_Jejudo_sum = 0

  var Korea_sido_temp = []
  var Korea_gungu_temp = []
  var cost_Seoul_temp = []
  var cost_Gyeonggi_temp = []
  var cost_Busan_temp = []  
  var cost_Daegu_temp = []
  var cost_Incheon_temp = []
  var cost_Gwangju_temp = []
  var cost_Daejeon_temp = []
  var cost_Ulsan_temp = []
  var cost_Sejong_temp = []
  var cost_Gangwondo_temp = []
  var cost_Chungcheongbukdo_temp = []
  var cost_Chungcheongnamdo_temp = []
  var cost_Jeollabukdo_temp = []
  var cost_Jeollanamdo_temp = []
  var cost_Gyeongsangbukdo_temp = []
  var cost_Gyeongsangnamdo_temp = []
  var cost_Jejudo_temp = []

  for(var i=0 ; i < treemap_data.length; i++){
    if(treemap_data[i]['Level'] == "Level1"){
      Korea_sido_temp.push(treemap_data[i])
      Korea_sido_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Level'] == "Level2"){
      Korea_gungu_temp.push(treemap_data[i])
      Korea_gungu_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Seoul"){
      cost_Seoul_temp.push(treemap_data[i])
      cost_Seoul_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Gyeonggi"){
      cost_Gyeonggi_temp.push(treemap_data[i])
      cost_Gyeonggi_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Busan"){
      cost_Busan_temp.push(treemap_data[i])
      cost_Busan_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Daegu"){
      cost_Daegu_temp.push(treemap_data[i])
      cost_Daegu_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Incheon"){
      cost_Incheon_temp.push(treemap_data[i])
      cost_Incheon_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Gwangju"){
      cost_Gwangju_temp.push(treemap_data[i])
      cost_Gwangju_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Daejeon"){
      cost_Daejeon_temp.push(treemap_data[i])
      cost_Daejeon_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Ulsan"){
      cost_Ulsan_temp.push(treemap_data[i])
      cost_Ulsan_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Sejong"){
      cost_Sejong_temp.push(treemap_data[i])
      cost_Sejong_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Gangwondo"){
      cost_Gangwondo_temp.push(treemap_data[i])
      cost_Gangwondo_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Chungcheongbukdo"){
      cost_Chungcheongbukdo_temp.push(treemap_data[i])
      cost_Chungcheongbukdo_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Chungcheongnamdo"){
      cost_Chungcheongnamdo_temp.push(treemap_data[i])
      cost_Chungcheongnamdo_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Jeollabukdo"){
      cost_Jeollabukdo_temp.push(treemap_data[i])
      cost_Jeollabukdo_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Jeonamgwangju"){
      cost_Jeollanamdo_temp.push(treemap_data[i])
      cost_Jeollanamdo_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Gyeongsangbukdo"){
      cost_Gyeongsangbukdo_temp.push(treemap_data[i])
      cost_Gyeongsangbukdo_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Gyeongsangnamdo"){
      cost_Gyeongsangnamdo_temp.push(treemap_data[i])
      cost_Gyeongsangnamdo_sum += treemap_data[i]['Sum']
    }
    if(treemap_data[i]['Upper_region'] == "Jejudo"){
      cost_Jejudo_temp.push(treemap_data[i])
      cost_Jejudo_sum += treemap_data[i]['Sum']
    }    
  }

  var cost_region_arr_temp = [
    Korea_sido_temp, Korea_gungu_temp, cost_Seoul_temp, cost_Gyeonggi_temp, cost_Busan_temp, cost_Daegu_temp, cost_Incheon_temp, cost_Gwangju_temp,
    cost_Daejeon_temp, cost_Ulsan_temp, cost_Sejong_temp, cost_Gangwondo_temp, cost_Chungcheongbukdo_temp, cost_Chungcheongnamdo_temp,
    cost_Jeollabukdo_temp, cost_Jeollanamdo_temp, cost_Gyeongsangbukdo_temp, cost_Gyeongsangnamdo_temp, cost_Jejudo_temp
  ]

  cost_sum_arr = [
    Korea_sido_sum, Korea_gungu_sum, cost_Seoul_sum, cost_Gyeonggi_sum, cost_Busan_sum, cost_Daegu_sum, cost_Incheon_sum, cost_Gwangju_sum,
    cost_Daejeon_sum, cost_Ulsan_sum, cost_Sejong_sum, cost_Gangwondo_sum, cost_Chungcheongbukdo_sum, cost_Chungcheongnamdo_sum,
    cost_Jeollabukdo_sum, cost_Jeollanamdo_sum, cost_Gyeongsangbukdo_sum, cost_Gyeongsangnamdo_sum, cost_Jejudo_sum
  ]

  for(var k in cost_region_arr_temp){
    cost_region_arr[k] = _.cloneDeep(cost_region_arr_temp[k])
    for(var j in cost_region_arr[k]){
      cost_sum = cost_region_arr[k][j]['Sum']
      cost_percentage = cost_sum / cost_sum_arr[k]
      cost_region_arr[k][j].Percentage = cost_percentage
    }
  }
}

function showCostsum(){
  if(isMobile){
    current_selection = $("#sidogungu_m option:selected").val()
  }
  else{
    current_selection = $("#sidogungu option:selected").val()
  }
  cost_data = ""
  cost_sum = 0
  
  if (current_selection === "Korea_upper" || current_selection === "Korea_lower") {
    is_drilldown_from_korea = false;
    $("#btn_back_korea").hide();
  } else {
    is_drilldown_from_korea = true;
    $("#btn_back_korea").show();
  }

  /*
  if(current_selection == "Korea_upper"){ cost_data = cost_region_arr[0]; cost_sum = cost_sum_arr[0] }
  if(current_selection == "Korea_lower"){ cost_data = cost_region_arr[1]; cost_sum = cost_sum_arr[1] }
  if(current_selection == "Seoul")      { cost_data = cost_region_arr[2]; cost_sum = cost_sum_arr[2] }
  if(current_selection == "Gyeonggi")   { cost_data = cost_region_arr[3]; cost_sum = cost_sum_arr[3] }
  if(current_selection == "Busan")      { cost_data = cost_region_arr[4]; cost_sum = cost_sum_arr[4] }
  if(current_selection == "Daegu")      { cost_data = cost_region_arr[5]; cost_sum = cost_sum_arr[5] }
  if(current_selection == "Incheon")    { cost_data = cost_region_arr[6]; cost_sum = cost_sum_arr[6] }
  if(current_selection == "Gwangju")    { cost_data = cost_region_arr[7]; cost_sum = cost_sum_arr[7] }
  if(current_selection == "Daejeon")    { cost_data = cost_region_arr[8]; cost_sum = cost_sum_arr[8] }
  if(current_selection == "Ulsan")      { cost_data = cost_region_arr[9]; cost_sum = cost_sum_arr[9] }
  if(current_selection == "Sejong")     { cost_data = cost_region_arr[10]; cost_sum = cost_sum_arr[10] }
  if(current_selection == "Gangwondo")  { cost_data = cost_region_arr[11]; cost_sum = cost_sum_arr[11] }
  if(current_selection == "Chungcheongbukdo"){ cost_data = cost_region_arr[12]; cost_sum = cost_sum_arr[12] }
  if(current_selection == "Chungcheongnamdo"){ cost_data = cost_region_arr[13]; cost_sum = cost_sum_arr[13] }
  if(current_selection == "Jeollabukdo"){ cost_data = cost_region_arr[14]; cost_sum = cost_sum_arr[14] }
  if(current_selection == "Jeollanamdo"){ cost_data = cost_region_arr[15]; cost_sum = cost_sum_arr[15] }
  if(current_selection == "Gyeongsangbukdo"){ cost_data = cost_region_arr[16]; cost_sum = cost_sum_arr[16] }
  if(current_selection == "Gyeongsangnamdo"){ cost_data = cost_region_arr[17]; cost_sum = cost_sum_arr[17] }
  if(current_selection == "Jejudo"){ cost_data = cost_region_arr[18]; cost_sum = cost_sum_arr[18] }
  */
  if(current_selection == "Korea_upper"){ cost_data = cost_region_arr[0]; cost_sum = cost_treemap.data[0]['Sum']; cost_delta = cost_treemap.data[0]['Sum_delta'] }
  if(current_selection == "Korea_lower"){ cost_data = cost_region_arr[1]; cost_sum = cost_treemap.data[0]['Sum']; cost_delta = cost_treemap.data[0]['Sum_delta'] }
  if(current_selection == "Seoul")      { cost_data = cost_region_arr[2]; cost_sum = cost_treemap.data[1]['Sum']; cost_delta = cost_treemap.data[1]['Sum_delta'] }
  if(current_selection == "Gyeonggi")   { cost_data = cost_region_arr[3]; cost_sum = cost_treemap.data[2]['Sum']; cost_delta = cost_treemap.data[2]['Sum_delta'] }
  if(current_selection == "Busan")      { cost_data = cost_region_arr[4]; cost_sum = cost_treemap.data[3]['Sum']; cost_delta = cost_treemap.data[3]['Sum_delta'] }
  if(current_selection == "Daegu")      { cost_data = cost_region_arr[5]; cost_sum = cost_treemap.data[4]['Sum']; cost_delta = cost_treemap.data[4]['Sum_delta'] }
  if(current_selection == "Incheon")    { cost_data = cost_region_arr[6]; cost_sum = cost_treemap.data[5]['Sum']; cost_delta = cost_treemap.data[5]['Sum_delta'] }
  if(current_selection == "Gwangju")    { cost_data = cost_region_arr[7]; cost_sum = cost_treemap.data[6]['Sum']; cost_delta = cost_treemap.data[6]['Sum_delta'] }
  if(current_selection == "Daejeon")    { cost_data = cost_region_arr[8]; cost_sum = cost_treemap.data[7]['Sum']; cost_delta = cost_treemap.data[7]['Sum_delta'] }
  if(current_selection == "Ulsan")      { cost_data = cost_region_arr[9]; cost_sum = cost_treemap.data[8]['Sum']; cost_delta = cost_treemap.data[8]['Sum_delta'] }
  if(current_selection == "Sejong")     { cost_data = cost_region_arr[10]; cost_sum = cost_treemap.data[9]['Sum']; cost_delta = cost_treemap.data[9]['Sum_delta'] }
  if(current_selection == "Gangwondo")  { cost_data = cost_region_arr[11]; cost_sum = cost_treemap.data[10]['Sum']; cost_delta = cost_treemap.data[10]['Sum_delta'] }
  if(current_selection == "Chungcheongbukdo"){ cost_data = cost_region_arr[12]; cost_sum = cost_treemap.data[11]['Sum']; cost_delta = cost_treemap.data[11]['Sum_delta'] }
  if(current_selection == "Chungcheongnamdo"){ cost_data = cost_region_arr[13]; cost_sum = cost_treemap.data[12]['Sum']; cost_delta = cost_treemap.data[12]['Sum_delta'] }
  if(current_selection == "Jeollabukdo"){ cost_data = cost_region_arr[14]; cost_sum = cost_treemap.data[13]['Sum']; cost_delta = cost_treemap.data[13]['Sum_delta'] }
  if(current_selection == "Jeonamgwangju"){ cost_data = cost_region_arr[15]; cost_sum = cost_treemap.data[14]['Sum']; cost_delta = cost_treemap.data[14]['Sum_delta'] }
  if(current_selection == "Gyeongsangbukdo"){ cost_data = cost_region_arr[16]; cost_sum = cost_treemap.data[15]['Sum']; cost_delta = cost_treemap.data[15]['Sum_delta'] }
  if(current_selection == "Gyeongsangnamdo"){ cost_data = cost_region_arr[17]; cost_sum = cost_treemap.data[16]['Sum']; cost_delta = cost_treemap.data[16]['Sum_delta'] }
  if(current_selection == "Jejudo"){ cost_data = cost_region_arr[18]; cost_sum = cost_treemap.data[17]['Sum']; cost_delta = cost_treemap.data[17]['Sum_delta'] }
  
  //console.log("scr_width", scr_width)
  //console.log("scr_height", scr_height)
  str_cost_sum = setPrice(Math.round(cost_sum)*100000000)
  abs_cost_delta = Math.abs(cost_delta)
  str_cost_delta = setPrice(Math.round(abs_cost_delta)*100000000)
  if(cost_delta == 0){
    cost_delta_with_tag = "=" + str_cost_delta
  }
  else if(cost_delta < 0){
    cost_delta_with_tag = "<span style='color:#146af5'>▼ " + str_cost_delta + "</span>"
  }
  else{
    cost_delta_with_tag = "<span style='color:#e8352e'>▲ " + str_cost_delta + "</span>"
  }

  if(isMobile){
    treemapCanvas = "<div id='total_wrapper_m'>"
      treemapCanvas += "<div id='total_sum'>(총액 = " + str_cost_sum + ", " + cost_delta_with_tag + ")</div>"
      treemapCanvas += "<div id='total_sum_update'>" + cost_treemap.data[0]['Update'] + "</div>"
    treemapCanvas += "</div>"
  }
  else{
    treemapCanvas = "<div id='total_wrapper'>"
      treemapCanvas += "<div id='total_sum'>(총액 = " + str_cost_sum + ", " + cost_delta_with_tag + ")</div>"
      treemapCanvas += "<div id='total_sum_update'>업데이트 : " + cost_treemap.data[0]['Update'] + "</div>"
    treemapCanvas += "</div>"
  }
  if(isMobile){
    scr_width = window.innerWidth
    scr_height = window.innerHeight * 0.9
    treemapCanvas += "<div class='graph_m'> <canvas id='treeMapChart' width='"+ scr_width +"' height='" + scr_height + "'></canvas></div>"
  }
  else{
    scr_width = window.innerWidth
    scr_height = window.innerHeight * 0.85
    treemapCanvas += "<div class='graph'> <canvas id='treeMapChart' width='"+ scr_width +"' height='" + scr_height + "'></canvas></div>"
  }
  
  $("#costDetail").html(treemapCanvas)

  drawTreeMap(cost_data)
  $("#costModal").modal('show')  
}

function drawTreeMap(data){
  data_list = []
  region_name_list = []

  for(var i = 0 ; i < data.length; i++){
    data_list.push(data[i]['Sum'])
    region_name_list.push(data[i]['Region'])
  }

  const ctx = document.getElementById('treeMapChart');

  new Chart(ctx, {    
    type: 'treemap',
    data: {
      datasets: [
        {
          label: region_name_list,        
          tree: data,
          key: 'Sum',
          borderWidth: 1,
          spacing: 0,
          backgroundColor: (ctx) => colorFromRaw(ctx),
          labels: {            
            align: 'center',
            display: 'auto',
            formatter(ctx) {
              if (ctx.type !== 'data') {``
                return;
              }
              total_amount = Math.round(ctx.raw.v)*100000000
              
              total_amount_delta = Math.round(ctx.raw._data.Sum_delta)*100000000
              abs_total_amount_delta = Math.abs(total_amount_delta)
              if(total_amount_delta == 0){
                str_total_amount_delta = "(=" + total_amount_delta + ")"
              }
              else if(total_amount_delta < 0){
                str_total_amount_delta = "(▼" + setPrice(abs_total_amount_delta) + ")"
              }
              else{
                str_total_amount_delta = "(▲" + setPrice(abs_total_amount_delta) + ")"
              }

              str_percentage = (ctx.raw._data.Percentage*100).toFixed(2) + "%" 
              region_name = ctx.raw._data.Region
              shown_name_arr = region_name.split(" ")
              shown_name = shown_name_arr[shown_name_arr.length-1]
              total_amount_short = (total_amount/1000000000000).toFixed(2) + "조"
              if(ctx.raw.w > 100 && ctx.raw.w <= 150){
                return [shown_name, str_percentage, '', total_amount_short, str_total_amount_delta];
              }
              else if(ctx.raw.w > 55 && ctx.raw.w <= 100){
                return [shown_name, str_percentage, total_amount_short];
              }
              else if(ctx.raw.w > 25 && ctx.raw.w <= 55){
                return [shown_name.substr(0, 2)]
              }
              else if(ctx.raw.w <= 25){
                return ""
              }
              else{
                return [shown_name, str_percentage, '', setPrice(total_amount), str_total_amount_delta];
              }
            },
            color: 'white',
            hoverColor: 'white',
            font: (ctx) => {
              if(ctx.raw.w > 100 && ctx.raw.w <= 150){
                return [{size: 20, weight: 'bold'}, {size: 16}, {size: 6}, {size: 14}, {size: 12}]
              }
              else if(ctx.raw.w > 55 && ctx.raw.w <= 100){
                return [{size: 18, weight: 'bold'}, {size: 14}, {size: 12}]
              }
              else if(ctx.raw.w <= 55){
                return ""
              }
              else{
                return [{size: 22, weight: 'bold'}, {size: 20}, {size: 6}, {size: 18}, {size: 12}]
              }
            },
            position: 'center'
          }
        }
      ],
    },
    options: {
      onClick: function(e, elements, chart) {
        if (elements.length > 0) {
          var datasetIndex = elements[0].datasetIndex;
          var index = elements[0].index;
          var dataItem = chart.data.datasets[datasetIndex].data[index];
          
          if (dataItem && dataItem._data) {
            var current_selection = isMobile ? $("#sidogungu_m option:selected").val() : $("#sidogungu option:selected").val();
            
            if (current_selection === "Korea_upper" && dataItem._data.Level === "Level1") {
              var regionEng = dataItem._data.Region_ENG;
              
              is_drilldown_from_korea = true;
              $("#btn_back_korea").show();
              
              if (isMobile) {
                $("#sidogungu_m").val(regionEng);
              } else {
                $("#sidogungu").val(regionEng);
              }
              showCostsum();
            }
          }
        }
      },
      onHover: function(e, elements, chart) {
        var current_selection = isMobile ? $("#sidogungu_m option:selected").val() : $("#sidogungu option:selected").val();
        if (current_selection === "Korea_upper" && elements.length > 0) {
          e.native.target.style.cursor = 'pointer';
        } else {
          e.native.target.style.cursor = 'default';
        }
      },
      animation: {        
          duration: 850,
      },
      plugins:{
        title: {
          display: false, 
        },
        legend:{
          display: false
        },        
        tooltip: {
          yAlign: 'top',
          xAlign: 'left',          
          enabled: true,
          callbacks: {
            title(items) {
              title_txt = items[0].raw._data.Region
              return title_txt;
            },
            label(item) {
              const dataItem = item.raw;
              total_amount = Math.round(dataItem.v)* 100000000              
              str_percentage = ( ( dataItem._data.Percentage)*100 ).toFixed(2)
              total_amount_delta = Math.round(dataItem._data.Sum_delta)*100000000
              abs_total_amount_delta = Math.abs(total_amount_delta)
              if(total_amount_delta == 0){
                str_total_amount_delta = "=" + total_amount_delta
              }
              else if(total_amount_delta < 0){
                str_total_amount_delta = "▼" + setPrice(abs_total_amount_delta)
              }
              else{
                str_total_amount_delta = "▲" + setPrice(abs_total_amount_delta)
              }
              return [" " + str_percentage + "%", '', setPrice(total_amount), "(" + str_total_amount_delta + ")"]
            }
          }
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            }
          },
          pan: {
            enabled: true,
          }
        }                   
      }         
    }
  });
}

function colorFromRaw(ctx, border) {
  if (ctx.type !== 'data') {
    return 'transparent';
  }
  var percentage = ctx.raw._data.Percentage;
  var sum_delta = ctx.raw._data.Sum_delta;

  var color_r = 179
  var color_g = 19
  var color_b = 19

  //alpha = (1 + Math.log(percentage * 200)) / 5;
  if(sum_delta < 0){
    color_r = 19
    color_g = 19
    color_b = 179
  } 

  alpha = percentage + 0.7

  //converted_r = color_r * (alpha)
  //converted_g = color_g * (alpha)
  //converted_b = color_b * (alpha)

  return "rgba(" + color_r + "," + color_g + "," + color_b + "," + alpha + ")"
}

// 2026-10-23: 다중 모달 중첩 표시(급지요약 위 동 상세 모달) 및 브라우저/모바일 Back 버튼 히스토리 스택 관리
var modalHistoryStack = [];
var isClosingFromPopState = false;
var suppressHistoryBackCount = 0;

function pushModalHistoryState(stateId) {
  if (modalHistoryStack[modalHistoryStack.length - 1] !== stateId) {
    modalHistoryStack.push(stateId);
    window.history.pushState({ modalState: stateId, depth: modalHistoryStack.length }, "", "#" + stateId);
  }
}

// 2026-10-23: share.js의 전역 popstate 리스너($('.modal.show').modal('hide'))보다 먼저 실행되도록
// 최상위(Top-level) Capture 단계(true)에서 등록하고 stopImmediatePropagation()으로 하위 모달 동시 닫힘 방지
window.addEventListener('popstate', function(event) {
  event.stopImmediatePropagation();

  if (suppressHistoryBackCount > 0) {
    suppressHistoryBackCount -= 1;
    return;
  }

  if (modalHistoryStack.length === 0) {
    return;
  }

  var topState = modalHistoryStack[modalHistoryStack.length - 1];

  // 1) 시가총액 MAP에서 전국 시도 -> 특정 시도로 드릴다운한 경우: 모달을 닫지 않고 전국 시도로 복귀
  if (topState === "costModal" && is_drilldown_from_korea) {
    is_drilldown_from_korea = false;
    $("#btn_back_korea").hide();
    if (isMobile) {
      $("#sidogungu_m").val("Korea_upper");
    } else {
      $("#sidogungu").val("Korea_upper");
    }
    showCostsum();
    window.history.pushState({ modalState: "costModal", depth: modalHistoryStack.length }, "", "#costModal");
    return;
  }

  // 2) 급지요약 모달에서 특정 구·군 단독 보기로 진입한 상태에서 기기/브라우저 Back 버튼을 누른 경우: 전체(ALL) 보기로 복귀
  if (topState === "summaryModal" && ($("#summaryGungu").val() || "ALL") !== "ALL") {
    $("#summaryGungu").val("ALL");
    renderClassSummary();
    window.history.pushState({ modalState: "summaryModal", depth: modalHistoryStack.length }, "", "#summaryModal");
    return;
  }

  // 3) 최상위 모달만 닫기 (예: #infoModal 닫고 하위의 #summaryModal은 그대로 유지)
  modalHistoryStack.pop();
  isClosingFromPopState = true;
  $("#" + topState).modal("hide");
  isClosingFromPopState = false;
}, true);

$(document).ready(function() {
  // 모달 열릴 때: 중첩 z-index 계산 및 히스토리 스택 push
  $('div.modal').on('show.bs.modal', function() {
    var modalId = this.id;
    var openModalsCount = $('.modal.show').not(this).length;
    var zIndex = 1055 + (10 * openModalsCount);
    $(this).css('z-index', zIndex);
    setTimeout(function() {
      $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 5).addClass('modal-stack');
    }, 0);

    if (modalId === "exampleModal" || modalId === "noticeModal") {
      return;
    }
    pushModalHistoryState(modalId);
  });

  // 모달 닫힐 때(X 버튼 또는 배경 클릭 등): 히스토리 스택 동기화
  $('div.modal').on('hide.bs.modal', function() {
    var modalId = this.id;
    if (modalId === "exampleModal" || modalId === "noticeModal") {
      return;
    }

    if (modalId === "costModal") {
      is_drilldown_from_korea = false;
      $("#btn_back_korea").hide();
    }

    if (!isClosingFromPopState) {
      var idx = modalHistoryStack.lastIndexOf(modalId);
      if (idx !== -1) {
        modalHistoryStack.splice(idx, 1);
        suppressHistoryBackCount += 1;
        window.history.back();
      }
    }
  });

  // 상위 모달(#infoModal 등)이 닫힌 뒤 하위 모달(#summaryModal 등)이 열려 있으면 스크롤 잠금/활성 상태 유지
  $('div.modal').on('hidden.bs.modal', function() {
    if ($('.modal.show').length > 0) {
      $('body').addClass('modal-open').css('overflow', 'hidden');
    }
  });
});

function goBackToKorea() {
  if (is_drilldown_from_korea) {
    is_drilldown_from_korea = false;
    $("#btn_back_korea").hide();
    
    if (isMobile) {
      $("#sidogungu_m").val("Korea_upper");
    } else {
      $("#sidogungu").val("Korea_upper");
    }
    showCostsum();
  }
}

// 2026-10-23: 지역별 급지요약 모달 (#summaryModal) 렌더링 및 고해상도 이미지 캡쳐 기능
var summaryInitialized = false;

function getSummaryTiers(theme) {
  if (theme === "menu_select_price") {
    return [
      { id: "T01", label: "특1급지", rangeText: "0~0.1%", min: 0, max: 0.1, cl: "CL01" },
      { id: "T02", label: "특2급지", rangeText: "0.1~0.5%", min: 0.1, max: 0.5, cl: "CL02" },
      { id: "T03", label: "특3급지", rangeText: "0.5~1%", min: 0.5, max: 1.0, cl: "CL03" },
      { id: "T04", label: "1급지", rangeText: "1~5%", min: 1.0, max: 5.0, cl: "CL04" },
      { id: "T05", label: "2급지", rangeText: "5~10%", min: 5.0, max: 10.0, cl: "CL05" },
      { id: "T06", label: "3급지", rangeText: "10~20%", min: 10.0, max: 20.0, cl: "CL06" },
      { id: "T07", label: "4급지", rangeText: "20~30%", min: 20.0, max: 30.0, cl: "CL07" },
      { id: "T08", label: "5급지", rangeText: "30~40%", min: 30.0, max: 40.0, cl: "CL08" },
      { id: "T09", label: "6급지", rangeText: "40~50%", min: 40.0, max: 50.0, cl: "CL09" },
      { id: "T10", label: "7급지", rangeText: "50~70%", min: 50.0, max: 70.0, cl: "CL10" },
      { id: "T11", label: "8급지", rangeText: "70~100%", min: 70.0, max: 100.1, cl: "CL11" }
    ];
  } else {
    return [
      { id: "T04", label: "1급지", rangeText: "0~5%", min: 0, max: 5.0, cl: "CL04" },
      { id: "T05", label: "2급지", rangeText: "5~10%", min: 5.0, max: 10.0, cl: "CL05" },
      { id: "T06", label: "3급지", rangeText: "10~20%", min: 10.0, max: 20.0, cl: "CL06" },
      { id: "T07", label: "4급지", rangeText: "20~30%", min: 20.0, max: 30.0, cl: "CL07" },
      { id: "T08", label: "5급지", rangeText: "30~40%", min: 30.0, max: 40.0, cl: "CL08" },
      { id: "T09", label: "6급지", rangeText: "40~50%", min: 40.0, max: 50.0, cl: "CL09" },
      { id: "T10", label: "7급지", rangeText: "50~70%", min: 50.0, max: 70.0, cl: "CL10" },
      { id: "T11", label: "8급지", rangeText: "70~100%", min: 70.0, max: 100.1, cl: "CL11" }
    ];
  }
}

function getSummaryThemeMeta(theme) {
  if (theme === "menu_select_balanced") return { pctKey: "가치_백분률", valKey: "가치총점", name: "균형" };
  if (theme === "menu_select_edu") return { pctKey: "교육_백분률", valKey: "교육총점", name: "교육" };
  if (theme === "menu_select_living") return { pctKey: "주거_백분률", valKey: "주거총점", name: "주거" };
  if (theme === "menu_select_infra") return { pctKey: "인프라_백분률", valKey: "인프라총점", name: "인프라" };
  if (theme === "menu_select_trans") return { pctKey: "교통_백분률", valKey: "교통총점", name: "출퇴근 교통" };
  return { pctKey: "평단가_백분률", valKey: "평단가", name: "평단가" };
}

function showClassSummary() {
  if (!region_class || !sido_list || sido_list.length === 0) {
    alert("데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  if (!summaryInitialized) {
    var headerHtml = "";
    headerHtml += "<select id='summarySido' class='summary-select' onChange='onSummarySidoChange()'>";
    for (var i = 0; i < sido_list.length; i++) {
      headerHtml += "<option value='" + sido_list[i] + "'>" + sido_list[i] + "</option>";
    }
    headerHtml += "</select>";

    headerHtml += "<select id='summaryGungu' class='summary-select' onChange='onSummaryGunguChange()'></select>";

    headerHtml += "<select id='summaryTheme' class='summary-select' onChange='renderClassSummary()'>";
    headerHtml += "<option value='menu_select_price'>#평단가 기준</option>";
    headerHtml += "<option value='menu_select_balanced'>#균형잡힌 기준</option>";
    headerHtml += "<option value='menu_select_edu'>#교육우선 기준</option>";
    headerHtml += "<option value='menu_select_infra'>#인프라우선 기준</option>";
    headerHtml += "<option value='menu_select_living'>#주거우선 기준</option>";
    headerHtml += "<option value='menu_select_trans'>#출퇴근 교통 기준</option>";
    headerHtml += "</select>";

    $("#summaryTitleWrapper").html(headerHtml);

    // 현재 선택된 시도와 매칭되는 기본값 설정
    var defaultSido = "서울시";
    if (typeof selectedRegion !== "undefined" && selectedRegion) {
      for (var r = 0; r < regions.length; r++) {
        if (regions[r][1] === selectedRegion && sido_list.indexOf(regions[r][0]) !== -1) {
          defaultSido = regions[r][0];
          break;
        }
      }
    }
    if (sido_list.indexOf(defaultSido) !== -1) {
      $("#summarySido").val(defaultSido);
    }
    populateSummaryGunguDropdown();
    summaryInitialized = true;
  }

  if (typeof menuSelection !== "undefined" && menuSelection) {
    $("#summaryTheme").val(menuSelection);
  }

  renderClassSummary();
  $("#summaryModal").modal("show");
}

function populateSummaryGunguDropdown() {
  var selectedSido = $("#summarySido").val();
  var sidoIdx = sido_list.indexOf(selectedSido);
  var gungus = (sidoIdx !== -1 && gungu_list[sidoIdx]) ? gungu_list[sidoIdx] : [];

  var gunguHtml = "<option value='ALL'>전체 (구·군 비교)</option>";
  for (var i = 0; i < gungus.length; i++) {
    gunguHtml += "<option value='" + gungus[i] + "'>" + gungus[i] + "</option>";
  }
  $("#summaryGungu").html(gunguHtml);
}

// 2026-10-23: 시도/군구 변경 시 history.back() 호출을 제거하여 모달이 닫히는 현상 원천 차단
function onSummarySidoChange() {
  populateSummaryGunguDropdown();
  renderClassSummary();
}

function onSummaryGunguChange() {
  renderClassSummary();
}

function selectSummaryGungu(gunguName) {
  $("#summaryGungu").val(gunguName);
  onSummaryGunguChange();
}

function openRegionInfoFromSummary(dongIdx) {
  // 2026-10-23: 급지요약 모달(#summaryModal)을 닫지 않고 유지한 채 상위에 동 상세 모달(#infoModal / #infoModal_m)을 중첩 표시
  var summaryTheme = $("#summaryTheme").val() || menuSelection;
  showRegionInfo(dongIdx, summaryTheme);
}
function renderClassSummary() {
  var selectedSido = $("#summarySido").val() || "서울시";
  var selectedGungu = $("#summaryGungu").val() || "ALL";
  var selectedTheme = $("#summaryTheme").val() || "menu_select_price";

  var themeMeta = getSummaryThemeMeta(selectedTheme);
  var tiers = getSummaryTiers(selectedTheme);
  var isPriceTheme = (selectedTheme === "menu_select_price");

  // 해당 시도(및 시군구) 데이터 필터링
  var filteredDongs = [];
  for (var i = 0; i < region_class.length; i++) {
    var row = region_class[i];
    if (row["시도"] !== selectedSido) continue;
    if (selectedGungu !== "ALL" && row["군구"] !== selectedGungu) continue;

    var pctVal = row[themeMeta.pctKey];
    var metricVal = row[themeMeta.valKey];
    if (pctVal === "NA" || pctVal === null || pctVal === undefined) continue;
    if (isPriceTheme && (!metricVal || Number(metricVal) === 0)) continue;

    filteredDongs.push(row);
  }

  var updatedDate = (region_class[0] && region_class[0]["updated"]) ? region_class[0]["updated"] : "";

  if (filteredDongs.length === 0) {
    $("#summaryDetail").html(
      "<div style='padding: 40px 20px; text-align: center; font-weight: 600; color: #64748b;'>" +
      selectedSido + " 지역은 '" + themeMeta.name + "' 분석 대상 데이터가 없습니다. 다른 기준이나 지역을 선택해주세요." +
      "</div>"
    );
    return;
  }

  // 전체 통계 계산
  var totalComplex = 0;
  var totalHouse = 0;
  var sumMetric = 0;
  for (var d = 0; d < filteredDongs.length; d++) {
    totalComplex += Number(filteredDongs[d]["단지수"] || 0);
    totalHouse += Number(filteredDongs[d]["세대수"] || 0);
    sumMetric += Number(filteredDongs[d][themeMeta.valKey] || 0);
  }
  var avgMetric = sumMetric / filteredDongs.length;
  var avgMetricText = isPriceTheme
    ? ("평균 평단가: 평당 " + Number(avgMetric.toFixed(0)).toLocaleString() + "만원")
    : ("평균 " + themeMeta.name + " 점수: " + avgMetric.toFixed(2) + "점");

  var titleRegionText = selectedSido + (selectedGungu === "ALL" ? " 전체" : (" " + selectedGungu));
  var html = "<div id='summaryCaptureTarget'>";

  // 상단 배너
  html += "<div class='summary-banner'>";
  html += "<div>";
  html += "<div class='summary-banner-title'>" + titleRegionText + ", " + themeMeta.name + " 급지 요약표</div>";
  html += "<div class='summary-banner-meta'>" + avgMetricText + " &nbsp;|&nbsp; 총 " + totalComplex.toLocaleString() + "개 단지 (" + totalHouse.toLocaleString() + "세대)</div>";
  html += "</div>";
  html += "<div class='summary-banner-meta'>업데이트 : " + updatedDate + "</div>";
  html += "</div>";

  if (selectedGungu === "ALL") {
    // 시도 전체: 시군구(구·군)별 평균 평단가/점수 내림차순 정렬
    var gunguMap = {};
    for (var k = 0; k < filteredDongs.length; k++) {
      var item = filteredDongs[k];
      var gName = item["군구"];
      if (!gunguMap[gName]) {
        gunguMap[gName] = { name: gName, dongs: [], sumVal: 0, count: 0 };
      }
      gunguMap[gName].dongs.push(item);
      gunguMap[gName].sumVal += Number(item[themeMeta.valKey] || 0);
      gunguMap[gName].count += 1;
    }

    var gunguArr = Object.values(gunguMap);
    gunguArr.sort(function(a, b) {
      var avgA = a.count > 0 ? (a.sumVal / a.count) : 0;
      var avgB = b.count > 0 ? (b.sumVal / b.count) : 0;
      return avgB - avgA;
    });

    html += "<div style='font-size: 0.76rem; color: #64748b; margin-bottom: 6px;' data-html2canvas-ignore='true'>시군구 이름을 클릭하면 해당 군구 요약이 표시되며, 동 이름을 클릭하면 상세 정보가 표시됩니다.</div>";
    html += "<div class='summary-table-scroll'>";
    html += "<table class='summary-matrix-table'>";
    html += "<thead><tr>";
    html += "<th class='summary-tier-col'>급지<br><span style='font-size:0.68rem; font-weight:600; color:#64748b;'>(상위 %)</span></th>";

    for (var g = 0; g < gunguArr.length; g++) {
      var gObj = gunguArr[g];
      var gAvg = gObj.count > 0 ? (gObj.sumVal / gObj.count) : 0;
      var gSubText = isPriceTheme
        ? ("평당 " + Number(gAvg.toFixed(0)).toLocaleString() + "만")
        : (gAvg.toFixed(1) + "점");
      html += "<th style='cursor:pointer;' title='클릭하여 " + gObj.name + " 단독 요약 보기' onClick='selectSummaryGungu(\"" + gObj.name + "\")'>";
      html += "<div>" + gObj.name + "</div>";
      html += "<div class='summary-gungu-header-sub'>" + gSubText + "</div>";
      html += "</th>";
    }
    html += "</tr></thead><tbody>";

    for (var t = 0; t < tiers.length; t++) {
      var tier = tiers[t];
      // 해당 급지에 속하는 동이 시도 내에 하나라도 있는지 확인
      var hasAnyDongInTier = false;
      for (var c = 0; c < filteredDongs.length; c++) {
        var p = Number(filteredDongs[c][themeMeta.pctKey]);
        if (p >= tier.min && p < tier.max) {
          hasAnyDongInTier = true;
          break;
        }
      }
      if (!hasAnyDongInTier) continue;

      html += "<tr>";
      html += "<td class='summary-tier-cell'>";
      html += "<div class='summary-tier-badge " + tier.cl + "'>" + tier.label + "</div>";
      html += "<div class='summary-tier-pct'>(상위 " + tier.rangeText + ")</div>";
      html += "</td>";

      for (var g2 = 0; g2 < gunguArr.length; g2++) {
        var gDongs = gunguArr[g2].dongs.filter(function(dItem) {
          var p = Number(dItem[themeMeta.pctKey]);
          return p >= tier.min && p < tier.max;
        });
        // 백분위 오름차순(우수한 순) 정렬
        gDongs.sort(function(a, b) {
          return Number(a[themeMeta.pctKey]) - Number(b[themeMeta.pctKey]);
        });

        html += "<td>";
        for (var m = 0; m < gDongs.length; m++) {
          var dObj = gDongs[m];
          var dSub = isPriceTheme
            ? (Number(Number(dObj["평단가"]).toFixed(0)).toLocaleString() + "만")
            : (Number(dObj[themeMeta.valKey]).toFixed(1) + "점");
          html += "<div class='summary-dong-badge " + tier.cl + "' onClick='openRegionInfoFromSummary(" + dObj["index"] + ")'>";
          html += "<div>" + dObj["읍면동"] + "</div>";
          html += "<div class='summary-dong-sub'>" + dSub + "</div>";
          html += "</div>";
        }
        html += "</td>";
      }
      html += "</tr>";
    }

    html += "</tbody></table></div>";
  } else {
    // 특정 시군구 단독 선택 시: 한눈에 들어오는 카드형 요약표
    html += "<div style='margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;' data-html2canvas-ignore='true'>";
    html += "<button type='button' class='btn btn-sm btn-outline-secondary' style='font-size: 0.78rem; font-weight: 600;' onClick='selectSummaryGungu(\"ALL\")'>← " + selectedSido + " 전체로 돌아가기</button>";    
    html += "</div>";

    html += "<div class='summary-table-scroll'><table class='summary-single-table'><tbody>";
    for (var t2 = 0; t2 < tiers.length; t2++) {
      var tier2 = tiers[t2];
      var tierDongs = filteredDongs.filter(function(dItem) {
        var p = Number(dItem[themeMeta.pctKey]);
        return p >= tier2.min && p < tier2.max;
      });
      if (tierDongs.length === 0) continue;

      tierDongs.sort(function(a, b) {
        return Number(a[themeMeta.pctKey]) - Number(b[themeMeta.pctKey]);
      });

      html += "<tr>";
      html += "<td class='summary-single-tier-cell'>";
      html += "<div class='summary-tier-badge " + tier2.cl + "'>" + tier2.label + "</div>";
      html += "<div class='summary-tier-pct'>(상위 " + tier2.rangeText + ")</div>";
      html += "</td>";
      html += "<td><div class='summary-single-dong-wrap'>";

      for (var n = 0; n < tierDongs.length; n++) {
        var dObj2 = tierDongs[n];
        var dSub2 = isPriceTheme
          ? ("평당 " + Number(Number(dObj2["평단가"]).toFixed(0)).toLocaleString() + "만원")
          : (themeMeta.name + " " + Number(dObj2[themeMeta.valKey]).toFixed(2) + "점");
        html += "<div class='summary-single-dong-item " + tier2.cl + "' onClick='openRegionInfoFromSummary(" + dObj2["index"] + ")'>";
        html += "<div>" + dObj2["읍면동"] + "</div>";
        html += "<div class='summary-dong-sub'>" + dSub2 + " · 상위 " + setPercentage(Number(dObj2[themeMeta.pctKey])) + "</div>";
        html += "</div>";
      }

      html += "</div></td></tr>";
    }
    html += "</tbody></table></div>";
  }

  html += "</div>";
  $("#summaryDetail").html(html);
}

async function downloadClassSummaryImage(btnEl, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  if (typeof html2canvas === "undefined") {
    alert("이미지 저장 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  var targetEl = document.getElementById("summaryCaptureTarget");
  if (!targetEl) return;

  var originalBtnHtml = btnEl.innerHTML;
  var isAllGungu = ($("#summaryGungu").val() || "ALL") === "ALL";
  btnEl.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> <span>" + (isAllGungu ? "고해상도 저장 중..." : "저장 중...") + "</span>";
  btnEl.style.pointerEvents = "none";

  var offscreenWrapper = null;

  try {
    await new Promise(function(resolve) { setTimeout(resolve, 40); });

    var now = new Date();
    var pad = function(n) { return String(n).padStart(2, "0"); };
    var timeStampText = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + " " +
                        pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
    var fileTimeStamp = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + "_" +
                        pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());

    var selectedSido = $("#summarySido").val() || "서울시";
    var selectedGungu = $("#summaryGungu").val() || "ALL";
    var selectedTheme = $("#summaryTheme").val() || "menu_select_price";
    var themeMeta = getSummaryThemeMeta(selectedTheme);

    var safeName = function(str) { return (str || "").replace(/[\\/:*?"<>|\s]+/g, "_"); };
    var gunguLabel = (selectedGungu === "ALL") ? "전체" : safeName(selectedGungu);
    var fileName = "리얼랭커스_급지요약_" + safeName(selectedSido) + "_" + gunguLabel + "_" + safeName(themeMeta.name) + "_" + fileTimeStamp + ".png";

    // 2026-10-23: 오프스크린 복제 컨테이너에서 전체 표를 펼쳐 캡쳐 (모바일 padding:0!important 영향 방지를 위해 setProperty 사용)
    offscreenWrapper = document.createElement("div");
    offscreenWrapper.id = "summaryOffscreenCapture";
    offscreenWrapper.style.cssText = "position:fixed; left:0; top:0; z-index:-9999; background:#ffffff; padding:0; margin:0; width:max-content; max-width:none; overflow:visible; pointer-events:none;";

    var cloneEl = targetEl.cloneNode(true);
    cloneEl.id = "summaryCaptureTarget_clone";
    cloneEl.style.cssText = "background:#ffffff; border-radius:8px; width:max-content; max-width:none; overflow:visible; box-sizing:border-box;";
    cloneEl.style.setProperty("padding", "16px 20px", "important");

    var clonedScroll = cloneEl.querySelector(".summary-table-scroll");
    if (clonedScroll) {
      clonedScroll.style.overflow = "visible";
      clonedScroll.style.maxHeight = "none";
      clonedScroll.style.height = "auto";
      clonedScroll.style.flex = "none";
      clonedScroll.style.width = "max-content";
      clonedScroll.style.maxWidth = "none";
    }

    var clonedMatrixTable = cloneEl.querySelector(".summary-matrix-table");
    if (clonedMatrixTable) {
      clonedMatrixTable.style.width = "max-content";
      clonedMatrixTable.style.tableLayout = "auto";
    }

    var clonedSingleTable = cloneEl.querySelector(".summary-single-table");
    if (clonedSingleTable) {
      clonedSingleTable.style.width = "960px";
      clonedSingleTable.style.maxWidth = "none";
    }

    // sticky 속성 해제 (html2canvas 캡쳐 시 상단 헤더·좌측 급지 열 겹침 방지)
    var stickyCells = cloneEl.querySelectorAll("thead, thead th, .summary-tier-col, .summary-tier-cell");
    stickyCells.forEach(function(cell) {
      cell.style.position = "static";
    });

    // 하단 워터마크 바 추가
    var watermark = document.createElement("div");
    watermark.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding:10px 16px; background:#f8fafc; border-top:1px solid #e2e8f0; border-radius:6px; font-size:12px; color:#64748b; font-weight:600;";
    watermark.innerHTML = "<span>Captured at " + timeStampText + "</span><span>리얼랭커스 | realrankus.com</span>";
    cloneEl.appendChild(watermark);

    offscreenWrapper.appendChild(cloneEl);
    document.body.appendChild(offscreenWrapper);

    var captureW = Math.ceil(cloneEl.scrollWidth || cloneEl.offsetWidth || 1000);
    var captureH = Math.ceil(cloneEl.scrollHeight || cloneEl.offsetHeight || 800);
    // 분할 캡쳐 시 레이아웃 흔들림 방지를 위해 고정 픽셀 너비 지정
    cloneEl.style.width = captureW + "px";
    var virtualWinW = Math.max(captureW + 40, 1200);
    var virtualWinH = Math.max(captureH + 40, 900);

    var ignoreFilter = function(el) {
      if (!el) return false;
      if (el.id === "map_area" || el.id === "table_area" || el.id === "table_area_m" ||
          el.id === "costModal" || el.id === "infoModal" || el.id === "infoModal_m" ||
          el.id === "exampleModal" || el.id === "noticeModal" || el.id === "summaryModal") {
        return true;
      }
      if (el.classList && el.classList.contains("modal-backdrop")) {
        return true;
      }
      return false;
    };

    // 1px 단위 가로·세로 교차 스캔라인 샘플링으로 1px 테두리(#cbd5e1)만 있는 희소 타일도 정확히 감지하고 빈 캔버스는 걸러냄
    var isCanvasRendered = function(cvs) {
      if (!cvs || cvs.width === 0 || cvs.height === 0) return false;
      try {
        var ctx = cvs.getContext("2d");
        if (!ctx) return false;
        var sampleYs = [
          Math.floor(cvs.height * 0.2),
          Math.floor(cvs.height * 0.5),
          Math.floor(cvs.height * 0.8)
        ];
        for (var i = 0; i < sampleYs.length; i++) {
          var sy = Math.max(0, Math.min(cvs.height - 1, sampleYs[i]));
          var rowData = ctx.getImageData(0, sy, cvs.width, 1).data;
          for (var p = 0; p < rowData.length; p += 4) {
            if (rowData[p + 3] > 10 && (rowData[p] < 250 || rowData[p + 1] < 250 || rowData[p + 2] < 250)) {
              return true;
            }
          }
        }
        var sampleXs = [
          Math.floor(cvs.width * 0.2),
          Math.floor(cvs.width * 0.5),
          Math.floor(cvs.width * 0.8)
        ];
        for (var j = 0; j < sampleXs.length; j++) {
          var sx = Math.max(0, Math.min(cvs.width - 1, sampleXs[j]));
          var colData = ctx.getImageData(sx, 0, 1, cvs.height).data;
          for (var q = 0; q < colData.length; q += 4) {
            if (colData[q + 3] > 10 && (colData[q] < 250 || colData[q + 1] < 250 || colData[q + 2] < 250)) {
              return true;
            }
          }
        }
        return false;
      } catch (e) {
        return false;
      }
    };

    var canvasToBlobAsync = function(cvs) {
      return new Promise(function(resolve) {
        if (!cvs || !cvs.toBlob) {
          resolve(null);
          return;
        }
        try {
          cvs.toBlob(function(b) { resolve(b); }, "image/png");
        } catch (e) {
          resolve(null);
        }
      });
    };

    var blobToBase64Async = function(blobObj) {
      return new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onloadend = function() {
          var res = reader.result || "";
          resolve(res.replace(/^data:image\/png;base64,/, ""));
        };
        reader.onerror = function() { resolve(null); };
        reader.readAsDataURL(blobObj);
      });
    };

    var renderTileWithRetry = async function(tx, ty, curTileW, curTileH, scaleVal) {
      for (var attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) {
          await new Promise(function(r) { setTimeout(r, 60); });
        }
        var tCvs = await html2canvas(cloneEl, {
          scale: scaleVal,
          x: tx,
          y: ty,
          width: curTileW,
          height: curTileH,
          windowWidth: virtualWinW,
          windowHeight: virtualWinH,
          scrollX: 0,
          scrollY: 0,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          ignoreElements: ignoreFilter
        });
        if (isCanvasRendered(tCvs)) {
          return tCvs;
        }
      }
      return null;
    };

    // 2026-10-23: 모바일(iOS Safari 단일 캔버스 16.77MP 제한, Android 대용량 캔버스 메모리 제한 등)에서도
    // 경기도 전체(~4,600x2,800px)를 2.5~3.0배율 초고해상도 PNG로 생성할 수 있도록
    // 단일 거대 캔버스를 만들지 않고 가로 밴드(Band) 단위로 타일을 캡쳐해 즉시 PNG(CompressionStream deflate)로 스트리밍 인코딩하는 함수
    var encodeHighResStreamedPngBlob = async function(streamScale) {
      if (typeof CompressionStream === "undefined") return null;
      try {
        var fullW = Math.round(captureW * streamScale);
        var fullH = Math.round(captureH * streamScale);
        var tileStepX = 600;
        var tileStepY = 400;
        var cols = Math.ceil(captureW / tileStepX);
        var rows = Math.ceil(captureH / tileStepY);
        var totalTiles = cols * rows;
        var doneTiles = 0;

        var crcTable = new Uint32Array(256);
        for (var n = 0; n < 256; n++) {
          var c = n;
          for (var k = 0; k < 8; k++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
          }
          crcTable[n] = c >>> 0;
        }
        var calcCrc32 = function(buf, start, len) {
          var c = 0xffffffff;
          for (var i = start; i < start + len; i++) {
            c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
          }
          return (c ^ 0xffffffff) >>> 0;
        };
        var makePngChunk = function(typeStr, dataBytes) {
          var len = dataBytes ? dataBytes.length : 0;
          var chunk = new Uint8Array(12 + len);
          var view = new DataView(chunk.buffer);
          view.setUint32(0, len, false);
          for (var i = 0; i < 4; i++) chunk[4 + i] = typeStr.charCodeAt(i);
          if (len > 0) chunk.set(dataBytes, 8);
          view.setUint32(8 + len, calcCrc32(chunk, 4, 4 + len), false);
          return chunk;
        };

        var cs = new CompressionStream("deflate");
        var writer = cs.writable.getWriter();
        var reader = cs.readable.getReader();
        var idatParts = [];
        var readerPromise = (async function() {
          while (true) {
            var res = await reader.read();
            if (res.done) break;
            if (res.value && res.value.length > 0) idatParts.push(res.value);
          }
        })();

        var rowStride = 1 + fullW * 4;
        for (var ty = 0; ty < captureH; ty += tileStepY) {
          var curTileH = Math.min(tileStepY, captureH - ty);
          var destY0 = Math.round(ty * streamScale);
          var destY1 = (ty + tileStepY >= captureH) ? fullH : Math.round((ty + curTileH) * streamScale);
          var bandPxH = destY1 - destY0;
          if (bandPxH <= 0) continue;

          // 현재 가로 밴드(fullW x bandPxH) 버퍼만 할당 후 흰색(#ffffff) 초기화
          var bandBuf = new Uint8Array(bandPxH * rowStride);
          bandBuf.fill(255);
          for (var r = 0; r < bandPxH; r++) {
            bandBuf[r * rowStride] = 0; // PNG Filter 0 (None)
          }

          for (var tx = 0; tx < captureW; tx += tileStepX) {
            var curTileW = Math.min(tileStepX, captureW - tx);
            var pct = Math.round((doneTiles / Math.max(totalTiles, 1)) * 100);
            btnEl.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> <span>고해상도 저장 중 (" + pct + "%)</span>";
            await new Promise(function(r) { setTimeout(r, 15); });

            var tileCvs = await renderTileWithRetry(tx, ty, curTileW, curTileH, streamScale);
            if (!tileCvs) {
              try { await writer.abort(); } catch (e) {}
              return null;
            }

            var destX0 = Math.round(tx * streamScale);
            var copyW = Math.min(tileCvs.width, fullW - destX0);
            var copyH = Math.min(tileCvs.height, bandPxH);
            if (copyW > 0 && copyH > 0) {
              var tCtx = tileCvs.getContext("2d");
              var imgData = tCtx.getImageData(0, 0, copyW, copyH).data;
              var rowByteLen = copyW * 4;
              for (var py = 0; py < copyH; py++) {
                var srcOff = py * rowByteLen;
                var dstOff = py * rowStride + 1 + destX0 * 4;
                bandBuf.set(imgData.subarray(srcOff, srcOff + rowByteLen), dstOff);
              }
            }
            tileCvs.width = 0;
            tileCvs.height = 0;
            doneTiles++;
          }

          await writer.write(bandBuf);
          bandBuf = null;
        }

        await writer.close();
        await readerPromise;

        var pngSig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
        var ihdr = new Uint8Array(13);
        var ihdrView = new DataView(ihdr.buffer);
        ihdrView.setUint32(0, fullW, false);
        ihdrView.setUint32(4, fullH, false);
        ihdr[8] = 8;
        ihdr[9] = 6;
        ihdr[10] = 0;
        ihdr[11] = 0;
        ihdr[12] = 0;

        var blobParts = [pngSig, makePngChunk("IHDR", ihdr)];
        for (var pIdx = 0; pIdx < idatParts.length; pIdx++) {
          blobParts.push(makePngChunk("IDAT", idatParts[pIdx]));
        }
        blobParts.push(makePngChunk("IEND", null));
        return new Blob(blobParts, { type: "image/png" });
      } catch (streamErr) {
        console.warn("Streamed PNG encode fallback:", streamErr);
        return null;
      }
    };

    var finalBlob = null;
    var finalCanvas = null;
    var isMobileEnv = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || !!(window.Android);

    // 2026-10-23: PC 및 모바일 모두에서 '전체' 보기(또는 대형 표) 캡쳐 시 시간 소요를 감수하더라도 고해상도(2.5~3.0배율)로 캡쳐
    if (selectedGungu === "ALL" || captureW > 1200 || captureH > 1200) {
      // 1) 모바일 환경이거나 초대형 표(경기도 전체 등)에서 단일 캔버스 제한에 걸릴 가능성이 있는 경우,
      //    단일 캔버스 크기 제한과 무관하게 2.5~3.0배율 원본 해상도를 100% 보장하는 밴드 스트리밍 PNG 인코더를 우선 실행
      if (typeof CompressionStream !== "undefined" && (isMobileEnv || (captureW * captureH > 8000000))) {
        var targetStreamScale = (captureW * captureH > 9000000) ? 2.5 : 3.0;
        finalBlob = await encodeHighResStreamedPngBlob(targetStreamScale);
        if (!finalBlob && targetStreamScale > 2.0) {
          finalBlob = await encodeHighResStreamedPngBlob(2.0);
        }
      }

      // 2) 스트리밍 Blob이 아직 생성되지 않은 경우 2D 타일 병합 캔버스(PC/모바일 공통 고해상도 한도) 실행
      if (!finalBlob) {
        var candidateScales = [3.0, 2.6, 2.4, 2.0, 1.8];
        var maxAllowedDim = 15800;
        var maxAllowedArea = 110000000;

        var chosenScale = 0;
        var stitchedCanvas = null;
        var stitchedCtx = null;

        for (var sIdx = 0; sIdx < candidateScales.length; sIdx++) {
          var testScale = candidateScales[sIdx];
          var testW = Math.round(captureW * testScale);
          var testH = Math.round(captureH * testScale);
          if (testW > maxAllowedDim || testH > maxAllowedDim || (testW * testH) > maxAllowedArea) {
            continue;
          }
          var testCvs = document.createElement("canvas");
          testCvs.width = testW;
          testCvs.height = testH;
          var testCtx = testCvs.getContext("2d");
          if (!testCtx) continue;

          testCtx.fillStyle = "#ffffff";
          testCtx.fillRect(0, 0, testW, testH);
          var cornerPixel = testCtx.getImageData(testW - 1, testH - 1, 1, 1).data;
          if (cornerPixel[3] === 255 && cornerPixel[0] === 255) {
            chosenScale = testScale;
            stitchedCanvas = testCvs;
            stitchedCtx = testCtx;
            break;
          }
        }

        if (chosenScale > 0 && stitchedCanvas && stitchedCtx) {
          var tileStepX2 = isMobileEnv ? 650 : 800;
          var tileStepY2 = isMobileEnv ? 700 : 900;
          var cols2 = Math.ceil(captureW / tileStepX2);
          var rows2 = Math.ceil(captureH / tileStepY2);
          var totalTiles2 = cols2 * rows2;
          var doneTiles2 = 0;
          var allTilesOk = true;

          for (var ty2 = 0; ty2 < captureH; ty2 += tileStepY2) {
            var curTileH2 = Math.min(tileStepY2, captureH - ty2);
            for (var tx2 = 0; tx2 < captureW; tx2 += tileStepX2) {
              var curTileW2 = Math.min(tileStepX2, captureW - tx2);
              var pct2 = Math.round((doneTiles2 / Math.max(totalTiles2, 1)) * 100);
              btnEl.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> <span>고해상도 저장 중 (" + pct2 + "%)</span>";
              await new Promise(function(r) { setTimeout(r, 10); });

              var tileCanvas = await renderTileWithRetry(tx2, ty2, curTileW2, curTileH2, chosenScale);
              if (!tileCanvas) {
                allTilesOk = false;
                break;
              }

              stitchedCtx.drawImage(tileCanvas, Math.round(tx2 * chosenScale), Math.round(ty2 * chosenScale));
              tileCanvas.width = 0;
              tileCanvas.height = 0;
              doneTiles2++;
            }
            if (!allTilesOk) break;
          }

          if (allTilesOk && isCanvasRendered(stitchedCanvas)) {
            finalCanvas = stitchedCanvas;
          }
        }
      }
    }

    // 단일 구·군 소형 표이거나 위 방식이 지원되지 않는 구형 브라우저 폴백
    if (!finalBlob && !finalCanvas) {
      var maxCanvasDim = 7680;
      var maxCanvasArea = 16000000;
      var baseScale = 3.0;
      var scaleByDim = Math.min(maxCanvasDim / Math.max(captureW, 1), maxCanvasDim / Math.max(captureH, 1));
      var scaleByArea = Math.sqrt(maxCanvasArea / Math.max(captureW * captureH, 1));
      var captureScale = Math.max(1, Math.min(baseScale, scaleByDim, scaleByArea));

      finalCanvas = await html2canvas(cloneEl, {
        scale: captureScale,
        width: captureW,
        height: captureH,
        windowWidth: virtualWinW,
        windowHeight: virtualWinH,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        ignoreElements: ignoreFilter
      });
    }

    btnEl.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> <span>파일 생성 중...</span>";
    await new Promise(function(resolve) { setTimeout(resolve, 20); });

    if (!finalBlob && finalCanvas) {
      finalBlob = await canvasToBlobAsync(finalCanvas);
    }

    if (window.Android && typeof window.Android.downloadImage === "function") {
      var base64Data = null;
      if (finalBlob) {
        base64Data = await blobToBase64Async(finalBlob);
      }
      if (!base64Data && finalCanvas) {
        var dataUrl = finalCanvas.toDataURL("image/png");
        base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      }
      if (base64Data) {
        window.Android.downloadImage(base64Data, fileName);
      }
    } else {
      if (finalBlob && finalBlob.size > 1000) {
        var blobUrl = URL.createObjectURL(finalBlob);
        var link = document.createElement("a");
        link.download = fileName;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 20000);
      } else if (finalCanvas) {
        var fallbackUrl = finalCanvas.toDataURL("image/png");
        var fallbackLink = document.createElement("a");
        fallbackLink.download = fileName;
        fallbackLink.href = fallbackUrl;
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        document.body.removeChild(fallbackLink);
      }
    }
  } catch (err) {
    console.error("Summary capture failed:", err);
    alert("이미지 저장 중 오류가 발생했습니다.");
  } finally {
    if (offscreenWrapper && offscreenWrapper.parentNode) {
      offscreenWrapper.parentNode.removeChild(offscreenWrapper);
    }
    btnEl.innerHTML = originalBtnHtml;
    btnEl.style.pointerEvents = "";
  }
}