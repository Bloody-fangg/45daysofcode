// Firebase service exports
export { authService, ADMIN_EMAIL } from './auth';
export { questionsService } from './questions';
export { submissionsService } from './submissions';
export { assignmentsService } from './assignments';
export { notificationsService } from './notifications';
export { usersService } from './users';
export { examCooldownService } from './examCooldown';
export { scheduleService } from './scheduleService';
export { registrationService } from './registration';
export { qaService } from './qa';

// Re-export types
export type { Question } from './questions';
export type { Submission } from './submissions';
export type { Assignment, QuestionAssignment } from './assignments';
export type { Notification } from './notifications';
export type { ExamCooldown, ProgramExamCooldown } from './examCooldown';
export type { ScheduledAssignment, StreakCalculation } from './scheduleService';
export type { RegistrationSettings } from './registration';
export type { StudentQuestion } from './qa';
