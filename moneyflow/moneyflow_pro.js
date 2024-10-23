function get_direction(val){
  val_result = ""

  if(val < 0){
    val_result = "down"
  }
  if(val == 0){
    val_result = "same"
  }
  if(val > 0){
    val_result = "up"
  }
 
  return val_result
}

function set_color_tag(val){
  returnVal = ""
  val_result = ""
  share_text_reult = ""

  if(val < 0){
    returnVal = "<span class='valDown'> ▼" + (val*-1).toLocaleString(undefined, {minimumFractionDigits:2})
    val_result = "down"
    share_text_reult = "▼" + (val*-1).toLocaleString(undefined, {minimumFractionDigits:2})
  }
  if(val == 0){
    returnVal = "<span class='valkeep'>" + val.toLocaleString(undefined, {minimumFractionDigits:2})
    val_result = "same"
    share_text_reult = "=" + (val).toLocaleString(undefined, {minimumFractionDigits:2})
  }
  if(val > 0){
    returnVal = "<span class='valUp'> ▲" + val.toLocaleString(undefined, {minimumFractionDigits:2})
    val_result = "up"
    share_text_reult = "▲" + (val).toLocaleString(undefined, {minimumFractionDigits:2})
  }
 
  return [returnVal, val_result, share_text_reult]
}

function set_color_tag_plusminus(val){
  returnVal = ""
  val_result = ""
  share_text_reult = ""

  if(val < 0){
    returnVal = "<span class='valDown'> -" + (val*-1).toLocaleString(undefined, {minimumFractionDigits:2})
    val_result = "down"
    share_text_reult = "-" + (val*-1).toLocaleString(undefined, {minimumFractionDigits:2})
  }
  if(val == 0){
    returnVal = "<span class='valkeep'>" + val.toLocaleString(undefined, {minimumFractionDigits:2})
    val_result = "same"
    share_text_reult = "=" + val.toLocaleString(undefined, {minimumFractionDigits:2})
  }
  if(val > 0){
    returnVal = "<span class='valUp'> +" + val.toLocaleString(undefined, {minimumFractionDigits:2})
    val_result = "up"
    share_text_reult = "+" + val.toLocaleString(undefined, {minimumFractionDigits:2})
  }
 
  return [returnVal, val_result, share_text_reult]
}

function set_color_tag2(val, direction){
  returnVal = ""
  var convert_val = (Number(val)).toLocaleString(undefined, {minimumFractionDigits:2})  

  if(direction == "up"){
    returnVal = "<span class='valUp'>" + convert_val
  }
  if(direction == "same"){
    returnVal = "<span class='valkeep'>" + convert_val
    val_result = "same"
  }
  if(direction == "down"){
    returnVal = "<span class='valDown'>" + convert_val
  }
 
  return returnVal
}

function set_color_tag3(val){
  returnVal = ""
  val_result = ""
  share_text_reult = ""

  if(val < 0){
    returnVal = "<span class='valDown'> ▼" + (Number(val)*-1).toLocaleString()
    val_result = "down"
    share_text_reult = "▼" + (Number(val)*-1).toLocaleString()
  }
  if(val == 0){
    returnVal = "<span class='valkeep'>" + Number(val).toLocaleString()
    val_result = "same"
    share_text_reult = Number(val).toLocaleString()
  }
  if(val > 0){
    returnVal = "<span class='valUp'> ▲" + Number(val).toLocaleString()
    val_result = "up"
    share_text_reult = "▲" + Number(val).toLocaleString()
  }
 
  return [returnVal, val_result, share_text_reult]
}

function show_hourly_info(){
  popMsg = "'" + hourly_updated + "'" + " 시점의\n시장지표가 복사되었습니다."
  hourly_info_txt = "<div onClick='CopyToClipboard(shareText, popMsg)'><button class='tShare'> <i class='fa-regular fa-copy'></i> </button></div>"
  hourly_info_txt += "<div></div>"
  hourly_info_txt += "<div class='comment'>" + hourly_updated + "</div>"
  $('#hourly_info').append(hourly_info_txt); 

  var addon_html = ""
  //국내 증시
  addon_html += "<div class='hourly_container'>"

  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>국내 증시</div>"
  addon_html += "<div class='hourly_sub'>(전일대비)</div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>코스피</div>"
  val_direction = get_direction(hourly_market['KOSPI']['rate'])  
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['KOSPI']['value'].toFixed(2), val_direction) + "</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['KOSPI']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['KOSPI']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>코스닥</div>"
  val_direction = get_direction(hourly_market['KOSDAQ']['rate'])  
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['KOSDAQ']['value'].toFixed(2), val_direction) + "</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['KOSDAQ']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['KOSDAQ']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>코스피200</div>"
  val_direction = get_direction(hourly_market['KOSPI200']['rate'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['KOSPI200']['value'].toFixed(2), val_direction) + "</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['KOSPI200']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['KOSPI200']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  shareText += "[국내 증시]\n"
  shareText += "ㆍ코스피 : " + hourly_market['KOSPI']['value'].toLocaleString(undefined, {minimumFractionDigits:2})  + " (" + set_color_tag(hourly_market['KOSPI']['diff'].toFixed(2))[2] + ", " + set_color_tag_plusminus(hourly_market['KOSPI']['rate'].toFixed(2))[2] + "%)\n"
  shareText += "ㆍ코스닥 : " + hourly_market['KOSDAQ']['value'].toLocaleString(undefined, {minimumFractionDigits:2})  + " (" + set_color_tag(hourly_market['KOSDAQ']['diff'].toFixed(2))[2] + ", " + set_color_tag_plusminus(hourly_market['KOSDAQ']['rate'].toFixed(2))[2] + "%)\n"
  shareText += "\n"

  addon_html += "</div>"

  //미국 증시
  addon_html += "<div class='hourly_container'>"

  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>미국 증시</div>"
  addon_html += "<div class='hourly_sub'>(전일대비)</div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>다우존스</div>"
  val_direction = get_direction(hourly_market['DOW']['rate'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['DOW']['value'].toFixed(2), val_direction) + "</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['DOW']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['DOW']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"  

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>나스닥</div>"
  val_direction = get_direction(hourly_market['NAS']['rate'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['NAS']['value'].toFixed(2), val_direction) + "</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['NAS']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['NAS']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>S&P500</div>"
  val_direction = get_direction(hourly_market['SNP']['rate'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['SNP']['value'].toFixed(2), val_direction) + "</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['SNP']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['SNP']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  shareText += "[미국 증시]\n"  
  shareText += "ㆍ다우존스 : " + hourly_market['DOW']['value'].toLocaleString(undefined, {minimumFractionDigits:2})  + " (" + set_color_tag(hourly_market['DOW']['diff'].toFixed(2))[2] + ", " + set_color_tag_plusminus(hourly_market['DOW']['rate'].toFixed(2))[2] + "%)\n"
  shareText += "ㆍ나스닥 : " + hourly_market['NAS']['value'].toLocaleString(undefined, {minimumFractionDigits:2})  + " (" + set_color_tag(hourly_market['NAS']['diff'].toFixed(2))[2] + ", " + set_color_tag_plusminus(hourly_market['NAS']['rate'].toFixed(2))[2] + "%)\n"
  shareText += "ㆍS&P500 : " + hourly_market['SNP']['value'].toLocaleString(undefined, {minimumFractionDigits:2})  + " (" + set_color_tag(hourly_market['SNP']['diff'].toFixed(2))[2] + ", " + set_color_tag_plusminus(hourly_market['SNP']['rate'].toFixed(2))[2] + "%)\n"
  shareText += "\n"

  addon_html += "</div>"

  //환율
  addon_html += "<div class='hourly_container'>"

  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>환율</div>"
  addon_html += "<div class='hourly_sub'>(전일대비)</div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>달러→원</div>"
  val_direction = get_direction(hourly_market['USDKRW']['rate'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['USDKRW']['value'].toFixed(2), val_direction) + "</span><span class='unit'> 원</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['USDKRW']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['USDKRW']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"
  
  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>100엔→원</div>"
  val_direction = get_direction(hourly_market['JPYKRW']['rate'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['JPYKRW']['value'].toFixed(2), val_direction) + "</span><span class='unit'> 원</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['JPYKRW']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['JPYKRW']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>유로→원</div>"
  val_direction = get_direction(hourly_market['EURKRW']['rate'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['EURKRW']['value'].toFixed(2), val_direction) + "</span><span class='unit'> 원</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['EURKRW']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['EURKRW']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>위안→원</div>"
  val_direction = get_direction(hourly_market['CNYKRW']['rate'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['CNYKRW']['value'].toFixed(2), val_direction) + "</span><span class='unit'> 원</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['CNYKRW']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['CNYKRW']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<hr class='hr-dashed'/>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>달러 인덱스</div>"
  val_direction = get_direction(hourly_market['Dollar_Index']['rate'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['Dollar_Index']['value'], val_direction) + "</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['Dollar_Index']['diff'])[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['Dollar_Index']['rate'])[0] + "%</span></div>"
  addon_html += "</div>"  

  shareText += "[환율]\n"  
  shareText += "ㆍ달러→원 : " + hourly_market['USDKRW']['value'].toLocaleString(undefined, {minimumFractionDigits:2})  + " 원 (" + set_color_tag(hourly_market['USDKRW']['diff'].toFixed(2))[2] + ", " + set_color_tag_plusminus(hourly_market['USDKRW']['rate'].toFixed(2))[2] + "%)\n"
  shareText += "ㆍ100엔→원 : " + hourly_market['JPYKRW']['value'].toLocaleString(undefined, {minimumFractionDigits:2})  + " 원 (" + set_color_tag(hourly_market['JPYKRW']['diff'].toFixed(2))[2] + ", " + set_color_tag_plusminus(hourly_market['JPYKRW']['rate'].toFixed(2))[2] + "%)\n"
  shareText += "ㆍ유로→원 : " + hourly_market['EURKRW']['value'].toLocaleString(undefined, {minimumFractionDigits:2})  + " 원 (" + set_color_tag(hourly_market['SNP']['diff'].toFixed(2))[2] + ", " + set_color_tag_plusminus(hourly_market['EURKRW']['rate'].toFixed(2))[2] + "%)\n"
  shareText += "\n"  

  addon_html += "</div>"

  //코인
  addon_html += "<div class='hourly_container'>"

  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>코인</div>"
  addon_html += "<div class='hourly_sub'>(전일대비)</div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table3'>"
  addon_html += "<div class = 'item_name'>비트코인</div>"
  val_direction = get_direction(hourly_market['USDT-BTC']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['USDT-BTC']['value'].toFixed(2), val_direction) + "</span><span class='unit'> USDT</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['USDT-BTC']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['USDT-BTC']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table3'>"
  addon_html += "<div class = 'item_name'>이더리움</div>"
  val_direction = get_direction(hourly_market['USDT-ETH']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['USDT-ETH']['value'].toFixed(2), val_direction) + "</span><span class='unit'> USDT</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['USDT-ETH']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['USDT-ETH']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table3'>"
  addon_html += "<div class = 'item_name'>리플</div>"
  val_direction = get_direction(hourly_market['USDT-XRP']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['USDT-XRP']['value'].toFixed(2), val_direction) + "</span><span class='unit'> USDT</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['USDT-XRP']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['USDT-XRP']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"  

  addon_html += "</div>"  

  //금/원자재
  addon_html += "<div class='hourly_container'>"

  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>금 / 원자재</div>"
  addon_html += "<div class='hourly_sub'>(전일대비)</div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table3'>"
  addon_html += "<div class = 'item_name'>금</div>"
  val_direction = get_direction(Number(hourly_market['YF_Gold']['diff']))
  Gold_hourly_val = (hourly_market['YF_Gold']['value']).replaceAll(",", "")
  addon_html += "<div class = 'current_val'>" + set_color_tag2(Number(Gold_hourly_val).toFixed(2), val_direction) + "</span><span class='unit'> 달러/T온스</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(Number(hourly_market['YF_Gold']['diff']).toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(Number(hourly_market['YF_Gold']['rate']).toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"
  
  addon_html += "<div class='hourly_table3'>"
  addon_html += "<div class = 'item_name'>은</div>"
  val_direction = get_direction(Number(hourly_market['YF_Silver']['diff']))
  addon_html += "<div class = 'current_val'>" + set_color_tag2(Number(hourly_market['YF_Silver']['value']).toFixed(2), val_direction) + "</span><span class='unit'> 달러/T온스</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(Number(hourly_market['YF_Silver']['diff']).toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(Number(hourly_market['YF_Silver']['rate']).toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table3'>"
  addon_html += "<div class = 'item_name'>구리</div>"
  val_direction = get_direction(Number(hourly_market['YF_Copper']['diff']))
  addon_html += "<div class = 'current_val'>" + set_color_tag2(Number(hourly_market['YF_Copper']['value']).toFixed(2), val_direction) + "</span><span class='unit'> 달러/파운드</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(Number(hourly_market['YF_Copper']['diff']).toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(Number(hourly_market['YF_Copper']['rate']).toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  shareText += "[금/원자재]\n"  
  shareText += "ㆍ금 : " + Number(val_direction).toLocaleString(undefined, {minimumFractionDigits:2})  + " 달러/T온스 (" + set_color_tag(Number(hourly_market['YF_Gold']['diff']).toFixed(2))[2] + ", " + set_color_tag_plusminus(Number(hourly_market['YF_Gold']['rate']).toFixed(2))[2] + "%)\n"
  shareText += "ㆍ은 : " + Number(hourly_market['YF_Silver']['value']).toLocaleString(undefined, {minimumFractionDigits:2})  + " 달러/T온스 (" + set_color_tag(Number(hourly_market['YF_Silver']['diff']).toFixed(2))[2] + ", " + set_color_tag_plusminus(Number(hourly_market['YF_Silver']['rate']).toFixed(2))[2] + "%)\n"
  shareText += "ㆍ구리 : " + Number(hourly_market['YF_Copper']['value']).toLocaleString(undefined, {minimumFractionDigits:2})  + " 달러/파운드 (" + set_color_tag(Number(hourly_market['YF_Copper']['diff']).toFixed(2))[2] + ", " + set_color_tag_plusminus(Number(hourly_market['YF_Copper']['rate']).toFixed(2))[2] + "%)\n"
  shareText += "\n"

  addon_html += "</div>"

  //국제 유가
  addon_html += "<div class='hourly_container'>"

  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>국제 유가</div>"
  addon_html += "<div class='hourly_sub'>(전일대비)</div>"
  addon_html += "</div>"
 
  addon_html += "<div class='hourly_table3'>"
  addon_html += "<div class = 'item_name'>서부텍사스유</div>"
  val_direction = get_direction(hourly_market['YF_WTI']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['YF_WTI']['value'].toFixed(2), val_direction) + "</span><span class='unit'> 달러/배럴</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['YF_WTI']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['YF_WTI']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"
  
  addon_html += "<div class='hourly_table3'>"
  addon_html += "<div class = 'item_name'>두바이유</div>"
  val_direction = get_direction(hourly_market['Dubai']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['Dubai']['value'].toFixed(2), val_direction) + "</span><span class='unit'> 달러/배럴</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['Dubai']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['Dubai']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table3'>"
  addon_html += "<div class = 'item_name'>브렌트유</div>"
  val_direction = get_direction(hourly_market['YF_Brent']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['YF_Brent']['value'].toFixed(2), val_direction) + "</span><span class='unit'> 달러/배럴</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['YF_Brent']['diff'].toFixed(2))[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['YF_Brent']['rate'].toFixed(2))[0] + "%</span></div>"
  addon_html += "</div>"

  shareText += "[국제 유가]\n"  
  shareText += "ㆍ서부텍사스유 : " + hourly_market['YF_WTI']['value'].toLocaleString(undefined, {minimumFractionDigits:2})  + " 달러/배럴 (" + set_color_tag(hourly_market['YF_WTI']['diff'].toFixed(2))[2] + ", " + set_color_tag_plusminus(hourly_market['YF_WTI']['rate'].toFixed(2))[2] + "%)\n"
  shareText += "ㆍ두바이유 : " + hourly_market['Dubai']['value'].toLocaleString(undefined, {minimumFractionDigits:2})  + " 달러/배럴 (" + set_color_tag(hourly_market['Dubai']['diff'].toFixed(2))[2] + ", " + set_color_tag_plusminus(hourly_market['Dubai']['rate'].toFixed(2))[2] + "%)\n"
  shareText += "ㆍ브렌트유 : " + hourly_market['YF_Brent']['value'].toLocaleString(undefined, {minimumFractionDigits:2})  + " 달러/배럴 (" + set_color_tag(hourly_market['YF_Brent']['diff'].toFixed(2))[2] + ", " + set_color_tag_plusminus(hourly_market['YF_Brent']['rate'].toFixed(2))[2] + "%)\n"
  shareText += "\n"   

  addon_html += "</div>"

  //채권 수익률
  addon_html += "<div class='hourly_container'>"

  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>채권 수익률</div>"
  addon_html += "<div class='hourly_sub'>(전일대비)</div>"
  addon_html += "</div>"
 
  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>미국 국채 30년</div>"
  val_direction = get_direction(hourly_market['US30YT_Bond']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['US30YT_Bond']['value'], val_direction) + "</span><span class='unit'> %</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['US30YT_Bond']['diff'])[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['US30YT_Bond']['rate'])[0] + "%</span></div>"
  addon_html += "</div>"
  
  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>미국 국채 10년</div>"
  val_direction = get_direction(hourly_market['US10YT_Bond']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['US10YT_Bond']['value'], val_direction) + "</span><span class='unit'> %</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['US10YT_Bond']['diff'])[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['US10YT_Bond']['rate'])[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>미국 국채 5년</div>"
  val_direction = get_direction(hourly_market['US5YT_Bond']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['US5YT_Bond']['value'], val_direction) + "</span><span class='unit'> %</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['US5YT_Bond']['diff'])[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['US5YT_Bond']['rate'])[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>미국 국채 3년</div>"
  val_direction = get_direction(hourly_market['US3YT_Bond']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['US3YT_Bond']['value'], val_direction) + "</span><span class='unit'> %</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['US3YT_Bond']['diff'])[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['US3YT_Bond']['rate'])[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<hr class='hr-dashed'/>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>한국 국채 30년</div>"
  val_direction = get_direction(hourly_market['KR30YT_Bond']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['KR30YT_Bond']['value'], val_direction) + "</span><span class='unit'> %</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['KR30YT_Bond']['diff'])[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['KR30YT_Bond']['rate'])[0] + "%</span></div>"
  addon_html += "</div>"
  
  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>한국 국채 10년</div>"
  val_direction = get_direction(hourly_market['KR10YT_Bond']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['KR10YT_Bond']['value'], val_direction) + "</span><span class='unit'> %</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['KR10YT_Bond']['diff'])[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['KR10YT_Bond']['rate'])[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>한국 국채 5년</div>"
  val_direction = get_direction(hourly_market['KR5YT_Bond']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['KR5YT_Bond']['value'], val_direction) + "</span><span class='unit'> %</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['KR5YT_Bond']['diff'])[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['KR5YT_Bond']['rate'])[0] + "%</span></div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table'>"
  addon_html += "<div class = 'item_name'>한국 국채 3년</div>"
  val_direction = get_direction(hourly_market['KR3YT_Bond']['diff'])
  addon_html += "<div class = 'current_val'>" + set_color_tag2(hourly_market['KR3YT_Bond']['value'], val_direction) + "</span><span class='unit'> %</span></div>"
  addon_html += "<div class = 'gap_val'>" + set_color_tag(hourly_market['KR3YT_Bond']['diff'])[0] + "</span></div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag_plusminus(hourly_market['KR3YT_Bond']['rate'])[0] + "%</span></div>"
  addon_html += "</div>"   

  addon_html += "</div>"  

  //금리
  KOR_interest = get_last_value(monthly_market['BOK_Standard_Interest'])
  US_interest = get_last_value(daily_market['FRED_Interest'])

  addon_html += "<div class='hourly_container'>"

  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>금리</div>"
  addon_html += "<div class='hourly_sub'>(한국:전월대비, 미국:전일대비)</div>"
  addon_html += "</div>"

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>한국은행 기준금리</div>"
  addon_html += "<div class = 'current_val'>" + Number(KOR_interest[0]).toFixed(2) + "%</div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag(KOR_interest[1].toFixed(2))[0] + "%</div>"  
  addon_html += "</div>"

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>미국 기준금리</div>"
  addon_html += "<div class = 'current_val'>" + Number(US_interest[0]).toFixed(2) + "%</div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag(US_interest[1].toFixed(2))[0] + "%</div>"  
  addon_html += "</div>"

  shareText += "[금리]\n"  
  shareText += "ㆍ한국은행 기준금리 : " + Number(KOR_interest[0]).toFixed(2)  + "%\n"
  shareText += "ㆍ미국 기준금리 : " + Number(US_interest[0]).toFixed(2) + "%\n"  
  shareText += "\n"  

  addon_html += "</div>"

  //통화량/외환보유고
  KOR_totalasset = get_last_value(monthly_market['BOK_Total_Asset'])
  US_totalasset = get_last_value(daily_market['FRED_Total_Asset'])
  KOR_externalmoney = get_last_value(monthly_market['BOK_External_Money'])

  addon_html += "<div class='hourly_container'>"  

  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>통화량(M0) / 외환보유고</div>"
  addon_html += "<div class='hourly_sub'>(한국:전월대비, 미국:전주대비)</div>"
  addon_html += "</div>"  

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>한국 통화량</div>"
  KO_total = ( Number(KOR_totalasset[0]) * 1000000000 ) / 1000000000000
  addon_html += "<div class = 'current_val'>" + KO_total.toFixed(2) + "<span class='unit'> 조 원</span></div>"
  KO_total_gap = ( Number(KOR_totalasset[1]) * 1000000000 ) / 1000000000000
  addon_html += "<div class = 'rate_val'>" + set_color_tag(KO_total_gap)[0] + "</span></div>"  
  addon_html += "</div>"

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>미국 통화량</div>"
  US_total = (Number(US_totalasset[0]) * 1000000) / 1000000000000
  addon_html += "<div class = 'current_val'>" + US_total.toFixed(2) + "<span class='unit'> 조 달러</span></div>"
  US_total_gap = (Number(US_totalasset[1]) * 1000000) / 1000000000000
  addon_html += "<div class = 'rate_val'>" + set_color_tag(US_total_gap)[0] + "</span></div>"  
  addon_html += "</div>"

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>한국 외환 보유고</div>"
  external_total = (Number(KOR_externalmoney[0]) * 1000) / 1000000000000
  addon_html += "<div class = 'current_val'>" + external_total.toFixed(2) + "<span class='unit'> 조 달러</span></div>"
  external_total_gap = (Number(KOR_externalmoney[1]) * 1000) / 1000000000000
  addon_html += "<div class = 'rate_val'>" + set_color_tag(external_total_gap)[0] + "</span></div>"  
  addon_html += "</div>"

  shareText += "[통화량(M0) / 외환보유고]\n"  
  shareText += "ㆍ한국 통화량 : " + KO_total.toFixed(2)  + " 조 원 (" + set_color_tag(KO_total_gap)[2] + ")\n"
  shareText += "ㆍ미국 통화량 : " + US_total.toFixed(2)  + " 조 달러 (" + set_color_tag(US_total_gap)[2] + ")\n"
  shareText += "ㆍ한국 외환보유고 : " + external_total.toFixed(2)  + " 조 달러 (" + set_color_tag(external_total_gap)[2] + ")\n"
  shareText += "\n"

  addon_html += "</div>"

  //채권
  KOR_publishedbond = get_last_value(monthly_market['BOK_Bond_Publish'])
  KOR_remainbond = get_last_value(monthly_market['BOK_Bond_Remain'])

  addon_html += "<div class='hourly_container'>"

  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>채권</div>"
  addon_html += "<div class='hourly_sub'>(전월대비)</div>"
  addon_html += "</div>" 

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>전월 채권 발행액</div>"
  publishedbond_total = ( Number(KOR_publishedbond[0]) * 1000000000 ) / 1000000000000
  addon_html += "<div class = 'current_val'>" + publishedbond_total.toFixed(2) + "<span class='unit'> 조 원</span></div>"
  publishedbond_total_gap = ( Number(KOR_publishedbond[1]) * 1000000000 ) / 1000000000000
  addon_html += "<div class = 'rate_val'>" + set_color_tag(publishedbond_total_gap)[0] + "</span></div>"  
  addon_html += "</div>"

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>누적 채권 잔액</div>"
  remainbond_total = ( Number(KOR_remainbond[0]) * 1000000000 ) / 1000000000000
  addon_html += "<div class = 'current_val'>" + remainbond_total.toFixed(2) + "<span class='unit'> 조 원</span></div>"
  remainbond_total_gap = ( Number(KOR_remainbond[1]) * 1000000000 ) / 1000000000000
  addon_html += "<div class = 'rate_val'>" + set_color_tag(remainbond_total_gap)[0] + "</span></div>"  
  addon_html += "</div>"

  addon_html += "</div>"

  //무역
  KOR_tradeprofit = get_last_value(monthly_market['BOK_Trade_Profit'])
  KOR_tradein = get_last_value(monthly_market['BOK_Trade_In'])
  KOR_tradeout = get_last_value(monthly_market['BOK_Trade_Out'])

  addon_html += "<div class='hourly_container'>"

  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>무역</div>"
  addon_html += "<div class='hourly_sub'>(전월대비)</div>"
  addon_html += "</div>" 

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>수출액</div>"
  KOR_tradeout_total = (Number(KOR_tradeout[0]) * 1000) / 100000000
  addon_html += "<div class = 'current_val'>" + KOR_tradeout_total.toFixed(2) + "<span class='unit'> 억 달러</span></div>"
  KOR_tradeout_total_gap = (Number(KOR_tradeout[1]) * 1000) / 100000000
  addon_html += "<div class = 'rate_val'>" + set_color_tag(KOR_tradeout_total_gap.toFixed(2))[0] + "</div>"  
  addon_html += "</div>"

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>수입액</div>"
  KOR_tradein_total = (Number(KOR_tradein[0]) * 1000) / 100000000
  addon_html += "<div class = 'current_val'>" + KOR_tradein_total.toFixed(2) + "<span class='unit'> 억 달러</span></div>"
  KOR_tradein_total_gap = (Number(KOR_tradein[1]) * 1000) / 100000000
  addon_html += "<div class = 'rate_val'>" + set_color_tag(KOR_tradein_total_gap.toFixed(2))[0] + "</div>"  
  addon_html += "</div>"

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>경상수지</div>"
  KOR_tradeprofit_total = ( Number(KOR_tradeprofit[0]) * 1000000 ) / 100000000
  addon_html += "<div class = 'current_val'>" + KOR_tradeprofit_total.toFixed(2) + "<span class='unit'> 억 달러</span></div>"
  KOR_tradeprofit_gap = ( Number(KOR_tradeprofit[1]) * 1000000 ) / 100000000
  addon_html += "<div class = 'rate_val'>" + set_color_tag(KOR_tradeprofit_gap.toFixed(2))[0] + "</div>"  
  addon_html += "</div>"

  shareText += "[무역]\n"  
  shareText += "ㆍ수출액 : " + KOR_tradeout_total.toFixed(2)  + " 억 달러 (" + set_color_tag(KOR_tradeout_total_gap)[2] + ")\n"
  shareText += "ㆍ수입액 : " + KOR_tradein_total.toFixed(2)  + " 억 달러 (" + set_color_tag(KOR_tradein_total_gap)[2] + ")\n"
  shareText += "ㆍ경상수지 : " + KOR_tradeprofit_total.toFixed(2)  + " 억 달러 (" + set_color_tag(KOR_tradeprofit_gap)[2] + ")\n"
  shareText += "\n"

  addon_html += "</div>"

  //소득
  KOR_GDP = get_last_value(monthly_market['DATA_VALUE_GDP'])
  KOR_GNI = get_last_value(monthly_market['DATA_VALUE_GNI'])

  addon_html += "<div class='hourly_container'>"  

  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>소득</div>"
  addon_html += "<div class='hourly_sub'>(전년대비)</div>"
  addon_html += "</div>"
  
  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>GDP(국내총생산)</div>"
  KOR_GDP_total = ( Number(KOR_GDP[0]) * 1000000000 ) / 1000000000000  //1000
  addon_html += "<div class = 'current_val'>" + Number(KOR_GDP_total.toFixed(1)).toLocaleString() + "<span class='unit'> 조 원</span></div>"
  KOR_GDP_total_gap = ( Number(KOR_GDP[1]) * 1000000000 ) / 1000000000000
  addon_html += "<div class = 'rate_val'>" + set_color_tag(KOR_GDP_total_gap.toFixed(2))[0] + "</div>"  
  addon_html += "</div>"

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>1인당 GNI(소득)</div>"
  KOR_GNI_total = ( Number(KOR_GNI[0]) * 10000 )
  addon_html += "<div class = 'current_val'>" + Number(KOR_GNI_total.toFixed(1)).toLocaleString() + "<span class='unit'> 원</span></div>"
  KOR_GNI_gap = ( Number(KOR_GNI[1]) * 10000 )
  addon_html += "<div class = 'rate_val'>" + set_color_tag3(KOR_GNI_gap.toFixed(0))[0] + "</div>"  
  addon_html += "</div>"

  shareText += "[소득]\n"  
  shareText += "ㆍGDP(국내총생산) : " + Number(KOR_GDP_total.toFixed(1)).toLocaleString()  + " 조 원 (" + set_color_tag(KOR_GDP_total_gap.toFixed(2))[2] + ")\n"
  shareText += "ㆍ1인당 GNI(소득) : " + Number(KOR_GNI_total.toFixed(1)).toLocaleString()  + " 원 (" + set_color_tag3(KOR_GNI_gap.toFixed(0))[2] + ")\n"  
  shareText += "\n"  

  addon_html += "</div>"

  //부동산
  KOR_housing_tradeall = get_last_value(monthly_market['BOK_Housing_Trade_All'])
  KOR_housing_tradeapt = get_last_value(monthly_market['BOK_Housing_Trade_Apt'])
  KOR_housing_rentall = get_last_value(monthly_market['BOK_Housing_Rent_All'])  
  KOR_housing_rentapt = get_last_value(monthly_market['BOK_Housing_Rent_Apt'])

  addon_html += "<div class='hourly_container'>"
  
  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>부동산</div>"
  addon_html += "<div class='hourly_sub'>(전월대비)</div>"
  addon_html += "</div>"  

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>주택 매매가격지수</div>"
  addon_html += "<div class = 'current_val'>" + Number(KOR_housing_tradeall[0]).toFixed(1) + "</div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag(KOR_housing_tradeall[1].toFixed(2))[0] + "</div>"    
  addon_html += "</div>"
  
  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>아파트 매매가격지수</div>"
  addon_html += "<div class = 'current_val'>" + Number(KOR_housing_tradeapt[0]).toFixed(1) + "</div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag(KOR_housing_tradeapt[1].toFixed(2))[0] + "</div>"    
  addon_html += "</div>"

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>주택 전세가격지수</div>"
  addon_html += "<div class = 'current_val'>" + Number(KOR_housing_rentall[0]).toFixed(1) + "</div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag(KOR_housing_rentall[1].toFixed(2))[0] + "</div>"    
  addon_html += "</div>"
  
  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>아파트 전세가격지수</div>"
  addon_html += "<div class = 'current_val'>" + Number(KOR_housing_rentapt[0]).toFixed(1) + "</div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag(KOR_housing_rentapt[1].toFixed(2))[0] + "</div>"    
  addon_html += "</div>"

  shareText += "[부동산]\n"  
  shareText += "ㆍ주택 매매가격지수 : " + Number(KOR_housing_tradeall[0]).toFixed(1)  + " (" + set_color_tag(KOR_housing_tradeall[1].toFixed(2))[2] + ")\n"
  shareText += "ㆍ아파트 매매가격지수 : " + Number(KOR_housing_tradeapt[0]).toFixed(1)  + " (" + set_color_tag(KOR_housing_tradeapt[1].toFixed(2))[2] + ")\n"
  shareText += "ㆍ주택 전세가격지수 : " + Number(KOR_housing_rentall[0]).toFixed(1)  + " (" + set_color_tag(KOR_housing_rentall[1].toFixed(2))[2] + ")\n"
  shareText += "ㆍ아파트 전세가격지수 : " + Number(KOR_housing_rentapt[0]).toFixed(1)  + " (" + set_color_tag(KOR_housing_rentapt[1].toFixed(2))[2] + ")\n"
  shareText += "\n"

  shareText += shareURL

  addon_html += "</div>"

  //심리지표
  KOR_consumermind = get_last_value(monthly_market['BOK_Mind_Consumer'])
  KOR_economymind = get_last_value(monthly_market['BOK_Mind_Economy'])

  addon_html += "<div class='hourly_container'>"

  addon_html += "<div class='hourly_header'>"
  addon_html += "<div class='hourly_title'>심리지표</div>"
  addon_html += "<div class='hourly_sub'>(전월대비)</div>"
  addon_html += "</div>"   

  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>소비자심리지수</div>"
  addon_html += "<div class = 'current_val'>" + Number(KOR_consumermind[0]).toFixed(1) + "</div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag(KOR_consumermind[1].toFixed(2))[0] + "</div>"    
  addon_html += "</div>"
  
  addon_html += "<div class='hourly_table2'>"
  addon_html += "<div class = 'item_name'>경제심리지수</div>"
  addon_html += "<div class = 'current_val'>" + Number(KOR_economymind[0]).toFixed(1) + "</div>"
  addon_html += "<div class = 'rate_val'>" + set_color_tag(KOR_economymind[1].toFixed(2))[0] + "</div>"    
  addon_html += "</div>"

  addon_html += "</div>"

  $('#hourly_area').append(addon_html);
}

function get_last_value(obj){
  arr = Object.values(obj)

  filtered_arr = arr.filter(function(item) {
    return item !== null && item !== undefined && item !== '';
  });

  last = filtered_arr[filtered_arr.length-1]
  prev = filtered_arr[filtered_arr.length-2]
  gap = last - prev
  rate = 1 - last/prev
  
  return [last, gap, rate]
}

function return_10year_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = arr_time.length-1 ; i > 0 ; i=i-60){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = "'" + arr_time[i].substr(2, 2) + "." + Number(arr_time[i].substr(5, 2)) + "/" + arr_time[i].substr(8, 2)
      all_arr_time.push(date)
    }    
  }
  return_arr_time = (all_arr_time.reverse()).slice(-60)
  return_arr_val = (all_arr_val.reverse()).slice(-60)

  return [return_arr_time, return_arr_val]
}

function return_10year_weekly_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = arr_time.length-1 ; i > 0 ; i--){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = "'" + arr_time[i].substr(2, 2) + "." + Number(arr_time[i].substr(5, 2))
      all_arr_time.push(date)
    }    
  }
  return_arr_time = all_arr_time.reverse().slice(-(52*10))
  return_arr_val = all_arr_val.reverse().slice(-(52*10))

  return [return_arr_time, return_arr_val]  
}

function return_10year_monthly_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = arr_time.length-1 ; i > 0 ; i = i-2){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = "'" + arr_time[i].substr(2, 2) + "." + Number(arr_time[i].substr(5, 2))
      all_arr_time.push(date)
    }    
  }
  return_arr_time = (all_arr_time.reverse()).slice(-60)
  return_arr_val = (all_arr_val.reverse()).slice(-60)

  return [return_arr_time, return_arr_val]  
}

