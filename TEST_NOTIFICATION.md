# Hướng dẫn Test Notification

## Cách 1: Sử dụng Browser Console

Mở browser console (F12) và chạy:

```javascript
// Import function (nếu đang ở Next.js page)
import { createTestNotifications } from '@/lib/notification';
createTestNotifications().then(console.log).catch(console.error);

// Hoặc gọi trực tiếp API
const API_BASE = 'http://localhost:8080/api';
const token = localStorage.getItem('accessToken');
fetch(`${API_BASE}/notifications/test`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Cách 2: Kiểm tra trong Browser Console

1. Mở DevTools (F12)
2. Vào tab Console
3. Xem logs `[NotificationBell]` để biết API response
4. Vào tab Network để xem request/response

## Cách 3: Kiểm tra Backend Logs

```powershell
cd infra
docker-compose logs evaluation-service --tail 100 | Select-String -Pattern "NOTIFICATION|notificationService|AuthServiceClient|Creating.*notifications"
```

## Vấn đề có thể gặp:

1. **NotificationService null**: Service chưa được inject
2. **AuthServiceClient null**: Feign client chưa được cấu hình
3. **Không tìm thấy reviewers**: Không có user với role CLASS_MONITOR, UNION_REPRESENTATIVE, ADVISOR
4. **X-User-Id header thiếu**: Gateway không forward header (hiếm)

## Debug Steps:

1. Kiểm tra console logs `[NotificationBell]`
2. Kiểm tra Network tab - xem request `/api/notifications/unread`
3. Kiểm tra backend logs
4. Test tạo notification thủ công bằng API call ở trên

