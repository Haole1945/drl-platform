package ptit.drl.auth.service;

import org.springframework.stereotype.Service;
import ptit.drl.auth.dto.UserInfoDTO;
import ptit.drl.auth.entity.User;
import ptit.drl.auth.repository.UserRepository;

import java.util.Optional;

/**
 * Service for getting class-related users
 */
@Service
public class ClassUsersService {

    private final UserRepository userRepository;

    public ClassUsersService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Get advisor (CVHT) for a specific class
     * Assumes advisor has ADVISOR role and classCode matches
     */
    public UserInfoDTO getClassAdvisor(String classCode) {
        System.out.println("[CLASS-USERS] Finding advisor for class: " + classCode);
        
        // Find user with ADVISOR role and matching classCode
        Optional<User> advisor = userRepository.findAll().stream()
            .filter(user -> {
                boolean hasClassCode = user.getClassCode() != null && user.getClassCode().equals(classCode);
                System.out.println("[CLASS-USERS] User: " + user.getUsername() + ", classCode: " + user.getClassCode() + ", matches: " + hasClassCode);
                return hasClassCode;
            })
            .filter(user -> {
                boolean hasRole = user.getRoles().stream()
                    .anyMatch(role -> {
                        boolean matches = role.getName().equals("ADVISOR") || role.getName().equals("ROLE_ADVISOR");
                        System.out.println("[CLASS-USERS] User: " + user.getUsername() + ", role: " + role.getName() + ", isAdvisor: " + matches);
                        return matches;
                    });
                return hasRole;
            })
            .findFirst();
        
        if (advisor.isPresent()) {
            System.out.println("[CLASS-USERS] Found advisor: " + advisor.get().getUsername());
            UserInfoDTO dto = mapToUserInfoDTO(advisor.get());
            System.out.println("[CLASS-USERS] Advisor DTO: username=" + dto.getUsername() + ", signatureUrl=" + dto.getSignatureImageUrl());
            return dto;
        }
        
        System.out.println("[CLASS-USERS] No advisor found for class: " + classCode);
        return null;
    }

    /**
     * Get class monitor (Lớp trưởng) for a specific class
     * Assumes class monitor has CLASS_MONITOR role
     */
    public UserInfoDTO getClassMonitor(String classCode) {
        System.out.println("[CLASS-USERS] Finding class monitor for class: " + classCode);
        
        // Find user with CLASS_MONITOR role and matching classCode
        Optional<User> monitor = userRepository.findAll().stream()
            .filter(user -> user.getClassCode() != null && user.getClassCode().equals(classCode))
            .filter(user -> user.getRoles().stream()
                .anyMatch(role -> role.getName().equals("CLASS_MONITOR") || role.getName().equals("ROLE_CLASS_MONITOR")))
            .findFirst();
        
        if (monitor.isPresent()) {
            System.out.println("[CLASS-USERS] Found monitor: " + monitor.get().getUsername());
            UserInfoDTO dto = mapToUserInfoDTO(monitor.get());
            System.out.println("[CLASS-USERS] Monitor DTO: username=" + dto.getUsername() + ", signatureUrl=" + dto.getSignatureImageUrl());
            return dto;
        }
        
        System.out.println("[CLASS-USERS] No class monitor found for class: " + classCode);
        return null;
    }
    
    /**
     * Get student user by student code
     */
    public UserInfoDTO getStudentByCode(String studentCode) {
        System.out.println("[CLASS-USERS] Finding student with code: " + studentCode);
        
        // Find user with matching studentCode
        Optional<User> student = userRepository.findAll().stream()
            .filter(user -> user.getStudentCode() != null && user.getStudentCode().equals(studentCode))
            .findFirst();
        
        if (student.isPresent()) {
            System.out.println("[CLASS-USERS] Found student: " + student.get().getUsername());
            UserInfoDTO dto = mapToUserInfoDTO(student.get());
            System.out.println("[CLASS-USERS] Student DTO: username=" + dto.getUsername() + ", signatureUrl=" + dto.getSignatureImageUrl());
            return dto;
        }
        
        System.out.println("[CLASS-USERS] No student found with code: " + studentCode);
        return null;
    }

    private UserInfoDTO mapToUserInfoDTO(User user) {
        UserInfoDTO dto = new UserInfoDTO();
        dto.setUsername(user.getUsername());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setClassCode(user.getClassCode());
        dto.setSignatureImageUrl(user.getSignatureImageUrl());
        dto.setSignatureUploadedAt(user.getSignatureUploadedAt());
        return dto;
    }
}
