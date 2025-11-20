package ptit.drl.evaluation.repository;

import ptit.drl.evaluation.entity.Rubric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RubricRepository extends JpaRepository<Rubric, Long> {
    Optional<Rubric> findByName(String name);
    List<Rubric> findByAcademicYear(String academicYear);
    List<Rubric> findByIsActiveTrue();
    Optional<Rubric> findByAcademicYearAndIsActiveTrue(String academicYear);
}

