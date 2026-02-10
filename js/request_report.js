/* Report Data Variables */
var report_text = ""
var complex_value_div = []
var complex_raw_list = []
var customer_name = ""

var req_detailMap = ""
var req_detailMarker = ""

var fav_point_x = 127.0473774
var fav_point_y = 37.51733193

var budget_cash = 0
var budget_loan = 0

var fav_point_address = ""

var movingMethod = 'public'

var priority_living = 100
var priority_trans = 100
var priority_infra = 100
var priority_edu = 100

var wanted_region = [["Seoul","1168000000_Seoul_Gangnam"]]
var wanted_region_str = ["서울시 강남구"]

var report_banner_text = [
  "나의 소득과 예산에 딱 맞는 단지, 맞춤형 리포트로 확인하세요.",
  "내 생애주기를 분석해 최적의 아파트를 추천하는 1:1 전용 보고서",
  "\"현금 8억, 대출 4억\" 내 자금 상황에서 갈 수 있는 최선의 단지는?",
  "나를 위한, 나에게만 최적화된 단지 추천 리스트를 받아보세요",
  "가족 구성과 연소득을 분석해 도출한 우리 가족 최적의 입지 분석",
  "남들의 추천 말고, 당신의 라이프스타일에 맞춘 아파트 추천 리포트",
  "커리어 상승기, 당신의 생애주기에 최적화된 단지를 골라드립니다",
  "예산 12억 원으로 매수 가능한 '최고 등급 단지', 리포트로 정리해 드립니다",
  "주거·교통·인프라·교육, 당신의 중심에 맞춘 단지 추천 리포트",
  "내가 원하는 지역에서 예산에 딱 맞는 아파트 10곳을 추천해 드립니다",
  "단순 순위가 아닌, 당신의 예산을 반영한 '예상 도달 가격' 분석 리포트",
  "2,000세대 대단지부터 초품아까지, 당신의 조건으로 필터링한 결과 보고서",
  "당신의 정보를 데이터 파이프라인으로 분석한 정밀 단지 추천 리포트",
  "\"어디 살아야 할까?\" 고민된다면, 당신의 상황을 반영한 리포트를 발행해 보세요",
  "당신의 예산과 생애주기에 맞는 단지만 추천하는 리포트",
  "리얼랭커스 AI가 당신의 데이터를 분석해 작성한 1:1 주거 전략 보고서",
  "내 집 마련의 막막함, 내 조건을 반영한 맞춤형 보고서로 해결하세요",
  "가용 예산 내에서 누릴 수 있는 최고의 입지를 리포트로 제안합니다",
  "지금 내 상황에 맞는 '아파트 추천 리포트' 발행하기",
  "나만의 조건 입력하고 1:1 맞춤형 단지 분석 보고서 받기",
  "당신만을 위한 '리얼랭커스 추천 보고서'를 지금 바로 확인해 보세요",
  "복잡한 부동산 고민, 당신의 정보를 반영한 단 한 권의 리포트로 끝내세요",
  "내 가족의 미래를 위한 현명한 선택, 맞춤형 추천 리포트로 확인하세요",
  "내 예산에 맞는 최고 등급 단지 추천 리포트",
  "당신의 정보를 분석한 1:1 아파트 보고서",
  "상황 맞춤형 단지 큐레이션 리포트 서비스",
  "예산과 생애주기에 최적화된 아파트 보고서",  
]

var age_description = [
  "사회초년, 결혼준비",
  "신혼, 자녀출산",
  "커리어상승, 자녀양육",
  "커리어최고, 자녀학령",
  "관리/임원급, 자녀성년",
  "커리어하강/은퇴, 자녀독립",
  "노후, 후대양성",
]
/* Report Data Variables End*/

var report_banner_html = ""
function reportBannerHtml(){
  var short_region_name = $("#gungu option:selected").text();
  //short_region_name이 2 단어 이상인 경우, 마지막 단어만 추출
  if(short_region_name.indexOf(" ") != -1){
    var name_parts = short_region_name.split(" ");
    short_region_name = name_parts[name_parts.length - 1];
  }

  //random_banner_text = report_banner_text[Math.floor(Math.random() * report_banner_text.length)]
  random_banner_text = short_region_name + "에서 처음 집 살 때 실패하지 않는 기준, 리얼 리포트 (29,900원)"
  random_banner_text_map = random_banner_text

  if(isMobile && random_banner_text.length > 30){
    //random_banner_text를 두 줄로 나누기
    var mid_index = Math.floor(random_banner_text.length / 2)
    var split_index = random_banner_text.indexOf(" ", mid_index)
    if(split_index == -1){
      split_index = mid_index
    }
    random_banner_text = random_banner_text.substring(0, split_index) + "<br/>" + random_banner_text.substring(split_index + 1)
  }

  report_banner_html = `
  <div class="report_banner" onClick="openReportRequestModal()">
      ${random_banner_text}
  </div>
  `

  if(isMobile && random_banner_text_map.length > 18){
    //random_banner_text를 두 줄로 나누기
    random_banner_text_map = random_banner_text_map.replace(" (29,900원)", "")
    var mid_index = Math.floor(random_banner_text_map.length / 2)
    var split_index = random_banner_text_map.indexOf(" ", mid_index)
    if(split_index == -1){
      split_index = mid_index
    }
    random_banner_text_map = random_banner_text_map.substring(0, split_index) + "<br/>" + random_banner_text_map.substring(split_index + 1)
  }  

  $("#map_banner").html(random_banner_text_map)
}

