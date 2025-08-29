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
  Timestamp
} from 'firebase/firestore';
import { db, COLLECTIONS, getFirebaseErrorMessage } from '../firebase';

// Enhanced Submission interface for admin review workflow
export interface Submission {
  id?: string;
  student_uid: string;
  student_name: string;
  student_email: string;
  question_date: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'choice';
  question_title: string;
  code_text: string;
  github_file_link: string;
  external_problem_link: string;
  created_at: string;
  updated_at: string;
  submittedAt: Date; // For better date handling
  status: 'submitted' | 'approved' | 'rejected';
  admin_feedback?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  // Enhanced admin review tracking
  adminReview?: {
    status: 'pending' | 'approved' | 'rejected';
    feedback?: string;
    reviewedAt: Date;
    reviewedBy: string;
  };
}

// Submissions service functions
export const submissionsService = {
  // Submit a solution (enhanced version)
  async submitSolution(submissionData: Omit<Submission, 'id' | 'created_at' | 'updated_at' | 'status' | 'submittedAt' | 'adminReview'>): Promise<string> {
    try {
      const submissionId = `${submissionData.student_uid}_${submissionData.question_date}_${submissionData.difficulty}_${Date.now()}`;
      const now = new Date();
      const submission: Omit<Submission, 'id'> = {
        ...submissionData,
        status: 'submitted',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        submittedAt: now,
        adminReview: {
          status: 'pending',
          reviewedAt: now,
          reviewedBy: ''
        }
      };

      await setDoc(doc(db, COLLECTIONS.SUBMISSIONS, submissionId), submission);
      return submissionId;
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Simple submit method for easier integration
  async submitAnswer(studentUid: string, questionId: string, answer: string, date: Date): Promise<string> {
    const submissionData = {
      student_uid: studentUid,
      student_name: '', // Will be filled from auth context
      student_email: '',
      question_date: date.toISOString().split('T')[0],
      difficulty: 'choice' as const,
      question_title: questionId,
      code_text: answer,
      github_file_link: '',
      external_problem_link: ''
    };
    
    return this.submitSolution(submissionData);
  },

  // Get submissions for a student (enhanced to handle dates properly)
  async getStudentSubmissions(studentUid: string): Promise<Submission[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.SUBMISSIONS),
        where('student_uid', '==', studentUid),
        orderBy('created_at', 'desc')
      );
      
      const submissionsSnapshot = await getDocs(q);
      return submissionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure submittedAt is a Date object
          submittedAt: data.submittedAt ? (data.submittedAt.toDate ? data.submittedAt.toDate() : new Date(data.submittedAt)) : new Date(data.created_at),
          // Handle adminReview if it exists
          adminReview: data.adminReview ? {
            ...data.adminReview,
            reviewedAt: data.adminReview.reviewedAt ? (data.adminReview.reviewedAt.toDate ? data.adminReview.reviewedAt.toDate() : new Date(data.adminReview.reviewedAt)) : new Date()
          } : {
            status: data.status === 'approved' ? 'approved' : data.status === 'rejected' ? 'rejected' : 'pending',
            reviewedAt: new Date(),
            reviewedBy: data.reviewed_by || ''
          }
        } as Submission;
      });
    } catch (error) {
      console.error('Error fetching student submissions:', error);
      return [];
    }
  },

  // Get submissions for a specific date
  async getSubmissionsByDate(date: string): Promise<Submission[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.SUBMISSIONS),
        where('question_date', '==', date),
        orderBy('created_at', 'desc')
      );
      
      const submissionsSnapshot = await getDocs(q);
      return submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Submission[];
    } catch (error) {
      console.error('Error fetching submissions by date:', error);
      return [];
    }
  },

  // Get all submissions (for admin)
  async getAllSubmissions(): Promise<Submission[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.SUBMISSIONS),
        orderBy('created_at', 'desc')
      );
      
      const submissionsSnapshot = await getDocs(q);
      return submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Submission[];
    } catch (error) {
      console.error('Error fetching all submissions:', error);
      return [];
    }
  },

  // Update submission status (for admin)
  async updateSubmissionStatus(
    submissionId: string, 
    status: 'submitted' | 'approved' | 'rejected',
    adminFeedback?: string,
    reviewedBy?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString()
      };
      
      if (adminFeedback) updateData.admin_feedback = adminFeedback;
      if (reviewedBy) updateData.reviewed_by = reviewedBy;
      
      await updateDoc(doc(db, COLLECTIONS.SUBMISSIONS, submissionId), updateData);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Check if student has submitted for a specific date and difficulty
  async hasSubmitted(studentUid: string, date: string, difficulty: string): Promise<boolean> {
    try {
      const submissionId = `${studentUid}_${date}_${difficulty}`;
      const submissionDoc = await getDoc(doc(db, COLLECTIONS.SUBMISSIONS, submissionId));
      return submissionDoc.exists();
    } catch (error) {
      console.error('Error checking submission:', error);
      return false;
    }
  },

  // Check if student has submitted ANY level for a specific date (for streak maintenance)
  async hasSubmittedAnyForDate(studentUid: string, date: string): Promise<boolean> {
    try {
      const difficulties = ['easy', 'medium', 'hard', 'choice'];
      
      for (const difficulty of difficulties) {
        const submissionId = `${studentUid}_${date}_${difficulty}`;
        const submissionDoc = await getDoc(doc(db, COLLECTIONS.SUBMISSIONS, submissionId));
        if (submissionDoc.exists()) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking submissions for date:', error);
      return false;
    }
  },

  // Get student submissions for a specific date range (for admin view)
  async getStudentSubmissionsByDateRange(studentUid: string, startDate: string, endDate: string): Promise<Submission[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.SUBMISSIONS),
        where('student_uid', '==', studentUid),
        where('question_date', '>=', startDate),
        where('question_date', '<=', endDate),
        orderBy('question_date', 'desc'),
        orderBy('created_at', 'desc')
      );
      
      const submissionsSnapshot = await getDocs(q);
      return submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Submission[];
    } catch (error) {
      console.error('Error fetching student submissions by date range:', error);
      return [];
    }
  }
};
