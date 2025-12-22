# ✅ Score Display Bug - FIXED

## Problem Summary

Class Monitor and Advisor scores were displaying as percentages/ratios (0.5, 1.5, 0.6, 0.3, 0.2) instead of actual values (3, NULL, NULL, NULL, NULL).

## Root Cause

The code was distributing criterion-level scores to sub-criteria using a ratio calculation:

```typescript
const ratio = totalMaxPoints > 0 ? sub.maxPoints / totalMaxPoints : 0;
const classMonitorSubScore =
  criterion.classMonitorScore != null
    ? Math.round(criterion.classMonitorScore * ratio * 10) / 10 // ← Bug: distributing score
    : null;
```

## Solution Applied

### 1. Added TableFooter to imports

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
```

### 2. Simplified display logic (Lines 1033-1036)

**Before:**

```typescript
const displayedClassMonitorScore =
  editableClassMonitorScore !== undefined && editableClassMonitorScore !== null
    ? editableClassMonitorScore
    : classMonitorSubScore !== null && classMonitorSubScore !== undefined
    ? classMonitorSubScore
    : 0;
```

**After:**

```typescript
const displayedClassMonitorScore = editableClassMonitorScore;
const displayedAdvisorScore = editableAdvisorScore;
```

### 3. Changed table cell display to show dash when not editing (Lines 1189-1193, 1210-1214)

**Before:**

```typescript
<span className="font-semibold text-yellow-700 dark:text-yellow-400">
  {displayedClassMonitorScore ?? 0}
</span>
```

**After:**

```typescript
<span className="text-muted-foreground text-sm">-</span>
```

### 4. Added summary row showing criterion-level scores (After line 1273)

```typescript
<TableFooter>
  <TableRow className="bg-muted/30 font-semibold">
    <TableCell colSpan={2} className="text-right">
      Tổng điểm tiêu chí:
    </TableCell>
    <TableCell className="text-center">{criterion.maxPoints}</TableCell>
    <TableCell className="text-center text-primary">
      {Math.round(criterion.totalScore)}
    </TableCell>
    <TableCell className="text-center text-yellow-700 dark:text-yellow-400">
      {criterion.classMonitorScore != null ? criterion.classMonitorScore : "-"}
    </TableCell>
    <TableCell className="text-center text-green-700 dark:text-green-400">
      {criterion.advisorScore != null ? criterion.advisorScore : "-"}
    </TableCell>
    <TableCell colSpan={2}></TableCell>
  </TableRow>
</TableFooter>
```

## Expected Behavior After Fix

### Before Fix:

- User enters class monitor score: 3 for criterion 1
- Database stores: 3 ✅
- Display shows in sub-criteria: 0.5, 1.5, 0.6, 0.3, 0.2 ❌ (distributed/percentage values)

### After Fix:

- User enters class monitor score: 3 for criterion 1
- Database stores: 3 ✅
- Display shows:
  - Sub-criteria rows: "-" (dash) in class monitor column
  - Summary row: "3" in class monitor column ✅

## Files Modified

- `frontend/src/app/evaluations/[id]/page.tsx`
  - Line 22: Added `TableFooter` to imports
  - Lines 1033-1036: Simplified display logic
  - Lines 1189-1193: Changed class monitor display
  - Lines 1210-1214: Changed advisor display
  - After line 1273: Added summary row with TableFooter

## Backup

- Backup saved at: `frontend/src/app/evaluations/[id]/page.tsx.backup`

## Testing Instructions

1. **Start the frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

2. **View an evaluation with class monitor scores:**

   - Navigate to `/evaluations/1` (or any evaluation ID)
   - Check that sub-criteria show "-" in class monitor column
   - Check that summary row shows actual score (e.g., "3")

3. **Test scoring workflow:**
   - As class monitor, approve an evaluation
   - Enter scores for sub-criteria
   - Verify scores are saved correctly
   - Verify display shows correct values

## Next Steps

If you want to proceed with the full refactor (splitting into components), we can do that next. The bug is now fixed, so the refactor is optional and can be done for code maintainability.

## Status: ✅ COMPLETE

The score display bug has been fixed. The evaluation detail page now correctly displays:

- Actual criterion-level scores in the summary row
- Dash ("-") in sub-criteria rows when not actively scoring
- No more percentage/ratio calculations for display
