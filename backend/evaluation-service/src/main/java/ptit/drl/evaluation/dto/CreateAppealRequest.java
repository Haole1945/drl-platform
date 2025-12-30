package ptit.drl.evaluation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Request DTO for creating an appeal
 */
public class CreateAppealRequest {
    
    @NotNull(message = "Evaluation ID is required")
    private Long evaluationId;
    
    @NotBlank(message = "Appeal reason is required")
    private String appealReason;
    
    private List<Long> criteriaIds;
    
    private List<Long> fileIds;
    
    // Constructors
    public CreateAppealRequest() {}
    
    public CreateAppealRequest(Long evaluationId, String appealReason) {
        this.evaluationId = evaluationId;
        this.appealReason = appealReason;
    }
    
    // Getters and Setters
    public Long getEvaluationId() {
        return evaluationId;
    }
    
    public void setEvaluationId(Long evaluationId) {
        this.evaluationId = evaluationId;
    }
    
    public String getAppealReason() {
        return appealReason;
    }
    
    public void setAppealReason(String appealReason) {
        this.appealReason = appealReason;
    }
    
    public List<Long> getCriteriaIds() {
        return criteriaIds;
    }
    
    public void setCriteriaIds(List<Long> criteriaIds) {
        this.criteriaIds = criteriaIds;
    }
    
    public List<Long> getFileIds() {
        return fileIds;
    }
    
    public void setFileIds(List<Long> fileIds) {
        this.fileIds = fileIds;
    }
}
