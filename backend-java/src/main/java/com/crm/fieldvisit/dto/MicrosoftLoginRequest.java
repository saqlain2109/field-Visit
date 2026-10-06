package com.crm.fieldvisit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MicrosoftLoginRequest {

    /**
     * ID Token returned by Microsoft Entra ID (Azure AD) OIDC
     */
    private String idToken;

    /**
     * Microsoft Graph / Azure Access Token
     */
    private String accessToken;

    /**
     * Microsoft account email or UserPrincipalName (UPN)
     */
    private String email;

    /**
     * Full Name from Microsoft profile
     */
    private String name;

    /**
     * Microsoft Entra Object ID (unique per user across the tenant)
     */
    private String azureAdOid;

    /**
     * Tenant ID
     */
    private String tenantId;

    /**
     * Client-generated hardware / browser fingerprint
     */
    private String deviceFingerprint;

    /**
     * Client browser profile ID
     */
    private String browserProfileId;
    private Double latitude;
    private Double longitude;
}
