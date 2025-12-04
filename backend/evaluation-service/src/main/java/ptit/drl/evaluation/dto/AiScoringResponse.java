package ptit.drl.evaluation.dto;

/**
 * Response DTO từ AI scoring service
 * Chứa gợi ý điểm và giải thích từ GPT-5.1
 */
public class AiScoringResponse {
    
    private Double suggestedScore;
    private Double maxScore;
    private String status; // ACCEPTABLE, REJECT, UNCERTAIN
    private Double confidence; // 0.0 - 1.0
    private String reason; // Giải thích tiếng Việt
    private String analysisDetails; // Chi tiết phân tích từng ảnh
    private Long processingTimeMs; // Thời gian xử lý
    
    // Constructors
    public AiScoringResponse() {}
    
    public AiScoringResponse(Double suggestedScore, Double maxScore, String status, 
                            Double confidence, String reason) {
        this.suggestedScore = suggestedScore;
        this.maxScore = maxScore;
        this.status = status;
        this.confidence = confidence;
        this.reason = reason;
    }
    
    // Builder pattern for easier construction
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private final AiScoringResponse response = new AiScoringResponse();
        
        public Builder suggestedScore(Double suggestedScore) {
            response.suggestedScore = suggestedScore;
            return this;
        }
        
        public Builder maxScore(Double maxScore) {
            response.maxScore = maxScore;
            return this;
        }
        
        public Builder status(String status) {
            response.status = status;
            return this;
        }
        
        public Builder confidence(Double confidence) {
            response.confidence = confidence;
            return this;
        }
        
        public Builder reason(String reason) {
            response.reason = reason;
            return this;
        }
        
        public Builder analysisDetails(String analysisDetails) {
            response.analysisDetails = analysisDetails;
            return this;
        }
        
        public Builder processingTimeMs(Long processingTimeMs) {
            response.processingTimeMs = processingTimeMs;
            return this;
        }
        
        public AiScoringResponse build() {
            return response;
        }
    }
    
    // Getters and Setters
    public Double getSuggestedScore() {
        return suggestedScore;
    }
    
    public void setSuggestedScore(Double suggestedScore) {
        this.suggestedScore = suggestedScore;
    }
    
    public Double getMaxScore() {
        return maxScore;
    }
    
    public void setMaxScore(Double maxScore) {
        this.maxScore = maxScore;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Double getConfidence() {
        return confidence;
    }
    
    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
    
    public String getAnalysisDetails() {
        return analysisDetails;
    }
    
    public void setAnalysisDetails(String analysisDetails) {
        this.analysisDetails = analysisDetails;
    }
    
    public Long getProcessingTimeMs() {
        return processingTimeMs;
    }
    
    public void setProcessingTimeMs(Long processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }
}

