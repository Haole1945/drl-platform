package ptit.drl.evaluation.dto;

import jakarta.validation.constraints.Size;

/**
 * DTO for approval request
 */
public class ApprovalRequest {
    
    @Size(max = 1000, message = "Comment must not exceed 1000 characters")
    private String comment;
    
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
}

