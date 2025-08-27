import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, User, Mail, Lock, GraduationCap, Github, Hash, BookOpen } from 'lucide-react';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    enrollmentNo: '',
    email: '',
    password: '',
    course: '',
    section: '',
    semester: '',
    githubRepo: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const requiredFields = ['name', 'enrollmentNo', 'email', 'password', 'course', 'section', 'semester'];
    const emptyFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (emptyFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Password must be at least 6 characters long"
      });
      return;
    }

    try {
      setLoading(true);
      await signup(formData.email, formData.password, {
        name: formData.name,
        enrollment_no: formData.enrollmentNo,
        course: formData.course,
        section: formData.section,
        semester: formData.semester,
        github_repo_link: formData.githubRepo
      });
      
      toast({
        title: "Welcome to 45 Days Of Code! 🚀",
        description: "Your account has been created successfully. Let's start coding!"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Failed to create account"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background py-8 px-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-up">
          <h1 className="text-4xl font-heading font-bold mb-2">Join 45 Days Of Code</h1>
          <p className="text-muted-foreground text-lg">Start your coding journey at Amity University</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left side - Benefits */}
          <div className="lg:col-span-1 space-y-6 animate-slide-up">
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-lg mb-4">Why Join?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-success font-semibold">1</span>
                  </div>
                  <div>
                    <div className="font-medium">Build Consistency</div>
                    <div className="text-sm text-muted-foreground">Code daily for 45 days straight</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent font-semibold">2</span>
                  </div>
                  <div>
                    <div className="font-medium">Track Progress</div>
                    <div className="text-sm text-muted-foreground">Visual streak counter and stats</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold">3</span>
                  </div>
                  <div>
                    <div className="font-medium">Multiple Levels</div>
                    <div className="text-sm text-muted-foreground">Easy, Medium, Hard, Choice</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-accent">
              <h4 className="font-heading font-semibold text-accent-foreground mb-2">
                🔥 Streak Challenge
              </h4>
              <p className="text-accent-foreground/80 text-sm">
                Miss 3 days and you're out! Keep the fire burning with daily submissions.
              </p>
            </Card>
          </div>

          {/* Right side - Form */}
          <div className="lg:col-span-2 animate-scale-in">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-2xl font-heading">Create Your Account</CardTitle>
                <CardDescription>Fill in your details to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="Your full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    {/* Enrollment Number */}
                    <div className="space-y-2">
                      <Label htmlFor="enrollmentNo">Enrollment Number *</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="enrollmentNo"
                          placeholder="A12345678"
                          value={formData.enrollmentNo}
                          onChange={(e) => handleInputChange('enrollmentNo', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@student.amity.edu"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password (min. 6 characters)"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Course */}
                    <div className="space-y-2">
                      <Label htmlFor="course">Course *</Label>
                      <Select value={formData.course} onValueChange={(value) => handleInputChange('course', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B.Tech CSE">B.Tech CSE</SelectItem>
                          <SelectItem value="B.Tech IT">B.Tech IT</SelectItem>
                          <SelectItem value="B.Tech ECE">B.Tech ECE</SelectItem>
                          <SelectItem value="B.Tech EEE">B.Tech EEE</SelectItem>
                          <SelectItem value="BCA">BCA</SelectItem>
                          <SelectItem value="MCA">MCA</SelectItem>
                          <SelectItem value="M.Tech">M.Tech</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Section */}
                    <div className="space-y-2">
                      <Label htmlFor="section">Section *</Label>
                      <Select value={formData.section} onValueChange={(value) => handleInputChange('section', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Section A</SelectItem>
                          <SelectItem value="B">Section B</SelectItem>
                          <SelectItem value="C">Section C</SelectItem>
                          <SelectItem value="D">Section D</SelectItem>
                          <SelectItem value="E">Section E</SelectItem>
                          <SelectItem value="F">Section F</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Semester */}
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester *</Label>
                      <Select value={formData.semester} onValueChange={(value) => handleInputChange('semester', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sem" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Semester</SelectItem>
                          <SelectItem value="2">2nd Semester</SelectItem>
                          <SelectItem value="3">3rd Semester</SelectItem>
                          <SelectItem value="4">4th Semester</SelectItem>
                          <SelectItem value="5">5th Semester</SelectItem>
                          <SelectItem value="6">6th Semester</SelectItem>
                          <SelectItem value="7">7th Semester</SelectItem>
                          <SelectItem value="8">8th Semester</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* GitHub Repository */}
                  <div className="space-y-2">
                    <Label htmlFor="githubRepo">
                      GitHub Repository Link
                      <span className="text-muted-foreground ml-1">(Optional)</span>
                    </Label>
                    <div className="relative">
                      <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="githubRepo"
                        placeholder="https://github.com/username/45-days-of-code"
                        value={formData.githubRepo}
                        onChange={(e) => handleInputChange('githubRepo', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Link your GitHub repository to track your code submissions
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="hero" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Start My Coding Journey 🚀"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-muted-foreground">
                    Already have an account?{" "}
                    <Link 
                      to="/login" 
                      className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;