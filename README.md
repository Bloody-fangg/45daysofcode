# 45 Days Of Code - Amity University

A comprehensive coding challenge platform designed for Amity University students to build consistent coding habits over 45 days.

## 🎯 Project Overview

The "45 Days Of Code" platform is a modern, production-ready web application that gamifies the learning experience with streak tracking, multiple difficulty levels, and comprehensive progress monitoring.

### Key Features

- **Multi-Role System**: Separate dashboards for Students and Admins
- **Daily Coding Challenges**: Four difficulty levels (Easy, Medium, Hard, Code of Choice)
- **Streak Tracking**: Visual streak counter with automatic break detection
- **Progress Monitoring**: Comprehensive analytics and submission tracking
- **Exam Mode**: Admin-controlled cooldown periods during exams
- **GitHub Integration**: Link submissions to GitHub repositories
- **Responsive Design**: Mobile-first, accessible interface

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **UI Components**: Shadcn/ui with custom variants
- **State Management**: React Context + Firebase hooks
- **Routing**: React Router v6

### Design System

The application follows a comprehensive design system with:
- **Colors**: Primary Blue (#002D62), Accent Amber (#F5A623), Success Green (#27AE60)
- **Typography**: Poppins (headings), Inter (body text)
- **Components**: Custom button variants, gradient backgrounds, shadow system
- **Dark Mode**: Default dark theme with light mode toggle

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 45-days-of-code
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update `src/lib/firebase.ts` with your Firebase config
   - Enable Authentication and Firestore in Firebase Console

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Student Dashboard: `http://localhost:8080`
   - Admin Dashboard: Login with `optimusprime79.in@gmail.com`

## 📊 Data Models

### User Document
```typescript
interface UserData {
  uid: string;
  name: string;
  enrollment_no: string;
  email: string;
  course: string;
  section: string;
  semester: string;
  github_repo_link: string;
  streak_count: number;
  streak_breaks: number;
  disqualified: boolean;
  attempts: {
    easy: number;
    medium: number;
    hard: number;
    choice: number;
  };
  calendar: Record<string, 'completed' | 'missed' | 'paused'>;
  created_at: string;
  updated_at: string;
  isAdmin: boolean;
}
```

### Question Document
```typescript
interface Question {
  date: string; // YYYY-MM-DD
  easy: QuestionDetails;
  medium: QuestionDetails;
  hard: QuestionDetails;
  choice: QuestionDetails;
}

interface QuestionDetails {
  title: string;
  description: string;
  link: string;
  tags: string[];
}
```

### Submission Document
```typescript
interface Submission {
  id: string;
  student_uid: string;
  question_date: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'choice';
  code_text: string;
  github_file_link: string;
  external_problem_link: string;
  created_at: string;
  status: 'submitted' | 'accepted' | 'rejected';
}
```

## 🔧 Business Rules

### Streak System
- **Completion**: Submit at least one solution per day to maintain streak
- **Breaks**: Missing a day increments streak_breaks counter
- **Disqualification**: 3 streak breaks = automatic disqualification
- **Recovery**: Admin can manually reset breaks or restore accounts

### Exam Cooldown
- **Activation**: Admin can enable exam mode for date ranges
- **Effect**: Pauses streak counting, shows exam banner to students
- **Flexibility**: Configurable whether submissions during cooldown count toward attempts

### Submission Rules
- **Timing**: One submission per difficulty per day
- **Validation**: Code and external link required
- **GitHub**: Optional but encouraged repository integration
- **Status**: All submissions default to "submitted" status

## 👨‍💻 User Roles

### Student Role
- **Dashboard**: View daily questions, track progress, submit solutions
- **Calendar**: Visual representation of completion status
- **Profile**: Manage account details and GitHub integration
- **Statistics**: Track attempts across difficulty levels

### Admin Role  
- **Question Management**: Assign daily questions for all difficulty levels
- **Student Oversight**: Monitor progress, manage accounts
- **Exam Mode**: Control cooldown periods and messaging
- **Analytics**: View platform statistics and trends
- **Bulk Operations**: Import/export questions, force-mark days

## 🎨 UI/UX Guidelines

### Core Principles
- **Minimal & Clean**: Spacious design with clear information hierarchy
- **FAANG Quality**: Production-grade interface with smooth animations  
- **Accessibility**: 4.5:1 contrast ratios, keyboard navigation, ARIA labels
- **Responsive**: Mobile-first approach with progressive enhancement

### Key Components
- **Hero Buttons**: Gradient backgrounds with hover animations
- **Progress Indicators**: Visual streak counters and completion bars
- **Status Badges**: Color-coded difficulty and completion states
- **Modal Interactions**: Smooth transitions for submission flows

## 🧪 Testing & Validation

### Acceptance Criteria

1. **User Registration**
   - ✅ Student can create account with all required fields
   - ✅ Admin email redirects to admin dashboard
   - ✅ Profile information is properly stored and displayed

2. **Question Assignment**
   - ✅ Admin can set questions for any date
   - ✅ Students see questions for current date
   - ✅ External links open correctly

3. **Submission Flow**
   - ✅ Student can submit solutions for each difficulty
   - ✅ Calendar updates immediately on submission
   - ✅ Streak counter increments correctly

4. **Streak Management**
   - ✅ Missing day increments streak_breaks
   - ✅ Warning displays after each break
   - ✅ Disqualification occurs after 3 breaks

5. **Exam Mode**
   - ✅ Admin can toggle exam cooldown
   - ✅ Banner displays to all students
   - ✅ Streak breaks paused during exam period

### Manual Testing Checklist

- [ ] User can sign up and log in successfully
- [ ] Admin dashboard accessible only with admin email
- [ ] Questions can be assigned and retrieved by date
- [ ] Submissions update calendar and streak properly  
- [ ] Exam mode affects all student interfaces
- [ ] GitHub links work correctly
- [ ] Mobile responsiveness across all screens
- [ ] Dark/light mode toggle functions

## 📈 Analytics & Monitoring

### Key Metrics
- **Engagement**: Daily active users, submission rates
- **Progress**: Streak distribution, completion percentages  
- **Difficulty**: Attempts per level, success rates
- **Retention**: User lifecycle, disqualification rates

### Admin Insights
- Student leaderboards by streak and submissions
- Daily/weekly submission trends
- Difficulty level popularity analysis
- Exam period impact assessment

## 🚀 Deployment

### Production Setup

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to hosting platform**
   - Recommended: Vercel, Netlify, or Firebase Hosting
   - Configure environment variables for production Firebase config

3. **Database Setup**
   - Enable Firestore security rules
   - Set up backup and monitoring
   - Configure user authentication settings

### Environment Variables
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
# Add other Firebase config as needed
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Semantic commit messages
- Component-based architecture
- Mobile-first responsive design

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or feature requests:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation for common solutions

## 🎉 Acknowledgments

- Amity University for project requirements and guidance
- Shadcn/ui for the excellent component library
- Firebase for backend infrastructure
- The open-source community for inspiration and tools

---

**Built with ❤️ for Amity University students to excel in their coding journey!**