function return_10year_yearly_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = arr_time.length-1 ; i > 0 ; i--){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = arr_time[i].substr(0, 4)
      all_arr_time.push(date)
    }    
  }
  return_arr_time = (all_arr_time.reverse())
  return_arr_val = (all_arr_val.reverse())

  return [return_arr_time, return_arr_val]  
}

function return_5year_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = arr_time.length-1 ; i > 0 ; i=i-30){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = "'" + arr_time[i].substr(2, 2) + "." + Number(arr_time[i].substr(5, 2)) + "/" + arr_time[i].substr(8, 2)
      all_arr_time.push(date)
    }    
  }
  return_arr_time = (all_arr_time.reverse()).slice(-60)
  return_arr_val = (all_arr_val.reverse()).slice(-60)

  return [return_arr_time, return_arr_val]
}

function return_5year_weekly_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = arr_time.length-1 ; i > 0 ; i--){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = "'" + arr_time[i].substr(2, 2) + "." + Number(arr_time[i].substr(5, 2))
      all_arr_time.push(date)
    }    
  }
  return_arr_time = all_arr_time.reverse().slice(-(52*5))
  return_arr_val = all_arr_val.reverse().slice(-(52*5))

  return [return_arr_time, return_arr_val]  
}

function return_5year_monthly_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = arr_time.length-1 ; i > 0 ; i--){    
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){      
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = "'" + arr_time[i].substr(2, 2) + "." + Number(arr_time[i].substr(5, 2))
      all_arr_time.push(date)
    }    
  }

  return_arr_time = (all_arr_time.reverse()).slice(-60)
  return_arr_val = (all_arr_val.reverse()).slice(-60)

  return [return_arr_time, return_arr_val]  
}


function return_3year_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = arr_time.length-1 ; i > 0 ; i=i-30){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = "'" + arr_time[i].substr(2, 2) + "." + Number(arr_time[i].substr(5, 2)) + "/" + arr_time[i].substr(8, 2)
      all_arr_time.push(date)
    }    
  }
  return_arr_time = (all_arr_time.reverse()).slice(-36)
  return_arr_val = (all_arr_val.reverse()).slice(-36)

  return [return_arr_time, return_arr_val]
}

function return_3year_monthly_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = arr_time.length-1 ; i > 0 ; i--){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = "'" + arr_time[i].substr(2, 2) + "." + Number(arr_time[i].substr(5, 2))
      all_arr_time.push(date)
    }    
  }
  return_arr_time = all_arr_time.reverse().slice(-36)
  return_arr_val = all_arr_val.reverse().slice(-36)

  return [return_arr_time, return_arr_val]  
}

function return_3year_weekly_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = arr_time.length-1 ; i > 0 ; i--){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = "'" + arr_time[i].substr(2, 2) + "." + Number(arr_time[i].substr(5, 2))
      all_arr_time.push(date)
    }    
  }
  return_arr_time = all_arr_time.reverse().slice(-(52*3))
  return_arr_val = all_arr_val.reverse().slice(-(52*3))

  return [return_arr_time, return_arr_val]  
}


function return_1year_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = arr_time.length-1 ; i > 0 ; i=i-6){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = "'" + arr_time[i].substr(2, 2) + "." + Number(arr_time[i].substr(5, 2)) + "/" + arr_time[i].substr(8, 2)
      all_arr_time.push(date)
    }    
  }
  return_arr_time = (all_arr_time.reverse()).slice(-46)
  return_arr_val = (all_arr_val.reverse()).slice(-46)

  return [return_arr_time, return_arr_val]  
}

function return_1year_weekly_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = arr_time.length-1 ; i > 0 ; i--){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = "'" + arr_time[i].substr(2, 2) + "." + Number(arr_time[i].substr(5, 2))
      all_arr_time.push(date)
    }    
  }
  return_arr_time = all_arr_time.reverse().slice(-52)
  return_arr_val = all_arr_val.reverse().slice(-52)

  return [return_arr_time, return_arr_val]  
}

function return_1year_monthly_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = arr_time.length-1 ; i > 0 ; i--){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = "'" + arr_time[i].substr(2, 2) + "." + Number(arr_time[i].substr(5, 2))
      all_arr_time.push(date)
    }    
  }
  return_arr_time = all_arr_time.reverse().slice(-12)
  return_arr_val = all_arr_val.reverse().slice(-12)

  return [return_arr_time, return_arr_val]  
}

function return_6month_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []  

  for(var i = arr_time.length-1 ; i > 0 ; i=i-6){    
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){      
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = "'" + arr_time[i].substr(2, 2) + "." + Number(arr_time[i].substr(5, 2)) + "/" + arr_time[i].substr(8, 2)
      all_arr_time.push(date)
    }
  }  

  return_arr_time = (all_arr_time.reverse()).slice(-25)
  return_arr_val = (all_arr_val.reverse()).slice(-25)

  return [return_arr_time, return_arr_val]
}

function return_3month_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = 0 ; i < arr_time.length ; i++){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = Number(arr_time[i].substr(5, 2)) + "." + arr_time[i].substr(8, 2)
      all_arr_time.push(date)
    }    
  }
  return_arr_time = all_arr_time.slice(-90)
  return_arr_val = all_arr_val.slice(-90)

  return [return_arr_time, return_arr_val]  
}

function return_1month_arr(obj_val, obj_time){
  var arr_val = Object.values(obj_val)
  var arr_time = Object.values(obj_time)

  var all_arr_time = []
  var all_arr_val = []

  for(var i = 0 ; i < arr_time.length ; i++){
    if(Number(arr_val[i]) != 0 || arr_val[i] != undefined || arr_val[i] != null){
      value = Number(arr_val[i])
      all_arr_val.push(value)
      date = Number(arr_time[i].substr(5, 2)) + "." + arr_time[i].substr(8, 2)
      all_arr_time.push(date)
    }    
  }
  return_arr_time = all_arr_time.slice(-30)
  return_arr_val = all_arr_val.slice(-30)

  return [return_arr_time, return_arr_val]  
}

function return_MoneyFlow_time(obj_val, duration){
  var arr_val = Object.values(obj_val)

  return_arr_val = ""

  if(duration == '1Y'){
    return_arr_val = arr_val.slice(-12) 
  }
  if(duration == '3Y'){
    return_arr_val = arr_val.slice(-36)
  }
  if(duration == '5Y'){
    return_arr_val = arr_val.slice(-60)
  }
  if(duration == '10Y'){
    return_arr_val = arr_val
  }

  return return_arr_val
}

function return_MoneyFlow_arr(obj_val, duration){
  var arr_val = Object.values(obj_val)

  return_arr_val = ""

  if(duration == '1Y'){
    return_arr_val = arr_val.slice(-13) 
  }
  if(duration == '3Y'){
    return_arr_val = arr_val.slice(-36)
  }
  if(duration == '5Y'){
    return_arr_val = arr_val.slice(-60)
  }
  if(duration == '10Y'){
    return_arr_val = arr_val
  }

  return_arr_val = return_arr_val.map( x => {    
    x = Math.round(x*1000) / 1000
    return x
  })

  return return_arr_val
}

function goScroll(dest_id){
  dest = menu_position[dest_id]
  if(dest_id == 0){
    $('#graph_area').animate( {scrollTop: (dest-200)}, 350 )
  }
  else{
    $('#graph_area').animate( {scrollTop: (dest-145)}, 350 )
  }
  
  return false;
}

var menu_all = ['Money_Flow', 'KO_Stock', 'US_Stock', 'Currency', 'Coin', 'Material', 'Oil', 'Bond_Rate', 'Interest', 'External_Money', 'Bond', 'Trade', 'Income', 'Real_Estate', 'Mind']
var menu_position = []
var menu_current_position = []

function return_last_value_rate(obj, val, index){
  value_arr = Object.values(obj)

  last_value_rate = (val / value_arr[index]).toFixed(2)
  return Number(last_value_rate)
}

