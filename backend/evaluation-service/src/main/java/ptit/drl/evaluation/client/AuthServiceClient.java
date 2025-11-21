package ptit.drl.evaluation.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Feign Client for communicating with auth-service
 * Uses service discovery to find auth-service via Eureka
 */
@FeignClient(name = "auth-service", path = "/auth")
public interface AuthServiceClient {
    
    /**
     * Get all active user IDs (for sending notifications)
     * @return List of user IDs
     */
    @GetMapping("/users/ids")
    UserIdsResponse getAllUserIds();
    
    /**
     * Get user ID by student code
     * @param studentCode Student code (e.g., N21DCCN001)
     * @return User ID response
     */
    @GetMapping("/users/student/{studentCode}")
    UserIdResponse getUserIdByStudentCode(@PathVariable String studentCode);
    
    /**
     * Response wrapper for user IDs
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    class UserIdsResponse {
        @JsonProperty("success")
        private boolean success;
        
        @JsonProperty("message")
        private String message;
        
        @JsonProperty("data")
        private List<Long> data;
        
        @JsonProperty("errors")
        private List<String> errors;
        
        @JsonProperty("timestamp")
        private LocalDateTime timestamp;
        
        // Constructors
        public UserIdsResponse() {
        }
        
        // Getters and Setters
        public boolean isSuccess() {
            return success;
        }
        
        public void setSuccess(boolean success) {
            this.success = success;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
        
        public List<Long> getData() {
            return data;
        }
        
        public void setData(List<Long> data) {
            this.data = data;
        }
        
        public List<String> getErrors() {
            return errors;
        }
        
        public void setErrors(List<String> errors) {
            this.errors = errors;
        }
        
        public LocalDateTime getTimestamp() {
            return timestamp;
        }
        
        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }
    }
    
    /**
     * Response wrapper for user ID
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    class UserIdResponse {
        @JsonProperty("success")
        private boolean success;
        
        @JsonProperty("message")
        private String message;
        
        @JsonProperty("data")
        private Long data;
        
        @JsonProperty("errors")
        private List<String> errors;
        
        @JsonProperty("timestamp")
        private LocalDateTime timestamp;
        
        // Constructors
        public UserIdResponse() {
        }
        
        // Getters and Setters
        public boolean isSuccess() {
            return success;
        }
        
        public void setSuccess(boolean success) {
            this.success = success;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
        
        public Long getData() {
            return data;
        }
        
        public void setData(Long data) {
            this.data = data;
        }
        
        public List<String> getErrors() {
            return errors;
        }
        
        public void setErrors(List<String> errors) {
            this.errors = errors;
        }
        
        public LocalDateTime getTimestamp() {
            return timestamp;
        }
        
        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }
    }
}

