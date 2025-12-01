package ptit.drl.evaluation.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Request DTO để gọi AI scoring
 * Chứa thông tin tiêu chí và danh sách file minh chứng
 */
public class AiScoringRequest {
    
    @NotNull(message = "Criteria ID is required")
    private Long criteriaId;
    
    private String subCriteriaId; // optional, e.g., "1.1", "1.2"
    
    @NotNull(message = "Evidence file IDs are required")
    private List<Long> evidenceFileIds;
    
    private Long evaluationId; // optional, for context
    
    // Constructors
    public AiScoringRequest() {}
    
    public AiScoringRequest(Long criteriaId, List<Long> evidenceFileIds) {
        this.criteriaId = criteriaId;
        this.evidenceFileIds = evidenceFileIds;
    }
    
    // Getters and Setters
    public Long getCriteriaId() {
        return criteriaId;
    }
    
    public void setCriteriaId(Long criteriaId) {
        this.criteriaId = criteriaId;
    }
    
    public String getSubCriteriaId() {
        return subCriteriaId;
    }
    
    public void setSubCriteriaId(String subCriteriaId) {
        this.subCriteriaId = subCriteriaId;
    }
    
    public List<Long> getEvidenceFileIds() {
        return evidenceFileIds;
    }
    
    public void setEvidenceFileIds(List<Long> evidenceFileIds) {
        this.evidenceFileIds = evidenceFileIds;
    }
    
    public Long getEvaluationId() {
        return evaluationId;
    }
    
    public void setEvaluationId(Long evaluationId) {
        this.evaluationId = evaluationId;
    }
}

