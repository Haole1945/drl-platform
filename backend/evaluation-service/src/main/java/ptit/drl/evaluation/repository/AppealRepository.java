package ptit.drl.evaluation.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ptit.drl.evaluation.entity.Appeal;
import ptit.drl.evaluation.entity.AppealStatus;

import java.util.List;

/**
 * Repository for Appeal entity
 */
@Repository
public interface AppealRepository extends JpaRepository<Appeal, Long> {
    
    /**
     * Find appeals by student code
     */
    Page<Appeal> findByStudentCodeOrderByCreatedAtDesc(String studentCode, Pageable pageable);
    
    /**
     * Find appeals by status
     */
    Page<Appeal> findByStatusOrderByCreatedAtDesc(AppealStatus status, Pageable pageable);
    
    /**
     * Find appeals by evaluation ID
     */
    List<Appeal> findByEvaluationIdOrderByCreatedAtDesc(Long evaluationId);
    
    /**
     * Count appeals by student code
     */
    long countByStudentCode(String studentCode);
    
    /**
     * Count pending appeals
     */
    long countByStatus(AppealStatus status);
    
    /**
     * Check if student can appeal (evaluation is FACULTY_APPROVED)
     */
    @Query("SELECT COUNT(a) FROM Appeal a WHERE a.evaluation.id = :evaluationId AND a.studentCode = :studentCode")
    long countByEvaluationIdAndStudentCode(@Param("evaluationId") Long evaluationId, @Param("studentCode") String studentCode);
}
