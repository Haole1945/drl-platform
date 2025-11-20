package ptit.drl.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for user login
 */
public class LoginRequest {
    
    @NotBlank(message = "Email or username is required")
    private String username; // Can be email or username
    
    @NotBlank(message = "Password is required")
    private String password;
    
    // Getters and Setters
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
}

