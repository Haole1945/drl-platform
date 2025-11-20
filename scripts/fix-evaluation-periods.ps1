# Script to fix Evaluation Periods endpoint issue
# Rebuilds and restarts evaluation-service

Write-Host "🔧 Fixing Evaluation Periods endpoint..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\..\infra"

# Stop and remove old container
Write-Host "`n[1/4] Stopping evaluation-service..." -ForegroundColor Yellow
docker-compose stop evaluation-service
docker-compose rm -f evaluation-service

# Rebuild with no cache
Write-Host "`n[2/4] Rebuilding evaluation-service (this may take a few minutes)..." -ForegroundColor Yellow
docker-compose build --no-cache evaluation-service

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed! Check the logs above." -ForegroundColor Red
    exit 1
}

# Start service
Write-Host "`n[3/4] Starting evaluation-service..." -ForegroundColor Yellow
docker-compose up -d evaluation-service

# Wait for service to be healthy
Write-Host "`n[4/4] Waiting for service to be healthy..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$healthy = $false

while ($attempt -lt $maxAttempts -and -not $healthy) {
    Start-Sleep -Seconds 2
    $status = docker-compose ps evaluation-service | Select-String "healthy"
    if ($status) {
        $healthy = $true
        Write-Host "✅ Service is healthy!" -ForegroundColor Green
    } else {
        $attempt++
        Write-Host "  Waiting... ($attempt/$maxAttempts)" -ForegroundColor Gray
    }
}

if (-not $healthy) {
    Write-Host "`n⚠️  Service may not be fully ready. Check logs:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs evaluation-service" -ForegroundColor Gray
}

# Test endpoint
Write-Host "`n🧪 Testing endpoint..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/evaluation-periods/open" -Method GET -ErrorAction Stop
    Write-Host "✅ Endpoint is working! Status: $($response.StatusCode)" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "   Response: $($json.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Endpoint test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Try again in a few seconds or check logs:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs evaluation-service" -ForegroundColor Gray
}

Write-Host "`n✅ Done! Service has been rebuilt and restarted." -ForegroundColor Green




