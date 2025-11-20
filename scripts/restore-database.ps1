# Script to restore PostgreSQL database from backup
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

Write-Host "🔄 Restoring database from backup..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\..\infra"

if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "`n⚠️  WARNING: This will REPLACE all current data!" -ForegroundColor Yellow
$confirm = Read-Host "Are you sure you want to continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "❌ Restore cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nRestoring from: $BackupFile" -ForegroundColor Yellow
docker-compose exec -T postgres psql -U drl drl < $BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database restored successfully!" -ForegroundColor Green
    
    # Verify restore
    Write-Host "`nVerifying restore..." -ForegroundColor Cyan
    docker-compose exec postgres psql -U drl -d drl -c "SELECT COUNT(*) as evaluations FROM evaluations; SELECT COUNT(*) as periods FROM evaluation_periods;" 2>&1
} else {
    Write-Host "❌ Restore failed!" -ForegroundColor Red
    exit 1
}




