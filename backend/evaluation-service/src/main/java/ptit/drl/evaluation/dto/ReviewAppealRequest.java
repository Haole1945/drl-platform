package ptit.drl.evaluation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import ptit.drl.evaluation.entity.AppealStatus;

/**
 * Request DTO for reviewing an appeal
 */
public class ReviewAppealRequest {
    
    @NotNull(message = "Decision is required")
    private AppealStatus decision; // APPROVED or REJECTED
    
    @NotBlank(message = "Comment is required")
    private String comment;
    
    // Constructors
    public ReviewAppealRequest() {}
    
    public ReviewAppealRequest(AppealStatus decision, String comment) {
        this.decision = decision;
        this.comment = comment;
    }
    
    // Getters and Setters
    public AppealStatus getDecision() {
        return decision;
    }
    
    public void setDecision(AppealStatus decision) {
        this.decision = decision;
    }
    
    public String getComment() {
        return comment;
    }
    
    public void setComment(String comment) {
        this.comment = comment;
    }
}
