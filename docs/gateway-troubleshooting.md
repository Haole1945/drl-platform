# Gateway 404 Troubleshooting Guide

## Current Issue
Gateway returning 404 for `/api/auth/register` endpoint.

## Fix Applied
Updated RewritePath filter syntax to use short form with escaped `$`:
```yaml
- RewritePath=/api/(?<segment>.*), /$\{segment}
```

## Steps to Fix

### 1. Rebuild Gateway Service
```bash
cd infra
docker-compose build gateway
docker-compose up -d gateway
```

### 2. Wait for Service Discovery
Wait 15-30 seconds for Gateway to discover services from Eureka.

### 3. Verify Services are Running
```bash
docker-compose ps
```

All services should show "Up" status.

### 4. Check Eureka Dashboard
Open: http://localhost:8761

Verify:
- ✅ `auth-service` is registered
- ✅ `gateway` is registered  
- ✅ `student-service` is registered
- ✅ `evaluation-service` is registered

### 5. Test Direct Service Access (Bypass Gateway)
```powershell
# Test auth-service directly
$body = @{
    username = "testdirect"
    email = "testdirect@test.com"
    password = "Test123456"
    fullName = "Test Direct"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8082/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

If this works, the issue is with Gateway routing, not auth-service.

### 6. Check Gateway Logs
```bash
docker logs drl-gateway --tail 50
```

Look for:
- Service discovery messages
- Route configuration errors
- Connection errors to auth-service

### 7. Check Auth Service Logs
```bash
docker logs drl-auth-service --tail 50
```

Look for:
- Registration with Eureka
- Incoming requests
- Errors

### 8. Test Gateway Routes
```powershell
# Test if Gateway can reach auth-service
Invoke-RestMethod -Uri "http://localhost:8080/actuator/gateway/routes" -ErrorAction SilentlyContinue
```

### 9. Alternative: Use Discovery Locator
If explicit routes don't work, try using the discovery locator:

**Access via discovery locator:**
```
http://localhost:8080/api/auth-service/auth/register
```

The discovery locator is already enabled in the configuration.

## Common Issues

### Issue 1: Gateway Not Discovering Services
**Symptoms:** 404 errors, services not in Eureka dashboard

**Solution:**
1. Check Eureka server is running: `docker logs drl-eureka-server`
2. Check service registration in Eureka dashboard
3. Restart services: `docker-compose restart`

### Issue 2: RewritePath Not Working
**Symptoms:** 404 errors, but direct service access works

**Solution:**
1. Verify RewritePath syntax is correct
2. Check Gateway logs for filter errors
3. Try using discovery locator instead

### Issue 3: Network Issues
**Symptoms:** Connection refused, timeout errors

**Solution:**
1. Verify all services are on the same Docker network: `drl-net`
2. Check docker-compose.yml network configuration
3. Test connectivity: `docker exec drl-gateway ping drl-auth-service`

### Issue 4: JWT Filter Blocking Requests
**Symptoms:** 401 Unauthorized instead of 404

**Solution:**
1. Verify `/api/auth/register` is in public endpoints list
2. Check JwtAuthenticationFilter order
3. Review Gateway filter logs

## Expected Behavior

After fix:
- ✅ `POST /api/auth/register` → 201 Created
- ✅ `POST /api/auth/login` → 200 OK with tokens
- ✅ `GET /api/auth/me` → 200 OK (with JWT token)
- ✅ `POST /api/auth/refresh` → 200 OK with new token

## Next Steps

1. Rebuild Gateway: `docker-compose build gateway && docker-compose up -d gateway`
2. Wait 30 seconds for service discovery
3. Re-run test: `.\test-auth-service.ps1`
4. If still failing, check logs and Eureka dashboard

