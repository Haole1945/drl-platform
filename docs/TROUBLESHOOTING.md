# Troubleshooting Guide

## 🔴 Lỗi: "Student not found with code: 'N21DCCN002'"

### Nguyên nhân:
- User đã được tạo trong `auth-service` với `studentCode = 'N21DCCN002'`
- Nhưng student data chưa được seed trong `student-service` database
- Hoặc database đã bị xóa/reset

### Giải pháp:

#### Cách 1: Reset và seed lại database (Khuyến nghị)

1. **Dừng tất cả services:**
   ```bash
   cd infra
   docker-compose down -v  # -v để xóa volumes (xóa database)
   ```

2. **Xóa database volume (nếu cần):**
   ```bash
   docker volume rm infra_dbdata
   ```

3. **Khởi động lại services:**
   ```bash
   docker-compose up -d
   ```

4. **Kiểm tra logs để đảm bảo seeder chạy:**
   ```bash
   docker-compose logs student-service | grep -i "seeding\|created students"
   ```

   Bạn sẽ thấy:
   ```
   Student service: Seeding initial data...
   ✓ Created students (10 students across all faculties and majors)
   ✅ Student service: Data seeding completed successfully!
   ```

#### Cách 2: Kiểm tra student có tồn tại không

1. **Kiểm tra student trong database:**
   ```bash
   # Kết nối vào PostgreSQL container
   docker exec -it drl-postgres psql -U drl -d drl
   
   # Kiểm tra student
   SELECT student_code, full_name FROM students WHERE student_code = 'N21DCCN002';
   ```

2. **Nếu không có, seed lại thủ công:**
   - Restart `student-service` container để trigger seeder:
     ```bash
     docker-compose restart student-service
     ```
   - Hoặc xóa một faculty để force seeder chạy lại:
     ```bash
     docker exec -it drl-postgres psql -U drl -d drl -c "DELETE FROM faculties WHERE code = 'CNTT2';"
     docker-compose restart student-service
     ```

#### Cách 3: Tạo student thủ công qua API (Nếu có quyền ADMIN)

```bash
curl -X POST http://localhost:8080/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studentCode": "N21DCCN002",
    "fullName": "Trần Thị Bình",
    "classCode": "D21CQCN01-N",
    "majorCode": "CN",
    "facultyCode": "CNTT2",
    "academicYear": "2024-2025"
  }'
```

---

## 🔴 Lỗi: "Không thể kết nối đến server"

### Nguyên nhân:
- Backend services chưa chạy
- Gateway không chạy hoặc không accessible
- User chưa đăng nhập (không có JWT token)
- CORS issue
- Network connectivity issue

### Giải pháp:

#### Bước 1: Kiểm tra Backend Services

```bash
cd infra
docker-compose ps
```

Tất cả services phải có status `Up` và `healthy`:
- ✅ `drl-postgres` - Up (healthy)
- ✅ `drl-eureka-server` - Up
- ✅ `drl-auth-service` - Up (healthy)
- ✅ `drl-student-service` - Up (healthy)
- ✅ `drl-evaluation-service` - Up (healthy)
- ✅ `drl-gateway` - Up (healthy)

Nếu có service nào không chạy:
```bash
docker-compose up -d <service-name>
# Ví dụ: docker-compose up -d gateway
```

#### Bước 2: Kiểm tra Gateway Health

```bash
# Windows PowerShell
Invoke-WebRequest -Uri http://localhost:8080/actuator/health -UseBasicParsing

# Hoặc mở browser: http://localhost:8080/actuator/health
```

Kết quả mong đợi: `{"status":"UP",...}`

#### Bước 3: Kiểm tra User đã đăng nhập chưa

1. **Mở Browser DevTools (F12)**
2. **Vào tab Application/Storage → Local Storage**
3. **Kiểm tra có key `accessToken` không**

Nếu không có token:
- **Đăng nhập lại** tại http://localhost:3000/login
- Token sẽ được lưu tự động sau khi login thành công

