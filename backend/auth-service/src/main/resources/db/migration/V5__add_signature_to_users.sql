-- V5: Add digital signature support to users table
-- Date: 2024-12-28
-- Description: Add signature image URL and metadata for digital signature feature

-- Add signature columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_image_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_uploaded_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_hash VARCHAR(64); -- SHA-256 hash of signature image

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_signature ON users(signature_image_url) WHERE signature_image_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.signature_image_url IS 'URL to user signature image (PNG/JPG)';
COMMENT ON COLUMN users.signature_uploaded_at IS 'Timestamp when signature was uploaded';
COMMENT ON COLUMN users.signature_hash IS 'SHA-256 hash of signature image for verification';
