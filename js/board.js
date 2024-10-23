const tlgm_token = "7006157322:AAFF0FeURUed_OgSxpIbZGGTYjiB9ZifZsI"
const tlgm_sendto = "1572186775"
const firebaseConfig = {
	apiKey: "AIzaSyA7s95oaj498XdArjo9cT_8watLVw4JK3M",
	authDomain: "aptrank-cc61b.firebaseapp.com",
	databaseURL: "https://aptrank-cc61b-default-rtdb.firebaseio.com",
	projectId: "aptrank-cc61b",
	storageBucket: "aptrank-cc61b.appspot.com",
	messagingSenderId: "987401326011",
	appId: "1:987401326011:web:8732d04a9fc69280d7489e",
	measurementId: "G-BH5DRBH380"
  };

firebase.initializeApp(firebaseConfig);
const comment_db = firebase.firestore()
var docRef = ""

function sendTelegram_single_message(comment){
	var tlgm_url = "https://api.telegram.org/bot" + tlgm_token + "/sendMessage?"
	var tlgm_msg = comment

	var w_date_set = new Date()
	var w_date_str = w_date_set.getFullYear() + "-" + dateReturn((w_date_set.getMonth()+1)) + "-" + dateReturn(w_date_set.getDate()) + ", "
			+ dateReturn(w_date_set.getHours()) + ":" + dateReturn(w_date_set.getMinutes()) + ":" + dateReturn(w_date_set.getSeconds())

	tlgm_msg += "%0A"	
	tlgm_msg += "ㆍ " + w_date_str

	var request_tlgm_url = tlgm_url + "chat_id=" + tlgm_sendto + "&parse_mode=HTML" + "&text=" + tlgm_msg

	fetch(request_tlgm_url, {
	  method: 'POST',
	  headers: { 'Content-Type': 'application/json' }
	})
	.then(res => res.json())
	.catch(error => {
	  console.log(error)
	})
}

function sendTelegram_message(comment){
	var current_region = shortRegionName( $("#sido option:selected").text() + " " + $("#gungu option:selected").text() );
	var current_region_id = selectedSubRegion

	var tlgm_url = "https://api.telegram.org/bot" + tlgm_token + "/sendMessage?"
	var tlgm_msg = "[" + current_region + "]" + "%0A"
	tlgm_msg += "(" + current_region_id + ")" + "%0A%0A"

	var comment_arr = Object.entries(comment)
	if(comment_arr.length < 2){
	  var w_email = comment_arr[0][1]['email']
	  var w_comment = comment_arr[0][1]['comment']
	  var w_date = comment_arr[0][1]['written']
	}
	else{
	  var w_email = comment['email']
	  var w_comment = comment['comment']
	  var w_date = comment['written']
	}
	var w_date_set = new Date(w_date)
	var w_date_str = w_date_set.getFullYear() + "-" + dateReturn((w_date_set.getMonth()+1)) + "-" + dateReturn(w_date_set.getDate()) + ", "
			+ dateReturn(w_date_set.getHours()) + ":" + dateReturn(w_date_set.getMinutes()) + ":" + dateReturn(w_date_set.getSeconds())

	w_comment = w_comment.replaceAll("\n", "%0A")
	w_comment = w_comment.replaceAll("<br>", "%0A")      

	tlgm_msg += "ㆍ " + w_email + "%0A"
	tlgm_msg += "ㆍ " + w_comment + "%0A"
	tlgm_msg += "ㆍ " + w_date_str

	var request_tlgm_url = tlgm_url + "chat_id=" + tlgm_sendto + "&parse_mode=HTML" + "&text=" + tlgm_msg

	fetch(request_tlgm_url, {
	  method: 'POST',
	  headers: { 'Content-Type': 'application/json' }
	})
	.then(res => res.json())
	.catch(error => {
	  console.log(error)
	})
}

function complex_list_like_status(){
	var current_region_id = selectedSubRegion
	//var current_region_id = "test_region"
	firebase.database().ref().child("realrankus_complex_like_total").child(current_region_id).get().then((snapshot) => {
		if(snapshot.exists()){
			complex_list = Object.entries(snapshot.val())
			//console.log("COMPLEX_LIST : " + complex_list)
			complex_list.forEach((complexes) => {
				//console.log("COMPLEX NAME : " + complexes[0])
				//console.log("COMPLEX STATUS : " + complexes[1])
				complex_code = complexes[0].split("_")[1]
				complex_like_num = complexes[1]['Living'] + complexes[1]['Trans'] + complexes[1]['Infra'] + complexes[1]['Edu']
				$("#complex_like_num_" + complex_code).html(complex_like_num)
				if(complex_like_num > 0){
					$("#complex_" + complex_code).css({'color' : '#e31939'})
					$("#complex_" + complex_code).parent('div').parent('div').addClass('liked')
					//console.log($("#complex_" + complex_code).parent('div').parent('div').prop('outerHTML'))
				}
				else{
					$("#complex_" + complex_code).css({'color' : '#999'})
					$("#complex_" + complex_code).parent('div').parent('div').removeClass('liked')
				}
					
			})
		}
		else{
			console.log("NO DATA")
		}
	})

	/*
	var complex_like_db = comment_db.collection("realrankus_complex_like").doc(current_region_id)
	complex_like_db.get().then((querySnapshot) => {
		if(querySnapshot.exists){
			complex_list = Object.entries(querySnapshot.data())
			complex_list.forEach((complexes) => {		
				complex_code = complexes[0].split("_")[1]
				complex_like_num = complexes[1]['Living'] + complexes[1]['Trans'] + complexes[1]['Infra'] + complexes[1]['Edu']
				$("#complex_like_num_" + complex_code).html(complex_like_num)
				if(complex_like_num > 0){
					$("#complex_" + complex_code).css({'color' : '#e31939'})
				}
			})
		}
		else{
			console.log("NO DATA")
		}
	})
	*/	
}

non_blog_html = ""
non_blog_html += "<div class='blog_list' onClick='showBlogGuide()'>"
non_blog_html += "<div class='blog_img_box'><img src=\"./apt-rank-512x512.png\" width='100px'/></div>"
non_blog_html += "<div class='blog_des'>"
non_blog_html += "<div class='blog_title'>리얼포스팅을 등록해 주세요</div>"
non_blog_html += "<div class='blog_sub'>실제 찾아가 눈으로 보고 분석한 소중한 경험을 알려주세요</div>"
non_blog_html += "<div class='blog_sub2'>by 리얼랭커스</div>"
non_blog_html += "</div>"

function complex_blog(complex_id, aptName){
	var current_region_id = selectedSubRegion
	firebase.database().ref().child("realrankus_blog").child(current_region_id).child("complex_" + complex_id).child("blog_list").get()
	.then((snapshot) => {
		if(snapshot.exists()){						
			blog_list = snapshot.val()			
			blog_list_keys = Object.keys(blog_list)

			if(blog_list['blog1'] == "" || blog_list['blog1'] == null || blog_list == null){
				$("#blog_list_area").html(non_blog_html)
				return
			}

			blog_html = ""

			for(var i = 0 ; i < blog_list_keys.length ; i++ ){
				blog_title = blog_list[blog_list_keys[i]]['title']
				blog_des = blog_list[blog_list_keys[i]]['description']
				blog_imgLink = blog_list[blog_list_keys[i]]['imgLink']
				blog_url = blog_list[blog_list_keys[i]]['url']
				blog_auth = blog_list[blog_list_keys[i]]['auth']

				if(i == 0){
					blog_html += "<div class='blog_list' onClick='openOuterLink(\"" + blog_url + "\")'>"
				}			
				blog_html += "<div class='blog_img_box'><img src=\"./image/blog/" + blog_imgLink + "\" width='100px'/></div>"
				blog_html += "<div class='blog_des'>"
					blog_html += "<div class='blog_title'>" + blog_title + "</div>"
					blog_html += "<div class='blog_sub'>" + blog_des + "</div>"
					blog_html += "<div class='blog_sub2'>by " + blog_auth + "</div>"
				blog_html += "</div>"
			}
			blog_html += "</div>"

			$("#blog_list_area").html(blog_html)
		}
		else{
			$("#blog_list_area").html(non_blog_html)		
			firebase.database().ref('realrankus_blog/' + current_region_id + '/complex_' + complex_id).set({						
				'name' : aptName,				
				'blog_list' : "",
			})
			.then(() => {
				firebase.database().ref('realrankus_blog/' + current_region_id + '/complex_' + complex_id + "/blog_list").set({						
					'blog1' : "",									
				})							
			})
		}
	})
}

