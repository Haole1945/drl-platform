package ptit.drl.aivalidation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * EvidenceValidation entity - Stores AI validation results for evidence files
 */
@Entity
@Table(name = "evidence_validations", indexes = {
    @Index(name = "idx_validation_evidence_file", columnList = "evidence_file_id"),
    @Index(name = "idx_validation_evaluation", columnList = "evaluation_id"),
    @Index(name = "idx_validation_status", columnList = "validation_status"),
    @Index(name = "idx_validation_criteria", columnList = "criteria_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvidenceValidation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "evidence_file_id", nullable = false)
    private Long evidenceFileId; // Reference to evidence_files.id (evaluation-service)
    
    @Column(name = "evaluation_id")
    private Long evaluationId; // For quick lookup
    
    @Column(name = "criteria_id", nullable = false)
    private Long criteriaId;
    
    @Column(name = "sub_criteria_id", length = 20)
    private String subCriteriaId; // Optional (e.g., "1.1")
    
    @Column(name = "validation_status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ValidationStatus validationStatus = ValidationStatus.PENDING;
    
    // AI Analysis Results
    @Column(name = "ai_score")
    private Double aiScore; // Điểm gợi ý từ AI (0 - max_points)
    
    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback; // Feedback chi tiết từ AI
    
    @Column(name = "validation_confidence")
    private Double validationConfidence; // 0.0 - 1.0
    
    // Detection Results
    @Column(name = "is_fake")
    private Boolean isFake; // Phát hiện giả mạo
    
    @Column(name = "is_relevant")
    private Boolean isRelevant; // Có phù hợp với criteria không
    
    @Column(name = "fake_confidence")
    private Double fakeConfidence; // Confidence của fake detection (0.0 - 1.0)
    
    @Column(name = "relevance_score")
    private Double relevanceScore; // Relevance score (0.0 - 1.0)
    
    // Metadata
    @Column(name = "validation_metadata", columnDefinition = "JSONB")
    private String validationMetadata; // Raw JSON response từ OpenAI
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage; // Error message nếu validation fail
    
    @Column(name = "validated_at")
    private LocalDateTime validatedAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum ValidationStatus {
        PENDING,      // Chờ validation
        VALIDATING,   // Đang validate
        VALIDATED,    // Đã validate thành công
        FAILED,       // Validation thất bại
        SKIPPED       // Bỏ qua validation
    }
}

