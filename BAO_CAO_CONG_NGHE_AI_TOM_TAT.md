# Công Nghệ Tích Hợp AI - Tóm Tắt

## 1. Công Nghệ AI Cốt Lõi

### OpenAI GPT-4o-mini Vision API
- **Mô hình**: GPT-4o-mini (OpenAI) - mô hình đa phương thức phân tích văn bản và hình ảnh
- **Khả năng**: 
  - Phân tích nhiều hình ảnh minh chứng cùng lúc
  - Nhận diện văn bản trong ảnh (OCR tự nhiên)
  - Đánh giá tính hợp lệ và đưa ra gợi ý điểm số
- **Cấu hình**: Temperature 0.2, Max tokens 1000, Response format JSON

### Prompt Engineering
- System prompt định nghĩa vai trò AI
- Structured output với JSON format chuẩn
- Prompt động dựa trên thông tin tiêu chí chấm điểm

## 2. Kiến Trúc Backend

### Framework và Ngôn Ngữ
- **Spring Boot 3.5.6** - Framework Java enterprise
- **Java 21** - LTS version với các tính năng hiện đại
- **Spring Cloud Gateway** - API Gateway với routing và load balancing

### HTTP Client và Xử Lý
- **OkHttp 4.12.0** - HTTP client hiệu suất cao
- **Jackson ObjectMapper** - Xử lý JSON serialization/deserialization
- **Base64 Encoding** - Chuyển đổi hình ảnh để gửi đến OpenAI API

### Database và Migration
- **PostgreSQL** - Database quan hệ
- **Flyway** - Database migration tool

### Security
- **Spring Security với JWT** - Authentication và authorization
- **Role-based access control** - Chỉ người chấm mới có quyền gọi AI
- **API Key Management** - Bảo mật OpenAI API key qua environment variables

### Service Discovery
- **Netflix Eureka** - Service registry và discovery
- **Load balancing** - Tự động phân tải requests

## 3. Kiến Trúc Frontend

### Framework
- **Next.js 16.0.0** - React framework với SSR
- **React 19.2.0** - UI library
- **TypeScript 5.x** - Type-safe development

### UI Components
- **Radix UI** - Headless UI components (Card, Button, Badge)
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### State Management
- **React Hooks** - useState, useEffect cho component state
- **Fetch API** - HTTP requests với error handling

### API Communication
- **Next.js API Routes** - Proxy layer xử lý CORS
- **Type-safe interfaces** - AiScoringRequest, AiScoringResponse

## 4. Luồng Xử Lý

```
1. Frontend gửi request với criteriaId và evidenceFileIds
2. Gateway xác thực JWT và route đến Evaluation Service
3. Service load evidence files từ database
4. Encode images sang Base64
5. Build prompt với thông tin tiêu chí
6. Gọi OpenAI GPT-4o-mini Vision API qua OkHttp
7. Parse và validate JSON response
8. Trả về kết quả cho frontend
9. Frontend hiển thị gợi ý với UI components
```

## 5. Xử Lý Dữ Liệu

### Image Processing
- Chỉ xử lý file ảnh (image/*)
- Base64 encoding để embed vào JSON
- Format: `data:image/jpeg;base64,{base64_string}`

### Request Construction
- Multi-modal messages (text + images)
- Dynamic prompt building
- Structured JSON response format

### Response Processing
- JSON parsing với error handling
- Score rounding và validation
- Status determination (ACCEPTABLE/REJECT/UNCERTAIN)

## 6. Monitoring và Logging

- **Application Logging**: SLF4J với structured logs
- **Health Checks**: Spring Actuator endpoints
- **Performance Tracking**: Processing time measurement

## 7. Bảo Mật

- API key trong environment variables
- JWT authentication tại gateway
- Role-based access control
- API key masking trong logs
- Secure image encoding trên server

## 8. Performance

- Connection timeout: 30s
- Read timeout: 60s
- Error handling và graceful degradation
- Processing time tracking
- Ready for future caching implementation

## 9. Điểm Mạnh Công Nghệ

✅ Sử dụng AI model mới nhất (GPT-4o-mini)  
✅ Kiến trúc microservices linh hoạt  
✅ Type-safe với TypeScript  
✅ Comprehensive logging và monitoring  
✅ Security best practices  
✅ Modern UI/UX với React và Tailwind  

## 10. Hướng Phát Triển

- Thêm caching mechanism
- Implement retry logic
- Batch processing
- Fine-tuning prompts
- A/B testing các AI models

