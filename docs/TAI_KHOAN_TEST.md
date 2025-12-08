# 📋 Tài Khoản Test - DRL Platform

## 🔐 Danh Sách Tài Khoản

### 1. **ADMIN** - Quản trị viên
- **Username:** `admin`
- **Password:** `Admin123!`
- **Email:** `admin@ptit.edu.vn`
- **Role:** `ADMIN`
- **Quyền:** Toàn quyền hệ thống

---

### 2. **STUDENT** - Sinh viên thường
- **Username:** `student`
- **Password:** `Student123!`
- **Email:** `n21dccn002@student.ptithcm.edu.vn`
- **Student Code:** `N21DCCN002`
- **Role:** `STUDENT`
- **Quyền:** 
  - Tạo và chỉnh sửa đánh giá điểm rèn luyện
  - Xem đánh giá của chính mình
  - Nộp đánh giá để duyệt

---

### 3. **CLASS_MONITOR** - Lớp trưởng
- **Username:** `classmonitor`
- **Password:** `Monitor123!`
- **Email:** `n21dccn001@student.ptithcm.edu.vn`
- **Student Code:** `N21DCCN001`
- **Roles:** `STUDENT`, `CLASS_MONITOR`
- **Quyền:**
  - Tất cả quyền của STUDENT
  - Xem đánh giá của lớp
  - **Duyệt đánh giá cấp lớp** (SUBMITTED → CLASS_APPROVED)
  - Từ chối đánh giá cấp lớp

---

### 4. **ADVISOR** - Cố vấn học tập
- **Username:** `advisor`
- **Password:** `Advisor123!`
- **Email:** `advisor@ptit.edu.vn`
- **Role:** `ADVISOR`
- **Quyền:**
  - Xem tất cả đánh giá
  - **Duyệt đánh giá cấp cố vấn** (CLASS_APPROVED → ADVISOR_APPROVED)
  - Từ chối đánh giá cấp cố vấn

---

### 5. **FACULTY_INSTRUCTOR** - Giáo viên khoa
- **Username:** `faculty`
- **Password:** `Faculty123!`
- **Email:** `faculty@ptit.edu.vn`
- **Role:** `FACULTY_INSTRUCTOR`
- **Quyền:**
  - Xem tất cả đánh giá
  - **Duyệt đánh giá cấp khoa** (ADVISOR_APPROVED → FACULTY_APPROVED) - **FINAL**
  - Từ chối đánh giá cấp khoa

---

## 🔄 Workflow Duyệt

```
STUDENT (student/Student123!)
  ↓ Nộp đánh giá
CLASS_MONITOR (classmonitor/Monitor123!)
  ↓ Duyệt cấp lớp
ADVISOR (advisor/Advisor123!)
  ↓ Duyệt cấp cố vấn
FACULTY_INSTRUCTOR (faculty/Faculty123!)
  ↓ Duyệt cấp khoa (Final)
✅ HOÀN TẤT
```

---

## 📝 Ghi Chú

- Tất cả tài khoản được tạo tự động khi chạy `DataSeeder` lần đầu
- Mật khẩu đều có format: `[Role]123!` (ví dụ: `Admin123!`, `Student123!`)
- Tài khoản `classmonitor` có cả 2 roles: `STUDENT` và `CLASS_MONITOR`
- **UNION_REPRESENTATIVE** đã bị xóa khỏi hệ thống

---

## 🚀 Sử Dụng

1. **Đăng nhập:** Truy cập `http://localhost:3000/login`
2. **Test workflow:** 
   - Đăng nhập với `student` → Tạo và nộp đánh giá
   - Đăng nhập với `classmonitor` → Duyệt cấp lớp
   - Đăng nhập với `advisor` → Duyệt cấp cố vấn
   - Đăng nhập với `faculty` → Duyệt cấp khoa (final)

---

## ⚠️ Lưu Ý

- Các tài khoản này chỉ dùng cho **môi trường development/test**
- **KHÔNG** sử dụng trong production
- Nếu database đã có dữ liệu, DataSeeder sẽ không chạy (kiểm tra `roleRepository.count() > 0`)

