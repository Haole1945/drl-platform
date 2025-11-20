package ptit.drl.student.repository;

import ptit.drl.student.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {
    // Primary key is 'name', so findById(String name) is already available
}



