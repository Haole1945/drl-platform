# Database Design - DRL Platform

## Design Principles

### 1. Natural Keys as Primary Keys (Khóa Tự Nhiên)

Các bảng với **business keys** mạnh sử dụng natural keys làm primary key thay vì surrogate keys (id):

| Table | Primary Key | Type | Rationale |
|-------|-------------|------|-----------|
| `roles` | `name` | VARCHAR(50) | Role name là unique và immutable (STUDENT, INSTRUCTOR, ADMIN) |
| `permissions` | `name` | VARCHAR(100) | Permission name là unique và immutable |
| `faculties` | `code` | VARCHAR(20) | Mã khoa là unique và ổn định |
| `classes` | `code` | VARCHAR(50) | Mã lớp là unique |
| `students` | `student_code` | VARCHAR(20) | Mã sinh viên là unique identifier chính thức |

**Ưu điểm:**
- Tự document (self-documenting): nhìn vào PK là biết ngay record đó
- Tăng hiệu suất join: join bằng business key thay vì tra cứu qua surrogate key
- Đơn giản hóa query: `WHERE role_name = 'ADMIN'` thay vì join để lấy role name

**Nhược điểm:**
- Nếu business key thay đổi (rất hiếm), cần update foreign keys
- String keys lớn hơn integer keys về mặt storage

---

### 2. Composite Primary Keys (Khóa Tổng Hợp)

Các bảng **join tables** (Many-to-Many) sử dụng composite keys:

| Table | Primary Key | Description |
|-------|-------------|-------------|
| `user_roles` | `(user_id, role_name)` | Một user chỉ có 1 lần mỗi role |
| `role_permissions` | `(role_name, permission_name)` | Một role chỉ có 1 lần mỗi permission |
| `evaluation_details` | `(evaluation_id, criteria_id)` | Một evaluation chỉ chấm mỗi criteria 1 lần |

**Ưu điểm:**
- Tự nhiên đảm bảo uniqueness constraint
- Không cần thêm surrogate key không cần thiết
- Rõ ràng về business logic

---

### 3. Surrogate Keys (ID) cho các bảng còn lại

Các bảng **không có natural key mạnh** hoặc có thể thay đổi giữ surrogate key:

| Table | Primary Key | Type | Rationale |
|-------|-------------|------|-----------|
| `users` | `id` | BIGINT | Username và email có thể thay đổi |
| `rubrics` | `id` | BIGINT | Không có natural key |
| `criteria` | `id` | BIGINT | Không có natural key |
| `evaluations` | `id` | BIGINT | Không có natural key |
| `training_points` | `id` | BIGINT | Không có natural key |

---

## Database Schema

### Entity Relationship Diagram

```
Users ←→ user_roles(user_id, role_name) ←→ Roles(name)
                                              ↓
                                         role_permissions(role_name, permission_name)
                                              ↓
                                         Permissions(name)

Faculties(code) → Classes(code) → Students(student_code)
                                      ↓
                                  Training Points
                                      ↓
                                  Evaluations → evaluation_details(evaluation_id, criteria_id)
                                                    ↓
                                               Criteria ← Rubrics
```

---

## Table Definitions

### Tables with Natural Keys