function complex_like_updown(category, complex_id, aptName){	
	var current_region_id = selectedSubRegion
	//var current_region_id = "test_region"

	if(!login_status){
		showLogin()
		$("#loginModalLabel>.popupTitle").html("로그인 후에 좋아요를 해 주세요!")
		$("#baseModal").modal('hide')
		$('#loginModal').modal('show')
		return
	}
	if(temp_uid == "abcdefghijklmnopqrstuvwxyz"){
		toastr.options = {
			closeButton: false,
			progressBar: false,
			showMethod: 'fadeIn',
			closeMethod: 'fadeOut',
			positionClass: "toast-bottom-center",
			timeOut: 1000
		};
		toastr.success("인증 오류가 발생했어요. 재로그인 부탁드립니다!");
		return
	}
	if(detail_loading){
		toastr.options = {
			closeButton: false,
			progressBar: false,
			showMethod: 'fadeIn',
			closeMethod: 'fadeOut',
			positionClass: "toast-bottom-center",
			timeOut: 1000
		};
		toastr.success("잠시후 다시 시도해 주세요");
		return
	}

	var updates = {};
	var complex_like_db = comment_db.collection("realrankus_complex_like").doc(current_region_id).collection(complex_id).doc(temp_uid)
	complex_like_db.get().then((like_list) => {
		if(like_list.exists){
			var living_like = Number( (like_list.data())['Living'] )
			var trans_like = Number( (like_list.data())['Trans'] )
			var infra_like = Number( (like_list.data())['Infra'] )
			var edu_like = Number( (like_list.data())['Edu'] )

			//console.log("UID : " + temp_uid)
			//console.log("LIKE LIVING: " + (like_list.data())['Living'])
			//console.log("LIKE TRANS: " + (like_list.data())['Trans'])
			//console.log("LIKE INFRA: " + (like_list.data())['Infra'])
			//console.log("LIKE EDU: " + (like_list.data())['Edu'])			

			if(category == 'living'){
				if(living_like === 1){
					living_like = 0					
					complex_like_db.update("Living", firebase.firestore.FieldValue.increment(-1))
					.then(()=>{
						updates['realrankus_complex_like_total/' + current_region_id + '/complex_' + complex_id + "/Living"] = firebase.database.ServerValue.increment(-1);
						firebase.database().ref().update(updates)
						.then(() =>{ background_update(current_region_id, complex_id) })

						current_num = $("#complex_like_num_living_" + complex_id).html()
						fixed_num = Number(current_num)-1
						$("#complex_like_num_living_" + complex_id).html(fixed_num)
						$("#complex_like_living_" + complex_id + " > .complex_like_thumb").html("<i class='fa-regular fa-thumbs-up'></i>")
						if(fixed_num <= 0){
							$("#complex_like_living_" + complex_id).css({'color' : '#999'})							
						}
						else{							
							$("#complex_like_living_" + complex_id).css({'color' : '#e31939'})							
						}
					})					
				}
				else{
					living_like = 1
					complex_like_db.update("Living", firebase.firestore.FieldValue.increment(1))
					.then( ()=>{
						updates['realrankus_complex_like_total/' + current_region_id + '/complex_' + complex_id + "/Living"] = firebase.database.ServerValue.increment(1);
						firebase.database().ref().update(updates)
						.then(() =>{ background_update(current_region_id, complex_id) })

						current_num = $("#complex_like_num_living_" + complex_id).html()
						fixed_num = Number(current_num)+1
						$("#complex_like_num_living_" + complex_id).html(fixed_num)
						$("#complex_like_living_" + complex_id + " > .complex_like_thumb").html("<i class='fa-solid fa-thumbs-up'></i>")
						if(fixed_num <= 0){
							$("#complex_like_living_" + complex_id).css({'color' : '#999'})
						}
						else{
							$("#complex_like_living_" + complex_id).css({'color' : '#e31939'})
						}
					})
				}				
			}
			if(category == 'trans'){
				if(trans_like === 1){
					trans_like = 0
					complex_like_db.update("Trans", firebase.firestore.FieldValue.increment(-1))
					.then(() => {
						updates['realrankus_complex_like_total/' + current_region_id + '/complex_' + complex_id + "/Trans"] = firebase.database.ServerValue.increment(-1);
						firebase.database().ref().update(updates)
						.then(() =>{ background_update(current_region_id, complex_id) })

						current_num = $("#complex_like_num_trans_" + complex_id).html()
						fixed_num = Number(current_num)-1
						$("#complex_like_num_trans_" + complex_id).html(fixed_num)
						$("#complex_like_trans_" + complex_id + " > .complex_like_thumb").html("<i class='fa-regular fa-thumbs-up'></i>")
						if(fixed_num <= 0){
							$("#complex_like_trans_" + complex_id).css({'color' : '#999'})
						}
						else{
							$("#complex_like_trans_" + complex_id).css({'color' : '#e31939'})
						}
					})					
				}
				else{
					trans_like = 1
					complex_like_db.update("Trans", firebase.firestore.FieldValue.increment(1))
					.then(() => {
						updates['realrankus_complex_like_total/' + current_region_id + '/complex_' + complex_id + "/Trans"] = firebase.database.ServerValue.increment(1);
						firebase.database().ref().update(updates)
						.then(() =>{ background_update(current_region_id, complex_id) })

						current_num = $("#complex_like_num_trans_" + complex_id).html()
						fixed_num = Number(current_num)+1
						$("#complex_like_num_trans_" + complex_id).html(fixed_num)
						$("#complex_like_trans_" + complex_id + " > .complex_like_thumb").html("<i class='fa-solid fa-thumbs-up'></i>")
						if(fixed_num <= 0){
							$("#complex_like_trans_" + complex_id).css({'color' : '#999'})
						}
						else{
							$("#complex_like_trans_" + complex_id).css({'color' : '#e31939'})
						}
					})
				}
			}
			if(category == 'infra'){
				if(infra_like === 1){
					infra_like = 0
					complex_like_db.update("Infra", firebase.firestore.FieldValue.increment(-1))
					.then(() => {
						updates['realrankus_complex_like_total/' + current_region_id + '/complex_' + complex_id + "/Infra"] = firebase.database.ServerValue.increment(-1);
						firebase.database().ref().update(updates)
						.then(() =>{ background_update(current_region_id, complex_id) })

						current_num = $("#complex_like_num_infra_" + complex_id).html()
						fixed_num = Number(current_num)-1
						$("#complex_like_num_infra_" + complex_id).html(fixed_num)
						$("#complex_like_infra_" + complex_id + " > .complex_like_thumb").html("<i class='fa-regular fa-thumbs-up'></i>")
						if(fixed_num <= 0){
							$("#complex_like_infra_" + complex_id).css({'color' : '#999'})
						}
						else{
							$("#complex_like_infra_" + complex_id).css({'color' : '#e31939'})
						}
					})					
				}
				else{
					infra_like = 1
					complex_like_db.update("Infra", firebase.firestore.FieldValue.increment(1))
					.then(() => {
						updates['realrankus_complex_like_total/' + current_region_id + '/complex_' + complex_id + "/Infra"] = firebase.database.ServerValue.increment(1);
						firebase.database().ref().update(updates)
						.then(() =>{ background_update(current_region_id, complex_id) })

						current_num = $("#complex_like_num_infra_" + complex_id).html()
						fixed_num = Number(current_num)+1
						$("#complex_like_num_infra_" + complex_id).html(fixed_num)
						$("#complex_like_infra_" + complex_id + " > .complex_like_thumb").html("<i class='fa-solid fa-thumbs-up'></i>")
						if(fixed_num <= 0){
							$("#complex_like_infra_" + complex_id).css({'color' : '#999'})
						}
						else{
							$("#complex_like_infra_" + complex_id).css({'color' : '#e31939'})
						}
					})
				}
			}
			if(category == 'edu'){
				if(edu_like === 1){
					edu_like = 0
					complex_like_db.update("Edu", firebase.firestore.FieldValue.increment(-1))
					.then(() => {
						updates['realrankus_complex_like_total/' + current_region_id + '/complex_' + complex_id + "/Edu"] = firebase.database.ServerValue.increment(-1);
  						firebase.database().ref().update(updates)
						.then(() =>{ background_update(current_region_id, complex_id) })

						current_num = $("#complex_like_num_edu_" + complex_id).html()
						fixed_num = Number(current_num)-1
						$("#complex_like_num_edu_" + complex_id).html(fixed_num)
						$("#complex_like_edu_" + complex_id + " > .complex_like_thumb").html("<i class='fa-regular fa-thumbs-up'></i>")
						if(fixed_num <= 0){
							$("#complex_like_edu_" + complex_id).css({'color' : '#999'})
						}
						else{
							$("#complex_like_edu_" + complex_id).css({'color' : '#e31939'})
						}
					})					
				}
				else{
					edu_like = 1
					complex_like_db.update("Edu", firebase.firestore.FieldValue.increment(1))
					.then(() => {
						updates['realrankus_complex_like_total/' + current_region_id + '/complex_' + complex_id + "/Edu"] = firebase.database.ServerValue.increment(1);
  						firebase.database().ref().update(updates)						
						.then(() =>{ background_update(current_region_id, complex_id) })

						current_num = $("#complex_like_num_edu_" + complex_id).html()
						fixed_num = Number(current_num)+1
						$("#complex_like_num_edu_" + complex_id).html(fixed_num)
						$("#complex_like_edu_" + complex_id + " > .complex_like_thumb").html("<i class='fa-solid fa-thumbs-up'></i>")
						if(fixed_num <= 0){
							$("#complex_like_edu_" + complex_id).css({'color' : '#999'})
						}
						else{
							$("#complex_like_edu_" + complex_id).css({'color' : '#e31939'})
						}
					})
				}
			}
		}
		else{
			complex_like_db.set({
				'Complex' : aptName,
				'Living' : 0,
				'Trans' : 0,
				'Infra' : 0,
				'Edu' : 0,
			})
			.then(() => {
				complex_like_updown(category, complex_id, aptName)
			})
			.catch((error) => {
				console.error("Error adding like: ", error);
			});
		}
	})
	.catch((error) => {
		console.log(error.message)
	})
}

