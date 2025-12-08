-- Migration: Add class_approvals table to track CLASS_MONITOR approvals
-- This allows SUBMITTED evaluations to require CLASS_MONITOR approval before moving to CLASS_APPROVED

CREATE TABLE IF NOT EXISTS class_approvals (
    id BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL,
    approver_id BIGINT NOT NULL,
    approver_name VARCHAR(100),
    approver_role VARCHAR(50) NOT NULL, -- CLASS_MONITOR
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_class_approval_evaluation FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
    CONSTRAINT uk_class_approval_evaluation_approver UNIQUE (evaluation_id, approver_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_class_approval_evaluation ON class_approvals(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_class_approval_approver ON class_approvals(approver_id);

COMMENT ON TABLE class_approvals IS 'Tracks approval from CLASS_MONITOR. CLASS_MONITOR must approve before evaluation moves to CLASS_APPROVED.';
COMMENT ON COLUMN class_approvals.approver_role IS 'Role of approver: CLASS_MONITOR';

