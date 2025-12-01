package ptit.drl.evaluation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ptit.drl.evaluation.client.StudentServiceClient;
import ptit.drl.evaluation.dto.AiScoringRequest;
import ptit.drl.evaluation.dto.AiScoringResponse;
import ptit.drl.evaluation.entity.Criteria;
import ptit.drl.evaluation.entity.Evaluation;
import ptit.drl.evaluation.entity.EvidenceFile;
import ptit.drl.evaluation.exception.ResourceNotFoundException;
import ptit.drl.evaluation.repository.CriteriaRepository;
import ptit.drl.evaluation.repository.EvaluationRepository;
import ptit.drl.evaluation.repository.EvidenceFileRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

/**
 * AI Scoring Service
 * Sử dụng GPT-5.1 Vision để phân tích hình ảnh minh chứng và gợi ý điểm
 */
@Service
public class AiScoringService {
    
    private static final Logger logger = LoggerFactory.getLogger(AiScoringService.class);
    
    @Value("${openai.api.key}")
    private String openaiApiKey;
    
    @Value("${openai.api.model:gpt-4-vision-preview}")
    private String modelName;
    
    @Value("${file.upload-dir}")
    private String uploadDir;
    
    private final CriteriaRepository criteriaRepository;
    private final EvidenceFileRepository evidenceFileRepository;
    private final EvaluationRepository evaluationRepository;
    private final StudentServiceClient studentServiceClient;
    private final OpenAiClient openAiClient;
    private final ObjectMapper objectMapper;
    
