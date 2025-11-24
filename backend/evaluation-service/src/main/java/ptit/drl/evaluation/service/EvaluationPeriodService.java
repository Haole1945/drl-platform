package ptit.drl.evaluation.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptit.drl.evaluation.entity.EvaluationPeriod;
import ptit.drl.evaluation.exception.ResourceNotFoundException;
import ptit.drl.evaluation.repository.EvaluationPeriodRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing evaluation periods
 */
@Service
@Transactional
public class EvaluationPeriodService {
    
    @Autowired
    private EvaluationPeriodRepository periodRepository;
    
    @Autowired(required = false)
    private NotificationService notificationService;
    
    /**
     * Get currently open evaluation period
     */
    @Transactional(readOnly = true)
    public Optional<EvaluationPeriod> getOpenPeriod() {
        return periodRepository.findOpenPeriod(LocalDate.now());
    }
    
    /**
     * Check if there is an open evaluation period
     */
    @Transactional(readOnly = true)
    public boolean isSubmissionOpen() {
        return getOpenPeriod().isPresent();
    }
    
    /**
     * Check if submission is open for a specific semester
     */
    @Transactional(readOnly = true)
    public boolean isSubmissionOpenForSemester(String semester) {
        Optional<EvaluationPeriod> period = periodRepository.findActivePeriodBySemester(semester);
        return period.isPresent() && period.get().isOpen();
    }
    
    /**
     * Get active period for semester
     */
    @Transactional(readOnly = true)
    public Optional<EvaluationPeriod> getActivePeriodForSemester(String semester) {
        return periodRepository.findActivePeriodBySemester(semester);
    }
    
    /**
     * Get all active periods
     */
    @Transactional(readOnly = true)
    public List<EvaluationPeriod> getAllActivePeriods() {
        return periodRepository.findByIsActiveTrue();
    }
    
    /**
     * Get all periods (both active and inactive)
     */
    @Transactional(readOnly = true)
    public List<EvaluationPeriod> getAllPeriods() {
        return periodRepository.findAll();
    }
    
    /**
     * Get period by ID
     */
    @Transactional(readOnly = true)
    public EvaluationPeriod getPeriodById(Long id) {
        return periodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EvaluationPeriod", "id", id));
    }
    
    /**
     * Create new evaluation period
     */
    public EvaluationPeriod createPeriod(EvaluationPeriod period) {
        EvaluationPeriod saved = periodRepository.save(period);
        
        // Create notifications for all users
        if (notificationService != null) {
            notificationService.notifyPeriodCreated(
                saved.getId(),
                saved.getName(),
                saved.getSemester(),
                saved.getStartDate(),
                saved.getEndDate()
            );
        }
        
        return saved;
    }
    
    /**
     * Update evaluation period
     */
    public EvaluationPeriod updatePeriod(Long id, EvaluationPeriod updatedPeriod) {
        EvaluationPeriod period = getPeriodById(id);
        period.setName(updatedPeriod.getName());
        period.setSemester(updatedPeriod.getSemester());
        period.setAcademicYear(updatedPeriod.getAcademicYear());
        period.setStartDate(updatedPeriod.getStartDate());
        period.setEndDate(updatedPeriod.getEndDate());
        period.setIsActive(updatedPeriod.getIsActive());
        period.setDescription(updatedPeriod.getDescription());
        period.setRubric(updatedPeriod.getRubric());
        period.setTargetClasses(updatedPeriod.getTargetClasses());
        return periodRepository.save(period);
    }
    
    /**
     * Deactivate period
     */
    public EvaluationPeriod deactivatePeriod(Long id) {
        EvaluationPeriod period = getPeriodById(id);
        period.setIsActive(false);
        return periodRepository.save(period);
    }
    
    /**
     * Get periods by academic year
     */
    @Transactional(readOnly = true)
    public List<EvaluationPeriod> getPeriodsByAcademicYear(String academicYear) {
        return periodRepository.findByAcademicYear(academicYear);
    }
    
    /**
     * Get periods by semester
     */
    @Transactional(readOnly = true)
    public List<EvaluationPeriod> getPeriodsBySemester(String semester) {
        return periodRepository.findBySemester(semester);
    }
    
    /**
     * Get open period for specific class code
     * Filters by targetClasses to find matching period
     */
    @Transactional(readOnly = true)
    public Optional<EvaluationPeriod> getOpenPeriodForClass(String classCode) {
        Optional<EvaluationPeriod> openPeriod = getOpenPeriod();
        
        if (openPeriod.isEmpty()) {
            return Optional.empty();
        }
        
        EvaluationPeriod period = openPeriod.get();
        
        // If no target specified, period applies to all
        if (period.getTargetClasses() == null || period.getTargetClasses().isEmpty()) {
            return openPeriod;
        }
        
        // Check if classCode matches target
        if (matchesTarget(classCode, period.getTargetClasses())) {
            return openPeriod;
        }
        
        return Optional.empty();
    }
    
    /**
     * Check if classCode matches target specification
     * Supports FACULTY:, MAJOR:, CLASS: prefixes
     */
    private boolean matchesTarget(String classCode, String targetClasses) {
        if (targetClasses == null || targetClasses.isEmpty()) {
            return true;
        }
        
        String target = targetClasses.trim();
        
        // FACULTY: prefix
        if (target.startsWith("FACULTY:")) {
            String facultyCodes = target.substring(8).trim();
            if (facultyCodes.isEmpty()) return true;
            
            String[] faculties = facultyCodes.split(",");
            for (String faculty : faculties) {
                if (classCode.toUpperCase().contains(faculty.trim().toUpperCase())) {
                    return true;
                }
            }
            return false;
        }
        
        // MAJOR: prefix
        if (target.startsWith("MAJOR:")) {
            String majorCodes = target.substring(6).trim();
            if (majorCodes.isEmpty()) return true;
            
            String[] majors = majorCodes.split(",");
            for (String major : majors) {
                if (classCode.toUpperCase().contains(major.trim().toUpperCase())) {
                    return true;
                }
            }
            return false;
        }
        
        // CLASS: prefix or legacy format
        String classCodes = target.startsWith("CLASS:") 
            ? target.substring(6).trim() 
            : target;
        
        if (classCodes.isEmpty()) return true;
        
        String[] classes = classCodes.split(",");
        for (String targetClass : classes) {
            if (targetClass.trim().equalsIgnoreCase(classCode.trim())) {
                return true;
            }
        }
        
        return false;
    }
}

