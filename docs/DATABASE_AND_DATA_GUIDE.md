# Hướng Dẫn Tạo Database và Dữ Liệu trong DRL Platform

## 📋 Tổng Quan

DRL Platform sử dụng kiến trúc **Database per Service** với PostgreSQL và **Flyway** để quản lý migrations. Mỗi service có database riêng:
- `drl_auth` - Auth Service
- `drl_student` - Student Service  
- `drl_evaluation` - Evaluation Service

---

## 🗄️ PHẦN 1: TẠO DATABASE

### 1.1. Cách Database Được Tạo Tự Động

Khi chạy Docker Compose, database được tạo tự động qua script `init-multiple-databases.sh`:

**File:** `infra/db/init-multiple-databases.sh`

```bash
#!/bin/bash
set -e

# Create databases for each service
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    -- Create auth-service database
    CREATE DATABASE drl_auth;
    
    -- Create student-service database
    CREATE DATABASE drl_student;
    
    -- Create evaluation-service database
    CREATE DATABASE drl_evaluation;
    
    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE drl_auth TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE drl_student TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE drl_evaluation TO $POSTGRES_USER;
EOSQL

echo "Multiple databases created successfully!"
```

**Cách hoạt động:**
1. Docker Compose mount script này vào `/docker-entrypoint-initdb.d/` của PostgreSQL container
2. PostgreSQL tự động chạy script này khi container khởi động lần đầu
3. Script tạo 3 database riêng biệt cho mỗi service

**File cấu hình:** `infra/docker-compose.yml`
```yaml
postgres:
  volumes:
    - ./db/init-multiple-databases.sh:/docker-entrypoint-initdb.d/init-multiple-databases.sh
```

---

### 1.2. Tạo Database Schema (Bảng) bằng Flyway Migrations

Sau khi database được tạo, **Flyway** tự động chạy migrations để tạo các bảng.

#### Cấu trúc thư mục migrations:

```
backend/
├── auth-service/
│   └── src/main/resources/db/migration/
│       └── V1__create_auth_tables.sql
├── student-service/
│   └── src/main/resources/db/migration/
│       └── V1__create_student_tables.sql
└── evaluation-service/
    └── src/main/resources/db/migration/
        ├── V1__Create_evaluation_tables.sql
        ├── V2__Insert_initial_data.sql
        ├── V3__Create_notifications_table.sql
        └── ...
```

#### Quy tắc đặt tên file migration:

- **Format:** `V{version}__{description}.sql`
- **Ví dụ:** `V1__create_auth_tables.sql`, `V2__add_target_classes_to_rubrics.sql`
- **Version:** Số nguyên tăng dần (1, 2, 3, ...)
- **Description:** Mô tả ngắn gọn, dùng dấu gạch dưới `_`

#### Ví dụ Migration File:

**File:** `backend/auth-service/src/main/resources/db/migration/V1__create_auth_tables.sql`

```sql
-- ============================================
-- DRL Platform - Auth Service Migration
-- Version: V1
-- Description: Creates authentication and authorization tables
-- ============================================

-- Table: roles (natural key: name)
CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE roles IS 'User roles (STUDENT, INSTRUCTOR, ADMIN, etc.)';

-- Table: users (surrogate key: id)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    student_code VARCHAR(20),
    class_code VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Table: user_roles (composite key)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role_name),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_name) REFERENCES roles(name) ON DELETE CASCADE
);
```

#### Cấu hình Flyway trong `application.yml`:

**File:** `backend/auth-service/src/main/resources/application.yml`

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false  # Fresh database per service
    validate-on-migrate: true
