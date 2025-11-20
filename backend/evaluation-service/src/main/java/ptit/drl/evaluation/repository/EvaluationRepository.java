package ptit.drl.evaluation.repository;

import ptit.drl.evaluation.entity.Evaluation;
import ptit.drl.evaluation.entity.EvaluationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    
    // Find by student code - optimized with fetch join
    @EntityGraph(attributePaths = {"rubric", "details", "details.criteria"})
    @Query("SELECT e FROM Evaluation e WHERE e.studentCode = :studentCode")
    List<Evaluation> findByStudentCode(@Param("studentCode") String studentCode);
    
    @EntityGraph(attributePaths = {"rubric", "details", "details.criteria"})
    @Query("SELECT e FROM Evaluation e WHERE e.studentCode = :studentCode")
    Page<Evaluation> findByStudentCode(@Param("studentCode") String studentCode, Pageable pageable);
    
    // Find by student code and semester - optimized
    @EntityGraph(attributePaths = {"rubric", "details", "details.criteria"})
    @Query("SELECT e FROM Evaluation e WHERE e.studentCode = :studentCode AND e.semester = :semester")
    List<Evaluation> findByStudentCodeAndSemester(
        @Param("studentCode") String studentCode, 
        @Param("semester") String semester);
    
    @EntityGraph(attributePaths = {"rubric", "details", "details.criteria"})
    @Query("SELECT e FROM Evaluation e WHERE e.studentCode = :studentCode AND e.semester = :semester AND e.status = :status")
    Optional<Evaluation> findByStudentCodeAndSemesterAndStatus(
        @Param("studentCode") String studentCode, 
        @Param("semester") String semester,
        @Param("status") EvaluationStatus status);
    
    // Find by status - optimized
    @EntityGraph(attributePaths = {"rubric"})
    @Query("SELECT e FROM Evaluation e WHERE e.status = :status")
    List<Evaluation> findByStatus(@Param("status") EvaluationStatus status);
    
    @EntityGraph(attributePaths = {"rubric"})
    @Query("SELECT e FROM Evaluation e WHERE e.status = :status")
    Page<Evaluation> findByStatus(@Param("status") EvaluationStatus status, Pageable pageable);
    
    // Find by academic year - optimized
    @EntityGraph(attributePaths = {"rubric"})
    @Query("SELECT e FROM Evaluation e WHERE e.academicYear = :academicYear")
    List<Evaluation> findByAcademicYear(@Param("academicYear") String academicYear);
    
    @EntityGraph(attributePaths = {"rubric"})
    @Query("SELECT e FROM Evaluation e WHERE e.academicYear = :academicYear")
    Page<Evaluation> findByAcademicYear(@Param("academicYear") String academicYear, Pageable pageable);
    
    // Check if evaluation exists for student in semester
    boolean existsByStudentCodeAndSemester(String studentCode, String semester);
    
    // Find pending evaluations (for approval) - optimized
    @EntityGraph(attributePaths = {"rubric"})
    @Query("SELECT e FROM Evaluation e WHERE e.status IN :statuses ORDER BY e.submittedAt ASC")
    Page<Evaluation> findPendingEvaluations(@Param("statuses") List<EvaluationStatus> statuses, Pageable pageable);
    
    // Find by ID with all relations - for detail view
    // Note: Cannot fetch multiple bags simultaneously (MultipleBagFetchException)
    // - Cannot fetch both 'details' and 'history' together
    // - Cannot fetch both 'details' and 'rubric.criteria' together
    // So we fetch details and rubric (without criteria) here
    // Criteria will be lazy-loaded when needed (with @BatchSize to avoid N+1)
    @EntityGraph(attributePaths = {"rubric", "details", "details.criteria"})
    @Query("SELECT e FROM Evaluation e WHERE e.id = :id")
    Optional<Evaluation> findByIdWithRelations(@Param("id") Long id);
    
    // Find by ID with history only (for cases where we need history separately)
    @EntityGraph(attributePaths = {"history"})
    @Query("SELECT e FROM Evaluation e WHERE e.id = :id")
    Optional<Evaluation> findByIdWithHistory(@Param("id") Long id);
}

