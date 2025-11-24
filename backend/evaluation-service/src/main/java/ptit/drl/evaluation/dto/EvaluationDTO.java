package ptit.drl.evaluation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Evaluation response
 */
public class EvaluationDTO {
    private Long id;
    private String studentCode;
    private String studentName; // Will be populated from student-service if needed
    private String facultyName; // Will be populated from student-service if needed
    private String className; // Will be populated from student-service if needed
    private Long rubricId;
    private String rubricName;
    private String semester;
    private String academicYear;
    private String status;
    private Double totalScore;
    private Double maxScore;
    private List<EvaluationDetailDTO> details;
    private List<EvaluationHistoryDTO> approvalHistory;
    private List<EvaluationHistoryDTO> history; // Alias for approvalHistory (for frontend compatibility)
    private String rejectionReason;
    private String lastRejectionLevel;
    private Integer resubmissionCount;
    private LocalDate submittedAt;
    private LocalDate approvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public EvaluationDTO() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
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
    
    public String getFacultyName() {
        return facultyName;
    }
    
    public void setFacultyName(String facultyName) {
        this.facultyName = facultyName;
    }
    
    public String getClassName() {
        return className;
    }
    
    public void setClassName(String className) {
        this.className = className;
    }
    
    public Long getRubricId() {
        return rubricId;
    }
    
    public void setRubricId(Long rubricId) {
        this.rubricId = rubricId;
    }
    
    public String getRubricName() {
        return rubricName;
    }
    
    public void setRubricName(String rubricName) {
        this.rubricName = rubricName;
    }
    
    public String getSemester() {
        return semester;
    }
    
    public void setSemester(String semester) {
        this.semester = semester;
    }
    
    public String getAcademicYear() {
        return academicYear;
    }
    
    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Double getTotalScore() {
        return totalScore;
    }
    
    public void setTotalScore(Double totalScore) {
        this.totalScore = totalScore;
    }
    
    public Double getMaxScore() {
        return maxScore;
    }
    
    public void setMaxScore(Double maxScore) {
        this.maxScore = maxScore;
    }
    
    public List<EvaluationDetailDTO> getDetails() {
        return details;
    }
    
    public void setDetails(List<EvaluationDetailDTO> details) {
        this.details = details;
    }
    
    public List<EvaluationHistoryDTO> getApprovalHistory() {
        return approvalHistory;
    }
    
    public void setApprovalHistory(List<EvaluationHistoryDTO> approvalHistory) {
        this.approvalHistory = approvalHistory;
        this.history = approvalHistory; // Keep in sync
    }
    
    public List<EvaluationHistoryDTO> getHistory() {
        return history != null ? history : approvalHistory;
    }
    
    public void setHistory(List<EvaluationHistoryDTO> history) {
        this.history = history;
        this.approvalHistory = history; // Keep in sync
    }
    
    public String getRejectionReason() {
        return rejectionReason;
    }
    
    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
    
    public String getLastRejectionLevel() {
        return lastRejectionLevel;
    }
    
    public void setLastRejectionLevel(String lastRejectionLevel) {
        this.lastRejectionLevel = lastRejectionLevel;
    }
    
    public Integer getResubmissionCount() {
        return resubmissionCount;
    }
    
    public void setResubmissionCount(Integer resubmissionCount) {
        this.resubmissionCount = resubmissionCount;
    }
    
    public LocalDate getSubmittedAt() {
        return submittedAt;
    }
    
    public void setSubmittedAt(LocalDate submittedAt) {
        this.submittedAt = submittedAt;
    }
    
    public LocalDate getApprovedAt() {
        return approvedAt;
    }
    
    public void setApprovedAt(LocalDate approvedAt) {
        this.approvedAt = approvedAt;
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
}

