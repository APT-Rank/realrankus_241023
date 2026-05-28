var tSafe = function(key, fallback) {
  return (typeof t === 'function') ? t(key, fallback) : fallback;
};

function formatPriceText(minVal, maxVal, fMin, fMax) {
  var isEn = (typeof window.LANG !== 'undefined' && window.LANG === 'en');
  if (minVal == fMin && maxVal == fMax) {
    return tSafe('ui.price_all', '가격 전체');
  }
  if (minVal == fMin) {
    return isEn ? ((maxVal * 100).toFixed(0) + "M KRW or under") : (Number(maxVal).toFixed(1) + "억 이하");
  }
  if (maxVal == fMax) {
    return isEn ? ((minVal * 100).toFixed(0) + "M KRW or over") : (Number(minVal).toFixed(1) + "억 이상");
  }
  return isEn ? ((minVal * 100).toFixed(0) + "M ~ " + (maxVal * 100).toFixed(0) + "M KRW") : (Number(minVal).toFixed(1) + "억 ~ " + Number(maxVal).toFixed(1) + "억");
}

function formatAreaText(minVal, maxVal, fMin, fMax) {
  var isEn = (typeof window.LANG !== 'undefined' && window.LANG === 'en');
  if (minVal == fMin && maxVal == fMax) {
    return tSafe('ui.area_all', '평형 전체');
  }
  if (minVal == fMin) {
    return isEn ? (Number(maxVal) + " py or under") : (Number(maxVal) + "평 이하");
  }
  if (maxVal == fMax) {
    return isEn ? (Number(minVal) + " py or over") : (Number(minVal) + "평 이상");
  }
  return isEn ? (Number(minVal) + " ~ " + Number(maxVal) + " py") : (Number(minVal) + "평 ~ " + Number(maxVal) + "평");
}

var sliders = "<div slider id='slider-distance'>"
sliders += "<div>"
sliders += "<div inverse-left class='leftBar' style='width:100%;'></div>"
sliders += "<div inverse-right class='rightBar' style='width:100%;'></div>"
sliders += "<div range id='sPrice_rangeBar' style='left:0%;right:0%;'></div>"
sliders += "<span thumb id='sPrice_leftThumb' style='left:0%;'></span> <span thumb id='sPrice_rightThumb' style='left:100%;'></span>"  
sliders += "</div>"
sliders += "<input type='range' id='sPrice_minRange' tabindex='0' value='" + sPrice_min +"' max='" + f_sales_price_max + "' min='" + f_sales_price_min + "' step='" + sPrice_step + "' oninput='sPrice_slideMin(this)'></input>"
sliders += "<input type='range' id='sPrice_maxRange' tabindex='0' value='" + sPrice_max +"' max='" + f_sales_price_max + "' min='" + f_sales_price_min + "' step='" + sPrice_step + "' oninput='sPrice_slideMax(this)'></input>"
sliders += "</div>"

var filtered = false

var f_sales_price_min = 0
var f_sales_price_max = 40
var sPrice_min = 0;
var sPrice_max = 40;
var sPrice_step = 0.5;

function initSlider_sPrice(){
  $("#filterName_sPrice").html(formatPriceText(sPrice_min, sPrice_max, f_sales_price_min, f_sales_price_max));

  $( "#sPrice_slider" ).slider({
    range: true,
    min: f_sales_price_min,
    max: f_sales_price_max,
    values: [ sPrice_min, sPrice_max ],
    step : sPrice_step,
    slide : function( event, ui ) {
      sPrice_min = ui.values[ 0 ]
      sPrice_max = ui.values[ 1 ]
      $("#filterName_sPrice").html(formatPriceText(sPrice_min, sPrice_max, f_sales_price_min, f_sales_price_max));
      checkFiltered()
    },
    change : function (event, ui){
      closeModal("baseModal")
      showHide_filtered_marker(onMap_list, onMap_markers)
    }
  });  
}

var f_area_min = 0
var f_area_max = 80
var area_min = 0;
var area_max = 80;
var area_step = 1;

