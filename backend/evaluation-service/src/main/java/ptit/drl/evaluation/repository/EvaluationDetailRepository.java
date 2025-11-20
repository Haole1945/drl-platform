package ptit.drl.evaluation.repository;

import ptit.drl.evaluation.entity.EvaluationDetail;
import ptit.drl.evaluation.entity.EvaluationDetailId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationDetailRepository extends JpaRepository<EvaluationDetail, EvaluationDetailId> {
    List<EvaluationDetail> findByEvaluationId(Long evaluationId);
}

