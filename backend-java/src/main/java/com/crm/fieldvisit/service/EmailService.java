package com.crm.fieldvisit.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.email.from:notifications@crm.com}")
    private String defaultFrom;

    @Value("${app.email.admin:admin@crm.com}")
    private String adminEmail;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * Sends an email notification (asynchronously if enabled).
     * If SMTP credentials are not configured or live delivery fails, it logs full formatted output.
     */
    public void sendEmail(String to, String subject, String htmlContent, String plainTextFallback) {
        if (!emailEnabled || mailSender == null || mailUsername == null || mailUsername.isBlank()) {
            logEmailSimulation(to, subject, plainTextFallback);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String fromAddress = (mailUsername != null && !mailUsername.isBlank()) ? mailUsername : defaultFrom;
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(plainTextFallback, htmlContent);

            mailSender.send(message);
            log.info("📧 [EMAIL SENT SUCCESS] Subject: '{}' -> To: {}", subject, to);
        } catch (Exception e) {
            log.warn("⚠️ [EMAIL DELIVERY NOTE] Could not deliver live SMTP email ('{}' to {}): {}. Logging formatted email to console.",
                    subject, to, e.getMessage());
            logEmailSimulation(to, subject, plainTextFallback);
        }
    }

    /**
     * Send Security Account Lockout Alert to Administrator
     */
    public void sendAdminLockoutAlert(String targetName, String employeeNo, String targetEmail,
                                     String reason, String ip, String browser, String os,
                                     String fingerprint, LocalDateTime timestamp, int durationMinutes) {
        try {
            String subject = "[SECURITY ALERT] Account Locked: " + targetEmail + " (" + (employeeNo != null ? employeeNo : "N/A") + ")";
            String timeStr = (timestamp != null ? timestamp : LocalDateTime.now())
                    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

            String safeName = targetName != null ? targetName : "Team Member";
            String safeEmpNo = employeeNo != null ? employeeNo : "N/A";
            String safeEmail = targetEmail != null ? targetEmail : "user@crm.com";
            String safeReason = reason != null ? reason : "3 Consecutive Failed Password Attempts";
            String safeIp = ip != null ? ip : "127.0.0.1";
            String safeBrowser = browser != null ? browser : "Web Browser";
            String safeOs = os != null ? os : "Windows";

            String htmlContent = "<!DOCTYPE html><html><head><style>"
                    + "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }"
                    + ".container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }"
                    + ".header { background: #dc2626; color: #ffffff; padding: 24px; text-align: center; }"
                    + ".content { padding: 24px; }"
                    + ".alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px; font-weight: 600; color: #991b1b; }"
                    + "table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }"
                    + "th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 14px; }"
                    + "th { color: #64748b; font-weight: 600; width: 35%; }"
                    + "td { color: #0f172a; font-weight: 500; }"
                    + ".button { display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 700; font-size: 14px; margin-top: 10px; }"
                    + ".footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }"
                    + "</style></head><body>"
                    + "<div class=\"container\">"
                    + "<div class=\"header\"><h2 style=\"margin:0; font-size: 20px;\">🛡️ Security Alert: Account Locked</h2>"
                    + "<p style=\"margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;\">Admin Action Required • Account Locked</p></div>"
                    + "<div class=\"content\">"
                    + "<div class=\"alert-box\">An account has reached the maximum failed login attempts and has been locked until unlocked by an administrator.</div>"
                    + "<table>"
                    + "<tr><th>Target User</th><td>" + safeName + "</td></tr>"
                    + "<tr><th>Employee ID</th><td>" + safeEmpNo + "</td></tr>"
                    + "<tr><th>Target Email</th><td>" + safeEmail + "</td></tr>"
                    + "<tr><th>Reason</th><td><span style=\"color:#dc2626; font-weight:700;\">" + safeReason + "</span></td></tr>"
                    + "<tr><th>Client IP</th><td><code>" + safeIp + "</code></td></tr>"
                    + "<tr><th>Browser / OS</th><td>" + safeBrowser + " on " + safeOs + "</td></tr>"
                    + "<tr><th>Timestamp</th><td>" + timeStr + "</td></tr>"
                    + "</table>"
                    + "<div style=\"text-align: center;\"><a href=\"" + frontendUrl + "/employees\" class=\"button\" style=\"color:#ffffff;\">Open Admin Employee Security Panel</a></div>"
                    + "</div>"
                    + "<div class=\"footer\">Enterprise Field Visit & Expense CRM Security Shield • Automated Notification</div>"
                    + "</div></body></html>";

            String plainText = "[SECURITY ALERT] Account Locked\n"
                    + "=======================================================\n"
                    + "Target User: " + safeName + "\n"
                    + "Employee ID: " + safeEmpNo + "\n"
                    + "Target Email: " + safeEmail + "\n"
                    + "Reason: " + safeReason + "\n"
                    + "Client IP: " + safeIp + "\n"
                    + "Browser / OS: " + safeBrowser + " / " + safeOs + "\n"
                    + "Timestamp: " + timeStr + "\n"
                    + "=======================================================\n"
                    + "Manage in CRM Admin Portal: " + frontendUrl + "/employees\n";

            sendEmail(adminEmail, subject, htmlContent, plainText);
        } catch (Exception e) {
            log.error("Failed to generate/send admin lockout alert email: {}", e.getMessage(), e);
        }
    }

    /**
     * Send Password Setup Reminder to User
     */
    public void sendPasswordSetupReminder(String toEmail, String userName) {
        try {
            String subject = "Set up your internal password for Field Management CRM";
            String setupUrl = frontendUrl + "/profile";
            String safeName = userName != null ? userName : "Team Member";

            String htmlContent = "<!DOCTYPE html><html><head><style>"
                    + "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 20px; color: #1e293b; }"
                    + ".container { max-width: 550px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; }"
                    + ".btn { display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: 700; margin: 16px 0; }"
                    + "</style></head><body>"
                    + "<div class=\"container\">"
                    + "<h2 style=\"color: #4f46e5; margin-top:0;\">Welcome, " + safeName + "</h2>"
                    + "<p>You chose to configure your internal password later during your recent login session.</p>"
                    + "<p>Setting up your password allows you to sign in quickly using your company email or employee ID without relying solely on single sign-on.</p>"
                    + "<div style=\"text-align: center;\"><a href=\"" + setupUrl + "\" class=\"btn\" style=\"color:#fff;\">Set Up Password Now</a></div>"
                    + "<p style=\"font-size: 13px; color: #64748b;\">If the button doesn't work, copy and paste this link in your browser:<br/><code>" + setupUrl + "</code></p>"
                    + "</div></body></html>";

            String plainText = "Hello " + safeName + ",\n\n"
                    + "You chose to configure your password later. You can set up your direct password anytime in your user profile:\n"
                    + setupUrl + "\n\nField Visit & Expense CRM Team\n";

            sendEmail(toEmail, subject, htmlContent, plainText);
        } catch (Exception e) {
            log.error("Failed to send password setup reminder email: {}", e.getMessage());
        }
    }

    /**
     * Send Password Reset Notice to Employee
     */
    public void sendPasswordResetNotice(String toEmail, String userName, String temporaryPassword) {
        try {
            String subject = "Your Field Visit CRM Password Has Been Reset";
            String loginUrl = frontendUrl + "/login";
            String safeName = userName != null ? userName : "Team Member";
            String safePass = temporaryPassword != null ? temporaryPassword : "Password@123";

            String htmlContent = "<!DOCTYPE html><html><head><style>"
                    + "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 20px; }"
                    + ".container { max-width: 550px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; }"
                    + ".code-box { background: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 16px; font-weight: 700; text-align: center; margin: 15px 0; color: #0f172a; }"
                    + "</style></head><body>"
                    + "<div class=\"container\">"
                    + "<h2 style=\"color: #0f172a;\">Password Reset Notice</h2>"
                    + "<p>Hello " + safeName + ",</p>"
                    + "<p>An administrator has reset your Field Visit CRM password. You can now log in using the temporary credentials below:</p>"
                    + "<div class=\"code-box\">" + safePass + "</div>"
                    + "<p>Please log in and update your password immediately from your profile settings.</p>"
                    + "<p><a href=\"" + loginUrl + "\">Sign In to Field Visit CRM</a></p>"
                    + "</div></body></html>";

            String plainText = "Hello " + safeName + ",\n\n"
                    + "An administrator has reset your Field Visit CRM password.\n"
                    + "Temporary Password: " + safePass + "\n\n"
                    + "Please sign in at " + loginUrl + " and update your password.\n";

            sendEmail(toEmail, subject, htmlContent, plainText);
        } catch (Exception e) {
            log.error("Failed to send password reset email: {}", e.getMessage());
        }
    }

    private void logEmailSimulation(String to, String subject, String body) {
        log.info("""
                ================================================================================
                [EMAIL NOTIFICATION / DISPATCH]
                To: {}
                Subject: {}
                Body:
                {}
                ================================================================================
                """, to, subject, body);
    }
}
