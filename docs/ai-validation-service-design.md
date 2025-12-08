# AI Validation Service - Thiết Kế Chi Tiết

## 1. Database Architecture

### ✅ Database Per Service
- **Database**: `drl_ai_validation`
- **Service**: `ai-validation-service`
- **Port**: `8084` (đề xuất)

---

## 2. Storage Options - Phân Tích Chi Tiết

### Option A: Thêm columns vào `evidence_files` (trong evaluation-service)

**Cấu trúc:**
```sql
ALTER TABLE evidence_files ADD COLUMN validation_status VARCHAR(20);
ALTER TABLE evidence_files ADD COLUMN ai_score DOUBLE PRECISION;
ALTER TABLE evidence_files ADD COLUMN ai_feedback TEXT;
ALTER TABLE evidence_files ADD COLUMN validation_confidence DOUBLE PRECISION;
ALTER TABLE evidence_files ADD COLUMN validated_at TIMESTAMP;
```

**Ưu điểm:**
- ✅ **Đơn giản**: Tất cả thông tin ở một chỗ
- ✅ **Query nhanh**: Không cần JOIN
- ✅ **Dễ hiển thị**: Frontend chỉ cần query 1 bảng
- ✅ **Ít thay đổi code**: Chỉ cần update entity

**Nhược điểm:**
- ❌ **Vi phạm microservices**: evaluation-service phụ thuộc vào ai-validation-service
- ❌ **Coupling**: Thay đổi validation logic → phải migrate evaluation-service DB
- ❌ **Khó scale**: Không thể scale validation service độc lập
- ❌ **Khó maintain**: Logic validation lẫn với business logic evaluation

---

### Option B: Tạo bảng riêng `evidence_validations` (trong ai-validation-service DB)

**Cấu trúc:**
```sql
CREATE TABLE evidence_validations (
    id BIGSERIAL PRIMARY KEY,
    evidence_file_id BIGINT NOT NULL,  -- Reference to evidence_files.id
    evaluation_id BIGINT,              -- Reference for quick lookup
    criteria_id BIGINT NOT NULL,
    validation_status VARCHAR(20) NOT NULL,  -- PENDING, VALIDATED, FAILED, SKIPPED
    ai_score DOUBLE PRECISION,
    ai_feedback TEXT,
    validation_confidence DOUBLE PRECISION,
    is_fake BOOLEAN,                   -- Phát hiện giả mạo
    is_relevant BOOLEAN,               -- Có phù hợp với criteria không
    validation_metadata JSONB,         -- Chi tiết từ AI (raw response)
    validated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_validation_evidence_file ON evidence_validations(evidence_file_id);
CREATE INDEX idx_validation_evaluation ON evidence_validations(evaluation_id);
CREATE INDEX idx_validation_status ON evidence_validations(validation_status);
```

**Ưu điểm:**
- ✅ **Microservices independence**: Mỗi service quản lý DB riêng
- ✅ **Tách biệt concerns**: Validation logic tách khỏi evaluation logic
- ✅ **Dễ scale**: Có thể scale validation service độc lập
- ✅ **Linh hoạt**: Có thể thêm nhiều metadata (JSONB)
- ✅ **Audit trail**: Lưu lịch sử validation
- ✅ **Không ảnh hưởng**: evaluation-service không cần thay đổi schema

**Nhược điểm:**
- ⚠️ **Cần JOIN**: Frontend phải query 2 bảng (hoặc API gateway aggregate)
- ⚠️ **Phức tạp hơn**: Cần sync data giữa 2 services
- ⚠️ **Network calls**: evaluation-service phải gọi ai-validation-service để lấy kết quả

---

### Option C: Chỉ lưu trong memory/cache (không lưu DB)

**Cấu trúc:**
- Sử dụng Redis hoặc in-memory cache
- Không lưu vào database

**Ưu điểm:**
- ✅ **Nhanh**: In-memory access
- ✅ **Đơn giản**: Không cần database migration

**Nhược điểm:**
- ❌ **Mất dữ liệu**: Server restart → mất hết validation results
- ❌ **Không audit**: Không có lịch sử validation
- ❌ **Không phù hợp**: Cần lưu lâu dài để admin review

---

## 🎯 KHUYẾN NGHỊ: Option B - Bảng riêng trong ai-validation-service

**Lý do:**
1. Tuân thủ microservices architecture
2. Tách biệt concerns rõ ràng
3. Dễ maintain và scale
4. Có thể mở rộng sau này (thêm nhiều AI providers)

