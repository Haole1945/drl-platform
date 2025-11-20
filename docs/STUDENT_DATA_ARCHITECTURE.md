# Student Data Architecture - Should You Pre-load All Students?

## Câu hỏi

**Có cần lưu tất cả thông tin học sinh trong database không?**

## Phân tích các phương án

### Phương án 1: Pre-load TẤT CẢ học sinh (Hiện tại)

**Cách hoạt động:**
- Import tất cả học sinh từ hệ thống quản lý học sinh của trường vào database
- Khi học sinh yêu cầu mật khẩu → Validate student tồn tại trong DB
- Tạo user account nếu student tồn tại

**Ưu điểm:**
- ✅ Fast lookup (không cần gọi external API)
- ✅ Offline capability (không phụ thuộc hệ thống khác)
- ✅ Full control over data
- ✅ Easy to query/filter students

**Nhược điểm:**
- ❌ Phải sync data thường xuyên (học sinh mới, tốt nghiệp, chuyển lớp)
- ❌ Database lớn (nếu có hàng nghìn học sinh)
- ❌ Risk of data inconsistency nếu không sync đúng
- ❌ Duplicate data (nếu trường đã có hệ thống quản lý học sinh)

### Phương án 2: On-demand Validation (External System)

**Cách hoạt động:**
- Không lưu students trong DB
- Khi yêu cầu mật khẩu → Gọi API của hệ thống quản lý học sinh chính
- Validate student tồn tại → Tạo user account
- Lưu minimal info (studentCode, fullName) trong user table

**Ưu điểm:**
- ✅ Single source of truth (hệ thống chính của trường)
- ✅ Không cần sync data
- ✅ Database nhỏ hơn
- ✅ Always up-to-date

**Nhược điểm:**
- ❌ Phụ thuộc vào hệ thống khác (nếu down thì không validate được)
- ❌ Slower (network call mỗi lần)
- ❌ Cần có API từ hệ thống chính
- ❌ Khó query/filter students trong app

### Phương án 3: Hybrid Approach (KHUYẾN NGHỊ)

**Cách hoạt động:**
- Pre-load students đang học (active students)
- Cache student data trong DB
- Sync định kỳ với hệ thống chính (nightly sync)
- On-demand lookup cho edge cases

**Ưu điểm:**
- ✅ Best of both worlds
- ✅ Fast lookup cho students thường dùng
- ✅ Có thể sync với hệ thống chính
- ✅ Flexible

**Nhược điểm:**
- ⚠️ Cần implement sync mechanism
- ⚠️ Phức tạp hơn một chút

## Khuyến nghị cho hệ thống của bạn

### **KHUYẾN NGHỊ: Pre-load Active Students**

**Lý do:**

1. **App nội bộ** - Bạn đã có quyền truy cập data
2. **Performance** - Fast lookup quan trọng cho UX
3. **Offline capability** - Không phụ thuộc hệ thống khác
4. **Query needs** - Cần filter/search students trong app

### Implementation Strategy

#### Option A: Import từ Excel/CSV (Cho development/testing)

```java
// Batch import students from CSV/Excel
@PostMapping("/admin/students/import")
public ResponseEntity<?> importStudents(@RequestParam("file") MultipartFile file) {
    // Parse CSV/Excel
    // Validate data
    // Batch insert students
}
```

#### Option B: Sync từ hệ thống chính (Cho production)

```java
// Scheduled sync job
@Scheduled(cron = "0 0 2 * * ?") // Chạy mỗi đêm 2h sáng
public void syncStudentsFromMainSystem() {
    // Call main system API
    // Get all active students
    // Update/create students in DB
    // Mark graduated students as inactive
}
```

#### Option C: Manual Admin Import (Cho production)

- Admin có thể import students qua UI
- Hoặc API endpoint để import batch

## Cấu trúc Database đề xuất

### Students Table (Pre-loaded)
```sql
CREATE TABLE students (
    student_code VARCHAR(20) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100), -- Generated: studentCode@student.ptithcm.edu.vn
    date_of_birth DATE,
    gender VARCHAR(10),
    phone VARCHAR(20),
    address VARCHAR(500),
    academic_year VARCHAR(20),
    position VARCHAR(50), -- Chức vụ
    class_code VARCHAR(20) NOT NULL,
    major_code VARCHAR(10) NOT NULL,
    faculty_code VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT true, -- Đang học hay đã tốt nghiệp
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Users Table (Created on-demand)
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE, -- studentCode (lowercase)
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(100),
    student_code VARCHAR(20), -- Reference to students table
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Workflow đề xuất

### 1. Initial Setup
1. Import tất cả học sinh đang học từ hệ thống chính
2. Mark `is_active = true` cho students đang học
3. Mark `is_active = false` cho students đã tốt nghiệp

### 2. Daily Operations
1. Học sinh yêu cầu mật khẩu
2. Validate student tồn tại và `is_active = true`
3. Tạo user account
4. Gửi password qua email

### 3. Periodic Sync (Optional)
1. Chạy sync job mỗi đêm
2. Update students mới
3. Mark students tốt nghiệp là inactive
4. Update thông tin thay đổi (chuyển lớp, etc.)

## Code Changes Needed

### 1. Add `is_active` field to Student entity

```java
@Column(name = "is_active", nullable = false)
private Boolean isActive = true;
```

### 2. Update requestPassword to check is_active

```java
// In AuthService.requestPassword()
StudentServiceClient.StudentResponse studentResponse = 
    studentServiceClient.getStudentByCode(studentCode);
    
if (studentResponse == null || !studentResponse.isSuccess()) {
    throw new ResourceNotFoundException("Student", "code", studentCode);
}

StudentDTO student = studentResponse.getData();
// Check if student is active (if you add this field)
// if (!student.isActive()) {
//     throw new BadRequestException("Student is not active");
// }
```

### 3. Add Admin Import Endpoint (Optional)

```java
@PostMapping("/admin/students/import")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> importStudents(@RequestParam("file") MultipartFile file) {
    // Import logic
}
```

## Kết luận

**CÓ, bạn nên pre-load students vào database vì:**

1. ✅ App nội bộ - có quyền truy cập data
2. ✅ Performance tốt hơn
3. ✅ Dễ query/filter trong app
4. ✅ Không phụ thuộc hệ thống khác

**Nhưng cần:**
- ⚠️ Có cơ chế import/sync data
- ⚠️ Mark students inactive khi tốt nghiệp
- ⚠️ Update data định kỳ

**Cho development:** Dùng DataSeeder (như hiện tại) hoặc import CSV

**Cho production:** Sync từ hệ thống chính hoặc manual import qua admin panel

