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
var colorCode = {
  '백화점'   : '#8B7C98',   // 더 진한 연보라 회색
  '아울렛'   : '#A0785A',   // 중간톤 브라운
  '마트'     : '#C29E00',   // 머스터드 → 골드에 가까운 진한 노랑
  '상권'     : '#ca614eff',   // 더 어두운 청록
  '은행'     : '#2E548C',   // 진한 블루 계열 (신뢰 강조)
  '병원'     : '#6BA4A0',   // 채도를 낮춘 진한 민트
  '대형병원' : '#4F7E88',   // 더 어두운 블루그린
  '공원'     : '#6C8D4E',   // 짙은 올리브 그린
  '대형공원' : '#4E744E',   // 톤다운된 짙은 녹색
  '혐오시설' : '#A24A4A',   // 어두운 브릭 레드

  '지하철역' : '#5A6F94',   // 어두운 그레이 블루
  '초등학교' : '#D1B02C',   // 진한 파스텔 옐로우
  '중학교'   : '#849A3C',   // 더 짙은 연녹색
  '학원가'   : '#7B5C97',   // 진한 보라
  '주점'     : '#934B65',   // 자주빛이 도는 와인 컬러
  '모텔'     : '#716C6A',   // 짙은 그레이 브라운
}
  */
var colorCode = {
  '백화점'   : '#6A5A94',   // 더 어두운 보라회색
  '아울렛'   : '#8B4F2E',   // 진한 브라운 오렌지
  '마트'     : '#D4AF00',   // 골드 계열에 가까운 노랑
  '상권'     : '#A24034',   // 채도 높은 진한 적갈색
  '은행'     : '#1D3C74',   // 깊은 블루 (신뢰 강조)
  '병원'     : '#448B85',   // 진한 민트
  '대형병원' : '#336970',   // 어두운 청록
  '공원'     : '#517D3A',   // 진한 그린 올리브
  '대형공원' : '#355E35',   // 더 어두운 톤다운 그린
  '혐오시설' : '#8B2F2F',   // 다크 브릭 레드

  '지하철역' : '#3F5682',   // 진한 그레이블루
  '초등학교' : '#C49B00',   // 채도 높은 골든 옐로우
  '중학교'   : '#6D872C',   // 깊은 연녹색
  '학원가'   : '#6A4792',   // 채도 높은 딥퍼플
  '주점'     : '#7A2F4A',   // 짙은 와인 자주
  '모텔'     : '#544F4D',   // 더 짙은 그레이브라운
}

var stroke_width = "6px"

var icon_size_width = 60
var icon_size_height = 60

var icon_size_width_small = 50
var icon_size_height_small = 50

var APT_marker_size_width = 80
var APT_marker_size_height = 80

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

