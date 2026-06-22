/**
 * 리얼랭커스 로그인 제어 스크립트 (최종 수정일: 2026-05-22)
 * 
 * [주요 개선 사항]
 * 1. 로컬스토리지 캐시(nLOG, profile) 존재 시 즉시 UI를 로그인 상태로 업데이트하여 체감 속도 극대화.
 * 2. 백그라운드에서 Firebase 실제 로그인 세션을 비동기로 검증하며, 다중 리스너 중복 실행 방지 처리.
 * 3. 백그라운드 세션 연동 실패 시 오류 유형을 구별하여 네트워크 에러 등의 일시적 이슈일 경우 로그아웃되지 않도록 보완.
 * 4. 미사용 레거시 함수(setFirebaseID, storeFireBase) 삭제 대신 주석 처리 보존.
 * 5. 모든 변수와 함수에 상세한 주석 추가.
 */

// ==========================================
// [글로벌 변수 정의]
// ==========================================

/** @type {boolean} 전체 서비스 내 로그인 상태를 가리키는 플래그 변수 */
var login_status = false;

/** @type {string} Firebase 인증 성공 시 획득하는 실질적인 사용자 고유 ID */
var fb_uid = "";

/** @type {string} 임시로 사용자 ID를 저장하는 헬퍼 변수 */
var temp_uid = "";

/** @type {string} Firebase 로그인에 활용되는 이메일 주소 */
var user_email = "";

/** @type {string|number} Firebase 로그인에 패스워드로 사용되는 사용자 고유 ID (문자열 또는 숫자) */
var user_password = "";

/** @type {Object} Firebase Realtime Database에 기록할 사용자의 세부 프로필 정보 객체 */
var user_profile_obj = null;

/** @type {Object} Firebase Realtime Database에 기록할 사용자의 정지/신고 상태 관련 정보 객체 */
var user_status_obj = null;

/** @type {string} 사이드 바/오프캔버스 등에 이메일을 일부 가려서 출력하기 위한 마스킹된 이메일 문자열 */
var shown_email = "";

/** @type {string} 네이버 로그인 API 활용 시 필요한 클라이언트 키 */
var NAVER_CLIENT_KEY = "QCL0Cjpsn2RIarmMDeKA";

/** @type {number} 로컬스토리지 로그인 세션 만료 시간 (기본값: 180일, share.js에 기정의된 값을 우선 활용) */
var localExpireTime = typeof expireTime !== 'undefined' ? expireTime : 180 * 24 * 60 * 60 * 1000;

// ==========================================
// [네이버 로그인 SDK 인스턴스 초기화]
// ==========================================

/** @type {naver.LoginWithNaverId} 네이버 로그인 API 제어용 인스턴스 */
var naverLogin = new naver.LoginWithNaverId(
	{
		clientId: NAVER_CLIENT_KEY,
		// callbackUrl: "http://127.0.0.1:5500/login/callback.html", // 로컬 테스트용 콜백 URL
		callbackUrl: "https://www.realrankus.com/login/callback.html", // 실서버 콜백 URL
		isPopup: false, // 팝업창 방식 사용 안 함 (리다이렉트 방식 사용)
		loginButton: { color: "green", type: 3, height: 60 } // 로그인 버튼 스타일
	}
);

// 네이버 로그인 인스턴스를 초기에 가동하기 위한 초기화 함수 실행
naverLogin.init();


// ==========================================
// [기본 UI & 유틸리티 함수]
// ==========================================

/**
 * 로그인 로딩 상태를 보여주기 위해 공통 모달(loginModal) 내용을 스피너로 교체하고 노출하는 함수
 */
function showLoginLoading() {
	var titleHtml = "<div class='popupTitle'>로그인</div>";
	var detailHtml = `
		<div class="spinner-border text-dark" role="status" style='margin-top:10px'></div>
		<div style='font-weight: 600'><br>로그인 요청 중...</div>
	`;
	var footerHtml = "";

	$("#loginModalLabel").html(titleHtml);
	$("#loginDetail").html(detailHtml);
	$("#loginfooter").html(footerHtml);

	// 모달 헤더 영역 감춤 처리 및 흐림 효과 미지정 후 모달 오픈
	$("#loginModal > .modal-dialog > .modal-content > .modal-header").hide();
	openModal("loginModal");
}

/**
 * 로그인 토큰 유효성 여부를 판단해 결과를 불리언 형태로 리턴하는 헬퍼 함수
 * @param {string} token - 검증할 로그인 토큰 또는 키
 * @returns {boolean} 토큰 존재 여부
 */
function returnLoginStatus(token) {
	if (token == null || token == undefined || token == "") {
		return false;
	}
	else {
		return true;
	}
}

/**
 * 복수의 로그인 수단 중 어느 하나라도 활성화 상태인지 확인하는 다중 논리합 헬퍼 함수
 * @param {boolean} status1 - 상태값 1 (예: 네이버 로그인 유효 여부)
 * @param {boolean} status2 - 상태값 2 (예: 카카오 로그인 유효 여부)
 * @param {boolean} status3 - 상태값 3 (예: 애플 로그인 유효 여부)
 * @returns {boolean} 종합 로그인 유효 여부
 */
