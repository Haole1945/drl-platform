# Quy Tắc Validation cho Đánh Giá

## Tổng Quan

Hệ thống hỗ trợ 2 chế độ tạo đánh giá:
- **Lưu Nháp** (`asDraft = true`): Lưu tạm, cho phép thiếu thông tin
- **Tạo Đánh giá** (`asDraft = false`): Tạo đánh giá hoàn chỉnh, yêu cầu validation đầy đủ

## Validation Rules

### 1. Score (Điểm số)

#### Score Null
- **Cả 2 chế độ**: Nếu `score = null`, hệ thống tự động set `score = 0`
- **Lý do**: Đảm bảo luôn có giá trị số để tính toán, tránh lỗi null pointer

#### Score Âm (Negative)
- **Cả 2 chế độ**: ✅ **Cho phép** điểm âm
- **Lý do**: Một số tiêu chí có thể trừ điểm (ví dụ: vi phạm nội quy, thiếu buổi học)
- **Ví dụ**: 
  - Tiêu chí "Tham gia hoạt động": +5 điểm
  - Tiêu chí "Vi phạm nội quy": -10 điểm (có thể âm)

#### Score > MaxPoints
- **Cả 2 chế độ**: ❌ **Không cho phép** - phải throw error
- **Lý do**: Đảm bảo điểm không vượt quá giới hạn của tiêu chí (áp dụng cho cả lưu nháp và tạo đánh giá)

#### Score = 0
- **Cả 2 chế độ**: ✅ **Cho phép** điểm = 0
- **Lý do**: Có thể xảy ra trong thực tế (ví dụ: không đạt tiêu chí nào)

### 2. Total Score (Tổng điểm)

#### Total Score = 0
- **Cả 2 chế độ**: ✅ **Cho phép** tổng điểm = 0
- **Lý do**: Có thể xảy ra trong các trường hợp:
  - Sinh viên không đạt tiêu chí nào
  - Điểm cộng và điểm trừ cân bằng nhau
  - Chưa hoàn thành đánh giá

#### Total Score < 0
- **Cả 2 chế độ**: ✅ **Cho phép** tổng điểm âm
- **Lý do**: Nếu có nhiều tiêu chí trừ điểm, tổng điểm có thể âm

### 3. Evidence (Bằng chứng)

- **Cả 2 chế độ**: Không bắt buộc (có thể để trống)
- **Lý do**: Có thể thêm bằng chứng sau khi tạo đánh giá

### 4. Required Fields (Trường bắt buộc)

#### Cả 2 chế độ đều yêu cầu:
- `studentCode`: Mã sinh viên
- `semester`: Học kỳ
- `rubricId`: ID của rubric
- `details`: Danh sách chi tiết đánh giá (ít nhất 1 item)

## So Sánh Validation Rules

| Validation Rule | Lưu Nháp | Tạo Đánh giá |
|----------------|----------|--------------|
| **Score null → 0** | ✅ Auto set | ✅ Auto set |
| **Score âm** | ✅ Cho phép | ✅ Cho phép |
| **Score > maxPoints** | ❌ **Không cho phép** | ❌ **Không cho phép** |
| **Score = 0** | ✅ Cho phép | ✅ Cho phép |
| **Total score = 0** | ✅ Cho phép | ✅ Cho phép |
| **Total score < 0** | ✅ Cho phép | ✅ Cho phép |
| **Evidence** | Không bắt buộc | Không bắt buộc |
| **Required fields** | ✅ Yêu cầu | ✅ Yêu cầu |

## Ví Dụ Thực Tế

### Ví dụ 1: Đánh giá với điểm âm
```
Tiêu chí 1: Tham gia hoạt động → +5 điểm
Tiêu chí 2: Vi phạm nội quy → -10 điểm
Tổng điểm: -5 điểm ✅ Hợp lệ
```

### Ví dụ 2: Đánh giá với tổng điểm = 0
```
Tiêu chí 1: Tham gia hoạt động → +5 điểm
Tiêu chí 2: Vi phạm nội quy → -5 điểm
Tổng điểm: 0 điểm ✅ Hợp lệ
```

### Ví dụ 3: Score > maxPoints (không cho phép ở cả 2 chế độ)
```
Tiêu chí: Tối đa 10 điểm
Nhập: 15 điểm
Lưu Nháp: ❌ Lỗi "Score exceeds max score"
Tạo Đánh giá: ❌ Lỗi "Score exceeds max score"
```

## Implementation Details

### Backend (`EvaluationService.java`)
```java
// Default score to 0 if null
Double score = detailRequest.getScore();
if (score == null) {
    score = 0.0;
}

// Validate maxPoints for both draft and non-draft modes
if (score > criteria.getMaxPoints()) {
    throw new IllegalArgumentException(...);
}
// Negative scores are allowed in both modes
```

### Frontend (`new/page.tsx`)
```typescript
// Validate maxPoints for both draft and non-draft modes
const hasInvalidScores = criteriaWithSubCriteria.some(criterion => {
  return criterion.subCriteria.some(sub => {
    const score = subCriteriaScores[criterion.id]?.[sub.id] || 0;
    return score > sub.maxPoints; // Check max for both modes, allow negative
  });
});
```

## Lưu Ý

1. **Score null**: Luôn được auto-set thành 0, không cần check null trong business logic
2. **Score âm**: Được thiết kế để hỗ trợ các tiêu chí trừ điểm
3. **Total score = 0**: Có thể xảy ra trong thực tế, không nên validate
4. **MaxPoints validation**: Áp dụng cho cả "Lưu Nháp" và "Tạo Đánh giá" - không cho phép vượt quá maxPoints


