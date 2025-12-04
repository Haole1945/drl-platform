# Class-Based Rubric Filtering - Complete Implementation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Documentation](#documentation)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

## 🎯 Overview

This implementation adds class-based filtering for rubrics, allowing administrators to create rubrics that only apply to specific classes.

### What's New

- ✅ User objects now include `classCode` field
- ✅ Auth service fetches classCode from student-service
- ✅ Rubrics can target specific classes
- ✅ Students automatically see correct rubrics

### How It Works

```
Student Login → Auth Service → Fetch classCode from Student Service
                     ↓
              Store in User Entity
                     ↓
              Return in UserDTO
                     ↓
Frontend → Request Rubric with classCode → Evaluation Service
                                                  ↓
                                           Filter by targetClasses
                                                  ↓
                                           Return Matching Rubric
```

## 🚀 Quick Start

### 1. Deploy (First Time)

```powershell
# Restart auth-service to apply database migration
.\restart-services.ps1 -Service auth

# Wait 30 seconds for service to start
```

### 2. Test

```powershell
# Test classCode implementation
.\test-class-code.ps1

# Test rubric filtering
.\test-rubric-update.ps1
```

### 3. Use

- **Admin:** Login → System Config → Edit rubric → Set target classes
- **Student:** Login → Training Points → See class-specific rubric

## 📚 Documentation

### Quick References

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Common tasks and commands
- **[NEXT_STEPS.md](NEXT_STEPS.md)** - Detailed deployment guide
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Complete checklist

### Technical Documentation

- **[docs/CLASS_CODE_IMPLEMENTATION.md](docs/CLASS_CODE_IMPLEMENTATION.md)** - Implementation details
- **[docs/CLASS_CODE_FLOW.md](docs/CLASS_CODE_FLOW.md)** - Flow diagrams
- **[docs/RUBRIC_CLASS_FILTERING.md](docs/RUBRIC_CLASS_FILTERING.md)** - Feature documentation

### Summary

- **[SESSION_SUMMARY.md](SESSION_SUMMARY.md)** - What was implemented

## 🧪 Testing

### Test Scripts

#### 1. Class Code Test

```powershell
.\test-class-code.ps1
```

Tests that user objects include classCode after login.

**Expected Output:**

```
✓ Password request successful
✓ Login successful
✓ classCode found: D21DCCN01-N
✓ classCode persists: D21DCCN01-N
=== All Tests Passed ===
```

#### 2. Rubric Filtering Test

```powershell
.\test-rubric-update.ps1
```

Tests complete rubric activation and filtering flow.

### Manual Testing

#### Test Case 1: Student in Target Class

1. Create rubric with targetClasses = "D21DCCN01-N"
2. Login as student from D21DCCN01-N
3. Navigate to training-points page
4. **Expected:** See the rubric

#### Test Case 2: Student NOT in Target Class

1. Same rubric (targetClasses = "D21DCCN01-N")
2. Login as student from D21DCCN02-N
3. Navigate to training-points page
4. **Expected:** Error "No active rubric found"

#### Test Case 3: Rubric for All Classes

1. Create rubric with targetClasses = empty
2. Login as any student
3. Navigate to training-points page
4. **Expected:** See the rubric

## 🔧 Troubleshooting

### Problem: classCode is null

**Symptoms:**

- User object has `classCode: null`
- Rubric filtering doesn't work

**Solutions:**

1. **For new users:** Request password again

   ```powershell
   curl -X POST http://localhost:8081/auth/request-password `
     -H "Content-Type: application/json" `
     -d '{"email":"student@student.ptithcm.edu.vn"}'
   ```

2. **For existing users:** Bulk update script
   ```sql
   -- Check which users need update
   SELECT username, student_code, class_code
   FROM users
   WHERE student_code IS NOT NULL
   AND class_code IS NULL;
   ```

### Problem: Migration fails

**Symptoms:**

- Error during auth-service startup
- "Column already exists" error

**Solutions:**

1. Check if column exists:

   ```sql
   SHOW COLUMNS FROM users LIKE 'class_code';
   ```

2. If exists, migration will skip automatically
3. If not, check database connection

### Problem: Student service unavailable

**Symptoms:**

