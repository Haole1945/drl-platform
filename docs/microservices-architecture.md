# Microservices Architecture - DRL Platform

**Version:** 1.0  
**Date:** November 17, 2024  
**Status:** Refactoring in Progress

---

## 📋 Overview

DRL Platform được tách thành **4 microservices** độc lập, mỗi service quản lý một domain riêng biệt.

---

## 🏗️ Service Architecture

### 1. **Gateway Service** (Port 8080)
- **Technology:** Spring Cloud Gateway
- **Purpose:** API Gateway, routing, load balancing
- **Location:** `backend/gateway/`
- **Status:** ✅ Complete

**Responsibilities:**
- Route requests to appropriate services
- Load balancing
- CORS handling
- Request/Response transformation

---

### 2. **Auth Service** (Port 8082)
- **Technology:** Spring Boot 3.5.6, Spring Security, JWT
- **Purpose:** Authentication & Authorization
- **Location:** `backend/auth-service/`
- **Status:** ⏳ In Progress

**Domain:**
- User management
- Role & Permission management
- JWT token generation & validation
- Authentication endpoints (login, register, refresh)

**Database Tables:**
- `users`
- `roles`
- `permissions`
- `user_roles` (join table)
- `role_permissions` (join table)

**Endpoints:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

---

### 3. **Student Service** (Port 8081)
- **Technology:** Spring Boot 3.5.6, Spring Data JPA
- **Purpose:** Student & Training Point management
- **Location:** `backend/student-service/`
- **Status:** ⏳ Refactoring (removing Evaluation, Rubric, Criteria)

**Domain:**
- Student management
- Training Point management
- Faculty, Major, Class management

**Database Tables:**
- `students`
- `training_points`
- `faculties`
- `majors`
- `student_classes`

**Endpoints:**
- `GET /api/students`
- `GET /api/students/{code}`
- `POST /api/students`
- `PUT /api/students/{code}`
- `DELETE /api/students/{code}`
- `GET /api/training-points`
- `GET /api/training-points/{id}`
- `POST /api/training-points`
- `PUT /api/training-points/{id}`
- `DELETE /api/training-points/{id}`

---

### 4. **Evaluation Service** (Port 8083)
- **Technology:** Spring Boot 3.5.6, Spring Data JPA
- **Purpose:** Evaluation workflow & Rubric management
- **Location:** `backend/evaluation-service/`
- **Status:** ⏳ In Progress

**Domain:**
- Evaluation management
- Evaluation workflow (Submit, Approve, Reject, Resubmit)
- Rubric & Criteria management
- Evaluation history tracking

**Database Tables:**
- `evaluations`
- `evaluation_details`
- `evaluation_history`
- `rubrics`
- `criteria`

**Endpoints:**
- `GET /api/evaluations`
- `GET /api/evaluations/{id}`
- `GET /api/evaluations/student/{code}`
- `GET /api/evaluations/pending`
- `POST /api/evaluations`
- `PUT /api/evaluations/{id}`
- `POST /api/evaluations/{id}/submit`
- `POST /api/evaluations/{id}/approve`
- `POST /api/evaluations/{id}/reject`
- `POST /api/evaluations/{id}/resubmit`
- `GET /api/rubrics`
- `GET /api/rubrics/{id}`
- `POST /api/rubrics`
- `PUT /api/rubrics/{id}`
- `GET /api/criteria`
- `POST /api/criteria`
- `PUT /api/criteria/{id}`

---

## 🔄 Inter-Service Communication

### Service Discovery
- **Technology:** Spring Cloud Eureka (or Consul)
- **Purpose:** Service registration and discovery
- **Port:** 8761 (Eureka Server)

### Communication Patterns

**1. Synchronous (REST):**
- Gateway → Services (HTTP/REST)
- Service → Service (via Gateway or direct)

**2. Asynchronous (Future):**
- Event-driven communication (RabbitMQ/Kafka)
- For notifications, audit logs

---

## 🗄️ Database Strategy