function background_update(current_region_id, complex_id){
	firebase.database().ref().child("realrankus_complex_like_total").child(current_region_id).child("complex_" + complex_id).get()
	.then((snapshot) => {
		if(snapshot.exists()){						
			complex_list = snapshot.val()
			complex_like_num = complex_list['Living'] + complex_list['Trans'] + complex_list['Infra'] + complex_list['Edu']
			$("#complex_like_num_" + complex_id).html(complex_like_num)

			if(complex_like_num > 0){
				$("#complex_" + complex_id).css({'color' : '#e31939'})
			}
			else{
				$("#complex_" + complex_id).css({'color' : '#999'})
			}
		}
		else{
			console.log("NO DATA")
		}
	})
}

function setComplexLike(complexCode, aptName){
	var current_region_id = selectedSubRegion
	//var current_region_id = "test_region"

	var complex_like_db = comment_db.collection("realrankus_complex_like").doc(current_region_id).collection(complexCode).doc(temp_uid)

	//complex_like_db.get().then((querySnapshot) => {
	firebase.database().ref().child("realrankus_complex_like_total").child(current_region_id).child("complex_" + complexCode).get().then((snapshot) => {
		if(snapshot.exists()){
			like_status = snapshot.val()
			//console.log("LIKE_STATUS : " + like_status)
			var living_count = like_status['Living']
			var trans_count = like_status['Trans']
			var infra_count = like_status['Infra']
			var edu_count = like_status['Edu']
			if(living_count > 0){
				$("#complex_like_living_" + complexCode).css({'color' : '#e31939'})
			}
			if(trans_count > 0){
				$("#complex_like_trans_" + complexCode).css({'color' : '#e31939'})
			}
			if(infra_count > 0){
				$("#complex_like_infra_" + complexCode).css({'color' : '#e31939'})
			}
			if(edu_count > 0){
				$("#complex_like_edu_" + complexCode).css({'color' : '#e31939'})
			}

			if(living_count == '' || living_count == undefined){
				$("#complex_like_num_living_" + complexCode).html("0")
			}
			else{
				$("#complex_like_num_living_" + complexCode).html(living_count)
			}

			if(trans_count == '' || trans_count == undefined){
				$("#complex_like_num_trans_" + complexCode).html("0")
			}
			else{
				$("#complex_like_num_trans_" + complexCode).html(trans_count)
			}

			if(infra_count == '' || infra_count == undefined){
				$("#complex_like_num_infra_" + complexCode).html("0")
			}
			else{
				$("#complex_like_num_infra_" + complexCode).html(infra_count)
			}

			if(edu_count == '' || edu_count == undefined){
				$("#complex_like_num_edu_" + complexCode).html("0")
			}
			else{
				$("#complex_like_num_edu_" + complexCode).html(edu_count)
			}

			comment_db.collection("realrankus_complex_like").doc(current_region_id).collection(complexCode).doc(temp_uid).get()
			.then((like_list) => {
				if(like_list.exists){
					var living_like = Number( (like_list.data())['Living'] )
					var trans_like = Number( (like_list.data())['Trans'] )
					var infra_like = Number( (like_list.data())['Infra'] )
					var edu_like = Number( (like_list.data())['Edu'] )					

					if(living_like == 1){
						$("#complex_like_living_" + complexCode + " > .complex_like_thumb").html("<i class='fa-solid fa-thumbs-up'></i>")
					}
					if(trans_like == 1){
						$("#complex_like_trans_" + complexCode + " > .complex_like_thumb").html("<i class='fa-solid fa-thumbs-up'></i>")
					}
					if(infra_like == 1){
						$("#complex_like_infra_" + complexCode + " > .complex_like_thumb").html("<i class='fa-solid fa-thumbs-up'></i>")
					}
					if(edu_like == 1){
						$("#complex_like_edu_" + complexCode + " > .complex_like_thumb").html("<i class='fa-solid fa-thumbs-up'></i>")
					}
				}
				detail_loading = false
			})
			.catch((error) => {
				console.log(error.message)
			})
		}
		else{
			firebase.database().ref('realrankus_complex_like_total/' + current_region_id + '/complex_' + complexCode).set({						
				'Complex' : aptName,
				'Complex_id' : complexCode,
				'Living' : 0,
				'Trans' : 0,
				'Infra' : 0,
				'Edu' : 0,
				'blog' : ""
			})
			.then(() => {
				complex_like_db.set({
					'Complex' : aptName,
					'Living' : 0,
					'Trans' : 0,
					'Infra' : 0,
					'Edu' : 0
				})
				.then(() => {
					detail_loading = false
					setComplexLike(complexCode, aptName)
				})				
				.catch((error) => {
					detail_loading = false
					setComplexLike(complexCode, aptName)
				})
			})
		}
	})
	.catch((error) => {
		console.log(error.message)
		
		firebase.database().ref('realrankus_complex_like_total/' + current_region_id + '/complex_' + complexCode).set({						
			'Complex' : aptName,
			'Complex_id' : complexCode,
			'Living' : 0,
			'Trans' : 0,
			'Infra' : 0,
			'Edu' : 0,						
		})
		.then(() => {
			complex_like_db.set({
				'Complex' : aptName,
				'Living' : 0,
				'Trans' : 0,
				'Infra' : 0,
				'Edu' : 0
			})
			.then(() => {
				detail_loading = false
				setComplexLike(complexCode, aptName)
			})				
			.catch((error) => {
				detail_loading = false
				setComplexLike(complexCode, aptName)
			})
		})
		.catch((error) => {
			detail_loading = false
			setComplexLike(complexCode, aptName)			
		})
	})
}

