-- Flyway Migration: V1__Create_evaluation_tables.sql
-- Creates all tables for evaluation-service
-- This replaces the need to switch between ddl-auto: update and validate

-- Table: rubrics
CREATE TABLE IF NOT EXISTS rubrics (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    max_points DOUBLE PRECISION NOT NULL,
    academic_year VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: criteria
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

-- Table: evaluations
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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evaluation_rubric FOREIGN KEY (rubric_id) REFERENCES rubrics(id)
);

-- Indexes for evaluations
CREATE INDEX IF NOT EXISTS idx_evaluation_student_code ON evaluations(student_code);
CREATE INDEX IF NOT EXISTS idx_evaluation_semester ON evaluations(semester);
CREATE INDEX IF NOT EXISTS idx_evaluation_status ON evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_academic_year ON evaluations(academic_year);
CREATE INDEX IF NOT EXISTS idx_evaluation_student_semester ON evaluations(student_code, semester);
CREATE INDEX IF NOT EXISTS idx_evaluation_rubric ON evaluations(rubric_id);

-- Table: evaluation_details (composite key)
CREATE TABLE IF NOT EXISTS evaluation_details (
    evaluation_id BIGINT NOT NULL,
    criteria_id BIGINT NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (evaluation_id, criteria_id),
    CONSTRAINT fk_eval_detail_evaluation FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
    CONSTRAINT fk_eval_detail_criteria FOREIGN KEY (criteria_id) REFERENCES criteria(id) ON DELETE CASCADE
);

-- Table: evaluation_history
CREATE TABLE IF NOT EXISTS evaluation_history (
    id BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL,
    action VARCHAR(20) NOT NULL,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    level VARCHAR(20),
    actor_id BIGINT,
    actor_name VARCHAR(100),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eval_history_evaluation FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
);

-- Table: evidence_files
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

-- Indexes for evidence_files
CREATE INDEX IF NOT EXISTS idx_evidence_evaluation_criteria ON evidence_files(evaluation_id, criteria_id);
CREATE INDEX IF NOT EXISTS idx_evidence_evaluation ON evidence_files(evaluation_id);

-- Table: evaluation_periods
CREATE TABLE IF NOT EXISTS evaluation_periods (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for evaluation_periods
CREATE INDEX IF NOT EXISTS idx_period_semester ON evaluation_periods(semester);
CREATE INDEX IF NOT EXISTS idx_period_academic_year ON evaluation_periods(academic_year);
CREATE INDEX IF NOT EXISTS idx_period_active ON evaluation_periods(is_active);


