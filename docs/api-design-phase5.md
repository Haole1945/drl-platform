# Phase 5: Authentication & Authorization API Design

**Version:** 1.0  
**Date:** November 17, 2024  
**Status:** Design Phase

---

## 📋 Overview

Phase 5 implements JWT-based authentication and role-based authorization (RBAC) for the DRL Platform. This phase secures all existing endpoints and provides user authentication services.

### Key Features
- JWT token-based authentication
- User registration and login
- Token refresh mechanism
- Role-based access control (RBAC)
- Permission-based authorization
- Secure password hashing (BCrypt)

---

## 🔐 Authentication Endpoints

### 1. Register User

**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "student001",
  "email": "student001@example.com",
  "password": "SecurePassword123!",
  "fullName": "Nguyễn Văn A",
  "studentCode": "N21DCCN001"  // Optional: link to existing student
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "username": "student001",
    "email": "student001@example.com",
    "fullName": "Nguyễn Văn A",
    "roles": ["STUDENT"],
    "isActive": true,
    "createdAt": "2024-11-17T10:00:00"
  },
  "timestamp": "2024-11-17T10:00:00"
}
```

**Validation Rules:**
- `username`: Required, 3-50 chars, alphanumeric + underscore
- `email`: Required, valid email format, unique
- `password`: Required, min 8 chars, must contain uppercase, lowercase, number
- `fullName`: Required, 1-100 chars
- `studentCode`: Optional, must exist in students table if provided

**Error Responses:**
- `400 Bad Request`: Validation errors
- `409 Conflict`: Username or email already exists
- `404 Not Found`: Student code not found (if provided)

---

### 2. Login

**POST** `/api/auth/login`

Authenticate user and return JWT tokens.

**Request Body:**
```json
{
  "username": "student001",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
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
    "user": {
      "id": 1,
      "username": "student001",
      "email": "student001@example.com",
      "fullName": "Nguyễn Văn A",
      "roles": ["STUDENT"],
      "permissions": [
        "EVALUATION:CREATE",
        "EVALUATION:READ_OWN",
        "EVALUATION:UPDATE_OWN"
      ],
      "studentCode": "N21DCCN001"
    }
  },
  "timestamp": "2024-11-17T10:00:00"
}
```

**Error Responses:**
- `400 Bad Request`: Missing username or password
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account is inactive

---

### 3. Refresh Token

**POST** `/api/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600
  },
  "timestamp": "2024-11-17T10:00:00"
}
```

**Error Responses:**
- `400 Bad Request`: Missing refresh token
- `401 Unauthorized`: Invalid or expired refresh token

---

### 4. Get Current User

**GET** `/api/auth/me`

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User information retrieved",
  "data": {
    "id": 1,
    "username": "student001",
    "email": "student001@example.com",
    "fullName": "Nguyễn Văn A",
    "roles": ["STUDENT"],
    "permissions": [
      "EVALUATION:CREATE",
      "EVALUATION:READ_OWN",
      "EVALUATION:UPDATE_OWN"
    ],
    "studentCode": "N21DCCN001",
    "isActive": true,
    "createdAt": "2024-11-17T10:00:00"
  },
  "timestamp": "2024-11-17T10:00:00"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token

---

### 5. Logout

**POST** `/api/auth/logout`

Logout user (invalidate refresh token).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null,
  "timestamp": "2024-11-17T10:00:00"
}
```

---

## 🔒 Authorization Model

### Roles

1. **STUDENT**
   - Can create/read/update own evaluations
   - Can view own training points
   - Can view own student profile

2. **INSTRUCTOR**
   - All STUDENT permissions
   - Can approve/reject evaluations (CLASS level)
   - Can view all students in assigned classes
   - Can view all evaluations for assigned classes

3. **ADMIN**
   - All permissions
   - Can manage users, roles, permissions
   - Can manage rubrics and criteria
   - Can view all data

### Permissions

