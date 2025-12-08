package ptit.drl.aivalidation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ptit.drl.aivalidation.dto.ValidationRequest;
import ptit.drl.aivalidation.dto.ValidationResponse;

import java.util.ArrayList;
import java.util.List;

/**
 * Service for calling OpenAI Vision API to validate evidence files
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OpenAIVisionService {
    
    private final OpenAiService openAiService;
    private final ObjectMapper objectMapper;
    
    @Value("${openai.api.vision-model:gpt-4o-mini}")
    private String visionModel;
    
    // Note: OpenAI Vision API requires special message format with image_url
    // Current implementation uses text-based prompt as fallback
    // TODO: Implement proper Vision API with image_url content type
    // TODO: Add EvaluationServiceClient to fetch files and convert to base64
    
    /**
     * Validate evidence file using OpenAI Vision API
     */
    public ValidationResponse validateEvidence(ValidationRequest request) {
        try {
            // Build prompt with criteria context
            String prompt = buildValidationPrompt(request);
            
            // Get image data (base64 or URL)
            String imageData = getImageData(request.getFileUrl());
            
            // Call OpenAI Vision API
            ChatCompletionRequest chatRequest = ChatCompletionRequest.builder()
                    .model(visionModel)
                    .messages(buildMessages(prompt, imageData, request))
                    .maxTokens(2000)
                    .temperature(0.3) // Lower temperature for more consistent results
                    .build();
            
            String response = openAiService.createChatCompletion(chatRequest)
                    .getChoices().get(0).getMessage().getContent();
            
            // Parse response
            return parseValidationResponse(response, request);
            
        } catch (Exception e) {
            log.error("Error validating evidence with OpenAI: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to validate evidence: " + e.getMessage(), e);
        }
    }
    
    /**
     * Build validation prompt with criteria context
     */
    private String buildValidationPrompt(ValidationRequest request) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Bạn là một chuyên gia đánh giá điểm rèn luyện. ");
        prompt.append("Nhiệm vụ của bạn là phân tích minh chứng và đưa ra đánh giá.\n\n");
        
        prompt.append("THÔNG TIN TIÊU CHÍ:\n");
        prompt.append("- Tên tiêu chí: ").append(request.getCriteria().getName()).append("\n");
        prompt.append("- Mô tả: ").append(request.getCriteria().getDescription()).append("\n");
        prompt.append("- Điểm tối đa: ").append(request.getCriteria().getMaxPoints()).append(" điểm\n");
        
        if (request.getSubCriteriaId() != null && request.getCriteria().getSubCriteria() != null) {
            request.getCriteria().getSubCriteria().stream()
                    .filter(sub -> sub.getId().equals(request.getSubCriteriaId()))
                    .findFirst()
                    .ifPresent(sub -> {
                        prompt.append("- Tiêu chí con: ").append(sub.getName()).append("\n");
                        prompt.append("  Mô tả: ").append(sub.getDescription()).append("\n");
                        prompt.append("  Điểm tối đa: ").append(sub.getMaxPoints()).append(" điểm\n");
                    });
        }
        
        prompt.append("\nNHIỆM VỤ:\n");
        prompt.append("1. Phân tích xem minh chứng có BỊ LÀM GIẢ không (fake detection)\n");
        prompt.append("2. Đánh giá xem minh chứng có PHÙ HỢP với tiêu chí không (relevance)\n");
        prompt.append("3. Đưa ra điểm số gợi ý từ 0 đến ").append(request.getCriteria().getMaxPoints()).append(" điểm\n");
        prompt.append("4. Đưa ra feedback chi tiết về minh chứng\n\n");
        
        prompt.append("TRẢ LỜI THEO ĐỊNH DẠNG JSON:\n");
        prompt.append("{\n");
        prompt.append("  \"isFake\": true/false,\n");
        prompt.append("  \"fakeConfidence\": 0.0-1.0,\n");
        prompt.append("  \"isRelevant\": true/false,\n");
        prompt.append("  \"relevanceScore\": 0.0-1.0,\n");
        prompt.append("  \"aiScore\": 0.0-").append(request.getCriteria().getMaxPoints()).append(",\n");
        prompt.append("  \"validationConfidence\": 0.0-1.0,\n");
        prompt.append("  \"aiFeedback\": \"Feedback chi tiết về minh chứng\"\n");
        prompt.append("}\n");
        
        return prompt.toString();
    }
    
    /**
     * Build chat messages for Vision API
     * Supports both images (base64) and text files
     */
    private List<ChatMessage> buildMessages(String prompt, String imageData, ValidationRequest request) {
        List<ChatMessage> messages = new ArrayList<>();
        
        // System message
        messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), 
                "Bạn là một chuyên gia đánh giá điểm rèn luyện. Phân tích minh chứng một cách khách quan và chính xác."));
        
        // User message
        ChatMessage userMessage = new ChatMessage(ChatMessageRole.USER.value(), prompt);
        
        // If image data is base64 (starts with "data:"), add as image content
        if (imageData.startsWith("data:image/") || imageData.startsWith("data:application/pdf")) {
            // For Vision API, we need to use a different approach
            // The OpenAI Java client might need special handling for images
            // For now, include image data in the prompt
            String fullPrompt = prompt + "\n\nFile Type: " + request.getFileType() + 
                    "\nFile Content (base64): " + imageData.substring(0, Math.min(100, imageData.length())) + "...";
            userMessage = new ChatMessage(ChatMessageRole.USER.value(), fullPrompt);
        } else {
            // If it's a URL, include in prompt
            String fullPrompt = prompt + "\n\nFile URL: " + imageData + "\nFile Type: " + request.getFileType();
            userMessage = new ChatMessage(ChatMessageRole.USER.value(), fullPrompt);
        }
        
        messages.add(userMessage);
        return messages;
    }
    
    /**
     * Get image data as base64 or URL
     * Fetches file from evaluation-service and converts to base64
     * Note: Currently returns URL as fallback. Full base64 implementation can be added later.
     */
    private String getImageData(String fileUrl) {
        try {
            // For now, return the file URL
            // TODO: Implement file fetching and base64 conversion
            // This requires:
            // 1. Parse file URL: /files/evidence/{evaluationId}/{criteriaId}/{filename}
            // 2. Fetch file from evaluation-service via Feign client
            // 3. Convert to base64
            // 4. Return as data URL
            
            log.debug("Using file URL for validation: {}", fileUrl);
            return fileUrl;
            
        } catch (Exception e) {
            log.error("Error processing file URL: {}", e.getMessage(), e);
            return fileUrl;
        }
    }
    
    /**
     * Parse OpenAI response to ValidationResponse
     */
    private ValidationResponse parseValidationResponse(String response, ValidationRequest request) {
        try {
            // Try to extract JSON from response
            String jsonStr = extractJsonFromResponse(response);
            JsonNode json = objectMapper.readTree(jsonStr);
            
            ValidationResponse validationResponse = new ValidationResponse();
            validationResponse.setEvidenceFileId(request.getEvidenceFileId());
            validationResponse.setEvaluationId(request.getEvaluationId());
            validationResponse.setCriteriaId(request.getCriteriaId());
            validationResponse.setSubCriteriaId(request.getSubCriteriaId());
            validationResponse.setStatus("VALIDATED");
            
            // Parse JSON fields
            validationResponse.setIsFake(json.has("isFake") ? json.get("isFake").asBoolean() : false);
            validationResponse.setFakeConfidence(json.has("fakeConfidence") ? json.get("fakeConfidence").asDouble() : 0.0);
            validationResponse.setIsRelevant(json.has("isRelevant") ? json.get("isRelevant").asBoolean() : true);
            validationResponse.setRelevanceScore(json.has("relevanceScore") ? json.get("relevanceScore").asDouble() : 1.0);
            validationResponse.setAiScore(json.has("aiScore") ? json.get("aiScore").asDouble() : 0.0);
            validationResponse.setValidationConfidence(json.has("validationConfidence") ? json.get("validationConfidence").asDouble() : 0.5);
            validationResponse.setAiFeedback(json.has("aiFeedback") ? json.get("aiFeedback").asText() : "Không có feedback");
            
            return validationResponse;
            
        } catch (Exception e) {
            log.error("Error parsing OpenAI response: {}", e.getMessage(), e);
            // Return default response
            ValidationResponse defaultResponse = new ValidationResponse();
            defaultResponse.setEvidenceFileId(request.getEvidenceFileId());
            defaultResponse.setEvaluationId(request.getEvaluationId());
            defaultResponse.setCriteriaId(request.getCriteriaId());
            defaultResponse.setStatus("FAILED");
            defaultResponse.setErrorMessage("Failed to parse OpenAI response: " + e.getMessage());
            return defaultResponse;
        }
    }
    
    /**
     * Extract JSON from response (might be wrapped in markdown code blocks)
     */
    private String extractJsonFromResponse(String response) {
        // Remove markdown code blocks if present
        String cleaned = response.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        }
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }
}