#### Bước 4: Kiểm tra CORS

Gateway đã được cấu hình CORS cho:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

Nếu frontend chạy trên port khác, cần thêm vào `CorsConfig.java`.

#### Bước 5: Kiểm tra Network Connectivity

```bash
# Test Gateway endpoint
curl http://localhost:8080/actuator/health

# Test API endpoint (cần token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/rubrics/active
```

#### Bước 6: Kiểm tra Logs

```bash
# Gateway logs
docker-compose logs gateway | tail -50

# Evaluation service logs
docker-compose logs evaluation-service | tail -50

# Frontend logs (nếu chạy trong Docker)
docker-compose logs frontend | tail -50
```

---

## ✅ Danh sách Test Accounts và Student Codes

Sau khi seed data, các test accounts sau sẽ có student data tương ứng:

| Username | Password | Role | Student Code | Student Name |
|----------|----------|------|--------------|--------------|
| `student` | `Student123!` | STUDENT | N21DCCN002 | Trần Thị Bình |
| `classmonitor` | `Monitor123!` | CLASS_MONITOR | N21DCCN001 | Nguyễn Văn An |
| `unionrep` | `Union123!` | UNION_REPRESENTATIVE | N21DCCN050 | Lê Văn Cường |

**Lưu ý:** Student data chỉ được seed khi database trống (chưa có faculties).

---

## 🔍 Kiểm tra Data Seeder có chạy không

### Student Service:
```bash
docker-compose logs student-service | grep -i "seeding\|created"
```

Kết quả mong đợi:
```
Student service: Seeding initial data...
✓ Created faculties (4 faculties)
✓ Created majors (8 majors)
✓ Created classes (10 classes)
✓ Created students (10 students across all faculties and majors)
✅ Student service: Data seeding completed successfully!
```

### Auth Service:
```bash
docker-compose logs auth-service | grep -i "seeding\|created"
```

Kết quả mong đợi:
```
[Auth Service] Seeding initial data...
✅ Auth service: Data seeding completed successfully!
```

### Evaluation Service:
```bash
docker-compose logs evaluation-service | grep -i "seeding\|created"
```

---

## 🐛 Các lỗi thường gặp khác

### Lỗi: "Database already seeded. Skipping..."
**Nguyên nhân:** Database đã có data, seeder không chạy lại.

**Giải pháp:** 
- Xóa database và restart: `docker-compose down -v && docker-compose up -d`
- Hoặc xóa một record để force seeder chạy lại

### Lỗi: "Failed to validate student code"
**Nguyên nhân:** Student-service không thể kết nối hoặc student không tồn tại.

**Giải pháp:**
1. Kiểm tra student-service đang chạy: `docker-compose ps student-service`
2. Kiểm tra student có tồn tại trong database
3. Kiểm tra Eureka service discovery: http://localhost:8761

### Lỗi: "Missing authorization header"
**Nguyên nhân:** User chưa đăng nhập hoặc token đã hết hạn.

**Giải pháp:**
1. Đăng nhập lại tại http://localhost:3000/login
2. Kiểm tra token trong Local Storage
3. Nếu token hết hạn, hệ thống sẽ tự động redirect đến login page

### Lỗi: Frontend hiển thị "Student not found" nhưng không crash
**Giải pháp:** Đây là behavior mong đợi. Frontend đã được sửa để handle error gracefully. Dashboard vẫn hoạt động bình thường, chỉ không hiển thị evaluations.

---

## 📝 Notes

- **Data Seeder chỉ chạy khi database trống** (check `faculties.count() > 0`)
- **Nếu đã có data**, seeder sẽ skip để tránh duplicate
- **Để seed lại**, cần xóa database hoặc xóa một record để force seeder chạy
- **JWT Token** có thời hạn, nếu hết hạn cần đăng nhập lại
- **CORS** chỉ cho phép các origin được cấu hình trong `CorsConfig.java`

---

**Last Updated:** November 18, 2024
