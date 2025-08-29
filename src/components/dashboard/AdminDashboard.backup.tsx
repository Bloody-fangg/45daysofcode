import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { ExternalLink } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Users, 
  Calendar as CalendarIcon, 
  BookOpen, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Shield,
  Flame,
  User,
  X,
  Menu
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mock data
const mockStudents: Student[] = [
  {
    id: '1',
    name: 'John Doe',
    enrollment_no: 'ENR001',
    email: 'john@example.com',
    course: 'Computer Science',
    section: 'A',
    semester: '6',
    streak_count: 5,
    streak_breaks: 0,
    disqualified: false,
    attempts: { easy: 10, medium: 5, hard: 2, choice: 1 },
    last_submission: '2024-12-15'
  },
  {
    id: '2',
    name: 'Jane Smith',
    enrollment_no: 'ENR002',
    email: 'jane@example.com',
    course: 'Information Technology',
    section: 'B',
    semester: '4',
    streak_count: 12,
    streak_breaks: 1,
    disqualified: false,
    attempts: { easy: 15, medium: 8, hard: 4, choice: 2 },
    last_submission: '2024-12-14'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    enrollment_no: 'ENR003',
    email: 'bob@example.com',
    course: 'Computer Science',
    section: 'A',
    semester: '6',
    streak_count: 0,
    streak_breaks: 3,
    disqualified: true,
    attempts: { easy: 5, medium: 2, hard: 0, choice: 1 },
    last_submission: '2024-12-10'
  }
];

interface Student {
  id: string;
  name: string;
  enrollment_no: string;
  email: string;
  course: string;
  section: string;
  semester: string;
  streak_count: number;
  streak_breaks: number;
  disqualified: boolean;
  attempts: {
    easy: number;
    medium: number;
    hard: number;
    choice: number;
  };
  last_submission: string;
  github_repo_link?: string;
  created_at?: string;
  updated_at?: string;
}

