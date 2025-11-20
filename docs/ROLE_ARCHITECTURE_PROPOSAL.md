# Đề xuất Phân chia Role cho Hệ thống DRL Platform

## 🎯 Vấn đề Hiện tại

Hệ thống hiện tại chỉ có **3 role cơ bản:**
- `STUDENT` - Sinh viên
- `INSTRUCTOR` - Giảng viên/Cố vấn
- `ADMIN` - Quản trị viên

**Nhưng quy trình thực tế phức tạp hơn:**
- Cấp lớp: Lớp trưởng, Cố vấn học tập
- Cấp khoa: Giáo viên bên khoa
- Cấp CTSV: Phòng CTSV
- Cấp Học viện: Hội đồng Học viện

---

## 💡 Đề xuất Giải pháp

### Phương án 1: Mở rộng Role (Recommended)

**Thêm các role mới để phản ánh đúng quy trình:**

#### 1. Role cho Sinh viên
- `STUDENT` - Sinh viên thường
- `CLASS_MONITOR` - Lớp trưởng (có thể duyệt cấp lớp)
- `UNION_REPRESENTATIVE` - Đại diện bên đoàn (có thể duyệt cấp lớp)

**Lưu ý:** Role này có thể được gán tự động dựa trên field `position` trong bảng `students`.

#### 2. Role cho Giáo viên/Cán bộ
- `ADVISOR` - Cố vấn học tập (duyệt cấp lớp)
- `FACULTY_INSTRUCTOR` - Giáo viên bên khoa (duyệt cấp khoa)
- `CTSV_STAFF` - Nhân viên phòng CTSV (duyệt cấp CTSV)
- `INSTITUTE_COUNCIL` - Hội đồng Học viện (chốt điểm và khóa sổ)

#### 3. Role Quản trị
- `ADMIN` - Quản trị viên hệ thống (toàn quyền)

### Phương án 2: Role + Permission (Linh hoạt hơn)

**Giữ ít role nhưng dùng Permission để phân quyền chi tiết:**

#### Roles:
- `STUDENT` - Sinh viên
- `INSTRUCTOR` - Giảng viên/Cán bộ
- `ADMIN` - Quản trị viên

#### Permissions mới:
- `APPROVE_CLASS_LEVEL` - Duyệt cấp lớp
- `APPROVE_FACULTY_LEVEL` - Duyệt cấp khoa
- `APPROVE_CTSV_LEVEL` - Duyệt cấp CTSV
- `APPROVE_INSTITUTE_LEVEL` - Chốt điểm và khóa sổ
- `VIEW_ALL_EVALUATIONS` - Xem tất cả đánh giá
- `MANAGE_STUDENTS` - Quản lý sinh viên
- `MANAGE_RUBRICS` - Quản lý rubric

**Cách gán:**
- `STUDENT` + `position = CLASS_MONITOR` → Gán thêm `APPROVE_CLASS_LEVEL`
- `INSTRUCTOR` + `faculty = X` → Gán `APPROVE_FACULTY_LEVEL` cho khoa đó
- `INSTRUCTOR` + `department = CTSV` → Gán `APPROVE_CTSV_LEVEL`

### Phương án 3: Hybrid (Kết hợp Role + Position + Department)

**Kết hợp nhiều yếu tố để xác định quyền:**

#### Roles (vẫn giữ đơn giản):
- `STUDENT`
- `INSTRUCTOR`
- `ADMIN`

#### Thêm thông tin vào User:
```java
@Column(name = "department") // Khoa/Phòng ban
private String department; // "CTSV", "CNTT2", "VT2", etc.

@Column(name = "faculty_code") // Mã khoa (cho instructor)
private String facultyCode;

@Column(name = "can_approve_class") // Có thể duyệt cấp lớp
private Boolean canApproveClass = false;

@Column(name = "can_approve_faculty") // Có thể duyệt cấp khoa
private Boolean canApproveFaculty = false;

@Column(name = "can_approve_ctsv") // Có thể duyệt cấp CTSV
private Boolean canApproveCtsv = false;
```

**Logic kiểm tra:**
- Nếu `role = STUDENT` + `student.position = CLASS_MONITOR` → `canApproveClass = true`
- Nếu `role = INSTRUCTOR` + `department = "CTSV"` → `canApproveCtsv = true`
- Nếu `role = INSTRUCTOR` + `facultyCode = "CNTT2"` → `canApproveFaculty = true` (chỉ cho khoa CNTT2)

---

## 🎯 Đề xuất: Phương án 1 (Mở rộng Role)

### Lý do:
1. ✅ Rõ ràng, dễ hiểu
2. ✅ Phản ánh đúng quy trình thực tế
3. ✅ Dễ implement và maintain
4. ✅ Dễ kiểm tra quyền (`hasRole('CLASS_MONITOR')`)

### Cấu trúc Role mới:

