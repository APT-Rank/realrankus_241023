function goSearchBySearchType(){
  if(selectedRegion == "Korea"){
    $("#searchingBox").css({'top':'96px'})
  }
  else{
    $("#searchingBox").css({'top':'115px'})
  }
  
  if(searchType == "global"){
    unifiedAptSearch()    
  }
  if(searchType == "local"){
    if(selectedSubRegion == "1000000000_Korea"){      
      regionSearch()
    }
    else if(selectedSubRegion == "Living_Top300" || selectedSubRegion == "Trans_Top300" || selectedSubRegion == "Infra_Top300" || selectedSubRegion == "Edu_Top300" || selectedSubRegion == "Balanced_Top300"){      
      topAptSearch()
    }
    else{      
      aptSearch2()
    }      
  }
}

function showUnifiedSearchBar(){  
  showUnifiedAptSearchBar()
}

function showUnifiedAptSearchBar(){  
  $("#baseModal").css({'width' : '600px'})
  //$("#searchCard").slideDown();    
  $("#unifiedSearchCard").animate({
    opacity: 1.0,
    top: '0'
  }, 400, 'easeOutQuad'
  );
  $("#closeUnifiedSearch_floating").animate({
    opacity: 1.0,
    right: '5'
  }, 700, 'easeOutQuad'
  );
  $('#inputUnifiedSearch').focus();

  var addon_html = "<div style='font-size: 0.9em; font-weight: 600; text-align:center; padding-top: 30px'>빠른 검색 속도를 위해 <br> 두 글자 이상부터 검색할 수 있도록 해 두었어요!<br></div>"
  addon_html += "<div id='recent_search_box'>최근검색</div>"

  if(recent_search.length > 0){    
    for(var i = 0 ; i < recent_search.length ; i++){
      addon_html += "<div class='recentListBox'>";
      addon_html += "<div class='recentListBox_complex' onClick='searchingUpdate(\"" + recent_search[i][0] + "\",\"" + recent_search[i][1] + "\",\"" + recent_search[i][2] + "\",\"" + recent_search[i][3] + "\",\"" + recent_search[i][4] + "\")'>"
        addon_html += "<div class='searched_apt_name'>" + recent_search[i][3] + "</div>"
        addon_html += "<div class='searched_apt_info'>" + recent_search[i][4] + "</div>"
        addon_html += "<div class='searched_apt_date'>" + recent_search[i][5] + "에 검색</div>"
      addon_html += "</div>"
      addon_html += "<div class='deleteRecent' onClick='removeRecent( + \"" + i + "\")'><i class='fa-solid fa-circle-xmark'></i></div>"
      addon_html += "</div>"
    }
  }

  $('#searchingBox').html("");
  $('#searchingBox').append(addon_html);
  $("#searchingBox").show()
}

function removeRecent(index){
  recent_search.splice(index, 1)
  save_recent_to_LocalStorage(recent_search)

  var addon_html = "<div style='font-size: 0.9em; font-weight: 600; text-align:center; padding-top: 30px'>빠른 검색 속도를 위해 <br> 두 글자 이상부터 검색할 수 있도록 해 두었어요!<br></div>"
  addon_html += "<div id='recent_search_box'>최근검색</div>"

  if(recent_search.length > 0){    
    for(var i = 0 ; i < recent_search.length ; i++){
      addon_html += "<div class='recentListBox'>";
      addon_html += "<div class='recentListBox_complex'  onClick='searchingUpdate(\"" + recent_search[i][0] + "\",\"" + recent_search[i][1] + "\",\"" + recent_search[i][2] + "\",\"" + recent_search[i][3] + "\",\"" + recent_search[i][4] + "\")'>"
        addon_html += "<div class='searched_apt_name'>" + recent_search[i][3] + "</div>"
        addon_html += "<div class='searched_apt_info'>" + recent_search[i][4] + "</div>"
        addon_html += "<div class='searched_apt_date'>" + recent_search[i][5] + "에 검색</div>"
      addon_html += "</div>"
      addon_html += "<div class='deleteRecent' onClick='removeRecent( + \"" + i + "\")'><i class='fa-solid fa-circle-xmark'></i></div>"
      addon_html += "</div>"
    }
  }

  $('#searchingBox').html("");
  $('#searchingBox').append(addon_html);
  $("#searchingBox").show()
}

