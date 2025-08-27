import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserData {
  uid: string;
  name: string;
  enrollment_no: string;
  email: string;
  course: string;
  section: string;
  semester: string;
  github_repo_link: string;
  streak_count: number;
  streak_breaks: number;
  disqualified: boolean;
  attempts: {
    easy: number;
    medium: number;
    hard: number;
    choice: number;
  };
  calendar: Record<string, 'completed' | 'missed' | 'paused'>;
  created_at: string;
  updated_at: string;
  isAdmin: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, additionalData: Partial<UserData>) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = 'optimusprime79.in@gmail.com';

  const fetchUserData = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData({ ...data, isAdmin: user.email === ADMIN_EMAIL });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const signup = async (email: string, password: string, additionalData: Partial<UserData>) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

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
      calendar: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isAdmin: email === ADMIN_EMAIL
    };

    await setDoc(doc(db, 'users', user.uid), userData);
    setUserData(userData);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    login,
    signup,
    logout,
    isAdmin: userData?.isAdmin || false
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};