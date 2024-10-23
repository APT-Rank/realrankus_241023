var part_default = 
"<div class='partBox' onClick=\"goMap('https://forms.gle/7d9Am6RzXfBAsa6e7')\">"
    + "<div id='partDefaultText'>"
        + "<div id='partSub1' style='text-align:center;'>리얼랭커스 광고 문의</div>"
        + "<div id='partTitle' style='text-align:center;'>리얼랭커스의 파트너가 되어 주세요! (광고, 제휴)</div>"
        //+ "<div id='partTitle' style='text-align:center;'>30일 무료 파트너쉽 신청 진행 중! (~2/24일 까지)</div>"
        + "<div id='partInfo' style='text-align:center;'>클릭하면 파트너쉽 신청 양식으로 연결됩니다.</div>"
    + "</div>"
+ "</div>"


var part_info =
"<div class='partBox' id='partSelect'>"
    + "<div id='partText'>"
            + "<div id='partSub1'></div>"
            + "<div id='partTitle'></div>"
            + "<div id='partInfo'></div>"
        + "</div>"
        + "<div id='partImage'>"
        + "</div>"
    + "</div>"

var part_biz =
"<div class='partBox' id='partSelect'></div>"

var part_pop =
"<div class='partBox' data-bs-toggle='modal' data-bs-target='#toggleModal1' id='partSelect' onClick='showPART()'>"
    + "<div id='partText'>"
            + "<div id='partSub1'></div>"
            + "<div id='partTitle'></div>"
            + "<div id='partInfo'></div>"
        + "</div>"
        + "<div id='partImage'>"
        + "</div>"
    + "</div>"

var part_static_pop =
    "<div class='partBox' data-bs-toggle='modal' data-bs-target='#toggleModal1' id='partSelect' onClick='showStaticPART(part_selection)'>"
        + "<div id='partText'>"
                + "<div id='partSub1'></div>"
                + "<div id='partTitle'></div>"
                + "<div id='partInfo'></div>"
            + "</div>"
            + "<div id='partImage'>"
            + "</div>"
        + "</div>"

var part_static_pop2 =
    "<div class='partBox' data-bs-toggle='modal' data-bs-target='#toggleModal1' id='partSelect' onClick='showStaticPART2(part_selection)'>"
        + "<div id='partText'>"
                + "<div id='partSub1'></div>"
                + "<div id='partTitle'></div>"
                + "<div id='partInfo'></div>"
            + "</div>"
            + "<div id='partImage'>"
            + "</div>"
        + "</div>"          

function callNumber(num){
    window.location.href = "tel:" + num
}

function sendMessage(device, num){    
    window.location.href = 'sms:' + num + (device == 'ios' ? '&' : '?') + 'body='+ encodeURIComponent("리얼랭커스를 통해 연락 드립니다.");
}

function goMap(url){
    if(checkMobile() == "ios"){
    window.location.href = url
    }
    else{
    window.open(url)
    }    
}

function load_parrtnership(region){
    part_url = "https://www.realrankus.com/ad/1000000000_Korea_ad.json" + update_ver
    $.getJSON(part_url, function(part_json) {
        partData = part_json;
        part_detail = partData.data
        part_selection = Math.floor(Math.random() * (part_detail.length))

        part_title = part_detail[part_selection]['shop_name'] 
        part_type = part_detail[part_selection]['request_type']
        part_main_title = part_detail[part_selection]['main_title']
        sub_title = part_detail[part_selection]['sub_title']
        sub_comment = part_detail[part_selection]['sub_comment']
        cell_num = "0" + part_detail[part_selection]['cellphone']          
        phone_num = "0" + part_detail[part_selection]['phone']
        cell_num_with_pyphen = cell_num.phoneNoRep()
        phone_num_with_pyphen = phone_num.phoneNoRep()
        img_url = part_detail[part_selection]['icon']
        part_sDate = part_detail[part_selection]['start_date']
        part_sDate_Num = Number(part_sDate.replace(/-/gi, ""))
        part_eDate = part_detail[part_selection]['end_date']
        part_eDate_Num = Number(part_eDate.replace(/-/gi, ""))
        //img_url = "apt-rank_blank2"
        page_url = part_detail[part_selection]['homepage']
    })
}