function getLoginStatus(status1, status2, status3) {
	if (status1 == true || status2 == true || status3 == true) {
		return true;
	}
	else {
		return false;
	}
}

/**
 * 로컬스토리지에 저장될 아이템에 만료 시점을 설정하여 저장하는 유틸리티 함수
 * @param {string} keyName - 로컬스토리지 키 명칭
 * @param {*} keyValue - 저장할 실질적인 데이터 값
 * @param {number} tts - 만료 기간을 계산하기 위한 밀리초 단위 시간
 * @param {string} provider - 소셜 로그인 제공업체 (NAVER, KAKAO, APPLE 등)
 */
function setItemWithExpireTime(keyName, keyValue, tts, provider) {
	// 로컬스토리지에 패키징하여 저장할 데이터 객체 구성
	const obj = {
		value: keyValue,
		expire: Date.now() + tts,
		provider: provider
	};
	// JSON 포맷의 문자열로 가공
	const objString = JSON.stringify(obj);
	// 로컬스토리지 반영
	window.localStorage.setItem(keyName, objString);
}

/**
 * 저장 시점에 기록했던 만료 기한을 현재 시간과 연동 검증하며 데이터를 읽는 함수
 * 기한을 넘겼을 경우 해당 스토리지를 소거하고 null을 반환합니다.
 * @param {string} keyName - 조회하려는 로컬스토리지 키 이름
 * @returns {Array|null} [데이터값, 로그인제공업체] 또는 null
 */
function getItemWithExpireTime(keyName) {
	// 스토리지에서 스트링 형식으로 로드
	const objString = window.localStorage.getItem(keyName);

	// 키가 없을 경우 null 즉시 반환
	if (!objString) {
		return null;
	}
	// 스트링 데이터를 JSON 파싱
	const obj = JSON.parse(objString);

	// 현재 시간과 로컬스토리지 내부의 expire 기록을 비교 검증
	if (Date.now() > obj.expire) {
		// 만료기한이 경과한 데이터는 로컬스토리지에서 파기
		window.localStorage.removeItem(keyName);
		return null;
	}
	// 유효 기한 범위 내에 있을 시 유의미한 데이터 목록 반환
	return [obj.value, obj.provider];
}


// ==========================================
// [Firebase 실시간 데이터베이스 연동 & 프로필 작성]
// ==========================================

/**
 * 최초 로그인 가입 시나 사용자 정보 보정 시 Firebase RTDB의 users_moved 노드 아래 프로필을 신규 세팅하는 함수
 * 이메일 정보를 계정 이메일(없으면 대체 메일)로 연동하고 패스워드는 사용자 고유 ID로 지정해 Firebase Auth 생성/로그인을 시도합니다.
 * @param {string} userID - 소셜 로그인 고유 식별자
 * @param {string} name - 사용자 이름
 * @param {string} email - 사용자 이메일 주소
 * @param {string} age - 사용자 연령 정보
 * @param {string} birthday - 사용자 생일 (MM-DD 또는 MMDD 등)
 * @param {string} birthyear - 사용자 출생년도
 * @param {string} gender - 사용자 성별 (M, F, male, female 등)
 * @param {string} mobile - 사용자 휴대폰번호
 * @param {string} nickname - 사용자 닉네임
 * @param {string} provider - 소셜 로그인 제공자
 */
function writeUserData(userID, name, email, age, birthday, birthyear, gender, mobile, nickname, provider) {
	user_email = email;
	user_password = userID;

	// DB 프로필 구조 세팅
	user_profile_obj = {
		user_name: name,
		user_nick_name: nickname,
		email: email,
		age: age,
		birthday: birthday,
		birthyear: birthyear,
		gender: gender,
		mobile: mobile,
		provider: provider,
		provider_uid: userID
	};
	// 기본 권한/차단/제한 등의 유저 상태 테이블 설정
	user_status_obj = {
		accused: 0,
		blocked: 'false',
		block_days: 0,
		block_start: '1976-1-1',
		block_end: '1976-1-1',
		like: "",
		dislike: "",
		accusing: ""
	};

	// 1단계: 기존 계정이 있는 경우 로그인 처리 시도
	firebase.auth().signInWithEmailAndPassword(user_email, user_password.toString())
		.then((userCredential) => {
			var user = userCredential.user;
			fb_uid = user.uid;

			// 데이터베이스 'users_moved' 노드에 세부 프로필 및 상태 객체 동기화
			firebase.database().ref('users_moved/' + fb_uid).set({
				profile: user_profile_obj,
				status: user_status_obj
			});

			// 신규 동기화된 정보를 로컬스토리지 profile 캐시에 다시 한번 업데이트
			const userObjString = JSON.stringify(user_profile_obj);
			window.localStorage.setItem("profile", userObjString);

			// 화면 리다이렉트 이동
			var redirect = setLogoutDest(pageName);
			window.location.replace(redirect);
		})
		.catch((error) => {
			// 로그인 실패 시 (대부분 계정 미존재 상태) 신규 회원가입 절차 진행
			var errorCode = error.code;
			var errorMessage = error.message;
			firebase.auth().createUserWithEmailAndPassword(user_email, user_password.toString())
				.then((userCredential) => {
					var user = userCredential.user;
					fb_uid = user.uid;

					// 신규 노드 생성 및 저장
					firebase.database().ref('users_moved/' + fb_uid).set({
						profile: user_profile_obj,
						status: user_status_obj
					});

					const userObjString = JSON.stringify(user_profile_obj);
					window.localStorage.setItem("profile", userObjString);

					// 화면 리다이렉트 이동
					var redirect = setLogoutDest(pageName);
					window.location.replace(redirect);
				})
				.catch((error) => {
					var errorCode = error.code;
					var errorMessage = error.message;
					alert("서버 통신이 원활하지 않습니다.");
				});
		});
}

