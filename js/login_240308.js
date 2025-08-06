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
	user_email = email
	user_password = userID

	user_profile_obj = {
		user_name: name,
		user_nick_name : nickname,
		email: email,
		age: age,
		birthday : birthday,
		birthyear : birthyear,
		gender : gender,
		mobile : mobile,
		provider : provider,
		provider_uid : userID
	}
	user_status_obj = {
		accused: 0,
		blocked: 'false',
		block_days: 0,
		block_start: '1976-1-1',
		block_end: '1976-1-1',
		like: "",
		dislike: "",
		accusing: ""
	}

	firebase.auth().signInWithEmailAndPassword(user_email, user_password.toString())
	.then((userCredential) => {
		// Signed in
		var user = userCredential.user;
		fb_uid = user.uid
		// ...
		firebase.database().ref('users_moved/' + fb_uid).set({
			profile: user_profile_obj,
			status: user_status_obj
		})
		// 객체를 JSON 문자열로 변환
		const userObjString = JSON.stringify(user_profile_obj);
		window.localStorage.setItem("profile", userObjString);
		var redirect = setLogoutDest(pageName)
		//var redirect = "http://127.0.0.1:5500"
		window.location.replace(redirect);
	})
	.catch((error) => {
		var errorCode = error.code;
		var errorMessage = error.message;		
		firebase.auth().createUserWithEmailAndPassword(user_email, user_password.toString())
		.then((userCredential) => {
			// Signed in 
			var user = userCredential.user;
			fb_uid = user.uid

			firebase.database().ref('users_moved/' + fb_uid).set({
				profile: user_profile_obj,
				status: user_status_obj
			})
			const userObjString = JSON.stringify(user_profile_obj);
			window.localStorage.setItem("profile", userObjString);
			var redirect = setLogoutDest(pageName)
			//var redirect = "http://127.0.0.1:5500"
			window.location.replace(redirect);			
		})
		.catch((error) => {
			var errorCode = error.code;
			var errorMessage = error.message;
			alert("서버 통신이 원활하지 않습니다.")
		})
	});
}

function loadData(userID, provider){
	firebase.auth().onAuthStateChanged((user) => {
		if (user) {
			set_user_stat(user.uid)
			firebase.database().ref().child("users_moved").child(user.uid).child("profile").get().then((snapshot) => {
				if (snapshot.exists()) {
					profile = snapshot.val()
					if(profile.user_name == null || profile.user_name == undefined){
						userName = "정보 없음"
					}
					else{
						userName = profile.user_name
					}

					if(profile.user_nick_name == null || profile.user_nick_name == undefined){
						userNickName = "랭커스" + (Math.floor(Math.random() * 10000)).toString();
					}
					else{
						userNickName = profile.user_nick_name
					}

					if(profile.email == null || profile.email == undefined){
						userEmail = "정보 없음"
					}
					else{
						userEmail = user.email
					}

					if(profile.age == null || profile.age == undefined){
						userAge = "정보 없음"
					}
					else{
						userAge = user.age
					}

					if(profile.birthday == null || profile.birthday == undefined){
						userBirthday = "정보 없음"
					}
					else{
						userBirthday = profile.birthday
					}

					if(user.birthyear == null || profile.birthyear == undefined){
						userBirthyear = "정보 없음"
					}
					else{
						userBirthyear = profile.birthyear
					}

					if(profile.gender == null || profile.gender == undefined){
						userGender = "정보 없음"
					}
					else{
						userGender = profile.gender
					}

					if(profile.mobile == null || profile.mobile == undefined){
						userMobile = "정보 없음"
					}
					else{
						userMobile = profile.mobile
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
				}
				else{
				}
			})
			.catch((error) => {
				console.error(error);
			});			
		}
		else{
			setFirebaseID(userEmail, NID[0].toString(), userName, userAge, userBirthday, userBirthyear, userGender, userMobile, userNickName, provider)
		}
	})	
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

var NAVER_CLIENT_KEY = "QCL0Cjpsn2RIarmMDeKA"

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
    $(".modal-backdrop").css({"width":"100%"})
    $("#baseModal").css({"width":"100%"})

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

function setFirebaseID(userEmail, userID, userName, userAge, userBirthday, userBirthyear, userGender, userMobile, userNickName, provider){
	user_profile_obj = {
		user_name: userName,
		user_nick_name : userNickName,
		email: userEmail,
		age: userAge,
		birthday : userBirthday,
		birthyear : userBirthyear,
		gender : userGender,
		mobile : userMobile,
		provider : provider,
		provider_uid : userID
	}
	user_status_obj = {
		accused: 0,
		blocked: 'false',
		block_days: 0,
		block_start: '1976-1-1',
		block_end: '1976-1-1',
		like: "",
		dislike: "",
		accusing: ""
	}
	firebase.auth().createUserWithEmailAndPassword(userEmail, userID.toString())
    .then((userCredential) => {
      // Signed in 
      var user = userCredential.user;
      fb_uid = user.uid
	  temp_uid = user.uid
      //사용자 제한 정보 기본으로 설정
      firebase.database().ref().child("users_moved").child(fb_uid).child("status").get().then((snapshot) => {
        if (snapshot.exists()) {
          stat = snapshot.val()          
          user_stat = stat
        }
        else{
          firebase.database().ref('users_moved/' + fb_uid).set({
            profile: user_profile_obj,
            status: user_status_obj
          })
        }
      })
	  .then(() =>{
		set_user_stat(fb_uid)
	  })	
    })
    .catch((error) => {
      console.log(error.message)
      var errorCode = error.code;
      var errorMessage = error.message;

      firebase.auth().signInWithEmailAndPassword(userEmail, userID.toString())
      .then((userCredential) => {
        // Signed in
        var user = userCredential.user;
        fb_uid = user.uid
        //사용자 제한 정보 기본으로 설정
        firebase.database().ref().child("users_moved").child(fb_uid).child("status").get().then((snapshot) => {
          	if (snapshot.exists()) {
				stat = snapshot.val()
				user_stat = stat
			}
			else{
				firebase.database().ref('users_moved/' + fb_uid).set({
					profile: user_profile_obj,
					status: user_status_obj
				})
			}
        })
      })
	  .then(() =>{
		set_user_stat(fb_uid)
	  })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorMessage)	
      });
    })
}

