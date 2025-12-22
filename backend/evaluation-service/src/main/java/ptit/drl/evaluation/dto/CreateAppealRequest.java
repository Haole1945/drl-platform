package ptit.drl.evaluation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for creating an appeal
 */
public class CreateAppealRequest {
    
    @NotNull(message = "Evaluation ID is required")
    private Long evaluationId;
    
    @NotBlank(message = "Reason is required")
    private String reason;
    
    // Constructors
    public CreateAppealRequest() {}
    
    public CreateAppealRequest(Long evaluationId, String reason) {
        this.evaluationId = evaluationId;
        this.reason = reason;
    }
    
    // Getters and Setters
    public Long getEvaluationId() {
        return evaluationId;
    }
    
    public void setEvaluationId(Long evaluationId) {
        this.evaluationId = evaluationId;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
}
