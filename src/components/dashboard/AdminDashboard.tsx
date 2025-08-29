import React, { useState, useEffect } from 'react';
import { useAuth, type UserData } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Eye, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Filter,
  Download,
  Plus,
  Settings,
  BookOpen,
  Calendar,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Code,
  Github,
  User,
  Mail,
  Star,
  X,
  Send,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  usersService, 
  submissionsService, 
  assignmentsService,
  notificationsService,
  type Submission
} from '../../lib/firebase/index';

interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  totalSubmissions: number;
  pendingReviews: number;
  averageStreak: number;
  completionRate: number;
}

interface SubmissionReviewModalProps {
  submission: Submission | null;
  onClose: () => void;
  onApprove: (feedback: string) => void;
  onReject: (feedback: string) => void;
}

const SubmissionReviewModal: React.FC<SubmissionReviewModalProps> = ({ 
  submission, 
  onClose, 
  onApprove, 
  onReject 
}) => {
  const [feedback, setFeedback] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  if (!submission) return null;

  const handleSubmit = () => {
    if (action === 'approve') {
      onApprove(feedback || 'Great job! Your solution has been approved.');
    } else if (action === 'reject') {
      onReject(feedback || 'Please review your solution and try again.');
    }
    onClose();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'hard': return 'bg-red-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Review Submission - {submission.question_title}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Student:</span>
                <span>{submission.student_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span className="text-sm">{submission.student_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Date:</span>
                <span>{submission.question_date}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(submission.difficulty)}>
                  {submission.difficulty.charAt(0).toUpperCase() + submission.difficulty.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Submitted:</span>
                <span className="text-sm">{new Date(submission.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-4">
            {submission.github_file_link && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(submission.github_file_link, '_blank')}
                className="flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </Button>
            )}
            {submission.external_problem_link && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(submission.external_problem_link, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Problem Link
              </Button>
            )}
          </div>

          {/* Code Solution */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Code className="w-4 h-4" />
              Solution Code
            </Label>
            <div className="bg-muted/50 rounded-lg p-4 border">
              <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                {submission.code_text || 'No code provided'}
              </pre>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-base font-medium">
              Admin Feedback
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback to the student..."
              className="min-h-[100px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => setAction('approve')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={action !== null}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              {action === 'approve' ? 'Approving...' : 'Approve Submission'}
            </Button>
            <Button
              onClick={() => setAction('reject')}
              variant="destructive"
              className="flex-1"
              disabled={action !== null}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              {action === 'reject' ? 'Rejecting...' : 'Reject Submission'}
            </Button>
          </div>

          {action && (
            <div className="bg-muted/50 rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground mb-3">
                Ready to {action} this submission?
              </p>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} size="sm">
                  <Send className="w-4 h-4 mr-2" />
                  Confirm {action.charAt(0).toUpperCase() + action.slice(1)}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAction(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AdminDashboard = () => {
  const { userData, logout, currentUser } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [students, setStudents] = useState<UserData[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserData | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    averageStreak: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'students' | 'submissions' | 'assignments' | 'questions'>('overview');

  // Filter states
  const [courseFilter, setCourseFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disqualified'>('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Questions management states
  const [selectedAssignmentDate, setSelectedAssignmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignmentDayNumber, setAssignmentDayNumber] = useState(1);
  const [createAssignmentLoading, setCreateAssignmentLoading] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  // Auto-calculate day number based on challenge start date
  const challengeStartDate = new Date('2024-12-01'); // Adjust this to your actual challenge start date
  
  useEffect(() => {
    if (selectedAssignmentDate) {
      const assignmentDate = new Date(selectedAssignmentDate);
      const daysDiff = Math.floor((assignmentDate.getTime() - challengeStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const dayNumber = Math.max(1, Math.min(45, daysDiff + 1));
      setAssignmentDayNumber(dayNumber);
    }
  }, [selectedAssignmentDate]);

  // Question states
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [easyQuestion, setEasyQuestion] = useState({
    title: '',
    description: '',
    link: '',
    tags: [] as string[],
    difficulty: 'easy' as const
  });

  useEffect(() => {
    fetchData();
    fetchAssignments();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Starting admin data fetch...');
      
      // Fetch all students
      console.log('Fetching users...');
      const allUsers = await usersService.getAllUsers();
      console.log('Users fetched:', allUsers.length);
      
      const studentsOnly = allUsers.filter(user => !user.isAdmin);
      console.log('Students filtered:', studentsOnly.length);
      setStudents(studentsOnly);
      
      // Fetch all submissions
      console.log('Fetching submissions...');
      const allSubmissions = await submissionsService.getAllSubmissions();
      console.log('Submissions fetched:', allSubmissions.length);
      setSubmissions(allSubmissions);
      
      // Filter pending submissions
      const pending = allSubmissions.filter(sub => 
        sub.adminReview?.status === 'pending' || 
        sub.status === 'submitted' || 
        !sub.adminReview
      );
      console.log('Pending submissions:', pending.length);
      setPendingSubmissions(pending);
      
      // Calculate stats
      calculateStats(studentsOnly, allSubmissions);
      
      console.log('Admin data fetch completed successfully');
      
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to load admin data: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (students: UserData[], submissions: Submission[]) => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => !s.disqualified).length;
    const totalSubmissions = submissions.length;
    const pendingReviews = submissions.filter(s => 
      s.adminReview?.status === 'pending' || s.status === 'submitted'
    ).length;
    const averageStreak = students.reduce((sum, s) => sum + s.streak_count, 0) / totalStudents || 0;
    
    // Calculate completion rate (students with at least one submission)
    const studentsWithSubmissions = new Set(submissions.map(s => s.student_uid));
    const completionRate = (studentsWithSubmissions.size / totalStudents) * 100 || 0;

    setStats({
      totalStudents,
      activeStudents,
      totalSubmissions,
      pendingReviews,
      averageStreak: Math.round(averageStreak * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10
    });
  };

  const handleViewStudent = (student: UserData) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  };

  const handleReviewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowReviewModal(true);
  };

  const handleApproveSubmission = async (feedback: string) => {
    if (!selectedSubmission || !userData?.uid) return;

    try {
      // Update submission status
      await submissionsService.updateSubmissionStatus(
        selectedSubmission.id!,
        'approved',
        feedback,
        userData.uid
      );
      
      // Increment approved count for student
      await usersService.incrementApproved(selectedSubmission.student_uid, selectedSubmission.difficulty);
      
      // Create approval notification
      await notificationsService.createApprovalNotification(
        selectedSubmission.student_uid,
        selectedSubmission.id!,
        selectedSubmission.question_title
      );
      
      toast({
        title: 'Success',
        description: 'Submission approved and student notified'
      });
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error('Error approving submission:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve submission'
      });
    }
  };

  const handleRejectSubmission = async (feedback: string) => {
    if (!selectedSubmission || !userData?.uid) return;

    try {
      // Update submission status
      await submissionsService.updateSubmissionStatus(
        selectedSubmission.id!,
        'rejected',
        feedback,
        userData.uid
      );
      
      // Create rejection notification
      await notificationsService.createRejectionNotification(
        selectedSubmission.student_uid,
        selectedSubmission.id!,
        selectedSubmission.question_title,
        feedback
      );
      
      toast({
        title: 'Success',
        description: 'Submission rejected and student notified'
      });
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject submission'
      });
    }
  };

  // Assignment management functions
  const handleCreateAssignment = async () => {
    if (!selectedDifficulty || !easyQuestion.title || !easyQuestion.description || !easyQuestion.link) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all question details and select difficulty'
      });
      return;
    }

    try {
      setCreateAssignmentLoading(true);
      
      console.log('Creating assignment for date:', selectedAssignmentDate);
      console.log('Selected difficulty:', selectedDifficulty);
      
      // Create question object with selected difficulty
      const questionData = {
        title: easyQuestion.title,
        description: easyQuestion.description,
        link: easyQuestion.link,
        tags: easyQuestion.tags,
        difficulty: selectedDifficulty
      };

      // Create default empty questions for other difficulties
      const defaultQuestion = {
        title: '',
        description: '',
        link: '',
        tags: [],
        difficulty: 'easy' as const
      };

      const assignmentData = {
        date: selectedAssignmentDate,
        day_number: assignmentDayNumber,
        easy_question: selectedDifficulty === 'easy' ? questionData : defaultQuestion,
        medium_question: selectedDifficulty === 'medium' ? {...questionData, difficulty: 'medium' as const} : {...defaultQuestion, difficulty: 'medium' as const},
        hard_question: selectedDifficulty === 'hard' ? {...questionData, difficulty: 'hard' as const} : {...defaultQuestion, difficulty: 'hard' as const},
        created_by: currentUser?.uid || ''
      };

      console.log('Assignment data:', assignmentData);

      await assignmentsService.setAssignment(selectedAssignmentDate, assignmentData);
      
      toast({
        title: 'Success',
        description: `${selectedDifficulty.toUpperCase()} assignment created successfully for ${selectedAssignmentDate}!`
      });

      // Reset form
      handleResetAssignmentForm();
      // Refresh assignments
      await fetchAssignments();
      
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to create assignment: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setCreateAssignmentLoading(false);
    }
  };

  const handleResetAssignmentForm = () => {
    setSelectedDifficulty('easy');
    setEasyQuestion({
      title: '',
      description: '',
      link: '',
      tags: [],
      difficulty: 'easy'
    });
    // Set to today's date by default
    setSelectedAssignmentDate(new Date().toISOString().split('T')[0]);
  };

  const fetchAssignments = async () => {
    try {
      console.log('Fetching all assignments...');
      const allAssignments = await assignmentsService.getAllAssignments();
      console.log('Assignments fetched:', allAssignments);
      setAssignments(allAssignments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleEditAssignment = (assignment: any) => {
    setSelectedAssignmentDate(assignment.date);
    setAssignmentDayNumber(assignment.day_number);
    setEditingAssignment(assignment);
    
    // Determine which question is filled and set the appropriate difficulty
    if (assignment.easy_question.title) {
      setSelectedDifficulty('easy');
      setEasyQuestion(assignment.easy_question);
    } else if (assignment.medium_question.title) {
      setSelectedDifficulty('medium');
      setEasyQuestion(assignment.medium_question);
    } else if (assignment.hard_question.title) {
      setSelectedDifficulty('hard');
      setEasyQuestion(assignment.hard_question);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await assignmentsService.deleteAssignment(assignmentId);
      toast({
        title: 'Success',
        description: 'Assignment deleted successfully'
      });
      await fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete assignment'
      });
    }
  };

  // Filter functions
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.enrollment_no.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = !courseFilter || student.course === courseFilter;
    const matchesSection = !sectionFilter || student.section === sectionFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && !student.disqualified) ||
                         (statusFilter === 'disqualified' && student.disqualified);
    
    return matchesSearch && matchesCourse && matchesSection && matchesStatus;
  });

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.question_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = submissionStatusFilter === 'all' || 
                         (submissionStatusFilter === 'pending' && (submission.adminReview?.status === 'pending' || submission.status === 'submitted')) ||
                         (submissionStatusFilter === 'approved' && (submission.adminReview?.status === 'approved' || submission.status === 'approved')) ||
                         (submissionStatusFilter === 'rejected' && (submission.adminReview?.status === 'rejected' || submission.status === 'rejected'));
    
    return matchesSearch && matchesStatus;
  });

  if (!userData?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </Card>
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
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'students', label: 'Students', icon: Users },
                { id: 'submissions', label: 'Submissions', icon: BookOpen },
                { id: 'assignments', label: 'Assignments', icon: Calendar },
                { id: 'questions', label: 'Questions', icon: Code }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.activeStudents} active
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.pendingReviews} pending review
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageStreak}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.completionRate}% completion rate
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Reviews ({pendingSubmissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingSubmissions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No submissions pending review
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingSubmissions.slice(0, 5).map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            {submission.difficulty}
                          </Badge>
                          <div>
                            <p className="font-medium">{submission.student_name}</p>
                            <p className="text-sm text-muted-foreground">{submission.question_title}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleReviewSubmission(submission)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'students' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border rounded-md px-3 py-2"
              >
                <option value="all">All Students</option>
                <option value="active">Active</option>
                <option value="disqualified">Disqualified</option>
              </select>
            </div>

            {/* Students Table */}
            <Card>
              <CardHeader>
                <CardTitle>Students ({filteredStudents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Enrollment</TableHead>
                      <TableHead>Streak</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.uid}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.enrollment_no}</TableCell>
                        <TableCell>{student.streak_count}</TableCell>
                        <TableCell>
                          <Badge variant={student.disqualified ? "destructive" : "default"}>
                            {student.disqualified ? "Disqualified" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewStudent(student)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'submissions' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={submissionStatusFilter}
                onChange={(e) => setSubmissionStatusFilter(e.target.value as any)}
                className="border rounded-md px-3 py-2"
              >
                <option value="all">All Submissions</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Submissions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Submissions ({filteredSubmissions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">{submission.student_name}</TableCell>
                        <TableCell>{submission.question_title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {submission.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>{submission.question_date}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              (submission.adminReview?.status === 'approved' || submission.status === 'approved') ? "default" :
                              (submission.adminReview?.status === 'rejected' || submission.status === 'rejected') ? "destructive" :
                              "secondary"
                            }
                          >
                            {submission.adminReview?.status || submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewSubmission(submission)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assignments Tab - List Format */}
        {selectedTab === 'assignments' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Assignments</h2>
              <p className="text-muted-foreground">View and manage all created assignments by day</p>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">All Assignments</CardTitle>
                <CardDescription>
                  Complete list of assignments organized by date with all difficulty levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignments.length === 0 ? (
                    <div className="text-center py-12 text-gray-600 bg-gray-50 rounded-lg border-2 border-dashed">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-xl font-medium mb-2">No assignments created yet</p>
                      <p className="text-sm">Go to the Questions tab to create your first assignment</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assignments.map((assignment) => {
                        const questions = [
                          assignment.easy_question.title && { ...assignment.easy_question, level: 'Easy', color: 'bg-green-500' },
                          assignment.medium_question.title && { ...assignment.medium_question, level: 'Medium', color: 'bg-yellow-500' },
                          assignment.hard_question.title && { ...assignment.hard_question, level: 'Hard', color: 'bg-red-500' }
                        ].filter(Boolean);

                        return (
                          <div key={assignment.id} className="flex items-center justify-between p-4 bg-white border-2 rounded-lg hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-gray-600" />
                                <span className="font-bold text-lg text-gray-900">{assignment.date}</span>
                                <Badge variant="outline" className="border-2 text-sm font-medium">Day {assignment.day_number}</Badge>
                              </div>
                              
                              <div className="flex gap-2">
                                {questions.map((question: any, index) => (
                                  <Badge key={index} className={`${question.color} text-white text-sm px-3 py-1 font-medium`}>
                                    {question.level}
                                  </Badge>
                                ))}
                                {questions.length === 0 && (
                                  <Badge variant="secondary" className="text-sm">No questions</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAssignment(assignment)}
                                className="border-2 hover:bg-gray-50"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Manage
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAssignment(assignment.id!)}
                                className="border-2 text-red-600 hover:bg-red-50 hover:border-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Questions Management Section */}
        {selectedTab === 'questions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Daily Assignment Creator</h2>
              <p className="text-muted-foreground">Create and assign coding challenges for specific dates</p>
            </div>

            <Card className="border-2 bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Assignment Creator</CardTitle>
                <CardDescription>
                  Create a new coding challenge assignment for a specific date
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="assignment-date" className="text-sm font-medium text-foreground">Assignment Date</Label>
                    <Input
                      id="assignment-date"
                      type="date"
                      value={selectedAssignmentDate}
                      onChange={(e) => setSelectedAssignmentDate(e.target.value)}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-sm font-medium text-foreground">Question Difficulty</Label>
                    <Select value={selectedDifficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setSelectedDifficulty(value)}>
                      <SelectTrigger className="w-full border-2 focus:border-primary">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent className="border-2">
                        <SelectItem value="easy" className="hover:bg-green-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="font-medium">Easy</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medium" className="hover:bg-yellow-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="font-medium">Medium</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="hard" className="hover:bg-red-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="font-medium">Hard</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Question Details */}
                <div className={`space-y-4 p-6 border-2 rounded-lg ${
                  selectedDifficulty === 'easy' ? 'bg-white border-green-400 shadow-green-100' : 
                  selectedDifficulty === 'medium' ? 'bg-white border-yellow-400 shadow-yellow-100' : 'bg-white border-red-400 shadow-red-100'
                } shadow-lg`}>
                  <div className="flex items-center gap-3">
                    <Badge className={`text-white font-medium px-3 py-1 ${
                      selectedDifficulty === 'easy' ? 'bg-green-600' : 
                      selectedDifficulty === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                    }`}>
                      {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} Question
                    </Badge>
                    <span className="text-sm text-gray-600">Fill in the question details below</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-800">Question Title *</Label>
                      <Input
                        placeholder="e.g., Two Sum, Add Two Numbers, etc."
                        value={easyQuestion.title}
                        onChange={(e) => setEasyQuestion(prev => ({ ...prev, title: e.target.value }))}
                        className="border-2 focus:border-primary bg-white text-gray-900 placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-800">Problem Link *</Label>
                      <Input
                        placeholder="https://leetcode.com/problems/..."
                        value={easyQuestion.link}
                        onChange={(e) => setEasyQuestion(prev => ({ ...prev, link: e.target.value }))}
                        className="border-2 focus:border-primary bg-white text-gray-900 placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-800">Problem Description *</Label>
                    <Textarea
                      placeholder="Describe the problem clearly..."
                      value={easyQuestion.description}
                      onChange={(e) => setEasyQuestion(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="border-2 focus:border-primary bg-white text-gray-900 placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-800">Tags</Label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border-2 border-gray-300 rounded-md bg-white">
                        {easyQuestion.tags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                            onClick={() => setEasyQuestion(prev => ({
                              ...prev,
                              tags: prev.tags.filter((_, i) => i !== index)
                            }))}
                          >
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                      <Input
                        placeholder="Type a tag and press Enter (e.g., Array, Hash Table, Math)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = e.currentTarget.value.trim();
                            if (value && !easyQuestion.tags.includes(value)) {
                              setEasyQuestion(prev => ({
                                ...prev,
                                tags: [...prev.tags, value]
                              }));
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        className="border-2 focus:border-primary bg-white text-gray-900 placeholder:text-gray-500"
                      />
                      <p className="text-xs text-gray-600">Press Enter to add tags. Click on tags to remove them.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleResetAssignmentForm}
                    className="border-2 hover:bg-muted"
                  >
                    Reset Form
                  </Button>
                  <Button 
                    onClick={handleCreateAssignment} 
                    disabled={createAssignmentLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  >
                    {createAssignmentLoading ? 'Creating...' : 'Create Assignment'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Assignments */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Existing Assignments</CardTitle>
                <CardDescription>
                  View and manage previously created assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignments.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-lg border-2 border-dashed">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium">No assignments created yet</p>
                      <p className="text-sm">Click "Create Assignment" to add your first assignment</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assignments.map((assignment) => {
                        const questions = [
                          assignment.easy_question.title && { ...assignment.easy_question, level: 'Easy', color: 'bg-green-500' },
                          assignment.medium_question.title && { ...assignment.medium_question, level: 'Medium', color: 'bg-yellow-500' },
                          assignment.hard_question.title && { ...assignment.hard_question, level: 'Hard', color: 'bg-red-500' }
                        ].filter(Boolean);

                        return (
                          <div key={assignment.id} className="flex items-center justify-between p-4 bg-white border-2 rounded-lg hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-600" />
                                <span className="font-semibold text-gray-900">{assignment.date}</span>
                                <Badge variant="outline" className="border-2 text-xs">Day {assignment.day_number}</Badge>
                              </div>
                              
                              <div className="flex gap-2">
                                {questions.map((question: any, index) => (
                                  <Badge key={index} className={`${question.color} text-white text-xs px-2 py-1`}>
                                    {question.level}
                                  </Badge>
                                ))}
                                {questions.length === 0 && (
                                  <Badge variant="secondary" className="text-xs">No questions</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAssignment(assignment)}
                                className="border-2 hover:bg-gray-50"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Manage
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAssignment(assignment.id!)}
                                className="border-2 text-red-600 hover:bg-red-50 hover:border-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <SubmissionReviewModal
          submission={selectedSubmission}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedSubmission(null);
          }}
          onApprove={handleApproveSubmission}
          onReject={handleRejectSubmission}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

