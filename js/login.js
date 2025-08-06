var login_status = false
var kakao_login_status = false
var naver_login_status = false
var apple_login_status = false
const dbRef = firebase.database().ref();
//const expireTime = 1000 * 60

function showLoginLoading(){
	var titleHtml = "<div class='popupTitle'>로그인</div>";      
	var detailHtml = `
		<div class="spinner-border text-dark" role="status" style='margin-top:10px'></div>
		<div style='font-weight: 600'><br>로그인 요청 중...</div>
	`;
	var footerHtml = "";

	$("#loginModalLabel").html(titleHtml);
	$("#loginDetail").html(detailHtml);
	$("#loginfooter").html(footerHtml);
	$("#loginModal > .modal-dialog > .modal-content > .modal-header").hide()
	//$("#loginModal > .modal-dialog > .modal-content").css({'opacity':'0.7'})
	$("#loginModal").modal("show");
}

function returnLoginStatus(token){
	if(token == null || token == undefined || token == ""){      
        return false
	}
	else{
		return true	
	}
}

function getLoginStatus(status1, status2, status3){
	if(status1 == true || status2 == true || status3 == true){
		return true
	}
	else{
		return false
	}
}

// 만료 시간과 함께 데이터를 저장
function setItemWithExpireTime(keyName, keyValue, tts, provider){
	// localStorage에 저장할 객체
	const obj = {
		value : keyValue,
		expire : Date.now() + tts,
		provider : provider
	}
	// 객체를 JSON 문자열로 변환
	const objString = JSON.stringify(obj);
	// setItem
	window.localStorage.setItem(keyName, objString);
}

// 만료 시간을 체크하며 데이터 읽기
function getItemWithExpireTime(keyName) {
	// localStorage 값 읽기 (문자열)
	const objString = window.localStorage.getItem(keyName);
	
	// null 체크
	if(!objString) {
		return null;
	}
	// 문자열을 객체로 변환
	const obj = JSON.parse(objString);
	// 현재 시간과 localStorage의 expire 시간 비교
	if(Date.now() > obj.expire) {
		// 만료시간이 지난 item 삭제
		window.localStorage.removeItem(keyName);
		// null 리턴
		return null;
	}
	// 만료기간이 남아있는 경우, value 값 리턴
	return [obj.value, obj.provider];
}

function writeUserData(userID, name, email, age, birthday, birthyear, gender, mobile, nickname, provider){	
	firebase.database().ref('users/' + userID + '/profile/').set({
		user_name: name,
		user_nick_name : nickname,
		email: email,
		age: age,
		birthday : birthday,
		birthyear : birthyear,
		gender : gender,
		mobile : mobile,
		provider : provider
	}).then(function (res){
		// setItem
		//if (broswerInfo.indexOf("inApp") > -1) {
			const user_obj = {
				user_name: name,
				user_nick_name : nickname,
				email: email,
				age: age,
				birthday : birthday,
				birthyear : birthyear,
				gender : gender,
				mobile : mobile,
				provider : provider
			}			
			// 객체를 JSON 문자열로 변환
			const userObjString = JSON.stringify(user_obj);
			window.localStorage.setItem("profile", userObjString);
		//}
		firebase.database().ref('users/' + userID + '/status/').set({
			accused: 0,
			likeit_comment: "",
			blocked: false,
			block_days: 0,
			block_start: '1976-1-1',
			block_end: '1976-1-1'
		})		
		var redirect = setLogoutDest(pageName)
		//var redirect = "http://127.0.0.1:5500"
		window.location.replace(redirect);
	});	
}

