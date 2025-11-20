# Phase 4 Testing Guide

## 🚀 Quick Start

### Option 1: Automated Build & Test
```powershell
.\build-and-test-phase4.ps1
.\test-phase4.ps1
```

### Option 2: Manual Steps

#### 1. Build Services
```powershell
cd infra
docker-compose build gateway student-service
docker-compose up -d
```

#### 2. Wait for Services (10-15 seconds)
```powershell
Start-Sleep -Seconds 15
```

#### 3. Run Tests
```powershell
cd ..
.\test-phase4.ps1
```

## 📋 Test Coverage

The `test-phase4.ps1` script tests:

### ✅ Rubric Endpoints (3 tests)
- GET `/api/rubrics` - List all rubrics
- GET `/api/rubrics/active` - Get active rubric
- GET `/api/rubrics/{id}` - Get rubric by ID

### ✅ Criteria Endpoints (1 test)
- GET `/api/criteria?rubricId={id}` - Get criteria by rubric

### ✅ Evaluation Endpoints (8 tests)
- GET `/api/evaluations/student/{code}` - Get student evaluations
- POST `/api/evaluations` - Create evaluation
- GET `/api/evaluations/{id}` - Get by ID
- POST `/api/evaluations/{id}/submit` - Submit for approval
- GET `/api/evaluations/pending` - Get pending evaluations
- POST `/api/evaluations/{id}/approve` - Approve evaluation
- POST `/api/evaluations/{id}/reject` - Reject evaluation
- POST `/api/evaluations/{id}/resubmit` - Resubmit after rejection

## 🔍 Manual Testing

### Test Rubric Endpoints

```powershell
# Get all rubrics
Invoke-RestMethod -Uri "http://localhost:8080/api/rubrics"

# Get active rubric
Invoke-RestMethod -Uri "http://localhost:8080/api/rubrics/active"

# Get rubric by ID (replace {id} with actual ID)
Invoke-RestMethod -Uri "http://localhost:8080/api/rubrics/1"
```

### Test Criteria Endpoints

```powershell
# Get criteria by rubric (replace {id} with rubric ID)
Invoke-RestMethod -Uri "http://localhost:8080/api/criteria?rubricId=1"
```

### Test Evaluation Workflow

#### 1. Create Evaluation
```powershell
$body = @{
    studentCode = "N21DCCN001"
    rubricId = 1
    semester = "2024-2025-HK1"
    academicYear = "2024-2025"
    details = @(
        @{
            criteriaId = 1
            score = 8.5
            evidence = "Evidence 1"
            note = "Note 1"
        },
        @{
            criteriaId = 2
            score = 9.0
            evidence = "Evidence 2"
            note = "Note 2"
        }
    )
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/evaluations" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$evaluationId = $response.data.id
Write-Host "Created evaluation ID: $evaluationId"
```

#### 2. Submit Evaluation
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/evaluations/$evaluationId/submit" `
    -Method POST `
    -ContentType "application/json"
```

#### 3. Approve Evaluation
```powershell
$approvalBody = @{
    comment = "Approved by class advisor"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/evaluations/$evaluationId/approve" `
    -Method POST `
    -ContentType "application/json" `
    -Body $approvalBody
```

#### 4. Reject Evaluation
```powershell
$rejectBody = @{
    reason = "Missing evidence for criteria"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/evaluations/$evaluationId/reject" `
    -Method POST `
    -ContentType "application/json" `
    -Body $rejectBody
```

#### 5. Resubmit After Rejection
```powershell
$resubmitBody = @{
    details = @(
        @{
            criteriaId = 1
            score = 9.0
            evidence = "Updated evidence 1"
            note = "Updated note 1"
        }
    )
    responseToRejection = "Added more evidence as requested"
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:8080/api/evaluations/$evaluationId/resubmit" `
    -Method POST `
    -ContentType "application/json" `
    -Body $resubmitBody
```

## 🐛 Troubleshooting

### Services Not Starting
```powershell
# Check logs
docker-compose logs student-service
docker-compose logs gateway

# Restart services
docker-compose restart student-service gateway
```

### 404 Not Found
- Check gateway routes in `backend/gateway/src/main/resources/application.yml`
- Ensure routes include `/api/evaluations/**`, `/api/rubrics/**`, `/api/criteria/**`

### 500 Internal Server Error
- Check service logs: `docker-compose logs student-service`
- Verify database connection
- Check entity relationships are correct

### Compilation Errors
```powershell
# Rebuild from scratch
cd infra
docker-compose down
docker-compose build --no-cache student-service
docker-compose up -d
```

## ✅ Expected Results

### Successful Test Run Should Show:
- ✓ Rubric endpoints tested
- ✓ Criteria endpoints tested
- ✓ Evaluation CRUD tested
- ✓ Workflow (submit/approve/reject/resubmit) tested

### Evaluation Status Flow:
1. **DRAFT** → Created
2. **SUBMITTED** → After submit
3. **CLASS_APPROVED** → After first approve
4. **FACULTY_APPROVED** → After second approve
5. **CTSV_APPROVED** → After final approve
6. **REJECTED** → After reject
7. **SUBMITTED** → After resubmit (from REJECTED)

## 📊 Test Data

The test script uses:
- **Student Code**: `N21DCCN001` (from DataSeeder)
- **Rubric ID**: First rubric from database
- **Criteria IDs**: First 3 criteria from rubric
- **Semester**: `2024-2025-HK1` and `2024-2025-HK2`

## 🎯 Next Steps After Testing

1. **Fix any bugs found**
2. **Add more test cases** if needed
3. **Document any issues** in GitHub issues
4. **Proceed to Phase 5** (Authentication & Authorization)

---

**Happy Testing!** 🚀

