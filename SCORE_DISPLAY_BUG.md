# 🐛 Bug: Điểm Lớp Trưởng Hiển Thị Sai

## Vấn Đề

**Triệu chứng:**

- Nhập điểm: 3, 0, 0, 0, 0
- Database lưu: 3, NULL, NULL, NULL, NULL ✅ (Đúng)
- Màn hình hiển thị: 0.5, 1.5, 0.6, 0.3, 0.2 ❌ (Sai)

**Nguyên nhân:**
Frontend đang hiển thị **tỷ lệ phần trăm** thay vì điểm thực tế.

## Phân Tích

### Backend ✅ Hoạt động đúng

- ADMIN có thể duyệt evaluation
- Điểm được lưu đúng vào database
- API trả về đúng giá trị

### Frontend ❌ Hiển thị sai

- File: `frontend/src/app/evaluations/[id]/page.tsx`
- Vấn đề: Logic hiển thị điểm đang tính toán sai
- Có thể đang chia điểm cho một giá trị nào đó (tổng điểm, điểm tối đa, etc.)

## Cách Fix

### Option 1: Tìm và sửa logic hiển thị

Trong file `frontend/src/app/evaluations/[id]/page.tsx`, tìm nơi hiển thị cột "Điểm lớp trưởng".

Có thể có code như:

```typescript
// SAI - Đang chia cho một giá trị nào đó
{
  (detail.classMonitorScore / someValue).toFixed(1);
}

// ĐÚNG - Hiển thị trực tiếp
{
  detail.classMonitorScore ?? "-";
}
```

### Option 2: Kiểm tra EvaluationDTO

Có thể backend đang trả về giá trị đã được normalize. Kiểm tra:

```typescript
console.log("Detail from API:", evaluation.details);
```

Xem giá trị `classMonitorScore` từ API là gì.

### Option 3: Kiểm tra mapping

Có thể có logic mapping/transform data sau khi nhận từ API:

```typescript
// Tìm code như thế này
const transformedDetails = evaluation.details.map((detail) => ({
  ...detail,
  classMonitorScore: detail.classMonitorScore / something, // ← Bug ở đây
}));
```

## Debug Steps

1. **Mở DevTools (F12)**
2. **Vào tab Console**
3. **Reload trang `/evaluations/1`**
4. **Tìm API response:**
   ```
   GET /api/evaluations/1
   ```
5. **Xem giá trị `details[0].classMonitorScore`**

   - Nếu là `3` → Bug ở frontend render
   - Nếu là `0.5` → Bug ở backend DTO mapping

6. **Tìm element hiển thị 0.5:**
   - Click vào số 0.5 trong cột "Điểm lớp trưởng"
   - Xem HTML/React component tree
   - Tìm component render số đó

## Workaround Tạm Thời

Nếu không tìm được bug ngay, có thể:

1. Reload lại trang sau khi duyệt
2. Hoặc check trực tiếp trong database:
   ```sql
   SELECT criteria_id, class_monitor_score
   FROM evaluation_details
   WHERE evaluation_id = 1;
   ```

## Kết Luận

- ✅ Backend hoạt động đúng
- ✅ Điểm được lưu đúng vào database
- ❌ Frontend hiển thị sai (bug render/display logic)
- 🔧 Cần fix logic hiển thị trong `frontend/src/app/evaluations/[id]/page.tsx`

---

**Ghi chú:** File `page.tsx` rất dài (>1000 dòng), cần tìm đúng phần render bảng điểm để fix.
