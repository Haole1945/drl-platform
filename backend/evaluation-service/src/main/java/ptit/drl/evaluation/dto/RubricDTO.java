package ptit.drl.evaluation.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Rubric response
 */
public class RubricDTO {
    private Long id;
    private String name;
    private String description;
    private Double maxScore;
    private String academicYear;
    private Boolean isActive;
    private String targetClasses;
    private Integer criteriaCount;
    private List<CriteriaDTO> criteria;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public RubricDTO() {}
    
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
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Double getMaxScore() {
        return maxScore;
    }
    
    public void setMaxScore(Double maxScore) {
        this.maxScore = maxScore;
    }
    
    public String getAcademicYear() {
        return academicYear;
    }
    
    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public String getTargetClasses() {
        return targetClasses;
    }
    
    public void setTargetClasses(String targetClasses) {
        this.targetClasses = targetClasses;
    }
    
    public Integer getCriteriaCount() {
        return criteriaCount;
    }
    
    public void setCriteriaCount(Integer criteriaCount) {
        this.criteriaCount = criteriaCount;
    }
    
    public List<CriteriaDTO> getCriteria() {
        return criteria;
    }
    
    public void setCriteria(List<CriteriaDTO> criteria) {
        this.criteria = criteria;
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

