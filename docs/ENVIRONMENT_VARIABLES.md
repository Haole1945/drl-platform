# Environment Variables Guide

## 🎯 Tổng quan

Biến môi trường `NEXT_PUBLIC_API_BASE` được sử dụng để frontend biết địa chỉ API Gateway.

**Quan trọng:** 
- ✅ **Development:** Set trong `.env.local` (chạy `npm run dev`)
- ✅ **Production (Docker):** Tự động set qua Docker build args (KHÔNG CẦN SỬA)
- ✅ **Production (Deploy):** Set qua environment variables của hosting platform

---

## 📁 File `.env.local` (Development)

### Vị trí:
```
frontend/.env.local
```

### Nội dung mặc định:
```env
NEXT_PUBLIC_API_BASE=http://localhost:8080/api
```

### Khi nào cần sửa:
- ✅ **KHÔNG CẦN SỬA** khi chạy development mode (`npm run dev`)
- ⚠️ Chỉ sửa nếu Gateway chạy trên port khác hoặc domain khác

### Cách tạo:
```bash
# Tự động (dùng script)
.\scripts\dev-frontend.ps1  # Windows
./scripts/dev-frontend.sh   # Linux/Mac

# Thủ công
cd frontend
cp .env.local.example .env.local
# Sau đó sửa giá trị nếu cần
```

---

## 🐳 Docker Production Build

### Cách hoạt động:

1. **Docker Compose** tự động set build args:
   ```yaml
   # infra/docker-compose.yml
   frontend:
     build:
       args:
         NEXT_PUBLIC_API_BASE: "http://localhost:8080/api"
   ```

2. **Dockerfile** nhận build args:
   ```dockerfile
   # frontend/Dockerfile
   ARG NEXT_PUBLIC_API_BASE
   ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
   ```

3. **Next.js** build với giá trị này:
   - Giá trị được embed vào JavaScript bundle lúc build time
   - Browser sẽ dùng giá trị này khi gọi API

### Khi nào cần sửa:

**KHÔNG CẦN SỬA** nếu:
- ✅ Chạy tất cả services trong Docker
- ✅ Frontend truy cập qua `http://localhost:3000`
- ✅ Gateway truy cập qua `http://localhost:8080`

**CẦN SỬA** nếu:
- ⚠️ Deploy lên server khác (domain khác)
- ⚠️ Dùng reverse proxy (nginx, traefik)
- ⚠️ Gateway chạy trên port/domain khác

### Cách sửa cho production deployment:

**Option 1: Sửa docker-compose.yml**
```yaml
frontend:
  build:
    args:
      NEXT_PUBLIC_API_BASE: "https://api.yourdomain.com/api"
```

**Option 2: Dùng environment variable**
```bash
export NEXT_PUBLIC_API_BASE=https://api.yourdomain.com/api
docker-compose build frontend
```

---

## 🔄 So sánh Development vs Production

| Mode | File/Config | Giá trị mặc định | Khi nào sửa |
|------|-------------|------------------|-------------|
| **Development** | `frontend/.env.local` | `http://localhost:8080/api` | Chỉ khi Gateway port/domain khác |
| **Production (Docker)** | `infra/docker-compose.yml` (build args) | `http://localhost:8080/api` | Khi deploy lên server khác |
| **Production (Deploy)** | Environment variables của hosting | Tùy hosting | Luôn cần set |

---

## ✅ Checklist

### Development:
- [ ] File `frontend/.env.local` tồn tại
- [ ] Giá trị: `NEXT_PUBLIC_API_BASE=http://localhost:8080/api`
- [ ] Gateway đang chạy trên port 8080
- [ ] Restart `npm run dev` sau khi sửa `.env.local`

### Production (Docker):
- [ ] Không cần làm gì - Docker tự động handle
- [ ] Nếu deploy, sửa build args trong `docker-compose.yml`

### Production (Deploy):
- [ ] Set `NEXT_PUBLIC_API_BASE` trong hosting platform
- [ ] Hoặc set trong build command: `NEXT_PUBLIC_API_BASE=... npm run build`

---

## 🐛 Troubleshooting

### Lỗi: "failed to fetch" hoặc CORS error

**Nguyên nhân:** `NEXT_PUBLIC_API_BASE` không đúng hoặc Gateway không chạy

**Giải pháp:**
1. Kiểm tra Gateway: `curl http://localhost:8080/actuator/health`
2. Kiểm tra `.env.local`: `cat frontend/.env.local`
3. Restart frontend dev server
4. Kiểm tra CORS config trong Gateway

### Lỗi: API calls đi đến wrong URL

**Nguyên nhân:** Biến môi trường không được load đúng

**Giải pháp:**
1. **Development:** Đảm bảo file `.env.local` tồn tại và có giá trị đúng
2. **Production:** Đảm bảo build args được set trong Docker
3. Restart server sau khi sửa env vars

### Lỗi: "NEXT_PUBLIC_API_BASE is undefined"

**Nguyên nhân:** Biến môi trường không được set

**Giải pháp:**
1. Tạo file `.env.local` với nội dung:
   ```env
   NEXT_PUBLIC_API_BASE=http://localhost:8080/api
   ```
2. Restart dev server

---

## 📚 Tài liệu tham khảo

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Docker Build Args](https://docs.docker.com/engine/reference/builder/#arg)

---

**Last Updated:** November 18, 2024

