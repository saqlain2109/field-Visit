package com.crm.fieldvisit.controller;

import com.crm.fieldvisit.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Tag(name = "Health & Database Diagnostics")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    @Operation(summary = "System Health Check")
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("status", "UP");
        data.put("timestamp", Instant.now().toString());
        data.put("service", "Enterprise Field Visit & CRM (Spring Boot Java)");
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @Operation(summary = "Test Microsoft SQL Server Database Connection")
    @GetMapping("/db/test-connection")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testDatabaseConnection() {
        long startTime = System.currentTimeMillis();
        Map<String, Object> details = new LinkedHashMap<>();

        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            String prodName = metaData.getDatabaseProductName().toLowerCase();
            boolean isPostgres = prodName.contains("postgres");

            String dbVersion = isPostgres 
                    ? jdbcTemplate.queryForObject("SELECT version()", String.class)
                    : jdbcTemplate.queryForObject("SELECT @@VERSION", String.class);
            String dbName = isPostgres
                    ? jdbcTemplate.queryForObject("SELECT current_database()", String.class)
                    : jdbcTemplate.queryForObject("SELECT DB_NAME()", String.class);
            Integer tableCount = isPostgres
                    ? jdbcTemplate.queryForObject("SELECT COUNT(*)::int FROM information_schema.tables WHERE table_schema = 'public'", Integer.class)
                    : jdbcTemplate.queryForObject("SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0", Integer.class);

            long latencyMs = System.currentTimeMillis() - startTime;

            details.put("status", "CONNECTED");
            details.put("database", dbName);
            details.put("databaseProductName", metaData.getDatabaseProductName());
            details.put("databaseProductVersion", metaData.getDatabaseProductVersion());
            details.put("driverName", metaData.getDriverName());
            details.put("user", metaData.getUserName());
            details.put("activeUserTables", tableCount);
            details.put("queryLatencyMs", latencyMs);
            details.put("serverVersionDetails", dbVersion != null && dbVersion.length() > 60 ? dbVersion.substring(0, 60) + "..." : dbVersion);

            return ResponseEntity.ok(ApiResponse.success("Successfully connected to " + metaData.getDatabaseProductName(), details));
        } catch (Exception e) {
            details.put("status", "DISCONNECTED");
            details.put("error", e.getMessage());
            return ResponseEntity.status(503)
                    .body(ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .statusCode(503)
                            .message("Failed to connect to MS SQL database: " + e.getMessage())
                            .data(details)
                            .timestamp(Instant.now().toString())
                            .build());
        }
    }

    @Operation(summary = "Redirect to Swagger UI")
    @GetMapping("/docs")
    public ResponseEntity<Void> redirectToDocs() {
        return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                .header("Location", "/swagger-ui/index.html")
                .build();
    }
}
