package ptit.drl.evaluation.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "criteria")
public class Criteria extends BaseEntity {
    
    @Column(name = "name", nullable = false, length = 200)
    private String name;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "max_points", nullable = false)
    private Double maxPoints; // Điểm tối đa của tiêu chí
    
    @Column(name = "order_index", nullable = false)
    private Integer orderIndex; // Thứ tự hiển thị
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rubric_id", nullable = false)
    private Rubric rubric;
    
    // Constructors
    public Criteria() {}
    
    public Criteria(String name, String description, Double maxPoints, Integer orderIndex, Rubric rubric) {
        this.name = name;
        this.description = description;
        this.maxPoints = maxPoints;
        this.orderIndex = orderIndex;
        this.rubric = rubric;
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
    
    public Integer getOrderIndex() {
        return orderIndex;
    }
    
    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }
    
    public Rubric getRubric() {
        return rubric;
    }
    
    public void setRubric(Rubric rubric) {
        this.rubric = rubric;
    }
}

