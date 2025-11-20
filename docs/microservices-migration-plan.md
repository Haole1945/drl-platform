# Microservices Migration Plan

**Date:** November 17, 2024  
**Status:** In Progress

---

## 🎯 Goal

Tách `student-service` (monolithic) thành **3 microservices độc lập**:
1. **auth-service** - Authentication & Authorization
2. **evaluation-service** - Evaluation workflow & Rubrics
3. **student-service** - Student & Training Point management

---

## 📋 Migration Steps

### Step 1: Create Service Structures ✅
- [x] Create `auth-service` directory
- [x] Create `evaluation-service` directory
- [x] Create base Spring Boot projects
- [x] Create Dockerfiles
- [x] Create application.yml files

### Step 2: Move Auth Domain → auth-service
- [ ] Copy User entity
- [ ] Copy Role entity
- [ ] Copy Permission entity
- [ ] Copy UserRepository, RoleRepository, PermissionRepository
- [ ] Create AuthService (login, register, token generation)
- [ ] Create AuthController
- [ ] Create JWT utility classes
- [ ] Create SecurityConfig
- [ ] Create DTOs (RegisterRequest, LoginRequest, AuthResponse)
- [ ] Create DataSeeder for auth data

### Step 3: Move Evaluation Domain → evaluation-service
- [ ] Copy Evaluation entity
- [ ] Copy EvaluationDetail entity
- [ ] Copy EvaluationHistory entity
- [ ] Copy EvaluationStatus enum
- [ ] Copy Rubric entity
- [ ] Copy Criteria entity
- [ ] Copy all Evaluation repositories
- [ ] Copy EvaluationService, RubricService, CriteriaService
- [ ] Copy EvaluationController, RubricController, CriteriaController
- [ ] Copy EvaluationMapper, RubricMapper
- [ ] Copy Evaluation DTOs
- [ ] Copy InvalidStateTransitionException

### Step 4: Refactor student-service
- [ ] Remove User, Role, Permission entities
- [ ] Remove Evaluation, Rubric, Criteria entities
- [ ] Remove Evaluation services and controllers
- [ ] Keep only: Student, TrainingPoint, Faculty, Major, StudentClass
- [ ] Update DataSeeder (remove auth and evaluation seeding)
- [ ] Update dependencies (remove JWT if not needed)

### Step 5: Update Gateway Routes
- [ ] Add route for `/api/auth/**` → `auth-service:8082`
- [ ] Add route for `/api/evaluations/**` → `evaluation-service:8083`
- [ ] Add route for `/api/rubrics/**` → `evaluation-service:8083`
- [ ] Add route for `/api/criteria/**` → `evaluation-service:8083`
- [ ] Keep `/api/students/**` → `student-service:8081`
- [ ] Keep `/api/training-points/**` → `student-service:8081`

### Step 6: Update Docker Compose
- [ ] Add `auth-service` service
- [ ] Add `evaluation-service` service
- [ ] Update service dependencies
- [ ] Update network configuration

### Step 7: Handle Inter-Service Communication
- [ ] Evaluation service needs Student data → Call student-service via Gateway
- [ ] Auth service needs Student data (for registration) → Call student-service
- [ ] Setup Feign Client or RestTemplate for service-to-service calls

### Step 8: Database Strategy
**Option A: Shared Database (Start)**
- All services use same PostgreSQL database
- Each service only accesses its own tables
- Simpler to start

**Option B: Database per Service (Future)**
- Each service has its own database
- Requires data synchronization
- True microservices independence

**Current Choice:** Option A (shared database)

### Step 9: Testing
- [ ] Test auth-service independently
- [ ] Test evaluation-service independently
- [ ] Test student-service independently
- [ ] Test inter-service communication
- [ ] Test end-to-end flows through Gateway

---

## 📦 Files to Move

### auth-service (from student-service)
```
entity/
  ├── User.java
  ├── Role.java
  ├── Permission.java
  └── BaseEntity.java

repository/
  ├── UserRepository.java
  ├── RoleRepository.java
  └── PermissionRepository.java

config/
  ├── SecurityConfig.java (enhanced)
  └── DataSeeder.java (auth part only)

service/
  └── AuthService.java (new)

api/
  └── AuthController.java (new)

dto/
  ├── RegisterRequest.java (new)
  ├── LoginRequest.java (new)
  ├── AuthResponse.java (new)
  ├── RefreshTokenRequest.java (new)
  └── UserDTO.java (new)

util/
  ├── JwtTokenProvider.java (new)
  └── JwtTokenValidator.java (new)
```

