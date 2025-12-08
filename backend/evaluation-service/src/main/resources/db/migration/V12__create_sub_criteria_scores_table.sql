-- Migration: Create table to store sub-criteria scores
-- This allows storing individual sub-criteria scores instead of just the total criteria score

CREATE TABLE IF NOT EXISTS evaluation_sub_criteria_scores (
    id BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL,
    criteria_id BIGINT NOT NULL,
    sub_criteria_id VARCHAR(20) NOT NULL, -- e.g., "1.1", "1.2"
    class_monitor_score DOUBLE PRECISION, -- Score given by class monitor for this sub-criteria
    advisor_score DOUBLE PRECISION, -- Score given by advisor for this sub-criteria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sub_score_evaluation FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_score_criteria FOREIGN KEY (criteria_id) REFERENCES criteria(id) ON DELETE CASCADE,
    CONSTRAINT uk_sub_score_eval_criteria_sub UNIQUE (evaluation_id, criteria_id, sub_criteria_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sub_score_evaluation ON evaluation_sub_criteria_scores(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_sub_score_criteria ON evaluation_sub_criteria_scores(criteria_id);
CREATE INDEX IF NOT EXISTS idx_sub_score_eval_criteria ON evaluation_sub_criteria_scores(evaluation_id, criteria_id);

-- Add comments
COMMENT ON TABLE evaluation_sub_criteria_scores IS 'Stores individual sub-criteria scores for evaluations';
COMMENT ON COLUMN evaluation_sub_criteria_scores.class_monitor_score IS 'Score given by CLASS_MONITOR for this sub-criteria';
COMMENT ON COLUMN evaluation_sub_criteria_scores.advisor_score IS 'Score given by ADVISOR for this sub-criteria';

