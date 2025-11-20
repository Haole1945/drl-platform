# DRL Platform - API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:8080/api` (via Gateway)  
**Date:** November 18, 2024

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Auth Service](#auth-service)
   - [Student Service](#student-service)
   - [Evaluation Service](#evaluation-service)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Swagger UI Access](#swagger-ui-access)

---

## Overview

DRL Platform là hệ thống đánh giá điểm rèn luyện cho sinh viên, được xây dựng theo kiến trúc microservices với Spring Boot và Next.js.

### Architecture

```
Frontend (Next.js) → Gateway (Spring Cloud Gateway) → Services
                                                      ├── Auth Service
                                                      ├── Student Service
                                                      └── Evaluation Service
```

### Base URLs

- **Gateway:** `http://localhost:8080`
- **Auth Service:** `http://localhost:8082` (direct) hoặc `http://localhost:8080/api/auth` (via Gateway)
- **Student Service:** `http://localhost:8081` (direct) hoặc `http://localhost:8080/api/students` (via Gateway)
- **Evaluation Service:** `http://localhost:8083` (direct) hoặc `http://localhost:8080/api/evaluations` (via Gateway)

### Swagger UI

Mỗi service có Swagger UI riêng:
- **Auth Service:** `http://localhost:8082/swagger-ui.html`
- **Student Service:** `http://localhost:8081/swagger-ui.html`
- **Evaluation Service:** `http://localhost:8083/swagger-ui.html`

---

## Authentication

Hệ thống sử dụng JWT (JSON Web Token) cho authentication.

### Authentication Flow

1. **Request Password** (lần đầu): `POST /api/auth/request-password`
2. **Login:** `POST /api/auth/login`
3. **Use Token:** Thêm header `Authorization: Bearer <token>` vào các request

### Request Password

**Endpoint:** `POST /api/auth/request-password`

**Request Body:**
```json
{
  "email": "n21dccn001@student.ptithcm.edu.vn"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password sent to email",
  "data": null
}
```

**Note:** Hệ thống sẽ tự động tạo tài khoản nếu chưa tồn tại và gửi mật khẩu ngẫu nhiên qua email.

### Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

Hoặc có thể dùng email:
```json
{
  "username": "admin@ptit.edu.vn",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "refreshExpiresIn": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@ptit.edu.vn",
      "fullName": "Administrator",
      "roles": ["ADMIN"],
      "permissions": ["EVALUATION:READ_ALL", "STUDENT:CREATE", ...],
      "isActive": true
    }
  }
}
```

### Using JWT Token

Thêm header vào mọi request (trừ public endpoints):
```
Authorization: Bearer <accessToken>
```

---

## API Endpoints

### Auth Service

Base Path: `/api/auth`

#### 1. Request Password
- **Method:** `POST`
- **Path:** `/api/auth/request-password`
- **Auth:** Not required
- **Description:** Yêu cầu mật khẩu mới (tự động tạo tài khoản nếu chưa có)

#### 2. Login
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Auth:** Not required
- **Description:** Đăng nhập và nhận JWT token

#### 3. Get Current User
- **Method:** `GET`
- **Path:** `/api/auth/me`
- **Auth:** Required
- **Description:** Lấy thông tin user hiện tại

#### 4. Refresh Token
- **Method:** `POST`
- **Path:** `/api/auth/refresh`
- **Auth:** Not required (cần refreshToken)
- **Description:** Làm mới access token

---

### Student Service

Base Path: `/api/students`

#### 1. Get All Students
- **Method:** `GET`
- **Path:** `/api/students`
- **Auth:** Required
- **Query Parameters:**
  - `page` (int, default: 0): Số trang
  - `size` (int, default: 20): Số lượng mỗi trang
  - `facultyCode` (string, optional): Lọc theo mã khoa
  - `majorCode` (string, optional): Lọc theo mã ngành
  - `classCode` (string, optional): Lọc theo mã lớp
- **Response:** Paginated list of students

#### 2. Get Student by Code
- **Method:** `GET`
- **Path:** `/api/students/{studentCode}`
- **Auth:** Required
- **Description:** Lấy thông tin chi tiết sinh viên

#### 3. Create Student
- **Method:** `POST`
- **Path:** `/api/students`
- **Auth:** Required (ADMIN or INSTRUCTOR)
- **Request Body:** Student creation data
- **Response:** Created student

#### 4. Update Student
- **Method:** `PUT`
- **Path:** `/api/students/{studentCode}`
- **Auth:** Required (ADMIN or INSTRUCTOR)
- **Request Body:** Student update data
- **Response:** Updated student

#### 5. Delete Student
- **Method:** `DELETE`
- **Path:** `/api/students/{studentCode}`
- **Auth:** Required (ADMIN only)
- **Response:** Success message

---

### Training Points API

Base Path: `/api/training-points`

#### 1. Get All Training Points
- **Method:** `GET`
- **Path:** `/api/training-points`
- **Auth:** Required
- **Query Parameters:** `page`, `size`
- **Response:** Paginated list of training points

#### 2. Get Training Point by ID
- **Method:** `GET`
- **Path:** `/api/training-points/{id}`
- **Auth:** Required
- **Response:** Training point details

#### 3. Get Training Points by Student
- **Method:** `GET`
- **Path:** `/api/training-points/student/{studentCode}`
- **Auth:** Required
- **Response:** List of training points for student

#### 4. Get Total Training Points
- **Method:** `GET`
- **Path:** `/api/training-points/student/{studentCode}/total`
- **Auth:** Required
- **Response:** Total points for student

#### 5. Create Training Point
- **Method:** `POST`
- **Path:** `/api/training-points`
- **Auth:** Required
- **Request Body:** Training point data
- **Response:** Created training point

#### 6. Update Training Point
- **Method:** `PUT`
- **Path:** `/api/training-points/{id}`
- **Auth:** Required
- **Request Body:** Training point update data
- **Response:** Updated training point

#### 7. Delete Training Point
- **Method:** `DELETE`
- **Path:** `/api/training-points/{id}`
- **Auth:** Required
- **Response:** Success message

---

### Evaluation Service

Base Path: `/api/evaluations`

#### 1. Get All Evaluations
- **Method:** `GET`
- **Path:** `/api/evaluations`
- **Auth:** Required
- **Query Parameters:**
  - `studentCode` (string, optional): Lọc theo mã sinh viên
  - `semester` (string, optional): Lọc theo học kỳ
  - `status` (string, optional): Lọc theo trạng thái
  - `page` (int, default: 0)
  - `size` (int, default: 20)
- **Response:** Paginated list of evaluations

#### 2. Get Evaluation by ID
- **Method:** `GET`
- **Path:** `/api/evaluations/{id}`
- **Auth:** Required
- **Response:** Evaluation details

#### 3. Get Evaluations by Student
- **Method:** `GET`
- **Path:** `/api/evaluations/student/{studentCode}`
- **Auth:** Required
- **Query Parameters:** `semester` (optional)
- **Response:** List of evaluations for student

#### 4. Get Pending Evaluations
- **Method:** `GET`
- **Path:** `/api/evaluations/pending`
- **Auth:** Required (Approver roles)
- **Query Parameters:**
  - `level` (string, optional): CLASS, FACULTY, CTSV
  - `page` (int, default: 0)
  - `size` (int, default: 20)
- **Response:** Paginated list of pending evaluations

#### 5. Create Evaluation
- **Method:** `POST`
- **Path:** `/api/evaluations`
- **Auth:** Required (STUDENT)
- **Request Body:**
```json
{
  "studentCode": "N21DCCN001",
  "semester": "2024-2025-HK1",
  "academicYear": "2024-2025",
  "rubricId": 1,
  "details": [
    {
      "criteriaId": 1,
      "score": 15.0,
      "evidence": "Bằng chứng...",
      "note": "Ghi chú..."
    }
  ]
}
```
- **Response:** Created evaluation (status: DRAFT)

#### 6. Update Evaluation
- **Method:** `PUT`
- **Path:** `/api/evaluations/{id}`
- **Auth:** Required (Owner only)
- **Description:** Chỉ có thể update khi status = DRAFT
- **Request Body:** Same as create (details only)

#### 7. Submit Evaluation
- **Method:** `POST`
- **Path:** `/api/evaluations/{id}/submit`
- **Auth:** Required (Owner only)
- **Description:** Nộp đánh giá để duyệt (DRAFT → SUBMITTED)

#### 8. Approve Evaluation
- **Method:** `POST`
- **Path:** `/api/evaluations/{id}/approve`
- **Auth:** Required (Approver roles)
- **Request Body:**
```json
{
  "comment": "Đã duyệt"
}
```
- **Description:** Duyệt đánh giá (chuyển sang cấp tiếp theo)

#### 9. Reject Evaluation
- **Method:** `POST`
- **Path:** `/api/evaluations/{id}/reject`
- **Auth:** Required (Approver roles)
- **Request Body:**
```json
{
  "reason": "Thiếu bằng chứng cho tiêu chí X"
}
```
- **Description:** Từ chối đánh giá (chuyển về REJECTED)

#### 10. Resubmit Evaluation
- **Method:** `POST`
- **Path:** `/api/evaluations/{id}/resubmit`
- **Auth:** Required (Owner only)
- **Description:** Nộp lại sau khi bị từ chối (REJECTED → SUBMITTED)
- **Request Body:**
```json
{
  "details": [...],
  "responseToRejection": "Đã bổ sung bằng chứng..."
}
```

---

### Rubric API

Base Path: `/api/rubrics`

#### 1. Get All Rubrics
- **Method:** `GET`
- **Path:** `/api/rubrics`
- **Auth:** Required
- **Response:** List of rubrics

#### 2. Get Rubric by ID
- **Method:** `GET`
- **Path:** `/api/rubrics/{id}`
- **Auth:** Required
- **Response:** Rubric with criteria

#### 3. Get Active Rubric
- **Method:** `GET`
- **Path:** `/api/rubrics/active`
- **Auth:** Required
- **Query Parameters:** `academicYear` (optional)
- **Response:** Active rubric

#### 4. Create Rubric
- **Method:** `POST`
- **Path:** `/api/rubrics`
- **Auth:** Required (ADMIN)
- **Request Body:** Rubric data
- **Response:** Created rubric

#### 5. Update Rubric
- **Method:** `PUT`
- **Path:** `/api/rubrics/{id}`
- **Auth:** Required (ADMIN)
- **Request Body:** Rubric update data
- **Response:** Updated rubric

#### 6. Activate Rubric
- **Method:** `POST`
- **Path:** `/api/rubrics/{id}/activate`
- **Auth:** Required (ADMIN)
- **Description:** Kích hoạt rubric (deactivate các rubric khác)

#### 7. Deactivate Rubric
- **Method:** `POST`
- **Path:** `/api/rubrics/{id}/deactivate`
- **Auth:** Required (ADMIN)
- **Description:** Vô hiệu hóa rubric

---

### Criteria API

Base Path: `/api/criteria`

#### 1. Get Criteria by Rubric
- **Method:** `GET`
- **Path:** `/api/criteria?rubricId={id}`
- **Auth:** Required
- **Response:** List of criteria for rubric

#### 2. Get Criteria by ID
- **Method:** `GET`
- **Path:** `/api/criteria/{id}`
- **Auth:** Required
- **Response:** Criteria details

#### 3. Create Criteria
- **Method:** `POST`
- **Path:** `/api/criteria`
- **Auth:** Required (ADMIN)
- **Request Body:** Criteria data
- **Response:** Created criteria

#### 4. Update Criteria
- **Method:** `PUT`
- **Path:** `/api/criteria/{id}`
- **Auth:** Required (ADMIN)
- **Request Body:** Criteria update data
- **Response:** Updated criteria

#### 5. Delete Criteria
- **Method:** `DELETE`
- **Path:** `/api/criteria/{id}`
- **Auth:** Required (ADMIN)
- **Response:** Success message

---

## Data Models

### Student

```json
{
  "studentCode": "N21DCCN001",
  "fullName": "Nguyễn Văn An",
  "dateOfBirth": "2003-05-15",
  "gender": "MALE",
  "phone": "0123456789",
  "address": "Hà Nội",
  "academicYear": "2024-2025",
  "position": "CLASS_MONITOR",
  "className": "D21CQCN01-N",
  "classCode": "D21CQCN01-N",
  "majorName": "Công nghệ thông tin",
  "majorCode": "CN",
  "facultyName": "Khoa CNTT2",
  "facultyCode": "CNTT2"
}
```

### Evaluation

```json
{
  "id": 1,
  "studentCode": "N21DCCN001",
  "studentName": "Nguyễn Văn An",
  "semester": "2024-2025-HK1",
  "academicYear": "2024-2025",
  "status": "SUBMITTED",
  "totalScore": 85.5,
  "maxScore": 100.0,
  "rubricId": 1,
  "rubricName": "Phiếu đánh giá Kết quả Rèn luyện",
  "details": [
    {
      "id": 1,
      "criteriaId": 1,
      "criteriaName": "Đánh giá về ý thức tham gia học tập",
      "score": 18.0,
      "maxScore": 20.0,
      "evidence": "Bằng chứng...",
      "note": "Ghi chú..."
    }
  ],
  "rejectionReason": null,
  "resubmissionCount": 0,
  "submittedAt": "2024-11-18",
  "approvedAt": null,
  "createdAt": "2024-11-18T10:00:00",
  "updatedAt": "2024-11-18T10:00:00"
}
```

### Evaluation Status

- `DRAFT`: Nháp (có thể chỉnh sửa)
- `SUBMITTED`: Đã nộp (chờ duyệt cấp lớp)
- `CLASS_APPROVED`: Lớp đã duyệt (chờ duyệt cấp khoa)
- `FACULTY_APPROVED`: Khoa đã duyệt (chờ duyệt cấp CTSV)
- `CTSV_APPROVED`: CTSV đã duyệt (hoàn thành)
- `REJECTED`: Bị từ chối (có thể nộp lại)

### Rubric

```json
{
  "id": 1,
  "name": "Phiếu đánh giá Kết quả Rèn luyện",
  "description": "Bảng tiêu chí đánh giá điểm rèn luyện năm học 2024-2025",
  "maxScore": 100.0,
  "academicYear": "2024-2025",
  "isActive": true,
  "criteria": [
    {
      "id": 1,
      "name": "Đánh giá về ý thức tham gia học tập",
      "description": "...",
      "maxPoints": 20.0,
      "orderIndex": 1
    }
  ]
}
```

### Criteria

```json
{
  "id": 1,
  "name": "Đánh giá về ý thức tham gia học tập",
  "description": "Bao gồm: Ý thức và thái độ (3đ), Kết quả học tập (10đ)...",
  "maxPoints": 20.0,
  "orderIndex": 1,
  "rubricId": 1,
  "rubricName": "Phiếu đánh giá Kết quả Rèn luyện"
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error message",
  "timestamp": "2024-11-18T10:00:00",
  "errors": ["Validation error 1", "Validation error 2"]
}
```

### HTTP Status Codes

- `200 OK`: Request thành công
- `201 Created`: Tạo mới thành công
- `400 Bad Request`: Dữ liệu không hợp lệ
- `401 Unauthorized`: Chưa đăng nhập hoặc token hết hạn
- `403 Forbidden`: Không có quyền truy cập
- `404 Not Found`: Không tìm thấy resource
- `409 Conflict`: Xung đột dữ liệu (ví dụ: username đã tồn tại)
- `500 Internal Server Error`: Lỗi server

### Common Error Messages

- `"Missing authorization header"`: Thiếu JWT token
- `"Invalid or expired token"`: Token không hợp lệ hoặc hết hạn
- `"Access Denied"`: Không có quyền thực hiện action này
- `"Resource not found"`: Không tìm thấy resource
- `"Invalid state transition"`: Không thể chuyển trạng thái (ví dụ: approve evaluation ở trạng thái DRAFT)

---

## Swagger UI Access

### Direct Service Access

Mỗi service có Swagger UI riêng, truy cập trực tiếp:

1. **Auth Service:**
   - Swagger UI: `http://localhost:8082/swagger-ui.html`
   - OpenAPI JSON: `http://localhost:8082/v3/api-docs`

2. **Student Service:**
   - Swagger UI: `http://localhost:8081/swagger-ui.html`
   - OpenAPI JSON: `http://localhost:8081/v3/api-docs`

3. **Evaluation Service:**
   - Swagger UI: `http://localhost:8083/swagger-ui.html`
   - OpenAPI JSON: `http://localhost:8083/v3/api-docs`

### Via Gateway

Tất cả endpoints có thể truy cập qua Gateway tại `http://localhost:8080/api/*`

### Testing with Swagger UI

1. Mở Swagger UI của service cần test
2. Click "Authorize" button
3. Nhập JWT token: `Bearer <your-token>`
4. Test các endpoints trực tiếp trên Swagger UI

---

## Role-Based Access Control

### Roles

- `STUDENT`: Sinh viên thường
- `CLASS_MONITOR`: Lớp trưởng (có thể duyệt cấp lớp)
- `UNION_REPRESENTATIVE`: Đại diện đoàn (có thể duyệt cấp lớp)
- `ADVISOR`: Cố vấn học tập (duyệt cấp lớp)
- `FACULTY_INSTRUCTOR`: Giáo viên khoa (duyệt cấp khoa)
- `CTSV_STAFF`: Nhân viên CTSV (duyệt cấp CTSV)
- `INSTITUTE_COUNCIL`: Hội đồng Học viện (chốt điểm)
- `INSTRUCTOR`: Giảng viên (tương thích)
- `ADMIN`: Quản trị viên (toàn quyền)

### Permissions

- `EVALUATION:READ_ALL`: Xem tất cả đánh giá
- `EVALUATION:APPROVE`: Duyệt đánh giá
- `EVALUATION:REJECT`: Từ chối đánh giá
- `STUDENT:READ_ALL`: Xem tất cả sinh viên
- `STUDENT:CREATE`: Tạo sinh viên
- `STUDENT:DELETE`: Xóa sinh viên
- `RUBRIC:MANAGE`: Quản lý rubric
- `CRITERIA:MANAGE`: Quản lý tiêu chí
- `USER:MANAGE`: Quản lý người dùng
- `SYSTEM:MANAGE`: Quản lý hệ thống

---

## Test Accounts

### Admin
- **Username:** `admin`
- **Password:** `Admin123!`
- **Roles:** ADMIN

### Student
- **Username:** `student`
- **Password:** `Student123!`
- **Student Code:** N21DCCN002
- **Roles:** STUDENT

### Class Monitor
- **Username:** `classmonitor`
- **Password:** `Monitor123!`
- **Student Code:** N21DCCN001
- **Roles:** STUDENT, CLASS_MONITOR

### Union Representative
- **Username:** `unionrep`
- **Password:** `Union123!`
- **Student Code:** N21DCCN050
- **Roles:** STUDENT, UNION_REPRESENTATIVE

### Advisor
- **Username:** `advisor`
- **Password:** `Advisor123!`
- **Roles:** ADVISOR

### Faculty Instructor
- **Username:** `faculty`
- **Password:** `Faculty123!`
- **Roles:** FACULTY_INSTRUCTOR

### CTSV Staff
- **Username:** `ctsv`
- **Password:** `Ctsv123!`
- **Roles:** CTSV_STAFF

### Institute Council
- **Username:** `council`
- **Password:** `Council123!`
- **Roles:** INSTITUTE_COUNCIL

---

## Notes

- Tất cả timestamps sử dụng ISO 8601 format
- Tất cả dates sử dụng `YYYY-MM-DD` format
- JWT token có thời hạn 1 giờ (accessToken) và 24 giờ (refreshToken)
- Gateway tự động route requests đến các services dựa trên path
- CORS đã được cấu hình cho frontend tại `http://localhost:3000`

---

**Last Updated:** November 18, 2024  
**Documentation Version:** 1.0.0

