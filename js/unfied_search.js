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
    console.log(selectedSubRegion)    
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
        //var code = internalSearching[i]["검색코드"]

        var addon_html = "<div class='searchedListBox' onClick='internalSearchingUpdate(" + i + ")'>";
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
  unifiedInput = $('#inputUnifiedSearch').val()
  if(unifiedInput.length >= 2){
    for(var i = 0 ; i < searchingData.data.length ; i++){
      var aptName = searchingData.data[i]["아파트명"]
      var searchName = searchingData.data[i]["아파트명"] + " " + searchingData.data[i]["법정동주소"]

      if(searchName.indexOf(unifiedInput) >= 0){
        var aptName = searchingData.data[i]["아파트명"]
        var aptAddress = searchingData.data[i]["법정동주소"]
        var code = searchingData.data[i]["검색코드"]
        var sido = searchingData.data[i]["sido"]
        var gungu = searchingData.data[i]["gungu"]

        var addon_html = "<div class='searchedListBox' onClick='searchingUpdate(\"" + code + "\",\"" + sido + "\",\"" + gungu + "\")'>";
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

    $('#searchingBox').append("<div style='height: 3em'></div>");
    //$('html').scrollTop(0)
  }
  else{      
    var addon_html = "<div style='font-size: 0.9em; font-weight: 600; text-align:center; padding-top: 30px'>빠른 검색 속도를 위해 <br> 두 글자 이상부터 검색할 수 있도록 해 두었어요!<br></div>"
    $('#searchingBox').append(addon_html);
  }
}

var searched_code = ""
//var title_loading_html = "<div class='popupTitle'><h1 style='font-size: 1em; font-weight: 600'>데이터를 불러오고 있어요!</h></div>";
function searchingUpdate(code, sido, gungu){
  $('#searchingBox').hide()
  $("#baseModal").modal("hide")
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
  updateRegion()

  setTimeout(function(){    
    $("#baseModal").modal("show")
  }, 500)
}

function internalSearchingUpdate(index){
  $('#searchingBox').hide()
  $("#baseModal").modal("hide")
  removeMarkers()
  defaultMap.setZoom(17)
  showDetail(index)
  closeUnifiedSearch()  

  setTimeout(function(){    
    $("#baseModal").modal("show")
  }, 500)
}