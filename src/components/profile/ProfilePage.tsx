import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Github, 
  Calendar,
  TrendingUp,
  Target,
  Award,
  Edit,
  Save,
  X,
  ArrowLeft,
  LogOut,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Code
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { userData, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast({
        title: 'Logged out successfully',
        description: 'See you tomorrow for your next coding challenge!',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: 'Failed to log out. Please try again.',
      });
    }
  };
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: userData?.name || '',
    enrollment_no: userData?.enrollment_no || '',
    course: userData?.course || '',
    section: userData?.section || '',
    semester: userData?.semester || '',
    github_repo_link: userData?.github_repo_link || ''
  });

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-heading font-semibold">Loading Profile...</h2>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    try {
      // Simulate API call to update profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully"
      });
      setEditMode(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update profile. Please try again."
      });
    }
  };

  // Mock calendar data - replace with real data
  const mockCalendarData = [
    { date: '2024-12-01', status: 'completed' },
    { date: '2024-12-02', status: 'completed' },
    { date: '2024-12-03', status: 'missed' },
    { date: '2024-12-04', status: 'completed' },
    { date: '2024-12-05', status: 'completed' },
    { date: '2024-12-06', status: 'paused' },
    { date: '2024-12-07', status: 'completed' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'missed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'paused':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'missed':
        return 'Missed';
      case 'paused':
        return 'Paused (Exam)';
      default:
        return 'Unknown';
    }
  };

  const totalAttempts = userData.attempts.easy + userData.attempts.medium + userData.attempts.hard + userData.attempts.choice;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold">Profile</h1>
              <p className="text-muted-foreground">Manage your account and view your progress</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-white bg-[#1f41a1] hover:bg-[#1a3790] border-[#1f41a1] hover:border-[#1a3790]"
              >
                <Code className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                    className={editMode ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive hover:border-destructive" : "bg-[#7AD1E4] hover:bg-[#7AD1E4]/90 text-black border-[#7AD1E4] hover:border-[#7AD1E4]"}
                  >
                    {editMode ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    <span className="ml-1">{editMode ? 'Cancel' : 'Edit'}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar and Name */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-semibold">{userData.name}</h3>
                    <p className="text-muted-foreground">{userData.email}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {editMode ? (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Name</Label>
                          <Input value={editData.name} onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Enrollment Number</Label>
                          <Input value={editData.enrollment_no} onChange={(e) => setEditData(prev => ({ ...prev, enrollment_no: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Course</Label>
                          <Input value={editData.course} onChange={(e) => setEditData(prev => ({ ...prev, course: e.target.value }))} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Enrollment Number</Label>
                          <p className="font-medium">{userData.enrollment_no}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Course</Label>
                          <p className="font-medium">{userData.course}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Section</Label>
                          <p className="font-medium">{userData.section}</p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {editMode ? (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Section</Label>
                          <Input value={editData.section} onChange={(e) => setEditData(prev => ({ ...prev, section: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Semester</Label>
                          <Input value={editData.semester} onChange={(e) => setEditData(prev => ({ ...prev, semester: e.target.value }))} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Semester</Label>
                          <p className="font-medium">{userData.semester}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                      <p className="font-medium">
                        {new Date(userData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                      <Badge variant={userData.disqualified ? "destructive" : "outline"} className={userData.disqualified ? "" : "bg-[#7AD1E4] hover:bg-[#7AD1E4] text-black border-[#7AD1E4]"}>
                        {userData.disqualified ? "Disqualified" : "Active"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* GitHub Repository */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">GitHub Repository</Label>
                  {editMode ? (
                    <div className="space-y-3">
                      <Input
                        placeholder="https://github.com/username/45-days-of-code"
                        value={editData.github_repo_link}
                        onChange={(e) => setEditData(prev => ({ ...prev, github_repo_link: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {userData.github_repo_link ? (
                        <Button 
                          variant="outline" 
                          onClick={() => window.open(userData.github_repo_link, '_blank')}
                          className="bg-white hover:bg-gray-100 text-black border-gray-300"
                        >
                          <Github className="w-4 h-4 mr-2 text-black" />
                          <span className="text-black">View Repository</span>
                        </Button>
                      ) : (
                        <p className="text-muted-foreground italic">No repository linked</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your submission history for the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockCalendarData.slice(0, 5).map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(day.status)}
                        <div>
                          <p className="font-medium">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                          <p className="text-sm text-muted-foreground">
                            {getStatusLabel(day.status)}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          day.status === 'completed' ? 'default' : 
                          day.status === 'missed' ? 'destructive' : 
                          'secondary'
                        }
                      >
                        {getStatusLabel(day.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Streak Card */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-200 dark:border-orange-800">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <Flame className="w-5 h-5" />
                    <span className="font-heading font-semibold">Current Streak</span>
                  </div>
                  <div className="text-4xl font-heading font-bold text-orange-600 dark:text-orange-400">
                    {userData.streak_count}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {userData.streak_count === 1 ? 'day' : 'days'} of consistent coding
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Your Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-success/10 border border-success/20">
                    <div className="text-2xl font-bold text-success">{userData.attempts.easy}</div>
                    <div className="text-xs text-muted-foreground">Easy</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="text-2xl font-bold text-warning">{userData.attempts.medium}</div>
                    <div className="text-xs text-muted-foreground">Medium</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="text-2xl font-bold text-destructive">{userData.attempts.hard}</div>
                    <div className="text-xs text-muted-foreground">Hard</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="text-2xl font-bold text-accent">{userData.attempts.choice}</div>
                    <div className="text-xs text-muted-foreground">Choice</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Submissions</span>
                    <span className="font-bold text-lg">{totalAttempts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Streak Breaks</span>
                    <Badge variant={userData.streak_breaks === 0 ? "default" : "destructive"}>
                      {userData.streak_breaks}/3
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievement Badge */}
            <Card className="bg-gradient-accent text-accent-foreground">
              <CardContent className="pt-6 text-center">
                <Award className="w-12 h-12 mx-auto mb-3" />
                <h3 className="font-heading font-semibold mb-2">Coding Warrior</h3>
                <p className="text-sm opacity-90">
                  {totalAttempts >= 50 ? "Master Coder! 50+ submissions" :
                   totalAttempts >= 25 ? "Advanced Coder! 25+ submissions" :
                   totalAttempts >= 10 ? "Rising Star! 10+ submissions" :
                   "Getting Started! Keep coding!"}
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-[#1f41a1] hover:bg-[#1a3790] text-white border-[#1f41a1] hover:border-[#1a3790]"
                  onClick={() => navigate('/dashboard')}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                {userData.github_repo_link && (
                  <Button 
                    className="w-full bg-white hover:bg-gray-100 text-black border-gray-300"
                    onClick={() => window.open(userData.github_repo_link, '_blank')}
                  >
                    <Github className="w-4 h-4 mr-2 text-black" />
                    <span className="text-black">Open GitHub Repo</span>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;