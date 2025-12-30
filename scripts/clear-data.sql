-- Clear all data but keep schema
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE evaluation_history;
TRUNCATE TABLE evaluation_details;
TRUNCATE TABLE evaluations;
TRUNCATE TABLE class_approvals;
TRUNCATE TABLE appeals;
TRUNCATE TABLE notifications;
TRUNCATE TABLE files;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Data cleared successfully!' AS message;
