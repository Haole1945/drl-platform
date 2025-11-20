package ptit.drl.student.repository;

import ptit.drl.student.entity.Major;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MajorRepository extends JpaRepository<Major, String> {
    // Primary key is 'code', so findById(String code) is already available
    List<Major> findByFacultyCode(String facultyCode);
}

