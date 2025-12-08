-- ============================================
-- DRL Platform - AI Validation Service Migration
-- Version: V1
-- Description: Creates evidence validation tables
-- Date: 2025-01-XX
-- ============================================

-- Table: evidence_validations
CREATE TABLE IF NOT EXISTS evidence_validations (
    id BIGSERIAL PRIMARY KEY,
    evidence_file_id BIGINT NOT NULL,  -- Reference to evidence_files.id (evaluation-service)
    evaluation_id BIGINT,              -- For quick lookup
    criteria_id BIGINT NOT NULL,
    sub_criteria_id VARCHAR(20),        -- Optional sub-criteria ID (e.g., "1.1")
    
    -- Validation Status
    validation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING, VALIDATING, VALIDATED, FAILED, SKIPPED
    
    -- AI Analysis Results
    ai_score DOUBLE PRECISION,          -- Điểm gợi ý từ AI (0 - max_points)
    ai_feedback TEXT,                   -- Feedback chi tiết từ AI
    validation_confidence DOUBLE PRECISION,  -- Confidence score (0.0 - 1.0)
    
    -- Detection Results
    is_fake BOOLEAN,                    -- Phát hiện giả mạo (true/false)
    is_relevant BOOLEAN,                -- Có phù hợp với criteria không
    fake_confidence DOUBLE PRECISION,   -- Confidence của fake detection (0.0 - 1.0)
    relevance_score DOUBLE PRECISION,   -- Relevance score (0.0 - 1.0)
    
    -- Metadata
    validation_metadata JSONB,          -- Raw response từ OpenAI (full JSON)
    error_message TEXT,                 -- Error message nếu validation fail
    validated_at TIMESTAMP,             -- Thời gian validation hoàn thành
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE evidence_validations IS 'AI validation results for evidence files';
COMMENT ON COLUMN evidence_validations.evidence_file_id IS 'Reference to evidence_files.id in evaluation-service (no FK - microservice independence)';
COMMENT ON COLUMN evidence_validations.validation_status IS 'Status: PENDING, VALIDATING, VALIDATED, FAILED, SKIPPED';
COMMENT ON COLUMN evidence_validations.ai_score IS 'Điểm số gợi ý từ AI (0 đến max_points của criteria)';
COMMENT ON COLUMN evidence_validations.ai_feedback IS 'Feedback chi tiết từ AI về minh chứng';
COMMENT ON COLUMN evidence_validations.validation_metadata IS 'Raw JSON response từ OpenAI API';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_validation_evidence_file ON evidence_validations(evidence_file_id);
CREATE INDEX IF NOT EXISTS idx_validation_evaluation ON evidence_validations(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_validation_status ON evidence_validations(validation_status);
CREATE INDEX IF NOT EXISTS idx_validation_criteria ON evidence_validations(criteria_id);
CREATE INDEX IF NOT EXISTS idx_validation_created_at ON evidence_validations(created_at);

