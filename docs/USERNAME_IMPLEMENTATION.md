# Username Implementation - StudentCode Based

## Tổng quan

Hệ thống đã được cập nhật để:
1. **Chỉ tạo tài khoản khi yêu cầu mật khẩu lần đầu** - Không có tài khoản sẵn trong hệ thống
2. **Username = studentCode (lowercase)** - Ví dụ: `n21dccn001`
3. **Login không phân biệt hoa thường** - Có thể đăng nhập bằng `N21DCCN001`, `n21dccn001`, hoặc `N21DCCN001`

## Flow hoạt động

### 1. Yêu cầu mật khẩu lần đầu

**Input:** Email trường (ví dụ: `n21dccn001@student.ptithcm.edu.vn`)

**Process:**
1. Extract studentCode từ email: `n21dccn001`
2. Normalize studentCode:
   - Uppercase cho lookup: `N21DCCN001`
   - Lowercase cho username: `n21dccn001`
3. Validate student tồn tại trong database
4. Lấy thông tin student (fullName, etc.)
5. **Tạo user mới** với:
   - `username` = `n21dccn001` (lowercase)
   - `email` = `n21dccn001@student.ptithcm.edu.vn`
   - `fullName` = Từ student-service
   - `studentCode` = `N21DCCN001` (uppercase)
6. Generate mật khẩu ngẫu nhiên
7. Gửi mật khẩu qua email

### 2. Yêu cầu mật khẩu lần sau

**Input:** Email trường (đã có tài khoản)

**Process:**
1. Tìm user theo email hoặc username
2. Nếu tìm thấy:
   - Generate mật khẩu mới
   - Update fullName từ student-service (nếu có thay đổi)
   - Gửi mật khẩu mới qua email
3. **KHÔNG tạo user mới**

### 3. Đăng nhập

**Input:** Email hoặc Username + Password

**Process:**
1. Nếu input chứa `@` → Tìm theo email
2. Nếu không → Tìm theo username (case-insensitive)
3. Verify password
4. Trả về JWT tokens

**Ví dụ login:**
- `n21dccn001@student.ptithcm.edu.vn` + password ✅
- `n21dccn001` + password ✅
- `N21DCCN001` + password ✅ (case-insensitive)
- `N21dCcN001` + password ✅ (case-insensitive)

## Code Changes

### Backend

#### 1. UserRepository
```java
Optional<User> findByUsernameIgnoreCase(String username);
boolean existsByUsernameIgnoreCase(String username);
```

#### 2. AuthService.requestPassword()
- Extract studentCode từ email
- Normalize: uppercase cho lookup, lowercase cho username
- Lấy fullName từ student-service
- Chỉ tạo user nếu chưa tồn tại
- Username = studentCode (lowercase)

#### 3. AuthService.login()
- Hỗ trợ login bằng email hoặc username
- Username lookup case-insensitive
- Convert input to lowercase trước khi lookup

### Frontend

#### 1. Request Password Page
- Hiển thị thông báo: "Tài khoản sẽ được tạo tự động lần đầu tiên"
- Hiển thị: "Tên đăng nhập sẽ là mã sinh viên (ví dụ: n21dccn001)"

#### 2. Login Page
- Label: "Email hoặc Mã sinh viên"
- Placeholder: "Email hoặc mã sinh viên (ví dụ: n21dccn001)"
- Hint: "Bạn có thể đăng nhập bằng email trường hoặc mã sinh viên (không phân biệt hoa thường)"

## Database Schema

### Users Table
- `username`: VARCHAR(50) - lowercase studentCode (ví dụ: `n21dccn001`)
- `email`: VARCHAR(100) - email trường (ví dụ: `n21dccn001@student.ptithcm.edu.vn`)
- `student_code`: VARCHAR(20) - uppercase studentCode (ví dụ: `N21DCCN001`)
- `full_name`: VARCHAR(100) - từ student-service

## Ví dụ

### Scenario 1: Học sinh mới

1. Học sinh nhập: `n21dccn001@student.ptithcm.edu.vn`
2. Hệ thống:
   - Extract: `n21dccn001`
   - Lookup student: `N21DCCN001` → Tìm thấy "Nguyễn Văn An"
   - Tạo user:
     - username: `n21dccn001`
     - email: `n21dccn001@student.ptithcm.edu.vn`
     - fullName: `Nguyễn Văn An`
     - studentCode: `N21DCCN001`
   - Generate password: `Abc123Xy`
   - Gửi email với password

3. Học sinh đăng nhập:
   - `n21dccn001` + `Abc123Xy` ✅
   - `N21DCCN001` + `Abc123Xy` ✅
   - `n21dccn001@student.ptithcm.edu.vn` + `Abc123Xy` ✅

### Scenario 2: Học sinh đã có tài khoản

1. Học sinh nhập: `n21dccn001@student.ptithcm.edu.vn`
2. Hệ thống:
   - Tìm thấy user đã tồn tại
   - Generate password mới
   - Update fullName (nếu có thay đổi)
   - Gửi email với password mới

## Lưu ý

1. **Username luôn là lowercase** - Đảm bảo consistency
2. **StudentCode trong DB là uppercase** - Để match với student-service
3. **Login case-insensitive** - User có thể nhập bất kỳ case nào
4. **Một studentCode = một tài khoản** - Không thể tạo duplicate
5. **FullName tự động sync** - Lấy từ student-service khi tạo/update

## Testing

### Test Request Password (lần đầu)
```bash
curl -X POST http://localhost:8080/api/auth/request-password \
  -H "Content-Type: application/json" \
  -d '{"email": "n21dccn001@student.ptithcm.edu.vn"}'
```

Expected:
- User được tạo với username = `n21dccn001`
- Email được gửi với password

### Test Login (case-insensitive)
```bash
# Login bằng lowercase
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "n21dccn001", "password": "..."}'

# Login bằng uppercase
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "N21DCCN001", "password": "..."}'

# Login bằng email
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "n21dccn001@student.ptithcm.edu.vn", "password": "..."}'
```

Tất cả đều phải hoạt động! ✅

