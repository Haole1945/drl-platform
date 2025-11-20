# PowerShell script to start frontend development server
# Usage: .\scripts\dev-frontend.ps1

Write-Host "🚀 Starting Frontend Development Server..." -ForegroundColor Green

# Check if .env.local exists
if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "⚠️  .env.local not found. Creating from example..." -ForegroundColor Yellow
    Copy-Item "frontend\.env.local.example" "frontend\.env.local"
    Write-Host "✅ Created .env.local. Please check the values!" -ForegroundColor Green
}

# Check if node_modules exists
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    Set-Location frontend
    npm install --legacy-peer-deps
    Set-Location ..
}

# Start dev server
Write-Host "`n✨ Starting Next.js development server..." -ForegroundColor Green
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   API: http://localhost:8080/api" -ForegroundColor Cyan
Write-Host "`n   Press Ctrl+C to stop`n" -ForegroundColor Yellow

Set-Location frontend
npm run dev

