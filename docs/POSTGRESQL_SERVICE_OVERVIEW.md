# PostgreSQL Service - Tổng Quan và Tác Dụng

## 📊 Tổng Quan

Hệ thống **DRL Platform** sử dụng **1 PostgreSQL instance duy nhất** để lưu trữ dữ liệu cho tất cả các microservices. Đây là kiến trúc **"Database per Service"** trong microservices với shared database server.

---

## 🗄️ Cấu Trúc Database

### 1 PostgreSQL Instance → 4 Databases Riêng Biệt

| Service | Database Name | Port | Connection String |
|---------|---------------|------|-------------------|
| **auth-service** | `drl_auth` | 5432 | `jdbc:postgresql://postgres:5432/drl_auth` |
| **student-service** | `drl_student` | 5432 | `jdbc:postgresql://postgres:5432/drl_student` |
| **evaluation-service** | `drl_evaluation` | 5432 | `jdbc:postgresql://postgres:5432/drl_evaluation` |
| **ai-validation-service** | `drl_ai_validation` | 5432 | `jdbc:postgresql://postgres:5432/drl_ai_validation` |

**Lưu ý:** Tất cả databases đều chạy trên cùng 1 PostgreSQL server, nhưng **tách biệt về mặt logic** (schema isolation).

---

## 🎯 Tác Dụng Chính của PostgreSQL Service

### 1. **Lưu Trữ Dữ Liệu Bền Vững (Persistent Storage)**

PostgreSQL đóng vai trò là **persistent storage layer** cho toàn bộ hệ thống:

- ✅ **Dữ liệu được lưu trữ trên disk** (không mất khi container restart)
- ✅ **ACID compliance**: Đảm bảo tính nhất quán dữ liệu
- ✅ **Transaction support**: Hỗ trợ transaction để đảm bảo data integrity

**Ví dụ:**
- User accounts, roles, permissions → `drl_auth`
- Student information, classes, faculties → `drl_student`
- Evaluations, rubrics, scores → `drl_evaluation`
- AI validation results → `drl_ai_validation`

---

### 2. **Tách Biệt Dữ Liệu Theo Service (Database Isolation)**

Mỗi microservice có database riêng, đảm bảo:

- ✅ **Data independence**: Mỗi service quản lý schema riêng
- ✅ **Schema evolution**: Có thể thay đổi schema mà không ảnh hưởng services khác
- ✅ **Security**: Mỗi service chỉ truy cập database của mình
- ✅ **Team autonomy**: Các team có thể làm việc độc lập trên database riêng

**Ví dụ:**
- `auth-service` không cần biết về cấu trúc bảng `evaluations`
- `student-service` không cần biết về `user_roles` table

---

### 3. **Hỗ Trợ SQL Queries và Relations**

PostgreSQL cung cấp:

- ✅ **SQL standard**: Sử dụng SQL để query dữ liệu
- ✅ **Foreign Keys**: Hỗ trợ referential integrity
- ✅ **Indexes**: Tối ưu query performance
- ✅ **Complex queries**: JOINs, aggregations, subqueries
- ✅ **Stored procedures/triggers**: Business logic trong database

**Ví dụ:**
```sql
-- Lấy evaluation với criteria details
SELECT e.*, ed.score, c.name as criteria_name
FROM evaluations e
JOIN evaluation_details ed ON e.id = ed.evaluation_id
JOIN criteria c ON ed.criteria_id = c.id
WHERE e.student_code = 'N21DCCN002';
```

---

### 4. **Migration Management (Flyway)**

PostgreSQL được quản lý bằng **Flyway migrations**:

- ✅ **Version control**: Schema changes được track qua migrations
- ✅ **Reproducible**: Có thể tạo lại database từ migrations
- ✅ **Rollback support**: Có thể rollback migrations khi cần
- ✅ **Team collaboration**: Migration files được commit vào Git

**Ví dụ:**
```sql
-- V1__Create_evaluation_tables.sql
-- V2__Insert_initial_data.sql
-- V3__Create_notifications_table.sql
-- ...
```

---

### 5. **Data Persistence Across Container Restarts**

Dữ liệu được lưu trong **Docker volume** (`dbdata`):

- ✅ **Persistent volume**: Dữ liệu không mất khi container restart
- ✅ **Backup support**: Có thể backup/restore volume
- ✅ **Development**: Dữ liệu được giữ lại giữa các lần chạy `docker-compose down/up`

**Volume mapping:**
```yaml
volumes:
  - dbdata:/var/lib/postgresql/data
```

---

### 6. **Connection Pooling và Performance**

PostgreSQL hỗ trợ:

- ✅ **Connection pooling**: HikariCP trong Spring Boot
- ✅ **Query optimization**: Query planner và optimizer
- ✅ **Caching**: Shared buffers và cache
- ✅ **Concurrent access**: Multiple connections từ các services

**Cấu hình HikariCP:**
```yaml
hikari:
  maximum-pool-size: 20
  minimum-idle: 5
  connection-timeout: 30000
```

