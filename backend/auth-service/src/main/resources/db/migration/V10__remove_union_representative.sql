-- Migration: Remove UNION_REPRESENTATIVE role and users
-- This removes the UNION_REPRESENTATIVE role and all users with this role

-- Delete user_role associations for UNION_REPRESENTATIVE
DELETE FROM user_roles 
WHERE role_name = 'UNION_REPRESENTATIVE';

-- Delete UNION_REPRESENTATIVE role
DELETE FROM roles 
WHERE name = 'UNION_REPRESENTATIVE';

-- Delete users that only had UNION_REPRESENTATIVE role (if any)
-- Note: This will only delete users that have no other roles
DELETE FROM users 
WHERE id NOT IN (
    SELECT DISTINCT user_id 
    FROM user_roles
);

COMMENT ON TABLE roles IS 'Updated: UNION_REPRESENTATIVE role has been removed. Only CLASS_MONITOR approves at class level.';

