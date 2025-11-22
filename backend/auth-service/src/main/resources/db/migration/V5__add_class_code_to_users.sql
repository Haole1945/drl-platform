-- Add class_code column to users table
-- This stores the class code from student-service for quick access

ALTER TABLE users ADD COLUMN class_code VARCHAR(20);

-- Add index for faster lookups
CREATE INDEX idx_users_class_code ON users(class_code);

-- Update existing users with class_code from student-service
-- This will be done by the application when users next login or request password
