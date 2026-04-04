var all_markers = []

var web_level_control = [16, 15, 14, 11, 7]
var mobile_level_control = [15, 14, 13, 10, 7]

function removeMarkers(){
  for(var i in all_markers){
    all_markers[i].setMap(null);
  }
  all_markers = []
}

async function drawMap(region_data, sido_list, gungu_list){
  if(isMobile){
    $("#table_area_m").hide()
    $("#marker_index").css({"bottom":"25px", "right":"5px", "top":"unset"})
  }
  else{
    $("#table_area").hide()
  }  
  coord_y = region_data[0]['lat']
  coord_x = region_data[0]['lng']

  origin_yx = new naver.maps.LatLng(coord_y, coord_x);  

  if(isMobile){
    dw = window.innerWidth    
    dh = window.innerHeight - $("#titleBar_theme_m").height() - $("#update_info_m").height() - $("#menu_selector_m").height() - $("#region_search_m").height() - $("#linkToAptrank_bottom").height()- 8
    zoom_control = true
    zoom_level = 13
    minZoom_limit = 7
  }
  else{
    dw = $("#contentBox").width()
    dh = $("#contentBox").height() - $("#option_area").height() - 8
    zoom_control = true
    zoom_level = 14
    minZoom_limit = 7
  }

  var MapOptions = {
    center: new naver.maps.LatLng(Number(coord_y), Number(coord_x)),
    size: new naver.maps.Size(dw, dh),
    zoom: zoom_level, //지도의 초기 줌 레벨
    minZoom: minZoom_limit,
    zoomControl: zoom_control, //줌 컨트롤의 표시 여부
    zoomControlOptions: {
        style: naver.maps.ZoomControlStyle.SMALL,
        position: naver.maps.Position.TOP_RIGHT
    },
    draggable: true,
    pinchZoom: true,    
    scrollWheel: true,
    keyboardShortcuts: true,
    disableDoubleTapZoom: true,
    disableDoubleClickZoom: true,
    disableTwoFingerTapZoom: true,
  };

  defaultMap = new naver.maps.Map("map_area", MapOptions);

  if(isMobile){
    defaultMap.panBy(new naver.maps.Point(15, 130))
  }

  var bounds = defaultMap.getBounds(),
      southWest = bounds.getSW(),
      northEast = bounds.getNE(),
      lngSpan = northEast.lng() - southWest.lng(),
      latSpan = northEast.lat() - southWest.lat();

  //createAPTMarker(aptData)
  current_zoom = defaultMap.getZoom()
  current_pos = defaultMap.getCenterPoint()

  $("#map_table_icon").html("<i class='fa-solid fa-table'></i>")
  $("#map_table_text").html("표 보기")

  naver.maps.Event.addListener(defaultMap, 'idle', function() {
    removeMarkers()
    showHideMarker(current_zoom)
  });

  naver.maps.Event.addListener(defaultMap, 'zoom_changed', function (zoom) {
    //zoom 변경 시 함수
    current_zoom = defaultMap.getZoom()
    //showHideMarker(current_zoom)    
  });

  if(menuSelection == "menu_select_price"){  
    drawDataMap_price(region_data, current_zoom)
  }
  else{
    drawDataMap(region_data)
  }

  //$("#marker_index").show()
  //$("#map_table_m").show()
}

