# Firebase Backend Setup Guide

## Overview
This guide will help you set up Firebase as the backend service for the 45 Days of Code platform.

## Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created at [Firebase Console](https://console.firebase.google.com)
- Project ID: `daysofcode-c0f00`

## Setup Steps

### 1. Firebase Authentication
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Email/Password" provider
3. Add authorized domains if needed

### 2. Firestore Database
1. Go to Firebase Console → Firestore Database
2. Create database in production mode
3. Set location (choose closest to your users)
4. Deploy security rules using: `firebase deploy --only firestore:rules`

### 3. Firebase Storage
1. Go to Firebase Console → Storage
2. Get started with default settings
3. Deploy storage rules using: `firebase deploy --only storage`

### 4. Deploy Security Rules
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules  
firebase deploy --only storage

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### 5. Environment Variables (Optional)
Create `.env.local` file for additional security:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
```

## Database Collections Structure

### Users Collection (`users`)
```javascript
{
  uid: string,
  name: string,
  enrollment_no: string,
  email: string,
  course: string,
  section: string,
  semester: string,
  github_repo_link: string,
  streak_count: number,
  streak_breaks: number,
  disqualified: boolean,
  attempts: {
    easy: number,
    medium: number,
    hard: number,
    choice: number
  },
  calendar: {
    "YYYY-MM-DD": "completed" | "missed" | "paused"
  },
  last_submission: string,
  created_at: string,
  updated_at: string,
  isAdmin: boolean
}
```

### Questions Collection (`questions`)
```javascript
{
  date: string, // YYYY-MM-DD
  difficulty: "easy" | "medium" | "hard" | "choice",
  title: string,
  description: string,
  link: string,
  tags: string[],
  created_at: string,
  updated_at: string
}
```

### Submissions Collection (`submissions`)
```javascript
{
  student_uid: string,
  student_name: string,
  student_email: string,
  question_date: string,
  difficulty: "easy" | "medium" | "hard" | "choice",
  question_title: string,
  code_text: string,
  github_file_link: string,
  external_problem_link: string,
  created_at: string,
  updated_at: string,
  status: "submitted" | "accepted" | "rejected"
}
```

### Exam Cooldown Collection (`exam_cooldown`)
```javascript
{
  active: boolean,
  start_date: string,
  end_date: string,
  pause_submissions_count: boolean,
  message: string,
  created_at: string,
  updated_at: string
}
```

## Firebase Services Usage

### Authentication
```typescript
import { authService } from '@/lib/firebase';

// Sign in
await authService.signIn(email, password);

// Sign up
await authService.signUp(email, password, userData);

// Sign out
await authService.signOut();
```

### Questions Management
```typescript
import { questionsService } from '@/lib/firebase';

// Set question for a date and difficulty
await questionsService.setQuestion({
  date: '2024-01-01',
  difficulty: 'easy',
  title: 'Two Sum',
  description: 'Find two numbers...',
  link: 'https://leetcode.com/problems/two-sum/',
  tags: ['Array', 'Hash Table']
});

// Get questions for a date
const questions = await questionsService.getQuestionsByDate('2024-01-01');
```

### Submissions Management
```typescript
import { submissionsService } from '@/lib/firebase';

// Submit solution
await submissionsService.submitSolution({
  student_uid: 'user123',
  student_name: 'John Doe',
  student_email: 'john@example.com',
  question_date: '2024-01-01',
  difficulty: 'easy',
  question_title: 'Two Sum',
  code_text: 'function twoSum()...',
  github_file_link: 'https://github.com/user/repo/file.js',
  external_problem_link: 'https://leetcode.com/problems/two-sum/'
});
```

### User Management
```typescript
import { usersService } from '@/lib/firebase';

// Update user profile
await usersService.updateUserProfile(uid, { name: 'New Name' });

// Update streak
await usersService.updateUserStreak(uid, 5, 0);

// Increment attempt
await usersService.incrementAttempt(uid, 'easy');
```

## Security Features

### Firestore Security Rules
- Users can only read/write their own data
- Admins have full access to all collections
- Questions are read-only for students
- Submissions are validated by user ownership

### Authentication
- Email/password authentication
- Admin role based on email address
- Protected routes with authentication checks

## Deployment Commands

```bash
# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy all Firebase features
firebase deploy

# Deploy specific services
firebase deploy --only firestore:rules,storage,hosting
```

## Monitoring and Analytics

### Firebase Console
- Monitor authentication usage
- Check Firestore read/write operations
- View storage usage
- Monitor hosting traffic

### Error Handling
All Firebase operations include proper error handling with user-friendly messages.

## Admin Features

### Admin Email
Set admin email in `/src/lib/firebase/auth.ts`:
```typescript
export const ADMIN_EMAIL = 'amiarchive79.in@gmail.com';
```

### Admin Capabilities
- Manage all users
- Create/edit/delete questions
- View all submissions
- Toggle exam mode
- Access analytics

## Local Development with Emulators (Optional)

```bash
# Install Firebase emulators
firebase init emulators

# Start emulators
firebase emulators:start

# Use emulators in development
# Uncomment emulator connections in firebase.ts
```

## Troubleshooting

### Common Issues
1. **Permission Denied**: Check Firestore security rules
2. **Auth Errors**: Verify Firebase config and enable email/password
3. **Build Errors**: Ensure all Firebase services are properly imported
4. **Deployment Issues**: Check Firebase CLI authentication

### Debug Mode
Enable debug mode by setting:
```typescript
// In firebase.ts
if (process.env.NODE_ENV === 'development') {
  // Enable debug logging
  console.log('Firebase debug mode enabled');
}
```

## Support
For issues with Firebase setup:
1. Check Firebase Console for errors
2. Review browser console for client-side errors
3. Check Firestore rules simulator
4. Refer to [Firebase Documentation](https://firebase.google.com/docs)