function show_daily_info(){
  shortcut_html = ""  
  shortcut_html += "<div id='shortcut_menu_pro'>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_Money_Flow' onClick='goScroll(0)' checked><label class='btn btn-outline-danger' id='label_Money_Flow' for='shortcut_Money_Flow'>#MoneyFlow</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_KO_Stock' onClick='goScroll(1)' ><label class='btn btn-outline-danger' id='label_KO_Stock' for='shortcut_KO_Stock'>#국내 증시</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_US_Stock' onClick='goScroll(2)'><label class='btn btn-outline-danger' id='label_US_Stock' for='shortcut_US_Stock'>#미국 증시</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_Currency' onClick='goScroll(3)'><label class='btn btn-outline-danger' id='label_Currency' for='shortcut_Currency'>#환율</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_Coin' onClick='goScroll(4)'><label class='btn btn-outline-danger' id='label_Coin' for='shortcut_Coin'>#코인</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_Material' onClick='goScroll(5)'><label class='btn btn-outline-danger' id='label_Material' for='shortcut_Material'>#금 / 원자재</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_Oil' onClick='goScroll(6)'><label class='btn btn-outline-danger' id='label_Oil' for='shortcut_Oil'>#국제 유가</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_Bond_Rate' onClick='goScroll(7)'><label class='btn btn-outline-danger' id='label_Bond_Rate' for='shortcut_Bond_Rate'>#채권 수익률</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_Interest' onClick='goScroll(8)'><label class='btn btn-outline-danger' id='label_Interest' for='shortcut_Interest'>#금리</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_External_Money' onClick='goScroll(9)'><label class='btn btn-outline-danger' id='label_External_Money' for='shortcut_External_Money'>#M0 / 외환보유</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_Bond' onClick='goScroll(10)'><label class='btn btn-outline-danger' id='label_Bond' for='shortcut_Bond'>#채권</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_Trade' onClick='goScroll(11)'><label class='btn btn-outline-danger' id='label_Trade' for='shortcut_Trade'>#무역</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_Income' onClick='goScroll(12)'><label class='btn btn-outline-danger' id='label_Income' for='shortcut_Income'>#소득</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_Real_Estate' onClick='goScroll(13)'><label class='btn btn-outline-danger' id='label_Real_Estate' for='shortcut_Real_Estate'>#부동산</label></div>"
    shortcut_html +="<div><input type='radio' class='btnRadioMenu' name='shortcut_menu_list' autocomplete='off' id='shortcut_Mind' onClick='goScroll(14)'><label class='btn btn-outline-danger' id='label_Mind' for='shortcut_Mind'>#심리지표</label></div>"
  shortcut_html +="</div>"  
  
  $('#shortcut').append(shortcut_html);
  
  addon_html = ""  
  //MONEY FLOW

  value_arr = Object.values(moneyflow_market['TIME'])
  value_index = value_arr.indexOf('2019-06-01')

  mf_time_arr = return_MoneyFlow_time(moneyflow_market['TIME'], "5Y")

  mf_us_total_asset = return_MoneyFlow_arr( moneyflow_market['FRED_Total_Asset_NOR'], "5Y" )
  mf_ko_total_asset = return_MoneyFlow_arr( moneyflow_market['BOK_Total_Asset_NOR'], "5Y" )

  mf_oil_wti = return_MoneyFlow_arr( moneyflow_market['FRED_WTI_NOR'], "5Y" )
  mf_oil_dubai = return_MoneyFlow_arr( moneyflow_market['FRED_Dubai_NOR'], "5Y" )

  mf_metal_gold = return_MoneyFlow_arr( moneyflow_market['yf_Gold_NOR'], "5Y" )

  mf_housing_trade_all = return_MoneyFlow_arr( moneyflow_market['BOK_Housing_Trade_All_NOR'], "5Y" )
  mf_housing_trade_apt = return_MoneyFlow_arr( moneyflow_market['BOK_Housing_Trade_Apt_NOR'], "5Y" )
  mf_housing_apt_price = return_MoneyFlow_arr( moneyflow_market['KOR_APT_PRICE_NOR'], "5Y" )

  mf_us_nas = return_MoneyFlow_arr( moneyflow_market['yf_NASDAQ_NOR'], "5Y" )
  mf_us_snp = return_MoneyFlow_arr( moneyflow_market['yf_SNP_NOR'], "5Y" )
  mf_us_dow = return_MoneyFlow_arr( moneyflow_market['yf_DOW_NOR'], "5Y" )  

  mf_ko_kospi = return_MoneyFlow_arr( moneyflow_market['yf_KOSPI_NOR'], "5Y" )
  mf_ko_kosdaq = return_MoneyFlow_arr( moneyflow_market['yf_KOSDAQ_NOR'], "5Y" )
  mf_ko_kospi_kosdaq = return_MoneyFlow_arr( moneyflow_market['yf_KOSPI_KOSDAQ_NOR'], "5Y" )

  mf_currency_USDKRW = return_MoneyFlow_arr( moneyflow_market['BOK_Currency_US_NOR'], "5Y" )
  mf_currency_JPYKRW = return_MoneyFlow_arr( moneyflow_market['BOK_Currency_JP_NOR'], "5Y" )

  mf_coin_btc = return_MoneyFlow_arr( moneyflow_market['yf_BTCUSD_NOR'], "5Y" )

  mf_time_arr.push("현재")
  mf_oil_wti.push( return_last_value_rate(moneyflow_market['FRED_WTI'], hourly_market['WTI']['value'], value_index) )
  mf_oil_dubai.push( return_last_value_rate(moneyflow_market['FRED_Dubai'], hourly_market['Dubai']['value'], value_index) )
  Gold_hourly_val = (hourly_market['YF_Gold']['value']).replaceAll(",", "")
  mf_metal_gold.push( return_last_value_rate(moneyflow_market['yf_Gold'], Number(Gold_hourly_val), value_index) )
  mf_us_nas.push( return_last_value_rate(moneyflow_market['yf_NASDAQ'], hourly_market['NAS']['value'], value_index) )
  mf_us_snp.push( return_last_value_rate(moneyflow_market['yf_SNP'], hourly_market['SNP']['value'], value_index) )
  mf_us_dow.push( return_last_value_rate(moneyflow_market['yf_DOW'], hourly_market['DOW']['value'], value_index) )
  mf_ko_kospi.push( return_last_value_rate(moneyflow_market['yf_KOSPI'], hourly_market['KOSPI']['value'], value_index) )
  mf_ko_kosdaq.push( return_last_value_rate(moneyflow_market['yf_KOSDAQ'], hourly_market['KOSDAQ']['value'], value_index) )
  mf_ko_kospi_kosdaq.push( return_last_value_rate(moneyflow_market['yf_KOSPI_KOSDAQ'], hourly_market['KOSPI']['value']+hourly_market['KOSDAQ']['value'], value_index) )
  mf_currency_USDKRW.push( return_last_value_rate(moneyflow_market['BOK_Currency_US'], hourly_market['USDKRW']['value'], value_index) )
  mf_currency_JPYKRW.push( return_last_value_rate(moneyflow_market['BOK_Currency_JP'], hourly_market['JPYKRW']['value'], value_index) )
  mf_coin_btc.push( return_last_value_rate(moneyflow_market['yf_BTCUSD'], hourly_market['USDT-BTC']['value'], value_index) )

  moneyflow_dataset = [mf_us_total_asset, mf_ko_total_asset, mf_oil_wti, mf_oil_dubai, mf_metal_gold, mf_housing_trade_all, mf_housing_trade_apt, mf_housing_apt_price, mf_us_nas, mf_us_dow, mf_us_snp, mf_ko_kospi, mf_ko_kosdaq, mf_ko_kospi_kosdaq, mf_currency_USDKRW, mf_currency_JPYKRW, mf_coin_btc]  

  addon_html += "<div class='daily_header_mf' id='Money_Flow'>"
  addon_html += "<div class='daily_title_mf'>"
    addon_html += "<div><img src='MoneyFlow.svg' height='15px' width='50px' /> MoneyFlow <span style='font-size: 0.7em'> (2019년 6월 = 1.00)</span></div>"    
    addon_html += "<div class='subSelection'>"              
      addon_html += "<div></div>"
      addon_html += "<div></div>"
      addon_html += "<div></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='MONEY_FLOW' autocomplete='off' id='redraw_1Y_MONEY_FLOW' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_MONEY_FLOW'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='MONEY_FLOW' autocomplete='off' id='redraw_3Y_MONEY_FLOW' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_MONEY_FLOW'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='MONEY_FLOW' autocomplete='off' id='redraw_5Y_MONEY_FLOW' onClick='redraw_graph(this, \"5Y\")' checked><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_MONEY_FLOW'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='MONEY_FLOW' autocomplete='off' id='redraw_10Y_MONEY_FLOW' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_MONEY_FLOW'>10Y</label></div>"
    addon_html += "</div>"
    addon_html += "<div class='daily_sub_mf'>" + moneyflow_updated + "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph_item_mf'>"
      addon_html += "<div class='graph_mf'> <canvas id='MoneyFlow_Chart'></canvas></div>"  
  addon_html += "</div>"
addon_html += "</div>"  

//국내 증시 
    addon_html += "<div class='daily_header' id='KO_Stock'>"
        addon_html += "<div class='daily_title'>국내 증시</div>"
        addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"

        //코스피
        KOR_KOSPI_arr = return_1month_arr(daily_market['yf_KOSPI'], daily_market['TIME'])
        KOR_KOSPI_time_arr = KOR_KOSPI_arr[0]
        KOR_KOSPI_val_arr = KOR_KOSPI_arr[1]   
        
        KOR_KOSPI_time_arr.push('현재')
        KOR_KOSPI_val_arr.push(hourly_market['KOSPI']['value'])          

        addon_html += "<div class='graph_item'>"
          addon_html += "<div class='subRegion_title'>"
          addon_html += "<div class='subRegion_name'>코스피</div>"
          val_direction = get_direction(hourly_market['KOSPI']['rate'])
            addon_html += "<div class='subValue'>"
              addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['KOSPI']['value'].toFixed(2), val_direction) + "</span></div>"
              addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['KOSPI']['diff'].toFixed(2))[0] + "</span></div>"
              addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['KOSPI']['rate'].toFixed(2))[0] + "%</span></div>"
            addon_html += "</div>"
            addon_html += "<div class='subSelection'>"              
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI' autocomplete='off' id='redraw_1M_KOSPI' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_KOSPI'>1M</label></div>"
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI' autocomplete='off' id='redraw_3M_KOSPI' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_KOSPI'>3M</label></div>"
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI' autocomplete='off' id='redraw_6M_KOSPI' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_KOSPI'>6M</label></div>"
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI' autocomplete='off' id='redraw_1Y_KOSPI' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KOSPI'>1Y</label></div>"
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI' autocomplete='off' id='redraw_3Y_KOSPI' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KOSPI'>3Y</label></div>"
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI' autocomplete='off' id='redraw_5Y_KOSPI' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KOSPI'>5Y</label></div>"
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI' autocomplete='off' id='redraw_10Y_KOSPI' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KOSPI'>10Y</label></div>"
            addon_html += "</div>"
          addon_html += "</div>"

            addon_html += "<div class='graph'> <canvas id='KOSPI_Chart'></canvas></div>"
        
        addon_html += "</div>"

      //코스닥
      KOR_KOSDAQ_arr = return_1month_arr(daily_market['yf_KOSDAQ'], daily_market['TIME'])
      KOR_KOSDAQ_time_arr = KOR_KOSDAQ_arr[0]
      KOR_KOSDAQ_val_arr = KOR_KOSDAQ_arr[1]

      KOR_KOSDAQ_time_arr.push('현재')
      KOR_KOSDAQ_val_arr.push(hourly_market['KOSDAQ']['value'])        

      addon_html += "<div class='graph_item'>"
          addon_html += "<div class='subRegion_title'>"
          addon_html += "<div class='subRegion_name'>코스닥</div>"
          val_direction = get_direction(hourly_market['KOSDAQ']['rate'])
            addon_html += "<div class='subValue'>"
              addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['KOSDAQ']['value'].toFixed(2), val_direction) + "</span></div>"
              addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['KOSDAQ']['diff'].toFixed(2))[0] + "</span></div>"
              addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['KOSDAQ']['rate'].toFixed(2))[0] + "%</span></div>"
            addon_html += "</div>"
            addon_html += "<div class='subSelection'>"              
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSDAQ' autocomplete='off' id='redraw_1M_KOSDAQ' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_KOSDAQ'>1M</label></div>"
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSDAQ' autocomplete='off' id='redraw_3M_KOSDAQ' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_KOSDAQ'>3M</label></div>"
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSDAQ' autocomplete='off' id='redraw_6M_KOSDAQ' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_KOSDAQ'>6M</label></div>"
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSDAQ' autocomplete='off' id='redraw_1Y_KOSDAQ' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KOSDAQ'>1Y</label></div>"
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSDAQ' autocomplete='off' id='redraw_3Y_KOSDAQ' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KOSDAQ'>3Y</label></div>"
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSDAQ' autocomplete='off' id='redraw_5Y_KOSDAQ' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KOSDAQ'>5Y</label></div>"
              addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSDAQ' autocomplete='off' id='redraw_10Y_KOSDAQ' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KOSDAQ'>10Y</label></div>"
            addon_html += "</div>"
          addon_html += "</div>"

            addon_html += "<div class='graph'> <canvas id='KOSDAQ_Chart'></canvas></div>"
        
        addon_html += "</div>"

        //코스피200
        KOR_KOSPI200_arr = return_1month_arr(daily_market['yf_KOSPI200'], daily_market['TIME'])
        KOR_KOSPI200_time_arr = KOR_KOSPI200_arr[0]
        KOR_KOSPI200_val_arr = KOR_KOSPI200_arr[1]

        KOR_KOSPI200_time_arr.push('현재')
        KOR_KOSPI200_val_arr.push(hourly_market['KOSPI200']['value'])          

        addon_html += "<div class='graph_item'>"
            addon_html += "<div class='subRegion_title'>"
            addon_html += "<div class='subRegion_name'>코스피200</div>"
            val_direction = get_direction(hourly_market['KOSPI200']['rate'])
              addon_html += "<div class='subValue'>"
                addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['KOSPI200']['value'].toFixed(2), val_direction) + "</span></div>"
                addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['KOSPI200']['diff'].toFixed(2))[0] + "</span></div>"
                addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['KOSPI200']['rate'].toFixed(2))[0] + "%</span></div>"
              addon_html += "</div>"
              addon_html += "<div class='subSelection'>"              
                addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI200' autocomplete='off' id='redraw_1M_KOSPI200' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_KOSPI200'>1M</label></div>"
                addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI200' autocomplete='off' id='redraw_3M_KOSPI200' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_KOSPI200'>3M</label></div>"
                addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI200' autocomplete='off' id='redraw_6M_KOSPI200' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_KOSPI200'>6M</label></div>"
                addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI200' autocomplete='off' id='redraw_1Y_KOSPI200' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KOSPI200'>1Y</label></div>"
                addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI200' autocomplete='off' id='redraw_3Y_KOSPI200' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KOSPI200'>3Y</label></div>"
                addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI200' autocomplete='off' id='redraw_5Y_KOSPI200' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KOSPI200'>5Y</label></div>"
                addon_html += "<div><input type='radio' class='btnRadio' name='KOR_KOSPI200' autocomplete='off' id='redraw_10Y_KOSPI200' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KOSPI200'>10Y</label></div>"
              addon_html += "</div>"
            addon_html += "</div>"

              addon_html += "<div class='graph'> <canvas id='KOSPI200_Chart'></canvas></div>"
          
          addon_html += "</div>"
    addon_html += "</div>"

  //미국 증시
  //addon_html += "<div class='graph_container' id='US_Stock'>"  

    addon_html += "<div class='daily_header' id='US_Stock'>"
    addon_html += "<div class='daily_title'>미국 증시</div>"
    addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"

    //다우존스
    US_DOW_arr = return_1month_arr(daily_market['yf_DOW'], daily_market['TIME'])
    US_DOW_time_arr = US_DOW_arr[0]
    US_DOW_val_arr = US_DOW_arr[1]

    US_DOW_time_arr.push('현재')
    US_DOW_val_arr.push(hourly_market['DOW']['value'])      

    addon_html += "<div class='graph_item'>"
      addon_html += "<div class='subRegion_title'>"
      addon_html += "<div class='subRegion_name'>다우존스</div>"
      val_direction = get_direction(hourly_market['DOW']['rate'])
        addon_html += "<div class='subValue'>"
          addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['DOW']['value'].toFixed(2), val_direction) + "</span></div>"
          addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['DOW']['diff'].toFixed(2))[0] + "</span></div>"
          addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['DOW']['rate'].toFixed(2))[0] + "%</span></div>"
        addon_html += "</div>"
        addon_html += "<div class='subSelection'>"              
          addon_html += "<div><input type='radio' class='btnRadio' name='US_DOW' autocomplete='off' id='redraw_1M_DOW' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_DOW'>1M</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_DOW' autocomplete='off' id='redraw_3M_DOW' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_DOW'>3M</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_DOW' autocomplete='off' id='redraw_6M_DOW' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_DOW'>6M</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_DOW' autocomplete='off' id='redraw_1Y_DOW' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_DOW'>1Y</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_DOW' autocomplete='off' id='redraw_3Y_DOW' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_DOW'>3Y</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_DOW' autocomplete='off' id='redraw_5Y_DOW' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_DOW'>5Y</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_DOW' autocomplete='off' id='redraw_10Y_DOW' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_DOW'>10Y</label></div>"
        addon_html += "</div>"
      addon_html += "</div>"

      addon_html += "<div class='graph'> <canvas id='DOW_Chart'></canvas></div>"
    
    addon_html += "</div>"

    //나스닥
    US_NASDAQ_arr = return_1month_arr(daily_market['yf_NASDAQ'], daily_market['TIME'])
    US_NASDAQ_time_arr = US_NASDAQ_arr[0]
    US_NASDAQ_val_arr = US_NASDAQ_arr[1]

    US_NASDAQ_time_arr.push('현재')
    US_NASDAQ_val_arr.push(hourly_market['NAS']['value'])      

    addon_html += "<div class='graph_item'>"
      addon_html += "<div class='subRegion_title'>"
      addon_html += "<div class='subRegion_name'>나스닥</div>"
      val_direction = get_direction(hourly_market['NAS']['rate'])
        addon_html += "<div class='subValue'>"
          addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['NAS']['value'].toFixed(2), val_direction) + "</span></div>"
          addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['NAS']['diff'].toFixed(2))[0] + "</span></div>"
          addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['NAS']['rate'].toFixed(2))[0] + "%</span></div>"
        addon_html += "</div>"
        addon_html += "<div class='subSelection'>"              
          addon_html += "<div><input type='radio' class='btnRadio' name='US_NASDAQ' autocomplete='off' id='redraw_1M_NASDAQ' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_NASDAQ'>1M</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_NASDAQ' autocomplete='off' id='redraw_3M_NASDAQ' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_NASDAQ'>3M</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_NASDAQ' autocomplete='off' id='redraw_6M_NASDAQ' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_NASDAQ'>6M</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_NASDAQ' autocomplete='off' id='redraw_1Y_NASDAQ' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_NASDAQ'>1Y</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_NASDAQ' autocomplete='off' id='redraw_3Y_NASDAQ' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_NASDAQ'>3Y</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_NASDAQ' autocomplete='off' id='redraw_5Y_NASDAQ' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_NASDAQ'>5Y</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_NASDAQ' autocomplete='off' id='redraw_10Y_NASDAQ' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_NASDAQ'>10Y</label></div>"
        addon_html += "</div>"
      addon_html += "</div>"

      addon_html += "<div class='graph'> <canvas id='NASDAQ_Chart'></canvas></div>"
    
    addon_html += "</div>"

    //S&P500
    US_SNP_arr = return_1month_arr(daily_market['yf_SNP'], daily_market['TIME'])
    US_SNP_time_arr = US_SNP_arr[0]
    US_SNP_val_arr = US_SNP_arr[1]

    US_SNP_time_arr.push('현재')
    US_SNP_val_arr.push(hourly_market['SNP']['value'])      

    addon_html += "<div class='graph_item'>"
      addon_html += "<div class='subRegion_title'>"
      addon_html += "<div class='subRegion_name'>S&P500</div>"
      val_direction = get_direction(hourly_market['SNP']['rate'])
        addon_html += "<div class='subValue'>"
          addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['SNP']['value'].toFixed(2), val_direction) + "</span></div>"
          addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['SNP']['diff'].toFixed(2))[0] + "</span></div>"
          addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['SNP']['rate'].toFixed(2))[0] + "%</span></div>"
        addon_html += "</div>"
        addon_html += "<div class='subSelection'>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_SNP' autocomplete='off' id='redraw_1M_SNP' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_SNP'>1M</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_SNP' autocomplete='off' id='redraw_3M_SNP' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_SNP'>3M</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_SNP' autocomplete='off' id='redraw_6M_SNP' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_SNP'>6M</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_SNP' autocomplete='off' id='redraw_1Y_SNP' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_SNP'>1Y</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_SNP' autocomplete='off' id='redraw_3Y_SNP' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_SNP'>3Y</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_SNP' autocomplete='off' id='redraw_5Y_SNP' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_SNP'>5Y</label></div>"
          addon_html += "<div><input type='radio' class='btnRadio' name='US_SNP' autocomplete='off' id='redraw_10Y_SNP' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_SNP'>10Y</label></div>"
        addon_html += "</div>"
      addon_html += "</div>"

      addon_html += "<div class='graph'> <canvas id='SNP_Chart'></canvas></div>"
    
    addon_html += "</div>"
  addon_html += "</div>"
  
//환율
//addon_html += "<div class='graph_container'>"  

addon_html += "<div class='daily_header' id='Currency'>"
addon_html += "<div class='daily_title'>환율</div>"
addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"

//USDKRW
USDKRW_arr = return_1month_arr(daily_market['BOK_Currency_US'], daily_market['TIME'])
USDKRW_time_arr = USDKRW_arr[0]
USDKRW_val_arr = USDKRW_arr[1]

USDKRW_time_arr.push('현재')
USDKRW_val_arr.push(hourly_market['USDKRW']['value'])

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title'>"
  addon_html += "<div class='subRegion_name'>달러→원</div>"
  val_direction = get_direction(hourly_market['USDKRW']['rate'])
    addon_html += "<div class='subValue'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['USDKRW']['value'].toFixed(2), val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['USDKRW']['diff'].toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['USDKRW']['rate'].toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
    addon_html += "<div class='subSelection'>"              
      addon_html += "<div><input type='radio' class='btnRadio' name='USDKRW' autocomplete='off' id='redraw_1M_USDKRW' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_USDKRW'>1M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='USDKRW' autocomplete='off' id='redraw_3M_USDKRW' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_USDKRW'>3M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='USDKRW' autocomplete='off' id='redraw_6M_USDKRW' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_USDKRW'>6M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='USDKRW' autocomplete='off' id='redraw_1Y_USDKRW' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_USDKRW'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='USDKRW' autocomplete='off' id='redraw_3Y_USDKRW' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_USDKRW'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='USDKRW' autocomplete='off' id='redraw_5Y_USDKRW' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_USDKRW'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='USDKRW' autocomplete='off' id='redraw_10Y_USDKRW' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_USDKRW'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='USDKRW_Chart'></canvas></div>"

addon_html += "</div>"

//JPYKRW
JPYKRW_arr = return_1month_arr(daily_market['BOK_Currency_JP'], daily_market['TIME'])
JPYKRW_time_arr = JPYKRW_arr[0]
JPYKRW_val_arr = JPYKRW_arr[1]

JPYKRW_time_arr.push('현재')
JPYKRW_val_arr.push(hourly_market['JPYKRW']['value'])

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title'>"
  addon_html += "<div class='subRegion_name'>100엔→원</div>"
  val_direction = get_direction(hourly_market['JPYKRW']['rate'])
    addon_html += "<div class='subValue'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['JPYKRW']['value'].toFixed(2), val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['JPYKRW']['diff'].toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['JPYKRW']['rate'].toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
    addon_html += "<div class='subSelection'>"              
      addon_html += "<div><input type='radio' class='btnRadio' name='JPYKRW' autocomplete='off' id='redraw_1M_JPYKRW' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_JPYKRW'>1M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='JPYKRW' autocomplete='off' id='redraw_3M_JPYKRW' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_JPYKRW'>3M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='JPYKRW' autocomplete='off' id='redraw_6M_JPYKRW' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_JPYKRW'>6M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='JPYKRW' autocomplete='off' id='redraw_1Y_JPYKRW' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_JPYKRW'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='JPYKRW' autocomplete='off' id='redraw_3Y_JPYKRW' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_JPYKRW'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='JPYKRW' autocomplete='off' id='redraw_5Y_JPYKRW' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_JPYKRW'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='JPYKRW' autocomplete='off' id='redraw_10Y_JPYKRW' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_JPYKRW'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='JPYKRW_Chart'></canvas></div>"

addon_html += "</div>"

//EURKRW
EURKRW_arr = return_1month_arr(daily_market['BOK_Currency_EU'], daily_market['TIME'])
EURKRW_time_arr = EURKRW_arr[0]
EURKRW_val_arr = EURKRW_arr[1]

