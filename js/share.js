var shareTitle = ""
var shareText = ""
var shareURL = ""
var kakaoShareURL = ""
var kakaoShareText = []
var kakaoKey = "a8a036bfb275fc87317e07f76dccecb2"
var NAVER_CLIENT_KEY = "QCL0Cjpsn2RIarmMDeKA"
var isMobile = false
var test_status = false

var login_status = false
var kakao_login_status = false
var naver_login_status = false
var apple_login_status = false
const expireTime = 180 * 24 * 60 * 60 * 1000

var temp_email = 'abc@abc.com'
var shown_email = ''
var temp_uid = 'abcdefghijklmnopqrstuvwxyz'
var blocked = 'false'
var block_start = '1976-1-1 00:00:00'
var block_end = '1976-1-1 00:00:00'

var UserAgent = navigator.userAgent;
var scr_width = screen.width
var scr_height = screen.height

var user_stat = new Object({
	accused: 0,
	blocked: 'false',
	block_days: 0,
	block_start: '1976-1-1',
	block_end: '1976-1-1',
	like: "",
	dislike: "",
	accusing: ""
})

String.prototype.phoneNoRep = function()
{
    const str   = this;
    return str.replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3").replace("--", "-");
}

function checkMobile(){
	var varUA = UserAgent.toLowerCase(); //userAgent 값 얻기
	if ( varUA.indexOf('android') > -1) {
		//안드로이드
		return "android";
	} else if ( varUA.indexOf("iphone") > -1 || varUA.indexOf("ipad") > -1 || varUA.indexOf("ipod") > -1 ) {
		//IOS
		return "ios";
	} else if( varUA.indexOf("macintosh") > -1 ){
		//매킨토시 외
		return "mac";
	} else if( varUA.indexOf("window") > -1 ){
		//윈도우 외
		return "window";
	} else {
    return "other";
  }
}

if (UserAgent.match(/iPhone|ipad|Android|Windows CE|BlackBerry|Symbian|Windows Phone|webOS|Opera Mini|Opera Mobi|POLARIS|IEMobile|lgtelecom|nokia|SonyEricsson/i) != null || UserAgent.match(/LG|SAMSUNG|Samsung/) != null)
{
  if(scr_width < scr_height){
    isMobile = true
  }
}

var connectionOS = ""
var connectionWebApp = ""

function connectionInfo(){
  if (checkMobile() == "android"){
    connectionOS = "Android"
  }
  else if (checkMobile() == "ios"){
    connectionOS = "iOS"
  }
  else if (checkMobile() == "window"){
    connectionOS = "Windows"
  }
  else if (checkMobile() == "mac"){
    connectionOS = "Macintosh"
  }
  else{
    connectionOS = "Others"
  }

  if(UserAgent.indexOf('inApp') > -1 || UserAgent.indexOf('_iOS_App') > -1 ){
    connectionWebApp = "App"
  }
  else{
    connectionWebApp = "Web"
  }
}

connectionInfo()

function deepCopy(object) {
  if (object === null || typeof object !== "object") {
    return object;
  } // 객체인지 배열인지 판단
  const copy = Array.isArray(object) ? [] : {};
  for (let key of Object.keys(object)) {
    copy[key] = deepCopy(object[key]);
  }
  return copy;
}

