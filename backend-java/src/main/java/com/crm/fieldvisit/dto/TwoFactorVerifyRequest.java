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
public class TwoFactorVerifyRequest {
    @NotBlank(message = "Verification token is required")
    private String verificationToken;

    @NotBlank(message = "OTP code is required")
    private String otpCode;

    private String deviceFingerprint;
    private String deviceName;
    private Boolean trustDevice;
    private String clientCountry;
}
