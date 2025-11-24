# Final Updates to Complete Refactoring

## ✅ Backend Complete

- Migration V6 ready
- Entity/Service/Controller updated
- Endpoint supports `?classCode=` parameter
- **Action:** Rebuild evaluation-service when Docker is running

## 🔧 Frontend Updates Needed

### 1. Update Period Management Page

**File:** `frontend/src/app/admin/evaluation-periods/page.tsx`

**Add imports (after line 20):**

```typescript
import { RubricTargetSelector } from "../system-config/components/RubricTargetSelector";
import { getAllRubrics } from "@/lib/api";
import type { Rubric } from "@/types/evaluation";
```

**Add state (after line 54):**

```typescript
const [rubrics, setRubrics] = useState<Rubric[]>([]);
```

**Update formData (line 57-64):**

```typescript
const [formData, setFormData] = useState<CreateEvaluationPeriodRequest>({
  name: "",
  semester: "",
  academicYear: "",
  startDate: "",
  endDate: "",
  description: "",
  rubricId: undefined, // ← ADD
  targetClasses: "", // ← ADD
  isActive: true,
});
```

**Add loadRubrics in useEffect (after loadPeriods call):**

```typescript
const loadRubrics = async () => {
  try {
    const response = await getAllRubrics();
    if (response.success && response.data) {
      setRubrics(response.data);
    }
  } catch (error) {
    console.error("Failed to load rubrics:", error);
  }
};

useEffect(() => {
  if (
    user &&
    (user.roles?.includes("ADMIN") || user.roles?.includes("INSTITUTE_COUNCIL"))
  ) {
    loadPeriods();
    loadRubrics(); // ← ADD
  }
}, [user, router]);
```

**Add to Dialog form (find the description Textarea, add after it):**

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
      setFormData({
        ...formData,
        rubricId: Number(e.target.value) || undefined,
      })
    }
    className="w-full border rounded-md p-2"
    required
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

**Update handleEdit function to include rubric and target:**

```typescript
const handleEdit = (period: EvaluationPeriod) => {
  setSelectedPeriod(period);
  setFormData({
    name: period.name,
    semester: period.semester,
    academicYear: period.academicYear,
    startDate: formatDateForInput(period.startDate),
    endDate: formatDateForInput(period.endDate),
    description: period.description || "",
    rubricId: period.rubricId, // ← ADD
    targetClasses: period.targetClasses || "", // ← ADD
    isActive: period.isActive,
  });
  setIsEditDialogOpen(true);
};
```

**Update period list display to show rubric name:**

```tsx
{
  /* In the period card, add: */
}
{
  period.rubricName && (
    <p className="text-sm text-muted-foreground">
      📋 Rubric: {period.rubricName}
    </p>
  );
}
{
  period.targetClasses && (
    <p className="text-sm text-muted-foreground">
      🎯 Target: {period.targetClasses}
    </p>
  );
}
```

### 2. Update API Library

**File:** `frontend/src/lib/api.ts`

**Find getAllRubrics function and ensure it exists:**

```typescript
export async function getAllRubrics(): Promise<ApiResponse<Rubric[]>> {
  return apiClient.get<Rubric[]>("/rubrics");
}

export async function getRubricById(id: number): Promise<ApiResponse<Rubric>> {
  return apiClient.get<Rubric>(`/rubrics/${id}`);
}
```

**Update getOpenEvaluationPeriod to support classCode:**

```typescript
export async function getOpenEvaluationPeriod(
  classCode?: string
): Promise<ApiResponse<EvaluationPeriod>> {
  const query = classCode ? `?classCode=${classCode}` : "";
  return apiClient.get<EvaluationPeriod>(`/evaluation-periods/open${query}`);
}
```

### 3. Update Student Evaluation Flow

**When students create evaluations, update the flow:**

```typescript
// OLD:
const rubric = await getRubric(user.classCode);

// NEW:
const periodResponse = await getOpenEvaluationPeriod(user.classCode);
if (!periodResponse.data || !periodResponse.data.rubricId) {
  toast({
    title: "Thông báo",
    description: "Không có đợt đánh giá nào đang mở cho lớp của bạn",
    variant: "destructive",
  });
  return;
}

const rubricResponse = await getRubricById(periodResponse.data.rubricId);
if (!rubricResponse.data) {
  toast({
    title: "Lỗi",
    description: "Không thể tải rubric đánh giá",
    variant: "destructive",
  });
  return;
}

const rubric = rubricResponse.data;
// Use rubric for evaluation form
```

## 🚀 Deployment Steps

1. **Rebuild Backend:**

```powershell
docker-compose -f infra/docker-compose.yml up -d --build evaluation-service
```

2. **Test Backend:**

```powershell
# Test without classCode
curl http://localhost:8083/evaluation-periods/open

# Test with classCode
curl "http://localhost:8083/evaluation-periods/open?classCode=D21DCCN01-N"
```

3. **Test Frontend:**

- Create new period with rubric and target selection
- Verify period shows rubric name and target
- Test student evaluation flow

## ✅ Completion Checklist

- [ ] Backend rebuilt and running
- [ ] Period management UI updated
- [ ] Can create period with rubric + target
- [ ] Period list shows rubric info
- [ ] Student evaluation uses new flow
- [ ] End-to-end test passed

## 🎉 Result

After these updates:

- Admins create periods with rubric and target in one place
- Students automatically get correct rubric based on their class
- Architecture is clean and maintainable

**Total time to complete: ~30 minutes**
