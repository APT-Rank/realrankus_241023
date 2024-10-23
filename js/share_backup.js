var shareTitle = ""
var shareText = ""
var shareURL = ""
var kakaoShareText = []
var kakaoKey = "a8a036bfb275fc87317e07f76dccecb2"
var isMobile = false
var login_status = true

todayCount = cookieVal('visitToday')
yearCount = cookieVal('visitYear')
todayCount++
yearCount++
$.cookie('visitToday', todayCount, { expires: 1, path: '/' });
$.cookie('visitYear', todayCount, { expires: 365, path: '/' });

function cookieVal(cookieName){
  if($.cookie(cookieName) != undefined){
    return $.cookie(cookieName)
  }
  return 0      
}

var UserAgent = navigator.userAgent;
var scr_width = screen.width
var scr_height = screen.height
if (UserAgent.match(/iPhone|ipad|Android|Windows CE|BlackBerry|Symbian|Windows Phone|webOS|Opera Mini|Opera Mobi|POLARIS|IEMobile|lgtelecom|nokia|SonyEricsson/i) != null || UserAgent.match(/LG|SAMSUNG|Samsung/) != null)
{
  if(scr_width < scr_height){
    isMobile = true
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function countUp(pageName) {
  const updates = {};  
  updates[today_str + "/" + pageName + "/DayCount"] = firebase.database.ServerValue.increment(1);    
  firebase.database().ref().update(updates);
}

function regionCountUp(pageName, regionName) {
  const updates = {};  
  updates[today_str + "/" + pageName + "/region/" + regionName] = firebase.database.ServerValue.increment(1);    
  firebase.database().ref().update(updates);
} 

function setGrade(score){
  complex_grade = ""

  if(score >= 75){
    complex_grade = "S+"
  }
  else if(score < 75 && score >= 65){
    complex_grade = "S"
  }
  else if(score < 65 && score >= 50){
    complex_grade = "A"
  }
  else if(score < 50 && score >= 40){
    complex_grade = "B"
  }
  else{
    complex_grade = "C"
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
  Kakao.Link.sendDefault({
    objectType: 'text',
    text: shareText + "\n#aptrank.kr",
    link: {
      mobileWebUrl: shareURL + "#aptrank.kr",
      webUrl: shareURL + "#aptrank.kr",
    },
    buttons: [
      {
        title: '자세히 보기',
        link: {
          mobileWebUrl: shareURL + "#aptrank.kr",
          webUrl: shareURL + "#aptrank.kr",
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
      mobileWebUrl: shareURL + "#aptrank.kr",
      webUrl: shareURL + "#aptrank.kr",
    },
    buttons: [
      {
        title: '자세히 보기',
        link: {
          mobileWebUrl: shareURL + "#aptrank.kr",
          webUrl: shareURL + "#aptrank.kr",
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

function openAptrank(){
  aURL = "https://www.realrankus.com" + "?reg=" + selectedRegion +"&sub=" + selectedSubRegion + "#aptrank.kr"
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
  aURL = "https://www.realrankus.com/theme" + "?reg=" + selectedRegion +"&sub=" + selectedSubRegion + "#aptrank.kr"
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
  aURL = "https://www.realrankus.com/op" + "?reg=" + selectedRegion +"&sub=" + selectedSubRegion + "#aptrank.kr"
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
  aURL = "https://www.realrankus.com/biz" + "#aptrank.kr"
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
  aURL = "https://www.realrankus.com/biz" + "?reg=" + selectedRegion +"&sub=" + selectedSubRegion + "#aptrank.kr"
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
  aURL = "https://www.realrankus.com/newsinfo" + "#aptrank.kr"
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
  aURL = "https://www.realrankus.com/price" + "#aptrank.kr"
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
  aURL = "https://www.realrankus.com/moneyflow" + "#aptrank.kr"
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

function setOffcanvasMenu(){
  if(isMobile == false){       
    $('.offcanvas').css({'width' : '400px'}) //offcanvas    
  }
  else{
    $('.offcanvas').css({'width' : '300px'}) //offcanvas
    $('.offcanvas-body').css({'padding' : '5px'}) //offcanvas
  }

  $("div.offcanvas").on("show.bs.offcanvas", function () {
    var offcanvas = this;
    var hash = offcanvas.id;
    window.location.hash = hash;
    window.onhashchange = function () {
      if (!location.hash) {
        $(offcanvas).offcanvas("hide");
      }
    };
  });

  offcanvas_html = `
        <div id="offcanvas_menu">
          <div class='offcanvas_link' onClick="openExternalLink('https://www.realrankus.com#aptrank.kr')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">리얼랭커스</div>
              <div class="offcanvas_sub_menu_description">데이터로 분석된 대한민국 아파트 입지</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLink('https://www.realrankus.com/price#aptrank.kr')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">리얼랭커스 PRICE</div>
              <div class="offcanvas_sub_menu_description">보기 편한 아파트 실거래가</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLink('https://www.realrankus.com/theme#aptrank.kr')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">리얼랭커스 THEME</div>
              <div class="offcanvas_sub_menu_description">공시 1억, 5층 이하 / 분양권 / 재건축 모아보기</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLink('https://www.realrankus.com/op#aptrank.kr')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">오피스텔랭크</div>
              <div class="offcanvas_sub_menu_description">데이터로 분석된 대한민국 오피스텔 입지</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLink('https://www.realrankus.com/newsinfo#aptrank.kr')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">리얼랭커스 NEWS</div>
              <div class="offcanvas_sub_menu_description">부동산, 금융, 경제 뉴스 모아보기</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLink('https://www.realrankus.com/biz#aptrank.kr')">          
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">리얼랭커스 BIZ</div>
              <div class="offcanvas_sub_menu_description">데이터로 분석된 지역단위 시장 현황</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLink('https://www.realrankus.com/priceCal#aptrank.kr')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">분양가 GENERATOR</div>
              <div class="offcanvas_sub_menu_description">적정 분양가의 합리적 계산</div>
            </div>
          </div>          

          <div class='offcanvas_link' onClick="openExternalLink('https://www.realrankus.com/moneyflow#aptrank.kr')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">Money Flow</div>
              <div class="offcanvas_sub_menu_description">하루 한 번 시장 지표를 읽는 습관</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLink('https://www.realrankus.com/cityclass#aptrank.kr')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">City Class [BETA]</div>
              <div class="offcanvas_sub_menu_description">전국의 도시별 백분위표</div>
            </div>
          </div>          

        </div>
        <div id="offcanvas_footer">
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
  `

  offcanvas_info_html = `
    <div id="offcanvas_company">
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

function setupOffcanvas(currentMenu){
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

  if(currentMenu == "aptrank_theme"){
    $('.offcanvas-header').css({'background' : '#f23351', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(2).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(2).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(2).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(2).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(2).css('color', '#f23351')
  }

  if(currentMenu == "aptrank_op"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(3).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(3).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(3).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(3).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(3).css('color', '#1b3680')
  }

  if(currentMenu == "aptrank_news"){
    $('.offcanvas-header').css({'background' : '#f23351', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(4).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(4).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(4).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(4).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(4).css('color', '#f23351')
  }

  if(currentMenu == "aptrank_biz"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(5).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(5).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(5).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(5).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(5).css('color', '#1b3680')

    $('#offcanvas_footer').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }

  if(currentMenu == "aptrank_priceCal"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(6).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(6).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(6).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(6).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(6).css('color', '#1b3680')

    $('#offcanvas_footer').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }   

  if(currentMenu == "moneyflow"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(7).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(7).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(7).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(7).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(7).css('color', '#1b3680')

    $('#offcanvas_footer').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }

  if(currentMenu == "cityclass"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(8).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(8).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(8).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(8).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(8).css('color', '#1b3680')

    $('#offcanvas_footer').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }  
}