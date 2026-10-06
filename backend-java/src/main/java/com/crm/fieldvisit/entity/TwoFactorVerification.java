package com.crm.fieldvisit.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "two_factor_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TwoFactorVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Integer employeeId;

    @Column(name = "verification_token", nullable = false, length = 100, unique = true)
    private String verificationToken;

    @Column(name = "otp_code", nullable = false, length = 10)
    private String otpCode;

    @Column(name = "device_fingerprint", length = 255)
    private String deviceFingerprint;

    @Column(name = "device_name", length = 150)
    private String deviceName;

    @Column(name = "login_method", length = 50)
    private String loginMethod;

    @Column(name = "client_ip", length = 64)
    private String clientIp;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "is_new_user")
    @Builder.Default
    private Boolean isNewUser = false;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
