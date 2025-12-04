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
import ptit.drl.evaluation.util.TargetMatcher;

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
    
    @Autowired(required = false)
    private NotificationService notificationService;
    
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
     * Get active rubric for academic year and class
     */
    public RubricDTO getActiveRubric(String academicYear, String classCode) {
        List<Rubric> activeRubrics;
        
        if (academicYear != null) {
            activeRubrics = rubricRepository.findByAcademicYearAndIsActiveTrue(academicYear)
                    .map(List::of)
                    .orElse(rubricRepository.findByIsActiveTrue());
        } else {
            activeRubrics = rubricRepository.findByIsActiveTrue();
        }
        
        if (activeRubrics.isEmpty()) {
            throw new ResourceNotFoundException("No active rubric found");
        }
        
        // Filter by classCode if provided
        if (classCode != null && !classCode.isEmpty()) {
            for (Rubric rubric : activeRubrics) {
                // If targetClasses is null or empty, rubric applies to all classes
                if (rubric.getTargetClasses() == null || rubric.getTargetClasses().isEmpty()) {
                    return RubricMapper.toDTO(rubric);
                }
                
                // Check if student matches rubric target
                if (TargetMatcher.matches(classCode, rubric.getTargetClasses())) {
                    return RubricMapper.toDTO(rubric);
                }
            }
            
            // No rubric found for this class
            throw new ResourceNotFoundException(
                "No active rubric found for class: " + classCode);
        }
        
        // No classCode provided, return first active rubric
        return RubricMapper.toDTO(activeRubrics.get(0));
    }
    
    /**
     * Create new rubric
     */
    public RubricDTO createRubric(String name, String description, 
                                  Double maxScore, String academicYear,
                                  Boolean isActive, String targetClasses) {
        Rubric rubric = new Rubric(name, description, maxScore, academicYear);
        rubric.setIsActive(isActive != null ? isActive : true); // Default to active
        rubric.setTargetClasses(targetClasses);
        
        Rubric saved = rubricRepository.save(rubric);
        return RubricMapper.toDTO(saved);
    }
    
    /**
     * Update rubric
     */
    public RubricDTO updateRubric(Long id, String name, String description, 
                                  Double maxScore, String academicYear,
                                  Boolean isActive, String targetClasses) {
        Rubric rubric = rubricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rubric", "id", id));
        
        if (name != null) rubric.setName(name);
        if (description != null) rubric.setDescription(description);
        if (maxScore != null) rubric.setMaxPoints(maxScore);
        if (academicYear != null) rubric.setAcademicYear(academicYear);
        if (isActive != null) {
            rubric.setIsActive(isActive);
        }
        if (targetClasses != null) {
            rubric.setTargetClasses(targetClasses);
        }
        
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
        
        // Send notification to all users
        if (notificationService != null) {
            try {
                notificationService.notifyRubricActivated(
                    updated.getId(),
                    updated.getName(),
                    updated.getTargetClasses()
                );
            } catch (Exception e) {
                // Failed to create rubric activation notification - continue
            }
        }
        
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

