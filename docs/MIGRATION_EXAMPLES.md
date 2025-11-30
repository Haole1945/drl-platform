# Migration Examples - Rollback & Validation

## Example 1: Add Column with Rollback

### Forward Migration (V9\_\_add_email_to_users.sql)

```sql
-- ============================================
-- Migration: Add email column to users table
-- Version: V9
-- Date: 2025-11-29
-- Author: Team
-- ============================================

-- Add email column
ALTER TABLE users
ADD COLUMN email VARCHAR(255);

-- Add index for email lookups
CREATE INDEX idx_users_email ON users(email);

-- Add comment
COMMENT ON COLUMN users.email IS 'User email address for notifications';
```

### Rollback Migration (U9\_\_rollback_add_email_to_users.sql)

```sql
-- ============================================
-- Rollback: Remove email column from users
-- Version: U9 (Undo V9)
-- ============================================

-- Drop index first
DROP INDEX IF EXISTS idx_users_email;

-- Drop column
ALTER TABLE users
DROP COLUMN IF EXISTS email;
```

**Khi nào dùng:**

- Deploy lỗi → Chạy U9 để quay lại
- Phát hiện bug → Rollback rồi fix
- Thay đổi thiết kế → Undo rồi làm lại

---

## 2. VALIDATION/CHECKS

**Là gì:** Kiểm tra điều kiện **TRƯỚC** và **SAU** khi chạy migration để đảm bảo an toàn.

### Example 2: Safe Column Addition with Validation

```sql
-- ============================================
-- Migration: Add phone_number to users
-- Version: V10
-- With validation checks
-- ============================================

-- ============================================
-- PRE-MIGRATION CHECKS
-- ============================================

-- Check 1: Ensure table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'users'
    ) THEN
        RAISE EXCEPTION 'Table users does not exist. Cannot proceed.';
    END IF;
END $$;

-- Check 2: Ensure column doesn't already exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'phone_number'
    ) THEN
        RAISE EXCEPTION 'Column phone_number already exists. Migration already applied?';
    END IF;
END $$;

-- Check 3: Ensure no data will be lost
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count FROM users;
    IF row_count > 10000 THEN
        RAISE WARNING 'Large table detected (% rows). Migration may take time.', row_count;
    END IF;
END $$;

-- ============================================
-- ACTUAL MIGRATION
-- ============================================

-- Add column with default value (safe for existing rows)
ALTER TABLE users
ADD COLUMN phone_number VARCHAR(20) DEFAULT NULL;

-- Add constraint (phone format validation)
ALTER TABLE users
ADD CONSTRAINT chk_phone_format
CHECK (phone_number IS NULL OR phone_number ~ '^\+?[0-9]{10,15}$');

-- Add index
CREATE INDEX idx_users_phone ON users(phone_number)
WHERE phone_number IS NOT NULL; -- Partial index (more efficient)

-- ============================================
-- POST-MIGRATION VALIDATION
-- ============================================

-- Verify column was added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'phone_number'
    ) THEN
        RAISE EXCEPTION 'Migration failed: Column phone_number was not created';
    END IF;

    RAISE NOTICE 'Migration successful: phone_number column added';
END $$;

-- Verify no data was lost
DO $$
DECLARE
    row_count_before INTEGER := 10; -- Would be stored in a temp table in real scenario
    row_count_after INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count_after FROM users;
    IF row_count_after < row_count_before THEN
        RAISE EXCEPTION 'Data loss detected! Rows before: %, after: %',
                        row_count_before, row_count_after;
    END IF;
END $$;
```

---

## 3. SAFE DATA MIGRATION

### Example 3: Migrate data with validation