function initSlider_area(){
  $("#filterName_area").html(formatAreaText(area_min, area_max, f_area_min, f_area_max));

  $( "#area_slider" ).slider({
    range: true,
    min: f_area_min,
    max: f_area_max,
    values: [ area_min, area_max ],
    step : area_step,
    slide : function( event, ui ) {
      area_min = ui.values[ 0 ]
      area_max = ui.values[ 1 ]
      $("#filterName_area").html(formatAreaText(area_min, area_max, f_area_min, f_area_max));
      checkFiltered()
    },
    change : function (event, ui){
      closeModal("baseModal")
      showHide_filtered_marker(onMap_list, onMap_markers)
    }
  });  
}

function checkFiltered(){
  $("#dong_0").prop("checked", true)
  if(
    sPrice_min == f_sales_price_min && sPrice_max == f_sales_price_max &&
    area_min == f_area_min && area_max == f_area_max
  ){
    $("#filterOnOff").html(tSafe('ui.filter', '필터'))
    $("#filterOnOff").css({"border":"2px solid #940c23"})
    filtered = false
  }
  else{    
    $("#filterOnOff").html("<i class='fa-solid fa-check'></i>&nbsp" + tSafe('ui.filter', '필터'))
    $("#filterOnOff").css({"border":"2px solid #940c23"})
    filtered = true
  }
}

function initSlide_sPrice(){
  $("#sPrice_rangeBar").css('left', 100/f_sales_price_max*(sPrice_min)-(100/f_sales_price_max)+'%')
  $("#sPrice_leftThumb").css('left', 100/f_sales_price_max*(sPrice_min)-(100/f_sales_price_max)+'%')
  
  $("#sPrice_rangeBar").css('right', 100 - ( 100/f_sales_price_max*(sPrice_max)-(100/f_sales_price_max) )+'%')
  $("#sPrice_rightThumb").css('right', 100/f_sales_price_max*(sPrice_max)-(100/f_sales_price_max)+'%')

  $("#sPrice_minRange").prop('value', sPrice_min)
  $("#sPrice_maxRange").prop('value', sPrice_max)

  var isEn = (typeof window.LANG !== 'undefined' && window.LANG === 'en');
  var minDisplay = isEn ? ((sPrice_min * 100).toFixed(0) + "M") : (Number(sPrice_min).toFixed(1) + "억");
  var maxDisplay = isEn ? ((sPrice_max * 100).toFixed(0) + "M") : (Number(sPrice_max).toFixed(1) + "억");

  $("#sPrice_minVal").html(minDisplay)
  $("#sPrice_maxVal").html(maxDisplay)

  $("#filterName_sPrice").html(formatPriceText(sPrice_min, sPrice_max, f_sales_price_min, f_sales_price_max));
}

function sPrice_slideMin(e){  
  e.value=Math.min(e.value, e.parentNode.childNodes[2].value-sPrice_step);
  var value=(100/(parseInt(e.max)-parseInt(e.min)))*parseInt(e.value)-(100/(parseInt(e.max)-parseInt(e.min)))*parseInt(e.min);
  sPrice_min = e.value;
  $("#sPrice_rangeBar").css('left', value+'%')
  $("#sPrice_leftThumb").css('left', value+'%')  
  
  var isEn = (typeof window.LANG !== 'undefined' && window.LANG === 'en');
  var minDisplay = isEn ? ((sPrice_min * 100).toFixed(0) + "M") : (Number(sPrice_min).toFixed(1) + "억");
  $("#sPrice_minVal").html(minDisplay)

  $("#filterName_sPrice").html(formatPriceText(sPrice_min, sPrice_max, f_sales_price_min, f_sales_price_max));
}

function sPrice_slideMax(e){  
  e.value=Math.max(e.value, e.parentNode.childNodes[1].value-(-sPrice_step));
  var value=(100/(parseInt(e.max)-parseInt(e.min)))*parseInt(e.value)-(100/(parseInt(e.max)-parseInt(e.min)))*parseInt(e.min);  
  sPrice_max = e.value;
  $("#sPrice_rangeBar").css('right', 100-value+'%')
  $("#sPrice_rightThumb").css('left', value+'%')  

  var isEn = (typeof window.LANG !== 'undefined' && window.LANG === 'en');
  var maxDisplay = isEn ? ((sPrice_max * 100).toFixed(0) + "M") : (Number(sPrice_max).toFixed(1) + "억");
  $("#sPrice_maxVal").html(maxDisplay)

  $("#filterName_sPrice").html(formatPriceText(sPrice_min, sPrice_max, f_sales_price_min, f_sales_price_max));
}