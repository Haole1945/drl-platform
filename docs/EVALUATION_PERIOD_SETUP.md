# Evaluation Period Setup

## Tổng quan

**Evaluation Period (Đợt đánh giá)** là cơ chế quản lý thời gian cho phép sinh viên nộp đánh giá điểm rèn luyện. Chỉ khi có đợt đánh giá đang mở, sinh viên mới có thể nộp đánh giá.

## Database

Đợt đánh giá được lưu trong bảng `evaluation_periods` với các trường:
- `id`: ID đợt
- `name`: Tên đợt (ví dụ: "Đợt 1 - Học kỳ 1 năm học 2024-2025")
- `semester`: Học kỳ (ví dụ: "2024-2025-HK1")
- `academic_year`: Năm học (ví dụ: "2024-2025")
- `start_date`: Ngày bắt đầu
- `end_date`: Ngày kết thúc
- `is_active`: Trạng thái hoạt động
- `description`: Mô tả

## Auto Seeding

Khi `evaluation-service` start lần đầu (hoặc khi chưa có đợt nào), hệ thống sẽ tự động tạo một đợt mẫu:
- **Tên**: "Đợt 1 - Học kỳ 1 năm học 2024-2025"
- **Học kỳ**: "2024-2025-HK1"
- **Năm học**: "2024-2025"
- **Ngày bắt đầu**: Hôm nay
- **Ngày kết thúc**: 30 ngày sau
- **Trạng thái**: Active

## API Endpoints

### Public Endpoints (không cần authentication)

- `GET /api/evaluation-periods/open` - Lấy đợt đang mở
  - Trả về `success: true, data: EvaluationPeriod` nếu có đợt mở
  - Trả về `success: true, data: null` nếu không có đợt mở (không phải error)

- `GET /api/evaluation-periods` - Lấy tất cả đợt active
- `GET /api/evaluation-periods/{id}` - Lấy đợt theo ID
- `GET /api/evaluation-periods/semester/{semester}` - Lấy đợt theo học kỳ
- `GET /api/evaluation-periods/academic-year/{academicYear}` - Lấy đợt theo năm học

### Admin Endpoints (cần ADMIN hoặc INSTITUTE_COUNCIL)

- `POST /api/evaluation-periods` - Tạo đợt mới
- `PUT /api/evaluation-periods/{id}` - Cập nhật đợt
- `DELETE /api/evaluation-periods/{id}` - Vô hiệu hóa đợt

## Frontend

### Trang Tạo Đánh giá

Khi mở trang tạo đánh giá, hệ thống sẽ:
1. Tự động check đợt đang mở
2. Hiển thị Alert:
   - **Màu đỏ**: Nếu không có đợt mở → "Không có đợt đánh giá đang mở"
   - **Màu xanh**: Nếu có đợt mở → Hiển thị thông tin đợt

### Trang Quản lý Đợt (Admin)

- Route: `/admin/evaluation-periods`
- Chỉ ADMIN và INSTITUTE_COUNCIL có quyền truy cập
- Chức năng: CRUD đợt đánh giá

## Validation

Khi sinh viên nộp đánh giá (`submitEvaluation`), hệ thống sẽ:
1. Check xem có đợt đang mở không
2. Nếu không có → Trả về lỗi: "Không có đợt đánh giá nào đang mở"
3. Nếu có → Cho phép nộp

## Troubleshooting

### Lỗi "Không tìm thấy tài nguyên" (404)

**Nguyên nhân**: Controller chưa được compile vào JAR

**Giải pháp**:
```bash
cd infra
docker-compose build --no-cache evaluation-service
docker-compose restart evaluation-service
```

### Không có đợt nào được tạo tự động

**Nguyên nhân**: Database đã có đợt từ trước, hoặc seeder chưa chạy

**Giải pháp**:
1. Xóa tất cả đợt trong database
2. Restart service → Seeder sẽ tự động tạo đợt mới

Hoặc tạo đợt thủ công qua Admin UI: `/admin/evaluation-periods`

