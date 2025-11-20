package ptit.drl.auth.repository;

import ptit.drl.auth.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {
    // Primary key is 'name', so findById(String name) is already available
}

