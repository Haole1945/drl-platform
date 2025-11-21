package ptit.drl.evaluation.api;

import jakarta.servlet.http.HttpServletRequest;
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
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for file upload/download
 */
@RestController
@RequestMapping("/files")
public class FileController {
    
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
        
        try {
            EvidenceFile file = fileService.getFileByStoredFileName(filename);
            
            // Verify the file belongs to the specified evaluation and criteria
            // Handle case where evaluationId might be 0 (placeholder) or null in DB
            Long fileEvaluationId = file.getEvaluationId();
            boolean evaluationMatches = (fileEvaluationId == null && evaluationId == 0) ||
                                       (fileEvaluationId != null && fileEvaluationId.equals(evaluationId));
            
            if (!evaluationMatches || !file.getCriteriaId().equals(criteriaId)) {
                return ResponseEntity.notFound().build();
            }
            
            Path filePath = fileService.getFilePath(file);
            Resource resource = new UrlResource(filePath.toUri());
            
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            
            // Determine content type
            String contentType = file.getFileType();
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "inline; filename=\"" + file.getFileName() + "\"")
                .body(resource);
        } catch (Exception e) {
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
}

