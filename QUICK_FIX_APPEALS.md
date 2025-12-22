# 🚀 Giải Pháp: Khắc Phục Lỗi "Không tìm thấy tài nguyên"

## Nguyên Nhân

Lỗi xảy ra vì **backend chưa có endpoint `/api/appeals/my`**

Backend cần được build và khởi động để:

1. Tạo endpoint `/api/appeals/my`
2. Chạy migration V13 (tạo bảng appeals)
3. Kích hoạt AppealController

## Giải Pháp (3 Bước)

### Bước 1: Build Backend

```powershell
cd backend/evaluation-service
mvn clean install -DskipTests
```

**Thời gian:** ~2-3 phút

### Bước 2: Khởi Động Backend

```powershell
mvn spring-boot:run
```

**Khi nào backend sẵn sàng?**

- Thấy dòng: `Started EvaluationServiceApplication in X seconds`
- Migration V13 tự động chạy và tạo bảng appeals

### Bước 3: Kiểm Tra

Mở terminal mới và chạy:

```powershell
curl http://localhost:8080/api/appeals/my
```

**Kết quả mong đợi:**

- ❌ Trước: `404 Not Found` hoặc `Connection refused`
- ✅ Sau: `401 Unauthorized` (cần login) hoặc `200 OK` (nếu đã login)

## Kết Quả

Sau khi backend chạy:

- ✅ Lỗi "Không tìm thấy tài nguyên" biến mất
- ✅ Dashboard hiển thị card "Khiếu nại của tôi"
- ✅ Nút "Khiếu nại" hoạt động trên trang đánh giá
- ✅ Tất cả tính năng appeals hoạt động

## Script Tự Động (Tùy Chọn)

Hoặc chạy script tự động:

```powershell
.\scripts\deploy-appeals-system.ps1
```

Script này sẽ:

1. Kiểm tra Maven
2. Build backend
3. Khởi động backend
4. Chạy migration tự động

---

**Lưu ý:** Backend phải chạy liên tục. Nếu tắt backend, lỗi sẽ xuất hiện lại.
