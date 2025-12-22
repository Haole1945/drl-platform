package ptit.drl.evaluation.dto;

import ptit.drl.evaluation.entity.AppealStatus;
import java.time.LocalDateTime;

/**
 * DTO for Appeal
 */
public class AppealDTO {
    private Long id;
    private Long evaluationId;
    private String studentCode;
    private String studentName;
    private String reason;
    private AppealStatus status;
    private Long reviewerId;
    private String reviewerName;
    private String reviewerComment;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    
    // Evaluation info
    private String semester;
    private Double totalPoints;
    
    // Constructors
    public AppealDTO() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getEvaluationId() {
        return evaluationId;
    }
    
    public void setEvaluationId(Long evaluationId) {
        this.evaluationId = evaluationId;
    }
    
    public String getStudentCode() {
        return studentCode;
    }
    
    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }
    
    public String getStudentName() {
        return studentName;
    }
    
    public void setStudentName(String studentName) {
        this.studentName = studentName;
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
    
    public String getReviewerName() {
        return reviewerName;
    }
    
    public void setReviewerName(String reviewerName) {
        this.reviewerName = reviewerName;
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
    
    public String getSemester() {
        return semester;
    }
    
    public void setSemester(String semester) {
        this.semester = semester;
    }
    
    public Double getTotalPoints() {
        return totalPoints;
    }
    
    public void setTotalPoints(Double totalPoints) {
        this.totalPoints = totalPoints;
    }
}
