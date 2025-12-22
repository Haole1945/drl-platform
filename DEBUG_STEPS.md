# 🔍 Debug: Điểm Lớp Trưởng Không Lưu

## Bước 1: Kiểm Tra Browser Console

Mở DevTools (F12) và làm theo:

1. Vào tab **Console**
2. Reload trang evaluation detail
3. Tìm các log có `[DEBUG]`
4. Copy và gửi cho tôi

## Bước 2: Kiểm Tra Network Request

1. Mở DevTools (F12) → Tab **Network**
2. Nhập điểm lớp trưởng
3. Nhấn "Duyệt"
4. Tìm request `PUT /api/evaluations/{id}/approve`
5. Click vào request đó
6. Xem:
   - **Request Payload** (dữ liệu gửi đi)
   - **Response** (dữ liệu trả về)
7. Copy và gửi cho tôi

## Bước 3: Kiểm Tra Database

Chạy lệnh này để xem điểm trong database:

```bash
docker exec drl-postgres psql -U drl -d drl_evaluation -c "SELECT e.id, e.status, ed.criteria_id, ed.self_score, ed.class_monitor_score, ed.advisor_score FROM evaluations e JOIN evaluation_details ed ON e.id = ed.evaluation_id WHERE e.id = 1 ORDER BY ed.criteria_id;"
```

## Bước 4: Kiểm Tra Backend Logs

```bash
docker logs drl-evaluation-service --tail 100 | Select-String -Pattern "approve|score|DEBUG"
```

## Câu Hỏi Debug:

1. **Bạn đang dùng role gì?** (ADMIN, CLASS_MONITOR, ADVISOR?)
2. **Evaluation status là gì?** (SUBMITTED, CLASS_APPROVED?)
3. **Có thấy input field để nhập điểm không?** (Có/Không)
4. **Khi nhập điểm, có thấy số trong ô input không?** (Có/Không)
5. **Khi nhấn "Duyệt", có thấy dialog xác nhận không?** (Có/Không)
6. **Sau khi duyệt, có thông báo thành công không?** (Có/Không)
7. **Có thấy summary row (dòng cuối bảng) không?** (Có/Không)

Hãy trả lời các câu hỏi trên và gửi cho tôi kết quả từ các bước kiểm tra!