```
STUDENT (Sinh viên thường)
├── Chức năng: Tạo, sửa, nộp đánh giá
└── Không thể duyệt

CLASS_MONITOR (Lớp trưởng)
├── Chức năng: Tất cả của STUDENT
└── Thêm: Duyệt đánh giá cấp lớp (cho sinh viên trong lớp)

UNION_REPRESENTATIVE (Đại diện đoàn)
├── Chức năng: Tất cả của STUDENT
└── Thêm: Duyệt đánh giá cấp lớp (cho sinh viên trong lớp/khoa)

ADVISOR (Cố vấn học tập)
├── Chức năng: Duyệt đánh giá cấp lớp
├── Xem tất cả đánh giá trong lớp được phụ trách
└── Quản lý sinh viên trong lớp

FACULTY_INSTRUCTOR (Giáo viên khoa)
├── Chức năng: Duyệt đánh giá cấp khoa
├── Xem tất cả đánh giá trong khoa
└── Quản lý sinh viên trong khoa

CTSV_STAFF (Nhân viên CTSV)
├── Chức năng: Duyệt đánh giá cấp CTSV
├── Xem tất cả đánh giá trong học viện
└── Quản lý toàn bộ sinh viên

INSTITUTE_COUNCIL (Hội đồng Học viện)
├── Chức năng: Chốt điểm và khóa sổ
├── Xem tất cả đánh giá
└── Quản lý toàn bộ hệ thống

ADMIN (Quản trị viên)
└── Toàn quyền hệ thống
```

### Mapping với Quy trình:

| Cấp duyệt | Role có thể duyệt | Điều kiện |
|-----------|-------------------|-----------|
| **Cấp lớp** | `CLASS_MONITOR`, `UNION_REPRESENTATIVE`, `ADVISOR` | Phải cùng lớp với sinh viên |
| **Cấp khoa** | `FACULTY_INSTRUCTOR` | Phải cùng khoa với sinh viên |
| **Cấp CTSV** | `CTSV_STAFF` | Không giới hạn |
| **Chốt điểm** | `INSTITUTE_COUNCIL` | Không giới hạn |

---

## 🔧 Implementation Plan

### Bước 1: Thêm Role mới vào Database

```sql
INSERT INTO roles (name, description) VALUES
('CLASS_MONITOR', 'Lớp trưởng - Có thể duyệt đánh giá cấp lớp'),
('UNION_REPRESENTATIVE', 'Đại diện đoàn - Có thể duyệt đánh giá cấp lớp'),
('ADVISOR', 'Cố vấn học tập - Duyệt đánh giá cấp lớp'),
('FACULTY_INSTRUCTOR', 'Giáo viên khoa - Duyệt đánh giá cấp khoa'),
('CTSV_STAFF', 'Nhân viên CTSV - Duyệt đánh giá cấp CTSV'),
('INSTITUTE_COUNCIL', 'Hội đồng Học viện - Chốt điểm và khóa sổ');
```

### Bước 2: Tự động gán Role cho Sinh viên

Khi tạo user từ student:
```java
if (student.getPosition() == StudentPosition.CLASS_MONITOR) {
    Role classMonitorRole = roleRepository.findById("CLASS_MONITOR")
        .orElseThrow(...);
    user.addRole(classMonitorRole);
}
```

### Bước 3: Cập nhật Security Config

```java
@PreAuthorize("hasRole('CLASS_MONITOR') or hasRole('ADVISOR') or hasRole('UNION_REPRESENTATIVE')")
public ResponseEntity<?> approveClassLevel(...) { ... }

@PreAuthorize("hasRole('FACULTY_INSTRUCTOR')")
public ResponseEntity<?> approveFacultyLevel(...) { ... }

@PreAuthorize("hasRole('CTSV_STAFF')")
public ResponseEntity<?> approveCtsvLevel(...) { ... }

@PreAuthorize("hasRole('INSTITUTE_COUNCIL')")
public ResponseEntity<?> finalizeEvaluation(...) { ... }
```

### Bước 4: Thêm validation theo lớp/khoa

```java
// Kiểm tra lớp trưởng chỉ duyệt được sinh viên cùng lớp
if (user.hasRole("CLASS_MONITOR")) {
    Student monitor = user.getStudent();
    Student targetStudent = studentService.getByCode(evaluation.getStudentCode());
    if (!monitor.getStudentClass().equals(targetStudent.getStudentClass())) {
        throw new AccessDeniedException("Chỉ có thể duyệt sinh viên trong cùng lớp");
    }
}
```

---

## 📊 So sánh các Phương án

| Tiêu chí | Phương án 1 (Mở rộng Role) | Phương án 2 (Permission) | Phương án 3 (Hybrid) |
|----------|---------------------------|-------------------------|---------------------|
| **Độ rõ ràng** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Dễ implement** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Linh hoạt** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Dễ maintain** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## ✅ Kết luận

**Khuyến nghị: Phương án 1 (Mở rộng Role)**

**Lý do:**
1. Phản ánh đúng quy trình thực tế
2. Dễ hiểu và maintain
3. Dễ kiểm tra quyền trong code
4. Có thể kết hợp với `position` field trong Student để tự động gán role

**Bước tiếp theo:**
1. Thêm các role mới vào database
2. Cập nhật logic tự động gán role cho sinh viên (dựa trên `position`)
3. Cập nhật Security Config với các role mới
4. Thêm validation theo lớp/khoa khi duyệt
5. Cập nhật frontend để hiển thị đúng quyền

---

## 💭 Câu hỏi cần làm rõ

1. **Lớp trưởng có thể duyệt cho chính mình không?**
   - Đề xuất: Không, cần cố vấn hoặc lớp phó duyệt

2. **Cố vấn học tập có thể duyệt cho nhiều lớp không?**
   - Đề xuất: Có, nếu được gán phụ trách nhiều lớp

3. **Giáo viên khoa có thể duyệt cho tất cả sinh viên trong khoa không?**
   - Đề xuất: Có, nhưng nên có filter theo khoa

4. **Có cần phân biệt "Lớp trưởng" và "Lớp phó" không?**
   - Hiện tại có `VICE_MONITOR` trong enum, có thể gán role `CLASS_MONITOR` cho cả hai

