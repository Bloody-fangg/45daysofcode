# Bulk CSV Upload Guide

## Overview
The bulk CSV upload feature allows administrators to upload multiple questions at once by providing a CSV file. Each row in the CSV represents one question that will be assigned to a specific day and difficulty level.

## How It Works
- **Separate Questions by Difficulty**: Each CSV row creates one question for one difficulty level (easy/medium/hard)
- **Day-based Organization**: Questions are organized by day number (1, 2, 3, etc.)
- **Smart Merging**: If multiple questions are uploaded for the same day but different difficulties, they are merged into one assignment
- **Flexible Fields**: Only essential fields are required; optional fields can be left empty

## How to Use

1. **Navigate to Questions Tab**: In the admin dashboard, go to the "Questions" tab
2. **Click Bulk Operations**: Click the "Bulk Operations" button to expand the upload section
3. **Prepare CSV File**: Format your CSV file according to the expected structure
4. **Upload**: Click "Choose CSV File" and select your prepared CSV file
5. **Review Results**: The system will process each row and show success/error counts

## CSV Format

Your CSV file should have the following columns:

```
ID, TITLE, Description, Difficulty, Category, Tags, Example, Constraint, Upload Date, Question link
```

### Column Descriptions:

#### Required Fields (Must not be empty):
- **ID**: Day number (1, 2, 3, etc.) - Required
- **TITLE**: Question title - Required
- **Description**: Question description/problem statement - Required  
- **Question link**: URL to the problem (e.g., CodeChef, LeetCode) - Required

#### Optional Fields (Can be empty - will use defaults):
- **Difficulty**: "easy", "medium", or "hard" (defaults to "easy" if empty)
- **Category**: Category (defaults to "General" if empty)
- **Tags**: Comma-separated tags (defaults to empty array if empty)
- **Example**: Example input/output (defaults to empty if not provided)
- **Constraint**: Problem constraints (defaults to empty if not provided)
- **Upload Date**: Date in YYYY-MM-DD format (auto-calculated from day number if empty)

### Sample CSV Content:

```csv
ID,TITLE,Description,Difficulty,Category,Tags,Example,Constraint,Upload Date,Question link
1,CLEAR DAY,Find the first day when the weather is clear,easy,Array,"array, search, conditions","Input: [1,0,1,0,1] Output: 1","1 ≤ N ≤ 1000",2024-12-01,https://www.codechef.com/practice/course/basic-programming-concepts/DIFF500/problems/CLEARDAY
2,BIRYANI CLASS,Calculate total biryani portions needed,medium,Math,"math, calculation","Input: 5 3 Output: 15",,2024-12-02,https://www.codechef.com/practice/course/basic-programming-concepts/DIFF500/problems/BIRYANI
3,DON DRIVE,Find the total distance,easy,Array,"array, sum","Input: [5,2,3] Output: 10",1 ≤ N ≤ 100,2024-12-03,https://www.codechef.com/practice/problems/DONDRIVE
6,EMPTY EXAMPLE,This question has some empty fields,,,"tag1, tag2",,,,https://example.com/problem6
```

**Note**: The system handles empty fields gracefully by using smart defaults.

## Features

- **Robust Field Handling**: Empty or missing optional fields are automatically filled with sensible defaults
- **Automatic Processing**: Each row is processed and assigned to the appropriate day
- **Smart Validation**: Only validates absolutely essential fields (ID, Title, Description, Question link)
- **Graceful Error Handling**: Skips invalid rows and continues processing valid ones
- **Progress Feedback**: Shows success and error counts after processing with detailed error messages
- **Firebase Integration**: Automatically saves questions to your Firebase database
- **Flexible Column Mapping**: Supports various column name variations (case-insensitive)
- **Date Formatting**: Automatically formats dates and defaults to today if invalid or missing
- **Existing Assignment Merging**: If an assignment already exists for a date, it merges the new question into the appropriate difficulty level
- **Default Values**: 
  - Empty difficulty → "easy"
  - Empty category → "General"  
  - Empty tags → empty array
  - Empty example → empty string
  - Empty constraints → empty string
  - Invalid/empty date → today's date

## Error Handling

The system now handles various scenarios gracefully:

1. **Empty Optional Fields**: Automatically filled with defaults, question still created successfully
2. **Missing Required Fields**: Row is skipped with specific error message indicating which field is missing
3. **Invalid Day Numbers**: Row is skipped with error message
4. **Invalid Dates**: Automatically converted to valid format or defaulted to today
5. **Invalid Difficulty**: Automatically defaulted to "easy"
6. **Malformed Tags**: Safely processed, empty tags filtered out
7. **Null/Undefined Values**: Converted to empty strings or appropriate defaults

The system will show:
- Total successful uploads
- Number of failed rows  
- Specific error messages for the first 5 failed rows
- All errors logged to browser console for debugging

## Error Handling

If a row has missing required data, it will be skipped and counted as an error. The system will continue processing other rows.

## Tips

1. **Test with Small Files**: Start with a few questions to test the format
2. **Check Dates**: Ensure dates are in YYYY-MM-DD format
3. **Validate URLs**: Make sure question links are valid URLs
4. **Use Consistent Difficulty**: Use lowercase "easy", "medium", "hard"
5. **Backup**: Always keep a backup of your CSV file

## Notification System Fix

The Q&A notification system has been enhanced:

- When an admin answers a student question, the student now receives an immediate notification
- Notifications appear in the student's notification section with high priority
- The notification includes a preview of the question and indicates that an answer is available
- Students are notified that they should check the Q&A section for the full response

## Support

If you encounter any issues with the bulk upload feature, check the browser console for detailed error messages or contact technical support.
