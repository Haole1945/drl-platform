# Restart auth-service to apply database migration
Write-Host "Stopping auth-service..." -ForegroundColor Yellow

# Find and kill auth-service process (port 8081)
$authPort = 8081
$process = Get-NetTCPConnection -LocalPort $authPort -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "Stopped auth-service (PID: $process)" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "Auth-service not running" -ForegroundColor Yellow
}

# Start auth-service
Write-Host "`nStarting auth-service..." -ForegroundColor Yellow
Set-Location backend/auth-service
Start-Process -FilePath "mvn" -ArgumentList "spring-boot:run" -NoNewWindow
Set-Location ../..

Write-Host "`nAuth-service is starting..." -ForegroundColor Green
Write-Host "Wait 30-60 seconds for it to fully start" -ForegroundColor Cyan
Write-Host "Check logs in backend/auth-service/target/ if there are issues" -ForegroundColor Cyan
