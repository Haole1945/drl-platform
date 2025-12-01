package ptit.drl.evaluation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * OpenAI API Client
 * Wrapper để gọi OpenAI Vision API (GPT-4o-mini)
 */
@Component
public class OpenAiClient {
    
    private static final Logger logger = LoggerFactory.getLogger(OpenAiClient.class);
    
    @Value("${openai.api.key:}")
    private String apiKey;
    
    @Value("${openai.api.base-url:https://api.openai.com/v1}")
    private String baseUrl;
    
    @Value("${openai.api.timeout:60}")
    private int timeoutSeconds;
    
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    public OpenAiClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .build();
    }
    
    @PostConstruct
    public void validateConfiguration() {
        logger.info("Validating OpenAI API configuration...");
        logger.debug("Raw API key value (before trim): length={}, isNull={}", 
                apiKey != null ? apiKey.length() : 0, apiKey == null);
        
        // Trim API key to remove any whitespace
        if (apiKey != null) {
            String originalLength = String.valueOf(apiKey.length());
            apiKey = apiKey.trim();
            if (apiKey.length() != Integer.parseInt(originalLength)) {
                logger.debug("API key was trimmed: original length={}, new length={}", 
                        originalLength, apiKey.length());
            }
        }
        
        if (apiKey == null || apiKey.isEmpty()) {
            logger.error("OpenAI API key is not configured! Please set OPENAI_API_KEY environment variable or configure in application.yml");
            throw new IllegalStateException("OpenAI API key is required but not configured");
        }
        
        // Log partial key for debugging (first 10 chars + last 4 chars for security)
        String maskedKey = apiKey.length() > 14 
            ? apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length() - 4)
            : "***";
        logger.info("OpenAI API configured - Base URL: {}, API Key: {} (masked, length: {}), Model will be set per request", 
                baseUrl, maskedKey, apiKey.length());
        
        // Validate API key format (should start with sk-)
        if (!apiKey.startsWith("sk-")) {
            logger.warn("OpenAI API key does not start with 'sk-'. This might be invalid. Key starts with: {}", 
                    apiKey.length() > 5 ? apiKey.substring(0, 5) : "***");
        } else {
            logger.debug("API key format validation passed (starts with 'sk-')");
        }
    }
    
    /**
     * Gọi GPT Vision API để phân tích nhiều ảnh
     * 
     * @param prompt Prompt text
     * @param base64Images List các ảnh đã encode base64
     * @param modelName Tên model (gpt-4o-mini, gpt-4o, etc.)
     * @return Response text từ GPT
     */
    public String analyzeImagesWithVision(String prompt, List<String> base64Images, String modelName) 
            throws IOException {
        
        logger.info("Calling OpenAI API with model: {}, images count: {}, base URL: {}", 
                modelName, base64Images.size(), baseUrl);
        
        // Build request JSON
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", modelName);
        requestBody.put("max_tokens", 1000);
        requestBody.put("temperature", 0.2); // Low temperature for more consistent results
        
        // Messages array
        ArrayNode messages = requestBody.putArray("messages");
        
        // System message
        ObjectNode systemMessage = messages.addObject();
        systemMessage.put("role", "system");
        systemMessage.put("content", "Bạn là trợ lý AI chuyên nghiệp hỗ trợ chấm điểm rèn luyện sinh viên. " +
                "Bạn phân tích hình ảnh minh chứng và trả về JSON chuẩn, không giải thích thêm.");
        
        // User message with text + images
        ObjectNode userMessage = messages.addObject();
        userMessage.put("role", "user");
        
        // Content array (text + images)
        ArrayNode content = userMessage.putArray("content");
        
        // Text part
        ObjectNode textPart = content.addObject();
        textPart.put("type", "text");
        textPart.put("text", prompt);
        
        // Image parts
        for (String base64Image : base64Images) {
            ObjectNode imagePart = content.addObject();
            imagePart.put("type", "image_url");
            
            ObjectNode imageUrl = imagePart.putObject("image_url");
            imageUrl.put("url", "data:image/jpeg;base64," + base64Image);
            imageUrl.put("detail", "high"); // high/low/auto
        }
        
        // Response format (JSON mode)
        ObjectNode responseFormat = requestBody.putObject("response_format");
        responseFormat.put("type", "json_object");
        
        String requestJson = objectMapper.writeValueAsString(requestBody);
        
        // Create HTTP request
        RequestBody body = RequestBody.create(
                requestJson,
                MediaType.parse("application/json; charset=utf-8"));
        
        // Build API URL from base URL
        String apiUrl = baseUrl + "/chat/completions";
        
        // Validate API key before making request
        if (apiKey == null || apiKey.trim().isEmpty()) {
            logger.error("API key is null or empty when making request!");
            throw new IllegalStateException("OpenAI API key is not configured");
        }
        
        String trimmedApiKey = apiKey.trim();
        Request request = new Request.Builder()
                .url(apiUrl)
                .header("Authorization", "Bearer " + trimmedApiKey)
                .header("Content-Type", "application/json")
                .post(body)
                .build();
        
        logger.debug("Calling API endpoint: {} with API key length: {}", apiUrl, trimmedApiKey.length());
        
        // Execute request
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "No error body";
                logger.error("OpenAI API error: status={}, body={}", response.code(), errorBody);
                
                // Check for authentication errors
                if (response.code() == 401) {
                    logger.error("Authentication failed - API key might be invalid. Check your OPENAI_API_KEY configuration.");
                    throw new IOException("OpenAI API authentication failed. Please check your API key. Status: " + response.code());
                }
                
                throw new IOException("OpenAI API call failed: " + response.code() + " - " + errorBody);
            }
            
            String responseBody = response.body() != null ? response.body().string() : "{}";
            logger.debug("OpenAI API response: {}", responseBody);
            
            // Parse response
            JsonNode responseJson = objectMapper.readTree(responseBody);
            
            // Extract content from choices[0].message.content
            if (responseJson.has("choices") && responseJson.get("choices").isArray()) {
                JsonNode choices = responseJson.get("choices");
                if (choices.size() > 0) {
                    JsonNode firstChoice = choices.get(0);
                    if (firstChoice.has("message")) {
                        JsonNode message = firstChoice.get("message");
                        if (message.has("content")) {
                            String content_text = message.get("content").asText();
                            logger.info("OpenAI API call successful. Response length: {}", 
                                    content_text.length());
                            return content_text;
                        }
                    }
                }
            }
            
            throw new IOException("Invalid response format from OpenAI API");
        }
    }
    
    /**
     * Get the complete API endpoint URL
     */
    private String getApiUrl() {
        return baseUrl + "/chat/completions";
    }
}

