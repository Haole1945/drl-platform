# Test class code implementation
# This script tests that classCode is properly returned in user data

Write-Host "=== Testing Class Code Implementation ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$authServiceUrl = "http://localhost:8081"
$studentEmail = "n21dccn001@student.ptithcm.edu.vn"
$username = "n21dccn001"

# Step 1: Request password (this should update classCode)
Write-Host "Step 1: Requesting password for $studentEmail" -ForegroundColor Yellow
$requestPasswordBody = @{
    email = $studentEmail
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$authServiceUrl/auth/request-password" `
        -Method POST `
        -ContentType "application/json" `
        -Body $requestPasswordBody
    
    Write-Host "✓ Password request successful" -ForegroundColor Green
    Write-Host "  Check email for password" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Password request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Enter the password from email" -ForegroundColor Yellow
$password = Read-Host "Password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

# Step 3: Login
Write-Host ""
Write-Host "Step 3: Logging in as $username" -ForegroundColor Yellow
$loginBody = @{
    username = $username
    password = $passwordPlain
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$authServiceUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    Write-Host "✓ Login successful" -ForegroundColor Green
    
    # Check if user object has classCode
    if ($loginResponse.data.user.classCode) {
        Write-Host "✓ classCode found: $($loginResponse.data.user.classCode)" -ForegroundColor Green
    } else {
        Write-Host "✗ classCode is missing or null" -ForegroundColor Red
        Write-Host "  User data:" -ForegroundColor Yellow
        $loginResponse.data.user | ConvertTo-Json -Depth 3
        exit 1
    }
    
    # Display full user data
    Write-Host ""
    Write-Host "User Data:" -ForegroundColor Cyan
    Write-Host "  ID: $($loginResponse.data.user.id)"
    Write-Host "  Username: $($loginResponse.data.user.username)"
    Write-Host "  Email: $($loginResponse.data.user.email)"
    Write-Host "  Full Name: $($loginResponse.data.user.fullName)"
    Write-Host "  Student Code: $($loginResponse.data.user.studentCode)"
    Write-Host "  Class Code: $($loginResponse.data.user.classCode)" -ForegroundColor Green
    Write-Host "  Roles: $($loginResponse.data.user.roles -join ', ')"
    
    # Save token for further testing
    $accessToken = $loginResponse.data.accessToken
    
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Get current user (verify classCode persists)
Write-Host ""
Write-Host "Step 4: Getting current user info" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    $currentUser = Invoke-RestMethod -Uri "$authServiceUrl/auth/me" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Current user retrieved" -ForegroundColor Green
    
    if ($currentUser.data.classCode) {
        Write-Host "✓ classCode persists: $($currentUser.data.classCode)" -ForegroundColor Green
    } else {
        Write-Host "✗ classCode is missing in /me endpoint" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "✗ Failed to get current user: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== All Tests Passed ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test rubric filtering with this classCode: $($currentUser.data.classCode)"
Write-Host "2. Verify frontend receives classCode in user object"
Write-Host "3. Test class-based rubric filtering in system-config page"
