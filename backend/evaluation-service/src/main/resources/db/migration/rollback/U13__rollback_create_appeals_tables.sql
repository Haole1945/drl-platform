-- ============================================
-- Rollback: Create Appeals System Tables
-- Version: U13 (Undo V13)
-- Description: Rollback for appeals system tables creation
-- Date: 2024-12-19
-- Author: Kiro AI
-- ============================================
-- WARNING: This will undo V13 migration
-- All appeals data will be permanently deleted
-- ============================================

-- ============================================
-- PRE-ROLLBACK CHECKS
-- ============================================

DO $$
BEGIN
    -- Verify migration was actually applied
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'appeals'
    ) THEN
        RAISE EXCEPTION 'Migration V13 was not applied. Nothing to rollback.';
    END IF;
    
    RAISE NOTICE 'Pre-rollback checks passed';
END $$;

-- Check for data that will be lost
DO $$
DECLARE
    appeals_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO appeals_count FROM appeals;
    
    IF appeals_count > 0 THEN
        RAISE WARNING '% appeals will be permanently deleted', appeals_count;
        RAISE NOTICE 'Consider backing up appeals data before proceeding';
    ELSE
        RAISE NOTICE 'No appeals data to lose';
    END IF;
END $$;

-- ============================================
-- BACKUP BEFORE ROLLBACK
-- ============================================

-- Uncomment to backup appeals data
-- CREATE TABLE appeals_backup_v13 AS SELECT * FROM appeals;
-- CREATE TABLE appeal_criteria_backup_v13 AS SELECT * FROM appeal_criteria;
-- CREATE TABLE appeal_files_backup_v13 AS SELECT * FROM appeal_files;
-- 
-- COMMENT ON TABLE appeals_backup_v13 IS 
-- 'Backup before V13 rollback. Safe to drop after verification.';

-- ============================================
-- ACTUAL ROLLBACK
-- ============================================

BEGIN;

-- Drop tables in reverse order (child tables first)
DROP TABLE IF EXISTS appeal_files CASCADE;
DROP TABLE IF EXISTS appeal_criteria CASCADE;
DROP TABLE IF EXISTS appeals CASCADE;

-- Remove appeal_deadline_days column from evaluation_periods
ALTER TABLE evaluation_periods 
DROP COLUMN IF EXISTS appeal_deadline_days;

COMMIT;

-- ============================================
-- POST-ROLLBACK VALIDATION
-- ============================================

DO $$
BEGIN
    -- Verify appeals table was removed
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'appeals'
    ) THEN
        RAISE EXCEPTION 'Rollback failed: appeals table still exists';
    END IF;
    
    -- Verify appeal_criteria table was removed
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'appeal_criteria'
    ) THEN
        RAISE EXCEPTION 'Rollback failed: appeal_criteria table still exists';
    END IF;
    
    -- Verify appeal_files table was removed
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'appeal_files'
    ) THEN
        RAISE EXCEPTION 'Rollback failed: appeal_files table still exists';
    END IF;
    
    -- Verify appeal_deadline_days column was removed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evaluation_periods' AND column_name = 'appeal_deadline_days'
    ) THEN
        RAISE EXCEPTION 'Rollback failed: appeal_deadline_days column still exists';
    END IF;
    
    RAISE NOTICE 'Rollback U13 completed successfully';
    RAISE NOTICE 'Removed tables: appeals, appeal_criteria, appeal_files';
    RAISE NOTICE 'Removed column: evaluation_periods.appeal_deadline_days';
END $$;

-- ============================================
-- NOTES
-- ============================================
-- 1. This rollback script must be run manually
-- 2. Flyway does not automatically run rollback scripts
-- 3. All appeals data will be permanently deleted
-- 4. Backup tables (if created) should be manually dropped after verification
-- 5. Test rollback on staging environment first
