package ptit.drl.evaluation.dto;

import jakarta.validation.constraints.*;

/**
 * DTO for creating evaluation detail (criteria score)
 */
public class CreateEvaluationDetailRequest {
    
    @NotNull(message = "Criteria ID is required")
    private Long criteriaId;
    
    // Score can be null for draft mode, but must be provided for non-draft
    @PositiveOrZero(message = "Score must be positive or zero")
    private Double score;
    
    @Size(max = 1000, message = "Evidence must not exceed 1000 characters")
    private String evidence;
    
    @Size(max = 500, message = "Note must not exceed 500 characters")
    private String note;
    
    // Constructors
    public CreateEvaluationDetailRequest() {}
    
    public CreateEvaluationDetailRequest(Long criteriaId, Double score, 
                                        String evidence, String note) {
        this.criteriaId = criteriaId;
        this.score = score;
        this.evidence = evidence;
        this.note = note;
    }
    
    // Getters and Setters
    public Long getCriteriaId() {
        return criteriaId;
    }
    
    public void setCriteriaId(Long criteriaId) {
        this.criteriaId = criteriaId;
    }
    
    public Double getScore() {
        return score;
    }
    
    public void setScore(Double score) {
        this.score = score;
    }
    
    public String getEvidence() {
        return evidence;
    }
    
    public void setEvidence(String evidence) {
        this.evidence = evidence;
    }
    
    public String getNote() {
        return note;
    }
    
    public void setNote(String note) {
        this.note = note;
    }
}

