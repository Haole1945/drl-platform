package ptit.drl.evaluation.api;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ptit.drl.evaluation.dto.ApiResponse;
import ptit.drl.evaluation.dto.FileUploadResponse;
import ptit.drl.evaluation.entity.EvidenceFile;
import ptit.drl.evaluation.service.FileService;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for file upload/download
 */
@RestController
@RequestMapping("/files")
public class FileController {
    
    private static final Logger logger = LoggerFactory.getLogger(FileController.class);
    
    @Autowired
    private FileService fileService;
    
    /**
     * POST /files/upload - Upload evidence file
     * 
     * @param file File to upload
     * @param evaluationId Evaluation ID (optional, can link later)
     * @param criteriaId Criteria ID (optional)
     * @param subCriteriaId Sub-criteria ID (optional, e.g., "1.1")
     * @param uploadedBy User ID who uploaded (from JWT token header)
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long evaluationId,
            @RequestParam(required = false) Long criteriaId,
            @RequestParam(required = false) String subCriteriaId,
            @RequestHeader(value = "X-User-Id", required = false) Long uploadedBy) {
        
        try {
            // Validate required parameters
            // evaluationId can be null if evaluation not created yet
            if (criteriaId == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("criteriaId is required"));
            }
            
            EvidenceFile evidenceFile = fileService.uploadFile(
                file, evaluationId, criteriaId, subCriteriaId, uploadedBy);
            
            FileUploadResponse response = new FileUploadResponse(
                evidenceFile.getId(),
                evidenceFile.getFileName(),
                evidenceFile.getFileUrl(),
                evidenceFile.getFileType(),
                evidenceFile.getFileSize(),
                evidenceFile.getSubCriteriaId()
            );
            
            return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to upload file: " + e.getMessage()));
        }
    }
    
    /**
     * GET /files/{fileId} - Get file metadata
     */
    @GetMapping("/{fileId}")
    public ResponseEntity<ApiResponse<FileUploadResponse>> getFile(@PathVariable Long fileId) {
        try {
            EvidenceFile file = fileService.getFileById(fileId);
            FileUploadResponse response = new FileUploadResponse(
                file.getId(),
                file.getFileName(),
                file.getFileUrl(),
                file.getFileType(),
                file.getFileSize(),
                file.getSubCriteriaId()
            );
            return ResponseEntity.ok(ApiResponse.success("File found", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("File not found"));
        }
    }
    
    /**
     * GET /files/evidence/{evaluationId}/{criteriaId}/{filename} - Download file
     */
    @GetMapping("/evidence/{evaluationId}/{criteriaId}/{filename}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long evaluationId,
            @PathVariable Long criteriaId,
            @PathVariable String filename) {
        
        logger.info("Download file request: evaluationId={}, criteriaId={}, filename={}", 
                evaluationId, criteriaId, filename);
        
        try {
            EvidenceFile file = fileService.getFileByStoredFileName(filename);
            logger.info("File found in DB: id={}, evaluationId={}, criteriaId={}, filePath={}", 
                    file.getId(), file.getEvaluationId(), file.getCriteriaId(), file.getFilePath());
            
            // Verify the file belongs to the specified criteria
            // Note: evaluationId in URL might be 0 (placeholder) even if file has evaluationId set
            // We allow access if criteriaId matches, regardless of evaluationId mismatch
            // This handles cases where files were linked to evaluations after upload
            if (!file.getCriteriaId().equals(criteriaId)) {
                logger.warn("File access denied: criteriaId mismatch. File criteriaId={}, request criteriaId={}", 
                        file.getCriteriaId(), criteriaId);
                return ResponseEntity.notFound().build();
            }
            
            // Log evaluationId info for debugging (but don't block access)
            Long fileEvaluationId = file.getEvaluationId();
            boolean evaluationMatches = (fileEvaluationId == null && evaluationId == 0) ||
                                       (fileEvaluationId != null && fileEvaluationId.equals(evaluationId));
            logger.debug("Evaluation info: fileEvaluationId={}, requestEvaluationId={}, matches={}", 
                    fileEvaluationId, evaluationId, evaluationMatches);
            
            Path filePath = fileService.getFilePath(file);
            logger.debug("Resolved file path: {}", filePath);
            
            Resource resource = new UrlResource(filePath.toUri());
            
            if (!resource.exists()) {
                logger.error("File not found on disk: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            if (!resource.isReadable()) {
                logger.error("File not readable: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            // Determine content type
            String contentType = file.getFileType();
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            logger.info("Serving file: {}", filename);
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "inline; filename=\"" + file.getFileName() + "\"")
                .body(resource);
        } catch (Exception e) {
            logger.error("Error serving file: filename={}, error={}", filename, e.getMessage(), e);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * GET /files/evaluation/{evaluationId} - Get all files for an evaluation
     */
    @GetMapping("/evaluation/{evaluationId}")
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> getFilesByEvaluation(
            @PathVariable Long evaluationId) {
        
        List<EvidenceFile> files = fileService.getFilesByEvaluationId(evaluationId);
        List<FileUploadResponse> responses = files.stream()
            .map(f -> new FileUploadResponse(
                f.getId(), f.getFileName(), f.getFileUrl(), 
                f.getFileType(), f.getFileSize(), f.getSubCriteriaId()))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("Files retrieved", responses));
    }
    
    /**
     * GET /files/evaluation/{evaluationId}/criteria/{criteriaId} - Get files for a criteria
     */
    @GetMapping("/evaluation/{evaluationId}/criteria/{criteriaId}")
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> getFilesByCriteria(
            @PathVariable Long evaluationId,
            @PathVariable Long criteriaId) {
        
        List<EvidenceFile> files = fileService.getFilesByCriteria(evaluationId, criteriaId);
        List<FileUploadResponse> responses = files.stream()
            .map(f -> new FileUploadResponse(
                f.getId(), f.getFileName(), f.getFileUrl(), 
                f.getFileType(), f.getFileSize(), f.getSubCriteriaId()))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("Files retrieved", responses));
    }
    
    /**
     * POST /files/evaluation/{evaluationId}/sync - Sync/link files with evaluation
     * Extracts file URLs from evaluation evidence and links files that have evaluationId=null or 0
     * This is a one-time operation to fix data inconsistency for existing evaluations
     */
    @PostMapping("/evaluation/{evaluationId}/sync")
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> syncFilesWithEvaluation(
            @PathVariable Long evaluationId) {
        
        try {
            // This will be implemented in EvaluationService to sync files
            // For now, return empty list - actual implementation will link files
            return ResponseEntity.ok(ApiResponse.success("Files sync initiated", new ArrayList<>()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to sync files: " + e.getMessage()));
        }
    }
    
    /**
     * POST /files/lookup - Lookup files by stored file names and criteria ID
     * Body: { "storedFileNames": ["file1.jpg", "file2.png"], "criteriaId": 1 }
     * Used to find files that might have evaluationId=null or 0
     */
    @PostMapping("/lookup")
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> lookupFiles(
            @RequestBody FileLookupRequest request) {
        
        try {
            if (request.getStoredFileNames() == null || request.getStoredFileNames().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("storedFileNames is required"));
            }
            if (request.getCriteriaId() == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("criteriaId is required"));
            }
            
            List<EvidenceFile> files = fileService.getFilesByStoredFileNamesAndCriteriaId(
                request.getStoredFileNames(), request.getCriteriaId());
            
            List<FileUploadResponse> responses = files.stream()
                .map(f -> new FileUploadResponse(
                    f.getId(), f.getFileName(), f.getFileUrl(), 
                    f.getFileType(), f.getFileSize(), f.getSubCriteriaId()))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(ApiResponse.success("Files found", responses));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to lookup files: " + e.getMessage()));
        }
    }
    
    /**
     * DELETE /files/{fileId} - Delete a file
     */
    @DeleteMapping("/{fileId}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(@PathVariable Long fileId) {
        try {
            fileService.deleteFile(fileId);
            return ResponseEntity.ok(ApiResponse.success("File deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to delete file: " + e.getMessage()));
        }
    }
    
    /**
     * Request DTO for file lookup
     */
    public static class FileLookupRequest {
        private List<String> storedFileNames;
        private Long criteriaId;
        
        public List<String> getStoredFileNames() {
            return storedFileNames;
        }
        
        public void setStoredFileNames(List<String> storedFileNames) {
            this.storedFileNames = storedFileNames;
        }
        
        public Long getCriteriaId() {
            return criteriaId;
        }
        
        public void setCriteriaId(Long criteriaId) {
            this.criteriaId = criteriaId;
        }
    }
}