```

**Giải thích:**
- `enabled: true` - Bật Flyway
- `locations: classpath:db/migration` - Thư mục chứa migration files
- `baseline-on-migrate: false` - Không baseline (database mới)
- `validate-on-migrate: true` - Validate migrations khi khởi động

#### Quy trình Flyway chạy migrations:

1. **Khi Spring Boot khởi động:**
   - Flyway quét thư mục `db/migration`
   - Kiểm tra bảng `flyway_schema_history` để xem migrations nào đã chạy
   - Chạy các migrations chưa được áp dụng theo thứ tự version
   - Ghi lại vào `flyway_schema_history`

2. **Bảng `flyway_schema_history`:**
   - Lưu trữ lịch sử migrations đã chạy
   - Cột: `installed_rank`, `version`, `description`, `type`, `script`, `checksum`, `installed_on`, `success`

---

## 📊 PHẦN 2: TẠO DỮ LIỆU (DATA SEEDING)

### 2.1. Cách Dữ Liệu Được Tạo Tự Động

Dữ liệu mẫu được tạo tự động bằng **DataSeeder** class trong mỗi service.

#### Cấu trúc DataSeeder:

**File:** `backend/auth-service/src/main/java/ptit/drl/auth/config/DataSeeder.java`

```java
package ptit.drl.auth.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import ptit.drl.auth.entity.*;
import ptit.drl.auth.repository.*;

@Component
public class DataSeeder implements CommandLineRunner {
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PermissionRepository permissionRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        // Chỉ seed nếu database trống
        if (roleRepository.count() > 0) {
            return; // Đã có dữ liệu, không seed lại
        }
        
        // 1. Tạo Permissions
        Permission permStudentViewOwn = new Permission("STUDENT:READ_OWN", "Xem thông tin sinh viên của chính mình");
        Permission permStudentViewAll = new Permission("STUDENT:READ_ALL", "Xem thông tin tất cả sinh viên");
        // ... thêm permissions khác
        
        permissionRepository.save(permStudentViewOwn);
        permissionRepository.save(permStudentViewAll);
        // ...
        
        // 2. Tạo Roles và gán permissions
        Role roleStudent = new Role("STUDENT", "Sinh viên");
        roleStudent.addPermission(permStudentViewOwn);
        roleStudent.addPermission(permEvaluationCreate);
        // ...
        roleRepository.save(roleStudent);
        
        // 3. Tạo Users mẫu
        User adminUser = new User("admin", "admin@ptit.edu.vn", 
                passwordEncoder.encode("Admin123!"), "Administrator");
        adminUser.addRole(roleAdmin);
        userRepository.save(adminUser);
        
