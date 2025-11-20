# Gateway Service Discovery Fix

## Issue
Gateway returning "No servers available for service: auth-service" and "Request method 'GET' is not supported" errors.

## Root Cause
1. Gateway cannot discover auth-service from Eureka
2. Discovery locator configuration was causing conflicts
3. Service might not be properly registered with Eureka

## Fix Applied

### 1. Removed Discovery Locator Configuration
The discovery locator was causing routing conflicts. Removed it from Gateway configuration.

**Before:**
```yaml
gateway:
  server:
    webflux:
      discovery:
        locator:
          enabled: true
          lower-case-service-id: true
  routes:
    ...
```

**After:**
```yaml
gateway:
  routes:
    ...
```

### 2. Verify Eureka Registration

Check if services are registered in Eureka:
1. Open Eureka Dashboard: http://localhost:8761
2. Look for services:
   - `AUTH-SERVICE` (or `auth-service`)
   - `GATEWAY`
   - `STUDENT-SERVICE`
   - `EVALUATION-SERVICE`

### 3. Check Service Logs

**Auth Service:**
```bash
docker logs drl-auth-service | grep -i eureka
```

Look for:
- "Registered with Eureka"
- "DiscoveryClient" messages
- Any registration errors

**Gateway:**
```bash
docker logs drl-gateway | grep -i eureka
```

Look for:
- Service discovery messages
- "No servers available" warnings

## Troubleshooting Steps

### Step 1: Verify Services are Running
```bash
docker-compose ps
```

All services should show "Up" and "healthy" status.

### Step 2: Check Eureka Dashboard
1. Open: http://localhost:8761
2. Verify all services appear in the list
3. Check service status (should be "UP")

### Step 3: Restart Services
If services are not registered:
```bash
cd infra
docker-compose restart auth-service gateway
```

Wait 30 seconds for services to register.

### Step 4: Check Network Connectivity
```bash
# From Gateway container
docker exec drl-gateway ping drl-auth-service

# From Auth Service container
docker exec drl-auth-service ping drl-eureka-server
```

### Step 5: Verify Eureka Configuration
Check `application.yml` in auth-service:
```yaml
eureka:
  client:
    service-url:
      defaultZone: http://eureka-server:8761/eureka/
  instance:
    prefer-ip-address: true
```

## Expected Behavior After Fix

1. **Gateway discovers auth-service:**
   - No more "No servers available" warnings
   - Services appear in Gateway logs

2. **POST requests work:**
   - `/api/auth/register` accepts POST requests
   - No more "GET method not supported" errors

3. **Service routing works:**
   - Gateway routes requests to auth-service
   - Responses come back successfully

## Next Steps

1. **Rebuild Gateway:**
   ```bash
   cd infra
   docker-compose build gateway
   docker-compose up -d gateway
   ```

2. **Wait for Service Discovery:**
   Wait 30-60 seconds for services to register with Eureka.

3. **Check Eureka Dashboard:**
   Verify all services are registered.

4. **Test Again:**
   ```powershell
   .\test-auth-service.ps1
   ```

## Alternative: Use Direct Service Access

If Gateway routing still doesn't work, you can test services directly:

```powershell
# Test auth-service directly (bypass Gateway)
$body = @{
    username = "testuser"
    email = "test@test.com"
    password = "Test123456"
    fullName = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8082/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

If this works, the issue is with Gateway routing, not auth-service.

