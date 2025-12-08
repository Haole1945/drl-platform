# ⚠️ HƯỚNG DẪN CHÈN OPENAI API KEY (BẢO MẬT)

## 🚨 QUAN TRỌNG: Bảo Mật API Key

**KHÔNG BAO GIỜ** hardcode API key trực tiếp vào `docker-compose.yml`!

**Lý do:**

- ❌ Có thể bị commit vào Git
- ❌ Dễ bị lộ nếu ai đó có access vào file
- ❌ Khó quản lý khi có nhiều môi trường

---

## ✅ Cách Đúng: Dùng Environment Variable

### 🎯 Cách 1: File .env (Khuyến nghị - An toàn nhất)

1. **Tạo file `.env`** trong thư mục `infra/`:

   ```bash
   cd infra
   cp .env.example .env
   ```

2. **Mở file `infra/.env`** và thêm API key:

   ```env
   OPENAI_API_KEY=sk-your-api-key-here
   ```

3. **Docker Compose tự động load** file `.env` từ cùng thư mục

4. **File `.env` đã được ignore trong `.gitignore`** → An toàn!

5. **Start services:**
   ```bash
   docker-compose up
   ```

---

### 🎯 Cách 2: Export Environment Variable

**Trước khi chạy docker-compose:**

```bash
export OPENAI_API_KEY=sk-your-api-key-here
cd infra
docker-compose up
```

Hoặc trong một dòng:

```bash
cd infra
OPENAI_API_KEY=sk-your-api-key-here docker-compose up
```

---

### 🎯 Cách 3: File application.yml (Chỉ cho Local Development)

**File**: `backend/ai-validation-service/src/main/resources/application.yml`

**Dòng 47**:

```yaml
openai:
  api:
    key: ${OPENAI_API_KEY:} # ⬅️ CHÈN API KEY VÀO ĐÂY (chỉ cho local dev)
```

**Thay bằng**:

```yaml
openai:
  api:
    key: sk-your-api-key-here # ⬅️ CHÈN API KEY VÀO ĐÂY
```

⚠️ **Lưu ý**: Cách này chỉ dùng cho local development, không dùng cho production!

---

## 🔒 Bảo Mật

- ✅ File `.env` và `.env.local` đã được thêm vào `.gitignore`
- ✅ **KHÔNG commit** file `.env` vào Git
- ✅ Chỉ commit file `.env.example` (template không có API key thật)
- ✅ Nếu đã commit API key vào Git → **Đổi API key ngay!**

---

## ✅ Kiểm Tra

Sau khi set environment variable, kiểm tra:

```bash
echo $OPENAI_API_KEY
```

Nếu thấy API key → OK!

---

## 📝 Tóm Tắt

**Khuyến nghị:**

- **Production**: Cách 1 (File `.env` trong `infra/`)
- **Local Development**: Cách 1 hoặc Cách 2
- **Quick Test**: Cách 2 (Export env variable)

**KHÔNG BAO GIỜ** hardcode API key vào `docker-compose.yml`!
