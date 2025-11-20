package ptit.drl.evaluation.mapper;

import ptit.drl.evaluation.dto.CreateEvaluationPeriodRequest;
import ptit.drl.evaluation.dto.EvaluationPeriodDTO;
import ptit.drl.evaluation.dto.UpdateEvaluationPeriodRequest;
import ptit.drl.evaluation.entity.EvaluationPeriod;

/**
 * Mapper for EvaluationPeriod entity and DTOs
 */
public class EvaluationPeriodMapper {
    
    /**
     * Convert EvaluationPeriod entity to DTO
     */
    public static EvaluationPeriodDTO toDTO(EvaluationPeriod period) {
        if (period == null) {
            return null;
        }
        
        EvaluationPeriodDTO dto = new EvaluationPeriodDTO();
        dto.setId(period.getId());
        dto.setName(period.getName());
        dto.setSemester(period.getSemester());
        dto.setAcademicYear(period.getAcademicYear());
        dto.setStartDate(period.getStartDate());
        dto.setEndDate(period.getEndDate());
        dto.setIsActive(period.getIsActive());
        dto.setDescription(period.getDescription());
        
        // Computed fields
        dto.setIsOpen(period.isOpen());
        dto.setIsFuture(period.isFuture());
        dto.setIsEnded(period.isEnded());
        
        return dto;
    }
    
    /**
     * Convert CreateEvaluationPeriodRequest to EvaluationPeriod entity
     */
    public static EvaluationPeriod toEntity(CreateEvaluationPeriodRequest request) {
        if (request == null) {
            return null;
        }
        
        EvaluationPeriod period = new EvaluationPeriod();
        period.setName(request.getName());
        period.setSemester(request.getSemester());
        period.setAcademicYear(request.getAcademicYear());
        period.setStartDate(request.getStartDate());
        period.setEndDate(request.getEndDate());
        period.setDescription(request.getDescription());
        period.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        
        return period;
    }
    
    /**
     * Update EvaluationPeriod entity from UpdateEvaluationPeriodRequest
     */
    public static void updateEntity(EvaluationPeriod period, UpdateEvaluationPeriodRequest request) {
        if (period == null || request == null) {
            return;
        }
        
        period.setName(request.getName());
        period.setSemester(request.getSemester());
        period.setAcademicYear(request.getAcademicYear());
        period.setStartDate(request.getStartDate());
        period.setEndDate(request.getEndDate());
        period.setDescription(request.getDescription());
        period.setIsActive(request.getIsActive());
    }
}

