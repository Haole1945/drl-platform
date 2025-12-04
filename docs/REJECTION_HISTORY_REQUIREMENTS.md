# Rejection History & Smart Resubmit Requirements

## Requirements

### 1. Display Rejection/Resubmit History

**User Story:** Khi evaluation bị reject và resubmit nhiều lần, cần hiển thị đầy đủ lịch sử

**Current State:**

- ❌ Chỉ hiển thị rejection reason hiện tại
- ❌ Không thấy lịch sử reject/resubmit trước đó
- ❌ Không biết đã resubmit bao nhiêu lần

**Desired State:**

- ✅ Hiển thị tất cả lần reject với reason
- ✅ Hiển thị tất cả lần resubmit với response
- ✅ Hiển thị timeline rõ ràng
- ✅ Hiển thị ai reject, khi nào, ở level nào

**UI Mockup:**

```
┌─────────────────────────────────────────────────────┐
│ 📜 Lịch sử Từ chối & Nộp lại                       │
├─────────────────────────────────────────────────────┤
│ 🔴 Lần 2: Bị từ chối (Faculty Level)               │
│    Người từ chối: GV. Nguyễn Văn A                 │
│    Thời gian: 24/11/2024 10:30                     │
│    Lý do: Thiếu minh chứng tiêu chí 2.1            │
│                                                     │
│ 🔄 Lần 2: Nộp lại                                  │
│    Thời gian: 24/11/2024 14:00                     │
│    Phản hồi: Đã bổ sung minh chứng cho 2.1         │
│                                                     │
│ 🔴 Lần 1: Bị từ chối (Class Level)                 │
│    Người từ chối: Lớp trưởng Trần Thị B            │
│    Thời gian: 20/11/2024 15:00                     │
│    Lý do: Điểm tiêu chí 1.1 quá cao                │
│                                                     │
│ 🔄 Lần 1: Nộp lại                                  │
│    Thời gian: 21/11/2024 09:00                     │
│    Phản hồi: Đã điều chỉnh điểm tiêu chí 1.1       │
└─────────────────────────────────────────────────────┘
```

### 2. Smart Resubmit - Return to Rejection Level

**User Story:** Khi resubmit, evaluation phải quay về đúng level đã reject, không cần qua lại các level đã approve

**Current State:**

```
Flow hiện tại (SAI):
SUBMITTED → CLASS_APPROVED → FACULTY_APPROVED → REJECTED (CTSV)
                                                    ↓
                                              RESUBMIT
                                                    ↓
                                              SUBMITTED (phải qua lại Class, Faculty)
```

**Desired State:**

```
Flow mong muốn (ĐÚNG):
SUBMITTED → CLASS_APPROVED → FACULTY_APPROVED → REJECTED (CTSV)
                                                    ↓
                                              RESUBMIT
                                                    ↓
                                              FACULTY_APPROVED (quay về CTSV luôn)
```

**Logic:**

- Reject ở CLASS level → Resubmit → Status = SUBMITTED
- Reject ở FACULTY level → Resubmit → Status = CLASS_APPROVED
- Reject ở CTSV level → Resubmit → Status = FACULTY_APPROVED

## Implementation Plan

### Phase 1: Display History (Frontend Only)

#### Step 1: Add History to Types

```typescript
// frontend/src/types/evaluation.ts
export interface EvaluationHistory {
  id: number;
  action: "SUBMITTED" | "APPROVED" | "REJECTED" | "RESUBMITTED";
  fromStatus: string;
  toStatus: string;
  level?: string; // CLASS, FACULTY, CTSV
  actorId?: number;
  actorName?: string;
  comment?: string;
  createdAt: string;
}

export interface Evaluation {
  // ... existing fields
  history?: EvaluationHistory[];
  resubmissionCount?: number;
}
```

#### Step 2: Fetch History from Backend

```typescript
// Backend already has history, just need to include in DTO
// Check if EvaluationDTO includes history field
```

#### Step 3: Display History Component

```tsx
// frontend/src/components/EvaluationHistory.tsx
export function EvaluationHistory({
  history,
}: {
  history: EvaluationHistory[];
}) {
  const rejections = history.filter((h) => h.action === "REJECTED");
  const resubmissions = history.filter((h) => h.action === "RESUBMITTED");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử Từ chối & Nộp lại</CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline>
          {history.map((item) => (
            <TimelineItem key={item.id}>
              {item.action === "REJECTED" && <RejectionItem item={item} />}
              {item.action === "RESUBMITTED" && (
                <ResubmissionItem item={item} />
              )}
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
}
```

