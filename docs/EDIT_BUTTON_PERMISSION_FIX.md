# ✅ Edit Button Permission Fix

## Problem

Nút "Chỉnh sửa & Nộp lại" hiển thị cho tất cả users (bao gồm admin) khi xem evaluation bị từ chối, không chỉ cho sinh viên tạo evaluation đó.

## Root Cause

Logic hiển thị nút edit có điều kiện phức tạp và không kiểm tra `isOwner` đúng cách:

```tsx
// Before:
{(canEdit || (evaluation.status === 'REJECTED') || (canEditInPeriod && ...)) && (
  <Button>Chỉnh sửa</Button>
)}
```

Điều kiện `(evaluation.status === 'REJECTED')` cho phép bất kỳ ai xem evaluation REJECTED đều thấy nút edit.

## Solution

Đơn giản hóa logic - chỉ dùng `canEdit` (đã có check `isOwner`):

```tsx
// After:
{
  canEdit && <Button>Chỉnh sửa</Button>;
}
```

Với `canEdit` đã được định nghĩa đúng:

```tsx
const canEdit = isOwner && (
  evaluation.status === 'DRAFT' ||
  evaluation.status === 'REJECTED' ||
  (canEditInPeriod && ...)
);
```

## Changes Made

### File: `frontend/src/app/evaluations/[id]/page.tsx`

1. **Simplified button condition**

   ```tsx
   // Removed redundant conditions
   {
     canEdit && (
       <Button>
         {evaluation.status === "REJECTED"
           ? "Chỉnh sửa & Nộp lại"
           : "Chỉnh sửa"}
       </Button>
     );
   }
   ```

2. **Added comment for clarity**
   ```tsx
   // Only owner can edit their own evaluation
   const canEdit = isOwner && (...)
   ```

## Behavior

### Before Fix:

- ❌ Admin xem evaluation REJECTED → Thấy nút "Chỉnh sửa & Nộp lại"
- ❌ Instructor xem evaluation REJECTED → Thấy nút "Chỉnh sửa & Nộp lại"
- ✅ Student (owner) xem evaluation REJECTED → Thấy nút "Chỉnh sửa & Nộp lại"

### After Fix:

- ✅ Admin xem evaluation REJECTED → KHÔNG thấy nút edit
- ✅ Instructor xem evaluation REJECTED → KHÔNG thấy nút edit
- ✅ Student (owner) xem evaluation REJECTED → Thấy nút "Chỉnh sửa & Nộp lại"
- ✅ Student (owner) xem evaluation DRAFT → Thấy nút "Chỉnh sửa"

## Testing

### Test 1: Admin Views Rejected Evaluation

1. Login as Admin
2. Reject a student's evaluation
3. View the evaluation detail
4. **Expected:** NO edit button visible
5. **Expected:** Only see Approve/Reject buttons

### Test 2: Student Views Own Rejected Evaluation

1. Login as Student (owner)
2. View their rejected evaluation
3. **Expected:** See "Chỉnh sửa & Nộp lại" button
4. Click button → Should redirect to edit page

### Test 3: Student Views Own Draft

1. Login as Student (owner)
2. View their draft evaluation
3. **Expected:** See "Chỉnh sửa" button
4. Click button → Should redirect to edit page

### Test 4: Other Student Views Evaluation

1. Login as Student A
2. Try to view Student B's evaluation
3. **Expected:** NO edit button (not owner)

## Security Note

This is a UI-only fix. Backend should also validate:

- Only owner can update their evaluation
- Only owner can resubmit rejected evaluation

Backend validation already exists in:

- `EvaluationService.updateEvaluation()` - checks ownership
- `EvaluationService.resubmitEvaluation()` - checks ownership and status

## Status

✅ **Fixed** - Edit button now only shows for evaluation owner

---

**Impact:** Prevents confusion and unauthorized edit attempts
**Security:** UI + Backend validation
**User Experience:** Clearer permissions
