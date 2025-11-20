package ptit.drl.student.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "training_points")
public class TrainingPoint extends BaseEntity {
    
    @Column(name = "activity_name", nullable = false, length = 200)
    private String activityName;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;
    
    @Column(name = "points", nullable = false)
    private Double points; // Điểm rèn luyện
    
    @Column(name = "evidence_url", length = 500)
    private String evidenceUrl; // Link đến minh chứng (file/image)
    
    @Column(name = "semester", length = 20)
    private String semester; // Học kỳ, e.g., "2024-2025-HK1"
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_code", nullable = false)
    private Student student;
    
    // Constructors
    public TrainingPoint() {}
    
    public TrainingPoint(String activityName, String description, LocalDate activityDate, 
                        Double points, String semester, Student student) {
        this.activityName = activityName;
        this.description = description;
        this.activityDate = activityDate;
        this.points = points;
        this.semester = semester;
        this.student = student;
    }
    
    // Getters and Setters
    public String getActivityName() {
        return activityName;
    }
    
    public void setActivityName(String activityName) {
        this.activityName = activityName;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public LocalDate getActivityDate() {
        return activityDate;
    }
    
    public void setActivityDate(LocalDate activityDate) {
        this.activityDate = activityDate;
    }
    
    public Double getPoints() {
        return points;
    }
    
    public void setPoints(Double points) {
        this.points = points;
    }
    
    public String getEvidenceUrl() {
        return evidenceUrl;
    }
    
    public void setEvidenceUrl(String evidenceUrl) {
        this.evidenceUrl = evidenceUrl;
    }
    
    public String getSemester() {
        return semester;
    }
    
    public void setSemester(String semester) {
        this.semester = semester;
    }
    
    public Student getStudent() {
        return student;
    }
    
    public void setStudent(Student student) {
        this.student = student;
    }
}



