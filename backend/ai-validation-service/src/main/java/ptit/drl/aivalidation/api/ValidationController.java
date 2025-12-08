package ptit.drl.aivalidation.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ptit.drl.aivalidation.dto.ValidationRequest;
import ptit.drl.aivalidation.dto.ValidationResponse;
import ptit.drl.aivalidation.service.ValidationService;

import java.util.List;

/**
 * REST Controller for evidence validation
 */
@RestController
@RequestMapping("/validations")
@RequiredArgsConstructor
public class ValidationController {
    
    private final ValidationService validationService;
    
    /**
     * POST /validations/validate - Validate evidence file using AI
     */
    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validateEvidence(
            @Valid @RequestBody ValidationRequest request) {
        ValidationResponse response = validationService.validateEvidence(request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * GET /validations/evidence/{evidenceFileId} - Get validation result
     */
    @GetMapping("/evidence/{evidenceFileId}")
    public ResponseEntity<ValidationResponse> getValidationByEvidenceFileId(
            @PathVariable Long evidenceFileId) {
        ValidationResponse response = validationService.getValidationByEvidenceFileId(evidenceFileId);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }
    
    /**
     * GET /validations/evaluation/{evaluationId} - Get all validations for evaluation
     */
    @GetMapping("/evaluation/{evaluationId}")
    public ResponseEntity<List<ValidationResponse>> getValidationsByEvaluationId(
            @PathVariable Long evaluationId) {
        List<ValidationResponse> responses = validationService.getValidationsByEvaluationId(evaluationId);
        return ResponseEntity.ok(responses);
    }
}