function setWriteBox(){
	var writebox_html = ""
	if(login_status){
		if(blocked == 'true'){
			writebox_html += "<div id='writeWrapper_none' onclick=''>"
			writebox_html += "<div id='writing_id'></div>"
			writebox_html += "<div id='comment_input_wrap_none'>신고에 의해 댓글 사용이 제한되었습니다</div>"
			writebox_html += "</div>"      
		}
		else{
			writebox_html += "<div id='writeWrapper' onclick='write_comment_modal()'>"
			writebox_html += "<div id='writing_id'></div>"
			writebox_html += "<div id='comment_input_wrap_none'>우리 동네 이야기를 남겨보세요</div>"
			writebox_html += "</div>"
		}
	}
	else{
		writebox_html += "<div id='writeWrapper' data-bs-toggle='modal' data-bs-target='#loginModal' onclick='showLogin()'>"
		writebox_html += "<div id='writing_id'></div>"
		writebox_html += "<div id='comment_input_wrap_none'>로그인 후 댓글을 작성할 수 있어요</div>"
		writebox_html += "</div>"
	}

	$("#writeBox").html(writebox_html)	
	$("#writing_id").html("<div>_<i class='fa-solid fa-pen'></i>&nbsp;&nbsp;" + shown_email + "</div>")	
}

function read_comment(scroll_pos){
	var comment_html = ""	
	docRef.get().then((comment_list) => {
		if (comment_list.exists) {
			doc_list = Object.entries(comment_list.data())
			comment_num = doc_list.length
			localSearchText = shortRegionName( $("#sido option:selected").text() + " " + $("#gungu option:selected").text() );
			$('#recent_comment_num').html("<div><i class='fa-solid fa-comment'></i> " + comment_num + "개의 " + localSearchText + " 이야기</div><div style='text-align: center'><i id='comment_direction' class='fa-solid fa-chevron-up'></i></div>")			
			if(doc_list.length == 0){
				if(login_status){
					comment_html += "<div>"
						comment_html += "<div id='no_comment' style='text-align:center'>첫 번째 " + localSearchText + " 이야기의 주인공이 되어주세요!"
						comment_html += "<br><button id='btn_no_comment' onClick='write_comment_modal()'>첫 번째 글 작성하기</button></div>"
					comment_html += "</div>"
				}
				else{
					comment_html += "<div>"
						comment_html += "<div id='no_comment' style='text-align:center'>첫 번째 " + localSearchText + " 이야기의 주인공이 되어주세요!"
						comment_html += "<br><button id='btn_no_comment' data-bs-toggle='modal' data-bs-target='#loginModal' onclick='showLogin()'>로그인 하고 댓글 쓰기</button></div>"
					comment_html += "</div>"
				}
			}
			else{
				doc_list.sort()
				var index = 0
				doc_list.forEach((doc) => {
				showhide = doc[1]['show']
				
				if(showhide != 'normal'){
					var restriction_text = ""
					if(showhide == 'deleted'){
					return
					}
					else if(showhide == 'accused'){
					restriction_text = "신고에 의해 가리기 처리된 글입니다."
					}
					else if(showhide == 'restricted_word'){
					restriction_text = "부적절한 표현으로 가리기 처리된 글입니다."
					}
					comment_html += "<div class='comment_wapper'>"
					comment_html += "<div class='comment_line2'>"
						comment_html += "<div class='comment_content' style='text-align: center; color: #aaa'>" + restriction_text + "</div>"
					comment_html += "</div>"
					comment_html += "</div>"
					return
				}                
				
				comment_id = doc[0]
				user_email_original = doc[1]['email']
				user_email_original_sep = (user_email_original.split("@"))[0]
				user_email = user_email_original_sep.substr(0, 1) + "***" + user_email_original_sep.substr(-1, 1)
				reply_list = doc[1]['reply']
				user_id = doc[1]['uid']                
				
				written_timestamp = doc[1]['written'].toDate()
				written_date = written_timestamp.getFullYear() + "년 " + (written_timestamp.getMonth()+1) + "월 " + written_timestamp.getDate() + "일"
				written_time = written_timestamp.getHours() + ":" + (dateReturn(written_timestamp.getMinutes()))

				comment_content_original = doc[1]['comment']
				comment_content = comment_content_original.replaceAll("\n", "<br>")

				for(var p = 0 ; p < restrict_words.length; p++){
					comment_content = comment_content.replaceAll(restrict_words[p], "***")
				}

				comment_html += "<div class='comment_wapper'>"
					comment_html += "<div class='comment_line1'>"
					comment_html += "<div><i class='fa-solid fa-user-pen'></i>&nbsp;&nbsp;" + user_email + "</div>"
					comment_html += "<div style='text-align:right'>" + written_date + ", " + written_time + "</div>"
					comment_html += "<div style='text-align:right; color:#aaa' onClick='accuse_modal(\"" + comment_id + "\", \"" + user_email + "\", " + index + ", \"" + user_id + "\")'>[신고하기]</div>"
					comment_html += "</div>"

					comment_html += "<div class='comment_line2'>"
					comment_html += "<div class='comment_content' id='comment_content_" + index + "'>" + comment_content + "</div>"
					comment_html += "</div>"

					comment_html += "<div class='comment_line3'>"
                    comment_html += "<div class='comment_options' id=\'like_" + comment_id + "\' onClick='likeit(\"" + comment_id + "\", \"" + user_id + "\", " + doc[1]['likeit'] + ")'>"
                      comment_html += "<div><i class='fa-solid fa-heart'></i></div>"
                      comment_html += "<div id=\'like_num_" + comment_id + "\'>" + doc[1]['likeit'] + "</div>"
                    comment_html += "</div>"
					if(temp_email == doc[1]['email']){
						comment_html += "<div class='comment_addon_button'>"
						comment_html += "<div></div>"
						if(blocked == 'true'){
							comment_html += "<div><button class='btn_del' style='color:#aaa; background:#ccc'>수정</button></div>"
						}
						else{
							comment_html += "<div><button class='btn_del' onClick='modify_comment_modal(\"" + comment_id + "\", \""+ comment_content + "\")'>수정</button></div>"
						}
						comment_html += "<div><button class='btn_del' onClick='delete_comment_question(\"" + comment_id + "\")'>삭제</button></div>"
						comment_html += "</div>"
					}
					comment_html += "</div>"

					comment_html += "<div class='comment_reply'>"
					if(reply_list != undefined){
						reply_array = Object.entries(reply_list)
						reply_array.sort()
						for(var k = 0 ; k < reply_array.length ; k++){
						reply_detail = Object.entries(reply_list)                  
						replied_id = reply_array[k][0]
						replied_showhide = reply_array[k][1]['show']                        

						replied_content_original = reply_array[k][1]['comment']
						replied_user_id = reply_array[k][1]['uid']
						replied_comment = replied_content_original.replaceAll("\n", "<br>")
						for(var p = 0 ; p < restrict_words.length; p++){
							replied_comment = replied_comment.replaceAll(restrict_words[p], "***")
						}

						replied_email = reply_array[k][1]['email']
						replied_timestamp = reply_array[k][1]['written'].toDate()
						replied_date = replied_timestamp.getFullYear() + "년 " + (replied_timestamp.getMonth()+1) + "월 " + replied_timestamp.getDate() + "일"
						replied_time = replied_timestamp.getHours() + ":" + (dateReturn(replied_timestamp.getMinutes()))
						replied_likeit = reply_array[k][1]['likeit']

						if(replied_showhide != 'normal'){
							var restriction_text = ""
							if(replied_showhide == 'deleted'){                            
							}
							else{
							if(replied_showhide == 'accused'){
								restriction_text = "신고에 의해 가리기 처리된 글입니다."
							}
							else if(replied_showhide == 'restricted_word'){
								restriction_text = "부적절한 표현으로 가리기 처리된 글입니다."
							}
							comment_html += "<div class='comment_reply_list'>"
								comment_html += "<div class='blank_div'></div>"
								comment_html += "<div>"
								comment_html += "<div class='comment_line1' style='padding-right: 5px; padding-bottom: 0px; border-top: 1px solid #ddd'></div>"
								comment_html += "<div class='comment_line2' style='padding-right: 0px; margin-right:0px; padding-top: 5px; padding-bottom: 5px'>"
									comment_html += "<div class='comment_content' style='text-align: center; color: #aaa'>" + restriction_text + "</div>"
								comment_html += "</div>"
								comment_html += "</div>"
							comment_html += "</div>"
							}
						}
						else{
							comment_html += "<div class='comment_reply_list'>"
							comment_html += "<div class='blank_div'></div>"
							comment_html += "<div>"

								comment_html += "<div class='comment_line1' style='padding-right: 5px; padding-bottom: 0px; border-top: 1px solid #ddd'>"
								comment_html += "<div>by " + user_email + "</div>"
								comment_html += "<div style='text-align:right'>" + replied_date + ", " + replied_time + "</div>"
								comment_html += "<div style='text-align:right; color:#aaa' onClick='accuse_reply_modal(\"" + comment_id + "\", \"" + replied_id + "\", \"" + user_email + "\", \"" + replied_user_id + "\")'>[신고하기]</div>"
								comment_html += "</div>"

								comment_html += "<div class='comment_line2' style='padding-right: 0px; margin-right:0px; padding-top: 5px; padding-bottom: 5px'>"
								comment_html += "<div class='comment_content' id=\'" + comment_id + "__" + replied_id + "\'>" + replied_comment + "</div>"
								comment_html += "</div>"

								comment_html += "<div class='comment_line3' style='padding-right: 5px; padding-top: 0px'>"
                                comment_html += "<div class='comment_options' id=\'like_" + replied_id + "\' onClick='reply_likeit(\"" + comment_id + "\" , \"" + replied_id + "\" , \"" + user_id + "\", " + replied_likeit + ")'>"
                                  comment_html += "<div><i class='fa-solid fa-heart'></i></div>"
                                  comment_html += "<div id=\'like_num_" + replied_id + "\'>" + replied_likeit + "</div>"
                                comment_html += "</div>"
								if(temp_email == doc[1]['email']){
									comment_html += "<div class='comment_addon_button'>"
									comment_html += "<div></div>"
									if(blocked == 'true'){
										comment_html += "<div><button class='btn_del' style='color:#aaa; background:#ccc'>수정</button></div>"
									}
									else{
										comment_html += "<div><button class='btn_del' onClick='modify_reply_modal(\"" + comment_id + "\", \"" + replied_id + "\")'>수정</button></div>"
									}
									comment_html += "<div><button class='btn_del' onClick='delete_reply_question(\"" + comment_id + "\", \"" + replied_id + "\")'>삭제</button></div>"
									comment_html += "</div>"
								}
								comment_html += "</div>"

							comment_html += "</div>"                          
							comment_html += "</div>"
						}
						}
					}
					reply_guide_text = ""
					if(login_status){
						if(blocked == 'true'){
							comment_html += "<div class='comment_reply_box_none'>"							
						}
						else{
							comment_html += "<div class='comment_reply_box' onClick='reply_modal(\"" + comment_id + "\")'>"
						}
					}
					else{
						comment_html += "<div class='comment_reply_box' data-bs-toggle='modal' data-bs-target='#loginModal' onclick='showLogin()'>"						
					}
					
						comment_html += "<div class='blank_div'></div>"
						comment_html += "<div class='reply_user'>_<i class='fa-solid fa-pen'></i>&nbsp;&nbsp;" + shown_email + "</div>"
						comment_html += "<div class='reply_icon'><i class='fa-solid fa-turn-up'></i></div>"
						comment_html += "<div class='comment_input_reply'>댓글 남기기</div>"
					comment_html += "</div>"
					comment_html += "</div>"

				comment_html += "</div>"

				index += 1
				})
			}
		}
		else {
			console.log("No comment")
		}

		$('#comment_list').html(comment_html)
		comment_list_height = $('#comment_list').height()
		var inHeight = window.innerHeight

		comment_db.collection("realrankus_comment").doc(selectedSubRegion).collection(temp_uid).where('like', '==', true).get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              like_status = doc.data()
              if(like_status['like']){
                $("#like_" + doc.id).css({'color' : '#e31939'})
              }              
            })           
          })

		if(!login_status){
			$(".comment_input_reply").html("로그인 후 댓글을 작성할 수 있어요")
		}

		if(blocked == 'true'){
			$(".comment_input_reply").html("신고에 의해 댓글 사용이 제한되었습니다")
			$('.comment_input_reply').css('border', '1px solid #ddd')
			$(".reply_user").css('color', '#bbb')
			$(".reply_icon").css('color', '#bbb')            
			$("#writing_id").css('color', '#bbb')
			$("#comment_input_wrap_none").css('border', '1px solid #ddd')
		}

		//console.log(scroll_pos)

		$('#no_comment').css({'height': (inHeight-160-50)+'px', 'overflow-y' : 'auto'})
		$('#comment_list').css({'height': (inHeight-160-50)+'px', 'overflow-y' : 'auto'})

		if(isMobile){
			$('.comment_reply_list').css({'grid-template-columns' : '0px 1fr'})
		}

		if(scroll_pos == 'end'){
			$('#comment_list').scrollTop($('#comment_list').prop('scrollHeight'))
		}
		else{
			pos = $("#" + scroll_pos).offset().top
			$('#comment_list').scrollTop($('#comment_list').prop(pos))
		}		
	}).catch((error) => {
		console.log("Error getting document:", error);
	});

	$("#commentWrapper").show()
}

