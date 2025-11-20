package ptit.drl.student.dto;

import java.time.LocalDate;

/**
 * DTO for TrainingPoint response
 */
public class TrainingPointDTO {
    private Long id;
    private String activityName;
    private String description;
    private LocalDate activityDate;
    private Double points;
    private String evidenceUrl;
    private String semester;
    private String studentCode;
    private String studentName;
    
    // Constructors
    public TrainingPointDTO() {}
    
    public TrainingPointDTO(Long id, String activityName, String description, 
                           LocalDate activityDate, Double points, String evidenceUrl,
                           String semester, String studentCode, String studentName) {
        this.id = id;
        this.activityName = activityName;
        this.description = description;
        this.activityDate = activityDate;
        this.points = points;
        this.evidenceUrl = evidenceUrl;
        this.semester = semester;
        this.studentCode = studentCode;
        this.studentName = studentName;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
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
}

