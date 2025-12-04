package ptit.drl.evaluation.mapper;

import ptit.drl.evaluation.dto.*;
import ptit.drl.evaluation.entity.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for Evaluation entity and DTOs
 * Note: Student info (name, faculty, class) will be populated from student-service if needed
 */
public class EvaluationMapper {
    
    /**
     * Convert Evaluation entity to EvaluationDTO
     */
    public static EvaluationDTO toDTO(Evaluation evaluation) {
        if (evaluation == null) {
            return null;
        }
        
        EvaluationDTO dto = new EvaluationDTO();
        dto.setId(evaluation.getId());
        dto.setStudentCode(evaluation.getStudentCode()); // Direct from entity
        dto.setSemester(evaluation.getSemester());
        dto.setAcademicYear(evaluation.getAcademicYear());
        dto.setStatus(evaluation.getStatus() != null ? evaluation.getStatus().name() : null);
        dto.setTotalScore(evaluation.getTotalPoints());
        dto.setRejectionReason(evaluation.getRejectionReason());
        dto.setLastRejectionLevel(evaluation.getLastRejectionLevel());
        dto.setResubmissionCount(evaluation.getResubmissionCount());
        dto.setSubmittedAt(evaluation.getSubmittedAt());
        dto.setApprovedAt(evaluation.getApprovedAt());
        dto.setCreatedAt(evaluation.getCreatedAt());
        dto.setUpdatedAt(evaluation.getUpdatedAt());
        dto.setCreatedBy(evaluation.getCreatedBy());
        // createdByName will be populated from auth-service if needed
        // isCreatedByAdmin will be determined based on createdBy (if not null, likely admin)
        dto.setIsCreatedByAdmin(evaluation.getCreatedBy() != null);
        
        // Student info (name, faculty, class) will be populated from student-service if needed
        // For now, leave them null or empty
        
        // Map rubric info
        if (evaluation.getRubric() != null) {
            Rubric rubric = evaluation.getRubric();
            dto.setRubricId(rubric.getId());
            dto.setRubricName(rubric.getName());
            dto.setMaxScore(rubric.getMaxPoints());
        }
        
        // Map details (handle lazy loading)
        try {
            if (evaluation.getDetails() != null && !evaluation.getDetails().isEmpty()) {
                List<EvaluationDetailDTO> detailDTOs = evaluation.getDetails().stream()
                        .map(EvaluationMapper::toDetailDTO)
                        .collect(Collectors.toList());
                dto.setDetails(detailDTOs);
            } else {
                dto.setDetails(new ArrayList<>());
            }
        } catch (Exception e) {
            dto.setDetails(new ArrayList<>());
        }
        
        // Map history (handle lazy loading)
        try {
            if (evaluation.getHistory() != null && !evaluation.getHistory().isEmpty()) {
                List<EvaluationHistoryDTO> historyDTOs = evaluation.getHistory().stream()
                        .map(EvaluationMapper::toHistoryDTO)
                        .collect(Collectors.toList());
                dto.setApprovalHistory(historyDTOs);
            } else {
                dto.setApprovalHistory(new ArrayList<>());
            }
        } catch (Exception e) {
            dto.setApprovalHistory(new ArrayList<>());
        }
        
        return dto;
    }
    
