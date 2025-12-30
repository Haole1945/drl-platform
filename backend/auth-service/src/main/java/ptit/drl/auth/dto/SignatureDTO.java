package ptit.drl.auth.dto;

import java.time.LocalDateTime;

public class SignatureDTO {
    private String signatureUrl;
    private LocalDateTime uploadedAt;
    private String hash;
    private boolean hasSignature;
    
    public SignatureDTO() {}
    
    public SignatureDTO(String signatureUrl, LocalDateTime uploadedAt, String hash) {
        this.signatureUrl = signatureUrl;
        this.uploadedAt = uploadedAt;
        this.hash = hash;
        this.hasSignature = signatureUrl != null && !signatureUrl.isEmpty();
    }
    
    // Getters and Setters
    public String getSignatureUrl() {
        return signatureUrl;
    }
    
    public void setSignatureUrl(String signatureUrl) {
        this.signatureUrl = signatureUrl;
        this.hasSignature = signatureUrl != null && !signatureUrl.isEmpty();
    }
    
    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }
    
    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
    
    public String getHash() {
        return hash;
    }
    
    public void setHash(String hash) {
        this.hash = hash;
    }
    
    public boolean isHasSignature() {
        return hasSignature;
    }
    
    public void setHasSignature(boolean hasSignature) {
        this.hasSignature = hasSignature;
    }
}
