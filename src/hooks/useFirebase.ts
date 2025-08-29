import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  questionsService, 
  submissionsService, 
  assignmentsService,
  notificationsService,
  usersService, 
  examCooldownService,
  Question,
  Submission,
  Assignment,
  Notification,
  ExamCooldown
} from '../lib/firebase/index';

// Hook for managing questions
export const useQuestions = (date?: string) => {
  const [questions, setQuestions] = useState<Record<string, Question>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async (targetDate: string) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedQuestions = await questionsService.getQuestionsByDate(targetDate);
      setQuestions(fetchedQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async (questionData: Omit<Question, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await questionsService.setQuestion(questionData);
      // Refresh questions for the date
      if (date) {
        await fetchQuestions(date);
      }
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (date) {
      fetchQuestions(date);
    }
  }, [date]);

  return {
    questions,
    loading,
    error,
    fetchQuestions,
    addQuestion
  };
};

// Hook for managing submissions
export const useSubmissions = () => {
  const { userData } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserSubmissions = async () => {
    if (!userData) return;
    
    setLoading(true);
    setError(null);
    try {
      const userSubmissions = await submissionsService.getStudentSubmissions(userData.uid);
      setSubmissions(userSubmissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const submitSolution = async (submissionData: Omit<Submission, 'id' | 'created_at' | 'updated_at' | 'status' | 'submittedAt' | 'adminReview'>) => {
    try {
      // Check if this is the first submission for this date (any difficulty) BEFORE submitting
      const hasSubmittedBefore = await submissionsService.hasSubmittedAnyForDate(
        submissionData.student_uid, 
        submissionData.question_date
      );
      
      // Submit the solution
      const submissionId = await submissionsService.submitSolution(submissionData);
      
      // Update attempts count
      await usersService.incrementAttempt(submissionData.student_uid, submissionData.difficulty);
      
      // Only mark calendar as completed if this is the first submission of the day
      // This maintains streak: any one submission (easy/medium/hard/choice) counts for the day
      if (!hasSubmittedBefore) {
        await usersService.updateUserCalendar(
          submissionData.student_uid, 
          submissionData.question_date, 
          'completed'
        );
      }
      
      // Refresh submissions
      await fetchUserSubmissions();
      return submissionId;
    } catch (err) {
      throw err;
    }
  };

  const submitAnswer = async (studentUid: string, questionId: string, answer: string, date: Date) => {
    try {
      await submissionsService.submitAnswer(studentUid, questionId, answer, date);
      await fetchUserSubmissions(); // Refresh submissions
    } catch (err) {
      throw err;
    }
  };

  const checkSubmissionExists = async (date: string, difficulty: string): Promise<boolean> => {
    if (!userData) return false;
    return await submissionsService.hasSubmitted(userData.uid, date, difficulty);
  };

  useEffect(() => {
    if (userData) {
      fetchUserSubmissions();
    }
  }, [userData]);

  return {
    submissions,
    loading,
    error,
    submitSolution,
    submitAnswer, // Add this export
    checkSubmissionExists,
    refreshSubmissions: fetchUserSubmissions
  };
};

// Hook for exam cooldown
export const useExamCooldown = () => {
  const [examSettings, setExamSettings] = useState<ExamCooldown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExamSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await examCooldownService.getExamCooldown();
      setExamSettings(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exam settings');
    } finally {
      setLoading(false);
    }
  };

  const updateExamSettings = async (settings: Omit<ExamCooldown, 'created_at' | 'updated_at'>) => {
    try {
      await examCooldownService.updateExamCooldown(settings);
      await fetchExamSettings(); // Refresh
    } catch (err) {
      throw err;
    }
  };

  const toggleExamMode = async (active: boolean) => {
    try {
      await examCooldownService.toggleExamMode(active);
      await fetchExamSettings(); // Refresh
    } catch (err) {
      throw err;
    }
  };

  const isExamPeriod = (): boolean => {
    if (!examSettings) return false;
    return examCooldownService.isExamPeriod(examSettings);
  };

  useEffect(() => {
    fetchExamSettings();
  }, []);

  return {
    examSettings,
    loading,
    error,
    updateExamSettings,
    toggleExamMode,
    isExamPeriod,
    refreshSettings: fetchExamSettings
  };
};

// Hook for managing users (admin only)
export const useUsers = () => {
  const { userData } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllUsers = async () => {
    if (!userData?.isAdmin) return;
    
    setLoading(true);
    setError(null);
    try {
      const allUsers = await usersService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (uid: string, data: any) => {
    try {
      await usersService.updateUserProfile(uid, data);
      await fetchAllUsers(); // Refresh
    } catch (err) {
      throw err;
    }
  };

  const resetUserStreakBreaks = async (uid: string) => {
    try {
      await usersService.resetUserStreakBreaks(uid);
      await fetchAllUsers(); // Refresh
    } catch (err) {
      throw err;
    }
  };

  const setUserDisqualification = async (uid: string, disqualified: boolean) => {
    try {
      await usersService.setUserDisqualification(uid, disqualified);
      await fetchAllUsers(); // Refresh
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (userData?.isAdmin) {
      fetchAllUsers();
    }
  }, [userData]);

  return {
    users,
    loading,
    error,
    updateUserProfile,
    resetUserStreakBreaks,
    setUserDisqualification,
    refreshUsers: fetchAllUsers
  };
};

// Hook for managing assignments (admin only)
export const useAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const allAssignments = await assignmentsService.getAllAssignments();
      setAssignments(allAssignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const getAssignment = async (date: string): Promise<Assignment | null> => {
    try {
      return await assignmentsService.getAssignment(date);
    } catch (err) {
      console.error('Error fetching assignment:', err);
      return null;
    }
  };

  const createAssignment = async (date: string, assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await assignmentsService.setAssignment(date, assignmentData);
      await fetchAllAssignments(); // Refresh
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchAllAssignments();
  }, []);

  return {
    assignments,
    loading,
    error,
    getAssignment,
    createAssignment,
    refreshAssignments: fetchAllAssignments
  };
};

// Hook for managing notifications
export const useNotifications = () => {
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserNotifications = async () => {
    if (!userData) return;
    
    setLoading(true);
    setError(null);
    try {
      const userNotifications = await notificationsService.getUserNotifications(userData.uid);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.read).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      await fetchUserNotifications(); // Refresh
    } catch (err) {
      throw err;
    }
  };

  const markAllAsRead = async () => {
    if (!userData) return;
    try {
      await notificationsService.markAllAsRead(userData.uid);
      await fetchUserNotifications(); // Refresh
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (userData) {
      fetchUserNotifications();
    }
  }, [userData]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchUserNotifications
  };
};
