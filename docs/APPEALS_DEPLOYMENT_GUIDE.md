# Hướng Dẫn Triển Khai Hệ Thống Khiếu Nại

## ⚠️ Lỗi Hiện Tại

Bạn đang gặp lỗi: **"Không tìm thấy tài nguyên"** khi truy cập `/api/appeals/my`

Nguyên nhân:

1. ❌ Backend chưa chạy hoặc chưa có endpoint `/api/appeals`
2. ❌ Database migration V13 chưa được thực hiện
3. ❌ Bảng `appeals` chưa tồn tại trong database

## 🚀 Các Bước Triển Khai

### Bước 1: Kiểm Tra Backend

```bash
# Kiểm tra backend có đang chạy không
curl http://localhost:8080/api/appeals/my

# Nếu lỗi "Connection refused" → Backend chưa chạy
# Nếu lỗi 404 → Backend chạy nhưng chưa có endpoint
# Nếu lỗi 401 → Backend chạy, cần authentication
```

### Bước 2: Build Backend

```bash
# Di chuyển vào thư mục backend
cd backend/evaluation-service

# Build project (Maven)
mvn clean install -DskipTests

# Hoặc nếu dùng Gradle
./gradlew clean build -x test
```

### Bước 3: Chạy Database Migration

**Option A: Tự động (khi start backend)**

Backend sẽ tự động chạy migration khi khởi động nếu cấu hình đúng.

**Option B: Thủ công (nếu cần)**

```bash
# Kết nối vào PostgreSQL
psql -U your_username -d your_database

# Kiểm tra xem migration V13 đã chạy chưa
SELECT version, description, installed_on
FROM flyway_schema_history
WHERE version = '13';

# Nếu chưa có, chạy migration thủ công
# Copy nội dung từ V13__create_appeals_tables.sql và chạy
```

**Kiểm tra bảng đã tạo:**

```sql
-- Kiểm tra bảng appeals
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('appeals', 'appeal_criteria', 'appeal_files');

-- Kiểm tra cột appeal_deadline_days
SELECT column_name FROM information_schema.columns
WHERE table_name = 'evaluation_periods'
AND column_name = 'appeal_deadline_days';
```

### Bước 4: Khởi Động Backend

```bash
# Di chuyển vào thư mục backend
cd backend/evaluation-service

# Chạy Spring Boot application
mvn spring-boot:run

# Hoặc chạy file JAR
java -jar target/evaluation-service-0.0.1-SNAPSHOT.jar

# Hoặc nếu dùng Gradle
./gradlew bootRun
```

**Kiểm tra backend đã chạy:**

```bash
# Kiểm tra health endpoint
curl http://localhost:8083/actuator/health

# Kiểm tra appeals endpoint (cần token)
curl http://localhost:8080/api/appeals/my \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Bước 5: Kiểm Tra Gateway

```bash
# Gateway phải chạy trên port 8080
curl http://localhost:8080/actuator/health

# Kiểm tra routing đến evaluation-service
curl http://localhost:8080/api/evaluations
```

### Bước 6: Test Hệ Thống

1. **Login vào hệ thống**
2. **Tạo đánh giá mới**
3. **Nộp đánh giá** → Chờ duyệt qua 3 cấp
4. **Sau khi duyệt bởi Khoa** → Vào trang chi tiết đánh giá
5. **Kiểm tra nút "Khiếu nại"** có hiển thị không

## 🔧 Troubleshooting

### Lỗi 1: "Không tìm thấy tài nguyên" (404)

**Nguyên nhân:**

- Backend chưa có endpoint `/api/appeals`
- AppealController chưa được load

**Giải pháp:**

```bash
# 1. Kiểm tra file AppealController.java có tồn tại
ls backend/evaluation-service/src/main/java/ptit/drl/evaluation/api/AppealController.java

# 2. Rebuild backend
cd backend/evaluation-service
mvn clean install -DskipTests

# 3. Restart backend
mvn spring-boot:run
```

### Lỗi 2: Database Migration Failed

**Nguyên nhân:**

- Database connection failed
- Migration file có lỗi syntax

**Giải pháp:**

```bash
# 1. Kiểm tra database connection
psql -U your_username -d your_database -c "SELECT 1"

# 2. Kiểm tra Flyway history
psql -U your_username -d your_database -c "SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5"

# 3. Nếu migration failed, rollback và chạy lại
# Chạy file rollback U13__rollback_create_appeals_tables.sql
# Sau đó chạy lại V13__create_appeals_tables.sql
```

### Lỗi 3: Backend Không Khởi Động

**Nguyên nhân:**

- Port 8083 đã được sử dụng
- Database không kết nối được
- Compilation error

**Giải pháp:**

```bash
# 1. Kiểm tra port
netstat -ano | findstr :8083