/**
 * 로컬 캐시가 불완전하여 서버로부터 데이터를 신규 로드하고 세션을 동기화하는 함수
 * @param {string} userID - 소셜 로그인 연동 식별자
 * @param {string} provider - 소셜 로그인 제공자
 */
function loadData(userID, provider) {
	let unsubscribe;
	// Firebase 인증 상태 리스너 가동
	unsubscribe = firebase.auth().onAuthStateChanged((user) => {
		// 단발성 이벤트 처리를 위해 큐 지연을 주어 리스너 즉각 해제 (메모리 누수 방지 및 루프 예방)
		setTimeout(() => {
			if (unsubscribe) unsubscribe();
		}, 0);

		if (user) {
			// Firebase 내 사용자가 로그인 상태인 경우 DB 데이터 동기화
			set_user_stat(user.uid);
			firebase.database().ref().child("users_moved").child(user.uid).child("profile").get().then((snapshot) => {
				if (snapshot.exists()) {
					var profile = snapshot.val();
					var userName = profile.user_name || "정보 없음";
					var userNickName = profile.user_nick_name || "랭커스" + (Math.floor(Math.random() * 10000)).toString();
					var userEmail = user.email || profile.email || "정보 없음";
					var userAge = profile.age || "정보 없음";
					var userBirthday = profile.birthday || "정보 없음";
					var userBirthyear = profile.birthyear || "정보 없음";
					var userGender = profile.gender || "정보 없음";
					var userMobile = profile.mobile || "정보 없음";

					login_status = true;

					// 로컬스토리지 profile 갱신
					const user_obj = {
						user_name: userName,
						user_nick_name: userNickName,
						email: userEmail,
						age: userAge,
						birthday: userBirthday,
						birthyear: userBirthyear,
						gender: userGender,
						mobile: userMobile,
						provider: provider
					};
					const userObjString = JSON.stringify(user_obj);
					window.localStorage.setItem("profile", userObjString);

					// 제공업체별 UI 매칭
					if (provider == "NAVER") {
						setNaverLoginStatus(userName, userNickName, userEmail);
					}
					if (provider == "KAKAO") {
						setKakaoLoginStatus(userName, userNickName, userEmail);
					}
					if (provider == "APPLE") {
						setAppleLoginStatus(userName, userNickName, userEmail);
					}
					setOffcanvasProfile(userID, userName, userEmail, userAge, userBirthday, userBirthyear, userGender, userMobile, userNickName, provider);
				}
			})
				.catch((error) => {
					console.error("loadData Firebase DB 가져오기 에러: ", error);
				});
		}
		else {
			// Firebase 인증 정보는 없으나 로컬 정보가 남아있는 과도기 상태일 경우 자동 백그라운드 로그인 시도
			const fallbackEmail = `${userID}@realrankus.com`;
			console.log("loadData: Auth 세션 없음, 백그라운드 자동 로그인 기동");

			firebase.auth().signInWithEmailAndPassword(fallbackEmail, userID.toString())
				.then((userCredential) => {
					console.log("loadData 자동 로그인 연동 완료:", userCredential.user.uid);
					set_user_stat(userCredential.user.uid);

					// 로그인 성공에 맞춰 프로필 재요청 및 갱신
					firebase.database().ref().child("users_moved").child(userCredential.user.uid).child("profile").get().then((snapshot) => {
						if (snapshot.exists()) {
							var profile = snapshot.val();
							var userName = profile.user_name || "정보 없음";
							var userNickName = profile.user_nick_name || "랭커스" + (Math.floor(Math.random() * 10000)).toString();
							var userEmail = userCredential.user.email || profile.email || "정보 없음";
							var userAge = profile.age || "정보 없음";
							var userBirthday = profile.birthday || "정보 없음";
							var userBirthyear = profile.birthyear || "정보 없음";
							var userGender = profile.gender || "정보 없음";
							var userMobile = profile.mobile || "정보 없음";

							login_status = true;

							const user_obj = {
								user_name: userName,
								user_nick_name: userNickName,
								email: userEmail,
								age: userAge,
								birthday: userBirthday,
								birthyear: userBirthyear,
								gender: userGender,
								mobile: userMobile,
								provider: provider
							};
							window.localStorage.setItem("profile", JSON.stringify(user_obj));

							if (provider == "NAVER") setNaverLoginStatus(userName, userNickName, userEmail);
							if (provider == "KAKAO") setKakaoLoginStatus(userName, userNickName, userEmail);
							if (provider == "APPLE") setAppleLoginStatus(userName, userNickName, userEmail);

							setOffcanvasProfile(userID, userName, userEmail, userAge, userBirthday, userBirthyear, userGender, userMobile, userNickName, provider);
						}
					});
				})
				.catch((error) => {
					console.error("loadData 자동 로그인 연동 실패:", error.code, error.message);

					// 네트워크 순단성 에러 코드 검증 리스트
					const transientErrors = [
						"auth/network-request-failed",
						"auth/timeout",
						"auth/internal-error"
					];

					// 일시적인 에러가 아닌 인증 만료 및 거부 오류 시에만 캐시 파기
					if (!transientErrors.includes(error.code)) {
						setLogoutStatus(false);
					}
				});
		}
	});
}


