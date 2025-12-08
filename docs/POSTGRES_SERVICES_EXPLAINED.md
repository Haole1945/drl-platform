# PostgreSQL Services Explanation
## DRL Platform - Database Architecture

---

## 📊 Tổng Quan

Trong hệ thống DRL Platform, **một PostgreSQL instance duy nhất** chạy như một container Docker và chứa **4 databases riêng biệt** cho 4 microservices khác nhau.

---

## 🗄️ PostgreSQL Container

### Configuration (docker-compose.yml)

```yaml
postgres:
  image: postgres:16
  container_name: drl-postgres
  environment:
    POSTGRES_USER: drl
    POSTGRES_PASSWORD: drl
    POSTGRES_INITDB_ARGS: "-E UTF8 --locale=C"
  ports:
    - "5432:5432"
  volumes:
    - dbdata:/var/lib/postgresql/data
    - ./db/init-multiple-databases.sh:/docker-entrypoint-initdb.d/init-multiple-databases.sh
  healthcheck:
    test: ["CMD-SHELL","pg_isready -U drl"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 20s
```

### Chức năng:

1. **Single PostgreSQL Instance**: Chỉ có **một container PostgreSQL** chạy trên port `5432`
2. **Multiple Databases**: Chứa **4 databases riêng biệt**:
   - `drl_auth` → cho **auth-service**
   - `drl_student` → cho **student-service**
   - `drl_evaluation` → cho **evaluation-service**
   - `drl_ai_validation` → cho **ai-validation-service**
3. **Database Initialization**: Sử dụng script `init-multiple-databases.sh` để tự động tạo các databases khi container khởi động lần đầu

---

## 📁 Database Initialization Script

### File: `infra/db/init-multiple-databases.sh`

```bash
#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE drl_auth;
    CREATE DATABASE drl_student;
    CREATE DATABASE drl_evaluation;
    CREATE DATABASE drl_ai_validation;
    
    GRANT ALL PRIVILEGES ON DATABASE drl_auth TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE drl_student TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE drl_evaluation TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE drl_ai_validation TO $POSTGRES_USER;
EOSQL
```

**Chức năng:**
- Tự động chạy khi container PostgreSQL khởi động lần đầu (do mount vào `/docker-entrypoint-initdb.d/`)
- Tạo 4 databases riêng biệt
- Cấp quyền cho user `drl` trên tất cả databases

---

## 🔌 Service Connections

### 1. **auth-service** → `drl_auth`
```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/drl_auth
  SPRING_DATASOURCE_USERNAME: drl
  SPRING_DATASOURCE_PASSWORD: drl
```

**Tables:**
- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`

---

### 2. **student-service** → `drl_student`
```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/drl_student
  SPRING_DATASOURCE_USERNAME: drl
  SPRING_DATASOURCE_PASSWORD: drl
```

**Tables:**
- `faculties`
- `majors`
- `classes`
- `students`

---

### 3. **evaluation-service** → `drl_evaluation`
```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/drl_evaluation
  SPRING_DATASOURCE_USERNAME: drl
  SPRING_DATASOURCE_PASSWORD: drl
```

**Tables:**
- `rubrics`
- `criteria`
- `sub_criteria`
- `evaluations`
- `evaluation_details`
- `evaluation_sub_criteria_scores`
- `evaluation_history`
- `evaluation_periods`
- `evidence_files`
- `class_approvals`
- `notifications`

---

### 4. **ai-validation-service** → `drl_ai_validation`
```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/drl_ai_validation
  SPRING_DATASOURCE_USERNAME: drl
  SPRING_DATASOURCE_PASSWORD: drl
