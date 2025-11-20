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

