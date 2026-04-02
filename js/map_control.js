var level0_markers = []
var level0_loc = []

var level1_markers = []
var level1_loc = []

var level2_markers = []
var level2_loc = []

var complex_small_markers = []
var complex_large_markers = []

var all_markers = []

var defaultMap = ""
var regionMapData = ""

var last_zoom = 16

var web_level_control = [16, 15, 14, 11, 7]
var mobile_level_control = [15, 14, 13, 10, 7]

//각 레벨에서 최소 몇 명 이상의 방문자를 표시할 것인지?
var min_level0_visit = 0
var min_level1_visit = 0
var min_level2_visit = 0
var min_small_market_visit = 0
var min_large_market_visit = 0
var min_visit = 0

/*
  if(zoom >= 16){      
    //createLargeMarker(marker_coordinations)
    createLargeMarker(show_up_complexs)
  }
  else if(zoom < 16 && zoom >= 15){      
    createSmallMarker(show_up_complexs)
  }
  else if(zoom < 15 && zoom >= 13){
    createLevel2Marker(level2_loc)
  }
  else if(zoom < 13 && zoom >= 10){      
    createLevel1Marker(level1_loc)
  }
  else if(zoom < 10 && zoom >= 6){      
    createLevel0Marker(level0_loc)
  }

*/
function loadMap(center_x, center_y){
  coord_y = center_y
  coord_x = center_x
  
  if(isMobile){
    dw = window.innerWidth
    if(selectedRegion != "Korea"){
      dh = window.innerHeight - $("#linkToAptrank_bottom").height() - $("#titleBar").height() - $("#selections").height() - $("#weight").height()
    }
    else{
      dh = window.innerHeight - $("#linkToAptrank_bottom").height() - $("#titleBar").height() - $("#selections").height()
    }
    zoom_control = true
    zoom_level = 16
  }
  else{
    dw = window.innerWidth - 600
    dh = window.innerHeight - $("#linkToAptrank_bottom").height()
    zoom_control = true
    zoom_level = 16
  }

  if (selectedRegion == "Korea"){
    zoom_level = 8
  }

  var MapOptions = {
    center: new naver.maps.LatLng(Number(coord_y), Number(coord_x)),
    size: new naver.maps.Size(dw, dh),
    zoom: zoom_level, //지도의 초기 줌 레벨
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

  defaultMap = new naver.maps.Map("dataMap", MapOptions);

  var bounds = defaultMap.getBounds(),
      southWest = bounds.getSW(),
      northEast = bounds.getNE(),
      lngSpan = northEast.lng() - southWest.lng(),
      latSpan = northEast.lat() - southWest.lat();  

  naver.maps.Event.addListener(defaultMap, 'idle', function() {
    if(selectedSubRegion == "Living_Top300" || selectedSubRegion == "Trans_Top300" || selectedSubRegion == "Infra_Top300"
      || selectedSubRegion == "Edu_Top300" || selectedSubRegion == "Balanced_Top300"){
      createTopMarker(top_300_data)
       return
    }

    removeMarkers()   

    current_zoom = defaultMap.getZoom()
    current_pos = defaultMap.getCenterPoint()
    projection = defaultMap.getProjection();
    current_coord = projection.fromPointToCoord(current_pos)

    origin_lat = current_coord['y']
    origin_lng = current_coord['x']    

    nearby_region = []
    nearby_region = findNearbyRegion(origin_lat, origin_lng, 30)

    show_up_complexs = []
    show_up_complexs = defineMarkerList(nearby_region)
    //getDistanceFromLatLonInKm()

    showHideMarker(current_zoom)
  });

  naver.maps.Event.addListener(defaultMap, 'zoom_changed', function (zoom) {
    current_zoom = defaultMap.getZoom()    
    showHideMarker(current_zoom)
  });
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

  if(selectedSubRegion == "Living_Top300" || selectedSubRegion == "Trans_Top300" || selectedSubRegion == "Infra_Top300"
     || selectedSubRegion == "Edu_Top300" || selectedSubRegion == "Balanced_Top300"){
      return
  }

  removeMarkers()
  
  if(zoom >= zoom_levels[0]){      
    //createLargeMarker(marker_coordinations)
    createLargeMarker(show_up_complexs)
    min_visit = min_large_market_visit    
  }
  else if(zoom < zoom_levels[0] && zoom >= zoom_levels[1]){      
    createSmallMarker(show_up_complexs)
    min_visit = min_large_market_visit    
  }
  else if(zoom < zoom_levels[1] && zoom >= zoom_levels[2]){
    createLevel2Marker(level2_loc)
    min_visit = min_level2_visit
  }
  else if(zoom < zoom_levels[2] && zoom >= zoom_levels[3]){
    createLevel1Marker(level1_loc)
    min_visit = min_level1_visit
  }
  else if(zoom < zoom_levels[3] && zoom >= zoom_levels[4]){      
    createLevel0Marker(level0_loc)
    min_visit = min_level0_visit
  }

  if(current_selection != ""){    
    for(var i in all_markers){
      if(all_markers[i]['code'] == current_selection){
        animateMarker(all_markers[i], window["visit_obj_" + current_selection])
        break;
      }      
    }    
  }

  setGradeFilter()
}

function removeAnimation(){
  var mapBounds = defaultMap.getBounds();

  for(var i in all_markers){
    if(mapBounds.hasLatLng(all_markers[i]['position'])){
      all_markers[i].setAnimation(null);
    }
  }
}

function animateMarker(marker, visit_marker){
  removeAnimation()

  setTimeout(function(){
    marker.setAnimation(naver.maps.Animation.BOUNCE)
    if(visit_marker){
      visit_marker.setAnimation(naver.maps.Animation.BOUNCE)
    }
    else{
      visit_marker.setAnimation(null);
    }
  }, 350)  
}

function defineMarkerList(nearby_region){
  for (var j in searchingData.data){
    address = searchingData.data[j]['법정동주소']      
    for(var k in nearby_region){
      searching_address = nearby_region[k]['법정동명']
      if (address.includes(searching_address)){
        show_up_complexs.push(searchingData.data[j])        
        continue
      }
    }      
  }

  var filtered_complexs = show_up_complexs.filter((element, index) => {
    return show_up_complexs.indexOf(element) === index;
  });

  console.log("show_up_complexs:", filtered_complexs)

  return filtered_complexs
}

function findNearbyRegion(origin_lat, origin_lng, area_distance){
  nearby_result = []
  nearby_regions = []
  for(var i in level1_loc){
    dest_lat = level1_loc[i]['lat']
    dest_lng = level1_loc[i]['lng']
    distance = getDistanceFromLatLonInKm(origin_lat,origin_lng,dest_lat,dest_lng)      

    if(distance < area_distance){
      nearby_regions.push(level1_loc[i])
    }      
  }

  nearby_result = nearby_regions

  if(nearby_result.length == 0){
    nearby_result = findNearbyRegion(origin_lat, origin_lng, area_distance + 5)
  }

  return nearby_result
}

var marker_z_depth = 1000

var infoWindow

function showUpInfo(marker_obj){
  return function(e) {
    marker_z_depth += 1
    zoom = defaultMap.getZoom()
    marker_last_depth = marker_obj.getZIndex()
    marker_obj.setZIndex(marker_z_depth += 1)

    var complex_name = marker_obj['apt_name']
    var complex_address = marker_obj['address']

    if(zoom >= 16){      
      infoWindow_position = new naver.maps.Point(20, -5)
    }
    else if(zoom < 16 && zoom >= 15){      
      infoWindow_position = new naver.maps.Point(5, -5)
    }

    infoWindow_content = `
    <div class='complex_info_window'>
      <div id='info_window_complex_name'>${complex_name}</div>
      <div id='info_window_complex_address'>${complex_address}</div>
    </div>
    `
    infoWindow = new naver.maps.InfoWindow({
      content: infoWindow_content,
      borderWidth: 0,
      anchorSize: new naver.maps.Size(0, 0),      
      pixelOffset: infoWindow_position
    })
    infoWindow.open(defaultMap, marker_obj);
    naver.maps.Event.addListener(marker_obj, 'mouseout', showDownInfo(infoWindow));
    
  }
}

function showDownInfo(infoWindow){
  return function(e) {
    infoWindow.close()
  }
}

function removeMarkers(){
  for(var i in all_markers){
    all_markers[i].setMap(null);
  }
  if(infoWindow != null){
    infoWindow.close()
  }
  all_markers = []
}

var onMap_list = []
var onMap_markers = []
var onMap_visit_markers = []

function updateMarkers(map, markers) {  
  var mapBounds = map.getBounds();
  var marker, position;

  onMap_markers = []
  onMap_list = []  
  for (var i = 0; i < markers.length; i++) {
      marker = markers[i]
      position = marker.getPosition();

      if (mapBounds.hasLatLng(position)) {
          find_code = marker['code']
          find_obj = getKeyByValue(searchingData.data, find_code)
          onMap_markers.push(marker)
          onMap_list.push(find_obj)          
          showMarker(map, marker);
      } else {
          hideMarker(map, marker);
      }
  }

  current_zoom = defaultMap.getZoom() 
  if(current_zoom >= zoom_levels[1]){
    showHide_filtered_marker(onMap_list, onMap_markers)
  }
}

function showHide_filtered_marker(onMap_list, onMap_markers){
  //if(!filtered){
  //  return
  //}  

  filtered_list = returnFilteredData_onMap(onMap_list)    
 
  for(var i in onMap_markers){
    onMap_markers[i].setMap(null);
    //window["visit_obj_" + onMap_markers[i]['code']].setMap(null)
    $("#visit_complex_" + onMap_markers[i]['code']).css({"visibility" : "hidden"})
    for(var j in filtered_list){
      if(onMap_markers[i]['code'] == filtered_list[j]['검색코드']){        
        //window["visit_obj_" + onMap_markers[i]['code']].setMap(defaultMap)
        onMap_markers[i].setMap(defaultMap);
        $("#visit_complex_" + onMap_markers[i]['code']).css({"visibility" : "visible"})

        var last_sales_raw = filtered_list[j]["last_sales"]
        
        if(filtered){
          if(last_sales_raw == "BYG"){
            sPrice_last = "분양"
            area_last = ""
          }
          else{
            sPrice_last_arr = ( filtered_list[j]['sprice'] ).split(",")
            sPrice_last = sPrice_last_arr[sPrice_last_arr.length-1] + "억"

            area_last_arr = ( filtered_list[j]['area'] ).split(",")
            area_last = area_last_arr[area_last_arr.length-1] + "평"
          }

          $("#sPrice_" + onMap_markers[i]['code']).html(sPrice_last)
          $("#area_" + onMap_markers[i]['code']).html(area_last)
        }
        else{
          if(last_sales_raw == "BYG"){
            last_sales_price_kor = "분양"
            last_sales_area_kor = ""
          }
          else{
            var last_sales = last_sales_raw.split(",");
            var last_sales_date = last_sales[0].toString();
            var last_sales_price = last_sales[1].toString();
            var last_sales_area = last_sales[2];
            
            if (isNaN(last_sales_price)) {
              last_sales_price_kor = "정보없음"
              last_sales_area_kor = "--"
            } else {
              last_sales_price_kor = Math.round(last_sales_price / 100) / 100 + "억"
              last_sales_area_kor = last_sales_area
            }
          }

          $("#sPrice_" + onMap_markers[i]['code']).html(last_sales_price_kor)
          $("#area_" + onMap_markers[i]['code']).html(last_sales_area_kor)
        }
      }
    }
  }
  showHideListFiltered(aptData)
}

function getKeyByValue(object, value){
  //object안의 object에서 value를 가지는 key를 찾아서 반환
  for(var key in object){
    if(object[key]['검색코드'] == value){
      return object[key]
    }
  }
}

function returnFilteredData_onMap(onMap_list){  
  area_filtered_list = return_area_FilteredData_onMap(onMap_list)
  //console.log("AREA:", area_filtered_list)
  sPrice_filtered_list = return_sPrice_FilteredData_onMap(area_filtered_list)  
  //console.log("PRICE:", sPrice_filtered_list)

  return sPrice_filtered_list
}

function return_area_FilteredData_onMap(onMap_list){
  return_filtered_array = []
  filtered_area  = []
  filtered_sPrice  = []
  filtered_rPrice  = []
  filtered_ratio  = []

  for(var i in onMap_list){
    area_arr = (onMap_list[i]['area']).split(",")
    sPrice_arr = (onMap_list[i]['sprice']).split(",")
    rPrice_arr = (onMap_list[i]['rprice']).split(",")
    ratio_arr = (onMap_list[i]['ratio']).split(",")

    for(var j in area_arr){
      if(Number(area_arr[j]) >= area_min && Number(area_arr[j]) <= area_max){        
        filtered_area.push(Number(area_arr[j]))
        filtered_sPrice.push(Number(sPrice_arr[j]))
        filtered_rPrice.push(Number(rPrice_arr[j]))
        filtered_ratio.push(Number(ratio_arr[j]))
      }      
    }

    if(filtered_area.length > 0 || onMap_list[i]['last_sales'] == "BYG"){
      onMap_list[i]['area'] = String(filtered_area)
      onMap_list[i]['sprice'] = String(filtered_sPrice)
      onMap_list[i]['rprice'] = String(filtered_rPrice)
      onMap_list[i]['ratio'] = String(filtered_ratio)

      return_filtered_array.push(onMap_list[i])
      filtered_area  = []
      filtered_sPrice  = []
      filtered_rPrice  = []
      filtered_ratio  = []
    }
  }

  return return_filtered_array
}

function return_sPrice_FilteredData_onMap(onMap_list){
  return_filtered_array = []
  filtered_area  = []
  filtered_sPrice  = []
  filtered_rPrice  = []
  filtered_ratio  = []

  for(var i in onMap_list){
    area_arr = (onMap_list[i]['area']).split(",")
    sPrice_arr = (onMap_list[i]['sprice']).split(",")
    rPrice_arr = (onMap_list[i]['rprice']).split(",")
    ratio_arr = (onMap_list[i]['ratio']).split(",")

    max_price = sPrice_max

    if(sPrice_max == f_sales_price_max){
      max_price = 1000
    }

    for(var j in sPrice_arr){      
      if(Number(sPrice_arr[j]) >= sPrice_min && Number(sPrice_arr[j]) <= max_price){        
        filtered_area.push(Number(area_arr[j]))
        filtered_sPrice.push(Number(sPrice_arr[j]))
        filtered_rPrice.push(Number(rPrice_arr[j]))
        filtered_ratio.push(Number(ratio_arr[j]))
      }      
    }

    no_sales = sPrice_arr.every(num => num = -1)
    if(!filtered && no_sales){
      return_filtered_array.push(onMap_list[i])
    }

    if(filtered_sPrice.length > 0 || onMap_list[i]['last_sales'] == "BYG"){
      onMap_list[i]['area'] = String(filtered_area)
      onMap_list[i]['sprice'] = String(filtered_sPrice)
      onMap_list[i]['rprice'] = String(filtered_rPrice)
      onMap_list[i]['ratio'] = String(filtered_ratio)

      return_filtered_array.push(onMap_list[i])
      filtered_area  = []
      filtered_sPrice  = []
      filtered_rPrice  = []
      filtered_ratio  = []
    }
  }

  return return_filtered_array
}

function updateVisits(map, markers) {  
  var mapBounds = map.getBounds();
  var marker, position;
  var show_visit = []  

  for (var i = 0; i < markers.length; i++) {
      marker = markers[i]
      position = marker.getPosition();     

      if (mapBounds.hasLatLng(position)) {
          show_visit.push(marker['code'])          
          showMarker(map, marker)
      }
      else {
          hideMarker(map, marker);
      }
  }

  show_visit_shuffle = shuffle(show_visit)

  if(show_visit_shuffle.length >= 5){
    chunk = Math.floor(show_visit_shuffle.length/5)
    show_visit_shuffle_chunked = arrayChunk(show_visit_shuffle, chunk)    

    for(var j in show_visit_shuffle_chunked){
      showVisitInfo(show_visit_shuffle_chunked[j], 0)
    }
  }
  else{
    showVisitInfo(show_visit_shuffle, 0)
  }  
}

//동시에 여러개 띄우는 함수임
function showVisitInfo_test(visits){  
  var promises = visits.map(function(visit){    
    return firebase.database().ref("/realrankus_visit/").child(visit).once("value")
  })
  Promise.all(promises).then(function(snapshots){
    snapshots.forEach(function(snapshot){
      if(snapshot.exists()){
        visit_obj = snapshot.val()
        visit_count = 0
        for(var i in visit_obj){
          //날짜가 30일 이전의 날짜보다 큰 경우만 count
          compare_days = Number(i.replaceAll("-", ""))
          if(days_ago_num <= compare_days){
            visit_count += visit_obj[i]
          }
        }
        //몇 명 이상 방문해야 보여지는지
        if(visit_count >= min_visit){
          visit_id = 'visit_'+ snapshot.key          
          //visit_count = 99
          $("#" + visit_id).html(visit_count.toLocaleString() + "명 방문")          
          $("#" + visit_id).animate({opacity: '1', marginTop:'0px'}, 250);
          
          if(visit_count < 1000){
            if(isMobile && current_zoom == 15){
              $("#" + visit_id).css({'width': '53px', 'left':'1px'});
            }
            else{
              $("#" + visit_id).css({'width': '60px'});
            }            
          }
          else if(visit_count >= 1000 && visit_count < 10000){
            if(isMobile && current_zoom == 15){
              $("#" + visit_id).css({'width': '70px', 'left':'-6px'});
            }
            else{
              $("#" + visit_id).css({'width': '70px', 'left':'-3px'});
            }
          }
          else{
            if(isMobile && current_zoom == 15){
              $("#" + visit_id).css({'width': '80px', 'left':'-11px'});
            }
            else{
              $("#" + visit_id).css({'width': '80px', 'left':'-8px'});
            }
          }
        }
      }      
    })
  })
}

function showVisitInfo(visits, visit_check_count){  
  loop_count = visits.length  
  if(visit_check_count == loop_count){
    visit_check_count = 0
    return
  }
  else{
    firebase.database().ref().child("realrankus_visit").child(visits[visit_check_count]).get()
	  .then((snapshot) => {
      if(snapshot.exists()){
        visit_obj = snapshot.val()
        visit_count = 0        
        for(var i in visit_obj){
          //날짜가 30일 이전의 날짜보다 큰 경우만 count
          compare_days = Number(i.replaceAll("-", ""))
          if(days_ago_num <= compare_days){
            visit_count += visit_obj[i]
          }
        }
        //몇 명 이상 방문해야 보여지는지
        if(visit_count >= min_visit){
          visit_id = 'visit_' + visits[visit_check_count]
          //visit_count = 99
          $("#" + visit_id).html(visit_count.toLocaleString() + "명 방문")          
          $("#" + visit_id).animate({opacity: '1', marginTop:'0px'}, 250);
          
          if(visit_count < 1000){
            if(isMobile && current_zoom == 15){
              $("#" + visit_id).css({'width': '53px', 'left':'1px'});
            }
            else{
              $("#" + visit_id).css({'width': '60px'});
            }            
          }
          else if(visit_count >= 1000 && visit_count < 10000){
            if(isMobile && current_zoom == 15){
              $("#" + visit_id).css({'width': '70px', 'left':'-6px'});
            }
            else{
              $("#" + visit_id).css({'width': '70px', 'left':'-3px'});
            }
          }
          else{
            if(isMobile && current_zoom == 15){
              $("#" + visit_id).css({'width': '80px', 'left':'-11px'});
            }
            else{
              $("#" + visit_id).css({'width': '80px', 'left':'-8px'});
            }
          }
        }
      }      
      visit_check_count++
      showVisitInfo(visits, visit_check_count)
    })
  }
}

function updateVisits_lv1_lv2(map, markers) {  
  var mapBounds = map.getBounds();
  var marker, position;
  var show_visit = []

  for (var i = 0; i < markers.length; i++) {
      marker = markers[i]
      position = marker.getPosition();

      if (mapBounds.hasLatLng(position)) {          
          find_region = marker['region']
          show_visit.push(find_region)             
      }
      else {
          hideMarker(map, marker);
      }
  }
  show_visit_shuffle = shuffle(show_visit)

  if(show_visit_shuffle.length >= 5){
    chunk = Math.floor(show_visit_shuffle.length/5)
    show_visit_shuffle_chunked = arrayChunk(show_visit_shuffle, chunk)    

    for(var j in show_visit_shuffle_chunked){
      showVisitInfo_lv1_lv2(show_visit_shuffle_chunked[j], 0)
    }
  }
  else{
    showVisitInfo_lv1_lv2(show_visit_shuffle, 0)
  }
}

function showVisitInfo_lv1_lv2(visits, visit_check_count){  
  loop_count = visits.length  
  if(visit_check_count == loop_count){
    visit_check_count = 0
    return
  }
  else{
    //console.log(visits[visit_check_count])
    firebase.database().ref().child("realrankus_visit").child(visits[visit_check_count]).get()
	  .then((snapshot) => {
      if(snapshot.exists()){
        visit_obj = snapshot.val()
        visit_count = 0
        for(var i in visit_obj){
          //날짜가 30일 이전의 날짜보다 큰 경우만 count
          compare_days = Number(i.replaceAll("-", ""))
          if(days_ago_num <= compare_days){
            visit_count += visit_obj[i]
          }
        }
        //몇 명 이상 방문해야 보여지는지
        if(visit_count >= min_visit){
          visit_id = 'visit_' + visits[visit_check_count]
          //visit_count = 9999
          $("#" + visit_id).html(visit_count.toLocaleString() + "명 방문")          
          $("#" + visit_id).animate({opacity: '1', marginTop:'0px'}, 500);

          if(visit_count < 1000){
            if( (visits[visit_check_count].split("_")).length >= 2){
              $("#" + visit_id).css({'width': '60px'});
            }
            else{
              $("#" + visit_id).css({'width': '80px'});
            }
          }
          else if(visit_count >= 1000 && visit_count < 10000){
            if( (visits[visit_check_count].split("_")).length >= 2){
              $("#" + visit_id).css({'width': '75px', 'left':'-8px'});
            }
            else{
              $("#" + visit_id).css({'width': '80px', 'left':'0px'});
            }
          }
          else{
            if( (visits[visit_check_count].split("_")).length >= 2){
              $("#" + visit_id).css({'width': '80px', 'left':'-10px'});
            }
            else{
              $("#" + visit_id).css({'width': '80px', 'left':'0px'});
            }            
          }
        }
      }      
      visit_check_count++
      showVisitInfo_lv1_lv2(visits, visit_check_count)
    })
  }
}

function showMarker(map, marker) {
  if (marker.getMap()) return;
  marker.setMap(map);
}

function hideMarker(map, marker) {
  if (!marker.getMap()) return;
  marker.setMap(null);
}

var temp_coord = ""
var temp_code = ""
var current_click = ""

function complexMarkerAction(marker_obj, visit_obj) {  
  return function(e) {
    //$('#baseModal').modal("hide")
    closeModal("baseModal")

    animateMarker(marker_obj, visit_obj)
    find_gungu = marker_obj['gungu']

    if(find_gungu == selectedSubRegion){
      complex_code = marker_obj['code']
      temp_code = marker_obj['code']
      for(var i in aptData.data){    
        apt_code = aptData.data[i]['검색코드'] + ""      
        if(apt_code == complex_code){          
          //현재 모달이 띄워져 있으면 숨기고, 0.35초 후에 새로 열기
          if($('#baseModal').is(':visible')){
            setTimeout(function(){
              showDetail(i);              
              //$('#baseModal').modal("show")
            }, 350)
          }
          else{
            showDetail(i);            
            //$('#baseModal').modal("show")
          }
          return;
        }
      }
    }
    else{      
      region_full = find_gungu.split("_")
      sido_name = region_full[1]

      temp_coord = new naver.maps.LatLng(Number(marker_obj['position']['y']), Number(marker_obj['position']['x']))
      temp_code = marker_obj['code']

      $("#sido").val(sido_name).prop("selected", true);
      optionChange(find_gungu)
      updateRegion()

      return;
    }
  }
}

function complexTopMarkerAction(marker_obj) {  
  return function(e) {
    //$('#baseModal').modal("hide")
    closeModal("baseModal")

    animateMarker(marker_obj)    

    complex_code = marker_obj['code']
    for(var i in aptData.data){    
      apt_code = aptData.data[i]['검색코드'] + ""      
      if(apt_code == complex_code){          
        //현재 모달이 띄워져 있으면 숨기고, 0.35초 후에 새로 열기
        if($('#baseModal').is(':visible')){
          setTimeout(function(){
            showTopDetail(i);              
            //$('#baseModal').modal("show")
            openModal("baseModal")
          }, 350)
        }
        else{          
          setTimeout(function(){
            showTopDetail(i);              
            //$('#baseModal').modal("show")
            openModal("baseModal")
          }, 350)
        }
        return;
      }
    }
  }
}

function level2MarkerAction(marker_obj) {  
  return function(e) {
    //$('#baseModal').modal("hide")
    closeModal("baseModal")
    move_to_center = marker_obj['position']
    move_to_zoom = 16
    sido = marker_obj['sido']
    gungu = marker_obj['gungu']

    if(selectedSubRegion == gungu){
      defaultMap.setCenter(move_to_center);
      defaultMap.setZoom(move_to_zoom);
      showHideMarker(move_to_zoom)
    }
    else{
      come_from_map = true;           
      $("#sido").val(sido).prop("selected", true);
      optionChange(gungu)
      defaultMap.setCenter(move_to_center);
      defaultMap.setZoom(move_to_zoom);
      updateRegion()
    }
  }
}

function level1MarkerAction(marker_obj) {  
  return function(e) {
    //$('#baseModal').modal("hide")
    closeModal("baseModal")
    move_to_center = marker_obj['position']
    move_to_zoom = 14
    sido = marker_obj['sido']
    gungu = marker_obj['gungu']

    if(selectedSubRegion == gungu){
      defaultMap.setCenter(move_to_center);
      defaultMap.setZoom(move_to_zoom);
      showHideMarker(move_to_zoom)
    }
    else{
      come_from_map = true;      
      $("#sido").val(sido).prop("selected", true);
      optionChange(gungu)
      defaultMap.setCenter(move_to_center);
      defaultMap.setZoom(move_to_zoom);
      updateRegion()
    }
  }
}

function level0MarkerAction(marker_obj) {  
  return function(e) {
    move_to_center = marker_obj['position']
    move_to_zoom = 10

    defaultMap.setCenter(move_to_center);
    defaultMap.setZoom(move_to_zoom);
    showHideMarker(move_to_zoom)

    //여기에 리스트 변경하는거 추가하자
  }
}

function createLargeMarker(markers){  
  //removeMarkers(complex_small_markers)
  complex_large_markers = []
  visit_display = []
  info_windows = []

  //var mobile_level_control = [15, 14, 13, 10, 7]
  var large_marker_size = 35

  if(isMobile && current_zoom == 15){
    large_marker_size = 45
  }

  var mapBounds = defaultMap.getBounds();
  //markers = markers.reverse()
  
  for (var k in markers){    
    if(mapBounds.hasLatLng(markers[k])){      
      var aptValue = Math.round(markers[k]["가치 총점"] * 100) / 100;
      complex_grade = setGrade(aptValue)
      coordi_x = markers[k]['lng']
      coordi_y = markers[k]['lat']

      marker_code = markers[k]['검색코드']

      var last_sales_raw = markers[k]["last_sales"]

      if(last_sales_raw == "BYG"){
        last_sales_price_kor = "분양"
        last_sales_area_kor = ""
      }
      else{
        var last_sales = last_sales_raw.split(",");
        var last_sales_date = last_sales[0].toString();
        var last_sales_price = last_sales[1].toString();
        var last_sales_area = last_sales[2];
        
        if (isNaN(last_sales_price)) {
          last_sales_price_kor = "정보없음"
          last_sales_area_kor = "--"
        } else {
          last_sales_price_kor = Math.round(last_sales_price / 100) / 100 + "억"
          last_sales_area_kor = last_sales_area
        }
      }

      var svg_color = "#CC0000"
      var grade = ""
      if(aptValue >= 78.6962){
        svg_color = "#a70000"
        //svg_color = "#5f0bbf"
        grade = "gradeS"
      }
      else if(aptValue < 78.6962 && aptValue >= 53.3691){
        svg_color = "#F72020"
        //svg_color = "#CC0000"
        grade = "gradeA"
      }
      else if(aptValue < 53.3691 && aptValue >= 31.9721){
        svg_color = "#F36637"
        grade = "gradeB"
      }
      else{
        svg_color = "#ED8618"
        grade = "gradeC"
      }

      var marker_color = "#fff"
      large_marker_BYG = ""      

      if(last_sales_raw == "BYG"){        
        marker_color = "#000"
        large_marker_BYG = "BYG"
      }

      var visit_marker_class = "visit_loc_large"
      var visit_marker_anchor_x = 9
      var visit_marker_anchor_y = 80

      var large_marker_anchor_x = 12
      var large_marker_anchor_y = 60

      if(isMobile && current_zoom == 15){
        visit_marker_class = "visit_loc_mid"
        visit_marker_anchor_x = 12
        visit_marker_anchor_y = 65

        large_marker_anchor_x = 12
        large_marker_anchor_y = 47
      }      

      var large_marker_id = 'large_marker_' + markers[k]['검색코드']
      var sPrice_marker_id = 'sPrice_' + markers[k]['검색코드']
      var area_marker_id = 'area_' + markers[k]['검색코드']

      svg_loc_large = `
      <svg version="1.1" class='large_marker ${grade}' id="${large_marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          viewBox="0 0 ${large_marker_size} ${large_marker_size}" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="68", height="60">
          
      <defs>
      <style>
      .${grade}{fill:${svg_color}}
      .large_marker_${grade} {stroke:${svg_color}; stroke-width:0.5;}
      .cls-2{fill:#fff;}      
      .cls-3_text{fill:#fff; font-size:8px; font-weight:600}
      .cls-4_text{fill:#000; font-size:7px; font-weight:600}
      .cls-5_text{fill:#000; font-size:5px; font-weight:600}
      .cls-6_text{fill:#000; font-size:4px; font-weight:600}
      </style>
      </defs>
      <g class="svg_loc_large">
      <path class="cls-1 large_marker_${grade}" d="M.12,12.29V8.81A.88.88,0,0,1,.55,8L15.31.47a3.07,3.07,0,0,1,2.83,0L33,8a.85.85,0,0,1,.43.77v3.48Z"/>
      <path class="cls-2 large_marker_${grade}" d="M.13,12.29V26.36c0,1.37.63,2.47,1.4,2.47H3.36L4.52,31l1.16,2.15L6.84,31,8,28.83H32.06c.78,0,1.41-1.1,1.41-2.47V12.29Z"/>
      <text class="cls-3_text" text-anchor="middle" x="16.5" y="10">${complex_grade}</text>
      <text class="cls-4_text" id="${sPrice_marker_id}" text-anchor="middle" x="17" y="20">${last_sales_price_kor}</text>
      <text class="cls-5_text" id="${area_marker_id}" text-anchor="middle" x="17" y="26">${last_sales_area_kor}</text>
      </g>
      </svg>
      `
      window["large_marker_obj_" + marker_code] = new naver.maps.Marker({
        position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
        icon: {
            content: svg_loc_large,
            size: new naver.maps.Size(24, 37),
            anchor: new naver.maps.Point(large_marker_anchor_x, large_marker_anchor_y),
            origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),           
        },
        zIndex: 100 + Number(k),
        map: defaultMap,
        apt_name : markers[k]['아파트명'],
        code : marker_code,
        gungu : markers[k]['gungu'],
        sido : markers[k]['sido'],
        address : markers[k]['법정동주소']
      });

      var visit_large_id = 'visit_complex_' + marker_code
      visit_loc_large = `      
      <div class='${visit_marker_class} ${grade}' id="${visit_large_id}"></div>      
      `
      window["visit_obj_" + marker_code] = new naver.maps.Marker({
        position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
        icon: {
            content: visit_loc_large,
            //size: new naver.maps.Size(24, 37),
            anchor: new naver.maps.Point(visit_marker_anchor_x, visit_marker_anchor_y),
            origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),            
        },
        code : "complex_" + marker_code,
        zIndex: 500 + Number(k),
        map: defaultMap,
      });

      visit_display.push(window["visit_obj_" + marker_code])
      complex_large_markers.push(window["large_marker_obj_" + marker_code])

      all_markers.push(window["large_marker_obj_" + marker_code])      
      all_markers.push(window["visit_obj_" + marker_code])
    }    
  }
  updateMarkers(defaultMap, complex_large_markers);
  updateVisits(defaultMap, visit_display);

  for(var i in complex_large_markers){    
    naver.maps.Event.addListener(complex_large_markers[i], 'click', complexMarkerAction(complex_large_markers[i], visit_display[i]));
    naver.maps.Event.addListener(complex_large_markers[i], 'mouseover', showUpInfo(complex_large_markers[i]));    
  }  
}

