# Quick Start - Development Mode

## 🚀 Cách nhanh nhất để phát triển Frontend

### Bước 1: Chạy Backend Services (Docker)

```bash
cd infra
docker-compose up -d postgres eureka-server auth-service student-service evaluation-service gateway
```

**Kiểm tra services đã chạy:**
- Gateway: http://localhost:8080/actuator/health
- Eureka: http://localhost:8761

### Bước 2: Chạy Frontend Development Server

**Mở terminal mới:**

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

**Truy cập:** http://localhost:3000

### ✅ Xong!

Bây giờ mỗi lần bạn sửa code frontend:
- ✅ Tự động reload (hot reload)
- ✅ Không cần restart Docker
- ✅ Không cần rebuild
- ✅ Thay đổi hiển thị ngay lập tức

---

## 📝 Lưu ý

1. **Backend services** chạy trong Docker (không cần restart khi sửa frontend)
2. **Frontend** chạy development server bên ngoài Docker
3. **API calls** từ frontend sẽ đi đến `http://localhost:8080/api` (Gateway)

---

## 🔄 Khi nào cần restart?

- ✅ **Không cần restart** khi sửa frontend code (React/TypeScript)
- ⚠️ **Cần restart** khi:
  - Sửa `package.json` (cần `npm install` lại)
  - Sửa `next.config.ts` (cần restart `npm run dev`)
  - Sửa backend code (cần rebuild Docker containers)

---

## 🛑 Dừng Services

```bash
# Dừng frontend (Ctrl+C trong terminal chạy npm run dev)

# Dừng backend services
cd infra
docker-compose down
```

