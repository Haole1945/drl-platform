package ptit.drl.auth.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ptit.drl.auth.dto.ApiResponse;
import ptit.drl.auth.dto.SignatureDTO;
import ptit.drl.auth.service.SignatureService;
import ptit.drl.auth.util.JwtTokenProvider;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/auth/signature")
public class SignatureController {
    
    @Autowired
    private SignatureService signatureService;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    /**
     * POST /auth/signature/upload - Upload signature image
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<SignatureDTO>> uploadSignature(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("file") MultipartFile file) {
        
        // Validate authorization
        Long userId = validateAndGetUserId(authorization);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authorization header missing or invalid"));
        }
        
        try {
            SignatureDTO signature = signatureService.uploadSignature(file, userId);
            return ResponseEntity.ok(ApiResponse.success("Signature uploaded successfully", signature));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to upload signature: " + e.getMessage()));
        }
    }
    
    /**
     * POST /auth/signature/draw - Save drawn signature
     */
    @PostMapping("/draw")
    public ResponseEntity<ApiResponse<SignatureDTO>> saveDrawnSignature(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, String> request) {
        
        // Validate authorization
        Long userId = validateAndGetUserId(authorization);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authorization header missing or invalid"));
        }
        
        String imageData = request.get("imageData");
        if (imageData == null || imageData.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Image data is required"));
        }
        
        try {
            SignatureDTO signature = signatureService.saveDrawnSignature(imageData, userId);
            return ResponseEntity.ok(ApiResponse.success("Signature saved successfully", signature));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to save signature: " + e.getMessage()));
        }
    }
    
    /**
     * GET /auth/signature - Get current user's signature
     */
    @GetMapping
    public ResponseEntity<ApiResponse<SignatureDTO>> getSignature(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        
        // Validate authorization
        Long userId = validateAndGetUserId(authorization);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authorization header missing or invalid"));
        }
        
        SignatureDTO signature = signatureService.getSignature(userId);
        return ResponseEntity.ok(ApiResponse.success("Signature retrieved", signature));
    }
    
    /**
     * DELETE /auth/signature - Delete signature
     */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteSignature(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        
        // Validate authorization
        Long userId = validateAndGetUserId(authorization);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authorization header missing or invalid"));
        }
        
        try {
            signatureService.deleteSignature(userId);
            return ResponseEntity.ok(ApiResponse.success("Signature deleted successfully", null));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete signature: " + e.getMessage()));
        }
    }
    
    /**
     * Helper method to validate authorization and extract user ID
     */
    private Long validateAndGetUserId(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        
        String token = authorization.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            return null;
        }
        
        return jwtTokenProvider.getUserIdFromToken(token);
    }
}
