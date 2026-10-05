package com.crm.fieldvisit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityEventRequest {

    private Integer employeeId;
    private String employeeName;
    private String email;
    private String eventType;
    private String severity;
    private String ipAddress;
    private String browser;
    private String operatingSystem;
    private String deviceFingerprint;
    private String pageUrl;
    private String details;
    private String description;
}
