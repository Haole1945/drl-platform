# Phân Tích Chuẩn Hóa Database (1NF, 2NF, 3NF)

## Tổng Quan

Báo cáo này phân tích database schema của 3 services:

- **auth-service** (drl_auth database)
- **student-service** (drl_student database)
- **evaluation-service** (drl_evaluation database)

---

## AUTH-SERVICE (drl_auth)

### 1. Bảng `roles`

- **Primary Key**: `name` (natural key)
- **Các cột**: `description`, `created_at`, `updated_at`

#### ✅ 1NF (First Normal Form)

- Mỗi cell chứa giá trị atomic
- Không có repeating groups
- **KẾT QUẢ: ĐẠT**

#### ✅ 2NF (Second Normal Form)

- Chỉ có 1 primary key (không phải composite)
- **KẾT QUẢ: ĐẠT**

#### ✅ 3NF (Third Normal Form)

- Không có transitive dependencies
- **KẾT QUẢ: ĐẠT**

---

### 2. Bảng `permissions`

- **Primary Key**: `name` (natural key)
- **Các cột**: `description`, `created_at`, `updated_at`

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

#### ✅ 3NF: ĐẠT

---

### 3. Bảng `users`

- **Primary Key**: `id` (surrogate key)
- **Các cột**: `username`, `email`, `password_hash`, `full_name`, `is_active`, `student_code`, `class_code`, `created_at`, `updated_at`

#### ✅ 1NF: ĐẠT

- Tất cả giá trị đều atomic

#### ✅ 2NF: ĐẠT

- Primary key là single attribute

#### ⚠️ 3NF: VI PHẠM

**Vấn đề**: `class_code` có thể phụ thuộc vào `student_code`

**Phân tích chi tiết:**

Trong bảng `users`:

- **Primary Key**: `id`
- **Non-key attributes**: `student_code`, `class_code`, `username`, `email`, etc.

**Dependency Chain (Chuỗi phụ thuộc):**

```
id (key) → student_code (non-key) → class_code (non-key)
```

**Tại sao đây là transitive dependency?**

1. **Trong student-service** (database khác):

   - Bảng `students` có: `student_code` (PK) → `class_code`
   - Mỗi `student_code` xác định duy nhất một `class_code`

2. **Trong auth-service** (bảng `users`):
   - `id` (PK) xác định `student_code` → OK (key xác định non-key)
   - `student_code` (non-key) xác định `class_code` (non-key) → **VI PHẠM 3NF**
   - `class_code` không phụ thuộc trực tiếp vào key `id`, mà phụ thuộc qua `student_code`

**Ví dụ cụ thể:**

```
User 1: id=1, student_code="N21DCCN001", class_code="D21DCCN01-N"
User 2: id=2, student_code="N21DCCN002", class_code="D21DCCN01-N"
```

Nếu biết `student_code="N21DCCN001"`, ta có thể query student-service để lấy `class_code="D21DCCN01-N"`.
Vậy `class_code` trong bảng `users` là **redundant** (dư thừa) vì có thể suy ra từ `student_code`.

**Lưu ý đặc biệt:**

- Đây là **business logic dependency** (không phải database FK vì microservices)
- `class_code` được **cache** trong `users` để tối ưu performance (tránh phải query student-service mỗi lần)
- Đây là **denormalization có chủ ý** cho môi trường microservices

**Giải pháp**:

- **Option 1 (Normalize)**: Xóa `class_code` khỏi bảng `users`, query student-service khi cần
- **Option 2 (Denormalize - hiện tại)**: Giữ `class_code` nhưng thêm validation/trigger để đồng bộ với student-service
- **Option 3**: Tạo computed column hoặc view để tự động lấy từ student-service

---

### 4. Bảng `user_roles`

- **Primary Key**: `(user_id, role_name)` (composite key)
- **Các cột**: Không có non-key attributes

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

- Cả 2 phần của composite key đều cần thiết

#### ✅ 3NF: ĐẠT

---

