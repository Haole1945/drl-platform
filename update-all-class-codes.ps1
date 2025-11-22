# Update classCode for all existing users
# This script fetches classCode from student-service and updates users

Write-Host "=== Updating Class Codes for All Users ===" -ForegroundColor Cyan
Write-Host ""

$authServiceUrl = "http://localhost:8081"
$studentServiceUrl = "http://localhost:8082"

# Get admin token first
Write-Host "Step 1: Login as admin" -ForegroundColor Yellow
$adminUsername = Read-Host "Admin username"
$adminPassword = Read-Host "Admin password" -AsSecureString
$adminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword))

$loginBody = @{
    username = $adminUsername
    password = $adminPasswordPlain
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$authServiceUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    $token = $loginResponse.data.accessToken
    Write-Host "✓ Login successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get all users
Write-Host ""
Write-Host "Step 2: Fetching all users" -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $usersResponse = Invoke-RestMethod -Uri "$authServiceUrl/auth/users?size=1000" `
        -Method GET `
        -Headers $headers
    
    $users = $usersResponse.data.content
    Write-Host "✓ Found $($users.Count) users" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to fetch users: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Update each user
Write-Host ""
Write-Host "Step 3: Updating class codes" -ForegroundColor Yellow
$updated = 0
$skipped = 0
$failed = 0

foreach ($user in $users) {
    if (-not $user.studentCode) {
        Write-Host "  - Skipping $($user.username) (no studentCode)" -ForegroundColor Gray
        $skipped++
        continue
    }
    
    if ($user.classCode) {
        Write-Host "  - Skipping $($user.username) (already has classCode: $($user.classCode))" -ForegroundColor Gray
        $skipped++
        continue
    }
    
    # Fetch student data
    try {
        $studentResponse = Invoke-RestMethod -Uri "$studentServiceUrl/students/$($user.studentCode)" `
            -Method GET `
            -Headers $headers
        
        if ($studentResponse.success -and $studentResponse.data.classCode) {
            $classCode = $studentResponse.data.classCode
            
            # Request password to trigger classCode update
            $requestPasswordBody = @{
                email = $user.email
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri "$authServiceUrl/auth/request-password" `
                -Method POST `
                -ContentType "application/json" `
                -Body $requestPasswordBody | Out-Null
            
            Write-Host "  ✓ Updated $($user.username) → $classCode" -ForegroundColor Green
            $updated++
        } else {
            Write-Host "  ✗ No classCode for $($user.username)" -ForegroundColor Yellow
            $failed++
        }
    } catch {
        Write-Host "  ✗ Failed to update $($user.username): $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    Start-Sleep -Milliseconds 100  # Rate limiting
}

Write-Host ""
Write-Host "=== Update Complete ===" -ForegroundColor Green
Write-Host "  Updated: $updated" -ForegroundColor Green
Write-Host "  Skipped: $skipped" -ForegroundColor Gray
Write-Host "  Failed: $failed" -ForegroundColor Red
Write-Host ""
Write-Host "Note: Users will receive password reset emails" -ForegroundColor Cyan
