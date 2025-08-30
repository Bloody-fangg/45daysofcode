import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, type UserData } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import Papa from 'papaparse';
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
  GraduationCap,
  Ban,
  Shield,
  MessageSquare,
  FileText,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { 
  usersService, 
  submissionsService, 
  assignmentsService,
  notificationsService,
  examCooldownService,
  scheduleService,
  registrationService,
  qaService,
  type Submission,
  type ExamCooldown,
  type ProgramExamCooldown,
  type RegistrationSettings,
  type StudentQuestion
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
  students: UserData[];
}

const SubmissionReviewModal: React.FC<SubmissionReviewModalProps> = ({ 
  submission, 
  onClose, 
  onApprove, 
  onReject,
  students
}) => {
  const [feedback, setFeedback] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  if (!submission) return null;

  const getStudentDataForSubmission = (submission: Submission) => {
    return students.find(s => s.uid === submission.student_uid);
  };

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

          {/* Enhanced Student Statistics */}
          <div className="bg-muted/30 rounded-lg p-4 border">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Student Performance Overview
            </h3>
            {(() => {
              const studentData = getStudentDataForSubmission(submission);
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{studentData?.streak_count || 0}</div>
                    <div className="text-xs text-muted-foreground">Current Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{studentData?.enrollment_no || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Enrollment</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{studentData?.streak_breaks || 0}</div>
                    <div className="text-xs text-muted-foreground">Streak Breaks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{(studentData as any)?.course || 'Not Set'}</div>
                    <div className="text-xs text-muted-foreground">Course</div>
                  </div>
                </div>
              );
            })()}
            
            {/* Attempts Breakdown */}
            <div className="mt-4 pt-3 border-t">
              <div className="text-sm font-medium mb-2">Problem Attempts:</div>
              {(() => {
                const studentData = getStudentDataForSubmission(submission);
                return (
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-medium text-green-700">{studentData?.attempts?.easy || 0}</div>
                      <div className="text-xs text-green-600">Easy</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="font-medium text-yellow-700">{studentData?.attempts?.medium || 0}</div>
                      <div className="text-xs text-yellow-600">Medium</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="font-medium text-red-700">{studentData?.attempts?.hard || 0}</div>
                      <div className="text-xs text-red-600">Hard</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-medium text-blue-700">{studentData?.attempts?.choice || 0}</div>
                      <div className="text-xs text-blue-600">Choice</div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Account Status */}
            {(() => {
              const studentData = getStudentDataForSubmission(submission);
              return studentData?.disqualified ? (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
                    <Badge variant="destructive">DISQUALIFIED</Badge>
                    {(studentData as any)?.ban_reason && (
                      <span className="text-sm text-red-700">
                        Reason: {(studentData as any).ban_reason}
                      </span>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
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
  const [selectedTab, setSelectedTab] = useState<'students' | 'submissions' | 'assignments' | 'questions' | 'qa' | 'exams' | 'management'>('students');

  // Ban management states
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banLoading, setBanLoading] = useState(false);
  const [selectedSummationDay, setSelectedSummationDay] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedDaySubmissions, setSelectedDaySubmissions] = useState<any[]>([]);
  const [showDaySubmissionsModal, setShowDaySubmissionsModal] = useState(false);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [daySubmissionsLoading, setDaySubmissionsLoading] = useState(false);

  // Filter states
  const [courseFilter, setCourseFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
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

  // Assignment stats states
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedAssignmentForStats, setSelectedAssignmentForStats] = useState<any>(null);
  const [assignmentStats, setAssignmentStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

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

  // Program-specific exam management states
  const [programExamCooldowns, setProgramExamCooldowns] = useState<ProgramExamCooldown[]>([]);
  const [programExamFormData, setProgramExamFormData] = useState({
    program: '',
    semester: '',
    section: '',
    active: false,
    start_date: '',
    end_date: '',
    pause_submissions_count: true,
    message: "📚 All The Best For Your Exams! Your streak is paused during this period."
  });
  const [showProgramExamForm, setShowProgramExamForm] = useState(false);
  const [editingProgramExam, setEditingProgramExam] = useState<string | null>(null);

  // QA management states
  const [studentQuestions, setStudentQuestions] = useState<StudentQuestion[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [selectedQuestionForAnswer, setSelectedQuestionForAnswer] = useState<StudentQuestion | null>(null);
  const [showAnswerDialog, setShowAnswerDialog] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [qaStatusFilter, setQaStatusFilter] = useState<'all' | 'pending' | 'answered' | 'closed'>('all');
  const [qaPriorityFilter, setQaPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // Management states for registration control
  const [registrationSettings, setRegistrationSettings] = useState<RegistrationSettings>({
    enabled: true,
    maxUsers: 500,
    requireApproval: false,
    restrictionMessage: 'Registration is currently closed.'
  });
  const [managementLoading, setManagementLoading] = useState(false);
  const [inlineEditData, setInlineEditData] = useState<any>(null);

  // Bulk upload states
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [bulkUploadError, setBulkUploadError] = useState<string | null>(null);
  const [bulkUploadSuccess, setBulkUploadSuccess] = useState<string | null>(null);

  // Multiple selection states for assignments
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);

  // Auto-calculate day number based on challenge start date
  const challengeStartDate = new Date('2024-12-01'); // Adjust this to your actual challenge start date
  
  // Generate flexible number of day templates (supports any number of days)
  const generateAllDays = (numDays: number = 55): any[] => {
    const allDays: any[] = [];
    
    for (let day = 1; day <= numDays; day++) {
      // Don't pre-assign dates - let admin choose them
      allDays.push({
        id: `template-day-${day}`, // More specific ID to avoid conflicts
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
    console.log('🔄 COMBINED ASSIGNMENTS - Recalculating combined assignments...');
    console.log('🔄 COMBINED ASSIGNMENTS - Firebase assignments:', assignments.length);
    
    // Create a map of all saved assignments by their day_number (not date)
    const savedAssignmentsByDay = new Map();
    const savedAssignmentsByDate = new Map();
    
    assignments.forEach((assignment, index) => {
      console.log(`🔄 COMBINED ASSIGNMENTS - Processing Firebase assignment ${index + 1}:`, {
        id: assignment.id,
        date: assignment.date,
        day_number: assignment.day_number,
        day_number_type: typeof assignment.day_number,
        easy_description: assignment.easy_question?.description || 'No description',
        hasEasyDescription: !!assignment.easy_question?.description && assignment.easy_question.description !== 'Description to be added later'
      });
      
      if (assignment.day_number) {
        savedAssignmentsByDay.set(assignment.day_number, assignment);
        console.log(`🔄 COMBINED ASSIGNMENTS - Added to savedAssignmentsByDay - Key: ${assignment.day_number}, Type: ${typeof assignment.day_number}`);
      }
      if (assignment.date) {
        savedAssignmentsByDate.set(assignment.date, assignment);
        console.log(`🔄 COMBINED ASSIGNMENTS - Added to savedAssignmentsByDate - Key: ${assignment.date}`);
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
    const combined = currentGeneratedDays.map((template, index) => {
      console.log(`🔄 COMBINED ASSIGNMENTS - Processing template day ${template.day_number}:`);
      console.log(`🔄 COMBINED ASSIGNMENTS - Template day_number: ${template.day_number}, Type: ${typeof template.day_number}`);
      console.log(`🔄 COMBINED ASSIGNMENTS - Looking for saved assignment with day_number: ${template.day_number}`);
      
      const saved = savedAssignmentsByDay.get(template.day_number);
      console.log(`🔄 COMBINED ASSIGNMENTS - Found saved assignment:`, saved ? 'YES' : 'NO');
      
      if (saved) {
        console.log(`🔄 COMBINED ASSIGNMENTS - Using Firebase data for day ${template.day_number}:`, {
          id: saved.id,
          date: saved.date,
          easy_description: saved.easy_question?.description || 'No description',
          hasEasyDescription: !!saved.easy_question?.description && saved.easy_question.description !== 'Description to be added later'
        });
        // Ensure unique ID for Firebase assignments
        return { 
          ...saved, 
          id: saved.id || `day-${template.day_number}`, 
          fromFirebase: true 
        };
      }
      
      console.log(`🔄 COMBINED ASSIGNMENTS - Using template data for day ${template.day_number} (no Firebase data found)`);
      // Ensure unique ID for template assignments
      return { 
        ...template, 
        fromFirebase: false 
      };
    });

    // Add any additional assignments from Firebase that don't fit the day template model
    assignments.forEach(assignment => {
      if (!assignment.day_number || assignment.day_number > currentGeneratedDays.length) {
        console.log(`🔄 COMBINED ASSIGNMENTS - Adding extended assignment:`, {
          id: assignment.id,
          date: assignment.date,
          day_number: assignment.day_number
        });
        // This is an assignment that extends beyond our current template
        // Ensure unique ID for extended assignments
        combined.push({ 
          ...assignment, 
          id: assignment.id || `extended-${assignment.date || Date.now()}`, 
          fromFirebase: true 
        });
      }
    });

    console.log(`🔄 COMBINED ASSIGNMENTS - Final combined assignments count: ${combined.length}`);
    console.log(`🔄 COMBINED ASSIGNMENTS - Sample combined assignments:`, combined.slice(0, 3).map(a => ({
      id: a.id,
      date: a.date,
      day_number: a.day_number,
      fromFirebase: a.fromFirebase,
      easy_description: a.easy_question?.description || 'No description',
      hasEasyDescription: !!a.easy_question?.description && a.easy_question.description !== 'Description to be added later'
    })));

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
    fetchProgramExamCooldowns();
    fetchRegistrationSettings();
    fetchQAData();
  }, []);

  // Bulk CSV upload handler
  const handleBulkUploadCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBulkUploadLoading(true);
    setBulkUploadError(null);
    setBulkUploadSuccess(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        try {
          const rows = results.data;
          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];

          console.log('Processing CSV rows:', rows.length);

          // Process each row from the CSV
          for (const [index, row] of rows.entries()) {
            try {
              console.log(`Processing row ${index + 1}:`, row);

              // Helper function to safely extract values with better debugging
              const getValue = (value: any): string => {
                if (value === null || value === undefined) {
                  return '';
                }
                if (value === '' || value === 'null' || value === 'undefined') {
                  return '';
                }
                const stringValue = String(value).trim();
                return stringValue;
              };

              // Debug: Log the entire row to see what PapaParse extracted
              console.log(`Row ${index + 1} raw data:`, row);
              console.log(`Row ${index + 1} keys:`, Object.keys(row));

              // Helper function to parse different date formats
              const parseDate = (dateStr: string): string => {
                if (!dateStr) return '';
                
                // Try different date formats
                const formats = [
                  // ISO formats
                  /^\d{4}-\d{2}-\d{2}$/,           // 2024-12-01
                  /^\d{4}\/\d{2}\/\d{2}$/,         // 2024/12/01
                  /^\d{2}\/\d{2}\/\d{4}$/,         // 12/01/2024 or 01/12/2024
                  /^\d{2}-\d{2}-\d{4}$/,           // 12-01-2024 or 01-12-2024
                  /^\d{1,2}\/\d{1,2}\/\d{4}$/,     // 1/12/2024 or 12/1/2024
                  /^\d{1,2}-\d{1,2}-\d{4}$/,       // 1-12-2024 or 12-1-2024
                ];
                
                try {
                  // First try to parse as is (for ISO format)
                  let parsedDate = new Date(dateStr);
                  if (!isNaN(parsedDate.getTime())) {
                    return parsedDate.toISOString().split('T')[0];
                  }
                  
                  // Try different manual parsing approaches
                  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
                    // Handle MM/DD/YYYY or DD/MM/YYYY format
                    const [part1, part2, year] = dateStr.split('/');
                    // Assume MM/DD/YYYY format first
                    parsedDate = new Date(parseInt(year), parseInt(part1) - 1, parseInt(part2));
                    if (!isNaN(parsedDate.getTime())) {
                      return parsedDate.toISOString().split('T')[0];
                    }
                  }
                  
                  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
                    // Handle MM-DD-YYYY or DD-MM-YYYY format
                    const [part1, part2, year] = dateStr.split('-');
                    parsedDate = new Date(parseInt(year), parseInt(part1) - 1, parseInt(part2));
                    if (!isNaN(parsedDate.getTime())) {
                      return parsedDate.toISOString().split('T')[0];
                    }
                  }
                  
                  // If all parsing fails, return empty string
                  console.warn(`Could not parse date: ${dateStr}`);
                  return '';
                  
                } catch (error) {
                  console.warn(`Date parsing error for "${dateStr}":`, error);
                  return '';
                }
              };

              // Helper function to get day number with better validation
              const getDayNumber = (): number => {
                const dayValue = getValue(row['ID'] || row['Day'] || row['day_number'] || row['id'] || row['Day Number']);
                if (!dayValue) return 0;
                const parsed = parseInt(dayValue);
                return isNaN(parsed) ? 0 : parsed;
              };

              // Get basic fields with flexible column name matching
              const dayNumber = getDayNumber();
              const title = getValue(row['TITLE'] || row['Title'] || row['title'] || row['Question'] || row['question']) || `Question for Day ${dayNumber || 'TBD'}`;
              
              // Enhanced description extraction - try ALL possible variations and log them
              const descriptionKeys = ['Description', 'description', 'DESCRIPTION', 'desc', 'Desc', 'DESC', 
                                     'Problem Description', 'problem_description', 'Question Description', 'question_description',
                                     'Details', 'details', 'DETAILS', 'Problem', 'problem', 'PROBLEM'];
              
              let rawDescription = '';
              let foundKey = '';
              
              // Try each key until we find a non-empty value
              for (const key of descriptionKeys) {
                const value = row[key];
                if (value !== null && value !== undefined && value !== '') {
                  rawDescription = value;
                  foundKey = key;
                  break;
                }
              }
              
              const description = getValue(rawDescription);
              
              // Extensive debugging for description field
              console.log(`Row ${index + 1} DESCRIPTION DEBUG:`, {
                availableKeys: Object.keys(row),
                descriptionKeys: descriptionKeys,
                foundKey: foundKey,
                rawDescription: rawDescription,
                cleanDescription: description,
                descriptionLength: description ? description.length : 0,
                descriptionValues: descriptionKeys.map(key => ({ [key]: row[key] }))
              });
              
              const difficulty = getValue(row['Difficulty'] || row['difficulty'] || row['DIFFICULTY']).toLowerCase() || 'easy';
              const link = getValue(row['Question link'] || row['question_link'] || row['link'] || row['url'] || row['URL'] || row['Link']) || '';
              
              // Enhanced date handling with multiple format support
              const rawUploadDate = getValue(row['Upload Date'] || row['upload_date'] || row['date'] || row['Date'] || row['DATE'] || 
                                           row['Assignment Date'] || row['assignment_date'] || row['Due Date'] || row['due_date']);
              
              // Enhanced debug logging for row processing - especially for description
              console.log(`Row ${index + 1} detailed processing:`, {
                dayNumber,
                title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
                description: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
                fullDescription: description,
                difficulty,
                link: link.substring(0, 50) + (link.length > 50 ? '...' : ''),
                rawDescription: rawDescription,
                rawUploadDate: rawUploadDate,
                hasDescription: !!description && description.length > 0,
                csvColumns: Object.keys(row),
                descriptionSources: {
                  'Description': row['Description'],
                  'description': row['description'], 
                  'DESCRIPTION': row['DESCRIPTION'],
                  'desc': row['desc'],
                  'found_in': rawDescription === row['Description'] ? 'Description' :
                             rawDescription === row['description'] ? 'description' :
                             rawDescription === row['DESCRIPTION'] ? 'DESCRIPTION' :
                             rawDescription === row['desc'] ? 'desc' : 'other'
                }
              });
              
              // Optional fields
              const category = getValue(row['Category'] || row['category'] || row['CATEGORY']) || 'General';
              const tagsValue = getValue(row['Tags'] || row['tags'] || row['TAGS']);
              const example = getValue(row['Example'] || row['example'] || row['EXAMPLE'] || row['Sample Input'] || row['sample_input']);
              const constraint = getValue(row['Constraint'] || row['constraint'] || row['Constraints'] || row['constraints'] || row['CONSTRAINTS']);
              
              // Date handling - use enhanced date parsing with multiple format support
              let uploadDate = parseDate(rawUploadDate);
              
              // Only auto-calculate date if dayNumber is valid and > 0, but user didn't provide date
              if (!uploadDate && dayNumber > 0) {
                // Leave empty - admin will assign dates manually
                uploadDate = '';
              }
              
              // If still no date and no valid day number, skip the row
              if (!uploadDate && dayNumber <= 0) {
                errors.push(`Row ${index + 2}: Missing both day number and date. Please provide at least one.`);
                errorCount++;
                continue;
              }
              
              // For rows with day number but no date, we'll create a special identifier
              if (!uploadDate && dayNumber > 0) {
                // Use day number as identifier for manual date assignment
                uploadDate = `pending-day-${dayNumber}`;
              }

              // Validate difficulty
              const validDifficulties = ['easy', 'medium', 'hard'];
              const normalizedDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'medium';

              // Process tags
              const tagsArray = tagsValue ? 
                tagsValue.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
                [];

              // Create question object with proper defaults - NEVER override provided description
              const questionData = {
                title: title || `Question for Day ${dayNumber || 'TBD'}`,
                description: description || 'Description to be added later',  // Use description directly, no additional checks
                link: link || 'https://example.com/placeholder',
                tags: tagsArray,
                difficulty: normalizedDifficulty as 'easy' | 'medium' | 'hard',
                category: category || 'General',
                example: example || 'Example to be added later',
                constraint: constraint || 'Constraints to be specified'
              };

              // Detailed logging for question data creation
              console.log(`Row ${index + 1} QUESTION DATA:`, {
                originalDescription: description,
                finalDescription: questionData.description,
                isDescriptionFromCSV: description && description.length > 0,
                usingDefaultDescription: questionData.description === 'Description to be added later',
                questionDataComplete: questionData
              });

              console.log(`Question data created for row ${index + 1}:`, {
                title: questionData.title,
                description: questionData.description,
                originalDescription: description,
                rawDescription: rawDescription,
                hasOriginalDescription: !!description && description.trim().length > 0,
                usingDefaultDescription: questionData.description === 'Description to be added later',
                descriptionLength: description ? description.length : 0
              });

              // Handle assignment update (edit existing cards instead of creating new ones)
              let targetAssignment = null;
              let assignmentData;
              
              // First, try to find existing assignment by day number
              if (dayNumber > 0) {
                targetAssignment = combinedAssignments.find(a => a.day_number === dayNumber);
                console.log(`🎯 CSV UPDATE - Looking for existing assignment with day_number ${dayNumber}:`, targetAssignment ? 'FOUND' : 'NOT FOUND');
              }
              
              // If not found by day number and we have a date, try to find by date
              if (!targetAssignment && uploadDate && !uploadDate.startsWith('pending-day-')) {
                targetAssignment = combinedAssignments.find(a => a.date === uploadDate);
                console.log(`🎯 CSV UPDATE - Looking for existing assignment with date ${uploadDate}:`, targetAssignment ? 'FOUND' : 'NOT FOUND');
              }
              
              // If still not found, show warning and skip this row
              if (!targetAssignment) {
                const identifier = dayNumber > 0 ? `Day ${dayNumber}` : (uploadDate ? `Date ${uploadDate}` : 'Unknown');
                errors.push(`Row ${index + 2}: No existing assignment card found for ${identifier}. CSV upload only updates existing cards.`);
                errorCount++;
                console.log(`❌ CSV UPDATE - Skipping row ${index + 1}: No existing assignment found for ${identifier}`);
                continue;
              }
              
              console.log(`✅ CSV UPDATE - Found target assignment for row ${index + 1}:`, {
                id: targetAssignment.id,
                day_number: targetAssignment.day_number,
                date: targetAssignment.date,
                fromFirebase: targetAssignment.fromFirebase,
                currentQuestions: {
                  easy: targetAssignment.easy_question?.title || 'Empty',
                  medium: targetAssignment.medium_question?.title || 'Empty',
                  hard: targetAssignment.hard_question?.title || 'Empty'
                }
              });
              
              // Create updated assignment data by copying existing and updating the specific question
              assignmentData = {
                ...targetAssignment,
                [normalizedDifficulty + '_question']: questionData,
                updated_at: new Date().toISOString(),
                updated_by: currentUser?.uid || 'bulk-upload',
                bulk_uploaded: true
              };
              
              // If the assignment doesn't have a date but we have one from CSV, set it
              if (!assignmentData.date && uploadDate && !uploadDate.startsWith('pending-day-')) {
                assignmentData.date = uploadDate;
                console.log(`📅 CSV UPDATE - Setting date ${uploadDate} for assignment day ${dayNumber}`);
              }
              
              console.log(`📝 CSV UPDATE - Updating ${normalizedDifficulty} question for row ${index + 1}:`, {
                targetId: targetAssignment.id,
                day_number: assignmentData.day_number,
                date: assignmentData.date,
                fromFirebase: targetAssignment.fromFirebase,
                questionTitle: questionData.title,
                questionDescription: questionData.description,
                hasDescription: !!questionData.description && questionData.description !== 'Description to be added later'
              });
              
              // Only save to Firebase if this assignment was originally from Firebase or has a date
              if (targetAssignment.fromFirebase || assignmentData.date) {
                const saveKey = assignmentData.date || targetAssignment.id;
                
                console.log(`🔥 CSV UPDATE - Saving to Firebase with key: ${saveKey}`);
                console.log(`🔥 CSV UPDATE - Question data being saved:`, {
                  difficulty: normalizedDifficulty,
                  title: assignmentData[normalizedDifficulty + '_question'].title,
                  description: assignmentData[normalizedDifficulty + '_question'].description,
                  descriptionLength: assignmentData[normalizedDifficulty + '_question'].description.length
                });
                
                await assignmentsService.setAssignment(saveKey, assignmentData);
              } else {
                console.log(`📝 CSV UPDATE - Template assignment updated in memory only (no Firebase save needed)`);
              }
              
              // Log the final assignment data to verify description is preserved
              console.log(`✅ Assignment updated for row ${index + 1}:`, {
                targetId: targetAssignment.id,
                dayNumber: assignmentData.day_number,
                difficulty: normalizedDifficulty,
                updatedQuestion: {
                  title: assignmentData[`${normalizedDifficulty}_question`].title,
                  description: assignmentData[`${normalizedDifficulty}_question`].description,
                  descriptionLength: assignmentData[`${normalizedDifficulty}_question`].description.length,
                  hasDescription: !!assignmentData[`${normalizedDifficulty}_question`].description && 
                                 assignmentData[`${normalizedDifficulty}_question`].description !== 'Description to be added later'
                }
              });
              
              console.log(`Successfully updated existing assignment for row ${index + 1}: Day ${dayNumber || 'TBD'}, ${normalizedDifficulty} question`);
              successCount++;

            } catch (error) {
              console.error(`Error processing row ${index + 1}:`, error);
              errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Processing failed'}`);
              errorCount++;
            }
          }

          // Show results
          console.log(`CSV Update Summary: ${successCount} success, ${errorCount} errors`);
          
          let successMessage = `Successfully updated ${successCount} existing assignment cards with questions.`;
          if (errorCount > 0) {
            successMessage += ` ${errorCount} questions failed to update.`;
          }

          setBulkUploadSuccess(successMessage);
          
          if (errors.length > 0) {
            console.log('Update errors:', errors);
            if (errors.length <= 5) {
              setBulkUploadError(`Errors encountered:\n${errors.join('\n')}`);
            } else {
              setBulkUploadError(`${errors.length} errors encountered. First 5 errors:\n${errors.slice(0, 5).join('\n')}`);
              console.log('All update errors:', errors);
            }
          }
          
          // Refresh assignments
          console.log('Refreshing assignments after CSV update...');
          await fetchAssignments();
          
          toast({
            title: 'Bulk Update Complete',
            description: `${successCount} assignment cards updated successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
            variant: errorCount > 0 ? 'destructive' : 'default'
          });

          // Clear the file input
          event.target.value = '';

        } catch (error: any) {
          console.error('CSV processing error:', error);
          setBulkUploadError(`Failed to process CSV: ${error.message || 'Unknown error'}`);
          toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: `Failed to process CSV file: ${error.message || 'Please check the format and try again'}`
          });
        } finally {
          setBulkUploadLoading(false);
        }
      },
      error: (error: any) => {
        console.error('CSV parse error:', error);
        setBulkUploadError('Failed to parse CSV file. Please check the file format.');
        setBulkUploadLoading(false);
        toast({
          variant: 'destructive',
          title: 'Parse Error',
          description: 'Failed to parse CSV file. Please check the file format.'
        });
      }
    });
  };

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

  // Load program-specific exam cooldowns
  const fetchProgramExamCooldowns = async () => {
    try {
      setExamLoading(true);
      const cooldowns = await examCooldownService.getAllProgramExamCooldowns();
      setProgramExamCooldowns(cooldowns);
    } catch (error) {
      console.error('Error fetching program exam cooldowns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load program exam cooldowns',
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

  // Program-specific exam management functions
  const handleCreateProgramExam = async () => {
    try {
      if (!programExamFormData.program || !programExamFormData.semester) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Program and semester are required'
        });
        return;
      }

      setExamLoading(true);
      await examCooldownService.createProgramExamCooldown(programExamFormData);
      await fetchProgramExamCooldowns();
      setProgramExamFormData({
        program: '',
        semester: '',
        section: '',
        active: false,
        start_date: '',
        end_date: '',
        pause_submissions_count: true,
        message: "📚 All The Best For Your Exams! Your streak is paused during this period."
      });
      setShowProgramExamForm(false);
      toast({
        title: 'Success',
        description: 'Program exam cooldown created successfully'
      });
    } catch (error) {
      console.error('Error creating program exam cooldown:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create program exam cooldown'
      });
    } finally {
      setExamLoading(false);
    }
  };

  const handleUpdateProgramExam = async (id: string, updates: Partial<ProgramExamCooldown>) => {
    try {
      setExamLoading(true);
      await examCooldownService.updateProgramExamCooldown(id, updates);
      await fetchProgramExamCooldowns();
      toast({
        title: 'Success',
        description: 'Program exam cooldown updated successfully'
      });
    } catch (error) {
      console.error('Error updating program exam cooldown:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update program exam cooldown'
      });
    } finally {
      setExamLoading(false);
    }
  };

  const handleDeleteProgramExam = async (id: string) => {
    try {
      setExamLoading(true);
      await examCooldownService.deleteProgramExamCooldown(id);
      await fetchProgramExamCooldowns();
      toast({
        title: 'Success',
        description: 'Program exam cooldown deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting program exam cooldown:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete program exam cooldown'
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

  const fetchQAData = async () => {
    try {
      setQaLoading(true);
      const questions = await qaService.getAllQuestions();
      setStudentQuestions(questions);
    } catch (error) {
      console.error('Error fetching QA data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load student questions',
        variant: 'destructive'
      });
    } finally {
      setQaLoading(false);
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

  // Function to get student data for a submission
  const getStudentDataForSubmission = (submission: Submission) => {
    return students.find(s => s.uid === submission.student_uid);
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

  // Ban management functions
  const handleBanStudent = async () => {
    if (!selectedStudent || !banReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide a reason for banning this student'
      });
      return;
    }

    try {
      setBanLoading(true);
      await usersService.setUserBanStatus(selectedStudent.uid, true, banReason);
      
      toast({
        title: 'Success',
        description: `${selectedStudent.name} has been banned successfully`
      });
      
      // Refresh data
      await fetchData();
      setShowBanDialog(false);
      setBanReason('');
      
    } catch (error) {
      console.error('Error banning student:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to ban student'
      });
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnbanStudent = async () => {
    if (!selectedStudent) return;

    try {
      setBanLoading(true);
      await usersService.setUserBanStatus(selectedStudent.uid, false);
      
      toast({
        title: 'Success',
        description: `${selectedStudent.name} has been unbanned successfully`
      });
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error('Error unbanning student:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to unban student'
      });
    } finally {
      setBanLoading(false);
    }
  };

  const handleReviewSummation = async (day: number) => {
    if (!selectedStudent || !reviewNotes.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide review notes'
      });
      return;
    }

    try {
      await usersService.reviewDailySummation(
        selectedStudent.uid, 
        day, 
        reviewNotes, 
        userData?.name || 'Admin',
        false // rejected
      );
      
      // Increment streak breaks for rejection
      await usersService.updateUserStreak(
        selectedStudent.uid,
        Math.max(0, selectedStudent.streak_count - 1),
        (selectedStudent.streak_breaks || 0) + 1
      );
      
      toast({
        title: 'Summation Rejected',
        description: `Day ${day} summation rejected. Student's streak break count increased.`
      });
      
      // Refresh data
      await fetchData();
      setSelectedSummationDay(null);
      setReviewNotes('');
      
    } catch (error) {
      console.error('Error rejecting summation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject summation'
      });
    }
  };

  const handleApproveSummation = async (day: number) => {
    if (!selectedStudent || !reviewNotes.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide review notes before approving'
      });
      return;
    }

    try {
      await usersService.reviewDailySummation(
        selectedStudent.uid, 
        day, 
        reviewNotes, 
        userData?.name || 'Admin',
        true // approved
      );
      
      toast({
        title: 'Success',
        description: `Day ${day} summation approved successfully`
      });
      
      // Refresh data
      await fetchData();
      setSelectedSummationDay(null);
      setReviewNotes('');
      
    } catch (error) {
      console.error('Error approving summation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve summation'
      });
    }
  };

  const handleViewDaySubmissions = async (day: number) => {
    if (!selectedStudent) return;

    try {
      setDaySubmissionsLoading(true);
      setSelectedDayNumber(day);
      
      // Fetch submissions for this specific day and student
      const daySubmissions = submissions.filter(submission => 
        submission.student_uid === selectedStudent.uid && 
        submission.day_number === day
      );
      
      setSelectedDaySubmissions(daySubmissions);
      setShowDaySubmissionsModal(true);
      
    } catch (error) {
      console.error('Error fetching day submissions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load submissions for this day'
      });
    } finally {
      setDaySubmissionsLoading(false);
    }
  };

  const handleApproveSubmissionFromDay = async (submissionId: string, feedback: string) => {
    try {
      await submissionsService.updateSubmissionStatus(
        submissionId,
        'approved',
        feedback,
        userData?.uid || ''
      );
      
      toast({
        title: 'Success',
        description: 'Submission approved successfully'
      });
      
      // Refresh day submissions
      if (selectedDayNumber) {
        await handleViewDaySubmissions(selectedDayNumber);
      }
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

  const handleRejectSubmissionFromDay = async (submissionId: string, feedback: string) => {
    try {
      await submissionsService.updateSubmissionStatus(
        submissionId,
        'rejected',
        feedback,
        userData?.uid || ''
      );
      
      toast({
        title: 'Success',
        description: 'Submission rejected successfully'
      });
      
      // Refresh day submissions
      if (selectedDayNumber) {
        await handleViewDaySubmissions(selectedDayNumber);
      }
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

  const handleAutoApproveDaily = async () => {
    try {
      // This function should run at the end of each day
      const today = new Date();
      const currentDay = Math.floor((today.getTime() - new Date('2025-01-01').getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Auto-approve all pending summations for the current day
      const studentsWithPendingSummations = students.filter(student => 
        student.dailySummations && 
        student.dailySummations[`day_${currentDay}`] && 
        !student.dailySummations[`day_${currentDay}`].reviewed
      );

      for (const student of studentsWithPendingSummations) {
        await usersService.reviewDailySummation(
          student.uid,
          currentDay,
          'Auto-approved at end of day',
          'System',
          true
        );
      }

      toast({
        title: 'Success',
        description: `Auto-approved ${studentsWithPendingSummations.length} pending summations`
      });

      await fetchData();

    } catch (error) {
      console.error('Error auto-approving summations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to auto-approve summations'
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
      console.log('📥 Fetching all assignments from Firebase...');
      const allAssignments = await assignmentsService.getAllAssignments();
      console.log(`📦 Fetched ${allAssignments.length} assignments from Firebase`);
      
      // Debug: Log a few assignments to check if descriptions are being loaded
      if (allAssignments.length > 0) {
        console.log('🔍 Sample assignments loaded from Firebase:');
        allAssignments.slice(0, 3).forEach((assignment, index) => {
          console.log(`Assignment ${index + 1}:`, {
            id: assignment.id,
            date: assignment.date,
            day_number: assignment.day_number,
            easy_question: {
              title: assignment.easy_question?.title || 'No title',
              description: assignment.easy_question?.description || 'No description',
              hasDescription: !!assignment.easy_question?.description && assignment.easy_question.description !== 'Description to be added later'
            },
            medium_question: {
              title: assignment.medium_question?.title || 'No title', 
              description: assignment.medium_question?.description || 'No description',
              hasDescription: !!assignment.medium_question?.description && assignment.medium_question.description !== 'Description to be added later'
            },
            hard_question: {
              title: assignment.hard_question?.title || 'No title',
              description: assignment.hard_question?.description || 'No description', 
              hasDescription: !!assignment.hard_question?.description && assignment.hard_question.description !== 'Description to be added later'
            }
          });
        });
      }
      
      setAssignments(allAssignments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleEditAssignment = (assignment: any) => {
    console.log('🔧 Starting to edit assignment:', assignment);
    
    setInlineEditingAssignment(assignment.id);
    
    // Deep copy the assignment data to ensure we have all the fields
    const editData = {
      id: assignment.id,
      date: assignment.date || '',
      day_number: assignment.day_number || 1,
      easy_question: {
        title: assignment.easy_question?.title || '',
        description: assignment.easy_question?.description || '',
        link: assignment.easy_question?.link || '',
        tags: Array.isArray(assignment.easy_question?.tags) ? [...assignment.easy_question.tags] : [],
        difficulty: 'easy' as const
      },
      medium_question: {
        title: assignment.medium_question?.title || '',
        description: assignment.medium_question?.description || '',
        link: assignment.medium_question?.link || '',
        tags: Array.isArray(assignment.medium_question?.tags) ? [...assignment.medium_question.tags] : [],
        difficulty: 'medium' as const
      },
      hard_question: {
        title: assignment.hard_question?.title || '',
        description: assignment.hard_question?.description || '',
        link: assignment.hard_question?.link || '',
        tags: Array.isArray(assignment.hard_question?.tags) ? [...assignment.hard_question.tags] : [],
        difficulty: 'hard' as const
      },
      created_by: assignment.created_by,
      created_at: assignment.created_at,
      fromFirebase: assignment.fromFirebase
    };
    
    console.log('📝 Edit data prepared:', editData);
    console.log('📋 Question descriptions:', {
      easy: editData.easy_question.description,
      medium: editData.medium_question.description,
      hard: editData.hard_question.description
    });
    
    setInlineEditData(editData);
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

      if (!inlineEditData.day_number || inlineEditData.day_number < 1) {
        toast({
          title: 'Error',
          description: 'Day number must be greater than 0'
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

      console.log('💾 Saving assignment with inline edit data:', inlineEditData);
      console.log('📝 Questions being saved:', {
        easy: processQuestion(inlineEditData.easy_question),
        medium: processQuestion(inlineEditData.medium_question),
        hard: processQuestion(inlineEditData.hard_question)
      });

      // Find the original assignment for comparison
      const originalAssignment = combinedAssignments.find(a => a.id === inlineEditingAssignment);
      const dateChanged = originalAssignment && originalAssignment.date !== inlineEditData.date;

      // Prepare the assignment data to save
      const assignmentToSave = {
        id: inlineEditData.id || inlineEditData.date,
        date: inlineEditData.date,
        day_number: inlineEditData.day_number,
        easy_question: {
          ...processQuestion(inlineEditData.easy_question),
          difficulty: 'easy' as const
        },
        medium_question: {
          ...processQuestion(inlineEditData.medium_question),
          difficulty: 'medium' as const
        },
        hard_question: {
          ...processQuestion(inlineEditData.hard_question),
          difficulty: 'hard' as const
        },
        created_by: originalAssignment?.created_by || currentUser.uid,
        created_at: originalAssignment?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: currentUser.uid
      };

      console.log('🔥 Final assignment data to save to Firebase:', assignmentToSave);

      // Save the assignment using the date as the document ID
      await assignmentsService.setAssignment(inlineEditData.date, assignmentToSave);

      // If date changed and there was an original assignment with a different ID, clean up
      if (dateChanged && originalAssignment && originalAssignment.id !== inlineEditData.date) {
        try {
          console.log('🗑️ Deleting old assignment at:', originalAssignment.id);
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
    
    console.log(`🔄 Updating ${questionType} question ${field}:`, value);
    
    const updatedQuestion = {
      ...inlineEditData[`${questionType}_question`],
      [field]: field === 'tags' && typeof value === 'string' 
        ? value.split(',').map(tag => tag.trim()).filter(tag => tag)
        : value
    };
    
    console.log(`📝 Updated ${questionType} question:`, updatedQuestion);
    
    setInlineEditData({
      ...inlineEditData,
      [`${questionType}_question`]: updatedQuestion
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
        const newDayNumber = Math.max(1, daysDiff + 1); // Remove 55-day limit
        
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
      // Completely delete the assignment from Firebase
      await assignmentsService.deleteAssignment(assignmentId);
      
      toast({
        title: 'Success',
        description: 'Assignment deleted successfully.'
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

  // Enhanced delete function for assignments - completely deletes the assignment
  const handleDeleteExtendedAssignment = async (assignment: any) => {
    try {
      if (assignment.fromFirebase && assignment.id) {
        // Completely delete the assignment from Firebase
        await assignmentsService.deleteAssignment(assignment.id);
      } else {
        // For template assignments, remove from local state
        setAllGeneratedDays(prev => prev.filter(a => a.id !== assignment.id));
      }
      
      toast({
        title: 'Success',
        description: `Day ${assignment.day_number} assignment deleted successfully.`
      });
      
      await fetchAssignments();
    } catch (error) {
      console.error('Error deleting extended assignment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete assignment'
      });
    }
  };

  // Multiple selection helper functions
  const handleSelectAssignment = (assignmentId: string) => {
    setSelectedAssignments(prev => {
      if (prev.includes(assignmentId)) {
        return prev.filter(id => id !== assignmentId);
      } else {
        return [...prev, assignmentId];
      }
    });
  };

  const handleSelectAllAssignments = () => {
    if (isSelectAllChecked) {
      setSelectedAssignments([]);
      setIsSelectAllChecked(false);
    } else {
      // Use combinedAssignments for questions tab, assignments for others
      const assignmentList = selectedTab === 'questions' ? combinedAssignments : assignments;
      
      if (selectedTab === 'questions') {
        // For questions tab, only select assignments that can be cleared (have questions and are saved)
        const clearableAssignments = assignmentList.filter(a => {
          const hasQuestions = a.easy_question?.title || a.medium_question?.title || a.hard_question?.title;
          const isSaved = a.fromFirebase && a.date;
          return hasQuestions && isSaved;
        });
        setSelectedAssignments(clearableAssignments.map(a => a.id).filter(Boolean));
      } else {
        setSelectedAssignments(assignmentList.map(a => a.id).filter(Boolean));
      }
      
      setIsSelectAllChecked(true);
    }
  };

  // Functions for Questions Tab - Clear data but keep cards
  const handleClearQuestionData = async (assignmentId: string) => {
    try {
      // Find the assignment in combinedAssignments (not just assignments)
      const assignment = combinedAssignments.find(a => a.id === assignmentId);
      if (!assignment) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Assignment not found'
        });
        return;
      }

      // Only clear if the assignment has questions and is saved to Firebase
      if (!assignment.fromFirebase || !assignment.date) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Cannot clear data from unsaved assignment. Please save the assignment first.'
        });
        return;
      }

      // Clear the questions but keep the assignment structure
      const clearedAssignment = {
        date: assignment.date,
        day_number: assignment.day_number,
        easy_question: {
          title: '',
          description: '',
          link: '',
          tags: [],
          difficulty: 'easy' as const
        },
        medium_question: {
          title: '',
          description: '',
          link: '',
          tags: [],
          difficulty: 'medium' as const
        },
        hard_question: {
          title: '',
          description: '',
          link: '',
          tags: [],
          difficulty: 'hard' as const
        },
        created_by: assignment.created_by || userData?.uid || 'admin',
        updated_at: new Date().toISOString()
      };
      
      // Update the assignment with cleared questions using the date as key
      await assignmentsService.setAssignment(assignment.date, clearedAssignment);
      
      toast({
        title: 'Success',
        description: 'Question data cleared successfully. Card remains for future use.'
      });
      await fetchAssignments();
    } catch (error) {
      console.error('Error clearing question data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear question data'
      });
    }
  };

  const handleClearSelectedQuestionData = async () => {
    if (selectedAssignments.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No assignments selected'
      });
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Clear question data for all selected assignments but keep the cards
      for (const assignmentId of selectedAssignments) {
        try {
          const assignment = combinedAssignments.find(a => a.id === assignmentId);
          if (!assignment) {
            errors.push(`Assignment ${assignmentId} not found`);
            errorCount++;
            continue;
          }

          // Only clear if the assignment has questions and is saved to Firebase
          if (!assignment.fromFirebase || !assignment.date) {
            errors.push(`Assignment Day ${assignment.day_number} not saved to Firebase yet`);
            errorCount++;
            continue;
          }

          // Check if assignment actually has questions to clear
          const hasQuestions = assignment.easy_question?.title || 
                              assignment.medium_question?.title || 
                              assignment.hard_question?.title;
          
          if (!hasQuestions) {
            errors.push(`Assignment Day ${assignment.day_number} has no questions to clear`);
            errorCount++;
            continue;
          }

          const clearedAssignment = {
            date: assignment.date,
            day_number: assignment.day_number,
            easy_question: {
              title: '',
              description: '',
              link: '',
              tags: [],
              difficulty: 'easy' as const
            },
            medium_question: {
              title: '',
              description: '',
              link: '',
              tags: [],
              difficulty: 'medium' as const
            },
            hard_question: {
              title: '',
              description: '',
              link: '',
              tags: [],
              difficulty: 'hard' as const
            },
            created_by: assignment.created_by || userData?.uid || 'admin',
            updated_at: new Date().toISOString()
          };
          
          await assignmentsService.setAssignment(assignment.date, clearedAssignment);
          successCount++;
        } catch (error) {
          console.error(`Error clearing assignment ${assignmentId}:`, error);
          errorCount++;
          errors.push(`Failed to clear assignment ${assignmentId}`);
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `Question data cleared for ${successCount} assignment(s). Cards remain for future use.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to clear question data. ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`
        });
      }
      
      setSelectedAssignments([]);
      setIsSelectAllChecked(false);
      await fetchAssignments();
    } catch (error) {
      console.error('Error clearing question data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear question data'
      });
    }
  };

  const handleDeleteSelectedAssignments = async () => {
    if (selectedAssignments.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No assignments selected'
      });
      return;
    }

    try {
      // Completely delete selected assignments from Firebase
      for (const assignmentId of selectedAssignments) {
        await assignmentsService.deleteAssignment(assignmentId);
      }
      
      toast({
        title: 'Success',
        description: `${selectedAssignments.length} assignment(s) deleted successfully`
      });
      
      setSelectedAssignments([]);
      setIsSelectAllChecked(false);
      await fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete assignments'
      });
    }
  };

  // Function to fetch assignment statistics
  const handleViewAssignmentStats = async (assignment: any) => {
    try {
      setStatsLoading(true);
      setSelectedAssignmentForStats(assignment);
      
      // Fetch submissions for this specific assignment date
      const assignmentSubmissions = submissions.filter(sub => 
        sub.question_date === assignment.date
      );
      
      // Calculate detailed stats for each difficulty level
      const calculateQuestionStats = (difficulty: 'easy' | 'medium' | 'hard') => {
        const questionSubmissions = assignmentSubmissions.filter(sub => 
          sub.difficulty === difficulty
        );
        
        const totalSubmissions = questionSubmissions.length;
        const approvedSubmissions = questionSubmissions.filter(sub => 
          sub.adminReview?.status === 'approved' || sub.status === 'approved'
        ).length;
        const rejectedSubmissions = questionSubmissions.filter(sub => 
          sub.adminReview?.status === 'rejected' || sub.status === 'rejected'
        ).length;
        const pendingSubmissions = questionSubmissions.filter(sub => 
          sub.adminReview?.status === 'pending' || 
          sub.status === 'submitted' || 
          !sub.adminReview
        ).length;
        
        // Calculate completion rate for this question
        const uniqueStudents = new Set(questionSubmissions.map(sub => sub.student_uid));
        const completionRate = totalSubmissions > 0 ? 
          Math.round((uniqueStudents.size / students.length) * 100) : 0;
        
        // Calculate average submission time (if timestamp available)
        const avgSubmissionTime = questionSubmissions.length > 0 ? 
          questionSubmissions.reduce((sum, sub) => {
            const submitTime = new Date(sub.created_at).getTime();
            const dayStart = new Date(assignment.date).getTime();
            return sum + (submitTime - dayStart);
          }, 0) / questionSubmissions.length : 0;
        
        return {
          totalSubmissions,
          approvedSubmissions,
          rejectedSubmissions,
          pendingSubmissions,
          completionRate,
          uniqueStudents: uniqueStudents.size,
          avgSubmissionTime: Math.round(avgSubmissionTime / (1000 * 60 * 60)), // Convert to hours
          approvalRate: totalSubmissions > 0 ? Math.round((approvedSubmissions / totalSubmissions) * 100) : 0
        };
      };
      
      // Get stats for each difficulty
      const easyStats = assignment.easy_question.title ? calculateQuestionStats('easy') : null;
      const mediumStats = assignment.medium_question.title ? calculateQuestionStats('medium') : null;
      const hardStats = assignment.hard_question.title ? calculateQuestionStats('hard') : null;
      
      // Overall assignment stats
      const totalUniqueStudents = new Set(assignmentSubmissions.map(sub => sub.student_uid));
      const overallStats = {
        totalSubmissions: assignmentSubmissions.length,
        uniqueStudents: totalUniqueStudents.size,
        completionRate: Math.round((totalUniqueStudents.size / students.length) * 100),
        averageSubmissionsPerStudent: totalUniqueStudents.size > 0 ? 
          Math.round((assignmentSubmissions.length / totalUniqueStudents.size) * 10) / 10 : 0,
        mostPopularDifficulty: easyStats?.totalSubmissions >= (mediumStats?.totalSubmissions || 0) && 
                               easyStats?.totalSubmissions >= (hardStats?.totalSubmissions || 0) ? 'Easy' :
                               mediumStats?.totalSubmissions >= (hardStats?.totalSubmissions || 0) ? 'Medium' : 'Hard'
      };
      
      setAssignmentStats({
        assignment,
        overallStats,
        easyStats,
        mediumStats,
        hardStats,
        submissionsList: assignmentSubmissions
      });
      
      setShowStatsModal(true);
      
    } catch (error) {
      console.error('Error fetching assignment stats:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load assignment statistics'
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Filter functions with alphabetical sorting
  const filteredStudents = students.filter(student => {
    const matchesSearch = (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.enrollment_no || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = courseFilter === 'all' || !courseFilter || (student as any).course === courseFilter;
    const matchesSection = sectionFilter === 'all' || !sectionFilter || (student as any).section === sectionFilter;
    const matchesSemester = semesterFilter === 'all' || !semesterFilter || (student as any).semester === semesterFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && !student.disqualified) ||
                         (statusFilter === 'disqualified' && student.disqualified);
    
    return matchesSearch && matchesCourse && matchesSection && matchesSemester && matchesStatus;
  }).sort((a, b) => (a.name || '').localeCompare(b.name || '')); // Sort alphabetically

  // Get unique values for filter dropdowns
  const uniqueCourses = [...new Set(students.map(s => (s as any).course).filter(Boolean))].sort();
  const uniqueSections = [...new Set(students.map(s => (s as any).section).filter(Boolean))].sort();
  const uniqueSemesters = [...new Set(students.map(s => (s as any).semester).filter(Boolean))].sort();

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
      {/* Sidebar - Fixed */}
      <div className="w-64 bg-card border-r flex flex-col fixed h-full z-10">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {[
              { id: 'students', label: 'Students', icon: Users },
              { id: 'submissions', label: 'Submissions', icon: BookOpen },
              { id: 'assignments', label: 'Assignments', icon: Calendar },
              { id: 'questions', label: 'Questions', icon: Code },
              { id: 'qa', label: 'Q&A Support', icon: MessageSquare },
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

        {/* Footer Actions - Fixed at bottom */}
        <div className="mt-auto p-4 border-t space-y-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left font-medium text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left font-medium text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Tab Content */}
          {selectedTab === 'students' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Student Management</h1>
                <p className="text-muted-foreground">
                  Filter and view student details by program, section and semester
                </p>
              </div>
            </div>

            {/* Enhanced Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Students</CardTitle>
                <CardDescription>
                  Use filters to find specific students by course, semester, and section
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Search */}
                  <div className="lg:col-span-1">
                    <Label htmlFor="search" className="text-sm font-medium">Search</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="search"
                        placeholder="Search students..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Course Filter */}
                  <div>
                    <Label className="text-sm font-medium">Program/Course</Label>
                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Programs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {uniqueCourses.map((course, index) => (
                          <SelectItem key={`course-${index}-${course}`} value={course}>{course}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Semester Filter */}
                  <div>
                    <Label className="text-sm font-medium">Semester</Label>
                    <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Semesters" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Semesters</SelectItem>
                        {uniqueSemesters.map((semester, index) => (
                          <SelectItem key={`semester-${index}-${semester}`} value={semester}>{semester}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Section Filter */}
                  <div>
                    <Label className="text-sm font-medium">Section</Label>
                    <Select value={sectionFilter} onValueChange={setSectionFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Sections" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        {uniqueSections.map((section, index) => (
                          <SelectItem key={`section-${index}-${section}`} value={section}>{section}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'disqualified') => setStatusFilter(value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Students" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disqualified">Disqualified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filter Summary */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredStudents.length} of {students.length} students
                    {courseFilter && courseFilter !== 'all' && ` • Course: ${courseFilter}`}
                    {semesterFilter && semesterFilter !== 'all' && ` • Semester: ${semesterFilter}`}
                    {sectionFilter && sectionFilter !== 'all' && ` • Section: ${sectionFilter}`}
                    {statusFilter !== 'all' && ` • Status: ${statusFilter}`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Students List */}
            {filteredStudents.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
                  <p className="text-muted-foreground">
                    {students.length === 0 ? 'No students have registered yet.' : 'No students match your current filters.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Students List</CardTitle>
                  <CardDescription>
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredStudents.map((student) => (
                      <div 
                        key={student.uid} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {/* Student Avatar */}
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-primary">
                              {student.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          
                          {/* Student Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-lg">{student.name || 'Unknown'}</h3>
                              <Badge variant={student.disqualified ? "destructive" : "default"} className="text-xs">
                                {student.disqualified ? "Disqualified" : "Active"}
                              </Badge>
                              {student.isBanned && (
                                <Badge variant="destructive" className="text-xs bg-red-600 text-white">
                                  <Ban className="w-3 h-3 mr-1" />
                                  Banned
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{student.email}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span><strong>Program:</strong> {(student as any).course || 'N/A'}</span>
                              <span><strong>Section:</strong> {(student as any).section || 'N/A'}</span>
                              <span><strong>Semester:</strong> {(student as any).semester || 'N/A'}</span>
                              <span><strong>Enrollment:</strong> {student.enrollment_no}</span>
                            </div>
                          </div>

                          {/* Quick Stats */}
                          <div className="hidden md:flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <p className="font-bold text-blue-600">{student.streak_count}</p>
                              <p className="text-xs text-muted-foreground">Streak</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-green-600">
                                {(student.approved?.easy || 0) + (student.approved?.medium || 0) + (student.approved?.hard || 0) + (student.approved?.choice || 0)}
                              </p>
                              <p className="text-xs text-muted-foreground">Approved</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-red-600">{student.violations}</p>
                              <p className="text-xs text-muted-foreground">Violations</p>
                            </div>
                          </div>
                        </div>

                        {/* View Details Button */}
                        <Button
                          size="sm"
                          onClick={() => handleViewStudent(student)}
                          className="ml-4"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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

            {/* Bulk Upload Section */}
            {showBulkUpload && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-blue-800">Bulk CSV Update</CardTitle>
                  <CardDescription className="text-blue-600">
                    Upload a CSV file to update existing assignment cards with questions. Only existing cards will be modified.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">CSV File Format</Label>
                    <div className="text-xs text-muted-foreground bg-white p-3 rounded border">
                      <div className="font-mono mb-2 text-gray-600">
                        Required: Day Number (must match existing card), Title, Description, Link, Difficulty
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>• <strong>Day Number:</strong> 1, 2, 3... (must match existing assignment day)</div>
                        <div>• <strong>Title:</strong> Question title</div>
                        <div>• <strong>Description:</strong> Problem description</div>
                        <div>• <strong>Link:</strong> Problem URL</div>
                        <div>• <strong>Difficulty:</strong> easy/medium/hard</div>
                        <div>• <strong>Tags:</strong> Comma-separated (optional)</div>
                        <div>• <strong>Upload Date:</strong> YYYY-MM-DD (optional)</div>
                        <div className="text-orange-600 font-medium mt-2">⚠️ Note: CSV will only update existing assignment cards, not create new ones</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Label htmlFor="csv-upload-assignments" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        <Download className="w-4 h-4" />
                        {bulkUploadLoading ? 'Updating...' : 'Choose CSV File to Update'}
                      </div>
                      <Input
                        id="csv-upload-assignments"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleBulkUploadCSV}
                        disabled={bulkUploadLoading}
                      />
                    </Label>
                    
                    {bulkUploadLoading && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Updating assignments...</span>
                      </div>
                    )}
                  </div>

                  {bulkUploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">Error:</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">{bulkUploadError}</p>
                    </div>
                  )}

                  {bulkUploadSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Success:</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">{bulkUploadSuccess}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                    <Button variant="outline" size="sm" onClick={() => setShowBulkUpload(!showBulkUpload)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Bulk Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {combinedAssignments
                    .sort((a, b) => {
                      // Sort by day_number first (ascending), then by date if day_number is missing
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
                    })
                    .map((assignment) => {
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
                                      {assignment.created_at && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          <span>Created {new Date(assignment.created_at).toLocaleDateString()}</span>
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
                                onClick={() => handleViewAssignmentStats(assignment)}
                                disabled={statsLoading}
                              >
                                <BarChart3 className="w-3 h-3 mr-1" />
                                {statsLoading && selectedAssignmentForStats?.id === assignment.id ? 'Loading...' : 'View Stats'}
                              </Button>
                              {/* Delete button for assignments beyond day 55 */}
                              {assignment.day_number > 55 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteExtendedAssignment(assignment)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              )}
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

        {/* Assignment Statistics Modal */}
        <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-semibold">
                  Day {assignmentStats?.assignment?.day_number} Assignment Statistics
                </DialogTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowStatsModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-muted-foreground">
                {assignmentStats?.assignment?.date ? `Assignment Date: ${assignmentStats.assignment.date}` : 'No date assigned'}
              </p>
            </DialogHeader>

            {assignmentStats && (
              <div className="space-y-8">
                {/* Overall Assignment Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Overall Assignment Performance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{assignmentStats.overallStats.totalSubmissions}</p>
                        <p className="text-sm text-muted-foreground">Total Submissions</p>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{assignmentStats.overallStats.uniqueStudents}</p>
                        <p className="text-sm text-muted-foreground">Unique Students</p>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{assignmentStats.overallStats.completionRate}%</p>
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{assignmentStats.overallStats.averageSubmissionsPerStudent}</p>
                        <p className="text-sm text-muted-foreground">Avg Submissions/Student</p>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Question-wise Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Question-wise Performance
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Easy Question Stats */}
                    {assignmentStats.easyStats && (
                      <Card className="p-6 border-green-200">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full" />
                            <h4 className="font-semibold text-green-800">Easy Question</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Submissions:</span>
                              <span className="font-medium">{assignmentStats.easyStats.totalSubmissions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Approved:</span>
                              <span className="font-medium text-green-600">{assignmentStats.easyStats.approvedSubmissions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Rejected:</span>
                              <span className="font-medium text-red-600">{assignmentStats.easyStats.rejectedSubmissions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Pending:</span>
                              <span className="font-medium text-yellow-600">{assignmentStats.easyStats.pendingSubmissions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Completion Rate:</span>
                              <span className="font-medium">{assignmentStats.easyStats.completionRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Approval Rate:</span>
                              <span className="font-medium">{assignmentStats.easyStats.approvalRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Unique Students:</span>
                              <span className="font-medium">{assignmentStats.easyStats.uniqueStudents}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Medium Question Stats */}
                    {assignmentStats.mediumStats && (
                      <Card className="p-6 border-yellow-200">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                            <h4 className="font-semibold text-yellow-800">Medium Question</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Submissions:</span>
                              <span className="font-medium">{assignmentStats.mediumStats.totalSubmissions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Approved:</span>
                              <span className="font-medium text-green-600">{assignmentStats.mediumStats.approvedSubmissions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Rejected:</span>
                              <span className="font-medium text-red-600">{assignmentStats.mediumStats.rejectedSubmissions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Pending:</span>
                              <span className="font-medium text-yellow-600">{assignmentStats.mediumStats.pendingSubmissions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Completion Rate:</span>
                              <span className="font-medium">{assignmentStats.mediumStats.completionRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Approval Rate:</span>
                              <span className="font-medium">{assignmentStats.mediumStats.approvalRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Unique Students:</span>
                              <span className="font-medium">{assignmentStats.mediumStats.uniqueStudents}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Hard Question Stats */}
                    {assignmentStats.hardStats && (
                      <Card className="p-6 border-red-200">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded-full" />
                            <h4 className="font-semibold text-red-800">Hard Question</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Submissions:</span>
                              <span className="font-medium">{assignmentStats.hardStats.totalSubmissions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Approved:</span>
                              <span className="font-medium text-green-600">{assignmentStats.hardStats.approvedSubmissions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Rejected:</span>
                              <span className="font-medium text-red-600">{assignmentStats.hardStats.rejectedSubmissions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Pending:</span>
                              <span className="font-medium text-yellow-600">{assignmentStats.hardStats.pendingSubmissions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Completion Rate:</span>
                              <span className="font-medium">{assignmentStats.hardStats.completionRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Approval Rate:</span>
                              <span className="font-medium">{assignmentStats.hardStats.approvalRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Unique Students:</span>
                              <span className="font-medium">{assignmentStats.hardStats.uniqueStudents}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Insights Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Key Insights
                  </h3>
                  <Card className="p-6 bg-muted/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Most Popular Choice</h4>
                        <p className="text-sm text-muted-foreground">
                          Students preferred <span className="font-semibold">{assignmentStats.overallStats.mostPopularDifficulty}</span> difficulty questions for this assignment.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Engagement Level</h4>
                        <p className="text-sm text-muted-foreground">
                          {assignmentStats.overallStats.completionRate >= 80 ? 'Excellent' : 
                           assignmentStats.overallStats.completionRate >= 60 ? 'Good' : 
                           assignmentStats.overallStats.completionRate >= 40 ? 'Average' : 'Low'} student engagement 
                          with {assignmentStats.overallStats.completionRate}% completion rate.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowStatsModal(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    // Export stats functionality can be added here
                    toast({
                      title: 'Export Started',
                      description: 'Assignment statistics export will be available soon.'
                    });
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Stats
                  </Button>
                </div>
              </div>
            )}
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
                    <p className="text-2xl font-bold">{combinedAssignments.length}</p>
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
                      {combinedAssignments.filter(a => a.easy_question?.title || a.medium_question?.title || a.hard_question?.title).length}
                    </p>
                    <p className="text-sm text-muted-foreground">With Questions</p>
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
                      {combinedAssignments.filter(a => !a.easy_question?.title && !a.medium_question?.title && !a.hard_question?.title).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Empty Cards</p>
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
                      {Math.round((combinedAssignments.filter(a => a.easy_question?.title || a.medium_question?.title || a.hard_question?.title).length / Math.max(1, combinedAssignments.length)) * 100)}%
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
                onClick={() => setShowBulkUpload(!showBulkUpload)}
              >
                <Settings className="w-4 h-4" />
                CSV Update
              </Button>
            </div>

            {/* Bulk Upload Section */}
            {showBulkUpload && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-blue-800">Bulk CSV Upload</CardTitle>
                  <CardDescription className="text-blue-600">
                    Upload a CSV file with questions to automatically generate assignments for multiple days
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">CSV File Format - Super Flexible!</Label>
                    <div className="text-xs text-muted-foreground bg-white p-3 rounded border">
                      <div className="p-2 bg-green-50 rounded border-l-2 border-green-400 mb-2">
                        <strong className="text-green-700">Only Required:</strong> Day Number column (1, 2, 3...)
                      </div>
                      
                      <div className="font-mono mb-2 text-gray-600">
                        Recommended columns: Day Number, Question, Topic, Difficulty, Question Type, Options, Correct Answer, Explanation
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div><strong className="text-blue-600">Smart Defaults Applied:</strong></div>
                        <div>• Missing <strong>Question</strong> → "Question for Day X"</div>
                        <div>• Missing <strong>Topic</strong> → "General"</div>
                        <div>• Missing <strong>Difficulty</strong> → "medium"</div>
                        <div>• Missing <strong>Question Type</strong> → "mcq"</div>
                        <div>• Missing <strong>Options</strong> → Empty array</div>
                        <div>• Missing <strong>Correct Answer</strong> → "To be filled"</div>
                        <div>• Missing <strong>Explanation</strong> → "Explanation to be added later"</div>
                        <div>• Missing <strong>Upload Date</strong> → Today's date</div>
                        
                        <div className="mt-2 p-2 bg-blue-50 rounded">
                          <strong className="text-blue-700">💡 Upload Strategy:</strong> Upload with minimal data, edit details later in admin interface!
                        </div>
                        <div>• <strong>Upload Date:</strong> YYYY-MM-DD (defaults to today)</div>
                        
                        <div className="mt-2 p-2 bg-blue-50 rounded border-l-2 border-blue-300">
                          <strong className="text-blue-700">💡 Pro Tip:</strong> Empty fields will be set to defaults and can be edited later through the admin interface.
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        <Download className="w-4 h-4" />
                        {bulkUploadLoading ? 'Processing...' : 'Choose CSV File'}
                      </div>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleBulkUploadCSV}
                        disabled={bulkUploadLoading}
                      />
                    </Label>
                    
                    {bulkUploadLoading && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Processing CSV...</span>
                      </div>
                    )}
                  </div>

                  {bulkUploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">Error:</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">{bulkUploadError}</p>
                    </div>
                  )}

                  {bulkUploadSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Success:</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">{bulkUploadSuccess}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
              </div>
            </div>

            {/* Assignments Table */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">All Assignments</CardTitle>
                    <CardDescription>
                      View and clear question data while preserving assignment cards for future use
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedAssignments.length > 0 && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleClearSelectedQuestionData}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Selected ({selectedAssignments.length})
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {combinedAssignments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No assignments available</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your 45-day coding challenge by creating your first assignment.
                    </p>
                    <Button onClick={() => setSelectedTab('assignments')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Go to Assignments Tab
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Select All Header */}
                    {combinedAssignments.length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                        <Checkbox
                          checked={isSelectAllChecked}
                          onCheckedChange={handleSelectAllAssignments}
                        />
                        <span className="text-sm font-medium">
                          Select All Clearable ({combinedAssignments.filter(a => {
                            const hasQuestions = a.easy_question?.title || a.medium_question?.title || a.hard_question?.title;
                            const isSaved = a.fromFirebase && a.date;
                            return hasQuestions && isSaved;
                          }).length} of {combinedAssignments.length} assignments)
                        </span>
                        {selectedAssignments.length > 0 && (
                          <span className="text-sm text-muted-foreground">
                            - {selectedAssignments.length} selected
                          </span>
                        )}
                      </div>
                    )}
                    
                    {combinedAssignments
                      .sort((a, b) => {
                        // Sort by day_number first (ascending), then by date if day_number is missing
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
                      })
                      .map((assignment) => {
                      const questions = [
                        assignment.easy_question?.title && { ...assignment.easy_question, level: 'Easy', color: 'bg-green-500' },
                        assignment.medium_question?.title && { ...assignment.medium_question, level: 'Medium', color: 'bg-yellow-500' },
                        assignment.hard_question?.title && { ...assignment.hard_question, level: 'Hard', color: 'bg-red-500' }
                      ].filter(Boolean);

                      // Check if this assignment can be cleared (has questions and is saved to Firebase)
                      const canBeClearedHasQuestions = questions.length > 0;
                      const canBeClearedIsSaved = assignment.fromFirebase && assignment.date;
                      const canBeCleared = canBeClearedHasQuestions && canBeClearedIsSaved;

                      return (
                        <div key={assignment.id} className="group p-4 border-2 border-muted rounded-lg hover:border-primary/30 transition-all hover:shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Checkbox
                                checked={selectedAssignments.includes(assignment.id)}
                                onCheckedChange={() => handleSelectAssignment(assignment.id)}
                                disabled={!canBeCleared}
                              />
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <span className="text-sm font-bold text-primary">
                                    {assignment.day_number}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold">{assignment.date || 'No date assigned'}</p>
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
                                    {!assignment.fromFirebase && (
                                      <Badge variant="outline" className="text-xs text-gray-500">
                                        Template
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
                                    {questions[0].tags?.slice(0, 3).join(', ')}
                                    {questions[0].tags?.length > 3 && '...'}
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
                                onClick={() => handleClearQuestionData(assignment.id!)}
                                disabled={!canBeCleared}
                                className="h-8 px-3 text-red-600 hover:text-red-700 hover:border-red-200 disabled:text-gray-400 disabled:hover:text-gray-400"
                                title={!canBeCleared ? 
                                  (!canBeClearedIsSaved ? 'Assignment not saved to Firebase yet' : 'No questions to clear') : 
                                  'Clear question data'
                                }
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

        {/* Q&A Support Tab */}
        {selectedTab === 'qa' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Q&A Support</h2>
                <p className="text-muted-foreground">Manage student questions and provide support</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={async () => {
                    setQaLoading(true);
                    try {
                      const questions = await qaService.getAllQuestions();
                      setStudentQuestions(questions);
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to load questions",
                        variant: "destructive"
                      });
                    }
                    setQaLoading(false);
                  }}
                  disabled={qaLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${qaLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Questions List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Student Questions</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {studentQuestions.filter(q => q.status === 'pending').length} Pending
                    </Badge>
                    <Badge variant="outline">
                      {studentQuestions.length} Total
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {qaLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading questions...</p>
                  </div>
                ) : studentQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No questions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentQuestions.map((question) => (
                        <div 
                          key={question.id} 
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge 
                                  variant={
                                    question.status === 'pending' ? 'destructive' : 
                                    question.status === 'answered' ? 'default' : 'secondary'
                                  }
                                >
                                  {question.status}
                                </Badge>
                                <Badge 
                                  variant={
                                    question.priority === 'high' ? 'destructive' : 
                                    question.priority === 'medium' ? 'default' : 'outline'
                                  }
                                >
                                  {question.priority}
                                </Badge>
                                <Badge variant="outline">{question.category}</Badge>
                              </div>
                              <h4 className="font-semibold">{question.student_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {question.student_course} - Sem {question.student_semester} - {question.student_section}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(question.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm">{question.question_text}</p>
                          </div>

                          {question.admin_response && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                              <p className="text-sm font-medium text-blue-800 mb-1">Admin Response:</p>
                              <p className="text-sm text-blue-700">{question.admin_response}</p>
                              <p className="text-xs text-blue-600 mt-1">
                                Responded by {question.responded_by} on {question.responded_at ? new Date(question.responded_at).toLocaleString() : 'N/A'}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {question.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setSelectedQuestionForAnswer(question);
                                  setAnswerText('');
                                  setShowAnswerDialog(true);
                                }}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Answer
                              </Button>
                            )}
                            {question.status === 'answered' && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={async () => {
                                  try {
                                    await qaService.deleteQuestion(question.id!);
                                    // Refresh questions
                                    const questions = await qaService.getAllQuestions();
                                    setStudentQuestions(questions);
                                    toast({
                                      title: "Question Deleted",
                                      description: "Answered question has been deleted successfully"
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to delete question",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await qaService.updatePriority(
                                    question.id!, 
                                    question.priority === 'high' ? 'medium' : 'high',
                                    'admin'
                                  );
                                  // Refresh questions
                                  const questions = await qaService.getAllQuestions();
                                  setStudentQuestions(questions);
                                  toast({
                                    title: "Priority Updated",
                                    description: `Question priority changed to ${question.priority === 'high' ? 'medium' : 'high'}`
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to update priority",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              Priority: {question.priority === 'high' ? 'Lower' : 'Raise'}
                            </Button>
                            {question.status !== 'closed' && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={async () => {
                                  try {
                                    await qaService.closeQuestion(question.id!);
                                    // Refresh questions
                                    const questions = await qaService.getAllQuestions();
                                    setStudentQuestions(questions);
                                    toast({
                                      title: "Question Closed",
                                      description: "Question has been closed"
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to close question",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Close
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Answer Dialog */}
            {showAnswerDialog && selectedQuestionForAnswer && (
              <Dialog open={showAnswerDialog} onOpenChange={setShowAnswerDialog}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Answer Question</DialogTitle>
                    <DialogDescription>
                      Responding to {selectedQuestionForAnswer.student_name}'s question
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 border rounded p-3">
                      <p className="text-sm font-medium mb-1">Student Question:</p>
                      <p className="text-sm">{selectedQuestionForAnswer.question_text}</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="answer">Your Response</Label>
                      <Textarea
                        id="answer"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Type your answer here..."
                        rows={6}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowAnswerDialog(false)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={async () => {
                          if (!answerText.trim()) {
                            toast({
                              title: "Answer Required",
                              description: "Please enter an answer before submitting",
                              variant: "destructive"
                            });
                            return;
                          }

                          try {
                            await qaService.answerQuestion(
                              selectedQuestionForAnswer.id!,
                              answerText,
                              currentUser?.uid || '',
                              userData?.name || 'Admin'
                            );
                            
                            // Additional explicit notification to ensure student gets notified
                            await notificationsService.createNotification({
                              user_uid: selectedQuestionForAnswer.student_uid,
                              type: 'general',
                              title: '✅ Your Question Has Been Answered',
                              message: `Admin has responded to your question: "${selectedQuestionForAnswer.question_text.substring(0, 50)}...". Check the Q&A section for the full response.`,
                              date: new Date().toISOString(),
                              read: false,
                              action_required: true,
                              priority: 'high'
                            });
                            
                            // Refresh questions
                            const questions = await qaService.getAllQuestions();
                            setStudentQuestions(questions);
                            
                            setShowAnswerDialog(false);
                            setAnswerText('');
                            setSelectedQuestionForAnswer(null);
                            
                            toast({
                              title: "Answer Submitted",
                              description: "Your answer has been sent to the student and they have been notified."
                            });
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to send answer",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Answer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
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

            {/* Program-Specific Exam Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Program-Specific Exam Cooldowns</span>
                  <Button
                    onClick={() => setShowProgramExamForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Program Exam
                  </Button>
                </CardTitle>
                <CardDescription>
                  Set different exam periods for different programs and semesters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {programExamCooldowns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No program-specific exam cooldowns configured</p>
                      <p className="text-sm">Click "Add Program Exam" to create one</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {programExamCooldowns.map((cooldown) => (
                        <div key={cooldown.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                cooldown.active 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {cooldown.active ? 'Active' : 'Inactive'}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Badge variant="outline">{cooldown.program}</Badge>
                                <Badge variant="outline">Sem {cooldown.semester}</Badge>
                                {cooldown.section && (
                                  <Badge variant="outline">Sec {cooldown.section}</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateProgramExam(cooldown.id, { 
                                  active: !cooldown.active 
                                })}
                                disabled={examLoading}
                              >
                                {cooldown.active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteProgramExam(cooldown.id)}
                                disabled={examLoading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Period:</span> {cooldown.start_date} to {cooldown.end_date}
                            </div>
                            <div>
                              <span className="font-medium">Streak Protection:</span> {cooldown.pause_submissions_count ? 'Yes' : 'No'}
                            </div>
                          </div>
                          {cooldown.message && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                              {cooldown.message}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Program Exam Form Modal */}
            <Dialog open={showProgramExamForm} onOpenChange={setShowProgramExamForm}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Program-Specific Exam Cooldown</DialogTitle>
                  <DialogDescription>
                    Configure exam period for specific program and semester
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Program/Course</Label>
                      <Select
                        value={programExamFormData.program}
                        onValueChange={(value) => setProgramExamFormData(prev => ({
                          ...prev,
                          program: value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select program/course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B.Tech CSE">B.Tech Computer Science Engineering</SelectItem>
                          <SelectItem value="B.Tech IT">B.Tech Information Technology</SelectItem>
                          <SelectItem value="B.Tech ECE">B.Tech Electronics & Communication</SelectItem>
                          <SelectItem value="B.Tech ME">B.Tech Mechanical Engineering</SelectItem>
                          <SelectItem value="B.Tech CE">B.Tech Civil Engineering</SelectItem>
                          <SelectItem value="B.Tech EE">B.Tech Electrical Engineering</SelectItem>
                          <SelectItem value="BCA">Bachelor of Computer Applications</SelectItem>
                          <SelectItem value="MCA">Master of Computer Applications</SelectItem>
                          <SelectItem value="M.Tech CSE">M.Tech Computer Science Engineering</SelectItem>
                          <SelectItem value="M.Tech IT">M.Tech Information Technology</SelectItem>
                          <SelectItem value="MBA">Master of Business Administration</SelectItem>
                          <SelectItem value="BBA">Bachelor of Business Administration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Semester</Label>
                      <Select
                        value={programExamFormData.semester}
                        onValueChange={(value) => setProgramExamFormData(prev => ({
                          ...prev,
                          semester: value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8].map(sem => (
                            <SelectItem key={sem} value={sem.toString()}>
                              Semester {sem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Section (Optional)</Label>
                    <Input
                      placeholder="e.g., A, B, C (leave empty for all sections)"
                      value={programExamFormData.section}
                      onChange={(e) => setProgramExamFormData(prev => ({
                        ...prev,
                        section: e.target.value
                      }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={programExamFormData.start_date}
                        onChange={(e) => setProgramExamFormData(prev => ({
                          ...prev,
                          start_date: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={programExamFormData.end_date}
                        onChange={(e) => setProgramExamFormData(prev => ({
                          ...prev,
                          end_date: e.target.value
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Exam Message</Label>
                    <Textarea
                      placeholder="Message to show to students during exam period"
                      value={programExamFormData.message}
                      onChange={(e) => setProgramExamFormData(prev => ({
                        ...prev,
                        message: e.target.value
                      }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="program_pause_submissions"
                      checked={programExamFormData.pause_submissions_count}
                      onChange={(e) => setProgramExamFormData(prev => ({
                        ...prev,
                        pause_submissions_count: e.target.checked
                      }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="program_pause_submissions" className="text-sm">
                      Pause submission counting (protect streaks during exam period)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="program_active"
                      checked={programExamFormData.active}
                      onChange={(e) => setProgramExamFormData(prev => ({
                        ...prev,
                        active: e.target.checked
                      }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="program_active" className="text-sm">
                      Activate immediately after creation
                    </Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowProgramExamForm(false)}
                      disabled={examLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProgramExam}
                      disabled={examLoading}
                    >
                      {examLoading ? 'Creating...' : 'Create Program Exam'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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
          students={students}
        />
      )}

      {/* Student Details Modal - Full Page Profile */}
      {showStudentDetails && selectedStudent && (
        <Dialog open={showStudentDetails} onOpenChange={setShowStudentDetails}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {selectedStudent.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <DialogTitle className="text-2xl">{selectedStudent.name || 'Unknown Student'}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">{selectedStudent.email}</DialogDescription>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={!selectedStudent.disqualified ? "default" : "destructive"}>
                      {!selectedStudent.disqualified ? 'Active' : 'Disqualified'}
                    </Badge>
                    {selectedStudent.isBanned && (
                      <Badge variant="destructive">
                        <Ban className="w-3 h-3 mr-1" />
                        Banned
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {selectedStudent.enrollment_no || 'No Enrollment'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedStudent.isBanned ? (
                    <Button
                      variant="outline"
                      onClick={handleUnbanStudent}
                      disabled={banLoading}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {banLoading ? 'Unbanning...' : 'Unban Student'}
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => setShowBanDialog(true)}
                      className="text-white"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Ban Student
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6">
              {/* Left Column - Personal & Academic Info */}
              <div className="lg:col-span-1 space-y-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="text-base font-medium">{selectedStudent.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                      <p className="text-base">{selectedStudent.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Enrollment Number</label>
                      <p className="text-base font-mono">{selectedStudent.enrollment_no || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                      <p className="text-base">
                        {selectedStudent.created_at 
                          ? new Date(selectedStudent.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Academic Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Program/Course</label>
                      <p className="text-base font-medium">{selectedStudent.course || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Section</label>
                      <p className="text-base">{selectedStudent.section || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Semester</label>
                      <p className="text-base">{selectedStudent.semester || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* GitHub Repository */}
                {selectedStudent.github_repo_link && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">GitHub Repository</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <a 
                        href={selectedStudent.github_repo_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {selectedStudent.github_repo_link}
                      </a>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Performance & Statistics */}
              <div className="lg:col-span-2 space-y-6">
                {/* Performance Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-600">{selectedStudent.streak_count}</p>
                        <p className="text-sm text-muted-foreground">Current Streak</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-3xl font-bold text-orange-600">{selectedStudent.streak_breaks}</p>
                        <p className="text-sm text-muted-foreground">Streak Breaks</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-3xl font-bold text-red-600">{selectedStudent.violations}</p>
                        <p className="text-sm text-muted-foreground">Violations</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-3xl font-bold text-green-600">
                          {(selectedStudent.approved?.easy || 0) + (selectedStudent.approved?.medium || 0) + (selectedStudent.approved?.hard || 0) + (selectedStudent.approved?.choice || 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Approved</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Submission Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Submission Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-green-600 mb-2">
                          <p className="text-2xl font-bold">{selectedStudent.approved?.easy || 0}</p>
                          <p className="text-sm text-muted-foreground">Approved</p>
                        </div>
                        <div className="text-gray-600">
                          <p className="text-lg">{selectedStudent.attempts?.easy || 0}</p>
                          <p className="text-xs text-muted-foreground">Total Attempts</p>
                        </div>
                        <p className="text-xs font-medium text-green-600 mt-2">EASY</p>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-yellow-600 mb-2">
                          <p className="text-2xl font-bold">{selectedStudent.approved?.medium || 0}</p>
                          <p className="text-sm text-muted-foreground">Approved</p>
                        </div>
                        <div className="text-gray-600">
                          <p className="text-lg">{selectedStudent.attempts?.medium || 0}</p>
                          <p className="text-xs text-muted-foreground">Total Attempts</p>
                        </div>
                        <p className="text-xs font-medium text-yellow-600 mt-2">MEDIUM</p>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-red-600 mb-2">
                          <p className="text-2xl font-bold">{selectedStudent.approved?.hard || 0}</p>
                          <p className="text-sm text-muted-foreground">Approved</p>
                        </div>
                        <div className="text-gray-600">
                          <p className="text-lg">{selectedStudent.attempts?.hard || 0}</p>
                          <p className="text-xs text-muted-foreground">Total Attempts</p>
                        </div>
                        <p className="text-xs font-medium text-red-600 mt-2">HARD</p>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-purple-600 mb-2">
                          <p className="text-2xl font-bold">{selectedStudent.approved?.choice || 0}</p>
                          <p className="text-sm text-muted-foreground">Approved</p>
                        </div>
                        <div className="text-gray-600">
                          <p className="text-lg">{selectedStudent.attempts?.choice || 0}</p>
                          <p className="text-xs text-muted-foreground">Total Attempts</p>
                        </div>
                        <p className="text-xs font-medium text-purple-600 mt-2">CHOICE</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 45-Day Summation Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      45-Day Summation Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress Overview */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            {selectedStudent.dailySummations ? Object.keys(selectedStudent.dailySummations).length : 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Submitted</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedStudent.dailySummations ? 
                              Object.values(selectedStudent.dailySummations).filter(s => s.reviewed && s.approved).length : 0
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">Approved</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-2xl font-bold text-red-600">
                            {selectedStudent.dailySummations ? 
                              Object.values(selectedStudent.dailySummations).filter(s => s.reviewed && !s.approved).length : 0
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">Rejected</p>
                        </div>
                      </div>

                      {/* Daily Summations Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                        {Array.from({ length: 45 }, (_, i) => i + 1).map(day => {
                          const summation = selectedStudent.dailySummations?.[`day_${day}`];
                          const hasSubmission = !!summation;
                          const isReviewed = summation?.reviewed || false;
                          const isApproved = summation?.approved || false;
                          
                          // Check if there are question submissions for this day
                          const daySubmissions = submissions.filter(sub => 
                            sub.student_uid === selectedStudent.uid && sub.day_number === day
                          );
                          const hasQuestionSubmissions = daySubmissions.length > 0;
                          
                          return (
                            <Button
                              key={day}
                              variant="outline"
                              className={`h-auto p-3 flex-col items-start justify-start text-left transition-all hover:scale-105 ${
                                isReviewed && isApproved 
                                  ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                                  : isReviewed && !isApproved
                                  ? 'bg-red-50 border-red-300 hover:bg-red-100'
                                  : hasSubmission || hasQuestionSubmissions
                                  ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100' 
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              }`}
                              onClick={() => handleViewDaySubmissions(day)}
                              disabled={daySubmissionsLoading}
                            >
                              <div className="w-full">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      isReviewed && isApproved 
                                        ? 'bg-green-500 text-white' 
                                        : isReviewed && !isApproved
                                        ? 'bg-red-500 text-white'
                                        : hasSubmission || hasQuestionSubmissions
                                        ? 'bg-yellow-500 text-white' 
                                        : 'bg-gray-300 text-gray-600'
                                    }`}>
                                      {day}
                                    </div>
                                    <span className="text-sm font-medium">Day {day}</span>
                                  </div>
                                  
                                  <div className="flex gap-1">
                                    {isReviewed && isApproved && (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    )}
                                    {isReviewed && !isApproved && (
                                      <X className="w-4 h-4 text-red-600" />
                                    )}
                                    {!isReviewed && (hasSubmission || hasQuestionSubmissions) && (
                                      <Clock className="w-4 h-4 text-yellow-600" />
                                    )}
                                  </div>
                                </div>
                                
                                <div className="space-y-1 text-xs w-full">
                                  {hasSubmission && (
                                    <div className="flex items-center gap-1">
                                      <FileText className="w-3 h-3" />
                                      <span>{summation.wordCount} words summation</span>
                                    </div>
                                  )}
                                  
                                  {hasQuestionSubmissions && (
                                    <div className="flex items-center gap-1">
                                      <Code className="w-3 h-3" />
                                      <span>{daySubmissions.length} question submission{daySubmissions.length > 1 ? 's' : ''}</span>
                                    </div>
                                  )}
                                  
                                  {!hasSubmission && !hasQuestionSubmissions && (
                                    <span className="text-muted-foreground">No submissions</span>
                                  )}
                                  
                                  {hasQuestionSubmissions && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {daySubmissions.map(sub => (
                                        <Badge 
                                          key={sub.id} 
                                          variant={
                                            sub.status === 'approved' ? 'default' : 
                                            sub.status === 'rejected' ? 'destructive' : 'secondary'
                                          }
                                          className="text-xs px-1 py-0"
                                        >
                                          {sub.difficulty.charAt(0).toUpperCase()}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                {isReviewed && summation?.reviewNotes && (
                                  <div className="mt-2 p-2 bg-white/50 rounded text-xs w-full">
                                    <p className="text-muted-foreground truncate">
                                      Review: {summation.reviewNotes.substring(0, 30)}...
                                    </p>
                                  </div>
                                )}
                              </div>
                            </Button>
                          );
                        })}
                      </div>

                      {/* Auto-approve button */}
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={handleAutoApproveDaily}
                          className="w-full"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Auto-Approve All Pending (End of Day)
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowStudentDetails(false)}
              >
                Close Profile
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Day Submissions Modal */}

      {/* Day Submissions Modal */}
      <Dialog open={showDaySubmissionsModal} onOpenChange={setShowDaySubmissionsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Day {selectedDayNumber} Submissions - {selectedStudent?.name}</DialogTitle>
            <DialogDescription>
              Review all submissions for this day. You can approve or reject individual submissions.
            </DialogDescription>
          </DialogHeader>
          
          {daySubmissionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Daily Summation Section */}
              {selectedStudent?.dailySummations?.[`day_${selectedDayNumber}`] && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Daily Summation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const summation = selectedStudent.dailySummations[`day_${selectedDayNumber}`];
                      return (
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">{summation.content}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Words: {summation.wordCount}</span>
                              <span>Submitted: {new Date(summation.submittedAt).toLocaleDateString()}</span>
                              <Badge variant={
                                summation.reviewed 
                                  ? summation.approved 
                                    ? "default" 
                                    : "destructive"
                                  : "secondary"
                              }>
                                {summation.reviewed 
                                  ? summation.approved 
                                    ? "Approved" 
                                    : "Rejected"
                                  : "Pending Review"
                                }
                              </Badge>
                            </div>
                            {!summation.reviewed && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedSummationDay(selectedDayNumber)}
                                >
                                  Review Summation
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Question Submissions Section */}
              {selectedDaySubmissions.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Question Submissions</h3>
                  {selectedDaySubmissions.map((submission) => (
                    <Card key={submission.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            {submission.question_title} 
                            <Badge variant={
                              submission.difficulty === 'easy' ? 'default' :
                              submission.difficulty === 'medium' ? 'secondary' :
                              submission.difficulty === 'hard' ? 'destructive' : 'outline'
                            }>
                              {submission.difficulty.toUpperCase()}
                            </Badge>
                          </CardTitle>
                          <Badge variant={
                            submission.status === 'approved' ? 'default' :
                            submission.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {submission.status.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Repository Link:</label>
                            <a 
                              href={submission.github_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block text-blue-600 hover:text-blue-800 underline text-sm mt-1"
                            >
                              {submission.github_link}
                            </a>
                          </div>
                          
                          {submission.comments && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Student Comments:</label>
                              <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{submission.comments}</p>
                            </div>
                          )}
                          
                          {submission.feedback && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Admin Feedback:</label>
                              <p className="text-sm mt-1 p-2 bg-blue-50 rounded">{submission.feedback}</p>
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground">
                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                            {submission.reviewed_at && (
                              <> • Reviewed: {new Date(submission.reviewed_at).toLocaleString()}</>
                            )}
                          </div>
                          
                          {submission.status === 'pending' && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const feedback = prompt('Enter feedback for approval:');
                                  if (feedback) {
                                    handleApproveSubmissionFromDay(submission.id!, feedback);
                                  }
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  const feedback = prompt('Enter feedback for rejection:');
                                  if (feedback) {
                                    handleRejectSubmissionFromDay(submission.id!, feedback);
                                  }
                                }}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No question submissions found for this day.
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDaySubmissionsModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban Student Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Ban Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban {selectedStudent?.name}? This action will prevent them from accessing the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="banReason">Reason for Ban *</Label>
              <Textarea
                id="banReason"
                placeholder="Enter the reason for banning this student..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowBanDialog(false);
                setBanReason('');
              }}
              disabled={banLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanStudent}
              disabled={banLoading || !banReason.trim()}
            >
              {banLoading ? 'Banning...' : 'Ban Student'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summation Review Dialog */}
      <Dialog open={selectedSummationDay !== null} onOpenChange={() => setSelectedSummationDay(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Review Day {selectedSummationDay} Summation
            </DialogTitle>
            <DialogDescription>
              Review and provide feedback for {selectedStudent?.name}'s daily summation.
              <span className="text-red-600 font-medium"> Note: Rejecting will increase the student's streak break count.</span>
            </DialogDescription>
          </DialogHeader>
          {selectedSummationDay !== null && selectedStudent?.dailySummations?.[`day_${selectedSummationDay}`] && (
            <div className="space-y-6 py-4">
              {/* Summation Content */}
              <div>
                <Label className="text-sm font-medium">Student's Summation Content:</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border max-h-60 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedStudent.dailySummations[`day_${selectedSummationDay}`].content}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Word Count:</span>
                    <span>{selectedStudent.dailySummations[`day_${selectedSummationDay}`].wordCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Submitted:</span>
                    <span>{new Date(selectedStudent.dailySummations[`day_${selectedSummationDay}`].submittedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Time:</span>
                    <span>{new Date(selectedStudent.dailySummations[`day_${selectedSummationDay}`].submittedAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Day:</span>
                    <span>{selectedSummationDay}/45</span>
                  </div>
                </div>
              </div>

              {/* Review Notes Section */}
              <div>
                <Label htmlFor="reviewNotes" className="text-sm font-medium">
                  Feedback Notes <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Provide detailed feedback on the student's summation. Be specific about what was good and what could be improved..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This feedback will be visible to the student regardless of approval/rejection.
                </p>
              </div>

              {/* Warning for Rejection */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div className="text-xs text-red-700">
                    <p className="font-medium">Impact of Rejection:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Student's streak break count will increase by 1</li>
                      <li>Current streak will be reduced by 1</li>
                      <li>If streak breaks reach 3, student will be disqualified</li>
                      <li>Student will receive notification about the rejection</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSummationDay(null);
                setReviewNotes('');
              }}
            >
              Cancel
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={() => selectedSummationDay && handleReviewSummation(selectedSummationDay)}
                disabled={!reviewNotes.trim()}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Reject Summation
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (selectedSummationDay && reviewNotes.trim()) {
                    handleApproveSummation(selectedSummationDay);
                  } else if (!reviewNotes.trim()) {
                    toast({
                      variant: 'destructive',
                      title: 'Error',
                      description: 'Please provide feedback notes before approving'
                    });
                  }
                }}
                disabled={!reviewNotes.trim()}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Summation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

