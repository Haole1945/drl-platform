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
     * Submitted and waiting for CLASS_MONITOR to approve
     */
    SUBMITTED,
    
    /**
     * Approved by CLASS_MONITOR
     * Waiting for ADVISOR to approve
     */
    CLASS_APPROVED,
    
    /**
     * Approved by ADVISOR (Cố vấn học tập)
     * Waiting for FACULTY_INSTRUCTOR to approve
     */
    ADVISOR_APPROVED,
    
    /**
     * Approved by FACULTY_INSTRUCTOR (final approval - complete)
     */
    FACULTY_APPROVED,
    
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
               this == ADVISOR_APPROVED;
    }
    
    /**
     * Check if evaluation can be rejected
     */
    public boolean canReject() {
        return this == SUBMITTED || 
               this == CLASS_APPROVED ||
               this == ADVISOR_APPROVED;
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
        return this == FACULTY_APPROVED;
    }
    
    /**
     * Get next status after approval
     */
    public EvaluationStatus getNextApprovalStatus() {
        switch (this) {
            case SUBMITTED:
                return CLASS_APPROVED;
            case CLASS_APPROVED:
                return ADVISOR_APPROVED;
            case ADVISOR_APPROVED:
                return FACULTY_APPROVED;
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
                return "ADVISOR";
            case ADVISOR_APPROVED:
                return "FACULTY";
            default:
                return "NONE";
        }
    }
}

