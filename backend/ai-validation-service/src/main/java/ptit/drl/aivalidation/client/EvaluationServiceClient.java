package ptit.drl.aivalidation.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign Client for fetching evidence files from evaluation-service
 */
@FeignClient(name = "evaluation-service", path = "/files")
public interface EvaluationServiceClient {
    
    /**
     * Download evidence file
     * Note: This endpoint should return the file content
     */
    @GetMapping("/evidence/{evaluationId}/{criteriaId}/{filename}")
    ResponseEntity<byte[]> downloadEvidenceFile(
            @PathVariable Long evaluationId,
            @PathVariable Long criteriaId,
            @PathVariable String filename);
}

