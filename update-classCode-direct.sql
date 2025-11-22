-- Update classCode cho user N21DCCN002
-- Chạy script này trong database của auth-service

-- Bước 1: Check student data (từ student-service database)
-- SELECT student_code, class_code FROM students WHERE student_code = 'N21DCCN002';

-- Bước 2: Update user với classCode từ student data
-- Thay 'D21DCCN01-N' bằng class_code thực tế từ bước 1
UPDATE users 
SET class_code = 'D21DCCN01-N'  -- ← Thay bằng class thực tế
WHERE student_code = 'N21DCCN002';

-- Bước 3: Verify
SELECT username, student_code, class_code 
FROM users 
WHERE student_code = 'N21DCCN002';

-- Kết quả mong đợi:
-- username: n21dccn002
-- student_code: N21DCCN002
-- class_code: D21DCCN01-N
