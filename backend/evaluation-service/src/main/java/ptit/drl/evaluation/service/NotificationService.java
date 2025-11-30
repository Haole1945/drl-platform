package ptit.drl.evaluation.service;

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
            // If Feign client is not available, skip notification creation
            return;
        }
        
        try {
            // Get all active user IDs from auth-service
            AuthServiceClient.UserIdsResponse response = authServiceClient.getAllUserIds();
            if (response != null && response.isSuccess() && response.getData() != null) {
                List<Long> userIds = response.getData();
                
                String title = "Đợt đánh giá điểm rèn luyện mới: " + periodName;
                String message = String.format(
                    "Đợt đánh giá điểm rèn luyện cho học kỳ %s đã được tạo. " +
                    "Thời gian nộp: từ %s đến %s. Vui lòng hoàn thành đánh giá trước hạn.",
                    semester,
                    startDate.toString(),
                    endDate.toString()
                );
                
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
                    }
                }
            }
        } catch (Exception e) {
            // Log error but don't fail the period creation
            System.err.println("Failed to create notifications for period: " + e.getMessage());
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
            System.err.println("Failed to create reminder notifications: " + e.getMessage());
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
     * Sends to: CLASS_MONITOR, UNION_REPRESENTATIVE, ADVISOR (for class level)
     *           FACULTY_INSTRUCTOR (for faculty level)
     *           CTSV_STAFF (for CTSV level)
     */
    public void notifyEvaluationNeedsReview(Long evaluationId, String studentName, String studentCode, 
                                           String classCode, String facultyCode, String currentStatus) {
        if (authServiceClient == null) return;
        
        try {
            List<Long> reviewerIds = new java.util.ArrayList<>();
            
            // Determine which reviewers to notify based on current status
            if ("SUBMITTED".equals(currentStatus)) {
                // Class level reviewers
                // Get CLASS_MONITOR, UNION_REPRESENTATIVE, ADVISOR for this class
                try {
                    AuthServiceClient.UserIdsResponse monitorResponse = 
                        authServiceClient.getUserIdsByRoleAndClassCode("CLASS_MONITOR", classCode);
                    if (monitorResponse != null && monitorResponse.isSuccess() && monitorResponse.getData() != null) {
                        reviewerIds.addAll(monitorResponse.getData());
                    }
                } catch (Exception e) {
                    System.err.println("Failed to get CLASS_MONITOR IDs: " + e.getMessage());
                }
                
                try {
                    AuthServiceClient.UserIdsResponse unionResponse = 
                        authServiceClient.getUserIdsByRoleAndClassCode("UNION_REPRESENTATIVE", classCode);
                    if (unionResponse != null && unionResponse.isSuccess() && unionResponse.getData() != null) {
                        reviewerIds.addAll(unionResponse.getData());
                    }
                } catch (Exception e) {
                    System.err.println("Failed to get UNION_REPRESENTATIVE IDs: " + e.getMessage());
                }
                
                try {
                    AuthServiceClient.UserIdsResponse advisorResponse = 
                        authServiceClient.getUserIdsByRoleAndClassCode("ADVISOR", classCode);
                    if (advisorResponse != null && advisorResponse.isSuccess() && advisorResponse.getData() != null) {
                        reviewerIds.addAll(advisorResponse.getData());
                    }
                } catch (Exception e) {
                    System.err.println("Failed to get ADVISOR IDs: " + e.getMessage());
                }
            } else if ("CLASS_APPROVED".equals(currentStatus)) {
                // Faculty level reviewers
                try {
                    AuthServiceClient.UserIdsResponse facultyResponse = 
                        authServiceClient.getUserIdsByRole("FACULTY_INSTRUCTOR");
                    if (facultyResponse != null && facultyResponse.isSuccess() && facultyResponse.getData() != null) {
                        reviewerIds.addAll(facultyResponse.getData());
                    }
                } catch (Exception e) {
                    System.err.println("Failed to get FACULTY_INSTRUCTOR IDs: " + e.getMessage());
                }
            } else if ("FACULTY_APPROVED".equals(currentStatus)) {
                // CTSV level reviewers
                try {
                    AuthServiceClient.UserIdsResponse ctsvResponse = 
                        authServiceClient.getUserIdsByRole("CTSV_STAFF");
                    if (ctsvResponse != null && ctsvResponse.isSuccess() && ctsvResponse.getData() != null) {
                        reviewerIds.addAll(ctsvResponse.getData());
                    }
                } catch (Exception e) {
                    System.err.println("Failed to get CTSV_STAFF IDs: " + e.getMessage());
                }
            }
            
            // Remove duplicates
            reviewerIds = reviewerIds.stream().distinct().collect(Collectors.toList());
            
            String title = "Có đánh giá mới cần duyệt";
            String message = String.format(
                "Sinh viên %s (%s) - Lớp %s đã nộp đánh giá. Vui lòng xem xét và duyệt.",
                studentName, studentCode, classCode != null ? classCode : "N/A"
            );
            
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
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to create evaluation needs review notifications: " + e.getMessage());
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
            if ("FACULTY".equals(nextLevel)) {
                AuthServiceClient.UserIdsResponse response = 
                    authServiceClient.getUserIdsByRole("FACULTY_INSTRUCTOR");
                if (response != null && response.isSuccess() && response.getData() != null) {
                    reviewerIds.addAll(response.getData());
                }
            } else if ("CTSV".equals(nextLevel)) {
                AuthServiceClient.UserIdsResponse response = 
                    authServiceClient.getUserIdsByRole("CTSV_STAFF");
                if (response != null && response.isSuccess() && response.getData() != null) {
                    reviewerIds.addAll(response.getData());
                }
            }
            
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
            System.err.println("Failed to create escalation notifications: " + e.getMessage());
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
            System.err.println("Failed to create rubric activation notifications: " + e.getMessage());
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
            System.err.println("Failed to create rubric update notifications: " + e.getMessage());
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

