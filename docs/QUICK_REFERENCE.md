# Quick Reference - Class-Based Rubric Filtering

## 🎯 What This Feature Does

Allows admins to create rubrics that only apply to specific classes:

- Rubric with `targetClasses = "D21DCCN01-N"` → Only students in D21DCCN01-N see it
- Rubric with `targetClasses = null` → All students see it
- Students automatically see the correct rubric based on their class

## 🚀 Quick Start

### 1. Restart Auth Service (Required First Time)

```powershell
.\restart-services.ps1 -Service auth
```

Wait 30 seconds for service to start.

### 2. Test Implementation

```powershell
.\test-class-code.ps1
```

Verifies that user objects now include `classCode`.

### 3. Use in Frontend

Login as admin → System Config → Edit rubric → Set target classes

## 📝 Common Tasks

### Restart Single Service

```powershell
.\restart-services.ps1 -Service auth        # Auth service only
.\restart-services.ps1 -Service evaluation  # Evaluation service only
```

### Restart All Services

```powershell
.\restart-services.ps1
```

### Test Class Code

```powershell
.\test-class-code.ps1
```

### Test Rubric Filtering

```powershell
.\test-rubric-update.ps1
```

### Check Service Status

```powershell
netstat -ano | findstr "8761 8080 8081 8082 8083"
```

## 🔍 How It Works

### Backend Flow

1. **Student logs in** → Auth service fetches student data from student-service
2. **Student data includes classCode** → Auth service stores it in User entity
3. **User object returned** → Includes classCode field
4. **Frontend requests rubric** → Sends classCode as parameter
5. **Evaluation service filters** → Returns only rubrics targeting that class

### Database Schema

```sql
-- users table (auth-service)
ALTER TABLE users ADD COLUMN class_code VARCHAR(20);

-- rubrics table (evaluation-service)
ALTER TABLE rubrics ADD COLUMN target_classes TEXT;
```

### API Endpoints

**Get active rubric (filtered by class)**

```
GET /api/rubrics/active?classCode=D21DCCN01-N
```

**Login (returns classCode)**

```
POST /api/auth/login
Response: { user: { classCode: "D21DCCN01-N", ... } }
```

## 🐛 Troubleshooting

### classCode is null

**Problem:** User was created before migration
**Solution:** Request password again for that user

### Rubric not showing

**Problem:** Student's class not in targetClasses
**Solution:**

1. Check student's classCode: Login and check user object
2. Check rubric's targetClasses: View in admin panel
3. Verify they match (case-insensitive)

### Migration fails

**Problem:** Database connection or column exists
**Solution:**

```sql
-- Check if column exists
SHOW COLUMNS FROM users LIKE 'class_code';

-- If exists, migration will skip automatically
```

## 📚 Documentation

- `NEXT_STEPS.md` - Detailed next steps
- `docs/CLASS_CODE_IMPLEMENTATION.md` - Implementation details
- `docs/RUBRIC_CLASS_FILTERING.md` - Feature documentation
- `docs/RUBRIC_ACTIVATION_AND_TARGETING.md` - Rubric activation

## 🎨 Frontend Usage

### Admin: Set Target Classes

```typescript
// In RubricEditor component
<input
  type="text"
  value={targetClasses}
  onChange={(e) => setTargetClasses(e.target.value)}
  placeholder="D21DCCN01-N, D21DCCN02-N (leave empty for all classes)"
/>
```

### Student: View Rubric

```typescript
// Automatically filtered by student's class
const { data: rubric } = useQuery({
  queryKey: ["rubric", "active", user?.classCode],
  queryFn: () => getRubric(user?.classCode),
});
```

## ✅ Checklist

- [ ] Restart auth-service
- [ ] Run test-class-code.ps1
- [ ] Verify classCode in user object
- [ ] Create rubric with target classes
- [ ] Test with student from target class
- [ ] Test with student from different class
- [ ] Verify filtering works correctly

## 🎉 Success Criteria

When everything works:

1. ✅ User object includes classCode after login
2. ✅ Admin can set target classes for rubrics
3. ✅ Students see only rubrics for their class
4. ✅ Students in other classes get "No rubric found" error
5. ✅ Rubrics with no target classes show to all students
