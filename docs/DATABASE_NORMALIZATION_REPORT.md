# Báo Cáo Phân Tích Database Normalization

## DRL Platform - Kiểm Tra 1NF, 2NF, 3NF

**Ngày kiểm tra:** 2025-12-08

---

## 📊 Tổng Quan

Hệ thống sử dụng **microservices architecture** với các database riêng biệt:

- **auth-service**: Database `drl_auth`
- **student-service**: Database `drl_student`
- **evaluation-service**: Database `drl_db`
- **ai-validation-service**: Database riêng (không rõ tên)

---

## ✅ CÁC BẢNG ĐẠT CHUẨN (1NF, 2NF, 3NF)

### 1. **auth-service**

#### ✅ `roles` (1NF, 2NF, 3NF)

- **PK**: `name` (natural key)
- **Attributes**: `description`, `created_at`, `updated_at`
- **Phân tích**: Đơn giản, không có phụ thuộc phức tạp → ✅ Đạt chuẩn

#### ✅ `permissions` (1NF, 2NF, 3NF)

- **PK**: `name` (natural key)
- **Attributes**: `description`, `created_at`, `updated_at`
- **Phân tích**: Đơn giản → ✅ Đạt chuẩn

#### ✅ `users` (1NF, 2NF, 3NF)

- **PK**: `id` (surrogate key)
- **Attributes**: `username`, `email`, `password_hash`, `full_name`, `is_active`, `student_code`, `class_code`, timestamps
- **Phân tích**:
  - Mỗi attribute là atomic → ✅ 1NF
  - Tất cả attributes phụ thuộc trực tiếp vào PK → ✅ 2NF
  - Không có transitive dependency → ✅ 3NF

#### ✅ `user_roles` (1NF, 2NF, 3NF)

- **PK**: `(user_id, role_name)` (composite key)
- **FK**: `user_id` → `users.id`, `role_name` → `roles.name`
- **Phân tích**: Join table, không có non-prime attributes → ✅ Đạt chuẩn

#### ✅ `role_permissions` (1NF, 2NF, 3NF)

- **PK**: `(role_name, permission_name)` (composite key)
- **FK**: `role_name` → `roles.name`, `permission_name` → `permissions.name`
- **Phân tích**: Join table → ✅ Đạt chuẩn

### 2. **student-service**

#### ✅ `faculties` (1NF, 2NF, 3NF)

- **PK**: `code` (natural key)
- **Attributes**: `name`, `description`, timestamps
- **Phân tích**: Đơn giản → ✅ Đạt chuẩn

#### ✅ `majors` (1NF, 2NF, 3NF)

- **PK**: `code` (natural key)
- **FK**: `faculty_code` → `faculties.code`
- **Attributes**: `name`, `description`, timestamps
- **Phân tích**:
  - Tất cả attributes phụ thuộc đầy đủ vào PK → ✅ 2NF
  - Không có transitive dependency → ✅ 3NF

#### ✅ `classes` (1NF, 2NF, 3NF)

- **PK**: `code` (natural key)
- **FK**: `faculty_code` → `faculties.code`, `major_code` → `majors.code`
- **Attributes**: `name`, `academic_year`, timestamps
- **Phân tích**: Đạt chuẩn → ✅

#### ⚠️ `students` (1NF, 2NF, **VI PHẠM 3NF**)

- **PK**: `student_code` (natural key)
- **FK**: `class_code` → `classes.code`, `major_code` → `majors.code`, `faculty_code` → `faculties.code`
- **Attributes**: `full_name`, `date_of_birth`, `gender`, `phone`, `address`, `academic_year`, `position`, `user_id`, timestamps

**VI PHẠM 3NF:**

- ❌ `faculty_code` và `major_code` là **transitive dependency**
  - `student_code` → `class_code` → `faculty_code` và `major_code`
  - Lý do: `faculty_code` và `major_code` phụ thuộc vào `class_code`, không trực tiếp vào `student_code`
  - Có thể suy ra từ `class_code` thông qua bảng `classes`

