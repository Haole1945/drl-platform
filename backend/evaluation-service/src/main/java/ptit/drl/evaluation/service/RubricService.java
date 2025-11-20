package ptit.drl.evaluation.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptit.drl.evaluation.dto.CriteriaDTO;
import ptit.drl.evaluation.dto.RubricDTO;
import ptit.drl.evaluation.entity.Rubric;
import ptit.drl.evaluation.exception.ResourceNotFoundException;
import ptit.drl.evaluation.mapper.RubricMapper;
import ptit.drl.evaluation.repository.RubricRepository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for Rubric CRUD operations
 */
@Service
@Transactional
public class RubricService {
    
    @Autowired
    private RubricRepository rubricRepository;
    
    /**
     * Get all rubrics
     */
    public List<RubricDTO> getAllRubrics() {
        return rubricRepository.findAll().stream()
                .map(RubricMapper::toDTOWithoutCriteria)
                .collect(Collectors.toList());
    }
    
    /**
     * Get rubric by ID with criteria
     */
    public RubricDTO getRubricById(Long id) {
        Rubric rubric = rubricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rubric", "id", id));
        return RubricMapper.toDTO(rubric);
    }
    
    /**
     * Get active rubric for academic year
     */
    public RubricDTO getActiveRubric(String academicYear) {
        Rubric rubric;
        if (academicYear != null) {
            rubric = rubricRepository.findByAcademicYearAndIsActiveTrue(academicYear)
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "Active rubric not found for academic year: " + academicYear));
        } else {
            List<Rubric> activeRubrics = rubricRepository.findByIsActiveTrue();
            if (activeRubrics.isEmpty()) {
                throw new ResourceNotFoundException("No active rubric found");
            }
            rubric = activeRubrics.get(0);
        }
        return RubricMapper.toDTO(rubric);
    }
    
    /**
     * Create new rubric
     */
    public RubricDTO createRubric(String name, String description, 
                                  Double maxScore, String academicYear) {
        Rubric rubric = new Rubric(name, description, maxScore, academicYear);
        rubric.setIsActive(false); // Default to inactive
        
        Rubric saved = rubricRepository.save(rubric);
        return RubricMapper.toDTO(saved);
    }
    
    /**
     * Update rubric
     */
    public RubricDTO updateRubric(Long id, String name, String description, 
                                  Double maxScore, String academicYear) {
        Rubric rubric = rubricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rubric", "id", id));
        
        if (name != null) rubric.setName(name);
        if (description != null) rubric.setDescription(description);
        if (maxScore != null) rubric.setMaxPoints(maxScore);
        if (academicYear != null) rubric.setAcademicYear(academicYear);
        
        Rubric updated = rubricRepository.save(rubric);
        return RubricMapper.toDTO(updated);
    }
    
    /**
     * Activate rubric (deactivate others in same academic year)
     */
    public RubricDTO activateRubric(Long id) {
        Rubric rubric = rubricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rubric", "id", id));
        
        // Deactivate other rubrics in the same academic year
        List<Rubric> sameYearRubrics = rubricRepository.findByAcademicYear(rubric.getAcademicYear());
        for (Rubric r : sameYearRubrics) {
            if (!r.getId().equals(id) && r.getIsActive()) {
                r.setIsActive(false);
                rubricRepository.save(r);
            }
        }
        
        rubric.setIsActive(true);
        Rubric updated = rubricRepository.save(rubric);
        return RubricMapper.toDTOWithoutCriteria(updated);
    }
    
    /**
     * Deactivate rubric
     */
    public RubricDTO deactivateRubric(Long id) {
        Rubric rubric = rubricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rubric", "id", id));
        
        rubric.setIsActive(false);
        Rubric updated = rubricRepository.save(rubric);
        return RubricMapper.toDTOWithoutCriteria(updated);
    }
}