function createSmallMarker(markers){
  complex_small_markers = []
  var mapBounds = defaultMap.getBounds();

  //markers = markers.reverse()

  for (var k in markers){
    if(mapBounds.hasLatLng(markers[k])){

    var aptValue = Math.round(markers[k]["가치 총점"] * 100) / 100;
    complex_grade = setGrade(aptValue)  

    coordi_x = markers[k]['lng']
    coordi_y = markers[k]['lat']

    marker_code = markers[k]['검색코드']

    var last_sales_raw = markers[k]["last_sales"]

    if(last_sales_raw == "BYG"){
      last_sales_price_kor = "분양"
      last_sales_area_kor = "--"
    }
    else{
      var last_sales = last_sales_raw.split(",");
      var last_sales_date = last_sales[0].toString();
      var last_sales_price = last_sales[1].toString();
      var last_sales_area = last_sales[2];
      
      if (isNaN(last_sales_price)) {
        last_sales_price_kor = "정보없음"
        last_sales_area_kor = "--"
      } else {
        last_sales_price_kor = Math.round(last_sales_price / 100) / 100 + "억"
        last_sales_area_kor = last_sales_area
      }
    }

    var svg_color = "#a70000"
    var stroke_color = "#a70000"
    var grade = ""
    if(aptValue >= 78.6962){
      svg_color = "#a70000"
      //svg_color = "#5f0bbf"
      grade = "gradeS"
    }
    else if(aptValue < 78.6962 && aptValue >= 53.3691){
      svg_color = "#F72020"
      //svg_color = "#CC0000"
      grade = "gradeA"
    }
    else if(aptValue < 53.3691 && aptValue >= 31.9721){
      svg_color = "#F36637"
      grade = "gradeB"
    }
    else{
      svg_color = "#ED8618"
      grade = "gradeC"
    }
    
    var small_marker_id = 'small_marker_' + markers[k]['검색코드']

    svg_loc_small = `            
    <svg version="1.1" class='small_marker ${grade}' id="${small_marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="0 0 20 20" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="30", height="30">
    <defs>
    <style>
    .${grade}{fill:${svg_color}}
    .small_marker_${grade} {stroke:${stroke_color}; stroke-width:0.5}    
    .cls-2_small_text{fill:#fff; font-size:9px; font-weight:600}
    </style>
    </defs>
    <g class="svg_loc_small">
    <path class="cls-1_small small_marker_${grade}" d="M17.89,4.43,9.86.31a1.67,1.67,0,0,0-1.55,0L.36,4.43a.48.48,0,0,0-.24.42v9.58c0,.74.35,1.35.76,1.35h1l2.26,3.35,2.25-3.35h11c.41,0,.75-.61.75-1.35V4.86A.48.48,0,0,0,17.89,4.43Z"/>
    <text class="cls-2_small_text" text-anchor="middle" x="9" y="12">${complex_grade}</text>
    </g>
    </svg>
    `
    window["small_marker_obj_" + marker_code] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(12, 24),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 100,
      map: defaultMap,
      apt_name : markers[k]['아파트명'],
      code : markers[k]['검색코드'],
      gungu : markers[k]['gungu'],
      sido : markers[k]['sido'],
      address : markers[k]['법정동주소']
    });
    complex_small_markers.push(window["small_marker_obj_" + marker_code])
    all_markers.push(window["small_marker_obj_" + marker_code])
    }
  }

  updateMarkers(defaultMap, complex_small_markers);

  for(var i in complex_small_markers){    
    naver.maps.Event.addListener(complex_small_markers[i], 'click', complexMarkerAction(complex_small_markers[i]));
    naver.maps.Event.addListener(complex_small_markers[i], 'mouseover', showUpInfo(complex_small_markers[i]));
  }
}