// ==========================================
// [약관 및 팝업 제어 함수]
// ==========================================

/**
 * 로그인 팝업 창 내 동의 항목들의 체크박스가 전부 체크되었는지 판정하는 함수
 * @returns {boolean} 동의 완료 여부
 */
function agreementChecker() {
	var check_policy = $("#check_policy").is(":checked");
	var check_private = $("#check_privacy").is(":checked");
	var check_age = $("#check_age").is(":checked");

	if (check_policy && check_private && check_age) {
		return true;
	}
	else {
		alert(tSafe('ui.menu.agree_required', '계속 진행하려면 필수 약관에 동의해 주세요'));
		return false;
	}
}

/**
 * 로그인 약관 일괄 동의 처리 기능
 */
function allAgree() {
	$("input:checkbox[id='check_policy']").prop("checked", true);
	$("input:checkbox[id='check_privacy']").prop("checked", true);
	$("input:checkbox[id='check_age']").prop("checked", true);
}

/**
 * 약관 확인 박스 구성 및 소셜 로그인 연계 버튼이 탑재된 로그인 모달 화면을 구성하여 표출하는 함수
 */
function showLogin() {
	$(".modal-backdrop").css({ "width": "100%" });
	$("#baseModal").css({ "width": "100%" });

	var titleHtml = "<div class='popupTitle'>" + tSafe('ui.login_button', '리얼랭커스 로그인') + "</div>";
	var detailHtml = `
	<div id='policy_box'>
		<div style='margin-bottom: 10px; font-size: 0.85em; font-weight: 600; text-align:center'>` + tSafe('ui.menu.agree_required', '계속 진행하려면 필수 약관에 동의해 주세요') + `</div>
		<div id='policy_agreement'>
			<div><input type="checkbox" class='policy_checker' id='check_policy'><label for='check_policy'>` + tSafe('ui.menu.policy', '이용약관') + `</label></div><div onClick='openOuterLink("https://www.realrankus.com/common/policy.html")'>` + tSafe('ui.menu.view', '보기') + `</div>
			<div><input type="checkbox" class='policy_checker' id='check_privacy'><label for='check_privacy'>` + tSafe('ui.menu.privacy', '개인정보처리방침') + `</label></div><div onClick='openOuterLink("https://www.realrankus.com/common/privacy.html")'>` + tSafe('ui.menu.view', '보기') + `</div>
			<div><input type="checkbox" class='policy_checker' id='check_age'><label for='check_age'>` + tSafe('ui.menu.age_confirm', '만 14세 이상 확인') + `</label></div> <div></div>
			<div id='all_agree'><div id='all_agree_button' onClick='allAgree()'>` + tSafe('ui.menu.agree_all', '전체 동의 하기') + `</div></div>
		</div>
	</div>
	  <div id="kakaoIdLogin" onclick="kakaoLogin()"><div class='loginCI'><img src="https://www.realrankus.com/image/kakao_CI.png" height='20'></div><div class='loginText'>` + tSafe('ui.menu.kakao_continue', '카카오로 계속하기') + `</div></div>   	  
	  <div id="naverIdLogin" style="display: none;"></div>	  
   	  <div id="naverLogin"><div class='loginCI'><img src="https://www.realrankus.com/image/naver_CI.png" height='20'></div><div class='loginText' style='color:white'>` + tSafe('ui.menu.naver_continue', '네이버로 계속하기') + `</div></div>
	  <div id="appleIdLogin" onclick="appleProvider()"><div class='loginCI'><img src="https://www.realrankus.com/image/apple_CI.png" height='20'></div><div class='loginText' style='color:white'>` + tSafe('ui.menu.apple_continue', 'Apple로 계속하기') + `</div></div>
	`;
	var footerHtml = "";

	$("#loginModalLabel").html(titleHtml);
	$("#loginDetail").html(detailHtml);
	$("#loginfooter").html(footerHtml);

	// 헤더 및 투명도 세팅
	$("#loginModal > .modal-dialog > .modal-content > .modal-header").show();
	$("#loginModal > .modal-dialog > .modal-content").css({ 'opacity': '1.0' });

	// 네이버 로그인 정보 초기화 가동
	naverLogin.init();

	// 네이버 커스텀 로그인 버튼 클릭 시 동의항목 확인 후 물리적 네이버 로그인 수행
	$("#naverLogin").on("click", function () {
		if (agreementChecker()) {
			var btnNaverLogin = document.getElementById("naverIdLogin").firstChild;
			btnNaverLogin.click();
		}
	});
	openModal("loginModal");
}


// ==========================================
// [유저 권한 및 상태 연계 관리]
// ==========================================

/**
 * 로그인 성공 후 Firebase 상에서 유저 차단 목록 여부 및 프로필 정보를 조회하여 설정하는 동기화 함수
 * @param {string} fb_uid - Firebase 고유 사용자 UID
 */
