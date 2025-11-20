package ptit.drl.evaluation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * DTO for updating an evaluation (only in DRAFT status)
 */
public class UpdateEvaluationRequest {
    
    @Valid
    @Size(min = 1, message = "At least one evaluation detail is required")
    private List<CreateEvaluationDetailRequest> details;
    
    // Constructors
    public UpdateEvaluationRequest() {}
    
    // Getters and Setters
    public List<CreateEvaluationDetailRequest> getDetails() {
        return details;
    }
    
    public void setDetails(List<CreateEvaluationDetailRequest> details) {
        this.details = details;
    }
}

