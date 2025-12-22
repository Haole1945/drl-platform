-- ============================================
-- Migration: Create Appeals System Tables
-- Version: V13
-- Description: Creates tables for evaluation appeals system including appeals, appeal_criteria, and appeal_files
-- Date: 2024-12-19
-- Author: Kiro AI
-- ============================================

-- ============================================
-- PRE-MIGRATION CHECKS
-- ============================================

-- Check 1: Verify evaluations table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'evaluations'
    ) THEN
        RAISE EXCEPTION 'Required table evaluations does not exist. Cannot proceed.';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'criteria'
    ) THEN
        RAISE EXCEPTION 'Required table criteria does not exist. Cannot proceed.';
    END IF;
    
    RAISE NOTICE 'Pre-migration checks passed';
END $$;

-- Check 2: Verify migration not already applied
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'appeals'
    ) THEN
        RAISE EXCEPTION 'Migration already applied. Appeals table already exists.';
    END IF;
END $$;

-- ============================================
-- ACTUAL MIGRATION
-- ============================================

BEGIN;

-- ============================================
-- 1. Create appeals table
-- ============================================
CREATE TABLE appeals (
    id BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL,
    student_code VARCHAR(20) NOT NULL,
    appeal_reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED')),
    reviewer_id VARCHAR(20),
    review_comment TEXT,
    review_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_appeals_evaluation 
        FOREIGN KEY (evaluation_id) 
        REFERENCES evaluations(id) 
        ON DELETE CASCADE
);

-- Add comments for documentation
COMMENT ON TABLE appeals IS 'Stores student appeals for finalized evaluations';
COMMENT ON COLUMN appeals.id IS 'Unique identifier for the appeal';
COMMENT ON COLUMN appeals.evaluation_id IS 'Reference to the evaluation being appealed';
COMMENT ON COLUMN appeals.student_code IS 'Student code of the appeal creator';
COMMENT ON COLUMN appeals.appeal_reason IS 'Reason for the appeal provided by student';
COMMENT ON COLUMN appeals.status IS 'Current status: PENDING, REVIEWING, ACCEPTED, REJECTED';
COMMENT ON COLUMN appeals.reviewer_id IS 'User ID of the reviewer (faculty/admin)';
COMMENT ON COLUMN appeals.review_comment IS 'Comment provided by reviewer when processing appeal';
COMMENT ON COLUMN appeals.review_date IS 'Date when the appeal was reviewed';
COMMENT ON COLUMN appeals.created_at IS 'Timestamp when appeal was created';
COMMENT ON COLUMN appeals.updated_at IS 'Timestamp when appeal was last updated';

-- Create indexes for performance
CREATE INDEX idx_appeals_evaluation ON appeals(evaluation_id);
CREATE INDEX idx_appeals_student ON appeals(student_code);
CREATE INDEX idx_appeals_status ON appeals(status);
CREATE INDEX idx_appeals_created ON appeals(created_at DESC);

-- ============================================
-- 2. Create appeal_criteria table (many-to-many)
-- ============================================
CREATE TABLE appeal_criteria (
    id BIGSERIAL PRIMARY KEY,
    appeal_id BIGINT NOT NULL,
    criteria_id BIGINT NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_appeal_criteria_appeal 
        FOREIGN KEY (appeal_id) 
        REFERENCES appeals(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_appeal_criteria_criteria 
        FOREIGN KEY (criteria_id) 
        REFERENCES criteria(id)
);

-- Add comments
COMMENT ON TABLE appeal_criteria IS 'Links appeals to specific criteria being appealed';
COMMENT ON COLUMN appeal_criteria.id IS 'Unique identifier';
COMMENT ON COLUMN appeal_criteria.appeal_id IS 'Reference to the appeal';
COMMENT ON COLUMN appeal_criteria.criteria_id IS 'Reference to the criteria being appealed';

-- Create index
CREATE INDEX idx_appeal_criteria_appeal ON appeal_criteria(appeal_id);
CREATE INDEX idx_appeal_criteria_criteria ON appeal_criteria(criteria_id);

-- ============================================
-- 3. Create appeal_files table
-- ============================================
CREATE TABLE appeal_files (
    id BIGSERIAL PRIMARY KEY,
    appeal_id BIGINT NOT NULL,
    file_id BIGINT NOT NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_appeal_files_appeal 
        FOREIGN KEY (appeal_id) 
        REFERENCES appeals(id) 
        ON DELETE CASCADE
);

-- Add comments
COMMENT ON TABLE appeal_files IS 'Links appeals to evidence files uploaded by students';
COMMENT ON COLUMN appeal_files.id IS 'Unique identifier';
COMMENT ON COLUMN appeal_files.appeal_id IS 'Reference to the appeal';
COMMENT ON COLUMN appeal_files.file_id IS 'Reference to file in file service';

-- Create index
CREATE INDEX idx_appeal_files_appeal ON appeal_files(appeal_id);

-- ============================================
-- 4. Add appeal_deadline_days to evaluation_periods
-- ============================================
ALTER TABLE evaluation_periods 
ADD COLUMN appeal_deadline_days INTEGER DEFAULT 7;

-- Add comment
COMMENT ON COLUMN evaluation_periods.appeal_deadline_days IS 
'Number of days after period end date when appeals can be submitted (default: 7 days)';

-- Add constraint to ensure positive value
ALTER TABLE evaluation_periods
ADD CONSTRAINT chk_appeal_deadline_days_positive 
CHECK (appeal_deadline_days > 0);

COMMIT;

-- ============================================
-- POST-MIGRATION VALIDATION
-- ============================================

DO $$
BEGIN
    -- Check appeals table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'appeals'
    ) THEN
        RAISE EXCEPTION 'Migration failed: appeals table was not created';
    END IF;
    
    -- Check appeal_criteria table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'appeal_criteria'
    ) THEN
        RAISE EXCEPTION 'Migration failed: appeal_criteria table was not created';
    END IF;
    
    -- Check appeal_files table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'appeal_files'
    ) THEN
        RAISE EXCEPTION 'Migration failed: appeal_files table was not created';
    END IF;
    
    -- Check appeal_deadline_days column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evaluation_periods' AND column_name = 'appeal_deadline_days'
    ) THEN
        RAISE EXCEPTION 'Migration failed: appeal_deadline_days column was not created';
    END IF;
    
    -- Check indexes exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'appeals' AND indexname = 'idx_appeals_evaluation'
    ) THEN
        RAISE EXCEPTION 'Migration failed: idx_appeals_evaluation index was not created';
    END IF;
    
    RAISE NOTICE 'Migration V13 completed successfully';
    RAISE NOTICE 'Created tables: appeals, appeal_criteria, appeal_files';
    RAISE NOTICE 'Added column: evaluation_periods.appeal_deadline_days';
END $$;

-- ============================================
-- NOTES
-- ============================================
-- 1. Rollback script: U13__rollback_create_appeals_tables.sql
-- 2. Appeals cascade delete when evaluations are deleted
-- 3. Default appeal deadline is 7 days after evaluation period ends
-- 4. Appeal status must be one of: PENDING, REVIEWING, ACCEPTED, REJECTED
