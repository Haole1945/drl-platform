# API Design - Phase 4: Evaluation Workflow

## 📋 Overview

Phase 4 implements the evaluation workflow system including:
- **Evaluation Management**: Create, update, submit evaluations
- **Rubric Management**: CRUD operations for rubrics
- **Criteria Management**: CRUD operations for evaluation criteria
- **Approval Workflow**: Multi-level approval system (Class → Faculty → CTSV)
- **Score Calculation**: Automatic calculation and validation

---

## 🔄 Evaluation Workflow States

```
DRAFT → SUBMITTED → CLASS_APPROVED → FACULTY_APPROVED → CTSV_APPROVED
   ↓         ↓              ↓                ↓                ↓
   └─────────┴──────────────┴────────────────┴──────→ REJECTED
                                                           ↓
                                                    (Re-submit)
```

### State Descriptions

| State | Description | Who Can Transition | Next States |
|-------|-------------|-------------------|-------------|
| `DRAFT` | Initial state, being edited by student | Student | SUBMITTED |
| `SUBMITTED` | Waiting for class advisor review | Student | CLASS_APPROVED, REJECTED |
| `CLASS_APPROVED` | Approved by class advisor | Instructor (Class) | FACULTY_APPROVED, REJECTED |
| `FACULTY_APPROVED` | Approved by faculty | Admin (Faculty) | CTSV_APPROVED, REJECTED |
| `CTSV_APPROVED` | Final approval (complete) | Admin (CTSV) | - |
| `REJECTED` | Rejected at any level | Instructor/Admin | SUBMITTED (re-submit) |

---

## 🎯 Evaluation API Endpoints

Base URL: `http://localhost:8080/api/evaluations`

### 1. Create Evaluation (Draft)
**POST** `/api/evaluations`

**Request Body:**
```json
{
  "studentCode": "N21DCCN001",
  "rubricId": 1,
  "semester": "2024-2025-HK1",
  "academicYear": "2024-2025",
  "details": [
    {
      "criteriaId": 1,
      "score": 25.0,
      "evidence": "Điểm trung bình: 3.5/4.0",
      "note": "Học tập tốt"
    },
    {
      "criteriaId": 2,
      "score": 18.0,
      "evidence": "Không vi phạm nội quy",
      "note": ""
    }
  ]
}
```

**Validation Rules:**
- `studentCode`: Required, must exist
- `rubricId`: Required, must exist and be active
- `semester`: Required, max 20 chars
- `details`: At least 1 detail required
- `details.criteriaId`: Must exist and belong to rubric
- `details.score`: Must be within criteria min/max range

**Response 201 Created:**
```json
{
  "success": true,
  "message": "Evaluation created successfully",
  "data": {
    "id": 1,
    "studentCode": "N21DCCN001",
    "studentName": "Nguyễn Văn An",
    "rubricId": 1,
    "rubricName": "Rubric Điểm Rèn Luyện 2024-2025",
    "semester": "2024-2025-HK1",
    "academicYear": "2024-2025",
    "status": "DRAFT",
    "totalScore": 43.0,
    "maxScore": 100.0,
    "details": [
      {
        "criteriaId": 1,
        "criteriaName": "Ý thức học tập",
        "score": 25.0,
        "maxScore": 30.0,
        "evidence": "Điểm trung bình: 3.5/4.0",
        "note": "Học tập tốt"
      },
      {
        "criteriaId": 2,
        "criteriaName": "Ý thức và kết quả chấp hành nội quy",
        "score": 18.0,
        "maxScore": 20.0,
        "evidence": "Không vi phạm nội quy",
        "note": ""
      }
    ],
    "createdAt": "2024-11-17T10:00:00",
    "updatedAt": "2024-11-17T10:00:00"
  },
  "timestamp": "2024-11-17T10:00:00"
}
```

---

### 2. Get Evaluation by ID
**GET** `/api/evaluations/{id}`

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Evaluation found",
  "data": {
    "id": 1,
    "studentCode": "N21DCCN001",
    "studentName": "Nguyễn Văn An",
    "facultyName": "Công nghệ Thông tin 2",
    "className": "D21CQCN01-N",
    "rubricId": 1,
    "rubricName": "Rubric Điểm Rèn Luyện 2024-2025",
    "semester": "2024-2025-HK1",
    "academicYear": "2024-2025",
    "status": "SUBMITTED",
    "totalScore": 85.0,
    "maxScore": 100.0,
    "details": [...],
    "approvalHistory": [
      {
        "level": "CLASS",
        "approverName": "Nguyễn Văn A",
        "action": "APPROVED",
        "comment": "Đánh giá đúng",
        "timestamp": "2024-11-17T11:00:00"
      }
    ],
    "submittedAt": "2024-11-17T10:30:00",
    "createdAt": "2024-11-17T10:00:00",
    "updatedAt": "2024-11-17T11:00:00"
  },
  "timestamp": "2024-11-17T12:00:00"
}
```

---

### 3. Get Evaluations by Student
**GET** `/api/evaluations/student/{studentCode}`

**Query Parameters:**
- `semester` (optional): Filter by semester
- `academicYear` (optional): Filter by academic year

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Evaluations retrieved successfully",
  "data": [
    {
      "id": 1,
      "rubricName": "Rubric 2024-2025",
      "semester": "2024-2025-HK1",
      "status": "CTSV_APPROVED",
      "totalScore": 85.0,
      "maxScore": 100.0,
      "submittedAt": "2024-11-17T10:30:00",
      "finalApprovedAt": "2024-11-18T15:00:00"
    }
  ],
  "timestamp": "2024-11-17T12:00:00"
}
```

