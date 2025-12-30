package ptit.drl.auth.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ptit.drl.auth.dto.UserInfoDTO;
import ptit.drl.auth.service.ClassUsersService;

/**
 * REST API for getting class-related users (advisor, class monitor)
 */
@RestController
@RequestMapping("/class-users")
public class ClassUsersController {

    private final ClassUsersService classUsersService;

    public ClassUsersController(ClassUsersService classUsersService) {
        this.classUsersService = classUsersService;
    }

    /**
     * Get advisor (CVHT) for a specific class
     */
    @GetMapping("/{classCode}/advisor")
    public ResponseEntity<UserInfoDTO> getClassAdvisor(@PathVariable String classCode) {
        UserInfoDTO advisor = classUsersService.getClassAdvisor(classCode);
        if (advisor != null) {
            return ResponseEntity.ok(advisor);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Get class monitor (Lớp trưởng) for a specific class
     */
    @GetMapping("/{classCode}/monitor")
    public ResponseEntity<UserInfoDTO> getClassMonitor(@PathVariable String classCode) {
        UserInfoDTO monitor = classUsersService.getClassMonitor(classCode);
        if (monitor != null) {
            return ResponseEntity.ok(monitor);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Get all key users for a class (advisor + monitor)
     */
    @GetMapping("/{classCode}/key-users")
    public ResponseEntity<ClassKeyUsersResponse> getClassKeyUsers(@PathVariable String classCode) {
        UserInfoDTO advisor = classUsersService.getClassAdvisor(classCode);
        UserInfoDTO monitor = classUsersService.getClassMonitor(classCode);
        
        ClassKeyUsersResponse response = new ClassKeyUsersResponse(advisor, monitor);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get user info for a student by student code
     */
    @GetMapping("/student/{studentCode}")
    public ResponseEntity<UserInfoDTO> getStudentUser(@PathVariable String studentCode) {
        UserInfoDTO student = classUsersService.getStudentByCode(studentCode);
        if (student != null) {
            return ResponseEntity.ok(student);
        }
        return ResponseEntity.notFound().build();
    }

    public static class ClassKeyUsersResponse {
        public UserInfoDTO advisor;
        public UserInfoDTO classMonitor;

        public ClassKeyUsersResponse(UserInfoDTO advisor, UserInfoDTO classMonitor) {
            this.advisor = advisor;
            this.classMonitor = classMonitor;
        }
    }
}
