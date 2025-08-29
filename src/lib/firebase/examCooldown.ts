import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db, COLLECTIONS, getFirebaseErrorMessage } from '../firebase';

// Exam cooldown interface
export interface ExamCooldown {
  active: boolean;
  start_date: string;
  end_date: string;
  pause_submissions_count: boolean;
  message: string;
  created_at: string;
  updated_at: string;
}

// Exam cooldown service functions
export const examCooldownService = {
  // Get exam cooldown settings
  async getExamCooldown(): Promise<ExamCooldown | null> {
    try {
      const examDoc = await getDoc(doc(db, COLLECTIONS.EXAM_COOLDOWN, 'settings'));
      
      if (examDoc.exists()) {
        return examDoc.data() as ExamCooldown;
      }
      
      // Return default settings if none exist
      return {
        active: false,
        start_date: '',
        end_date: '',
        pause_submissions_count: true,
        message: "📚 All The Best For Your Exams! Your streak is paused during this period.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching exam cooldown settings:', error);
      return null;
    }
  },

  // Update exam cooldown settings (admin only)
  async updateExamCooldown(settings: Omit<ExamCooldown, 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const examSettings: ExamCooldown = {
        ...settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await setDoc(doc(db, COLLECTIONS.EXAM_COOLDOWN, 'settings'), examSettings);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Toggle exam mode (admin only)
  async toggleExamMode(active: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.EXAM_COOLDOWN, 'settings'), {
        active,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Check if we are currently in exam period
  isExamPeriod(examSettings: ExamCooldown): boolean {
    if (!examSettings.active || !examSettings.start_date || !examSettings.end_date) {
      return false;
    }

    const now = new Date();
    const startDate = new Date(examSettings.start_date);
    const endDate = new Date(examSettings.end_date);

    return now >= startDate && now <= endDate;
  }
};
