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
    }
}