        // ... tạo các users khác
    }
}
```

#### Cách hoạt động:

1. **`@Component`** - Spring tự động phát hiện và khởi tạo class này
2. **`CommandLineRunner`** - Interface cho phép chạy code sau khi Spring Boot khởi động xong
3. **`run()`** - Method được gọi tự động khi ứng dụng khởi động
4. **Kiểm tra dữ liệu:** `if (roleRepository.count() > 0)` - Chỉ seed nếu database trống

---

### 2.2. Các DataSeeder trong Hệ Thống

#### 1. Auth Service DataSeeder

**File:** `backend/auth-service/src/main/java/ptit/drl/auth/config/DataSeeder.java`

**Tạo:**
- **Permissions:** STUDENT:READ_OWN, STUDENT:READ_ALL, EVALUATION:CREATE, ...
- **Roles:** STUDENT, CLASS_MONITOR, UNION_REPRESENTATIVE, ADVISOR, FACULTY_INSTRUCTOR, CTSV_STAFF, INSTITUTE_COUNCIL, INSTRUCTOR, ADMIN
- **Users mẫu:**
  - `admin` / `Admin123!` - ADMIN
  - `student` / `Student123!` - STUDENT (N21DCCN002)
  - `classmonitor` / `Monitor123!` - CLASS_MONITOR (N21DCCN001)
  - `unionrep` / `Union123!` - UNION_REPRESENTATIVE (N21DCCN050)
  - `advisor` / `Advisor123!` - ADVISOR
  - `faculty` / `Faculty123!` - FACULTY_INSTRUCTOR
  - `ctsv` / `Ctsv123!` - CTSV_STAFF
  - `council` / `Council123!` - INSTITUTE_COUNCIL
  - `instructor` / `Instructor123!` - INSTRUCTOR

#### 2. Student Service DataSeeder

**File:** `backend/student-service/src/main/java/ptit/drl/student/config/DataSeeder.java`

**Tạo:**
- **Faculties:** CNTT2, VT2, DT2, QTKD2
- **Majors:** CN, PT, AT, VT, DT, QT, MR, KT
- **Classes:** D21CQCN01-N, D21CQCN02-N, D21CQPT01-N, ...
- **Students:** N21DCCN001, N21DCCN002, N21DCCN050, N21DCPT001, ...

#### 3. Evaluation Service DataSeeder

**File:** `backend/evaluation-service/src/main/java/ptit/drl/evaluation/config/DataSeeder.java`

**Tạo:**
- **Rubric:** "Phiếu đánh giá Kết quả Rèn luyện" (100 điểm)
- **Criteria:** 5 tiêu chí (20đ, 25đ, 20đ, 25đ, 10đ)
- **Evaluation Periods:** Đợt 1 - Học kỳ 1 năm học 2024-2025

---

## 🔧 PHẦN 3: CÁCH TẠO MỚI DATABASE VÀ DỮ LIỆU

### 3.1. Tạo Migration Mới

#### Bước 1: Tạo file migration SQL

**Ví dụ:** Thêm cột mới vào bảng `users`

**File:** `backend/auth-service/src/main/resources/db/migration/V2__add_phone_to_users.sql`

```sql
-- ============================================
-- Migration: V2 - Add phone column to users
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

COMMENT ON COLUMN users.phone IS 'User phone number';
```

#### Bước 2: Đặt tên file đúng format

- ✅ Đúng: `V2__add_phone_to_users.sql`
- ❌ Sai: `V2_add_phone_to_users.sql` (thiếu `__`)
- ❌ Sai: `v2__add_phone_to_users.sql` (chữ thường)
- ❌ Sai: `V2_add_phone.sql` (thiếu `__`)

#### Bước 3: Restart service

Khi service khởi động lại, Flyway tự động chạy migration mới.

```bash
# Restart service trong Docker
docker-compose restart auth-service

# Hoặc rebuild
docker-compose up -d --build auth-service
```

### 3.2. Thêm Dữ Liệu Mới vào DataSeeder

#### Bước 1: Mở file DataSeeder

**File:** `backend/auth-service/src/main/java/ptit/drl/auth/config/DataSeeder.java`

#### Bước 2: Thêm logic tạo dữ liệu

```java
@Override
public void run(String... args) throws Exception {
    if (roleRepository.count() > 0) {
        return;
    }
    
    // ... existing code ...
    
    // Thêm Role mới
    Role roleNewRole = new Role("NEW_ROLE", "Mô tả role mới");
    roleNewRole.addPermission(permStudentViewAll);
    roleRepository.save(roleNewRole);
    
    // Thêm User mới
    User newUser = new User("newuser", "newuser@ptit.edu.vn",
            passwordEncoder.encode("NewUser123!"), "Tên Người Dùng Mới");
    newUser.addRole(roleNewRole);
    userRepository.save(newUser);
}
```

#### Bước 3: Xóa dữ liệu cũ (nếu muốn seed lại)

```sql
-- Kết nối vào database
docker-compose exec postgres psql -U drl -d drl_auth

