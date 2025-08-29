import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db, COLLECTIONS, getFirebaseErrorMessage } from '../firebase';

// Assignment interface for daily questions
export interface Assignment {
  id?: string;
  date: string; // YYYY-MM-DD format
  day_number: number; // 1-45
  easy_question: QuestionAssignment;
  medium_question: QuestionAssignment;
  hard_question: QuestionAssignment;
  created_at: string;
  updated_at: string;
  created_by: string; // admin uid
}

export interface QuestionAssignment {
  title: string;
  description: string;
  link: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

// Assignments service functions
export const assignmentsService = {
  // Create or update assignment for a specific date
  async setAssignment(date: string, assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const assignment: Omit<Assignment, 'id'> = {
        ...assignmentData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await setDoc(doc(db, COLLECTIONS.ASSIGNMENTS, date), assignment);
      return date;
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Get assignment for a specific date
  async getAssignment(date: string | Date): Promise<Assignment | null> {
    try {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      const assignmentDoc = await getDoc(doc(db, COLLECTIONS.ASSIGNMENTS, dateStr));
      if (assignmentDoc.exists()) {
        return {
          id: assignmentDoc.id,
          ...assignmentDoc.data()
        } as Assignment;
      }
      return null;
    } catch (error) {
      console.error('Error fetching assignment:', error);
      return null;
    }
  },

  // Get all assignments
  async getAllAssignments(): Promise<Assignment[]> {
    try {
      const assignmentsSnapshot = await getDocs(collection(db, COLLECTIONS.ASSIGNMENTS));
      return assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assignment[];
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }
  },

  // Get assignments in date range
  async getAssignmentsByDateRange(startDate: string, endDate: string): Promise<Assignment[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ASSIGNMENTS),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );
      
      const assignmentsSnapshot = await getDocs(q);
      return assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assignment[];
    } catch (error) {
      console.error('Error fetching assignments by date range:', error);
      return [];
    }
  },

  // Update assignment
  async updateAssignment(date: string, updateData: Partial<Assignment>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.ASSIGNMENTS, date), {
        ...updateData,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Delete assignment
  async deleteAssignment(date: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ASSIGNMENTS, date));
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  }
};
