package ptit.drl.evaluation.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ptit.drl.evaluation.dto.ApiResponse;
import ptit.drl.evaluation.dto.NotificationDTO;
import ptit.drl.evaluation.service.NotificationService;

/**
 * REST Controller for Notification management
 */
@RestController
@RequestMapping("/notifications")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * GET /notifications - Get notifications for current user with pagination
     * Query params: page (default 0), size (default 20)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationDTO>>> getNotifications(
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        if (userIdStr == null || userIdStr.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User ID is required"));
        }
        
        try {
            Long userId = Long.parseLong(userIdStr);
            Page<NotificationDTO> notifications = notificationService.getUserNotifications(userId, page, size);
            return ResponseEntity.ok(ApiResponse.success("Notifications retrieved", notifications));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid user ID format"));
        }
    }
    
    /**
     * GET /notifications/unread - Get unread notifications for current user
     */
    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<java.util.List<NotificationDTO>>> getUnreadNotifications(
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        
        if (userIdStr == null || userIdStr.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User ID is required"));
        }
        
        try {
            Long userId = Long.parseLong(userIdStr);
            java.util.List<NotificationDTO> notifications = notificationService.getUnreadNotifications(userId);
            return ResponseEntity.ok(ApiResponse.success("Unread notifications retrieved", notifications));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid user ID format"));
        }
    }
    
    /**
     * GET /notifications/unread/count - Get count of unread notifications
     */
    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        
        if (userIdStr == null || userIdStr.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User ID is required"));
        }
        
        try {
            Long userId = Long.parseLong(userIdStr);
            long count = notificationService.countUnreadNotifications(userId);
            return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", count));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid user ID format"));
        }
    }
    
    /**
     * PUT /notifications/{id}/read - Mark a notification as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        
        if (userIdStr == null || userIdStr.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User ID is required"));
        }
        
        try {
            Long userId = Long.parseLong(userIdStr);
            notificationService.markAsRead(id, userId);
            return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid user ID format"));
        }
    }
    
    /**
     * PUT /notifications/read-all - Mark all notifications as read for current user
     */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        
        if (userIdStr == null || userIdStr.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User ID is required"));
        }
        
        try {
            Long userId = Long.parseLong(userIdStr);
            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid user ID format"));
        }
    }
    
    /**
     * POST /notifications/test - Create test notification (for testing UTF-8 encoding)
     * This is a temporary endpoint for testing purposes
     */
    @PostMapping("/test")
    public ResponseEntity<ApiResponse<NotificationDTO>> createTestNotification(
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        
        if (userIdStr == null || userIdStr.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User ID is required"));
        }
        
        try {
            Long userId = Long.parseLong(userIdStr);
            
            // Create test notifications with Vietnamese text
            ptit.drl.evaluation.entity.Notification notif1 = notificationService.createNotification(
                userId,
                "Thông báo test",
                "Đây là thông báo test để kiểm tra hệ thống encoding tiếng Việt UTF-8",
                ptit.drl.evaluation.entity.Notification.NotificationType.PERIOD_CREATED
            );
            
            ptit.drl.evaluation.entity.Notification notif2 = notificationService.createNotification(
                userId,
                "Đánh giá đã được nộp",
                "Đánh giá điểm rèn luyện của bạn (Học kỳ: 2024-2025-HK1) đã được nộp thành công. Vui lòng chờ duyệt.",
                ptit.drl.evaluation.entity.Notification.NotificationType.EVALUATION_SUBMITTED,
                "EVALUATION",
                1L
            );
            
            ptit.drl.evaluation.entity.Notification notif3 = notificationService.createNotification(
                userId,
                "Có đánh giá mới cần duyệt",
                "Sinh viên Nguyễn Văn A (SV001) - Lớp D21CQCN01-N đã nộp đánh giá. Vui lòng xem xét và duyệt.",
                ptit.drl.evaluation.entity.Notification.NotificationType.EVALUATION_NEEDS_REVIEW,
                "EVALUATION",
                2L
            );
            
            // Convert to DTO manually
            NotificationDTO dto = new NotificationDTO(
                notif1.getId(),
                notif1.getUserId(),
                notif1.getTitle(),
                notif1.getMessage(),
                notif1.getType(),
                notif1.getIsRead(),
                notif1.getRelatedId(),
                notif1.getRelatedType(),
                notif1.getCreatedAt(),
                notif1.getReadAt()
            );
            return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("Test notifications created successfully", dto));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid user ID format"));
        }
    }
}

