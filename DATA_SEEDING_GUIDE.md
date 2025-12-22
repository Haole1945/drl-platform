# 📊 Data Seeding Guide - Dữ Liệu Mẫu

## 🗂️ Vị Trí Data Mẫu

### 1. Evaluation Periods (Đợt Đánh Giá)

**File:** `backend/evaluation-service/src/main/resources/db/migration/V2__Insert_initial_data.sql`

```sql
INSERT INTO evaluation_periods (name, semester, academic_year, start_date, end_date, is_active, description)
SELECT
    'Đợt 1 - Học kỳ 1 năm học 2024-2025',
    '2024-2025-HK1',
    '2024-2025',
    '2024-09-01'::date,
    '2025-01-31'::date,
    true,
    'Đợt đánh giá điểm rèn luyện học kỳ 1 năm học 2024-2025'
WHERE NOT EXISTS (
    SELECT 1 FROM evaluation_periods WHERE is_active = true
);
```

**Đã sửa:**

- ✅ start_date: 2024-09-01 (thay vì 2025-11-20)
- ✅ end_date: 2025-01-31 (thay vì 2025-12-20)

### 2. Rubrics & Criteria (Tiêu Chí Đánh Giá)

**File:** `backend/evaluation-service/src/main/java/ptit/drl/evaluation/config/DataSeeder.java`

Data được seed bởi Java code, không phải SQL migration.

### 3. Users & Roles (Người Dùng)

**Service:** `auth-service`

**File:** `backend/auth-service/src/main/resources/db/migration/V2__Insert_initial_data.sql`

### 4. Students (Sinh Viên)

**Service:** `student-service`

**File:** `backend/student-service/src/main/resources/db/migration/V2__Insert_initial_data.sql`

## 🔄 Cách Thay Đổi Data Mẫu

### Option 1: Sửa Migration File (Recommended)

1. **Sửa file migration:**

   ```
   backend/evaluation-service/src/main/resources/db/migration/V2__Insert_initial_data.sql
   ```

2. **Reset database:**

   ```bash
   # Xóa database và tạo lại
   docker-compose down -v
   docker-compose up -d
   ```

3. **Flyway sẽ chạy lại migrations** và insert data mới

### Option 2: Update Trực Tiếp Database

```sql
-- Update đợt đánh giá hiện tại
UPDATE evaluation_periods
SET
    start_date = '2024-09-01',
    end_date = '2025-01-31'
WHERE id = 1;
```

### Option 3: Tạo Migration Mới

Tạo file mới: `V14__Update_evaluation_period_dates.sql`

```sql
-- Update evaluation period dates
UPDATE evaluation_periods
SET
    start_date = '2024-09-01',
    end_date = '2025-01-31'
WHERE name = 'Đợt 1 - Học kỳ 1 năm học 2024-2025';
```

## 📝 Lưu Ý Quan Trọng

### 1. Flyway Migrations

- **Không được sửa** migration đã chạy (đã có trong `flyway_schema_history`)
- **Chỉ được thêm** migration mới với version cao hơn
- **Nếu muốn sửa:** Phải reset database (xóa volume)

### 2. Data Seeder (Java)

- Chạy **sau** khi migrations hoàn thành
- Kiểm tra data đã tồn tại trước khi insert
- Có thể chạy lại nhiều lần (idempotent)

### 3. Reset Database

```bash
# Dừng và xóa tất cả (bao gồm volumes)
docker-compose down -v

# Start lại
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f evaluation-service
```

## 🎯 Các File Migration Quan Trọng

### Evaluation Service

```
backend/evaluation-service/src/main/resources/db/migration/
├── V1__Create_tables.sql              # Tạo bảng
├── V2__Insert_initial_data.sql        # Data mẫu đợt đánh giá ⭐
├── V3__Add_rubric_activation.sql      # Thêm cột activation
├── V4__add_target_classes_to_rubrics.sql
├── V5__add_rejection_level.sql
├── V6__add_resubmission_tracking.sql
├── V7__add_created_by_to_evaluations.sql
├── V8__add_grade_classification.sql
├── V9__add_notification_tables.sql
├── V10__add_class_code_to_rubrics.sql
├── V11__add_rubric_name_to_evaluation_periods.sql
├── V12__add_evaluation_period_target_classes.sql
└── V13__create_appeals_tables.sql
```

### Auth Service

```
backend/auth-service/src/main/resources/db/migration/
├── V1__Create_tables.sql
└── V2__Insert_initial_data.sql        # Users & Roles ⭐
```

### Student Service

```
backend/student-service/src/main/resources/db/migration/
├── V1__Create_tables.sql
└── V2__Insert_initial_data.sql        # Students ⭐
```

## 🔍 Kiểm Tra Data Đã Seed

### 1. Evaluation Periods

```sql
docker exec drl-postgres psql -U drl -d drl_evaluation -c "SELECT * FROM evaluation_periods;"
```

### 2. Rubrics

```sql
docker exec drl-postgres psql -U drl -d drl_evaluation -c "SELECT id, name, is_active FROM rubrics;"
```

### 3. Users

```sql
docker exec drl-postgres psql -U drl -d drl_auth -c "SELECT username, role FROM users;"
```

### 4. Students

```sql
docker exec drl-postgres psql -U drl -d drl_student -c "SELECT student_code, full_name, class_code FROM students LIMIT 5;"
```

## 🚀 Rebuild Sau Khi Sửa Migration

Nếu bạn sửa file migration và muốn áp dụng:

```bash
# Option 1: Reset database (recommended)
cd infra
docker-compose down -v
docker-compose up -d

# Option 2: Rebuild service (nếu chỉ sửa code, không sửa migration)
docker-compose build --no-cache evaluation-service
docker-compose up -d evaluation-service
```

## ✅ Tóm Tắt

- ✅ Data mẫu đợt đánh giá: `V2__Insert_initial_data.sql`
- ✅ Đã sửa dates: 01/09/2024 - 31/01/2025
- ✅ Để áp dụng: Reset database hoặc update trực tiếp
- ✅ Không được sửa migration đã chạy (trừ khi reset database)
