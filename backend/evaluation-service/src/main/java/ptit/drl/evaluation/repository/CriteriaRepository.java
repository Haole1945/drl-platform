package ptit.drl.evaluation.repository;

import ptit.drl.evaluation.entity.Criteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CriteriaRepository extends JpaRepository<Criteria, Long> {
    List<Criteria> findByRubricId(Long rubricId);
    List<Criteria> findByRubricIdOrderByOrderIndexAsc(Long rubricId);
}