function likeit(comment_id, user_id, like_num){
	docRef2 = comment_db.collection("realrankus_comment").doc(selectedSubRegion)
	docRef2.collection(temp_uid).doc(comment_id).get().then((field) => {        
	  if(field.exists){
		like = (field.data())['like']          
		//console.log("LIKE: " + like)
		if(like){
		  docRef2.collection(temp_uid).doc(comment_id).set({
			like: false,
			dislike: false
		  })
		  docRef2.update({
			[comment_id + ".likeit"]: firebase.firestore.FieldValue.increment(-1)
		  })
		  current_like_num = $('#like_num_' + comment_id).html()                        
		  $('#like_num_' + comment_id).html(Number(current_like_num)-1)
		  $('#like_' + comment_id).css({'color' : '#666'})
		}
		else{
		  docRef2.collection(temp_uid).doc(comment_id).set({
			like: true,
			dislike: false
		  })
		  docRef2.update({
			[comment_id + ".likeit"]: firebase.firestore.FieldValue.increment(1)
		  })
		  .then()
		  current_like_num = $('#like_num_' + comment_id).html()                        
		  $('#like_num_' + comment_id).html(Number(current_like_num)+1)
		  $('#like_' + comment_id).css({'color' : '#e31939'})
		}
	  }
	  else{
		docRef2.collection(temp_uid).doc(comment_id).set({
		  like: true,
		  dislike: false
		})
		docRef.update({
		  [comment_id + ".likeit"]: firebase.firestore.FieldValue.increment(1)
		})
		current_like_num = $('#like_num_' + comment_id).html()                        
		$('#like_num_' + comment_id).html(Number(current_like_num)+1)
		$('#like_' + comment_id).css({'color' : '#e31939'})
	  }                                    
	})
  }

  function reply_likeit(comment_id, reply_id, user_id, like_num){
	docRef2 = comment_db.collection("realrankus_comment").doc(selectedSubRegion)
	docRef2.collection(temp_uid).doc(reply_id).get().then((field) => {        
	  if(field.exists){
		like = (field.data())['like']
		//console.log("LIKE: " + like)
		if(like){
		  docRef2.collection(temp_uid).doc(reply_id).set({
			like: false,
			dislike: false
		  })
		  docRef2.update({
			[comment_id + ".reply." + reply_id + ".likeit"]: firebase.firestore.FieldValue.increment(-1)
		  })
		  current_like_num = $('#like_num_' + reply_id).html()                        
		  $('#like_num_' + reply_id).html(Number(current_like_num)-1)
		  $('#like_' + reply_id).css({'color' : '#666'})
		}
		else{
		  docRef2.collection(temp_uid).doc(reply_id).set({
			like: true,
			dislike: false
		  })
		  docRef2.update({
			[comment_id + ".reply." + reply_id + ".likeit"]: firebase.firestore.FieldValue.increment(1)
		  })
		  .then()
		  current_like_num = $('#like_num_' + reply_id).html()                        
		  $('#like_num_' + reply_id).html(Number(current_like_num)+1)
		  $('#like_' + reply_id).css({'color' : '#e31939'})
		}
	  }
	  else{
		docRef2.collection(temp_uid).doc(reply_id).set({
		  like: true,
		  dislike: false
		})
		docRef.update({
		  [comment_id + ".reply." + reply_id + ".likeit"]: firebase.firestore.FieldValue.increment(1)
		})
		current_like_num = $('#like_num_' + reply_id).html()                        
		$('#like_num_' + reply_id).html(Number(current_like_num)+1)
		$('#like_' + reply_id).css({'color' : '#e31939'})
	  }                                    
	})
  }   