---

## 3. Integration Methods - Phân Tích Chi Tiết

### Option A: REST API Call (HTTP)

**Cấu trúc:**
```java
// evaluation-service gọi ai-validation-service
@FeignClient(name = "ai-validation-service")
public interface AiValidationClient {
    @PostMapping("/api/validations/validate")
    ValidationResponse validateEvidence(@RequestBody ValidationRequest request);
}
```

**Ưu điểm:**
- ✅ **Đơn giản**: Dễ implement, dễ test
- ✅ **Synchronous**: Biết ngay kết quả
- ✅ **Standard**: REST API là chuẩn
- ✅ **Debug dễ**: Có thể test bằng Postman
- ✅ **Spring Cloud**: Tích hợp tốt với Eureka, Feign

**Nhược điểm:**
- ⚠️ **Blocking**: evaluation-service phải đợi validation xong
- ⚠️ **Timeout risk**: Nếu validation lâu → timeout
- ⚠️ **Tăng latency**: Thêm network hop
- ⚠️ **Tight coupling**: evaluation-service phụ thuộc vào ai-validation-service availability

**Khi nào dùng:**
- Validation nhanh (< 5 giây)
- Cần kết quả ngay
- Không có nhiều concurrent requests

---

### Option B: Message Queue (RabbitMQ/Kafka)

**Cấu trúc:**
```
evaluation-service → RabbitMQ → ai-validation-service
ai-validation-service → RabbitMQ → evaluation-service (callback)
```

**Ưu điểm:**
- ✅ **Async**: Không block evaluation-service
- ✅ **Decoupled**: Services không phụ thuộc trực tiếp
- ✅ **Scalable**: Có thể có nhiều workers xử lý validation
- ✅ **Reliable**: Message queue đảm bảo delivery
- ✅ **Retry**: Tự động retry nếu fail
- ✅ **Buffer**: Xử lý được traffic spike

**Nhược điểm:**
- ❌ **Phức tạp**: Cần setup message queue infrastructure
- ❌ **Thêm dependency**: RabbitMQ/Kafka
- ❌ **Debug khó**: Khó trace message flow
- ❌ **Eventual consistency**: Kết quả không có ngay

**Khi nào dùng:**
- Validation lâu (> 5 giây)
- Có nhiều concurrent requests
- Cần xử lý batch
- Cần high throughput

---

### Option C: Feign Client (Spring Cloud) - Synchronous REST

**Cấu trúc:**
```java
// Giống Option A nhưng dùng Feign Client
@FeignClient(name = "ai-validation-service", 
             url = "${ai-validation-service.url}")
public interface AiValidationClient {
    @PostMapping("/api/validations/validate")
    ValidationResponse validateEvidence(@RequestBody ValidationRequest request);
}
```

**Ưu điểm:**
- ✅ **Spring Cloud integration**: Tích hợp tốt với Eureka
- ✅ **Load balancing**: Tự động load balance
- ✅ **Circuit breaker**: Có thể dùng Hystrix/Resilience4j
- ✅ **Retry**: Tự động retry
- ✅ **Service discovery**: Tự động tìm service qua Eureka

**Nhược điểm:**
- ⚠️ **Blocking**: Vẫn là synchronous
- ⚠️ **Phụ thuộc Eureka**: Cần Eureka server running
- ⚠️ **Timeout**: Vẫn có risk timeout

**Khi nào dùng:**
- Đã có Spring Cloud setup
- Cần service discovery
- Cần load balancing
- Validation nhanh (< 5 giây)

---

## 🎯 KHUYẾN NGHỊ: Option C - Feign Client (với async processing)

**Lý do:**
1. Đã có Spring Cloud (Eureka) trong project
2. Có thể kết hợp với @Async để không block
3. Có circuit breaker để handle failures
4. Dễ implement và maintain

**Implementation:**
```java
// evaluation-service
@Async
public CompletableFuture<ValidationResult> validateEvidenceAsync(...) {
    ValidationResponse response = aiValidationClient.validateEvidence(request);
    return CompletableFuture.completedFuture(response);
}
```

---

## 4. Tóm Tắt Quyết Định

### ✅ Đã Quyết Định:

