# Period-Rubric-Target Refactoring - Implementation Guide

## ✅ Completed

### Backend

1. ✅ Migration V6 - Added `rubric_id` and `target_classes` to `evaluation_periods`
2. ✅ Entity updated - `EvaluationPeriod` with `rubric` and `targetClasses`
3. ✅ Service updated - `getOpenPeriodForClass()` method
4. ✅ DTO/Mapper updated
5. ✅ Deployed

### Frontend

1. ✅ Types updated - `EvaluationPeriod` interface
2. ✅ Removed `RubricTargetSelector` from RubricEditor
3. ✅ `RubricTargetSelector` component ready to reuse

## ⏳ TODO

### Task 1: Update Period Creation/Edit UI

**File:** `frontend/src/app/admin/evaluation-periods/page.tsx`

**Changes needed:**

1. **Add rubric selection dropdown:**

```typescript
// Add to form state
const [formData, setFormData] = useState<CreateEvaluationPeriodRequest>({
  name: "",
  semester: "",
  academicYear: "",
  startDate: "",
  endDate: "",
  description: "",
  rubricId: undefined, // ← Add
  targetClasses: "", // ← Add
  isActive: true,
});

// Load rubrics
const [rubrics, setRubrics] = useState<Rubric[]>([]);

useEffect(() => {
  loadRubrics();
}, []);

const loadRubrics = async () => {
  const response = await getAllRubrics();
  if (response.success) {
    setRubrics(response.data);
  }
};
```

2. **Add to form UI (in Dialog):**

```tsx
{
  /* Rubric Selection */
}
<div>
  <Label htmlFor="rubric">Rubric *</Label>
  <select
    id="rubric"
    value={formData.rubricId || ""}
    onChange={(e) =>
      setFormData({ ...formData, rubricId: Number(e.target.value) })
    }
    className="w-full border rounded-md p-2"
  >
    <option value="">-- Chọn rubric --</option>
    {rubrics.map((rubric) => (
      <option key={rubric.id} value={rubric.id}>
        {rubric.name} ({rubric.academicYear})
      </option>
    ))}
  </select>
</div>;

{
  /* Target Classes Selection */
}
<RubricTargetSelector
  value={formData.targetClasses || ""}
  onChange={(value) => setFormData({ ...formData, targetClasses: value })}
/>;
```

3. **Import RubricTargetSelector:**

```typescript
import { RubricTargetSelector } from "../system-config/components/RubricTargetSelector";
import { getAllRubrics } from "@/lib/api";
import type { Rubric } from "@/types/evaluation";
```

### Task 2: Update Training Points Page

**File:** `frontend/src/app/training-points/page.tsx`

**Current flow:**

```typescript
// OLD: Get rubric directly by classCode
const rubric = await getRubric(user.classCode);
```

**New flow:**

```typescript
// NEW: Get period first, then rubric from period
const period = await getOpenEvaluationPeriod();
if (!period.data) {
  // No open period
  return;
}

// Check if period applies to user's class
if (period.data.targetClasses) {
  // Validate user's class matches target
  if (!matchesTarget(user.classCode, period.data.targetClasses)) {
    // Period doesn't apply to this class
    return;
  }
}

// Get rubric from period
const rubric = await getRubricById(period.data.rubricId);
```

**Helper function:**

```typescript
function matchesTarget(classCode: string, targetClasses: string): boolean {
  if (!targetClasses) return true;

  if (targetClasses.startsWith("FACULTY:")) {
    const faculties = targetClasses.substring(8).split(",");
    return faculties.some((f) =>
      classCode.toUpperCase().includes(f.trim().toUpperCase())
    );
  }

  if (targetClasses.startsWith("MAJOR:")) {
    const majors = targetClasses.substring(6).split(",");
    return majors.some((m) =>
      classCode.toUpperCase().includes(m.trim().toUpperCase())
    );
  }

  if (targetClasses.startsWith("CLASS:")) {
    const classes = targetClasses.substring(6).split(",");
    return classes.some(
      (c) => c.trim().toUpperCase() === classCode.trim().toUpperCase()
    );
  }

  // Legacy format
  const classes = targetClasses.split(",");
  return classes.some(
    (c) => c.trim().toUpperCase() === classCode.trim().toUpperCase()
  );
}
```

