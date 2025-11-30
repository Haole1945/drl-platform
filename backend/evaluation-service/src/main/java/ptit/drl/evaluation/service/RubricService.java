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
        System.out.println("🔍 SERVICE - getActiveRubric called");
        System.out.println("🔍 SERVICE - academicYear: " + academicYear);
        System.out.println("🔍 SERVICE - classCode: " + classCode);
        
        List<Rubric> activeRubrics;
        
        if (academicYear != null) {
            activeRubrics = rubricRepository.findByAcademicYearAndIsActiveTrue(academicYear)
                    .map(List::of)
                    .orElse(rubricRepository.findByIsActiveTrue());
        } else {
            activeRubrics = rubricRepository.findByIsActiveTrue();
        }
        
        System.out.println("🔍 SERVICE - Found " + activeRubrics.size() + " active rubrics");
        
        if (activeRubrics.isEmpty()) {
            throw new ResourceNotFoundException("No active rubric found");
        }
        
        // Filter by classCode if provided
        if (classCode != null && !classCode.isEmpty()) {
            System.out.println("🔍 SERVICE - Filtering by classCode: " + classCode);
            for (Rubric rubric : activeRubrics) {
                System.out.println("🔍 SERVICE - Checking rubric: " + rubric.getName());
                System.out.println("🔍 SERVICE - Rubric targetClasses: " + rubric.getTargetClasses());
                
                // If targetClasses is null or empty, rubric applies to all classes
                if (rubric.getTargetClasses() == null || rubric.getTargetClasses().isEmpty()) {
                    System.out.println("✅ SERVICE - Rubric applies to all classes, returning it");
                    return RubricMapper.toDTO(rubric);
                }
                
                // Check if student matches rubric target
                if (matchesRubricTarget(classCode, rubric.getTargetClasses())) {
                    System.out.println("✅ SERVICE - Match found! Returning rubric");
                    return RubricMapper.toDTO(rubric);
                }
            }
            
            // No rubric found for this class
            System.out.println("❌ SERVICE - No rubric found for class: " + classCode);
            throw new ResourceNotFoundException(
                "No active rubric found for class: " + classCode);
        }
        
        // No classCode provided, return first active rubric
        System.out.println("✅ SERVICE - No classCode filter, returning first active rubric");
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
        System.out.println("🔍 SERVICE - updateRubric called");
        System.out.println("🔍 SERVICE - Received isActive: " + isActive);
        System.out.println("🔍 SERVICE - Received targetClasses: " + targetClasses);
        
        Rubric rubric = rubricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rubric", "id", id));
        
        System.out.println("🔍 SERVICE - Before update - rubric.isActive: " + rubric.getIsActive());
        
        if (name != null) rubric.setName(name);
        if (description != null) rubric.setDescription(description);
        if (maxScore != null) rubric.setMaxPoints(maxScore);
        if (academicYear != null) rubric.setAcademicYear(academicYear);
        if (isActive != null) {
            System.out.println("🔍 SERVICE - Setting isActive to: " + isActive);
            rubric.setIsActive(isActive);
        }
        if (targetClasses != null) {
            System.out.println("🔍 SERVICE - Setting targetClasses to: " + targetClasses);
            rubric.setTargetClasses(targetClasses);
        }
        
        System.out.println("🔍 SERVICE - After update - rubric.isActive: " + rubric.getIsActive());
        
        Rubric updated = rubricRepository.save(rubric);
        
        System.out.println("🔍 SERVICE - After save - updated.isActive: " + updated.getIsActive());
        System.out.println("🔍 SERVICE - After save - updated.targetClasses: " + updated.getTargetClasses());
        
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
                System.err.println("Failed to create rubric activation notification: " + e.getMessage());
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
    
    /**
     * Check if student's classCode matches rubric target
     * Supports:
     * - FACULTY:CNTT,DIEN_TU (match by faculty code)
     * - MAJOR:DCCN,HTTT (match by major code)
     * - CLASS:D21CQCN01-N,D22CQCN02-N (match by class code)
     * - D21CQCN01-N,D22CQCN02-N (legacy format, match by class code)
     */
    private boolean matchesRubricTarget(String classCode, String targetClasses) {
        if (targetClasses == null || targetClasses.isEmpty()) {
            return true; // Applies to all
        }
        
        String target = targetClasses.trim();
        
        // FACULTY: prefix - match by faculty code
        if (target.startsWith("FACULTY:")) {
            String facultyCodes = target.substring(8).trim();
            if (facultyCodes.isEmpty()) {
                return true; // All faculties
            }
            
            // Extract faculty code from classCode (e.g., D21CQCN01-N -> CNTT based on major DCCN)
            // This requires mapping major to faculty, for now we'll do simple matching
            String[] faculties = facultyCodes.split(",");
            for (String faculty : faculties) {
                // Simple heuristic: if classCode contains faculty code pattern
                if (classCode.toUpperCase().contains(faculty.trim().toUpperCase())) {
                    return true;
                }
            }
            return false;
        }
        
        // MAJOR: prefix - match by major code
        if (target.startsWith("MAJOR:")) {
            String majorCodes = target.substring(6).trim();
            if (majorCodes.isEmpty()) {
                return true; // All majors
            }
            
            // Extract major code from classCode (e.g., D21CQCN01-N -> CQCN or DCCN)
            String[] majors = majorCodes.split(",");
            for (String major : majors) {
                String majorUpper = major.trim().toUpperCase();
                // Check if classCode contains the major code
                if (classCode.toUpperCase().contains(majorUpper)) {
                    return true;
                }
            }
            return false;
        }
        
        // CLASS: prefix or legacy format - match by exact class code
        String classCodes = target.startsWith("CLASS:") 
            ? target.substring(6).trim() 
            : target;
        
        if (classCodes.isEmpty()) {
            return true; // All classes
        }
        
        String[] classes = classCodes.split(",");
        for (String targetClass : classes) {
            if (targetClass.trim().equalsIgnoreCase(classCode.trim())) {
                return true;
            }
        }
        
        return false;
    }
}

