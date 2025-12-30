# PowerShell script to generate self-signed certificate for digital signature
# Usage: .\generate-certificate.ps1 -Name "Nguyen Van A" -Email "nguyenvana@ptit.edu.vn"

param(
    [string]$Name = "User Name",
    [string]$Email = "user@ptit.edu.vn",
    [string]$OutputDir = ".\certificates",
    [string]$Password = "DigitalSignature2024"
)

Write-Host "🔐 Generating Digital Signature Certificate..." -ForegroundColor Cyan
Write-Host "Name: $Name"
Write-Host "Email: $Email"
Write-Host ""

# Create output directory
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# Check if OpenSSL is available
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue

if (-not $opensslPath) {
    Write-Host "❌ OpenSSL not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install OpenSSL:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://slproweb.com/products/Win32OpenSSL.html"
    Write-Host "2. Or use Git Bash (includes OpenSSL)"
    Write-Host "3. Or install via Chocolatey: choco install openssl"
    exit 1
}

# Generate private key and certificate
& openssl req -x509 -newkey rsa:2048 `
  -keyout "$OutputDir\private-key.pem" `
  -out "$OutputDir\certificate.pem" `
  -days 365 `
  -nodes `
  -subj "/C=VN/ST=Hanoi/L=Hanoi/O=PTIT/OU=IT Department/CN=$Name/emailAddress=$Email"

# Convert to PKCS#12 format (.p12)
& openssl pkcs12 -export `
  -out "$OutputDir\certificate.p12" `
  -inkey "$OutputDir\private-key.pem" `
  -in "$OutputDir\certificate.pem" `
  -name "$Name Digital Signature" `
  -passout pass:$Password

Write-Host ""
Write-Host "✅ Certificate generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Files created:" -ForegroundColor Cyan
Write-Host "  - $OutputDir\private-key.pem (Private Key)"
Write-Host "  - $OutputDir\certificate.pem (Certificate)"
Write-Host "  - $OutputDir\certificate.p12 (PKCS#12 - Upload this file)"
Write-Host ""
Write-Host "🔑 Password for .p12 file: $Password" -ForegroundColor Yellow
Write-Host ""
Write-Host "📤 Upload 'certificate.p12' to the system" -ForegroundColor Green
Write-Host "🔐 Use password '$Password' when uploading" -ForegroundColor Green
