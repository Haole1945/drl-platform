package ptit.drl.evaluation.mapper;

import ptit.drl.evaluation.dto.RubricDTO;
import ptit.drl.evaluation.dto.CriteriaDTO;
import ptit.drl.evaluation.entity.Rubric;
import ptit.drl.evaluation.entity.Criteria;

import java.util.Collections;
import java.util.stream.Collectors;

/**
 * Mapper for Rubric and Criteria entities
 */
public class RubricMapper {
    
    /**
     * Convert Rubric entity to RubricDTO
     */
    public static RubricDTO toDTO(Rubric rubric) {
        if (rubric == null) {
            return null;
        }
        
        RubricDTO dto = new RubricDTO();
        dto.setId(rubric.getId());
        dto.setName(rubric.getName());
        dto.setDescription(rubric.getDescription());
        dto.setMaxScore(rubric.getMaxPoints());
        dto.setAcademicYear(rubric.getAcademicYear());
        dto.setIsActive(rubric.getIsActive());
        dto.setTargetClasses(rubric.getTargetClasses());
        dto.setCreatedAt(rubric.getCreatedAt());
        dto.setUpdatedAt(rubric.getUpdatedAt());
        
        // Map criteria if available
        if (rubric.getCriteria() != null && !rubric.getCriteria().isEmpty()) {
            dto.setCriteriaCount(rubric.getCriteria().size());
            dto.setCriteria(rubric.getCriteria().stream()
                    .map(RubricMapper::toCriteriaDTO)
                    .collect(Collectors.toList()));
        } else {
            dto.setCriteriaCount(0);
            dto.setCriteria(Collections.emptyList());
        }
        
        return dto;
    }
    
    /**
     * Convert Rubric entity to RubricDTO (without criteria details)
     */
    public static RubricDTO toDTOWithoutCriteria(Rubric rubric) {
        if (rubric == null) {
            return null;
        }
        
        RubricDTO dto = new RubricDTO();
        dto.setId(rubric.getId());
        dto.setName(rubric.getName());
        dto.setDescription(rubric.getDescription());
        dto.setMaxScore(rubric.getMaxPoints());
        dto.setAcademicYear(rubric.getAcademicYear());
        dto.setIsActive(rubric.getIsActive());
        dto.setTargetClasses(rubric.getTargetClasses());
        dto.setCreatedAt(rubric.getCreatedAt());
        dto.setUpdatedAt(rubric.getUpdatedAt());
        
        if (rubric.getCriteria() != null) {
            dto.setCriteriaCount(rubric.getCriteria().size());
        } else {
            dto.setCriteriaCount(0);
        }
        
        // Set empty criteria list to avoid null serialization issues
        dto.setCriteria(Collections.emptyList());
        
        return dto;
    }
    
    /**
     * Convert Criteria entity to CriteriaDTO
     */
    public static CriteriaDTO toCriteriaDTO(Criteria criteria) {
        if (criteria == null) {
            return null;
        }
        
        CriteriaDTO dto = new CriteriaDTO();
        dto.setId(criteria.getId());
        dto.setName(criteria.getName());
        dto.setDescription(criteria.getDescription());
        dto.setMaxScore(criteria.getMaxPoints());
        dto.setOrderIndex(criteria.getOrderIndex());
        
        if (criteria.getRubric() != null) {
            dto.setRubricId(criteria.getRubric().getId());
            dto.setRubricName(criteria.getRubric().getName());
        }
        
        return dto;
    }
}
