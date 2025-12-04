package ptit.drl.evaluation.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ptit.drl.evaluation.dto.AiScoringRequest;
import ptit.drl.evaluation.dto.AiScoringResponse;
import ptit.drl.evaluation.service.AiScoringService;

/**
 * REST API cho AI Scoring
 * Endpoint để frontend gọi GPT-5.1 phân tích minh chứng và gợi ý điểm
 */
@RestController
@RequestMapping("/ai")
@Tag(name = "AI Scoring", description = "AI-powered scoring suggestions using GPT-5.1 Vision")
public class AiScoringController {
    
    private static final Logger logger = LoggerFactory.getLogger(AiScoringController.class);
    private final AiScoringService aiScoringService;
    
    public AiScoringController(AiScoringService aiScoringService) {
        this.aiScoringService = aiScoringService;
    }
    
    /**
     * POST /ai/suggest-score
     * (Gateway route: /api/ai/suggest-score -> rewritten to /ai/suggest-score)
     * 
     * Gọi AI để phân tích minh chứng và gợi ý điểm
     * Chỉ người chấm (CLASS_MONITOR, FACULTY_ADMIN, CTSV) mới có quyền gọi
     */
    @PostMapping("/suggest-score")
    //@PreAuthorize("hasAnyRole('CLASS_MONITOR', 'FACULTY_ADMIN', 'CTSV')")  // Temporarily disabled for testing
    @Operation(
        summary = "Gợi ý điểm từ AI",
        description = "Sử dụng GPT-5.1 Vision để phân tích hình ảnh minh chứng và gợi ý điểm cho tiêu chí"
    )
    public ResponseEntity<AiScoringResponse> suggestScore(
            @Valid @RequestBody(required = false) AiScoringRequest request) {
        
        try {
            // Check if request is null
            if (request == null) {
                logger.error("Request body is null");
                AiScoringResponse errorResponse = AiScoringResponse.builder()
                    .suggestedScore(0.0)
                    .maxScore(0.0)
                    .status("UNCERTAIN")
                    .confidence(0.0)
                    .reason("Request body is required")
                    .processingTimeMs(0L)
                    .build();
                return ResponseEntity.status(400).body(errorResponse);
            }
            
            logger.info("Received AI scoring request for criteriaId: {}, evidenceFileIds: {}", 
                    request.getCriteriaId(), 
                    request.getEvidenceFileIds() != null ? request.getEvidenceFileIds() : "null");
            
            // Validate request
            if (request.getCriteriaId() == null) {
                logger.error("Criteria ID is null");
                throw new IllegalArgumentException("Criteria ID is required");
            }
            if (request.getEvidenceFileIds() == null || request.getEvidenceFileIds().isEmpty()) {
                logger.error("Evidence file IDs are null or empty");
                throw new IllegalArgumentException("Evidence file IDs are required");
            }
            
            logger.debug("Calling AI scoring service...");
            AiScoringResponse response = aiScoringService.suggestScore(request);
            logger.info("AI scoring completed successfully. Suggested score: {}/{}", 
                    response.getSuggestedScore(), response.getMaxScore());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid request: {}", e.getMessage());
            AiScoringResponse errorResponse = AiScoringResponse.builder()
                .suggestedScore(0.0)
                .maxScore(0.0)
                .status("UNCERTAIN")
                .confidence(0.0)
                .reason("Lỗi dữ liệu đầu vào: " + e.getMessage())
                .processingTimeMs(0L)
                .build();
            return ResponseEntity.status(400).body(errorResponse);
        } catch (Exception e) {
            logger.error("Error processing AI scoring request", e);
            // Log full stack trace for debugging
            e.printStackTrace();
            AiScoringResponse errorResponse = AiScoringResponse.builder()
                .suggestedScore(0.0)
                .maxScore(0.0)
                .status("UNCERTAIN")
                .confidence(0.0)
                .reason("Lỗi khi xử lý yêu cầu: " + (e.getMessage() != null ? e.getMessage() : "Unknown error"))
                .processingTimeMs(0L)
                .build();
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * GET /ai/health
     * (Gateway route: /api/ai/health -> rewritten to /ai/health)
     * 
     * Kiểm tra AI service có hoạt động không
     */
    @GetMapping("/health")
    @Operation(
        summary = "Kiểm tra AI service",
        description = "Endpoint để kiểm tra xem AI scoring service có sẵn sàng không"
    )
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("AI Scoring Service is running");
    }
    
    /**
     * Simple test endpoint
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("AI Controller is working!");
    }
    
    /**
     * Test endpoint để kiểm tra request body parsing
     */
    @PostMapping("/test-request")
    public ResponseEntity<?> testRequest(@RequestBody(required = false) AiScoringRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body("Request body is null");
        }
        return ResponseEntity.ok("Request received: criteriaId=" + request.getCriteriaId() + 
                ", evidenceFileIds=" + request.getEvidenceFileIds());
    }
    
}

