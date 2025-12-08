# Hướng Dẫn Test AI Validation Feature

## 📍 Vị Trí Chức Năng

### 1. **Backend API Endpoints** (Đã có sẵn)

#### a) Validate Evidence File
```http
POST http://localhost:8080/api/validations/validate
Content-Type: application/json

{
  "evidenceFileId": 1,
  "evaluationId": 1,
  "criteriaId": 1,
  "subCriteriaId": "1.1",
  "fileUrl": "/files/evidence/1/1/filename.jpg",
  "fileType": "image/jpeg",
  "criteria": {
    "id": 1,
    "name": "Tiêu chí 1",
    "description": "Mô tả tiêu chí",
    "maxPoints": 10.0,
    "subCriteria": [
      {
        "id": "1.1",
        "name": "Sub-criteria 1.1",
        "description": "Mô tả",
        "maxPoints": 5.0
      }
    ]
  }
}
```

#### b) Get Validation Result by File ID
```http
GET http://localhost:8080/api/validations/evidence/{evidenceFileId}
```

#### c) Get All Validations for Evaluation
```http
GET http://localhost:8080/api/validations/evaluation/{evaluationId}
```

---

## 🔄 Workflow Tự Động

### Khi Submit Evaluation:

1. **Student submits evaluation** → `POST /api/evaluations/{id}/submit`
2. **EvaluationService** tự động trigger async validation:
   ```java
   evidenceValidationService.validateEvaluationEvidenceAsync(updated);
   ```
3. **EvidenceValidationService** (async):
   - Lấy tất cả evidence files của evaluation
   - Với mỗi file:
     - Parse criteria và sub-criteria
     - Gọi `ai-validation-service` via Feign Client
4. **ai-validation-service**:
   - Gọi OpenAI Vision API
   - Lưu kết quả vào `evidence_validations` table
   - Trả về `ValidationResponse`

---

## 🧪 Cách Test

### Test 1: Test Manual Validation API

**Bước 1:** Tạo evaluation và upload file
```bash
# 1. Tạo evaluation
POST http://localhost:8080/api/evaluations
# Lưu evaluationId

# 2. Upload evidence file
POST http://localhost:8080/api/files/upload
# Lưu evidenceFileId
```

**Bước 2:** Test validation API
```bash
# Lấy criteria info
GET http://localhost:8080/api/criteria/{criteriaId}

# Gọi validation API
POST http://localhost:8080/api/validations/validate
# Body như ví dụ trên
```

**Bước 3:** Xem kết quả
```bash
# Xem validation result
GET http://localhost:8080/api/validations/evidence/{evidenceFileId}
```

### Test 2: Test Auto Validation khi Submit

**Bước 1:** Tạo evaluation với files
- Tạo evaluation
- Upload evidence files
- Lưu evaluationId

**Bước 2:** Submit evaluation
```bash
POST http://localhost:8080/api/evaluations/{evaluationId}/submit
```

**Bước 3:** Kiểm tra logs
```bash
# Xem logs của ai-validation-service
docker logs drl-ai-validation-service -f
```

**Bước 4:** Xem kết quả validation
```bash
# Sau vài giây (async), check validation results
GET http://localhost:8080/api/validations/evaluation/{evaluationId}
```

---

## 📊 Database

### Xem kết quả validation trong database:

```sql
-- Connect to drl_ai_validation database
SELECT * FROM evidence_validations 
WHERE evaluation_id = 1;

-- Xem chi tiết
SELECT 
    id,
    evidence_file_id,
    validation_status,
    ai_score,
    is_fake,
    is_relevant,
    ai_feedback,
    created_at,
    validated_at
FROM evidence_validations
WHERE evaluation_id = 1;
```

---

## 🎨 Frontend Integration (Cần Implement)

### Hiện tại:
- ❌ Chưa có UI để hiển thị validation results
- ❌ Chưa có component để show AI suggestions

### Cần implement:

1. **Component hiển thị validation results:**
   - File: `frontend/src/components/EvidenceValidationResult.tsx`
   - Hiển thị: AI score, fake detection, relevance, feedback

2. **Update Evaluation Detail Page:**
   - File: `frontend/src/app/evaluations/[id]/page.tsx`
   - Thêm section hiển thị AI validation cho mỗi evidence file

3. **API Client:**
   - File: `frontend/src/lib/validation.ts`
   - Functions: `getValidationByFileId()`, `getValidationsByEvaluationId()`

---

## 📝 Response Format

### ValidationResponse:
```json
{
  "validationId": 1,
  "evidenceFileId": 1,
  "evaluationId": 1,
  "criteriaId": 1,
  "subCriteriaId": "1.1",
  "status": "VALIDATED",
  "aiScore": 8.5,
  "aiFeedback": "Minh chứng phù hợp, rõ ràng...",
  "validationConfidence": 0.95,
  "isFake": false,
  "fakeConfidence": 0.1,
  "isRelevant": true,
  "relevanceScore": 0.9,
  "validatedAt": "2024-01-01T10:00:00",
  "createdAt": "2024-01-01T09:00:00"
}
```

---

## 🔍 Debug

### Kiểm tra validation đã chạy chưa:

1. **Check logs:**
   ```bash
   docker logs drl-ai-validation-service | grep "validation"
   docker logs drl-evaluation-service | grep "validation"
   ```

2. **Check database:**
   ```sql
   SELECT COUNT(*) FROM evidence_validations;
   ```

3. **Check API:**
   ```bash
   curl http://localhost:8080/api/validations/evaluation/1
   ```

---

## ⚠️ Lưu Ý

1. **Validation là async** → Cần đợi vài giây sau khi submit
2. **Nếu OpenAI API fail** → Status sẽ là "FAILED", không block submission
3. **Validation chỉ chạy khi submit**, không chạy khi save draft
4. **Cần có OpenAI API key** trong `infra/.env`

---

## 🚀 Next Steps

1. ✅ Backend API - **Đã hoàn thành**
2. ✅ Auto trigger - **Đã hoàn thành**
3. ❌ Frontend UI - **Cần implement**
4. ❌ Admin review page integration - **Cần implement**

