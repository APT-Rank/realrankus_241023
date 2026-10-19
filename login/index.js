//애플로 로그인 성공 시.
document.addEventListener('AppleIDSignInOnSuccess', (data) => {
	//handle successful response
	console.log("AppleIDSignInOnSuccess")
	console.log(data)
	//todo success logic

	//handle successful response
	console.log(typeof data.detail.authorization);
	console.log(data.detail.authorization);
	console.log(typeof data.detail.authorization.id_token);
	var token = data.detail.authorization.id_token;
	//var base64Payload = token.split('.')[1];
	var result = JSON.parse(base64_url_decode(token.split(".")[1]));

	console.log(result)

	//result json 값으로 로그인 처리
});

//애플로 로그인 실패 시.
document.addEventListener('AppleIDSignInOnFailure', (error) => {
	//handle error.
	console.log("AppleIDSignInOnFailure")
	console.log(error)
	//todo fail logic
});

function b64DecodeUnicode(str) {
	return decodeURIComponent(
		atob(str).replace(/(.)/g, function (m, p) {
			var code = p.charCodeAt(0).toString(16).toUpperCase();
			if (code.length < 2) {
				code = "0" + code;
			}
			return "%" + code;
		})
	);
}


function base64_url_decode(str) {
	var output = str.replace(/-/g, "+").replace(/_/g, "/");
	switch (output.length % 4) {
	case 0:
		break;
	case 2:
		output += "==";
		break;
	case 3:
		output += "=";
		break;
	default:
		throw "Illegal base64url string!";
	}

	try {
		return b64DecodeUnicode(output);
	} catch (err) {
		return atob(output);
	}
}