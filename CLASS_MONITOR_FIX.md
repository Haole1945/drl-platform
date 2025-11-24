# ✅ Fix CLASS_MONITOR Access to Student List

## Vấn Đề

CLASS_MONITOR không thể xem danh sách sinh viên vì:

1. Trang `/students` không có `CLASS_MONITOR` trong `allowedRoles`
2. Không có logic filter tự động theo classCode của CLASS_MONITOR

## Giải Pháp

### 1. Thêm CLASS_MONITOR vào allowedRoles

```tsx
<ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR', 'FACULTY_INSTRUCTOR', 'ADVISOR', 'CTSV_STAFF', 'CLASS_MONITOR']}>
```

### 2. Tự động filter theo classCode

- CLASS_MONITOR chỉ xem được sinh viên trong lớp của mình
- Tự động set `classCode` filter khi load trang
- Disable các filter khác (Faculty, Major, Class) cho CLASS_MONITOR

### 3. UI Changes

- Hiển thị thông báo: "Bạn chỉ có thể xem sinh viên trong lớp {classCode}"
- Disable dropdowns Faculty/Major/Class cho CLASS_MONITOR
- Vẫn cho phép search trong lớp của mình

## Code Changes

### Helper Function

```tsx
const isClassMonitorOnly = () => {
  return (
    user &&
    hasAnyRole(user, ["CLASS_MONITOR"]) &&
    !hasAnyRole(user, [
      "ADMIN",
      "INSTRUCTOR",
      "FACULTY_INSTRUCTOR",
      "ADVISOR",
      "CTSV_STAFF",
    ])
  );
};
```

### Auto-filter Logic

```tsx
const effectiveClassCode =
  isClassMonitorOnly() && user?.classCode
    ? user.classCode
    : classCode && classCode !== "all"
    ? classCode
    : undefined;
```

### Auto-set classCode

```tsx
useEffect(() => {
  if (isClassMonitorOnly() && user?.classCode && classCode === "all") {
    setClassCode(user.classCode);
  }
}, [user]);
```

## Test

### 1. Login as CLASS_MONITOR

```
Username: [class monitor account]
Password: [password]
```

### 2. Navigate to Students Page

- Vào menu "Sinh viên"
- Verify: Chỉ thấy sinh viên trong lớp của mình
- Verify: Các filter Faculty/Major/Class bị disable
- Verify: Có thông báo "Bạn chỉ có thể xem sinh viên trong lớp..."

### 3. Test Search

- Search theo tên sinh viên trong lớp → Hoạt động
- Search theo mã sinh viên → Hoạt động

### 4. Test Other Roles

- Login as ADMIN → Xem được tất cả sinh viên
- Login as INSTRUCTOR → Xem được tất cả sinh viên
- Các filter hoạt động bình thường

## Files Modified

- `frontend/src/app/students/page.tsx`

## Status

✅ Complete - Ready for Testing

---

**Time:** ~10 phút
**Impact:** CLASS_MONITOR giờ có thể xem danh sách sinh viên trong lớp của mình
