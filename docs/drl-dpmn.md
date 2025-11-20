flowchart TD
A[Sinh viên tự đánh giá & nộp minh chứng] --> B[Cố vấn/lớp duyệt]
B -->|Yêu cầu chỉnh sửa| A
B --> C[Khoa duyệt]
C -->|Trả về chỉnh sửa| A
C --> D[Phòng CTSV duyệt]
D -->|Phê duyệt| E[Học viện (HĐ) duyệt & khóa điểm]
D -->|Trả về| A
E --> F{Kháng nghị?}
F -->|Có| G[Tiếp nhận kháng nghị]
G --> H[Thẩm định & điều chỉnh]
H --> E
F -->|Không| I[Kết thúc & công bố]
