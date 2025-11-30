-- ============================================
-- Rollback Template
-- Version: UXX (Undo VXX)
-- Description: Rollback for [migration description]
-- Date: YYYY-MM-DD
-- Author: [Your name]
-- ============================================
-- WARNING: This will undo VXX migration
-- Make sure you understand the consequences before running
-- ============================================

-- ============================================
-- PRE-ROLLBACK CHECKS
-- ============================================

DO $$
BEGIN
    -- Verify migration was actually applied
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'your_table' AND column_name = 'your_column'
    ) THEN
        RAISE EXCEPTION 'Migration VXX was not applied. Nothing to rollback.';
    END IF;
    
    RAISE NOTICE 'Pre-rollback checks passed';
END $$;

-- Check for data that will be lost
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Example: Count rows that will lose data
    SELECT COUNT(*) INTO affected_rows
    FROM your_table 
    WHERE your_column IS NOT NULL;
    
    IF affected_rows > 0 THEN
        RAISE WARNING '% rows have data in column that will be dropped', affected_rows;
        RAISE NOTICE 'Consider backing up this data before proceeding';
    END IF;
END $$;

-- ============================================
-- BACKUP BEFORE ROLLBACK (if needed)
-- ============================================

-- Backup data that will be lost
-- CREATE TABLE your_column_backup AS
-- SELECT id, your_column 
-- FROM your_table 
-- WHERE your_column IS NOT NULL;

-- ============================================
-- ACTUAL ROLLBACK
-- ============================================

BEGIN;

-- Drop constraints first
ALTER TABLE your_table
DROP CONSTRAINT IF EXISTS chk_your_column;

-- Drop indexes
DROP INDEX IF EXISTS idx_your_table_your_column;

-- Drop column
ALTER TABLE your_table 
DROP COLUMN IF EXISTS your_column;

-- Restore from backup if needed
-- UPDATE your_table t
-- SET original_column = b.backed_up_value
-- FROM your_table_backup_vXX b
-- WHERE t.id = b.id;

-- Drop backup table if no longer needed
-- DROP TABLE IF EXISTS your_table_backup_vXX;

COMMIT;

-- ============================================
-- POST-ROLLBACK VALIDATION
-- ============================================

DO $$
BEGIN
    -- Verify column was removed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'your_table' AND column_name = 'your_column'
    ) THEN
        RAISE EXCEPTION 'Rollback failed: Column still exists';
    END IF;
    
    -- Verify index was removed
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'your_table' AND indexname = 'idx_your_table_your_column'
    ) THEN
        RAISE EXCEPTION 'Rollback failed: Index still exists';
    END IF;
    
    RAISE NOTICE 'Rollback UXX completed successfully';
END $$;

-- ============================================
-- NOTES
-- ============================================
-- 1. This rollback script should only be run manually
-- 2. Flyway does not automatically run rollback scripts
-- 3. Always backup data before rollback
-- 4. Test rollback on staging first
