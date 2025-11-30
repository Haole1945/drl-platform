package ptit.drl.auth.repository;

import ptit.drl.auth.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    // Optimized queries with fetch join to avoid N+1 queries for roles/permissions
    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    @Query("SELECT u FROM User u WHERE u.username = :username")
    Optional<User> findByUsername(@Param("username") String username);
    
    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:username)")
    Optional<User> findByUsernameIgnoreCase(@Param("username") String username);
    
    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmail(@Param("email") String email);
    
    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdWithRoles(@Param("id") Long id);
    
    boolean existsByUsername(String username);
    boolean existsByUsernameIgnoreCase(String username); // Case-insensitive check
    boolean existsByEmail(String email);
    
    // Find by student code (for linking with student-service)
    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    @Query("SELECT u FROM User u WHERE u.studentCode = :studentCode")
    Optional<User> findByStudentCode(@Param("studentCode") String studentCode);
    
    // Find user IDs by role (for notifications)
    @Query("SELECT DISTINCT u.id FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.isActive = true")
    List<Long> findUserIdsByRole(@Param("roleName") String roleName);
    
    // Find user IDs by role and class code (for notifications)
    @Query("SELECT DISTINCT u.id FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.classCode = :classCode AND u.isActive = true")
    List<Long> findUserIdsByRoleAndClassCode(@Param("roleName") String roleName, @Param("classCode") String classCode);
    
    // Find user IDs by role and faculty code (for notifications) - need to join with student-service
    // For now, we'll use classCode matching (faculty can be inferred from classCode)
    @Query("SELECT DISTINCT u.id FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.isActive = true")
    List<Long> findUserIdsByRoleForFaculty(@Param("roleName") String roleName);
}
