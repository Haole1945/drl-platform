# Script to backup PostgreSQL database
Write-Host "💾 Backing up database..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\..\infra"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "..\backups\drl_backup_$timestamp.sql"
$backupDir = "..\backups"

# Create backups directory if it doesn't exist
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "✓ Created backups directory" -ForegroundColor Green
}

# Backup database
Write-Host "`nCreating backup: $backupFile" -ForegroundColor Yellow
docker-compose exec -T postgres pg_dump -U drl drl > $backupFile

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $backupFile).Length / 1KB
    Write-Host "✅ Backup created successfully! ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor Green
    Write-Host "   Location: $backupFile" -ForegroundColor Gray
} else {
    Write-Host "❌ Backup failed!" -ForegroundColor Red
    exit 1
}

# List recent backups
Write-Host "`nRecent backups:" -ForegroundColor Cyan
Get-ChildItem -Path $backupDir -Filter "drl_backup_*.sql" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 5 | 
    Format-Table Name, LastWriteTime, @{Name="Size (KB)";Expression={[math]::Round($_.Length/1KB, 2)}} -AutoSize




