# Resubmit Feature Status

## ✅ Backend Implementation (Complete)

### API Endpoint

```
POST /evaluations/{id}/resubmit
Body: {
  "details": [...],
  "responseToRejection": "Đã sửa lại theo yêu cầu..."
}
```

### Status Flow

```
SUBMITTED → REJECTED (by approver)
REJECTED → SUBMITTED (resubmit by student)
```

### Features

- ✅ `EvaluationStatus.REJECTED` exists
- ✅ `canResubmit()` method checks if status is REJECTED
- ✅ Resubmit endpoint updates status back to SUBMITTED
- ✅ Creates history entry with "RESUBMITTED" action
- ✅ Increments `resubmissionCount`
- ✅ Stores `responseToRejection` comment

## ⚠️ Frontend Implementation (Incomplete)

### What Exists

- ✅ `resubmitEvaluation()` API function in `lib/evaluation.ts`
- ✅ `ResubmitEvaluationRequest` type defined
- ✅ Filter for REJECTED status in "My Evaluations" page

### What's Missing

- ❌ No UI to show rejection reason to student
- ❌ No "Resubmit" button for REJECTED evaluations
- ❌ No form to edit evaluation and add response to rejection
- ❌ No visual indicator that evaluation can be resubmitted

## 📋 Current User Flow (Incomplete)

### When Evaluation is Rejected:

1. ✅ Admin/Approver clicks "Reject" and enters reason
2. ✅ Backend changes status to REJECTED
3. ✅ Notification sent to student (if enabled)
4. ✅ Student sees evaluation with "Bị từ chối" badge
5. ❌ Student clicks on evaluation → **No rejection reason shown**
6. ❌ Student wants to fix → **No resubmit button**
7. ❌ Student has to create new evaluation (workaround)

## 🎯 Recommended Implementation

### Option 1: Add Resubmit to Evaluation Detail Page (Recommended)

**Location:** `frontend/src/app/evaluations/[id]/page.tsx`

**Changes Needed:**

1. Show rejection reason prominently when status is REJECTED
2. Add "Sửa và Nộp Lại" button for REJECTED evaluations
3. Button redirects to edit page with pre-filled data
4. Add textarea for "Phản hồi về lý do từ chối"
5. Call `resubmitEvaluation()` API

**UI Mockup:**

```tsx
{
  evaluation.status === "REJECTED" && (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Đánh giá bị từ chối</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Lý do từ chối:</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {evaluation.rejectionReason}
            </p>
          </div>
          <Button
            onClick={() => router.push(`/evaluations/${evaluation.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Sửa và Nộp Lại
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Option 2: Add Resubmit to My Evaluations List

**Location:** `frontend/src/app/evaluations/my/page.tsx`

**Changes:**

- Add "Nộp lại" button next to REJECTED evaluations in list
- Show rejection reason in tooltip or expandable section

### Option 3: Create Dedicated Edit Page

**Location:** `frontend/src/app/evaluations/[id]/edit/page.tsx` (new)

**Features:**

- Load existing evaluation data
- Show rejection reason at top
- Allow editing all criteria scores
- Add "Phản hồi" textarea
- Submit via `resubmitEvaluation()` API

## 🚀 Quick Implementation (Option 1)

### Step 1: Add rejection reason display

```tsx
// In evaluation detail page
{
  evaluation.rejectionReason && (
    <Alert variant="destructive">
      <AlertTitle>Lý do từ chối</AlertTitle>
      <AlertDescription>{evaluation.rejectionReason}</AlertDescription>
    </Alert>
  );
}
```

### Step 2: Add resubmit button

```tsx
{
  evaluation.status === "REJECTED" && isOwner && (
    <Button onClick={handleResubmit}>
      <Edit className="mr-2 h-4 w-4" />
      Sửa và Nộp Lại
    </Button>
  );
}
```

### Step 3: Add resubmit handler

```tsx
const handleResubmit = () => {
  // Redirect to edit page or show edit form
  router.push(`/evaluations/${evaluation.id}/edit`);
};
```

## 📊 Impact Analysis

### Without Resubmit Feature:

- ❌ Students must create entirely new evaluation
- ❌ Loses history of previous submission
- ❌ Confusing for students
- ❌ More work for approvers (duplicate evaluations)

### With Resubmit Feature:

- ✅ Students can fix and resubmit same evaluation
- ✅ Maintains history (resubmissionCount)
- ✅ Clear feedback loop
- ✅ Better user experience

## 🎯 Priority

**High Priority** - This is a core feature for the evaluation workflow. Without it, the rejection feature is incomplete and creates poor UX.

## ⏱️ Estimated Implementation Time

- **Option 1 (Basic):** 30-45 minutes

  - Show rejection reason: 10 min
  - Add resubmit button: 10 min
  - Create edit page: 20-25 min

- **Option 1 (Complete):** 1-2 hours
  - All of above
  - Add response textarea
  - Validation
  - Testing

## 📝 Next Steps

1. Decide on implementation approach (recommend Option 1)
2. Create edit page for evaluations
3. Add rejection reason display
4. Add resubmit button and handler
5. Test full flow: Submit → Reject → Resubmit → Approve

---

**Status:** ⚠️ Backend Complete, Frontend Incomplete
**Recommendation:** Implement Option 1 for complete feature
