package ptit.drl.evaluation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ptit.drl.evaluation.entity.EvaluationHistory;

import java.util.List;

@Repository
public interface EvaluationHistoryRepository extends JpaRepository<EvaluationHistory, Long> {
    
    /**
     * Find all history entries for an evaluation
     */
    List<EvaluationHistory> findByEvaluationIdOrderByCreatedAtDesc(Long evaluationId);
    
    /**
     * Find all history entries by action type
     */
    List<EvaluationHistory> findByAction(String action);
}

