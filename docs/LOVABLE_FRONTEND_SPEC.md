# DRL Platform - Frontend Specification for Lovable

## 📱 Application Overview

**Name:** DRL Platform (Student Training Point Evaluation Platform)  
**Type:** Web Application for managing student training point evaluations  
**Architecture:** Microservices (Spring Boot backend + Next.js frontend)  
**Backend API:** Spring Cloud Gateway at `http://localhost:8080`

---

## 🎯 What the App Does

### Core Functionality

1. **Authentication & User Management**
   - User registration (students register with student code)
   - User login/logout
   - JWT token-based authentication
   - Role-based access control (STUDENT, INSTRUCTOR, ADMIN)

2. **Student Management** (Admin/Instructor only)
   - View list of students with pagination
   - View student details
   - Create new students
   - Update student information
   - Delete students
   - Filter by faculty, major, or class

3. **Training Point Management** (Admin/Instructor only)
   - View training points
   - Create training points for students
   - Update training points
   - Delete training points
   - Calculate total training points per student

4. **Evaluation Workflow**
   - Students create evaluations (DRAFT status)
   - Students submit evaluations for approval
   - Multi-level approval: CLASS → FACULTY → CTSV
   - Rejection with feedback
   - Resubmission after rejection
   - View evaluation history

5. **Rubric & Criteria Management**
   - View active rubric
   - View criteria for a rubric
   - Create evaluations based on rubric criteria

6. **Dashboard Views**
   - **Student Dashboard:** View own evaluations, create new evaluations
   - **Instructor Dashboard:** View pending approvals, approve/reject evaluations
   - **Admin Dashboard:** Full access to all features

---

## 👥 User Roles & Permissions

### STUDENT
- ✅ View own profile
- ✅ View own evaluations
- ✅ Create evaluations (DRAFT)
- ✅ Edit own DRAFT evaluations
- ✅ Submit evaluations
- ✅ Resubmit rejected evaluations
- ❌ Cannot approve/reject
- ❌ Cannot manage students
- ❌ Cannot manage training points

### INSTRUCTOR
- ✅ All STUDENT permissions
- ✅ View pending evaluations
- ✅ Approve/reject evaluations (CLASS level)
- ✅ View all students
- ✅ Create/update students
- ✅ Create/update training points
- ❌ Cannot delete students
- ❌ Cannot delete training points

### ADMIN
- ✅ All INSTRUCTOR permissions
- ✅ Delete students
- ✅ Delete training points
- ✅ Full system access

---

## 🔐 Authentication Flow

### 1. Registration
```
POST /api/auth/register
Body: {
  username: string
  email: string
  password: string
  fullName: string
  studentCode: string (must exist in database)
}
Response: { success: true, data: User }
```

### 2. Login
```
POST /api/auth/login
Body: {
  username: string
  password: string
}
Response: {
  success: true,
  data: {
    accessToken: string
    refreshToken: string
    expiresIn: number
    refreshExpiresIn: number
    user: User
  }
}
```

### 3. Get Current User
```
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { success: true, data: User }
```

### 4. Refresh Token
```
POST /api/auth/refresh
Body: { refreshToken: string }
Response: { success: true, data: AuthResponse }
```

### 5. Logout
```
POST /api/auth/logout
Headers: { Authorization: "Bearer <token>" }
```

---

## 📡 Complete API Endpoints

### Base URL
```
http://localhost:8080/api
```

### Authentication Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | ❌ No | Register new user |
| POST | `/auth/login` | ❌ No | Login user |
| GET | `/auth/me` | ✅ Yes | Get current user |
| POST | `/auth/refresh` | ❌ No | Refresh access token |
| POST | `/auth/logout` | ✅ Yes | Logout user |

### Student Endpoints

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/students` | ✅ Yes | Any | List students (paginated) |
| GET | `/students?facultyCode=X` | ✅ Yes | Any | Filter by faculty |
| GET | `/students?majorCode=X` | ✅ Yes | Any | Filter by major |
| GET | `/students?classCode=X` | ✅ Yes | Any | Filter by class |
| GET | `/students/{studentCode}` | ✅ Yes | Any | Get student by code |
| POST | `/students` | ✅ Yes | ADMIN, INSTRUCTOR | Create student |
| PUT | `/students/{studentCode}` | ✅ Yes | ADMIN, INSTRUCTOR | Update student |
| DELETE | `/students/{studentCode}` | ✅ Yes | ADMIN | Delete student |

**Student Request/Response:**
```typescript
// Create Student Request
{
  studentCode: string
  fullName: string
  dateOfBirth: string (YYYY-MM-DD)
  gender: "MALE" | "FEMALE"
  phone: string
  address: string
  academicYear: string
  classCode: string
  majorCode: string
  facultyCode: string
}