**Khuyến nghị:**

```sql
-- Nên xóa `faculty_code` và `major_code` khỏi bảng `students`
-- Vì có thể lấy từ `classes` table:
-- SELECT s.*, c.faculty_code, c.major_code
-- FROM students s JOIN classes c ON s.class_code = c.code
```

---

## ❌ CÁC BẢNG VI PHẠM NORMALIZATION

### 1. **evaluation-service**

#### ❌ `evaluation_details` (1NF, 2NF, **VI PHẠM 3NF**)

```sql
CREATE TABLE evaluation_details (
    evaluation_id BIGINT NOT NULL,
    criteria_id BIGINT NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    comment TEXT,
    class_monitor_score DOUBLE PRECISION,  -- Thêm sau
    advisor_score DOUBLE PRECISION,        -- Thêm sau
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (evaluation_id, criteria_id)
);
```

**VI PHẠM 3NF:**

- ❌ `class_monitor_score` và `advisor_score` có thể được tính từ bảng `evaluation_sub_criteria_scores`
  - Nếu tồn tại bảng `evaluation_sub_criteria_scores`, thì `class_monitor_score = SUM(class_monitor_score)` và `advisor_score = SUM(advisor_score)` từ bảng đó
  - Đây là **redundant data** - dữ liệu có thể suy ra từ bảng khác

**Khuyến nghị:**

- **Option 1**: Xóa `class_monitor_score` và `advisor_score` khỏi `evaluation_details`, chỉ lưu trong `evaluation_sub_criteria_scores`
- **Option 2**: Giữ lại như **denormalized data** cho performance (tính toán sẵn), nhưng cần **trigger** để đồng bộ khi `evaluation_sub_criteria_scores` thay đổi

---

#### ❌ `evaluation_details.comment` (VI PHẠM 1NF - Nếu lưu JSON)

```sql
comment TEXT  -- Có thể chứa JSON string với nhiều fields
```

**VI PHẠM 1NF (Nếu comment chứa JSON):**

- ❌ Nếu `comment` chứa JSON như `{"evidence": "...", "scores": {...}}`, đây là **multi-valued attribute**
- Mỗi cell phải chứa **atomic value**, không phải structured data

**Khuyến nghị:**

- **Option 1**: Tách riêng:
  ```sql
  ALTER TABLE evaluation_details
    ADD COLUMN evidence TEXT,
    ADD COLUMN metadata JSONB;  -- PostgreSQL hỗ trợ JSONB
  ```
- **Option 2**: Nếu muốn giữ JSON, dùng `JSONB` type của PostgreSQL (được coi là atomic type)

---

#### ⚠️ `evaluations` (1NF, 2NF, **VI PHẠM 3NF** - Nếu có redundant data)

```sql
CREATE TABLE evaluations (
    id BIGSERIAL PRIMARY KEY,
    student_code VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    academic_year VARCHAR(20),  -- Có thể suy ra từ semester/period
    total_points DOUBLE PRECISION,  -- Có thể tính từ evaluation_details
    ...
);
```

**VI PHẠM 3NF (Potential):**

- ❌ `total_points`: Có thể tính từ `SUM(score)` trong `evaluation_details`
  - **Transitive dependency**: `evaluation_id` → `evaluation_details` → `total_points`
- ❌ `academic_year`: Có thể suy ra từ `semester` hoặc `rubric.academic_year`
  - **Transitive dependency**: `evaluation_id` → `rubric_id` → `rubric.academic_year`

**Khuyến nghị:**

- **Option 1**: Xóa `total_points` và `academic_year`, tính toán khi query (VIEW hoặc computed column)
- **Option 2**: Giữ lại như **denormalized data** với **triggers** để đồng bộ

---

