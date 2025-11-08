import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBM7vV6rfZ4n8a_c4Ku4zvfJ98psf0zO-M",
  authDomain: "circuvent.firebaseapp.com",
  databaseURL: "https://circuvent-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "circuvent",
  storageBucket: "circuvent.firebasestorage.app",
  messagingSenderId: "743562898363",
  appId: "1:743562898363:web:607e7f6d181a794948b29e",
  measurementId: "G-7X84TGZ6TY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const analytics = getAnalytics(app);

export default app;
