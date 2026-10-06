package com.crm.fieldvisit.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEmployeeRequest {

    private String employeeNo;

    @NotBlank(message = "Name is required")
    private String name;

    @Builder.Default
    private String gender = "Male";

    private LocalDate dob;

    @NotNull(message = "Department ID is required")
    private Integer departmentId;

    @NotNull(message = "Designation ID is required")
    private Integer designationId;

    @NotNull(message = "Branch ID is required")
    private Integer branchId;

    @NotNull(message = "Joining date is required")
    private LocalDate joiningDate;

    @Builder.Default
    private String status = "Active";

    @NotBlank(message = "Mobile number is required")
    private String mobileNo;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String password;

    @Builder.Default
    private String role = "SERVICE_ENG";

    @Builder.Default
    private String grade = "GRADE_B";

    @Builder.Default
    private Boolean is2faEnabled = true;

    @Builder.Default
    private Boolean isRegionRestricted = false;

    @Builder.Default
    private String allowedRegions = "IN";

    private Double allowedLatitude;
    private Double allowedLongitude;
    private Double allowedRadiusKm;
}