function createLevel2Marker(markers){

  level2_markers = []
  visit_lv2_markers = []

  var mapBounds = defaultMap.getBounds();
  
  for(var i = 0 ; i < markers.length ; i++){
    full_name = markers[i]['법정동명']    
    //console.log(markers[i]['법정동명'])
    full_name_array = full_name.split(" ")
    dong_name = full_name_array[full_name_array.length-1]

    find_sido = ( markers[i]['name_en'].split("_") )[0]
    find_subRegion = markers[i]['find_link'] + "_" + markers[i]['name_en']
    name_en = markers[i]['name_en']
    
    if(mapBounds.hasLatLng(markers[i])){

      var marker_lv2_id = 'large_marker_' + markers[i]['name_en']
      var avg_price = ( Number(markers[i]['avg_price'])/10000 ).toFixed(2) + "억"
      if( avg_price == "0.00억"){
        avg_price = "--"
      }
      var region_grade = setGrade ( Number(markers[i]['avg_value']) )
      var lv2_marker_html = `

      <div class='lv2_marker'>
        <div class='lv2_marker_dong_name'>${dong_name}</div>
        <div class='lv2_marker_avg_price'>${avg_price}</div>        
      </div>      
      `
      var complex_marker_lv2 = new naver.maps.Marker({
        position: new naver.maps.LatLng(Number(markers[i]['lat']), Number(markers[i]['lng'])),
        icon: {
            content: lv2_marker_html,
            size: new naver.maps.Size(24, 37),
            anchor: new naver.maps.Point(8, 45),
            origin: new naver.maps.Point( Number(markers[i]['lat']), Number(markers[i]['lng']) ),
        },
        zIndex: 100,
        map: defaultMap,
        sido : find_sido,
        gungu : find_subRegion,        
      });

      /////      
      full_name = full_name.replace("세종시", "세종시 세종시")      
      var visit_lv2_id = 'visit_' + full_name.replaceAll(" ", "_")
      visit_loc_lv2 = `      
      <div class='visit_loc_lv2' id="${visit_lv2_id}"></div>      
      `
      window["visit_obj_" + name_en] = new naver.maps.Marker({
        position: new naver.maps.LatLng(Number(markers[i]['lat']), Number(markers[i]['lng'])),
        icon: {
            content: visit_loc_lv2,
            //size: new naver.maps.Size(24, 37),
            anchor: new naver.maps.Point(4, 65),
            origin: new naver.maps.Point( Number(markers[i]['lat']), Number(markers[i]['lng']) ),            
        },
        code : name_en,
        region : full_name.replaceAll(" ", "_"),
        zIndex: 500 + Number(i),
        map: defaultMap,
      });

      visit_lv2_markers.push(window["visit_obj_" + name_en])
      /////

      level2_markers.push(complex_marker_lv2)
      all_markers.push(complex_marker_lv2)
      all_markers.push(window["visit_obj_" + name_en])
    }
  }    

  updateMarkers(defaultMap, level2_markers);
  updateVisits_lv1_lv2(defaultMap, visit_lv2_markers);

  for(var i in level2_markers){    
    naver.maps.Event.addListener(level2_markers[i], 'click', level2MarkerAction(level2_markers[i]));
  }
}

