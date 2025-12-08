package ptit.drl.evaluation.repository;

import ptit.drl.evaluation.entity.ClassApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassApprovalRepository extends JpaRepository<ClassApproval, Long> {
    
    /**
     * Find all approvals for an evaluation
     */
    List<ClassApproval> findByEvaluationId(Long evaluationId);
    
    /**
     * Find approval by evaluation and approver
     */
    Optional<ClassApproval> findByEvaluationIdAndApproverId(Long evaluationId, Long approverId);
    
    /**
     * Check if approver has already approved
     */
    boolean existsByEvaluationIdAndApproverId(Long evaluationId, Long approverId);
    
    /**
     * Count approvals for an evaluation
     */
    long countByEvaluationId(Long evaluationId);
}