### Option 1: Shared Database (Current)
- All services share one PostgreSQL database
- **Pros:** Simple, no data consistency issues
- **Cons:** Tight coupling, violates microservices principle

### Option 2: Database per Service (Recommended)
- Each service has its own database
- **Pros:** True independence, can use different DB types
- **Cons:** Data consistency challenges, distributed transactions

**Current Approach:** Start with shared database, migrate to database-per-service later.

---

## 📦 Service Dependencies

```
Gateway (8080)
    ├──→ Auth Service (8082) - Authentication
    ├──→ Student Service (8081) - Student data
    └──→ Evaluation Service (8083) - Evaluations

Evaluation Service (8083)
    └──→ Student Service (8081) - Get student info (via Gateway or direct)

Auth Service (8082)
    └──→ (No dependencies - standalone)
```

---

## 🐳 Docker Architecture

```yaml
services:
  postgres:          # Shared database
  eureka-server:     # Service discovery (future)
  gateway:           # API Gateway
  auth-service:      # Authentication
  student-service:   # Student management
  evaluation-service:# Evaluation workflow
  frontend:          # Next.js app
```

---

## 🔐 Security Flow

1. **Client** → `POST /api/auth/login` → **Auth Service**
2. **Auth Service** → Returns JWT tokens
3. **Client** → `GET /api/students` with `Authorization: Bearer {token}` → **Gateway**
4. **Gateway** → Validates token with **Auth Service** (or validates locally)
5. **Gateway** → Routes to **Student Service** with user context
6. **Student Service** → Processes request, returns data

---

## 📊 Service Ports

| Service | Port | Health Check |
|---------|------|--------------|
| Gateway | 8080 | `/actuator/health` |
| Student Service | 8081 | `/actuator/health` |
| Auth Service | 8082 | `/actuator/health` |
| Evaluation Service | 8083 | `/actuator/health` |
| Eureka Server | 8761 | `/actuator/health` |
| PostgreSQL | 5432 | - |
| Frontend | 3000 | - |

---

## 🚀 Migration Plan

### Phase 1: Create New Services ✅
- [x] Create `auth-service` structure
- [x] Create `evaluation-service` structure
- [ ] Setup base Spring Boot projects

### Phase 2: Move Code
- [ ] Move User, Role, Permission → `auth-service`
- [ ] Move Evaluation, Rubric, Criteria → `evaluation-service`
- [ ] Keep Student, TrainingPoint in `student-service`

### Phase 3: Setup Service Discovery
- [ ] Create Eureka Server
- [ ] Register all services with Eureka
- [ ] Update Gateway to use service discovery

### Phase 4: Update Gateway Routes
- [ ] Add routes for `auth-service`
- [ ] Add routes for `evaluation-service`
- [ ] Update existing `student-service` routes

### Phase 5: Update Docker Compose
- [ ] Add `auth-service` to docker-compose
- [ ] Add `evaluation-service` to docker-compose
- [ ] Add Eureka Server (optional)

### Phase 6: Inter-Service Communication
- [ ] Setup Feign Client or RestTemplate
- [ ] Handle service-to-service calls
- [ ] Add circuit breakers (Resilience4j)

### Phase 7: Testing
- [ ] Test each service independently
- [ ] Test inter-service communication
- [ ] Test end-to-end flows

---

## 📝 Notes

### Current State
- All code is in `student-service` (monolithic structure)
- Need to extract and reorganize into separate services
- Database is shared (will migrate to database-per-service later)

### Challenges
1. **Data Consistency:** When services need data from each other
2. **Transaction Management:** Distributed transactions
3. **Service Discovery:** Need Eureka or Consul
4. **Configuration:** Each service needs its own config

### Benefits After Migration
- ✅ Independent deployment
- ✅ Independent scaling
- ✅ Technology flexibility
- ✅ Team autonomy
- ✅ Fault isolation

---

**Last Updated:** November 17, 2024  
**Status:** Migration in Progress

