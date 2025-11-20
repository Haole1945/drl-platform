package ptit.drl.evaluation.entity;

import java.io.Serializable;
import java.util.Objects;

/**
 * Composite Primary Key for EvaluationDetail
 */
public class EvaluationDetailId implements Serializable {
    
    private Long evaluationId;
    private Long criteriaId;
    
    public EvaluationDetailId() {}
    
    public EvaluationDetailId(Long evaluationId, Long criteriaId) {
        this.evaluationId = evaluationId;
        this.criteriaId = criteriaId;
    }
    
    // Getters and Setters
    public Long getEvaluationId() {
        return evaluationId;
    }
    
    public void setEvaluationId(Long evaluationId) {
        this.evaluationId = evaluationId;
    }
    
    public Long getCriteriaId() {
        return criteriaId;
    }
    
    public void setCriteriaId(Long criteriaId) {
        this.criteriaId = criteriaId;
    }
    
    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        EvaluationDetailId that = (EvaluationDetailId) o;
        return Objects.equals(evaluationId, that.evaluationId) &&
               Objects.equals(criteriaId, that.criteriaId);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(evaluationId, criteriaId);
    }
}

