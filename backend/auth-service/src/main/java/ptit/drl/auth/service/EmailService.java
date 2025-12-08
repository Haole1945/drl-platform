package ptit.drl.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Email Service for sending emails
 */
@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    @Autowired(required = false)
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.from:noreply@ptithcm.edu.vn}")
    private String fromEmail;
    
    @Value("${spring.mail.username:}")
    private String mailUsername;
    
    /**
     * Send password to student email
     * In development mode (when email is not configured), logs the password instead
     */
    public void sendPasswordEmail(String toEmail, String studentCode, String password) {
        // Check if email is configured
        boolean emailConfigured = mailSender != null && StringUtils.hasText(mailUsername);
        
        if (!emailConfigured) {
            // Development mode: log password instead of sending email
            logger.warn("========================================");
            logger.warn("EMAIL NOT CONFIGURED - DEVELOPMENT MODE");
            logger.warn("========================================");
            logger.warn("Password for user: {}", toEmail);
            logger.warn("Student Code: {}", studentCode);
            logger.warn("Password: {}", password);
            logger.warn("========================================");
            logger.warn("In production, configure MAIL_USERNAME and MAIL_PASSWORD");
            logger.warn("========================================");
            return;
        }
        
        // Production mode: send email
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Mật khẩu đăng nhập DRL Platform");
            
            String emailBody = String.format(
                "Xin chào,\n\n" +
                "Bạn đã yêu cầu mật khẩu đăng nhập cho tài khoản DRL Platform.\n\n" +
                "Mã sinh viên: %s\n" +
                "Email đăng nhập: %s\n" +
                "Mật khẩu: %s\n\n" +
                "Vui lòng đăng nhập và đổi mật khẩu sau lần đăng nhập đầu tiên.\n\n" +
                "Lưu ý: Đây là email tự động, vui lòng không trả lời email này.\n\n" +
                "Trân trọng,\n" +
                "Hệ thống DRL Platform",
                studentCode, toEmail, password
            );
            
            message.setText(emailBody);
            
            mailSender.send(message);
            logger.info("Password email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send password email to: {}", toEmail, e);
            // In development, log password even if email fails
            if (!StringUtils.hasText(mailUsername)) {
                logger.warn("Email sending failed, but password is logged above for development");
                return;
            }
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }
}

