# Appeals System - Integration Checklist

## ✅ Completed (Automatic)

All backend and frontend core components are implemented and ready to use:

- ✅ Database migration V13
- ✅ Backend services and controllers
- ✅ Frontend pages and components
- ✅ API client and types
- ✅ Notifications integration

## 📋 Manual Integration Required

You need to manually add these components to existing pages:

### 1. Evaluation Detail Page - Add Appeal Button

**File**: `frontend/src/app/evaluations/[id]/page.tsx`

**Location**: In the action buttons section (where Edit/Delete buttons are)

**Code to add**:

```tsx
// Add import at top
import { AppealButton } from "@/components/AppealButton";

// Add in the JSX where action buttons are rendered (around line 820-850)
// Find the section with canEdit, canDelete buttons and add:
{
  evaluation.status === "FACULTY_APPROVED" && isOwner && (
    <AppealButton
      evaluationId={evaluation.id}
      evaluationStatus={evaluation.status}
      criteria={criteria.map((c) => ({ id: c.id, name: c.name }))}
      onAppealCreated={() => {
        router.refresh();
        toast({
          title: "Thành công",
          description: "Khiếu nại đã được gửi thành công",
        });
      }}
    />
  );
}
```

**Visual location**: Add this button next to the "Chỉnh sửa" (Edit) button in the top-right corner of the page.

---

### 2. Dashboard - Add Appeal Cards

**File**: `frontend/src/app/dashboard/page.tsx`

**Location**: In the dashboard cards grid section

**Code to add**:

```tsx
// Add imports at top
import {
  StudentAppealCard,
  ReviewerAppealCard,
} from "@/components/DashboardAppealCards";

// Add in the cards grid (around line 100-150)
// Find the section with other dashboard cards and add:

{
  /* Student Appeal Card - for students */
}
{
  user?.studentCode && <StudentAppealCard />;
}

{
  /* Reviewer Appeal Card - for faculty/admin */
}
<ReviewerAppealCard />;
```

**Visual location**: Add these cards in the grid alongside existing cards like "Đánh giá của tôi", "Đánh giá chờ duyệt", etc.

---

### 3. Navigation Menu - Add Appeals Links (Optional)

**File**: `frontend/src/components/DashboardLayout.tsx` (or wherever your navigation is)

**Code to add**:

```tsx
// For students
{
  user?.studentCode && (
    <Link href="/appeals/my">
      <Button variant="ghost" className="w-full justify-start">
        <MessageSquare className="mr-2 h-4 w-4" />
        Khiếu nại của tôi
      </Button>
    </Link>
  );
}

// For faculty/admin
{
  (user?.roles?.includes("ADMIN") ||
    user?.roles?.includes("FACULTY_INSTRUCTOR")) && (
    <Link href="/appeals">
      <Button variant="ghost" className="w-full justify-start">
        <ClipboardCheck className="mr-2 h-4 w-4" />
        Quản lý khiếu nại
      </Button>
    </Link>
  );
}
```

---

## 🧪 Testing Steps

After adding the integrations above:

### 1. Test Appeal Creation

1. Create an evaluation and submit it
2. Have it approved through all levels (CLASS → ADVISOR → FACULTY)
3. Go to evaluation detail page
4. You should see "Khiếu nại" button
5. Click it and create an appeal
6. Verify appeal appears in "Khiếu nại của tôi"

### 2. Test Appeal Review

1. Login as Faculty or Admin
2. Go to Dashboard
3. You should see "Khiếu nại chờ xử lý" card with count
4. Click to go to appeals management page
5. Click on an appeal to review
6. Accept or reject the appeal
7. Verify student receives notification

### 3. Test Deadline Enforcement

1. Create an evaluation period with `appeal_deadline_days = 1`
2. Approve an evaluation
3. Wait 2 days (or manually change period end date in database)
4. Verify "Khiếu nại" button no longer appears
5. Try to create appeal via API - should fail with deadline error

### 4. Test Multiple Appeals

1. Create and submit an appeal
2. Have it rejected by faculty
3. Create another appeal for the same evaluation
4. Verify both appeals appear in student's appeals list
5. Verify deadline is still enforced

---

## 🔧 Configuration

### Set Appeal Deadline for Evaluation Periods

**File**: `frontend/src/app/admin/evaluation-periods/page.tsx`

