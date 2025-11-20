# Development Workflow Guide

## 🚀 Cách phát triển Frontend mà không cần restart Docker

### Cách 1: Chạy Frontend Development Server bên ngoài Docker (KHUYẾN NGHỊ)

**Ưu điểm:**
- ✅ Hot reload tự động (thay đổi code → tự động refresh)
- ✅ Nhanh hơn (không cần rebuild Docker)
- ✅ Dễ debug hơn
- ✅ Tiết kiệm tài nguyên

**Các bước:**

1. **Chạy backend services trong Docker:**
   ```bash
   cd infra
   docker-compose up -d postgres eureka-server auth-service student-service evaluation-service gateway
   ```
   
   Hoặc nếu muốn chạy tất cả trừ frontend:
   ```bash
   docker-compose up -d --scale frontend=0
   ```

2. **Chạy frontend development server:**
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   npm run dev
   ```

3. **Truy cập:**
   - Frontend: http://localhost:3000 (development server)
   - Backend API: http://localhost:8080/api
   - Eureka Dashboard: http://localhost:8761

**Lưu ý:**
- File `.env.local` đã được tạo tự động với giá trị mặc định `http://localhost:8080/api`
- Nếu chưa có `.env.local`, script sẽ tự động tạo từ `.env.local.example`
- Mỗi lần sửa code frontend, browser sẽ tự động reload
- **KHÔNG CẦN** sửa lại khi đóng gói Docker - Docker sẽ tự động dùng build args

---

### Cách 2: Sử dụng Docker với Volume Mounting (Development Mode)

**Ưu điểm:**
- ✅ Tất cả services chạy trong Docker
- ✅ Code changes được sync vào container

**Nhược điểm:**
- ⚠️ Vẫn cần restart container để apply changes (hoặc dùng nodemon/watch)
- ⚠️ Chậm hơn cách 1

**Các bước:**

1. **Tạo `docker-compose.dev.yml` cho development:**

```yaml
# infra/docker-compose.dev.yml
services:
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile.dev  # Development Dockerfile
    container_name: drl-frontend-dev
    ports:
      - "3000:3000"
    volumes:
      - ../frontend:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_BASE=http://localhost:8080/api
    command: npm run dev
    depends_on:
      - gateway
    networks:
      - drl-net
```

2. **Tạo `Dockerfile.dev` cho development:**

```dockerfile
# frontend/Dockerfile.dev
FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy code (will be overridden by volume mount)
COPY . .

EXPOSE 3000

# Run development server
CMD ["npm", "run", "dev"]
```

3. **Chạy với docker-compose.dev.yml:**
   ```bash
   cd infra
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up frontend
   ```

---

## 📝 Tóm tắt

### Cho Development (Khuyến nghị):
```bash
# Terminal 1: Chạy backend services
cd infra
docker-compose up -d postgres eureka-server auth-service student-service evaluation-service gateway

# Terminal 2: Chạy frontend development server
# Cách 1: Dùng script (tự động tạo .env.local nếu chưa có)
.\scripts\dev-frontend.ps1  # Windows PowerShell
# hoặc
./scripts/dev-frontend.sh   # Linux/Mac

# Cách 2: Chạy thủ công
cd frontend
npm install --legacy-peer-deps  # Chỉ cần chạy lần đầu
npm run dev
```

### Cho Production:
```bash
cd infra
docker-compose up -d  # Chạy tất cả services bao gồm frontend production build
```

---

## 🔧 Troubleshooting

### Frontend không kết nối được backend:
- Kiểm tra Gateway đang chạy: http://localhost:8080/actuator/health
- Kiểm tra file `frontend/.env.local` có giá trị `NEXT_PUBLIC_API_BASE=http://localhost:8080/api`
- Nếu chưa có `.env.local`, tạo từ `.env.local.example` hoặc chạy script `dev-frontend.ps1`
- Kiểm tra CORS configuration trong Gateway
- **Lưu ý:** Sau khi sửa `.env.local`, cần restart `npm run dev`

### Hot reload không hoạt động:
- Đảm bảo đang chạy `npm run dev` (không phải `npm run build && npm start`)
- Kiểm tra Next.js Fast Refresh đã được bật (mặc định có)

### Port 3000 đã được sử dụng:
- Dừng frontend container: `docker-compose stop frontend`
- Hoặc đổi port trong `package.json`: `"dev": "next dev -p 3001"`

---

**Last Updated:** November 18, 2024

