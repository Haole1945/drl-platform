# Thứ Tự Duyệt Đánh Giá Điểm Rèn Luyện

## 🔄 Workflow Diagram

```
┌─────────┐
│  DRAFT  │  ← Sinh viên tạo và chỉnh sửa
└────┬────┘
     │ Submit
     ↓
┌───────────┐
│ SUBMITTED │  ← Chờ Lớp trưởng VÀ Đại diện đoàn duyệt (cả 2 phải đồng ý)
└─────┬─────┘
      │ Cả 2 approve
      ↓
┌─────────────────┐
│ CLASS_APPROVED  │  ← Đã duyệt cấp LỚP, chờ Cố vấn học tập duyệt
└────────┬────────┘
         │ Approve
         ↓
┌──────────────────┐
│ ADVISOR_APPROVED │  ← Đã duyệt cấp CỐ VẤN, chờ Khoa duyệt
└────────┬─────────┘
         │ Approve
         ↓
┌──────────────────┐
│ FACULTY_APPROVED │  ← ✅ DUYỆT HOÀN TẤT (Final)
└──────────────────┘

     ↓ (Reject ở bất kỳ level nào)
┌──────────┐
│ REJECTED │  ← Từ chối, sinh viên có thể resubmit
└────┬─────┘
     │ Resubmit
     └──────→ (Quay lại SUBMITTED hoặc skip level)
```

---

## 📋 Thứ Tự Duyệt (3 Cấp)

### **Cấp 1: LỚP (CLASS)** - Cần cả 2 người duyệt

- **Status**: `SUBMITTED` → `CLASS_APPROVED`
- **Người duyệt** (cả 2 phải đồng ý):
  - **CLASS_MONITOR** (Lớp trưởng)
  - **UNION_REPRESENTATIVE** (Đại diện đoàn)
- **Logic**: Cả 2 người phải approve riêng biệt, khi đủ cả 2 → chuyển sang `CLASS_APPROVED`
- **Quyền**: `EVALUATION_APPROVE_CLASS`

### **Cấp 2: CỐ VẤN HỌC TẬP (ADVISOR)**

- **Status**: `CLASS_APPROVED` → `ADVISOR_APPROVED`
- **Người duyệt**:
  - **ADVISOR** (Cố vấn học tập)
- **Quyền**: `EVALUATION_APPROVE` (ADVISOR role)

### **Cấp 3: KHOA (FACULTY)** - Final Approval

- **Status**: `ADVISOR_APPROVED` → `FACULTY_APPROVED`
- **Người duyệt**:
  - **FACULTY_INSTRUCTOR** (Giảng viên khoa)
- **Quyền**: `EVALUATION_APPROVE_FACULTY`
- **Kết quả**: ✅ **DUYỆT HOÀN TẤT** (Final approval)

---

## 🔄 Các Trạng Thái

| Status             | Mô Tả                                         | Có Thể Làm Gì                            |
| ------------------ | --------------------------------------------- | ---------------------------------------- |
| `DRAFT`            | Nháp, đang chỉnh sửa                          | ✅ Edit, ✅ Submit                       |
| `SUBMITTED`        | Đã nộp, chờ Lớp trưởng và Đại diện đoàn duyệt | ✅ Approve (CLASS - cần cả 2), ✅ Reject |
| `CLASS_APPROVED`   | Đã duyệt LỚP, chờ Cố vấn học tập duyệt        | ✅ Approve (ADVISOR), ✅ Reject          |
| `ADVISOR_APPROVED` | Đã duyệt CỐ VẤN, chờ Khoa duyệt               | ✅ Approve (FACULTY), ✅ Reject          |
| `FACULTY_APPROVED` | ✅ **DUYỆT HOÀN TẤT**                         | ❌ Không thể thay đổi                    |
| `REJECTED`         | Bị từ chối                                    | ✅ Resubmit                              |

---

## ❌ Rejection (Từ Chối)

