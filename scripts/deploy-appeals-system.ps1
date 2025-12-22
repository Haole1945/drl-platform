# Script Triển Khai Hệ Thống Khiếu Nại
# Chạy script này để build và deploy backend với tính năng appeals

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TRIỂN KHAI HỆ THỐNG KHIẾU NẠI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Bước 1: Kiểm tra Maven
Write-Host "[1/5] Kiểm tra Maven..." -ForegroundColor Yellow
$mavenVersion = mvn -version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Maven chưa được cài đặt!" -ForegroundColor Red
    Write-Host "Vui lòng cài đặt Maven từ: https://maven.apache.org/download.cgi" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Maven đã sẵn sàng" -ForegroundColor Green
Write-Host ""

# Bước 2: Build Backend
Write-Host "[2/5] Build Backend..." -ForegroundColor Yellow
Set-Location backend/evaluation-service

Write-Host "Đang build... (có thể mất vài phút)" -ForegroundColor Gray
mvn clean install -DskipTests

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build thất bại!" -ForegroundColor Red
    Write-Host "Vui lòng kiểm tra lỗi ở trên" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

Write-Host "✅ Build thành công!" -ForegroundColor Green
Write-Host ""

# Bước 3: Kiểm tra Database
Write-Host "[3/5] Kiểm tra Database..." -ForegroundColor Yellow
Write-Host "⚠️  Đảm bảo PostgreSQL đang chạy và database đã được tạo" -ForegroundColor Yellow
Write-Host ""

# Bước 4: Thông báo về Migration
Write-Host "[4/5] Database Migration..." -ForegroundColor Yellow
Write-Host "Migration V13 sẽ tự động chạy khi backend khởi động" -ForegroundColor Gray
Write-Host "Migration sẽ tạo:" -ForegroundColor Gray
Write-Host "  - Bảng appeals" -ForegroundColor Gray
Write-Host "  - Bảng appeal_criteria" -ForegroundColor Gray
Write-Host "  - Bảng appeal_files" -ForegroundColor Gray
Write-Host "  - Cột appeal_deadline_days trong evaluation_periods" -ForegroundColor Gray
Write-Host ""

# Bước 5: Khởi động Backend
Write-Host "[5/5] Khởi động Backend..." -ForegroundColor Yellow
Write-Host "Backend sẽ chạy trên port 8083" -ForegroundColor Gray
Write-Host "Gateway sẽ route từ port 8080 đến 8083" -ForegroundColor Gray
Write-Host ""
Write-Host "Nhấn Ctrl+C để dừng backend" -ForegroundColor Yellow
Write-Host ""

# Chạy backend
mvn spring-boot:run

# Quay lại thư mục gốc khi dừng
Set-Location ../..
