package ptit.drl.evaluation.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptit.drl.evaluation.dto.AppealDTO;
import ptit.drl.evaluation.dto.CreateAppealRequest;
import ptit.drl.evaluation.dto.ReviewAppealRequest;
import ptit.drl.evaluation.entity.Appeal;
import ptit.drl.evaluation.entity.AppealStatus;
import ptit.drl.evaluation.entity.Evaluation;
import ptit.drl.evaluation.entity.EvaluationStatus;
import ptit.drl.evaluation.exception.InvalidStateTransitionException;
import ptit.drl.evaluation.exception.ResourceNotFoundException;
import ptit.drl.evaluation.mapper.AppealMapper;
import ptit.drl.evaluation.repository.AppealRepository;
import ptit.drl.evaluation.repository.EvaluationRepository;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Service for Appeal operations
 */
@Service
@Transactional
public class AppealService {
    
    @Autowired
    private AppealRepository appealRepository;
    
    @Autowired
    private EvaluationRepository evaluationRepository;
    
    @Autowired(required = false)
    private NotificationService notificationService;
    
    /**
     * Create new appeal
     */
    public AppealDTO createAppeal(CreateAppealRequest request, String studentCode) {
        // Validate evaluation exists
        Evaluation evaluation = evaluationRepository.findById(request.getEvaluationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Evaluation", "id", request.getEvaluationId()));
        
        // Check if evaluation belongs to student
        if (!evaluation.getStudentCode().equals(studentCode)) {
            throw new InvalidStateTransitionException(
                "You can only appeal your own evaluations");
        }
        
        // Check if evaluation is FACULTY_APPROVED
        if (evaluation.getStatus() != EvaluationStatus.FACULTY_APPROVED) {
            throw new InvalidStateTransitionException(
                "You can only appeal evaluations that have been fully approved (FACULTY_APPROVED)");
        }
        
        // Create appeal
        Appeal appeal = new Appeal(evaluation, studentCode, request.getReason());
        Appeal saved = appealRepository.save(appeal);
        
        // Send notification to reviewers (Admin and Faculty)
        if (notificationService != null) {
            try {
                notificationService.notifyAppealCreated(saved.getId(), studentCode, evaluation.getSemester());
            } catch (Exception e) {
                // Log but don't fail
                System.err.println("Failed to send appeal notification: " + e.getMessage());
            }
        }
        
        return AppealMapper.toDTO(saved);
    }
    
    /**
     * Get appeal by ID
     */
    @Transactional(readOnly = true)
    public AppealDTO getAppealById(Long id, String userCode, Set<String> roles) {
        Appeal appeal = appealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal", "id", id));
        
        // Check authorization
        boolean isStudent = appeal.getStudentCode().equals(userCode);
        boolean isReviewer = roles.contains("ADMIN") || roles.contains("FACULTY_INSTRUCTOR");
        
        if (!isStudent && !isReviewer) {
            throw new InvalidStateTransitionException(
                "You don't have permission to view this appeal");
        }
        
        return AppealMapper.toDTO(appeal);
    }
    
    /**
     * Get student's appeals
     */
    @Transactional(readOnly = true)
    public Page<AppealDTO> getStudentAppeals(String studentCode, Pageable pageable) {
        Page<Appeal> appeals = appealRepository.findByStudentCodeOrderByCreatedAtDesc(
            studentCode, pageable);
        return appeals.map(AppealMapper::toDTO);
    }
    
    /**
     * Get pending appeals for reviewers
     */
    @Transactional(readOnly = true)
    public Page<AppealDTO> getPendingAppeals(Pageable pageable) {
        Page<Appeal> appeals = appealRepository.findByStatusOrderByCreatedAtDesc(
            AppealStatus.PENDING, pageable);
        return appeals.map(AppealMapper::toDTO);
    }
    
    /**
     * Review appeal (approve or reject)
     */
    public AppealDTO reviewAppeal(Long id, ReviewAppealRequest request, 
                                  Long reviewerId, Set<String> roles) {
        // Check authorization
        boolean canReview = roles.contains("ADMIN") || roles.contains("FACULTY_INSTRUCTOR");
        if (!canReview) {
            throw new InvalidStateTransitionException(
                "Only Admin and Faculty can review appeals");
        }
        
        // Get appeal
        Appeal appeal = appealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal", "id", id));
        
        // Check if already reviewed
        if (appeal.getStatus() != AppealStatus.PENDING) {
            throw new InvalidStateTransitionException(
                "This appeal has already been reviewed");
        }
        
        // Validate decision
        if (request.getDecision() != AppealStatus.APPROVED && 
            request.getDecision() != AppealStatus.REJECTED) {
            throw new IllegalArgumentException(
                "Decision must be APPROVED or REJECTED");
        }
        
        // Update appeal
        appeal.setStatus(request.getDecision());
        appeal.setReviewerId(reviewerId);
        appeal.setReviewerComment(request.getComment());
        appeal.setReviewedAt(LocalDateTime.now());
        
        Appeal saved = appealRepository.save(appeal);
        
        // Send notification to student
        if (notificationService != null) {
            try {
                notificationService.notifyAppealReviewed(
                    saved.getId(), 
                    saved.getStudentCode(), 
                    request.getDecision() == AppealStatus.APPROVED
                );
            } catch (Exception e) {
                // Log but don't fail
                System.err.println("Failed to send appeal review notification: " + e.getMessage());
            }
        }
        
        return AppealMapper.toDTO(saved);
    }
    
    /**
     * Check if student can appeal for evaluation
     */
    @Transactional(readOnly = true)
    public boolean canAppeal(Long evaluationId, String studentCode) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Evaluation", "id", evaluationId));
        
        // Check if evaluation belongs to student
        if (!evaluation.getStudentCode().equals(studentCode)) {
            return false;
        }
        
        // Check if evaluation is FACULTY_APPROVED
        return evaluation.getStatus() == EvaluationStatus.FACULTY_APPROVED;
    }
    
    /**
     * Get appeal count for student
     */
    @Transactional(readOnly = true)
    public long getAppealCount(String studentCode) {
        return appealRepository.countByStudentCode(studentCode);
    }
    
    /**
     * Get pending appeal count
     */
    @Transactional(readOnly = true)
    public long getPendingAppealCount() {
        return appealRepository.countByStatus(AppealStatus.PENDING);
    }
}
