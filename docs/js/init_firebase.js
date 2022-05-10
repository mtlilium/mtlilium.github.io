// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyA7_0CWdjHDekYw7Itx19-hhmpdGmEi_ec",
    authDomain: "llp-score-manager.firebaseapp.com",
    projectId: "llp-score-manager",
    storageBucket: "llp-score-manager.appspot.com",
    messagingSenderId: "43667140212",
    appId: "1:43667140212:web:52730c5b40fb77d7446b21"
};

// Initialize Firebase
const fb_app = firebase.initializeApp(firebaseConfig);
const db = getDatabase(app);
