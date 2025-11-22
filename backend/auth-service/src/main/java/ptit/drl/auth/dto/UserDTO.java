package ptit.drl.auth.dto;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * DTO for user information
 */
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String studentCode;
    private String classCode; // Class code from student record (e.g., "D21DCCN01-N")
    private Set<String> roles;
    private Set<String> permissions;
    private Boolean isActive;
    private LocalDateTime createdAt;
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public String getStudentCode() {
        return studentCode;
    }
    
    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }
    
    public String getClassCode() {
        return classCode;
    }
    
    public void setClassCode(String classCode) {
        this.classCode = classCode;
    }
    
    public Set<String> getRoles() {
        return roles;
    }
    
    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }
    
    public Set<String> getPermissions() {
        return permissions;
    }
    
    public void setPermissions(Set<String> permissions) {
        this.permissions = permissions;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

