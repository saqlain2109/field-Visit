package com.crm.fieldvisit.repository;

import com.crm.fieldvisit.entity.LoginLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginLogRepository extends JpaRepository<LoginLog, Long> {

    long countByIsDeletedFalse();

    long countByLoginMethodAndIsDeletedFalse(String loginMethod);

    long countByLoginStatusAndIsDeletedFalse(String loginStatus);

    long countByIsActiveSessionAndIsDeletedFalse(Boolean isActiveSession);

    long countByAutoProvisionedAndIsDeletedFalse(Boolean autoProvisioned);

    List<LoginLog> findByEmployeeIdAndIsActiveSessionTrueAndIsDeletedFalse(Integer employeeId);

    List<LoginLog> findBySessionId(String sessionId);

    @Query("SELECT l FROM LoginLog l WHERE " +
           "(l.isDeleted = false OR l.isDeleted IS NULL) AND " +
           "(:employeeId IS NULL OR l.employeeId = :employeeId) AND " +
           "(:loginStatus IS NULL OR :loginStatus = 'ALL' OR l.loginStatus = :loginStatus) AND " +
           "(:loginMethod IS NULL OR :loginMethod = 'ALL' OR l.loginMethod = :loginMethod) AND " +
           "(:ipAddress IS NULL OR l.ipAddress LIKE CONCAT('%', :ipAddress, '%')) AND " +
           "(:search IS NULL OR LOWER(l.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(l.employeeName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(l.ipAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(l.country) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(l.browser) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(l.details) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:startDate IS NULL OR l.loginTimestamp >= :startDate) AND " +
           "(:endDate IS NULL OR l.loginTimestamp <= :endDate)")
    Page<LoginLog> findAllWithFilters(@Param("employeeId") Integer employeeId,
                                      @Param("loginStatus") String loginStatus,
                                      @Param("loginMethod") String loginMethod,
                                      @Param("ipAddress") String ipAddress,
                                      @Param("search") String search,
                                      @Param("startDate") LocalDateTime startDate,
                                      @Param("endDate") LocalDateTime endDate,
                                      Pageable pageable);

    List<LoginLog> findTop5ByLoginStatusAndIsDeletedFalseOrderByIdDesc(String loginStatus);

    @Modifying
    @Query("UPDATE LoginLog l SET l.isDeleted = true WHERE l.id IN :ids")
    int softDeleteByIds(@Param("ids") List<Long> ids);

    @Modifying
    @Query("UPDATE LoginLog l SET l.isDeleted = true WHERE l.isDeleted = false OR l.isDeleted IS NULL")
    int softDeleteAll();
}
