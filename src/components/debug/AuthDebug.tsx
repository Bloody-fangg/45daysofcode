import React, { useState } from 'react';
import { authService, assignmentsService, submissionsService } from '../../lib/firebase/index';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

// Debug component - Add this to your app temporarily to test authentication
const AuthDebug = () => {
  const [email, setEmail] = useState('amiarchive79.in@gmail.com');
  const [password, setPassword] = useState('123456789');
  const [result, setResult] = useState('');
  const { currentUser, userData } = useAuth();

  const testSignup = async () => {
    try {
      setResult('Creating account...');
      const userData = await authService.signUp(email, password, {
        name: 'Admin User',
        enrollment_no: 'ADMIN001',
        course: 'Administration',
        section: 'A',
        semester: '1',
        github_repo_link: ''
      });
      setResult(`Account created successfully! UID: ${userData.uid}`);
    } catch (error: any) {
      setResult(`Signup error: ${error.message}`);
    }
  };

  const testLogin = async () => {
    try {
      setResult('Logging in...');
      const user = await authService.signIn(email, password);
      setResult(`Login successful! UID: ${user.uid}`);
    } catch (error: any) {
      setResult(`Login error: ${error.message}`);
    }
  };

  const testStudentSignup = async () => {
    try {
      setResult('Creating student account...');
      const userData = await authService.signUp('student@example.com', 'student123', {
        name: 'Test Student',
        enrollment_no: 'A12345678',
        course: 'B.Tech CSE',
        section: 'A',
        semester: '3',
        github_repo_link: 'https://github.com/test/repo'
      });
      setResult(`Student account created successfully! UID: ${userData.uid}`);
    } catch (error: any) {
      setResult(`Student signup error: ${error.message}`);
    }
  };

  const testStudentLogin = async () => {
    try {
      setResult('Logging in as student...');
      const user = await authService.signIn('student@example.com', 'student123');
      setResult(`Student login successful! UID: ${user.uid}`);
    } catch (error: any) {
      setResult(`Student login error: ${error.message}`);
    }
  };

  const createTodayAssignment = async () => {
    try {
      setResult('Creating today\'s assignment...');
      const today = new Date().toISOString().split('T')[0];
      
      const assignmentData = {
        date: today,
        day_number: 1,
        easy_question: {
          title: "Two Sum",
          description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
          link: "https://leetcode.com/problems/two-sum/",
          tags: ["Array", "Hash Table"],
          difficulty: "easy" as const
        },
        medium_question: {
          title: "Add Two Numbers",
          description: "You are given two non-empty linked lists representing two non-negative integers stored in reverse order.",
          link: "https://leetcode.com/problems/add-two-numbers/",
          tags: ["Linked List", "Math", "Recursion"],
          difficulty: "medium" as const
        },
        hard_question: {
          title: "Median of Two Sorted Arrays",
          description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
          link: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
          tags: ["Array", "Binary Search", "Divide and Conquer"],
          difficulty: "hard" as const
        },
        created_by: 'debug-admin'
      };

      await assignmentsService.setAssignment(today, assignmentData);
      setResult(`Today's assignment created successfully for ${today}!`);
    } catch (error: any) {
      setResult(`Assignment creation error: ${error.message}`);
    }
  };

  const createSampleData = async () => {
    try {
      setResult('Creating sample data...');
      
      // Create sample users
      const sampleUsers = [
        {
          uid: 'student1',
          name: 'John Doe',
          email: 'john@student.amity.edu',
          enrollment_no: 'A12345678',
          course: 'B.Tech CSE',
          section: 'A',
          semester: '3',
          github_repo_link: 'https://github.com/john/45days',
          streak_count: 5,
          streak_breaks: 0,
          disqualified: false,
          attempts: { easy: 3, medium: 2, hard: 1, choice: 1 },
          approved: { easy: 2, medium: 1, hard: 0, choice: 1 },
          violations: 0,
          calendar: {},
          last_submission: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isAdmin: false
        },
        {
          uid: 'student2',
          name: 'Jane Smith',
          email: 'jane@student.amity.edu',
          enrollment_no: 'A87654321',
          course: 'B.Tech IT',
          section: 'B',
          semester: '3',
          github_repo_link: 'https://github.com/jane/coding',
          streak_count: 3,
          streak_breaks: 1,
          disqualified: false,
          attempts: { easy: 2, medium: 2, hard: 0, choice: 2 },
          approved: { easy: 2, medium: 1, hard: 0, choice: 1 },
          violations: 0,
          calendar: {},
          last_submission: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isAdmin: false
        }
      ];

      // Create sample submissions
      const sampleSubmissions = [
        {
          student_uid: 'student1',
          student_name: 'John Doe',
          student_email: 'john@student.amity.edu',
          question_date: new Date().toISOString().split('T')[0],
          difficulty: 'easy' as const,
          question_title: 'Two Sum',
          code_text: 'def two_sum(nums, target):\n    # Solution here\n    pass',
          github_file_link: 'https://github.com/john/45days/blob/main/day1.py',
          external_problem_link: 'https://leetcode.com/problems/two-sum/'
        },
        {
          student_uid: 'student2',
          student_name: 'Jane Smith',
          student_email: 'jane@student.amity.edu',
          question_date: new Date().toISOString().split('T')[0],
          difficulty: 'medium' as const,
          question_title: 'Add Two Numbers',
          code_text: 'class ListNode:\n    def __init__(self, val=0, next=None):\n        # Solution here',
          github_file_link: 'https://github.com/jane/coding/blob/main/day1.py',
          external_problem_link: 'https://leetcode.com/problems/add-two-numbers/'
        }
      ];

      // Save sample data using Firebase services
      for (const user of sampleUsers) {
        await setDoc(doc(db, 'users', user.uid), user);
      }

      for (const submission of sampleSubmissions) {
        await submissionsService.submitSolution(submission);
      }

      setResult('Sample data created successfully! Includes 2 students and 2 submissions.');
    } catch (error: any) {
      setResult(`Sample data creation error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px', fontFamily: 'Arial' }}>
      <h3>Authentication Debug Panel</h3>
      <div style={{ marginBottom: '20px' }}>
        <h4>Current Auth State:</h4>
        <p><strong>User:</strong> {currentUser ? currentUser.uid : 'Not logged in'}</p>
        <p><strong>Email:</strong> {currentUser?.email || 'None'}</p>
        <p><strong>Is Admin:</strong> {userData?.isAdmin ? 'Yes' : 'No'}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Test Custom Credentials:</h4>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ margin: '5px', padding: '5px', width: '200px' }}
        />
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ margin: '5px', padding: '5px', width: '200px' }}
        />
        <div>
          <button onClick={testSignup} style={{ margin: '5px', padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
            Create Admin Account
          </button>
          <button onClick={testLogin} style={{ margin: '5px', padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none' }}>
            Login
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Test Student Account:</h4>
        <button onClick={testStudentSignup} style={{ margin: '5px', padding: '5px 10px', backgroundColor: '#17a2b8', color: 'white', border: 'none' }}>
          Create Student Account
        </button>
        <button onClick={testStudentLogin} style={{ margin: '5px', padding: '5px 10px', backgroundColor: '#17a2b8', color: 'white', border: 'none' }}>
          Login as Student
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Create Test Assignment:</h4>
        <button onClick={createTodayAssignment} style={{ margin: '5px', padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none' }}>
          Create Today's Assignment
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Create Sample Data:</h4>
        <button onClick={createSampleData} style={{ margin: '5px', padding: '5px 10px', backgroundColor: '#ffc107', color: 'black', border: 'none' }}>
          Create Sample Users & Submissions
        </button>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        background: '#f8f9fa', 
        border: '1px solid #dee2e6',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace'
      }}>
        <strong>Result:</strong><br />
        {result || 'No operations performed yet'}
      </div>

      <div style={{ marginTop: '20px' }}>
        <a href="/login" style={{ color: '#007bff', textDecoration: 'underline' }}>Go to Login Page</a>
        {' | '}
        <a href="/signup" style={{ color: '#007bff', textDecoration: 'underline' }}>Go to Signup Page</a>
        {' | '}
        <a href="/" style={{ color: '#007bff', textDecoration: 'underline' }}>Go to Dashboard</a>
      </div>
    </div>
  );
};

export default AuthDebug;