```

**Tables:**
- `evidence_validations`

---

## 🎯 Database-per-Service Pattern

### Kiến trúc hiện tại:

```
┌─────────────────────────────────────┐
│      PostgreSQL Container           │
│      (Port 5432)                    │
│                                     │
│  ┌──────────────┐  ┌──────────────┐│
│  │  drl_auth    │  │ drl_student  ││
│  │              │  │              ││
│  │ auth-service │  │student-service││
│  └──────────────┘  └──────────────┘│
│                                     │
│  ┌──────────────┐  ┌──────────────┐│
│  │drl_evaluation│  │drl_ai_validation│
│  │              │  │              ││
│  │evaluation-svc│  │ai-validation-svc│
│  └──────────────┘  └──────────────┘│
└─────────────────────────────────────┘
```

### Ưu điểm:

1. **Data Isolation**: Mỗi service có database riêng, tránh ảnh hưởng lẫn nhau
2. **Independent Scaling**: Có thể scale từng service độc lập
3. **Schema Evolution**: Mỗi service có thể thay đổi schema mà không ảnh hưởng services khác
4. **Security**: Mỗi service chỉ truy cập database của mình
5. **Single Container**: Dễ quản lý, chỉ cần một PostgreSQL container

### Nhược điểm:

1. **Shared Infrastructure**: Tất cả databases chạy trên cùng một PostgreSQL instance
2. **Single Point of Failure**: Nếu PostgreSQL container down, tất cả services bị ảnh hưởng
3. **Resource Sharing**: Tất cả databases chia sẻ CPU, memory, disk I/O

---

## 🔄 Migration Management

### Flyway Migrations

Mỗi service sử dụng **Flyway** để quản lý database migrations:

```yaml
# application.yml của mỗi service
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false
    validate-on-migrate: true
```

**Migration Files:**
- `auth-service`: `V1__create_auth_tables.sql`, `V10__remove_union_representative.sql`
- `student-service`: `V1__create_student_tables.sql`
- `evaluation-service`: `V1__Create_evaluation_tables.sql`, `V2__Insert_initial_data.sql`, `V3__Create_notifications_table.sql`, etc.
- `ai-validation-service`: `V1__create_validation_tables.sql`

---

## 🔍 Health Check

```yaml
healthcheck:
  test: ["CMD-SHELL","pg_isready -U drl"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 20s
```

**Chức năng:**
- Kiểm tra PostgreSQL có sẵn sàng nhận connections không
- Các services khác sẽ đợi PostgreSQL healthy trước khi khởi động

---

## 📊 Data Persistence

### Volume: `dbdata`

```yaml
volumes:
  dbdata:/var/lib/postgresql/data
```

**Chức năng:**
- Lưu trữ dữ liệu PostgreSQL trên host machine
- Dữ liệu **persistent** ngay cả khi container bị xóa
- Location trên host: Docker volume `dbdata`

**Xem data location:**
```bash
docker volume inspect drl-platform_dbdata
```

---

## 🔐 Security

### Credentials:

- **Username**: `drl`
- **Password**: `drl` (development only - **cần đổi trong production!**)

### Production Recommendations:

1. **Sử dụng secrets management** (Docker secrets, Kubernetes secrets, Vault)
2. **Mật khẩu mạnh** và rotate định kỳ
3. **Network isolation**: Chỉ các services trong `drl-net` có thể truy cập
4. **SSL/TLS**: Enable SSL connections trong production
5. **Backup**: Thiết lập automatic backups

---

## 🚀 Future Improvements

### Option 1: Separate PostgreSQL Containers (True Database-per-Service)

```yaml
postgres-auth:
  image: postgres:16
  environment:
    POSTGRES_DB: drl_auth
    # ...

postgres-student:
  image: postgres:16
  environment:
    POSTGRES_DB: drl_student
    # ...

# etc...
```

**Ưu điểm:**
- True isolation
- Independent scaling
- Independent backup/restore

**Nhược điểm:**
- Tốn nhiều resources hơn
- Phức tạp hơn trong quản lý

---

### Option 2: Managed Database Services

- **AWS RDS**: Managed PostgreSQL
- **Azure Database for PostgreSQL**
- **Google Cloud SQL**

**Ưu điểm:**
- Managed service, không cần maintain
- Auto-scaling, backup, monitoring
- High availability

---

## 📝 Tóm Tắt

| Aspect | Description |
|--------|-------------|
| **Container** | 1 PostgreSQL container (postgres:16) |
| **Databases** | 4 databases riêng biệt |
| **Port** | 5432 |
| **User** | `drl` |
| **Password** | `drl` (development) |
| **Volume** | `dbdata` (persistent storage) |
| **Migration** | Flyway per service |
| **Pattern** | Database-per-Service (shared infrastructure) |

---

**Lưu ý:** Đây là kiến trúc **development/staging**. Trong production, nên:
- Tách riêng PostgreSQL containers hoặc dùng managed services
- Sử dụng strong passwords và secrets management
- Enable SSL/TLS
- Setup monitoring và alerts
- Regular backups

