// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAivJVoqhrDQzuslEAoizhb5ByGhpQGHzE",
  authDomain: "aptrank-cc61b.firebaseapp.com",
  databaseURL: "https://aptrank-cc61b-default-rtdb.firebaseio.com",
  projectId: "aptrank-cc61b",
  storageBucket: "aptrank-cc61b.appspot.com",
  messagingSenderId: "987401326011",
  appId: "1:987401326011:web:d5a08de82a2aa2aed7489e",
  measurementId: "G-LSBHV7N1ND"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database()
const dbRef = firebase.database().ref();