**Evaluation Permissions:**
- `EVALUATION:CREATE` - Create new evaluation
- `EVALUATION:READ_OWN` - Read own evaluations
- `EVALUATION:READ_ALL` - Read all evaluations
- `EVALUATION:UPDATE_OWN` - Update own evaluations
- `EVALUATION:UPDATE_ALL` - Update any evaluation
- `EVALUATION:DELETE` - Delete evaluations
- `EVALUATION:SUBMIT` - Submit evaluation
- `EVALUATION:APPROVE` - Approve evaluation
- `EVALUATION:REJECT` - Reject evaluation

**Student Permissions:**
- `STUDENT:READ_OWN` - Read own profile
- `STUDENT:READ_ALL` - Read all students
- `STUDENT:UPDATE_OWN` - Update own profile
- `STUDENT:UPDATE_ALL` - Update any student
- `STUDENT:CREATE` - Create student
- `STUDENT:DELETE` - Delete student

**Rubric Permissions:**
- `RUBRIC:READ` - View rubrics
- `RUBRIC:CREATE` - Create rubric
- `RUBRIC:UPDATE` - Update rubric
- `RUBRIC:DELETE` - Delete rubric
- `RUBRIC:ACTIVATE` - Activate/deactivate rubric

**User Management Permissions:**
- `USER:READ` - View users
- `USER:CREATE` - Create user
- `USER:UPDATE` - Update user
- `USER:DELETE` - Delete user
- `USER:MANAGE_ROLES` - Assign roles to users

---

## 🛡️ Security Configuration

### JWT Token Configuration

- **Algorithm:** HS256
- **Access Token Expiry:** 1 hour (3600 seconds)
- **Refresh Token Expiry:** 24 hours (86400 seconds)
- **Secret Key:** Environment variable `JWT_SECRET` (min 256 bits)

### Password Requirements

- Minimum length: 8 characters
- Must contain: uppercase, lowercase, number
- Recommended: special character
- Stored as: BCrypt hash (strength 10)

### CORS Configuration

- **Allowed Origins:** Configured per environment
- **Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers:** Authorization, Content-Type
- **Max Age:** 3600 seconds

---

## 📝 Protected Endpoints

### Public Endpoints (No Authentication)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /actuator/health`

### Protected Endpoints (Require Authentication)

**Student Endpoints:**
- `GET /api/students` - Requires `STUDENT:READ_ALL` or `STUDENT:READ_OWN`
- `GET /api/students/{code}` - Requires `STUDENT:READ_ALL` or own student
- `POST /api/students` - Requires `STUDENT:CREATE`
- `PUT /api/students/{code}` - Requires `STUDENT:UPDATE_ALL` or own student
- `DELETE /api/students/{code}` - Requires `STUDENT:DELETE`

**Evaluation Endpoints:**
- `GET /api/evaluations` - Requires `EVALUATION:READ_ALL` or `EVALUATION:READ_OWN`
- `POST /api/evaluations` - Requires `EVALUATION:CREATE`
- `POST /api/evaluations/{id}/submit` - Requires `EVALUATION:SUBMIT` + own evaluation
- `POST /api/evaluations/{id}/approve` - Requires `EVALUATION:APPROVE`
- `POST /api/evaluations/{id}/reject` - Requires `EVALUATION:REJECT`

**Rubric Endpoints:**
- `GET /api/rubrics` - Requires `RUBRIC:READ`
- `POST /api/rubrics` - Requires `RUBRIC:CREATE`
- `PUT /api/rubrics/{id}` - Requires `RUBRIC:UPDATE`
- `POST /api/rubrics/{id}/activate` - Requires `RUBRIC:ACTIVATE`

---

## 🔄 Request/Response Examples

### Example: Register Student

