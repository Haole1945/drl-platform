package ptit.drl.evaluation.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rubrics")
public class Rubric extends BaseEntity {
    
    @Column(name = "name", nullable = false, length = 200)
    private String name;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "max_points", nullable = false)
    private Double maxPoints; // Điểm tối đa của rubric
    
    @Column(name = "academic_year", length = 20)
    private String academicYear; // Áp dụng cho năm học nào
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "target_classes", length = 500)
    private String targetClasses; // Comma-separated class codes: "D21CQCN01-N,D20CQCN01-N" or null for all
    
    @OneToMany(mappedBy = "rubric", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20) // Batch load criteria to avoid N+1 queries
    private List<Criteria> criteria = new ArrayList<>();
    
    // Constructors
    public Rubric() {}
    
    public Rubric(String name, String description, Double maxPoints, String academicYear) {
        this.name = name;
        this.description = description;
        this.maxPoints = maxPoints;
        this.academicYear = academicYear;
    }
    
    // Getters and Setters
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
    
    public Double getMaxPoints() {
        return maxPoints;
    }
    
    public void setMaxPoints(Double maxPoints) {
        this.maxPoints = maxPoints;
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
    
    public List<Criteria> getCriteria() {
        return criteria;
    }
    
    public void setCriteria(List<Criteria> criteria) {
        this.criteria = criteria;
    }
}

