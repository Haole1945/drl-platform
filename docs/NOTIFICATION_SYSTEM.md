# Hệ Thống Thông Báo (Notification System)

## Tổng Quan

Hệ thống thông báo đã được implement đầy đủ với các tính năng:

- ✅ Thông báo real-time
- ✅ Đánh dấu đã đọc/chưa đọc
- ✅ Phân loại theo loại thông báo
- ✅ Link đến nội dung liên quan
- ✅ Tự động refresh mỗi 30 giây
- ✅ Pagination cho danh sách thông báo

## Các Loại Thông Báo Hiện Tại

### 1. PERIOD_CREATED

**Khi nào:** Admin tạo đợt đánh giá mới
**Ai nhận:** Tất cả users (students, teachers, advisors)
**Nội dung:**

```
Title: "Đợt đánh giá điểm rèn luyện mới: [Tên đợt]"
Message: "Đợt đánh giá điểm rèn luyện cho học kỳ [semester] đã được tạo.
          Thời gian nộp: từ [startDate] đến [endDate].
          Vui lòng hoàn thành đánh giá trước hạn."
Link: /evaluations/new
```

### 2. PERIOD_REMINDER

**Khi nào:** Đợt đánh giá sắp kết thúc (3 ngày, 1 ngày trước)
**Ai nhận:** Tất cả users chưa nộp
**Nội dung:**

```
Title: "Nhắc nhở: Đợt đánh giá sắp kết thúc ([X] ngày)"
Message: "Đợt đánh giá điểm rèn luyện cho học kỳ [semester] sẽ kết thúc vào [endDate].
          Còn [X] ngày nữa. Vui lòng hoàn thành đánh giá trước hạn."
Link: /evaluations/new
```

### 3. PERIOD_ENDING

**Khi nào:** Đợt đánh giá sắp đóng (trong ngày cuối)
**Ai nhận:** Users chưa nộp
**Nội dung:**

```
Title: "Khẩn cấp: Đợt đánh giá kết thúc hôm nay"
Message: "Đợt đánh giá điểm rèn luyện sẽ kết thúc vào cuối ngày hôm nay.
          Vui lòng nộp đánh giá ngay."
Link: /evaluations/new
```

### 4. EVALUATION_SUBMITTED

**Khi nào:** Student nộp đánh giá
**Ai nhận:**

- Student (xác nhận đã nộp)
- Class Monitor (nếu có)
- Advisor (nếu có)
  **Nội dung:**

```
Title: "Đánh giá đã được nộp"
Message: "Đánh giá điểm rèn luyện của bạn đã được nộp thành công.
          Vui lòng chờ duyệt."
Link: /evaluations/[evaluationId]
```

### 5. EVALUATION_APPROVED

**Khi nào:** Evaluation được duyệt
**Ai nhận:** Student
**Nội dung:**

```
Title: "Đánh giá đã được duyệt"
Message: "Đánh giá điểm rèn luyện của bạn đã được duyệt.
          Điểm: [score]/100"
Link: /evaluations/[evaluationId]
```

### 6. EVALUATION_REJECTED

**Khi nào:** Evaluation bị từ chối
**Ai nhận:** Student
**Nội dung:**

```
Title: "Đánh giá bị từ chối"
Message: "Đánh giá điểm rèn luyện của bạn đã bị từ chối.
          Lý do: [reason].
          Vui lòng chỉnh sửa và nộp lại."
Link: /evaluations/[evaluationId]
```

## Các Loại Thông Báo Cần Thêm

### 7. EVALUATION_NEEDS_REVIEW (Mới)

**Khi nào:** Student nộp evaluation
**Ai nhận:**

- Class Monitor (nếu student không phải monitor)
- Advisor
- Faculty Instructor
  **Nội dung:**

```
Title: "Có đánh giá mới cần duyệt"
Message: "Sinh viên [studentName] ([studentCode]) đã nộp đánh giá.
          Vui lòng xem xét và duyệt."
Link: /approvals
```

### 8. EVALUATION_RETURNED (Mới)

**Khi nào:** Reviewer yêu cầu student chỉnh sửa
**Ai nhận:** Student
**Nội dung:**

