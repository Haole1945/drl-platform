package ptit.drl.aivalidation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for evidence validation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ValidationRequest {
    
    @NotNull(message = "Evidence file ID is required")
    private Long evidenceFileId;
    
    private Long evaluationId;
    
    @NotNull(message = "Criteria ID is required")
    private Long criteriaId;
    
    private String subCriteriaId;
    
    @NotNull(message = "File URL is required")
    private String fileUrl; // URL to access file from evaluation-service
    
    @NotNull(message = "File type is required")
    private String fileType; // MIME type: image/jpeg, application/pdf, etc.
    
    // Criteria details for AI context
    @NotNull(message = "Criteria details are required")
    private CriteriaInfo criteria;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CriteriaInfo {
        private Long id;
        private String name;
        private String description;
        private Double maxPoints;
        private List<SubCriteriaInfo> subCriteria;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubCriteriaInfo {
        private String id; // e.g., "1.1"
        private String name;
        private String description;
        private Double maxPoints;
    }
}

