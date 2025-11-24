# TODO: Rejection History & Smart Resubmit

## 🎯 2 Yêu Cầu Chính

### 1. Hiển thị Lịch Sử Reject/Resubmit

**Vấn đề:** Chỉ thấy rejection reason hiện tại, không thấy lịch sử

**Cần làm:**

- ✅ Backend đã có `evaluation_history` table
- ⏳ Frontend cần fetch và hiển thị history
- ⏳ Tạo component Timeline để show history
- ⏳ Hiển thị: Ai reject, khi nào, lý do gì, phản hồi thế nào

### 2. Smart Resubmit - Quay Về Đúng Level

**Vấn đề:** Resubmit luôn về SUBMITTED, phải qua lại các level đã approve

**Ví dụ SAI (hiện tại):**

```
SUBMITTED → CLASS_APPROVED → FACULTY_APPROVED → REJECTED (CTSV)
                                                    ↓
                                              RESUBMIT
                                                    ↓
                                              SUBMITTED ❌ (phải qua lại Class, Faculty)
```

**Ví dụ ĐÚNG (mong muốn):**

```
SUBMITTED → CLASS_APPROVED → FACULTY_APPROVED → REJECTED (CTSV)
                                                    ↓
                                              RESUBMIT
                                                    ↓
                                              FACULTY_APPROVED ✅ (quay về CTSV luôn)
```

**Cần làm:**

- ⏳ Backend: Thêm field `last_rejection_level` vào Evaluation
- ⏳ Backend: Lưu level khi reject
- ⏳ Backend: Set đúng status khi resubmit dựa vào level
- ⏳ Database: Migration V7 để thêm column

## 📋 Implementation Plan

### Phase 1: History Display (Frontend - 1-2h)

1. Add `history` field to Evaluation type
2. Create `EvaluationHistory` component
3. Display in evaluation detail page
4. Show rejection reasons and responses

### Phase 2: Smart Resubmit (Backend - 2-3h)

1. Create migration V7: Add `last_rejection_level` column
2. Update `rejectEvaluation()`: Save rejection level
3. Update `resubmitEvaluation()`: Set smart status
4. Test all scenarios

## 🔧 Quick Implementation Guide

### Frontend (Phase 1)

```tsx
// 1. Add to types
interface EvaluationHistory {
  action: "REJECTED" | "RESUBMITTED";
  level: string;
  actorName: string;
  comment: string;
  createdAt: string;
}

// 2. Fetch history
const history = evaluation.history || [];

// 3. Display
<Card>
  <CardTitle>Lịch sử Từ chối & Nộp lại ({history.length})</CardTitle>
  {history.map((item) => (
    <div key={item.id}>
      {item.action === "REJECTED" && (
        <Alert variant="destructive">
          <strong>Bị từ chối ({item.level})</strong>
          <p>Lý do: {item.comment}</p>
          <small>
            {item.actorName} - {formatDate(item.createdAt)}
          </small>
        </Alert>
      )}
      {item.action === "RESUBMITTED" && (
        <Alert>
          <strong>Đã nộp lại</strong>
          <p>Phản hồi: {item.comment}</p>
        </Alert>
      )}
    </div>
  ))}
</Card>;
```

### Backend (Phase 2)

```java
// 1. Migration V7
ALTER TABLE evaluations ADD COLUMN last_rejection_level VARCHAR(20);

// 2. In rejectEvaluation()
evaluation.setLastRejectionLevel(oldStatus.getApprovalLevel());

// 3. In resubmitEvaluation()
String level = evaluation.getLastRejectionLevel();
if ("CLASS".equals(level)) {
    evaluation.setStatus(EvaluationStatus.SUBMITTED);
} else if ("FACULTY".equals(level)) {
    evaluation.setStatus(EvaluationStatus.CLASS_APPROVED);
} else if ("CTSV".equals(level)) {
    evaluation.setStatus(EvaluationStatus.FACULTY_APPROVED);
}
```

## ⚠️ Current Limitations

**Without Phase 2 (Smart Resubmit):**

- Students phải chờ approval lại từ các level đã approve
- Tốn thời gian không cần thiết
- Approvers phải review lại evaluation đã approve

**Recommendation:** Implement cả 2 phases để có trải nghiệm tốt nhất

## 📊 Impact

### With Phase 1 Only:

- ✅ Students thấy được lịch sử
- ✅ Hiểu rõ vấn đề
- ❌ Vẫn phải qua lại các level

### With Both Phases:

- ✅ Students thấy được lịch sử
- ✅ Hiểu rõ vấn đề
- ✅ Resubmit nhanh hơn
- ✅ Approvers không phải review lại

## 🎯 Priority

**Phase 1:** Can implement now (frontend only)
**Phase 2:** Should implement soon (requires backend + migration)

---

**Status:** 📝 Documented - Ready for Implementation
**Estimated Time:** 3-5 hours total
**Complexity:** Medium