    public AiScoringService(
            CriteriaRepository criteriaRepository,
            EvidenceFileRepository evidenceFileRepository,
            EvaluationRepository evaluationRepository,
            StudentServiceClient studentServiceClient,
            OpenAiClient openAiClient,
            ObjectMapper objectMapper) {
        this.criteriaRepository = criteriaRepository;
        this.evidenceFileRepository = evidenceFileRepository;
        this.evaluationRepository = evaluationRepository;
        this.studentServiceClient = studentServiceClient;
        this.openAiClient = openAiClient;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Phân tích minh chứng và gợi ý điểm sử dụng GPT-5.1 Vision
     */
    public AiScoringResponse suggestScore(AiScoringRequest request) {
        long startTime = System.currentTimeMillis();
        
        try {
            // 1. Lấy thông tin tiêu chí
            Criteria criteria = criteriaRepository.findById(request.getCriteriaId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "Criteria", "id", request.getCriteriaId()));
            
            // 2. Lấy danh sách file minh chứng
            List<EvidenceFile> evidenceFiles = new ArrayList<>();
            for (Long fileId : request.getEvidenceFileIds()) {
                EvidenceFile file = evidenceFileRepository.findById(fileId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                            "EvidenceFile", "id", fileId));
                evidenceFiles.add(file);
            }
            
            if (evidenceFiles.isEmpty()) {
                return createNoEvidenceResponse(criteria.getMaxPoints());
            }
            
            // 3. Đọc và encode ảnh thành base64
            List<String> base64Images = new ArrayList<>();
            for (EvidenceFile file : evidenceFiles) {
                // Chỉ xử lý file ảnh
                if (file.getFileType() != null && file.getFileType().startsWith("image/")) {
                    try {
                        String base64 = encodeImageToBase64(file.getFilePath());
                        base64Images.add(base64);
                    } catch (IOException e) {
                        logger.warn("Failed to read image file: {}", file.getFilePath(), e);
                    }
                }
            }
            
            if (base64Images.isEmpty()) {
                return createNoImageResponse(criteria.getMaxPoints());
            }
            
            // 4. Lấy thông tin sinh viên được đánh giá
            StudentInfo evaluatedStudentInfo = getEvaluatedStudentInfo(request, evidenceFiles);
            
            // 5. Tạo prompt cho GPT với thông tin sinh viên
            String prompt = buildPrompt(criteria, request.getSubCriteriaId(), evaluatedStudentInfo);
            
            // 6. Gọi GPT-5.1 Vision API
            String gptResponse = openAiClient.analyzeImagesWithVision(
                    prompt, 
                    base64Images, 
                    modelName);
            
            // 7. Parse JSON response từ GPT
            AiScoringResponse response = parseGptResponse(
                    gptResponse, 
                    criteria.getMaxPoints());
            
            // 8. Set thời gian xử lý
            long processingTime = System.currentTimeMillis() - startTime;
            response.setProcessingTimeMs(processingTime);
            
            logger.info("AI scoring completed for criteria {} in {}ms. Suggested score: {}/{}",
                    criteria.getId(), processingTime, response.getSuggestedScore(), 
                    response.getMaxScore());
            
            return response;
            
        } catch (Exception e) {
            logger.error("Error during AI scoring", e);
            long processingTime = System.currentTimeMillis() - startTime;
            return createErrorResponse(e.getMessage(), processingTime);
        }
    }
    
    /**
     * Lấy thông tin sinh viên được đánh giá từ evaluation
     */
    private StudentInfo getEvaluatedStudentInfo(AiScoringRequest request, List<EvidenceFile> evidenceFiles) {
        Long evaluationId = request.getEvaluationId();
        
        // Nếu không có evaluationId trong request, thử lấy từ evidenceFile
        if (evaluationId == null && evidenceFiles != null && !evidenceFiles.isEmpty()) {
            evaluationId = evidenceFiles.get(0).getEvaluationId();
        }
        
        if (evaluationId == null) {
            logger.debug("No evaluation ID found, skipping student info");
            return new StudentInfo(null, null, null, null);
        }
        
        try {
            Optional<Evaluation> evaluationOpt = evaluationRepository.findById(evaluationId);
            if (evaluationOpt.isEmpty()) {
                logger.warn("Evaluation not found: {}", evaluationId);
                return new StudentInfo(null, null, null, null);
            }
            
            Evaluation evaluation = evaluationOpt.get();
            String studentCode = evaluation.getStudentCode();
            
            // Lấy thông tin chi tiết từ student-service
            try {
                StudentServiceClient.StudentResponse studentResponse = 
                        studentServiceClient.getStudentByCode(studentCode);
                
                if (studentResponse != null && studentResponse.isSuccess() 
                        && studentResponse.getData() != null) {
                    StudentServiceClient.StudentDTO student = studentResponse.getData();
                    return new StudentInfo(
                            student.getStudentCode(),
                            student.getFullName(),
                            student.getClassCode(),
                            student.getClassName()
                    );
                }
            } catch (Exception e) {
                logger.warn("Failed to get student info from student-service: {}", e.getMessage());
            }
            
            // Fallback: chỉ trả về studentCode
            return new StudentInfo(studentCode, null, null, null);
            
        } catch (Exception e) {
            logger.error("Error getting evaluated student info", e);
            return new StudentInfo(null, null, null, null);
        }
    }
    
    /**
     * Inner class để lưu thông tin sinh viên được đánh giá
     */
    private static class StudentInfo {
        final String studentCode;
        final String fullName;
        final String classCode;
        final String className;
        
        StudentInfo(String studentCode, String fullName, String classCode, String className) {
            this.studentCode = studentCode;
            this.fullName = fullName;
            this.classCode = classCode;
            this.className = className;
        }
    }
    
    /**
     * Xây dựng prompt cho GPT dựa trên tiêu chí
     */
    private String buildPrompt(Criteria criteria, String subCriteriaId, StudentInfo studentInfo) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Bạn là trợ lý AI hỗ trợ chấm điểm rèn luyện sinh viên tại Học viện Công nghệ Bưu chính Viễn thông.\n\n");
        
        prompt.append("NHIỆM VỤ:\n");
        prompt.append("1. Xem xét các hình ảnh minh chứng được cung cấp.\n");
        prompt.append("2. Đối chiếu với tiêu chí chấm điểm bên dưới.\n");
        prompt.append("3. Đối chiếu thông tin trong minh chứng với thông tin sinh viên được đánh giá.\n");
        prompt.append("4. Gợi ý số điểm hợp lý, mức độ tin cậy và giải thích.\n\n");
        
        // Thông tin sinh viên được đánh giá
        prompt.append("THÔNG TIN SINH VIÊN ĐƯỢC ĐÁNH GIÁ:\n");
        if (studentInfo.studentCode != null) {
            prompt.append("- MSSV: ").append(studentInfo.studentCode).append("\n");
            if (studentInfo.fullName != null && !studentInfo.fullName.isEmpty()) {
                prompt.append("- Họ tên: ").append(studentInfo.fullName).append("\n");
            }
            if (studentInfo.classCode != null && !studentInfo.classCode.isEmpty()) {
                prompt.append("- Lớp: ").append(studentInfo.classCode);
                if (studentInfo.className != null && !studentInfo.className.isEmpty()) {
                    prompt.append(" (").append(studentInfo.className).append(")");
                }
                prompt.append("\n");
            }
        } else {
            prompt.append("- Không có thông tin sinh viên được đánh giá\n");
        }
        prompt.append("\n");
        
        prompt.append("TIÊU CHÍ:\n");
        prompt.append("- Tên tiêu chí: ").append(criteria.getName()).append("\n");
        prompt.append("- Điểm tối đa: ").append(criteria.getMaxPoints()).append(" điểm\n");
        
        if (criteria.getDescription() != null && !criteria.getDescription().isEmpty()) {
            prompt.append("- Mô tả và cách chấm:\n");
            prompt.append(criteria.getDescription()).append("\n");
        }
        
        if (subCriteriaId != null && !subCriteriaId.isEmpty()) {
            prompt.append("- Tiêu chí phụ cần chấm: ").append(subCriteriaId).append("\n");
        }
        
        prompt.append("\nLƯU Ý KHI PHÂN TÍCH MINH CHỨNG:\n");
        prompt.append("- Hình ảnh minh chứng thường là: giấy chứng nhận, biên bản, ảnh tham gia hoạt động, bảng điểm.\n");
        prompt.append("- Kiểm tra độ rõ ràng, tính hợp lệ, có tên sinh viên/thời gian/tổ chức không.\n");
        prompt.append("- QUAN TRỌNG: Đối chiếu thông tin trong minh chứng với thông tin sinh viên được đánh giá:\n");
        prompt.append("  + Nếu minh chứng có tên/MSSV, phải khớp với thông tin sinh viên được đánh giá.\n");
        prompt.append("  + Nếu minh chứng có thông tin về lớp, phải khớp với lớp của sinh viên được đánh giá.\n");
        prompt.append("  + Nếu minh chứng có thông tin về thời gian, tổ chức, phải phù hợp với tiêu chí chấm điểm.\n");
        prompt.append("- Nếu hình mờ, thiếu thông tin hoặc thông tin không khớp → điểm thấp hoặc UNCERTAIN.\n");
        prompt.append("- Nếu hình không liên quan đến tiêu chí hoặc thông tin hoàn toàn không khớp → điểm 0 hoặc REJECT.\n\n");
        
        prompt.append("YÊU CẦU OUTPUT:\n");
        prompt.append("Chỉ trả về JSON đúng cấu trúc sau, KHÔNG thêm text ngoài JSON:\n\n");
        prompt.append("{\n");
        prompt.append("  \"suggested_score\": <BẮT BUỘC là SỐ NGUYÊN từ 0 đến ").append(criteria.getMaxPoints().intValue()).append(" (chỉ chấp nhận: 0, 1, 2, 3, ... KHÔNG được là số thập phân như 1.5, 2.7, 3.2)>,\n");
        prompt.append("  \"max_score\": ").append(criteria.getMaxPoints()).append(",\n");
        prompt.append("  \"status\": \"ACCEPTABLE\" | \"REJECT\" | \"UNCERTAIN\",\n");
        prompt.append("  \"confidence\": <số từ 0.0 đến 1.0>,\n");
        prompt.append("  \"reason\": \"<giải thích ngắn gọn bằng tiếng Việt, 1-3 câu>\",\n");
        prompt.append("  \"analysis_details\": \"<phân tích chi tiết từng ảnh nếu có nhiều ảnh>\"\n");
        prompt.append("}\n\n");
        
        prompt.append("LƯU Ý QUAN TRỌNG:\n");
        prompt.append("- suggested_score PHẢI là số nguyên (integer), KHÔNG được là số thập phân\n");
        prompt.append("- Ví dụ đúng: 0, 1, 2, 3, 5, 10\n");
        prompt.append("- Ví dụ sai (KHÔNG CHẤP NHẬN): 1.5, 2.7, 3.2, 4.5\n");
        prompt.append("- Nếu bạn tính được điểm là số thập phân, hãy làm tròn lên hoặc xuống thành số nguyên gần nhất\n\n");
        
        prompt.append("Hãy phân tích hình ảnh và trả về JSON:");
        
        return prompt.toString();
    }
    
    /**
     * Encode image file to base64
     */
    private String encodeImageToBase64(String filePath) throws IOException {
        Path path = Paths.get(filePath);
        byte[] imageBytes = Files.readAllBytes(path);
        return Base64.getEncoder().encodeToString(imageBytes);
    }
    
    /**
     * Parse GPT response JSON
     */
    private AiScoringResponse parseGptResponse(String gptResponse, Double maxScore) {
        try {
            // Loại bỏ markdown code block nếu có
            String jsonString = gptResponse.trim();
            if (jsonString.startsWith("```json")) {
                jsonString = jsonString.substring(7);
            }
            if (jsonString.startsWith("```")) {
                jsonString = jsonString.substring(3);
            }
            if (jsonString.endsWith("```")) {
                jsonString = jsonString.substring(0, jsonString.length() - 3);
            }
            jsonString = jsonString.trim();
            
            JsonNode root = objectMapper.readTree(jsonString);
            
            // Làm tròn điểm gợi ý từ AI thành số nguyên (1, 2, 3, ...)
            // Đảm bảo luôn là số nguyên, không có phần thập phân
            double rawScore = root.has("suggested_score") ? 
                    root.get("suggested_score").asDouble() : 0.0;
            // Làm tròn và chuyển thành số nguyên (long, sau đó double để giữ kiểu Double)
            long roundedScoreLong = Math.round(rawScore);
            // Đảm bảo trong khoảng hợp lệ: 0 <= score <= maxScore
            if (roundedScoreLong < 0) {
                roundedScoreLong = 0;
            }
            double maxScoreInt = maxScore != null ? Math.round(maxScore) : 10;
            if (roundedScoreLong > maxScoreInt) {
                roundedScoreLong = (long) maxScoreInt;
            }
            double roundedScore = (double) roundedScoreLong;
            
            logger.debug("AI raw score: {}, rounded to integer: {}", rawScore, roundedScore);
            
            return AiScoringResponse.builder()
                    .suggestedScore(roundedScore)
                    .maxScore(root.has("max_score") ? 
                            root.get("max_score").asDouble() : maxScore)
                    .status(root.has("status") ? 
                            root.get("status").asText() : "UNCERTAIN")
                    .confidence(root.has("confidence") ? 
                            root.get("confidence").asDouble() : 0.5)
                    .reason(root.has("reason") ? 
                            root.get("reason").asText() : "Không có giải thích")
                    .analysisDetails(root.has("analysis_details") ? 
                            root.get("analysis_details").asText() : null)
                    .build();
                    
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse GPT response: {}", gptResponse, e);
            return AiScoringResponse.builder()
                    .suggestedScore(0.0) // Số nguyên 0
                    .maxScore(maxScore)
                    .status("UNCERTAIN")
                    .confidence(0.0)
                    .reason("Lỗi parse JSON từ GPT: " + e.getMessage())
                    .build();
        }
    }
    
    /**
     * Response khi không có minh chứng
     */
    private AiScoringResponse createNoEvidenceResponse(Double maxScore) {
        return AiScoringResponse.builder()
                .suggestedScore(0.0)
                .maxScore(maxScore)
                .status("REJECT")
                .confidence(1.0)
                .reason("Không có file minh chứng được cung cấp.")
                .processingTimeMs(0L)
                .build();
    }
    
    /**
     * Response khi không có ảnh (chỉ có file không phải ảnh)
     */
    private AiScoringResponse createNoImageResponse(Double maxScore) {
        return AiScoringResponse.builder()
                .suggestedScore(0.0)
                .maxScore(maxScore)
                .status("UNCERTAIN")
                .confidence(0.5)
                .reason("Không có file ảnh để phân tích. Vui lòng kiểm tra thủ công.")
                .processingTimeMs(0L)
                .build();
    }
    
    /**
     * Response khi có lỗi
     */
    private AiScoringResponse createErrorResponse(String errorMessage, Long processingTime) {
        return AiScoringResponse.builder()
                .suggestedScore(0.0)
                .maxScore(0.0)
                .status("UNCERTAIN")
                .confidence(0.0)
                .reason("Lỗi khi xử lý: " + errorMessage)
                .processingTimeMs(processingTime)
                .build();
    }
}

