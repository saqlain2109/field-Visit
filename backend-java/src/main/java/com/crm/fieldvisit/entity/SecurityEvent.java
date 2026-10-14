package com.crm.fieldvisit.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "security_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(name = "employee_id")
    private Integer employeeId;

    @Column(name = "employee_name", length = 150)
    private String employeeName;

    @Column(length = 150)
    private String email;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String severity = "Medium";

    @Column(name = "ip_address", nullable = false, length = 64)
    @Builder.Default
    private String ipAddress = "127.0.0.1";

    @Column(length = 100)
    @Builder.Default
    private String browser = "Chrome/Edge";

    @Column(name = "operating_system", length = 100)
    @Builder.Default
    private String operatingSystem = "Windows";

    @Column(name = "device_fingerprint", length = 255)
    @Builder.Default
    private String deviceFingerprint = "unknown";

    @Column(name = "page_url", length = 255)
    private String pageUrl;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(length = 4000)
    private String description;
}