---

### 4. Update Evaluation (Draft only)
**PUT** `/api/evaluations/{id}`

**Note:** Can only update evaluations in `DRAFT` status.

**Request Body:**
```json
{
  "details": [
    {
      "criteriaId": 1,
      "score": 28.0,
      "evidence": "Updated evidence",
      "note": "Updated note"
    }
  ]
}
```

**Response 200 OK:** (Same structure as Create)

**Response 400 Bad Request:**
```json
{
  "success": false,
  "message": "Cannot update evaluation in SUBMITTED status",
  "errors": null,
  "timestamp": "2024-11-17T12:00:00"
}
```

---

### 5. Submit Evaluation for Approval
**POST** `/api/evaluations/{id}/submit`

**Note:** Changes status from `DRAFT` to `SUBMITTED`.

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Evaluation submitted successfully",
  "data": {
    "id": 1,
    "status": "SUBMITTED",
    "submittedAt": "2024-11-17T10:30:00"
  },
  "timestamp": "2024-11-17T10:30:00"
}
```

**Response 400 Bad Request:**
```json
{
  "success": false,
  "message": "Evaluation is already submitted",
  "errors": null,
  "timestamp": "2024-11-17T10:30:00"
}
```

---

### 6. Approve Evaluation (Multi-level)
**POST** `/api/evaluations/{id}/approve`

**Request Body:**
```json
{
  "comment": "Đánh giá chính xác, phản ánh đúng kết quả học tập"
}
```

**Authorization:**
- `SUBMITTED` → `CLASS_APPROVED`: Requires INSTRUCTOR role + EVALUATION_APPROVE_CLASS permission
- `CLASS_APPROVED` → `FACULTY_APPROVED`: Requires ADMIN role + EVALUATION_APPROVE_FACULTY permission
- `FACULTY_APPROVED` → `CTSV_APPROVED`: Requires ADMIN role + EVALUATION_APPROVE_CTSV permission

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Evaluation approved at CLASS level",
  "data": {
    "id": 1,
    "status": "CLASS_APPROVED",
    "approver": {
      "username": "instructor1",
      "fullName": "Nguyễn Văn A",
      "level": "CLASS"
    },
    "comment": "Đánh giá chính xác",
    "approvedAt": "2024-11-17T11:00:00"
  },
  "timestamp": "2024-11-17T11:00:00"
}
```

**Response 403 Forbidden:**
```json
{
  "success": false,
  "message": "You do not have permission to approve at this level",
  "errors": null,
  "timestamp": "2024-11-17T11:00:00"
}
```

---

### 7. Reject Evaluation
**POST** `/api/evaluations/{id}/reject`

**Request Body:**
```json
{
  "reason": "Điểm tự đánh giá không phù hợp với thực tế. Vui lòng xem xét lại tiêu chí 1 và 3."
}
```

**Note:** Can reject from any SUBMITTED/APPROVED state. Sets status to `REJECTED`.

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Evaluation rejected",
  "data": {
    "id": 1,
    "status": "REJECTED",
    "rejectedBy": "Nguyễn Văn A",
    "rejectedLevel": "CLASS",
    "reason": "Điểm tự đánh giá không phù hợp với thực tế...",
    "rejectedAt": "2024-11-17T11:30:00"
  },
  "timestamp": "2024-11-17T11:30:00"
}
```

---

### 8. Re-submit Evaluation (After Rejection)
**POST** `/api/evaluations/{id}/resubmit`

**Note:** Only available for evaluations in `REJECTED` status.

**Request Body:**
```json
{
  "details": [
    {
      "criteriaId": 1,
      "score": 22.0,
      "evidence": "Đã điều chỉnh theo góp ý",
      "note": "Đã xem xét lại"
    }
  ],
  "responseToRejection": "Đã điều chỉnh điểm tiêu chí 1 và 3 theo góp ý của cố vấn"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Evaluation re-submitted successfully",
  "data": {
    "id": 1,
    "status": "SUBMITTED",
    "resubmissionCount": 1,
    "responseToRejection": "Đã điều chỉnh điểm...",
    "submittedAt": "2024-11-17T14:00:00"
  },
  "timestamp": "2024-11-17T14:00:00"
}
```

---

### 9. Get Evaluations Pending Approval
**GET** `/api/evaluations/pending`

**Query Parameters:**
- `level` (optional): CLASS, FACULTY, CTSV
- `page` (default: 0)
- `size` (default: 20)

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Pending evaluations retrieved successfully",
  "data": {
    "content": [
      {
        "id": 1,
        "studentCode": "N21DCCN001",
        "studentName": "Nguyễn Văn An",
        "className": "D21CQCN01-N",
        "semester": "2024-2025-HK1",
        "status": "SUBMITTED",
        "totalScore": 85.0,
        "submittedAt": "2024-11-17T10:30:00"
      }
    ],
    "totalElements": 15,
    "totalPages": 1,
    "size": 20,
    "number": 0
  },
  "timestamp": "2024-11-17T12:00:00"
}
```

