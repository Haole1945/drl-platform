# API Design - Phase 3: Student & TrainingPoint CRUD Operations

## Overview

Phase 3 implements full CRUD (Create, Read, Update, Delete) operations for:
- **Student Service**: Quản lý thông tin sinh viên
- **TrainingPoint Service**: Quản lý điểm rèn luyện

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-11-17T10:30:00"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error 1", "Detailed error 2"],
  "timestamp": "2024-11-17T10:30:00"
}
```

---

## Student API Endpoints

Base URL: `http://localhost:8080/api/students`

### 1. Get All Students
**GET** `/api/students`

**Query Parameters:**
- `page` (optional): Page number (default: 0)
- `size` (optional): Page size (default: 20)
- `facultyCode` (optional): Filter by faculty
- `majorCode` (optional): Filter by major
- `classCode` (optional): Filter by class
- `academicYear` (optional): Filter by academic year

**Response:**
```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": {
    "content": [
      {
        "studentCode": "N21DCCN001",
        "fullName": "Nguyễn Văn An",
        "dateOfBirth": "2003-05-15",
        "gender": "MALE",
        "phone": "0123456789",
        "address": "Hà Nội",
        "academicYear": "2024-2025",
        "classCode": "D21CQCN01-N",
        "className": "D21CQCN01-N",
        "majorCode": "CN",
        "majorName": "Công nghệ Thông tin",
        "facultyCode": "CNTT2",
        "facultyName": "Công nghệ Thông tin 2"
      }
    ],
    "totalElements": 3,
    "totalPages": 1,
    "size": 20,
    "number": 0
  },
  "timestamp": "2024-11-17T10:30:00"
}
```

---

### 2. Get Student by Code
**GET** `/api/students/{studentCode}`

**Path Variable:**
- `studentCode`: Mã sinh viên (e.g., "N21DCCN001")

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Student found",
  "data": {
    "studentCode": "N21DCCN001",
    "fullName": "Nguyễn Văn An",
    "dateOfBirth": "2003-05-15",
    "gender": "MALE",
    "phone": "0123456789",
    "address": "Hà Nội",
    "academicYear": "2024-2025",
    "classCode": "D21CQCN01-N",
    "className": "D21CQCN01-N",
    "majorCode": "CN",
    "majorName": "Công nghệ Thông tin",
    "facultyCode": "CNTT2",
    "facultyName": "Công nghệ Thông tin 2"
  },
  "timestamp": "2024-11-17T10:30:00"
}
```

**Response 404 Not Found:**
```json
{
  "success": false,
  "message": "Student not found with code: SV999",
  "errors": null,
  "timestamp": "2024-11-17T10:30:00"
}
```

---

### 3. Create New Student
**POST** `/api/students`

**Request Body:**
```json
{
  "studentCode": "N21DCCN100",
  "fullName": "Phạm Thị Lan",
  "dateOfBirth": "2003-12-10",
  "gender": "FEMALE",
  "phone": "0912345678",
  "address": "Hà Nội",
  "academicYear": "2024-2025",
  "classCode": "D21CQCN02-N",
  "majorCode": "CN",
  "facultyCode": "CNTT2"
}
```

**Validation Rules:**
- `studentCode`: Required, max 20 chars, unique
- `fullName`: Required, max 100 chars
- `gender`: Must be MALE, FEMALE, or OTHER
- `phone`: Max 20 chars
- `address`: Max 500 chars
- `classCode`: Required, must exist
- `majorCode`: Required, must exist
- `facultyCode`: Required, must exist

**Response 201 Created:**
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "studentCode": "N21DCCN100",
    "fullName": "Phạm Thị Lan",
    "dateOfBirth": "2003-12-10",
    "gender": "FEMALE",
    "phone": "0912345678",
    "address": "Hà Nội",
    "academicYear": "2024-2025",
    "classCode": "D21CQCN02-N",
    "className": "D21CQCN02-N",
    "majorCode": "CN",
    "majorName": "Công nghệ Thông tin",
    "facultyCode": "CNTT2",
    "facultyName": "Công nghệ Thông tin 2"
  },
  "timestamp": "2024-11-17T10:30:00"
}
```