### evaluation-service (from student-service)
```
entity/
  ├── Evaluation.java
  ├── EvaluationDetail.java
  ├── EvaluationDetailId.java
  ├── EvaluationHistory.java
  ├── EvaluationStatus.java
  ├── Rubric.java
  └── Criteria.java

repository/
  ├── EvaluationRepository.java
  ├── EvaluationDetailRepository.java
  ├── EvaluationHistoryRepository.java
  ├── RubricRepository.java
  └── CriteriaRepository.java

service/
  ├── EvaluationService.java
  ├── RubricService.java
  └── CriteriaService.java

api/
  ├── EvaluationController.java
  ├── RubricController.java
  └── CriteriaController.java

mapper/
  ├── EvaluationMapper.java
  └── RubricMapper.java

dto/
  ├── EvaluationDTO.java
  ├── EvaluationDetailDTO.java
  ├── EvaluationHistoryDTO.java
  ├── CreateEvaluationRequest.java
  ├── UpdateEvaluationRequest.java
  ├── ApprovalRequest.java
  ├── RejectionRequest.java
  ├── ResubmitEvaluationRequest.java
  ├── CreateEvaluationDetailRequest.java
  ├── RubricDTO.java
  └── CriteriaDTO.java

exception/
  └── InvalidStateTransitionException.java
```

### student-service (keep only)
```
entity/
  ├── Student.java
  ├── TrainingPoint.java
  ├── Faculty.java
  ├── Major.java
  └── StudentClass.java

repository/
  ├── StudentRepository.java
  ├── TrainingPointRepository.java
  ├── FacultyRepository.java
  ├── MajorRepository.java
  └── StudentClassRepository.java

service/
  ├── StudentService.java
  └── TrainingPointService.java

api/
  ├── StudentController.java
  └── TrainingPointController.java

mapper/
  ├── StudentMapper.java
  └── TrainingPointMapper.java

dto/
  ├── StudentDTO.java
  ├── CreateStudentRequest.java
  ├── UpdateStudentRequest.java
  ├── TrainingPointDTO.java
  ├── CreateTrainingPointRequest.java
  └── UpdateTrainingPointRequest.java
```

---

## 🔄 Inter-Service Dependencies

### evaluation-service → student-service
- **Need:** Student information when creating/retrieving evaluations
- **Solution:** Call `GET /api/students/{code}` via Gateway
- **Implementation:** Feign Client or RestTemplate

### auth-service → student-service
- **Need:** Student information when registering user with studentCode
- **Solution:** Call `GET /api/students/{code}` via Gateway
- **Implementation:** Feign Client or RestTemplate

---

## 🚀 Execution Order

1. **Phase 1:** Create auth-service structure ✅
2. **Phase 2:** Move auth domain code → auth-service
3. **Phase 3:** Test auth-service independently
4. **Phase 4:** Create evaluation-service structure
5. **Phase 5:** Move evaluation domain code → evaluation-service
6. **Phase 6:** Test evaluation-service independently
7. **Phase 7:** Refactor student-service (remove moved code)
8. **Phase 8:** Update Gateway routes
9. **Phase 9:** Update Docker Compose
10. **Phase 10:** Setup inter-service communication
11. **Phase 11:** End-to-end testing

---

## ⚠️ Challenges & Solutions

### Challenge 1: Database Access
**Problem:** Multiple services accessing same database  
**Solution:** Use shared database initially, migrate to database-per-service later

### Challenge 2: Transaction Management
**Problem:** Cross-service transactions  
**Solution:** Use eventual consistency, saga pattern for complex flows

### Challenge 3: Service Discovery
**Problem:** Services need to find each other  
**Solution:** Use Gateway as service registry, or add Eureka/Consul later

### Challenge 4: Data Consistency
**Problem:** Data split across services  
**Solution:** Use API calls between services, cache frequently accessed data

---

## 📊 Progress Tracking

- [x] Documentation created
- [x] Service structures created
- [ ] Auth domain migrated
- [ ] Evaluation domain migrated
- [ ] Student service refactored
- [ ] Gateway updated
- [ ] Docker Compose updated
- [ ] Inter-service communication setup
- [ ] Testing completed

---

**Last Updated:** November 17, 2024  
**Next Step:** Move User, Role, Permission entities to auth-service

