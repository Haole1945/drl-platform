-- Migration: Add scoring columns for class monitor and advisor
-- This allows class monitor and advisor to score evaluations per criteria

-- Add class_monitor_score and advisor_score to evaluation_details
ALTER TABLE evaluation_details 
ADD COLUMN IF NOT EXISTS class_monitor_score DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS advisor_score DOUBLE PRECISION;

-- Add comments
COMMENT ON COLUMN evaluation_details.class_monitor_score IS 'Score given by CLASS_MONITOR for this criteria';
COMMENT ON COLUMN evaluation_details.advisor_score IS 'Score given by ADVISOR for this criteria (final score)';

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_eval_detail_class_monitor_score ON evaluation_details(evaluation_id) WHERE class_monitor_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eval_detail_advisor_score ON evaluation_details(evaluation_id) WHERE advisor_score IS NOT NULL;