function drawDataMap_price(region_data, zoom){
  var indexList = []
  var min = 0
  var max = 0

  //console.log("region_data", region_data)

  price_markers = []
  var mapBounds = defaultMap.getBounds();

  for(var i = 0 ; i < region_data.length ; i++){
    //만약 zoom이 11이면 전체의 3/4지점만 마커표시
    if(zoom == 11 && i % 2 != 0){ continue }

    //만약 zoom이 10이면 전체의 2/3지점만 마커표시
    if(zoom == 10 && i % 3 != 0){ continue }

    //만약 zoom이 9이하이면 전체의 1/3지점만 마커표시
    if(zoom == 9 && i % 4 != 0){ continue }

    //만약 zoom이 9이하이면 전체의 1/3지점만 마커표시
    if(zoom == 8 && i % 6 != 0){ continue }

    //만약 zoom이 9이하이면 전체의 1/3지점만 마커표시
    if(zoom == 7 && i % 7 != 0){ continue }

    region_point = new naver.maps.LatLng(Number(region_data[i]['lat']), Number(region_data[i]['lng']));      

    if(mapBounds.hasLatLng(region_point) && region_data[i]['평단가'] != 0) {
      full_name = region_data[i]['시도'] + " " + region_data[i]['군구'] + " " + region_data[i]['읍면동']
      dong_name = region_data[i]['읍면동']
      price_per = Number(Number(region_data[i]['평단가']).toFixed(0)).toLocaleString()
      index = region_data[i]['index']
      value_percentage = region_data[i]['평단가_백분률']

      class_name = ""
      if(value_percentage >= 0 && value_percentage < 0.1){ class_name = "CL01" }
      else if(value_percentage >= 0.1 && value_percentage < 0.5){ class_name = "CL02" }
      else if(value_percentage >= 0.5 && value_percentage < 1.0){ class_name = "CL03" }
      else if(value_percentage >= 1.0 && value_percentage < 5.0){ class_name = "CL04" }
      else if(value_percentage >= 5.0 && value_percentage < 10.0){ class_name = "CL05" }
      else if(value_percentage >= 10.0 && value_percentage < 20.0){ class_name = "CL07" }
      else if(value_percentage >= 20.0 && value_percentage < 30.0){ class_name = "CL08" }
      else if(value_percentage >= 30.0 && value_percentage < 40.0){ class_name = "CL09" }
      else if(value_percentage >= 40.0 && value_percentage < 50.0){ class_name = "CL10" }
      else if(value_percentage >= 50.0 && value_percentage < 70.0){ class_name = "CL10" }
      else if(value_percentage >= 70.0){ class_name = " CL11" }


      var price_marker_id = 'price_marker_' + i

      //value_percentage가 1보다 작은 경우 소수점 3자리까지 표시, 10보다 작은 경우 소수점 2자리까지 표시, 그 외는 정수로 표시
      var str_value_percentage = ""
      if(value_percentage < 0.001){
        str_value_percentage = "< 0.001%"
      } else if(value_percentage < 1){
        str_value_percentage = Number(value_percentage).toFixed(3) + "%"
      } else if(value_percentage < 10){
        str_value_percentage = Number(value_percentage).toFixed(2) + "%"
      } else {
        str_value_percentage = Number(value_percentage).toFixed(1) + "%"
      }
      var price_marker_html = `
      <div class='price_marker ${class_name}'>
        <div class='price_marker_dong_name'>${dong_name}</div>        
        <div class='price_marker_percentage'>${str_value_percentage}</div>
        <div class='price_marker_price'>${price_per}</div>
      </div>      
      `
      var price_marker_on_map = new naver.maps.Marker({
        position: region_point,
        icon: {
            content: price_marker_html,
            //size: new naver.maps.Size(24, 37),
            //anchor: new naver.maps.Point(8, 45),
            origin: new naver.maps.Point( Number(region_data[i]['lat']), Number(region_data[i]['lng']) ),
        },
        zIndex: 100,
        map: defaultMap,
        index : index,
        //gungu : find_subRegion,        
      });

      all_markers.push(price_marker_on_map)
    }
  }

  for(var i in all_markers){
    index = all_markers[i]['index']
    naver.maps.Event.addListener(all_markers[i], 'click', priceMarkerAction(index));
  }
    
  searchingDB.sort()
  last_zoom_control(zoom)
}

function drawDataMap(region_data, zoom){
  console.log(region_data)
  var indexList = []
  var min = 0
  var max = 0

  //console.log("region_data", region_data)

  price_markers = []
  var mapBounds = defaultMap.getBounds();

  for(var i = 0 ; i < region_data.length ; i++){
    //만약 zoom이 11이면 전체의 3/4지점만 마커표시
    if(zoom == 11 && i % 2 != 0){ continue }

    //만약 zoom이 10이면 전체의 2/3지점만 마커표시
    if(zoom == 10 && i % 3 != 0){ continue }

    //만약 zoom이 9이하이면 전체의 1/3지점만 마커표시
    if(zoom == 9 && i % 4 != 0){ continue }

    //만약 zoom이 9이하이면 전체의 1/3지점만 마커표시
    if(zoom == 8 && i % 6 != 0){ continue }

    //만약 zoom이 9이하이면 전체의 1/3지점만 마커표시
    if(zoom == 7 && i % 7 != 0){ continue }

    value_percentage = 0
    value_score = 0

    if(menuSelection == "menu_select_balanced"){
      value_percentage = region_data[i]['가치_백분률']
      value_score = region_data[i]['가치총점']
    }
    if(menuSelection == "menu_select_edu"){
      value_percentage = region_data[i]['교육_백분률']
      value_score = region_data[i]['교육총점']
    }
    if(menuSelection == "menu_select_living"){
      value_percentage = region_data[i]['주거_백분률']
      value_score = region_data[i]['주거총점']
    }
    if(menuSelection == "menu_select_infra"){
      value_percentage = region_data[i]['인프라_백분률']
      value_score = region_data[i]['인프라총점']
    }
    if(menuSelection == "menu_select_trans"){
      value_percentage = region_data[i]['교통_백분률']
      value_score = region_data[i]['교통총점']
    }

    region_point = new naver.maps.LatLng(Number(region_data[i]['lat']), Number(region_data[i]['lng']));

    if(mapBounds.hasLatLng(region_point) && value_percentage != "NA") {
      full_name = region_data[i]['시도'] + " " + region_data[i]['군구'] + " " + region_data[i]['읍면동']
      dong_name = region_data[i]['읍면동']
      str_value_percentage = Number(value_percentage).toFixed(2) + "%"
      value_score = value_score.toFixed(2)      
      index = region_data[i]['index']

      class_name = ""
      if(value_percentage >= 0 && value_percentage < 0.1){ class_name = "CL01" }
      else if(value_percentage >= 0.1 && value_percentage < 0.5){ class_name = "CL02" }
      else if(value_percentage >= 0.5 && value_percentage < 1.0){ class_name = "CL03" }
      else if(value_percentage >= 1.0 && value_percentage < 5.0){ class_name = "CL04" }
      else if(value_percentage >= 5.0 && value_percentage < 10.0){ class_name = "CL05" }
      else if(value_percentage >= 10.0 && value_percentage < 20.0){ class_name = "CL07" }
      else if(value_percentage >= 20.0 && value_percentage < 30.0){ class_name = "CL08" }
      else if(value_percentage >= 30.0 && value_percentage < 40.0){ class_name = "CL09" }
      else if(value_percentage >= 40.0 && value_percentage < 50.0){ class_name = "CL10" }
      else if(value_percentage >= 50.0 && value_percentage < 70.0){ class_name = "CL10" }
      else if(value_percentage >= 70.0){ class_name = " CL11" }


      var region_marker_id = 'region_marker_' + i
      var region_marker_html = `
      <div class='price_marker ${class_name}'>
        <div class='price_marker_dong_name'>${dong_name}</div>
        <div class='price_marker_price'>${str_value_percentage}</div>        
      </div>      
      `
      var region_marker_on_map = new naver.maps.Marker({
        position: region_point,
        icon: {
            content: region_marker_html,
            //size: new naver.maps.Size(24, 37),
            //anchor: new naver.maps.Point(8, 45),
            origin: new naver.maps.Point( Number(region_data[i]['lat']), Number(region_data[i]['lng']) ),
        },
        zIndex: 100,
        map: defaultMap,
        index : index,
        //gungu : find_subRegion,        
      });

      all_markers.push(region_marker_on_map)
    }
  }

  for(var i in all_markers){
    index = all_markers[i]['index']
    naver.maps.Event.addListener(all_markers[i], 'click', priceMarkerAction(index));
  }
    
  searchingDB.sort()
  last_zoom_control(zoom)
}

function showHideMarker(zoom){
  if(isMobile){
    zoom_levels = mobile_level_control
    //[16, 15, 13, 10, 6]
  }
  else{
    zoom_levels = web_level_control
    //[15, 14, 13, 10, 6]
  } 
  removeMarkers()

  if(menuSelection == "menu_select_price"){
    drawDataMap_price(region_class, zoom)    
  }
  else{
    drawDataMap(region_class, zoom)    
  }
  
  //setGradeFilter()
}

function last_zoom_control(zoom){
  console.log("zoom_control", zoom)
  if(zoom >= 15){      
    $(".price_marker").css({"width": "80px", "padding-top": "3px", "padding-bottom": "3px"})
    $(".price_marker_dong_name").css({"font-size": "0.75em"})
    $(".price_marker_price").css({"font-size": "0.75em"})
    $(".price_marker_percentage").css({"font-size": "0.75em"})
    $(".price_marker_dong_name").css({"border-bottom": "1px solid rgba(255, 255, 255, 0.4)"});
    console.log("current_zoom 15", zoom)
  }
  else if(zoom == 14){      
    $(".price_marker").css({"width": "70px", "padding-top": "2px", "padding-bottom": "2px"})
    $(".price_marker_dong_name").css({"font-size": "0.7em"})
    $(".price_marker_price").css({"font-size": "0.7em"})
    $(".price_marker_percentage").css({"font-size": "0.7em"})
    $(".price_marker_dong_name").css({"border-bottom": "1px solid rgba(255, 255, 255, 0.4)"});
    console.log("current_zoom 14", zoom)
  }
  else if(zoom == 13){      
    $(".price_marker").css({"width": "60px", "padding-top": "1px", "padding-bottom": "1px"})
    $(".price_marker_dong_name").css({"font-size": "0.65em"})
    $(".price_marker_price").css({"font-size": "0.65em"})
    if(menuSelection == "menu_select_price"){
      $(".price_marker_price").hide()
    }
    $(".price_marker_percentage").css({"border-bottom": "none"});
    $(".price_marker_percentage").css({"font-size": "0.65em"})
    $(".price_marker_dong_name").css({"border-bottom": "1px solid rgba(255, 255, 255, 0.4)"});
    console.log("current_zoom 13", zoom)
  }
  else if(zoom == 12){
    //$(".price_marker").css({"width": "20px", "height": "20px", "border-radius": "10px", "padding-top": "0px", "padding-bottom": "0px"})
    //$(".price_marker_dong_name").html("")
    //$(".price_marker_price").html("")
    //$(".price_marker_percentage").html("")
    //$(".price_marker_dong_name").css({"border-bottom": "none"});
    //$(".price_marker_percentage").css({"border-bottom": "none"});
    $(".price_marker").css({"width": "45px", "padding-top": "1px", "padding-bottom": "1px"})
    $(".price_marker_percentage").css({"font-size": "0.6em"})
    $(".price_marker_percentage").css({"border-bottom": "none"});
    $(".price_marker_dong_name").css({"border-bottom": "1px solid rgba(255, 255, 255, 0.4)"});
    $(".price_marker_dong_name").hide()
    if(menuSelection == "menu_select_price"){
      $(".price_marker_price").hide()      
    }
    else{
      $(".price_marker_price").css({"font-size": "0.6em"})
    }
    console.log("current_zoom 12", zoom)
  }
  else if(zoom == 11){
    $(".price_marker").css({"width": "15px", "height": "15px", "border-radius": "10px", "padding-top": "0px", "padding-bottom": "0px"})
    $(".price_marker_dong_name").html("")
    $(".price_marker_price").html("")
    $(".price_marker_percentage").html("")
    $(".price_marker_dong_name").css({"border-bottom": "none"});
    $(".price_marker_percentage").css({"border-bottom": "none"});
    console.log("current_zoom 11", zoom)
  }
  else if(zoom == 10){
    $(".price_marker").css({"width": "15px", "height": "15px", "border-radius": "10px", "padding-top": "0px", "padding-bottom": "0px"})
    $(".price_marker_dong_name").html("")
    $(".price_marker_price").html("")
    $(".price_marker_percentage").html("")
    $(".price_marker_dong_name").css({"border-bottom": "none"});
    $(".price_marker_percentage").css({"border-bottom": "none"});
    console.log("current_zoom 10", zoom)
  }
  else if(zoom == 9){
    $(".price_marker").css({"width": "12px", "height": "12px", "border-radius": "10px", "padding-top": "0px", "padding-bottom": "0px"})
    $(".price_marker_dong_name").html("")
    $(".price_marker_price").html("")
    $(".price_marker_percentage").html("")
    $(".price_marker_dong_name").css({"border-bottom": "none"});
    $(".price_marker_percentage").css({"border-bottom": "none"});
    console.log("current_zoom 9", zoom)
  }
  else if(zoom <= 8){
    $(".price_marker").css({"width": "10px", "height": "10px", "border-radius": "10px", "padding-top": "0px", "padding-bottom": "0px"})
    $(".price_marker_dong_name").html("")
    $(".price_marker_price").html("")
    $(".price_marker_percentage").html("")
    $(".price_marker_dong_name").css({"border-bottom": "none"});
    $(".price_marker_percentage").css({"border-bottom": "none"});
    console.log("current_zoom 9", zoom)
  }
}

function priceMarkerAction(index){
  return function(e){
    showRegionInfo(index)()
  }
}

view_mode = "map" //map, table

function mapTableModeChange(){  
  if(view_mode == "map"){
    if(isMobile){
      $("#table_area_m").show()
    }
    else{
      $("#table_area").show()
    }    
    $("#map_area").hide()

    $("#map_table_icon").html("<i class='fa-solid fa-map'></i>")
    $("#map_table_text").html("지도 보기")

    view_mode = "table"
  }
  else if(view_mode == "table"){    
    if(isMobile){
      $("#table_area_m").hide()
    }
    else{
      $("#table_area").hide()
    }
    $("#map_area").show()

    $("#map_table_icon").html("<i class='fa-solid fa-table'></i>")
    $("#map_table_text").html("표 보기")    

    view_mode = "map"
  }
}