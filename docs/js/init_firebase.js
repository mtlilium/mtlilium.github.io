// Import the functions you need from the SDKs you need
import * as _fb from "https://www.gstatic.com/firebasejs/9.8.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.8.0/firebase-database.js";
import * as _fb_fs from "https://www.gstatic.com/firebasejs/9.8.0/firebase-firestore.js";
// import {doc, collection, getFirestore, addDoc, getDocs, setDoc} from "https://www.gstatic.com/firebasejs/9.8.0/firebase-firestore.js";
import * as _fb_auth from "https://www.gstatic.com/firebasejs/9.8.0/firebase-auth.js";
// import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/9.8.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
apiKey: "AIzaSyA7_0CWdjHDekYw7Itx19-hhmpdGmEi_ec",
authDomain: "llp-score-manager.firebaseapp.com",
projectId: "llp-score-manager",
storageBucket: "llp-score-manager.appspot.com",
messagingSenderId: "43667140212",
appId: "1:43667140212:web:52730c5b40fb77d7446b21"
};
// Initialize Firebase
export const fb = _fb;
export const app = fb.initializeApp(firebaseConfig);
export const fb_fs = _fb_fs;
export const db = fb_fs.getFirestore(app);
export const fb_auth = _fb_auth;
export const auth = fb_auth.getAuth();
