package ptit.drl.evaluation.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * EvidenceFile entity - Stores uploaded evidence files (images, videos, documents)
 * for evaluation details
 */
@Entity
@Table(name = "evidence_files", indexes = {
    @Index(name = "idx_evidence_evaluation_criteria", columnList = "evaluation_id,criteria_id"),
    @Index(name = "idx_evidence_evaluation", columnList = "evaluation_id")
})
public class EvidenceFile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "evaluation_id", nullable = true) // Allow null for files uploaded before evaluation creation
    private Long evaluationId;
    
    @Column(name = "criteria_id", nullable = false)
    private Long criteriaId;
    
    @Column(name = "sub_criteria_id", length = 20)
    private String subCriteriaId; // e.g., "1.1", "1.2" - optional
    
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName; // Original filename
    
    @Column(name = "stored_file_name", nullable = false, length = 255)
    private String storedFileName; // UUID-based filename on disk
    
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath; // Full path on filesystem
    
    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl; // URL to access file via API
    
    @Column(name = "file_type", length = 100)
    private String fileType; // MIME type: image/jpeg, video/mp4, application/pdf
    
    @Column(name = "file_size")
    private Long fileSize; // Size in bytes
    
    @Column(name = "uploaded_by")
    private Long uploadedBy; // user_id who uploaded
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
        @JoinColumn(name = "evaluation_id", insertable = false, updatable = false),
        @JoinColumn(name = "criteria_id", insertable = false, updatable = false)
    })
    private EvaluationDetail evaluationDetail;
    
    // Constructors
    public EvidenceFile() {}
    
    public EvidenceFile(Long evaluationId, Long criteriaId, String fileName, 
                       String storedFileName, String filePath, String fileUrl, 
                       String fileType, Long fileSize) {
        this.evaluationId = evaluationId;
        this.criteriaId = criteriaId;
        this.fileName = fileName;
        this.storedFileName = storedFileName;
        this.filePath = filePath;
        this.fileUrl = fileUrl;
        this.fileType = fileType;
        this.fileSize = fileSize;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getEvaluationId() {
        return evaluationId;
    }
    
    public void setEvaluationId(Long evaluationId) {
        this.evaluationId = evaluationId;
    }
    
    public Long getCriteriaId() {
        return criteriaId;
    }
    
    public void setCriteriaId(Long criteriaId) {
        this.criteriaId = criteriaId;
    }
    
    public String getSubCriteriaId() {
        return subCriteriaId;
    }
    
    public void setSubCriteriaId(String subCriteriaId) {
        this.subCriteriaId = subCriteriaId;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public String getStoredFileName() {
        return storedFileName;
    }
    
    public void setStoredFileName(String storedFileName) {
        this.storedFileName = storedFileName;
    }
    
    public String getFilePath() {
        return filePath;
    }
    
    public void setFilePath(String filePath) {
        this.filePath = filePath;
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
    
    public Long getUploadedBy() {
        return uploadedBy;
    }
    
    public void setUploadedBy(Long uploadedBy) {
        this.uploadedBy = uploadedBy;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public EvaluationDetail getEvaluationDetail() {
        return evaluationDetail;
    }
    
    public void setEvaluationDetail(EvaluationDetail evaluationDetail) {
        this.evaluationDetail = evaluationDetail;
    }
}

