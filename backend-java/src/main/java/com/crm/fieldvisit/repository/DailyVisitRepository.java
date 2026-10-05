package com.crm.fieldvisit.repository;

import com.crm.fieldvisit.entity.DailyVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyVisitRepository extends JpaRepository<DailyVisit, Integer> {

    @Query("SELECT v FROM DailyVisit v WHERE " +
           "(:employeeId IS NULL OR v.employeeId = :employeeId) AND " +
           "(:branchId IS NULL OR v.branchId = :branchId) AND " +
           "(:status IS NULL OR v.status = :status) AND " +
           "(:startDate IS NULL OR v.visitDate >= :startDate) AND " +
           "(:endDate IS NULL OR v.visitDate <= :endDate) " +
           "ORDER BY v.visitDate DESC, v.id DESC")
    List<DailyVisit> findAllWithFilters(@Param("employeeId") Integer employeeId,
                                        @Param("branchId") Integer branchId,
                                        @Param("status") String status,
                                        @Param("startDate") LocalDate startDate,
                                        @Param("endDate") LocalDate endDate);

    @Query("SELECT v FROM DailyVisit v WHERE " +
           "(:employeeId IS NULL OR v.employeeId = :employeeId) AND " +
           "(:customerId IS NULL OR v.customerId = :customerId) AND " +
           "v.visitDate >= :startDate AND v.visitDate <= :endDate " +
           "ORDER BY v.visitDate ASC")
    List<DailyVisit> findVisitsForReport(@Param("employeeId") Integer employeeId,
                                         @Param("customerId") Integer customerId,
                                         @Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate);

    long countByEmployeeId(Integer employeeId);

    long countByStatusIn(List<String> statuses);

    long countByEmployeeIdAndStatusIn(Integer employeeId, List<String> statuses);
}
