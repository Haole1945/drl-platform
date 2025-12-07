package ptit.drl.student.mapper;

import ptit.drl.student.dto.CreateStudentRequest;
import ptit.drl.student.dto.StudentDTO;
import ptit.drl.student.dto.UpdateStudentRequest;
import ptit.drl.student.entity.Student;
import ptit.drl.student.entity.StudentClass;
import ptit.drl.student.entity.Major;
import ptit.drl.student.entity.Faculty;

/**
 * Mapper for Student entity and DTOs
 */
public class StudentMapper {
    
    /**
     * Convert Student entity to StudentDTO
     */
    public static StudentDTO toDTO(Student student) {
        if (student == null) {
            return null;
        }
        
        StudentDTO dto = new StudentDTO();
        dto.setStudentCode(student.getStudentCode());
        dto.setFullName(student.getFullName());
        dto.setDateOfBirth(student.getDateOfBirth());
        dto.setGender(student.getGender());
        dto.setPhone(student.getPhone());
        dto.setAddress(student.getAddress());
        dto.setAcademicYear(student.getAcademicYear());
        
        // Map relationships
        if (student.getStudentClass() != null) {
            dto.setClassCode(student.getStudentClass().getCode());
            dto.setClassName(student.getStudentClass().getName());
        }
        
        if (student.getMajor() != null) {
            dto.setMajorCode(student.getMajor().getCode());
            dto.setMajorName(student.getMajor().getName());
        }
        
        if (student.getFaculty() != null) {
            dto.setFacultyCode(student.getFaculty().getCode());
            dto.setFacultyName(student.getFaculty().getName());
        }
        
        // Map position
        dto.setPosition(student.getPosition());
        
        // Map email
        dto.setEmail(student.getEmail());
        
        return dto;
    }
    
    /**
     * Convert CreateStudentRequest to Student entity
     */
    public static Student toEntity(CreateStudentRequest request, 
                                   StudentClass studentClass,
                                   Major major,
                                   Faculty faculty) {
        if (request == null) {
            return null;
        }
        
        Student student = new Student();
        student.setStudentCode(request.getStudentCode());
        student.setFullName(request.getFullName());
        student.setDateOfBirth(request.getDateOfBirth());
        student.setGender(request.getGender());
        student.setPhone(request.getPhone());
        student.setAddress(request.getAddress());
        student.setAcademicYear(request.getAcademicYear());
        student.setEmail(request.getEmail());
        student.setStudentClass(studentClass);
        student.setMajor(major);
        student.setFaculty(faculty);
        
        return student;
    }
    
    /**
     * Update Student entity from UpdateStudentRequest
     * Only updates non-null fields
     */
    public static void updateEntity(Student student, UpdateStudentRequest request,
                                    StudentClass studentClass,
                                    Major major,
                                    Faculty faculty) {
        if (request == null || student == null) {
            return;
        }
        
        if (request.getFullName() != null) {
            student.setFullName(request.getFullName());
        }
        
        if (request.getDateOfBirth() != null) {
            student.setDateOfBirth(request.getDateOfBirth());
        }
        
        if (request.getGender() != null) {
            student.setGender(request.getGender());
        }
        
        if (request.getPhone() != null) {
            student.setPhone(request.getPhone());
        }
        
        if (request.getAddress() != null) {
            student.setAddress(request.getAddress());
        }
        
        if (request.getAcademicYear() != null) {
            student.setAcademicYear(request.getAcademicYear());
        }
        
        if (request.getEmail() != null) {
            student.setEmail(request.getEmail());
        }
        
        if (studentClass != null) {
            student.setStudentClass(studentClass);
        }
        
        if (major != null) {
            student.setMajor(major);
        }
        
        if (faculty != null) {
            student.setFaculty(faculty);
        }
    }
}