function requestReportModal(){
  reportBannerHtml()
  //console.log("requestReport called")
  var request_html = `
  <div id="reqReportBox">
          <div id="req_step0">
            <div class="req_stepInfo">① 고객 정보</div>
            <div class='req_description'>고객님의 부동산 맞춤 리포트를 작성하기 위해 아래 정보를 입력해 주세요.
            <br/> 고객님의 이름은 리포트 발행 전, 입금 계좌 일치 여부 확인에 사용되며, 이메일 주소는 발행되는 리포트를 받는 데 사용됩니다.
            <br/> 리포트 발행 비용은 29,900원이며, 입금 확인 후 24시간 이내에 리포트가 발행되어 이메일로 전송됩니다.
            </div>
            <div class="req_customer_input">
              <div class="req_step1Title">고객이름</div>
              <div id="div_customer_name"><input class='req_text_input' id='customer_name' type="text" placeholder=""></div>
              <div></div>
            </div>

            <div class="req_customer_input">              
              <div class="req_step1Title">이메일</div>              
              <div style='display:flex;'><input class='req_text_input' id='customer_email' type="text" placeholder="" style='text-align:left;'></input>@</div>
              <div>
                <select class='req_gungu' id="customer_email_domain" onChange="changeEmailDomain(this.value)">
                  <option value='naver'>naver.com</option>
                  <option value='gmail' selected>gmail.com</option>
                  <option value='daum'>daum.net</option>
                  <option value='hanmail'>hanmail.net</option>
                  <option value='nate'>nate.com</option>
                  <option value='custom'>직접 입력</option>
                </select>
              </div>
            </div>
            <div class="req_customer_input" id="customer_email_domain_input" style="display:none;">              
              <div> </div>              
              <div> </div>
              <div>
                <input class='req_text_input' id='customer_email_domain_custom' type="text" style="text-align:left;" placeholder="abc.com"></input>
              </div>              
            </div>

            <div class="req_customer_input">
              <div class="req_step1Title">고객연령</div>
              <div>
                <select class='req_gungu' id="customer_age" onChange="changeAge(this.value)">
                  <option value=0>20~26세</option>
                  <option value=1>27~32세</option>
                  <option value=2 selected>33~40세</option>
                  <option value=3>41~50세</option>
                  <option value=4>51~60세</option>
                  <option value=5>61~70세</option>
                  <option value=6>71세~</option>
                </select>
              </div>
              <div id="req_ageDescription"></div>
            </div>

            <div class="req_customer_input">
              <div class="req_step1Title">가족구성</div>
              <div id="div_customer_family">
                <select class='req_gungu' id="customer_family" onChange="changeFamily(this.value)">
                  <option value=1>1인</option>
                  <option value=2>2인</option>
                  <option value=3 selected>3인</option>
                  <option value=4>4인</option>
                  <option value=5>5인</option>
                  <option value=6>6인 이상</option>
                </select>
              </div>
            </div>

            <div class="req_customer_input">
              <div class="req_step1Title">자녀구성</div>
              <div>
                <select class='req_gungu' id="customer_children" onChange="">                
                  <option value=0>없음</option>
                  <option value=1 selected>1자녀</option>
                  <option value=2>2자녀</option>
                  <option value=3>3자녀</option>
                  <option value=4>4자녀 이상</option>                
                </select>
              </div>
              <div>
                <select class='req_gungu' id="customer_children_type" onChange="">
                  <option value=0>---</option>
                  <option value=1 selected>미성년</option>
                  <option value=2>성년</option>
                  <option value=3>미성년 + 성년</option>
                </select>
              </div>
            </div>

            <div class="req_customer_input">
              <div class="req_step1Title">가족연소득</div>
              <div id="div_customer_income">
                <select class='req_gungu' id="customer_income" onChange="">
                  <option value='income_00'>2,000만원 이하</option>
                  <option value='income_01'>2,001만원 ~ 3,000만원</option>
                  <option value='income_02'>3,001만원 ~ 5,000만원</option>
                  <option value='income_03'>5,001만원 ~ 8,000만원</option>
                  <option value='income_04'>8,001만원 ~ 9,999만원</option>
                  <option value='income_05' selected>1.00억원 ~ 1.50억원</option>
                  <option value='income_06'>1.51억원 ~ 3.00억원</option>
                  <option value='income_07'>3.01억원 ~ 5.00억원</option>
                  <option value='income_08'>5.01억원 ~ 10.0억원</option>
                  <option value='income_09'>10.1억원 ~ 30.0억원</option>
                  <option value='income_10'>30.1억원 ~ 50.0억원</option>
                  <option value='income_11'>50.1억원 ~</option>
                </select>
              </div>
            </div>            
          </div>
          
          <div id="req_step1">
            <div class="req_stepInfo">② 예산 설정</div>
            <div class='req_description'>
            '사용 가능 예산'은 고객님이 실제로 사용할 수 있는 예산을 의미하고, '대출 가능 금액'은 고객님이 대출을 통해 추가로 사용할 수 있는 금액을 의미합니다.            
            예를 들어, 고객님의 사용 가능 예산이 3억원이고, 대출 가능 금액이 2억원인 경우, 총 5억원의 예산으로 부동산이 추천됩니다.
            </div>
            <div id="req_step1Content">
              <div class="req_budget_input">
                <div class="req_step1Title">사용 가능 예산</div>
                <div><input class='req_number_input' id='budget_cash' type="text" placeholder="0" oninput="changeNumberFormat(1, this)" onfocus="numInputFocusBlur(1, 'focus')" onblur="numInputFocusBlur(1, 'blur')"/></div>
                <div class='req_number_input_sub' id='req_number_input_won1'>원</div>
                <div id="req_budget_kor1">0 원</div>
              </div>

              <div class="req_budget_input">
                <div class="req_step1Title">대출 가능 금액</div>
                <div><input class='req_number_input' id='budget_loan' type="text" placeholder="0" oninput="changeNumberFormat(2, this)" onfocus="numInputFocusBlur(2, 'focus')" onblur="numInputFocusBlur(2, 'blur')"/></div>
                <div class='req_number_input_sub' id='req_number_input_won2'>원</div>
                <div id="req_budget_kor2">0 원</div>
              </div>
            </div>
          </div>

          <div id="req_step2">
            <div class="req_stepInfo">③ 자주 가는 위치</div>
            <div class='req_description'>
            먼저 "대중교통이동" 또는 "자차이동" 중 하나는 선택한 뒤, 아래 지도에서  자주 가는 위치를 설정해 주세요.
            자주 가는 위치는 일반적으로 직장의 위치를 의미하며, 설정된 위치를 기준으로 선택된 대중교통 또는 자차로의 이동 시간을 고려한 단지가 추천됩니다.            
            </div>
            <div id="req_movingMethod">
              <div><input type="radio" class="btn-check" name="btnTransport" autocomplete="off" id="movingPublic" onchange="changeMovingMethod('public')" checked/><label class="btn btn-outline-danger" for="movingPublic">대중교통이동</label></div>
              <div><input type="radio" class="btn-check" name="btnTransport" autocomplete="off" id="movingDriving" onchange="changeMovingMethod('driving')"/><label class="btn btn-outline-danger" for="movingDriving">자차이동</label></div>                
            </div>
            <div id="req_map_search">
              <div><i class="fa-solid fa-magnifying-glass"></i></div>
              <div><input type='text' id ='req_input_search' onkeyup="searchFindKey(event)"></div>
              <div id="req_input_del_all" onclick="$('#req_input_search').val('')"><i class="fa-solid fa-circle-xmark"></i></div>
              <div><button id='req_run_search' onclick="searchAndMove()">지도이동</button></div>
            </div>
            <div id="req_map"></div>
          </div>

          <div id="req_step3">
            <div class="req_stepInfo">④ 원하는 지역</div>
            <div class='req_description'>
            고객님께서 선호하는 지역을 군구 단위로 최대 4곳까지 선택해 주세요. 선택된 지역에서 예산 내의 단지가 우선적으로 추천됩니다.
            </div>
            <div id="req_fav_regions">
              <div class="req_fav_region" id="req_fav_region1">
                <div><select class='req_sido' id="req_sido1" onChange="req_sidoChange(1)"></select></div>
                <div><select class='req_gungu' id="req_gungu1" onChange="req_gunguChange(1)"></select></div>
                <div></div>
              </div>

              <div id="req_add_region2"><button class='req_add_region' id="req_add_region2" onclick="req_regionOn(2)">+ 지역추가</button></div>

              <div class="req_fav_region" id="req_fav_region2">
                <div><select class='req_sido' id="req_sido2" onChange="req_sidoChange(2)"></select></div>
                <div><select class='req_gungu' id="req_gungu2" onChange="req_gunguChange(2)"></select></div>
                <div class="req_fav_remove" id='req_fav_remove2' onclick="req_regionOff(2)"><i class="fa-solid fa-circle-minus"></i></div>
              </div>

              <div id="req_add_region3"><button class='req_add_region' id="req_add_region3" onclick="req_regionOn(3)">+ 지역추가</button></div>

              <div class="req_fav_region" id="req_fav_region3">
                <div><select class='req_sido' id="req_sido3" onChange="req_sidoChange(3)"></select></div>
                <div><select class='req_gungu' id="req_gungu3" onChange="req_gunguChange(3)"></select></div>
                <div class="req_fav_remove" id='req_fav_remove3' onclick="req_regionOff(3)"><i class="fa-solid fa-circle-minus"></i></div>
              </div>

              <div id="req_add_region4"><button class='req_add_region' id="req_add_region4" onclick="req_regionOn(4)">+ 지역추가</button></div>

              <div class="req_fav_region" id="req_fav_region4">
                <div><select class='req_sido' id="req_sido4" onChange="req_sidoChange(4)"></select></div>
                <div><select class='req_gungu' id="req_gungu4" onChange="req_gunguChange(4)"></select></div>
                <div class="req_fav_remove" id='req_fav_remove4' onclick="req_regionOff(4)"><i class="fa-solid fa-circle-minus"></i></div>
              </div>
            </div>
          </div>

          <div id="req_step4">
            <div class="req_stepInfo">⑤ 중요도 선정</div>
            <div class='req_description'>
            고객님께서 중요하게 생각하시는 항목들의 우선순위를 설정해 주세요. 각 항목의 중요도에 따라 단지 추천 시 반영됩니다.            
            단, 모든 항목의 중요도를 동일하게 설정할 경우, 균형 잡힌 단지 추천이 이루어집니다.
            </div>
            <div id="req_step4Content">
              <div class='req_priority_range'>
                <div><label for="range_living" class="form-label">주거</label></div>
                <div><input type="range" class="form-range" min="0" max="100" step="5" id="range_living" value="100" oninput="update_range_val('Living', this)"></div>
                <div class='req_range_val' id="range_living_val">100</div>
              </div>

              <div class='req_priority_range'>
                <div><label for="range_trans" class="form-label">교통</label></div>
                <div><input type="range" class="form-range" min="0" max="100" step="5" id="range_trans" value="100" oninput="update_range_val('Trans', this)"></div>
                <div class='req_range_val' id="range_trans_val">100</div>
              </div>

              <div class='req_priority_range'>
                <div><label for="range_infra" class="form-label">인프라</label></div>
                <div><input type="range" class="form-range" min="0" max="100" step="5" id="range_infra" value="100" oninput="update_range_val('Infra', this)"></div>
                <div class='req_range_val' id="range_infra_val">100</div>
              </div>
              <div class='req_priority_range'>
                <div><label for="range_edu" class="form-label">교육</label></div>
                <div><input type="range" class="form-range" min="0" max="100" step="5" id="range_edu" value="100" oninput="update_range_val('Edu', this)"></div>
                <div class='req_range_val' id="range_edu_val">100</div>
              </div>

            </div>
          </div>          
        </div>
  `

  var request_modal_html = `
  <div class="modal fade" id="requestReportModal" tabindex="-1" aria-labelledby="requestReportModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-md modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content" id="requestReportModalContent">
        <div class="modal-header" id="requestReportModalHeader">
          <div>
            <h5 class="modal-title" id="requestReportModalLabel">리얼리포트 요청</h5>
            <div id='reportSample' onClick='openOuterLink("https://drive.google.com/file/d/1I3Ld69J1p9iVTZEtfoqr-E7Xwo7D63fh/view?usp=sharing")'><a href="#">샘플보기: 홍길동님을 위한 리얼랭커스 추천 보고서.pdf</a></div>
          </div>
          <div style="text-align:center;">
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
        </div>
        <div class="modal-body" id="requestReportModalBody">
          ` + request_html + `
        </div> 
        <div class="modal-footer" id="requestReportModalFooter">
          <div class="generate"><button id="req_btn_temp_save" onclick="reportTempSave()">임시저장</button></div>
          <div class="generate"><button id="req_btn_temp_load" onclick="reportTempLoad()">임시저장 불러오기</button></div>
          <div class="generate"><button id="req_btn_generate" onclick="resultConfirm()">요청 정보 확인</button></div>
        </div>
      </div>

      <div class="modal-content" id="requestReportConfirmModalContent">
        <div class="modal-header" id="requestReportFinalConfirmModalHeader">
          <h5 class="modal-title" id="requestReportFinalConfirmModalLabel" onClick="reportBack()"><i class="fa-solid fa-angle-left"></i> 리얼리포트 요청 정보 확인</h5>
          <div style="text-align:center;">
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
        </div>
        <div class="modal-body" id="requestReportFinalConfirmModalBody"></div> 
        <div class="modal-footer" id="requestReportFinalConfirmModalFooter">
        <div class='req_description_notice' style="text-align:left; font-size: 1em; font-weight:600;">
          <ul>
            <li onClick="CopyToClipboard('신협 137015668232', '계좌번호가 복사되었습니다.')">계좌번호 : 신협 137-015-668232 <span style='color:#aaa'>[복사하기]</span></li>
            <li>예금주 : 원ㅇ정</li>
            <li>가격 : 29,900원</li>            
          </ul>
        </div>

        <div class='req_description_notice' style="text-align:left; font-size: 1em; font-weight:600;">
          <div id="req_receipt_request">
            <ul> <li>현금영수증</li> </ul>
            <div id="req_receipt_option">            
              <div><input class="form-check-input" type="radio" name="btnReceipt" autocomplete="off" id="receiptNo" value="no" onChange="receiptOptionChanged()" checked><label for="receiptNo"> 미발행</label></div>
              <div><input class="form-check-input" type="radio" name="btnReceipt" autocomplete="off" id="receiptYes" value="yes" onChange="receiptOptionChanged()"/><label for="receiptYes"> 발행 (</label>
              휴대폰번호 : 
              <input id='receipt_phone' type="tel" placeholder="01012345678" disabled> )</div>            
            </div>
          </div>
        </div>
        <div style='display:grid; grid-template-columns:1fr 3fr 1fr; column-gap:10px; padding-top:10px;'>          
          <div class="generate"><button id="req_btn_final_cancel" onClick="reportBack()"><i class="fa-solid fa-angle-left"></i> 이전</button></div>          
          <div class="generate"><button id="req_btn_final_confirm" onclick="submitReportRequest()">리포트 요청하기</button></div>
          <div class="generate"><button id="req_btn_final_cancel" data-bs-dismiss="modal">닫기</button></div>
        </div>
      </div>

    </div>
  </div>
  `
  $("body").append(request_modal_html)  
  $("#requestReportConfirmModalContent").hide()

  req_showMap(37.51733193, 127.0473774)
  var req_option = "";
  for (i = 1; i < regions.length; i++) {
    req_option += "<option value='" + regions[i][1] + "'>" + regions[i][0] + "</option>";
  }
  $("#req_sido1").html(req_option);
  $("#req_sido2").html(req_option);
  $("#req_sido3").html(req_option);
  $("#req_sido4").html(req_option);

  start_num = 0
  if(currentMenu == "aptrank_price"){
     start_num = 1
  }

  var req_subOption = ""
  for (var i = start_num; i < inSeoul.length; i++) {
    req_subOption += "<option value='" + inSeoul[i][1] + "'>" + inSeoul[i][0] + "</option>";    
  }
  $("#req_gungu1").html(req_subOption);
  $("#req_gungu2").html(req_subOption);
  $("#req_gungu3").html(req_subOption);
  $("#req_gungu4").html(req_subOption);

  $("#req_add_region3").hide()
  $("#req_add_region4").hide()
  $("#req_fav_region2").hide()
  $("#req_fav_region3").hide()
  $("#req_fav_region4").hide()

  $("#req_fav_remove2").hide()
  $("#req_fav_remove3").hide()
  $("#req_fav_remove4").hide()

  changeAge( $("#customer_age option:selected").val() )

  /* Request Report Init End */

  //report_banner의 텍스트 5초 간격으로 텍스트만 변경
  /*
  setInterval(function(){
    random_banner_text = report_banner_text[Math.floor(Math.random() * report_banner_text.length)]
    $(".report_banner").html(random_banner_text)    
  },5000);
  */

  $("#requestReportFinalConfirmModalFooter").css({"background-color":"#ddd", "border-top":"1px solid #aaa"})

  if(isMobile){
    $("#mobile_map_list").css({"bottom":"120px"})
    $("#map_banner2").hide()
    $("#map_banner").css({"bottom":"60px", "font-size":"0.8em", "padding-left":"5px", "padding-right":"5px"})

    $(".req_description").css({"font-size":"0.75em"})
    $("#req_description_notice").css({"font-size":"0.75em"})

    $("#reportSample").css({"font-size":"0.8em"})

    $("#req_step0, #req_step1, #req_step2, #req_step3, #req_step4").css({"padding-left":"10px", "padding-right":"10px"})
    $(".req_customer_input, .req_budget_input").css({"grid-template-columns":"70px 1fr 1fr", "column-gap":"5px"})
    $("#req_step0 > div:nth-child(6)").css({"grid-template-columns":"70px 0.6fr 1fr", "column-gap":"10px"})
    $("#div_customer_name, #div_customer_family, #div_customer_income").css({"grid-column":"2/4"})    

    $("#req_step1Content").css({"grid-template-columns":"1fr", "row-gap":"10px"})
    $(".req_budget_input").css({"grid-template-columns":"100px 1fr"})
    $("#req_map").css({"width":"none"})

    $("#req_fav_regions").css({"grid-template-columns":"1fr", "row-gap":"10px"})
    $(".req_fav_region").css({"grid-template-columns":"120px 1fr auto", "column-gap":"5px"})

    $("#req_receipt_option").css({"grid-template-columns":"1fr", "row-gap":"5px"})

    $("#requestReportModalFooter").css({"font-size":"0.85em"})
    $("#req_btn_temp_load").text("불러오기")
  }
}