EURKRW_time_arr.push('현재')
EURKRW_val_arr.push(hourly_market['EURKRW']['value'])

  addon_html += "<div class='graph_item'>"
    addon_html += "<div class='subRegion_title'>"
    addon_html += "<div class='subRegion_name'>유로→원</div>"
    val_direction = get_direction(hourly_market['EURKRW']['rate'])
      addon_html += "<div class='subValue'>"
        addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['EURKRW']['value'].toFixed(2), val_direction) + "</span></div>"
        addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['EURKRW']['diff'].toFixed(2))[0] + "</span></div>"
        addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['EURKRW']['rate'].toFixed(2))[0] + "%</span></div>"
      addon_html += "</div>"
      addon_html += "<div class='subSelection'>"              
        addon_html += "<div><input type='radio' class='btnRadio' name='EURKRW' autocomplete='off' id='redraw_1M_EURKRW' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_EURKRW'>1M</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='EURKRW' autocomplete='off' id='redraw_3M_EURKRW' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_EURKRW'>3M</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='EURKRW' autocomplete='off' id='redraw_6M_EURKRW' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_EURKRW'>6M</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='EURKRW' autocomplete='off' id='redraw_1Y_EURKRW' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_EURKRW'>1Y</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='EURKRW' autocomplete='off' id='redraw_3Y_EURKRW' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_EURKRW'>3Y</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='EURKRW' autocomplete='off' id='redraw_5Y_EURKRW' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_EURKRW'>5Y</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='EURKRW' autocomplete='off' id='redraw_10Y_EURKRW' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_EURKRW'>10Y</label></div>"
      addon_html += "</div>"
    addon_html += "</div>"

    addon_html += "<div class='graph'> <canvas id='EURKRW_Chart'></canvas></div>"

  addon_html += "</div>"

//달러인덱스
Dollar_Index_arr = return_1month_arr(daily_market['yf_Dollar_Index'], daily_market['TIME'])
Dollar_Index_time_arr = Dollar_Index_arr[0]
Dollar_Index_val_arr = Dollar_Index_arr[1]

Dollar_Index_time_arr.push('현재')
Dollar_Index_val_arr.push(hourly_market['Dollar_Index']['value'])

  addon_html += "<div class='graph_item'>"
    addon_html += "<div class='subRegion_title'>"
    addon_html += "<div class='subRegion_name'>달러 인덱스</div>"
    val_direction = get_direction(hourly_market['Dollar_Index']['rate'])
      addon_html += "<div class='subValue'>"
        addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['Dollar_Index']['value'], val_direction) + "</span></div>"
        addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['Dollar_Index']['diff'])[0] + "</span></div>"
        addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['Dollar_Index']['rate'])[0] + "%</span></div>"
      addon_html += "</div>"
      addon_html += "<div class='subSelection'>"              
        addon_html += "<div><input type='radio' class='btnRadio' name='Dollar_Index' autocomplete='off' id='redraw_1M_Dollar_Index' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_Dollar_Index'>1M</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='Dollar_Index' autocomplete='off' id='redraw_3M_Dollar_Index' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_Dollar_Index'>3M</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='Dollar_Index' autocomplete='off' id='redraw_6M_Dollar_Index' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_Dollar_Index'>6M</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='Dollar_Index' autocomplete='off' id='redraw_1Y_Dollar_Index' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Dollar_Index'>1Y</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='Dollar_Index' autocomplete='off' id='redraw_3Y_Dollar_Index' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Dollar_Index'>3Y</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='Dollar_Index' autocomplete='off' id='redraw_5Y_Dollar_Index' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Dollar_Index'>5Y</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='Dollar_Index' autocomplete='off' id='redraw_10Y_Dollar_Index' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Dollar_Index'>10Y</label></div>"
      addon_html += "</div>"
    addon_html += "</div>"

    addon_html += "<div class='graph'><canvas id='Dollar_Index_Chart'></canvas></div>"

  addon_html += "</div>"  
addon_html += "</div>"


//코인
  //addon_html += "<div class='graph_container'>"  

  addon_html += "<div class='daily_header' id='Coin'>"
  addon_html += "<div class='daily_title'>코인</div>"
  addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"

  //BTCUSD
  BTCUSD_arr = return_1month_arr(daily_market['yf_BTCUSD'], daily_market['TIME'])
  BTCUSD_time_arr = BTCUSD_arr[0]
  BTCUSD_val_arr = BTCUSD_arr[1]

  BTCUSD_time_arr.push('현재')
  BTCUSD_val_arr.push(hourly_market['USDT-BTC']['value'])

  addon_html += "<div class='graph_item'>"
    addon_html += "<div class='subRegion_title'>"
    addon_html += "<div class='subRegion_name'>비트코인</div>"
    val_direction = get_direction(hourly_market['USDT-BTC']['rate'])
      addon_html += "<div class='subValue'>"
        addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['USDT-BTC']['value'].toFixed(2), val_direction) + "</span></div>"
        addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['USDT-BTC']['diff'].toFixed(2))[0] + "</span></div>"
        addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['USDT-BTC']['rate'].toFixed(2))[0] + "%</span></div>"
      addon_html += "</div>"
      addon_html += "<div class='subSelection'>"
        addon_html += "<div><input type='radio' class='btnRadio' name='BTCUSD' autocomplete='off' id='redraw_1M_BTCUSD' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_BTCUSD'>1M</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='BTCUSD' autocomplete='off' id='redraw_3M_BTCUSD' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_BTCUSD'>3M</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='BTCUSD' autocomplete='off' id='redraw_6M_BTCUSD' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_BTCUSD'>6M</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='BTCUSD' autocomplete='off' id='redraw_1Y_BTCUSD' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_BTCUSD'>1Y</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='BTCUSD' autocomplete='off' id='redraw_3Y_BTCUSD' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_BTCUSD'>3Y</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='BTCUSD' autocomplete='off' id='redraw_5Y_BTCUSD' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_BTCUSD'>5Y</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='BTCUSD' autocomplete='off' id='redraw_10Y_BTCUSD' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_BTCUSD'>10Y</label></div>"
      addon_html += "</div>"
    addon_html += "</div>"

    addon_html += "<div class='graph'> <canvas id='BTCUSD_Chart'></canvas></div>"

  addon_html += "</div>"

  //ETHUSD
  ETHUSD_arr = return_1month_arr(daily_market['yf_ETHUSD'], daily_market['TIME'])
  ETHUSD_time_arr = ETHUSD_arr[0]
  ETHUSD_val_arr = ETHUSD_arr[1]

  ETHUSD_time_arr.push('현재')
  ETHUSD_val_arr.push(hourly_market['USDT-ETH']['value'])

  addon_html += "<div class='graph_item'>"
    addon_html += "<div class='subRegion_title'>"
    addon_html += "<div class='subRegion_name'>이더리움</div>"
    val_direction = get_direction(hourly_market['USDT-ETH']['rate'])
      addon_html += "<div class='subValue'>"
        addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['USDT-ETH']['value'].toFixed(2), val_direction) + "</span></div>"
        addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['USDT-ETH']['diff'].toFixed(2))[0] + "</span></div>"
        addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['USDT-ETH']['rate'].toFixed(2))[0] + "%</span></div>"
      addon_html += "</div>"
      addon_html += "<div class='subSelection'>"              
        addon_html += "<div></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='ETHUSD' autocomplete='off' id='redraw_1M_ETHUSD' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_ETHUSD'>1M</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='ETHUSD' autocomplete='off' id='redraw_3M_ETHUSD' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_ETHUSD'>3M</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='ETHUSD' autocomplete='off' id='redraw_6M_ETHUSD' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_ETHUSD'>6M</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='ETHUSD' autocomplete='off' id='redraw_1Y_ETHUSD' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_ETHUSD'>1Y</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='ETHUSD' autocomplete='off' id='redraw_3Y_ETHUSD' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_ETHUSD'>3Y</label></div>"
        addon_html += "<div><input type='radio' class='btnRadio' name='ETHUSD' autocomplete='off' id='redraw_5Y_ETHUSD' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_ETHUSD'>5Y</label></div>"        
      addon_html += "</div>"
    addon_html += "</div>"

    addon_html += "<div class='graph'> <canvas id='ETHUSD_Chart'></canvas></div>"

  addon_html += "</div>"
addon_html += "</div>"

//금/원자재
//addon_html += "<div class='graph_container'>"  

addon_html += "<div class='daily_header' id='Material'>"
addon_html += "<div class='daily_title'>금 / 원자재</div>"
addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"

//Gold
Gold_arr = return_1month_arr(daily_market['yf_Gold'], daily_market['TIME'])
Gold_time_arr = Gold_arr[0]
Gold_val_arr = Gold_arr[1]

Gold_time_arr.push('현재')
Gold_hourly_val = (hourly_market['YF_Gold']['value']).replaceAll(",", "")
Gold_val_arr.push(Number(Gold_hourly_val))

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title'>"
  addon_html += "<div class='subRegion_name'>금</div>"
  val_direction = get_direction(hourly_market['YF_Gold']['rate'])
    addon_html += "<div class='subValue'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(Number(Gold_hourly_val).toFixed(2), val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(Number(hourly_market['YF_Gold']['diff']).toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(Number(hourly_market['YF_Gold']['rate']).toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
    addon_html += "<div class='subSelection'>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Gold' autocomplete='off' id='redraw_1M_Gold' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_Gold'>1M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Gold' autocomplete='off' id='redraw_3M_Gold' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_Gold'>3M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Gold' autocomplete='off' id='redraw_6M_Gold' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_Gold'>6M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Gold' autocomplete='off' id='redraw_1Y_Gold' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Gold'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Gold' autocomplete='off' id='redraw_3Y_Gold' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Gold'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Gold' autocomplete='off' id='redraw_5Y_Gold' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Gold'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Gold' autocomplete='off' id='redraw_10Y_Gold' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Gold'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Gold_Chart'></canvas></div>"

addon_html += "</div>"

//Silver
Silver_arr = return_1month_arr(daily_market['yf_Silver'], daily_market['TIME'])
Silver_time_arr = Silver_arr[0]
Silver_val_arr = Silver_arr[1]

Silver_time_arr.push('현재')
Silver_val_arr.push(hourly_market['YF_Silver']['value'])

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title'>"
  addon_html += "<div class='subRegion_name'>은</div>"
  val_direction = get_direction(Number(hourly_market['YF_Silver']['rate']))
    addon_html += "<div class='subValue'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(Number(hourly_market['YF_Silver']['value']).toFixed(2), val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(Number(hourly_market['YF_Silver']['diff']).toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(Number(hourly_market['YF_Silver']['rate']).toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
    addon_html += "<div class='subSelection'>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Silver' autocomplete='off' id='redraw_1M_Silver' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_Silver'>1M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Silver' autocomplete='off' id='redraw_3M_Silver' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_Silver'>3M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Silver' autocomplete='off' id='redraw_6M_Silver' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_Silver'>6M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Silver' autocomplete='off' id='redraw_1Y_Silver' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Silver'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Silver' autocomplete='off' id='redraw_3Y_Silver' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Silver'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Silver' autocomplete='off' id='redraw_5Y_Silver' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Silver'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Silver' autocomplete='off' id='redraw_10Y_Silver' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Silver'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Silver_Chart'></canvas></div>"

addon_html += "</div>"

//Copper
Copper_arr = return_1month_arr(daily_market['yf_Copper'], daily_market['TIME'])
Copper_time_arr = Copper_arr[0]
Copper_val_arr = Copper_arr[1]

Copper_time_arr.push('현재')
Copper_val_arr.push(Number(hourly_market['YF_Copper']['value']))

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title'>"
  addon_html += "<div class='subRegion_name'>구리</div>"
  val_direction = get_direction(hourly_market['YF_Copper']['rate'])
    addon_html += "<div class='subValue'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(Number(hourly_market['YF_Copper']['value']).toFixed(2), val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(Number(hourly_market['YF_Copper']['diff']).toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(Number(hourly_market['YF_Copper']['rate']).toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
    addon_html += "<div class='subSelection'>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Copper' autocomplete='off' id='redraw_1M_Copper' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_Copper'>1M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Copper' autocomplete='off' id='redraw_3M_Copper' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_Copper'>3M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Copper' autocomplete='off' id='redraw_6M_Copper' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_Copper'>6M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Copper' autocomplete='off' id='redraw_1Y_Copper' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Copper'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Copper' autocomplete='off' id='redraw_3Y_Copper' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Copper'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Copper' autocomplete='off' id='redraw_5Y_Copper' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Copper'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Copper' autocomplete='off' id='redraw_10Y_Copper' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Copper'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Copper_Chart'></canvas></div>"

addon_html += "</div>"
addon_html += "</div>"

//국제 유가
//addon_html += "<div class='graph_container'>"  

addon_html += "<div class='daily_header' id='Oil'>"
addon_html += "<div class='daily_title'>국제 유가</div>"
addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"

//WTI
WTI_arr = return_1month_arr(daily_market['yf_WTI'], daily_market['TIME'])
WTI_time_arr = WTI_arr[0]
WTI_val_arr = WTI_arr[1]

WTI_time_arr.push('현재')
WTI_val_arr.push(hourly_market['YF_WTI']['value'])

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title'>"
  addon_html += "<div class='subRegion_name'>서부텍사스유</div>"
  val_direction = get_direction(hourly_market['YF_WTI']['rate'])
    addon_html += "<div class='subValue'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['YF_WTI']['value'].toFixed(2), val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['YF_WTI']['diff'].toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['YF_WTI']['rate'].toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
    addon_html += "<div class='subSelection'>"
      addon_html += "<div><input type='radio' class='btnRadio' name='WTI' autocomplete='off' id='redraw_1M_WTI' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_WTI'>1M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='WTI' autocomplete='off' id='redraw_3M_WTI' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_WTI'>3M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='WTI' autocomplete='off' id='redraw_6M_WTI' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_WTI'>6M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='WTI' autocomplete='off' id='redraw_1Y_WTI' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_WTI'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='WTI' autocomplete='off' id='redraw_3Y_WTI' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_WTI'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='WTI' autocomplete='off' id='redraw_5Y_WTI' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_WTI'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='WTI' autocomplete='off' id='redraw_10Y_WTI' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_WTI'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='WTI_Chart'></canvas></div>"

addon_html += "</div>"

//Dubai
Dubai_arr = return_1year_monthly_arr(monthly_market['BOK_Oil_Dubai'], monthly_market['TIME'])
Dubai_time_arr = Dubai_arr[0]
Dubai_val_arr = Dubai_arr[1]

Dubai_time_arr.push('현재')
Dubai_val_arr.push(hourly_market['Dubai']['value'])

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title'>"
  addon_html += "<div class='subRegion_name'>두바이유</div>"
  val_direction = get_direction(hourly_market['Dubai']['rate'])
    addon_html += "<div class='subValue'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['Dubai']['value'].toFixed(2), val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['Dubai']['diff'].toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['Dubai']['rate'].toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
    addon_html += "<div class='subSelection'>"      
      addon_html += "<div></div>"
      addon_html += "<div></div>"
      addon_html += "<div></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Dubai' autocomplete='off' id='redraw_1Y_Dubai' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Dubai'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Dubai' autocomplete='off' id='redraw_3Y_Dubai' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Dubai'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Dubai' autocomplete='off' id='redraw_5Y_Dubai' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Dubai'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Dubai' autocomplete='off' id='redraw_10Y_Dubai' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Dubai'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Dubai_Chart'></canvas></div>"

addon_html += "</div>"

//Brent
Brent_arr = return_1month_arr(daily_market['yf_Brent'], daily_market['TIME'])
Brent_time_arr = Brent_arr[0]
Brent_val_arr = Brent_arr[1]

Brent_time_arr.push('현재')
Brent_val_arr.push(hourly_market['YF_Brent']['value'])

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title'>"
  addon_html += "<div class='subRegion_name'>브렌트유</div>"
  val_direction = get_direction(hourly_market['YF_Brent']['rate'])
    addon_html += "<div class='subValue'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['YF_Brent']['value'].toFixed(2), val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['YF_Brent']['diff'].toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['YF_Brent']['rate'].toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
    addon_html += "<div class='subSelection'>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Brent' autocomplete='off' id='redraw_1M_Brent' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_Brent'>1M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Brent' autocomplete='off' id='redraw_3M_Brent' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_Brent'>3M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Brent' autocomplete='off' id='redraw_6M_Brent' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_Brent'>6M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Brent' autocomplete='off' id='redraw_1Y_Brent' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Brent'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Brent' autocomplete='off' id='redraw_3Y_Brent' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Brent'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Brent' autocomplete='off' id='redraw_5Y_Brent' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Brent'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Brent' autocomplete='off' id='redraw_10Y_Brent' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Brent'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Brent_Chart'></canvas></div>"

addon_html += "</div>"
addon_html += "</div>"

//채권 수익률
//addon_html += "<div class='graph_container'>"  

addon_html += "<div class='daily_header' id='Bond_Rate'>"
addon_html += "<div class='daily_title'>채권 수익률</div>"
addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"

//미국 채권
US_Bond_30y_arr = return_1month_arr(daily_market['FRED_BondYield30'], daily_market['TIME'])
US_Bond_30y_time_arr = US_Bond_30y_arr[0]
US_Bond_30y_val_arr = US_Bond_30y_arr[1]

US_Bond_30y_time_arr.push('현재')
US_Bond_30y_val_arr.push(hourly_market['US30YT_Bond']['value'])

US_Bond_10y_arr = return_1month_arr(daily_market['FRED_BondYield10'], daily_market['TIME'])
US_Bond_10y_time_arr = US_Bond_10y_arr[0]
US_Bond_10y_val_arr = US_Bond_10y_arr[1]

US_Bond_10y_time_arr.push('현재')
US_Bond_10y_val_arr.push(hourly_market['US10YT_Bond']['value'])

US_Bond_5y_arr = return_1month_arr(daily_market['FRED_BondYield05'], daily_market['TIME'])
US_Bond_5y_time_arr = US_Bond_5y_arr[0]
US_Bond_5y_val_arr = US_Bond_5y_arr[1]

US_Bond_5y_time_arr.push('현재')
US_Bond_5y_val_arr.push(hourly_market['US5YT_Bond']['value'])

US_Bond_3y_arr = return_1month_arr(daily_market['FRED_BondYield03'], daily_market['TIME'])
US_Bond_3y_time_arr = US_Bond_3y_arr[0]
US_Bond_3y_val_arr = US_Bond_3y_arr[1]

