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
import ptit.drl.student.dto.FacultyDTO;
import ptit.drl.student.dto.MajorDTO;
import ptit.drl.student.dto.ClassDTO;
import ptit.drl.student.entity.Faculty;
import ptit.drl.student.entity.Major;
import ptit.drl.student.entity.StudentClass;
import ptit.drl.student.entity.Student;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

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
     * GET /students/faculties - Get all faculties
     * IMPORTANT: Must be defined BEFORE /{studentCode} to avoid path conflict
     */
    @GetMapping("/faculties")
    public ResponseEntity<ApiResponse<List<FacultyDTO>>> getAllFaculties() {
        List<Faculty> faculties = facultyRepository.findAll();
        List<FacultyDTO> facultyDTOs = faculties.stream()
            .map(f -> new FacultyDTO(f.getCode(), f.getName(), f.getDescription()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Faculties retrieved successfully", facultyDTOs));
    }
    
    /**
     * GET /students/majors - Get majors by faculty code
     * IMPORTANT: Must be defined BEFORE /{studentCode} to avoid path conflict
     */
    @GetMapping("/majors")
    public ResponseEntity<ApiResponse<List<MajorDTO>>> getMajorsByFaculty(
            @RequestParam(required = false) String facultyCode) {
        List<Major> majors;
        if (facultyCode != null && !facultyCode.isEmpty()) {
            majors = majorRepository.findByFacultyCode(facultyCode);
        } else {
            majors = majorRepository.findAll();
        }
        
        List<MajorDTO> majorDTOs = majors.stream()
            .map(m -> new MajorDTO(
                m.getCode(),
                m.getName(),
                m.getDescription(),
                m.getFaculty().getCode(),
                m.getFaculty().getName()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Majors retrieved successfully", majorDTOs));
    }
    
    /**
     * GET /students/classes - Get classes by faculty code and optionally by major code
     * IMPORTANT: Must be defined BEFORE /{studentCode} to avoid path conflict
     */
    @GetMapping("/classes")
    public ResponseEntity<ApiResponse<List<ClassDTO>>> getClasses(
            @RequestParam(required = false) String facultyCode,
            @RequestParam(required = false) String majorCode) {
        List<StudentClass> classes;
        
        if (facultyCode != null && !facultyCode.isEmpty()) {
            classes = studentClassRepository.findByFacultyCode(facultyCode);
        } else {
            classes = studentClassRepository.findAll();
        }
        
        // If majorCode is provided, filter classes by checking students in repository
        if (majorCode != null && !majorCode.isEmpty()) {
            // Get all students with this major and get their class codes
            List<Student> studentsWithMajor = studentRepository.findByMajorCode(majorCode);
            java.util.Set<String> classCodesWithMajor = studentsWithMajor.stream()
                .map(s -> s.getStudentClass().getCode())
                .collect(Collectors.toSet());
            
            // Filter classes to only include those with students in this major
            classes = classes.stream()
                .filter(c -> classCodesWithMajor.contains(c.getCode()))
                .collect(Collectors.toList());
        }
        
        List<ClassDTO> classDTOs = classes.stream()
            .map(c -> {
                // Get major from students in this class (if any)
                String majorCodeFromClass = null;
                String majorNameFromClass = null;
                
                // Get students in this class to determine major
                List<Student> studentsInClass = studentRepository.findByStudentClassCode(c.getCode());
                if (!studentsInClass.isEmpty()) {
                    Major firstMajor = studentsInClass.get(0).getMajor();
                    majorCodeFromClass = firstMajor.getCode();
                    majorNameFromClass = firstMajor.getName();
                }
                
                return new ClassDTO(
                    c.getCode(),
                    c.getName(),
                    c.getAcademicYear(),
                    c.getFaculty().getCode(),
                    c.getFaculty().getName(),
                    majorCodeFromClass,
                    majorNameFromClass
                );
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Classes retrieved successfully", classDTOs));
    }
    
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
        try {
            StudentDTO student = studentService.getStudentByCode(studentCode);
            return ResponseEntity.ok(
                ApiResponse.success("Student found", student));
        } catch (Exception e) {
            throw e;
        }
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
