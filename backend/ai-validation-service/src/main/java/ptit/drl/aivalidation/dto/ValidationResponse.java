package ptit.drl.aivalidation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for evidence validation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ValidationResponse {
    
    private Long validationId;
    private Long evidenceFileId;
    private Long evaluationId;
    private Long criteriaId;
    private String subCriteriaId;
    
    private String status; // PENDING, VALIDATING, VALIDATED, FAILED, SKIPPED
    
    // AI Analysis Results
    private Double aiScore; // Điểm gợi ý từ AI
    private String aiFeedback; // Feedback chi tiết
    private Double validationConfidence; // 0.0 - 1.0
    
    // Detection Results
    private Boolean isFake; // Phát hiện giả mạo
    private Boolean isRelevant; // Có phù hợp với criteria không
    private Double fakeConfidence; // Confidence của fake detection
    private Double relevanceScore; // Relevance score
    
    private String errorMessage; // Error message nếu fail
    private LocalDateTime validatedAt;
    private LocalDateTime createdAt;
}

