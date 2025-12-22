package ptit.drl.evaluation.service;

import feign.FeignException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptit.drl.evaluation.dto.*;
import ptit.drl.evaluation.entity.*;
import ptit.drl.evaluation.entity.EvaluationPeriod;
import ptit.drl.evaluation.entity.ClassApproval;
import ptit.drl.evaluation.exception.DuplicateResourceException;
import ptit.drl.evaluation.exception.InvalidStateTransitionException;
import ptit.drl.evaluation.exception.ResourceNotFoundException;
import ptit.drl.evaluation.mapper.EvaluationMapper;
import ptit.drl.evaluation.repository.*;
import ptit.drl.evaluation.client.StudentServiceClient;
import ptit.drl.evaluation.service.FileService;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Service for Evaluation workflow operations
 * Uses Feign Client to communicate with student-service for student validation
 */
@Service
@Transactional
public class EvaluationService {
    
    private static final Logger logger = LoggerFactory.getLogger(EvaluationService.class);
    
    @Autowired
    private EvaluationRepository evaluationRepository;
    
    @Autowired
    private EvaluationHistoryRepository evaluationHistoryRepository;
    
    @Autowired
    private RubricRepository rubricRepository;
    
    @Autowired
    private CriteriaRepository criteriaRepository;
    
    @Autowired
    private StudentServiceClient studentServiceClient;
    
    @Autowired
    private EvaluationPeriodService periodService;
    
    @Autowired(required = false)
    private NotificationService notificationService;
    
    @Autowired(required = false)
    private ptit.drl.evaluation.client.AuthServiceClient authServiceClient;
    
    @Autowired(required = false)
    private EvidenceValidationService evidenceValidationService;
    
    @Autowired
    private ClassApprovalRepository classApprovalRepository;
    
    @Autowired(required = false)
    private FileService fileService;
    
    /**
     * Create new evaluation (DRAFT status)
     * Validates student exists via student-service
     * @param request The evaluation creation request
     * @param createdBy User ID who created this evaluation (null if student, set if admin)
     */
    public EvaluationDTO createEvaluation(CreateEvaluationRequest request, Long createdBy) {
        // Validate student exists via student-service
        try {
            StudentServiceClient.StudentResponse studentResponse = 
                studentServiceClient.getStudentByCode(request.getStudentCode());
            // If response is null or indicates failure, student doesn't exist
            if (studentResponse == null || !studentResponse.isSuccess() || studentResponse.getData() == null) {
                throw new ResourceNotFoundException(
                    "Student", "code", request.getStudentCode());
            }
        } catch (ResourceNotFoundException e) {
            // Re-throw if already ResourceNotFoundException (from error decoder)
            // Update message to include actual studentCode
            throw new ResourceNotFoundException(
                "Student", "code", request.getStudentCode());
        } catch (FeignException.NotFound e) {
            // Feign 404 exception (fallback if error decoder didn't catch it)
            throw new ResourceNotFoundException(
                "Student", "code", request.getStudentCode());
        } catch (FeignException e) {
            // Other Feign exceptions (e.g., 500, 503)
            if (e.status() == 404) {
                throw new ResourceNotFoundException(
                    "Student", "code", request.getStudentCode());
            }
            // For other errors, re-throw as generic exception
            throw new RuntimeException("Failed to validate student code: " + e.getMessage(), e);
        } catch (Exception e) {
            // Check if it's a ResourceNotFoundException wrapped in the exception
            if (e instanceof ResourceNotFoundException) {
                throw (ResourceNotFoundException) e;
            }
            if (e.getCause() instanceof ResourceNotFoundException) {
                throw (ResourceNotFoundException) e.getCause();
            }
            // If we can't determine, assume student doesn't exist
            throw new ResourceNotFoundException(
                "Student", "code", request.getStudentCode());
        }
        
        // Validate rubric exists and is active
        Rubric rubric = rubricRepository.findById(request.getRubricId())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Rubric", "id", request.getRubricId()));
        
        if (!rubric.getIsActive()) {
            throw new IllegalArgumentException("Rubric is not active");
        }
        
        // Check if evaluation already exists for this semester
        if (evaluationRepository.existsByStudentCodeAndSemester(
                request.getStudentCode(), request.getSemester())) {
            throw new DuplicateResourceException(
                String.format("Evaluation already exists for student %s in semester %s", 
                    request.getStudentCode(), request.getSemester()));
        }
        
        // Create evaluation (no Student entity needed, just studentCode)
        Evaluation evaluation = EvaluationMapper.toEntity(request, rubric);
        evaluation.setTotalPoints(0.0); // Will be calculated below
        evaluation.setCreatedBy(createdBy); // Set createdBy for audit trail
        
        // Save evaluation first to get ID (needed for composite key in EvaluationDetail)
        Evaluation saved = evaluationRepository.save(evaluation);
        
        // Create evaluation details (now we have evaluation ID)
        List<EvaluationDetail> details = new ArrayList<>();
        double totalScore = 0.0;
        boolean isDraft = request.getAsDraft() != null && request.getAsDraft();
        
        for (CreateEvaluationDetailRequest detailRequest : request.getDetails()) {
            Criteria criteria = criteriaRepository.findById(detailRequest.getCriteriaId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "Criteria", "id", detailRequest.getCriteriaId()));
            
            // Validate criteria belongs to rubric
            if (!criteria.getRubric().getId().equals(rubric.getId())) {
                throw new IllegalArgumentException(
                    "Criteria " + criteria.getId() + " does not belong to rubric " + rubric.getId());
            }
            
            // Get score (default to 0 if null - applies to both draft and non-draft)
            Double score = detailRequest.getScore();
            if (score == null) {
                score = 0.0; // Default to 0 if null (for both draft and non-draft)
            }
            
            // Validate score does not exceed maxPoints (applies to both draft and non-draft)
            // Note: Negative scores are allowed (some criteria can deduct points)
            // Note: Total score = 0 is also allowed (can happen in valid scenarios)
            if (score > criteria.getMaxPoints()) {
                throw new IllegalArgumentException(
                    String.format("Score %.2f exceeds max score %.2f for criteria %s",
                        score, criteria.getMaxPoints(), criteria.getName()));
            }
            
            // Create detail with validated score
            CreateEvaluationDetailRequest validatedDetail = new CreateEvaluationDetailRequest();
            validatedDetail.setCriteriaId(detailRequest.getCriteriaId());
            validatedDetail.setScore(score);
            validatedDetail.setEvidence(detailRequest.getEvidence());
            validatedDetail.setNote(detailRequest.getNote());
            
            EvaluationDetail detail = EvaluationMapper.toDetailEntity(
                validatedDetail, saved, criteria);
            details.add(detail);
            totalScore += score;
        }
        
