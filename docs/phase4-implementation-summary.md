# Phase 4: Evaluation Workflow - Implementation Summary

## Overview
Phase 4 implements the complete evaluation workflow system with state management, approval process, and criteria-based scoring.

## ✅ Completed Components

### 1. Enhanced Entities

#### **EvaluationStatus Enum** (`entity/EvaluationStatus.java`)
- States: `DRAFT`, `SUBMITTED`, `CLASS_APPROVED`, `FACULTY_APPROVED`, `CTSV_APPROVED`, `REJECTED`
- Helper methods:
  - `canEdit()`: Check if evaluation can be edited
  - `canSubmit()`: Check if can be submitted
  - `canApprove()`: Check if can be approved
  - `canReject()`: Check if can be rejected
  - `canResubmit()`: Check if can be resubmitted
  - `getNextApprovalStatus()`: Get next status after approval
  - `getApprovalLevel()`: Get current approval level (CLASS, FACULTY, CTSV)

#### **EvaluationHistory Entity** (`entity/EvaluationHistory.java`)
- Tracks all state transitions and approval actions
- Fields:
  - `action`: Type of action (SUBMITTED, APPROVED, REJECTED, RESUBMITTED)
  - `fromStatus`, `toStatus`: Status transitions
  - `level`: Approval level (CLASS, FACULTY, CTSV)
  - `actor`: User who performed the action
  - `actorName`: Name cached for performance
  - `comment`: Reason or comment
  - `createdAt`: Timestamp

#### **Updated Evaluation Entity** (`entity/Evaluation.java`)
- Added fields:
  - `academicYear`: Academic year for the evaluation
  - `history`: One-to-Many relationship with `EvaluationHistory`
  - `resubmissionCount`: Track number of resubmissions
- Helper methods:
  - `addHistory()`: Add history entry
  - `incrementResubmissionCount()`: Increment resubmission counter

### 2. DTOs (11 files)

#### Request DTOs:
1. **CreateEvaluationRequest** - Create new evaluation
   - `studentCode`, `rubricId`, `semester`, `academicYear`
   - List of `CreateEvaluationDetailRequest`

2. **CreateEvaluationDetailRequest** - Evaluation detail (score per criteria)
   - `criteriaId`, `score`, `evidence`, `note`

3. **UpdateEvaluationRequest** - Update existing evaluation
   - Similar to create but for DRAFT status only

4. **ApprovalRequest** - Approve evaluation
   - `comment` (optional)

5. **RejectionRequest** - Reject evaluation
   - `reason` (required)

6. **ResubmitEvaluationRequest** - Resubmit after rejection
   - List of updated details
   - `responseToRejection`

#### Response DTOs:
7. **EvaluationDTO** - Full evaluation data
   - Includes student info, rubric info, details, history
   - Status, scores, timestamps

8. **EvaluationDetailDTO** - Detail for one criteria
   - Criteria info, score, evidence, note

9. **EvaluationHistoryDTO** - History entry
   - Action, level, actor, comment, timestamp

10. **RubricDTO** - Rubric with criteria
    - Basic info, criteria list, active status

11. **CriteriaDTO** - Single criteria
    - Name, description, max score, order

### 3. Services (3 files)

#### **EvaluationService** (`service/EvaluationService.java`)
Core workflow logic:

**Create & Read:**
- `createEvaluation()`: Create new evaluation in DRAFT status
  - Validates student, rubric, criteria
  - Calculates total score
  - Creates initial history entry
- `getEvaluationById()`: Get single evaluation
- `getEvaluationsByStudent()`: Get evaluations by student (with optional semester filter)

**Update:**
- `updateEvaluation()`: Update evaluation (DRAFT only)
  - Recalculates total score
  - Validates all criteria scores

**Workflow Actions:**
- `submitEvaluation()`: Submit for approval (DRAFT → SUBMITTED)
- `approveEvaluation()`: Approve and move to next level
  - SUBMITTED → CLASS_APPROVED
  - CLASS_APPROVED → FACULTY_APPROVED
  - FACULTY_APPROVED → CTSV_APPROVED
- `rejectEvaluation()`: Reject with reason
- `resubmitEvaluation()`: Resubmit after rejection

**Query:**
- `getPendingEvaluations()`: Get evaluations pending approval at specific level

