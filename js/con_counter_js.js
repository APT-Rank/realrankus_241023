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

var comment_db = firebase.firestore()
var database = firebase.database()  
var dbRef = firebase.database().ref();
var docRef = ""

var today = new Date()
var today_year = today.getFullYear();
var today_month = dateReturn( (today.getMonth() + 1))
var today_day = dateReturn( today.getDate() );
var today_num = Number("" + today_year + today_month + today_day)
var today_str = today_year + "-" + today_month + "-" + today_day

function dateReturn(n){
  return n<10 ? "0"+n : n
} 

function checkCounter(){  
  var AppleLogging = localStorage.getItem("AppleLogging");
  if(AppleLogging){}
  else{
    dbRef.child("DailyConnection").child(today_str).get().then((snapshot) => {
      if (snapshot.exists()) {
        //countUp(pageName)
      } else {
        addDB()
      }
    }).catch((error) => {
      console.error(error);
    });
  }
}

function addDB(){
  // 데이터 저장
  var aptrank_region_list = {}
  for (var i = 0 ; i < inSeoul.length ; i++){
    aptrank_region_list[inSeoul[i][1]] = 0
  }
  for (var i = 0 ; i < inBusan.length ; i++){
    aptrank_region_list[inBusan[i][1]] = 0
  }
  for (var i = 0 ; i < inDaegu.length ; i++){
    aptrank_region_list[inDaegu[i][1]] = 0
  }
  for (var i = 0 ; i < inIncheon.length ; i++){
    aptrank_region_list[inIncheon[i][1]] = 0
  }
  for (var i = 0 ; i < inGwangju.length ; i++){
    aptrank_region_list[inGwangju[i][1]] = 0
  }
  for (var i = 0 ; i < inUlsan.length ; i++){
    aptrank_region_list[inUlsan[i][1]] = 0
  }
  for (var i = 0 ; i < inSejong.length ; i++){
    aptrank_region_list[inSejong[i][1]] = 0
  }
  for (var i = 0 ; i < inGyeonggi.length ; i++){
    aptrank_region_list[inGyeonggi[i][1]] = 0
  }
  for (var i = 0 ; i < inNewGangwondo.length ; i++){
    aptrank_region_list[inNewGangwondo[i][1]] = 0
  }
  for (var i = 0 ; i < inChungcheongbukdo.length ; i++){
    aptrank_region_list[inChungcheongbukdo[i][1]] = 0
  }
  for (var i = 0 ; i < inChungcheongnamdo.length ; i++){
    aptrank_region_list[inChungcheongnamdo[i][1]] = 0
  } 
  for (var i = 0 ; i < inJeollabukdo.length ; i++){
    aptrank_region_list[inJeollabukdo[i][1]] = 0
  } 
  for (var i = 0 ; i < inJeollanamdo.length ; i++){
    aptrank_region_list[inJeollanamdo[i][1]] = 0
  } 
  for (var i = 0 ; i < inGyeongsangbukdo.length ; i++){
    aptrank_region_list[inGyeongsangbukdo[i][1]] = 0
  }
  for (var i = 0 ; i < inGyeongsangnamdo.length ; i++){
    aptrank_region_list[inGyeongsangnamdo[i][1]] = 0
  } 
  for (var i = 0 ; i < inJejudo.length ; i++){
    aptrank_region_list[inJejudo[i][1]] = 0
  }

  database.ref("DailyConnection/" + today_str + "/aptrank").set({
    "DayCount": 0,
    "region" : aptrank_region_list
  })
  database.ref("DailyConnection/" + today_str + "/aptrank_PRICE").set({
    "DayCount": 0,
    "region" : aptrank_region_list
  })
  database.ref("DailyConnection/" + today_str + "/aptrank_THEME").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str + "/aptrank_BIZ").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str + "/aptrank_NEWS").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str + "/aptrank_OP").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str + "/MoneyFlow").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str + "/cityclass").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str + "/aptrank_PriceCal").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str + "/aptrankBIZ_DS").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str + "/aptrankBIZ_DS_PriceCal").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str + "/aptrankBIZ_KT").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str + "/aptrankBIZ_KT_PriceCal").set({
    "DayCount": 0,    
  }) 
}

function countUp(pageName) {
  const updates = {};  
  updates["DailyConnection/" + today_str + "/" + pageName + "/DayCount"] = firebase.database.ServerValue.increment(1);    
  firebase.database().ref().update(updates);
}

function regionCountUp(pageName, regionName) {
  const updates = {};  
  updates["DailyConnection/" + today_str + "/" + pageName + "/region/" + regionName] = firebase.database.ServerValue.increment(1);    
  firebase.database().ref().update(updates);
}

checkCounter()