**Response 400 Bad Request (Validation Error):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Student code is required",
    "Full name must not exceed 100 characters",
    "Gender must be MALE, FEMALE, or OTHER"
  ],
  "timestamp": "2024-11-17T10:30:00"
}
```

**Response 409 Conflict (Duplicate):**
```json
{
  "success": false,
  "message": "Student with code N21DCCN100 already exists",
  "errors": null,
  "timestamp": "2024-11-17T10:30:00"
}
```

---

### 4. Update Student
**PUT** `/api/students/{studentCode}`

**Path Variable:**
- `studentCode`: Mã sinh viên cần update

**Request Body:** (All fields optional)
```json
{
  "fullName": "Phạm Thị Lan (Updated)",
  "phone": "0999888777",
  "address": "Hà Nội, Việt Nam",
  "classCode": "D21CQCN01-N"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Student updated successfully",
  "data": {
    "studentCode": "N21DCCN100",
    "fullName": "Phạm Thị Lan (Updated)",
    "dateOfBirth": "2003-12-10",
    "gender": "FEMALE",
    "phone": "0999888777",
    "address": "Hà Nội, Việt Nam",
    "academicYear": "2024-2025",
    "classCode": "D21CQCN01-N",
    "className": "D21CQCN01-N",
    "majorCode": "CN",
    "majorName": "Công nghệ Thông tin",
    "facultyCode": "CNTT2",
    "facultyName": "Công nghệ Thông tin 2"
  },
  "timestamp": "2024-11-17T10:30:00"
}
```

---

### 5. Delete Student
**DELETE** `/api/students/{studentCode}`

**Path Variable:**
- `studentCode`: Mã sinh viên cần xóa

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Student deleted successfully",
  "data": null,
  "timestamp": "2024-11-17T10:30:00"
}
```

**Response 404 Not Found:**
```json
{
  "success": false,
  "message": "Student not found with code: SV999",
  "errors": null,
  "timestamp": "2024-11-17T10:30:00"
}
```

---

## TrainingPoint API Endpoints

Base URL: `http://localhost:8080/api/training-points`

### 1. Get All Training Points
**GET** `/api/training-points`

**Query Parameters:**
- `page` (optional): Page number (default: 0)
- `size` (optional): Page size (default: 20)
- `studentCode` (optional): Filter by student
- `semester` (optional): Filter by semester

**Response:**
```json
{
  "success": true,
  "message": "Training points retrieved successfully",
  "data": {
    "content": [
      {
        "id": 1,
        "activityName": "Tham gia phong trào hiến máu nhân đạo",
        "description": "Hiến máu tại trường PTIT",
        "activityDate": "2024-10-15",
        "points": 5.0,
        "evidenceUrl": "https://example.com/evidence/1.jpg",
        "semester": "2024-2025-HK1",
        "studentCode": "N21DCCN001",
        "studentName": "Nguyễn Văn An"
      }
    ],
    "totalElements": 10,
    "totalPages": 1,
    "size": 20,
    "number": 0
  },
  "timestamp": "2024-11-17T10:30:00"
}
```

---

### 2. Get Training Point by ID
**GET** `/api/training-points/{id}`

**Path Variable:**
- `id`: Training point ID

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Training point found",
  "data": {
    "id": 1,
    "activityName": "Tham gia phong trào hiến máu nhân đạo",
    "description": "Hiến máu tại trường PTIT",
    "activityDate": "2024-10-15",
    "points": 5.0,
    "evidenceUrl": "https://example.com/evidence/1.jpg",
    "semester": "2024-2025-HK1",
    "studentCode": "N21DCCN001",
    "studentName": "Nguyễn Văn An"
  },
  "timestamp": "2024-11-17T10:30:00"
}
```

---

### 3. Get Training Points by Student
**GET** `/api/training-points/student/{studentCode}`

**Path Variable:**
- `studentCode`: Mã sinh viên

**Query Parameters:**
- `semester` (optional): Filter by semester

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Training points retrieved successfully",
  "data": [
    {
      "id": 1,
      "activityName": "Tham gia phong trào hiến máu nhân đạo",
      "description": "Hiến máu tại trường PTIT",
      "activityDate": "2024-10-15",
      "points": 5.0,
      "evidenceUrl": "https://example.com/evidence/1.jpg",
      "semester": "2024-2025-HK1",
      "studentCode": "N21DCCN001",
      "studentName": "Nguyễn Văn An"
    }
  ],
  "timestamp": "2024-11-17T10:30:00"
}
```

---

### 4. Create Training Point
**POST** `/api/training-points`

**Request Body:**
```json
{
  "activityName": "Tham gia tình nguyện mùa hè xanh",
  "description": "Hoạt động tình nguyện tại vùng cao",
  "activityDate": "2024-07-20",
  "points": 10.0,
  "evidenceUrl": "https://example.com/evidence/summer2024.jpg",
  "semester": "2024-2025-HK1",
  "studentCode": "N21DCCN001"
}
```

