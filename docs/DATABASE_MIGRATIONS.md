# Database Migrations với Flyway

## Vấn đề trước đây

Trước đây, chúng ta phải chuyển đổi giữa `ddl-auto: update` và `ddl-auto: validate`:
- `update`: Tự động tạo/cập nhật schema từ entities (nguy hiểm, có thể mất dữ liệu)
- `validate`: Chỉ kiểm tra schema (an toàn nhưng yêu cầu tất cả bảng phải tồn tại)

**Vấn đề**: Mỗi khi thiếu bảng, phải tạm thời đổi sang `update`, tạo bảng, rồi đổi lại `validate`. Đây không phải cách làm chuyên nghiệp.

## Giải pháp: Flyway

Flyway là công cụ quản lý database migrations chuyên nghiệp, được Spring Boot hỗ trợ sẵn.

### Ưu điểm

1. **Version Control**: Mỗi migration có version (V1, V2, V3...)
2. **An toàn**: Không tự động thay đổi schema, chỉ chạy migrations đã định nghĩa
3. **Theo dõi**: Flyway lưu lịch sử migrations đã chạy trong bảng `flyway_schema_history`
4. **Không mất dữ liệu**: Migrations được viết cẩn thận, không tự động drop/create
5. **Production-ready**: Được sử dụng rộng rãi trong production

### Cấu trúc

```
src/main/resources/
  db/
    migration/
      V1__Create_evaluation_tables.sql    # Migration đầu tiên
      V2__Insert_initial_data.sql         # Migration thứ hai
      V3__Add_new_column.sql              # Migration tiếp theo...
```

### Quy tắc đặt tên

- `V{version}__{description}.sql`
- Version: Số nguyên tăng dần (1, 2, 3...)
- Description: Mô tả ngắn gọn, dùng dấu gạch dưới

### Cách hoạt động

1. Khi ứng dụng khởi động, Flyway kiểm tra bảng `flyway_schema_history`
2. So sánh migrations đã chạy với migrations trong `db/migration/`
3. Tự động chạy các migrations mới (chưa được chạy)
4. Không chạy lại migrations đã chạy

### Thêm migration mới

1. Tạo file mới: `V3__Add_new_feature.sql`
2. Viết SQL migration
3. Khởi động lại ứng dụng - Flyway tự động chạy migration mới

### Cấu hình trong application.yml

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none  # Flyway handles it
  
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true  # Tạo baseline nếu bảng đã tồn tại
    validate-on-migrate: true  # Validate migrations khi khởi động
```

### Lưu ý

- **Không bao giờ** sửa migrations đã chạy (V1, V2...). Thay vào đó, tạo migration mới (V3, V4...)
- **Luôn test** migrations trên database test trước khi deploy production
- **Backup database** trước khi chạy migrations trong production

### Rollback

Flyway không hỗ trợ rollback tự động. Nếu cần rollback:
1. Tạo migration mới để revert thay đổi
2. Hoặc restore từ backup

### So sánh với cách cũ

| Cách cũ | Flyway |
|--------|--------|
| Phải đổi `ddl-auto` qua lại | `ddl-auto: none` - không cần đổi |
| Không có version control | Có version control |
| Nguy hiểm (có thể mất dữ liệu) | An toàn (migrations được kiểm soát) |
| Khó theo dõi thay đổi | Dễ theo dõi (file SQL rõ ràng) |
| Không phù hợp production | Production-ready |


