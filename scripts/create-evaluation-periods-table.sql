-- Script to create evaluation_periods table manually
-- Run this if Hibernate doesn't create the table automatically

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_period_semester ON evaluation_periods(semester);
CREATE INDEX IF NOT EXISTS idx_period_academic_year ON evaluation_periods(academic_year);
CREATE INDEX IF NOT EXISTS idx_period_active ON evaluation_periods(is_active);

-- Insert sample period (if none exists)
INSERT INTO evaluation_periods (name, semester, academic_year, start_date, end_date, is_active, description)
SELECT 
    'Đợt 1 - Học kỳ 1 năm học 2024-2025',
    '2024-2025-HK1',
    '2024-2025',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    true,
    'Đợt đánh giá điểm rèn luyện học kỳ 1 năm học 2024-2025'
WHERE NOT EXISTS (
    SELECT 1 FROM evaluation_periods WHERE is_active = true
);




