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
     * Find active period that is currently open (within date range)
     */
    @Query("SELECT p FROM EvaluationPeriod p WHERE p.isActive = true " +
           "AND :today >= p.startDate AND :today <= p.endDate")
    Optional<EvaluationPeriod> findOpenPeriod(@Param("today") LocalDate today);
    
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
}

