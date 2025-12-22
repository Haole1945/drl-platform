# Rebuild backend with Appeals API
Write-Host "Rebuilding evaluation-service with Appeals API..." -ForegroundColor Cyan

Set-Location infra

# Stop the service
Write-Host "Stopping evaluation-service..." -ForegroundColor Yellow
docker-compose stop evaluation-service

# Rebuild and start
Write-Host "Rebuilding and starting evaluation-service..." -ForegroundColor Yellow
docker-compose up -d --build evaluation-service

# Wait for service to be ready
Write-Host "Waiting for service to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check status
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose ps evaluation-service

Write-Host "`nBackend rebuild complete!" -ForegroundColor Green
Write-Host "Appeals API should now be available at http://localhost:8080/api/appeals" -ForegroundColor Green

Set-Location ..
