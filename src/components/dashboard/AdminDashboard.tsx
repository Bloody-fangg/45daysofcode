import React, { useState, useEffect, useMemo } from 'react';
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
  Trash2,
  Hash,
  GraduationCap
} from 'lucide-react';
import { 
  usersService, 
  submissionsService, 
  assignmentsService,
  notificationsService,
  examCooldownService,
  scheduleService,
  registrationService,
  type Submission,
  type ExamCooldown,
  type RegistrationSettings
} from '../../lib/firebase/index';
import { auth } from '../../lib/firebase';

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
  const [selectedTab, setSelectedTab] = useState<'overview' | 'students' | 'submissions' | 'assignments' | 'questions' | 'exams' | 'management'>('overview');

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQuestionType, setEditingQuestionType] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [tempQuestionData, setTempQuestionData] = useState({
    title: '',
    description: '',
    link: '',
    tags: [] as string[]
  });
  const [tempAssignmentDate, setTempAssignmentDate] = useState('');
  const [inlineEditingAssignment, setInlineEditingAssignment] = useState<string | null>(null);

  // Exam management states
  const [examSettings, setExamSettings] = useState<ExamCooldown | null>(null);
  const [examLoading, setExamLoading] = useState(false);
  const [examFormData, setExamFormData] = useState({
    active: false,
    start_date: '',
    end_date: '',
    pause_submissions_count: true,
    message: "📚 All The Best For Your Exams! Your streak is paused during this period."
  });

  // Management states for registration control
  const [registrationSettings, setRegistrationSettings] = useState<RegistrationSettings>({
    enabled: true,
    maxUsers: 500,
    requireApproval: false,
    restrictionMessage: 'Registration is currently closed.'
  });
  const [managementLoading, setManagementLoading] = useState(false);
  const [inlineEditData, setInlineEditData] = useState<any>(null);

  // Auto-calculate day number based on challenge start date
  const challengeStartDate = new Date('2024-12-01'); // Adjust this to your actual challenge start date
  
  // Generate flexible number of day templates (supports any number of days)
  const generateAllDays = (numDays: number = 55): any[] => {
    const allDays: any[] = [];
    
    for (let day = 1; day <= numDays; day++) {
      // Don't pre-assign dates - let admin choose them
      allDays.push({
        id: `day-${day}`,
        day_number: day,
        date: '', // Empty date - admin will assign
        easy_question: {
          title: '',
          description: '',
          link: '',
          tags: []
        },
        medium_question: {
          title: '',
          description: '',
          link: '',
          tags: []
        },
        hard_question: {
          title: '',
          description: '',
          link: '',
          tags: []
        }
      });
    }
    
    return allDays;
  };

  // Initialize assignments with flexible day count (default 55: 45 main + 10 extra)
  // Can be extended to support more days if needed
  const [maxDays, setMaxDays] = useState(55);
  const [allGeneratedDays, setAllGeneratedDays] = useState(() => generateAllDays(maxDays));
  
  // Combine Firebase data with generated day templates
  const combinedAssignments = useMemo(() => {
    // Create a map of all saved assignments by their day_number (not date)
    const savedAssignmentsByDay = new Map();
    const savedAssignmentsByDate = new Map();
    
    assignments.forEach(assignment => {
      if (assignment.day_number) {
        savedAssignmentsByDay.set(assignment.day_number, assignment);
      }
      if (assignment.date) {
        savedAssignmentsByDate.set(assignment.date, assignment);
      }
    });
    
    // Check if we need to extend days based on existing assignments
    const maxExistingDay = Math.max(0, ...assignments.map(a => a.day_number || 0));
    const requiredDays = Math.max(maxDays, maxExistingDay + 10); // Always have 10 extra
    
    // Generate more days if needed
    let currentGeneratedDays = allGeneratedDays;
    if (requiredDays > maxDays) {
      setMaxDays(requiredDays);
      currentGeneratedDays = generateAllDays(requiredDays);
      setAllGeneratedDays(currentGeneratedDays);
    }
    
    // Start with all generated day templates (supports unlimited extension)
    const combined = currentGeneratedDays.map(template => {
      const saved = savedAssignmentsByDay.get(template.day_number);
      if (saved) {
        return { ...saved, fromFirebase: true };
      }
      return { ...template, fromFirebase: false };
    });

    // Add any additional assignments from Firebase that don't fit the day template model
    assignments.forEach(assignment => {
      if (!assignment.day_number || assignment.day_number > currentGeneratedDays.length) {
        // This is an assignment that extends beyond our current template
        combined.push({ ...assignment, fromFirebase: true });
      }
    });

    return combined.sort((a, b) => {
      // Sort by day_number first, then by date if day_number is missing
      if (a.day_number && b.day_number) {
        return a.day_number - b.day_number;
      }
      if (a.day_number && !b.day_number) return -1;
      if (!a.day_number && b.day_number) return 1;
      
      // Both have no day_number, sort by date
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return 0;
    });
  }, [assignments, allGeneratedDays, maxDays]);
  
  useEffect(() => {
    if (selectedAssignmentDate) {
      const assignmentDate = new Date(selectedAssignmentDate);
      const daysDiff = Math.floor((assignmentDate.getTime() - challengeStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const dayNumber = Math.max(1, Math.min(maxDays, daysDiff + 1)); // Use dynamic maxDays
      setAssignmentDayNumber(dayNumber);
    }
  }, [selectedAssignmentDate, maxDays]);

  // Question states
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [easyQuestion, setEasyQuestion] = useState({
    title: '',
    description: '',
    link: '',
    tags: [] as string[],
    difficulty: 'easy' as const
  });
  const [mediumQuestion, setMediumQuestion] = useState({
    title: '',
    description: '',
    link: '',
    tags: [] as string[],
    difficulty: 'medium' as const
  });
  const [hardQuestion, setHardQuestion] = useState({
    title: '',
    description: '',
    link: '',
    tags: [] as string[],
    difficulty: 'hard' as const
  });

  useEffect(() => {
    fetchData();
    fetchAssignments();
    fetchExamSettings();
    fetchRegistrationSettings();
  }, []);

  // Load exam settings
  const fetchExamSettings = async () => {
    try {
      setExamLoading(true);
      const settings = await examCooldownService.getExamCooldown();
      if (settings) {
        setExamSettings(settings);
        setExamFormData({
          active: settings.active || false,
          start_date: settings.start_date,
          end_date: settings.end_date,
          pause_submissions_count: settings.pause_submissions_count || true,
          message: settings.message
        });
      }
    } catch (error) {
      console.error('Error fetching exam settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load exam settings',
        variant: 'destructive'
      });
    } finally {
      setExamLoading(false);
    }
  };

  // Update exam settings
  const handleUpdateExamSettings = async () => {
    try {
      setExamLoading(true);
      await examCooldownService.updateExamCooldown(examFormData);
      await fetchExamSettings(); // Reload settings
      toast({
        title: 'Success',
        description: 'Exam settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating exam settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update exam settings'
      });
    } finally {
      setExamLoading(false);
    }
  };

  // Toggle exam mode quickly
  const handleToggleExamMode = async () => {
    try {
      setExamLoading(true);
      const newActiveState = !examSettings?.active;
      await examCooldownService.toggleExamMode(newActiveState);
      await fetchExamSettings(); // Reload settings
      toast({
        title: 'Success',
        description: `Exam mode ${newActiveState ? 'activated' : 'deactivated'}`
      });
    } catch (error) {
      console.error('Error toggling exam mode:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to toggle exam mode'
      });
    } finally {
      setExamLoading(false);
    }
  };

  // Registration management functions
  const fetchRegistrationSettings = async () => {
    try {
      setManagementLoading(true);
      const settings = await registrationService.getRegistrationSettings();
      if (settings) {
        console.log('Fetched registration settings:', settings);
        setRegistrationSettings(settings);
      }
    } catch (error) {
      console.error('Error fetching registration settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load registration settings',
        variant: 'destructive'
      });
    } finally {
      setManagementLoading(false);
    }
  };

  const toggleRegistration = async () => {
    try {
      setManagementLoading(true);
      console.log('Admin Dashboard: Toggling registration from:', registrationSettings.enabled, 'to:', !registrationSettings.enabled);
      
      const newEnabled = !registrationSettings.enabled;
      
      // Call the registration service
      await registrationService.toggleRegistration(newEnabled, userData?.email || 'admin');
      
      // Update local state immediately
      setRegistrationSettings(prev => ({ ...prev, enabled: newEnabled }));
      
      toast({
        title: 'Success',
        description: `Registration ${newEnabled ? 'enabled' : 'disabled'} successfully`
      });
      
      console.log('Admin Dashboard: Registration toggle successful, new state:', newEnabled);
      
      // Refresh the settings to ensure consistency
      setTimeout(() => {
        fetchRegistrationSettings();
      }, 1000);
      
    } catch (error) {
      console.error('Admin Dashboard: Error toggling registration:', error);
      
      // More specific error message
      let errorMessage = 'Failed to toggle registration status';
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check your admin privileges.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setManagementLoading(false);
    }
  };

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
    setInlineEditingAssignment(assignment.id);
    setInlineEditData({
      ...assignment,
      date: assignment.date,
      day_number: assignment.day_number,
      easy_question: { ...assignment.easy_question },
      medium_question: { ...assignment.medium_question },
      hard_question: { ...assignment.hard_question }
    });
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingAssignment(null);
    setInlineEditData(null);
  };

  const handleSaveInlineEdit = async () => {
    if (!inlineEditData) return;

    try {
      // Get current user for created_by field
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast({
          title: 'Error',
          description: 'You must be logged in to save assignments'
        });
        return;
      }

      // Validate required fields
      if (!inlineEditData.date) {
        toast({
          title: 'Error',
          description: 'Assignment date is required'
        });
        return;
      }

      if (!inlineEditData.day_number || inlineEditData.day_number < 1 || inlineEditData.day_number > 55) {
        toast({
          title: 'Error',
          description: 'Day number must be between 1 and 55'
        });
        return;
      }

      // Ensure questions have all required fields with defaults if empty
      const processQuestion = (question: any) => ({
        title: question?.title || '',
        description: question?.description || '',
        link: question?.link || '',
        tags: Array.isArray(question?.tags) ? question.tags : [],
        difficulty: question?.difficulty || 'easy'
      });

      // If the date changed, we need to handle potential conflicts
      const originalAssignment = combinedAssignments.find(a => a.id === inlineEditingAssignment);
      const dateChanged = originalAssignment && originalAssignment.date !== inlineEditData.date;

      // Save the assignment to the new date
      await assignmentsService.setAssignment(inlineEditData.date, {
        date: inlineEditData.date,
        day_number: inlineEditData.day_number,
        easy_question: processQuestion(inlineEditData.easy_question),
        medium_question: processQuestion(inlineEditData.medium_question),
        hard_question: processQuestion(inlineEditData.hard_question),
        created_by: currentUser.uid
      });

      // If date changed, remove the assignment from the old date
      if (dateChanged && originalAssignment) {
        try {
          await assignmentsService.deleteAssignment(originalAssignment.id);
        } catch (error) {
          console.warn('Could not delete old assignment:', error);
          // Non-critical error, continue with success message
        }
      }

      toast({
        title: 'Success',
        description: `Assignment ${dateChanged ? 'moved to new date and ' : ''}updated successfully`
      });

      // Refresh assignments to reflect changes
      await fetchAssignments();
      setInlineEditingAssignment(null);
      setInlineEditData(null);

    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignment. Please try again.'
      });
    }
  };

  const handleInlineQuestionChange = (questionType: 'easy' | 'medium' | 'hard', field: string, value: any) => {
    if (!inlineEditData) return;
    
    setInlineEditData({
      ...inlineEditData,
      [`${questionType}_question`]: {
        ...inlineEditData[`${questionType}_question`],
        [field]: field === 'tags' && typeof value === 'string' 
          ? value.split(',').map(tag => tag.trim()).filter(tag => tag)
          : value
      }
    });
  };

  const handleAddQuestion = (assignment: any, questionType: 'easy' | 'medium' | 'hard') => {
    setEditingAssignment(assignment);
    setEditingQuestionType(questionType);
    setTempQuestionData({
      title: '',
      description: '',
      link: '',
      tags: []
    });
    setIsEditDialogOpen(true);
  };

  const handleEditQuestion = (assignment: any, questionType: 'easy' | 'medium' | 'hard') => {
    setEditingAssignment(assignment);
    setEditingQuestionType(questionType);
    
    const questionData = assignment[`${questionType}_question`];
    setTempQuestionData({
      title: questionData.title || '',
      description: questionData.description || '',
      link: questionData.link || '',
      tags: questionData.tags || []
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveAssignmentChanges = async () => {
    if (!editingAssignment) return;

    try {
      const updatedAssignment = { ...editingAssignment };
      
      // If editing date
      if (tempAssignmentDate && tempAssignmentDate !== editingAssignment.date) {
        // Calculate new day number based on new date
        const newDate = new Date(tempAssignmentDate);
        const daysDiff = Math.floor((newDate.getTime() - challengeStartDate.getTime()) / (1000 * 60 * 60 * 24));
        const newDayNumber = Math.max(1, Math.min(55, daysDiff + 1));
        
        updatedAssignment.date = tempAssignmentDate;
        updatedAssignment.day_number = newDayNumber;
      }

      // If editing a question
      if (editingQuestionType && tempQuestionData.title) {
        updatedAssignment[`${editingQuestionType}_question`] = {
          ...tempQuestionData,
          tags: Array.isArray(tempQuestionData.tags) ? tempQuestionData.tags : 
                typeof tempQuestionData.tags === 'string' ? (tempQuestionData.tags as string).split(',').map(tag => tag.trim()) : []
        };
      }

      // Get current user for created_by field
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast({
          title: 'Error',
          description: 'You must be logged in to save assignments'
        });
        return;
      }

      await assignmentsService.setAssignment(updatedAssignment.date, {
        date: updatedAssignment.date,
        day_number: updatedAssignment.day_number,
        easy_question: {
          ...updatedAssignment.easy_question,
          difficulty: 'easy' as const
        },
        medium_question: {
          ...updatedAssignment.medium_question,
          difficulty: 'medium' as const
        },
        hard_question: {
          ...updatedAssignment.hard_question,
          difficulty: 'hard' as const
        },
        created_by: currentUser.uid
      });

      toast({
        title: 'Success',
        description: 'Assignment updated successfully'
      });

      await fetchAssignments();
      setIsEditDialogOpen(false);
      setEditingAssignment(null);
      setEditingQuestionType(null);
      setTempQuestionData({ title: '', description: '', link: '', tags: [] });
      setTempAssignmentDate('');

    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignment'
      });
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

  // Collision detection function for exam dates and assignment dates
  const checkDateCollisions = () => {
    if (!examSettings || !examSettings.active || !examSettings.start_date || !examSettings.end_date) {
      return [];
    }

    const examStart = new Date(examSettings.start_date);
    const examEnd = new Date(examSettings.end_date);
    const collisions: string[] = [];

    // Check if any assignments fall within exam period
    combinedAssignments.forEach(assignment => {
      if (assignment.date) {
        const assignmentDate = new Date(assignment.date);
        if (assignmentDate >= examStart && assignmentDate <= examEnd) {
          collisions.push(assignment.date);
        }
      }
    });

    return collisions;
  };

  const dateCollisions = checkDateCollisions();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'submissions', label: 'Submissions', icon: BookOpen },
              { id: 'assignments', label: 'Assignments', icon: Calendar },
              { id: 'questions', label: 'Questions', icon: Code },
              { id: 'exams', label: 'Exam Management', icon: GraduationCap },
              { id: 'management', label: 'Management', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t space-y-2">
          <Button 
            variant="outline" 
            onClick={fetchData}
            disabled={loading}
            className="w-full flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button variant="outline" onClick={logout} className="w-full">
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
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
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">Assignments Overview</h2>
                <p className="text-muted-foreground">
                  Complete management of all coding challenges across the 55-day program (45 main days + 10 extra)
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => {
                    // Find the next available day number
                    const nextDayNumber = Math.max(...combinedAssignments.map(a => a.day_number || 0)) + 1;
                    
                    // Create a new assignment card for the next day
                    const newAssignment = {
                      id: `new-day-${nextDayNumber}`,
                      day_number: nextDayNumber,
                      date: '', // Empty date - admin will assign
                      easy_question: {
                        title: '',
                        description: '',
                        link: '',
                        tags: []
                      },
                      medium_question: {
                        title: '',
                        description: '',
                        link: '',
                        tags: []
                      },
                      hard_question: {
                        title: '',
                        description: '',
                        link: '',
                        tags: []
                      },
                      fromFirebase: false
                    };
                    
                    // Add to the assignments list and start editing
                    setAllGeneratedDays(prev => [...prev, newAssignment]);
                    setMaxDays(prev => Math.max(prev, nextDayNumber));
                    
                    // Automatically start editing the new assignment
                    handleEditAssignment(newAssignment);
                    
                    toast({
                      title: 'New Assignment Created',
                      description: `Day ${nextDayNumber} assignment card created. You can now add questions and set the date.`
                    });
                  }}
                >
                  <Plus className="w-4 h-4" />
                  New Assignment
                </Button>
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{combinedAssignments.length}</p>
                    <p className="text-sm text-muted-foreground">Total Days</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {combinedAssignments.filter(a => a.easy_question.title).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Easy Questions</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {combinedAssignments.filter(a => a.medium_question.title).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Medium Questions</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Star className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {combinedAssignments.filter(a => a.hard_question.title).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Hard Questions</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round((combinedAssignments.filter(a => a.easy_question.title || a.medium_question.title || a.hard_question.title).length / 45) * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Main Program Complete</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Assignments List */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">All Assignments</CardTitle>
                    <CardDescription>
                      Detailed view of all assignments with question breakdowns by difficulty
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Bulk Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {combinedAssignments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((assignment) => {
                      const questions = {
                        easy: assignment.easy_question.title ? assignment.easy_question : null,
                        medium: assignment.medium_question.title ? assignment.medium_question : null,
                        hard: assignment.hard_question.title ? assignment.hard_question : null
                      };

                      const totalQuestions = Object.values(questions).filter(Boolean).length;

                      return (
                        <div key={assignment.id} className="group border-2 border-muted rounded-xl p-6 hover:border-primary/30 transition-all hover:shadow-lg bg-card">
                          {/* Assignment Header */}
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                                <span className="text-lg font-bold text-primary">
                                  {inlineEditingAssignment === assignment.id ? inlineEditData?.day_number : assignment.day_number}
                                </span>
                              </div>
                              <div className="flex-1">
                                {inlineEditingAssignment === assignment.id ? (
                                  // Edit Mode Header
                                  <div className="space-y-3">
                                    <h3 className="text-xl font-bold text-foreground mb-1">
                                      Day {inlineEditData?.day_number} Assignment - Editing
                                    </h3>
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <Label className="text-sm font-medium">Date:</Label>
                                        <Input
                                          type="date"
                                          value={inlineEditData?.date || ''}
                                          onChange={(e) => {
                                            setInlineEditData({
                                              ...inlineEditData,
                                              date: e.target.value
                                            });
                                          }}
                                          className="w-40 h-8 text-sm"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Hash className="w-4 h-4" />
                                        <Label className="text-sm font-medium">Day Number:</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          max="55"
                                          value={inlineEditData?.day_number || 1}
                                          onChange={(e) => {
                                            setInlineEditData({
                                              ...inlineEditData,
                                              day_number: parseInt(e.target.value) || 1
                                            });
                                          }}
                                          className="w-20 h-8 text-sm"
                                        />
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const daysDiff = Math.floor((new Date(inlineEditData?.date || '').getTime() - challengeStartDate.getTime()) / (1000 * 60 * 60 * 24));
                                          const calculatedDay = Math.max(1, Math.min(55, daysDiff + 1));
                                          setInlineEditData({
                                            ...inlineEditData,
                                            day_number: calculatedDay
                                          });
                                        }}
                                        className="h-8 text-xs"
                                      >
                                        Auto-Calculate Day
                                      </Button>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <BookOpen className="w-4 h-4" />
                                      <span>{totalQuestions} Question{totalQuestions !== 1 ? 's' : ''}</span>
                                    </div>
                                  </div>
                                ) : (
                                  // View Mode Header
                                  <div>
                                    <h3 className="text-xl font-bold text-foreground mb-1">
                                      Day {assignment.day_number} Assignment
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="font-medium">
                                          {assignment.date || 'No date assigned'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <BookOpen className="w-4 h-4" />
                                        <span>{totalQuestions} Question{totalQuestions !== 1 ? 's' : ''}</span>
                                      </div>
                                      {assignment.date && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          <span>Created {new Date(assignment.date).toLocaleDateString()}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {inlineEditingAssignment === assignment.id ? (
                                // Edit Mode Buttons
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSaveInlineEdit}
                                    className="h-9 px-4 text-green-600 border-green-200 hover:bg-green-50"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelInlineEdit}
                                    className="h-9 px-4 text-gray-600 hover:bg-gray-50"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                // View Mode Buttons
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditAssignment(assignment)}
                                    className="h-9 px-4"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Questions Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Easy Question */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                                <span className="text-sm font-semibold text-green-700">Easy Question</span>
                              </div>
                              
                              {inlineEditingAssignment === assignment.id ? (
                                // Edit Mode for Easy Question
                                <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-green-800">Title</Label>
                                    <Input
                                      value={inlineEditData?.easy_question?.title || ''}
                                      onChange={(e) => handleInlineQuestionChange('easy', 'title', e.target.value)}
                                      placeholder="Question title..."
                                      className="h-8 text-sm bg-white border-green-200"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-green-800">Description</Label>
                                    <Textarea
                                      value={inlineEditData?.easy_question?.description || ''}
                                      onChange={(e) => handleInlineQuestionChange('easy', 'description', e.target.value)}
                                      placeholder="Question description..."
                                      className="h-16 text-sm bg-white border-green-200 resize-none"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-green-800">Link</Label>
                                    <Input
                                      value={inlineEditData?.easy_question?.link || ''}
                                      onChange={(e) => handleInlineQuestionChange('easy', 'link', e.target.value)}
                                      placeholder="Problem link..."
                                      className="h-8 text-sm bg-white border-green-200"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-green-800">Tags (comma-separated)</Label>
                                    <Input
                                      value={Array.isArray(inlineEditData?.easy_question?.tags) ? inlineEditData.easy_question.tags.join(', ') : ''}
                                      onChange={(e) => handleInlineQuestionChange('easy', 'tags', e.target.value)}
                                      placeholder="Array, Hash Table, etc..."
                                      className="h-8 text-sm bg-white border-green-200"
                                    />
                                  </div>
                                </div>
                              ) : (
                                // View Mode for Easy Question
                                questions.easy ? (
                                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                                    <h4 className="font-semibold text-green-900 text-sm">
                                      {questions.easy.title}
                                    </h4>
                                    <p className="text-xs text-green-700 line-clamp-2">
                                      {questions.easy.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {questions.easy.tags.slice(0, 3).map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {questions.easy.tags.length > 3 && (
                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                          +{questions.easy.tags.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(questions.easy!.link, '_blank')}
                                        className="h-7 px-2 text-xs border-green-300 text-green-700 hover:bg-green-100"
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        View Problem
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditQuestion(assignment, 'easy')}
                                        className="h-7 px-2 text-xs border-green-300 text-green-700 hover:bg-green-100"
                                      >
                                        <Edit className="w-3 h-3 mr-1" />
                                        Edit
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-center">
                                    <p className="text-sm text-gray-500 mb-2">No easy question assigned</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddQuestion(assignment, 'easy')}
                                      className="h-7 px-3 text-xs"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Question
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>

                            {/* Medium Question */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                                <span className="text-sm font-semibold text-yellow-700">Medium Question</span>
                              </div>
                              
                              {inlineEditingAssignment === assignment.id ? (
                                // Edit Mode for Medium Question
                                <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-yellow-800">Title</Label>
                                    <Input
                                      value={inlineEditData?.medium_question?.title || ''}
                                      onChange={(e) => handleInlineQuestionChange('medium', 'title', e.target.value)}
                                      placeholder="Question title..."
                                      className="h-8 text-sm bg-white border-yellow-200"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-yellow-800">Description</Label>
                                    <Textarea
                                      value={inlineEditData?.medium_question?.description || ''}
                                      onChange={(e) => handleInlineQuestionChange('medium', 'description', e.target.value)}
                                      placeholder="Question description..."
                                      className="h-16 text-sm bg-white border-yellow-200 resize-none"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-yellow-800">Link</Label>
                                    <Input
                                      value={inlineEditData?.medium_question?.link || ''}
                                      onChange={(e) => handleInlineQuestionChange('medium', 'link', e.target.value)}
                                      placeholder="Problem link..."
                                      className="h-8 text-sm bg-white border-yellow-200"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-yellow-800">Tags (comma-separated)</Label>
                                    <Input
                                      value={Array.isArray(inlineEditData?.medium_question?.tags) ? inlineEditData.medium_question.tags.join(', ') : ''}
                                      onChange={(e) => handleInlineQuestionChange('medium', 'tags', e.target.value)}
                                      placeholder="Hash Table, String, etc..."
                                      className="h-8 text-sm bg-white border-yellow-200"
                                    />
                                  </div>
                                </div>
                              ) : (
                                // View Mode for Medium Question
                                questions.medium ? (
                                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                                    <h4 className="font-semibold text-yellow-900 text-sm">
                                      {questions.medium.title}
                                    </h4>
                                    <p className="text-xs text-yellow-700 line-clamp-2">
                                      {questions.medium.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {questions.medium.tags.slice(0, 3).map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {questions.medium.tags.length > 3 && (
                                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                          +{questions.medium.tags.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(questions.medium!.link, '_blank')}
                                        className="h-7 px-2 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        View Problem
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditQuestion(assignment, 'medium')}
                                        className="h-7 px-2 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                                      >
                                        <Edit className="w-3 h-3 mr-1" />
                                        Edit
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-center">
                                    <p className="text-sm text-gray-500 mb-2">No medium question assigned</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddQuestion(assignment, 'medium')}
                                      className="h-7 px-3 text-xs"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Question
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>

                            {/* Hard Question */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full" />
                                <span className="text-sm font-semibold text-red-700">Hard Question</span>
                              </div>
                              
                              {inlineEditingAssignment === assignment.id ? (
                                // Edit Mode for Hard Question
                                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-red-800">Title</Label>
                                    <Input
                                      value={inlineEditData?.hard_question?.title || ''}
                                      onChange={(e) => handleInlineQuestionChange('hard', 'title', e.target.value)}
                                      placeholder="Question title..."
                                      className="h-8 text-sm bg-white border-red-200"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-red-800">Description</Label>
                                    <Textarea
                                      value={inlineEditData?.hard_question?.description || ''}
                                      onChange={(e) => handleInlineQuestionChange('hard', 'description', e.target.value)}
                                      placeholder="Question description..."
                                      className="h-16 text-sm bg-white border-red-200 resize-none"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-red-800">Link</Label>
                                    <Input
                                      value={inlineEditData?.hard_question?.link || ''}
                                      onChange={(e) => handleInlineQuestionChange('hard', 'link', e.target.value)}
                                      placeholder="Problem link..."
                                      className="h-8 text-sm bg-white border-red-200"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-red-800">Tags (comma-separated)</Label>
                                    <Input
                                      value={Array.isArray(inlineEditData?.hard_question?.tags) ? inlineEditData.hard_question.tags.join(', ') : ''}
                                      onChange={(e) => handleInlineQuestionChange('hard', 'tags', e.target.value)}
                                      placeholder="String, Dynamic Programming, etc..."
                                      className="h-8 text-sm bg-white border-red-200"
                                    />
                                  </div>
                                </div>
                              ) : (
                                // View Mode for Hard Question
                                questions.hard ? (
                                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                                    <h4 className="font-semibold text-red-900 text-sm">
                                      {questions.hard.title}
                                    </h4>
                                    <p className="text-xs text-red-700 line-clamp-2">
                                      {questions.hard.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {questions.hard.tags.slice(0, 3).map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs bg-red-100 text-red-800">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {questions.hard.tags.length > 3 && (
                                        <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                                          +{questions.hard.tags.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(questions.hard!.link, '_blank')}
                                        className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-100"
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        View Problem
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditQuestion(assignment, 'hard')}
                                        className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-100"
                                      >
                                        <Edit className="w-3 h-3 mr-1" />
                                        Edit
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-center">
                                    <p className="text-sm text-gray-500 mb-2">No hard question assigned</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddQuestion(assignment, 'hard')}
                                      className="h-7 px-3 text-xs"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Question
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* Assignment Footer */}
                          <div className="mt-6 pt-4 border-t border-muted flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>0 submissions</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>0% completion rate</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                <span>Average difficulty: {
                                  questions.easy && questions.medium && questions.hard ? 'Mixed' :
                                  questions.hard ? 'Hard' :
                                  questions.medium ? 'Medium' :
                                  questions.easy ? 'Easy' : 'None'
                                }</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-xs"
                              >
                                <BarChart3 className="w-3 h-3 mr-1" />
                                View Stats
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-xs"
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Notify Students
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Assignment Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuestionType 
                  ? `${editingQuestionType === 'easy' ? 'Easy' : editingQuestionType === 'medium' ? 'Medium' : 'Hard'} Question - Day ${editingAssignment?.day_number}`
                  : `Edit Assignment - Day ${editingAssignment?.day_number}`
                }
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Date Editor */}
              {!editingQuestionType && (
                <div className="space-y-3">
                  <Label htmlFor="assignment-date">Assignment Date</Label>
                  <Input
                    id="assignment-date"
                    type="date"
                    value={tempAssignmentDate}
                    onChange={(e) => setTempAssignmentDate(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Day number will be automatically calculated based on the challenge start date
                  </p>
                </div>
              )}

              {/* Question Editor */}
              {editingQuestionType && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question-title">Question Title</Label>
                    <Input
                      id="question-title"
                      placeholder="Enter question title"
                      value={tempQuestionData.title}
                      onChange={(e) => setTempQuestionData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="question-description">Description</Label>
                    <Textarea
                      id="question-description"
                      placeholder="Enter question description"
                      rows={4}
                      value={tempQuestionData.description}
                      onChange={(e) => setTempQuestionData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="question-link">Problem Link</Label>
                    <Input
                      id="question-link"
                      placeholder="https://leetcode.com/problems/..."
                      value={tempQuestionData.link}
                      onChange={(e) => setTempQuestionData(prev => ({ ...prev, link: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="question-tags">Tags (comma-separated)</Label>
                    <Input
                      id="question-tags"
                      placeholder="Array, Hash Table, Two Pointers"
                      value={Array.isArray(tempQuestionData.tags) ? tempQuestionData.tags.join(', ') : tempQuestionData.tags}
                      onChange={(e) => setTempQuestionData(prev => ({ 
                        ...prev, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                      }))}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingAssignment(null);
                    setEditingQuestionType(null);
                    setTempQuestionData({ title: '', description: '', link: '', tags: [] });
                    setTempAssignmentDate('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveAssignmentChanges}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Questions Management Section */}
        {selectedTab === 'questions' && (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">Questions Management</h2>
                <p className="text-muted-foreground">
                  Create, manage, and organize coding challenges for the 45-day program
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Quick Add Question
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{assignments.length}</p>
                    <p className="text-sm text-muted-foreground">Total Assignments</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {assignments.filter(a => a.easy_question.title || a.medium_question.title || a.hard_question.title).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Questions</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {45 - assignments.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Pending Days</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round((assignments.length / 45) * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Progress</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Action Tabs */}
            <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg w-fit">
              <Button
                variant={selectedDifficulty === 'easy' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedDifficulty('easy')}
                className="flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Create Assignment
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Bulk Operations
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Assignment Creator - Left Column */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Daily Assignment Creator</CardTitle>
                        <CardDescription>
                          Create structured coding challenges with multiple difficulty levels
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Day {assignmentDayNumber}/45
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Assignment Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Assignment Date</Label>
                        <Input
                          type="date"
                          value={selectedAssignmentDate}
                          onChange={(e) => setSelectedAssignmentDate(e.target.value)}
                          className="border-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Primary Difficulty</Label>
                        <Select value={selectedDifficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setSelectedDifficulty(value)}>
                          <SelectTrigger className="border-2">
                            <SelectValue placeholder="Select primary difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span>Easy</span>
                                <Badge variant="secondary" className="ml-2 text-xs">Beginner</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span>Medium</span>
                                <Badge variant="secondary" className="ml-2 text-xs">Intermediate</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="hard">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span>Hard</span>
                                <Badge variant="secondary" className="ml-2 text-xs">Advanced</Badge>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Question Builder */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b pb-3">
                        <Badge className={`${
                          selectedDifficulty === 'easy' ? 'bg-green-600' : 
                          selectedDifficulty === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                        } text-white`}>
                          {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} Question
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Primary challenge for this assignment
                        </span>
                      </div>

                      <div className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Question Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="e.g., Two Sum, Valid Parentheses..."
                              value={easyQuestion.title}
                              onChange={(e) => setEasyQuestion(prev => ({ ...prev, title: e.target.value }))}
                              className="border-2 focus:border-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Platform Link <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="https://leetcode.com/problems/..."
                              value={easyQuestion.link}
                              onChange={(e) => setEasyQuestion(prev => ({ ...prev, link: e.target.value }))}
                              className="border-2 focus:border-primary"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Problem Description <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            placeholder="Provide a clear and detailed description of the problem. Include examples, constraints, and expected output format..."
                            value={easyQuestion.description}
                            onChange={(e) => setEasyQuestion(prev => ({ ...prev, description: e.target.value }))}
                            rows={4}
                            className="border-2 focus:border-primary resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Tags & Topics</Label>
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2 min-h-[42px] p-3 border-2 border-dashed border-muted rounded-lg bg-muted/30">
                              {easyQuestion.tags.length === 0 ? (
                                <span className="text-sm text-muted-foreground">No tags added yet</span>
                              ) : (
                                easyQuestion.tags.map((tag, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors"
                                    onClick={() => setEasyQuestion(prev => ({
                                      ...prev,
                                      tags: prev.tags.filter((_, i) => i !== index)
                                    }))}
                                  >
                                    {tag}
                                    <X className="w-3 h-3 ml-1" />
                                  </Badge>
                                ))
                              )}
                            </div>
                            <Input
                              placeholder="Add tags (Array, Hash Table, Two Pointers, etc.) - Press Enter to add"
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
                              className="border-2 focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4" />
                        <span>All required fields must be filled</span>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          onClick={handleResetAssignmentForm}
                          className="flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reset
                        </Button>
                        <Button 
                          onClick={handleCreateAssignment}
                          disabled={createAssignmentLoading || !easyQuestion.title || !easyQuestion.link || !easyQuestion.description}
                          className="flex items-center gap-2"
                        >
                          {createAssignmentLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Create Assignment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assignment Calendar & Quick Actions - Right Column */}
              <div className="space-y-6">
                {/* Calendar Overview */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Assignment Calendar</CardTitle>
                    <CardDescription>Track progress across the 45-day challenge</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-7 gap-1 text-xs text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                          <div key={day} className="p-2 font-medium text-muted-foreground">{day}</div>
                        ))}
                        {Array.from({ length: 35 }, (_, i) => {
                          const hasAssignment = assignments.some(a => new Date(a.date).getDate() === i + 1);
                          return (
                            <div
                              key={i}
                              className={`p-2 text-xs rounded ${
                                hasAssignment 
                                  ? 'bg-green-100 text-green-800 font-medium' 
                                  : 'text-muted-foreground hover:bg-muted'
                              } cursor-pointer transition-colors`}
                            >
                              {i + 1}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-100 rounded" />
                          <span>Has Assignment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-muted rounded" />
                          <span>Available</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Import from Template
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Code className="w-4 h-4 mr-2" />
                      Bulk Create
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Defaults
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {assignments.slice(0, 3).map((assignment) => (
                        <div key={assignment.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              Day {assignment.day_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {assignment.date}
                            </p>
                          </div>
                        </div>
                      ))}
                      {assignments.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No recent activity
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Assignments Table */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">All Assignments</CardTitle>
                    <CardDescription>
                      Comprehensive view of all created assignments with management options
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No assignments created yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your 45-day coding challenge by creating your first assignment.
                    </p>
                    <Button onClick={() => setSelectedAssignmentDate(new Date().toISOString().split('T')[0])}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Assignment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignments.map((assignment) => {
                      const questions = [
                        assignment.easy_question.title && { ...assignment.easy_question, level: 'Easy', color: 'bg-green-500' },
                        assignment.medium_question.title && { ...assignment.medium_question, level: 'Medium', color: 'bg-yellow-500' },
                        assignment.hard_question.title && { ...assignment.hard_question, level: 'Hard', color: 'bg-red-500' }
                      ].filter(Boolean);

                      return (
                        <div key={assignment.id} className="group p-4 border-2 border-muted rounded-lg hover:border-primary/30 transition-all hover:shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <span className="text-sm font-bold text-primary">
                                    {assignment.day_number}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold">{assignment.date}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {questions.length > 0 ? (
                                      questions.map((question: any, index) => (
                                        <Badge key={index} className={`${question.color} text-white text-xs px-2 py-1`}>
                                          {question.level}
                                        </Badge>
                                      ))
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">
                                        No questions
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {questions.length > 0 && (
                                <div className="hidden md:block">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    {questions[0].title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {questions[0].tags.slice(0, 3).join(', ')}
                                    {questions[0].tags.length > 3 && '...'}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAssignment(assignment)}
                                className="h-8 px-3"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(questions[0]?.link, '_blank')}
                                disabled={!questions[0]?.link}
                                className="h-8 px-3"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAssignment(assignment.id!)}
                                className="h-8 px-3 text-red-600 hover:text-red-700 hover:border-red-200"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Exam Management Section */}
        {selectedTab === 'exams' && (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">Exam Management</h2>
                <p className="text-muted-foreground">
                  Configure exam periods to pause submissions and protect student streaks
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleToggleExamMode}
                  disabled={examLoading}
                  variant={examSettings?.active ? "destructive" : "default"}
                  className="flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  {examSettings?.active ? 'Deactivate Exam Mode' : 'Activate Exam Mode'}
                </Button>
              </div>
            </div>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Current Exam Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      examSettings?.active 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                      {examSettings?.active ? 'Exam Mode Active' : 'Normal Mode'}
                    </div>
                    {examSettings?.active && examSettings.start_date && examSettings.end_date && (
                      <div className="text-sm text-muted-foreground">
                        {examSettings.start_date} to {examSettings.end_date}
                      </div>
                    )}
                  </div>
                  
                  {examSettings?.active && (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm text-blue-800">
                        {examSettings.message}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Date Collision Warning */}
            {dateCollisions.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    Assignment Date Conflicts Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-red-700">
                      The following assignment dates conflict with your exam period 
                      ({examSettings?.start_date} to {examSettings?.end_date}):
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {dateCollisions.map(date => (
                        <div key={date} className="px-3 py-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                          {new Date(date).toLocaleDateString()}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-red-600">
                      <strong>Recommendation:</strong> Consider moving these assignments to different dates 
                      or adjusting your exam period to avoid conflicts.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Exam Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Period Configuration</CardTitle>
                <CardDescription>
                  Set exam dates and configure how submissions are handled during exam periods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={examFormData.start_date}
                      onChange={(e) => setExamFormData(prev => ({
                        ...prev,
                        start_date: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={examFormData.end_date}
                      onChange={(e) => setExamFormData(prev => ({
                        ...prev,
                        end_date: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Exam Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Message to show to students during exam period"
                    value={examFormData.message}
                    onChange={(e) => setExamFormData(prev => ({
                      ...prev,
                      message: e.target.value
                    }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pause_submissions"
                    checked={examFormData.pause_submissions_count}
                    onChange={(e) => setExamFormData(prev => ({
                      ...prev,
                      pause_submissions_count: e.target.checked
                    }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="pause_submissions" className="text-sm">
                    Pause submission counting (protect streaks during exam period)
                  </Label>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Button
                    onClick={handleUpdateExamSettings}
                    disabled={examLoading}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {examLoading ? 'Saving...' : 'Save Exam Settings'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={fetchExamSettings}
                    disabled={examLoading}
                  >
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Scheduling Info */}
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Assignment Scheduling</CardTitle>
                <CardDescription>
                  How the new scheduling system works with exam periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Assignment Visibility</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Students only see assignments when you assign specific dates</li>
                        <li>• No more automatic daily assignments</li>
                        <li>• You control exactly when each assignment becomes available</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Streak Protection</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Streaks are not broken during exam periods</li>
                        <li>• Only assigned dates count for streak calculation</li>
                        <li>• Gap days (no assignments) don't break streaks</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <strong>Pro Tip:</strong> Use the Assignments tab to assign specific dates to your Day 1-45 entries. 
                      Students will only see assignments on the dates you choose, making it perfect for scheduling around exams!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Management Tab */}
        {selectedTab === 'management' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">System Management</h1>
                <p className="text-muted-foreground">
                  Control registration settings and user access
                </p>
              </div>
            </div>

            {/* Registration Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Registration Control
                </CardTitle>
                <CardDescription>
                  Enable or disable new user registrations to the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Registration Toggle */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 gap-4">
                  <div className="space-y-2 flex-1">
                    <h4 className="text-xl font-semibold text-slate-900">Registration Status</h4>
                    <p className="text-sm text-slate-600 max-w-lg">
                      {registrationSettings.enabled 
                        ? 'New users can register and join the 45 Days of Code challenge' 
                        : 'Registration is currently disabled - no new users can sign up'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <Badge 
                      variant={registrationSettings.enabled ? "default" : "destructive"}
                      className="font-medium px-4 py-2 text-sm"
                    >
                      {registrationSettings.enabled ? '✅ Open' : '🔒 Closed'}
                    </Badge>
                    <Button
                      onClick={toggleRegistration}
                      disabled={managementLoading}
                      variant={registrationSettings.enabled ? "destructive" : "default"}
                      size="lg"
                      className="min-w-[150px] font-medium"
                    >
                      {managementLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Updating...
                        </div>
                      ) : (
                        registrationSettings.enabled ? 'Close Registration' : 'Open Registration'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Registration Statistics
                </CardTitle>
                <CardDescription>
                  Current platform usage and user metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-blue-900">Total Students</h4>
                    </div>
                    <p className="text-3xl font-bold text-blue-600 mb-1">{students.length}</p>
                    <p className="text-sm text-blue-700">Registered users</p>
                  </div>

                  <div className="bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-green-900">Active Students</h4>
                    </div>
                    <p className="text-3xl font-bold text-green-600 mb-1">{stats.activeStudents}</p>
                    <p className="text-sm text-green-700">
                      {students.length > 0 ? ((stats.activeStudents / students.length) * 100).toFixed(1) : 0}% activity rate
                    </p>
                  </div>

                  <div className={`p-6 rounded-xl border shadow-sm ${
                    registrationSettings.enabled 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${
                        registrationSettings.enabled 
                          ? 'bg-emerald-100' 
                          : 'bg-red-100'
                      }`}>
                        <Settings className={`w-6 h-6 ${
                          registrationSettings.enabled ? 'text-emerald-600' : 'text-red-600'
                        }`} />
                      </div>
                      <h4 className={`font-semibold ${
                        registrationSettings.enabled ? 'text-emerald-900' : 'text-red-900'
                      }`}>Registration</h4>
                    </div>
                    <p className={`text-3xl font-bold mb-1 ${
                      registrationSettings.enabled ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {registrationSettings.enabled ? 'Open' : 'Closed'}
                    </p>
                    <p className={`text-sm ${
                      registrationSettings.enabled ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {registrationSettings.enabled ? 'Accepting new users' : 'Registration disabled'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </main>
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

