package com.crm.fieldvisit.repository;

import com.crm.fieldvisit.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Integer> {

    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByEmployeeNo(String employeeNo);

    Optional<Employee> findByAzureAdOid(String azureAdOid);

    @Query("SELECT e FROM Employee e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(:username)) OR LOWER(TRIM(e.employeeNo)) = LOWER(TRIM(:username))")
    Optional<Employee> findByEmailOrEmployeeNo(@Param("username") String username);

    @Query("SELECT e FROM Employee e WHERE " +
           "(:branchId IS NULL OR e.branchId = :branchId) AND " +
           "(:departmentId IS NULL OR e.departmentId = :departmentId) AND " +
           "(:designationId IS NULL OR e.designationId = :designationId) AND " +
           "(:search IS NULL OR LOWER(e.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.employeeNo) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Employee> findAllWithFilters(@Param("branchId") Integer branchId,
                                      @Param("departmentId") Integer departmentId,
                                      @Param("designationId") Integer designationId,
                                      @Param("search") String search);

    long countByStatusIgnoreCase(String status);

    @Query("SELECT e FROM Employee e WHERE e.isLocked = true OR e.lockoutTier >= 1")
    List<Employee> findLockedEmployees();

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.isLocked = true OR e.lockoutTier >= 1")
    long countLockedOrRestricted();
}
