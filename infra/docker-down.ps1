# Docker Compose shutdown script
# Usage: .\docker-down.ps1

Set-Location $PSScriptRoot

Write-Host "Stopping Docker Compose services..." -ForegroundColor Yellow
docker-compose down -v

Write-Host "All services stopped and volumes removed." -ForegroundColor Green

