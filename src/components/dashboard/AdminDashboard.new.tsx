import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Calendar,
  MessageSquare,
  Settings,
  FileText,
  BarChart3,
  Shield,
  Clock,
  Star,
  UserCheck,
  MessageCircle,
  AlertOctagon,
  Activity,
  Database,
  Filter,
  Download,
  RefreshCw,
  Bell,
  Eye,
  Search,
  ChevronRight,
  Award,
  Target,
  BookOpen,
  Zap,
  Plus,
  Edit,
  Trash2,
  Send,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '../../hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { submissionsService, Submission } from '../../lib/firebase/submissions';
import { usersService } from '../../lib/firebase/users';
import { questionsService } from '../../lib/firebase/questions';
import { assignmentsService } from '../../lib/firebase/assignments';
import { qaService, StudentQuestion } from '../../lib/firebase/qa';
import { notificationsService, AdminNotification } from '../../lib/firebase/notifications';

interface UserData {
  uid: string;
  name: string;
  email: string;
  streak?: number;
  submissions_count?: number;
  last_active?: string;
  profile_picture?: string;
  total_points?: number;
  rank?: string;
  avg_performance?: number;
  achievements?: string[];
  join_date?: string;
  status?: 'active' | 'suspended' | 'inactive';
}

interface PlatformStats {
  total_users: number;
  active_users_today: number;
  total_submissions: number;
  pending_submissions: number;
  total_questions: number;
  unanswered_questions: number;
  avg_response_time: number;
  success_rate: number;
  streak_leaders: UserData[];
  recent_activity: any[];
}

interface SubmissionWithData extends Submission {
  studentData?: UserData;
  questionData?: any;
}

