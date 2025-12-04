# ✅ Notification Date Format Fix

## Error

```
RangeError: Invalid time value
at formatDistanceToNow
```

## Root Cause

`notification.createdAt` từ database không phải format date hợp lệ hoặc null, gây lỗi khi parse với `new Date()`.

## Solution

Thêm try-catch và validation khi parse date:

### Before:

```tsx
{
  formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: vi,
  });
}
```

### After:

```tsx
{
  (() => {
    try {
      const date = new Date(notification.createdAt);
      if (isNaN(date.getTime())) {
        return "Vừa xong";
      }
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: vi,
      });
    } catch {
      return "Vừa xong";
    }
  })();
}
```

## Files Fixed

1. `frontend/src/components/NotificationBell.tsx`

   - Added safe date parsing in notification list

2. `frontend/src/app/notifications/page.tsx`
   - Added safe date parsing for both `format()` and `formatDistanceToNow()`

## Testing

### Test 1: With Valid Date

```sql
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
VALUES (1, 'Test', 'Message', 'EVALUATION_SUBMITTED', false, NOW());
```

**Expected:** Shows "X phút trước" or similar

### Test 2: With Invalid Date

```sql
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
VALUES (1, 'Test', 'Message', 'EVALUATION_SUBMITTED', false, NULL);
```

**Expected:** Shows "Vừa xong" instead of crashing

### Test 3: With Malformed Date

```sql
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
VALUES (1, 'Test', 'Message', 'EVALUATION_SUBMITTED', false, 'invalid-date');
```

**Expected:** Shows "Vừa xong" instead of crashing

## Status

✅ **Fixed** - Notification bell and page now handle invalid dates gracefully

---

**Impact:** No more crashes when viewing notifications with invalid dates
**Fallback:** Shows "Vừa xong" for invalid dates
