-- Manual migration script to add target_classes column
-- Run this if Flyway migration doesn't work automatically

-- Check if column exists
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'drl_evaluation' 
  AND TABLE_NAME = 'rubrics' 
  AND COLUMN_NAME = 'target_classes';

-- If column doesn't exist, add it
ALTER TABLE rubrics 
ADD COLUMN IF NOT EXISTS target_classes VARCHAR(500) NULL 
COMMENT 'Comma-separated class codes: D21CQCN01-N,D20CQCN01-N. NULL = all classes';

-- Add index
CREATE INDEX IF NOT EXISTS idx_rubrics_target_classes ON rubrics(target_classes);

-- Verify the column was added
DESCRIBE rubrics;

-- Test update
UPDATE rubrics SET target_classes = 'D21CQCN01-N' WHERE id = 1;
UPDATE rubrics SET is_active = false WHERE id = 1;

-- Check the result
SELECT id, name, is_active, target_classes FROM rubrics WHERE id = 1;