# 2. Kiểm tra logs
tail -f backend/evaluation-service/logs/application.log

# 3. Kiểm tra database config
cat backend/evaluation-service/src/main/resources/application.yml
```

### Lỗi 4: Gateway Không Route Đến Appeals

**Nguyên nhân:**

- Gateway chưa cấu hình route cho `/api/appeals`
- Evaluation-service chưa register với Eureka

**Giải pháp:**

```yaml
# Thêm vào gateway configuration
spring:
  cloud:
    gateway:
      routes:
        - id: evaluation-service
          uri: lb://evaluation-service
          predicates:
            - Path=/api/evaluations/**,/api/appeals/**
```

## 📝 Checklist Triển Khai

- [ ] Backend evaluation-service đã build thành công
- [ ] Database migration V13 đã chạy thành công
- [ ] Bảng appeals, appeal_criteria, appeal_files đã tồn tại
- [ ] Cột appeal_deadline_days đã được thêm vào evaluation_periods
- [ ] Backend đang chạy trên port 8083
- [ ] Gateway đang chạy trên port 8080
- [ ] Gateway route đến evaluation-service thành công
- [ ] Frontend đã build và chạy thành công
- [ ] Có thể login vào hệ thống
- [ ] Dashboard hiển thị card "Khiếu nại của tôi"
- [ ] Có thể tạo đánh giá mới
- [ ] Có thể nộp và duyệt đánh giá
- [ ] Nút "Khiếu nại" hiển thị trên đánh giá FACULTY_APPROVED

## 🎯 Test Case Đầy Đủ

### Test 1: Tạo Khiếu Nại

1. Login với tài khoản sinh viên
2. Tạo đánh giá mới
3. Nộp đánh giá
4. Login với tài khoản lớp trưởng → Duyệt
5. Login với tài khoản cố vấn → Duyệt
6. Login với tài khoản khoa → Duyệt
7. Login lại với tài khoản sinh viên
8. Vào trang chi tiết đánh giá
9. **Kiểm tra:** Nút "Khiếu nại" có hiển thị không?
10. Click nút "Khiếu nại"
11. Điền lý do khiếu nại
12. Chọn tiêu chí
13. Gửi khiếu nại
14. **Kiểm tra:** Khiếu nại có xuất hiện trong "Khiếu nại của tôi" không?

### Test 2: Xét Duyệt Khiếu Nại

1. Login với tài khoản khoa/admin
2. Vào Dashboard
3. **Kiểm tra:** Card "Khiếu nại chờ xử lý" có hiển thị không?
4. Click vào card
5. **Kiểm tra:** Danh sách khiếu nại có hiển thị không?
6. Click vào một khiếu nại
7. Xem chi tiết khiếu nại
8. Nhập nhận xét
9. Click "Chấp nhận" hoặc "Từ chối"
10. **Kiểm tra:** Sinh viên có nhận được thông báo không?

## 🔍 Debug Commands

```bash
# Kiểm tra backend logs
tail -f backend/evaluation-service/logs/application.log | grep -i appeal

# Kiểm tra database
psql -U your_username -d your_database

# Trong psql:
\dt appeals*                    # List appeals tables
SELECT * FROM appeals LIMIT 5;  # View appeals data
SELECT * FROM evaluation_periods; # Check appeal_deadline_days

# Kiểm tra API endpoint
curl -X GET http://localhost:8080/api/appeals/my \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Kiểm tra Gateway routing
curl http://localhost:8080/actuator/gateway/routes | grep appeals
```

## 📞 Hỗ Trợ

Nếu vẫn gặp lỗi sau khi làm theo hướng dẫn:

1. **Kiểm tra logs backend** - Tìm lỗi cụ thể
2. **Kiểm tra database** - Đảm bảo migration đã chạy
3. **Kiểm tra network** - Đảm bảo frontend có thể kết nối backend
4. **Xem documentation** - `docs/APPEALS_SYSTEM_COMPLETE.md`

## ✅ Khi Nào Hệ Thống Sẵn Sàng?

Hệ thống sẵn sàng khi:

1. ✅ Backend chạy không có lỗi
2. ✅ Database có đầy đủ bảng appeals
3. ✅ API `/api/appeals/my` trả về 200 (hoặc 401 nếu chưa login)
4. ✅ Dashboard hiển thị card khiếu nại
5. ✅ Nút "Khiếu nại" hiển thị trên đánh giá FACULTY_APPROVED
6. ✅ Có thể tạo và xem khiếu nại thành công

Chúc bạn triển khai thành công! 🚀
