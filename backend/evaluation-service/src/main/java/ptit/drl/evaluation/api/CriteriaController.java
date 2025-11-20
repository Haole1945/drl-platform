package ptit.drl.evaluation.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ptit.drl.evaluation.dto.ApiResponse;
import ptit.drl.evaluation.dto.CriteriaDTO;
import ptit.drl.evaluation.service.CriteriaService;

import java.util.List;

/**
 * REST Controller for Criteria management
 */
@RestController
@RequestMapping("/criteria")
public class CriteriaController {
    
    @Autowired
    private CriteriaService criteriaService;
    
    /**
     * GET /criteria - Get criteria by rubric ID
     * Query param: rubricId (required)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CriteriaDTO>>> getCriteriaByRubric(
            @RequestParam Long rubricId) {
        List<CriteriaDTO> criteria = criteriaService.getCriteriaByRubricId(rubricId);
        return ResponseEntity.ok(
            ApiResponse.success("Criteria retrieved successfully", criteria));
    }
    
    /**
     * GET /criteria/{id} - Get criteria by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CriteriaDTO>> getCriteriaById(
            @PathVariable Long id) {
        CriteriaDTO criteria = criteriaService.getCriteriaById(id);
        return ResponseEntity.ok(
            ApiResponse.success("Criteria found", criteria));
    }
    
    /**
     * POST /criteria - Create new criteria
     * Body params: name, description, maxScore, orderIndex, rubricId
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CriteriaDTO>> createCriteria(
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam Double maxScore,
            @RequestParam Integer orderIndex,
            @RequestParam Long rubricId) {
        
        CriteriaDTO criteria = criteriaService.createCriteria(
            name, description, maxScore, orderIndex, rubricId);
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Criteria created successfully", criteria));
    }
    
    /**
     * PUT /criteria/{id} - Update criteria
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CriteriaDTO>> updateCriteria(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Double maxScore,
            @RequestParam(required = false) Integer orderIndex) {
        
        CriteriaDTO criteria = criteriaService.updateCriteria(
            id, name, description, maxScore, orderIndex);
        
        return ResponseEntity.ok(
            ApiResponse.success("Criteria updated successfully", criteria));
    }
    
    /**
     * DELETE /criteria/{id} - Delete criteria
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCriteria(
            @PathVariable Long id) {
        criteriaService.deleteCriteria(id);
        return ResponseEntity.ok(
            ApiResponse.success("Criteria deleted successfully", null));
    }
}

