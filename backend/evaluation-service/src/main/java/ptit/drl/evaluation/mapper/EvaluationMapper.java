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
        dto.setScore(detail.getScore()); // Điểm tự chấm
        dto.setClassMonitorScore(detail.getClassMonitorScore()); // Điểm lớp trưởng
        dto.setAdvisorScore(detail.getAdvisorScore()); // Điểm cố vấn
        // Map comment to both evidence and note (for backward compatibility)
        String comment = detail.getComment();
        
        // Check if comment is JSON (contains scores)
        String evidenceForResponse = null;
        if (comment != null && comment.trim().startsWith("{")) {
            // It's JSON, try to extract evidence field and reconstruct SCORES format
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.Map<String, Object> commentData = mapper.readValue(comment, java.util.Map.class);
                
                // Extract evidence string
                String evidenceString = commentData.containsKey("evidence") ? (String) commentData.get("evidence") : "";
                
                // Extract self sub-criteria scores and reconstruct SCORES format
                if (commentData.containsKey("scores")) {
                    java.util.Map<String, Object> scoresData = (java.util.Map<String, Object>) commentData.get("scores");
                    if (scoresData.containsKey("selfSubCriteria")) {
                        java.util.Map<String, Object> selfScores = (java.util.Map<String, Object>) scoresData.get("selfSubCriteria");
                        if (!selfScores.isEmpty()) {
                            // Reconstruct SCORES:1.1=3,1.2=10 format
                            StringBuilder scoresBuilder = new StringBuilder("SCORES:");
                            boolean first = true;
                            for (java.util.Map.Entry<String, Object> entry : selfScores.entrySet()) {
                                if (!first) scoresBuilder.append(",");
                                scoresBuilder.append(entry.getKey()).append("=").append(entry.getValue());
                                first = false;
                            }
                            evidenceForResponse = scoresBuilder.toString() + "|EVIDENCE:" + evidenceString;
                            System.out.println("[MAPPER-DEBUG] Reconstructed evidence for criteria " + detail.getCriteriaId() + ": " + evidenceForResponse);
                        } else {
                            evidenceForResponse = evidenceString;
                        }
                    } else {
                        evidenceForResponse = evidenceString;
                    }
                } else {
                    evidenceForResponse = evidenceString;
                }
            } catch (Exception e) {
                // Failed to parse JSON, treat as evidence string
                System.out.println("[MAPPER-DEBUG] Failed to parse JSON comment: " + e.getMessage());
                evidenceForResponse = comment;
            }
        } else {
            // Not JSON, treat as evidence string
            // Remove "Evidence: " prefix if present
            evidenceForResponse = comment;
            if (evidenceForResponse != null && evidenceForResponse.startsWith("Evidence: ")) {
                evidenceForResponse = evidenceForResponse.substring("Evidence: ".length());
            }
        }
        
        System.out.println("[MAPPER-DEBUG] Final evidence for criteria " + detail.getCriteriaId() + ": " + evidenceForResponse);
        dto.setEvidence(evidenceForResponse);
        dto.setNote(comment); // Keep note as original comment (JSON or evidence string)
        
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
        
        // Parse evidence to extract sub-criteria scores and store as JSON
        String evidence = request.getEvidence();
        String comment = "";
        
        // Check if evidence contains SCORES format: "SCORES:1.1=3,1.2=10|EVIDENCE:..."
        if (evidence != null && evidence.contains("SCORES:")) {
            try {
                // Parse SCORES section
                String[] parts = evidence.split("\\|EVIDENCE:");
                String scoresSection = parts[0].replace("SCORES:", "");
                String evidenceSection = parts.length > 1 ? parts[1] : "";
                
                // Parse individual scores: "1.1=3,1.2=10"
                java.util.Map<String, Double> selfSubCriteria = new java.util.HashMap<>();
                if (!scoresSection.isEmpty()) {
                    String[] scorePairs = scoresSection.split(",");
                    for (String pair : scorePairs) {
                        String[] keyValue = pair.split("=");
                        if (keyValue.length == 2) {
                            try {
                                selfSubCriteria.put(keyValue[0].trim(), Double.parseDouble(keyValue[1].trim()));
                            } catch (NumberFormatException e) {
                                // Skip invalid score
                            }
                        }
                    }
                }
                
                // Create JSON structure
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.Map<String, Object> commentData = new java.util.HashMap<>();
                java.util.Map<String, Object> scores = new java.util.HashMap<>();
                scores.put("selfSubCriteria", selfSubCriteria);
                commentData.put("scores", scores);
                commentData.put("evidence", evidenceSection);
                
                comment = mapper.writeValueAsString(commentData);
            } catch (Exception e) {
                // If parsing fails, store as-is
                comment = evidence;
            }
        } else if (evidence != null && !evidence.isEmpty()) {
            // No SCORES format, store as-is
            comment = evidence;
        }
        
        // Add note if provided
        if (request.getNote() != null && !request.getNote().isEmpty()) {
            if (!comment.isEmpty() && !comment.startsWith("{")) {
                comment += " | Note: " + request.getNote();
            }
            // If comment is JSON, note is ignored (scores take precedence)
        }
        
        // Set comment (which contains the evidence and scores in JSON format)
        detail.setComment(comment.isEmpty() ? null : comment);
        
        return detail;
    }
}