US_Bond_3y_time_arr.push('현재')
US_Bond_3y_val_arr.push(hourly_market['US3YT_Bond']['value'])

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title'>"
  addon_html += "<div class='subRegion_name'>미국 국채 30년</div>"
  val_direction = get_direction(hourly_market['US30YT_Bond']['rate'])
    addon_html += "<div class='subValue'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['US30YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['US30YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['US30YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"

    addon_html += "<div></div>"

    /*
    addon_html += "<div class='subRegion_name'>미국 국채 10년</div>"
    addon_html += "<div class='subValue'>"      
      val_direction = get_direction(hourly_market['US10YT_Bond']['rate'])
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['US10YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['US10YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['US10YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"

    addon_html += "<div></div>"

    addon_html += "<div class='subRegion_name'>미국 국채 5년</div>"
    addon_html += "<div class='subValue'>"      
      val_direction = get_direction(hourly_market['US5YT_Bond']['rate'])
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['US5YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['US5YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['US5YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"

    addon_html += "<div></div>"
    */

    addon_html += "<div class='subRegion_name'>미국 국채 3년</div>"
    addon_html += "<div class='subValue'>"      
      val_direction = get_direction(hourly_market['US3YT_Bond']['rate'])    
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['US3YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['US3YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['US3YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"

    addon_html += "<div class='subSelection'>"
      addon_html += "<div><input type='radio' class='btnRadio' name='US_Bond_Rate' autocomplete='off' id='redraw_1M_US_Bond_Rate' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_US_Bond_Rate'>1M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='US_Bond_Rate' autocomplete='off' id='redraw_3M_US_Bond_Rate' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_US_Bond_Rate'>3M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='US_Bond_Rate' autocomplete='off' id='redraw_6M_US_Bond_Rate' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_US_Bond_Rate'>6M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='US_Bond_Rate' autocomplete='off' id='redraw_1Y_US_Bond_Rate' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_US_Bond_Rate'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='US_Bond_Rate' autocomplete='off' id='redraw_3Y_US_Bond_Rate' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_US_Bond_Rate'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='US_Bond_Rate' autocomplete='off' id='redraw_5Y_US_Bond_Rate' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_US_Bond_Rate'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='US_Bond_Rate' autocomplete='off' id='redraw_10Y_US_Bond_Rate' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_US_Bond_Rate'>10Y</label></div>"
    addon_html += "</div>"

  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='US_Bond_Rate_Chart'></canvas></div>"

addon_html += "</div>"

//한국 채권
KO_Bond_30y_arr = return_1month_arr(daily_market['BOK_BondYield30'], daily_market['TIME'])
KO_Bond_30y_time_arr = KO_Bond_30y_arr[0]
KO_Bond_30y_val_arr = KO_Bond_30y_arr[1]

KO_Bond_10y_arr = return_1month_arr(daily_market['BOK_BondYield10'], daily_market['TIME'])
KO_Bond_10y_time_arr = KO_Bond_10y_arr[0]
KO_Bond_10y_val_arr = KO_Bond_10y_arr[1]

KO_Bond_5y_arr = return_1month_arr(daily_market['BOK_BondYield05'], daily_market['TIME'])
KO_Bond_5y_time_arr = KO_Bond_5y_arr[0]
KO_Bond_5y_val_arr = KO_Bond_5y_arr[1]

KO_Bond_3y_arr = return_1month_arr(daily_market['BOK_BondYield03'], daily_market['TIME'])
KO_Bond_3y_time_arr = KO_Bond_3y_arr[0]
KO_Bond_3y_val_arr = KO_Bond_3y_arr[1]

KO_Bond_30y_time_arr.push('현재')
KO_Bond_30y_val_arr.push(hourly_market['KR30YT_Bond']['value'])

KO_Bond_10y_time_arr.push('현재')
KO_Bond_10y_val_arr.push(hourly_market['KR10YT_Bond']['value'])

KO_Bond_5y_time_arr.push('현재')
KO_Bond_5y_val_arr.push(hourly_market['KR5YT_Bond']['value'])

KO_Bond_3y_time_arr.push('현재')
KO_Bond_3y_val_arr.push(hourly_market['KR3YT_Bond']['value'])

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title'>"
  addon_html += "<div class='subRegion_name'>한국 국채 30년</div>"
  val_direction = get_direction(hourly_market['KR30YT_Bond']['rate'])
    addon_html += "<div class='subValue'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['KR30YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['KR30YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['KR30YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"

    addon_html += "<div></div>"

    /*
    addon_html += "<div class='subRegion_name'>한국 국채 10년</div>"
    addon_html += "<div class='subValue'>"      
      val_direction = get_direction(hourly_market['KR10YT_Bond']['rate'])
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['KR10YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['KR10YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['KR10YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"

    addon_html += "<div></div>"

    addon_html += "<div class='subRegion_name'>한국 국채 5년</div>"
    addon_html += "<div class='subValue'>"      
      val_direction = get_direction(hourly_market['KR5YT_Bond']['rate'])
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['KR5YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['KR5YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['KR5YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"

    addon_html += "<div></div>"
    */

    addon_html += "<div class='subRegion_name'>한국 국채 3년</div>"
    addon_html += "<div class='subValue'>"      
      val_direction = get_direction(hourly_market['KR3YT_Bond']['rate'])    
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['KR3YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['KR3YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['KR3YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"

    addon_html += "<div class='subSelection'>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_Bond_Rate' autocomplete='off' id='redraw_1M_KO_Bond_Rate' onClick='redraw_graph(this, \"1M\")' checked><label class='btn btn-outline-danger' id='label_1M' for='redraw_1M_KO_Bond_Rate'>1M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_Bond_Rate' autocomplete='off' id='redraw_3M_KO_Bond_Rate' onClick='redraw_graph(this, \"3M\")'><label class='btn btn-outline-danger' id='label_3M' for='redraw_3M_KO_Bond_Rate'>3M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_Bond_Rate' autocomplete='off' id='redraw_6M_KO_Bond_Rate' onClick='redraw_graph(this, \"6M\")'><label class='btn btn-outline-danger' id='label_6M' for='redraw_6M_KO_Bond_Rate'>6M</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_Bond_Rate' autocomplete='off' id='redraw_1Y_KO_Bond_Rate' onClick='redraw_graph(this, \"1Y\")'><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_Bond_Rate'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_Bond_Rate' autocomplete='off' id='redraw_3Y_KO_Bond_Rate' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_Bond_Rate'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_Bond_Rate' autocomplete='off' id='redraw_5Y_KO_Bond_Rate' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_Bond_Rate'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_Bond_Rate' autocomplete='off' id='redraw_10Y_KO_Bond_Rate' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_Bond_Rate'>10Y</label></div>"
    addon_html += "</div>"    

  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_Bond_Rate_Chart'></canvas></div>"

addon_html += "</div>"
addon_html += "</div>"

//금리
//addon_html += "<div class='graph_container'>"  

addon_html += "<div class='daily_header' id='Interest'>"
addon_html += "<div class='daily_title'>금리</div>"
addon_html += "<div class='daily_sub'>한국: " + monthly_updated + " | 미국: " + daily_updated + "</div>"

//한국금리
BOK_interest_arr = return_1year_monthly_arr(monthly_market['BOK_Standard_Interest'], monthly_market['TIME'])
BOK_interest_time_arr = BOK_interest_arr[0]
BOK_interest_val_arr = BOK_interest_arr[1]

BOK_interest_time_arr.push('현재')
BOK_interest_time_len = Object.keys(monthly_market['BOK_Standard_Interest']).length
BOK_interest_val_arr.push(monthly_market['BOK_Standard_Interest'][BOK_interest_time_len-1])

//미국금리
FRED_interest_monthly_arr = []
FRED_time_monthly_arr = []

FRED_interest_daily_arr = Object.values(daily_market['FRED_Interest'])
FRED_time_daily_arr = Object.values(daily_market['TIME'])
monthly_time_arr = Object.values(monthly_market['TIME'])
for (var i = 0 ; i < monthly_time_arr.length ; i++){  
  for (var j = 0 ; j < FRED_time_daily_arr.length ; j++ ){
    if(monthly_time_arr[i] == FRED_time_daily_arr[j]){      
      FRED_interest_monthly_arr.push(FRED_interest_daily_arr[j])
      FRED_time_monthly_arr.push(FRED_time_daily_arr[j])
    }
  }
}
FRED_interest_monthly_arr = Object.assign({}, FRED_interest_monthly_arr)
FRED_time_monthly_arr = Object.assign({}, FRED_time_monthly_arr)
FRED_interest_arr = return_1year_monthly_arr(FRED_interest_monthly_arr, FRED_time_monthly_arr)
FRED_interest_val_arr = FRED_interest_arr[1]

console.log(FRED_interest_daily_arr[(FRED_time_daily_arr.length)-1])
FRED_interest_val_arr.push(FRED_interest_daily_arr[(FRED_time_daily_arr.length)-1])

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title2'>"
    addon_html += "<div class='subRegion_name'>한국 기준금리</div>"    
    addon_html += "<div class = 'current_val3'>" + Number(KOR_interest[0]).toFixed(2) + "%</div>"    
    addon_html += "<div class='subRegion_name'>미국 기준금리</div>"    
    addon_html += "<div class = 'current_val3'>" + Number(US_interest[0]).toFixed(2) + "%</div>"
    addon_html += "<div class='subSelection2'>"      
      addon_html += "<div></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_US_Interest' autocomplete='off' id='redraw_1Y_KO_US_Interest' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_US_Interest'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_US_Interest' autocomplete='off' id='redraw_3Y_KO_US_Interest' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_US_Interest'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_US_Interest' autocomplete='off' id='redraw_5Y_KO_US_Interest' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_US_Interest'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_US_Interest' autocomplete='off' id='redraw_10Y_KO_US_Interest' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_US_Interest'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Interest_Chart'></canvas></div>"

addon_html += "</div>"
addon_html += "</div>"

//통화량/외환보유고
//addon_html += "<div class='graph_container'>"  

addon_html += "<div class='daily_header' id='External_Money'>"
addon_html += "<div class='daily_title'>통화량(M0) / 외환보유고</div>"
addon_html += "<div class='daily_sub'>한국: " + monthly_updated + " | 미국: " + daily_updated + "</div>"

//한국통화량
KO_total_asset_arr = return_1year_monthly_arr(monthly_market['BOK_Total_Asset'], monthly_market['TIME'])
KO_total_asset_time_arr = KO_total_asset_arr[0]
KO_total_asset_val_arr = KO_total_asset_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>한국 통화량</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + KO_total.toFixed(2) + "<span class='unit'> 조 원</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KO_total_gap)[0] + "</span></div>"      
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_total_asset' autocomplete='off' id='redraw_1Y_KO_total_asset' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_total_asset'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_total_asset' autocomplete='off' id='redraw_3Y_KO_total_asset' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_total_asset'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_total_asset' autocomplete='off' id='redraw_5Y_KO_total_asset' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_total_asset'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_total_asset' autocomplete='off' id='redraw_10Y_KO_total_asset' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_total_asset'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_total_asset_Chart'></canvas></div>"

addon_html += "</div>"

//미국통화량
US_total_asset_arr = return_1year_weekly_arr(daily_market['FRED_Total_Asset'], daily_market['TIME'])
US_total_asset_time_arr = US_total_asset_arr[0]
US_total_asset_val_arr = US_total_asset_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>미국 통화량</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + US_total.toFixed(2) + "<span class='unit'> 조 달러</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(US_total_gap)[0] + "</span></div>"  
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"      
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='US_total_asset' autocomplete='off' id='redraw_1Y_US_total_asset' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_US_total_asset'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='US_total_asset' autocomplete='off' id='redraw_3Y_US_total_asset' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_US_total_asset'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='US_total_asset' autocomplete='off' id='redraw_5Y_US_total_asset' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_US_total_asset'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='US_total_asset' autocomplete='off' id='redraw_10Y_US_total_asset' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_US_total_asset'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='US_total_asset_Chart'></canvas></div>"

addon_html += "</div>"

//한국외환보유고
KO_external_money_arr = return_1year_monthly_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])
KO_external_money_time_arr = KO_external_money_arr[0]
KO_external_money_val_arr = KO_external_money_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>한국 외환 보유고</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + external_total.toFixed(2) + "<span class='unit'> 조 달러</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(external_total_gap)[0] + "</span></div>"      
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_external_money' autocomplete='off' id='redraw_1Y_KO_external_money' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_external_money'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_external_money' autocomplete='off' id='redraw_3Y_KO_external_money' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_external_money'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_external_money' autocomplete='off' id='redraw_5Y_KO_external_money' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_external_money'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_external_money' autocomplete='off' id='redraw_10Y_KO_external_money' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_external_money'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_external_money_Chart'></canvas></div>"

addon_html += "</div>"
addon_html += "</div>"


//채권
//addon_html += "<div class='graph_container'>"  

addon_html += "<div class='daily_header' id='Bond'>"
addon_html += "<div class='daily_title'>채권</div>"
addon_html += "<div class='daily_sub'>" + monthly_updated + "</div>"

//월별 채권 발행액
KO_bond_published_arr = return_1year_monthly_arr(monthly_market['BOK_Bond_Publish'], monthly_market['TIME'])
KO_bond_published_time_arr = KO_bond_published_arr[0]
KO_bond_published_val_arr = KO_bond_published_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>월별 채권 발행액</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + publishedbond_total + "<span class='unit'> 조 원</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(publishedbond_total_gap)[0] + "</span></div>"      
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_published' autocomplete='off' id='redraw_1Y_KO_bond_published' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_bond_published'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_published' autocomplete='off' id='redraw_3Y_KO_bond_published' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_bond_published'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_published' autocomplete='off' id='redraw_5Y_KO_bond_published' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_bond_published'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_published' autocomplete='off' id='redraw_10Y_KO_bond_published' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_bond_published'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_bond_published_Chart'></canvas></div>"

addon_html += "</div>"

//누적 채권 잔액
KO_bond_remain_arr = return_1year_monthly_arr(monthly_market['BOK_Bond_Remain'], monthly_market['TIME'])
KO_bond_remain_time_arr = KO_bond_remain_arr[0]
KO_bond_remain_val_arr = KO_bond_remain_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>누적 채권 잔액</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + remainbond_total.toFixed(2) + "<span class='unit'> 조 원</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(remainbond_total_gap)[0] + "</span></div>"      
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_remain' autocomplete='off' id='redraw_1Y_KO_bond_remain' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_bond_remain'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_remain' autocomplete='off' id='redraw_3Y_KO_bond_remain' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_bond_remain'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_remain' autocomplete='off' id='redraw_5Y_KO_bond_remain' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_bond_remain'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_remain' autocomplete='off' id='redraw_10Y_KO_bond_remain' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_bond_remain'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_bond_remain_Chart'></canvas></div>"

addon_html += "</div>"
addon_html += "</div>"


//무역
//addon_html += "<div class='graph_container'>"  

addon_html += "<div class='daily_header' id='Trade'>"
addon_html += "<div class='daily_title'>무역</div>"
addon_html += "<div class='daily_sub'>" + monthly_updated + "</div>"

//수출액
KO_trade_out_arr = return_1year_monthly_arr(monthly_market['BOK_Trade_Out'], monthly_market['TIME'])
KO_trade_out_time_arr = KO_trade_out_arr[0]
KO_trade_out_val_arr = KO_trade_out_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>수출액</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + KOR_tradeout_total.toFixed(2) + "<span class='unit'> 억 달러</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_tradeout_total_gap.toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_out' autocomplete='off' id='redraw_1Y_KO_trade_out' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_trade_out'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_out' autocomplete='off' id='redraw_3Y_KO_trade_out' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_trade_out'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_out' autocomplete='off' id='redraw_5Y_KO_trade_out' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_trade_out'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_out' autocomplete='off' id='redraw_10Y_KO_trade_out' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_trade_out'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_trade_out_Chart'></canvas></div>"

addon_html += "</div>"

//수입액
KO_trade_in_arr = return_1year_monthly_arr(monthly_market['BOK_Trade_In'], monthly_market['TIME'])
KO_trade_in_time_arr = KO_trade_in_arr[0]
KO_trade_in_val_arr = KO_trade_in_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>수입액</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + KOR_tradein_total.toFixed(2) + "<span class='unit'> 억 달러</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_tradein_total_gap.toFixed(2))[0] + "</span></div>"     
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_in' autocomplete='off' id='redraw_1Y_KO_trade_in' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_trade_in'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_in' autocomplete='off' id='redraw_3Y_KO_trade_in' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_trade_in'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_in' autocomplete='off' id='redraw_5Y_KO_trade_in' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_trade_in'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_in' autocomplete='off' id='redraw_10Y_KO_trade_in' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_trade_in'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_trade_in_Chart'></canvas></div>"

addon_html += "</div>"

//경상수지
KO_trade_profit_arr = return_1year_monthly_arr(monthly_market['BOK_Trade_Profit'], monthly_market['TIME'])
KO_trade_profit_time_arr = KO_trade_profit_arr[0]
KO_trade_profit_val_arr = KO_trade_profit_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>경상수지</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + KOR_tradeprofit_total.toFixed(2) + "<span class='unit'> 억 달러</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_tradeprofit_gap.toFixed(2))[0] + "</span></div>"     
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_profit' autocomplete='off' id='redraw_1Y_KO_trade_profit' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_trade_profit'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_profit' autocomplete='off' id='redraw_3Y_KO_trade_profit' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_trade_profit'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_profit' autocomplete='off' id='redraw_5Y_KO_trade_profit' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_trade_profit'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_profit' autocomplete='off' id='redraw_10Y_KO_trade_profit' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_trade_profit'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_trade_profit_Chart'></canvas></div>"

addon_html += "</div>"
addon_html += "</div>"

//소득
//addon_html += "<div class='graph_container'>"  

addon_html += "<div class='daily_header' id='Income'>"
addon_html += "<div class='daily_title'>소득</div>"
addon_html += "<div class='daily_sub'>" + monthly_updated + "</div>"

//GDP
KO_GDP_arr = return_10year_yearly_arr(monthly_market['DATA_VALUE_GDP'], monthly_market['TIME'])
KO_GDP_time_arr = KO_GDP_arr[0]
KO_GDP_val_arr = KO_GDP_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>GDP(국내총생산)</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_GDP_total.toFixed(1)).toLocaleString() + "<span class='unit'> 조 원</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_GDP_total_gap.toFixed(2))[0] + "</span></div>"     
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"    
      addon_html += "<div></div>"
      addon_html += "<div></div>"
      addon_html += "<div></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_GDP' autocomplete='off' id='redraw_10Y_KO_GDP' onClick='redraw_graph(this, \"10Y\")'' checked><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_GDP'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_GDP_Chart'></canvas></div>"

addon_html += "</div>"

//GNI
KO_GNI_arr = return_10year_yearly_arr(monthly_market['DATA_VALUE_GNI'], monthly_market['TIME'])
KO_GNI_time_arr = KO_GNI_arr[0]
KO_GNI_val_arr = KO_GNI_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>1인당 GNI(소득)</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_GNI_total.toFixed(1)).toLocaleString() + "<span class='unit'> 원</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag3(KOR_GNI_gap.toFixed(0))[0] + "</span></div>"     
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div></div>"
      addon_html += "<div></div>"
      addon_html += "<div></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_GNI' autocomplete='off' id='redraw_10Y_KO_GNI' onClick='redraw_graph(this, \"10Y\")' checked ><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_GNI'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_GNI_Chart'></canvas></div>"

addon_html += "</div>"
addon_html += "</div>"

//부동산
//addon_html += "<div class='graph_container'>"  

addon_html += "<div class='daily_header' id='Real_Estate'>"
addon_html += "<div class='daily_title'>부동산</div>"
addon_html += "<div class='daily_sub'>" + monthly_updated + "</div>"

//주택 매매가격지수
Housing_Trade_All_arr = return_1year_monthly_arr(monthly_market['BOK_Housing_Trade_All'], monthly_market['TIME'])
Housing_Trade_All_time_arr = Housing_Trade_All_arr[0]
Housing_Trade_All_val_arr = Housing_Trade_All_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>주택 매매가격지수</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_housing_tradeall[0]).toFixed(1) + "<span class='unit'></span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_housing_tradeall[1].toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_All' autocomplete='off' id='redraw_1Y_Housing_Trade_All' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Housing_Trade_All'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_All' autocomplete='off' id='redraw_3Y_Housing_Trade_All' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Housing_Trade_All'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_All' autocomplete='off' id='redraw_5Y_Housing_Trade_All' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Housing_Trade_All'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_All' autocomplete='off' id='redraw_10Y_Housing_Trade_All' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Housing_Trade_All'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Housing_Trade_All_Chart'></canvas></div>"

addon_html += "</div>"

//아파트 매매가격지수
Housing_Trade_Apt_arr = return_1year_monthly_arr(monthly_market['BOK_Housing_Trade_Apt'], monthly_market['TIME'])
Housing_Trade_Apt_time_arr = Housing_Trade_Apt_arr[0]
Housing_Trade_Apt_val_arr = Housing_Trade_Apt_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>아파트 매매가격지수</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_housing_tradeapt[0]).toFixed(1) + "<span class='unit'></span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_housing_tradeapt[1].toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_Apt' autocomplete='off' id='redraw_1Y_Housing_Trade_Apt' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Housing_Trade_Apt'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_Apt' autocomplete='off' id='redraw_3Y_Housing_Trade_Apt' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Housing_Trade_Apt'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_Apt' autocomplete='off' id='redraw_5Y_Housing_Trade_Apt' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Housing_Trade_Apt'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_Apt' autocomplete='off' id='redraw_10Y_Housing_Trade_Apt' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Housing_Trade_Apt'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Housing_Trade_Apt_Chart'></canvas></div>"

addon_html += "</div>"

//주택 전세가격지수
Housing_Rent_All_arr = return_1year_monthly_arr(monthly_market['BOK_Housing_Rent_All'], monthly_market['TIME'])
Housing_Rent_All_time_arr = Housing_Rent_All_arr[0]
Housing_Rent_All_val_arr = Housing_Rent_All_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>주택 전세가격지수</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_housing_rentall[0]).toFixed(1) + "<span class='unit'></span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_housing_rentall[1].toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_All' autocomplete='off' id='redraw_1Y_Housing_Rent_All' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Housing_Rent_All'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_All' autocomplete='off' id='redraw_3Y_Housing_Rent_All' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Housing_Rent_All'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_All' autocomplete='off' id='redraw_5Y_Housing_Rent_All' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Housing_Rent_All'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_All' autocomplete='off' id='redraw_10Y_Housing_Rent_All' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Housing_Rent_All'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Housing_Rent_All_Chart'></canvas></div>"

addon_html += "</div>"

//아파트 전세가격지수
Housing_Rent_Apt_arr = return_1year_monthly_arr(monthly_market['BOK_Housing_Rent_Apt'], monthly_market['TIME'])
Housing_Rent_Apt_time_arr = Housing_Rent_Apt_arr[0]
Housing_Rent_Apt_val_arr = Housing_Rent_Apt_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>아파트 전세가격지수</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_housing_rentapt[0]).toFixed(1) + "<span class='unit'></span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_housing_rentapt[1].toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_Apt' autocomplete='off' id='redraw_1Y_Housing_Rent_Apt' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Housing_Rent_Apt'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_Apt' autocomplete='off' id='redraw_3Y_Housing_Rent_Apt' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Housing_Rent_Apt'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_Apt' autocomplete='off' id='redraw_5Y_Housing_Rent_Apt' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Housing_Rent_Apt'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_Apt' autocomplete='off' id='redraw_10Y_Housing_Rent_Apt' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Housing_Rent_Apt'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Housing_Rent_Apt_Chart'></canvas></div>"

addon_html += "</div>"
addon_html += "</div>"

//심리지표
//addon_html += "<div class='graph_container'>"  

addon_html += "<div class='daily_header' id='Mind'>"
addon_html += "<div class='daily_title'>심리지표</div>"
addon_html += "<div class='daily_sub'>" + monthly_updated + "</div>"

//소비자심리지수
Mind_Consumer_arr = return_1year_monthly_arr(monthly_market['BOK_Mind_Consumer'], monthly_market['TIME'])
Mind_Consumer_time_arr = Mind_Consumer_arr[0]
Mind_Consumer_val_arr = Mind_Consumer_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>소비자심리지수</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_consumermind[0]).toFixed(1) + "<span class='unit'></span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_consumermind[1].toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Consumer' autocomplete='off' id='redraw_1Y_Mind_Consumer' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Mind_Consumer'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Consumer' autocomplete='off' id='redraw_3Y_Mind_Consumer' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Mind_Consumer'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Consumer' autocomplete='off' id='redraw_5Y_Mind_Consumer' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Mind_Consumer'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Consumer' autocomplete='off' id='redraw_10Y_Mind_Consumer' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Mind_Consumer'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Mind_Consumer_Chart'></canvas></div>"

addon_html += "</div>"

//경제심리지수
Mind_Economy_arr = return_1year_monthly_arr(monthly_market['BOK_Mind_Economy'], monthly_market['TIME'])
Mind_Economy_time_arr = Mind_Economy_arr[0]
Mind_Economy_val_arr = Mind_Economy_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>경제심리지수</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_economymind[0]).toFixed(1) + "<span class='unit'></span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_economymind[1].toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Economy' autocomplete='off' id='redraw_1Y_Mind_Economy' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Mind_Economy'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Economy' autocomplete='off' id='redraw_3Y_Mind_Economy' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Mind_Economy'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Economy' autocomplete='off' id='redraw_5Y_Mind_Economy' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Mind_Economy'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Economy' autocomplete='off' id='redraw_10Y_Mind_Economy' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Mind_Economy'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Mind_Economy_Chart'></canvas></div>"

