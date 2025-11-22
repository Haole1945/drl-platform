# Kế Hoạch Implement Notifications Còn Thiếu

## Tổng Quan

Hệ thống notification hiện tại đã có 6 loại cơ bản. Cần thêm 6 loại mới để hỗ trợ đầy đủ workflow.

## Phase 1: Notifications cho Reviewers (Priority: HIGH)

### 1. EVALUATION_NEEDS_REVIEW

**Mục đích:** Thông báo cho reviewers khi có evaluation mới cần duyệt

**Implementation:**

#### Backend Changes

```java
// In NotificationService.java
public void notifyEvaluationNeedsReview(Long evaluationId, String studentName,
                                       String studentCode, String className,
                                       List<Long> reviewerIds) {
    String title = "Có đánh giá mới cần duyệt";
    String message = String.format(
        "Sinh viên %s (%s) - Lớp %s đã nộp đánh giá. Vui lòng xem xét và duyệt.",
        studentName, studentCode, className
    );

    for (Long reviewerId : reviewerIds) {
        // Check if notification already exists
        List<Notification> existing = notificationRepository
            .findByUserIdAndTypeAndRelatedTypeAndRelatedId(
                reviewerId,
                Notification.NotificationType.EVALUATION_NEEDS_REVIEW,
                "EVALUATION",
                evaluationId
            );

        if (existing.isEmpty()) {
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
}
```

#### Call from EvaluationService

```java
// In EvaluationService.submitEvaluation()
public EvaluationDTO submitEvaluation(Long evaluationId, Long userId) {
    // ... existing submit logic

    // Get student info
    String studentName = evaluation.getStudent().getFullName();
    String studentCode = evaluation.getStudent().getStudentCode();
    String className = evaluation.getStudent().getClassCode();

    // Get reviewers based on current status
    List<Long> reviewerIds = getReviewersForEvaluation(evaluation);

    // Send notifications
    notificationService.notifyEvaluationNeedsReview(
        evaluationId,
        studentName,
        studentCode,
        className,
        reviewerIds
    );

    // Also notify student
    notificationService.createNotification(
        userId,
        "Đánh giá đã được nộp",
        "Đánh giá điểm rèn luyện của bạn đã được nộp thành công. Vui lòng chờ duyệt.",
        Notification.NotificationType.EVALUATION_SUBMITTED,
        "EVALUATION",
        evaluationId
    );

    return evaluationDTO;
}

// Helper method to get reviewers
private List<Long> getReviewersForEvaluation(Evaluation evaluation) {
    List<Long> reviewerIds = new ArrayList<>();

    // Get class monitor (if student is not monitor)
    if (evaluation.getClassMonitorApproval() == null) {
        Long monitorId = getClassMonitorId(evaluation.getStudent().getClassCode());
        if (monitorId != null && !monitorId.equals(evaluation.getStudent().getUserId())) {
            reviewerIds.add(monitorId);
        }
    }

    // Get advisor
    if (evaluation.getAdvisorApproval() == null) {
        Long advisorId = getAdvisorId(evaluation.getStudent().getClassCode());
        if (advisorId != null) {
            reviewerIds.add(advisorId);
        }
    }

    // Get faculty instructor
    if (evaluation.getFacultyApproval() == null) {
        Long instructorId = getFacultyInstructorId(evaluation.getStudent().getFacultyCode());
        if (instructorId != null) {
            reviewerIds.add(instructorId);
        }
    }

    return reviewerIds;
}
```

### 2. EVALUATION_RETURNED

**Mục đích:** Thông báo cho student khi evaluation cần chỉnh sửa

**Implementation:**

#### Backend Changes

```java
// In NotificationService.java
public void notifyEvaluationReturned(Long evaluationId, Long studentUserId,
                                    String reviewerRole, String comment) {
    String title = "Đánh giá cần chỉnh sửa";
    String message = String.format(
        "%s đã yêu cầu bạn chỉnh sửa đánh giá. Nhận xét: %s. " +
        "Vui lòng cập nhật và nộp lại.",
        reviewerRole, comment
    );

    createNotification(
        studentUserId,
        title,
        message,
        Notification.NotificationType.EVALUATION_RETURNED,
        "EVALUATION",
        evaluationId
    );
}
```

