package ptit.drl.evaluation.dto;

/**
 * DTO for Criteria response
 */
public class CriteriaDTO {
    private Long id;
    private String name;
    private String description;
    private Double maxScore;
    private Integer orderIndex;
    private Long rubricId;
    private String rubricName;
    
    // Constructors
    public CriteriaDTO() {}
    
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
    
    public Integer getOrderIndex() {
        return orderIndex;
    }
    
    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
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
}

