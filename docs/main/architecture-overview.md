# 🏗️ Tổng quan kiến trúc hệ thống DRL Platform

## 1. Bối cảnh & mục tiêu

Hệ thống **Điểm Rèn Luyện (DRL)** được xây dựng cho sinh viên Học viện Công nghệ Bưu chính Viễn thông (PTIT), giúp số hóa toàn bộ quy trình chấm, duyệt và công bố điểm rèn luyện của sinh viên, bao gồm:

- Sinh viên tự đánh giá và nộp minh chứng.
- Cố vấn học tập và lớp duyệt.
- Khoa duyệt và tổng hợp.
- Phòng CTSV phê duyệt.
- Hội đồng Học viện chốt điểm và khóa sổ.

Hệ thống hướng đến:

- **Tự động hóa quy trình** đánh giá, duyệt, khiếu nại.
- **Phân tán dữ liệu** theo từng domain (microservices).
- **Hỗ trợ AI trong xác thực minh chứng** ở các giai đoạn sau.

---

## 2. Lý do chọn kiến trúc Microservices

| Tiêu chí            | Microservices                            | Monolith                              |
| ------------------- | ---------------------------------------- | ------------------------------------- |
| Độc lập triển khai  | ✅ Mỗi service có thể build/deploy riêng | ❌ Triển khai toàn bộ cùng lúc        |
| Mở rộng linh hoạt   | ✅ Scale từng service tùy nhu cầu        | ❌ Scale nguyên khối                  |
| Quản lý domain      | ✅ Mỗi team phụ trách 1 domain           | ❌ Toàn bộ dính liền                  |
| Giới hạn lỗi        | ✅ Service crash không làm sập hệ thống  | ❌ Dễ kéo theo toàn bộ hệ thống       |
| Công nghệ linh hoạt | ✅ BE/FE khác nhau tùy team              | ❌ Phụ thuộc ngôn ngữ/framework chung |

---

## 3. Kiến trúc tổng thể tuần 1