#### Call from EvaluationService

```java
// In EvaluationService.rejectEvaluation()
public EvaluationDTO rejectEvaluation(Long evaluationId, String comment,
                                     String reviewerRole, Long reviewerId) {
    // ... existing reject logic

    // Get student user ID
    Long studentUserId = evaluation.getStudent().getUserId();

    // Send notification
    notificationService.notifyEvaluationReturned(
        evaluationId,
        studentUserId,
        reviewerRole,
        comment
    );

    return evaluationDTO;
}
```

## Phase 2: Notifications cho Rubric Updates (Priority: MEDIUM)

### 3. RUBRIC_ACTIVATED

**Mục đích:** Thông báo khi rubric mới được kích hoạt

**Implementation:**

```java
// In NotificationService.java
public void notifyRubricActivated(Long rubricId, String rubricName,
                                 String targetClasses) {
    if (authServiceClient == null) return;

    try {
        AuthServiceClient.UserIdsResponse response = authServiceClient.getAllUserIds();
        if (response != null && response.isSuccess() && response.getData() != null) {
            List<Long> userIds = response.getData();

            String title = "Rubric mới đã được kích hoạt";
            String message = String.format(
                "Rubric đánh giá '%s' đã được kích hoạt. Áp dụng cho: %s",
                rubricName,
                targetClasses != null && !targetClasses.isEmpty()
                    ? targetClasses
                    : "tất cả lớp"
            );

            for (Long userId : userIds) {
                createNotification(
                    userId,
                    title,
                    message,
                    Notification.NotificationType.RUBRIC_ACTIVATED,
                    "RUBRIC",
                    rubricId
                );
            }
        }
    } catch (Exception e) {
        System.err.println("Failed to create rubric activation notifications: " + e.getMessage());
    }
}
```

#### Call from RubricService

```java
// In RubricService.activateRubric()
public RubricDTO activateRubric(Long rubricId) {
    // ... existing activation logic

    // Send notifications
    notificationService.notifyRubricActivated(
        rubricId,
        rubric.getName(),
        rubric.getTargetClasses()
    );

    return rubricDTO;
}
```

### 4. RUBRIC_UPDATED

**Mục đích:** Thông báo khi rubric được cập nhật

**Implementation:**

```java
// In NotificationService.java
public void notifyRubricUpdated(Long rubricId, String rubricName,
                               String changes) {
    if (authServiceClient == null) return;

    try {
        AuthServiceClient.UserIdsResponse response = authServiceClient.getAllUserIds();
        if (response != null && response.isSuccess() && response.getData() != null) {
            List<Long> userIds = response.getData();

            String title = "Rubric đánh giá đã được cập nhật";
            String message = String.format(
                "Rubric '%s' đã được cập nhật. Thay đổi: %s. " +
                "Vui lòng xem lại các tiêu chí mới.",
                rubricName, changes
            );

            for (Long userId : userIds) {
                createNotification(
                    userId,
                    title,
                    message,
                    Notification.NotificationType.RUBRIC_UPDATED,
                    "RUBRIC",
                    rubricId
                );
            }
        }
    } catch (Exception e) {
        System.err.println("Failed to create rubric update notifications: " + e.getMessage());
    }
}
```

## Phase 3: Advanced Notifications (Priority: LOW)

### 5. COMMENT_ADDED

**Mục đích:** Thông báo khi có comment mới

### 6. EVALUATION_ESCALATED

**Mục đích:** Thông báo khi evaluation được chuyển lên cấp cao hơn

## Implementation Steps

### Step 1: Update Enum

```java
// In Notification.java
public enum NotificationType {
    // Existing
    PERIOD_CREATED,
    PERIOD_REMINDER,
    PERIOD_ENDING,
    EVALUATION_SUBMITTED,
    EVALUATION_APPROVED,
    EVALUATION_REJECTED,

    // New - Phase 1
    EVALUATION_NEEDS_REVIEW,
    EVALUATION_RETURNED,

    // New - Phase 2
    RUBRIC_ACTIVATED,
    RUBRIC_UPDATED,

    // New - Phase 3
    COMMENT_ADDED,
    EVALUATION_ESCALATED
}
```

