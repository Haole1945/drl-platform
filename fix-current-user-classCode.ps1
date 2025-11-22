# Quick fix: Update classCode for current user (N21DCCN002)

Write-Host "=== Fixing classCode for N21DCCN002 ===" -ForegroundColor Cyan
Write-Host ""

$authServiceUrl = "http://localhost:8080/api"
$studentCode = "N21DCCN002"
$email = "n21dccn002@student.ptithcm.edu.vn"

Write-Host "Requesting password for $email..." -ForegroundColor Yellow
$requestBody = @{
    email = $email
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$authServiceUrl/auth/request-password" `
        -Method POST `
        -ContentType "application/json" `
        -Body $requestBody
    
    Write-Host "✓ Password request successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Check email for new password"
    Write-Host "2. Login again with new password"
    Write-Host "3. classCode will be updated automatically"
    Write-Host ""
    Write-Host "Or you can login now with the new password:" -ForegroundColor Yellow
    
    # Prompt for new password
    $password = Read-Host "Enter the password from email (or press Enter to skip)"
    
    if ($password) {
        Write-Host ""
        Write-Host "Testing login..." -ForegroundColor Yellow
        
        $loginBody = @{
            username = $studentCode.ToLower()
            password = $password
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "$authServiceUrl/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $loginBody
        
        Write-Host "✓ Login successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "User Info:" -ForegroundColor Cyan
        Write-Host "  Username: $($loginResponse.data.user.username)"
        Write-Host "  Student Code: $($loginResponse.data.user.studentCode)"
        Write-Host "  Class Code: $($loginResponse.data.user.classCode)" -ForegroundColor Green
        Write-Host ""
        
        if ($loginResponse.data.user.classCode) {
            Write-Host "✓ classCode is now set!" -ForegroundColor Green
            Write-Host "  Refresh the frontend page to see the change" -ForegroundColor Cyan
        } else {
            Write-Host "✗ classCode is still null" -ForegroundColor Red
            Write-Host "  Check if student-service has classCode for this student" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}
