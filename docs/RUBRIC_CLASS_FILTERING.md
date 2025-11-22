# Rubric Class Filtering

## Tính Năng

Khi admin set rubric chỉ áp dụng cho các lớp cụ thể (ví dụ: `D21CQCN02-N`), thì:

- ✅ Sinh viên lớp `D21CQCN02-N` → Thấy rubric này
- ❌ Sinh viên lớp `D21CQCN01-N` → KHÔNG thấy rubric này

## Implementation

### Backend Changes

#### 1. RubricController.java

Thêm parameter `classCode` vào endpoint `/rubrics/active`:

```java
@GetMapping("/active")
public ResponseEntity<ApiResponse<RubricDTO>> getActiveRubric(
        @RequestParam(required = false) String academicYear,
        @RequestParam(required = false) String classCode) {  // ← Added
    RubricDTO rubric = rubricService.getActiveRubric(academicYear, classCode);
    return ResponseEntity.ok(
        ApiResponse.success("Active rubric found", rubric));
}
```

#### 2. RubricService.java

Thêm logic filter theo `classCode`:

```java
public RubricDTO getActiveRubric(String academicYear, String classCode) {
    // Get active rubrics
    List<Rubric> activeRubrics = ...;

    // Filter by classCode if provided
    if (classCode != null && !classCode.isEmpty()) {
        for (Rubric rubric : activeRubrics) {
            // If targetClasses is null/empty → applies to ALL classes
            if (rubric.getTargetClasses() == null || rubric.getTargetClasses().isEmpty()) {
                return RubricMapper.toDTO(rubric);
            }

            // Check if classCode matches any target class
            String[] targetClasses = rubric.getTargetClasses().split(",");
            for (String targetClass : targetClasses) {
                if (targetClass.trim().equalsIgnoreCase(classCode.trim())) {
                    return RubricMapper.toDTO(rubric);
                }
            }
        }

        // No rubric found for this class
        throw new ResourceNotFoundException("No active rubric found for class: " + classCode);
    }

    // No classCode provided → return first active rubric
    return RubricMapper.toDTO(activeRubrics.get(0));
}
```

### Logic Flow

1. **Nếu rubric có `targetClasses = null` hoặc rỗng**:
   - → Áp dụng cho **TẤT CẢ** các lớp
2. **Nếu rubric có `targetClasses = "D21CQCN02-N,D22CQCN01-N"`**:

   - → Chỉ áp dụng cho lớp `D21CQCN02-N` và `D22CQCN01-N`
   - → Các lớp khác sẽ nhận lỗi "No active rubric found"

3. **Nếu không truyền `classCode`**:
   - → Trả về rubric active đầu tiên (backward compatible)

## API Usage

### Get Active Rubric for Specific Class

```bash
GET /api/rubrics/active?classCode=D21CQCN02-N
```

**Response nếu rubric áp dụng cho lớp này:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Rubric 2024-2025",
    "isActive": true,
    "targetClasses": "D21CQCN02-N,D22CQCN01-N"
  }
}
```

**Response nếu KHÔNG có rubric cho lớp này:**

```json
{
  "success": false,
  "message": "No active rubric found for class: D21CQCN01-N"
}
```

### Get Active Rubric (All Classes)

```bash
GET /api/rubrics/active
```

Trả về rubric active đầu tiên, không filter theo class.

## Frontend Integration

Frontend cần gửi `classCode` của student khi lấy rubric:

```typescript
// Lấy class code từ student profile
const studentClass = currentUser.classCode; // e.g., "D21CQCN01-N"

// Gọi API với classCode
const response = await fetch(`/api/rubrics/active?classCode=${studentClass}`);
```

## Testing

### Test Case 1: Rubric cho tất cả lớp

```
Rubric: targetClasses = null
Student: D21CQCN01-N
Result: ✅ Thấy rubric
```

### Test Case 2: Rubric cho lớp cụ thể (match)

```
Rubric: targetClasses = "D21CQCN02-N"
Student: D21CQCN02-N
Result: ✅ Thấy rubric
```

### Test Case 3: Rubric cho lớp cụ thể (not match)

```
Rubric: targetClasses = "D21CQCN02-N"
Student: D21CQCN01-N
Result: ❌ Không thấy rubric (404 error)
```

### Test Case 4: Multiple target classes

```
Rubric: targetClasses = "D21CQCN02-N,D22CQCN01-N,D20CQCN03-N"
Student: D22CQCN01-N
Result: ✅ Thấy rubric
```

## Auth Service Integration

### Problem

Frontend cần `classCode` để filter rubrics, nhưng User object không có field này.

### Solution

Auth service giờ fetch `classCode` từ student-service và lưu vào User entity:

1. **User Entity**: Thêm field `classCode` (VARCHAR(20))
2. **UserDTO**: Thêm field `classCode` trong API response
3. **AuthService**:
   - `register()`: Fetch classCode khi validate studentCode
   - `requestPassword()`: Fetch và update classCode cho user mới/cũ
4. **Migration V5**: Thêm column `class_code` vào table `users`

Chi tiết: `docs/CLASS_CODE_IMPLEMENTATION.md`

## Testing

### Test 1: Verify classCode in User Object

```powershell
.\test-class-code.ps1
```

Tests:

- Password request updates classCode
- Login returns classCode in user object
- /me endpoint includes classCode

### Test 2: Rubric Filtering

```powershell
.\test-rubric-update.ps1
```

Tests complete rubric activation and class filtering flow.

## Next Steps

1. ✅ Backend logic implemented (evaluation-service)
2. ✅ Auth service updated to store classCode
3. ✅ Frontend UI updated with class targeting
4. ⏳ Restart auth-service to apply V5 migration
5. ⏳ Test end-to-end flow

## Files Changed

### Evaluation Service

- `backend/evaluation-service/src/main/java/ptit/drl/evaluation/api/RubricController.java`
- `backend/evaluation-service/src/main/java/ptit/drl/evaluation/service/RubricService.java`
- `backend/evaluation-service/src/main/resources/db/migration/V4__add_target_classes_to_rubrics.sql`

### Auth Service

- `backend/auth-service/src/main/java/ptit/drl/auth/entity/User.java`
- `backend/auth-service/src/main/java/ptit/drl/auth/dto/UserDTO.java`
- `backend/auth-service/src/main/java/ptit/drl/auth/mapper/UserMapper.java`
- `backend/auth-service/src/main/java/ptit/drl/auth/service/AuthService.java`
- `backend/auth-service/src/main/resources/db/migration/V5__add_class_code_to_users.sql`

### Frontend

- `frontend/src/app/admin/system-config/components/RubricEditor.tsx`
- `frontend/src/app/admin/system-config/components/RubricList.tsx`
- `frontend/src/types/auth.ts` (already had classCode field)