function loadData(userID, provider){	
	const dbRef = firebase.database().ref();
	dbRef.child("users").child(userID).child("profile").get().then((snapshot) => {
	  if (snapshot.exists()) {
		user = snapshot.val()
		  if(user.user_name == null || user.user_name == undefined){
			  userName = "정보 없음"
		  }
		  else{
			  userName = user.user_name
		  }

		  if(user.user_nick_name == null || user.user_nick_name == undefined){
			  userNickName = "랭커스" + (Math.floor(Math.random() * 10000)).toString();
		  }
		  else{
			  userNickName = user.user_nick_name
		  }

		  if(user.email == null || user.email == undefined){
			  userEmail = "정보 없음"
		  }
		  else{
			  userEmail = user.email
		  }

		  if(user.age == null || user.age == undefined){
			  userAge = "정보 없음"
		  }
		  else{
			  userAge = user.age
		  }

		  if(user.birthday == null || user.birthday == undefined){
			  userBirthday = "정보 없음"
		  }
		  else{
			  userBirthday = user.birthday
		  }

		  if(user.birthyear == null || user.birthyear == undefined){
			  userBirthyear = "정보 없음"
		  }
		  else{
			  userBirthyear = user.birthyear
		  }

		  if(user.gender == null || user.gender == undefined){
			  userGender = "정보 없음"
		  }
		  else{
			  userGender = user.gender
		  }

		  if(user.mobile == null || user.mobile == undefined){
			  userMobile = "정보 없음"
		  }
		  else{
			  userMobile = user.mobile
		  }				

		login_status = true

		// setItem
		//if (broswerInfo.indexOf("inApp") > -1) {
			const user_obj = {
				user_name: userName,
				user_nick_name : userNickName,
				email: userEmail,
				age: userAge,
				birthday : userBirthday,
				birthyear : userBirthyear,
				gender : userGender,
				mobile : userMobile,
				provider : provider
			}
			// 객체를 JSON 문자열로 변환
			const userObjString = JSON.stringify(user_obj);
			window.localStorage.setItem("profile", userObjString);
		//}

		setFirebaseID(userEmail, userID.toString())

		if(provider == "NAVER"){
			setNaverLoginStatus(userName, userNickName, userEmail);
		}
		if(provider == "KAKAO"){
			setKakaoLoginStatus(userName, userNickName, userEmail);
		}
		if(provider == "APPLE"){
			setAppleLoginStatus(userName, userNickName, userEmail);
		}
		setOffcanvasProfile(userID, userName, userEmail, userAge, userBirthday, userBirthyear, userGender, userMobile, userNickName, provider)
		
	  } else {
		console.log("No data available");
	  }
	}).catch((error) => {
	  console.error(error);
	});	
}

/* 미사용
function kakaoRefresh(token){
	const KAKAO_REST_API_KEY = "a9beb4e1299d7fac7e38fdecb8f8038e"	

	fetch(`https://kauth.kakao.com/oauth/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: "grant_type=refresh_token&client_id=" + KAKAO_REST_API_KEY + "&refresh_token=" + token,
	})
	.then(res => res.json())
	.then(data => {
		Kakao.Auth.setAccessToken(data.access_token)
		localStorage.setItem('kToken', data.access_token)
	})
	.catch(error => {
		console.log(error)
	})
}
*/

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

/* (4-1) 임의의 링크를 설정해줄 필요가 있는 경우 */
//$("#gnbLogin").attr("href", naverLogin.generateAuthorizeUrl());

/* (5) 현재 로그인 상태를 확인 */
/*
window.addEventListener('load', function () {
	naverLogin.getLoginStatus(function (status) {
		if (status) {
			/* (6) 로그인 상태가 "true" 인 경우 로그인 버튼을 없애고 사용자 정보를 출력합니다. 
			//login_status = status
			naver_login_status = status			
			setLoginStatus();
		}
		else{
			$('#offcanvasRightLabel').html("<div data-bs-toggle='modal' data-bs-target='#loginModal' id='loginPopup' onClick='showLogin()'><b>로그인</b>이 필요합니다</div>") 
		}
	})	
});
*/

function agreementChecker(){
	var check_policy = $("#check_policy").is(":checked")
	var check_private = $("#check_privacy").is(":checked")
	var check_age = $("#check_age").is(":checked")

	if(check_policy && check_private && check_age){
		return true
	}
	else{
		alert("계속 진행하려면 필수 약관에 동의해 주세요")
	}
}