function createLevel1Marker(markers){

  level1_markers = []
  visit_lv1_markers = []

  var mapBounds = defaultMap.getBounds();

  for(var i in markers){
    full_name = markers[i]['법정동명']
    //console.log(markers[i]['법정동명'])
    full_name_array = full_name.split(" ")
    dong_name = full_name_array[full_name_array.length-1]

    find_sido = ( markers[i]['name_en'].split("_") )[0]
    find_subRegion = markers[i]['find_link'] + "_" + markers[i]['name_en']
    name_en = markers[i]['name_en']

    if(mapBounds.hasLatLng(markers[i])){
      var marker_lv1_id = 'large_marker_' + markers[i]['name_en']
      var avg_price = ( Number(markers[i]['avg_price'])/10000 ).toFixed(2) + "억"
      if( avg_price == "0.00억"){
        avg_price = "--"
      }
      var region_grade = setGrade ( Number(markers[i]['avg_value']) )

      var lv1_marker_html = `

      <div class='lv1_marker'>
        <div class='lv1_marker_dong_name'>${dong_name}</div>
        <div class='lv1_marker_avg_price'>${avg_price}</div>        
      </div>      
      `

      var complex_marker_lv1 = new naver.maps.Marker({
        position: new naver.maps.LatLng(Number(markers[i]['lat']), Number(markers[i]['lng'])),
        icon: {
            content: lv1_marker_html,
            size: new naver.maps.Size(24, 37),
            anchor: new naver.maps.Point(8, 45),
            origin: new naver.maps.Point( Number(markers[i]['lat']), Number(markers[i]['lng']) )
        },
        zIndex: 100,
        map: defaultMap,
        sido : find_sido,
        gungu : find_subRegion
      });

      /////
      var visit_lv1_id = 'visit_' + full_name.replaceAll(" ", "_")      
      visit_loc_lv1 = `      
      <div class='visit_loc_lv1' id="${visit_lv1_id}"></div>      
      `
      window["visit_obj_" + name_en] = new naver.maps.Marker({
        position: new naver.maps.LatLng(Number(markers[i]['lat']), Number(markers[i]['lng'])),
        icon: {
            content: visit_loc_lv1,
            //size: new naver.maps.Size(24, 37),
            anchor: new naver.maps.Point(5, 65),
            origin: new naver.maps.Point( Number(markers[i]['lat']), Number(markers[i]['lng']) ),            
        },
        code : name_en,
        region : full_name.replaceAll(" ", "_"),
        zIndex: 500 + Number(i),
        map: defaultMap,
      });

      visit_lv1_markers.push(window["visit_obj_" + name_en])
      level1_markers.push(complex_marker_lv1)
      all_markers.push(complex_marker_lv1)
      all_markers.push(window["visit_obj_" + name_en])
    }
  }
  updateMarkers(defaultMap, level1_markers);
  updateVisits_lv1_lv2(defaultMap, visit_lv1_markers);

  for(var i in level1_markers){    
    naver.maps.Event.addListener(level1_markers[i], 'click', level1MarkerAction(level1_markers[i]));
  }
}

