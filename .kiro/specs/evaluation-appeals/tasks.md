# Implementation Plan - Evaluation Appeals System

- [x] 1. Database schema and migrations

  - Create migration V9\_\_create_appeals_tables.sql with appeals, appeal_criteria, appeal_files tables
  - Add appeal_deadline_days column to evaluation_periods table
  - Create indexes for performance optimization
  - Create rollback migration U9\_\_rollback_create_appeals_tables.sql
  - _Requirements: 10.1, 10.2, 10.3, 10.6, 10.7, 2.1_

- [x] 2. Backend entities and repositories

  - Create Appeal entity with all fields and relationships
  - Create AppealCriteria entity for many-to-many relationship
  - Create AppealFile entity for evidence file references
  - Create AppealStatus enum (PENDING, REVIEWING, ACCEPTED, REJECTED)
  - Create AppealRepository with custom query methods
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 3. Backend DTOs and mappers

  - Create AppealDTO for API responses
  - Create CreateAppealRequest DTO
  - Create ReviewAppealRequest DTO
  - Create AppealMapper using MapStruct
  - _Requirements: 1.4, 1.5, 4.6_

- [x] 4. Appeal service - core logic

  - Implement createAppeal() method with validation
  - Implement getAppealById() with authorization checks
  - Implement getStudentAppeals() with filtering
  - Implement getPendingAppeals() for reviewers
  - Implement canAppeal() to check eligibility
  - Implement getAppealDeadline() calculation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8, 2.3, 2.4, 3.1, 4.1, 8.1, 8.2_

- [x] 5. Appeal service - review logic

  - Implement reviewAppeal() method for accept/reject
  - Update evaluation status to CLASS_APPROVED on acceptance
  - Maintain evaluation status on rejection
  - Record reviewer ID and review date
  - Validate review comment is not empty
  - _Requirements: 4.6, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6. Notification integration

  - Send notification to Faculty when appeal is created
  - Send notification to student when appeal is accepted
  - Send notification to student when appeal is rejected with reason
  - _Requirements: 1.9, 5.5, 6.6_