---

### 7. **Advanced Features**

PostgreSQL cung cấp các tính năng nâng cao:

- ✅ **JSONB support**: Lưu trữ JSON data với indexing (cho metadata)
- ✅ **Full-text search**: Tìm kiếm text nhanh
- ✅ **Array types**: Lưu trữ arrays
- ✅ **Custom types**: Tạo user-defined types
- ✅ **Partitioning**: Table partitioning cho big data

**Ví dụ sử dụng JSONB:**
```sql
-- Trong ai-validation-service
validation_metadata JSONB  -- Lưu raw OpenAI response
```

---

## 🔧 Cấu Hình PostgreSQL Service

### Docker Compose Configuration

```yaml
postgres:
  image: postgres:16              # PostgreSQL version 16
  container_name: drl-postgres
  environment:
    POSTGRES_USER: drl
    POSTGRES_PASSWORD: drl
    POSTGRES_INITDB_ARGS: "-E UTF8 --locale=C"
  ports:
    - "5432:5432"                 # Expose port 5432
  volumes:
    - dbdata:/var/lib/postgresql/data                    # Persistent storage
    - ./db/init-multiple-databases.sh:/docker-entrypoint-initdb.d/init-multiple-databases.sh  # Init script
  healthcheck:
    test: ["CMD-SHELL","pg_isready -U drl"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 20s
  restart: unless-stopped
  shm_size: 256mb                 # Shared memory for performance
```

---

### Database Initialization

Script `init-multiple-databases.sh` tự động tạo 4 databases khi container khởi động lần đầu:

```bash
CREATE DATABASE drl_auth;
CREATE DATABASE drl_student;
CREATE DATABASE drl_evaluation;
CREATE DATABASE drl_ai_validation;
```

---

## 🔗 Kết Nối Từ Services

### auth-service
```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/drl_auth
SPRING_DATASOURCE_USERNAME: drl
SPRING_DATASOURCE_PASSWORD: drl
```

### student-service
```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/drl_student
```

### evaluation-service
```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/drl_evaluation
```

### ai-validation-service
```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/drl_ai_validation
```

---

## 📈 Lợi Ích của Kiến Trúc Này

### ✅ Ưu Điểm

1. **Centralized Management**
   - Dễ quản lý 1 PostgreSQL instance
   - Backup/restore đơn giản
   - Monitoring tập trung

2. **Resource Efficiency**
   - Chia sẻ resources (CPU, memory) giữa các databases
   - Giảm overhead so với nhiều PostgreSQL instances

3. **Cost Effective**
   - Chỉ cần 1 server/instance
   - Phù hợp cho development và small-medium production

4. **Schema Isolation**
   - Mỗi service có database riêng
   - Tránh conflict khi thay đổi schema

### ⚠️ Hạn Chế

1. **Single Point of Failure**
   - Nếu PostgreSQL down, tất cả services bị ảnh hưởng
   - **Giải pháp**: Sử dụng PostgreSQL replication hoặc cluster

2. **Scalability**
   - Khó scale từng database riêng lẻ
   - **Giải pháp**: Tách thành nhiều PostgreSQL instances nếu cần

3. **Performance**
   - Tất cả databases chia sẻ resources
   - **Giải pháp**: Tune PostgreSQL config và monitoring

---

## 🛠️ Quản Lý và Bảo Trì

### Truy Cập PostgreSQL

```bash
# Từ host machine
psql -h localhost -p 5432 -U drl -d drl_auth

# Từ Docker container
docker exec -it drl-postgres psql -U drl -d drl_auth
```

### Backup Database

```bash
# Backup single database
docker exec drl-postgres pg_dump -U drl drl_auth > backup_auth.sql

# Backup all databases
docker exec drl-postgres pg_dumpall -U drl > backup_all.sql
```

### Restore Database

```bash
# Restore single database
docker exec -i drl-postgres psql -U drl drl_auth < backup_auth.sql
```

---

## 📚 Tài Liệu Tham Khảo

- **PostgreSQL Official Docs**: https://www.postgresql.org/docs/
- **PostgreSQL Docker Image**: https://hub.docker.com/_/postgres
- **Flyway Documentation**: https://flywaydb.org/documentation/
- **Spring Boot Data Access**: https://spring.io/guides/gs/accessing-data-jpa/

---

## 🎯 Kết Luận

PostgreSQL service là **backbone** của hệ thống DRL Platform, đóng vai trò:

1. ✅ **Persistent storage** cho tất cả dữ liệu
2. ✅ **Data isolation** giữa các microservices
3. ✅ **ACID compliance** và data integrity
4. ✅ **SQL querying** và relational features
5. ✅ **Migration management** qua Flyway
6. ✅ **Performance optimization** với connection pooling và indexing

**Lưu ý:** Kiến trúc này phù hợp cho **development** và **small-medium production**. Với **large-scale production**, nên cân nhắc:
- PostgreSQL replication (Master-Slave)
- Database per service với separate instances
- Read replicas cho read-heavy workloads





