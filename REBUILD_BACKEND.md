# 🔧 Rebuild Backend để Áp Dụng Thay Đổi

## Vấn Đề

Lỗi "Only CLASS_MONITOR can approve SUBMITTED evaluations" vẫn xuất hiện vì:

- ✅ Code đã được sửa (cho phép ADMIN duyệt)
- ❌ Backend chưa được rebuild
- ❌ Backend đang chạy code cũ

## Giải Pháp

### Bước 1: Dừng Backend Hiện Tại

Nếu backend đang chạy, nhấn `Ctrl+C` để dừng

### Bước 2: Rebuild Backend

```powershell
cd backend/evaluation-service
mvn clean install -DskipTests
```

### Bước 3: Khởi Động Backend

```powershell
mvn spring-boot:run
```

### Bước 4: Kiểm Tra

1. Đợi backend khởi động xong (thấy dòng "Started EvaluationServiceApplication")
2. Login với tài khoản ADMIN
3. Thử duyệt đánh giá SUBMITTED
4. ✅ Không còn lỗi nữa!

## Thay Đổi Đã Áp Dụng

**File:** `backend/evaluation-service/src/main/java/ptit/drl/evaluation/service/EvaluationService.java`

**Trước:**

```java
// SUBMITTED: Need CLASS_MONITOR to approve
boolean isClassMonitor = approverRoles != null && approverRoles.contains("CLASS_MONITOR");

if (!isClassMonitor) {
    throw new InvalidStateTransitionException(
        "Only CLASS_MONITOR can approve SUBMITTED evaluations");
}
```

**Sau:**

```java
// SUBMITTED: Need CLASS_MONITOR or ADMIN to approve
boolean isClassMonitor = approverRoles != null && approverRoles.contains("CLASS_MONITOR");
boolean isAdmin = approverRoles != null && approverRoles.contains("ADMIN");

if (!isClassMonitor && !isAdmin) {
    throw new InvalidStateTransitionException(
        "Only CLASS_MONITOR or ADMIN can approve SUBMITTED evaluations");
}
```

## Quyền Duyệt Sau Khi Sửa

| Trạng Thái       | Người Có Thể Duyệt            |
| ---------------- | ----------------------------- |
| SUBMITTED        | CLASS_MONITOR hoặc ADMIN      |
| CLASS_APPROVED   | ADVISOR hoặc ADMIN            |
| ADVISOR_APPROVED | FACULTY_INSTRUCTOR hoặc ADMIN |

**Kết luận:** ADMIN có thể duyệt ở mọi cấp độ!