function confirmReportModal(){  
  var confirm_modal_html = `
  <div class="modal fade" id="requestReportFinalConfirmModal" tabindex="-1" aria-labelledby="requestReportFinalConfirmModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-md modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header" id="requestReportFinalConfirmModalHeader">
          <h5 class="modal-title" id="requestReportFinalConfirmModalLabel">리얼리포트 요청 정보 확인</h5>
          <div style="text-align:center;">
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
        </div>
        <div class="modal-body" id="requestReportFinalConfirmModalBody"></div> 
        <div class="modal-footer" style='display:grid; grid-template-columns:1fr;'>
        <div class='req_description_notice' style="text-align:left; font-size: 1em; font-weight:600;">
          <ul>
            <li onClick="CopyToClipboard('신협 123-456-789', '계좌번호가 복사되었습니다.')">계좌번호 : 신협 123-456-789 <span style='color:#aaa'>[복사하기]</span></li>
            <li>예금주 : 홍길동</li>
            <li>가격 : 29,900원</li>
          </ul>
        </div>
        <div style='display:grid; grid-template-columns:1fr 3fr; column-gap:10px;'>          
          <div class="generate"><button id="req_btn_final_cancel" data-bs-dismiss="modal">닫기</button></div>
          <div class="generate"><button id="req_btn_final_confirm" onclick="submitReportRequest()">리포트 요청하기</button></div>
        </div>
      </div>
    </div>
  </div>  
  `
  $("body").append(confirm_modal_html)  
}

