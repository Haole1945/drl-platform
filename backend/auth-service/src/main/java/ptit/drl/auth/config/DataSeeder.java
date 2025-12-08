package ptit.drl.auth.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import ptit.drl.auth.entity.*;
import ptit.drl.auth.repository.*;

/**
 * Data seeder for auth-service (User, Role, Permission only)
 */
@Component
public class DataSeeder implements CommandLineRunner {

        @Autowired
        private RoleRepository roleRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private PermissionRepository permissionRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @Override
        public void run(String... args) throws Exception {
                // Only seed if database is empty
                if (roleRepository.count() > 0) {
                        return;
                }

                // 1. Create Permissions
                Permission permStudentViewOwn = new Permission("STUDENT:READ_OWN",
                                "Xem thông tin sinh viên của chính mình");
                Permission permStudentViewAll = new Permission("STUDENT:READ_ALL", "Xem thông tin tất cả sinh viên");
                Permission permStudentEdit = new Permission("STUDENT:UPDATE_OWN",
                                "Chỉnh sửa thông tin sinh viên của chính mình");
                Permission permStudentCreate = new Permission("STUDENT:CREATE", "Tạo sinh viên mới");
                Permission permStudentDelete = new Permission("STUDENT:DELETE", "Xóa sinh viên");

                Permission permEvaluationCreate = new Permission("EVALUATION:CREATE", "Tạo đánh giá điểm rèn luyện");
                Permission permEvaluationViewOwn = new Permission("EVALUATION:READ_OWN", "Xem đánh giá của chính mình");
                Permission permEvaluationViewAll = new Permission("EVALUATION:READ_ALL", "Xem tất cả đánh giá");
                Permission permEvaluationUpdateOwn = new Permission("EVALUATION:UPDATE_OWN",
                                "Cập nhật đánh giá của chính mình");
                Permission permEvaluationSubmit = new Permission("EVALUATION:SUBMIT", "Nộp đánh giá");
                Permission permEvaluationApprove = new Permission("EVALUATION:APPROVE", "Duyệt đánh giá");
                Permission permEvaluationReject = new Permission("EVALUATION:REJECT", "Từ chối đánh giá");

                Permission permRubricView = new Permission("RUBRIC:READ", "Xem rubric đánh giá");
                Permission permRubricManage = new Permission("RUBRIC:MANAGE", "Quản lý rubric (tạo/sửa/xóa)");

                Permission permCriteriaView = new Permission("CRITERIA:READ", "Xem tiêu chí đánh giá");
                Permission permCriteriaManage = new Permission("CRITERIA:MANAGE", "Quản lý tiêu chí (tạo/sửa/xóa)");

                Permission permUserManage = new Permission("USER:MANAGE", "Quản lý người dùng");
                Permission permSystemManage = new Permission("SYSTEM:MANAGE", "Quản trị hệ thống");

                permissionRepository.save(permStudentViewOwn);
                permissionRepository.save(permStudentViewAll);
                permissionRepository.save(permStudentEdit);
                permissionRepository.save(permStudentCreate);
                permissionRepository.save(permStudentDelete);
                permissionRepository.save(permEvaluationCreate);
                permissionRepository.save(permEvaluationViewOwn);
                permissionRepository.save(permEvaluationViewAll);
                permissionRepository.save(permEvaluationUpdateOwn);
                permissionRepository.save(permEvaluationSubmit);
                permissionRepository.save(permEvaluationApprove);
                permissionRepository.save(permEvaluationReject);
                permissionRepository.save(permRubricView);
                permissionRepository.save(permRubricManage);
                permissionRepository.save(permCriteriaView);
                permissionRepository.save(permCriteriaManage);
                permissionRepository.save(permUserManage);
                permissionRepository.save(permSystemManage);

                // 2. Create Roles and assign permissions

                // STUDENT - Sinh viên thường
                Role roleStudent = new Role("STUDENT", "Sinh viên");
                roleStudent.addPermission(permStudentViewOwn);
                roleStudent.addPermission(permEvaluationCreate);
                roleStudent.addPermission(permEvaluationViewOwn);
                roleStudent.addPermission(permEvaluationUpdateOwn);
                roleStudent.addPermission(permEvaluationSubmit);
                roleStudent.addPermission(permRubricView);
                roleStudent.addPermission(permCriteriaView);
                roleRepository.save(roleStudent);

                // CLASS_MONITOR - Lớp trưởng (có thể duyệt cấp lớp)
                Role roleClassMonitor = new Role("CLASS_MONITOR", "Lớp trưởng");
                roleClassMonitor.addPermission(permStudentViewOwn);
                roleClassMonitor.addPermission(permEvaluationCreate);
                roleClassMonitor.addPermission(permEvaluationViewOwn);
                roleClassMonitor.addPermission(permEvaluationUpdateOwn);
                roleClassMonitor.addPermission(permEvaluationSubmit);
                roleClassMonitor.addPermission(permEvaluationViewAll); // Xem đánh giá của lớp
                roleClassMonitor.addPermission(permEvaluationApprove); // Duyệt cấp lớp
                roleClassMonitor.addPermission(permEvaluationReject); // Từ chối cấp lớp
                roleClassMonitor.addPermission(permRubricView);
                roleClassMonitor.addPermission(permCriteriaView);
                roleRepository.save(roleClassMonitor);

                // UNION_REPRESENTATIVE role removed - no longer needed

                // ADVISOR - Cố vấn học tập (duyệt cấp lớp)
                Role roleAdvisor = new Role("ADVISOR", "Cố vấn học tập");
                roleAdvisor.addPermission(permStudentViewAll);
                roleAdvisor.addPermission(permEvaluationViewAll);
                roleAdvisor.addPermission(permEvaluationApprove);
                roleAdvisor.addPermission(permEvaluationReject);
                roleAdvisor.addPermission(permRubricView);
                roleAdvisor.addPermission(permCriteriaView);
                roleRepository.save(roleAdvisor);

                // FACULTY_INSTRUCTOR - Giáo viên khoa (duyệt cấp khoa)
                Role roleFacultyInstructor = new Role("FACULTY_INSTRUCTOR", "Giáo viên khoa");
                roleFacultyInstructor.addPermission(permStudentViewAll);
                roleFacultyInstructor.addPermission(permEvaluationViewAll);
                roleFacultyInstructor.addPermission(permEvaluationApprove);
                roleFacultyInstructor.addPermission(permEvaluationReject);
                roleFacultyInstructor.addPermission(permRubricView);
                roleFacultyInstructor.addPermission(permCriteriaView);
                roleRepository.save(roleFacultyInstructor);


                // ADMIN - Quản trị viên
                Role roleAdmin = new Role("ADMIN", "Quản trị viên");
                // Admin gets all permissions
                roleAdmin.addPermission(permStudentViewAll);
                roleAdmin.addPermission(permStudentCreate);
                roleAdmin.addPermission(permStudentDelete);
                roleAdmin.addPermission(permEvaluationViewAll);
                roleAdmin.addPermission(permEvaluationApprove);
                roleAdmin.addPermission(permEvaluationReject);
                roleAdmin.addPermission(permRubricManage);
                roleAdmin.addPermission(permCriteriaManage);
                roleAdmin.addPermission(permUserManage);
                roleAdmin.addPermission(permSystemManage);
                roleRepository.save(roleAdmin);

                // 3. Create sample users for testing

                // ADMIN
                User adminUser = new User("admin", "admin@ptit.edu.vn",
                                passwordEncoder.encode("Admin123!"), "Administrator");
                adminUser.addRole(roleAdmin);
                userRepository.save(adminUser);

                // STUDENT - Sinh viên thường
                User studentUser = new User("student", "n21dccn002@student.ptithcm.edu.vn",
                                passwordEncoder.encode("Student123!"), "Trần Thị Bình");
                studentUser.setStudentCode("N21DCCN002");
                studentUser.addRole(roleStudent);
                userRepository.save(studentUser);

                // CLASS_MONITOR - Lớp trưởng (N21DCCN001)
                User classMonitorUser = new User("classmonitor", "n21dccn001@student.ptithcm.edu.vn",
                                passwordEncoder.encode("Monitor123!"), "Nguyễn Văn An");
                classMonitorUser.setStudentCode("N21DCCN001");
                classMonitorUser.addRole(roleStudent); // Vẫn có quyền sinh viên
                classMonitorUser.addRole(roleClassMonitor); // Thêm quyền lớp trưởng
                userRepository.save(classMonitorUser);

                // UNION_REPRESENTATIVE user removed - no longer needed

                // ADVISOR - Cố vấn học tập
                User advisorUser = new User("advisor", "advisor@ptit.edu.vn",
                                passwordEncoder.encode("Advisor123!"), "Cố vấn Học tập CNTT2");
                advisorUser.addRole(roleAdvisor);
                userRepository.save(advisorUser);

                // FACULTY_INSTRUCTOR - Giáo viên khoa
                User facultyInstructorUser = new User("faculty", "faculty@ptit.edu.vn",
                                passwordEncoder.encode("Faculty123!"), "Giáo viên Khoa CNTT2");
                facultyInstructorUser.addRole(roleFacultyInstructor);
                userRepository.save(facultyInstructorUser);

        }
}
