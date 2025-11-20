package ptit.drl.student.repository;

import ptit.drl.student.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {
    // Primary key is 'name', so findById(String name) and existsById(String name) are already available
}

