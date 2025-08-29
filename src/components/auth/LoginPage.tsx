import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, Code2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields"
      });
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      toast({
        title: "Welcome back! 🎉",
        description: "Successfully logged in to your account"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or password"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Welcome Section */}
        <div className="hidden lg:block space-y-8 animate-fade-up">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-primary">
                <Code2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-heading font-bold text-foreground">
                  45 Days Of Code
                </h1>
                <p className="text-muted-foreground">Amity University</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-semibold">
                Welcome Back, Coder! 👨‍💻
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Continue your coding journey. Track your progress, maintain your streak, 
                and push your limits in this 45-day challenge.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 rounded-lg bg-card border">
                <div className="text-2xl font-heading font-bold text-primary">45</div>
                <div className="text-sm text-muted-foreground">Days Challenge</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-card border">
                <div className="text-2xl font-heading font-bold text-accent">4</div>
                <div className="text-sm text-muted-foreground">Difficulty Levels</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-card border">
                <div className="text-2xl font-heading font-bold text-success">∞</div>
                <div className="text-sm text-muted-foreground">Growth Potential</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-md mx-auto animate-scale-in">
          <Card className="shadow-elegant">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-heading">Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@student.amity.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="hero" 
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Continue to Dashboard"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <Link 
                    to="/signup" 
                    className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mobile welcome section */}
          <div className="lg:hidden mt-8 text-center space-y-4 animate-fade-up">
            <div className="flex items-center justify-center gap-2">
              <Code2 className="w-6 h-6 text-primary" />
              <span className="font-heading font-semibold text-lg">45 Days Of Code</span>
            </div>
            <p className="text-muted-foreground">
              Amity University - Coding Challenge Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;