function allAgree(){
	$("input:checkbox[id='check_policy']").prop("checked", true);
	$("input:checkbox[id='check_privacy']").prop("checked", true);
	$("input:checkbox[id='check_age']").prop("checked", true);
}

function showLogin(){
	var titleHtml = "<div class='popupTitle'>리얼랭커스 로그인</div>";      
	var detailHtml = `
	<div id='policy_box'>
		<div style='margin-bottom: 10px; font-size: 0.85em; font-weight: 600; text-align:center'>계속 진행하려면 필수 약관에 동의해 주세요</div>
		<div id='policy_agreement'>
			<div><input type="checkbox" class='policy_checker' id='check_policy'><label for='check_policy'>이용약관</label></div><div onClick='openOuterLink("https://www.realrankus.com/common/policy.html")'>보기</div>
			<div><input type="checkbox" class='policy_checker' id='check_privacy'><label for='check_privacy'>개인정보 수집, 이용 동의</label></div><div onClick='openOuterLink("https://www.realrankus.com/common/privacy.html")'>보기</div>
			<div><input type="checkbox" class='policy_checker' id='check_age'><label for='check_age'>만 14세 이상 확인</label></div> <div></div>
			<div id='all_agree'><div id='all_agree_button' onClick='allAgree()'>전체 동의 하기</div></div>
		</div>
	</div>
	  <div id="kakaoIdLogin" onclick="kakaoLogin()"><div class='loginCI'><img src="https://www.realrankus.com/image/kakao_CI.png" height='20'></div><div class='loginText'>카카오로 계속하기</div></div>   	  
	  <div id="naverIdLogin" style="display: none;"></div>	  
   	  <div id="naverLogin"><div class='loginCI'><img src="https://www.realrankus.com/image/naver_CI.png" height='20'></div><div class='loginText' style='color:white'>네이버로 계속하기</div></div>
	  <div id="appleIdLogin" onclick="appleProvider()"><div class='loginCI'><img src="https://www.realrankus.com/image/apple_CI.png" height='20'></div><div class='loginText' style='color:white'>Apple로 계속하기</div></div>
	`;
	var footerHtml = "";

	$("#loginModalLabel").html(titleHtml);
	$("#loginDetail").html(detailHtml);
	$("#loginfooter").html(footerHtml);
	$("#loginModal > .modal-dialog > .modal-content > .modal-header").show()
	$("#loginModal > .modal-dialog > .modal-content").css({'opacity':'1.0'})

	naverLogin.init();

	$("#naverLogin").on("click", function(){
		if(agreementChecker()){
			var btnNaverLogin = document.getElementById("naverIdLogin").firstChild;
			btnNaverLogin.click();
		}
	});
}

function setFirebaseID(userEmail, userID){
	firebase.auth().createUserWithEmailAndPassword(userEmail, userID.toString())
	.then((userCredential) => {
	// Signed in 
	var user = userCredential.user;
	console.log("AUTH CREATED")
	})
	.catch((error) => {
		var errorCode = error.code;
		var errorMessage = error.message;
		console.log(errorMessage)

		firebase.auth().signInWithEmailAndPassword(userEmail, userID.toString())
		.then((userCredential) => {
			// Signed in
			var user = userCredential.user;
			// ...
		})
		.catch((error) => {
			var errorCode = error.code;
			var errorMessage = error.message;
			console.log(errorMessage)	
		});		
	});
}

