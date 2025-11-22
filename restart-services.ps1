# Restart all backend services
# Use this after making changes that require service restart

param(
    [string]$Service = "all"  # Options: all, auth, student, evaluation, gateway, eureka
)

Write-Host "=== Restarting Backend Services ===" -ForegroundColor Cyan
Write-Host ""

function Stop-ServiceOnPort {
    param([int]$Port, [string]$ServiceName)
    
    Write-Host "Stopping $ServiceName (port $Port)..." -ForegroundColor Yellow
    $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
               Select-Object -ExpandProperty OwningProcess -First 1
    
    if ($process) {
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Stopped $ServiceName (PID: $process)" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Host "  - $ServiceName not running" -ForegroundColor Gray
    }
}

function Start-Service {
    param([string]$Path, [string]$ServiceName)
    
    Write-Host "Starting $ServiceName..." -ForegroundColor Yellow
    $originalPath = Get-Location
    Set-Location $Path
    Start-Process -FilePath "mvn" -ArgumentList "spring-boot:run" -WindowStyle Hidden
    Set-Location $originalPath
    Write-Host "  ✓ $ServiceName starting..." -ForegroundColor Green
}

# Stop services
if ($Service -eq "all" -or $Service -eq "eureka") {
    Stop-ServiceOnPort 8761 "Eureka Server"
}
if ($Service -eq "all" -or $Service -eq "auth") {
    Stop-ServiceOnPort 8081 "Auth Service"
}
if ($Service -eq "all" -or $Service -eq "student") {
    Stop-ServiceOnPort 8082 "Student Service"
}
if ($Service -eq "all" -or $Service -eq "evaluation") {
    Stop-ServiceOnPort 8083 "Evaluation Service"
}
if ($Service -eq "all" -or $Service -eq "gateway") {
    Stop-ServiceOnPort 8080 "Gateway"
}

Write-Host ""
Write-Host "Waiting for services to stop..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Start services
Write-Host ""
if ($Service -eq "all" -or $Service -eq "eureka") {
    Start-Service "backend/eureka-server" "Eureka Server"
    Write-Host "  Waiting 30s for Eureka to start..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30
}

if ($Service -eq "all" -or $Service -eq "auth") {
    Start-Service "backend/auth-service" "Auth Service"
    Start-Sleep -Seconds 2
}

if ($Service -eq "all" -or $Service -eq "student") {
    Start-Service "backend/student-service" "Student Service"
    Start-Sleep -Seconds 2
}

if ($Service -eq "all" -or $Service -eq "evaluation") {
    Start-Service "backend/evaluation-service" "Evaluation Service"
    Start-Sleep -Seconds 2
}

if ($Service -eq "all" -or $Service -eq "gateway") {
    Start-Service "backend/gateway" "Gateway"
}

Write-Host ""
Write-Host "=== Services Restarted ===" -ForegroundColor Green
Write-Host ""
Write-Host "Services are starting in the background..." -ForegroundColor Cyan
Write-Host "Wait 30-60 seconds for all services to be ready" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check status:" -ForegroundColor Yellow
Write-Host "  Eureka: http://localhost:8761"
Write-Host "  Gateway: http://localhost:8080"
Write-Host "  Auth: http://localhost:8081"
Write-Host "  Student: http://localhost:8082"
Write-Host "  Evaluation: http://localhost:8083"
Write-Host ""
Write-Host "Usage examples:" -ForegroundColor Yellow
Write-Host "  .\restart-services.ps1              # Restart all services"
Write-Host "  .\restart-services.ps1 -Service auth    # Restart only auth-service"
Write-Host "  .\restart-services.ps1 -Service evaluation  # Restart only evaluation-service"
