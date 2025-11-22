# Rubric Activation and Class Targeting

This document describes the features for controlling rubric activation and targeting specific classes.

## Features

### 1. Rubric Activation Toggle

Admins can now activate or deactivate rubrics when creating or editing them.

- **Active Rubrics**: Will be available for evaluations
- **Inactive Rubrics**: Will be hidden from evaluation forms but preserved in the system

**UI Location**: System Config page → Rubric Editor → "Kích hoạt Rubric" toggle switch

**Database Field**: `rubrics.is_active` (BOOLEAN, default: TRUE)

### 2. Class Targeting

Admins can specify which classes a rubric applies to by entering class codes.

**Input Format**: Comma-separated class codes

- Example: `D21CQCN01-N, D20CQCN01-N, D22CQCN02-N`

**Behavior**:

- If field is empty → Rubric applies to ALL classes
- If class codes are entered → Rubric only applies to those specific classes

**UI Location**: System Config page → Rubric Editor → "Áp dụng cho các lớp" text input

**Database Field**: `rubrics.target_classes` (VARCHAR(500), nullable)

- Format: Comma-separated class codes (e.g., "D21CQCN01-N,D20CQCN01-N")
- NULL or empty = applies to all classes

## Implementation Details

### Backend Changes

#### 1. Entity Update (`Rubric.java`)

```java
@Column(name = "target_classes", length = 500)
private String targetClasses; // Comma-separated class codes or null for all
```

#### 2. DTO Update (`RubricDTO.java`)

```java
private String targetClasses;
```

#### 3. Mapper Update (`RubricMapper.java`)

Added mapping for `targetClasses` field in both `toDTO()` and `toDTOWithoutCriteria()` methods.

#### 4. Database Migration

File: `V3__add_target_classes_to_rubrics.sql`

```sql
ALTER TABLE rubrics
ADD COLUMN target_classes VARCHAR(500) NULL;

CREATE INDEX idx_rubrics_target_classes ON rubrics(target_classes);
```

### Frontend Changes

#### 1. Type Updates

**`frontend/src/types/evaluation.ts`**:

```typescript
export interface Rubric {
  // ... existing fields
  isActive: boolean;
  targetClasses?: string;
}
```

**`frontend/src/app/admin/system-config/types.ts`**:

```typescript
export interface RubricFormData {
  // ... existing fields
  isActive: boolean;
  targetClasses: string;
}
```

#### 2. UI Components

**RubricEditor.tsx**:

- Added activation toggle switch (styled with Tailwind)
- Added text input for class codes with placeholder example
- Input uses monospace font for better readability of class codes

**RubricList.tsx**:

- Shows "Active" badge for active rubrics
- Displays selected class codes as monospace badges
- Shows "Áp dụng cho tất cả các lớp" when no classes specified

#### 3. State Management

**page.tsx**:

- Initializes `isActive: true` and `targetClasses: ''` for new rubrics
- Trims whitespace from class codes before saving
- Sends `undefined` if targetClasses is empty

## UI Features

### Activation Toggle Switch

- Modern toggle switch design
- Clear visual feedback (gray when off, primary color when on)
- Smooth animation on toggle
- Focus ring for accessibility

### Class Input Field

- Monospace font for better code readability
- Helpful placeholder with example format
- Tip message below input
- Accepts comma-separated values

### Class Display

- Monospace badges for each class code
- Wraps to multiple lines if needed
- Shows "all classes" message when empty

## Usage Examples

### Example 1: Create Active Rubric for All Classes

1. Go to System Config page
2. Click "Tạo Rubric Mới"
3. Fill in rubric details
4. Keep "Kích hoạt Rubric" toggle ON (default)
5. Leave "Áp dụng cho các lớp" field empty
6. Save

**Result**: Rubric is active for all classes.

### Example 2: Create Rubric for Specific Classes

1. Go to System Config page
2. Click "Tạo Rubric Mới"
3. Fill in rubric details
4. Keep "Kích hoạt Rubric" toggle ON
5. Enter class codes: `D21CQCN01-N, D20CQCN01-N, D22CQCN02-N`
6. Save

