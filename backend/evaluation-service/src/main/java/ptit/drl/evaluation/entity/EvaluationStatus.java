package ptit.drl.evaluation.entity;

/**
 * Evaluation workflow status
 */
public enum EvaluationStatus {
    /**
     * Initial state - being edited by student
     */
    DRAFT,
    
    /**
     * Submitted and waiting for class advisor review
     */
    SUBMITTED,
    
    /**
     * Approved by class advisor
     */
    CLASS_APPROVED,
    
    /**
     * Approved by faculty
     */
    FACULTY_APPROVED,
    
    /**
     * Final approval by CTSV (complete)
     */
    CTSV_APPROVED,
    
    /**
     * Rejected at any level - can be re-submitted
     */
    REJECTED;
    
    /**
     * Check if evaluation can be edited
     */
    public boolean canEdit() {
        return this == DRAFT;
    }
    
    /**
     * Check if evaluation can be submitted
     */
    public boolean canSubmit() {
        return this == DRAFT;
    }
    
    /**
     * Check if evaluation can be approved
     */
    public boolean canApprove() {
        return this == SUBMITTED || 
               this == CLASS_APPROVED || 
               this == FACULTY_APPROVED;
    }
    
    /**
     * Check if evaluation can be rejected
     */
    public boolean canReject() {
        return this == SUBMITTED || 
               this == CLASS_APPROVED || 
               this == FACULTY_APPROVED;
    }
    
    /**
     * Check if evaluation can be re-submitted
     */
    public boolean canResubmit() {
        return this == REJECTED;
    }
    
    /**
     * Check if evaluation is in final state
     */
    public boolean isFinal() {
        return this == CTSV_APPROVED;
    }
    
    /**
     * Get next status after approval
     */
    public EvaluationStatus getNextApprovalStatus() {
        switch (this) {
            case SUBMITTED:
                return CLASS_APPROVED;
            case CLASS_APPROVED:
                return FACULTY_APPROVED;
            case FACULTY_APPROVED:
                return CTSV_APPROVED;
            default:
                throw new IllegalStateException("Cannot approve evaluation in " + this + " status");
        }
    }
    
    /**
     * Get approval level name
     */
    public String getApprovalLevel() {
        switch (this) {
            case SUBMITTED:
                return "CLASS";
            case CLASS_APPROVED:
                return "FACULTY";
            case FACULTY_APPROVED:
                return "CTSV";
            default:
                return "NONE";
        }
    }
}