### Phase 2: Smart Resubmit (Backend Changes)

#### Step 1: Track Rejection Level

```java
// backend/evaluation-service/src/main/java/ptit/drl/evaluation/entity/Evaluation.java
@Column(name = "last_rejection_level")
private String lastRejectionLevel; // CLASS, FACULTY, CTSV
```

#### Step 2: Update Reject Logic

```java
// EvaluationService.rejectEvaluation()
public EvaluationDTO rejectEvaluation(Long id, String reason, ...) {
    // ... existing code

    // Track which level rejected
    String rejectionLevel = oldStatus.getApprovalLevel();
    evaluation.setLastRejectionLevel(rejectionLevel);
    evaluation.setStatus(EvaluationStatus.REJECTED);

    // ... rest of code
}
```

#### Step 3: Update Resubmit Logic

```java
// EvaluationService.resubmitEvaluation()
public EvaluationDTO resubmitEvaluation(Long id, ...) {
    // ... existing code

    // Smart status based on rejection level
    String lastRejectionLevel = evaluation.getLastRejectionLevel();
    EvaluationStatus newStatus;

    if ("CLASS".equals(lastRejectionLevel)) {
        newStatus = EvaluationStatus.SUBMITTED; // Go back to Class level
    } else if ("FACULTY".equals(lastRejectionLevel)) {
        newStatus = EvaluationStatus.CLASS_APPROVED; // Skip Class, go to Faculty
    } else if ("CTSV".equals(lastRejectionLevel)) {
        newStatus = EvaluationStatus.FACULTY_APPROVED; // Skip Class & Faculty, go to CTSV
    } else {
        newStatus = EvaluationStatus.SUBMITTED; // Default
    }

    evaluation.setStatus(newStatus);

    // ... rest of code
}
```

#### Step 4: Database Migration

```sql
-- V7__add_rejection_level.sql
ALTER TABLE evaluations
ADD COLUMN last_rejection_level VARCHAR(20);

CREATE INDEX idx_evaluations_rejection_level
ON evaluations(last_rejection_level);
```

## Testing Scenarios

### Scenario 1: Single Rejection at Class Level

1. Student submits → SUBMITTED
2. Class Monitor rejects → REJECTED (level: CLASS)
3. Student resubmits → SUBMITTED (back to Class)
4. Class Monitor approves → CLASS_APPROVED

### Scenario 2: Rejection at Faculty Level

1. Student submits → SUBMITTED
2. Class approves → CLASS_APPROVED
3. Faculty rejects → REJECTED (level: FACULTY)
4. Student resubmits → CLASS_APPROVED (skip Class, go to Faculty)
5. Faculty approves → FACULTY_APPROVED

### Scenario 3: Multiple Rejections

1. Submit → CLASS_APPROVED → FACULTY_APPROVED → REJECTED (CTSV)
2. Resubmit → FACULTY_APPROVED (skip Class & Faculty)
3. CTSV rejects again → REJECTED (CTSV)
4. Resubmit → FACULTY_APPROVED (skip Class & Faculty again)
5. CTSV approves → CTSV_APPROVED

### Scenario 4: History Display

- Should show all 3 rejections
- Should show all 3 resubmissions
- Should show reasons and responses
- Should show who rejected and when

## Benefits

### For Students:

- ✅ See full history of rejections
- ✅ Understand what was wrong each time
- ✅ Faster resubmit (skip approved levels)
- ✅ Less waiting time

### For Approvers:

- ✅ See history of previous rejections
- ✅ See how student responded
- ✅ Make better decisions
- ✅ Less duplicate work

### For System:

- ✅ More efficient workflow
- ✅ Better audit trail
- ✅ Clear accountability
- ✅ Improved user experience

## Priority

**Phase 1 (History Display):** High - Can implement now (frontend only)
**Phase 2 (Smart Resubmit):** High - Requires backend changes + migration

## Estimated Time

- Phase 1: 1-2 hours (frontend component + integration)
- Phase 2: 2-3 hours (backend logic + migration + testing)
- Total: 3-5 hours

## Status

⏳ **Pending Implementation**

- Phase 1: Ready to start
- Phase 2: Requires backend changes

---

**Next Steps:**

1. Implement Phase 1 (History Display)
2. Create backend migration for Phase 2
3. Update backend logic
4. Test all scenarios
5. Deploy and monitor