const AdminDashboard = () => {
  const { userData, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [filters, setFilters] = useState({
    course: '',
    section: '',
    semester: ''
  });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  
  // Extract unique values for filters
  const courses = Array.from(new Set(mockStudents.map(s => s.course)));
  const sections = Array.from(new Set(mockStudents
    .filter(s => !filters.course || s.course === filters.course)
    .map(s => s.section)));
  const semesters = Array.from(new Set(mockStudents
    .filter(s => (!filters.course || s.course === filters.course) && 
                 (!filters.section || s.section === filters.section))
    .map(s => s.semester)));
  
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  const greeting = getGreeting();
  const formattedDate = new Intl.DateTimeFormat('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(currentTime);
  
  const { toast } = useToast();
  
  // State for exam mode
  const [examMode, setExamMode] = useState(false);
  const [examStartDate, setExamStartDate] = useState('');
  const [examEndDate, setExamEndDate] = useState('');
  
  // State for analytics
  const [analyticsDate, setAnalyticsDate] = useState(new Date().toISOString().split('T')[0]);

  // Question form state
  const [activeTab, setActiveTab] = useState('questions');
  const [questionForm, setQuestionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    link: '',
    level: 'easy' as 'easy' | 'medium' | 'hard',
    tags: [] as string[]
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  
  const levelOptions = [
    { 
      value: 'easy' as const, 
      label: 'Easy', 
      color: 'bg-green-600 text-white border-green-700 hover:bg-green-700',
      dot: 'bg-white',
      textColor: 'text-white'
    },
    { 
      value: 'medium' as const, 
      label: 'Medium', 
      color: 'bg-yellow-600 text-white border-yellow-700 hover:bg-yellow-700',
      dot: 'bg-white',
      textColor: 'text-white'
    },
    { 
      value: 'hard' as const, 
      label: 'Hard', 
      color: 'bg-red-600 text-white border-red-700 hover:bg-red-700',
      dot: 'bg-white',
      textColor: 'text-white'
    }
  ];
  
  const commonTags = [
    'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math',
    'Sorting', 'Greedy', 'Depth-First Search', 'Binary Search', 'Breadth-First Search',
    'Tree', 'Matrix', 'Two Pointers', 'Binary Tree', 'Heap',
    'Stack', 'Graph', 'Recursion', 'Sliding Window', 'Trie'
  ];
  
  const [assignedQuestions, setAssignedQuestions] = useState<{
    [date: string]: {
      [level: string]: {
        title: string;
        description: string;
        link: string;
        tags: string[];
      };
    };
  }>({});

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "Admin session ended"
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !questionForm.tags.includes(trimmedTag)) {
      setQuestionForm(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setQuestionForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSaveQuestion = async () => {
    // Validate required fields
    if (!questionForm.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a title for the question"
      });
      return;
    }
    
    if (!questionForm.link.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a problem link"
      });
      return;
    }
    
    if (!questionForm.description.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a description"
      });
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update assigned questions
      setAssignedQuestions(prev => ({
        ...prev,
        [questionForm.date]: {
          ...(prev[questionForm.date] || {}),
          [questionForm.level]: {
            title: questionForm.title,
            description: questionForm.description,
            link: questionForm.link,
            tags: [...questionForm.tags]
          }
        }
      }));

      // Reset form
      setQuestionForm({
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        link: '',
        level: 'easy',
        tags: []
      });

      toast({
        title: "Success",
        description: `Question assigned for ${questionForm.date} (${questionForm.level})`
      });
    } catch (error) {
      console.error("Error saving question:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save question. Please try again."
      });
    }
  };

  const handleExamModeToggle = async () => {
    try {
      setExamMode(!examMode);
      toast({
        title: examMode ? "Exam Mode Disabled" : "Exam Mode Enabled",
        description: examMode 
          ? "Students can now submit solutions normally" 
          : "Students will see the exam banner and streaks are paused"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update exam mode settings"
      });
    }
  };

  // Student management handlers
  const handleEditStudent = (student: Student) => {
    setCurrentStudent(student);
    setIsEditStudentOpen(true);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setStudents(students.filter(student => student.id !== studentId));
        toast({
          title: 'Student Deleted',
          description: 'Student has been removed successfully',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete student. Please try again.',
        });
      }
    }
  };

  const handleAddStudent = async (studentData: Omit<Student, 'id'>) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const newStudent: Student = {
        id: Math.random().toString(36).substr(2, 9),
        ...studentData,
      };
      setStudents([...students, newStudent]);
      toast({
        title: 'Student Added',
        description: 'New student has been added successfully',
      });
      setIsAddStudentOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add student. Please try again.',
      });
    }
  };

  const handleUpdateStudent = async (studentData: Student) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setStudents(students.map(student => student.id === studentData.id ? studentData : student));
      toast({
        title: 'Student Updated',
        description: 'Student information has been updated',
      });
      setIsEditStudentOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update student. Please try again.',
      });
    }
  };

  // Filter students based on search term and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.enrollment_no.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilters = 
      (!filters.course || student.course === filters.course) &&
      (!filters.section || student.section === filters.section) &&
      (!filters.semester || student.semester === filters.semester);
      
    return matchesSearch && matchesFilters;
  }).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

  if (!userData?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-heading font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have admin privileges to access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-3">
            <Flame className="h-6 w-6 text-amber-500" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">45 Days of Code</h1>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          
          {/* Center Admin Badge */}
          <div className="hidden md:flex items-center absolute left-1/2 transform -translate-x-1/2">
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300">
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              <span className="font-semibold">Admin Mode</span>
            </Badge>
          </div>
          
          <Button 
            variant="destructive"
            size="sm" 
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold">{mockStudents.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Streaks</p>
                  <p className="text-3xl font-bold text-success">
                    {mockStudents.filter(s => s.streak_count > 0 && !s.disqualified).length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Disqualified</p>
                  <p className="text-3xl font-bold text-destructive">
                    {mockStudents.filter(s => s.disqualified).length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Submissions</p>
                  <p className="text-3xl font-bold text-accent">
                    {Math.round(
                      mockStudents.reduce((acc, s) => 
                        acc + s.attempts.easy + s.attempts.medium + s.attempts.hard + s.attempts.choice, 0
                      ) / mockStudents.length
                    )}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="questions">Manage Questions</TabsTrigger>
            <TabsTrigger value="assigned-questions">View Assigned</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="exam-mode">Exam Mode</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* View Assigned Questions Tab */}
          <TabsContent value="assigned-questions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>View & Edit Assigned Questions</CardTitle>
                    <CardDescription>
                      Select a date to view and edit assigned questions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-full max-w-xs">
                    <Label htmlFor="view-date">Select Date</Label>
                    <Input
                      id="view-date"
                      type="date"
                      value={questionForm.date}
                      onChange={(e) => {
                        setQuestionForm(prev => ({
                          ...prev,
                          date: e.target.value
                        }));
                      }}
                      className="w-full"
                    />
                  </div>
                </div>

                {assignedQuestions[questionForm.date] ? (
                  <div className="space-y-4">
                    {Object.entries(assignedQuestions[questionForm.date]).map(([level, question]) => (
                      <Card key={level} className="hover:bg-muted/50 transition-colors">
                        <CardContent className="pt-6">
                          <div className="flex flex-col space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={
                                  level === 'easy' 
                                    ? 'bg-green-600 hover:bg-green-600 text-white' 
                                    : level === 'medium' 
                                      ? 'bg-yellow-600 hover:bg-yellow-600 text-white'
                                      : 'bg-red-600 hover:bg-red-600 text-white'
                                }>
                                  {level.charAt(0).toUpperCase() + level.slice(1)}
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
                                  onClick={() => {
                                    setQuestionForm({
                                      date: questionForm.date,
                                      level: level as 'easy' | 'medium' | 'hard',
                                      title: question.title,
                                      description: question.description,
                                      link: question.link,
                                      tags: question.tags || []
                                    });
                                    setActiveTab('questions');
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {question.description}
                            </p>
                            
                            {question.tags && question.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {question.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground">No questions assigned for this date</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Question Management</CardTitle>
                    <CardDescription>
                      Assign questions by date and difficulty level
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date Input */}
                  <div className="space-y-2">
                    <Label htmlFor="question-date">Date</Label>
                    <Input
                      id="question-date"
                      type="date"
                      value={questionForm.date}
                      onChange={(e) => setQuestionForm(prev => ({
                        ...prev,
                        date: e.target.value
                      }))}
                      className="w-full"
                    />
                  </div>

                  {/* Level Dropdown */}
                  <div className="space-y-2">
                    <Label>Difficulty Level <span className="text-red-500">*</span></Label>
                    <div className="flex space-x-2">
                      {levelOptions.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => {
                            setQuestionForm(prev => ({
                              ...prev,
                              level: level.value
                            }));
                          }}
                          className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${
                            questionForm.level === level.value 
                              ? `${level.color} border-current` 
                              : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
                          } flex items-center justify-center`}
                        >
                          <span className={`w-2 h-2 rounded-full mr-2 ${level.dot}`}></span>
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Question Form */}
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="question-title">Problem Title <span className="text-red-500">*</span></Label>
                    <Input
                      id="question-title"
                      placeholder="Two Sum Problem"
                      value={questionForm.title}
                      onChange={(e) => setQuestionForm(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                      className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="question-link">Problem Link <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        id="question-link"
                        placeholder="https://leetcode.com/problems/..."
                        value={questionForm.link}
                        onChange={(e) => setQuestionForm(prev => ({
                          ...prev,
                          link: e.target.value
                        }))}
                        className="bg-white text-gray-900 border-gray-300 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {questionForm.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button 
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 hover:bg-blue-300 text-blue-800"
                          >
                            <span className="sr-only">Remove tag</span>
                            <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                              <path fillRule="evenodd" d="M4 3.293l2.146-2.147a.5.5 0 01.708.708L4.707 4l2.147 2.146a.5.5 0 01-.708.708L4 4.707l-2.146 2.147a.5.5 0 01-.708-.708L3.293 4 1.146 1.854a.5.5 0 01.708-.708L4 3.293z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="relative">
                      <Input
                        placeholder="Add tags (e.g., Array, Hash Table)"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && currentTag.trim()) {
                            e.preventDefault();
                            addTag(currentTag.trim());
                          }
                        }}
                        className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button
                          type="button"
                          onClick={() => currentTag.trim() && addTag(currentTag.trim())}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {commonTags
                        .filter(tag => 
                          tag.toLowerCase().includes(currentTag.toLowerCase()) && 
                          !questionForm.tags.includes(tag)
                        )
                        .slice(0, 5)
                        .map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
                          >
                            {tag}
                          </button>
                        ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="question-description">Description <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="question-description"
                      placeholder="Brief description of the problem..."
                      value={questionForm.description}
                      onChange={(e) => setQuestionForm(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                      rows={4}
                      className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex justify-center pt-4">
                    <Button 
                      onClick={handleSaveQuestion}
                      className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-colors"
                    >
                      Assign Question
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Questions List */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned Questions</CardTitle>
                <CardDescription>
                  View and manage previously assigned questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(assignedQuestions).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No questions have been assigned yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(assignedQuestions).map(([date, levels]) => (
                      <div key={date} className="border rounded-lg p-4">
                        <h3 className="font-medium mb-3">
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(levels).map(([level, question]) => (
                            <div key={level} className="flex items-start gap-3 p-3 bg-muted/30 rounded">
                              <Badge 
                                className={
                                  level === 'easy' ? 'bg-success text-success-foreground' :
                                  level === 'medium' ? 'bg-warning text-warning-foreground' :
                                  level === 'hard' ? 'bg-destructive text-destructive-foreground' :
                                  'bg-accent text-accent-foreground'
                                }
                              >
                                {level === 'choice' ? 'Choice' : level}
                              </Badge>
                              <div className="flex-1">
                                <h4 className="font-medium">{question.title}</h4>
                                {question.link && (
                                  <a 
                                    href={question.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    View Problem
                                  </a>
                                )}
                                {question.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {question.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Student Management</CardTitle>
                  <CardDescription>
                    View and manage student accounts and their progress
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddStudentOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Student
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <Input
                        type="search"
                        placeholder="Search students..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="course-filter">Course</Label>
                      <select
                        id="course-filter"
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                        value={filters.course}
                        onChange={(e) => setFilters({...filters, course: e.target.value, section: '', semester: ''})}
                      >
                        <option value="">All Courses</option>
                        {courses.map(course => (
                          <option key={course} value={course}>{course}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="section-filter">Section</Label>
                      <select
                        id="section-filter"
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                        value={filters.section}
                        onChange={(e) => setFilters({...filters, section: e.target.value, semester: ''})}
                        disabled={!filters.course}
                      >
                        <option value="">All Sections</option>
                        {sections.map(section => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="semester-filter">Semester</Label>
                      <select
                        id="semester-filter"
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                        value={filters.semester}
                        onChange={(e) => setFilters({...filters, semester: e.target.value})}
                        disabled={!filters.section}
                      >
                        <option value="">All Semesters</option>
                        {semesters.map(semester => (
                          <option key={semester} value={semester}>Sem {semester}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b">
                        <tr className="border-b border-gray-200 dark:border-gray-800">
                          <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400">Name</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400">Enrollment</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400">Course</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400">Section</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400">Semester</th>
                          <th className="h-12 px-4 text-right align-middle font-medium text-gray-500 dark:text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => (
                            <tr 
                              key={student.id} 
                              className="border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                            >
                              <td className="p-4 align-middle font-medium">
                                <div className="flex items-center space-x-3">
                                  <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <span className="text-sm font-medium">{student.name.charAt(0)}</span>
                                  </div>
                                  <div>
                                    <div className="font-medium">{student.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{student.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 align-middle">{student.enrollment_no}</td>
                              <td className="p-4 align-middle">{student.course}</td>
                              <td className="p-4 align-middle">{student.section}</td>
                              <td className="p-4 align-middle">Sem {student.semester}</td>
                              <td className="p-4 align-middle text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 px-2"
                                    onClick={() => handleEditStudent(student)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 px-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    onClick={() => handleDeleteStudent(student.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                              No students found matching your criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exam Mode Tab */}
          <TabsContent value="exam-mode" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exam Cooldown Settings</CardTitle>
                <CardDescription>
                  Configure exam periods where student streaks are paused
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Exam Mode Status</h4>
                    <p className="text-sm text-muted-foreground">
                      {examMode ? "Currently active - students see exam banner" : "Not active - normal operation"}
                    </p>
                  </div>
                  <Switch checked={examMode} onCheckedChange={handleExamModeToggle} />
                </div>

                {examMode && (
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Exam Mode Active</span>
                    </div>
                    <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                      📚 Students are seeing: "All The Best For Your Exams! Your streak is paused during this period."
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exam-start">Exam Start Date</Label>
                    <Input
                      id="exam-start"
                      type="date"
                      value={examStartDate}
                      onChange={(e) => setExamStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exam-end">Exam End Date</Label>
                    <Input
                      id="exam-end"
                      type="date"
                      value={examEndDate}
                      onChange={(e) => setExamEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Exam Period Rules</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Student streaks are automatically paused during exam periods</p>
                    <p>• No streak breaks are counted for missed days during exams</p>
                    <p>• Students can still submit solutions (optional setting)</p>
                    <p>• A banner message is displayed to all students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Daily Analytics</CardTitle>
                    <CardDescription>View detailed analytics for the selected date</CardDescription>
                  </div>
                  <div className="w-full md:w-auto">
                    <Input
                      type="date"
                      value={analyticsDate}
                      onChange={(e) => setAnalyticsDate(e.target.value)}
                      className="w-full md:w-48"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                          <p className="text-3xl font-bold">
                            {Math.floor(mockStudents.length * 0.7)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {Math.round((mockStudents.length * 0.7 / mockStudents.length) * 100)}% participation
                          </p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg. Completion Time</p>
                          <p className="text-3xl font-bold">
                            {Math.floor(Math.random() * 60) + 30} min
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {Math.floor(Math.random() * 10) + 5}% faster than average
                          </p>
                        </div>
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                          <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                          <p className="text-3xl font-bold">
                            {Math.floor(Math.random() * 20) + 75}%
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {Math.floor(Math.random() * 15) + 5}% better than average
                          </p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                          <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Question Performance</CardTitle>
                      <CardDescription>Submissions by difficulty level</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {['easy', 'medium', 'hard', 'choice'].map((difficulty) => {
                          // Simulate random data for demonstration
                          const total = Math.floor(Math.random() * 20) + 5;
                          const maxTotal = 25; // Max for 100% width
                          const percentage = (total / maxTotal) * 100;
                          
                          return (
                            <div key={difficulty} className="space-y-2">
                              <div className="flex justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline"
                                    className={
                                      difficulty === 'easy' ? 'bg-green-100 text-green-800 border-green-200' :
                                      difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                      difficulty === 'hard' ? 'bg-red-100 text-red-800 border-red-200' :
                                      'bg-purple-100 text-purple-800 border-purple-200'
                                    }
                                  >
                                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {assignedQuestions[analyticsDate]?.[difficulty]?.title || 'No question assigned'}
                                  </span>
                                </div>
                                <span className="font-medium">{total}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    difficulty === 'easy' ? 'bg-green-500' :
                                    difficulty === 'medium' ? 'bg-yellow-500' :
                                    difficulty === 'hard' ? 'bg-red-500' :
                                    'bg-purple-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Student Participation</CardTitle>
                      <CardDescription>Submission status by students</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockStudents.slice(0, 5).map((student) => {
                          const hasSubmitted = Math.random() > 0.3;
                          const isOnTime = hasSubmitted && Math.random() > 0.2;
                          
                          return (
                            <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                  <span className="text-sm font-medium">{student.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-sm text-muted-foreground">{student.course} - Sec {student.section}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {hasSubmitted ? (
                                  <Badge variant={isOnTime ? 'default' : 'secondary'} className="gap-1">
                                    {isOnTime ? (
                                      <>
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        On Time
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="h-3.5 w-3.5" />
                                        Late
                                      </>
                                    )}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {mockStudents.length > 5 && (
                          <Button variant="ghost" className="w-full text-primary">
                            View all {mockStudents.length} students
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest submissions and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      id: 1, 
                      student: mockStudents[0], 
                      action: 'submitted', 
                      question: 'Two Sum', 
                      difficulty: 'easy',
                      time: '2 minutes ago',
                      success: true 
                    },
                    { 
                      id: 2, 
                      student: mockStudents[1], 
                      action: 'started', 
                      question: 'Add Two Numbers', 
                      difficulty: 'medium',
                      time: '15 minutes ago',
                      success: null
                    },
                    { 
                      id: 3, 
                      student: mockStudents[2], 
                      action: 'submitted', 
                      question: 'Median of Two Sorted Arrays', 
                      difficulty: 'hard',
                      time: '1 hour ago',
                      success: false
                    },
                  ].map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium">{activity.student.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.student.name}</span>{' '}
                          <span className="text-muted-foreground">{activity.action}</span>{' '}
                          <span className="font-medium">{activity.question}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={
                              activity.difficulty === 'easy' ? 'bg-green-100 text-green-800 border-green-200' :
                              activity.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-red-100 text-red-800 border-red-200'
                            }
                          >
                            {activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                      </div>
                      {activity.success !== null && (
                        <div className="flex-shrink-0">
                          {activity.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;