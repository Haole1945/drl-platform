package ptit.drl.student.repository;

import ptit.drl.student.entity.TrainingPoint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingPointRepository extends JpaRepository<TrainingPoint, Long> {
    // Using nested property path (student.studentCode)
    List<TrainingPoint> findByStudentStudentCode(String studentCode);
    List<TrainingPoint> findByStudentStudentCodeAndSemester(String studentCode, String semester);
    Page<TrainingPoint> findByStudentStudentCode(String studentCode, Pageable pageable);
}