function changeAge(val){
  //console.log("changeAge called : " + val)
  $("#req_ageDescription").html(age_description[val])
}

function changeFamily(val){
  //console.log("changeFamily called : " + val)
  if(val == 1){
    $("#customer_children option[value = 0]").prop('selected', true)
    $("#customer_children_type option[value = 0]").prop('selected', true)
    $("#customer_children").prop('disabled', true)
    $("#customer_children_type").prop('disabled', true)
  }
  else{
    $("#customer_children").prop('disabled', false)
    $("#customer_children_type").prop('disabled', false)
  }
}

function update_range_val(category, obj){      
  if(category == "Living"){
    $("#range_living_val").html(obj.value)
    priority_living = obj.value
  }
  if(category == "Trans"){
    $("#range_trans_val").html(obj.value)
    priority_trans = obj.value
  }
  if(category == "Infra"){
    $("#range_infra_val").html(obj.value)
    priority_infra = obj.value
  }
  if(category == "Edu"){
    $("#range_edu_val").html(obj.value)
    priority_edu = obj.value
  }
}

function receiptOptionChanged(){
  if($("#receiptYes").is(":checked")){
    $("#receipt_phone").prop('disabled', false)
  }
  else{
    $("#receipt_phone").prop('disabled', true)
  }
}


function changeNumberFormat(index, obj){      
  obj.value = obj.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');      
  if(obj.value > 999999999999){
    obj.value = 999999999999
  }
  pureNum = obj.value
  formattedNum = Number(obj.value).toLocaleString('ko-KR')
  obj.value = formattedNum

  $("#req_budget_kor" + index).html(numberToKorean(pureNum) + "  원")

  if(index == 1){
    budget_cash = pureNum
  }
  if(index == 2){
    budget_loan = pureNum
  }
}

function numInputFocusBlur(num, status){
  if(status == 'focus'){
    $("#req_number_input_won" + num).css("border-bottom", "1px solid #0820a8")
  }
  if(status == 'blur'){
    $("#req_number_input_won" + num).css("border-bottom", "1px solid #aaa")
  }
}

function req_regionOn(index){
  //console.log("regionOn called : " + index)
  $("#req_fav_remove2").hide()
  $("#req_fav_remove3").hide()
  $("#req_fav_remove4").hide()      

  $("#req_add_region" + index).hide()
  $("#req_fav_region" + index).show()
  $("#req_fav_remove" + index).show()
  if(index < 5){
    $("#req_add_region" + (index+1)).show()
  }

  wanted_region[index-1] = [$("#req_sido" + index + " option:selected").val(), $("#req_gungu" + index + " option:selected").val()]
  wanted_region_str[index-1] = $("#req_sido" + index + " option:selected").text() + " " + $("#req_gungu" + index + " option:selected").text()
}
function req_regionOff(index){
  $("#req_fav_remove2").hide()
  $("#req_fav_remove3").hide()
  $("#req_fav_remove4").hide() 

  $("#req_add_region" + (index)).show()
  $("#req_add_region" + (index+1)).hide()

  $("#req_fav_remove" + (index-1)).show()
  $("#req_fav_region" + (index)).hide()

  wanted_region.splice(index-1, 1);
  wanted_region_str.splice(index-1, 1);
}

