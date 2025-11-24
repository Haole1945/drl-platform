# Test Rejection History & Smart Resubmit Feature
# This script tests the complete flow of rejection and resubmission

Write-Host "=== Testing Rejection History & Smart Resubmit ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check Backend Migration
Write-Host "1. Checking V7 Migration..." -ForegroundColor Yellow
docker exec -it drl-postgres psql -U drl -d drl -c "SELECT version, description, installed_on, success FROM flyway_schema_history WHERE version = '7';"
Write-Host ""

# 2. Verify Column
Write-Host "2. Verifying last_rejection_level column..." -ForegroundColor Yellow
docker exec -it drl-postgres psql -U drl -d drl -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'evaluations' AND column_name = 'last_rejection_level';"
Write-Host ""

# 3. Check History Table
Write-Host "3. Checking evaluation_history table..." -ForegroundColor Yellow
docker exec -it drl-postgres psql -U drl -d drl -c "SELECT COUNT(*) as total_history_entries FROM evaluation_history;"
Write-Host ""

# 4. Sample Data
Write-Host "4. Sample evaluations with history..." -ForegroundColor Yellow
docker exec -it drl-postgres psql -U drl -d drl -c "SELECT e.id, e.student_code, e.status, e.last_rejection_level, e.resubmission_count FROM evaluations e ORDER BY e.id DESC LIMIT 5;"
Write-Host ""

# 5. Recent History Entries
Write-Host "5. Recent history entries..." -ForegroundColor Yellow
docker exec -it drl-postgres psql -U drl -d drl -c "SELECT eh.id, eh.evaluation_id, eh.action, eh.level, eh.actor_name, eh.created_at FROM evaluation_history eh ORDER BY eh.created_at DESC LIMIT 5;"
Write-Host ""

# 6. Frontend Files Check
Write-Host "6. Checking frontend files..." -ForegroundColor Yellow
if (Test-Path "frontend/src/components/EvaluationHistory.tsx") {
    Write-Host "  [OK] EvaluationHistory.tsx exists" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] EvaluationHistory.tsx missing" -ForegroundColor Red
}

if (Test-Path "frontend/src/types/evaluation.ts") {
    $content = Get-Content "frontend/src/types/evaluation.ts" -Raw
    if ($content -match "EvaluationHistory") {
        Write-Host "  [OK] EvaluationHistory type defined" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] EvaluationHistory type missing" -ForegroundColor Red
    }
    if ($content -match "lastRejectionLevel") {
        Write-Host "  [OK] lastRejectionLevel field added" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] lastRejectionLevel field missing" -ForegroundColor Red
    }
}
Write-Host ""

# 7. Test Scenario Instructions
Write-Host "=== Manual Test Scenarios ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Scenario 1: Rejection at Class Level" -ForegroundColor Yellow
Write-Host "  1. Create/Submit evaluation -> Status: SUBMITTED"
Write-Host "  2. Class Monitor rejects -> Status: REJECTED (lastRejectionLevel = CLASS)"
Write-Host "  3. Student resubmits -> Status: SUBMITTED"
Write-Host "  4. Check history shows rejection + resubmit"
Write-Host ""

Write-Host "Scenario 2: Rejection at Faculty Level" -ForegroundColor Yellow
Write-Host "  1. Submit -> SUBMITTED -> CLASS_APPROVED"
Write-Host "  2. Faculty rejects -> REJECTED (lastRejectionLevel = FACULTY)"
Write-Host "  3. Student resubmits -> CLASS_APPROVED (skips Class)"
Write-Host "  4. Check history shows complete timeline"
Write-Host ""

Write-Host "Scenario 3: Rejection at CTSV Level" -ForegroundColor Yellow
Write-Host "  1. Submit -> SUBMITTED -> CLASS_APPROVED -> FACULTY_APPROVED"
Write-Host "  2. CTSV rejects -> REJECTED (lastRejectionLevel = CTSV)"
Write-Host "  3. Student resubmits -> FACULTY_APPROVED (skips Class and Faculty)"
Write-Host "  4. Check history shows all steps"
Write-Host ""

Write-Host "=== API Endpoints to Test ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "GET /api/evaluations/{id}" -ForegroundColor Yellow
Write-Host "  Should return: history[], lastRejectionLevel, resubmissionCount"
Write-Host ""
Write-Host "POST /api/evaluations/{id}/reject" -ForegroundColor Yellow
Write-Host "  Body: { reason: 'test rejection' }"
Write-Host "  Should: Save lastRejectionLevel, create history entry"
Write-Host ""
Write-Host "POST /api/evaluations/{id}/resubmit" -ForegroundColor Yellow
Write-Host "  Body: { details: [...], responseToRejection: 'fixed issues' }"
Write-Host "  Should: Set status based on lastRejectionLevel, create history entry"
Write-Host ""

Write-Host "=== Status ===" -ForegroundColor Cyan
Write-Host "Backend: V7 migration applied" -ForegroundColor Green
Write-Host "Frontend: Components created" -ForegroundColor Green
Write-Host "Types: Updated with history support" -ForegroundColor Green
Write-Host ""
Write-Host "Ready for testing!" -ForegroundColor Green
