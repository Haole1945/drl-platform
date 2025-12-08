# Hướng Dẫn Setup Environment Variables

## ⚠️ QUAN TRỌNG: Bảo Mật API Key

**KHÔNG BAO GIỜ** hardcode API key trực tiếp vào `docker-compose.yml` vì:

- ❌ Có thể bị commit vào Git
- ❌ Dễ bị lộ nếu ai đó có access vào file
- ❌ Khó quản lý khi có nhiều môi trường

## ✅ Cách Đúng: Dùng Environment Variable

### Cách 1: File .env (Khuyến nghị)

1. **Tạo file `.env`** trong thư mục `infra/`:

   ```bash
   cd infra
   touch .env
   ```

2. **Thêm API key vào file `.env`**:

   ```env
   # OpenAI API Key - Used by evaluation-service and ai-validation-service
   OPENAI_API_KEY=sk-your-api-key-here
   ```
   
   **Lấy API key từ:** https://platform.openai.com/api-keys

3. **Docker Compose tự động load** file `.env` từ cùng thư mục

4. **File `.env` đã được ignore trong `.gitignore`** → An toàn!

### Cách 2: Export Environment Variable

**Trước khi chạy docker-compose:**

```bash
export OPENAI_API_KEY=sk-your-api-key-here
docker-compose up
```

Hoặc trong một dòng:

```bash
OPENAI_API_KEY=sk-your-api-key-here docker-compose up
```

### Cách 3: File .env.local (Alternative)

Tạo file `infra/.env.local` (cũng được ignore):

```env
OPENAI_API_KEY=sk-your-api-key-here
```

---

## Kiểm Tra

Sau khi set environment variable, kiểm tra:

```bash
echo $OPENAI_API_KEY
```

Nếu thấy API key → OK!

---

## Lưu Ý

- ✅ File `.env` và `.env.local` đã được thêm vào `.gitignore`
- ✅ **KHÔNG commit** file `.env` vào Git
- ✅ Chỉ commit file `.env.example` (template không có API key thật)
