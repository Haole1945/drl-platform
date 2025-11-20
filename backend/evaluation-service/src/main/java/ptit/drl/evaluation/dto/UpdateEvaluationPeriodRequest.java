package ptit.drl.evaluation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for updating evaluation period
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEvaluationPeriodRequest {
    
    @NotBlank(message = "Tên đợt đánh giá không được để trống")
    private String name;
    
    @NotBlank(message = "Học kỳ không được để trống")
    private String semester;
    
    @NotBlank(message = "Năm học không được để trống")
    private String academicYear;
    
    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;
    
    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;
    
    private String description;
    
    @NotNull(message = "Trạng thái hoạt động không được để trống")
    private Boolean isActive;
}

