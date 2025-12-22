# Design Document - Evaluation Appeals System

## Overview

The Evaluation Appeals System extends the existing student training point evaluation platform by allowing students to formally contest their finalized evaluation scores. The system provides a structured workflow for submitting appeals, reviewing them, and processing decisions while maintaining data integrity and proper audit trails.

The appeals system integrates seamlessly with the existing evaluation workflow, notification system, and role-based access control. It supports multiple appeals per evaluation, configurable deadlines, and granular criteria selection.

## Architecture

### System Components

The appeals system follows the existing microservices architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Appeal Pages │  │  Dashboard   │  │ Eval Details │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 8080)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  Evaluation Service      │   │   Student Service        │
│  (Port 8083)             │   │   (Port 8081)            │
│  ┌────────────────────┐  │   │                          │
│  │ AppealController   │  │   │  (Student data lookup)   │
│  │ AppealService      │  │   │                          │
│  │ AppealRepository   │  │   │                          │
│  │ Appeal Entity      │  │   │                          │
│  └────────────────────┘  │   │                          │
│                          │   │                          │
│  ┌────────────────────┐  │   │                          │
│  │ EvaluationService  │  │   │                          │
│  │ (status updates)   │  │   │                          │
│  └────────────────────┘  │   │                          │
│                          │   │                          │
│  ┌────────────────────┐  │   │                          │
│  │ NotificationService│  │   │                          │
│  │ (send alerts)      │  │   │                          │
│  └────────────────────┘  │   │                          │
└──────────────────────────┘   └──────────────────────────┘
                │
                ▼
┌──────────────────────────┐
│   PostgreSQL Database    │
│   ┌──────────────────┐   │
│   │ appeals          │   │
│   │ appeal_criteria  │   │
│   │ appeal_files     │   │
│   └──────────────────┘   │
└──────────────────────────┘
```

### Integration Points

1. **Evaluation Service**: Appeals are tightly coupled with evaluations

   - Read evaluation data for appeal creation
   - Update evaluation status when appeals are accepted
   - Cascade delete appeals when evaluations are deleted

2. **Student Service**: Lookup student information for display

   - Get student names for appeal lists
   - Verify student ownership

3. **File Service**: Handle evidence file uploads

   - Store and retrieve appeal evidence files
   - Link files to appeals

4. **Notification Service**: Send alerts for appeal events

   - Notify faculty when appeals are created
   - Notify students when appeals are reviewed

5. **Auth Service**: Verify user permissions
   - Check roles for appeal creation and review
   - Validate ownership for access control

## Components and Interfaces

### Backend Components

#### 1. Appeal Entity

```java
@Entity
@Table(name = "appeals")
public class Appeal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long evaluationId;

    @Column(nullable = false, length = 20)
    private String studentCode;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String appealReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AppealStatus status; // PENDING, REVIEWING, ACCEPTED, REJECTED

    @Column(length = 20)
    private String reviewerId;

    @Column(columnDefinition = "TEXT")
    private String reviewComment;

    @Column
    private LocalDateTime reviewDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "appeal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AppealCriteria> appealedCriteria;

    @OneToMany(mappedBy = "appeal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AppealFile> evidenceFiles;
}
```

#### 2. AppealCriteria Entity

```java
@Entity
@Table(name = "appeal_criteria")
public class AppealCriteria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appeal_id", nullable = false)
    private Appeal appeal;

    @Column(nullable = false)
    private Long criteriaId;
}
```

#### 3. AppealFile Entity

```java
@Entity
@Table(name = "appeal_files")
public class AppealFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appeal_id", nullable = false)
    private Appeal appeal;

    @Column(nullable = false)
    private Long fileId; // Reference to file service
}
```

#### 4. AppealService

```java
@Service
public class AppealService {
    // Create appeal
    public AppealDTO createAppeal(CreateAppealRequest request, String studentCode);

    // Get appeals for student
    public Page<AppealDTO> getStudentAppeals(String studentCode, Pageable pageable);