function createLevel0Marker(markers){

  level0_markers = []
  visit_lv0_markers = []

  var mapBounds = defaultMap.getBounds();

  for(var i in markers){
    full_name = markers[i]['법정동명']
    find_sido = markers[i]['name_en']    

    if(mapBounds.hasLatLng(markers[i])){
      var marker_lv0_id = 'large_marker_' + markers[i]['name_en']
      var avg_price = ( Number(markers[i]['avg_price'])/10000 ).toFixed(2) + "억"
      if( avg_price == "0.00억"){
        avg_price = "--"
      }
      var region_grade = setGrade ( Number(markers[i]['avg_value']) )

      var lv0_marker_html = `

      <div class='lv0_marker'>
        <div class='lv0_marker_dong_name'>${full_name}</div>
        <div class='lv0_marker_avg_price'>${avg_price}</div>        
      </div>      
      `

      var complex_marker_lv0 = new naver.maps.Marker({
        position: new naver.maps.LatLng(Number(markers[i]['lat']), Number(markers[i]['lng'])),
        icon: {
            content: lv0_marker_html,
            size: new naver.maps.Size(24, 37),
            anchor: new naver.maps.Point(8, 45),
            origin: new naver.maps.Point( Number(markers[i]['lat']), Number(markers[i]['lng']) )
        },
        zIndex: 100,
        map: defaultMap,
        sido : find_sido
      });

      /////
      var visit_lv0_id = 'visit_' + full_name.replaceAll(" ", "_")      
      visit_loc_lv0 = `      
      <div class='visit_loc_lv0' id="${visit_lv0_id}"></div>      
      `
      window["visit_obj_" + find_sido] = new naver.maps.Marker({
        position: new naver.maps.LatLng(Number(markers[i]['lat']), Number(markers[i]['lng'])),
        icon: {
            content: visit_loc_lv0,
            //size: new naver.maps.Size(24, 37),
            anchor: new naver.maps.Point(2, 65),
            origin: new naver.maps.Point( Number(markers[i]['lat']), Number(markers[i]['lng']) ),            
        },
        code : find_sido,
        region : full_name.replaceAll(" ", "_"),
        zIndex: 500 + Number(i),
        map: defaultMap,
      });

      visit_lv0_markers.push(window["visit_obj_" + find_sido])
      /////

      level0_markers.push(complex_marker_lv0)
      all_markers.push(complex_marker_lv0)
      all_markers.push(window["visit_obj_" + find_sido])
    }
  }
  updateMarkers(defaultMap, level0_markers);
  updateVisits_lv1_lv2(defaultMap, visit_lv0_markers);

  for(var i in level0_markers){    
    naver.maps.Event.addListener(level0_markers[i], 'click', level0MarkerAction(level0_markers[i]));
  }
}

