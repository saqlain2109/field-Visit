package com.crm.fieldvisit.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "employee_no", nullable = false, unique = true, length = 50)
    private String employeeNo;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String gender = "Male";

    @Column
    private LocalDate dob;

    @Column(name = "department_id", nullable = false)
    private Integer departmentId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", insertable = false, updatable = false)
    private Department department;

    @Column(name = "designation_id", nullable = false)
    private Integer designationId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "designation_id", insertable = false, updatable = false)
    private Designation designation;

    @Column(name = "branch_id", nullable = false)
    private Integer branchId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "manager"})
    private Branch branch;

    @Column(name = "joining_date", nullable = false)
    private LocalDate joiningDate;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "Active";

    @Column(name = "mobile_no", nullable = false, length = 20)
    private String mobileNo;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "azure_ad_oid", length = 100)
    private String azureAdOid;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "is_password_set")
    @Builder.Default
    private Boolean isPasswordSet = true;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    @Column(name = "is_locked")
    @Builder.Default
    private Boolean isLocked = false;

    @Column(name = "lockout_expires_at")
    private LocalDateTime lockoutExpiresAt;

    @Column(name = "failed_login_attempts")
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    @Column(name = "lockout_tier")
    @Builder.Default
    private Integer lockoutTier = 0;

    @Column(name = "last_login_ip", length = 64)
    private String lastLoginIp;

    @Column(name = "last_login_time")
    private LocalDateTime lastLoginTime;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String role = "SERVICE_ENG";

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String grade = "GRADE_B";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    @Builder.Default
    private String createdBy = "SYSTEM";

    @Column(name = "updated_by", length = 100)
    @Builder.Default
    private String updatedBy = "SYSTEM";
}
