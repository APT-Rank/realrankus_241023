function shortRegionName(rName){
  split_rName = rName.split(" ")
  if(split_rName[1] == "성남시" || split_rName[1] == "안양시" || split_rName[1] == "안산시" || split_rName[1] == "고양시" || split_rName[1] == "수원시" || split_rName[1] == "용인시"
  || split_rName[1] == "청주시" || split_rName[1] == "전주시" | split_rName[1] == "포항시" || split_rName[1] == "창원시" || split_rName[1] == "천안시"){
    return split_rName[1] + " " + split_rName[2]
  }
  else if(split_rName[1] == "세종시"){
    return split_rName[1]
  }
  else if(split_rName[0] == "전국"){
    if(selectedSubRegion == "Living_Top300"){
      return "주거 TOP300"
    }
    else if(selectedSubRegion == "Trans_Top300"){
      return "교통 TOP300"        
    }
    else if(selectedSubRegion == "Infra_Top300"){
      return "인프라 TOP300"        
    }
    else if(selectedSubRegion == "Edu_Top300"){
      return "교육 TOP300"        
    }
    else if(selectedSubRegion == "Balanced_Top300"){
      return "균형 TOP300"        
    }
    else{
      return "시군구"
    }
  }
  else {
    return rName      
  }
}

function showSearchBar(){
  if(selectedRegion=="Korea" && selectedSubRegion=="1000000000_Korea" && searchType == "local"){
    $("#unifiedSearchExample").html("예) 강남, 분당, 수지, 해운대");
  }
  else{
    $("#unifiedSearchExample").html("예) 서초동, 래미안, 힐스테이트, 주공");
  }

  if(selectedMonth >= 202211){
    showUnifiedSearchBar()
  }
  else{
    if(selectedSubRegion == "1000000000_Korea"){
      showRegionSearchBar()
    }
    else{
      showAptSearchBar()
    }
  }
}
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

    var searchNotice = "'" + $('#sido option:selected').text() + " " + $('#gungu option:selected').text() + "' 내에서 검색합니다"
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

    if(selectedSubRegion == "Living_Top300" || selectedSubRegion == "Trans_Top300"  || selectedSubRegion == "Infra_Top300" || selectedSubRegion == "Edu_Top300" || selectedSubRegion == "Balanced_Top300"){
      topAptSearch()
    }
    else{
      aptSearch()
    }   
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
    if(selectedSubRegion == "Living_Top300" || selectedSubRegion == "Trans_Top300"  || selectedSubRegion == "Infra_Top300" || selectedSubRegion == "Edu_Top300" || selectedSubRegion == "Balanced_Top300"){
      topAptSearch()
    }
    else{
      $('#dataList').html("");
      if(selectedMonth >= 202211){
        input = $('#inputUnifiedSearch').val()
      }
      else{
        input = $('#inputSearch').val()
      }

      //광고정보표시
      show_partnership();

      //동 DB 만들기
      $("#dataList").append("<div class='dong_selector'><div id='dong_list'></div></div>")
      /*
      dongDB = []
      for (var j = 0; j < itemNum; j++){          
        var split_addr = (aptData.data[j]["법정동주소"]).split(" ")
        var dong_name = split_addr[2]
        if(split_addr[0] == "경기도" || split_addr[0] == "충청남도" || split_addr[0] == "충청북도" || split_addr[0] == "전라북도" || split_addr[0] == "경상북도"  || split_addr[0] == "경상남도"){
          if(split_addr[1] == "고양시" || split_addr[1] == "안양시" || split_addr[1] == "안산시" || split_addr[1] == "수원시" || split_addr[1] == "용인시" || split_addr[1] == "성남시"
              || split_addr[1] == "천안시" || split_addr[1] == "청주시" || split_addr[1] == "전주시" || split_addr[1] == "포항시" || split_addr[1] == "창원시"){
            dong_name = split_addr[3]
          }
        }
        dongDB.push(dong_name)

        //동 이름 중복 제거
        var filtered_dongDB = dongDB.filter((element, index) => {
          return dongDB.indexOf(element) === index;
        });
        filtered_dongDB = filtered_dongDB.sort()
        filtered_dongDB.unshift("전체")          
      }        
      dongDB = []
      //동DB에 인덱스 포함해서 저장
      for (var dongIndex = 0 ; dongIndex < filtered_dongDB.length ; dongIndex++){
        dongDB.push([filtered_dongDB[dongIndex], dongIndex])
      }
      */

      if(window.innerWidth <= 800){
        dong_cell_width = (window.innerWidth/4) * (7/8)
        btn_width = (dong_cell_width-10) + "px"
      }
      else{
        dong_cell_width = 90
      }

      var columns = "repeat(" + dongDB.length + ", " + dong_cell_width + "px)"
      $("#dong_list").css({"grid-template-columns" : columns})

      var dong_list_html = ""
      for (var dongIndex = 0 ; dongIndex < dongDB.length ; dongIndex++){
        selection_id = 'dong_' + dongDB[dongIndex][1]
        dong_list_html += "<div><input type='radio' class='btnRadio_tab' name='dong_select' autocomplete='off' id=" + selection_id + " onClick='dong_filter(this)'><label class='btn btn-outline-danger' id='dong_select_" + dongDB[dongIndex][1] + "' for='" + selection_id + "'>#" + dongDB[dongIndex][0] + "</label></div>"                                                
      }
      $("#dong_list").html(dong_list_html)
      $("#dong_0").prop('checked', true)

      selector_width = $(".dong_selector").width()
      inner_width = dong_cell_width * dongDB.length     

      if(isMobile){
        $(".dong_selector").css({'height':'37px'})
        //$("#dataList").css({'padding-top':'155px'})
        $(".btnRadio_tab+label").css({"width" : btn_width})
      }
      else{
        if(selector_width < inner_width){
          $(".dong_selector").css({'height':'50px'})
          //$("#dataList").css({'padding-top':'170px'})
        }
        else{
          $(".dong_selector").css({'height':'37px'})
          //$("#dataList").css({'padding-top':'155px'})
        }          
      }        
      //동 DB 생성 완료

      if(sortSelection == "sortDefault"){
        sortData = aptData
      }

      internalSearching = []

      for(var i = 0 ; i < sortData.data.length ; i++){        
            var aptName = sortData.data[i]["아파트명"]
            var searchName = sortData.data[i]["아파트명"] + " " + sortData.data[i]["법정동주소"] + " " + sortData.data[i]["매매타입"]

            internalSearching[i] = {"아파트명" : sortData.data[i]["아파트명"], "법정동주소":sortData.data[i]["법정동주소"], "검색코드":sortData.data[i]["검색코드"]}

            if(searchName.indexOf(input) >= 0){              
              var aptName = sortData.data[i]["아파트명"]
              var apt_m = sortData.data[i]["전용면적(m2)"]
              var apt_p = sortData.data[i]["전용면적(평)"]
              var apt_type = sortData.data[i]["매매타입"]
              var aptAddress = sortData.data[i]["도로명주소"]
              var aptAddress2 = sortData.data[i]["법정동주소"]
              var aptValue = Math.round( sortData.data[i]["가치 총점"] * 100 ) / 100
              var house_num = sortData.data[i]["세대수"]
              var rank = sortData.data[i]["rank"].toFixed()
              var last_sales = sortData.data[i]["last_sales"].split(",")
              var last_sales_date = last_sales[0].toString()
              var last_sales_price = last_sales[1].toString()
              var last_sales_area = last_sales[2]
              last_sales_date_short = last_sales_date.substr(2)

              //valueSum += aptData.data[i]["가치 총점"]
              //livingSum += aptData.data[i]["주거총점"]
              //transportSum += aptData.data[i]["교통총점"]
              //infraSum += aptData.data[i]["인프라총점"]
              //eduSum += aptData.data[i]["학군총점"]

              //console.log(valueSum)

              complex_grade = setGrade(aptValue)

              if(checkPrice(last_sales[1])){
                var sortName = ""
                if (sortSelection == "sortDefault"){ sortName = "균형잡힌" }
                if (sortSelection == "sortLiving"){ sortName = "주거우선" }
                if (sortSelection == "sortTrans"){ sortName = "교통우선" }
                if (sortSelection == "sortInfra"){ sortName = "인프라우선" }
                if (sortSelection == "sortEdu"){ sortName = "교육우선" }
                if (sortSelection == "sortCustom"){ sortName = "커스텀" }

                if(rearrangeAPTSelection == "rearrangePrice"){ sortName = "실거래가" }
                if(rearrangeAPTSelection == "rearrangeNew"){ sortName = "신축순" }
                if(rearrangeAPTSelection == "rearrangeHouse"){ sortName = "세대수순" }

                for(var j = 0 ; j < dongDB.length ; j++){
                  if(aptAddress2.indexOf(dongDB[j][0]) > -1){
                    var dongClass = "dong_" + dongDB[j][1]
                    var addon_html = "<div class='listBox2 " + dongClass + "' data-bs-toggle='modal' data-bs-target='#baseModal' id='myModal' onClick='showDetail(" + i + ")'>";
                    break
                  }
                }

                  if(selectedMonth == "202201"){
                    addon_html += "<div class='rank_content'>"

                    if(sortSelection == "sortDefault"){
                      //addon_html += "<div class='rank'>" + rank + "위</div>";
                      addon_html += "<div class='ranksame'>RANK</div>";
                      addon_html += "<div class='rank'>" + complex_grade + "</div>";
                    }
                    else{
                      //addon_html += "<div class='rank'>" + (i+1) + "위</div>";
                      addon_html += "<div class='ranksame'>RANK</div>";
                      addon_html += "<div class='rank'>" + complex_grade + "</div>";
                    }
                    addon_html += "</div>"
                  }

                  else{
                    addon_html += "<div class='rank_content'>"

                    if(sortSelection != "sortDefault"){
                      //addon_html += "<div class='rank'>" + (i+1) + "위</div>";
                      addon_html += "<div class='ranksame'>RANK</div>";
                      addon_html += "<div class='rank'>" + complex_grade + "</div>";
                    }
                    else{
                      //addon_html += "<div class='rank'>" + (i+1) + "위</div>";
                      addon_html += "<div class='ranksame'>RANK</div>";
                      addon_html += "<div class='rank'>" + complex_grade + "</div>";
                    }

                    if(sortSelection == "sortDefault"){                      
                      if(rearrangeAPTSelection == "rearrangeScore" || rearrangeAPTSelection == "rearrangeRank" ){
                        if(sortData.data[i]["rank_gap"] == 0){
                          //addon_html += "<div class='ranksame'> -- </div>"                          
                        }
                        else if(sortData.data[i]["rank_gap"] == 9999){
                          //addon_html += "<div class='ranksame'> NEW! </div>"
                        }
                        else if(sortData.data[i]["rank_gap"] > 0){
                          //addon_html += "<div class='rankup'> ▲" + Math.abs(sortData.data[i]["rank_gap"]) + "</div>"
                        }
                        else if(sortData.data[i]["rank_gap"] < 0){
                          //addon_html += "<div class='rankdown'> ▼" + Math.abs(sortData.data[i]["rank_gap"]) + "</div>"
                        }
                      }
                      else{
                        addon_html += "<div class='ranksame' style='color:gray'>(" + sortName + ")</div>"
                      }
                    }
                    else{
                      addon_html += "<div class='ranksame' style='color:gray'>(" + sortName + ")</div>"
                    }

                    /*
                    if(sortSelection == "sortDefault"){
                      if(sortData.data[i]["rank_gap"] == 0){
                        addon_html += "<div class='ranksame'> -- </div>"
                      }
                      else if(sortData.data[i]["rank_gap"] == 9999){
                        addon_html += "<div class='ranksame'> NEW! </div>"
                      }
                      else if(sortData.data[i]["rank_gap"] > 0){
                        addon_html += "<div class='rankup'> ▲" + Math.abs(sortData.data[i]["rank_gap"]) + "</div>"
                      }
                      else if(sortData.data[i]["rank_gap"] < 0){
                        addon_html += "<div class='rankdown'> ▼" + Math.abs(sortData.data[i]["rank_gap"]) + "</div>"
                      }
                    }
                    else{
                      addon_html += "<div class='ranksame' style='color:gray'>(" + sortName + ")</div>"
                    }
                    */

                    addon_html += "</div>"
                  }  
                
                addon_html += "<div class='content'>";
                //addon_html += "<div class='apt_name'>" + aptName + " " + apt_p + "(" + apt_m + ")</div>"

                addon_html += "<div class='apt_name'>" + aptName;

                if(Number(selectedMonth) > 202203){
                  if(apt_type == "아파트"){
                    addon_html += "<span class='aptYear'> (" + sortData.data[i]["준공년차"] + "년차)</span></div>";
                  }
                  if(apt_type == "재건축"){
                    addon_html += "<span class='aptYear'> (" + sortData.data[i]["준공년차"] + "년차, 재건축)</span></div>";
                  }
                  if(apt_type == "분양권"){
                    addon_html += "<span class='aptYear'> (분양권, " + sortData.data[i]["준공년월"].substr(0, 7) + " 예정)</span></div>";
                  }
                  if(apt_type == "분양(예정)"){
                    addon_html += "<span class='aptYear'> (분양예정)</span></div>";
                  } 
                }
                else{
                  addon_html += "<span class='aptYear'> (" + sortData.data[i]["준공년차"] + "년차)</span></div>";
                }
                
                if(house_num == null){
                  addon_html += "<div class='apt_info'>" + "세대수 미정 / <span class='aptPrice'>거래 정보 없음</span></div>";
                }
                else{            
                  if(last_sales_date == "1800-01-01"){
                    addon_html += "<div class='apt_info'><span class='aptNum'>" + house_num.toLocaleString() + "세대</span> / <span class='aptPrice'>거래 정보 없음</span></div>";
                  }
                  else{
                    addon_html += "<div class='apt_info'><span class='aptNum'>"+ house_num.toLocaleString() + "세대</span> / <span class='aptPrice'>" + Math.round(last_sales_price/100)/100 + "억, " + last_sales_area + ", " + last_sales_date_short + "</span></div>";
                  }
                }
                if(Number(selectedMonth) > 202203 && (apt_type == "분양권" || apt_type == "분양(예정)")){
                  addon_html += "<div class='apt_address'>" + sortData.data[i]["법정동주소"] + "</div>";
                }
                else{
                  addon_html += "<div class='apt_address'>" + aptAddress2 + "</div>";
                }

                addon_html += "</div>";
                //addon_html += "<div class='value_score'>" + ( Math.round( aptValue * 100 ) / 100 ).toFixed(2) + "점</div>"
                addon_html += "<div class='value_score'></div>"
                addon_html += "</div>"

                $('#dataList').append(addon_html);
              }            
            }
            
            if(rearrangeAPTSelection == "rearrangePrice" || !(minValue == 0 && maxValue == 60)){
              $(".aptPrice").css({'color': '#fe4040', 'font-weight': '600'})
            }
            if(rearrangeAPTSelection == "rearrangeNew"){
              $(".aptYear").css({'color': '#fe4040', 'font-weight': '600'})
            }
            if(rearrangeAPTSelection == "rearrangeHouse"){
              $(".aptNum").css({'color': '#fe4040', 'font-weight': '600'})
            }

          }
          $('#dataList').append("<div style='height: 3em'></div>");
          $('html').scrollTop(0)
        }      
  }

  function topAptSearch(){
    //$('#dataList').html("");
    $('#searchingBox').html("");
    
    if(selectedMonth >= 202211){
      input = $('#inputUnifiedSearch').val()
    }
    else{
      input = $('#regionInputSearch').val()
    }
    regionInput = $('#inputUnifiedSearch').val()

    if(regionInput.length >= 1){    
      for(var i = 0 ; i < sortData.data.length ; i++){
        var aptName = sortData.data[i]["아파트명"]
        var aptAddress2 = sortData.data[i]["법정동주소"]
        var rank = sortData.data[i]["rank"].toFixed()
        var searchName = sortData.data[i]["아파트명"] + " " + sortData.data[i]["법정동주소"]       

        if(searchName.indexOf(input) >= 0){
            var addon_html = "<div class='listBox' data-bs-toggle='modal' data-bs-target='#baseModal' id='myModal' onClick='showTopDetail(" + i + ")'>";

            addon_html += "<div class='rank_content'>"
            addon_html += "<div class='ranksame'> TOP </div>"
            addon_html += "<div class='rank'><strong>" + rank + "</strong></div>";
            addon_html += "</div>"
            
            addon_html += "<div class='content'>";
            addon_html += "<div class='searched_region_name'>" + aptName + "</div>";
            addon_html += "<div class='searched_apt_info'>" + aptAddress2 + "</div>";
            addon_html += "</div>"

            //$('#dataList').append(addon_html);
            $('#searchingBox').append(addon_html);
            $('#searchingBox').show()
          }            
        }
        $('#searchingBox').append("<div style='height: 1.5em'></div>");

        $(".searched_region_name:contains('" + regionInput + "')").each(function(){
          var regex = new RegExp(regionInput, 'gi')
          $(this).html( $(this).text().replace(regex, "<span class='colorTxt'>"+regionInput+"</span>") );
        })
        $(".searched_apt_info:contains('" + regionInput + "')").each(function(){
          var regex2 = new RegExp(regionInput, 'gi')
          $(this).html( $(this).text().replace(regex2, "<span class='colorTxt'>"+regionInput+"</span>") );
        })
      }
      $('html').scrollTop(0)
  }

  function showRegionSearchBar(){     
    $("#regionSearchCard").animate({
      opacity: 1.0,
      top: '0'
    }, 400, 'easeOutQuad'
    );
    $("#closeRegionSearch_floating").animate({
      opacity: 1.0,
      right: '5'
    }, 700, 'easeOutQuad'
    );

    $('#regionInputSearch').focus();    
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

  var regionInput = ""
  function regionSearch(){
    //$('#dataList').html("");
    $('#searchingBox').html("");
    
    if(selectedMonth >= 202211){
      input = $('#inputUnifiedSearch').val()
    }
    else{
      input = $('#regionInputSearch').val()
    }
    regionInput = $('#inputUnifiedSearch').val()
    if(regionInput.length >= 1){
      for(var i = 0 ; i < itemNum ; i++){
        var searchName = regSortData.data[i]["시도"]

        if(searchName.indexOf(input) >= 0){
          //var addon_html = "<div class='searchedListBox' onClick='searchingUpdate(\"" + code + "\",\"" + sido + "\",\"" + gungu + "\")'>";
          var addon_html = "<div class='searchedListBox' onClick='showRegionDetail(" + i + ")'>";
          addon_html += "<div class='searched_region_name'><br>" + searchName + "<br></div>"
          addon_html += "</div>"

          //$('#dataList').append(addon_html);
          $('#searchingBox').append(addon_html);
          $('#searchingBox').show()
        }

        $(".searched_region_name:contains('" + regionInput + "')").each(function(){
          var regex = new RegExp(regionInput, 'gi')
          $(this).html( $(this).text().replace(regex, "<span class='colorTxt'>"+regionInput+"</span>") );
        })
        $(".searched_region_info:contains('" + regionInput + "')").each(function(){
          var regex2 = new RegExp(regionInput, 'gi')
          $(this).html( $(this).text().replace(regex2, "<span class='colorTxt'>"+regionInput+"</span>") );
        })

        if(rearrangeRegionSelection == "rearrangeRegionPop"){            
          $(".regionPop").css({'color': '#fe4040', 'font-weight': '600'})
        }
        if(rearrangeRegionSelection == "rearrangeRegionPopUpDown"){
          $(".regionPopUp").css({'color': '#fe4040', 'font-weight': '600'})
          $(".regionPopDown").css({'color': 'blue', 'font-weight': '600'})
        }
        if(rearrangeRegionSelection == "rearrangeRegionJob"){
          $(".regionJob").css({'color': '#fe4040', 'font-weight': '600'})
        }
        if(rearrangeRegionSelection == "rearrangeRegionIncome"){
          $(".regionIncome").css({'color': '#fe4040', 'font-weight': '600'})
        }        
      }
    }
    $('html').scrollTop(0)
  }