package ptit.drl.auth.repository;

import ptit.drl.auth.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {
    // Primary key is 'name', so findById(String name) and existsById(String name) are already available
}

