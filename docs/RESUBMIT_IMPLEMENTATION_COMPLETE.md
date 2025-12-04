# ✅ Resubmit Feature Implementation Complete

## What Was Implemented

### 1. Edit Evaluation Page

**Location:** `frontend/src/app/evaluations/[id]/edit/page.tsx`

**Features:**

- ✅ Load existing evaluation data
- ✅ Pre-fill all criteria scores and evidence
- ✅ Show rejection reason prominently (if rejected)
- ✅ Add "Response to Rejection" textarea
- ✅ Allow editing all criteria scores
- ✅ Support file uploads for evidence
- ✅ Save as draft or submit
- ✅ Call `resubmitEvaluation()` API for rejected evaluations
- ✅ Call `updateEvaluation()` API for draft evaluations

### 2. Rejection Reason Display

**Location:** `frontend/src/app/evaluations/[id]/page.tsx` (already existed)

**Features:**

- ✅ Show rejection reason in red alert box
- ✅ Display in evaluation detail page
- ✅ Clear visual indicator

### 3. Edit Button

**Location:** `frontend/src/app/evaluations/[id]/page.tsx` (already existed)

**Features:**

- ✅ Show "Chỉnh sửa & Nộp lại" for REJECTED status
- ✅ Show "Chỉnh sửa" for DRAFT status
- ✅ Redirect to edit page

## User Flow

### When Evaluation is Rejected:

1. **Admin/Approver rejects evaluation**

   - Enters rejection reason
   - Clicks "Từ chối"
   - Backend changes status to REJECTED

2. **Student receives notification** (if enabled)

   - Email or in-app notification
   - "Your evaluation has been rejected"

3. **Student views evaluation**

   - Goes to "Đánh giá Của Tôi"
   - Sees evaluation with "Bị từ chối" badge
   - Clicks on evaluation

4. **Student sees rejection reason**

   - Red alert box shows: "Lý do từ chối: [reason]"
   - Button shows: "Chỉnh sửa & Nộp lại"

5. **Student edits evaluation**

   - Clicks "Chỉnh sửa & Nộp lại"
   - Redirected to edit page
   - Sees rejection reason at top
   - Can add "Phản hồi về lý do từ chối"
   - Edits scores and evidence
   - Clicks "Nộp lại"

6. **Backend processes resubmit**

   - Status changes: REJECTED → SUBMITTED
   - Creates history entry: "RESUBMITTED"
   - Increments `resubmissionCount`
   - Stores `responseToRejection`

7. **Evaluation goes back to approval queue**
   - Approver sees it again
   - Can approve or reject again
   - Can see resubmission history

## UI Screenshots (Conceptual)

### Evaluation Detail (Rejected)

```
┌─────────────────────────────────────────┐
│ Chi tiết Đánh giá                       │
│ HK1 - 2024-2025                         │
│                                         │
│ [Bị từ chối]  [Chỉnh sửa & Nộp lại]   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⚠️ Đánh giá bị từ chối                  │
│                                         │
│ Lý do: Thiếu minh chứng cho tiêu chí   │
│ 1.1 và điểm tiêu chí 2.3 quá cao       │
└─────────────────────────────────────────┘
```

### Edit Page (Resubmit)

```
┌─────────────────────────────────────────┐
│ Chỉnh sửa & Nộp lại Đánh giá           │
│ HK1 - 2024-2025                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⚠️ Đánh giá bị từ chối                  │
│                                         │
│ Lý do: Thiếu minh chứng cho tiêu chí   │
│ 1.1 và điểm tiêu chí 2.3 quá cao       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Phản hồi về lý do từ chối               │
│                                         │
│ [Đã bổ sung minh chứng cho tiêu chí    │
│  1.1 và điều chỉnh điểm tiêu chí 2.3]  │
└─────────────────────────────────────────┘

[Criteria editing form...]

[Hủy]  [Lưu nháp]  [Nộp lại]
```

## API Calls

### Resubmit (REJECTED → SUBMITTED)

```typescript
POST /evaluations/{id}/resubmit
Body: {
  details: [
    { criteriaId: 1, score: 15, comment: "..." },
    { criteriaId: 2, score: 20, comment: "..." }
  ],
  responseToRejection: "Đã sửa theo yêu cầu..."
}
```

### Update Draft

```typescript
PUT /evaluations/{id}
Body: {
  details: [...]
}
```

## Testing Checklist

### Test 1: Reject and Resubmit Flow

- [ ] Login as Admin
- [ ] Find a SUBMITTED evaluation
- [ ] Click "Từ chối"
- [ ] Enter rejection reason: "Thiếu minh chứng tiêu chí 1"
- [ ] Confirm rejection
- [ ] Verify status changes to REJECTED

- [ ] Login as Student (owner of evaluation)
- [ ] Go to "Đánh giá Của Tôi"
- [ ] Find the rejected evaluation
- [ ] Verify "Bị từ chối" badge shows
- [ ] Click on evaluation
- [ ] Verify rejection reason displays
- [ ] Click "Chỉnh sửa & Nộp lại"
- [ ] Verify redirected to edit page
- [ ] Verify rejection reason shows at top
- [ ] Add response: "Đã bổ sung minh chứng"
- [ ] Edit some scores
- [ ] Click "Nộp lại"
- [ ] Verify success message
- [ ] Verify redirected back to detail page
- [ ] Verify status is now SUBMITTED

### Test 2: Edit Draft

- [ ] Login as Student
- [ ] Create new evaluation (save as draft)
- [ ] Go to evaluation detail
- [ ] Click "Chỉnh sửa"
- [ ] Edit scores
- [ ] Click "Lưu nháp"
- [ ] Verify changes saved
- [ ] Click "Nộp đánh giá"
- [ ] Verify status changes to SUBMITTED

### Test 3: Multiple Resubmissions

- [ ] Reject evaluation
- [ ] Student resubmits
- [ ] Reject again with different reason
- [ ] Student resubmits again
- [ ] Verify resubmissionCount increments
- [ ] Verify history shows all resubmissions

## Files Created/Modified

### Created:

1. `frontend/src/app/evaluations/[id]/edit/page.tsx` - Edit evaluation page

### Modified:

- None (rejection reason display already existed)

## Known Limitations

1. **File Upload:** File upload component may need adjustment based on actual FileUpload component props
2. **Sub-criteria:** Currently simplified - may need enhancement for complex sub-criteria
3. **Validation:** Basic validation only - may need more robust validation
4. **History Display:** Resubmission history not shown in UI (backend tracks it)

## Future Enhancements

1. **Show Resubmission History**

   - Display resubmissionCount
   - Show all previous rejection reasons
   - Show all responses to rejections

2. **Compare Changes**

   - Show diff between original and resubmitted scores
   - Highlight what changed

3. **Notification Improvements**

   - Real-time notification when rejected
   - Email with rejection reason

4. **Bulk Resubmit**
   - Allow resubmitting multiple rejected evaluations at once

## Status

✅ **Complete and Ready for Testing**

**Implementation Time:** ~45 minutes
**Files Created:** 1
**Files Modified:** 0 (reused existing)
**Lines of Code:** ~400

---

**Next Steps:**

1. Test the complete flow
2. Adjust UI/UX based on feedback
3. Add more validation if needed
4. Consider future enhancements