function req_showMap(coord_y, coord_x){
  dh = 300

  //현재 브라우저 창 너비 구하기  
  var window_width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  
  if(isMobile){
    dw = window_width - 60
  }
  else{
    dw = dh * 7.2 / 3
  }
  
  var req_detailMapOptions = {
      center: new naver.maps.LatLng(Number(coord_y), Number(coord_x)),
      size: new naver.maps.Size(dw, 300),
      zoom: 16, //지도의 초기 줌 레벨
      zoomControl: true, //줌 컨트롤의 표시 여부
      draggable: true,
      pinchZoom: true,
      scrollWheel: true,
      keyboardShortcuts: true,
      disableDoubleTapZoom: false,
      disableDoubleClickZoom: false,
      disableTwoFingerTapZoom: false,
      tileTransition: true,
    };

    req_detailMap = new naver.maps.Map("req_map", req_detailMapOptions);
    req_detailMarker = new naver.maps.Marker({
      position: new naver.maps.LatLng(Number(coord_y), Number(coord_x)),
      map: req_detailMap,
      title: 'urlMarker',
      //animation: naver.maps.Animation.BOUNCE
    });

    naver.maps.Event.addListener(req_detailMap, 'click', function(e) {
        req_detailMarker.setPosition(e.coord);
        fav_point_x = e.coord.x
        fav_point_y = e.coord.y
    });
}

function searchAndMove(){
  input_text = $("#req_input_search").val()
  if(input_text == ""){
    return
  }
  $.ajax({
    type : "GET",
    headers : {
      "Authorization" : "KakaoAK a9beb4e1299d7fac7e38fdecb8f8038e",
    },
    url : "https://dapi.kakao.com/v2/local/search/keyword.json?query=" + input_text,
    async : false,
    success : function(response) {
      if(response['documents'].length == 0){
        $("#req_input_search").val("")
        alert("검색 결과가 없어요!")
        return
      }
      //console.log(response['documents'][0])
      map_x = response['documents'][0]['x']
      map_y = response['documents'][0]['y']
      address = response['documents'][0]['address_name']
      new_center = new naver.maps.LatLng(map_y, map_x)      

      fav_point_x = map_x
      fav_point_y = map_y
      fav_point_address = address

      req_detailMap.setCenter(new_center);
      req_detailMarker.setPosition(new_center);
      $("#req_input_search").val("")
    }
  }) 
}

function getAddress_by_kakao(map_x, map_y){
  //console.log("getAddress_by_kakao called : ", map_x, map_y)
  $.ajax({
    type : "GET",
    headers : {
      "Authorization" : "KakaoAK a9beb4e1299d7fac7e38fdecb8f8038e",
    },
    url : "https://dapi.kakao.com/v2/local/geo/coord2address.json",
    data: {
      x: map_x, // 경도
      y: map_y  // 위도
    },
    async : false,
    success: function (response) {
      if (response.documents.length === 0) {
        alert("주소를 찾을 수 없어요!");
        return;
      }

      const doc = response.documents[0];

      // 도로명 주소 우선, 없으면 지번
      const address = doc.road_address
        ? doc.road_address.address_name
        : doc.address.address_name;

      //console.log("주소:", address);

      // 기존 변수 활용 가능
      fav_point_address = address;

      $("#req_input_search").val(address);
      //return address;
    },
    error: function (err) {
      console.error("주소 변환 실패", err);
    }
  }); 
}

function searchFindKey(e){
  if(e.keyCode == 13){
    searchAndMove()
  }
}

function req_gunguChange(index) {
  wanted_region[index-1] = [$("#req_sido" + index + " option:selected").val(), $("#req_gungu" + index + " option:selected").val()]
  wanted_region_str[index-1] = $("#req_sido" + index + " option:selected").text() + " " + $("#req_gungu" + index + " option:selected").text()
}

function req_sidoChange(index) {
  req_optionChange(index);
}

function req_optionChange(index) {      
  req_regionName = $("#req_sido" + index + " option:selected").val();
  req_selectedRegion = req_regionName;
  var req_changeItem;
  if (req_regionName == "Korea") {
    req_changeItem = inKorea;
  }
  if (req_regionName == "Seoul") {
    req_changeItem = inSeoul;
  }
  if (req_regionName == "Busan") {
    req_changeItem = inBusan;
  }
  if (req_regionName == "Incheon") {
    req_changeItem = inIncheon;
  }
  if (req_regionName == "Daegu") {
    req_changeItem = inDaegu;
  }
  if (req_regionName == "Gwangju") {
    req_changeItem = inGwangju;
  }
  if (req_regionName == "Daejeon") {
    req_changeItem = inDaejeon;
  }
  if (req_regionName == "Ulsan") {
    req_changeItem = inUlsan;
  }
  if (req_regionName == "Sejong") {
    req_changeItem = inSejong;
  }
  if (req_regionName == "Gyeonggi") {
    req_changeItem = inGyeonggi;
  }
  if (req_regionName == "Gangwondo") {
    req_changeItem = inNewGangwondo;
  }
  if (req_regionName == "Chungcheongbukdo") {
    req_changeItem = inChungcheongbukdo;
  }
  if (req_regionName == "Chungcheongnamdo") {
    req_changeItem = inChungcheongnamdo;
  }
  if (req_regionName == "Jeollabukdo") {
    req_changeItem = inJeollabukdo;
  }
  if (req_regionName == "Jeollanamdo") {
    req_changeItem = inJeollanamdo;
  }
  if (req_regionName == "Gyeongsangbukdo") {
    req_changeItem = inGyeongsangbukdo;
  }
  if (req_regionName == "Gyeongsangnamdo") {
    req_changeItem = inGyeongsangnamdo;
  }
  if (req_regionName == "Jejudo") {
    req_changeItem = inJejudo;
  }
  $("#req_gungu" + index).empty();

  start_num = 0
  if(currentMenu == "aptrank_price"){
     start_num = 1
  }

  for (var i = start_num; i < req_changeItem.length; i++) {
    var subOption = $("<option value='" + req_changeItem[i][1] + "'>" + req_changeItem[i][0] + "</option>" );    
    $("#req_gungu" + index).append(subOption);
  }

  wanted_region[index-1] = [$("#req_sido" + index + " option:selected").val(), $("#req_gungu" + index + " option:selected").val()]
  wanted_region_str[index-1] = $("#req_sido" + index + " option:selected").text() + " " + $("#req_gungu" + index + " option:selected").text()
}

function changeMovingMethod(type){
  movingMethod = type
}

var report_obj = {}