// Student Response
{
  studentCode: string
  fullName: string
  dateOfBirth: string
  gender: string
  phone: string
  address: string
  academicYear: string
  class: { code: string, name: string }
  major: { code: string, name: string }
  faculty: { code: string, name: string }
}
```

### Training Point Endpoints

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/training-points` | ✅ Yes | Any | List training points (paginated) |
| GET | `/training-points/{id}` | ✅ Yes | Any | Get by ID |
| GET | `/training-points/student/{code}` | ✅ Yes | Any | Get by student |
| GET | `/training-points/student/{code}/total` | ✅ Yes | Any | Calculate total |
| POST | `/training-points` | ✅ Yes | ADMIN, INSTRUCTOR | Create training point |
| PUT | `/training-points/{id}` | ✅ Yes | ADMIN, INSTRUCTOR | Update training point |
| DELETE | `/training-points/{id}` | ✅ Yes | ADMIN | Delete training point |

**Training Point Request/Response:**
```typescript
// Create Training Point Request
{
  studentCode: string
  semester: string
  academicYear: string
  points: number
  description: string
  category: string
}

// Training Point Response
{
  id: number
  studentCode: string
  semester: string
  academicYear: string
  points: number
  description: string
  category: string
  createdAt: string
  updatedAt: string
}
```

### Evaluation Endpoints

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/evaluations` | ✅ Yes | Any | List evaluations (paginated) |
| GET | `/evaluations/{id}` | ✅ Yes | Any | Get evaluation by ID |
| GET | `/evaluations/student/{code}` | ✅ Yes | Any | Get by student |
| GET | `/evaluations/pending` | ✅ Yes | INSTRUCTOR, ADMIN | Get pending approvals |
| POST | `/evaluations` | ✅ Yes | STUDENT | Create evaluation (DRAFT) |
| PUT | `/evaluations/{id}` | ✅ Yes | STUDENT | Update (DRAFT only) |
| POST | `/evaluations/{id}/submit` | ✅ Yes | STUDENT | Submit for approval |
| POST | `/evaluations/{id}/approve` | ✅ Yes | INSTRUCTOR, ADMIN | Approve evaluation |
| POST | `/evaluations/{id}/reject` | ✅ Yes | INSTRUCTOR, ADMIN | Reject evaluation |
| POST | `/evaluations/{id}/resubmit` | ✅ Yes | STUDENT | Resubmit after rejection |

**Evaluation Request/Response:**
```typescript
// Create Evaluation Request
{
  studentCode: string
  rubricId: number
  semester: string
  academicYear: string
  details: Array<{
    criteriaId: number
    score: number
    evidence: string
    note: string
  }>
}

// Evaluation Response
{
  id: number
  studentCode: string
  rubric: { id: number, name: string }
  semester: string
  academicYear: string
  status: "DRAFT" | "SUBMITTED" | "CLASS_APPROVED" | "FACULTY_APPROVED" | "CTSV_APPROVED" | "REJECTED"
  totalScore: number
  details: Array<{
    id: number
    criteria: { id: number, name: string, maxScore: number }
    score: number
    evidence: string
    note: string
  }>
  rejectionReason?: string
  resubmissionCount: number
  createdAt: string
  updatedAt: string
}

// Approval Request
{
  comment?: string
}

// Rejection Request
{
  reason: string
}
```

### Rubric Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/rubrics` | ✅ Yes | List all rubrics |
| GET | `/rubrics/{id}` | ✅ Yes | Get rubric with criteria |
| GET | `/rubrics/active` | ✅ Yes | Get active rubric |

**Rubric Response:**
```typescript
{
  id: number
  name: string
  description: string
  academicYear: string
  isActive: boolean
  criteriaCount: number
  criteria: Array<{
    id: number
    name: string
    description: string
    maxScore: number
    weight: number
  }>
}
```

### Criteria Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/criteria?rubricId={id}` | ✅ Yes | Get criteria by rubric |
| GET | `/criteria/{id}` | ✅ Yes | Get criterion by ID |

**Criteria Response:**
```typescript
{
  id: number
  name: string
  description: string
  maxScore: number
  weight: number
  rubricId: number
}
```

---

## 📋 API Response Format

All API responses follow this format:

```typescript
// Success Response
{
  success: true
  message: string
  data: T  // The actual data
  timestamp?: string
}

// Error Response
{
  success: false
  message: string
  timestamp?: string
  errors?: string[]  // Validation errors
}
```

---

## 🔒 Authentication Headers

For protected endpoints, include:
```
Authorization: Bearer <accessToken>
```

Token is obtained from login response and should be stored in localStorage.

---

## 📁 Files to Keep (Already Created)

These files are already set up and should be kept:

### 1. API Client (`src/lib/api.ts`)
- Handles all HTTP requests
- Automatically injects JWT token
- Manages token storage