1. **Service riêng**: `ai-validation-service` với database riêng `drl_ai_validation`
2. **Timing**: Validation chạy khi submit evaluation (async)
3. **Storage**: Option B - Bảng riêng `evidence_validations` trong ai-validation-service
4. **Scoring**: Chỉ là gợi ý, admin quyết định cuối
5. **Context**: AI cần biết tất cả (criteria, sub-criteria, max_points)
6. **Error handling**: API fail → vẫn upload được, hiển thị "chưa validate"
7. **Coverage**: Validate tất cả files, tất cả file types
8. **Integration**: Feign Client với async processing

---

## 5. Database Schema - ai-validation-service

```sql
-- Database: drl_ai_validation

CREATE TABLE evidence_validations (
    id BIGSERIAL PRIMARY KEY,
    evidence_file_id BIGINT NOT NULL,  -- Reference to evidence_files.id (evaluation-service)
    evaluation_id BIGINT,              -- For quick lookup
    criteria_id BIGINT NOT NULL,
    sub_criteria_id VARCHAR(20),        -- Optional
    
    -- Validation Results
    validation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING, VALIDATING, VALIDATED, FAILED, SKIPPED
    
    -- AI Analysis
    ai_score DOUBLE PRECISION,          -- Điểm gợi ý từ AI (0 - max_points)
    ai_feedback TEXT,                  -- Feedback từ AI
    validation_confidence DOUBLE PRECISION,  -- 0.0 - 1.0
    
    -- Detection Results
    is_fake BOOLEAN,                   -- Phát hiện giả mạo
    is_relevant BOOLEAN,               -- Có phù hợp với criteria không
    fake_confidence DOUBLE PRECISION,  -- Confidence của fake detection
    relevance_score DOUBLE PRECISION,   -- 0.0 - 1.0
    
    -- Metadata
    validation_metadata JSONB,         -- Raw response từ OpenAI
    error_message TEXT,                -- Nếu validation fail
    validated_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_validation_evidence_file ON evidence_validations(evidence_file_id);
CREATE INDEX idx_validation_evaluation ON evidence_validations(evaluation_id);
CREATE INDEX idx_validation_status ON evidence_validations(validation_status);
CREATE INDEX idx_validation_criteria ON evidence_validations(criteria_id);
```

---

## 6. API Endpoints - ai-validation-service

### POST /api/validations/validate
**Request:**
```json
{
  "evidenceFileId": 123,
  "evaluationId": 456,
  "criteriaId": 789,
  "subCriteriaId": "1.1",
  "fileUrl": "/files/evidence/456/789/abc123.jpg",
  "fileType": "image/jpeg",
  "criteria": {
    "id": 789,
    "name": "Tham gia hoạt động đoàn thể",
    "description": "...",
    "maxPoints": 10.0,
    "subCriteria": [
      {
        "id": "1.1",
        "name": "Tham gia đầy đủ các buổi sinh hoạt",
        "maxPoints": 5.0
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "validationId": 1,
    "evidenceFileId": 123,
    "status": "VALIDATED",
    "aiScore": 8.5,
    "aiFeedback": "Hình ảnh rõ ràng, có logo đoàn thể, phù hợp với tiêu chí...",
    "confidence": 0.92,
    "isFake": false,
    "isRelevant": true,
    "fakeConfidence": 0.05,
    "relevanceScore": 0.95
  }
}
```

### GET /api/validations/evidence/{evidenceFileId}
Lấy kết quả validation cho một evidence file

### GET /api/validations/evaluation/{evaluationId}
Lấy tất cả validation results cho một evaluation

---

## 7. Workflow

```
1. Student uploads evidence files
   → evaluation-service saves to evidence_files table

2. Student submits evaluation
   → evaluation-service triggers validation (async)
   → evaluation-service calls ai-validation-service

3. ai-validation-service:
   - Fetches file from evaluation-service
   - Gets criteria details from evaluation-service
   - Calls OpenAI Vision API
   - Saves results to evidence_validations table
   - Returns validation result

4. Admin reviews evaluation
   → Frontend calls evaluation-service
   → evaluation-service aggregates:
      - evaluation_details (scores)
      - evidence_files (files)
      - evidence_validations (AI validation results)
   → Frontend displays all info including AI suggestions
```

---

## 8. Next Steps

1. ✅ Tạo `ai-validation-service` project
2. ✅ Setup database schema
3. ✅ Integrate OpenAI Vision API
4. ✅ Implement Feign Client trong evaluation-service
5. ✅ Add async processing
6. ✅ Update Gateway routes
7. ✅ Frontend integration

