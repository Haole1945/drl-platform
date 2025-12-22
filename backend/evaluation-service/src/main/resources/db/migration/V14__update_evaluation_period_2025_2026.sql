-- Flyway Migration: V15__update_evaluation_period_2025_2026.sql
-- Description: Update evaluation period to 2025-2026 academic year
-- Author: System
-- Date: 2025-12-21

-- Update existing evaluation period to new academic year
UPDATE evaluation_periods 
SET 
    name = 'Đợt 1 - Học kỳ 1 năm học 2025-2026',
    semester = 'HK1',
    academic_year = '2025-2026',
    start_date = '2025-12-20'::date,
    end_date = '2026-01-31'::date,
    description = 'Đợt đánh giá điểm rèn luyện học kỳ 1 năm học 2025-2026'
WHERE id = 1;
