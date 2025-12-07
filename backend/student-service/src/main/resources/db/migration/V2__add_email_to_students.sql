-- Add email column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS idx_student_email ON students(email);

-- Add comment
COMMENT ON COLUMN students.email IS 'Student email (format: studentCode@student.ptithcm.edu.vn)';

