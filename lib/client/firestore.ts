// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqt1u0QKQ1K1v0DhKbWhX7bHCv5jXVnE4",
  authDomain: "snippy-n.firebaseapp.com",
  projectId: "snippy-n",
  storageBucket: "snippy-n.firebasestorage.app",
  messagingSenderId: "1049232088219",
  appId: "1:1049232088219:web:b00c4bdf45919c64dc7a3e",
  measurementId: "G-Y94TMHC7WL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const db = getFirestore(app);

export {
    app,
    db
}