**Or simpler - let backend handle it:**

```typescript
// Even better: Add new API endpoint
export async function getOpenPeriodForClass(
  classCode: string
): Promise<ApiResponse<EvaluationPeriod>> {
  return apiClient.get(`/evaluation-periods/open?classCode=${classCode}`);
}

// Then in training-points page:
const period = await getOpenPeriodForClass(user.classCode);
if (period.data && period.data.rubricId) {
  const rubric = await getRubricById(period.data.rubricId);
}
```

### Task 3: Add Backend Endpoint (Optional but recommended)

**File:** `backend/evaluation-service/src/main/java/ptit/drl/evaluation/api/EvaluationPeriodController.java`

```java
/**
 * GET /evaluation-periods/open?classCode=D21DCCN01-N
 * Get open period for specific class
 */
@GetMapping("/open")
public ResponseEntity<ApiResponse<EvaluationPeriodDTO>> getOpenPeriod(
        @RequestParam(required = false) String classCode) {

    if (classCode != null && !classCode.isEmpty()) {
        // Get period for specific class
        return periodService.getOpenPeriodForClass(classCode)
                .map(period -> ResponseEntity.ok(
                    ApiResponse.success("Đợt đánh giá đang mở", EvaluationPeriodMapper.toDTO(period))))
                .orElse(ResponseEntity.ok(
                    ApiResponse.success("Không có đợt đánh giá nào áp dụng cho lớp này", null)));
    }

    // Get any open period
    return periodService.getOpenPeriod()
            .map(period -> ResponseEntity.ok(
                ApiResponse.success("Đợt đánh giá đang mở", EvaluationPeriodMapper.toDTO(period))))
            .orElse(ResponseEntity.ok(
                ApiResponse.success("Không có đợt đánh giá nào đang mở", null)));
}
```

## Testing Checklist

### Backend Testing

- [ ] Migration V6 runs successfully
- [ ] Can create period with rubricId and targetClasses
- [ ] Can update period
- [ ] `getOpenPeriodForClass()` returns correct period
- [ ] Matching logic works for FACULTY:, MAJOR:, CLASS:

### Frontend Testing

- [ ] Can create period with rubric selection
- [ ] Can select target (faculty/major/class)
- [ ] Period list shows rubric name
- [ ] Training points page gets rubric from period
- [ ] Students see correct rubric based on their class
- [ ] Students in non-target classes see "No period" message

## Migration Path for Existing Data

If you have existing rubrics with targetClasses:

```sql
-- Copy targetClasses from active rubrics to open periods
UPDATE evaluation_periods ep
SET
  rubric_id = (
    SELECT id FROM rubrics
    WHERE is_active = true
    AND academic_year = ep.academic_year
    LIMIT 1
  ),
  target_classes = (
    SELECT target_classes FROM rubrics
    WHERE is_active = true
    AND academic_year = ep.academic_year
    LIMIT 1
  )
WHERE ep.is_open = true;
```

## Benefits of New Architecture

1. **Clearer Semantics:**

   - "Period X uses Rubric Y for Classes Z"
   - vs "Rubric Y applies to Classes Z" (which period?)

2. **More Flexible:**

   - Different periods can use different rubrics for same classes
   - Same rubric can be used with different targets in different periods

3. **Better UX:**

   - Admin creates period → selects rubric → selects target (one flow)
   - Student sees: "Period for your class is open"

4. **Easier to Manage:**
   - All configuration in one place (period)
   - Rubrics are just templates (no target logic)

## Summary

**Architecture Change:**

```
OLD: Rubric → targetClasses
NEW: Period → Rubric + targetClasses
```

**Key Insight:**
Period is the "activation" entity that brings together:

- When (startDate, endDate)
- What (rubric)
- Who (targetClasses)

This is more natural and flexible! 🎉
