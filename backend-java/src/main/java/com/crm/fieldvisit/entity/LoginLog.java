package com.crm.fieldvisit.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class LoginLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id")
    private Integer employeeId;

    @Column(name = "employee_name", length = 150)
    private String employeeName;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(name = "login_method", nullable = false, length = 20)
    @Builder.Default
    private String loginMethod = "Credential";

    @Column(name = "login_status", nullable = false, length = 20)
    @Builder.Default
    private String loginStatus = "Success";

    @Column(name = "failure_reason", length = 150)
    private String failureReason;

    @Column(name = "ip_address", nullable = false, length = 64)
    @Builder.Default
    private String ipAddress = "127.0.0.1";

    @Column(length = 100)
    @Builder.Default
    private String browser = "Unknown";

    @Column(name = "operating_system", length = 100)
    @Builder.Default
    private String operatingSystem = "Unknown";

    @Column(name = "device_fingerprint", length = 255)
    @Builder.Default
    private String deviceFingerprint = "unknown";

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @CreationTimestamp
    @Column(name = "login_timestamp", nullable = false, updatable = false)
    private LocalDateTime loginTimestamp;

    @Column(name = "logout_timestamp")
    private LocalDateTime logoutTimestamp;

    @Column(name = "session_duration")
    private Integer sessionDuration;

    @Column(name = "auto_provisioned", nullable = false)
    @Builder.Default
    private Boolean autoProvisioned = false;

    @Column(name = "event_type", length = 50)
    @Builder.Default
    private String eventType = "LOGIN_SUCCESS";

    @Column(name = "is_active_session", nullable = false)
    @Builder.Default
    private Boolean isActiveSession = true;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String details;
}
