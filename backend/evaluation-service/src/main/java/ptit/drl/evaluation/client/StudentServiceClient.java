package ptit.drl.evaluation.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Feign Client for communicating with student-service
 * Uses service discovery to find student-service via Eureka
 */
@FeignClient(name = "student-service", path = "/students")
public interface StudentServiceClient {
    
    /**
     * Get student by code
     * @param studentCode Student code (e.g., N21DCCN001)
     * @return StudentDTO wrapped in ApiResponse
     */
    @GetMapping("/{studentCode}")
    StudentResponse getStudentByCode(@PathVariable String studentCode);
    
    
    /**
     * Response wrapper for student data
     * Matches the ApiResponse structure from student-service
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    class StudentResponse {
        @JsonProperty("success")
        private boolean success;
        
        @JsonProperty("message")
        private String message;
        
        @JsonProperty("data")
        private StudentDTO data;
        
        @JsonProperty("errors")
        private List<String> errors;
        
        @JsonProperty("timestamp")
        private LocalDateTime timestamp;
        
        // Constructors
        public StudentResponse() {
        }
        
        public StudentResponse(boolean success, String message, StudentDTO data) {
            this.success = success;
            this.message = message;
            this.data = data;
        }
        
        // Getters and Setters
        public boolean isSuccess() {
            return success;
        }
        
        public void setSuccess(boolean success) {
            this.success = success;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
        
        public StudentDTO getData() {
            return data;
        }
        
        public void setData(StudentDTO data) {
            this.data = data;
        }
        
        public List<String> getErrors() {
            return errors;
        }
        
        public void setErrors(List<String> errors) {
            this.errors = errors;
        }
        
        public LocalDateTime getTimestamp() {
            return timestamp;
        }
        
        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }
    }
    
    /**
     * Student DTO from student-service
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    class StudentDTO {
        private String studentCode;
        private String fullName;
        private String dateOfBirth;
        private String gender;
        private String phone;
        private String address;
        private String academicYear;
        private String classCode;
        private String className;
        private String majorCode;
        private String majorName;
        private String facultyCode;
        private String facultyName;
        
        // Constructors
        public StudentDTO() {
        }
        
        // Getters and Setters
        public String getStudentCode() {
            return studentCode;
        }
        
        public void setStudentCode(String studentCode) {
            this.studentCode = studentCode;
        }
        
        public String getFullName() {
            return fullName;
        }
        
        public void setFullName(String fullName) {
            this.fullName = fullName;
        }
        
        public String getDateOfBirth() {
            return dateOfBirth;
        }
        
        public void setDateOfBirth(String dateOfBirth) {
            this.dateOfBirth = dateOfBirth;
        }
        
        public String getGender() {
            return gender;
        }
        
        public void setGender(String gender) {
            this.gender = gender;
        }
        
        public String getPhone() {
            return phone;
        }
        
        public void setPhone(String phone) {
            this.phone = phone;
        }
        
        public String getAddress() {
            return address;
        }
        
        public void setAddress(String address) {
            this.address = address;
        }
        
        public String getAcademicYear() {
            return academicYear;
        }
        
        public void setAcademicYear(String academicYear) {
            this.academicYear = academicYear;
        }
        
        public String getClassCode() {
            return classCode;
        }
        
        public void setClassCode(String classCode) {
            this.classCode = classCode;
        }
        
        public String getClassName() {
            return className;
        }
        
        public void setClassName(String className) {
            this.className = className;
        }
        
        public String getMajorCode() {
            return majorCode;
        }
        
        public void setMajorCode(String majorCode) {
            this.majorCode = majorCode;
        }
        
        public String getMajorName() {
            return majorName;
        }
        
        public void setMajorName(String majorName) {
            this.majorName = majorName;
        }
        
        public String getFacultyCode() {
            return facultyCode;
        }
        
        public void setFacultyCode(String facultyCode) {
            this.facultyCode = facultyCode;
        }
        
        public String getFacultyName() {
            return facultyName;
        }
        
        public void setFacultyName(String facultyName) {
            this.facultyName = facultyName;
        }
    }
}

