package ptit.drl.student.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import ptit.drl.student.entity.*;
import ptit.drl.student.repository.*;

import java.time.LocalDate;

/**
 * Data seeder to populate initial data for student-service
 * Note: User, Role, Permission are seeded by auth-service
 * Note: Rubric, Criteria are seeded by evaluation-service
 * This runs automatically when the application starts
 */
@Component
public class DataSeeder implements CommandLineRunner {
    
    @Autowired
    private FacultyRepository facultyRepository;
    
    @Autowired
    private StudentClassRepository studentClassRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private MajorRepository majorRepository;
    
    @Override
    public void run(String... args) throws Exception {
        // Only seed if database is empty (check if faculties exist)
        if (facultyRepository.count() > 0) {
            return;
        }
        
        // 1. Create Faculties
        Faculty facultyCNTT2 = new Faculty("CNTT2", "Công nghệ Thông tin 2", 
            "Khoa Công nghệ Thông tin 2");
        Faculty facultyVT2 = new Faculty("VT2", "Viễn thông 2", 
            "Khoa Viễn thông 2");
        Faculty facultyDT2 = new Faculty("DT2", "Điện tử 2", 
            "Khoa Điện tử 2");
        Faculty facultyQTKD2 = new Faculty("QTKD2", "Quản trị Kinh doanh 2", 
            "Khoa Quản trị Kinh doanh 2");
        
        facultyRepository.save(facultyCNTT2);
        facultyRepository.save(facultyVT2);
        facultyRepository.save(facultyDT2);
        facultyRepository.save(facultyQTKD2);
        
        // 2. Create Majors (Ngành học)
        // Khoa CNTT2: 3 ngành
        Major majorCN = new Major("CN", "Công nghệ Thông tin", 
            "Ngành Công nghệ Thông tin", facultyCNTT2);
        Major majorPT = new Major("PT", "Đa phương tiện", 
            "Ngành Đa phương tiện", facultyCNTT2);
        Major majorAT = new Major("AT", "An toàn Thông tin", 
            "Ngành An toàn Thông tin", facultyCNTT2);
        
        // Khoa VT2: 1 ngành
        Major majorVT = new Major("VT", "Viễn thông", 
            "Ngành Viễn thông", facultyVT2);
        
        // Khoa DT2: 1 ngành
        Major majorDT = new Major("DT", "Điện tử", 
            "Ngành Điện tử", facultyDT2);
        
        // Khoa QTKD2: 3 ngành
        Major majorQT = new Major("QT", "Quản trị Kinh doanh", 
            "Ngành Quản trị Kinh doanh", facultyQTKD2);
        Major majorMR = new Major("MR", "Marketing", 
            "Ngành Marketing", facultyQTKD2);
        Major majorKT = new Major("KT", "Kế toán", 
            "Ngành Kế toán", facultyQTKD2);
        
        majorRepository.save(majorCN);
        majorRepository.save(majorPT);
        majorRepository.save(majorAT);
        majorRepository.save(majorVT);
        majorRepository.save(majorDT);
        majorRepository.save(majorQT);
        majorRepository.save(majorMR);
        majorRepository.save(majorKT);
        
        // 3. Create Classes (Format: DxxCQyyzz-N)
        // Khoa CNTT2
        StudentClass classCN01 = new StudentClass("D21CQCN01-N", "D21CQCN01-N", "2024-2025", facultyCNTT2, majorCN);
        StudentClass classCN02 = new StudentClass("D21CQCN02-N", "D21CQCN02-N", "2024-2025", facultyCNTT2, majorCN);
        StudentClass classPT01 = new StudentClass("D21CQPT01-N", "D21CQPT01-N", "2024-2025", facultyCNTT2, majorPT);
        StudentClass classPT02 = new StudentClass("D21CQPT02-N", "D21CQPT02-N", "2024-2025", facultyCNTT2, majorPT);
        StudentClass classAT01 = new StudentClass("D21CQAT01-N", "D21CQAT01-N", "2024-2025", facultyCNTT2, majorAT);
        
        // Khoa VT2
        StudentClass classVT01 = new StudentClass("D21CQVT01-N", "D21CQVT01-N", "2024-2025", facultyVT2, majorVT);
        
        // Khoa DT2
        StudentClass classDT01 = new StudentClass("D21CQDT01-N", "D21CQDT01-N", "2024-2025", facultyDT2, majorDT);
        
        // Khoa QTKD2
        StudentClass classQT01 = new StudentClass("D21CQQT01-N", "D21CQQT01-N", "2024-2025", facultyQTKD2, majorQT);
        StudentClass classMR01 = new StudentClass("D21CQMR01-N", "D21CQMR01-N", "2024-2025", facultyQTKD2, majorMR);
        StudentClass classKT01 = new StudentClass("D21CQKT01-N", "D21CQKT01-N", "2024-2025", facultyQTKD2, majorKT);
        
        studentClassRepository.save(classCN01);
        studentClassRepository.save(classCN02);
        studentClassRepository.save(classPT01);
        studentClassRepository.save(classPT02);
        studentClassRepository.save(classAT01);
        studentClassRepository.save(classVT01);
        studentClassRepository.save(classDT01);
        studentClassRepository.save(classQT01);
        studentClassRepository.save(classMR01);
        studentClassRepository.save(classKT01);
        
        // 4. Create Students (Sample data - format: NxxDCCyynnn)
        // Khoa CNTT2 - Ngành CN
        Student student1 = new Student("N21DCCN001", "Nguyễn Văn An", classCN01, majorCN, facultyCNTT2);
        student1.setDateOfBirth(LocalDate.of(2003, 5, 15));
        student1.setGender("MALE");
        student1.setPhone("0123456789");
        student1.setAddress("Hà Nội");
        student1.setAcademicYear("2024-2025");
        student1.setPosition("CLASS_MONITOR"); // Lớp trưởng
        studentRepository.save(student1);
        
        Student student2 = new Student("N21DCCN002", "Trần Thị Bình", classCN01, majorCN, facultyCNTT2);
        student2.setDateOfBirth(LocalDate.of(2003, 8, 20));
        student2.setGender("FEMALE");
        student2.setPhone("0987654321");
        student2.setAddress("Hải Phòng");
        student2.setAcademicYear("2024-2025");
        studentRepository.save(student2);
        
        Student student3 = new Student("N21DCCN050", "Lê Văn Cường", classCN02, majorCN, facultyCNTT2);
        student3.setDateOfBirth(LocalDate.of(2003, 3, 10));
        student3.setGender("MALE");
        student3.setPhone("0111222333");
        student3.setAddress("Đà Nẵng");
        student3.setAcademicYear("2024-2025");
        studentRepository.save(student3);
        
        // Khoa CNTT2 - Ngành PT
        Student student4 = new Student("N21DCPT001", "Phạm Thị Dung", classPT01, majorPT, facultyCNTT2);
        student4.setDateOfBirth(LocalDate.of(2003, 11, 5));
        student4.setGender("FEMALE");
        student4.setPhone("0988777666");
        student4.setAddress("Hà Nội");
        student4.setAcademicYear("2024-2025");
        studentRepository.save(student4);
        
        // Khoa CNTT2 - Ngành AT
        Student student5 = new Student("N21DCAT001", "Hoàng Văn Em", classAT01, majorAT, facultyCNTT2);
        student5.setDateOfBirth(LocalDate.of(2003, 7, 25));
        student5.setGender("MALE");
        student5.setPhone("0966555444");
        student5.setAddress("Nam Định");
        student5.setAcademicYear("2024-2025");
        studentRepository.save(student5);
        
        // Khoa VT2
        Student student6 = new Student("N21DCVT001", "Vũ Thị Phương", classVT01, majorVT, facultyVT2);
        student6.setDateOfBirth(LocalDate.of(2003, 9, 12));
        student6.setGender("FEMALE");
        student6.setPhone("0944333222");
        student6.setAddress("Thái Bình");
        student6.setAcademicYear("2024-2025");
        studentRepository.save(student6);
        
        // Khoa DT2
        Student student7 = new Student("N21DCDT001", "Đỗ Văn Giang", classDT01, majorDT, facultyDT2);
        student7.setDateOfBirth(LocalDate.of(2003, 4, 18));
        student7.setGender("MALE");
        student7.setPhone("0922111000");
        student7.setAddress("Hà Nam");
        student7.setAcademicYear("2024-2025");
        studentRepository.save(student7);
        
        // Khoa QTKD2 - Ngành QT
        Student student8 = new Student("N21DCQT001", "Mai Thị Hoa", classQT01, majorQT, facultyQTKD2);
        student8.setDateOfBirth(LocalDate.of(2003, 6, 30));
        student8.setGender("FEMALE");
        student8.setPhone("0911222333");
        student8.setAddress("Hà Nội");
        student8.setAcademicYear("2024-2025");
        studentRepository.save(student8);
        
        // Khoa QTKD2 - Ngành MR
        Student student9 = new Student("N21DCMR001", "Bùi Văn Inh", classMR01, majorMR, facultyQTKD2);
        student9.setDateOfBirth(LocalDate.of(2003, 2, 14));
        student9.setGender("MALE");
        student9.setPhone("0933444555");
        student9.setAddress("Ninh Bình");
        student9.setAcademicYear("2024-2025");
        studentRepository.save(student9);
        
        // Khoa QTKD2 - Ngành KT
        Student student10 = new Student("N21DCKT001", "Ngô Thị Khanh", classKT01, majorKT, facultyQTKD2);
        student10.setDateOfBirth(LocalDate.of(2003, 12, 8));
        student10.setGender("FEMALE");
        student10.setPhone("0955666777");
        student10.setAddress("Hưng Yên");
        student10.setAcademicYear("2024-2025");
        studentRepository.save(student10);
    }
}
