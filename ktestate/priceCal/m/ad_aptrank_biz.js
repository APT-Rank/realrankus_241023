String.prototype.phoneNoRep = function()
{
    const str   = this;
    return str.replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3").replace("--", "-");
}

function checkMobile(){
	var varUA = navigator.userAgent.toLowerCase(); //userAgent 값 얻기
	if ( varUA.indexOf('android') > -1) {
		//안드로이드
		return "android";
	} else if ( varUA.indexOf("iphone") > -1||varUA.indexOf("ipad") > -1||varUA.indexOf("ipod") > -1 ) {
		//IOS
		return "ios";
	} else {
		//아이폰, 안드로이드 외
		return "other";
	}
}

var part_default = 
"<div class='partBox' onClick=\"window.open('https://forms.gle/AXNhUed2LYjrgmFLA')\">"
    + "<div id='partDefaultText'>"        
        + "<div id='partTitle' style='text-align:center;'>아파트랭크BIZ 파트너쉽 (광고, 제휴)</div>"
        + "<div id='partSub1' style='text-align:center;'>클릭하면 파트너쉽 신청 양식으로 연결됩니다.</div>"
    + "</div>"
+ "</div>"


var part_info =
"<div class='partBox' id='partSelect'>"
    + "<div id='partText'>"
            + "<div id='partSub1'></div>"
            + "<div id='partTitle'></div>"
            + "<div id='partInfo'></div>"
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
    + "</div>"

function callNumber(num){
    location.href = "tel:" + num
}

function sendMessage(device, num){    
    location.href = 'sms:' + num + (device == 'ios' ? '&' : '?') + 'body='+ encodeURIComponent("아파트랭크를 통해 연락 드립니다.");
}

function goMap(url){
    window.open(url, '_blank')
}

function showPART(){
    console.log(partData)
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
	
    
    titleHtml += "<div id='part_title'>"        
        titleHtml += "<div id='part_title_sub'>"
            titleHtml += "<div class='popupTitle' style='font-weight: 600; padding-left: 5px; font-size:1em'>" + shop_name + "</div>"
            titleHtml += "<div style='font-size: 0.6em; padding-left: 5px; color:gray; margin-bottom: 5px'>대표 " + shop_owner + "</div>"
            titleHtml += "<div style='font-size: 0.6em; padding-left: 5px; color:gray'>" + shop_address + "</div>"
            titleHtml += "<div style='font-size: 0.6em; padding-left: 6px; padding-top: 3px; font-weight: 600'>" + shop_cell_with_hyphen + " / " + shop_phone_with_hyphen + "</div>"
        titleHtml += "</div>"
        titleHtml +="<div style='text-align:center; align-self:center'><div class='image_wrap'><img src='./ad/" + shop_icon + "' height='70px' alt='' style='clip-path: circle(45%)'></div></div>"
    titleHtml += "</div>"    

    detailHtml += "<div class='notice'>" + shop_comment + "</div><hr>"
    detailHtml += "<div id='part_map_wrap' onClick='goMap(shop_map_url)'>"
        detailHtml += "<div id='part_map'></div>"
    detailHtml += "</div>"

    footerHtml += "<div class='modal-footer'>"    
    if ( navigator.platform ) {
        if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
            footerHtml += " <div id='partBtn1'><button type='button' class='goApt' onClick='callNumber(shop_cell)' style='font-size: 0.85em'><i class='fa-solid fa-phone'></i>" + ' ' + shop_cell_with_hyphen + "</button></div>"
            footerHtml += " <div id='partBtn2'><button type='button' class='goApt' onClick='sendMessage(checkMobile(), shop_cell)' style='font-size: 0.85em'><i class='fa-regular fa-envelope'></i> 문자보내기 </button></div>"            
        } else {}
    }    
    footerHtml += " <div id='partBtn3'><button type='button' class='goApt' onClick='window.open(\"" + shop_home + "\")' style='font-size: 0.85em'><i class='fa-solid fa-house'></i> 홈페이지</button></div>"
    footerHtml += "</div>"  

    $('#toggleModalLabel').html(titleHtml);
    $('#simulDetail').html(detailHtml);
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
