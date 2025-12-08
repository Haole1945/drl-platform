-- Add last_rejection_level to track which level rejected the evaluation
-- This enables smart resubmit that returns to the rejection level

ALTER TABLE evaluations 
ADD COLUMN last_rejection_level VARCHAR(20);

-- Add index for performance
CREATE INDEX idx_evaluations_rejection_level 
ON evaluations(last_rejection_level);

-- Add comment for documentation
COMMENT ON COLUMN evaluations.last_rejection_level IS 'Tracks which approval level (CLASS, ADVISOR, FACULTY) last rejected this evaluation. Used for smart resubmit.';
