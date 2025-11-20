package ptit.drl.evaluation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * DTO for re-submitting evaluation after rejection
 */
public class ResubmitEvaluationRequest {
    
    @NotNull(message = "Updated details are required")
    @Size(min = 1, message = "At least one evaluation detail is required")
    @Valid
    private List<CreateEvaluationDetailRequest> details;
    
    @NotBlank(message = "Response to rejection is required")
    @Size(max = 2000, message = "Response must not exceed 2000 characters")
    private String responseToRejection;
    
    // Constructors
    public ResubmitEvaluationRequest() {}
    
    // Getters and Setters
    public List<CreateEvaluationDetailRequest> getDetails() {
        return details;
    }
    
    public void setDetails(List<CreateEvaluationDetailRequest> details) {
        this.details = details;
    }
    
    public String getResponseToRejection() {
        return responseToRejection;
    }
    
    public void setResponseToRejection(String responseToRejection) {
        this.responseToRejection = responseToRejection;
    }
}