addon_html += "</div>"
addon_html += "</div>"

  $('#graph_area').append(addon_html);

  drawKOSPIChart(KOR_KOSPI_time_arr, KOR_KOSPI_val_arr, "KOSPI_Chart")
  drawKOSDAQChart(KOR_KOSDAQ_time_arr, KOR_KOSDAQ_val_arr, "KOSDAQ_Chart")
  drawKOSPI200Chart(KOR_KOSPI200_time_arr, KOR_KOSPI200_val_arr, "KOSPI200_Chart")

  drawDOWChart(US_DOW_time_arr, US_DOW_val_arr, "DOW_Chart")
  drawNASDAQChart(US_NASDAQ_time_arr, US_NASDAQ_val_arr, "NASDAQ_Chart")
  drawSNPChart(US_SNP_time_arr, US_SNP_val_arr, "SNP_Chart")
  
  drawUSDKRWChart(USDKRW_time_arr, USDKRW_val_arr, "USDKRW_Chart")
  drawJPYKRWChart(JPYKRW_time_arr, JPYKRW_val_arr, "JPYKRW_Chart")
  drawEURKRWChart(EURKRW_time_arr, EURKRW_val_arr, "EURKRW_Chart")
  drawDollarIndexChart(Dollar_Index_time_arr, Dollar_Index_val_arr, "Dollar_Index_Chart")

  drawBTCUSDChart(BTCUSD_time_arr, BTCUSD_val_arr, "BTCUSD_Chart")
  drawETHUSDChart(ETHUSD_time_arr, ETHUSD_val_arr, "ETHUSD_Chart")

  drawGoldChart(Gold_time_arr, Gold_val_arr, "Gold_Chart")
  drawSilverChart(Silver_time_arr, Silver_val_arr, "Silver_Chart")  
  drawCopperChart(Copper_time_arr, Copper_val_arr, "Copper_Chart")

  drawWTIChart(WTI_time_arr, WTI_val_arr, "WTI_Chart")
  drawDubaiChart(Dubai_time_arr, Dubai_val_arr, "Dubai_Chart")  
  drawBrentChart(Brent_time_arr, Brent_val_arr, "Brent_Chart")

  drawUSBondRateChart(US_Bond_30y_time_arr, US_Bond_30y_val_arr, US_Bond_10y_val_arr, US_Bond_5y_val_arr, US_Bond_3y_val_arr, "US_Bond_Rate_Chart")
  drawKOBondRateChart(KO_Bond_30y_time_arr, KO_Bond_30y_val_arr, KO_Bond_10y_val_arr, KO_Bond_5y_val_arr, KO_Bond_3y_val_arr, "KO_Bond_Rate_Chart")

  drawInterestChart(BOK_interest_time_arr, BOK_interest_val_arr, FRED_interest_val_arr, "Interest_Chart")

  drawKOTotalAssetChart(KO_total_asset_time_arr, KO_total_asset_val_arr, "KO_total_asset_Chart")
  drawUSTotalAssetChart(US_total_asset_time_arr, US_total_asset_val_arr, "US_total_asset_Chart")
  drawKOExternalMoneyChart(KO_external_money_time_arr, KO_external_money_val_arr, "KO_external_money_Chart")

  drawKObondpublishedChart(KO_bond_published_time_arr, KO_bond_published_val_arr, "KO_bond_published_Chart")
  drawKObondremainChart(KO_bond_remain_time_arr, KO_bond_remain_val_arr, "KO_bond_remain_Chart")

  drawKOtradeoutChart(KO_trade_out_time_arr, KO_trade_out_val_arr, "KO_trade_out_Chart")
  drawKOtradeinChart(KO_trade_in_time_arr, KO_trade_in_val_arr, "KO_trade_in_Chart")
  drawKOtradeprofitChart(KO_trade_profit_time_arr, KO_trade_profit_val_arr, "KO_trade_profit_Chart")

  drawGDPChart(KO_GDP_time_arr, KO_GDP_val_arr, "KO_GDP_Chart")
  drawGNIChart(KO_GNI_time_arr, KO_GNI_val_arr, "KO_GNI_Chart")

  drawHousingTradeAllChart(Housing_Trade_All_time_arr, Housing_Trade_All_val_arr, "Housing_Trade_All_Chart")
  drawHousingTradeAptChart(Housing_Trade_Apt_time_arr, Housing_Trade_Apt_val_arr, "Housing_Trade_Apt_Chart")
  drawHousingRentAllChart(Housing_Rent_All_time_arr, Housing_Rent_All_val_arr, "Housing_Rent_All_Chart")
  drawHousingRentAptChart(Housing_Rent_Apt_time_arr, Housing_Rent_Apt_val_arr, "Housing_Rent_Apt_Chart")

  drawMindConsumerChart(Mind_Consumer_time_arr, Mind_Consumer_val_arr, "Mind_Consumer_Chart")
  drawMindEconomyChart(Mind_Economy_time_arr, Mind_Economy_val_arr, "Mind_Economy_Chart")  

  drawMoneyFlowChart(mf_time_arr, moneyflow_dataset, "MoneyFlow_Chart")

  for(var k = 0 ; k < menu_all.length ; k++){
    menu_position[k] = $('#' + menu_all[k]).offset().top
  }

  $('#graph_area').scroll(function() {
    for(var k = 0 ; k < menu_all.length ; k++){
      menu_current_position[k] = $('#' + menu_all[k]).offset().top - 145
    }
    
    for (var j = 0 ; j < menu_current_position.length ; j++){
      if( menu_current_position[j] < 10){        
        if( 440 < menu_current_position[menu_current_position.length-1] && menu_current_position[menu_current_position.length-1] < 443 ){
          $("#shortcut_" + menu_all[menu_current_position.length-1]).prop("checked", true);
        }
        else{
          $("#shortcut_" + menu_all[j]).prop("checked", true);
        }
      }      
    }

  })
}

