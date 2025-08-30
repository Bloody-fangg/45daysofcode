import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import { Assignment, assignmentsService } from './assignments';
import { examCooldownService, ExamCooldown } from './examCooldown';
import { submissionsService } from './submissions';

export interface ScheduledAssignment extends Assignment {
  isVisible: boolean; // Whether this assignment should be visible to students
  isActive: boolean;  // Whether this assignment is currently active (today)
  isUpcoming: boolean; // Whether this assignment is in the future
  isPast: boolean;    // Whether this assignment is from the past
}

export interface StreakCalculation {
  currentStreak: number;
  isStreakActive: boolean;
  streakBreakReason?: 'missed_submission' | 'exam_period' | 'no_assignment_scheduled';
  lastSubmissionDate?: string;
  nextRequiredDate?: string;
  missedDays: string[];
  examDays: string[];
  scheduledDays: string[];
}

// Enhanced schedule service for assignment visibility and streak management
export const scheduleService = {
  
  // Get assignments that should be visible to students based on their assigned dates
  async getVisibleAssignments(studentUid?: string): Promise<ScheduledAssignment[]> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get all assignments that have dates assigned (supports unlimited days, not just 45)
      const allAssignments = await assignmentsService.getAllAssignments();
      const assignmentsWithDates = allAssignments.filter(assignment => 
        assignment.date && assignment.date.trim() !== ''
      );
      
      // Get exam cooldown settings to check for exam periods
      const examSettings = await examCooldownService.getExamCooldown();
      
      return assignmentsWithDates.map(assignment => {
        const assignmentDate = new Date(assignment.date);
        const isToday = assignment.date === todayStr;
        const isPast = assignmentDate < today && !isToday;
        const isUpcoming = assignmentDate > today;
        
        // Check if assignment date falls within exam period
        const isInExamPeriod = examSettings ? examCooldownService.isExamPeriod(examSettings) : false;
        
        return {
          ...assignment,
          isVisible: true, // All assignments with dates are visible (regardless of day number)
          isActive: isToday && !isInExamPeriod,
          isUpcoming,
          isPast,
        } as ScheduledAssignment;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error getting visible assignments:', error);
      return [];
    }
  },

  // Get today's active assignment (if any)
  async getTodaysAssignment(): Promise<ScheduledAssignment | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const assignment = await assignmentsService.getAssignment(today);
      
      if (!assignment || !assignment.date) {
        return null;
      }
      
      // Check if we're in exam period
      const examSettings = await examCooldownService.getExamCooldown();
      const isInExamPeriod = examSettings ? examCooldownService.isExamPeriod(examSettings) : false;
      
      return {
        ...assignment,
        isVisible: true,
        isActive: !isInExamPeriod,
        isUpcoming: false,
        isPast: false,
      } as ScheduledAssignment;
    } catch (error) {
      console.error('Error getting today\'s assignment:', error);
      return null;
    }
  },

  // Calculate enhanced streak considering exam periods and assignment scheduling
  async calculateEnhancedStreak(studentUid: string): Promise<StreakCalculation> {
    try {
      // Get all student submissions
      const submissions = await submissionsService.getStudentSubmissions(studentUid);
      
      // Get all scheduled assignments (those with dates)
      const scheduledAssignments = await this.getVisibleAssignments();
      
      // Get exam cooldown settings
      const examSettings = await examCooldownService.getExamCooldown();
      
      // Create sets of important dates
      const submissionDates = new Set(
        submissions
          .filter(sub => sub.adminReview?.status === 'approved')
          .map(sub => sub.question_date)
      );
      
      const scheduledDates = new Set(
        scheduledAssignments
          .map(assignment => assignment.date)
          .filter((date): date is string => Boolean(date))
      );
      
      const examDays: string[] = [];
      const scheduledDays = Array.from(scheduledDates).sort();
      const missedDays: string[] = [];
      
      // Calculate exam period dates if active
      if (examSettings && examSettings.active && examSettings.start_date && examSettings.end_date) {
        const startDate = new Date(examSettings.start_date);
        const endDate = new Date(examSettings.end_date);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          examDays.push(d.toISOString().split('T')[0]);
        }
      }
      
      // Find missed days (scheduled assignments not submitted)
      scheduledDays.forEach((date: string) => {
        const dateObj = new Date(date);
        const today = new Date();
        const isExamDay = examDays.includes(date);
        
        // Only count as missed if:
        // 1. Date has passed
        // 2. Not an exam day
        // 3. No approved submission
        if (dateObj < today && !isExamDay && !submissionDates.has(date)) {
          missedDays.push(date);
        }
      });
      
      // Calculate current streak
      let currentStreak = 0;
      let lastSubmissionDate: string | undefined;
      
      // Work backwards from most recent scheduled dates
      const recentScheduledDates = scheduledDays.slice().reverse();
      
      for (const date of recentScheduledDates) {
        const dateStr = date as string; // Type assertion for the loop variable
        const dateObj = new Date(dateStr);
        const today = new Date();
        const isExamDay = examDays.includes(dateStr);
        
        // Skip future dates
        if (dateObj > today) continue;
        
        if (submissionDates.has(dateStr)) {
          currentStreak++;
          if (!lastSubmissionDate) lastSubmissionDate = dateStr;
        } else if (!isExamDay) {
          // Break streak only if it's not an exam day
          break;
        }
        // If it's an exam day, continue counting (don't break streak)
      }
      
      // Find next required submission date
      const today = new Date().toISOString().split('T')[0];
      const nextRequiredDate: string | undefined = (scheduledDays as string[]).find((date: string) => date > today);
      
      // Determine if streak is active
      const isStreakActive = currentStreak > 0 || examDays.includes(today);
      
      // Determine streak break reason
      let streakBreakReason: StreakCalculation['streakBreakReason'];
      if (!isStreakActive) {
        if (examDays.includes(today)) {
          streakBreakReason = 'exam_period';
        } else if (!scheduledDates.has(today)) {
          streakBreakReason = 'no_assignment_scheduled';
        } else if (missedDays.length > 0) {
          streakBreakReason = 'missed_submission';
        }
      }
      
      return {
        currentStreak,
        isStreakActive,
        streakBreakReason,
        lastSubmissionDate,
        nextRequiredDate,
        missedDays,
        examDays,
        scheduledDays: scheduledDays as string[]
      };
    } catch (error) {
      console.error('Error calculating enhanced streak:', error);
      return {
        currentStreak: 0,
        isStreakActive: false,
        missedDays: [],
        examDays: [],
        scheduledDays: []
      };
    }
  },

  // Check if student can submit today (based on assignment schedule and exam periods)
  async canSubmitToday(studentUid: string): Promise<{
    canSubmit: boolean;
    reason?: string;
    assignment?: ScheduledAssignment;
  }> {
    try {
      const todaysAssignment = await this.getTodaysAssignment();
      const examSettings = await examCooldownService.getExamCooldown();
      
      // Check if we're in exam period
      if (examSettings && examCooldownService.isExamPeriod(examSettings)) {
        return {
          canSubmit: false,
          reason: 'exam_period'
        };
      }
      
      // Check if there's an assignment scheduled for today
      if (!todaysAssignment || !todaysAssignment.isActive) {
        return {
          canSubmit: false,
          reason: 'no_assignment_scheduled'
        };
      }
      
      // Check if already submitted and approved
      const today = new Date().toISOString().split('T')[0];
      const hasSubmitted = await submissionsService.hasSubmittedAnyForDate(studentUid, today);
      
      if (hasSubmitted) {
        // Check if any submission is approved
        const submissions = await submissionsService.getStudentSubmissions(studentUid);
        const todaySubmissions = submissions.filter(sub => sub.question_date === today);
        const hasApproved = todaySubmissions.some(sub => sub.adminReview?.status === 'approved');
        
        if (hasApproved) {
          return {
            canSubmit: false,
            reason: 'already_completed',
            assignment: todaysAssignment
          };
        }
      }
      
      return {
        canSubmit: true,
        assignment: todaysAssignment
      };
    } catch (error) {
      console.error('Error checking if can submit today:', error);
      return {
        canSubmit: false,
        reason: 'error'
      };
    }
  },

  // Get assignment calendar for student dashboard
  async getAssignmentCalendar(studentUid: string): Promise<{
    [date: string]: {
      status: 'scheduled' | 'completed' | 'missed' | 'exam' | 'not_scheduled';
      assignment?: ScheduledAssignment;
      hasSubmission: boolean;
      isApproved: boolean;
    };
  }> {
    try {
      const visibleAssignments = await this.getVisibleAssignments();
      const submissions = await submissionsService.getStudentSubmissions(studentUid);
      const examSettings = await examCooldownService.getExamCooldown();
      
      const calendar: any = {};
      
      // Get exam period dates
      const examDates = new Set<string>();
      if (examSettings && examSettings.active && examSettings.start_date && examSettings.end_date) {
        const startDate = new Date(examSettings.start_date);
        const endDate = new Date(examSettings.end_date);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          examDates.add(d.toISOString().split('T')[0]);
        }
      }
      
      // Process each scheduled assignment
      for (const assignment of visibleAssignments) {
        const date = assignment.date;
        const dateObj = new Date(date);
        const today = new Date();
        
        // Get submissions for this date
        const dateSubmissions = submissions.filter(sub => sub.question_date === date);
        const hasSubmission = dateSubmissions.length > 0;
        const isApproved = dateSubmissions.some(sub => sub.adminReview?.status === 'approved');
        
        let status: 'scheduled' | 'completed' | 'missed' | 'exam' | 'not_scheduled';
        
        if (examDates.has(date)) {
          status = 'exam';
        } else if (isApproved) {
          status = 'completed';
        } else if (dateObj < today) {
          status = 'missed';
        } else {
          status = 'scheduled';
        }
        
        calendar[date] = {
          status,
          assignment,
          hasSubmission,
          isApproved
        };
      }
      
      return calendar;
    } catch (error) {
      console.error('Error getting assignment calendar:', error);
      return {};
    }
  }
};