var complex_top_markers = []

function createTopMarker(markers){  
  removeMarkers()

  complex_top_markers = []
  info_windows = []

  var mapBounds = defaultMap.getBounds();
  
  for (var k in markers){    
    if(mapBounds.hasLatLng(markers[k])){
      rank = markers[k]['rank']
      coordi_x = markers[k]['lng']
      coordi_y = markers[k]['lat']
      marker_code = markers[k]['검색코드']
      
      var last_sales_raw = markers[k]["last_sales"]

      if(last_sales_raw == "BYG"){
        last_sales_price_kor = "분양"
        last_sales_area_kor = "--"
      }
      else{
        var last_sales = last_sales_raw.split(",");
        var last_sales_date = last_sales[0].toString();
        var last_sales_price = last_sales[1].toString();
        var last_sales_area = last_sales[2];
        
        if (isNaN(last_sales_price)) {
          last_sales_price_kor = "정보없음"
          last_sales_area_kor = "--"
        } else {
          last_sales_price_kor = Math.round(last_sales_price / 100) / 100 + "억"
          last_sales_area_kor = last_sales_area
        }
      }

      //stroke_color = "#C50707"

      var svg_color = "#F72020"
      var top_marker_id = 'top_marker_' + markers[k]['검색코드']

      svg_loc_large = `
      <svg version="1.1" class='top_marker' id="${top_marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          viewBox="0 0 35 35" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="68", height="60">
          
      <defs>
      <style>
      .cls-1{fill:${svg_color}; stroke:${svg_color}; stroke-width:0.5}
      .cls-2{fill:#fff; stroke:${svg_color}; stroke-width:0.5}
      .cls-3_text{fill:#fff; font-size:8px; font-weight:600}
      .cls-4_text{fill:#000; font-size:7px; font-weight:600}            
      .cls-5_text{fill:#000; font-size:5px; font-weight:600}
      .cls-6_text{fill:#000; font-size:4px; font-weight:600}
      </style>
      </defs>
      <g class="svg_loc_large">
      <path class="cls-1" d="M.12,12.29V8.81A.88.88,0,0,1,.55,8L15.31.47a3.07,3.07,0,0,1,2.83,0L33,8a.85.85,0,0,1,.43.77v3.48Z"/>
      <path class="cls-2" d="M.13,12.29V26.36c0,1.37.63,2.47,1.4,2.47H3.36L4.52,31l1.16,2.15L6.84,31,8,28.83H32.06c.78,0,1.41-1.1,1.41-2.47V12.29Z"/>
      <text class="cls-3_text" text-anchor="middle" x="16.5" y="10">${rank}</text>
      <text class="cls-4_text" text-anchor="middle" x="17" y="20">${last_sales_price_kor}</text>
      <text class="cls-5_text" text-anchor="middle" x="17" y="26">${last_sales_area_kor}</text>
      </g>
      </svg>
      `
      window["top_marker_obj_" + marker_code] = new naver.maps.Marker({
        position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
        icon: {
            content: svg_loc_large,
            size: new naver.maps.Size(24, 37),
            anchor: new naver.maps.Point(12, 60),
            origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),           
        },
        zIndex: 100 + Number(k),
        map: defaultMap,
        apt_name : markers[k]['아파트명'],
        code : marker_code,
        rank : rank,
        address : markers[k]['법정동주소']
      });
      complex_top_markers.push(window["top_marker_obj_" + marker_code])
      all_markers.push(window["top_marker_obj_" + marker_code])      
    }    
  }
  updateMarkers(defaultMap, complex_large_markers);

  for(var i in complex_top_markers){    
    naver.maps.Event.addListener(complex_top_markers[i], 'click', complexTopMarkerAction(complex_top_markers[i]));
    naver.maps.Event.addListener(complex_top_markers[i], 'mouseover', showUpInfo(complex_top_markers[i]));    
  }  
}

