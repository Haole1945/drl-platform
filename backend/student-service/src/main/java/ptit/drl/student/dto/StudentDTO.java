package ptit.drl.student.dto;

import java.time.LocalDate;

/**
 * DTO for Student entity
 * Used for API responses and requests
 */
public class StudentDTO {
    
    private String studentCode;
    private String fullName;
    private LocalDate dateOfBirth;
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
    private String position; // Chức vụ: CLASS_MONITOR, VICE_MONITOR, etc.
    private String email; // Email trường
    
    // Constructors
    public StudentDTO() {}
    
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
    
    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }
    
    public void setDateOfBirth(LocalDate dateOfBirth) {
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
    
    public String getPosition() {
        return position;
    }
    
    public void setPosition(String position) {
        this.position = position;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
}

