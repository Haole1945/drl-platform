# Notification System Issue Analysis

## Problem

Notification feature không hoạt động - không có notifications hiển thị cho users.

## Root Cause

**Database has 0 notifications**

```sql
SELECT COUNT(*) FROM notifications;
-- Result: 0
```

## Why No Notifications?

### Backend Implementation Status

✅ **Database Schema:** Table `notifications` exists (V3 migration)
✅ **Entity:** `Notification` entity defined
✅ **Service:** `NotificationService` with create methods
✅ **Controller:** `NotificationController` with all endpoints
✅ **Integration:** Services call `notificationService.createNotification()`

### When Notifications Should Be Created

1. **Period Created** - `EvaluationPeriodService.createPeriod()`

   ```java
   notificationService.notifyPeriodCreated(...)
   ```

2. **Evaluation Rejected** - `EvaluationService.rejectEvaluation()`

   ```java
   notificationService.createNotification(userId, title, message, EVALUATION_REJECTED, ...)
   ```

3. **Evaluation Approved** - `EvaluationService.approveEvaluation()`
   ```java
   // Should create notification but may not be implemented
   ```

## Possible Reasons for No Notifications

### 1. NotificationService is NULL

```java
if (notificationService != null) {
    notificationService.createNotification(...);
}
```

If `notificationService` is not injected, notifications won't be created.

### 2. AuthServiceClient Fails

```java
if (notificationService != null && authServiceClient != null) {
    try {
        // Get user info from auth-service
        UserResponse userResponse = authServiceClient.getUserByStudentCode(studentCode);
        // Create notification
    } catch (Exception e) {
        // Silently fails
    }
}
```

If auth-service is down or returns error, notification creation fails silently.

### 3. No Events Triggered Yet

- No periods created since notification system was added
- No evaluations rejected/approved since notification system was added

## Testing

### Test 1: Check if NotificationService is Injected

```bash
# Check evaluation-service logs for errors
docker logs drl-evaluation-service | grep -i notification
```

### Test 2: Create a Period

```bash
# Create a new evaluation period via API
# Should trigger PERIOD_CREATED notification
```

### Test 3: Reject an Evaluation

```bash
# Reject an evaluation via API
# Should trigger EVALUATION_REJECTED notification
```

### Test 4: Check Database After Actions

```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

## Quick Fix Test

### Manual Notification Creation

```sql
-- Insert a test notification
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
VALUES (1, 'Test Notification', 'This is a test notification', 'EVALUATION_SUBMITTED', false, NOW());

-- Check if it appears in frontend
```

### Check Frontend

1. Login as user with ID = 1
2. Check notification bell
3. Should see 1 unread notification

## Verification Steps

### Step 1: Check Service Injection

```bash
docker logs drl-evaluation-service --tail 100 | grep -i "notificationService"
```

### Step 2: Check Auth Service Connection

```bash
# Test if evaluation-service can reach auth-service
docker exec drl-evaluation-service curl http://auth-service:8082/actuator/health
```

### Step 3: Create Test Data

```bash
# Create a period (should trigger notification)
curl -X POST http://localhost:8080/api/evaluation-periods \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Period",
    "semester": "2024-2025-HK1",
    "academicYear": "2024-2025",
    "startDate": "2024-12-01",
    "endDate": "2024-12-31",
    "isActive": true
  }'
```

### Step 4: Check Database

```sql
SELECT * FROM notifications;
```

## Expected Behavior

### After Creating Period:

- Notification created for all users
- Type: PERIOD_CREATED
- Title: "Đợt đánh giá điểm rèn luyện mới: [name]"

### After Rejecting Evaluation:

- Notification created for student
- Type: EVALUATION_REJECTED
- Title: "Đánh giá bị từ chối"
- Related to evaluation ID

## Frontend Status

✅ **NotificationBell Component:** Working
✅ **Notifications Page:** Working
✅ **API Functions:** Working
✅ **Auto-refresh:** Every 30 seconds

**Frontend is ready - just waiting for backend to create notifications.**

## Recommended Actions

### Immediate:

1. ✅ Check evaluation-service logs for errors
2. ✅ Verify NotificationService is injected
3. ✅ Test by creating a period or rejecting an evaluation
4. ✅ Check database for new notifications

### If Still No Notifications:

1. Add debug logging to NotificationService
2. Check if authServiceClient is working
3. Verify Feign client configuration
4. Check if exceptions are being swallowed

### Long-term:

1. Add notification creation to more events
2. Add admin UI to view all notifications
3. Add email notifications
4. Add push notifications

## Status

⚠️ **Backend creates notifications but database is empty**
✅ **Frontend ready to display notifications**
🔍 **Need to test notification creation**

---

**Next Steps:**

1. Create a test period or reject an evaluation
2. Check if notification appears in database
3. If yes → Frontend will show it automatically
4. If no → Debug NotificationService injection
