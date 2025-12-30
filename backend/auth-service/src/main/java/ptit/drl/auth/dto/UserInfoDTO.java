package ptit.drl.auth.dto;

import java.time.LocalDateTime;

/**
 * DTO for user information including signature
 */
public class UserInfoDTO {
    private String username;
    private String fullName;
    private String email;
    private String classCode;
    private String signatureImageUrl;
    private LocalDateTime signatureUploadedAt;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getClassCode() {
        return classCode;
    }

    public void setClassCode(String classCode) {
        this.classCode = classCode;
    }

    public String getSignatureImageUrl() {
        return signatureImageUrl;
    }

    public void setSignatureImageUrl(String signatureImageUrl) {
        this.signatureImageUrl = signatureImageUrl;
    }

    public LocalDateTime getSignatureUploadedAt() {
        return signatureUploadedAt;
    }

    public void setSignatureUploadedAt(LocalDateTime signatureUploadedAt) {
        this.signatureUploadedAt = signatureUploadedAt;
    }
}