    /**
     * Convert EvaluationDetail to EvaluationDetailDTO
     */
    public static EvaluationDetailDTO toDetailDTO(EvaluationDetail detail) {
        if (detail == null) {
            return null;
        }
        
        EvaluationDetailDTO dto = new EvaluationDetailDTO();
        dto.setScore(detail.getScore());
        // Map comment to both evidence and note (for backward compatibility)
        String comment = detail.getComment();
        
        // Remove "Evidence: " prefix if present when returning to frontend
        // Frontend expects format without prefix
        String evidenceForResponse = comment;
        if (evidenceForResponse != null && evidenceForResponse.startsWith("Evidence: ")) {
            evidenceForResponse = evidenceForResponse.substring("Evidence: ".length());
        }
        
        dto.setEvidence(evidenceForResponse);
        dto.setNote(comment); // Keep note as original comment
        
        // Handle criteria (may be lazy loaded)
        try {
            if (detail.getCriteria() != null) {
                Criteria criteria = detail.getCriteria();
                dto.setCriteriaId(criteria.getId());
                dto.setCriteriaName(criteria.getName());
                dto.setCriteriaDescription(criteria.getDescription());
                dto.setMaxScore(criteria.getMaxPoints());
            } else {
                // Use criteriaId from detail if criteria is not loaded
                dto.setCriteriaId(detail.getCriteriaId());
            }
        } catch (Exception e) {
            // Fallback to criteriaId from detail
            dto.setCriteriaId(detail.getCriteriaId());
        }
        
        return dto;
    }
    
    /**
     * Convert EvaluationHistory to EvaluationHistoryDTO
     */
    public static EvaluationHistoryDTO toHistoryDTO(EvaluationHistory history) {
        if (history == null) {
            return null;
        }
        
        return new EvaluationHistoryDTO(
            history.getAction(),
            history.getLevel(),
            history.getActorName(),
            history.getComment(),
            history.getCreatedAt()
        );
    }
    
    /**
     * Convert CreateEvaluationRequest to Evaluation entity
     * Note: studentCode is used directly, no Student entity needed
     */
    public static Evaluation toEntity(CreateEvaluationRequest request, Rubric rubric) {
        if (request == null) {
            return null;
        }
        
        Evaluation evaluation = new Evaluation();
        evaluation.setStudentCode(request.getStudentCode()); // Direct assignment
        evaluation.setRubric(rubric);
        evaluation.setSemester(request.getSemester());
        evaluation.setAcademicYear(request.getAcademicYear());
        evaluation.setStatus(EvaluationStatus.DRAFT);
        evaluation.setResubmissionCount(0);
        
        return evaluation;
    }
    
    /**
     * Create EvaluationDetail from request
     */
    public static EvaluationDetail toDetailEntity(CreateEvaluationDetailRequest request,
                                                  Evaluation evaluation,
                                                  Criteria criteria) {
        if (request == null) {
            return null;
        }
        
        EvaluationDetail detail = new EvaluationDetail();
        
        // Set composite key IDs (required for @IdClass)
        if (evaluation != null && evaluation.getId() != null) {
            detail.setEvaluationId(evaluation.getId());
        }
        if (criteria != null && criteria.getId() != null) {
            detail.setCriteriaId(criteria.getId());
        }
        
        // Set relationships (for lazy loading)
        detail.setEvaluation(evaluation);
        detail.setCriteria(criteria);
        
        detail.setScore(request.getScore());
        
        // Store evidence directly - use exactly what frontend sends
        // Frontend sends: "SCORES:1.1=3,1.2=10|EVIDENCE:1.1. Name: /files/..."
        String evidence = request.getEvidence();
        String comment = "";
        
        // Use evidence directly if provided (frontend already formats it correctly)
        // Remove "Evidence: " prefix if present (from old data or legacy format)
        if (evidence != null && !evidence.isEmpty()) {
            // Remove prefix if present (case-insensitive check)
            String trimmed = evidence.trim();
            if (trimmed.startsWith("Evidence: ")) {
                trimmed = trimmed.substring("Evidence: ".length());
            } else if (trimmed.startsWith("evidence: ")) {
                trimmed = trimmed.substring("evidence: ".length());
            }
            comment = trimmed;
        }
        
        // Add note if provided
        if (request.getNote() != null && !request.getNote().isEmpty()) {
            if (!comment.isEmpty()) comment += " | ";
            comment += "Note: " + request.getNote();
        }
        
        // Set comment (which contains the evidence) - NO PREFIX ADDED
        detail.setComment(comment.isEmpty() ? null : comment);
        
        return detail;
    }
}

