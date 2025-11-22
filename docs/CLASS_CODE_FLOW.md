# Class Code Flow Diagram

## Overview

This document explains how classCode flows through the system to enable class-based rubric filtering.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     STUDENT DATA SOURCE                          │
│                   (Student Service Database)                     │
│                                                                   │
│  Student Record:                                                 │
│  - studentCode: "N21DCCN001"                                    │
│  - fullName: "Nguyen Van A"                                     │
│  - classCode: "D21DCCN01-N"  ← Source of truth                 │
│  - position: "STUDENT"                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    (Feign Client Call)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AUTH SERVICE                                │
│                                                                   │
│  1. User Registration / Password Request                         │
│     → Validate studentCode via student-service                   │
│     → Extract classCode from response                            │
│     → Store in User entity                                       │
│                                                                   │
│  User Entity (Database):                                         │
│  - id: 1                                                         │
│  - username: "n21dccn001"                                       │
│  - studentCode: "N21DCCN001"                                    │
│  - classCode: "D21DCCN01-N"  ← Cached for performance          │
│                                                                   │
│  2. Login / Refresh Token                                        │
│     → Return UserDTO with classCode                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    (API Response)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│                                                                   │
│  User Object (in memory):                                        │
│  {                                                               │
│    id: 1,                                                        │
│    username: "n21dccn001",                                      │
│    studentCode: "N21DCCN001",                                   │
│    classCode: "D21DCCN01-N",  ← Available for filtering        │
│    roles: ["STUDENT"]                                           │
│  }                                                               │
│                                                                   │
│  When fetching rubric:                                           │
│  → GET /api/rubrics/active?classCode=D21DCCN01-N               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    (API Request)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   EVALUATION SERVICE                             │
│                                                                   │
│  Rubric Filtering Logic:                                         │
│                                                                   │
│  1. Get all active rubrics                                       │
│  2. For each rubric:                                             │
│     - If targetClasses is NULL/empty → Match (all classes)      │
│     - If targetClasses contains classCode → Match               │
│     - Otherwise → Skip                                           │
│  3. Return first matching rubric                                 │
│                                                                   │
│  Example Rubrics:                                                │
│  ┌────────────────────────────────────────────────────┐         │
│  │ Rubric A                                            │         │
│  │ targetClasses: NULL                                 │         │
│  │ → Matches ALL classes                               │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                   │
│  ┌────────────────────────────────────────────────────┐         │
│  │ Rubric B                                            │         │
│  │ targetClasses: "D21DCCN01-N,D21DCCN02-N"          │         │
│  │ → Matches D21DCCN01-N ✓                            │         │
│  │ → Matches D21DCCN02-N ✓                            │         │
│  │ → Does NOT match D21DCCN03-N ✗                     │         │
│  └────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Sequence Diagram

### User Registration Flow

```
Student          Frontend         Auth Service      Student Service
   |                |                  |                   |
   |  Enter email   |                  |                   |
   |--------------->|                  |                   |
   |                | POST /request-   |                   |
   |                | password         |                   |
   |                |----------------->|                   |
   |                |                  | GET /students/    |
   |                |                  | {studentCode}     |
   |                |                  |------------------>|
   |                |                  |                   |
   |                |                  | StudentDTO        |
   |                |                  | (includes         |
   |                |                  |  classCode)       |
   |                |                  |<------------------|
   |                |                  |                   |
   |                |                  | Save User with    |
   |                |                  | classCode         |
   |                |                  |                   |
   |                | Success          |                   |
   |                |<-----------------|                   |
   |  Email sent    |                  |                   |
   |<---------------|                  |                   |
```

### Login Flow

```
Student          Frontend         Auth Service      Database
   |                |                  |                |
   |  Enter creds   |                  |                |
   |--------------->|                  |                |
   |                | POST /login      |                |
   |                |----------------->|                |
   |                |                  | Query User     |
   |                |                  | (includes      |
   |                |                  |  classCode)    |
   |                |                  |--------------->|
   |                |                  |                |
   |                |                  | User entity    |
   |                |                  |<---------------|
   |                |                  |                |
   |                | AuthResponse     |                |
   |                | (UserDTO with    |                |
   |                |  classCode)      |                |
   |                |<-----------------|                |
   |  Logged in     |                  |                |
   |<---------------|                  |                |
```

