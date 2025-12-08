package ptit.drl.aivalidation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ptit.drl.aivalidation.entity.EvidenceValidation;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvidenceValidationRepository extends JpaRepository<EvidenceValidation, Long> {
    
    /**
     * Find validation by evidence file ID
     */
    Optional<EvidenceValidation> findByEvidenceFileId(Long evidenceFileId);
    
    /**
     * Find all validations for an evaluation
     */
    List<EvidenceValidation> findByEvaluationId(Long evaluationId);
    
    /**
     * Find validations by status
     */
    List<EvidenceValidation> findByValidationStatus(EvidenceValidation.ValidationStatus status);
    
    /**
     * Find validations by criteria ID
     */
    List<EvidenceValidation> findByCriteriaId(Long criteriaId);
    
    /**
     * Check if validation exists for evidence file
     */
    boolean existsByEvidenceFileId(Long evidenceFileId);
}

