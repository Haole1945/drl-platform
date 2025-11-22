# Class Code Implementation

## Overview

Added `classCode` field to User entity and UserDTO to support class-based rubric filtering.

## Changes Made

### Backend Changes

#### 1. User Entity (`backend/auth-service/src/main/java/ptit/drl/auth/entity/User.java`)

- Added `classCode` field (VARCHAR(20))
- Added getter and setter methods

#### 2. UserDTO (`backend/auth-service/src/main/java/ptit/drl/auth/dto/UserDTO.java`)

- Added `classCode` field
- Added getter and setter methods

#### 3. UserMapper (`backend/auth-service/src/main/java/ptit/drl/auth/mapper/UserMapper.java`)

- Updated `toDTO()` method to map `classCode` from User entity to UserDTO

#### 4. AuthService (`backend/auth-service/src/main/java/ptit/drl/auth/service/AuthService.java`)

- Updated `register()` method to fetch and store classCode from student-service
- Updated `requestPassword()` method to fetch and store classCode for new and existing users

#### 5. Database Migration (`backend/auth-service/src/main/resources/db/migration/V5__add_class_code_to_users.sql`)

- Added `class_code` column to `users` table
- Added index on `class_code` for faster lookups

### Frontend Changes

No changes needed - the User type already includes `classCode` field.

## How It Works

1. When a user registers or requests a password, the auth-service:

   - Fetches student data from student-service using the studentCode
   - Extracts the `classCode` from the student data
   - Stores it in the User entity

2. When a user logs in:

   - The UserDTO returned includes the `classCode`
   - Frontend can access `user.classCode` for filtering

3. Class-based rubric filtering:
   - Frontend sends user's classCode to evaluation-service
   - Evaluation-service filters rubrics based on targetClasses
   - Only rubrics targeting the user's class are returned

## Testing

### 1. Restart auth-service

```powershell
# Stop auth-service (find process on port 8081)
$process = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($process) { Stop-Process -Id $process -Force }

# Start auth-service
cd backend/auth-service
mvn spring-boot:run
```

### 2. Test with existing user

```powershell
# Request password for existing student
curl -X POST http://localhost:8081/auth/request-password `
  -H "Content-Type: application/json" `
  -d '{"email":"n21dccn001@student.ptithcm.edu.vn"}'

# Login
curl -X POST http://localhost:8081/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"n21dccn001","password":"<password-from-email>"}'

# Check response - should include classCode in user object
```

### 3. Test rubric filtering

```powershell
# Get rubrics for user's class
curl -X GET "http://localhost:8083/rubrics?classCode=D21DCCN01-N" `
  -H "Authorization: Bearer <access-token>"
```

## Migration Notes

- Existing users will have `classCode = NULL` until they:
  - Request a new password (updates classCode automatically)
  - Login (classCode will be fetched on next password request)
- To bulk update existing users, run a script that:
  1. Fetches all users with studentCode
  2. For each user, fetches student data from student-service
  3. Updates user's classCode

## Related Files

- `backend/auth-service/src/main/java/ptit/drl/auth/entity/User.java`
- `backend/auth-service/src/main/java/ptit/drl/auth/dto/UserDTO.java`
- `backend/auth-service/src/main/java/ptit/drl/auth/mapper/UserMapper.java`
- `backend/auth-service/src/main/java/ptit/drl/auth/service/AuthService.java`
- `backend/auth-service/src/main/resources/db/migration/V5__add_class_code_to_users.sql`
- `frontend/src/types/auth.ts`
- `docs/RUBRIC_CLASS_FILTERING.md`
