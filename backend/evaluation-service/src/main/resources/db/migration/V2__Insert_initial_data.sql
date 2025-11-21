-- Flyway Migration: V2__Insert_initial_data.sql
-- Inserts initial data (rubrics, criteria, evaluation periods)
-- Only inserts if data doesn't exist

-- Insert sample evaluation period (if none exists)
INSERT INTO evaluation_periods (name, semester, academic_year, start_date, end_date, is_active, description)
SELECT 
    'Đợt 1 - Học kỳ 1 năm học 2024-2025',
    '2024-2025-HK1',
    '2024-2025',
    '2025-11-20'::date,
    '2025-12-20'::date,
    true,
    'Đợt đánh giá điểm rèn luyện học kỳ 1 năm học 2024-2025'
WHERE NOT EXISTS (
    SELECT 1 FROM evaluation_periods WHERE is_active = true
);

-- Note: Rubrics and Criteria are seeded by DataSeeder.java
-- This migration only creates the schema structure


