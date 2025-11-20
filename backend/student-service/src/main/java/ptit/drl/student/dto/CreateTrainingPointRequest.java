package ptit.drl.student.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/**
 * DTO for creating a new training point
 */
public class CreateTrainingPointRequest {
    
    @NotBlank(message = "Activity name is required")
    @Size(max = 200, message = "Activity name must not exceed 200 characters")
    private String activityName;
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
    
    @NotNull(message = "Activity date is required")
    @PastOrPresent(message = "Activity date cannot be in the future")
    private LocalDate activityDate;
    
    @NotNull(message = "Points is required")
    @Positive(message = "Points must be positive")
    private Double points;
    
    @Size(max = 500, message = "Evidence URL must not exceed 500 characters")
    private String evidenceUrl;
    
    @Size(max = 20, message = "Semester must not exceed 20 characters")
    private String semester;
    
    @NotBlank(message = "Student code is required")
    private String studentCode;
    
    // Constructors
    public CreateTrainingPointRequest() {}
    
    public CreateTrainingPointRequest(String activityName, String description,
                                     LocalDate activityDate, Double points,
                                     String evidenceUrl, String semester,
                                     String studentCode) {
        this.activityName = activityName;
        this.description = description;
        this.activityDate = activityDate;
        this.points = points;
        this.evidenceUrl = evidenceUrl;
        this.semester = semester;
        this.studentCode = studentCode;
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
    
    public String getStudentCode() {
        return studentCode;
    }
    
    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }
}