function mapListModeChange(){
  if(mobile_mode == "map"){
    $("#dataList_wrapper").show()
    $("#dataMap").hide()
    $("#rearrange").css({'visibility' : 'visible'})    
    
    $("#mobile_map_list_icon").html("<i class='fa-solid fa-map'></i>")
    $("#mobile_map_list_text").html("지도보기")

    $("#filterOnOff").hide()
    $("#gradeSelector").hide()
    $("#graphButtonContainer").hide()

    mobile_mode = "list"
  }
  else if(mobile_mode == "list"){
    $("#dataList_wrapper").hide()
    $("#dataMap").show()    
    $("#rearrange").css({'visibility' : 'hidden'})

    $("#mobile_map_list_icon").html("<i class='fa-solid fa-list'></i>")
    $("#mobile_map_list_text").html("목록보기")

    $("#filterOnOff").show()    
    if(filter_ui){
      $("#gradeSelector").show()      
    }
    $("#graphButtonContainer").show()

    mobile_mode = "map"
  }
}

function setGradeFilter(){
  gradeS_checked = $("#check_grade_S").is(':checked')
  gradeA_checked = $("#check_grade_A").is(':checked')
  gradeB_checked = $("#check_grade_B").is(':checked')
  gradeC_checked = $("#check_grade_C").is(':checked')

  if(gradeS_checked){    $(".gradeS").show()  }
  else{    $(".gradeS").hide()  }

  if(gradeA_checked){    $(".gradeA").show()  }
  else{    $(".gradeA").hide()  }

  if(gradeB_checked){    $(".gradeB").show()  }
  else{    $(".gradeB").hide()  }

  if(gradeC_checked){    $(".gradeC").show()  }
  else{    $(".gradeC").hide()  }
  
}
