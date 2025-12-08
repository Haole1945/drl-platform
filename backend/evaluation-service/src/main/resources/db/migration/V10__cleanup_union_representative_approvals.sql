-- Migration: Clean up UNION_REPRESENTATIVE approvals from class_approvals table
-- This removes any approvals from UNION_REPRESENTATIVE role

-- Delete class approvals from UNION_REPRESENTATIVE
DELETE FROM class_approvals 
WHERE approver_role = 'UNION_REPRESENTATIVE';

COMMENT ON TABLE class_approvals IS 'Updated: Only CLASS_MONITOR approvals are tracked. UNION_REPRESENTATIVE role has been removed.';

