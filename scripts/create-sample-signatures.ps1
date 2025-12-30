# Create sample signature images for testing
# This script creates simple SVG images with text signatures

$signaturesPath = "backend/auth-service/src/main/resources/static/signatures"

# Ensure directory exists
if (-not (Test-Path $signaturesPath)) {
    New-Item -ItemType Directory -Force -Path $signaturesPath | Out-Null
}

Write-Host "Creating sample signature images..." -ForegroundColor Green

# Create advisor signature SVG
$advisorSvg = '<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">' +
  '<text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" ' +
  'text-anchor="middle" dominant-baseline="middle" fill="#000080">' +
  'Co van hoc tap' +
  '</text>' +
  '</svg>'

$advisorSvg | Out-File -FilePath "$signaturesPath/sample-advisor-signature.svg" -Encoding UTF8

# Create class monitor signature SVG
$monitorSvg = '<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">' +
  '<text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" ' +
  'text-anchor="middle" dominant-baseline="middle" fill="#000080">' +
  'Lop truong' +
  '</text>' +
  '</svg>'

$monitorSvg | Out-File -FilePath "$signaturesPath/sample-class-monitor-signature.svg" -Encoding UTF8

Write-Host "Created SVG signature files" -ForegroundColor Green
Write-Host ""
Write-Host "Note: SVG files created. For PNG files, you can:" -ForegroundColor Yellow
Write-Host "1. Use an online SVG to PNG converter" -ForegroundColor Yellow
Write-Host "2. Draw signatures manually and save as PNG" -ForegroundColor Yellow
Write-Host ""
Write-Host "Files created in: $signaturesPath" -ForegroundColor Cyan