function set_user_stat(fb_uid) {
	//console.log("set_user_stat 호출 UID: ", fb_uid);
	firebase.database().ref().child("users_moved").child(fb_uid).get().then((snapshot) => {
		if (snapshot.exists()) {
			var stat = snapshot.val();
			var user_stat = stat['status'];
			var user_obj = stat['profile'];

			// 로컬스토리지 캐시 최신화
			const userObjString = JSON.stringify(user_obj);
			window.localStorage.setItem("profile", userObjString);

			temp_uid = fb_uid;
			var temp_email = user_obj['email'] || "";
			var temp_email_sep = temp_email.includes("@") ? (temp_email.split("@"))[0] : temp_email;

			// 이메일 마스킹 처리
			shown_email = temp_email_sep.length > 2
				? temp_email_sep.substr(0, 1) + "*****" + temp_email_sep.substr(-1, 1)
				: "*****";

			var blocked = user_stat['blocked'];
			var block_start = user_stat['block_start'];
			var block_end = user_stat['block_end'];

			// 현재 활성 페이지가 메인 아파트 랭킹 페이지일 시 댓글 창 활성화 연동 처리
			if (pageName == "aptrank") {
				setWriteBox();
				read_comment();
			}
		} else {
			throw new Error("데이터베이스 노드에 해당 프로필 데이터가 누락되어 있습니다.");
		}
	})
		.catch((error) => {
			console.warn("set_user_stat 동기화 처리 실패: ", error.message);
		});
}


// ==========================================
// [핵심: 로그인 상태 제어 코어 (login_checker)]
// ==========================================

/**
 * 페이지 초기 진입 시 로드되어 전체 세션 유효성을 제어하는 중심 함수
 * 로컬 캐시를 읽어 즉시 로그인 UI를 구현하고, 백그라운드 비동기 처리를 가동해 정합성을 체크합니다.
 */
function login_checker() {
	// 로컬 세션 정보 조회
	const NID = getItemWithExpireTime('nLOG');
	const profile = window.localStorage.getItem("profile");

	if (NID) {
		// 1단계: 로컬 정보에 의해 로그인인 상황으로 즉각 매핑 (체감 속도 증대)
		login_status = true;

		if (profile) {
			// 로컬 프로필 정보를 우선 파싱하여 화면상에 인스턴트 배치 진행
			const profile_obj = JSON.parse(profile);
			const userName = profile_obj.user_name || "정보 없음";
			const userNickName = profile_obj.user_nick_name || "랭커스" + Math.floor(Math.random() * 10000);
			const userEmail = profile_obj.email || `${NID[0]}@realrankus.com`;
			const userAge = profile_obj.age || "정보 없음";
			const userBirthday = profile_obj.birthday || "정보 없음";
			const userBirthyear = profile_obj.birthyear || "정보 없음";
			const userGender = profile_obj.gender || "정보 없음";
			const userMobile = profile_obj.mobile || "정보 없음";
			const provider = profile_obj.provider;

			// 제공 플랫폼 별 UI 컴포넌트 세팅
			if (provider === "NAVER") setNaverLoginStatus(userName, userNickName, userEmail);
			if (provider === "KAKAO") setKakaoLoginStatus(userName, userNickName, userEmail);
			if (provider === "APPLE") setAppleLoginStatus(userName, userNickName, userEmail);

			// 오프캔버스 바 상세 데이터 주입
			setOffcanvasProfile(NID[0], userName, userEmail, userAge, userBirthday, userBirthyear, userGender, userMobile, userNickName, provider);

			// 2단계: 백그라운드 검증 리스너 1회성 가동
			let unsubscribe;
			unsubscribe = firebase.auth().onAuthStateChanged((user) => {
				// 동시 가동 방지용 지연 unsubscribe
				setTimeout(() => {
					if (unsubscribe) unsubscribe();
				}, 0);

				if (user) {
					//console.log("Firebase 세션 복구/체크 완료 유저: ", user.uid);
					set_user_stat(user.uid);
				} else {
					// Firebase Auth 측에 연동 세션이 끊겨있을 경우 백그라운드 무중단 조용한 재로그인 기동
					console.log("백그라운드 세션 자동 복구 동작 시작...");
					firebase.auth().signInWithEmailAndPassword(userEmail, NID[0].toString())
						.then((userCredential) => {
							login_status = true;
							console.log("백그라운드 자동 인증 동기화 완료: ", userCredential.user.uid);
							set_user_stat(userCredential.user.uid);
						})
						.catch((error) => {
							console.error("백그라운드 자동 인증 동기화 실패: ", error.code, error.message);

							// 네트워크 지연/차단 등의 오류 코드 목록
							const transientErrors = [
								"auth/network-request-failed",
								"auth/timeout",
								"auth/internal-error"
							];

							// 네트워크 오류가 아닐 경우에만 정보 파괴 및 로그아웃 유도
							if (!transientErrors.includes(error.code)) {
								setLogoutStatus(false);
							} else {
								console.warn("네트워크 단절 상태이므로 로컬 캐시 상태를 유지합니다.");
							}
						});
				}
			});
		} else {
			// 캐시는 존재하지만 세부 프로필 객체가 비었을 경우 DB 정보 취합 시도
			loadData(NID[0], NID[1]);
		}
	} else {
		// 2단계: 로컬 세션 정보가 아예 없는 경우 완전히 비로그인 처리하고 소셜 리다이렉트 콜백을 체크
		login_status = false;

		// 네이버 인증 상태 결과 1순위 판단
		naverLogin.getLoginStatus(function (status) {
			if (status) {
				// 네이버 리다이렉트 인증 성공 확인 시
				const info_id = naverLogin.user.getId();
				const info_email = naverLogin.user.getEmail() || `${info_id}@realrankus.com`;
				const info_name = naverLogin.user.getName() || "정보 없음";
				const info_nickname = naverLogin.user.getNickName() || "랭커스" + Math.floor(Math.random() * 10000);

				login_status = true;
				setItemWithExpireTime('nLOG', info_id, localExpireTime, "NAVER");
				setNaverLoginStatus(info_name, info_nickname, info_email);
				writeUserData(info_id, info_name, info_email, naverLogin.user.getAge(), naverLogin.user.getBirthday(), naverLogin.user.getBirthyear(), naverLogin.user.getGender(), naverLogin.user.getMobile(), info_nickname, "NAVER");
				setOffcanvasProfile(info_id, info_name, info_email, naverLogin.user.getAge(), naverLogin.user.getBirthday(), naverLogin.user.getBirthyear(), naverLogin.user.getGender(), naverLogin.user.getMobile(), info_nickname, "NAVER");
			} else {
				// 2순위: 카카오 로그인 토큰 유무 확인
				const kToken = localStorage.getItem('kToken');
				if (kToken) {
					Kakao.Auth.setAccessToken(kToken);
					Kakao.Auth.getStatusInfo(function (status) {
						if (status.status === "connected") {
							// 카카오 세션 유효 확인 시 프로필 획득 진행
							login_status = true;
							getkakaouserinfo();
						} else {
							// 3순위: 소셜 토큰 정보가 없는 상태이므로 리다이렉트 모션 검토
							handleAppleLoginState();
						}
					});
				} else {
					handleAppleLoginState();
				}
			}
		});
	}
}

