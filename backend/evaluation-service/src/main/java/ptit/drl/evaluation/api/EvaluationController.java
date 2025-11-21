package ptit.drl.evaluation.api;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptit.drl.evaluation.dto.*;
import ptit.drl.evaluation.service.EvaluationService;

import java.util.List;

/**
 * REST Controller for Evaluation workflow
 */
@RestController
@RequestMapping("/evaluations")
public class EvaluationController {
    
    @Autowired
    private EvaluationService evaluationService;
    
    /**
     * GET /evaluations - Get all evaluations (with filters and pagination)
     * Query params: studentCode, semester, status, page, size
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<EvaluationDTO>>> getEvaluations(
            @RequestParam(required = false) String studentCode,
            @RequestParam(required = false) String semester,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        
        // For now, only support filter by student
        // TODO: Add more filters later
        if (studentCode != null) {
            List<EvaluationDTO> evaluations = evaluationService.getEvaluationsByStudent(
                studentCode, semester);
            return ResponseEntity.ok(
                ApiResponse.success("Evaluations retrieved successfully", 
                    convertListToPage(evaluations, pageable)));
        }
        
        // TODO: Get all evaluations with pagination
        return ResponseEntity.ok(
            ApiResponse.success("Feature not implemented yet", Page.empty()));
    }
    
    /**
     * GET /evaluations/{id} - Get evaluation by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EvaluationDTO>> getEvaluationById(
            @PathVariable Long id) {
        EvaluationDTO evaluation = evaluationService.getEvaluationById(id);
        return ResponseEntity.ok(
            ApiResponse.success("Evaluation found", evaluation));
    }
    
    /**
     * POST /evaluations - Create new evaluation (DRAFT)
     * Only students, class monitors, and union representatives can create evaluations
     */
    @PostMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('CLASS_MONITOR') or hasRole('UNION_REPRESENTATIVE')")
    public ResponseEntity<ApiResponse<EvaluationDTO>> createEvaluation(
            @Valid @RequestBody CreateEvaluationRequest request) {
        EvaluationDTO evaluation = evaluationService.createEvaluation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Evaluation created successfully", evaluation));
    }
    
    /**
     * PUT /evaluations/{id} - Update evaluation (only in DRAFT)
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EvaluationDTO>> updateEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEvaluationRequest request) {
        EvaluationDTO evaluation = evaluationService.updateEvaluation(id, request);
        return ResponseEntity.ok(
            ApiResponse.success("Evaluation updated successfully", evaluation));
    }
    
    /**
     * POST /evaluations/{id}/submit - Submit evaluation for approval
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<EvaluationDTO>> submitEvaluation(
            @PathVariable Long id) {
        EvaluationDTO evaluation = evaluationService.submitEvaluation(id);
        return ResponseEntity.ok(
            ApiResponse.success("Evaluation submitted for approval", evaluation));
    }
    
    /**
     * POST /evaluations/{id}/approve - Approve evaluation
     * Body: { "comment": "Approved by instructor" }
     * Header: X-User-Id, X-User-Name (temporary, will use JWT later)
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<EvaluationDTO>> approveEvaluation(
            @PathVariable Long id,
            @RequestBody(required = false) ApprovalRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName) {
        
        String comment = request != null ? request.getComment() : null;
        
        // TODO: Get current user from JWT token (from auth-service)
        // For now, use headers or null
        Long approverId = userId;
        String approverName = userName;
        
        EvaluationDTO evaluation = evaluationService.approveEvaluation(
            id, comment, approverId, approverName);
        return ResponseEntity.ok(
            ApiResponse.success("Evaluation approved successfully", evaluation));
    }
    
    /**
     * POST /evaluations/{id}/reject - Reject evaluation
     * Body: { "reason": "Missing evidence for criteria X" }
     * Header: X-User-Id, X-User-Name (temporary, will use JWT later)
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<EvaluationDTO>> rejectEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody RejectionRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName) {
        
        // TODO: Get current user from JWT token (from auth-service)
        // For now, use headers or null
        Long rejectorId = userId;
        String rejectorName = userName;
        
        EvaluationDTO evaluation = evaluationService.rejectEvaluation(
            id, request.getReason(), rejectorId, rejectorName);
        return ResponseEntity.ok(
            ApiResponse.success("Evaluation rejected", evaluation));
    }
    
    /**
     * POST /evaluations/{id}/resubmit - Resubmit after rejection
     * Body: { "details": [...], "responseToRejection": "..." }
     */
    @PostMapping("/{id}/resubmit")
    public ResponseEntity<ApiResponse<EvaluationDTO>> resubmitEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody ResubmitEvaluationRequest request) {
        EvaluationDTO evaluation = evaluationService.resubmitEvaluation(id, request);
        return ResponseEntity.ok(
            ApiResponse.success("Evaluation re-submitted successfully", evaluation));
    }
    
    /**
     * GET /evaluations/pending - Get pending evaluations for approval
     * Query params: level (CLASS, FACULTY, CTSV), page, size
     */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<Page<EvaluationDTO>>> getPendingEvaluations(
            @RequestParam(required = false) String level,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<EvaluationDTO> evaluations = evaluationService.getPendingEvaluations(
            level, pageable);
        
        return ResponseEntity.ok(
            ApiResponse.success("Pending evaluations retrieved", evaluations));
    }
    
    /**
     * GET /evaluations/student/{studentCode} - Get evaluations for a student
     */
    @GetMapping("/student/{studentCode}")
    public ResponseEntity<ApiResponse<List<EvaluationDTO>>> getStudentEvaluations(
            @PathVariable String studentCode,
            @RequestParam(required = false) String semester) {
        
        List<EvaluationDTO> evaluations = evaluationService.getEvaluationsByStudent(
            studentCode, semester);
        
        return ResponseEntity.ok(
            ApiResponse.success("Student evaluations retrieved", evaluations));
    }
    
    /**
     * DELETE /evaluations/{id} - Delete evaluation (only DRAFT status)
     * Header: X-Student-Code (temporary, will use JWT later)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEvaluation(
            @PathVariable Long id,
            @RequestHeader(value = "X-Student-Code", required = false) String studentCode) {
        
        // TODO: Get student code from JWT token (from auth-service)
        // For now, use header or get from evaluation
        if (studentCode == null) {
            // Try to get from evaluation
            EvaluationDTO evaluation = evaluationService.getEvaluationById(id);
            studentCode = evaluation.getStudentCode();
        }
        
        evaluationService.deleteEvaluation(id, studentCode);
        
        return ResponseEntity.ok(
            ApiResponse.success("Evaluation deleted successfully", null));
    }
    
    /**
     * Helper method to convert list to page (temporary)
     */
    private <T> Page<T> convertListToPage(List<T> list, Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), list.size());
        
        if (start > list.size()) {
            return Page.empty(pageable);
        }
        
        List<T> sublist = list.subList(start, end);
        return new org.springframework.data.domain.PageImpl<>(
            sublist, pageable, list.size());
    }
}

