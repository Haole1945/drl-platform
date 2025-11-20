# DRL Platform - Frontend

## 🚀 Quick Start

### Development Mode (Recommended)

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Set up environment variables:**
   ```bash
   # Copy example file (if .env.local doesn't exist)
   cp .env.local.example .env.local
   ```
   
   Or create `.env.local` manually:
   ```env
   NEXT_PUBLIC_API_BASE=http://localhost:8080/api
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080/api

### Production Build (Docker)

The Docker build automatically sets `NEXT_PUBLIC_API_BASE` via build args in `docker-compose.yml`.

No manual configuration needed when using Docker Compose.

---

## 📝 Environment Variables

### `NEXT_PUBLIC_API_BASE`

**Development (npm run dev):**
- Use: `http://localhost:8080/api`
- Reason: Frontend runs on your machine, Gateway runs in Docker on localhost:8080

**Production (Docker):**
- Automatically set by Docker Compose
- Value: `http://localhost:8080/api` (for browser access)
- Reason: Browser makes requests to localhost, which routes to Gateway container

**Production (Deployed):**
- Use your actual domain: `https://api.yourdomain.com/api`
- Set via environment variable or build args

---

## 🔧 Troubleshooting

### API calls fail with CORS error:
- Ensure Gateway is running: `docker-compose ps gateway`
- Check Gateway CORS configuration allows `http://localhost:3000`

### API calls fail with "failed to fetch":
- Check `NEXT_PUBLIC_API_BASE` in `.env.local`
- Ensure Gateway is accessible: `curl http://localhost:8080/actuator/health`
- Restart frontend dev server after changing `.env.local`

---

## 📦 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
