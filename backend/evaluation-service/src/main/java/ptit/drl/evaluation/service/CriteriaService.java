package ptit.drl.evaluation.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptit.drl.evaluation.dto.CriteriaDTO;
import ptit.drl.evaluation.entity.Criteria;
import ptit.drl.evaluation.entity.Rubric;
import ptit.drl.evaluation.exception.ResourceNotFoundException;
import ptit.drl.evaluation.mapper.RubricMapper;
import ptit.drl.evaluation.repository.CriteriaRepository;
import ptit.drl.evaluation.repository.RubricRepository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for Criteria CRUD operations
 */
@Service
@Transactional
public class CriteriaService {
    
    @Autowired
    private CriteriaRepository criteriaRepository;
    
    @Autowired
    private RubricRepository rubricRepository;
    
    /**
     * Get all criteria by rubric ID
     */
    public List<CriteriaDTO> getCriteriaByRubricId(Long rubricId) {
        // Verify rubric exists
        if (!rubricRepository.existsById(rubricId)) {
            throw new ResourceNotFoundException("Rubric", "id", rubricId);
        }
        
        return criteriaRepository.findByRubricIdOrderByOrderIndexAsc(rubricId).stream()
                .map(RubricMapper::toCriteriaDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get criteria by ID
     */
    public CriteriaDTO getCriteriaById(Long id) {
        Criteria criteria = criteriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Criteria", "id", id));
        return RubricMapper.toCriteriaDTO(criteria);
    }
    
    /**
     * Create new criteria
     */
    public CriteriaDTO createCriteria(String name, String description, 
                                      Double maxScore, Integer orderIndex, 
                                      Long rubricId) {
        Rubric rubric = rubricRepository.findById(rubricId)
                .orElseThrow(() -> new ResourceNotFoundException("Rubric", "id", rubricId));
        
        Criteria criteria = new Criteria(name, description, maxScore, orderIndex, rubric);
        Criteria saved = criteriaRepository.save(criteria);
        
        return RubricMapper.toCriteriaDTO(saved);
    }
    
    /**
     * Update criteria
     */
    public CriteriaDTO updateCriteria(Long id, String name, String description, 
                                      Double maxScore, Integer orderIndex) {
        Criteria criteria = criteriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Criteria", "id", id));
        
        if (name != null) criteria.setName(name);
        if (description != null) criteria.setDescription(description);
        if (maxScore != null) criteria.setMaxPoints(maxScore);
        if (orderIndex != null) criteria.setOrderIndex(orderIndex);
        
        Criteria updated = criteriaRepository.save(criteria);
        return RubricMapper.toCriteriaDTO(updated);
    }
    
    /**
     * Delete criteria
     */
    public void deleteCriteria(Long id) {
        if (!criteriaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Criteria", "id", id);
        }
        
        // TODO: Check if criteria is used in any evaluations before deleting
        // For now, just delete it
        criteriaRepository.deleteById(id);
    }
}

