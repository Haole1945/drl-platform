package ptit.drl.student.enums;

/**
 * Student position in class
 */
public enum StudentPosition {
    NONE("Không có chức vụ"),
    CLASS_MONITOR("Lớp trưởng"),
    VICE_MONITOR("Lớp phó"),
    SECRETARY("Bí thư"),
    DEPUTY_SECRETARY("Phó bí thư"),
    TREASURER("Thủ quỹ"),
    CULTURAL_OFFICER("Cán bộ văn thể"),
    STUDY_OFFICER("Cán bộ học tập");
    
    private final String displayName;
    
    StudentPosition(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}

