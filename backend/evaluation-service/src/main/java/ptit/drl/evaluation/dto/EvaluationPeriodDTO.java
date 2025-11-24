package ptit.drl.evaluation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for Evaluation Period
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationPeriodDTO {
    private Long id;
    private String name;
    private String semester;
    private String academicYear;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isActive;
    private String description;
    private Long rubricId; // ID of rubric used for this period
    private String rubricName; // Name of rubric (for display)
    private String targetClasses; // Target classes/faculties/majors
    
    // Computed fields
    private Boolean isOpen; // Whether period is currently open
    private Boolean isFuture; // Whether period is in the future
    private Boolean isEnded; // Whether period has ended
}

