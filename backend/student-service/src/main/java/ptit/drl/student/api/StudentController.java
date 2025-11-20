package ptit.drl.student.api;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptit.drl.student.dto.ApiResponse;
import ptit.drl.student.dto.CreateStudentRequest;
import ptit.drl.student.dto.StudentDTO;
import ptit.drl.student.dto.UpdateStudentRequest;
import ptit.drl.student.repository.FacultyRepository;
import ptit.drl.student.repository.MajorRepository;
import ptit.drl.student.repository.StudentClassRepository;
import ptit.drl.student.repository.StudentRepository;
import ptit.drl.student.service.StudentService;

import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for Student management
 */
@RestController
@RequestMapping("/students")
public class StudentController {
    
    @Autowired
    private StudentService studentService;
    
    // Keep existing repositories for db-test endpoint
    @Autowired
    private FacultyRepository facultyRepository;
    
    @Autowired
    private StudentClassRepository studentClassRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private MajorRepository majorRepository;
    
    /**
     * GET /students - Get all students with pagination
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<StudentDTO>>> getAllStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String facultyCode,
            @RequestParam(required = false) String majorCode,
            @RequestParam(required = false) String classCode) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<StudentDTO> students;
        
        // Apply filters if provided
        if (facultyCode != null) {
            students = studentService.getStudentsByFaculty(facultyCode, pageable);
        } else if (majorCode != null) {
            students = studentService.getStudentsByMajor(majorCode, pageable);
        } else if (classCode != null) {
            students = studentService.getStudentsByClass(classCode, pageable);
        } else {
            students = studentService.getAllStudents(pageable);
        }
        
        return ResponseEntity.ok(
            ApiResponse.success("Students retrieved successfully", students));
    }
    
    /**
     * GET /students/{studentCode} - Get student by code
     */
    @GetMapping("/{studentCode}")
    public ResponseEntity<ApiResponse<StudentDTO>> getStudentByCode(
            @PathVariable String studentCode) {
        StudentDTO student = studentService.getStudentByCode(studentCode);
        return ResponseEntity.ok(
            ApiResponse.success("Student found", student));
    }
    
    /**
     * POST /students - Create new student
     * Requires ADMIN or INSTRUCTOR role
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<StudentDTO>> createStudent(
            @Valid @RequestBody CreateStudentRequest request) {
        StudentDTO student = studentService.createStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Student created successfully", student));
    }
    
    /**
     * PUT /students/{studentCode} - Update student
     * Requires ADMIN or INSTRUCTOR role
     */
    @PutMapping("/{studentCode}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<StudentDTO>> updateStudent(
            @PathVariable String studentCode,
            @Valid @RequestBody UpdateStudentRequest request) {
        StudentDTO student = studentService.updateStudent(studentCode, request);
        return ResponseEntity.ok(
            ApiResponse.success("Student updated successfully", student));
    }
    
    /**
     * DELETE /students/{studentCode} - Delete student
     * Requires ADMIN role only
     */
    @DeleteMapping("/{studentCode}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(
            @PathVariable String studentCode) {
        studentService.deleteStudent(studentCode);
        return ResponseEntity.ok(
            ApiResponse.success("Student deleted successfully", null));
    }
    
    // === Test endpoints (keep for debugging) ===
    
    @GetMapping("/hello")
    public String hello() {
        return "Hello from student-service 👋";
    }
    
    @GetMapping("/db-test")
    public Map<String, Object> testDatabase() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            long facultyCount = facultyRepository.count();
            long classCount = studentClassRepository.count();
            long studentCount = studentRepository.count();
            long majorCount = majorRepository.count();
            
            result.put("status", "success");
            result.put("message", "Database connection successful!");
            Map<String, Object> data = new java.util.LinkedHashMap<>();
            data.put("faculties", facultyCount);
            data.put("majors", majorCount);
            data.put("classes", classCount);
            data.put("students", studentCount);
            
            result.put("data", data);
        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Database connection failed: " + e.getMessage());
        }
        
        return result;
    }
}
