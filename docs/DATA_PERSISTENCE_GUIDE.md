# Hướng Dẫn Data Persistence trong Docker

## ⚠️ QUAN TRỌNG: Data có thể bị mất nếu không cẩn thận!

## 1. Khi nào data bị mất?

### ✅ Data KHÔNG mất khi:
- `docker-compose restart` - Chỉ restart containers, volume vẫn giữ nguyên
- `docker-compose stop` - Chỉ dừng containers, volume vẫn giữ nguyên
- `docker-compose down` - Xóa containers nhưng **KHÔNG xóa volumes** (nếu không có flag `-v`)

### ❌ Data BỊ MẤT khi:
- `docker-compose down -v` - **XÓA CẢ VOLUMES** → Mất toàn bộ data!
- `docker volume rm infra_dbdata` - Xóa volume thủ công
- Xóa thư mục volume trên host (nếu dùng bind mount)
- Recreate database container với volume mới

## 2. Kiểm tra Data hiện tại

### Xem số lượng evaluations:
```bash
cd infra
docker-compose exec postgres psql -U drl -d drl -c "SELECT COUNT(*) FROM evaluations;"
```

### Xem tất cả evaluations:
```bash
docker-compose exec postgres psql -U drl -d drl -c "SELECT id, student_code, semester, total_points, status, created_at FROM evaluations ORDER BY created_at DESC;"
```

### Kiểm tra volume có tồn tại:
```bash
docker volume ls | grep dbdata
```

## 3. Backup Data

### Backup toàn bộ database:
```bash
cd infra
docker-compose exec postgres pg_dump -U drl drl > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Backup chỉ evaluations:
```bash
docker-compose exec postgres psql -U drl -d drl -c "COPY (SELECT * FROM evaluations) TO STDOUT WITH CSV HEADER" > evaluations_backup.csv
```

## 4. Restore Data

### Restore từ backup:
```bash
cd infra
docker-compose exec -T postgres psql -U drl -d drl < backup_20241119_120000.sql
```

## 5. Cấu hình Volume

### Trong docker-compose.yml:
```yaml
services:
  postgres:
    volumes:
      - dbdata:/var/lib/postgresql/data  # Named volume - PERSISTENT
      # HOẶC
      - ./postgres-data:/var/lib/postgresql/data  # Bind mount - PERSISTENT
```

### Named volume (khuyến nghị):
- Tự động quản lý bởi Docker
- Tồn tại ngay cả khi xóa container
- Vị trí: `/var/lib/docker/volumes/infra_dbdata/_data` (Linux) hoặc `\\wsl$\docker-desktop-data\data\docker\volumes\infra_dbdata\_data` (Windows WSL2)

### Bind mount:
- Map trực tiếp vào thư mục trên host
- Dễ backup/restore thủ công
- Vị trí: `./postgres-data` (trong thư mục infra)

## 6. Phòng tránh mất data

### ✅ Best Practices:
1. **Luôn backup trước khi reset**:
   ```bash
   docker-compose exec postgres pg_dump -U drl drl > backup.sql
   ```

2. **Tránh dùng `-v` flag**:
   ```bash
   # ❌ KHÔNG làm thế này nếu muốn giữ data:
   docker-compose down -v
   
   # ✅ Dùng thế này thay vào đó:
   docker-compose down
   docker-compose up -d
   ```

3. **Kiểm tra volume trước khi xóa**:
   ```bash
   docker volume ls
   docker volume inspect infra_dbdata
   ```

4. **Sử dụng backup tự động** (cron job):
   ```bash
   # Thêm vào crontab (Linux) hoặc Task Scheduler (Windows)
   0 2 * * * cd /path/to/drl-platform/infra && docker-compose exec -T postgres pg_dump -U drl drl > /backups/drl_$(date +\%Y\%m\%d).sql
   ```

## 7. Khôi phục Data đã mất

### Nếu đã xóa volume nhưng chưa xóa container:
1. Dừng container:
   ```bash
   docker-compose stop postgres
   ```

2. Tạo volume mới và restore:
   ```bash
   docker volume create infra_dbdata
   docker-compose up -d postgres
   docker-compose exec -T postgres psql -U drl -d drl < backup.sql
   ```

### Nếu không có backup:
- ❌ **KHÔNG THỂ khôi phục** nếu đã xóa volume và không có backup
- Data đã mất vĩnh viễn
- Cần tạo lại từ đầu

## 8. Kiểm tra Data hiện tại

### Xem tất cả tables:
```bash
docker-compose exec postgres psql -U drl -d drl -c "\dt"
```

### Xem số lượng records trong mỗi table:
```bash
docker-compose exec postgres psql -U drl -d drl -c "
SELECT 
  'evaluations' as table_name, COUNT(*) as count FROM evaluations
UNION ALL
SELECT 'evaluation_details', COUNT(*) FROM evaluation_details
UNION ALL
SELECT 'rubrics', COUNT(*) FROM rubrics
UNION ALL
SELECT 'criteria', COUNT(*) FROM criteria;
"
```

## 9. Troubleshooting

### Vấn đề: "Data biến mất sau khi restart"
**Nguyên nhân có thể:**
- Đã dùng `docker-compose down -v`
- Volume không được mount đúng
- Database bị recreate

**Giải pháp:**
1. Kiểm tra volume: `docker volume ls`
2. Kiểm tra mount: `docker-compose config`
3. Kiểm tra data: `docker-compose exec postgres psql -U drl -d drl -c "SELECT COUNT(*) FROM evaluations;"`

### Vấn đề: "DBeaver không kết nối được"
**Lưu ý:** DBeaver chỉ là tool xem database, **KHÔNG ảnh hưởng** đến việc lưu data.

**Kết nối DBeaver:**
- Host: `localhost`
- Port: `5432`
- Database: `drl`
- User: `drl`
- Password: `drl`

## 10. Tóm tắt

| Hành động | Data có mất? | Ghi chú |
|-----------|--------------|---------|
| `docker-compose restart` | ❌ Không | Volume giữ nguyên |
| `docker-compose stop` | ❌ Không | Volume giữ nguyên |
| `docker-compose down` | ❌ Không | Volume giữ nguyên |
| `docker-compose down -v` | ✅ **CÓ** | **XÓA VOLUME** |
| `docker volume rm infra_dbdata` | ✅ **CÓ** | Xóa volume thủ công |
| Restart máy tính | ❌ Không | Volume giữ nguyên |
| Rebuild container | ❌ Không | Volume giữ nguyên |

**QUAN TRỌNG:** Luôn backup trước khi dùng `-v` flag!

