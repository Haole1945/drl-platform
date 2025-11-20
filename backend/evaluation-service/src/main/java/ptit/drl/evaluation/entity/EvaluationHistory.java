package ptit.drl.evaluation.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Tracks approval/rejection history for evaluations
 * Note: actorId is stored as Long (no FK to User entity)
 * This allows evaluation-service to be independent from auth-service
 */
@Entity
@Table(name = "evaluation_history")
public class EvaluationHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_id", nullable = false)
    private Evaluation evaluation;
    
    @Column(name = "action", nullable = false, length = 20)
    private String action; // SUBMITTED, APPROVED, REJECTED, RESUBMITTED
    
    @Column(name = "from_status", length = 30)
    private String fromStatus;
    
    @Column(name = "to_status", nullable = false, length = 30)
    private String toStatus;
    
    @Column(name = "level", length = 20)
    private String level; // CLASS, FACULTY, CTSV
    
    @Column(name = "actor_id")
    private Long actorId; // Reference to user in auth-service (no FK)
    
    @Column(name = "actor_name", length = 100)
    private String actorName;
    
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    // Constructors
    public EvaluationHistory() {
        this.createdAt = LocalDateTime.now();
    }
    
    public EvaluationHistory(Evaluation evaluation, String action, 
                           String fromStatus, String toStatus, 
                           String level, Long actorId, String actorName, String comment) {
        this.evaluation = evaluation;
        this.action = action;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.level = level;
        this.actorId = actorId;
        this.actorName = actorName;
        this.comment = comment;
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
    
    public String getAction() {
        return action;
    }
    
    public void setAction(String action) {
        this.action = action;
    }
    
    public String getFromStatus() {
        return fromStatus;
    }
    
    public void setFromStatus(String fromStatus) {
        this.fromStatus = fromStatus;
    }
    
    public String getToStatus() {
        return toStatus;
    }
    
    public void setToStatus(String toStatus) {
        this.toStatus = toStatus;
    }
    
    public String getLevel() {
        return level;
    }
    
    public void setLevel(String level) {
        this.level = level;
    }
    
    public Long getActorId() {
        return actorId;
    }
    
    public void setActorId(Long actorId) {
        this.actorId = actorId;
    }
    
    public String getActorName() {
        return actorName;
    }
    
    public void setActorName(String actorName) {
        this.actorName = actorName;
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

