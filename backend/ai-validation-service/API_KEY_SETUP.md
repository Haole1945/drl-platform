# Hướng Dẫn Chèn OpenAI API Key

## ⚠️ QUAN TRỌNG: Chèn API Key vào các vị trí sau

### Cách 1: Environment Variable (Khuyến nghị cho Production)

Set environment variable `OPENAI_API_KEY`:

```bash
export OPENAI_API_KEY=sk-your-api-key-here
```

Hoặc trong Docker Compose (sẽ thêm vào sau):
```yaml
environment:
  OPENAI_API_KEY: sk-your-api-key-here
```

### Cách 2: File application.yml (Cho Local Development)

Mở file: `backend/ai-validation-service/src/main/resources/application.yml`

Tìm dòng:
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

### Cách 3: File .env.local (Cho Local Development)

Tạo file `.env.local` ở thư mục root của project:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

---

## Vị Trí Code Kiểm Tra API Key

File: `backend/ai-validation-service/src/main/java/ptit/drl/aivalidation/config/OpenAIConfig.java`

```java
@Bean
public OpenAiService openAiService() {
    // ⚠️ CHÈN API KEY VÀO ĐÂY:
    // Option 1: Set environment variable OPENAI_API_KEY=your-key-here
    // Option 2: Set trong application.yml: openai.api.key: your-key-here
    // Option 3: Set trong .env.local file (cho local development)
    
    if (apiKey == null || apiKey.isEmpty()) {
        throw new IllegalStateException(
            "OpenAI API key is not set! " +
            "Please set OPENAI_API_KEY environment variable or configure in application.yml"
        );
    }
    
    return new OpenAiService(apiKey, Duration.ofSeconds(timeoutSeconds));
}
```

---

## Kiểm Tra API Key Đã Được Set

Khi start service, nếu API key chưa được set, bạn sẽ thấy error:
```
OpenAI API key is not set! Please set OPENAI_API_KEY environment variable or configure in application.yml
```

Nếu thấy error này, hãy kiểm tra lại các vị trí trên.

