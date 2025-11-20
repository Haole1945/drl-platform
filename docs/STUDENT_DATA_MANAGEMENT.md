# Student Data Management - Dữ liệu giả

## Tình huống

- Không có hệ thống quản lý học sinh thực tế
- Dữ liệu students là dữ liệu giả/mẫu
- Cần cách để quản lý students trong app

## Giải pháp

### Phương án 1: Admin Panel để CRUD Students (KHUYẾN NGHỊ)

**Cách hoạt động:**
- Admin có thể tạo/sửa/xóa students qua UI
- Dùng cho demo/prototype
- Linh hoạt, dễ quản lý

**Implementation:**
- Admin page với form tạo student
- List students với pagination
- Edit/Delete functionality
- Search/Filter

### Phương án 2: Import từ CSV/Excel

**Cách hoạt động:**
- Admin upload file CSV/Excel
- System parse và import students
- Nhanh để tạo nhiều students

**CSV Format:**
```csv
student_code,full_name,date_of_birth,gender,phone,address,academic_year,class_code,major_code,faculty_code,position
N21DCCN001,Nguyễn Văn An,2003-05-15,MALE,0123456789,Hà Nội,2024-2025,D21CQCN01-N,CN,CNTT2,NONE
N21DCCN002,Trần Thị Bình,2003-08-20,FEMALE,0987654321,Hải Phòng,2024-2025,D21CQCN01-N,CN,CNTT2,CLASS_MONITOR
```

### Phương án 3: DataSeeder mở rộng

**Cách hoạt động:**
- Mở rộng DataSeeder để tạo nhiều students hơn
- Có thể random data
- Dùng cho testing

## Khuyến nghị: Hybrid Approach

1. **DataSeeder** - Cho development/testing (giữ như hiện tại)
2. **Admin Panel** - Cho production demo (CRUD students)
3. **CSV Import** - Cho bulk import (optional)

## Implementation Plan

### 1. Giữ DataSeeder hiện tại
- Đã có 10 students mẫu
- Đủ để test flow

### 2. Thêm Admin Panel để quản lý Students
- Create/Edit/Delete students
- List với pagination
- Search/Filter

### 3. Optional: CSV Import
- Upload CSV file
- Parse và import
- Validate data

## Lưu ý

Với dữ liệu giả:
- ✅ Không cần sync với hệ thống khác
- ✅ Không cần `is_active` field (có thể bỏ qua)
- ✅ Admin tự quản lý students
- ✅ Có thể tạo/xóa tùy ý

## Next Steps

1. Giữ DataSeeder như hiện tại ✅
2. Thêm Admin Panel để CRUD students (sẽ implement)
3. Optional: CSV import endpoint

