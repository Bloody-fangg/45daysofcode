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
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db, COLLECTIONS, getFirebaseErrorMessage } from '../firebase';
import { notificationsService } from './notifications';

// Enhanced QA interface for student questions
export interface StudentQuestion {
  id?: string;
  student_uid: string;
  student_name: string;
  student_email: string;
  student_course: string;
  student_section: string;
  student_semester: string;
  question_text: string;
  status: 'pending' | 'answered' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'assignment' | 'general' | 'submission' | 'account' | 'platform';
  created_at: string;
  updated_at: string;
  admin_response?: string;
  responded_at?: string;
  responded_by?: string;
  responded_by_uid?: string;
  is_read: boolean;
  is_urgent: boolean;
  tags?: string[];
  follow_up_required?: boolean;
  resolution_time?: number; // in minutes
  satisfaction_rating?: number; // 1-5 stars
}

// Enhanced QA service functions
export const qaService = {
  // Submit a new question with enhanced validation
  async submitQuestion(questionData: {
    student_uid: string;
    student_name: string;
    student_email: string;
    student_course: string;
    student_section: string;
    student_semester: string;
    question_text: string;
    category?: string;
    priority?: string;
    tags?: string[];
  }): Promise<string> {
    try {
      const now = new Date();
      
      // Auto-detect priority based on keywords
      const urgentKeywords = ['urgent', 'deadline', 'emergency', 'asap', 'immediately'];
      const highPriorityKeywords = ['bug', 'error', 'broken', 'not working', 'cannot access'];
      
      const questionLower = questionData.question_text.toLowerCase();
      let autoPriority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
      
      if (urgentKeywords.some(keyword => questionLower.includes(keyword))) {
        autoPriority = 'urgent';
      } else if (highPriorityKeywords.some(keyword => questionLower.includes(keyword))) {
        autoPriority = 'high';
      }
      
      const question: Omit<StudentQuestion, 'id'> = {
        ...questionData,
        status: 'pending',
        priority: (questionData.priority as any) || autoPriority,
        category: (questionData.category as any) || 'general',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        is_read: false,
        is_urgent: autoPriority === 'urgent',
        tags: questionData.tags || [],
        follow_up_required: false
      };

      // Use addDoc to auto-generate ID
      const docRef = await addDoc(collection(db, 'student_questions'), question);
      
      // Create notification for admins about new question
      await this.notifyAdminsOfNewQuestion(docRef.id, questionData.student_name, questionData.question_text, autoPriority);
      
      return docRef.id;
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Enhanced get all questions with filtering
  async getAllQuestions(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    limit?: number;
  }): Promise<StudentQuestion[]> {
    try {
      let q = query(
        collection(db, 'student_questions'),
        orderBy('created_at', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }
      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }

      const questionsSnapshot = await getDocs(q);
      let questions = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentQuestion[];

      // Apply limit if specified
      if (filters?.limit) {
        questions = questions.slice(0, filters.limit);
      }

      return questions;
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  },

  // Get questions by status with enhanced sorting
  async getQuestionsByStatus(status: 'pending' | 'answered' | 'closed' | 'escalated'): Promise<StudentQuestion[]> {
    try {
      const q = query(
        collection(db, 'student_questions'),
        where('status', '==', status),
        orderBy('priority', 'desc'),
        orderBy('created_at', 'desc')
      );
      const questionsSnapshot = await getDocs(q);
      return questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentQuestion[];
    } catch (error) {
      console.error('Error fetching questions by status:', error);
      return [];
    }
  },

  // Enhanced get questions for a specific student
  async getStudentQuestions(studentUid: string): Promise<StudentQuestion[]> {
    try {
      const q = query(
        collection(db, 'student_questions'),
        where('student_uid', '==', studentUid),
        orderBy('created_at', 'desc')
      );
      const questionsSnapshot = await getDocs(q);
      return questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentQuestion[];
    } catch (error) {
      console.error('Error fetching student questions:', error);
      return [];
    }
  },

  // Enhanced answer question with notifications
  async answerQuestion(
    questionId: string, 
    response: string, 
    adminUid: string, 
    adminName: string,
    markAsResolved: boolean = true
  ): Promise<void> {
    try {
      const startTime = new Date();
      
      // Get the question to calculate resolution time
      const questionDoc = await getDoc(doc(db, 'student_questions', questionId));
      if (!questionDoc.exists()) {
        throw new Error('Question not found');
      }
      
      const questionData = questionDoc.data() as StudentQuestion;
      const createdAt = new Date(questionData.created_at);
      const resolutionTime = Math.round((startTime.getTime() - createdAt.getTime()) / (1000 * 60)); // in minutes
      
      await updateDoc(doc(db, 'student_questions', questionId), {
        admin_response: response,
        status: markAsResolved ? 'answered' : 'pending',
        responded_at: startTime.toISOString(),
        responded_by: adminName,
        responded_by_uid: adminUid,
        updated_at: startTime.toISOString(),
        resolution_time: resolutionTime,
        is_read: true
      });

      // Create notification for student
      await notificationsService.createNotification({
        user_uid: questionData.student_uid,
        type: 'general',
        title: '💬 Your Question Has Been Answered',
        message: `Your question about "${questionData.question_text.substring(0, 50)}..." has been answered by ${adminName}.`,
        date: startTime.toISOString(),
        read: false,
        action_required: false,
        priority: 'medium'
      });
      
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Mark question as read (admin)
  async markAsRead(questionId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'student_questions', questionId), {
        is_read: true,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Enhanced close question with reason
  async closeQuestion(questionId: string, reason?: string): Promise<void> {
    try {
      const updateData: any = {
        status: 'closed',
        updated_at: new Date().toISOString()
      };
      
      if (reason) {
        updateData.closure_reason = reason;
      }
      
      await updateDoc(doc(db, 'student_questions', questionId), updateData);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Escalate question to higher priority
  async escalateQuestion(questionId: string, reason: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'student_questions', questionId), {
        status: 'escalated',
        priority: 'urgent',
        escalation_reason: reason,
        escalated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Update question priority with audit trail
  async updatePriority(questionId: string, priority: 'low' | 'medium' | 'high' | 'urgent', adminName: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'student_questions', questionId), {
        priority: priority,
        priority_updated_by: adminName,
        priority_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Get enhanced statistics
  async getQAStatistics(): Promise<{
    total: number;
    pending: number;
    answered: number;
    closed: number;
    escalated: number;
    averageResolutionTime: number;
    urgentCount: number;
    todaysQuestions: number;
  }> {
    try {
      const allQuestions = await this.getAllQuestions();
      const today = new Date().toISOString().split('T')[0];
      
      const stats = {
        total: allQuestions.length,
        pending: allQuestions.filter(q => q.status === 'pending').length,
        answered: allQuestions.filter(q => q.status === 'answered').length,
        closed: allQuestions.filter(q => q.status === 'closed').length,
        escalated: allQuestions.filter(q => q.status === 'escalated').length,
        urgentCount: allQuestions.filter(q => q.priority === 'urgent').length,
        todaysQuestions: allQuestions.filter(q => q.created_at.startsWith(today)).length,
        averageResolutionTime: 0
      };
      
      // Calculate average resolution time for answered questions
      const answeredWithTime = allQuestions.filter(q => q.status === 'answered' && q.resolution_time);
      if (answeredWithTime.length > 0) {
        stats.averageResolutionTime = Math.round(
          answeredWithTime.reduce((sum, q) => sum + (q.resolution_time || 0), 0) / answeredWithTime.length
        );
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting QA statistics:', error);
      return {
        total: 0, pending: 0, answered: 0, closed: 0, escalated: 0,
        averageResolutionTime: 0, urgentCount: 0, todaysQuestions: 0
      };
    }
  },

  // Get unread questions count for admin
  async getUnreadCount(): Promise<number> {
    try {
      const q = query(
        collection(db, 'student_questions'),
        where('is_read', '==', false),
        where('status', '==', 'pending')
      );
      const questionsSnapshot = await getDocs(q);
      return questionsSnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  // Add tags to question
  async addTags(questionId: string, tags: string[]): Promise<void> {
    try {
      const questionDoc = await getDoc(doc(db, 'student_questions', questionId));
      if (questionDoc.exists()) {
        const currentTags = questionDoc.data().tags || [];
        const newTags = [...new Set([...currentTags, ...tags])]; // Remove duplicates
        
        await updateDoc(doc(db, 'student_questions', questionId), {
          tags: newTags,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Student feedback on answer
  async submitFeedback(questionId: string, rating: number, feedback?: string): Promise<void> {
    try {
      const updateData: any = {
        satisfaction_rating: rating,
        updated_at: new Date().toISOString()
      };
      
      if (feedback) {
        updateData.student_feedback = feedback;
      }
      
      await updateDoc(doc(db, 'student_questions', questionId), updateData);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  // Private method to notify admins of new questions
  async notifyAdminsOfNewQuestion(questionId: string, studentName: string, questionText: string, priority: string): Promise<void> {
    try {
      // This could be enhanced to get actual admin UIDs from users collection
      // For now, we'll create a general notification system
      console.log(`New ${priority} priority question from ${studentName}: ${questionText.substring(0, 100)}...`);
      
      // You could implement email notifications here or push notifications
      // await emailService.notifyAdmins(questionId, studentName, questionText, priority);
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }
};