function show_partnership(){
 //광고정보 표시영역
 if(partData.data.length > 0 && (today_num >= part_sDate_Num && today_num <= part_eDate_Num) ){
    gtag('event','파트너쉽노출', { 'event_category' : 'View_Partnership', 'event_label' : "리얼랭커스," + today_str + "," + part_title + ",뷰,파트너쉽"});
    if(part_type == 'Direct'){
      $('#dataList').append(part_info);
      $('.partBox').click(function(){
        var ad_click_date = new Date();
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
      $('#dataList').append(part_pop);
    }
    if(part_type == 'Static_Pop'){
      $('#dataList').append(part_static_pop);      
    }
    if(part_type == 'Static_Pop2'){
      $('#dataList').append(part_static_pop2);
    }
    
    $('#partSub1').html(sub_title)
    $('#partTitle').html(part_main_title)
    if(sub_comment == ""){
      $('#partInfo').html(cell_num_with_pyphen + " / " + phone_num_with_pyphen)
    }
    else{
      $('#partInfo').html(sub_comment)
    }

    if(checkMobile() == 'other'){
      $('#partImage').html("<img src='../ad/image/" + img_url + "' height='70px' style='border-radius: 10px;'>")
    }
    else{
      $('#partImage').html("<img src='../ad/image/" + img_url + "' height='58px' style='border-radius: 10px;'>")
    }
  }
  else{
    $('#dataList').append(part_default);
    $('.partBox').css({'grid-template-columns':'1fr'})
  }
}

function showPART(){
    shop_name = partData.data[0]['shop_name']
    shop_address = partData.data[0]['address']
    shop_owner = partData.data[0]['owner']
    shop_icon = partData.data[0]['icon']
    shop_comment = partData.data[0]['comment']
    shop_comment = shop_comment.replace(/\n/g, '<br>')
    shop_phone = "0" + partData.data[0]['phone']
    shop_phone_with_hyphen = shop_phone.phoneNoRep()
    shop_cell = "0" + partData.data[0]['cellphone']
    shop_cell_with_hyphen = shop_cell.phoneNoRep()
    shop_home = partData.data[0]['homepage']
    shop_x = Number(partData.data[0]['x'])
    shop_y = Number(partData.data[0]['y'])
    shop_map_url = partData.data[0]['map_url']

    titleHtml = "";
    detailHtml = "";
    footerHtml = "";

    //var ad_click_date = new Date();
    //gtag('event','파트너쉽선택', { 'event_category' : 'Click_Partnership', '파트너쉽선택' : shop_name + "\t" + ad_click_date + "\t" + ($('#sido option:selected').text() + " " + $('#gungu option:selected').text())});	
    gtag('event','파트너쉽선택', { 'event_category' : 'Click_Partnership', 'event_label' : "리얼랭커스," + today_str + "," + shop_name + ",클릭,파트너쉽"});
    
    titleHtml += "<div id='part_title'>"        
        titleHtml += "<div id='part_title_sub'>"
            titleHtml += "<div class='popupTitle' style='font-weight: 600; padding-left: 5px; font-size:1em'>" + shop_name + "</div>"
            titleHtml += "<div style='font-size: 0.6em; padding-left: 5px; color:gray; margin-bottom: 5px'>대표 " + shop_owner + "</div>"
            titleHtml += "<div style='font-size: 0.6em; padding-left: 5px; color:gray'>" + shop_address + "</div>"
            titleHtml += "<div style='font-size: 0.6em; padding-left: 6px; padding-top: 3px; font-weight: 600'>" + shop_cell_with_hyphen + " / " + shop_phone_with_hyphen + "</div>"
        titleHtml += "</div>"
        titleHtml +="<div style='text-align:center; align-self:center'><div class='image_wrap'><img src='../ad/image/" + shop_icon + "' height='70px' alt='' style='clip-path: circle(38%)'></div></div>"
    titleHtml += "</div>"    

    detailHtml += "<div class='notice'>" + shop_comment + "</div>"
    if(shop_x != ""){        
        detailHtml += "<hr>"
        detailHtml += "<div id='part_map_wrap' onClick='goMap(shop_map_url)'>"
            detailHtml += "<div id='part_map'></div>"
        detailHtml += "</div>"
    }

    footerHtml += "<div class='modal-footer'>"    
    if ( navigator.platform ) {
        if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
            footerHtml += " <div id='partBtn1'><button type='button' class='goApt' onClick='callNumber(shop_cell)' style='font-size: 0.85em'><i class='fa-solid fa-phone'></i>" + ' ' + shop_cell_with_hyphen + "</button></div>"
            footerHtml += " <div id='partBtn2'><button type='button' class='goApt' onClick='sendMessage(checkMobile(), shop_cell)' style='font-size: 0.85em'><i class='fa-regular fa-envelope'></i> 문자보내기 </button></div>"            
        } else {}
    }
    if(shop_home != ""){
        footerHtml += " <div id='partBtn3'><button type='button' class='goApt' onClick='goMap(\"" + shop_home + "\")' style='font-size: 0.85em'><i class='fa-solid fa-house'></i> 홈페이지</button></div>"
    }
    else{
        footerHtml += " <div id='partBtn3'><button type='button' class='goApt' style='font-size: 0.85em' disabled><i class='fa-solid fa-house'></i> 홈페이지 준비 중</button></div>"
    }
    
    footerHtml += "</div>"  

    $('#toggleModalLabel').html(titleHtml);
    $('#distanceDetail').html(detailHtml);
    $('#toggle1footer').html(footerHtml);

    $('#partBtn3').css({"grid-column" : "span 2"})
    $('.modal-footer').css({"padding-top" : "3px"})

    if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
	 var w = $(window).width() - 40;	 
    }
    else{
	 var w = 480;	 
    }    
    var h = 200;
	
    var mapOptions = {
        center: new naver.maps.LatLng(shop_x, shop_y),
	    size: new naver.maps.Size(w, h),
        zoom: 16, //지도의 초기 줌 레벨
        zoomControl: false, //줌 컨트롤의 표시 여부
        draggable: false,
        pinchZoom: false,
        scrollWheel: false,
        keyboardShortcuts: false,
        disableDoubleTapZoom: true,
        disableDoubleClickZoom: true,
        disableTwoFingerTapZoom: true,	
    };

    var map = new naver.maps.Map('part_map', mapOptions);    
    
    var marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(shop_x, shop_y),
        map: map
    });
}

