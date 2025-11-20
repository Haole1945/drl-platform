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
import ptit.drl.evaluation.exception.DuplicateResourceException;
import ptit.drl.evaluation.exception.InvalidStateTransitionException;
import ptit.drl.evaluation.exception.ResourceNotFoundException;
import ptit.drl.evaluation.mapper.EvaluationMapper;
import ptit.drl.evaluation.repository.*;
import ptit.drl.evaluation.client.StudentServiceClient;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for Evaluation workflow operations
 * Uses Feign Client to communicate with student-service for student validation
 */
@Service
@Transactional
public class EvaluationService {
    
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
    
    /**
     * Create new evaluation (DRAFT status)
     * Validates student exists via student-service
     */
    public EvaluationDTO createEvaluation(CreateEvaluationRequest request) {
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
    public EvaluationDTO updateEvaluation(Long id, UpdateEvaluationRequest request) {
        // Use optimized query with fetch join
        Evaluation evaluation = evaluationRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", id));
        
        // Check if can edit
        if (!evaluation.getStatus().canEdit()) {
            throw new InvalidStateTransitionException(
                evaluation.getStatus().name(), "UPDATE");
        }
        
        // Clear existing details
        evaluation.getDetails().clear();
        
        // Add new details
        double totalScore = 0.0;
        for (CreateEvaluationDetailRequest detailRequest : request.getDetails()) {
            Criteria criteria = criteriaRepository.findById(detailRequest.getCriteriaId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "Criteria", "id", detailRequest.getCriteriaId()));
            
            // Validate score
            if (detailRequest.getScore() > criteria.getMaxPoints()) {
                throw new IllegalArgumentException(
                    String.format("Score %.2f exceeds max score %.2f for criteria %s",
                        detailRequest.getScore(), criteria.getMaxPoints(), criteria.getName()));
            }
            
            EvaluationDetail detail = EvaluationMapper.toDetailEntity(
                detailRequest, evaluation, criteria);
            evaluation.getDetails().add(detail);
            totalScore += detailRequest.getScore();
        }
        
        evaluation.setTotalPoints(totalScore);
        
        Evaluation updated = evaluationRepository.save(evaluation);
        return EvaluationMapper.toDTO(updated);
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
        return EvaluationMapper.toDTO(updated);
    }
    
    /**
     * Approve evaluation (move to next approval level)
     * Note: approverId and approverName should come from auth-service
     */
    public EvaluationDTO approveEvaluation(Long id, String comment, Long approverId, String approverName) {
        // Use optimized query with fetch join
        Evaluation evaluation = evaluationRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "id", id));
        
        // Check if can approve
        if (!evaluation.getStatus().canApprove()) {
            throw new InvalidStateTransitionException(
                evaluation.getStatus().name(), "APPROVE");
        }
        
        // Get next status
        EvaluationStatus oldStatus = evaluation.getStatus();
        EvaluationStatus newStatus = oldStatus.getNextApprovalStatus();
        String level = oldStatus.getApprovalLevel();
        
        evaluation.setStatus(newStatus);
        
        // If final approval, set approved date
        if (newStatus == EvaluationStatus.CTSV_APPROVED) {
            evaluation.setApprovedAt(LocalDate.now());
        }
        
        // Create history entry (use approverId and approverName instead of User entity)
        EvaluationHistory history = new EvaluationHistory(
            evaluation, "APPROVED", oldStatus.name(), newStatus.name(),
            level, approverId, approverName, comment);
        evaluation.addHistory(history);
        evaluationHistoryRepository.save(history);
        
        Evaluation updated = evaluationRepository.save(evaluation);
        return EvaluationMapper.toDTO(updated);
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
        
        evaluation.setStatus(EvaluationStatus.REJECTED);
        evaluation.setRejectionReason(reason);
        
        // Create history entry (use rejectorId and rejectorName instead of User entity)
        EvaluationHistory history = new EvaluationHistory(
            evaluation, "REJECTED", oldStatus.name(), "REJECTED",
            level, rejectorId, rejectorName, reason);
        evaluation.addHistory(history);
        evaluationHistoryRepository.save(history);
        
        Evaluation updated = evaluationRepository.save(evaluation);
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
        evaluation.setStatus(EvaluationStatus.SUBMITTED);
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
        if (level == null || level.equalsIgnoreCase("FACULTY")) {
            statuses.add(EvaluationStatus.CLASS_APPROVED);
        }
        if (level == null || level.equalsIgnoreCase("CTSV")) {
            statuses.add(EvaluationStatus.FACULTY_APPROVED);
        }
        
        if (statuses.isEmpty()) {
            statuses = Arrays.asList(
                EvaluationStatus.SUBMITTED,
                EvaluationStatus.CLASS_APPROVED,
                EvaluationStatus.FACULTY_APPROVED
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
            // Log but don't fail if file deletion fails
            System.err.println("Warning: Failed to delete files for evaluation " + id + ": " + e.getMessage());
        }
        
        // Delete evaluation (cascade will handle details and history)
        evaluationRepository.delete(evaluation);
    }
}

