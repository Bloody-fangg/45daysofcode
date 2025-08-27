import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { 
  Flame, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Code, 
  Github, 
  ExternalLink,
  User,
  Settings,
  LogOut,
  Trophy,
  Target,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { format, startOfDay, addDays, isWithinInterval } from 'date-fns';
import SubmissionModal from './SubmissionModal';

// Mock data for questions - replace with Firebase data
const mockQuestions = {
  easy: {
    title: "Two Sum Problem",
    description: "Find two numbers in an array that sum to a target value",
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
    description: "Pick any problem you want to solve today and submit your solution",
    link: "",
    tags: ["Any Topic"]
  }
};

const StudentDashboard = () => {
  const { userData, logout } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('easy');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  // Calculate challenge progress
  const challengeStartDate = new Date('2024-12-01'); // Replace with actual start date
  const challengeEndDate = addDays(challengeStartDate, 45);
  const today = new Date();
  const daysElapsed = Math.max(0, Math.floor((today.getTime() - challengeStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercentage = Math.min(100, (daysElapsed / 45) * 100);

  // Mock exam cooldown state
  const [isExamCooldown, setIsExamCooldown] = useState(false);

  const handleSubmission = (difficulty: string) => {
    const question = mockQuestions[difficulty as keyof typeof mockQuestions];
    setSelectedQuestion({ ...question, difficulty });
    setShowSubmissionModal(true);
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
                <div>
                  <h1 className="text-xl font-heading font-bold">45 Days Of Code</h1>
                  <p className="text-sm text-muted-foreground">Welcome back, {userData.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Streak Badge */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium">
                <Flame className="w-4 h-4" />
                <span>{userData.streak_count} Day Streak</span>
              </div>

              {/* GitHub Repo */}
              {userData.github_repo_link && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(userData.github_repo_link, '_blank')}
                >
                  <Github className="w-4 h-4" />
                </Button>
              )}

              {/* Profile Menu */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Challenge Progress</span>
              <span className="text-sm text-muted-foreground">{daysElapsed}/45 days</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
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

      <div className="container mx-auto px-4 py-6">
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
                />
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-success">{userData.attempts.easy}</div>
                    <div className="text-xs text-muted-foreground">Easy</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-warning">{userData.attempts.medium}</div>
                    <div className="text-xs text-muted-foreground">Medium</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-destructive">{userData.attempts.hard}</div>
                    <div className="text-xs text-muted-foreground">Hard</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-accent">{userData.attempts.choice}</div>
                    <div className="text-xs text-muted-foreground">Choice</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Streak Breaks</span>
                    <Badge variant={userData.streak_breaks === 0 ? "default" : "destructive"}>
                      {userData.streak_breaks}/3
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <Badge variant={userData.disqualified ? "destructive" : "default"}>
                      {userData.disqualified ? "Disqualified" : "Active"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="easy" className="text-sm">Easy</TabsTrigger>
                <TabsTrigger value="medium" className="text-sm">Medium</TabsTrigger>
                <TabsTrigger value="hard" className="text-sm">Hard</TabsTrigger>
                <TabsTrigger value="choice" className="text-sm">Code of Choice</TabsTrigger>
              </TabsList>

              {Object.entries(mockQuestions).map(([difficulty, question]) => (
                <TabsContent key={difficulty} value={difficulty}>
                  <Card className="shadow-elegant">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getDifficultyColor(difficulty)}>
                              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                            </Badge>
                            {question.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <CardTitle className="text-xl">{question.title}</CardTitle>
                          <CardDescription className="text-base">
                            {question.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-3">
                        {question.link && (
                          <Button 
                            variant="outline" 
                            onClick={() => window.open(question.link, '_blank')}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open Problem
                          </Button>
                        )}
                        <Button 
                          variant="hero"
                          onClick={() => handleSubmission(difficulty)}
                          disabled={userData.disqualified}
                          className="flex items-center gap-2"
                        >
                          <Code className="w-4 h-4" />
                          Submit Solution
                        </Button>
                      </div>

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
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmissionModal && selectedQuestion && (
        <SubmissionModal 
          question={selectedQuestion}
          onClose={() => setShowSubmissionModal(false)}
          onSubmit={() => {
            setShowSubmissionModal(false);
            toast({
              title: "✅ Submission received — day marked as completed.",
              description: "Great job! Keep up the streak!"
            });
          }}
        />
      )}
    </div>
  );
};

export default StudentDashboard;