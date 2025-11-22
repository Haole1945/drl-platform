# Deployment Checklist - Class Code Implementation

## Pre-Deployment

### ✅ Code Review

- [x] User entity has classCode field
- [x] UserDTO has classCode field
- [x] UserMapper maps classCode
- [x] AuthService fetches classCode from student-service
- [x] Database migration V5 created
- [x] No syntax errors in Java files
- [x] All diagnostics passed

### ✅ Documentation

- [x] Implementation guide created
- [x] Flow diagram created
- [x] Quick reference created
- [x] Test scripts created
- [x] Troubleshooting guide included

## Deployment Steps

### Step 1: Backup (Recommended)

```powershell
# Backup auth-service database
# Run your database backup script here
```

- [ ] Database backed up
- [ ] Backup verified

### Step 2: Stop Auth Service

```powershell
# Find process on port 8081
$process = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue |
           Select-Object -ExpandProperty OwningProcess -First 1
if ($process) { Stop-Process -Id $process -Force }
```

- [ ] Auth service stopped
- [ ] Port 8081 released

### Step 3: Start Auth Service

```powershell
cd backend/auth-service
mvn spring-boot:run
```

- [ ] Auth service started
- [ ] Wait 30-60 seconds for startup
- [ ] Check logs for errors

### Step 4: Verify Migration

```powershell
# Check database for new column
# Connect to your database and run:
# SHOW COLUMNS FROM users LIKE 'class_code';
```

- [ ] Column `class_code` exists
- [ ] Column type is VARCHAR(20)
- [ ] Index created on class_code

### Step 5: Test Basic Functionality

```powershell
# Test health endpoint
curl http://localhost:8081/actuator/health
```

- [ ] Service responds
- [ ] Status is UP
- [ ] No errors in logs

## Testing

### Test 1: Class Code Implementation

```powershell
.\test-class-code.ps1
```

**Expected Results:**

- [ ] Password request succeeds
- [ ] Login succeeds
- [ ] User object includes classCode
- [ ] classCode value is correct (e.g., "D21DCCN01-N")
- [ ] /me endpoint returns classCode

**If Test Fails:**

- Check student-service is running
- Verify student data includes classCode
- Check auth-service logs for errors

### Test 2: Rubric Filtering

```powershell
.\test-rubric-update.ps1
```

**Expected Results:**

- [ ] Can create rubric with target classes
- [ ] Can activate rubric
- [ ] Students in target class see rubric
- [ ] Students in other classes get 404

**If Test Fails:**

- Check evaluation-service is running
- Verify rubric has correct targetClasses
- Check user's classCode matches target

### Test 3: Frontend Integration

**Login Test:**

1. [ ] Open frontend (http://localhost:3000)
2. [ ] Login as student
3. [ ] Open browser DevTools → Network tab
4. [ ] Check login response includes classCode
5. [ ] Verify classCode is correct

**Rubric Test:**

1. [ ] Navigate to training-points page
2. [ ] Check Network tab for rubric request
3. [ ] Verify request includes classCode parameter
4. [ ] Verify correct rubric is returned
5. [ ] Try with different students from different classes

## Post-Deployment Verification

### Database Checks

```sql
-- Check users have classCode
SELECT username, student_code, class_code
FROM users
WHERE student_code IS NOT NULL
LIMIT 10;

-- Check for NULL classCode (expected for old users)
SELECT COUNT(*)
FROM users
WHERE student_code IS NOT NULL
AND class_code IS NULL;
```

- [ ] New users have classCode
- [ ] Old users have NULL classCode (expected)

### API Checks

```powershell
# Test login endpoint
curl -X POST http://localhost:8081/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"test","password":"test"}'

# Check response includes classCode
```

- [ ] Login works
- [ ] Response includes classCode
- [ ] classCode is correct

### Service Health

```powershell
# Check all services
curl http://localhost:8761  # Eureka
curl http://localhost:8080/actuator/health  # Gateway
curl http://localhost:8081/actuator/health  # Auth
curl http://localhost:8082/actuator/health  # Student
curl http://localhost:8083/actuator/health  # Evaluation
```

- [ ] All services UP
- [ ] No errors in logs
- [ ] Services registered in Eureka

## Rollback Plan

### If Issues Occur

**Option 1: Restart Service**

```powershell
.\restart-services.ps1 -Service auth
```

**Option 2: Rollback Migration**

```sql
-- Remove class_code column
ALTER TABLE users DROP COLUMN class_code;
DROP INDEX idx_users_class_code ON users;
```

**Option 3: Restore from Backup**

```powershell
# Restore database from backup
# Run your database restore script here
```

## Known Issues & Solutions

### Issue 1: classCode is NULL

**Symptom:** User object has classCode = null
**Cause:** User created before migration
**Solution:** User requests password again

### Issue 2: Migration fails

**Symptom:** Error during startup about column already exists
**Cause:** Migration already ran
**Solution:** Check if column exists, if yes, skip migration

### Issue 3: Student service unavailable

**Symptom:** Cannot fetch classCode during registration
**Cause:** Student service down or not responding
**Solution:** Start student service first

## Success Criteria

### All Tests Pass

- [x] test-class-code.ps1 passes
- [ ] test-rubric-update.ps1 passes
- [ ] Frontend login includes classCode
- [ ] Rubric filtering works correctly

### No Errors

- [ ] No errors in auth-service logs
- [ ] No errors in evaluation-service logs
- [ ] No errors in frontend console
- [ ] No database errors

### Feature Works

- [ ] Students see correct rubrics
- [ ] Admin can set target classes
- [ ] Filtering is automatic
- [ ] No manual intervention needed

## Monitoring

### First 24 Hours

- [ ] Monitor auth-service logs
- [ ] Check for NULL classCode issues
- [ ] Monitor user feedback
- [ ] Track error rates

### First Week

- [ ] Verify all new users have classCode
- [ ] Check rubric filtering accuracy
- [ ] Monitor performance impact
- [ ] Collect user feedback

## Documentation Updates

### Update These Docs

- [ ] README.md - Add feature description
- [ ] API documentation - Add classCode field
- [ ] User guide - Explain class filtering
- [ ] Admin guide - Explain target classes

## Sign-Off

### Development Team

- [ ] Code reviewed
- [ ] Tests passed
- [ ] Documentation complete

### QA Team

- [ ] Manual testing complete
- [ ] Edge cases tested
- [ ] Performance acceptable

### Product Owner

- [ ] Feature approved
- [ ] Meets requirements
- [ ] Ready for production

---

**Deployment Date:** ********\_********

**Deployed By:** ********\_********

**Sign-Off:** ********\_********

**Notes:**

---

---

---
