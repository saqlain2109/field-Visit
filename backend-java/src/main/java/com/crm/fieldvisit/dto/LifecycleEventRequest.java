package com.crm.fieldvisit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LifecycleEventRequest {

    private Integer userId;
    private String email;
    private String eventType;
    private String details;
    private String deviceFingerprint;
}
