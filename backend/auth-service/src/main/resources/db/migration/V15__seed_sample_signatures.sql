-- V15: Seed sample signatures for testing
-- Author: System
-- Date: 2024-12-29
-- Description: Add sample signature URLs for advisor and class monitor users for testing

-- Update advisor user with sample signature
-- Assuming advisor username is 'advisor' or similar
UPDATE users 
SET 
    signature_image_url = '/api/files/signatures/sample-advisor-signature.png',
    signature_uploaded_at = CURRENT_TIMESTAMP,
    signature_hash = 'sample_advisor_hash_' || MD5(RANDOM()::text)
WHERE username IN ('advisor', 'cvht', 'gvcn', 'gvhd')
  AND signature_image_url IS NULL;

-- Update class monitor users with sample signature
-- Assuming class monitors have ROLE_CLASS_MONITOR or position = 'CLASS_MONITOR'
UPDATE users 
SET 
    signature_image_url = '/api/files/signatures/sample-class-monitor-signature.png',
    signature_uploaded_at = CURRENT_TIMESTAMP,
    signature_hash = 'sample_monitor_hash_' || MD5(RANDOM()::text)
WHERE username IN ('loptruong', 'monitor', 'N21DCCN001')
  AND signature_image_url IS NULL;

-- Alternative: Update by role if role information is in users table
-- UPDATE users 
-- SET 
--     signature_image_url = '/api/files/signatures/sample-signature.png',
--     signature_uploaded_at = CURRENT_TIMESTAMP,
--     signature_hash = 'sample_hash_' || MD5(RANDOM()::text)
-- WHERE id IN (
--     SELECT user_id FROM user_roles WHERE role_id IN (
--         SELECT id FROM roles WHERE name IN ('ROLE_ADVISOR', 'ROLE_CLASS_MONITOR')
--     )
-- )
-- AND signature_image_url IS NULL;

-- Log the update
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count 
    FROM users 
    WHERE signature_image_url LIKE '%sample-%signature.png';
    
    RAISE NOTICE 'Updated % users with sample signatures', updated_count;
END $$;
