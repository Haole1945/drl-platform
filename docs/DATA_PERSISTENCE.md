# Data Persistence - Tránh Mất Dữ Liệu

## Vấn đề

Dữ liệu đánh giá bị mất sau khi restart service hoặc rebuild.

## Nguyên nhân

### 1. `ddl-auto: update` (Đã sửa)

**Vấn đề**: Khi Hibernate schema thay đổi, `ddl-auto: update` có thể:
- Drop và recreate tables
- Mất dữ liệu khi có conflict
- Không an toàn trong production

**Giải pháp**: Đã đổi sang `ddl-auto: validate`
- `validate`: Chỉ kiểm tra schema, không thay đổi gì
- `none`: Không làm gì cả
- `update`: Chỉ dùng trong development

### 2. Docker Volume

**Kiểm tra volume**:
```powershell
docker volume ls | Select-String "drl"
docker volume inspect infra_dbdata
```

**Đảm bảo volume được mount**:
```yaml
volumes:
  - dbdata:/var/lib/postgresql/data
```

### 3. Database Connection

**Kiểm tra connection**:
```powershell
docker-compose exec postgres psql -U drl -d drl -c "SELECT COUNT(*) FROM evaluations;"
```

## Best Practices

### 1. Backup Database

**Tạo backup**:
```powershell
docker-compose exec postgres pg_dump -U drl drl > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql
```

**Restore backup**:
```powershell
docker-compose exec -T postgres psql -U drl drl < backup_20241118_143000.sql
```

### 2. Migration Scripts

Thay vì dùng `ddl-auto: update`, nên dùng:
- **Flyway** hoặc **Liquibase** cho database migrations
- Script SQL để thay đổi schema
- Version control cho schema changes

### 3. Production Settings

**application.yml cho production**:
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate  # hoặc 'none'
```

**Không bao giờ dùng**:
- `ddl-auto: create` - Xóa tất cả data mỗi lần start
- `ddl-auto: create-drop` - Xóa data khi shutdown

## Kiểm tra Data

### Xem tất cả evaluations:
```powershell
docker-compose exec postgres psql -U drl -d drl -c "SELECT id, student_code, semester, status, created_at FROM evaluations ORDER BY created_at DESC;"
```

### Xem evaluation periods:
```powershell
docker-compose exec postgres psql -U drl -d drl -c "SELECT * FROM evaluation_periods;"
```

### Xem students:
```powershell
docker-compose exec postgres psql -U drl -d drl -c "SELECT student_code, full_name FROM students LIMIT 10;"
```

## Troubleshooting

### Data bị mất sau rebuild

**Nguyên nhân**: Volume bị xóa hoặc container mới không mount volume cũ

**Giải pháp**:
1. Kiểm tra volume còn tồn tại:
```powershell
docker volume ls
```

2. Nếu volume bị mất, restore từ backup

3. Đảm bảo `docker-compose.yml` có volume mapping:
```yaml
volumes:
  - dbdata:/var/lib/postgresql/data
```

### Data không persist giữa các lần restart

**Nguyên nhân**: Volume không được mount đúng

**Giải pháp**:
1. Stop tất cả services
2. Kiểm tra volume: `docker volume inspect infra_dbdata`
3. Restart: `docker-compose up -d`

## Lưu ý

- **Luôn backup** trước khi thay đổi schema
- **Không dùng** `ddl-auto: update` trong production
- **Kiểm tra volume** sau mỗi lần rebuild
- **Test restore** backup định kỳ