#### **RubricService** (`service/RubricService.java`)
Rubric management:
- `getAllRubrics()`: List all rubrics
- `getRubricById()`: Get rubric with criteria
- `getActiveRubric()`: Get active rubric for academic year
- `createRubric()`: Create new rubric
- `updateRubric()`: Update rubric details
- `activateRubric()`: Activate rubric (deactivates others in same year)
- `deactivateRubric()`: Deactivate rubric

#### **CriteriaService** (`service/CriteriaService.java`)
Criteria management:
- `getCriteriaByRubricId()`: Get all criteria for a rubric
- `getCriteriaById()`: Get single criteria
- `createCriteria()`: Add new criteria to rubric
- `updateCriteria()`: Update criteria details
- `deleteCriteria()`: Delete criteria

### 4. Controllers (3 files)

#### **EvaluationController** (`api/EvaluationController.java`)
REST endpoints:

```
GET    /evaluations                  - Get all evaluations (with filters)
GET    /evaluations/{id}             - Get evaluation by ID
GET    /evaluations/student/{code}   - Get student's evaluations
GET    /evaluations/pending          - Get pending evaluations for approval
POST   /evaluations                  - Create new evaluation
PUT    /evaluations/{id}             - Update evaluation
POST   /evaluations/{id}/submit      - Submit for approval
POST   /evaluations/{id}/approve     - Approve evaluation
POST   /evaluations/{id}/reject      - Reject evaluation
POST   /evaluations/{id}/resubmit    - Resubmit after rejection
```

#### **RubricController** (`api/RubricController.java`)
REST endpoints:

```
GET    /rubrics          - Get all rubrics
GET    /rubrics/{id}     - Get rubric by ID (with criteria)
GET    /rubrics/active   - Get active rubric
POST   /rubrics          - Create new rubric
PUT    /rubrics/{id}     - Update rubric
POST   /rubrics/{id}/activate    - Activate rubric
POST   /rubrics/{id}/deactivate  - Deactivate rubric
```

#### **CriteriaController** (`api/CriteriaController.java`)
REST endpoints:

```
GET    /criteria?rubricId={id}  - Get criteria by rubric
GET    /criteria/{id}           - Get criteria by ID
POST   /criteria                - Create new criteria
PUT    /criteria/{id}           - Update criteria
DELETE /criteria/{id}           - Delete criteria
```

### 5. Mappers (2 files)

#### **EvaluationMapper** (`mapper/EvaluationMapper.java`)
- `toDTO()`: Entity → DTO (with details and history)
- `toEntity()`: CreateRequest → Entity
- `toDetailEntity()`: CreateDetailRequest → EvaluationDetail
- `toDetailDTO()`: EvaluationDetail → DTO
- `toHistoryDTO()`: EvaluationHistory → DTO

#### **RubricMapper** (`mapper/RubricMapper.java`)
- `toDTO()`: Rubric → RubricDTO (with criteria)
- `toDTOWithoutCriteria()`: Rubric → RubricDTO (for list view)
- `toCriteriaDTO()`: Criteria → CriteriaDTO

### 6. Exceptions

#### **InvalidStateTransitionException** (`exception/InvalidStateTransitionException.java`)
- Thrown when attempting invalid workflow state transition
- Handled as 400 BAD REQUEST

### 7. Updated Repositories

#### **EvaluationRepository**
Added queries:
- `findByStudentStudentCode()` - with and without pagination
- `findByStatus()` - with pagination
- `findByAcademicYear()` - with pagination
- `existsByStudentStudentCodeAndSemester()`
- `findPendingEvaluations()` - custom query with status list

#### **RubricRepository**
Added queries:
- `findByAcademicYearAndIsActiveTrue()` - Get active rubric for year

## 🔄 Evaluation Workflow

### State Diagram

```
┌─────────┐  submit   ┌───────────┐  approve  ┌────────────────┐
│  DRAFT  │─────────→ │ SUBMITTED │─────────→ │ CLASS_APPROVED │
└─────────┘           └───────────┘           └────────────────┘
     ↑                      │                          │
     │                      │ reject                   │ approve
     │                      ↓                          ↓
     │                 ┌──────────┐            ┌─────────────────┐
     └─────────────────│ REJECTED │            │ FACULTY_APPROVED│
       resubmit        └──────────┘            └─────────────────┘
                                                       │
                                                       │ approve
                                                       ↓
                                                ┌───────────────┐
                                                │ CTSV_APPROVED │
                                                └───────────────┘
                                                   (FINAL)
```