function showStaticPART(part_selection){
    shop_comment = ""
    shop_name = partData.data[part_selection]['shop_name']
    shop_address = partData.data[part_selection]['address']
    shop_owner = partData.data[part_selection]['owner']
    shop_icon = partData.data[part_selection]['icon']
    shop_comment_list = partData.data[part_selection]['comment']
    for(i = 0; i < shop_comment_list.length ; i++){
        shop_comment += shop_comment_list[i]
    }    
    shop_comment = shop_comment.replace(/\n/g, '<br>')
    shop_phone = "0" + partData.data[part_selection]['phone']
    shop_phone_with_hyphen = shop_phone.phoneNoRep()
    shop_cell = "0" + partData.data[part_selection]['cellphone']
    shop_cell_with_hyphen = shop_cell.phoneNoRep()
    shop_home = partData.data[part_selection]['homepage']
    shop_x = Number(partData.data[part_selection]['x'])
    shop_y = Number(partData.data[part_selection]['y'])
    shop_map_url = partData.data[part_selection]['map_url']

    titleHtml = "";
    detailHtml = "";
    footerHtml = "";

    //var ad_click_date = new Date();
    //gtag('event','파트너쉽선택', { 'event_category' : 'Click_Partnership', '파트너쉽선택' : shop_name + "\t" + ad_click_date + "\t" + ($('#sido option:selected').text() + " " + $('#gungu option:selected').text())});	
    gtag('event','파트너쉽선택', { 'event_category' : 'Click_Partnership', 'event_label' : "리얼랭커스," + today_str + "," + shop_name + ",클릭,파트너쉽"});
    
    titleHtml += "<div id='part_static_title'>"        
        titleHtml += "<div id='part_title_sub'>"
            titleHtml += "<div class='popupTitle' style='font-weight: 600; padding-left: 5px; font-size:1em'>" + shop_name + "</div>"
            titleHtml += "<div style='font-size: 0.6em; padding-left: 5px; color:gray'>" + shop_address + "</div>"
            //titleHtml += "<div style='font-size: 0.6em; padding-left: 6px; padding-top: 3px; font-weight: 600'>" + shop_cell_with_hyphen + " / " + shop_phone_with_hyphen + "</div>"
        titleHtml += "</div>"
        titleHtml +="<div style='text-align:center; align-self:center'><div class='image_wrap'><img src='../ad/image/" + shop_icon + "' height='70px' alt='' style='border-radius: 10px;'></div></div>"
    titleHtml += "</div>"    

    detailHtml += "<div class='notice'>" + shop_comment + "</div>"
    if(shop_x != ""){             
        detailHtml += "<hr>"
        detailHtml += "<div id='part_map_wrap' onClick='goMap(shop_map_url)'>"
            detailHtml += "<div id='part_map'></div>"
        detailHtml += "</div>"
    }

    footerHtml += "<div class='modal-footer'>"
    if(shop_home != ""){
        footerHtml += " <div id='partBtn3'><button type='button' class='goApt' onClick='goMap(\"" + shop_home + "\")' style='font-size: 0.85em'><i class='fa-solid fa-pen-to-square'></i> 상담 예약하기</button></div>"
    }
    else{
        footerHtml += " <div id='partBtn3'><button type='button' class='goApt' style='font-size: 0.85em' disabled><i class='fa-solid fa-pen-to-square'></i> 상담 예약하기</button></div>"
    }
    
    footerHtml += "</div>"  

    $('#toggleModalLabel').html(titleHtml);
    $('#simulDetail').html(detailHtml);
    $('#toggle1footer').html(footerHtml);    

    $('#partBtn3').css({"grid-column" : "span 2"})
    $('.modal-footer').css({"padding-top" : "3px"})

    console.log($('#part_map'))

    if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
	 var w = $(window).width() - 40;	 
    }
    else{
	 var w = 480;	 
    }    
    var h = 200;
	
    var mapOptions = {
        center: new naver.maps.LatLng(shop_x, shop_y),
	    size: new naver.maps.Size(w, h),
        zoom: 16, //지도의 초기 줌 레벨
        zoomControl: false, //줌 컨트롤의 표시 여부
        draggable: false,
        pinchZoom: false,
        scrollWheel: false,
        keyboardShortcuts: false,
        disableDoubleTapZoom: true,
        disableDoubleClickZoom: true,
        disableTwoFingerTapZoom: true,	
    };

    var map = new naver.maps.Map('part_map', mapOptions);    
    
    var marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(shop_x, shop_y),
        map: map
    });
}

