// Mock data for development and testing

export const mockQuestions = {
  '2024-12-01': {
    easy: {
      title: "Two Sum",
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      link: "https://leetcode.com/problems/two-sum/",
      tags: ["Array", "Hash Table"]
    },
    medium: {
      title: "Add Two Numbers",
      description: "You are given two non-empty linked lists representing two non-negative integers.",
      link: "https://leetcode.com/problems/add-two-numbers/",
      tags: ["Linked List", "Math"]
    },
    hard: {
      title: "Median of Two Sorted Arrays",
      description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
      link: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
      tags: ["Array", "Binary Search", "Divide and Conquer"]
    },
    choice: {
      title: "Your Choice Problem",
      description: "Pick any coding problem you want to solve today and submit your solution with proper documentation.",
      link: "",
      tags: ["Any Topic", "Your Choice"]
    }
  },
  '2024-12-02': {
    easy: {
      title: "Palindrome Number",
      description: "Given an integer x, return true if x is palindrome integer.",
      link: "https://leetcode.com/problems/palindrome-number/",
      tags: ["Math"]
    },
    medium: {
      title: "Longest Substring Without Repeating Characters",
      description: "Given a string s, find the length of the longest substring without repeating characters.",
      link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      tags: ["Hash Table", "String", "Sliding Window"]
    },
    hard: {
      title: "Regular Expression Matching",
      description: "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*'.",
      link: "https://leetcode.com/problems/regular-expression-matching/",
      tags: ["String", "Dynamic Programming", "Recursion"]
    },
    choice: {
      title: "Algorithm of Your Choice",
      description: "Implement any algorithm or data structure you've been wanting to practice.",
      link: "",
      tags: ["Algorithms", "Data Structures"]
    }
  },
  '2024-12-03': {
    easy: {
      title: "Roman to Integer",
      description: "Given a roman numeral, convert it to an integer.",
      link: "https://leetcode.com/problems/roman-to-integer/",
      tags: ["Hash Table", "Math", "String"]
    },
    medium: {
      title: "Container With Most Water",
      description: "Find two lines that together with the x-axis form a container that contains the most water.",
      link: "https://leetcode.com/problems/container-with-most-water/",
      tags: ["Array", "Two Pointers", "Greedy"]
    },
    hard: {
      title: "Merge k Sorted Lists",
      description: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.",
      link: "https://leetcode.com/problems/merge-k-sorted-lists/",
      tags: ["Linked List", "Divide and Conquer", "Heap", "Merge Sort"]
    },
    choice: {
      title: "System Design Problem",
      description: "Design and implement a simple system (like URL shortener, chat system, etc.).",
      link: "",
      tags: ["System Design", "Architecture"]
    }
  }
};

export const mockStudents = [
  {
    id: '1',
    name: 'Alice Johnson',
    enrollment_no: 'A12345678',
    email: 'alice@student.amity.edu',
    course: 'B.Tech CSE',
    section: 'A',
    semester: '6',
    github_repo_link: 'https://github.com/alice/45-days-of-code',
    streak_count: 12,
    streak_breaks: 0,
    disqualified: false,
    attempts: { easy: 15, medium: 8, hard: 3, choice: 5 },
    calendar: {
      '2024-12-01': 'completed',
      '2024-12-02': 'completed', 
      '2024-12-03': 'completed'
    },
    last_submission: '2024-12-15',
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-12-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Bob Smith',
    enrollment_no: 'A87654321',
    email: 'bob@student.amity.edu',
    course: 'B.Tech IT',
    section: 'B',
    semester: '4',
    github_repo_link: 'https://github.com/bob/coding-challenge',
    streak_count: 8,
    streak_breaks: 1,
    disqualified: false,
    attempts: { easy: 12, medium: 6, hard: 2, choice: 4 },
    calendar: {
      '2024-12-01': 'completed',
      '2024-12-02': 'missed',
      '2024-12-03': 'completed'
    },
    last_submission: '2024-12-14',
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-12-14T15:20:00Z'
  },
  {
    id: '3',
    name: 'Charlie Brown',
    enrollment_no: 'A11223344',
    email: 'charlie@student.amity.edu',
    course: 'BCA',
    section: 'A',
    semester: '2',
    github_repo_link: '',
    streak_count: 0,
    streak_breaks: 3,
    disqualified: true,
    attempts: { easy: 5, medium: 2, hard: 0, choice: 1 },
    calendar: {
      '2024-12-01': 'completed',
      '2024-12-02': 'missed',
      '2024-12-03': 'missed',
      '2024-12-04': 'missed'
    },
    last_submission: '2024-12-01',
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-12-01T09:15:00Z'
  },
  {
    id: '4',
    name: 'Diana Prince',
    enrollment_no: 'A55667788',
    email: 'diana@student.amity.edu',
    course: 'B.Tech ECE',
    section: 'C',
    semester: '5',
    github_repo_link: 'https://github.com/diana/programming-marathon',
    streak_count: 25,
    streak_breaks: 0,
    disqualified: false,
    attempts: { easy: 30, medium: 20, hard: 8, choice: 12 },
    calendar: {
      '2024-12-01': 'completed',
      '2024-12-02': 'completed',
      '2024-12-03': 'completed'
    },
    last_submission: '2024-12-15',
    created_at: '2024-10-15T00:00:00Z',
    updated_at: '2024-12-15T18:45:00Z'
  }
];

export const mockExamCooldown = {
  active: false,
  start_date: '2024-12-20',
  end_date: '2024-12-25',
  pause_submissions_count: false,
  message: "📚 All The Best For Your Exams! Your streak is paused during this period."
};

// Sample submission data
export const mockSubmissions = [
  {
    id: 'sub_001',
    student_uid: '1',
    question_date: '2024-12-01',
    difficulty: 'easy',
    question_title: 'Two Sum',
    code_text: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    github_file_link: 'https://github.com/alice/45-days-of-code/blob/main/day1-two-sum.js',
    external_problem_link: 'https://leetcode.com/problems/two-sum/',
    created_at: '2024-12-01T08:30:00Z',
    status: 'submitted'
  },
  {
    id: 'sub_002', 
    student_uid: '1',
    question_date: '2024-12-01',
    difficulty: 'medium',
    question_title: 'Add Two Numbers',
    code_text: `function addTwoNumbers(l1, l2) {
  let dummy = new ListNode(0);
  let current = dummy;
  let carry = 0;
  
  while (l1 || l2 || carry) {
    const sum = (l1?.val || 0) + (l2?.val || 0) + carry;
    carry = Math.floor(sum / 10);
    current.next = new ListNode(sum % 10);
    current = current.next;
    l1 = l1?.next;
    l2 = l2?.next;
  }
  
  return dummy.next;
}`,
    github_file_link: 'https://github.com/alice/45-days-of-code/blob/main/day1-add-two-numbers.js',
    external_problem_link: 'https://leetcode.com/problems/add-two-numbers/',
    created_at: '2024-12-01T14:20:00Z',
    status: 'submitted'
  }
];

// Challenge configuration
export const challengeConfig = {
  start_date: '2024-12-01',
  end_date: '2024-01-15', // 45 days from start
  total_days: 45,
  max_streak_breaks: 3,
  difficulties: ['easy', 'medium', 'hard', 'choice']
};