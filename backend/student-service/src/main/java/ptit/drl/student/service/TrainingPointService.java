package ptit.drl.student.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptit.drl.student.dto.CreateTrainingPointRequest;
import ptit.drl.student.dto.TrainingPointDTO;
import ptit.drl.student.dto.UpdateTrainingPointRequest;
import ptit.drl.student.entity.Student;
import ptit.drl.student.entity.TrainingPoint;
import ptit.drl.student.exception.ResourceNotFoundException;
import ptit.drl.student.mapper.TrainingPointMapper;
import ptit.drl.student.repository.StudentRepository;
import ptit.drl.student.repository.TrainingPointRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for TrainingPoint CRUD operations
 */
@Service
@Transactional
public class TrainingPointService {
    
    @Autowired
    private TrainingPointRepository trainingPointRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    /**
     * Get all training points with pagination
     */
    public Page<TrainingPointDTO> getAllTrainingPoints(Pageable pageable) {
        return trainingPointRepository.findAll(pageable)
                .map(TrainingPointMapper::toDTO);
    }
    
    /**
     * Get training point by ID
     */
    public TrainingPointDTO getTrainingPointById(Long id) {
        TrainingPoint trainingPoint = trainingPointRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "TrainingPoint", "id", id));
        return TrainingPointMapper.toDTO(trainingPoint);
    }
    
    /**
     * Create a new training point
     */
    public TrainingPointDTO createTrainingPoint(CreateTrainingPointRequest request) {
        // Validate student exists
        Student student = studentRepository.findById(request.getStudentCode())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Student", "code", request.getStudentCode()));
        
        // Create and save training point
        TrainingPoint trainingPoint = TrainingPointMapper.toEntity(request, student);
        TrainingPoint savedTrainingPoint = trainingPointRepository.save(trainingPoint);
        
        return TrainingPointMapper.toDTO(savedTrainingPoint);
    }
    
    /**
     * Update an existing training point
     */
    public TrainingPointDTO updateTrainingPoint(Long id, UpdateTrainingPointRequest request) {
        // Find existing training point
        TrainingPoint trainingPoint = trainingPointRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "TrainingPoint", "id", id));
        
        // Update training point
        TrainingPointMapper.updateEntity(trainingPoint, request);
        TrainingPoint updatedTrainingPoint = trainingPointRepository.save(trainingPoint);
        
        return TrainingPointMapper.toDTO(updatedTrainingPoint);
    }
    
    /**
     * Delete a training point
     */
    public void deleteTrainingPoint(Long id) {
        if (!trainingPointRepository.existsById(id)) {
            throw new ResourceNotFoundException("TrainingPoint", "id", id);
        }
        trainingPointRepository.deleteById(id);
    }
    
    /**
     * Get training points by student code
     */
    public List<TrainingPointDTO> getTrainingPointsByStudent(String studentCode, String semester) {
        // Validate student exists
        if (!studentRepository.existsById(studentCode)) {
            throw new ResourceNotFoundException("Student", "code", studentCode);
        }
        
        List<TrainingPoint> trainingPoints;
        if (semester != null && !semester.isEmpty()) {
            trainingPoints = trainingPointRepository.findByStudentStudentCodeAndSemester(
                studentCode, semester);
        } else {
            trainingPoints = trainingPointRepository.findByStudentStudentCode(studentCode);
        }
        
        return trainingPoints.stream()
                .map(TrainingPointMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get training points by student with pagination
     */
    public Page<TrainingPointDTO> getTrainingPointsByStudentPaged(
            String studentCode, Pageable pageable) {
        return trainingPointRepository.findByStudentStudentCode(studentCode, pageable)
                .map(TrainingPointMapper::toDTO);
    }
    
    /**
     * Calculate total points by student
     */
    public Map<String, Object> calculateTotalPoints(String studentCode, String semester) {
        // Validate student exists
        Student student = studentRepository.findById(studentCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Student", "code", studentCode));
        
        List<TrainingPoint> trainingPoints;
        if (semester != null && !semester.isEmpty()) {
            trainingPoints = trainingPointRepository.findByStudentStudentCodeAndSemester(
                studentCode, semester);
        } else {
            trainingPoints = trainingPointRepository.findByStudentStudentCode(studentCode);
        }
        
        double totalPoints = trainingPoints.stream()
                .mapToDouble(TrainingPoint::getPoints)
                .sum();
        
        Map<String, Object> result = new HashMap<>();
        result.put("studentCode", studentCode);
        result.put("studentName", student.getFullName());
        result.put("semester", semester);
        result.put("totalPoints", totalPoints);
        result.put("activityCount", trainingPoints.size());
        
        return result;
    }
}

