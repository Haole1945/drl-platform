package ptit.drl.evaluation.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * EvaluationDetail entity - uses composite key (evaluation_id, criteria_id)
 * One evaluation can only score each criteria once
 */
@Entity
@Table(name = "evaluation_details")
@IdClass(EvaluationDetailId.class)
public class EvaluationDetail {
    
    @Id
    @Column(name = "evaluation_id", nullable = false)
    private Long evaluationId;
    
    @Id
    @Column(name = "criteria_id", nullable = false)
    private Long criteriaId;
    
    @Column(name = "score", nullable = false)
    private Double score; // Điểm chấm cho tiêu chí này
    
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment; // Nhận xét của người chấm
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_id", insertable = false, updatable = false)
    private Evaluation evaluation;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criteria_id", insertable = false, updatable = false)
    private Criteria criteria;
    
    // Constructors
    public EvaluationDetail() {}
    
    public EvaluationDetail(Long evaluationId, Long criteriaId, Double score) {
        this.evaluationId = evaluationId;
        this.criteriaId = criteriaId;
        this.score = score;
    }
    
    // Getters and Setters
    public Long getEvaluationId() {
        return evaluationId;
    }
    
    public void setEvaluationId(Long evaluationId) {
        this.evaluationId = evaluationId;
    }
    
    public Long getCriteriaId() {
        return criteriaId;
    }
    
    public void setCriteriaId(Long criteriaId) {
        this.criteriaId = criteriaId;
    }
    
    public Double getScore() {
        return score;
    }
    
    public void setScore(Double score) {
        this.score = score;
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
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public Evaluation getEvaluation() {
        return evaluation;
    }
    
    public void setEvaluation(Evaluation evaluation) {
        this.evaluation = evaluation;
    }
    
    public Criteria getCriteria() {
        return criteria;
    }
    
    public void setCriteria(Criteria criteria) {
        this.criteria = criteria;
    }
}