function closeUnifiedSearch(){
  $("#unifiedSearchCard").animate({
    opacity: 0.0,
    top: '-150px'
  }, 400, 'easeInQuad'
  );
  $("#closeUnifiedSearch_floating").animate({
    opacity: 0.0,
    right: '-200px'
  }, 400, 'easeInQuad'
  );
  $('#inputUnifiedSearch').val("")
  $('#inputUnifiedSearch').blur();
  $('#searchingBox').hide()
  //updateRegion()
}

function aptSearch2(){
  $('#searchingBox').html("");
  unifiedInput = $('#inputUnifiedSearch').val()

  if(unifiedInput.length >= 1){
    for(var i = 0 ; i < internalSearching.length ; i++){
      var aptName = internalSearching[i]["아파트명"]
      var searchName = internalSearching[i]["아파트명"]// + " " + internalSearching[i]["법정동주소"]

      if(searchName.indexOf(unifiedInput) >= 0){
        var aptName = internalSearching[i]["아파트명"]
        var aptAddress = internalSearching[i]["법정동주소"]        
        var code = internalSearching[i]["검색코드"]
        var sido = internalSearching[i]["시도"]
        var gungu = internalSearching[i]["군구"]        

        var addon_html = "<div class='searchedListBox' onClick='internalSearchingUpdate(\"" + i + "\", \"" + code + "\",\"" + sido + "\",\"" + gungu + "\",\"" + aptName + "\",\"" + aptAddress + "\")'>";        
        addon_html += "<div class='searched_apt_name'>" + aptName + "</div>"
        addon_html += "<div class='searched_apt_info'>" + aptAddress + "</div>";
        addon_html += "</div>"

        //$('#dataList').append(addon_html);
        $('#searchingBox').append(addon_html);
        $('#searchingBox').show()
      }
      $(".searched_apt_name:contains('" + unifiedInput + "')").each(function(){
        var regex = new RegExp(unifiedInput, 'gi')
        $(this).html( $(this).text().replace(regex, "<span class='colorTxt'>"+unifiedInput+"</span>") );
      })
      /*
      $(".searched_apt_info:contains('" + unifiedInput + "')").each(function(){
        var regex2 = new RegExp(unifiedInput, 'gi')
        $(this).html( $(this).text().replace(regex2, "<span class='colorTxt'>"+unifiedInput+"</span>") );
      })
      */    
      //$('html').scrollTop(0)
    }
    $('#searchingBox').append("<div style='height: 3em'></div>");
  }
}
  
