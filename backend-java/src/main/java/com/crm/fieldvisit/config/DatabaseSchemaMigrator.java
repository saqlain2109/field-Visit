package com.crm.fieldvisit.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Running Database Schema Auto-Migration for Security, Lockout & Audit Columns...");

        try {
            // 1. Check & Alter login_logs table
            safeExecute("""
                IF OBJECT_ID('login_logs', 'U') IS NOT NULL
                BEGIN
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('login_logs') AND name = 'is_deleted')
                    BEGIN
                        ALTER TABLE login_logs ADD is_deleted BIT NOT NULL CONSTRAINT DF_login_logs_is_deleted DEFAULT 0;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('login_logs') AND name = 'is_active_session')
                    BEGIN
                        ALTER TABLE login_logs ADD is_active_session BIT NOT NULL CONSTRAINT DF_login_logs_is_active_session DEFAULT 1;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('login_logs') AND name = 'auto_provisioned')
                    BEGIN
                        ALTER TABLE login_logs ADD auto_provisioned BIT NOT NULL CONSTRAINT DF_login_logs_auto_provisioned DEFAULT 0;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('login_logs') AND name = 'device_fingerprint')
                    BEGIN
                        ALTER TABLE login_logs ADD device_fingerprint NVARCHAR(255) NULL;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('login_logs') AND name = 'session_id')
                    BEGIN
                        ALTER TABLE login_logs ADD session_id NVARCHAR(100) NULL;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('login_logs') AND name = 'event_type')
                    BEGIN
                        ALTER TABLE login_logs ADD event_type NVARCHAR(50) NULL;
                    END;
                END
            """);

            // 2. Check & Alter security_events table
            safeExecute("""
                IF OBJECT_ID('security_events', 'U') IS NOT NULL
                BEGIN
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('security_events') AND name = 'is_deleted')
                    BEGIN
                        ALTER TABLE security_events ADD is_deleted BIT NOT NULL CONSTRAINT DF_security_events_is_deleted DEFAULT 0;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('security_events') AND name = 'page_url')
                    BEGIN
                        ALTER TABLE security_events ADD page_url NVARCHAR(255) NULL;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('security_events') AND name = 'device_fingerprint')
                    BEGIN
                        ALTER TABLE security_events ADD device_fingerprint NVARCHAR(255) NULL;
                    END;
                END
            """);

            // 3. Check & Alter employees table
            safeExecute("""
                IF OBJECT_ID('employees', 'U') IS NOT NULL
                BEGIN
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'is_password_set')
                    BEGIN
                        ALTER TABLE employees ADD is_password_set BIT NOT NULL CONSTRAINT DF_employees_is_password_set DEFAULT 0;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'is_locked')
                    BEGIN
                        ALTER TABLE employees ADD is_locked BIT NOT NULL CONSTRAINT DF_employees_is_locked DEFAULT 0;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'failed_login_attempts')
                    BEGIN
                        ALTER TABLE employees ADD failed_login_attempts INT NOT NULL CONSTRAINT DF_employees_failed_login_attempts DEFAULT 0;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'lockout_tier')
                    BEGIN
                        ALTER TABLE employees ADD lockout_tier INT NOT NULL CONSTRAINT DF_employees_lockout_tier DEFAULT 0;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'lockout_expires_at')
                    BEGIN
                        ALTER TABLE employees ADD lockout_expires_at DATETIME2 NULL;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'password_changed_at')
                    BEGIN
                        ALTER TABLE employees ADD password_changed_at DATETIME2 NULL;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'last_login_ip')
                    BEGIN
                        ALTER TABLE employees ADD last_login_ip NVARCHAR(64) NULL;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'last_login_time')
                    BEGIN
                        ALTER TABLE employees ADD last_login_time DATETIME2 NULL;
                    END;
                END
            """);

            log.info("Database Schema Auto-Migration completed successfully.");
        } catch (Exception e) {
            log.warn("Database schema auto-migration encountered a non-critical notice: {}", e.getMessage());
        }
    }

    private void safeExecute(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception e) {
            log.warn("Safe SQL execution note: {}", e.getMessage());
        }
    }
}