-- Xóa dữ liệu
DELETE FROM user_roles;
DELETE FROM users;
DELETE FROM role_permissions;
DELETE FROM roles;
DELETE FROM permissions;
```

#### Bước 4: Restart service

```bash
docker-compose restart auth-service
```

---

## 📝 PHẦN 4: QUY TRÌNH HOÀN CHỈNH

### 4.1. Lần Đầu Setup (Fresh Install)

1. **Start Docker Compose:**
   ```bash
   cd infra
   docker-compose up -d
   ```

2. **PostgreSQL tạo databases:**
   - Script `init-multiple-databases.sh` chạy tự động
   - Tạo `drl_auth`, `drl_student`, `drl_evaluation`

3. **Services khởi động:**
   - Flyway chạy migrations → Tạo bảng
   - DataSeeder chạy → Tạo dữ liệu mẫu

4. **Kết quả:**
   - Database có schema (bảng)
   - Database có dữ liệu mẫu

### 4.2. Thêm Migration Mới

1. **Tạo file migration:**
   ```
   backend/{service}/src/main/resources/db/migration/V{N}__{description}.sql
   ```

2. **Viết SQL:**
   ```sql
   ALTER TABLE users ADD COLUMN new_column VARCHAR(100);
   ```

3. **Restart service:**
   ```bash
   docker-compose restart {service}
   ```

4. **Kiểm tra:**
   ```bash
   docker-compose logs {service} | grep flyway
   ```

### 4.3. Thêm Dữ Liệu Mới

1. **Sửa DataSeeder:**
   ```java
   // Thêm code tạo dữ liệu mới
   ```

2. **Xóa dữ liệu cũ (nếu cần):**
   ```sql
   DELETE FROM table_name;
   ```

3. **Restart service:**
   ```bash
   docker-compose restart {service}
   ```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Thứ Tự Migration

- Migrations chạy theo thứ tự version (V1, V2, V3, ...)
- Không được sửa migrations đã chạy (sẽ gây checksum mismatch)
- Nếu cần sửa, tạo migration mới để thay đổi

### 2. DataSeeder Chỉ Chạy Khi Database Trống

- DataSeeder kiểm tra `if (repository.count() > 0)` trước khi seed
- Nếu đã có dữ liệu, sẽ không seed lại
- Muốn seed lại, phải xóa dữ liệu trước

### 3. Database Per Service

- Mỗi service có database riêng
- Không có Foreign Key giữa các database
- Giao tiếp giữa services qua REST API (Feign Client)

### 4. Flyway Schema History

- Bảng `flyway_schema_history` lưu lịch sử migrations
- Không được xóa hoặc sửa bảng này thủ công
- Flyway tự động quản lý

---

## 🔍 KIỂM TRA VÀ DEBUG

### Kiểm tra migrations đã chạy:

```bash
# Kết nối vào database
docker-compose exec postgres psql -U drl -d drl_auth

# Xem lịch sử migrations
SELECT * FROM flyway_schema_history ORDER BY installed_rank;
```

### Kiểm tra dữ liệu đã seed:

```bash
# Xem số lượng roles
docker-compose exec postgres psql -U drl -d drl_auth -c "SELECT COUNT(*) FROM roles;"

# Xem users
docker-compose exec postgres psql -U drl -d drl_auth -c "SELECT username, email FROM users;"
```

### Xem logs Flyway:

```bash
docker-compose logs auth-service | grep -i flyway
```

### Xem logs DataSeeder:

```bash
docker-compose logs auth-service | grep -i seeder
```

---

## 📚 TÀI LIỆU THAM KHẢO

- **Flyway Documentation:** https://flywaydb.org/documentation/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Spring Boot Data Seeding:** https://www.baeldung.com/spring-boot-data-sql-and-schema-sql

---

## ✅ TÓM TẮT

1. **Database được tạo tự động** qua `init-multiple-databases.sh` khi Docker khởi động
2. **Schema (bảng) được tạo** qua Flyway migrations trong `db/migration/`
3. **Dữ liệu mẫu được tạo** qua DataSeeder class khi service khởi động lần đầu
4. **Thêm migration mới:** Tạo file `V{N}__{description}.sql` và restart service
5. **Thêm dữ liệu mới:** Sửa DataSeeder, xóa dữ liệu cũ (nếu cần), restart service

