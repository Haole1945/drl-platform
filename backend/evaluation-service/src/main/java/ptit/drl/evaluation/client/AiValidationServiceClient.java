package ptit.drl.evaluation.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import ptit.drl.evaluation.client.AiValidationServiceClient.ValidationRequest;
import ptit.drl.evaluation.client.AiValidationServiceClient.ValidationResponse;

import java.util.List;

/**
 * Feign Client for communicating with ai-validation-service
 */
@FeignClient(name = "ai-validation-service", path = "/validations")
public interface AiValidationServiceClient {
    
    /**
     * Validate evidence file using AI
     */
    @PostMapping("/validate")
    ValidationResponse validateEvidence(@RequestBody ValidationRequest request);
    
    /**
     * Get validation result by evidence file ID
     */
    @GetMapping("/evidence/{evidenceFileId}")
    ValidationResponse getValidationByEvidenceFileId(@PathVariable Long evidenceFileId);
    
    /**
     * Get all validations for an evaluation
     */
    @GetMapping("/evaluation/{evaluationId}")
    List<ValidationResponse> getValidationsByEvaluationId(@PathVariable Long evaluationId);
    
    /**
     * Request DTO for validation
     */
    class ValidationRequest {
        private Long evidenceFileId;
        private Long evaluationId;
        private Long criteriaId;
        private String subCriteriaId;
        private String fileUrl;
        private String fileType;
        private CriteriaInfo criteria;
        
        // Getters and Setters
        public Long getEvidenceFileId() { return evidenceFileId; }
        public void setEvidenceFileId(Long evidenceFileId) { this.evidenceFileId = evidenceFileId; }
        public Long getEvaluationId() { return evaluationId; }
        public void setEvaluationId(Long evaluationId) { this.evaluationId = evaluationId; }
        public Long getCriteriaId() { return criteriaId; }
        public void setCriteriaId(Long criteriaId) { this.criteriaId = criteriaId; }
        public String getSubCriteriaId() { return subCriteriaId; }
        public void setSubCriteriaId(String subCriteriaId) { this.subCriteriaId = subCriteriaId; }
        public String getFileUrl() { return fileUrl; }
        public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
        public String getFileType() { return fileType; }
        public void setFileType(String fileType) { this.fileType = fileType; }
        public CriteriaInfo getCriteria() { return criteria; }
        public void setCriteria(CriteriaInfo criteria) { this.criteria = criteria; }
        
        public static class CriteriaInfo {
            private Long id;
            private String name;
            private String description;
            private Double maxPoints;
            private List<SubCriteriaInfo> subCriteria;
            
            // Getters and Setters
            public Long getId() { return id; }
            public void setId(Long id) { this.id = id; }
            public String getName() { return name; }
            public void setName(String name) { this.name = name; }
            public String getDescription() { return description; }
            public void setDescription(String description) { this.description = description; }
            public Double getMaxPoints() { return maxPoints; }
            public void setMaxPoints(Double maxPoints) { this.maxPoints = maxPoints; }
            public List<SubCriteriaInfo> getSubCriteria() { return subCriteria; }
            public void setSubCriteria(List<SubCriteriaInfo> subCriteria) { this.subCriteria = subCriteria; }
        }
        
        public static class SubCriteriaInfo {
            private String id;
            private String name;
            private String description;
            private Double maxPoints;
            
            // Getters and Setters
            public String getId() { return id; }
            public void setId(String id) { this.id = id; }
            public String getName() { return name; }
            public void setName(String name) { this.name = name; }
            public String getDescription() { return description; }
            public void setDescription(String description) { this.description = description; }
            public Double getMaxPoints() { return maxPoints; }
            public void setMaxPoints(Double maxPoints) { this.maxPoints = maxPoints; }
        }
    }
    
    /**
     * Response DTO for validation
     */
    class ValidationResponse {
        private Long validationId;
        private Long evidenceFileId;
        private Long evaluationId;
        private Long criteriaId;
        private String subCriteriaId;
        private String status;
        private Double aiScore;
        private String aiFeedback;
        private Double validationConfidence;
        private Boolean isFake;
        private Boolean isRelevant;
        private Double fakeConfidence;
        private Double relevanceScore;
        private String errorMessage;
        
        // Getters and Setters
        public Long getValidationId() { return validationId; }
        public void setValidationId(Long validationId) { this.validationId = validationId; }
        public Long getEvidenceFileId() { return evidenceFileId; }
        public void setEvidenceFileId(Long evidenceFileId) { this.evidenceFileId = evidenceFileId; }
        public Long getEvaluationId() { return evaluationId; }
        public void setEvaluationId(Long evaluationId) { this.evaluationId = evaluationId; }
        public Long getCriteriaId() { return criteriaId; }
        public void setCriteriaId(Long criteriaId) { this.criteriaId = criteriaId; }
        public String getSubCriteriaId() { return subCriteriaId; }
        public void setSubCriteriaId(String subCriteriaId) { this.subCriteriaId = subCriteriaId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Double getAiScore() { return aiScore; }
        public void setAiScore(Double aiScore) { this.aiScore = aiScore; }
        public String getAiFeedback() { return aiFeedback; }
        public void setAiFeedback(String aiFeedback) { this.aiFeedback = aiFeedback; }
        public Double getValidationConfidence() { return validationConfidence; }
        public void setValidationConfidence(Double validationConfidence) { this.validationConfidence = validationConfidence; }
        public Boolean getIsFake() { return isFake; }
        public void setIsFake(Boolean isFake) { this.isFake = isFake; }
        public Boolean getIsRelevant() { return isRelevant; }
        public void setIsRelevant(Boolean isRelevant) { this.isRelevant = isRelevant; }
        public Double getFakeConfidence() { return fakeConfidence; }
        public void setFakeConfidence(Double fakeConfidence) { this.fakeConfidence = fakeConfidence; }
        public Double getRelevanceScore() { return relevanceScore; }
        public void setRelevanceScore(Double relevanceScore) { this.relevanceScore = relevanceScore; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }
}

