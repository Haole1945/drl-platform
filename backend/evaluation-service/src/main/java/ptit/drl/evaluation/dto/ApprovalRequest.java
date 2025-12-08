package ptit.drl.evaluation.dto;

import jakarta.validation.constraints.Size;
import java.util.Map;

/**
 * DTO for approval request
 */
public class ApprovalRequest {
    
    @Size(max = 1000, message = "Comment must not exceed 1000 characters")
    private String comment;
    
    /**
     * Map of criteriaId -> score (total score for the criterion)
     * For CLASS_MONITOR: scores will be saved to class_monitor_score
     * For ADVISOR: scores will be saved to advisor_score
     */
    private Map<Long, Double> scores;
    
    /**
     * Map of "criterionId_subCriteriaId" -> score (individual sub-criteria scores)
     * For CLASS_MONITOR: scores will be saved to evaluation_sub_criteria_scores.class_monitor_score
     * For ADVISOR: scores will be saved to evaluation_sub_criteria_scores.advisor_score
     */
    private Map<String, Double> subCriteriaScores;
    
    // Constructors
    public ApprovalRequest() {}
    
    public ApprovalRequest(String comment) {
        this.comment = comment;
    }
    
    // Getters and Setters
    public String getComment() {
        return comment;
    }
    
    public void setComment(String comment) {
        this.comment = comment;
    }
    
    public Map<Long, Double> getScores() {
        return scores;
    }
    
    public void setScores(Map<Long, Double> scores) {
        this.scores = scores;
    }
    
    public Map<String, Double> getSubCriteriaScores() {
        return subCriteriaScores;
    }
    
    public void setSubCriteriaScores(Map<String, Double> subCriteriaScores) {
        this.subCriteriaScores = subCriteriaScores;
    }
}

