# Giải Thích: Denormalization Tối Ưu Performance Như Thế Nào?

## Tổng Quan

Denormalization là kỹ thuật **lưu trữ dữ liệu dư thừa** (redundant data) để tránh phải query/join nhiều bảng hoặc gọi API giữa các microservices. Điều này **đánh đổi storage space để lấy tốc độ**.

---

## 1. AUTH-SERVICE: `users.class_code` phụ thuộc vào `student_code`

### ❌ KHÔNG có denormalization (Normalize - phải query mỗi lần)

**Scenario**: Frontend cần hiển thị danh sách users với class_code

```sql
-- Query 1: Lấy users từ auth-service
SELECT id, username, email, student_code
FROM users
WHERE is_active = true;

-- Kết quả: 1000 users
```

**Sau đó phải query student-service cho MỖI user:**

```http
GET /api/students/{student_code}
GET /api/students/{student_code}
GET /api/students/{student_code}
... (1000 lần)
```

**Vấn đề:**

- ⏱️ **1000 network calls** giữa auth-service và student-service
- 🐌 **Thời gian**: 1000 × 50ms = **50 giây** (giả sử mỗi call mất 50ms)
- 💰 **Chi phí**: Tăng load cho student-service
- 🔄 **Phức tạp**: Phải xử lý async, error handling cho từng call

### ✅ CÓ denormalization (lưu `class_code` trong `users`)

```sql
-- Chỉ cần 1 query duy nhất
SELECT id, username, email, student_code, class_code
FROM users
WHERE is_active = true;

-- Kết quả: 1000 users với class_code sẵn có
```

**Lợi ích:**

- ⚡ **1 query duy nhất** - không cần network calls
- 🚀 **Thời gian**: ~10ms (chỉ query database)
- 📉 **Giảm 99.9% network calls** (từ 1000 → 0)
- ✅ **Đơn giản**: Không cần xử lý async, error handling

**Trade-off:**

- 💾 Tăng storage: 1000 users × 20 bytes = 20KB (không đáng kể)
- 🔄 Cần đồng bộ khi student thay đổi class (nhưng ít khi xảy ra)

---

## 2. STUDENT-SERVICE: `students.major_code`, `faculty_code` phụ thuộc vào `class_code`

### ❌ KHÔNG có denormalization (phải JOIN)

**Scenario**: Lấy danh sách students với major và faculty info

```sql
-- Query phức tạp với nhiều JOIN
SELECT
    s.student_code,
    s.full_name,
    s.class_code,
    c.major_code,
    m.faculty_code,
    f.name as faculty_name
FROM students s
JOIN classes c ON s.class_code = c.code
JOIN majors m ON c.major_code = m.code
JOIN faculties f ON m.faculty_code = f.code
WHERE s.is_active = true;

-- Execution plan:
-- 1. Scan students table (1000 rows)
-- 2. Join với classes (100 rows) - 1000 lookups
-- 3. Join với majors (50 rows) - 1000 lookups
-- 4. Join với faculties (10 rows) - 1000 lookups
-- Tổng: ~3000 index lookups
```

**Vấn đề:**

- 🐌 **Chậm**: Nhiều JOIN operations
- 💾 **Tốn tài nguyên**: Database phải scan nhiều bảng
- 📊 **Phức tạp**: Query plan phức tạp, khó optimize

### ✅ CÓ denormalization (lưu `major_code`, `faculty_code` trong `students`)

```sql
-- Query đơn giản, không cần JOIN
SELECT
    student_code,
    full_name,
    class_code,
    major_code,      -- Đã có sẵn
    faculty_code,    -- Đã có sẵn
    (SELECT name FROM faculties WHERE code = students.faculty_code) as faculty_name
FROM students
WHERE is_active = true;

-- Hoặc nếu chỉ cần code, không cần JOIN gì cả:
SELECT
    student_code,
    full_name,
    class_code,
    major_code,
    faculty_code
FROM students
WHERE is_active = true;
```

**Lợi ích:**