        saved.setDetails(details);
        saved.setTotalPoints(totalScore);
        
        // Save again with details
        saved = evaluationRepository.save(saved);
        
        // Link files with evaluation (extract from evidence and link files that have evaluationId=null or 0)
        if (fileService != null) {
            for (EvaluationDetail detail : details) {
                String evidence = detail.getComment(); // Evidence is stored in comment field
                if (evidence != null && !evidence.isEmpty()) {
                    try {
                        fileService.linkFilesWithEvaluation(
                            saved.getId(), 
                            detail.getCriteriaId(), 
                            evidence
                        );
                    } catch (Exception e) {
                        // Log but don't fail evaluation creation if file linking fails
                        // This is a best-effort operation
                        System.err.println("Warning: Failed to link files for evaluation " + saved.getId() + 
                            ", criteria " + detail.getCriteriaId() + ": " + e.getMessage());
                    }
                }
            }
        }
        
        // Create history entry (no User entity, use null for actor)
        String historyMessage = isDraft 
            ? "Evaluation saved as draft" 
            : "Evaluation created";
        EvaluationHistory history = new EvaluationHistory(
            saved, "CREATED", null, "DRAFT", null, null, null, historyMessage);
        saved.addHistory(history);
        evaluationHistoryRepository.save(history);
        