You may want to add a field for `appeal_deadline_days` in the evaluation period form:

```tsx
<div>
  <Label htmlFor="appealDeadlineDays">Số ngày khiếu nại sau khi kết thúc</Label>
  <Input
    id="appealDeadlineDays"
    type="number"
    min="1"
    defaultValue="7"
    placeholder="7"
  />
  <p className="text-sm text-muted-foreground">
    Sinh viên có thể khiếu nại trong X ngày sau khi đợt đánh giá kết thúc
  </p>
</div>
```

---

## 🐛 Troubleshooting

### Appeal Button Not Showing

**Check**:

1. Evaluation status is exactly "FACULTY_APPROVED"
2. Current date is before deadline
3. User is the evaluation owner (isOwner = true)
4. AppealButton component is imported correctly

**Debug**:

```tsx
// Add temporary debug output
console.log("Appeal button check:", {
  status: evaluation.status,
  isOwner,
  canAppeal: evaluation.status === "FACULTY_APPROVED" && isOwner,
});
```

### API Errors

**Check**:

1. Backend is running on correct port
2. API_BASE environment variable is set correctly
3. User has valid authentication token
4. Check browser console for detailed error messages

**Common errors**:

- 403 Forbidden: User doesn't have permission
- 400 Bad Request: Validation failed (check request body)
- 404 Not Found: Evaluation or appeal doesn't exist

### Notifications Not Sent

**Check**:

1. NotificationService is properly autowired
2. AuthServiceClient is available
3. Check backend logs for notification creation
4. Verify user IDs are being fetched correctly

---

## 📊 Database Verification

After deployment, verify the migration ran successfully:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('appeals', 'appeal_criteria', 'appeal_files');

-- Check appeal_deadline_days column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'evaluation_periods'
AND column_name = 'appeal_deadline_days';

-- Check sample data
SELECT id, status, created_at FROM appeals LIMIT 5;
```

---

## 🎯 Quick Verification Checklist

- [ ] Database migration V13 completed successfully
- [ ] Backend compiles without errors
- [ ] Frontend builds without errors
- [ ] Appeal button added to evaluation detail page
- [ ] Appeal cards added to dashboard
- [ ] Navigation links added (optional)
- [ ] Can create appeal for FACULTY_APPROVED evaluation
- [ ] Can view appeals list as student
- [ ] Can view pending appeals as faculty/admin
- [ ] Can review and accept/reject appeals
- [ ] Notifications are created correctly
- [ ] Deadline enforcement works
- [ ] Multiple appeals work correctly

---

## 📚 Additional Resources

- **Full Documentation**: `docs/APPEALS_SYSTEM_COMPLETE.md`
- **Quick Start**: `docs/APPEALS_QUICK_START.md`
- **Backend Details**: `docs/APPEALS_BACKEND_IMPLEMENTATION.md`
- **Requirements**: `.kiro/specs/evaluation-appeals/requirements.md`
- **Design**: `.kiro/specs/evaluation-appeals/design.md`
- **Tasks**: `.kiro/specs/evaluation-appeals/tasks.md`

---

## 🚀 Deployment Checklist

- [ ] Run database migration V13
- [ ] Deploy backend with new code
- [ ] Deploy frontend with new components
- [ ] Add appeal button to evaluation detail page
- [ ] Add appeal cards to dashboard
- [ ] Test appeal creation workflow
- [ ] Test appeal review workflow
- [ ] Verify notifications work
- [ ] Monitor logs for errors
- [ ] Update user documentation

---

## ✨ Success Criteria

The appeals system is working correctly when:

1. ✅ Students can see "Khiếu nại" button on FACULTY_APPROVED evaluations
2. ✅ Students can create appeals with reason and criteria selection
3. ✅ Students can view their appeals list with status
4. ✅ Faculty/Admin can see pending appeals count on dashboard
5. ✅ Faculty/Admin can review and accept/reject appeals
6. ✅ Notifications are sent to all parties
7. ✅ Deadline is enforced correctly
8. ✅ Multiple appeals are supported
9. ✅ Authorization works (students can't review, faculty can't create)
10. ✅ Evaluation status updates correctly on appeal acceptance

---

## 🎉 You're Done!

Once you've completed the manual integration steps above, the appeals system will be fully functional and ready for production use!

If you encounter any issues, refer to the troubleshooting section or check the detailed documentation files.
