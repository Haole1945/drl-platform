# Eureka Service Discovery Setup

## Overview
Setting up Netflix Eureka Server for service discovery in the microservices architecture. This will allow services to discover each other dynamically instead of using hardcoded URLs.

## Architecture

```
┌─────────────────┐
│  Eureka Server  │ (Port 8761)
│   (Discovery)   │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────────┐
    │         │          │              │
┌───▼───┐ ┌──▼───┐ ┌────▼────┐ ┌───────▼────┐
│Gateway│ │Auth  │ │Student  │ │Evaluation │
│ :8080 │ │:8082 │ │ :8081   │ │  :8083    │
└───────┘ └──────┘ └─────────┘ └───────────┘
```

## Services to Register

1. **eureka-server** - Service discovery server (port 8761)
2. **gateway** - API Gateway (port 8080)
3. **auth-service** - Authentication service (port 8082)
4. **student-service** - Student management (port 8081)
5. **evaluation-service** - Evaluation management (port 8083)

## Implementation Steps

1. Create eureka-server service
2. Configure all services to register with Eureka
3. Update Gateway to use service discovery
4. Update docker-compose.yml
5. Test service discovery

