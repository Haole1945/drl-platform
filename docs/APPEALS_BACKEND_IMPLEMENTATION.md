# Appeals System - Backend Implementation Complete

## Summary

Completed Tasks 4-8 of the appeals system implementation (backend core functionality). The system allows students to appeal FACULTY_APPROVED evaluations within a configurable deadline, and faculty/admin can review and accept/reject appeals.

## Completed Tasks

### Task 4: Appeal Service - Core Logic ✅

**File**: `backend/evaluation-service/src/main/java/ptit/drl/evaluation/service/AppealService.java`

Implemented methods:

- `createAppeal()` - Creates new appeal with validation

  - Validates evaluation status (must be FACULTY_APPROVED)
  - Validates ownership (student can only appeal their own evaluations)
  - Validates deadline (must be within appeal period)
  - Validates appeal reason (not empty/whitespace)
  - Validates file count (max 10 files)
  - Supports appealing all criteria or specific criteria
  - Sends notification to faculty reviewers

- `getAppealById()` - Gets appeal with authorization check

  - Students can view their own appeals
  - Faculty/Admin can view all appeals

- `getStudentAppeals()` - Gets paginated appeals for student

  - Ordered by creation date (newest first)

- `getPendingAppeals()` - Gets paginated pending appeals for reviewers

  - Filters by PENDING and REVIEWING status
  - Ordered by creation date (newest first)

- `canAppeal()` - Checks if appeal is allowed

  - Validates ownership, status, and deadline

- `getAppealDeadline()` - Calculates appeal deadline
  - Deadline = evaluation period end date + appeal_deadline_days
  - Default: 7 days if not configured

### Task 5: Appeal Service - Review Logic ✅

**File**: `backend/evaluation-service/src/main/java/ptit/drl/evaluation/service/AppealService.java`

Implemented method:

- `reviewAppeal()` - Reviews appeal (accept/reject)
  - Authorization: Only ADMIN and FACULTY_INSTRUCTOR can review
  - Validates review comment (not empty/whitespace)
  - **Accept**: Changes appeal status to ACCEPTED, updates evaluation status to CLASS_APPROVED
  - **Reject**: Changes appeal status to REJECTED, keeps evaluation status/scores unchanged
  - Records reviewer ID, comment, and review date
  - Sends notification to student with decision and reason

### Task 6: Notification Integration ✅

**Files**:

- `backend/evaluation-service/src/main/java/ptit/drl/evaluation/service/NotificationService.java`
- `backend/evaluation-service/src/main/java/ptit/drl/evaluation/entity/Notification.java`

Added notification types:

- `APPEAL_CREATED` - Sent to faculty/admin when appeal is created
- `APPEAL_REVIEWED` - Sent to student when appeal is reviewed

Implemented method:

- `notifyAppealCreated()` - Notifies FACULTY_INSTRUCTOR and ADMIN users
  - Includes student name, code, and semester
  - Prevents duplicate notifications

Appeal review notifications are sent in `reviewAppeal()`:

- **Accepted**: "Khiếu nại được chấp nhận" with reason
- **Rejected**: "Khiếu nại bị từ chối" with reason and re-appeal option

### Task 7: Appeal Controller and API Endpoints ✅

**File**: `backend/evaluation-service/src/main/java/ptit/drl/evaluation/api/AppealController.java`

Implemented endpoints:

- `POST /api/appeals` - Create appeal

  - Requires: X-User-Code header (student code)
  - Body: CreateAppealRequest (evaluationId, appealReason, criteriaIds, fileIds)
  - Returns: 201 Created with AppealDTO

- `GET /api/appeals/my` - Get student's appeals

  - Requires: X-User-Code header
  - Query params: page, size (default: 0, 20)
  - Returns: Paginated list of AppealDTO

- `GET /api/appeals/pending` - Get pending appeals for reviewers

  - Requires: X-User-Roles header (ADMIN or FACULTY_INSTRUCTOR)
  - Query params: page, size
  - Returns: Paginated list of AppealDTO

- `GET /api/appeals/{id}` - Get appeal details

  - Requires: X-User-Code, X-User-Roles headers
  - Authorization: Owner or reviewer
  - Returns: AppealDTO

- `PUT /api/appeals/{id}/review` - Review appeal

  - Requires: X-User-Code, X-User-Roles headers (ADMIN or FACULTY_INSTRUCTOR)
  - Body: ReviewAppealRequest (decision, comment)
  - Returns: Updated AppealDTO

- `GET /api/appeals/evaluation/{evaluationId}/can-appeal` - Check appeal eligibility
  - Requires: X-User-Code header
  - Returns: CanAppealResponse (canAppeal: boolean, deadline: LocalDate)

### Task 8: Update Evaluation Period Management ✅

**File**: `backend/evaluation-service/src/main/java/ptit/drl/evaluation/entity/EvaluationPeriod.java`

Added field:

- `appealDeadlineDays` (Integer) - Number of days after period end date for appeals
  - Default: 7 days
  - Column: `appeal_deadline_days`
  - Getter/Setter methods added

## Database Schema

Already created in Task 1 (V13\_\_create_appeals_tables.sql):

- `appeals` table - Main appeal records
- `appeal_criteria` table - Many-to-many relationship with criteria
- `appeal_files` table - Evidence file references
- `evaluation_periods.appeal_deadline_days` column - Configurable deadline

## Key Features

1. **Multiple Appeals**: Students can submit multiple appeals for the same evaluation (if rejected and within deadline)

2. **Deadline Enforcement**: Appeals are only allowed within X days after evaluation period ends (configurable per period)

3. **Granular Criteria Selection**: Students can appeal entire evaluation or specific criteria

4. **Evidence Files**: Optional file uploads (max 10 files, 50MB each - validated at file service level)

5. **Authorization**:

   - Students: Create appeals, view own appeals
   - Faculty/Admin: View all appeals, review appeals

6. **Notifications**:

   - Faculty/Admin notified when appeal is created
   - Student notified when appeal is reviewed (with decision and reason)

7. **Status Transitions**:

   - Appeal: PENDING → REVIEWING → ACCEPTED/REJECTED
   - Evaluation (on accept): FACULTY_APPROVED → CLASS_APPROVED
   - Evaluation (on reject): Status unchanged

8. **Audit Trail**: Records reviewer ID, comment, and review date

## Next Steps

### Frontend Implementation (Tasks 9-20)

- Task 9: Frontend types and API client
- Task 10: Appeal status badge component
- Task 11: Appeal creation dialog
- Task 12: Student appeals list page
- Task 13: Appeal detail page (student view)
- Task 14: Appeals management page (reviewer)
- Task 15: Appeal review page (reviewer)
- Task 16: Evaluation detail page integration
- Task 17: Dashboard integration
- Task 18: Authorization and access control
- Task 19: Multiple appeals support
- Task 20: Error handling and validation

### Optional Tasks (Tasks 21-25)

- Task 21: Unit tests for backend
- Task 22: Property-based tests
- Task 23: Frontend unit tests
- Task 24: Integration tests
- Task 25: Documentation and deployment

## Testing Recommendations

Before proceeding to frontend:

1. Test database migration (V13) on development database
2. Test API endpoints with Postman/curl:
   - Create appeal for FACULTY_APPROVED evaluation
   - Verify deadline enforcement
   - Test accept/reject workflows
   - Verify notifications are created
3. Check logs for any errors
4. Verify evaluation status updates correctly on appeal acceptance

## Notes

- The backend is complete and ready for frontend integration
- All validation rules from requirements are implemented
- Notification system is integrated
- Authorization checks are in place
- Error handling follows existing patterns
- No compilation errors detected