- Cannot register users
- Cannot request passwords
- Error fetching student data

**Solutions:**

1. Check student-service is running:

   ```powershell
   curl http://localhost:8082/actuator/health
   ```

2. Check Eureka registration:

   ```
   http://localhost:8761
   ```

3. Restart student-service:
   ```powershell
   .\restart-services.ps1 -Service student
   ```

### Problem: Rubric not showing

**Symptoms:**

- Student sees "No active rubric found"
- Expected rubric doesn't appear

**Solutions:**

1. Check student's classCode:

   ```powershell
   # Login and check user object
   curl -X POST http://localhost:8081/auth/login ...
   ```

2. Check rubric's targetClasses:

   ```powershell
   # Get rubric details
   curl http://localhost:8083/rubrics/{id}
   ```

3. Verify they match (case-insensitive)

4. Check rubric is active:
   ```sql
   SELECT id, name, is_active, target_classes
   FROM rubrics
   WHERE is_active = true;
   ```

## 🛠️ Maintenance

### Restart Services

```powershell
# Restart all services
.\restart-services.ps1

# Restart specific service
.\restart-services.ps1 -Service auth
.\restart-services.ps1 -Service evaluation
```

### Check Service Status

```powershell
# Check ports
netstat -ano | findstr "8761 8080 8081 8082 8083"

# Check health
curl http://localhost:8081/actuator/health
```

### Update Existing Users

```powershell
# Users can request password to update classCode
# Or run bulk update script (see docs/CLASS_CODE_IMPLEMENTATION.md)
```

## 📊 Monitoring

### Key Metrics

- Users with classCode: `SELECT COUNT(*) FROM users WHERE class_code IS NOT NULL`
- Active rubrics: `SELECT COUNT(*) FROM rubrics WHERE is_active = true`
- Rubrics with targets: `SELECT COUNT(*) FROM rubrics WHERE target_classes IS NOT NULL`

### Logs to Monitor

- Auth service: `backend/auth-service/logs/`
- Evaluation service: `backend/evaluation-service/logs/`
- Look for: "No active rubric found for class"

## 🎓 Usage Examples

### Admin: Create Class-Specific Rubric

1. Login as admin
2. Navigate to System Config
3. Create/edit rubric
4. Set target classes: `D21DCCN01-N, D21DCCN02-N`
5. Activate rubric
6. Students in those classes will see it

### Admin: Create Universal Rubric

1. Login as admin
2. Navigate to System Config
3. Create/edit rubric
4. Leave target classes empty
5. Activate rubric
6. All students will see it

### Student: View Rubric

1. Login as student
2. Navigate to Training Points
3. Rubric automatically filtered by your class
4. No manual selection needed

## 🔗 Related Features

This feature is part of the rubric management system:

1. **Rubric Activation** - Toggle rubrics on/off
2. **Class Targeting** - Target specific classes (this feature)
3. **Training Points** - Student self-evaluation
4. **Evaluation Periods** - Time-based evaluation windows

## 📝 API Reference

### Get Active Rubric (Filtered)

```
GET /api/rubrics/active?classCode=D21DCCN01-N
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Rubric 2024-2025",
    "isActive": true,
    "targetClasses": "D21DCCN01-N,D21DCCN02-N"
  }
}
```

**Response (No Match):**

```json
{
  "success": false,
  "message": "No active rubric found for class: D21DCCN03-N"
}
```

### Login (Returns classCode)

```
POST /api/auth/login
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "user": {
      "id": 1,
      "username": "n21dccn001",
      "classCode": "D21DCCN01-N"
    }
  }
}
```

## 🎉 Success Criteria

Feature is working correctly when:

- ✅ New users have classCode after registration
- ✅ Login returns classCode in user object
- ✅ Students see only rubrics for their class
- ✅ Admin can set target classes
- ✅ Filtering is automatic

## 📞 Support

### Documentation

- Check `docs/` folder for detailed guides
- Review test scripts for examples
- See troubleshooting section above

### Common Issues

- Most issues resolved by restarting services
- Check service health endpoints
- Review logs for errors

### Need Help?

1. Check documentation first
2. Review troubleshooting guide
3. Check test scripts for examples
4. Review logs for specific errors

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** ✅ Ready for Deployment
