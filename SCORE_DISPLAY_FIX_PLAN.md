# Score Display Bug - Fix Plan

## Problem

Class Monitor and Advisor scores are stored at CRITERION level but displayed as distributed sub-criteria scores (showing as percentages/ratios).

## Root Cause

Lines 1012-1017 in `frontend/src/app/evaluations/[id]/page.tsx`:

```typescript
const classMonitorSubScore =
  criterion.classMonitorScore != null
    ? Math.round(criterion.classMonitorScore * ratio * 10) / 10 // ← Distributing score
    : null;
```

## Solution Options

### Option A: Show Criterion-Level Score Only (RECOMMENDED)

Don't distribute scores to sub-criteria. Instead:

1. Show criterion-level score in the criterion header
2. In the sub-criteria table, show "-" or "N/A" for class monitor/advisor columns
3. Add a summary row at the bottom showing the total criterion score

### Option B: Show Both

1. Keep sub-criteria table showing individual student scores
2. Add a summary row showing criterion-level scores for class monitor/advisor

### Option C: Remove Distribution Logic

1. Remove the ratio calculation
2. Show actual scores from database without modification
3. Only show scores where they exist (criterion level for monitors/advisors)

## Recommended Implementation (Option A)

### Changes Needed:

1. **In criterion header** (around line 970):

```typescript
<div className="flex items-center justify-between">
  <h4 className="text-lg font-semibold">
    {index + 1}. {criterion.name}
  </h4>
  <div className="text-right space-y-1">
    <div className="text-sm text-muted-foreground">Tổng điểm tiêu chí:</div>
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div>
        <span className="text-muted-foreground">Tự chấm:</span>
        <span className="font-bold ml-1">
          {Math.round(criterion.totalScore)}
        </span>
      </div>
      {criterion.classMonitorScore != null && (
        <div>
          <span className="text-muted-foreground">Lớp trưởng:</span>
          <span className="font-bold ml-1 text-yellow-700">
            {criterion.classMonitorScore}
          </span>
        </div>
      )}
      {criterion.advisorScore != null && (
        <div>
          <span className="text-muted-foreground">Cố vấn:</span>
          <span className="font-bold ml-1 text-green-700">
            {criterion.advisorScore}
          </span>
        </div>
      )}
    </div>
  </div>
</div>
```

2. **In sub-criteria table** (around line 1190):

- For class monitor column: Show input if scoring, otherwise show "-"
- For advisor column: Show input if scoring, otherwise show "-"
- Don't show distributed scores

```typescript
<TableCell className={`text-center ${isClassMonitorScoring ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
  {isClassMonitorScoring ? (
    <Input
      type="number"
      min="0"
      max={sub.maxPoints}
      step="0.1"
      value={editableClassMonitorScore ?? 0}
      onChange={(e) => {
        const value = parseFloat(e.target.value) || 0;
        handleClassMonitorScoreChange(Math.min(Math.max(0, value), sub.maxPoints));
      }}
      className="w-20 h-8 text-center text-sm font-semibold bg-white dark:bg-gray-800"
    />
  ) : (
    <span className="text-muted-foreground">-</span>  {/* ← Changed from showing distributed score */}
  )}
</TableCell>
```

3. **Add summary row** at end of table:

```typescript
<TableRow className="bg-muted/50 font-bold">
  <TableCell colSpan="2" className="text-right">
    Tổng điểm tiêu chí:
  </TableCell>
  <TableCell className="text-center">{criterion.maxPoints}</TableCell>
  <TableCell className="text-center">
    {Math.round(criterion.totalScore)}
  </TableCell>
  <TableCell className="text-center text-yellow-700">
    {criterion.classMonitorScore ?? "-"}
  </TableCell>
  <TableCell className="text-center text-green-700">
    {criterion.advisorScore ?? "-"}
  </TableCell>
  <TableCell colSpan="2"></TableCell>
</TableRow>
```

## Implementation Steps

1. ✅ Identify bug location
2. ⏳ Modify criterion header to show criterion-level scores
3. ⏳ Modify sub-criteria table to not show distributed scores
4. ⏳ Add summary row showing criterion totals
5. ⏳ Test with actual data
6. ⏳ Verify scores display correctly

## Expected Result

After fix:

- Criterion 1 with classMonitorScore = 3 will show "3" in the summary row
- Sub-criteria will show "-" in class monitor column (unless actively scoring)
- No more percentage/ratio calculations for display
