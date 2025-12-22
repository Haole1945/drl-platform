# Appeals System - Quick Start Guide

## For Developers

### Quick Integration

#### 1. Add Appeal Button to Evaluation Detail Page

```tsx
// In frontend/src/app/evaluations/[id]/page.tsx
import { AppealButton } from "@/components/AppealButton";

// Add in the action buttons section (where Edit/Delete buttons are):
{
  evaluation.status === "FACULTY_APPROVED" && isOwner && (
    <AppealButton
      evaluationId={evaluation.id}
      evaluationStatus={evaluation.status}
      criteria={criteria.map((c) => ({ id: c.id, name: c.name }))}
      onAppealCreated={() => router.refresh()}
    />
  );
}
```

#### 2. Add Appeal Cards to Dashboard

```tsx
// In frontend/src/app/dashboard/page.tsx
import {
  StudentAppealCard,
  ReviewerAppealCard,
} from "@/components/DashboardAppealCards";

// Add in the dashboard cards grid:
{
  user?.studentCode && <StudentAppealCard />;
}
<ReviewerAppealCard />;
```

### Database Migration

```bash
# The migration V13 is already created
# Just run your normal migration process
# It will create:
# - appeals table
# - appeal_criteria table
# - appeal_files table
# - Add appeal_deadline_days column to evaluation_periods
```

### API Endpoints

All endpoints are under `/api/appeals`:

```bash
# Create appeal
POST /api/appeals
Body: { evaluationId, appealReason, criteriaIds, fileIds }

# Get my appeals
GET /api/appeals/my?page=0&size=20

# Get pending appeals (faculty/admin)
GET /api/appeals/pending?page=0&size=20

# Get appeal details
GET /api/appeals/{id}

# Review appeal (faculty/admin)
PUT /api/appeals/{id}/review
Body: { decision: "ACCEPT" | "REJECT", comment }

# Check if can appeal
GET /api/appeals/evaluation/{evaluationId}/can-appeal
```

## For Users

### Students

#### How to Appeal

1. Go to your evaluation detail page
2. If evaluation is FACULTY_APPROVED and within deadline, you'll see "Khiếu nại" button
3. Click the button and fill in:
   - Appeal reason (min 10 characters)
   - Select criteria (or "All criteria")
   - Upload evidence files (optional, max 10 files)
4. Submit and wait for review

#### View Your Appeals

1. Go to Dashboard
2. Click "Khiếu nại của tôi" card
3. Or navigate to `/appeals/my`
4. Click any appeal to see details and review decision

### Faculty/Admin

#### Review Appeals

1. Go to Dashboard
2. Click "Khiếu nại chờ xử lý" card
3. Or navigate to `/appeals`
4. Click an appeal to review
5. Enter review comment (min 10 characters)
6. Click "Chấp nhận" (Accept) or "Từ chối" (Reject)
7. Confirm your decision

#### What Happens

- **Accept**: Evaluation returns to CLASS_APPROVED status for re-review
- **Reject**: Evaluation status unchanged, student can appeal again if within deadline

## Configuration

### Set Appeal Deadline

1. Go to Admin > Evaluation Periods
2. When creating/editing a period, set `appeal_deadline_days`
3. Default: 7 days
4. Deadline = period end date + appeal_deadline_days

Example:

- Period ends: 2024-12-31
- Appeal deadline days: 7
- Appeal deadline: 2025-01-07

## Troubleshooting

### Appeal Button Not Showing

Check:

- Evaluation status is FACULTY_APPROVED
- Current date is before deadline
- User is the evaluation owner
- AppealButton component is imported and added

### Cannot Create Appeal

Check:

- Evaluation status (must be FACULTY_APPROVED)
- Deadline has not passed
- Appeal reason is not empty (min 10 characters)
- User owns the evaluation

### Cannot Review Appeal

Check:

- User has ADMIN or FACULTY_INSTRUCTOR role
- Review comment is not empty (min 10 characters)
- Appeal is in PENDING or REVIEWING status

### Notifications Not Sent

Check:

- NotificationService is not null
- AuthServiceClient is not null
- User IDs are being fetched correctly
- Check backend logs for errors

## File Locations

### Backend

- Service: `backend/evaluation-service/src/main/java/ptit/drl/evaluation/service/AppealService.java`
- Controller: `backend/evaluation-service/src/main/java/ptit/drl/evaluation/api/AppealController.java`
- Entity: `backend/evaluation-service/src/main/java/ptit/drl/evaluation/entity/Appeal.java`
- Migration: `backend/evaluation-service/src/main/resources/db/migration/V13__create_appeals_tables.sql`

### Frontend

- API Client: `frontend/src/lib/api/appeals.ts`
- Types: `frontend/src/types/appeal.ts`
- Components: `frontend/src/components/Appeal*.tsx`
- Pages: `frontend/src/app/appeals/**/*.tsx`

## Quick Commands

```bash
# Check if migration ran
psql -d your_db -c "SELECT * FROM appeals LIMIT 1;"

# Count appeals
psql -d your_db -c "SELECT status, COUNT(*) FROM appeals GROUP BY status;"

# Check appeal deadline for period
psql -d your_db -c "SELECT id, name, appeal_deadline_days FROM evaluation_periods;"

# Test API endpoint
curl -X GET http://localhost:8080/api/appeals/my \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Status Flow

```
Student creates appeal
    ↓
PENDING (notification sent to faculty/admin)
    ↓
Faculty/Admin reviews
    ↓
    ├─→ ACCEPTED (evaluation → CLASS_APPROVED, notification to student)
    └─→ REJECTED (evaluation unchanged, notification to student, can re-appeal)
```

## Common Scenarios

### Scenario 1: Student Appeals Entire Evaluation

1. Student clicks "Khiếu nại" button
2. Enters reason: "Tôi có thêm minh chứng cho tất cả các tiêu chí"
3. Selects "Khiếu nại toàn bộ đánh giá"
4. Uploads 3 evidence files
5. Submits → Status: PENDING

### Scenario 2: Faculty Accepts Appeal

1. Faculty sees notification
2. Goes to "Quản lý khiếu nại"
3. Clicks on appeal
4. Reviews reason and evidence
5. Enters comment: "Minh chứng hợp lệ, chấp nhận khiếu nại"
6. Clicks "Chấp nhận"
7. Confirms → Status: ACCEPTED, Evaluation: CLASS_APPROVED

### Scenario 3: Faculty Rejects Appeal, Student Re-appeals

1. Faculty rejects with comment: "Minh chứng không đủ"
2. Student receives notification
3. Student creates new appeal with better evidence
4. New appeal created (if still within deadline)
5. Faculty reviews again

## Best Practices

### For Students

- Provide clear, specific reasons for appeal
- Upload relevant evidence files
- Appeal only specific criteria if possible (faster review)
- Check deadline before appealing

### For Faculty/Admin

- Review appeals promptly
- Provide clear, constructive comments
- Be consistent in decisions
- Document reasoning for future reference

### For Developers

- Always check authorization before operations
- Validate input on both frontend and backend
- Handle errors gracefully with user-friendly messages
- Log important operations for debugging
- Test deadline calculations thoroughly

## Support

Need help? Check:

1. Full documentation: `docs/APPEALS_SYSTEM_COMPLETE.md`
2. Backend implementation: `docs/APPEALS_BACKEND_IMPLEMENTATION.md`
3. Requirements: `.kiro/specs/evaluation-appeals/requirements.md`
4. Design: `.kiro/specs/evaluation-appeals/design.md`
