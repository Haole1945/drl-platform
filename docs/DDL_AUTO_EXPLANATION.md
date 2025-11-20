# Giải thích về `ddl-auto` trong Hibernate

## Các giá trị có thể dùng

### 1. `none` (Không làm gì)
```yaml
ddl-auto: none
```
- **Mô tả**: Không làm gì cả, Hibernate không thay đổi database schema
- **Khi nào dùng**: Production khi schema đã ổn định
- **An toàn**: ✅ Rất an toàn

### 2. `validate` (Chỉ kiểm tra)
```yaml
ddl-auto: validate
```
- **Mô tả**: Chỉ kiểm tra xem schema có khớp với entities không, KHÔNG thay đổi gì
- **Khi nào dùng**: Production, sau khi schema đã được tạo
- **An toàn**: ✅ An toàn - không mất data
- **Lỗi nếu**: Schema không khớp với entities → Application sẽ không start

### 3. `update` (Tự động cập nhật)
```yaml
ddl-auto: update
```
- **Mô tả**: Tự động thêm/sửa columns, indexes khi entities thay đổi
- **Khi nào dùng**: Development, khi đang phát triển và thay đổi schema thường xuyên
- **An toàn**: ⚠️ Có thể gây mất data nếu:
  - Đổi tên column
  - Đổi kiểu dữ liệu
  - Xóa column
  - Có conflict giữa schema cũ và mới

### 4. `create` (Tạo mới - NGUY HIỂM)
```yaml
ddl-auto: create
```
- **Mô tả**: XÓA TẤT CẢ tables và tạo lại từ đầu mỗi lần start
- **Khi nào dùng**: CHỈ trong development, khi muốn reset database hoàn toàn
- **An toàn**: ❌ RẤT NGUY HIỂM - MẤT TẤT CẢ DATA
- **⚠️ KHÔNG BAO GIỜ DÙNG TRONG PRODUCTION**

### 5. `create-drop` (Tạo và xóa - NGUY HIỂM)
```yaml
ddl-auto: create-drop
```
- **Mô tả**: Tạo tables khi start, XÓA TẤT CẢ khi shutdown
- **Khi nào dùng**: CHỈ trong testing
- **An toàn**: ❌ RẤT NGUY HIỂM - MẤT DATA KHI SHUTDOWN

## Khuyến nghị

### Development
```yaml
ddl-auto: update  # Tiện lợi khi đang phát triển
```

### Production
```yaml
ddl-auto: validate  # An toàn, chỉ kiểm tra
# hoặc
ddl-auto: none  # Không làm gì cả
```

## Cách đổi trong project này

### File: `backend/evaluation-service/src/main/resources/application.yml`
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate  # Đã đổi từ 'update' sang 'validate'
```

### Sau khi đổi, cần restart service:
```powershell
cd infra
docker-compose restart evaluation-service
```

## Lưu ý

1. **Luôn backup** trước khi đổi `ddl-auto`
2. **Không dùng** `create` hoặc `create-drop` trong production
3. **Dùng `validate`** khi schema đã ổn định
4. **Dùng `update`** chỉ trong development

## Nếu cần thay đổi schema

Thay vì dùng `ddl-auto: update`, nên:
1. Tạo migration script (SQL)
2. Dùng Flyway hoặc Liquibase
3. Test trên database copy trước
4. Backup trước khi chạy migration



