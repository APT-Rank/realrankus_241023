// These samples are intended for Web so this import would normally be
// done in HTML however using modules here is more convenient for
// ensuring sample correctness offline.
//import firebase from "firebase/app";
//import "firebase/auth";

// Docs: https://source.corp.google.com/piper///depot/google3/third_party/devsite/firebase/en/docs/auth/web/apple.md

function appleProvider() {    
    // [START auth_apple_provider_create]
    if(agreementChecker()){
	    showLoginLoading()
      localStorage.setItem("AppleLogging", true);
	    var provider = new firebase.auth.OAuthProvider('apple.com');
	    // [END auth_apple_provider_create]
	
	    // [START auth_apple_provider_scopes]
	    provider.addScope('email');
	    provider.addScope('name');
	    // [END auth_apple_provider_scopes]
	
	    // [START auth_apple_provider_params]
	    /*
	    provider.setCustomParameters({
	      // Localize the Apple authentication screen in French.
	      locale: 'ko'
	    });
	    */
	    // [END auth_apple_provider_params]
	    appleSignInRedirect(provider)
	    //appleSignInPopup(provider)
    }
}

function appleSignInPopup(provider) {
  // [START auth_apple_signin_popup]
  firebase
    .auth()
    .signInWithPopup(provider)
    .then((result) => {
      /** @type {firebase.auth.OAuthCredential} */
      var credential = result.credential;

      // The signed-in user info.
      var user = result.user;

      // You can also get the Apple OAuth Access and ID Tokens.
      var accessToken = credential.accessToken;
      var idToken = credential.idToken;
      // IdP data available using getAdditionalUserInfo(result)
    // ...
    //appleSignInRedirectResult()
    setAppleLogin(user.email, idToken, user)
    })
    .catch((error) => {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      // ...
      console.log("appleSignInPopup : ", error)
    });
  // [END auth_apple_signin_popup]
}

function appleSignInRedirect(provider) {
  // [START auth_apple_signin_redirect]		
  firebase.auth().signInWithRedirect(provider);
  // [END auth_apple_signin_redirect]
}

function appleSignInRedirectResult() {
  // [START auth_apple_signin_redirect_result]
  // Result from Redirect auth flow.
  console.log("1111")
  firebase
    .auth()
    .getRedirectResult()
    .then((result) => {
      console.log("2222")
      console.log("appleSignInRedirectResult RESULT: ", result)
      if (result.credential) {
        /** @type {firebase.auth.OAuthCredential} */
        var credential = result.credential;

        // You can get the Apple OAuth Access and ID Tokens.
        var accessToken = credential.accessToken;
        var idToken = credential.idToken;

        // IdP data available in result.additionalUserInfo.profile.
        // ...
        console.log("3333")
      }
      // The signed-in user info.      
      var user = result.user;
      console.log("4444")
      if(user && login_status == false){
        console.log("6666")
        login_status = true
        if(user.displayName == undefined || user.displayName == null){
          info_apple_name = ""
        }
        else{
          info_apple_name = user.displayName
        }
        info_apple_email = user.email
        info_apple_mobile = user.phoneNumber
        info_apple_id = user.uid 
        info_apple_age = ""
        info_apple_birthday = ""
        info_apple_birthyear = ""
        info_apple_gender = ""
        info_apple_nickname = ""
        info_apple_provider = "APPLE"
        console.log("7777")
        setItemWithExpireTime('nLOG', info_apple_id, expireTime, "APPLE")
        console.log("8888")
        setAppleLoginStatus(info_apple_name, info_apple_nickname, info_apple_email);  
        writeUserData(info_apple_id, info_apple_name, info_apple_email, info_apple_age, info_apple_birthday, info_apple_birthyear, info_apple_gender, info_apple_mobile, info_apple_nickname, info_apple_provider)
        console.log("9999")
        setOffcanvasProfile(info_apple_id, info_apple_name, info_apple_email, info_apple_age, info_apple_birthday, info_apple_birthyear, info_apple_gender, info_apple_mobile, info_apple_nickname, info_apple_provider)
        console.log("appleSignInRedirectResult RESULT: ", result)
      }
      else{
        console.log("10101010")
        setLogoutStatus()
      }
    })
    .catch((error) => {      
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;      
      console.log("appleSignInRedirectResult ERROR: ", errorMessage)
      console.log("appleSignInRedirectResult ERROR: ", error.name)
      // ...
      if(errorMessage.indexOf("displayName") > -1){
        console.log("2222")
        login_status = false;
        setLogoutStatus()        
      }      
      else{console.log("3333")}
    });

    firebase.auth().onAuthStateChanged(function (user) {
      console.log("firebase.auth().onAuthStateChanged", user);
   });
  // [END auth_apple_signin_redirect_result]
}

