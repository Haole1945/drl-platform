# Tóm tắt các sửa lỗi

## ✅ Đã sửa

### 1. Lỗi Endpoint 404 "No static resource evaluation-periods/open"

**Nguyên nhân**: 
- Controller `EvaluationPeriodController` chưa được compile vào JAR
- Gateway chưa cho phép public access endpoint `/api/evaluation-periods/open`

**Giải pháp**:
1. ✅ Rebuild `evaluation-service` với `--no-cache`
2. ✅ Thêm `/api/evaluation-periods/open` vào public endpoints trong Gateway
3. ✅ Tạo table `evaluation_periods` thủ công bằng SQL (vì `ddl-auto: validate` không tạo table mới)

**Files đã sửa**:
- `backend/gateway/src/main/java/ptit/drl/gateway/filter/JwtAuthenticationFilter.java` - Thêm public endpoint
- `scripts/create-evaluation-periods-table.sql` - Script tạo table

### 2. Dữ liệu đánh giá bị mất

**Nguyên nhân**: 
- `ddl-auto: update` có thể gây mất data khi schema thay đổi
- Không có backup strategy

**Giải pháp**:
1. ✅ Đổi `ddl-auto: update` → `validate` (sau khi table đã được tạo)
2. ✅ Tạo script backup database: `scripts/backup-database.ps1`
3. ✅ Tạo script restore database: `scripts/restore-database.ps1`
4. ✅ Tạo documentation: `docs/DATA_PERSISTENCE.md`

**Files đã sửa**:
- `backend/evaluation-service/src/main/resources/application.yml` - Đổi `ddl-auto: validate`
- `scripts/backup-database.ps1` - Script backup
- `scripts/restore-database.ps1` - Script restore

## 📋 Các bước tiếp theo

### 1. Rebuild Gateway (đang chạy)
```powershell
cd infra
docker-compose build gateway
docker-compose restart gateway
```

### 2. Test endpoint
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/evaluation-periods/open" -Method GET
```

**Kết quả mong đợi**:
```json
{
  "success": true,
  "message": "Đợt đánh giá đang mở",
  "data": {
    "id": 1,
    "name": "Đợt 1 - Học kỳ 1 năm học 2024-2025",
    ...
  }
}
```

### 3. Đổi lại `ddl-auto: validate` (sau khi table đã có)

Sau khi table `evaluation_periods` đã được tạo, đổi lại:
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate  # Prevent data loss
```

## 🔍 Kiểm tra

### Kiểm tra table đã tồn tại:
```powershell
docker-compose exec postgres psql -U drl -d drl -c "\dt" | Select-String "evaluation_periods"
```

### Kiểm tra data:
```powershell
docker-compose exec postgres psql -U drl -d drl -c "SELECT * FROM evaluation_periods;"
docker-compose exec postgres psql -U drl -d drl -c "SELECT COUNT(*) FROM evaluations;"
```

### Backup database:
```powershell
cd scripts
.\backup-database.ps1
```

## ⚠️ Lưu ý

1. **Luôn backup** trước khi thay đổi schema
2. **Không dùng** `ddl-auto: update` trong production
3. **Kiểm tra Gateway** đã rebuild với code mới chưa
4. **Test endpoint** sau mỗi lần rebuild