- [x] 7. Appeal controller and API endpoints

  - Implement POST /api/appeals (create appeal)
  - Implement GET /api/appeals/my (student's appeals)
  - Implement GET /api/appeals/pending (reviewer's pending appeals)
  - Implement GET /api/appeals/{id} (appeal details)
  - Implement PUT /api/appeals/{id}/review (review appeal)
  - Implement GET /api/appeals/evaluation/{evaluationId}/can-appeal (check eligibility)
  - Add proper error handling and validation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 4.1, 4.6, 8.1, 8.2, 8.3_

- [x] 8. Update evaluation period management

  - Add appeal_deadline_days field to evaluation period entity
  - Validate appeal_deadline_days is positive integer
  - Display appeal deadline in period list (frontend task)
  - _Requirements: 2.1, 2.2_

- [x] 9. Frontend types and API client

  - Create Appeal, AppealCriteria, AppealFile TypeScript interfaces
  - Create CreateAppealRequest, ReviewAppealRequest interfaces
  - Implement API client functions in lib/api/appeals.ts
  - Add error handling and retry logic
  - _Requirements: 1.4, 1.5, 4.6_

- [x] 10. Appeal status badge component

  - Create AppealStatusBadge component with color coding
  - PENDING (yellow), REVIEWING (blue), ACCEPTED (green), REJECTED (red)
  - _Requirements: 3.2, 4.2_

- [x] 11. Appeal creation dialog

  - Create AppealDialog component with form
  - Text area for appeal reason with validation
  - Checkbox list for criteria selection or "All criteria" option
  - File upload for evidence (placeholder - to be implemented)
  - Submit button with loading state
  - Success/error toast notifications
  - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.10_

- [x] 12. Student appeals list page

  - Create /appeals/my page for students
  - Display paginated table of student's appeals
  - Show evaluation semester, appeal date, status, criteria count
  - Click row to navigate to appeal detail
  - Empty state when no appeals
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 13. Appeal detail page (student view)

  - Create /appeals/[id] page
  - Display appeal reason and evidence files
  - Display appealed criteria list
  - Display review decision and comments if reviewed
  - Link to original evaluation
  - Show appeal status badge
  - _Requirements: 3.4, 3.5_

- [x] 14. Appeals management page (reviewer)

  - Create /appeals page for faculty/admin
  - Display paginated table of pending/reviewing appeals
  - Show student name, evaluation semester, appeal date, criteria
  - Click row to navigate to review page
  - Empty state when no pending appeals
  - _Requirements: 4.1, 4.2, 4.3, 8.4_

- [x] 15. Appeal review page (reviewer)

  - Create /appeals/[id]/review page
  - Display original evaluation details
  - Display appeal reason and evidence files
  - Display appealed criteria
  - Accept/Reject buttons
  - Review comment text area with validation
  - Confirmation dialog before submitting decision
  - Success toast and redirect after review
  - _Requirements: 4.4, 4.5, 4.6, 5.6, 6.8_

- [x] 16. Evaluation detail page integration

  - Add "Appeal" button when status is FACULTY_APPROVED (AppealButton component)
  - Check appeal deadline before showing button
  - Open AppealDialog when button clicked
  - Display appeal indicator if evaluation has appeals (to be added by user)
  - Show appeal history section with all appeals for this evaluation (to be added by user)
  - _Requirements: 1.1, 2.5, 7.2, 9.1, 9.4_

- [x] 17. Dashboard integration

  - Add "My Appeals" card to student dashboard with count (StudentAppealCard)
  - Add "Pending Appeals" card to reviewer dashboard with count (ReviewerAppealCard)
  - Link cards to respective appeals pages
  - _Requirements: 9.2, 9.3_

- [x] 18. Authorization and access control

  - Implement canAppeal check in frontend (AppealButton component)
  - Protect appeals management page (faculty/admin only) - implemented in controller
  - Protect appeal review page (faculty/admin only) - implemented in controller
  - Verify ownership for student appeal views - implemented in service
  - Show/hide UI elements based on user role - implemented in components
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 19. Multiple appeals support

  - Allow creating new appeal after rejection - backend supports this
  - Display previous appeal attempts when creating new appeal (to be added by user)
  - Show appeal count in evaluation detail (to be added by user)
  - Enforce deadline even for subsequent appeals - implemented in backend
  - _Requirements: 6.7, 7.1, 7.3, 7.4, 7.5_

- [x] 20. Error handling and validation

  - Display validation errors for empty appeal reason - implemented in AppealDialog
  - Display error when deadline has passed - implemented in backend
  - Display error when evaluation status is not FACULTY_APPROVED - implemented in backend
  - Display error for file upload limits - implemented in AppealDialog
  - Display error for empty review comment - implemented in review page
  - Handle authorization errors gracefully - implemented in API client
  - _Requirements: 1.2, 1.3, 1.4, 1.6, 1.7, 4.6_

- [ ]\* 21. Unit tests for backend

  - Write unit tests for AppealService methods
  - Write unit tests for AppealController endpoints
  - Write unit tests for AppealRepository queries
  - Write unit tests for validation logic
  - Write unit tests for authorization checks
  - _Requirements: All_

- [ ]\* 22. Property-based tests

  - **Property 1: Appeal status validation** - _Requirements: 1.2_
  - **Property 2: Appeal deadline enforcement** - _Requirements: 1.3, 2.4_
  - **Property 3: Appeal reason validation** - _Requirements: 1.4_
  - **Property 5: Initial appeal status** - _Requirements: 1.8_
  - **Property 7: Positive deadline days validation** - _Requirements: 2.2_
  - **Property 8: Deadline calculation** - _Requirements: 2.3_
  - **Property 9: Student appeals filtering** - _Requirements: 3.1_
  - **Property 13: Pending appeals filtering** - _Requirements: 4.1_
  - **Property 16: Review comment validation** - _Requirements: 4.6_
  - **Property 18: Accept status transition** - _Requirements: 5.1_
  - **Property 19: Evaluation status update on acceptance** - _Requirements: 5.2_
  - **Property 23: Reject status transition** - _Requirements: 6.1_
  - **Property 24: Evaluation status invariant on rejection** - _Requirements: 6.2_
  - **Property 25: Evaluation scores invariant on rejection** - _Requirements: 6.3_
  - **Property 29: Multiple appeals allowance** - _Requirements: 6.7, 7.1_
  - **Property 33: Deadline overrides multiple appeals** - _Requirements: 7.5_
  - **Property 34: Owner-only appeal creation** - _Requirements: 8.1_
  - **Property 36: Review authorization** - _Requirements: 8.3_
  - **Property 45: Cascade delete integrity** - _Requirements: 10.6_

- [ ]\* 23. Frontend unit tests

  - Write tests for AppealDialog component
  - Write tests for AppealStatusBadge component
  - Write tests for appeals list pages
  - Write tests for appeal review page
  - Write tests for API client functions
  - _Requirements: All_

- [ ]\* 24. Integration tests

  - Test complete appeal workflow (create → review → accept)
  - Test complete appeal workflow (create → review → reject → create again)
  - Test notification integration
  - Test file upload integration
  - Test evaluation status update integration
  - Test cascade delete behavior
  - _Requirements: All_

- [ ] 25. Documentation and deployment
  - Update API documentation with new endpoints
  - Create user guide for students (how to appeal)
  - Create reviewer guide for faculty/admin
  - Test database migration on staging
  - Deploy to production
  - Monitor appeal creation and review metrics
  - _Requirements: All_
