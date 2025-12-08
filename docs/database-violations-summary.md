# Tóm Tắt Các Vi Phạm Chuẩn Hóa Database

## ✅ KẾT QUẢ TỔNG QUAN

- **1NF**: ✅ 17/17 bảng đạt (100%)
- **2NF**: ✅ 17/17 bảng đạt (100%)
- **3NF**: ⚠️ 10/17 bảng đạt (58.8%) - **7 bảng vi phạm**

---

## 📋 DANH SÁCH CÁC VI PHẠM 3NF

### 🔴 AUTH-SERVICE (1 vi phạm)

| Bảng    | Cột Vi Phạm  | Phụ Thuộc Vào  | Mô Tả                                                                |
| ------- | ------------ | -------------- | -------------------------------------------------------------------- |
| `users` | `class_code` | `student_code` | `class_code` có thể suy ra từ `student_code` (query student-service) |

---

### 🔴 STUDENT-SERVICE (2 vi phạm)

| Bảng       | Cột Vi Phạm                  | Phụ Thuộc Vào | Mô Tả                                                                           |
| ---------- | ---------------------------- | ------------- | ------------------------------------------------------------------------------- |
| `classes`  | `faculty_code`               | `major_code`  | `faculty_code` có thể suy ra từ `major_code` (qua bảng majors)                  |
| `students` | `major_code`, `faculty_code` | `class_code`  | `major_code` và `faculty_code` có thể suy ra từ `class_code` (qua bảng classes) |

---

### 🔴 EVALUATION-SERVICE (4 vi phạm)

| Bảng                 | Cột Vi Phạm     | Phụ Thuộc Vào | Mô Tả                                                                             |
| -------------------- | --------------- | ------------- | --------------------------------------------------------------------------------- |
| `evaluations`        | `academic_year` | `semester`    | `academic_year` có thể parse từ `semester` (ví dụ: "2024-2025-HK1" → "2024-2025") |
| `evaluation_periods` | `academic_year` | `semester`    | `academic_year` có thể parse từ `semester`                                        |
| `evaluation_history` | `actor_name`    | `actor_id`    | `actor_name` có thể lấy từ bảng users qua `actor_id`                              |
| `evidence_files`     | `file_url`      | `file_path`   | `file_url` có thể tính từ `file_path` (có quy tắc chuyển đổi)                     |

---

## 📊 TỔNG KẾT

**Tổng số vi phạm: 7 bảng**

- Auth-service: **1 vi phạm**
- Student-service: **2 vi phạm**
- Evaluation-service: **4 vi phạm**

---

## 💡 LƯU Ý

Tất cả các vi phạm này đều là **denormalization có chủ ý** để:

- ⚡ Tối ưu performance (tránh join/query nhiều bảng)
- 🚀 Giảm network calls giữa microservices
- 📈 Cải thiện tốc độ query

**Chấp nhận được** nếu có:

- ✅ Validation/constraints đảm bảo consistency
- ✅ Cơ chế đồng bộ dữ liệu
- ✅ Performance là ưu tiên