function showStaticPART2(part_selection){    
    shop_comment = ""
    shop_name = partData.data[part_selection]['shop_name']
    shop_address = partData.data[part_selection]['address']
    shop_owner = partData.data[part_selection]['owner']
    shop_icon = partData.data[part_selection]['icon']
    shop_comment_list = partData.data[part_selection]['comment']
    for(i = 0; i < shop_comment_list.length ; i++){
        shop_comment += shop_comment_list[i]
    }    
    shop_comment = shop_comment.replace(/\n/g, '<br>')
    shop_phone = "0" + partData.data[part_selection]['phone']
    shop_phone_with_hyphen = shop_phone.phoneNoRep()
    shop_cell = "0" + partData.data[part_selection]['cellphone']
    shop_cell_with_hyphen = shop_cell.phoneNoRep()
    shop_home = partData.data[part_selection]['homepage']
    shop_x = Number(partData.data[part_selection]['x'])
    shop_y = Number(partData.data[part_selection]['y'])
    shop_map_url = partData.data[part_selection]['map_url']

    titleHtml = "";
    detailHtml = "";
    footerHtml = "";

    //var ad_click_date = new Date();
    //gtag('event','파트너쉽선택', { 'event_category' : 'Click_Partnership', '파트너쉽선택' : shop_name + "\t" + ad_click_date + "\t" + ($('#sido option:selected').text() + " " + $('#gungu option:selected').text())});	
    gtag('event','파트너쉽선택', { 'event_category' : 'Click_Partnership', 'event_label' : "리얼랭커스," + today_str + "," + shop_name + ",클릭,파트너쉽"});
    
    titleHtml += "<div id='part_static_title'>"        
        titleHtml += "<div id='part_title_sub'>"
            titleHtml += "<div class='popupTitle' style='font-weight: 600; padding-left: 5px; font-size:1em'>" + shop_name + "</div>"
            titleHtml += "<div style='font-size: 0.6em; padding-left: 5px; color:gray'>" + shop_address + "</div>"
            //titleHtml += "<div style='font-size: 0.6em; padding-left: 6px; padding-top: 3px; font-weight: 600'>" + shop_cell_with_hyphen + " / " + shop_phone_with_hyphen + "</div>"
        titleHtml += "</div>"
        titleHtml +="<div style='text-align:center; align-self:center'><div class='image_wrap'><img src='../ad/image/" + shop_icon + "' height='70px' alt='' style='border-radius: 10px;'></div></div>"
    titleHtml += "</div>"    

    detailHtml += "<div class='notice'>" + shop_comment + "</div>"
    if(shop_x != ""){        
        detailHtml += "<hr>"
        detailHtml += "<div id='part_map_wrap' onClick='goMap(shop_map_url)'>"
            detailHtml += "<div id='part_map'></div>"
        detailHtml += "</div>"
    }

    footerHtml += "<div class='modal-footer'>"
    if(shop_home != ""){
        footerHtml += " <div id='partBtn3'><button type='button' class='goApt' onClick='goMap(\"" + shop_home + "\")' style='font-size: 0.85em; background:#0d3529'>ELIF애월 둘러보기</button></div>"
    }
    else{
        footerHtml += " <div id='partBtn3'><button type='button' class='goApt' style='font-size: 0.85em' disabled>ELIF애월 둘러보기</button></div>"
    }
    
    footerHtml += "</div>"  

    $('#toggleModalLabel').html(titleHtml);
    $('#simulDetail').html(detailHtml);
    $('#toggle1footer').html(footerHtml);

    console.log($('#part_map'))

    $('#partBtn3').css({"grid-column" : "span 2"})
    $('.modal-footer').css({"padding-top" : "3px"})

    if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
	 var w = $(window).width() - 40;	 
    }
    else{
	 var w = 480;	 
    }    
    var h = 200;
	
    var mapOptions = {
        center: new naver.maps.LatLng(shop_x, shop_y),
	    size: new naver.maps.Size(w, h),
        zoom: 16, //지도의 초기 줌 레벨
        zoomControl: false, //줌 컨트롤의 표시 여부
        draggable: false,
        pinchZoom: false,
        scrollWheel: false,
        keyboardShortcuts: false,
        disableDoubleTapZoom: true,
        disableDoubleClickZoom: true,
        disableTwoFingerTapZoom: true,	
    };

    var map = new naver.maps.Map('part_map', mapOptions);    
    
    var marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(shop_x, shop_y),
        map: map
    });
}