package ptit.drl.evaluation.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Appeal entity - Student appeals for evaluation score review
 */
@Entity
@Table(name = "appeals", indexes = {
    @Index(name = "idx_appeals_evaluation", columnList = "evaluation_id"),
    @Index(name = "idx_appeals_student", columnList = "student_code"),
    @Index(name = "idx_appeals_status", columnList = "status")
})
public class Appeal {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_id", nullable = false)
    private Evaluation evaluation;
    
    @Column(name = "student_code", nullable = false, length = 20)
    private String studentCode;
    
    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AppealStatus status = AppealStatus.PENDING;
    
    @Column(name = "reviewer_id")
    private Long reviewerId;
    
    @Column(name = "reviewer_comment", columnDefinition = "TEXT")
    private String reviewerComment;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
    
    // Constructors
    public Appeal() {
        this.createdAt = LocalDateTime.now();
    }
    
    public Appeal(Evaluation evaluation, String studentCode, String reason) {
        this.evaluation = evaluation;
        this.studentCode = studentCode;
        this.reason = reason;
        this.createdAt = LocalDateTime.now();
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
    
    public String getStudentCode() {
        return studentCode;
    }
    
    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
    
    public AppealStatus getStatus() {
        return status;
    }
    
    public void setStatus(AppealStatus status) {
        this.status = status;
    }
    
    public Long getReviewerId() {
        return reviewerId;
    }
    
    public void setReviewerId(Long reviewerId) {
        this.reviewerId = reviewerId;
    }
    
    public String getReviewerComment() {
        return reviewerComment;
    }
    
    public void setReviewerComment(String reviewerComment) {
        this.reviewerComment = reviewerComment;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }
    
    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
}