/**
 * 애플 로그인의 리다이렉트 성공 여부를 연동 체크하여 화면 세션을 유도하는 헬퍼 함수
 */
function handleAppleLoginState() {
	const AppleLogging = localStorage.getItem("AppleLogging");
	if (AppleLogging) {
		showLoginLoading();
		localStorage.removeItem('AppleLogging');
		appleSignInRedirectResult();
	} else {
		// 외부 로그인 성향이 일절 감지되지 않으므로 로그아웃 초기화 유지 및 애플 리다이렉트 결과 비동기 점검
		setLogoutStatus();
		appleSignInRedirectResult();
	}
}


// ==========================================
// [세션 정리 & 로그아웃 함수]
// ==========================================

/**
 * 로그아웃 시 로컬 캐시를 전부 삭제하고 Firebase Auth 연결을 해제한 후, 분기에 따라 강제 페이지 리다이렉트까지 수행하는 함수
 * @param {boolean} needRedirect - 로그아웃 후 대상 페이지로 강제 리다이렉트 이동 여부 (기본값: false)
 */
function setLogoutStatus(needRedirect = false) {
	var offcanvas_login_msg = "<div id='loginPopup'>" + tSafe('ui.menu.login_popup', "리얼랭커스의 모든 서비스를 이용하세요") + "</div>";
	offcanvas_login_msg += "<div id='aptrankLoginButton2' data-bs-toggle='modal' data-bs-target='#loginModal' onClick='showLogin()'>" + tSafe('ui.menu.login_btn', "리얼랭커스 로그인") + "</div>";

	// GNB 레이아웃 원상 복구 및 스타일 설정
	$('#offcanvasRightLabel').html(offcanvas_login_msg);
	$('#loginPopup').css({ "font-size": "0.8em", "margin-bottom": "10px" });

	// 소셜 및 로컬스토리지 로그인 세션 정보 일제 클리어
	localStorage.removeItem('kToken');
	localStorage.removeItem('nLOG');
	localStorage.removeItem('profile');

	login_status = true;

	// Firebase Auth 로그아웃 실행
	firebase.auth().signOut().then(() => {
		// 정상 수신 완료 시 리다이렉트 유도 분기 검토
		if (needRedirect) {
			var redirect = setLogoutDest(pageName);
			window.location.replace(redirect);
		}
	}).catch((error) => {
		console.error("Firebase Auth Sign-out 오류 발생:", error);
		if (needRedirect) {
			var redirect = setLogoutDest(pageName);
			window.location.replace(redirect);
		}
	});
}


// ==========================================
// [네이버 로그인 연동 처리 함수]
// ==========================================

/**
 * 네이버 사용자가 최종 로그인되었을 때 호출되어 GNB 영역 및 로그아웃 바인딩을 처리하는 함수
 * @param {string} info_name - 네이버 사용자 성함
 * @param {string} info_nickname - 네이버 사용자 닉네임
 * @param {string} info_email - 네이버 사용자 이메일
 */
