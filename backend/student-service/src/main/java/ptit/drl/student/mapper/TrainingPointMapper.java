package ptit.drl.student.mapper;

import ptit.drl.student.dto.CreateTrainingPointRequest;
import ptit.drl.student.dto.TrainingPointDTO;
import ptit.drl.student.dto.UpdateTrainingPointRequest;
import ptit.drl.student.entity.TrainingPoint;
import ptit.drl.student.entity.Student;

/**
 * Mapper for TrainingPoint entity and DTOs
 */
public class TrainingPointMapper {
    
    /**
     * Convert TrainingPoint entity to TrainingPointDTO
     */
    public static TrainingPointDTO toDTO(TrainingPoint trainingPoint) {
        if (trainingPoint == null) {
            return null;
        }
        
        TrainingPointDTO dto = new TrainingPointDTO();
        dto.setId(trainingPoint.getId());
        dto.setActivityName(trainingPoint.getActivityName());
        dto.setDescription(trainingPoint.getDescription());
        dto.setActivityDate(trainingPoint.getActivityDate());
        dto.setPoints(trainingPoint.getPoints());
        dto.setEvidenceUrl(trainingPoint.getEvidenceUrl());
        dto.setSemester(trainingPoint.getSemester());
        
        // Map student information
        if (trainingPoint.getStudent() != null) {
            dto.setStudentCode(trainingPoint.getStudent().getStudentCode());
            dto.setStudentName(trainingPoint.getStudent().getFullName());
        }
        
        return dto;
    }
    
    /**
     * Convert CreateTrainingPointRequest to TrainingPoint entity
     */
    public static TrainingPoint toEntity(CreateTrainingPointRequest request, Student student) {
        if (request == null) {
            return null;
        }
        
        TrainingPoint trainingPoint = new TrainingPoint();
        trainingPoint.setActivityName(request.getActivityName());
        trainingPoint.setDescription(request.getDescription());
        trainingPoint.setActivityDate(request.getActivityDate());
        trainingPoint.setPoints(request.getPoints());
        trainingPoint.setEvidenceUrl(request.getEvidenceUrl());
        trainingPoint.setSemester(request.getSemester());
        trainingPoint.setStudent(student);
        
        return trainingPoint;
    }
    
    /**
     * Update TrainingPoint entity from UpdateTrainingPointRequest
     * Only updates non-null fields
     */
    public static void updateEntity(TrainingPoint trainingPoint, UpdateTrainingPointRequest request) {
        if (request == null || trainingPoint == null) {
            return;
        }
        
        if (request.getActivityName() != null) {
            trainingPoint.setActivityName(request.getActivityName());
        }
        
        if (request.getDescription() != null) {
            trainingPoint.setDescription(request.getDescription());
        }
        
        if (request.getActivityDate() != null) {
            trainingPoint.setActivityDate(request.getActivityDate());
        }
        
        if (request.getPoints() != null) {
            trainingPoint.setPoints(request.getPoints());
        }
        
        if (request.getEvidenceUrl() != null) {
            trainingPoint.setEvidenceUrl(request.getEvidenceUrl());
        }
        
        if (request.getSemester() != null) {
            trainingPoint.setSemester(request.getSemester());
        }
    }
}

