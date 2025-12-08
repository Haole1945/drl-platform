package ptit.drl.aivalidation.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.theokanning.openai.service.OpenAiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * OpenAI Configuration
 * ⚠️ CHÈN API KEY: Set environment variable OPENAI_API_KEY hoặc trong application.yml
 */
@Configuration
public class OpenAIConfig {
    
    @Value("${openai.api.key}")
    private String apiKey;
    
    @Value("${openai.api.timeout:60}")
    private int timeoutSeconds;
    
    @Bean
    public OpenAiService openAiService() {
        // ⚠️ CHÈN API KEY VÀO ĐÂY:
        // Option 1: Set environment variable OPENAI_API_KEY=your-key-here
        // Option 2: Set trong application.yml: openai.api.key: your-key-here
        // Option 3: Set trong .env.local file (cho local development)
        
        if (apiKey == null || apiKey.isEmpty()) {
            throw new IllegalStateException(
                "OpenAI API key is not set! " +
                "Please set OPENAI_API_KEY environment variable or configure in application.yml"
            );
        }
        
        return new OpenAiService(apiKey, Duration.ofSeconds(timeoutSeconds));
    }
    
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}

