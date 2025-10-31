import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDcKy1WBi07qcF5miXUdgReootsBlSveDQ",
  authDomain: "examguard-32621.firebaseapp.com",
  projectId: "examguard-32621",
  storageBucket: "examguard-32621.firebasestorage.app",
  messagingSenderId: "459207240771",
  appId: "1:459207240771:web:f0f2d7757bc3fb74b878f6",
  measurementId: "G-2YSDNQE1HT"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export commonly used Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;