### Step 2: Update Frontend Types

```typescript
// In frontend/src/lib/notification.ts
export type NotificationType =
  | "PERIOD_CREATED"
  | "PERIOD_REMINDER"
  | "PERIOD_ENDING"
  | "EVALUATION_SUBMITTED"
  | "EVALUATION_APPROVED"
  | "EVALUATION_REJECTED"
  | "EVALUATION_NEEDS_REVIEW"
  | "EVALUATION_RETURNED"
  | "RUBRIC_ACTIVATED"
  | "RUBRIC_UPDATED"
  | "COMMENT_ADDED"
  | "EVALUATION_ESCALATED";
```

### Step 3: Update Labels

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
    EVALUATION_NEEDS_REVIEW: "Cần duyệt",
    EVALUATION_RETURNED: "Cần chỉnh sửa",
    RUBRIC_ACTIVATED: "Rubric mới",
    RUBRIC_UPDATED: "Rubric cập nhật",
    COMMENT_ADDED: "Nhận xét mới",
    EVALUATION_ESCALATED: "Chuyển cấp cao",
  };
  return labels[type] || type;
};
```

### Step 4: Update Links

```typescript
// In NotificationBell.tsx and page.tsx
const getNotificationLink = (notification: Notification): string | null => {
  if (
    notification.relatedType === "EVALUATION_PERIOD" &&
    notification.relatedId
  ) {
    return "/evaluations/new";
  }
  if (notification.relatedType === "EVALUATION" && notification.relatedId) {
    // For reviewers
    if (
      ["EVALUATION_NEEDS_REVIEW", "EVALUATION_ESCALATED"].includes(
        notification.type
      )
    ) {
      return "/approvals";
    }
    // For students
    return `/evaluations/${notification.relatedId}`;
  }
  if (notification.relatedType === "RUBRIC" && notification.relatedId) {
    return "/training-points";
  }
  return null;
};
```

## Testing Plan

### Test Phase 1

```powershell
# Test EVALUATION_NEEDS_REVIEW
# 1. Login as student
# 2. Submit evaluation
# 3. Login as class monitor
# 4. Check notifications - should see "Có đánh giá mới cần duyệt"

# Test EVALUATION_RETURNED
# 1. Login as class monitor
# 2. Reject evaluation with comment
# 3. Login as student
# 4. Check notifications - should see "Đánh giá cần chỉnh sửa"
```

### Test Phase 2

```powershell
# Test RUBRIC_ACTIVATED
# 1. Login as admin
# 2. Activate rubric
# 3. Login as any user
# 4. Check notifications - should see "Rubric mới đã được kích hoạt"
```

## Timeline

- **Phase 1:** 2-3 hours

  - Update enums: 15 mins
  - Implement EVALUATION_NEEDS_REVIEW: 1 hour
  - Implement EVALUATION_RETURNED: 1 hour
  - Testing: 30 mins

- **Phase 2:** 1-2 hours

  - Implement RUBRIC_ACTIVATED: 45 mins
  - Implement RUBRIC_UPDATED: 45 mins
  - Testing: 30 mins

- **Phase 3:** 2-3 hours (optional)
  - Implement COMMENT_ADDED: 1 hour
  - Implement EVALUATION_ESCALATED: 1 hour
  - Testing: 1 hour

**Total:** 5-8 hours

## Priority Order

1. **EVALUATION_NEEDS_REVIEW** - Quan trọng nhất cho reviewers
2. **EVALUATION_RETURNED** - Quan trọng cho students
3. **RUBRIC_ACTIVATED** - Thông tin hữu ích
4. **RUBRIC_UPDATED** - Thông tin hữu ích
5. **COMMENT_ADDED** - Nice to have
6. **EVALUATION_ESCALATED** - Nice to have

## Kết Luận

Hệ thống notification hiện tại đã hoạt động tốt. Chỉ cần thêm 4-6 loại notification nữa là đủ cho toàn bộ workflow. Ưu tiên implement Phase 1 trước (EVALUATION_NEEDS_REVIEW và EVALUATION_RETURNED) vì đây là 2 loại quan trọng nhất cho reviewers và students.
