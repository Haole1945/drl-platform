-- ============================================
-- Rollback: Remove last_rejection_level column
-- Version: U7 (Undo V7)
-- Description: Rollback smart resubmit feature
-- Date: 2025-11-29
-- ============================================
-- WARNING: This will remove rejection level tracking
-- Smart resubmit feature will stop working
-- ============================================

-- ============================================
-- PRE-ROLLBACK CHECKS
-- ============================================

DO $$
BEGIN
    -- Verify V7 was applied
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evaluations' AND column_name = 'last_rejection_level'
    ) THEN
        RAISE EXCEPTION 'V7 migration was not applied. Nothing to rollback.';
    END IF;
    
    RAISE NOTICE 'Pre-rollback checks passed';
END $$;

-- Check for data that will be lost
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    SELECT COUNT(*) INTO affected_rows
    FROM evaluations 
    WHERE last_rejection_level IS NOT NULL;
    
    IF affected_rows > 0 THEN
        RAISE WARNING '% evaluations have rejection level data that will be lost', affected_rows;
    END IF;
END $$;

-- ============================================
-- BACKUP BEFORE ROLLBACK
-- ============================================

-- Backup rejection level data
CREATE TABLE IF NOT EXISTS evaluations_rejection_level_backup AS
SELECT id, last_rejection_level, updated_at
FROM evaluations 
WHERE last_rejection_level IS NOT NULL;

RAISE NOTICE 'Backed up % rows with rejection level data', 
    (SELECT COUNT(*) FROM evaluations_rejection_level_backup);

-- ============================================
-- ACTUAL ROLLBACK
-- ============================================

BEGIN;

-- Drop index first
DROP INDEX IF EXISTS idx_evaluations_rejection_level;

-- Drop column
ALTER TABLE evaluations 
DROP COLUMN IF EXISTS last_rejection_level;

COMMIT;

-- ============================================
-- POST-ROLLBACK VALIDATION
-- ============================================

DO $$
BEGIN
    -- Verify column was removed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evaluations' AND column_name = 'last_rejection_level'
    ) THEN
        RAISE EXCEPTION 'Rollback failed: Column still exists';
    END IF;
    
    -- Verify index was removed
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'evaluations' AND indexname = 'idx_evaluations_rejection_level'
    ) THEN
        RAISE EXCEPTION 'Rollback failed: Index still exists';
    END IF;
    
    RAISE NOTICE 'Rollback U7 completed successfully';
    RAISE NOTICE 'Backup table: evaluations_rejection_level_backup (can be dropped after verification)';
END $$;
