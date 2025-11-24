package ptit.drl.evaluation.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * Evaluation Period - Đợt đánh giá điểm rèn luyện
 * Quản lý thời gian cho phép sinh viên nộp đánh giá
 */
@Entity
@Table(name = "evaluation_periods", indexes = {
    @Index(name = "idx_period_semester", columnList = "semester"),
    @Index(name = "idx_period_academic_year", columnList = "academic_year"),
    @Index(name = "idx_period_active", columnList = "is_active")
})
public class EvaluationPeriod {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", nullable = false, length = 200)
    private String name; // Tên đợt, ví dụ: "Đợt 1 - Học kỳ 1 năm học 2024-2025"
    
    @Column(name = "semester", nullable = false, length = 50)
    private String semester; // Học kỳ, ví dụ: "2024-2025-HK1"
    
    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear; // Năm học, ví dụ: "2024-2025"
    
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate; // Ngày bắt đầu cho phép nộp
    
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate; // Ngày kết thúc cho phép nộp
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true; // Đợt có đang hoạt động không
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description; // Mô tả đợt đánh giá
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rubric_id")
    private Rubric rubric; // Rubric sử dụng cho đợt này
    
    @Column(name = "target_classes", columnDefinition = "TEXT")
    private String targetClasses; // Lớp/khoa/ngành áp dụng (FACULTY:CNTT, MAJOR:DCCN, CLASS:D21DCCN01-N)
    
    // Constructors
    public EvaluationPeriod() {}
    
    public EvaluationPeriod(String name, String semester, String academicYear, 
                           LocalDate startDate, LocalDate endDate) {
        this.name = name;
        this.semester = semester;
        this.academicYear = academicYear;
        this.startDate = startDate;
        this.endDate = endDate;
        this.isActive = true;
    }
    
    /**
     * Check if period is currently open (within date range and active)
     */
    public boolean isOpen() {
        if (!isActive) {
            return false;
        }
        LocalDate today = LocalDate.now();
        return !today.isBefore(startDate) && !today.isAfter(endDate);
    }
    
    /**
     * Check if period is in the future
     */
    public boolean isFuture() {
        return LocalDate.now().isBefore(startDate);
    }
    
    /**
     * Check if period has ended
     */
    public boolean isEnded() {
        return LocalDate.now().isAfter(endDate);
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
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
    
    public LocalDate getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
    
    public LocalDate getEndDate() {
        return endDate;
    }
    
    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Rubric getRubric() {
        return rubric;
    }
    
    public void setRubric(Rubric rubric) {
        this.rubric = rubric;
    }
    
    public String getTargetClasses() {
        return targetClasses;
    }
    
    public void setTargetClasses(String targetClasses) {
        this.targetClasses = targetClasses;
    }
}

