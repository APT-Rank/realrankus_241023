
  var valLiving = 0;
  var valTrans = 0;
  var valInfra = 0;
  var valEdu = 0;
  var valLiving_temp = 0;
  var valTrans_temp = 0;
  var valInfra_temp = 0;
  var valEdu_temp = 0;
  var sortSelection = ""

  function sleep (delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
  } 

  function initSorting(){
    sortSelection = "sortDefault"
  }

  function showSorting(){
    login_status = true
        
    if(!login_status){      
      showLogin()
      return
    }

    toastr.options = {
      closeButton: true,
      progressBar: true,
      showMethod: 'fadeIn',
      closeMethod: 'fadeOut',
      positionClass: "toast-bottom-center",
      timeOut: 5000
    };
    output = t('ui.sorting.map_only_balanced')
    toastr.success(output);

    //$('.btn-close').hide()
    //console.log("SHOW!!")
    sortingPop = true

    lastMinValue = minValue;
    lastMaxValue = maxValue;

    var titleHtml = "<div class='popupTitle' style='font-size:0.85em'>'" + $('#sido option:selected').text() + " " + $('#gungu option:selected').text() + "'"
    titleHtml += "<br>" + t('ui.sorting.title') + " (" + $('#month option:selected').text() + ")</div>";
    titleHtml += "<div class='comment2'> " + t('ui.sorting.desc') + "</div>";    
    var footerHtml = "" 

    var detailHtml = "";

    /*
    detailHtml += "<div class='filterArea'>"

    //평형 필터 슬라이더
    detailHtml += "<div class='filterInfo'>"
      detailHtml += "<div class='filterName'>평형</div>"
      detailHtml += "<div class='filterVal' id='filterName_area'></div>"
    detailHtml += "</div>"
    detailHtml += "<div class='filterRange'>"
      detailHtml += "<div> </div>"
      detailHtml += "<div id='area_slider'></div>"
      detailHtml += "<div> </div>"
      detailHtml += "<div> </div>"
      detailHtml += "<div id='area_divider'>"
      for(var i = 0 ; i < 9 ; i++){
        if(i == 0){
          detailHtml += "<div class='sPrice_index'>0</div>"
        }
        else{
          detailHtml += "<div class='sPrice_index'>" + (i*10) + "평</div>"
        }
      }
      detailHtml += "</div>"
      detailHtml += "<div> </div>"
    detailHtml += "</div>";    

    detailHtml += "<hr style='margin-top:1.5em'>";

    //매매가격 필터 슬라이더
    detailHtml += "<div class='filterInfo'>"
    detailHtml += "<div class='filterName'>가격</div>"
    detailHtml += "<div class='filterVal' id='filterName_sPrice'></div>"
    detailHtml += "</div>"
    detailHtml += "<div class='filterRange'>"
    detailHtml += "<div> </div>"
    detailHtml += "<div id='sPrice_slider'></div>"
    detailHtml += "<div> </div>"
    detailHtml += "<div> </div>"
    detailHtml += "<div id='sPrice_divider'>"
    for(var i = 0 ; i < 5 ; i++){
      if(i == 0){
        detailHtml += "<div class='sPrice_index'>0</div>"
      }
      else{
        detailHtml += "<div class='sPrice_index'>" + (i*10) + "억</div>"
      }
    }
    detailHtml += "</div>"
    detailHtml += "<div> </div>"
    detailHtml += "</div>";

    detailHtml += "<hr style='margin-top:1.5em; margin-bottom:1em'>";
    */  

    detailHtml += "<div style='font-size: 0.85em; text-align:center'> " + t('ui.sorting.map_notice') + "</div>";

    detailHtml += "<div class='settingArea' style='padding-top:0.5em'>";    
    detailHtml += "<div><input type='radio' class='btn-check' name='btnSort' autocomplete='off' id='sortLiving' onClick='setRangeValue(this)'><label class='btn btn-outline-danger' for='sortLiving'>" + t('ui.report.sort_living') + "</label></div>"

    if(selectedRegion == 'Seoul' || selectedRegion == 'Incheon' || selectedRegion == 'Gyeonggi' || selectedRegion == 'Busan' || selectedRegion == 'Daegu' || selectedRegion == 'Daejeon' || selectedRegion == 'Gwangju'){
      detailHtml += "<div><input type='radio' class='btn-check' name='btnSort' autocomplete='off' id='sortTrans' onClick='setRangeValue(this)'><label class='btn btn-outline-danger' for='sortTrans'>" + t('ui.report.sort_trans') + "</label></div>"
    }    

    detailHtml += "<div><input type='radio' class='btn-check' name='btnSort' autocomplete='off' id='sortInfra' onClick='setRangeValue(this)'><label class='btn btn-outline-danger' for='sortInfra'>" + t('ui.report.sort_infra') + "</label></div>"
    detailHtml += "<div><input type='radio' class='btn-check' name='btnSort' autocomplete='off' id='sortEdu' onClick='setRangeValue(this)'><label class='btn btn-outline-danger' for='sortEdu'>" + t('ui.report.sort_edu') + "</label></div>"
    detailHtml += "<div><input type='radio' class='btn-check' name='btnSort' autocomplete='off' id='sortCustom' onClick='setRangeValue(this)'><label class='btn btn-outline-danger' for='sortCustom'>" + t('ui.report.sort_custom') + "</label></div>"
    detailHtml += "<div><input type='radio' class='btn-check' name='btnSort' autocomplete='off' id='sortDefault' onClick='setRangeValue(this)'><label class='btn btn-outline-danger' for='sortDefault'>" + t('ui.report.sort_default') + "</label></div>"
    detailHtml += "</div>";    

    detailHtml += "<hr style='margin-top:0.7em'>";

    detailHtml += "<div class='rangeArea'>";
    
    detailHtml += "<div class='rangeName'>" + t('ui.report.living') + "</div>"
    detailHtml += "<div class='rangeSet'><input type='range' class='form-range' min='0' max='100' step='5' value='50' id='rangeLiving' onInput='updateRangeValue(" + 'setLivingValue,' + 'this' + ")'/></div>";
    detailHtml += "<div class='rangeValue' id='setLivingValue'>50%</div>";

    if(selectedRegion == 'Seoul' || selectedRegion == 'Incheon' || selectedRegion == 'Gyeonggi' || selectedRegion == 'Busan' || selectedRegion == 'Daegu' || selectedRegion == 'Daejeon' || selectedRegion == 'Gwangju'){
      detailHtml += "<div class='rangeName'>" + t('ui.report.transport') + "</div>"
      detailHtml += "<div class='rangeSet'><input type='range' class='form-range' min='0' max='100' step='5' value='50' id='rangeTrans' onInput='updateRangeValue(" + 'setTransValue,' + 'this' + ")'/></div>";
      detailHtml += "<div class='rangeValue' id='setTransValue'>50%</div>";
    }

    detailHtml += "<div class='rangeName'>" + t('ui.report.infra') + "</div>"
    detailHtml += "<div class='rangeSet'><input type='range' class='form-range' min='0' max='100' step='5' value='50' id='rangeInfra' onInput='updateRangeValue(" + 'setInfraValue,' + 'this' + ")'/></div>";
    detailHtml += "<div class='rangeValue' id='setInfraValue'>50%</div>";

    detailHtml += "<div class='rangeName'>" + t('ui.report.education') + "</div>"
    detailHtml += "<div class='rangeSet'><input type='range' class='form-range' min='0' max='100' step='5' value='50' id='rangeEdu' onInput='updateRangeValue(" + 'setEduValue,' + 'this' + ")'/></div>";
    detailHtml += "<div class='rangeValue' id='setEduValue'>50%</div>";
    detailHtml += "</div>";

    footerHtml += "<div class='modal-footer'>"
    footerHtml += "<div id='footerCheck'><input class='form-check-input' type='checkbox' value='' id='startSortPop'><label class='form-check-label' for='startSortPop'><span class='notice'>" + t('ui.sorting.hide_on_change') + "</span></label></div>"
    footerHtml += "<div><button type='button' id='sortClose' class='btn btn-outline-danger' onClick='closeSorting()'>" + t('ui.sorting.close') + "</button></div>"
    footerHtml += "<div><button type='button' id='sortApply' class='btn btn-outline-danger' onClick='applySorting()'>" + t('ui.sorting.apply') + "</button></div>"    
    footerHtml += "</div>"    
    
    $('#baseModalLabel').html(titleHtml);
    $('#aptDetail').html(detailHtml);
    $('#footer').html(footerHtml);

    $('#rangeLiving').prop("value", valLiving_temp)
    $('#rangeTrans').prop("value", valTrans_temp)
    $('#rangeInfra').prop("value", valInfra_temp)
    $('#rangeEdu').prop("value", valEdu_temp)

    $('#setLivingValue').html(valLiving_temp)
    $('#setTransValue').html(valTrans_temp)
    $('#setInfraValue').html(valInfra_temp)
    $('#setEduValue').html(valEdu_temp)
    
    $('#'+sortSelection).prop("checked", true)   

    if(sortSelection == "sortDefault" || sortSelection == "sortLiving" || sortSelection == "sortTrans" || sortSelection == "sortInfra" || sortSelection == "sortEdu"){
      $('#rangeLiving').prop("disabled", true)
      $('#rangeTrans').prop("disabled", true)
      $('#rangeInfra').prop("disabled", true)
      $('#rangeEdu').prop("disabled", true)
    }
    else{
      $('#rangeLiving').prop("disabled", false)
      $('#rangeTrans').prop("disabled", false)
      $('#rangeInfra').prop("disabled", false)
      $('#rangeEdu').prop("disabled", false)
    }

    $('#percentWarning').css({'visibility' : 'hidden'})    

    $('#sortApply').css({"border-radius": '5px', "background-color": "#ff3849", "color":"white", "height":"2.5em"})
    $('#sortClose').css({"border-radius": '5px', "background-color": "#ff3849", "color":"white", "height":"2.5em"})
    $('#footerCheck').css({"grid-column" : "span 2", "height" : "2em"})    

    initSlider_area();
    initSlider_sPrice();    

    $('#startSortPop').change(function(){
      if($(this).is(':checked')){      
        alwaysSortingPop = "off"
        console.log(alwaysSortingPop)
        localStorage.setItem('lastSortingPop', alwaysSortingPop)
      }
      else{      
        alwaysSortingPop = "on"
        console.log(alwaysSortingPop)
        localStorage.setItem('lastSortingPop', alwaysSortingPop)
      }
    })

    if(alwaysSortingPop == "off"){
      $('#startSortPop').prop("checked", true)
    }
    else{
      $('#startSortPop').prop("checked", false)
    }

    //$('#baseModal').modal("show")
    openModal("baseModal")
  }  

  function setRangeValue(e){
    sortSelection = e.id

    if(sortSelection == "sortDefault" || sortSelection == "sortLiving" || sortSelection == "sortTrans" || sortSelection == "sortInfra" || sortSelection == "sortEdu"){
      $('#rangeLiving').prop("disabled", true)
      $('#rangeTrans').prop("disabled", true)
      $('#rangeInfra').prop("disabled", true)
      $('#rangeEdu').prop("disabled", true)
    }
    if(sortSelection == "sortDefault"){
      valLiving_temp = 0
      valTrans_temp = 0
      valInfra_temp = 0
      valEdu_temp = 0
    }    
    if(sortSelection == "sortLiving"){
      if(selectedRegion == 'Seoul' || selectedRegion == 'Incheon' || selectedRegion == 'Gyeonggi' || selectedRegion == 'Busan' || selectedRegion == 'Daegu' || selectedRegion == 'Daejeon' || selectedRegion == 'Gwangju'){
        valLiving_temp = 100
        valTrans_temp = 20
        valInfra_temp = 40
        valEdu_temp = 40
      }
      else{
        valLiving_temp = 100
        valTrans_temp = 0
        valInfra_temp = 50
        valEdu_temp = 50
      }
    }
    if(sortSelection == "sortTrans"){
      valLiving_temp = 30
      valTrans_temp = 100
      valInfra_temp = 40
      valEdu_temp = 30
    }
    if(sortSelection == "sortInfra"){
      if(selectedRegion == 'Seoul' || selectedRegion == 'Incheon' || selectedRegion == 'Gyeonggi' || selectedRegion == 'Busan' || selectedRegion == 'Daegu' || selectedRegion == 'Daejeon' || selectedRegion == 'Gwangju'){
        valLiving_temp = 20
        valTrans_temp = 30
        valInfra_temp = 100
        valEdu_temp = 50
      }
      else{
        valLiving_temp = 30
        valTrans_temp = 0
        valInfra_temp = 100
        valEdu_temp = 60
      }
    }
    if(sortSelection == "sortEdu"){
      if(selectedRegion == 'Seoul' || selectedRegion == 'Incheon' || selectedRegion == 'Gyeonggi' || selectedRegion == 'Busan' || selectedRegion == 'Daegu' || selectedRegion == 'Daejeon' || selectedRegion == 'Gwangju'){
        valLiving_temp = 40
        valTrans_temp = 20
        valInfra_temp = 40
        valEdu_temp = 100
      }
      else{
        valLiving_temp = 50
        valTrans_temp = 0
        valInfra_temp = 50
        valEdu_temp = 100
      }
    }
    if(sortSelection == "sortCustom"){
      $('#rangeLiving').prop("disabled", false)
      $('#rangeTrans').prop("disabled", false)
      $('#rangeInfra').prop("disabled", false)
      $('#rangeEdu').prop("disabled", false)
    }

    //$('#rangeLiving').prop("value", valLiving_temp)
    //$('#rangeTrans').prop("value", valTrans_temp)
    //$('#rangeInfra').prop("value", valInfra_temp)
    //$('#rangeEdu').prop("value", valEdu_temp)

    $('#setLivingValue').html(valLiving_temp)
    $('#setTransValue').html(valTrans_temp)
    $('#setInfraValue').html(valInfra_temp)
    $('#setEduValue').html(valEdu_temp)

    //$("#rangeLiving").stop().animate()
    $("#rangeLiving").animate({ value: valLiving_temp}, 250, 'linear')
    //$("#rangeTrans").stop().animate()
    $("#rangeTrans").animate({ value: valTrans_temp}, 250, 'linear')
    //$("#rangeInfra").stop().animate()
    $("#rangeInfra").animate({ value: valInfra_temp}, 250, 'linear')
    //$("#rangeEdu").stop().animate()
    $("#rangeEdu").animate({ value: valEdu_temp}, 250, 'linear')    
  }

  function updateRangeValue(idname, current){
    var val = current.value
    $('#' + idname.id).html(val);

    valLiving_temp = $('#rangeLiving').val();
    valTrans_temp = $('#rangeTrans').val();
    valInfra_temp = $('#rangeInfra').val();
    valEdu_temp = $('#rangeEdu').val();

    //console.log(valLiving_temp, valTrans_temp, valInfra_temp, valEdu_temp)
  }
  function blinkSorting(){    
      $('#sort').each(function() {
        var elem = $(this);
        elem.fadeOut(200)
            .fadeIn(200)
            .fadeOut(200)
            .fadeIn(200)
            //.fadeOut(200)
            //.fadeIn(200);
    });
    sortingPop = false;
  }

  function closeSorting(){
    minValue = lastMinValue;
    maxValue = lastMaxValue;

    $('div.modal').modal("hide")
  }

  function changeSort(){
    if(sortSelection == "sortDefault"){
      valLiving_temp = 0
      valTrans_temp = 0
      valInfra_temp = 0
      valEdu_temp = 0
    }    
    if(sortSelection == "sortLiving"){
      if(selectedRegion == 'Seoul' || selectedRegion == 'Incheon' || selectedRegion == 'Gyeonggi' || selectedRegion == 'Busan' || selectedRegion == 'Daegu' || selectedRegion == 'Daejeon' || selectedRegion == 'Gwangju'){
        valLiving_temp = 100
        valTrans_temp = 20
        valInfra_temp = 40
        valEdu_temp = 40
      }
      else{
        valLiving_temp = 100
        valTrans_temp = 0
        valInfra_temp = 50
        valEdu_temp = 50
      }
    }
    if(sortSelection == "sortTrans"){
      valLiving_temp = 30
      valTrans_temp = 100
      valInfra_temp = 40
      valEdu_temp = 30
    }
    if(sortSelection == "sortInfra"){
      if(selectedRegion == 'Seoul' || selectedRegion == 'Incheon' || selectedRegion == 'Gyeonggi' || selectedRegion == 'Busan' || selectedRegion == 'Daegu' || selectedRegion == 'Daejeon' || selectedRegion == 'Gwangju'){
        valLiving_temp = 20
        valTrans_temp = 30
        valInfra_temp = 100
        valEdu_temp = 50
      }
      else{
        valLiving_temp = 30
        valTrans_temp = 0
        valInfra_temp = 100
        valEdu_temp = 60
      }
    }
    if(sortSelection == "sortEdu"){
      if(selectedRegion == 'Seoul' || selectedRegion == 'Incheon' || selectedRegion == 'Gyeonggi' || selectedRegion == 'Busan' || selectedRegion == 'Daegu' || selectedRegion == 'Daejeon' || selectedRegion == 'Gwangju'){
        valLiving_temp = 40
        valTrans_temp = 20
        valInfra_temp = 40
        valEdu_temp = 100
      }
      else{
        valLiving_temp = 50
        valTrans_temp = 0
        valInfra_temp = 50
        valEdu_temp = 100
      }
    }

    valLiving = valLiving_temp
    valTrans = valTrans_temp
    valInfra = valInfra_temp
    valEdu = valEdu_temp    

    if(sortSelection != "sortDefault"){
      showWeight()
      if(selectedRegion == 'Seoul' || selectedRegion == 'Incheon' || selectedRegion == 'Gyeonggi' || selectedRegion == 'Busan' || selectedRegion == 'Daegu' || selectedRegion == 'Daejeon' || selectedRegion == 'Gwangju'){
        total = Number(valLiving) + Number(valTrans) + Number(valInfra) + Number(valEdu)      
        rearrange(sortData, valLiving/total, valTrans/total, valInfra/total, valEdu/total)
      }
      else{
        total = Number(valLiving) + Number(valInfra) + Number(valEdu)      
        rearrange(sortData, valLiving/total, 0, valInfra/total, valEdu/total)
      }
      
      aptSearch()
      $('html').scrollTop(0)
    }
    else{
      showWeight()
      //aptData = aptData_original      
      //aptSearch()
      updateTable(selectedMonth, selectedSubRegion)      
      $('html').scrollTop(0)
      //updateRegion()
    }
  }

  function applySorting(){
    valLiving = valLiving_temp
    valTrans = valTrans_temp
    valInfra = valInfra_temp
    valEdu = valEdu_temp    

    if(sortSelection != "sortDefault"){
      showWeight()
      if(selectedRegion == 'Seoul' || selectedRegion == 'Incheon' || selectedRegion == 'Gyeonggi' || selectedRegion == 'Busan' || selectedRegion == 'Daegu' || selectedRegion == 'Daejeon' || selectedRegion == 'Gwangju'){
        total = Number(valLiving) + Number(valTrans) + Number(valInfra) + Number(valEdu)      
        rearrange(sortData, valLiving/total, valTrans/total, valInfra/total, valEdu/total)
      }
      else{
        total = Number(valLiving) + Number(valInfra) + Number(valEdu)      
        rearrange(sortData, valLiving/total, 0, valInfra/total, valEdu/total)
      }     
      aptSearch()
      $('html').scrollTop(0)
    }
    else{
      showWeight()
      //aptData = aptData_original      
      //aptSearch()
      updateTable(selectedMonth, selectedSubRegion)      
      $('html').scrollTop(0)
      //updateRegion()
    }

    $('div.modal').modal("hide")
    rearrange_on = false;
    sleep(250)
  }

  function rearrange(jsonData, living, trans, infra, edu){
    for(var i = 0 ; i < jsonData.data.length; i++){
      if(jsonData.data[i]["교통총점"] == "NA"){
        jsonData.data[i]["가치 총점"] = jsonData.data[i]["주거총점"]*living + jsonData.data[i]["인프라총점"]*infra + jsonData.data[i]["학군총점"]*edu
      }
      else{
        jsonData.data[i]["가치 총점"] = jsonData.data[i]["주거총점"]*living + jsonData.data[i]["교통총점"]*trans + jsonData.data[i]["인프라총점"]*infra + jsonData.data[i]["학군총점"]*edu
      }      
    }

    key = "가치 총점"
    type = "desc"
    data = jsonData.data
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

    sortData.data = sortJSON(data, key, type)

    //return sortData
  }