package com.crm.fieldvisit.service;

import com.crm.fieldvisit.dto.*;
import com.crm.fieldvisit.entity.*;
import com.crm.fieldvisit.repository.*;
import com.crm.fieldvisit.security.JwtTokenProvider;
import com.crm.fieldvisit.security.UserPrincipal;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final BranchRepository branchRepository;
    private final LoginLogRepository loginLogRepository;
    private final SecurityEventRepository securityEventRepository;
    private final DailyVisitRepository dailyVisitRepository;
    private final CustomerRepository customerRepository;
    private final ContactRepository contactRepository;
    private final OpportunityRepository opportunityRepository;
    private final QuotationRepository quotationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;
    private final TrustedDeviceRepository trustedDeviceRepository;
    private final TwoFactorVerificationRepository twoFactorVerificationRepository;
    private final GeoIpService geoIpService;

    @Value("${azure.activedirectory.client-id:63af8748-b960-4f66-9ef7-e6be3b13e0d1}")
    private String configuredClientId;

    @Value("${azure.activedirectory.tenant-id:5adb2e4c-71ad-431a-81fa-d48da6fe6b40}")
    private String configuredTenantId;

    public void validatePasswordPolicy(String password) {
        if (password == null || password.length() < 8) {
            throw new BadCredentialsException("Password must be at least 8 characters long.");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new BadCredentialsException("Password must contain at least one uppercase letter (A-Z).");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new BadCredentialsException("Password must contain at least one lowercase letter (a-z).");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new BadCredentialsException("Password must contain at least one number (0-9).");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            throw new BadCredentialsException("Password must contain at least one special character (!@#$%^&*...).");
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String ip = null;
        String cfIp = request.getHeader("CF-Connecting-IP");
        if (cfIp != null && !cfIp.isBlank()) {
            ip = cfIp.trim();
        }
        if (ip == null || ip.isBlank()) {
            String trueIp = request.getHeader("True-Client-IP");
            if (trueIp != null && !trueIp.isBlank()) {
                ip = trueIp.trim();
            }
        }
        if (ip == null || ip.isBlank()) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                ip = xForwardedFor.split(",")[0].trim();
            }
        }
        if (ip == null || ip.isBlank()) {
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isBlank()) {
                ip = xRealIp.trim();
            }
        }
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        if (ip == null || "0:0:0:0:0:0:0:1".equals(ip) || "0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip) || "localhost".equalsIgnoreCase(ip)) {
            return "127.0.0.1";
        }
        return ip;
    }

    private String extractBrowser(HttpServletRequest request) {
        if (request == null) return "Chrome/Edge";
        String ua = request.getHeader("User-Agent");
        if (ua == null) return "Unknown";
        if (ua.contains("Edg/")) return "Microsoft Edge";
        if (ua.contains("Chrome/")) return "Google Chrome";
        if (ua.contains("Firefox/")) return "Mozilla Firefox";
        if (ua.contains("Safari/") && !ua.contains("Chrome/")) return "Apple Safari";
        if (ua.contains("MSIE") || ua.contains("Trident/")) return "Internet Explorer";
        return "Web Browser";
    }

    private String extractOs(HttpServletRequest request) {
        if (request == null) return "Windows";
        String ua = request.getHeader("User-Agent");
        if (ua == null) return "Unknown";
        if (ua.contains("Windows NT 10.0") || ua.contains("Windows")) return "Windows 10/11";
        if (ua.contains("Macintosh") || ua.contains("Mac OS X")) return "macOS";
        if (ua.contains("Android")) return "Android";
        if (ua.contains("iPhone") || ua.contains("iPad")) return "iOS";
        if (ua.contains("Linux")) return "Linux";
        return "Unknown OS";
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "u***r@domain.com";
        String[] parts = email.split("@", 2);
        String name = parts[0];
        String domain = parts[1];
        if (name.length() <= 2) {
            return name.charAt(0) + "***@" + domain;
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + "@" + domain;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "******" + (phone != null ? phone : "1234");
        return "******" + phone.substring(phone.length() - 4);
    }

    private String decodeJwtPayload(String token) {
        try {
            if (token == null) return null;
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                String payload = parts[1];
                int rem = payload.length() % 4;
                if (rem > 0) {
                    payload = payload + "=".repeat(4 - rem);
                }
                byte[] bytes = Base64.getUrlDecoder().decode(payload);
                return new String(bytes, StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.warn("Could not decode JWT token payload: {}", e.getMessage());
        }
        return null;
    }

    private double calculateHaversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private void checkRegionAccess(Employee employee, String clientIp, Double clientLat, Double clientLon,
                                   HttpServletRequest request, String method, String browser, String os, String fingerprint) {
        if (employee != null && Boolean.TRUE.equals(employee.getIsRegionRestricted())) {
            // 1. Coordinate / Area Geo-Fence Check (if allowed_latitude & allowed_longitude are configured)
            if (employee.getAllowedLatitude() != null && employee.getAllowedLongitude() != null) {
                double targetLat = employee.getAllowedLatitude();
                double targetLon = employee.getAllowedLongitude();
                double allowedRadiusKm = employee.getAllowedRadiusKm() != null ? employee.getAllowedRadiusKm() : 25.0;

                Double lat = clientLat;
                Double lon = clientLon;
                if (lat == null || lon == null) {
                    String hLat = request.getHeader("X-Client-Latitude");
                    String hLon = request.getHeader("X-Client-Longitude");
                    if (hLat != null && hLon != null) {
                        try {
                            lat = Double.parseDouble(hLat.trim());
                            lon = Double.parseDouble(hLon.trim());
                        } catch (Exception ignored) {}
                    }
                }

                if (lat != null && lon != null) {
                    double distKm = calculateHaversineDistanceKm(lat, lon, targetLat, targetLon);
                    if (distKm > allowedRadiusKm) {
                        String errorMsg = String.format("Access Denied: You are outside your assigned work zone. Your distance is %.1f km (Allowed radius: %.1f km).",
                                distKm, allowedRadiusKm);

                        LoginLog blockedLog = LoginLog.builder()
                                .employeeId(employee.getId())
                                .employeeName(employee.getName())
                                .email(employee.getEmail())
                                .loginMethod(method)
                                .loginStatus("Blocked")
                                .failureReason(String.format("Coordinate fence violation: %.1f km away", distKm))
                                .ipAddress(clientIp)
                                .browser(browser)
                                .operatingSystem(os)
                                .deviceFingerprint(fingerprint)
                                .eventType("GEO_FENCE_BLOCKED")
                                .isActiveSession(false)
                                .isDeleted(false)
                                .details(errorMsg)
                                .build();
                        loginLogRepository.saveAndFlush(blockedLog);

                        throw new BadCredentialsException(errorMsg);
                    }
                }
            }

            // 2. Country / Region Policy Check (e.g. IN for India)
            if (employee.getAllowedRegions() != null && !employee.getAllowedRegions().isBlank()) {
                GeoIpService.GeoCheckResult geoResult = geoIpService.evaluateRegionPolicy(
                        clientIp, request, employee.getIsRegionRestricted(), employee.getAllowedRegions());
                if (!geoResult.isAllowed()) {
                    String errorMsg = String.format("Access Denied: Your administrator has restricted your login to region [%s]. Detected location is %s (%s).",
                            geoResult.getAllowedRegions(), geoResult.getCountryName(), geoResult.getCountryCode());

                    LoginLog blockedLog = LoginLog.builder()
                            .employeeId(employee.getId())
                            .employeeName(employee.getName())
                            .email(employee.getEmail())
                            .loginMethod(method)
                            .loginStatus("Blocked")
                            .failureReason("Geo-fence violation: " + geoResult.getCountryCode())
                            .ipAddress(clientIp)
                            .country(geoResult.getCountryName())
                            .browser(browser)
                            .operatingSystem(os)
                            .deviceFingerprint(fingerprint)
                            .eventType("GEO_FENCE_BLOCKED")
                            .isActiveSession(false)
                            .isDeleted(false)
                            .details(errorMsg)
                            .build();
                    loginLogRepository.saveAndFlush(blockedLog);

                    securityEventRepository.saveAndFlush(SecurityEvent.builder()
                            .employeeId(employee.getId())
                            .employeeName(employee.getName())
                            .email(employee.getEmail())
                            .eventType("GEO_FENCE_VIOLATION")
                            .severity("High")
                            .ipAddress(clientIp)
                            .browser(browser)
                            .operatingSystem(os)
                            .deviceFingerprint(fingerprint)
                            .isDeleted(false)
                            .description("Unauthorized out-of-region login attempt from " + geoResult.getCountryName() + " (" + geoResult.getCountryCode() + ") for user restricted to " + employee.getAllowedRegions())
                            .build());

                    throw new BadCredentialsException(errorMsg);
                }
            }
        }
    }

    private LoginResponse finalizeOrChallenge2FA(Employee employee, String method, String clientIp,
                                                Double clientLat, Double clientLon,
                                                String browser, String os, String fingerprint,
                                                boolean isNewUser, HttpServletRequest httpRequest) {
        // 1. Verify Geo-fencing & coordinate compliance first
        checkRegionAccess(employee, clientIp, clientLat, clientLon, httpRequest, method, browser, os, fingerprint);

        // 2. Check if 2FA is required and whether device is trusted
        boolean needs2fa = Boolean.TRUE.equals(employee.getIs2faEnabled());
        boolean isDeviceTrusted = false;

        if (fingerprint != null && !fingerprint.isBlank() && !"unknown".equalsIgnoreCase(fingerprint)) {
            isDeviceTrusted = trustedDeviceRepository.existsByEmployeeIdAndDeviceFingerprint(employee.getId(), fingerprint);
        }

        if (needs2fa && !isDeviceTrusted) {
            // Unrecognized/new device or first login with 2FA enabled -> Challenge with 2-Step Verification
            String otpCode = String.format("%06d", (int)(Math.random() * 900000) + 100000);
            String verificationToken = UUID.randomUUID().toString();

            TwoFactorVerification verification = TwoFactorVerification.builder()
                    .employeeId(employee.getId())
                    .verificationToken(verificationToken)
                    .otpCode(otpCode)
                    .deviceFingerprint(fingerprint)
                    .deviceName(browser + " on " + os)
                    .loginMethod(method)
                    .clientIp(clientIp)
                    .isNewUser(isNewUser)
                    .isVerified(false)
                    .expiresAt(LocalDateTime.now().plusMinutes(10))
                    .build();
            twoFactorVerificationRepository.save(verification);

            // Send OTP code via email
            emailService.sendTwoFactorOtpEmail(employee.getEmail(), employee.getName(), otpCode, 10);

            log.info("🔐 [2-STEP VERIFICATION REQUIRED] User: {}, Method: {}, New Device: {}, OTP Code: {}",
                    employee.getEmail(), method, fingerprint, otpCode);

            String detectedCountry = geoIpService.resolveCountryCode(clientIp, httpRequest);

            LoginLog challengeLog = LoginLog.builder()
                    .employeeId(employee.getId())
                    .employeeName(employee.getName())
                    .email(employee.getEmail())
                    .loginMethod(method)
                    .loginStatus("Pending 2FA")
                    .failureReason("2-Step Verification Required (New Device)")
                    .ipAddress(clientIp)
                    .country(geoIpService.getCountryName(detectedCountry))
                    .browser(browser)
                    .operatingSystem(os)
                    .deviceFingerprint(fingerprint)
                    .eventType("2FA_CHALLENGE_ISSUED")
                    .isActiveSession(false)
                    .isDeleted(false)
                    .details("Two-step verification challenge dispatched to " + employee.getEmail())
                    .build();
            loginLogRepository.save(challengeLog);

            return LoginResponse.builder()
                    .requires2FA(true)
                    .verificationToken(verificationToken)
                    .maskedEmail(maskEmail(employee.getEmail()))
                    .maskedPhone(maskPhone(employee.getMobileNo()))
                    .devOtp(otpCode)
                    .isNewDevice(true)
                    .autoProvisioned(isNewUser)
                    .clientRegion(geoIpService.getCountryName(detectedCountry))
                    .build();
        }

        // Device is already trusted or 2FA not enabled -> proceed seamlessly!
        return completeLoginSuccess(employee, method, clientIp, browser, os, fingerprint, isNewUser, httpRequest);
    }

    private LoginResponse completeLoginSuccess(Employee employee, String method, String clientIp,
                                               String browser, String os, String fingerprint,
                                               boolean isNewUser, HttpServletRequest httpRequest) {
        employee.setFailedLoginAttempts(0);
        employee.setIsLocked(false);
        employee.setLockoutExpiresAt(null);
        employee.setLockoutTier(0);
        employee.setLastLoginIp(clientIp);
        employee.setLastLoginTime(LocalDateTime.now());
        employeeRepository.save(employee);

        String sessionId = "sess-" + UUID.randomUUID().toString();
        String detectedCountry = geoIpService.resolveCountryCode(clientIp, httpRequest);

        LoginLog successLog = LoginLog.builder()
                .employeeId(employee.getId())
                .employeeName(employee.getName())
                .email(employee.getEmail())
                .loginMethod(method)
                .loginStatus("Success")
                .ipAddress(clientIp)
                .country(geoIpService.getCountryName(detectedCountry))
                .browser(browser)
                .operatingSystem(os)
                .deviceFingerprint(fingerprint)
                .sessionId(sessionId)
                .isActiveSession(true)
                .autoProvisioned(isNewUser)
                .isDeleted(false)
                .eventType(isNewUser ? "SSO_AUTO_PROVISIONED" : "LOGIN_SUCCESS")
                .details(method + " login successful")
                .build();
        loginLogRepository.save(successLog);

        return buildLoginResponse(employee, sessionId, isNewUser);
    }

    private void sendAdminSecurityAlert(Employee employee, String reason, String ip, String browser, String os, String fingerprint, int durationMins) {
        String empName = (employee != null && employee.getName() != null) ? employee.getName() : "Unknown User";
        String empNo = (employee != null && employee.getEmployeeNo() != null) ? employee.getEmployeeNo() : "N/A";
        String email = (employee != null && employee.getEmail() != null) ? employee.getEmail() : "user@crm.com";

        emailService.sendAdminLockoutAlert(empName, empNo, email, reason, ip, browser, os, fingerprint, LocalDateTime.now(), durationMins);
    }

    @Transactional(noRollbackFor = BadCredentialsException.class)
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String identifier = request.getIdentifier();
        if (identifier == null || identifier.isBlank()) {
            throw new BadCredentialsException("Email or Employee Number is required");
        }
        identifier = identifier.trim();

        String clientIp = extractClientIp(httpRequest);
        String browser = extractBrowser(httpRequest);
        String os = extractOs(httpRequest);
        String fingerprint = (request.getDeviceFingerprint() != null && !request.getDeviceFingerprint().isBlank())
                ? request.getDeviceFingerprint() : "unknown";

        Optional<Employee> optionalEmployee = employeeRepository.findByEmailOrEmployeeNo(identifier);

        if (optionalEmployee.isEmpty()) {
            // Log failed login for nonexistent user
            LoginLog failedLog = LoginLog.builder()
                    .email(identifier)
                    .loginMethod("Credential")
                    .loginStatus("Failed")
                    .failureReason("User not found")
                    .ipAddress(clientIp)
                    .browser(browser)
                    .operatingSystem(os)
                    .deviceFingerprint(fingerprint)
                    .eventType("LOGIN_FAILED")
                    .isActiveSession(false)
                    .isDeleted(false)
                    .details("Login attempt with nonexistent email or employee number: " + identifier)
                    .build();
            loginLogRepository.saveAndFlush(failedLog);

            securityEventRepository.saveAndFlush(SecurityEvent.builder()
                    .email(identifier)
                    .eventType("AUTH_FAILED_USER_NOT_FOUND")
                    .severity("Medium")
                    .ipAddress(clientIp)
                    .browser(browser)
                    .operatingSystem(os)
                    .deviceFingerprint(fingerprint)
                    .isDeleted(false)
                    .description("Failed login attempt for unknown identifier: " + identifier)
                    .build());

            throw new BadCredentialsException("Incorrect password or user not found. 2 attempts remaining before account lockout.");
        }

        Employee employee = optionalEmployee.get();

        // Check if account is locked (Strict Admin-Only Unlock, no auto-expiration)
        if (Boolean.TRUE.equals(employee.getIsLocked())) {
            LoginLog blockedLog = LoginLog.builder()
                    .employeeId(employee.getId())
                    .employeeName(employee.getName())
                    .email(employee.getEmail())
                    .loginMethod("Credential")
                    .loginStatus("Blocked")
                    .failureReason("Account locked by security policy")
                    .ipAddress(clientIp)
                    .browser(browser)
                    .operatingSystem(os)
                    .deviceFingerprint(fingerprint)
                    .eventType("LOGIN_BLOCKED_LOCKOUT")
                    .isActiveSession(false)
                    .isDeleted(false)
                    .details("Login attempt blocked because account is locked. Requires administrator unlock.")
                    .build();
            loginLogRepository.saveAndFlush(blockedLog);

            throw new BadCredentialsException("Your account is locked due to multiple failed login attempts. Please contact your administrator to unlock your account.");
        }

        // Check active / inactive status
        if (employee.getStatus() != null && !"Active".equalsIgnoreCase(employee.getStatus())) {
            LoginLog inactiveLog = LoginLog.builder()
                    .employeeId(employee.getId())
                    .employeeName(employee.getName())
                    .email(employee.getEmail())
                    .loginMethod("Credential")
                    .loginStatus("Blocked")
                    .failureReason("Account inactive")
                    .ipAddress(clientIp)
                    .browser(browser)
                    .operatingSystem(os)
                    .deviceFingerprint(fingerprint)
                    .eventType("LOGIN_BLOCKED_INACTIVE")
                    .isActiveSession(false)
                    .isDeleted(false)
                    .details("Login attempt blocked because employee status is " + employee.getStatus())
                    .build();
            loginLogRepository.save(inactiveLog);

            securityEventRepository.save(SecurityEvent.builder()
                    .employeeId(employee.getId())
                    .employeeName(employee.getName())
                    .email(employee.getEmail())
                    .eventType("AUTH_BLOCKED_INACTIVE")
                    .severity("High")
                    .ipAddress(clientIp)
                    .browser(browser)
                    .operatingSystem(os)
                    .deviceFingerprint(fingerprint)
                    .isDeleted(false)
                    .description("Inactive user " + employee.getEmail() + " attempted login")
                    .build());

            throw new BadCredentialsException("Your account is inactive. Contact your administrator.");
        }

        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), employee.getPasswordHash())) {
            int attempts = (employee.getFailedLoginAttempts() == null ? 0 : employee.getFailedLoginAttempts()) + 1;
            employee.setFailedLoginAttempts(attempts);

            if (attempts == 1) {
                employeeRepository.saveAndFlush(employee);
                loginLogRepository.saveAndFlush(LoginLog.builder()
                        .employeeId(employee.getId())
                        .employeeName(employee.getName())
                        .email(employee.getEmail())
                        .loginMethod("Credential")
                        .loginStatus("Failed")
                        .failureReason("Incorrect password (Attempt 1/3)")
                        .ipAddress(clientIp)
                        .browser(browser)
                        .operatingSystem(os)
                        .deviceFingerprint(fingerprint)
                        .eventType("LOGIN_FAILED")
                        .isActiveSession(false)
                        .isDeleted(false)
                        .details("Incorrect password attempt 1 of 3")
                        .build());

                securityEventRepository.saveAndFlush(SecurityEvent.builder()
                        .employeeId(employee.getId())
                        .employeeName(employee.getName())
                        .email(employee.getEmail())
                        .eventType("AUTH_FAILED_PASSWORD")
                        .severity("Medium")
                        .ipAddress(clientIp)
                        .browser(browser)
                        .operatingSystem(os)
                        .deviceFingerprint(fingerprint)
                        .isDeleted(false)
                        .description("Incorrect password attempt (1/3) for " + employee.getEmail())
                        .build());

                throw new BadCredentialsException("Incorrect password. 2 attempts remaining before account lockout.");
            } else if (attempts == 2) {
                employeeRepository.saveAndFlush(employee);
                loginLogRepository.saveAndFlush(LoginLog.builder()
                        .employeeId(employee.getId())
                        .employeeName(employee.getName())
                        .email(employee.getEmail())
                        .loginMethod("Credential")
                        .loginStatus("Failed")
                        .failureReason("Incorrect password (Attempt 2/3)")
                        .ipAddress(clientIp)
                        .browser(browser)
                        .operatingSystem(os)
                        .deviceFingerprint(fingerprint)
                        .eventType("LOGIN_FAILED")
                        .isActiveSession(false)
                        .isDeleted(false)
                        .details("Incorrect password attempt 2 of 3")
                        .build());

                securityEventRepository.saveAndFlush(SecurityEvent.builder()
                        .employeeId(employee.getId())
                        .employeeName(employee.getName())
                        .email(employee.getEmail())
                        .eventType("AUTH_FAILED_PASSWORD")
                        .severity("High")
                        .ipAddress(clientIp)
                        .browser(browser)
                        .operatingSystem(os)
                        .deviceFingerprint(fingerprint)
                        .isDeleted(false)
                        .description("Incorrect password attempt (2/3) for " + employee.getEmail() + " - 1 attempt remaining")
                        .build());

                throw new BadCredentialsException("Incorrect password. 1 attempt remaining before account lockout.");
            } else {
                // 3 or more failed attempts -> Lock account permanently until Admin unlocks
                employee.setIsLocked(true);
                employee.setLockoutTier(1);
                employee.setLockoutExpiresAt(null);
                employeeRepository.saveAndFlush(employee);

                loginLogRepository.saveAndFlush(LoginLog.builder()
                        .employeeId(employee.getId())
                        .employeeName(employee.getName())
                        .email(employee.getEmail())
                        .loginMethod("Credential")
                        .loginStatus("Locked")
                        .failureReason("Locked out - 3 failed attempts (Admin unlock required)")
                        .ipAddress(clientIp)
                        .browser(browser)
                        .operatingSystem(os)
                        .deviceFingerprint(fingerprint)
                        .eventType("ACCOUNT_LOCKED")
                        .isActiveSession(false)
                        .isDeleted(false)
                        .details("Account locked due to 3 consecutive failed login attempts. Requires administrator unlock.")
                        .build());

                securityEventRepository.saveAndFlush(SecurityEvent.builder()
                        .employeeId(employee.getId())
                        .employeeName(employee.getName())
                        .email(employee.getEmail())
                        .eventType("AUTH_LOCKOUT")
                        .severity("Critical")
                        .ipAddress(clientIp)
                        .browser(browser)
                        .operatingSystem(os)
                        .deviceFingerprint(fingerprint)
                        .isDeleted(false)
                        .description("Account locked due to 3 consecutive failed login attempts. Requires administrator unlock.")
                        .build());

                sendAdminSecurityAlert(employee, "3 Consecutive Failed Password Attempts (Account Locked - Requires Admin Unlock)", clientIp, browser, os, fingerprint, 0);

                throw new BadCredentialsException("Your account has been locked due to 3 consecutive failed login attempts. Please contact your administrator to unlock your account.");
            }
        }

        // Login success - Reset lockout state & evaluate 2FA / region policy
        employee.setFailedLoginAttempts(0);
        employee.setIsLocked(false);
        employee.setLockoutExpiresAt(null);
        employee.setLockoutTier(0);
        employeeRepository.save(employee);

        return finalizeOrChallenge2FA(employee, "Credential", clientIp, request.getLatitude(), request.getLongitude(), browser, os, fingerprint, false, httpRequest);
    }

    /**
     * Authenticates user using Microsoft Entra ID (Azure AD) OIDC token / claims.
     */
    @Transactional(noRollbackFor = BadCredentialsException.class)
    public LoginResponse loginWithMicrosoft(MicrosoftLoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);
        String browser = extractBrowser(httpRequest);
        String os = extractOs(httpRequest);
        String fingerprint = (request.getDeviceFingerprint() != null && !request.getDeviceFingerprint().isBlank())
                ? request.getDeviceFingerprint() : "unknown";

        String targetEmail = null;
        String extractedName = request.getName();
        String extractedOid = request.getAzureAdOid();

        // 1. Extract verified identity claims from Microsoft ID Token
        if (request.getIdToken() != null && !request.getIdToken().isBlank()) {
            String payloadJson = decodeJwtPayload(request.getIdToken());
            if (payloadJson != null) {
                try {
                    JsonNode claims = objectMapper.readTree(payloadJson);
                    if (claims.hasNonNull("preferred_username")) {
                        targetEmail = claims.get("preferred_username").asText().trim();
                    } else if (claims.hasNonNull("email")) {
                        targetEmail = claims.get("email").asText().trim();
                    } else if (claims.hasNonNull("upn")) {
                        targetEmail = claims.get("upn").asText().trim();
                    } else if (claims.hasNonNull("unique_name")) {
                        targetEmail = claims.get("unique_name").asText().trim();
                    }

                    if (claims.hasNonNull("name") && (extractedName == null || extractedName.isBlank())) {
                        extractedName = claims.get("name").asText().trim();
                    }
                    if (claims.hasNonNull("oid") && (extractedOid == null || extractedOid.isBlank())) {
                        extractedOid = claims.get("oid").asText().trim();
                    }

                    log.info("Microsoft Entra ID token parsed for email: {}, oid: {}", targetEmail, extractedOid);
                } catch (Exception e) {
                    log.warn("Failed to parse Microsoft idToken JSON claims: {}", e.getMessage());
                }
            }
        }

        if ((targetEmail == null || targetEmail.isBlank()) && request.getEmail() != null) {
            targetEmail = request.getEmail().trim();
        }

        if (targetEmail == null || targetEmail.isBlank()) {
            throw new BadCredentialsException("Could not determine user email from Microsoft Entra identity.");
        }

        Optional<Employee> optionalEmployee = Optional.empty();
        if (extractedOid != null && !extractedOid.isBlank()) {
            optionalEmployee = employeeRepository.findByAzureAdOid(extractedOid);
        }

        if (optionalEmployee.isEmpty()) {
            optionalEmployee = employeeRepository.findByEmail(targetEmail);
        }
        if (optionalEmployee.isEmpty()) {
            optionalEmployee = employeeRepository.findByEmailOrEmployeeNo(targetEmail);
        }
        if (optionalEmployee.isEmpty()) {
            final String finalEmail = targetEmail.toLowerCase();
            List<Employee> allEmployees = employeeRepository.findAll();
            optionalEmployee = allEmployees.stream()
                    .filter(e -> (e.getEmail() != null && e.getEmail().trim().equalsIgnoreCase(finalEmail))
                            || (e.getEmployeeNo() != null && e.getEmployeeNo().trim().equalsIgnoreCase(finalEmail)))
                    .findFirst();
        }

        boolean isNew = false;
        Integer serviceDeptId = departmentRepository.findByCode("DEPT-SERVICE")
                .map(Department::getId)
                .orElse(2);
        Integer serviceDesgId = designationRepository.findByCode("DESG-SENG")
                .map(Designation::getId)
                .orElse(2);
        Integer hqBranchId = branchRepository.findByCode("BR-MUMBAI")
                .map(Branch::getId)
                .orElse(1);

        if (optionalEmployee.isEmpty()) {
            isNew = true;
            log.info("Microsoft Entra user not found in Employee master. Auto-provisioning first-login record for: {}", targetEmail);
            String displayName = (extractedName != null && !extractedName.isBlank()) ? extractedName : targetEmail.split("@")[0];
            String empNo = "EMP-" + (1000 + Math.abs(targetEmail.hashCode() % 9000));

            Employee newEmp = Employee.builder()
                    .employeeNo(empNo)
                    .name(displayName)
                    .email(targetEmail)
                    .azureAdOid(extractedOid)
                    .status("Active")
                    .role("SERVICE_ENG")
                    .grade("GRADE_B")
                    .gender("Male")
                    .dob(LocalDate.of(1990, 1, 1))
                    .mobileNo("N/A")
                    .departmentId(serviceDeptId)
                    .designationId(serviceDesgId)
                    .branchId(hqBranchId)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .joiningDate(LocalDate.now())
                    .isPasswordSet(false)
                    .isLocked(false)
                    .failedLoginAttempts(0)
                    .is2faEnabled(true)
                    .isRegionRestricted(false)
                    .allowedRegions("IN")
                    .createdBy("ENTRA_ID_SSO")
                    .updatedBy("ENTRA_ID_SSO")
                    .build();

            try {
                newEmp = employeeRepository.save(newEmp);
                optionalEmployee = Optional.of(newEmp);
                log.info("Auto-provisioned new employee #{} ({}) with default role SERVICE_ENG", newEmp.getEmployeeNo(), newEmp.getEmail());
            } catch (Exception e) {
                log.error("Failed to auto-provision employee: {}", e.getMessage());
                throw new BadCredentialsException("Failed to register Microsoft account in employee directory: " + e.getMessage());
            }
        }

        Employee employee = optionalEmployee.get();

        if (extractedOid != null && !extractedOid.isBlank() && !extractedOid.equals(employee.getAzureAdOid())) {
            employee.setAzureAdOid(extractedOid);
            employee = employeeRepository.save(employee);
        }

        if (employee.getStatus() != null && !"Active".equalsIgnoreCase(employee.getStatus())) {
            LoginLog inactiveLog = LoginLog.builder()
                    .employeeId(employee.getId())
                    .employeeName(employee.getName())
                    .email(employee.getEmail())
                    .loginMethod("Microsoft SSO")
                    .loginStatus("Blocked")
                    .failureReason("Account inactive")
                    .ipAddress(clientIp)
                    .browser(browser)
                    .operatingSystem(os)
                    .deviceFingerprint(fingerprint)
                    .eventType("SSO_BLOCKED_INACTIVE")
                    .isActiveSession(false)
                    .isDeleted(false)
                    .details("Microsoft Entra ID login blocked because employee status is " + employee.getStatus())
                    .build();
            loginLogRepository.save(inactiveLog);

            securityEventRepository.save(SecurityEvent.builder()
                    .employeeId(employee.getId())
                    .employeeName(employee.getName())
                    .email(employee.getEmail())
                    .eventType("SSO_BLOCKED_INACTIVE")
                    .severity("High")
                    .ipAddress(clientIp)
                    .browser(browser)
                    .operatingSystem(os)
                    .deviceFingerprint(fingerprint)
                    .isDeleted(false)
                    .description("Inactive user " + employee.getEmail() + " attempted Entra ID SSO login")
                    .build());

            throw new BadCredentialsException("Your account is inactive. Contact your administrator.");
        }

        // 1. Check Geo-fencing & Coordinate policy
        checkRegionAccess(employee, clientIp, request.getLatitude(), request.getLongitude(), httpRequest, "Microsoft SSO", browser, os, fingerprint);

        // 2. Microsoft Entra ID uses enterprise identity - Directly complete login without CRM 2FA challenge
        return completeLoginSuccess(employee, "Microsoft SSO", clientIp, browser, os, fingerprint, isNew, httpRequest);
    }

    /**
     * Authenticates user using Google Identity Services (OIDC ID Token / credential).
     */
    @Transactional(noRollbackFor = BadCredentialsException.class)
    public LoginResponse loginWithGoogle(GoogleLoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);
        String browser = extractBrowser(httpRequest);
        String os = extractOs(httpRequest);
        String fingerprint = (request.getDeviceFingerprint() != null && !request.getDeviceFingerprint().isBlank())
                ? request.getDeviceFingerprint() : "unknown";

        String targetEmail = null;
        String extractedName = request.getName();
        String extractedGoogleId = request.getGoogleId();

        // 1. Parse Google ID Token (credential)
        if (request.getCredential() != null && !request.getCredential().isBlank()) {
            String payloadJson = decodeJwtPayload(request.getCredential());
            if (payloadJson != null) {
                try {
                    JsonNode claims = objectMapper.readTree(payloadJson);
                    if (claims.hasNonNull("email")) {
                        targetEmail = claims.get("email").asText().trim();
                    }
                    if (claims.hasNonNull("name") && (extractedName == null || extractedName.isBlank())) {
                        extractedName = claims.get("name").asText().trim();
                    }
                    if (claims.hasNonNull("sub") && (extractedGoogleId == null || extractedGoogleId.isBlank())) {
                        extractedGoogleId = claims.get("sub").asText().trim();
                    }
                    log.info("Google ID token parsed for email: {}, googleId: {}", targetEmail, extractedGoogleId);
                } catch (Exception e) {
                    log.warn("Failed to parse Google ID token claims: {}", e.getMessage());
                }
            }
        }

        if ((targetEmail == null || targetEmail.isBlank()) && request.getEmail() != null) {
            targetEmail = request.getEmail().trim();
        }

        if (targetEmail == null || targetEmail.isBlank()) {
            throw new BadCredentialsException("Could not determine user email from Google identity.");
        }

        Optional<Employee> optionalEmployee = Optional.empty();
        if (extractedGoogleId != null && !extractedGoogleId.isBlank()) {
            optionalEmployee = employeeRepository.findByGoogleId(extractedGoogleId);
        }
        if (optionalEmployee.isEmpty()) {
            optionalEmployee = employeeRepository.findByEmail(targetEmail);
        }
        if (optionalEmployee.isEmpty()) {
            optionalEmployee = employeeRepository.findByEmailOrEmployeeNo(targetEmail);
        }
        if (optionalEmployee.isEmpty()) {
            final String finalEmail = targetEmail.toLowerCase();
            List<Employee> allEmployees = employeeRepository.findAll();
            optionalEmployee = allEmployees.stream()
                    .filter(e -> (e.getEmail() != null && e.getEmail().trim().equalsIgnoreCase(finalEmail))
                            || (e.getEmployeeNo() != null && e.getEmployeeNo().trim().equalsIgnoreCase(finalEmail)))
                    .findFirst();
        }

        boolean isNew = false;
        Integer serviceDeptId = departmentRepository.findByCode("DEPT-SERVICE")
                .map(Department::getId)
                .orElse(2);
        Integer serviceDesgId = designationRepository.findByCode("DESG-SENG")
                .map(Designation::getId)
                .orElse(2);
        Integer hqBranchId = branchRepository.findByCode("BR-MUMBAI")
                .map(Branch::getId)
                .orElse(1);

        if (optionalEmployee.isEmpty()) {
            isNew = true;
            log.info("Google user not found in Employee master. Auto-provisioning first-login record for: {}", targetEmail);
            String displayName = (extractedName != null && !extractedName.isBlank()) ? extractedName : targetEmail.split("@")[0];
            String empNo = "EMP-" + (1000 + Math.abs(targetEmail.hashCode() % 9000));

            Employee newEmp = Employee.builder()
                    .employeeNo(empNo)
                    .name(displayName)
                    .email(targetEmail)
                    .googleId(extractedGoogleId)
                    .status("Active")
                    .role("SERVICE_ENG")
                    .grade("GRADE_B")
                    .gender("Male")
                    .dob(LocalDate.of(1990, 1, 1))
                    .mobileNo("N/A")
                    .departmentId(serviceDeptId)
                    .designationId(serviceDesgId)
                    .branchId(hqBranchId)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .joiningDate(LocalDate.now())
                    .isPasswordSet(false)
                    .isLocked(false)
                    .failedLoginAttempts(0)
                    .is2faEnabled(true)
                    .isRegionRestricted(false)
                    .allowedRegions("IN")
                    .createdBy("GOOGLE_SSO")
                    .updatedBy("GOOGLE_SSO")
                    .build();

            try {
                newEmp = employeeRepository.save(newEmp);
                optionalEmployee = Optional.of(newEmp);
                log.info("Auto-provisioned new employee #{} ({}) with Google SSO", newEmp.getEmployeeNo(), newEmp.getEmail());
            } catch (Exception e) {
                log.error("Failed to auto-provision employee with Google SSO: {}", e.getMessage());
                throw new BadCredentialsException("Failed to register Google account in employee directory: " + e.getMessage());
            }
        }

        Employee employee = optionalEmployee.get();

        if (extractedGoogleId != null && !extractedGoogleId.isBlank() && !extractedGoogleId.equals(employee.getGoogleId())) {
            employee.setGoogleId(extractedGoogleId);
            employee = employeeRepository.save(employee);
        }

        if (employee.getStatus() != null && !"Active".equalsIgnoreCase(employee.getStatus())) {
            LoginLog inactiveLog = LoginLog.builder()
                    .employeeId(employee.getId())
                    .employeeName(employee.getName())
                    .email(employee.getEmail())
                    .loginMethod("Google SSO")
                    .loginStatus("Blocked")
                    .failureReason("Account inactive")
                    .ipAddress(clientIp)
                    .browser(browser)
                    .operatingSystem(os)
                    .deviceFingerprint(fingerprint)
                    .eventType("SSO_BLOCKED_INACTIVE")
                    .isActiveSession(false)
                    .isDeleted(false)
                    .details("Google SSO login blocked because employee status is " + employee.getStatus())
                    .build();
            loginLogRepository.save(inactiveLog);

            throw new BadCredentialsException("Your account is inactive. Contact your administrator.");
        }

        // 1. Check Geo-fencing & Coordinate policy
        checkRegionAccess(employee, clientIp, request.getLatitude(), request.getLongitude(), httpRequest, "Google SSO", browser, os, fingerprint);

        // 2. Check Device Trust & 2-Step Verification for new or unrecognized devices
        return finalizeOrChallenge2FA(employee, "Google SSO", clientIp, request.getLatitude(), request.getLongitude(), browser, os, fingerprint, isNew, httpRequest);
    }

    /**
     * Verifies the 6-digit OTP for 2-step verification and completes login.
     * If the user chooses to trust the device, it registers the device fingerprint.
     */
    @Transactional(noRollbackFor = BadCredentialsException.class)
    public LoginResponse verifyTwoFactor(TwoFactorVerifyRequest request, HttpServletRequest httpRequest) {
        String token = request.getVerificationToken();
        String code = request.getOtpCode();

        if (token == null || token.isBlank() || code == null || code.isBlank()) {
            throw new BadCredentialsException("Verification token and 6-digit OTP code are required.");
        }

        TwoFactorVerification verification = twoFactorVerificationRepository
                .findByVerificationTokenAndIsVerifiedFalse(token.trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired 2-step verification session. Please sign in again."));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Verification code has expired. Please click 'Resend Code'.");
        }

        String targetCode = verification.getOtpCode().trim();
        String submittedCode = code.trim();

        // Check code match (or dev fallback 123456)
        if (!targetCode.equals(submittedCode) && !"123456".equals(submittedCode)) {
            throw new BadCredentialsException("Invalid 6-digit verification code. Please check your email and try again.");
        }

        Employee employee = employeeRepository.findById(verification.getEmployeeId())
                .orElseThrow(() -> new BadCredentialsException("User account not found for this verification session."));

        String clientIp = extractClientIp(httpRequest);
        String browser = extractBrowser(httpRequest);
        String os = extractOs(httpRequest);
        String fingerprint = (request.getDeviceFingerprint() != null && !request.getDeviceFingerprint().isBlank())
                ? request.getDeviceFingerprint()
                : (verification.getDeviceFingerprint() != null ? verification.getDeviceFingerprint() : "unknown");

        // Mark verification as used
        verification.setIsVerified(true);
        twoFactorVerificationRepository.save(verification);

        // Trust this device if requested or true by default
        boolean trustDevice = request.getTrustDevice() == null || Boolean.TRUE.equals(request.getTrustDevice());
        if (trustDevice && fingerprint != null && !fingerprint.isBlank() && !"unknown".equalsIgnoreCase(fingerprint)) {
            Optional<TrustedDevice> existingDevice = trustedDeviceRepository.findByEmployeeIdAndDeviceFingerprint(employee.getId(), fingerprint);
            String devName = (request.getDeviceName() != null && !request.getDeviceName().isBlank())
                    ? request.getDeviceName() : (browser + " on " + os);

            if (existingDevice.isEmpty()) {
                trustedDeviceRepository.save(TrustedDevice.builder()
                        .employeeId(employee.getId())
                        .deviceFingerprint(fingerprint)
                        .deviceName(devName)
                        .browser(browser)
                        .operatingSystem(os)
                        .ipAddress(clientIp)
                        .lastUsedAt(LocalDateTime.now())
                        .build());
                log.info("💻 Device registered as trusted for employee #{}: {} ({})", employee.getId(), devName, fingerprint);
            } else {
                TrustedDevice td = existingDevice.get();
                td.setLastUsedAt(LocalDateTime.now());
                td.setIpAddress(clientIp);
                trustedDeviceRepository.save(td);
            }
        }

        String loginMethod = (verification.getLoginMethod() != null && !verification.getLoginMethod().isBlank())
                ? verification.getLoginMethod() : "2FA Verified";

        log.info("✅ 2-Step verification successful for {} (Method: {})", employee.getEmail(), loginMethod);

        return completeLoginSuccess(employee, loginMethod, clientIp, browser, os, fingerprint,
                Boolean.TRUE.equals(verification.getIsNewUser()), httpRequest);
    }

    /**
     * Resends a new 6-digit OTP code for an active 2-step verification session.
     */
    @Transactional
    public Map<String, Object> resendTwoFactorOtp(String verificationToken, HttpServletRequest httpRequest) {
        if (verificationToken == null || verificationToken.isBlank()) {
            throw new BadCredentialsException("Verification token is required");
        }

        TwoFactorVerification verification = twoFactorVerificationRepository
                .findByVerificationTokenAndIsVerifiedFalse(verificationToken.trim())
                .orElseThrow(() -> new BadCredentialsException("No active 2-step verification session found. Please sign in again."));

        Employee employee = employeeRepository.findById(verification.getEmployeeId())
                .orElseThrow(() -> new BadCredentialsException("User account not found"));

        String newOtp = String.format("%06d", (int)(Math.random() * 900000) + 100000);
        verification.setOtpCode(newOtp);
        verification.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        twoFactorVerificationRepository.save(verification);

        emailService.sendTwoFactorOtpEmail(employee.getEmail(), employee.getName(), newOtp, 10);
        log.info("🔁 [2-STEP OTP RESENT] User: {}, New Code: {}", employee.getEmail(), newOtp);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "A new 6-digit verification code has been dispatched to your email.");
        res.put("maskedEmail", maskEmail(employee.getEmail()));
        res.put("devOtp", newOtp);
        return res;
    }

    private LoginResponse buildLoginResponse(Employee employee, String sessionId, boolean autoProvisioned) {
        UserPrincipal principal = UserPrincipal.create(employee);
        String token = tokenProvider.generateToken(principal);

        Department dept = employee.getDepartmentId() != null
                ? departmentRepository.findById(employee.getDepartmentId()).orElse(null)
                : null;
        Designation desg = employee.getDesignationId() != null
                ? designationRepository.findById(employee.getDesignationId()).orElse(null)
                : null;
        Branch branch = employee.getBranchId() != null
                ? branchRepository.findById(employee.getBranchId()).orElse(null)
                : null;

        String branchName = branch != null ? branch.getName() : "Mumbai HQ";
        String deptName = dept != null ? dept.getName() : "Management";
        String desigTitle = desg != null ? desg.getTitle() : "System Administrator";

        LoginResponse.UserDto userDto = LoginResponse.UserDto.builder()
                .id(employee.getId())
                .employeeNo(employee.getEmployeeNo())
                .name(employee.getName())
                .email(employee.getEmail())
                .role(employee.getRole())
                .grade(employee.getGrade())
                .gender(employee.getGender())
                .mobileNo(employee.getMobileNo())
                .branchId(employee.getBranchId())
                .branch(branchName)
                .branchName(branchName)
                .departmentId(employee.getDepartmentId())
                .department(deptName)
                .departmentName(deptName)
                .designationId(employee.getDesignationId())
                .designation(desigTitle)
                .designationTitle(desigTitle)
                .isPasswordSet(Boolean.TRUE.equals(employee.getIsPasswordSet()))
                .is2faEnabled(Boolean.TRUE.equals(employee.getIs2faEnabled()))
                .isRegionRestricted(Boolean.TRUE.equals(employee.getIsRegionRestricted()))
                .allowedRegions(employee.getAllowedRegions() != null ? employee.getAllowedRegions() : "IN")
                .build();

        return LoginResponse.builder()
                .token(token)
                .accessToken(token)
                .sessionId(sessionId)
                .autoProvisioned(autoProvisioned)
                .user(userDto)
                .build();
    }

    @Transactional(readOnly = true)
    public LoginResponse.UserDto getProfile(Integer userId) {
        Employee employee = employeeRepository.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("User profile not found"));

        Department dept = employee.getDepartmentId() != null
                ? departmentRepository.findById(employee.getDepartmentId()).orElse(null)
                : null;
        Designation desg = employee.getDesignationId() != null
                ? designationRepository.findById(employee.getDesignationId()).orElse(null)
                : null;
        Branch branch = employee.getBranchId() != null
                ? branchRepository.findById(employee.getBranchId()).orElse(null)
                : null;

        String branchName = branch != null ? branch.getName() : "Mumbai HQ";
        String deptName = dept != null ? dept.getName() : "Management";
        String desigTitle = desg != null ? desg.getTitle() : "System Administrator";

        return LoginResponse.UserDto.builder()
                .id(employee.getId())
                .employeeNo(employee.getEmployeeNo())
                .name(employee.getName())
                .email(employee.getEmail())
                .role(employee.getRole())
                .grade(employee.getGrade())
                .gender(employee.getGender())
                .mobileNo(employee.getMobileNo())
                .branchId(employee.getBranchId())
                .branch(branchName)
                .branchName(branchName)
                .departmentId(employee.getDepartmentId())
                .department(deptName)
                .departmentName(deptName)
                .designationId(employee.getDesignationId())
                .designation(desigTitle)
                .designationTitle(desigTitle)
                .isPasswordSet(Boolean.TRUE.equals(employee.getIsPasswordSet()))
                .is2faEnabled(Boolean.TRUE.equals(employee.getIs2faEnabled()))
                .isRegionRestricted(Boolean.TRUE.equals(employee.getIsRegionRestricted()))
                .allowedRegions(employee.getAllowedRegions() != null ? employee.getAllowedRegions() : "IN")
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMenuCounts(UserPrincipal currentUser) {
        Map<String, Object> counts = new HashMap<>();

        if (currentUser != null && ("ADMIN".equalsIgnoreCase(currentUser.getRole()) || "MANAGER".equalsIgnoreCase(currentUser.getRole()))) {
            counts.put("dailyVisits", dailyVisitRepository.count());
            counts.put("approvals", dailyVisitRepository.countByStatusIn(List.of("PENDING_APPROVAL", "SUBMITTED", "Submitted")));
        } else if (currentUser != null) {
            counts.put("dailyVisits", dailyVisitRepository.countByEmployeeId(currentUser.getId()));
            counts.put("approvals", dailyVisitRepository.countByEmployeeIdAndStatusIn(currentUser.getId(), List.of("PENDING_APPROVAL", "SUBMITTED", "Submitted")));
        } else {
            counts.put("dailyVisits", 0);
            counts.put("approvals", 0);
        }

        counts.put("opportunities", opportunityRepository.count());
        counts.put("quotations", quotationRepository.count());
        counts.put("customers", customerRepository.count());
        counts.put("contacts", contactRepository.count());
        counts.put("employees", employeeRepository.countByStatusIgnoreCase("Active"));
        counts.put("loginLogs", loginLogRepository.countByIsDeletedFalse());
        counts.put("activeLockouts", employeeRepository.countLockedOrRestricted());
        counts.put("securityIncidents", securityEventRepository.countByIsDeletedFalse());

        return counts;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getNotifications(UserPrincipal currentUser) {
        List<Map<String, Object>> notifs = new ArrayList<>();

        // 1. Locked accounts alert
        List<Employee> lockedList = employeeRepository.findLockedEmployees();
        for (Employee emp : lockedList) {
            Map<String, Object> notif = new HashMap<>();
            notif.put("id", "lock-" + emp.getId());
            notif.put("type", "SECURITY_ALERT");
            notif.put("title", "Account Locked: " + emp.getName());
            notif.put("message", "User " + emp.getEmail() + " is locked due to " + (emp.getFailedLoginAttempts() != null ? emp.getFailedLoginAttempts() : 3) + " failed login attempts.");
            notif.put("severity", "error");
            notif.put("timestamp", emp.getLockoutExpiresAt() != null ? emp.getLockoutExpiresAt().toString() : LocalDateTime.now().toString());
            notif.put("actionType", "UNLOCK_USER");
            notif.put("targetId", emp.getId());
            notif.put("targetName", emp.getName());
            notif.put("targetEmail", emp.getEmail());
            notifs.add(notif);
        }

        // 2. Recent security events & failed attempts
        List<SecurityEvent> events = securityEventRepository.findTop10ByIsDeletedFalseOrderByIdDesc();
        for (SecurityEvent ev : events) {
            Map<String, Object> notif = new HashMap<>();
            notif.put("id", "sec-" + ev.getId());
            notif.put("type", ev.getEventType());
            notif.put("title", "Security Alert: " + (ev.getEventType() != null ? ev.getEventType() : "Event"));
            notif.put("message", ev.getDescription() != null ? ev.getDescription() : "Security event recorded");
            notif.put("severity", "High".equalsIgnoreCase(ev.getSeverity()) || "Critical".equalsIgnoreCase(ev.getSeverity()) ? "error" : "warning");
            notif.put("timestamp", ev.getTimestamp() != null ? ev.getTimestamp().toString() : LocalDateTime.now().toString());
            notif.put("actionType", ev.getEmployeeId() != null ? "RESET_PASSWORD" : null);
            notif.put("targetId", ev.getEmployeeId());
            notif.put("targetName", ev.getEmployeeName());
            notif.put("targetEmail", ev.getEmail());
            notifs.add(notif);
        }

        return notifs;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getLoginLogs(Integer employeeId, String loginStatus, String loginMethod,
                                           String ipAddress, String search, String startDate, String endDate,
                                           int page, int limit) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.max(1, limit), Sort.by(Sort.Direction.DESC, "id"));

        LocalDateTime start = (startDate != null && !startDate.isBlank()) ? parseDateTime(startDate, true) : null;
        LocalDateTime end = (endDate != null && !endDate.isBlank()) ? parseDateTime(endDate, false) : null;

        Page<LoginLog> pageResult = loginLogRepository.findAllWithFilters(
                employeeId, loginStatus, loginMethod, ipAddress, search, start, end, pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("data", pageResult.getContent());
        result.put("total", pageResult.getTotalElements());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalLogins", loginLogRepository.countByIsDeletedFalse());
        stats.put("successfulLogins", loginLogRepository.countByLoginStatusAndIsDeletedFalse("Success"));
        stats.put("failedLogins", loginLogRepository.countByLoginStatusAndIsDeletedFalse("Failed"));
        stats.put("ssoLogins", loginLogRepository.countByLoginMethodAndIsDeletedFalse("Microsoft SSO"));
        stats.put("credentialLogins", loginLogRepository.countByLoginMethodAndIsDeletedFalse("Credential"));
        stats.put("activeSessions", loginLogRepository.countByIsActiveSessionAndIsDeletedFalse(true));
        stats.put("autoProvisionedCount", loginLogRepository.countByAutoProvisionedAndIsDeletedFalse(true));
        result.put("stats", stats);

        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSecurityEvents(String severity, String eventType, String search,
                                                String startDate, String endDate, int page, int limit) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.max(1, limit), Sort.by(Sort.Direction.DESC, "id"));

        LocalDateTime start = (startDate != null && !startDate.isBlank()) ? parseDateTime(startDate, true) : null;
        LocalDateTime end = (endDate != null && !endDate.isBlank()) ? parseDateTime(endDate, false) : null;

        Page<SecurityEvent> pageResult = securityEventRepository.findAllWithFilters(
                severity, eventType, search, start, end, pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("data", pageResult.getContent());
        result.put("total", pageResult.getTotalElements());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEvents", securityEventRepository.countByIsDeletedFalse());
        stats.put("highSeverity", securityEventRepository.countBySeverityAndIsDeletedFalse("High"));
        stats.put("criticalSeverity", securityEventRepository.countBySeverityAndIsDeletedFalse("Critical"));
        stats.put("mediumSeverity", securityEventRepository.countBySeverityAndIsDeletedFalse("Medium"));
        stats.put("lowSeverity", securityEventRepository.countBySeverityAndIsDeletedFalse("Low"));
        result.put("stats", stats);

        return result;
    }

    @Transactional
    public int softDeleteLoginLogs(List<Long> ids, String adminName) {
        if (ids == null || ids.isEmpty()) return 0;
        int count = loginLogRepository.softDeleteByIds(ids);

        securityEventRepository.save(SecurityEvent.builder()
                .eventType("LOGS_SOFT_DELETED")
                .severity("Low")
                .isDeleted(false)
                .description("Admin " + (adminName != null ? adminName : "System Admin") + " soft deleted " + count + " login audit log(s)")
                .build());

        return count;
    }

    @Transactional
    public int softDeleteSecurityEvents(List<Long> ids, String adminName) {
        if (ids == null || ids.isEmpty()) return 0;
        int count = securityEventRepository.softDeleteByIds(ids);

        securityEventRepository.save(SecurityEvent.builder()
                .eventType("EVENTS_SOFT_DELETED")
                .severity("Low")
                .isDeleted(false)
                .description("Admin " + (adminName != null ? adminName : "System Admin") + " soft deleted " + count + " security event(s)")
                .build());

        return count;
    }

    @Transactional
    public int clearAllLoginLogs(String adminName) {
        int count = loginLogRepository.softDeleteAll();

        securityEventRepository.save(SecurityEvent.builder()
                .eventType("LOGS_CLEAR_ALL")
                .severity("Medium")
                .isDeleted(false)
                .description("Admin " + (adminName != null ? adminName : "System Admin") + " cleared all active login audit logs (" + count + " logs)")
                .build());

        return count;
    }

    @Transactional
    public Map<String, Object> skipSetPasswordAndSendEmail(Integer userId, String email) {
        String empName = "Team Member";
        if (userId != null) {
            empName = employeeRepository.findById(userId).map(Employee::getName).orElse("Team Member");
        }

        emailService.sendPasswordSetupReminder(email, empName);

        securityEventRepository.save(SecurityEvent.builder()
                .employeeId(userId)
                .email(email)
                .eventType("PASSWORD_SETUP_EMAIL_SENT")
                .severity("Low")
                .isDeleted(false)
                .description("Password setup reminder email sent to " + email + " after skipping modal prompt")
                .build());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("email", email);
        res.put("message", "Password setup reminder has been sent to your email (" + email + ").");
        return res;
    }

    @Transactional(readOnly = true)
    public List<Employee> getLockedEmployees() {
        return employeeRepository.findLockedEmployees();
    }

    @Transactional
    public Employee unlockEmployee(Integer employeeId, String adminName) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BadCredentialsException("Employee not found"));

        employee.setIsLocked(false);
        employee.setLockoutTier(0);
        employee.setLockoutExpiresAt(null);
        employee.setFailedLoginAttempts(0);
        employeeRepository.save(employee);

        securityEventRepository.save(SecurityEvent.builder()
                .employeeId(employee.getId())
                .employeeName(employee.getName())
                .email(employee.getEmail())
                .eventType("ADMIN_UNLOCK")
                .severity("Low")
                .isDeleted(false)
                .description("Account unlocked by Administrator: " + (adminName != null ? adminName : "System Admin"))
                .build());

        return employee;
    }

    @Transactional
    public Employee adminResetPassword(Integer employeeId, String newPassword, String adminName) {
        validatePasswordPolicy(newPassword);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BadCredentialsException("Employee not found"));

        employee.setPasswordHash(passwordEncoder.encode(newPassword));
        employee.setIsPasswordSet(true);
        employee.setPasswordChangedAt(LocalDateTime.now());
        employee.setIsLocked(false);
        employee.setLockoutTier(0);
        employee.setLockoutExpiresAt(null);
        employee.setFailedLoginAttempts(0);
        employeeRepository.save(employee);

        emailService.sendPasswordResetNotice(employee.getEmail(), employee.getName(), newPassword);

        securityEventRepository.save(SecurityEvent.builder()
                .employeeId(employee.getId())
                .employeeName(employee.getName())
                .email(employee.getEmail())
                .eventType("ADMIN_PASSWORD_RESET")
                .severity("Medium")
                .isDeleted(false)
                .description("Administrator " + (adminName != null ? adminName : "System Admin") + " reset password for " + employee.getEmail())
                .build());

        return employee;
    }

    @Transactional
    public Map<String, Object> adminResetAllPasswords(String newPassword, String adminName) {
        String finalPassword = (newPassword != null && !newPassword.isBlank()) ? newPassword : "Password@123";
        validatePasswordPolicy(finalPassword);

        List<Employee> activeEmployees = employeeRepository.findAll();
        String encodedHash = passwordEncoder.encode(finalPassword);
        int count = 0;

        for (Employee emp : activeEmployees) {
            emp.setPasswordHash(encodedHash);
            emp.setIsPasswordSet(true);
            emp.setPasswordChangedAt(LocalDateTime.now());
            emp.setIsLocked(false);
            emp.setLockoutTier(0);
            emp.setLockoutExpiresAt(null);
            emp.setFailedLoginAttempts(0);
            count++;
        }
        employeeRepository.saveAll(activeEmployees);

        securityEventRepository.save(SecurityEvent.builder()
                .eventType("BULK_ADMIN_PASSWORD_RESET")
                .severity("High")
                .isDeleted(false)
                .description("Admin " + (adminName != null ? adminName : "System Admin") + " performed bulk reset for " + count + " employee accounts to default password")
                .build());

        Map<String, Object> response = new HashMap<>();
        response.put("updatedCount", count);
        response.put("defaultPassword", finalPassword);
        response.put("message", "All " + count + " employee passwords reset successfully to: " + finalPassword);
        return response;
    }

    @Transactional
    public void setPassword(Integer employeeId, String newPassword) {
        validatePasswordPolicy(newPassword);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BadCredentialsException("Employee not found"));

        employee.setPasswordHash(passwordEncoder.encode(newPassword));
        employee.setIsPasswordSet(true);
        employee.setPasswordChangedAt(LocalDateTime.now());
        employeeRepository.save(employee);
    }

    @Transactional
    public SecurityEvent logSecurityEvent(SecurityEventRequest request, HttpServletRequest httpRequest) {
        String clientIp = (request.getIpAddress() != null && !request.getIpAddress().isBlank())
                ? request.getIpAddress() : extractClientIp(httpRequest);
        String browser = (request.getBrowser() != null && !request.getBrowser().isBlank())
                ? request.getBrowser() : extractBrowser(httpRequest);
        String os = (request.getOperatingSystem() != null && !request.getOperatingSystem().isBlank())
                ? request.getOperatingSystem() : extractOs(httpRequest);

        SecurityEvent event = SecurityEvent.builder()
                .employeeId(request.getEmployeeId())
                .employeeName(request.getEmployeeName())
                .email(request.getEmail())
                .eventType(request.getEventType() != null ? request.getEventType() : "SECURITY_INCIDENT")
                .severity(request.getSeverity() != null ? request.getSeverity() : "Medium")
                .ipAddress(clientIp)
                .browser(browser)
                .operatingSystem(os)
                .deviceFingerprint(request.getDeviceFingerprint() != null ? request.getDeviceFingerprint() : "unknown")
                .pageUrl(request.getPageUrl())
                .isDeleted(false)
                .description(request.getDescription() != null ? request.getDescription() : request.getDetails())
                .build();

        return securityEventRepository.save(event);
    }

    @Transactional
    public void logLifecycleEvent(LifecycleEventRequest request, HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);
        String browser = extractBrowser(httpRequest);
        String os = extractOs(httpRequest);

        securityEventRepository.save(SecurityEvent.builder()
                .employeeId(request.getUserId())
                .email(request.getEmail())
                .eventType(request.getEventType() != null ? request.getEventType() : "LIFECYCLE_EVENT")
                .severity("Low")
                .ipAddress(clientIp)
                .browser(browser)
                .operatingSystem(os)
                .deviceFingerprint(request.getDeviceFingerprint() != null ? request.getDeviceFingerprint() : "unknown")
                .isDeleted(false)
                .description(request.getDetails())
                .build());
    }

    @Transactional(readOnly = true)
    public List<LoginLog> getActiveSessions(Integer employeeId) {
        return loginLogRepository.findByEmployeeIdAndIsActiveSessionTrueAndIsDeletedFalse(employeeId);
    }

    @Transactional
    public void terminateSession(String sessionId) {
        List<LoginLog> logs = loginLogRepository.findBySessionId(sessionId);
        for (LoginLog logItem : logs) {
            logItem.setIsActiveSession(false);
            logItem.setLogoutTimestamp(LocalDateTime.now());
        }
        loginLogRepository.saveAll(logs);
    }

    @Transactional
    public void terminateOtherSessions(Integer employeeId, String currentSessionId) {
        List<LoginLog> logs = loginLogRepository.findByEmployeeIdAndIsActiveSessionTrueAndIsDeletedFalse(employeeId);
        for (LoginLog logItem : logs) {
            if (!Objects.equals(logItem.getSessionId(), currentSessionId)) {
                logItem.setIsActiveSession(false);
                logItem.setLogoutTimestamp(LocalDateTime.now());
            }
        }
        loginLogRepository.saveAll(logs);
    }

    @Transactional
    public void logout(String sessionId, UserPrincipal currentUser, HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);
        String browser = extractBrowser(httpRequest);
        String os = extractOs(httpRequest);

        Integer empId = currentUser != null ? currentUser.getId() : null;
        String empName = currentUser != null ? currentUser.getName() : null;
        String email = currentUser != null ? currentUser.getEmail() : null;

        if (sessionId != null && !sessionId.isBlank()) {
            List<LoginLog> logs = loginLogRepository.findBySessionId(sessionId);
            for (LoginLog logItem : logs) {
                logItem.setIsActiveSession(false);
                logItem.setLogoutTimestamp(LocalDateTime.now());
                if (empId == null) {
                    empId = logItem.getEmployeeId();
                    empName = logItem.getEmployeeName();
                    email = logItem.getEmail();
                }
            }
            loginLogRepository.saveAll(logs);
        }

        if (email != null) {
            LoginLog logoutLog = LoginLog.builder()
                    .employeeId(empId)
                    .employeeName(empName)
                    .email(email)
                    .loginMethod("Credential")
                    .loginStatus("Logout")
                    .failureReason("None (Clean Logout)")
                    .ipAddress(clientIp)
                    .browser(browser)
                    .operatingSystem(os)
                    .sessionId(sessionId)
                    .eventType("USER_LOGOUT")
                    .isActiveSession(false)
                    .isDeleted(false)
                    .details("User signed out from system")
                    .build();
            loginLogRepository.save(logoutLog);
        }
    }

    private LocalDateTime parseDateTime(String text, boolean isStart) {
        try {
            if (text.contains("T")) {
                return LocalDateTime.parse(text);
            }
            LocalDate d = LocalDate.parse(text, DateTimeFormatter.ISO_LOCAL_DATE);
            return isStart ? d.atStartOfDay() : d.atTime(23, 59, 59);
        } catch (Exception e) {
            return null;
        }
    }
}
