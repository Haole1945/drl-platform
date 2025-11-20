# Gateway 404 Error Fix for Auth Service

## Issue
Gateway returning 404 when accessing `/api/auth/register` endpoint.

## Root Cause
The RewritePath filter syntax in Spring Cloud Gateway 2025.0.0 may require the explicit format with `name` and `args` instead of the short form.

## Fix Applied

### Changed RewritePath Filter Syntax

**Before (Short Form):**
```yaml
filters:
  - RewritePath=/api/(?<segment>.*), /${segment}
```

**After (Explicit Form):**
```yaml
filters:
  - name: RewritePath
    args:
      regexp: /api/(?<segment>.*)
      replacement: /${segment}
```

## Files Modified
- `backend/gateway/src/main/resources/application.yml`

## How It Works

1. Client calls: `POST http://localhost:8080/api/auth/register`
2. Gateway matches route: `Path=/api/auth/**`
3. RewritePath filter rewrites: `/api/auth/register` → `/auth/register`
4. Gateway forwards to: `lb://auth-service/auth/register`
5. Auth-service receives: `POST /auth/register`

## Next Steps

1. **Rebuild Gateway Service:**
   ```bash
   cd infra
   docker-compose build gateway
   docker-compose up -d gateway
   ```

2. **Verify Services are Running:**
   ```bash
   docker-compose ps
   ```

3. **Check Eureka Dashboard:**
   - Open: http://localhost:8761
   - Verify `auth-service` is registered
   - Verify `gateway` is registered

4. **Test the Endpoint:**
   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "Test123456",
       "fullName": "Test User"
     }'
   ```

5. **Re-run Test Script:**
   ```powershell
   .\test-auth-service.ps1
   ```

## Troubleshooting

### If 404 persists:

1. **Check Gateway Logs:**
   ```bash
   docker logs drl-gateway
   ```

2. **Check Auth Service Logs:**
   ```bash
   docker logs drl-auth-service
   ```

3. **Verify Service Discovery:**
   - Check Eureka dashboard at http://localhost:8761
   - Ensure `auth-service` appears in the list
   - Check that the service status is "UP"

4. **Test Direct Service Access:**
   ```bash
   # Test auth-service directly (bypass Gateway)
   curl -X POST http://localhost:8082/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","email":"test@test.com","password":"Test123","fullName":"Test"}'
   ```

5. **Check Gateway Routes:**
   ```bash
   # View Gateway routes (if actuator is enabled)
   curl http://localhost:8080/actuator/gateway/routes
   ```

## Alternative: Use Discovery Locator

If the explicit route doesn't work, you can also rely on the discovery locator which is already enabled:

```yaml
spring:
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
          lower-case-service-id: true
```

This allows accessing services via: `http://localhost:8080/api/auth-service/auth/register`

But the explicit route configuration is preferred for better control.

## Expected Behavior After Fix

- ✅ `/api/auth/register` → routes to `auth-service` → `/auth/register`
- ✅ `/api/auth/login` → routes to `auth-service` → `/auth/login`
- ✅ `/api/auth/refresh` → routes to `auth-service` → `/auth/refresh`
- ✅ `/api/auth/me` → routes to `auth-service` → `/auth/me` (requires JWT)
- ✅ `/api/auth/logout` → routes to `auth-service` → `/auth/logout`

