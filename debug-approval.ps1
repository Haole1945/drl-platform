# Debug script to check evaluation status after approval
Write-Host "=== Checking evaluation-service logs for approval ===" -ForegroundColor Cyan
docker-compose -f infra/docker-compose.yml logs evaluation-service --tail 100 | Select-String -Pattern "approve|CLASS_MONITOR|status|Evaluation.*status" -Context 2

Write-Host "`n=== Checking database directly ===" -ForegroundColor Cyan
docker-compose -f infra/docker-compose.yml exec -T postgres psql -U drl -d drl_db -c "SELECT id, status, student_code, semester, updated_at FROM evaluations ORDER BY updated_at DESC LIMIT 5;"

Write-Host "`n=== Checking class_approvals ===" -ForegroundColor Cyan
docker-compose -f infra/docker-compose.yml exec -T postgres psql -U drl -d drl_db -c "SELECT evaluation_id, approver_id, approver_role, approver_name, created_at FROM class_approvals ORDER BY created_at DESC LIMIT 5;"

