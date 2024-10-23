var prev_selected = ""

function goScroll_m(dest_id){
  dest_offset = menu_position[0].toFixed(0)
  dest = menu_position[dest_id]
  prev_selected = menu_all[dest_id]  
  scrollTo(0, dest-dest_offset)
  //$('#graph_area').animate( {scrollTop: (dest-145)}, 350 )
  return false;
}

function show_daily_info_m(){
  shortcut_html = ""  
  shortcut_html += "<div id='shortcut_menu'>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(0)'>#국내 증시</div>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(1)'>#미국 증시</div>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(2)'>#환율</div>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(3)'>#코인</div>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(4)'>#금/원자재</div>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(5)'>#국제유가</div>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(6)'>#채권수익률</div>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(7)'>#금리</div>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(8)'>#통화/외환</div>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(9)'>#채권</div>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(10)'>#무역</div>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(11)'>#소득</div>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(12)'>#부동산</div>"
    shortcut_html +="<div class='btnQuick' onClick='goScroll_m(13)'>#심리지표</div>"
  shortcut_html +="</div>"  
  
  $('#shortcut').append(shortcut_html);

  
  addon_html = ""  
  //국내 증시 
    addon_html += "<div class='daily_header'>"

      addon_html += "<div class='daily_title' id='KO_Stock'>"
        addon_html += "<div class='daily_main'>국내 증시</div>"
        addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"
      addon_html += "</div>"

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
          addon_html += "</div>"

            addon_html += "<div class='graph'> <canvas id='KOSPI_Chart'></canvas></div>"          

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
          addon_html += "</div>"

          addon_html += "<div class='graph'> <canvas id='KOSDAQ_Chart'></canvas></div>"

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
            addon_html += "</div>"

            addon_html += "<div class='graph'> <canvas id='KOSPI200_Chart'></canvas></div>"

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
    addon_html += "</div>"

  //미국 증시
  addon_html += "<div class='daily_header'>"
    
    addon_html += "<div class='daily_title' id='US_Stock'>"
      addon_html += "<div class='daily_main'>미국 증시</div>"
      addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"
    addon_html += "</div>"   

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
      addon_html += "</div>"

        addon_html += "<div class='graph'> <canvas id='DOW_Chart'></canvas></div>"

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
      addon_html += "</div>"

        addon_html += "<div class='graph'> <canvas id='NASDAQ_Chart'></canvas></div>"

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
      addon_html += "</div>"

        addon_html += "<div class='graph'> <canvas id='SNP_Chart'></canvas></div>"

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
  addon_html += "</div>"
  
//환율
//addon_html += "<div class='graph_container'>"  
addon_html += "<div class='daily_header'>"
    
addon_html += "<div class='daily_title' id='Currency'>"
  addon_html += "<div class='daily_main'>환율</div>"
  addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"
addon_html += "</div>"  

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
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['USDKRW']['value'].toFixed(2), val_direction) + "</span><span class='unit2'> 원</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['USDKRW']['diff'].toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['USDKRW']['rate'].toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='USDKRW_Chart'></canvas></div>"

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
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['JPYKRW']['value'].toFixed(2), val_direction) + "</span><span class='unit2'> 원</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['JPYKRW']['diff'].toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['JPYKRW']['rate'].toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='JPYKRW_Chart'></canvas></div>"

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
        addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['EURKRW']['value'].toFixed(2), val_direction) + "</span><span class='unit2'> 원</span></div>"
        addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['EURKRW']['diff'].toFixed(2))[0] + "</span></div>"
        addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['EURKRW']['rate'].toFixed(2))[0] + "%</span></div>"
      addon_html += "</div>"
    addon_html += "</div>"

    addon_html += "<div class='graph'> <canvas id='EURKRW_Chart'></canvas></div>"

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
    addon_html += "</div>"

    addon_html += "<div class='graph'><canvas id='Dollar_Index_Chart'></canvas></div>"

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
addon_html += "</div>"  

addon_html += "</div>"