function set_user_stat(fb_uid){
	firebase.database().ref().child("users_moved").child(fb_uid).get().then((snapshot) => {
		if (snapshot.exists()) {
			stat = snapshot.val()          
			user_stat = stat['status']
			user_obj = stat['profile']
			const userObjString = JSON.stringify(user_obj);
			window.localStorage.setItem("profile", userObjString);
		}
	})
	.then(() => {
		temp_uid = fb_uid
		temp_email = user_obj['email']
		temp_email_sep = (temp_email.split("@"))[0]
		shown_email = temp_email_sep.substr(0, 1) + "*****" + temp_email_sep.substr(-1, 1)		
		blocked = user_stat['blocked']
		block_start = user_stat['block_start']
		block_end = user_stat['block_end']		
	})
	.then(()=>{
		if(pageName == "aptrank"){
			setWriteBox()
			read_comment()
		}
	})
	.catch((error) => {
		console.log(error.message)
	})
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
			var provider = profile_obj.provider

			firebase.auth().onAuthStateChanged((user) => {
				if (user) {
					set_user_stat(user.uid)					
				}
				else{
					setFirebaseID(userEmail, NID[0].toString(), userName, userAge, userBirthday, userBirthyear, userGender, userMobile, userNickName, provider)
				}
			})

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
	user_email = info_email
	user_password = info_id

	user_profile_obj = {
		user_name: info_name,
		user_nick_name : info_nickname,
		email: info_email,
		age: info_age,
		birthday : info_birthday,
		birthyear : info_birthyear,
		gender : info_gender,
		mobile : info_mobile,
		provider : info_provider,
		provider_uid : info_id
	}
	user_status_obj = {
		accused: 0,
		blocked: 'false',
		block_days: 0,
		block_start: '1976-1-1',
		block_end: '1976-1-1',
		like: "",
		dislike: "",
		accusing: ""
	}

	firebase.auth().signInWithEmailAndPassword(user_email, user_password.toString())
	.then((userCredential) => {
		// Signed in
		var user = userCredential.user;
		fb_uid = user.uid
		// ...
		firebase.database().ref('users_moved/' + fb_uid).set({
			profile: user_profile_obj,
			status: user_status_obj
		})
	})
	.catch((error) => {
		var errorCode = error.code;
		var errorMessage = error.message;		
		firebase.auth().createUserWithEmailAndPassword(user_email, user_password.toString())
		.then((userCredential) => {
			// Signed in 
			var user = userCredential.user;
			fb_uid = user.uid

			firebase.database().ref('users_moved/' + fb_uid).set({
				profile: user_profile_obj,
				status: user_status_ojb
			})			
		})
		.catch((error) => {
			var errorCode = error.code;
			var errorMessage = error.message;
		})
	})
}
