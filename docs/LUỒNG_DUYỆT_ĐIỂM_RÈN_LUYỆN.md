# 🔄 Luồng Hoạt Động Duyệt Điểm Rèn Luyện

## 📊 Tổng Quan Workflow

```
┌─────────┐
│  DRAFT  │ ← Sinh viên tạo và chỉnh sửa
└────┬────┘
     │ Submit
     ↓
┌─────────────┐
│  SUBMITTED  │ ← Chờ duyệt cấp LỚP
└──────┬──────┘
       │ (Cả 2 người approve)
       ↓
┌─────────────────┐
│ CLASS_APPROVED  │ ← Chờ duyệt cấp CỐ VẤN
└────────┬────────┘
         │ Approve
         ↓
┌──────────────────┐
│ ADVISOR_APPROVED │ ← Chờ duyệt cấp KHOA
└────────┬─────────┘
         │ Approve
         ↓
┌──────────────────┐
│ FACULTY_APPROVED │ ✅ HOÀN TẤT
└──────────────────┘
```

## 📋 Chi Tiết Từng Bước

### 1️⃣ **DRAFT** - Sinh viên tạo và chỉnh sửa

**Trạng thái:** `DRAFT`

**Người thực hiện:** 
- **STUDENT** (Sinh viên)

**Hành động:**
- Tạo đánh giá mới
- Chỉnh sửa điểm, thêm bằng chứng
- Lưu nháp (có thể lưu nhiều lần)

**Quy tắc:**
- ✅ Chỉ có thể chỉnh sửa khi status = `DRAFT`
- ✅ Có thể xóa đánh giá (nếu chưa submit)
- ✅ Có thể submit khi đã điền đủ thông tin

**API:**
- `POST /api/evaluations` - Tạo mới
- `PUT /api/evaluations/{id}` - Cập nhật (chỉ khi DRAFT)
- `POST /api/evaluations/{id}/submit` - Nộp đánh giá

---

### 2️⃣ **SUBMITTED** - Chờ duyệt cấp LỚP

**Trạng thái:** `SUBMITTED`

**Người duyệt:**
- **CLASS_MONITOR** (Lớp trưởng) - **BẮT BUỘC**

**Cơ chế:**
- Chỉ cần Lớp trưởng approve
- Approval được lưu vào bảng `class_approvals` với:
  - `evaluation_id`
  - `approver_id` (user ID)
  - `approver_role` (CLASS_MONITOR)
  - `comment` (nếu có)
  - `created_at`

**Logic tự động:**
- Khi **CLASS_MONITOR** approve → Tự động chuyển sang `CLASS_APPROVED`

**Thông báo:**
- ✅ Gửi notification cho CLASS_MONITOR và ADVISOR của lớp
- ✅ Gửi notification cho sinh viên: "Đánh giá đã được nộp"

**API:**
- `POST /api/evaluations/{id}/approve` - Duyệt (với role CLASS_MONITOR)

---

### 3️⃣ **CLASS_APPROVED** - Chờ duyệt cấp CỐ VẤN

**Trạng thái:** `CLASS_APPROVED`

**Người duyệt:**
- **ADVISOR** (Cố vấn học tập)

**Cơ chế:**
- Chỉ cần 1 người duyệt (ADVISOR)
- Khi approve → Chuyển sang `ADVISOR_APPROVED`

**Thông báo:**
- ✅ Gửi notification cho ADVISOR của lớp
- ✅ Gửi notification cho sinh viên: "Đánh giá đã được duyệt cấp lớp"

**API:**
- `POST /api/evaluations/{id}/approve` - Duyệt (với role ADVISOR)

---

### 4️⃣ **ADVISOR_APPROVED** - Chờ duyệt cấp KHOA

**Trạng thái:** `ADVISOR_APPROVED`

**Người duyệt:**
- **FACULTY_INSTRUCTOR** (Giảng viên khoa)

**Cơ chế:**
- Chỉ cần 1 người duyệt (FACULTY_INSTRUCTOR)
- Khi approve → Chuyển sang `FACULTY_APPROVED` (FINAL)

**Thông báo:**
- ✅ Gửi notification cho FACULTY_INSTRUCTOR của khoa
- ✅ Gửi notification cho sinh viên: "Đánh giá đã được duyệt cấp cố vấn"

**API:**
- `POST /api/evaluations/{id}/approve` - Duyệt (với role FACULTY_INSTRUCTOR)

---

### 5️⃣ **FACULTY_APPROVED** - Hoàn tất ✅

**Trạng thái:** `FACULTY_APPROVED`

**Đặc điểm:**
- ✅ **TRẠNG THÁI CUỐI CÙNG** - Không thể thay đổi
- ✅ Điểm rèn luyện đã được duyệt chính thức
- ✅ Có thể xem lịch sử duyệt đầy đủ

**Thông báo:**
- ✅ Gửi notification cho sinh viên: "Đánh giá đã được duyệt hoàn tất"

---

## ❌ Rejection (Từ chối)

### Có thể reject ở bất kỳ level nào:

**Trạng thái:** `REJECTED`

**Người có thể reject:**
- CLASS_MONITOR / UNION_REPRESENTATIVE (khi SUBMITTED)
- ADVISOR (khi CLASS_APPROVED)
- FACULTY_INSTRUCTOR (khi ADVISOR_APPROVED)