function login_checker(){
	var NID = getItemWithExpireTime('nLOG')
	var profile = window.localStorage.getItem("profile");
	const profile_obj = JSON.parse(profile);
	if(NID){
		login_status = true
		if(profile){
			var userName = profile_obj.user_name
			var userNickName = profile_obj.user_nick_name
			var userEmail = profile_obj.email
			var userAge = profile_obj.age
			var userBirthday = profile_obj.birthday
			var userBirthyear = profile_obj.birthyear
			var userGender = profile_obj.gender
			var userMobile = profile_obj.mobile
			var provider = NID[1]

			setFirebaseID(userEmail, NID[0].toString())

			if(provider == "NAVER"){
				setNaverLoginStatus(userName, userNickName, userEmail);
			}
			if(provider == "KAKAO"){
				setKakaoLoginStatus(userName, userNickName, userEmail);
			}
			if(provider == "APPLE"){
				setAppleLoginStatus(userName, userNickName, userEmail);
			}
			setOffcanvasProfile(NID[0], userName, userEmail, userAge, userBirthday, userBirthyear, userGender, userMobile, userNickName, provider)
			//console.log("로컬스토리지 프로필 정보 있음")
		}
		else{
			//console.log("로컬스토리지 프로필 정보 없음")
			loadData(NID[0], NID[1])
		}
	}
	else{
		naverLogin.getLoginStatus(function (status)  {
			if (status) {
				/* (6) 로그인 상태가 "true" 인 경우 로그인 버튼을 없애고 사용자 정보를 출력합니다. */
				login_status = true
				info_age = naverLogin.user.getAge()
				info_birthday = naverLogin.user.getBirthday()
				info_birthyear = naverLogin.user.getBirthyear()
				info_email = naverLogin.user.getEmail()
				info_gender = naverLogin.user.getGender()
				info_id = naverLogin.user.getId()
				info_mobile = naverLogin.user.getMobile()
				info_nickname = naverLogin.user.getNickName()
				info_name = naverLogin.user.getName()
				info_provider = "NAVER"
	
				setItemWithExpireTime('nLOG', info_id, expireTime, "NAVER")
				setNaverLoginStatus(info_name, info_nickname, info_email);
				writeUserData(info_id, info_name, info_email, info_age, info_birthday, info_birthyear, info_gender, info_mobile, info_nickname, info_provider)
				setOffcanvasProfile(info_id, info_name, info_email, info_age, info_birthday, info_birthyear, info_gender, info_mobile, info_nickname, info_provider)
	
				console.log("NAVER LOGGED IN")
			}
			else{				
					kToken = localStorage.getItem('kToken')
					console.log("TOKEN: ", kToken)
					Kakao.Auth.setAccessToken(kToken)
					Kakao.Auth.getStatusInfo(function(status){
						console.log("KAKAO Status: ", status.status)
						if(status.status == "connected"){
							console.log("KAKAO CONNECTED")
							login_status = true
							getkakaouserinfo()
						}
						else{
							var AppleLogging = localStorage.getItem("AppleLogging");
							if(AppleLogging){
								showLoginLoading()								
								localStorage.removeItem('AppleLogging')
							}
							console.log("START appleSignInRedirectResult")
							//getAppleUserInfo()
							appleSignInRedirectResult()
						}
					})			
			}
		})	
	}
}
function setLogoutStatus(){
	//naver_login_status = false
	//kakao_login_status = false
	//apple_login_status = false
	//login_status = false
	var offcanvas_login_msg = "<div id='loginPopup'>리얼랭커스의 모든 서비스를 이용하세요</div>"
	offcanvas_login_msg += "<div id='aptrankLoginButton2' data-bs-toggle='modal' data-bs-target='#loginModal' onClick='showLogin()'>리얼랭커스 로그인</div>"
	$('#offcanvasRightLabel').html(offcanvas_login_msg)
	$('#loginPopup').css({"font-size":"0.8em", "margin-bottom":"10px"})
	//localStorage.removeItem('com.naver.nid.access_token')
	//localStorage.removeItem('aToken')
	//localStorage.removeItem('aName')
	//localStorage.removeItem('kToken')
	//localStorage.removeItem('krToken')
	localStorage.removeItem('kToken')
	localStorage.removeItem('nLOG')
	localStorage.removeItem('profile')
	
	if(login_status){
		login_status = false
		firebase.auth().signOut()
		//location.reload()
		var redirect = setLogoutDest(pageName)
		//var redirect = "http://127.0.0.1:5500"
		window.location.replace(redirect);
	} 	
}

