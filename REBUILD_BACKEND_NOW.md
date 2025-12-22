# 🔧 Rebuild Backend - Áp Dụng Các Thay Đổi

## ⚠️ Vấn Đề Hiện Tại

Bạn đang gặp lỗi **"không lấy được đợt đánh giá"**. Nguyên nhân có thể là:

1. Backend chưa được rebuild sau khi sửa code
2. Có lỗi trong quá trình gọi API
3. Database chưa có đợt đánh giá nào đang mở

## ✅ Giải Pháp

### Bước 1: Rebuild Backend

Backend cần được rebuild để áp dụng các thay đổi:

- ADMIN approval permissions
- Appeals system
- Score display fixes

```bash
# Rebuild evaluation-service
docker-compose up -d --build evaluation-service

# Hoặc rebuild tất cả services
docker-compose up -d --build
```

### Bước 2: Kiểm Tra Logs

Sau khi rebuild, kiểm tra logs để xem có lỗi gì:

```bash
# Xem logs của evaluation-service
docker-compose logs -f evaluation-service

# Xem logs của gateway
docker-compose logs -f gateway
```

### Bước 3: Kiểm Tra Database

Đảm bảo có đợt đánh giá đang mở trong database:

```sql
-- Kết nối vào PostgreSQL
docker exec -it drl-postgres psql -U postgres -d drl_db

-- Kiểm tra các đợt đánh giá
SELECT id, name, start_date, end_date, is_active
FROM evaluation_periods
ORDER BY start_date DESC;

-- Nếu không có đợt nào active, tạo một đợt mới:
INSERT INTO evaluation_periods (name, start_date, end_date, is_active, created_at, updated_at)
VALUES (
  'Học kỳ 1 - 2024/2025',
  '2024-09-01',
  '2025-01-31',
  true,
  NOW(),
  NOW()
);
```

### Bước 4: Test API Trực Tiếp

Test API endpoint để xem có hoạt động không:

```bash
# Test qua gateway
curl http://localhost:8080/api/evaluation-periods/open

# Test trực tiếp evaluation-service
curl http://localhost:8083/api/evaluation-periods/open
```

## 🔍 Debug Frontend

Nếu backend hoạt động bình thường, kiểm tra frontend:

### 1. Mở Browser Console (F12)

Vào trang `/evaluations/new` và xem console có lỗi gì.

### 2. Kiểm Tra Network Tab

- Tìm request đến `/api/evaluation-periods/open`
- Xem response status code và data
- Nếu 404: Backend chưa có endpoint
- Nếu 500: Backend có lỗi
- Nếu 200 nhưng không có data: Database không có đợt đánh giá

### 3. Kiểm Tra Code

File `frontend/src/app/evaluations/new/page.tsx` đã được sửa đúng:

```typescript
const periodResponse = await getOpenPeriod();
if (periodResponse.success && periodResponse.data) {
  setOpenPeriod(periodResponse.data);
}
```

## 📝 Checklist

- [ ] Rebuild backend: `docker-compose up -d --build evaluation-service`
- [ ] Kiểm tra logs: `docker-compose logs -f evaluation-service`
- [ ] Kiểm tra database có đợt đánh giá active
- [ ] Test API endpoint trực tiếp
- [ ] Kiểm tra browser console
- [ ] Kiểm tra network tab

## 🚀 Lệnh Nhanh

```bash
# 1. Rebuild backend
cd infra
docker-compose up -d --build evaluation-service

# 2. Xem logs
docker-compose logs -f evaluation-service | Select-String -Pattern "error|Error|ERROR" -Context 2

# 3. Restart frontend (nếu cần)
cd ../frontend
npm run dev
```

## ⚡ Nếu Vẫn Lỗi

Nếu sau khi rebuild vẫn lỗi, cung cấp cho tôi:

1. **Error message** từ browser console
2. **Network response** từ API call
3. **Backend logs** khi gọi API

Tôi sẽ giúp bạn debug tiếp!

## 📌 Lưu Ý

- Frontend đã được sửa đúng, không cần thay đổi gì thêm
- Backend cần rebuild để áp dụng thay đổi về ADMIN permissions
- Database cần có ít nhất 1 đợt đánh giá với `is_active = true`