#### ⚠️ `evidence_files` (1NF, **VI PHẠM 2NF/3NF** - Tùy thuộc vào design)

```sql
CREATE TABLE evidence_files (
    id BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT,  -- NULL được phép
    criteria_id BIGINT NOT NULL,
    sub_criteria_id VARCHAR(20),  -- Có thể suy ra từ criteria_id + mapping
    file_name VARCHAR(255),
    stored_file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_url VARCHAR(500),
    ...
);
```

**VI PHẠM 2NF/3NF (Potential):**

- ❌ `file_url` có thể được tính từ `file_path` hoặc pattern: `/files/evidence/{evaluation_id}/{criteria_id}/{stored_file_name}`
  - **Functional dependency**: `file_path` → `file_url` (có thể)
  - Nếu đúng, vi phạm 3NF vì `file_url` phụ thuộc vào non-prime attribute `file_path`

**Khuyến nghị:**

- Xóa `file_url`, tính toán khi query (application logic hoặc VIEW)
- Hoặc giữ lại như **derived column** với **computed column** hoặc **trigger**

---

#### ❌ `evaluation_sub_criteria_scores` (1NF, 2NF, **VI PHẠM 3NF**)

```sql
CREATE TABLE evaluation_sub_criteria_scores (
    id BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL,
    criteria_id BIGINT NOT NULL,
    sub_criteria_id VARCHAR(20) NOT NULL,
    class_monitor_score DOUBLE PRECISION,
    advisor_score DOUBLE PRECISION,
    ...
    UNIQUE (evaluation_id, criteria_id, sub_criteria_id)
);
```

**VI PHẠM 3NF:**

- ❌ `criteria_id` là **redundant** vì có thể suy ra từ `sub_criteria_id`
  - Nếu `sub_criteria_id` có format như `"1.1"` (criterion 1, sub-criteria 1.1), thì có thể extract `criteria_id` từ đó
  - Hoặc nếu có bảng mapping `sub_criteria` với `criteria_id`, thì `criteria_id` là transitive dependency

**Khuyến nghị:**

- Kiểm tra xem có bảng `sub_criteria` không. Nếu có, xóa `criteria_id` khỏi bảng này:
  ```sql
  -- Nếu có bảng sub_criteria với structure:
  -- sub_criteria(id, criteria_id, name, ...)
  -- Thì:
  SELECT esc.*, sc.criteria_id
  FROM evaluation_sub_criteria_scores esc
  JOIN sub_criteria sc ON esc.sub_criteria_id = sc.id
  ```
- Nếu không có bảng mapping, giữ lại `criteria_id` như **denormalized data** cho performance

---

### 2. **ai-validation-service**

#### ⚠️ `evidence_validations` (1NF, **VI PHẠM 2NF/3NF** - Nếu có redundant data)

```sql
CREATE TABLE evidence_validations (
    id BIGSERIAL PRIMARY KEY,
    evidence_file_id BIGINT NOT NULL,
    evaluation_id BIGINT,              -- Redundant?
    criteria_id BIGINT NOT NULL,       -- Redundant?
    sub_criteria_id VARCHAR(20),       -- Redundant?
    ...
);
```

**VI PHẠM 3NF (Potential):**

- ❌ `evaluation_id`, `criteria_id`, `sub_criteria_id` có thể suy ra từ `evidence_file_id`
  - Nếu `evidence_files` table có các columns này, thì đây là **redundant data**
  - **Transitive dependency**: `evidence_file_id` → `evidence_files.evaluation_id` → `evaluation_id`

**Khuyến nghị:**

- **Option 1**: Xóa `evaluation_id`, `criteria_id`, `sub_criteria_id` khỏi `evidence_validations`, join khi cần:
  ```sql
  SELECT ev.*, ef.evaluation_id, ef.criteria_id, ef.sub_criteria_id
  FROM evidence_validations ev
  JOIN evidence_files ef ON ev.evidence_file_id = ef.id
  ```
