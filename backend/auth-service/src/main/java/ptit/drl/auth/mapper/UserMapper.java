package ptit.drl.auth.mapper;

import ptit.drl.auth.dto.UserDTO;
import ptit.drl.auth.entity.User;
import ptit.drl.auth.entity.Role;
import ptit.drl.auth.entity.Permission;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Mapper for User entity and DTOs
 */
public class UserMapper {
    
    /**
     * Convert User entity to UserDTO
     */
    public static UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }
        
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setStudentCode(user.getStudentCode());
        dto.setIsActive(user.getIsActive());
        dto.setCreatedAt(user.getCreatedAt());
        
        // Map roles
        if (user.getRoles() != null) {
            Set<String> roleNames = user.getRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.toSet());
            dto.setRoles(roleNames);
        }
        
        // Map permissions (from all roles)
        if (user.getRoles() != null) {
            Set<String> permissions = user.getRoles().stream()
                    .flatMap(role -> role.getPermissions().stream())
                    .map(Permission::getName)
                    .collect(Collectors.toSet());
            dto.setPermissions(permissions);
        }
        
        return dto;
    }
}

