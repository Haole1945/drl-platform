package ptit.drl.evaluation.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ptit.drl.evaluation.entity.Notification;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    /**
     * Get all notifications for a user, ordered by created date (newest first)
     */
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    /**
     * Get unread notifications for a user
     */
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    
    /**
     * Count unread notifications for a user
     */
    long countByUserIdAndIsReadFalse(Long userId);
    
    /**
     * Mark all notifications as read for a user
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.userId = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);
    
    /**
     * Mark a notification as read
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id = :id AND n.userId = :userId")
    int markAsRead(@Param("id") Long id, @Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);
    
    /**
     * Delete old read notifications (older than specified days)
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.isRead = true AND n.readAt < :beforeDate")
    int deleteOldReadNotifications(@Param("beforeDate") LocalDateTime beforeDate);
    
    /**
     * Find notifications by type and related entity
     */
    List<Notification> findByTypeAndRelatedTypeAndRelatedId(
        Notification.NotificationType type, 
        String relatedType, 
        Long relatedId
    );
    
    /**
     * Find notifications by user, type, related type and related ID
     */
    List<Notification> findByUserIdAndTypeAndRelatedTypeAndRelatedId(
        Long userId,
        Notification.NotificationType type,
        String relatedType,
        Long relatedId
    );
}

