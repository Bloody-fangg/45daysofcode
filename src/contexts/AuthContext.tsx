import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { authService, ADMIN_EMAIL } from '../lib/firebase/index';

export interface UserData {
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
  approved: {
    easy: number;
    medium: number;
    hard: number;
    choice: number;
  };
  violations: number;
  calendar: Record<string, 'completed' | 'missed' | 'paused'>;
  last_submission: string;
  created_at: string;
  updated_at: string;
  isAdmin: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  setUserData: (data: UserData | null) => void;
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

  const fetchUserData = async (user: User) => {
    try {
      const data = await authService.getUserData(user.uid);
      if (data) {
        setUserData(data);
      } else {
        // If no user data exists but user is authenticated, create basic user data
        const basicUserData: UserData = {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          enrollment_no: '',
          course: '',
          section: '',
          semester: '',
          github_repo_link: '',
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
          isAdmin: user.email === ADMIN_EMAIL
        };
        setUserData(basicUserData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const signup = async (email: string, password: string, additionalData: Partial<UserData>) => {
    try {
      console.log('AuthContext: Attempting signup with:', email);
      const userData = await authService.signUp(email, password, additionalData);
      console.log('AuthContext: Signup successful, userData:', userData);
      setUserData(userData);
    } catch (error) {
      console.error('AuthContext: Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Attempting login with:', email);
      const user = await authService.signIn(email, password);
      console.log('AuthContext: Login successful, user:', user.uid);
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUserData(null);
    } catch (error) {
      throw error;
    }
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
    setUserData: (data: UserData | null) => setUserData(data),
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