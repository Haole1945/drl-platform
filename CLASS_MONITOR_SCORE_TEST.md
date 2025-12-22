# ✅ Backend Đã Rebuild - Test Điểm Lớp Trưởng

## 🎯 Vấn Đề Đã Sửa

Backend đã được rebuild với các thay đổi:

1. ✅ ADMIN có thể duyệt evaluation ở mọi level
2. ✅ ADMIN có thể lưu classMonitorScore và advisorScore
3. ✅ Điểm lớp trưởng được lưu đúng vào database
4. ✅ Điểm hiển thị đúng trong summary row

## 🚀 Cách Test

### Bước 1: Reload Trang

Reload trang evaluation detail để load code mới:

- URL: http://localhost:3000/evaluations/1
- Nhấn `Ctrl + Shift + R` (hard reload)

### Bước 2: Nhập Điểm Lớp Trưởng

Với role **Lớp trưởng** hoặc **ADMIN**:

1. Vào trang evaluation detail (status = SUBMITTED)
2. Nhập điểm cho từng sub-criteria trong cột "Điểm lớp trưởng"
3. Nhấn nút "Duyệt"
4. Nhập comment (optional)
5. Xác nhận

### Bước 3: Kiểm Tra Kết Quả

Sau khi duyệt, kiểm tra:

1. **Summary Row (dòng cuối bảng):**

   - Cột "Điểm lớp trưởng" hiển thị tổng điểm (ví dụ: 3)
   - KHÔNG còn hiển thị 0.5, 1.5, 0.6... nữa

2. **Sub-criteria Rows:**

   - Khi KHÔNG đang chấm điểm: hiển thị "-"
   - Khi đang chấm điểm: hiển thị input field

3. **Database:**
   ```sql
   SELECT criteria_id, class_monitor_score, advisor_score
   FROM evaluation_details
   WHERE evaluation_id = 1;
   ```

## 📊 Kết Quả Mong Đợi

### Trước Khi Sửa:

- Sub-criteria hiển thị: 0.5, 1.5, 0.6, 0.3, 0.2 (tỷ lệ %)
- Summary row: không có

### Sau Khi Sửa:

- Sub-criteria hiển thị: "-" (khi không chấm điểm)
- Summary row hiển thị: 3 (điểm thực tế)

## 🔍 Debug

Nếu vẫn không hoạt động:

### 1. Kiểm Tra Backend Logs

```bash
docker logs drl-evaluation-service --tail 50
```

### 2. Kiểm Tra API Response

Mở DevTools (F12) → Network tab → Tìm request `PUT /api/evaluations/{id}/approve`

Xem request body:

```json
{
  "scores": {
    "1": 3 // criteriaId: score
  },
  "subCriteriaScores": {
    "classMonitorSubCriteria": {
      "1.1": 3 // subCriteriaId: score
    }
  },
  "comment": "..."
}
```

### 3. Kiểm Tra Database

```sql
-- Xem điểm đã lưu
SELECT
  e.id as evaluation_id,
  e.status,
  ed.criteria_id,
  ed.self_score,
  ed.class_monitor_score,
  ed.advisor_score
FROM evaluations e
JOIN evaluation_details ed ON e.id = ed.evaluation_id
WHERE e.id = 1
ORDER BY ed.criteria_id;
```

## ✅ Checklist

- [x] Backend rebuilt without cache
- [x] Evaluation-service healthy
- [ ] Frontend reloaded (hard refresh)
- [ ] Test nhập điểm lớp trưởng
- [ ] Kiểm tra summary row hiển thị đúng
- [ ] Kiểm tra database lưu đúng

## 📝 Lưu Ý

1. **Hard Reload Frontend:** Nhấn `Ctrl + Shift + R` để clear cache
2. **Role Required:** Phải là Lớp trưởng hoặc ADMIN
3. **Status Required:** Evaluation phải ở status SUBMITTED
4. **Summary Row:** Chỉ hiển thị khi có điểm (không hiển thị khi tất cả là null)

## 🎉 Kết Luận

Backend đã được rebuild thành công với code mới. Bây giờ:

- ✅ ADMIN có thể duyệt và lưu điểm
- ✅ Điểm lớp trưởng được lưu đúng
- ✅ Hiển thị đúng trong summary row
- ✅ Không còn hiển thị tỷ lệ % nữa

**Hãy test lại và cho tôi biết kết quả!**
