# Troubleshooting: Evaluation Periods Endpoint 404

## Vấn đề

Endpoint `/api/evaluation-periods/open` trả về 404 "Không tìm thấy tài nguyên".

## Nguyên nhân

Controller `EvaluationPeriodController` chưa được compile vào JAR file, nên Spring không tìm thấy endpoint.

## Giải pháp

### Cách 1: Rebuild với script tự động

```powershell
cd scripts
.\fix-evaluation-periods.ps1
```

### Cách 2: Rebuild thủ công

```powershell
cd infra

# Stop và xóa container cũ
docker-compose stop evaluation-service
docker-compose rm -f evaluation-service

# Rebuild với --no-cache để đảm bảo code mới được compile
docker-compose build --no-cache evaluation-service

# Start lại service
docker-compose up -d evaluation-service

# Đợi service start (khoảng 20-30 giây)
Start-Sleep -Seconds 25

# Test endpoint
Invoke-WebRequest -Uri "http://localhost:8080/api/evaluation-periods/open" -Method GET
```

### Cách 3: Kiểm tra JAR timestamp

```powershell
# Kiểm tra timestamp của JAR trong container
docker-compose exec evaluation-service stat -c '%y' /app/app.jar

# Nếu timestamp cũ (trước khi bạn thêm controller), cần rebuild lại
```

## Kiểm tra

Sau khi rebuild, kiểm tra:

1. **Service logs** - Xem có lỗi compile không:
```powershell
docker-compose logs evaluation-service | Select-String -Pattern "ERROR|Exception|BUILD"
```

2. **Test endpoint trực tiếp** (không qua Gateway):
```powershell
Invoke-WebRequest -Uri "http://localhost:8083/evaluation-periods/open" -Method GET
```

3. **Test qua Gateway**:
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/evaluation-periods/open" -Method GET
```

## Kết quả mong đợi

- **Status 200 OK**
- **Response body**:
```json
{
  "success": true,
  "message": "Đợt đánh giá đang mở" hoặc "Không có đợt đánh giá nào đang mở",
  "data": { ... } hoặc null
}
```

## Lưu ý

- Nếu vẫn 404 sau khi rebuild, kiểm tra:
  1. Gateway có route `/api/evaluation-periods/**` chưa
  2. Gateway đã được rebuild và restart chưa
  3. Service có được register với Eureka chưa

- Nếu có lỗi compile, kiểm tra:
  1. Tất cả dependencies có đầy đủ không
  2. Package names có đúng không
  3. Imports có đúng không




