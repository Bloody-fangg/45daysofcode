import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Code, Github, Link, Send, X } from 'lucide-react';

interface SubmissionModalProps {
  question: {
    title: string;
    description: string;
    difficulty: string;
    link?: string;
  };
  onClose: () => void;
  onSubmit: (submission: any) => void;
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({ question, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    code: '',
    githubLink: '',
    externalLink: question.link || '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'hard': return 'bg-destructive text-destructive-foreground';
      case 'choice': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      toast({
        variant: "destructive",
        title: "Code Required",
        description: "Please enter your solution code"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Simulate submission delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const submission = {
        question_title: question.title,
        difficulty: question.difficulty,
        code_text: formData.code,
        github_file_link: formData.githubLink,
        external_problem_link: formData.externalLink,
        notes: formData.notes,
        submitted_at: new Date().toISOString()
      };
      
      onSubmit(submission);
      
      toast({
        title: "Submission Successful! 🎉",
        description: "Your solution has been submitted and your streak has been updated."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Failed to submit your solution. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(question.difficulty)}>
                  {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                </Badge>
                <DialogTitle className="text-xl">{question.title}</DialogTitle>
              </div>
              <DialogDescription className="text-base">
                {question.description}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code Solution */}
          <div className="space-y-3">
            <Label htmlFor="code" className="text-base font-medium">
              Your Solution Code *
            </Label>
            <Textarea
              id="code"
              placeholder="// Paste your complete solution code here
function solveProblem() {
  // Your implementation
  return result;
}

// Include test cases if needed"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              className="min-h-[200px] font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              Include your complete solution with proper formatting and comments
            </p>
          </div>

          {/* GitHub Link */}
          <div className="space-y-3">
            <Label htmlFor="githubLink" className="text-base font-medium">
              GitHub File Link
              <span className="text-muted-foreground ml-1">(Optional)</span>
            </Label>
            <div className="relative">
              <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="githubLink"
                placeholder="https://github.com/username/repo/blob/main/day1-solution.js"
                value={formData.githubLink}
                onChange={(e) => setFormData(prev => ({ ...prev, githubLink: e.target.value }))}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Direct link to your solution file in your GitHub repository
            </p>
          </div>

          {/* External Problem Link */}
          <div className="space-y-3">
            <Label htmlFor="externalLink" className="text-base font-medium">
              Problem Link
            </Label>
            <div className="relative">
              <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="externalLink"
                placeholder="https://leetcode.com/problems/..."
                value={formData.externalLink}
                onChange={(e) => setFormData(prev => ({ ...prev, externalLink: e.target.value }))}
                className="pl-10"
                readOnly={!!question.link}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-medium">
              Notes & Approach
              <span className="text-muted-foreground ml-1">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Describe your approach, time/space complexity, challenges faced, etc."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>

          {/* Submission Guidelines */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Code className="w-4 h-4" />
              Submission Guidelines
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Ensure your code is working and handles edge cases</li>
              <li>• Include proper comments and formatting</li>
              <li>• Test your solution before submitting</li>
              <li>• Submit only one solution per difficulty per day</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="hero" 
              disabled={submitting}
              className="flex-1 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit Solution"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionModal;