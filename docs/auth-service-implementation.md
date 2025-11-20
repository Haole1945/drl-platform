# Auth Service Implementation Summary

**Date:** November 17, 2024  
**Status:** ✅ Complete - Ready for Testing

---

## 📋 Overview

Auth Service là microservice độc lập chịu trách nhiệm cho **Authentication & Authorization** trong DRL Platform.

**Port:** 8082  
**Base URL:** `http://localhost:8082` (direct) hoặc `http://localhost:8080/api/auth` (via Gateway)

---

## 🏗️ Architecture

### Entities
- `User` - Người dùng hệ thống
- `Role` - Vai trò (STUDENT, INSTRUCTOR, ADMIN)
- `Permission` - Quyền hạn chi tiết
- `BaseEntity` - Base class với id, createdAt, updatedAt

### Repositories
- `UserRepository` - CRUD và tìm kiếm user
- `RoleRepository` - Quản lý roles
- `PermissionRepository` - Quản lý permissions

### Services
- `AuthService` - Business logic cho authentication
  - `register()` - Đăng ký user mới
  - `login()` - Đăng nhập và tạo JWT tokens
  - `refreshToken()` - Làm mới access token
  - `getCurrentUser()` - Lấy thông tin user hiện tại

### Controllers
- `AuthController` - REST API endpoints
  - `POST /auth/register` - Đăng ký
  - `POST /auth/login` - Đăng nhập
  - `POST /auth/refresh` - Refresh token
  - `GET /auth/me` - Thông tin user hiện tại
  - `POST /auth/logout` - Đăng xuất (client-side)

### Utilities
- `JwtTokenProvider` - Tạo và validate JWT tokens
- `UserMapper` - Convert User entity ↔ UserDTO

### Configuration
- `SecurityConfig` - Spring Security config (permit all cho /auth endpoints)
- `DataSeeder` - Seed initial data (roles, permissions, sample users)
- `JacksonConfig` - JSON serialization config

---

## 🔐 Security

### JWT Configuration
- **Access Token Expiration:** 3600 seconds (1 hour)
- **Refresh Token Expiration:** 86400 seconds (24 hours)
- **Secret Key:** Configurable via `JWT_SECRET` environment variable

### Password Encoding
- **Algorithm:** BCrypt (strength: 10)
- Passwords are hashed before storing in database

### Permissions
Auth service seeds 18 permissions:
- `STUDENT:READ_OWN`, `STUDENT:READ_ALL`, `STUDENT:UPDATE_OWN`, `STUDENT:CREATE`, `STUDENT:DELETE`
- `EVALUATION:CREATE`, `EVALUATION:READ_OWN`, `EVALUATION:READ_ALL`, `EVALUATION:UPDATE_OWN`, `EVALUATION:SUBMIT`, `EVALUATION:APPROVE`, `EVALUATION:REJECT`
- `RUBRIC:READ`, `RUBRIC:MANAGE`
- `CRITERIA:READ`, `CRITERIA:MANAGE`
- `USER:MANAGE`
- `SYSTEM:MANAGE`

### Roles
- **STUDENT** - Sinh viên (7 permissions)
- **INSTRUCTOR** - Giảng viên/Cố vấn (6 permissions)
- **ADMIN** - Quản trị viên (10 permissions)

---

## 📡 API Endpoints

### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "TestPass123!",
  "fullName": "Test User",
  "studentCode": "N21DCCN001"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "studentCode": "N21DCCN001",
    "roles": ["STUDENT"],
    "permissions": ["STUDENT:READ_OWN", "EVALUATION:CREATE", ...],
    "isActive": true
  }
}
```

### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "TestPass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "refreshExpiresIn": 86400,
    "user": { ... }
  }
}
```

### 3. Get Current User
```http
GET /api/auth/me
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "User information retrieved",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "roles": ["STUDENT"],
    "permissions": [...]
  }
}
```

### 4. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** Same as login response

### 5. Logout
```http
POST /api/auth/logout
```

**Note:** In stateless JWT system, logout is handled client-side by removing tokens.

---

## 🗄️ Database

Auth service uses the **shared PostgreSQL database** (`drl` database).

**Tables:**
- `users` - User accounts
- `roles` - User roles
- `permissions` - System permissions
- `user_roles` - User-Role join table
- `role_permissions` - Role-Permission join table

**Note:** Auth service only manages these tables. Other tables (students, evaluations, etc.) are managed by other services.

---

## 🐳 Docker

Auth service is included in `docker-compose.yml`:

```yaml
auth-service:
  build:
    context: ../backend/auth-service
    dockerfile: Dockerfile
  container_name: drl-auth-service
  ports:
    - "8082:8082"
  environment:
    SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/drl
    JWT_SECRET: ${JWT_SECRET:-default-secret}
```

