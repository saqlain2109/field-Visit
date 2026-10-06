package com.crm.fieldvisit.service;

import com.crm.fieldvisit.common.ResourceNotFoundException;
import com.crm.fieldvisit.dto.ApprovalActionRequest;
import com.crm.fieldvisit.dto.DailyVisitRequest;
import com.crm.fieldvisit.dto.VisitExpenseRequest;
import com.crm.fieldvisit.entity.Contact;
import com.crm.fieldvisit.entity.Customer;
import com.crm.fieldvisit.entity.DailyVisit;
import com.crm.fieldvisit.entity.Employee;
import com.crm.fieldvisit.entity.ExpenseHead;
import com.crm.fieldvisit.entity.VisitCustomer;
import com.crm.fieldvisit.entity.VisitExpense;
import com.crm.fieldvisit.repository.ContactRepository;
import com.crm.fieldvisit.repository.CustomerRepository;
import com.crm.fieldvisit.repository.DailyVisitRepository;
import com.crm.fieldvisit.repository.EmployeeRepository;
import com.crm.fieldvisit.repository.ExpenseHeadRepository;
import com.crm.fieldvisit.repository.VisitCustomerRepository;
import com.crm.fieldvisit.repository.VisitExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DailyVisitService {

    private final DailyVisitRepository dailyVisitRepository;
    private final VisitExpenseRepository visitExpenseRepository;
    private final VisitCustomerRepository visitCustomerRepository;
    private final EmployeeRepository employeeRepository;
    private final ExpenseHeadRepository expenseHeadRepository;
    private final CustomerRepository customerRepository;
    private final ContactRepository contactRepository;

    @Transactional(readOnly = true)
    public List<DailyVisit> findAll(Integer employeeId, Integer branchId, String status, String startDate, String endDate) {
        LocalDate start = (startDate != null && !startDate.isBlank()) ? LocalDate.parse(startDate.substring(0, 10)) : null;
        LocalDate end = (endDate != null && !endDate.isBlank()) ? LocalDate.parse(endDate.substring(0, 10)) : null;
        String st = (status != null && !status.isBlank()) ? status : null;

        List<DailyVisit> visits = dailyVisitRepository.findAllWithFilters(employeeId, branchId, st, start, end);
        visits.forEach(v -> {
            if (v.getExpenses() != null) {
                v.getExpenses().size();
            }
            if (v.getExtensibleCustomers() != null) {
                v.getExtensibleCustomers().size();
            }
        });
        return visits;
    }

    @Transactional(readOnly = true)
    public DailyVisit findOne(Integer id) {
        DailyVisit v = dailyVisitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Daily visit not found with ID: " + id));
        if (v.getExpenses() != null) {
            v.getExpenses().size();
        }
        if (v.getExtensibleCustomers() != null) {
            v.getExtensibleCustomers().size();
        }
        return v;
    }

    @Transactional
    public DailyVisit create(DailyVisitRequest request, String userEmail) {
        Employee employee = null;
        if (request.getEmployeeId() != null) {
            employee = employeeRepository.findById(request.getEmployeeId()).orElse(null);
        }
        if (employee == null && userEmail != null) {
            employee = employeeRepository.findByEmail(userEmail).orElse(null);
        }
        if (employee == null) {
            throw new IllegalArgumentException("Employee profile not found for visit logging");
        }

        Integer deptId = request.getDepartmentId() != null ? request.getDepartmentId() : employee.getDepartmentId();
        Integer branchId = request.getBranchId() != null ? request.getBranchId() : employee.getBranchId();

        Integer resolvedContactId = request.getContactId();
        if (resolvedContactId != null && (resolvedContactId <= 0 || !contactRepository.existsById(resolvedContactId))) {
            resolvedContactId = (request.getCustomerId() != null)
                    ? contactRepository.findByCustomerId(request.getCustomerId())
                        .stream().findFirst().map(Contact::getId).orElse(null)
                    : null;
        } else if (resolvedContactId == null && request.getCustomerId() != null) {
            resolvedContactId = contactRepository.findByCustomerId(request.getCustomerId())
                    .stream().findFirst().map(Contact::getId).orElse(null);
        }

        DailyVisit visit = DailyVisit.builder()
                .visitDate(request.getVisitDate())
                .employeeId(employee.getId())
                .departmentId(deptId)
                .branchId(branchId)
                .customerId(request.getCustomerId())
                .contactId(resolvedContactId)
                .activityTypeId(request.getActivityTypeId())
                .productId(request.getProductId())
                .placeFrom(request.getPlaceFrom())
                .placeTo(request.getPlaceTo())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .personCount(request.getPersonCount() != null ? request.getPersonCount() : 1)
                .status(request.getStatus() != null ? request.getStatus() : "DRAFT")
                .rejectionReason(request.getRejectionReason())
                .salesReportUrl(request.getSalesReportUrl())
                .salesReportNotes(request.getSalesReportNotes())
                .build();

        // Add Expenses directly to the cascade collection
        if (request.getExpenses() != null && !request.getExpenses().isEmpty()) {
            for (VisitExpenseRequest expReq : request.getExpenses()) {
                ExpenseHead head = expReq.getExpenseHeadId() != null 
                        ? expenseHeadRepository.findById(expReq.getExpenseHeadId()).orElse(null) 
                        : null;
                VisitExpense exp = VisitExpense.builder()
                        .visit(visit)
                        .expenseHeadId(expReq.getExpenseHeadId())
                        .expenseHead(head)
                        .dayStartKm(expReq.getDayStartKm())
                        .dayEndKm(expReq.getDayEndKm())
                        .totalKm(expReq.getTotalKm())
                        .fuelRate(expReq.getFuelRate())
                        .tollTax(expReq.getTollTax())
                        .amount(expReq.getAmount() != null ? expReq.getAmount() : BigDecimal.ZERO)
                        .attachmentUrl(expReq.getAttachmentUrl())
                        .remarks(expReq.getRemarks())
                        .build();
                visit.getExpenses().add(exp);
            }
        }

        // Add Extensible Customers directly to the cascade collection
        if (request.getExtensibleCustomers() != null && !request.getExtensibleCustomers().isEmpty()) {
            for (DailyVisitRequest.VisitCustomerRequest vcReq : request.getExtensibleCustomers()) {
                Customer cust = vcReq.getCustomerId() != null 
                        ? customerRepository.findById(vcReq.getCustomerId()).orElse(null) 
                        : null;
                Integer extContactId = vcReq.getContactId();
                if (extContactId != null && (extContactId <= 0 || !contactRepository.existsById(extContactId))) {
                    extContactId = null;
                }
                VisitCustomer vc = VisitCustomer.builder()
                        .visit(visit)
                        .customerId(vcReq.getCustomerId())
                        .customer(cust)
                        .contactId(extContactId)
                        .sequenceNo(vcReq.getSequenceNo() != null ? vcReq.getSequenceNo() : 1)
                        .build();
                visit.getExtensibleCustomers().add(vc);
            }
        }

        return dailyVisitRepository.save(visit);
    }

    @Transactional
    public DailyVisit update(Integer id, DailyVisitRequest request) {
        DailyVisit visit = findOne(id);

        if (request.getVisitDate() != null) visit.setVisitDate(request.getVisitDate());
        if (request.getCustomerId() != null) visit.setCustomerId(request.getCustomerId());
        
        Integer updateContactId = request.getContactId();
        if (updateContactId != null && (updateContactId <= 0 || !contactRepository.existsById(updateContactId))) {
            updateContactId = (request.getCustomerId() != null)
                    ? contactRepository.findByCustomerId(request.getCustomerId())
                        .stream().findFirst().map(Contact::getId).orElse(null)
                    : null;
        }
        visit.setContactId(updateContactId);

        if (request.getActivityTypeId() != null) visit.setActivityTypeId(request.getActivityTypeId());
        if (request.getProductId() != null) visit.setProductId(request.getProductId());
        if (request.getPlaceFrom() != null) visit.setPlaceFrom(request.getPlaceFrom());
        if (request.getPlaceTo() != null) visit.setPlaceTo(request.getPlaceTo());
        if (request.getStartTime() != null) visit.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) visit.setEndTime(request.getEndTime());
        if (request.getPersonCount() != null) visit.setPersonCount(request.getPersonCount());
        if (request.getStatus() != null) visit.setStatus(request.getStatus());
        if (request.getRejectionReason() != null) visit.setRejectionReason(request.getRejectionReason());
        if (request.getSalesReportUrl() != null) visit.setSalesReportUrl(request.getSalesReportUrl());
        if (request.getSalesReportNotes() != null) visit.setSalesReportNotes(request.getSalesReportNotes());

        // Mutate existing collection in place so Hibernate orphanRemoval is satisfied
        if (request.getExpenses() != null) {
            visit.getExpenses().clear();
            for (VisitExpenseRequest expReq : request.getExpenses()) {
                ExpenseHead head = expReq.getExpenseHeadId() != null 
                        ? expenseHeadRepository.findById(expReq.getExpenseHeadId()).orElse(null) 
                        : null;
                VisitExpense exp = VisitExpense.builder()
                        .visit(visit)
                        .expenseHeadId(expReq.getExpenseHeadId())
                        .expenseHead(head)
                        .dayStartKm(expReq.getDayStartKm())
                        .dayEndKm(expReq.getDayEndKm())
                        .totalKm(expReq.getTotalKm())
                        .fuelRate(expReq.getFuelRate())
                        .tollTax(expReq.getTollTax())
                        .amount(expReq.getAmount() != null ? expReq.getAmount() : BigDecimal.ZERO)
                        .attachmentUrl(expReq.getAttachmentUrl())
                        .remarks(expReq.getRemarks())
                        .build();
                visit.getExpenses().add(exp);
            }
        }

        // Mutate existing extensible customers collection in place
        if (request.getExtensibleCustomers() != null) {
            visit.getExtensibleCustomers().clear();
            for (DailyVisitRequest.VisitCustomerRequest vcReq : request.getExtensibleCustomers()) {
                Customer cust = vcReq.getCustomerId() != null 
                        ? customerRepository.findById(vcReq.getCustomerId()).orElse(null) 
                        : null;
                Integer extContactId = vcReq.getContactId();
                if (extContactId != null && (extContactId <= 0 || !contactRepository.existsById(extContactId))) {
                    extContactId = null;
                }
                VisitCustomer vc = VisitCustomer.builder()
                        .visit(visit)
                        .customerId(vcReq.getCustomerId())
                        .customer(cust)
                        .contactId(extContactId)
                        .sequenceNo(vcReq.getSequenceNo() != null ? vcReq.getSequenceNo() : 1)
                        .build();
                visit.getExtensibleCustomers().add(vc);
            }
        }

        return dailyVisitRepository.save(visit);
    }

    @Transactional
    public boolean delete(Integer id) {
        DailyVisit visit = findOne(id);
        dailyVisitRepository.delete(visit);
        return true;
    }

    @Transactional
    public DailyVisit submit(Integer id) {
        DailyVisit visit = findOne(id);
        visit.setStatus("SUBMITTED");
        return dailyVisitRepository.save(visit);
    }

    @Transactional
    public DailyVisit approve(Integer id, Integer approverId) {
        DailyVisit visit = findOne(id);
        visit.setStatus("APPROVED");
        visit.setApprovedBy(approverId);
        if (approverId != null) {
            visit.setApprover(employeeRepository.findById(approverId).orElse(null));
        }
        visit.setApprovedAt(LocalDateTime.now());
        visit.setRejectionReason(null);
        return dailyVisitRepository.save(visit);
    }

    @Transactional
    public DailyVisit reject(Integer id, Integer approverId, ApprovalActionRequest dto) {
        DailyVisit visit = findOne(id);
        visit.setStatus("REJECTED");
        visit.setApprovedBy(approverId);
        if (approverId != null) {
            visit.setApprover(employeeRepository.findById(approverId).orElse(null));
        }
        visit.setApprovedAt(LocalDateTime.now());
        String reason = dto.getReason() != null ? dto.getReason() : dto.getRemarks();
        visit.setRejectionReason(reason);
        return dailyVisitRepository.save(visit);
    }

    @Transactional
    public List<DailyVisit> massApprove(List<Integer> ids, Integer approverId) {
        List<DailyVisit> approved = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        Employee approver = approverId != null ? employeeRepository.findById(approverId).orElse(null) : null;
        for (Integer id : ids) {
            DailyVisit visit = dailyVisitRepository.findById(id).orElse(null);
            if (visit != null) {
                visit.setStatus("APPROVED");
                visit.setApprovedBy(approverId);
                visit.setApprover(approver);
                visit.setApprovedAt(now);
                visit.setRejectionReason(null);
                approved.add(dailyVisitRepository.save(visit));
            }
        }
        return approved;
    }
}
