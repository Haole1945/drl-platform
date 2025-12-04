-- ============================================
-- DRL Platform - Student Service Migration
-- Version: V1
-- Description: Creates student tables
-- Date: 2025-12-01
-- Note: No FK to users table (users are in auth-service)
-- ============================================

-- Table: faculties (natural key: code)
CREATE TABLE IF NOT EXISTS faculties (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE faculties IS 'University faculties';

-- Table: majors (natural key: code)
CREATE TABLE IF NOT EXISTS majors (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    faculty_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_major_faculty FOREIGN KEY (faculty_code) REFERENCES faculties(code)
);

COMMENT ON TABLE majors IS 'Academic majors within faculties';

-- Indexes for majors
CREATE INDEX IF NOT EXISTS idx_major_faculty ON majors(faculty_code);

-- Table: classes (natural key: code)
-- Note: Table name is "classes" to match StudentClass entity @Table(name = "classes")
CREATE TABLE IF NOT EXISTS classes (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    faculty_code VARCHAR(20) NOT NULL,
    major_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_class_faculty FOREIGN KEY (faculty_code) REFERENCES faculties(code),
    CONSTRAINT fk_class_major FOREIGN KEY (major_code) REFERENCES majors(code)
);

COMMENT ON TABLE classes IS 'Student classes (e.g., D21DCCN01-N)';

-- Indexes for classes
CREATE INDEX IF NOT EXISTS idx_class_faculty ON classes(faculty_code);
CREATE INDEX IF NOT EXISTS idx_class_major ON classes(major_code);
CREATE INDEX IF NOT EXISTS idx_class_academic_year ON classes(academic_year);

-- Table: students (natural key: student_code)
CREATE TABLE IF NOT EXISTS students (
    student_code VARCHAR(20) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10), -- MALE, FEMALE, OTHER
    phone VARCHAR(20),
    address VARCHAR(500),
    academic_year VARCHAR(20),
    position VARCHAR(50), -- NONE, CLASS_MONITOR, VICE_MONITOR, SECRETARY, etc.
    class_code VARCHAR(50) NOT NULL,
    major_code VARCHAR(20) NOT NULL,
    faculty_code VARCHAR(20) NOT NULL,
    user_id BIGINT UNIQUE, -- Reference to user in auth-service (no FK - microservice independence)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_class FOREIGN KEY (class_code) REFERENCES classes(code),
    CONSTRAINT fk_student_major FOREIGN KEY (major_code) REFERENCES majors(code),
    CONSTRAINT fk_student_faculty FOREIGN KEY (faculty_code) REFERENCES faculties(code)
);

COMMENT ON TABLE students IS 'Student information';
COMMENT ON COLUMN students.position IS 'Student position: NONE, CLASS_MONITOR, VICE_MONITOR, SECRETARY, etc.';
COMMENT ON COLUMN students.user_id IS 'Reference to user in auth-service (no FK - microservice independence)';

-- Indexes for students
CREATE INDEX IF NOT EXISTS idx_student_faculty ON students(faculty_code);
CREATE INDEX IF NOT EXISTS idx_student_major ON students(major_code);
CREATE INDEX IF NOT EXISTS idx_student_class ON students(class_code);
CREATE INDEX IF NOT EXISTS idx_student_academic_year ON students(academic_year);
CREATE INDEX IF NOT EXISTS idx_student_position ON students(position);
CREATE INDEX IF NOT EXISTS idx_student_user ON students(user_id);