- **Option 2**: Giữ lại như **denormalized data** để tránh join (performance optimization), nhưng cần đồng bộ khi `evidence_files` thay đổi

---

## 📋 TÓM TẮT VI PHẠM

| Service                   | Table                            | Vi phạm             | Lý do                                                                                  | Mức độ        |
| ------------------------- | -------------------------------- | ------------------- | -------------------------------------------------------------------------------------- | ------------- |
| **student-service**       | `students`                       | **3NF**             | `faculty_code`, `major_code` là transitive dependency qua `class_code`                 | ⚠️ Trung bình |
| **evaluation-service**    | `evaluation_details`             | **3NF**             | `class_monitor_score`, `advisor_score` có thể tính từ `evaluation_sub_criteria_scores` | ⚠️ Trung bình |
| **evaluation-service**    | `evaluation_details.comment`     | **1NF** (nếu JSON)  | Chứa structured JSON data                                                              | ❌ Cao        |
| **evaluation-service**    | `evaluations`                    | **3NF** (potential) | `total_points`, `academic_year` là derived/redundant data                              | ⚠️ Trung bình |
| **evaluation-service**    | `evidence_files`                 | **3NF** (potential) | `file_url` có thể tính từ `file_path`                                                  | ⚠️ Thấp       |
| **evaluation-service**    | `evaluation_sub_criteria_scores` | **3NF**             | `criteria_id` có thể redundant nếu có bảng mapping                                     | ⚠️ Thấp       |
| **ai-validation-service** | `evidence_validations`           | **3NF**             | `evaluation_id`, `criteria_id` có thể suy ra từ `evidence_file_id`                     | ⚠️ Trung bình |

---

## 🔧 KHUYẾN NGHỊ TỔNG THỂ

### 1. **Denormalization có chủ ý (Intentional Denormalization)**

Một số vi phạm có thể là **có chủ ý** để tối ưu performance:

- `total_points` trong `evaluations`: Tính toán sẵn để tránh SUM() mỗi lần query
- `evaluation_id`, `criteria_id` trong `evidence_validations`: Tránh join với `evidence_files` (cross-service)
- `faculty_code`, `major_code` trong `students`: Tránh join với `classes` table

**Nếu giữ denormalization:**

- ✅ Sử dụng **triggers** hoặc **application-level synchronization** để đồng bộ dữ liệu
- ✅ Document rõ ràng đây là **denormalized data**
- ✅ Có **migration scripts** để recalculate khi cần

### 2. **Cần sửa ngay (High Priority)**

- ❌ **`evaluation_details.comment` chứa JSON**: Nên tách riêng hoặc dùng `JSONB` type

### 3. **Nên sửa (Medium Priority)**

- ⚠️ **`students.faculty_code`, `students.major_code`**: Xóa và join khi cần
- ⚠️ **`evaluation_details.class_monitor_score`, `advisor_score`**: Xóa nếu đã có `evaluation_sub_criteria_scores`

### 4. **Có thể giữ (Low Priority - Performance Optimization)**

- ✅ **`evaluations.total_points`**: Giữ nếu cần performance, nhưng dùng trigger
- ✅ **`evidence_validations.evaluation_id`, `criteria_id`**: Giữ nếu cross-service join là expensive

---

## 📚 THAM KHẢO

- **1NF**: Mỗi cell chỉ chứa một atomic value, không có duplicate rows
- **2NF**: Phải đạt 1NF và mọi non-prime attribute phải phụ thuộc đầy đủ vào primary key
- **3NF**: Phải đạt 2NF và không có transitive dependency (non-prime attribute không phụ thuộc vào non-prime attribute khác)

**Lưu ý:** Trong microservices architecture, một số denormalization là **acceptable** và **recommended** để tránh cross-service joins. Tuy nhiên, cần document rõ ràng và có strategy để đồng bộ dữ liệu.
