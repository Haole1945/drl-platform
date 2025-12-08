package ptit.drl.evaluation.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ptit.drl.evaluation.entity.EvidenceFile;
import ptit.drl.evaluation.exception.ResourceNotFoundException;
import ptit.drl.evaluation.repository.EvidenceFileRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Service for handling file uploads and downloads
 */
@Service
public class FileService {
    
    private final EvidenceFileRepository evidenceFileRepository;
    
    @Value("${file.upload-dir:./uploads/evidence}")
    private String uploadDir;
    
    @Value("${file.max-size:52428800}") // 50MB default
    private long maxFileSize;
    
    // Allowed file types
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );
    
    private static final List<String> ALLOWED_VIDEO_TYPES = Arrays.asList(
        "video/mp4", "video/avi", "video/mov", "video/webm", "video/quicktime"
    );
    
    private static final List<String> ALLOWED_DOCUMENT_TYPES = Arrays.asList(
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // .xlsx
    );
    
    public FileService(EvidenceFileRepository evidenceFileRepository) {
        this.evidenceFileRepository = evidenceFileRepository;
    }
    
    @PostConstruct
    public void init() {
        // Create upload directory if it doesn't exist
        // This runs after @Value injection
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to create upload directory: " + uploadDir, e);
        }
    }
    
    /**
     * Upload a file and save metadata to database
     */
    public EvidenceFile uploadFile(MultipartFile file, Long evaluationId, Long criteriaId, 
                                  String subCriteriaId, Long uploadedBy) throws IOException {
        // Validate file
        validateFile(file);
        
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String storedFileName = UUID.randomUUID().toString() + extension;
        
        // Create directory structure: uploads/evidence/{evaluationId or '0'}/{criteriaId}/
        // Use '0' as placeholder for null evaluationId to match URL structure
        String evalDirName = evaluationId != null ? String.valueOf(evaluationId) : "0";
        Path evaluationDir = Paths.get(uploadDir, evalDirName, String.valueOf(criteriaId));
        Files.createDirectories(evaluationDir);
        
        // Save file
        Path filePath = evaluationDir.resolve(storedFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Generate file URL
        // If evaluationId is null, use 0 as placeholder (will be updated later)
        Long evalIdForUrl = evaluationId != null ? evaluationId : 0L;
        String fileUrl = String.format("/files/evidence/%d/%d/%s", 
            evalIdForUrl, criteriaId, storedFileName);
        
        // Create EvidenceFile entity
        EvidenceFile evidenceFile = new EvidenceFile();
        evidenceFile.setEvaluationId(evaluationId); // Can be null
        evidenceFile.setCriteriaId(criteriaId);
        evidenceFile.setSubCriteriaId(subCriteriaId);
        evidenceFile.setFileName(originalFilename);
        evidenceFile.setStoredFileName(storedFileName);
        evidenceFile.setFilePath(filePath.toString());
        evidenceFile.setFileUrl(fileUrl);
        evidenceFile.setFileType(file.getContentType());
        evidenceFile.setFileSize(file.getSize());
        evidenceFile.setUploadedBy(uploadedBy);
        
        return evidenceFileRepository.save(evidenceFile);
    }
    
    /**
     * Get file by ID
     */
    public EvidenceFile getFileById(Long fileId) {
        return evidenceFileRepository.findById(fileId)
            .orElseThrow(() -> new ResourceNotFoundException("EvidenceFile", "id", fileId));
    }
    
    /**
     * Get file by stored filename
     */
    public EvidenceFile getFileByStoredFileName(String storedFileName) {
        return evidenceFileRepository.findByStoredFileName(storedFileName)
            .orElseThrow(() -> new ResourceNotFoundException("EvidenceFile", "storedFileName", storedFileName));
    }
    
    /**
     * Get file path for serving
     */
    public Path getFilePath(EvidenceFile evidenceFile) {
        return Paths.get(evidenceFile.getFilePath());
    }
    
    /**
     * Get all files for an evaluation
     */
    public List<EvidenceFile> getFilesByEvaluationId(Long evaluationId) {
        return evidenceFileRepository.findByEvaluationId(evaluationId);
    }
    
    /**
     * Get files for a criteria
     */
    public List<EvidenceFile> getFilesByCriteria(Long evaluationId, Long criteriaId) {
        return evidenceFileRepository.findByEvaluationIdAndCriteriaId(evaluationId, criteriaId);
    }
    
    /**
     * Get files by stored file names and criteria ID
     * Used to lookup files that might have evaluationId=null or 0
     */
    public List<EvidenceFile> getFilesByStoredFileNamesAndCriteriaId(List<String> storedFileNames, Long criteriaId) {
        return evidenceFileRepository.findByStoredFileNamesAndCriteriaId(storedFileNames, criteriaId);
    }
    
    /**
     * Get files for a sub-criteria
     */
    public List<EvidenceFile> getFilesBySubCriteria(Long evaluationId, Long criteriaId, String subCriteriaId) {
        return evidenceFileRepository.findByEvaluationIdAndCriteriaIdAndSubCriteriaId(
            evaluationId, criteriaId, subCriteriaId);
    }
    
    /**
     * Delete file
     */
    public void deleteFile(Long fileId) throws IOException {
        EvidenceFile file = getFileById(fileId);
        
        // Delete physical file
        Path filePath = Paths.get(file.getFilePath());
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }
        
        // Delete database record
        evidenceFileRepository.delete(file);
    }
    
    /**
     * Link files with evaluation by extracting file URLs from evidence string
     * This ensures files uploaded before evaluation creation are properly linked
     */
    public void linkFilesWithEvaluation(Long evaluationId, Long criteriaId, String evidence) {
        if (evidence == null || evidence.isEmpty()) {
            return;
        }
        
        // Extract stored file names from evidence URLs
        // URL format: /files/evidence/{evalId}/{criteriaId}/{storedFileName}
        java.util.regex.Pattern urlPattern = java.util.regex.Pattern.compile("/files/evidence/[^/]+/[^/]+/([^\\s,]+)");
        java.util.regex.Matcher matcher = urlPattern.matcher(evidence);
        
        java.util.Set<String> storedFileNames = new java.util.HashSet<>();
        while (matcher.find()) {
            storedFileNames.add(matcher.group(1));
        }
        
        if (storedFileNames.isEmpty()) {
            return;
        }
        
        // Find files by stored file names and criteria ID
        List<EvidenceFile> files = evidenceFileRepository.findByStoredFileNamesAndCriteriaId(
            new java.util.ArrayList<>(storedFileNames), criteriaId);
        
        // Link files with evaluation (update evaluationId if null or 0)
        for (EvidenceFile file : files) {
            if (file.getEvaluationId() == null || file.getEvaluationId() == 0) {
                file.setEvaluationId(evaluationId);
                // Update file URL to reflect new evaluation ID
                String newFileUrl = String.format("/files/evidence/%d/%d/%s", 
                    evaluationId, file.getCriteriaId(), file.getStoredFileName());
                file.setFileUrl(newFileUrl);
                evidenceFileRepository.save(file);
            }
        }
    }
    
    /**
     * Delete all files for an evaluation
     */
    public void deleteFilesByEvaluationId(Long evaluationId) throws IOException {
        List<EvidenceFile> files = getFilesByEvaluationId(evaluationId);
        
        for (EvidenceFile file : files) {
            Path filePath = Paths.get(file.getFilePath());
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        }
        
        evidenceFileRepository.deleteByEvaluationId(evaluationId);
    }
    
    /**
     * Validate file
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException(
                String.format("File size exceeds maximum allowed size of %d bytes", maxFileSize));
        }
        
        String contentType = file.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("File content type is unknown");
        }
        
        // Check if file type is allowed
        boolean isAllowed = ALLOWED_IMAGE_TYPES.contains(contentType) ||
                           ALLOWED_VIDEO_TYPES.contains(contentType) ||
                           ALLOWED_DOCUMENT_TYPES.contains(contentType);
        
        if (!isAllowed) {
            throw new IllegalArgumentException(
                String.format("File type %s is not allowed. Allowed types: images, videos, documents", contentType));
        }
    }
    
    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
    
    /**
     * Check if file is an image
     */
    public boolean isImage(String contentType) {
        return ALLOWED_IMAGE_TYPES.contains(contentType);
    }
    
    /**
     * Check if file is a video
     */
    public boolean isVideo(String contentType) {
        return ALLOWED_VIDEO_TYPES.contains(contentType);
    }
    
    /**
     * Check if file is a document
     */
    public boolean isDocument(String contentType) {
        return ALLOWED_DOCUMENT_TYPES.contains(contentType);
    }
}

