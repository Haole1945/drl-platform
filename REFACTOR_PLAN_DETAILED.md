# 🔧 Kế Hoạch Refactor Chi Tiết - Evaluation Detail Page

## 📊 Tổng Quan

**File hiện tại:** `frontend/src/app/evaluations/[id]/page.tsx` (~1000+ dòng)

**Mục tiêu:** Chia thành các component nhỏ, dễ maintain, và fix bug hiển thị điểm

## 🎯 Các Component Sẽ Tạo

### 1. Folder Structure

```
frontend/src/app/evaluations/[id]/
├── page.tsx (Main page - sẽ giảm xuống ~200 dòng)
└── components/
    ├── EvaluationHeader.tsx
    ├── EvaluationScoreTable.tsx ⭐ (Chứa bug)
    ├── EvaluationActions.tsx
    ├── ApprovalDialog.tsx
    ├── RejectionDialog.tsx
    └── types.ts (Shared types)
```

### 2. Component Details

#### 2.1. EvaluationHeader.tsx

**Trách nhiệm:**

- Hiển thị thông tin evaluation (sinh viên, học kỳ, trạng thái)
- Hiển thị tổng điểm và xếp loại
- Nút Edit, Delete (nếu có quyền)

**Props:**

```typescript
interface EvaluationHeaderProps {
  evaluation: Evaluation;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}
```

#### 2.2. EvaluationScoreTable.tsx ⭐ (QUAN TRỌNG)

**Trách nhiệm:**

- Hiển thị bảng điểm chi tiết
- Render các tiêu chí và sub-criteria
- Hiển thị điểm: tự chấm, lớp trưởng, cố vấn
- **FIX BUG: Hiển thị đúng giá trị điểm, không phải tỷ lệ %**

**Props:**

```typescript
interface EvaluationScoreTableProps {
  criteriaWithSubCriteria: CriteriaWithSubCriteria[];
  canScore: boolean;
  isClassMonitor: boolean;
  isAdvisor: boolean;
  classMonitorScores: Record<string, number>;
  advisorScores: Record<string, number>;
  onScoreChange: (
    criteriaId: number,
    subCriteriaId: string,
    score: number,
    role: "classMonitor" | "advisor"
  ) => void;
}
```

**Bug Fix Location:**

- Tìm logic hiển thị `classMonitorScore`
- Đảm bảo hiển thị giá trị trực tiếp từ `detail.classMonitorScore`
- KHÔNG chia cho bất kỳ giá trị nào

#### 2.3. EvaluationActions.tsx

**Trách nhiệm:**

- Các nút action: Submit, Approve, Reject, Appeal
- Logic kiểm tra quyền

**Props:**

```typescript
interface EvaluationActionsProps {
  evaluation: Evaluation;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canAppeal: boolean;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
}
```

#### 2.4. ApprovalDialog.tsx

**Trách nhiệm:**

- Dialog nhập điểm và comment khi duyệt
- Validate điểm nhập vào
- Tính tổng điểm

**Props:**

```typescript
interface ApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  onApprove: (
    comment: string,
    scores: Record<number, number>,
    subCriteriaScores: Record<string, number>
  ) => void;
  criteriaWithSubCriteria: CriteriaWithSubCriteria[];
  isClassMonitor: boolean;
  isAdvisor: boolean;
}
```

#### 2.5. RejectionDialog.tsx

**Trách nhiệm:**

- Dialog nhập lý do từ chối

**Props:**

```typescript
interface RejectionDialogProps {
  open: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
}
```

## 📝 Checklist Refactor

### Phase 1: Preparation

- [ ] Backup file hiện tại
- [ ] Tạo folder `components`
- [ ] Tạo file `types.ts` với shared types

### Phase 2: Extract Components (Từng bước)

- [ ] **Step 1:** Tạo `EvaluationHeader.tsx`
  - [ ] Copy logic header từ page.tsx
  - [ ] Test: Header hiển thị đúng
- [ ] **Step 2:** Tạo `RejectionDialog.tsx` (Đơn giản nhất)

  - [ ] Copy logic rejection dialog
  - [ ] Test: Dialog hoạt động

- [ ] **Step 3:** Tạo `ApprovalDialog.tsx`

  - [ ] Copy logic approval dialog
  - [ ] Test: Dialog hoạt động, điểm được gửi đúng

- [ ] **Step 4:** Tạo `EvaluationActions.tsx`

  - [ ] Copy logic các nút action
  - [ ] Test: Các nút hoạt động đúng

- [ ] **Step 5:** Tạo `EvaluationScoreTable.tsx` ⭐
  - [ ] Copy logic render bảng điểm
  - [ ] **FIX BUG:** Tìm và sửa logic hiển thị điểm
  - [ ] Test: Bảng hiển thị đúng, điểm hiển thị đúng

### Phase 3: Update Main Page

- [ ] Import các component mới
- [ ] Replace code cũ bằng component mới
- [ ] Test toàn bộ trang

### Phase 4: Testing

- [ ] Test hiển thị evaluation
- [ ] Test submit evaluation
- [ ] Test approve evaluation (CLASS_MONITOR, ADVISOR, FACULTY, ADMIN)
- [ ] Test reject evaluation
- [ ] Test appeal
- [ ] **Test điểm hiển thị đúng** ⭐

## 🐛 Bug Fix Strategy

### Vị Trí Bug

Trong `EvaluationScoreTable.tsx`, tìm code hiển thị điểm:

**Có thể là:**

```typescript
// SAI - Đang chia cho một giá trị
<TableCell>{(detail.classMonitorScore / someValue).toFixed(1)}</TableCell>

// SAI - Đang tính tỷ lệ %
<TableCell>{((detail.classMonitorScore / maxScore) * 100).toFixed(1)}</TableCell>

// ĐÚNG - Hiển thị trực tiếp
<TableCell>{detail.classMonitorScore ?? '-'}</TableCell>
```

### Debug Steps

1. Tìm tất cả nơi hiển thị `classMonitorScore`
2. Log giá trị ra console
3. So sánh với database
4. Fix logic hiển thị

## ⚠️ Lưu Ý Quan Trọng

1. **Backup trước khi refactor**
2. **Test sau mỗi component**
3. **Commit sau mỗi bước thành công**
4. **Không làm nhiều thay đổi cùng lúc**
5. **Giữ nguyên logic business, chỉ tách code**

## 🚀 Bắt Đầu

Trong session tiếp theo, chúng ta sẽ:

1. Đọc file hiện tại từng phần
2. Tạo component đầu tiên (RejectionDialog - đơn giản nhất)
3. Test
4. Tiếp tục với các component khác
5. Fix bug trong quá trình refactor

## 📊 Ước Tính Thời Gian

- Phase 1: 10 phút
- Phase 2: 90-120 phút (6 components)
- Phase 3: 20 phút
- Phase 4: 30 phút
- **Tổng: 2.5-3 giờ**

## ✅ Kết Quả Mong Đợi

- File `page.tsx` giảm từ 1000+ dòng xuống ~200 dòng
- 5 component mới, mỗi component <200 dòng
- Bug hiển thị điểm được fix
- Code dễ đọc, dễ maintain hơn
- Tất cả tính năng hoạt động như cũ

---

**Sẵn sàng bắt đầu trong session mới!**
