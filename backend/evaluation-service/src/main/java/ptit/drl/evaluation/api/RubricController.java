package ptit.drl.evaluation.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ptit.drl.evaluation.dto.ApiResponse;
import ptit.drl.evaluation.dto.RubricDTO;
import ptit.drl.evaluation.service.RubricService;

import java.util.List;

/**
 * REST Controller for Rubric management
 */
@RestController
@RequestMapping("/rubrics")
public class RubricController {
    
    @Autowired
    private RubricService rubricService;
    
    /**
     * GET /rubrics - Get all rubrics
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<RubricDTO>>> getAllRubrics() {
        List<RubricDTO> rubrics = rubricService.getAllRubrics();
        return ResponseEntity.ok(
            ApiResponse.success("Rubrics retrieved successfully", rubrics));
    }
    
    /**
     * GET /rubrics/{id} - Get rubric by ID with criteria
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RubricDTO>> getRubricById(
            @PathVariable Long id) {
        RubricDTO rubric = rubricService.getRubricById(id);
        return ResponseEntity.ok(
            ApiResponse.success("Rubric found", rubric));
    }
    
    /**
     * GET /rubrics/active - Get active rubric
     * Query param: academicYear (optional), classCode (optional)
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<RubricDTO>> getActiveRubric(
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String classCode) {
        RubricDTO rubric = rubricService.getActiveRubric(academicYear, classCode);
        return ResponseEntity.ok(
            ApiResponse.success("Active rubric found", rubric));
    }
    
    /**
     * POST /rubrics - Create new rubric
     * Body: { "name", "description", "maxScore", "academicYear", "isActive", "targetClasses" }
     */
    @PostMapping
    public ResponseEntity<ApiResponse<RubricDTO>> createRubric(
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam Double maxScore,
            @RequestParam String academicYear,
            @RequestParam(required = false, defaultValue = "true") Boolean isActive,
            @RequestParam(required = false) String targetClasses) {
        
        RubricDTO rubric = rubricService.createRubric(
            name, description, maxScore, academicYear, isActive, targetClasses);
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Rubric created successfully", rubric));
    }
    
    /**
     * PUT /rubrics/{id} - Update rubric
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RubricDTO>> updateRubric(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Double maxScore,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String targetClasses) {
        
        RubricDTO rubric = rubricService.updateRubric(
            id, name, description, maxScore, academicYear, isActive, targetClasses);
        
        return ResponseEntity.ok(
            ApiResponse.success("Rubric updated successfully", rubric));
    }
    
    /**
     * POST /rubrics/{id}/activate - Activate rubric
     */
    @PostMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<RubricDTO>> activateRubric(
            @PathVariable Long id) {
        RubricDTO rubric = rubricService.activateRubric(id);
        return ResponseEntity.ok(
            ApiResponse.success("Rubric activated successfully", rubric));
    }
    
    /**
     * POST /rubrics/{id}/deactivate - Deactivate rubric
     */
    @PostMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<RubricDTO>> deactivateRubric(
            @PathVariable Long id) {
        RubricDTO rubric = rubricService.deactivateRubric(id);
        return ResponseEntity.ok(
            ApiResponse.success("Rubric deactivated successfully", rubric));
    }
}

