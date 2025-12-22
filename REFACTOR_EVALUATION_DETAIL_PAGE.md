# 📦 Refactor: Chia nhỏ Evaluation Detail Page

## Vấn đề hiện tại

File `frontend/src/app/evaluations/[id]/page.tsx` quá dài (>1000 dòng), khó maintain và debug.

## Kế hoạch chia nhỏ

### 1. **EvaluationHeader.tsx**

Hiển thị thông tin header của evaluation:

- Tên sinh viên
- Học kỳ
- Trạng thái
- Tổng điểm
- Xếp loại

### 2. **EvaluationScoreTable.tsx** ⭐ (Quan trọng - chứa bug hiển thị điểm)

Hiển thị bảng điểm chi tiết:

- Các tiêu chí
- Điểm tối đa
- Điểm tự chấm
- Điểm lớp trưởng
- Điểm cố vấn
- Bằng chứng

### 3. **EvaluationActions.tsx**

Các nút action:

- Duyệt
- Từ chối
- Chỉnh sửa
- Khiếu nại

### 4. **ApprovalDialog.tsx**

Dialog nhập điểm và comment khi duyệt

### 5. **RejectionDialog.tsx**

Dialog nhập lý do từ chối

### 6. **EvaluationHistory.tsx** (Đã có)

Hiển thị lịch sử duyệt

## Ưu tiên

**Ưu tiên 1:** Tạo `EvaluationScoreTable.tsx` để fix bug hiển thị điểm

**Ưu tiên 2:** Tạo các component khác để giảm độ phức tạp

## Lợi ích

✅ Dễ đọc và maintain
✅ Dễ debug (tìm bug nhanh hơn)
✅ Dễ test
✅ Có thể reuse components
✅ Giảm độ phức tạp của file chính

## Bắt đầu từ đâu?

Tôi sẽ bắt đầu với `EvaluationScoreTable.tsx` vì:

1. Đây là nơi có bug hiển thị điểm
2. Là phần phức tạp nhất
3. Sau khi tách ra, sẽ dễ fix bug hơn

Bạn có muốn tôi bắt đầu refactor không?
