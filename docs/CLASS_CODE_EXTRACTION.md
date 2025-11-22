# Class Code Extraction from Student Code

## Problem

Backend cần `classCode` (ví dụ: `D21DCCN01-N`) để filter rubric, nhưng User chỉ có `studentCode` (ví dụ: `N21DCCN001`).

## Solution

Tạm thời extract `classCode` từ `studentCode` bằng pattern matching.

## Pattern

```
Student Code: N21DCCN001
              ↓
Class Code:   D21DCCN01-N
```

### Breakdown:

- `N` (prefix) → Đưa ra cuối: `-N`
- `21` (year) → Giữ nguyên: `21`
- `DCCN` (major) → Giữ nguyên: `DCCN`
- `001` (student number) → Lấy 2 số đầu: `00` → `01`

### Formula:

```
D + year + major + classNumber + "-" + prefix
```

## Implementation

### Frontend Helper Function

```typescript
function extractClassCode(studentCode: string): string | undefined {
  // Pattern: N21DCCN001 -> D21DCCN01-N
  const match = studentCode.match(/^([A-Z])(\d{2})([A-Z]+)(\d+)$/);
  if (match) {
    const [, prefix, year, major, number] = match;
    const classNumber = number.slice(0, -1).padStart(2, "0");
    return `D${year}${major}${classNumber}-${prefix}`;
  }
  return undefined;
}
```

### Usage

```typescript
// In evaluation pages
const classCode = user?.studentCode
  ? extractClassCode(user.studentCode)
  : undefined;
const rubricResponse = await getActiveRubric(undefined, classCode);
```

## Examples

| Student Code | Extracted Class Code |
| ------------ | -------------------- |
| N21DCCN001   | D21DCCN01-N          |
| N21DCCN015   | D21DCCN01-N          |
| N21DCCN025   | D21DCCN02-N          |
| N22CQCN001   | D22CQCN01-N          |
| B20DCCN100   | D20DCCN10-B          |

## Limitations

⚠️ **This is a temporary solution!**

### Issues:

1. **Assumption-based**: Assumes student code format is always consistent
2. **No validation**: Doesn't verify if extracted class code actually exists
3. **Fragile**: Will break if student code format changes

### Better Solution:

Add `classCode` field to User model:

```typescript
export interface User {
  id: number;
  username: string;
  studentCode?: string;
  classCode?: string; // ← Add this!
  // ... other fields
}
```

Then backend should return `classCode` in login response.

## Files Changed

- ✅ `frontend/src/lib/evaluation.ts` - Added `classCode` parameter to `getActiveRubric()`
- ✅ `frontend/src/app/evaluations/new/page.tsx` - Extract and pass classCode
- ✅ `frontend/src/app/evaluations/[id]/page.tsx` - Extract and pass classCode

## Testing

### Test Case 1: Student with matching class

```
Student: N21DCCN025 → Class: D21DCCN02-N
Rubric: targetClasses = "D21DCCN02-N"
Result: ✅ Can create evaluation
```

### Test Case 2: Student with non-matching class

```
Student: N21DCCN015 → Class: D21DCCN01-N
Rubric: targetClasses = "D21DCCN02-N"
Result: ❌ Error: "No active rubric found for class: D21DCCN01-N"
```

### Test Case 3: Rubric for all classes

```
Student: N21DCCN001 → Class: D21DCCN01-N
Rubric: targetClasses = null
Result: ✅ Can create evaluation
```

## Next Steps

1. ✅ Frontend extracts classCode from studentCode
2. ⏳ Test with real data
3. ⏳ Add `classCode` to User model in backend
4. ⏳ Update login API to return `classCode`
5. ⏳ Remove extraction logic and use real `classCode` from User
