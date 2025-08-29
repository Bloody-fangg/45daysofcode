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

// Question interface
export interface Question {
  id?: string;
  date: string; // YYYY-MM-DD format
  difficulty: 'easy' | 'medium' | 'hard' | 'choice';
  title: string;
  description: string;
  link: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Questions service functions
export const questionsService = {
  // Add or update a question for a specific date and difficulty
  async setQuestion(questionData: Omit<Question, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const questionId = `${questionData.date}_${questionData.difficulty}`;
      const questionDoc = {
        ...questionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await setDoc(doc(db, COLLECTIONS.QUESTIONS, questionId), questionDoc);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Get questions for a specific date
  async getQuestionsByDate(date: string): Promise<Record<string, Question>> {
    try {
      const questions: Record<string, Question> = {};
      const difficulties = ['easy', 'medium', 'hard', 'choice'];
      
      for (const difficulty of difficulties) {
        const questionId = `${date}_${difficulty}`;
        const questionDoc = await getDoc(doc(db, COLLECTIONS.QUESTIONS, questionId));
        
        if (questionDoc.exists()) {
          questions[difficulty] = { id: questionDoc.id, ...questionDoc.data() } as Question;
        }
      }
      
      return questions;
    } catch (error) {
      console.error('Error fetching questions:', error);
      return {};
    }
  },

  // Get a specific question
  async getQuestion(date: string, difficulty: string): Promise<Question | null> {
    try {
      const questionId = `${date}_${difficulty}`;
      const questionDoc = await getDoc(doc(db, COLLECTIONS.QUESTIONS, questionId));
      
      if (questionDoc.exists()) {
        return { id: questionDoc.id, ...questionDoc.data() } as Question;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching question:', error);
      return null;
    }
  },

  // Delete a question
  async deleteQuestion(date: string, difficulty: string): Promise<void> {
    try {
      const questionId = `${date}_${difficulty}`;
      await deleteDoc(doc(db, COLLECTIONS.QUESTIONS, questionId));
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Get all questions (for admin)
  async getAllQuestions(): Promise<Question[]> {
    try {
      const questionsSnapshot = await getDocs(collection(db, COLLECTIONS.QUESTIONS));
      return questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];
    } catch (error) {
      console.error('Error fetching all questions:', error);
      return [];
    }
  }
};