---

## 🚀 Testing

### Quick Test
```powershell
# Build and start services
.\build-and-test-auth.ps1

# Or run test script directly (if services are already running)
.\test-auth-service.ps1
```

### Manual Testing

1. **Register a new user:**
```powershell
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "TestPass123!"
    fullName = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
    -Method POST -ContentType "application/json" -Body $body
```

2. **Login:**
```powershell
$body = @{
    username = "testuser"
    password = "TestPass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
    -Method POST -ContentType "application/json" -Body $body

$token = $response.data.accessToken
```

3. **Get current user:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/me" `
    -Method GET -Headers $headers
```

---

## 📝 Sample Users (Seeded)

After first startup, DataSeeder creates:

1. **admin**
   - Username: `admin`
   - Password: `Admin123!`
   - Role: ADMIN
   - Email: `admin@ptit.edu.vn`

2. **instructor**
   - Username: `instructor`
   - Password: `Instructor123!`
   - Role: INSTRUCTOR
   - Email: `instructor@ptit.edu.vn`

3. **student**
   - Username: `student`
   - Password: `Student123!`
   - Role: STUDENT
   - Email: `student@ptit.edu.vn`
   - Student Code: `N21DCCN001`

---

## 🔄 Integration with Other Services

### Gateway Integration
Gateway routes `/api/auth/**` to `auth-service:8082`:

```yaml
- id: auth-service
  uri: http://auth-service:8082
  predicates:
    - Path=/api/auth/**
  filters:
    - RewritePath=/api/(?<segment>.*), /${segment}
```

### Future: Inter-Service Communication
- Auth service may need to call student-service to validate `studentCode` during registration
- Other services will call auth-service to validate JWT tokens

---

## ✅ Implementation Checklist

- [x] Create Spring Boot project structure
- [x] Copy entities (User, Role, Permission)
- [x] Create repositories
- [x] Create DTOs (RegisterRequest, LoginRequest, AuthResponse, UserDTO)
- [x] Create JWT utility (JwtTokenProvider)
- [x] Create AuthService
- [x] Create AuthController
- [x] Create SecurityConfig
- [x] Create DataSeeder
- [x] Create JacksonConfig
- [x] Update Gateway routes
- [x] Update docker-compose.yml
- [x] Create test script
- [ ] Test all endpoints
- [ ] Fix any issues found

---

## 🐛 Known Issues / Future Improvements

1. **Token Blacklist:** Currently, logout doesn't invalidate tokens server-side. Future: Use Redis for token blacklist.

2. **Password Complexity:** Current validation requires uppercase, lowercase, and number. Future: Make configurable.

3. **Rate Limiting:** No rate limiting on login/register endpoints. Future: Add rate limiting to prevent brute force.

4. **Email Verification:** No email verification for registration. Future: Add email verification flow.

5. **OAuth2:** Currently only username/password. Future: Add OAuth2 (Google, Facebook).

6. **Inter-Service Validation:** During registration, `studentCode` is not validated against student-service. Future: Add validation.

---

## 📚 Files Created

```
backend/auth-service/
├── pom.xml
├── Dockerfile
├── src/
│   ├── main/
│   │   ├── java/ptit/drl/auth/
│   │   │   ├── AuthServiceApplication.java
│   │   │   ├── api/
│   │   │   │   └── AuthController.java
│   │   │   ├── config/
│   │   │   │   ├── DataSeeder.java
│   │   │   │   ├── JacksonConfig.java
│   │   │   │   └── SecurityConfig.java
│   │   │   ├── dto/
│   │   │   │   ├── ApiResponse.java
│   │   │   │   ├── AuthResponse.java
│   │   │   │   ├── LoginRequest.java
│   │   │   │   ├── RefreshTokenRequest.java
│   │   │   │   ├── RegisterRequest.java
│   │   │   │   └── UserDTO.java
│   │   │   ├── entity/
│   │   │   │   ├── BaseEntity.java
│   │   │   │   ├── Permission.java
│   │   │   │   ├── Role.java
│   │   │   │   └── User.java
│   │   │   ├── exception/
│   │   │   │   ├── DuplicateResourceException.java
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   └── ResourceNotFoundException.java
│   │   │   ├── mapper/
│   │   │   │   └── UserMapper.java
│   │   │   ├── repository/
│   │   │   │   ├── PermissionRepository.java
│   │   │   │   ├── RoleRepository.java
│   │   │   │   └── UserRepository.java
│   │   │   ├── service/
│   │   │   │   └── AuthService.java
│   │   │   └── util/
│   │   │       └── JwtTokenProvider.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       └── java/ptit/drl/auth/
│           └── AuthServiceApplicationTests.java
```

---

**Last Updated:** November 17, 2024  
**Status:** ✅ Ready for Testing