**Quy tắc:**
- ✅ Phải cung cấp `reason` (lý do từ chối)
- ✅ Lý do được lưu vào `evaluation.rejection_reason`
- ✅ Lịch sử reject được lưu vào `evaluation_history`

**API:**
- `POST /api/evaluations/{id}/reject` - Từ chối (body: `{ "reason": "..." }`)

---

## 🔄 Resubmission (Nộp lại)

**Trạng thái:** `REJECTED` → `SUBMITTED` / `CLASS_APPROVED` / `ADVISOR_APPROVED`

**Cơ chế Smart Resubmit:**
- Nếu reject ở **CLASS** → Resubmit → Quay lại `SUBMITTED` (cần cả 2 approve lại)
- Nếu reject ở **ADVISOR** → Resubmit → Skip CLASS, đi thẳng `CLASS_APPROVED`
- Nếu reject ở **FACULTY** → Resubmit → Skip CLASS & ADVISOR, đi thẳng `ADVISOR_APPROVED`

**Quy tắc:**
- ✅ Sinh viên có thể xem lý do reject
- ✅ Sinh viên có thể chỉnh sửa và nộp lại
- ✅ `resubmission_count` được tăng lên mỗi lần resubmit

**API:**
- `POST /api/evaluations/{id}/resubmit` - Nộp lại (body: `{ "details": [...], "responseToRejection": "..." }`)

---

## 📊 Lịch Sử Duyệt (Evaluation History)

**Bảng:** `evaluation_history`

**Lưu trữ:**
- Tất cả các hành động: SUBMITTED, APPROVED, REJECTED, RESUBMITTED
- `from_status` → `to_status`
- `level`: CLASS, ADVISOR, FACULTY
- `actor_id`: User ID người thực hiện
- `actor_name`: Tên người thực hiện (cached)
- `comment`: Lý do/ghi chú
- `created_at`: Thời gian

**Xem lịch sử:**
- API trả về `approvalHistory` trong EvaluationDTO
- Frontend hiển thị timeline của quá trình duyệt

---

## 🔔 Hệ Thống Thông Báo

### Khi nào gửi notification:

1. **Sinh viên nộp (SUBMITTED):**
   - ✅ Gửi cho CLASS_MONITOR, UNION_REPRESENTATIVE, ADVISOR của lớp
   - ✅ Gửi cho sinh viên: "Đánh giá đã được nộp"

2. **Duyệt cấp LỚP (CLASS_APPROVED):**
   - ✅ Gửi cho ADVISOR
   - ✅ Gửi cho sinh viên: "Đánh giá đã được duyệt cấp lớp"

3. **Duyệt cấp CỐ VẤN (ADVISOR_APPROVED):**
   - ✅ Gửi cho FACULTY_INSTRUCTOR
   - ✅ Gửi cho sinh viên: "Đánh giá đã được duyệt cấp cố vấn"

4. **Duyệt cấp KHOA (FACULTY_APPROVED):**
   - ✅ Gửi cho sinh viên: "Đánh giá đã được duyệt hoàn tất"

5. **Từ chối (REJECTED):**
   - ✅ Gửi cho sinh viên: "Đánh giá đã bị từ chối" (kèm lý do)

### Loại notification:
- `EVALUATION_SUBMITTED` - Sinh viên nộp
- `EVALUATION_NEEDS_REVIEW` - Cần duyệt
- `EVALUATION_APPROVED` - Đã duyệt
- `EVALUATION_REJECTED` - Bị từ chối

---

## 🎯 Tóm Tắt

### Thứ tự duyệt:
1. **LỚP** (CLASS_MONITOR) - Chỉ cần Lớp trưởng duyệt
2. **CỐ VẤN HỌC TẬP** (ADVISOR) - 1 người duyệt
3. **KHOA** (FACULTY_INSTRUCTOR) - 1 người duyệt (Final)

### Đặc điểm:
- ✅ Cấp LỚP chỉ cần Lớp trưởng duyệt (track trong `class_approvals`)
- ✅ 3 cấp duyệt tuần tự
- ✅ Smart resubmit (skip levels đã pass)
- ✅ Lịch sử đầy đủ mọi hành động
- ✅ Thông báo tự động cho tất cả bên liên quan

### Trạng thái:
- `DRAFT` → Chỉnh sửa
- `SUBMITTED` → Chờ duyệt lớp
- `CLASS_APPROVED` → Chờ duyệt cố vấn
- `ADVISOR_APPROVED` → Chờ duyệt khoa
- `FACULTY_APPROVED` → Hoàn tất ✅
- `REJECTED` → Bị từ chối (có thể resubmit)

---

## 📝 Ghi Chú Kỹ Thuật

### Database Tables:
- `evaluations` - Bảng đánh giá chính
- `evaluation_history` - Lịch sử duyệt
- `class_approvals` - Track approvals của CLASS_MONITOR và UNION_REPRESENTATIVE
- `notifications` - Thông báo cho users

### Services:
- `evaluation-service` - Quản lý workflow
- `auth-service` - Xác thực và lấy danh sách reviewers theo role
- `student-service` - Lấy thông tin sinh viên (classCode, facultyCode)

### Roles:
- `STUDENT` - Sinh viên
- `CLASS_MONITOR` - Lớp trưởng
- `ADVISOR` - Cố vấn học tập
- `FACULTY_INSTRUCTOR` - Giảng viên khoa

