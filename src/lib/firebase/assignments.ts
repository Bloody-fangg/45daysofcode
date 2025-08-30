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
  category?: string;
  example?: string;
  constraint?: string;
}

// Assignments service functions
export const assignmentsService = {
  // Create or update assignment for a specific date
  async setAssignment(date: string, assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      console.log(`🔥 FIREBASE SERVICE - Setting assignment for date: ${date}`);
      console.log(`🔥 FIREBASE SERVICE - Assignment data:`, assignmentData);
      
      // Check if assignment already exists
      const existingDoc = await getDoc(doc(db, COLLECTIONS.ASSIGNMENTS, date));
      
      let assignment: Omit<Assignment, 'id'>;
      
      if (existingDoc.exists()) {
        // Update existing assignment
        console.log(`🔥 FIREBASE SERVICE - Updating existing assignment`);
        assignment = {
          ...assignmentData,
          created_at: existingDoc.data().created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } else {
        // Create new assignment
        console.log(`🔥 FIREBASE SERVICE - Creating new assignment`);
        assignment = {
          ...assignmentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      console.log(`🔥 FIREBASE SERVICE - Final assignment to save:`, assignment);
      console.log(`🔥 FIREBASE SERVICE - Question descriptions:`, {
        easy: assignment.easy_question.description,
        medium: assignment.medium_question.description,
        hard: assignment.hard_question.description
      });

      await setDoc(doc(db, COLLECTIONS.ASSIGNMENTS, date), assignment);
      
      console.log(`✅ FIREBASE SERVICE - Assignment saved successfully for date: ${date}`);
      return date;
    } catch (error) {
      console.error(`❌ FIREBASE SERVICE - Error saving assignment:`, error);
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
      console.log(`🔍 FIREBASE SERVICE - Fetching all assignments...`);
      const assignmentsSnapshot = await getDocs(collection(db, COLLECTIONS.ASSIGNMENTS));
      
      const assignments = assignmentsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`📄 FIREBASE SERVICE - Assignment ${doc.id}:`, {
          id: doc.id,
          date: data.date,
          day_number: data.day_number,
          easy_description: data.easy_question?.description || 'No easy description',
          medium_description: data.medium_question?.description || 'No medium description', 
          hard_description: data.hard_question?.description || 'No hard description',
          fullData: data
        });
        
        return {
          id: doc.id,
          ...data
        } as Assignment;
      });
      
      console.log(`✅ FIREBASE SERVICE - Fetched ${assignments.length} assignments successfully`);
      return assignments;
    } catch (error) {
      console.error('❌ FIREBASE SERVICE - Error fetching assignments:', error);
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
