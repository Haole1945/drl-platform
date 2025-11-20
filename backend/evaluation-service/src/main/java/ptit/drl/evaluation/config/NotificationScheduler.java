package ptit.drl.evaluation.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import ptit.drl.evaluation.entity.EvaluationPeriod;
import ptit.drl.evaluation.repository.EvaluationPeriodRepository;
import ptit.drl.evaluation.service.NotificationService;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled tasks for notification management
 */
@Component
public class NotificationScheduler {
    
    @Autowired
    private EvaluationPeriodRepository periodRepository;
    
    @Autowired(required = false)
    private NotificationService notificationService;
    
    /**
     * Check for evaluation periods ending soon and send reminder notifications
     * Runs daily at 8:00 AM
     */
    @Scheduled(cron = "0 0 8 * * ?") // Every day at 8:00 AM
    public void checkPeriodDeadlines() {
        if (notificationService == null) {
            return;
        }
        
        LocalDate today = LocalDate.now();
        LocalDate threeDaysFromNow = today.plusDays(3);
        LocalDate sevenDaysFromNow = today.plusDays(7);
        
        // Get all active periods
        List<EvaluationPeriod> activePeriods = periodRepository.findByIsActiveTrue();
        
        for (EvaluationPeriod period : activePeriods) {
            LocalDate endDate = period.getEndDate();
            
            // Check if period ends in 3 days
            if (endDate.equals(threeDaysFromNow)) {
                notificationService.notifyPeriodReminder(
                    period.getId(),
                    period.getName(),
                    period.getSemester(),
                    endDate,
                    3
                );
            }
            
            // Check if period ends in 7 days
            if (endDate.equals(sevenDaysFromNow)) {
                notificationService.notifyPeriodReminder(
                    period.getId(),
                    period.getName(),
                    period.getSemester(),
                    endDate,
                    7
                );
            }
        }
    }
}

