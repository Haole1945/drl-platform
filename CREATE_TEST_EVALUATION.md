# 🧪 Tạo Evaluation Mới Để Test

## Vấn Đề Hiện Tại

Evaluation ID=1 đã ở status `ADVISOR_APPROVED`, không thể test nhập điểm lớp trưởng nữa.

## Giải Pháp

### Option 1: Reset Evaluation Về SUBMITTED

```sql
-- Reset evaluation về SUBMITTED để test lại
docker exec drl-postgres psql -U drl -d drl_evaluation -c "
UPDATE evaluations
SET status = 'SUBMITTED',
    class_monitor_approved_at = NULL,
    advisor_approved_at = NULL,
    faculty_approved_at = NULL
WHERE id = 1;

-- Xóa điểm lớp trưởng và cố vấn
UPDATE evaluation_details
SET class_monitor_score = NULL,
    advisor_score = NULL
WHERE evaluation_id = 1;
"
```

### Option 2: Tạo Evaluation Mới

1. **Vào trang tạo evaluation:**

   - URL: http://localhost:3000/evaluations/new
   - Chọn sinh viên (nếu là ADMIN)
   - Nhập điểm tự chấm
   - Nhấn "Nộp đánh giá"

2. **Sau đó test:**
   - Vào trang evaluation detail
   - Nhập điểm lớp trưởng
   - Nhấn "Duyệt"

## Kiểm Tra Hiển Thị

Sau khi có evaluation ở status SUBMITTED:

### 1. Kiểm Tra Input Fields

Khi vào trang evaluation detail với role CLASS_MONITOR hoặc ADMIN:

- Cột "Điểm lớp trưởng" phải có **input fields** (ô nhập liệu)
- Có thể nhập số vào

### 2. Kiểm Tra Summary Row

Sau khi duyệt:

- Phải có **dòng cuối cùng** trong bảng (summary row)
- Dòng này hiển thị: "Tổng điểm tiêu chí:"
- Cột "Điểm lớp trưởng" hiển thị tổng điểm (ví dụ: 3)

### 3. Kiểm Tra Sub-criteria Rows

Sau khi duyệt (khi xem lại):

- Các dòng sub-criteria hiển thị "-" trong cột "Điểm lớp trưởng"
- KHÔNG hiển thị 0.5, 1.5, 0.6... nữa

## Debug: Tại Sao Không Thấy Summary Row?

Nếu không thấy summary row, có thể do:

1. **Frontend chưa reload:** Nhấn Ctrl + Shift + R
2. **Code chưa được áp dụng:** Kiểm tra file `frontend/src/app/evaluations/[id]/page.tsx`
3. **Điều kiện hiển thị:** Summary row chỉ hiển thị khi có ít nhất 1 điểm

## Lệnh Reset Nhanh

```bash
# Reset evaluation 1 về SUBMITTED
docker exec drl-postgres psql -U drl -d drl_evaluation -c "UPDATE evaluations SET status = 'SUBMITTED', class_monitor_approved_at = NULL, advisor_approved_at = NULL, faculty_approved_at = NULL WHERE id = 1; UPDATE evaluation_details SET class_monitor_score = NULL, advisor_score = NULL WHERE evaluation_id = 1;"

# Kiểm tra
docker exec drl-postgres psql -U drl -d drl_evaluation -c "SELECT id, status FROM evaluations WHERE id = 1; SELECT criteria_id, score, class_monitor_score FROM evaluation_details WHERE evaluation_id = 1;"
```

Sau khi reset, reload trang và test lại!
