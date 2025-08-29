import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApXqVtQClMvpN8ycqILRrR7BRU7ZsjkN8",
  authDomain: "daysofcode-c0f00.firebaseapp.com",
  projectId: "daysofcode-c0f00",
  storageBucket: "daysofcode-c0f00.firebasestorage.app",
  messagingSenderId: "763577595250",
  appId: "1:763577595250:web:bd90a03e4d1be5d48c19eb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to Firebase Emulators in development (optional)
if (false && process.env.NODE_ENV === 'development') {
  // Disabled emulators - using production Firebase
  // Uncomment these lines if you want to use Firebase Emulators for local development
  // connectAuthEmulator(auth, "http://localhost:9099");
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectStorageEmulator(storage, "localhost", 9199);
}

// Collection names for better organization
export const COLLECTIONS = {
  USERS: 'users',
  QUESTIONS: 'questions',
  SUBMISSIONS: 'submissions',
  ASSIGNMENTS: 'assignments',
  NOTIFICATIONS: 'notifications',
  EXAM_COOLDOWN: 'exam_cooldown',
  ANALYTICS: 'analytics'
} as const;

// Helper function to get error message
export const getFirebaseErrorMessage = (error: any): string => {
  console.log('Firebase error details:', error);
  
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No user found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    case 'unavailable':
      return 'Service is currently unavailable. Please try again later.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

export default app;