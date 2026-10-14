package com.crm.fieldvisit.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Running Database Schema Auto-Migration for Security, Lockout & Audit Columns...");

        try {
            // Check if database is Microsoft SQL Server
            if (jdbcTemplate.getDataSource() != null) {
                try (var conn = jdbcTemplate.getDataSource().getConnection()) {
                    String dbProduct = conn.getMetaData().getDatabaseProductName().toLowerCase();
                    if (!dbProduct.contains("microsoft") && !dbProduct.contains("sql server")) {
                        log.info("PostgreSQL / Non-MSSQL database detected ({}). Running PostgreSQL DDL and initial provisioning...", dbProduct);
                        runPostgreSqlMigration();
                        return;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not check database product name: {}", e.getMessage());
        }

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

    private void runPostgreSqlMigration() {
        log.info("Starting PostgreSQL DDL auto-provisioning for CRM & Security tables...");

        // 1. Core organizational & Master tables
        safeExecute("""
            CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS designations (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                title VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS branches (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                city VARCHAR(100),
                state VARCHAR(100),
                address VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS principals (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(150) NOT NULL,
                country VARCHAR(100),
                contact_person VARCHAR(150),
                contact_email VARCHAR(150),
                contact_phone VARCHAR(50),
                description VARCHAR(4000),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS grade_fuel_rates (
                id SERIAL PRIMARY KEY,
                grade_code VARCHAR(50) UNIQUE NOT NULL,
                grade_name VARCHAR(100),
                fuel_rate NUMERIC(10,2) NOT NULL,
                two_wheeler_rate NUMERIC(10,2),
                four_wheeler_rate NUMERIC(10,2),
                effective_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS expense_heads (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                category VARCHAR(50),
                requires_km_calculation BOOLEAN DEFAULT FALSE,
                requires_approval BOOLEAN DEFAULT TRUE,
                requires_attachment BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS activity_types (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                category VARCHAR(50),
                description VARCHAR(4000),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS product_masters (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(150) NOT NULL,
                model_number VARCHAR(100),
                description VARCHAR(4000),
                unit_price NUMERIC(15,2),
                base_price NUMERIC(15,2),
                category VARCHAR(100),
                principal_id INTEGER,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS industries (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        // 2. Staff & Identity
        safeExecute("""
            CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
                employee_no VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(150) NOT NULL,
                gender VARCHAR(20) DEFAULT 'Male',
                dob DATE,
                department_id INTEGER,
                designation_id INTEGER,
                branch_id INTEGER,
                joining_date DATE,
                status VARCHAR(20) DEFAULT 'Active',
                mobile_no VARCHAR(20),
                email VARCHAR(150) UNIQUE NOT NULL,
                azure_ad_oid VARCHAR(100),
                google_id VARCHAR(100),
                is_2fa_enabled BOOLEAN DEFAULT TRUE,
                is_region_restricted BOOLEAN DEFAULT FALSE,
                allowed_regions VARCHAR(200) DEFAULT 'IN',
                allowed_latitude DOUBLE PRECISION,
                allowed_longitude DOUBLE PRECISION,
                allowed_radius_km DOUBLE PRECISION,
                password_hash VARCHAR(255) NOT NULL,
                is_password_set BOOLEAN DEFAULT TRUE,
                password_changed_at TIMESTAMP,
                is_locked BOOLEAN DEFAULT FALSE,
                lockout_expires_at TIMESTAMP,
                failed_login_attempts INTEGER DEFAULT 0,
                lockout_tier INTEGER DEFAULT 0,
                last_login_ip VARCHAR(64),
                last_login_time TIMESTAMP,
                role VARCHAR(30) DEFAULT 'SERVICE_ENG',
                grade VARCHAR(50) DEFAULT 'GRADE_B',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(100) DEFAULT 'SYSTEM',
                updated_by VARCHAR(100) DEFAULT 'SYSTEM'
            );
        """);

        // 3. Customers & Contacts
        safeExecute("""
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE,
                name VARCHAR(150) NOT NULL,
                customer_type VARCHAR(50) DEFAULT 'Direct',
                industry VARCHAR(100),
                city VARCHAR(100),
                state VARCHAR(100),
                address VARCHAR(255),
                contact_person_primary VARCHAR(150),
                primary_phone VARCHAR(50),
                primary_email VARCHAR(150),
                status VARCHAR(50) DEFAULT 'Active',
                source VARCHAR(100),
                notes VARCHAR(4000),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS customer_contacts (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER,
                name VARCHAR(150) NOT NULL,
                designation VARCHAR(100),
                mobile VARCHAR(50),
                phone VARCHAR(50),
                email VARCHAR(150),
                department VARCHAR(100),
                is_primary BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        // 4. Daily Visits & Expenses
        safeExecute("""
            CREATE TABLE IF NOT EXISTS daily_visits (
                id SERIAL PRIMARY KEY,
                visit_date DATE NOT NULL,
                employee_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                activity_type_id INTEGER,
                purpose VARCHAR(255),
                discussion_summary VARCHAR(4000),
                action_items VARCHAR(4000),
                status VARCHAR(50) DEFAULT 'Draft',
                odometer_start_km DOUBLE PRECISION,
                odometer_end_km DOUBLE PRECISION,
                total_km DOUBLE PRECISION,
                fuel_claim_amount NUMERIC(12,2),
                total_expense_amount NUMERIC(12,2),
                manager_comments VARCHAR(4000),
                approved_by_id INTEGER,
                approved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS visit_expenses (
                id SERIAL PRIMARY KEY,
                daily_visit_id INTEGER,
                expense_head_id INTEGER,
                amount NUMERIC(12,2) NOT NULL,
                remarks VARCHAR(4000),
                receipt_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        // 5. Commercial Deals (Opportunities) & Quotations
        safeExecute("""
            CREATE TABLE IF NOT EXISTS opportunities (
                id SERIAL PRIMARY KEY,
                opportunity_name VARCHAR(200) NOT NULL,
                customer_id INTEGER,
                assigned_employee_id INTEGER,
                product_id INTEGER,
                stage VARCHAR(50) DEFAULT 'Qualification',
                probability INTEGER DEFAULT 20,
                expected_value NUMERIC(15,2),
                closing_date DATE,
                notes VARCHAR(4000),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS opportunity_followups (
                id SERIAL PRIMARY KEY,
                opportunity_id INTEGER,
                followup_date DATE,
                action_plan VARCHAR(4000),
                contacted_person VARCHAR(150),
                status VARCHAR(50) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS quotations (
                id SERIAL PRIMARY KEY,
                quotation_number VARCHAR(100) UNIQUE NOT NULL,
                customer_id INTEGER,
                opportunity_id INTEGER,
                created_by_id INTEGER,
                total_amount NUMERIC(15,2),
                tax_amount NUMERIC(15,2),
                grand_total NUMERIC(15,2),
                status VARCHAR(50) DEFAULT 'Draft',
                valid_until DATE,
                terms_and_conditions VARCHAR(4000),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS quotation_items (
                id SERIAL PRIMARY KEY,
                quotation_id INTEGER,
                product_id INTEGER,
                quantity INTEGER DEFAULT 1,
                unit_price NUMERIC(15,2),
                discount_percent NUMERIC(5,2) DEFAULT 0,
                total_price NUMERIC(15,2)
            );
        """);

        // 6. Security, Login Logs & 2FA
        safeExecute("""
            CREATE TABLE IF NOT EXISTS login_logs (
                id BIGSERIAL PRIMARY KEY,
                employee_id INTEGER,
                employee_name VARCHAR(150),
                email VARCHAR(150) NOT NULL,
                login_method VARCHAR(20) DEFAULT 'Credential',
                login_status VARCHAR(20) DEFAULT 'Success',
                failure_reason VARCHAR(150),
                ip_address VARCHAR(64) DEFAULT '127.0.0.1',
                country VARCHAR(50) DEFAULT 'India',
                browser VARCHAR(100) DEFAULT 'Unknown',
                operating_system VARCHAR(100) DEFAULT 'Unknown',
                device_fingerprint VARCHAR(255),
                session_id VARCHAR(100),
                event_type VARCHAR(50),
                auto_provisioned BOOLEAN DEFAULT FALSE,
                is_active_session BOOLEAN DEFAULT TRUE,
                is_deleted BOOLEAN DEFAULT FALSE,
                details TEXT,
                session_duration BIGINT,
                login_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                logout_timestamp TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS security_events (
                id BIGSERIAL PRIMARY KEY,
                employee_id INTEGER,
                email VARCHAR(150),
                event_type VARCHAR(100) NOT NULL,
                severity VARCHAR(20) DEFAULT 'Medium',
                ip_address VARCHAR(64) DEFAULT '127.0.0.1',
                browser VARCHAR(100) DEFAULT 'Chrome/Edge',
                operating_system VARCHAR(100) DEFAULT 'Windows',
                device_fingerprint VARCHAR(255) DEFAULT 'unknown',
                page_url VARCHAR(255),
                is_deleted BOOLEAN DEFAULT FALSE,
                description VARCHAR(4000),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        safeExecute("""
            CREATE TABLE IF NOT EXISTS two_factor_verifications (
                id BIGSERIAL PRIMARY KEY,
                employee_id INTEGER NOT NULL,
                verification_token VARCHAR(100) NOT NULL UNIQUE,
                otp_code VARCHAR(10) NOT NULL,
                device_fingerprint VARCHAR(255),
                device_name VARCHAR(150),
                login_method VARCHAR(50),
                client_ip VARCHAR(64),
                session_id VARCHAR(100),
                is_new_user BOOLEAN DEFAULT FALSE,
                is_verified BOOLEAN DEFAULT FALSE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        log.info("PostgreSQL DDL table verification completed. Now checking initial seed state...");

        // 7. Seed Initial Enterprise CRM Data if employees table is empty
        try {
            Integer empCount = jdbcTemplate.queryForObject("SELECT COUNT(*)::int FROM employees", Integer.class);
            if (empCount == null || empCount == 0) {
                log.info("Seeding initial enterprise roles, master records, and staff accounts for PostgreSQL...");

                safeExecute("""
                    INSERT INTO departments (code, name) VALUES 
                    ('DEPT-SALES', 'Sales'),
                    ('DEPT-SERVICE', 'Service'),
                    ('DEPT-MGMT', 'Management')
                    ON CONFLICT (code) DO NOTHING;
                """);

                safeExecute("""
                    INSERT INTO designations (code, title) VALUES 
                    ('DESG-ADMIN', 'System Administrator'),
                    ('DESG-BM', 'Branch Manager'),
                    ('DESG-SE', 'Sales Executive'),
                    ('DESG-SENG', 'Service Engineer')
                    ON CONFLICT (code) DO NOTHING;
                """);

                safeExecute("""
                    INSERT INTO branches (code, name, city, state, is_active) VALUES 
                    ('BR-MUMBAI', 'Mumbai HQ', 'Mumbai', 'Maharashtra', true),
                    ('BR-BARODA', 'Baroda Branch', 'Vadodara', 'Gujarat', true),
                    ('BR-AHMEDABAD', 'Ahmedabad Branch', 'Ahmedabad', 'Gujarat', true),
                    ('BR-PUNE', 'Pune Industrial Area', 'Pune', 'Maharashtra', true),
                    ('BR-NASHIK', 'Nashik Hub', 'Nashik', 'Maharashtra', true)
                    ON CONFLICT (code) DO NOTHING;
                """);

                safeExecute("""
                    INSERT INTO grade_fuel_rates (grade_code, grade_name, fuel_rate, two_wheeler_rate, four_wheeler_rate, effective_date) VALUES 
                    ('GRADE_A', 'Grade A (Executive)', 8.00, 4.50, 8.00, CURRENT_DATE),
                    ('GRADE_B', 'Grade B (Field Engineer)', 6.50, 4.00, 6.50, CURRENT_DATE),
                    ('GRADE_C', 'Grade C (Standard Staff)', 5.50, 3.50, 5.50, CURRENT_DATE)
                    ON CONFLICT (grade_code) DO NOTHING;
                """);

                safeExecute("""
                    INSERT INTO expense_heads (code, name, category, requires_km_calculation, requires_approval, requires_attachment, is_active) VALUES 
                    ('EXP-FUEL', 'Odometer / Fuel Reimbursement', 'Travel', true, true, false, true),
                    ('EXP-HOTEL', 'Hotel Accommodation', 'Lodging', false, true, true, true),
                    ('EXP-MEAL', 'Client Dinner & Meals', 'Food', false, true, false, true),
                    ('EXP-TOLL', 'Highway Toll & Parking', 'Travel', false, true, true, true),
                    ('EXP-TRANSIT', 'Local Transit / Taxi', 'Travel', false, true, false, true)
                    ON CONFLICT (code) DO NOTHING;
                """);

                safeExecute("""
                    INSERT INTO activity_types (code, name, category, description, is_active) VALUES 
                    ('ACT-DEMO', 'Product Demonstration', 'Sales', 'Live machine cutting and software demo on site', true),
                    ('ACT-MAINT', 'Routine Maintenance', 'Service', 'Scheduled periodic maintenance and calibration', true),
                    ('ACT-BD', 'Machine Breakdown Emergency', 'Service', 'Emergency breakdown diagnosis and restoration', true),
                    ('ACT-FOLLOW', 'Sales Commercial Follow-up', 'Sales', 'Price quotation negotiation and commercial closing', true),
                    ('ACT-PITCH', 'New Client Executive Pitch', 'Sales', 'Executive discovery meeting with management', true)
                    ON CONFLICT (code) DO NOTHING;
                """);

                safeExecute("""
                    INSERT INTO customers (code, name, customer_type, industry, city, state, contact_person_primary, primary_phone, primary_email, status) VALUES 
                    ('CUST-001', 'Bharat Forge Ltd', 'Tier-1', 'Automotive', 'Pune', 'Maharashtra', 'Kishore Joshi', '9823012345', 'kishore.joshi@bharatforge.com', 'Active'),
                    ('CUST-002', 'Tata Motors Ltd', 'OEM', 'Automotive', 'Pune', 'Maharashtra', 'Sunil Deshmukh', '9823067890', 'sunil.d@tatamotors.com', 'Active'),
                    ('CUST-003', 'Larsen & Toubro Heavy Eng', 'OEM', 'Infrastructure', 'Mumbai', 'Maharashtra', 'Praveen Mehta', '9820054321', 'praveen.mehta@larsentoubro.com', 'Active'),
                    ('CUST-004', 'Mahindra Heavy Industries', 'Tier-1', 'Manufacturing', 'Mumbai', 'Maharashtra', 'Anand Kulkarni', '9821198765', 'anand.k@mahindra.com', 'Active')
                    ON CONFLICT (code) DO NOTHING;
                """);

                safeExecute("""
                    INSERT INTO product_masters (code, name, model_number, description, unit_price, base_price, category, is_active) VALUES 
                    ('PRD-TRUMPF-3030', 'Trumpf TruLaser 3030 Fiber 6kW', 'TruLaser-3030-F6', '2D Laser cutting machine for high precision sheet metal fabrication', 18500000.00, 17500000.00, 'Laser Cutting', true),
                    ('PRD-MAZAK-QT250', 'Mazak Quick Turn 250 CNC Lathe', 'QT-250-MAZATROL', 'High efficiency multi-tasking CNC lathe for precision turned components', 6500000.00, 6200000.00, 'CNC Turning', true),
                    ('PRD-AMADA-HRB', 'Amada HRB-1003 Hydraulic Press Brake', 'HRB-1003', '100-ton hydraulic sheet metal bending press brake with CNC crowning', 4800000.00, 4500000.00, 'Bending Machinery', true),
                    ('PRD-HAAS-VF2', 'Haas VF-2 Vertical Machining Center', 'VF-2', 'American made 3-axis CNC vertical milling machine with 30hp spindle', 5200000.00, 4900000.00, 'Milling Centers', true)
                    ON CONFLICT (code) DO NOTHING;
                """);

                // Encode default password "Password@123"
                String hashedPwd = passwordEncoder.encode("Password@123");

                String empInsert = """
                    INSERT INTO employees (
                        employee_no, name, email, password_hash, role, grade, 
                        department_id, designation_id, branch_id, joining_date, 
                        mobile_no, status, is_2fa_enabled, is_password_set, is_locked, 
                        failed_login_attempts, lockout_tier
                    ) VALUES 
                    ('EMP-001', 'Administrator', 'admin@crm.com', ?, 'ADMIN', 'GRADE_A', 3, 1, 1, CURRENT_DATE, '9820011001', 'Active', false, true, false, 0, 0),
                    ('EMP-002', 'Rajesh Patel', 'rajesh@crm.com', ?, 'MANAGER', 'GRADE_A', 3, 2, 1, CURRENT_DATE, '9820022002', 'Active', false, true, false, 0, 0),
                    ('EMP-003', 'Amit Sharma', 'amit@crm.com', ?, 'SALES_EXEC', 'GRADE_B', 1, 3, 1, CURRENT_DATE, '9820033003', 'Active', false, true, false, 0, 0),
                    ('EMP-004', 'Suresh Choudhary', 'suresh@crm.com', ?, 'SERVICE_ENG', 'GRADE_B', 2, 4, 1, CURRENT_DATE, '9820044004', 'Active', false, true, false, 0, 0)
                    ON CONFLICT (email) DO NOTHING;
                """;

                jdbcTemplate.update(empInsert, hashedPwd, hashedPwd, hashedPwd, hashedPwd);
                log.info("PostgreSQL initial enterprise seed completed successfully with Admin, Manager, Sales, and Service accounts!");
            }
        } catch (Exception e) {
            log.warn("PostgreSQL seeding note: {}", e.getMessage());
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
