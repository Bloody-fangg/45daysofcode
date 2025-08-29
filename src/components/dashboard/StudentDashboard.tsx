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
  type Assignment,
  type Notification
} from '../../lib/firebase/index';
import { 
  Flame, 
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
  RefreshCw
} from 'lucide-react';
import { format, startOfDay, addDays, isWithinInterval, differenceInMilliseconds, addMilliseconds } from 'date-fns';
import SubmissionModal from './SubmissionModal';
import NotificationBell from './NotificationBell';

const StudentDashboard = () => {
  const { currentUser, userData, logout, setUserData } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('easy');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  
  // Firebase hooks
  const { submissions, submitAnswer, loading: submissionsLoading } = useSubmissions();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const { notifications } = useNotifications();

  // State for current question
  const [todayAssignment, setTodayAssignment] = useState<Assignment | null>(null);
  const [selectedDateAssignment, setSelectedDateAssignment] = useState<Assignment | null>(null);
  
  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Challenge timing helpers
  const challengeStartDate = new Date('2024-12-01'); // Replace with actual start date
  const today = new Date();
  const daysElapsed = Math.max(0, Math.floor((today.getTime() - challengeStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  const dayNumber = Math.min(45, daysElapsed + 1);

  // Exam cooldown state
  const [isExamCooldown, setIsExamCooldown] = useState(false);

  // Load today's assignment
  useEffect(() => {
    const loadTodayAssignment = async () => {
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        console.log('Loading assignment for date:', todayStr);
        
        const assignment = await assignmentsService.getAssignment(todayStr);
        console.log('Assignment loaded:', assignment);
        setTodayAssignment(assignment);
      } catch (error) {
        console.error('Error loading today\'s assignment:', error);
      }
    };

    loadTodayAssignment();
  }, []);

  // Load assignment for selected date
  useEffect(() => {
    if (selectedDate) {
      const loadSelectedDateAssignment = async () => {
        try {
          const selectedDateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          console.log('Loading assignment for selected date:', selectedDateStr);
          
          const assignment = await assignmentsService.getAssignment(selectedDateStr);
          console.log('Selected date assignment loaded:', assignment);
          setSelectedDateAssignment(assignment);
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

  const canSubmitToday = () => {
    const status = getTodaySubmissionStatus();
    return status === 'none' || status === 'rejected';
  };

  // Track if today's submission is done
  const isSubmissionDone = getTodaySubmissionStatus() === 'approved';

  const handleSubmission = async (difficulty: string) => {
    if (!canSubmitToday()) {
      toast({
        title: "Cannot Submit",
        description: "You have already completed today's submission.",
        variant: "destructive",
      });
      return;
    }

    try {
      // If we have today's assignment, use it
      if (todayAssignment) {
        const question = todayAssignment[`${difficulty}_question` as keyof Assignment] as any;
        setSelectedQuestion({ ...question, difficulty });
        setShowSubmissionModal(true);
      } else {
        // Use demo questions when no assignment is available
        const demoQuestions = {
          easy: {
            title: "Two Sum",
            description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
            link: "https://leetcode.com/problems/two-sum/",
            tags: ["Array", "Hash Table"],
            difficulty: "easy"
          },
          medium: {
            title: "Add Two Numbers", 
            description: "You are given two non-empty linked lists representing two non-negative integers stored in reverse order.",
            link: "https://leetcode.com/problems/add-two-numbers/",
            tags: ["Linked List", "Math", "Recursion"],
            difficulty: "medium"
          },
          hard: {
            title: "Median of Two Sorted Arrays",
            description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
            link: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
            tags: ["Array", "Binary Search", "Divide and Conquer"],
            difficulty: "hard"
          },
          choice: {
            title: "Your Choice Problem",
            description: "Submit solutions for any coding problem of your choice",
            link: "",
            tags: ["Custom Problem"],
            difficulty: "choice"
          }
        };
        
        const question = demoQuestions[difficulty as keyof typeof demoQuestions];
        setSelectedQuestion({ ...question, difficulty });
        setShowSubmissionModal(true);
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
    if (!currentUser) return;

    try {
      const assignmentId = todayAssignment?.id || `demo-${new Date().toISOString().split('T')[0]}`;
      
      await submitAnswer(
        currentUser.uid,
        assignmentId,
        answer,
        new Date()
      );
      
      toast({
        title: "Success",
        description: "Your solution has been submitted for review!",
      });
      
      setShowSubmissionModal(false);
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
              {/* Streak Badge */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium">
                <Flame className="w-4 h-4" />
                <span>{userData.streak_count} Day Streak</span>
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
              
              {/* Profile Button */}
              <Button variant="violet" size="sm" onClick={() => window.location.assign('/profile')} className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Exam Cooldown Banner */}
      {isExamCooldown && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="container mx-auto flex items-center justify-center gap-2">
            <span className="text-lg">📚</span>
            <span className="font-medium">All The Best For Your Exams! Your streak is paused during this period.</span>
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

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              <span>Day</span>
            </div>
            <div className="text-xl font-bold flex items-center gap-1">
              <span>{dayNumber}</span>
              <span className="text-muted-foreground text-sm">/45</span>
            </div>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500" />
              <span>Current Streak</span>
            </div>
            <div className="text-xl font-bold text-success flex items-center">
              <Flame className="w-4 h-4 mr-1" />
              {userData.streak_count}
            </div>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Streak Breaks</span>
            </div>
            <div className={`text-xl font-bold flex items-center ${userData.streak_breaks ? 'text-destructive' : 'text-amber-500'}`}>
              <AlertTriangle className="w-4 h-4 mr-1" />
              {userData.streak_breaks}/3
            </div>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span>Total Attempts</span>
            </div>
            <div className="text-xl font-bold flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
              {userData.attempts.easy + userData.attempts.medium + userData.attempts.hard + userData.attempts.choice}
            </div>
          </div>
        </div>

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
                    Object.entries(userData.calendar || {}).forEach(([iso, status]) => {
                      const d = new Date(iso);
                      if (status === 'completed') completed.push(d);
                      if (status === 'missed') missed.push(d);
                      if (status === 'paused') paused.push(d);
                    });
                    return { completed, missed, paused } as any;
                  })()}
                  modifiersClassNames={{
                    completed: 'bg-green-500 text-white hover:bg-green-600 font-semibold',
                    missed: 'bg-red-500 text-white hover:bg-red-600 font-semibold',
                    paused: 'bg-pink-500 text-white hover:bg-pink-600 font-semibold'
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
                    const today = new Date();
                    const todayStr = today.toISOString().split('T')[0];
                    console.log('Refreshing assignment for date:', todayStr);
                    const assignment = await assignmentsService.getAssignment(todayStr);
                    console.log('Refreshed assignment:', assignment);
                    setTodayAssignment(assignment);
                    toast({
                      title: "Refreshed",
                      description: "Assignment data has been refreshed"
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
              ) : todayAssignment ? (
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
                            disabled={userData.disqualified || !canSubmitToday()}
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
                            disabled={userData.disqualified || !canSubmitToday()}
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
                            disabled={userData.disqualified || !canSubmitToday()}
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
                  {/* Demo Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Info className="w-4 h-4" />
                      <span className="font-medium">Demo Questions</span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      No assignment found for today ({new Date().toISOString().split('T')[0]}). Showing demo questions. Contact your admin to create today's assignment.
                    </p>
                  </div>

                  {/* Demo Assignment for Day 1 */}
                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">
                            Easy
                          </Badge>
                          <h3 className="text-lg font-medium">Two Sum</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open('https://leetcode.com/problems/two-sum/', '_blank')}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Problem</span>
                          </Button>
                          <Button 
                            variant="default"
                            size="sm"
                            onClick={() => handleSubmission('easy')}
                            disabled={userData.disqualified || !canSubmitToday()}
                            className="flex items-center gap-1"
                          >
                            <Code className="w-3.5 h-3.5" />
                            <span>{getTodaySubmissionStatus() === 'approved' ? 'Completed' : 'Solve'}</span>
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
                      </p>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="outline" className="text-xs">Array</Badge>
                        <Badge variant="outline" className="text-xs">Hash Table</Badge>
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
                          <h3 className="text-lg font-medium">Add Two Numbers</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open('https://leetcode.com/problems/add-two-numbers/', '_blank')}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Problem</span>
                          </Button>
                          <Button 
                            variant="default"
                            size="sm"
                            onClick={() => handleSubmission('medium')}
                            disabled={userData.disqualified || !canSubmitToday()}
                            className="flex items-center gap-1"
                          >
                            <Code className="w-3.5 h-3.5" />
                            <span>{getTodaySubmissionStatus() === 'approved' ? 'Completed' : 'Solve'}</span>
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        You are given two non-empty linked lists representing two non-negative integers stored in reverse order.
                      </p>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="outline" className="text-xs">Linked List</Badge>
                        <Badge variant="outline" className="text-xs">Math</Badge>
                        <Badge variant="outline" className="text-xs">Recursion</Badge>
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
                          <h3 className="text-lg font-medium">Median of Two Sorted Arrays</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open('https://leetcode.com/problems/median-of-two-sorted-arrays/', '_blank')}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Problem</span>
                          </Button>
                          <Button 
                            variant="default"
                            size="sm"
                            onClick={() => handleSubmission('hard')}
                            disabled={userData.disqualified || !canSubmitToday()}
                            className="flex items-center gap-1"
                          >
                            <Code className="w-3.5 h-3.5" />
                            <span>{getTodaySubmissionStatus() === 'approved' ? 'Completed' : 'Solve'}</span>
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.
                      </p>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="outline" className="text-xs">Array</Badge>
                        <Badge variant="outline" className="text-xs">Binary Search</Badge>
                        <Badge variant="outline" className="text-xs">Divide and Conquer</Badge>
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