- ⚡ **Nhanh hơn 3-5 lần**: Chỉ scan 1 bảng
- 📉 **Giảm I/O**: Ít disk reads
- 🎯 **Đơn giản**: Query plan đơn giản, dễ optimize
- 💾 **Index hiệu quả**: Có thể index trên `major_code`, `faculty_code` trực tiếp

**Ví dụ thực tế:**

```
Query với JOIN:     ~150ms (3000 index lookups)
Query không JOIN:   ~30ms  (chỉ scan students table)
→ Nhanh hơn 5 lần!
```

---

## 3. EVALUATION-SERVICE: `academic_year` phụ thuộc vào `semester`

### ❌ KHÔNG có denormalization (phải parse mỗi lần)

**Scenario**: Query evaluations theo academic_year

```sql
-- Phải parse semester mỗi lần
SELECT *
FROM evaluations
WHERE SUBSTRING(semester, 1, 9) = '2024-2025';  -- Parse từ "2024-2025-HK1"

-- Hoặc trong application code:
List<Evaluation> evals = repository.findBySemesterContaining("2024-2025");
// Sau đó filter trong memory
evals = evals.stream()
    .filter(e -> e.getSemester().startsWith("2024-2025"))
    .collect(Collectors.toList());
```

**Vấn đề:**

- 🐌 **Chậm**: Phải parse string mỗi lần
- ❌ **Không thể index**: Không thể tạo index trên parsed value
- 🔍 **Full table scan**: Database phải scan tất cả rows để parse

### ✅ CÓ denormalization (lưu `academic_year` riêng)

```sql
-- Query nhanh với index
SELECT *
FROM evaluations
WHERE academic_year = '2024-2025';

-- Có thể tạo index:
CREATE INDEX idx_evaluation_academic_year ON evaluations(academic_year);
```

**Lợi ích:**

- ⚡ **Nhanh hơn 10-100 lần**: Sử dụng index thay vì full scan
- 📊 **Có thể index**: Index trên `academic_year` hoạt động hiệu quả
- 🎯 **Query đơn giản**: Không cần string manipulation

**Ví dụ thực tế:**

```
Query parse string:     ~500ms (full table scan, 10000 rows)
Query với index:        ~5ms   (index lookup)
→ Nhanh hơn 100 lần!
```

---

## 4. EVALUATION-SERVICE: `evaluation_history.actor_name` phụ thuộc vào `actor_id`

### ❌ KHÔNG có denormalization (phải JOIN hoặc query API)

**Scenario**: Hiển thị lịch sử đánh giá với tên người thực hiện

**Option 1: JOIN với users table (nếu cùng database)**

```sql
SELECT
    eh.id,
    eh.action,
    eh.from_status,
    eh.to_status,
    u.full_name as actor_name  -- JOIN
FROM evaluation_history eh
LEFT JOIN users u ON eh.actor_id = u.id
WHERE eh.evaluation_id = 123;
```

**Vấn đề:**

- 🔗 **Phụ thuộc**: Phải có access đến users table (có thể khác database trong microservices)
- 🐌 **Chậm**: JOIN operation

**Option 2: Query API (microservices)**

```http
GET /api/evaluation-history/123
→ Trả về: { actor_id: 456, ... }

GET /api/users/456  -- Phải query thêm
→ Trả về: { full_name: "Nguyễn Văn A" }
```

**Vấn đề:**

- 🌐 **2 network calls** cho mỗi history record
- ⏱️ **Chậm**: Network latency
- 💰 **Tốn tài nguyên**: Tăng load cho auth-service

### ✅ CÓ denormalization (lưu `actor_name` trong `evaluation_history`)

```sql
-- Chỉ cần 1 query
SELECT
    id,
    action,
    from_status,
    to_status,
    actor_name  -- Đã có sẵn
FROM evaluation_history
WHERE evaluation_id = 123;
```

**Lợi ích:**

- ⚡ **Nhanh**: Không cần JOIN hoặc API call
- 📊 **Snapshot data**: Lưu tên tại thời điểm thực hiện (quan trọng cho audit trail)
- ✅ **Độc lập**: Không phụ thuộc vào users table

