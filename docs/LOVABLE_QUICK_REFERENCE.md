# Quick Reference for Lovable

## 🚀 Quick Start

### API Base URL
```
http://localhost:8080/api
```

### Authentication
```typescript
// Login
POST /api/auth/login
Body: { username: string, password: string }
Response: { accessToken, refreshToken, user }

// Register
POST /api/auth/register
Body: { username, email, password, fullName, studentCode }
Response: { user }

// Get Current User
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
```

### Using Existing Code

```typescript
// 1. Import auth hook
import { useAuth } from '@/contexts/AuthContext';

// 2. Import auth functions
import { login, register, logout } from '@/lib/auth';

// 3. Import API client
import { apiClient } from '@/lib/api';

// 4. Use in component
const { user, isAuthenticated, logout } = useAuth();
const response = await apiClient.get('/students');
```

## 📋 Essential Endpoints

### Students
- `GET /api/students` - List (paginated)
- `GET /api/students/{code}` - Get one
- `POST /api/students` - Create (ADMIN/INSTRUCTOR)
- `PUT /api/students/{code}` - Update (ADMIN/INSTRUCTOR)
- `DELETE /api/students/{code}` - Delete (ADMIN only)

### Evaluations
- `GET /api/evaluations` - List
- `GET /api/evaluations/{id}` - Get one
- `POST /api/evaluations` - Create (STUDENT)
- `POST /api/evaluations/{id}/submit` - Submit
- `POST /api/evaluations/{id}/approve` - Approve (INSTRUCTOR/ADMIN)
- `POST /api/evaluations/{id}/reject` - Reject (INSTRUCTOR/ADMIN)

### Rubrics
- `GET /api/rubrics/active` - Get active rubric
- `GET /api/criteria?rubricId={id}` - Get criteria

## 🎯 User Roles

- **STUDENT**: Can create/submit evaluations
- **INSTRUCTOR**: Can approve/reject, manage students
- **ADMIN**: Full access, can delete

## 📁 Keep These Files

✅ `src/lib/api.ts` - API client  
✅ `src/lib/auth.ts` - Auth functions  
✅ `src/contexts/AuthContext.tsx` - Auth context  
✅ `src/types/auth.ts` - Types  
✅ `src/app/layout.tsx` - Root layout (with AuthProvider)

## 🎨 Build These Pages

1. `/login` - Login form
2. `/register` - Registration form
3. `/dashboard` - Student dashboard
4. `/evaluations/new` - Create evaluation
5. `/evaluations/[id]` - View/edit evaluation
6. `/approvals` - Pending approvals (INSTRUCTOR/ADMIN)
7. `/students` - Student management (ADMIN/INSTRUCTOR)
8. `/training-points` - Training points (ADMIN/INSTRUCTOR)
9. `/admin` - Admin panel (ADMIN)

---

**See `LOVABLE_FRONTEND_SPEC.md` for complete details!**

