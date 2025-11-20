package ptit.drl.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request password DTO
 * Student enters their school email to receive password
 */
public class RequestPasswordRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Pattern(
        regexp = "^[a-z0-9]+@student\\.ptithcm\\.edu\\.vn$",
        message = "Email must be a valid school email (format: studentCode@student.ptithcm.edu.vn)"
    )
    private String email;
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
}

