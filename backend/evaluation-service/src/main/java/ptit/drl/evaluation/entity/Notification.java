package ptit.drl.evaluation.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Notification entity - Thông báo cho người dùng
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_user", columnList = "user_id"),
    @Index(name = "idx_notification_read", columnList = "is_read"),
    @Index(name = "idx_notification_created", columnList = "created_at")
})
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId; // ID của user trong auth-service
    
    @Column(name = "title", nullable = false, length = 200)
    private String title; // Tiêu đề thông báo
    
    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message; // Nội dung thông báo
    
    @Column(name = "type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private NotificationType type; // Loại thông báo
    
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false; // Đã đọc chưa
    
    @Column(name = "related_id")
    private Long relatedId; // ID liên quan (evaluation period id, evaluation id, etc.)
    
    @Column(name = "related_type", length = 50)
    private String relatedType; // Loại entity liên quan (EVALUATION_PERIOD, EVALUATION, etc.)
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Constructors
    public Notification() {}
    
    public Notification(Long userId, String title, String message, NotificationType type) {
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.isRead = false;
    }
    
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public NotificationType getType() {
        return type;
    }
    
    public void setType(NotificationType type) {
        this.type = type;
    }
    
    public Boolean getIsRead() {
        return isRead;
    }
    
    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }
    
    public Long getRelatedId() {
        return relatedId;
    }
    
    public void setRelatedId(Long relatedId) {
        this.relatedId = relatedId;
    }
    
    public String getRelatedType() {
        return relatedType;
    }
    
    public void setRelatedType(String relatedType) {
        this.relatedType = relatedType;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getReadAt() {
        return readAt;
    }
    
    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }
    
    /**
     * Notification types
     */
    public enum NotificationType {
        // Period notifications
        PERIOD_CREATED,      // Đợt đánh giá được tạo
        PERIOD_REMINDER,     // Nhắc nhở sắp hết hạn
        PERIOD_ENDING,       // Đợt đánh giá sắp kết thúc
        
        // Evaluation notifications - Student
        EVALUATION_SUBMITTED, // Đánh giá đã được nộp (cho student)
        EVALUATION_APPROVED,  // Đánh giá đã được duyệt (cho student)
        EVALUATION_REJECTED,  // Đánh giá bị từ chối (cho student)
        EVALUATION_RETURNED,  // Đánh giá cần chỉnh sửa (cho student)
        
        // Evaluation notifications - Reviewers
        EVALUATION_NEEDS_REVIEW, // Có đánh giá mới cần duyệt (cho reviewers)
        EVALUATION_ESCALATED,    // Đánh giá được chuyển lên cấp cao hơn (cho reviewers)
        
        // Rubric notifications
        RUBRIC_ACTIVATED,    // Rubric mới được kích hoạt
        RUBRIC_UPDATED,      // Rubric được cập nhật
        
        // Appeal notifications
        APPEAL_CREATED,      // Khiếu nại được tạo (cho reviewers)
        APPEAL_REVIEWED      // Khiếu nại đã được xử lý (cho student)
    }
}

