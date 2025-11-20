package ptit.drl.student.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Student entity - uses natural key (student_code) as primary key
 */
@Entity
@Table(name = "students", indexes = {
    @Index(name = "idx_student_faculty", columnList = "faculty_code"),
    @Index(name = "idx_student_major", columnList = "major_code"),
    @Index(name = "idx_student_class", columnList = "class_code"),
    @Index(name = "idx_student_academic_year", columnList = "academic_year"),
    @Index(name = "idx_student_position", columnList = "position")
})
public class Student {
    
    @Id
    @Column(name = "student_code", nullable = false, unique = true, length = 20)
    private String studentCode; // Mã sinh viên
    
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;
    
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    
    @Column(name = "gender", length = 10)
    private String gender; // MALE, FEMALE, OTHER
    
    @Column(name = "phone", length = 20)
    private String phone;
    
    @Column(name = "address", length = 500)
    private String address;
    
    @Column(name = "academic_year", length = 20)
    private String academicYear; // Năm học hiện tại
    
    @Column(name = "position", length = 50)
    private String position; // Chức vụ: NONE, CLASS_MONITOR, VICE_MONITOR, SECRETARY, etc.
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_code", nullable = false)
    private StudentClass studentClass;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "major_code", nullable = false)
    private Major major;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_code", nullable = false)
    private Faculty faculty;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Student() {}
    
    public Student(String studentCode, String fullName, StudentClass studentClass, Major major, Faculty faculty) {
        this.studentCode = studentCode;
        this.fullName = fullName;
        this.studentClass = studentClass;
        this.major = major;
        this.faculty = faculty;
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
    
    public String getPosition() {
        return position;
    }
    
    public void setPosition(String position) {
        this.position = position;
    }
    
    public StudentClass getStudentClass() {
        return studentClass;
    }
    
    public void setStudentClass(StudentClass studentClass) {
        this.studentClass = studentClass;
    }
    
    public Major getMajor() {
        return major;
    }
    
    public void setMajor(Major major) {
        this.major = major;
    }
    
    public Faculty getFaculty() {
        return faculty;
    }
    
    public void setFaculty(Faculty faculty) {
        this.faculty = faculty;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
