// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Thay thế đoạn này bằng config bạn copy từ Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBpufk6TMZUFwHypk5kkadI0-YuMrtZElw",
  authDomain: "windhub1407.firebaseapp.com",
  databaseURL: "https://windhub1407-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "windhub1407",
  storageBucket: "windhub1407.firebasestorage.app",
  messagingSenderId: "223329371708",
  appId: "1:223329371708:web:316d95729b4b43a9266539",
  measurementId: "G-0WHB4T3MCY"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo và xuất Firestore ra để dùng
export const db = getFirestore(app);