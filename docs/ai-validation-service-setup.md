# Hướng Dẫn Setup AI Validation Service

## ⚠️ QUAN TRỌNG: Chèn OpenAI API Key

### Cách 1: Docker Compose (Khuyến nghị)

Mở file: `infra/docker-compose.yml`

Tìm dòng 177 (trong `ai-validation-service` section):

```yaml
OPENAI_API_KEY: ${OPENAI_API_KEY:} # ⚠️ CHÈN API KEY VÀO ĐÂY
```

Thay bằng:

```yaml
OPENAI_API_KEY: sk-your-api-key-here # ⚠️ CHÈN API KEY VÀO ĐÂY
```

Hoặc set environment variable trước khi chạy docker-compose:

```bash
export OPENAI_API_KEY=sk-your-api-key-here
docker-compose up
```

### Cách 2: File application.yml (Local Development)

Mở file: `backend/ai-validation-service/src/main/resources/application.yml`

Tìm dòng 47:

```yaml
openai:
  api:
    key: ${OPENAI_API_KEY:} # ⬅️ CHÈN API KEY VÀO ĐÂY
```

Thay bằng:

```yaml
openai:
  api:
    key: sk-your-api-key-here # ⬅️ CHÈN API KEY VÀO ĐÂY
```

### Cách 3: File .env.local (Local Development)

Tạo file `.env.local` ở root project:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

---

## Các Bước Setup

1. ✅ **Chèn API Key** (chọn 1 trong 3 cách trên)

2. ✅ **Tạo Database**: Database `drl_ai_validation` sẽ được tạo tự động khi start PostgreSQL container

3. ✅ **Start Services**:

   ```bash
   docker-compose up
   ```

4. ✅ **Kiểm tra Service**:
   - Service chạy trên port **8084**
   - Health check: `http://localhost:8084/actuator/health`
   - Swagger UI: `http://localhost:8084/swagger-ui.html`

---

## API Endpoints

- `POST /api/validations/validate` - Validate evidence file
- `GET /api/validations/evidence/{evidenceFileId}` - Get validation result
- `GET /api/validations/evaluation/{evaluationId}` - Get all validations for evaluation

---

## Workflow

1. Student uploads evidence files → evaluation-service saves
2. Student submits evaluation → evaluation-service triggers async validation
3. ai-validation-service validates using OpenAI Vision API
4. Admin reviews → Frontend shows AI suggestions

---

## Lưu Ý

- API key phải được set trước khi start service
- Nếu không set API key, service sẽ fail với error: "OpenAI API key is not set!"
- Validation chạy async, không block submission process
