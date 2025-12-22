package ptit.drl.evaluation.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ptit.drl.evaluation.dto.*;
import ptit.drl.evaluation.service.AppealService;

import jakarta.validation.Valid;
import java.util.Set;

/**
 * REST Controller for Appeal operations
 */
@RestController
@RequestMapping("/api/appeals")
public class AppealController {
    
    @Autowired
    private AppealService appealService;
    
    /**
     * Create new appeal
     * POST /api/appeals
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AppealDTO>> createAppeal(
            @Valid @RequestBody CreateAppealRequest request,
            @RequestHeader("X-User-Code") String studentCode) {
        try {
            AppealDTO appeal = appealService.createAppeal(request, studentCode);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Appeal created successfully", appeal));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get student's appeals
     * GET /api/appeals/my
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<AppealDTO>>> getMyAppeals(
            @RequestHeader("X-User-Code") String studentCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AppealDTO> appeals = appealService.getStudentAppeals(studentCode, pageable);
            return ResponseEntity.ok(ApiResponse.success("Appeals retrieved successfully", appeals));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get pending appeals for reviewers
     * GET /api/appeals/pending
     */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<Page<AppealDTO>>> getPendingAppeals(
            @RequestHeader("X-User-Roles") String rolesHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            // Parse roles from header
            Set<String> roles = Set.of(rolesHeader.split(","));
            
            // Check authorization
            boolean canReview = roles.contains("ADMIN") || roles.contains("FACULTY_INSTRUCTOR");
            if (!canReview) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Only faculty and administrators can view pending appeals"));
            }
            
            Pageable pageable = PageRequest.of(page, size);
            Page<AppealDTO> appeals = appealService.getPendingAppeals(pageable);
            return ResponseEntity.ok(ApiResponse.success("Pending appeals retrieved successfully", appeals));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get appeal by ID
     * GET /api/appeals/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppealDTO>> getAppealById(
            @PathVariable Long id,
            @RequestHeader("X-User-Code") String userCode,
            @RequestHeader("X-User-Roles") String rolesHeader) {
        try {
            // Parse roles from header
            Set<String> roles = Set.of(rolesHeader.split(","));
            
            AppealDTO appeal = appealService.getAppealById(id, userCode, roles);
            return ResponseEntity.ok(ApiResponse.success("Appeal retrieved successfully", appeal));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Review appeal (accept or reject)
     * PUT /api/appeals/{id}/review
     */
    @PutMapping("/{id}/review")
    public ResponseEntity<ApiResponse<AppealDTO>> reviewAppeal(
            @PathVariable Long id,
            @Valid @RequestBody ReviewAppealRequest request,
            @RequestHeader("X-User-Id") Long reviewerId,
            @RequestHeader("X-User-Roles") String rolesHeader) {
        try {
            // Parse roles from header
            Set<String> roles = Set.of(rolesHeader.split(","));
            
            AppealDTO appeal = appealService.reviewAppeal(id, request, reviewerId, roles);
            return ResponseEntity.ok(ApiResponse.success("Appeal reviewed successfully", appeal));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Check if can appeal for evaluation
     * GET /api/appeals/evaluation/{evaluationId}/can-appeal
     */
    @GetMapping("/evaluation/{evaluationId}/can-appeal")
    public ResponseEntity<ApiResponse<CanAppealResponse>> canAppeal(
            @PathVariable Long evaluationId,
            @RequestHeader("X-User-Code") String studentCode) {
        try {
            boolean canAppeal = appealService.canAppeal(evaluationId, studentCode);
            CanAppealResponse response = new CanAppealResponse(canAppeal);
            return ResponseEntity.ok(ApiResponse.success("Appeal eligibility checked", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get appeal count for student
     * GET /api/appeals/my/count
     */
    @GetMapping("/my/count")
    public ResponseEntity<ApiResponse<Long>> getMyAppealCount(
            @RequestHeader("X-User-Code") String studentCode) {
        try {
            long count = appealService.getAppealCount(studentCode);
            return ResponseEntity.ok(ApiResponse.success("Appeal count retrieved", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get pending appeal count for reviewers
     * GET /api/appeals/pending/count
     */
    @GetMapping("/pending/count")
    public ResponseEntity<ApiResponse<Long>> getPendingAppealCount(
            @RequestHeader("X-User-Roles") String rolesHeader) {
        try {
            // Parse roles from header
            Set<String> roles = Set.of(rolesHeader.split(","));
            
            // Check authorization
            boolean canReview = roles.contains("ADMIN") || roles.contains("FACULTY_INSTRUCTOR");
            if (!canReview) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Only faculty and administrators can view pending appeal count"));
            }
            
            long count = appealService.getPendingAppealCount();
            return ResponseEntity.ok(ApiResponse.success("Pending appeal count retrieved", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Response DTO for can-appeal endpoint
     */
    public static class CanAppealResponse {
        private boolean canAppeal;
        
        public CanAppealResponse(boolean canAppeal) {
            this.canAppeal = canAppeal;
        }
        
        public boolean isCanAppeal() {
            return canAppeal;
        }
        
        public void setCanAppeal(boolean canAppeal) {
            this.canAppeal = canAppeal;
        }
    }
}
