package ptit.drl.evaluation.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import ptit.drl.evaluation.entity.Criteria;
import ptit.drl.evaluation.entity.EvaluationPeriod;
import ptit.drl.evaluation.entity.Rubric;
import ptit.drl.evaluation.repository.CriteriaRepository;
import ptit.drl.evaluation.repository.EvaluationPeriodRepository;
import ptit.drl.evaluation.repository.RubricRepository;

import java.time.LocalDate;

/**
 * Data seeder to populate initial data for evaluation-service
 * This runs automatically when the application starts
 */
@Component
public class DataSeeder implements CommandLineRunner {
    
    @Autowired
    private RubricRepository rubricRepository;
    
    @Autowired
    private CriteriaRepository criteriaRepository;
    
    @Autowired
    private EvaluationPeriodRepository periodRepository;
    
    @Override
    public void run(String... args) throws Exception {
        // Only seed if database is empty (check if rubrics exist)
        if (rubricRepository.count() > 0) {
            System.out.println("Evaluation service: Database already seeded. Skipping...");
            // But still check and seed evaluation periods if needed
            seedEvaluationPeriods();
            return;
        }
        
        System.out.println("Evaluation service: Seeding initial data...");
        
        // Create Rubric - Phiếu đánh giá Kết quả Rèn luyện (PTIT)
        // Theo Rubric-Criteria-Specification.md
        Rubric rubric2024 = new Rubric("Phiếu đánh giá Kết quả Rèn luyện", 
            "Bảng tiêu chí đánh giá điểm rèn luyện năm học 2024-2025 - Học viện CN Bưu chính Viễn thông (PTIT). " +
            "Tổng điểm tối đa: 100 điểm. " +
            "Bao gồm 5 tiêu chí: Ý thức tham gia học tập (20đ), Ý thức chấp hành nội quy (25đ), " +
            "Hoạt động chính trị – xã hội (20đ), Ý thức công dân (25đ), Phụ trách lớp – thành tích đặc biệt (10đ).", 
            100.0, "2024-2025");
        rubric2024.setIsActive(true);
        rubricRepository.save(rubric2024);
        
        // Tiêu chí 1: Đánh giá về ý thức tham gia học tập (20 điểm)
        // Theo spec: 1.1 Ý thức và thái độ (3đ), 1.2 Kết quả học tập (10đ), 
        // 1.3 Ý thức chấp hành nội quy về các kỳ thi (4đ), 1.4 Tham gia ngoại khóa (2đ), 1.5 Tinh thần vượt khó (1đ)
        Criteria criteria1 = new Criteria("Đánh giá về ý thức tham gia học tập", 
            "Bao gồm:\n" +
            "1.1. Ý thức và thái độ trong học tập: 3 điểm (Đi học đầy đủ, đúng giờ, nghiêm túc)\n" +
            "1.2. Kết quả học tập trong kỳ học: 10 điểm (Xuất sắc: 10đ, Giỏi: 8đ, Khá: 6đ, TB: 4đ, Dưới TB: 0đ, Học lại: -1đ)\n" +
            "1.3. Ý thức chấp hành tốt nội quy về các kỳ thi: 4 điểm cơ bản (Trừ điểm khi vi phạm: Không đủ điều kiện dự thi: -2đ, Khiển trách: -2đ, Cảnh cáo: -3đ, Đình chỉ: -4đ)\n" +
            "1.4. Tham gia ngoại khóa: 2 điểm (0.5 điểm/sự kiện, tối đa 2 điểm)\n" +
            "1.5. Tinh thần vượt khó: 1 điểm", 
            20.0, 1, rubric2024);
        
        // Tiêu chí 2: Ý thức chấp hành nội quy (25 điểm)
        // Theo spec: 2.1 Thực hiện nội quy (15đ), 2.2 Họp lớp/Sinh hoạt đoàn thể (5đ), 2.3 Hội thảo việc làm (5đ)
        Criteria criteria2 = new Criteria("Ý thức chấp hành nội quy", 
            "Bao gồm:\n" +
            "2.1. Thực hiện nội quy: 15 điểm cơ bản (Trừ điểm: Không đóng học phí: -15đ, Không thực hiện quy định ngoại trú/nội trú: -5đ)\n" +
            "2.2. Họp lớp / Sinh hoạt đoàn thể: 5 điểm (Trừ điểm: Vắng 1 buổi: -1 điểm)\n" +
            "2.3. Hội thảo việc làm: 5 điểm (Trừ điểm: Vắng 1 buổi: -2 điểm)", 
            25.0, 2, rubric2024);
        
        // Tiêu chí 3: Hoạt động chính trị – xã hội (20 điểm)
        // Theo spec: 3.1 Hoạt động chính trị, văn nghệ, thể thao (10đ), 3.2 Công tác xã hội (4đ),
        // 3.3 Tuyên truyền hình ảnh trường (3đ), 3.4 Phòng chống tệ nạn (3đ), 3.5 Đưa thông tin sai lệch (-10đ)
        Criteria criteria3 = new Criteria("Hoạt động chính trị – xã hội", 
            "Bao gồm:\n" +
            "3.1. Hoạt động chính trị, văn nghệ, thể thao: 10 điểm\n" +
            "3.2. Công tác xã hội: 4 điểm\n" +
            "3.3. Tuyên truyền hình ảnh trường: 3 điểm\n" +
            "3.4. Phòng chống tệ nạn: 3 điểm\n" +
            "3.5. Đưa thông tin sai lệch: Trừ điểm -10 điểm (mỗi lần vi phạm)", 
            20.0, 3, rubric2024);
        
        // Tiêu chí 4: Ý thức công dân (25 điểm)
        // Theo spec: 4.1 Chấp hành pháp luật (8đ), 4.2 Tuyên truyền, giữ vệ sinh (5đ),
        // 4.3 Quan hệ đúng mực với thầy cô (5đ), 4.4 Quan hệ tốt với bạn bè (5đ),
        // 4.5 Khen thưởng (2đ), 4.6 Vi phạm an ninh trật tự (-5đ)
        Criteria criteria4 = new Criteria("Ý thức công dân", 
            "Bao gồm:\n" +
            "4.1. Chấp hành pháp luật: 8 điểm\n" +
            "4.2. Tuyên truyền, giữ vệ sinh: 5 điểm\n" +
            "4.3. Quan hệ đúng mực với thầy cô: 5 điểm\n" +
            "4.4. Quan hệ tốt với bạn bè: 5 điểm\n" +
            "4.5. Khen thưởng: 2 điểm\n" +
            "4.6. Vi phạm an ninh trật tự: Trừ điểm -5 điểm (mỗi lần vi phạm)", 
            25.0, 4, rubric2024);
        
        // Tiêu chí 5: Phụ trách lớp – thành tích đặc biệt (10 điểm)
        // Theo spec: 5.1 Lớp trưởng/bí thư (4đ), 5.2 Thành viên CLB, tham gia tổ chức (3đ), 5.3 Thành tích đặc biệt (3đ)
        Criteria criteria5 = new Criteria("Phụ trách lớp – thành tích đặc biệt", 
            "Bao gồm:\n" +
            "5.1. Lớp trưởng/bí thư: 4 điểm\n" +
            "5.2. Thành viên CLB, tham gia tổ chức: 3 điểm\n" +
            "5.3. Thành tích đặc biệt: 3 điểm", 
            10.0, 5, rubric2024);
        
        criteriaRepository.save(criteria1);
        criteriaRepository.save(criteria2);
        criteriaRepository.save(criteria3);
        criteriaRepository.save(criteria4);
        criteriaRepository.save(criteria5);
        
        System.out.println("✓ Created rubric: Phiếu đánh giá Kết quả Rèn luyện (100 điểm)");
        System.out.println("✓ Created 5 criteria:");
        System.out.println("  - Tiêu chí 1: Đánh giá về ý thức tham gia học tập (20 điểm)");
        System.out.println("  - Tiêu chí 2: Ý thức chấp hành nội quy (25 điểm)");
        System.out.println("  - Tiêu chí 3: Hoạt động chính trị – xã hội (20 điểm)");
        System.out.println("  - Tiêu chí 4: Ý thức công dân (25 điểm)");
        System.out.println("  - Tiêu chí 5: Phụ trách lớp – thành tích đặc biệt (10 điểm)");
        
        // Seed evaluation periods
        seedEvaluationPeriods();
        
        System.out.println("✅ Evaluation service: Data seeding completed successfully!");
    }
    
    /**
     * Seed evaluation periods if none exist
     */
    private void seedEvaluationPeriods() {
        if (periodRepository.count() > 0) {
            System.out.println("Evaluation periods already exist. Skipping...");
            return;
        }
        
        System.out.println("Seeding evaluation periods...");
        
        // Create a sample evaluation period for current semester
        // Fixed dates: 20/11/2025 - 20/12/2025
        LocalDate startDate = LocalDate.of(2025, 11, 20);
        LocalDate endDate = LocalDate.of(2025, 12, 20);
        
        EvaluationPeriod period = new EvaluationPeriod();
        period.setName("Đợt 1 - Học kỳ 1 năm học 2024-2025");
        period.setSemester("2024-2025-HK1");
        period.setAcademicYear("2024-2025");
        period.setStartDate(startDate);
        period.setEndDate(endDate);
        period.setDescription("Đợt đánh giá điểm rèn luyện học kỳ 1 năm học 2024-2025");
        period.setIsActive(true);
        
        periodRepository.save(period);
        
        System.out.println("✓ Created evaluation period: " + period.getName());
        System.out.println("  - Thời gian: " + startDate + " đến " + endDate);
        System.out.println("✅ Evaluation periods seeding completed!");
    }
}