**Lưu ý đặc biệt:**

- 📸 **Audit trail**: Lưu `actor_name` là đúng vì nếu user đổi tên sau này, lịch sử vẫn giữ nguyên tên cũ
- ✅ **Best practice**: Trong audit/history tables, nên lưu snapshot data

---

## 5. EVALUATION-SERVICE: `evidence_files.file_url` phụ thuộc vào `file_path`

### ❌ KHÔNG có denormalization (phải tính toán mỗi lần)

**Scenario**: Trả về danh sách files cho frontend

```java
// Trong service code
List<EvidenceFile> files = repository.findByEvaluationId(evalId);
files.forEach(file -> {
    // Phải tính toán mỗi lần
    file.setFileUrl("/api/files" + file.getFilePath());
});
```

**Vấn đề:**

- 🔄 **Tính toán lặp lại**: Phải convert mỗi lần query
- 🐌 **Chậm**: String manipulation trong application code
- ❌ **Không thể index**: Không thể query trực tiếp trên URL

### ✅ CÓ denormalization (lưu `file_url` sẵn)

```sql
-- Query trực tiếp với URL
SELECT file_url
FROM evidence_files
WHERE evaluation_id = 123;

-- Có thể query/search trên URL
SELECT *
FROM evidence_files
WHERE file_url LIKE '%evidence%';
```

**Lợi ích:**

- ⚡ **Nhanh**: Không cần tính toán
- 🔍 **Có thể search**: Có thể query/search trên URL
- ✅ **Đơn giản**: Frontend nhận URL sẵn, không cần xử lý

---

## So Sánh Tổng Quan

### Performance Metrics

| Metric              | Normalize (Không denormalize) | Denormalize             |
| ------------------- | ----------------------------- | ----------------------- |
| **Query Time**      | 100-500ms (JOIN/API calls)    | 10-50ms (single query)  |
| **Network Calls**   | 1-1000 calls                  | 0 calls                 |
| **Database Load**   | High (nhiều JOIN)             | Low (single table scan) |
| **Code Complexity** | High (async, error handling)  | Low (simple query)      |
| **Storage**         | Low                           | +5-10% (không đáng kể)  |

### Ví Dụ Thực Tế: Lấy 1000 students với class, major, faculty info

**Normalize:**

```
1. Query students: 50ms
2. Query classes (1000 times): 50,000ms
3. Query majors (1000 times): 50,000ms
4. Query faculties (1000 times): 50,000ms
Tổng: ~150 giây
```

**Denormalize:**

```
1. Query students (với major_code, faculty_code): 30ms
Tổng: 30ms
→ Nhanh hơn 5000 lần!
```

---

## Kết Luận

Denormalization tối ưu performance bằng cách:

1. **Giảm Network Calls**: Từ hàng trăm/thousands → 0
2. **Giảm JOIN Operations**: Từ nhiều JOIN → single table scan
3. **Tận dụng Index**: Có thể index trên denormalized columns
4. **Đơn giản hóa Code**: Không cần xử lý async, error handling phức tạp
5. **Giảm Latency**: Từ 100-500ms → 10-50ms

**Trade-off:**

- 💾 Tăng storage (nhưng không đáng kể: 5-10%)
- 🔄 Cần đồng bộ dữ liệu (nhưng ít khi thay đổi)
- ⚠️ Risk of inconsistency (nhưng có thể quản lý bằng validation)

**Khi nào nên denormalize:**

- ✅ Read-heavy workloads (đọc nhiều hơn ghi)
- ✅ Performance là ưu tiên
- ✅ Dữ liệu ít thay đổi
- ✅ Microservices architecture (giảm network calls)

**Khi nào KHÔNG nên denormalize:**

- ❌ Write-heavy workloads (ghi nhiều hơn đọc)
- ❌ Dữ liệu thay đổi thường xuyên
- ❌ Storage là constraint quan trọng
- ❌ Data consistency là ưu tiên số 1