### 5. Bảng `role_permissions`

- **Primary Key**: `(role_name, permission_name)` (composite key)
- **Các cột**: Không có non-key attributes

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

#### ✅ 3NF: ĐẠT

---

## STUDENT-SERVICE (drl_student)

### 1. Bảng `faculties`

- **Primary Key**: `code` (natural key)
- **Các cột**: `name`, `description`, `created_at`, `updated_at`

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

#### ✅ 3NF: ĐẠT

---

### 2. Bảng `majors`

- **Primary Key**: `code` (natural key)
- **Các cột**: `name`, `description`, `faculty_code`, `created_at`, `updated_at`
- **Foreign Key**: `faculty_code` → `faculties(code)`

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

- `faculty_code` phụ thuộc vào toàn bộ primary key `code`

#### ✅ 3NF: ĐẠT

- `faculty_code` là foreign key, không phải transitive dependency

---

### 3. Bảng `classes`

- **Primary Key**: `code` (natural key)
- **Các cột**: `name`, `academic_year`, `faculty_code`, `major_code`, `created_at`, `updated_at`
- **Foreign Keys**:
  - `faculty_code` → `faculties(code)`
  - `major_code` → `majors(code)`

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

#### ⚠️ 3NF: VI PHẠM

**Vấn đề**: `faculty_code` có thể phụ thuộc vào `major_code`

- Trong bảng `majors`, `major_code` → `faculty_code`
- Trong bảng `classes`, `major_code` → `faculty_code` (qua bảng majors)
- Đây là transitive dependency: `classes.major_code` → `majors.faculty_code` → `classes.faculty_code`

**Giải pháp**:

- Xóa `faculty_code` khỏi bảng `classes` (vì có thể lấy qua `major_code`)
- Hoặc giữ nguyên nếu cần denormalization cho performance

---

### 4. Bảng `students`

- **Primary Key**: `student_code` (natural key)
- **Các cột**: `full_name`, `date_of_birth`, `gender`, `phone`, `address`, `academic_year`, `position`, `class_code`, `major_code`, `faculty_code`, `user_id`, `created_at`, `updated_at`
- **Foreign Keys**:
  - `class_code` → `classes(code)`
  - `major_code` → `majors(code)`
  - `faculty_code` → `faculties(code)`

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

#### ⚠️ 3NF: VI PHẠM (Nhiều transitive dependencies)

**Vấn đề 1**: `major_code` và `faculty_code` có thể phụ thuộc vào `class_code`

- `class_code` → `major_code` (qua bảng classes)
- `class_code` → `faculty_code` (qua bảng classes → majors)
- Đây là transitive dependencies

**Vấn đề 2**: `faculty_code` có thể phụ thuộc vào `major_code`

- `major_code` → `faculty_code` (qua bảng majors)

**Giải pháp**:

- Xóa `major_code` và `faculty_code` khỏi bảng `students`
- Lấy thông tin qua join với bảng `classes`
- Hoặc giữ nguyên nếu cần denormalization cho performance

---

## EVALUATION-SERVICE (drl_evaluation)

### 1. Bảng `rubrics`

- **Primary Key**: `id` (surrogate key)
- **Các cột**: `name`, `description`, `max_points`, `academic_year`, `is_active`, `created_at`, `updated_at`, `target_classes`

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

#### ✅ 3NF: ĐẠT

---

### 2. Bảng `criteria`

- **Primary Key**: `id` (surrogate key)
- **Các cột**: `name`, `description`, `max_points`, `order_index`, `rubric_id`, `created_at`, `updated_at`
- **Foreign Key**: `rubric_id` → `rubrics(id)`

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

#### ✅ 3NF: ĐẠT

---

### 3. Bảng `evaluations`

- **Primary Key**: `id` (surrogate key)
- **Các cột**: `student_code`, `semester`, `academic_year`, `total_points`, `status`, `rejection_reason`, `appeal_reason`, `submitted_at`, `approved_at`, `rubric_id`, `resubmission_count`, `created_at`, `updated_at`, `last_rejection_level`, `created_by`
- **Foreign Key**: `rubric_id` → `rubrics(id)`

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