**Result**: Rubric is active only for the specified classes.

### Example 3: Deactivate Existing Rubric

1. Go to System Config page
2. Select a rubric from the list
3. Toggle "Kích hoạt Rubric" OFF
4. Save

**Result**: Rubric is preserved but not available for new evaluations.

### Example 4: Update Class Targeting

1. Go to System Config page
2. Select a rubric
3. Modify the class codes in "Áp dụng cho các lớp"
4. Save

**Result**: Rubric now applies to the updated list of classes.

## API Changes

### Create Rubric Request

```json
{
  "name": "Rubric 2024-2025",
  "description": "...",
  "maxScore": 100,
  "academicYear": "2024-2025",
  "isActive": true,
  "targetClasses": "D21CQCN01-N,D20CQCN01-N"
}
```

### Update Rubric Request

```json
{
  "name": "Updated Rubric",
  "isActive": false,
  "targetClasses": null
}
```

### Response

```json
{
  "success": true,
  "message": "Rubric created successfully",
  "data": {
    "id": 1,
    "name": "Rubric 2024-2025",
    "isActive": true,
    "targetClasses": "D21CQCN01-N,D20CQCN01-N"
    // ... other fields
  }
}
```

## Class Code Format

### Recommended Format

- Use uppercase letters
- Include hyphens and suffixes as needed
- Examples:
  - `D21CQCN01-N`
  - `D20CQCN01-N`
  - `D22CQCN02-N`
  - `D21DCCN001`

### Input Handling

- Whitespace around commas is automatically trimmed
- Both `D21CQCN01-N, D20CQCN01-N` and `D21CQCN01-N,D20CQCN01-N` work
- Empty input means "all classes"

## Future Enhancements

Potential improvements for future versions:

1. **Class Code Validation**: Validate class codes against existing classes in database
2. **Auto-complete**: Suggest class codes as user types
3. **Bulk Selection**: UI to select multiple classes from a list
4. **Class Groups**: Define groups of classes (e.g., "All CS classes", "All Year 1 classes")
5. **Activation History**: Track when rubrics were activated/deactivated and by whom
6. **Bulk Operations**: Activate/deactivate multiple rubrics at once
7. **Validation Rules**: Ensure at least one active rubric exists per class

## Migration Guide

### For Existing Data

All existing rubrics will have:

- `is_active = TRUE` (already exists)
- `target_classes = NULL` (applies to all classes)

No data migration needed - the new column is nullable and defaults to NULL.

### For Developers

1. Pull latest code
2. Run database migration (Flyway will auto-apply V3 migration)
3. Restart evaluation-service
4. Rebuild frontend
5. Test rubric creation/editing with new fields

## Testing Checklist

- [x] Create new rubric with activation enabled
- [x] Create new rubric with activation disabled
- [x] Create rubric targeting specific classes
- [x] Create rubric targeting all classes (empty input)
- [x] Edit existing rubric to change activation status
- [x] Edit existing rubric to change class targeting
- [x] Verify rubric list shows activation toggle correctly
- [x] Verify rubric list shows class badges correctly
- [x] Verify API sends correct data format
- [x] Verify database stores data correctly
- [x] Test with various class code formats
- [x] Test with whitespace in input

## Related Files

### Backend

- `backend/evaluation-service/src/main/java/ptit/drl/evaluation/entity/Rubric.java`
- `backend/evaluation-service/src/main/java/ptit/drl/evaluation/dto/RubricDTO.java`
- `backend/evaluation-service/src/main/java/ptit/drl/evaluation/mapper/RubricMapper.java`
- `backend/evaluation-service/src/main/resources/db/migration/V3__add_target_classes_to_rubrics.sql`

### Frontend

- `frontend/src/types/evaluation.ts`
- `frontend/src/app/admin/system-config/types.ts`
- `frontend/src/app/admin/system-config/page.tsx`
- `frontend/src/app/admin/system-config/components/RubricEditor.tsx`
- `frontend/src/app/admin/system-config/components/RubricList.tsx`
