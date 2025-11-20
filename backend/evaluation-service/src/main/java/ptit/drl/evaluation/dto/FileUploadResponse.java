package ptit.drl.evaluation.dto;

/**
 * Response DTO for file upload
 */
public class FileUploadResponse {
    private Long id;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
    private String subCriteriaId;
    
    public FileUploadResponse() {}
    
    public FileUploadResponse(Long id, String fileName, String fileUrl, 
                             String fileType, Long fileSize, String subCriteriaId) {
        this.id = id;
        this.fileName = fileName;
        this.fileUrl = fileUrl;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.subCriteriaId = subCriteriaId;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public String getFileUrl() {
        return fileUrl;
    }
    
    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }
    
    public String getFileType() {
        return fileType;
    }
    
    public void setFileType(String fileType) {
        this.fileType = fileType;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public String getSubCriteriaId() {
        return subCriteriaId;
    }
    
    public void setSubCriteriaId(String subCriteriaId) {
        this.subCriteriaId = subCriteriaId;
    }
}

