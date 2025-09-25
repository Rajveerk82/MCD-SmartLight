// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCvBrwAQOTRDMszkDuu3_EIG09u283g4k",
  authDomain: "server-8f7f2.firebaseapp.com",
  databaseURL: "https://server-8f7f2-default-rtdb.firebaseio.com",
  projectId: "server-8f7f2",
  storageBucket: "server-8f7f2.firebasestorage.app",
  messagingSenderId: "1072946022532",
  appId: "1:1072946022532:web:da322ae17b3e58a56d5ad1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const database = getDatabase(app);

export { auth, firestore, database };