#### 1. roles
```sql
CREATE TABLE roles (
    name VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

#### 2. permissions
```sql
CREATE TABLE permissions (
    name VARCHAR(100) PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

#### 3. faculties
```sql
CREATE TABLE faculties (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

#### 4. classes
```sql
CREATE TABLE classes (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    faculty_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    FOREIGN KEY (faculty_code) REFERENCES faculties(code)
);
```

#### 5. students
```sql
CREATE TABLE students (
    student_code VARCHAR(20) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    phone VARCHAR(20),
    address VARCHAR(500),
    academic_year VARCHAR(20),
    class_code VARCHAR(50) NOT NULL,
    faculty_code VARCHAR(20) NOT NULL,
    user_id BIGINT UNIQUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    FOREIGN KEY (class_code) REFERENCES classes(code),
    FOREIGN KEY (faculty_code) REFERENCES faculties(code),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

### Tables with Composite Keys

#### 6. user_roles (Join Table)
```sql
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role_name),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_name) REFERENCES roles(name)
);
```

#### 7. role_permissions (Join Table)
```sql
CREATE TABLE role_permissions (
    role_name VARCHAR(50) NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (role_name, permission_name),
    FOREIGN KEY (role_name) REFERENCES roles(name),
    FOREIGN KEY (permission_name) REFERENCES permissions(name)
);
```

#### 8. evaluation_details (Composite Key)
```sql
CREATE TABLE evaluation_details (
    evaluation_id BIGINT NOT NULL,
    criteria_id BIGINT NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    PRIMARY KEY (evaluation_id, criteria_id),
    FOREIGN KEY (evaluation_id) REFERENCES evaluations(id),
    FOREIGN KEY (criteria_id) REFERENCES criteria(id)
);
```

---

### Tables with Surrogate Keys (ID)

#### 9. users
```sql
CREATE TABLE users (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

#### 10. rubrics
```sql
CREATE TABLE rubrics (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    max_points DOUBLE PRECISION NOT NULL,
    academic_year VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

#### 11. criteria
```sql
CREATE TABLE criteria (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    max_points DOUBLE PRECISION NOT NULL,
    order_index INTEGER NOT NULL,
    rubric_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    FOREIGN KEY (rubric_id) REFERENCES rubrics(id)
);
```

#### 12. evaluations
```sql
CREATE TABLE evaluations (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    semester VARCHAR(20) NOT NULL,
    total_points DOUBLE PRECISION,
    status VARCHAR(50) NOT NULL,
    rejection_reason TEXT,
    appeal_reason TEXT,
    submitted_at DATE,
    approved_at DATE,
    student_code VARCHAR(20) NOT NULL,
    rubric_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    FOREIGN KEY (student_code) REFERENCES students(student_code),
    FOREIGN KEY (rubric_id) REFERENCES rubrics(id)
);
```

#### 13. training_points
```sql
CREATE TABLE training_points (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    activity_name VARCHAR(200) NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    points DOUBLE PRECISION NOT NULL,
    evidence_url VARCHAR(500),
    semester VARCHAR(20),
    student_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    FOREIGN KEY (student_code) REFERENCES students(student_code)
);
```

---

## Normalization

Tất cả bảng đều ở **Third Normal Form (3NF)**:

- **1NF**: Tất cả columns là atomic values
- **2NF**: Không có partial dependencies (tất cả non-key attributes phụ thuộc vào toàn bộ primary key)
- **3NF**: Không có transitive dependencies (non-key attributes không phụ thuộc vào non-key attributes khác)

---

## Indexes

### Automatic Indexes (từ Primary Keys và UNIQUE constraints):
- Primary keys tự động có index
- UNIQUE constraints tự động có index

### Recommended Additional Indexes:
```sql
-- Foreign key indexes for faster joins
CREATE INDEX idx_classes_faculty ON classes(faculty_code);
CREATE INDEX idx_students_class ON students(class_code);
CREATE INDEX idx_students_faculty ON students(faculty_code);
CREATE INDEX idx_training_points_student ON training_points(student_code);
CREATE INDEX idx_evaluations_student ON evaluations(student_code);
CREATE INDEX idx_evaluations_status ON evaluations(status);
CREATE INDEX idx_criteria_rubric ON criteria(rubric_id);
```

---

## Migration Notes

**Breaking changes từ thiết kế cũ:**

1. `roles.id` (BIGINT) → `roles.name` (VARCHAR) - PK changed
2. `permissions.id` (BIGINT) → `permissions.name` (VARCHAR) - PK changed  
3. `faculties.id` (BIGINT) → `faculties.code` (VARCHAR) - PK changed
4. `classes.id` (BIGINT) → `classes.code` (VARCHAR) - PK changed
5. `students.id` (BIGINT) → `students.student_code` (VARCHAR) - PK changed
6. `user_roles` - không còn `id`, dùng composite key
7. `role_permissions` - không còn `id`, dùng composite key
8. `evaluation_details` - không còn `id`, dùng composite key

**Để test:**
```bash
docker-compose down -v  # Xóa database cũ
docker-compose up --build -d  # Tạo schema mới
```