### 2. Auth Functions (`src/lib/auth.ts`)
- `login()`, `register()`, `getCurrentUser()`, `logout()`, `refreshToken()`

### 3. Auth Context (`src/contexts/AuthContext.tsx`)
- Global authentication state
- `useAuth()` hook
- Auto-loads user on mount

### 4. Types (`src/types/auth.ts`)
- TypeScript types for authentication

### 5. Root Layout (`src/app/layout.tsx`)
- Already wrapped with AuthProvider

---

## 🎨 What Lovable Should Build

### Pages Needed

1. **Login Page** (`/login`)
   - Username/password form
   - Call `login()` from `src/lib/auth.ts`
   - Redirect to dashboard on success
   - Show error messages

2. **Register Page** (`/register`)
   - Registration form (username, email, password, fullName, studentCode)
   - Call `register()` from `src/lib/auth.ts`
   - Redirect to login on success

3. **Student Dashboard** (`/dashboard` or `/`)
   - Show user info
   - List of user's evaluations
   - Button to create new evaluation
   - Protected route (requires auth)

4. **Evaluation Form** (`/evaluations/new`)
   - Fetch active rubric
   - Fetch criteria for rubric
   - Form with score inputs for each criterion
   - Save as DRAFT or Submit
   - Protected route (requires STUDENT role)

5. **Evaluation Detail** (`/evaluations/[id]`)
   - Show evaluation details
   - Show status and history
   - Actions based on status:
     - DRAFT: Edit, Submit
     - SUBMITTED: View only (for student)
     - REJECTED: Resubmit
   - For instructors: Approve/Reject buttons

6. **Pending Approvals** (`/approvals`)
   - List pending evaluations
   - Approve/Reject actions
   - Protected route (requires INSTRUCTOR or ADMIN)

7. **Student Management** (`/students`)
   - List students with pagination
   - Filters (faculty, major, class)
   - Create/Edit/Delete buttons
   - Protected route (requires ADMIN or INSTRUCTOR)

8. **Training Points** (`/training-points`)
   - List training points
   - Create/Edit/Delete
   - Protected route (requires ADMIN or INSTRUCTOR)

9. **Admin Panel** (`/admin`)
   - Overview dashboard
   - Statistics
   - Protected route (requires ADMIN)

### Components Needed

1. **Navigation Component**
   - Show user info
   - Logout button
   - Role-based menu items

2. **Protected Route Component**
   - Check authentication
   - Check role permissions
   - Redirect to login if not authenticated

3. **Evaluation Status Badge**
   - Color-coded status display

4. **Form Components**
   - Input fields with validation
   - Error message display

5. **Loading States**
   - Spinner/loading indicators

6. **Error Boundaries**
   - Error handling UI

---

## 🛠️ How to Use Existing Files

### In Lovable Components:

```typescript
// Import auth hook
import { useAuth } from '@/contexts/AuthContext';

// Import auth functions
import { login, register, logout } from '@/lib/auth';

// Import API client
import { apiClient } from '@/lib/api';

// Example: Login component
function LoginPage() {
  const { login: setAuth } = useAuth();
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login({ username, password });
      if (response.success) {
        setAuth(response.data.user, response.data.accessToken);
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    }
  };
}

// Example: API call
const response = await apiClient.get('/students');
const students = response.data.content;
```

---

## 📝 Important Notes

1. **API Base URL:** Always use `http://localhost:8080/api`
2. **Token Storage:** Tokens are stored in localStorage automatically
3. **Error Handling:** All API calls should handle errors gracefully
4. **Loading States:** Show loading indicators during API calls
5. **Form Validation:** Validate forms before submitting
6. **Role Checks:** Check user roles before showing actions
7. **Protected Routes:** Redirect to login if not authenticated

---

## 🎯 Priority Features

### Must Have (Phase 1)
1. ✅ Login/Register pages
2. ✅ Student dashboard
3. ✅ Evaluation form (create)
4. ✅ View evaluations
5. ✅ Protected routes

### Should Have (Phase 2)
6. ✅ Approval interface
7. ✅ Student management
8. ✅ Training point management
9. ✅ Admin panel

### Nice to Have (Phase 3)
10. ✅ Advanced filtering
11. ✅ Export functionality
12. ✅ Notifications
13. ✅ Charts/Statistics

---

## 🔗 Integration Checklist

- [ ] Use existing `src/lib/api.ts` for all API calls
- [ ] Use existing `src/lib/auth.ts` for authentication
- [ ] Use existing `src/contexts/AuthContext.tsx` for auth state
- [ ] Keep `src/app/layout.tsx` with AuthProvider
- [ ] All protected pages check authentication
- [ ] All role-restricted actions check user roles
- [ ] Handle API errors gracefully
- [ ] Show loading states
- [ ] Validate forms before submission

---

**Last Updated:** November 18, 2024  
**For:** Lovable Frontend Development

