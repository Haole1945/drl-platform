package ptit.drl.student.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptit.drl.student.dto.CreateStudentRequest;
import ptit.drl.student.dto.StudentDTO;
import ptit.drl.student.dto.UpdateStudentRequest;
import ptit.drl.student.entity.Faculty;
import ptit.drl.student.entity.Major;
import ptit.drl.student.entity.Student;
import ptit.drl.student.entity.StudentClass;
import ptit.drl.student.exception.DuplicateResourceException;
import ptit.drl.student.exception.ResourceNotFoundException;
import ptit.drl.student.mapper.StudentMapper;
import ptit.drl.student.repository.*;

/**
 * Service for Student CRUD operations
 */
@Service
@Transactional
public class StudentService {
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private StudentClassRepository studentClassRepository;
    
    @Autowired
    private MajorRepository majorRepository;
    
    @Autowired
    private FacultyRepository facultyRepository;
    
    /**
     * Get all students with pagination
     * Uses optimized query with fetch join to avoid N+1 queries
     */
    @Transactional(readOnly = true)
    public Page<StudentDTO> getAllStudents(Pageable pageable) {
        // Use EntityGraph from repository's findAll override
        return studentRepository.findAll(pageable)
                .map(StudentMapper::toDTO);
    }
    
    /**
     * Get student by code
     * Uses optimized query with fetch join to avoid N+1 queries
     */
    public StudentDTO getStudentByCode(String studentCode) {
        Student student = studentRepository.findByIdWithRelations(studentCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Student", "code", studentCode));
        return StudentMapper.toDTO(student);
    }
    
    /**
     * Create a new student
     */
    public StudentDTO createStudent(CreateStudentRequest request) {
        // Check if student code already exists
        if (studentRepository.existsById(request.getStudentCode())) {
            throw new DuplicateResourceException(
                "Student", "code", request.getStudentCode());
        }
        
        // Validate and fetch related entities
        StudentClass studentClass = studentClassRepository.findById(request.getClassCode())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "StudentClass", "code", request.getClassCode()));
        
        Major major = majorRepository.findById(request.getMajorCode())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Major", "code", request.getMajorCode()));
        
        Faculty faculty = facultyRepository.findById(request.getFacultyCode())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Faculty", "code", request.getFacultyCode()));
        
        // Create and save student
        Student student = StudentMapper.toEntity(request, studentClass, major, faculty);
        Student savedStudent = studentRepository.save(student);
        
        return StudentMapper.toDTO(savedStudent);
    }
    
    /**
     * Update an existing student
     */
    public StudentDTO updateStudent(String studentCode, UpdateStudentRequest request) {
        // Find existing student
        Student student = studentRepository.findById(studentCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Student", "code", studentCode));
        
        // Fetch related entities if provided
        StudentClass studentClass = null;
        if (request.getClassCode() != null) {
            studentClass = studentClassRepository.findById(request.getClassCode())
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "StudentClass", "code", request.getClassCode()));
        }
        
        Major major = null;
        if (request.getMajorCode() != null) {
            major = majorRepository.findById(request.getMajorCode())
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "Major", "code", request.getMajorCode()));
        }
        
        Faculty faculty = null;
        if (request.getFacultyCode() != null) {
            faculty = facultyRepository.findById(request.getFacultyCode())
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "Faculty", "code", request.getFacultyCode()));
        }
        
        // Update student
        StudentMapper.updateEntity(student, request, studentClass, major, faculty);
        Student updatedStudent = studentRepository.save(student);
        
        return StudentMapper.toDTO(updatedStudent);
    }
    
    /**
     * Delete a student
     */
    public void deleteStudent(String studentCode) {
        if (!studentRepository.existsById(studentCode)) {
            throw new ResourceNotFoundException("Student", "code", studentCode);
        }
        studentRepository.deleteById(studentCode);
    }
    
    /**
     * Get students by faculty
     */
    public Page<StudentDTO> getStudentsByFaculty(String facultyCode, Pageable pageable) {
        return studentRepository.findByFacultyCode(facultyCode, pageable)
                .map(StudentMapper::toDTO);
    }
    
    /**
     * Get students by major
     */
    public Page<StudentDTO> getStudentsByMajor(String majorCode, Pageable pageable) {
        return studentRepository.findByMajorCode(majorCode, pageable)
                .map(StudentMapper::toDTO);
    }
    
    /**
     * Get students by class
     */
    public Page<StudentDTO> getStudentsByClass(String classCode, Pageable pageable) {
        return studentRepository.findByStudentClassCode(classCode, pageable)
                .map(StudentMapper::toDTO);
    }
}