    // Get appeals for review (faculty/admin)
    public Page<AppealDTO> getPendingAppeals(Pageable pageable);

    // Get appeal by ID
    public AppealDTO getAppealById(Long id, String userCode, Set<String> roles);

    // Review appeal (accept/reject)
    public AppealDTO reviewAppeal(Long id, ReviewAppealRequest request, String reviewerId);

    // Check if appeal is allowed
    public boolean canAppeal(Long evaluationId, String studentCode);

    // Get appeal deadline for evaluation
    public LocalDate getAppealDeadline(Long evaluationId);
}
```

#### 5. AppealController

```java
@RestController
@RequestMapping("/api/appeals")
public class AppealController {
    @PostMapping
    public ResponseEntity<ApiResponse<AppealDTO>> createAppeal(@RequestBody CreateAppealRequest request);

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<AppealDTO>>> getMyAppeals(@RequestParam(defaultValue = "0") int page);

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<Page<AppealDTO>>> getPendingAppeals(@RequestParam(defaultValue = "0") int page);

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppealDTO>> getAppealById(@PathVariable Long id);

    @PutMapping("/{id}/review")
    public ResponseEntity<ApiResponse<AppealDTO>> reviewAppeal(@PathVariable Long id, @RequestBody ReviewAppealRequest request);