function resultConfirm(){
  getAddress_by_kakao(fav_point_x, fav_point_y)

  confirmed_name_val = $("#customer_name").val()
  confirmed_email_val = $("#customer_email").val()

  confirmed_domain_val = $("#customer_email_domain option:selected").val()
  confirmed_domain_txt = $("#customer_email_domain option:selected").text()
  confirmed_domain_idx = $("#customer_email_domain option:selected").index()
  
  if(confirmed_domain_idx == 5){ //직접입력일 경우
    confirmed_email_custom_domain_val = $("#customer_email_domain_custom").val()
  }
  else{
    confirmed_email_custom_domain_val = ""
  }

  confirmed_email_full = confirmed_email_val + "@" + (confirmed_email_custom_domain_val == "" ? confirmed_domain_txt : confirmed_email_custom_domain_val)
 
  confirmed_age_val = $("#customer_age option:selected").val()
  confirmed_age_txt = $("#customer_age option:selected").text()
  confirmed_age_idx = $("#customer_age option:selected").index()
  
  confirmed_family_val = $("#customer_family option:selected").val()
  confirmed_family_txt = $("#customer_family option:selected").text()
  confirmed_family_idx = $("#customer_family option:selected").index()

  confirmed_children_val = $("#customer_children option:selected").val()
  confirmed_children_txt = $("#customer_children option:selected").text()
  confirmed_children_idx = $("#customer_children option:selected").index()

  confirmed_children_type_val = $("#customer_children_type option:selected").val()
  confirmed_children_type_txt = $("#customer_children_type option:selected").text()
  confirmed_children_type_idx = $("#customer_children_type option:selected").index()

  confirmed_income_val = $("#customer_income option:selected").val()
  confirmed_income_txt = $("#customer_income option:selected").text()
  confirmed_income_idx = $("#customer_income option:selected").index()

  confirmed_budget_cash = budget_cash
  confirmed_budget_loan = budget_loan

  confirmed_trans_method = movingMethod
  confirmed_fav_point_x = fav_point_x
  confirmed_fav_point_y = fav_point_y
  confirmed_fav_point_address = fav_point_address

  confirmed_wanted_region = wanted_region
  confirmed_wanted_region_str = wanted_region_str
  confirmed_priority_living = priority_living
  confirmed_priority_trans = priority_trans
  confirmed_priority_infra = priority_infra
  confirmed_priority_edu = priority_edu

  //모든 변수 하나의 배열로 만들어 로컬스토리지에 저장
  report_obj = {
    name_val: confirmed_name_val,
    email_val: confirmed_email_val,

    domain_val: confirmed_domain_val,
    domain_txt: confirmed_domain_txt,
    domain_idx: confirmed_domain_idx,

    custom_domain_val : confirmed_email_custom_domain_val,
    email_full: confirmed_email_full,    
    
    age_val : confirmed_age_val,
    age_txt : confirmed_age_txt,
    age_idx : confirmed_age_idx,

    family_val: confirmed_family_val,
    family_txt: confirmed_family_txt,
    family_idx: confirmed_family_idx,
    
    children_val: confirmed_children_val,
    children_txt: confirmed_children_txt,
    children_idx: confirmed_children_idx,

    children_type_val: confirmed_children_type_val,
    children_type_txt: confirmed_children_type_txt,
    children_type_idx: confirmed_children_type_idx,
    
    income_val: confirmed_income_val,
    income_txt: confirmed_income_txt,
    income_idx: confirmed_income_idx,

    budget_cash: confirmed_budget_cash,
    budget_loan: confirmed_budget_loan,

    trans_method: confirmed_trans_method,

    fav_point_x: confirmed_fav_point_x,
    fav_point_y: confirmed_fav_point_y,
    fav_point_address: confirmed_fav_point_address,

    wanted_region: confirmed_wanted_region,
    wanted_region_str: confirmed_wanted_region_str,

    priority_living: confirmed_priority_living,
    priority_trans: confirmed_priority_trans,
    priority_infra: confirmed_priority_infra,
    priority_edu: confirmed_priority_edu
  }

  //이름이 반드시 입력되었는지 확인
  if(confirmed_name_val == ""){
    toastMessage("고객 이름을 입력해 주세요!", 2000)
    return
  }
  //이메일 주소가 반드시 입력되었는지 확인
  if($("#customer_email").val() == ""){
    toastMessage("이메일 주소를 입력해 주세요!", 2000)
    return
  }

  //confirmed_email이 이메일 정규식을 통과하는지 확인
  email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if(!email_regex.test(confirmed_email_full)){
    toastMessage("올바른 이메일 주소를 입력해 주세요!", 2000)
    return
  }  
  
  //현금 예산이 반드시 입력되었는지 확인
  if(confirmed_budget_cash == 0 && confirmed_budget_loan == 0){
    toastMessage("사용 가능 예산을 입력해 주세요!", 2000)
    return
  }

  loadReportFinalConfirmModal(report_obj)
}

function reportTempSave(){
  confirmed_name = $("#customer_name").val()
  confirmed_email = $("#customer_email").val()

  confirmed_domain = $("#customer_email_domain option:selected").val()
  confirmed_domain_idx = $("#customer_email_domain option:selected").index()
  
  if(confirmed_domain_idx == 5){ //직접입력일 경우
    confirmed_email_custom_domain = $("#customer_email_domain_custom").val()
  }
  else{
    confirmed_email_custom_domain = ""
  }

  confirmed_age = $("#customer_age option:selected").val()
  confirmed_age_idx = $("#customer_age option:selected").index()

  confirmed_family = $("#customer_family option:selected").val()
  confirmed_family_idx = $("#customer_family option:selected").index()

  confirmed_children = $("#customer_children option:selected").val()
  confirmed_children_idx = $("#customer_children option:selected").index()

  confirmed_children_type = $("#customer_children_type option:selected").val()
  confirmed_children_type_idx = $("#customer_children_type option:selected").index()

  confirmed_income = $("#customer_income option:selected").val()
  confirmed_income_idx = $("#customer_income option:selected").index()

  confirmed_budget_cash = budget_cash
  confirmed_budget_loan = budget_loan

  confirmed_trans_method = movingMethod
  confirmed_fav_point_x = fav_point_x
  confirmed_fav_point_y = fav_point_y
  confirmed_fav_point_address = getAddress_by_kakao(fav_point_x, fav_point_y)

  confirmed_wanted_region = wanted_region
  confirmed_wanted_region_str = wanted_region_str
  confirmed_priority_living = priority_living
  confirmed_priority_trans = priority_trans
  confirmed_priority_infra = priority_infra
  confirmed_priority_edu = priority_edu

  //모든 변수 하나의 배열로 만들어 로컬스토리지에 저장
  temp_report_obj = {
    name: confirmed_name,
    email: confirmed_email,
    domain : confirmed_domain,
    domain_idx: confirmed_domain_idx,
    email_custom_domain: confirmed_email_custom_domain,
    age: confirmed_age_idx,
    family: confirmed_family,
    children: confirmed_children_idx,
    children_type: confirmed_children_type_idx,
    income: confirmed_income_idx,
    budget_cash: confirmed_budget_cash,
    budget_loan: confirmed_budget_loan,
    trans_method: confirmed_trans_method,
    fav_point_x: confirmed_fav_point_x,
    fav_point_y: confirmed_fav_point_y,
    fav_point_address: confirmed_fav_point_address,
    wanted_region: confirmed_wanted_region,
    priority_living: confirmed_priority_living,
    priority_trans: confirmed_priority_trans,
    priority_infra: confirmed_priority_infra,
    priority_edu: confirmed_priority_edu
  }
  localStorage.setItem("temp_report_obj", JSON.stringify(temp_report_obj))

  toastMessage("임시저장이 완료되었어요!", 2000)
}