var unifiedInput = ""
function unifiedAptSearch(){
  //$('#dataList').html("");
  $('#searchingBox').html("");
  unifiedInput_base = $('#inputUnifiedSearch').val()
  unifiedInput = unifiedInput_base.trim()

  unifiedInput_arr = []
  unifiedInput_arr_base = unifiedInput.split(" ")
  
  if(unifiedInput_arr_base.length == 1){
    unifiedInput_arr[0] = unifiedInput_arr_base[0]
  }
  else if(unifiedInput_arr_base.length == 2){
    unifiedInput_arr[0] = unifiedInput_arr_base[0]
    unifiedInput_arr[1] = unifiedInput_arr_base[1]
  }
  else{    
    inputStr = ""
    for(var k = 1; k < unifiedInput_arr_base.length ; k++){
      inputStr += unifiedInput_arr_base[k]
    }
    unifiedInput_arr[0] = unifiedInput_arr_base[0]
    unifiedInput_arr[1] = inputStr    
  }

  if(unifiedInput.length >= 2){
      if(unifiedInput_arr.length == 1){
        for(var i = 0 ; i < searchingData.data.length ; i++){
          var aptName = searchingData.data[i]["아파트명"]
          var searchName = searchingData.data[i]["아파트명"] + " " + searchingData.data[i]["법정동주소"]

          if(searchName.indexOf(unifiedInput) >= 0){
            var aptName = searchingData.data[i]["아파트명"]
            var aptAddress = searchingData.data[i]["법정동주소"]
            var code = searchingData.data[i]["검색코드"]
            var sido = searchingData.data[i]["sido"]
            var gungu = searchingData.data[i]["gungu"]

            var addon_html = "<div class='searchedListBox' onClick='searchingUpdate(\"" + code + "\",\"" + sido + "\",\"" + gungu + "\",\"" + aptName + "\",\"" + aptAddress + "\")'>";
            addon_html += "<div class='searched_apt_name'>" + aptName + "</div>"
            addon_html += "<div class='searched_apt_info'>" + aptAddress + "</div>";
            addon_html += "</div>"

            //$('#dataList').append(addon_html);
            $('#searchingBox').append(addon_html);
            $('#searchingBox').show()
          }
        }
        $(".searched_apt_name:contains('" + unifiedInput + "')").each(function(){
          var regex = new RegExp(unifiedInput, 'gi')
          $(this).html( $(this).text().replace(regex, "<span class='colorTxt'>"+unifiedInput+"</span>") );
        })
        $(".searched_apt_info:contains('" + unifiedInput + "')").each(function(){
          var regex2 = new RegExp(unifiedInput, 'gi')
          $(this).html( $(this).text().replace(regex2, "<span class='colorTxt'>"+unifiedInput+"</span>") );
        })
      }
      else{
        for(var i = 0 ; i < searchingData.data.length ; i++){
          var aptName = searchingData.data[i]["아파트명"]
          var searchName = searchingData.data[i]["아파트명"] + " " + searchingData.data[i]["법정동주소"]

          if(searchName.indexOf(unifiedInput_arr[0]) >= 0 && searchName.indexOf(unifiedInput_arr[1]) >= 0){
            
            var aptName = searchingData.data[i]["아파트명"]
            var aptAddress = searchingData.data[i]["법정동주소"]
            var code = searchingData.data[i]["검색코드"]
            var sido = searchingData.data[i]["sido"]
            var gungu = searchingData.data[i]["gungu"]            

            var addon_html = "<div class='searchedListBox' onClick='searchingUpdate(\"" + code + "\",\"" + sido + "\",\"" + gungu + "\",\"" + aptName + "\",\"" + aptAddress + "\")'>";
            addon_html += "<div class='searched_apt_name'>" + aptName + "</div>"
            addon_html += "<div class='searched_apt_info'>" + aptAddress + "</div>";
            addon_html += "</div>"

            //$('#dataList').append(addon_html);
            $('#searchingBox').append(addon_html);
            $('#searchingBox').show()
          }
        }

        $(".searched_apt_name:contains('" + unifiedInput_arr[0] + "')" + "," + ".searched_apt_name:contains('" + unifiedInput_arr[1] + "')").each(function(){
          var regex3 = new RegExp(unifiedInput_arr[0], 'gi')
          var regex4 = new RegExp(unifiedInput_arr[1], 'gi')          
          $(this).html( $(this).text().replace(regex3, "<span class='colorTxt'>"+unifiedInput_arr[0]+"</span>").replace(regex4, "<span class='colorTxt'>"+unifiedInput_arr[1]+"</span>"))          
        })

        $(".searched_apt_info:contains('" + unifiedInput_arr[0] + "')" + "," + ".searched_apt_info:contains('" + unifiedInput_arr[1] + "')").each(function(){
          var regex5 = new RegExp(unifiedInput_arr[0], 'gi')
          var regex6 = new RegExp(unifiedInput_arr[1], 'gi')
          $(this).html( $(this).text().replace(regex5, "<span class='colorTxt2'>"+unifiedInput_arr[0]+"</span>").replace(regex6, "<span class='colorTxt2'>"+unifiedInput_arr[1]+"</span>"))
        })
      }
    $('#searchingBox').append("<div style='height: 3em'></div>");

  }
  else{      
    var addon_html = "<div style='font-size: 0.9em; font-weight: 600; text-align:center; padding-top: 30px'>빠른 검색 속도를 위해 <br> 두 글자 이상부터 검색할 수 있도록 해 두었어요!<br></div>"
    addon_html += "<div id='recent_search_box'>최근검색</div>"

    if(recent_search.length > 0){    
      for(var i = 0 ; i < recent_search.length ; i++){
        addon_html += "<div class='recentListBox'>";
        addon_html += "<div class='recentListBox_complex'  onClick='searchingUpdate(\"" + recent_search[i][0] + "\",\"" + recent_search[i][1] + "\",\"" + recent_search[i][2] + "\",\"" + recent_search[i][3] + "\",\"" + recent_search[i][4] + "\")'>"
          addon_html += "<div class='searched_apt_name'>" + recent_search[i][3] + "</div>"
          addon_html += "<div class='searched_apt_info'>" + recent_search[i][4] + "</div>"
          addon_html += "<div class='searched_apt_date'>" + recent_search[i][5] + "에 검색</div>"
        addon_html += "</div>"
        addon_html += "<div class='deleteRecent' onClick='removeRecent( + \"" + i + "\")'><i class='fa-solid fa-circle-xmark'></i></div>"
        addon_html += "</div>"
      }
    }
    $('#searchingBox').html("");
    $('#searchingBox').append(addon_html);  
  }
}