    @GetMapping("/evaluation/{evaluationId}/can-appeal")
    public ResponseEntity<ApiResponse<Boolean>> canAppeal(@PathVariable Long evaluationId);
}
```

### Frontend Components

#### 1. Appeal Creation Dialog

- **Location**: `frontend/src/components/AppealDialog.tsx`
- **Purpose**: Modal form for creating appeals
- **Props**: `evaluationId`, `criteria[]`, `onSuccess`
- **Features**:
  - Text area for appeal reason
  - Checkbox list for criteria selection (or "All criteria" option)
  - File upload for evidence (max 10 files, 50MB each)
  - Validation and error handling

#### 2. Appeal Status Badge

- **Location**: `frontend/src/components/AppealStatusBadge.tsx`
- **Purpose**: Display appeal status with color coding
- **Props**: `status`
- **Statuses**: PENDING (yellow), REVIEWING (blue), ACCEPTED (green), REJECTED (red)

#### 3. Student Appeals List Page

- **Location**: `frontend/src/app/appeals/my/page.tsx`
- **Purpose**: List all appeals for logged-in student
- **Features**:
  - Paginated table of appeals
  - Filter by status
  - Click to view details
  - Shows: Evaluation semester, appeal date, status, criteria count

#### 4. Appeal Detail Page (Student View)

- **Location**: `frontend/src/app/appeals/[id]/page.tsx`
- **Purpose**: View appeal details and review decision
- **Features**:
  - Appeal reason and evidence files
  - Appealed criteria list
  - Review decision and comments (if reviewed)
  - Link to original evaluation

#### 5. Appeals Management Page (Reviewer)

- **Location**: `frontend/src/app/appeals/page.tsx`
- **Purpose**: List pending appeals for review
- **Features**:
  - Paginated table of pending/reviewing appeals
  - Shows: Student name, evaluation semester, appeal date
  - Click to review

#### 6. Appeal Review Page (Reviewer)

- **Location**: `frontend/src/app/appeals/[id]/review/page.tsx`
- **Purpose**: Review and process appeals
- **Features**:
  - Display original evaluation details
  - Show appeal reason and evidence
  - Accept/Reject buttons with comment field
  - Validation for required review comment

#### 7. Dashboard Integration

- **Student Dashboard**: Add "My Appeals" card showing appeal count
- **Reviewer Dashboard**: Add "Pending Appeals" card showing count
- **Evaluation Detail Page**: Add "Appeal" button when status is FACULTY_APPROVED and within deadline

## Data Models

### Database Schema

```sql
-- Appeals table
CREATE TABLE appeals (
    id BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    student_code VARCHAR(20) NOT NULL,
    appeal_reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED')),
    reviewer_id VARCHAR(20),
    review_comment TEXT,
    review_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appeals_evaluation ON appeals(evaluation_id);
CREATE INDEX idx_appeals_student ON appeals(student_code);
CREATE INDEX idx_appeals_status ON appeals(status);
CREATE INDEX idx_appeals_created ON appeals(created_at DESC);

-- Appeal criteria (many-to-many)
CREATE TABLE appeal_criteria (
    id BIGSERIAL PRIMARY KEY,
    appeal_id BIGINT NOT NULL REFERENCES appeals(id) ON DELETE CASCADE,
    criteria_id BIGINT NOT NULL REFERENCES criteria(id)
);

CREATE INDEX idx_appeal_criteria_appeal ON appeal_criteria(appeal_id);

-- Appeal files (evidence)
CREATE TABLE appeal_files (
    id BIGSERIAL PRIMARY KEY,
    appeal_id BIGINT NOT NULL REFERENCES appeals(id) ON DELETE CASCADE,
    file_id BIGINT NOT NULL
);

CREATE INDEX idx_appeal_files_appeal ON appeal_files(appeal_id);

-- Add appeal deadline to evaluation periods
ALTER TABLE evaluation_periods ADD COLUMN appeal_deadline_days INTEGER DEFAULT 7;
```

### DTOs

```typescript
// Frontend TypeScript types
interface Appeal {
  id: number;
  evaluationId: number;
  studentCode: string;
  studentName?: string;
  evaluationSemester?: string;
  appealReason: string;
  status: "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED";
  reviewerId?: string;
  reviewerName?: string;
  reviewComment?: string;
  reviewDate?: string;
  createdAt: string;
  updatedAt: string;
  appealedCriteria: AppealCriteria[];
  evidenceFiles: AppealFile[];
}

interface AppealCriteria {
  id: number;
  criteriaId: number;
  criteriaName?: string;
}

interface AppealFile {
  id: number;
  fileId: number;
  fileUrl: string;
  fileName: string;
}

interface CreateAppealRequest {
  evaluationId: number;
  appealReason: string;
  criteriaIds: number[]; // Empty array means "all criteria"
  fileIds: number[];
}

interface ReviewAppealRequest {
  decision: "ACCEPT" | "REJECT";
  comment: string;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Appeal status validation

_For any_ appeal creation attempt, the system should only allow appeals for evaluations with status FACULTY_APPROVED.
**Validates: Requirements 1.2**

### Property 2: Appeal deadline enforcement

_For any_ appeal creation attempt with a given current date and evaluation period, the system should only allow creation if current date is within the appeal deadline.
**Validates: Requirements 1.3, 2.4**

### Property 3: Appeal reason validation

_For any_ appeal submission with a reason string composed entirely of whitespace, the system should reject the appeal.
**Validates: Requirements 1.4**

### Property 4: Criteria selection validation

_For any_ appeal submission, the system should accept either an empty criteria list (meaning all criteria) or a non-empty list of specific criteria IDs.
**Validates: Requirements 1.5**

### Property 5: Initial appeal status

_For any_ successfully created appeal, the initial status should be PENDING.
**Validates: Requirements 1.8**

### Property 6: Appeal creation notification

_For any_ successfully created appeal, a notification should be sent to users with FACULTY role.
**Validates: Requirements 1.9**

### Property 7: Positive deadline days validation

_For any_ evaluation period creation with appeal deadline days, the system should only accept positive integer values.
**Validates: Requirements 2.2**

### Property 8: Deadline calculation

_For any_ evaluation period with end date D and appeal deadline days N, the calculated appeal deadline should equal D + N days.
**Validates: Requirements 2.3**

### Property 9: Student appeals filtering

_For any_ student viewing their appeals list, the system should return only appeals where the student_code matches the logged-in user's student code.
**Validates: Requirements 3.1**

### Property 10: Appeal list display completeness

_For any_ appeal displayed in a list, the rendered output should contain evaluation semester, appeal date, status, and criteria count.
**Validates: Requirements 3.2**

### Property 11: Appeal detail display completeness

_For any_ appeal detail view, the rendered output should contain appeal reason, selected criteria, evidence files, and current status.
**Validates: Requirements 3.4**

### Property 12: Review information display

_For any_ appeal with status ACCEPTED or REJECTED, the detail view should display reviewer's decision and comments.
**Validates: Requirements 3.5**

### Property 13: Pending appeals filtering

_For any_ reviewer viewing the appeals management page, the system should return only appeals with status PENDING or REVIEWING.
**Validates: Requirements 4.1**

### Property 14: Review list display completeness

_For any_ appeal displayed in the review list, the rendered output should contain student name, evaluation semester, appeal date, and criteria appealed.
**Validates: Requirements 4.2**

### Property 15: Review detail display completeness

_For any_ appeal in review mode, the displayed information should include original evaluation details, appeal reason, and evidence files.
**Validates: Requirements 4.4**

### Property 16: Review comment validation

_For any_ appeal review submission (accept or reject) with a comment string composed entirely of whitespace, the system should reject the review.
**Validates: Requirements 4.6**

### Property 17: Status update persistence

_For any_ appeal status change to REVIEWING, the updated status should be immediately persisted and retrievable.
**Validates: Requirements 4.7**

### Property 18: Accept status transition

_For any_ appeal that is accepted, the appeal status should change to ACCEPTED.
**Validates: Requirements 5.1**

### Property 19: Evaluation status update on acceptance

_For any_ appeal that is accepted, the associated evaluation status should change to CLASS_APPROVED.
**Validates: Requirements 5.2**

### Property 20: Accept audit trail

_For any_ accepted appeal, the system should record the reviewer ID and review date.
**Validates: Requirements 5.3**

### Property 21: Accept comment persistence

_For any_ accepted appeal, the reviewer's comment should be stored and retrievable.
**Validates: Requirements 5.4**

### Property 22: Accept notification

_For any_ accepted appeal, a notification should be sent to the student who created the appeal.
**Validates: Requirements 5.5**

### Property 23: Reject status transition

_For any_ appeal that is rejected, the appeal status should change to REJECTED.
**Validates: Requirements 6.1**

### Property 24: Evaluation status invariant on rejection

_For any_ appeal that is rejected, the associated evaluation status should remain FACULTY_APPROVED.
**Validates: Requirements 6.2**

### Property 25: Evaluation scores invariant on rejection

_For any_ appeal that is rejected, the associated evaluation scores should remain unchanged.
**Validates: Requirements 6.3**

### Property 26: Reject audit trail

_For any_ rejected appeal, the system should record the reviewer ID and review date.
**Validates: Requirements 6.4**

### Property 27: Reject comment persistence

_For any_ rejected appeal, the reviewer's comment should be stored and retrievable.
**Validates: Requirements 6.5**

### Property 28: Reject notification

_For any_ rejected appeal, a notification should be sent to the student with the rejection reason.
**Validates: Requirements 6.6**

### Property 29: Multiple appeals allowance

_For any_ evaluation with a rejected appeal, the system should allow creation of a new appeal for the same evaluation (if within deadline).
**Validates: Requirements 6.7, 7.1**

### Property 30: Appeal history chronological order

_For any_ evaluation with multiple appeals, the appeals should be displayed in chronological order by creation date.
**Validates: Requirements 7.2**

### Property 31: Previous appeals display

_For any_ subsequent appeal creation, the UI should display previous appeal attempts and their outcomes.
**Validates: Requirements 7.3**

### Property 32: Appeal count inclusivity

_For any_ appeal count calculation, the system should include appeals of all statuses.
**Validates: Requirements 7.4**

### Property 33: Deadline overrides multiple appeals

_For any_ appeal creation attempt after the deadline, the system should prevent creation regardless of previous rejections.
**Validates: Requirements 7.5**

### Property 34: Owner-only appeal creation

_For any_ appeal creation attempt, the system should only allow creation if the user's student code matches the evaluation's student code.
**Validates: Requirements 8.1**

### Property 35: Appeal view authorization

_For any_ appeal detail view attempt, the system should only allow access if the user is either the appeal creator or has ADMIN/FACULTY role.
**Validates: Requirements 8.2**

### Property 36: Review authorization

_For any_ appeal review attempt, the system should only allow the action if the user has ADMIN or FACULTY role.
**Validates: Requirements 8.3**

### Property 37: Management page access control

_For any_ appeals management page access attempt by a user with only STUDENT role, the system should deny access.
**Validates: Requirements 8.4**

### Property 38: Cross-student appeal access control

_For any_ appeal view attempt by a student, the system should only allow access if the appeal's student code matches the user's student code.
**Validates: Requirements 8.5**

### Property 39: Appeal indicator on evaluation status

_For any_ evaluation with pending or accepted appeals, the status display should include an appeal indicator.
**Validates: Requirements 9.4**

### Property 40: Appeal persistence with unique ID

_For any_ created appeal, the system should store the appeal in the database with a unique identifier.
**Validates: Requirements 10.1**

### Property 41: Required fields persistence

_For any_ created appeal, the system should store evaluation ID, student code, appeal reason, and selected criteria IDs.
**Validates: Requirements 10.2**

### Property 42: File association persistence

_For any_ appeal with uploaded evidence files, the system should store file references linked to the appeal ID.
**Validates: Requirements 10.3**

### Property 43: Review data persistence

_For any_ reviewed appeal, the system should store reviewer ID, review date, decision, and comments.
**Validates: Requirements 10.4**

### Property 44: Query filtering support

_For any_ appeal query with filters (student, evaluation, status, date range), the system should return only appeals matching all specified filters.
**Validates: Requirements 10.5**

### Property 45: Cascade delete integrity

_For any_ evaluation deletion, the system should automatically delete all associated appeals.
**Validates: Requirements 10.6**

### Property 46: Automatic timestamps

_For any_ appeal creation or update, the system should automatically record creation and update timestamps.
**Validates: Requirements 10.7**

## Error Handling

### Validation Errors

- **Invalid evaluation status**: Return 400 with message "Can only appeal evaluations with FACULTY_APPROVED status"
- **Deadline passed**: Return 400 with message "Appeal deadline has passed for this evaluation"
- **Empty appeal reason**: Return 400 with message "Appeal reason is required"
- **Too many files**: Return 400 with message "Maximum 10 evidence files allowed"
- **File too large**: Return 400 with message "File size exceeds 50MB limit"
- **Empty review comment**: Return 400 with message "Review comment is required"

### Authorization Errors

- **Not evaluation owner**: Return 403 with message "You can only appeal your own evaluations"
- **Not authorized to review**: Return 403 with message "Only faculty and administrators can review appeals"
- **Not authorized to view**: Return 403 with message "You do not have permission to view this appeal"

### Not Found Errors

- **Appeal not found**: Return 404 with message "Appeal not found"
- **Evaluation not found**: Return 404 with message "Evaluation not found"

### Conflict Errors

- **Appeal already in progress**: Return 409 with message "An appeal is already being reviewed for this evaluation"

### Server Errors

- **Database errors**: Return 500 with message "Failed to process appeal"
- **Notification errors**: Log error but don't fail the request (notifications are non-critical)

## Testing Strategy

### Unit Testing

The appeals system will use JUnit 5 for backend unit tests and Jest/React Testing Library for frontend tests.

**Backend Unit Tests:**

- `AppealServiceTest`: Test business logic for appeal creation, review, and queries
- `AppealControllerTest`: Test API endpoints with MockMvc
- `AppealRepositoryTest`: Test database queries and filtering
- `AppealValidationTest`: Test validation rules for deadlines, status, etc.

**Frontend Unit Tests:**

- `AppealDialog.test.tsx`: Test form validation and submission
- `AppealStatusBadge.test.tsx`: Test status display logic
- `appeals/my/page.test.tsx`: Test student appeals list rendering
- `appeals/[id]/review/page.test.tsx`: Test review form logic

**Key Test Scenarios:**

- Appeal creation with valid and invalid data
- Deadline calculation and validation
- Status transitions (PENDING → REVIEWING → ACCEPTED/REJECTED)
- Authorization checks for different roles
- Notification triggering
- Cascade delete behavior

### Property-Based Testing

Property-based tests will use QuickCheck-style testing to verify universal properties across many randomly generated inputs. Each property test should run a minimum of 100 iterations.

**Property Test Implementation:**

- Use a Java property-based testing library (e.g., jqwik or QuickTheories)
- Each property test must be tagged with a comment referencing the design document
- Tag format: `**Feature: evaluation-appeals, Property {number}: {property_text}**`
- Generate random test data: dates, evaluation statuses, user roles, appeal reasons, etc.

**Example Property Test Structure:**

```java
@Property
// **Feature: evaluation-appeals, Property 1: Appeal status validation**
void onlyFacultyApprovedEvaluationsCanBeAppealed(@ForAll Evaluation evaluation) {
    boolean canAppeal = appealService.canAppeal(evaluation.getId(), evaluation.getStudentCode());
    boolean expected = evaluation.getStatus() == EvaluationStatus.FACULTY_APPROVED;
    assertThat(canAppeal).isEqualTo(expected);
}
```

### Integration Testing

- Test complete appeal workflow: create → review → accept/reject
- Test integration with evaluation service (status updates)
- Test integration with notification service
- Test file upload and retrieval
- Test database transactions and rollbacks

### End-to-End Testing

- Student creates appeal through UI
- Reviewer receives notification
- Reviewer processes appeal through UI
- Student receives notification of decision
- Evaluation status updates correctly

## Performance Considerations

### Database Optimization

- Index on `appeals.evaluation_id` for fast lookup
- Index on `appeals.student_code` for student queries
- Index on `appeals.status` for pending appeals filtering
- Index on `appeals.created_at` for chronological sorting

### Caching Strategy

- Cache appeal counts for dashboard widgets (5-minute TTL)
- Cache appeal deadline calculations (per evaluation period)
- No caching of appeal details (data changes frequently)

### Pagination

- Default page size: 20 appeals
- Maximum page size: 100 appeals
- Use cursor-based pagination for large datasets

### File Handling

- Reuse existing file upload service
- Validate file types and sizes on upload
- Store only file references, not file content

## Security Considerations

### Authentication

- All appeal endpoints require JWT authentication
- Token must contain valid user information (studentCode, roles)

### Authorization

- Students can only create appeals for their own evaluations
- Students can only view their own appeals
- Faculty and Admin can view and review all appeals
- Role checks enforced at service layer

### Input Validation

- Sanitize appeal reason and review comments (prevent XSS)
- Validate file uploads (type, size, count)
- Validate criteria IDs exist in database
- Validate evaluation ID exists and belongs to student

### Audit Trail

- Record all appeal state changes
- Record reviewer identity for all decisions
- Timestamp all operations
- Maintain appeal history (don't delete old appeals)

## Deployment Considerations

### Database Migration

- Create migration script `V9__create_appeals_tables.sql`
- Add rollback script `U9__rollback_create_appeals_tables.sql`
- Test migration on staging environment first
- Backup database before production migration

### Feature Flags

- Consider feature flag for appeals system
- Allow gradual rollout to specific user groups
- Easy rollback if issues arise

### Monitoring

- Track appeal creation rate
- Monitor review processing time
- Alert on high rejection rates
- Track notification delivery success

### Documentation

- Update API documentation with new endpoints
- Create user guide for students (how to appeal)
- Create reviewer guide for faculty/admin
- Document appeal workflow and business rules