/* (6) 로그인 상태가 "true" 인 경우 로그인 버튼을 없애고 사용자 정보를 출력합니다. */
function setNaverLoginStatus(info_name, info_nickname, info_email) {
	//kakaoLogout()
	//appleLogout()
	//var profileImage = naverLogin.user.getProfileImage();
	//var nickName = naverLogin.user.getNickName();
	//var imageViewer = '';
	//if (profileImage) {
	//		imageViewer += '<br><br><img src="' + profileImage + '" height=50 /> <p>';
	//}
	//$("#naverIdLogin_loginButton").html(imageViewer + nickName + '님 반갑습니다.</p>');

	$('#loginPopup').hide()

	var offcanvas_footer_html = `
	<div class="offcanvas_footer_icon"><i class="fa-solid fa-list-ol"></i></div>
	<div id="offcanvas_footer6" onClick="openOuterLink('https://www.realrankus.com/common/policy.html')">이용약관</div>          

	<div class="offcanvas_footer_icon"><i class="fa-solid fa-user-shield"></i></div>
	<div id="offcanvas_footer7" onClick="openOuterLink('https://www.realrankus.com/common/privacy.html')">개인정보처리방침</div>

	<div></div><div></div>
	<div class='offcanvas_footer_icon'><i class='fa-solid fa-right-from-bracket'></i></div>
	<div id='gnbLogin'>네이버 로그아웃</div>
	`
    $("#offcanvas_footer").html(offcanvas_footer_html)

	$("#gnbLogin").attr("href", "#");
	/* (7) 로그아웃 버튼을 설정하고 동작을 정의합니다. */	

	replace_dest = setLogoutDest(pageName)
	//replace_dest = setLogoutDest("https://www.realrankus.com")	

	$("#gnbLogin").click(function (e) {		
		e.preventDefault();
		localStorage.removeItem('nLOG')
		localStorage.removeItem('profile')
		naverLogin.logout();
		var redirect = setLogoutDest(pageName)
		//var redirect = "http://127.0.0.1:5500"
		window.location.replace(redirect);
	});
	
	//$('#offcanvasRightLabel').html(info_name + "(" + info_nickname + ")<br><span style='font-size:0.8em'>" + info_email)
	$('#offcanvasRightLabel').html(info_nickname + "님 반갑습니다!<br><span style='font-size:0.8em'>모든 서비스를 이용할 수 있어요</span>")
	$('#offcanvasRightLabel').css({'font-size':'1.0em'})
	$("#offcanvasRight > .offcanvas-header > #offcanvasRightLabel").attr({"data-bs-toggle":"offcanvas", "data-bs-target" : "#offcanvasProfile", "aria-controls" : "offcanvasRight"})
}

function startNaverLogin(){
	if(agreementChecker()){
		showLoginLoading()
		naverLogin.init();
	}
}

function kakaoLogin(){	
	if(agreementChecker()){
		showLoginLoading()
		Kakao.Auth.authorize({
			redirectUri: 'https://www.realrankus.com/login/kcallback.html'
			//redirectUri: 'http://127.0.0.1:5500/login/kcallback.html'
		});
	}		
}

