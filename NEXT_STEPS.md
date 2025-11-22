# Next Steps - Class Code Implementation

## What Was Done

### 1. Backend Changes (Auth Service)

✅ Added `classCode` field to User entity
✅ Added `classCode` to UserDTO
✅ Updated UserMapper to include classCode
✅ Updated AuthService to fetch classCode from student-service
✅ Created database migration V5 to add class_code column

### 2. Backend Changes (Evaluation Service)

✅ Already implemented in previous session
✅ RubricController accepts classCode parameter
✅ RubricService filters rubrics by targetClasses

### 3. Frontend Changes

✅ Already implemented in previous session
✅ RubricEditor has class targeting UI
✅ User type already includes classCode field

## What Needs to Be Done

### Step 1: Restart Auth Service (REQUIRED)

The auth-service needs to be restarted to apply the V5 database migration.

**Option A: Restart just auth-service**

```powershell
# Find and stop auth-service (port 8081)
$process = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($process) { Stop-Process -Id $process -Force }

# Start auth-service
cd backend/auth-service
mvn spring-boot:run
```

**Option B: Restart all services**

```powershell
# Stop all Java processes
Get-Process -Name "java" | Stop-Process -Force

# Start services in order
cd backend/eureka-server
Start-Process mvn -ArgumentList "spring-boot:run" -NoNewWindow

# Wait 30 seconds for Eureka
Start-Sleep -Seconds 30

# Start other services
cd ../auth-service
Start-Process mvn -ArgumentList "spring-boot:run" -NoNewWindow

cd ../student-service
Start-Process mvn -ArgumentList "spring-boot:run" -NoNewWindow

cd ../evaluation-service
Start-Process mvn -ArgumentList "spring-boot:run" -NoNewWindow

cd ../gateway
Start-Process mvn -ArgumentList "spring-boot:run" -NoNewWindow
```

### Step 2: Test Class Code Implementation

```powershell
.\test-class-code.ps1
```

This will:

1. Request password for a test student
2. Login with the password
3. Verify classCode is in the user object
4. Verify classCode persists in /me endpoint

**Expected Result:**

```json
{
  "id": 1,
  "username": "n21dccn001",
  "email": "n21dccn001@student.ptithcm.edu.vn",
  "fullName": "Nguyen Van A",
  "studentCode": "N21DCCN001",
  "classCode": "D21DCCN01-N", // ← Should be present
  "roles": ["STUDENT"]
}
```

### Step 3: Test Rubric Filtering

```powershell
.\test-rubric-update.ps1
```

This will test the complete flow:

1. Create/activate a rubric with specific target classes
2. Verify students in target classes can see it
3. Verify students in other classes cannot see it

### Step 4: Test in Frontend

1. Login to the frontend as a student
2. Navigate to training-points page
3. Verify the correct rubric is loaded based on student's class
4. Try with students from different classes

### Step 5: Update Existing Users (Optional)

If you have existing users without classCode, you can update them:

**Option A: Request password again**
Each user can request a new password, which will automatically update their classCode.

**Option B: Bulk update script**
Create a script to update all users at once:

```java
// In AuthService or a migration script
List<User> users = userRepository.findAll();
for (User user : users) {
    if (user.getStudentCode() != null && user.getClassCode() == null) {
        try {
            StudentResponse response = studentServiceClient.getStudentByCode(user.getStudentCode());
            if (response.isSuccess() && response.getData() != null) {
                user.setClassCode(response.getData().getClassCode());
                userRepository.save(user);
            }
        } catch (Exception e) {
            // Log error but continue
        }
    }
}
```

## Troubleshooting

### Issue: classCode is null after login

**Cause:** User was created before V5 migration
**Solution:** Request password again for that user

### Issue: Migration V5 fails

**Cause:** Database connection issue or column already exists
**Solution:**

1. Check database logs
2. Verify column doesn't already exist: `SHOW COLUMNS FROM users LIKE 'class_code';`
3. If column exists, skip migration or drop and recreate

### Issue: Student service returns null classCode

**Cause:** Student data doesn't have classCode
**Solution:**

1. Check student-service data
2. Verify student CSV/seed data includes classCode
3. Update student records if needed

## Documentation

- `docs/CLASS_CODE_IMPLEMENTATION.md` - Detailed implementation notes
- `docs/RUBRIC_CLASS_FILTERING.md` - Complete feature documentation
- `docs/RUBRIC_ACTIVATION_AND_TARGETING.md` - Rubric activation feature

## Files Modified

### Auth Service

- `backend/auth-service/src/main/java/ptit/drl/auth/entity/User.java`
- `backend/auth-service/src/main/java/ptit/drl/auth/dto/UserDTO.java`
- `backend/auth-service/src/main/java/ptit/drl/auth/mapper/UserMapper.java`
- `backend/auth-service/src/main/java/ptit/drl/auth/service/AuthService.java`
- `backend/auth-service/src/main/resources/db/migration/V5__add_class_code_to_users.sql`

### Test Scripts

- `test-class-code.ps1` - Test classCode implementation
- `test-rubric-update.ps1` - Test rubric filtering (existing)
- `restart-auth-service.ps1` - Helper to restart auth-service

## Summary

The implementation is complete. The only remaining step is to **restart the auth-service** to apply the database migration, then test the functionality.

Once auth-service is restarted:

1. Run `test-class-code.ps1` to verify classCode works
2. Run `test-rubric-update.ps1` to verify filtering works
3. Test in the frontend UI

The feature should then be fully functional! 🎉
