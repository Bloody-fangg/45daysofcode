import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query,
  where,
  orderBy,
  increment
} from 'firebase/firestore';
import { db, COLLECTIONS, getFirebaseErrorMessage } from '../firebase';
import { UserData } from '../../contexts/AuthContext';

// User service functions
export const usersService = {
  // Update user profile
  async updateUserProfile(uid: string, data: Partial<UserData>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        ...data,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Get user data by UID
  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  },

  // Update user streak
  async updateUserStreak(uid: string, streakCount: number, streakBreaks?: number): Promise<void> {
    try {
      const updateData: any = {
        streak_count: streakCount,
        updated_at: new Date().toISOString()
      };
      
      if (streakBreaks !== undefined) {
        updateData.streak_breaks = streakBreaks;
        updateData.disqualified = streakBreaks >= 3;
      }

      await updateDoc(doc(db, COLLECTIONS.USERS, uid), updateData);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Increment attempt count
  async incrementAttempt(uid: string, difficulty: 'easy' | 'medium' | 'hard' | 'choice'): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        [`attempts.${difficulty}`]: increment(1),
        last_submission: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Increment approved count (when admin approves submission)
  async incrementApproved(uid: string, difficulty: 'easy' | 'medium' | 'hard' | 'choice'): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        [`approved.${difficulty}`]: increment(1),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Increment violations count
  async incrementViolations(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        violations: increment(1),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Update user calendar
  async updateUserCalendar(uid: string, date: string, status: 'completed' | 'missed' | 'paused'): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        [`calendar.${date}`]: status,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Get all users (for admin)
  async getAllUsers(): Promise<UserData[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      return usersSnapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserData[];
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  },

  // Get users by course/section (for admin)
  async getUsersByFilter(course?: string, section?: string, semester?: string): Promise<UserData[]> {
    try {
      let q = collection(db, COLLECTIONS.USERS);
      
      if (course) {
        q = query(q, where('course', '==', course)) as any;
      }
      if (section) {
        q = query(q, where('section', '==', section)) as any;
      }
      if (semester) {
        q = query(q, where('semester', '==', semester)) as any;
      }
      
      const usersSnapshot = await getDocs(q);
      return usersSnapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserData[];
    } catch (error) {
      console.error('Error fetching filtered users:', error);
      return [];
    }
  },

  // Disqualify/Requalify user (for admin)
  async setUserDisqualification(uid: string, disqualified: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        disqualified,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Reset user streak breaks (for admin)
  async resetUserStreakBreaks(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        streak_breaks: 0,
        disqualified: false,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Ban/Unban user (for admin)
  async setUserBanStatus(uid: string, isBanned: boolean, banReason?: string): Promise<void> {
    try {
      const updateData: any = {
        isBanned,
        updated_at: new Date().toISOString()
      };
      
      if (isBanned && banReason) {
        updateData.banReason = banReason;
        updateData.bannedAt = new Date().toISOString();
      } else if (!isBanned) {
        updateData.banReason = null;
        updateData.bannedAt = null;
      }

      await updateDoc(doc(db, COLLECTIONS.USERS, uid), updateData);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Submit daily summation
  async submitDailySummation(uid: string, day: number, content: string): Promise<void> {
    try {
      const summationKey = `dailySummations.day_${day}`;
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        [summationKey]: {
          day,
          date: new Date().toISOString().split('T')[0],
          content,
          wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
          submittedAt: new Date().toISOString(),
          reviewed: false
        },
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Review daily summation (admin)
  async reviewDailySummation(uid: string, day: number, reviewNotes: string, reviewedBy: string, approved: boolean = true): Promise<void> {
    try {
      const summationKey = `dailySummations.day_${day}`;
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        [`${summationKey}.reviewed`]: true,
        [`${summationKey}.approved`]: approved,
        [`${summationKey}.reviewNotes`]: reviewNotes,
        [`${summationKey}.reviewedAt`]: new Date().toISOString(),
        [`${summationKey}.reviewedBy`]: reviewedBy,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  }
};