//카카오 로그인
function kakaoLogin_v1() {
    Kakao.Auth.login({
      success: function (response) {
        Kakao.API.request({
          url: '/v2/user/me',
          success: function (response) {
		  	//info_kakao_age = response.kakao_account.age_range
			//info_kakao_birthday = response.kakao_account.birthday
			//info_kakao_birthyear = ""
			info_kakao_email = response.kakao_account.email
			//info_kakao_gender = response.kakao_account.gender
			//info_kakao_id = response.id
			//info_kakao_mobile = ""
			info_kakao_nickname = response.kakao_account.profile.nickname
			info_kakao_name = response.kakao_account.name
			//info_kakao_provider = "KAKAO"
			//setKakaoLoginStatus(response)
		  	setKakaoLoginStatus(info_kakao_name, info_kakao_nickname, info_kakao_email);
			//location.reload()
			var redirect = setLogoutDest(pageName)
			//var redirect = "http://127.0.0.1:5500"
			window.location.replace(redirect);
          },
          fail: function (error) {
            console.log(error)
          },
        })
      },
      fail: function (error) {
        console.log(error)
      },
    })
  }

  function getkakaouserinfo(){
	Kakao.API.request({
		url: '/v2/user/me',
		success: function (res) {
			info_kakao_age = res.kakao_account.age_range
			info_kakao_birthday = res.kakao_account.birthday
			info_kakao_birthyear = ""
			info_kakao_email = res.kakao_account.email
			info_kakao_gender = res.kakao_account.gender
			info_kakao_id = res.id
			info_kakao_mobile = ""
			info_kakao_nickname = res.kakao_account.profile.nickname
			info_kakao_name = res.kakao_account.name
			info_kakao_provider = "KAKAO"

			setItemWithExpireTime('nLOG', info_kakao_id, expireTime, "KAKAO")
			setKakaoLoginStatus(info_kakao_name, info_kakao_nickname, info_kakao_email);
			writeUserData(info_kakao_id, info_kakao_name, info_kakao_email, info_kakao_age, info_kakao_birthday, info_kakao_birthyear, info_kakao_gender, info_kakao_mobile, info_kakao_nickname, info_kakao_provider)			  
			setOffcanvasProfile(info_kakao_id, info_kakao_name, info_kakao_email, info_kakao_age, info_kakao_birthday, info_kakao_birthyear, info_kakao_gender, info_kakao_mobile, info_kakao_nickname, info_kakao_provider)
		},
		fail: function (error) {
			kakaoLogin()
		},
	  })
  }

  /*
  function kakaoLogin() {
	if(pageName == "aptrank"){
		replace_dest = 'http://127.0.0.1:5500'
	}
	if(pageName == "aptrank_BIZ"){
		replace_dest = 'http://127.0.0.1:5500/biz'
	}
	if(pageName == "aptrank_PRICE"){
		replace_dest = 'http://127.0.0.1:5500/price'
	}
	if(pageName == "aptrank_OP"){
		replace_dest = 'http://127.0.0.1:5500/op'
	}
	if(pageName == "aptrank_THEME"){
		replace_dest = 'http://127.0.0.1:5500/theme'
	}
	if(pageName == "aptrank_NEWS"){
		replace_dest = 'http://127.0.0.1:5500/newsinfo'
	}
	if(pageName == "MoneyFlow"){
		replace_dest = 'http://127.0.0.1:5500/moneyflow'
	}	

    Kakao.Auth.authorize({		
      	redirectUri: replace_dest
    })
  }
  */

