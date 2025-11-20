# Inter-Service Communication Implementation

## Overview
Implemented inter-service communication using Spring Cloud OpenFeign for service-to-service calls via Eureka service discovery.

## Architecture

```
┌─────────────────┐
│  Eureka Server  │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────────┐
    │         │          │              │
┌───▼───┐ ┌──▼───┐ ┌────▼────┐ ┌───────▼────┐
│Gateway│ │Auth  │ │Student  │ │Evaluation  │
│ :8080 │ │:8082 │ │ :8081   │ │  :8083     │
└───────┘ └──┬───┘ └────┬────┘ └──────┬─────┘
             │          │              │
             │          │              │
             └──────────┴──────────────┘
                    Feign Clients
```

## Implemented Communication

### 1. evaluation-service → student-service ✅
- **Purpose**: Validate student exists when creating/retrieving evaluations
- **Feign Client**: `StudentServiceClient`
- **Endpoint Used**: `GET /students/{studentCode}`
- **Location**: `backend/evaluation-service/src/main/java/ptit/drl/evaluation/client/`

**Usage:**
- `createEvaluation()` - Validates student before creating evaluation
- `getEvaluationsByStudent()` - Validates student before retrieving evaluations

### 2. auth-service → student-service ✅
- **Purpose**: Validate studentCode when registering user
- **Feign Client**: `StudentServiceClient`
- **Endpoint Used**: `GET /students/{studentCode}`
- **Location**: `backend/auth-service/src/main/java/ptit/drl/auth/client/`

**Usage:**
- `register()` - Validates studentCode if provided during registration

## Implementation Details

### Feign Client Setup

#### 1. Add Dependency
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

#### 2. Enable Feign Clients
```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients  // Add this
public class ServiceApplication {
    // ...
}
```

#### 3. Create Feign Client Interface
```java
@FeignClient(name = "student-service", path = "/students")
public interface StudentServiceClient {
    @GetMapping("/{studentCode}")
    StudentResponse getStudentByCode(@PathVariable String studentCode);
}
```

#### 4. Error Handling
- Custom `FeignConfig` with `ErrorDecoder` to handle 404 errors
- Converts Feign exceptions to domain exceptions (`ResourceNotFoundException`)

## Benefits

1. **Declarative**: Define service calls as interfaces
2. **Service Discovery**: Automatically finds services via Eureka
3. **Load Balancing**: Feign integrates with Ribbon for load balancing
4. **Error Handling**: Custom error decoders for proper exception handling
5. **Type Safety**: Strongly typed DTOs for service responses

## Future Enhancements

- Add circuit breaker (Resilience4j) for fault tolerance
- Add request/response logging
- Add retry mechanism for transient failures
- Add timeout configuration
- Consider async communication for non-critical operations


