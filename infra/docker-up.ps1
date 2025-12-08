# Docker Compose startup script with clean output
# Usage: .\docker-up.ps1

Set-Location $PSScriptRoot

Write-Host "Starting Docker Compose services..." -ForegroundColor Green
Write-Host ""

# Run docker-compose and filter output - only show final summary (✔ lines)
# Suppress all verbose "[+] Running" messages
docker-compose up --build 2>&1 | ForEach-Object {
    $line = $_.ToString()
    # Only show lines with ✔ (final summary) - hide everything else
    if ($line -match '✔') {
        Write-Host $line
    }
}

