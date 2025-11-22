# Script to check backend status and database

Write-Host "=== Checking Backend Status ===" -ForegroundColor Cyan

# 1. Check if evaluation-service is running
Write-Host "`n1. Checking if evaluation-service is running..." -ForegroundColor Yellow
docker-compose ps evaluation-service

# 2. Check recent logs for Flyway migration
Write-Host "`n2. Checking Flyway migrations..." -ForegroundColor Yellow
docker-compose logs evaluation-service | Select-String -Pattern "Flyway" | Select-Object -Last 10

# 3. Check for our debug logs
Write-Host "`n3. Checking for debug logs (🔍)..." -ForegroundColor Yellow
docker-compose logs evaluation-service | Select-String -Pattern "🔍" | Select-Object -Last 20

# 4. Check database structure
Write-Host "`n4. Checking database structure..." -ForegroundColor Yellow
docker-compose exec -T mysql mysql -u root -proot drl_evaluation -e "DESCRIBE rubrics;" 2>$null

# 5. Check current rubric data
Write-Host "`n5. Checking current rubric data..." -ForegroundColor Yellow
docker-compose exec -T mysql mysql -u root -proot drl_evaluation -e "SELECT id, name, is_active, target_classes FROM rubrics LIMIT 5;" 2>$null

Write-Host "`n=== Check Complete ===" -ForegroundColor Cyan
Write-Host "`nIf you see 'target_classes' column above, migration was successful!" -ForegroundColor Green
Write-Host "If not, run: docker-compose down -v && docker-compose build && docker-compose up -d" -ForegroundColor Yellow
