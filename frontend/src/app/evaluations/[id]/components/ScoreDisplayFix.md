# Score Display Fix - Implementation Guide

## The Problem

The current code distributes criterion-level scores (class monitor, advisor) to sub-criteria using a ratio:

```typescript
const ratio = totalMaxPoints > 0 ? sub.maxPoints / totalMaxPoints : 0;
const classMonitorSubScore =
  criterion.classMonitorScore != null
    ? Math.round(criterion.classMonitorScore * ratio * 10) / 10
    : null;
```

This causes a score of 3 for criterion 1 to be displayed as 0.5, 1.5, 0.6, etc. in sub-criteria.

## The Solution

**Don't show distributed scores in sub-criteria table. Show actual criterion scores in a summary.**

### Step 1: Modify the display logic (lines 1033-1040)

REMOVE the distributed score calculation and use actual criterion scores:

```typescript
// OLD CODE (REMOVE):
const displayedClassMonitorScore =
  editableClassMonitorScore !== undefined && editableClassMonitorScore !== null
    ? editableClassMonitorScore
    : classMonitorSubScore !== null && classMonitorSubScore !== undefined
    ? classMonitorSubScore
    : 0;

// NEW CODE (USE THIS):
// For display: only show editable scores (when actively scoring), otherwise show nothing in sub-criteria
const displayedClassMonitorScore = editableClassMonitorScore;
const displayedAdvisorScore = editableAdvisorScore;
```

### Step 2: Modify the table cell display (lines 1190-1200)

Change from showing distributed score to showing only when actively editing:

```typescript
<TableCell className={`text-center ${isClassMonitorScoring ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
  {isClassMonitorScoring ? (
    <Input
      type="number"
      min="0"
      max={sub.maxPoints}
      step="0.1"
      value={displayedClassMonitorScore ?? 0}
      onChange={(e) => {
        const value = parseFloat(e.target.value) || 0;
        handleClassMonitorScoreChange(Math.min(Math.max(0, value), sub.maxPoints));
      }}
      className="w-20 h-8 text-center text-sm font-semibold bg-white dark:bg-gray-800"
    />
  ) : (
    <span className="text-muted-foreground text-sm">-</span>  {/* Show dash instead of distributed score */}
  )}
</TableCell>
```

### Step 3: Add criterion summary row

After the sub-criteria table body, add a summary row showing criterion-level scores:

```typescript
</TableBody>
<TableFooter>
  <TableRow className="bg-muted/30 font-semibold">
    <TableCell colSpan="2" className="text-right">
      Tổng điểm tiêu chí {index + 1}:
    </TableCell>
    <TableCell className="text-center">{criterion.maxPoints}</TableCell>
    <TableCell className="text-center text-primary">
      {Math.round(criterion.totalScore)}
    </TableCell>
    <TableCell className="text-center text-yellow-700 dark:text-yellow-400">
      {criterion.classMonitorScore != null ? criterion.classMonitorScore : '-'}
    </TableCell>
    <TableCell className="text-center text-green-700 dark:text-green-400">
      {criterion.advisorScore != null ? criterion.advisorScore : '-'}
    </TableCell>
    <TableCell colSpan="2"></TableCell>
  </TableRow>
</TableFooter>
```

### Step 4: Import TableFooter

Add to imports at top of file:

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

## Testing

After applying the fix:

1. View an evaluation with class monitor score = 3
2. Verify sub-criteria show "-" in class monitor column
3. Verify summary row shows "3" for class monitor score
4. Verify no more percentage/ratio values

## Files to Modify

- `frontend/src/app/evaluations/[id]/page.tsx` (lines 1010-1040, 1190-1200, add summary row after line 1260)