function setNaverLoginStatus(info_name, info_nickname, info_email) {
	$('#loginPopup').hide();

	// 사이드바 하단 정보 갱신 및 네이버 로그아웃 바인딩 구현
	var offcanvas_footer_html = `
	<div class="offcanvas_footer_icon"><i class="fa-solid fa-list-ol"></i></div>
	<div id="offcanvas_footer6" onClick="openOuterLink('https://www.realrankus.com/common/policy.html')">` + tSafe('ui.menu.policy') + `</div>          

	<div class="offcanvas_footer_icon"><i class="fa-solid fa-user-shield"></i></div>
	<div id="offcanvas_footer7" onClick="openOuterLink('https://www.realrankus.com/common/privacy.html')">` + tSafe('ui.menu.privacy') + `</div>

	<div></div><div></div>
	<div class='offcanvas_footer_icon'><i class='fa-solid fa-right-from-bracket'></i></div>
	<div id='gnbLogin'>` + tSafe('ui.menu.naver_logout') + `</div>
	`;
	$("#offcanvas_footer").html(offcanvas_footer_html);

	$("#gnbLogin").attr("href", "#");

	// 네이버 로그아웃 진행 시 관련 세션 전체 제거 후 연동해제
	$("#gnbLogin").click(function (e) {
		e.preventDefault();
		localStorage.removeItem('nLOG');
		localStorage.removeItem('profile');
		naverLogin.logout();
		var redirect = setLogoutDest(pageName);
		window.location.replace(redirect);
	});

	// 환영 문구 및 오프캔버스 트리거 속성 변경
	$('#offcanvasRightLabel').html(tSafe('ui.menu.welcome_msg').replace('{nickname}', info_nickname));
	$('#offcanvasRightLabel').css({ 'font-size': '1.0em' });
	$("#offcanvasRight > .offcanvas-header > #offcanvasRightLabel").attr({ "data-bs-toggle": "offcanvas", "data-bs-target": "#offcanvasProfile", "aria-controls": "offcanvasRight" });
}

/**
 * 네이버 로그인 인스턴스 초기화 헬퍼 함수
 */
function startNaverLogin() {
	if (agreementChecker()) {
		showLoginLoading();
		naverLogin.init();
	}
}


// ==========================================
// [카카오 로그인 연동 처리 함수]
// ==========================================

/**
 * 카카오 버튼 탭 시 카카오 전용 인가 리다이렉트 URL로 연결해 주는 함수
 */
function kakaoLogin() {
	if (agreementChecker()) {
		showLoginLoading();
		Kakao.Auth.authorize({
			redirectUri: 'https://www.realrankus.com/login/kcallback.html'
			// redirectUri: 'http://127.0.0.1:5500/login/kcallback.html' // 로컬 테스트용 리다이렉트 주소
		});
	}
}

/**
 * 카카오 1세대 구버전 로그인 연동 함수 (현재 미사용 백업 보존)
 */
function kakaoLogin_v1() {
	Kakao.Auth.login({
		success: function (response) {
			Kakao.API.request({
				url: '/v2/user/me',
				success: function (response) {
					info_kakao_email = response.kakao_account.email;
					info_kakao_nickname = response.kakao_account.profile.nickname;
					info_kakao_name = response.kakao_account.name;
					setKakaoLoginStatus(info_kakao_name, info_kakao_nickname, info_kakao_email);
					var redirect = setLogoutDest(pageName);
					window.location.replace(redirect);
				},
				fail: function (error) {
					console.log(error);
				},
			});
		},
		fail: function (error) {
			console.log(error);
		},
	});
}

/**
 * 카카오 로그인 세션 유효 시 호출되어 카카오 사용자 인적사항을 획득하고 DB/로컬 캐시에 동기화하는 함수
 */
function getkakaouserinfo() {
	Kakao.API.request({
		url: '/v2/user/me',
		success: function (res) {
			const info_kakao_id = res.id;
			// 이메일 권한 거부 등을 방지하여 카카오 고유번호 기반 메일 강제 빌드 처리
			const info_kakao_email = res.kakao_account.email || `${info_kakao_id}@realrankus.com`;
			const info_kakao_age = res.kakao_account.age_range || "정보 없음";
			const info_kakao_birthday = res.kakao_account.birthday || "정보 없음";
			const info_kakao_birthyear = "정보 없음";
			const info_kakao_gender = res.kakao_account.gender || "정보 없음";
			const info_kakao_mobile = "정보 없음";
			const info_kakao_nickname = (res.kakao_account.profile && res.kakao_account.profile.nickname) ? res.kakao_account.profile.nickname : "랭커스" + Math.floor(Math.random() * 10000);
			const info_kakao_name = res.kakao_account.name || "정보 없음";
			const info_kakao_provider = "KAKAO";

			// 로컬스토리지 갱신
			setItemWithExpireTime('nLOG', info_kakao_id, localExpireTime, "KAKAO");
			setKakaoLoginStatus(info_kakao_name, info_kakao_nickname, info_kakao_email);

			// DB에 인적사항 및 기본상태 설정
			writeUserData(info_kakao_id, info_kakao_name, info_kakao_email, info_kakao_age, info_kakao_birthday, info_kakao_birthyear, info_kakao_gender, info_kakao_mobile, info_kakao_nickname, info_kakao_provider);
			setOffcanvasProfile(info_kakao_id, info_kakao_name, info_kakao_email, info_kakao_age, info_kakao_birthday, info_kakao_birthyear, info_kakao_gender, info_kakao_mobile, info_kakao_nickname, info_kakao_provider);
		},
		fail: function (error) {
			kakaoLogin();
		},
	});
}

