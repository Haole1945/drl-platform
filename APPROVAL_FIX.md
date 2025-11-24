# ✅ Fix Approval Not Working

## Vấn Đề

Admin có thể reject phiếu đánh giá nhưng không thể approve vì:

- Backend EvaluationController expect header `X-User-Name`
- Gateway chỉ gửi header `X-Username`
- Header mismatch → Backend không nhận được user info → Approve fail

## Root Cause

```java
// Gateway gửi:
.header("X-Username", claims.get("username", String.class))

// Backend expect:
@RequestHeader(value = "X-User-Name", required = false) String userName
```

## Giải Pháp

Sửa Gateway để gửi cả 2 headers:

- `X-User-Name` (cho backend mới)
- `X-Username` (backward compatibility)

### Code Change

```java
// backend/gateway/src/main/java/ptit/drl/gateway/filter/JwtAuthenticationFilter.java
ServerHttpRequest modifiedRequest = request.mutate()
    .header("X-User-Id", claims.getSubject())
    .header("X-User-Name", claims.get("username", String.class))  // ← Added
    .header("X-Username", claims.get("username", String.class))   // ← Keep for compatibility
    .header("X-Roles", String.join(",", (List<String>) claims.get("roles")))
    .header("X-Permissions", String.join(",", (List<String>) claims.get("permissions")))
    .build();
```

## Deployment

```powershell
# Rebuild gateway
docker-compose -f infra/docker-compose.yml build gateway

# Restart gateway
docker-compose -f infra/docker-compose.yml up -d gateway
```

## Test

### 1. Login as Admin

```
Navigate to: http://localhost:3000
Login with admin credentials
```

### 2. Test Approve Flow

1. Vào trang "Duyệt Đánh giá"
2. Click vào một phiếu đánh giá pending
3. Click "Duyệt"
4. Nhập comment (optional)
5. Confirm

**Expected:** Phiếu được duyệt thành công

### 3. Test Reject Flow

1. Click vào phiếu khác
2. Click "Từ chối"
3. Nhập lý do
4. Confirm

**Expected:** Phiếu bị từ chối thành công

### 4. Verify Headers

Check backend logs để verify headers:

```powershell
docker logs drl-evaluation-service --tail 50
```

Should see:

- X-User-Id: [user_id]
- X-User-Name: [username]
- X-Roles: ADMIN

## Files Modified

- `backend/gateway/src/main/java/ptit/drl/gateway/filter/JwtAuthenticationFilter.java`

## Status

✅ Complete - Gateway rebuilt and restarted
✅ Ready for Testing

## Notes

- Reject vẫn hoạt động vì nó có validation `@Valid @RequestBody` nên không phụ thuộc vào headers
- Approve cần user info để log history nên cần headers
- Giữ cả 2 headers để backward compatibility với code cũ

---

**Time:** ~5 phút
**Impact:** Approve evaluation giờ hoạt động bình thường