```
Title: "Đánh giá cần chỉnh sửa"
Message: "Đánh giá của bạn cần chỉnh sửa.
          Nhận xét: [comment].
          Vui lòng cập nhật và nộp lại."
Link: /evaluations/[evaluationId]
```

### 9. EVALUATION_ESCALATED (Mới)

**Khi nào:** Evaluation được chuyển lên cấp cao hơn
**Ai nhận:** Reviewer cấp cao hơn
**Nội dung:**

```
Title: "Có đánh giá cần xem xét"
Message: "Đánh giá của sinh viên [studentName] đã được chuyển đến bạn.
          Vui lòng xem xét."
Link: /approvals
```

### 10. RUBRIC_UPDATED (Mới)

**Khi nào:** Admin cập nhật rubric
**Ai nhận:** Tất cả users
**Nội dung:**

```
Title: "Rubric đánh giá đã được cập nhật"
Message: "Rubric đánh giá điểm rèn luyện đã được cập nhật.
          Vui lòng xem lại các tiêu chí mới."
Link: /training-points
```

### 11. RUBRIC_ACTIVATED (Mới)

**Khi nào:** Admin kích hoạt rubric mới
**Ai nhận:** Tất cả users
**Nội dung:**

```
Title: "Rubric mới đã được kích hoạt"
Message: "Rubric đánh giá [rubricName] đã được kích hoạt.
          Áp dụng cho: [targetClasses hoặc 'tất cả lớp']"
Link: /training-points
```

### 12. COMMENT_ADDED (Mới)

**Khi nào:** Reviewer thêm comment vào evaluation
**Ai nhận:** Student
**Nội dung:**

```
Title: "Có nhận xét mới"
Message: "[ReviewerRole] đã thêm nhận xét vào đánh giá của bạn:
          '[comment]'"
Link: /evaluations/[evaluationId]
```

## Kiến Trúc

### Backend (Evaluation Service)

```
NotificationService
├── createNotification()
├── getUserNotifications()
├── getUnreadNotifications()
├── countUnreadNotifications()
├── markAsRead()
├── markAllAsRead()
├── notifyPeriodCreated()
├── notifyPeriodReminder()
└── deleteOldNotifications()
```

### Frontend

```
Components:
├── NotificationBell.tsx (Icon với badge số lượng)
├── NotificationPopover (Dropdown list)
└── NotificationsPage (Full page view)

API:
├── getNotifications(page, size)
├── getUnreadNotifications()
├── getUnreadCount()
├── markNotificationAsRead(id)
└── markAllNotificationsAsRead()
```

## Database Schema

```sql
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_type VARCHAR(50),
    related_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created_at (created_at)
);
```

## Cách Thêm Notification Mới

### 1. Thêm NotificationType (Backend)

```java
// In Notification.java entity
public enum NotificationType {
    PERIOD_CREATED,
    PERIOD_REMINDER,
    PERIOD_ENDING,
    EVALUATION_SUBMITTED,
    EVALUATION_APPROVED,
    EVALUATION_REJECTED,
    EVALUATION_NEEDS_REVIEW,  // ← Thêm mới
    EVALUATION_RETURNED,      // ← Thêm mới
    // ... thêm các type khác
}
```

### 2. Thêm vào Frontend Type

```typescript
// In frontend/src/lib/notification.ts
export type NotificationType =
  | "PERIOD_CREATED"
  | "PERIOD_REMINDER"
  | "PERIOD_ENDING"
  | "EVALUATION_SUBMITTED"
  | "EVALUATION_APPROVED"
  | "EVALUATION_REJECTED"
  | "EVALUATION_NEEDS_REVIEW" // ← Thêm mới
  | "EVALUATION_RETURNED"; // ← Thêm mới
```

### 3. Thêm Label (Frontend)

```typescript
// In frontend/src/app/notifications/page.tsx
const getNotificationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    PERIOD_CREATED: "Đợt đánh giá mới",
    PERIOD_REMINDER: "Nhắc nhở",
    PERIOD_ENDING: "Sắp kết thúc",
    EVALUATION_SUBMITTED: "Đã nộp",
    EVALUATION_APPROVED: "Đã duyệt",
    EVALUATION_REJECTED: "Bị từ chối",
    EVALUATION_NEEDS_REVIEW: "Cần duyệt", // ← Thêm mới
    EVALUATION_RETURNED: "Cần chỉnh sửa", // ← Thêm mới
  };
  return labels[type] || type;
};
```

