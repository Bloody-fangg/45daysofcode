import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBayTAMuS8N-edF9yoI9G0RoChp3bNjzlI",
  authDomain: "goodsinminutes.firebaseapp.com",
  projectId: "goodsinminutes",
  storageBucket: "goodsinminutes.firebasestorage.app",
  messagingSenderId: "701827935261",
  appId: "1:701827935261:web:e9c06860d3beef621daaf4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;