**Request:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "student001",
  "email": "student001@example.com",
  "password": "SecurePass123!",
  "fullName": "Nguyễn Văn A",
  "studentCode": "N21DCCN001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "username": "student001",
    "email": "student001@example.com",
    "fullName": "Nguyễn Văn A",
    "roles": ["STUDENT"],
    "isActive": true
  }
}
```

### Example: Login

**Request:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "student001",
  "password": "SecurePass123!"
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
    "user": {
      "id": 1,
      "username": "student001",
      "roles": ["STUDENT"],
      "permissions": ["EVALUATION:CREATE", "EVALUATION:READ_OWN"]
    }
  }
}
```

### Example: Authenticated Request

**Request:**
```bash
GET /api/evaluations/student/N21DCCN001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "message": "Student evaluations retrieved",
  "data": [
    {
      "id": 1,
      "semester": "2024-2025-HK1",
      "status": "SUBMITTED",
      "totalScore": 27.0
    }
  ]
}
```

---

## 🧪 Testing Scenarios

### Test Case 1: Register New User
1. POST `/api/auth/register` with valid data
2. Verify user created in database
3. Verify password is hashed
4. Verify default role assigned (STUDENT)

### Test Case 2: Login Success
1. POST `/api/auth/login` with valid credentials
2. Verify access token returned
3. Verify refresh token returned
4. Verify token contains user info and permissions

### Test Case 3: Login Failure
1. POST `/api/auth/login` with invalid password
2. Verify 401 Unauthorized response
3. Verify no token returned

### Test Case 4: Access Protected Endpoint
1. GET `/api/evaluations` without token
2. Verify 401 Unauthorized
3. GET `/api/evaluations` with valid token
4. Verify 200 OK with data

### Test Case 5: Permission Check
1. Login as STUDENT
2. Try to access admin endpoint
3. Verify 403 Forbidden
4. Login as ADMIN
5. Verify access granted

### Test Case 6: Token Refresh
1. Login to get tokens
2. Wait for access token to expire (or use expired token)
3. POST `/api/auth/refresh` with refresh token
4. Verify new access token returned

---

## 📦 DTOs

### RegisterRequest
```java
public class RegisterRequest {
    @NotBlank
    @Size(min = 3, max = 50)
    private String username;
    
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    @Size(min = 8)
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$")
    private String password;
    
    @NotBlank
    @Size(max = 100)
    private String fullName;
    
    @Size(max = 20)
    private String studentCode; // Optional
}
```

### LoginRequest
```java
public class LoginRequest {
    @NotBlank
    private String username;
    
    @NotBlank
    private String password;
}
```

### AuthResponse
```java
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long expiresIn;
    private Long refreshExpiresIn;
    private UserDTO user;
}
```

### RefreshTokenRequest
```java
public class RefreshTokenRequest {
    @NotBlank
    private String refreshToken;
}
```

---

## 🔧 Implementation Notes

### JWT Token Structure

**Access Token Payload:**
```json
{
  "sub": "1",  // User ID
  "username": "student001",
  "roles": ["STUDENT"],
  "permissions": ["EVALUATION:CREATE", "EVALUATION:READ_OWN"],
  "iat": 1700208000,
  "exp": 1700211600
}
```

**Refresh Token Payload:**
```json
{
  "sub": "1",
  "type": "refresh",
  "iat": 1700208000,
  "exp": 1700294400
}
```

### Security Best Practices

1. **Password Storage:**
   - Never store plain text passwords
   - Use BCrypt with strength 10
   - Salt automatically generated

2. **Token Security:**
   - Store tokens in HTTP-only cookies (recommended) or localStorage
   - Never expose tokens in URLs
   - Use HTTPS in production

3. **Token Validation:**
   - Validate token signature
   - Check expiration
   - Verify user is still active
   - Check token blacklist (for logout)

4. **Rate Limiting:**
   - Limit login attempts (5 per minute per IP)
   - Limit registration (3 per hour per IP)

---

## 📚 References

- [Spring Security JWT Guide](https://spring.io/guides/topicals/spring-security-architecture)
- [JWT.io](https://jwt.io/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Document Version:** 1.0  
**Last Updated:** November 17, 2024  
**Next Review:** After Phase 5 implementation