function appleReauthenticatePopup() {
  // [START auth_apple_reauthenticate_popup]
  const provider = new firebase.auth.OAuthProvider('apple.com');

  firebase
    .auth()
    .currentUser
    .reauthenticateWithPopup(provider)
    .then((result) => {
      // User is re-authenticated with fresh tokens minted and can perform
      // sensitive operations like account deletion, or updating their email
      // address or password.
      /** @type {firebase.auth.OAuthCredential} */
      var credential = result.credential;
  
      // The signed-in user info.
      var user = result.user;
       // You can also get the Apple OAuth Access and ID Tokens.
      var accessToken = credential.accessToken;
      var idToken = credential.idToken;

      setAppleLoginStatus(user.email, idToken, user)
      // IdP data available in result.additionalUserInfo.profile.
      // ...
    })
    .catch((error) => {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      //$.removeCookie("aToken", null, { path: "/" });
      setLogoutStatus()  
      // ...
    });
  // [END auth_apple_reauthenticate_popup]
}

function appleReauthenticateWithRedirect() {
  // [START auth_apple_reauthenticate_popup]
  const provider = new firebase.auth.OAuthProvider('apple.com');

  firebase
    .auth()
    .currentUser
    .reauthenticateWithRedirect(provider)
    .then((result) => {
      // User is re-authenticated with fresh tokens minted and can perform
      // sensitive operations like account deletion, or updating their email
      // address or password.
      /** @type {firebase.auth.OAuthCredential} */
      var credential = result.credential;
  
      // The signed-in user info.
      var user = result.user;
       // You can also get the Apple OAuth Access and ID Tokens.
      var accessToken = credential.accessToken;
      var idToken = credential.idToken;

      console.log("RELOGIN : ", result)
      
      setAppleLoginStatus(user.email, idToken, user)
      // IdP data available in result.additionalUserInfo.profile.
        // ...
    })
    .catch((error) => {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      //$.removeCookie("aToken", null, { path: "/" });
      console.log("RELOGIN : ", error)
      setLogoutStatus()  
      // ...
    });
  // [END auth_apple_reauthenticate_popup]
}

function appleLinkFacebook() {
  // [START auth_apple_link_facebook]
  const provider = new firebase.auth.FacebookAuthProvider();
  provider.addScope('user_birthday');

  // Assuming the current user is an Apple user linking a Facebook provider.
  firebase.auth().currentUser.linkWithPopup(provider)
      .then((result) => {
        // Facebook credential is linked to the current Apple user.
        // Facebook additional data available in result.additionalUserInfo.profile,

        // Additional Facebook OAuth access token can also be retrieved.
        // result.credential.accessToken
  
        // The user can now sign in to the same account
        // with either Apple or Facebook.
      })
      .catch((error) => {
        // Handle error.
      });
  // [END auth_apple_link_facebook]
}

