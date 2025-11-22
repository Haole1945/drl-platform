-- Add target_classes column to rubrics table
-- This column stores comma-separated class codes: D21CQCN01-N,D20CQCN01-N
-- NULL means the rubric applies to all classes

ALTER TABLE rubrics 
ADD COLUMN IF NOT EXISTS target_classes VARCHAR(500) NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_rubrics_target_classes ON rubrics(target_classes);
