# Test script to verify rubric update with isActive and targetClasses

$baseUrl = "http://localhost:8080/api"

Write-Host "=== Testing Rubric Update ===" -ForegroundColor Cyan

# Step 1: Login to get token
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.accessToken
    Write-Host "✓ Login successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Get current rubric
Write-Host "`n2. Getting current rubric..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $rubricResponse = Invoke-RestMethod -Uri "$baseUrl/rubrics/1" -Method GET -Headers $headers
    $rubric = $rubricResponse.data
    Write-Host "✓ Current rubric:" -ForegroundColor Green
    Write-Host "  - Name: $($rubric.name)"
    Write-Host "  - isActive: $($rubric.isActive)"
    Write-Host "  - targetClasses: $($rubric.targetClasses)"
} catch {
    Write-Host "✗ Failed to get rubric: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Update rubric with isActive=false and targetClasses
Write-Host "`n3. Updating rubric (isActive=false, targetClasses=D21CQCN01-N)..." -ForegroundColor Yellow

$updateUrl = "$baseUrl/rubrics/1?isActive=false&targetClasses=D21CQCN01-N"
Write-Host "  URL: $updateUrl" -ForegroundColor Gray

try {
    $updateResponse = Invoke-RestMethod -Uri $updateUrl -Method PUT -Headers $headers -Body "{}" -ContentType "application/json"
    $updatedRubric = $updateResponse.data
    Write-Host "✓ Update response:" -ForegroundColor Green
    Write-Host "  - Name: $($updatedRubric.name)"
    Write-Host "  - isActive: $($updatedRubric.isActive)"
    Write-Host "  - targetClasses: $($updatedRubric.targetClasses)"
    
    # Verify the update
    if ($updatedRubric.isActive -eq $false) {
        Write-Host "`n✓✓✓ SUCCESS: isActive was updated to false!" -ForegroundColor Green
    } else {
        Write-Host "`n✗✗✗ FAILED: isActive is still true!" -ForegroundColor Red
    }
    
    if ($updatedRubric.targetClasses -eq "D21CQCN01-N") {
        Write-Host "✓✓✓ SUCCESS: targetClasses was updated!" -ForegroundColor Green
    } else {
        Write-Host "✗✗✗ FAILED: targetClasses was not updated!" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Update failed: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

# Step 4: Get rubric again to verify
Write-Host "`n4. Verifying update..." -ForegroundColor Yellow
try {
    $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/rubrics/1" -Method GET -Headers $headers
    $verifiedRubric = $verifyResponse.data
    Write-Host "✓ Verified rubric:" -ForegroundColor Green
    Write-Host "  - isActive: $($verifiedRubric.isActive)"
    Write-Host "  - targetClasses: $($verifiedRubric.targetClasses)"
    
    if ($verifiedRubric.isActive -eq $false -and $verifiedRubric.targetClasses -eq "D21CQCN01-N") {
        Write-Host "`n🎉 ALL TESTS PASSED! 🎉" -ForegroundColor Green
    } else {
        Write-Host "`n❌ TESTS FAILED - Data not persisted correctly" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Verification failed: $_" -ForegroundColor Red
}
