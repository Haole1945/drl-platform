# Tóm Tắt Workflow Duyệt Đánh Giá

## 🔄 Quy Trình Duyệt

```
1. STUDENT nộp
   ↓
2. SUBMITTED: Chờ Lớp trưởng duyệt
   ↓
3. CLASS_APPROVED: Chờ Cố vấn học tập duyệt
   ↓
4. ADVISOR_APPROVED: Chờ Khoa duyệt
   ↓
5. FACULTY_APPROVED: ✅ HOÀN TẤT
```

## 📋 Chi Tiết

### Bước 1: Sinh viên nộp

- Status: `DRAFT` → `SUBMITTED`
- Người thực hiện: **STUDENT**

### Bước 2: Duyệt cấp LỚP

- Status: `SUBMITTED` → `CLASS_APPROVED`
- Người duyệt: **CLASS_MONITOR** (Lớp trưởng)
- **Lưu ý**: Chỉ cần Lớp trưởng duyệt → tự động chuyển sang `CLASS_APPROVED`

### Bước 3: Duyệt cấp CỐ VẤN

- Status: `CLASS_APPROVED` → `ADVISOR_APPROVED`
- Người duyệt: **ADVISOR** (Cố vấn học tập)

### Bước 4: Duyệt cấp KHOA (Final)

- Status: `ADVISOR_APPROVED` → `FACULTY_APPROVED`
- Người duyệt: **FACULTY_INSTRUCTOR** (Giảng viên khoa)
- **Kết quả**: ✅ **DUYỆT HOÀN TẤT**

---

## ❌ Rejection

Có thể reject ở bất kỳ level nào:

- Reject ở CLASS → Resubmit → Quay lại SUBMITTED (cần Lớp trưởng approve lại)
- Reject ở ADVISOR → Resubmit → Skip CLASS, đi thẳng CLASS_APPROVED
- Reject ở FACULTY → Resubmit → Skip CLASS & ADVISOR, đi thẳng ADVISOR_APPROVED

---

## ✅ Tóm Tắt

**Thứ tự:**

1. **LỚP** (Lớp trưởng) - chỉ cần Lớp trưởng duyệt
2. **CỐ VẤN HỌC TẬP** (Cố vấn)
3. **KHOA** (Giảng viên khoa) - Final

**Đặc điểm:**

- ✅ Cấp LỚP chỉ cần Lớp trưởng duyệt (track trong `class_approvals` table)
- ✅ 3 cấp duyệt tuần tự
- ✅ Smart resubmit (skip levels đã pass)
