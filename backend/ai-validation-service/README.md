# AI Validation Service

Service xử lý validation minh chứng bằng OpenAI Vision API.

## ⚠️ QUAN TRỌNG: Chèn OpenAI API Key

### Cách 1: Environment Variable (Khuyến nghị)

Set trong Docker Compose hoặc environment:
```bash
OPENAI_API_KEY=sk-your-api-key-here
```

### Cách 2: File application.yml

Mở: `backend/ai-validation-service/src/main/resources/application.yml`

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

### Cách 3: File .env.local

Tạo file `.env.local` ở root project:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

## API Endpoints

- `POST /validations/validate` - Validate evidence file
- `GET /validations/evidence/{evidenceFileId}` - Get validation result
- `GET /validations/evaluation/{evaluationId}` - Get all validations for evaluation

## Port

Service chạy trên port **8084**

