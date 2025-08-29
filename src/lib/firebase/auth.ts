import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS, getFirebaseErrorMessage } from '../firebase';
import { UserData } from '../../contexts/AuthContext';

// Admin email constant
export const ADMIN_EMAIL = 'amiarchive79.in@gmail.com';

// Authentication service functions
export const authService = {
  // Sign in user
  async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('Attempting to sign in with email:', email);
      
      // Check if Firebase is properly initialized
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', userCredential.user.uid);
      return userCredential.user;
    } catch (error: any) {
      console.error('Sign in error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Sign up user
  async signUp(email: string, password: string, additionalData: Partial<UserData>): Promise<UserData> {
    try {
      console.log('Attempting to sign up with email:', email);
      
      // Check if Firebase is properly initialized
      if (!auth || !db) {
        throw new Error('Firebase not properly initialized');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created:', user.uid);

      const userData: UserData = {
        uid: user.uid,
        email: user.email!,
        name: additionalData.name || '',
        enrollment_no: additionalData.enrollment_no || '',
        course: additionalData.course || '',
        section: additionalData.section || '',
        semester: additionalData.semester || '',
        github_repo_link: additionalData.github_repo_link || '',
        streak_count: 0,
        streak_breaks: 0,
        disqualified: false,
        attempts: { easy: 0, medium: 0, hard: 0, choice: 0 },
        approved: { easy: 0, medium: 0, hard: 0, choice: 0 },
        violations: 0,
        calendar: {},
        last_submission: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isAdmin: email === ADMIN_EMAIL
      };

      console.log('Saving user data to Firestore...');
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userData);
      console.log('User data saved successfully');
      
      return userData;
    } catch (error: any) {
      console.error('Sign up error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Sign out user
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Get user data from Firestore
  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        return { ...data, isAdmin: data.email === ADMIN_EMAIL };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }
};
