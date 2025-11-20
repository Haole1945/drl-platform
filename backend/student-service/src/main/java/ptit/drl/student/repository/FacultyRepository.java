package ptit.drl.student.repository;

import ptit.drl.student.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, String> {
    // Primary key is 'code', so findById(String code) is already available
}



