# Robust CSV Upload Examples

## Example 1: Complete Data
```csv
ID,TITLE,Description,Difficulty,Category,Tags,Example,Constraint,Upload Date,Question link
1,CLEAR DAY,Find the first day when the weather is clear,easy,Array,"array, search, conditions","Input: [1,0,1,0,1] Output: 1","1 ≤ N ≤ 1000",2024-12-01,https://www.codechef.com/problems/CLEARDAY
```
**Result**: ✅ Creates complete question with all fields populated

## Example 2: Missing Optional Fields  
```csv
ID,TITLE,Description,Difficulty,Category,Tags,Example,Constraint,Upload Date,Question link
2,BIRYANI CLASS,Calculate total biryani portions needed,,,,,,2024-12-02,https://www.codechef.com/problems/BIRYANI
```
**Result**: ✅ Creates question with defaults:
- Difficulty: "easy"
- Category: "General"  
- Tags: [] (empty array)
- Example: "" (empty)
- Constraint: "" (empty)

## Example 3: Partial Data
```csv
ID,TITLE,Description,Difficulty,Category,Tags,Example,Constraint,Upload Date,Question link
3,DON DRIVE,Find the total distance,medium,Math,"array, sum",,1 ≤ N ≤ 100,,https://www.codechef.com/problems/DONDRIVE
```
**Result**: ✅ Creates question with:
- Difficulty: "medium" (as specified)
- Category: "Math" (as specified)
- Tags: ["array", "sum"] (parsed from string)
- Example: "" (empty, defaulted)
- Constraint: "1 ≤ N ≤ 100" (as specified)
- Upload Date: Today's date (defaulted)

## Example 4: Invalid/Missing Required Fields
```csv
ID,TITLE,Description,Difficulty,Category,Tags,Example,Constraint,Upload Date,Question link
,MISSING ID,This has no ID,easy,Math,,,,,https://www.codechef.com/problems/TEST
4,,This has no title,easy,Math,,,,,https://www.codechef.com/problems/TEST
5,NO LINK,This has no link,easy,Math,,,,,,
```
**Results**: 
- Row 1: ❌ Skipped - Missing ID
- Row 2: ❌ Skipped - Missing Title  
- Row 3: ❌ Skipped - Missing Question Link

## System Behavior Summary

### ✅ What Works (Creates Questions):
- Empty optional fields (Category, Tags, Example, Constraint)
- Missing difficulty (defaults to "easy")
- Missing/invalid dates (defaults to today)
- Various date formats (auto-converted)
- Different column case (TITLE vs title vs Title)
- Null or undefined values in optional fields

### ❌ What Fails (Skips Row):
- Missing or invalid ID/Day number
- Empty TITLE field
- Empty Description field  
- Empty Question link field

### 🔧 Auto-Corrections:
- Invalid difficulty → "easy"
- Empty category → "General"
- Malformed tags → Cleaned and filtered
- Bad dates → Today's date
- null/undefined → Empty strings or appropriate defaults

## Error Reporting
The system provides detailed feedback:
- "Successfully uploaded X questions. Y questions failed."
- Specific error messages for failed rows
- Row numbers for easy identification
- Console logging for debugging

This robust system ensures maximum success rate while maintaining data integrity!
