package ptit.drl.evaluation.dto;

/**
 * DTO for EvaluationDetail (criteria score)
 */
public class EvaluationDetailDTO {
    private Long criteriaId;
    private String criteriaName;
    private String criteriaDescription;
    private Double score;
    private Double maxScore;
    private String evidence;
    private String note;
    
    // Constructors
    public EvaluationDetailDTO() {}
    
    public EvaluationDetailDTO(Long criteriaId, String criteriaName, 
                              Double score, Double maxScore, 
                              String evidence, String note) {
        this.criteriaId = criteriaId;
        this.criteriaName = criteriaName;
        this.score = score;
        this.maxScore = maxScore;
        this.evidence = evidence;
        this.note = note;
    }
    
    // Getters and Setters
    public Long getCriteriaId() {
        return criteriaId;
    }
    
    public void setCriteriaId(Long criteriaId) {
        this.criteriaId = criteriaId;
    }
    
    public String getCriteriaName() {
        return criteriaName;
    }
    
    public void setCriteriaName(String criteriaName) {
        this.criteriaName = criteriaName;
    }
    
    public String getCriteriaDescription() {
        return criteriaDescription;
    }
    
    public void setCriteriaDescription(String criteriaDescription) {
        this.criteriaDescription = criteriaDescription;
    }
    
    public Double getScore() {
        return score;
    }
    
    public void setScore(Double score) {
        this.score = score;
    }
    
    public Double getMaxScore() {
        return maxScore;
    }
    
    public void setMaxScore(Double maxScore) {
        this.maxScore = maxScore;
    }
    
    public String getEvidence() {
        return evidence;
    }
    
    public void setEvidence(String evidence) {
        this.evidence = evidence;
    }
    
    public String getNote() {
        return note;
    }
    
    public void setNote(String note) {
        this.note = note;
    }
}

