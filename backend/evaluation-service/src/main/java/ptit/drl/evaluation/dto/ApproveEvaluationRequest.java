package ptit.drl.evaluation.dto;

import lombok.Data;
import java.util.Map;

@Data
public class ApproveEvaluationRequest {
    private String comment;
    private Map<Long, Double> scores; // criteriaId -> score
    private Map<String, ScoreAdjustment> scoreAdjustments; // "criteriaId_subCriteriaId" -> adjustment
    
    @Data
    public static class ScoreAdjustment {
        private Double originalScore;
        private Double newScore;
        private String reason;
        private String evidence;
    }
}
