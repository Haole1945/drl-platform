package ptit.drl.evaluation.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Tracks approval from CLASS_MONITOR
 * CLASS_MONITOR must approve before evaluation moves to CLASS_APPROVED
 */
@Entity
@Table(name = "class_approvals", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"evaluation_id", "approver_id"}))
public class ClassApproval {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_id", nullable = false)
    private Evaluation evaluation;
    
    @Column(name = "approver_id", nullable = false)
    private Long approverId; // User ID from auth-service
    
    @Column(name = "approver_name", length = 100)
    private String approverName;
    
    @Column(name = "approver_role", nullable = false, length = 50)
    private String approverRole; // CLASS_MONITOR
    
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Constructors
    public ClassApproval() {}
    
    public ClassApproval(Evaluation evaluation, Long approverId, String approverName, String approverRole, String comment) {
        this.evaluation = evaluation;
        this.approverId = approverId;
        this.approverName = approverName;
        this.approverRole = approverRole;
        this.comment = comment;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Evaluation getEvaluation() {
        return evaluation;
    }
    
    public void setEvaluation(Evaluation evaluation) {
        this.evaluation = evaluation;
    }
    
    public Long getApproverId() {
        return approverId;
    }
    
    public void setApproverId(Long approverId) {
        this.approverId = approverId;
    }
    
    public String getApproverName() {
        return approverName;
    }
    
    public void setApproverName(String approverName) {
        this.approverName = approverName;
    }
    
    public String getApproverRole() {
        return approverRole;
    }
    
    public void setApproverRole(String approverRole) {
        this.approverRole = approverRole;
    }
    
    public String getComment() {
        return comment;
    }
    
    public void setComment(String comment) {
        this.comment = comment;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

