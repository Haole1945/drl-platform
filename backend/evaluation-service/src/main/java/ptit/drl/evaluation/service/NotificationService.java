package ptit.drl.evaluation.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptit.drl.evaluation.client.AuthServiceClient;
import ptit.drl.evaluation.dto.NotificationDTO;
import ptit.drl.evaluation.entity.Notification;
import ptit.drl.evaluation.repository.NotificationRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing notifications
 */
@Service
@Transactional
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired(required = false)
    private AuthServiceClient authServiceClient;
    
    /**
     * Create a new notification
     */
    public Notification createNotification(Long userId, String title, String message, 
                                         Notification.NotificationType type) {
        Notification notification = new Notification(userId, title, message, type);
        return notificationRepository.save(notification);
    }
    
    /**
     * Create a notification with related entity
     */
    public Notification createNotification(Long userId, String title, String message,
                                         Notification.NotificationType type, 
                                         String relatedType, Long relatedId) {
        Notification notification = new Notification(userId, title, message, type);
        notification.setRelatedType(relatedType);
        notification.setRelatedId(relatedId);
        return notificationRepository.save(notification);
    }
    
    /**
     * Get notifications for a user with pagination
     */
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getUserNotifications(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return notifications.map(this::toDTO);
    }
    
    /**
     * Get unread notifications for a user
     */
    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        return notifications.stream().map(this::toDTO).collect(Collectors.toList());
    }
    
    /**
     * Count unread notifications for a user
     */
    @Transactional(readOnly = true)
    public long countUnreadNotifications(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
    
    /**
     * Mark a notification as read
     */
    public void markAsRead(Long notificationId, Long userId) {
        LocalDateTime now = LocalDateTime.now();
        int updated = notificationRepository.markAsRead(notificationId, userId, now);
        if (updated == 0) {
            throw new RuntimeException("Notification not found or already read");
        }
    }
    
    /**
     * Mark all notifications as read for a user
     */
    public void markAllAsRead(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        notificationRepository.markAllAsRead(userId, now);
    }
    
    /**
     * Delete old read notifications (older than 30 days)
     */
    public void deleteOldNotifications(int daysToKeep) {
        LocalDateTime beforeDate = LocalDateTime.now().minusDays(daysToKeep);
        notificationRepository.deleteOldReadNotifications(beforeDate);
    }
    
    /**
     * Create notification for all active users when a new evaluation period is created
     */
    public void notifyPeriodCreated(Long periodId, String periodName, String semester, LocalDate startDate, LocalDate endDate) {
        if (authServiceClient == null) {
            logger.warn("AuthServiceClient is not available, skipping notification creation for period: {}", periodId);
            return;
        }
        
        try {
            // Get all active user IDs from auth-service
            AuthServiceClient.UserIdsResponse response = authServiceClient.getAllUserIds();
            if (response != null && response.isSuccess() && response.getData() != null) {
                List<Long> userIds = response.getData();
                logger.info("Creating PERIOD_CREATED notifications for {} users, period: {}", userIds.size(), periodId);
                
                String title = "Đợt đánh giá điểm rèn luyện mới: " + periodName;
                String message = String.format(
                    "Đợt đánh giá điểm rèn luyện cho học kỳ %s đã được tạo. " +
                    "Thời gian nộp: từ %s đến %s. Vui lòng hoàn thành đánh giá trước hạn.",
                    semester,
                    startDate.toString(),
                    endDate.toString()
                );
                
                int createdCount = 0;
                // Create notification for each user
                for (Long userId : userIds) {
                    // Check if notification already exists for this specific user to avoid duplicates
                    List<Notification> existing = notificationRepository.findByUserIdAndTypeAndRelatedTypeAndRelatedId(
                        userId,
                        Notification.NotificationType.PERIOD_CREATED,
                        "EVALUATION_PERIOD",
                        periodId
                    );
                    
                    if (existing.isEmpty()) {
                        createNotification(
                            userId,
                            title,
                            message,
                            Notification.NotificationType.PERIOD_CREATED,
                            "EVALUATION_PERIOD",
                            periodId
                        );
                        createdCount++;
                    }
                }
                logger.info("Created {} PERIOD_CREATED notifications for period: {}", createdCount, periodId);
            } else {
                logger.warn("Failed to get user IDs from auth-service for period notification: {}", periodId);
            }
        } catch (Exception e) {
            logger.error("Failed to create notifications for period: {}, error: {}", periodId, e.getMessage(), e);
        }
    }
    
    /**
     * Create reminder notifications for users when evaluation period is about to end
     */
    public void notifyPeriodReminder(Long periodId, String periodName, String semester, LocalDate endDate, int daysBeforeEnd) {
        if (authServiceClient == null) {
            return;
        }
        
        try {
            AuthServiceClient.UserIdsResponse response = authServiceClient.getAllUserIds();
            if (response != null && response.isSuccess() && response.getData() != null) {
                List<Long> userIds = response.getData();
                
                String title = String.format("Nhắc nhở: Đợt đánh giá sắp kết thúc (%d ngày)", daysBeforeEnd);
                String message = String.format(
                    "Đợt đánh giá điểm rèn luyện cho học kỳ %s sẽ kết thúc vào %s. " +
                    "Còn %d ngày nữa. Vui lòng hoàn thành đánh giá trước hạn.",
                    semester,
                    endDate.toString(),
                    daysBeforeEnd
                );
                
                // Create notification for each user (only if not already exists)
                for (Long userId : userIds) {
                    // Check if reminder notification already exists for this user and period
                    List<Notification> existing = notificationRepository.findByUserIdAndTypeAndRelatedTypeAndRelatedId(
                        userId,
                        Notification.NotificationType.PERIOD_REMINDER,
                        "EVALUATION_PERIOD",
                        periodId
                    );
                    
                    if (existing.isEmpty()) {
                        createNotification(
                            userId,
                            title,
                            message,
                            Notification.NotificationType.PERIOD_REMINDER,
                            "EVALUATION_PERIOD",
                            periodId
                        );
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to create reminder notifications for period: {}, error: {}", periodId, e.getMessage(), e);
        }
    }
    
    /**
     * Check if notification already exists for a related entity
     */
    @Transactional(readOnly = true)
    public boolean notificationExists(Notification.NotificationType type, String relatedType, Long relatedId) {
        List<Notification> existing = notificationRepository.findByTypeAndRelatedTypeAndRelatedId(
            type, relatedType, relatedId);
        return !existing.isEmpty();
    }
    
    /**
     * Notify reviewers when evaluation needs review
     * Sends to: CLASS_MONITOR, ADVISOR (for class level)
     *           FACULTY_INSTRUCTOR (for faculty level)
     *           (FACULTY is now final level)
     */
    public void notifyEvaluationNeedsReview(Long evaluationId, String studentName, String studentCode, 
                                           String classCode, String facultyCode, String currentStatus) {
        if (authServiceClient == null) {
            logger.warn("AuthServiceClient is not available, skipping notification for evaluation: {}", evaluationId);
            return;
        }
        
        try {
            List<Long> reviewerIds = new java.util.ArrayList<>();
            
            // Determine which reviewers to notify based on current status
            if ("SUBMITTED".equals(currentStatus)) {
                // Class level reviewers
                // Get CLASS_MONITOR, ADVISOR for this class
                try {
                    AuthServiceClient.UserIdsResponse monitorResponse = 
                        authServiceClient.getUserIdsByRoleAndClassCode("CLASS_MONITOR", classCode);
                    if (monitorResponse != null && monitorResponse.isSuccess() && monitorResponse.getData() != null) {
                        reviewerIds.addAll(monitorResponse.getData());
                        logger.debug("Found {} CLASS_MONITOR reviewers for class: {}", monitorResponse.getData().size(), classCode);
                    }
                } catch (Exception e) {
                    logger.warn("Failed to get CLASS_MONITOR IDs for class: {}, error: {}", classCode, e.getMessage());
                }
                
                try {
                    AuthServiceClient.UserIdsResponse advisorResponse = 
                        authServiceClient.getUserIdsByRoleAndClassCode("ADVISOR", classCode);
                    if (advisorResponse != null && advisorResponse.isSuccess() && advisorResponse.getData() != null) {
                        reviewerIds.addAll(advisorResponse.getData());
                        logger.debug("Found {} ADVISOR reviewers for class: {}", advisorResponse.getData().size(), classCode);
                    }
                } catch (Exception e) {
                    logger.warn("Failed to get ADVISOR IDs for class: {}, error: {}", classCode, e.getMessage());
                }
            } else if ("CLASS_APPROVED".equals(currentStatus)) {
                // Advisor level reviewers
                try {
                    AuthServiceClient.UserIdsResponse advisorResponse = 
                        authServiceClient.getUserIdsByRoleAndClassCode("ADVISOR", classCode);
                    if (advisorResponse != null && advisorResponse.isSuccess() && advisorResponse.getData() != null) {
                        reviewerIds.addAll(advisorResponse.getData());
                        logger.debug("Found {} ADVISOR reviewers for class: {}", advisorResponse.getData().size(), classCode);
                    }
                } catch (Exception e) {
                    logger.warn("Failed to get ADVISOR IDs for class: {}, error: {}", classCode, e.getMessage());
                }
            } else if ("ADVISOR_APPROVED".equals(currentStatus)) {
                // Faculty level reviewers
                try {
                    AuthServiceClient.UserIdsResponse facultyResponse = 
                        authServiceClient.getUserIdsByRole("FACULTY_INSTRUCTOR");
                    if (facultyResponse != null && facultyResponse.isSuccess() && facultyResponse.getData() != null) {
                        reviewerIds.addAll(facultyResponse.getData());
                        logger.debug("Found {} FACULTY_INSTRUCTOR reviewers", facultyResponse.getData().size());
                    }
                } catch (Exception e) {
                    logger.warn("Failed to get FACULTY_INSTRUCTOR IDs, error: {}", e.getMessage());
                }
            }
            // Note: FACULTY_APPROVED is now final approval, no need to notify reviewers
            
            // Remove duplicates
            reviewerIds = reviewerIds.stream().distinct().collect(Collectors.toList());
            
            if (reviewerIds.isEmpty()) {
                logger.warn("No reviewers found for evaluation: {}, status: {}, class: {}", evaluationId, currentStatus, classCode);
                return;
            }
            
            logger.info("Creating EVALUATION_NEEDS_REVIEW notifications for {} reviewers, evaluation: {}", reviewerIds.size(), evaluationId);
            
            String title = "Có đánh giá mới cần duyệt";
            String message = String.format(
                "Sinh viên %s (%s) - Lớp %s đã nộp đánh giá. Vui lòng xem xét và duyệt.",
                studentName, studentCode, classCode != null ? classCode : "N/A"
            );
            
            int createdCount = 0;
            // Create notification for each reviewer
            for (Long reviewerId : reviewerIds) {
                // Check if notification already exists
                List<Notification> existing = notificationRepository
                    .findByUserIdAndTypeAndRelatedTypeAndRelatedId(
                        reviewerId,
                        Notification.NotificationType.EVALUATION_NEEDS_REVIEW,
                        "EVALUATION",
                        evaluationId
                    );
                
                if (existing.isEmpty()) {
                    createNotification(
                        reviewerId,
                        title,
                        message,
                        Notification.NotificationType.EVALUATION_NEEDS_REVIEW,
                        "EVALUATION",
                        evaluationId
                    );
                    createdCount++;
                }
            }
            logger.info("Created {} EVALUATION_NEEDS_REVIEW notifications for evaluation: {}", createdCount, evaluationId);
        } catch (Exception e) {
            logger.error("Failed to create evaluation needs review notifications for evaluation: {}, error: {}", evaluationId, e.getMessage(), e);
        }
    }
    
    /**
     * Notify student when evaluation is returned for revision
     */
    public void notifyEvaluationReturned(Long evaluationId, Long studentUserId, String reviewerRole, String comment) {
        String title = "Đánh giá cần chỉnh sửa";
        String message = String.format(
            "%s đã yêu cầu bạn chỉnh sửa đánh giá. Nhận xét: %s. Vui lòng cập nhật và nộp lại.",
            reviewerRole != null ? reviewerRole : "Người duyệt",
            comment != null && !comment.isEmpty() ? comment : "Cần chỉnh sửa"
        );
        
        // Check if notification already exists
        List<Notification> existing = notificationRepository
            .findByUserIdAndTypeAndRelatedTypeAndRelatedId(
                studentUserId,
                Notification.NotificationType.EVALUATION_RETURNED,
                "EVALUATION",
                evaluationId
            );
        
        if (existing.isEmpty()) {
            createNotification(
                studentUserId,
                title,
                message,
                Notification.NotificationType.EVALUATION_RETURNED,
                "EVALUATION",
                evaluationId
            );
        }
    }
    
    /**
     * Notify reviewers when evaluation is escalated to next level
     */
    public void notifyEvaluationEscalated(Long evaluationId, String studentName, String studentCode, 
                                         String nextLevel) {
        if (authServiceClient == null) return;
        
        try {
            List<Long> reviewerIds = new java.util.ArrayList<>();
            
            // Get reviewers for next level
            if ("ADVISOR".equals(nextLevel)) {
                // Get advisor for the student's class
                // Note: StudentServiceClient is not available, so we skip advisor lookup
                // TODO: Implement advisor lookup when StudentServiceClient is available
                // For now, advisors will need to be assigned manually or via other means
                try {
                    // Skip advisor lookup - StudentServiceClient not available
                    // This is a known limitation that needs to be addressed
                } catch (Exception e) {
                    // Failed to get ADVISOR IDs - continue
                }
            } else if ("FACULTY".equals(nextLevel)) {
                AuthServiceClient.UserIdsResponse response = 
                    authServiceClient.getUserIdsByRole("FACULTY_INSTRUCTOR");
                if (response != null && response.isSuccess() && response.getData() != null) {
                    reviewerIds.addAll(response.getData());
                }
            }
            // Note: FACULTY is now final level
            
            String title = "Có đánh giá cần xem xét";
            String message = String.format(
                "Đánh giá của sinh viên %s (%s) đã được chuyển đến bạn. Vui lòng xem xét.",
                studentName, studentCode
            );
            
            for (Long reviewerId : reviewerIds) {
                List<Notification> existing = notificationRepository
                    .findByUserIdAndTypeAndRelatedTypeAndRelatedId(
                        reviewerId,
                        Notification.NotificationType.EVALUATION_ESCALATED,
                        "EVALUATION",
                        evaluationId
                    );
                
                if (existing.isEmpty()) {
                    createNotification(
                        reviewerId,
                        title,
                        message,
                        Notification.NotificationType.EVALUATION_ESCALATED,
                        "EVALUATION",
                        evaluationId
                    );
                }
            }
        } catch (Exception e) {
            logger.error("Failed to create escalation notifications for evaluation: {}, error: {}", evaluationId, e.getMessage(), e);
        }
    }
    
    /**
     * Notify all users when rubric is activated
     */
    public void notifyRubricActivated(Long rubricId, String rubricName, String targetClasses) {
        if (authServiceClient == null) return;
        
        try {
            AuthServiceClient.UserIdsResponse response = authServiceClient.getAllUserIds();
            if (response != null && response.isSuccess() && response.getData() != null) {
                List<Long> userIds = response.getData();
                
                String title = "Rubric mới đã được kích hoạt";
                String message = String.format(
                    "Rubric đánh giá '%s' đã được kích hoạt. Áp dụng cho: %s",
                    rubricName,
                    targetClasses != null && !targetClasses.isEmpty() 
                        ? targetClasses 
                        : "tất cả lớp"
                );
                
                for (Long userId : userIds) {
                    List<Notification> existing = notificationRepository
                        .findByUserIdAndTypeAndRelatedTypeAndRelatedId(
                            userId,
                            Notification.NotificationType.RUBRIC_ACTIVATED,
                            "RUBRIC",
                            rubricId
                        );
                    
                    if (existing.isEmpty()) {
                        createNotification(
                            userId,
                            title,
                            message,
                            Notification.NotificationType.RUBRIC_ACTIVATED,
                            "RUBRIC",
                            rubricId
                        );
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to create rubric activation notifications for rubric: {}, error: {}", rubricId, e.getMessage(), e);
        }
    }
    
    /**
     * Notify all users when rubric is updated
     */
    public void notifyRubricUpdated(Long rubricId, String rubricName, String changes) {
        if (authServiceClient == null) return;
        
        try {
            AuthServiceClient.UserIdsResponse response = authServiceClient.getAllUserIds();
            if (response != null && response.isSuccess() && response.getData() != null) {
                List<Long> userIds = response.getData();
                
                String title = "Rubric đánh giá đã được cập nhật";
                String message = String.format(
                    "Rubric '%s' đã được cập nhật. %s Vui lòng xem lại các tiêu chí mới.",
                    rubricName,
                    changes != null && !changes.isEmpty() ? "Thay đổi: " + changes + ". " : ""
                );
                
                for (Long userId : userIds) {
                    List<Notification> existing = notificationRepository
                        .findByUserIdAndTypeAndRelatedTypeAndRelatedId(
                            userId,
                            Notification.NotificationType.RUBRIC_UPDATED,
                            "RUBRIC",
                            rubricId
                        );
                    
                    if (existing.isEmpty()) {
                        createNotification(
                            userId,
                            title,
                            message,
                            Notification.NotificationType.RUBRIC_UPDATED,
                            "RUBRIC",
                            rubricId
                        );
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to create rubric update notifications for rubric: {}, error: {}", rubricId, e.getMessage(), e);
        }
    }
    
    /**
     * Convert entity to DTO
     */
    private NotificationDTO toDTO(Notification notification) {
        return new NotificationDTO(
            notification.getId(),
            notification.getUserId(),
            notification.getTitle(),
            notification.getMessage(),
            notification.getType(),
            notification.getIsRead(),
            notification.getRelatedId(),
            notification.getRelatedType(),
            notification.getCreatedAt(),
            notification.getReadAt()
        );
    }
}

