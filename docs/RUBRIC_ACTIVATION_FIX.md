# Fix: Rubric Activation and Target Classes Not Saving

## Problem

When toggling the activation switch or entering target classes and saving, the values were not being persisted to the database. The rubric remained active even when the toggle was turned off.

## Root Cause

The `isActive` and `targetClasses` parameters were not being sent from frontend to backend:

1. **Frontend API Client** (`evaluation.ts`): The `createRubric()` and `updateRubric()` functions did not include `isActive` and `targetClasses` parameters
2. **Backend Controller** (`RubricController.java`): The endpoints did not accept these parameters
3. **Backend Service** (`RubricService.java`): The service methods did not handle these fields

## Solution

### Frontend Changes

**File**: `frontend/src/lib/evaluation.ts`

Updated `createRubric()` function:

```typescript
export async function createRubric(data: {
  name: string;
  description?: string;
  maxScore: number;
  academicYear: string;
  isActive?: boolean; // ✅ Added
  targetClasses?: string; // ✅ Added
}): Promise<ApiResponse<Rubric>> {
  const params = new URLSearchParams();
  params.append("name", data.name);
  if (data.description) params.append("description", data.description);
  params.append("maxScore", data.maxScore.toString());
  params.append("academicYear", data.academicYear);
  if (data.isActive !== undefined)
    params.append("isActive", data.isActive.toString()); // ✅ Added
  if (data.targetClasses) params.append("targetClasses", data.targetClasses); // ✅ Added

  return apiClient.post<Rubric>(`/rubrics?${params.toString()}`, {});
}
```

Updated `updateRubric()` function:

```typescript
export async function updateRubric(
  id: number,
  data: {
    name?: string;
    description?: string;
    maxScore?: number;
    academicYear?: string;
    isActive?: boolean; // ✅ Added
    targetClasses?: string; // ✅ Added
  }
): Promise<ApiResponse<Rubric>> {
  const params = new URLSearchParams();
  if (data.name) params.append("name", data.name);
  if (data.description) params.append("description", data.description);
  if (data.isActive !== undefined)
    params.append("isActive", data.isActive.toString()); // ✅ Added
  if (data.targetClasses) params.append("targetClasses", data.targetClasses); // ✅ Added
  // ... rest of parameters
}
```

### Backend Changes

#### 1. Controller (`RubricController.java`)

Updated `createRubric()` endpoint:

```java
@PostMapping
public ResponseEntity<ApiResponse<RubricDTO>> createRubric(
        @RequestParam String name,
        @RequestParam(required = false) String description,
        @RequestParam Double maxScore,
        @RequestParam String academicYear,
        @RequestParam(required = false, defaultValue = "true") Boolean isActive,      // ✅ Added
        @RequestParam(required = false) String targetClasses) {                       // ✅ Added

    RubricDTO rubric = rubricService.createRubric(
        name, description, maxScore, academicYear, isActive, targetClasses);         // ✅ Updated

    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success("Rubric created successfully", rubric));
}
```

Updated `updateRubric()` endpoint:

```java
@PutMapping("/{id}")
public ResponseEntity<ApiResponse<RubricDTO>> updateRubric(
        @PathVariable Long id,
        @RequestParam(required = false) String name,
        @RequestParam(required = false) String description,
        @RequestParam(required = false) Double maxScore,
        @RequestParam(required = false) String academicYear,
        @RequestParam(required = false) Boolean isActive,                            // ✅ Added
        @RequestParam(required = false) String targetClasses) {                      // ✅ Added

    RubricDTO rubric = rubricService.updateRubric(
        id, name, description, maxScore, academicYear, isActive, targetClasses);    // ✅ Updated

    return ResponseEntity.ok(
        ApiResponse.success("Rubric updated successfully", rubric));
}
```

#### 2. Service (`RubricService.java`)

Updated `createRubric()` method:

```java
public RubricDTO createRubric(String name, String description,
                              Double maxScore, String academicYear,
                              Boolean isActive, String targetClasses) {              // ✅ Added parameters
    Rubric rubric = new Rubric(name, description, maxScore, academicYear);
    rubric.setIsActive(isActive != null ? isActive : true);                         // ✅ Set isActive
    rubric.setTargetClasses(targetClasses);                                         // ✅ Set targetClasses

    Rubric saved = rubricRepository.save(rubric);
    return RubricMapper.toDTO(saved);
}
```

Updated `updateRubric()` method:

```java
public RubricDTO updateRubric(Long id, String name, String description,
                              Double maxScore, String academicYear,
                              Boolean isActive, String targetClasses) {              // ✅ Added parameters
    Rubric rubric = rubricRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Rubric", "id", id));

    if (name != null) rubric.setName(name);
    if (description != null) rubric.setDescription(description);
    if (maxScore != null) rubric.setMaxPoints(maxScore);
    if (academicYear != null) rubric.setAcademicYear(academicYear);
    if (isActive != null) rubric.setIsActive(isActive);                             // ✅ Update isActive
    if (targetClasses != null) rubric.setTargetClasses(targetClasses);              // ✅ Update targetClasses

    Rubric updated = rubricRepository.save(rubric);
    return RubricMapper.toDTO(updated);
}
```

## Testing

### Test Case 1: Create Inactive Rubric

1. Go to System Config page
2. Click "Tạo Rubric Mới"
3. Fill in rubric details
4. Toggle "Kích hoạt Rubric" OFF
5. Save
6. **Expected**: Rubric is created with `isActive = false`
7. **Verify**: Rubric list should NOT show "Active" badge

### Test Case 2: Create Rubric with Target Classes

1. Go to System Config page
2. Click "Tạo Rubric Mới"
3. Fill in rubric details
4. Enter target classes: `D21CQCN01-N, D20CQCN01-N`
5. Save
6. **Expected**: Rubric is created with `targetClasses = "D21CQCN01-N,D20CQCN01-N"`
7. **Verify**: Rubric list should show class badges

### Test Case 3: Update Rubric Activation

1. Go to System Config page
2. Select an active rubric
3. Toggle "Kích hoạt Rubric" OFF
4. Save
5. **Expected**: Rubric is updated with `isActive = false`
6. **Verify**: "Active" badge should disappear

### Test Case 4: Update Target Classes

1. Go to System Config page
2. Select a rubric
3. Change target classes to: `D22CQCN01-N`
4. Save
5. **Expected**: Rubric is updated with new target classes
6. **Verify**: Class badges should update

## API Request Examples

### Create Rubric (Inactive, with Target Classes)

```
POST /api/rubrics?name=Test&description=Test&maxScore=100&academicYear=2024-2025&isActive=false&targetClasses=D21CQCN01-N,D20CQCN01-N
```

### Update Rubric (Deactivate)

```
PUT /api/rubrics/1?isActive=false
```

### Update Rubric (Change Target Classes)

```
PUT /api/rubrics/1?targetClasses=D22CQCN01-N,D23CQCN01-N
```

## Files Changed

### Frontend

- `frontend/src/lib/evaluation.ts` - Added parameters to API functions

### Backend

- `backend/evaluation-service/src/main/java/ptit/drl/evaluation/api/RubricController.java` - Added parameters to endpoints
- `backend/evaluation-service/src/main/java/ptit/drl/evaluation/service/RubricService.java` - Added parameters to service methods

## Status

✅ **FIXED** - The activation toggle and target classes now work correctly and persist to the database.