function reportTempLoad(){
  //console.log("reportTempLoad called")
  temp_report_str = localStorage.getItem("temp_report_obj")
  if(temp_report_str == null){
    toastMessage("저장된 임시데이터가 없어요!", 2000)
    return
  }
  temp_report_obj = JSON.parse(temp_report_str)
  //console.log(temp_report_obj)

  $("#customer_name").val(temp_report_obj.name)
  $("#customer_email").val(temp_report_obj.email)

  $("#customer_email_domain option[value = " + temp_report_obj.domain + "]").prop('selected', true)

  if(temp_report_obj.domain_idx == 5){ //직접입력일 경우
    changeEmailDomain("custom")
    $("#customer_email_domain_custom").val(temp_report_obj.email_custom_domain)    
  }  

  $("#customer_age option[value = " + temp_report_obj.age + "]").prop('selected', true)
  changeAge(temp_report_obj.age)
  
  $("#customer_family option[value = " + temp_report_obj.family + "]").prop('selected', true)
  changeFamily(temp_report_obj.family)
  
  $("#customer_children option[value = " + temp_report_obj.children + "]").prop('selected', true)
  $("#customer_children_type option[value = " + temp_report_obj.children_type + "]").prop('selected', true)
  $("#customer_income option[value = " + temp_report_obj.income + "]").prop('selected', true)

  budget_cash = Number(temp_report_obj.budget_cash)
  budget_loan = Number(temp_report_obj.budget_loan)
  $("#budget_cash").val(budget_cash.toLocaleString('ko-KR'))
  $("#budget_loan").val(budget_loan.toLocaleString('ko-KR'))
  changeNumberFormat(1, $("#budget_cash")[0])
  changeNumberFormat(2, $("#budget_loan")[0])

  movingMethod = temp_report_obj.trans_method
  if(movingMethod == 'public'){
    $("#movingPublic").prop("checked", true)
  }
  else{
    $("#movingDriving").prop("checked", true)
  }

  fav_point_x = temp_report_obj.fav_point_x
  fav_point_y = temp_report_obj.fav_point_y
  fav_point_address = temp_report_obj.fav_point_address
  req_detailMarker.setPosition(new naver.maps.LatLng(Number(fav_point_y), Number(fav_point_x)));
  req_detailMap.setCenter(new naver.maps.LatLng(Number(fav_point_y), Number(fav_point_x)));

  wanted_region_load = temp_report_obj.wanted_region

  for(var i=1; i<=wanted_region_load.length; i++){
    $("#req_sido" + i + " option[value='" + wanted_region_load[i-1][0] + "']").prop('selected', true)
    req_optionChange(i)     
    $("#req_gungu" + i + " option[value='" + wanted_region_load[i-1][1] + "']").prop('selected', true)

    if(i > 1){
      req_regionOn(i)
    }
  }

  $("#range_living").val(temp_report_obj.priority_living)
  $("#range_living_val").html(temp_report_obj.priority_living)
  priority_living = temp_report_obj.priority_living
  $("#range_trans").val(temp_report_obj.priority_trans)
  $("#range_trans_val").html(temp_report_obj.priority_trans)
  priority_trans = temp_report_obj.priority_trans
  $("#range_infra").val(temp_report_obj.priority_infra)
  $("#range_infra_val").html(temp_report_obj.priority_infra)
  priority_infra = temp_report_obj.priority_infra
  $("#range_edu").val(temp_report_obj.priority_edu)
  $("#range_edu_val").html(temp_report_obj.priority_edu)
  priority_edu = temp_report_obj.priority_edu

  toastMessage("임시저장이 불러와졌어요!", 2000)
}

function changeEmailDomain(val){
  if(val == "custom"){
    $("#customer_email_domain_input").show()
    $("#customer_email_domain_input").val("")
    $("#customer_email_domain_input").focus()
  }
  else{
    $("#customer_email_domain_input").hide()
  }
}

function reportBack(){
  $("#requestReportModal .modal-dialog").removeClass("modal-md").addClass("modal-lg")
  $("#requestReportModalContent").show()
  $("#requestReportConfirmModalContent").hide()
}

function closeAllModals(){
  $('.modal').modal('hide')
  $('.modal-backdrop').remove()
  modalStack = []
}

function openReportRequestModal(){  
  closeAllModals()
  $("#requestReportModalContent").show()
  $("#requestReportConfirmModalContent").hide()
  $("#requestReportModal .modal-dialog").removeClass("modal-md").addClass("modal-lg")
  openModal("requestReportModal")
  $(".modal-backdrop").css({"width":"100%"})
}

function loadReportFinalConfirmModal(report_obj){
  $(".modal-backdrop").css({"width":"100%"})
  //console.log("loadReportFinalConfirmModal called")
  //console.log(report_obj)  

  customer_name = report_obj.name_val
  customer_email = report_obj.email_full
  customer_age = report_obj.age_txt
  customer_family = report_obj.family_txt
  customer_children = report_obj.children_txt
  customer_children_type = report_obj.children_type_txt
  customer_income = report_obj.income_txt
  customer_budget_cash = numberToKorean(report_obj.budget_cash) + " 원"
  customer_budget_loan = numberToKorean(report_obj.budget_loan) + " 원"
  customer_fav_point_address = report_obj.fav_point_address
  customer_wanted_region_str = (report_obj.wanted_region_str).join(",")
  customer_wanted_region_str = customer_wanted_region_str.replaceAll(",", ", ")
  customer_priority_living = report_obj.priority_living
  customer_priority_trans = report_obj.priority_trans
  customer_priority_infra = report_obj.priority_infra
  customer_priority_edu = report_obj.priority_edu

  var confirm_html = `
    <div id='req_description_notice' style='margin-bottom:15px'>
      <ul>
        <li>고객님의 입력 정보를 최종 확인 후, '리포트 요청하기' 버튼을 누르시면 리포트 요청이 완료됩니다.</li>
        <li>리포트 요청 완료 후, 입금이 확인되면 리포트 제작이 시작되며, 24시간 이내에 이메일로 리포트가 발송됩니다.</li>
        <li>문의사항은 <a href="http://pf.kakao.com/_vESNb/chat" target="_blank">카카오톡 채널 '리얼랭커스'</a>로 문의해 주세요.</li>
      </ul>
    </div>

    <div id="req_step0">
      <div class="req_final_confirm_title">고객 정보</div>
      <div class="req_final_confirm_table">
        <div>이름</div>
        <div class="req_final_confirm_value">` + customer_name + `</div>

        <div>이메일 주소</div>
        <div class="req_final_confirm_value">` + customer_email + `</div>

        <div>연령대</div>
        <div class="req_final_confirm_value">` + customer_age + `</div>

        <div>가족구성</div>
        <div class="req_final_confirm_value">` + customer_family + `</div>

        <div>자녀구성</div>
        <div class="req_final_confirm_value">` + customer_children + ` (` + customer_children_type + `)</div>

        <div>가족연소득</div>
        <div class="req_final_confirm_value">` + customer_income + `</div>
      </div>
      </div>

    <div id="req_step0">

    <div class="req_final_confirm_title">예산</div>
      <div class="req_final_confirm_table">
        <div>사용 가능 예산</div>
        <div class="req_final_confirm_value">` + customer_budget_cash + `</div>

        <div>대출 가능 금액</div>
        <div class="req_final_confirm_value">` + customer_budget_loan + `</div>
      </div>
    </div>

    <div id="req_step0">
    <div class="req_final_confirm_title">선호 위치 및 중요도</div>
      <div class="req_final_confirm_table">
        <div>자주 가는 위치</div>
        <div class="req_final_confirm_value">` + customer_fav_point_address + `</div>

        <div>원하는 지역</div>
        <div class="req_final_confirm_value">` + customer_wanted_region_str + `</div>

        <div>중요도</div>
        <div class="req_final_confirm_value" style="display:grid; grid-template-columns:1fr 1fr; row-gap:5px;" >
          <div>주거 : ` + customer_priority_living + `</div>
          <div>교통 : ` + customer_priority_trans + `</div>
          <div>인프라 : ` + customer_priority_infra + `</div>
          <div>교육 : ` + customer_priority_edu + `</div>
        </div>
      </div>
    </div>
  `  
  $("#requestReportFinalConfirmModalBody").html(confirm_html)

  //requestReportModal바로 아래 div의 modal-lg를 modal-md로 바꾸기
  $("#requestReportModal .modal-dialog").removeClass("modal-lg").addClass("modal-md")  
  $("#requestReportModalContent").hide()
  $("#requestReportConfirmModalContent").show()
  //openModal("requestReportFinalConfirmModal")

  if(isMobile){
    $("#req_description_notice").css("font-size", "0.75em")
  }
}