function cookieVal(cookieName){
  if($.cookie(cookieName) != undefined){
    return $.cookie(cookieName)
  }
  return 0      
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function countUp(pageName) {
  const updates = {};  
  updates["DailyConnection/" + today_str + "/" + pageName + "/DayCount"] = firebase.database.ServerValue.increment(1);    
  firebase.database().ref().update(updates);
}

function regionCountUp(pageName, regionName) {
  const updates = {};  
  updates["DailyConnection/" + today_str + "/" + pageName + "/region/" + regionName] = firebase.database.ServerValue.increment(1);    
  firebase.database().ref().update(updates);
} 

function setGrade(score){
  complex_grade = ""
  if(login_status){
    if(score >= 75){
      complex_grade = "S+"
    }
    else if(score < 75 && score >= 70){
      complex_grade = "S"
    }
    else if(score < 70 && score >= 65){
      complex_grade = "A+"
    }
    else if(score < 65 && score >= 60){
      complex_grade = "A"
    }
    else if(score < 60 && score >= 55){
      complex_grade = "A-"
    }
    else if(score < 55 && score >= 50){
      complex_grade = "B+"
    }
    else if(score < 50 && score >= 45){
      complex_grade = "B"
    }
    else if(score < 45 && score >= 40){
      complex_grade = "B-"
    }
    else if(score < 40 && score >= 35){
      complex_grade = "C+"
    } 
    else if(score < 35 && score >= 30){
      complex_grade = "C"
    }                    
    else{
      complex_grade = "C-"
    }
  }
  else{
    if(score >= 75){
      complex_grade = "S"
    }
    else if(score < 75 && score >= 70){
      complex_grade = "S"
    }
    else if(score < 70 && score >= 55){
      complex_grade = "A"
    }
    else if(score < 55 && score >= 40){
      complex_grade = "B"
    }
    else{
      complex_grade = "C"
    }
  }
  return complex_grade
}

function share(shareTitle, shareText, shareURL){
  if (navigator.share) {
    navigator.share({
      title: shareTitle,
      text: shareText,
      url: shareURL
    }).then(() => {
      console.log('Thanks for sharing!');
    })
    .catch(console.error);
  } else {
    // fallback
    shareDialog.classList.add('is-open');
  }
}

function kakaoShare(shareTitle, shareText, shareURL) {  
  console.log(shareURL)
  Kakao.Share.sendDefault({    
    objectType: 'text',
    text: shareText,    
    link: {
      mobileWebUrl: shareURL,
      webUrl: shareURL,
    },    
    buttons: [
      {
        title: '자세히 보기',
        link: {
          mobileWebUrl: shareURL,
          webUrl: shareURL,
        },
      },
      {
        title: '앱으로 이동',
        link: {
          androidExecutionParams: 'https://play.google.com/store/apps/details?id=com.aptrank.app'          
        },
      },
    ]    
  });
}

function kakaoShareButton(shareTitle, shareText, shareURL) {
  Kakao.Link.createDefaultButton({
    container: '#kakao-link-btn',
    objectType: 'text',
    text: shareTitle + shareText,
    link: {
      mobileWebUrl: shareURL,
      webUrl: shareURL,
    },
    buttons: [
      {
        title: '자세히 보기',
        link: {
          mobileWebUrl: shareURL,
          webUrl: shareURL,
        },
      },
      {
        title: '앱으로 이동',
        link: {
          androidExecutionParams: 'https://play.google.com/store/apps/details?id=com.aptrank.app'          
        },
      },
    ]
  });
}

function CopyToClipboard(copied_text, msg_pop){
  var txt = copied_text
  var t = document.createElement("textarea");
  t.value = txt;
  document.body.appendChild(t);  
  t.select();
  t.focus();
  document.execCommand('copy');
  document.body.removeChild(t);

  toastr.options = {
    closeButton: false,
    progressBar: false,
    showMethod: 'fadeIn',
    closeMethod: 'fadeOut',
    positionClass: "toast-bottom-center",
    timeOut: 1000
  };
  output = msg_pop
  toastr.success(output);
}

function CopyToClipboard2(copied_text, msg_pop){
  var txt = copied_text

  window.navigator.clipboard.writeText(txt).then(() => {
    toastr.options = {
      closeButton: false,
      progressBar: false,
      showMethod: 'fadeIn',
      closeMethod: 'fadeOut',
      positionClass: "toast-bottom-center",
      timeOut: 1000
    };
    output = msg_pop
    toastr.success(output);
  })
}

function openOuterLink(url){  
  if(checkMobile() == "ios"){
    window.location.href = url
  }
  else{
    window.open(url)
  }  
}

function openExternalLink(url){  
  window.location.href = url  
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */   
}

function openExternalLinkWithLoading(url){
  $('body').append("<div id='pageLoadingBack'><div class='spinner-grow text-pageLoading' role='status'></div><div style='font-size: 0.85em; color: white'><br>페이지 이동 중입니다</div></div>")  
  window.location.href = url
}

function openAptrank(){
  aURL = "https://www.realrankus.com/index.html" + "?reg=" + selectedRegion +"&sub=" + selectedSubRegion
  location.href = aURL
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */   
}

function openAptrankTHEME(){
  aURL = "https://www.realrankus.com/theme/index.html" + "?reg=" + selectedRegion +"&sub=" + selectedSubRegion
  location.href = aURL
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */   
}

function openOprank(){
  aURL = "https://www.realrankus.com/op/index.html" + "?reg=" + selectedRegion +"&sub=" + selectedSubRegion
  location.href = aURL
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */ 
}
function openAptrankBIZ2(){
  aURL = "https://www.realrankus.com/biz/index.html"
  if(checkMobile() == "ios"){
    window.location.href = aURL
  }
  else{
    window.open(aURL)
  }
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */
}

function openAptrankBIZ(){
  aURL = "https://www.realrankus.com/biz/index.html" + "?reg=" + selectedRegion +"&sub=" + selectedSubRegion
  location.href = aURL
  /*
  if(checkMobile() == "ios"){
    window.location.href = aURL
  }
  else{
    window.open(aURL)
  }
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */
}
function openAptrankNEWS(){
  aURL = "https://www.realrankus.com/newsinfo/index.html"
  location.href = aURL
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */
}
function openAptrankPRICE(){
  aURL = "https://www.realrankus.com/price/index.html"
  location.href = aURL
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */
}
function openAptrankMoneyFlow(){
  aURL = "https://www.realrankus.com/moneyflow/index.html"
  location.href = aURL
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */
}

function setBottomMenu(){
  bottomMenu_html = `
    <div id='bottom_memu_wrapper'>
      <div class='bottom_tab' id='tab1' onClick='openExternalLinkWithLoading("https://www.realrankus.com")'>아파트분석</div>
      <div class='bottom_tab' id='tab2' onClick='openExternalLinkWithLoading("https://www.realrankus.com/price")'>실거래가</div>
      <div class='bottom_tab' id='tab6' onClick='openExternalLinkWithLoading("https://www.realrankus.com/biz")'>지역분석</div>
      <div class='bottom_tab' id='tab9' onClick='openExternalLinkWithLoading("https://www.realrankus.com/cityclass")'>급지표</div>
      <div class='bottom_tab' id='tab8' onClick='openExternalLinkWithLoading("https://www.realrankus.com/moneyflow")'>시장지표</div>      
      <div class='bottom_tab' id='tab3' onClick='openExternalLinkWithLoading("https://www.realrankus.com/theme")'>테마검색</div>      
      <div class='bottom_tab' id='tab5' onClick='openExternalLinkWithLoading("https://www.realrankus.com/newsinfo")'>뉴스</div>      
      <div class='bottom_tab' id='tab7' onClick='openExternalLinkWithLoading("https://www.realrankus.com/priceCal")'>분양가계산</div>
      <div class='bottom_tab' id='tab4' onClick='openExternalLinkWithLoading("https://www.realrankus.com/op")'>오피스텔분석</div>
    </div>
  `
  $('#linkToAptrank_bottom').html(bottomMenu_html)
  var tabWidth = 75
  var bottom_menu_width = (tabWidth * 9) + "px"
  //$('.bottom_tab').css({'width' : tabWidth + 'px'})
  if(isMobile){
    $('#bottom_memu_wrapper').css({'width' : bottom_menu_width, 'overflow' : 'auto'})
  }  
  setupBottomMenu(currentMenu)
}

function setupBottomMenu(currentMenu){
  var selectedClass = ""
  var bgColor = "#e31939"

  if(currentMenu == "aptrank"){
     selectedClass = "#tab1"
     bgColor = "#e31939"
  }
  if(currentMenu == "aptrank_price"){
     selectedClass = "#tab2"
     bgColor = "#e31939"
  }  
  if(currentMenu == "aptrank_theme"){
    selectedClass = "#tab3"
    bgColor = "#e31939"
  }
  if(currentMenu == "aptrank_op"){
    selectedClass = "#tab4"
    bgColor = "#162235"
  }
  if(currentMenu == "aptrank_news"){
    selectedClass = "#tab5"
    bgColor = "#e31939"
  }
  if(currentMenu == "aptrank_biz"){
    selectedClass = "#tab6"
    bgColor = "#162235"
  }
  if(currentMenu == "aptrank_priceCal"){
    selectedClass = "#tab7"
    bgColor = "#162235"
  }
  if(currentMenu == "moneyflow"){
    selectedClass = "#tab8"
    bgColor = "#162235"
  }
  if(currentMenu == "cityclass"){
    selectedClass = "#tab9"
    bgColor = "#162235"
  }
  if(currentMenu == "aptrank_Guider"){
    selectedClass = ""
    bgColor = "#162235"
  }
  
  $(selectedClass).css({'background' : bgColor, 'color' : 'white'})
  $(selectedClass).prop('onclick', '').unbind('click');
  $(".bottom_tab").css({'border-top': "2px solid " + bgColor})

  //var scrollLeft = $(selectedClass).offset().left  
  //$("#linkToAptrank_bottom").scrollLeft(scrollLeft - 170);

  var scrollLeft = $(selectedClass).offset().left - $('#linkToAptrank_bottom').width() / 2 + $(selectedClass).width() / 2
  if(scrollLeft == undefined){
    scrollLeft = 0
  }
  $("#linkToAptrank_bottom").scrollLeft(scrollLeft);

  //PC 화면에서 innerHeight가 하단Bar를 수용할 수 없으면 표시하지 않음 (2024-01-09)

  var heightMargin = 0
  if(currentMenu == "aptrank_biz"){
    heightMargin = 1005
  }
  if(currentMenu == "aptrank_priceCal"){
    heightMargin = 1030
  }
  if(currentMenu == "moneyflow"){
    heightMargin = 1000
  }
  if(currentMenu == "cityclass"){
    heightMargin = 986
  }

  if(!isMobile && (currentMenu == "aptrank_biz" || currentMenu == "aptrank_priceCal" || currentMenu == "moneyflow" || currentMenu == "cityclass")){
    if(window.innerHeight <= heightMargin){
      $("#linkToAptrank_bottom").css({"display":"none"})
    }
    else{
      $("#linkToAptrank_bottom").css({"width":"100%", "z-index":"150"})
    }
    let delay = 150;
    let timer = null;
    $(window).on('resize', function(){      
      clearTimeout(timer);
      timer = setTimeout(function(){
        if (window.innerHeight > heightMargin) {
          $("#linkToAptrank_bottom").css({"display":"inline-block", "z-index":"150"})
        }
        if (window.innerHeight <= heightMargin) {
          $("#linkToAptrank_bottom").css({"display":"none"})
        }
      }, delay);
    });
  }
}

function setOffcanvasMenu(){  
  if(isMobile == false){       
    $('.offcanvas').css({'width' : '400px'}) //offcanvas    
  }
  else{
    $('.offcanvas').css({'width' : '300px'}) //offcanvas
    $('.offcanvas-body').css({'padding' : '5px'}) //offcanvas    
  }

  /*
  $("div#offcanvasRight.offcanvas").on("show.bs.offcanvas", function () {
    var offcanvas_menu_text = $("#offcanvasRight > .offcanvas-header > #offcanvasRightLabel").text()
    console.log(offcanvas_menu_text)
    if(offcanvas_menu_text == "MENU" || offcanvas_menu_text == "" || offcanvas_menu_text == undefined){
      var NID = getItemWithExpireTime('nLOG')
      if(NID){
        loadData(NID[0], NID[1])
      }
      //console.log(NID)
    }
  });
  */

  $("div.offcanvas").on("show.bs.offcanvas", function () {    
    var offcanvas = this;
    var hash = offcanvas.id;
    window.location.hash = hash;
    window.onhashchange = function () {
      if (!location.hash) {
        $(offcanvas).offcanvas("hide");
      }
    };
    /*
    var NID = getItemWithExpireTime('nLOG')
    if(NID){
      login_status = true
      loadData(NID[0], NID[1])
    }
    console.log(NID)
    */
  });

  offcanvas_html = `
        <div id="offcanvas_menu">
          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">아파트분석</div>
              <div class="offcanvas_sub_menu_description">대한민국 아파트 입지, 리얼랭커스</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/price')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">실거래가</div>
              <div class="offcanvas_sub_menu_description">보기 편한 실거래가, 리얼랭커스PRICE</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/biz')">          
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">지역분석</div>
              <div class="offcanvas_sub_menu_description">지역단위 부동산 시장 현황, 리얼랭커스BIZ</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/cityclass')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">부동산 급지표</div>
              <div class="offcanvas_sub_menu_description">전국의 도시별 백분위표, City Class</div>
            </div>
          </div>
          
          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/moneyflow')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">경제시장지표</div>
              <div class="offcanvas_sub_menu_description">하루 한 번 시장 지표를 읽는 습관, Money Flow</div>
            </div>
          </div>          

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/theme')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">테마검색</div>
              <div class="offcanvas_sub_menu_description">공시 1억, 5층 이하 / 분양권 / 재건축 모아보기</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/newsinfo')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">경제뉴스</div>
              <div class="offcanvas_sub_menu_description">부동산, 금융, 경제 뉴스 모아보기, 리얼랭커스 NEWS</div>
            </div>
          </div> 

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/priceCal')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">분양가계산기</div>
              <div class="offcanvas_sub_menu_description">적정 분양가의 합리적 계산, 분양가 GENERATOR</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/op')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">오피스텔분석</div>
              <div class="offcanvas_sub_menu_description">대한민국 오피스텔 입지, 오피스텔랭크</div>
            </div>
          </div>          

        </div>
        <div id="offcanvas_footer_link">
          <div class="offcanvas_footer_icon"><i class="fa-solid fa-circle-exclamation"></i></div>
          <div id="offcanvas_footer1" onClick="showNotice()">공지사항 / 업데이트</div>

          <div class="offcanvas_footer_icon"><i class="fa-solid fa-mug-saucer"></i></div>
          <div id="offcanvas_footer4" onClick="openOuterLink('https://cafe.naver.com/aptrankkr')">네이버 카페</div>

          <div class="offcanvas_footer_icon"><i class="fa-brands fa-youtube"></i></div>
          <div id="offcanvas_footer2" onClick="openOuterLink('https://youtube.com/@realrankus?si=_XXX2_WsVq_MtlFa')">유튜브: @realrankus</div>

          <div class="offcanvas_footer_icon"><i class="fa-brands fa-instagram"></i> </div>
          <div id="offcanvas_footer3" onClick="openOuterLink('https://www.instagram.com/realrankus/')">인스타그램: @realrankus</div>         

          <div class="offcanvas_footer_icon"><i class="fa-brands fa-facebook"></i></div>
          <div id="offcanvas_footer5" onClick="openOuterLink('https://www.facebook.com/aptrank/')">페이스북</div>
        </div>

        <div id="offcanvas_footer">
        </div>
  `

  offcanvas_info_html = `
    <div id="offcanvas_company_long">
      <div id="company_info_detail">
        <div class="company_info_text">상호</div>
        <div onClick="openOuterLink('https://imjinsa.com/')"><img src="https://www.realrankus.com/image/company_CI.png" height='20'></div>

        <div class="company_info_text">대표이사</div>
        <div>한승훈</div>

        <div class="company_info_text">사업자등록번호</div>
        <div>725-86-02829</div>

        <div class="company_info_text">통신판매업신고</div>
        <div>제2023-서울강남-05016호</div>

        <div class="company_info_text">제휴문의</div>
        <div><a href="mailto:contact@imjinsa.com" style='text-decoration:none; color: #888;'>contact@imjinsa.com</a></div>

        <div class="company_info_text">본사</div>
        <div onClick="openOuterLink('https://naver.me/FiOAp7R4')">서울특별시 강남구 테헤란로77길 11-9 7F 에이113호</div>
      </div>
      <hr>
      <div id='company_CI'>        
        <div onClick="openOuterLink('https://ccei.creativekorea.or.kr/jeju/')"><img src="https://www.realrankus.com/image/support_01.png" height='30'><span style='font-size: 0.8em'><br> 보육기업(2023-08-30)</span></div>
        <hr>
        <div style='margin-bottom:5px'>ⓒ Copyright 2022. Imjinsa Inc. All Rights Reserved.</div>        
      </div>
    </div>
  `
  $(".offcanvas-body").html(offcanvas_html)
  $(".offcanvas-body").append(offcanvas_info_html)
  setupOffcanvas(currentMenu)
}

window.name='opener';

var naverLogin = new naver.LoginWithNaverId(
	{
		clientId: NAVER_CLIENT_KEY,
		//callbackUrl: "http://127.0.0.1:5500/login/callback.html",
		callbackUrl: "https://www.realrankus.com/login/callback.html",
		isPopup: false,
		loginButton: {color: "green", type: 3, height: 60}
	}
);

/* (4) 네아로 로그인 정보를 초기화하기 위하여 init을 호출 */
naverLogin.init();

function setupOffcanvas(currentMenu){
  localStorage.setItem('pageName', pageName)
  /*
  $('.offcanvas_link').on('mousedown', function(e){
    $(this).addClass('offcanvas_active')
  })
  $('.offcanvas_link').on('mouseleave', function(e){
    $(this).removeClass('offcanvas_active')
  })
  */
  if(currentMenu == "aptrank"){
    $('.offcanvas-header').css({'background' : '#f23351', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(0).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(0).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(0).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(0).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(0).css('color', '#f23351')
  }

  if(currentMenu == "aptrank_price"){
    $('.offcanvas-header').css({'background' : '#f23351', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(1).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(1).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(1).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(1).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(1).css('color', '#f23351')
  }

  if(currentMenu == "aptrank_biz"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(2).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(2).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(2).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(2).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(2).css('color', '#1b3680')

    $('#offcanvas_footer_link').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer_link').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }

  if(currentMenu == "cityclass"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(3).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(3).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(3).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(3).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(3).css('color', '#1b3680')

    $('#offcanvas_footer_link').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer_link').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }

  if(currentMenu == "moneyflow"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(4).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(4).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(4).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(4).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(4).css('color', '#1b3680')

    $('#offcanvas_footer_link').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer_link').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }
  
  if(currentMenu == "aptrank_theme"){
    $('.offcanvas-header').css({'background' : '#f23351', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(5).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(5).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(5).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(5).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(5).css('color', '#f23351')
  }
  
  if(currentMenu == "aptrank_news"){
    $('.offcanvas-header').css({'background' : '#f23351', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(6).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(6).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(6).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(6).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(6).css('color', '#f23351')
  }
  
  if(currentMenu == "aptrank_priceCal"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(7).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(7).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(7).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(7).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(7).css('color', '#1b3680')

    $('#offcanvas_footer_link').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer_link').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }  

  if(currentMenu == "aptrank_op"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(8).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(8).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(8).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(8).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(8).css('color', '#1b3680')
  }

  if(currentMenu == "aptrank_Guider"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_footer_link').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer_link').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }

  login_checker()
}

function setOffcanvasProfile(userID, userName, userEmail, userAge, userBirthday, userBirthyear, userGender, userMobile, userNickName, provider){
  if(isMobile == false){       
    $('.offcanvas').css({'width' : '400px'}) //offcanvas    
  }
  else{
    $('.offcanvas').css({'width' : '300px'}) //offcanvas
    $('.offcanvas-body').css({'padding' : '5px'}) //offcanvas
  }

  var offcanvas_html = ""

  var displayProvider = ""

  if(provider == "NAVER"){    
    displayProvider = `
    <div style='display:grid; align-content:center; justify-content:center; background:#03C75A; border-radius: 5px; margin-top: 5px'>
    <img src='https://www.realrankus.com/image/naver_CI.png' height='15'></div>
    <div style='margin-left: 5px'; margin-top: 5px>네이버</div>
    `    
  }
  if(provider == "KAKAO"){
    displayProvider = `
    <div style='display:grid; align-content:center; justify-content:center; background:#FEE500; border-radius: 50%; margin-top: 5px''>
    <img src='https://www.realrankus.com/image/kakao_CI.png' height='15'></div>
    <div style='margin-left: 5px; margin-top: 5px'>카카오</div>
    `
  }
  if(provider == "APPLE"){    
    displayProvider = `
    <div style='display:grid; align-content:center; justify-content:center; background:#000000; border-radius: 5px; margin-top: 5px'>
    <img src='https://www.realrankus.com/image/apple_CI.png' height='15'></div>
    <div style='margin-left: 5px; margin-top: 5px'>Apple</div>
    ` 
  }

  offcanvas_html += `
  <div id="offcanvas_menu">  
  `

  var displayName = ""
  if(userName == null || userName == undefined || userName == ""){}
  else{
    if(userName.length == 2){
      displayName = userName.substr(0, 1) + "*"
    }
    else if(userName.length >= 3){
      displayName = userName.substr(0, 1)
      for(i = 0 ; i < userName.length-2 ; i++){
        displayName += "*"
      }
      displayName += userName.substr(userName.length-1, 1)
    }
    else{
      displayName = userName
    }

    offcanvas_html += `    
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">이름</div>
          <div class="offcanvas_sub_menu_title">${displayName}</div>
        </div>
      </div>
      `
  }

  if(userNickName == null || userNickName == undefined || userNickName == ""){ }
  else{
    offcanvas_html += `
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">별명</div>
          <div class="offcanvas_sub_menu_title">${userNickName}</div>
        </div>
      </div>
      `
  }
          
  offcanvas_html += `
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">이메일</div>
          <div class="offcanvas_sub_menu_title">${userEmail}</div>
        </div>
      </div>
      `

  /*
  if(userAge == null || userAge == undefined || userAge == ""){ }
  else{
    offcanvas_html += `
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">연령</div>
          <div class="offcanvas_sub_menu_title">${userAge}세</div>
        </div>
      </div>
      `
    }
    */

    if(userBirthday == null || userBirthday == undefined || userBirthday == ""){ }
    else{
      var displayBirth = ""
      var displayBirthday = ""
      if(provider == "NAVER"){
        displayBirthday = userBirthday
      }
      if(provider == "KAKAO"){
        displayBirthday = userBirthday.substr(0, 2) + "-" + userBirthday.substr(2, 2)
      }
      
      if(userBirthyear == null || userBirthyear == undefined || userBirthyear == ""){
        displayBirth = displayBirthday        
      }
      else{
        displayBirth = userBirthyear + "-" + displayBirthday
      }
      offcanvas_html += `
        <div class='offcanvas_info'>          
          <div class="offcanvas_sub_menu">
            <div class="offcanvas_sub_menu_description">생년월일</div>
            <div class="offcanvas_sub_menu_title">${displayBirth}</div>
          </div>
        </div>
        `
    }

    if(userGender == null || userGender == undefined || userGender == ""){ }
    else{
      var displayGender = ""
      if(provider == "NAVER"){
        if(userGender == "M"){
          displayGender = "남성"
        }
        else if(userGender == "F"){
          displayGender = "여성"
        }
        else{
          displayGender = "제공 안 함"
        }
      }
      if(provider == "KAKAO"){
        if(userGender == "male"){
          displayGender = "남성"
        }
        else if(userGender == "femail"){
          displayGender = "여성"
        }
        else{
          displayGender = "제공 안 함"
        }
      }
      offcanvas_html += `
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">성별</div>
          <div class="offcanvas_sub_menu_title">${displayGender}</div>
        </div>
      </div>
      `
    }

    /*
    var displayMobile = ""
    if(userMobile == null || userMobile == undefined || userMobile == ""){
      displayMobile = "제공 안 함"
    }
    else{
      displayMobile = userMobile
    }
    offcanvas_html += `
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">휴대폰번호</div>
          <div class="offcanvas_sub_menu_title">${displayMobile}</div>
        </div>
      </div>
    `
    */

    offcanvas_html += `
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">로그인 제공</div>
          <div class="offcanvas_sub_menu_title" style='display:grid; grid-template-columns:30px 1fr'>${displayProvider}</div>
        </div>
      </div>
    `    

  $("#offcanvasProfile > .offcanvas-header > #offcanvasRightLabel").html("사용자정보")
  $("#offcanvasProfile > .offcanvas-body").html(offcanvas_html)
  $("#offcanvasProfile > .offcanvas-header").attr({"data-bs-toggle":"offcanvas", "data-bs-target" : "#offcanvasRight", "aria-controls" : "offcanvasRight"})  
}

function numberFormat(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberToKorean(number){
  var inputNumber  = number < 0 ? false : number;
  var unitWords    = ['', '만', '억', '조', '경'];
  var splitUnit    = 10000;
  var splitCount   = unitWords.length;
  var resultArray  = [];
  var resultString = '';

  for (var i = 0; i < splitCount; i++){
      var unitResult = (inputNumber % Math.pow(splitUnit, i + 1)) / Math.pow(splitUnit, i);
      unitResult = Math.floor(unitResult);
      if (unitResult > 0){
          resultArray[i] = unitResult;
      }
  }

  for (var i = 0; i < resultArray.length; i++){
      if(!resultArray[i]) continue;
      resultString = String(numberFormat(resultArray[i])) + unitWords[i] + " " + resultString;
  }

  return resultString;
}