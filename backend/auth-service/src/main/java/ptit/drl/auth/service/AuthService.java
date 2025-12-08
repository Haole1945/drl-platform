package ptit.drl.auth.service;

import feign.FeignException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptit.drl.auth.dto.*;
import ptit.drl.auth.entity.User;
import ptit.drl.auth.entity.Role;
import ptit.drl.auth.exception.AuthenticationException;
import ptit.drl.auth.exception.DuplicateResourceException;
import ptit.drl.auth.exception.ResourceNotFoundException;
import ptit.drl.auth.mapper.UserMapper;
import ptit.drl.auth.repository.UserRepository;
import ptit.drl.auth.repository.RoleRepository;
import ptit.drl.auth.util.JwtTokenProvider;
import ptit.drl.auth.client.StudentServiceClient;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for authentication and authorization
 * Uses Feign Client to communicate with student-service for student validation
 */
@Service
@Transactional
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Autowired
    private StudentServiceClient studentServiceClient;
    
    @Autowired
    private EmailService emailService;
    
    /**
     * Register a new user
     * Validates studentCode exists via student-service if provided
     */
    public UserDTO register(RegisterRequest request) {
        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("User", "username", request.getUsername());
        }
        
        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }
        
        // Validate studentCode if provided (for student users)
        String classCode = null;
        if (request.getStudentCode() != null && !request.getStudentCode().isEmpty()) {
            try {
                StudentServiceClient.StudentResponse studentResponse = 
                    studentServiceClient.getStudentByCode(request.getStudentCode());
                // If response is null or indicates failure, student doesn't exist
                if (studentResponse == null || !studentResponse.isSuccess() || studentResponse.getData() == null) {
                    throw new ResourceNotFoundException(
                        "Student", "code", request.getStudentCode());
                }
                // Extract classCode from student data
                if (studentResponse.getData() != null) {
                    classCode = studentResponse.getData().getClassCode();
                }
            } catch (ResourceNotFoundException e) {
                // Re-throw if already ResourceNotFoundException (from error decoder)
                // Update message to include actual studentCode
                throw new ResourceNotFoundException(
                    "Student", "code", request.getStudentCode());
            } catch (FeignException.NotFound e) {
                // Feign 404 exception (fallback if error decoder didn't catch it)
                throw new ResourceNotFoundException(
                    "Student", "code", request.getStudentCode());
            } catch (FeignException e) {
                // Other Feign exceptions (e.g., 500, 503)
                if (e.status() == 404) {
                    throw new ResourceNotFoundException(
                        "Student", "code", request.getStudentCode());
                }
                // For other errors, re-throw as generic exception
                throw new RuntimeException("Failed to validate student code: " + e.getMessage(), e);
            } catch (Exception e) {
                // Check if it's a ResourceNotFoundException wrapped in the exception
                if (e instanceof ResourceNotFoundException) {
                    throw (ResourceNotFoundException) e;
                }
                if (e.getCause() instanceof ResourceNotFoundException) {
                    throw (ResourceNotFoundException) e.getCause();
                }
                // If we can't determine, assume student doesn't exist
                throw new ResourceNotFoundException(
                    "Student", "code", request.getStudentCode());
            }
        }
        
        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setStudentCode(request.getStudentCode());
        user.setClassCode(classCode);
        user.setIsActive(true);
        
        // Assign default role (STUDENT)
        Role studentRole = roleRepository.findById("STUDENT")
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "STUDENT"));
        user.addRole(studentRole);
        
        User saved = userRepository.save(user);
        return UserMapper.toDTO(saved);
    }
    
    /**
     * Request password - Send password to student email
     * Extracts studentCode from email (format: studentCode@student.ptithcm.edu.vn)
     */
    public void requestPassword(RequestPasswordRequest request) {
        // Extract studentCode from email (e.g., n21dccn001@student.ptithcm.edu.vn -> n21dccn001)
        String email = request.getEmail();
        String studentCodeFromEmail = email.substring(0, email.indexOf('@'));
        String studentCode = studentCodeFromEmail.toUpperCase(); // Normalize to uppercase for lookup
        
        // Try to get student data from student-service (optional - not required)
        // If student doesn't exist, we'll still create the user account
        StudentServiceClient.StudentDTO studentData = null;
        try {
            StudentServiceClient.StudentResponse studentResponse = 
                studentServiceClient.getStudentByCode(studentCode);
            if (studentResponse != null && studentResponse.isSuccess() && studentResponse.getData() != null) {
                studentData = studentResponse.getData();
            }
            // If student not found, studentData remains null - we'll still create the user
        } catch (Exception e) {
            // Log but don't throw - we'll create user anyway if email format is valid
            // studentData remains null
        }
        
        // Normalize username to lowercase (e.g., n21dccn001)
        String username = studentCodeFromEmail.toLowerCase();
        
        // Check if user already exists (by email or username)
        User existingUser = userRepository.findByEmail(email)
                .orElse(userRepository.findByUsernameIgnoreCase(username).orElse(null));
        String password;
        
        if (existingUser != null) {
            // User exists, generate new password
            password = generateRandomPassword();
            existingUser.setPasswordHash(passwordEncoder.encode(password));
            // Update fullName and classCode from student data if available
            if (studentData != null) {
                if (studentData.getFullName() != null) {
                    existingUser.setFullName(studentData.getFullName());
                }
                if (studentData.getClassCode() != null) {
                    existingUser.setClassCode(studentData.getClassCode());
                }
            }
            
            // Auto-assign CLASS_MONITOR role if student position is CLASS_MONITOR
            if (studentData != null && "CLASS_MONITOR".equalsIgnoreCase(studentData.getPosition())) {
                Role classMonitorRole = roleRepository.findById("CLASS_MONITOR")
                        .orElse(null);
                if (classMonitorRole != null && !existingUser.getRoles().contains(classMonitorRole)) {
                    existingUser.addRole(classMonitorRole);
                }
            }
            
            userRepository.save(existingUser);
        } else {
            // Create new user - only when requesting password for the first time
            password = generateRandomPassword();
            User user = new User();
            user.setUsername(username); // Use lowercase studentCode as username (e.g., n21dccn001)
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode(password));
            // Set fullName from student data
            user.setFullName(studentData != null && studentData.getFullName() != null 
                    ? studentData.getFullName() 
                    : studentCode);
            user.setStudentCode(studentCode);
            user.setClassCode(studentData != null ? studentData.getClassCode() : null);
            user.setIsActive(true);
            
            // Assign default role (STUDENT)
            Role studentRole = roleRepository.findById("STUDENT")
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "STUDENT"));
            user.addRole(studentRole);
            
            // Auto-assign CLASS_MONITOR role if student position is CLASS_MONITOR
            if (studentData != null && "CLASS_MONITOR".equalsIgnoreCase(studentData.getPosition())) {
                Role classMonitorRole = roleRepository.findById("CLASS_MONITOR")
                        .orElse(null);
                if (classMonitorRole != null) {
                    user.addRole(classMonitorRole);
                }
            }
            
            userRepository.save(user);
        }
        
        // Send password via email
        emailService.sendPasswordEmail(email, studentCode, password);
    }
    
    /**
     * Generate random password (8-12 characters, alphanumeric)
     */
    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder password = new StringBuilder();
        java.util.Random random = new java.util.Random();
        int length = 8 + random.nextInt(5); // 8-12 characters
        
        // Ensure at least one uppercase, one lowercase, one digit
        password.append(chars.charAt(random.nextInt(26))); // Uppercase
        password.append(chars.charAt(26 + random.nextInt(26))); // Lowercase
        password.append(chars.charAt(52 + random.nextInt(10))); // Digit
        
        // Fill rest randomly
        for (int i = 3; i < length; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        // Shuffle
        char[] passwordArray = password.toString().toCharArray();
        for (int i = passwordArray.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = passwordArray[i];
            passwordArray[i] = passwordArray[j];
            passwordArray[j] = temp;
        }
        
        return new String(passwordArray);
    }
    
    /**
     * Authenticate user and generate tokens
     * Now supports both email and username login (case-insensitive for username)
     */
    public AuthResponse login(LoginRequest request) {
        String loginInput = request.getUsername().trim();
        User user = null;
        
        // Try to find user by email first (optimized with fetch join)
        if (loginInput.contains("@")) {
            user = userRepository.findByEmail(loginInput).orElse(null);
        }
        
        // If not found by email, try by username (case-insensitive, optimized)
        if (user == null) {
            user = userRepository.findByUsernameIgnoreCase(loginInput.toLowerCase())
                    .orElseThrow(() -> new AuthenticationException("Invalid email/username or password"));
        }
        
        // Check if account is active
        if (!user.getIsActive()) {
            throw new AuthenticationException("Account is inactive. Please contact administrator.");
        }
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Invalid username or password");
        }
        
        // Get roles and permissions
        Set<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
        
        Set<String> permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(ptit.drl.auth.entity.Permission::getName)
                .collect(Collectors.toSet());
        
        // Fetch classCode from student-service if user has studentCode
        if (user.getStudentCode() != null && !user.getStudentCode().isEmpty()) {
            try {
                StudentServiceClient.StudentResponse studentResponse = 
                    studentServiceClient.getStudentByCode(user.getStudentCode());
                if (studentResponse != null && studentResponse.isSuccess() && 
                    studentResponse.getData() != null && studentResponse.getData().getClassCode() != null) {
                    user.setClassCode(studentResponse.getData().getClassCode());
                }
            } catch (Exception e) {
                // Failed to fetch classCode - continue without it
            }
        }
        
        // Generate tokens
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getUsername(), roles, permissions);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());
        
        // Create response
        AuthResponse response = new AuthResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setExpiresIn(jwtTokenProvider.getAccessTokenExpiration());
        response.setRefreshExpiresIn(jwtTokenProvider.getRefreshTokenExpiration());
        response.setUser(UserMapper.toDTO(user));
        
        return response;
    }
    
    /**
     * Refresh access token
     */
    public AuthResponse refreshToken(String refreshToken) {
        // Validate refresh token
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new AuthenticationException("Invalid or expired refresh token");
        }
        
        // Get user ID from token
        Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        
        // Find user (optimized with fetch join)
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new AuthenticationException("User not found for refresh token"));
        
        // Check if account is active
        if (!user.getIsActive()) {
            throw new AuthenticationException("Account is inactive. Please contact administrator.");
        }
        
        // Get roles and permissions
        Set<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
        
        Set<String> permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(ptit.drl.auth.entity.Permission::getName)
                .collect(Collectors.toSet());
        
        // Fetch classCode from student-service if user has studentCode
        if (user.getStudentCode() != null && !user.getStudentCode().isEmpty()) {
            try {
                StudentServiceClient.StudentResponse studentResponse = 
                    studentServiceClient.getStudentByCode(user.getStudentCode());
                if (studentResponse != null && studentResponse.isSuccess() && 
                    studentResponse.getData() != null && studentResponse.getData().getClassCode() != null) {
                    user.setClassCode(studentResponse.getData().getClassCode());
                }
            } catch (Exception e) {
                // Failed to fetch classCode - continue without it
            }
        }
        
        // Generate new access token
        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getUsername(), roles, permissions);
        
        // Create response (refresh token stays the same)
        AuthResponse response = new AuthResponse();
        response.setAccessToken(newAccessToken);
        response.setRefreshToken(refreshToken); // Keep same refresh token
        response.setExpiresIn(jwtTokenProvider.getAccessTokenExpiration());
        response.setRefreshExpiresIn(jwtTokenProvider.getRefreshTokenExpiration());
        response.setUser(UserMapper.toDTO(user));
        
        return response;
    }
    
    /**
     * Get current user information
     */
    @Transactional(readOnly = true)
    public UserDTO getCurrentUser(Long userId) {
        // Use optimized query with fetch join to avoid N+1 queries
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Fetch classCode from student-service if user has studentCode
        if (user.getStudentCode() != null && !user.getStudentCode().isEmpty()) {
            try {
                StudentServiceClient.StudentResponse studentResponse = 
                    studentServiceClient.getStudentByCode(user.getStudentCode());
                if (studentResponse != null && studentResponse.isSuccess() && 
                    studentResponse.getData() != null && studentResponse.getData().getClassCode() != null) {
                    user.setClassCode(studentResponse.getData().getClassCode());
                }
            } catch (Exception e) {
                // Failed to fetch classCode - continue without it
            }
        }
        
        return UserMapper.toDTO(user);
    }
    
    /**
     * Get all active user IDs (for sending notifications)
     */
    /**
     * Get user ID by student code
     * Used by evaluation-service to send notifications
     */
    @Transactional(readOnly = true)
    public Long getUserIdByStudentCode(String studentCode) {
        User user = userRepository.findByStudentCode(studentCode)
                .orElse(null);
        return user != null ? user.getId() : null;
    }
    
    public java.util.List<Long> getAllActiveUserIds() {
        return userRepository.findAll().stream()
                .filter(User::getIsActive)
                .map(User::getId)
                .collect(Collectors.toList());
    }
    
    /**
     * Get user IDs by role (for notifications)
     */
    @Transactional(readOnly = true)
    public java.util.List<Long> getUserIdsByRole(String roleName) {
        return userRepository.findUserIdsByRole(roleName);
    }
    
    /**
     * Get user IDs by role and class code (for notifications)
     */
    @Transactional(readOnly = true)
    public java.util.List<Long> getUserIdsByRoleAndClassCode(String roleName, String classCode) {
        return userRepository.findUserIdsByRoleAndClassCode(roleName, classCode);
    }
    
    /**
     * Change user password
     */
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new AuthenticationException("Current password is incorrect");
        }
        
        // Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
    
    /**
     * Get all users with pagination and filters
     */
    @Transactional(readOnly = true)
    public Page<UserDTO> getAllUsers(Pageable pageable, String search, String role, Boolean isActive) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Search filter (username, email, studentCode, fullName)
            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate usernamePred = cb.like(cb.lower(root.get("username")), searchPattern);
                Predicate emailPred = cb.like(cb.lower(root.get("email")), searchPattern);
                Predicate studentCodePred = cb.like(cb.lower(root.get("studentCode")), searchPattern);
                Predicate fullNamePred = cb.like(cb.lower(root.get("fullName")), searchPattern);
                predicates.add(cb.or(usernamePred, emailPred, studentCodePred, fullNamePred));
            }
            
            // Role filter
            if (role != null && !role.trim().isEmpty()) {
                predicates.add(cb.equal(root.join("roles").get("name"), role));
            }
            
            // Active filter
            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        
        return userRepository.findAll(spec, pageable)
                .map(UserMapper::toDTO);
    }
    
    /**
     * Get user by ID
     */
    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return UserMapper.toDTO(user);
    }
    
    /**
     * Activate user
     */
    public UserDTO activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setIsActive(true);
        User saved = userRepository.save(user);
        return UserMapper.toDTO(saved);
    }
    
    /**
     * Deactivate user
     */
    public UserDTO deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setIsActive(false);
        User saved = userRepository.save(user);
        return UserMapper.toDTO(saved);
    }
    
    /**
     * Update user roles
     */
    public UserDTO updateUserRoles(Long id, List<String> roleNames) {
        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        // Clear existing roles
        user.getRoles().clear();
        
        // Add new roles
        if (roleNames != null && !roleNames.isEmpty()) {
            for (String roleName : roleNames) {
                Role role = roleRepository.findById(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName));
                user.addRole(role);
            }
        }
        
        User saved = userRepository.save(user);
        return UserMapper.toDTO(saved);
    }
    
    /**
     * Get all available role names
     */
    @Transactional(readOnly = true)
    public List<String> getAllRoleNames() {
        return roleRepository.findAll().stream()
                .map(Role::getName)
                .sorted()
                .collect(Collectors.toList());
    }
}

