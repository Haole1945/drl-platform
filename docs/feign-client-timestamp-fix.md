# Feign Client Timestamp Field Fix

## Issue
When auth-service calls student-service via Feign client, it fails with:
```
Unrecognized field "timestamp" (class ptit.drl.auth.client.StudentServiceClient$StudentResponse), 
not marked as ignorable
```

## Root Cause
The `ApiResponse` class in student-service includes a `timestamp` field (and `errors` field), but the `StudentResponse` class in the Feign clients (auth-service and evaluation-service) didn't have these fields. When Jackson tries to deserialize the JSON response, it fails because it encounters unknown properties.

## Fix Applied

### 1. Updated StudentResponse Classes
Added missing fields to match the `ApiResponse` structure:

**Added Fields:**
- `timestamp` (LocalDateTime)
- `errors` (List<String>)

**Added Annotation:**
- `@JsonIgnoreProperties(ignoreUnknown = true)` - This ensures that if student-service adds more fields in the future, the Feign clients won't break.

### 2. Files Updated
- `backend/auth-service/src/main/java/ptit/drl/auth/client/StudentServiceClient.java`
- `backend/evaluation-service/src/main/java/ptit/drl/evaluation/client/StudentServiceClient.java`

### 3. Changes Made
```java
@JsonIgnoreProperties(ignoreUnknown = true)
class StudentResponse {
    private boolean success;
    private String message;
    private StudentDTO data;
    private List<String> errors;        // ✅ Added
    private LocalDateTime timestamp;   // ✅ Added
    
    // Added getters and setters for new fields
}
```

## Next Steps

1. **Rebuild Services:**
   ```bash
   cd infra
   docker-compose build auth-service evaluation-service
   docker-compose up -d auth-service evaluation-service
   ```

2. **Wait for Services to Start:**
   Wait 30-60 seconds for services to fully start and register with Eureka.

3. **Test Again:**
   ```powershell
   # Test direct access
   .\test-auth-direct.ps1
   
   # Or test via Gateway
   .\test-auth-service.ps1
   ```

## Expected Behavior After Fix

✅ **Before Fix:**
- Registration fails with JSON deserialization error
- Error: "Unrecognized field 'timestamp'"

✅ **After Fix:**
- Registration succeeds
- Feign client correctly deserializes the response
- Student validation works properly

## Why This Happened

The `ApiResponse` class in student-service was updated to include `timestamp` and `errors` fields, but the Feign client response classes weren't updated to match. This is a common issue when using Feign clients - the response DTOs must match the actual API response structure.

## Prevention

To prevent this in the future:
1. ✅ Added `@JsonIgnoreProperties(ignoreUnknown = true)` - ignores unknown fields
2. ✅ Keep Feign client response classes in sync with API responses
3. ✅ Consider using shared DTOs between services (if using a shared library)

## Testing

After rebuilding, test the registration:

```powershell
$body = @{
    username = "testuser_$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
    password = "Test123456"
    fullName = "Test User"
    studentCode = "N21DCCN001"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8082/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

This should now work without the JSON deserialization error!

