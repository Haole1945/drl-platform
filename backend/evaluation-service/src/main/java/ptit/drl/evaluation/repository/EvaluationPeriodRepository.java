package ptit.drl.evaluation.repository;

import ptit.drl.evaluation.entity.EvaluationPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationPeriodRepository extends JpaRepository<EvaluationPeriod, Long> {
    
    /**
     * Find active periods that are currently open (within date range)
     * Returns list to handle multiple open periods
     */
    @Query("SELECT p FROM EvaluationPeriod p WHERE p.isActive = true " +
           "AND :today >= p.startDate AND :today <= p.endDate " +
           "ORDER BY p.startDate DESC")
    List<EvaluationPeriod> findOpenPeriods(@Param("today") LocalDate today);
    
    /**
     * Find active period for a specific semester
     */
    @Query("SELECT p FROM EvaluationPeriod p WHERE p.isActive = true AND p.semester = :semester")
    Optional<EvaluationPeriod> findActivePeriodBySemester(@Param("semester") String semester);
    
    /**
     * Find all active periods
     */
    List<EvaluationPeriod> findByIsActiveTrue();
    
    /**
     * Find periods by academic year
     */
    List<EvaluationPeriod> findByAcademicYear(String academicYear);
    
    /**
     * Find periods by semester
     */
    List<EvaluationPeriod> findBySemester(String semester);
    
    /**
     * Find periods that overlap with the given date range
     * Excludes the period with the given ID (for update operations)
     * Two periods overlap if: start1 <= end2 AND end1 >= start2
     */
    @Query("SELECT p FROM EvaluationPeriod p WHERE p.isActive = true " +
           "AND :startDate <= p.endDate AND :endDate >= p.startDate " +
           "AND (:excludeId IS NULL OR p.id != :excludeId)")
    List<EvaluationPeriod> findOverlappingPeriods(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("excludeId") Long excludeId);
}