function write_comment_modal(){
	title_html = "<div>우리동네 랭커스톡 작성</div>" //"우리동네"를 지역변수로 수정

	comment_html = "<div>"        
	comment_html += "<div id='comment_write_notice'>"
		comment_html +=
		`
		<div style='font-size: 1.2em; color:#e31939; font-weight:600; text-align:center'>건강한 랭커스톡을 만들어주세요!</div>
		<div>
		<ul class='write_notice'>
			<li>다른 사람 비방, 불쾌감 유발, 욕설은 임의로 삭제됩니다.</li>              
			<li>영리 목적의 게시글은 임의로 삭제됩니다.</li>
			<li>사용자간 토론이 아닌, 리얼랭커스 서비스에 대한 비난은 임의로 삭제됩니다.</li>
		</ul>
		</div>
		`
	comment_html += "</div>"
	comment_html += "<hr>"
	comment_html += "<div class='writing_id'>_<i class='fa-solid fa-pen'></i>&nbsp;&nbsp;" + shown_email + "</div>"
	comment_html += "<div><textarea id='comment_input' rows=5 warp='on' resize='none'></textarea></div>"
	comment_html += "<div id='writing_counter'>0/1000</div>"
	comment_html += "</div>"

	yesno_html = "<div><button class='btn_no' onClick='$(\"#commentModifyModal\").modal(\"hide\")'>취소</button></div>"
	yesno_html += "<div><button class='btn_yes' onClick='write_comment()'>등록</button></div>"

	$('#commentModifyModalLabel').html(title_html);
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').html(comment_html)
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').css({'background' : '#efefef'})
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-footer').html(yesno_html);
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-footer').css({'grid-template-columns' : '1fr 1fr'});
	$('#comment_input').focus()

	$('#commentModifyModal').modal("show")

	var oldVal = ""
	var writing_counter_html = ""
	$("#comment_input").on("propertychange change keyup paste input", function() {
		var currentVal = $(this).val();
		if(currentVal == oldVal) {
			return;
		}      
		oldVal = currentVal;
		
		if(currentVal.length > 1000){
		writing_counter_html = "<span style=color:red>" + currentVal.length + "</span>"
		}
		else{
		writing_counter_html = "<span>" + currentVal.length + "</span>"
		}
		$('#writing_counter').html(writing_counter_html + "/1000")
	});
}

function write_comment(){
	var docData = {}
	now = new Date()
	str_now = Number(now)
	written_comment = $('#comment_input').val()

	written_checker = written_comment.replaceAll(" ", "")
	written_checker = written_checker.replaceAll("\n", "")

	if(written_checker === ''){
	alert("동네 이야기 작성 후 등록해 주세요!")
	$('#comment_input').val("")
	}
	else if(written_comment.length > 1000){
	alert("최대 1000글자 까지 등록할 수 있어요!")        
	}
	else{
	docData = {
		["comment_" + str_now]: {
			email: temp_email,
			uid: temp_uid,
			comment: written_comment,
			written: now,
			likeit : 0,
			show: "normal"
		}
	};
	docRef.get().then((doc) => {
		if (doc.exists) {
			addData(docData)
		} else {
			setData(docData)
		}
		$("#commentModifyModal").modal("hide")		
		$('#comment_input').val("")
	}).catch((error) => {
		console.log("Error getting document:", error);
	});
	}
}

function addData(doc){
	docRef.update(doc)
	.then((docRef) => {
		//console.log("Document written with ID: ", docRef);
		sendTelegram_message(doc)
		read_comment("end")
	})
	.catch((error) => {
		console.error("Error adding document: ", error);
	});
}

function setData(doc){
	docRef.set(doc)
	.then((docRef) => {
		//console.log("Document written with ID: ", docRef);
		sendTelegram_message(doc)
		read_comment("end")
	})
	.catch((error) => {
		console.error("Error adding document: ", error);
	});
}

function reply_modal(comment_id){
	title_html = "<div>댓글 작성</div>" //"우리동네"를 지역변수로 수정

	comment_html = "<div>"        
	comment_html += "<div id='comment_write_notice'>"
		comment_html +=
		`
		<div style='font-size: 1.2em; color:#e31939; font-weight:600; text-align:center'>건강한 랭커스톡을 만들어주세요!</div>
		<div>
		<ul class='write_notice'>
			<li>다른 사람 비방, 불쾌감 유발, 욕설은 임의로 삭제됩니다.</li>              
			<li>영리 목적의 게시글은 임의로 삭제됩니다.</li>
			<li>사용자간 토론이 아닌, 리얼랭커스 서비스에 대한 비난은 임의로 삭제됩니다.</li>
		</ul>
		</div>
		`
	comment_html += "</div>"
	comment_html += "<hr>"
	comment_html += "<div class='writing_id'>_<i class='fa-solid fa-pen'></i>&nbsp;&nbsp;" + shown_email + "</div>"
	comment_html += "<div><textarea id='comment_input' rows=5 warp='on' resize='none'></textarea></div>"
	comment_html += "<div id='writing_counter'>0/500</div>"
	comment_html += "</div>"

	yesno_html = "<div><button class='btn_no' onClick='$(\"#commentModifyModal\").modal(\"hide\")'>취소</button></div>"
	yesno_html += "<div><button class='btn_yes' onClick='reply_comment(\"" + comment_id + "\")'>등록</button></div>"

	$('#commentModifyModalLabel').html(title_html);
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').html(comment_html)
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').css({'background' : '#efefef'})	
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-footer').html(yesno_html);
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-footer').css({'grid-template-columns' : '1fr 1fr'});
	$('#comment_input').focus()

	$('#commentModifyModal').modal("show")

	var oldVal = ""
	var writing_counter_html = ""
	$("#comment_input").on("propertychange change keyup paste input", function() {
		var currentVal = $(this).val();
		if(currentVal == oldVal) {
			return;
		}      
		oldVal = currentVal;
		
		if(currentVal.length > 500){
		writing_counter_html = "<span style=color:red>" + currentVal.length + "</span>"
		}
		else{
		writing_counter_html = "<span>" + currentVal.length + "</span>"
		}
		$('#writing_counter').html(writing_counter_html + "/500")
	});
}

function reply_comment(comment_id){
	var docData = {}
	now = new Date()
	str_now = Number(now)
	written_comment = $('#comment_input').val()
	written_checker = written_comment.replaceAll(" ", "")
	written_checker = written_checker.replaceAll("\n", "")
	
	if(written_checker === ''){
		alert("댓글 작성 후 등록해 주세요!")
		$('#comment_input').val("")
		}
		else if(written_comment.length > 500){
		alert("최대 500글자 까지 등록할 수 있어요!")        
		}
	else{
		docData = {            
			email: temp_email,
			uid: temp_uid,
			comment: written_comment,
			written: now,
			likeit : 0,
			show: "normal"
		};
		
		docRef.update({
			[comment_id + ".reply" + ".reply_" + str_now ] : docData,          
		})
		.then((docRef) => {
			console.log("Document written with ID: ", docRef);
			$("#commentModifyModal").modal("hide")
			sendTelegram_message(docData)
			read_comment(comment_id)
			$('#comment_input').val("")
		})
		.catch((error) => {
			console.error("Error adding document: ", error);
		});
	}
}

