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
  TrendingUp, 
  Code, 
  Github, 
  ExternalLink,
  User,
  Settings,
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
  const [examSettings, setExamSettings] = useState<any>(null);
  const [isCurrentlyInExam, setIsCurrentlyInExam] = useState(false);
  const [selectedDateAssignment, setSelectedDateAssignment] = useState<ScheduledAssignment | null>(null);
  
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

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Challenge timing helpers - Calculate based on user registration date
  const getUserDayNumber = () => {
    if (!userData?.created_at) return 1;
    
    const registrationDate = new Date(userData.created_at);
    const today = new Date();
    const daysElapsed = Math.max(0, Math.floor((today.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)));
    return Math.min(45, daysElapsed + 1);
  };
  
  const dayNumber = getUserDayNumber();

  // Exam cooldown state
  const [isExamCooldown, setIsExamCooldown] = useState(false);
  const [programExamCooldown, setProgramExamCooldown] = useState<ProgramExamCooldown | null>(null);
  const [daysSinceExamEnded, setDaysSinceExamEnded] = useState(0);

  // Load today's assignment and submission status using enhanced scheduling
  useEffect(() => {
    const loadTodayData = async () => {
      if (!currentUser) return;
      
      try {
        // Get exam settings first
        const examData = await examCooldownService.getExamCooldown();
        console.log('Exam settings loaded:', examData);
        setExamSettings(examData);
        
        // Check for program-specific exam cooldown if user data is available
        let studentExamCooldown = null;
        if (userData) {
          studentExamCooldown = await examCooldownService.getExamCooldownForStudent(
            userData.course,
            userData.semester,
            userData.section
          );
          console.log('Student-specific exam cooldown:', studentExamCooldown);
          setProgramExamCooldown(studentExamCooldown);
        }
        
        // Check if currently in exam period (either global or program-specific)
        const isInGlobalExamPeriod = examData ? examCooldownService.isExamPeriod(examData) : false;
        const isInProgramExamPeriod = studentExamCooldown ? examCooldownService.isStudentInExamPeriod(studentExamCooldown) : false;
        const isInExamPeriod = isInGlobalExamPeriod || isInProgramExamPeriod;
        
        console.log('Currently in global exam period:', isInGlobalExamPeriod);
        console.log('Currently in program exam period:', isInProgramExamPeriod);
        console.log('Overall in exam period:', isInExamPeriod);
        
        setIsCurrentlyInExam(isInExamPeriod);
        
        // Calculate days since exam ended for streak continuation
        if (studentExamCooldown) {
          const daysSince = examCooldownService.getDaysSinceExamEnded(studentExamCooldown);
          setDaysSinceExamEnded(daysSince);
          console.log('Days since program exam ended:', daysSince);
        }
        
        // Get today's assignment using schedule service (with student-specific logic)
        const todaysAssignment = await scheduleService.getTodaysAssignment(currentUser.uid);
        console.log('Enhanced today\'s assignment:', todaysAssignment);
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
          
          // Check if this date has a scheduled assignment
          const visibleAssignments = await scheduleService.getVisibleAssignments();
          const dateAssignment = visibleAssignments.find(
            assignment => assignment.date === selectedDateStr
          );
          
          console.log('Selected date assignment loaded:', dateAssignment);
          setSelectedDateAssignment(dateAssignment || null);
        } catch (error) {
          console.error('Error loading selected date assignment:', error);
          setSelectedDateAssignment(null);
        }
      };

      loadSelectedDateAssignment();
    }
  }, [selectedDate]);

  const getDateStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const daySubmissions = submissions.filter(sub => 
      sub.submittedAt.toISOString().split('T')[0] === dateStr
    );
    
    if (daySubmissions.length === 0) return 'not-submitted';
    
    const hasApproved = daySubmissions.some(sub => sub.adminReview?.status === 'approved');
    const hasPending = daySubmissions.some(sub => sub.adminReview?.status === 'pending');
    const hasRejected = daySubmissions.some(sub => 
      sub.adminReview?.status === 'rejected' && 
      !daySubmissions.some(laterSub => 
        laterSub.submittedAt > sub.submittedAt && 
        laterSub.adminReview?.status === 'approved'
      )
    );
    
    if (hasApproved) return 'completed';
    if (hasPending) return 'pending';
    if (hasRejected) return 'rejected';
    return 'not-submitted';
  };

  const getTodaySubmissionStatus = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySubmissions = submissions.filter(sub => 
      sub.submittedAt.toISOString().split('T')[0] === today
    );
    
    if (todaySubmissions.length === 0) return 'none';
    
    const latestSubmission = todaySubmissions.sort((a, b) => 
      b.submittedAt.getTime() - a.submittedAt.getTime()
    )[0];
    
    return latestSubmission.adminReview?.status || 'pending';
  };

  const canSubmitTodayCheck = () => {
    return canSubmitToday;
  };

  const getSubmissionMessage = () => {
    if (!canSubmitToday) {
      switch (submitReason) {
        case 'exam_period':
          return 'Submissions are paused during exam period';
        case 'no_assignment_scheduled':
          return 'No assignment scheduled for today';
        case 'already_completed':
          return 'You have already completed today\'s submission';
        default:
          return 'Cannot submit today';
      }
    }
    return '';
  };

  // Track if today's submission is done
  const isSubmissionDone = getTodaySubmissionStatus() === 'approved';

  const handleSubmission = async (difficulty: string) => {
    if (!canSubmitTodayCheck()) {
      toast({
        title: "Cannot Submit",
        description: getSubmissionMessage(),
        variant: "destructive",
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
        variant: 'destructive',
        title: 'Submission Error',
        description: 'Failed to start submission. Please try again.'
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
      
      // Submit the answer with enhanced submission data
      await submitAnswer(
        currentUser.uid,
        assignmentId,
        answer, // Pass answer as-is, the service will handle the structure
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

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "See you tomorrow for your next coding challenge!"
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check for day change and reset daily states
  useEffect(() => {
    const checkForNewDay = () => {
      if (!userData?.last_submission) return;
      
      const now = new Date();
      const lastSubmission = new Date(userData.last_submission);
      
      // Check if it's a new day
      const isNewDay = (
        now.getDate() !== lastSubmission.getDate() ||
        now.getMonth() !== lastSubmission.getMonth() ||
        now.getFullYear() !== lastSubmission.getFullYear()
      );
      
      if (isNewDay) {
        // Here you would typically update the user's streak and other daily states
        // For now, we'll just log it since the actual state update would be handled by your backend
        console.log('New day detected - resetting daily states');
      }
    };

    // Calculate time until midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    // Set initial check
    checkForNewDay();

    // Set timeout for next midnight
    const timeoutId = setTimeout(() => {
      checkForNewDay();
      // Set interval to check every 24 hours after the first timeout
      setInterval(checkForNewDay, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    // Cleanup
    return () => clearTimeout(timeoutId);
  }, [userData?.last_submission]);

  if (!userData) return null;

  // Check if student is banned
  if (userData.isBanned) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-lg mx-auto p-8">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">Account Banned</CardTitle>
              <CardDescription className="text-red-700">
                Your account has been suspended by the administrator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-2">Reason for ban:</p>
                <p className="text-sm text-red-700">
                  {userData.banReason || 'No specific reason provided.'}
                </p>
              </div>
              {userData.bannedAt && (
                <p className="text-xs text-red-600 text-center">
                  Banned on: {new Date(userData.bannedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
              <div className="text-center pt-4">
                <p className="text-sm text-red-600 mb-4">
                  If you believe this is a mistake, please contact the administrator.
                </p>
                <Button 
                  variant="outline" 
                  onClick={logout}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-primary">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-heading font-bold">45 Days Of Code</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Streak Badge - Use enhanced streak if available */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium">
                <Zap className="w-4 h-4" />
                <span>{enhancedStreak?.currentStreak ?? userData.streak_count} Day Streak</span>
                {enhancedStreak && !enhancedStreak.isStreakActive && enhancedStreak.streakBreakReason === 'exam_period' && (
                  <span className="text-xs opacity-80">(Paused)</span>
                )}
              </div>

              {/* GitHub Repo */}
              {userData.github_repo_link && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(userData.github_repo_link, '_blank')}
                  className="bg-white hover:bg-gray-100 text-black border-gray-300"
                >
                  <Github className="w-4 h-4 text-black" />
                  <span className="hidden sm:inline text-black">GitHub</span>
                </Button>
              )}

              {/* Notification Bell */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500 hover:border-yellow-600"
                >
                  <Bell className="w-4 h-4 text-black" />
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
                  )}
                </Button>
                
                {showNotificationPanel && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border z-50">
                    <div className="p-3 border-b">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Notifications</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setHasUnread(false)}
                        >
                          Mark all as read
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="p-3 text-sm text-muted-foreground">
                        No new notifications
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Ask Question Button */}
              <Button 
                onClick={() => setShowAskModal(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 flex items-center gap-1"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Ask</span>
              </Button>
              
              {/* Profile Button */}
              <Button variant="violet" size="sm" onClick={() => window.location.assign('/profile')} className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Exam Cooldown Banner - Dynamic message from admin */}
      {isCurrentlyInExam && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="container mx-auto flex items-center justify-center gap-2">
            <span className="text-lg">📚</span>
            <span className="font-medium">
              {programExamCooldown?.active && examCooldownService.isStudentInExamPeriod(programExamCooldown)
                ? programExamCooldown.message
                : examSettings?.message || "Exam period is currently active. Submissions are paused."}
            </span>
            {programExamCooldown?.active && examCooldownService.isStudentInExamPeriod(programExamCooldown) && (
              <Badge variant="secondary" className="ml-2">
                {programExamCooldown.program} - Sem {programExamCooldown.semester}
                {programExamCooldown.section && ` - Sec ${programExamCooldown.section}`}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Streak Continuation Banner - When exam just ended */}
      {daysSinceExamEnded > 0 && daysSinceExamEnded <= 3 && !isCurrentlyInExam && (
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4">
          <div className="container mx-auto flex items-center justify-center gap-2">
            <span className="text-lg">🎯</span>
            <span className="font-medium">
              Welcome back! Your exam period ended {daysSinceExamEnded} day{daysSinceExamEnded > 1 ? 's' : ''} ago. 
              Your streak is protected and continues from where you left off.
            </span>
            <Badge variant="secondary" className="ml-2">
              Streak Protected
            </Badge>
          </div>
        </div>
      )}

      {/* Warning Banners */}
      {userData.streak_breaks > 0 && userData.streak_breaks < 3 && (
        <div className="bg-warning text-warning-foreground p-4">
          <div className="container mx-auto flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">
              ⚠️ Streak broken — this is warning {userData.streak_breaks} of 3. Three breaks = disqualification.
            </span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Greeting and Tags */}
        <div className="space-y-4">
          <h1 className="text-3xl font-heading font-bold">{getGreeting()}, {userData.name.split(' ')[0]}! 👋</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-blue-50 text-blue-800 hover:bg-blue-50 border border-blue-100">
              <User className="w-3 h-3 mr-1" />
              {userData.enrollment_no || 'N/A'}
            </Badge>
            <Badge variant="secondary" className="bg-green-50 text-green-800 hover:bg-green-50 border border-green-100">
              <GraduationCap className="w-3 h-3 mr-1" />
              {userData.course || 'N/A'}
            </Badge>
            <Badge variant="secondary" className="bg-purple-50 text-purple-800 hover:bg-purple-50 border border-purple-100">
              <Book className="w-3 h-3 mr-1" />
              Sem {userData.semester || 'N/A'} - {userData.section || 'N/A'}
            </Badge>
            <Badge variant="secondary" className="bg-amber-50 text-amber-800 hover:bg-amber-50 border border-amber-100">
              <CalendarIcon className="w-3 h-3 mr-1" />
              Day {dayNumber} of 45
            </Badge>
          </div>
        </div>

        {/* Stats Row with enhanced information */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              <span>Day</span>
            </div>
            <div className="text-xl font-bold flex items-center gap-1">
              <span>{enhancedStreak?.currentStreak || dayNumber}</span>
              <span className="text-muted-foreground text-sm">/45</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Current streak day
            </div>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Current Streak</span>
            </div>
            <div className="text-xl font-bold text-success flex items-center">
              <Zap className="w-4 h-4 mr-1" />
              {enhancedStreak?.currentStreak ?? userData.streak_count}
              {enhancedStreak && !enhancedStreak.isStreakActive && enhancedStreak.streakBreakReason === 'exam_period' && (
                <span className="text-xs text-muted-foreground ml-1">(Paused)</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Consecutive days
            </div>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Streak Breaks</span>
            </div>
            <div className={`text-xl font-bold flex items-center ${
              userData.streak_breaks >= 3 ? 'text-destructive' : 
              userData.streak_breaks > 0 ? 'text-amber-500' : 'text-green-500'
            }`}>
              <AlertTriangle className="w-4 h-4 mr-1" />
              {userData.streak_breaks}/3
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {userData.streak_breaks >= 3 ? 'Disqualified' : 
               userData.streak_breaks === 2 ? 'Final warning' :
               userData.streak_breaks === 1 ? 'Warning' : 'Safe'}
            </div>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span>Total Attempts</span>
            </div>
            <div className="text-xl font-bold flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
              {(userData.attempts?.easy || 0) + (userData.attempts?.medium || 0) + (userData.attempts?.hard || 0) + (userData.attempts?.choice || 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              All levels combined
            </div>
          </div>
        </div>

        {/* Disqualification Notice */}
        {userData.streak_breaks >= 3 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold text-lg">You are disqualified</h3>
                <p className="text-destructive/80 mt-1">
                  Better luck next time. You've exceeded the maximum allowed streak breaks (3/3).
                </p>
                <p className="text-sm text-destructive/70 mt-2">
                  Contact the administrator if you believe this is an error.
                </p>
              </div>
            </div>
          </div>
        )}

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

            {/* Code of Choice */}
            <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex flex-col space-y-3">
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
                    disabled={userData.disqualified}
                    className="flex items-center gap-1"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Submit</span>
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Submit solutions for any coding problem of your choice
                </p>
                
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="text-xs">
                    Custom Problem
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">

            <div className="space-y-4">
              <div className="border-b pb-2 mb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold">Today's Challenges</h2>
                  <p className="text-muted-foreground">Complete any of these challenges to maintain your streak.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    if (!currentUser) return;
                    
                    console.log('Refreshing enhanced assignment data...');
                    
                    // Refresh exam settings
                    const examData = await examCooldownService.getExamCooldown();
                    const isInExamPeriod = examData ? examCooldownService.isExamPeriod(examData) : false;
                    setExamSettings(examData);
                    setIsCurrentlyInExam(isInExamPeriod);
                    
                    // Refresh all enhanced data
                    const todaysAssignment = await scheduleService.getTodaysAssignment();
                    const submitCheck = await scheduleService.canSubmitToday(currentUser.uid);
                    const streakData = await scheduleService.calculateEnhancedStreak(currentUser.uid);
                    const calendar = await scheduleService.getAssignmentCalendar(currentUser.uid);
                    
                    setTodayAssignment(todaysAssignment);
                    setCanSubmitToday(submitCheck.canSubmit);
                    setSubmitReason(submitCheck.reason || '');
                    setEnhancedStreak(streakData);
                    setAssignmentCalendar(calendar);
                    
                    console.log('Enhanced data refreshed:', {
                      examData,
                      isInExamPeriod,
                      todaysAssignment,
                      submitCheck,
                      streakData,
                      calendar
                    });
                    
                    toast({
                      title: "Refreshed",
                      description: "Assignment data has been refreshed with enhanced scheduling"
                    });
                  }}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
              
              {assignmentsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Loading today's assignments...
                  </div>
                </div>
              ) : isCurrentlyInExam ? (
                // Show exam period message
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 text-blue-800">
                    <GraduationCap className="w-6 h-6" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        {programExamCooldown?.active && examCooldownService.isStudentInExamPeriod(programExamCooldown)
                          ? `${programExamCooldown.program} Exam Period Active`
                          : 'Exam Period Active'}
                      </h3>
                      <p className="text-blue-700 mt-1">
                        {programExamCooldown?.active && examCooldownService.isStudentInExamPeriod(programExamCooldown)
                          ? programExamCooldown.message
                          : examSettings?.message || "Exam period is currently active. Submissions are paused."}
                      </p>
                      {(() => {
                        const activeExam = programExamCooldown?.active && examCooldownService.isStudentInExamPeriod(programExamCooldown)
                          ? programExamCooldown
                          : examSettings;
                        
                        if (activeExam?.start_date && activeExam?.end_date) {
                          return (
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-blue-600">
                                Period: {new Date(activeExam.start_date).toLocaleDateString()} - {new Date(activeExam.end_date).toLocaleDateString()}
                              </p>
                              {programExamCooldown?.active && examCooldownService.isStudentInExamPeriod(programExamCooldown) && (
                                <p className="text-sm text-blue-600">
                                  Program: {programExamCooldown.program} - Semester {programExamCooldown.semester}
                                  {programExamCooldown.section && ` - Section ${programExamCooldown.section}`}
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              ) : todayAssignment && todayAssignment.isActive ? (
                <>
                  {/* Easy Question */}
                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">
                            Easy
                          </Badge>
                          <h3 className="text-lg font-medium">{todayAssignment.easy_question.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(todayAssignment.easy_question.link, '_blank')}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Problem</span>
                          </Button>
                          <Button 
                            variant="default"
                            size="sm"
                            onClick={() => handleSubmission('easy')}
                            disabled={userData.disqualified || !canSubmitTodayCheck()}
                            className="flex items-center gap-1"
                          >
                            <Code className="w-3.5 h-3.5" />
                            <span>{getTodaySubmissionStatus() === 'approved' ? 'Completed' : 'Solve'}</span>
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {todayAssignment.easy_question.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        {todayAssignment.easy_question.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Medium Question */}
                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                            Medium
                          </Badge>
                          <h3 className="text-lg font-medium">{todayAssignment.medium_question.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(todayAssignment.medium_question.link, '_blank')}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Problem</span>
                          </Button>
                          <Button 
                            variant="default"
                            size="sm"
                            onClick={() => handleSubmission('medium')}
                            disabled={userData.disqualified || !canSubmitTodayCheck()}
                            className="flex items-center gap-1"
                          >
                            <Code className="w-3.5 h-3.5" />
                            <span>{getTodaySubmissionStatus() === 'approved' ? 'Completed' : 'Solve'}</span>
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {todayAssignment.medium_question.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        {todayAssignment.medium_question.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Hard Question */}
                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-500 hover:bg-red-600 text-white">
                            Hard
                          </Badge>
                          <h3 className="text-lg font-medium">{todayAssignment.hard_question.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(todayAssignment.hard_question.link, '_blank')}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Problem</span>
                          </Button>
                          <Button 
                            variant="default"
                            size="sm"
                            onClick={() => handleSubmission('hard')}
                            disabled={userData.disqualified || !canSubmitTodayCheck()}
                            className="flex items-center gap-1"
                          >
                            <Code className="w-3.5 h-3.5" />
                            <span>{getTodaySubmissionStatus() === 'approved' ? 'Completed' : 'Solve'}</span>
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {todayAssignment.hard_question.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        {todayAssignment.hard_question.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* No Assignment Notice */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 text-gray-800">
                      <Calendar className="w-6 h-6" />
                      <div>
                        <h3 className="font-semibold text-lg">No Assignment for Today</h3>
                        <p className="text-gray-700 mt-1">
                          No questions have been assigned for today ({new Date().toLocaleDateString()}). 
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Please check back later or contact your instructor if you believe this is an error.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {userData.disqualified && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">
                      ❌ You have been disqualified from the 45 Days Of Code challenge due to 3 missed days. Contact admin to appeal.
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
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
                </div>              <div className="flex gap-4 pt-2">
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