### Rubric Filtering Flow

```
Student          Frontend         Evaluation Service    Database
   |                |                     |                 |
   |  View rubric   |                     |                 |
   |--------------->|                     |                 |
   |                | GET /rubrics/       |                 |
   |                | active?classCode=   |                 |
   |                | D21DCCN01-N         |                 |
   |                |-------------------->|                 |
   |                |                     | Query active    |
   |                |                     | rubrics         |
   |                |                     |---------------->|
   |                |                     |                 |
   |                |                     | Rubrics list    |
   |                |                     |<----------------|
   |                |                     |                 |
   |                |                     | Filter by       |
   |                |                     | targetClasses   |
   |                |                     |                 |
   |                | Filtered rubric     |                 |
   |                |<--------------------|                 |
   |  Show rubric   |                     |                 |
   |<---------------|                     |                 |
```

## Key Points

### 1. Single Source of Truth

- **Student Service** is the source of truth for classCode
- **Auth Service** caches it for performance
- Updates happen when user requests password

### 2. Performance Optimization

- ClassCode stored in User entity (no join needed)
- Indexed for fast lookups
- Reduces calls to student-service

### 3. Data Consistency

- ClassCode updated on password request
- Ensures data stays in sync with student records
- Automatic updates when student changes class

### 4. Filtering Logic

```
IF rubric.targetClasses IS NULL OR EMPTY:
    RETURN rubric  // Applies to all classes
ELSE IF rubric.targetClasses CONTAINS user.classCode:
    RETURN rubric  // Applies to this class
ELSE:
    SKIP rubric    // Does not apply to this class
```

### 5. Error Handling

- If no rubric matches → Return 404 "No active rubric found for class"
- If classCode is null → Return first active rubric (backward compatible)
- If student-service fails → User creation fails (validation required)

## Database Schema

### Auth Service - users table

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    student_code VARCHAR(20),
    class_code VARCHAR(20),  -- ← New field
    -- ... other fields
    INDEX idx_users_class_code (class_code)
);
```

### Evaluation Service - rubrics table

```sql
CREATE TABLE rubrics (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    target_classes TEXT,  -- ← Comma-separated class codes
    -- ... other fields
);
```

## Example Scenarios

### Scenario 1: All Classes

```
Rubric: targetClasses = NULL
Student A (D21DCCN01-N): ✓ Sees rubric
Student B (D21DCCN02-N): ✓ Sees rubric
Student C (D22DCCN01-N): ✓ Sees rubric
```

### Scenario 2: Specific Classes

```
Rubric: targetClasses = "D21DCCN01-N,D21DCCN02-N"
Student A (D21DCCN01-N): ✓ Sees rubric
Student B (D21DCCN02-N): ✓ Sees rubric
Student C (D22DCCN01-N): ✗ Does NOT see rubric
```

### Scenario 3: Multiple Rubrics

```
Rubric A: targetClasses = "D21DCCN01-N"
Rubric B: targetClasses = "D21DCCN02-N"

Student A (D21DCCN01-N): Sees Rubric A
Student B (D21DCCN02-N): Sees Rubric B
```

## Testing Checklist

- [ ] User registration stores classCode
- [ ] Password request updates classCode
- [ ] Login returns classCode in UserDTO
- [ ] /me endpoint includes classCode
- [ ] Rubric filtering works with classCode
- [ ] Rubric with NULL targetClasses shows to all
- [ ] Rubric with specific classes filters correctly
- [ ] Students in other classes get 404
- [ ] Frontend receives and uses classCode

## Related Documentation

- `docs/CLASS_CODE_IMPLEMENTATION.md` - Implementation details
- `docs/RUBRIC_CLASS_FILTERING.md` - Feature documentation
- `NEXT_STEPS.md` - Deployment guide
- `QUICK_REFERENCE.md` - Quick reference
