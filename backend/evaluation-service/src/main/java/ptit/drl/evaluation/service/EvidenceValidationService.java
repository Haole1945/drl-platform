package ptit.drl.evaluation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import ptit.drl.evaluation.client.AiValidationServiceClient;
import ptit.drl.evaluation.entity.Criteria;
import ptit.drl.evaluation.entity.EvidenceFile;
import ptit.drl.evaluation.entity.Evaluation;
import ptit.drl.evaluation.repository.CriteriaRepository;
import ptit.drl.evaluation.repository.EvidenceFileRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Service for triggering AI validation of evidence files
 * Runs asynchronously to not block evaluation submission
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EvidenceValidationService {
    
    private final AiValidationServiceClient aiValidationServiceClient;
    private final EvidenceFileRepository evidenceFileRepository;
    private final CriteriaRepository criteriaRepository;
    
    /**
     * Trigger validation for all evidence files in an evaluation (async)
     */
    @Async
    public CompletableFuture<Void> validateEvaluationEvidenceAsync(Evaluation evaluation) {
        try {
            log.info("Starting async validation for evaluation ID: {}", evaluation.getId());
            
            // Get all evidence files for this evaluation
            List<EvidenceFile> evidenceFiles = evidenceFileRepository.findByEvaluationId(evaluation.getId());
            
            if (evidenceFiles.isEmpty()) {
                log.info("No evidence files found for evaluation ID: {}", evaluation.getId());
                return CompletableFuture.completedFuture(null);
            }
            
            log.info("Found {} evidence files to validate for evaluation ID: {}", 
                    evidenceFiles.size(), evaluation.getId());
            
            // Validate each file
            for (EvidenceFile file : evidenceFiles) {
                try {
                    validateEvidenceFile(file, evaluation);
                } catch (Exception e) {
                    log.error("Error validating evidence file ID {}: {}", file.getId(), e.getMessage(), e);
                    // Continue with other files even if one fails
                }
            }
            
            log.info("Completed async validation for evaluation ID: {}", evaluation.getId());
            return CompletableFuture.completedFuture(null);
            
        } catch (Exception e) {
            log.error("Error in async validation for evaluation ID {}: {}", 
                    evaluation.getId(), e.getMessage(), e);
            return CompletableFuture.completedFuture(null);
        }
    }
    
    /**
     * Validate a single evidence file
     */
    private void validateEvidenceFile(EvidenceFile file, Evaluation evaluation) {
        try {
            // Get criteria details
            Criteria criteria = criteriaRepository.findById(file.getCriteriaId())
                    .orElseThrow(() -> new RuntimeException(
                            "Criteria not found: " + file.getCriteriaId()));
            
            // Build validation request
            AiValidationServiceClient.ValidationRequest request = 
                    buildValidationRequest(file, evaluation, criteria);
            
            // Call AI validation service
            log.info("Calling AI validation service for evidence file ID: {}", file.getId());
            AiValidationServiceClient.ValidationResponse response = 
                    aiValidationServiceClient.validateEvidence(request);
            
            log.info("AI validation completed for evidence file ID: {}, status: {}", 
                    file.getId(), response.getStatus());
            
        } catch (Exception e) {
            log.error("Error validating evidence file ID {}: {}", file.getId(), e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Build validation request from evidence file and criteria
     */
    private AiValidationServiceClient.ValidationRequest buildValidationRequest(
            EvidenceFile file, Evaluation evaluation, Criteria criteria) {
        
        AiValidationServiceClient.ValidationRequest request = 
                new AiValidationServiceClient.ValidationRequest();
        
        request.setEvidenceFileId(file.getId());
        request.setEvaluationId(evaluation.getId());
        request.setCriteriaId(criteria.getId());
        request.setSubCriteriaId(file.getSubCriteriaId());
        
        // Build full file URL
        // File URL from EvidenceFile is already in format: /files/evidence/{evaluationId}/{criteriaId}/{filename}
        // AI validation service will need to fetch it via evaluation-service
        // For now, pass the relative URL and let ai-validation-service construct full URL
        // In production, this should be configurable via application.yml
        String fileUrl = file.getFileUrl(); // Relative URL: /files/evidence/{evaluationId}/{criteriaId}/{filename}
        request.setFileUrl(fileUrl);
        request.setFileType(file.getFileType());
        
        // Build criteria info
        AiValidationServiceClient.ValidationRequest.CriteriaInfo criteriaInfo = 
                new AiValidationServiceClient.ValidationRequest.CriteriaInfo();
        criteriaInfo.setId(criteria.getId());
        criteriaInfo.setName(criteria.getName());
        criteriaInfo.setDescription(criteria.getDescription());
        criteriaInfo.setMaxPoints(criteria.getMaxPoints());
        
        // Parse sub-criteria from criteria description
        // Sub-criteria are stored in description with format:
        // "Bao gồm:\n1.1. Name: Description (Điểm: X)\n1.2. Name: Description (Điểm: Y)"
        List<AiValidationServiceClient.ValidationRequest.SubCriteriaInfo> subCriteriaList = 
                parseSubCriteriaFromDescription(criteria.getDescription(), criteria.getOrderIndex());
        criteriaInfo.setSubCriteria(subCriteriaList);
        
        request.setCriteria(criteriaInfo);
        
        return request;
    }
    
    /**
     * Parse sub-criteria from criteria description
     * Format: "Bao gồm:\n1.1. Name: Description (Điểm: X)\n1.2. Name: Description (Điểm: Y)"
     */
    private List<AiValidationServiceClient.ValidationRequest.SubCriteriaInfo> 
            parseSubCriteriaFromDescription(String description, Integer orderIndex) {
        
        List<AiValidationServiceClient.ValidationRequest.SubCriteriaInfo> subCriteriaList = 
                new ArrayList<>();
        
        if (description == null || description.trim().isEmpty()) {
            return subCriteriaList;
        }
        
        // Look for "Bao gồm:" section
        String baoGomSection = null;
        String[] lines = description.split("\n");
        boolean inBaoGomSection = false;
        StringBuilder baoGomBuilder = new StringBuilder();
        
        for (String line : lines) {
            if (line.trim().startsWith("Bao gồm:") || line.trim().startsWith("bao gồm:")) {
                inBaoGomSection = true;
                continue;
            }
            if (inBaoGomSection) {
                baoGomBuilder.append(line).append("\n");
            }
        }
        
        if (baoGomBuilder.length() > 0) {
            baoGomSection = baoGomBuilder.toString();
        }
        
        if (baoGomSection == null || baoGomSection.trim().isEmpty()) {
            return subCriteriaList;
        }
        
        // Parse sub-criteria lines
        // Pattern: "1.1. Name: Description (Điểm: X)" or "1.1. Name: Description"
        String pattern = "(\\d+\\.\\d+)\\.\\s*([^:]+):\\s*([^(]+?)(?:\\(Điểm:\\s*(\\d+(?:\\.\\d+)?)\\))?";
        java.util.regex.Pattern regex = java.util.regex.Pattern.compile(pattern);
        java.util.regex.Matcher matcher = regex.matcher(baoGomSection);
        
        while (matcher.find()) {
            String subId = matcher.group(1); // e.g., "1.1"
            String name = matcher.group(2).trim();
            String subDescription = matcher.group(3).trim();
            String pointsStr = matcher.group(4); // Optional points
            
            Double maxPoints = null;
            if (pointsStr != null && !pointsStr.isEmpty()) {
                try {
                    maxPoints = Double.parseDouble(pointsStr);
                } catch (NumberFormatException e) {
                    // Ignore if can't parse
                }
            }
            
            AiValidationServiceClient.ValidationRequest.SubCriteriaInfo subCriteria = 
                    new AiValidationServiceClient.ValidationRequest.SubCriteriaInfo();
            subCriteria.setId(subId);
            subCriteria.setName(name);
            subCriteria.setDescription(subDescription);
            subCriteria.setMaxPoints(maxPoints);
            
            subCriteriaList.add(subCriteria);
        }
        
        return subCriteriaList;
    }
}

