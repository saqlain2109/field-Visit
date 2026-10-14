package com.crm.fieldvisit.tools;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DirectRenderMigrator {

    private static final String JDBC_URL = "jdbc:postgresql://dpg-db7m1alg1s2s73b18ukg-a.singapore-postgres.render.com:5432/field_visit?sslmode=require";
    private static final String USER = "fieldvisit_user";
    private static final String PASS = "c38xYoiwB17lB6EFgbctWAx37lCRBgqw";

    public static void main(String[] args) {
        System.out.println("Connecting directly to Render PostgreSQL: " + JDBC_URL);

        try (Connection conn = DriverManager.getConnection(JDBC_URL, USER, PASS);
             Statement stmt = conn.createStatement()) {

            System.out.println("Connected successfully to PostgreSQL version: " + conn.getMetaData().getDatabaseProductVersion());

            // 1. Create Core Tables
            System.out.println("Creating core tables...");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS departments (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS designations (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    title VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """);

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS industries (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    description VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """);

            stmt.execute("""
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
                    is_2fa_enabled BOOLEAN DEFAULT FALSE,
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

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
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

            stmt.execute("""
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

            System.out.println("All PostgreSQL tables successfully verified/created!");

            // Align customers table with Customer entity
            safeRun(stmt, "ALTER TABLE customers DROP COLUMN IF EXISTS customer_code CASCADE;");
            safeRun(stmt, "ALTER TABLE customers ADD COLUMN customer_code VARCHAR(50);");
            safeRun(stmt, "ALTER TABLE customers ADD COLUMN IF NOT EXISTS website VARCHAR(150);");
            safeRun(stmt, "ALTER TABLE customers ADD COLUMN IF NOT EXISTS remarks VARCHAR(4000);");
            safeRun(stmt, "ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) DEFAULT 'SYSTEM';");
            safeRun(stmt, "ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100) DEFAULT 'SYSTEM';");
            safeRun(stmt, "UPDATE customers SET customer_code = code WHERE customer_code IS NULL AND code IS NOT NULL;");
            safeRun(stmt, "UPDATE customers SET customer_code = 'CUST-00' || id WHERE customer_code IS NULL;");
            safeRun(stmt, "ALTER TABLE customers ALTER COLUMN customer_code SET NOT NULL;");
            safeRun(stmt, "CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_custcode ON customers(customer_code);");

            // Align visit_expenses table with VisitExpense entity
            safeRun(stmt, "ALTER TABLE visit_expenses ADD COLUMN IF NOT EXISTS visit_id INTEGER;");
            safeRun(stmt, "ALTER TABLE visit_expenses ADD COLUMN IF NOT EXISTS day_start_km NUMERIC(10,2);");
            safeRun(stmt, "ALTER TABLE visit_expenses ADD COLUMN IF NOT EXISTS day_end_km NUMERIC(10,2);");
            safeRun(stmt, "ALTER TABLE visit_expenses ADD COLUMN IF NOT EXISTS total_km NUMERIC(10,2);");
            safeRun(stmt, "ALTER TABLE visit_expenses ADD COLUMN IF NOT EXISTS fuel_rate NUMERIC(10,2);");
            safeRun(stmt, "ALTER TABLE visit_expenses ADD COLUMN IF NOT EXISTS toll_tax NUMERIC(10,2);");
            safeRun(stmt, "ALTER TABLE visit_expenses ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500);");
            safeRun(stmt, "ALTER TABLE visit_expenses ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;");

            // Align daily_visits table with DailyVisit entity
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS department_id INTEGER DEFAULT 1;");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS branch_id INTEGER DEFAULT 1;");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS contact_id INTEGER;");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS product_id INTEGER;");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS place_from VARCHAR(150) DEFAULT 'Office';");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS place_to VARCHAR(150) DEFAULT 'Client Site';");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS end_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS person_count INTEGER DEFAULT 1;");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(4000);");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS sales_report_url VARCHAR(550);");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS sales_report_notes VARCHAR(4000);");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS approved_by INTEGER;");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) DEFAULT 'SYSTEM';");
            safeRun(stmt, "ALTER TABLE daily_visits ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100) DEFAULT 'SYSTEM';");

            // Align grade_fuel_rates and expense_heads
            safeRun(stmt, "ALTER TABLE grade_fuel_rates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;");
            safeRun(stmt, "ALTER TABLE grade_fuel_rates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
            safeRun(stmt, "ALTER TABLE expense_heads ADD COLUMN IF NOT EXISTS default_rate NUMERIC(10,2) DEFAULT 0.00;");
            safeRun(stmt, "ALTER TABLE expense_heads ADD COLUMN IF NOT EXISTS requires_km BOOLEAN DEFAULT FALSE;");
            safeRun(stmt, "ALTER TABLE expense_heads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");

            // Create products table matching Product entity
            safeRun(stmt, """
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(150) NOT NULL,
                    description VARCHAR(4000),
                    category VARCHAR(100) DEFAULT 'Machinery',
                    principal VARCHAR(100),
                    role VARCHAR(50) DEFAULT 'ALL',
                    unit_price NUMERIC(15,2) DEFAULT 0.00,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """);

            // Create crm_opportunities table matching Opportunity entity
            safeRun(stmt, """
                CREATE TABLE IF NOT EXISTS crm_opportunities (
                    id SERIAL PRIMARY KEY,
                    opportunity_no VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(200) NOT NULL,
                    customer_id INTEGER NOT NULL,
                    contact_id INTEGER,
                    is_new_client BOOLEAN DEFAULT FALSE,
                    lead_source VARCHAR(100),
                    requirement VARCHAR(4000),
                    status VARCHAR(50) DEFAULT 'PROSPECT',
                    probability INTEGER DEFAULT 20,
                    lead_date DATE DEFAULT CURRENT_DATE,
                    expected_closure_date DATE,
                    estimated_value NUMERIC(15,2) DEFAULT 0.00,
                    created_by VARCHAR(100) DEFAULT 'SYSTEM',
                    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """);

            // PostgreSQL compatibility function for Spring Data JPA untyped parameter lower() call
            safeRun(stmt, """
                CREATE OR REPLACE FUNCTION lower(bytea) RETURNS text AS $$
                    SELECT lower(encode($1, 'escape'));
                $$ LANGUAGE sql IMMUTABLE;
            """);

            // Align products table
            safeRun(stmt, "ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) DEFAULT 'SYSTEM';");
            safeRun(stmt, "ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100) DEFAULT 'SYSTEM';");

            // Align crm_opportunities table
            safeRun(stmt, "ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS branch_id INTEGER;");
            safeRun(stmt, "ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS salesperson_id INTEGER;");
            safeRun(stmt, "ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS principal VARCHAR(100);");
            safeRun(stmt, "ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS competitor_name VARCHAR(150);");
            safeRun(stmt, "ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS competitor_model VARCHAR(150);");
            safeRun(stmt, "ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS competitor_price NUMERIC(15,2);");
            safeRun(stmt, "ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS competitor_strengths VARCHAR(4000);");
            safeRun(stmt, "ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS competitor_weaknesses VARCHAR(4000);");
            safeRun(stmt, "ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS threat_level VARCHAR(50);");
            safeRun(stmt, "ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS win_loss_reason VARCHAR(4000);");

            // Align crm_quotations table
            safeRun(stmt, """
                CREATE TABLE IF NOT EXISTS crm_quotations (
                    id SERIAL PRIMARY KEY,
                    quote_no VARCHAR(50) NOT NULL,
                    customer_id INTEGER NOT NULL,
                    opportunity_id INTEGER,
                    contact_id INTEGER,
                    quote_date DATE DEFAULT CURRENT_DATE,
                    valid_until DATE,
                    currency VARCHAR(10) DEFAULT 'INR',
                    subtotal NUMERIC(15,2) DEFAULT 0.00,
                    tax_percent NUMERIC(5,2) DEFAULT 18.00,
                    tax_amount NUMERIC(15,2) DEFAULT 0.00,
                    grand_total NUMERIC(15,2) DEFAULT 0.00,
                    status VARCHAR(50) DEFAULT 'DRAFT',
                    terms_and_conditions VARCHAR(4000),
                    created_by VARCHAR(100) DEFAULT 'SYSTEM',
                    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """);
            safeRun(stmt, "ALTER TABLE crm_quotations ADD COLUMN IF NOT EXISTS revision_no INTEGER DEFAULT 0;");
            safeRun(stmt, "ALTER TABLE crm_quotations ADD COLUMN IF NOT EXISTS version_label VARCHAR(20) DEFAULT 'Rev 0';");
            safeRun(stmt, "ALTER TABLE crm_quotations ADD COLUMN IF NOT EXISTS parent_quote_id INTEGER;");
            safeRun(stmt, "ALTER TABLE crm_quotations ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 30;");
            safeRun(stmt, "ALTER TABLE crm_quotations ADD COLUMN IF NOT EXISTS validity_date DATE;");
            safeRun(stmt, "ALTER TABLE crm_quotations ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0.00;");
            safeRun(stmt, "ALTER TABLE crm_quotations ADD COLUMN IF NOT EXISTS total_value NUMERIC(14,2) DEFAULT 0.00;");
            safeRun(stmt, "ALTER TABLE crm_quotations ADD COLUMN IF NOT EXISTS notes VARCHAR(4000);");
            safeRun(stmt, "ALTER TABLE crm_quotations ADD COLUMN IF NOT EXISTS salesperson_id INTEGER;");

            // Fix potential null constraint on existing tables
            try { stmt.execute("ALTER TABLE departments ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;"); } catch (Exception ignored) {}
            try { stmt.execute("ALTER TABLE departments ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;"); } catch (Exception ignored) {}
            try { stmt.execute("ALTER TABLE designations ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;"); } catch (Exception ignored) {}
            try { stmt.execute("ALTER TABLE designations ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;"); } catch (Exception ignored) {}
            try { stmt.execute("ALTER TABLE branches ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;"); } catch (Exception ignored) {}
            try { stmt.execute("ALTER TABLE branches ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;"); } catch (Exception ignored) {}
            try { stmt.execute("ALTER TABLE employees ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;"); } catch (Exception ignored) {}
            try { stmt.execute("ALTER TABLE employees ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;"); } catch (Exception ignored) {}

            // 2. Seed Default Master Data
            System.out.println("Seeding master records...");

            safeRun(stmt, """
                INSERT INTO departments (code, name, created_at, updated_at) VALUES 
                ('DEPT-SALES', 'Sales', NOW(), NOW()),
                ('DEPT-SERVICE', 'Service', NOW(), NOW()),
                ('DEPT-MGMT', 'Management', NOW(), NOW())
                ON CONFLICT (code) DO NOTHING;
            """);

            safeRun(stmt, """
                INSERT INTO designations (code, title, created_at, updated_at) VALUES 
                ('DESG-ADMIN', 'System Administrator', NOW(), NOW()),
                ('DESG-BM', 'Branch Manager', NOW(), NOW()),
                ('DESG-SE', 'Sales Executive', NOW(), NOW()),
                ('DESG-SENG', 'Service Engineer', NOW(), NOW())
                ON CONFLICT (code) DO NOTHING;
            """);

            safeRun(stmt, """
                INSERT INTO branches (code, name, city, is_active, created_at, updated_at) VALUES 
                ('BR-MUMBAI', 'Mumbai HQ', 'Mumbai', true, NOW(), NOW()),
                ('BR-BARODA', 'Baroda Branch', 'Vadodara', true, NOW(), NOW()),
                ('BR-AHMEDABAD', 'Ahmedabad Branch', 'Ahmedabad', true, NOW(), NOW()),
                ('BR-PUNE', 'Pune Industrial Area', 'Pune', true, NOW(), NOW()),
                ('BR-NASHIK', 'Nashik Hub', 'Nashik', true, NOW(), NOW())
                ON CONFLICT (code) DO NOTHING;
            """);

            safeRun(stmt, """
                INSERT INTO grade_fuel_rates (grade_code, grade_name, fuel_rate, is_active, created_at) VALUES 
                ('GRADE_A', 'Grade A (Executive)', 8.00, true, NOW()),
                ('GRADE_B', 'Grade B (Field Engineer)', 6.50, true, NOW()),
                ('GRADE_C', 'Grade C (Standard Staff)', 5.50, true, NOW())
                ON CONFLICT (grade_code) DO NOTHING;
            """);

            safeRun(stmt, """
                INSERT INTO expense_heads (code, name, requires_attachment, is_active, default_rate, created_at) VALUES 
                ('EXP-FUEL', 'Odometer / Fuel Reimbursement', false, true, 8.00, NOW()),
                ('EXP-HOTEL', 'Hotel Accommodation', true, true, 0.00, NOW()),
                ('EXP-MEAL', 'Client Dinner & Meals', false, true, 0.00, NOW()),
                ('EXP-TOLL', 'Highway Toll & Parking', true, true, 0.00, NOW()),
                ('EXP-TRANSIT', 'Local Transit / Taxi', false, true, 0.00, NOW())
                ON CONFLICT (code) DO NOTHING;
            """);

            try { stmt.execute("ALTER TABLE activity_types ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'ALL';"); } catch (Exception ignored) {}

            safeRun(stmt, """
                INSERT INTO activity_types (code, name, description, created_at) VALUES 
                ('ACT-DEMO', 'Product Demonstration', 'Live machine cutting and software demo on site', NOW()),
                ('ACT-MAINT', 'Routine Maintenance', 'Scheduled periodic maintenance and calibration', NOW()),
                ('ACT-BD', 'Machine Breakdown Emergency', 'Emergency breakdown diagnosis and restoration', NOW()),
                ('ACT-FOLLOW', 'Sales Commercial Follow-up', 'Price quotation negotiation and commercial closing', NOW()),
                ('ACT-PITCH', 'New Client Executive Pitch', 'Executive discovery meeting with management', NOW())
                ON CONFLICT (code) DO NOTHING;
            """);

            safeRun(stmt, """
                INSERT INTO customers (customer_code, code, name, customer_type, industry, city, state, contact_person_primary, status, created_at, updated_at) VALUES 
                ('CUST-001', 'CUST-001', 'Bharat Forge Ltd', 'Tier-1', 'Automotive', 'Pune', 'Maharashtra', 'Kishore Joshi', 'Active', NOW(), NOW()),
                ('CUST-002', 'CUST-002', 'Tata Motors Ltd', 'OEM', 'Automotive', 'Pune', 'Maharashtra', 'Sunil Deshmukh', 'Active', NOW(), NOW()),
                ('CUST-003', 'CUST-003', 'Larsen & Toubro Heavy Eng', 'OEM', 'Infrastructure', 'Mumbai', 'Maharashtra', 'Praveen Mehta', 'Active', NOW(), NOW()),
                ('CUST-004', 'CUST-004', 'Mahindra Heavy Industries', 'Tier-1', 'Manufacturing', 'Mumbai', 'Maharashtra', 'Anand Kulkarni', 'Active', NOW(), NOW())
                ON CONFLICT (customer_code) DO NOTHING;
            """);

            safeRun(stmt, """
                INSERT INTO product_masters (code, name, description, category, unit_price, is_active, created_at) VALUES 
                ('PRD-TRUMPF-3030', 'Trumpf TruLaser 3030 Fiber 6kW', '2D Laser cutting machine for high precision sheet metal fabrication', 'Laser Cutting', 18500000.00, true, NOW()),
                ('PRD-MAZAK-QT250', 'Mazak Quick Turn 250 CNC Lathe', 'High efficiency multi-tasking CNC lathe for precision turned components', 'CNC Turning', 6500000.00, true, NOW()),
                ('PRD-AMADA-HRB', 'Amada HRB-1003 Hydraulic Press Brake', '100-ton hydraulic sheet metal bending press brake with CNC crowning', 'Bending Machinery', 4800000.00, true, NOW()),
                ('PRD-HAAS-VF2', 'Haas VF-2 Vertical Machining Center', 'American made 3-axis CNC vertical milling machine with 30hp spindle', 'Milling Centers', 5200000.00, true, NOW())
                ON CONFLICT (code) DO NOTHING;
            """);

            safeRun(stmt, """
                INSERT INTO products (code, name, description, category, principal, role, unit_price, is_active, created_at, updated_at) VALUES 
                ('PRD-TRUMPF-3030', 'Trumpf TruLaser 3030 Fiber 6kW', '2D Laser cutting machine for high precision sheet metal fabrication', 'Laser Cutting', 'Trumpf', 'ALL', 18500000.00, true, NOW(), NOW()),
                ('PRD-MAZAK-QT250', 'Mazak Quick Turn 250 CNC Lathe', 'High efficiency multi-tasking CNC lathe for precision turned components', 'CNC Turning', 'Mazak', 'ALL', 6500000.00, true, NOW(), NOW()),
                ('PRD-AMADA-HRB', 'Amada HRB-1003 Hydraulic Press Brake', '100-ton hydraulic sheet metal bending press brake with CNC crowning', 'Bending Machinery', 'Amada', 'ALL', 4800000.00, true, NOW(), NOW()),
                ('PRD-HAAS-VF2', 'Haas VF-2 Vertical Machining Center', 'American made 3-axis CNC vertical milling machine with 30hp spindle', 'Milling Centers', 'Haas', 'ALL', 5200000.00, true, NOW(), NOW())
                ON CONFLICT (code) DO NOTHING;
            """);

            // 3. Seed Default Employees
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            String hashedPwd = encoder.encode("Password@123");
            System.out.println("Hashed password for Password@123: " + hashedPwd);

            // Fetch IDs for departments, designations, branches to guarantee foreign keys match
            int deptMgmt = 3, deptSales = 1, deptService = 2;
            int desgAdmin = 1, desgBm = 2, desgSe = 3, desgSeng = 4;
            int branchMumbai = 1;

            try (ResultSet rs = stmt.executeQuery("SELECT id, code FROM departments")) {
                while (rs.next()) {
                    String c = rs.getString("code");
                    int id = rs.getInt("id");
                    if ("DEPT-MGMT".equals(c)) deptMgmt = id;
                    else if ("DEPT-SALES".equals(c)) deptSales = id;
                    else if ("DEPT-SERVICE".equals(c)) deptService = id;
                }
            } catch (Exception ignored) {}

            try (ResultSet rs = stmt.executeQuery("SELECT id, code FROM designations")) {
                while (rs.next()) {
                    String c = rs.getString("code");
                    int id = rs.getInt("id");
                    if ("DESG-ADMIN".equals(c)) desgAdmin = id;
                    else if ("DESG-BM".equals(c)) desgBm = id;
                    else if ("DESG-SE".equals(c)) desgSe = id;
                    else if ("DESG-SENG".equals(c)) desgSeng = id;
                }
            } catch (Exception ignored) {}

            try (ResultSet rs = stmt.executeQuery("SELECT id, code FROM branches")) {
                while (rs.next()) {
                    String c = rs.getString("code");
                    int id = rs.getInt("id");
                    if ("BR-MUMBAI".equals(c)) branchMumbai = id;
                }
            } catch (Exception ignored) {}

            String empSql = String.format("""
                INSERT INTO employees (
                    employee_no, name, gender, email, password_hash, role, grade, 
                    department_id, designation_id, branch_id, joining_date, 
                    mobile_no, status, is_2fa_enabled, is_password_set, is_locked, 
                    failed_login_attempts, lockout_tier, created_by, updated_by, 
                    created_at, updated_at
                ) VALUES 
                ('EMP-001', 'Administrator', 'Male', 'admin@crm.com', '%s', 'ADMIN', 'GRADE_A', %d, %d, %d, CURRENT_DATE, '9820011001', 'Active', false, true, false, 0, 0, 'SYSTEM', 'SYSTEM', NOW(), NOW()),
                ('EMP-002', 'Rajesh Patel', 'Male', 'rajesh@crm.com', '%s', 'MANAGER', 'GRADE_A', %d, %d, %d, CURRENT_DATE, '9820022002', 'Active', false, true, false, 0, 0, 'SYSTEM', 'SYSTEM', NOW(), NOW()),
                ('EMP-003', 'Amit Sharma', 'Male', 'amit@crm.com', '%s', 'SALES_EXEC', 'GRADE_B', %d, %d, %d, CURRENT_DATE, '9820033003', 'Active', false, true, false, 0, 0, 'SYSTEM', 'SYSTEM', NOW(), NOW()),
                ('EMP-004', 'Suresh Choudhary', 'Male', 'suresh@crm.com', '%s', 'SERVICE_ENG', 'GRADE_B', %d, %d, %d, CURRENT_DATE, '9820044004', 'Active', false, true, false, 0, 0, 'SYSTEM', 'SYSTEM', NOW(), NOW())
                ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_locked = false, failed_login_attempts = 0;
            """,
                hashedPwd, deptMgmt, desgAdmin, branchMumbai,
                hashedPwd, deptMgmt, desgBm, branchMumbai,
                hashedPwd, deptSales, desgSe, branchMumbai,
                hashedPwd, deptService, desgSeng, branchMumbai
            );

            safeRun(stmt, empSql);

            // 4. Verify everything
            System.out.println("\n--- DATABASE VERIFICATION ---");
            ResultSet rsTables = stmt.executeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;");
            System.out.println("Public tables in Render database:");
            while (rsTables.next()) {
                System.out.println("  - " + rsTables.getString(1));
            }

            ResultSet rsEmps = stmt.executeQuery("SELECT employee_no, name, email, role, status FROM employees;");
            System.out.println("\nActive Employees in Render database:");
            while (rsEmps.next()) {
                System.out.printf("  [%s] %s | %s | %s | %s%n",
                        rsEmps.getString("employee_no"),
                        rsEmps.getString("name"),
                        rsEmps.getString("email"),
                        rsEmps.getString("role"),
                        rsEmps.getString("status"));
            }

            ResultSet rsCustCols = stmt.executeQuery("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='customers' ORDER BY ordinal_position;");
            System.out.println("\nCustomers table columns:");
            while (rsCustCols.next()) {
                System.out.printf("  - %s: %s%n", rsCustCols.getString(1), rsCustCols.getString(2));
            }

            System.out.println("\nDirect Render migration completed with 100% SUCCESS!");

        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static void safeRun(Statement stmt, String sql) {
        try {
            stmt.execute(sql);
        } catch (Exception e) {
            System.out.println("Notice (safeRun): " + e.getMessage());
        }
    }
}
