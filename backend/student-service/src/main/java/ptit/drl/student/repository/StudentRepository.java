package ptit.drl.student.repository;

import ptit.drl.student.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, String> {
    // Primary key is 'student_code', so findById(String studentCode) is already available
    
    // Optimized query with fetch join to avoid N+1 queries
    @EntityGraph(attributePaths = {"studentClass", "major", "faculty"})
    @Query("SELECT s FROM Student s WHERE s.studentCode = :studentCode")
    Optional<Student> findByIdWithRelations(@Param("studentCode") String studentCode);
    
    // List methods (no pagination) - with fetch join
    @EntityGraph(attributePaths = {"studentClass", "major", "faculty"})
    @Query("SELECT s FROM Student s WHERE s.faculty.code = :facultyCode")
    List<Student> findByFacultyCode(@Param("facultyCode") String facultyCode);
    
    @EntityGraph(attributePaths = {"studentClass", "major", "faculty"})
    @Query("SELECT s FROM Student s WHERE s.studentClass.code = :classCode")
    List<Student> findByStudentClassCode(@Param("classCode") String classCode);
    
    @EntityGraph(attributePaths = {"studentClass", "major", "faculty"})
    @Query("SELECT s FROM Student s WHERE s.academicYear = :academicYear")
    List<Student> findByAcademicYear(@Param("academicYear") String academicYear);
    
    @EntityGraph(attributePaths = {"studentClass", "major", "faculty"})
    @Query("SELECT s FROM Student s WHERE s.major.code = :majorCode")
    List<Student> findByMajorCode(@Param("majorCode") String majorCode);
    
    // Page methods (with pagination) - with fetch join
    @EntityGraph(attributePaths = {"studentClass", "major", "faculty"})
    @Query("SELECT s FROM Student s WHERE s.faculty.code = :facultyCode")
    Page<Student> findByFacultyCode(@Param("facultyCode") String facultyCode, Pageable pageable);
    
    @EntityGraph(attributePaths = {"studentClass", "major", "faculty"})
    @Query("SELECT s FROM Student s WHERE s.major.code = :majorCode")
    Page<Student> findByMajorCode(@Param("majorCode") String majorCode, Pageable pageable);
    
    @EntityGraph(attributePaths = {"studentClass", "major", "faculty"})
    @Query("SELECT s FROM Student s WHERE s.studentClass.code = :classCode")
    Page<Student> findByStudentClassCode(@Param("classCode") String classCode, Pageable pageable);
    
    // Override findAll to use fetch join (for List)
    @Override
    @EntityGraph(attributePaths = {"studentClass", "major", "faculty"})
    @Query("SELECT s FROM Student s")
    List<Student> findAll();
    
    // Override findAll with Pageable to use fetch join
    @Override
    @EntityGraph(attributePaths = {"studentClass", "major", "faculty"})
    @Query("SELECT s FROM Student s")
    Page<Student> findAll(Pageable pageable);
}



