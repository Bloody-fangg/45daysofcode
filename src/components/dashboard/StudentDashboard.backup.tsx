import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserData } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useSubmissions } from '../../hooks/useFirebase';
import { 
  Flame, 
  TrendingUp, 
  Target, 
  Trophy, 
  Calendar as CalendarIcon,
  Bell,
  User,
  LogOut,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  Code,
  Github,
  ExternalLink,
  MessageSquare,
  Award,
  Search,
  Play,
  Settings,
  CheckCircle2,
  GraduationCap,
  Book
} from 'lucide-react';
import SubmissionModal from './SubmissionModal';
import NotificationBell from './NotificationBell';

// Mock data for questions
const mockQuestions = {
  easy: {
    title: "Two Sum",
    description: "Find two numbers that add up to a specific target in an array",
    link: "https://leetcode.com/problems/two-sum/",
    tags: ["Array", "Hash Table"]
  },
  medium: {
    title: "Longest Substring Without Repeating Characters", 
    description: "Find the length of the longest substring without repeating characters",
    link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    tags: ["String", "Sliding Window"]
  },
  hard: {
    title: "Median of Two Sorted Arrays",
    description: "Find the median of two sorted arrays in O(log(min(m,n))) time",
    link: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
    tags: ["Array", "Binary Search"]
  },
  choice: {
    title: "Your Choice Problem",
    description: "Submit any coding problem solution of your choice from any platform",
    link: "",
    tags: ["Free Choice", "Any Platform"]
  }
};

const StudentDashboard = () => {
  const { currentUser, userData, logout, setUserData } = useAuth();
  const { toast } = useToast();
  const { submitSolution } = useSubmissions();
  const [selectedTab, setSelectedTab] = useState('easy');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  
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
  
  // Track if today's submission is done
  const [isSubmissionDone, setIsSubmissionDone] = useState(() => {
    if (!userData?.last_submission) return false;
    const lastSubmission = new Date(userData.last_submission);
    const today = new Date();
    return (
      lastSubmission.getDate() === today.getDate() &&
      lastSubmission.getMonth() === today.getMonth() &&
      lastSubmission.getFullYear() === today.getFullYear()
    );
  });

  const handleSubmission = async (difficulty: string) => {
    try {
      const question = mockQuestions[difficulty as keyof typeof mockQuestions];
      setSelectedQuestion({ ...question, difficulty });
      setShowSubmissionModal(true);
      
      // Update submission status for the current day
      const now = new Date();
      const today = new Date();
      const isToday = (
        now.getDate() === today.getDate() &&
        now.getMonth() === today.getMonth() &&
        now.getFullYear() === today.getFullYear()
      );
      
      if (isToday) {
        setIsSubmissionDone(true);
        
        // Update last_submission in the database
        // In a real app, you would call an API endpoint to update this
        console.log('Updating last_submission to:', now.toISOString());
        
        // If you're using Firebase, it would look something like this:
        // await updateDoc(doc(db, 'users', user.uid), {
        //   last_submission: now.toISOString(),
        //   [`attempts.${difficulty}`]: (userData?.attempts[difficulty as keyof typeof userData.attempts] || 0) + 1,
        //   updated_at: new Date().toISOString()
        // });
        
        // For now, we'll just update the local state
        if (userData) {
          setUserData({
            ...userData,
            last_submission: now.toISOString(),
            attempts: {
              ...userData.attempts,
              [difficulty]: (userData.attempts[difficulty as keyof typeof userData.attempts] || 0) + 1
            }
          });
        }
      }
    } catch (error) {
      console.error('Error handling submission:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: 'Failed to record your submission. Please try again.'
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

  // Handle actual code submission
  const handleCodeSubmission = async (code: string) => {
    if (!userData || !selectedQuestion) return;

    try {
      const submissionData = {
        student_uid: userData.uid,
        student_name: userData.name,
        student_email: userData.email,
        question_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        difficulty: selectedQuestion.difficulty as 'easy' | 'medium' | 'hard' | 'choice',
        question_title: selectedQuestion.title,
        code_text: code,
        github_file_link: '', // You can prompt user for this if needed
        external_problem_link: selectedQuestion.link || ''
      };

      await submitSolution(submissionData);
      
      toast({
        title: "✅ Submission successful!",
        description: "Your code has been submitted and your streak has been maintained. Great job!"
      });

      setShowSubmissionModal(false);
    } catch (error) {
      console.error('Error submitting code:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Failed to submit your code. Please try again.'
      });
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'hard': return 'bg-destructive text-destructive-foreground';
      case 'choice': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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
              <div className="border-b pb-2 mb-4">
                <h2 className="text-2xl font-semibold">Today's Challenges</h2>
                <p className="text-muted-foreground">Complete any of these challenges to maintain your streak.</p>
              </div>
              
              {Object.entries(mockQuestions).map(([difficulty, question]) => (
                <div key={difficulty} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(difficulty)}>
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </Badge>
                        <h3 className="text-lg font-medium">{question.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(question.link, '_blank')}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Problem</span>
                        </Button>
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => handleSubmission(difficulty)}
                          disabled={userData.disqualified}
                          className="flex items-center gap-1"
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span>Solve</span>
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {question.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      {question.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
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
          onSubmit={handleCodeSubmission}
        />
      )}
    </div>
  );
};

export default StudentDashboard;