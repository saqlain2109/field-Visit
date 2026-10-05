package com.crm.fieldvisit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    private String username;

    private String email;

    private String emailOrEmployeeNumber;

    private String employeeNo;

    @NotBlank(message = "Password is required")
    private String password;

    private String deviceFingerprint;

    private String browserProfileId;

    public String getIdentifier() {
        if (username != null && !username.isBlank()) {
            return username.trim();
        }
        if (email != null && !email.isBlank()) {
            return email.trim();
        }
        if (emailOrEmployeeNumber != null && !emailOrEmployeeNumber.isBlank()) {
            return emailOrEmployeeNumber.trim();
        }
        if (employeeNo != null && !employeeNo.isBlank()) {
            return employeeNo.trim();
        }
        return "";
    }
}
