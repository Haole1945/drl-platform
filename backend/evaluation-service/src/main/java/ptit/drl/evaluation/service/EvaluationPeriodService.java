package ptit.drl.evaluation.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptit.drl.evaluation.entity.EvaluationPeriod;
import ptit.drl.evaluation.exception.ResourceNotFoundException;
import ptit.drl.evaluation.exception.DuplicateResourceException;
import ptit.drl.evaluation.repository.EvaluationPeriodRepository;
import ptit.drl.evaluation.util.TargetMatcher;

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
     * If multiple periods are open, returns the most recent one (by start date)
     */
    @Transactional(readOnly = true)
    public Optional<EvaluationPeriod> getOpenPeriod() {
        List<EvaluationPeriod> openPeriods = periodRepository.findOpenPeriods(LocalDate.now());
        if (openPeriods.isEmpty()) {
            return Optional.empty();
        }
        // Return the most recent period (first in list due to ORDER BY startDate DESC)
        return Optional.of(openPeriods.get(0));
    }
    
    /**
     * Get all currently open evaluation periods
     */
    @Transactional(readOnly = true)
    public List<EvaluationPeriod> getAllOpenPeriods() {
        return periodRepository.findOpenPeriods(LocalDate.now());
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
     * Validates that the period doesn't overlap with existing active periods (both time and target scope)
     */
    public EvaluationPeriod createPeriod(EvaluationPeriod period) {
        // Validate no overlapping periods (check both time and target scope)
        validateNoOverlap(period.getStartDate(), period.getEndDate(), period.getTargetClasses(), null);
        
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
     * Validates that the updated period doesn't overlap with other active periods (both time and target scope)
     */
    public EvaluationPeriod updatePeriod(Long id, EvaluationPeriod updatedPeriod) {
        EvaluationPeriod period = getPeriodById(id);
        
        // Validate no overlapping periods (exclude current period, check both time and target scope)
        if (updatedPeriod.getIsActive()) {
            validateNoOverlap(updatedPeriod.getStartDate(), updatedPeriod.getEndDate(), 
                updatedPeriod.getTargetClasses(), id);
        }
        
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
     * If multiple periods match, returns the most recent one
     */
    @Transactional(readOnly = true)
    public Optional<EvaluationPeriod> getOpenPeriodForClass(String classCode) {
        List<EvaluationPeriod> openPeriods = periodRepository.findOpenPeriods(LocalDate.now());
        
        if (openPeriods.isEmpty()) {
            return Optional.empty();
        }
        
        // Filter periods that match the class code
        for (EvaluationPeriod period : openPeriods) {
            // If no target specified, period applies to all
            if (period.getTargetClasses() == null || period.getTargetClasses().isEmpty()) {
                return Optional.of(period); // Return first matching period (most recent)
            }
            
            // Check if classCode matches target
            if (TargetMatcher.matches(classCode, period.getTargetClasses())) {
                return Optional.of(period); // Return first matching period (most recent)
            }
        }
        
        return Optional.empty();
    }
    
    
    /**
     * Validate that no active periods overlap with the given date range AND target scope
     * Two periods overlap if:
     * 1. Time overlap: start1 <= end2 AND end1 >= start2
     * 2. Target scope overlap: They apply to the same classes/faculties/majors/cohorts
     * 
     * @param startDate Start date of the period to validate
     * @param endDate End date of the period to validate
     * @param targetClasses Target classes/faculties/majors/cohorts of the period to validate
     * @param excludeId ID of period to exclude from check (for update operations)
     * @throws DuplicateResourceException if overlapping periods are found
     */
    @Transactional(readOnly = true)
    private void validateNoOverlap(LocalDate startDate, LocalDate endDate, String targetClasses, Long excludeId) {
        List<EvaluationPeriod> overlappingPeriods = periodRepository.findOverlappingPeriods(
            startDate, endDate, excludeId);
        
        // Filter periods that also have overlapping target scope
        for (EvaluationPeriod existingPeriod : overlappingPeriods) {
            if (TargetMatcher.hasOverlap(targetClasses, existingPeriod.getTargetClasses())) {
                throw new DuplicateResourceException(
                    String.format("Đợt đánh giá này trùng thời gian và phạm vi áp dụng với đợt đánh giá khác: '%s' (từ %s đến %s, phạm vi: %s). " +
                        "Vui lòng chọn khoảng thời gian khác, phạm vi áp dụng khác, hoặc vô hiệu hóa đợt đánh giá trùng lặp.",
                        existingPeriod.getName(),
                        existingPeriod.getStartDate(),
                        existingPeriod.getEndDate(),
                        existingPeriod.getTargetClasses() != null ? existingPeriod.getTargetClasses() : "Tất cả")
                );
            }
        }
    }
    
}

