package ptit.drl.student.dto;

/**
 * DTO for Major
 */
public class MajorDTO {
    private String code;
    private String name;
    private String description;
    private String facultyCode;
    private String facultyName;
    
    public MajorDTO() {}
    
    public MajorDTO(String code, String name, String description, String facultyCode, String facultyName) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.facultyCode = facultyCode;
        this.facultyName = facultyName;
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
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
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