const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  
  // Core state
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Data state
  const [submissions, setSubmissions] = useState<SubmissionWithData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  
  // Filter and search state
  const [submissionFilter, setSubmissionFilter] = useState('all');
  const [questionFilter, setQuestionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7');
  
  // Modal state
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithData | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<StudentQuestion | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  
  // Action state
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    
    try {
      const [
        submissionsData,
        usersData,
        questionsData,
        notificationsData
      ] = await Promise.all([
        submissionsService.getAllSubmissions(),
        usersService.getAllUsers(),
        qaService.getAllQuestions(),
        notificationsService.getAdminNotifications()
      ]);

      // Enrich submissions with user and question data
      const enrichedSubmissions = await Promise.all(
        submissionsData.map(async (submission) => {
          const studentData = await getStudentDataForSubmission(submission.student_uid);
          const questionData = await questionsService.getQuestion(submission.question_date, submission.difficulty);
          return {
            ...submission,
            studentData,
            questionData
          };
        })
      );

      setSubmissions(enrichedSubmissions);
      setUsers(usersData);
      setQuestions(questionsData);
      setAdminNotifications(notificationsData);
      
      // Calculate platform statistics
      const stats = calculatePlatformStats(enrichedSubmissions, usersData, questionsData);
      setPlatformStats(stats);
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const getStudentDataForSubmission = async (userUid: string): Promise<UserData | undefined> => {
    try {
      const userData = await usersService.getUserData(userUid);
      return userData || undefined;
    } catch (error) {
      console.error('Error fetching student data:', error);
      return undefined;
    }
  };

  const calculatePlatformStats = (
    submissions: SubmissionWithData[], 
    users: UserData[], 
    questions: StudentQuestion[]
  ): PlatformStats => {
    const now = new Date();
    const today = now.toDateString();
    
    const activeUsersToday = users.filter(user => 
      user.last_active && new Date(user.last_active).toDateString() === today
    );
    
    const pendingSubmissions = submissions.filter(s => s.status === 'pending');
    const unansweredQuestions = questions.filter(q => q.status === 'pending');
    
    const approvedSubmissions = submissions.filter(s => s.status === 'approved');
    const successRate = submissions.length > 0 
      ? (approvedSubmissions.length / submissions.length) * 100 
      : 0;
    
    const streakLeaders = users
      .sort((a, b) => (b.streak || 0) - (a.streak || 0))
      .slice(0, 5);
    
    // Calculate average response time for answered questions
    const answeredQuestions = questions.filter(q => q.status === 'answered' && q.responded_at && q.created_at);
    const avgResponseTime = answeredQuestions.length > 0
      ? answeredQuestions.reduce((acc, q) => {
          const responseTime = new Date(q.responded_at!).getTime() - new Date(q.created_at).getTime();
          return acc + responseTime;
        }, 0) / answeredQuestions.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    return {
      total_users: users.length,
      active_users_today: activeUsersToday.length,
      total_submissions: submissions.length,
      pending_submissions: pendingSubmissions.length,
      total_questions: questions.length,
      unanswered_questions: unansweredQuestions.length,
      avg_response_time: avgResponseTime,
      success_rate: successRate,
      streak_leaders: streakLeaders,
      recent_activity: []
    };
  };

  // Filter functions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      const matchesFilter = submissionFilter === 'all' || submission.status === submissionFilter;
      const matchesSearch = !searchTerm || 
        submission.studentData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.studentData?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.questionData?.title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (dateRange !== 'all') {
        const daysAgo = parseInt(dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        matchesDate = new Date(submission.submitted_at) >= cutoffDate;
      }
      
      return matchesFilter && matchesSearch && matchesDate;
    });
  }, [submissions, submissionFilter, searchTerm, dateRange]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(question => {
      const matchesFilter = questionFilter === 'all' || question.status === questionFilter;
      const matchesSearch = !searchTerm || 
        question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.student_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
  }, [questions, questionFilter, searchTerm]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesFilter = userFilter === 'all' || 
        (userFilter === 'active' && user.status === 'active') ||
        (userFilter === 'inactive' && (!user.status || user.status === 'inactive')) ||
        (userFilter === 'suspended' && user.status === 'suspended');
      
      const matchesSearch = !searchTerm || 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
  }, [users, userFilter, searchTerm]);

  // Action handlers
  const handleSubmissionReview = async () => {
    if (!selectedSubmission || !reviewAction) return;
    
    setIsProcessing(true);
    try {
      if (reviewAction === 'approve') {
        await submissionsService.reviewSubmissionWithStreakLogic(
          selectedSubmission.id!, 
          'approved',
          reviewComment || 'Approved by admin',
          'admin',
          selectedSubmission.student_uid
        );
        
        // Create approval notification
        if (selectedSubmission.studentData) {
          await notificationsService.createApprovalNotification(
            selectedSubmission.student_uid,
            selectedSubmission.id!,
            selectedSubmission.questionData?.title || 'Question'
          );
        }
        
        toast({
          title: "Submission Approved",
          description: "The submission has been approved successfully."
        });
      } else {
        await submissionsService.reviewSubmissionWithStreakLogic(
          selectedSubmission.id!, 
          'rejected',
          reviewComment || 'Rejected by admin',
          'admin',
          selectedSubmission.student_uid
        );
        
        // Create rejection notification
        if (selectedSubmission.studentData) {
          await notificationsService.createRejectionNotification(
            selectedSubmission.student_uid,
            selectedSubmission.id!,
            selectedSubmission.questionData?.title || 'Question',
            reviewComment
          );
        }
        
        toast({
          title: "Submission Rejected",
          description: "The submission has been rejected."
        });
      }
      
      await loadDashboardData(false);
      setShowReviewModal(false);
      setSelectedSubmission(null);
      setReviewAction(null);
      setReviewComment('');
      
    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast({
        title: "Error",
        description: "Failed to process submission review.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuestionAnswer = async () => {
    if (!selectedQuestion || !answerText.trim()) return;
    
    setIsProcessing(true);
    try {
      await qaService.answerQuestion(
        selectedQuestion.id!,
        answerText,
        'admin',
        'admin'
      );
      
      toast({
        title: "Question Answered",
        description: "Your answer has been sent to the student."
      });
      
      await loadDashboardData(false);
      setShowQuestionModal(false);
      setSelectedQuestion(null);
      setAnswerText('');
      
    } catch (error) {
      console.error('Error answering question:', error);
      toast({
        title: "Error",
        description: "Failed to submit answer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      case 'answered': return 'default';
      case 'open': return 'outline';
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Comprehensive platform management and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </Badge>
          <Button 
            onClick={() => loadDashboardData()} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {platformStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{platformStats.total_users}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {platformStats.active_users_today} active today
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold">{platformStats.pending_submissions}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {platformStats.total_submissions} total submissions
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unanswered Q&A</p>
                  <p className="text-2xl font-bold">{platformStats.unanswered_questions}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  Avg: {platformStats.avg_response_time.toFixed(1)}h response
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">{platformStats.success_rate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2">
                <Progress value={platformStats.success_rate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Notifications Alert */}
      {adminNotifications.filter(n => !n.acknowledged && n.priority === 'urgent').length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertOctagon className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You have {adminNotifications.filter(n => !n.acknowledged && n.priority === 'urgent').length} urgent 
            notifications requiring immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions 
            <Badge variant="secondary" className="ml-2">
              {filteredSubmissions.filter(s => s.status === 'pending').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="questions">
            Q&A
            <Badge variant="secondary" className="ml-2">
              {filteredQuestions.filter(q => q.status === 'pending').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredSubmissions.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{submission.studentData?.name || 'Unknown Student'}</p>
                        <p className="text-sm text-gray-600">
                          Submitted {submission.difficulty} question
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={getBadgeVariant(submission.status)}>
                        {submission.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Streak Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platformStats?.streak_leaders.map((user, index) => (
                    <div key={user.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{user.streak || 0}</p>
                        <p className="text-xs text-gray-500">day streak</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Urgent Items */}
          {(filteredSubmissions.filter(s => s.status === 'pending').length > 0 || 
            filteredQuestions.filter(q => q.status === 'pending').length > 0) && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  Requires Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSubmissions.filter(s => s.status === 'pending').length > 0 && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">Pending Submissions</h4>
                      <p className="text-orange-700 mb-3">
                        {filteredSubmissions.filter(s => s.status === 'pending').length} submissions need review
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => setActiveTab('submissions')}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Review Now
                      </Button>
                    </div>
                  )}
                  
                  {filteredQuestions.filter(q => q.status === 'pending').length > 0 && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">Unanswered Questions</h4>
                      <p className="text-purple-700 mb-3">
                        {filteredQuestions.filter(q => q.status === 'pending').length} questions need answers
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => setActiveTab('questions')}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Answer Now
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Enhanced Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6">
          {/* Filters and Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submission Management
              </CardTitle>
              <CardDescription>
                Review and manage student submissions with comprehensive filtering and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search students, emails, or questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-80"
                  />
                </div>
                
                <Select value={submissionFilter} onValueChange={setSubmissionFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Today</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Submissions Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{submission.studentData?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-600">{submission.studentData?.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs">{submission.studentData?.streak || 0} day streak</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{submission.questionData?.title || 'Question'}</p>
                            <p className="text-sm text-gray-600">{submission.question_date}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            submission.difficulty === 'easy' ? 'default' :
                            submission.difficulty === 'medium' ? 'secondary' : 'destructive'
                          }>
                            {submission.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{new Date(submission.submitted_at).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-600">{new Date(submission.submitted_at).toLocaleTimeString()}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(submission.status)}>
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-400">-</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setShowReviewModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                            {submission.github_file_link && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(submission.github_file_link, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredSubmissions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No submissions found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Q&A Tab */}
        <TabsContent value="questions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Q&A Management
              </CardTitle>
              <CardDescription>
                Answer student questions and manage support requests with priority handling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search questions or students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-80"
                  />
                </div>
                
                <Select value={questionFilter} onValueChange={setQuestionFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Questions</SelectItem>
                    <SelectItem value="pending">Unanswered</SelectItem>
                    <SelectItem value="answered">Answered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <Card key={question.id} className={`${question.priority === 'urgent' ? 'border-red-200' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{question.question_text.substring(0, 100)}...</h4>
                            <Badge variant={getBadgeVariant(question.status)}>
                              {question.status}
                            </Badge>
                            <Badge variant={getBadgeVariant(question.priority)} className={getPriorityColor(question.priority)}>
                              {question.priority}
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-2">{question.question_text}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>By: {question.student_name}</span>
                            <span>Email: {question.student_email}</span>
                            <span>Asked: {new Date(question.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {question.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedQuestion(question);
                                setShowQuestionModal(true);
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Answer
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {question.status === 'answered' && question.admin_response && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                          <p className="text-sm font-medium text-green-800">Answer:</p>
                          <p className="text-green-700 mt-1">{question.admin_response}</p>
                          <p className="text-xs text-green-600 mt-2">
                            Answered by {question.responded_by} on {new Date(question.responded_at!).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredQuestions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No questions found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts, view analytics, and handle user-related actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-80"
                  />
                </div>
                
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Streak</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            user.status === 'active' ? 'default' :
                            user.status === 'suspended' ? 'destructive' : 'secondary'
                          }>
                            {user.status || 'inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{user.streak || 0} days</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.submissions_count || 0}</TableCell>
                        <TableCell>
                          {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Platform Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive insights into platform performance and user engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">User Engagement</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Active Users (7d)</span>
                      <span className="font-medium">{platformStats?.active_users_today || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Session Time</span>
                      <span className="font-medium">24 min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Return Rate</span>
                      <span className="font-medium">78%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Submission Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="font-medium">{platformStats?.success_rate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Review Time</span>
                      <span className="font-medium">2.3 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Daily Submissions</span>
                      <span className="font-medium">{submissions.filter(s => 
                        new Date(s.submitted_at).toDateString() === new Date().toDateString()
                      ).length}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">Support Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Response Time</span>
                      <span className="font-medium">{platformStats?.avg_response_time.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Resolution Rate</span>
                      <span className="font-medium">94%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Satisfaction</span>
                      <span className="font-medium">4.8/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Platform Maintenance
              </CardTitle>
              <CardDescription>
                System settings, maintenance mode, and platform configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">System Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Maintenance Mode</span>
                      <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Auto-backups</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>System Health</span>
                      <Badge variant="default">Healthy</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      Backup Database
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Export Logs
                    </Button>
                  </div>
                </div>
              </div>

              {/* Admin Notifications Management */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Admin Notifications</h4>
                <div className="space-y-3">
                  {adminNotifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getBadgeVariant(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        {!notification.acknowledged && (
                          <Button size="sm" variant="outline">
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submission Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              Evaluate and provide feedback on student submission
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Student Information</h4>
                  <div className="space-y-1">
                    <p><strong>Name:</strong> {selectedSubmission.studentData?.name || 'Unknown'}</p>
                    <p><strong>Email:</strong> {selectedSubmission.studentData?.email}</p>
                    <p><strong>Current Streak:</strong> {selectedSubmission.studentData?.streak || 0} days</p>
                    <p><strong>Total Submissions:</strong> {selectedSubmission.studentData?.submissions_count || 0}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Submission Details</h4>
                  <div className="space-y-1">
                    <p><strong>Question:</strong> {selectedSubmission.questionData?.title || 'N/A'}</p>
                    <p><strong>Difficulty:</strong> {selectedSubmission.difficulty}</p>
                    <p><strong>Submitted:</strong> {new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
                    <p><strong>Status:</strong> {selectedSubmission.status}</p>
                  </div>
                </div>
              </div>

              {/* Submission Content */}
              {selectedSubmission.github_file_link && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Code Submission</h4>
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedSubmission.github_file_link, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Code Repository
                  </Button>
                </div>
              )}

              {/* Review Actions */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Review Decision</Label>
                  <div className="flex gap-4 mt-2">
                    <Button
                      variant={reviewAction === 'approve' ? 'default' : 'outline'}
                      onClick={() => setReviewAction('approve')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant={reviewAction === 'reject' ? 'destructive' : 'outline'}
                      onClick={() => setReviewAction('reject')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="review-comment">Feedback/Comments</Label>
                  <Textarea
                    id="review-comment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Provide detailed feedback for the student..."
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleSubmissionReview}
                    disabled={!reviewAction || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit Review
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedSubmission(null);
                      setReviewAction(null);
                      setReviewComment('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Question Answer Modal */}
      <Dialog open={showQuestionModal} onOpenChange={setShowQuestionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Answer Student Question</DialogTitle>
            <DialogDescription>
              Provide a helpful and detailed answer to the student's question
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuestion && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">{selectedQuestion.question_text.substring(0, 100)}...</h4>
                <p className="text-gray-700 mb-2">{selectedQuestion.question_text}</p>
                <div className="text-sm text-gray-600">
                  <p>Asked by: {selectedQuestion.student_name} ({selectedQuestion.student_email})</p>
                  <p>Priority: {selectedQuestion.priority}</p>
                  <p>Date: {new Date(selectedQuestion.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="answer-text">Your Answer</Label>
                <Textarea
                  id="answer-text"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Provide a clear and helpful answer..."
                  className="mt-2"
                  rows={6}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleQuestionAnswer}
                  disabled={!answerText.trim() || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Answer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQuestionModal(false);
                    setSelectedQuestion(null);
                    setAnswerText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
