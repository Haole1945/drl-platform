# Frontend Role Implementation Guide

## ✅ Đã hoàn thành

1. ✅ Cập nhật `User` type để hỗ trợ `roles` array
2. ✅ Tạo `role-utils.ts` với các helper functions:
   - `getUserRoles()` - Lấy tất cả roles của user
   - `hasRole()` - Kiểm tra user có role cụ thể
   - `hasAnyRole()` - Kiểm tra user có bất kỳ role nào
   - `canApproveClassLevel()` - Kiểm tra có thể duyệt cấp lớp
   - `canApproveFacultyLevel()` - Kiểm tra có thể duyệt cấp khoa
   - `canApproveCtsvLevel()` - Kiểm tra có thể duyệt cấp CTSV
   - `canFinalizeEvaluation()` - Kiểm tra có thể chốt điểm
   - `canCreateEvaluation()` - Kiểm tra có thể tạo đánh giá
   - `getPrimaryRoleDisplayName()` - Lấy tên role chính để hiển thị
   - `getRoleDisplayName()` - Lấy tên hiển thị của role

## ⏳ Cần làm tiếp

### 1. Cập nhật Dashboard
- Cập nhật `dashboard/page.tsx` để hiển thị theo role
- Thêm các card chức năng theo role:
  - STUDENT: Tạo đánh giá, Xem lịch sử
  - CLASS_MONITOR: Tạo đánh giá, Xem lịch sử, Duyệt cấp lớp
  - UNION_REPRESENTATIVE: Tương tự CLASS_MONITOR
  - ADVISOR: Duyệt cấp lớp
  - FACULTY_INSTRUCTOR: Duyệt cấp khoa
  - CTSV_STAFF: Duyệt cấp CTSV
  - INSTITUTE_COUNCIL: Chốt điểm
  - ADMIN: Toàn quyền

### 2. Tạo các trang mới
- `/evaluations/new` - Tạo đánh giá mới
- `/evaluations/[id]` - Xem/sửa đánh giá
- `/evaluations` - Danh sách đánh giá
- `/approvals` - Trang duyệt đánh giá (theo cấp)
- `/approvals/class` - Duyệt cấp lớp
- `/approvals/faculty` - Duyệt cấp khoa
- `/approvals/ctsv` - Duyệt cấp CTSV
- `/approvals/finalize` - Chốt điểm

### 3. Cập nhật Components
- Cập nhật `DashboardLayout` để hiển thị menu theo role
- Cập nhật `ProtectedRoute` để hỗ trợ roles array
- Tạo `RoleBadge` component để hiển thị role

### 4. Cập nhật AuthContext
- Đảm bảo `getCurrentUser()` trả về `roles` array từ backend
- Cập nhật logic để xử lý cả `role` (single) và `roles` (array)

## 📝 Lưu ý

1. Backend có thể trả về:
   - `role: "STUDENT"` (single role - backward compatibility)
   - `roles: ["STUDENT", "CLASS_MONITOR"]` (multiple roles - new)

2. Frontend cần hỗ trợ cả hai format để tương thích ngược.

3. Lớp trưởng và đại diện đoàn:
   - Có cả `STUDENT` và `CLASS_MONITOR`/`UNION_REPRESENTATIVE` roles
   - Có thể tạo đánh giá cho chính mình
   - Có thể duyệt đánh giá cho lớp

