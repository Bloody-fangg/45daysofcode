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
  program?: string; // Course/Program filter
  semester?: string; // Semester filter
  section?: string; // Section filter (optional)
  created_at: string;
  updated_at: string;
}

// Program-specific exam cooldown
export interface ProgramExamCooldown {
  id: string;
  program: string;
  semester: string;
  section?: string;
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

  // Get all program-specific exam cooldowns
  async getAllProgramExamCooldowns(): Promise<ProgramExamCooldown[]> {
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const cooldownsQuery = query(
        collection(db, COLLECTIONS.PROGRAM_EXAM_COOLDOWNS || 'program_exam_cooldowns'),
        orderBy('created_at', 'desc')
      );
      
      const snapshot = await getDocs(cooldownsQuery);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ProgramExamCooldown));
    } catch (error) {
      console.error('Error fetching program exam cooldowns:', error);
      return [];
    }
  },

  // Get exam cooldown for specific student
  async getExamCooldownForStudent(program: string, semester: string, section?: string): Promise<ProgramExamCooldown | null> {
    try {
      const { collection, getDocs, query, where, limit } = await import('firebase/firestore');
      
      // First try to find exact match with section
      if (section) {
        const exactQuery = query(
          collection(db, COLLECTIONS.PROGRAM_EXAM_COOLDOWNS || 'program_exam_cooldowns'),
          where('program', '==', program),
          where('semester', '==', semester),
          where('section', '==', section),
          where('active', '==', true),
          limit(1)
        );
        
        const exactSnapshot = await getDocs(exactQuery);
        if (!exactSnapshot.empty) {
          const doc = exactSnapshot.docs[0];
          return { id: doc.id, ...doc.data() } as ProgramExamCooldown;
        }
      }
      
      // Fallback to program and semester match (no section specified)
      const generalQuery = query(
        collection(db, COLLECTIONS.PROGRAM_EXAM_COOLDOWNS || 'program_exam_cooldowns'),
        where('program', '==', program),
        where('semester', '==', semester),
        where('active', '==', true),
        limit(1)
      );
      
      const generalSnapshot = await getDocs(generalQuery);
      if (!generalSnapshot.empty) {
        const doc = generalSnapshot.docs[0];
        const data = doc.data() as ProgramExamCooldown;
        // Only return if no section is specified in the cooldown (applies to all sections)
        if (!data.section) {
          return { id: doc.id, ...data };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching student exam cooldown:', error);
      return null;
    }
  },

  // Create or update program-specific exam cooldown
  async createProgramExamCooldown(cooldown: Omit<ProgramExamCooldown, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      
      const newCooldown: Omit<ProgramExamCooldown, 'id'> = {
        ...cooldown,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.PROGRAM_EXAM_COOLDOWNS || 'program_exam_cooldowns'), newCooldown);
      return docRef.id;
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Update program-specific exam cooldown
  async updateProgramExamCooldown(id: string, updates: Partial<Omit<ProgramExamCooldown, 'id' | 'created_at'>>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.PROGRAM_EXAM_COOLDOWNS || 'program_exam_cooldowns', id), {
        ...updates,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Delete program-specific exam cooldown
  async deleteProgramExamCooldown(id: string): Promise<void> {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, COLLECTIONS.PROGRAM_EXAM_COOLDOWNS || 'program_exam_cooldowns', id));
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
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
  },

  // Check if student is in exam period (program-specific)
  isStudentInExamPeriod(studentCooldown: ProgramExamCooldown | null): boolean {
    if (!studentCooldown || !studentCooldown.active || !studentCooldown.start_date || !studentCooldown.end_date) {
      return false;
    }

    const now = new Date();
    const startDate = new Date(studentCooldown.start_date);
    const endDate = new Date(studentCooldown.end_date);

    return now >= startDate && now <= endDate;
  },

  // Get days since exam ended for streak continuation
  getDaysSinceExamEnded(studentCooldown: ProgramExamCooldown | null): number {
    if (!studentCooldown || !studentCooldown.end_date) {
      return 0;
    }

    const now = new Date();
    const endDate = new Date(studentCooldown.end_date);
    
    // Only calculate if exam has ended
    if (now <= endDate) {
      return 0;
    }

    const diffTime = now.getTime() - endDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because we want the day after exam
  }
};
