-- ============================================
-- Rollback: Remove created_by column
-- Version: U8 (Undo V8)
-- Description: Rollback audit trail feature
-- Date: 2025-11-29
-- ============================================

-- ============================================
-- PRE-ROLLBACK CHECKS
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evaluations' AND column_name = 'created_by'
    ) THEN
        RAISE EXCEPTION 'V8 migration was not applied. Nothing to rollback.';
    END IF;
    
    RAISE NOTICE 'Pre-rollback checks passed';
END $$;

-- Check for data
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    SELECT COUNT(*) INTO affected_rows
    FROM evaluations 
    WHERE created_by IS NOT NULL;
    
    IF affected_rows > 0 THEN
        RAISE WARNING '% evaluations have created_by data that will be lost', affected_rows;
    END IF;
END $$;

-- ============================================
-- BACKUP
-- ============================================

CREATE TABLE IF NOT EXISTS evaluations_created_by_backup AS
SELECT id, created_by, created_at
FROM evaluations 
WHERE created_by IS NOT NULL;

-- ============================================
-- ROLLBACK
-- ============================================

BEGIN;

DROP INDEX IF EXISTS idx_evaluation_created_by;
ALTER TABLE evaluations DROP COLUMN IF EXISTS created_by;

COMMIT;

-- ============================================
-- VALIDATION
-- ============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evaluations' AND column_name = 'created_by'
    ) THEN
        RAISE EXCEPTION 'Rollback failed: Column still exists';
    END IF;
    
    RAISE NOTICE 'Rollback U8 completed successfully';
END $$;
