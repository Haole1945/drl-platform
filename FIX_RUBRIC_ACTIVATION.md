# Hướng Dẫn Fix Lỗi Rubric Activation

## Vấn Đề

- Frontend gửi `isActive=false` nhưng backend vẫn trả về `isActive=true`
- Dữ liệu không được lưu vào database

## Nguyên Nhân

1. **Migration file bị conflict**: Có 2 file V3 migration
2. **Database chưa có cột `target_classes`**

## Giải Pháp

### Bước 1: Fix Migration File

✅ **ĐÃ FIX**: Đổi tên file từ `V3__add_target_classes_to_rubrics.sql` → `V4__add_target_classes_to_rubrics.sql`

### Bước 2: Chạy Migration Thủ Công (Nếu Cần)

Nếu Flyway không tự động chạy migration, hãy chạy SQL thủ công:

```bash
# Kết nối vào MySQL
mysql -u root -p drl_evaluation

# Hoặc dùng MySQL Workbench, DBeaver, etc.
```

Sau đó chạy các lệnh trong file `backend/evaluation-service/manual-migration.sql`:

```sql
-- Kiểm tra xem cột đã tồn tại chưa
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'drl_evaluation'
  AND TABLE_NAME = 'rubrics'
  AND COLUMN_NAME = 'target_classes';

-- Thêm cột nếu chưa có
ALTER TABLE rubrics
ADD COLUMN IF NOT EXISTS target_classes VARCHAR(500) NULL;

-- Thêm index
CREATE INDEX IF NOT EXISTS idx_rubrics_target_classes ON rubrics(target_classes);

-- Kiểm tra kết quả
DESCRIBE rubrics;
```

### Bước 3: Restart Backend Service

```bash
# Dừng service hiện tại (Ctrl+C)

# Rebuild
cd backend/evaluation-service
mvn clean install -DskipTests

# Restart
mvn spring-boot:run
```

**Hoặc nếu dùng Docker:**

```bash
docker-compose restart evaluation-service
```

### Bước 4: Test Bằng Script

Chạy script test tự động:

```powershell
.\test-rubric-update.ps1
```

Script sẽ:

1. ✅ Login
2. ✅ Get rubric hiện tại
3. ✅ Update với `isActive=false` và `targetClasses=D21CQCN01-N`
4. ✅ Verify kết quả

**Kết quả mong đợi:**

```
🎉 ALL TESTS PASSED! 🎉
```

### Bước 5: Test Trên UI

1. Mở http://localhost:3000/admin/system-config
2. Chọn một rubric
3. **Tắt** toggle "Kích hoạt Rubric"
4. Nhập class codes: `D21CQCN01-N, D20CQCN01-N`
5. Nhấn **Lưu**
6. Kiểm tra:
   - ✅ Badge "Active" phải **biến mất**
   - ✅ Class badges phải **hiển thị**

## Kiểm Tra Logs

### Frontend Console (F12):

```
🔍 DEBUG - isActive value: false
📤 API - Request URL: /rubrics/1?...&isActive=false&targetClasses=D21CQCN01-N
```

### Backend Terminal:

```
🔍 BACKEND - isActive: false
🔍 SERVICE - Setting isActive to: false
🔍 SERVICE - After save - updated.isActive: false
```

## Nếu Vẫn Không Hoạt Động

### 1. Kiểm tra Database

```sql
-- Xem cấu trúc bảng
DESCRIBE rubrics;

-- Kiểm tra dữ liệu
SELECT id, name, is_active, target_classes FROM rubrics;

-- Test update trực tiếp
UPDATE rubrics SET is_active = false, target_classes = 'TEST' WHERE id = 1;
SELECT id, name, is_active, target_classes FROM rubrics WHERE id = 1;
```

### 2. Kiểm tra Flyway Migration History

```sql
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC;
```

Phải thấy:

- V1\_\_Create_evaluation_tables
- V2\_\_Insert_initial_data
- V3\_\_Create_notifications_table
- V4\_\_add_target_classes_to_rubrics ← **Phải có dòng này**

### 3. Nếu V4 Chưa Chạy

Xóa cache Flyway và restart:

```sql
-- Xóa entry V4 nếu có lỗi
DELETE FROM flyway_schema_history WHERE version = '4';
```

Sau đó restart service để Flyway chạy lại migration.

## Files Đã Thay Đổi

### Backend

- ✅ `RubricController.java` - Added `isActive` and `targetClasses` parameters
- ✅ `RubricService.java` - Added logic to update fields
- ✅ `Rubric.java` - Added `targetClasses` field
- ✅ `RubricDTO.java` - Added `targetClasses` field
- ✅ `RubricMapper.java` - Added mapping for `targetClasses`
- ✅ `V4__add_target_classes_to_rubrics.sql` - Migration file (renamed from V3)

### Frontend

- ✅ `evaluation.ts` - Added parameters to API calls
- ✅ `types.ts` - Added `targetClasses` to interfaces
- ✅ `page.tsx` - Added state management
- ✅ `RubricEditor.tsx` - Added UI controls

## Liên Hệ

Nếu vẫn gặp vấn đề, gửi cho tôi:

1. Output của `DESCRIBE rubrics;`
2. Output của `SELECT * FROM flyway_schema_history;`
3. Backend terminal logs khi start service
4. Kết quả của script `test-rubric-update.ps1`