function appleNonceNode() {
  // [START auth_apple_nonce_node]
  const crypto = require("crypto");
  const string_decoder = require("string_decoder");

  // Generate a new random string for each sign-in
  const generateNonce = function(length) {
    const decoder = new string_decoder.StringDecoder("ascii");
    const buf = Buffer.alloc(length);
    var nonce = "";
    while (nonce.length < length) {
      crypto.randomFillSync(buf);
      nonce = decoder.write(buf);
    }
    return nonce.slice(0, length);
  };
  
  const unhashedNonce = generateNonce(10);

  // SHA256-hashed nonce in hex
  const hashedNonceHex = crypto.createHash('sha256')
    .update(unhashedNonce).digest().toString('hex');
  // [END auth_apple_nonce_node]
}

function appleSignInNonce(appleIdToken, unhashedNonce,) {
  // [START auth_apple_signin_nonce]
  // Build Firebase credential with the Apple ID token.
  const provider = new firebase.auth.OAuthProvider('apple.com');
  const authCredential = provider.credential({
    idToken: appleIdToken,
    rawNonce: unhashedNonce,
  });

  // Sign in with credential form the Apple user.
  firebase.auth().signInWithCredential(authCredential)
    .then((result) => {
      // User signed in.
    })
    .catch((error) => {
      // An error occurred. If error.code == 'auth/missing-or-invalid-nonce',
      // make sure you're sending the SHA256-hashed nonce as a hex string
      // with your request to Apple.
      console.log(error);
    });
  // [END auth_apple_signin_nonce]
}

function appleLogout(){
  firebase.auth().signOut().then(() => {
    // Sign-out successful.
    setLogoutStatus()    
    replace_dest = setLogoutDest(pageName)    
    location.replace(replace_dest);
    //location.reload()
  }).catch((error) => {
    // An error happened.    
  });
}

function setAppleLoginStatus(info_name, info_nickname, info_email){
  
	$('#offcanvasRightLabel').html(info_email + "<br><span style='font-size:0.8em'>모든 서비스를 이용할 수 있어요</span>")
	$('#offcanvasRightLabel').css({'font-size':'1.0em'})
  $("#offcanvasRight > .offcanvas-header > #offcanvasRightLabel").attr({"data-bs-toggle":"offcanvas", "data-bs-target" : "#offcanvasProfile", "aria-controls" : "offcanvasRight"})
	
	$('#loginPopup').hide()

  var offcanvas_footer_html = `
	<div class="offcanvas_footer_icon"><i class="fa-solid fa-list-ol"></i></div>
	<div id="offcanvas_footer6" onClick="openOuterLink('https://www.realrankus.com/common/policy.html')">이용약관</div>          

	<div class="offcanvas_footer_icon"><i class="fa-solid fa-user-shield"></i></div>
	<div id="offcanvas_footer7" onClick="openOuterLink('https://www.realrankus.com/common/privacy.html')">개인정보처리방침</div>

	<div></div><div></div>
	<div class='offcanvas_footer_icon'><i class='fa-solid fa-right-from-bracket'></i></div>
	<div id='apple_logout'>Apple 로그아웃</div>
	`
  $("#offcanvas_footer").html(offcanvas_footer_html)
	$("#apple_logout").attr("href", "#");	

	$("#apple_logout").click(function (e) {
    localStorage.removeItem('nLOG')
    localStorage.removeItem('profile')
	  e.preventDefault()	  	  
	  var offcanvas_login_msg = "<div id='loginPopup'>리얼랭커스의 모든 서비스를 이용하세요</div>"
	  offcanvas_login_msg += "<div id='aptrankLoginButton' data-bs-toggle='modal' data-bs-target='#loginModal' onClick='showLogin()'>리얼랭커스 로그인</div>"    
	  $('#offcanvasRightLabel').html(offcanvas_login_msg)
	  $('#loginPopup').css({"font-size":"0.8em", "margin-bottom":"10px"})
	  $('#aptrankLoginButton').css({"font-size" : "0.9em", "width":"auto", "border":"1px solid white"})
	  appleLogout();	  
	});
}
