// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA7s95oaj498XdArjo9cT_8watLVw4JK3M",
  authDomain: "aptrank-cc61b.firebaseapp.com",
  projectId: "aptrank-cc61b",
  storageBucket: "aptrank-cc61b.appspot.com",
  messagingSenderId: "987401326011",
  appId: "1:987401326011:web:8732d04a9fc69280d7489e",
  measurementId: "G-BH5DRBH380",
  databaseURL: "https://aptrank-cc61b-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);    

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database()  
const dbRef = firebase.database().ref();

export function checkCounter(pageName){
  console.log(pageName)

  dbRef.child(today_str).get().then((snapshot) => {
    if (snapshot.exists()) {
      countUp(pageName)
    } else {
      addDB()
    }
  }).catch((error) => {
    console.error(error);
  });
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

  database.ref("DailyConnection/" + today_str+"/aptrank").set({
    "DayCount": 0,
    "region" : aptrank_region_list
  })
  database.ref("DailyConnection/" + today_str+"/aptrank_PRICE").set({
    "DayCount": 0,
    "region" : aptrank_region_list
  })
  database.ref("DailyConnection/" + today_str+"/aptrank_THEME").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str+"/aptrank_BIZ").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str+"/aptrank_NEWS").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str+"/aptrank_OP").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str+"/MoneyFlow").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str+"/cityclass").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str+"/aptrankBIZ_DS").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str+"/aptrankBIZ_DS_PriceCal").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str+"/aptrankBIZ_KT").set({
    "DayCount": 0,    
  })
  database.ref("DailyConnection/" + today_str+"/aptrankBIZ_KT_PriceCal").set({
    "DayCount": 0,    
  })  
}

export function countUp(pageName) {
  const updates = {};  
  updates["DailyConnection/" + today_str + "/" + pageName + "/DayCount"] = firebase.database.ServerValue.increment(1);    
  firebase.database().ref().update(updates);
}

export function regionCountUp(pageName, regionName) {
  const updates = {};  
  updates["DailyConnection/" + today_str + "/" + pageName + "/region/" + regionName] = firebase.database.ServerValue.increment(1);    
  firebase.database().ref().update(updates);
}

checkCounter(pageName)