//코인
  //addon_html += "<div class='graph_container'>"  
  addon_html += "<div class='daily_header'>"
    
  addon_html += "<div class='daily_title' id='Coin'>"
    addon_html += "<div class='daily_main'>코인</div>"
    addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"
  addon_html += "</div>"    

  //BTCUSD
  BTCUSD_arr = return_1month_arr(daily_market['yf_BTCUSD'], daily_market['TIME'])
  BTCUSD_time_arr = BTCUSD_arr[0]
  BTCUSD_val_arr = BTCUSD_arr[1]

  BTCUSD_time_arr.push('현재')
  BTCUSD_val_arr.push(hourly_market['USDT-BTC']['value'])

  addon_html += "<div class='graph_item'>"
    addon_html += "<div class='subRegion_title5'>"
    addon_html += "<div class='subRegion_name'>비트코인</div>"
    val_direction = get_direction(hourly_market['USDT-BTC']['rate'])
      addon_html += "<div class='subValue3'>"
        addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['USDT-BTC']['value'].toFixed(2), val_direction) + "</span><span class='unit2'> USDT</span></div>"
        addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['USDT-BTC']['diff'].toFixed(2))[0] + "</span></div>"
        addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['USDT-BTC']['rate'].toFixed(2))[0] + "%</span></div>"
      addon_html += "</div>"
    addon_html += "</div>"

    addon_html += "<div class='graph'> <canvas id='BTCUSD_Chart'></canvas></div>"

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

  //ETHUSD
  ETHUSD_arr = return_1month_arr(daily_market['yf_ETHUSD'], daily_market['TIME'])
  ETHUSD_time_arr = ETHUSD_arr[0]
  ETHUSD_val_arr = ETHUSD_arr[1]

  ETHUSD_time_arr.push('현재')
  ETHUSD_val_arr.push(hourly_market['USDT-ETH']['value'])

  addon_html += "<div class='graph_item'>"
    addon_html += "<div class='subRegion_title5'>"
    addon_html += "<div class='subRegion_name'>이더리움</div>"
    val_direction = get_direction(hourly_market['USDT-ETH']['rate'])
      addon_html += "<div class='subValue3'>"
        addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['USDT-ETH']['value'].toFixed(2), val_direction) + "</span><span class='unit2'> USDT</span></div>"
        addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['USDT-ETH']['diff'].toFixed(2))[0] + "</span></div>"
        addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['USDT-ETH']['rate'].toFixed(2))[0] + "%</span></div>"
      addon_html += "</div>"
    addon_html += "</div>"

    addon_html += "<div class='graph'> <canvas id='ETHUSD_Chart'></canvas></div>"

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
addon_html += "</div>"

//금/원자재
//addon_html += "<div class='graph_container'>"  

addon_html += "<div class='daily_header'>"
    
addon_html += "<div class='daily_title' id='Material'>"
  addon_html += "<div class='daily_main'>금 / 원자재</div>"
  addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"
addon_html += "</div>" 

//Gold
Gold_arr = return_1month_arr(daily_market['yf_Gold'], daily_market['TIME'])
Gold_time_arr = Gold_arr[0]
Gold_val_arr = Gold_arr[1]
Gold_hourly_val = (hourly_market['YF_Gold']['value']).replaceAll(",", "")