### Approval Levels

1. **CLASS**: Class advisor/instructor reviews submitted evaluations
2. **FACULTY**: Faculty dean reviews class-approved evaluations
3. **CTSV**: Student affairs office (Cộng tác sinh viên) final approval

### Business Rules

1. **Creation**: Students create evaluations in DRAFT status
2. **Editing**: Only DRAFT evaluations can be edited
3. **Submission**: Students submit when ready for review
4. **Rejection**: Can happen at any approval level
   - Must provide reason
   - Student can view reason and resubmit
5. **Resubmission**: After rejection, student can fix and resubmit
   - Goes back to SUBMITTED status
   - Resubmission count is tracked
6. **Final Approval**: Only CTSV can give final approval
7. **Scoring**: 
   - Each criteria has a max score
   - Student self-scores for each criteria
   - Total score is automatically calculated
   - Scores must not exceed criteria max score

## 📝 Key Features

### 1. Automatic Score Calculation
- System calculates total score from individual criteria scores
- Validates scores against max scores for each criteria

### 2. Complete Audit Trail
- Every state change is logged in `evaluation_history`
- Tracks who, when, what, and why for each action

### 3. Flexible Approval Flow
- Three-level approval process
- Each level can approve or reject
- Rejection with reason allows for correction

### 4. Resubmission Tracking
- Counts number of times evaluation was resubmitted
- Useful for analytics and identifying problematic evaluations

### 5. Rubric Management
- Multiple rubrics can exist
- Only one active rubric per academic year
- Criteria are ordered and can be dynamically managed

## 🧪 Testing (Pending)

Testing will be done in a separate phase as requested by user.

### Test Scenarios to Cover:

1. **Create Evaluation**
   - Valid creation with all criteria
   - Invalid: missing criteria, invalid scores
   - Duplicate prevention (same student + semester)

2. **Submit & Approve Workflow**
   - Submit evaluation
   - Class advisor approves
   - Faculty approves
   - CTSV final approval

3. **Rejection & Resubmission**
   - Reject at different levels
   - Resubmit with corrections
   - Track resubmission count

4. **Invalid State Transitions**
   - Edit non-DRAFT evaluation (should fail)
   - Approve non-submitted evaluation (should fail)
   - Resubmit non-rejected evaluation (should fail)

5. **Rubric Management**
   - Create rubric with criteria
   - Activate/deactivate rubrics
   - Only one active rubric per year

6. **Query & Filtering**
   - Get evaluations by student
   - Get evaluations by semester
   - Get pending evaluations by level

## 📊 Database Schema Changes

### New Tables:
- `evaluation_history` - Tracks all approval/rejection actions

### Modified Tables:
- `evaluations` - Added `academic_year`, `resubmission_count`, status enum updated
- `evaluation_details` - Added `evidence`, `note` fields

## 🎯 Phase 4 Completion Checklist

- [x] Enhance `Evaluation` entity with workflow fields
- [x] Create `EvaluationStatus` enum with state transition logic
- [x] Create `EvaluationHistory` entity for audit trail
- [x] Create 11 DTOs for requests and responses
- [x] Implement `EvaluationService` with full workflow logic
- [x] Implement `RubricService` for rubric management
- [x] Implement `CriteriaService` for criteria management
- [x] Create `EvaluationController` with 10 endpoints
- [x] Create `RubricController` with 7 endpoints
- [x] Create `CriteriaController` with 5 endpoints
- [x] Update mappers with entity ↔ DTO conversion
- [x] Add custom exception for invalid state transitions
- [x] Update repositories with new query methods
- [x] Document all components and workflow
- [ ] Testing (deferred to later as per user request)

## 🚀 Next Steps

1. **Build & Deploy**: Build Docker image and start services
2. **Test APIs**: Use PowerShell scripts or Postman to test endpoints
3. **Phase 5**: Implement Authentication & Authorization (JWT, role-based access)

## 📝 Notes

- User authentication is temporarily mocked (using headers)
- Full JWT authentication will be implemented in Phase 5
- Authorization logic (who can approve at each level) will be added in Phase 5
- Gateway routes need to be updated to include new endpoints

