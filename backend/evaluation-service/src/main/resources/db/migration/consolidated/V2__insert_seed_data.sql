-- ============================================
-- DRL Platform - Seed Data
-- Version: V2 (Consolidated)
-- Description: Insert test/initial data
-- Date: 2025-11-29
-- ============================================
-- This file inserts sample data for testing and development
-- Safe to run multiple times (uses INSERT ... WHERE NOT EXISTS)
-- ============================================

-- ============================================
-- EVALUATION PERIODS
-- ============================================

-- Insert sample evaluation period (if none exists)
INSERT INTO evaluation_periods (name, semester, academic_year, start_date, end_date, is_active, description)
SELECT 
    'Đợt 1 - Học kỳ 1 năm học 2024-2025',
    '2024-2025-HK1',
    '2024-2025',
    '2024-11-20'::date,
    '2025-12-31'::date,
    true,
    'Đợt đánh giá điểm rèn luyện học kỳ 1 năm học 2024-2025'
WHERE NOT EXISTS (
    SELECT 1 FROM evaluation_periods WHERE semester = '2024-2025-HK1'
);

-- Insert period for HK2
INSERT INTO evaluation_periods (name, semester, academic_year, start_date, end_date, is_active, description)
SELECT 
    'Đợt 1 - Học kỳ 2 năm học 2024-2025',
    '2024-2025-HK2',
    '2024-2025',
    '2025-03-01'::date,
    '2025-05-31'::date,
    false,
    'Đợt đánh giá điểm rèn luyện học kỳ 2 năm học 2024-2025'
WHERE NOT EXISTS (
    SELECT 1 FROM evaluation_periods WHERE semester = '2024-2025-HK2'
);

-- ============================================
-- RUBRICS
-- ============================================

-- Insert sample rubric (if none exists)
INSERT INTO rubrics (name, description, max_points, academic_year, is_active)
SELECT 
    'Phiếu đánh giá Kết quả Rèn luyện (Tối đa: 100 điểm)',
    'Phiếu đánh giá điểm rèn luyện dành cho sinh viên PTIT',
    100.0,
    '2024-2025',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM rubrics WHERE name LIKE '%Phiếu đánh giá Kết quả Rèn luyện%'
);

-- ============================================
-- CRITERIA
-- ============================================

-- Get rubric_id for inserting criteria
DO $$
DECLARE
    v_rubric_id BIGINT;
BEGIN
    -- Get the rubric ID
    SELECT id INTO v_rubric_id 
    FROM rubrics 
    WHERE name LIKE '%Phiếu đánh giá Kết quả Rèn luyện%' 
    LIMIT 1;
    
    IF v_rubric_id IS NULL THEN
        RAISE EXCEPTION 'Rubric not found. Cannot insert criteria.';
    END IF;
    
    -- Insert criteria only if they don't exist
    
    -- Criteria 1: Đánh giá về ý thức và thái độ trong học tập
    INSERT INTO criteria (name, description, max_points, order_index, rubric_id)
    SELECT 
        'Đánh giá về ý thức và thái độ trong học tập',
        'Tiêu chí đánh giá ý thức học tập, tham gia lớp học, hoàn thành bài tập',
        20.0,
        1,
        v_rubric_id
    WHERE NOT EXISTS (
        SELECT 1 FROM criteria WHERE rubric_id = v_rubric_id AND order_index = 1
    );
    
    -- Criteria 2: Đánh giá về ý thức và thái độ chấp hành nội quy, quy chế
    INSERT INTO criteria (name, description, max_points, order_index, rubric_id)
    SELECT 
        'Đánh giá về ý thức và thái độ chấp hành nội quy, quy chế',
        'Tiêu chí đánh giá việc tuân thủ nội quy, quy chế của nhà trường',
        25.0,
        2,
        v_rubric_id
    WHERE NOT EXISTS (
        SELECT 1 FROM criteria WHERE rubric_id = v_rubric_id AND order_index = 2
    );
    
    -- Criteria 3: Đánh giá về ý thức và kết quả tham gia các hoạt động chính trị
    INSERT INTO criteria (name, description, max_points, order_index, rubric_id)
    SELECT 
        'Đánh giá về ý thức và kết quả tham gia các hoạt động chính trị',
        'Tiêu chí đánh giá tham gia các hoạt động chính trị, xã hội, văn hóa',
        20.0,
        3,
        v_rubric_id
    WHERE NOT EXISTS (
        SELECT 1 FROM criteria WHERE rubric_id = v_rubric_id AND order_index = 3
    );
    
    -- Criteria 4: Đánh giá về phẩm chất công dân và quan hệ với cộng đồng
    INSERT INTO criteria (name, description, max_points, order_index, rubric_id)
    SELECT 
        'Đánh giá về phẩm chất công dân và quan hệ với cộng đồng',
        'Tiêu chí đánh giá ý thức công dân, quan hệ với cộng đồng',
        25.0,
        4,
        v_rubric_id
    WHERE NOT EXISTS (
        SELECT 1 FROM criteria WHERE rubric_id = v_rubric_id AND order_index = 4
    );
    
    -- Criteria 5: Đánh giá về ý thức và kết quả tham gia công tác phụ trách lớp
    INSERT INTO criteria (name, description, max_points, order_index, rubric_id)
    SELECT 
        'Đánh giá về ý thức và kết quả tham gia công tác phụ trách lớp',
        'Tiêu chí đánh giá công tác cán bộ lớp, đoàn thể',
        10.0,
        5,
        v_rubric_id
    WHERE NOT EXISTS (
        SELECT 1 FROM criteria WHERE rubric_id = v_rubric_id AND order_index = 5
    );
    
    RAISE NOTICE 'Criteria inserted successfully for rubric_id: %', v_rubric_id;
