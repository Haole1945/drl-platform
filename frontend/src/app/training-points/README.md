# Training Points Page

This page allows ADMIN and INSTRUCTOR users to manage training points (điểm rèn luyện) for students.

## Features

### 1. View Training Points

- Display all training points in a card grid layout
- Show activity name, student info, points, date, and semester
- Pagination support for large datasets
- Visual indicators for positive/negative points

### 2. Create Training Points

- Add new training points for students
- Required fields:
  - Student Code (Mã sinh viên)
  - Activity Name (Tên hoạt động)
  - Activity Date (Ngày hoạt động)
  - Points (Điểm)
  - Semester (Học kỳ)
- Optional fields:
  - Description (Mô tả)
  - Evidence URL (Link minh chứng)

### 3. Edit Training Points

- Update existing training point information
- All fields can be modified

### 4. Delete Training Points

- Remove training points (ADMIN only)
- Confirmation dialog before deletion

## API Integration

The page uses the following API endpoints from the student-service:

- `GET /api/training-points` - List all training points with pagination
- `GET /api/training-points/{id}` - Get specific training point
- `GET /api/training-points/student/{code}` - Get points by student
- `GET /api/training-points/student/{code}/total` - Calculate total points
- `POST /api/training-points` - Create new training point (ADMIN/INSTRUCTOR)
- `PUT /api/training-points/{id}` - Update training point (ADMIN/INSTRUCTOR)
- `DELETE /api/training-points/{id}` - Delete training point (ADMIN only)

## Data Structure

```typescript
interface TrainingPoint {
  id: number;
  activityName: string;
  description?: string;
  activityDate: string;
  points: number;
  evidenceUrl?: string;
  semester: string;
  studentCode: string;
  studentName: string;
}
```

## Access Control

- **ADMIN**: Full access (create, read, update, delete)
- **INSTRUCTOR**: Can create, read, and update
- **STUDENT**: No access to this page

## Usage Example

### Creating a Training Point

1. Click "Thêm Điểm" button
2. Fill in the form:
   - Mã sinh viên: N21DCCN001
   - Học kỳ: 2024-2025-HK1
   - Tên hoạt động: Tham gia hoạt động tình nguyện
   - Ngày hoạt động: 2024-11-20
   - Điểm: 5
   - Mô tả: Tham gia chiến dịch mùa hè xanh
   - Link minh chứng: https://example.com/evidence.jpg
3. Click "Lưu"

### Editing a Training Point

1. Click "Sửa" button on a training point card
2. Modify the fields as needed
3. Click "Lưu"

### Deleting a Training Point

1. Click the trash icon on a training point card
2. Confirm deletion in the dialog
3. The training point will be permanently removed

## Related Files

- `/lib/training-points.ts` - API client functions
- `/app/training-points/page.tsx` - Main page component
- Backend: `backend/student-service/src/main/java/ptit/drl/student/api/TrainingPointController.java`