function loadRadarMap(center_x, center_y, aptData){
  coord_y = center_y
  coord_x = center_x

  transportScore = aptData['교통총점']

  origin_yx = new naver.maps.LatLng(center_y, center_x);
  
  if(isMobile){
    dw = window.innerWidth
    dh = window.innerHeight
    zoom_control = true
    zoom_level = 16
    icon_size_width = 50
    icon_size_height = 50
    icon_size_width_small = 40
    icon_size_height_small = 40
    APT_marker_size_width = 70
    APT_marker_size_height = 70
    minZoom_limit = 12
  }
  else{
    dw = window.innerWidth - 500
    dh = window.innerHeight
    zoom_control = true
    zoom_level = 16
    minZoom_limit = 13
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

  defaultMap = new naver.maps.Map("dataMap", MapOptions);

  var bounds = defaultMap.getBounds(),
      southWest = bounds.getSW(),
      northEast = bounds.getNE(),
      lngSpan = northEast.lng() - southWest.lng(),
      latSpan = northEast.lat() - southWest.lat();

  aptCode = aptData["검색코드"]
  
  drawCircleOnMap(aptData)
  createAPTMarker(aptData)
  if (isNaN(transportScore) == false) {
    createMetroMarker(aptData)
  }  
  createInfraMarker(aptData)
  createEduMarker(aptData)

  $(".bank").hide()
  $(".hospital").hide()
  $(".park").hide()
  $(".harmful").hide()
  $(".drink").hide()
  $(".motel").hide()

  if(isMobile){
    defaultMap.panBy(new naver.maps.Point(0, 110));
  }  

  naver.maps.Event.addListener(defaultMap, 'idle', function() {  
  });

  naver.maps.Event.addListener(defaultMap, 'zoom_changed', function (zoom) {
    //zoom 변경 시 함수
    current_zoom = defaultMap.getZoom()

    if(current_zoom >= 16){
      $(".radius_250m").show()
      window['circle_250'].setMap(defaultMap)

      $(".radius_500m").show()      
      window['circle_500'].setMap(defaultMap)
    }
    if(current_zoom == 15){
      $(".radius_250m").hide()
      window['circle_250'].setMap(null)

      $(".radius_500m").show()
      window['circle_500'].setMap(defaultMap)
    }
    if(current_zoom == 14){
      $(".radius_250m").hide()
      window['circle_250'].setMap(null)

      $(".radius_500m").hide()
      window['circle_500'].setMap(null)

      $(".radius_1km").show()
      window['circle_1000'].setMap(defaultMap)
    }
    if(current_zoom <= 13){
      $(".radius_250m").hide()
      window['circle_250'].setMap(null)

      $(".radius_500m").hide()
      window['circle_500'].setMap(null)

      $(".radius_1km").hide()
      window['circle_1000'].setMap(null)
    }
  });
}

function moveLatLng(center, distance, direction) {
  const R = 6378137; // 지구 반지름 (m)
  const dLat = (distance / R) * (180 / Math.PI);
  const dLng = dLat / Math.cos(center.lat() * Math.PI / 180);

  switch (direction) {
    case 'N': return new naver.maps.LatLng(center.lat() + dLat, center.lng());
    case 'S': return new naver.maps.LatLng(center.lat() - dLat, center.lng());
    case 'E': return new naver.maps.LatLng(center.lat(), center.lng() + dLng);
    case 'W': return new naver.maps.LatLng(center.lat(), center.lng() - dLng);
  }
}

function drawCircleOnMap(aptInfo){
    lat = aptInfo['Y']
    lng = aptInfo['X']

    center = new naver.maps.LatLng(lat, lng);

    // 반경 리스트 (미터 단위)
    radii = [250, 500, 1000, 3000, 5000];

    // 원 색상 및 스타일
    colors = ['#e31939', '#e31939', '#e31939', '#e31939', '#e31939'];

    // 원 생성
    radii.forEach((radius, index) => {
      // 원 그리기
      window['circle_' + radius] = new naver.maps.Circle({
        map: defaultMap,
        center: center,
        radius: radius,
        strokeColor: colors[index % colors.length],
        strokeOpacity: 0.4,
        strokeWeight: 1,
        fillColor: colors[index % colors.length],
        fillOpacity: 0.0
      });

      // 거리 텍스트 표시 (동, 서, 남, 북)
      const directions = ['N', 'S', 'E', 'W'];
      directions.forEach(dir => {
        const pos = moveLatLng(center, radius, dir);
        
        if(radius >= 1000){
          radius_str = (radius/1000).toFixed(0) + "km"
        }
        else{
          radius_str = radius + "m"
        }
        add_class = "radius_" + radius_str
        new naver.maps.Marker({
          position: pos,
          map: defaultMap,          
          icon: {
            content: `<div class='distance_index ${add_class}'>${radius_str}</div>`,
            anchor: new naver.maps.Point(12, 12)
          }
        });
      });
    });
}

// 영역 배열 변환 함수
function convertToLatLngArray(rawCoords) {
  return rawCoords.map(coord => new naver.maps.LatLng(coord[1], coord[0]));
}

// 영역 폴리곤 그리는 함수
function drawPolygon(coords, options = {}) {
  const {
    map,
    strokeColor = '#FF0000',
    strokeOpacity = 0.8,
    strokeWeight = 2,
    fillColor = '#FF0000',
    fillOpacity = 0.3
  } = options;  

  const polygon = new naver.maps.Polygon({
    paths: coords,
    map: map,
    strokeColor,
    strokeOpacity,
    strokeWeight,
    fillColor,
    fillOpacity
  });

  return polygon;
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

var marker_z_depth = 500

var infoWindow

function showUpInfo(marker_obj){
  return function(e) {
    marker_z_depth += 1
    zoom = defaultMap.getZoom()
    marker_last_depth = marker_obj.getZIndex()
    if(marker_obj['centerPoint'] == true){}
    else{
      marker_obj.setZIndex(marker_z_depth += 1)
    }

    var complex_name = marker_obj['loc_name']
    //var complex_address = marker_obj['address']

    infoWindow_position = new naver.maps.Point(0, 0)

    infoWindow_content = `
    <div class='complex_info_window_radar'>
      <div id='info_window_complex_name'>${complex_name}</div>      
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

function complexMarkerAction(marker_obj) {  
  return function(e) {
    //$('#baseModal').modal("hide")
    closeModal("baseModal")

    animateMarker(marker_obj)
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

function createAPTMarker(markers){

  var large_marker_size = 40

  var mapBounds = defaultMap.getBounds();
  
  var aptValue = Math.round(markers["가치 총점"] * 100) / 100;
  complex_grade = setGrade(aptValue)  

  coordi_x = markers['X']
  coordi_y = markers['Y']

  marker_code = markers['검색코드']

  var last_sales_raw = markers["last_sales"]

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
  if(aptValue >= 70){
    svg_color = "#a70000"
    //svg_color = "#5f0bbf"
    grade = "gradeS"
  }
  else if(aptValue < 70 && aptValue >= 55){
    svg_color = "#F72020"
    //svg_color = "#CC0000"
    grade = "gradeA"
  }
  else if(aptValue < 55 && aptValue >= 40){
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

  var large_marker_anchor_x = 10
  var large_marker_anchor_y = 68

  var large_marker_id = 'large_marker_' + markers['검색코드']
  var sPrice_marker_id = 'sPrice_' + markers['검색코드']
  var area_marker_id = 'area_' + markers['검색코드']

  svg_loc_large = `
  <svg version="1.1" class='large_marker ${grade}' id="${large_marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="0 0 ${large_marker_size} ${large_marker_size}" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${APT_marker_size_width}", height="${APT_marker_size_height}">
      
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
  <filter id="shadow" x="0%" y="0%" width="200%" height="200%">
    <feDropShadow dx="4" dy="8" stdDeviation="2" flood-color="rgba(0,0,0,0.4)" />
  </filter>
  </defs>
  <g class="svg_loc_large">
  <path class="cls-1 large_marker_${grade}" filter="url(#shadow)" d="M.12,12.29V8.81A.88.88,0,0,1,.55,8L15.31.47a3.07,3.07,0,0,1,2.83,0L33,8a.85.85,0,0,1,.43.77v3.48Z"/>
  <path class="cls-2 large_marker_${grade}" filter="url(#shadow)" d="M.13,12.29V26.36c0,1.37.63,2.47,1.4,2.47H3.36L4.52,31l1.16,2.15L6.84,31,8,28.83H32.06c.78,0,1.41-1.1,1.41-2.47V12.29Z"/>
  <text class="cls-3_text" text-anchor="middle" x="16.5" y="10">${complex_grade}</text>
  <text class="cls-4_text" id="${sPrice_marker_id}" text-anchor="middle" x="17" y="20">${last_sales_price_kor}</text>
  <text class="cls-5_text" id="${area_marker_id}" text-anchor="middle" x="17" y="26">${last_sales_area_kor}</text>
  </g>
  </svg>
  `
  var radar_apt_marker = new naver.maps.Marker({
    position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
    icon: {
        content: svg_loc_large,
        size: new naver.maps.Size(24, 37),
        anchor: new naver.maps.Point(large_marker_anchor_x, large_marker_anchor_y),
        origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),           
    },
    zIndex: 1000,
    map: defaultMap,
    loc_name : markers['아파트명'],
    code : marker_code,
    gungu : markers['gungu'],
    sido : markers['sido'],
    address : markers['법정동주소'],
    centerPoint : true
  });

  //updateMarkers(defaultMap, complex_large_markers);
  //updateVisits(defaultMap, visit_display);
  naver.maps.Event.addListener(radar_apt_marker, 'click', complexMarkerAction(radar_apt_marker));
  //naver.maps.Event.addListener(radar_apt_marker, 'mouseover', showUpInfo(radar_apt_marker));
}

function createMetroMarker(aptData){
    coordi_x = aptData["역지점좌표"][1]
    coordi_y = aptData["역지점좌표"][0]
    metro_name = aptData["가까운역이름"]

    var svg_color = colorCode['지하철역']
    var stroke_color = "#ffffffff"
    var grade = ""    
    var marker_id = 'metro_marker'

    svg_loc_small = `            
    <svg version="1.1" class='trans_marker metro_station' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width}", height="${icon_size_height}">
    <defs>
    <style>
    .metro_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .metro_2{fill:none;}
    .metro_3{fill:#fff;}
    </style>
    </defs>
    <path class="metro_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <polygon class="metro_2" points="54.68 82.67 51.61 87.14 82.28 87.14 79.21 82.67 54.68 82.67"/>
    <path class="metro_3" d="M97.59,87.14H88.38l-3.07-4.47h7.3a4.86,4.86,0,0,0,5-4.72V24.53a4.71,4.71,0,0,0-2.87-4.27Q66.95,8,39.16,20.26a4.71,4.71,0,0,0-2.87,4.27V78a4.86,4.86,0,0,0,5,4.72h6.28l-3.07,4.47h-8.2a2.73,2.73,0,0,0,0,5.45h4.46L37.6,97.17a2.73,2.73,0,0,0,4.5,3.09l5.26-7.67H85.5l5.26,7.67a2.73,2.73,0,0,0,4.5-3.09l-3.14-4.58h5.47a2.73,2.73,0,0,0,0-5.45ZM55.5,21.07a1.23,1.23,0,0,1,1.23-1.23H77.16a1.23,1.23,0,0,1,1.23,1.23v3.54a1.23,1.23,0,0,1-1.23,1.23H56.73a1.23,1.23,0,0,1-1.23-1.23ZM43.65,34.78a3.5,3.5,0,0,1,3.5-3.49h39.6a3.49,3.49,0,0,1,3.49,3.49V49.59a3.49,3.49,0,0,1-3.49,3.49H47.15a3.5,3.5,0,0,1-3.5-3.49Zm0,35a5.63,5.63,0,1,1,5.63,5.63A5.63,5.63,0,0,1,43.65,69.77ZM51.1,87.14l3.07-4.47H78.7l3.07,4.47ZM79,69.77a5.63,5.63,0,1,1,5.63,5.63A5.63,5.63,0,0,1,79,69.77Z"/>
    </svg>
    `
    metro_marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width/2, icon_size_height/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 190,
      map: defaultMap,
      loc_name : metro_name + "역",
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: metro_name + "역",
      class: "trans_marker metro_station"
    });

    overlay.setMap(defaultMap)
    
    destination = new naver.maps.LatLng(coordi_y, coordi_x);

    metro_line = new naver.maps.Polyline({
      map: defaultMap,
      path: [origin_yx, destination],
      strokeColor: colorCode['지하철역'],
      strokeWeight: 2,
      strokeOpacity: 1,
      strokeStyle: 'shortdash'  // ← 점선
    });

    // 거리 계산 (단위: m)
    metro_distance = metro_line.getDistance()
    metro_distance = metro_distance.toFixed(0) + "m"

    // 중앙 좌표 계산
    midLat = (origin_yx.lat() + destination.lat()) / 2;
    midLng = (origin_yx.lng() + destination.lng()) / 2;
    midpoint = new naver.maps.LatLng(midLat, midLng);

    // 거리 표시용 커스텀 오버레이 생성
    metroDistanceLabel = new naver.maps.Marker({
        position: midpoint,
        map: defaultMap,
        icon: {
          content: `<div class='distance_index trans_marker' style='color:#fff; background:${colorCode['지하철역']}'>${metro_distance}</div>`,
          anchor: new naver.maps.Point(12, 12)
        }
      });

    //complex_small_markers.push(window["small_marker_obj_" + marker_code])
    //all_markers.push(window["small_marker_obj_" + marker_code])
 
    //naver.maps.Event.addListener(metro_marker 'click', complexMarkerAction(complex_small_markers[i]));
    //if(!isMobile){
    //  naver.maps.Event.addListener(metro_marker, 'mouseover', showUpInfo(metro_marker));
    //}

}

var infra_markers = []
var infra_department_store_markers = []
var infra_mall_markers = []
var infra_mart_markers = []
var infra_market_markers = []
var infra_market_polygons = []
var infra_bank_markers = []
var infra_hospital_markers = []
var infra_big_hospital_markers = []
var infra_park_markers = []
var infra_big_park_markers = []
var infra_harmful_markers = []

function createInfraMarker(aptData){
  //백화점
  infra_department_store_markers = []
  department_store_arr = aptData["백화점정보"]

  for (var k in department_store_arr){
    department_store_name = department_store_arr[k][0]
    coordi_x = department_store_arr[k][1][1]
    coordi_y = department_store_arr[k][1][0]    

    var svg_color = colorCode['백화점']
    var stroke_color = "#ffffff"
    var grade = ""    
    var marker_id = 'department_store_marker_' + k

    svg_loc_small = `            
    <svg version="1.1" class='infra_marker department_store' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width}", height="${icon_size_height}">
    <defs>
    <style>
    .department_store_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .department_store_2{fill:#ffffff;}
    </style>
    </defs>
    <path class="department_store_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <ellipse class="department_store_2" cx="91.59" cy="94.77" rx="8.16" ry="7.35"/>
    <path class="department_store_2" d="M50.46,87.42c-4.51,0-8.16,3.3-8.16,7.35s3.66,7.35,8.16,7.35,8.16-3.3,8.16-7.35C58.78,90.72,55.12,87.42,50.46,87.42Z"/>
    <path class="department_store_2" d="M55.12,68.62H85.68a8.34,8.34,0,0,0,7.18-3.81l14.65-23.72a3.74,3.74,0,0,0,.56-1.78A3.89,3.89,0,0,0,104,35.64H43.13L39.2,28.28H25.82V35.5H34L48.77,63.55l-5.49,9a6.18,6.18,0,0,0-1,3.55c0,4.07,3.66,7.35,8.16,7.35H99.75V76.1H52.29a.91.91,0,0,1-1-.88.84.84,0,0,1,.15-.51ZM88.57,56.39V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Zm-11.16,0V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Zm-11.17,0V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Zm-11.17,0V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Z"/>
    </svg>
    `
    window["department_store_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width/2, icon_size_height/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 180,
      map: defaultMap,
      loc_name : department_store_name,      
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: department_store_name,
      class: "infra_marker department_store"
    });

    overlay.setMap(defaultMap)    

    infra_department_store_markers.push(window["department_store_marker_" + k])
    all_markers.push(window["department_store_marker_" + k])
  }

  //updateMarkers(defaultMap, complex_small_markers);
/*
  if(isMobile){
    infoWindow_content = `
    <div class='loc_info_window_radar infra_marker'>
      <div class='info_window_loc_name'>${department_store_name}</div>      
    </div>
    `
    info_window_test = new naver.maps.InfoWindow({
      content: infoWindow_content,
      disableAnchor: true,
      backgroundColor: false,
      borderWidth: 0,        
      pixelOffset: new naver.maps.Point(icon_size_width/10, 0)
    })
    info_window_test.open(defaultMap, window["department_store_marker_" + k]);
  }
    */

  //for(var i in infra_department_store_markers){    
    //naver.maps.Event.addListener(infra_department_store_markers[i], 'click', complexMarkerAction(infra_department_store_markers[i]));
    //naver.maps.Event.addListener(infra_department_store_markers[i], 'mouseover', showUpInfo(infra_department_store_markers[i]));
  //}

  //아울렛, 몰  
  infra_mall_markers = []
  mall_arr = aptData["아울렛몰정보"]

  for (var k in mall_arr){
    mall_name = mall_arr[k][0]
    coordi_x = mall_arr[k][1][1]
    coordi_y = mall_arr[k][1][0]    

    var svg_color = colorCode['아울렛']
    var stroke_color = "#FFFFFF"
    var grade = ""    
    var marker_id = 'mall_marker_' + k

    svg_loc_small = `            
    <svg version="1.1" class='infra_marker mall' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width}", height="${icon_size_height}">
    <defs>
    <style>
    .infra_mall_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .infra_mall_2{fill:#fff;}
    </style>
    </defs>    
    <path class="infra_mall_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <ellipse class="infra_mall_2" cx="91.59" cy="94.77" rx="8.16" ry="7.35"/>
    <path class="infra_mall_2" d="M50.46,87.42c-4.51,0-8.16,3.3-8.16,7.35s3.66,7.35,8.16,7.35,8.16-3.3,8.16-7.35C58.78,90.72,55.12,87.42,50.46,87.42Z"/>
    <path class="infra_mall_2" d="M55.12,68.62H85.68a8.34,8.34,0,0,0,7.18-3.81l14.65-23.72a3.74,3.74,0,0,0,.56-1.78A3.89,3.89,0,0,0,104,35.64H43.13L39.2,28.28H25.82V35.5H34L48.77,63.55l-5.49,9a6.18,6.18,0,0,0-1,3.55c0,4.07,3.66,7.35,8.16,7.35H99.75V76.1H52.29a.91.91,0,0,1-1-.88.84.84,0,0,1,.15-.51ZM88.57,56.39V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Zm-11.16,0V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Zm-11.17,0V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Zm-11.17,0V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Z"/>
    </svg>
    `
    window["mall_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width/2, icon_size_height/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 180,
      map: defaultMap,
      loc_name : mall_name,      
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: mall_name,
      class: "infra_marker mall"
    });

    overlay.setMap(defaultMap)    

    infra_mall_markers.push(window["mall_marker_" + k])
    all_markers.push(window["mall_marker_" + k])
  }

  //updateMarkers(defaultMap, complex_small_markers);

  //for(var i in infra_mall_markers){    
    //naver.maps.Event.addListener(infra_mall_markers[i], 'click', complexMarkerAction(infra_mall_markers[i]));
    //naver.maps.Event.addListener(infra_mall_markers[i], 'mouseover', showUpInfo(infra_mall_markers[i]));
  //}

  //마트
  infra_mart_markers = []
  mart_arr = aptData["대형마트정보"]

  for (var k in mart_arr){
    mart_name = mart_arr[k][0]
    coordi_x = mart_arr[k][1][1]
    coordi_y = mart_arr[k][1][0]    

    var svg_color = colorCode['마트']
    var stroke_color = "#FFFFFF"
    var grade = ""    
    var marker_id = 'mart_marker_' + k

    svg_loc_small = `            
    <svg version="1.1" class='infra_marker mart' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width}", height="${icon_size_height}">
    <defs>
    <style>
    .infra_mart_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .infra_mart_2{fill:#fff;}
    </style>
    </defs>    
    <path class="infra_mart_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <ellipse class="infra_mart_2" cx="91.59" cy="94.77" rx="8.16" ry="7.35"/>
    <path class="infra_mart_2" d="M50.46,87.42c-4.51,0-8.16,3.3-8.16,7.35s3.66,7.35,8.16,7.35,8.16-3.3,8.16-7.35C58.78,90.72,55.12,87.42,50.46,87.42Z"/>
    <path class="infra_mart_2" d="M55.12,68.62H85.68a8.34,8.34,0,0,0,7.18-3.81l14.65-23.72a3.74,3.74,0,0,0,.56-1.78A3.89,3.89,0,0,0,104,35.64H43.13L39.2,28.28H25.82V35.5H34L48.77,63.55l-5.49,9a6.18,6.18,0,0,0-1,3.55c0,4.07,3.66,7.35,8.16,7.35H99.75V76.1H52.29a.91.91,0,0,1-1-.88.84.84,0,0,1,.15-.51ZM88.57,56.39V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Zm-11.16,0V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Zm-11.17,0V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Zm-11.17,0V44.12a1,1,0,0,1,2,0v14a1,1,0,0,1-2,0Z"/>
    </svg>
    `
    window["mart_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width/2, icon_size_height/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 180,
      map: defaultMap,
      loc_name : mart_name,      
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: mart_name,
      class: "infra_marker mart"
    });

    overlay.setMap(defaultMap)
    
    infra_mart_markers.push(window["mart_marker_" + k])
    all_markers.push(window["mart_marker_" + k])
  }

  //updateMarkers(defaultMap, complex_small_markers);

  //for(var i in infra_mart_markers){    
    //naver.maps.Event.addListener(infra_mall_markers[i], 'click', complexMarkerAction(infra_mall_markers[i]));
    //naver.maps.Event.addListener(infra_mart_markers[i], 'mouseover', showUpInfo(infra_mart_markers[i]));
  //}

  //상권
  infra_market_markers = []
  infra_market_polygons = []
  market_arr = aptData["상권좌표"]
  market_area_arr = aptData["상권영역"]

  for (var k in market_arr){
    loc_name = "상권"
    coordi_x = market_arr[k][1]
    coordi_y = market_arr[k][0]
    rawCoords = market_area_arr[k]

    market_coords = convertToLatLngArray(rawCoords)    
    window['market_polygon' + k] = drawPolygon(market_coords, { map: defaultMap, strokeColor: colorCode['상권'], fillColor: colorCode['상권'], fillOpacity: 0.2 });
    infra_market_polygons.push(window['market_polygon' + k])

    var svg_color = colorCode['상권']
    var stroke_color = "#FFFFFF"
    var grade = ""    
    var marker_id = 'market_marker_' + (k+1)

    svg_loc_small = `            
    <svg version="1.1" class='infra_marker market' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width}", height="${icon_size_height}">
    <defs>
    <style>
    .market_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .market_2{fill:#fff;}
    </style>
    </defs>
    <path class="market_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <path class="market_2" d="M97.77,71.6A2,2,0,0,0,99.13,71l1.81-1.82a1.92,1.92,0,0,0-2.71-2.71l-1.81,1.81a1.92,1.92,0,0,0,1.35,3.28Z"/>
    <path class="market_2" d="M109.51,47.16l-8.89-20.75a9.57,9.57,0,0,0-8.8-5.8H42.07a9.57,9.57,0,0,0-8.8,5.8L24.38,47.16a1.92,1.92,0,0,0,1.76,2.68h.8v.57a6.77,6.77,0,0,0,2,4.73A6.67,6.67,0,0,0,31,56.57V86.5a5,5,0,0,0,4.83,5l-.72,4.36A1.91,1.91,0,0,0,37,98.12H57a1.94,1.94,0,0,0,1.46-.67,1.88,1.88,0,0,0,.43-1.56l-3.62-22.1a1.92,1.92,0,0,0-1.9-1.61H40.65a1.91,1.91,0,0,0-1.89,1.61L36.47,87.71h-.4a1.21,1.21,0,0,1-1.21-1.21V57.09h1.93a6.64,6.64,0,0,0,4.73-2l0,0,0,0a6.67,6.67,0,0,0,4.73,2h3.17a6.63,6.63,0,0,0,4.72-2l0,0,0,0a6.68,6.68,0,0,0,4.72,2h3.17a6.64,6.64,0,0,0,4.73-2l0,0,0,0a6.64,6.64,0,0,0,4.73,2h3.17a6.72,6.72,0,0,0,4.72-2l0,0,0,0a6.63,6.63,0,0,0,4.72,2h3.17a6.67,6.67,0,0,0,4.73-2l0,0,0,0a6.69,6.69,0,0,0,4.73,2h.23v3.42H93.79a3.38,3.38,0,0,0-3.38,3.38v.55H89.26v-1a3,3,0,0,0-3-3H71.39a3,3,0,0,0-3,3v24H63.32a1.92,1.92,0,0,0,0,3.84h32.8a5,5,0,0,0,5-5V82.21a1.92,1.92,0,0,0-3.84,0V86.3a1.16,1.16,0,0,1-.35.83,1.19,1.19,0,0,1-.86.35H89.26V74.93h1.19a3.37,3.37,0,0,0,3.34,3h10.8A3.39,3.39,0,0,0,108,74.57V63.89a3.38,3.38,0,0,0-3.38-3.38h-3.42V57A6.68,6.68,0,0,0,107,50.41v-.57h.8a1.92,1.92,0,0,0,1.6-.86A2,2,0,0,0,109.51,47.16ZM42.28,76h9.43l3,18.26H39.28Zm48.13-4.93H89.26V68.28h1.15Zm13.72-6.74v9.76H94.25V64.35ZM92.33,46H29.05L36.8,27.93a5.72,5.72,0,0,1,5.27-3.48H91.82a5.72,5.72,0,0,1,5.27,3.48L104.84,46Z"/>
    <path class="market_2" d="M48.81,80.68H45.18a1.92,1.92,0,0,0,0,3.84h3.63a1.92,1.92,0,1,0,0-3.84Z"/>
    <path class="market_2" d="M48.81,85.9H45.18a1.92,1.92,0,0,0,0,3.84h3.63a1.92,1.92,0,1,0,0-3.84Z"/>
    </svg>

    `
    window["market_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width/2, icon_size_height/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 150,
      map: defaultMap,
      loc_name : loc_name,
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: loc_name,
      class: "infra_marker market"
    });

    overlay.setMap(defaultMap)

    infra_market_markers.push(window["market_marker_" + k])
    all_markers.push(window["market_marker_" + k])
  }

  //updateMarkers(defaultMap, complex_small_markers);

  //for(var i in infra_market_markers){    
    //naver.maps.Event.addListener(infra_market_markers[i], 'click', complexMarkerAction(infra_mall_markers[i]));
    //naver.maps.Event.addListener(infra_market_markers[i], 'mouseover', showUpInfo(infra_market_markers[i]));
  //}

  //은행
  infra_bank_markers = []
  bank_arr = aptData["은행정보"]

  for (var k in bank_arr){
    bank_name = bank_arr[k][0]
    coordi_x = bank_arr[k][1][1]
    coordi_y = bank_arr[k][1][0]    

    var svg_color = colorCode['은행']
    var stroke_color = "#FFFFFF"
    var grade = ""    
    var marker_id = 'bank_marker_' + k

    svg_loc_small = `            
    <svg version="1.1" class='infra_marker bank' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width_small}", height="${icon_size_height_small}">
    <defs>
    <style>
    .bank_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .bank_2{fill:#fff;}
    </style>
    </defs>    
    <path class="bank_1" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <path class="bank_2" d="M74,78.72a.28.28,0,0,0,.53,0l1-5.64H72.83Z"/>
    <path class="bank_2" d="M59.39,78.7a.27.27,0,0,0,.52,0l1.2-5.64H58.45Z"/>
    <polygon class="bank_2" points="66.8 64.08 65.88 70.41 68.2 70.41 66.97 64.08 66.8 64.08"/>
    <path class="bank_2" d="M97.61,61.87A44.14,44.14,0,0,0,83.72,47h0L77.08,42.5c.94-2,3-6.42,5-10.54a6.05,6.05,0,0,0-1.17-6.83,8,8,0,0,0-7.37-2.22l-2.6.51a4.34,4.34,0,0,1-3.23-.62l-2.93-1.95a8.28,8.28,0,0,0-6-1.2l-.62.11a7.61,7.61,0,0,0-4.8,2.89,6.09,6.09,0,0,0-1,5.07L56.12,43l-5.95,4a44.14,44.14,0,0,0-13.89,14.9,38.65,38.65,0,0,0-5,18.83v.91c0,9.79,9,17.75,20,17.75H82.6c11,0,20-8,20-17.75V80.7A38.65,38.65,0,0,0,97.61,61.87ZM52.78,94.64h0c-.42,0-10.27-.24-14-8.87a1.52,1.52,0,0,1,1-2,1.85,1.85,0,0,1,2.29.9c2.9,6.67,10.7,6.86,10.78,6.86a1.58,1.58,0,1,1,0,3.14ZM86,72.76a.33.33,0,0,1-.35.31h-5l-3,11.64a.6.6,0,0,1-.6.43H71.35a.35.35,0,0,1-.35-.26L68.71,73.07H65.49l-.09.58L63,84.68a.59.59,0,0,1-.6.46H56.85a.61.61,0,0,1-.6-.43L53.17,73.07H48.11a.33.33,0,0,1-.35-.31l0-2a.33.33,0,0,1,.35-.31h4.39L49.24,58.2a.57.57,0,0,1,.6-.68h5.71a.34.34,0,0,1,.34.26L58,70.41h3.67L64,59.55a.34.34,0,0,1,.35-.25h5.5a.33.33,0,0,1,.34.25L72.3,70.41H76l2.31-12.62a.34.34,0,0,1,.35-.27h5.27a.57.57,0,0,1,.6.67L81.34,70.41h4.31a.33.33,0,0,1,.35.31Z"/>
    </svg>    

    `
    window["bank_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width_small/2, icon_size_height_small/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 100,
      map: defaultMap,
      loc_name : bank_name,      
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: bank_name,
      class: "infra_marker bank"
    });

    overlay.setMap(defaultMap)

    infra_bank_markers.push(window["bank_marker_" + k])
    all_markers.push(window["bank_marker_" + k])
  }

  //updateMarkers(defaultMap, complex_small_markers);

  //for(var i in infra_bank_markers){    
    //naver.maps.Event.addListener(infra_mall_markers[i], 'click', complexMarkerAction(infra_mall_markers[i]));
    //naver.maps.Event.addListener(infra_bank_markers[i], 'mouseover', showUpInfo(infra_bank_markers[i]));
  //}

  //병원
  infra_hospital_markers = []
  hospital_arr = aptData["병원정보"]

  for (var k in hospital_arr){
    hospital_name = hospital_arr[k][0]
    coordi_x = hospital_arr[k][1][1]
    coordi_y = hospital_arr[k][1][0]    

    var svg_color = colorCode['병원']
    var stroke_color = "#FFFFFF"
    var grade = ""    
    var marker_id = 'hospital_marker_' + k

    svg_loc_small = `            
    <svg version="1.1" class='infra_marker hospital' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width_small}", height="${icon_size_height_small}">
    <defs>
    <style>
    .hospital_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .hospital_2{fill:#fff;}
    </style>
    </defs>
    <path class="hospital_1" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <path class="hospital_2" d="M101.44,43.12h-18v-18a1,1,0,0,0-1-1h-31a1,1,0,0,0-1,1v18h-18a1,1,0,0,0-1,1v31a1,1,0,0,0,1,1h18v18a1,1,0,0,0,1,1h31a1,1,0,0,0,1-1v-18h18a1,1,0,0,0,1-1v-31A1,1,0,0,0,101.44,43.12Z"/>
    </svg>    

    `
    window["hospital_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width_small/2, icon_size_height_small/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 100,
      map: defaultMap,
      loc_name : hospital_name,      
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: hospital_name,
      class: "infra_marker hospital"
    });

    overlay.setMap(defaultMap)

    infra_hospital_markers.push(window["hospital_marker_" + k])
    all_markers.push(window["hospital_marker_" + k])
  }

  //updateMarkers(defaultMap, complex_small_markers);

  //for(var i in infra_hospital_markers){    
    //naver.maps.Event.addListener(infra_mall_markers[i], 'click', complexMarkerAction(infra_mall_markers[i]));
    //naver.maps.Event.addListener(infra_hospital_markers[i], 'mouseover', showUpInfo(infra_hospital_markers[i]));
  //}

  //대형병원
  infra_big_hospital_markers = []
  big_hospital_arr = aptData["종합병원정보"]

  for (var k in big_hospital_arr){
    big_hospital_name = big_hospital_arr[k][0]
    coordi_x = big_hospital_arr[k][1][1]
    coordi_y = big_hospital_arr[k][1][0]    

    var svg_color = colorCode['대형병원']
    var stroke_color = "#FFFFFF"
    var grade = ""    
    var marker_id = 'big_hospital_marker_' + k

    svg_loc_small = `            
    <svg version="1.1" class='infra_marker big_hospital' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width}", height="${icon_size_height}">
    <defs>
    <style>
    .infra_big_hospital_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .infra_big_hospital_2{fill:#fff;}
    </style>
    </defs>    
    <path class="infra_big_hospital_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <path class="infra_big_hospital_2" d="M86.27,102.12H47.64a4.7,4.7,0,0,1-4.7-4.69V83.12H28.64a4.7,4.7,0,0,1-4.7-4.69V40.8a4.69,4.69,0,0,1,4.68-4.68H42.94V21.8a4.69,4.69,0,0,1,4.68-4.68H86.26a4.69,4.69,0,0,1,4.68,4.69V36.12h14.32a4.69,4.69,0,0,1,4.68,4.69V78.44a4.68,4.68,0,0,1-4.68,4.68H90.94V97.44A4.68,4.68,0,0,1,86.27,102.12Zm-57.65-62a.69.69,0,0,0-.68.68V78.43a.7.7,0,0,0,.7.69h18.3V97.43a.7.7,0,0,0,.7.69H86.27a.67.67,0,0,0,.67-.68V79.12h18.32a.67.67,0,0,0,.68-.68V40.81a.68.68,0,0,0-.68-.69H86.94V21.81a.68.68,0,0,0-.68-.69H47.62a.69.69,0,0,0-.68.68V40.12Z"/>
    <path class="infra_big_hospital_2" d="M100,43.82H82.75V26.58a1,1,0,0,0-1-1H52.1a1,1,0,0,0-1,1V43.82H33.9a1,1,0,0,0-1,1V74.47a1,1,0,0,0,1,1H51.14V92.66a1,1,0,0,0,1,1H81.79a1,1,0,0,0,1-1V75.42H100a1,1,0,0,0,1-1V44.78A1,1,0,0,0,100,43.82Z"/>
    </svg>
    `
    window["big_hospital_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width/2, icon_size_height/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 160,
      map: defaultMap,
      loc_name : big_hospital_name,      
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: big_hospital_name,
      class: "infra_marker big_hospital"
    });

    overlay.setMap(defaultMap)

    infra_big_hospital_markers.push(window["big_hospital_marker_" + k])
    all_markers.push(window["big_hospital_marker_" + k])
  }

  //updateMarkers(defaultMap, complex_small_markers);

  //for(var i in infra_big_hospital_markers){    
    //naver.maps.Event.addListener(infra_mall_markers[i], 'click', complexMarkerAction(infra_mall_markers[i]));
    //naver.maps.Event.addListener(infra_big_hospital_markers[i], 'mouseover', showUpInfo(infra_big_hospital_markers[i]));
  //}

  //공원
  infra_park_markers = []
  park_arr = aptData["공원정보"]

  for (var k in park_arr){
    park_name = park_arr[k][0]
    park_name.replace("공원", "") + "공원"
    coordi_x = park_arr[k][1][1]
    coordi_y = park_arr[k][1][0]    

    var svg_color = colorCode['공원']
    var stroke_color = "#FFFFFF"
    var grade = ""    
    var marker_id = 'park_marker_' + k

    svg_loc_small = `            
    <svg version="1.1" class='infra_marker park' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width_small}", height="${icon_size_height_small}">
    <defs>
    <style>
    .park_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .park_2{fill:#fff;}
    .park_3{fill:none;}
    </style>
    </defs>
    <path class="park_1" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <path class="park_2" d="M98.49,25.5a3.66,3.66,0,0,0-2.88-1c-1.5.13-37,3.5-50.65,17.18-12.81,12.82-11.54,29-5.51,37.81L40,80l1.38,1.3c-.33.64-.66,1.28-1,1.93A123.55,123.55,0,0,0,34.5,98.49c-1.15,3.64,4.56,5.2,5.71,1.57A112.46,112.46,0,0,1,46,85.38,26.92,26.92,0,0,0,59.6,88.94,31.88,31.88,0,0,0,82.32,79C96,65.36,99.37,29.87,99.53,28.37A3.62,3.62,0,0,0,98.49,25.5Zm-6.71,9.36A61.11,61.11,0,0,0,77.45,44,125.26,125.26,0,0,0,57.7,65.31a131.45,131.45,0,0,0-7.76,11.4c-1.47,2.45-5.3.22-3.84-2.25.85-1.42,1.76-2.81,2.67-4.18A158.91,158.91,0,0,1,64.56,50.16c7.11-7.65,15.33-14.88,25-19.13a2.27,2.27,0,0,1,3,.79A2.24,2.24,0,0,1,91.78,34.86Z"/>
    <polygon class="park_3" points="54.4 66.67 51.33 71.14 82 71.14 78.93 66.67 54.4 66.67"/>
    </svg>    

    `
    window["park_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width_small/2, icon_size_height_small/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 100,
      map: defaultMap,
      loc_name : park_name,      
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: park_name,
      class: "infra_marker park"
    });

    overlay.setMap(defaultMap)

    infra_park_markers.push(window["park_marker_" + k])
    all_markers.push(window["park_marker_" + k])
  }

  //updateMarkers(defaultMap, complex_small_markers);

  //for(var i in infra_park_markers){    
    //naver.maps.Event.addListener(infra_mall_markers[i], 'click', complexMarkerAction(infra_mall_markers[i]));
    //naver.maps.Event.addListener(infra_park_markers[i], 'mouseover', showUpInfo(infra_park_markers[i]));
  //}
  
  //대형공원
  infra_big_park_markers = []
  big_park_arr = aptData["대형공원정보"]

  for (var k in big_park_arr){
    big_park_name = big_park_arr[k][0][0]
    big_park_name.replace("공원", "") + "공원"
    coordi_x = big_park_arr[k][1][1]
    coordi_y = big_park_arr[k][1][0]    

    var svg_color = colorCode['대형공원']
    var stroke_color = "#FFFFFF"
    var grade = ""    
    var marker_id = 'big_park_marker_' + k

    svg_loc_small = `            
    <svg version="1.1" class='infra_marker big_park' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width}", height="${icon_size_height}">
    <defs>
    <style>
    .infra_big_park_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .infra_big_park_2{fill:#fff;}
    </style>
    </defs>    
    <path class="infra_big_park_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <path class="infra_big_park_2" d="M49.87,16.68A20.75,20.75,0,0,0,29.12,37.43v25.4a20.75,20.75,0,0,0,19,20.67V68.17l-10-10a1.75,1.75,0,0,1,2.48-2.48l7.49,7.49V51.56l-10-10a1.75,1.75,0,0,1,2.48-2.47l7.49,7.49V34.08a1.75,1.75,0,0,1,3.5,0V46.62l7.49-7.5a1.75,1.75,0,0,1,2.48,2.47l-10,10V63.23l7.49-7.5a1.75,1.75,0,0,1,2.48,2.48l-10,10V83.5h0a20.76,20.76,0,0,0,19-20.67V37.43A20.75,20.75,0,0,0,49.87,16.68Z"/>
    <path class="infra_big_park_2" d="M97.52,44.49A19.15,19.15,0,0,0,70.63,47.6V62.83a20.86,20.86,0,0,1-1.18,6.91,19.12,19.12,0,0,0,14.42,8.82V67l-7.53-7.54A1.75,1.75,0,0,1,78.81,57L83.87,62V51.24a1.75,1.75,0,0,1,3.5,0V62L92.44,57h0a1.73,1.73,0,0,1,2.47,0,1.75,1.75,0,0,1,0,2.47L87.37,67v11.6A19.15,19.15,0,0,0,97.52,44.49Z"/>
    <path class="infra_big_park_2" d="M111.94,96.26H87.37V78.56c-.57,0-1.15.09-1.73.09s-1.18,0-1.77-.09v17.7H51.62V83.5c-.58,0-1.16.09-1.75.09s-1.17,0-1.75-.09V96.26H21.94a1.75,1.75,0,1,0,0,3.5h90a1.75,1.75,0,0,0,0-3.5Z"/>
    </svg>
    `
    window["big_park_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width/2, icon_size_height/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 160,
      map: defaultMap,
      loc_name : big_park_name,      
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: big_park_name,
      class: "infra_marker big_park"
    });

    overlay.setMap(defaultMap)

    infra_big_park_markers.push(window["big_park_marker_" + k])
    all_markers.push(window["big_park_marker_" + k])
  }

  //updateMarkers(defaultMap, complex_small_markers);

  //for(var i in infra_big_park_markers){    
    //naver.maps.Event.addListener(infra_mall_markers[i], 'click', complexMarkerAction(infra_mall_markers[i]));
    //naver.maps.Event.addListener(infra_big_park_markers[i], 'mouseover', showUpInfo(infra_big_park_markers[i]));
  //}

  //혐오시설
  infra_harmful_markers = []
  harmful_arr = aptData["혐오시설정보"]

  for (var k in harmful_arr){
    harmful_name = harmful_arr[k][0]
    coordi_x = harmful_arr[k][1][1]
    coordi_y = harmful_arr[k][1][0]    

    var svg_color = colorCode['혐오시설']
    var stroke_color = "#FFFFFF"
    var grade = ""    
    var marker_id = 'harmful_marker_' + k

    svg_loc_small = `            
    <svg version="1.1" class='infra_marker harmful' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width_small}", height="${icon_size_height_small}">
    <defs>
    <style>
    .infra_harmful_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .infra_harmful_2{fill:#fff;}
    </style>
    </defs>    
    <path class="infra_harmful_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <path class="infra_harmful_2" d="M97.63,59.21,67.86,29.44a1.28,1.28,0,0,0-1.82,0v0L36.25,59.21a1.3,1.3,0,0,0,0,1.83L66,90.82a1.28,1.28,0,0,0,1.81,0h0L97.63,61A1.29,1.29,0,0,0,97.63,59.21ZM66.94,78.49a3.34,3.34,0,1,1,3.34-3.34A3.33,3.33,0,0,1,66.94,78.49ZM70.28,66.8H63.61L61.94,43.43H72Z"/>
    <path class="infra_harmful_2" d="M103.53,53.3,73.77,23.54a9.65,9.65,0,0,0-13.64,0h0L30.36,53.3a9.65,9.65,0,0,0,0,13.65h0L60.12,96.71a9.64,9.64,0,0,0,13.64,0h0L103.53,67a9.64,9.64,0,0,0,0-13.64ZM100,63.47,70.28,93.17a4.58,4.58,0,0,1-6.49,0l0,0L33.9,63.47a4.61,4.61,0,0,1,0-6.52l0,0L63.61,27.08a4.58,4.58,0,0,1,6.49,0l.05,0L100,56.79a4.6,4.6,0,0,1,.16,6.51Z"/>
    </svg>
    `
    window["harmful_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width_small/2, icon_size_height_small/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 120,
      map: defaultMap,
      loc_name : harmful_name + "시설",      
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: harmful_name + "시설",
      class: "infra_marker harmful"
    });

    overlay.setMap(defaultMap)

    infra_harmful_markers.push(window["harmful_marker_" + k])
    all_markers.push(window["harmful_marker_" + k])
  }

  //updateMarkers(defaultMap, complex_small_markers);

  //for(var i in infra_harmful_markers){    
    //naver.maps.Event.addListener(infra_mall_markers[i], 'click', complexMarkerAction(infra_mall_markers[i]));
    //naver.maps.Event.addListener(infra_harmful_markers[i], 'mouseover', showUpInfo(infra_harmful_markers[i]));
  //}  
}

var edu_mSchool_markers = []
var edu_drink_markers = []
var edu_motel_markers = []
var edu_academy_polygons = []

function createEduMarker(aptData){
  //초등학교
  infra_department_store_markers = []
  pSchool_coord = aptData["초등학교좌표"]
  pSchool_name = aptData["초등학교명"]  

  coordi_x = pSchool_coord[1]
  coordi_y = pSchool_coord[0]

  var svg_color = colorCode['초등학교']
  var stroke_color = "#ffffff"
  var grade = ""    
  var marker_id = 'pSchool_marker'

  svg_loc_small = `            
  <svg version="1.1" class='edu_marker pSchool' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width}", height="${icon_size_height}">
  <defs>
  <style>
  .edu_pSchool_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
  .edu_pSchool_2{fill:#ffffff;}
  </style>
  </defs>
  <path class="edu_pSchool_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
  <path class="edu_pSchool_2" d="M104.94,97.12V69.64a6.55,6.55,0,0,0-3.9-5.92l-32.4-15V42.24H94.35a2.93,2.93,0,0,0,3-2.85V22a2.93,2.93,0,0,0-3-2.85H65.21a2.94,2.94,0,0,0-3,2.85V48.76L32,63.68a6.55,6.55,0,0,0-3.74,5.84v27.6H18.94v5h96v-5Zm-19.43-27a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H86.51a1,1,0,0,1-1-1Zm0,15a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H86.51a1,1,0,0,1-1-1Zm-19.41-28a7.19,7.19,0,1,1-7.19,7.18A7.19,7.19,0,0,1,66.1,57.12Zm-29.59,13a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H37.51a1,1,0,0,1-1-1Zm0,15a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H37.51a1,1,0,0,1-1-1Zm19,11v-19a1,1,0,0,1,1-1H75.65a1,1,0,0,1,1,1v19a1,1,0,0,1-1,1H56.54A1,1,0,0,1,55.54,96.12Z"/>
  </svg>
  `
  pSchool_marker = new naver.maps.Marker({
    position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
    icon: {
        content: svg_loc_small,
        size: new naver.maps.Size(24, 37),
        anchor: new naver.maps.Point(icon_size_width/2, icon_size_height/2),
        origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
    },
    zIndex: 160,
    map: defaultMap,
    loc_name : pSchool_name,      
  });

  //이름표시
  var overlay = new CustomOverlay({
    map: defaultMap,
    position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
    name: pSchool_name,
    class: "edu_marker pSchool"
  });

  overlay.setMap(defaultMap)
  
  all_markers.push(pSchool_name)

  destination = new naver.maps.LatLng(coordi_y, coordi_x);

  pSchool_line = new naver.maps.Polyline({
    map: defaultMap,
    path: [origin_yx, destination],
    strokeColor: colorCode['초등학교'],
    strokeWeight: 2,
    strokeOpacity: 1,
    strokeStyle: 'shortdash'  // ← 점선
  });

  // 거리 계산 (단위: m)
  pSchool_distance = pSchool_line.getDistance()
  pSchool_distance = pSchool_distance.toFixed(0) + "m"

  // 중앙 좌표 계산
  midLat = (origin_yx.lat() + destination.lat()) / 2;
  midLng = (origin_yx.lng() + destination.lng()) / 2;
  midpoint = new naver.maps.LatLng(midLat, midLng);

  // 거리 표시용 커스텀 오버레이 생성
  pSchoolDistanceLabel = new naver.maps.Marker({
      position: midpoint,
      map: defaultMap,
      icon: {
        content: `<div class='distance_index edu_marker pSchool' style='color:#fff; background:${colorCode['초등학교']}'>${pSchool_distance}</div>`,
        anchor: new naver.maps.Point(12, 12)
      }
    });

  //naver.maps.Event.addListener(pSchool_marker, 'mouseover', showUpInfo(pSchool_marker));

  //중학교
  edu_mSchool_markers = []
  edu_mSchool_lines = []
  mSchool_arr = aptData["중학교정보"]

  for (var k in mSchool_arr){
    if (mSchool_arr.hasOwnProperty('distance')){
      console.log("AAAAAA")
      mSchool_name = mSchool_arr['name']
      coordi_x = mSchool_arr['yx'][1]
      coordi_y = mSchool_arr['yx'][0]
    }
    else{
      mSchool_name = mSchool_arr[k]['중학교명']
      coordi_x = mSchool_arr[k]['x']
      coordi_y = mSchool_arr[k]['y']
    }

    var svg_color = colorCode['중학교']
    var stroke_color = "#FFFFFF"
    var grade = ""    
    var marker_id = 'mSchool_marker_' + k

    svg_loc_small = `            
    <svg version="1.1" class='edu_marker mSchool' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width}", height="${icon_size_height}">
    <defs>
    <style>
    .edu_mSchool_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .edu_mSchool_2{fill:#fff;}
    </style>
    </defs>    
    <path class="edu_mSchool_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <path class="edu_mSchool_2" d="M104.94,97.12V69.64a6.55,6.55,0,0,0-3.9-5.92l-32.4-15V42.24H94.35a2.93,2.93,0,0,0,3-2.85V22a2.93,2.93,0,0,0-3-2.85H65.21a2.94,2.94,0,0,0-3,2.85V48.76L32,63.68a6.55,6.55,0,0,0-3.74,5.84v27.6H18.94v5h96v-5Zm-19.43-27a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H86.51a1,1,0,0,1-1-1Zm0,15a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H86.51a1,1,0,0,1-1-1Zm-19.41-28a7.19,7.19,0,1,1-7.19,7.18A7.19,7.19,0,0,1,66.1,57.12Zm-29.59,13a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H37.51a1,1,0,0,1-1-1Zm0,15a1,1,0,0,1,1-1h7.43a1,1,0,0,1,1,1v7a1,1,0,0,1-1,1H37.51a1,1,0,0,1-1-1Zm19,11v-19a1,1,0,0,1,1-1H75.65a1,1,0,0,1,1,1v19a1,1,0,0,1-1,1H56.54A1,1,0,0,1,55.54,96.12Z"/>
    </svg>
    `
    window["mSchool_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width/2, icon_size_height/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 160,
      map: defaultMap,
      loc_name : mSchool_name,      
    });    

    destination = new naver.maps.LatLng(coordi_y, coordi_x);

    window["mSchool_line" + k] = new naver.maps.Polyline({
      map: defaultMap,
      path: [origin_yx, destination],
      strokeColor: colorCode['중학교'],
      strokeWeight: 2,
      strokeOpacity: 1,
      strokeStyle: 'shortdash'  // ← 점선
    });

    // 거리 계산 (단위: m)
    mSchool_distance = window["mSchool_line" + k].getDistance()
    mSchool_distance = mSchool_distance.toFixed(0) + "m"

    // 중앙 좌표 계산
    midLat = (origin_yx.lat() + destination.lat()) / 2;
    midLng = (origin_yx.lng() + destination.lng()) / 2;
    midpoint = new naver.maps.LatLng(midLat, midLng);

    // 거리 표시용 커스텀 오버레이 생성
    window["mSchoolDistanceLabel" + k] = new naver.maps.Marker({
      position: midpoint,
      map: defaultMap,
      icon: {
        content: `<div class='distance_index edu_marker mSchool' style='color:#fff; background:${colorCode['중학교']}'>${mSchool_distance}</div>`,
        anchor: new naver.maps.Point(12, 12)
      }
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: mSchool_name,
      class: "edu_marker mSchool"
    });

    overlay.setMap(defaultMap)

    edu_mSchool_markers.push(window["mSchool_marker_" + k])
    edu_mSchool_lines.push(window["mSchool_line" + k])
    all_markers.push(window["mSchool_marker_" + k])

    if (mSchool_arr.hasOwnProperty('distance')){
      break;
    }
  }

  //updateMarkers(defaultMap, complex_small_markers);

  //for(var i in edu_mSchool_markers){    
    //naver.maps.Event.addListener(infra_mall_markers[i], 'click', complexMarkerAction(infra_mall_markers[i]));
    //naver.maps.Event.addListener(edu_mSchool_markers[i], 'mouseover', showUpInfo(edu_mSchool_markers[i]));
  //}

  //학원가
  edu_academy_markers = []
  academy_300m_arr = aptData["학원가좌표_300m"]
  academy_1km_arr = aptData["학원가좌표_1km"]

  academy_300m_area_arr = aptData["학원가영역_300m"]
  academy_1km_area_arr = aptData["학원가영역_1km"]

  if(academy_1km_arr == undefined){
    academy_arr = academy_300m_arr
    academy_area_arr = academy_300m_area_arr
  }
  else{
    academy_arr = academy_1km_arr
    academy_area_arr = academy_1km_area_arr
  }    

  for (var k in academy_arr){
    loc_name = "학원가"
    coordi_x = academy_arr[k][1]
    coordi_y = academy_arr[k][0]
    
    rawCoords = academy_area_arr[k]

    academy_coords = convertToLatLngArray(rawCoords)    
    window['academy_polygon' + k] = drawPolygon(academy_coords, { map: defaultMap, strokeColor: colorCode['학원가'], fillColor: colorCode['학원가'], fillOpacity: 0.2 });
    edu_academy_polygons.push(window['academy_polygon' + k])

    var svg_color = colorCode['학원가']
    var stroke_color = "#FFFFFF"
    var grade = ""    
    var marker_id = 'academy_marker_' + k

    svg_loc_small = `            
    <svg version="1.1" class='edu_marker academy' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width}", height="${icon_size_height}">
    <defs>
    <style>
    .academy_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .academy_2{fill:#fff;}
    </style>
    </defs>
    <path class="academy_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <path class="academy_2" d="M43.16,42.22H42.8a2.16,2.16,0,0,0,0,4.32h.36a2.16,2.16,0,0,0,0-4.32Z"/>
    <path class="academy_2" d="M49.73,46.54H71.62a2.16,2.16,0,0,0,0-4.32H49.73a2.16,2.16,0,0,0,0,4.32Z"/>
    <path class="academy_2" d="M69,61.23a2.16,2.16,0,0,0-2.16-2.16H48.53a2.16,2.16,0,0,0,0,4.32H66.8A2.16,2.16,0,0,0,69,61.23Z"/>
    <path class="academy_2" d="M63,75.92H54.27a2.16,2.16,0,0,0,0,4.32H63a2.16,2.16,0,1,0,0-4.32Z"/>
    <path class="academy_2" d="M106.39,24.88,93.87,19A2.16,2.16,0,0,0,91,20.09L84.53,34l-3.16-9.3a2.17,2.17,0,0,0-2.05-1.46H36.83a2.16,2.16,0,0,0-1.67.79L26.74,34.34a2.16,2.16,0,0,0-.37,2.06l20.9,61.38a2.15,2.15,0,0,0,2,1.47h54.43a2.58,2.58,0,0,0,.39,0l.12,0,.18-.05.08,0,.17-.08a2.39,2.39,0,0,0,.22-.12l.11-.08a2.11,2.11,0,0,0,.23-.19l.06-.06a2.65,2.65,0,0,0,.21-.26.21.21,0,0,1,0-.06c.06-.1.11-.2.16-.3l0-.07a1.91,1.91,0,0,0,.1-.34.13.13,0,0,0,0-.06,2.21,2.21,0,0,0,0-.37v-.06a2.2,2.2,0,0,0,0-.36s0-.06,0-.09a1.6,1.6,0,0,0,0-.21L93,58.76l14.46-31A2.15,2.15,0,0,0,106.39,24.88ZM89.77,32.62c.55-1.17,2.27-.15,1.73,1-.67,1.42-1.34,2.83-2,4.25q-7,14.88-14,29.75c-.55,1.16-2.27.15-1.73-1q1-2.13,2-4.26Q82.78,47.5,89.77,32.62ZM77.63,77.56l-5,3.4-.61-6Zm23.09,17.37H50.86L31.43,37.87H41.62a2.16,2.16,0,0,0,2-3.07l-3.36-7.27H77.77l4.12,12.09L67.52,70.46a2.09,2.09,0,0,0-.19,1.13h0L68.68,85a2.19,2.19,0,0,0,1.24,1.74,2.23,2.23,0,0,0,.91.2,2.17,2.17,0,0,0,1.22-.38L83.2,79h0a2.17,2.17,0,0,0,.74-.87l6.39-13.7Zm-.09-62.81-8.6-4,2-4.24,8.59,4Z"/>
    </svg>

    `
    window["academy_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width/2, icon_size_height/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 160,
      map: defaultMap,
      loc_name : loc_name,
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: loc_name,
      class: "edu_marker academy"
    });

    overlay.setMap(defaultMap)

    edu_academy_markers.push(window["academy_marker_" + k])
    all_markers.push(window["academy_marker_" + k])
  }

  //updateMarkers(defaultMap, complex_small_markers);

  //for(var i in edu_academy_markers){    
    //naver.maps.Event.addListener(infra_market_markers[i], 'click', complexMarkerAction(infra_mall_markers[i]));
    //naver.maps.Event.addListener(edu_academy_markers[i], 'mouseover', showUpInfo(edu_academy_markers[i]));
  //}

  //유흥주점
  edu_drink_markers = []
  drink_pub_arr = []
  drink_arr = aptData["유흥주점정보"]
  pub_arr = aptData["단란주점정보"]
  if(drink_arr != undefined){
    drink_pub_arr = drink_pub_arr.concat(drink_arr)
  }
  if(pub_arr != undefined){
    drink_pub_arr = drink_pub_arr.concat(pub_arr)
  }
  

  for (var k in drink_pub_arr){
    loc_name = "주점"
    coordi_x = drink_pub_arr[k][1][1]
    coordi_y = drink_pub_arr[k][1][0]    

    var svg_color = colorCode['주점']
    var stroke_color = "#FFFFFF"
    var grade = ""    
    var marker_id = 'drink_marker_' + k

    svg_loc_small = `            
    <svg version="1.1" class='edu_marker drink' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width_small}", height="${icon_size_height_small}">
    <defs>
    <style>
    .drink_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .drink_2{fill:#fff;}
    </style>
    </defs>
    <path class="drink_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <path class="drink_2" d="M96.76,54.19,96.64,54a28,28,0,0,1-5.29-16.47V22.74a3.91,3.91,0,0,0-3.72-4.07H82a3.91,3.91,0,0,0-3.71,4.07V37.56A28,28,0,0,1,73,54l-.12.16A31.43,31.43,0,0,0,66.9,72.65V97.5a3.91,3.91,0,0,0,3.73,4.06H99a3.9,3.9,0,0,0,3.71-4.06V72.65A31.43,31.43,0,0,0,96.76,54.19ZM81.15,22.74a.86.86,0,0,1,.81-.9h5.67a.86.86,0,0,1,.82.9v8.58h-7.3ZM69.8,72.65a28.07,28.07,0,0,1,5.3-16.48l.11-.15a31.41,31.41,0,0,0,5.94-18.46V34.49h7.3v3.07A31.42,31.42,0,0,0,94.38,56l.12.16a28.06,28.06,0,0,1,5.29,16.48v2H94.3c0-.26,0-.5,0-.75,0-5.75-4.27-10.43-9.53-10.43s-9.54,4.68-9.54,10.43c0,.25,0,.49,0,.75H69.8Zm0,10.7V76.8h7.77l-.23-1.27a8.48,8.48,0,0,1-.15-1.59c0-4.59,3.42-8.31,7.6-8.31s7.61,3.72,7.61,8.31a8.64,8.64,0,0,1-.15,1.59L92,76.8h7.77v6.55Z"/>
    <path class="drink_2" d="M84.8,67.67a6,6,0,0,0-5.74,6.26,7,7,0,0,0,.11,1.21,5.66,5.66,0,0,0,11.25,0,7.1,7.1,0,0,0,.11-1.22A6,6,0,0,0,84.8,67.67Zm3.72,7.07a3.75,3.75,0,0,1-7.45,0,4.25,4.25,0,0,1-.07-.8,3.81,3.81,0,1,1,7.59,0A4.43,4.43,0,0,1,88.52,74.74Z"/>
    <path class="drink_2" d="M60,38H35.32l-.4.9C33.66,41.74,31.19,51,31.2,59.44c0,9.35,6.62,17.07,15,17.88V91.9l-9.19,6-.12.08a3,3,0,0,0-.91,3.17,2.59,2.59,0,0,0,2.46,1.93H56.86a2.6,2.6,0,0,0,2.46-1.93A3,3,0,0,0,58.41,98L49.09,91.9V77.32c8.4-.81,15-8.51,15-17.88,0-8.09-2.39-17.54-3.73-20.55Zm-4.23,62H39.56l8.08-5.31ZM34.11,58.38a62.4,62.4,0,0,1,3.08-17.22H58.1a65,65,0,0,1,3.07,17.22Z"/>
    </svg>

    `
    window["drink_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width_small/2, icon_size_height_small/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 100,
      map: defaultMap,
      loc_name : loc_name,
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: loc_name,
      class: "edu_marker drink"
    });

    overlay.setMap(defaultMap)

    edu_drink_markers.push(window["drink_marker_" + k])
    all_markers.push(window["drink_marker_" + k])
  }

  //updateMarkers(defaultMap, complex_small_markers);

  //for(var i in edu_drink_markers){    
    //naver.maps.Event.addListener(infra_market_markers[i], 'click', complexMarkerAction(infra_mall_markers[i]));
    //naver.maps.Event.addListener(edu_drink_markers[i], 'mouseover', showUpInfo(edu_drink_markers[i]));
  //}

  //모텔
  edu_motel_markers = []
  motel_arr = aptData["모텔정보"]

  for (var k in motel_arr){
    loc_name = "모텔"
    coordi_x = motel_arr[k][1][1]
    coordi_y = motel_arr[k][1][0]    

    var svg_color = colorCode['모텔']
    var stroke_color = "#FFFFFF"
    var grade = ""    
    var marker_id = 'motel_marker_' + k

    svg_loc_small = `            
    <svg version="1.1" class='edu_marker motel' id="${marker_id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="-10 -10 120 180" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="${icon_size_width_small}", height="${icon_size_height_small}">
    <defs>
    <style>
    .motel_1{fill:${svg_color}; stroke:${stroke_color}; stroke-miterlimit:10; stroke-width:${stroke_width};}
    .motel_2{fill:#fff;}
    </style>
    </defs>
    <path class="motel_1" filter="url(#shadow)" d="M132.06,19,76.37,1.53C72.81-.34,60.56-.34,57,1.53L1.9,19a3.51,3.51,0,0,0-1.77,3.1v83.77c0,5.47,2.58,9.9,5.68,9.9H13.2l3.92,9.09,4.72,8.64,4.66-8.64,4.65-8.72h97c3.1,0,5.61-4.43,5.61-9.9V22.15A3.47,3.47,0,0,0,132.06,19Z"/>
    <path class="motel_2" d="M114.67,53h-7.75a1.55,1.55,0,0,0-1.55,1.55h0V64a10,10,0,0,0-6.94-2.8H55a5.08,5.08,0,0,0,.37-1.88V58a5,5,0,0,0-5-5H35.33a5,5,0,0,0-5,5v1.26a5,5,0,0,0,.74,2.6A10,10,0,0,0,27.86,64V42.26a1.54,1.54,0,0,0-1.55-1.55H19.22a1.54,1.54,0,0,0-1.55,1.55h0V90.57a1.54,1.54,0,0,0,1.55,1.55h7.09a1.54,1.54,0,0,0,1.55-1.55v-7.5h77.51v7.5a1.54,1.54,0,0,0,1.55,1.55h7.75a1.54,1.54,0,0,0,1.55-1.55v-36A1.55,1.55,0,0,0,114.67,53ZM24.76,89h-4V43.81h4Zm8.69-31a1.88,1.88,0,0,1,1.88-1.88H50.41A1.88,1.88,0,0,1,52.29,58v1.26a1.9,1.9,0,0,1-1.88,1.88H35.33a1.89,1.89,0,0,1-1.88-1.88ZM27.86,71.21a6.94,6.94,0,0,1,6.94-6.94H98.43a7,7,0,0,1,6.94,6.94v1.6H27.86ZM113.12,89h-4.65V56.15h4.65Z"/>
    </svg>

    `
    window["motel_marker_" + k] = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      icon: {
          content: svg_loc_small,
          size: new naver.maps.Size(24, 37),
          anchor: new naver.maps.Point(icon_size_width_small/2, icon_size_height_small/2),
          origin: new naver.maps.Point( Number(coordi_y), Number(coordi_x) ),
      },
      zIndex: 100,
      map: defaultMap,
      loc_name : loc_name,
    });

    //이름표시
    var overlay = new CustomOverlay({
      map: defaultMap,
      position: new naver.maps.LatLng(Number(coordi_y), Number(coordi_x)),
      name: loc_name,
      class: "edu_marker motel"
    });

    overlay.setMap(defaultMap)

    edu_motel_markers.push(window["motel_marker_" + k])
    all_markers.push(window["motel_marker_" + k])
  }

  //updateMarkers(defaultMap, complex_small_markers);

  //for(var i in edu_motel_markers){    
    //naver.maps.Event.addListener(infra_market_markers[i], 'click', complexMarkerAction(infra_mall_markers[i]));
    //naver.maps.Event.addListener(edu_motel_markers[i], 'mouseover', showUpInfo(edu_motel_markers[i]));
  //}  
}

function CustomOverlay(options) {
  const overlay = new naver.maps.OverlayView();
  const position = options.position;
  const map = options.map;

  const el = document.createElement("div");
  el.className = "label-overlay " + options.class;
  el.innerText = options.name || "이름 없음";

  overlay.onAdd = function () {
    const pane = overlay.getPanes().overlayLayer;
    pane.appendChild(el);
  };

  overlay.draw = function () {
    const projection = overlay.getProjection();
    const pixel = projection.fromCoordToOffset(position);
    el.style.position = "absolute";
    el.style.left = pixel.x - el.offsetWidth / 2 + 5 + "px";
    if(isMobile){
      el.style.top = pixel.y - 45 + "px";
    }
    else{
      el.style.top = pixel.y - 50 + "px";
    }    
  };

  overlay.onRemove = function () {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  };

  overlay.setMap(map);
  overlay.setPosition = function (pos) {
    position = pos;
    overlay.draw();
  };

  return overlay;
}
