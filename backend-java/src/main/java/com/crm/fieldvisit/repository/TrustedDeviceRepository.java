package com.crm.fieldvisit.repository;

import com.crm.fieldvisit.entity.TrustedDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrustedDeviceRepository extends JpaRepository<TrustedDevice, Long> {

    List<TrustedDevice> findByEmployeeId(Integer employeeId);

    Optional<TrustedDevice> findByEmployeeIdAndDeviceFingerprint(Integer employeeId, String deviceFingerprint);

    boolean existsByEmployeeIdAndDeviceFingerprint(Integer employeeId, String deviceFingerprint);

    void deleteByEmployeeIdAndDeviceFingerprint(Integer employeeId, String deviceFingerprint);
}
