# Fix: Hiển thị điểm sub-criteria từ database

## Vấn đề

- Điểm sub-criteria đã được lưu vào database (trong field `note` dạng JSON)
- Nhưng không hiển thị trên giao diện vì code không parse được

## Nguyên nhân

Code kiểm tra `criterion.subCriteria` nhưng field này không tồn tại trong `criteriaResponse.data`.
Sub-criteria chỉ có sau khi parse từ `criterion.description` bằng hàm `parseSubCriteria()`.

## Giải pháp

### File cần sửa

`frontend/src/app/evaluations/[id]/page.tsx`

### Các thay đổi cần làm (dòng 163-250)

#### 1. Xóa điều kiện check state rỗng (dòng 167-170)

**TỪ:**

```typescript
// Only load from database if state is empty (not already entered by user)
if (Object.keys(classMonitorSubCriteriaScores).length === 0 &&
    Object.keys(advisorSubCriteriaScores).length === 0 &&
    evalData.details) {
```

**THÀNH:**

```typescript
// Always load scores from database when evaluation data is available
if (evalData.details) {
```

#### 2. Parse subCriteria trước khi check (dòng 172-173)

**TỪ:**

```typescript
const criterion = criteriaResponse.data.find((c: Criteria) => c.id === detail.criteriaId);
if (criterion && criterion.subCriteria) {
```

**THÀNH:**

```typescript
const criterion = criteriaResponse.data.find((c: Criteria) => c.id === detail.criteriaId);
if (criterion) {
  // Parse sub-criteria from description
  const subCriteria = parseSubCriteria(criterion.orderIndex, criterion.description || '');
  if (subCriteria && subCriteria.length > 0) {
```

#### 3. Thay `criterion.subCriteria` bằng `subCriteria` (dòng 215)

**TỪ:**

```typescript
const totalMaxPoints = criterion.subCriteria.reduce(
  (sum: number, s: any) => sum + s.maxPoints,
  0
);
```

**THÀNH:**

```typescript
const totalMaxPoints = subCriteria.reduce(
  (sum: number, s: any) => sum + s.maxPoints,
  0
);
```

#### 4. Thay `criterion.subCriteria.forEach` lần 1 (dòng 218)

**TỪ:**

```typescript
criterion.subCriteria.forEach((sub: any) => {
```

**THÀNH:**

```typescript
subCriteria.forEach((sub: any) => {
```

#### 5. Thay `criterion.subCriteria.forEach` lần 2 (dòng 227)

**TỪ:**

```typescript
criterion.subCriteria.forEach((sub: any) => {
```

**THÀNH:**

```typescript
subCriteria.forEach((sub: any) => {
```

#### 6. Thêm closing brace cho `if (subCriteria...)` (sau dòng 234)

**TỪ:**

```typescript
                    }
                  }
                }
              });
```

**THÀNH:**

```typescript
                    }
                  }
                }
              }
              });
```

(Thêm 1 dòng `}` giữa 2 dòng `}` cuối)

## Kết quả mong đợi

Sau khi sửa:

1. Reload trang (Ctrl+Shift+R)
2. Vào evaluation detail page
3. Sẽ thấy log `[DEBUG] Loading scores for criteria 1` trong console
4. Điểm sub-criteria sẽ hiển thị đúng:
   - 1.1: 3
   - 1.2: 0
   - 1.3: 0
   - ...
5. Dòng tổng hiển thị: 3

## Lưu ý

- Chỉ sửa trong phần code load scores (dòng 163-250)
- KHÔNG sửa các chỗ khác có `criterion.subCriteria` (ở các dòng khác)
- Sau khi sửa, kiểm tra TypeScript errors trước khi test
