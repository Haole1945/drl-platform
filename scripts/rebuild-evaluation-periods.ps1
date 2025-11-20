# Script to rebuild and restart services for Evaluation Periods feature
Write-Host "Rebuilding evaluation-service and gateway..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\..\infra"

# Build services
Write-Host "`n[1/3] Building evaluation-service..." -ForegroundColor Yellow
docker-compose build evaluation-service

Write-Host "`n[2/3] Building gateway..." -ForegroundColor Yellow
docker-compose build gateway

# Restart services
Write-Host "`n[3/3] Restarting services..." -ForegroundColor Yellow
docker-compose restart evaluation-service gateway

Write-Host "`n✅ Done! Services have been rebuilt and restarted." -ForegroundColor Green
Write-Host "Waiting for services to be healthy..." -ForegroundColor Cyan

Start-Sleep -Seconds 10

# Check service status
Write-Host "`nService Status:" -ForegroundColor Cyan
docker-compose ps evaluation-service gateway

Write-Host "`n✅ Ready! You can now test the evaluation periods feature." -ForegroundColor Green

