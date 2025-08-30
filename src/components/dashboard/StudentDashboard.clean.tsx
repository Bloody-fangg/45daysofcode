import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserData } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useSubmissions, useAssignments, useNotifications } from '../../hooks/useFirebase';
import { 
  assignmentsService,
  scheduleService,
  examCooldownService,
  usersService,
  qaService,
  submissionsService,
  notificationsService,
  type Assignment,
  type Notification,
  type ScheduledAssignment,
  type StreakCalculation,
  type ProgramExamCooldown
} from '../../lib/firebase/index';
import { 
  Bell,
  AlertTriangle,
  Check,
  Info,
  Calendar as CalendarIcon,
  Trophy,
  Target,
  Zap,
  Clock,
  CheckCircle2,
  GraduationCap,
  Book,
  RefreshCw,
  HelpCircle,
  MessageCircle,
  Send
} from 'lucide-react';
import { format, startOfDay, addDays, isWithinInterval, differenceInMilliseconds, addMilliseconds } from 'date-fns';
import SubmissionModal from './SubmissionModal';
import NotificationBell from './NotificationBell';

const StudentDashboard = () => {
  const { currentUser, userData, logout, setUserData } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [selectedTab, setSelectedTab] = useState('easy');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);
  const [questionText, setQuestionText] = useState('');
  
  // Enhanced data states
  const [todayAssignment, setTodayAssignment] = useState<ScheduledAssignment | null>(null);
  const [canSubmitToday, setCanSubmitToday] = useState(true);
  const [submitReason, setSubmitReason] = useState('');
  const [enhancedStreak, setEnhancedStreak] = useState<StreakCalculation | null>(null);
  const [assignmentCalendar, setAssignmentCalendar] = useState<any>({});
  
  // Firebase hooks
  const { submissions, submitAnswer, loading: submissionsLoading } = useSubmissions();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const { notifications } = useNotifications();

  // Check if student has already attempted this difficulty today
  const hasAttemptedDifficultyToday = async (difficulty: string) => {
    if (!currentUser) return false;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const userSubmissions = await submissionsService.getUserSubmissionsForDate(currentUser.uid, today);
      
      // Check if there's already a submission for this difficulty today
      const existingSubmission = userSubmissions.find(sub => 
        sub.difficulty === difficulty && 
        sub.submitted_at.startsWith(today)
      );
      
      return !!existingSubmission;
    } catch (error) {
      console.error('Error checking today attempts:', error);
      return false;
    }
  };

  // Calculate day number based on registration
  const calculateDayNumber = () => {
    if (!userData?.created_at) return 1;
    
    const registrationDate = new Date(userData.created_at);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, daysDiff + 1);
  };

  const dayNumber = calculateDayNumber();

  // Load enhanced data on component mount
  useEffect(() => {
    const loadTodayData = async () => {
      try {
        if (!currentUser) return;

        // Load notifications with unread indicator
        if (userData) {
          setHasUnread(true); // Placeholder - you can implement real logic
          
          const unreadCount = await notificationsService.getUnreadCount(
            currentUser.uid
          );
        }

        // Get today's assignment
        const todaysAssignment = await scheduleService.getTodaysAssignment(currentUser.uid);
        console.log('Today\'s assignment:', todaysAssignment);
        setTodayAssignment(todaysAssignment);
        
        // Check if student can submit today
        const submitCheck = await scheduleService.canSubmitToday(currentUser.uid);
        console.log('Can submit today:', submitCheck);
        setCanSubmitToday(submitCheck.canSubmit);
        setSubmitReason(submitCheck.reason || '');
        
        // Calculate enhanced streak
        const streakData = await scheduleService.calculateEnhancedStreak(currentUser.uid);
        console.log('Enhanced streak:', streakData);
        setEnhancedStreak(streakData);
        
        // Get assignment calendar
        const calendar = await scheduleService.getAssignmentCalendar(currentUser.uid);
        console.log('Assignment calendar:', calendar);
        setAssignmentCalendar(calendar);
        
      } catch (error) {
        console.error('Error loading today\'s data:', error);
      }
    };

    loadTodayData();
  }, [currentUser]);

  // Load assignment for selected date
  useEffect(() => {
    if (selectedDate) {
      const loadSelectedDateAssignment = async () => {
        try {
          const selectedDateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          console.log('Loading assignment for selected date:', selectedDateStr);
          
          // Fetch assignment for the specific date
          const allAssignments = await scheduleService.getVisibleAssignments(currentUser.uid);
          const assignmentForDate = allAssignments.find(a => a.date === selectedDateStr);
          console.log('Assignment for selected date:', assignmentForDate);
          
          // You can set specific state here if needed for the selected date
          
        } catch (error) {
          console.error('Error loading assignment for selected date:', error);
        }
      };

      loadSelectedDateAssignment();
    }
  }, [selectedDate]);

  const handleSubmission = async (difficulty: 'easy' | 'medium' | 'hard' | 'choice') => {
    // Check if user can submit
    if (!canSubmitToday) {
      toast({
        title: "Cannot Submit",
        description: submitReason,
        variant: "destructive",
      });
      return;
    }

    // Check if student has already attempted this difficulty today
    const hasAttempted = await hasAttemptedDifficultyToday(difficulty);
    
    if (hasAttempted) {
      toast({
        title: "Already Attempted",
        description: `You have already attempted a ${difficulty} question today. You can only attempt one question per difficulty level per day.`,
        variant: "destructive"
      });
      return;
    }

    try {
      // If we have today's assignment, use it
      if (todayAssignment && todayAssignment.isActive) {
        const question = todayAssignment[`${difficulty}_question` as keyof ScheduledAssignment] as any;
        setSelectedQuestion({ ...question, difficulty });
        setShowSubmissionModal(true);
      } else {
        // Show message about no active assignment
        toast({
          title: "No Active Assignment",
          description: "There is no active assignment for today. Please check with your admin.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error handling submission:', error);
      toast({
        title: "Error",
        description: "An error occurred while processing your request.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!currentUser || !userData || !selectedQuestion) return;

    // Check if student has already attempted this difficulty today
    const hasAttempted = await hasAttemptedDifficultyToday(selectedQuestion.difficulty);
    
    if (hasAttempted) {
      toast({
        title: "Already Attempted",
        description: `You have already attempted a ${selectedQuestion.difficulty} question today. You can only attempt one question per difficulty level per day.`,
        variant: "destructive"
      });
      setShowSubmissionModal(false);
      return;
    }

    try {
      const assignmentId = todayAssignment?.id || `demo-${new Date().toISOString().split('T')[0]}`;
      const today = new Date().toISOString().split('T')[0];
      
      // Submit the answer
      await submitAnswer(
        currentUser.uid,
        assignmentId,
        answer,
        new Date()
      );

      // Immediately increase streak and attempt count upon submission
      await usersService.updateUserStreak(currentUser.uid, userData.streak_count + 1);
      await usersService.incrementAttempt(currentUser.uid, selectedQuestion.difficulty as 'easy' | 'medium' | 'hard' | 'choice');
      
      // Update calendar to mark today as completed (green circle)
      await usersService.updateUserCalendar(currentUser.uid, today, 'completed');
      
      // Update local user data
      setUserData({
        ...userData,
        streak_count: userData.streak_count + 1,
        attempts: {
          ...userData.attempts,
          [selectedQuestion.difficulty]: (userData.attempts[selectedQuestion.difficulty as keyof typeof userData.attempts] || 0) + 1
        },
        calendar: {
          ...userData.calendar,
          [today]: 'completed'
        },
        last_submission: new Date().toISOString()
      });
      
      toast({
        title: "Success",
        description: "Your solution has been submitted! Your streak has been updated and calendar marked.",
      });
      
      setShowSubmissionModal(false);
      
      // Refresh calendar data to show the green circle
      if (Object.keys(assignmentCalendar).length > 0) {
        const calendar = await scheduleService.getAssignmentCalendar(currentUser.uid);
        setAssignmentCalendar(calendar);
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit solution. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {userData.name}! Day {dayNumber} of your coding journey.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <NotificationBell />
          
          {/* Ask Button */}
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowAskModal(true)}
          >
            <HelpCircle className="w-4 h-4" />
            Ask
          </Button>

          {/* Streak Display */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg">
            <Trophy className="w-5 h-5" />
            <div className="text-center">
              <div className="text-sm font-medium">
                <span>{enhancedStreak?.currentStreak ?? userData.streak_count} Day Streak</span>
              </div>
              {enhancedStreak && !enhancedStreak.isStreakActive && enhancedStreak.streakBreakReason === 'exam_period' && (
                <div className="text-xs opacity-90">
                  (Paused for exams)
                </div>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <Button onClick={logout} variant="ghost" size="sm">
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Activity Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Activity Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={(() => {
                  const completed: Date[] = [];
                  const missed: Date[] = [];
                  const paused: Date[] = [];
                  const scheduled: Date[] = [];
                  
                  // Use enhanced calendar data if available
                  if (Object.keys(assignmentCalendar).length > 0) {
                    Object.entries(assignmentCalendar).forEach(([dateStr, info]: [string, any]) => {
                      const d = new Date(dateStr);
                      if (info.status === 'completed') completed.push(d);
                      else if (info.status === 'missed') missed.push(d);
                      else if (info.status === 'exam') paused.push(d);
                      else if (info.status === 'scheduled') scheduled.push(d);
                    });
                  } else {
                    // Fallback to user calendar data
                    Object.entries(userData.calendar || {}).forEach(([iso, status]) => {
                      const d = new Date(iso);
                      if (status === 'completed') completed.push(d);
                      if (status === 'missed') missed.push(d);
                      if (status === 'paused') paused.push(d);
                    });
                  }
                  
                  return { completed, missed, paused, scheduled } as any;
                })()}
                modifiersClassNames={{
                  completed: 'relative bg-green-500 text-white hover:bg-green-600 font-semibold rounded-full w-8 h-8 flex items-center justify-center',
                  missed: 'relative bg-red-500 text-white hover:bg-red-600 font-semibold rounded-full w-8 h-8 flex items-center justify-center',
                  paused: 'relative bg-red-500 text-white hover:bg-red-600 font-semibold rounded-full w-8 h-8 flex items-center justify-center',
                  scheduled: 'relative bg-sky-500 text-white hover:bg-sky-600 font-semibold rounded-full w-8 h-8 flex items-center justify-center'
                }}
              />
            </CardContent>
          </Card>

          {/* Streak Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">
                  <span>{enhancedStreak?.currentStreak || dayNumber}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Current streak day
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Current Streak</span>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-orange-500" />
                  {enhancedStreak?.currentStreak ?? userData.streak_count}
                </div>
                {enhancedStreak && !enhancedStreak.isStreakActive && enhancedStreak.streakBreakReason === 'exam_period' && (
                  <Badge variant="secondary" className="text-xs">
                    Paused
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {/* Today's Challenge */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Today's Challenge</CardTitle>
                  <CardDescription>
                    Day {dayNumber} • {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Easy Question */}
                <div className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500 text-white">
                          Easy
                        </Badge>
                        <h3 className="text-lg font-medium">
                          {todayAssignment?.easy_question?.title || 'No question available'}
                        </h3>
                      </div>
                    </div>
                    
                    {todayAssignment?.easy_question?.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {todayAssignment.easy_question.description}
                      </p>
                    )}
                    
                    <Button 
                      variant="default"
                      size="sm"
                      onClick={() => handleSubmission('easy')}
                      disabled={userData.disqualified || !canSubmitToday}
                      className="flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Submit</span>
                    </Button>
                  </div>
                </div>

                {/* Medium Question */}
                <div className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-500 text-white">
                          Medium
                        </Badge>
                        <h3 className="text-lg font-medium">
                          {todayAssignment?.medium_question?.title || 'No question available'}
                        </h3>
                      </div>
                    </div>
                    
                    {todayAssignment?.medium_question?.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {todayAssignment.medium_question.description}
                      </p>
                    )}
                    
                    <Button 
                      variant="default"
                      size="sm"
                      onClick={() => handleSubmission('medium')}
                      disabled={userData.disqualified || !canSubmitToday}
                      className="flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Submit</span>
                    </Button>
                  </div>
                </div>

                {/* Hard Question */}
                <div className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-500 text-white">
                          Hard
                        </Badge>
                        <h3 className="text-lg font-medium">
                          {todayAssignment?.hard_question?.title || 'No question available'}
                        </h3>
                      </div>
                    </div>
                    
                    {todayAssignment?.hard_question?.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {todayAssignment.hard_question.description}
                      </p>
                    )}
                    
                    <Button 
                      variant="default"
                      size="sm"
                      onClick={() => handleSubmission('hard')}
                      disabled={userData.disqualified || !canSubmitToday}
                      className="flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Submit</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code of Choice */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Code of Choice</CardTitle>
              <CardDescription>
                Practice any coding problem of your choice and submit it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-accent text-accent-foreground">
                        Choice
                      </Badge>
                      <h3 className="text-lg font-medium">Your Choice</h3>
                    </div>
                    <Button 
                      variant="default"
                      size="sm"
                      onClick={() => handleSubmission('choice')}
                      disabled={userData.disqualified || !canSubmitToday}
                      className="flex items-center gap-1"
                    >
                      <Book className="w-3.5 h-3.5" />
                      <span>Submit</span>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Submit any coding solution you've worked on today. This could be from LeetCode, 
                    HackerRank, or any other platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ask Modal */}
      {showAskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 shadow-2xl border-2 border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                Ask a Question
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAskModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 h-10 w-10"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-800 block mb-3">
                  Your Question
                </label>
                <textarea 
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg p-4 text-base resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  rows={6}
                  placeholder="Type your question here... Be as specific as possible to get the best help."
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3 text-blue-800">
                  <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Tips for getting better help:</p>
                    <ul className="text-blue-700 space-y-1 text-xs">
                      <li>• Be specific about what you're struggling with</li>
                      <li>• Include any error messages you're seeing</li>
                      <li>• Mention which programming language or topic</li>
                      <li>• Your question will be sent to instructors and teaching assistants</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3 text-yellow-800">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">⚠️ Important Warning:</p>
                    <p className="text-yellow-700 text-xs">
                      Please ask relevant questions related to coding, assignments, or course material only. 
                      Inappropriate or irrelevant questions may result in a temporary ban from the platform.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <Button 
                  onClick={() => setShowAskModal(false)}
                  variant="outline"
                  className="flex-1 py-3 text-base border-2 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    if (!questionText.trim()) {
                      toast({
                        title: "Question Required",
                        description: "Please enter your question before submitting.",
                        variant: "destructive"
                      });
                      return;
                    }

                    if (!currentUser || !userData) {
                      toast({
                        title: "Error",
                        description: "Please log in to submit questions.",
                        variant: "destructive"
                      });
                      return;
                    }

                    try {
                      await qaService.submitQuestion({
                        student_uid: currentUser.uid,
                        student_name: userData.name,
                        student_email: userData.email,
                        student_course: userData.course,
                        student_section: userData.section,
                        student_semester: userData.semester,
                        question_text: questionText,
                        category: 'general'
                      });

                      toast({
                        title: "Question Submitted Successfully!",
                        description: "Your question has been sent to the instructors. You'll get a response soon."
                      });
                      
                      setQuestionText('');
                      setShowAskModal(false);
                    } catch (error) {
                      toast({
                        title: "Submission Failed",
                        description: "Failed to submit your question. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="flex-1 py-3 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Send className="w-5 h-5" />
                  Submit Question
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {showSubmissionModal && selectedQuestion && (
        <SubmissionModal 
          question={selectedQuestion}
          onClose={() => setShowSubmissionModal(false)}
          onSubmit={handleSubmitAnswer}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