### 4. Tạo Notification trong Service

```java
// Example: Notify when evaluation needs review
public void notifyEvaluationNeedsReview(Long evaluationId, String studentName,
                                       String studentCode, List<Long> reviewerIds) {
    String title = "Có đánh giá mới cần duyệt";
    String message = String.format(
        "Sinh viên %s (%s) đã nộp đánh giá. Vui lòng xem xét và duyệt.",
        studentName, studentCode
    );

    for (Long reviewerId : reviewerIds) {
        createNotification(
            reviewerId,
            title,
            message,
            Notification.NotificationType.EVALUATION_NEEDS_REVIEW,
            "EVALUATION",
            evaluationId
        );
    }
}
```

### 5. Gọi từ Business Logic

```java
// In EvaluationService.java
public EvaluationDTO submitEvaluation(Long evaluationId) {
    // ... submit logic

    // Get reviewers for this evaluation
    List<Long> reviewerIds = getReviewersForEvaluation(evaluation);

    // Send notifications
    notificationService.notifyEvaluationNeedsReview(
        evaluationId,
        student.getFullName(),
        student.getStudentCode(),
        reviewerIds
    );

    return evaluationDTO;
}
```

## Tính Năng Nâng Cao

### 1. Real-time Notifications (WebSocket)

Hiện tại: Polling mỗi 30 giây
Cải tiến: Dùng WebSocket để push real-time

### 2. Email Notifications

Gửi email cho notifications quan trọng:

- PERIOD_CREATED
- EVALUATION_REJECTED
- PERIOD_ENDING

### 3. Push Notifications

Dùng Service Worker để gửi browser push notifications

### 4. Notification Preferences

Cho phép user chọn loại notification muốn nhận

### 5. Notification Grouping

Gộp nhiều notifications cùng loại:
"Bạn có 5 đánh giá mới cần duyệt"

## Testing

### Test Notification Creation

```powershell
# Test tạo notification
curl -X POST http://localhost:8083/notifications `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "userId": 1,
    "title": "Test notification",
    "message": "This is a test",
    "type": "PERIOD_CREATED"
  }'
```

### Test Get Notifications

```powershell
# Get all notifications
curl http://localhost:8083/notifications?page=0&size=20 `
  -H "Authorization: Bearer $token"

# Get unread count
curl http://localhost:8083/notifications/unread/count `
  -H "Authorization: Bearer $token"
```

### Test Mark as Read

```powershell
# Mark single notification as read
curl -X PUT http://localhost:8083/notifications/1/read `
  -H "Authorization: Bearer $token"

# Mark all as read
curl -X PUT http://localhost:8083/notifications/read-all `
  -H "Authorization: Bearer $token"
```

## Monitoring

### Metrics to Track

- Số lượng notifications được tạo mỗi ngày
- Tỷ lệ notifications được đọc
- Thời gian trung bình để đọc notification
- Loại notification phổ biến nhất

### Cleanup Job

```java
// Scheduled job to delete old notifications
@Scheduled(cron = "0 0 2 * * *")  // Run at 2 AM daily
public void cleanupOldNotifications() {
    notificationService.deleteOldNotifications(30);  // Keep 30 days
}
```

## Tóm Tắt

### Đã Có

✅ 6 loại notifications cơ bản
✅ UI đầy đủ (bell icon, popover, full page)
✅ Mark as read/unread
✅ Pagination
✅ Auto-refresh mỗi 30s
✅ Link to related content

### Cần Thêm

⏳ 6 loại notifications mới (cho teachers, reviewers)
⏳ Email notifications
⏳ WebSocket real-time
⏳ Push notifications
⏳ Notification preferences
⏳ Notification grouping

### Priority

1. **High:** EVALUATION_NEEDS_REVIEW, EVALUATION_RETURNED
2. **Medium:** RUBRIC_UPDATED, COMMENT_ADDED
3. **Low:** Email, WebSocket, Push notifications

Hệ thống notification đã hoạt động tốt và sẵn sàng mở rộng! 🎉
