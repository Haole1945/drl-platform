package ptit.drl.evaluation.dto;

import java.time.LocalDateTime;

/**
 * DTO for EvaluationHistory (approval/rejection tracking)
 */
public class EvaluationHistoryDTO {
    private String action;
    private String level;
    private String actorName;
    private String comment;
    private LocalDateTime timestamp;
    
    // Constructors
    public EvaluationHistoryDTO() {}
    
    public EvaluationHistoryDTO(String action, String level, 
                               String actorName, String comment, 
                               LocalDateTime timestamp) {
        this.action = action;
        this.level = level;
        this.actorName = actorName;
        this.comment = comment;
        this.timestamp = timestamp;
    }
    
    // Getters and Setters
    public String getAction() {
        return action;
    }
    
    public void setAction(String action) {
        this.action = action;
    }
    
    public String getLevel() {
        return level;
    }
    
    public void setLevel(String level) {
        this.level = level;
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
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}

