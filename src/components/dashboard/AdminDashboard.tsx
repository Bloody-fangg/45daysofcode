import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
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
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

// Mock data
const mockStudents = [
  {
    id: '1',
    name: 'Alice Johnson',
    enrollment_no: 'A12345678',
    email: 'alice@student.amity.edu',
    course: 'B.Tech CSE',
    section: 'A',
    streak_count: 12,
    streak_breaks: 0,
    disqualified: false,
    attempts: { easy: 15, medium: 8, hard: 3, choice: 5 },
    last_submission: '2024-12-15'
  },
  {
    id: '2',
    name: 'Bob Smith',
    enrollment_no: 'A87654321',
    email: 'bob@student.amity.edu',
    course: 'B.Tech IT',
    section: 'B',
    streak_count: 8,
    streak_breaks: 1,
    disqualified: false,
    attempts: { easy: 12, medium: 6, hard: 2, choice: 4 },
    last_submission: '2024-12-14'
  },
  {
    id: '3',
    name: 'Charlie Brown',
    enrollment_no: 'A11223344',
    email: 'charlie@student.amity.edu',
    course: 'BCA',
    section: 'A',
    streak_count: 0,
    streak_breaks: 3,
    disqualified: true,
    attempts: { easy: 5, medium: 2, hard: 0, choice: 1 },
    last_submission: '2024-12-10'
  }
];

const AdminDashboard = () => {
  const { userData, logout } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [examMode, setExamMode] = useState(false);
  const [examStartDate, setExamStartDate] = useState('');
  const [examEndDate, setExamEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Question form state
  const [questionForm, setQuestionForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    easy: { title: '', description: '', link: '' },
    medium: { title: '', description: '', link: '' },
    hard: { title: '', description: '', link: '' },
    choice: { title: '', description: '', link: '' }
  });

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

  const handleSaveQuestions = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Questions Updated",
        description: `Questions for ${questionForm.date} have been saved successfully`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save questions. Please try again."
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

  const filteredStudents = mockStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.enrollment_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-primary">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-heading font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">45 Days Of Code - Amity University</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
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

        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="questions">Manage Questions</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="exam-mode">Exam Mode</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Manage Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Question Management</CardTitle>
                    <CardDescription>
                      Assign daily questions for each difficulty level
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Import
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Selector */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="question-date">Select Date:</Label>
                  <Input
                    id="question-date"
                    type="date"
                    value={questionForm.date}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-auto"
                  />
                </div>

                {/* Question Forms */}
                {(['easy', 'medium', 'hard', 'choice'] as const).map((difficulty) => (
                  <Card key={difficulty} className="border-l-4" style={{
                    borderLeftColor: 
                      difficulty === 'easy' ? 'hsl(var(--success))' :
                      difficulty === 'medium' ? 'hsl(var(--warning))' :
                      difficulty === 'hard' ? 'hsl(var(--destructive))' :
                      'hsl(var(--accent))'
                  }}>
                    <CardHeader>
                      <CardTitle className="text-lg capitalize flex items-center gap-2">
                        <Badge className={
                          difficulty === 'easy' ? 'bg-success text-success-foreground' :
                          difficulty === 'medium' ? 'bg-warning text-warning-foreground' :
                          difficulty === 'hard' ? 'bg-destructive text-destructive-foreground' :
                          'bg-accent text-accent-foreground'
                        }>
                          {difficulty === 'choice' ? 'Code of Choice' : difficulty}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`${difficulty}-title`}>Problem Title *</Label>
                          <Input
                            id={`${difficulty}-title`}
                            placeholder="Two Sum Problem"
                            value={questionForm[difficulty].title}
                            onChange={(e) => setQuestionForm(prev => ({
                              ...prev,
                              [difficulty]: { ...prev[difficulty], title: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${difficulty}-link`}>Problem Link</Label>
                          <Input
                            id={`${difficulty}-link`}
                            placeholder="https://leetcode.com/problems/..."
                            value={questionForm[difficulty].link}
                            onChange={(e) => setQuestionForm(prev => ({
                              ...prev,
                              [difficulty]: { ...prev[difficulty], link: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`${difficulty}-description`}>Description</Label>
                        <Textarea
                          id={`${difficulty}-description`}
                          placeholder="Brief description of the problem..."
                          value={questionForm[difficulty].description}
                          onChange={(e) => setQuestionForm(prev => ({
                            ...prev,
                            [difficulty]: { ...prev[difficulty], description: e.target.value }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={handleSaveQuestions} variant="hero" size="lg" className="w-full">
                  Save Questions for {questionForm.date}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Student Management</CardTitle>
                    <CardDescription>
                      Monitor student progress and manage accounts
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredStudents.map((student) => (
                    <Card key={student.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-medium">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-medium">{student.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {student.enrollment_no} • {student.course} - {student.section}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-muted-foreground">Streak:</span>
                              <Badge variant={student.streak_count > 0 ? "default" : "secondary"}>
                                {student.streak_count} days
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Breaks:</span>
                              <Badge variant={student.streak_breaks === 0 ? "default" : "destructive"}>
                                {student.streak_breaks}/3
                              </Badge>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-muted-foreground mb-1">Total Attempts</div>
                            <div className="font-medium">
                              {student.attempts.easy + student.attempts.medium + student.attempts.hard + student.attempts.choice}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {student.disqualified ? (
                              <Badge variant="destructive">Disqualified</Badge>
                            ) : (
                              <Badge variant="default">Active</Badge>
                            )}
                          </div>

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedStudent(student)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submission Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['easy', 'medium', 'hard', 'choice'].map((difficulty) => {
                      const total = mockStudents.reduce((sum, student) => 
                        sum + student.attempts[difficulty as keyof typeof student.attempts], 0
                      );
                      const maxTotal = Math.max(...['easy', 'medium', 'hard', 'choice'].map(d => 
                        mockStudents.reduce((sum, student) => 
                          sum + student.attempts[d as keyof typeof student.attempts], 0
                        )
                      ));
                      const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                      
                      return (
                        <div key={difficulty} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="capitalize">{difficulty}</span>
                            <span className="font-medium">{total}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                difficulty === 'easy' ? 'bg-success' :
                                difficulty === 'medium' ? 'bg-warning' :
                                difficulty === 'hard' ? 'bg-destructive' :
                                'bg-accent'
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
                  <CardTitle>Streak Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: '0 days', count: mockStudents.filter(s => s.streak_count === 0).length },
                      { label: '1-5 days', count: mockStudents.filter(s => s.streak_count >= 1 && s.streak_count <= 5).length },
                      { label: '6-15 days', count: mockStudents.filter(s => s.streak_count >= 6 && s.streak_count <= 15).length },
                      { label: '15+ days', count: mockStudents.filter(s => s.streak_count > 15).length },
                    ].map((range, index) => {
                      const percentage = mockStudents.length > 0 ? (range.count / mockStudents.length) * 100 : 0;
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between">
                            <span>{range.label}</span>
                            <span className="font-medium">{range.count}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;