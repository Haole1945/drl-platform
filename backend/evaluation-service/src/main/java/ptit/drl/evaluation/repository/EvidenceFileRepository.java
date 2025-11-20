package ptit.drl.evaluation.repository;

import ptit.drl.evaluation.entity.EvidenceFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvidenceFileRepository extends JpaRepository<EvidenceFile, Long> {
    
    /**
     * Find all files for an evaluation
     */
    List<EvidenceFile> findByEvaluationId(Long evaluationId);
    
    /**
     * Find files for a specific criteria in an evaluation
     */
    List<EvidenceFile> findByEvaluationIdAndCriteriaId(Long evaluationId, Long criteriaId);
    
    /**
     * Find files for a specific sub-criteria
     */
    List<EvidenceFile> findByEvaluationIdAndCriteriaIdAndSubCriteriaId(
        Long evaluationId, Long criteriaId, String subCriteriaId);
    
    /**
     * Delete all files for an evaluation
     */
    void deleteByEvaluationId(Long evaluationId);
    
    /**
     * Delete files for a specific criteria
     */
    void deleteByEvaluationIdAndCriteriaId(Long evaluationId, Long criteriaId);
    
    /**
     * Find by stored file name (for file retrieval)
     */
    @Query("SELECT f FROM EvidenceFile f WHERE f.storedFileName = :storedFileName")
    Optional<EvidenceFile> findByStoredFileName(@Param("storedFileName") String storedFileName);
}

