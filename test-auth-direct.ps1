# Quick test script for auth-service direct access (bypassing Gateway)
# This tests if auth-service is working correctly

Write-Host "=== Testing Auth Service Directly (Port 8082) ===" -ForegroundColor Cyan
Write-Host ""

# Generate unique username
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testUsername = "testuser_$timestamp"
$testEmail = "test_$timestamp@test.com"

Write-Host "1. Testing User Registration..." -ForegroundColor Yellow
Write-Host "   Username: $testUsername" -ForegroundColor Gray

$body = @{
    username = $testUsername
    email = $testEmail
    password = "Test123456"
    fullName = "Test User"
    studentCode = "N21DCCN001"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8082/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "   ✅ SUCCESS: User registered!" -ForegroundColor Green
    Write-Host "   User ID: $($response.data.id)" -ForegroundColor Gray
    Write-Host "   Username: $($response.data.username)" -ForegroundColor Gray
    Write-Host "   Email: $($response.data.email)" -ForegroundColor Gray
    Write-Host ""
    
    # Test login
    Write-Host "2. Testing Login..." -ForegroundColor Yellow
    
    $loginBody = @{
        username = $testUsername
        password = "Test123456"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8082/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop
    
    Write-Host "   ✅ SUCCESS: Login successful!" -ForegroundColor Green
    Write-Host "   Access Token: $($loginResponse.data.accessToken.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "   Refresh Token: $($loginResponse.data.refreshToken.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "=== All Tests Passed! ===" -ForegroundColor Green
    Write-Host "Auth-service is working correctly." -ForegroundColor Green
    
} catch {
    $statusCode = $null
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }
    
    $errorMsg = $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        try {
            $errObj = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorMsg = $errObj.message
        } catch {
            $errorMsg = $_.ErrorDetails.Message
        }
    }
    
    Write-Host "   ❌ ERROR: $errorMsg" -ForegroundColor Red
    if ($statusCode) {
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check if auth-service is running: docker ps | findstr auth-service" -ForegroundColor Gray
    Write-Host "2. Check auth-service logs: docker logs drl-auth-service --tail 50" -ForegroundColor Gray
    Write-Host "3. Check if port 8082 is accessible: Test-NetConnection localhost -Port 8082" -ForegroundColor Gray
}