function modify_reply_modal(parent_id, reply_id){
	comment = $("#" + parent_id + "__" + reply_id).html()
	comment = comment.replaceAll("<br>", "\n")

	title_html = "<div>우리동네 랭커스톡 댓글 수정</div>" //"우리동네"를 지역변수로 수정

	modify_html = "<div>"
	modify_html += "<div class='writing_id'>_<i class='fa-solid fa-pen'></i>&nbsp;&nbsp;" + shown_email + "</div>"
	modify_html += "<div><textarea id='comment_modify_input' rows=5 warp='on' resize='none'></textarea></div>"
	modify_html += "</div>"

	yesno_html = "<div><button class='btn_no' onClick='$(\"#commentModifyModal\").modal(\"hide\")'>취소</button></div>"
	yesno_html += "<div><button class='btn_yes' onClick='modify_reply_comment(\"" + parent_id + "\", \"" + reply_id + "\")'>수정</button></div>"

	$('#commentModifyModalLabel').html(title_html);
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').html(modify_html)
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').css({'background' : '#efefef'})
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-footer').html(yesno_html);
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-footer').css({'grid-template-columns' : '1fr 1fr'});

	$('#comment_modify_input').val(comment)
	$('#comment_modify_input').focus()

	$('#commentModifyModal').modal("show")       
}

function modify_reply_comment(parent_id, reply_id){
	updated_comment = $("#comment_modify_input").val()
	now = new Date()
	str_now = Number(now)

	docRef.update({
	[parent_id + ".reply." + reply_id + ".comment" ] : updated_comment,
	[parent_id + ".reply." + reply_id + ".written" ] : now
	})
	.then((docRef) => {
		console.log("Document written with ID: ", docRef);          
		$("#commentModifyModal").modal("hide")
		read_comment(reply_id)
		$('#comment_input').val("")
	})
	.catch((error) => {
		console.error("Error adding document: ", error);
	});
}

function delete_reply_question(parent_id, reply_id){
	$('#commentModal > .modal-dialog > .modal-content> .modal-header').hide();
	$('#commentModal > .modal-dialog > .modal-content> .modal-body').css({'text-align' : 'center', 'height' : '6em', 'display':'grid', 'align-content':'center'})
	$('#commentModal > .modal-dialog > .modal-content> .modal-body').html("정말 삭제할까요?")      

	//yesno_html = "<div class='confirm_question'>"
	yesno_html = "<div class='footer_button'><button class='btn_no' onClick='$(\"#commentModal\").modal(\"hide\")'>아니요</button></div>"
	yesno_html += "<div class='footer_button'><button class='btn_yes' onClick='delete_reply(\"" + parent_id + "\", \"" + reply_id + "\")'>예</button></div>"
	//yesno_html += "</div>"

	$('#commentModal > .modal-dialog > .modal-content> .modal-footer').html(yesno_html);
	$('#commentModal > .modal-dialog > .modal-content> .modal-footer').css({'display':'grid', 'grid-template-columns' : '1fr 1fr', 'justify-items' :'center'})
	$('#commentModal').modal("show");
}

function delete_reply(parent_id, reply_id){
	var removeComment = docRef.update({
	[parent_id + ".reply." + reply_id] : firebase.firestore.FieldValue.delete()
	})
	.then((docRef) => {
	$('#commentModal').modal("hide");
	read_comment(parent_id)
	})
	.catch((error) => {
		console.error("Error adding document: ", error);
	});
}

function modify_comment_modal(comment_id, comment){
	comment = comment.replaceAll("<br>", "\n")

	title_html = "<div>우리동네 랭커스톡 수정</div>" //"우리동네"를 지역변수로 수정

	modify_html = "<div>"
	modify_html += "<div class='writing_id'>_<i class='fa-solid fa-pen'></i>&nbsp;&nbsp;" + shown_email + "</div>"
	modify_html += "<div><textarea id='comment_modify_input' rows=5 warp='on' resize='none'></textarea></div>"
	modify_html += "</div>"

	yesno_html = "<div><button class='btn_no' onClick='$(\"#commentModifyModal\").modal(\"hide\")'>취소</button></div>"
	yesno_html += "<div><button class='btn_yes' onClick='modify_comment(\"" + comment_id + "\")'>수정</button></div>"

	$('#commentModifyModalLabel').html(title_html);
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').html(modify_html)
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').css({'background' : '#efefef'})
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-footer').html(yesno_html);
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-footer').css({'grid-template-columns' : '1fr 1fr'});

	$('#comment_modify_input').val(comment)
	$('#comment_modify_input').focus()

	$('#commentModifyModal').modal("show")      
}

function modify_comment(comment_id){
	updated_comment = $("#comment_modify_input").val()
	now = new Date()
	str_now = Number(now)

	docRef.update({
	[comment_id + ".comment"] : updated_comment,
	[comment_id + ".written"] : now
	})
	.then((docRef) => {
		console.log("Document written with ID: ", docRef);          
		$("#commentModifyModal").modal("hide")
		read_comment(comment_id)
		$('#comment_input').val("")
	})
	.catch((error) => {
		console.error("Error adding document: ", error);
	});
}

function delete_comment_question(comment_id){
	$('#commentModal > .modal-dialog > .modal-content> .modal-header').hide();
	$('#commentModal > .modal-dialog > .modal-content> .modal-body').css({'text-align' : 'center', 'height' : '6em', 'display':'grid', 'align-content':'center'})
	$('#commentModal > .modal-dialog > .modal-content> .modal-body').html("정말 삭제할까요?")      

	//yesno_html = "<div class='confirm_question'>"
	yesno_html = "<div class='footer_button'><button class='btn_no' onClick='$(\"#commentModal\").modal(\"hide\")'>아니요</button></div>"
	yesno_html += "<div class='footer_button'><button class='btn_yes' onClick='delete_comment(\"" + comment_id + "\")'>예</button></div>"
	//yesno_html += "</div>"

	$('#commentModal > .modal-dialog > .modal-content> .modal-footer').html(yesno_html);
	$('#commentModal > .modal-dialog > .modal-content> .modal-footer').css({'display':'grid', 'grid-template-columns' : '1fr 1fr', 'justify-items' :'center'})
	$('#commentModal').modal("show");
}

function delete_comment(comment_id){
	var removeComment = docRef.update({
	[comment_id]: firebase.firestore.FieldValue.delete()
	})
	.then((docRef) => {
	$('#commentModal').modal("hide");
	read_comment("end")
	})
	.catch((error) => {
		console.error("Error adding document: ", error);
	});
}

function accuse_modal(comment_id, user_email, comment_index, user_id){
	title_html = "<div>랭커스톡 신고하기</div>"

	comment_html = "<div>"
	comment_html += "<div class='writing_id'><i class='fa-solid fa-triangle-exclamation'></i>&nbsp;&nbsp;" + user_email + "님의 랭커스톡을 신고합니다.</div>"
	comment_html += `
	<div id='accuse_selection'>
		<div><input type="radio" class='form-check-input' id="accuse_01" name="accuse" value="욕설 / 비방" checked><label for="accuse_01">&nbsp;&nbsp;욕설 / 비방</label></div>
		<div><input type="radio" class='form-check-input' id="accuse_02" name="accuse" value="홍보성"><label for="accuse_02">&nbsp;&nbsp;홍보성</label></div>
		<div><input type="radio" class='form-check-input' id="accuse_03" name="accuse" value="음란물 / 선정성"><label for="accuse_03">&nbsp;&nbsp;음란물 / 선정성</label></div>
		<div><input type="radio" class='form-check-input' id="accuse_04" name="accuse" value="같은 내용 반복"><label for="accuse_04">&nbsp;&nbsp;같은 내용 반복</label></div>
		<div>
		<input type="radio" class='form-check-input' id="accuse_05" name="accuse" value="기타"><label for="accuse_05">&nbsp;&nbsp;기타</label>
		<div><textarea id='accuse_input' rows=3 warp='on' resize='none' disabled></textarea></div>
		</div>          
	</div>
	`
	yesno_html = "<div><button class='btn_no' onClick='$(\"#commentModifyModal\").modal(\"hide\")'>취소</button></div>"
	yesno_html += "<div><button class='btn_yes' onClick='accuse_comment(\"" + comment_id + "\", \"" + user_email + "\", " + comment_index + ", \"" + user_id + "\")'>신고</button></div>"

	$('#commentModifyModalLabel').html(title_html);
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').html(comment_html)
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').css({'background' : '#efefef'})      
	$('#commentModifyModal > .modal-dialog > .modal-content> .modal-footer').html(yesno_html);

	$('#commentModifyModal').modal("show")

	$("input[name='accuse']").change(function(){
	if($("input[name='accuse']:checked").val() === "기타"){
		$('#accuse_input').prop("disabled", false)
		$('#accuse_input').focus()
	}
	else{
		$('#accuse_input').prop("disabled", true)
	}
	})
}