```sql
-- ============================================
-- Migration: Split full_name into first_name and last_name
-- Version: V11
-- Complex data migration with rollback safety
-- ============================================

-- ============================================
-- STEP 1: BACKUP DATA (Safety net)
-- ============================================

-- Create backup table
CREATE TABLE users_backup_v11 AS
SELECT * FROM users;

RAISE NOTICE 'Backup created: % rows', (SELECT COUNT(*) FROM users_backup_v11);

-- ============================================
-- STEP 2: ADD NEW COLUMNS
-- ============================================

ALTER TABLE users
ADD COLUMN first_name VARCHAR(100),
ADD COLUMN last_name VARCHAR(100);

-- ============================================
-- STEP 3: MIGRATE DATA
-- ============================================

-- Split full_name into first_name and last_name
UPDATE users
SET
    first_name = SPLIT_PART(full_name, ' ', 1),
    last_name = CASE
        WHEN full_name LIKE '% %'
        THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
        ELSE NULL
    END
WHERE full_name IS NOT NULL;

-- ============================================
-- STEP 4: VALIDATION
-- ============================================

-- Check all rows were processed
DO $$
DECLARE
    unmigrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmigrated_count
    FROM users
    WHERE full_name IS NOT NULL
      AND (first_name IS NULL OR first_name = '');

    IF unmigrated_count > 0 THEN
        RAISE WARNING '% rows could not be migrated', unmigrated_count;
    ELSE
        RAISE NOTICE 'All rows migrated successfully';
    END IF;
END $$;

-- ============================================
-- STEP 5: CLEANUP (Optional - can be done later)
-- ============================================

-- Don't drop full_name yet - keep for safety
-- ALTER TABLE users DROP COLUMN full_name;

-- Keep backup for 30 days
COMMENT ON TABLE users_backup_v11 IS 'Backup before V11 migration. Safe to drop after 2025-12-29';
```

### Rollback for V11:

```sql
-- ============================================
-- Rollback V11: Restore from backup
-- ============================================

-- Restore data from backup
UPDATE users u
SET
    first_name = NULL,
    last_name = NULL
FROM users_backup_v11 b
WHERE u.id = b.id;

-- Drop new columns
ALTER TABLE users
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name;

-- Drop backup
DROP TABLE IF EXISTS users_backup_v11;

RAISE NOTICE 'Rollback complete';
```

---

## 4. TRANSACTION SAFETY

```sql
-- ============================================
-- Migration with transaction control
-- Version: V12
-- ============================================

BEGIN;

-- Set transaction isolation level
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Your migration here
ALTER TABLE evaluations
ADD COLUMN priority INTEGER DEFAULT 0;

-- Validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'evaluations' AND column_name = 'priority'
    ) THEN
        RAISE EXCEPTION 'Migration failed';
    END IF;
END $$;

-- If everything OK, commit
COMMIT;

-- If error occurs, automatic ROLLBACK
```

---

## 5. IDEMPOTENT MIGRATIONS (Safe to run multiple times)

```sql
-- ============================================
-- Idempotent Migration: Can run multiple times safely
-- Version: V13
-- ============================================

-- Add column only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'status'
    ) THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Column status added';
    ELSE
        RAISE NOTICE 'Column status already exists, skipping';
    END IF;
END $$;

-- Create index only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'users' AND indexname = 'idx_users_status'
    ) THEN
        CREATE INDEX idx_users_status ON users(status);
        RAISE NOTICE 'Index idx_users_status created';
    ELSE
        RAISE NOTICE 'Index idx_users_status already exists, skipping';
    END IF;
END $$;
```

---

## Summary

### Rollback:

- ✅ Undo migration nếu có lỗi
- ✅ Quay lại version cũ an toàn
- ✅ Giảm downtime khi deploy fail

### Validation:

- ✅ Check điều kiện trước khi migrate
- ✅ Verify kết quả sau khi migrate
- ✅ Phát hiện lỗi sớm
- ✅ Đảm bảo data integrity

### Best Practices:

1. **Always backup** trước khi migrate data
2. **Test migrations** trên staging trước
3. **Use transactions** để đảm bảo atomicity
4. **Add comments** để document
5. **Keep rollback scripts** sẵn sàng
6. **Validate results** sau mỗi migration
7. **Make idempotent** nếu có thể
