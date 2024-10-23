var regions = [
  ['전국 시도', 'Korea_upper'], ['전국 시군구', 'Korea_lower'], ['서울시', 'Seoul'], ['경기도', 'Gyeonggi'], ['부산시', 'Busan'], ['대구시', 'Daegu'], ['인천시', 'Incheon'], ['광주시', 'Gwangju'], ['대전시', 'Daejeon'], 
  ['울산시', 'Ulsan'], ['세종시', 'Sejong'], ['강원도', 'Gangwondo'], ['충청북도', 'Chungcheongbukdo'], ['충청남도', 'Chungcheongnamdo'],
  ['전북도', 'Jeollabukdo'], ['전라남도', 'Jeollanamdo'], ['경상북도', 'Gyeongsangbukdo'], ['경상남도', 'Gyeongsangnamdo'], ['제주도', 'Jejudo']
]

var searchingDB = []

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

  if(menu_name == "menu_select_price"){        
    //drawTable(price_index, sido_list, gungu_list); 
    setTimeout(() => drawTable(price_index, sido_list, gungu_list), 300);
  }
  if(menu_name == "menu_select_balanced"){
    //drawTable(balanced_index, sido_list, gungu_list)
    setTimeout(() => drawTable(balanced_index, sido_list, gungu_list), 300);
  }
  if(menu_name == "menu_select_edu"){
    //drawTable(edu_index, sido_list, gungu_list)
    setTimeout(() => drawTable(edu_index, sido_list, gungu_list), 300); 
  }
  if(menu_name == "menu_select_living"){
    //drawTable(living_index, sido_list, gungu_list)
    setTimeout(() => drawTable(living_index, sido_list, gungu_list), 300); 
  }
  if(menu_name == "menu_select_infra"){
    //drawTable(infra_index, sido_list, gungu_list)
    setTimeout(() => drawTable(infra_index, sido_list, gungu_list), 300); 
  }
  if(menu_name == "menu_select_trans"){
    //drawTable(trans_index, sido_list, gungu_list)
    setTimeout(() => drawTable(trans_index, sido_list, gungu_list), 300); 
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
    //$("#exampleModal").modal("hide")
    setTimeout(() => $("#exampleModal").modal("hide"), 500);
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
  if(cl == "CL01"){ min = 0; max = 0.1; indexList = indexData.data[0] }
  if(cl == "CL02"){ min = 0.1; max = 0.5; indexList = indexData.data[1] }
  if(cl == "CL03"){ min = 0.5; max = 1.0; indexList = indexData.data[2] }
  if(cl == "CL04"){ min = 1.0; max = 5.0; indexList = indexData.data[3] }
  if(cl == "CL05"){ min = 5.0; max = 10.0; indexList = indexData.data[4] }
  if(cl == "CL06"){ min = 10.0; max = 20.0; indexList = indexData.data[5] }
  if(cl == "CL07"){ min = 20.0; max = 30.0; indexList = indexData.data[6] }
  if(cl == "CL08"){ min = 30.0; max = 40.0; indexList = indexData.data[7] }
  if(cl == "CL09"){ min = 40.0; max = 50.0; indexList = indexData.data[8] }
  if(cl == "CL10"){ min = 50.0; max = 70.0; indexList = indexData.data[9] }
  if(cl == "CL11"){ min = 70.0; max = 100.0; indexList = indexData.data[10] }

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
      tableHtml += "<td class='fixedCol leftFixed lastCol' scope='row' rowspan=" + dataArr_length + ">상위\n" + min + "~" + max + "%</td>"
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
            tableHtml += "<div class='matched_dong' id='" + id_name  + "' onClick='showRegionInfo(" + findings[k][2] + ")'>" + findings[k][1] + "</div>"
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

function drawDataTable(indexData, sido_list, gungu_list, cl){  
  var indexList = []
  var min = 0
  var max = 0
  if(cl == "CL01"){ min = 0; max = 5.0; indexList = indexData.data[0] }
  if(cl == "CL02"){ min = 5.0; max = 10.0; indexList = indexData.data[1] }
  if(cl == "CL03"){ min = 10.0; max = 15.0; indexList = indexData.data[2] }
  if(cl == "CL04"){ min = 15.0; max = 20.0; indexList = indexData.data[3] }
  if(cl == "CL05"){ min = 20.0; max = 30.0; indexList = indexData.data[4] }
  if(cl == "CL06"){ min = 30.0; max = 40.0; indexList = indexData.data[5] }
  if(cl == "CL07"){ min = 40.0; max = 50.0; indexList = indexData.data[6] }
  if(cl == "CL08"){ min = 50.0; max = 60.0; indexList = indexData.data[7] }
  if(cl == "CL09"){ min = 60.0; max = 70.0; indexList = indexData.data[8] }
  if(cl == "CL10"){ min = 70.0; max = 80.0; indexList = indexData.data[9] }
  if(cl == "CL11"){ min = 80.0; max = 100.0; indexList = indexData.data[10] }

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
      tableHtml += "<td class='fixedCol leftFixed lastCol' scope='row' rowspan=" + dataArr_length + ">상위\n" + min + "~" + max + "%</td>"
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
              tableHtml += "<div class='matched_dong' id='" + id_name  + "' onClick='showRegionInfo(" + findings[k][2] + ")'>" + findings[k][1] + "</div>"              
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
            tableHtml += "<div class='matched_dong' id='" + id_name  + "' onClick='showRegionInfo(" + findings[k][2] + ")'>" + findings[k][1] + "</div>"              
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

function showRegionInfo(index){
  var sido = region_class.data[index]["시도"]
  var gungu = region_class.data[index]["군구"]
  var dong = region_class.data[index]["읍면동"] 
  
  if(menuSelection == "menu_select_price"){
    var percentile = region_class.data[index]["평단가_백분률"]
  }
  if(menuSelection == "menu_select_balanced"){
    var percentile = region_class.data[index]["가치_백분률"]
    var score = region_class.data[index]["가치총점"]
    var selection = "균형"
  }  
  if(menuSelection == "menu_select_edu"){
    var percentile = region_class.data[index]["교육_백분률"]
    var score = region_class.data[index]["교육총점"]
    var selection = "교육"
  }
  if(menuSelection == "menu_select_living"){
    var percentile = region_class.data[index]["주거_백분률"]
    var score = region_class.data[index]["주거총점"]
    var selection = "주거"
  }
  if(menuSelection == "menu_select_infra"){
    var percentile = region_class.data[index]["인프라_백분률"]
    var score = region_class.data[index]["인프라총점"]
    var selection = "인프라"
  }
  if(menuSelection == "menu_select_trans"){
    var percentile = region_class.data[index]["교통_백분률"]
    var score = region_class.data[index]["교통총점"]
    var selection = "교통"
  }

  var complex_num = region_class.data[index]["단지수"]
  var house_num = region_class.data[index]["세대수"]
  var pyeong_price = region_class.data[index]["평단가"]
  var total_amount = region_class.data[index]["총액"]
  cleared_total_amount = Math.round(total_amount) * 100000000

  title = "<span style='font-weight: 600'>" + sido + " " + gungu + " " + dong + "</span>"

  popMsg = "'" + sido + " " + gungu + " " + dong+ "'" + " 정보가 복사되었습니다."

  bodyHtml = ""
  if(isMobile){
    bodyHtml += "<div class='regionTable_m'>"
  }
  else{
    bodyHtml += "<div class='regionTable'>"
  }

  if(menuSelection == "menu_select_price"){
    bodyHtml += "<div class='regionTable_title'>백분위</div>" + "<div class='regionTable_content'>상위 " + setPercentage(percentile) + "</div>"
    bodyHtml += "<div class='regionTable_title'>평균 평단가</div>" + "<div class='regionTable_content'>평당 " + ( Number(pyeong_price.toFixed(0)) ).toLocaleString() + "만원</div>"
    bodyHtml += "<div class='regionTable_title'>단지 수</div>" + "<div class='regionTable_content'>총 " + complex_num.toLocaleString() + "개 단지</div>"
    bodyHtml += "<div class='regionTable_title'>총 세대수</div>" + "<div class='regionTable_content'>총 " + house_num.toLocaleString() + "세대</div>"    
    bodyHtml += "<div class='regionTable_title'>시가 총액</div>" + "<div class='regionTable_content'>약 " + setPrice(cleared_total_amount) + "</div>"
  }
  else{
    bodyHtml += "<div class='regionTable_title'>백분위</div>" + "<div class='regionTable_content'>상위 " + setPercentage(percentile) + "</div>"
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

  if(menuSelection == "menu_select_price"){
    shareTitle = "CityClass 평단가 급지 분석"    
  }
  else{
    shareTitle = "CityClass " + selection + " 급지 분석"
  }
  shareText = shareTitle

  shareText += "\n" + "『" + sido + " " + gungu + " " + dong + "』\n\n"

  shareText += "ㆍ백분위 : 상위 " + setPercentage(percentile) + "\n"

  if(menuSelection != "menu_select_price"){  
    shareText += "ㆍ리얼랭커스 " +  selection + " 점수 : " + score.toFixed(2) + "점\n"
  }
  shareText += "ㆍ평균 평단가 : 평당 " + ( Number(pyeong_price.toFixed(0)) ).toLocaleString() + "만원\n"
  shareText += "ㆍ단지 수 : 총 " + complex_num.toLocaleString() + "개 단지\n"
  shareText += "ㆍ총 세대수 : 총 " + house_num.toLocaleString() + "세대\n"
  shareText += "ㆍ시가 총액 : 약 " + setPrice(cleared_total_amount) + "\n\n"
  shareText += "https://www.realrankus.com/cityclass\npowered by 리얼랭커스"  
  
  if(isMobile){
    bodyHtml += "<div class='regionShare_m'>"
  }
  else{
    bodyHtml += "<div class='regionShare'>"
  }
  bodyHtml += "<div></div><div id='share1'></div><div id='share2'></div>"
  bodyHtml += "</div>"

  var sidoLink = region_class.data[index]["sido_link"]
  var gunguLink = region_class.data[index]["gungu_link"]
  var RealRankusLink = "https://www.realrankus.com?reg=" + sidoLink + "&sub=" + gunguLink + "&mon=" + currentMonth
  if(isMobile){
    var RealRankusBizLink = "https://www.realrankus.com/biz/index_m.html?reg=" + sidoLink + "&sub=" + gunguLink
  }
  else{
    var RealRankusBizLink = "https://www.realrankus.com/biz?reg=" + sidoLink + "&sub=" + gunguLink
  }

  footerHtml = ""
  footerHtml += "<div class='footer_wrapper'>"
  footerHtml += "<div class='goRankus' onClick='openExternalLink(\"" +  RealRankusLink + "\")'>" + gungu + " 아파트 분석 보기</div>"
  footerHtml += "<div class='goRankusBiz' onClick='openExternalLink(\"" +  RealRankusBizLink + "\")'>" + gungu + " 시장 분석 보기</div>"
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

  if(isMobile){
    $(".footer_wrapper").css({'padding-left': "20px", 'padding-right': "20px"}) 
    $("#infoModal_m").modal('show')
  }
  else{
    $("#infoModal").modal('show')
  }  
}

function setPercentage(percent){
  return_val = ""
  if(percent < 0.0001){
    return_val = "0.0001% 보다 작음"
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

        var addon_html = "<div class='searchedListBox' onClick='goScroll(" + regionIndex + ")'>";
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
    if(treemap_data[i]['Upper_region'] == "Jeollanamdo"){
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
  if(current_selection == "Jeollanamdo"){ cost_data = cost_region_arr[15]; cost_sum = cost_treemap.data[14]['Sum']; cost_delta = cost_treemap.data[14]['Sum_delta'] }
  if(current_selection == "Gyeongsangbukdo"){ cost_data = cost_region_arr[16]; cost_sum = cost_treemap.data[15]['Sum']; cost_delta = cost_treemap.data[15]['Sum_delta'] }
  if(current_selection == "Gyeongsangnamdo"){ cost_data = cost_region_arr[17]; cost_sum = cost_treemap.data[16]['Sum']; cost_delta = cost_treemap.data[16]['Sum_delta'] }
  if(current_selection == "Jejudo"){ cost_data = cost_region_arr[18]; cost_sum = cost_treemap.data[17]['Sum']; cost_delta = cost_treemap.data[17]['Sum_delta'] }
  
  console.log("scr_width", scr_width)
  console.log("scr_height", scr_height)
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
              console.log(ctx.raw)              
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
  //alpha = (1 + Math.log(percentage * 200)) / 5;
  var color_r = 179
  var color_g = 19
  var color_b = 19

  alpha = percentage + 0.7

  //converted_r = color_r * (alpha)
  //converted_g = color_g * (alpha)
  //converted_b = color_b * (alpha)

  return "rgba(" + color_r + "," + color_g + "," + color_b + "," + alpha + ")"
}