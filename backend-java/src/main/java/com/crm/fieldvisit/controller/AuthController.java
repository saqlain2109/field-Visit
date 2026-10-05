package com.crm.fieldvisit.controller;

import com.crm.fieldvisit.common.ApiResponse;
import com.crm.fieldvisit.dto.*;
import com.crm.fieldvisit.entity.Employee;
import com.crm.fieldvisit.entity.LoginLog;
import com.crm.fieldvisit.entity.SecurityEvent;
import com.crm.fieldvisit.security.UserPrincipal;
import com.crm.fieldvisit.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Authentication & Security Matrix")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Login with Email/EmpNo and Password with Progressive Lockout")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request,
                                                            HttpServletRequest httpRequest) {
        LoginResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Login with Microsoft Entra ID (Azure AD) SSO")
    @PostMapping({"/azure", "/microsoft"})
    public ResponseEntity<ApiResponse<LoginResponse>> loginWithMicrosoft(@RequestBody MicrosoftLoginRequest request,
                                                                         HttpServletRequest httpRequest) {
        LoginResponse response = authService.loginWithMicrosoft(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Get current authenticated user profile")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<LoginResponse.UserDto>> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        LoginResponse.UserDto profile = authService.getProfile(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @Operation(summary = "Get dynamic menu item counts for sidebar badges")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/menu-counts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMenuCounts(@AuthenticationPrincipal UserPrincipal currentUser) {
        Map<String, Object> counts = authService.getMenuCounts(currentUser);
        return ResponseEntity.ok(ApiResponse.success(counts));
    }

    @Operation(summary = "Get security notifications & alerts for interactive top bar")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getNotifications(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Map<String, Object>> notifs = authService.getNotifications(currentUser);
        return ResponseEntity.ok(ApiResponse.success(notifs));
    }

    @Operation(summary = "Get paginated login audit logs")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/login-logs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLoginLogs(
            @RequestParam(required = false) Integer employeeId,
            @RequestParam(required = false) String loginStatus,
            @RequestParam(required = false) String loginMethod,
            @RequestParam(required = false) String ipAddress,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "25") int limit) {
        Map<String, Object> logs = authService.getLoginLogs(employeeId, loginStatus, loginMethod, ipAddress, search, startDate, endDate, page, limit);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @Operation(summary = "Soft delete login audit logs (bulk)")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/login-logs/delete")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteLoginLogs(@RequestBody DeleteLogsRequest request,
                                                                           @AuthenticationPrincipal UserPrincipal currentUser) {
        String adminName = currentUser != null ? currentUser.getUsername() : "Administrator";
        int count = authService.softDeleteLoginLogs(request.getIds(), adminName);
        return ResponseEntity.ok(ApiResponse.success(Map.of("deletedCount", count, "message", "Deleted " + count + " log(s) successfully")));
    }

    @Operation(summary = "Delete single login log by ID")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/login-logs/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteLoginLog(@PathVariable("id") Long id,
                                                                           @AuthenticationPrincipal UserPrincipal currentUser) {
        String adminName = currentUser != null ? currentUser.getUsername() : "Administrator";
        int count = authService.softDeleteLoginLogs(List.of(id), adminName);
        return ResponseEntity.ok(ApiResponse.success(Map.of("deletedCount", count, "message", "Log deleted successfully")));
    }

    @Operation(summary = "Clear all active login audit logs")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/login-logs/clear-all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> clearAllLoginLogs(@AuthenticationPrincipal UserPrincipal currentUser) {
        String adminName = currentUser != null ? currentUser.getUsername() : "Administrator";
        int count = authService.clearAllLoginLogs(adminName);
        return ResponseEntity.ok(ApiResponse.success(Map.of("deletedCount", count, "message", "All " + count + " logs cleared successfully")));
    }

    @Operation(summary = "Get paginated security incident events")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/security-events")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSecurityEvents(
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "25") int limit) {
        Map<String, Object> events = authService.getSecurityEvents(severity, eventType, search, startDate, endDate, page, limit);
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @Operation(summary = "Soft delete security events (bulk)")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/security-events/delete")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteSecurityEvents(@RequestBody DeleteLogsRequest request,
                                                                               @AuthenticationPrincipal UserPrincipal currentUser) {
        String adminName = currentUser != null ? currentUser.getUsername() : "Administrator";
        int count = authService.softDeleteSecurityEvents(request.getIds(), adminName);
        return ResponseEntity.ok(ApiResponse.success(Map.of("deletedCount", count, "message", "Deleted " + count + " event(s) successfully")));
    }

    @Operation(summary = "Delete single security event by ID")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/security-events/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteSecurityEvent(@PathVariable("id") Long id,
                                                                               @AuthenticationPrincipal UserPrincipal currentUser) {
        String adminName = currentUser != null ? currentUser.getUsername() : "Administrator";
        int count = authService.softDeleteSecurityEvents(List.of(id), adminName);
        return ResponseEntity.ok(ApiResponse.success(Map.of("deletedCount", count, "message", "Event deleted successfully")));
    }

    @Operation(summary = "Get list of locked employee accounts")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/locked-employees")
    public ResponseEntity<ApiResponse<List<Employee>>> getLockedEmployees() {
        List<Employee> locked = authService.getLockedEmployees();
        return ResponseEntity.ok(ApiResponse.success(locked));
    }

    @Operation(summary = "Unlock a locked employee account")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/unlock-employee/{id}")
    public ResponseEntity<ApiResponse<Employee>> unlockEmployee(@PathVariable("id") Integer id,
                                                                @AuthenticationPrincipal UserPrincipal currentUser) {
        String adminName = currentUser != null ? currentUser.getUsername() : "Administrator";
        Employee employee = authService.unlockEmployee(id, adminName);
        return ResponseEntity.ok(ApiResponse.success(employee));
    }

    @Operation(summary = "Admin single employee password reset")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/admin-reset-password/{id}")
    public ResponseEntity<ApiResponse<Employee>> adminResetPassword(@PathVariable("id") Integer id,
                                                                    @Valid @RequestBody PasswordRequest request,
                                                                    @AuthenticationPrincipal UserPrincipal currentUser) {
        String adminName = currentUser != null ? currentUser.getUsername() : "Administrator";
        Employee employee = authService.adminResetPassword(id, request.getPassword(), adminName);
        return ResponseEntity.ok(ApiResponse.success(employee));
    }

    @Operation(summary = "Admin bulk password reset for all employees")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/admin-reset-all-passwords")
    public ResponseEntity<ApiResponse<Map<String, Object>>> adminResetAllPasswords(@RequestBody(required = false) PasswordRequest request,
                                                                                   @AuthenticationPrincipal UserPrincipal currentUser) {
        String newPassword = (request != null && request.getPassword() != null) ? request.getPassword() : "Password@123";
        String adminName = currentUser != null ? currentUser.getUsername() : "Administrator";
        Map<String, Object> result = authService.adminResetAllPasswords(newPassword, adminName);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Operation(summary = "Set internal password for direct login")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/set-password")
    public ResponseEntity<ApiResponse<Void>> setPassword(@Valid @RequestBody PasswordRequest request,
                                                         @AuthenticationPrincipal UserPrincipal currentUser) {
        authService.setPassword(currentUser.getId(), request.getPassword());
        return ResponseEntity.ok(ApiResponse.success());
    }

    @Operation(summary = "Skip set-password and email reminder to user")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/skip-set-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> skipSetPassword(@AuthenticationPrincipal UserPrincipal currentUser) {
        Integer userId = currentUser != null ? currentUser.getId() : null;
        String email = currentUser != null ? currentUser.getUsername() : "user@crm.com";
        Map<String, Object> result = authService.skipSetPasswordAndSendEmail(userId, email);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Operation(summary = "Record client security incident or violation event")
    @PostMapping("/security-event")
    public ResponseEntity<ApiResponse<SecurityEvent>> logSecurityEvent(@RequestBody SecurityEventRequest request,
                                                                       HttpServletRequest httpRequest) {
        SecurityEvent event = authService.logSecurityEvent(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success(event));
    }

    @Operation(summary = "Record user lifecycle event")
    @PostMapping("/lifecycle-event")
    public ResponseEntity<ApiResponse<Void>> logLifecycleEvent(@RequestBody LifecycleEventRequest request,
                                                               HttpServletRequest httpRequest) {
        authService.logLifecycleEvent(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @Operation(summary = "Get active concurrent sessions for current user")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/active-sessions")
    public ResponseEntity<ApiResponse<List<LoginLog>>> getActiveSessions(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<LoginLog> sessions = authService.getActiveSessions(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @Operation(summary = "Terminate specific session")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/terminate-session")
    public ResponseEntity<ApiResponse<Void>> terminateSession(@RequestBody SessionActionRequest request) {
        authService.terminateSession(request.getSessionId());
        return ResponseEntity.ok(ApiResponse.success());
    }

    @Operation(summary = "Terminate all other active sessions")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/terminate-other-sessions")
    public ResponseEntity<ApiResponse<Void>> terminateOtherSessions(@RequestBody SessionActionRequest request,
                                                                    @AuthenticationPrincipal UserPrincipal currentUser) {
        authService.terminateOtherSessions(currentUser.getId(), request.getCurrentSessionId());
        return ResponseEntity.ok(ApiResponse.success());
    }

    @Operation(summary = "Logout and terminate session")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody(required = false) SessionActionRequest request,
                                                    @AuthenticationPrincipal UserPrincipal currentUser,
                                                    HttpServletRequest httpRequest) {
        String sessionId = request != null ? request.getSessionId() : null;
        authService.logout(sessionId, currentUser, httpRequest);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