        return EvaluationMapper.toDTO(saved);
    }
    
    /**
     * Sync files with evaluation (one-time fix for existing data)
     * Links files that have evaluationId=null or 0 with the evaluation
     */
    @Transactional
    public void syncFilesWithEvaluation(Long evaluationId) {
        if (fileService == null) return;
        
        try {
            Evaluation eval = evaluationRepository.findByIdWithRelations(evaluationId).orElse(null);
            if (eval != null && eval.getDetails() != null) {
            for (EvaluationDetail detail : eval.getDetails()) {
                String evidence = detail.getComment(); // Evidence is stored in comment field
                if (evidence != null && !evidence.isEmpty()) {
                    fileService.linkFilesWithEvaluation(evaluationId, detail.getCriteriaId(), evidence);
                }
            }
            }
        } catch (Exception e) {
            // Log but don't fail - this is a best-effort operation
            System.err.println("Warning: Failed to sync files for evaluation " + evaluationId + ": " + e.getMessage());
            throw new RuntimeException("Failed to sync files: " + e.getMessage(), e);
        }
    }
    
    /**
     * Get evaluation by ID
     */
    @Transactional(readOnly = true)
    public EvaluationDTO getEvaluationById(Long id) {
        // Use optimized query with fetch join to avoid N+1 queries
        // Note: Cannot fetch both 'details' and 'history' together (MultipleBagFetchException)
        // So we fetch details first, then history separately
        Evaluation evaluation = evaluationRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", id));
        
        // Fetch history separately to avoid MultipleBagFetchException
        // Use a separate query to load history and merge it into the evaluation
        evaluationRepository.findByIdWithHistory(id).ifPresent(evalWithHistory -> {
            if (evalWithHistory.getHistory() != null) {
                evaluation.setHistory(evalWithHistory.getHistory());
            }
        });
        
        return EvaluationMapper.toDTO(evaluation);
    }
    
    /**
     * Get evaluations by student code
     */
    @Transactional(readOnly = true)
    public List<EvaluationDTO> getEvaluationsByStudent(String studentCode, String semester) {
        // Validate student exists via student-service
        try {
            StudentServiceClient.StudentResponse studentResponse = 
                studentServiceClient.getStudentByCode(studentCode);
            if (!studentResponse.isSuccess() || studentResponse.getData() == null) {
                throw new ResourceNotFoundException("Student", "code", studentCode);
            }
        } catch (ResourceNotFoundException e) {
            // Re-throw if already ResourceNotFoundException
            throw e;
        } catch (Exception e) {
            throw new ResourceNotFoundException("Student", "code", studentCode);
        }
        
        // Query evaluations by studentCode
        
        List<Evaluation> evaluations;
        if (semester != null && !semester.isEmpty()) {
            evaluations = evaluationRepository.findByStudentCodeAndSemester(
                studentCode, semester);
        } else {
            evaluations = evaluationRepository.findByStudentCode(studentCode);
        }
        
        return evaluations.stream()
                .map(EvaluationMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Update evaluation (only in DRAFT status)
     */
    @Transactional
    public EvaluationDTO updateEvaluation(Long id, UpdateEvaluationRequest request) {
        // Use optimized query with fetch join
        Evaluation evaluation = evaluationRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", id));
        
        // Check if can edit
        if (!evaluation.getStatus().canEdit()) {
            throw new InvalidStateTransitionException(
                evaluation.getStatus().name(), "UPDATE");
        }
        
        // Delete existing details properly to avoid orphanRemoval issues
        // Create a copy of the list to avoid ConcurrentModificationException
        List<EvaluationDetail> detailsToDelete = new ArrayList<>(evaluation.getDetails());
        // Remove all from the collection (orphanRemoval will handle deletion)
        evaluation.getDetails().removeAll(detailsToDelete);
        evaluationRepository.flush(); // Flush to ensure old details are deleted
        
        // Create new details (exactly same logic as create)
        List<EvaluationDetail> details = new ArrayList<>();
        double totalScore = 0.0;
        for (CreateEvaluationDetailRequest detailRequest : request.getDetails()) {
            Criteria criteria = criteriaRepository.findById(detailRequest.getCriteriaId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "Criteria", "id", detailRequest.getCriteriaId()));
            
            // Get score (default to 0 if null - same as create)
            Double score = detailRequest.getScore();
            if (score == null) {
                score = 0.0;
            }
            
            // Validate score does not exceed maxPoints (same as create)
            if (score > criteria.getMaxPoints()) {
                throw new IllegalArgumentException(
                    String.format("Score %.2f exceeds max score %.2f for criteria %s",
                        score, criteria.getMaxPoints(), criteria.getName()));
            }
            
            // Create detail with validated score (exactly same as create)
            CreateEvaluationDetailRequest validatedDetail = new CreateEvaluationDetailRequest();
            validatedDetail.setCriteriaId(detailRequest.getCriteriaId());
            validatedDetail.setScore(score);
            // Remove "Evidence: " prefix if frontend accidentally sends it
            String evidence = detailRequest.getEvidence();
            if (evidence != null && evidence.startsWith("Evidence: ")) {
                evidence = evidence.substring("Evidence: ".length());
            }
            validatedDetail.setEvidence(evidence); // Evidence without prefix
            validatedDetail.setNote(detailRequest.getNote());
            
            EvaluationDetail detail = EvaluationMapper.toDetailEntity(
                validatedDetail, evaluation, criteria);
            
            details.add(detail);
            totalScore += score;
        }
        
        // Add new details to the existing collection (don't use setDetails to avoid orphanRemoval issues)
        // The collection is now empty after removeAll, so we can safely addAll
        evaluation.getDetails().addAll(details);
        evaluation.setTotalPoints(totalScore);
        
        // Save (exactly same as create)
        Evaluation saved = evaluationRepository.save(evaluation);
        
        // Link files with evaluation (extract from evidence and link files that have evaluationId=null or 0)
        if (fileService != null) {
            for (EvaluationDetail detail : details) {
                String evidence = detail.getComment(); // Evidence is stored in comment field
                if (evidence != null && !evidence.isEmpty()) {
                    try {
                        fileService.linkFilesWithEvaluation(
                            saved.getId(), 
                            detail.getCriteriaId(), 
                            evidence
                        );
                    } catch (Exception e) {
                        // Log but don't fail evaluation update if file linking fails
                        System.err.println("Warning: Failed to link files for evaluation " + saved.getId() + 
                            ", criteria " + detail.getCriteriaId() + ": " + e.getMessage());
                    }
                }
            }
        }
        
        // Reload to ensure all details are properly loaded
        Evaluation updated = evaluationRepository.findByIdWithRelations(saved.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", saved.getId()));
        
        EvaluationDTO result = EvaluationMapper.toDTO(updated);
        
        return result;
    }
    
    /**
     * Submit evaluation for approval (DRAFT → SUBMITTED)
     */
    public EvaluationDTO submitEvaluation(Long id) {
        // Use optimized query with fetch join
        Evaluation evaluation = evaluationRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", id));
        
        // Check if can submit
        if (!evaluation.getStatus().canSubmit()) {
            throw new InvalidStateTransitionException(
                evaluation.getStatus().name(), "SUBMIT");
        }
        
        // Check if there is an open evaluation period
        Optional<EvaluationPeriod> openPeriod = periodService.getOpenPeriod();
        if (openPeriod.isEmpty()) {
            throw new InvalidStateTransitionException(
                "Không có đợt đánh giá nào đang mở. Vui lòng liên hệ quản trị viên hoặc đợi đến đợt tiếp theo.");
        }
        
        // Check if evaluation semester matches the open period
        EvaluationPeriod period = openPeriod.get();
        if (!period.getSemester().equals(evaluation.getSemester())) {
            throw new InvalidStateTransitionException(
                String.format("Đợt đánh giá hiện tại chỉ dành cho học kỳ '%s', không phải '%s'.", 
                    period.getSemester(), evaluation.getSemester()));
        }
        
        // Change status
        EvaluationStatus oldStatus = evaluation.getStatus();
        evaluation.setStatus(EvaluationStatus.SUBMITTED);
        evaluation.setSubmittedAt(LocalDate.now());
        
        // Create history entry (no User entity)
        EvaluationHistory history = new EvaluationHistory(
            evaluation, "SUBMITTED", oldStatus.name(), "SUBMITTED", 
            null, null, null, "Evaluation submitted for approval");
        evaluation.addHistory(history);
        evaluationHistoryRepository.save(history);
        
        Evaluation updated = evaluationRepository.save(evaluation);
        
        // Send notifications
        System.out.println("=== NOTIFICATION DEBUG ===");
        System.out.println("notificationService is null: " + (notificationService == null));
        System.out.println("authServiceClient is null: " + (authServiceClient == null));
        
        if (notificationService == null) {
            System.err.println("WARNING: NotificationService is null, cannot send notifications for evaluation: " + updated.getId());
        }
        if (authServiceClient == null) {
            System.err.println("WARNING: AuthServiceClient is null, cannot send notifications for evaluation: " + updated.getId());
        }
        
        if (notificationService != null && authServiceClient != null) {
            try {
                System.out.println("Creating notifications for evaluation: " + updated.getId() + ", student: " + evaluation.getStudentCode());
                String studentName = evaluation.getStudentCode(); // Fallback
                String classCode = null;
                String facultyCode = null;
                
                // Try to get student info from student-service
                if (studentServiceClient != null) {
                    try {
                        StudentServiceClient.StudentResponse studentResponse = 
                            studentServiceClient.getStudentByCode(evaluation.getStudentCode());
                        
                        if (studentResponse != null && studentResponse.isSuccess() && studentResponse.getData() != null) {
                            StudentServiceClient.StudentDTO student = studentResponse.getData();
                            studentName = student.getFullName();
                            classCode = student.getClassCode();
                            facultyCode = student.getFacultyCode();
                        }
                    } catch (Exception e) {
                        // StudentServiceClient not available or failed - use fallback values
                        System.err.println("Warning: Failed to get student info from student-service: " + e.getMessage());
                    }
                }
                
                // Notify reviewers (even if student info is incomplete)
                notificationService.notifyEvaluationNeedsReview(
                    updated.getId(),
                    studentName,
                    evaluation.getStudentCode(),
                    classCode,
                    facultyCode,
                    "SUBMITTED"
                );
                
                // Notify student
                try {
                    ptit.drl.evaluation.client.AuthServiceClient.UserIdResponse userIdResponse = 
                        authServiceClient.getUserIdByStudentCode(evaluation.getStudentCode());
                    if (userIdResponse != null && userIdResponse.isSuccess() && userIdResponse.getData() != null) {
                        notificationService.createNotification(
                            userIdResponse.getData(),
                            "Đánh giá đã được nộp",
                            String.format(
                                "Đánh giá điểm rèn luyện của bạn (Học kỳ: %s) đã được nộp thành công. Vui lòng chờ duyệt.",
                                evaluation.getSemester()
                            ),
                            ptit.drl.evaluation.entity.Notification.NotificationType.EVALUATION_SUBMITTED,
                            "EVALUATION",
                            updated.getId()
                        );
                    }
                } catch (Exception e) {
                    System.err.println("Warning: Failed to notify student about submission: " + e.getMessage());
                }
            } catch (Exception e) {
                System.err.println("Error creating submit notifications: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        // Trigger async AI validation for all evidence files
        if (evidenceValidationService != null) {
            try {
                evidenceValidationService.validateEvaluationEvidenceAsync(updated);
            } catch (Exception e) {
                // Log error but don't fail submission if validation fails
                // Validation will be retried or can be triggered manually
            }
        }
        
        return EvaluationMapper.toDTO(updated);
    }
    
    /**
     * Approve evaluation (move to next approval level)
     * Note: approverId, approverName, and approverRoles should come from auth-service/Gateway
     * @param scores Map of criteriaId -> score (optional, for CLASS_MONITOR and ADVISOR scoring)
     */
    public EvaluationDTO approveEvaluation(Long id, String comment, Long approverId, String approverName, List<String> approverRoles, Map<Long, Double> scores, Map<String, Double> subCriteriaScores) {
        // Use optimized query with fetch join
        Evaluation evaluation = evaluationRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", id));
        
        // Check if can approve
        if (!evaluation.getStatus().canApprove()) {
            throw new InvalidStateTransitionException(
                evaluation.getStatus().name(), "APPROVE");
        }
        
        EvaluationStatus oldStatus = evaluation.getStatus();
        EvaluationStatus newStatus;
        String level;
        
        // Handle different approval levels based on current status and approver role
        if (oldStatus == EvaluationStatus.SUBMITTED) {
            // SUBMITTED: Need CLASS_MONITOR or ADMIN to approve
            boolean isClassMonitor = approverRoles != null && approverRoles.contains("CLASS_MONITOR");
            boolean isAdmin = approverRoles != null && approverRoles.contains("ADMIN");
            
            if (!isClassMonitor && !isAdmin) {
                throw new InvalidStateTransitionException(
                    "Only CLASS_MONITOR or ADMIN can approve SUBMITTED evaluations");
            }
            
            // Check if this approver has already approved this evaluation
            Optional<ClassApproval> existingApproval = 
                classApprovalRepository.findByEvaluationIdAndApproverId(id, approverId);
            
            if (existingApproval.isPresent()) {
                throw new InvalidStateTransitionException(
                    "You have already approved this evaluation. Evaluation is now in " + evaluation.getStatus() + " status.");
            }
            
            // Additional safety check: if evaluation is already CLASS_APPROVED or higher, don't allow approval
            if (evaluation.getStatus() != EvaluationStatus.SUBMITTED) {
                throw new InvalidStateTransitionException(
                    "Cannot approve evaluation in " + evaluation.getStatus() + " status. Expected SUBMITTED.");
            }
            
            // Save approval to class_approvals table
            ClassApproval classApproval = 
                new ClassApproval(
                    evaluation, approverId, approverName, 
                    "CLASS_MONITOR", 
                    comment);
            classApprovalRepository.save(classApproval);
            
            // CLASS_MONITOR approved → move to CLASS_APPROVED
            newStatus = EvaluationStatus.CLASS_APPROVED;
            level = "CLASS";
            logger.info("Setting evaluation {} status from {} to {}", id, oldStatus, newStatus);
            evaluation.setStatus(newStatus);
            logger.info("Evaluation {} status after setStatus: {}", id, evaluation.getStatus());
            logger.info("CLASS_MONITOR approved evaluation {}: {} -> {}", id, oldStatus, newStatus);
            
        } else if (oldStatus == EvaluationStatus.CLASS_APPROVED) {
            // CLASS_APPROVED: Need ADVISOR to approve
            boolean isAdvisor = approverRoles != null && approverRoles.contains("ADVISOR");
            if (!isAdvisor && (approverRoles == null || !approverRoles.contains("ADMIN"))) {
                throw new InvalidStateTransitionException(
                    "Only ADVISOR can approve CLASS_APPROVED evaluations");
            }
            newStatus = EvaluationStatus.ADVISOR_APPROVED;
            level = "ADVISOR";
        evaluation.setStatus(newStatus);
        
        } else if (oldStatus == EvaluationStatus.ADVISOR_APPROVED) {
            // ADVISOR_APPROVED: Need FACULTY_INSTRUCTOR to approve (final)
            boolean isFaculty = approverRoles != null && approverRoles.contains("FACULTY_INSTRUCTOR");
            if (!isFaculty && (approverRoles == null || !approverRoles.contains("ADMIN"))) {
                throw new InvalidStateTransitionException(
                    "Only FACULTY_INSTRUCTOR can approve ADVISOR_APPROVED evaluations");
            }
            newStatus = EvaluationStatus.FACULTY_APPROVED;
            level = "FACULTY";
            evaluation.setStatus(newStatus);
            // Final approval - set approved date
            evaluation.setApprovedAt(LocalDate.now());
            
        } else {
            throw new InvalidStateTransitionException(
                "Cannot approve evaluation in " + oldStatus + " status");
        }
        
        // Save scores if provided (for CLASS_MONITOR and ADVISOR)
        logger.info("[DEBUG] Processing scores for approval: scores={}, approverRoles={}, oldStatus={}", 
            scores, approverRoles, oldStatus);
        
        if (scores != null && !scores.isEmpty()) {
            boolean isClassMonitor = approverRoles != null && approverRoles.contains("CLASS_MONITOR");
            boolean isAdvisor = approverRoles != null && approverRoles.contains("ADVISOR");
            boolean isAdmin = approverRoles != null && approverRoles.contains("ADMIN");
            
            logger.info("[DEBUG] Approver type - isClassMonitor={}, isAdvisor={}, isAdmin={}", isClassMonitor, isAdvisor, isAdmin);
            logger.info("[DEBUG] Evaluation has {} details", evaluation.getDetails().size());
            
            for (Map.Entry<Long, Double> entry : scores.entrySet()) {
                Long criteriaId = entry.getKey();
                Double score = entry.getValue();
                
                logger.info("[DEBUG] Processing score: criteriaId={}, score={}", criteriaId, score);
                
                // Find the evaluation detail for this criteria
                EvaluationDetail detail = evaluation.getDetails().stream()
                    .filter(d -> d.getCriteriaId().equals(criteriaId))
                    .findFirst()
                    .orElse(null);
                
                if (detail != null) {
                    logger.info("[DEBUG] Found detail for criteria {}: currentClassMonitorScore={}, currentAdvisorScore={}", 
                        criteriaId, detail.getClassMonitorScore(), detail.getAdvisorScore());
                    
                    // ADMIN can save scores at any level
                    if ((isClassMonitor || isAdmin) && oldStatus == EvaluationStatus.SUBMITTED) {
                        // Save class monitor score
                        detail.setClassMonitorScore(score);
                        logger.info("[DEBUG] Set class monitor score {} for criteria {} in evaluation {}", 
                            score, criteriaId, id);
                    } else if ((isAdvisor || isAdmin) && oldStatus == EvaluationStatus.CLASS_APPROVED) {
                        // Save advisor score
                        detail.setAdvisorScore(score);
                        logger.info("[DEBUG] Set advisor score {} for criteria {} in evaluation {}", 
                            score, criteriaId, id);
                    } else {
                        logger.warn("[DEBUG] Score not saved - isClassMonitor={}, isAdvisor={}, isAdmin={}, oldStatus={}", 
                            isClassMonitor, isAdvisor, isAdmin, oldStatus);
                    }
                } else {
                    logger.error("[DEBUG] Criteria {} not found in evaluation {} details. Available criteriaIds: {}", 
                        criteriaId, id, evaluation.getDetails().stream()
                            .map(d -> d.getCriteriaId().toString())
                            .collect(Collectors.joining(", ")));
                }
            }
        } else {
            logger.info("[DEBUG] No scores provided in approval request");
        }
        
        // Save sub-criteria scores if provided
        // TODO: Move to separate table evaluation_sub_criteria_scores in future
        // For now, store as JSON in comment field
        if (subCriteriaScores != null && !subCriteriaScores.isEmpty()) {
            boolean isClassMonitor = approverRoles != null && approverRoles.contains("CLASS_MONITOR");
            boolean isAdvisor = approverRoles != null && approverRoles.contains("ADVISOR");
            boolean isAdmin = approverRoles != null && approverRoles.contains("ADMIN");
            
            logger.info("[DEBUG] Processing subCriteriaScores: count={}, isClassMonitor={}, isAdvisor={}, isAdmin={}", 
                subCriteriaScores.size(), isClassMonitor, isAdvisor, isAdmin);
            
            // Group sub-criteria scores by criteriaId
            Map<Long, Map<String, Double>> scoresByCriteria = new HashMap<>();
            for (Map.Entry<String, Double> entry : subCriteriaScores.entrySet()) {
                String key = entry.getKey(); // format: "criterionId_subCriteriaId"
                Double score = entry.getValue();
                String[] parts = key.split("_", 2);
                if (parts.length == 2) {
                    try {
                        Long criteriaId = Long.parseLong(parts[0]);
                        String subCriteriaId = parts[1];
                        scoresByCriteria.computeIfAbsent(criteriaId, k -> new HashMap<>()).put(subCriteriaId, score);
                    } catch (NumberFormatException e) {
                        logger.warn("[DEBUG] Invalid subCriteriaScore key format: {}", key);
                    }
                }
            }
            
            // Save sub-criteria scores to evaluation details comment as JSON
            for (Map.Entry<Long, Map<String, Double>> entry : scoresByCriteria.entrySet()) {
                Long criteriaId = entry.getKey();
                Map<String, Double> subScores = entry.getValue();
                
                EvaluationDetail detail = evaluation.getDetails().stream()
                    .filter(d -> d.getCriteriaId().equals(criteriaId))
                    .findFirst()
                    .orElse(null);
                
                if (detail != null) {
                    try {
                        // Parse existing comment JSON if exists, otherwise create new
                        Map<String, Object> commentData = new HashMap<>();
                        String originalComment = detail.getComment();
                        
                        if (originalComment != null && !originalComment.isEmpty()) {
                            // Check if comment is JSON (starts with {)
                            if (originalComment.trim().startsWith("{")) {
                                // It's JSON, parse it
                                try {
                                    ObjectMapper mapper = new ObjectMapper();
                                    commentData = mapper.readValue(originalComment, Map.class);
                                    logger.info("[DEBUG] Parsed existing JSON comment for criteria {}", criteriaId);
                                } catch (Exception e) {
                                    // JSON parse failed, treat as evidence string
                                    logger.warn("[DEBUG] Failed to parse JSON comment, treating as evidence string: {}", e.getMessage());
                                    commentData.put("evidence", originalComment);
                                }
                            } else {
                                // Not JSON, it's evidence string - preserve it
                                logger.info("[DEBUG] Comment is evidence string, preserving in evidence field");
                                commentData.put("evidence", originalComment);
                            }
                        }
                        
                        // Add sub-criteria scores
                        Map<String, Object> scoresData = new HashMap<>();
                        if (commentData.containsKey("scores")) {
                            scoresData = (Map<String, Object>) commentData.get("scores");
                        }
                        
                        // ADMIN can save scores at any level
                        if ((isClassMonitor || isAdmin) && oldStatus == EvaluationStatus.SUBMITTED) {
                            scoresData.put("classMonitorSubCriteria", subScores);
                            logger.info("[DEBUG] Saved class monitor sub-criteria scores for criteria {}: {}", 
                                criteriaId, subScores);
                        } else if ((isAdvisor || isAdmin) && oldStatus == EvaluationStatus.CLASS_APPROVED) {
                            scoresData.put("advisorSubCriteria", subScores);
                            logger.info("[DEBUG] Saved advisor sub-criteria scores for criteria {}: {}", 
                                criteriaId, subScores);
                        }
                        
                        commentData.put("scores", scoresData);
                        
                        // Save as JSON
                        ObjectMapper mapper = new ObjectMapper();
                        String jsonComment = mapper.writeValueAsString(commentData);
                        detail.setComment(jsonComment);
                        
                        logger.info("[DEBUG] Saved JSON comment for criteria {}: {}", criteriaId, jsonComment);
                        
                    } catch (Exception e) {
                        logger.error("[DEBUG] Failed to save sub-criteria scores as JSON: {}", e.getMessage(), e);
                    }
                }
            }
        }
        
        // Create history entry
        EvaluationHistory history = new EvaluationHistory(
            evaluation, "APPROVED", oldStatus.name(), newStatus.name(),
            level, approverId, approverName, comment);
        evaluation.addHistory(history);
        evaluationHistoryRepository.save(history);
        
        // Log before save
        logger.info("Before save: evaluation {} status = {}", evaluation.getId(), evaluation.getStatus());
        
        // Save evaluation with new status
        Evaluation updated = evaluationRepository.save(evaluation);
        logger.info("After save: evaluation {} status = {}", updated.getId(), updated.getStatus());
        
        // Flush to ensure changes are persisted before returning
        evaluationRepository.flush();
        logger.info("After flush: evaluation {} status = {}", updated.getId(), updated.getStatus());
        
        // Reload from database to ensure we have the latest status
        final Long evaluationIdForReload = updated.getId();
        updated = evaluationRepository.findByIdWithRelations(evaluationIdForReload)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", evaluationIdForReload));
        logger.info("After reload: evaluation {} status = {}", updated.getId(), updated.getStatus());
        
        // Log final status to verify it's correct
        logger.info("Evaluation {} status after approval: {} (expected: {})", 
            updated.getId(), updated.getStatus(), newStatus);
        
        // Verify status is actually CLASS_APPROVED in database
        if (newStatus == EvaluationStatus.CLASS_APPROVED && updated.getStatus() != EvaluationStatus.CLASS_APPROVED) {
            logger.error("CRITICAL: Evaluation {} status mismatch! Expected CLASS_APPROVED but got {}. Reloading...", 
                updated.getId(), updated.getStatus());
            // Force reload one more time with a fresh query
            final Long evaluationIdForSecondReload = updated.getId();
            updated = evaluationRepository.findByIdWithRelations(evaluationIdForSecondReload)
                    .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", evaluationIdForSecondReload));
            logger.info("After reload, evaluation {} status: {}", updated.getId(), updated.getStatus());
            
            // If still wrong, log error but continue
            if (updated.getStatus() != EvaluationStatus.CLASS_APPROVED) {
                logger.error("CRITICAL: Status still incorrect after reload! Evaluation {} has status {} instead of CLASS_APPROVED", 
                    updated.getId(), updated.getStatus());
            }
        }
        
        // Convert to DTO BEFORE sending notifications (to ensure transaction commits)
        EvaluationDTO result = EvaluationMapper.toDTO(updated);
        logger.info("Returning evaluation DTO with status: {} for evaluation {}", 
            result.getStatus(), result.getId());
        
        // Send notifications AFTER converting to DTO (separate try-catch to prevent rollback)
        // This ensures the transaction has committed before notifications
        if (notificationService != null && authServiceClient != null) {
            try {
                // Get student info
                StudentServiceClient.StudentResponse studentResponse = 
                    studentServiceClient.getStudentByCode(evaluation.getStudentCode());
                
                if (studentResponse != null && studentResponse.isSuccess() && studentResponse.getData() != null) {
                    StudentServiceClient.StudentDTO student = studentResponse.getData();
                    
                    // If not final approval, notify next level reviewers
                    if (newStatus == EvaluationStatus.CLASS_APPROVED) {
                        // Notify ADVISOR
                        notificationService.notifyEvaluationEscalated(
                            updated.getId(),
                            student.getFullName(),
                            student.getStudentCode(),
                            "ADVISOR"
                        );
                    } else if (newStatus == EvaluationStatus.ADVISOR_APPROVED) {
                        // Notify FACULTY
                        notificationService.notifyEvaluationEscalated(
                            updated.getId(),
                            student.getFullName(),
                            student.getStudentCode(),
                            "FACULTY"
                        );
                    } else if (newStatus == EvaluationStatus.FACULTY_APPROVED) {
                        // Final approval - notify student
                        ptit.drl.evaluation.client.AuthServiceClient.UserIdResponse userIdResponse = 
                            authServiceClient.getUserIdByStudentCode(evaluation.getStudentCode());
                        if (userIdResponse != null && userIdResponse.isSuccess() && userIdResponse.getData() != null) {
                            notificationService.createNotification(
                                userIdResponse.getData(),
                                "Đánh giá đã được duyệt",
                                String.format(
                                    "Đánh giá điểm rèn luyện của bạn (Học kỳ: %s) đã được duyệt hoàn tất. Điểm: %.1f",
                                    evaluation.getSemester(),
                                    evaluation.getTotalPoints() != null ? evaluation.getTotalPoints() : 0.0
                                ),
                                ptit.drl.evaluation.entity.Notification.NotificationType.EVALUATION_APPROVED,
                                "EVALUATION",
                                updated.getId()
                            );
                        }
                    }
                }
            } catch (Exception e) {
                // Failed to create approval notifications - log but don't fail
                logger.warn("Failed to create approval notifications for evaluation {}: {}", 
                    updated.getId(), e.getMessage(), e);
            }
        }
        
        return result;
    }
    
    /**
     * Reject evaluation
     * Note: rejectorId and rejectorName should come from auth-service
     */
    public EvaluationDTO rejectEvaluation(Long id, String reason, Long rejectorId, String rejectorName) {
        // Use optimized query with fetch join
        Evaluation evaluation = evaluationRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", id));
        
        // Check if can reject
        if (!evaluation.getStatus().canReject()) {
            throw new InvalidStateTransitionException(
                evaluation.getStatus().name(), "REJECT");
        }
        
        EvaluationStatus oldStatus = evaluation.getStatus();
        String level = oldStatus.getApprovalLevel();
        
        // Track which level rejected for smart resubmit
        evaluation.setLastRejectionLevel(level);
        evaluation.setStatus(EvaluationStatus.REJECTED);
        evaluation.setRejectionReason(reason);
        
        // Create history entry (use rejectorId and rejectorName instead of User entity)
        EvaluationHistory history = new EvaluationHistory(
            evaluation, "REJECTED", oldStatus.name(), "REJECTED",
            level, rejectorId, rejectorName, reason);
        evaluation.addHistory(history);
        evaluationHistoryRepository.save(history);
        
        Evaluation updated = evaluationRepository.save(evaluation);
        
        // Create notification for student when evaluation is rejected
        if (notificationService != null && authServiceClient != null) {
            try {
                ptit.drl.evaluation.client.AuthServiceClient.UserIdResponse response = 
                    authServiceClient.getUserIdByStudentCode(evaluation.getStudentCode());
                if (response != null && response.isSuccess() && response.getData() != null) {
                    Long userId = response.getData();
                    // Use notifyEvaluationReturned for better UX
                    String reviewerRole = level != null ? level : "Người duyệt";
                    notificationService.notifyEvaluationReturned(
                        evaluation.getId(),
                        userId,
                        reviewerRole,
                        reason
                    );
                }
            } catch (Exception e) {
                // Failed to create rejection notification - continue
            }
        }
        
        return EvaluationMapper.toDTO(updated);
    }
    
    /**
     * Re-submit evaluation after rejection
     */
    public EvaluationDTO resubmitEvaluation(Long id, ResubmitEvaluationRequest request) {
        // Use optimized query with fetch join
        Evaluation evaluation = evaluationRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", id));
        
        // Check if can resubmit
        if (!evaluation.getStatus().canResubmit()) {
            throw new InvalidStateTransitionException(
                evaluation.getStatus().name(), "RESUBMIT");
        }
        
        // Update details
        evaluation.getDetails().clear();
        double totalScore = 0.0;
        
        for (CreateEvaluationDetailRequest detailRequest : request.getDetails()) {
            Criteria criteria = criteriaRepository.findById(detailRequest.getCriteriaId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "Criteria", "id", detailRequest.getCriteriaId()));
            
            if (detailRequest.getScore() > criteria.getMaxPoints()) {
                throw new IllegalArgumentException(
                    String.format("Score %.2f exceeds max score %.2f",
                        detailRequest.getScore(), criteria.getMaxPoints()));
            }
            
            EvaluationDetail detail = EvaluationMapper.toDetailEntity(
                detailRequest, evaluation, criteria);
            evaluation.getDetails().add(detail);
            totalScore += detailRequest.getScore();
        }
        
        evaluation.setTotalPoints(totalScore);
        
        // Smart resubmit: Return to the level that rejected
        String lastRejectionLevel = evaluation.getLastRejectionLevel();
        EvaluationStatus newStatus;
        
        if ("CLASS".equals(lastRejectionLevel)) {
            // Rejected at Class level → Go back to Class
            newStatus = EvaluationStatus.SUBMITTED;
        } else if ("ADVISOR".equals(lastRejectionLevel)) {
            // Rejected at Advisor level → Skip Class, go to Advisor
            newStatus = EvaluationStatus.CLASS_APPROVED;
        } else if ("FACULTY".equals(lastRejectionLevel)) {
            // Rejected at Faculty level → Skip Class & Advisor, go to Faculty
            newStatus = EvaluationStatus.ADVISOR_APPROVED;
        } else {
            // Default: Go to Class level
            newStatus = EvaluationStatus.SUBMITTED;
        }
        
        evaluation.setStatus(newStatus);
        evaluation.setSubmittedAt(LocalDate.now());
        evaluation.incrementResubmissionCount();
        
        // Create history entry (no User entity)
        EvaluationHistory history = new EvaluationHistory(
            evaluation, "RESUBMITTED", "REJECTED", "SUBMITTED",
            null, null, null, "Re-submitted: " + request.getResponseToRejection());
        evaluation.addHistory(history);
        evaluationHistoryRepository.save(history);
        
        Evaluation updated = evaluationRepository.save(evaluation);
        return EvaluationMapper.toDTO(updated);
    }
    
    /**
     * Get pending evaluations for approval
     */
    @Transactional(readOnly = true)
    public Page<EvaluationDTO> getPendingEvaluations(String level, Pageable pageable) {
        List<EvaluationStatus> statuses = new ArrayList<>();
        
        if (level == null || level.equalsIgnoreCase("CLASS")) {
            statuses.add(EvaluationStatus.SUBMITTED);
        }
        if (level == null || level.equalsIgnoreCase("ADVISOR")) {
            statuses.add(EvaluationStatus.CLASS_APPROVED);
        }
        if (level == null || level.equalsIgnoreCase("FACULTY")) {
            statuses.add(EvaluationStatus.ADVISOR_APPROVED);
        }
        
        if (statuses.isEmpty()) {
            statuses = Arrays.asList(
                EvaluationStatus.SUBMITTED,
                EvaluationStatus.CLASS_APPROVED,
                EvaluationStatus.ADVISOR_APPROVED
            );
        }
        
        return evaluationRepository.findPendingEvaluations(statuses, pageable)
                .map(EvaluationMapper::toDTO);
    }
    
    /**
     * Delete evaluation (only if DRAFT status)
     * Also deletes associated files and history
     */
    @Transactional
    public void deleteEvaluation(Long id, String studentCode) {
        Evaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", id));
        
        // Check if user owns this evaluation
        if (!evaluation.getStudentCode().equals(studentCode)) {
            throw new IllegalArgumentException("You can only delete your own evaluations");
        }
        
        // Only allow deletion of DRAFT evaluations
        if (evaluation.getStatus() != EvaluationStatus.DRAFT) {
            throw new InvalidStateTransitionException(
                "Cannot delete evaluation with status " + evaluation.getStatus() + 
                ". Only DRAFT evaluations can be deleted.");
        }
        
        // Delete associated files (if file service is available)
        try {
            // Note: File deletion should be handled by file service
            // For now, we'll just delete the evaluation and let cascade handle details
        } catch (Exception e) {
            // Failed to delete files - continue
        }
        
        // Delete evaluation (cascade will handle details and history)
        evaluationRepository.delete(evaluation);
    }
}