/**
 * 카카오 AccessToken이 활성화 상태일 때 카카오 연결을 명시적으로 언링크(연동해제)하는 로그아웃 함수
 */
function kakaoLogout() {
	if (Kakao.Auth.getAccessToken()) {
		Kakao.API.request({
			url: '/v1/user/unlink',
			success: function (response) {
				// 연동 해제 성공 시 로그
				console.log("카카오 연동 해제 완료");
			},
			fail: function (error) {
				console.log(error);
			},
		});
		Kakao.Auth.setAccessToken(null);
	}
}

/**
 * 카카오 사용자가 최종 로그인되었을 때 호출되어 GNB 영역 및 로그아웃 바인딩을 처리하는 함수
 * @param {string} info_name - 카카오 사용자 이름
 * @param {string} info_nickname - 카카오 사용자 닉네임
 * @param {string} info_email - 카카오 사용자 이메일
 */
function setKakaoLoginStatus(info_name, info_nickname, info_email) {
	$('#loginPopup').hide();

	var offcanvas_footer_html = `
	<div class="offcanvas_footer_icon"><i class="fa-solid fa-list-ol"></i></div>
	<div id="offcanvas_footer6" onClick="openOuterLink('https://www.realrankus.com/common/policy.html')">` + tSafe('ui.menu.policy') + `</div>          

	<div class="offcanvas_footer_icon"><i class="fa-solid fa-user-shield"></i></div>
	<div id="offcanvas_footer7" onClick="openOuterLink('https://www.realrankus.com/common/privacy.html')">` + tSafe('ui.menu.privacy') + `</div>

	<div></div><div></div>
	<div class='offcanvas_footer_icon'><i class='fa-solid fa-right-from-bracket'></i></div>
	<div id='kakao_logout'>` + tSafe('ui.menu.kakao_logout') + `</div>
	`;
	$("#offcanvas_footer").html(offcanvas_footer_html);

	$("#kakao_logout").attr("href", "#");

	$("#kakao_logout").click(function (e) {
		e.preventDefault();
		localStorage.removeItem('kToken');
		localStorage.removeItem('nLOG');
		localStorage.removeItem('profile');
		kakaoLogout();
		var redirect = setLogoutDest(pageName);
		window.location.replace(redirect);
	});

	$('#offcanvasRightLabel').html(tSafe('ui.menu.welcome_msg').replace('{nickname}', info_nickname));
	$('#offcanvasRightLabel').css({ 'font-size': '1.0em' });
	$("#offcanvasRight > .offcanvas-header > #offcanvasRightLabel").attr({ "data-bs-toggle": "offcanvas", "data-bs-target": "#offcanvasProfile", "aria-controls": "offcanvasRight" });
}


// ==========================================
// [리다이렉트 주소 매핑 정보]
// ==========================================

/**
 * 로그인/로그아웃 완료 후 현재 실행되고 있는 페이지 컨텍스트에 따라 되돌려줄 리다이렉션 URL 경로를 설정하는 함수
 * @param {string} pageName - 각 페이지단에서 정의된 전역 페이지 명칭
 * @returns {string} 리다이렉트할 최종 주소
 */
function setLogoutDest(pageName) {
	var replace_dest = "";

	if (pageName == "aptrank") {
		replace_dest = 'https://www.realrankus.com';
		// replace_dest = 'http://127.0.0.1:5500'; // 로컬 테스트용
		// replace_dest = 'http://localhost';
	}
	if (pageName == "aptrank_BIZ") {
		replace_dest = 'https://www.realrankus.com/biz';
		// replace_dest = 'http://127.0.0.1:5500/biz'; // 로컬 테스트용
	}
	if (pageName == "aptrank_PRICE") {
		replace_dest = 'https://www.realrankus.com/price';
	}
	if (pageName == "aptrank_OP") {
		replace_dest = 'https://www.realrankus.com/op';
	}
	if (pageName == "aptrank_THEME") {
		replace_dest = 'https://www.realrankus.com/theme';
	}
	if (pageName == "aptrank_NEWS") {
		replace_dest = 'https://www.realrankus.com/newsinfo';
	}
	if (pageName == "MoneyFlow") {
		replace_dest = 'https://www.realrankus.com/moneyflow';
	}
	if (pageName == "aptrank_PriceCal") {
		replace_dest = 'https://www.realrankus.com/priceCal';
	}
	if (pageName == "cityclass") {
		replace_dest = 'https://www.realrankus.com/cityclass';
	}

	return replace_dest;
}


// ==========================================
// [피드백 반영: 레거시/미사용 코드 주석 처리 보존]
// ==========================================

/*
// [기존 코드 주석 처리] - 새로운 login_260522.js에서는 호출되지 않으나 백업 보존
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
*/

/*
// [기존 코드 주석 처리] - 새로운 login_260522.js에서는 호출되지 않으나 백업 보존
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
				status: user_status_obj
			})			
		})
		.catch((error) => {
			var errorCode = error.code;
			var errorMessage = error.message;
		})
	})
}
*/