#### ⚠️ 3NF: VI PHẠM

**Vấn đề**: `academic_year` có thể phụ thuộc vào `semester`

- Format: `semester = "2024-2025-HK1"` → `academic_year = "2024-2025"`
- `academic_year` có thể được parse từ `semester`
- Đây là transitive dependency: `semester` → `academic_year`

**Giải pháp**:

- Xóa `academic_year` khỏi bảng `evaluations`
- Parse từ `semester` khi cần (tạo computed column hoặc view)
- Hoặc giữ nguyên với validation để đảm bảo consistency

---

### 4. Bảng `evaluation_details`

- **Primary Key**: `(evaluation_id, criteria_id)` (composite key)
- **Các cột**: `score`, `comment`, `created_at`, `updated_at`
- **Foreign Keys**:
  - `evaluation_id` → `evaluations(id)`
  - `criteria_id` → `criteria(id)`

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

- Cả 2 phần của composite key đều cần thiết

#### ✅ 3NF: ĐẠT

---

### 5. Bảng `evaluation_history`

- **Primary Key**: `id` (surrogate key)
- **Các cột**: `evaluation_id`, `action`, `from_status`, `to_status`, `level`, `actor_id`, `actor_name`, `comment`, `created_at`
- **Foreign Key**: `evaluation_id` → `evaluations(id)`

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

#### ⚠️ 3NF: VI PHẠM

**Vấn đề**: `actor_name` có thể phụ thuộc vào `actor_id`

- Nếu có bảng `users` trong auth-service, `actor_id` → `actor_name`
- Đây là transitive dependency

**Giải pháp**:

- Xóa `actor_name` khỏi bảng `evaluation_history`
- Join với bảng `users` khi cần
- Hoặc giữ nguyên nếu cần denormalization (lưu snapshot cho audit trail)

---

### 6. Bảng `evidence_files`

- **Primary Key**: `id` (surrogate key)
- **Các cột**: `evaluation_id`, `criteria_id`, `sub_criteria_id`, `file_name`, `stored_file_name`, `file_path`, `file_url`, `file_type`, `file_size`, `uploaded_by`, `created_at`
- **Foreign Keys**:
  - `evaluation_id` → `evaluations(id)`
  - `criteria_id` → `criteria(id)`

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

#### ⚠️ 3NF: VI PHẠM

**Vấn đề**: `file_url` có thể phụ thuộc vào `file_path`

- Nếu có quy tắc chuyển đổi: `file_path = "/app/uploads/evidence/abc123.pdf"` → `file_url = "/api/files/evidence/abc123.pdf"`
- Đây là transitive dependency

**Giải pháp**:

- Xóa `file_url`, tính toán từ `file_path` khi cần
- Hoặc giữ nguyên nếu cần denormalization cho performance

---

### 7. Bảng `evaluation_periods`

- **Primary Key**: `id` (surrogate key)
- **Các cột**: `name`, `semester`, `academic_year`, `start_date`, `end_date`, `is_active`, `description`, `created_at`, `updated_at`, `rubric_id`, `target_classes`
- **Foreign Key**: `rubric_id` → `rubrics(id)`

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

#### ⚠️ 3NF: VI PHẠM

**Vấn đề**: `academic_year` có thể phụ thuộc vào `semester`

- Format: `semester = "2024-2025-HK1"` → `academic_year = "2024-2025"`
- Đây là transitive dependency

**Giải pháp**:

- Xóa `academic_year` khỏi bảng `evaluation_periods`
- Parse từ `semester` khi cần
- Hoặc giữ nguyên với validation

---

### 8. Bảng `notifications`

- **Primary Key**: `id` (surrogate key)
- **Các cột**: `user_id`, `title`, `message`, `type`, `is_read`, `related_id`, `related_type`, `created_at`, `read_at`

