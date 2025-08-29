import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Code, X } from 'lucide-react';

interface SubmissionModalProps {
  question: {
    title: string;
    difficulty: string;
  };
  onClose: () => void;
  onSubmit: (code: string) => void;
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({ question, onClose, onSubmit }) => {
  const [code, setCode] = useState('');
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
    
    if (!code.trim()) {
      toast({
        variant: "destructive",
        title: "Code Required",
        description: "Please enter your solution code"
      });
      return;
    }

    try {
      setSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSubmit(code);
      
      toast({
        title: "Submission Successful! ",
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
    <Dialog open={true}>
      <DialogContent 
        className="max-w-6xl w-[95vw] h-[95vh] max-h-[95vh] flex flex-col p-0 overflow-hidden [&>button]:hidden"
      >
        <DialogHeader className="px-8 pt-7 pb-5 border-b bg-muted/20 relative">
          <div className="flex items-center gap-3">
            <Badge 
              className={`${getDifficultyColor(question.difficulty)} text-sm font-medium px-3 py-1`}
            >
              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
            </Badge>
            <DialogTitle className="text-2xl font-semibold tracking-tight pr-12">
              {question.title}
            </DialogTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="absolute right-6 top-6 h-9 w-9 rounded-full text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="space-y-6 max-w-5xl mx-auto w-full">
              <div className="flex items-center justify-between bg-muted/30 rounded-lg px-5 py-3 border">
                <Label htmlFor="code" className="flex items-center gap-2 text-base font-medium">
                  <Code className="h-5 w-5" />
                  Your Solution Code
                </Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {code.length.toLocaleString()} characters
                </span>
              </div>
              
              <div className="relative rounded-xl border overflow-hidden shadow-sm">
                <Textarea
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={`// Write your ${question.difficulty} solution here...\n// You can use any programming language\n// Make sure your code is well-formatted and documented`}
                  className="min-h-[65vh] font-mono text-sm p-6 leading-relaxed focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 resize-none"
                  spellCheck="false"
                  required
                  autoFocus
                />
                {!code && (
                  <div className="absolute inset-0 pointer-events-none flex items-start justify-end p-6">
                    <div className="text-xs text-muted-foreground bg-background/80 px-3 py-1.5 rounded-lg border">
                      Press <kbd className="px-1.5 py-0.5 text-xs border rounded bg-muted font-mono">Tab</kbd> to indent
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t bg-muted/20 px-8 py-5 mt-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Make sure your code is properly formatted and tested before submitting.
              </p>
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={submitting}
                  className="h-11 px-7 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 hover:border-red-400 transition-colors"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="default"
                  size="lg"
                  disabled={submitting || !code.trim()}
                  className="min-w-[160px] h-11 px-7 bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : 'Submit Solution'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionModal;