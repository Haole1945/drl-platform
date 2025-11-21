package ptit.drl.student.dto;

/**
 * DTO for StudentClass
 */
public class ClassDTO {
    private String code;
    private String name;
    private String academicYear;
    private String facultyCode;
    private String facultyName;
    private String majorCode;
    private String majorName;
    
    public ClassDTO() {}
    
    public ClassDTO(String code, String name, String academicYear, String facultyCode, String facultyName, String majorCode, String majorName) {
        this.code = code;
        this.name = name;
        this.academicYear = academicYear;
        this.facultyCode = facultyCode;
        this.facultyName = facultyName;
        this.majorCode = majorCode;
        this.majorName = majorName;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getAcademicYear() {
        return academicYear;
    }
    
    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
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
}