#### ✅ 1NF: ĐẠT

#### ✅ 2NF: ĐẠT

#### ✅ 3NF: ĐẠT

---

## TỔNG KẾT

### Kết Quả Theo Service

#### ✅ AUTH-SERVICE

- **1NF**: 5/5 bảng đạt (100%)
- **2NF**: 5/5 bảng đạt (100%)
- **3NF**: 4/5 bảng đạt (80%)
  - ⚠️ `users`: `class_code` phụ thuộc vào `student_code`

#### ✅ STUDENT-SERVICE

- **1NF**: 4/4 bảng đạt (100%)
- **2NF**: 4/4 bảng đạt (100%)
- **3NF**: 2/4 bảng đạt (50%)
  - ⚠️ `classes`: `faculty_code` phụ thuộc vào `major_code`
  - ⚠️ `students`: `major_code`, `faculty_code` phụ thuộc vào `class_code`

#### ✅ EVALUATION-SERVICE

- **1NF**: 8/8 bảng đạt (100%)
- **2NF**: 8/8 bảng đạt (100%)
- **3NF**: 4/8 bảng đạt (50%)
  - ⚠️ `evaluations`: `academic_year` phụ thuộc vào `semester`
  - ⚠️ `evaluation_history`: `actor_name` phụ thuộc vào `actor_id`
  - ⚠️ `evidence_files`: `file_url` phụ thuộc vào `file_path`
  - ⚠️ `evaluation_periods`: `academic_year` phụ thuộc vào `semester`

### Tổng Kết Chung

- **1NF**: 17/17 bảng đạt (100%) ✅
- **2NF**: 17/17 bảng đạt (100%) ✅
- **3NF**: 10/17 bảng đạt (58.8%) ⚠️

### Các Vi Phạm 3NF

1. **auth-service.users**: `class_code` → `student_code`
2. **student-service.classes**: `faculty_code` → `major_code`
3. **student-service.students**: `major_code`, `faculty_code` → `class_code`
4. **evaluation-service.evaluations**: `academic_year` → `semester`
5. **evaluation-service.evaluation_history**: `actor_name` → `actor_id`
6. **evaluation-service.evidence_files**: `file_url` → `file_path`
7. **evaluation-service.evaluation_periods**: `academic_year` → `semester`

### Khuyến Nghị

#### Option 1: Đạt 3NF Hoàn Toàn (Normalize)

- Xóa các cột redundant
- Sử dụng computed columns hoặc views
- Join khi cần thiết

**Ưu điểm**:

- Đảm bảo data consistency
- Giảm storage
- Dễ maintain

**Nhược điểm**:

- Performance có thể chậm hơn (cần join)
- Code phức tạp hơn

#### Option 2: Giữ Nguyên (Denormalization Có Chủ ý)

- Giữ các cột redundant
- Thêm validation/constraints để đảm bảo consistency
- Sử dụng triggers hoặc application logic để đồng bộ

**Ưu điểm**:

- Performance tốt hơn (không cần join)
- Query đơn giản hơn

**Nhược điểm**:

- Có nguy cơ data inconsistency
- Cần validation tốt

#### Option 3: Hybrid Approach

- Giữ các cột quan trọng cho performance
- Xóa các cột ít dùng
- Thêm validation cho các cột giữ lại

---

## Kết Luận

Database schema của bạn:

- ✅ **Đạt 1NF hoàn toàn** (100%)
- ✅ **Đạt 2NF hoàn toàn** (100%)
- ⚠️ **Chưa đạt 3NF hoàn toàn** (58.8%)

Các vi phạm 3NF chủ yếu là **denormalization có chủ ý** để tối ưu performance trong môi trường microservices. Điều này là **chấp nhận được** nếu:

1. Có validation/constraints đảm bảo consistency
2. Có cơ chế đồng bộ dữ liệu
3. Performance là ưu tiên

**Khuyến nghị**: Giữ nguyên schema hiện tại nhưng thêm validation và constraints để đảm bảo data consistency.