function submitReportRequest(){
  //report_obj에 requestDate 추가
  var today = new Date();
  var year = today.getFullYear();
  var month = String(today.getMonth() + 1).padStart(2, '0');
  var day = String(today.getDate()).padStart(2, '0');
  var hours = String(today.getHours()).padStart(2, '0');
  var minutes = String(today.getMinutes()).padStart(2, '0');
  var seconds = String(today.getSeconds()).padStart(2, '0');
  var formattedDate = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
  var str_now = year + month + day + "_" + hours + minutes + seconds

  report_obj.requestDateStr = formattedDate
  report_obj.requestDate = today
  report_obj.paid = false
  report_obj.progress = "Pending"

  //현금영수증 발급 요청 여부 및 전화/사업자번호    
  var receipt_requested = $("#receiptYes").is(":checked") ? true : false
  var receipt_phone = $("#receipt_phone").val()

  //텔레그램 메시지 작성
  var telegram_message = `[리얼리포트 요청 알림]<br>
 ㆍ이름 : ` + report_obj.name_val + `<br>
 ㆍ이메일 : ` + report_obj.email_full + `<br>
 ㆍ연령 : ` + report_obj.age_txt + `<br>
 ㆍ요청일시 : ` + report_obj.requestDateStr + `<br>
 ㆍ예산 : 현금 ` + numberToKorean(report_obj.budget_cash) + `원, 대출 ` + numberToKorean(report_obj.budget_loan) + `원<br>
 ㆍ선호 위치 : ` + report_obj.fav_point_address + `<br>
 ㆍ원하는 지역 : ` + (report_obj.wanted_region_str).join(", ") + `<br>
 ㆍ중요도 - 주거 : ` + report_obj.priority_living + `, 교통: ` + report_obj.priority_trans + `, 인프라: ` + report_obj.priority_infra + `, 교육: ` + report_obj.priority_edu + `<br>
 ㆍ현금영수증 발급 요청 : ` + (receipt_requested ? "예 (전화/사업자번호: " + receipt_phone + ")" : "아니오") + `<br>
 ----------------------------------------`

  //sendTelegram_single_message(telegram_message)

  db_domain_txt = report_obj.email_full.replace("@", "_").replace(".", "_")

  //Firebase Realtime Database에 저장할 데이터 형식으로 변환
  var requestData = {
      name_val: report_obj.name_val,
      email_val: report_obj.email_val,

      domain_val: report_obj.domain_val,
      domain_txt: report_obj.domain_txt,
      domain_idx: report_obj.domain_idx,

      custom_domain_val : report_obj.custom_domain_val,
      email_full: report_obj.email_full,    
      
      age_val : report_obj.age_val,
      age_txt : report_obj.age_txt,
      age_idx : report_obj.age_idx,

      family_val: report_obj.family_val,
      family_txt: report_obj.family_txt,
      family_idx: report_obj.family_idx,
      
      children_val: report_obj.children_val,
      children_txt: report_obj.children_txt,
      children_idx: report_obj.children_idx,

      children_type_val: report_obj.children_type_val,
      children_type_txt: report_obj.children_type_txt,
      children_type_idx: report_obj.children_type_idx,
      
      income_val: report_obj.income_val,
      income_txt: report_obj.income_txt,
      income_idx: report_obj.income_idx,

      budget_cash: report_obj.budget_cash,
      budget_loan: report_obj.budget_loan,

      trans_method: report_obj.trans_method,

      fav_point_x: report_obj.fav_point_x,
      fav_point_y: report_obj.fav_point_y,
      fav_point_address: report_obj.fav_point_address,

      wanted_region: report_obj.wanted_region,
      wanted_region_str: report_obj.wanted_region_str,

      priority_living: report_obj.priority_living,
      priority_trans: report_obj.priority_trans,
      priority_infra: report_obj.priority_infra,
      priority_edu: report_obj.priority_edu,

      receipt_requested: receipt_requested,
      receipt_phone: receipt_phone,

      requestDateStr: report_obj.requestDateStr,
      requestDate: report_obj.requestDate,
      paid: report_obj.paid,
      progress: report_obj.progress
  }

  //requestData의 모든 하위 항목에 undefined 값이 있으면 빈 문자열로 변경
  for (var key in requestData) {
    if (requestData[key] === undefined) {
      requestData[key] = "";
    }
  }

  //현금영수증을 요청했으나, 전화번호가 비어있으면 오류 메시지 출력 후 함수 종료
  if(receipt_requested && (receipt_phone == "" || receipt_phone == null)){
    toastMessage("현금영수증 발급을 위해 휴대폰번호 또는 사업자등록번호를 입력해 주세요!", 2000)
    return
  }

  requestReport_db.database().ref(db_domain_txt + "_" + str_now).set(requestData)
  .then(() => {
    //console.log("Document written with ID: ", docRef.id);
    sendTelegram_single_message(telegram_message)
    toastMessage("리포트 요청이 완료되었어요! 입금 확인 후 리포트 제작이 시작됩니다.", 2000)
    closeAllModals()
  })
  .catch((error) => {
    console.error("Error adding document: ", error);
    toastMessage("리포트 요청 중 오류가 발생했어요. 다시 시도해 주세요.", 2000)
  });
}