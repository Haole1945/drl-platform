-- Flyway Migration: V3__Create_notifications_table.sql
-- Creates notifications table for user notifications

-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    related_id BIGINT,
    related_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notification_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_user_read ON notifications(user_id, is_read);

