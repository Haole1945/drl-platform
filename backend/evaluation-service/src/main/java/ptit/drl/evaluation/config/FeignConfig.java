package ptit.drl.evaluation.config;

import feign.Response;
import feign.codec.ErrorDecoder;
import feign.codec.ErrorDecoder.Default;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import ptit.drl.evaluation.exception.ResourceNotFoundException;

/**
 * Feign Client Configuration
 * Handles errors from Feign client calls
 */
@Configuration
public class FeignConfig {
    
    @Bean
    public ErrorDecoder errorDecoder() {
        return new CustomErrorDecoder();
    }
    
    /**
     * Custom error decoder to handle Feign exceptions
     */
    public static class CustomErrorDecoder implements ErrorDecoder {
        private final ErrorDecoder defaultErrorDecoder = new Default();
        
        @Override
        public Exception decode(String methodKey, Response response) {
            if (response.status() == HttpStatus.NOT_FOUND.value()) {
                // Try to extract studentCode from methodKey or response
                // methodKey format: StudentServiceClient#getStudentByCode(String)
                String resourceId = "not found";
                if (methodKey.contains("getStudentByCode")) {
                    resourceId = "student code";
                }
                return new ResourceNotFoundException("Student", "code", resourceId);
            }
            return defaultErrorDecoder.decode(methodKey, response);
        }
    }
}

