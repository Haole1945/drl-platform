package ptit.drl.auth.api;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ptit.drl.auth.dto.*;
import ptit.drl.auth.dto.RequestPasswordRequest;
import ptit.drl.auth.service.AuthService;
import ptit.drl.auth.util.JwtTokenProvider;

/**
 * REST Controller for Authentication
 */
@RestController
@RequestMapping("/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    /**
     * POST /auth/register - Register new user (DEPRECATED - Use request-password instead)
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDTO>> register(@Valid @RequestBody RegisterRequest request) {
        UserDTO user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", user));
    }
    
    /**
     * POST /auth/request-password - Request password via email
     * Student enters their school email, system sends password
     */
    @PostMapping("/request-password")
    public ResponseEntity<ApiResponse<Void>> requestPassword(@Valid @RequestBody RequestPasswordRequest request) {
        authService.requestPassword(request);
        return ResponseEntity.ok(ApiResponse.success(
            "Password has been sent to your email. Please check your inbox.", null));
    }
    
    /**
     * POST /auth/login - Login and get tokens
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
    
    /**
     * POST /auth/refresh - Refresh access token
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }
    
    /**
     * GET /auth/me - Get current user information
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        // Check if Authorization header is present
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authorization header missing or invalid"));
        }
        
        // Extract token from "Bearer {token}"
        String token = authorization.substring(7);
        
        // Validate token
        if (!jwtTokenProvider.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid token"));
        }
        
        // Get user ID from token
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        
        // Get user info
        UserDTO user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User information retrieved", user));
    }
    
    /**
     * POST /auth/logout - Logout (invalidate refresh token)
     * Note: In a stateless JWT system, logout is handled client-side by removing tokens
     * For server-side invalidation, we would need a token blacklist (Redis)
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody(required = false) RefreshTokenRequest request) {
        // In a stateless system, logout is handled client-side
        // Future: Implement token blacklist with Redis
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }
    
    /**
     * GET /auth/users/ids - Get all active user IDs (for notifications)
     * Internal use only - for evaluation-service to send notifications
     */
    @GetMapping("/users/ids")
    public ResponseEntity<ApiResponse<java.util.List<Long>>> getAllUserIds() {
        java.util.List<Long> userIds = authService.getAllActiveUserIds();
        return ResponseEntity.ok(ApiResponse.success("Active user IDs retrieved", userIds));
    }
    
    /**
     * POST /auth/change-password - Change user password
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody ptit.drl.auth.dto.ChangePasswordRequest request) {
        
        // Check if Authorization header is present
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authorization header missing or invalid"));
        }
        
        // Extract token from "Bearer {token}"
        String token = authorization.substring(7);
        
        // Validate token
        if (!jwtTokenProvider.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid token"));
        }
        
        // Get user ID from token
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        
        // Validate new password matches confirm password
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("New password and confirm password do not match"));
        }
        
        // Change password
        authService.changePassword(userId, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}

