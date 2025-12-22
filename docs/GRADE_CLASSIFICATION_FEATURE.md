# Tính Năng Xếp Loại Điểm Rèn Luyện

## 📋 Tổng Quan

Hệ thống tự động xếp loại điểm rèn luyện dựa trên tổng điểm và hiển thị xếp loại ở nhiều vị trí trong ứng dụng.

## 🎯 Thang Điểm Xếp Loại

| Điểm   | Xếp Loại   | Màu Sắc           |
| ------ | ---------- | ----------------- |
| 90-100 | Xuất sắc   | Tím (Purple)      |
| 80-89  | Giỏi       | Xanh dương (Blue) |
| 65-79  | Khá        | Xanh lá (Green)   |
| 50-64  | Trung bình | Vàng (Yellow)     |
| 35-49  | Yếu        | Cam (Orange)      |
| 0-34   | Kém        | Đỏ (Red)          |

## 📍 Vị Trí Hiển Thị

### 1. Trang Chi Tiết Đánh Giá (`/evaluations/[id]`)

**Vị trí:** Trong card "Tiêu chí Đánh giá", bên cạnh "Tổng điểm"

```
Tiêu chí Đánh giá
Tổng điểm: 85 / 100  Xếp loại: [Giỏi]
```

**Component:** `GradeBadge` - Badge đầy đủ với màu nền

### 2. Dashboard - Đánh Giá Gần Đây (`/dashboard`)

**Vị trí:** Trong danh sách đánh giá gần đây, bên cạnh điểm số

```
2024-2025-HK1
Điểm: 85 / 100 (Xếp loại: Giỏi)
```

**Component:** `InlineGrade` - Hiển thị inline, chỉ có màu chữ

### 3. Trang Tạo Đánh Giá Mới (`/evaluations/new`)

**Vị trí:** Trong card "Tiêu chí Đánh giá", bên cạnh "Tổng điểm hiện tại"

```
Tiêu chí Đánh giá
Tổng điểm hiện tại: 85 / 100  Xếp loại: [Giỏi]
```

**Component:** `GradeBadge` - Badge đầy đủ với màu nền

### 4. Trang Chỉnh Sửa Đánh Giá (`/evaluations/[id]/edit`)

**Vị trí:** Trong card "Tiêu chí Đánh giá", bên cạnh "Tổng điểm hiện tại"

```
Tiêu chí Đánh giá
Tổng điểm hiện tại: 85 / 100  Xếp loại: [Giỏi]
```

**Component:** `GradeBadge` - Badge đầy đủ với màu nền

## 🔧 Implementation

### Files Created

1. **`frontend/src/lib/grading.ts`**

   - Định nghĩa thang điểm xếp loại
   - Hàm `getGrade()` - Lấy xếp loại dựa trên điểm
   - Hàm `getGradeLabel()` - Lấy nhãn xếp loại
   - Hàm `getGradeColors()` - Lấy màu sắc cho xếp loại

2. **`frontend/src/components/GradeBadge.tsx`**
   - Component `GradeBadge` - Badge đầy đủ với màu nền
   - Component `InlineGrade` - Hiển thị inline, chỉ có màu chữ

### Files Modified

1. **`frontend/src/app/evaluations/[id]/page.tsx`**

   - Import `GradeBadge`
   - Thêm `<GradeBadge score={totalScore} />` vào CardDescription

2. **`frontend/src/app/dashboard/page.tsx`**

   - Import `InlineGrade`
   - Thêm `<InlineGrade score={...} />` vào danh sách đánh giá

3. **`frontend/src/app/evaluations/new/page.tsx`**

   - Import `GradeBadge`
   - Thêm `<GradeBadge score={totalScore} />` vào CardDescription

4. **`frontend/src/app/evaluations/[id]/edit/page.tsx`**
   - Import `GradeBadge`
   - Thêm `<GradeBadge score={totalScore} />` vào CardDescription

## 🎨 UI Design

### GradeBadge Component

```tsx
<GradeBadge score={85} />
// Renders: Xếp loại: [Giỏi] với màu xanh dương, nền xanh nhạt
```

**Props:**

- `score: number | null | undefined` - Điểm số (0-100)
- `className?: string` - CSS classes tùy chỉnh

**Styling:**

- Luôn hiển thị "Xếp loại:" prefix màu xám
- Badge với border radius
- Màu chữ và màu nền tương ứng với xếp loại
- Font size: text-sm
- Padding: px-2.5 py-0.5

### InlineGrade Component

```tsx
<InlineGrade score={85} />
// Renders: (Xếp loại: Giỏi) với màu xanh dương
```

**Props:**

- `score: number | null | undefined` - Điểm số (0-100)

**Styling:**

- Inline text với "Xếp loại:" prefix màu xám
- Tên xếp loại với màu tương ứng
- Font size: text-sm
- Font weight: font-medium
- Format: (Xếp loại: Tên)

## 🧪 Testing

### Test Cases

1. **Xuất sắc (90-100)**

   ```
   Score: 95 → Badge: "Xếp loại: Xuất sắc" (Purple)
   Score: 90 → Badge: "Xếp loại: Xuất sắc" (Purple)
   Score: 100 → Badge: "Xếp loại: Xuất sắc" (Purple)
   ```

