package com.crm.fieldvisit.service;

import com.crm.fieldvisit.common.ResourceNotFoundException;
import com.crm.fieldvisit.dto.CreateEmployeeRequest;
import com.crm.fieldvisit.entity.Employee;
import com.crm.fieldvisit.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<Employee> findAll(Integer branchId, Integer departmentId, Integer designationId, String search) {
        String s = (search != null && !search.isBlank()) ? search.trim() : null;
        return employeeRepository.findAllWithFilters(branchId, departmentId, designationId, s);
    }

    @Transactional(readOnly = true)
    public Employee findOne(Integer id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + id));
    }

    @Transactional
    public Employee create(CreateEmployeeRequest request) {
        String empNo = request.getEmployeeNo();
        if (empNo == null || empNo.isBlank()) {
            long count = employeeRepository.count();
            empNo = String.format("%04d", 1000 + count + 1);
        }

        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank()) 
                ? request.getPassword() 
                : "Password@123";

        Employee employee = Employee.builder()
                .employeeNo(empNo)
                .name(request.getName())
                .gender(request.getGender() != null ? request.getGender() : "Male")
                .dob(request.getDob())
                .departmentId(request.getDepartmentId())
                .designationId(request.getDesignationId())
                .branchId(request.getBranchId())
                .joiningDate(request.getJoiningDate())
                .status(request.getStatus() != null ? request.getStatus() : "Active")
                .mobileNo(request.getMobileNo())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(request.getRole() != null ? request.getRole() : "SERVICE_ENG")
                .grade(request.getGrade() != null ? request.getGrade() : "GRADE_B")
                .is2faEnabled(request.getIs2faEnabled() != null ? request.getIs2faEnabled() : true)
                .isRegionRestricted(request.getIsRegionRestricted() != null ? request.getIsRegionRestricted() : false)
                .allowedRegions(request.getAllowedRegions() != null && !request.getAllowedRegions().isBlank() ? request.getAllowedRegions() : "IN")
                .allowedLatitude(request.getAllowedLatitude())
                .allowedLongitude(request.getAllowedLongitude())
                .allowedRadiusKm(request.getAllowedRadiusKm() != null ? request.getAllowedRadiusKm() : 25.0)
                .createdBy("SYSTEM")
                .updatedBy("SYSTEM")
                .build();

        return employeeRepository.save(employee);
    }

    @Transactional
    public Employee update(Integer id, CreateEmployeeRequest request) {
        Employee emp = findOne(id);

        if (request.getEmployeeNo() != null) emp.setEmployeeNo(request.getEmployeeNo());
        if (request.getName() != null) emp.setName(request.getName());
        if (request.getGender() != null) emp.setGender(request.getGender());
        if (request.getDob() != null) emp.setDob(request.getDob());
        if (request.getDepartmentId() != null) emp.setDepartmentId(request.getDepartmentId());
        if (request.getDesignationId() != null) emp.setDesignationId(request.getDesignationId());
        if (request.getBranchId() != null) emp.setBranchId(request.getBranchId());
        if (request.getJoiningDate() != null) emp.setJoiningDate(request.getJoiningDate());
        if (request.getStatus() != null) emp.setStatus(request.getStatus());
        if (request.getMobileNo() != null) emp.setMobileNo(request.getMobileNo());
        if (request.getEmail() != null) emp.setEmail(request.getEmail());
        if (request.getRole() != null) emp.setRole(request.getRole());
        if (request.getGrade() != null) emp.setGrade(request.getGrade());
        if (request.getIs2faEnabled() != null) emp.setIs2faEnabled(request.getIs2faEnabled());
        if (request.getIsRegionRestricted() != null) emp.setIsRegionRestricted(request.getIsRegionRestricted());
        if (request.getAllowedRegions() != null) emp.setAllowedRegions(request.getAllowedRegions());
        if (request.getAllowedLatitude() != null) emp.setAllowedLatitude(request.getAllowedLatitude());
        if (request.getAllowedLongitude() != null) emp.setAllowedLongitude(request.getAllowedLongitude());
        if (request.getAllowedRadiusKm() != null) emp.setAllowedRadiusKm(request.getAllowedRadiusKm());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            emp.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        return employeeRepository.save(emp);
    }

    @Transactional
    public boolean remove(Integer id) {
        Employee emp = findOne(id);
        emp.setStatus("Inactive");
        employeeRepository.save(emp);
        return true;
    }
}