function accuse_comment(comment_id, user_email, comment_index, user_id){
	var accuseRef = comment_db.collection("realrankus_comment").doc("accuse_list")
	var current_region = shortRegionName( $("#sido option:selected").text() + " " + $("#gungu option:selected").text() );
	var current_region_id = selectedSubRegion
	var accuse_type = $("input[name='accuse']:checked").val()
	var accuse_comment = $('#accuse_input').val()
	
	var accused_comment = $('#comment_content_'+comment_index).text()
	//console.log(accused_comment)

	written_checker = accuse_comment.replaceAll(" ", "")
	written_checker = written_checker.replaceAll("\n", "")
	
	if(accuse_type === "기타" && written_checker === ''){
	alert("기타 신고 이유를 작성해 주세요.")
	$('#accuse_input').val("")
	return
	}      

	now = new Date()
	str_now = Number(now)

	accuseData = {
		["accuse_" + str_now]: {              
			comment_id: comment_id,
			accuser_email : temp_email,
			accuser_uid : temp_uid,
			accused_email: user_email,
			accused_uid: user_id,
			region_name : current_region,
			region_id : current_region_id,              
			accuse_type : accuse_type,              
			accuse_reason : accuse_comment,
			written: now,
			accused_content: accused_comment,
			in_progress: true
		}
	};

	accuseRef.update(accuseData)
	.then((accuseRef) => {
		console.log("Document written with ID: ", accuseRef);

		firebase.database().ref('users_moved').child(user_id).child('status').child('accused')
		.set(firebase.database.ServerValue.increment(1))

		$('#commentModifyModal').modal("hide")

		$('#commentModal > .modal-dialog > .modal-content> .modal-header').hide();
		$('#commentModal > .modal-dialog > .modal-content> .modal-body').css({'text-align' : 'center', 'height' : '6em', 'display':'grid', 'align-content':'center'})
		meg_html = "<div>" + user_email + "님의 랭커스톡이 신고되었습니다. <br> 운영정책 위배 여부 확인 후, 조치 예정입니다."
		$('#commentModal > .modal-dialog > .modal-content> .modal-body').html(meg_html)

		//yesno_html = "<div class='confirm_question'>"
		confirm_html = "<div class='footer_button'><button class='btn_yes' onClick='$(\"#commentModal\").modal(\"hide\")'>확인</button></div>"        
		//yesno_html += "</div>"

		$('#commentModal > .modal-dialog > .modal-content> .modal-footer').css({'grid-template-columns' : '1fr', 'justify-items' :'center'})
		$('#commentModal > .modal-dialog > .modal-content> .modal-footer').html(confirm_html);
		$('#commentModal').modal("show");
	})
	.catch((error) => {
		console.error("Error adding document: ", error);
	});
}

function accuse_reply_modal(parent_id, reply_id, user_email, user_id){
	title_html = "<div>랭커스톡 댓글 신고하기</div>"

	comment_html = "<div>"
	comment_html += "<div class='writing_id'><i class='fa-solid fa-triangle-exclamation'></i>&nbsp;&nbsp;" + user_email + "님의 랭커스톡 댓글을 신고합니다.</div>"
	comment_html += `
	<div id='accuse_selection'>
		<div><input type="radio" class='form-check-input' id="accuse_01" name="accuse" value="욕설 / 비방" checked><label for="accuse_01">&nbsp;&nbsp;욕설 / 비방</label></div>
		<div><input type="radio" class='form-check-input' id="accuse_02" name="accuse" value="홍보성"><label for="accuse_02">&nbsp;&nbsp;홍보성</label></div>
		<div><input type="radio" class='form-check-input' id="accuse_03" name="accuse" value="음란물 / 선정성"><label for="accuse_03">&nbsp;&nbsp;음란물 / 선정성</label></div>
		<div><input type="radio" class='form-check-input' id="accuse_04" name="accuse" value="같은 내용 반복"><label for="accuse_04">&nbsp;&nbsp;같은 내용 반복</label></div>
		<div>
		<input type="radio" class='form-check-input' id="accuse_05" name="accuse" value="기타"><label for="accuse_05">&nbsp;&nbsp;기타</label>
		<div><textarea id='accuse_input' rows=3 warp='on' resize='none' disabled></textarea></div>
		</div>          
	</div>
	`
	yesno_html = "<div><button class='btn_no' onClick='$(\"#commentModifyModal\").modal(\"hide\")'>취소</button></div>"
	yesno_html += "<div><button class='btn_yes' onClick='accuse_reply(\"" + parent_id + "\", \"" + reply_id + "\", \"" + user_email + "\", \"" + user_id + "\")'>신고</button></div>"

	$('#commentModifyModalLabel').html(title_html);
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').html(comment_html)
	$('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').css({'background' : '#efefef'})      
	$('#commentModifyModal > .modal-dialog > .modal-content> .modal-footer').html(yesno_html);

	$('#commentModifyModal').modal("show")

	$("input[name='accuse']").change(function(){
	if($("input[name='accuse']:checked").val() === "기타"){
		$('#accuse_input').prop("disabled", false)
		$('#accuse_input').focus()
	}
	else{
		$('#accuse_input').prop("disabled", true)
	}
	})
}

function accuse_reply(parent_id, reply_id, user_email, user_id){
	var accuseRef = comment_db.collection("realrankus_comment").doc("accuse_list")
	var current_region = "서울시 강남구" //Region id로 수정
	var current_region_id = "1168000000_Seoul_Gangnam" //Region id로 수정
	var accuse_type = $("input[name='accuse']:checked").val()
	var accuse_comment = $('#accuse_input').val()      
	var accused_comment = $("#" + parent_id + "__" + reply_id).text()

	written_checker = accuse_comment.replaceAll(" ", "")
	written_checker = written_checker.replaceAll("\n", "")
	
	if(accuse_type === "기타" && written_checker === ''){
	alert("기타 신고 이유를 작성해 주세요.")
	$('#accuse_input').val("")
	return
	}      

	now = new Date()
	str_now = Number(now)

	accuseData = {
		["accuse_" + str_now]: {              
			comment_id: parent_id,
			reply_id : reply_id,
			accuser_email : temp_email,
			accuser_uid: temp_uid,
			accused_email: user_email,
			accused_uid: user_id,
			region_name : current_region,
			region_id : current_region_id,              
			accuse_type : accuse_type,              
			accuse_reason : accuse_comment,
			written: now,
			accused_content: accused_comment,
			in_progress: true
		}
	};

	accuseRef.update(accuseData)
	.then((accuseRef) => {
		console.log("Document written with ID: ", accuseRef);
		$('#commentModifyModal').modal("hide")

		$('#commentModal > .modal-dialog > .modal-content> .modal-header').hide();
		$('#commentModal > .modal-dialog > .modal-content> .modal-body').css({'text-align' : 'center', 'height' : '6em', 'display':'grid', 'align-content':'center'})
		meg_html = "<div>" + user_email + "님의 랭커스톡이 신고되었습니다. <br> 운영정책 위배 여부 확인 후, 조치 예정입니다."
		$('#commentModal > .modal-dialog > .modal-content> .modal-body').html(meg_html)

		//yesno_html = "<div class='confirm_question'>"
		confirm_html = "<div class='footer_button'><button class='btn_yes' onClick='$(\"#commentModal\").modal(\"hide\")'>확인</button></div>"        
		//yesno_html += "</div>"

		$('#commentModal > .modal-dialog > .modal-content> .modal-footer').css({'grid-template-columns' : '1fr', 'justify-items' :'center'})
		$('#commentModal > .modal-dialog > .modal-content> .modal-footer').html(confirm_html);
		$('#commentModal').modal("show");
	})
	.catch((error) => {
		console.error("Error adding document: ", error);
	});
}
