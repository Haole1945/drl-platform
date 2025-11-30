package ptit.drl.evaluation.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Evaluation entity - Note: student_code is stored as String (no FK to Student entity)
 * This allows evaluation-service to be independent from student-service
 */
@Entity
@Table(name = "evaluations", indexes = {
    @Index(name = "idx_evaluation_student_code", columnList = "student_code"),
    @Index(name = "idx_evaluation_semester", columnList = "semester"),
    @Index(name = "idx_evaluation_status", columnList = "status"),
    @Index(name = "idx_evaluation_academic_year", columnList = "academic_year"),
    @Index(name = "idx_evaluation_student_semester", columnList = "student_code,semester"),
    @Index(name = "idx_evaluation_rubric", columnList = "rubric_id")
})
public class Evaluation extends BaseEntity {
    
    @Column(name = "student_code", nullable = false, length = 20)
    private String studentCode; // Reference to student in student-service (no FK)
    
    @Column(name = "semester", nullable = false, length = 20)
    private String semester; // Học kỳ, e.g., "2024-2025-HK1"
    
    @Column(name = "academic_year", length = 20)
    private String academicYear; // Năm học, e.g., "2024-2025"
    
    @Column(name = "total_points")
    private Double totalPoints; // Tổng điểm rèn luyện
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private EvaluationStatus status = EvaluationStatus.DRAFT;
    
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason; // Lý do từ chối (nếu bị reject)
    
    @Column(name = "appeal_reason", columnDefinition = "TEXT")
    private String appealReason; // Lý do kháng nghị
    
    @Column(name = "submitted_at")
    private LocalDate submittedAt; // Ngày sinh viên nộp
    
    @Column(name = "approved_at")
    private LocalDate approvedAt; // Ngày được duyệt cuối cùng
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rubric_id", nullable = false)
    private Rubric rubric;
    
    @OneToMany(mappedBy = "evaluation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EvaluationDetail> details = new ArrayList<>();
    
    @OneToMany(mappedBy = "evaluation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EvaluationHistory> history = new ArrayList<>();
    
    @Column(name = "resubmission_count")
    private Integer resubmissionCount = 0; // Số lần nộp lại sau khi bị reject
    
    @Column(name = "last_rejection_level", length = 20)
    private String lastRejectionLevel; // Level that last rejected: CLASS, FACULTY, CTSV
    
    @Column(name = "created_by")
    private Long createdBy; // User ID who created this evaluation (null if student, set if admin)
    
    // Constructors
    public Evaluation() {}
    
    public Evaluation(String studentCode, String semester, Rubric rubric) {
        this.studentCode = studentCode;
        this.semester = semester;
        this.rubric = rubric;
    }
    
    // Getters and Setters
    public String getStudentCode() {
        return studentCode;
    }
    
    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
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
    
    public EvaluationStatus getStatus() {
        return status;
    }
    
    public void setStatus(EvaluationStatus status) {
        this.status = status;
    }
    
    public String getRejectionReason() {
        return rejectionReason;
    }
    
    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
    
    public String getAppealReason() {
        return appealReason;
    }
    
    public void setAppealReason(String appealReason) {
        this.appealReason = appealReason;
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
    
    public Rubric getRubric() {
        return rubric;
    }
    
    public void setRubric(Rubric rubric) {
        this.rubric = rubric;
    }
    
    public List<EvaluationDetail> getDetails() {
        return details;
    }
    
    public void setDetails(List<EvaluationDetail> details) {
        this.details = details;
    }
    
    public String getAcademicYear() {
        return academicYear;
    }
    
    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }
    
    public List<EvaluationHistory> getHistory() {
        return history;
    }
    
    public void setHistory(List<EvaluationHistory> history) {
        this.history = history;
    }
    
    public Integer getResubmissionCount() {
        return resubmissionCount;
    }
    
    public void setResubmissionCount(Integer resubmissionCount) {
        this.resubmissionCount = resubmissionCount;
    }
    
    // Helper methods for workflow
    public void addHistory(EvaluationHistory historyEntry) {
        history.add(historyEntry);
        historyEntry.setEvaluation(this);
    }
    
    public void incrementResubmissionCount() {
        if (this.resubmissionCount == null) {
            this.resubmissionCount = 1;
        } else {
            this.resubmissionCount++;
        }
    }
    
    public String getLastRejectionLevel() {
        return lastRejectionLevel;
    }
    
    public void setLastRejectionLevel(String lastRejectionLevel) {
        this.lastRejectionLevel = lastRejectionLevel;
    }
    
    public Long getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
}

