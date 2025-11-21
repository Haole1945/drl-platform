package ptit.drl.auth.api;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptit.drl.auth.dto.ApiResponse;
import ptit.drl.auth.dto.UserDTO;
import ptit.drl.auth.service.AuthService;

import java.util.List;

/**
 * REST Controller for User Management
 * Admin only
 */
@RestController
@RequestMapping("/auth/users")
public class UserController {
    
    @Autowired
    private AuthService authService;
    
    /**
     * GET /auth/users - Get all users with pagination and filters
     * Query params: page, size, search (username, email, studentCode), role, isActive
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<UserDTO>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserDTO> users = authService.getAllUsers(pageable, search, role, isActive);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }
    
    /**
     * GET /auth/users/{id} - Get user by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Long id) {
        UserDTO user = authService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User found", user));
    }
    
    /**
     * PUT /auth/users/{id}/activate - Activate user
     */
    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> activateUser(@PathVariable Long id) {
        UserDTO user = authService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User activated successfully", user));
    }
    
    /**
     * PUT /auth/users/{id}/deactivate - Deactivate user
     */
    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> deactivateUser(@PathVariable Long id) {
        UserDTO user = authService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated successfully", user));
    }
    
    /**
     * PUT /auth/users/{id}/roles - Update user roles
     */
    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> updateUserRoles(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRolesRequest request) {
        UserDTO user = authService.updateUserRoles(id, request.getRoleNames());
        return ResponseEntity.ok(ApiResponse.success("User roles updated successfully", user));
    }
    
    /**
     * GET /auth/users/roles - Get all available roles
     */
    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<String>>> getAllRoles() {
        List<String> roles = authService.getAllRoleNames();
        return ResponseEntity.ok(ApiResponse.success("Roles retrieved successfully", roles));
    }
    
    /**
     * Request DTO for updating user roles
     */
    public static class UpdateUserRolesRequest {
        private List<String> roleNames;
        
        public List<String> getRoleNames() {
            return roleNames;
        }
        
        public void setRoleNames(List<String> roleNames) {
            this.roleNames = roleNames;
        }
    }
}

