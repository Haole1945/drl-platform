package ptit.drl.student.api;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptit.drl.student.dto.ApiResponse;
import ptit.drl.student.dto.CreateTrainingPointRequest;
import ptit.drl.student.dto.TrainingPointDTO;
import ptit.drl.student.dto.UpdateTrainingPointRequest;
import ptit.drl.student.service.TrainingPointService;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for TrainingPoint management
 */
@RestController
@RequestMapping("/training-points")
public class TrainingPointController {
    
    @Autowired
    private TrainingPointService trainingPointService;
    
    /**
     * GET /training-points - Get all training points with pagination
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<TrainingPointDTO>>> getAllTrainingPoints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<TrainingPointDTO> trainingPoints = trainingPointService.getAllTrainingPoints(pageable);
        
        return ResponseEntity.ok(
            ApiResponse.success("Training points retrieved successfully", trainingPoints));
    }
    
    /**
     * GET /training-points/{id} - Get training point by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TrainingPointDTO>> getTrainingPointById(
            @PathVariable Long id) {
        TrainingPointDTO trainingPoint = trainingPointService.getTrainingPointById(id);
        return ResponseEntity.ok(
            ApiResponse.success("Training point found", trainingPoint));
    }
    
    /**
     * GET /training-points/student/{studentCode} - Get training points by student
     */
    @GetMapping("/student/{studentCode}")
    public ResponseEntity<ApiResponse<List<TrainingPointDTO>>> getTrainingPointsByStudent(
            @PathVariable String studentCode,
            @RequestParam(required = false) String semester) {
        List<TrainingPointDTO> trainingPoints = 
            trainingPointService.getTrainingPointsByStudent(studentCode, semester);
        return ResponseEntity.ok(
            ApiResponse.success("Training points retrieved successfully", trainingPoints));
    }
    
    /**
     * GET /training-points/student/{studentCode}/total - Calculate total points
     */
    @GetMapping("/student/{studentCode}/total")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calculateTotalPoints(
            @PathVariable String studentCode,
            @RequestParam(required = false) String semester) {
        Map<String, Object> result = 
            trainingPointService.calculateTotalPoints(studentCode, semester);
        return ResponseEntity.ok(
            ApiResponse.success("Total points calculated successfully", result));
    }
    
    /**
     * POST /training-points - Create new training point
     * Requires ADMIN or INSTRUCTOR role
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<TrainingPointDTO>> createTrainingPoint(
            @Valid @RequestBody CreateTrainingPointRequest request) {
        TrainingPointDTO trainingPoint = trainingPointService.createTrainingPoint(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Training point created successfully", trainingPoint));
    }
    
    /**
     * PUT /training-points/{id} - Update training point
     * Requires ADMIN or INSTRUCTOR role
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<TrainingPointDTO>> updateTrainingPoint(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTrainingPointRequest request) {
        TrainingPointDTO trainingPoint = trainingPointService.updateTrainingPoint(id, request);
        return ResponseEntity.ok(
            ApiResponse.success("Training point updated successfully", trainingPoint));
    }
    
    /**
     * DELETE /training-points/{id} - Delete training point
     * Requires ADMIN role only
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTrainingPoint(
            @PathVariable Long id) {
        trainingPointService.deleteTrainingPoint(id);
        return ResponseEntity.ok(
            ApiResponse.success("Training point deleted successfully", null));
    }
}

