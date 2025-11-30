-- ============================================
-- Migration Template
-- Version: VXX
-- Description: [Brief description of what this migration does]
-- Date: YYYY-MM-DD
-- Author: [Your name]
-- Ticket: [JIRA/Issue number if applicable]
-- ============================================

-- ============================================
-- PRE-MIGRATION CHECKS
-- ============================================

-- Check 1: Verify prerequisites
DO $$
BEGIN
    -- Example: Check if required table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'your_table'
    ) THEN
        RAISE EXCEPTION 'Required table does not exist. Cannot proceed.';
    END IF;
    
    RAISE NOTICE 'Pre-migration checks passed';
END $$;

-- Check 2: Verify migration not already applied
DO $$
BEGIN
    -- Example: Check if column already exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'your_table' AND column_name = 'your_column'
    ) THEN
        RAISE EXCEPTION 'Migration already applied. Column already exists.';
    END IF;
END $$;

-- Check 3: Data size check (optional)
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count FROM your_table;
    IF row_count > 100000 THEN
        RAISE WARNING 'Large table detected (% rows). Migration may take time.', row_count;
    END IF;
    RAISE NOTICE 'Table has % rows', row_count;
END $$;

-- ============================================
-- BACKUP (if modifying data)
-- ============================================

-- Create backup table (uncomment if needed)
-- CREATE TABLE your_table_backup_vXX AS 
-- SELECT * FROM your_table;
-- 
-- COMMENT ON TABLE your_table_backup_vXX IS 
-- 'Backup before VXX migration. Safe to drop after [date]';

-- ============================================
-- ACTUAL MIGRATION
-- ============================================

BEGIN;

-- Your migration SQL here
-- Example: Add column
ALTER TABLE your_table 
ADD COLUMN your_column VARCHAR(255);

-- Example: Add index
CREATE INDEX idx_your_table_your_column 
ON your_table(your_column);

-- Example: Add constraint
ALTER TABLE your_table
ADD CONSTRAINT chk_your_column 
CHECK (your_column IS NOT NULL);

-- Add comments for documentation
COMMENT ON COLUMN your_table.your_column IS 
'Description of what this column stores';

COMMIT;

-- ============================================
-- POST-MIGRATION VALIDATION
-- ============================================

-- Verify changes were applied
DO $$
BEGIN
    -- Check column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'your_table' AND column_name = 'your_column'
    ) THEN
        RAISE EXCEPTION 'Migration failed: Column was not created';
    END IF;
    
    -- Check index exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'your_table' AND indexname = 'idx_your_table_your_column'
    ) THEN
        RAISE EXCEPTION 'Migration failed: Index was not created';
    END IF;
    
    RAISE NOTICE 'Migration VXX completed successfully';
END $$;

-- ============================================
-- NOTES
-- ============================================
-- 1. Remember to create corresponding rollback script (UXX__rollback_*.sql)
-- 2. Test on staging environment first
-- 3. Monitor performance after deployment
-- 4. Update documentation if schema changes affect API