END $$;

-- ============================================
-- LINK RUBRIC TO PERIOD
-- ============================================

-- Link the rubric to the active period
UPDATE evaluation_periods ep
SET rubric_id = (
    SELECT id FROM rubrics 
    WHERE is_active = true 
    AND academic_year = ep.academic_year 
    LIMIT 1
)
WHERE ep.rubric_id IS NULL
  AND ep.academic_year = '2024-2025';

-- ============================================
-- SAMPLE TEST DATA (Optional - for development)
-- ============================================

-- Uncomment below to insert sample evaluations for testing

/*
-- Insert sample evaluation
DO $$
DECLARE
    v_rubric_id BIGINT;
    v_eval_id BIGINT;
    v_criteria_ids BIGINT[];
BEGIN
    -- Get rubric and criteria
    SELECT id INTO v_rubric_id FROM rubrics WHERE is_active = true LIMIT 1;
    SELECT ARRAY_AGG(id ORDER BY order_index) INTO v_criteria_ids FROM criteria WHERE rubric_id = v_rubric_id;
    
    -- Insert evaluation
    INSERT INTO evaluations (student_code, semester, academic_year, total_points, status, rubric_id)
    VALUES ('N21DCCN001', '2024-2025-HK1', '2024-2025', 85.0, 'SUBMITTED', v_rubric_id)
    RETURNING id INTO v_eval_id;
    
    -- Insert evaluation details
    INSERT INTO evaluation_details (evaluation_id, criteria_id, score, comment)
    VALUES 
        (v_eval_id, v_criteria_ids[1], 18.0, 'Evidence: Tham gia đầy đủ các buổi học'),
        (v_eval_id, v_criteria_ids[2], 23.0, 'Evidence: Không vi phạm nội quy'),
        (v_eval_id, v_criteria_ids[3], 17.0, 'Evidence: Tham gia hoạt động đoàn'),
        (v_eval_id, v_criteria_ids[4], 20.0, 'Evidence: Tham gia hoạt động cộng đồng'),
        (v_eval_id, v_criteria_ids[5], 7.0, 'Evidence: Là thành viên ban cán sự lớp');
    
    -- Insert history
    INSERT INTO evaluation_history (evaluation_id, action, from_status, to_status, comment)
    VALUES 
        (v_eval_id, 'CREATED', NULL, 'DRAFT', 'Evaluation created'),
        (v_eval_id, 'SUBMITTED', 'DRAFT', 'SUBMITTED', 'Evaluation submitted for approval');
    
    RAISE NOTICE 'Sample evaluation created with ID: %', v_eval_id;
END $$;
*/

-- ============================================
-- VALIDATION
-- ============================================

DO $$
DECLARE
    period_count INTEGER;
    rubric_count INTEGER;
    criteria_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO period_count FROM evaluation_periods;
    SELECT COUNT(*) INTO rubric_count FROM rubrics;
    SELECT COUNT(*) INTO criteria_count FROM criteria;
    
    RAISE NOTICE 'Seed data inserted successfully:';
    RAISE NOTICE '  - Evaluation periods: %', period_count;
    RAISE NOTICE '  - Rubrics: %', rubric_count;
    RAISE NOTICE '  - Criteria: %', criteria_count;
    
    IF rubric_count = 0 OR criteria_count = 0 THEN
        RAISE WARNING 'No rubrics or criteria found. Check if seed data was inserted correctly.';
    END IF;
END $$;