//카카오로그아웃  
function kakaoLogout() {
    if (Kakao.Auth.getAccessToken()) {
      Kakao.API.request({
        url: '/v1/user/unlink',
        success: function (response) {
        },
        fail: function (error) {
          console.log(error)
        },
      })
      Kakao.Auth.setAccessToken(null)
    }
  }

  function setKakaoLoginStatus(info_name, info_nickname, info_email){	
	$('#loginPopup').hide()

	var offcanvas_footer_html = `
	<div class="offcanvas_footer_icon"><i class="fa-solid fa-list-ol"></i></div>
	<div id="offcanvas_footer6" onClick="openOuterLink('https://www.realrankus.com/common/policy.html')">이용약관</div>          

	<div class="offcanvas_footer_icon"><i class="fa-solid fa-user-shield"></i></div>
	<div id="offcanvas_footer7" onClick="openOuterLink('https://www.realrankus.com/common/privacy.html')">개인정보처리방침</div>

	<div></div><div></div>
	<div class='offcanvas_footer_icon'><i class='fa-solid fa-right-from-bracket'></i></div>
	<div id='kakao_logout'>카카오 로그아웃</div>
	`
    $("#offcanvas_footer").html(offcanvas_footer_html)

	$("#kakao_logout").attr("href", "#");

	replace_dest = setLogoutDest(pageName)
	//replace_dest = "http://127.0.0.1:5500"

	$("#kakao_logout").click(function (e) {
		e.preventDefault();
		localStorage.removeItem('kToken')
		localStorage.removeItem('nLOG')
		localStorage.removeItem('profile')
		kakaoLogout();				
		//location.reload()
		var redirect = setLogoutDest(pageName)
		//var redirect = "http://127.0.0.1:5500"
		window.location.replace(redirect);
	});

	$('#offcanvasRightLabel').html(info_nickname + "님 반갑습니다!<br><span style='font-size:0.8em'>모든 서비스를 이용할 수 있어요</span>")
	$('#offcanvasRightLabel').css({'font-size':'1.0em'})
	$("#offcanvasRight > .offcanvas-header > #offcanvasRightLabel").attr({"data-bs-toggle":"offcanvas", "data-bs-target" : "#offcanvasProfile", "aria-controls" : "offcanvasRight"})
  }

  function setLogoutDest(pageName){
	var replace_dest = ""

	if(pageName == "aptrank"){
		replace_dest = 'https://www.realrankus.com'
		//replace_dest = 'http://127.0.0.1:5500'
		//replace_dest = 'http://localhost'
	}
	if(pageName == "aptrank_BIZ"){
		replace_dest = 'https://www.realrankus.com/biz'
		//replace_dest = 'http://127.0.0.1:5500/biz'
		//replace_dest = 'http://localhost/biz'
	}
	if(pageName == "aptrank_PRICE"){
		replace_dest = 'https://www.realrankus.com/price'
		//replace_dest = 'http://127.0.0.1:5500/price'
		//replace_dest = 'http://localhost/price'
	}
	if(pageName == "aptrank_OP"){
		replace_dest = 'https://www.realrankus.com/op'
		//replace_dest = 'http://127.0.0.1:5500/op'
		//replace_dest = 'http://localhost/op'
	}
	if(pageName == "aptrank_THEME"){
		replace_dest = 'https://www.realrankus.com/theme'
		//replace_dest = 'http://127.0.0.1:5500/theme'
		//replace_dest = 'http://localhost/theme'
	}
	if(pageName == "aptrank_NEWS"){
		replace_dest = 'https://www.realrankus.com/newsinfo'
		//replace_dest = 'http://127.0.0.1:5500/newsinfo'
		//replace_dest = 'http://localhost/newsinfo'
	}
	if(pageName == "MoneyFlow"){
		replace_dest = 'https://www.realrankus.com/moneyflow'
		//replace_dest = 'http://127.0.0.1:5500/moneyflow'
		//replace_dest = 'http://localhost/moneyflow'
	}
	if(pageName == "aptrank_PriceCal"){
		replace_dest = 'https://www.realrankus.com/priceCal'
		//replace_dest = 'http://127.0.0.1:5500/moneyflow'
		//replace_dest = 'http://localhost/moneyflow'
	}
	if(pageName == "cityclass"){
		replace_dest = 'https://www.realrankus.com/cityclass'
		//replace_dest = 'http://127.0.0.1:5500/moneyflow'
		//replace_dest = 'http://localhost/moneyflow'
	}	

	return replace_dest
  }

  function storeFireBase(info_id, info_name, info_email, info_age, info_birthday, info_birthyear, info_gender, info_mobile, info_nickname, info_provider){
	firebase.auth().signInAnonymously()
	.then(() => {
		// Signed in..
		//alert("Firebase logged in!")
	})
	.catch((error) => {
		var errorCode = error.code;
		var errorMessage = error.message;
		console.log(errorMessage)
		// ...
	});

	firebase.auth().onAuthStateChanged((user) => {
		if (user) {
			// User is signed in, see docs for a list of available properties
			// https://firebase.google.com/docs/reference/js/v8/firebase.User
			var uid = info_id;
			writeUserData(uid, info_name, info_email, info_age, info_birthday, info_birthyear, info_gender, info_mobile, info_nickname, info_provider)
			// ...
		} else {
			// User is signed out
			// ...			
		}
	});
  }