var searched_code = ""

function save_recent_to_LocalStorage(recent_search) {
  recent_search_json = JSON.stringify(recent_search)
  localStorage.setItem("recentSearch", recent_search_json);
}

//var title_loading_html = "<div class='popupTitle'><h1 style='font-size: 1em; font-weight: 600'>데이터를 불러오고 있어요!</h></div>";
function searchingUpdate(code, sido, gungu, aptName, aptAddress){
  $('#searchingBox').hide()
  $("#baseModal").modal("hide")

  var searchingDate = new Date()
  var searchingY = searchingDate.getFullYear()
  var searchingM = searchingDate.getMonth() + 1
  var searchingD = searchingDate.getDate()
  var searchingH = searchingDate.getHours()
  var searchingMm = searchingDate.getMinutes()
  searchingDateStr = (searchingY.toString()).substring(2, 4) + "년 " + searchingM + "월 " + searchingD + "일, " + searchingH + "시 " + searchingMm + "분"

  //최근검색에 하나도 없으면 바로 최금 검색 저장
  if(recent_search.length == 0){
    recent_search.unshift([code, sido, gungu, aptName, aptAddress, searchingDateStr])
  }
  else{    
    if(recent_search[0][0] != code){
      //최근검색단지는 최대 10개 표시
      //10개가 넘어가면 배열 앞에서 부터 채움      

      if(recent_search.length == 10){    
        recent_search.unshift([code, sido, gungu, aptName, aptAddress, searchingDateStr])
        recent_search.pop()
      }
      else{
        recent_search.unshift([code, sido, gungu, aptName, aptAddress, searchingDateStr])
      }
      //최근검색단지는 LocalStorage에 저장      
    }
    //마지막 검색과 현재 검색이 동일하면 최근 검색으로 대체
    else{
      recent_search.shift()
      recent_search.unshift([code, sido, gungu, aptName, aptAddress, searchingDateStr])            
    }
    save_recent_to_LocalStorage(recent_search)
  }

  removeMarkers()
  defaultMap.setZoom(17)
  
  //$('body').append("<div id='pageLoadingBack'><div class='spinner-grow text-pageLoading' role='status'></div><div id='loadingInfo' style='font-size: 0.85em; color: white'><br>검색 정보를 불러오고 있어요~!</div></div>")
  searched_code = code  
  selectedRegion = sido
  selectedSubRegion = gungu
  $("#sido").val(sido).prop("selected", true);  
  sortSelection = "sortDefault"  
  optionChange(selectedSubRegion)
  closeUnifiedSearch()  

  setTimeout(function(){    
    updateRegion()
    $("#baseModal").modal("show")
  }, 500)
}

function internalSearchingUpdate(index, code, sido, gungu, aptName, aptAddress){
  $('#searchingBox').hide()
  $("#baseModal").modal("hide")

  var searchingDate = new Date()
  var searchingY = searchingDate.getFullYear()
  var searchingM = searchingDate.getMonth() + 1
  var searchingD = searchingDate.getDate()
  var searchingH = searchingDate.getHours()
  var searchingMm = searchingDate.getMinutes()
  searchingDateStr = (searchingY.toString()).substring(2, 4) + "년 " + searchingM + "월 " + searchingD + "일, " + searchingH + "시 " + searchingMm + "분"

  //최근검색에 하나도 없으면 바로 최금 검색 저장
  if(recent_search.length == 0){
    recent_search.unshift([code, sido, gungu, aptName, aptAddress, searchingDateStr])
  }
  else{    
    if(recent_search[0][0] != code){
      //최근검색단지는 최대 10개 표시
      //10개가 넘어가면 배열 앞에서 부터 채움      

      if(recent_search.length == 10){    
        recent_search.unshift([code, sido, gungu, aptName, aptAddress, searchingDateStr])
        recent_search.pop()
      }
      else{
        recent_search.unshift([code, sido, gungu, aptName, aptAddress, searchingDateStr])
      }
      //최근검색단지는 LocalStorage에 저장      
    }
    //마지막 검색과 현재 검색이 동일하면 최근 검색으로 대체
    else{
      recent_search.shift()
      recent_search.unshift([code, sido, gungu, aptName, aptAddress, searchingDateStr])            
    }
    save_recent_to_LocalStorage(recent_search)
  }

  removeMarkers()
  defaultMap.setZoom(17)
  showDetail(index)
  closeUnifiedSearch()  

  setTimeout(function(){    
    $("#baseModal").modal("show")
  }, 500)
}