function redraw_graph(obj, duration){
  duration_cheker = duration
  item_checker = obj.name

  if(item_checker == "KOR_KOSPI"){
    if(duration_cheker == "1M"){
      KOR_KOSPI_arr = return_1month_arr(daily_market['yf_KOSPI'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      KOR_KOSPI_arr = return_3month_arr(daily_market['yf_KOSPI'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      KOR_KOSPI_arr = return_6month_arr(daily_market['yf_KOSPI'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      KOR_KOSPI_arr = return_1year_arr(daily_market['yf_KOSPI'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      KOR_KOSPI_arr = return_3year_arr(daily_market['yf_KOSPI'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      KOR_KOSPI_arr = return_5year_arr(daily_market['yf_KOSPI'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      KOR_KOSPI_arr = return_10year_arr(daily_market['yf_KOSPI'], daily_market['TIME'])      
    }
    KOR_KOSPI_time_arr = KOR_KOSPI_arr[0]
    KOR_KOSPI_val_arr = KOR_KOSPI_arr[1]

    KOR_KOSPI_time_arr.push('현재')
    KOR_KOSPI_val_arr.push(hourly_market['KOSPI']['value'])

    myKOSPI_Chart.destroy()
    drawKOSPIChart(KOR_KOSPI_time_arr, KOR_KOSPI_val_arr, "KOSPI_Chart")
  }

  if(item_checker == "KOR_KOSDAQ"){
    if(duration_cheker == "1M"){
      KOR_KOSDAQ_arr = return_1month_arr(daily_market['yf_KOSDAQ'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      KOR_KOSDAQ_arr = return_3month_arr(daily_market['yf_KOSDAQ'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      KOR_KOSDAQ_arr = return_6month_arr(daily_market['yf_KOSDAQ'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      KOR_KOSDAQ_arr = return_1year_arr(daily_market['yf_KOSDAQ'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      KOR_KOSDAQ_arr = return_3year_arr(daily_market['yf_KOSDAQ'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      KOR_KOSDAQ_arr = return_5year_arr(daily_market['yf_KOSDAQ'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      KOR_KOSDAQ_arr = return_10year_arr(daily_market['yf_KOSDAQ'], daily_market['TIME'])      
    }
    KOR_KOSDAQ_time_arr = KOR_KOSDAQ_arr[0]
    KOR_KOSDAQ_val_arr = KOR_KOSDAQ_arr[1]

    KOR_KOSDAQ_time_arr.push('현재')
    KOR_KOSDAQ_val_arr.push(hourly_market['KOSDAQ']['value'])      

    myKOSDAQ_Chart.destroy()
    drawKOSDAQChart(KOR_KOSDAQ_time_arr, KOR_KOSDAQ_val_arr, "KOSDAQ_Chart")
  }
  
  if(item_checker == "KOR_KOSPI200"){
    if(duration_cheker == "1M"){
      KOR_KOSPI200_arr = return_1month_arr(daily_market['yf_KOSPI200'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      KOR_KOSPI200_arr = return_3month_arr(daily_market['yf_KOSPI200'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      KOR_KOSPI200_arr = return_6month_arr(daily_market['yf_KOSPI200'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      KOR_KOSPI200_arr = return_1year_arr(daily_market['yf_KOSPI200'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      KOR_KOSPI200_arr = return_3year_arr(daily_market['yf_KOSPI200'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      KOR_KOSPI200_arr = return_5year_arr(daily_market['yf_KOSPI200'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      KOR_KOSPI200_arr = return_10year_arr(daily_market['yf_KOSPI200'], daily_market['TIME'])      
    }
    KOR_KOSPI200_time_arr = KOR_KOSPI200_arr[0]
    KOR_KOSPI200_val_arr = KOR_KOSPI200_arr[1]

    KOR_KOSPI200_time_arr.push('현재')
    KOR_KOSPI200_val_arr.push(hourly_market['KOSPI200']['value'])      

    myKOSPI200_Chart.destroy()
    drawKOSPI200Chart(KOR_KOSPI200_time_arr, KOR_KOSPI200_val_arr, "KOSPI200_Chart")
  }

  if(item_checker == "US_DOW"){
    if(duration_cheker == "1M"){
      US_DOW_arr = return_1month_arr(daily_market['yf_DOW'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      US_DOW_arr = return_3month_arr(daily_market['yf_DOW'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      US_DOW_arr = return_6month_arr(daily_market['yf_DOW'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      US_DOW_arr = return_1year_arr(daily_market['yf_DOW'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      US_DOW_arr = return_3year_arr(daily_market['yf_DOW'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      US_DOW_arr = return_5year_arr(daily_market['yf_DOW'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      US_DOW_arr = return_10year_arr(daily_market['yf_DOW'], daily_market['TIME'])      
    }
    US_DOW_time_arr = US_DOW_arr[0]
    US_DOW_val_arr = US_DOW_arr[1]

    US_DOW_time_arr.push('현재')
    US_DOW_val_arr.push(hourly_market['DOW']['value'])      

    myDOW_Chart.destroy()
    drawDOWChart(US_DOW_time_arr, US_DOW_val_arr, "DOW_Chart")
  }

  if(item_checker == "US_NASDAQ"){
    if(duration_cheker == "1M"){
      US_NASDAQ_arr = return_1month_arr(daily_market['yf_NASDAQ'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      US_NASDAQ_arr = return_3month_arr(daily_market['yf_NASDAQ'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      US_NASDAQ_arr = return_6month_arr(daily_market['yf_NASDAQ'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      US_NASDAQ_arr = return_1year_arr(daily_market['yf_NASDAQ'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      US_NASDAQ_arr = return_3year_arr(daily_market['yf_NASDAQ'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      US_NASDAQ_arr = return_5year_arr(daily_market['yf_NASDAQ'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      US_NASDAQ_arr = return_10year_arr(daily_market['yf_NASDAQ'], daily_market['TIME'])      
    }
    US_NASDAQ_time_arr = US_NASDAQ_arr[0]
    US_NASDAQ_val_arr = US_NASDAQ_arr[1]

    US_NASDAQ_time_arr.push('현재')
    US_NASDAQ_val_arr.push(hourly_market['NAS']['value'])     

    myNASDAQ_Chart.destroy()
    drawNASDAQChart(US_NASDAQ_time_arr, US_NASDAQ_val_arr, "NASDAQ_Chart")
  }
  
  if(item_checker == "US_SNP"){
    if(duration_cheker == "1M"){
      US_SNP_arr = return_1month_arr(daily_market['yf_SNP'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      US_SNP_arr = return_3month_arr(daily_market['yf_SNP'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      US_SNP_arr = return_6month_arr(daily_market['yf_SNP'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      US_SNP_arr = return_1year_arr(daily_market['yf_SNP'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      US_SNP_arr = return_3year_arr(daily_market['yf_SNP'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      US_SNP_arr = return_5year_arr(daily_market['yf_SNP'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      US_SNP_arr = return_10year_arr(daily_market['yf_SNP'], daily_market['TIME'])      
    }
    US_SNP_time_arr = US_SNP_arr[0]
    US_SNP_val_arr = US_SNP_arr[1]

    US_SNP_time_arr.push('현재')
    US_SNP_val_arr.push(hourly_market['SNP']['value'])        

    mySNP_Chart.destroy()
    drawSNPChart(US_SNP_time_arr, US_SNP_val_arr, "SNP_Chart")
  }

  if(item_checker == "USDKRW"){
    if(duration_cheker == "1M"){
      USDKRW_arr = return_1month_arr(daily_market['BOK_Currency_US'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      USDKRW_arr = return_3month_arr(daily_market['BOK_Currency_US'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      USDKRW_arr = return_6month_arr(daily_market['BOK_Currency_US'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      USDKRW_arr = return_1year_arr(daily_market['BOK_Currency_US'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      USDKRW_arr = return_3year_arr(daily_market['BOK_Currency_US'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      USDKRW_arr = return_5year_arr(daily_market['BOK_Currency_US'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      USDKRW_arr = return_10year_arr(daily_market['BOK_Currency_US'], daily_market['TIME'])      
    }
    USDKRW_time_arr = USDKRW_arr[0]
    USDKRW_val_arr = USDKRW_arr[1]

    USDKRW_time_arr.push('현재')
    USDKRW_val_arr.push(hourly_market['USDKRW']['value'])    

    myUSDKRW_Chart.destroy()
    drawUSDKRWChart(USDKRW_time_arr, USDKRW_val_arr, "USDKRW_Chart")
  }

  if(item_checker == "JPYKRW"){
    if(duration_cheker == "1M"){
      JPYKRW_arr = return_1month_arr(daily_market['BOK_Currency_JP'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      JPYKRW_arr = return_3month_arr(daily_market['BOK_Currency_JP'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      JPYKRW_arr = return_6month_arr(daily_market['BOK_Currency_JP'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      JPYKRW_arr = return_1year_arr(daily_market['BOK_Currency_JP'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      JPYKRW_arr = return_3year_arr(daily_market['BOK_Currency_JP'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      JPYKRW_arr = return_5year_arr(daily_market['BOK_Currency_JP'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      JPYKRW_arr = return_10year_arr(daily_market['BOK_Currency_JP'], daily_market['TIME'])      
    }
    JPYKRW_time_arr = JPYKRW_arr[0]
    JPYKRW_val_arr = JPYKRW_arr[1]

    JPYKRW_time_arr.push('현재')
    JPYKRW_val_arr.push(hourly_market['JPYKRW']['value'])    

    myJPYKRW_Chart.destroy()
    drawJPYKRWChart(JPYKRW_time_arr, JPYKRW_val_arr, "JPYKRW_Chart")
  }

  if(item_checker == "EURKRW"){
    if(duration_cheker == "1M"){
      EURKRW_arr = return_1month_arr(daily_market['BOK_Currency_EU'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      EURKRW_arr = return_3month_arr(daily_market['BOK_Currency_EU'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      EURKRW_arr = return_6month_arr(daily_market['BOK_Currency_EU'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      EURKRW_arr = return_1year_arr(daily_market['BOK_Currency_EU'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      EURKRW_arr = return_3year_arr(daily_market['BOK_Currency_EU'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      EURKRW_arr = return_5year_arr(daily_market['BOK_Currency_EU'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      EURKRW_arr = return_10year_arr(daily_market['BOK_Currency_EU'], daily_market['TIME'])      
    }
    EURKRW_time_arr = EURKRW_arr[0]
    EURKRW_val_arr = EURKRW_arr[1]

    EURKRW_time_arr.push('현재')
    EURKRW_val_arr.push(hourly_market['EURKRW']['value'])    

    myEURKRW_Chart.destroy()
    drawEURKRWChart(EURKRW_time_arr, EURKRW_val_arr, "EURKRW_Chart")
  }

  if(item_checker == "Dollar_Index"){
    if(duration_cheker == "1M"){
      Dollar_Index_arr = return_1month_arr(daily_market['yf_Dollar_Index'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      Dollar_Index_arr = return_3month_arr(daily_market['yf_Dollar_Index'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      Dollar_Index_arr = return_6month_arr(daily_market['yf_Dollar_Index'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      Dollar_Index_arr = return_1year_arr(daily_market['yf_Dollar_Index'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      Dollar_Index_arr = return_3year_arr(daily_market['yf_Dollar_Index'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      Dollar_Index_arr = return_5year_arr(daily_market['yf_Dollar_Index'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      Dollar_Index_arr = return_10year_arr(daily_market['yf_Dollar_Index'], daily_market['TIME'])      
    }
    Dollar_Index_time_arr = Dollar_Index_arr[0]
    Dollar_Index_val_arr = Dollar_Index_arr[1]

    Dollar_Index_time_arr.push('현재')
    Dollar_Index_val_arr.push(hourly_market['Dollar_Index']['value'])    

    myDollarIndex_Chart.destroy()
    drawDollarIndexChart(Dollar_Index_time_arr, Dollar_Index_val_arr, "Dollar_Index_Chart")
  }  

  if(item_checker == "BTCUSD"){
    if(duration_cheker == "1M"){
      BTCUSD_arr = return_1month_arr(daily_market['yf_BTCUSD'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      BTCUSD_arr = return_3month_arr(daily_market['yf_BTCUSD'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      BTCUSD_arr = return_6month_arr(daily_market['yf_BTCUSD'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      BTCUSD_arr = return_1year_arr(daily_market['yf_BTCUSD'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      BTCUSD_arr = return_3year_arr(daily_market['yf_BTCUSD'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      BTCUSD_arr = return_5year_arr(daily_market['yf_BTCUSD'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      BTCUSD_arr = return_10year_arr(daily_market['yf_BTCUSD'], daily_market['TIME'])      
    }
    BTCUSD_time_arr = BTCUSD_arr[0]
    BTCUSD_val_arr = BTCUSD_arr[1]

    BTCUSD_time_arr.push('현재')
    BTCUSD_val_arr.push(hourly_market['USDT-BTC']['value'])    

    myBTCUSD_Chart.destroy()
    drawBTCUSDChart(BTCUSD_time_arr, BTCUSD_val_arr, "BTCUSD_Chart")
  }
  
  if(item_checker == "ETHUSD"){
    if(duration_cheker == "1M"){
      ETHUSD_arr = return_1month_arr(daily_market['yf_ETHUSD'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      ETHUSD_arr = return_3month_arr(daily_market['yf_ETHUSD'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      ETHUSD_arr = return_6month_arr(daily_market['yf_ETHUSD'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      ETHUSD_arr = return_1year_arr(daily_market['yf_ETHUSD'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      ETHUSD_arr = return_3year_arr(daily_market['yf_ETHUSD'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      ETHUSD_arr = return_5year_arr(daily_market['yf_ETHUSD'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      ETHUSD_arr = return_10year_arr(daily_market['yf_ETHUSD'], daily_market['TIME'])      
    }
    ETHUSD_time_arr = ETHUSD_arr[0]
    ETHUSD_val_arr = ETHUSD_arr[1]

    ETHUSD_time_arr.push('현재')
    ETHUSD_val_arr.push(hourly_market['USDT-ETH']['value'])    

    myETHUSD_Chart.destroy()
    drawETHUSDChart(ETHUSD_time_arr, ETHUSD_val_arr, "ETHUSD_Chart")
  }

  if(item_checker == "Gold"){
    if(duration_cheker == "1M"){
      Gold_arr = return_1month_arr(daily_market['yf_Gold'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      Gold_arr = return_3month_arr(daily_market['yf_Gold'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      Gold_arr = return_6month_arr(daily_market['yf_Gold'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      Gold_arr = return_1year_arr(daily_market['yf_Gold'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      Gold_arr = return_3year_arr(daily_market['yf_Gold'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      Gold_arr = return_5year_arr(daily_market['yf_Gold'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      Gold_arr = return_10year_arr(daily_market['yf_Gold'], daily_market['TIME'])      
    }
    Gold_time_arr = Gold_arr[0]
    Gold_val_arr = Gold_arr[1]

    Gold_time_arr.push('현재')

    Gold_hourly_val = (hourly_market['YF_Gold']['value']).replaceAll(",", "")    
    Gold_val_arr.push(Number(Gold_hourly_val))

    myGold_Chart.destroy()
    drawGoldChart(Gold_time_arr, Gold_val_arr, "Gold_Chart")
  }

  if(item_checker == "Silver"){
    if(duration_cheker == "1M"){
      Silver_arr = return_1month_arr(daily_market['yf_Silver'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      Silver_arr = return_3month_arr(daily_market['yf_Silver'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      Silver_arr = return_6month_arr(daily_market['yf_Silver'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      Silver_arr = return_1year_arr(daily_market['yf_Silver'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      Silver_arr = return_3year_arr(daily_market['yf_Silver'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      Silver_arr = return_5year_arr(daily_market['yf_Silver'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      Silver_arr = return_10year_arr(daily_market['yf_Silver'], daily_market['TIME'])      
    }
    Silver_time_arr = Silver_arr[0]
    Silver_val_arr = Silver_arr[1]

    Silver_time_arr.push('현재')
    Silver_val_arr.push(hourly_market['YF_Silver']['value'])    

    mySilver_Chart.destroy()
    drawSilverChart(Silver_time_arr, Silver_val_arr, "Silver_Chart")
  }

  if(item_checker == "Copper"){
    if(duration_cheker == "1M"){
      Copper_arr = return_1month_arr(daily_market['yf_Copper'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      Copper_arr = return_3month_arr(daily_market['yf_Copper'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      Copper_arr = return_6month_arr(daily_market['yf_Copper'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      Copper_arr = return_1year_arr(daily_market['yf_Copper'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      Copper_arr = return_3year_arr(daily_market['yf_Copper'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      Copper_arr = return_5year_arr(daily_market['yf_Copper'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      Copper_arr = return_10year_arr(daily_market['yf_Copper'], daily_market['TIME'])      
    }
    Copper_time_arr = Copper_arr[0]
    Copper_val_arr = Copper_arr[1]

    Copper_time_arr.push('현재')
    Copper_val_arr.push(hourly_market['YF_Copper']['value'])    

    myCopper_Chart.destroy()
    drawCopperChart(Copper_time_arr, Copper_val_arr, "Copper_Chart")
  }

  if(item_checker == "WTI"){
    if(duration_cheker == "1M"){
      WTI_arr = return_1month_arr(daily_market['yf_WTI'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      WTI_arr = return_3month_arr(daily_market['yf_WTI'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      WTI_arr = return_6month_arr(daily_market['yf_WTI'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      WTI_arr = return_1year_arr(daily_market['yf_WTI'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      WTI_arr = return_3year_arr(daily_market['yf_WTI'], daily_market['TIME'])      
    }

    if(duration_cheker == "5Y"){
      WTI_arr = return_5year_arr(daily_market['yf_WTI'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      WTI_arr = return_10year_arr(daily_market['yf_WTI'], daily_market['TIME'])      
    }
    WTI_time_arr = WTI_arr[0]
    WTI_val_arr = WTI_arr[1]

    WTI_time_arr.push('현재')
    WTI_val_arr.push(hourly_market['YF_WTI']['value'])    

    myWTI_Chart.destroy()
    drawWTIChart(WTI_time_arr, WTI_val_arr, "WTI_Chart")
  }

  if(item_checker == "Dubai"){
    /*
    if(duration_cheker == "1M"){
      Dubai_arr = return_1month_arr(monthly_market['BOK_Oil_Dubai'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      Dubai_arr = return_3month_arr(monthly_market['BOK_Oil_Dubai'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      Dubai_arr = return_6month_arr(monthly_market['BOK_Oil_Dubai'], daily_market['TIME'])     
    }
    */
    if(duration_cheker == "1Y"){
      Dubai_arr = return_1year_monthly_arr(monthly_market['BOK_Oil_Dubai'], monthly_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      Dubai_arr = return_3year_monthly_arr(monthly_market['BOK_Oil_Dubai'], monthly_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      Dubai_arr = return_5year_monthly_arr(monthly_market['BOK_Oil_Dubai'], monthly_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      Dubai_arr = return_10year_monthly_arr(monthly_market['BOK_Oil_Dubai'], monthly_market['TIME'])      
    }
    Dubai_time_arr = Dubai_arr[0]
    Dubai_val_arr = Dubai_arr[1]

    Dubai_time_arr.push('현재')
    Dubai_val_arr.push(hourly_market['Dubai']['value'])    

    myDubai_Chart.destroy()
    drawDubaiChart(Dubai_time_arr, Dubai_val_arr, "Dubai_Chart")
  }
  
  if(item_checker == "Brent"){
    if(duration_cheker == "1M"){
      Brent_arr = return_1month_arr(daily_market['yf_Brent'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      Brent_arr = return_3month_arr(daily_market['yf_Brent'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      Brent_arr = return_6month_arr(daily_market['yf_Brent'], daily_market['TIME'])     
    }
    if(duration_cheker == "1Y"){
      Brent_arr = return_1year_arr(daily_market['yf_Brent'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      Brent_arr = return_3year_arr(daily_market['yf_Brent'], daily_market['TIME'])      
    }
    if(duration_cheker == "5Y"){
      Brent_arr = return_5year_arr(daily_market['yf_Brent'], daily_market['TIME'])      
    }
    if(duration_cheker == "10Y"){
      Brent_arr = return_10year_arr(daily_market['yf_Brent'], daily_market['TIME'])      
    }
    Brent_time_arr = Brent_arr[0]
    Brent_val_arr = Brent_arr[1]

    Brent_time_arr.push('현재')
    Brent_val_arr.push(hourly_market['YF_Brent']['value'])    

    myBrent_Chart.destroy()
    drawBrentChart(Brent_time_arr, Brent_val_arr, "Brent_Chart")
  }

  if(item_checker == "US_Bond_Rate"){
    if(duration_cheker == "1M"){
      US_Bond_30y_arr = return_1month_arr(daily_market['FRED_BondYield30'], daily_market['TIME'])
      US_Bond_10y_arr = return_1month_arr(daily_market['FRED_BondYield10'], daily_market['TIME'])
      US_Bond_5y_arr = return_1month_arr(daily_market['FRED_BondYield05'], daily_market['TIME'])
      US_Bond_3y_arr = return_1month_arr(daily_market['FRED_BondYield03'], daily_market['TIME'])
    }
    if(duration_cheker == "3M"){
      US_Bond_30y_arr = return_3month_arr(daily_market['FRED_BondYield30'], daily_market['TIME'])
      US_Bond_10y_arr = return_3month_arr(daily_market['FRED_BondYield10'], daily_market['TIME'])
      US_Bond_5y_arr = return_3month_arr(daily_market['FRED_BondYield05'], daily_market['TIME'])
      US_Bond_3y_arr = return_3month_arr(daily_market['FRED_BondYield03'], daily_market['TIME'])     
    }
    if(duration_cheker == "6M"){
      US_Bond_30y_arr = return_6month_arr(daily_market['FRED_BondYield30'], daily_market['TIME'])
      US_Bond_10y_arr = return_6month_arr(daily_market['FRED_BondYield10'], daily_market['TIME'])
      US_Bond_5y_arr = return_6month_arr(daily_market['FRED_BondYield05'], daily_market['TIME'])
      US_Bond_3y_arr = return_6month_arr(daily_market['FRED_BondYield03'], daily_market['TIME'])
    }
    if(duration_cheker == "1Y"){
      US_Bond_30y_arr = return_1year_arr(daily_market['FRED_BondYield30'], daily_market['TIME'])
      US_Bond_10y_arr = return_1year_arr(daily_market['FRED_BondYield10'], daily_market['TIME'])
      US_Bond_5y_arr = return_1year_arr(daily_market['FRED_BondYield05'], daily_market['TIME'])
      US_Bond_3y_arr = return_1year_arr(daily_market['FRED_BondYield03'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      US_Bond_30y_arr = return_3year_arr(daily_market['FRED_BondYield30'], daily_market['TIME'])
      US_Bond_10y_arr = return_3year_arr(daily_market['FRED_BondYield10'], daily_market['TIME'])
      US_Bond_5y_arr = return_3year_arr(daily_market['FRED_BondYield05'], daily_market['TIME'])
      US_Bond_3y_arr = return_3year_arr(daily_market['FRED_BondYield03'], daily_market['TIME'])
    }
    if(duration_cheker == "5Y"){
      US_Bond_30y_arr = return_5year_arr(daily_market['FRED_BondYield30'], daily_market['TIME'])
      US_Bond_10y_arr = return_5year_arr(daily_market['FRED_BondYield10'], daily_market['TIME'])
      US_Bond_5y_arr = return_5year_arr(daily_market['FRED_BondYield05'], daily_market['TIME'])
      US_Bond_3y_arr = return_5year_arr(daily_market['FRED_BondYield03'], daily_market['TIME'])
    }
    if(duration_cheker == "10Y"){
      US_Bond_30y_arr = return_10year_arr(daily_market['FRED_BondYield30'], daily_market['TIME'])
      US_Bond_10y_arr = return_10year_arr(daily_market['FRED_BondYield10'], daily_market['TIME'])
      US_Bond_5y_arr = return_10year_arr(daily_market['FRED_BondYield05'], daily_market['TIME'])
      US_Bond_3y_arr = return_10year_arr(daily_market['FRED_BondYield03'], daily_market['TIME'])
    }
    US_Bond_30y_time_arr = US_Bond_30y_arr[0]
    US_Bond_30y_val_arr = US_Bond_30y_arr[1]
    US_Bond_10y_val_arr = US_Bond_10y_arr[1]
    US_Bond_5y_val_arr = US_Bond_5y_arr[1]
    US_Bond_3y_val_arr = US_Bond_3y_arr[1]

    US_Bond_30y_time_arr.push('현재')
    US_Bond_30y_val_arr.push(hourly_market['US30YT_Bond']['value'])    
    US_Bond_10y_val_arr.push(hourly_market['US10YT_Bond']['value'])    
    US_Bond_5y_val_arr.push(hourly_market['US5YT_Bond']['value'])    
    US_Bond_3y_val_arr.push(hourly_market['US3YT_Bond']['value'])    

    myUSBondRate_Chart.destroy()
    drawUSBondRateChart(US_Bond_30y_time_arr, US_Bond_30y_val_arr, US_Bond_10y_val_arr, US_Bond_5y_val_arr, US_Bond_3y_val_arr, "US_Bond_Rate_Chart")
  }

  if(item_checker == "KO_Bond_Rate"){
    if(duration_cheker == "1M"){
      KO_Bond_30y_arr = return_1month_arr(daily_market['BOK_BondYield30'], daily_market['TIME'])
      KO_Bond_10y_arr = return_1month_arr(daily_market['BOK_BondYield10'], daily_market['TIME'])
      KO_Bond_5y_arr = return_1month_arr(daily_market['BOK_BondYield05'], daily_market['TIME'])
      KO_Bond_3y_arr = return_1month_arr(daily_market['BOK_BondYield03'], daily_market['TIME'])
    }
    if(duration_cheker == "3M"){
      KO_Bond_30y_arr = return_3month_arr(daily_market['BOK_BondYield30'], daily_market['TIME'])
      KO_Bond_10y_arr = return_3month_arr(daily_market['BOK_BondYield10'], daily_market['TIME'])
      KO_Bond_5y_arr = return_3month_arr(daily_market['BOK_BondYield05'], daily_market['TIME'])
      KO_Bond_3y_arr = return_3month_arr(daily_market['BOK_BondYield03'], daily_market['TIME'])     
    }
    if(duration_cheker == "6M"){
      KO_Bond_30y_arr = return_6month_arr(daily_market['BOK_BondYield30'], daily_market['TIME'])
      KO_Bond_10y_arr = return_6month_arr(daily_market['BOK_BondYield10'], daily_market['TIME'])
      KO_Bond_5y_arr = return_6month_arr(daily_market['BOK_BondYield05'], daily_market['TIME'])
      KO_Bond_3y_arr = return_6month_arr(daily_market['BOK_BondYield03'], daily_market['TIME'])
    }
    if(duration_cheker == "1Y"){
      KO_Bond_30y_arr = return_1year_arr(daily_market['BOK_BondYield30'], daily_market['TIME'])
      KO_Bond_10y_arr = return_1year_arr(daily_market['BOK_BondYield10'], daily_market['TIME'])
      KO_Bond_5y_arr = return_1year_arr(daily_market['BOK_BondYield05'], daily_market['TIME'])
      KO_Bond_3y_arr = return_1year_arr(daily_market['BOK_BondYield03'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      KO_Bond_30y_arr = return_3year_arr(daily_market['BOK_BondYield30'], daily_market['TIME'])
      KO_Bond_10y_arr = return_3year_arr(daily_market['BOK_BondYield10'], daily_market['TIME'])
      KO_Bond_5y_arr = return_3year_arr(daily_market['BOK_BondYield05'], daily_market['TIME'])
      KO_Bond_3y_arr = return_3year_arr(daily_market['BOK_BondYield03'], daily_market['TIME'])
    }
    if(duration_cheker == "5Y"){
      KO_Bond_30y_arr = return_5year_arr(daily_market['BOK_BondYield30'], daily_market['TIME'])
      KO_Bond_10y_arr = return_5year_arr(daily_market['BOK_BondYield10'], daily_market['TIME'])
      KO_Bond_5y_arr = return_5year_arr(daily_market['BOK_BondYield05'], daily_market['TIME'])
      KO_Bond_3y_arr = return_5year_arr(daily_market['BOK_BondYield03'], daily_market['TIME'])
    }
    if(duration_cheker == "10Y"){
      KO_Bond_30y_arr = return_10year_arr(daily_market['BOK_BondYield30'], daily_market['TIME'])
      KO_Bond_10y_arr = return_10year_arr(daily_market['BOK_BondYield10'], daily_market['TIME'])
      KO_Bond_5y_arr = return_10year_arr(daily_market['BOK_BondYield05'], daily_market['TIME'])
      KO_Bond_3y_arr = return_10year_arr(daily_market['BOK_BondYield03'], daily_market['TIME'])
    }
    KO_Bond_30y_time_arr = KO_Bond_30y_arr[0]
    KO_Bond_30y_val_arr = KO_Bond_30y_arr[1]
    KO_Bond_10y_val_arr = KO_Bond_10y_arr[1]
    KO_Bond_5y_val_arr = KO_Bond_5y_arr[1]
    KO_Bond_3y_val_arr = KO_Bond_3y_arr[1]

    KO_Bond_30y_time_arr.push('현재')
    KO_Bond_30y_val_arr.push(hourly_market['KR30YT_Bond']['value'])    
    KO_Bond_10y_val_arr.push(hourly_market['KR10YT_Bond']['value'])    
    KO_Bond_5y_val_arr.push(hourly_market['KR5YT_Bond']['value'])    
    KO_Bond_3y_val_arr.push(hourly_market['KR3YT_Bond']['value'])    

    myKOBondRate_Chart.destroy()
    drawKOBondRateChart(KO_Bond_30y_time_arr, KO_Bond_30y_val_arr, KO_Bond_10y_val_arr, KO_Bond_5y_val_arr, KO_Bond_3y_val_arr, "KO_Bond_Rate_Chart")
  }   

  if(item_checker == "KO_US_Interest"){
    /*
    if(duration_cheker == "1M"){
      Brent_arr = return_1month_arr(daily_market['yf_Brent'], daily_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      Brent_arr = return_3month_arr(daily_market['yf_Brent'], daily_market['TIME'])      
    }
    if(duration_cheker == "6M"){
      Brent_arr = return_6month_arr(daily_market['yf_Brent'], daily_market['TIME'])     
    }
    */
    if(duration_cheker == "1Y"){      
      BOK_interest_arr = return_1year_monthly_arr(monthly_market['BOK_Standard_Interest'], monthly_market['TIME'])
      FRED_interest_arr = return_1year_monthly_arr(FRED_interest_monthly_arr, FRED_time_monthly_arr)
    }
    if(duration_cheker == "3Y"){
      BOK_interest_arr = return_3year_monthly_arr(monthly_market['BOK_Standard_Interest'], monthly_market['TIME'])
      FRED_interest_arr = return_3year_monthly_arr(FRED_interest_monthly_arr, FRED_time_monthly_arr)
    }
    if(duration_cheker == "5Y"){
      BOK_interest_arr = return_5year_monthly_arr(monthly_market['BOK_Standard_Interest'], monthly_market['TIME'])
      FRED_interest_arr = return_5year_monthly_arr(FRED_interest_monthly_arr, FRED_time_monthly_arr)
    }
    if(duration_cheker == "10Y"){
      BOK_interest_arr = return_10year_monthly_arr(monthly_market['BOK_Standard_Interest'], monthly_market['TIME'])
      FRED_interest_arr = return_10year_monthly_arr(FRED_interest_monthly_arr, FRED_time_monthly_arr)
    }
    BOK_interest_time_arr = BOK_interest_arr[0]
    BOK_interest_val_arr = BOK_interest_arr[1]
    FRED_interest_val_arr = FRED_interest_arr[1]

    myInterest_Chart.destroy()
    drawInterestChart(BOK_interest_time_arr, BOK_interest_val_arr, FRED_interest_val_arr, "Interest_Chart")
  }

  if(item_checker == "KO_total_asset"){
    /*
    if(duration_cheker == "1M"){
      KO_total_asset_arr = return_1month_arr(monthly_market['BOK_Total_Asset'], monthly_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      KO_total_asset_arr = return_3month_arr(monthly_market['BOK_Total_Asset'], monthly_market['TIME'])  
    }
    if(duration_cheker == "6M"){
      KO_total_asset_arr = return_6month_arr(monthly_market['BOK_Total_Asset'], monthly_market['TIME'])  
    }
    */
    if(duration_cheker == "1Y"){
      KO_total_asset_arr = return_1year_monthly_arr(monthly_market['BOK_Total_Asset'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      KO_total_asset_arr = return_3year_monthly_arr(monthly_market['BOK_Total_Asset'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      KO_total_asset_arr = return_5year_monthly_arr(monthly_market['BOK_Total_Asset'], monthly_market['TIME'])  
    }
    if(duration_cheker == "10Y"){
      KO_total_asset_arr = return_10year_monthly_arr(monthly_market['BOK_Total_Asset'], monthly_market['TIME'])  
    }
    KO_total_asset_time_arr = KO_total_asset_arr[0]
    KO_total_asset_val_arr = KO_total_asset_arr[1]

    myKO_TotalAsset_Chart.destroy()
    drawKOTotalAssetChart(KO_total_asset_time_arr, KO_total_asset_val_arr, "KO_total_asset_Chart")
  }

  if(item_checker == "US_total_asset"){
    /*
    if(duration_cheker == "1M"){
      US_total_asset_arr = return_1month_arr(monthly_market['BOK_Total_Asset'], monthly_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      US_total_asset_arr = return_3month_arr(monthly_market['BOK_Total_Asset'], monthly_market['TIME'])  
    }
    if(duration_cheker == "6M"){
      US_total_asset_arr = return_6month_arr(monthly_market['BOK_Total_Asset'], monthly_market['TIME'])  
    }
    */
    if(duration_cheker == "1Y"){
      US_total_asset_arr = return_1year_weekly_arr(daily_market['FRED_Total_Asset'], daily_market['TIME'])
    }
    if(duration_cheker == "3Y"){
      US_total_asset_arr = return_3year_weekly_arr(daily_market['FRED_Total_Asset'], daily_market['TIME'])
    }
    if(duration_cheker == "5Y"){
      US_total_asset_arr = return_5year_weekly_arr(daily_market['FRED_Total_Asset'], daily_market['TIME'])
    }
    if(duration_cheker == "10Y"){
      US_total_asset_arr = return_10year_weekly_arr(daily_market['FRED_Total_Asset'], daily_market['TIME'])
    }
    US_total_asset_time_arr = US_total_asset_arr[0]
    US_total_asset_val_arr = US_total_asset_arr[1]

    myUS_TotalAsset_Chart.destroy()
    drawUSTotalAssetChart(US_total_asset_time_arr, US_total_asset_val_arr, "US_total_asset_Chart")
  }

  if(item_checker == "KO_external_money"){
    /*
    if(duration_cheker == "1M"){
      KO_external_money_arr = return_1month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      KO_external_money_arr = return_3month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    if(duration_cheker == "6M"){
      KO_external_money_arr = return_6month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    */
    if(duration_cheker == "1Y"){
      KO_external_money_arr = return_1year_monthly_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      KO_external_money_arr = return_3year_monthly_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      KO_external_money_arr = return_5year_monthly_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    if(duration_cheker == "10Y"){
      KO_external_money_arr = return_10year_monthly_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    KO_external_money_time_arr = KO_external_money_arr[0]
    KO_external_money_val_arr = KO_external_money_arr[1]

    myKO_ExternalMoney_Chart.destroy()
    drawKOExternalMoneyChart(KO_external_money_time_arr, KO_external_money_val_arr, "KO_external_money_Chart")
  }

  if(item_checker == "KO_bond_published"){
    /*
    if(duration_cheker == "1M"){
      KO_external_money_arr = return_1month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      KO_external_money_arr = return_3month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    if(duration_cheker == "6M"){
      KO_external_money_arr = return_6month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    */
    if(duration_cheker == "1Y"){
      KO_bond_published_arr = return_1year_monthly_arr(monthly_market['BOK_Bond_Publish'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      KO_bond_published_arr = return_3year_monthly_arr(monthly_market['BOK_Bond_Publish'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      KO_bond_published_arr = return_5year_monthly_arr(monthly_market['BOK_Bond_Publish'], monthly_market['TIME'])  
    }
    if(duration_cheker == "10Y"){
      KO_bond_published_arr = return_10year_monthly_arr(monthly_market['BOK_Bond_Publish'], monthly_market['TIME'])  
    }
    KO_bond_published_time_arr = KO_bond_published_arr[0]
    KO_bond_published_val_arr = KO_bond_published_arr[1]

    myKO_BondPublished_Chart.destroy()
    drawKObondpublishedChart(KO_bond_published_time_arr, KO_bond_published_val_arr, "KO_bond_published_Chart")
  }

  if(item_checker == "KO_bond_remain"){
    /*
    if(duration_cheker == "1M"){
      KO_external_money_arr = return_1month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      KO_external_money_arr = return_3month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    if(duration_cheker == "6M"){
      KO_external_money_arr = return_6month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    */
    if(duration_cheker == "1Y"){
      KO_bond_remain_arr = return_1year_monthly_arr(monthly_market['BOK_Bond_Remain'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      KO_bond_remain_arr = return_3year_monthly_arr(monthly_market['BOK_Bond_Remain'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      KO_bond_remain_arr = return_5year_monthly_arr(monthly_market['BOK_Bond_Remain'], monthly_market['TIME'])  
    }
    if(duration_cheker == "10Y"){
      KO_bond_remain_arr = return_10year_monthly_arr(monthly_market['BOK_Bond_Remain'], monthly_market['TIME'])  
    }
    KO_bond_remain_time_arr = KO_bond_remain_arr[0]
    KO_bond_remain_val_arr = KO_bond_remain_arr[1]

    myKO_Bondremain_Chart.destroy()
    drawKObondremainChart(KO_bond_remain_time_arr, KO_bond_remain_val_arr, "KO_bond_remain_Chart")
  }

  if(item_checker == "KO_trade_out"){
    /*
    if(duration_cheker == "1M"){
      KO_external_money_arr = return_1month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      KO_external_money_arr = return_3month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    if(duration_cheker == "6M"){
      KO_external_money_arr = return_6month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    */
    if(duration_cheker == "1Y"){
      KO_trade_out_arr = return_1year_monthly_arr(monthly_market['BOK_Trade_Out'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      KO_trade_out_arr = return_3year_monthly_arr(monthly_market['BOK_Trade_Out'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      KO_trade_out_arr = return_5year_monthly_arr(monthly_market['BOK_Trade_Out'], monthly_market['TIME'])  
    }
    if(duration_cheker == "10Y"){
      KO_trade_out_arr = return_10year_monthly_arr(monthly_market['BOK_Trade_Out'], monthly_market['TIME'])  
    }
    KO_trade_out_time_arr = KO_trade_out_arr[0]
    KO_trade_out_val_arr = KO_trade_out_arr[1]

    myKO_TradeOut_Chart.destroy()
    drawKOtradeoutChart(KO_trade_out_time_arr, KO_trade_out_val_arr, "KO_trade_out_Chart")
  }

  if(item_checker == "KO_trade_in"){
    /*
    if(duration_cheker == "1M"){
      KO_external_money_arr = return_1month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      KO_external_money_arr = return_3month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    if(duration_cheker == "6M"){
      KO_external_money_arr = return_6month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    */
    if(duration_cheker == "1Y"){
      KO_trade_in_arr = return_1year_monthly_arr(monthly_market['BOK_Trade_In'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      KO_trade_in_arr = return_3year_monthly_arr(monthly_market['BOK_Trade_In'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      KO_trade_in_arr = return_5year_monthly_arr(monthly_market['BOK_Trade_In'], monthly_market['TIME'])  
    }
    if(duration_cheker == "10Y"){
      KO_trade_in_arr = return_10year_monthly_arr(monthly_market['BOK_Trade_In'], monthly_market['TIME'])  
    }
    KO_trade_in_time_arr = KO_trade_in_arr[0]
    KO_trade_in_val_arr = KO_trade_in_arr[1]

    myKO_TradeIn_Chart.destroy()
    drawKOtradeinChart(KO_trade_in_time_arr, KO_trade_in_val_arr, "KO_trade_in_Chart")
  }

  if(item_checker == "KO_trade_profit"){
    /*
    if(duration_cheker == "1M"){
      KO_external_money_arr = return_1month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      KO_external_money_arr = return_3month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    if(duration_cheker == "6M"){
      KO_external_money_arr = return_6month_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])  
    }
    */
    if(duration_cheker == "1Y"){
      KO_trade_profit_arr = return_1year_monthly_arr(monthly_market['BOK_Trade_Profit'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      KO_trade_profit_arr = return_3year_monthly_arr(monthly_market['BOK_Trade_Profit'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      KO_trade_profit_arr = return_5year_monthly_arr(monthly_market['BOK_Trade_Profit'], monthly_market['TIME'])  
    }
    if(duration_cheker == "10Y"){
      KO_trade_profit_arr = return_10year_monthly_arr(monthly_market['BOK_Trade_Profit'], monthly_market['TIME'])  
    }
    KO_trade_profit_time_arr = KO_trade_profit_arr[0]
    KO_trade_profit_val_arr = KO_trade_profit_arr[1]

    myKO_TradeProfit_Chart.destroy()
    drawKOtradeprofitChart(KO_trade_profit_time_arr, KO_trade_profit_val_arr, "KO_trade_profit_Chart")
  }

  if(item_checker == "KO_GDP"){
    /*
    if(duration_cheker == "1M"){
      KO_external_money_arr = return_1month_arr(monthly_market['DATA_VALUE_GDP'], monthly_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      KO_external_money_arr = return_3month_arr(monthly_market['DATA_VALUE_GDP'], monthly_market['TIME'])  
    }
    if(duration_cheker == "6M"){
      KO_external_money_arr = return_6month_arr(monthly_market['DATA_VALUE_GDP'], monthly_market['TIME'])  
    }    
    if(duration_cheker == "1Y"){
      KO_GDP_arr = return_1year_monthly_arr(monthly_market['DATA_VALUE_GDP'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      KO_GDP_arr = return_3year_monthly_arr(monthly_market['DATA_VALUE_GDP'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      KO_GDP_arr = return_5year_monthly_arr(monthly_market['DATA_VALUE_GDP'], monthly_market['TIME'])  
    }
    */
    if(duration_cheker == "10Y"){
      KO_GDP_arr = return_10year_yearly_arr(monthly_market['DATA_VALUE_GDP'], monthly_market['TIME'])  
    }
    KO_GDP_time_arr = KO_GDP_arr[0]
    KO_GDP_val_arr = KO_GDP_arr[1]

    myGDP_Chart.destroy()
    drawGDPChart(KO_GDP_time_arr, KO_GDP_val_arr, "KO_GDP_Chart")
  }

  if(item_checker == "KO_GNI"){
    /*
    if(duration_cheker == "1M"){
      KO_external_money_arr = return_1month_arr(monthly_market['DATA_VALUE_GNI'], monthly_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      KO_external_money_arr = return_3month_arr(monthly_market['DATA_VALUE_GNI'], monthly_market['TIME'])  
    }
    if(duration_cheker == "6M"){
      KO_external_money_arr = return_6month_arr(monthly_market['DATA_VALUE_GNI'], monthly_market['TIME'])  
    }    
    if(duration_cheker == "1Y"){
      KO_GNI_arr = return_1year_monthly_arr(monthly_market['DATA_VALUE_GNI'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      KO_GNI_arr = return_3year_monthly_arr(monthly_market['DATA_VALUE_GNI'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      KO_GNI_arr = return_5year_monthly_arr(monthly_market['DATA_VALUE_GNI'], monthly_market['TIME'])  
    }
    */
    if(duration_cheker == "10Y"){
      KO_GNI_arr = return_10year_yearly_arr(monthly_market['DATA_VALUE_GNI'], monthly_market['TIME'])  
    }
    KO_GNI_time_arr = KO_GNI_arr[0]
    KO_GNI_val_arr = KO_GNI_arr[1]

    myGNI_Chart.destroy()
    drawGNIChart(KO_GNI_time_arr, KO_GNI_val_arr, "KO_GNI_Chart")
  }

  if(item_checker == "Housing_Trade_All"){
    /*
    if(duration_cheker == "1M"){
      KO_external_money_arr = return_1month_arr(monthly_market['BOK_Housing_Trade_All'], monthly_market['TIME'])      
    }
    if(duration_cheker == "3M"){
      KO_external_money_arr = return_3month_arr(monthly_market['BOK_Housing_Trade_All'], monthly_market['TIME'])  
    }
    if(duration_cheker == "6M"){
      KO_external_money_arr = return_6month_arr(monthly_market['BOK_Housing_Trade_All'], monthly_market['TIME'])  
    }
    */
    if(duration_cheker == "1Y"){
      Housing_Trade_All_arr = return_1year_monthly_arr(monthly_market['BOK_Housing_Trade_All'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      Housing_Trade_All_arr = return_3year_monthly_arr(monthly_market['BOK_Housing_Trade_All'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      Housing_Trade_All_arr = return_5year_monthly_arr(monthly_market['BOK_Housing_Trade_All'], monthly_market['TIME'])  
    }
    if(duration_cheker == "10Y"){
      Housing_Trade_All_arr = return_10year_monthly_arr(monthly_market['BOK_Housing_Trade_All'], monthly_market['TIME'])  
    }
    Housing_Trade_All_time_arr = Housing_Trade_All_arr[0]
    Housing_Trade_All_val_arr = Housing_Trade_All_arr[1]

    myHousingTradeAll_Chart.destroy()
    drawHousingTradeAllChart(Housing_Trade_All_time_arr, Housing_Trade_All_val_arr, "Housing_Trade_All_Chart")
  }

  if(item_checker == "Housing_Trade_Apt"){
    if(duration_cheker == "1Y"){
      Housing_Trade_Apt_arr = return_1year_monthly_arr(monthly_market['BOK_Housing_Trade_Apt'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      Housing_Trade_Apt_arr = return_3year_monthly_arr(monthly_market['BOK_Housing_Trade_Apt'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      Housing_Trade_Apt_arr = return_5year_monthly_arr(monthly_market['BOK_Housing_Trade_Apt'], monthly_market['TIME'])  
    }
    if(duration_cheker == "10Y"){
      Housing_Trade_Apt_arr = return_10year_monthly_arr(monthly_market['BOK_Housing_Trade_Apt'], monthly_market['TIME'])  
    }
    Housing_Trade_Apt_time_arr = Housing_Trade_Apt_arr[0]
    Housing_Trade_Apt_val_arr = Housing_Trade_Apt_arr[1]

    myHousingTradeApt_Chart.destroy()
    drawHousingTradeAptChart(Housing_Trade_Apt_time_arr, Housing_Trade_Apt_val_arr, "Housing_Trade_Apt_Chart")
  }

  if(item_checker == "Housing_Rent_All"){
    if(duration_cheker == "1Y"){
      Housing_Rent_All_arr = return_1year_monthly_arr(monthly_market['BOK_Housing_Rent_All'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      Housing_Rent_All_arr = return_3year_monthly_arr(monthly_market['BOK_Housing_Rent_All'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      Housing_Rent_All_arr = return_5year_monthly_arr(monthly_market['BOK_Housing_Rent_All'], monthly_market['TIME'])  
    }
    if(duration_cheker == "10Y"){
      Housing_Rent_All_arr = return_10year_monthly_arr(monthly_market['BOK_Housing_Rent_All'], monthly_market['TIME'])  
    }
    Housing_Rent_All_time_arr = Housing_Rent_All_arr[0]
    Housing_Rent_All_val_arr = Housing_Rent_All_arr[1]

    myHousingRentAll_Chart.destroy()
    drawHousingRentAllChart(Housing_Rent_All_time_arr, Housing_Rent_All_val_arr, "Housing_Rent_All_Chart")
  }  

  if(item_checker == "Housing_Rent_Apt"){
    if(duration_cheker == "1Y"){
      Housing_Rent_Apt_arr = return_1year_monthly_arr(monthly_market['BOK_Housing_Rent_Apt'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      Housing_Rent_Apt_arr = return_3year_monthly_arr(monthly_market['BOK_Housing_Rent_Apt'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      Housing_Rent_Apt_arr = return_5year_monthly_arr(monthly_market['BOK_Housing_Rent_Apt'], monthly_market['TIME'])  
    }
    if(duration_cheker == "10Y"){
      Housing_Rent_Apt_arr = return_10year_monthly_arr(monthly_market['BOK_Housing_Rent_Apt'], monthly_market['TIME'])  
    }
    Housing_Rent_Apt_time_arr = Housing_Rent_Apt_arr[0]
    Housing_Rent_Apt_val_arr = Housing_Rent_Apt_arr[1]

    myHousingRentApt_Chart.destroy()
    drawHousingRentAptChart(Housing_Rent_Apt_time_arr, Housing_Rent_Apt_val_arr, "Housing_Rent_Apt_Chart")
  }

  if(item_checker == "Mind_Consumer"){
    if(duration_cheker == "1Y"){
      Mind_Consumer_arr = return_1year_monthly_arr(monthly_market['BOK_Mind_Consumer'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      Mind_Consumer_arr = return_3year_monthly_arr(monthly_market['BOK_Mind_Consumer'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      Mind_Consumer_arr = return_5year_monthly_arr(monthly_market['BOK_Mind_Consumer'], monthly_market['TIME'])  
    }
    if(duration_cheker == "10Y"){
      Mind_Consumer_arr = return_10year_monthly_arr(monthly_market['BOK_Mind_Consumer'], monthly_market['TIME'])  
    }
    Mind_Consumer_time_arr = Mind_Consumer_arr[0]
    Mind_Consumer_val_arr = Mind_Consumer_arr[1]

    myMindConsumer_Chart.destroy()
    drawMindConsumerChart(Mind_Consumer_time_arr, Mind_Consumer_val_arr, "Mind_Consumer_Chart")
  }

  if(item_checker == "Mind_Economy"){
    if(duration_cheker == "1Y"){
      Mind_Economy_arr = return_1year_monthly_arr(monthly_market['BOK_Mind_Economy'], monthly_market['TIME'])  
    }
    if(duration_cheker == "3Y"){
      Mind_Economy_arr = return_3year_monthly_arr(monthly_market['BOK_Mind_Economy'], monthly_market['TIME'])  
    }
    if(duration_cheker == "5Y"){
      Mind_Economy_arr = return_5year_monthly_arr(monthly_market['BOK_Mind_Economy'], monthly_market['TIME'])  
    }
    if(duration_cheker == "10Y"){
      Mind_Economy_arr = return_10year_monthly_arr(monthly_market['BOK_Mind_Economy'], monthly_market['TIME'])  
    }
    Mind_Economy_time_arr = Mind_Economy_arr[0]
    Mind_Economy_val_arr = Mind_Economy_arr[1]

    myMindEconomy_Chart.destroy()
    drawMindEconomyChart(Mind_Economy_time_arr, Mind_Economy_val_arr, "Mind_Economy_Chart")
  }

  if(item_checker == "MONEY_FLOW"){
    if(duration_cheker == "1Y"){
      mf_time_arr = return_MoneyFlow_time(moneyflow_market['TIME'], "1Y")

      mf_us_total_asset = return_MoneyFlow_arr( moneyflow_market['FRED_Total_Asset_NOR'], "1Y" )
      mf_ko_total_asset = return_MoneyFlow_arr( moneyflow_market['BOK_Total_Asset_NOR'], "1Y" )

      mf_oil_wti = return_MoneyFlow_arr( moneyflow_market['BOK_Oil_WTI_NOR'], "1Y" )
      mf_oil_dubai = return_MoneyFlow_arr( moneyflow_market['BOK_Oil_Dubai_NOR'], "1Y" )

      mf_metal_gold = return_MoneyFlow_arr( moneyflow_market['BOK_Metal_Gold_NOR'], "1Y" )

      mf_housing_trade_all = return_MoneyFlow_arr( moneyflow_market['BOK_Housing_Trade_All_NOR'], "1Y" )
      mf_housing_trade_apt = return_MoneyFlow_arr( moneyflow_market['BOK_Housing_Trade_Apt_NOR'], "1Y" )
      mf_housing_apt_price = return_MoneyFlow_arr( moneyflow_market['KOR_APT_PRICE_NOR'], "1Y" )

      mf_us_nas = return_MoneyFlow_arr( moneyflow_market['yf_NASDAQ_NOR'], "1Y" )
      mf_us_snp = return_MoneyFlow_arr( moneyflow_market['yf_SNP_NOR'], "1Y" )
      mf_us_dow = return_MoneyFlow_arr( moneyflow_market['yf_DOW_NOR'], "1Y" )      

      mf_ko_kospi = return_MoneyFlow_arr( moneyflow_market['yf_KOSPI_NOR'], "1Y" )
      mf_ko_kosdaq = return_MoneyFlow_arr( moneyflow_market['yf_KOSDAQ_NOR'], "1Y" )
      mf_ko_kospi_kosdaq = return_MoneyFlow_arr( moneyflow_market['yf_KOSPI_KOSDAQ_NOR'], "1Y" )

      mf_currency_USDKRW = return_MoneyFlow_arr( moneyflow_market['BOK_Currency_US_NOR'], "1Y" )
      mf_currency_JPYKRW = return_MoneyFlow_arr( moneyflow_market['BOK_Currency_JP_NOR'], "1Y" )

      mf_coin_btc = return_MoneyFlow_arr( moneyflow_market['yf_BTCUSD_NOR'], "1Y" )      
    }
    if(duration_cheker == "3Y"){
      mf_time_arr = return_MoneyFlow_time(moneyflow_market['TIME'], "3Y")

      mf_us_total_asset = return_MoneyFlow_arr( moneyflow_market['FRED_Total_Asset_NOR'], "3Y" )
      mf_ko_total_asset = return_MoneyFlow_arr( moneyflow_market['BOK_Total_Asset_NOR'], "3Y" )

      mf_oil_wti = return_MoneyFlow_arr( moneyflow_market['BOK_Oil_WTI_NOR'], "3Y" )
      mf_oil_dubai = return_MoneyFlow_arr( moneyflow_market['BOK_Oil_Dubai_NOR'], "3Y" )

      mf_metal_gold = return_MoneyFlow_arr( moneyflow_market['BOK_Metal_Gold_NOR'], "3Y" )

      mf_housing_trade_all = return_MoneyFlow_arr( moneyflow_market['BOK_Housing_Trade_All_NOR'], "3Y" )
      mf_housing_trade_apt = return_MoneyFlow_arr( moneyflow_market['BOK_Housing_Trade_Apt_NOR'], "3Y" )
      mf_housing_apt_price = return_MoneyFlow_arr( moneyflow_market['KOR_APT_PRICE_NOR'], "3Y" )

      mf_us_nas = return_MoneyFlow_arr( moneyflow_market['yf_NASDAQ_NOR'], "3Y" )
      mf_us_snp = return_MoneyFlow_arr( moneyflow_market['yf_SNP_NOR'], "3Y" )
      mf_us_dow = return_MoneyFlow_arr( moneyflow_market['yf_DOW_NOR'], "3Y" )      

      mf_ko_kospi = return_MoneyFlow_arr( moneyflow_market['yf_KOSPI_NOR'], "3Y" )
      mf_ko_kosdaq = return_MoneyFlow_arr( moneyflow_market['yf_KOSDAQ_NOR'], "3Y" )
      mf_ko_kospi_kosdaq = return_MoneyFlow_arr( moneyflow_market['yf_KOSPI_KOSDAQ_NOR'], "3Y" )

      mf_currency_USDKRW = return_MoneyFlow_arr( moneyflow_market['BOK_Currency_US_NOR'], "3Y" )
      mf_currency_JPYKRW = return_MoneyFlow_arr( moneyflow_market['BOK_Currency_JP_NOR'], "3Y" )

      mf_coin_btc = return_MoneyFlow_arr( moneyflow_market['yf_BTCUSD_NOR'], "3Y" )  
    }
    if(duration_cheker == "5Y"){
      mf_time_arr = return_MoneyFlow_time(moneyflow_market['TIME'], "5Y")

      mf_us_total_asset = return_MoneyFlow_arr( moneyflow_market['FRED_Total_Asset_NOR'], "5Y" )
      mf_ko_total_asset = return_MoneyFlow_arr( moneyflow_market['BOK_Total_Asset_NOR'], "5Y" )

      mf_oil_wti = return_MoneyFlow_arr( moneyflow_market['BOK_Oil_WTI_NOR'], "5Y" )
      mf_oil_dubai = return_MoneyFlow_arr( moneyflow_market['BOK_Oil_Dubai_NOR'], "5Y" )

      mf_metal_gold = return_MoneyFlow_arr( moneyflow_market['BOK_Metal_Gold_NOR'], "5Y" )

      mf_housing_trade_all = return_MoneyFlow_arr( moneyflow_market['BOK_Housing_Trade_All_NOR'], "5Y" )
      mf_housing_trade_apt = return_MoneyFlow_arr( moneyflow_market['BOK_Housing_Trade_Apt_NOR'], "5Y" )
      mf_housing_apt_price = return_MoneyFlow_arr( moneyflow_market['KOR_APT_PRICE_NOR'], "5Y" )

      mf_us_nas = return_MoneyFlow_arr( moneyflow_market['yf_NASDAQ_NOR'], "5Y" )
      mf_us_snp = return_MoneyFlow_arr( moneyflow_market['yf_SNP_NOR'], "5Y" )
      mf_us_dow = return_MoneyFlow_arr( moneyflow_market['yf_DOW_NOR'], "5Y" )      

      mf_ko_kospi = return_MoneyFlow_arr( moneyflow_market['yf_KOSPI_NOR'], "5Y" )
      mf_ko_kosdaq = return_MoneyFlow_arr( moneyflow_market['yf_KOSDAQ_NOR'], "5Y" )
      mf_ko_kospi_kosdaq = return_MoneyFlow_arr( moneyflow_market['yf_KOSPI_KOSDAQ_NOR'], "5Y" )

      mf_currency_USDKRW = return_MoneyFlow_arr( moneyflow_market['BOK_Currency_US_NOR'], "5Y" )
      mf_currency_JPYKRW = return_MoneyFlow_arr( moneyflow_market['BOK_Currency_JP_NOR'], "5Y" )

      mf_coin_btc = return_MoneyFlow_arr( moneyflow_market['yf_BTCUSD_NOR'], "5Y" )  
    }
    if(duration_cheker == "10Y"){
      mf_time_arr = return_MoneyFlow_time(moneyflow_market['TIME'], "10Y")

      mf_us_total_asset = return_MoneyFlow_arr( moneyflow_market['FRED_Total_Asset_NOR'], "10Y" )
      mf_ko_total_asset = return_MoneyFlow_arr( moneyflow_market['BOK_Total_Asset_NOR'], "10Y" )

      mf_oil_wti = return_MoneyFlow_arr( moneyflow_market['BOK_Oil_WTI_NOR'], "10Y" )
      mf_oil_dubai = return_MoneyFlow_arr( moneyflow_market['BOK_Oil_Dubai_NOR'], "10Y" )

      mf_metal_gold = return_MoneyFlow_arr( moneyflow_market['BOK_Metal_Gold_NOR'], "10Y" )

      mf_housing_trade_all = return_MoneyFlow_arr( moneyflow_market['BOK_Housing_Trade_All_NOR'], "10Y" )
      mf_housing_trade_apt = return_MoneyFlow_arr( moneyflow_market['BOK_Housing_Trade_Apt_NOR'], "10Y" )
      mf_housing_apt_price = return_MoneyFlow_arr( moneyflow_market['KOR_APT_PRICE_NOR'], "10Y" )

      mf_us_nas = return_MoneyFlow_arr( moneyflow_market['yf_NASDAQ_NOR'], "10Y" )
      mf_us_snp = return_MoneyFlow_arr( moneyflow_market['yf_SNP_NOR'], "10Y" )
      mf_us_dow = return_MoneyFlow_arr( moneyflow_market['yf_DOW_NOR'], "10Y" )      

      mf_ko_kospi = return_MoneyFlow_arr( moneyflow_market['yf_KOSPI_NOR'], "10Y" )
      mf_ko_kosdaq = return_MoneyFlow_arr( moneyflow_market['yf_KOSDAQ_NOR'], "10Y" )
      mf_ko_kospi_kosdaq = return_MoneyFlow_arr( moneyflow_market['yf_KOSPI_KOSDAQ_NOR'], "10Y" )

      mf_currency_USDKRW = return_MoneyFlow_arr( moneyflow_market['BOK_Currency_US_NOR'], "10Y" )
      mf_currency_JPYKRW = return_MoneyFlow_arr( moneyflow_market['BOK_Currency_JP_NOR'], "10Y" )

      mf_coin_btc = return_MoneyFlow_arr( moneyflow_market['yf_BTCUSD_NOR'], "10Y" )  
    }

    value_arr = Object.values(moneyflow_market['TIME'])
    value_index = value_arr.indexOf('2019-06-01')
  
    mf_time_arr.push("현재")
    mf_oil_wti.push( return_last_value_rate(moneyflow_market['FRED_WTI'], hourly_market['WTI']['value'], value_index) )
    mf_oil_dubai.push( return_last_value_rate(moneyflow_market['FRED_Dubai'], hourly_market['Dubai']['value'], value_index) )
    Gold_hourly_val = (hourly_market['YF_Gold']['value']).replaceAll(",", "") 
    mf_metal_gold.push( return_last_value_rate(moneyflow_market['yf_Gold'], Number(Gold_hourly_val), value_index) )
    mf_us_nas.push( return_last_value_rate(moneyflow_market['yf_NASDAQ'], hourly_market['NAS']['value'], value_index) )
    mf_us_snp.push( return_last_value_rate(moneyflow_market['yf_SNP'], hourly_market['SNP']['value'], value_index) )
    mf_us_dow.push( return_last_value_rate(moneyflow_market['yf_DOW'], hourly_market['DOW']['value'], value_index) )
    mf_ko_kospi.push( return_last_value_rate(moneyflow_market['yf_KOSPI'], hourly_market['KOSPI']['value'], value_index) )
    mf_ko_kosdaq.push( return_last_value_rate(moneyflow_market['yf_KOSDAQ'], hourly_market['KOSDAQ']['value'], value_index) )
    mf_ko_kospi_kosdaq.push( return_last_value_rate(moneyflow_market['yf_KOSPI_KOSDAQ'], hourly_market['KOSPI']['value']+hourly_market['KOSDAQ']['value'], value_index) )
    mf_currency_USDKRW.push( return_last_value_rate(moneyflow_market['BOK_Currency_US'], hourly_market['USDKRW']['value'], value_index) )
    mf_currency_JPYKRW.push( return_last_value_rate(moneyflow_market['BOK_Currency_JP'], hourly_market['JPYKRW']['value'], value_index) )
    mf_coin_btc.push( return_last_value_rate(moneyflow_market['yf_BTCUSD'], hourly_market['USDT-BTC']['value'], value_index) )

    //moneyflow_dataset = [mf_us_total_asset, mf_ko_total_asset, mf_oil_wti, mf_oil_dubai, mf_metal_gold, mf_housing_trade_all, mf_housing_trade_apt, mf_housing_apt_price, mf_us_nas, mf_us_dow, mf_us_snp, mf_ko_kospi, mf_ko_kosdaq, mf_ko_kospi_kosdaq, mf_coin_btc]
    moneyflow_dataset = [mf_us_total_asset, mf_ko_total_asset, mf_oil_wti, mf_oil_dubai, mf_metal_gold, mf_housing_trade_all, mf_housing_trade_apt, mf_housing_apt_price, mf_us_nas, mf_us_dow, mf_us_snp, mf_ko_kospi, mf_ko_kosdaq, mf_ko_kospi_kosdaq, mf_currency_USDKRW, mf_currency_JPYKRW, mf_coin_btc]

    console.log(mf_time_arr)
    console.log(moneyflow_dataset)
    myMoneyFlow_Chart.destroy()
    drawMoneyFlowChart(mf_time_arr, moneyflow_dataset, "MoneyFlow_Chart")
  }     
}