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
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('login_logs') AND name = 'country')
                    BEGIN
                        ALTER TABLE login_logs ADD country NVARCHAR(50) NULL;
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
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'google_id')
                    BEGIN
                        ALTER TABLE employees ADD google_id NVARCHAR(100) NULL;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'is_2fa_enabled')
                    BEGIN
                        ALTER TABLE employees ADD is_2fa_enabled BIT NOT NULL CONSTRAINT DF_employees_is_2fa_enabled DEFAULT 1;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'is_region_restricted')
                    BEGIN
                        ALTER TABLE employees ADD is_region_restricted BIT NOT NULL CONSTRAINT DF_employees_is_region_restricted DEFAULT 0;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'allowed_regions')
                    BEGIN
                        ALTER TABLE employees ADD allowed_regions NVARCHAR(200) NOT NULL CONSTRAINT DF_employees_allowed_regions DEFAULT 'IN';
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'allowed_latitude')
                    BEGIN
                        ALTER TABLE employees ADD allowed_latitude FLOAT NULL;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'allowed_longitude')
                    BEGIN
                        ALTER TABLE employees ADD allowed_longitude FLOAT NULL;
                    END;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'allowed_radius_km')
                    BEGIN
                        ALTER TABLE employees ADD allowed_radius_km FLOAT NULL;
                    END;
                END
            """);

            // 4. Create trusted_devices table if missing
            safeExecute("""
                IF OBJECT_ID('trusted_devices', 'U') IS NULL
                BEGIN
                    CREATE TABLE trusted_devices (
                        id BIGINT IDENTITY(1,1) PRIMARY KEY,
                        employee_id INT NOT NULL,
                        device_fingerprint NVARCHAR(255) NOT NULL,
                        device_name NVARCHAR(150) NULL,
                        browser NVARCHAR(100) NULL,
                        operating_system NVARCHAR(100) NULL,
                        ip_address NVARCHAR(64) NULL,
                        created_at DATETIME2 DEFAULT SYSDATETIME(),
                        last_used_at DATETIME2 NULL
                    );
                    CREATE INDEX IX_trusted_devices_emp_fp ON trusted_devices(employee_id, device_fingerprint);
                END
            """);

            // 5. Create two_factor_verifications table if missing
            safeExecute("""
                IF OBJECT_ID('two_factor_verifications', 'U') IS NULL
                BEGIN
                    CREATE TABLE two_factor_verifications (
                        id BIGINT IDENTITY(1,1) PRIMARY KEY,
                        employee_id INT NOT NULL,
                        verification_token NVARCHAR(100) NOT NULL UNIQUE,
                        otp_code NVARCHAR(10) NOT NULL,
                        device_fingerprint NVARCHAR(255) NULL,
                        device_name NVARCHAR(150) NULL,
                        login_method NVARCHAR(50) NULL,
                        client_ip NVARCHAR(64) NULL,
                        session_id NVARCHAR(100) NULL,
                        is_new_user BIT DEFAULT 0,
                        is_verified BIT DEFAULT 0,
                        expires_at DATETIME2 NOT NULL,
                        created_at DATETIME2 DEFAULT SYSDATETIME()
                    );
                    CREATE INDEX IX_2fa_token ON two_factor_verifications(verification_token);
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
