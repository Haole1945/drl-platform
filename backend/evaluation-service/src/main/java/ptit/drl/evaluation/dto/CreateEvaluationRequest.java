package ptit.drl.evaluation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

/**
 * DTO for creating a new evaluation
 */
public class CreateEvaluationRequest {
    
    @NotBlank(message = "Student code is required")
    private String studentCode;
    
    @NotNull(message = "Rubric ID is required")
    private Long rubricId;
    
    @NotBlank(message = "Semester is required")
    @Size(max = 20, message = "Semester must not exceed 20 characters")
    private String semester;
    
    @Size(max = 20, message = "Academic year must not exceed 20 characters")
    private String academicYear;
    
    @NotNull(message = "At least one evaluation detail is required")
    @Size(min = 1, message = "At least one evaluation detail is required")
    @Valid
    private List<CreateEvaluationDetailRequest> details;
    
    /**
     * If true, allows saving incomplete evaluation (draft mode)
     * If false, requires full validation before creating
     */
    private Boolean asDraft = false;
    
    // Constructors
    public CreateEvaluationRequest() {}
    
    // Getters and Setters
    public String getStudentCode() {
        return studentCode;
    }
    
    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }
    
    public Long getRubricId() {
        return rubricId;
    }
    
    public void setRubricId(Long rubricId) {
        this.rubricId = rubricId;
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
    
    public List<CreateEvaluationDetailRequest> getDetails() {
        return details;
    }
    
    public void setDetails(List<CreateEvaluationDetailRequest> details) {
        this.details = details;
    }
    
    public Boolean getAsDraft() {
        return asDraft != null ? asDraft : false;
    }
    
    public void setAsDraft(Boolean asDraft) {
        this.asDraft = asDraft;
    }
}