Gold_time_arr.push('현재')
Gold_val_arr.push(Number(Gold_hourly_val))

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title5' style='grid-template-columns: 1fr 4fr'>"
  addon_html += "<div class='subRegion_name'>금</div>"
  val_direction = get_direction(hourly_market['YF_Gold']['rate'])
    addon_html += "<div class='subValue3'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(Number(Gold_hourly_val).toFixed(2), val_direction) + "</span><span class='unit2'> 달러/T온스</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(Number(hourly_market['YF_Gold']['diff']).toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(Number(hourly_market['YF_Gold']['rate']).toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Gold_Chart'></canvas></div>"

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

//Silver
Silver_arr = return_1month_arr(daily_market['yf_Silver'], daily_market['TIME'])
Silver_time_arr = Silver_arr[0]
Silver_val_arr = Silver_arr[1]

Silver_time_arr.push('현재')
Silver_val_arr.push(hourly_market['YF_Silver']['value'])

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title5' style='grid-template-columns: 1fr 4fr'>"
  addon_html += "<div class='subRegion_name'>은</div>"
  val_direction = get_direction(hourly_market['YF_Silver']['rate'])
    addon_html += "<div class='subValue3'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(Number(hourly_market['YF_Silver']['value']).toFixed(2), val_direction) + "</span><span class='unit2'> 달러/T온스</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(Number(hourly_market['YF_Silver']['diff']).toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(Number(hourly_market['YF_Silver']['rate']).toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Silver_Chart'></canvas></div>"

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

//Copper
Copper_arr = return_1month_arr(daily_market['yf_Copper'], daily_market['TIME'])
Copper_time_arr = Copper_arr[0]
Copper_val_arr = Copper_arr[1]

Copper_time_arr.push('현재')
Copper_val_arr.push(hourly_market['YF_Copper']['value'])

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title5'>"
  addon_html += "<div class='subRegion_name'>구리</div>"
  val_direction = get_direction(hourly_market['YF_Copper']['rate'])
    addon_html += "<div class='subValue3'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(Number(hourly_market['YF_Copper']['value']).toFixed(2), val_direction) + "</span><span class='unit2'> 달러/파운드</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(Number(hourly_market['YF_Copper']['diff']).toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(Number(hourly_market['YF_Copper']['rate']).toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
  addon_html += "</div>"    

  addon_html += "<div class='graph'> <canvas id='Copper_Chart'></canvas></div>"

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

addon_html += "</div>"

//국제 유가
//addon_html += "<div class='graph_container'>"  
addon_html += "<div class='daily_header'>"
    
addon_html += "<div class='daily_title' id='Oil'>"
  addon_html += "<div class='daily_main'>국제 유가</div>"
  addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"
addon_html += "</div>" 

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
    addon_html += "<div class='subValue3'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['YF_WTI']['value'].toFixed(2), val_direction) + "</span><span class='unit2'> 달러/배럴</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['YF_WTI']['diff'].toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['YF_WTI']['rate'].toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='WTI_Chart'></canvas></div>"

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
    addon_html += "<div class='subValue3'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['Dubai']['value'].toFixed(2), val_direction) + "</span><span class='unit2'> 달러/배럴</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['Dubai']['diff'].toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['Dubai']['rate'].toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Dubai_Chart'></canvas></div>"

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
    addon_html += "<div class='subValue3'>"
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['YF_Brent']['value'].toFixed(2), val_direction) + "</span><span class='unit2'> 달러/배럴</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['YF_Brent']['diff'].toFixed(2))[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['YF_Brent']['rate'].toFixed(2))[0] + "%</span></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Brent_Chart'></canvas></div>"

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

addon_html += "</div>"

//채권 수익률
//addon_html += "<div class='graph_container'>"  
addon_html += "<div class='daily_header'>"
    
addon_html += "<div class='daily_title' id='Bond_Rate'>"
  addon_html += "<div class='daily_main'>채권 수익률</div>"
  addon_html += "<div class='daily_sub'>" + daily_updated + "</div>"
addon_html += "</div>" 

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

    /*
    addon_html += "<div class='subRegion_name'>미국 국채 10년</div>"
    addon_html += "<div class='subValue'>"      
      val_direction = get_direction(hourly_market['US10YT_Bond']['rate'])
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['US10YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['US10YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['US10YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"

    addon_html += "<div class='subRegion_name'>미국 국채 5년</div>"
    addon_html += "<div class='subValue'>"      
      val_direction = get_direction(hourly_market['US5YT_Bond']['rate'])
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['US5YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['US5YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['US5YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"
    */

    addon_html += "<div class='subRegion_name'>미국 국채 3년</div>"
    addon_html += "<div class='subValue'>"      
      val_direction = get_direction(hourly_market['US3YT_Bond']['rate'])    
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['US3YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['US3YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['US3YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='US_Bond_Rate_Chart'></canvas></div>"

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

//한국 채권
KO_Bond_30y_arr = return_1month_arr(daily_market['BOK_BondYield30'], daily_market['TIME'])
KO_Bond_30y_time_arr = KO_Bond_30y_arr[0]
KO_Bond_30y_val_arr = KO_Bond_30y_arr[1]

KO_Bond_30y_time_arr.push('현재')
KO_Bond_30y_val_arr.push(hourly_market['KR30YT_Bond']['value'])

KO_Bond_10y_arr = return_1month_arr(daily_market['BOK_BondYield10'], daily_market['TIME'])
KO_Bond_10y_time_arr = KO_Bond_10y_arr[0]
KO_Bond_10y_val_arr = KO_Bond_10y_arr[1]

KO_Bond_10y_time_arr.push('현재')
KO_Bond_10y_val_arr.push(hourly_market['KR10YT_Bond']['value'])

KO_Bond_5y_arr = return_1month_arr(daily_market['BOK_BondYield05'], daily_market['TIME'])
KO_Bond_5y_time_arr = KO_Bond_5y_arr[0]
KO_Bond_5y_val_arr = KO_Bond_5y_arr[1]

KO_Bond_5y_time_arr.push('현재')
KO_Bond_5y_val_arr.push(hourly_market['KR5YT_Bond']['value'])

KO_Bond_3y_arr = return_1month_arr(daily_market['BOK_BondYield03'], daily_market['TIME'])
KO_Bond_3y_time_arr = KO_Bond_3y_arr[0]
KO_Bond_3y_val_arr = KO_Bond_3y_arr[1]

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

    /*
    addon_html += "<div class='subRegion_name'>한국 국채 10년</div>"
    addon_html += "<div class='subValue'>"      
      val_direction = get_direction(hourly_market['KR10YT_Bond']['rate'])
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['KR10YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['KR10YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['KR10YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"

    addon_html += "<div class='subRegion_name'>한국 국채 5년</div>"
    addon_html += "<div class='subValue'>"      
      val_direction = get_direction(hourly_market['KR5YT_Bond']['rate'])
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['KR5YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['KR5YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['KR5YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"
    */

    addon_html += "<div class='subRegion_name'>한국 국채 3년</div>"
    addon_html += "<div class='subValue'>"      
      val_direction = get_direction(hourly_market['KR3YT_Bond']['rate'])    
      addon_html += "<div class = 'current_val2'>" + set_color_tag2(hourly_market['KR3YT_Bond']['value'], val_direction) + "</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(hourly_market['KR3YT_Bond']['diff'])[0] + "</span></div>"
      addon_html += "<div class = 'rate_val2'>" + set_color_tag_plusminus(hourly_market['KR3YT_Bond']['rate'])[0] + "%</span></div>"
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_Bond_Rate_Chart'></canvas></div>"

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
addon_html += "</div>"

//금리
//addon_html += "<div class='graph_container'>"  
addon_html += "<div class='daily_header'>"
    
addon_html += "<div class='daily_title2' id='Interest'>"
  addon_html += "<div class='daily_main'>금리</div>"
  addon_html += "<div class='daily_sub'>한국: " + monthly_updated.substr(0, 10) + " | 미국: " + daily_updated.substr(0, 10) + "</div>"
addon_html += "</div>" 

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
  addon_html += "</div>"

    addon_html += "<div class='graph'> <canvas id='Interest_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"      
      addon_html += "<div></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_US_Interest' autocomplete='off' id='redraw_1Y_KO_US_Interest' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_US_Interest'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_US_Interest' autocomplete='off' id='redraw_3Y_KO_US_Interest' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_US_Interest'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_US_Interest' autocomplete='off' id='redraw_5Y_KO_US_Interest' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_US_Interest'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_US_Interest' autocomplete='off' id='redraw_10Y_KO_US_Interest' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_US_Interest'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"
addon_html += "</div>"

//통화량/외환보유고
//addon_html += "<div class='graph_container'>"

addon_html += "<div class='daily_header'>"

addon_html += "<div class='daily_title2' id='External_Money'>"
  addon_html += "<div class='daily_main'>통화량(M0) / 외환보유고</div>"
  addon_html += "<div class='daily_sub'>한국: " + monthly_updated.substr(0, 10) + " | 미국: " + daily_updated.substr(0, 10) + "</div>"
addon_html += "</div>" 

//한국통화량
KO_total_asset_arr = return_1year_monthly_arr(monthly_market['BOK_Total_Asset'], monthly_market['TIME'])
KO_total_asset_time_arr = KO_total_asset_arr[0]
KO_total_asset_val_arr = KO_total_asset_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>한국 통화량</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + KO_total + "<span class='unit2'> 조 원</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KO_total_gap)[0] + "</span></div>"      
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_total_asset_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_total_asset' autocomplete='off' id='redraw_1Y_KO_total_asset' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_total_asset'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_total_asset' autocomplete='off' id='redraw_3Y_KO_total_asset' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_total_asset'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_total_asset' autocomplete='off' id='redraw_5Y_KO_total_asset' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_total_asset'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_total_asset' autocomplete='off' id='redraw_10Y_KO_total_asset' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_total_asset'>10Y</label></div>"
    addon_html += "</div>"
  
addon_html += "</div>"

//미국통화량
US_total_asset_arr = return_1year_weekly_arr(daily_market['FRED_Total_Asset'], daily_market['TIME'])
US_total_asset_time_arr = US_total_asset_arr[0]
US_total_asset_val_arr = US_total_asset_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>미국 통화량</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + US_total.toFixed(2) + "<span class='unit2'> 조 달러</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(US_total_gap)[0] + "</span></div>"  
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='US_total_asset_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"      
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='US_total_asset' autocomplete='off' id='redraw_1Y_US_total_asset' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_US_total_asset'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='US_total_asset' autocomplete='off' id='redraw_3Y_US_total_asset' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_US_total_asset'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='US_total_asset' autocomplete='off' id='redraw_5Y_US_total_asset' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_US_total_asset'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='US_total_asset' autocomplete='off' id='redraw_10Y_US_total_asset' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_US_total_asset'>10Y</label></div>"
    addon_html += "</div>"
  
addon_html += "</div>"

//한국외환보유고
KO_external_money_arr = return_1year_monthly_arr(monthly_market['BOK_External_Money'], monthly_market['TIME'])
KO_external_money_time_arr = KO_external_money_arr[0]
KO_external_money_val_arr = KO_external_money_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>한국 외환 보유고</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + external_total.toFixed(2) + "<span class='unit2'> 조 달러</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(external_total_gap)[0] + "</span></div>"      
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_external_money_Chart'></canvas></div>"
  
  addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_external_money' autocomplete='off' id='redraw_1Y_KO_external_money' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_external_money'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_external_money' autocomplete='off' id='redraw_3Y_KO_external_money' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_external_money'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_external_money' autocomplete='off' id='redraw_5Y_KO_external_money' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_external_money'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_external_money' autocomplete='off' id='redraw_10Y_KO_external_money' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_external_money'>10Y</label></div>"
    addon_html += "</div>" 
  addon_html += "</div>"

addon_html += "</div>"


//채권
//addon_html += "<div class='graph_container'>"  
addon_html += "<div class='daily_header'>"
    
addon_html += "<div class='daily_title' id='Bond'>"
  addon_html += "<div class='daily_main'>채권</div>"
  addon_html += "<div class='daily_sub'>" + monthly_updated + "</div>"
addon_html += "</div>" 

//월별 채권 발행액
KO_bond_published_arr = return_1year_monthly_arr(monthly_market['BOK_Bond_Publish'], monthly_market['TIME'])
KO_bond_published_time_arr = KO_bond_published_arr[0]
KO_bond_published_val_arr = KO_bond_published_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>월별 채권 발행액</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + publishedbond_total + "<span class='unit2'> 조 원</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(publishedbond_total_gap)[0] + "</span></div>"      
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_bond_published_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_published' autocomplete='off' id='redraw_1Y_KO_bond_published' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_bond_published'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_published' autocomplete='off' id='redraw_3Y_KO_bond_published' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_bond_published'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_published' autocomplete='off' id='redraw_5Y_KO_bond_published' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_bond_published'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_published' autocomplete='off' id='redraw_10Y_KO_bond_published' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_bond_published'>10Y</label></div>"
    addon_html += "</div>"
  
addon_html += "</div>"

//누적 채권 잔액
KO_bond_remain_arr = return_1year_monthly_arr(monthly_market['BOK_Bond_Remain'], monthly_market['TIME'])
KO_bond_remain_time_arr = KO_bond_remain_arr[0]
KO_bond_remain_val_arr = KO_bond_remain_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>누적 채권 잔액</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + remainbond_total.toFixed(2) + "<span class='unit2'> 조 원</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(remainbond_total_gap)[0] + "</span></div>"      
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_bond_remain_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_remain' autocomplete='off' id='redraw_1Y_KO_bond_remain' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_bond_remain'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_remain' autocomplete='off' id='redraw_3Y_KO_bond_remain' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_bond_remain'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_remain' autocomplete='off' id='redraw_5Y_KO_bond_remain' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_bond_remain'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_bond_remain' autocomplete='off' id='redraw_10Y_KO_bond_remain' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_bond_remain'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

addon_html += "</div>"


//무역
//addon_html += "<div class='graph_container'>"  
addon_html += "<div class='daily_header'>"
    
addon_html += "<div class='daily_title' id='Trade'>"
  addon_html += "<div class='daily_main'>무역</div>"
  addon_html += "<div class='daily_sub'>" + monthly_updated + "</div>"
addon_html += "</div>" 

//수출액
KO_trade_out_arr = return_1year_monthly_arr(monthly_market['BOK_Trade_Out'], monthly_market['TIME'])
KO_trade_out_time_arr = KO_trade_out_arr[0]
KO_trade_out_val_arr = KO_trade_out_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>수출액</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + KOR_tradeout_total.toFixed(2) + "<span class='unit2'> 억 달러</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_tradeout_total_gap.toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_trade_out_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_out' autocomplete='off' id='redraw_1Y_KO_trade_out' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_trade_out'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_out' autocomplete='off' id='redraw_3Y_KO_trade_out' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_trade_out'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_out' autocomplete='off' id='redraw_5Y_KO_trade_out' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_trade_out'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_out' autocomplete='off' id='redraw_10Y_KO_trade_out' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_trade_out'>10Y</label></div>"
    addon_html += "</div>"

addon_html += "</div>"

//수입액
KO_trade_in_arr = return_1year_monthly_arr(monthly_market['BOK_Trade_In'], monthly_market['TIME'])
KO_trade_in_time_arr = KO_trade_in_arr[0]
KO_trade_in_val_arr = KO_trade_in_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>수입액</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + KOR_tradein_total.toFixed(2) + "<span class='unit2'> 억 달러</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_tradein_total_gap.toFixed(2))[0] + "</span></div>"     
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_trade_in_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_in' autocomplete='off' id='redraw_1Y_KO_trade_in' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_trade_in'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_in' autocomplete='off' id='redraw_3Y_KO_trade_in' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_trade_in'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_in' autocomplete='off' id='redraw_5Y_KO_trade_in' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_trade_in'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_in' autocomplete='off' id='redraw_10Y_KO_trade_in' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_trade_in'>10Y</label></div>"
    addon_html += "</div>"  

addon_html += "</div>"

//경상수지
KO_trade_profit_arr = return_1year_monthly_arr(monthly_market['BOK_Trade_Profit'], monthly_market['TIME'])
KO_trade_profit_time_arr = KO_trade_profit_arr[0]
KO_trade_profit_val_arr = KO_trade_profit_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>경상수지</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + KOR_tradeprofit_total.toFixed(2) + "<span class='unit2'> 억 달러</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_tradeprofit_gap.toFixed(2))[0] + "</span></div>"     
    addon_html += "</div>"
  addon_html += "</div>"    

  addon_html += "<div class='graph'> <canvas id='KO_trade_profit_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_profit' autocomplete='off' id='redraw_1Y_KO_trade_profit' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_KO_trade_profit'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_profit' autocomplete='off' id='redraw_3Y_KO_trade_profit' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_KO_trade_profit'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_profit' autocomplete='off' id='redraw_5Y_KO_trade_profit' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_KO_trade_profit'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_trade_profit' autocomplete='off' id='redraw_10Y_KO_trade_profit' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_trade_profit'>10Y</label></div>"
    addon_html += "</div>" 
  addon_html += "</div>"

addon_html += "</div>"

//소득
//addon_html += "<div class='graph_container'>"  
addon_html += "<div class='daily_header'>"
    
addon_html += "<div class='daily_title' id='Income'>"
  addon_html += "<div class='daily_main'>소득</div>"
  addon_html += "<div class='daily_sub'>" + monthly_updated + "</div>"
addon_html += "</div>" 

//GDP
KO_GDP_arr = return_10year_yearly_arr(monthly_market['DATA_VALUE_GDP'], monthly_market['TIME'])
KO_GDP_time_arr = KO_GDP_arr[0]
KO_GDP_val_arr = KO_GDP_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>GDP(국내총생산)</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_GDP_total.toFixed(1)).toLocaleString() + "<span class='unit2'> 조 원</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_GDP_total_gap.toFixed(2))[0] + "</span></div>"     
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_GDP_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"    
      addon_html += "<div></div>"
      addon_html += "<div></div>"
      addon_html += "<div></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_GDP' autocomplete='off' id='redraw_10Y_KO_GDP' onClick='redraw_graph(this, \"10Y\")'' checked><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_GDP'>10Y</label></div>"
    addon_html += "</div>"

addon_html += "</div>"

//GNI
KO_GNI_arr = return_10year_yearly_arr(monthly_market['DATA_VALUE_GNI'], monthly_market['TIME'])
KO_GNI_time_arr = KO_GNI_arr[0]
KO_GNI_val_arr = KO_GNI_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3' style='grid-template-columns: 1fr 2fr;'>"
  addon_html += "<div class='subRegion_name'>1인당 GNI(소득)</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_GNI_total.toFixed(1)).toLocaleString() + "<span class='unit2'> 원</span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag3(KOR_GNI_gap.toFixed(0))[0] + "</span></div>"      
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='KO_GNI_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div></div>"
      addon_html += "<div></div>"
      addon_html += "<div></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='KO_GNI' autocomplete='off' id='redraw_10Y_KO_GNI' onClick='redraw_graph(this, \"10Y\")' checked ><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_KO_GNI'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

addon_html += "</div>"

//부동산
//addon_html += "<div class='graph_container'>"  
addon_html += "<div class='daily_header'>"
    
addon_html += "<div class='daily_title' id='Real_Estate'>"
  addon_html += "<div class='daily_main'>부동산</div>"
  addon_html += "<div class='daily_sub'>" + monthly_updated + "</div>"
addon_html += "</div>" 

//주택 매매가격지수
Housing_Trade_All_arr = return_1year_monthly_arr(monthly_market['BOK_Housing_Trade_All'], monthly_market['TIME'])
Housing_Trade_All_time_arr = Housing_Trade_All_arr[0]
Housing_Trade_All_val_arr = Housing_Trade_All_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>주택 매매가격지수</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_housing_tradeall[0]).toFixed(1) + "<span class='unit2'></span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_housing_tradeall[1].toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Housing_Trade_All_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_All' autocomplete='off' id='redraw_1Y_Housing_Trade_All' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Housing_Trade_All'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_All' autocomplete='off' id='redraw_3Y_Housing_Trade_All' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Housing_Trade_All'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_All' autocomplete='off' id='redraw_5Y_Housing_Trade_All' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Housing_Trade_All'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_All' autocomplete='off' id='redraw_10Y_Housing_Trade_All' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Housing_Trade_All'>10Y</label></div>"
    addon_html += "</div>"
  
addon_html += "</div>"

//아파트 매매가격지수
Housing_Trade_Apt_arr = return_1year_monthly_arr(monthly_market['BOK_Housing_Trade_Apt'], monthly_market['TIME'])
Housing_Trade_Apt_time_arr = Housing_Trade_Apt_arr[0]
Housing_Trade_Apt_val_arr = Housing_Trade_Apt_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>아파트 매매가격지수</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_housing_tradeapt[0]).toFixed(1) + "<span class='unit2'></span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_housing_tradeapt[1].toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Housing_Trade_Apt_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_Apt' autocomplete='off' id='redraw_1Y_Housing_Trade_Apt' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Housing_Trade_Apt'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_Apt' autocomplete='off' id='redraw_3Y_Housing_Trade_Apt' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Housing_Trade_Apt'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_Apt' autocomplete='off' id='redraw_5Y_Housing_Trade_Apt' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Housing_Trade_Apt'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Trade_Apt' autocomplete='off' id='redraw_10Y_Housing_Trade_Apt' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Housing_Trade_Apt'>10Y</label></div>"
    addon_html += "</div>"

addon_html += "</div>"

//주택 전세가격지수
Housing_Rent_All_arr = return_1year_monthly_arr(monthly_market['BOK_Housing_Rent_All'], monthly_market['TIME'])
Housing_Rent_All_time_arr = Housing_Rent_All_arr[0]
Housing_Rent_All_val_arr = Housing_Rent_All_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>주택 전세가격지수</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_housing_rentall[0]).toFixed(1) + "<span class='unit2'></span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_housing_rentall[1].toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
  addon_html += "</div>"    

  addon_html += "<div class='graph'> <canvas id='Housing_Rent_All_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_All' autocomplete='off' id='redraw_1Y_Housing_Rent_All' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Housing_Rent_All'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_All' autocomplete='off' id='redraw_3Y_Housing_Rent_All' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Housing_Rent_All'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_All' autocomplete='off' id='redraw_5Y_Housing_Rent_All' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Housing_Rent_All'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_All' autocomplete='off' id='redraw_10Y_Housing_Rent_All' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Housing_Rent_All'>10Y</label></div>"
    addon_html += "</div>"

addon_html += "</div>"

//아파트 전세가격지수
Housing_Rent_Apt_arr = return_1year_monthly_arr(monthly_market['BOK_Housing_Rent_Apt'], monthly_market['TIME'])
Housing_Rent_Apt_time_arr = Housing_Rent_Apt_arr[0]
Housing_Rent_Apt_val_arr = Housing_Rent_Apt_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>아파트 전세가격지수</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_housing_rentapt[0]).toFixed(1) + "<span class='unit2'></span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_housing_rentapt[1].toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
  addon_html += "</div>"

  addon_html += "<div class='graph'> <canvas id='Housing_Rent_Apt_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_Apt' autocomplete='off' id='redraw_1Y_Housing_Rent_Apt' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Housing_Rent_Apt'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_Apt' autocomplete='off' id='redraw_3Y_Housing_Rent_Apt' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Housing_Rent_Apt'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_Apt' autocomplete='off' id='redraw_5Y_Housing_Rent_Apt' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Housing_Rent_Apt'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Housing_Rent_Apt' autocomplete='off' id='redraw_10Y_Housing_Rent_Apt' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Housing_Rent_Apt'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"
addon_html += "</div>"

//심리지표
//addon_html += "<div class='graph_container'>"  
addon_html += "<div class='daily_header'>"
    
addon_html += "<div class='daily_title' id='Mind'>"
  addon_html += "<div class='daily_main'>심리지표</div>"
  addon_html += "<div class='daily_sub'>" + monthly_updated + "</div>"
addon_html += "</div>" 

//소비자심리지수
Mind_Consumer_arr = return_1year_monthly_arr(monthly_market['BOK_Mind_Consumer'], monthly_market['TIME'])
Mind_Consumer_time_arr = Mind_Consumer_arr[0]
Mind_Consumer_val_arr = Mind_Consumer_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>소비자심리지수</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_consumermind[0]).toFixed(1) + "<span class='unit2'></span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_consumermind[1].toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
  addon_html += "</div>"    

  addon_html += "<div class='graph'> <canvas id='Mind_Consumer_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Consumer' autocomplete='off' id='redraw_1Y_Mind_Consumer' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Mind_Consumer'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Consumer' autocomplete='off' id='redraw_3Y_Mind_Consumer' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Mind_Consumer'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Consumer' autocomplete='off' id='redraw_5Y_Mind_Consumer' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Mind_Consumer'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Consumer' autocomplete='off' id='redraw_10Y_Mind_Consumer' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Mind_Consumer'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

//경제심리지수
Mind_Economy_arr = return_1year_monthly_arr(monthly_market['BOK_Mind_Economy'], monthly_market['TIME'])
Mind_Economy_time_arr = Mind_Economy_arr[0]
Mind_Economy_val_arr = Mind_Economy_arr[1]

addon_html += "<div class='graph_item'>"
  addon_html += "<div class='subRegion_title3'>"
  addon_html += "<div class='subRegion_name'>경제심리지수</div>"  
    addon_html += "<div class='subValue2'>"
      addon_html += "<div class = 'current_val2'>" + Number(KOR_economymind[0]).toFixed(1) + "<span class='unit2'></span></div>"
      addon_html += "<div class = 'gap_val2'>" + set_color_tag(KOR_economymind[1].toFixed(2))[0] + "</span></div>"      
    addon_html += "</div>"
  addon_html += "</div>"    

  addon_html += "<div class='graph'> <canvas id='Mind_Economy_Chart'></canvas></div>"

    addon_html += "<div class='subSelection2'>"
      addon_html += "<div></div>"      
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Economy' autocomplete='off' id='redraw_1Y_Mind_Economy' onClick='redraw_graph(this, \"1Y\")' checked><label class='btn btn-outline-danger' id='label_1Y' for='redraw_1Y_Mind_Economy'>1Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Economy' autocomplete='off' id='redraw_3Y_Mind_Economy' onClick='redraw_graph(this, \"3Y\")'><label class='btn btn-outline-danger' id='label_3Y' for='redraw_3Y_Mind_Economy'>3Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Economy' autocomplete='off' id='redraw_5Y_Mind_Economy' onClick='redraw_graph(this, \"5Y\")'><label class='btn btn-outline-danger' id='label_5Y' for='redraw_5Y_Mind_Economy'>5Y</label></div>"
      addon_html += "<div><input type='radio' class='btnRadio' name='Mind_Economy' autocomplete='off' id='redraw_10Y_Mind_Economy' onClick='redraw_graph(this, \"10Y\")'><label class='btn btn-outline-danger' id='label_10Y' for='redraw_10Y_Mind_Economy'>10Y</label></div>"
    addon_html += "</div>"
  addon_html += "</div>"

addon_html += "</div>"

addon_html += "<div style='height:135px'></div>"

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

  for(var k = 0 ; k < menu_all.length ; k++){
    menu_position[k] = $('#' + menu_all[k]).offset().top    
  }
}