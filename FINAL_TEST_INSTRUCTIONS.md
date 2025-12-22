# ✅ Hướng Dẫn Test Cuối Cùng - Điểm Lớp Trưởng

## 🎯 Đã Chuẩn Bị

1. ✅ Backend rebuilt với code mới
2. ✅ Evaluation ID=1 reset về status SUBMITTED
3. ✅ Điểm lớp trưởng và cố vấn đã xóa (NULL)
4. ✅ Đợt đánh giá đang mở

## 🚀 Các Bước Test

### Bước 1: Hard Reload Frontend

```
Nhấn: Ctrl + Shift + R
```

Hoặc:

```
Ctrl + F5
```

Để clear cache và load code mới.

### Bước 2: Đăng Nhập

Đăng nhập với một trong các role sau:

- **ADMIN** (username: admin)
- **CLASS_MONITOR** (username: N21DCCN001 hoặc lớp trưởng của lớp)

### Bước 3: Vào Trang Evaluation Detail

URL: http://localhost:3000/evaluations/1

### Bước 4: Kiểm Tra Giao Diện

Bạn phải thấy:

1. **Status Badge:** "Đã nộp" (SUBMITTED)
2. **Bảng điểm** với các cột:

   - Mã
   - Tên tiêu chí
   - Điểm tối đa
   - Điểm tự chấm
   - **Điểm lớp trưởng** ← Cột này phải có INPUT FIELDS (ô màu vàng nhạt)
   - Điểm cố vấn
   - Bằng chứng
   - AI

3. **Nút "Duyệt"** ở cuối trang

### Bước 5: Nhập Điểm

Trong cột "Điểm lớp trưởng":

1. Nhập điểm cho sub-criteria của tiêu chí 1:

   - 1.1: Nhập `3`
   - 1.2: Nhập `10` (hoặc bất kỳ số nào)
   - ...

2. Điểm sẽ tự động tính tổng

### Bước 6: Duyệt

1. Nhấn nút **"Duyệt"**
2. Nhập comment (optional)
3. Nhấn **"Xác nhận"**

### Bước 7: Kiểm Tra Kết Quả

Sau khi duyệt thành công:

#### A. Kiểm Tra Giao Diện

1. **Status Badge:** Chuyển sang "Đã duyệt lớp trưởng" (CLASS_APPROVED)

2. **Bảng điểm:**
   - Sub-criteria rows: Cột "Điểm lớp trưởng" hiển thị **"-"** (không còn input fields)
   - **Summary Row** (dòng cuối cùng):
     ```
     Tổng điểm tiêu chí:  | 20 | 3 | 13 | - | -
     ```
     - Cột "Điểm lớp trưởng" hiển thị **13** (hoặc tổng điểm bạn nhập)

#### B. Kiểm Tra Database

```bash
docker exec drl-postgres psql -U drl -d drl_evaluation -c "SELECT criteria_id, score, class_monitor_score FROM evaluation_details WHERE evaluation_id = 1 ORDER BY criteria_id;"
```

Kết quả mong đợi:

```
 criteria_id | score | class_monitor_score
-------------+-------+---------------------
           1 |     3 |                  13
           2 |     0 |
           3 |     0 |
           4 |     0 |
           5 |     0 |
```

## ❌ Nếu Không Thấy Input Fields

Nếu không thấy ô nhập điểm (input fields) trong cột "Điểm lớp trưởng":

### Nguyên nhân có thể:

1. **Không phải role đúng:**

   - Phải là ADMIN hoặc CLASS_MONITOR
   - Kiểm tra: Xem góc trên phải, có hiển thị role gì?

2. **Status không đúng:**

   - Phải là SUBMITTED
   - Kiểm tra: Xem status badge

3. **Frontend chưa reload:**

   - Nhấn Ctrl + Shift + R
   - Hoặc clear cache: DevTools → Application → Clear storage

4. **Code chưa được áp dụng:**
   - Kiểm tra file có thay đổi không
   - Xem console có lỗi không

## ❌ Nếu Không Thấy Summary Row

Nếu sau khi duyệt không thấy dòng "Tổng điểm tiêu chí:":

### Kiểm tra:

1. **Scroll xuống cuối bảng:** Summary row ở cuối cùng

2. **Kiểm tra code:**

   ```typescript
   // File: frontend/src/app/evaluations/[id]/page.tsx
   // Tìm: <TableFooter>
   ```

3. **Kiểm tra console:** Có lỗi JavaScript không?

## 📸 Screenshot Mong Đợi

### Khi Đang Chấm Điểm (SUBMITTED):

```
┌─────┬──────────────────┬────────┬─────────┬──────────────┬────────────┐
│ Mã  │ Tên tiêu chí     │ Tối đa │ Tự chấm │ Lớp trưởng   │ Cố vấn     │
├─────┼──────────────────┼────────┼─────────┼──────────────┼────────────┤
│ 1.1 │ Ý thức...        │   3    │    3    │ [input: 3]   │     -      │
│ 1.2 │ Kết quả...       │  10    │    0    │ [input: 10]  │     -      │
└─────┴──────────────────┴────────┴─────────┴──────────────┴────────────┘
```

### Sau Khi Duyệt (CLASS_APPROVED):

```
┌─────┬──────────────────┬────────┬─────────┬────────────┬────────────┐
│ Mã  │ Tên tiêu chí     │ Tối đa │ Tự chấm │ Lớp trưởng │ Cố vấn     │
├─────┼──────────────────┼────────┼─────────┼────────────┼────────────┤
│ 1.1 │ Ý thức...        │   3    │    3    │     -      │     -      │
│ 1.2 │ Kết quả...       │  10    │    0    │     -      │     -      │
├─────┴──────────────────┴────────┴─────────┴────────────┴────────────┤
│ Tổng điểm tiêu chí:              20         3           13           -      │
└──────────────────────────────────────────────────────────────────────┘
```

## 🎉 Kết Quả Mong Đợi

- ✅ Có thể nhập điểm lớp trưởng
- ✅ Điểm được lưu vào database
- ✅ Summary row hiển thị tổng điểm
- ✅ Sub-criteria rows hiển thị "-" sau khi duyệt
- ✅ Không còn hiển thị 0.5, 1.5, 0.6... nữa

## 📞 Nếu Vẫn Không Được

Gửi cho tôi:

1. Screenshot của trang evaluation detail
2. Console logs (F12 → Console)
3. Network request/response (F12 → Network → PUT approve)
4. Kết quả query database

Tôi sẽ debug tiếp!
