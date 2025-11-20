# Actuator /info Endpoint Timeout Fix

## Issue
The `/actuator/info` endpoint is taking too long to respond or timing out.

## Root Cause
The `/actuator/info` endpoint in Spring Boot Actuator can be slow if:
1. No info is configured in the application
2. It's trying to gather build information that's not available
3. The endpoint is waiting for external resources

## Solution

### Option 1: Use /health Instead (Recommended)
For health checks, use `/actuator/health` instead of `/actuator/info`:

```bash
# Fast and reliable
http://localhost:8080/actuator/health
http://localhost:8082/actuator/health
```

### Option 2: Configure Info Endpoint
I've updated the configuration to enable environment info:

**Gateway (`backend/gateway/src/main/resources/application.yml`):**
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: always
  info:
    env:
      enabled: true
```

**Auth Service (`backend/auth-service/src/main/resources/application.yml`):**
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: always
  info:
    env:
      enabled: true
```

### Option 3: Add Build Info (Optional)
To make `/info` more useful, add build information in `pom.xml`:

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
      <executions>
        <execution>
          <goals>
            <goal>build-info</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

Then configure in `application.yml`:
```yaml
management:
  info:
    build:
      enabled: true
```

## Quick Test

### Test Health Endpoint (Fast):
```powershell
# Gateway
Invoke-RestMethod -Uri "http://localhost:8080/actuator/health"

# Auth Service
Invoke-RestMethod -Uri "http://localhost:8082/actuator/health"
```

### Test Info Endpoint (May be slow):
```powershell
# Gateway
Invoke-RestMethod -Uri "http://localhost:8080/actuator/info" -TimeoutSec 10

# Auth Service
Invoke-RestMethod -Uri "http://localhost:8082/actuator/info" -TimeoutSec 10
```

## Why /info is Slow

1. **No Configuration**: If no info is configured, Spring Boot might try to gather it dynamically
2. **Build Info**: If build-info plugin is not configured, it might wait for unavailable resources
3. **Git Info**: If git-commit-id plugin is enabled, it might try to read git information
4. **Environment**: Gathering environment variables can take time

## Recommendation

**For Health Checks**: Always use `/actuator/health`
- Fast response
- Reliable
- Shows service status

**For Information**: Use `/actuator/info` only if you need build/version info
- Configure build-info plugin
- Add custom info in application.yml
- Or disable if not needed

## After Configuration Update

1. **Rebuild Services** (if you added build-info plugin):
   ```bash
   cd infra
   docker-compose build gateway auth-service
   docker-compose up -d gateway auth-service
   ```

2. **Test Again**:
   ```powershell
   # Should be fast now
   Invoke-RestMethod -Uri "http://localhost:8080/actuator/info"
   Invoke-RestMethod -Uri "http://localhost:8082/actuator/info"
   ```

## Alternative: Disable /info

If you don't need the `/info` endpoint, you can remove it:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health  # Remove 'info'
```

This will make the endpoint unavailable but improve overall performance.

