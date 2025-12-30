package ptit.drl.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ptit.drl.auth.dto.SignatureDTO;
import ptit.drl.auth.entity.User;
import ptit.drl.auth.exception.NotFoundException;
import ptit.drl.auth.exception.ValidationException;
import ptit.drl.auth.repository.UserRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class SignatureService {
    
    @Value("${file.upload.dir:/app/files/signatures}")
    private String uploadDir;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Upload signature image file
     */
    @Transactional
    public SignatureDTO uploadSignature(MultipartFile file, Long userId) throws IOException {
        // Validate file
        validateSignatureFile(file);
        
        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        // Calculate hash
        byte[] fileBytes = file.getBytes();
        String hash = calculateSHA256(fileBytes);
        
        // Save file
        String filename = "user_" + userId + ".png";
        Path uploadPath = Paths.get(uploadDir);
        
        // Create directory if not exists
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Update user
        user.setSignatureImageUrl("/files/signatures/" + filename);
        user.setSignatureUploadedAt(LocalDateTime.now());
        user.setSignatureHash(hash);
        userRepository.save(user);
        
        return mapToDTO(user);
    }
    
    /**
     * Save drawn signature (base64 data)
     */
    @Transactional
    public SignatureDTO saveDrawnSignature(String base64Data, Long userId) throws IOException {
        // Validate base64 data
        if (base64Data == null || base64Data.isEmpty()) {
            throw new ValidationException("Signature data is required");
        }
        
        // Remove data URL prefix if present
        String base64Image = base64Data;
        if (base64Data.contains(",")) {
            base64Image = base64Data.split(",")[1];
        }
        
        // Decode base64
        byte[] imageBytes;
        try {
            imageBytes = Base64.getDecoder().decode(base64Image);
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid base64 data");
        }
        
        // Validate size
        if (imageBytes.length > 500 * 1024) {
            throw new ValidationException("Signature image too large (max 500KB)");
        }
        
        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        // Calculate hash
        String hash = calculateSHA256(imageBytes);
        
        // Save file
        String filename = "user_" + userId + ".png";
        Path uploadPath = Paths.get(uploadDir);
        
        // Create directory if not exists
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        Path filePath = uploadPath.resolve(filename);
        Files.write(filePath, imageBytes);
        
        // Update user
        user.setSignatureImageUrl("/files/signatures/" + filename);
        user.setSignatureUploadedAt(LocalDateTime.now());
        user.setSignatureHash(hash);
        userRepository.save(user);
        
        return mapToDTO(user);
    }
    
    /**
     * Get user's signature
     */
    public SignatureDTO getSignature(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return mapToDTO(user);
    }
    
    /**
     * Delete user's signature
     */
    @Transactional
    public void deleteSignature(Long userId) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        // Delete file if exists
        if (user.getSignatureImageUrl() != null) {
            String filename = "user_" + userId + ".png";
            Path filePath = Paths.get(uploadDir, filename);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        }
        
        // Clear signature fields
        user.setSignatureImageUrl(null);
        user.setSignatureUploadedAt(null);
        user.setSignatureHash(null);
        userRepository.save(user);
    }
    
    /**
     * Validate signature file
     */
    private void validateSignatureFile(MultipartFile file) {
        // Check if file is empty
        if (file.isEmpty()) {
            throw new ValidationException("File is empty");
        }
        
        // Check size (max 500KB)
        if (file.getSize() > 500 * 1024) {
            throw new ValidationException("File too large (max 500KB)");
        }
        
        // Check type
        String contentType = file.getContentType();
        if (contentType == null || 
            (!contentType.equals("image/png") && !contentType.equals("image/jpeg"))) {
            throw new ValidationException("Invalid file type (only PNG and JPEG allowed)");
        }
    }
    
    /**
     * Calculate SHA-256 hash
     */
    private String calculateSHA256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
    
    /**
     * Convert byte array to hex string
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
    
    /**
     * Map User to SignatureDTO
     */
    private SignatureDTO mapToDTO(User user) {
        return new SignatureDTO(
            user.getSignatureImageUrl(),
            user.getSignatureUploadedAt(),
            user.getSignatureHash()
        );
    }
}
