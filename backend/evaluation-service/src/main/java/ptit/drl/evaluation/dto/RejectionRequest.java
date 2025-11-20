package ptit.drl.evaluation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for rejection request
 */
public class RejectionRequest {
    
    @NotBlank(message = "Rejection reason is required")
    @Size(max = 2000, message = "Reason must not exceed 2000 characters")
    private String reason;
    
    // Constructors
    public RejectionRequest() {}
    
    public RejectionRequest(String reason) {
        this.reason = reason;
    }
    
    // Getters and Setters
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
}

