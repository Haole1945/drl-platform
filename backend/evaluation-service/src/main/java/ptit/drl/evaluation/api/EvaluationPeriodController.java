package ptit.drl.evaluation.api;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptit.drl.evaluation.dto.*;
import ptit.drl.evaluation.entity.EvaluationPeriod;
import ptit.drl.evaluation.mapper.EvaluationPeriodMapper;
import ptit.drl.evaluation.service.EvaluationPeriodService;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for Evaluation Period management
 * Only ADMIN and INSTITUTE_COUNCIL can manage periods
 */
@RestController
@RequestMapping("/evaluation-periods")
public class EvaluationPeriodController {
    
    @Autowired
    private EvaluationPeriodService periodService;
    
    /**
     * GET /evaluation-periods/open - Get currently open period (public)
     * Optional classCode parameter to filter by target classes
     */
    @GetMapping("/open")
    public ResponseEntity<ApiResponse<EvaluationPeriodDTO>> getOpenPeriod(
            @RequestParam(required = false) String classCode) {
        
        if (classCode != null && !classCode.isEmpty()) {
            // Get period for specific class
            return periodService.getOpenPeriodForClass(classCode)
                    .map(period -> ResponseEntity.ok(
                        ApiResponse.success("Đợt đánh giá đang mở", EvaluationPeriodMapper.toDTO(period))))
                    .orElse(ResponseEntity.ok(
                        ApiResponse.success("Không có đợt đánh giá nào áp dụng cho lớp này", null)));
        }
        
        // Get any open period
        return periodService.getOpenPeriod()
                .map(period -> ResponseEntity.ok(
                    ApiResponse.success("Đợt đánh giá đang mở", EvaluationPeriodMapper.toDTO(period))))
                .orElse(ResponseEntity.ok(
                    ApiResponse.success("Không có đợt đánh giá nào đang mở", null)));
    }
    
    /**
     * GET /evaluation-periods - Get all periods (both active and inactive)
     * For admin use - shows all periods regardless of active status
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<EvaluationPeriodDTO>>> getAllPeriods() {
        List<EvaluationPeriodDTO> periods = periodService.getAllPeriods().stream()
                .map(EvaluationPeriodMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Danh sách đợt đánh giá", periods));
    }
    
    /**
     * GET /evaluation-periods/active - Get all active periods only (public)
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<EvaluationPeriodDTO>>> getAllActivePeriods() {
        List<EvaluationPeriodDTO> periods = periodService.getAllActivePeriods().stream()
                .map(EvaluationPeriodMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Danh sách đợt đánh giá đang kích hoạt", periods));
    }
    
    /**
     * GET /evaluation-periods/{id} - Get period by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EvaluationPeriodDTO>> getPeriodById(@PathVariable Long id) {
        EvaluationPeriod period = periodService.getPeriodById(id);
        return ResponseEntity.ok(
            ApiResponse.success("Thông tin đợt đánh giá", EvaluationPeriodMapper.toDTO(period)));
    }
    
    /**
     * POST /evaluation-periods - Create new period (ADMIN, INSTITUTE_COUNCIL only)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTITUTE_COUNCIL')")
    public ResponseEntity<ApiResponse<EvaluationPeriodDTO>> createPeriod(
            @Valid @RequestBody CreateEvaluationPeriodRequest request) {
        
        // Validate dates
        if (request.getEndDate().isBefore(request.getStartDate())) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Ngày kết thúc phải sau ngày bắt đầu"));
        }
        
        EvaluationPeriod period = EvaluationPeriodMapper.toEntity(request);
        EvaluationPeriod saved = periodService.createPeriod(period);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Đã tạo đợt đánh giá thành công", EvaluationPeriodMapper.toDTO(saved)));
    }
    
    /**
     * PUT /evaluation-periods/{id} - Update period (ADMIN, INSTITUTE_COUNCIL only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTITUTE_COUNCIL')")
    public ResponseEntity<ApiResponse<EvaluationPeriodDTO>> updatePeriod(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEvaluationPeriodRequest request) {
        
        // Validate dates
        if (request.getEndDate().isBefore(request.getStartDate())) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Ngày kết thúc phải sau ngày bắt đầu"));
        }
        
        EvaluationPeriod period = periodService.getPeriodById(id);
        EvaluationPeriodMapper.updateEntity(period, request);
        EvaluationPeriod updated = periodService.updatePeriod(id, period);
        return ResponseEntity.ok(
            ApiResponse.success("Đã cập nhật đợt đánh giá thành công", EvaluationPeriodMapper.toDTO(updated)));
    }
    
    /**
     * DELETE /evaluation-periods/{id} - Deactivate period (ADMIN, INSTITUTE_COUNCIL only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTITUTE_COUNCIL')")
    public ResponseEntity<ApiResponse<String>> deactivatePeriod(@PathVariable Long id) {
        periodService.deactivatePeriod(id);
        return ResponseEntity.ok(
            ApiResponse.success("Đã vô hiệu hóa đợt đánh giá thành công"));
    }
    
    /**
     * GET /evaluation-periods/semester/{semester} - Get periods by semester
     */
    @GetMapping("/semester/{semester}")
    public ResponseEntity<ApiResponse<List<EvaluationPeriodDTO>>> getPeriodsBySemester(
            @PathVariable String semester) {
        List<EvaluationPeriodDTO> periods = periodService.getPeriodsBySemester(semester).stream()
                .map(EvaluationPeriodMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(
            ApiResponse.success("Danh sách đợt đánh giá theo học kỳ", periods));
    }
    
    /**
     * GET /evaluation-periods/academic-year/{academicYear} - Get periods by academic year
     */
    @GetMapping("/academic-year/{academicYear}")
    public ResponseEntity<ApiResponse<List<EvaluationPeriodDTO>>> getPeriodsByAcademicYear(
            @PathVariable String academicYear) {
        List<EvaluationPeriodDTO> periods = periodService.getPeriodsByAcademicYear(academicYear).stream()
                .map(EvaluationPeriodMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(
            ApiResponse.success("Danh sách đợt đánh giá theo năm học", periods));
    }
}

