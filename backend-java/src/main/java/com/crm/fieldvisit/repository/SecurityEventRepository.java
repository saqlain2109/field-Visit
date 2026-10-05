package com.crm.fieldvisit.repository;

import com.crm.fieldvisit.entity.SecurityEvent;
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
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {

    long countByIsDeletedFalse();

    long countBySeverityAndIsDeletedFalse(String severity);

    long countByEventTypeStartingWithAndIsDeletedFalse(String prefix);

    @Query("SELECT s FROM SecurityEvent s WHERE " +
           "(s.isDeleted = false OR s.isDeleted IS NULL) AND " +
           "(:severity IS NULL OR :severity = 'ALL' OR s.severity = :severity) AND " +
           "(:eventType IS NULL OR :eventType = 'ALL' OR s.eventType = :eventType) AND " +
           "(:search IS NULL OR LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.employeeName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.ipAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.pageUrl) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:startDate IS NULL OR s.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR s.timestamp <= :endDate)")
    Page<SecurityEvent> findAllWithFilters(@Param("severity") String severity,
                                           @Param("eventType") String eventType,
                                           @Param("search") String search,
                                           @Param("startDate") LocalDateTime startDate,
                                           @Param("endDate") LocalDateTime endDate,
                                           Pageable pageable);

    List<SecurityEvent> findTop10ByIsDeletedFalseOrderByIdDesc();

    @Modifying
    @Query("UPDATE SecurityEvent s SET s.isDeleted = true WHERE s.id IN :ids")
    int softDeleteByIds(@Param("ids") List<Long> ids);

    @Modifying
    @Query("UPDATE SecurityEvent s SET s.isDeleted = true WHERE s.isDeleted = false OR s.isDeleted IS NULL")
    int softDeleteAll();
}
