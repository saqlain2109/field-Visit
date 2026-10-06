package com.crm.fieldvisit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String accessToken;
    private String sessionId;
    private Boolean autoProvisioned;
    private UserDto user;

    // 2-Step Verification Challenge fields
    private Boolean requires2FA;
    private String verificationToken;
    private String maskedEmail;
    private String maskedPhone;
    private String devOtp;
    private Boolean isNewDevice;
    private String clientRegion;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private Integer id;
        private String employeeNo;
        private String name;
        private String email;
        private String role;
        private String grade;
        private String gender;
        private String mobileNo;
        private Integer branchId;
        private String branch;
        private String branchName;
        private Integer departmentId;
        private String department;
        private String departmentName;
        private Integer designationId;
        private String designation;
        private String designationTitle;
        private Boolean isPasswordSet;
        private Boolean is2faEnabled;
        private Boolean isRegionRestricted;
        private String allowedRegions;
    }
}
