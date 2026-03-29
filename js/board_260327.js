// [신규 추가] 공통 권한 검증 함수 (유령 로그인 차단)
function isAuthValid() {
  if (!login_status || !temp_uid || !temp_email) return false;
  // 더미 데이터(유령 계정) 조건 필터링
  if (temp_uid === "abcdefghijklmnopqrstuvwxyz" || temp_email.includes("abc@abc.com") || temp_email.includes("undefined")) {
    return false;
  }
  return true;
}

function complex_list_like_status(){
	const current_region_id = selectedSubRegion	
	firebase.database().ref().child("realrankus_complex_like_total").child(current_region_id).get().then((snapshot) => {
		if(snapshot.exists()){
			const complex_list = Object.entries(snapshot.val())
			complex_list.forEach((complexes) => {
				const complex_code = complexes[0].split("_")[1]
				const complex_like_num = complexes[1]['Living'] + complexes[1]['Trans'] + complexes[1]['Infra'] + complexes[1]['Edu']
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
}

let non_blog_html = ""
non_blog_html += "<div class='blog_list' onClick='showBlogWindow()'>"
//non_blog_html += "<div class='blog_img_box'><img src=\"./apt-rank-512x512.png\" width='100px'/></div>"
non_blog_html += "<div class='blog_list_blank'>"
non_blog_html += "<div class='blog_title'>단지 블로그를 등록해 주세요!</div>"
non_blog_html += "<div class='blog_sub'>실제 찾아가 눈으로 보고 분석한 소중한 경험을 알려주세요</div>"
non_blog_html += "<div class='blog_sub2'>by 리얼랭커스</div>"
non_blog_html += "</div>"

function changePosting(type, obj){	
	if(type == "title"){		
		if(obj.value == null || obj.value == ""){
			$("#blog_ex_title").html("포스팅 제목이 표시됩니다")
			$("#realPosting_guide_title").css({'color' : '#940c23'})
			$("#realPosting_guide_title").html("<i class='fa-solid fa-circle-exclamation'></i> 제목은 필수 입력항목 이예요")
			return
		}
		else{
			$("#blog_ex_title").html(obj.value)
			$("#realPosting_guide_title").css({'color' : '#108527'})
			$("#realPosting_guide_title").html("<i class='fa-solid fa-circle-exclamation'></i> 문제 없이 입력 되었어요")
		}	
	}

	if(type == "owner"){
		if(obj.value == null || obj.value == ""){
			$("#blog_ex_owner").html("by 작성자")
			$("#realPosting_guide_owner").css({'color' : '#940c23'})
			$("#realPosting_guide_owner").html("<i class='fa-solid fa-circle-exclamation'></i> 작성자는 필수 입력항목 이예요")
		}
		else{
			$("#realPosting_guide_owner").css({'color' : '#108527'})
			$("#realPosting_guide_owner").html("<i class='fa-solid fa-circle-exclamation'></i> 문제 없이 입력 되었어요")
			$("#blog_ex_owner").html("by " + obj.value)
		}		
	}

	if(type == "description"){
		if(obj.value == null || obj.value == ""){
			$("#blog_ex_des").html("포스팅 요약이 표시됩니다")
		}
		$("#blog_ex_des").html(obj.value)
	}

	if(type == "URL"){
		//URL 감지하는 정규식
		if(obj.value == null || obj.value == ""){
			$("#realPosting_guide_url").css({'color' : '#940c23'})
			$("#realPosting_guide_url").html("<i class='fa-solid fa-circle-exclamation'></i> 링크 주소는 필수 입력항목 이예요")
			return
		}
		if(isValidURL(obj.value)){
			//URL에 ? 또는 #이 있을 경우
			//URL을 ? 또는 #으로 나누어서 ? 또는 # 앞의 내용을 가져옴
			if(obj.value.indexOf("?") != -1){
				const url = obj.value.split("?")[0]
				obj.value = url
			}
			if(obj.value.indexOf("#") != -1){
				const url = obj.value.split("#")[0]
				obj.value = url
			}
			$("#realPosting_guide_url").css({'color' : '#108527'})
			$("#realPosting_guide_url").html("<i class='fa-solid fa-circle-exclamation'></i> 문제 없이 입력 되었어요")
		}
		else{
			$("#realPosting_guide_url").css({'color' : '#940c23'})
			$("#realPosting_guide_url").html("<i class='fa-solid fa-circle-exclamation'></i> 정확한 URL을 입력해 주세요")
			return
		}
	}

	if(type == "image"){
		if(obj.value == null || obj.value == ""){
			$("#realPosting_guide_image").css({'color' : '#aaa'})
			$("#realPosting_guide_image").html("<i class='fa-solid fa-circle-exclamation'></i> 이미지의 URL을 입력해 주세요")
			return
		}
		//image 감지하는 정규식
		//이미지 파일 확장자가 포함되어 있다면 이미지 파일로 인식
		if(obj.value.indexOf(".jpg") != -1 || obj.value.indexOf(".jpeg") != -1 || obj.value.indexOf(".png") != -1 || obj.value.indexOf(".gif") != -1){
			$("#blog_ex_image").html("<img src=\"" + obj.value + "\" width='100px'/>")
			$("#realPosting_guide_image").css({'color' : '#108527'})
			$("#realPosting_guide_image").html("<i class='fa-solid fa-circle-exclamation'></i> 문제 없이 입력 되었어요")
		}
		else{
			$("#blog_ex_image").html("<img src=\"./apt-rank-512x512.png\" width='100px'/>")
			$("#realPosting_guide_image").css({'color' : '#940c23'})
			$("#realPosting_guide_image").html("<i class='fa-solid fa-circle-exclamation'></i> 정확한 이미지 URL을 입력해 주세요")
		}
	}
}

function isValidURL(url) {
	//const urlRegex = /^(https?|ftp):\/\/(-\.)?([^\s\/?\.#-]+\.?)+(\/[^\s]*)?$/i;
	const urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
	return urlRegex.test(url);
}

function showCommentWindow(region_id, complex_id) {
	$(".offcanvas").offcanvas("hide") //offcanvas
	openModal('commentListModal')
	$("#baseModal").css({"z-index":"850"})
	$(".modal-backdrop").css({"width":"100%"})
}

function showBlogWindow(complex_id) {
	$(".offcanvas").offcanvas("hide") //offcanvas	
	
	noticePop = true;
	const titleHtml = "<div class='popupTitle'>리얼포스팅 등록</div>";
	let footerHtml = "";
	let detailHtml = "";

	detailHtml += "<div class='realPosting_win'>"
		detailHtml += "<div class='realPosting_title'><label for='blog_title'>제목*</label></div>";
		detailHtml += "<div class='realPosting_content'><input type='text' onkeyup='changePosting(\"title\",this)' placeholder='포스팅 제목을 입력하세요' class='realPosting_input' id='blog_title' name='blog_title' required></div>";
		detailHtml += "<div class='realPosting_guide' id='realPosting_guide_title'><i class='fa-solid fa-circle-exclamation'></i> 제목은 필수 입력항목 이예요</div>";
	detailHtml += "</div>"

	detailHtml += "<div class='realPosting_win'>"
		detailHtml += "<div class='realPosting_title'><label for='blog_url'>블로그링크*</label></div>";
		detailHtml += "<div class='realPosting_content'><input type='text' onkeyup='changePosting(\"URL\",this)' placeholder='포스팅 링크 주소를 입력하세요' class='realPosting_input' id='blog_url' name='blog_url' required></div>";
		detailHtml += "<div class='realPosting_guide' id='realPosting_guide_url'><i class='fa-solid fa-circle-exclamation'></i> 링크 주소는 필수 입력항목 이예요</div>";
	detailHtml += "</div>"

	detailHtml += "<div class='realPosting_win'>"
		detailHtml += "<div class='realPosting_title'><label for='blog_owner'>작성자*</label></div>";
		detailHtml += "<div class='realPosting_content'><input type='text' onkeyup='changePosting(\"owner\",this)' placeholder='작성자를 입력하세요' class='realPosting_input' id='blog_owner' name='blog_owner' required></div>";
		detailHtml += "<div class='realPosting_guide' id='realPosting_guide_owner'><i class='fa-solid fa-circle-exclamation'></i> 작성자는 필수 입력항목 이예요</div>";
	detailHtml += "</div>"	

	detailHtml += "<div class='realPosting_win'>"
		detailHtml += "<div class='realPosting_title'><label for='blog_des'>요약</label></div>";
		detailHtml += "<div class='realPosting_content'><input type='text' onkeyup='changePosting(\"description\",this)' placeholder='포스팅 요약 내용을 입력하세요' class='realPosting_input' id='blog_des' name='blog_des'></div>";
		detailHtml += "<div class='realPosting_guide' id='realPosting_guide_des'><i class='fa-solid fa-circle-exclamation'></i> 안 써도 되지만 쓰면 보기 좋아요</div>";
	detailHtml += "</div>"

	/*
	detailHtml += "<div class='realPosting_win'>"
		detailHtml += "<div class='realPosting_title'><label for='blog_image'>이미지링크</label></div>";
		detailHtml += "<div class='realPosting_content'><input type='text' onkeyup='changePosting(\"image\",this)' placeholder='포스팅 이미지 링크 주소를 입력하세요' class='realPosting_input' id='blog_image' name='blog_image'></div>";
		detailHtml += "<div class='realPosting_guide' id='realPosting_guide_image'><i class='fa-solid fa-circle-exclamation'></i> 이미지의 URL을 입력해 주세요</div>";
	detailHtml += "</div>"
	*/

	detailHtml += "<div class='realPosting_title'><label style='padding-left: 5px; margin-bottom:5px'>리얼포스팅이 이렇게 보여져요!</label></div>";
	detailHtml += "<div class='blog_list'>"		
		//detailHtml += "<div class='blog_img_box' id='blog_ex_image'><img src=\"./apt-rank-512x512.png\" width='100px'/></div>"
		detailHtml += "<div class='blog_des'>"
		detailHtml += "<div class='blog_title' id='blog_ex_title'>포스팅 제목이 표시됩니다</div>"
		detailHtml += "<div class='blog_sub' id='blog_ex_des'>포스팅 요약이 표시됩니다</div>"
		detailHtml += "<div class='blog_sub2' id='blog_ex_owner'>by 작성자</div>"
		detailHtml += "</div>"
	detailHtml += "</div>"

	detailHtml += "<hr><div>"
		+"<ul>"
		+"<li><div class='supplyContent'>단지 정보와 무관한 포스팅은 검토 후 임의로 삭제됩니다.</div></li>"
		+"<li><div class='supplyContent'>포스팅 등록 후, 수정/삭제는 <a href='http://pf.kakao.com/_vESNb' target='_blank'>카카오톡 채널</a>로 연락주세요.</div></li>"
		+"<li><div class='supplyContent'>리얼포스팅은 최대 3개까지 보여집니다.</div></li>"
		+"</ul>"
		+"</div>"

	footerHtml += "<div class='realPosting_win'><button class='btn btn-danger' onClick='sendBlog(\"" + current_selection + "\")'>등록하기</button></div>"

	$("#blogModalLabel").html(titleHtml);
	$("#blogDetail").html(detailHtml);
	$("#blogFooter").html(footerHtml);

	//$("#blogModal").modal("show"); //offcanvas
	openModal('blogModal')
	$("#baseModal").css({"z-index":"850"})
	$(".modal-backdrop").css({"width":"100%"})
}

function sendBlog(complex_id){
	const current_region_id = selectedSubRegion	
	const blog_title = $("#blog_title").val()
	const blog_url = $("#blog_url").val()
	const blog_owner = $("#blog_owner").val()
	const blog_des = $("#blog_des").val()	

	if(blog_title == "" || blog_title == null){
		toastr.options = {
			closeButton: false,
			progressBar: false,
			showMethod: 'fadeIn',
			closeMethod: 'fadeOut',
			positionClass: "toast-bottom-center",
			timeOut: 1000
		};
		toastr.warning("제목을 입력해 주세요!");
		return
	}
	if(blog_url == "" || blog_url == null){
		toastr.options = {
			closeButton: false,
			progressBar: false,
			showMethod: 'fadeIn',
			closeMethod: 'fadeOut',
			positionClass: "toast-bottom-center",
			timeOut: 1000
		};
		toastr.warning("URL을 입력해 주세요!");
		return
	}
	if(blog_owner == "" || blog_owner == null){
		toastr.options = {
			closeButton: false,
			progressBar: false,
			showMethod: 'fadeIn',
			closeMethod: 'fadeOut',
			positionClass: "toast-bottom-center",
			timeOut: 1000
		};
		toastr.warning("작성자를 입력해 주세요!");
		return
	}

	//blog_url이 URL 형식인지 확인
	//URL 형식이 아니라면 URL 형식이 아닙니다 메시지 출력
	if(!isValidURL(blog_url)){
		toastr.options = {
			closeButton: false,
			progressBar: false,
			showMethod: 'fadeIn',
			closeMethod: 'fadeOut',
			positionClass: "toast-bottom-center",
			timeOut: 1000
		};
		toastr.warning("블로그링크에 올바른 URL 주소를 입력해 주세요!");
		return
	}

	const blog_data = {
		'title' : blog_title,
		'url' : blog_url,
		'auth' : blog_owner,
		'description' : blog_des,
		'imgLink' : "",
	}
	
	firebase.database().ref('realrankus_blog/' + current_region_id + '/complex_' + complex_id).child("blog_list").get()
	//blog_list의 blog1이 비어있는지 확인
	.then((snapshot) => {
		if(snapshot.exists()){
			let blog_list = snapshot.val()
			let blog_list_keys = Object.keys(blog_list)			

			if(blog_list['blog1'] == "" || blog_list['blog1'] == null || blog_list == null){
				firebase.database().ref('realrankus_blog/' + current_region_id + '/complex_' + complex_id + "/blog_list").set({						
					'blog1' : blog_data,									
				})
				.then(() => {
					//$("#blogModal").modal("hide");
					closeModal("blogModal")
					toastr.options = {
						closeButton: false,
						progressBar: false,
						showMethod: 'fadeIn',
						closeMethod: 'fadeOut',
						positionClass: "toast-bottom-center",
						timeOut: 1000
					};
					complex_blog(complex_id, "")
					sendTelegram_blog([current_region_id, "complex_" + complex_id, blog_title, blog_url, blog_owner])
					toastr.success("리얼포스팅이 등록되었습니다!");
				})
			}
			else{
				//blog_list의 'url'이 같은 데이터가 있는지 확인
				//같은 데이터가 있다면 이미 등록된 포스팅입니다 메시지 출력
				for(let i = 0 ; i < blog_list_keys.length ; i++ ){
					if(blog_list[blog_list_keys[i]]['url'] == blog_url){
						toastr.options = {
							closeButton: false,
							progressBar: false,
							showMethod: 'fadeIn',
							closeMethod: 'fadeOut',
							positionClass: "toast-bottom-center",
							timeOut: 1000
						};
						toastr.error("이미 등록된 포스팅입니다!");
						return
					}
				}
				
				//blog_list의 마지막 key를 가져옴
				let last_key = blog_list_keys[blog_list_keys.length-1]
				//blog_list의 마지막 key에 1을 더함
				let new_key = Number(last_key.split("blog")[1]) + 1
				//새로운 key를 생성
				new_key = "blog" + new_key
				//새로운 key에 데이터를 저장				
				firebase.database().ref('realrankus_blog/' + current_region_id + '/complex_' + complex_id + "/blog_list").update({						
					[new_key] : blog_data,									
				})
				.then(() => {
					//$("#blogModal").modal("hide");
					closeModal("blogModal")
					toastr.options = {
						closeButton: false,
						progressBar: false,
						showMethod: 'fadeIn',
						closeMethod: 'fadeOut',
						positionClass: "toast-bottom-center",
						timeOut: 1000
					};
					complex_blog(complex_id, "")
					sendTelegram_blog([current_region_id, "complex_" + complex_id, blog_title, blog_url, blog_owner])
					toastr.success("리얼포스팅이 등록되었습니다!");
				})
			}
		}
	})
}

function complex_blog(complex_id, aptName){	
	const current_region_id = selectedSubRegion
	//console.log("POSTING!!")
	firebase.database().ref().child("realrankus_blog").child(current_region_id).child("complex_" + complex_id).child("blog_list").get()
	.then((snapshot) => {
		if(snapshot.exists()){
			let blog_list = snapshot.val()			
			let blog_list_keys = Object.keys(blog_list)

			if(blog_list['blog1'] == "" || blog_list['blog1'] == null || blog_list == null){
				$("#blog_list_area").html(non_blog_html)
				return
			}

			let blog_html = ""

			if(blog_list_keys.length > 1){
				//#blog_list_area의 높이를 자동으로 변경
				$("#blog_list_area").css({'height' : 'auto'})
			}

			let blog_length = blog_list_keys.length
			if(blog_length > 3){
				blog_length = 3
			}

			for(let i = 0 ; i < blog_length ; i++ ){
				let blog_title = blog_list[blog_list_keys[i]]['title']
				let blog_des = blog_list[blog_list_keys[i]]['description']
				let blog_imgLink = blog_list[blog_list_keys[i]]['imgLink']
				let blog_url = blog_list[blog_list_keys[i]]['url']
				let blog_auth = blog_list[blog_list_keys[i]]['auth']

				if(i == 0){
					blog_html += "<div class='blog_list' onClick='openOuterLink(\"" + blog_url + "\")'>"
				}

				/*				
				if(blog_imgLink == "" || blog_imgLink == null){
					blog_html += "<div class='blog_img_box'><img src=\"./apt-rank-512x512.png\" width='100px'/></div>"
				}
				else{
					if (blog_imgLink.indexOf('http') != -1) {
						blog_html += "<div class='blog_img_box'><img src=\"" + blog_imgLink + "\" width='100px'/></div>"
					}
					else{
						blog_html += "<div class='blog_img_box'><img src=\"./image/blog/" + blog_imgLink + "\" width='100px'/></div>"
					}
				}
				*/
				blog_html += "<div class='blog_list_wrapper'>"
					blog_html += "<div class='blog_img_box'></div>"
				
					blog_html += "<div class='blog_des'>"
						blog_html += "<div class='blog_title'>" + blog_title + "</div>"
						blog_html += "<div class='blog_sub'>" + blog_des + "</div>"
						blog_html += "<div class='blog_sub2'>by " + blog_auth + "</div>"
					blog_html += "</div>"
				blog_html += "</div>"
			}
			blog_html += "</div>"

			$("#blog_list_area").html(blog_html)
			
			let proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(blog_url);			

			$.getJSON(proxyUrl, function(data) {
				let html = data.contents;
				let doc = new DOMParser().parseFromString(html, 'text/html');
				let ogImage = doc.querySelector('meta[property="og:image"]');

				if (ogImage) {
					$('.blog_img_box').html("<div class='spinner-border' role='status' style='opacity:0.2'></div>");
					let originalImage = ogImage.content;
					let proxied = "https://images.weserv.nl/?url=" + encodeURIComponent(originalImage.replace(/^https?:\/\//, ''));					
					$('.blog_img_box').show()
					$('.blog_img_box').html(`<img src="${proxied}" width='100px' height='100px'">`);
					$('.blog_list_wrapper').css({'display':'grid', 'grid-template-columns':'100px 1fr'})
				} else {					
					$('.blog_list_wrapper').css({'display':'grid', 'grid-template-columns':'1fr', 'padding-bottom': '5px'})
					$('.blog_img_box').hide()
				}
			}).fail(function () {
				$('.blog_img_box').show()
				$('.blog_list_wrapper').css({'display':'grid', 'grid-template-columns':'100px 1fr', 'padding-bottom': '0px'})
				$('.blog_img_box').html("<div class='spinner-border' role='status' style='opacity:0.2'></div>");
			});			
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
	const current_region_id = selectedSubRegion

	if (!isAuthValid()){
		showLogin()
		$("#loginModalLabel>.popupTitle").html("로그인 후에 좋아요를 해 주세요!")
		closeModal("baseModal")		
		openModal("loginModal")
		$(".modal-backdrop").css({"width":"100%"})
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

	let updates = {};
	const complex_like_db = comment_db.collection("realrankus_complex_like").doc(current_region_id).collection(complex_id).doc(temp_uid)
	complex_like_db.get().then((like_list) => {
		if(like_list.exists){
			let living_like = Number( (like_list.data())['Living'] )
			let trans_like = Number( (like_list.data())['Trans'] )
			let infra_like = Number( (like_list.data())['Infra'] )
			let edu_like = Number( (like_list.data())['Edu'] )

			if(category == 'living'){
				if(living_like === 1){
					living_like = 0					
					complex_like_db.update("Living", firebase.firestore.FieldValue.increment(-1))
					.then(()=>{
						updates['realrankus_complex_like_total/' + current_region_id + '/complex_' + complex_id + "/Living"] = firebase.database.ServerValue.increment(-1);
						firebase.database().ref().update(updates)
						.then(() =>{ background_update(current_region_id, complex_id) })

						const current_num = $("#complex_like_num_living_" + complex_id).html()
						const fixed_num = Number(current_num)-1
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

						const current_num = $("#complex_like_num_living_" + complex_id).html()
						const fixed_num = Number(current_num)+1
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

						const current_num = $("#complex_like_num_trans_" + complex_id).html()
						const fixed_num = Number(current_num)-1
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

						const current_num = $("#complex_like_num_trans_" + complex_id).html()
						const fixed_num = Number(current_num)+1
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

						const current_num = $("#complex_like_num_infra_" + complex_id).html()
						const fixed_num = Number(current_num)-1
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

						const current_num = $("#complex_like_num_infra_" + complex_id).html()
						const fixed_num = Number(current_num)+1
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

						const current_num = $("#complex_like_num_edu_" + complex_id).html()
						const fixed_num = Number(current_num)-1
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

						const current_num = $("#complex_like_num_edu_" + complex_id).html()
						const fixed_num = Number(current_num)+1
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

function background_update(current_region_id, complex_id) {
  firebase.database().ref().child("realrankus_complex_like_total").child(current_region_id).child("complex_" + complex_id).get()
  .then((snapshot) => {
    if (snapshot.exists()) {						
      const complex_list = snapshot.val();
      const complex_like_num = complex_list['Living'] + complex_list['Trans'] + complex_list['Infra'] + complex_list['Edu'];
      $("#complex_like_num_" + complex_id).html(complex_like_num);

      if (complex_like_num > 0) $("#complex_" + complex_id).css({'color' : '#e31939'});
      else $("#complex_" + complex_id).css({'color' : '#999'});
    } else {
      console.log("NO DATA");
    }
  });
}

function setComplexLike(complexCode, aptName){
	const current_region_id = selectedSubRegion
	const complex_like_db = comment_db.collection("realrankus_complex_like").doc(current_region_id).collection(complexCode).doc(temp_uid)

	//complex_like_db.get().then((querySnapshot) => {
	firebase.database().ref().child("realrankus_complex_like_total").child(current_region_id).child("complex_" + complexCode).get().then((snapshot) => {
		if(snapshot.exists()){
			const like_status = snapshot.val()
			//console.log("LIKE_STATUS : " + like_status)
			const living_count = like_status['Living']
			const trans_count = like_status['Trans']
			const infra_count = like_status['Infra']
			const edu_count = like_status['Edu']
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
					const living_like = Number( (like_list.data())['Living'] )
					const trans_like = Number( (like_list.data())['Trans'] )
					const infra_like = Number( (like_list.data())['Infra'] )
					const edu_like = Number( (like_list.data())['Edu'] )					

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
	let writebox_html = ""
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
			writebox_html += "<div id='comment_input_wrap_none'>우리 단지 랭커스톡을 남겨보세요</div>"
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

const default_comment = [
	"단지에 대해 어떻게 생각하시나요?",
	"단지의 장점은 무엇인가요?",	
	"단지에 살면서 가장 만족스러운 점은 무엇인가요?",	
	"아파트 주변의 교통 편의성은 어떤가요?",
	"주변 교육 환경에 대해 어떻게 생각하시나요?",
	"단지의 커뮤니티 시설은 만족스러운가요?",
	"아파트의 보안 시스템에 대해 어떻게 생각하시나요?",
	"단지의 관리 상태는 어떤가요?",
	"아파트의 이웃들은 어떤 분들인가요?",
	"아파트의 가격 대비 가치에 대해 어떻게 생각하시나요?",
	"단지의 자연 환경은 어떤가요?",
	"아파트의 주차 시설은 만족스러운가요?",
	"단지의 소음 수준은 어떤가요?",	
	"단지의 편의 시설은 만족스러운가요?",		
	"단지의 위치는 생활에 편리한가요?",
	"아파트의 디자인과 건축 품질에 대해 어떻게 생각하시나요?"
]

function retryOnce(promiseFunc, delay = 300) {
    return promiseFunc().catch(err => {
        console.warn("첫 번째 시도 실패. 재시도 중...", err);
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                promiseFunc().then(resolve).catch(reject);
            }, delay);
        });
    });
}


function read_comment(scroll_pos) {
  let normal_comments = [];
  let comment_html = "";
  
  $("#comment_title").html(`${detail_complex} 랭커스톡`);

  // 리얼포스팅 영역
  comment_html += "<div class='card-body' id='blog_list_area'></div>";

  retryOnce(() => docRef.get()).then((comment_list) => {
    if (comment_list.exists) {
      const doc_list = Object.entries(comment_list.data());
      const comment_num = doc_list.length;
      
      if (comment_num === 0) {
        $('#comment_popTitle').html(`<div><i class='fa-regular fa-comment'></i>&nbsp&nbsp${comment_num}개의 우리 단지 랭커스톡</div>`);
      } else {
        $('#comment_popTitle').html(`<div><i class='fa-solid fa-comment'></i>&nbsp&nbsp${comment_num}개의 우리 단지 랭커스톡</div>`);
      }			

      if (doc_list.length === 0) {
        clearInterval(window.commentSampleInterval);
        window.commentSampleInterval = setInterval(() => {
          const randomIndex = Math.floor(Math.random() * default_comment.length);
          $('#comment_sample').html(`<div>${default_comment[randomIndex]}</div>`);
        }, 3000);

        comment_html += `
          <div>
            <div id='no_comment' style='text-align:center'>첫 번째 랭커스톡의 주인공이 되어주세요!<br>
              ${login_status 
                ? "<button id='btn_no_comment' onClick='write_comment_modal()'>첫 번째 랭커스톡 쓰기</button>" 
                : "<button id='btn_no_comment' data-bs-toggle='modal' data-bs-target='#loginModal' onclick='showLogin()'>로그인 하고 랭커스톡 쓰기</button>"}
            </div>
          </div>
        `;
      } else {
        doc_list.sort((a, b) => b[1]['written'].toDate() - a[1]['written'].toDate());
        let index = 0;
        const limit_count = isMobile ? 28 : 35;
        
        // 롤링 코멘트용 최상단 데이터 추출
        for (let i = 0; i < doc_list.length; i++) {
          if (doc_list[i][1]['show'] === 'normal') {												
            if (doc_list[i][1]['comment'].length > limit_count) {
              normal_comments.push(doc_list[i][1]['comment'].substring(0, limit_count) + "...");
            } else {
              normal_comments.push(doc_list[i][1]['comment']);
            }
          }
        }
        
        if (normal_comments.length > 0) {
            $('#comment_sample').html(`<div>${normal_comments[0]}</div>`);
        }

        if (normal_comments.length < 5) {
          const needed = 5 - normal_comments.length;
          for (let j = 0; j < needed; j++) {
            const randomIndex = Math.floor(Math.random() * default_comment.length);
            normal_comments.push(default_comment[randomIndex]);
          }
        }

        clearInterval(window.commentSampleInterval);
        window.commentSampleInterval = setInterval(() => {
          const randomIndex = Math.floor(Math.random() * normal_comments.length);
          $('#comment_sample').html(`<div>${normal_comments[randomIndex]}</div>`);
        }, 5000);				

        // 댓글 리스트 렌더링
        doc_list.forEach((doc) => {
          const showhide = doc[1]['show'];
          
          if (showhide !== 'normal') {
            let restriction_text = "";
            if (showhide === 'deleted') return;
            else if (showhide === 'accused') restriction_text = "신고에 의해 가리기 처리된 글입니다.";
            else if (showhide === 'restricted_word') restriction_text = "부적절한 표현으로 가리기 처리된 글입니다.";
            
            comment_html += `
              <div class='comment_wapper'>
                <div class='comment_line2'>
                  <div class='comment_content' style='text-align: center; color: #aaa'>${restriction_text}</div>
                </div>
              </div>
            `;
            return;
          }                
          
          const comment_id = doc[0];
          const user_email_original = doc[1]['email'];
          const user_email_original_sep = user_email_original.split("@")[0];
          const user_email = `${user_email_original_sep.substr(0, 1)}***${user_email_original_sep.substr(-1, 1)}`;
          const reply_list = doc[1]['reply'];
          const user_id = doc[1]['uid'];                
          
          const written_timestamp = doc[1]['written'].toDate();
          const written_date = `${written_timestamp.getFullYear()}-${written_timestamp.getMonth() + 1}-${written_timestamp.getDate()}`;
          const written_time = `${written_timestamp.getHours()}:${dateReturn(written_timestamp.getMinutes())}`;

          const comment_content_original = doc[1]['comment'];
          let comment_content = comment_content_original.replaceAll("\n", "<br>");

          for (let p = 0; p < restrict_words.length; p++) {
            comment_content = comment_content.replaceAll(restrict_words[p], "***");
          }

          comment_content = linkifyHtml(comment_content, {
            defaultProtocol: 'https',
            target: '_blank'
          });

          comment_html += `
            <div class='comment_wapper'>
              <div class='comment_line1'>
                <div><i class='fa-solid fa-user-pen'></i>&nbsp;&nbsp;${user_email}</div>
                <div style='text-align:right'>${written_date}, ${written_time}</div>
                <div style='text-align:right; color:#aaa; cursor:pointer' onClick='accuse_modal("${comment_id}", "${user_email}", ${index}, "${user_id}")'>[신고하기]</div>
              </div>
              <div class='comment_line2'>
                <div class='comment_content' id='comment_content_${index}'>${comment_content}</div>
              </div>
              <div class='comment_line3'>
                <div class='comment_options' id='like_${comment_id}' onClick='likeit("${comment_id}", "${user_id}", ${doc[1]['likeit']})'>
                  <div><i class='fa-solid fa-heart'></i></div>
                  <div id='like_num_${comment_id}'>${doc[1]['likeit']}</div>
                </div>
          `;

          const share_comment_title = `${detail_complex}의 랭커스톡 | 입지분석은 리얼랭커스`;
          const share_comment_kakao_content = `${share_comment_title}\n\n${comment_content_original}`;
          const share_comment_content = `${share_comment_title}\n\n${comment_content_original}\n\n${shareURL}`;
          
          if (temp_email === doc[1]['email']) {
            comment_html += `
                <div class='comment_addon_button'>
                  <div></div>
                  ${blocked === 'true' ? `<div class='btn_del' style='color:#ccc'>수정</div>` : `<div class='btn_del' onClick='modify_comment_modal("${comment_id}", "${comment_content.replace(/"/g, '&quot;')}")'>수정</div>`}
                  <div class='btn_del' onClick='delete_comment_question("${comment_id}")'>삭제</div>
                  <div class='btn_del' onClick='kakaoShare("${share_comment_title}", "${share_comment_kakao_content.replace(/\n/g, '\\n')}", "${shareURL}")'><img src='./kakao_icon.png' height='20px'></div>
                  <div class='btn_del' onClick='CopyToClipboard("${share_comment_content.replace(/\n/g, '\\n')}", popMsg)'><i class='fa-regular fa-copy'></i></div>
                </div>
            `;
          } else {
            comment_html += `
                <div class='comment_addon_button'>
                  <div></div><div class='btn_del'></div><div class='btn_del'></div>
                  <div class='btn_del' onClick='kakaoShare("${share_comment_title}", "${share_comment_kakao_content.replace(/\n/g, '\\n')}", "${shareURL}")'><img src='./kakao_icon.png' height='20px'></div>
                  <div class='btn_del' onClick='CopyToClipboard("${share_comment_content.replace(/\n/g, '\\n')}", popMsg)'><i class='fa-regular fa-copy'></i></div>
                </div>
            `;
          }
          comment_html += `</div><div class='comment_reply'>`;

          if (reply_list !== undefined) {
            const reply_array = Object.entries(reply_list);
            reply_array.sort();
            
            for (let k = 0; k < reply_array.length; k++) {                 
              const replied_id = reply_array[k][0];
              const replied_showhide = reply_array[k][1]['show'];                        

              const replied_content_original = reply_array[k][1]['comment'];
              const replied_user_id = reply_array[k][1]['uid'];
              let replied_comment = replied_content_original.replaceAll("\n", "<br>");
              for (let p = 0; p < restrict_words.length; p++) {
                replied_comment = replied_comment.replaceAll(restrict_words[p], "***");
              }

              const replied_email = reply_array[k][1]['email'];
              const replied_timestamp = reply_array[k][1]['written'].toDate();
              const replied_date = `${replied_timestamp.getFullYear()}년 ${replied_timestamp.getMonth() + 1}월 ${replied_timestamp.getDate()}일`;
              const replied_time = `${replied_timestamp.getHours()}:${dateReturn(replied_timestamp.getMinutes())}`;
              const replied_likeit = reply_array[k][1]['likeit'];

              if (replied_showhide !== 'normal') {
                let restriction_text = "";
                if (replied_showhide !== 'deleted') {
                  if (replied_showhide === 'accused') restriction_text = "신고에 의해 가리기 처리된 글입니다.";
                  else if (replied_showhide === 'restricted_word') restriction_text = "부적절한 표현으로 가리기 처리된 글입니다.";
                  
                  comment_html += `
                    <div class='comment_reply_list'>
                      <div class='blank_div'></div>
                      <div>
                        <div class='comment_line1' style='padding-right: 5px; padding-bottom: 0px; border-top: 1px solid #ddd'></div>
                        <div class='comment_line2' style='padding-right: 0px; margin-right:0px; padding-top: 5px; padding-bottom: 5px'>
                          <div class='comment_content' style='text-align: center; color: #aaa'>${restriction_text}</div>
                        </div>
                      </div>
                    </div>
                  `;
                }
              } else {
                comment_html += `
                  <div class='comment_reply_list'>
                    <div class='blank_div'></div>
                    <div>
                      <div class='comment_line1' style='padding-right: 5px; padding-bottom: 0px; border-top: 1px solid #ddd'>
                        <div>by ${user_email}</div>
                        <div style='text-align:right'>${replied_date}, ${replied_time}</div>
                        <div style='text-align:right; color:#aaa; cursor:pointer' onClick='accuse_reply_modal("${comment_id}", "${replied_id}", "${user_email}", "${replied_user_id}")'>[신고하기]</div>
                      </div>
                      <div class='comment_line2' style='padding-right: 0px; margin-right:0px; padding-top: 5px; padding-bottom: 5px'>
                        <div class='comment_content' id='${comment_id}__${replied_id}'>${replied_comment}</div>
                      </div>
                      <div class='comment_line3' style='padding-right: 5px; padding-top: 0px'>
                        <div class='comment_options' id='like_${replied_id}' onClick='reply_likeit("${comment_id}", "${replied_id}", "${user_id}", ${replied_likeit})'>
                          <div><i class='fa-solid fa-heart'></i></div>
                          <div id='like_num_${replied_id}'>${replied_likeit}</div>
                        </div>
                `;
                
                if (temp_email === doc[1]['email']) {
                  comment_html += `
                        <div class='comment_addon_button'>
                          <div></div>
                          ${blocked === 'true' ? `<div><button class='btn_del' style='color:#aaa; background:#ccc'>수정</button></div>` : `<div><button class='btn_del' onClick='modify_reply_modal("${comment_id}", "${replied_id}")'>수정</button></div>`}
                          <div><button class='btn_del' onClick='delete_reply_question("${comment_id}", "${replied_id}")'>삭제</button></div>
                        </div>
                  `;
                }
                comment_html += `</div></div></div>`;
              }
            }
          }

          comment_html += `
              ${login_status ? (blocked === 'true' ? `<div class='comment_reply_box_none'>` : `<div class='comment_reply_box' onClick='reply_modal("${comment_id}")'>`) : `<div class='comment_reply_box' data-bs-toggle='modal' data-bs-target='#loginModal' onclick='showLogin()'>`}
                  <div class='blank_div'></div>
                  <div class='reply_user'>_<i class='fa-solid fa-pen'></i>&nbsp;&nbsp;${shown_email}</div>
                  <div class='reply_icon'><i class='fa-solid fa-turn-up'></i></div>
                  <div class='comment_input_reply'>댓글 남기기</div>
                </div>
              </div>
            </div>
          `;
          index += 1;
        });
      }
    } else {
      console.log("No comment");			
      $('#comment_popTitle').html(`<div><i class='fa-regular fa-comment'></i> 0개의 우리 단지 랭커스톡</div>`);		
      
      clearInterval(window.commentSampleInterval);
      window.commentSampleInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * default_comment.length);
        $('#comment_sample').html(`<div>${default_comment[randomIndex]}</div>`);
      }, 5000);

      comment_html += `
        <div>
          <div id='no_comment' style='text-align:center'>첫 번째 랭커스톡의 주인공이 되어주세요!<br>
            ${login_status 
              ? "<button id='btn_no_comment' onClick='write_comment_modal()'>첫 번째 랭커스톡 작성하기</button>" 
              : "<button id='btn_no_comment' data-bs-toggle='modal' data-bs-target='#loginModal' onclick='showLogin()'>로그인 하고 랭커스톡 쓰기</button>"}
          </div>
        </div>
      `;
    }

    $('#comment_list').html(comment_html);
    $("#blog_list_area").html(non_blog_html);

    const comment_list_height = $('#comment_list').height();
    const inHeight = window.innerHeight;
    const blog_list_height = $('#blog_list_area').height();
    const write_box_height = $('#writeBox').height();		

    if (!login_status) {
      $(".comment_input_reply").html("로그인 후 댓글을 작성할 수 있어요");
    }

    if (blocked === 'true') {
      $(".comment_input_reply").html("신고에 의해 댓글 사용이 제한되었습니다");
      $('.comment_input_reply').css('border', '1px solid #ddd');
      $(".reply_user").css('color', '#bbb');
      $(".reply_icon").css('color', '#bbb');            
      $("#writing_id").css('color', '#bbb');
      $("#comment_input_wrap_none").css('border', '1px solid #ddd');
    }

    if (isMobile) {
      $('#no_comment').css({'height': `${inHeight - blog_list_height - write_box_height - 220}px`, 'overflow-y' : 'auto'});
      $('#comment_list').css({'height': `${inHeight}px`, 'overflow-y' : 'auto'});
      $('.comment_reply_list').css({'grid-template-columns' : '0px 1fr'});
    } else {
      $('#no_comment').css({'height': `${inHeight - 160 - 50 - blog_list_height - 150}px`, 'overflow-y' : 'auto'});
      $('#comment_list').css({'height': `${inHeight - 160 - 50}px`, 'overflow-y' : 'auto'});
    }

    if (scroll_pos === 'end') {
      $('#comment_list').scrollTop($('#comment_list').prop('scrollHeight'));
    }
  }).catch((error) => {
    console.log("Error getting document:", error);
  });

  $("#commentWrapper").show();
  complex_blog(detail_searchCode, detail_complex);
}

function likeit(comment_id, user_id, like_num){
  const docRef2 = comment_db.collection("realrankus_comment").doc(selectedSubRegion);
  
  docRef2.collection(temp_uid).doc(comment_id).get().then((field) => {        
    if(field.exists){
      const like = field.data()['like'];          
      
      if(like){
        docRef2.collection(temp_uid).doc(comment_id).set({ like: false, dislike: false });
        docRef2.update({ [comment_id + ".likeit"]: firebase.firestore.FieldValue.increment(-1) });
        
        const current_like_num = $('#like_num_' + comment_id).html();                        
        $('#like_num_' + comment_id).html(Number(current_like_num) - 1);
        $('#like_' + comment_id).css({'color' : '#666'});
      } else {
        docRef2.collection(temp_uid).doc(comment_id).set({ like: true, dislike: false });
        docRef2.update({ [comment_id + ".likeit"]: firebase.firestore.FieldValue.increment(1) });
        
        const current_like_num = $('#like_num_' + comment_id).html();                        
        $('#like_num_' + comment_id).html(Number(current_like_num) + 1);
        $('#like_' + comment_id).css({'color' : '#e31939'});
      }
    } else {
      docRef2.collection(temp_uid).doc(comment_id).set({ like: true, dislike: false });
      docRef.update({ [comment_id + ".likeit"]: firebase.firestore.FieldValue.increment(1) });
      
      const current_like_num = $('#like_num_' + comment_id).html();                        
      $('#like_num_' + comment_id).html(Number(current_like_num) + 1);
      $('#like_' + comment_id).css({'color' : '#e31939'});
    }                                    
  });
}

function reply_likeit(comment_id, reply_id, user_id, like_num) {
  const docRef2 = comment_db.collection("realrankus_comment").doc(selectedSubRegion);
  
  docRef2.collection(temp_uid).doc(reply_id).get().then((field) => {        
    if (field.exists) {
      const like = field.data()['like'];
      if (like) {
        docRef2.collection(temp_uid).doc(reply_id).set({ like: false, dislike: false });
        docRef2.update({ [`${comment_id}.reply.${reply_id}.likeit`]: firebase.firestore.FieldValue.increment(-1) });
        
        const current_like_num = $('#like_num_' + reply_id).html();                        
        $('#like_num_' + reply_id).html(Number(current_like_num) - 1);
        $('#like_' + reply_id).css({'color' : '#666'});
      } else {
        docRef2.collection(temp_uid).doc(reply_id).set({ like: true, dislike: false });
        docRef2.update({ [`${comment_id}.reply.${reply_id}.likeit`]: firebase.firestore.FieldValue.increment(1) });
        
        const current_like_num = $('#like_num_' + reply_id).html();                        
        $('#like_num_' + reply_id).html(Number(current_like_num) + 1);
        $('#like_' + reply_id).css({'color' : '#e31939'});
      }
    } else {
      docRef2.collection(temp_uid).doc(reply_id).set({ like: true, dislike: false });
      docRef.update({ [`${comment_id}.reply.${reply_id}.likeit`]: firebase.firestore.FieldValue.increment(1) });
      
      const current_like_num = $('#like_num_' + reply_id).html();                        
      $('#like_num_' + reply_id).html(Number(current_like_num) + 1);
      $('#like_' + reply_id).css({'color' : '#e31939'});
    }                                    
  });
}

// 글쓰기 모달
function write_comment_modal() {
  let title_html = "<div>우리단지 랭커스톡 작성</div>";
  let comment_html = `
    <div>
      <div id='comment_write_notice'>
        <div style='font-size: 1.2em; color:#e31939; font-weight:600; text-align:center'>건강한 랭커스톡을 만들어주세요!</div>
        <div>
          <ul class='write_notice'>
            <li>다른 사람 비방, 불쾌감 유발, 욕설은 임의로 삭제됩니다.</li>              
            <li>영리 목적의 게시글은 임의로 삭제됩니다.</li>			
          </ul>
        </div>
      </div>
      <hr>
      <div class='writing_id'>_<i class='fa-solid fa-pen'></i>&nbsp;&nbsp;${shown_email}</div>
      <div><textarea id='comment_input' rows=5 warp='on' resize='none'></textarea></div>
      <div id='writing_counter'>0/1000</div>
    </div>
  `;
  let yesno_html = `
    <div><button class='btn_no' onClick='$("#commentModifyModal").modal("hide")'>취소</button></div>
    <div><button class='btn_yes' onClick='write_comment()'>등록</button></div>
  `;

  $('#commentModifyModalLabel').html(title_html);
  $('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').html(comment_html).css({'background' : '#efefef'});
  $('#commentModifyModal > .modal-dialog > .modal-content > .modal-footer').html(yesno_html).css({'grid-template-columns' : '1fr 1fr'});
  $('#comment_input').focus();
  $('#commentModifyModal').modal("show");

  let oldVal = "";
  $("#comment_input").on("propertychange change keyup paste input", function() {
    let currentVal = $(this).val();
    if (currentVal === oldVal) return;
    oldVal = currentVal;
    
    let writing_counter_html = currentVal.length > 1000 
      ? `<span style="color:red">${currentVal.length}</span>` 
      : `<span>${currentVal.length}</span>`;
    $('#writing_counter').html(writing_counter_html + "/1000");
  });
}

// ---------------------------------------------------------
// 1. 메인 랭커스톡 작성 로직
// ---------------------------------------------------------
function write_comment() {
  // [Auth Guard] 유령 로그인 차단
  if (!isAuthValid()) {
    toastr.error("안전한 서비스 이용을 위해 재로그인이 필요합니다.");
    closeModal('commentModifyModal');
    showLogin();
    return;
  }

  const now = new Date();
  const str_now = Number(now);
  const written_comment = $('#comment_input').val();
  const written_checker = written_comment.replace(/\s|\n/g, ""); // 공백 및 줄바꿈 제거 후 검사

  if (written_checker === '') {
    alert("랭커스톡 작성 후 등록해 주세요!");
    $('#comment_input').val("");
    return;
  } else if (written_comment.length > 1000) {
    alert("최대 1000글자 까지 등록할 수 있어요!");
    return;
  }

  const docData = {
    [`comment_${str_now}`]: {
      email: temp_email,
      uid: temp_uid,
      comment: written_comment,
      written: now,
      likeit: 0,
      show: "normal",
      complex_name: detail_complex,
      complex_code: detail_searchCode
    }
  };

  docRef.get().then((doc) => {
    if (doc.exists) addData(docData);
    else setData(docData);
    
    closeModal('commentModifyModal');
    $('#comment_input').val("");
  }).catch((error) => {
    console.error("Error getting document:", error);
  });
}

function addData(doc){
	console.log("ADD DATA: " , docRef)
	docRef.update(doc)
	.then((docRef) => {
		//console.log("Document written with ID: ", docRef);
		sendTelegram_message(doc)
		read_comment("top")
	})
	.catch((error) => {
		console.error("Error adding document: ", error);
	});
}

function setData(doc){
	console.log("SET DATA: " , docRef)
	docRef.set(doc)
	.then((docRef) => {
		//console.log("Document written with ID: ", docRef);
		sendTelegram_message(doc)
		read_comment("top")
	})
	.catch((error) => {
		console.error("Error adding document: ", error);
	});
}

// 대댓글 모달
function reply_modal(comment_id) {
  let title_html = "<div>댓글 작성</div>";
  let comment_html = `
    <div>
      <div id='comment_write_notice'>
        <div style='font-size: 1.2em; color:#e31939; font-weight:600; text-align:center'>건강한 랭커스톡을 만들어주세요!</div>
        <div>
          <ul class='write_notice'>
            <li>다른 사람 비방, 불쾌감 유발, 욕설은 임의로 삭제됩니다.</li>              
            <li>영리 목적의 게시글은 임의로 삭제됩니다.</li>			
          </ul>
        </div>
      </div>
      <hr>
      <div class='writing_id'>_<i class='fa-solid fa-pen'></i>&nbsp;&nbsp;${shown_email}</div>
      <div><textarea id='comment_input' rows=5 warp='on' resize='none'></textarea></div>
      <div id='writing_counter'>0/500</div>
    </div>
  `;
  let yesno_html = `
    <div><button class='btn_no' onClick='$("#commentModifyModal").modal("hide")'>취소</button></div>
    <div><button class='btn_yes' onClick='reply_comment("${comment_id}")'>등록</button></div>
  `;

  $('#commentModifyModalLabel').html(title_html);
  $('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').html(comment_html).css({'background' : '#efefef'});
  $('#commentModifyModal > .modal-dialog > .modal-content > .modal-footer').html(yesno_html).css({'grid-template-columns' : '1fr 1fr'});
  $('#comment_input').focus();
  openModal('commentModifyModal');	

  let oldVal = "";
  $("#comment_input").on("propertychange change keyup paste input", function() {
    let currentVal = $(this).val();
    if (currentVal === oldVal) return;
    oldVal = currentVal;
    
    let writing_counter_html = currentVal.length > 500 
      ? `<span style="color:red">${currentVal.length}</span>` 
      : `<span>${currentVal.length}</span>`;
    $('#writing_counter').html(writing_counter_html + "/500");
  });
}

// ---------------------------------------------------------
// 2. 대댓글(Reply) 작성 로직
// ---------------------------------------------------------
function reply_comment(comment_id) {
  // [Auth Guard] 유령 로그인 차단
  if (!isAuthValid()) {
    toastr.error("안전한 서비스 이용을 위해 재로그인이 필요합니다.");
    closeModal('commentModifyModal');
    showLogin();
    return;
  }

  const now = new Date();
  const str_now = Number(now);
  const written_comment = $('#comment_input').val();
  const written_checker = written_comment.replace(/\s|\n/g, "");

  if (written_checker === '') {
    alert("댓글 작성 후 등록해 주세요!");
    $('#comment_input').val("");
    return;
  } else if (written_comment.length > 500) {
    alert("최대 500글자 까지 등록할 수 있어요!");
    return;
  }

  const docData = {
    email: temp_email,
    uid: temp_uid,
    comment: written_comment,
    written: now,
    likeit: 0,
    show: "normal",
    complex_name: detail_complex,
    complex_code: detail_searchCode
  };

  docRef.update({
    [`${comment_id}.reply.reply_${str_now}`]: docData,
  })
  .then(() => {
    closeModal("commentModifyModal");
    sendTelegram_message(docData);
    read_comment(comment_id);
    $('#comment_input').val("");
  })
  .catch((error) => {
    console.error("Error adding document: ", error);
  });
}

// 수정 모달 (대댓글)
function modify_reply_modal(parent_id, reply_id) {
  let comment = $("#" + parent_id + "__" + reply_id).html().replaceAll("<br>", "\n");
  let title_html = "<div>우리동네 랭커스톡 댓글 수정</div>";
  let modify_html = `
    <div>
      <div class='writing_id'>_<i class='fa-solid fa-pen'></i>&nbsp;&nbsp;${shown_email}</div>
      <div><textarea id='comment_modify_input' rows=5 warp='on' resize='none'></textarea></div>
    </div>
  `;
  let yesno_html = `
    <div><button class='btn_no' onClick='$("#commentModifyModal").modal("hide")'>취소</button></div>
    <div><button class='btn_yes' onClick='modify_reply_comment("${parent_id}", "${reply_id}")'>수정</button></div>
  `;

  $('#commentModifyModalLabel').html(title_html);
  $('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').html(modify_html).css({'background' : '#efefef'});
  $('#commentModifyModal > .modal-dialog > .modal-content > .modal-footer').html(yesno_html).css({'grid-template-columns' : '1fr 1fr'});

  $('#comment_modify_input').val(comment).focus();
  $('#commentModifyModal').modal("show");
}

function modify_reply_comment(parent_id, reply_id) {
  if (!isAuthValid()) return; // 방어 로직 추가

  const updated_comment = $("#comment_modify_input").val();
  const now = new Date();

  docRef.update({
    [`${parent_id}.reply.${reply_id}.comment`]: updated_comment,
    [`${parent_id}.reply.${reply_id}.written`]: now
  })
  .then(() => {
    closeModal("commentModifyModal");
    read_comment(reply_id);
    $('#comment_input').val("");
  })
  .catch((error) => {
    console.error("Error modifying document: ", error);
  });
}

function delete_reply_question(parent_id, reply_id) {
  $('#commentModal > .modal-dialog > .modal-content> .modal-header').hide();
  $('#commentModal > .modal-dialog > .modal-content> .modal-body').css({'text-align' : 'center', 'height' : '6em', 'display':'grid', 'align-content':'center'}).html("정말 삭제할까요?");
  let yesno_html = `
    <div class='footer_button'><button class='btn_no' onClick='$("#commentModal").modal("hide")'>아니요</button></div>
    <div class='footer_button'><button class='btn_yes' onClick='delete_reply("${parent_id}", "${reply_id}")'>예</button></div>
  `;
  $('#commentModal > .modal-dialog > .modal-content> .modal-footer').html(yesno_html).css({'display':'grid', 'grid-template-columns' : '1fr 1fr', 'justify-items' :'center'});
  $('#commentModal').modal("show");
}

function delete_reply(parent_id, reply_id){
	let removeComment = docRef.update({
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

function modify_comment_modal(comment_id, comment) {
  let safe_comment = comment.replaceAll("<br>", "\n");
  let title_html = "<div>우리 단지 랭커스톡 수정</div>";
  let modify_html = `
    <div>
      <div class='writing_id'>_<i class='fa-solid fa-pen'></i>&nbsp;&nbsp;${shown_email}</div>
      <div><textarea id='comment_modify_input' rows=5 warp='on' resize='none'></textarea></div>
    </div>
  `;
  let yesno_html = `
    <div><button class='btn_no' onClick='$("#commentModifyModal").modal("hide")'>취소</button></div>
    <div><button class='btn_yes' onClick='modify_comment("${comment_id}")'>수정</button></div>
  `;

  $('#commentModifyModalLabel').html(title_html);
  $('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').html(modify_html).css({'background' : '#efefef'});
  $('#commentModifyModal > .modal-dialog > .modal-content > .modal-footer').html(yesno_html).css({'grid-template-columns' : '1fr 1fr'});

  $('#comment_modify_input').val(safe_comment).focus();
  $('#commentModifyModal').modal("show");
}

// ---------------------------------------------------------
// 3. 글 수정 로직
// ---------------------------------------------------------
function modify_comment(comment_id) {
  if (!isAuthValid()) return; // 방어 로직 추가

  const updated_comment = $("#comment_modify_input").val();
  const now = new Date();

  docRef.update({
    [`${comment_id}.comment`]: updated_comment,
    [`${comment_id}.written`]: now
  })
  .then(() => {
    closeModal("commentModifyModal");
    read_comment(comment_id);
    $('#comment_input').val("");
  })
  .catch((error) => {
    console.error("Error modifying document: ", error);
  });
}

// 삭제 확인 모달들
function delete_comment_question(comment_id) {
  $('#commentModal > .modal-dialog > .modal-content> .modal-header').hide();
  $('#commentModal > .modal-dialog > .modal-content> .modal-body').css({'text-align' : 'center', 'height' : '6em', 'display':'grid', 'align-content':'center'}).html("정말 삭제할까요?");
  let yesno_html = `
    <div class='footer_button'><button class='btn_no' onClick='$("#commentModal").modal("hide")'>아니요</button></div>
    <div class='footer_button'><button class='btn_yes' onClick='delete_comment("${comment_id}")'>예</button></div>
  `;
  $('#commentModal > .modal-dialog > .modal-content> .modal-footer').html(yesno_html).css({'display':'grid', 'grid-template-columns' : '1fr 1fr', 'justify-items' :'center'});
  $('#commentModal').modal("show");
}

function delete_comment(comment_id){
	let removeComment = docRef.update({
	[comment_id]: firebase.firestore.FieldValue.delete()
	})
	.then((docRef) => {
	$('#commentModal').modal("hide");
	read_comment("top")
	})
	.catch((error) => {
		console.error("Error adding document: ", error);
	});
}

// 신고 모달들
function accuse_modal(comment_id, user_email, comment_index, user_id) {
  let title_html = "<div>랭커스톡 신고하기</div>";
  let comment_html = `
    <div>
      <div class='writing_id'><i class='fa-solid fa-triangle-exclamation'></i>&nbsp;&nbsp;${user_email}님의 랭커스톡을 신고합니다.</div>
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
    </div>
  `;
  let yesno_html = `
    <div><button class='btn_no' onClick='$("#commentModifyModal").modal("hide")'>취소</button></div>
    <div><button class='btn_yes' onClick='accuse_comment("${comment_id}", "${user_email}", ${comment_index}, "${user_id}")'>신고</button></div>
  `;

  $('#commentModifyModalLabel').html(title_html);
  $('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').html(comment_html).css({'background' : '#efefef'});
  $('#commentModifyModal > .modal-dialog > .modal-content> .modal-footer').html(yesno_html);
  $('#commentModifyModal').modal("show");

  $("input[name='accuse']").off("change").change(function(){
    if ($("input[name='accuse']:checked").val() === "기타") {
      $('#accuse_input').prop("disabled", false).focus();
    } else {
      $('#accuse_input').prop("disabled", true);
    }
  });
}

function accuse_comment(comment_id, user_email, comment_index, user_id){
  const accuseRef = comment_db.collection("realrankus_comment").doc("accuse_list");
  const current_region = shortRegionName( $("#sido option:selected").text() + " " + $("#gungu option:selected").text() );
  const current_region_id = selectedSubRegion;
  const accuse_type = $("input[name='accuse']:checked").val();
  const accuse_comment_text = $('#accuse_input').val(); 
  const accused_comment = $('#comment_content_' + comment_index).text();

  // let으로 블록 내 변수 선언
  let written_checker = accuse_comment_text.replaceAll(" ", "").replaceAll("\n", "");
  
  if(accuse_type === "기타" && written_checker === ''){
    alert("기타 신고 이유를 작성해 주세요.");
    $('#accuse_input').val("");
    return;
  }      

  // 가장 위험했던 부분: const를 명시하여 전역 객체(window) 오염을 차단합니다.
  const now = new Date();
  const str_now = Number(now);

  const accuseData = {
    [`accuse_${str_now}`]: {              
      comment_id: comment_id,
      accuser_email : temp_email,
      accuser_uid : temp_uid,
      accused_email: user_email,
      accused_uid: user_id,
      region_name : current_region,
      region_id : current_region_id,              
      accuse_type : accuse_type,              
      accuse_reason : accuse_comment_text,
      written: now,
      accused_content: accused_comment,
      in_progress: true
    }
  };

  accuseRef.update(accuseData)
  .then(() => {
    firebase.database().ref('users_moved').child(user_id).child('status').child('accused')
    .set(firebase.database.ServerValue.increment(1));

    $('#commentModifyModal').modal("hide");
    $('#commentModal > .modal-dialog > .modal-content> .modal-header').hide();
    $('#commentModal > .modal-dialog > .modal-content> .modal-body').css({'text-align' : 'center', 'height' : '6em', 'display':'grid', 'align-content':'center'});
    
    // UI 렌더링용 변수도 let으로 스코프 제한
    let meg_html = `<div>${user_email}님의 랭커스톡이 신고되었습니다.<br>운영정책 위배 여부 확인 후, 조치 예정입니다.</div>`;
    $('#commentModal > .modal-dialog > .modal-content> .modal-body').html(meg_html);

    let confirm_html = "<div class='footer_button'><button class='btn_yes' onClick='$(\"#commentModal\").modal(\"hide\")'>확인</button></div>";
    
    $('#commentModal > .modal-dialog > .modal-content> .modal-footer').css({'grid-template-columns' : '1fr', 'justify-items' :'center'});
    $('#commentModal > .modal-dialog > .modal-content> .modal-footer').html(confirm_html);
    $('#commentModal').modal("show");
  })
  .catch((error) => {
    console.error("Error adding document: ", error);
  });
}

function accuse_reply_modal(parent_id, reply_id, user_email, user_id) {
  let title_html = "<div>랭커스톡 댓글 신고하기</div>";
  let comment_html = `
    <div>
      <div class='writing_id'><i class='fa-solid fa-triangle-exclamation'></i>&nbsp;&nbsp;${user_email}님의 랭커스톡 댓글을 신고합니다.</div>
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
    </div>
  `;
  let yesno_html = `
    <div><button class='btn_no' onClick='$("#commentModifyModal").modal("hide")'>취소</button></div>
    <div><button class='btn_yes' onClick='accuse_reply("${parent_id}", "${reply_id}", "${user_email}", "${user_id}")'>신고</button></div>
  `;

  $('#commentModifyModalLabel').html(title_html);
  $('#commentModifyModal > .modal-dialog > .modal-content > .modal-body').html(comment_html).css({'background' : '#efefef'});
  $('#commentModifyModal > .modal-dialog > .modal-content> .modal-footer').html(yesno_html);
  $('#commentModifyModal').modal("show");

  $("input[name='accuse']").off("change").change(function(){
    if ($("input[name='accuse']:checked").val() === "기타") {
      $('#accuse_input').prop("disabled", false).focus();
    } else {
      $('#accuse_input').prop("disabled", true);
    }
  });
}

function accuse_reply(parent_id, reply_id, user_email, user_id){
	const accuseRef = comment_db.collection("realrankus_comment").doc("accuse_list");
	const current_region = selectedRegion; // Region id로 수정
	const current_region_id = selectedSubRegion; // Region id로 수정
	const accuse_type = $("input[name='accuse']:checked").val();
	const accuse_comment = $('#accuse_input').val();      
	const accused_comment = $("#" + parent_id + "__" + reply_id).text();

	let written_checker = accuse_comment.replaceAll(" ", "")
	written_checker = written_checker.replaceAll("\n", "")
	
	if(accuse_type === "기타" && written_checker === ''){
	alert("기타 신고 이유를 작성해 주세요.")
	$('#accuse_input').val("")
	return
	}      

	const now = new Date()
	const str_now = Number(now)

	const accuseData = {
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
		let meg_html = "<div>" + user_email + "님의 랭커스톡이 신고되었습니다. <br> 운영정책 위배 여부 확인 후, 조치 예정입니다."
		$('#commentModal > .modal-dialog > .modal-content> .modal-body').html(meg_html)

		//yesno_html = "<div class='confirm_question'>"
		let confirm_html = "<div class='footer_button'><button class='btn_yes' onClick='$(\"#commentModal\").modal(\"hide\")'>확인</button></div>"        
		//yesno_html += "</div>"

		$('#commentModal > .modal-dialog > .modal-content> .modal-footer').css({'grid-template-columns' : '1fr', 'justify-items' :'center'})
		$('#commentModal > .modal-dialog > .modal-content> .modal-footer').html(confirm_html);
		$('#commentModal').modal("show");
	})
	.catch((error) => {
		console.error("Error adding document: ", error);
	});
}