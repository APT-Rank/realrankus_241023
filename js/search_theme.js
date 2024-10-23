  function showAptSearchBar(){    
    //$("#searchCard").slideDown();    
    $("#searchCard").animate({
      opacity: 1.0,
      top: '0'
    }, 400, 'easeOutQuad'
    );
    $("#closeSearch_floating").animate({
      opacity: 1.0,
      right: '5'
    }, 700, 'easeOutQuad'
    );

    $('#inputSearch').focus();

    var searchNotice = "'" + $('#sido option:selected').text() + " " + $('#gungu option:selected').text() + "' " + $("#theme option:selected").html();
    $('#searchNotice').html(searchNotice)
  }

  function closeSearch(){    
    $("#searchCard").animate({
      opacity: 0.0,
      top: '-150px'
    }, 400, 'easeInQuad'
    );
    $("#closeSearch_floating").animate({
      opacity: 0.0,
      right: '-200px'
    }, 400, 'easeInQuad'
    );
    $('#inputSearch').val("")    
    aptSearch()
  }
  
  var input = ""
  function checkPrice(last_sales){    
    if(minValue == 0 && maxValue == 60){
      return true
    }
    else if(last_sales >= minValue/2*10000 && last_sales <= maxValue/2*10000){
      return true
    }
    else{
      return false
    }
  }

  function aptSearch(){
    $('#themeDataList').html("");
    input = $('#inputSearch').val()

    //광고정보 표시영역
    if(partData.data.length > 0 && (today_num >= part_sDate_Num && today_num <= part_eDate_Num) ){
      part_title = partData.data[0]['shop_name'] 
      gtag('event','파트너쉽노출', { 'event_category' : 'View_Partnership', 'event_label' : "리얼랭커스," + today_str + "," + part_title + ",뷰,파트너쉽"});
      if(part_type == 'Direct'){
        $('#themeDataList').append(part_info);
        $('.partBox').click(function(){
          gtag('event','파트너쉽선택', { 'event_category' : 'Click_Partnership', 'event_label' : "리얼랭커스," + today_str + "," + part_title + ",클릭,파트너쉽"});
          if(checkMobile() == "ios"){
            window.location.href = page_url
          }
          else{
            window.open(page_url)
          }
        })
      }
      if(part_type == 'Pop'){
        $('#themeDataList').append(part_pop);
      }
      
      $('#partSub1').html(sub_title)
      $('#partTitle').html(part_main_title)
      if(sub_comment == ""){
        $('#partInfo').html(cell_num_with_pyphen + " / " + phone_num_with_pyphen)
      }
      else{
        $('#partInfo').html(sub_comment)
      }
      $('#partImage').html("<img src='../ad/image/" + img_url + "' height='58px' style='border-radius:10px'>")
    }
    else{
      $('#themeDataList').append(part_default);
      $('.partBox').css({'grid-template-columns':'1fr'})
    }

    for(var i = 0 ; i < sortData.data.length ; i++){
          var aptName = sortData.data[i]["아파트명"]
          var searchName = sortData.data[i]["아파트명"] + " " + sortData.data[i]["법정동주소"] + " " + sortData.data[i]["매매타입"]

          if(searchName.indexOf(input) >= 0){
            
            var aptName = sortData.data[i]["아파트명"]
            var apt_m = sortData.data[i]["전용면적(m2)"]
            var apt_p = sortData.data[i]["전용면적(평)"]
            var apt_type = sortData.data[i]["타입"]
            var aptAddress = sortData.data[i]["법정동주소"]          
            var house_num = sortData.data[i]["세대수"]
            var aptDuration = sortData.data[i]["준공년차"]
            var buildDate = sortData.data[i]["준공년월"]
            var searchCode = sortData.data[i]["코드"]
            var coord_y = sortData.data[i]["y"]
            var coord_x = sortData.data[i]["x"]
            if(selectedTheme == "hPriceRatio"){
              var hPrice_info = sortData.data[i]["최고가정보"]
            }
            if(selectedTheme == "ratioFrom202107"){
              var hPrice_info = sortData.data[i]["2021년7월가격"]
            }
            var cPrice_info = sortData.data[i]["현재가정보"]
            var gap_price = sortData.data[i]["차액"]
            var gap_ratio = sortData.data[i]["등락률"]

            if(apt_type == "APT"){        
              aptYear = buildDate + " (" + aptDuration + "년차)"        
            }
            if(apt_type == "JGC"){        
              aptYear = buildDate + " (" + aptDuration + "년차, 재건축)"        
            }
            if(apt_type == "ABYG"){
              aptYear = "(분양권, " + buildDate.substr(0, 7) + " 예정)"        
            }
      
            var addon_html = ""
      
            if(hPrice_info[0] != '거래 정보 없음'){
              addon_html += "<div class='themeListBox' data-bs-toggle='modal' data-bs-target='#exampleModal' id='myModal' onClick='showDetail(" + i + ")'>";
              addon_html += "<div class='content'>";
              addon_html += "<div>";
                addon_html += "<div class='searched_apt_name'>" + aptName + "</div>";
                addon_html += "<div class='aptYear' style='font-weight: 600; font-size: 0.65em'>" + aptYear + "</div>";
              addon_html += "</div>";
              addon_html += "<div class='searched_apt_info'>"+ house_num.toLocaleString() + "세대 / ";
      
              if(apt_type == "ABYG"){
                aptAddress = sortData.data[i]["법정동주소"]
                addon_html += aptAddress + "</div>";
              }
              else{
                addon_html += aptAddress + "</div>";
              }
              var hPrice = (hPrice_info[0]/10000).toFixed(2)
              var cPrice = (cPrice_info[0]/10000).toFixed(2)
              var hPrice_date = hPrice_info[1].substr(2, 10)
              var cPrice_date = cPrice_info[1].substr(2, 10)        
              
              if(gap_ratio < 0){        
                addon_html += "<div class='themeDrop'>▼" + Math.abs(gap_ratio).toFixed(2) + "% (" + (gap_price/10000).toFixed(2) +"억) <span style='color:#555'> / " + apt_p + "(" + apt_m + "㎡)</span></div>";
              }
              else{
                addon_html += "<div class='themePoint'>▲" + Math.abs(gap_ratio).toFixed(2) + "% (" + (gap_price/10000).toFixed(2) +"억) <span style='color:#555'> / " + apt_p + "(" + apt_m + "㎡)</span></div>";
              }
              addon_html += "<div class='themeInfo'>" + hPrice + "억 (" + hPrice_date + ") → " + cPrice + "억 (" + cPrice_date +")</div>";
      
              addon_html += "</div>";
              addon_html += "<div id='NLink'><button type='button' class='goThemeLink' onclick='openNaver(" + searchCode + ")'>N부동산</button></div>"        
      
              if(i < 5){
                if (i == 0){
                  shareText += "'" + $('#sido option:selected').text() + " " + $('#gungu option:selected').text() + "' " + "최고가 대비 변동\n\n"
                }
                shareText += "#" + aptName + ", " + apt_p + "\n"
                shareText += hPrice + " → " + cPrice + "억\n"
                shareText += "(" + gap_ratio.toFixed(2) + "%, " + (gap_price/10000).toFixed(2) + "억) \n\n"          
              }
              
              $('#themeDataList').append(addon_html);
            }
          }
        }

      $(".searched_apt_name:contains('" + input + "')").each(function(){
        var regex = new RegExp(input, 'gi')
        $(this).html( $(this).text().replace(regex, "<span class='colorTxt'>"+input+"</span>") );
      })
      $(".searched_apt_info:contains('" + input + "')").each(function(){
        var regex2 = new RegExp(input, 'gi')
        $(this).html( $(this).text().replace(regex2, "<span class='colorTxt'>"+input+"</span>") );
      })
      
      $('#themeDataList').append("<div style='height: 3em'></div>");
      $('html').scrollTop(0)
  }

  function closeRegionSearch(){    
    $("#regionSearchCard").animate({
      opacity: 0.0,
      top: '-150px'
    }, 400, 'easeInQuad'
    );
    $("#closeRegionSearch_floating").animate({
      opacity: 0.0,
      right: '-200px'
    }, 400, 'easeInQuad'
    );
    $('#regionInputSearch').val("")    
    regionSearch()
  }