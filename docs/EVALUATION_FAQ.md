# FAQ về Đánh giá (Evaluation)

## 1. Sự khác biệt giữa "Lưu Nháp" và "Tạo Đánh giá"

### Hiện tại (Cần sửa)
Hiện tại, cả hai nút đều làm **giống hệt nhau**:
- Cả hai đều gọi API `createEvaluation`
- Cả hai đều tạo evaluation với status `DRAFT`
- Không có sự khác biệt về validation hoặc logic

### Nên có sự khác biệt như sau:

**"Lưu Nháp" (Save Draft)**:
- Cho phép lưu evaluation **chưa hoàn chỉnh**
- Không yêu cầu validation đầy đủ
- Có thể thiếu một số thông tin (ví dụ: chưa nhập đủ điểm, chưa upload file)
- Status: `DRAFT`
- Mục đích: Lưu tạm để tiếp tục chỉnh sửa sau

**"Tạo Đánh giá" (Create Evaluation)**:
- Yêu cầu **validation đầy đủ**
- Phải nhập đủ tất cả điểm
- Phải có bằng chứng cho các tiêu chí quan trọng
- Status: `DRAFT` (nhưng đã hoàn chỉnh)
- Có thể tự động submit nếu có đợt đánh giá đang mở
- Mục đích: Tạo evaluation hoàn chỉnh, sẵn sàng để submit

### Cách sửa (Đề xuất)
1. Thêm parameter `asDraft` vào API `createEvaluation`
2. Nếu `asDraft = true`: Bỏ qua một số validation
3. Nếu `asDraft = false`: Validate đầy đủ, có thể tự động submit nếu có đợt mở

## 2. Data Persistence trong Docker

### Câu hỏi: Khi restart Docker, các evaluation đã tạo có mất không?

**Trả lời: KHÔNG mất**, nếu bạn sử dụng Docker volumes đúng cách.

### Cách hoạt động:

1. **PostgreSQL Database**:
   - Data được lưu trong **Docker volume** tên `dbdata`
   - Volume này **tồn tại độc lập** với container
   - Khi restart container, volume vẫn giữ nguyên data

2. **Cấu hình trong docker-compose.yml**:
```yaml
postgres:
  volumes:
    - dbdata:/var/lib/postgresql/data  # Volume mount
```

3. **Nơi lưu trữ**:
   - **Trên Windows**: `\\wsl$\docker-desktop-data\data\docker\volumes\dbdata\_data`
   - **Trên Linux/Mac**: `/var/lib/docker/volumes/dbdata/_data`
   - Data được lưu **ngoài container**, nên không mất khi restart

4. **Khi nào data bị mất?**:
   - ❌ **KHÔNG mất** khi: `docker-compose restart`, `docker-compose stop/start`
   - ❌ **KHÔNG mất** khi: Restart máy tính
   - ✅ **CHỈ mất** khi: `docker-compose down -v` (xóa volumes)
   - ✅ **CHỈ mất** khi: `docker volume rm dbdata` (xóa volume thủ công)

### Kiểm tra data có tồn tại không:

```bash
# Kiểm tra volume
docker volume ls

# Kiểm tra data trong database
docker-compose exec postgres psql -U drl -d drl -c "SELECT COUNT(*) FROM evaluations;"
```

### Backup và Restore:

**Backup**:
```bash
docker-compose exec postgres pg_dump -U drl drl > backup.sql
```

**Restore**:
```bash
docker-compose exec -T postgres psql -U drl -d drl < backup.sql
```

### Lưu ý quan trọng:

1. **File uploads**: Files được lưu trong container filesystem, **CÓ THỂ MẤT** khi rebuild container
   - Giải pháp: Mount volume cho thư mục uploads
   - Ví dụ: `- ./uploads:/app/uploads`

2. **Flyway migrations**: Đã được chạy và lưu trong database, không cần chạy lại

3. **Data seeding**: Chạy lại mỗi khi container start (nhưng có check để không duplicate)

## 3. Giao diện Chi tiết Đánh giá

Trang chi tiết đánh giá (`/evaluations/[id]`) đã được cập nhật để có giao diện **giống hệt** trang tạo mới (`/evaluations/new`), nhưng ở chế độ **read-only**:

- Hiển thị tất cả criteria với sub-criteria
- Hiển thị điểm cho từng sub-criteria
- Hiển thị files bằng chứng với links để xem
- Layout giống trang new, dễ đọc và nhất quán


