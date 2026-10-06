package com.crm.fieldvisit.service;

import com.crm.fieldvisit.entity.*;
import com.crm.fieldvisit.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final DepartmentRepository deptRepo;
    private final DesignationRepository desgRepo;
    private final BranchRepository branchRepo;
    private final ProductRepository productRepo;
    private final ActivityTypeRepository actRepo;
    private final ExpenseHeadRepository expHeadRepo;
    private final GradeFuelRateRepository gradeFuelRepo;
    private final IndustryRepository industryRepo;
    private final PrincipalRepository principalRepo;
    private final EmployeeRepository empRepo;
    private final CustomerRepository custRepo;
    private final ContactRepository contactRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            if (deptRepo.count() == 0) {
                log.info("Seeding Initial Department records...");
                deptRepo.saveAll(List.of(
                        Department.builder().code("DEPT-SALES").name("Sales").build(),
                        Department.builder().code("DEPT-SERVICE").name("Service").build(),
                        Department.builder().code("DEPT-MGMT").name("Management").build()
                ));
            }

            if (desgRepo.count() == 0) {
                log.info("Seeding Initial Designation records...");
                desgRepo.saveAll(List.of(
                        Designation.builder().code("DESG-SE").title("Sales Executive").build(),
                        Designation.builder().code("DESG-SENG").title("Service Engineer").build(),
                        Designation.builder().code("DESG-BM").title("Branch Manager").build(),
                        Designation.builder().code("DESG-ADMIN").title("System Administrator").build()
                ));
            }

            if (branchRepo.count() == 0) {
                log.info("Seeding Initial Branch records...");
                branchRepo.saveAll(List.of(
                        Branch.builder().code("BR-MUMBAI").name("Mumbai HQ").city("Mumbai").isActive(true).build(),
                        Branch.builder().code("BR-BARODA").name("Baroda Branch").city("Vadodara").isActive(true).build(),
                        Branch.builder().code("BR-AHMEDABAD").name("Ahmedabad Branch").city("Ahmedabad").isActive(true).build(),
                        Branch.builder().code("BR-PUNE").name("Pune Industrial Area").city("Pune").isActive(true).build(),
                        Branch.builder().code("BR-NASHIK").name("Nashik Hub").city("Nashik").isActive(true).build()
                ));
            }

            if (principalRepo.count() == 0) {
                log.info("Seeding Initial Principal records...");
                principalRepo.saveAll(List.of(
                        Principal.builder().code("PRIN-TRUMPF").name("Trumpf").country("Germany").contactPerson("Hans Mueller").contactEmail("hans.m@trumpf.example.com").contactPhone("+49 7156 3030").description("Global leader in industrial machine tools, laser technology, and electronics.").isActive(true).build(),
                        Principal.builder().code("PRIN-MAZAK").name("Mazak").country("Japan").contactPerson("Kenji Sato").contactEmail("ksato@mazak.example.com").contactPhone("+81 587 95 5511").description("World-class advanced multi-tasking CNC lathes and fiber laser cutting machines.").isActive(true).build(),
                        Principal.builder().code("PRIN-AMADA").name("Amada").country("Japan").contactPerson("Hiroshi Tanaka").contactEmail("htanaka@amada.example.com").contactPhone("+81 463 96 1111").description("Comprehensive manufacturer of metal working machinery and sheet metal press brakes.").isActive(true).build(),
                        Principal.builder().code("PRIN-HAAS").name("Haas Automation").country("United States").contactPerson("Robert Miller").contactEmail("rmiller@haascnc.example.com").contactPhone("+1 805 278 1800").description("Largest machine tool builder in the western world, specializing in CNC VMCs, HMCs, and lathes.").isActive(true).build(),
                        Principal.builder().code("PRIN-DMGMORI").name("DMG Mori").country("Germany / Japan").contactPerson("Stefan Weber").contactEmail("sweber@dmgmori.example.com").contactPhone("+49 5205 74 0").description("Pioneer in cutting-edge 5-axis simultaneous machining and additive manufacturing.").isActive(true).build(),
                        Principal.builder().code("PRIN-FANUC").name("Fanuc").country("Japan").contactPerson("Takashi Watanabe").contactEmail("twatanabe@fanuc.example.com").contactPhone("+81 555 84 5555").description("Pioneering CNC controls, industrial robotics, and factory automation systems.").isActive(true).build(),
                        Principal.builder().code("PRIN-SIEMENS").name("Siemens").country("Germany").contactPerson("Markus Schmidt").contactEmail("m.schmidt@siemens.example.com").contactPhone("+49 89 636 00").description("Industrial automation, motion control drives, safety curtains, and CNC controllers.").isActive(true).build(),
                        Principal.builder().code("PRIN-MITSUBISHI").name("Mitsubishi Electric").country("Japan").contactPerson("Daisuke Yamada").contactEmail("dyamada@mitsubishi.example.com").contactPhone("+81 3 3218 2111").description("Electrical equipment and advanced industrial EDM wire and die-sinker machinery.").isActive(true).build(),
                        Principal.builder().code("PRIN-GEN").name("General Machinery").country("India").contactPerson("Suresh Patel").contactEmail("spatel@generalmachinery.example.com").contactPhone("+91 22 2580 1234").description("Domestic general industrial machinery, standard tooling, and fabrication hardware.").isActive(true).build()
                ));
            }

            if (productRepo.count() == 0) {
                log.info("Seeding Initial Product records...");
                productRepo.saveAll(List.of(
                        Product.builder().code("PRD-CNC-PRESS").name("Hydraulic Press Brake 100T").description("High precision 100 Ton CNC hydraulic sheet metal press brake").category("Machinery").principal("Trumpf").unitPrice(new BigDecimal("3500000.00")).role("SALES_EXEC").isActive(true).build(),
                        Product.builder().code("PRD-FIBER-LASER").name("CNC Fiber Laser 3kW").description("3000W high-speed metal sheet fiber laser cutting machine").category("Machinery").principal("Mazak").unitPrice(new BigDecimal("5800000.00")).role("SALES_EXEC").isActive(true).build(),
                        Product.builder().code("PRD-TURRET-PUNCH").name("CNC Turret Punch Press").description("Servo-electric high-capacity punch press for industrial stamping").category("Machinery").principal("Amada").unitPrice(new BigDecimal("4200000.00")).role("SALES_EXEC").isActive(true).build(),
                        Product.builder().code("PRD-SHEAR-6MM").name("Hydraulic Shearing 6mm").description("Heavy-duty 6mm thickness mechanical and hydraulic guillotine shear").category("Machinery").principal("Haas Automation").unitPrice(new BigDecimal("1800000.00")).role("SALES_EXEC").isActive(true).build(),
                        Product.builder().code("PRD-LASER-TUBE").name("CNC Laser Tube Cutting 2kW").description("Precision chuck automated rotary metal tube & pipe laser cutting").category("Machinery").principal("DMG Mori").unitPrice(new BigDecimal("6500000.00")).role("SALES_EXEC").isActive(true).build(),
                        Product.builder().code("PRD-ROBOT-WELD").name("Robotic Welding Cell 6-Axis").description("Integrated industrial 6-axis robotic GMAW/TIG welding workstation").category("Automation").principal("Fanuc").unitPrice(new BigDecimal("2800000.00")).role("SALES_EXEC").isActive(true).build(),
                        Product.builder().code("PRD-OPTICS-KIT").name("Fiber Laser Optics & Ceramic Ring Kit").description("High durability optical lenses, protective windows & ceramic nozzles").category("Spare Parts").principal("Mazak").unitPrice(new BigDecimal("45000.00")).role("SERVICE_ENG").isActive(true).build(),
                        Product.builder().code("PRD-HYD-SEAL").name("High-Pressure Hydraulic Seal & Valve Kit").description("Complete gasket and O-ring overhaul set for hydraulic press cylinders").category("Spare Parts").principal("Trumpf").unitPrice(new BigDecimal("28000.00")).role("SERVICE_ENG").isActive(true).build(),
                        Product.builder().code("PRD-BLADE-SET").name("Hardened Shear Blade Replacement Set 6mm").description("Precision ground D2 tool steel guillotine cutting shear blades").category("Tooling").principal("Haas Automation").unitPrice(new BigDecimal("75000.00")).role("SERVICE_ENG").isActive(true).build(),
                        Product.builder().code("PRD-SERVO-FANUC").name("Fanuc AC Servo Motor & Drive Module").description("Alpha i Series high torque servo feed drive and feedback encoder").category("Electronics").principal("Fanuc").unitPrice(new BigDecimal("120000.00")).role("SERVICE_ENG").isActive(true).build(),
                        Product.builder().code("PRD-AMC-ANNUAL").name("Annual Maintenance Contract (AMC)").description("Comprehensive annual scheduled preventive maintenance & calibration").category("Services").principal("Siemens").unitPrice(new BigDecimal("150000.00")).role("SERVICE_ENG").isActive(true).build(),
                        Product.builder().code("PRD-SAFETY-LIGHT").name("Safety Light Curtain & Interlock Sensor").description("Type 4 infrared optical safety guard barrier with muting controller").category("Accessories").principal("Siemens").unitPrice(new BigDecimal("35000.00")).role("ALL").isActive(true).build()
                ));
            } else {
                // Ensure existing products have assigned roles, principals, and prices if null
                List<Product> existingProducts = productRepo.findAll();
                boolean updated = false;
                for (Product p : existingProducts) {
                    if (p.getRole() == null || p.getRole().isEmpty()) {
                        p.setRole("SALES_EXEC");
                        updated = true;
                    }
                    if (p.getPrincipal() == null || p.getPrincipal().isEmpty()) {
                        if (p.getCode().contains("PRESS")) { p.setPrincipal("Trumpf"); p.setUnitPrice(new BigDecimal("3500000.00")); }
                        else if (p.getCode().contains("FIBER")) { p.setPrincipal("Mazak"); p.setUnitPrice(new BigDecimal("5800000.00")); }
                        else if (p.getCode().contains("TURRET")) { p.setPrincipal("Amada"); p.setUnitPrice(new BigDecimal("4200000.00")); }
                        else if (p.getCode().contains("SHEAR")) { p.setPrincipal("Haas Automation"); p.setUnitPrice(new BigDecimal("1800000.00")); }
                        else if (p.getCode().contains("TUBE")) { p.setPrincipal("DMG Mori"); p.setUnitPrice(new BigDecimal("6500000.00")); }
                        else if (p.getCode().contains("ROBOT")) { p.setPrincipal("Fanuc"); p.setUnitPrice(new BigDecimal("2800000.00")); }
                        else { p.setPrincipal("General Machinery"); p.setUnitPrice(new BigDecimal("500000.00")); }
                        updated = true;
                    }
                }
                if (updated) {
                    productRepo.saveAll(existingProducts);
                }

                // Also ensure service spares exist if missing
                if (productRepo.findByCode("PRD-OPTICS-KIT").isEmpty()) {
                    productRepo.save(Product.builder().code("PRD-OPTICS-KIT").name("Fiber Laser Optics & Ceramic Ring Kit").description("High durability optical lenses, protective windows & ceramic nozzles").category("Spare Parts").principal("Mazak").unitPrice(new BigDecimal("45000.00")).role("SERVICE_ENG").isActive(true).build());
                }
                if (productRepo.findByCode("PRD-HYD-SEAL").isEmpty()) {
                    productRepo.save(Product.builder().code("PRD-HYD-SEAL").name("High-Pressure Hydraulic Seal & Valve Kit").description("Complete gasket and O-ring overhaul set for hydraulic press cylinders").category("Spare Parts").principal("Trumpf").unitPrice(new BigDecimal("28000.00")).role("SERVICE_ENG").isActive(true).build());
                }
                if (productRepo.findByCode("PRD-SERVO-FANUC").isEmpty()) {
                    productRepo.save(Product.builder().code("PRD-SERVO-FANUC").name("Fanuc AC Servo Motor & Drive Module").description("Alpha i Series high torque servo feed drive and feedback encoder").category("Electronics").principal("Fanuc").unitPrice(new BigDecimal("120000.00")).role("SERVICE_ENG").isActive(true).build());
                }
                if (productRepo.findByCode("PRD-SAFETY-LIGHT").isEmpty()) {
                    productRepo.save(Product.builder().code("PRD-SAFETY-LIGHT").name("Safety Light Curtain & Interlock Sensor").description("Type 4 infrared optical safety guard barrier with muting controller").category("Accessories").principal("Siemens").unitPrice(new BigDecimal("35000.00")).role("ALL").isActive(true).build());
                }
            }

            if (actRepo.count() == 0) {
                log.info("Seeding Initial Activity Types...");
                actRepo.saveAll(List.of(
                        ActivityType.builder().code("ACT-SALES").name("Sales Pitch / Discovery").description("Initial client meeting and presentation").role("SALES_EXEC").build(),
                        ActivityType.builder().code("ACT-DEMO").name("Product Live Demonstration").description("Live cutting/bending demo").role("SALES_EXEC").build(),
                        ActivityType.builder().code("ACT-FOLLOWUP").name("Payment & Proposal Follow-up").description("Commercial discussions").role("SALES_EXEC").build(),
                        ActivityType.builder().code("ACT-COMMERCIAL").name("Commercial Negotiation & Closing").description("Final discount and terms discussion").role("SALES_EXEC").build(),
                        ActivityType.builder().code("ACT-INSTALL").name("Machine Commissioning & Installation").description("On-site machinery erection and wiring").role("SERVICE_ENG").build(),
                        ActivityType.builder().code("ACT-AMC").name("Routine Maintenance / AMC").description("Preventive maintenance visit").role("SERVICE_ENG").build(),
                        ActivityType.builder().code("ACT-BREAKDOWN").name("Emergency Breakdown Service").description("Urgent service call").role("SERVICE_ENG").build(),
                        ActivityType.builder().code("ACT-TRAINING").name("Customer Operator Training").description("Operating and safety training").role("SERVICE_ENG").build(),
                        ActivityType.builder().code("ACT-COURTESY").name("Customer Courtesy / Relationship").description("General relationship visit").role("ALL").build()
                ));
            } else {
                List<ActivityType> existingActs = actRepo.findAll();
                boolean actUpdated = false;
                for (ActivityType a : existingActs) {
                    if (a.getRole() == null || a.getRole().isEmpty()) {
                        if (a.getCode().contains("SALES") || a.getCode().contains("DEMO") || a.getCode().contains("FOLLOWUP") || a.getCode().contains("COMMERCIAL")) {
                            a.setRole("SALES_EXEC");
                        } else if (a.getCode().contains("INSTALL") || a.getCode().contains("AMC") || a.getCode().contains("BREAKDOWN") || a.getCode().contains("TRAINING")) {
                            a.setRole("SERVICE_ENG");
                        } else {
                            a.setRole("ALL");
                        }
                        actUpdated = true;
                    }
                }
                if (actUpdated) {
                    actRepo.saveAll(existingActs);
                }
                // Check if any missing activity types need adding
                if (actRepo.findByCode("ACT-COMMERCIAL").isEmpty()) {
                    actRepo.save(ActivityType.builder().code("ACT-COMMERCIAL").name("Commercial Negotiation & Closing").description("Final discount and terms discussion").role("SALES_EXEC").build());
                }
                if (actRepo.findByCode("ACT-TRAINING").isEmpty()) {
                    actRepo.save(ActivityType.builder().code("ACT-TRAINING").name("Customer Operator Training").description("Operating and safety training").role("SERVICE_ENG").build());
                }
                if (actRepo.findByCode("ACT-COURTESY").isEmpty()) {
                    actRepo.save(ActivityType.builder().code("ACT-COURTESY").name("Customer Courtesy / Relationship").description("General relationship visit").role("ALL").build());
                }
            }

            if (expHeadRepo.count() == 0) {
                log.info("Seeding Initial Expense Heads...");
                expHeadRepo.saveAll(List.of(
                        ExpenseHead.builder().code("EXP-FUEL").name("Fuel Allowance (Per KM)").requiresKm(true).defaultRate(new BigDecimal("11.50")).isActive(true).build(),
                        ExpenseHead.builder().code("EXP-HOTEL").name("Hotel / Lodging Expense").requiresAttachment(true).defaultRate(BigDecimal.ZERO).isActive(true).build(),
                        ExpenseHead.builder().code("EXP-FOOD").name("Daily Food / Meal Allowance").requiresAttachment(true).defaultRate(BigDecimal.ZERO).isActive(true).build(),
                        ExpenseHead.builder().code("EXP-TOLL").name("Highway Toll & Parking").requiresAttachment(true).defaultRate(BigDecimal.ZERO).isActive(true).build(),
                        ExpenseHead.builder().code("EXP-CLIENT-ENT").name("Client Entertainment / Refreshments").requiresAttachment(true).defaultRate(BigDecimal.ZERO).isActive(true).build(),
                        ExpenseHead.builder().code("EXP-PUBLIC-TRANS").name("Public Transit (Cab/Bus/Train)").requiresAttachment(true).defaultRate(BigDecimal.ZERO).isActive(true).build(),
                        ExpenseHead.builder().code("EXP-MISC").name("Miscellaneous Contingency").requiresAttachment(false).defaultRate(BigDecimal.ZERO).isActive(true).build()
                ));
            }

            if (gradeFuelRepo.count() == 0) {
                log.info("Seeding Initial Grade Fuel Rates...");
                gradeFuelRepo.saveAll(List.of(
                        GradeFuelRate.builder().gradeCode("GRADE_A").gradeName("Grade A (Senior Mgmt / SUV)").fuelRate(new BigDecimal("14.00")).isActive(true).build(),
                        GradeFuelRate.builder().gradeCode("GRADE_B").gradeName("Grade B (Mid Executive / Sedan)").fuelRate(new BigDecimal("11.50")).isActive(true).build(),
                        GradeFuelRate.builder().gradeCode("GRADE_C").gradeName("Grade C (Junior Field / Hatchback)").fuelRate(new BigDecimal("9.00")).isActive(true).build(),
                        GradeFuelRate.builder().gradeCode("GRADE_D").gradeName("Grade D (Bike / Two-Wheeler)").fuelRate(new BigDecimal("6.50")).isActive(true).build()
                ));
            }

            if (industryRepo.count() == 0) {
                log.info("Seeding Initial Industries...");
                industryRepo.saveAll(List.of(
                        Industry.builder().code("IND-AUTO").name("Automobile & Auto Components").isActive(true).build(),
                        Industry.builder().code("IND-ENG").name("General Engineering & Machining").isActive(true).build(),
                        Industry.builder().code("IND-MACH").name("Industrial Machinery & Equipment").isActive(true).build(),
                        Industry.builder().code("IND-AERO").name("Aerospace & Defense").isActive(true).build(),
                        Industry.builder().code("IND-ELEC").name("Consumer Durables & Electronics").isActive(true).build(),
                        Industry.builder().code("IND-CHEM").name("Petrochemicals & Process Industry").isActive(true).build(),
                        Industry.builder().code("IND-MOLD").name("Die & Mold Manufacturing").isActive(true).build(),
                        Industry.builder().code("IND-STEEL").name("Steel & Metals Fabrication").isActive(true).build(),
                        Industry.builder().code("IND-FOOD").name("Food Processing & Packaging").isActive(true).build()
                ));
            }

            // Always ensure core admin, demo users, and Microsoft owner accounts exist and have Password@123
            String hash = passwordEncoder.encode("Password@123");
            Department deptSales = deptRepo.findByCode("DEPT-SALES").orElse(null);
            Department deptService = deptRepo.findByCode("DEPT-SERVICE").orElse(null);
            Department deptMgmt = deptRepo.findByCode("DEPT-MGMT").orElse(null);

            Designation desgSE = desgRepo.findByCode("DESG-SE").orElse(null);
            Designation desgSENG = desgRepo.findByCode("DESG-SENG").orElse(null);
            Designation desgBM = desgRepo.findByCode("DESG-BM").orElse(null);
            Designation desgAdmin = desgRepo.findByCode("DESG-ADMIN").orElse(null);

            Branch brMumbai = branchRepo.findByCode("BR-MUMBAI").orElse(null);
            Branch brBaroda = branchRepo.findByCode("BR-BARODA").orElse(null);

            // 1. System Administrator (admin@crm.com)
            Optional<Employee> adminOpt = empRepo.findByEmail("admin@crm.com");
            if (adminOpt.isEmpty()) {
                empRepo.save(Employee.builder()
                        .employeeNo("1000")
                        .name("System Administrator")
                        .gender("Male")
                        .dob(LocalDate.of(1985, 1, 1))
                        .departmentId(deptMgmt != null ? deptMgmt.getId() : 1)
                        .designationId(desgAdmin != null ? desgAdmin.getId() : 1)
                        .branchId(brMumbai != null ? brMumbai.getId() : 1)
                        .joiningDate(LocalDate.of(2020, 1, 1))
                        .status("Active")
                        .mobileNo("9999999999")
                        .email("admin@crm.com")
                        .passwordHash(hash)
                        .role("ADMIN")
                        .grade("GRADE_A")
                        .isLocked(false)
                        .isPasswordSet(true)
                        .failedLoginAttempts(0)
                        .build());
            } else {
                Employee admin = adminOpt.get();
                admin.setPasswordHash(hash);
                admin.setStatus("Active");
                admin.setRole("ADMIN");
                admin.setIsLocked(false);
                admin.setIsPasswordSet(true);
                admin.setFailedLoginAttempts(0);
                empRepo.save(admin);
            }

            // 2. Microsoft Entra ID Owner Account (iqratech7@gmail.com)
            Optional<Employee> iqraOpt = empRepo.findByEmail("iqratech7@gmail.com");
            if (iqraOpt.isEmpty()) {
                empRepo.save(Employee.builder()
                        .employeeNo("1099")
                        .name("Iqra Tech Admin")
                        .gender("Female")
                        .dob(LocalDate.of(1990, 1, 1))
                        .departmentId(deptMgmt != null ? deptMgmt.getId() : 1)
                        .designationId(desgAdmin != null ? desgAdmin.getId() : 1)
                        .branchId(brMumbai != null ? brMumbai.getId() : 1)
                        .joiningDate(LocalDate.of(2020, 1, 1))
                        .status("Active")
                        .mobileNo("9999999998")
                        .email("iqratech7@gmail.com")
                        .passwordHash(hash)
                        .role("ADMIN")
                        .grade("GRADE_A")
                        .isLocked(false)
                        .isPasswordSet(true)
                        .failedLoginAttempts(0)
                        .build());
            } else {
                Employee iqra = iqraOpt.get();
                iqra.setPasswordHash(hash);
                iqra.setStatus("Active");
                iqra.setRole("ADMIN");
                iqra.setIsLocked(false);
                iqra.setIsPasswordSet(true);
                iqra.setFailedLoginAttempts(0);
                empRepo.save(iqra);
            }

            // 3. Service Engineer (suresh@crm.com)
            Optional<Employee> sureshOpt = empRepo.findByEmail("suresh@crm.com");
            if (sureshOpt.isEmpty()) {
                empRepo.save(Employee.builder()
                        .employeeNo("1001")
                        .name("Suresh Choudhary")
                        .gender("Male")
                        .dob(LocalDate.of(1989, 4, 15))
                        .departmentId(deptService != null ? deptService.getId() : 2)
                        .designationId(desgSENG != null ? desgSENG.getId() : 2)
                        .branchId(brMumbai != null ? brMumbai.getId() : 1)
                        .joiningDate(LocalDate.of(2022, 1, 10))
                        .status("Active")
                        .mobileNo("9317654322")
                        .email("suresh@crm.com")
                        .passwordHash(hash)
                        .role("SERVICE_ENG")
                        .grade("GRADE_B")
                        .isLocked(false)
                        .isPasswordSet(true)
                        .failedLoginAttempts(0)
                        .build());
            } else {
                Employee s = sureshOpt.get();
                s.setPasswordHash(hash);
                s.setStatus("Active");
                s.setIsLocked(false);
                s.setIsPasswordSet(true);
                s.setFailedLoginAttempts(0);
                empRepo.save(s);
            }

            // 4. Sales Executive (shiva@crm.com & amit@crm.com)
            List<Map<String, String>> salesList = List.of(
                    Map.of("email", "shiva@crm.com", "name", "Shiva Sharma", "empNo", "1002"),
                    Map.of("email", "amit@crm.com", "name", "Amit Sharma", "empNo", "1004")
            );
            for (Map<String, String> salesData : salesList) {
                String salesEmail = salesData.get("email");
                Optional<Employee> salesOpt = empRepo.findByEmail(salesEmail);
                if (salesOpt.isEmpty()) {
                    empRepo.save(Employee.builder()
                            .employeeNo(salesData.get("empNo"))
                            .name(salesData.get("name"))
                            .gender("Male")
                            .dob(LocalDate.of(1992, 8, 22))
                            .departmentId(deptSales != null ? deptSales.getId() : 1)
                            .designationId(desgSE != null ? desgSE.getId() : 1)
                            .branchId(brBaroda != null ? brBaroda.getId() : 2)
                            .joiningDate(LocalDate.of(2021, 3, 15))
                            .status("Active")
                            .mobileNo("9823456711")
                            .email(salesEmail)
                            .passwordHash(hash)
                            .role("SALES_EXEC")
                            .grade("GRADE_B")
                            .isLocked(false)
                            .isPasswordSet(true)
                            .failedLoginAttempts(0)
                            .build());
                } else {
                    Employee a = salesOpt.get();
                    a.setPasswordHash(hash);
                    a.setStatus("Active");
                    a.setIsLocked(false);
                    a.setIsPasswordSet(true);
                    a.setFailedLoginAttempts(0);
                    empRepo.save(a);
                }
            }

            // 5. Branch Manager (manager.mumbai@crm.com & rajesh@crm.com)
            List<Map<String, String>> mgrList = List.of(
                    Map.of("email", "manager.mumbai@crm.com", "name", "Rajesh Patel", "empNo", "1003"),
                    Map.of("email", "rajesh@crm.com", "name", "Rajesh Patel", "empNo", "1005")
            );
            for (Map<String, String> mgrData : mgrList) {
                String mgrEmail = mgrData.get("email");
                Optional<Employee> mgrOpt = empRepo.findByEmail(mgrEmail);
                if (mgrOpt.isEmpty()) {
                    empRepo.save(Employee.builder()
                            .employeeNo(mgrData.get("empNo"))
                            .name(mgrData.get("name"))
                            .gender("Male")
                            .dob(LocalDate.of(1982, 11, 5))
                            .departmentId(deptMgmt != null ? deptMgmt.getId() : 1)
                            .designationId(desgBM != null ? desgBM.getId() : 3)
                            .branchId(brMumbai != null ? brMumbai.getId() : 1)
                            .joiningDate(LocalDate.of(2018, 6, 1))
                            .status("Active")
                            .mobileNo("9712345678")
                            .email(mgrEmail)
                            .passwordHash(hash)
                            .role("MANAGER")
                            .grade("GRADE_A")
                            .isLocked(false)
                            .isPasswordSet(true)
                            .failedLoginAttempts(0)
                            .build());
                } else {
                    Employee r = mgrOpt.get();
                    r.setPasswordHash(hash);
                    r.setStatus("Active");
                    r.setIsLocked(false);
                    r.setIsPasswordSet(true);
                    r.setFailedLoginAttempts(0);
                    empRepo.save(r);
                }
            }

            // Seed additional multi-role employees for comprehensive user role testing
            if (empRepo.findByEmail("priya@crm.com").isEmpty()) {
                log.info("Seeding extended multi-role employee testing dataset...");
                Branch brAhmedabad = branchRepo.findByCode("BR-AHMEDABAD").orElse(null);
                Branch brPune = branchRepo.findByCode("BR-PUNE").orElse(null);
                Branch brNashik = branchRepo.findByCode("BR-NASHIK").orElse(null);

                List<Employee> extraEmployees = List.of(
                        // Additional Sales Executives
                        Employee.builder()
                                .employeeNo("1004")
                                .name("Priya Verma")
                                .gender("Female")
                                .dob(LocalDate.of(1994, 7, 12))
                                .departmentId(deptSales != null ? deptSales.getId() : 1)
                                .designationId(desgSE != null ? desgSE.getId() : 1)
                                .branchId(brAhmedabad != null ? brAhmedabad.getId() : 3)
                                .joiningDate(LocalDate.of(2022, 5, 1))
                                .status("Active")
                                .mobileNo("9876543210")
                                .email("priya@crm.com")
                                .passwordHash(hash)
                                .role("SALES_EXEC")
                                .grade("GRADE_B")
                                .build(),
                        Employee.builder()
                                .employeeNo("1005")
                                .name("Vikram Singh")
                                .gender("Male")
                                .dob(LocalDate.of(1991, 3, 20))
                                .departmentId(deptSales != null ? deptSales.getId() : 1)
                                .designationId(desgSE != null ? desgSE.getId() : 1)
                                .branchId(brPune != null ? brPune.getId() : 4)
                                .joiningDate(LocalDate.of(2021, 9, 15))
                                .status("Active")
                                .mobileNo("9876543211")
                                .email("vikram@crm.com")
                                .passwordHash(hash)
                                .role("SALES_EXEC")
                                .grade("GRADE_B")
                                .build(),
                        Employee.builder()
                                .employeeNo("1006")
                                .name("Neha Gupta")
                                .gender("Female")
                                .dob(LocalDate.of(1995, 11, 8))
                                .departmentId(deptSales != null ? deptSales.getId() : 1)
                                .designationId(desgSE != null ? desgSE.getId() : 1)
                                .branchId(brMumbai != null ? brMumbai.getId() : 1)
                                .joiningDate(LocalDate.of(2023, 1, 10))
                                .status("Active")
                                .mobileNo("9876543212")
                                .email("neha@crm.com")
                                .passwordHash(hash)
                                .role("SALES_EXEC")
                                .grade("GRADE_B")
                                .build(),
                        // Additional Service Engineers
                        Employee.builder()
                                .employeeNo("1007")
                                .name("Manoj Tiwari")
                                .gender("Male")
                                .dob(LocalDate.of(1990, 6, 25))
                                .departmentId(deptService != null ? deptService.getId() : 2)
                                .designationId(desgSENG != null ? desgSENG.getId() : 2)
                                .branchId(brBaroda != null ? brBaroda.getId() : 2)
                                .joiningDate(LocalDate.of(2020, 8, 1))
                                .status("Active")
                                .mobileNo("9876543213")
                                .email("manoj@crm.com")
                                .passwordHash(hash)
                                .role("SERVICE_ENG")
                                .grade("GRADE_C")
                                .build(),
                        Employee.builder()
                                .employeeNo("1008")
                                .name("Rahul Desai")
                                .gender("Male")
                                .dob(LocalDate.of(1993, 2, 14))
                                .departmentId(deptService != null ? deptService.getId() : 2)
                                .designationId(desgSENG != null ? desgSENG.getId() : 2)
                                .branchId(brNashik != null ? brNashik.getId() : 5)
                                .joiningDate(LocalDate.of(2022, 2, 15))
                                .status("Active")
                                .mobileNo("9876543214")
                                .email("rahul@crm.com")
                                .passwordHash(hash)
                                .role("SERVICE_ENG")
                                .grade("GRADE_C")
                                .build(),
                        Employee.builder()
                                .employeeNo("1009")
                                .name("Aniket Shinde")
                                .gender("Male")
                                .dob(LocalDate.of(1996, 9, 30))
                                .departmentId(deptService != null ? deptService.getId() : 2)
                                .designationId(desgSENG != null ? desgSENG.getId() : 2)
                                .branchId(brPune != null ? brPune.getId() : 4)
                                .joiningDate(LocalDate.of(2023, 6, 1))
                                .status("Active")
                                .mobileNo("9876543215")
                                .email("aniket@crm.com")
                                .passwordHash(hash)
                                .role("SERVICE_ENG")
                                .grade("GRADE_D")
                                .build(),
                        // Additional Branch Managers
                        Employee.builder()
                                .employeeNo("1010")
                                .name("Kavita Nair")
                                .gender("Female")
                                .dob(LocalDate.of(1984, 5, 18))
                                .departmentId(deptMgmt != null ? deptMgmt.getId() : 3)
                                .designationId(desgBM != null ? desgBM.getId() : 3)
                                .branchId(brBaroda != null ? brBaroda.getId() : 2)
                                .joiningDate(LocalDate.of(2019, 4, 1))
                                .status("Active")
                                .mobileNo("9876543216")
                                .email("kavita@crm.com")
                                .passwordHash(hash)
                                .role("MANAGER")
                                .grade("GRADE_A")
                                .build(),
                        Employee.builder()
                                .employeeNo("1011")
                                .name("Sanjay Mehra")
                                .gender("Male")
                                .dob(LocalDate.of(1983, 10, 10))
                                .departmentId(deptMgmt != null ? deptMgmt.getId() : 3)
                                .designationId(desgBM != null ? desgBM.getId() : 3)
                                .branchId(brAhmedabad != null ? brAhmedabad.getId() : 3)
                                .joiningDate(LocalDate.of(2017, 11, 15))
                                .status("Active")
                                .mobileNo("9876543217")
                                .email("sanjay@crm.com")
                                .passwordHash(hash)
                                .role("MANAGER")
                                .grade("GRADE_A")
                                .build(),
                        // Additional Admin
                        Employee.builder()
                                .employeeNo("1012")
                                .name("Pooja Joshi")
                                .gender("Female")
                                .dob(LocalDate.of(1988, 12, 5))
                                .departmentId(deptMgmt != null ? deptMgmt.getId() : 3)
                                .designationId(desgAdmin != null ? desgAdmin.getId() : 4)
                                .branchId(brMumbai != null ? brMumbai.getId() : 1)
                                .joiningDate(LocalDate.of(2020, 3, 1))
                                .status("Active")
                                .mobileNo("9876543218")
                                .email("pooja@crm.com")
                                .passwordHash(hash)
                                .role("ADMIN")
                                .grade("GRADE_A")
                                .build()
                );
                empRepo.saveAll(extraEmployees);
            }

            if (custRepo.count() == 0) {
                log.info("Seeding Initial Customer records...");
                Customer tata = Customer.builder()
                        .customerCode("CUST-TATA-001")
                        .name("Tata Motors Ltd (Plant 1)")
                        .customerType("Existing Customer")
                        .industry("Automobile & Auto Components")
                        .contactPersonPrimary("Rajendra Deshmukh")
                        .source("Direct Referral")
                        .website("https://tatamotors.com")
                        .status("Active")
                        .remarks("Key automotive facility with active press brakes.")
                        .address("Pimpri Industrial Corridor, MIDC")
                        .city("Pune")
                        .state("Maharashtra")
                        .build();

                Customer savedTata = custRepo.save(tata);

                contactRepo.save(Contact.builder()
                        .customerId(savedTata.getId())
                        .contactName("Rajendra Deshmukh")
                        .designation("General Manager - Plant Maintenance")
                        .mobileNo("9822011223")
                        .email("rajendra.d@tatamotors.example.com")
                        .isPrimary(true)
                        .build());
            }

            log.info("Database seeding check completed.");
        } catch (Exception e) {
            log.error("Error during initial data seeding: {}", e.getMessage());
        }
    }
}