- **Có thể reject ở bất kỳ level nào**: CLASS, ADVISOR, hoặc FACULTY
- **Phải có lý do**: `rejectionReason` (required)
- **Lưu level reject**: `lastRejectionLevel` (để smart resubmit)
- **Sau khi reject**: Status → `REJECTED`

---

## 🔄 Resubmission (Nộp Lại)

Sau khi bị reject, sinh viên có thể **resubmit** với **Smart Resubmit**:

### Smart Resubmit Logic:

1. **Reject ở CLASS** → Resubmit → Quay lại `SUBMITTED` (duyệt lại từ CLASS - cần cả 2 người)
2. **Reject ở ADVISOR** → Resubmit → Skip CLASS, đi thẳng `CLASS_APPROVED` (duyệt lại từ ADVISOR)
3. **Reject ở FACULTY** → Resubmit → Skip CLASS & ADVISOR, đi thẳng `ADVISOR_APPROVED` (duyệt lại từ FACULTY)

**Lý do**: Tiết kiệm thời gian, không cần duyệt lại các level đã pass.

---

## 📊 Ví Dụ Workflow

### Case 1: Duyệt Thành Công

```
DRAFT → SUBMITTED → (Lớp trưởng + Đại diện đoàn approve) → CLASS_APPROVED → ADVISOR_APPROVED → FACULTY_APPROVED ✅
```

### Case 2: Bị Reject ở CLASS

```
DRAFT → SUBMITTED → REJECTED → (Sửa) → SUBMITTED → (Cả 2 approve lại) → CLASS_APPROVED → ...
```

### Case 3: Bị Reject ở ADVISOR

```
... → CLASS_APPROVED → REJECTED → (Sửa) → CLASS_APPROVED → ADVISOR_APPROVED → ...
```

### Case 4: Bị Reject ở FACULTY

```
... → ADVISOR_APPROVED → REJECTED → (Sửa) → ADVISOR_APPROVED → FACULTY_APPROVED ✅
```

---

## 🔐 Permissions

| Action          | Required Permission          | Role                                               |
| --------------- | ---------------------------- | -------------------------------------------------- |
| Approve CLASS   | `EVALUATION_APPROVE_CLASS`   | CLASS_MONITOR hoặc UNION_REPRESENTATIVE (cần cả 2) |
| Approve ADVISOR | `EVALUATION_APPROVE`         | ADVISOR                                            |
| Approve FACULTY | `EVALUATION_APPROVE_FACULTY` | FACULTY_INSTRUCTOR                                 |
| Reject          | Same as approve level        | Same as approve level                              |

---

## 📝 API Endpoints

### Submit

```http
POST /api/evaluations/{id}/submit
```

DRAFT → SUBMITTED

### Approve

```http
POST /api/evaluations/{id}/approve
Body: { "comment": "..." }
```

SUBMITTED → CLASS_APPROVED → FACULTY_APPROVED → CTSV_APPROVED

### Reject

```http
POST /api/evaluations/{id}/reject
Body: { "reason": "..." }
```

Any → REJECTED

### Resubmit

```http
POST /api/evaluations/{id}/resubmit
Body: { "responseToRejection": "...", "details": [...] }
```

REJECTED → SUBMITTED (hoặc skip levels)

---

## 🎯 Tóm Tắt

**Thứ tự duyệt:**

1. **LỚP (CLASS)** - Đầu tiên (cần cả Lớp trưởng VÀ Đại diện đoàn duyệt)
2. **CỐ VẤN HỌC TẬP (ADVISOR)** - Thứ hai
3. **KHOA (FACULTY)** - Cuối cùng (Final)

**Đặc điểm:**

- ✅ 3 cấp duyệt tuần tự
- ✅ Cấp LỚP cần cả 2 người duyệt (Lớp trưởng + Đại diện đoàn)
- ✅ Có thể reject ở bất kỳ level nào
- ✅ Smart resubmit (skip levels đã pass)
- ✅ Track rejection level để optimize workflow
- ✅ Track từng approval riêng biệt ở cấp LỚP (class_approvals table)
