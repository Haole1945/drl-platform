-- Sync classCode cho TẤT CẢ users từ student data
-- Chạy script này trong database (cần access cả 2 databases)

-- Option 1: Nếu auth-service và student-service dùng chung database
UPDATE users u
INNER JOIN students s ON u.student_code = s.student_code
SET u.class_code = s.class_code
WHERE u.student_code IS NOT NULL 
  AND u.class_code IS NULL;

-- Option 2: Nếu dùng riêng database, export/import:
-- 1. Export từ student-service:
--    SELECT student_code, class_code FROM students;
-- 
-- 2. Import vào auth-service và update:
--    UPDATE users u
--    INNER JOIN temp_students s ON u.student_code = s.student_code
--    SET u.class_code = s.class_code;

-- Verify kết quả
SELECT 
    COUNT(*) as total_users,
    COUNT(class_code) as users_with_class,
    COUNT(*) - COUNT(class_code) as users_without_class
FROM users
WHERE student_code IS NOT NULL;
