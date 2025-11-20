# Stage 1: build Next.js
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
# (dùng npm ở đây; nếu bạn xài yarn/pnpm thì chỉnh lại)
# Use --legacy-peer-deps to handle React 19 compatibility issues
RUN npm install --legacy-peer-deps
COPY . .
# tạo biến môi trường build-time cho Next.js (public runtime)
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
RUN npm run build

# Stage 2: run production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Next.js standalone output (Next 13+ app router) => .next/standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Port runtime mặc định của Next standalone server là 3000
EXPOSE 3000

CMD ["node", "server.js"]