**Validation Rules:**
- `activityName`: Required, max 200 chars
- `activityDate`: Required, cannot be future date
- `points`: Required, must be positive
- `semester`: Max 20 chars
- `studentCode`: Required, must exist

**Response 201 Created:**
```json
{
  "success": true,
  "message": "Training point created successfully",
  "data": {
    "id": 2,
    "activityName": "Tham gia tình nguyện mùa hè xanh",
    "description": "Hoạt động tình nguyện tại vùng cao",
    "activityDate": "2024-07-20",
    "points": 10.0,
    "evidenceUrl": "https://example.com/evidence/summer2024.jpg",
    "semester": "2024-2025-HK1",
    "studentCode": "N21DCCN001",
    "studentName": "Nguyễn Văn An"
  },
  "timestamp": "2024-11-17T10:30:00"
}
```

---

### 5. Update Training Point
**PUT** `/api/training-points/{id}`

**Path Variable:**
- `id`: Training point ID

**Request Body:** (All fields optional)
```json
{
  "activityName": "Tham gia tình nguyện mùa hè xanh 2024",
  "points": 12.0,
  "evidenceUrl": "https://example.com/evidence/updated.jpg"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Training point updated successfully",
  "data": {
    "id": 2,
    "activityName": "Tham gia tình nguyện mùa hè xanh 2024",
    "description": "Hoạt động tình nguyện tại vùng cao",
    "activityDate": "2024-07-20",
    "points": 12.0,
    "evidenceUrl": "https://example.com/evidence/updated.jpg",
    "semester": "2024-2025-HK1",
    "studentCode": "N21DCCN001",
    "studentName": "Nguyễn Văn An"
  },
  "timestamp": "2024-11-17T10:30:00"
}
```

---

### 6. Delete Training Point
**DELETE** `/api/training-points/{id}`

**Path Variable:**
- `id`: Training point ID

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Training point deleted successfully",
  "data": null,
  "timestamp": "2024-11-17T10:30:00"
}
```

---

### 7. Calculate Total Points by Student
**GET** `/api/training-points/student/{studentCode}/total`

**Path Variable:**
- `studentCode`: Mã sinh viên

**Query Parameters:**
- `semester` (optional): Calculate for specific semester

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Total points calculated successfully",
  "data": {
    "studentCode": "B21DCCN001",
    "studentName": "Nguyễn Văn An",
    "semester": "2024-2025-HK1",
    "totalPoints": 25.0,
    "activityCount": 3
  },
  "timestamp": "2024-11-17T10:30:00"
}
```

---

## Implementation Plan

### Step 1: Exception Handling
- Create custom exceptions
- Global exception handler

### Step 2: Response Wrapper
- Create ApiResponse wrapper class

### Step 3: Mapper Utilities
- Create StudentMapper
- Create TrainingPointMapper

### Step 4: Service Layer
- StudentService with business logic
- TrainingPointService with business logic

### Step 5: Controller Layer
- Update StudentController
- Create TrainingPointController

### Step 6: Testing
- Test each endpoint with Postman
- Verify validation
- Verify error handling

---

## Testing Checklist

### Student API Tests
- [ ] GET all students (empty)
- [ ] POST create student (success)
- [ ] POST create student (validation error)
- [ ] POST create student (duplicate error)
- [ ] GET student by code (success)
- [ ] GET student by code (not found)
- [ ] PUT update student (success)
- [ ] PUT update student (not found)
- [ ] DELETE student (success)
- [ ] DELETE student (not found)
- [ ] GET all students (with filters)

### TrainingPoint API Tests
- [ ] GET all training points (empty)
- [ ] POST create training point (success)
- [ ] POST create training point (validation error)
- [ ] POST create training point (student not found)
- [ ] GET training point by id (success)
- [ ] GET training point by id (not found)
- [ ] GET by student code (success)
- [ ] PUT update training point (success)
- [ ] DELETE training point (success)
- [ ] GET total points by student

---

## Next Steps

After reviewing this API design:

1. **Implement Step 1**: Exception handling + Response wrapper
2. **Test**: Verify error responses work
3. **Implement Step 2**: Mapper utilities
4. **Test**: Verify mapping works
5. **Implement Step 3**: StudentService + Controller
6. **Test**: All Student endpoints
7. **Implement Step 4**: TrainingPointService + Controller
8. **Test**: All TrainingPoint endpoints

Each step will be small and testable independently.

