-- ============================================
-- DRL Platform - Complete Database Schema
-- Version: V1 (Consolidated)
-- Description: Creates all tables, indexes, and constraints
-- Date: 2025-11-29
-- ============================================
-- This file consolidates V1-V8 from incremental migrations
-- Use this for fresh database setup
-- ============================================

-- ============================================
-- CORE TABLES
-- ============================================

-- Table: rubrics
-- Stores evaluation rubrics (scoring templates)
CREATE TABLE IF NOT EXISTS rubrics (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    max_points DOUBLE PRECISION NOT NULL,
    academic_year VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    target_classes VARCHAR(500) NULL, -- Comma-separated class codes or NULL for all
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE rubrics IS 'Evaluation rubrics (scoring templates)';
COMMENT ON COLUMN rubrics.target_classes IS 'Comma-separated class codes (e.g., D21CQCN01-N,D20CQCN01-N) or NULL for all classes';

-- Table: criteria
-- Stores evaluation criteria within rubrics
CREATE TABLE IF NOT EXISTS criteria (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    max_points DOUBLE PRECISION NOT NULL,
    order_index INTEGER NOT NULL,
    rubric_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_criteria_rubric FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE CASCADE
);

COMMENT ON TABLE criteria IS 'Evaluation criteria within rubrics';
COMMENT ON COLUMN criteria.order_index IS 'Display order of criteria';

-- Table: evaluation_periods
-- Defines when evaluations can be submitted
CREATE TABLE IF NOT EXISTS evaluation_periods (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    rubric_id BIGINT, -- Which rubric to use for this period
    target_classes TEXT, -- Which classes can submit in this period
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_period_rubric FOREIGN KEY (rubric_id) REFERENCES rubrics(id)
);

COMMENT ON TABLE evaluation_periods IS 'Defines evaluation submission periods';
COMMENT ON COLUMN evaluation_periods.rubric_id IS 'Rubric to use for this period';
COMMENT ON COLUMN evaluation_periods.target_classes IS 'Target classes/faculties/majors (e.g., FACULTY:CNTT, CLASS:D21DCCN01-N)';

-- Table: evaluations
-- Student self-evaluations
CREATE TABLE IF NOT EXISTS evaluations (
    id BIGSERIAL PRIMARY KEY,
    student_code VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    academic_year VARCHAR(20),
    total_points DOUBLE PRECISION,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    rejection_reason TEXT,
    appeal_reason TEXT,
    submitted_at DATE,
    approved_at DATE,
    rubric_id BIGINT NOT NULL,
    resubmission_count INTEGER DEFAULT 0,
    last_rejection_level VARCHAR(20), -- CLASS, FACULTY, or CTSV
    created_by BIGINT, -- User ID who created (null if student, set if admin)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evaluation_rubric FOREIGN KEY (rubric_id) REFERENCES rubrics(id)
);

COMMENT ON TABLE evaluations IS 'Student self-evaluations';
COMMENT ON COLUMN evaluations.student_code IS 'Student code (no FK - microservice independence)';
COMMENT ON COLUMN evaluations.status IS 'DRAFT, SUBMITTED, CLASS_APPROVED, FACULTY_APPROVED, CTSV_APPROVED, REJECTED';
COMMENT ON COLUMN evaluations.last_rejection_level IS 'Tracks which approval level (CLASS, FACULTY, CTSV) last rejected this evaluation. Used for smart resubmit.';
COMMENT ON COLUMN evaluations.created_by IS 'User ID who created this evaluation (null if created by student, set if created by admin)';

-- Table: evaluation_details
-- Scores for each criteria in an evaluation
CREATE TABLE IF NOT EXISTS evaluation_details (
    evaluation_id BIGINT NOT NULL,
    criteria_id BIGINT NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    comment TEXT, -- Stores evidence and notes
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (evaluation_id, criteria_id),
    CONSTRAINT fk_eval_detail_evaluation FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
    CONSTRAINT fk_eval_detail_criteria FOREIGN KEY (criteria_id) REFERENCES criteria(id) ON DELETE CASCADE
);

COMMENT ON TABLE evaluation_details IS 'Scores for each criteria in an evaluation';
COMMENT ON COLUMN evaluation_details.comment IS 'Stores evidence URLs and notes in format: SCORES:1.1=3,1.2=10|EVIDENCE:1.1=/files/...';

-- Table: evaluation_history
-- Audit trail for evaluation status changes
CREATE TABLE IF NOT EXISTS evaluation_history (
    id BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL,
    action VARCHAR(20) NOT NULL, -- CREATED, SUBMITTED, APPROVED, REJECTED, RESUBMITTED
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    level VARCHAR(20), -- CLASS, FACULTY, CTSV
    actor_id BIGINT,
    actor_name VARCHAR(100),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eval_history_evaluation FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
);

COMMENT ON TABLE evaluation_history IS 'Audit trail for evaluation status changes';
COMMENT ON COLUMN evaluation_history.action IS 'CREATED, SUBMITTED, APPROVED, REJECTED, RESUBMITTED';
COMMENT ON COLUMN evaluation_history.level IS 'Approval level: CLASS, FACULTY, or CTSV';

-- Table: evidence_files
-- File uploads for evaluation evidence
CREATE TABLE IF NOT EXISTS evidence_files (
    id BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT,
    criteria_id BIGINT NOT NULL,
    sub_criteria_id VARCHAR(20),
    file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidence_evaluation FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE SET NULL,
    CONSTRAINT fk_evidence_criteria FOREIGN KEY (criteria_id) REFERENCES criteria(id) ON DELETE CASCADE
);

COMMENT ON TABLE evidence_files IS 'File uploads for evaluation evidence';

-- ============================================
-- NOTIFICATION SYSTEM
-- ============================================

-- Table: notifications
-- User notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- EVALUATION_APPROVED, EVALUATION_REJECTED, etc.
    is_read BOOLEAN NOT NULL DEFAULT false,
    related_id BIGINT, -- ID of related entity (e.g., evaluation_id)
    related_type VARCHAR(50), -- Type of related entity (e.g., EVALUATION)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON COLUMN notifications.type IS 'EVALUATION_APPROVED, EVALUATION_REJECTED, EVALUATION_SUBMITTED, etc.';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Rubrics indexes
CREATE INDEX IF NOT EXISTS idx_rubrics_active ON rubrics(is_active);
CREATE INDEX IF NOT EXISTS idx_rubrics_academic_year ON rubrics(academic_year);
CREATE INDEX IF NOT EXISTS idx_rubrics_target_classes ON rubrics(target_classes);

-- Criteria indexes
CREATE INDEX IF NOT EXISTS idx_criteria_rubric ON criteria(rubric_id);
CREATE INDEX IF NOT EXISTS idx_criteria_order ON criteria(rubric_id, order_index);

-- Evaluation periods indexes
CREATE INDEX IF NOT EXISTS idx_period_semester ON evaluation_periods(semester);
CREATE INDEX IF NOT EXISTS idx_period_academic_year ON evaluation_periods(academic_year);
CREATE INDEX IF NOT EXISTS idx_period_active ON evaluation_periods(is_active);
CREATE INDEX IF NOT EXISTS idx_period_rubric ON evaluation_periods(rubric_id);
CREATE INDEX IF NOT EXISTS idx_period_target ON evaluation_periods(target_classes);
CREATE INDEX IF NOT EXISTS idx_period_dates ON evaluation_periods(start_date, end_date);

-- Evaluations indexes
CREATE INDEX IF NOT EXISTS idx_evaluation_student_code ON evaluations(student_code);
CREATE INDEX IF NOT EXISTS idx_evaluation_semester ON evaluations(semester);
CREATE INDEX IF NOT EXISTS idx_evaluation_status ON evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_academic_year ON evaluations(academic_year);
CREATE INDEX IF NOT EXISTS idx_evaluation_student_semester ON evaluations(student_code, semester);
CREATE INDEX IF NOT EXISTS idx_evaluation_rubric ON evaluations(rubric_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_rejection_level ON evaluations(last_rejection_level);
CREATE INDEX IF NOT EXISTS idx_evaluation_created_by ON evaluations(created_by);

-- Evaluation details indexes (composite key already indexed)

-- Evaluation history indexes
CREATE INDEX IF NOT EXISTS idx_eval_history_evaluation ON evaluation_history(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_eval_history_created ON evaluation_history(created_at);
CREATE INDEX IF NOT EXISTS idx_eval_history_action ON evaluation_history(action);

-- Evidence files indexes
CREATE INDEX IF NOT EXISTS idx_evidence_evaluation_criteria ON evidence_files(evaluation_id, criteria_id);
CREATE INDEX IF NOT EXISTS idx_evidence_evaluation ON evidence_files(evaluation_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notification_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_user_read ON notifications(user_id, is_read);

-- ============================================
-- VALIDATION
-- ============================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    -- Count created tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'rubrics', 'criteria', 'evaluation_periods', 'evaluations',
        'evaluation_details', 'evaluation_history', 'evidence_files', 'notifications'
    );
    
    IF table_count < 8 THEN
        RAISE EXCEPTION 'Schema creation failed. Expected 8 tables, found %', table_count;
    END IF;
    
    RAISE NOTICE 'Schema V1 created successfully. % tables created.', table_count;
END $$;
