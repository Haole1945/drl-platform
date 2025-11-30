-- Flyway Migration: V8__add_created_by_to_evaluations.sql
-- Add created_by field to track who created the evaluation (for audit trail)

ALTER TABLE evaluations 
ADD COLUMN created_by BIGINT;

-- Add index for created_by for faster queries
CREATE INDEX IF NOT EXISTS idx_evaluation_created_by ON evaluations(created_by);

-- Add comment to explain the field
COMMENT ON COLUMN evaluations.created_by IS 'User ID who created this evaluation (null if created by student, set if created by admin)';

