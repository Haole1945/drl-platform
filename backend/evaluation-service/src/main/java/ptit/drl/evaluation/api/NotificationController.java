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
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        if (userId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User ID is required"));
        }
        
        Page<NotificationDTO> notifications = notificationService.getUserNotifications(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved", notifications));
    }
    
    /**
     * GET /notifications/unread - Get unread notifications for current user
     */
    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<java.util.List<NotificationDTO>>> getUnreadNotifications(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        if (userId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User ID is required"));
        }
        
        java.util.List<NotificationDTO> notifications = notificationService.getUnreadNotifications(userId);
        return ResponseEntity.ok(ApiResponse.success("Unread notifications retrieved", notifications));
    }
    
    /**
     * GET /notifications/unread/count - Get count of unread notifications
     */
    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        if (userId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User ID is required"));
        }
        
        long count = notificationService.countUnreadNotifications(userId);
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", count));
    }
    
    /**
     * PUT /notifications/{id}/read - Mark a notification as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        if (userId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User ID is required"));
        }
        
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }
    
    /**
     * PUT /notifications/read-all - Mark all notifications as read for current user
     */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        if (userId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User ID is required"));
        }
        
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }
}