2. **Giỏi (80-89)**

   ```
   Score: 85 → Badge: "Xếp loại: Giỏi" (Blue)
   Score: 80 → Badge: "Xếp loại: Giỏi" (Blue)
   Score: 89 → Badge: "Xếp loại: Giỏi" (Blue)
   ```

3. **Khá (65-79)**

   ```
   Score: 70 → Badge: "Xếp loại: Khá" (Green)
   Score: 65 → Badge: "Xếp loại: Khá" (Green)
   Score: 79 → Badge: "Xếp loại: Khá" (Green)
   ```

4. **Trung bình (50-64)**

   ```
   Score: 55 → Badge: "Xếp loại: Trung bình" (Yellow)
   Score: 50 → Badge: "Xếp loại: Trung bình" (Yellow)
   Score: 64 → Badge: "Xếp loại: Trung bình" (Yellow)
   ```

5. **Yếu (35-49)**

   ```
   Score: 40 → Badge: "Xếp loại: Yếu" (Orange)
   Score: 35 → Badge: "Xếp loại: Yếu" (Orange)
   Score: 49 → Badge: "Xếp loại: Yếu" (Orange)
   ```

6. **Kém (0-34)**

   ```
   Score: 20 → Badge: "Xếp loại: Kém" (Red)
   Score: 0 → Badge: "Xếp loại: Kém" (Red)
   Score: 34 → Badge: "Xếp loại: Kém" (Red)
   ```

7. **Edge Cases**
   ```
   Score: null → No badge displayed
   Score: undefined → No badge displayed
   Score: -5 → No badge displayed
   Score: 105 → Badge: "Xuất sắc" (fallback)
   ```

### Manual Testing Steps

1. **Tạo đánh giá mới với điểm khác nhau**

   - Tạo đánh giá với tổng điểm 95 → Kiểm tra hiển thị "Xuất sắc"
   - Tạo đánh giá với tổng điểm 85 → Kiểm tra hiển thị "Giỏi"
   - Tạo đánh giá với tổng điểm 70 → Kiểm tra hiển thị "Khá"

2. **Kiểm tra Dashboard**

   - Xem danh sách đánh giá gần đây
   - Verify xếp loại hiển thị đúng bên cạnh điểm

3. **Kiểm tra Chi tiết đánh giá**

   - Mở chi tiết đánh giá
   - Verify xếp loại hiển thị trong card "Tiêu chí Đánh giá"

4. **Kiểm tra Chỉnh sửa**
   - Chỉnh sửa đánh giá
   - Thay đổi điểm → Verify xếp loại cập nhật real-time

## 📊 Color Palette

```css
/* Xuất sắc - Purple */
text-purple-600
bg-purple-100

/* Giỏi - Blue */
text-blue-600
bg-blue-100

/* Khá - Green */
text-green-600
bg-green-100

/* Trung bình - Yellow */
text-yellow-600
bg-yellow-100

/* Yếu - Orange */
text-orange-600
bg-orange-100

/* Kém - Red */
text-red-600
bg-red-100
```

## 🚀 Deployment

### Build & Test

```bash
# Frontend
cd frontend
npm run build
npm run dev

# Test in browser
# 1. Login as student
# 2. Create evaluation with different scores
# 3. Verify grade badges display correctly
```

### Production Checklist

- [x] Grading logic implemented
- [x] GradeBadge component created
- [x] InlineGrade component created
- [x] All pages updated
- [x] Colors match design
- [x] Responsive design
- [x] Edge cases handled
- [ ] Manual testing completed
- [ ] User acceptance testing

## 📝 Notes

### Design Decisions

1. **Two Components:** `GradeBadge` (full badge) và `InlineGrade` (inline text)

   - GradeBadge: Sử dụng cho các vị trí có không gian (detail, new, edit)
   - InlineGrade: Sử dụng cho danh sách compact (dashboard)

2. **Color Scheme:** Sử dụng Tailwind CSS colors

   - Dễ maintain và consistent với design system
   - Accessible colors với contrast ratio tốt

3. **Null Handling:** Không hiển thị badge nếu score là null/undefined

   - Tránh hiển thị "Kém" cho đánh giá chưa có điểm

4. **Real-time Update:** Badge tự động cập nhật khi điểm thay đổi
   - Sử dụng useMemo để tính toán hiệu quả

### Future Enhancements

1. **Thêm icon cho mỗi xếp loại**

   - Xuất sắc: ⭐⭐⭐
   - Giỏi: ⭐⭐
   - Khá: ⭐

2. **Tooltip với thông tin chi tiết**

   - Hover vào badge → Hiển thị range điểm

3. **Animation khi xếp loại thay đổi**

   - Smooth transition khi điểm cập nhật

4. **Export xếp loại trong báo cáo**
   - Thêm cột "Xếp loại" trong Excel/PDF export

## ✅ Status

**Implementation:** ✅ Complete
**Testing:** ⏳ Pending
**Documentation:** ✅ Complete
**Deployment:** ⏳ Ready

---

**Created:** December 18, 2024
**Last Updated:** December 18, 2024
**Version:** 1.0.0