---

## 🎯 Rubric API Endpoints

Base URL: `http://localhost:8080/api/rubrics`

### 1. Get All Rubrics
**GET** `/api/rubrics`

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Rubrics retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Rubric Điểm Rèn Luyện 2024-2025",
      "description": "Bảng tiêu chí đánh giá...",
      "maxScore": 100.0,
      "academicYear": "2024-2025",
      "isActive": true,
      "criteriaCount": 5,
      "createdAt": "2024-09-01T00:00:00"
    }
  ],
  "timestamp": "2024-11-17T12:00:00"
}
```

---

### 2. Get Active Rubric
**GET** `/api/rubrics/active`

**Query Parameters:**
- `academicYear` (optional): Filter by academic year

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Active rubric found",
  "data": {
    "id": 1,
    "name": "Rubric Điểm Rèn Luyện 2024-2025",
    "description": "Bảng tiêu chí đánh giá điểm rèn luyện năm học 2024-2025",
    "maxScore": 100.0,
    "academicYear": "2024-2025",
    "isActive": true,
    "criteria": [
      {
        "id": 1,
        "name": "Ý thức học tập",
        "description": "Đánh giá ý thức học tập của sinh viên",
        "maxScore": 30.0,
        "orderIndex": 1
      },
      {
        "id": 2,
        "name": "Ý thức và kết quả chấp hành nội quy",
        "description": "Đánh giá việc chấp hành nội quy",
        "maxScore": 20.0,
        "orderIndex": 2
      }
    ],
    "createdAt": "2024-09-01T00:00:00"
  },
  "timestamp": "2024-11-17T12:00:00"
}
```

---

### 3. Create Rubric (Admin only)
**POST** `/api/rubrics`

**Request Body:**
```json
{
  "name": "Rubric Điểm Rèn Luyện 2025-2026",
  "description": "Bảng tiêu chí mới cho năm học 2025-2026",
  "maxScore": 100.0,
  "academicYear": "2025-2026"
}
```

**Response 201 Created:**
```json
{
  "success": true,
  "message": "Rubric created successfully",
  "data": {
    "id": 2,
    "name": "Rubric Điểm Rèn Luyện 2025-2026",
    "maxScore": 100.0,
    "academicYear": "2025-2026",
    "isActive": false,
    "createdAt": "2024-11-17T12:00:00"
  },
  "timestamp": "2024-11-17T12:00:00"
}
```

---

### 4. Update Rubric
**PUT** `/api/rubrics/{id}`

**Request Body:**
```json
{
  "name": "Rubric Updated",
  "description": "Updated description"
}
```

**Response 200 OK:** (Same structure as Create)

---

### 5. Activate/Deactivate Rubric
**POST** `/api/rubrics/{id}/activate`
**POST** `/api/rubrics/{id}/deactivate`

**Note:** Only one rubric can be active per academic year.

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Rubric activated successfully",
  "data": {
    "id": 1,
    "name": "Rubric 2024-2025",
    "isActive": true
  },
  "timestamp": "2024-11-17T12:00:00"
}
```

---

## 🎯 Criteria API Endpoints

Base URL: `http://localhost:8080/api/criteria`

