package ptit.drl.evaluation.mapper;

import ptit.drl.evaluation.dto.AppealDTO;
import ptit.drl.evaluation.entity.Appeal;

/**
 * Mapper for Appeal entity and DTO
 */
public class AppealMapper {
    
    /**
     * Convert Appeal entity to DTO
     */
    public static AppealDTO toDTO(Appeal appeal) {
        if (appeal == null) {
            return null;
        }
        
        AppealDTO dto = new AppealDTO();
        dto.setId(appeal.getId());
        dto.setEvaluationId(appeal.getEvaluation().getId());
        dto.setStudentCode(appeal.getStudentCode());
        dto.setReason(appeal.getReason());
        dto.setStatus(appeal.getStatus());
        dto.setReviewerId(appeal.getReviewerId());
        dto.setReviewerComment(appeal.getReviewerComment());
        dto.setCreatedAt(appeal.getCreatedAt());
        dto.setReviewedAt(appeal.getReviewedAt());
        
        // Add evaluation info
        if (appeal.getEvaluation() != null) {
            dto.setSemester(appeal.getEvaluation().getSemester());
            dto.setTotalPoints(appeal.getEvaluation().getTotalPoints());
        }
        
        return dto;
    }
}
