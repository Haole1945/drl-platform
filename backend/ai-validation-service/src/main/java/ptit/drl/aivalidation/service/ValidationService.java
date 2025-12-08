package ptit.drl.aivalidation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptit.drl.aivalidation.dto.ValidationRequest;
import ptit.drl.aivalidation.dto.ValidationResponse;
import ptit.drl.aivalidation.entity.EvidenceValidation;
import ptit.drl.aivalidation.repository.EvidenceValidationRepository;

import java.time.LocalDateTime;

/**
 * Service for managing evidence validations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ValidationService {
    
    private final EvidenceValidationRepository validationRepository;
    private final OpenAIVisionService openAIVisionService;
    
    /**
     * Validate evidence file using AI
     */
    @Transactional
    public ValidationResponse validateEvidence(ValidationRequest request) {
        // Check if validation already exists
        EvidenceValidation existing = validationRepository
                .findByEvidenceFileId(request.getEvidenceFileId())
                .orElse(null);
        
        EvidenceValidation validation;
        if (existing != null) {
            validation = existing;
            validation.setValidationStatus(EvidenceValidation.ValidationStatus.VALIDATING);
        } else {
            validation = new EvidenceValidation();
            validation.setEvidenceFileId(request.getEvidenceFileId());
            validation.setEvaluationId(request.getEvaluationId());
            validation.setCriteriaId(request.getCriteriaId());
            validation.setSubCriteriaId(request.getSubCriteriaId());
            validation.setValidationStatus(EvidenceValidation.ValidationStatus.VALIDATING);
        }
        
        validationRepository.save(validation);
        
        try {
            // Call OpenAI Vision API
            ValidationResponse aiResponse = openAIVisionService.validateEvidence(request);
            
            // Update validation with results
            validation.setValidationStatus(EvidenceValidation.ValidationStatus.VALIDATED);
            validation.setAiScore(aiResponse.getAiScore());
            validation.setAiFeedback(aiResponse.getAiFeedback());
            validation.setValidationConfidence(aiResponse.getValidationConfidence());
            validation.setIsFake(aiResponse.getIsFake());
            validation.setIsRelevant(aiResponse.getIsRelevant());
            validation.setFakeConfidence(aiResponse.getFakeConfidence());
            validation.setRelevanceScore(aiResponse.getRelevanceScore());
            validation.setValidatedAt(LocalDateTime.now());
            validation.setValidationMetadata(aiResponse.toString()); // Store as JSON string
            
            validationRepository.save(validation);
            
            // Convert to response DTO
            return toResponseDTO(validation);
            
        } catch (Exception e) {
            log.error("Error validating evidence: {}", e.getMessage(), e);
            
            // Mark as failed
            validation.setValidationStatus(EvidenceValidation.ValidationStatus.FAILED);
            validation.setErrorMessage(e.getMessage());
            validationRepository.save(validation);
            
            ValidationResponse errorResponse = new ValidationResponse();
            errorResponse.setValidationId(validation.getId());
            errorResponse.setEvidenceFileId(request.getEvidenceFileId());
            errorResponse.setEvaluationId(request.getEvaluationId());
            errorResponse.setCriteriaId(request.getCriteriaId());
            errorResponse.setStatus("FAILED");
            errorResponse.setErrorMessage(e.getMessage());
            return errorResponse;
        }
    }
    
    /**
     * Get validation result by evidence file ID
     */
    public ValidationResponse getValidationByEvidenceFileId(Long evidenceFileId) {
        return validationRepository.findByEvidenceFileId(evidenceFileId)
                .map(this::toResponseDTO)
                .orElse(null);
    }
    
    /**
     * Get all validations for an evaluation
     */
    public java.util.List<ValidationResponse> getValidationsByEvaluationId(Long evaluationId) {
        return validationRepository.findByEvaluationId(evaluationId).stream()
                .map(this::toResponseDTO)
                .toList();
    }
    
    /**
     * Convert entity to DTO
     */
    private ValidationResponse toResponseDTO(EvidenceValidation validation) {
        ValidationResponse response = new ValidationResponse();
        response.setValidationId(validation.getId());
        response.setEvidenceFileId(validation.getEvidenceFileId());
        response.setEvaluationId(validation.getEvaluationId());
        response.setCriteriaId(validation.getCriteriaId());
        response.setSubCriteriaId(validation.getSubCriteriaId());
        response.setStatus(validation.getValidationStatus().name());
        response.setAiScore(validation.getAiScore());
        response.setAiFeedback(validation.getAiFeedback());
        response.setValidationConfidence(validation.getValidationConfidence());
        response.setIsFake(validation.getIsFake());
        response.setIsRelevant(validation.getIsRelevant());
        response.setFakeConfidence(validation.getFakeConfidence());
        response.setRelevanceScore(validation.getRelevanceScore());
        response.setErrorMessage(validation.getErrorMessage());
        response.setValidatedAt(validation.getValidatedAt());
        response.setCreatedAt(validation.getCreatedAt());
        return response;
    }
}

