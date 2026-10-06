package com.crm.fieldvisit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleLoginRequest {
    private String credential; // Google ID Token
    private String accessToken;
    private String email;
    private String name;
    private String googleId;
    private String deviceFingerprint;
    private String browserProfileId;
    private String clientCountry;
    private Double latitude;
    private Double longitude;
}
