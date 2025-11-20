# Email Authentication Implementation

## Tổng quan

Hệ thống đã được cập nhật để sử dụng email trường thay vì đăng ký tự do. Mỗi học sinh chỉ có một tài khoản duy nhất.

## Flow xác thực mới

### 1. Yêu cầu mật khẩu (Request Password)

**Frontend:** `/request-password`
- Học sinh nhập email trường (format: `studentCode@student.ptithcm.edu.vn`)
- Hệ thống validate email format
- Gửi request đến backend

**Backend:** `POST /api/auth/request-password`
- Extract studentCode từ email
- Validate student tồn tại trong database
- Nếu user chưa tồn tại: tạo user mới với mật khẩu ngẫu nhiên
- Nếu user đã tồn tại: reset mật khẩu mới
- Gửi mật khẩu qua email

### 2. Đăng nhập (Login)

**Frontend:** `/login`
- Học sinh nhập email hoặc username và mật khẩu
- Hệ thống hỗ trợ cả email và username để đăng nhập

**Backend:** `POST /api/auth/login`
- Tìm user theo email hoặc username
- Verify password
- Trả về JWT tokens

## Các thay đổi

### Backend (auth-service)

1. **Thêm Spring Mail dependency**
   - `spring-boot-starter-mail` trong `pom.xml`

2. **Email Configuration** (`application.yml`)
   ```yaml
   spring:
     mail:
       host: ${MAIL_HOST:smtp.gmail.com}
       port: ${MAIL_PORT:587}
       username: ${MAIL_USERNAME:}
       password: ${MAIL_PASSWORD:}
       from: ${MAIL_FROM:noreply@ptithcm.edu.vn}
   ```

3. **EmailService** (`EmailService.java`)
   - Service để gửi email với mật khẩu
   - Template email tiếng Việt

4. **RequestPasswordRequest DTO**
   - Validate email format: `^[a-z0-9]+@student\.ptithcm\.edu\.vn$`

5. **AuthService.requestPassword()**
   - Extract studentCode từ email
   - Validate student tồn tại
   - Generate random password (8-12 ký tự)
   - Tạo hoặc update user
   - Gửi email

6. **AuthService.login()**
   - Hỗ trợ login bằng email hoặc username
   - Tìm user theo email trước, nếu không có thì tìm theo username

7. **AuthController**
   - Thêm endpoint `POST /auth/request-password`

### Backend (student-service)

1. **Student Entity**
   - Thêm trường `position` (chức vụ)
   - Enum `StudentPosition`: NONE, CLASS_MONITOR, VICE_MONITOR, SECRETARY, etc.

### Frontend

1. **Request Password Page** (`/request-password`)
   - Form nhập email trường
   - Validate format email
   - Hiển thị thông báo thành công/thất bại

2. **Login Page** (`/login`)
   - Cập nhật label: "Email hoặc Username"
   - Link đến `/request-password` thay vì `/register`

3. **Home Page** (`/`)
   - Redirect đến `/request-password` thay vì `/login` nếu chưa đăng nhập

4. **Auth Functions** (`lib/auth.ts`)
   - Thêm `requestPassword()` function

5. **Types** (`types/auth.ts`)
   - Thêm `RequestPasswordRequest` interface

## Cấu hình Email

### Environment Variables

Cần set các biến môi trường sau trong Docker Compose hoặc `.env`:

```yaml
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@ptithcm.edu.vn
```

### Gmail Setup

1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password as `MAIL_PASSWORD`

### Production Email Service

Cho production, nên dùng email service chuyên nghiệp:
- SendGrid
- AWS SES
- Mailgun
- Hoặc SMTP server của trường

## Chức vụ học sinh (Position)

### Enum: StudentPosition

- `NONE`: Không có chức vụ
- `CLASS_MONITOR`: Lớp trưởng
- `VICE_MONITOR`: Lớp phó
- `SECRETARY`: Bí thư
- `DEPUTY_SECRETARY`: Phó bí thư
- `TREASURER`: Thủ quỹ
- `CULTURAL_OFFICER`: Cán bộ văn thể
- `STUDY_OFFICER`: Cán bộ học tập

### Sử dụng

Cán bộ lớp (CLASS_MONITOR, VICE_MONITOR, SECRETARY) có thể xét duyệt các phiếu chấm điểm rèn luyện.

## Testing

### Test Request Password

```bash
curl -X POST http://localhost:8080/api/auth/request-password \
  -H "Content-Type: application/json" \
  -d '{"email": "n21dccn001@student.ptithcm.edu.vn"}'
```

### Test Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "n21dccn001@student.ptithcm.edu.vn", "password": "generated_password"}'
```

## Lưu ý

1. **Email Format**: Chỉ chấp nhận email có format `studentCode@student.ptithcm.edu.vn`
2. **Password Security**: Mật khẩu được generate ngẫu nhiên, đảm bảo có uppercase, lowercase, và số
3. **One Account Per Student**: Mỗi studentCode chỉ có một tài khoản duy nhất
4. **Email Delivery**: Cần cấu hình SMTP đúng để email được gửi thành công

## Next Steps

1. Cấu hình SMTP server thực tế
2. Thêm rate limiting cho request-password endpoint
3. Thêm email template đẹp hơn (HTML)
4. Implement password reset flow (nếu cần)
5. Thêm logging cho email sending