### 1. Get Criteria by Rubric
**GET** `/api/criteria/rubric/{rubricId}`

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Criteria retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Ý thức học tập",
      "description": "Đánh giá ý thức học tập của sinh viên",
      "maxScore": 30.0,
      "orderIndex": 1,
      "rubricId": 1,
      "rubricName": "Rubric 2024-2025"
    }
  ],
  "timestamp": "2024-11-17T12:00:00"
}
```

---

### 2. Create Criterion (Admin only)
**POST** `/api/criteria`

**Request Body:**
```json
{
  "name": "Ý thức tham gia hoạt động",
  "description": "Đánh giá mức độ tham gia các hoạt động ngoại khóa",
  "maxScore": 15.0,
  "orderIndex": 6,
  "rubricId": 1
}
```

**Response 201 Created:**
```json
{
  "success": true,
  "message": "Criterion created successfully",
  "data": {
    "id": 6,
    "name": "Ý thức tham gia hoạt động",
    "maxScore": 15.0,
    "orderIndex": 6,
    "rubricId": 1
  },
  "timestamp": "2024-11-17T12:00:00"
}
```

---

### 3. Update Criterion
**PUT** `/api/criteria/{id}`

**Request Body:**
```json
{
  "name": "Updated name",
  "maxScore": 20.0
}
```

**Response 200 OK:** (Same structure as Create)

---

### 4. Delete Criterion
**DELETE** `/api/criteria/{id}`

**Note:** Cannot delete if used in any evaluations.

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Criterion deleted successfully",
  "data": null,
  "timestamp": "2024-11-17T12:00:00"
}
```

---

## 📊 Statistics API Endpoints

### 1. Get Evaluation Statistics
**GET** `/api/evaluations/statistics`

**Query Parameters:**
- `semester` (optional)
- `facultyCode` (optional)
- `classCode` (optional)

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalEvaluations": 150,
    "byStatus": {
      "DRAFT": 10,
      "SUBMITTED": 20,
      "CLASS_APPROVED": 40,
      "FACULTY_APPROVED": 50,
      "CTSV_APPROVED": 25,
      "REJECTED": 5
    },
    "averageScore": 82.5,
    "averageProcessingTime": "2.5 days"
  },
  "timestamp": "2024-11-17T12:00:00"
}
```

---

## 🔒 Authorization Matrix

| Endpoint | STUDENT | INSTRUCTOR | ADMIN |
|----------|---------|------------|-------|
| POST /evaluations | ✅ (own) | ❌ | ✅ |
| GET /evaluations/{id} | ✅ (own) | ✅ (class) | ✅ |
| PUT /evaluations/{id} | ✅ (own, DRAFT) | ❌ | ✅ |
| POST /evaluations/{id}/submit | ✅ (own) | ❌ | ✅ |
| POST /evaluations/{id}/approve | ❌ | ✅ (CLASS level) | ✅ (all levels) |
| POST /evaluations/{id}/reject | ❌ | ✅ | ✅ |
| GET /evaluations/pending | ❌ | ✅ (class) | ✅ |
| POST /rubrics | ❌ | ❌ | ✅ |
| PUT /rubrics/{id} | ❌ | ❌ | ✅ |
| POST /criteria | ❌ | ❌ | ✅ |

**Note:** Phase 4 will prepare endpoints, full authorization implementation in Phase 5.

---

## 📝 Implementation Plan

### Step 1: Enhance Existing Entities
- Add missing fields to Evaluation entity
- Create EvaluationHistory entity for approval tracking
- Add status enum

### Step 2: DTOs
- EvaluationDTO, CreateEvaluationRequest, UpdateEvaluationRequest
- EvaluationDetailDTO, CreateEvaluationDetailRequest
- RubricDTO, CriteriaDTO
- ApprovalRequestDTO, RejectRequestDTO

### Step 3: Services
- EvaluationService (workflow logic)
- RubricService (CRUD)
- CriteriaService (CRUD)
- EvaluationWorkflowService (state transitions)

### Step 4: Controllers
- EvaluationController
- RubricController
- CriteriaController

### Step 5: Testing
- Test all workflows
- Test state transitions
- Test validation rules
- Test authorization (basic checks)

---

## ✅ Testing Checklist

### Evaluation Workflow
- [ ] Create evaluation (DRAFT)
- [ ] Update evaluation (DRAFT only)
- [ ] Submit evaluation (DRAFT → SUBMITTED)
- [ ] Approve at CLASS level (SUBMITTED → CLASS_APPROVED)
- [ ] Approve at FACULTY level (CLASS_APPROVED → FACULTY_APPROVED)
- [ ] Approve at CTSV level (FACULTY_APPROVED → CTSV_APPROVED)
- [ ] Reject evaluation (any → REJECTED)
- [ ] Re-submit after rejection (REJECTED → SUBMITTED)
- [ ] Cannot update non-DRAFT evaluation
- [ ] Cannot submit already submitted evaluation

### Score Validation
- [ ] Score within criteria min/max
- [ ] Total score calculation
- [ ] All criteria filled

### Rubric & Criteria
- [ ] Create rubric
- [ ] Activate/deactivate rubric
- [ ] Create criteria
- [ ] Update criteria
- [ ] Delete criteria (check dependencies)

---

**Ready to implement Phase 4!** 🚀

