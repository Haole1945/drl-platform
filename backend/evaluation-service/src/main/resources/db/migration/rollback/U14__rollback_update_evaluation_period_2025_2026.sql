-- Flyway Rollback: U15__rollback_update_evaluation_period_2025_2026.sql
-- Description: Rollback evaluation period update to 2024-2025 academic year
-- Author: System
-- Date: 2025-12-21

-- Rollback to previous evaluation period values
UPDATE evaluation_periods 
SET 
    name = 'Đợt 1 - Học kỳ 1 năm học 2024-2025',
    semester = '2024-2025-HK1',
    academic_year = '2024-2025',
    start_date = '2024-09-01'::date,
    end_date = '2025-01-31'::date,
    description = 'Đợt đánh giá điểm rèn luyện học kỳ 1 năm học 2024-2025'
WHERE id = 1;
